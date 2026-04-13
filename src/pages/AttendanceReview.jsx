import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, CheckCircle } from 'lucide-react'
import { ref, set, remove } from 'firebase/database'
import { db } from '../firebase'
import { useAttendance }    from '../hooks/useAttendance'
import { useSession }       from '../hooks/useSession'
import AttendanceTable      from '../components/review/AttendanceTable'
import ReviewSummary        from '../components/review/ReviewSummary'
import MoodleSyncButton     from '../components/review/MoodleSyncButton'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function toHHMM(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function exportCSV(students, sessionId) {
  const rows = [
    ['ID', 'Name', 'Present', 'Entry Time', 'Override', 'Note'],
    ...students.map(s => [s.id, s.name, s.present ? 'Yes' : 'No', s.entryTime ?? '', s.manualOverride ? 'Yes' : 'No', s.overrideNote]),
  ]
  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `attendance_${sessionId}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AttendanceReview() {
  const { roomId }  = useParams()
  const navigate    = useNavigate()
  const { session }                           = useSession(roomId)
  const { enrolled, students, updateStudent } = useAttendance(roomId, session?.sessionId)
  const [saving, setSaving] = useState(false)

  const handleValidateClose = async () => {
    if (!session?.sessionId || USE_MOCK) {
      if (USE_MOCK) navigate('/history')
      return
    }
    setSaving(true)
    try {
      const present        = students.filter(s => s.present).length
      const attendanceRate = enrolled > 0 ? Math.round((present / enrolled) * 1000) / 10 : 0
      const now            = new Date()

      // Determine session date and startTime from the ISO startTime stored in activeSession
      let date      = toDateStr(now)
      let startTime = toHHMM(now)
      if (session.startTime) {
        const start = new Date(session.startTime)
        if (!isNaN(start)) { date = toDateStr(start); startTime = toHHMM(start) }
        else if (typeof session.startTime === 'string' && session.startTime.includes(':')) {
          // Already HH:MM
          startTime = session.startTime
        }
      }

      const studentsMap = Object.fromEntries(
        students.map(({ id, ...rest }) => [id, rest])
      )

      const sessionDoc = {
        id:             session.sessionId,
        courseId:       session.courseId   ?? null,
        moodleCourseId: session.moodleCourseId ?? null,
        courseName:     session.courseName ?? null,
        professorUid:   session.professorUid ?? null,
        roomId,
        date,
        startTime,
        endTime:        toHHMM(now),
        type:           session.type ?? 'Lecture',
        status:         'completed',
        attendanceRate,
        moodleSynced:   false,
        attendance: { enrolled, students: studentsMap },
      }

      await set(ref(db, `/sessions/${session.sessionId}`), sessionDoc)
      await remove(ref(db, `/classrooms/${roomId}/activeSession`))
      navigate('/history')
    } catch (err) {
      console.error('[AttendanceReview] Failed to save session:', err)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Attendance Review</h1>
          <p className="text-sm text-slate-500 mt-0.5">{session?.courseName} · Room {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(students, session?.sessionId)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised text-slate-300
                       hover:text-slate-100 border border-surface-border text-sm transition-colors"
          >
            <Download size={15} />
            CSV
          </button>
          <MoodleSyncButton
            courseId={session?.courseId}
            sessionId={session?.sessionId}
            students={students}
          />
          <button
            onClick={handleValidateClose}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                       bg-emerald-500/10 text-emerald-400 border border-emerald-500/30
                       hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={15} />
            {saving ? 'Saving…' : 'Validate & Close'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <ReviewSummary enrolled={enrolled} students={students} />

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <AttendanceTable students={students} onUpdate={updateStudent} />
      </div>
    </div>
  )
}
