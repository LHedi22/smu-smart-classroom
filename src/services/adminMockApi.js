import { countOpenIncidents } from '../utils/incidentUtils'

const wait = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms))

function statusFromValue(value, warn, critical) {
  if (value >= critical) return 'critical'
  if (value >= warn) return 'warning'
  return 'ok'
}

function buildRooms() {
  const rooms = ['A101', 'B204', 'C303', 'C310', 'D105', 'E208', 'F305', 'G112']
  return rooms.map((roomId, idx) => {
    const attendancePct = 55 + ((idx * 9) % 43)
    const co2 = 420 + idx * 70
    const temperature = 21 + (idx % 6)
    return {
      roomId,
      campusId: idx < 4 ? 'north' : 'south',
      buildingId: idx < 4 ? 'engineering' : 'science',
      status: statusFromValue(co2, 800, 1100),
      attendancePct,
      activeSession: {
        sessionId: `SESS-${roomId}-LIVE`,
        courseName: idx % 2 === 0 ? 'Operating Systems' : 'Data Science',
        professor: idx % 2 === 0 ? 'Dr. Ben Salah' : 'Dr. Trabelsi',
      },
      studentsPresent: Math.round((attendancePct / 100) * 34),
      sensors: { temperature, humidity: 42 + idx, co2 },
      devices: {
        camera: idx % 5 !== 0 ? 'online' : 'degraded',
        sensors: 'online',
        ac: idx % 2 === 0,
        lights: idx % 3 !== 0,
      },
    }
  })
}

function buildTimeline() {
  const base = Date.now() - 1000 * 60 * 50
  return Array.from({ length: 40 }, (_, i) => {
    const t = new Date(base + i * 75_000)
    const pool = ['entry', 'exit', 'alert', 'environment']
    const type = pool[i % pool.length]
    return {
      id: `evt-${i + 1}`,
      timestamp: t.toISOString(),
      type,
      student: type === 'entry' || type === 'exit' ? `STU-${100 + i}` : null,
      label:
        type === 'entry' ? 'Student entered classroom'
          : type === 'exit' ? 'Student exited classroom'
            : type === 'alert' ? 'CO2 threshold alert'
              : 'Environment updated',
      severity: type === 'alert' ? (i % 3 === 0 ? 'critical' : 'warning') : 'info',
      anomaly: type === 'alert' || i % 17 === 0,
      values: {
        co2: 500 + (i % 10) * 60,
        temperature: 21 + (i % 7),
        humidity: 45 + (i % 8),
      },
    }
  })
}

const mockDb = {
  rules: [
    {
      id: 'rule-1',
      enabled: true,
      condition: { field: 'co2', operator: '>', value: 900 },
      action: { type: 'toggle_device', target: 'ventilation', value: 'on' },
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule-2',
      enabled: true,
      condition: { field: 'session_status', operator: '=', value: 'none' },
      action: { type: 'toggle_device', target: 'lights', value: 'off' },
      updatedAt: new Date().toISOString(),
    },
  ],
  incidents: Array.from({ length: 8 }, (_, i) => ({
    id: `inc-${i + 1}`,
    title: i % 2 === 0 ? 'High CO2 detected' : 'Camera heartbeat missing',
    roomId: i % 2 === 0 ? 'C303' : 'A101',
    priority: i % 3 === 0 ? 'critical' : i % 2 === 0 ? 'high' : 'medium',
    status: i % 4 === 0 ? 'resolved' : 'open',
    assignedTo: i % 3 === 0 ? 'ops-admin@smu.tn' : '',
    notes: [],
    createdAt: new Date(Date.now() - i * 1000 * 60 * 18).toISOString(),
  })),
}

export async function getMockCommandCenterSnapshot() {
  await wait()
  const rooms = buildRooms()
  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      activeSessions: rooms.length,
      totalStudentsPresent: rooms.reduce((sum, room) => sum + room.studentsPresent, 0),
      alerts: countOpenIncidents(mockDb.incidents),
    },
    rooms,
  }
}

export async function getMockDrilldown({ campusId, buildingId, roomId, sessionId }) {
  await wait()
  const rooms = buildRooms()
  const campuses = [
    { id: 'north', name: 'North Campus', buildings: 1 },
    { id: 'south', name: 'South Campus', buildings: 1 },
  ]
  const buildings = [
    { id: 'engineering', campusId: 'north', name: 'Engineering Block', rooms: 4 },
    { id: 'science', campusId: 'south', name: 'Science Block', rooms: 4 },
  ]
  const sessions = Array.from({ length: 4 }, (_, i) => ({
    sessionId: `SESS-${roomId ?? 'A101'}-${i + 1}`,
    courseName: i % 2 === 0 ? 'Operating Systems' : 'Embedded Systems',
    professor: i % 2 === 0 ? 'Dr. Ben Salah' : 'Dr. Trabelsi',
    attendancePct: 65 + i * 7,
    startTime: `2026-04-2${i}T08:30:00.000Z`,
    status: i === 0 ? 'live' : 'past',
  }))
  const students = Array.from({ length: 12 }, (_, i) => ({
    studentId: `STU-${1000 + i}`,
    name: `Student ${i + 1}`,
    presence: i % 5 === 0 ? 'late' : 'present',
    risk: i % 6 === 0 ? 'high' : 'low',
  }))

  return {
    generatedAt: new Date().toISOString(),
    level: studentIdFromSession(sessionId) ? 'student' : sessionId ? 'session' : roomId ? 'room' : buildingId ? 'building' : campusId ? 'campus' : 'root',
    summary: {
      activeSessions: rooms.length,
      avgAttendance: Math.round(rooms.reduce((sum, room) => sum + room.attendancePct, 0) / rooms.length),
      criticalAlerts: rooms.filter(room => room.status === 'critical').length,
    },
    campuses,
    buildings: buildings.filter(building => !campusId || building.campusId === campusId),
    rooms: rooms.filter(room => (!campusId || room.campusId === campusId) && (!buildingId || room.buildingId === buildingId)),
    sessions: roomId ? sessions : [],
    students: sessionId ? students : [],
  }
}

function studentIdFromSession(sessionId) {
  return typeof sessionId === 'string' && sessionId.includes('-STU-')
}

export async function getMockRoomControl(roomId) {
  await wait()
  const now = Date.now()
  const history = Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(now - (19 - i) * 60_000).toISOString(),
    temperature: 22 + ((i * 3) % 5),
    humidity: 44 + ((i * 2) % 11),
    co2: 550 + ((i * 80) % 700),
  }))
  return {
    roomId,
    currentSession: {
      sessionId: `SESS-${roomId}-LIVE`,
      courseName: 'Distributed Systems',
      professor: 'Dr. Trabelsi',
      attendancePct: 81,
      status: 'live',
    },
    sensors: history,
    devices: {
      camera: 'online',
      sensors: 'online',
      ac: true,
      lights: true,
      ventilation: false,
      professorOverride: true,
    },
    thresholds: { co2: 950, temperature: 28, humidity: 70 },
  }
}

export async function getMockSessionTimeline() {
  await wait()
  return { events: buildTimeline() }
}

export async function getMockIncidents() {
  await wait()
  return { incidents: mockDb.incidents }
}

export async function updateMockIncident(incidentId, patch) {
  await wait(80)
  mockDb.incidents = mockDb.incidents.map(incident => incident.id === incidentId ? { ...incident, ...patch } : incident)
  return { ok: true }
}

export async function addMockIncidentNote(incidentId, note) {
  await wait(80)
  mockDb.incidents = mockDb.incidents.map(incident =>
    incident.id === incidentId
      ? { ...incident, notes: [...(incident.notes ?? []), { text: note, createdAt: new Date().toISOString() }] }
      : incident
  )
  return { ok: true }
}

export async function getMockAttendanceIntelligence() {
  await wait()
  return {
    lateness: Array.from({ length: 10 }, (_, i) => ({
      studentId: `STU-${200 + i}`,
      name: `Student ${i + 1}`,
      lateCount: 2 + (i % 5),
    })),
    earlyExits: Array.from({ length: 8 }, (_, i) => ({
      studentId: `STU-${500 + i}`,
      name: `Student ${i + 1}`,
      earlyExitCount: 1 + (i % 4),
    })),
    trend: Array.from({ length: 8 }, (_, i) => ({
      week: `W${i + 1}`,
      attendancePct: 72 + (i % 3) * 5 + i,
      anomalies: i % 3,
    })),
    anomalies: [
      { id: 'an-1', title: 'Repeated late arrivals in C303 morning sessions', severity: 'high' },
      { id: 'an-2', title: 'Sudden attendance drop in A101 after week 5', severity: 'medium' },
    ],
  }
}

export async function getMockHealthDashboard() {
  await wait()
  return {
    generatedAt: new Date().toISOString(),
    uptime: { sensors: 99.1, cameras: 97.8 },
    apiResponseTimes: [
      { name: '/sessions', p50: 120, p95: 310 },
      { name: '/classrooms', p50: 95, p95: 260 },
      { name: '/alerts', p50: 140, p95: 360 },
    ],
    eventDelays: Array.from({ length: 10 }, (_, i) => ({
      minute: `${i}m`,
      delayMs: 80 + (i % 4) * 60,
    })),
  }
}

export async function getMockRules() {
  await wait()
  return { rules: mockDb.rules }
}

export async function createMockRule(rule) {
  await wait(80)
  const next = { ...rule, id: `rule-${Date.now()}`, updatedAt: new Date().toISOString() }
  mockDb.rules = [next, ...mockDb.rules]
  return { rule: next }
}

export async function updateMockRule(ruleId, patch) {
  await wait(80)
  mockDb.rules = mockDb.rules.map(rule => rule.id === ruleId ? { ...rule, ...patch, updatedAt: new Date().toISOString() } : rule)
  return { ok: true }
}

export async function deleteMockRule(ruleId) {
  await wait(80)
  mockDb.rules = mockDb.rules.filter(rule => rule.id !== ruleId)
  return { ok: true }
}

export async function simulateMockRule(rule) {
  await wait(120)
  return {
    matched: Math.random() > 0.35,
    summary: `Condition ${rule?.condition?.field ?? 'unknown'} ${rule?.condition?.operator ?? '?'} ${rule?.condition?.value ?? '?'} evaluated against last stream sample.`,
    actionPreview: `${rule?.action?.type ?? 'action'} on ${rule?.action?.target ?? 'target'} = ${rule?.action?.value ?? 'value'}`,
  }
}

export async function getMockAuditLogs(query = {}) {
  await wait()
  const actions = ['toggle_ac', 'update_threshold', 'assign_incident', 'resolve_incident', 'create_rule']
  const logs = Array.from({ length: 40 }, (_, i) => ({
    id: `audit-${i + 1}`,
    actor: i % 2 === 0 ? 'ops-admin@smu.tn' : 'security-admin@smu.tn',
    action: actions[i % actions.length],
    target: i % 2 === 0 ? `room:A10${i % 3}` : `incident:inc-${(i % 8) + 1}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 9).toISOString(),
    before: { value: i % 2 === 0 ? 'off' : 'open' },
    after: { value: i % 2 === 0 ? 'on' : 'resolved' },
  }))

  const text = (query.search ?? '').trim().toLowerCase()
  const filtered = text
    ? logs.filter(log => `${log.actor} ${log.action} ${log.target}`.toLowerCase().includes(text))
    : logs

  return { logs: filtered }
}

