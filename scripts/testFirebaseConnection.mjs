/**
 * FIREBASE CONNECTION TROUBLESHOOTER
 * 
 * Diagnoses Firebase connectivity issues
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔧 FIREBASE CONNECTION TROUBLESHOOTER\n");

// Check 1: serviceAccountKey.json exists
console.log("1️⃣  Checking serviceAccountKey.json...");
const keyPath = resolve(__dirname, "../serviceAccountKey.json");
console.log(`   Path: ${keyPath}`);

if (!existsSync(keyPath)) {
  console.log(`   ❌ NOT FOUND`);
  console.log(`\n   Fix:`);
  console.log(`   1. Download from Firebase Console:`);
  console.log(`      https://console.firebase.google.com`);
  console.log(`   2. Project → Settings → Service Accounts`);
  console.log(`   3. "Generate New Private Key"`);
  console.log(`   4. Save as: serviceAccountKey.json (in project root)`);
  process.exit(1);
}

console.log(`   ✅ File exists\n`);

// Check 2: Valid JSON
console.log("2️⃣  Checking JSON validity...");
let serviceAccount;
try {
  const content = readFileSync(keyPath, "utf8");
  serviceAccount = JSON.parse(content);
  console.log(`   ✅ Valid JSON\n`);
} catch (err) {
  console.log(`   ❌ Invalid JSON: ${err.message}`);
  console.log(`\n   Fix: Download fresh serviceAccountKey.json from Firebase Console\n`);
  process.exit(1);
}

// Check 3: Required fields
console.log("3️⃣  Checking required fields...");
const required = ["type", "project_id", "private_key", "client_email"];
const missing = required.filter(f => !serviceAccount[f]);

if (missing.length > 0) {
  console.log(`   ❌ Missing: ${missing.join(", ")}`);
  console.log(`\n   Fix: Download fresh serviceAccountKey.json from Firebase Console\n`);
  process.exit(1);
}

console.log(`   ✅ All required fields present`);
console.log(`   Project: ${serviceAccount.project_id}\n`);

// Check 4: Firebase initialization
console.log("4️⃣  Initializing Firebase Admin SDK...");
try {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
  });
  console.log(`   ✅ SDK initialized\n`);
} catch (err) {
  console.log(`   ❌ Initialization failed: ${err.message}`);
  console.log(`\n   Fix: Check that project_id matches Firebase project\n`);
  process.exit(1);
}

// Check 5: Database connection
console.log("5️⃣  Attempting database connection...");
const db = getDatabase();

try {
  const testRef = db.ref('.info/connected');
  const snap = await testRef.once('value');
  const connected = snap.val();

  if (connected === true) {
    console.log(`   ✅ Connected to Firebase Realtime Database\n`);
  } else if (connected === false) {
    console.log(`   ⚠️  Offline mode\n`);
    console.log(`   Possible causes:`);
    console.log(`   - Network connectivity issue`);
    console.log(`   - Firebase service temporary outage`);
    console.log(`   - Firewall blocking Firebase`);
    console.log(`\n   Solution: Check internet connection and try again\n`);
    process.exit(1);
  } else {
    console.log(`   ❌ Unexpected response: ${connected}\n`);
    process.exit(1);
  }
} catch (err) {
  console.log(`   ❌ Connection failed: ${err.message}\n`);
  console.log(`   Possible causes:`);
  console.log(`   - Invalid database URL`);
  console.log(`   - Firebase credentials invalid`);
  console.log(`   - Network connectivity issue`);
  console.log(`   - Firewall blocking Firebase`);
  console.log(`\n   Solution:`);
  console.log(`   1. Check internet connection`);
  console.log(`   2. Verify database URL is correct`);
  console.log(`   3. Download fresh serviceAccountKey.json`);
  console.log(`   4. Check Firebase console is accessible`);
  process.exit(1);
}

// Check 6: Read permission
console.log("6️⃣  Testing read permissions...");
try {
  const testRead = await db.ref('professors').once('value');
  const count = testRead.val() ? Object.keys(testRead.val()).length : 0;
  console.log(`   ✅ Can read database`);
  console.log(`   Professors found: ${count}\n`);
} catch (err) {
  console.log(`   ❌ Read failed: ${err.message}`);
  console.log(`   This means Firebase rules may be blocking reads\n`);
  process.exit(1);
}

// Check 7: Write permission
console.log("7️⃣  Testing write permissions...");
try {
  const testPath = `_test_write_${Date.now()}`;
  await db.ref(testPath).set({ test: true });
  await db.ref(testPath).remove();
  console.log(`   ✅ Can write to database\n`);
} catch (err) {
  console.log(`   ❌ Write failed: ${err.message}`);
  console.log(`   This means Firebase rules may be blocking writes`);
  console.log(`   OR you don't have admin access\n`);
  process.exit(1);
}

// All checks passed
console.log(`${"=".repeat(60)}`);
console.log("✅ ALL CHECKS PASSED");
console.log(`${"=".repeat(60)}`);
console.log(`\nFirebase is connected and working!`);
console.log(`\nNow run:`);
console.log(`  node scripts/bulkAssignCoursesToProfessors.mjs\n`);

process.exit(0);
