/**
 * SIMPLE FIREBASE CONNECTION TEST
 * 
 * Tests basic Firebase connectivity without dependencies
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🧪 SIMPLE FIREBASE CONNECTION TEST\n");

// Read credentials
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../serviceAccountKey.json"), "utf8")
);

console.log("1️⃣  Initializing Firebase Admin SDK...");
try {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
  });
  console.log("   ✅ Initialized\n");
} catch (err) {
  console.log(`   ❌ Failed: ${err.message}\n`);
  process.exit(1);
}

console.log("2️⃣  Testing database connection...");
const db = getDatabase();

// Set up timeout
const connectionPromise = new Promise((resolve) => {
  const ref = db.ref('.info/connected');
  
  const onceListener = (snap) => {
    ref.off('value', onceListener);
    resolve(snap.val());
  };
  
  ref.on('value', onceListener);
  
  // Timeout after 10 seconds
  setTimeout(() => {
    ref.off('value', onceListener);
    resolve('timeout');
  }, 10000);
});

const result = await connectionPromise;

if (result === true) {
  console.log("   ✅ CONNECTED - Firebase is reachable!\n");
  console.log("✅ SUCCESS - All systems operational\n");
  console.log("Next: Run bulk assignment");
  console.log("   DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs\n");
  process.exit(0);
} else if (result === false) {
  console.log("   ⚠️  OFFLINE - Firebase is in offline mode\n");
  console.log("❌ CONNECTION ISSUE\n");
  console.log("Troubleshooting:\n");
  console.log("1. Check your internet connection");
  console.log("2. Try: ping google.com");
  console.log("3. Try from a different network (mobile hotspot)");
  console.log("4. If on corporate network, contact IT to whitelist Firebase:\n");
  console.log("   - firebase.google.com");
  console.log("   - *.firebaseio.com");
  console.log("   - smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app\n");
  console.log("5. Check Firebase status: https://status.firebase.google.com\n");
  process.exit(1);
} else if (result === 'timeout') {
  console.log("   ⏱️  TIMEOUT - Connection attempt timed out\n");
  console.log("❌ CANNOT REACH FIREBASE\n");
  console.log("Most likely: Firewall is blocking Firebase\n");
  console.log("Solution: Contact IT to whitelist Firebase domains\n");
  process.exit(1);
} else {
  console.log(`   ❓ UNKNOWN - Unexpected result: ${result}\n`);
  process.exit(1);
}
