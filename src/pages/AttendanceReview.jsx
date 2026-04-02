import { useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useAttendance }    from '../hooks/useAttendance'
import { useSession }       from '../hooks/useSession'
import AttendanceTable      from '../components/review/AttendanceTable'
import ReviewSummary        from '../components/review/ReviewSummary'
import MoodleSyncButton     from '../components/review/MoodleSyncButton'

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
  const { roomId } = useParams()
  const { session }                               = useSession(roomId)
  const { enrolled, students, updateStudent }     = useAttendance(roomId, session?.sessionId)

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
