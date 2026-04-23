import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'
import { USE_MOCK_SESSIONS, BYPASS_SESSION_OWNERSHIP } from '../config'
import { isSessionStale } from './useSessionLifecycle'

const MOCK_COURSES = {
  A101: { courseId: 'CS102',   courseName: 'Object Oriented Programming', startTime: '2026-04-02T09:00:00', status: 'live'     },
  C303: { courseId: 'MATH243', courseName: 'Discrete Mathematics',         startTime: '2026-04-02T11:00:00', status: 'upcoming' },
  B204: { courseId: 'ISS196',  courseName: 'Freshman Project',             startTime: '2026-04-02T14:00:00', status: 'upcoming' },
}

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
    USE_MOCK_SESSIONS ? null : ref(db, `classrooms/${roomId}/activeSession`)
  )

  if (USE_MOCK_SESSIONS) {
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

  // Ownership: professorUid is the single source of truth (P6). The write path
  // (useSessionLifecycle.startSession) always sets this, and we cleaned up all
  // legacy entries that only had professorId. A session without professorUid
  // is treated as unowned (effectively invisible) rather than trusted.
  const sessionBelongsToProfessor =
    data?.professorUid && user?.uid && data.professorUid === user.uid

  // Stale detection (P4): if expectedEndTime + grace has passed, don't surface
  // the session — LiveSession will then render the Start CTA so the professor
  // can recover. We deliberately don't auto-delete from a read hook; the next
  // startSession overwrites it, or cleanup_stale_sessions.py prunes later.
  if (sessionBelongsToProfessor && !isSessionStale(data)) {
    return { session: data, loading, error }
  }

  // Demo mode: bypass ownership check so a professor can open any assigned room
  if (BYPASS_SESSION_OWNERSHIP && !loading && hasRoomAccess(profile, roomId)) {
    return {
      session: {
        sessionId:    `${roomId}-DEMO-${user?.uid ?? 'demo'}`,
        courseId:     profile?.department ?? roomId,
        courseName:   'Live Classroom Session',
        professorUid: user?.uid ?? '',
        roomId,
        startTime:    new Date().toISOString(),
        endTime:      null,
        type:         'Lecture',
        status:       'live',
      },
      loading: false,
      error:   null,
    }
  }

  return { session: null, loading, error }
}
