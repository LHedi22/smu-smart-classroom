import { useEffect, useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import StatusPill from '../common/StatusPill'

const EVENT_TYPES = ['entry', 'exit', 'alert', 'environment']

function formatTs(isoString) {
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString()
}

export default function TimelineReplay({ events = [] }) {
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [filters, setFilters] = useState(() => Object.fromEntries(EVENT_TYPES.map(t => [t, true])))

  const filtered = useMemo(
    () => events.filter(event => filters[event.type]),
    [events, filters]
  )

  const current = filtered[position] ?? null

  const toggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }))
    setPosition(0)
  }

  const togglePlay = () => {
    if (!filtered.length) return
    setPlaying(prev => !prev)
  }

  useEffect(() => {
    if (!playing || filtered.length === 0) return
    const timer = setInterval(() => {
      setPosition(prev => prev + 1 >= filtered.length ? 0 : prev + 1)
    }, 900)
    return () => clearInterval(timer)
  }, [playing, filtered.length])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={togglePlay} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          className="flex-1 min-w-48"
          min={0}
          max={Math.max(filtered.length - 1, 0)}
          value={Math.min(position, Math.max(filtered.length - 1, 0))}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        <span className="text-xs text-slate-400">
          {filtered.length ? `${position + 1} / ${filtered.length}` : '0 / 0'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
              filters[type]
                ? 'border-brand/40 text-brand bg-brand/10'
                : 'border-surface-border text-slate-500'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="card border-surface-border/80">
        {!current ? (
          <p className="text-sm text-slate-500">No events for selected filters.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">{current.label}</p>
              <StatusPill status={current.severity} label={current.severity} />
            </div>
            <p className="text-xs text-slate-400">{formatTs(current.timestamp)}</p>
            <p className="text-xs text-slate-400">Type: {current.type}</p>
            {current.student && <p className="text-xs text-slate-400">Student: {current.student}</p>}
            {current.anomaly && (
              <p className="text-xs text-amber-300 border border-amber-500/40 rounded px-2 py-1 inline-flex">
                Anomaly highlighted
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map((event, idx) => (
          <button
            key={event.id}
            onClick={() => setPosition(idx)}
            className={`w-full text-left p-2 rounded-lg border transition-colors ${
              idx === position
                ? 'border-brand/40 bg-brand/10'
                : 'border-surface-border text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium">{event.label}</p>
              <span className="text-[11px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

