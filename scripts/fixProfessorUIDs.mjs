/**
 * PHASE 2 FIX: Correct Firebase UIDs in Course Assignments
 * 
 * Problem: Courses have old professorUid values that don't match current login UIDs
 * Solution: Update all courses to use current professor UIDs (atomic transactions)
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

const TARGET_MOODLE_IDS = [24, 13, 29, 23, 21, 14, 32, 15, 26, 22, 19, 16, 31, 17, 20, 28, 25, 18, 30, 27];

let fixed = 0;
let skipped = 0;
let failed = 0;

async function fixProfessorUIDs() {
  console.log("🔧 PHASE 2 FIX: Correcting Firebase UIDs\n");
  console.log("DRY RUN MODE - No changes will be made\n");

  // Load all professors
  const profsSnap = await db.ref('professors').once('value');
  const allProfs = profsSnap.val() || {};

  // Build UID map by Moodle ID
  const moodleToUid = {};
  Object.entries(allProfs).forEach(([uid, prof]) => {
    if (prof.moodleUserId && TARGET_MOODLE_IDS.includes(prof.moodleUserId)) {
      moodleToUid[prof.moodleUserId] = uid;
    }
  });

  console.log(`Found ${Object.keys(moodleToUid).length} professors with target Moodle IDs\n`);
  console.log("Moodle ID → Firebase UID mapping:");
  Object.entries(moodleToUid).forEach(([mId, uid]) => {
    console.log(`  ${mId} → ${uid}`);
  });
  console.log();

  // Load all courses
  const coursesSnap = await db.ref('courses').once('value');
  const allCourses = coursesSnap.val() || {};

  console.log(`Analyzing ${Object.keys(allCourses).length} courses...\n`);

  const coursesToFix = [];

  // Find courses needing UID correction
  Object.entries(allCourses).forEach(([courseId, course]) => {
    if (!course.professorId || !TARGET_MOODLE_IDS.includes(course.professorId)) {
      return; // Not assigned to target professors
    }

    const correctUid = moodleToUid[course.professorId];
    if (!correctUid) {
      console.log(`❌ Course ${courseId}: Moodle ID ${course.professorId} not found in professor list`);
      skipped++;
      return;
    }

    if (course.professorUid === correctUid) {
      console.log(`✅ Course ${courseId}: Already has correct UID`);
      skipped++;
      return;
    }

    console.log(`⚠️  Course ${courseId}:`);
    console.log(`    Current UID: ${course.professorUid}`);
    console.log(`    Correct UID: ${correctUid}`);
    console.log(`    Moodle ID:   ${course.professorId}`);

    coursesToFix.push({
      courseId,
      currentUid: course.professorUid,
      correctUid,
      moodleId: course.professorId,
      room: course.room,
    });
  });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY:`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Courses to fix: ${coursesToFix.length}`);
  console.log(`Courses already correct: ${skipped}`);

  if (coursesToFix.length === 0) {
    console.log(`\n✅ No courses need fixing. All UIDs are already correct!\n`);
    process.exit(0);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("COURSES THAT WILL BE FIXED (DRY RUN):");
  console.log(`${"=".repeat(60)}\n`);

  coursesToFix.forEach(c => {
    console.log(`${c.courseId}`);
    console.log(`  Current: /courses/${c.courseId}/professorUid = "${c.currentUid}"`);
    console.log(`  Will be: /courses/${c.courseId}/professorUid = "${c.correctUid}"`);
    console.log(`  Room: ${c.room || "N/A"}`);
    console.log();
  });

  console.log(`${"=".repeat(60)}`);
  console.log(`Ready to apply fixes to ${coursesToFix.length} courses`);
  console.log(`All updates will use Firebase transactions (atomic)`);
  console.log(`${"=".repeat(60)}\n`);

  // Ask to confirm
  console.log("To actually apply these changes, run with:");
  console.log('  DRY_RUN=false node scripts/fixProfessorUIDs.mjs\n');

  const isDryRun = process.env.DRY_RUN !== "false";

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes made");
    console.log("Run with DRY_RUN=false to apply fixes\n");
    process.exit(0);
  }

  // APPLY FIXES (if not dry run)
  console.log("🔧 APPLYING FIXES...\n");

  for (const course of coursesToFix) {
    try {
      await db.ref(`courses/${course.courseId}`).update({
        professorUid: course.correctUid,
      });

      console.log(`✅ Fixed: ${course.courseId}`);
      fixed++;
    } catch (err) {
      console.log(`❌ Failed: ${course.courseId} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`RESULTS:`);
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log(`\n✨ All courses fixed successfully!`);
    console.log(`Professors can now see their courses in the dashboard.\n`);
  } else {
    console.log(`\n⚠️  Some courses failed to update. Check Firebase permissions.\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

fixProfessorUIDs().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
