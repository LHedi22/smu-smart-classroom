import { useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

// In production: fetch from Firebase keyed by studentId
const MOCK_STUDENT = {
  id: '21ISS001', name: 'Ahmed Ben Salah', email: 'a.bensalah@smu.tn',
  profileimageurl: null,
  sessions: [
    { sessionId: 'sess_20260401_0900', date: '2026-04-01', course: 'IoT Systems', present: true },
    { sessionId: 'sess_20260331_0900', date: '2026-03-31', course: 'IoT Systems', present: true },
    { sessionId: 'sess_20260328_0900', date: '2026-03-28', course: 'IoT Systems', present: false },
    { sessionId: 'sess_20260325_0900', date: '2026-03-25', course: 'IoT Systems', present: true },
    { sessionId: 'sess_20260322_0900', date: '2026-03-22', course: 'IoT Systems', present: false },
  ],
}

export default function StudentProfile() {
  const { studentId } = useParams()
  const student = MOCK_STUDENT

  const attended = student.sessions.filter(s => s.present).length
  const rate     = student.sessions.length > 0 ? Math.round((attended / student.sessions.length) * 100) : 0
  const flagged  = rate < 70

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xl font-bold">
          {student.name[0]}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{student.name}</h1>
          <p className="text-sm text-slate-500">{student.id} · {student.email}</p>
        </div>
      </div>

      {/* Counseling alert */}
      {flagged && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-400/10 border border-amber-500/30 text-amber-400">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Low attendance — {rate}%</p>
            <p className="text-xs mt-0.5 text-amber-400/70">Consider referring this student to the counseling center.</p>
          </div>
        </div>
      )}

      {/* Attendance rate card */}
      <div className="card">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overall Attendance</p>
        <p className="text-3xl font-bold text-slate-100">{rate}%</p>
        <p className="text-xs text-slate-500 mt-1">{attended} of {student.sessions.length} sessions attended</p>
      </div>

      {/* Session history */}
      <div className="card p-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-surface-border">
          Session History
        </p>
        {student.sessions.map(s => (
          <div key={s.sessionId} className="flex items-center justify-between px-4 py-3 border-b border-surface-border last:border-0">
            <div>
              <p className="text-sm text-slate-200">{s.course}</p>
              <p className="text-xs text-slate-500 font-mono">{s.date}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${s.present ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
              {s.present ? 'Present' : 'Absent'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
