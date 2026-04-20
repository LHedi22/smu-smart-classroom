export default function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {icon && <div className="text-gray-300 text-4xl">{icon}</div>}
      <p className="text-gray-600 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
    </div>
  )
}
