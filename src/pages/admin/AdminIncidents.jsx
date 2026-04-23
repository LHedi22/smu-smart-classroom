import { useEffect, useState } from 'react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'
import StatusPill from '../../components/admin/common/StatusPill'
import { useAdminDashboardStore } from '../../stores/useAdminDashboardStore'
import { countOpenIncidents } from '../../utils/incidentUtils'

const ASSIGNEES = ['ops-admin@smu.tn', 'security-admin@smu.tn', 'iot-admin@smu.tn']

export default function AdminIncidents() {
  const [noteByIncident, setNoteByIncident] = useState({})
  const setOpenAlertsCount = useAdminDashboardStore(state => state.setOpenAlertsCount)
  const { data, setData, loading, error } = useAdminResource(
    () => adminApi.getIncidents(),
    []
  )

  const incidents = data?.incidents ?? []

  useEffect(() => {
    setOpenAlertsCount(countOpenIncidents(incidents))
  }, [incidents, setOpenAlertsCount])

  const updateIncident = (incidentId, patch) => {
    setData(prev => ({
      ...prev,
      incidents: (prev?.incidents ?? []).map(incident => incident.id === incidentId ? { ...incident, ...patch } : incident),
    }))
  }

  const assignIncident = async (incidentId, assignedTo) => {
    await adminApi.assignIncident(incidentId, assignedTo)
    updateIncident(incidentId, { assignedTo })
  }

  const resolveIncident = async (incidentId) => {
    await adminApi.resolveIncident(incidentId)
    updateIncident(incidentId, { status: 'resolved' })
  }

  const addNote = async (incidentId) => {
    const note = noteByIncident[incidentId]?.trim()
    if (!note) return
    await adminApi.addIncidentNote(incidentId, note)
    setData(prev => ({
      ...prev,
      incidents: (prev?.incidents ?? []).map(incident =>
        incident.id === incidentId
          ? { ...incident, notes: [...(incident.notes ?? []), { text: note, createdAt: new Date().toISOString() }] }
          : incident
      ),
    }))
    setNoteByIncident(prev => ({ ...prev, [incidentId]: '' }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Smart Alerts / Incident Center</h1>
        <p className="text-sm text-slate-500">Assign incidents, add notes, and close alerts with full accountability.</p>
      </div>

      <AsyncState loading={loading} error={error}>
        <div className="grid gap-4 xl:grid-cols-2">
          {incidents.map(incident => (
            <div key={incident.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{incident.title}</p>
                  <p className="text-xs text-slate-500">{incident.id} · room {incident.roomId}</p>
                </div>
                <div className="flex gap-2">
                  <StatusPill status={incident.priority} label={incident.priority} />
                  <StatusPill status={incident.status} label={incident.status} />
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <select
                  className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand/50"
                  value={incident.assignedTo ?? ''}
                  onChange={e => assignIncident(incident.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {ASSIGNEES.map(assignee => <option key={assignee} value={assignee}>{assignee}</option>)}
                </select>
                <button
                  className="btn-primary text-xs px-3 py-1.5"
                  disabled={incident.status === 'resolved'}
                  onClick={() => resolveIncident(incident.id)}
                >
                  Mark resolved
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full min-h-20 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand/50"
                  placeholder="Add operational note..."
                  value={noteByIncident[incident.id] ?? ''}
                  onChange={e => setNoteByIncident(prev => ({ ...prev, [incident.id]: e.target.value }))}
                />
                <button className="btn-ghost text-xs" onClick={() => addNote(incident.id)}>Add note</button>
              </div>

              {(incident.notes ?? []).length > 0 && (
                <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
                  {incident.notes.map((note, idx) => (
                    <div key={`${incident.id}-note-${idx}`} className="rounded-lg border border-surface-border bg-surface-raised p-2">
                      <p className="text-xs text-slate-300">{note.text}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}

