import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'
import StatusPill from '../../components/admin/common/StatusPill'

export default function AdminAttendanceIntelligence() {
  const { data, loading, error } = useAdminResource(
    () => adminApi.getAttendanceIntelligence(),
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Attendance Intelligence</h1>
        <p className="text-sm text-slate-500">Lateness, early exits, anomalies, and attendance trends by session/class.</p>
      </div>

      <AsyncState loading={loading} error={error}>
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Frequent Lateness</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.lateness ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="lateCount" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Early Exits</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.earlyExits ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="earlyExitCount" fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Trend by Week</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="attendancePct" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="anomalies" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Anomaly Feed</h2>
              <div className="space-y-3">
                {(data?.anomalies ?? []).map(anomaly => (
                  <div key={anomaly.id} className="rounded-lg border border-surface-border bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-200">{anomaly.title}</p>
                      <StatusPill status={anomaly.severity === 'high' ? 'critical' : 'warning'} label={anomaly.severity} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      </AsyncState>
    </div>
  )
}

