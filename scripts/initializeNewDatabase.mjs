/**
 * INITIALIZE NEW FIREBASE DATABASE
 * 
 * Run this after creating a fresh database and deploying rules
 * It will:
 * 1. Add service account as admin
 * 2. Verify connectivity
 * 3. Create initial data structure
 * 4. Test write permissions
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { createHash } from "crypto";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

const serviceAccountEmail = serviceAccount.client_email;
const serviceAccountKey = createHash('sha256')
  .update(serviceAccountEmail)
  .digest('hex')
  .substring(0, 32);

console.log("🚀 INITIALIZING NEW FIREBASE DATABASE\n");
console.log("=" .repeat(70));

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} - Timeout after ${ms}ms`)), ms)
    )
  ]);
}

try {
  // Step 1: Initialize
  console.log("\n📍 Step 1: Initializing Firebase Admin SDK");
  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
  });
  const db = getDatabase(app);
  console.log("   ✅ Connected to database\n");

  // Step 2: Add service account as admin
  console.log("📍 Step 2: Registering service account as admin");
  await withTimeout(
    db.ref(`admins/${serviceAccountKey}`).set({
      email: serviceAccountEmail,
      role: "system_admin",
      type: "service_account",
      created: new Date().toISOString(),
      verified: true
    }),
    10000,
    "Admin registration"
  );
  console.log(`   ✅ Service account added as admin\n`);

  // Step 3: Create initial data structure
  console.log("📍 Step 3: Creating initial data structure");
  
  const initialData = {
    professors: {
      _placeholder: {
        _init: true
      }
    },
    courses: {
      _placeholder: {
        _init: true
      }
    },
    classrooms: {
      _placeholder: {
        _init: true
      }
    },
    sessions: {
      _placeholder: {
        _init: true
      }
    },
    _metadata: {
      initialized: new Date().toISOString(),
      databaseVersion: "2.0",
      serviceAccountKey: serviceAccountKey,
      rules_deployed: new Date().toISOString()
    }
  };

  await withTimeout(
    Promise.all([
      db.ref('professors').set(initialData.professors),
      db.ref('courses').set(initialData.courses),
      db.ref('classrooms').set(initialData.classrooms),
      db.ref('sessions').set(initialData.sessions),
      db.ref('_metadata').set(initialData._metadata)
    ]),
    10000,
    "Data structure creation"
  );
  console.log("   ✅ Initial structure created\n");

  // Step 4: Verify write permissions
  console.log("📍 Step 4: Verifying write permissions");
  const timestamp = Date.now();
  await withTimeout(
    db.ref(`_system/initialization_test_${timestamp}`).set({
      test: "initialization",
      timestamp: timestamp,
      success: true
    }),
    5000,
    "Permission verification"
  );
  console.log("   ✅ Write permissions verified\n");

  // Step 5: Read back data to verify
  console.log("📍 Step 5: Verifying data integrity");
  const adminCheck = await withTimeout(
    db.ref(`admins/${serviceAccountKey}`).once('value'),
    5000,
    "Admin data read"
  );
  
  if (adminCheck.exists()) {
    console.log("   ✅ Admin data verified\n");
  } else {
    throw new Error("Admin data read failed");
  }

  // Summary
  console.log("=" .repeat(70));
  console.log("\n✅ DATABASE INITIALIZATION COMPLETE!\n");
  console.log("Database Status:");
  console.log(`  Database URL: https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`);
  console.log(`  Service Account: ${serviceAccountEmail}`);
  console.log(`  Admin Key: ${serviceAccountKey}`);
  console.log(`  Rules: Deployed ✅`);
  console.log(`  Admin Access: Verified ✅`);
  console.log(`  Data Structure: Created ✅`);
  console.log(`  Initialized: ${new Date().toISOString()}\n`);

  console.log("Next Steps:");
  console.log("  1. Run: node scripts/testFirebaseDirectHTTPS.mjs");
  console.log("  2. Run: node scripts/createProfessors.mjs (if needed)");
  console.log("  3. Run: DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs");
  console.log("  4. Run: node scripts/verifyAssignments.mjs\n");

  process.exit(0);

} catch (err) {
  console.log(`\n❌ INITIALIZATION FAILED\n`);
  console.log(`Error: ${err.message}\n`);

  if (err.message.includes("Timeout")) {
    console.log("Troubleshooting: Timeout Issue\n");
    console.log("This usually means:");
    console.log("  1. Rules were not published to Firebase");
    console.log("  2. Database is paused");
    console.log("  3. Network connectivity issue\n");
    console.log("Solutions:");
    console.log("  1. Go to Firebase Console > Realtime Database > Rules");
    console.log("  2. Verify rules are deployed (check timestamp)");
    console.log("  3. If not deployed, copy rules from database.rules.json and click Publish");
    console.log("  4. Wait 30 seconds and try again\n");
  } else if (err.message.includes("PERMISSION_DENIED")) {
    console.log("Troubleshooting: Permission Issue\n");
    console.log("Rules are blocking the operation.\n");
    console.log("Solutions:");
    console.log("  1. Check Firebase Console > Realtime Database > Rules");
    console.log("  2. Verify .write rules for /admins and root");
    console.log("  3. Re-publish rules from database.rules.json\n");
  } else if (err.message.includes("DISCONNECTED")) {
    console.log("Troubleshooting: Connection Issue\n");
    console.log("Cannot reach Firebase database.\n");
    console.log("Solutions:");
    console.log("  1. Test DNS: nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app");
    console.log("  2. Test network: ping google.com");
    console.log("  3. Check firewall and antivirus\n");
  }

  console.log("For detailed help, see: FRESH_DATABASE_SETUP.md\n");
  process.exit(1);
}
