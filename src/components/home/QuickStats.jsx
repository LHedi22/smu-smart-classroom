export default function QuickStats({ courses }) {
  const total    = courses.reduce((s, c) => s + (c.enrolled ?? 0), 0)
  const live     = courses.filter(c => c.status === 'live').length
  const upcoming = courses.filter(c => c.status === 'upcoming').length

  const stats = [
    { label: 'Live sessions',     value: live },
    { label: 'Upcoming today',    value: upcoming },
    { label: 'Total enrolled',    value: total },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{s.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
