export default function EmptyState({ icon, title, description }) {
  return (
    <section className="card flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon && <div className="text-4xl text-[color:var(--fg-muted)]">{icon}</div>}
      <p className="text-base font-semibold text-[color:var(--fg-default)]">{title}</p>
      {description && <p className="max-w-xs text-sm text-[color:var(--fg-muted)]">{description}</p>}
    </section>
  )
}
