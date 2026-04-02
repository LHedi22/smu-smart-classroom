import RingChart   from '../shared/RingChart'
import StudentRow   from './StudentRow'
import { Clock }   from 'lucide-react'

export default function AttendancePanel({ enrolled, students, updateStudent, sessionStatus }) {
  const present = students.filter(s => s.present).length
  const pct     = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Attendance</h2>

      {sessionStatus !== 'live' ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Clock size={32} className="text-slate-600" />
          <p className="text-slate-400 font-medium">Class hasn't started yet</p>
          <p className="text-xs text-slate-600">{enrolled} students enrolled — attendance will appear once the session goes live.</p>
        </div>
      ) : (
        <>
          {/* Ring summary */}
          <div className="card flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <RingChart value={present} total={enrolled} size={100} strokeWidth={9} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-100">{pct}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Stat label="Present"  value={present}            color="text-emerald-400" />
              <Stat label="Absent"   value={enrolled - present} color="text-red-400" />
              <Stat label="Enrolled" value={enrolled}           color="text-slate-400" />
            </div>
          </div>

          {/* Student list */}
          <div className="card flex flex-col gap-0 max-h-72 overflow-y-auto p-2">
            {students.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                onToggle={(id, present) => updateStudent(id, { present, manualOverride: true })}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
