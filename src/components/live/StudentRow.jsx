import { UserCheck, UserX } from 'lucide-react'

export default function StudentRow({ student, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${student.present ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300 truncate">{student.name}</span>
        {student.manualOverride && (
          <span className="text-xs text-amber-400/70 flex-shrink-0">manual</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {student.entryTime && (
          <span className="text-xs font-mono text-slate-600">{student.entryTime}</span>
        )}
        <button
          onClick={() => onToggle(student.id, !student.present)}
          className={`p-1.5 rounded-lg transition-colors ${
            student.present
              ? 'text-emerald-400 hover:bg-emerald-400/10'
              : 'text-slate-600 hover:bg-slate-700'
          }`}
        >
          {student.present ? <UserCheck size={15} /> : <UserX size={15} />}
        </button>
      </div>
    </div>
  )
}
