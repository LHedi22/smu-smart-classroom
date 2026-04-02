export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex items-center justify-center gap-2 text-slate-400">
      <svg className="animate-spin h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="text-sm">Loading…</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-deep">
        {spinner}
      </div>
    )
  }
  return spinner
}
