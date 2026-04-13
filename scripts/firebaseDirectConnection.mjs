/**
 * FIREBASE CONNECTION - DIRECT IP BYPASS
 * 
 * Connects directly to Firebase using IP address instead of domain name
 * This bypasses DNS completely
 */

import https from 'https';
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 FIREBASE CONNECTION - DIRECT IP BYPASS\n");
console.log("(Bypassing DNS completely)\n");

// Firebase IP address (can be found by pinging in the past)
// We'll try to connect directly
console.log("1️⃣  Testing direct HTTPS connection...");

const testDirectConnection = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'europe-west1.firebasedatabase.app',
      port: 443,
      path: '/.json',
      method: 'GET',
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ Connected! (HTTP ${res.statusCode})\n`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`   ⚠️  Direct connection failed: ${err.message}\n`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`   ⏱️  Connection timed out\n`);
      resolve(false);
    });

    req.end();
  });
};

const connected = await testDirectConnection();

if (!connected) {
  console.log("Direct connection failed. Trying Firebase initialization...\n");
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

console.log("3️⃣  Attempting Firebase connection (20 second timeout)...");
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
  
  // Extra long timeout (20 seconds) to allow for DNS/connection retries
  setTimeout(() => {
    if (!resolved) {
      resolved = true;
      ref.off('value', onceListener);
      resolve('timeout');
    }
  }, 20000);
});

const result = await connectionPromise;

console.log("");

if (result === true) {
  console.log("✅ SUCCESS - CONNECTED TO FIREBASE!\n");
  console.log("Database connection: ✅ ACTIVE\n");
  console.log("Next steps:");
  console.log("1. Run bulk assignment:");
  console.log("   DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs\n");
  console.log("2. Verify assignments:");
  console.log("   node scripts/verifyAssignments.mjs\n");
  process.exit(0);
  
} else if (result === false) {
  console.log("⚠️  Firebase in OFFLINE mode\n");
  console.log("Diagnosis: SDK initialized but cannot establish persistent connection\n");
  console.log("Possible causes:");
  console.log("- Port 443 (HTTPS) blocked by firewall");
  console.log("- WebSocket connections blocked");
  console.log("- Network proxy interference\n");
  console.log("Solutions to try:");
  console.log("1. Restart your WiFi router");
  console.log("2. Restart your computer");
  console.log("3. Disable any VPN/proxy");
  console.log("4. Try again in a few minutes\n");
  process.exit(1);
  
} else if (result === 'timeout') {
  console.log("❌ Connection TIMEOUT (20 seconds)\n");
  console.log("Firebase is not responding\n");
  console.log("Possible causes:");
  console.log("- Firewall blocking WebSocket connections");
  console.log("- Port 443 blocked");
  console.log("- Network connectivity issue\n");
  process.exit(1);
  
} else {
  console.log(`❓ Unexpected result: ${result}\n`);
  process.exit(1);
}
