import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AttendanceTrend({ sessions }) {
  const data = sessions
    .filter(s => s.attendanceRate != null)
    .map(s => ({ date: s.date, rate: Math.round(s.attendanceRate) }))

  return (
    <div className="card">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Attendance Rate Trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #dde3ed', borderRadius: 8, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#6b7280' }}
            itemStyle={{ color: '#0075C9' }}
            formatter={v => [`${v}%`, 'Rate']}
          />
          <Line type="monotone" dataKey="rate" stroke="#0075C9" strokeWidth={2} dot={{ fill: '#0075C9', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
