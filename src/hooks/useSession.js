import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'

const MOCK_COURSES = {
  A101: { courseId: 'CS102',   courseName: 'Object Oriented Programming', startTime: '2026-04-02T09:00:00', status: 'live'     },
  C303: { courseId: 'MATH243', courseName: 'Discrete Mathematics',         startTime: '2026-04-02T11:00:00', status: 'upcoming' },
  B204: { courseId: 'ISS196',  courseName: 'Freshman Project',             startTime: '2026-04-02T14:00:00', status: 'upcoming' },
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSession(roomId) {
  const [data, loading, error] = useObjectVal(
    USE_MOCK ? null : ref(db, `classrooms/${roomId}/activeSession`)
  )
  if (USE_MOCK) {
    const course = MOCK_COURSES[roomId] ?? { courseId: roomId, courseName: roomId, startTime: new Date().toISOString(), status: 'upcoming' }
    return {
      session: {
        sessionId:    `sess_${roomId}_mock`,
        professorUid: 'mock_uid',
        endTime:      null,
        ...course,
      },
      loading: false,
      error: null,
    }
  }
  return { session: data, loading, error }
}
