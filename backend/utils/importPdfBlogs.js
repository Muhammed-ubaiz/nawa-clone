/**
 * Imports the 33 articles from Nawa_Ayurveda_Blogs.pdf (extracted into blogImportData.json)
 * into the Firestore "blogs" collection.
 *
 *   npm run import-pdf-blogs              dry run: validates and reports what would be written
 *   npm run import-pdf-blogs -- --write   writes to Firestore
 *
 * Safe to re-run: an article whose slug already exists in Firestore is skipped, never
 * overwritten or duplicated. Only fields allowed by /firestore.rules are written, so imported
 * posts stay editable in the admin panel (read time is computed by the frontend, not stored).
 * Cover images are the topic-matched photos in frontend/public/images/blog, served from the site.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { slugify } from './slugify.js'

const WRITE = process.argv.includes('--write')
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://nawaayurveda.ae').replace(/\/+$/, '')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'blogImportData.json'), 'utf8'))

/** Mirrors blogFields() in /firestore.rules; returns a list of problems (empty when valid). */
function validate(doc) {
  const errors = []
  const len = (key, min, max) => {
    const v = doc[key]
    if (typeof v !== 'string' || v.length < min || v.length > max) errors.push(`${key} must be ${min}-${max} chars`)
  }
  len('title', 3, 180)
  len('slug', 1, 120)
  len('content', 20, 150000)
  len('excerpt', 0, 400)
  len('category', 0, 60)
  len('author', 0, 80)
  if (slugify(doc.slug) !== doc.slug) errors.push(`slug "${doc.slug}" is not URL-safe`)
  if (!/^https?:\/\/.+/.test(doc.featuredImage)) errors.push('featuredImage must be an http(s) URL')
  if (typeof doc.published !== 'boolean') errors.push('published must be a boolean')
  if (!(doc.createdAt instanceof Timestamp)) errors.push('createdAt must be a timestamp')
  return errors
}

function toDoc(post) {
  const slug = slugify(post.slug || post.title)
  return {
    title: post.title.trim(),
    slug,
    excerpt: post.excerpt.trim(),
    content: post.content,
    featuredImage: `${SITE_ORIGIN}/images/blog/${slug}.jpg`,
    category: post.category,
    author: post.author || 'Nawa Ayurveda Team',
    // #01 and #02 stay drafts: their PDF body text is an unrelated chiropractic/migraine article.
    published: post.published !== false,
    createdAt: Timestamp.fromDate(new Date(post.publishedAt)),
  }
}

async function main() {
  if (!db) throw new Error('Firebase Admin is not configured (see config/firebase.js).')
  if (posts.length !== 33) throw new Error(`Expected 33 articles, found ${posts.length}.`)

  const docs = posts.map(toDoc)
  const invalid = docs.map((d) => [d.slug, validate(d)]).filter(([, e]) => e.length)
  if (invalid.length) throw new Error(`Validation failed:\n${invalid.map(([s, e]) => `  ${s}: ${e.join('; ')}`).join('\n')}`)
  const dupes = docs.map((d) => d.slug).filter((s, i, all) => all.indexOf(s) !== i)
  if (dupes.length) throw new Error(`Duplicate slugs in the import data: ${dupes.join(', ')}`)

  const existing = new Set((await db.collection('blogs').select('slug').get()).docs.map((d) => d.get('slug')))
  const toCreate = docs.filter((d) => !existing.has(d.slug))
  const skipped = docs.filter((d) => existing.has(d.slug))

  console.log(`${WRITE ? 'WRITE' : 'DRY RUN'}: ${docs.length} articles validated against firestore.rules`)
  console.log(`  create: ${toCreate.length}  (${toCreate.filter((d) => !d.published).length} as drafts)`)
  console.log(`  skip (slug already in Firestore, left untouched): ${skipped.length}`)
  skipped.forEach((d) => console.log(`    - ${d.slug}`))

  if (!WRITE) return console.log('\nNothing written. Re-run with --write to import.')

  const batch = db.batch() // 27 writes, well under the 500-per-batch limit
  for (const d of toCreate) batch.create(db.collection('blogs').doc(), { ...d, updatedAt: FieldValue.serverTimestamp() })
  await batch.commit()
  console.log(`\nCreated ${toCreate.length} documents.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
