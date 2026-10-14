/**
 * Writes public/sitemap.xml and public/robots.txt before every build (npm "prebuild").
 *
 * Static pages are listed here; published services and blog articles are read from Firestore through
 * its public REST API (the same published-only access the website has). If Firestore cannot be
 * reached, the build continues with the static pages and the previous dynamic entries are lost
 * until the next successful build, so a warning is printed.
 *
 *   VITE_SITE_URL  production address (default https://www.nawaayurveda.ae)
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SITE = (process.env.VITE_SITE_URL || 'https://www.nawaayurveda.ae').replace(/\/+$/, '')
const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || 'nawaayurveda-9b51e'
const API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDP34iqGHU5RRFYpHyAA2EO_u7UtfGNXmY'
const publicDir = fileURLToPath(new URL('../public/', import.meta.url))

const STATIC_PAGES = [
  ['/', 'weekly', '1.0'],
  ['/about', 'monthly', '0.8'],
  ['/services', 'monthly', '0.9'],
  ['/programs', 'monthly', '0.7'],
  ['/blog', 'weekly', '0.8'],
  ['/appointment', 'yearly', '0.9'],
  ['/contact', 'yearly', '0.7'],
  ['/privacy-policy', 'yearly', '0.2'],
]

/** Published docs of a collection: [{ slug, updated }]. */
async function published(collectionId) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } },
        select: { fields: [{ fieldPath: 'slug' }, { fieldPath: 'updatedAt' }] },
      },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`${collectionId}: HTTP ${res.status}`)
  return (await res.json())
    .filter((r) => r.document)
    .map(({ document: d }) => ({ slug: d.fields?.slug?.stringValue, updated: d.fields?.updatedAt?.timestampValue }))
    .filter((d) => d.slug)
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const entry = (path, { changefreq, priority, lastmod } = {}) =>
  [
    '  <url>',
    `    <loc>${escape(SITE + path)}</loc>`,
    lastmod && `    <lastmod>${lastmod.slice(0, 10)}</lastmod>`,
    changefreq && `    <changefreq>${changefreq}</changefreq>`,
    priority && `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')

const urls = STATIC_PAGES.map(([path, changefreq, priority]) => entry(path, { changefreq, priority }))
try {
  const [services, blogs] = await Promise.all([published('services'), published('blogs')])
  services.forEach((s) => urls.push(entry(`/services/${encodeURIComponent(s.slug)}`, { lastmod: s.updated, changefreq: 'monthly', priority: '0.8' })))
  blogs.forEach((b) => urls.push(entry(`/blog/${encodeURIComponent(b.slug)}`, { lastmod: b.updated, changefreq: 'monthly', priority: '0.6' })))
  console.log(`sitemap: ${STATIC_PAGES.length} pages, ${services.length} services, ${blogs.length} articles`)
} catch (err) {
  console.warn(`sitemap: could not read Firestore (${err.message}); only static pages listed`)
}

writeFileSync(
  `${publicDir}sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)
writeFileSync(`${publicDir}robots.txt`, `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`)
