const statusClasses = {
  ok: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  critical: 'bg-red-500/15 text-red-300 border border-red-500/30',
  high: 'bg-red-500/15 text-red-300 border border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  low: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  online: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  degraded: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  offline: 'bg-red-500/15 text-red-300 border border-red-500/30',
  open: 'bg-red-500/15 text-red-300 border border-red-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  connected: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  reconnecting: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  connecting: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  error: 'bg-red-500/15 text-red-300 border border-red-500/30',
  disabled: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  true: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  false: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  idle: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
}

export default function StatusPill({ status, label }) {
  const key = String(status ?? 'idle').toLowerCase()
  const text = label ?? key
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[key] ?? statusClasses.idle}`}>
      {text}
    </span>
  )
}

