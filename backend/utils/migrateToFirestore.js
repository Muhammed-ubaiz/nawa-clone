/**
 * Copies MongoDB data into Firestore so the website can run on Firebase alone.
 *
 *   npm run migrate-firestore              dry run: reads MongoDB, reports what would be written
 *   npm run migrate-firestore -- --write   writes to Firestore
 *
 * Reads MONGODB_URI (or MONGO_URI) and Firebase Admin credentials like the API does.
 * Documents keep their MongoDB ids, so re-running is safe: each run overwrites the same
 * Firestore documents with the current MongoDB values and never deletes anything.
 * Only the fields allowed by /firestore.rules are written.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import Appointment from '../models/Appointment.js'
import Blog from '../models/Blog.js'
import Contact from '../models/Contact.js'
import Service from '../models/Service.js'

const WRITE = process.argv.includes('--write')
const LEGACY_ORIGIN = (process.env.LEGACY_API_ORIGIN || 'https://nawa-clone.onrender.com').replace(/\/+$/, '')
const MAX_IMAGE_CHARS = 800000
const warnings = []

const ts = (d) => (d ? Timestamp.fromDate(new Date(d)) : undefined)
const opt = (v) => (v === undefined || v === null || v === '' ? undefined : v)
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

/** Keeps https images; inlines files that were uploaded to the old API (its disk is not permanent). */
async function image(value, label) {
  if (!value) return undefined
  if (/^https?:\/\//.test(value)) return value
  if (!value.startsWith('/uploads/')) return undefined
  try {
    const res = await fetch(`${LEGACY_ORIGIN}${value}`)
    const type = res.headers.get('content-type') || ''
    if (!res.ok || !/^image\/(webp|jpeg|png)/.test(type)) throw new Error(`HTTP ${res.status} ${type}`)
    const url = `data:${type.split(';')[0]};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
    if (url.length > MAX_IMAGE_CHARS) throw new Error('image too large to store on the document')
    return url
  } catch (err) {
    warnings.push(`${label}: image ${value} not copied (${err.message}); re-upload it in the admin panel`)
    return undefined
  }
}

const MAPPERS = {
  appointments: async (a) =>
    clean({
      name: a.name,
      phone: a.phone,
      email: opt(a.email),
      date: ts(a.date),
      time: opt(a.time),
      service: a.service,
      message: opt(a.message),
      status: a.status || 'Pending',
      createdAt: ts(a.createdAt),
      updatedAt: ts(a.updatedAt || a.createdAt),
    }),
  contacts: async (c) =>
    clean({
      name: c.name,
      email: c.email,
      phone: opt(c.phone),
      message: c.message,
      status: c.status || 'New',
      createdAt: ts(c.createdAt),
      updatedAt: ts(c.updatedAt || c.createdAt),
    }),
  blogs: async (b) =>
    clean({
      title: b.title,
      slug: b.slug,
      excerpt: opt(b.excerpt),
      content: b.content,
      featuredImage: await image(b.featuredImage, `blog "${b.slug}"`),
      category: opt(b.category),
      author: opt(b.author),
      published: !!b.published,
      createdAt: ts(b.createdAt),
      updatedAt: ts(b.updatedAt || b.createdAt),
    }),
  services: async (s) =>
    clean({
      name: s.name,
      slug: s.slug,
      shortDescription: opt(s.shortDescription),
      description: opt(s.description),
      image: await image(s.image, `service "${s.slug}"`),
      benefits: (s.benefits || []).slice(0, 20),
      process: (s.process || []).slice(0, 20).map((p) => clean({ title: p.title, text: p.text || '' })),
      published: s.published !== false,
      order: Number(s.order) || 0,
      createdAt: ts(s.createdAt),
      updatedAt: ts(s.updatedAt || s.createdAt),
    }),
}

const MODELS = { appointments: Appointment, contacts: Contact, blogs: Blog, services: Service }

async function migrate(name) {
  const docs = await MODELS[name].find().lean()
  const existing = new Set((await db.collection(name).select().get()).docs.map((d) => d.id))
  let added = 0
  let updated = 0
  let batch = db.batch()
  let pending = 0

  for (const d of docs) {
    const id = String(d._id)
    // eslint-disable-next-line no-await-in-loop
    const data = await MAPPERS[name](d)
    if (existing.has(id)) updated++
    else added++
    if (WRITE) {
      batch.set(db.collection(name).doc(id), data)
      if (++pending === 400) {
        // eslint-disable-next-line no-await-in-loop
        await batch.commit()
        batch = db.batch()
        pending = 0
      }
    }
  }
  if (WRITE && pending) await batch.commit()
  console.log(`${name.padEnd(13)} MongoDB ${String(docs.length).padStart(5)} → Firestore: ${added} new, ${updated} overwritten`)
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Set MONGODB_URI to the MongoDB database you want to copy.')
  if (!db) throw new Error('Firebase Admin credentials are not configured (see config/firebase.js).')

  await mongoose.connect(uri)
  console.log(`MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`)
  console.log(WRITE ? 'Writing to Firestore…\n' : 'Dry run — nothing is written. Add --write to copy.\n')
  for (const name of Object.keys(MODELS)) {
    // eslint-disable-next-line no-await-in-loop
    await migrate(name)
  }
  if (warnings.length) console.log(`\nWarnings:\n- ${warnings.join('\n- ')}`)
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(`Migration failed: ${err.message}`)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
