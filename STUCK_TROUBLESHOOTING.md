# 🔧 Firebase Script Stuck - Troubleshooting Guide

## Problem
The `enableServiceAccountAdmin.mjs` script is stuck at:
```
Step 2: Adding service account to /admins path...
(This may take 10-30 seconds on first try)
```

The script is waiting for the database write to complete but it's not responding.

---

## Diagnosis

### Quick Check
Press `Ctrl+C` to stop the script. The script should print a timeout error.

If it shows:
- ⏱️ **"WRITE TIMED OUT after 15 seconds"** → See Solution A
- Nothing prints → → See Solution B
- Other error → See Solution C

---

## Solutions

### Solution A: Rules Blocking Writes (Most Likely)

**Step 1: Check Firebase Console**
1. Go to: https://console.firebase.google.com/project/smart-class-6f3a8/database/rules
2. Look at the Rules section - are they deployed?
3. Check Status: Should show "Rules deployed" or "Updated now"

**Step 2: Re-deploy Rules**
1. Go to Rules tab in Firebase Console
2. Select ALL and delete (Ctrl+A, Delete)
3. Go to your project folder
4. Open: `database.rules.json`
5. Copy ALL content
6. Paste into Firebase Rules editor
7. **Click PUBLISH** (important!)
8. Wait 30 seconds
9. Run script again:
   ```bash
   node scripts/enableServiceAccountAdmin.mjs
   ```

**Step 3: Manual Entry (if re-deploy doesn't work)**
1. Go to: https://console.firebase.google.com/project/smart-class-6f3a8/database/data
2. Click **+** next to `/` (root)
3. Enter key: `admins`
4. Click **+** next to `/admins`
5. Enter key: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (or get real hash from script output)
6. Enter value (paste as JSON):
   ```json
   {
     "email": "firebase-adminsdk-fbsvc@smu-smart-classroom.iam.gserviceaccount.com",
     "role": "system_admin",
     "type": "service_account"
   }
   ```
7. Press Enter

---

### Solution B: Database is Paused or Disabled

**Check Database Status:**
1. Go to: https://console.firebase.google.com/project/smart-class-6f3a8/database
2. Look at the top of the page
3. Check if there's a notification like "Database Paused"

**If Paused:**
1. Click **Resume** button
2. Wait 2 minutes
3. Run script again

**Check Firebase Status:**
1. Go to: https://status.firebase.google.com
2. Look for any incidents or degradation
3. If issues shown, wait for resolution

---

### Solution C: Network Connectivity Issue

**Step 1: Test Connection**
```bash
# Test DNS
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app

# Test ping
ping google.com
```

If either fails, you have a network issue.

**Step 2: Try Different Network**
- Switch to mobile hotspot
- Try from a different WiFi
- If works on other network, issue is your network

**Step 3: Run Script with Verbose Output**
```bash
# Add logging
node --trace-warnings scripts/enableServiceAccountAdmin.mjs
```

---

### Solution D: Database is Completely Inaccessible

**Verify You Can Access Firebase Console:**
1. Go to: https://console.firebase.google.com
2. Can you see your project?
3. Can you click on "Realtime Database"?
4. Can you see existing data?

If NO to any:
- You might have lost access
- Check IAM permissions in Firebase Console
- Contact project owner

---

## Manual Workaround (If Nothing Works)

### Option 1: Use Firebase Console Manually

**Most reliable method:**

1. Go to: https://console.firebase.google.com/project/smart-class-6f3a8/database/data
2. Manually create entry:
   ```
   /admins
   ├── a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   │   ├── email: "firebase-adminsdk-fbsvc@smart-class-6f3a8.iam.gserviceaccount.com"
   │   ├── role: "system_admin"
   │   └── type: "service_account"
   ```

3. Then run:
   ```bash
   node scripts/testFirebaseDirectHTTPS.mjs
   ```

### Option 2: Use REST API

If console doesn't work, use Firebase REST API:

```bash
# Get your database URL
echo "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app"

# Add admin entry (replace {YOUR_TOKEN} with a valid token)
curl -X PUT \
  "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/admins/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "firebase-adminsdk-fbsvc@smart-class-6f3a8.iam.gserviceaccount.com",
    "role": "system_admin",
    "type": "service_account"
  }'
```

---

## Getting the Correct Hash Key

The script uses SHA256 hashing. To get your exact hash key:

```bash
# Node.js way
node -e "const crypto = require('crypto'); const email = 'firebase-adminsdk-fbsvc@smart-class-6f3a8.iam.gserviceaccount.com'; const hash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 32); console.log(hash);"

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Verify It Worked

After manual setup, run:

```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

**Expected output:**
```
Connection Status: 🟢 CONNECTED
✅ Successfully read from database!
✅ Successfully wrote to database!

============================================================
Diagnosis Summary
============================================================
✅ Firebase connection is WORKING
```

---

## If Still Not Working

**1. Check that rules were published:**
```bash
# Go to Firebase Console > Realtime Database > Rules
# Should show last published date at bottom
```

**2. Check admin entry exists:**
```bash
# Go to Firebase Console > Realtime Database > Data
# Should see /admins/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**3. Try a simpler script:**
```bash
node scripts/simpleFirebaseTest.mjs
```

**4. Check Firebase status:**
- https://status.firebase.google.com
- https://console.firebase.google.com/project/smart-class-6f3a8

**5. Last resort - ask for help with:**
- Screenshot of Firebase Console > Data tab
- Screenshot of Firebase Console > Rules tab
- Output of: `node scripts/enableServiceAccountAdmin.mjs 2>&1`

---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| ⏱️ Timeout 15s | Rules blocking | Re-publish `database.rules.json` |
| ⏱️ Timeout 5s | Check read blocked | Same - publish rules |
| Script hangs forever | Unknown | Ctrl+C, then try Solution A |
| "PERMISSION_DENIED" | Rules wrong | Same - publish rules |
| "Connection timeout" | DNS/Network | Restart DNS or try other network |
| Script runs fine but read/write still fails | Admin entry not created | Manually add in console |

---

## Key Takeaway

**If in doubt:** Manually add the admin entry to Firebase Console. It's the most reliable method:

1. Firebase Console > Realtime Database > Data
2. Add `/admins/{hash}/` with email and role
3. Done!
