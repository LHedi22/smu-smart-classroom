import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Radio, Play, Calendar } from 'lucide-react'
import SessionHeader         from '../components/live/SessionHeader'
import EnvironmentPanel      from '../components/live/EnvironmentPanel'
import AttendancePanel       from '../components/live/AttendancePanel'
import ControlsPanel         from '../components/live/ControlsPanel'
import AlertsFeed            from '../components/live/AlertsFeed'
import ErrorBoundary         from '../components/shared/ErrorBoundary'
import { useSensors }        from '../hooks/useSensors'
import { useDevices }        from '../hooks/useDevices'
import { useAttendance }     from '../hooks/useAttendance'
import { useAlerts }         from '../hooks/useAlerts'
import { useSession }        from '../hooks/useSession'
import { useSessionCheckpoint } from '../hooks/useSessionCheckpoint'
import { useMoodleCourses }     from '../hooks/useMoodleCourses'
import { useSessionLifecycle }  from '../hooks/useSessionLifecycle'

// Same 15-min early-start window as the home-page SessionCard. Kept in sync
// manually — a shared constant would be better but the two callers are small
// and the duplication is one line.
const EARLY_START_WINDOW_MS = 15 * 60 * 1000

function findStartableSlot(courses, roomId) {
  return courses.find(c => {
    if (c.roomId !== roomId) return false
    if (c.hasActiveSession) return false
    if (c.status === 'live') return true
    if (c.status !== 'upcoming') return false
    const [h, m] = c.startTime.split(':').map(Number)
    const start = new Date()
    start.setHours(h, m, 0, 0)
    return start.getTime() - Date.now() <= EARLY_START_WINDOW_MS
  })
}

function StartSessionCTA({ roomId, slot }) {
  const { startSession } = useSessionLifecycle()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    setError(null)
    setStarting(true)
    try {
      await startSession(roomId, slot)
    } catch (err) {
      setError(err.message ?? 'Could not start session')
      setStarting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Calendar size={32} className="text-brand" />
      <div>
        <p className="text-gray-800 font-medium">{slot.fullname}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          {slot.shortname} · Room {roomId} · {slot.startTime}–{slot.endTime}
        </p>
      </div>
      <button
        onClick={handleStart}
        disabled={starting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-dark
                   transition-colors text-sm font-medium disabled:opacity-60"
      >
        <Play size={15} />
        {starting ? 'Starting…' : 'Start session'}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

function NoSession({ roomId }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Radio size={32} className="text-gray-300" />
      <p className="text-gray-600 font-medium">No active session in room {roomId}</p>
      <p className="text-sm text-gray-400">No class is scheduled here right now.</p>
    </div>
  )
}

export default function LiveSession() {
  const { roomId } = useParams()

  const { session }                                    = useSession(roomId)
  const { courses }                                    = useMoodleCourses()
  const { sensors, loading: sLoading }                 = useSensors(roomId)
  const { devices, loading: dLoading, toggleDevice }   = useDevices(roomId)
  const { enrolled, students, updateStudent }          = useAttendance(roomId, session?.sessionId)
  const { alerts }                                     = useAlerts(roomId)

  // Auto-saves attendance every 60s — silent background operation
  useSessionCheckpoint(roomId, session?.sessionId, students, enrolled)

  if (!session) {
    const slot = findStartableSlot(courses, roomId)
    if (slot) return <StartSessionCTA roomId={roomId} slot={slot} />
    return <NoSession roomId={roomId} />
  }

  return (
    <div className="flex flex-col gap-0">
      <SessionHeader session={session} roomId={roomId} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Column 1 — Environment */}
        <ErrorBoundary label="Environment panel" compact>
          <EnvironmentPanel sensors={sensors} loading={sLoading} />
        </ErrorBoundary>

        {/* Column 2 — Attendance */}
        <ErrorBoundary label="Attendance panel">
          <AttendancePanel
            enrolled={enrolled}
            students={students}
            updateStudent={updateStudent}
            sessionStatus={session?.status}
          />
        </ErrorBoundary>

        {/* Column 3 — Controls + Alerts */}
        <div className="flex flex-col gap-5">
          <ErrorBoundary label="Device controls" compact>
            <ControlsPanel devices={devices} loading={dLoading} toggleDevice={toggleDevice} />
          </ErrorBoundary>
          <ErrorBoundary label="Alerts feed" compact>
            <AlertsFeed alerts={alerts} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
