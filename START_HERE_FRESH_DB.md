# ⚡ FRESH DATABASE - 7-STEP QUICK START

## 🎯 Goal
Create a brand new Firebase database with correct rules. No permission issues. Just clean.

**Total Time: 15 minutes**

---

## Step 1️⃣: Delete Old Database
- Go to: https://console.firebase.google.com/project/smart-class-6f3a8
- Click **Realtime Database** → **Database Settings** (⚙️)
- Click **Delete database**
- Type name to confirm, click **Delete**
- ⏳ Wait 2-3 minutes

---

## Step 2️⃣: Create New Database
- Go to: https://console.firebase.google.com/project/smart-class-6f3a8
- Click **Realtime Database**
- Click **+ Create database**
- Select region: **europe-west1**
- Select rules: **Start in test mode**
- Click **Enable**
- ⏳ Wait 1-2 minutes

---

## Step 3️⃣: Deploy Correct Rules
- Click **Realtime Database** → **Rules** tab
- Select ALL: `Ctrl+A`
- Delete: `Delete`
- Open file: `database.rules.json` (in your project)
- Copy ALL content
- Paste into Firebase Rules editor
- Click **PUBLISH** button
- ⏳ Wait 30 seconds

---

## Step 4️⃣: Run Initialization
```bash
node scripts/initializeNewDatabase.mjs
```

**Should show:** ✅ DATABASE INITIALIZATION COMPLETE!

---

## Step 5️⃣: Test Connection
```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

**Should show:** 🟢 CONNECTED ✅

---

## Step 6️⃣: Dry Run
```bash
node scripts/bulkAssignCoursesToProfessors.mjs
```

**Should show:** Preview of what will be assigned

---

## Step 7️⃣: Apply Changes
```bash
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
```

**Should complete in:** 30-60 seconds

---

## Verify Success
```bash
node scripts/verifyAssignments.mjs
```

**Should show:** All professors have courses assigned ✅

---

## If Stuck

| Symptom | Fix |
|---------|-----|
| Old DB won't delete | Wait 5 min, refresh browser |
| New DB won't create | Check you have Firebase permission |
| Rules won't publish | Check JSON syntax, look for red lines |
| Initialization timeout | Go to Rules tab, confirm "published" shown |
| Connection test fails | Run: `nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app` |

---

## Full Guides

- **Detailed:** `COMPLETE_FRESH_SETUP.md`
- **Quick Ref:** `FRESH_DATABASE_SETUP.md`
- **Troubleshoot:** `STUCK_TROUBLESHOOTING.md`

---

**You've got this! 🚀**
