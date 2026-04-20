export default function StudentEditRow({ student, onUpdate }) {
  return (
    <tr className="border-b border-surface-border hover:bg-surface-raised transition-colors">
      <td className="py-2.5 px-3 text-sm text-gray-400 font-mono">{student.id}</td>
      <td className="py-2.5 px-3 text-sm text-gray-700">{student.name}</td>
      <td className="py-2.5 px-3 text-center">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full
          ${student.present ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {student.present ? 'Present' : 'Absent'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-sm font-mono text-gray-400">{student.entryTime ?? '—'}</td>
      <td className="py-2.5 px-3">
        <button
          onClick={() => onUpdate(student.id, { present: !student.present, manualOverride: true })}
          className="text-xs text-gray-400 hover:text-brand underline underline-offset-2 transition-colors"
        >
          Toggle
        </button>
      </td>
      <td className="py-2.5 px-3">
        <input
          defaultValue={student.overrideNote}
          onBlur={e => onUpdate(student.id, { overrideNote: e.target.value })}
          placeholder="Note…"
          className="bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-600
                     w-32 outline-none focus:border-brand/50 transition-colors"
        />
      </td>
    </tr>
  )
}
