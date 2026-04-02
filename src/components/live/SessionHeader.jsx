import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, StopCircle, Radio } from 'lucide-react'
import { formatDuration } from '../../utils/formatTime'

export default function SessionHeader({ session, roomId }) {
  const navigate  = useNavigate()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!session?.startTime) return
    const start = new Date(session.startTime).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.startTime])

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radio size={14} className="text-brand animate-pulse" />
          <span className="text-xs font-medium text-brand uppercase tracking-wide">Live Session</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100">{session?.courseName ?? '—'}</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={13} />{roomId}</span>
          <span className="font-mono">{formatDuration(elapsed)}</span>
        </div>
      </div>
      <button
        onClick={() => navigate(`/session/${roomId}/review`)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400
                   border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium flex-shrink-0"
      >
        <StopCircle size={15} />
        End Session
      </button>
    </div>
  )
}
