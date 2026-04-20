import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ChevronRight } from 'lucide-react'
import EmptyState from '../shared/EmptyState'
import { ClockIcon } from 'lucide-react'

export default function SessionList({ sessions }) {
  const navigate = useNavigate()
  if (!sessions.length) return (
    <EmptyState icon={<ClockIcon size={28} />} title="No sessions found" description="Try adjusting your filters." />
  )

  return (
    <div className="flex flex-col gap-2">
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => navigate(`/history/${s.id}`, { state: { session: s } })}
          className="card flex items-center gap-4 text-left hover:border-brand/30 transition-colors w-full"
        >
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-medium">{s.courseName ?? s.courseId}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin size={11} />{s.roomId}</span>
              <span>{s.date} · {s.startTime}–{s.endTime}</span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {s.attendanceRate != null ? `${Math.round(s.attendanceRate)}% present` : '— %'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}
