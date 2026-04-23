// src/hooks/useSessionHistory.js
import { useState, useEffect } from 'react'
import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { useListVals } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getProfessorSessions } from '../services/moodleApi'
import { MOCK_SESSIONS } from '../data/mockSessions'
import { USE_MOCK_SESSIONS as USE_MOCK } from '../config'

/**
 * Returns all past sessions for the logged-in professor.
 * Generated from Flask schedule data, enriched with real attendanceRate
 * from Firebase /sessions once that collection is seeded.
 *
 * @param {{ courseId?: string, roomId?: string, dateRange?: { from: string, to: string } }} filters
 */
export function useSessionHistory(filters = {}) {
  const { user, profile } = useAuth()
  const [generated, setGenerated]   = useState([])
  const [genLoading, setGenLoading] = useState(true)
  const [genError, setGenError]     = useState(null)

  // ── Generate past sessions from Flask schedule ────────────────
  useEffect(() => {
    if (USE_MOCK) { setGenLoading(false); return }
    if (!profile?.moodleUserId) { setGenLoading(false); return }

    const load = async () => {
      try {
        setGenLoading(true)
        const all = await getProfessorSessions(profile.moodleUserId, 'S26,F25')

        const past = all
          .filter(s => s.status === 'past')
          .sort((a, b) =>
            b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
          )
        setGenerated(past)
      } catch (err) {
        console.error('[useSessionHistory] Flask error:', err)
        setGenError(err)
      } finally {
        setGenLoading(false)
      }
    }

    load()
  }, [profile?.moodleUserId])

  // ── Also read Firebase /sessions (real attendanceRate after seeding) ──
  const byProfessorIdQuery = (!USE_MOCK && db && profile?.moodleUserId)
    ? query(ref(db, 'sessions'), orderByChild('professorId'), equalTo(Number(profile.moodleUserId)))
    : null

  const byProfessorUidQuery = (!USE_MOCK && db && user?.uid)
    ? query(ref(db, 'sessions'), orderByChild('professorUid'), equalTo(user.uid))
    : null

  const [fbById, fbByIdLoading, fbByIdError] = useListVals(byProfessorIdQuery, { keyField: 'id' })
  const [fbByUid, fbByUidLoading, fbByUidError] = useListVals(byProfessorUidQuery, { keyField: 'id' })

  if (USE_MOCK) return { sessions: MOCK_SESSIONS, loading: false, error: null }

  // Merge: Firebase data (with real attendance) enriches generated sessions.
  // attendanceRate: prefer Firebase value only if > 0 (guards against legacy seeds with 0)
  const fbCombined = [...(fbById ?? []), ...(fbByUid ?? [])]
  const fbMap = Object.fromEntries(fbCombined.map(s => [s.id, s]))

  const generatedIds = new Set(generated.map(s => s.id))

  const enrichedGenerated = generated
    .map(s => {
      const fb = fbMap[s.id]
      if (!fb) return s
      return {
        ...s,
        ...fb,
        attendanceRate: (fb.attendanceRate != null && fb.attendanceRate > 0)
          ? fb.attendanceRate
          : s.attendanceRate,
      }
    })
    .filter(s => s.attendanceRate != null)

  // Include Firebase-only past sessions (e.g. from assignLiveSession.mjs script)
  const fbOnlySessions = fbCombined.filter(s =>
    !generatedIds.has(s.id) &&
    s.status === 'past' &&
    s.attendanceRate != null
  )

  let sessions = [...enrichedGenerated, ...fbOnlySessions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))

  // Apply optional filters
  const { courseId, roomId, dateRange } = filters
  if (courseId)        sessions = sessions.filter(s => s.courseId === courseId)
  if (roomId)          sessions = sessions.filter(s => s.roomId  === roomId)
  if (dateRange?.from) sessions = sessions.filter(s => s.date >= dateRange.from)
  if (dateRange?.to)   sessions = sessions.filter(s => s.date <= dateRange.to)

  return {
    sessions,
    loading: genLoading || fbByIdLoading || fbByUidLoading,
    error:   genError   || fbByIdError || fbByUidError || null,
  }
}
