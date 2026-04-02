import { SENSORS, STATUS_COLORS } from '../../utils/sensorStatus'

export default function SensorCard({ sensorKey, value }) {
  const def = SENSORS.find(s => s.key === sensorKey)
  if (!def) return null

  const status = value != null ? def.status(value) : 'good'
  const colors = STATUS_COLORS[status]
  const pct    = value != null ? ((value - def.min) / (def.max - def.min)) * 100 : 0

  const statusLabel = { good: 'Good', warn: 'Elevated', critical: 'Critical' }[status]

  return (
    <div className={`card border ${colors.border} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{def.label}</p>
          <p className="text-2xl font-bold text-slate-100 mt-0.5 font-mono">
            {value != null ? value : '—'}
            <span className="text-sm font-normal text-slate-500 ml-1">{def.unit}</span>
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {statusLabel}
        </span>
      </div>
      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}
