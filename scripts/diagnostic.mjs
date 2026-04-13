/**
 * DIAGNOSTIC: Debug why bulk assignment failed
 * 
 * Checks:
 * 1. Firebase connectivity
 * 2. Admin permissions
 * 3. Current data state
 * 4. What went wrong
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();

async function diagnose() {
  console.log("🔍 DIAGNOSTIC: Checking why bulk assignment failed\n");

  try {
    // Check 1: Firebase connectivity
    console.log("1️⃣ Firebase Connectivity");
    const testRef = await db.ref('.info/connected').once('value');
    console.log(`   Status: ${testRef.val() ? '✅ Connected' : '❌ Disconnected'}\n`);

    // Check 2: Professors in database
    console.log("2️⃣ Professors in Database");
    const profsSnap = await db.ref('professors').once('value');
    const allProfs = profsSnap.val() || {};
    console.log(`   Total: ${Object.keys(allProfs).length}`);

    const withMoodleId = Object.values(allProfs).filter(p => p.moodleUserId).length;
    console.log(`   With moodleUserId: ${withMoodleId}\n`);

    // Check 3: Courses before assignment
    console.log("3️⃣ Courses Status");
    const coursesSnap = await db.ref('courses').once('value');
    const allCourses = coursesSnap.val() || {};
    console.log(`   Total courses: ${Object.keys(allCourses).length}`);

    const withProfId = Object.values(allCourses).filter(c => c.professorId).length;
    const withUid = Object.values(allCourses).filter(c => c.professorUid).length;

    console.log(`   With professorId: ${withProfId}`);
    console.log(`   With professorUid: ${withUid}\n`);

    // Check 4: Sample course structure
    if (Object.keys(allCourses).length > 0) {
      console.log("4️⃣ Sample Course Structure:");
      const sampleCourse = Object.entries(allCourses)[0];
      console.log(`   ${sampleCourse[0]}: ${JSON.stringify(sampleCourse[1], null, 2)}\n`);
    }

    // Check 5: Sample professor structure
    if (Object.keys(allProfs).length > 0) {
      console.log("5️⃣ Sample Professor Structure:");
      const sampleProf = Object.entries(allProfs)[0];
      console.log(`   ${sampleProf[0]}: ${JSON.stringify(sampleProf[1], null, 2)}\n`);
    }

    // Check 6: Write test
    console.log("6️⃣ Write Permission Test");
    try {
      const testPath = `_test_${Date.now()}`;
      await db.ref(testPath).set({ test: true });
      await db.ref(testPath).remove();
      console.log("   ✅ Can write to database\n");
    } catch (err) {
      console.log(`   ❌ Cannot write: ${err.message}\n`);
    }

    // Diagnosis
    console.log("📋 DIAGNOSIS:");
    console.log(`${"=".repeat(60)}`);

    if (withProfId === 0 && withUid === 0) {
      console.log("⚠️  BULK ASSIGNMENT DID NOT RUN");
      console.log("   Possible causes:");
      console.log("   1. Script ran in DRY_RUN mode (no changes applied)");
      console.log("   2. DRY_RUN=false was not set");
      console.log("   3. Script exited early due to error");
      console.log("\n   Solution:");
      console.log("   Run: DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs");
    } else if (withProfId > 0 && withUid > 0) {
      console.log("✅ BULK ASSIGNMENT SUCCEEDED");
      console.log(`   ${withProfId} courses now assigned`);
    } else {
      console.log("⚠️  PARTIAL ASSIGNMENT");
      console.log(`   professorId assigned: ${withProfId}`);
      console.log(`   professorUid assigned: ${withUid}`);
      console.log("   Some updates may have failed");
    }

    console.log(`${"=".repeat(60)}\n`);
  } catch (err) {
    console.error("❌ Diagnostic error:", err.message);
  }

  process.exit(0);
}

diagnose().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
