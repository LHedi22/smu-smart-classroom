# ✅ FIREBASE FIX - QUICK START

## Problem
```
❌ FAILED: Paths can't contain "." 
Error from: admins/firebase-adminsdk-fbsvc@smu-smart-classroom.iam.gserviceaccount.com
```

Firebase doesn't allow dots in database keys, but your service account email has dots.

---

## Solution (3 Steps)

### 1️⃣ Deploy Updated Rules to Firebase

1. Go to: https://console.firebase.google.com/project/smart-class-6f3a8/database/rules
2. Delete all existing rules
3. Copy **ALL** content from: `database.rules.json` (in your project)
4. Paste into Firebase Console Rules editor
5. Click **Publish**
6. Wait 10 seconds

### 2️⃣ Run Setup Script

```bash
node scripts/enableServiceAccountAdmin.mjs
```

**Should see:**
```
✅ SUCCESS - SERVICE ACCOUNT IS NOW ADMIN!
```

### 3️⃣ Test & Run

```bash
# Test connection
node scripts/testFirebaseDirectHTTPS.mjs

# Run bulk assignment
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
```

---

## What Was Fixed

| Issue | Fix |
|-------|-----|
| Email has dots (`.`) | Use SHA256 hash of email as key instead |
| Rules too restrictive | Updated rules syntax for service accounts |
| No way to auto-add admin | Created automation script |

---

## What Gets Created

In your Firebase database:
```
/admins/
├── a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6  ← Hashed service account
│   ├── email: "firebase-adminsdk-fbsvc@smu-smart-classroom.iam.gserviceaccount.com"
│   ├── role: "system_admin"
│   ├── type: "service_account"
│   └── created: "2026-04-09..."
```

---

## Files Changed

✅ `scripts/enableServiceAccountAdmin.mjs` - Fixed with hashing  
✅ `database.rules.json` - Updated for service accounts  
✅ `SERVICE_ACCOUNT_FIX.md` - Full documentation  

---

## If DNS Fix Doesn't Work

**"PERMISSION_DENIED" error?**
- Rules aren't deployed yet
- Go back to Step 1, make sure to click "Publish"

**"Connection timeout"?**
- DNS issue from earlier
- Run: `nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`
- If no result, restart DNS: `Restart-Service -Name "dnscache" -Force`

**"Invalid path" still?**
- Clear browser cache and refresh Firebase Console
- Try Step 1 again with fresh copy of `database.rules.json`

---

## Done! 🎉

Once working, your console will show:
```
🟢 CONNECTED
✅ Successfully read from database!
✅ Successfully wrote to database!
```
