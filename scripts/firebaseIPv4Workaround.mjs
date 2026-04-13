/**
 * FIREBASE CONNECTION - IPv4 WORKAROUND
 * 
 * Bypasses IPv6 DNS issues by forcing IPv4 resolution in Node.js
 */

import dns from 'dns';
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 FIREBASE CONNECTION - IPv4 WORKAROUND\n");

// Force IPv4 DNS resolution
dns.setDefaultResultOrder('ipv4first');

// Also explicitly configure DNS to use IPv4 servers only
const dnsPromises = dns.promises;

console.log("1️⃣  Testing DNS resolution (IPv4 only)...");
try {
  const address = await dnsPromises.resolve4('europe-west1.firebasedatabase.app');
  console.log(`   ✅ Resolved: ${address[0]}\n`);
} catch (err) {
  console.log(`   ⚠️  IPv4 resolution failed: ${err.message}`);
  console.log(`   Trying with explicit DNS...\n`);
}

// Read service account
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../serviceAccountKey.json"), "utf8")
);

console.log("2️⃣  Initializing Firebase Admin SDK...");
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

console.log("3️⃣  Testing database connection (with timeout)...");
const db = getDatabase();

const connectionPromise = new Promise((resolve) => {
  const ref = db.ref('.info/connected');
  
  let resolved = false;
  
  const onceListener = (snap) => {
    if (!resolved) {
      resolved = true;
      ref.off('value', onceListener);
      resolve(snap.val());
    }
  };
  
  ref.on('value', onceListener);
  
  // Timeout after 15 seconds (longer for IPv4 fallback)
  setTimeout(() => {
    if (!resolved) {
      resolved = true;
      ref.off('value', onceListener);
      resolve('timeout');
    }
  }, 15000);
});

const result = await connectionPromise;

if (result === true) {
  console.log("   ✅ CONNECTED!\n");
  console.log("✅ SUCCESS - Firebase is working!\n");
  console.log("Next step:");
  console.log("   DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs\n");
  process.exit(0);
} else if (result === false) {
  console.log("   ⚠️  OFFLINE\n");
  console.log("❌ Firebase is in offline mode\n");
  console.log("Remaining options:");
  console.log("1. Edit Windows hosts file to add Firebase IP");
  console.log("2. Wait 1-2 minutes and try again");
  console.log("3. Restart your computer");
  console.log("4. Check if internet is working: ping google.com\n");
  process.exit(1);
} else if (result === 'timeout') {
  console.log("   ⏱️  TIMEOUT\n");
  console.log("❌ Connection timed out\n");
  process.exit(1);
} else {
  console.log(`   ❓ UNKNOWN: ${result}\n`);
  process.exit(1);
}
