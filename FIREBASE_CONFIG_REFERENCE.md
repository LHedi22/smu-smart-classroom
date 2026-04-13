# Firebase Admin SDK Configuration Reference

**Project:** SMU Classroom Dashboard  
**Database URL:** `https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`  
**Region:** europe-west1  
**Project ID:** smart-class-6f3a8

---

## ✅ CORRECT: Current Configuration

### Admin SDK Initialization (Node.js)

**File: `scripts/bulkAssignCoursesToProfessors.mjs` (line 107-110)**
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

✅ **This is the CORRECT configuration pattern**

**File: `scripts/verifyAssignments.mjs` (line 16-19)**
```javascript
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();
```

✅ **This is the CORRECT configuration pattern**

---

## Client SDK Configuration

**File: `src/firebase.js`**
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

**File: `.env.local` (line 1-8)**
```
VITE_FIREBASE_API_KEY=AIzaSyAxQu9zKVxcny5PCyvvBHhtGxypIa_0dPM
VITE_FIREBASE_AUTH_DOMAIN=smu-smart-classroom.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=smu-smart-classroom
VITE_FIREBASE_STORAGE_BUCKET=smu-smart-classroom.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=679754489155
VITE_FIREBASE_APP_ID=1:679754489155:web:5b5fed6de951759d39e3f6
```

✅ **This is the CORRECT configuration pattern**

---

## URL Breakdown

### Regional Format (Your Database)
```
https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
      ├─ Protocol: https:// (encrypted)
      ├─ Project ID: smu-smart-classroom
      ├─ Database type: -default-rtdb
      ├─ Region: europe-west1
      └─ Domain: firebasedatabase.app
```

### URL Components
| Component | Value | Meaning |
|-----------|-------|---------|
| **Protocol** | `https://` | Secure HTTPS connection (required) |
| **Project ID** | `smu-smart-classroom` | Your Firebase project identifier |
| **Default Database** | `-default-rtdb` | The default Realtime Database instance |
| **Region** | `europe-west1` | Geographic location (selected during creation) |
| **Domain** | `.firebasedatabase.app` | Firebase database domain (regional format) |

---

## Why This URL is Correct ✅

### 1. Matches Your Firebase Project
- ✅ Project ID: `smart-class-6f3a8` (from Firebase Console)
- ✅ Database: Realtime Database (not Firestore)
- ✅ Region: `europe-west1` (selected during creation)

### 2. Uses Regional Format
Firebase offers two formats:

| Format | URL | Use Case |
|--------|-----|----------|
| **Standard (US)** | `https://PROJECT_ID-default-rtdb.firebaseio.com` | US-Central region |
| **Regional** | `https://PROJECT_ID-default-rtdb.REGION.firebasedatabase.app` | Other regions (like europe-west1) |

Your database was created in `europe-west1`, so the regional format is required.

### 3. Uses Correct Protocol
- ✅ HTTPS (not HTTP)
- ✅ Port 443 (default, not specified in URL)

---

## ❌ INCORRECT Examples (What NOT to Do)

### ❌ Generic Region URL (Missing Project ID)
```javascript
// WRONG - This is not a real endpoint
databaseURL: "https://europe-west1.firebasedatabase.app"
```
This fails because Firebase doesn't know which project you mean.

### ❌ Wrong Protocol
```javascript
// WRONG - HTTP is not allowed
databaseURL: "http://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app"
```

### ❌ Standard Format for Regional Database
```javascript
// WRONG - This is US-Central format
databaseURL: "https://smart-class-6f3a8-default-rtdb.firebaseio.com"
```
This URL exists but is for a different region. Firebase won't find your data.

### ❌ Missing Region Indicator
```javascript
// WRONG - Missing the region
databaseURL: "https://smart-class-6f3a8-default-rtdb.firebasedatabase.app"
```
Firebase doesn't know which `europe-west1` database to use.

---

## Verification Checklist

Before running your scripts, verify:

- ✅ **Project ID correct**: `smart-class-6f3a8`
- ✅ **Region correct**: `europe-west1` (from Firebase Console > Realtime Database)
- ✅ **Database name**: `-default-rtdb` (the default instance)
- ✅ **Protocol**: `https://`
- ✅ **Domain**: `.firebasedatabase.app` (regional format)
- ✅ **Service account file**: `./serviceAccountKey.json` exists and is valid
- ✅ **DNS resolution**: `nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app` returns an IP address

---

## Common Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Offline mode" | DNS cannot resolve Firebase domain | Run DNS fix script (see DNS_RESOLUTION_FIX.md) |
| "Cannot read property 'ref'" | DB not initialized | Check serviceAccountKey.json exists |
| "Invalid database URL" | Wrong URL format | Copy URL from Firebase Console > Realtime Database > Data tab |
| "PERMISSION_DENIED" | Firebase Rules block operation | Check Firebase Database Rules in console |
| "FAILED_PRECONDITION" | Database doesn't exist | Create Realtime Database in Firebase Console |

---

## Reference URLs

### Your Configuration
- **Database Console URL**: `https://console.firebase.google.com/project/smart-class-6f3a8/database`
- **Database Location**: europe-west1
- **RTDB URL**: `https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`

### Documentation
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Regional Databases](https://firebase.google.com/docs/database/custom-location)

---

## Summary

✅ **Your configuration is CORRECT**

The database URL in all your scripts matches:
- Your Firebase project
- Your database region (europe-west1)
- Firebase's standard format for regional databases

The issue is not the URL configuration but DNS resolution at the system level. See `DNS_RESOLUTION_FIX.md` for solutions.
