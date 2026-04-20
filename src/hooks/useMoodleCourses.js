import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getProfessorCourses } from '../services/moodleApi'
import { generateSessions } from '../utils/generateSessions'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const MOCK_COURSES = [
  { id: 'CS102-09:00',   courseId: 'CS102',   shortname: 'CS102',   fullname: 'Object Oriented Programming', roomId: 'A101', startTime: '09:00', endTime: '10:30', type: 'Lecture',  status: 'live',     enrolled: 32 },
  { id: 'MATH243-11:00', courseId: 'MATH243', shortname: 'MATH243', fullname: 'Discrete Mathematics',         roomId: 'C303', startTime: '11:00', endTime: '12:30', type: 'Lecture',  status: 'upcoming', enrolled: 30 },
  { id: 'ISS196-14:00',  courseId: 'ISS196',  shortname: 'ISS196',  fullname: 'Freshman Project',             roomId: 'B204', startTime: '14:00', endTime: '15:30', type: 'Tutorial', status: 'upcoming', enrolled: 28 },
]

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

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
        const data = await getProfessorCourses(professor.moodleUserId)

        // Today's slots for the home page schedule
        const todaySlots = data
          .flatMap(course =>
            (course.schedule ?? [])
              .filter(slot => slot.day === todayName)
              .map(slot => ({
                id:        `${course.id}-${slot.starttime}`,
                courseId:  String(course.id),
                shortname: course.shortname,
                fullname:  course.fullname,
                roomId:    slot.room,
                startTime: slot.starttime,
                endTime:   slot.endtime,
                type:      slot.type,
                status:    computeStatus(slot.starttime, slot.endtime),
                enrolled:  course.enrolled ?? 0,  // from Flask StudentEnrollment count
              }))
          )
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        setCourses(todaySlots)
        setTotalEnrolled(data.reduce((sum, c) => sum + (c.enrolled ?? 0), 0))

        // Full semester sessions (S26) for history / upcoming consumers
        if (professor?.moodleUserId) {
          setAllSessions(generateSessions(data, professor.moodleUserId, 'S26'))
        }
      } catch (err) {
        console.error('[useMoodleCourses] Flask error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [professor?.moodleUserId, todayName, user?.uid])

  // ── 2. Watch Firebase /classrooms for live session state ──────
  useEffect(() => {
    if (USE_MOCK || !professor?.assignedRooms || !db) return

    const unsubs = Object.keys(professor.assignedRooms).map(roomId =>
      onValue(ref(db, `/classrooms/${roomId}/activeSession`), snap => {
        const value = snap.exists() ? snap.val() : null
        const mine =
          value &&
          (
            (value.professorUid && user?.uid && value.professorUid === user.uid) ||
            (
              value.professorId != null &&
              professor?.moodleUserId != null &&
              Number(value.professorId) === Number(professor.moodleUserId)
            )
          )
        setRoomSessions(prev => ({
          ...prev,
          [roomId]: mine ? value : null,
        }))
      })
    )

    return () => unsubs.forEach(u => u())
  }, [professor?.assignedRooms, professor?.moodleUserId, user?.uid])

  const mockTotalEnrolled = MOCK_COURSES.reduce((s, c) => s + (c.enrolled ?? 0), 0)
  if (USE_MOCK) return { courses: MOCK_COURSES, allSessions: [], totalEnrolled: mockTotalEnrolled, loading: false, error: null }

  // ── Merge schedule slots with owned live sessions from Firebase ─
  // If a room has an owned active session but no matching schedule slot for today,
  // inject it so the dashboard cards/stats are consistent.
  const byRoom = new Map(courses.map(c => [c.roomId, c]))
  const merged = [...courses]

  for (const [roomId, live] of Object.entries(roomSessions)) {
    if (!live) continue
    const startTime = toHHMM(live.startTime) || '00:00'
    const endTime = toHHMM(live.endTime) || ''
    const existing = byRoom.get(roomId)

    if (existing) {
      Object.assign(existing, {
        status: 'live',
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
      enrolled: 0,
    })
  }

  const enriched = merged.sort((a, b) => a.startTime.localeCompare(b.startTime))

  return { courses: enriched, allSessions, totalEnrolled, loading, error }
}
