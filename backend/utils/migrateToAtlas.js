/**
 * Copies the app's data from the old local MongoDB into the database in MONGO_URI (Atlas).
 *
 *   npm run migrate-atlas             -> copies every document that the target does not have yet
 *   npm run migrate-atlas -- --dry    -> only reports what would be copied
 *
 * Source: SOURCE_MONGO_URI (default mongodb://127.0.0.1:27017/nawa_ayurveda), read-only.
 * Target: MONGO_URI from backend/.env.
 *
 * Safe to re-run: documents keep their _id and only documents whose _id is missing in the
 * target are inserted — documents already in the target (e.g. bookings made after the switch)
 * are never overwritten. The local database is not modified. Indexes are copied too.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const SOURCE = process.env.SOURCE_MONGO_URI || 'mongodb://127.0.0.1:27017/nawa_ayurveda'
const TARGET = process.env.MONGO_URI
const dry = process.argv.includes('--dry')

/** Host + database only — never print credentials. */
const where = (uri) => {
  try {
    const u = new URL(uri)
    return `${u.host}/${u.pathname.replace(/^\//, '') || '(default db)'}`
  } catch {
    return '(unparseable URI)'
  }
}

async function run() {
  if (!TARGET) throw new Error('MONGO_URI is not set in backend/.env.')
  if (TARGET.includes('<db_password>')) throw new Error('Replace <db_password> in MONGO_URI (backend/.env) with the real password first.')
  if (where(TARGET) === where(SOURCE)) throw new Error('MONGO_URI points at the source database — nothing to migrate.')

  const source = await mongoose.createConnection(SOURCE).asPromise()
  const target = await mongoose.createConnection(TARGET).asPromise()
  console.log(`Source: ${where(SOURCE)}`)
  console.log(`Target: ${where(TARGET)}${dry ? '  (dry run — nothing is written)' : ''}\n`)

  const collections = (await source.db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort()

  for (const name of collections) {
    const all = await source.db.collection(name).find({}).toArray()
    const present = new Set((await target.db.collection(name).find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)))
    const docs = all.filter((d) => !present.has(String(d._id)))
    const kept = present.size ? `, ${present.size} already in target kept` : ''

    if (dry) {
      console.log(`- ${name.padEnd(14)} would copy ${docs.length} of ${all.length} document(s)${kept}`)
      continue
    }

    // Indexes first (except the default _id index), so unique constraints apply from the start.
    const indexes = (await source.db.collection(name).indexes()).filter((ix) => ix.name !== '_id_')
    for (const { key, name: ixName, v, ns, ...options } of indexes) {
      await target.db.collection(name).createIndex(key, { name: ixName, ...options })
    }
    if (docs.length) await target.db.collection(name).insertMany(docs, { ordered: true })
    else if (!present.size) await target.db.createCollection(name).catch(() => {}) // keep empty collections (e.g. contacts)
    console.log(`- ${name.padEnd(14)} copied ${docs.length} document(s), ${indexes.length} index(es)${kept}`)
  }

  // Verify: every source document must now exist in the target.
  if (!dry) {
    console.log('\nVerification (source documents present in target):')
    let ok = true
    for (const name of collections) {
      const ids = (await source.db.collection(name).find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id)
      const found = ids.length ? await target.db.collection(name).countDocuments({ _id: { $in: ids } }) : 0
      const total = await target.db.collection(name).countDocuments()
      if (found !== ids.length) ok = false
      console.log(`  ${name.padEnd(14)} ${found}/${ids.length} copied  (target total ${total})${found === ids.length ? '' : '   ⚠ missing'}`)
    }
    console.log(ok ? '\nDone: everything from the local database is in the target.' : '\nSome documents are missing (see above).')
  }

  await source.close()
  await target.close()
}

run().catch(async (err) => {
  console.error(`Migration failed: ${err.message}`)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
