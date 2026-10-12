import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin SDK — the single place the app talks to Firebase.
 *
 * Credentials, first match wins (never commit any of them):
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to the service-account JSON key (relative to backend/ or absolute)
 *   FIREBASE_SERVICE_ACCOUNT_JSON  the key itself as JSON text, or base64 of it (handy for hosting env vars)
 *   GOOGLE_APPLICATION_CREDENTIALS standard Google variable / Application Default Credentials
 * FIREBASE_PROJECT_ID is optional (taken from the key when present).
 */
const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readServiceAccount() {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (filePath) {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(BACKEND_DIR, filePath)
    if (!fs.existsSync(abs)) throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH points to a missing file: ${abs}`)
    return JSON.parse(fs.readFileSync(abs, 'utf8'))
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw) {
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(text)
  }
  return null
}

function init() {
  if (getApps().length) return getApps()[0]
  const account = readServiceAccount()
  if (account) {
    // Keys pasted into env vars often carry literal "\n" in the private key.
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n')
    return initializeApp({ credential: cert(account), projectId: process.env.FIREBASE_PROJECT_ID || account.project_id })
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID })
  }
  throw new Error(
    'Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH (or FIREBASE_SERVICE_ACCOUNT_JSON) in backend/.env — see .env.example.',
  )
}

let app
let firestore
let connected = false

/** Lazily initialised Firestore instance (throws a clear error if credentials are missing). */
export function db() {
  if (!firestore) {
    app = init()
    firestore = getFirestore(app)
    firestore.settings({ ignoreUndefinedProperties: true })
  }
  return firestore
}

/** Initialises Firebase and proves the credentials work with one cheap call. */
export async function connectDB() {
  const store = db()
  try {
    await store.listCollections()
  } catch (err) {
    const hint = /PERMISSION_DENIED|UNAUTHENTICATED|invalid_grant/i.test(err.message)
      ? ' Check the service-account key and that Firestore is enabled for this project.'
      : /NOT_FOUND/i.test(err.message)
        ? ' Create the Firestore database in the Firebase console (Build → Firestore Database).'
        : ''
    throw new Error(`Could not reach Firestore: ${err.message}.${hint}`)
  }
  connected = true
  console.log(`Firestore connected: project ${app.options.projectId || '(default)'}`)
  return store
}

export const isConnected = () => connected

export { FieldValue, Timestamp }
