import { formatRelativeTime } from '../../utils/formatTime'
import EmptyState from '../shared/EmptyState'
import { Bell } from 'lucide-react'

const typeStyles = {
  warn:  'bg-amber-400/10  text-amber-400  border-amber-500/30',
  ok:    'bg-emerald-400/10 text-emerald-400 border-emerald-500/30',
  info:  'bg-blue-400/10   text-blue-400   border-blue-500/30',
}

export default function AlertsFeed({ alerts }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Alerts</h2>
      <div className="card flex flex-col gap-2 max-h-64 overflow-y-auto p-3">
        {alerts.length === 0 ? (
          <EmptyState icon={<Bell size={24} />} title="No alerts" />
        ) : (
          alerts.map(a => (
            <div
              key={a.id}
              className={`flex items-start gap-2 p-2 rounded-lg border text-sm ${typeStyles[a.type] ?? typeStyles.info}`}
            >
              <span className="flex-1">{a.message}</span>
              <span className="text-xs opacity-60 flex-shrink-0 font-mono">
                {formatRelativeTime(a.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
