import { useCallback } from 'react'
import { ref, get, remove, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess } from '../utils/roomAccess'
import { USE_MOCK_SESSIONS } from '../config'

// 30-minute grace after scheduledEnd before we treat a session as abandoned.
// Gives the professor a buffer for running-long classes without prematurely
// yanking state from under them.
const STALE_GRACE_MS = 30 * 60 * 1000

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Canonical sessionId format. Mirrors generate_sessions() in Flask app.py so
// a server-generated history session and a live one created from the UI share
// the same id — this is what enables SessionDetail/history to round-trip.
export function buildSessionId(courseShortname, date, startTime) {
  return `${courseShortname}-${date}-${startTime}`
}

// "YYYY-MM-DDTHH:MM:00" in local time, built from a date string + HH:MM.
// We store these as ISO-ish strings for expectedEndTime so the stale check is
// just Date.parse + compare; no timezone gymnastics at read time.
function composeLocalIso(dateStr, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const d = new Date(`${dateStr}T00:00:00`)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.toISOString()
}

export function isSessionStale(session) {
  if (!session?.expectedEndTime) return false
  const end = Date.parse(session.expectedEndTime)
  if (Number.isNaN(end)) return false
  return Date.now() > end + STALE_GRACE_MS
}

/**
 * Session lifecycle: start, end.
 *
 * Attendance seeding is intentionally NOT handled here — that's the CV
 * pipeline's job. This hook only manages the activeSession node.
 */
export function useSessionLifecycle() {
  const { user, profile } = useAuth()

  const startSession = useCallback(async (roomId, slot) => {
    if (USE_MOCK_SESSIONS) return { sessionId: `mock-${roomId}`, mock: true }
    if (!user?.uid) throw new Error('Not authenticated')
    if (!hasRoomAccess(profile, roomId)) throw new Error(`Not authorized for room ${roomId}`)
    if (!slot) throw new Error('No slot provided')

    const courseShortname = slot.shortname ?? slot.courseId
    const courseName      = slot.fullname  ?? slot.courseName ?? courseShortname
    const moodleCourseId  = slot.moodleCourseId ?? (typeof slot.courseId === 'string' && /^\d+$/.test(slot.courseId) ? Number(slot.courseId) : null)
    const scheduledStart  = slot.startTime
    const scheduledEnd    = slot.endTime
    const date            = slot.date ?? toDateStr(new Date())

    const sessionId = buildSessionId(courseShortname, date, scheduledStart)

    // If an activeSession already exists in this room, decide whether to reuse,
    // overwrite (stale), or refuse (owned by someone else). This prevents two
    // professors racing into the same room from silently clobbering each other.
    const existingSnap = await get(ref(db, `classrooms/${roomId}/activeSession`))
    if (existingSnap.exists()) {
      const existing = existingSnap.val()
      const mine = existing.professorUid === user.uid
      if (mine && existing.sessionId === sessionId) {
        return { sessionId, reused: true }
      }
      if (!mine && !isSessionStale(existing)) {
        throw new Error('Another active session is running in this room')
      }
      // else: it's either ours-but-wrong-sessionId or someone else's stale session.
      // Overwriting is safe for the first; for the second, STALE_GRACE_MS means
      // we've already waited 30 minutes past the scheduled end.
    }

    const nowIso = new Date().toISOString()
    const expectedEndTime = composeLocalIso(date, scheduledEnd)

    const payload = {
      sessionId,
      courseId:        courseShortname,
      courseName,
      moodleCourseId,
      roomId,
      professorUid:    user.uid,
      startTime:       nowIso,
      expectedEndTime,
      scheduledStart,
      scheduledEnd,
      date,
      type:            slot.type ?? 'Lecture',
      status:          'live',
    }

    await update(ref(db, `classrooms/${roomId}`), { activeSession: payload })
    return { sessionId, reused: false }
  }, [user?.uid, profile])

  const endSession = useCallback(async (roomId) => {
    if (USE_MOCK_SESSIONS) return
    await remove(ref(db, `classrooms/${roomId}/activeSession`))
  }, [])

  return { startSession, endSession }
}
