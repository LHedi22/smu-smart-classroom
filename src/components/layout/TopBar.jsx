import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatClock } from '../../utils/formatTime'

export default function TopBar() {
  const { profile: professor } = useAuth()
  const [time, setTime] = useState(formatClock())

  useEffect(() => {
    const id = setInterval(() => setTime(formatClock()), 1000)
    return () => clearInterval(id)
  }, [])

  const displayName = professor?.name ?? professor?.displayName ?? professor?.email?.split('@')[0] ?? 'Professor'

  return (
    <header
      className="sticky top-0 z-[120] flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--border-muted)] bg-[color:var(--bg-surface-raised)] px-4 md:px-6"
      style={{ boxShadow: 'var(--shadow-sticky)' }}
    >
      <span className="text-sm text-[color:var(--fg-muted)]">{time}</span>
      <div className="flex items-center gap-3">
        <button className="btn-ghost relative flex h-11 w-11 items-center justify-center p-0" aria-label="Notifications">
          <Bell size={18} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[color:var(--accent-brand)]/15 text-sm font-semibold text-[color:var(--accent-brand)]">
            {displayName[0]?.toUpperCase()}
          </div>
          <span className="hidden text-sm text-[color:var(--fg-default)] md:block">{displayName}</span>
        </div>
      </div>
    </header>
  )
}
