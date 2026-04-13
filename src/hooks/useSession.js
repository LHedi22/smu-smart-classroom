import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'

const MOCK_COURSES = {
  A101: { courseId: 'CS102',   courseName: 'Object Oriented Programming', startTime: '2026-04-02T09:00:00', status: 'live'     },
  C303: { courseId: 'MATH243', courseName: 'Discrete Mathematics',         startTime: '2026-04-02T11:00:00', status: 'upcoming' },
  B204: { courseId: 'ISS196',  courseName: 'Freshman Project',             startTime: '2026-04-02T14:00:00', status: 'upcoming' },
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSession(roomId) {
  const { profile, user } = useAuth()
  
  // Validate room ID format
  const { valid: roomIdValid, error: roomIdError } = validateRoomId(roomId)
  if (!roomIdValid) {
    return {
      session: null,
      loading: false,
      error: new Error(`Invalid room ID: ${roomIdError}`)
    }
  }
  
  // Check authorization: does professor have access to this room?
  if (!hasRoomAccess(profile, roomId)) {
    logUnauthorizedAccess(user?.uid, roomId, 'fetch_active_session', new Date().toISOString())
    return {
      session: null,
      loading: false,
      error: new Error(`Not authorized to access room ${roomId}`)
    }
  }
  
  // Authorization passed: fetch the data
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
  
  const sessionBelongsToProfessor =
    data &&
    (
      (data.professorUid && user?.uid && data.professorUid === user.uid) ||
      (
        data.professorId != null &&
        profile?.moodleUserId != null &&
        Number(data.professorId) === Number(profile.moodleUserId)
      )
    )

  return { session: sessionBelongsToProfessor ? data : null, loading, error }
}
