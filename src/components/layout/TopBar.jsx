import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useProfessor } from '../../context/AuthContext'
import { formatClock } from '../../utils/formatTime'

export default function TopBar() {
  const { professor } = useProfessor()
  const [time, setTime] = useState(formatClock())

  useEffect(() => {
    const id = setInterval(() => setTime(formatClock()), 1000)
    return () => clearInterval(id)
  }, [])

  const displayName = professor?.displayName ?? professor?.email?.split('@')[0] ?? 'Professor'

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-surface-border flex items-center justify-between px-4 lg:px-6">
      <span className="font-mono text-sm text-slate-400">{time}</span>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-raised transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-medium">
            {displayName[0]?.toUpperCase()}
          </div>
          <span className="hidden md:block text-sm text-slate-300">{displayName}</span>
        </div>
      </div>
    </header>
  )
}
