import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase web app "nawa-ayurveda-web" (project nawaayurveda-9b51e).
 * This config is public by design — it identifies the project, it does not grant access.
 * Access is enforced by the Firestore security rules in /firestore.rules.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDP34iqGHU5RRFYpHyAA2EO_u7UtfGNXmY',
  authDomain: 'nawaayurveda-9b51e.firebaseapp.com',
  projectId: 'nawaayurveda-9b51e',
  storageBucket: 'nawaayurveda-9b51e.firebasestorage.app',
  messagingSenderId: '233446018757',
  appId: '1:233446018757:web:33056c1287970d802deaac',
  measurementId: 'G-MD433GWDEQ',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
