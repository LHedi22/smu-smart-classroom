export default function ReviewSummary({ enrolled, students }) {
  const present = students.filter(s => s.present).length
  const absent  = enrolled - present
  const rate    = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Pill label="Present"  value={present}    color="text-green-600" />
      <Pill label="Absent"   value={absent}     color="text-red-500" />
      <Pill label="Rate"     value={`${rate}%`} color="text-brand" />
      <Pill label="Enrolled" value={enrolled}   color="text-gray-500" />
    </div>
  )
}

function Pill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
