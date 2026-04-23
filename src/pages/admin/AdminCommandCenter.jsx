import { useCallback, useEffect } from 'react'
import { Activity, Building2 } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { useAdminRealtime } from '../../hooks/useAdminRealtime'
import { useAdminDashboardStore } from '../../stores/useAdminDashboardStore'
import KpiCard from '../../components/admin/common/KpiCard'
import StatusPill from '../../components/admin/common/StatusPill'
import RoomStatusCard from '../../components/admin/command/RoomStatusCard'
import { AsyncState } from '../../components/admin/common/AsyncState'

export default function AdminCommandCenter() {
  const setSnapshot = useAdminDashboardStore(state => state.setCommandCenterSnapshot)
  const snapshot = useAdminDashboardStore(state => state.commandCenterSnapshot)
  const openAlertsCount = useAdminDashboardStore(state => state.openAlertsCount)
  const setSocketStatus = useAdminDashboardStore(state => state.setSocketStatus)

  const { data, setData, loading, error } = useAdminResource(
    () => adminApi.getCommandCenterSnapshot(),
    []
  )

  useEffect(() => {
    if (data) setSnapshot(data)
  }, [data, setSnapshot])

  const onRealtimeEvent = useCallback((payload) => {
    if (payload?.type === 'command-center:update' && payload.data) {
      setSnapshot(payload.data)
      setData(payload.data)
    }
  }, [setSnapshot, setData])

  const { status: wsStatus } = useAdminRealtime({
    topic: 'command-center',
    onEvent: onRealtimeEvent,
  })

  useEffect(() => {
    if (wsStatus) setSocketStatus(wsStatus)
  }, [wsStatus, setSocketStatus])

  const current = snapshot ?? data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Global Command Center</h1>
          <p className="text-sm text-slate-500">Real-time operations view for all classrooms and active sessions.</p>
        </div>
        <StatusPill status={wsStatus} label={`ws: ${wsStatus}`} />
      </div>

      <AsyncState loading={loading} error={error}>
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Active sessions" value={current?.kpis?.activeSessions ?? 0} tone="brand" />
            <KpiCard label="Students present" value={current?.kpis?.totalStudentsPresent ?? 0} tone="ok" />
            <KpiCard label="Open alerts" value={current?.kpis?.alerts ?? openAlertsCount ?? 0} tone="critical" />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Building2 size={15} className="text-brand" />
                Campus Rooms Grid
              </h2>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Activity size={12} />
                Updated {current?.generatedAt ? new Date(current.generatedAt).toLocaleTimeString() : '—'}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(current?.rooms ?? []).map(room => (
                <RoomStatusCard key={room.roomId} room={room} />
              ))}
            </div>
          </div>
        </>
      </AsyncState>
    </div>
  )
}

