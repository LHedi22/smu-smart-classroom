import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AttendanceTrend({ sessions }) {
  // Only chart sessions that have a real attendance rate
  const data = sessions
    .filter(s => s.attendanceRate != null)
    .map(s => ({ date: s.date, rate: Math.round(s.attendanceRate) }))

  return (
    <div className="card">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Attendance Rate Trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#0b1428', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#00c49a' }}
            formatter={v => [`${v}%`, 'Rate']}
          />
          <Line type="monotone" dataKey="rate" stroke="#00c49a" strokeWidth={2} dot={{ fill: '#00c49a', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
