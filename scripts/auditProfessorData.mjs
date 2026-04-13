/**
 * PHASE 1 AUDIT: Professor Data Investigation
 * 
 * Identifies why 20 professors see no courses but have "upcoming sessions"
 * Checks: Database structure, identifiers, enrollments, assignments
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { readFileSync, writeFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = getDatabase();

// The 20 professors with issues
const problematicProfessors = [
  { name: "Adel Kaabia", moodleId: 24 },
  { name: "Ahmed Jallouli", moodleId: 13 },
  { name: "Amira Chebil", moodleId: 29 },
  { name: "Bilel Marzouk", moodleId: 23 },
  { name: "Chokri Ben Amor", moodleId: 21 },
  { name: "Fatma Trabelsi", moodleId: 14 },
  { name: "Hatem Ferjani", moodleId: 32 },
  { name: "Hind Ferchichi", moodleId: 15 },
  { name: "Ines Miled", moodleId: 26 },
  { name: "Karim Gharbi", moodleId: 22 },
  { name: "Leila Bouzid", moodleId: 19 },
  { name: "Mohamed Ben Salah", moodleId: 16 },
  { name: "Nabil Zouari", moodleId: 31 },
  { name: "Rani Rekik", moodleId: 17 },
  { name: "Rim Hammami", moodleId: 20 },
  { name: "Sofiane Dridi", moodleId: 28 },
  { name: "Sonia Khelifi", moodleId: 25 },
  { name: "Tarek Bouaziz", moodleId: 18 },
  { name: "Wafa Jlassi", moodleId: 30 },
  { name: "Youssef Mansouri", moodleId: 27 },
];

const report = {
  timestamp: new Date().toISOString(),
  sections: [],
  summary: {},
};

async function addSection(title, content) {
  report.sections.push({ title, content });
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${title}`);
  console.log(`${"=".repeat(60)}`);
  console.log(content);
}

async function runAudit() {
  console.log("🔍 PHASE 1 AUDIT: Professor Data Investigation\n");

  // ─── SECTION 1: Firebase Professor Records ───────────────────────
  console.log("📊 CHECKING: Firebase professor records...");
  const profsSnap = await db.ref('professors').once('value');
  const allProfs = profsSnap.val() || {};
  const profsByMoodleId = {};

  let missingMoodleId = 0;
  let correctMoodleIds = 0;

  Object.entries(allProfs).forEach(([uid, prof]) => {
    if (prof.moodleUserId) {
      profsByMoodleId[prof.moodleUserId] = { uid, ...prof };
      correctMoodleIds++;
    } else {
      missingMoodleId++;
    }
  });

  let section1 = `Total professors in Firebase: ${Object.keys(allProfs).length}\n`;
  section1 += `✅ With moodleUserId: ${correctMoodleIds}\n`;
  section1 += `❌ Missing moodleUserId: ${missingMoodleId}\n\n`;
  section1 += `Moodle ID → Firebase UID mapping:\n`;

  problematicProfessors.forEach(p => {
    const found = profsByMoodleId[p.moodleId];
    if (found) {
      section1 += `  ✅ ${p.moodleId} (${p.name}) → ${found.uid}\n`;
    } else {
      section1 += `  ❌ ${p.moodleId} (${p.name}) → NOT FOUND in Firebase\n`;
    }
  });

  await addSection("1️⃣ FIREBASE PROFESSOR RECORDS", section1);
  report.summary.totalProfs = Object.keys(allProfs).length;
  report.summary.profsWithMoodleId = correctMoodleIds;
  report.summary.profsWithoutMoodleId = missingMoodleId;

  // ─── SECTION 2: Course Assignments ───────────────────────────────
  console.log("📊 CHECKING: Course assignments...");
  const coursesSnap = await db.ref('courses').once('value');
  const allCourses = coursesSnap.val() || {};

  let coursesWithProfUid = 0;
  let coursesWithProfId = 0;
  let coursesWithBoth = 0;
  let unassignedCourses = 0;
  const coursesByProfMoodleId = {};

  Object.entries(allCourses).forEach(([id, course]) => {
    const hasProfUid = !!course.professorUid;
    const hasProfId = !!course.professorId;

    if (hasProfUid) coursesWithProfUid++;
    if (hasProfId) coursesWithProfId++;
    if (hasProfUid && hasProfId) coursesWithBoth++;
    if (!hasProfUid && !hasProfId) unassignedCourses++;

    if (course.professorId) {
      if (!coursesByProfMoodleId[course.professorId]) {
        coursesByProfMoodleId[course.professorId] = [];
      }
      coursesByProfMoodleId[course.professorId].push({ id, ...course });
    }
  });

  let section2 = `Total courses: ${Object.keys(allCourses).length}\n`;
  section2 += `  - With professorUid: ${coursesWithProfUid}\n`;
  section2 += `  - With professorId: ${coursesWithProfId}\n`;
  section2 += `  - With BOTH: ${coursesWithBoth}\n`;
  section2 += `  - ❌ Unassigned: ${unassignedCourses}\n\n`;
  section2 += `Courses assigned to each professor:\n`;

  problematicProfessors.forEach(p => {
    const courses = coursesByProfMoodleId[p.moodleId] || [];
    if (courses.length > 0) {
      section2 += `  ✅ ${p.moodleId} (${p.name}): ${courses.length} courses\n`;
      courses.forEach(c => {
        section2 += `     - ${c.code} (${c.id}): room=${c.room}, professorUid=${c.professorUid}\n`;
      });
    } else {
      section2 += `  ❌ ${p.moodleId} (${p.name}): NO COURSES ASSIGNED\n`;
    }
  });

  await addSection("2️⃣ COURSE ASSIGNMENTS", section2);
  report.summary.totalCourses = Object.keys(allCourses).length;
  report.summary.coursesWithBothIds = coursesWithBoth;
  report.summary.unassignedCourses = unassignedCourses;

  // ─── SECTION 3: Firebase UID Validation ──────────────────────────
  console.log("📊 CHECKING: Firebase UID validity...");
  let section3 = `Validating professors' Firebase UIDs:\n\n`;

  const uidMismatches = [];
  const uidsInUse = new Set(Object.keys(allProfs));

  Object.entries(coursesByProfMoodleId).forEach(([moodleId, courses]) => {
    const profInDb = profsByMoodleId[moodleId];
    if (!profInDb) {
      section3 += `❌ Moodle ID ${moodleId}: Professor not found in Firebase\n`;
      return;
    }

    courses.forEach(course => {
      if (course.professorUid !== profInDb.uid) {
        section3 += `⚠️  Course ${course.code}:\n`;
        section3 += `    Expected UID: ${profInDb.uid}\n`;
        section3 += `    Actual UID:   ${course.professorUid}\n`;
        section3 += `    Mismatch found!\n`;
        uidMismatches.push({
          course: course.code,
          expectedUid: profInDb.uid,
          actualUid: course.professorUid,
        });
      }
    });
  });

  if (uidMismatches.length === 0) {
    section3 += `✅ All Firebase UIDs are valid and match professor records\n`;
  } else {
    section3 += `\n⚠️  Total UID mismatches found: ${uidMismatches.length}\n`;
  }

  await addSection("3️⃣ FIREBASE UID VALIDATION", section3);
  report.summary.uidMismatches = uidMismatches.length;

  // ─── SECTION 4: Sessions in Firebase ────────────────────────────
  console.log("📊 CHECKING: Sessions in Firebase...");
  const sessionsSnap = await db.ref('sessions').once('value');
  const allSessions = sessionsSnap.val() || {};
  const sessionsByProfId = {};

  Object.entries(allSessions).forEach(([id, session]) => {
    if (session.professorId) {
      if (!sessionsByProfId[session.professorId]) {
        sessionsByProfId[session.professorId] = [];
      }
      sessionsByProfId[session.professorId].push({ id, ...session });
    }
  });

  let section4 = `Total sessions in Firebase: ${Object.keys(allSessions).length}\n`;
  section4 += `Sessions stored by professorId:\n`;

  problematicProfessors.forEach(p => {
    const sessions = sessionsByProfId[p.moodleId] || [];
    if (sessions.length > 0) {
      section4 += `  ✅ ${p.moodleId} (${p.name}): ${sessions.length} sessions\n`;
      const dates = sessions.map(s => s.date).sort();
      section4 += `     Date range: ${dates[0]} to ${dates[dates.length - 1]}\n`;
    } else {
      section4 += `  ❌ ${p.moodleId} (${p.name}): NO SESSIONS\n`;
    }
  });

  await addSection("4️⃣ SESSIONS IN FIREBASE", section4);
  report.summary.totalSessions = Object.keys(allSessions).length;

  // ─── SECTION 5: Assigned Rooms ───────────────────────────────────
  console.log("📊 CHECKING: Assigned rooms...");
  let section5 = `Checking assignedRooms for each professor:\n`;

  problematicProfessors.forEach(p => {
    const prof = profsByMoodleId[p.moodleId];
    if (!prof) {
      section5 += `  ❌ ${p.name}: NOT FOUND\n`;
      return;
    }

    const rooms = prof.assignedRooms ? Object.keys(prof.assignedRooms) : [];
    section5 += `  ${p.name}:\n`;
    section5 += `     Firebase UID: ${prof.uid}\n`;
    section5 += `     Assigned rooms: ${rooms.length > 0 ? rooms.join(", ") : "NONE"}\n`;

    if (rooms.length === 0) {
      section5 += `     ⚠️  No assigned rooms!\n`;
    }
  });

  await addSection("5️⃣ ASSIGNED ROOMS", section5);

  // ─── SECTION 6: Data Consistency Check ────────────────────────────
  console.log("📊 CHECKING: Data consistency...");
  let section6 = `Comprehensive consistency check:\n\n`;

  const issues = [];

  problematicProfessors.forEach(p => {
    const prof = profsByMoodleId[p.moodleId];
    const courses = coursesByProfMoodleId[p.moodleId] || [];
    const sessions = sessionsByProfId[p.moodleId] || [];
    const rooms = prof ? Object.keys(prof.assignedRooms || {}) : [];

    const issuesList = [];

    if (!prof) {
      issuesList.push(`Professor not in Firebase database`);
    }

    if (courses.length === 0) {
      issuesList.push(`No courses assigned`);
    }

    if (sessions.length === 0 && courses.length > 0) {
      issuesList.push(`Courses exist but no sessions generated`);
    }

    if (rooms.length === 0 && courses.length > 0) {
      issuesList.push(`Courses exist but no assigned rooms`);
    }

    courses.forEach(c => {
      if (!prof || c.professorUid !== prof.uid) {
        issuesList.push(`Course ${c.code} has wrong Firebase UID`);
      }
      if (!rooms.includes(c.room)) {
        issuesList.push(`Course ${c.code} room not in assignedRooms`);
      }
    });

    if (issuesList.length > 0) {
      section6 += `⚠️  ${p.name} (Moodle ID: ${p.moodleId}):\n`;
      issuesList.forEach(issue => {
        section6 += `   - ${issue}\n`;
      });
      issues.push({ professor: p.name, issues: issuesList });
    } else {
      section6 += `✅ ${p.name}: All data consistent\n`;
    }
  });

  await addSection("6️⃣ DATA CONSISTENCY CHECK", section6);
  report.summary.professionalsWithIssues = issues.length;

  // ─── FINAL SUMMARY ───────────────────────────────────────────────
  console.log("\n\n");
  const summaryText = `
ROOT CAUSE ANALYSIS SUMMARY
═════════════════════════════════════════════════════════════

FINDINGS:
${issues.length > 0 ? `⚠️  ${issues.length} professors have data inconsistencies` : "✅ All professors have consistent data"}

Total Professors: ${report.summary.totalProfs}
Total Courses: ${report.summary.totalCourses}
Total Sessions: ${report.summary.totalSessions}

Data Quality:
- Courses with both IDs: ${report.summary.coursesWithBothIds}
- UID mismatches: ${report.summary.uidMismatches}
- Unassigned courses: ${report.summary.unassignedCourses}

WHY PROFESSORS SEE "UPCOMING SESSIONS" BUT NO COURSES:
${(() => {
    if (issues.length === 0) {
      return "✅ All data is consistent. Sessions should display correctly.";
    }
    if (report.summary.uidMismatches > 0) {
      return "❌ Firebase UIDs don't match. Professors fetch by Moodle ID (works) but admin view searches by UID (fails).";
    }
    if (report.summary.unassignedCourses > 0) {
      return "❌ Courses are unassigned. Professor sees generated sessions but not course details.";
    }
    return "❌ Multiple data consistency issues detected.";
  })()}

RECOMMENDATION:
1. Review list of affected professors below
2. Check if Firebase UIDs were recreated (new login = new UID)
3. Re-assign courses using current Firebase UIDs
4. Verify sessions appear in professor dashboard

═════════════════════════════════════════════════════════════
  `;

  await addSection("📋 SUMMARY", summaryText);

  // ─── WRITE REPORT ───────────────────────────────────────────────
  const reportText = report.sections.map(s => `${s.title}\n${"─".repeat(60)}\n${s.content}\n`).join("\n");

  writeFileSync("PHASE_1_AUDIT_REPORT.txt", reportText);
  console.log("\n✅ Report written to: PHASE_1_AUDIT_REPORT.txt");

  console.log(`\n📊 QUICK STATS:`);
  console.log(`   Total professors: ${report.summary.totalProfs}`);
  console.log(`   Total courses: ${report.summary.totalCourses}`);
  console.log(`   Total sessions: ${report.summary.totalSessions}`);
  console.log(`   Professors with issues: ${issues.length}/20`);
  console.log(`   UID mismatches: ${report.summary.uidMismatches}`);

  process.exit(0);
}

runAudit().catch(err => {
  console.error("❌ Audit error:", err.message);
  process.exit(1);
});
