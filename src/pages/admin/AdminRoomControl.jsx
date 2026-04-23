import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { useAdminRealtime } from '../../hooks/useAdminRealtime'
import { AsyncState } from '../../components/admin/common/AsyncState'
import AdminCard from '../../components/admin/common/AdminCard'
import StatusPill from '../../components/admin/common/StatusPill'
import SensorLineChart from '../../components/admin/common/SensorLineChart'

export default function AdminRoomControl() {
  const { roomId } = useParams()
  const [saving, setSaving] = useState(false)
  const { data, setData, loading, error } = useAdminResource(
    () => adminApi.getRoomControl(roomId),
    [roomId]
  )

  const sensors = data?.sensors ?? []
  const devices = data?.devices ?? {}
  const thresholds = data?.thresholds ?? {}
  const [thresholdDraft, setThresholdDraft] = useState(thresholds)

  useEffect(() => {
    setThresholdDraft(thresholds)
  }, [thresholds])

  const patchDevice = async (device, value) => {
    setSaving(true)
    try {
      await adminApi.toggleRoomDevice(roomId, device, value)
      setData(prev => ({ ...prev, devices: { ...prev.devices, [device]: value } }))
    } finally {
      setSaving(false)
    }
  }

  const restartDevice = async (device) => {
    setSaving(true)
    try {
      await adminApi.restartRoomDevice(roomId, device)
    } finally {
      setSaving(false)
    }
  }

  const applyThresholds = async () => {
    setSaving(true)
    try {
      await adminApi.updateRoomThresholds(roomId, thresholdDraft)
      setData(prev => ({ ...prev, thresholds: thresholdDraft }))
    } finally {
      setSaving(false)
    }
  }

  const setOverride = async (enabled) => {
    setSaving(true)
    try {
      await adminApi.setProfessorOverride(roomId, enabled)
      setData(prev => ({ ...prev, devices: { ...prev.devices, professorOverride: enabled } }))
    } finally {
      setSaving(false)
    }
  }

  const onRealtimeEvent = useCallback((payload) => {
    if (payload?.type === 'room:update' && payload.roomId === roomId && payload.data) {
      setData(prev => ({ ...prev, ...payload.data }))
    }
  }, [roomId, setData])

  useAdminRealtime({
    topic: `room:${roomId}`,
    onEvent: onRealtimeEvent,
  })

  const deviceEntries = useMemo(() => Object.entries(devices), [devices])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Classroom Control Panel · {roomId}</h1>
        <p className="text-sm text-slate-500">Live sensors, devices, thresholds, and control actions.</p>
      </div>

      <AsyncState loading={loading} error={error}>
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <AdminCard
              className="xl:col-span-2"
              title="Real-time Environment"
              subtitle="Temperature, humidity, and CO2 trends"
            >
              <SensorLineChart data={sensors} />
            </AdminCard>

            <AdminCard
              title="Current Session"
              subtitle={data?.currentSession?.professor}
              right={<StatusPill status={data?.currentSession?.status} />}
            >
              <p className="text-sm text-slate-200">{data?.currentSession?.courseName ?? 'No active session'}</p>
              <p className="text-xs text-slate-500 mt-1">Attendance: {data?.currentSession?.attendancePct ?? 0}%</p>
            </AdminCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminCard title="Device Controls" subtitle="Toggle room devices and restart components">
              <div className="space-y-2">
                {deviceEntries.map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-surface-border bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-200">{key}</p>
                        <StatusPill status={String(value)} label={String(value)} />
                      </div>
                      <div className="flex items-center gap-2">
                        {(key === 'ac' || key === 'lights' || key === 'ventilation') && (
                          <button onClick={() => patchDevice(key, !value)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                            {value ? 'Turn Off' : 'Turn On'}
                          </button>
                        )}
                        {key !== 'professorOverride' && (
                          <button onClick={() => restartDevice(key)} disabled={saving} className="btn-ghost text-xs inline-flex items-center gap-1">
                            <RotateCcw size={12} />
                            Restart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="Thresholds & Override" subtitle="Adjust rule boundaries for this room">
              <div className="space-y-3">
                {Object.keys(thresholds).map((key) => (
                  <label key={key} className="block">
                    <span className="text-xs text-slate-400">{key}</span>
                    <input
                      className="mt-1 w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand/50"
                      value={thresholdDraft[key] ?? ''}
                      onChange={(e) => setThresholdDraft(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    />
                  </label>
                ))}

                <div className="flex gap-2">
                  <button onClick={applyThresholds} disabled={saving} className="btn-primary text-xs px-3 py-1.5">Save thresholds</button>
                  <button
                    onClick={() => setOverride(!(data?.devices?.professorOverride))}
                    disabled={saving}
                    className="btn-ghost text-xs"
                  >
                    {data?.devices?.professorOverride ? 'Disable' : 'Enable'} professor override
                  </button>
                </div>
              </div>
            </AdminCard>
          </div>
        </>
      </AsyncState>
    </div>
  )
}

