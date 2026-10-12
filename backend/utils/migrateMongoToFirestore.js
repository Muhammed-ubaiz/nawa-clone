/**
 * One-off copy of the old MongoDB data (Atlas or local) into Firestore.
 *
 *   npm i --no-save mongodb                 (only for this script; not an app dependency)
 *   npm run migrate-firestore -- --dry      -> reports what would be copied
 *   npm run migrate-firestore               -> copies every document Firestore does not have yet
 *
 * Source: SOURCE_MONGO_URI, or MONGO_URI if still set in backend/.env (read-only).
 * Target: the Firestore project configured in config/firebase.js.
 *
 * Documents keep their MongoDB _id as the Firestore document id, so existing links and ids keep
 * working. Dates stay dates; password hashes are copied as-is (logins keep working). Documents
 * already present in Firestore are never overwritten, so the script is safe to re-run.
 */
import 'dotenv/config'
import { connectDB, db } from '../config/firebase.js'

const SOURCE = process.env.SOURCE_MONGO_URI || process.env.MONGO_URI
const dry = process.argv.includes('--dry')
const COLLECTIONS = ['admins', 'appointments', 'blogs', 'contacts', 'services']

/** Host + database only — never print credentials. */
const where = (uri) => {
  try {
    const u = new URL(uri)
    return `${u.host}/${u.pathname.replace(/^\//, '') || '(default db)'}`
  } catch {
    return '(unparseable URI)'
  }
}

/** Mongo document → Firestore data: drop _id/__v, ObjectIds to strings, keep Dates/arrays. */
function toFirestore(value) {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(toFirestore)
  if (typeof value === 'object') {
    if (value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID') return value.toHexString()
    if (value._bsontype === 'Decimal128') return Number(value.toString())
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k, v]) => k !== '_id' && k !== '__v' && v !== undefined)
        .map(([k, v]) => [k, toFirestore(v)]),
    )
  }
  return value
}

async function run() {
  if (!SOURCE) throw new Error('Set SOURCE_MONGO_URI (or keep MONGO_URI) in backend/.env to the MongoDB database to copy from.')
  let MongoClient
  try {
    ;({ MongoClient } = await import('mongodb'))
  } catch {
    throw new Error('The "mongodb" driver is needed only for this script. Run: npm i --no-save mongodb')
  }

  await connectDB()
  const client = new MongoClient(SOURCE)
  await client.connect()
  const mongo = client.db()
  console.log(`Source: ${where(SOURCE)}`)
  console.log(`Target: Firestore${dry ? '  (dry run — nothing is written)' : ''}\n`)

  try {
    for (const name of COLLECTIONS) {
      const docs = await mongo.collection(name).find({}).toArray()
      const target = db().collection(name)
      const existing = new Set((await target.listDocuments()).map((d) => d.id))
      const missing = docs.filter((d) => !existing.has(String(d._id)))

      if (dry) {
        console.log(`- ${name.padEnd(14)} would copy ${missing.length} of ${docs.length}${existing.size ? `, ${existing.size} already in Firestore kept` : ''}`)
        continue
      }
      // Batched writes (max 500 per batch).
      for (let i = 0; i < missing.length; i += 400) {
        const batch = db().batch()
        missing.slice(i, i + 400).forEach((d) => batch.set(target.doc(String(d._id)), toFirestore(d)))
        // eslint-disable-next-line no-await-in-loop
        await batch.commit()
      }
      const total = (await target.count().get()).data().count
      console.log(`- ${name.padEnd(14)} copied ${missing.length} of ${docs.length}, Firestore now has ${total}`)
    }
    if (!dry) console.log('\nDone. The MongoDB source was not modified.')
  } finally {
    await client.close()
  }
}

run().catch((err) => {
  console.error(`Migration failed: ${err.message}`)
  process.exit(1)
})
