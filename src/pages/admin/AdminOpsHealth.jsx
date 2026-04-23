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
import KpiCard from '../../components/admin/common/KpiCard'

export default function AdminOpsHealth() {
  const { data, loading, error } = useAdminResource(
    () => adminApi.getHealthDashboard(),
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">System Health Dashboard</h1>
        <p className="text-sm text-slate-500">Sensor uptime, camera uptime, API performance, and event processing delay.</p>
      </div>

      <AsyncState loading={loading} error={error}>
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <KpiCard label="Sensor uptime" value={`${data?.uptime?.sensors ?? 0}%`} tone="ok" />
            <KpiCard label="Camera uptime" value={`${data?.uptime?.cameras ?? 0}%`} tone="ok" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">API Response Times (p50/p95 ms)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.apiResponseTimes ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="p50" fill="#22c55e" />
                    <Bar dataKey="p95" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-slate-100 mb-3">Event Delay (ms)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.eventDelays ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="minute" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="delayMs" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      </AsyncState>
    </div>
  )
}

