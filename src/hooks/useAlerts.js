import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { USE_MOCK_SESSIONS as USE_MOCK } from '../config'

const MOCK_ALERTS = {
  A101: {
    'alert_001': { type: 'warn', message: 'CO₂ elevated — 710 ppm',               timestamp: '2026-04-02T09:22:00', read: false },
    'alert_002': { type: 'ok',   message: 'Temperature normalised — 22°C',         timestamp: '2026-04-02T09:11:00', read: true  },
    'alert_003': { type: 'info', message: 'Session started — 32 students enrolled', timestamp: '2026-04-02T09:00:00', read: true  },
  },
  C303: {},
  B204: {},
}

export function useAlerts(roomId) {
  const [data, loading, error] = useObjectVal(
    USE_MOCK ? null : ref(db, `classrooms/${roomId}/alerts`)
  )

  const source = USE_MOCK ? (MOCK_ALERTS[roomId] ?? {}) : data
  const alerts = source
    ? Object.entries(source)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : []

  return { alerts, loading: USE_MOCK ? false : loading, error: USE_MOCK ? null : error }
}
