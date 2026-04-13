/**
 * BULK ASSIGN (REAL DATA): Populate Firebase /courses using each professor's actual course list from Flask.
 *
 * Why this exists:
 * - Previous script used hardcoded dummy mappings (wrong for real professors).
 * - That caused wrong course ownership and wrong live sessions.
 *
 * Run:
 *   node scripts/bulkAssignCoursesToProfessors.mjs            # dry run
 *   DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, writeFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

const DB_URL = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/";
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";
const isDryRun = process.env.DRY_RUN !== "false";

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: DB_URL,
});

const db = getDatabase();

function normalizeSchedule(schedule, fallbackRoom = "") {
  if (!schedule) return [];

  if (Array.isArray(schedule)) {
    return schedule
      .filter((slot) => slot && slot.day)
      .map((slot) => ({
        day: slot.day,
        starttime: slot.starttime || slot.startTime || "09:00",
        endtime: slot.endtime || slot.endTime || "10:30",
        room: slot.room || fallbackRoom || "",
        type: slot.type || "Lecture",
      }))
      .filter((slot) => slot.room);
  }

  if (schedule.days && Array.isArray(schedule.days) && schedule.startTime && schedule.endTime) {
    return schedule.days
      .map((day) => ({
        day,
        starttime: schedule.startTime,
        endtime: schedule.endTime,
        room: schedule.room || fallbackRoom || "",
        type: schedule.type || "Lecture",
      }))
      .filter((slot) => slot.room);
  }

  return [];
}

async function fetchProfessorCourses(moodleUserId) {
  const res = await fetch(`${FLASK_URL}/api/professors/${moodleUserId}/courses`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}

async function bulkAssign() {
  console.log("📚 BULK ASSIGN (REAL DATA): Courses & Rooms from Flask\n");
  console.log(`Mode: ${isDryRun ? "🔍 DRY RUN (No changes)" : "🔧 APPLYING CHANGES"}`);
  console.log(`Flask: ${FLASK_URL}\n`);

  const profsSnap = await db.ref("professors").get();
  const coursesSnap = await db.ref("courses").get();
  const allProfs = profsSnap.exists() ? profsSnap.val() : {};
  const existingCourses = coursesSnap.exists() ? coursesSnap.val() : {};
  const professors = Object.entries(allProfs)
    .map(([uid, prof]) => ({ uid, ...prof }))
    .filter((p) => p.moodleUserId != null);

  let assigned = 0;
  let skipped = 0;
  let failed = 0;
  const report = [];

  for (const prof of professors) {
    console.log(`\n👤 ${prof.name} (Moodle ID: ${prof.moodleUserId}, UID: ${prof.uid})`);

    let courses;
    try {
      courses = await fetchProfessorCourses(prof.moodleUserId);
    } catch (err) {
      console.log(`   ❌ Could not fetch from Flask: ${err.message}`);
      failed++;
      continue;
    }

    if (!courses.length) {
      console.log("   ⚠ No courses returned from Flask");
      skipped++;
      continue;
    }

    const roomsToAssign = {};
    const updates = {};

    for (const course of courses) {
      const courseCode = String(course.shortname || course.code || course.id || "").trim();
      if (!courseCode) continue;

      const existingCourse = existingCourses[courseCode] || {};
      const existingRoom = existingCourse.room || "";
      const existingSchedule = existingCourse.schedule || [];
      const normalizedSchedule = normalizeSchedule(
        course.schedule || existingSchedule,
        course.room || existingRoom
      );
      for (const slot of normalizedSchedule) {
        if (slot.room) roomsToAssign[slot.room] = true;
      }

      const room = normalizedSchedule[0]?.room || course.room || existingRoom || null;

      updates[`courses/${courseCode}`] = {
        code: courseCode,
        name: course.fullname || course.name || courseCode,
        moodleCourseId: course.id ?? null,
        professorUid: prof.uid,
        professorId: Number(prof.moodleUserId),
        room,
        schedule: normalizedSchedule,
      };

      console.log(`   - ${courseCode}: ${course.fullname || course.name || courseCode}${room ? ` (Room: ${room})` : ""}`);
      assigned++;
    }

    updates[`professors/${prof.uid}/assignedRooms`] = roomsToAssign;

    if (!isDryRun) {
      try {
        await db.ref("/").update(updates);
        console.log(`   ✅ Updated ${Object.keys(updates).length - 1} courses + assignedRooms`);
      } catch (err) {
        console.log(`   ❌ Update failed: ${err.message}`);
        failed++;
        continue;
      }
    } else {
      console.log(`   ✓ Would update ${Object.keys(updates).length - 1} courses + assignedRooms`);
    }

    report.push({
      professor: prof.name,
      moodleId: prof.moodleUserId,
      uid: prof.uid,
      courses: courses.map((c) => c.shortname || c.code || c.id),
      rooms: Object.keys(roomsToAssign),
    });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Professors considered: ${professors.length}`);
  console.log(`Courses assigned/updated: ${assigned}`);
  console.log(`Skipped (no courses): ${skipped}`);
  console.log(`Failed: ${failed}`);

  const reportText = report
    .map((r) => `${r.professor}\n  Moodle ID: ${r.moodleId}\n  UID: ${r.uid}\n  Courses: ${r.courses.join(", ")}\n  Rooms: ${r.rooms.join(", ")}\n`)
    .join("\n");
  writeFileSync("BULK_ASSIGN_REPORT.txt", reportText);
  console.log("\n📋 Report saved to: BULK_ASSIGN_REPORT.txt");

  if (isDryRun) {
    console.log("\n🔍 DRY RUN COMPLETE");
    console.log("Run with: DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs");
  } else if (failed === 0) {
    console.log("\n✅ Real course assignment complete.");
  }

  process.exit(failed > 0 ? 1 : 0);
}

bulkAssign().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});

