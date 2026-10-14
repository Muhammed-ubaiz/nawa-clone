/**
 * One-time Firebase setup for a new project, run from the frontend folder:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... ADMIN_NAME="Clinic Admin" node scripts/firebase-setup.mjs
 *   ... node scripts/firebase-setup.mjs --import export.json
 *
 * 1. Creates the admin's Firebase Auth account (or signs in if it already exists).
 * 2. Makes it the first admin: writes admins/{uid} together with meta/setup. firestore.rules allow this
 *    only while meta/setup does not exist, so self-registration closes as soon as it has run.
 *    Further admins are added by an existing admin (admins/{uid} doc in the Firebase console).
 * 3. With --import, copies blogs / services / appointments / contacts from a JSON file shaped like
 *    { "blogs": [ { "_id": "...", "title": "...", "createdAt": "2026-01-18T00:00:00.000Z", ... } ], ... }
 *    (e.g. an export of the old MongoDB database). Document ids are kept; existing docs are overwritten.
 *
 * Deploy the rules first:  firebase deploy --only firestore
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { Timestamp, doc, getDoc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDP34iqGHU5RRFYpHyAA2EO_u7UtfGNXmY',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'nawaayurveda-9b51e.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'nawaayurveda-9b51e',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:233446018757:web:33056c1287970d802deaac',
}

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Clinic Admin' } = process.env
const importIndex = process.argv.indexOf('--import')
const importFile = importIndex > -1 ? process.argv[importIndex + 1] : null

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function signInAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD.')
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.')
  const email = ADMIN_EMAIL.trim().toLowerCase()
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, ADMIN_PASSWORD)
    console.log(`Created Firebase Auth user ${email}.`)
    return user
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err
    const { user } = await signInWithEmailAndPassword(auth, email, ADMIN_PASSWORD)
    console.log(`Signed in as existing user ${email}.`)
    return user
  }
}

async function ensureAdmin(user) {
  if ((await getDoc(doc(db, 'admins', user.uid))).exists()) {
    console.log('Already an admin.')
    return
  }
  const batch = writeBatch(db)
  batch.set(doc(db, 'admins', user.uid), { name: ADMIN_NAME, email: user.email, role: 'admin', createdAt: serverTimestamp() })
  batch.set(doc(db, 'meta', 'setup'), { adminUid: user.uid, createdAt: serverTimestamp() })
  await batch.commit()
  console.log(`${user.email} is now the first admin; admin self-registration is closed.`)
}

const ts = (v) => (v ? Timestamp.fromDate(new Date(v)) : undefined)
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''))
const pick = (src, keys) => Object.fromEntries(keys.map((k) => [k, src[k]]))
const idOf = (d) => String(d._id?.$oid ?? d._id)

/** Maps exported documents onto the fields firestore.rules accept. */
const MAPPERS = {
  blogs: (d) =>
    clean({
      ...pick(d, ['title', 'slug', 'excerpt', 'content', 'featuredImage', 'category', 'author']),
      featuredImage: /^https?:\/\//.test(d.featuredImage || '') ? d.featuredImage : undefined,
      published: Boolean(d.published),
      createdAt: ts(d.createdAt) || Timestamp.now(),
      updatedAt: ts(d.updatedAt) || ts(d.createdAt) || Timestamp.now(),
    }),
  services: (d, i) =>
    clean({
      ...pick(d, ['name', 'slug', 'shortDescription', 'description']),
      image: /^https?:\/\//.test(d.image || '') ? d.image : undefined,
      benefits: d.benefits || [],
      process: (d.process || []).map((p) => clean({ title: p.title, text: p.text })),
      published: d.published !== false,
      order: Number(d.order) || 0,
      // Older records had no timestamps; keep their original order.
      createdAt: ts(d.createdAt) || Timestamp.fromMillis(Date.now() + i),
      updatedAt: ts(d.updatedAt) || Timestamp.now(),
    }),
  appointments: (d) =>
    clean({
      ...pick(d, ['name', 'phone', 'email', 'time', 'service', 'message', 'status']),
      date: ts(d.date),
      createdAt: ts(d.createdAt) || Timestamp.now(),
      updatedAt: ts(d.updatedAt) || Timestamp.now(),
    }),
  contacts: (d) =>
    clean({
      ...pick(d, ['name', 'email', 'phone', 'message', 'status']),
      createdAt: ts(d.createdAt) || Timestamp.now(),
      updatedAt: ts(d.updatedAt) || Timestamp.now(),
    }),
}

async function importData(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'))
  for (const [name, map] of Object.entries(MAPPERS)) {
    const docs = data[name] || []
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db)
      docs.slice(i, i + 400).forEach((d, j) => batch.set(doc(db, name, idOf(d)), map(d, i + j)))
      await batch.commit()
    }
    console.log(`Imported ${docs.length} ${name}.`)
  }
}

try {
  const user = await signInAdmin()
  await ensureAdmin(user)
  if (importFile) await importData(importFile)
  console.log('Done.')
  process.exit(0)
} catch (err) {
  console.error('Setup failed:', err.code || '', err.message)
  process.exit(1)
}
