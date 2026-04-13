// scripts/seedFirebaseSessions.mjs
// Seeds Firebase /sessions with past sessions for all professors.
// Run once: node scripts/seedFirebaseSessions.mjs
//
// Prerequisites:
//   - serviceAccountKey.json at project root
//   - Flask API running on http://localhost:5000
//   - node >= 18 (built-in fetch)

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth }             from 'firebase-admin/auth'
import { getDatabase }         from 'firebase-admin/database'
import { readFileSync }        from 'fs'

// ── Firebase init ─────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
initializeApp({
  credential:  cert(serviceAccount),
  databaseURL: 'https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/',
})
const db = getDatabase()

// ── Config ────────────────────────────────────────────────────
const FLASK_URL = 'http://localhost:5000'

const SEMESTER_RANGES = {
  S26: { start: '2026-02-01', end: '2026-06-15' },
  F25: { start: '2025-09-15', end: '2026-01-25' },
}

const DAY_NUM = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 }

// ── Helpers ───────────────────────────────────────────────────
function toDateStr(d) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TODAY = toDateStr(new Date())
const ONE_WEEK_AGO = toDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

function isPast(dateStr) {
  return dateStr < TODAY
}

function firstOccurrence(dayNum, startDateStr) {
  const d = new Date(startDateStr + 'T00:00:00')
  while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)
  return d
}

function randomAttendance() {
  // Realistic attendance: 65–95%, varied per session
  return Math.round((65 + Math.random() * 30) * 10) / 10
}

function generatePastSessions(courses, professorUid, semesterKey) {
  const range = SEMESTER_RANGES[semesterKey]
  if (!range) return []

  // Cap end date at today to only generate past sessions
  const endDateStr = range.end < TODAY ? range.end : TODAY
  const endDate    = new Date(endDateStr + 'T23:59:59')
  const sessions   = []

  for (const course of courses) {
    for (const slot of (course.schedule ?? [])) {
      const dayNum = DAY_NUM[slot.day]
      if (dayNum == null) continue

      const cur = firstOccurrence(dayNum, range.start)

      while (cur <= endDate) {
        const dateStr = toDateStr(cur)

        // Only include dates strictly before today (exclude today's not-yet-ended sessions)
        if (isPast(dateStr)) {
          const id = `${course.shortname}-${dateStr}-${slot.starttime}`
          sessions.push({
            id,
            courseId:       course.shortname,
            moodleCourseId: course.id,
            courseName:     course.fullname,
            professorUid,
            roomId:         slot.room,
            date:           dateStr,
            startTime:      slot.starttime,
            endTime:        slot.endtime,
            type:           slot.type,
            status:         'past',
            attendanceRate: randomAttendance(),
            moodleSynced:   dateStr <= ONE_WEEK_AGO,
            envSummary: {
              avgTemp:  +(20 + Math.random() * 6).toFixed(1),
              avgCO2:   Math.round(450 + Math.random() * 350),
              avgNoise: Math.round(30 + Math.random() * 35),
            },
          })
        }

        cur.setDate(cur.getDate() + 7)
      }
    }
  }

  return sessions
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('Reading /professors from Firebase…')
  const profSnap = await db.ref('/professors').get()
  if (!profSnap.exists()) {
    console.error('No professors found in Firebase. Run createProfessors.mjs first.')
    process.exit(1)
  }

  const professors = []
  profSnap.forEach(child => {
    professors.push({ uid: child.key, ...child.val() })
  })
  console.log(`Found ${professors.length} professors.`)

  let totalWritten = 0

  for (const prof of professors) {
    if (!prof.moodleUserId) {
      console.warn(`  ⚠  ${prof.name} has no moodleUserId — skipping`)
      continue
    }

    // Fetch this professor's courses from Flask
    let courses
    try {
      const res = await fetch(`${FLASK_URL}/api/professors/${prof.moodleUserId}/courses`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      courses = await res.json()
    } catch (err) {
      console.warn(`  ⚠  Could not fetch courses for ${prof.name} (moodleUserId ${prof.moodleUserId}): ${err.message}`)
      continue
    }

    if (!courses.length) {
      console.log(`  –  ${prof.name}: no courses in Flask`)
      continue
    }

    // Generate past sessions for both semesters
    const s26 = generatePastSessions(courses, prof.uid, 'S26')
    const f25 = generatePastSessions(courses, prof.uid, 'F25')
    const all = [...s26, ...f25]

    if (!all.length) {
      console.log(`  –  ${prof.name}: no past sessions to seed`)
      continue
    }

    // Batch-write to Firebase (groups of 50 to stay within limits)
    const BATCH = 50
    for (let i = 0; i < all.length; i += BATCH) {
      const chunk = all.slice(i, i + BATCH)
      const updates = {}
      chunk.forEach(s => { updates[`/sessions/${s.id}`] = s })
      await db.ref('/').update(updates)
    }

    console.log(`  ✅ ${prof.name}: ${all.length} sessions written (${s26.length} S26 + ${f25.length} F25)`)
    totalWritten += all.length
  }

  console.log(`\nDone. ${totalWritten} total sessions written to Firebase /sessions.`)
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
