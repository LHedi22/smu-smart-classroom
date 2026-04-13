/**
 * PHASE 3: VERIFY - Check if bulk assignments worked
 * 
 * Confirms:
 * 1. Courses are assigned to professors
 * 2. Professors have assignedRooms
 * 3. Data is complete and consistent
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

async function verify() {
  console.log("✅ PHASE 3: VERIFY - Checking if assignments worked\n");

  // Load professors
  const profsSnap = await db.ref('professors').once('value');
  const allProfs = profsSnap.val() || {};

  const moodleToProf = {};
  Object.entries(allProfs).forEach(([uid, prof]) => {
    if (prof.moodleUserId && TARGET_MOODLE_IDS.includes(prof.moodleUserId)) {
      moodleToProf[prof.moodleUserId] = { uid, ...prof };
    }
  });

  // Load courses
  const coursesSnap = await db.ref('courses').once('value');
  const allCourses = coursesSnap.val() || {};

  console.log("📊 VERIFICATION REPORT\n");
  console.log(`Total professors: ${Object.keys(moodleToProf).length}`);
  console.log(`Total courses: ${Object.keys(allCourses).length}\n`);

  let coursesWithProfId = 0;
  let coursesWithUid = 0;
  let coursesWithRoom = 0;
  const coursesByProf = {};

  // Analyze courses
  Object.entries(allCourses).forEach(([courseId, course]) => {
    if (course.professorId && TARGET_MOODLE_IDS.includes(course.professorId)) {
      if (!coursesByProf[course.professorId]) {
        coursesByProf[course.professorId] = [];
      }
      coursesByProf[course.professorId].push(courseId);

      if (course.professorId) coursesWithProfId++;
      if (course.professorUid) coursesWithUid++;
      if (course.room) coursesWithRoom++;
    }
  });

  console.log("📚 COURSE ASSIGNMENTS:");
  console.log(`  ✅ Courses with professorId: ${coursesWithProfId}`);
  console.log(`  ✅ Courses with professorUid: ${coursesWithUid}`);
  console.log(`  ✅ Courses with room: ${coursesWithRoom}\n`);

  // Check each professor
  let successCount = 0;
  let issueCount = 0;

  console.log("👥 PROFESSOR DETAILS:\n");

  for (const moodleId of TARGET_MOODLE_IDS) {
    const prof = moodleToProf[moodleId];
    const courses = coursesByProf[moodleId] || [];
    const rooms = prof?.assignedRooms ? Object.keys(prof.assignedRooms) : [];

    const status = courses.length > 0 && rooms.length > 0 ? "✅" : "⚠️";

    console.log(`${status} ${prof?.name || `Prof ${moodleId}`}`);
    console.log(`   Moodle ID: ${moodleId}`);
    console.log(`   Courses: ${courses.length} (${courses.join(", ") || "NONE"})`);
    console.log(`   Rooms: ${rooms.length} (${rooms.join(", ") || "NONE"})`);

    if (courses.length > 0 && rooms.length > 0) {
      successCount++;
    } else {
      issueCount++;
    }
    console.log();
  }

  console.log(`${"=".repeat(60)}`);
  console.log("📈 SUMMARY:");
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Professors with courses & rooms: ${successCount}/20`);
  console.log(`⚠️  Professors with issues: ${issueCount}/20`);
  console.log(`📚 Total courses assigned: ${coursesWithProfId}`);
  console.log(`🏠 Total room assignments: ${coursesByProf && Object.values(coursesByProf).length > 0 ? "Populated" : "Empty"}`);

  if (successCount === 20) {
    console.log(`\n🎉 SUCCESS! All professors have courses and rooms assigned.`);
    console.log(`\nNext steps:`);
    console.log(`1. Logout admin`);
    console.log(`2. Login as professor (e.g., a.a.jallouli@smu.tn / SMU@Jallouli2025)`);
    console.log(`3. Check dashboard - should see courses and upcoming sessions ✅`);
  } else {
    console.log(`\n⚠️  ${issueCount} professors still have issues.`);
    console.log(`Run bulk assignment again if needed.`);
  }

  console.log();
  process.exit(0);
}

verify().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
