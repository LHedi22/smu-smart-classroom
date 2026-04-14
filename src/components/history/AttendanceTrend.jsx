import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AttendanceTrend({ sessions }) {
  // Only chart sessions that have a real attendance rate
  const data = sessions
    .filter(s => s.attendanceRate != null)
    .map(s => ({ date: s.date, rate: Math.round(s.attendanceRate) }))

  return (
    <div className="card rounded-[14px]">
      <p className="mb-3 text-xs uppercase tracking-wider text-[color:var(--fg-muted)]">Attendance Rate Trend</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: 'var(--fg-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--fg-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-muted)',
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--fg-muted)' }}
            itemStyle={{ color: 'var(--accent-brand)' }}
            formatter={v => [`${v}%`, 'Rate']}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--accent-brand)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent-brand)', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
