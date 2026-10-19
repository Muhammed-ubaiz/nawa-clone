import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin SDK for project "nawaayurveda-9b51e".
 *
 * Credentials are resolved in this order (the private key never lives in source code):
 *   1. FIREBASE_SERVICE_ACCOUNT          full service-account JSON, raw or base64 (hosting, e.g. Render)
 *   2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY   split credentials (\n escapes allowed in the key)
 *   3. GOOGLE_APPLICATION_CREDENTIALS    path to a key file (Google's standard variable)
 *   4. backend/serviceAccountKey.json    local development file (git-ignored)
 *
 * Without credentials the API still starts (MongoDB features keep working): `db` and `auth` are
 * null and `firebaseReady` is false, so callers can fail with a clear error instead of crashing boot.
 */
export const FIREBASE_PROJECT_ID = 'nawaayurveda-9b51e'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_KEY_FILE = path.resolve(__dirname, '..', 'serviceAccountKey.json')

function parseServiceAccountJson(raw) {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(text)
}

/** Returns { credential, source } or null when no credentials are configured. */
function resolveCredential() {
  const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, GOOGLE_APPLICATION_CREDENTIALS } = process.env

  if (FIREBASE_SERVICE_ACCOUNT) {
    return { credential: cert(parseServiceAccountJson(FIREBASE_SERVICE_ACCOUNT)), source: 'FIREBASE_SERVICE_ACCOUNT' }
  }
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
      source: 'FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY',
    }
  }
  if (GOOGLE_APPLICATION_CREDENTIALS) {
    return { credential: applicationDefault(), source: 'GOOGLE_APPLICATION_CREDENTIALS' }
  }
  if (fs.existsSync(LOCAL_KEY_FILE)) {
    return { credential: cert(JSON.parse(fs.readFileSync(LOCAL_KEY_FILE, 'utf8'))), source: 'serviceAccountKey.json' }
  }
  return null
}

let app = null
let source = null
try {
  const resolved = resolveCredential()
  if (resolved) {
    source = resolved.source
    // Reuse the app if this module is evaluated again (e.g. tests); never initialise twice.
    app = getApps()[0] || initializeApp({ credential: resolved.credential, projectId: FIREBASE_PROJECT_ID })
  } else {
    console.warn('Firebase Admin not configured: set FIREBASE_SERVICE_ACCOUNT (or add backend/serviceAccountKey.json). Firestore/Auth are disabled.')
  }
} catch (err) {
  // Malformed JSON/key: report it clearly, but keep the rest of the API running.
  console.error(`Firebase Admin initialisation failed (${source || 'credentials'}): ${err.message}`)
  app = null
}

export const firebaseReady = Boolean(app)
export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null

if (app) console.log(`Firebase Admin initialised: project ${FIREBASE_PROJECT_ID} (credentials: ${source})`)
