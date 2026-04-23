export default function KpiCard({ label, value, delta, tone = 'brand' }) {
  const toneClass =
    tone === 'critical' ? 'text-red-300'
      : tone === 'warning' ? 'text-amber-300'
        : tone === 'ok' ? 'text-emerald-300'
          : 'text-brand'
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${toneClass}`}>{value}</p>
      {delta != null && <p className="text-xs text-slate-500 mt-1">{delta}</p>}
    </div>
  )
}

