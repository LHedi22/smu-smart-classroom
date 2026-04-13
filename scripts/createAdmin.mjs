// scripts/createAdmin.mjs
// Run once: node scripts/createAdmin.mjs

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const adminAuth = getAuth();
const db = getDatabase();

const adminAccounts = [
  {
    email: "admin@smu.tn",
    password: "SMU@Admin2025",
    name: "System Administrator",
  },
  {
    email: "admin.dashboard@smu.tn",
    password: "SMU@Dashboard2025",
    name: "Dashboard Manager",
  },
];

console.log("🔧 Creating admin accounts...\n");

for (const admin of adminAccounts) {
  try {
    // Create Firebase Auth account
    const userRecord = await adminAuth.createUser({
      email: admin.email,
      password: admin.password,
      displayName: admin.name,
    });

    // Mark as admin in database
    await db.ref(`/admins/${userRecord.uid}`).set({
      email: admin.email,
      name: admin.name,
      createdAt: new Date().toISOString(),
      role: "admin",
    });

    console.log(`✅ Admin Created`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   UID: ${userRecord.uid}\n`);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log(`⚠️  Email already exists: ${admin.email}`);
      console.log(`   Try logging in with existing credentials\n`);
    } else {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }
}

console.log("✨ Admin setup complete!");
console.log("\n📋 Next steps:");
console.log("1. Start the app: npm run dev");
console.log("2. Go to: http://localhost:5173/login");
console.log("3. Login with admin credentials above");
console.log("4. Visit: http://localhost:5173/admin/debugger\n");

process.exit(0);
