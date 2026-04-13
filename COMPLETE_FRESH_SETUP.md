# 🎯 COMPLETE FRESH DATABASE SETUP - Step by Step

## Overview
This guide walks you through creating a completely fresh Firebase database with correct rules from the start. No permission issues, no rule conflicts, just a clean slate.

**Total time:** 10-15 minutes

---

## Phase 1: Delete Old Database (5 minutes)

### Step 1.1: Backup Old Data (Optional)

If you need the old data:
```bash
# Export current database (requires firebase-cli)
firebase database:get / > database_backup.json
```

### Step 1.2: Delete Database

1. Open: https://console.firebase.google.com/project/smart-class-6f3a8
2. Click **Realtime Database** in left sidebar
3. Click **Database Settings** (⚙️ icon)
4. Scroll down to **Delete database** section
5. Click **Delete database** button
6. Type the database name to confirm
7. Click **Delete**

⏳ Wait 2-3 minutes for deletion to complete

---

## Phase 2: Create New Database (3 minutes)

### Step 2.1: Create Database

1. Go back to: https://console.firebase.google.com/project/smart-class-6f3a8
2. Click **Realtime Database**
3. Click **+ Create database**

### Step 2.2: Configure Database

**Dialog appears:**

- **Location:** Select `europe-west1` (EU - Belgium)
  - ⚠️ Important: Same region as before
- **Rules:** Select `Start in test mode`
  - ⚠️ Don't worry, we'll replace immediately
- Click **Enable**

⏳ Wait for database to initialize (1-2 minutes)

---

## Phase 3: Deploy Correct Rules (3 minutes)

### Step 3.1: Navigate to Rules

Once database created:
1. Click **Realtime Database** tab
2. Click **Rules** tab (not "Data")

### Step 3.2: Deploy Rules

1. You'll see a template starting with `{ "rules": {`
2. Select ALL content: `Ctrl+A`
3. Delete: `Delete`
4. Now paste this:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "false",
    "professors": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists() === true",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists() === true",
        ".validate": "newData.hasChildren(['name', 'email', 'moodleUserId'])"
      }
    },
    "courses": {
      "$courseId": {
        ".read": "true",
        ".write": "root.child('admins').child(auth.uid).exists() === true",
        ".validate": "newData.hasChildren(['code', 'name'])"
      }
    },
    "classrooms": {
      "$roomId": {
        ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
        ".write": "root.child('admins').child(auth.uid).exists() === true",
        "activeSession": {
          ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
          ".write": "false"
        },
        "sensors": {
          ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
          ".write": "false"
        },
        "devices": {
          ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
          ".write": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true"
        },
        "attendance": {
          "$sessionId": {
            ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
            ".write": "root.child('professors').child(auth.uid).child('assignedRooms').child($roomId).exists() || root.child('admins').child(auth.uid).exists() === true",
            "students": {
              "$studentId": {
                ".validate": "newData.hasChildren(['name', 'present'])"
              }
            }
          }
        }
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": "root.child('professors').child(auth.uid).child('assignedRooms').child(data.child('roomId').val()).exists() || root.child('admins').child(auth.uid).exists() === true",
        ".write": "root.child('admins').child(auth.uid).exists() === true",
        ".validate": "newData.hasChildren(['id', 'courseId', 'roomId', 'date', 'startTime', 'professorId'])"
      }
    },
    "admins": {
      ".read": "true",
      "$uid": {
        ".read": "true",
        ".write": "root.child('admins').child(auth.uid).exists() === true"
      }
    }
  }
}
```

### Step 3.3: Publish Rules

1. You should see a **PUBLISH** button (bottom right)
2. Click **PUBLISH**
3. Wait for ✅ "Rules published" confirmation
4. Wait another 30 seconds for propagation

---

## Phase 4: Initialize Database (2 minutes)

### Step 4.1: Run Initialization Script

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

📍 Step 4: Verifying write permissions
   ✅ Write permissions verified

📍 Step 5: Verifying data integrity
   ✅ Admin data verified

============================================================

✅ DATABASE INITIALIZATION COMPLETE!

Database Status:
  Database URL: https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
  Service Account: firebase-adminsdk-fbsvc@smart-class-6f3a8.iam.gserviceaccount.com
  Admin Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  Rules: Deployed ✅
  Admin Access: Verified ✅
  Data Structure: Created ✅
```

### Step 4.2: If Script Fails

Common issues and fixes:

| Error | Solution |
|-------|----------|
| Timeout | Rules not published - go back to Step 3.3 |
| PERMISSION_DENIED | Re-check rules syntax from Step 3.2 |
| Connection error | Test DNS: `nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app` |

---

## Phase 5: Test Connection (2 minutes)

### Step 5.1: Test Firebase Connection

```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

**Expected output:**
```
Connection Status: 🟢 CONNECTED
✅ Successfully read from database!
✅ Successfully wrote to database!
```

If this shows ✅ CONNECTED, you're ready for the next step!

---

## Phase 6: Load Data (Optional, 2 minutes)

### Option A: Create Data from Scratch

```bash
# Create professors (if you have a source)
node scripts/createProfessors.mjs

# Seed courses and sessions
node scripts/seedFirebaseSessions.mjs
```

### Option B: Import from Backup

If you exported data in Step 1.1:

```bash
# Import the backup
firebase database:set / database_backup.json
```

---

## Phase 7: Run Bulk Operations (3 minutes)

### Step 7.1: Dry Run (Preview)

```bash
# See what will happen without making changes
node scripts/bulkAssignCoursesToProfessors.mjs
```

### Step 7.2: Actual Run

```bash
# Make the actual changes
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
```

### Step 7.3: Verify

```bash
# Confirm everything worked
node scripts/verifyAssignments.mjs
```

---

## Troubleshooting

### Database Creation Hangs
- Wait 5 minutes
- Refresh browser: F5
- If still stuck, refresh Firebase Console

### Rules Won't Publish
- Check for JSON syntax errors (use online JSON validator)
- Look for red squiggly lines in the editor
- Fix the JSON and try again

### Script Says "Timeout"
- Go to Firebase Console > Rules tab
- Check that "Rules published" is shown at bottom
- If not, rules didn't deploy - click PUBLISH again

### Connection Test Fails
- Check DNS: `nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`
- Check network: `ping google.com`
- Restart DNS service if needed

### Still Not Working?
- Make sure you deleted OLD database (don't have two)
- Make sure region is `europe-west1` (not us-central1)
- Make sure rules are JSON valid (no syntax errors)
- Wait 1-2 minutes for Firebase to fully propagate changes

---

## Verification Checklist

After completing all steps:

- [ ] Old database deleted
- [ ] New database created in europe-west1
- [ ] Rules deployed and published
- [ ] Initialization script ran successfully (✅ outputs)
- [ ] Connection test shows 🟢 CONNECTED
- [ ] No errors in console
- [ ] Data visible in Firebase Console > Data tab

---

## Quick Reference

```bash
# Quick sequence to run everything
node scripts/initializeNewDatabase.mjs
node scripts/testFirebaseDirectHTTPS.mjs
node scripts/bulkAssignCoursesToProfessors.mjs
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
node scripts/verifyAssignments.mjs
```

---

## Success Indicators

✅ You'll know it's working when:
- All scripts complete without timeout errors
- Connection test shows "🟢 CONNECTED"
- Bulk assign script completes in 30-60 seconds
- Verify script confirms all assignments created
- Firebase Console > Data tab shows populated data

---

## Support

If you encounter issues:

1. Check: `FRESH_DATABASE_SETUP.md` (quick reference)
2. See: `STUCK_TROUBLESHOOTING.md` (detailed troubleshooting)
3. Review: Error messages in console output

Good luck! 🚀
