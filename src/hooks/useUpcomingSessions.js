// src/hooks/useUpcomingSessions.js
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfessorCourses } from '../services/moodleApi'
import { generateSessions } from '../utils/generateSessions'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MOCK_UPCOMING = [
  {
    id: 'MOCK-upcoming-1',
    courseId: 'CS102', courseName: 'Object Oriented Programming',
    roomId: 'A101', date: toDateStr(new Date()),
    startTime: '14:00', endTime: '15:30', type: 'Lab', status: 'upcoming',
  },
]

/**
 * Returns upcoming (and live) sessions for the next 14 days,
 * sorted by date/time ascending.
 */
export function useUpcomingSessions() {
  const { user, profile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (USE_MOCK) { setLoading(false); return }
    if (!profile?.moodleUserId) { setLoading(false); return }

    const load = async () => {
      try {
        setLoading(true)
        const courses = await getProfessorCourses(profile.moodleUserId)
        const all = generateSessions(courses, profile.moodleUserId, 'S26')

        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() + 14)
        const cutoffStr = toDateStr(cutoff)

        const upcoming = all
          .filter(s =>
            (s.status === 'upcoming' || s.status === 'live') &&
            s.date <= cutoffStr
          )
          .sort((a, b) =>
            a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
          )

        setSessions(upcoming)
      } catch (err) {
        console.error('[useUpcomingSessions] Flask error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profile?.moodleUserId])

  if (USE_MOCK) return { sessions: MOCK_UPCOMING, loading: false, error: null }

  return { sessions, loading, error }
}
