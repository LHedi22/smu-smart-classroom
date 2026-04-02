const variants = {
  good:     'bg-emerald-400/10 text-emerald-400 border border-emerald-500/30',
  warn:     'bg-amber-400/10  text-amber-400  border border-amber-500/30',
  critical: 'bg-red-400/10    text-red-400    border border-red-500/30',
  live:     'bg-brand/10      text-brand      border border-brand/30',
  info:     'bg-blue-400/10   text-blue-400   border border-blue-500/30',
  default:  'bg-slate-700/50  text-slate-300  border border-slate-600/30',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}
