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

export function useMoodleCourses() {
  const { profile: professor, user } = useAuth()
  const [courses, setCourses]           = useState([])
  const [allSessions, setAllSessions]   = useState([])
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
        setRoomSessions(prev => ({
          ...prev,
          [roomId]: snap.exists() ? snap.val() : null,
        }))
      })
    )

    return () => unsubs.forEach(u => u())
  }, [professor?.assignedRooms])

  if (USE_MOCK) return { courses: MOCK_COURSES, allSessions: [], loading: false, error: null }

  // ── Override status to 'live' if Firebase shows an active session in the room ─
  const enriched = courses.map(c => ({
    ...c,
    status: roomSessions[c.roomId] != null ? 'live' : c.status,
  }))

  return { courses: enriched, allSessions, loading, error }
}
