/**
 * MANUAL FIREBASE ADMIN SETUP - Browser Console Version
 * 
 * If the automated script hangs, use this to manually add the admin entry
 * 
 * INSTRUCTIONS:
 * 1. Go to: https://console.firebase.google.com/project/smu-smart-classroom/database/data
 * 2. Open Developer Tools (F12)
 * 3. Copy ALL code from this file (from line 10 onwards)
 * 4. Paste into Browser Console
 * 5. Press Enter
 */

const serviceAccountEmail = "firebase-adminsdk-fbsvc@smu-smart-classroom.iam.gserviceaccount.com";

// Generate hash key (simple version for browser)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 32);
}

const serviceAccountKey = simpleHash(serviceAccountEmail);

console.log("🔐 FIREBASE ADMIN SETUP");
console.log("Service Account:", serviceAccountEmail);
console.log("Hash Key:", serviceAccountKey);
console.log("\nFollow these steps in Firebase Console:");
console.log("1. Make sure you're in Data tab (not Rules)");
console.log("2. Click + icon at the root level");
console.log("3. Enter key: 'admins'");
console.log("4. Click + icon next to /admins");
console.log("5. Enter key:", serviceAccountKey);
console.log("6. Enter value as JSON:");
console.log(JSON.stringify({
  email: serviceAccountEmail,
  role: "system_admin",
  type: "service_account",
  created: new Date().toISOString()
}, null, 2));
console.log("\n✅ Then run: node scripts/testFirebaseDirectHTTPS.mjs");
