# 🚨 FIX: Invalid Credentials Error

## The Error You Got

```
FIREBASE WARNING: Provided authentication credentials are invalid.
This usually indicates your app was not initialized correctly.
```

## Why It Happened

```
❌ OLD SERVICE ACCOUNT (smu-smart-classroom project)
     ↓
   Used to connect to
     ↓
✅ NEW DATABASE (smart-class-6f3a8 project)
     ↓
   Result: DOESN'T MATCH → Invalid credentials error
```

## The Fix (5 minutes)

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/smart-class-6f3a8/settings/serviceaccounts/adminsdk

**Make sure top left says: `smart-class-6f3a8`** (not `smu-smart-classroom`)

### Step 2: Generate New Key
1. Click **Firebase Admin SDK** tab
2. Click **Generate New Private Key**
3. Save the downloaded file

### Step 3: Replace Old Key
```bash
# Backup old (optional)
mv serviceAccountKey.json serviceAccountKey.json.old

# Option A: Copy-paste the content
# - Open downloaded file
# - Copy all content
# - Paste into serviceAccountKey.json
# - Save

# Option B: Replace directly
# cp ~/Downloads/smart-class-6f3a8-*.json serviceAccountKey.json
```

### Step 4: Verify
Open `serviceAccountKey.json` and check:
```json
{
  "project_id": "smart-class-6f3a8",  ← MUST be this
  "client_email": "firebase-adminsdk-***@smart-class-6f3a8.iam.gserviceaccount.com"
}
```

### Step 5: Retry
```bash
node scripts/initializeNewDatabase.mjs
```

---

## Before vs After

### ❌ BEFORE (Wrong)
```
serviceAccountKey.json
└── project_id: "smu-smart-classroom"
    client_email: "...@smu-smart-classroom.iam..."
    
Connecting to:
└── Database: smart-class-6f3a8-...
    
Result: MISMATCH → Invalid credentials ❌
```

### ✅ AFTER (Correct)
```
serviceAccountKey.json
└── project_id: "smart-class-6f3a8"
    client_email: "...@smart-class-6f3a8.iam..."
    
Connecting to:
└── Database: smart-class-6f3a8-...
    
Result: MATCH → ✅ Works!
```

---

## Detailed Guide

For full instructions, see: **CRITICAL_SERVICE_ACCOUNT_MISMATCH.md**

---

## Done?

Once replaced, try again:
```bash
node scripts/initializeNewDatabase.mjs
```

Should show ✅ SUCCESS 🚀
