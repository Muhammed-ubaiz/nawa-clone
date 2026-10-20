/**
 * Runs after `vite build` (npm "postbuild"). Makes the public site readable by search engines and
 * link previews, which do not run JavaScript:
 *
 *  1. Pre-renders every public page (static pages + published services and blog articles from
 *     Firestore) in headless Chrome and saves the finished HTML: dist/about.html, dist/blog/<slug>.html …
 *     The HTML includes the page's own title, description, canonical URL and Open Graph tags.
 *     React still starts in the browser exactly as before and takes over the page.
 *  2. Writes dist/404.html (the not-found page, served with HTTP 404 by Firebase Hosting).
 *  3. Writes dist/sitemap.xml and dist/robots.txt.
 *  4. Keeps the plain app shell as dist/app.html for routes that are not pre-rendered (admin,
 *     articles published after the last build) — see the rewrites in /firebase.json.
 *
 * Needs Google Chrome (CHROME_PATH to override). Without it the site still works as a normal
 * single-page app; only steps 1–2 are skipped and a warning is printed.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = 'https://nawaayurveda.ae'
const PROJECT = 'nawaayurveda-9b51e'
const API_KEY = 'AIzaSyDP34iqGHU5RRFYpHyAA2EO_u7UtfGNXmY' // public web key (also in src/lib/firebase.js)
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const CONCURRENCY = 4
const NOT_FOUND_PROBE = '/__prerender-not-found__'

const STATIC_PAGES = [
  ['/', 'weekly', '1.0'],
  ['/about', 'monthly', '0.8'],
  ['/services', 'monthly', '0.9'],
  ['/programs', 'monthly', '0.7'],
  ['/blog', 'weekly', '0.8'],
  ['/appointment', 'monthly', '0.9'],
  ['/contact', 'monthly', '0.7'],
  ['/privacy-policy', 'yearly', '0.2'],
]

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Published docs of a Firestore collection via the public REST API: [{ slug, updated }]. */
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
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`${collectionId}: HTTP ${res.status}`)
  return (await res.json())
    .filter((r) => r.document)
    .map(({ document: d }) => ({ slug: d.fields?.slug?.stringValue, updated: d.fields?.updatedAt?.timestampValue }))
    .filter((d) => d.slug)
}

// ---------------------------------------------------------------- local server over dist/

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain',
}

/** Serves dist/ like Firebase Hosting would during the render: real files, otherwise the app shell. */
function startServer(shell) {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = path.join(DIST, pathname)
    if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile() && !file.endsWith('.html')) {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' })
      fs.createReadStream(file).pipe(res)
      return
    }
    res.writeHead(200, { 'Content-Type': TYPES['.html'] })
    res.end(shell)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

// ---------------------------------------------------------------- headless Chrome (DevTools protocol)

async function startChrome(chromePath) {
  const port = 9600 + Math.floor(Math.random() * 300)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nawa-prerender-'))
  const proc = spawn(chromePath, ['--headless=new', '--disable-gpu',
    // All tabs render at once; without these Chrome throttles the timers of "background" tabs.
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
  let version
  for (let i = 0; i < 100 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json() } catch { await sleep(150) }
  }
  if (!version) throw new Error('Chrome did not start')
  return {
    port,
    // Windows keeps the profile locked for a moment after Chrome exits; leftovers in %TEMP% are harmless.
    close: async () => {
      proc.kill()
      await new Promise((r) => (proc.exitCode !== null ? r() : proc.once('exit', r)))
      for (let i = 0; i < 5; i++) {
        try { fs.rmSync(profile, { recursive: true, force: true }); break } catch { await sleep(500) }
      }
    },
  }
}

async function openTab(port) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j) })
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  })
  // Every call has a time limit, so a frozen page cannot stall the build.
  const send = (method, params = {}, timeout = 30000) =>
    new Promise((r, j) => {
      const i = ++id
      const timer = setTimeout(() => { pending.delete(i); j(new Error(`${method} timed out`)) }, timeout)
      pending.set(i, (m) => { clearTimeout(timer); r(m) })
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false })
  const close = () => {
    ws.close()
    fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {})
  }
  return { send, evaluate, close }
}

const READY = `(() => !!document.querySelector('h1')
  && !document.querySelector('#root [role="status"]')
  && !document.querySelector('#root .animate-pulse'))()`

/** Scrolls through the page so on-scroll reveals are shown in the saved HTML, then back to the top. */
const REVEAL = `(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 700)); return true })()`

async function render(tab, origin, route) {
  let ready = false
  // A slow Firestore answer can leave a page on its loader; reload it once before giving up.
  for (let attempt = 0; attempt < 2 && !ready; attempt++) {
    await tab.send('Page.navigate', { url: origin + route })
    const started = Date.now()
    while (!ready && Date.now() - started < 20000) {
      await sleep(300)
      ready = await tab.evaluate(READY)
    }
  }
  await sleep(500) // let late images/counters settle
  await tab.evaluate(REVEAL)
  const html = await tab.evaluate("'<!doctype html>\\n' + document.documentElement.outerHTML")
  const meta = await tab.evaluate(`({ title: document.title, h1: document.querySelectorAll('h1').length, words: document.body.innerText.split(/\\s+/).length, canonical: document.querySelector('link[rel=canonical]')?.href })`)
  return { html, meta, ready }
}

const outFile = (route) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`)

// ---------------------------------------------------------------- main

const shellPath = path.join(DIST, 'index.html')
const shell = fs.readFileSync(shellPath, 'utf8')
fs.writeFileSync(path.join(DIST, 'app.html'), shell)

let services = []
let blogs = []
try {
  ;[services, blogs] = await Promise.all([published('services'), published('blogs')])
} catch (err) {
  console.warn(`prerender: could not read Firestore (${err.message}); only static pages will be included`)
}

const routes = [
  ...STATIC_PAGES.map(([p, changefreq, priority]) => ({ path: p, changefreq, priority })),
  ...services.map((s) => ({ path: `/services/${s.slug}`, lastmod: s.updated, changefreq: 'monthly', priority: '0.8' })),
  ...blogs.map((b) => ({ path: `/blog/${b.slug}`, lastmod: b.updated, changefreq: 'monthly', priority: '0.6' })),
]

// sitemap.xml + robots.txt (always written, even without Chrome)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((r) =>
    ['  <url>', `    <loc>${esc(SITE + (r.path === '/' ? '/' : r.path))}</loc>`, r.lastmod && `    <lastmod>${r.lastmod.slice(0, 10)}</lastmod>`, `    <changefreq>${r.changefreq}</changefreq>`, `    <priority>${r.priority}</priority>`, '  </url>']
      .filter(Boolean)
      .join('\n'),
  ),
  '</urlset>',
  '',
].join('\n')
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`prerender: sitemap.xml with ${routes.length} URLs (${services.length} services, ${blogs.length} articles), robots.txt`)

const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p))
if (!chromePath) {
  fs.writeFileSync(path.join(DIST, '404.html'), shell)
  console.warn('prerender: Chrome not found (set CHROME_PATH) — pages NOT pre-rendered; the site works but crawlers see an empty shell.')
  process.exit(0)
}

const server = await startServer(shell)
const origin = `http://127.0.0.1:${server.address().port}`
const chrome = await startChrome(chromePath)
const problems = []
const queue = [...routes.map((r) => r.path), NOT_FOUND_PROBE]
let done = 0

/** Renders in the given tab; if the page stops responding, retries once in a fresh tab. */
async function renderWithRetry(state, route) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await render(state.tab, origin, route)
    } catch (err) {
      state.tab.close()
      state.tab = await openTab(chrome.port)
      if (attempt) throw err
    }
  }
}

async function worker() {
  const state = { tab: await openTab(chrome.port) }
  try {
    for (let route = queue.shift(); route; route = queue.shift()) {
      let result
      try {
        result = await renderWithRetry(state, route)
      } catch (err) {
        // Static pages must still exist as files (no rewrite covers them): fall back to the app shell.
        problems.push(`${route}: ${err.message} — ${/^\/(blog|services)\//.test(route) ? 'served by the app shell' : 'saved as the app shell'}`)
        if (!/^\/(blog|services)\//.test(route) && route !== NOT_FOUND_PROBE) fs.writeFileSync(path.join(DIST, outFile(route)), shell)
        if (route === NOT_FOUND_PROBE) fs.writeFileSync(path.join(DIST, '404.html'), shell)
        continue
      }
      const { html, meta, ready } = result
      const isNotFound = route === NOT_FOUND_PROBE
      if (!ready) problems.push(`${route}: still loading after two attempts (${/^\/(blog|services)\//.test(route) ? 'served by the app shell' : 'saved anyway'})`)
      if (!meta.h1) problems.push(`${route}: no <h1>`)
      if (!isNotFound && meta.canonical !== SITE + (route === '/' ? '/' : route)) problems.push(`${route}: canonical is ${meta.canonical}`)
      // Articles/services that never loaded are left to the app shell (firebase.json rewrite) rather
      // than saved as a loading screen.
      if (!ready && /^\/(blog|services)\//.test(route)) continue
      const file = path.join(DIST, isNotFound ? '404.html' : outFile(route))
      fs.mkdirSync(path.dirname(file), { recursive: true })
      // The not-found page is served at many URLs: no canonical / og:url (it is noindex anyway).
      fs.writeFileSync(file, isNotFound ? html.replace(/<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>/g, '') : html)
      done++
      console.log(`  ${String(done).padStart(2)} ${route.padEnd(56)} ${String(meta.words).padStart(5)} words  ${meta.title}`)
    }
  } finally {
    state.tab.close()
  }
}

try {
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
} finally {
  await chrome.close()
  server.close()
}

console.log(`prerender: ${done} pages written to dist/`)
if (problems.length) {
  console.warn(`prerender: ${problems.length} warning(s):\n  - ${problems.join('\n  - ')}`)
}
