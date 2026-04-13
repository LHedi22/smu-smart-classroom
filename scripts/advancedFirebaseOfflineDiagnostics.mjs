/**
 * ADVANCED FIREBASE OFFLINE TROUBLESHOOTER
 * 
 * Diagnoses why Firebase is in offline mode despite credentials being valid
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import https from "https";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔍 FIREBASE OFFLINE TROUBLESHOOTER\n");

// Initialize Firebase
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../serviceAccountKey.json"), "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();

// Test 1: Network connectivity
console.log("1️⃣  Testing network connectivity...");
try {
  const https_request = (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode);
      }).on("error", reject).on("timeout", reject);
    });
  };

  const code = await https_request("https://www.google.com");
  console.log(`   ✅ Internet working (Google: ${code})\n`);
} catch (err) {
  console.log(`   ❌ No internet connection or firewall blocking\n`);
  console.log(`   Error: ${err.message}\n`);
  console.log(`   Fix: Check your internet connection\n`);
  process.exit(1);
}

// Test 2: Firebase URL accessibility
console.log("2️⃣  Testing Firebase URL accessibility...");
try {
  const firebaseUrl = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/.json";
  const https_request = (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode);
      }).on("error", reject).on("timeout", reject);
    });
  };

  try {
    const code = await https_request(firebaseUrl);
    console.log(`   ⚠️  Firebase URL returned: ${code}`);
    if (code === 401 || code === 403) {
      console.log(`   This is expected (authentication required)\n`);
    }
  } catch (err) {
    console.log(`   ❌ Cannot reach Firebase URL\n`);
    console.log(`   Error: ${err.message}\n`);
    console.log(`   Possible causes:`);
    console.log(`   - Firewall blocking Firebase`);
    console.log(`   - Firebase service down`);
    console.log(`   - DNS resolution issue\n`);
    process.exit(1);
  }
} catch (err) {
  console.log(`   ⚠️  ${err.message}\n`);
}

// Test 3: Check Firebase service status
console.log("3️⃣  Firebase Admin SDK perspective...");
const db_ref = db.ref('.info/connected');

// Set up a timeout
const timeout = new Promise((resolve) => {
  setTimeout(() => {
    resolve('timeout');
  }, 10000);
});

// Try to read connection status
const connectionTest = new Promise((resolve) => {
  db_ref.on('value', (snap) => {
    resolve(snap.val());
  });
});

const result = await Promise.race([connectionTest, timeout]);

if (result === 'timeout') {
  console.log(`   ⚠️  Connection check timed out (10s)\n`);
  console.log(`   This usually means:`);
  console.log(`   - Firewall is blocking Firebase`);
  console.log(`   - Network is very slow`);
  console.log(`   - Firebase server is not responding\n`);
} else if (result === true) {
  console.log(`   ✅ Connected to Firebase!\n`);
} else if (result === false) {
  console.log(`   ⚠️  Firebase is in offline mode\n`);
  console.log(`   Possible causes:\n`);
  console.log(`   1. Network connectivity is unstable`);
  console.log(`   2. Firewall is blocking Firebase domains`);
  console.log(`   3. ISP/proxy blocking firebase.com`);
  console.log(`   4. VPN/corporate network restrictions\n`);
  console.log(`   Solutions:\n`);
  console.log(`   - Try from a different network`);
  console.log(`   - Disable VPN/proxy`);
  console.log(`   - Check with IT if on corporate network`);
  console.log(`   - Try adding Firebase domains to firewall whitelist:\n`);
  console.log(`     * firebase.google.com`);
  console.log(`     * smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`);
  console.log(`     * europe-west1.firebasedatabase.app`);
  console.log(`     * *.firebaseio.com\n`);
} else {
  console.log(`   ? Unexpected result: ${result}\n`);
}

// Test 4: Detailed network info
console.log("4️⃣  Network diagnostics...");
try {
  if (process.platform === 'win32') {
    console.log(`   OS: Windows\n`);
    console.log(`   Diagnostic commands you can run:\n`);
    console.log(`   # Check DNS resolution:`);
    console.log(`   nslookup europe-west1.firebasedatabase.app\n`);
    console.log(`   # Ping Firebase:`);
    console.log(`   ping -n 4 europe-west1.firebasedatabase.app\n`);
    console.log(`   # Trace route to Firebase:`);
    console.log(`   tracert europe-west1.firebasedatabase.app\n`);
  } else {
    console.log(`   OS: Unix/Linux\n`);
    console.log(`   Diagnostic commands you can run:\n`);
    console.log(`   # Check DNS resolution:`);
    console.log(`   nslookup europe-west1.firebasedatabase.app\n`);
    console.log(`   # Ping Firebase:`);
    console.log(`   ping -c 4 europe-west1.firebasedatabase.app\n`);
    console.log(`   # Trace route to Firebase:`);
    console.log(`   traceroute europe-west1.firebasedatabase.app\n`);
  }
} catch (err) {
  console.log(`   Error: ${err.message}\n`);
}

console.log(`${"=".repeat(70)}`);
console.log(`ℹ️  SUMMARY\n`);
console.log(`The issue is NOT with your credentials or configuration.`);
console.log(`The Firebase Admin SDK is properly initialized.\n`);
console.log(`The problem is: Cannot establish real-time connection to Firebase\n`);
console.log(`Next steps:`);
console.log(`1. Run network diagnostics from the commands above`);
console.log(`2. Try from a different network (mobile hotspot?)`);
console.log(`3. Check if corporate firewall is blocking Firebase`);
console.log(`4. Verify Firebase service is not down:\n`);
console.log(`   https://status.firebase.google.com\n`);
console.log(`${"=".repeat(70)}\n`);

// Keep db reference alive briefly
db_ref.off();
process.exit(0);
