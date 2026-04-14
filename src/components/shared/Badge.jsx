const variants = {
  good: 'border border-[color:var(--accent-positive)]/35 bg-[color:var(--accent-positive)]/10 text-[color:var(--accent-positive)]',
  warn: 'border border-[color:var(--accent-warning)]/40 bg-[color:var(--accent-warning)]/15 text-[color:var(--fg-default)]',
  critical: 'border border-[color:var(--accent-danger)]/35 bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]',
  live: 'border border-[color:var(--accent-brand)]/35 bg-[color:var(--accent-brand)]/10 text-[color:var(--accent-brand)]',
  info: 'border border-[color:var(--accent-info)]/35 bg-[color:var(--accent-info)]/10 text-[color:var(--accent-info)]',
  default: 'border border-[color:var(--border-muted)] bg-[color:var(--bg-surface-muted)] text-[color:var(--fg-muted)]',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}
