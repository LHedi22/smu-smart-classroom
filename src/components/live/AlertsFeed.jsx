import { formatRelativeTime } from '../../utils/formatTime'
import EmptyState from '../shared/EmptyState'
import { Bell } from 'lucide-react'

const typeStyles = {
  warn:  'bg-amber-50  text-amber-700  border-amber-200',
  ok:    'bg-green-50  text-green-700  border-green-200',
  info:  'bg-sky-50    text-sky-700    border-sky-200',
}

export default function AlertsFeed({ alerts }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Alerts</h2>
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
