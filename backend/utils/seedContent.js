/**
 * Loads the initial services and blog articles into MongoDB.
 * Existing records (matched by slug) are left untouched, so it is safe to re-run.
 *
 *   npm run seed-content
 */
import 'dotenv/config'
import fs from 'node:fs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Blog from '../models/Blog.js'
import Service from '../models/Service.js'

const data = JSON.parse(fs.readFileSync(new URL('./seedData.json', import.meta.url), 'utf8'))

async function upsertMissing(Model, items, label) {
  let created = 0
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const res = await Model.updateOne({ slug: item.slug }, { $setOnInsert: item }, { upsert: true, timestamps: false })
    if (res.upsertedCount) created += 1
  }
  console.log(`${label}: ${created} created, ${items.length - created} already present`)
}

async function run() {
  await connectDB()
  await upsertMissing(Service, data.services, 'Services')
  await upsertMissing(
    Blog,
    data.blogs.map((b) => ({ ...b, createdAt: new Date(b.createdAt), updatedAt: new Date(b.createdAt) })),
    'Blogs',
  )
}

run()
  .catch((err) => {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.connection.close())
