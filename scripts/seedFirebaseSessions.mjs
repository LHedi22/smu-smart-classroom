// scripts/seedFirebaseSessions.mjs
// Seeds Firebase /sessions with past sessions and creates one live session per professor.
// Run: node scripts/seedFirebaseSessions.mjs
//
// Data source priority for alignment:
// 1) /courses assigned to professor (professorUid/professorId)
// 2) Flask /api/professors/{moodleUserId}/courses (fallback)
//
// This keeps seeded sessions aligned with actual professor-course assignments.

import { initializeApp, cert } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/',
})

const db = getDatabase()
const FLASK_URL = 'http://localhost:5000'

const SEMESTER_RANGES = {
  S26: { start: '2026-02-01', end: '2026-06-15' },
  F25: { start: '2025-09-15', end: '2026-01-25' },
}

const DAY_NUM = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 }
const STUDENT_NAMES = [
  'Ahmed Ben Salah', 'Sarra Trabelsi', 'Mohamed Amine Jlassi', 'Rim Chaabane',
  'Yassine Boughanmi', 'Amira Sassi', 'Karim Mansour', 'Leila Hamdi',
  'Oussama Feriani', 'Nadia Khalfallah', 'Bilel Cherif', 'Hajer Arfaoui',
  'Rami Ghodbane', 'Ines Zribi', 'Ayoub Haddad', 'Fatma Jouini',
  'Khalil Dridi', 'Mariem Boukari', 'Seifeddine Mrabet', 'Cyrine Elleuch',
  'Tarek Benzarti', 'Salma Bahri', 'Mehdi Karray', 'Asma Chihi',
  'Nizar Achouri', 'Dorra Hamrouni', 'Wassim Selmi', 'Hana Tlili',
  'Fares Mathlouthi', 'Yosra Agrebi', 'Amine Belhaj', 'Malek Triki',
]

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toISOWithClock(dateStr, hhmm) {
  const [h, m] = String(hhmm || '09:00').split(':').map(Number)
  const d = new Date(`${dateStr}T00:00:00`)
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0)
  return d.toISOString()
}

function firstOccurrence(dayNum, startDateStr) {
  const d = new Date(startDateStr + 'T00:00:00')
  while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)
  return d
}

function randomAttendance() {
  return Math.round((65 + Math.random() * 30) * 10) / 10
}

function buildStudents(seedKey, count = 30) {
  const students = {}
  for (let i = 0; i < count; i++) {
    const id = `${seedKey}-${String(i + 1).padStart(3, '0')}`
    const present = i < Math.floor(count * 0.8)
    students[id] = {
      name: STUDENT_NAMES[i] ?? `Student ${i + 1}`,
      present,
      entryTime: present ? '09:00' : null,
      exitTime: null,
      manualOverride: false,
      overrideNote: '',
      cameraConfidence: present ? 0.9 : 0,
    }
  }
  return { enrolled: count, students }
}

function normalizeSchedule(schedule, fallbackRoom = '') {
  if (!schedule) return []

  if (Array.isArray(schedule)) {
    return schedule
      .filter(slot => slot && slot.day)
      .map(slot => ({
        day: slot.day,
        starttime: slot.starttime || slot.startTime || '09:00',
        endtime: slot.endtime || slot.endTime || '10:30',
        room: slot.room || fallbackRoom || '',
        type: slot.type || 'Lecture',
      }))
      .filter(slot => slot.room)
  }

  if (
    schedule.days &&
    Array.isArray(schedule.days) &&
    schedule.startTime &&
    schedule.endTime
  ) {
    return schedule.days.map(day => ({
      day,
      starttime: schedule.startTime,
      endtime: schedule.endTime,
      room: schedule.room || fallbackRoom || '',
      type: schedule.type || 'Lecture',
    })).filter(slot => slot.room)
  }

  return []
}

function buildPastSessions(courses, prof, semesterKey) {
  const range = SEMESTER_RANGES[semesterKey]
  if (!range) return []

  const today = toDateStr(new Date())
  const endDateStr = range.end < today ? range.end : today
  const endDate = new Date(endDateStr + 'T23:59:59')
  const sessions = []

  for (const course of courses) {
    const slots = normalizeSchedule(course.schedule, course.room)
    for (const slot of slots) {
      const dayNum = DAY_NUM[slot.day]
      if (dayNum == null) continue

      const cur = firstOccurrence(dayNum, range.start)
      while (cur <= endDate) {
        const dateStr = toDateStr(cur)
        if (dateStr < today) {
          const id = `${course.shortname}-${dateStr}-${slot.starttime}`
          sessions.push({
            id,
            courseId: course.shortname,
            moodleCourseId: course.id,
            courseName: course.fullname,
            professorUid: prof.uid ?? null,
            professorId: Number.isFinite(Number(prof.moodleUserId)) ? Number(prof.moodleUserId) : null,
            roomId: slot.room,
            date: dateStr,
            startTime: slot.starttime,
            endTime: slot.endtime,
            type: slot.type,
            status: 'past',
            attendanceRate: randomAttendance(),
            moodleSynced: dateStr < toDateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            attendance: buildStudents(course.shortname),
          })
        }
        cur.setDate(cur.getDate() + 7)
      }
    }
  }

  return sessions
}

function pickLiveSlot(courses, assignedRoomIds) {
  for (const course of courses) {
    const slots = normalizeSchedule(course.schedule, course.room)
    for (const slot of slots) {
      if (slot.room && assignedRoomIds.has(slot.room)) {
        return { course, slot }
      }
    }
  }
  return null
}

function mapFirebaseCoursesForProfessor(coursesMap, prof) {
  const out = []
  for (const [courseKey, course] of Object.entries(coursesMap || {})) {
    const hasCourseUid = !!course.professorUid
    const hasCourseId = course.professorId != null
    const uidMatches = !!(prof.uid && hasCourseUid && course.professorUid === prof.uid)
    const idMatches = !!(prof.moodleUserId != null && hasCourseId && Number(course.professorId) === Number(prof.moodleUserId))

    // Strict ownership:
    // - If both fields exist on course, BOTH must match the same professor.
    // - If only one exists, that one must match.
    const ownedByProfessor =
      (hasCourseUid && hasCourseId && uidMatches && idMatches) ||
      (hasCourseUid && !hasCourseId && uidMatches) ||
      (!hasCourseUid && hasCourseId && idMatches)

    if (!ownedByProfessor) continue

    out.push({
      id: course.moodleCourseId ?? course.id ?? courseKey,
      shortname: course.code ?? course.courseId ?? courseKey,
      fullname: course.name ?? course.fullname ?? course.code ?? courseKey,
      room: course.room ?? '',
      schedule: course.schedule ?? [],
    })
  }
  return out
}

function deriveProfessorTargets(knownProfessors, allCourses) {
  const byUid = Object.fromEntries(
    knownProfessors.filter(p => p.uid).map(p => [p.uid, p])
  )
  const byMoodleId = Object.fromEntries(
    knownProfessors
      .filter(p => p.moodleUserId != null)
      .map(p => [String(p.moodleUserId), p])
  )

  const targetMap = new Map()
  for (const p of knownProfessors) {
    const key = p.uid || `id:${p.moodleUserId}`
    targetMap.set(key, { ...p, assignedRooms: { ...(p.assignedRooms || {}) } })
  }

  for (const course of Object.values(allCourses || {})) {
    const uid = course.professorUid || null
    const moodleId = course.professorId != null ? Number(course.professorId) : null

    let base =
      (uid && byUid[uid]) ||
      (moodleId != null && byMoodleId[String(moodleId)]) ||
      null

    if (!base) {
      base = {
        uid: uid || null,
        moodleUserId: Number.isFinite(moodleId) ? moodleId : null,
        name: `Professor ${moodleId ?? uid ?? 'unknown'}`,
        assignedRooms: {},
      }
    } else {
      base = { ...base, assignedRooms: { ...(base.assignedRooms || {}) } }
    }

    const room = course.room || ''
    if (room) base.assignedRooms[room] = true

    const key = base.uid || `id:${base.moodleUserId}`
    targetMap.set(key, base)
  }

  return [...targetMap.values()]
}

async function fetchFlaskCourses(moodleUserId) {
  const res = await fetch(`${FLASK_URL}/api/professors/${moodleUserId}/courses`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function main() {
  console.log('Reading /professors and /courses from Firebase...')
  const [profSnap, coursesSnap] = await Promise.all([
    db.ref('/professors').get(),
    db.ref('/courses').get(),
  ])

  if (!profSnap.exists()) {
    console.error('No professors found in Firebase. Run createProfessors.mjs first.')
    process.exit(1)
  }

  const professors = []
  profSnap.forEach((child) => {
    professors.push({ uid: child.key, ...child.val() })
  })
  const allCourses = coursesSnap.exists() ? coursesSnap.val() : {}
  const targets = deriveProfessorTargets(professors, allCourses)

  console.log(`Found professors in /professors: ${professors.length}`)
  console.log(`Derived seeding targets: ${targets.length}`)

  let totalSessions = 0
  let liveCreated = 0
  let liveSkippedDueRoomCollision = 0
  let skipped = 0
  const roomsWithActiveSession = new Set()

  for (const prof of targets) {
    let courses = mapFirebaseCoursesForProfessor(allCourses, prof)
    if (!courses.length && prof.moodleUserId != null) {
      try {
        courses = await fetchFlaskCourses(prof.moodleUserId)
      } catch (err) {
        console.warn(`⚠ ${prof.name}: could not load Flask courses (${err.message})`)
      }
    }

    if (!courses.length) {
      console.warn(`⚠ ${prof.name}: no aligned courses found, skipping`)
      skipped++
      continue
    }

    const inferredRooms = new Set()
    for (const c of courses) {
      const slots = normalizeSchedule(c.schedule, c.room)
      for (const slot of slots) {
        if (slot.room) inferredRooms.add(slot.room)
      }
    }
    const assignedRoomIds = new Set([
      ...Object.keys(prof.assignedRooms || {}),
      ...inferredRooms,
    ])
    if (!assignedRoomIds.size) {
      console.warn(`⚠ ${prof.name}: no rooms could be inferred, skipping`)
      skipped++
      continue
    }

    const s26 = buildPastSessions(courses, prof, 'S26')
    const f25 = buildPastSessions(courses, prof, 'F25')
    const pastSessions = [...s26, ...f25]

    const updates = {}
    for (const session of pastSessions) {
      updates[`/sessions/${session.id}`] = session
    }

    const liveChoice = pickLiveSlot(courses, assignedRoomIds)
    if (liveChoice) {
      if (roomsWithActiveSession.has(liveChoice.slot.room)) {
        liveSkippedDueRoomCollision++
      } else {
        const now = new Date()
        const today = toDateStr(now)
        const liveSessionId = `${liveChoice.course.shortname}-${today}-${liveChoice.slot.starttime}-LIVE-${String((prof.uid || `id${prof.moodleUserId || 'x'}`)).slice(0, 6)}`
        const liveAttendance = buildStudents(liveChoice.course.shortname)

        updates[`/classrooms/${liveChoice.slot.room}/activeSession`] = {
          sessionId: liveSessionId,
          courseId: liveChoice.course.shortname,
          moodleCourseId: liveChoice.course.id,
          courseName: liveChoice.course.fullname,
          professorUid: prof.uid ?? null,
          professorId: Number.isFinite(Number(prof.moodleUserId)) ? Number(prof.moodleUserId) : null,
          roomId: liveChoice.slot.room,
          startTime: toISOWithClock(today, liveChoice.slot.starttime),
          endTime: null,
          type: liveChoice.slot.type || 'Lecture',
          status: 'live',
        }

        updates[`/classrooms/${liveChoice.slot.room}/attendance/${liveSessionId}`] = liveAttendance
        roomsWithActiveSession.add(liveChoice.slot.room)
        liveCreated++
      }
    } else {
      console.warn(`⚠ ${prof.name}: no course slot matched assigned rooms (live session not created)`)
    }

    await db.ref('/').update(updates)

    totalSessions += pastSessions.length
    console.log(`✅ ${prof.name}: ${pastSessions.length} past sessions seeded${liveChoice ? ' + live session' : ''}`)
  }

  console.log('\nSeeding complete.')
  console.log(`Past sessions written: ${totalSessions}`)
  console.log(`Live sessions created: ${liveCreated}`)
  if (liveSkippedDueRoomCollision > 0) {
    console.log(`Live sessions skipped (room already has activeSession): ${liveSkippedDueRoomCollision}`)
  }
  console.log(`Professors skipped: ${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })

