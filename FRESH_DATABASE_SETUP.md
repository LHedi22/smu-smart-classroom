# 🚀 FRESH FIREBASE DATABASE SETUP

## Step 1: Create New Database in Firebase Console

**Go to:** https://console.firebase.google.com/project/smart-class-6f3a8/database

### A. Delete Old Database (if you want fresh start)
1. Click **Database Settings** (gear icon)
2. Look for "Delete database" option
3. Click **Delete**
4. Confirm deletion (type the database name)

### B. Create New Database
1. Click **+ Create database** button
2. Choose region: **europe-west1** (same as before to keep consistency)
3. Choose security rules: **Start in test mode** (we'll replace immediately)
4. Click **Enable**

---

## Step 2: Deploy Fresh Rules

Once new database is created:

1. Go to **Realtime Database** → **Rules** tab
2. Delete everything (Ctrl+A, Delete)
3. Copy this entire content:

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

4. **Click PUBLISH**
5. Wait for "Rules updated" confirmation (30-60 seconds)

---

## Step 3: Initialize Admin Service Account

Once rules are deployed:

```bash
node scripts/enableServiceAccountAdmin.mjs
```

**Expected output:**
```
✅ SUCCESS - SERVICE ACCOUNT IS NOW ADMIN!
```

---

## Step 4: Test Connection

```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

**Expected output:**
```
Connection Status: 🟢 CONNECTED
✅ Successfully read from database!
✅ Successfully wrote to database!
```

---

## Step 5: Verify & Run

```bash
# Dry run first
node scripts/bulkAssignCoursesToProfessors.mjs

# Then actual
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs

# Verify
node scripts/verifyAssignments.mjs
```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Create new database in Firebase | Manual in Console |
| 2 | Deploy fresh rules | Copy-paste rules above |
| 3 | Setup admin service account | `node scripts/enableServiceAccountAdmin.mjs` |
| 4 | Test connection | `node scripts/testFirebaseDirectHTTPS.mjs` |
| 5 | Run bulk assignment | `DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs` |

---

## Notes

- New database will be empty (no previous data)
- Service account will be automatically admin
- All rules are fresh and correctly configured
- No permission issues or rule conflicts
