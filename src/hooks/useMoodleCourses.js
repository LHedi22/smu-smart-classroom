import { useState, useEffect } from 'react'
import { ref, get, onValue } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getProfessorCourses, getProfessorSessions } from '../services/moodleApi'
import { USE_MOCK_SESSIONS as USE_MOCK } from '../config'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const MOCK_COURSES = [
  { id: 'CS102-09:00',   courseId: 'CS102',   shortname: 'CS102',   fullname: 'Object Oriented Programming', roomId: 'A101', startTime: '09:00', endTime: '10:30', type: 'Lecture',  status: 'live',     enrolled: 32 },
  { id: 'MATH243-11:00', courseId: 'MATH243', shortname: 'MATH243', fullname: 'Discrete Mathematics',         roomId: 'C303', startTime: '11:00', endTime: '12:30', type: 'Lecture',  status: 'upcoming', enrolled: 30 },
  { id: 'ISS196-14:00',  courseId: 'ISS196',  shortname: 'ISS196',  fullname: 'Freshman Project',             roomId: 'B204', startTime: '14:00', endTime: '15:30', type: 'Tutorial', status: 'upcoming', enrolled: 28 },
]

// Compute status for a slot that has no specific date (today only)
function computeStatus(starttime, endtime) {
  const now = new Date()
  const [sh, sm] = starttime.split(':').map(Number)
  const [eh, em] = endtime.split(':').map(Number)
  const start = new Date(now); start.setHours(sh, sm, 0, 0)
  const end   = new Date(now); end.setHours(eh, em, 0, 0)
  if (now >= start && now <= end) return 'live'
  if (now < start)                return 'upcoming'
  return 'past'
}

function toHHMM(value) {
  if (!value) return ''
  if (typeof value === 'string' && value.includes('T')) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
  if (typeof value === 'string' && value.includes(':')) {
    return value.slice(0, 5)
  }
  return ''
}

function buildSlotsFromAssignedCourses(courses = [], todayName) {
  return courses.flatMap(course =>
    (course.schedule ?? [])
      .filter(slot => slot.day === todayName)
      .map(slot => ({
        id: `${course.code ?? course.id}-${slot.starttime}`,
        courseId: String(course.code ?? course.id ?? ''),
        shortname: course.code ?? course.id ?? '',
        fullname: course.name ?? course.fullname ?? course.code ?? course.id ?? '',
        roomId: slot.room ?? course.room ?? '',
        startTime: slot.starttime,
        endTime: slot.endtime,
        type: slot.type ?? 'Lecture',
        status: computeStatus(slot.starttime, slot.endtime),
        enrolled: course.enrolled ?? 0,
      }))
  )
}

export function useMoodleCourses() {
  const { profile: professor, user } = useAuth()
  const [courses, setCourses]           = useState([])
  const [allSessions, setAllSessions]   = useState([])
  const [totalEnrolled, setTotalEnrolled] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [roomSessions, setRoomSessions] = useState({})  // roomId → activeSession | null

  const todayName = DAYS[new Date().getDay()]

  // ── 1. Fetch schedule from Flask ──────────────────────────────
  useEffect(() => {
    if (USE_MOCK) { setLoading(false); return }
    if (!professor?.moodleUserId) return

    const load = async () => {
      try {
        setLoading(true)
        const [flaskCourses, rtdbCoursesSnap] = await Promise.all([
          getProfessorCourses(professor.moodleUserId),
          get(ref(db, 'courses')),
        ])

        const rtdbCourses = rtdbCoursesSnap.val()
          ? Object.entries(rtdbCoursesSnap.val())
              .map(([id, value]) => ({ id, ...value }))
              .filter(course =>
                course?.professorUid === user?.uid ||
                String(course?.professorId ?? '') === String(professor.moodleUserId)
              )
          : []

        const coursesById = new Map()

        for (const course of flaskCourses ?? []) {
          coursesById.set(String(course.id ?? course.code ?? course.courseId), course)
        }

        for (const course of rtdbCourses) {
          const key = String(course.code ?? course.id ?? course.courseId)
          const existing = coursesById.get(key)
          coursesById.set(key, existing ? { ...existing, ...course } : course)
        }

        const mergedCourses = [...coursesById.values()]

        // Today's slots for the home page schedule
        const todaySlots = mergedCourses
          .flatMap(course => {
            const scheduleSlots = buildSlotsFromAssignedCourses([course], todayName)
            if (scheduleSlots.length > 0) return scheduleSlots

            if (course.room && professor?.assignedRooms?.[course.room]) {
              return [{
                id: `${course.code ?? course.id ?? course.courseId}-assigned`,
                courseId: String(course.code ?? course.id ?? course.courseId ?? ''),
                shortname: course.code ?? course.shortname ?? course.id ?? '',
                fullname: course.name ?? course.fullname ?? course.code ?? course.shortname ?? '',
                roomId: course.room,
                startTime: course.startTime ?? '00:00',
                endTime: course.endTime ?? '00:00',
                type: course.type ?? 'Lecture',
                status: 'upcoming',
                enrolled: course.enrolled ?? 0,
              }]
            }

            return []
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        setCourses(todaySlots)
        setTotalEnrolled(mergedCourses.reduce((sum, c) => sum + (c.enrolled ?? 0), 0))

        // Full semester sessions (S26) — generated server-side
        const sessions = await getProfessorSessions(professor.moodleUserId, 'S26')
        setAllSessions(sessions)
      } catch (err) {
        console.error('[useMoodleCourses] Flask error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [professor?.moodleUserId, professor?.assignedRooms, todayName, user?.uid])

  // ── 2. Watch Firebase /classrooms for live session state ──────
  useEffect(() => {
    if (USE_MOCK || !professor?.assignedRooms || !db) return

    const unsubs = Object.keys(professor.assignedRooms).map(roomId =>
      onValue(ref(db, `/classrooms/${roomId}/activeSession`), snap => {
        const value = snap.exists() ? snap.val() : null
        // Ownership is professorUid only — we control the write path now and
        // every new activeSession carries it. No legacy professorId fallback.
        const mine = value?.professorUid && user?.uid && value.professorUid === user.uid
        setRoomSessions(prev => ({
          ...prev,
          [roomId]: mine ? value : null,
        }))
      })
    )

    return () => unsubs.forEach(u => u())
  }, [professor?.assignedRooms, user?.uid])

  const mockTotalEnrolled = MOCK_COURSES.reduce((s, c) => s + (c.enrolled ?? 0), 0)
  if (USE_MOCK) return { courses: MOCK_COURSES, allSessions: [], totalEnrolled: mockTotalEnrolled, loading: false, error: null }

  // ── Merge schedule slots with owned live sessions from Firebase ─
  // If a room has an owned active session but no matching schedule slot for today,
  // inject it so the dashboard cards/stats are consistent.
  //
  // hasActiveSession disambiguates "clock says live" (scheduled window) from
  // "Firebase says live" (the professor actually hit Start). The home-page
  // SessionCard uses this to show "Join" vs "Start session".
  const withFlag = courses.map(c => ({ ...c, hasActiveSession: false }))
  const byRoom = new Map(withFlag.map(c => [c.roomId, c]))
  const merged = [...withFlag]

  for (const [roomId, live] of Object.entries(roomSessions)) {
    if (!live) continue
    const startTime = toHHMM(live.scheduledStart ?? live.startTime) || '00:00'
    const endTime = toHHMM(live.scheduledEnd ?? live.endTime) || ''
    const existing = byRoom.get(roomId)

    if (existing) {
      Object.assign(existing, {
        status: 'live',
        hasActiveSession: true,
        courseId: live.courseId ?? existing.courseId,
        shortname: live.courseId ?? existing.shortname,
        fullname: live.courseName ?? existing.fullname,
      })
      continue
    }

    merged.push({
      id: live.sessionId ?? `live-${roomId}`,
      courseId: live.courseId ?? roomId,
      shortname: live.courseId ?? roomId,
      fullname: live.courseName ?? 'Live session',
      roomId,
      startTime,
      endTime: endTime || startTime,
      type: live.type ?? 'Lecture',
      status: 'live',
      hasActiveSession: true,
      enrolled: 0,
    })
  }

  const enriched = merged.sort((a, b) => a.startTime.localeCompare(b.startTime))

  return { courses: enriched, allSessions, totalEnrolled, loading, error }
}
