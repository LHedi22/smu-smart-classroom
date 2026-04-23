import { useMemo, useState } from 'react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('')
  const { data, loading, error } = useAdminResource(
    () => adminApi.getAuditLogs({ search }),
    [search]
  )

  const logs = useMemo(() => data?.logs ?? [], [data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Audit Logs</h1>
        <p className="text-sm text-slate-500">Searchable action history with actor, timestamps, and before/after values.</p>
      </div>

      <div className="card">
        <input
          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand/50"
          placeholder="Search by actor, action, room, incident..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <AsyncState loading={loading} error={error}>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[880px] text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-500">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Actor</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Target</th>
                <th className="text-left py-2">Before</th>
                <th className="text-left py-2">After</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-surface-border/70">
                  <td className="py-2 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2 text-slate-200">{log.actor}</td>
                  <td className="py-2 text-slate-300">{log.action}</td>
                  <td className="py-2 text-slate-400">{log.target}</td>
                  <td className="py-2 text-slate-500 font-mono text-[11px]">{JSON.stringify(log.before)}</td>
                  <td className="py-2 text-slate-500 font-mono text-[11px]">{JSON.stringify(log.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </div>
  )
}

