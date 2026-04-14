import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'

const MOCK_ALERTS = {
  A101: {
    'alert_001': { type: 'warn', message: 'CO₂ elevated — 710 ppm',               timestamp: '2026-04-02T09:22:00', read: false },
    'alert_002': { type: 'ok',   message: 'Temperature normalised — 22°C',         timestamp: '2026-04-02T09:11:00', read: true  },
    'alert_003': { type: 'info', message: 'Session started — 32 students enrolled', timestamp: '2026-04-02T09:00:00', read: true  },
  },
  C303: {},
  B204: {},
}
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useAlerts(roomId) {
  const { profile, user } = useAuth()
  const { valid: roomIdValid, error: roomIdError } = validateRoomId(roomId)
  const hasAccess = roomIdValid && hasRoomAccess(profile, roomId)

  // Hook always called — null ref disables subscription when unauthorized
  const [data, loading, error] = useObjectVal(
    USE_MOCK || !hasAccess ? null : ref(db, `classrooms/${roomId}/alerts`)
  )

  if (!roomIdValid) {
    return { alerts: [], loading: false, error: new Error(`Invalid room ID: ${roomIdError}`) }
  }

  if (!hasAccess && profile !== null) {
    logUnauthorizedAccess(user?.uid, roomId, 'fetch_alerts', new Date().toISOString())
    return { alerts: [], loading: false, error: new Error(`Not authorized to access alerts for room ${roomId}`) }
  }

  const source = USE_MOCK ? (MOCK_ALERTS[roomId] ?? {}) : data
  const alerts = source
    ? Object.entries(source)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : []

  return { alerts, loading: USE_MOCK ? false : loading, error: USE_MOCK ? null : error }
}
