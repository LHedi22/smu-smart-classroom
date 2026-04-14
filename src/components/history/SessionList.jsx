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
          onClick={() => navigate(`/history/${s.id}`)}
          className="card flex w-full items-center gap-4 rounded-[14px] text-left transition-transform duration-150 hover:-translate-y-0.5"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[color:var(--fg-default)]">{s.courseName ?? s.courseId}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[color:var(--fg-muted)]">
              <span className="flex items-center gap-1"><MapPin size={11} />{s.roomId}</span>
              <span>{s.date} · {s.startTime}–{s.endTime}</span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {s.attendanceRate != null ? `${Math.round(s.attendanceRate)}% present` : '— %'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="flex-shrink-0 text-[color:var(--fg-muted)]" />
        </button>
      ))}
    </div>
  )
}
