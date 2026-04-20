const variants = {
  good:     'bg-green-50    text-green-700  border border-green-200',
  warn:     'bg-amber-50    text-amber-700  border border-amber-200',
  critical: 'bg-red-50      text-red-600    border border-red-200',
  live:     'bg-brand/10    text-brand      border border-brand/30',
  info:     'bg-sky-50      text-sky-700    border border-sky-200',
  default:  'bg-gray-100    text-gray-600   border border-gray-200',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}
