import { UserCheck, UserX } from 'lucide-react'

export default function StudentRow({ student, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${student.present ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-sm text-gray-700 truncate">{student.name}</span>
        {student.manualOverride && (
          <span className="text-xs text-amber-500 flex-shrink-0">manual</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {student.entryTime && (
          <span className="text-xs font-mono text-gray-400">{student.entryTime}</span>
        )}
        <button
          onClick={() => onToggle(student.id, !student.present)}
          className={`p-1.5 rounded-lg transition-colors ${
            student.present
              ? 'text-green-600 hover:bg-green-50'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          {student.present ? <UserCheck size={15} /> : <UserX size={15} />}
        </button>
      </div>
    </div>
  )
}
