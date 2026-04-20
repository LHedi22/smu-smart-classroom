/**
 * Seeds one live session per room so every professor sees activity when they log in.
 *
 * Usage:
 *   node scripts/seedAllLiveSessions.mjs
 *   node scripts/seedAllLiveSessions.mjs --students 28 --dry-run
 *
 * What it does:
 *   1. Reads all professors + courses from Firebase.
 *   2. For each room (A101, B204, C310, D105), picks the first professor
 *      who owns a course in that room and creates a live session.
 *   3. Seeds N students (default 28) with 80% present into each session.
 *   4. Updates every professor's assignedRooms to include all their course rooms,
 *      so every professor sees their rooms on the Home page.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

const DB_URL = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/";
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({ credential: cert(serviceAccount), databaseURL: DB_URL });
const db = getDatabase();

const ALL_NAMES = [
  "Ahmed Ben Salah","Sarra Trabelsi","Mohamed Amine Jlassi","Rim Chaabane","Yassine Boughanmi",
  "Amira Sassi","Karim Mansour","Leila Hamdi","Oussama Feriani","Nadia Khalfallah",
  "Bilel Cherif","Hajer Arfaoui","Rami Ghodbane","Ines Zribi","Ayoub Haddad",
  "Fatma Jouini","Khalil Dridi","Mariem Boukari","Seifeddine Mrabet","Cyrine Elleuch",
  "Tarek Benzarti","Salma Bahri","Mehdi Karray","Asma Chihi","Nizar Achouri",
  "Dorra Hamrouni","Wassim Selmi","Hana Tlili","Fares Mathlouthi","Yosra Agrebi",
  "Amine Belhaj","Malek Triki",
];

function buildAttendance(courseId, count, presentCount, startHhmm) {
  const prefix = courseId.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  const [sh] = startHhmm.split(":");
  const students = {};
  for (let i = 0; i < count; i++) {
    const id = `${prefix}${String(i + 1).padStart(3, "0")}`;
    const present = i < presentCount;
    students[id] = {
      name: ALL_NAMES[i] ?? `Student ${i + 1}`,
      entryTime: present ? `${sh}:${String(Math.floor(i / 5)).padStart(2, "0")}` : null,
      exitTime: null,
      present,
      manualOverride: false,
      overrideNote: "",
      cameraConfidence: present ? parseFloat((0.85 + Math.random() * 0.14).toFixed(2)) : 0,
    };
  }
  return { enrolled: count, students };
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function toHHmm(d) {
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function parseArgs(argv) {
  const out = { students: 28, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") { out.dryRun = true; continue; }
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      out[key] = argv[i + 1];
      i++;
    }
  }
  out.students = parseInt(out.students, 10) || 28;
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const studentCount = args.students;
  const presentCount = Math.round(studentCount * 0.8);
  const dryRun = args.dryRun;

  const [profSnap, courseSnap] = await Promise.all([
    db.ref("/professors").get(),
    db.ref("/courses").get(),
  ]);

  const professors = [];
  profSnap.forEach(child => professors.push({ uid: child.key, ...child.val() }));
  const coursesMap = courseSnap.exists() ? courseSnap.val() : {};
  const allCourses = Object.entries(coursesMap).map(([key, val]) => ({ key, ...val }));

  // Build: professorUid → list of courses they own
  const profCourses = {};
  for (const prof of professors) {
    profCourses[prof.uid] = allCourses.filter(c =>
      (c.professorUid && c.professorUid === prof.uid) ||
      (c.professorId != null && Number(c.professorId) === Number(prof.moodleUserId))
    );
  }

  // Collect all rooms each professor's courses use
  const profRooms = {}; // uid → Set of roomIds
  for (const prof of professors) {
    const rooms = new Set();
    for (const c of profCourses[prof.uid] ?? []) {
      if (c.room) rooms.add(c.room);
    }
    profRooms[prof.uid] = rooms;
  }

  // For each room, pick the first professor who owns a course there
  const ROOMS = ["A101", "B204", "C310", "D105"];
  const roomAssignments = {}; // roomId → { prof, course }

  for (const roomId of ROOMS) {
    for (const prof of professors) {
      const course = (profCourses[prof.uid] ?? []).find(c => c.room === roomId);
      if (course) {
        roomAssignments[roomId] = { prof, course };
        break;
      }
    }
  }

  const now = new Date();
  const dateStr = toDateStr(now);
  const hhmm = toHHmm(now);
  const updates = {};

  console.log(`\nSeeding ${ROOMS.length} live sessions (${studentCount} students each, ${presentCount} present)\n`);

  for (const roomId of ROOMS) {
    const assignment = roomAssignments[roomId];
    if (!assignment) {
      console.log(`  ${roomId}: no professor found with a course in this room — skipping`);
      continue;
    }

    const { prof, course } = assignment;
    const courseId = course.code || course.courseId || course.key;
    const courseName = course.name || course.fullname || courseId;
    const sessionId = `${courseId}-${dateStr}-${hhmm}-LIVE-${String(prof.uid).slice(0, 6)}`;

    const activeSession = {
      sessionId,
      courseId,
      courseName,
      moodleCourseId: course.moodleCourseId ?? null,
      professorUid: prof.uid,
      professorId: Number.isFinite(Number(prof.moodleUserId)) ? Number(prof.moodleUserId) : null,
      roomId,
      startTime: now.toISOString(),
      endTime: null,
      type: "Lecture",
      status: "live",
    };

    const attendanceData = buildAttendance(courseId, studentCount, presentCount, hhmm);
    const attendanceRate = parseFloat(((presentCount / studentCount) * 100).toFixed(1));

    updates[`/classrooms/${roomId}/activeSession`] = activeSession;
    updates[`/classrooms/${roomId}/attendance/${sessionId}`] = attendanceData;
    updates[`/sessions/${sessionId}`] = {
      id: sessionId, courseId, courseName,
      professorUid: prof.uid,
      professorId: activeSession.professorId,
      roomId, date: dateStr, startTime: hhmm, endTime: null,
      type: "Lecture", status: "live",
      attendanceRate, moodleSynced: false,
    };

    console.log(`  ${roomId}: ${courseId} — ${prof.name} (moodleId: ${prof.moodleUserId})`);
    console.log(`    session: ${sessionId}`);
  }

  // Update assignedRooms for EVERY professor based on their course rooms
  console.log("\nUpdating assignedRooms for all professors:");
  for (const prof of professors) {
    const rooms = profRooms[prof.uid];
    if (!rooms || rooms.size === 0) {
      console.log(`  ${prof.name}: no courses in Firebase — skipping assignedRooms`);
      continue;
    }
    const existing = prof.assignedRooms ?? {};
    const merged = { ...existing };
    for (const r of rooms) merged[r] = true;

    // Only write if something changed
    const changed = [...rooms].some(r => !existing[r]);
    if (changed) {
      updates[`/professors/${prof.uid}/assignedRooms`] = merged;
      console.log(`  ${prof.name}: ${Object.keys(merged).join(", ")}`);
    } else {
      console.log(`  ${prof.name}: already up to date (${Object.keys(existing).join(", ")})`);
    }
  }

  if (dryRun) {
    console.log("\nDRY RUN — no writes performed.");
    console.log(JSON.stringify(updates, null, 2));
    process.exit(0);
  }

  await db.ref("/").update(updates);
  console.log("\nDone. All live sessions seeded and assignedRooms updated.");
  console.log("Professors must log out and back in for assignedRooms changes to take effect.\n");
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
