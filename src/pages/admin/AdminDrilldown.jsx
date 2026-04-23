import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'
import AdminCard from '../../components/admin/common/AdminCard'
import StatusPill from '../../components/admin/common/StatusPill'

function parseDrilldownPath(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const get = (label) => {
    const idx = parts.indexOf(label)
    return idx > -1 ? parts[idx + 1] ?? '' : ''
  }
  return {
    campusId: get('campus'),
    buildingId: get('building'),
    roomId: get('room'),
    sessionId: get('session'),
  }
}

function Crumb({ to, label, active }) {
  if (active) return <span className="text-slate-200 text-sm">{label}</span>
  return <Link to={to} className="text-xs text-brand hover:text-brand-light">{label}</Link>
}

export default function AdminDrilldown() {
  const location = useLocation()
  const path = parseDrilldownPath(location.pathname)
  const { data, loading, error } = useAdminResource(
    () => adminApi.getDrilldown(path),
    [path.campusId, path.buildingId, path.roomId, path.sessionId]
  )

  const campuses = data?.campuses ?? []
  const buildings = data?.buildings ?? []
  const rooms = data?.rooms ?? []
  const sessions = data?.sessions ?? []
  const students = data?.students ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Drill-Down Navigator</h1>
        <p className="text-sm text-slate-500">Campus → Building → Room → Session → Student</p>
      </div>

      <div className="card flex flex-wrap items-center gap-2 text-xs">
        <Crumb to="/admin/drilldown" label="Campus" active={!path.campusId} />
        <ChevronRight size={12} className="text-slate-500" />
        <Crumb
          to={path.campusId ? `/admin/drilldown/campus/${path.campusId}` : '#'}
          label={path.campusId || 'Building'}
          active={!!path.campusId && !path.buildingId}
        />
        <ChevronRight size={12} className="text-slate-500" />
        <Crumb
          to={path.buildingId ? `/admin/drilldown/campus/${path.campusId}/building/${path.buildingId}` : '#'}
          label={path.buildingId || 'Room'}
          active={!!path.buildingId && !path.roomId}
        />
        <ChevronRight size={12} className="text-slate-500" />
        <Crumb
          to={path.roomId ? `/admin/drilldown/campus/${path.campusId}/building/${path.buildingId}/room/${path.roomId}` : '#'}
          label={path.roomId || 'Session'}
          active={!!path.roomId && !path.sessionId}
        />
        <ChevronRight size={12} className="text-slate-500" />
        <span className="text-slate-400">{path.sessionId || 'Student'}</span>
      </div>

      <AsyncState loading={loading} error={error}>
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <AdminCard title="Active Sessions"><p className="text-2xl font-semibold text-brand">{data?.summary?.activeSessions ?? 0}</p></AdminCard>
            <AdminCard title="Average Attendance"><p className="text-2xl font-semibold text-slate-200">{data?.summary?.avgAttendance ?? 0}%</p></AdminCard>
            <AdminCard title="Critical Alerts"><p className="text-2xl font-semibold text-red-300">{data?.summary?.criticalAlerts ?? 0}</p></AdminCard>
          </div>

          {!path.campusId && (
            <div className="grid gap-4 md:grid-cols-2">
              {campuses.map(campus => (
                <AdminCard key={campus.id} title={campus.name} subtitle={`${campus.buildings} buildings`}>
                  <Link to={`/admin/drilldown/campus/${campus.id}`} className="btn-primary text-xs px-3 py-1.5">
                    Open Campus
                  </Link>
                </AdminCard>
              ))}
            </div>
          )}

          {path.campusId && !path.buildingId && (
            <div className="grid gap-4 md:grid-cols-2">
              {buildings.map(building => (
                <AdminCard key={building.id} title={building.name} subtitle={`${building.rooms} rooms`}>
                  <Link to={`/admin/drilldown/campus/${path.campusId}/building/${building.id}`} className="btn-primary text-xs px-3 py-1.5">
                    Open Building
                  </Link>
                </AdminCard>
              ))}
            </div>
          )}

          {path.buildingId && !path.roomId && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map(room => (
                <AdminCard key={room.roomId} title={room.roomId} subtitle={`${room.attendancePct}% attendance`} right={<StatusPill status={room.status} />}>
                  <div className="flex gap-2">
                    <Link to={`/admin/drilldown/campus/${path.campusId}/building/${path.buildingId}/room/${room.roomId}`} className="btn-primary text-xs px-3 py-1.5">
                      Open Room
                    </Link>
                    <Link to={`/admin/rooms/${room.roomId}`} className="btn-ghost text-xs">Control</Link>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}

          {path.roomId && !path.sessionId && (
            <div className="space-y-3">
              {sessions.map(session => (
                <AdminCard key={session.sessionId} title={session.courseName} subtitle={session.professor} right={<StatusPill status={session.status} />}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{new Date(session.startTime).toLocaleString()} · {session.attendancePct}% attendance</p>
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/drilldown/campus/${path.campusId}/building/${path.buildingId}/room/${path.roomId}/session/${session.sessionId}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Inspect Session
                      </Link>
                      <Link to={`/admin/sessions/${session.sessionId}/timeline`} className="btn-ghost text-xs">
                        Timeline
                      </Link>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
          )}

          {path.sessionId && (
            <div className="space-y-3">
              {students.map(student => (
                <div key={student.studentId} className="card flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.studentId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={student.presence === 'late' ? 'warning' : 'ok'} label={student.presence} />
                    <StatusPill status={student.risk === 'high' ? 'critical' : 'ok'} label={`${student.risk} risk`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      </AsyncState>
    </div>
  )
}

