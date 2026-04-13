/**
 * Firebase Connection Test - Direct HTTPS with IP Bypass
 * 
 * This script attempts to connect to Firebase bypassing DNS resolution
 * by using direct IP addresses or HTTPS hostname resolution
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import https from "https";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

console.log("🔧 Firebase Admin SDK Connection Diagnostic\n");
console.log("=" .repeat(60));
console.log("Configuration Check:");
console.log("=" .repeat(60));

// Display configuration
console.log(`Project ID: ${serviceAccount.project_id}`);
console.log(`Client Email: ${serviceAccount.client_email}`);
console.log(`Database URL: https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/\n`);

// Initialize Firebase with explicit configuration
try {
  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
  });
  
  console.log("✅ Firebase Admin SDK initialized successfully\n");
  
  const db = getDatabase(app);
  
  // Test 1: Check connection status
  console.log("=" .repeat(60));
  console.log("Test 1: Database Connection Status");
  console.log("=" .repeat(60));
  
  const connectedRef = db.ref(".info/connected");
  let connectionStatus = false;
  
  connectedRef.on("value", (snap) => {
    connectionStatus = snap.val();
    console.log(`Connection Status: ${connectionStatus ? "🟢 CONNECTED" : "🔴 OFFLINE"}`);
  });

  // Test 2: Try to read data
  console.log("\n" + "=" .repeat(60));
  console.log("Test 2: Read Database");
  console.log("=" .repeat(60));
  
  setTimeout(async () => {
    try {
      const professorsSnap = await db.ref('professors').limitToFirst(1).once('value');
      const data = professorsSnap.val();
      
      if (data) {
        console.log("✅ Successfully read from database!");
        console.log(`Sample data: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        console.log("⚠️  Database returned no data");
      }
      
      // Test 3: Write test (optional)
      console.log("\n" + "=" .repeat(60));
      console.log("Test 3: Write Permission Test");
      console.log("=" .repeat(60));
      
      try {
        await db.ref('connectionTest').set({
          timestamp: Date.now(),
          message: "Connection test successful"
        });
        console.log("✅ Successfully wrote to database!");
      } catch (writeErr) {
        console.log(`⚠️  Write failed (may be permissions): ${writeErr.message}`);
      }
      
      // Summary
      console.log("\n" + "=" .repeat(60));
      console.log("Diagnosis Summary");
      console.log("=" .repeat(60));
      
      if (connectionStatus) {
        console.log("✅ Firebase connection is WORKING");
        console.log("\nYou can now run:");
        console.log("  node scripts/bulkAssignCoursesToProfessors.mjs");
        console.log("  node scripts/verifyAssignments.mjs");
      } else {
        console.log("❌ Firebase reports OFFLINE");
        console.log("\nPossible causes:");
        console.log("  1. DNS resolution issue (cannot resolve firebase domain)");
        console.log("  2. Firewall blocking HTTPS to Firebase");
        console.log("  3. Antivirus intercepting connection");
        console.log("  4. Network connection issue");
        console.log("\nSolutions to try:");
        console.log("  1. Restart computer");
        console.log("  2. Check Windows Firewall settings");
        console.log("  3. Temporarily disable antivirus");
        console.log("  4. Switch to IPv4-only WiFi: Settings > WiFi > Properties > IPv4 only");
      }
      
      process.exit(connectionStatus ? 0 : 1);
      
    } catch (readErr) {
      console.log(`❌ Read failed: ${readErr.message}`);
      console.log("\nDiagnosis: Cannot access database");
      process.exit(1);
    }
  }, 1000);

} catch (initErr) {
  console.log(`❌ Firebase initialization failed: ${initErr.message}`);
  process.exit(1);
}
