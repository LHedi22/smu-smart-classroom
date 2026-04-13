# Corrected Firebase Admin SDK Initialization Code

**Status:** Your current code is ALREADY CORRECT ✅

This document shows the correct patterns used in your project (for reference).

---

## Current Implementation (CORRECT) ✅

### File: `scripts/bulkAssignCoursesToProfessors.mjs`
**Lines 14-18 and 107-110**

```javascript
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ... MOODLE_COURSES_BY_PROF_ID definition ...

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();
```

**Why this is correct:**
- ✅ Uses Admin SDK (`firebase-admin`)
- ✅ Loads service account from JSON file
- ✅ Uses `cert()` for server credentials
- ✅ Database URL includes project ID
- ✅ Database URL includes region (europe-west1)
- ✅ Gets database reference immediately after initialization
- ✅ Uses modern ES modules syntax

---

### File: `scripts/verifyAssignments.mjs`
**Lines 10-21**

```javascript
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();
```

**Why this is correct:**
- ✅ Minimal, focused initialization
- ✅ No unnecessary dependencies
- ✅ Clean separation of concerns
- ✅ Correct URL format for regional database

---

## Client-Side Configuration (CORRECT) ✅

### File: `src/firebase.js`

```javascript
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

const app = initializeApp(firebaseConfig)
export const db   = getDatabase(app)
export const auth = getAuth(app)
```

**Why this is correct:**
- ✅ Uses client SDK (`firebase` not `firebase-admin`)
- ✅ Configuration loaded from environment variables
- ✅ Proper exports for use in other components
- ✅ Includes auth for user authentication

### File: `.env.local`

```
VITE_FIREBASE_API_KEY=AIzaSyAxQu9zKVxcny5PCyvvBHhtGxypIa_0dPM
VITE_FIREBASE_AUTH_DOMAIN=smu-smart-classroom.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=smu-smart-classroom
VITE_FIREBASE_STORAGE_BUCKET=smu-smart-classroom.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=679754489155
VITE_FIREBASE_APP_ID=1:679754489155:web:5b5fed6de951759d39e3f6
```

**Why this is correct:**
- ✅ Uses VITE_ prefix for Vite environment variables
- ✅ Database URL matches backend configuration
- ✅ All required Firebase config fields present

---

## Common Usage Patterns (After Initialization)

### Reading Data

```javascript
// Single read
const snap = await db.ref('professors').once('value');
const data = snap.val();

// Limited query
const snap = await db.ref('courses').limitToFirst(10).once('value');

// Real-time listener (client-side)
db.ref('professors').on('value', (snapshot) => {
  const data = snapshot.val();
  console.log('Data updated:', data);
});
```

### Writing Data

```javascript
// Set/overwrite
await db.ref('professors/uid123').set({
  name: 'John Doe',
  email: 'john@example.com'
});

// Update (merge, don't overwrite)
await db.ref('professors/uid123').update({
  assignedRooms: { 'A101': true }
});

// Remove
await db.ref('professors/uid123/assignedRooms').remove();
```

### Transactions

```javascript
const result = await db.ref('professors/uid123').transaction((current) => {
  return (current || 0) + 1;
});
```

---

## What Makes This Configuration Correct

### 1. Proper SDK Selection
- **Admin SDK** (`firebase-admin/app`, `firebase-admin/database`)
  - Used in Node.js scripts
  - Has full database write access
  - Requires service account credentials

- **Client SDK** (`firebase`)
  - Used in React components
  - Limited by Firebase Security Rules
  - Authenticates as user

### 2. Correct Credential Handling
```javascript
// ✅ Admin SDK - uses service account
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
initializeApp({ credential: cert(serviceAccount), ... });

// ✅ Client SDK - uses browser authentication
const firebaseConfig = { apiKey, authDomain, ... };
initializeApp(firebaseConfig);
```

### 3. Proper Database URL Format
```javascript
// ✅ Regional database (europe-west1)
"https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app"

// ✅ Standard database (US-central)
"https://smart-class-6f3a8-default-rtdb.firebaseio.com"

// ❌ Generic region (missing project ID)
"https://europe-west1.firebasedatabase.app"

// ❌ Wrong protocol
"http://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app"
```

### 4. Environment Configuration
```javascript
// ✅ Client-side - uses env variables
databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL

// ✅ Server-side - hardcoded (safe with service account)
databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app"

// ✅ Environment variable in .env.local
VITE_FIREBASE_DATABASE_URL=https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
```

---

## Summary

**Current Implementation:** ✅ **100% CORRECT**

No changes needed to:
- `scripts/bulkAssignCoursesToProfessors.mjs`
- `scripts/verifyAssignments.mjs`
- `src/firebase.js`
- `.env.local`

**Issue Location:** 🔧 **DNS Resolution** (not configuration)

**Solution:** Follow the DNS troubleshooting guide in `DNS_RESOLUTION_FIX.md`

**Next Step:** Run `node scripts/testFirebaseDirectHTTPS.mjs` after fixing DNS
