import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const isMock = import.meta.env.VITE_USE_MOCK === 'true'
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId

let db   = null
let auth = null

if (!isMock || hasConfig) {
  const app = initializeApp(firebaseConfig)
  db   = getDatabase(app)
  auth = getAuth(app)
}

export { db, auth }
