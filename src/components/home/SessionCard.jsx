import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ArrowRight, Radio } from 'lucide-react'
import Badge from '../shared/Badge'

export default function SessionCard({ course }) {
  const navigate = useNavigate()

  const badgeVariant = { live: 'live', upcoming: 'default', completed: 'good' }[course.status] ?? 'default'
  const badgeLabel   = { live: 'Live', upcoming: 'Upcoming', completed: 'Done' }[course.status] ?? course.status

  return (
    <article className="card flex items-start gap-4 rounded-[14px] transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={badgeVariant}>
            {course.status === 'live' && <Radio size={10} className="animate-pulse" />}
            {badgeLabel}
          </Badge>
          <span className="text-xs text-[color:var(--fg-muted)] font-mono">{course.shortname}</span>
        </div>
        <p className="truncate text-[1rem] font-semibold text-[color:var(--fg-default)]">{course.fullname}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[color:var(--fg-muted)]">
          <span className="flex items-center gap-1"><MapPin size={11} />{course.roomId}</span>
          <span className="flex items-center gap-1"><Users size={11} />{course.enrolled} students</span>
          <span className="font-mono">{course.startTime} – {course.endTime}</span>
        </div>
      </div>
      {course.status !== 'completed' && (
        <button
          onClick={() => navigate(`/session/${course.roomId}`)}
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-all duration-150
            ${course.status === 'live'
              ? 'bg-[color:var(--accent-brand)] text-white hover:bg-[color:var(--accent-brand)]/90'
              : 'bg-[color:var(--bg-surface-muted)] text-[color:var(--fg-default)] hover:bg-[color:var(--border-muted)]'}`}
        >
          {course.status === 'live' ? 'Join' : 'Open'}
          <ArrowRight size={14} />
        </button>
      )}
    </article>
  )
}
