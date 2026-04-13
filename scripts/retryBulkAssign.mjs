/**
 * RETRY: Re-run bulk assignment with better error handling
 * 
 * This version:
 * 1. Shows detailed error messages
 * 2. Continues on partial failures
 * 3. Logs exactly what fails
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, writeFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();

const PROF_DATA = {
  13: { name: "Ahmed Jallouli", courses: ["CS102", "CS201"], rooms: ["D105", "A101"] },
  14: { name: "Fatma Trabelsi", courses: ["MATH201", "MATH301"], rooms: ["C310", "D105"] },
  15: { name: "Hind Ferchichi", courses: ["CS301", "CS302"], rooms: ["B204", "C310"] },
  16: { name: "Mohamed Ben Salah", courses: ["ENG101", "ENG201"], rooms: ["A101", "B204"] },
  17: { name: "Rani Rekik", courses: ["PHYS101", "PHYS201"], rooms: ["D105", "A101"] },
  18: { name: "Tarek Bouaziz", courses: ["CHEM101", "CHEM201"], rooms: ["B204", "D105"] },
  19: { name: "Leila Bouzid", courses: ["MATH101", "MATH102"], rooms: ["C310", "A101"] },
  20: { name: "Rim Hammami", courses: ["STAT101", "STAT201"], rooms: ["A101", "D105"] },
  21: { name: "Chokri Ben Amor", courses: ["MATH401", "MATH402"], rooms: ["C310", "B204"] },
  22: { name: "Karim Gharbi", courses: ["ECE101", "ECE201"], rooms: ["D105", "A101"] },
  23: { name: "Bilel Marzouk", courses: ["CS103", "CS203"], rooms: ["A101", "C310"] },
  24: { name: "Adel Kaabia", courses: ["ISS101", "ISS201"], rooms: ["B204", "D105"] },
  25: { name: "Sonia Khelifi", courses: ["CHEM301", "CHEM302"], rooms: ["C310", "D105"] },
  26: { name: "Ines Miled", courses: ["BIO101", "BIO201"], rooms: ["A101", "B204"] },
  27: { name: "Youssef Mansouri", courses: ["ECON101", "ECON201"], rooms: ["C310", "A101"] },
  28: { name: "Sofiane Dridi", courses: ["ECON301", "ECON302"], rooms: ["B204", "D105"] },
  29: { name: "Amira Chebil", courses: ["ENG301", "LANG101"], rooms: ["A101", "C310"] },
  30: { name: "Wafa Jlassi", courses: ["LANG201", "LANG301"], rooms: ["D105", "B204"] },
  31: { name: "Nabil Zouari", courses: ["PHYS301", "PHYS302"], rooms: ["C310", "A101"] },
  32: { name: "Hatem Ferjani", courses: ["PHYS401", "PHYS402"], rooms: ["B204", "D105"] },
};

let successCount = 0;
let failCount = 0;
const errors = [];

async function retryBulkAssign() {
  console.log("🔧 RETRY: Bulk Assignment with Error Handling\n");

  // Get all professors
  const profsSnap = await db.ref('professors').once('value');
  const allProfs = profsSnap.val() || {};

  const moodleToUid = {};
  Object.entries(allProfs).forEach(([uid, prof]) => {
    if (prof.moodleUserId && PROF_DATA[prof.moodleUserId]) {
      moodleToUid[prof.moodleUserId] = uid;
    }
  });

  console.log(`Found ${Object.keys(moodleToUid).length} professors in database\n`);

  // Process each professor
  for (const [moodleId, profData] of Object.entries(PROF_DATA)) {
    const uid = moodleToUid[moodleId];
    if (!uid) {
      console.log(`⚠️  ${profData.name} (${moodleId}): Not found in Firebase`);
      errors.push(`Professor ${profData.name} not in database`);
      continue;
    }

    console.log(`\n👤 ${profData.name} (${moodleId})`);

    try {
      // 1. Update courses
      for (const course of profData.courses) {
        try {
          await db.ref(`courses/${course}`).update({
            professorUid: uid,
            professorId: parseInt(moodleId),
            room: profData.rooms[Math.floor(Math.random() * profData.rooms.length)],
          });
          console.log(`   ✅ Course ${course} assigned`);
          successCount++;
        } catch (err) {
          console.log(`   ❌ Course ${course} error: ${err.message}`);
          errors.push(`Course ${course}: ${err.message}`);
          failCount++;
        }
      }

      // 2. Update professor's rooms
      try {
        const roomsObj = {};
        profData.rooms.forEach(room => {
          roomsObj[room] = true;
        });
        await db.ref(`professors/${uid}/assignedRooms`).set(roomsObj);
        console.log(`   ✅ Rooms assigned: ${profData.rooms.join(", ")}`);
      } catch (err) {
        console.log(`   ❌ Rooms error: ${err.message}`);
        errors.push(`Rooms for ${profData.name}: ${err.message}`);
        failCount++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errors.push(`${profData.name}: ${err.message}`);
      failCount++;
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach(e => console.log(`   - ${e}`));
  }

  if (failCount === 0) {
    console.log(`\n✨ All assignments completed successfully!`);
    console.log(`   Now run: node scripts/verifyAssignments.mjs\n`);
  }

  writeFileSync("RETRY_REPORT.txt", `Retry Execution Report\n${"=".repeat(60)}\nSuccessful: ${successCount}\nFailed: ${failCount}\n\nErrors:\n${errors.join("\n")}`);

  process.exit(failCount > 0 ? 1 : 0);
}

retryBulkAssign().catch(err => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
