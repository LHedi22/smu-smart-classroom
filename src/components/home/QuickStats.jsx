export default function QuickStats({ courses }) {
  const total = courses.reduce((s, c) => s + (c.enrolled ?? 0), 0)
  const live = courses.filter(c => c.status === 'live').length
  const upcoming = courses.filter(c => c.status === 'upcoming').length

  const stats = [
    { label: 'Live sessions', value: live },
    { label: 'Upcoming today', value: upcoming },
    { label: 'Total enrolled', value: total },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Quick statistics">
      {stats.map(s => (
        <article key={s.label} className="card rounded-[14px] bg-[color:var(--bg-surface-raised)] p-4 text-center">
          <p className="text-[1.5rem] font-semibold leading-none text-[color:var(--fg-default)]">{s.value}</p>
          <p className="mt-1 text-[0.875rem] text-[color:var(--fg-muted)]">{s.label}</p>
        </article>
      ))}
    </section>
  )
}
