export default function QuickStats({ courses, totalEnrolled }) {
  const live     = courses.filter(c => c.status === 'live').length
  const upcoming = courses.filter(c => c.status === 'upcoming').length

  const stats = [
    { label: 'Live sessions',  value: live,     accent: 'text-brand' },
    { label: 'Upcoming today', value: upcoming,  accent: 'text-[#00AFAA]' },
    { label: 'Total enrolled', value: totalEnrolled ?? 0, accent: 'text-gray-800' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className="card text-center">
          <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
