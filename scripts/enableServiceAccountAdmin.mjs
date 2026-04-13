/**
 * Enable Service Account as Admin
 * 
 * Adds the service account to the /admins path so it can write to protected
 * database paths like /courses and /sessions
 * 
 * This MUST be run from a system where the database is accessible,
 * or manually add the following to Firebase:
 * 
 * Path: /admins/{SERVICE_ACCOUNT_UID}
 * Data: { role: "system_admin", created: timestamp }
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { createHash } from "crypto";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

console.log("🔐 ENABLING SERVICE ACCOUNT AS ADMIN\n");
console.log("=" .repeat(60));

const serviceAccountEmail = serviceAccount.client_email;
const serviceAccountKey = createHash('sha256')
  .update(serviceAccountEmail)
  .digest('hex')
  .substring(0, 32);

console.log(`Service Account: ${serviceAccountEmail}`);
console.log(`Service Account Hash Key: ${serviceAccountKey}\n`);

// Add timeout wrapper
function withTimeout(promise, timeoutMs, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
}

try {
  console.log("Step 1: Initializing Firebase Admin SDK...");
  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
  });
  console.log("✅ Firebase initialized\n");

  const db = getDatabase(app);

  console.log("Step 2: Adding service account to /admins path...");
  console.log("(This may take 10-30 seconds on first try)\n");

  // Check existing entry first (with timeout)
  const checkPromise = withTimeout(
    db.ref(`admins/${serviceAccountKey}`).once('value'),
    5000,
    "Check timed out after 5s"
  );

  const snapshot = await checkPromise;
  
  if (snapshot.exists()) {
    console.log(`⚠️  Admin entry already exists\n`);
    console.log("Admin data:");
    console.log(JSON.stringify(snapshot.val(), null, 2));
  } else {
    console.log("No existing entry. Writing admin data...\n");
    
    // Write with timeout
    const writePromise = withTimeout(
      db.ref(`admins/${serviceAccountKey}`).set({
        email: serviceAccountEmail,
        role: "system_admin",
        created: new Date().toISOString(),
        type: "service_account",
        description: "Service account for bulk operations and automation"
      }),
      15000,
      "Write operation timed out after 15 seconds - this may indicate permission issues"
    );

    try {
      await writePromise;
      console.log(`✅ Admin entry created\n`);
    } catch (writeErr) {
      if (writeErr.message.includes("timed out")) {
        console.log(`⏱️  WRITE TIMED OUT\n`);
        console.log("The write operation did not complete in 15 seconds.");
        console.log("This usually means one of:");
        console.log("  1. Firebase rules are BLOCKING the write");
        console.log("  2. Database is paused/disabled");
        console.log("  3. Network is very slow\n");
        console.log("SOLUTION:");
        console.log("Option A: Try manual entry (see below)");
        console.log("Option B: Check Firebase Console > Database > Rules > Publish\n");
        
        // Give user a manual workaround
        console.log("MANUAL WORKAROUND:");
        console.log("1. Go to: https://console.firebase.google.com");
        console.log("2. Realtime Database > Data tab");
        console.log("3. Click + button next to / (root)");
        console.log("4. Create entry:");
        console.log(`   Key: admins`);
        console.log("5. Click + button next to /admins");
        console.log("6. Create entry:");
        console.log(`   Key: ${serviceAccountKey}`);
        console.log("7. Set value to:");
        console.log(`   { "email": "${serviceAccountEmail}", "role": "system_admin" }\n`);
        
        process.exit(1);
      }
      throw writeErr;
    }
  }

  // Verify write by testing a small operation (with timeout)
  console.log("Step 3: Verifying admin permissions...");
  const verifyPromise = withTimeout(
    db.ref(`_system/serviceAccountTest`).set({
      timestamp: Date.now(),
      testMessage: "Admin write test"
    }),
    10000,
    "Verification write timed out"
  );

  try {
    await verifyPromise;
    console.log("✅ Admin write verified\n");
  } catch (verifyErr) {
    if (verifyErr.message.includes("timed out")) {
      console.log(`⏱️  VERIFICATION TIMED OUT\n`);
      console.log("The admin verification write also timed out.");
      console.log("This indicates a systematic issue:\n");
      console.log("Possible causes:");
      console.log("  1. Rules not published - check Firebase Console");
      console.log("  2. Database write disabled - check Firebase status");
      console.log("  3. Network connectivity issue\n");
      console.log("Check: https://status.firebase.google.com\n");
      process.exit(1);
    }
    throw verifyErr;
  }

  console.log("=" .repeat(60));
  console.log("✅ SUCCESS - SERVICE ACCOUNT IS NOW ADMIN!\n");
  console.log("Firebase Database Entry:");
  console.log(`/admins/${serviceAccountKey}`);
  console.log(`  ├── email: ${serviceAccountEmail}`);
  console.log(`  ├── role: system_admin`);
  console.log(`  ├── type: service_account`);
  console.log(`  └── created: ${new Date().toISOString()}\n`);
  
  console.log("You can now run:");
  console.log("  node scripts/testFirebaseDirectHTTPS.mjs");
  console.log("  DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs\n");
  
  process.exit(0);

} catch (err) {
  console.log(`\n❌ FAILED: ${err.message}\n`);
  
  if (err.message.includes("timed out")) {
    console.log("TIMEOUT ERROR - The operation is taking too long.\n");
    console.log("This usually means:");
    console.log("  • Firebase rules are blocking the operation");
    console.log("  • Database is paused or disabled");
    console.log("  • Network is experiencing issues\n");
    console.log("VERIFY:");
    console.log("1. Go to Firebase Console > Realtime Database");
    console.log("2. Check Rules tab - are they published?");
    console.log("3. Check Data tab - can you manually add data?\n");
  } else if (err.message.includes("PERMISSION_DENIED")) {
    console.log("PERMISSION ERROR - Rules are blocking writes.\n");
    console.log("SOLUTION:");
    console.log("1. Go to: https://console.firebase.google.com");
    console.log("2. Select: smu-smart-classroom");
    console.log("3. Realtime Database > Rules tab");
    console.log("4. Copy from: database.rules.json in this project");
    console.log("5. Paste into Firebase Rules editor");
    console.log("6. Click Publish");
    console.log("7. Wait 30 seconds");
    console.log("8. Run this script again\n");
  } else if (err.message.includes("DISCONNECTED")) {
    console.log("CONNECTION ERROR - Cannot reach Firebase.\n");
    console.log("Check DNS or network:");
    console.log("  nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app\n");
  }
  
  console.log("MANUAL FALLBACK:");
  console.log("Add this to Firebase Console > Database > Data:");
  console.log(`/admins/${serviceAccountKey} = `);
  console.log(`{`);
  console.log(`  "email": "${serviceAccountEmail}",`);
  console.log(`  "role": "system_admin"`);
  console.log(`}\n`);
  
  process.exit(1);
}
