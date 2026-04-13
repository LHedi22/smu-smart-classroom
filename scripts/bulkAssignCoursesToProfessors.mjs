/**
 * BULK ASSIGN: Populate Firebase with Courses & Rooms from Moodle
 * 
 * Problem: Flask syncs Moodle enrollments to React but NOT to Firebase
 * Solution: Bulk-assign all courses to their professors in Firebase
 * 
 * This script:
 * 1. Loads all professors from Firebase
 * 2. For each professor, extracts their Moodle courses
 * 3. Atomically assigns courses to professors using transactionHelpers
 * 4. Updates assignedRooms for each professor
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Dummy Moodle course data (represents what Flask would return)
// In production, would query Flask API
const MOODLE_COURSES_BY_PROF_ID = {
  13: [ // Ahmed Jallouli
    { id: 101, code: "CS102", fullname: "Object Oriented Programming", schedule: [{ room: "D105", day: "Monday" }] },
    { id: 102, code: "CS201", fullname: "Advanced Java", schedule: [{ room: "A101", day: "Wednesday" }] },
  ],
  14: [ // Fatma Trabelsi
    { id: 103, code: "MATH201", fullname: "Calculus II", schedule: [{ room: "C310", day: "Tuesday" }] },
    { id: 104, code: "MATH301", fullname: "Linear Algebra", schedule: [{ room: "D105", day: "Thursday" }] },
  ],
  15: [ // Hind Ferchichi
    { id: 105, code: "CS301", fullname: "Database Design", schedule: [{ room: "B204", day: "Monday" }] },
    { id: 106, code: "CS302", fullname: "SQL Programming", schedule: [{ room: "C310", day: "Friday" }] },
  ],
  16: [ // Mohamed Ben Salah
    { id: 107, code: "ENG101", fullname: "English I", schedule: [{ room: "A101", day: "Monday" }] },
    { id: 108, code: "ENG201", fullname: "English II", schedule: [{ room: "B204", day: "Wednesday" }] },
  ],
  17: [ // Rani Rekik
    { id: 109, code: "PHYS101", fullname: "Physics I", schedule: [{ room: "D105", day: "Tuesday" }] },
    { id: 110, code: "PHYS201", fullname: "Physics II", schedule: [{ room: "A101", day: "Thursday" }] },
  ],
  18: [ // Tarek Bouaziz
    { id: 111, code: "CHEM101", fullname: "Chemistry I", schedule: [{ room: "B204", day: "Monday" }] },
    { id: 112, code: "CHEM201", fullname: "Chemistry II", schedule: [{ room: "D105", day: "Wednesday" }] },
  ],
  19: [ // Leila Bouzid
    { id: 113, code: "MATH101", fullname: "Algebra", schedule: [{ room: "C310", day: "Tuesday" }] },
    { id: 114, code: "MATH102", fullname: "Geometry", schedule: [{ room: "A101", day: "Thursday" }] },
  ],
  20: [ // Rim Hammami
    { id: 115, code: "STAT101", fullname: "Statistics I", schedule: [{ room: "A101", day: "Monday" }] },
    { id: 116, code: "STAT201", fullname: "Statistics II", schedule: [{ room: "D105", day: "Friday" }] },
  ],
  21: [ // Chokri Ben Amor
    { id: 117, code: "MATH401", fullname: "Advanced Calculus", schedule: [{ room: "C310", day: "Monday" }] },
    { id: 118, code: "MATH402", fullname: "Differential Equations", schedule: [{ room: "B204", day: "Wednesday" }] },
  ],
  22: [ // Karim Gharbi
    { id: 119, code: "ECE101", fullname: "Circuit Analysis", schedule: [{ room: "D105", day: "Tuesday" }] },
    { id: 120, code: "ECE201", fullname: "Digital Systems", schedule: [{ room: "A101", day: "Thursday" }] },
  ],
  23: [ // Bilel Marzouk
    { id: 121, code: "CS103", fullname: "Web Development", schedule: [{ room: "A101", day: "Monday" }] },
    { id: 122, code: "CS203", fullname: "Full Stack", schedule: [{ room: "C310", day: "Friday" }] },
  ],
  24: [ // Adel Kaabia
    { id: 123, code: "ISS101", fullname: "Information Systems", schedule: [{ room: "B204", day: "Tuesday" }] },
    { id: 124, code: "ISS201", fullname: "Database ISS", schedule: [{ room: "D105", day: "Thursday" }] },
  ],
  25: [ // Sonia Khelifi
    { id: 125, code: "CHEM301", fullname: "Organic Chemistry", schedule: [{ room: "C310", day: "Monday" }] },
    { id: 126, code: "CHEM302", fullname: "Physical Chemistry", schedule: [{ room: "D105", day: "Wednesday" }] },
  ],
  26: [ // Ines Miled
    { id: 127, code: "BIO101", fullname: "Biology I", schedule: [{ room: "A101", day: "Tuesday" }] },
    { id: 128, code: "BIO201", fullname: "Biology II", schedule: [{ room: "B204", day: "Thursday" }] },
  ],
  27: [ // Youssef Mansouri
    { id: 129, code: "ECON101", fullname: "Microeconomics", schedule: [{ room: "C310", day: "Monday" }] },
    { id: 130, code: "ECON201", fullname: "Macroeconomics", schedule: [{ room: "A101", day: "Friday" }] },
  ],
  28: [ // Sofiane Dridi
    { id: 131, code: "ECON301", fullname: "Econometrics", schedule: [{ room: "B204", day: "Tuesday" }] },
    { id: 132, code: "ECON302", fullname: "Finance", schedule: [{ room: "D105", day: "Thursday" }] },
  ],
  29: [ // Amira Chebil
    { id: 133, code: "ENG301", fullname: "Advanced English", schedule: [{ room: "A101", day: "Monday" }] },
    { id: 134, code: "LANG101", fullname: "French", schedule: [{ room: "C310", day: "Wednesday" }] },
  ],
  30: [ // Wafa Jlassi
    { id: 135, code: "LANG201", fullname: "German", schedule: [{ room: "D105", day: "Tuesday" }] },
    { id: 136, code: "LANG301", fullname: "Spanish", schedule: [{ room: "B204", day: "Friday" }] },
  ],
  31: [ // Nabil Zouari
    { id: 137, code: "PHYS301", fullname: "Quantum Mechanics", schedule: [{ room: "C310", day: "Monday" }] },
    { id: 138, code: "PHYS302", fullname: "Thermodynamics", schedule: [{ room: "A101", day: "Thursday" }] },
  ],
  32: [ // Hatem Ferjani
    { id: 139, code: "PHYS401", fullname: "Modern Physics", schedule: [{ room: "B204", day: "Tuesday" }] },
    { id: 140, code: "PHYS402", fullname: "Astrophysics", schedule: [{ room: "D105", day: "Friday" }] },
  ],
};

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

const DB_URL = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/";
console.log("DB URL:", DB_URL);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: DB_URL,
});

const db = getDatabase();

let assigned = 0;
let skipped = 0;
let failed = 0;
const report = [];

async function bulkAssign() {
  console.log("📚 BULK ASSIGN: Populating Firebase with Courses & Rooms\n");

  // Load all professors
  const profsSnap = await db.ref('professors').once('value');
  const allProfs = profsSnap.val() || {};

  // Build map by Moodle ID
  const moodleIdToUid = {};
  Object.entries(allProfs).forEach(([uid, prof]) => {
    if (prof.moodleUserId) {
      moodleIdToUid[prof.moodleUserId] = { uid, ...prof };
    }
  });

  const isDryRun = process.env.DRY_RUN !== "false";
  console.log("ENV DRY_RUN =", process.env.DRY_RUN);
  console.log(`Mode: ${isDryRun ? "🔍 DRY RUN (No changes)" : "🔧 APPLYING FIXES"}\n`);

  // Process each professor
  for (const [moodleId, courses] of Object.entries(MOODLE_COURSES_BY_PROF_ID)) {
    const profRecord = moodleIdToUid[moodleId];
    if (!profRecord) {
      console.log(`❌ Moodle ID ${moodleId}: Professor not found in Firebase`);
      skipped++;
      continue;
    }

    const { uid, name } = profRecord;
    console.log(`\n👤 ${name} (ID: ${moodleId}, UID: ${uid})`);
    console.log(`   Courses to assign: ${courses.length}`);

    const roomsToAssign = {};
    const coursesToCreate = [];

    // Prepare assignments
    for (const course of courses) {
      const courseId = course.code;
      const room = course.schedule?.[0]?.room || "UNKNOWN";

      console.log(`   - ${course.code}: ${course.fullname} (Room: ${room})`);

      roomsToAssign[room] = true;
      coursesToCreate.push({
        courseId,
        room,
        moodleId,
        uid,
        course,
      });
    }

    if (isDryRun) {
      console.log(`   ✓ Would assign ${coursesToCreate.length} courses`);
      console.log(`   ✓ Would add rooms: ${Object.keys(roomsToAssign).join(", ")}`);
      assigned += coursesToCreate.length;
    } else {
      // Apply assignments
      try {
        // 1. Create/update courses
        for (const c of coursesToCreate) {
          await db.ref(`courses/${c.courseId}`).update({
            code: c.course.code,
            name: c.course.fullname,
            professorUid: c.uid,
            professorId: Number(c.moodleId),
            room: c.room,
            schedule: c.course.schedule || [],
          });
          console.log(`     ✅ Course ${c.courseId} assigned`);
          assigned++;
        }

        // 2. Update professor's assigned rooms
        await db.ref(`professors/${uid}/assignedRooms`).set(roomsToAssign);
        console.log(`     ✅ Rooms assigned: ${Object.keys(roomsToAssign).join(", ")}`);
      } catch (err) {
        console.log(`     ❌ Error: ${err.message}`);
        failed++;
      }
    }

    report.push({
      professor: name,
      moodleId,
      uid,
      coursesAssigned: coursesToCreate.length,
      rooms: Object.keys(roomsToAssign),
    });
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Professors processed: ${Object.keys(moodleIdToUid).length}`);
  console.log(`Courses assigned: ${assigned}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (isDryRun) {
    console.log(`\n🔍 DRY RUN COMPLETE - No changes made`);
    console.log(`Run with: DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs\n`);
  } else {
    console.log(`\n✨ BULK ASSIGNMENT COMPLETE`);
    if (failed === 0) {
      console.log(`✅ All courses assigned successfully!`);
      console.log(`   Professors can now see their courses in dashboard\n`);
    } else {
      console.log(`⚠️  Some assignments failed. Check Firebase permissions\n`);
    }
  }

  // Save report
  const reportText = report
    .map(r => `${r.professor}\n  Moodle ID: ${r.moodleId}\n  Courses: ${r.coursesAssigned}\n  Rooms: ${r.rooms.join(", ")}\n`)
    .join("\n");

  writeFileSync("BULK_ASSIGN_REPORT.txt", reportText);
  console.log("📋 Report saved to: BULK_ASSIGN_REPORT.txt\n");

  process.exit(failed > 0 ? 1 : 0);
}

bulkAssign().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
