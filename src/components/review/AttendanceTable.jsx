import StudentEditRow from './StudentEditRow'

export default function AttendanceTable({ students, onUpdate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-surface-border bg-surface-raised">
            {['ID', 'Name', 'Status', 'Entry', 'Override', 'Note'].map(h => (
              <th key={h} className="py-2 px-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <StudentEditRow key={s.id} student={s} onUpdate={onUpdate} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
