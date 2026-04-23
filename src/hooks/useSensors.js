import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'

// Flat shape matching what `useSensors` returns to the rest of the app.
// Keys align with SENSORS in utils/sensorStatus.js and collector.py's writes.
const MOCK_SENSORS = {
  A101: { temperature: 24.5, humidity: 58, co2: 710 },
  C303: { temperature: 21.8, humidity: 63, co2: 430 },
  C310: { temperature: 22.6, humidity: 60, co2: 520 },
  D105: { temperature: 23.4, humidity: 56, co2: 640 },
  B204: { temperature: 23.1, humidity: 61, co2: 490 },
}
import { USE_MOCK_SESSIONS } from '../config'

export function useSensors(roomId) {
  const { profile, user } = useAuth()
  
  // Validate room ID format
  const { valid: roomIdValid, error: roomIdError } = validateRoomId(roomId)
  if (!roomIdValid) {
    return {
      sensors: null,
      loading: false,
      error: new Error(`Invalid room ID: ${roomIdError}`)
    }
  }
  
  // Check authorization: does professor have access to this room?
  if (!hasRoomAccess(profile, roomId)) {
    logUnauthorizedAccess(user?.uid, roomId, 'fetch_sensors', new Date().toISOString())
    return {
      sensors: null,
      loading: false,
      error: new Error(`Not authorized to access sensors in room ${roomId}`)
    }
  }
  
  // Authorization passed: fetch the data
  const [value, loading, error] = useObjectVal(
    USE_MOCK_SESSIONS ? null : ref(db, `classrooms/${roomId}/sensors`)
  )
  
  if (USE_MOCK_SESSIONS) {
    const sensors = { ...(MOCK_SENSORS[roomId] ?? MOCK_SENSORS.B204), timestamp: new Date().toISOString() }
    return { sensors, loading: false, error: null }
  }
  
  // collector.py writes each sensor as { value, unit, status }. Before that
  // it was a flat number. Accept both so we don't break on older seeded data.
  const readNumber = (entry) =>
    entry == null ? null :
    typeof entry === 'number' ? entry :
    typeof entry?.value === 'number' ? entry.value :
    null

  const flat = value ? {
    temperature: readNumber(value.temperature),
    humidity:    readNumber(value.humidity),
    co2:         readNumber(value.co2),
    timestamp:   value.timestamp ?? new Date().toISOString(),
  } : null

  const hasCompleteSensorPayload =
    flat &&
    flat.temperature != null &&
    flat.humidity    != null &&
    flat.co2         != null

  // In real mode, gracefully fall back to mock values when a classroom has no seeded sensor payload yet.
  if (!loading && !error && !hasCompleteSensorPayload) {
    const sensors = { ...(MOCK_SENSORS[roomId] ?? MOCK_SENSORS.B204), timestamp: new Date().toISOString() }
    return { sensors, loading: false, error: null }
  }

  return { sensors: flat, loading, error }
}
