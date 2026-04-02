import { useParams } from 'react-router-dom'
import SessionHeader      from '../components/live/SessionHeader'
import EnvironmentPanel   from '../components/live/EnvironmentPanel'
import AttendancePanel    from '../components/live/AttendancePanel'
import ControlsPanel      from '../components/live/ControlsPanel'
import AlertsFeed         from '../components/live/AlertsFeed'
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
      <SessionHeader session={session} roomId={roomId} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Column 1 — Environment */}
        <EnvironmentPanel sensors={sensors} loading={sLoading} />

        {/* Column 2 — Attendance */}
        <AttendancePanel
          enrolled={enrolled}
          students={students}
          updateStudent={updateStudent}
          sessionStatus={session?.status}
        />

        {/* Column 3 — Controls + Alerts */}
        <div className="flex flex-col gap-5">
          <ControlsPanel devices={devices} loading={dLoading} toggleDevice={toggleDevice} />
          <AlertsFeed alerts={alerts} />
        </div>
      </div>
    </div>
  )
}
