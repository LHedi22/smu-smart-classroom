import api from '../api'
import {
  addMockIncidentNote,
  createMockRule,
  deleteMockRule,
  getMockAttendanceIntelligence,
  getMockAuditLogs,
  getMockCommandCenterSnapshot,
  getMockDrilldown,
  getMockHealthDashboard,
  getMockIncidents,
  getMockRoomControl,
  getMockRules,
  getMockSessionTimeline,
  simulateMockRule,
  updateMockIncident,
  updateMockRule,
} from './adminMockApi'

const ENABLE_LIVE_ADMIN_API = import.meta.env.VITE_ADMIN_LIVE_API === 'true'
const USE_MOCK = import.meta.env.VITE_ADMIN_USE_MOCK === 'true' || !ENABLE_LIVE_ADMIN_API
const FALLBACK_TO_MOCK = import.meta.env.VITE_ADMIN_FALLBACK_TO_MOCK !== 'false'

async function withMockFallback(liveCall, mockCall) {
  if (USE_MOCK) return mockCall()

  try {
    return await liveCall()
  } catch (error) {
    if (!FALLBACK_TO_MOCK) throw error
    return mockCall()
  }
}

const get = (url, config) => api.get(url, config).then(r => r.data)
const post = (url, body) => api.post(url, body).then(r => r.data)
const patch = (url, body) => api.patch(url, body).then(r => r.data)
const del = (url) => api.delete(url).then(r => r.data)

export const adminApi = {
  getCommandCenterSnapshot: () =>
    withMockFallback(
      () => get('/api/admin/command-center'),
      () => getMockCommandCenterSnapshot()
    ),

  getDrilldown: (params = {}) =>
    withMockFallback(
      () => get('/api/admin/drilldown', { params }),
      () => getMockDrilldown(params)
    ),

  getRoomControl: (roomId) =>
    withMockFallback(
      () => get(`/api/admin/rooms/${roomId}/control`),
      () => getMockRoomControl(roomId)
    ),

  toggleRoomDevice: (roomId, device, value) =>
    withMockFallback(
      () => patch(`/api/admin/rooms/${roomId}/devices`, { device, value }),
      async () => ({ ok: true, roomId, device, value })
    ),

  updateRoomThresholds: (roomId, thresholds) =>
    withMockFallback(
      () => patch(`/api/admin/rooms/${roomId}/thresholds`, { thresholds }),
      async () => ({ ok: true, roomId, thresholds })
    ),

  restartRoomDevice: (roomId, device) =>
    withMockFallback(
      () => post(`/api/admin/rooms/${roomId}/devices/${device}/restart`, {}),
      async () => ({ ok: true, roomId, device })
    ),

  setProfessorOverride: (roomId, enabled) =>
    withMockFallback(
      () => patch(`/api/admin/rooms/${roomId}/professor-override`, { enabled }),
      async () => ({ ok: true, roomId, enabled })
    ),

  getSessionTimeline: (sessionId) =>
    withMockFallback(
      () => get(`/api/admin/sessions/${sessionId}/timeline`),
      () => getMockSessionTimeline(sessionId)
    ),

  getIncidents: () =>
    withMockFallback(
      () => get('/api/admin/incidents'),
      () => getMockIncidents()
    ),

  assignIncident: (incidentId, assignee) =>
    withMockFallback(
      () => patch(`/api/admin/incidents/${incidentId}/assign`, { assignee }),
      () => updateMockIncident(incidentId, { assignedTo: assignee })
    ),

  resolveIncident: (incidentId) =>
    withMockFallback(
      () => patch(`/api/admin/incidents/${incidentId}/resolve`, {}),
      () => updateMockIncident(incidentId, { status: 'resolved' })
    ),

  addIncidentNote: (incidentId, note) =>
    withMockFallback(
      () => post(`/api/admin/incidents/${incidentId}/notes`, { note }),
      () => addMockIncidentNote(incidentId, note)
    ),

  getAttendanceIntelligence: () =>
    withMockFallback(
      () => get('/api/admin/attendance-intelligence'),
      () => getMockAttendanceIntelligence()
    ),

  getHealthDashboard: () =>
    withMockFallback(
      () => get('/api/admin/health-dashboard'),
      () => getMockHealthDashboard()
    ),

  getRules: () =>
    withMockFallback(
      () => get('/api/admin/rules'),
      () => getMockRules()
    ),

  createRule: (rule) =>
    withMockFallback(
      () => post('/api/admin/rules', rule),
      () => createMockRule(rule)
    ),

  updateRule: (ruleId, patchBody) =>
    withMockFallback(
      () => patch(`/api/admin/rules/${ruleId}`, patchBody),
      () => updateMockRule(ruleId, patchBody)
    ),

  deleteRule: (ruleId) =>
    withMockFallback(
      () => del(`/api/admin/rules/${ruleId}`),
      () => deleteMockRule(ruleId)
    ),

  simulateRule: (rule) =>
    withMockFallback(
      () => post('/api/admin/rules/simulate', rule),
      () => simulateMockRule(rule)
    ),

  getAuditLogs: (params = {}) =>
    withMockFallback(
      () => get('/api/admin/audit-logs', { params }),
      () => getMockAuditLogs(params)
    ),
}

