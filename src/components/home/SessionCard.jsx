import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ArrowRight, Radio, Play } from 'lucide-react'
import Badge from '../shared/Badge'
import { useSessionLifecycle } from '../../hooks/useSessionLifecycle'

// How early a professor can start a scheduled session before its nominal time.
// 15 minutes handles the common case where they want to prep before students arrive.
const EARLY_START_WINDOW_MS = 15 * 60 * 1000

function canStartEarly(course) {
  if (course.status !== 'upcoming') return false
  const [h, m] = course.startTime.split(':').map(Number)
  const start = new Date()
  start.setHours(h, m, 0, 0)
  return start.getTime() - Date.now() <= EARLY_START_WINDOW_MS
}

export default function SessionCard({ course }) {
  const navigate = useNavigate()
  const { startSession } = useSessionLifecycle()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  const isDone = course.status === 'completed' || course.status === 'past'
  const badgeVariant = { live: 'live', upcoming: 'default', completed: 'good', past: 'good' }[course.status] ?? 'default'
  const badgeLabel   = { live: 'Live', upcoming: 'Upcoming', completed: 'Done', past: 'Done' }[course.status] ?? course.status

  // Three navigation modes for a non-done card:
  // - join: activeSession exists in Firebase → go straight to LiveSession
  // - start: clock says live but nobody's hit Start → write activeSession, then go
  // - open: scheduled in the future → just navigate (LiveSession will show a CTA)
  const showJoin  = course.hasActiveSession
  const showStart = !course.hasActiveSession && (course.status === 'live' || canStartEarly(course))

  const handleStart = async (e) => {
    e.stopPropagation()
    setError(null)
    setStarting(true)
    try {
      await startSession(course.roomId, course)
      navigate(`/session/${course.roomId}`)
    } catch (err) {
      setError(err.message ?? 'Could not start session')
      setStarting(false)
    }
  }

  return (
    <div className="card flex items-start gap-4 hover:border-brand/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={badgeVariant}>
            {course.status === 'live' && <Radio size={10} className="animate-pulse" />}
            {badgeLabel}
          </Badge>
          <span className="text-xs text-gray-400 font-mono">{course.shortname}</span>
        </div>
        <p className="text-gray-800 font-medium truncate">{course.fullname}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1"><MapPin size={11} />{course.roomId}</span>
          <span className="flex items-center gap-1"><Users size={11} />{course.enrolled} students</span>
          <span className="font-mono">{course.startTime} – {course.endTime}</span>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {!isDone && showJoin && (
        <button
          onClick={() => navigate(`/session/${course.roomId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 bg-brand text-white hover:bg-brand-dark"
        >
          Join
          <ArrowRight size={14} />
        </button>
      )}

      {!isDone && showStart && (
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Play size={14} />
          {starting ? 'Starting…' : 'Start'}
        </button>
      )}

      {!isDone && !showJoin && !showStart && (
        <button
          onClick={() => navigate(`/session/${course.roomId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 bg-surface-raised text-gray-600 hover:bg-surface-border"
        >
          Open
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
