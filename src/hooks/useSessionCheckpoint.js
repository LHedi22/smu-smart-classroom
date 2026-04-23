import { useEffect, useRef, useCallback } from 'react'
import { ref, set, remove, get } from 'firebase/database'
import { db } from '../firebase'
import { USE_MOCK_SESSIONS } from '../config'

const CHECKPOINT_INTERVAL_MS = 60_000
const CHECKPOINT_PATH = (roomId) => `classrooms/${roomId}/sessionCheckpoint`

/**
 * Auto-saves attendance state every 60 seconds as a recovery checkpoint.
 * The checkpoint persists through browser crashes and tab closes.
 * Call clearCheckpoint() explicitly when the session ends normally.
 *
 * @param {string} roomId
 * @param {string|null} sessionId
 * @param {Array} students  - from useAttendance
 * @param {number} enrolled - from useAttendance
 * @returns {{ clearCheckpoint: () => Promise<void> }}
 */
export function useSessionCheckpoint(roomId, sessionId, students, enrolled) {
  const intervalRef = useRef(null)

  const writeCheckpoint = useCallback(async () => {
    if (!roomId || !sessionId || USE_MOCK_SESSIONS) return
    if (!students || students.length === 0) return

    const studentsMap = Object.fromEntries(
      students.map(({ id, ...rest }) => [id, rest])
    )

    await set(ref(db, CHECKPOINT_PATH(roomId)), {
      sessionId,
      enrolled,
      students: studentsMap,
      lastSaved: new Date().toISOString(),
    })
  }, [roomId, sessionId, students, enrolled])

  useEffect(() => {
    if (!sessionId || USE_MOCK_SESSIONS) return

    // Write immediately on mount, then every 60 seconds
    writeCheckpoint()
    intervalRef.current = setInterval(writeCheckpoint, CHECKPOINT_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
  }, [sessionId, writeCheckpoint])

  const clearCheckpoint = useCallback(async () => {
    if (!roomId || USE_MOCK_SESSIONS) return
    await remove(ref(db, CHECKPOINT_PATH(roomId)))
  }, [roomId])

  return { clearCheckpoint }
}

/**
 * Reads the checkpoint for a room on page load.
 * Returns null if no checkpoint exists or it belongs to a different session.
 *
 * @param {string} roomId
 * @param {string|null} sessionId
 * @returns {Promise<{ enrolled: number, students: object, lastSaved: string } | null>}
 */
export async function readCheckpoint(roomId, sessionId) {
  if (!roomId || USE_MOCK_SESSIONS) return null
  try {
    const snap = await get(ref(db, CHECKPOINT_PATH(roomId)))
    if (!snap.exists()) return null
    const data = snap.val()
    if (data.sessionId !== sessionId) return null
    return data
  } catch {
    return null
  }
}
