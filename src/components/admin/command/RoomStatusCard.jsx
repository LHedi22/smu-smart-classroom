import { Link } from 'react-router-dom'
import AdminCard from '../common/AdminCard'
import StatusPill from '../common/StatusPill'

export default function RoomStatusCard({ room }) {
  return (
    <AdminCard
      className="hover:border-brand/40 transition-colors"
      title={room.roomId}
      subtitle={`${room.campusId} / ${room.buildingId}`}
      right={<StatusPill status={room.status} />}
    >
      <div className="space-y-2 text-xs">
        <p className="text-slate-300">
          Active session: <span className="font-medium">{room.activeSession?.courseName ?? 'None'}</span>
        </p>
        <p className="text-slate-400">Attendance: {room.attendancePct}%</p>
        <p className="text-slate-400">Present: {room.studentsPresent}</p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link to={`/admin/rooms/${room.roomId}`} className="btn-primary text-xs px-3 py-1.5">
          Control Room
        </Link>
        <Link to={`/admin/drilldown/campus/${room.campusId}/building/${room.buildingId}/room/${room.roomId}`} className="btn-ghost text-xs">
          Inspect
        </Link>
      </div>
    </AdminCard>
  )
}

