import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

/**
 * Firebase project nawaayurveda-9b51e. The web config is public by design (it ships in the built
 * site); access is controlled by firestore.rules. Each value can be overridden with a VITE_FIREBASE_*
 * variable, e.g. to point a staging build at another project.
 */
const env = import.meta.env
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDP34iqGHU5RRFYpHyAA2EO_u7UtfGNXmY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'nawaayurveda-9b51e.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'nawaayurveda-9b51e',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'nawaayurveda-9b51e.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '233446018757',
  appId: env.VITE_FIREBASE_APP_ID || '1:233446018757:web:33056c1287970d802deaac',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-MD433GWDEQ',
}

export const app = initializeApp(firebaseConfig)

// Google Analytics for Firebase, only in production builds and only where the browser supports it.
if (import.meta.env.PROD) {
  analyticsSupported()
    .then((ok) => ok && getAnalytics(app))
    .catch(() => {})
}

export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* storage unavailable (private mode) — the session only lives in memory */
})

// Long-polling auto-detection keeps Firestore working behind proxies that break WebChannel streams.
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true })
