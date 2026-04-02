import { useParams } from 'react-router-dom'
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { useSessionDetail } from '../hooks/useSessionDetail'

export default function SessionDetail() {
  const { sessionId } = useParams()
  const { session, loading } = useSessionDetail(sessionId)

  if (loading) return <LoadingSpinner />

  if (!session) return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-3 py-20">
      <AlertCircle size={32} className="text-slate-600" />
      <p className="text-slate-400">Session not found.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{session.courseName}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
          <span className="flex items-center gap-1"><MapPin size={13} />{session.roomId}</span>
          <span>{session.date} · {session.startTime?.slice(11, 16) ?? session.startTime}–{session.endTime?.slice(11, 16) ?? session.endTime}</span>
          {session.moodleSynced && (
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={13} />Synced</span>
          )}
        </div>
      </div>

      {/* Attendance rate */}
      <div className="card">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Attendance</p>
        <p className="text-3xl font-bold text-slate-100">
          {session.attendanceRate != null ? `${Math.round(session.attendanceRate)}%` : '—'}
        </p>
      </div>

      {/* Env summary */}
      {session.envSummary && (
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Environment Summary</p>
          <div className="grid grid-cols-3 gap-4">
            <EnvStat label="Avg Temp"  value={`${session.envSummary.avgTemp}°C`} />
            <EnvStat label="Avg CO₂"  value={`${session.envSummary.avgCO2} ppm`} />
            <EnvStat label="Avg Noise" value={`${session.envSummary.avgNoise} dB`} />
          </div>
        </div>
      )}
    </div>
  )
}

function EnvStat({ label, value }) {
  return (
    <div>
      <p className="text-lg font-bold text-slate-200">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
