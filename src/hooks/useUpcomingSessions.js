// src/hooks/useUpcomingSessions.js
import { useState, useEffect } from 'react'
import { get, ref } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { getProfessorSessions } from '../services/moodleApi'
import { db } from '../firebase'
import { USE_MOCK_SESSIONS as USE_MOCK } from '../config'

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

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function nextDateForDay(dayName, fromDate = new Date()) {
  const targetIndex = DAYS.indexOf(dayName)
  if (targetIndex < 0) return null

  const next = new Date(fromDate)
  const delta = (targetIndex - next.getDay() + 7) % 7
  next.setDate(next.getDate() + delta)
  return next
}

function computeStatusForSlot(dateObj, startTime, endTime) {
  const now = new Date()
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const start = new Date(dateObj)
  start.setHours(startHour, startMinute, 0, 0)

  const end = new Date(dateObj)
  end.setHours(endHour, endMinute, 0, 0)

  if (now >= start && now <= end) return 'live'
  if (now < start) return 'upcoming'
  return 'past'
}

function buildFallbackSessions(courses = []) {
  const now = new Date()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + 14)

  const sessions = []

  for (const course of courses) {
    for (const slot of course.schedule ?? []) {
      const sessionDate = nextDateForDay(slot.day, now)
      if (!sessionDate || sessionDate > cutoff) continue

      sessions.push({
        id: `${course.code ?? course.id}-${toDateStr(sessionDate)}-${slot.starttime}`,
        courseId: course.code ?? course.courseId ?? course.id,
        courseName: course.name ?? course.fullname ?? course.code ?? course.id,
        roomId: slot.room ?? course.room ?? '',
        date: toDateStr(sessionDate),
        startTime: slot.starttime,
        endTime: slot.endtime,
        type: slot.type ?? 'Lecture',
        status: computeStatusForSlot(sessionDate, slot.starttime, slot.endtime),
      })
    }
  }

  return sessions
}

/**
 * Returns upcoming (and live) sessions for the next 14 days,
 * sorted by date/time ascending.
 */
export function useUpcomingSessions() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (USE_MOCK) { setLoading(false); return }
    if (!profile?.moodleUserId) { setLoading(false); return }

    const load = async () => {
      try {
        setLoading(true)
        const [flaskSessions, coursesSnap] = await Promise.all([
          getProfessorSessions(profile.moodleUserId, 'S26'),
          get(ref(db, 'courses')),
        ])

        const fallbackCourses = coursesSnap.val()
          ? Object.entries(coursesSnap.val())
              .map(([id, value]) => ({ id, ...value }))
              .filter(course =>
                course?.professorUid === profile?.uid ||
                String(course?.professorId ?? '') === String(profile.moodleUserId)
              )
          : []

        const fallbackSessions = buildFallbackSessions(fallbackCourses)
        const byKey = new Map()

        for (const session of flaskSessions ?? []) {
          const key = `${session.courseId ?? session.courseName}-${session.date}-${session.startTime}-${session.roomId}`
          byKey.set(key, session)
        }

        for (const session of fallbackSessions) {
          const key = `${session.courseId ?? session.courseName}-${session.date}-${session.startTime}-${session.roomId}`
          byKey.set(key, session)
        }

        const all = [...byKey.values()]

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
  }, [profile?.moodleUserId, profile?.uid])

  if (USE_MOCK) return { sessions: MOCK_UPCOMING, loading: false, error: null }

  return { sessions, loading, error }
}
