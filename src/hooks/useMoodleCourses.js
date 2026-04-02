import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useProfessor } from '../context/AuthContext'

const MOCK_COURSES = [
  { id: 'CS102',   shortname: 'CS102',   fullname: 'Object Oriented Programming', roomId: 'A101', startTime: '09:00', endTime: '10:30', status: 'live',     enrolled: 32 },
  { id: 'MATH243', shortname: 'MATH243', fullname: 'Discrete Mathematics',         roomId: 'C303', startTime: '11:00', endTime: '12:30', status: 'upcoming', enrolled: 30 },
  { id: 'ISS196',  shortname: 'ISS196',  fullname: 'Freshman Project',             roomId: 'B204', startTime: '14:00', endTime: '15:30', status: 'upcoming', enrolled: 28 },
]

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function addMinutes(isoString, mins) {
  if (!isoString) return ''
  const d = new Date(isoString)
  d.setMinutes(d.getMinutes() + mins)
  return d.toTimeString().slice(0, 5)
}

export function useMoodleCourses() {
  const { professor } = useProfessor()

  const [allSessions, sessionsLoading, sessionsError] = useObjectVal(
    (!USE_MOCK && db) ? ref(db, 'sessions') : null
  )
  // courses read is optional — only used for enrolled count
  const [coursesData] = useObjectVal(
    (!USE_MOCK && db) ? ref(db, 'courses') : null
  )

  if (USE_MOCK) return { courses: MOCK_COURSES, loading: false, error: null }

  if (sessionsError) {
    console.error('[useMoodleCourses] Firebase read error:', sessionsError)
    return { courses: [], loading: false, error: sessionsError }
  }

  if (sessionsLoading || !professor?.uid) return { courses: [], loading: true, error: null }

  if (!allSessions) return { courses: [], loading: false, error: null }

  const courses = Object.entries(allSessions)
    .map(([id, s]) => ({ id, ...s }))
    .filter(s =>
      s.professorUid === professor.uid &&
      (s.status === 'live' || s.status === 'upcoming')
    )
    .map(s => ({
      id:        s.courseId,
      shortname: s.courseId,
      fullname:  s.courseName,
      roomId:    s.roomId,
      startTime: s.startTime?.slice(11, 16) ?? '',
      endTime:   s.endTime?.slice(11, 16) || addMinutes(s.startTime, 90),
      status:    s.status,
      enrolled:  coursesData?.[s.courseId]?.enrolled ?? 0,
      sessionId: s.id,
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return { courses, loading: false, error: null }
}
