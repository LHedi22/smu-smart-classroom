# 🔴 CRITICAL: Service Account Credentials Mismatch

## The Problem

```
FIREBASE WARNING: Provided authentication credentials for the app named "[DEFAULT]" are invalid.
This usually indicates your app was not initialized correctly.
```

**Root Cause:** The `serviceAccountKey.json` file is for the OLD Firebase project (`smu-smart-classroom`), but you're trying to connect to the NEW project (`smart-class-6f3a8`). They don't match!

---

## The Solution: Generate New Service Account Key

You need to create a NEW service account key for the NEW Firebase project.

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/project/smart-class-6f3a8/settings/serviceaccounts/adminsdk
2. Make sure you're in project: **smart-class-6f3a8** (check top left)

### Step 2: Generate New Private Key

1. Click **Firebase Admins SDK** tab (if not already selected)
2. Select language: **Node.js**
3. Click **Generate New Private Key** button
4. A file `smart-class-6f3a8-******.json` will download

### Step 3: Replace Old Key

1. Open the downloaded file
2. Go to your project folder
3. Find: `serviceAccountKey.json` (in project root)
4. **BACKUP OLD FILE** (optional, but good to keep):
   ```bash
   mv serviceAccountKey.json serviceAccountKey.json.old
   ```
5. **Replace with new file:**
   - Copy content from downloaded `smart-class-6f3a8-******.json`
   - Replace content of `serviceAccountKey.json`
   - Save

---

## Verify the New Key

Check that `serviceAccountKey.json` now contains:

```json
{
  "type": "service_account",
  "project_id": "smart-class-6f3a8",  ← Should be THIS
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "firebase-adminsdk-***@smart-class-6f3a8.iam.gserviceaccount.com",
  ...
}
```

**Key check:**
- ✅ `project_id` should be `smart-class-6f3a8`
- ✅ `client_email` should contain `smart-class-6f3a8`
- ❌ NOT `smu-smart-classroom`

---

## Now Retry

Once you've replaced the service account key:

```bash
node scripts/initializeNewDatabase.mjs
```

**Expected output:**
```
🚀 INITIALIZING NEW FIREBASE DATABASE

📍 Step 1: Initializing Firebase Admin SDK
   ✅ Connected to database

📍 Step 2: Registering service account as admin
   ✅ Service account added as admin

📍 Step 3: Creating initial data structure
   ✅ Initial structure created

...

✅ DATABASE INITIALIZATION COMPLETE!
```

---

## If It Still Fails

**If you still see the warning:**

1. Double-check the `project_id` in `serviceAccountKey.json`
2. Make sure you replaced the ENTIRE file content (not just parts)
3. Make sure there are no extra quotes or corrupted JSON
4. Validate the JSON: https://jsonlint.com/

**If you still get timeout:**

1. Go to Firebase Console > Realtime Database > Rules
2. Verify rules are deployed (check timestamp at bottom)
3. If not deployed, publish them:
   - Copy from `database.rules.json`
   - Paste in Rules editor
   - Click PUBLISH
   - Wait 30 seconds

---

## Quick Checklist

- [ ] Generated NEW private key from Firebase Console
- [ ] Downloaded the `smart-class-6f3a8-...json` file
- [ ] Replaced `serviceAccountKey.json` with new content
- [ ] Verified `project_id` is `smart-class-6f3a8`
- [ ] Verified `client_email` contains `smart-class-6f3a8`
- [ ] Rules are published to new database
- [ ] Ready to retry

---

## Common Mistakes

❌ **Forgot to generate key** - Service account already existed
❌ **Downloaded but didn't replace** - Still using old key
❌ **Only copied part of the file** - JSON is corrupted
❌ **Generated key for wrong project** - Check console shows `smart-class-6f3a8`
❌ **Replaced wrong file** - Make sure it's in project root as `serviceAccountKey.json`

---

## After Replacement

Your setup will be:

```
Project: smart-class-6f3a8
├── Database: smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app ✅
├── Service Account: smart-class-6f3a8-...@smart-class-6f3a8.iam.gserviceaccount.com ✅
└── Credentials: serviceAccountKey.json ✅
```

**Everything matches now!** 🎯

---

## Next Steps

1. Replace serviceAccountKey.json ← DO THIS FIRST
2. Run: `node scripts/initializeNewDatabase.mjs`
3. Should complete successfully
4. Continue with testing and bulk operations
