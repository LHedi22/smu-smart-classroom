import { useParams } from 'react-router-dom'
import SessionHeader      from '../components/live/SessionHeader'
import EnvironmentPanel   from '../components/live/EnvironmentPanel'
import AttendancePanel    from '../components/live/AttendancePanel'
import ControlsPanel      from '../components/live/ControlsPanel'
import AlertsFeed         from '../components/live/AlertsFeed'
import ErrorBoundary      from '../components/shared/ErrorBoundary'
import { useSensors }     from '../hooks/useSensors'
import { useDevices }     from '../hooks/useDevices'
import { useAttendance }  from '../hooks/useAttendance'
import { useAlerts }      from '../hooks/useAlerts'
import { useSession }     from '../hooks/useSession'

export default function LiveSession() {
  const { roomId } = useParams()

  const { session }                         = useSession(roomId)
  const { sensors, loading: sLoading }      = useSensors(roomId)
  const { devices, loading: dLoading, toggleDevice } = useDevices(roomId)
  const { enrolled, students, updateStudent } = useAttendance(roomId, session?.sessionId)
  const { alerts }                          = useAlerts(roomId)

  return (
    <div className="flex flex-col gap-0">
      <ErrorBoundary>
        <SessionHeader session={session} roomId={roomId} />
      </ErrorBoundary>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Column 1 — Environment */}
        <ErrorBoundary>
          <EnvironmentPanel sensors={sensors} loading={sLoading} />
        </ErrorBoundary>

        {/* Column 2 — Attendance */}
        <ErrorBoundary>
          <AttendancePanel
            enrolled={enrolled}
            students={students}
            updateStudent={updateStudent}
            sessionStatus={session?.status}
          />
        </ErrorBoundary>

        {/* Column 3 — Controls + Alerts */}
        <div className="flex flex-col gap-5">
          <ErrorBoundary>
            <ControlsPanel devices={devices} loading={dLoading} toggleDevice={toggleDevice} />
          </ErrorBoundary>
          <ErrorBoundary>
            <AlertsFeed alerts={alerts} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
