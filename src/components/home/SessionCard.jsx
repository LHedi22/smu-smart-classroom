import { useNavigate } from 'react-router-dom'
import { MapPin, Users, ArrowRight, Radio } from 'lucide-react'
import Badge from '../shared/Badge'

export default function SessionCard({ course }) {
  const navigate = useNavigate()

  const badgeVariant = { live: 'live', upcoming: 'default', completed: 'good' }[course.status] ?? 'default'
  const badgeLabel   = { live: 'Live', upcoming: 'Upcoming', completed: 'Done' }[course.status] ?? course.status

  return (
    <div className="card flex items-start gap-4 hover:border-surface-border/80 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={badgeVariant}>
            {course.status === 'live' && <Radio size={10} className="animate-pulse" />}
            {badgeLabel}
          </Badge>
          <span className="text-xs text-slate-500 font-mono">{course.shortname}</span>
        </div>
        <p className="text-slate-200 font-medium truncate">{course.fullname}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={11} />{course.roomId}</span>
          <span className="flex items-center gap-1"><Users size={11} />{course.enrolled} students</span>
          <span className="font-mono">{course.startTime} – {course.endTime}</span>
        </div>
      </div>
      {course.status !== 'completed' && (
        <button
          onClick={() => navigate(`/session/${course.roomId}`)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0
            ${course.status === 'live'
              ? 'bg-brand text-white hover:bg-brand-dark'
              : 'bg-surface-raised text-slate-300 hover:bg-surface-border'}`}
        >
          {course.status === 'live' ? 'Join' : 'Open'}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
