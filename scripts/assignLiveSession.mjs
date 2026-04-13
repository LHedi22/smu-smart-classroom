/**
 * Manually assign/start a live session for any professor at any time.
 *
 * Examples:
 *   node scripts/assignLiveSession.mjs --professor a.a.jallouli@smu.tn
 *   node scripts/assignLiveSession.mjs --professor 13 --course ISS201 --room D105
 *   node scripts/assignLiveSession.mjs --professor "Dr. Rim Hammami" --course MATH142 --start 14:30 --force
 *
 * Notes:
 * - professor can be: uid, moodleUserId, email, or name.
 * - start can be: now (default), ISO datetime, or HH:mm (today local time).
 * - one room can only hold one activeSession; use --force to overwrite.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

const DB_URL = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/";
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: DB_URL,
});

const db = getDatabase();

function usage() {
  console.log(`
Usage:
  node scripts/assignLiveSession.mjs --professor <uid|moodleId|email|name> [options]

Options:
  --course <code|id|name>     Optional. If omitted, first owned course is used.
  --room <roomId>             Optional. If omitted, inferred from course/schedule/prof rooms.
  --start <now|ISO|HH:mm>     Optional. Default: now
  --type <Lecture|Tutorial>   Optional. Default: Lecture
  --force                     Overwrite existing room activeSession
  --dry-run                   Print changes without writing
  --help                      Show this help
`);
}

function parseArgs(argv) {
  const out = { force: false, dryRun: false, type: "Lecture", start: "now" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") out.force = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
      out[key] = value;
      i++;
    }
  }
  return out;
}

function parseStart(input) {
  if (!input || input === "now") return new Date();

  const hhmm = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const m = String(input).match(hhmm);
  if (m) {
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  }

  const iso = new Date(input);
  if (!Number.isNaN(iso.getTime())) return iso;

  throw new Error(`Invalid --start value: "${input}". Use now, ISO datetime, or HH:mm.`);
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHHmm(d) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

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

function resolveProfessor(professors, rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) throw new Error("Missing --professor");

  const byUid = professors.find((p) => p.uid === query);
  if (byUid) return byUid;

  const numeric = Number(query);
  if (Number.isFinite(numeric)) {
    const byMoodleId = professors.find((p) => Number(p.moodleUserId) === numeric);
    if (byMoodleId) return byMoodleId;
  }

  const lower = query.toLowerCase();
  const byEmail = professors.find((p) => String(p.email || "").toLowerCase() === lower);
  if (byEmail) return byEmail;

  const byNameExact = professors.find((p) => String(p.name || "").toLowerCase() === lower);
  if (byNameExact) return byNameExact;

  const byNamePartial = professors.filter((p) => String(p.name || "").toLowerCase().includes(lower));
  if (byNamePartial.length === 1) return byNamePartial[0];
  if (byNamePartial.length > 1) {
    throw new Error(
      `Professor query is ambiguous. Matches: ${byNamePartial.map((p) => `${p.name} (${p.uid})`).join(", ")}`
    );
  }

  throw new Error(`Professor not found for query: "${query}"`);
}

function courseOwnedByProfessor(course, professor) {
  const hasUid = !!course.professorUid;
  const hasId = course.professorId != null;
  const uidMatches = hasUid && course.professorUid === professor.uid;
  const idMatches = hasId && Number(course.professorId) === Number(professor.moodleUserId);

  if (hasUid && hasId) return uidMatches && idMatches;
  if (hasUid) return uidMatches;
  if (hasId) return idMatches;
  return false;
}

function resolveCourse(coursesMap, professor, rawCourseQuery) {
  const allCourses = Object.entries(coursesMap || {}).map(([key, val]) => ({ key, ...val }));
  const owned = allCourses.filter((c) => courseOwnedByProfessor(c, professor));
  if (!owned.length) throw new Error(`No courses owned by ${professor.name}.`);

  if (!rawCourseQuery) return owned[0];

  const q = String(rawCourseQuery).trim().toLowerCase();
  const match = owned.find((c) => {
    const moodleId = c.moodleCourseId != null ? String(c.moodleCourseId).toLowerCase() : "";
    const code = String(c.code || c.courseId || c.key || "").toLowerCase();
    const name = String(c.name || c.fullname || "").toLowerCase();
    return moodleId === q || code === q || name === q || code.includes(q) || name.includes(q);
  });

  if (!match) {
    throw new Error(`Course "${rawCourseQuery}" not found among professor-owned courses.`);
  }
  return match;
}

function inferRoom(course, professor, explicitRoom) {
  if (explicitRoom) return explicitRoom;

  const slots = normalizeSchedule(course.schedule, course.room);
  if (slots[0]?.room) return slots[0].room;
  if (course.room) return course.room;

  const profRooms = Object.keys(professor.assignedRooms || {});
  if (profRooms.length) return profRooms[0];

  throw new Error("Could not infer room. Provide --room explicitly.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }
  if (!args.professor) {
    usage();
    throw new Error("Missing required argument --professor");
  }

  const startAt = parseStart(args.start);
  const [profSnap, courseSnap] = await Promise.all([
    db.ref("/professors").get(),
    db.ref("/courses").get(),
  ]);

  const professors = [];
  profSnap.forEach((child) => professors.push({ uid: child.key, ...child.val() }));
  const coursesMap = courseSnap.exists() ? courseSnap.val() : {};

  const professor = resolveProfessor(professors, args.professor);
  const course = resolveCourse(coursesMap, professor, args.course);
  const roomId = inferRoom(course, professor, args.room);

  const activeRef = db.ref(`/classrooms/${roomId}/activeSession`);
  const activeSnap = await activeRef.get();
  if (activeSnap.exists() && !args.force) {
    const active = activeSnap.val();
    throw new Error(
      `Room ${roomId} already has activeSession (${active.courseId || "unknown"} / ${active.professorUid || "unknown"}). Use --force to overwrite.`
    );
  }

  const dateStr = toDateStr(startAt);
  const hhmm = toHHmm(startAt);
  const shortUid = String(professor.uid || "nouid").slice(0, 6);
  const courseId = String(course.code || course.courseId || course.key);
  const courseName = String(course.name || course.fullname || courseId);
  const sessionId = `${courseId}-${dateStr}-${hhmm}-LIVE-${shortUid}`;
  const type = args.type || "Lecture";

  const activeSession = {
    sessionId,
    courseId,
    courseName,
    moodleCourseId: course.moodleCourseId ?? course.id ?? null,
    professorUid: professor.uid,
    professorId: Number.isFinite(Number(professor.moodleUserId)) ? Number(professor.moodleUserId) : null,
    roomId,
    startTime: startAt.toISOString(),
    endTime: null,
    type,
    status: "live",
  };

  const sessionRecord = {
    id: sessionId,
    courseId,
    courseName,
    moodleCourseId: activeSession.moodleCourseId,
    professorUid: activeSession.professorUid,
    professorId: activeSession.professorId,
    roomId,
    date: dateStr,
    startTime: hhmm,
    endTime: null,
    type,
    status: "live",
    attendanceRate: null,
    moodleSynced: false,
  };

  const updates = {
    [`/classrooms/${roomId}/activeSession`]: activeSession,
    [`/classrooms/${roomId}/attendance/${sessionId}`]: { enrolled: 0, students: {} },
    [`/sessions/${sessionId}`]: sessionRecord,
  };

  if (args.dryRun) {
    console.log("DRY RUN - no write performed");
    console.log(JSON.stringify({ professor, selectedCourse: course, roomId, activeSession }, null, 2));
    process.exit(0);
  }

  await db.ref("/").update(updates);

  console.log("Live session assigned successfully.");
  console.log(`Professor: ${professor.name} (${professor.uid})`);
  console.log(`Course: ${courseId} - ${courseName}`);
  console.log(`Room: ${roomId}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`Start: ${activeSession.startTime}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

