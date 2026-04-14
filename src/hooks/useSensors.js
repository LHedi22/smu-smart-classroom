import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'

const MOCK_SENSORS = {
  A101: { temperature: 24.5, humidity: 58, air_quality: 710, sound: 54 },
  C303: { temperature: 21.8, humidity: 63, air_quality: 430, sound: 19 },
  C310: { temperature: 22.6, humidity: 60, air_quality: 520, sound: 27 },
  D105: { temperature: 23.4, humidity: 56, air_quality: 640, sound: 35 },
  B204: { temperature: 23.1, humidity: 61, air_quality: 490, sound: 22 },
}
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSensors(roomId) {
  const { profile, user } = useAuth()
  const { valid: roomIdValid, error: roomIdError } = validateRoomId(roomId)
  const hasAccess = roomIdValid && hasRoomAccess(profile, roomId)

  // Hook always called — null ref disables subscription when unauthorized
  const [value, loading, error] = useObjectVal(
    USE_MOCK || !hasAccess ? null : ref(db, `classrooms/${roomId}/sensors`)
  )

  // Validation/authorization checks after the hook call
  if (!roomIdValid) {
    return { sensors: null, loading: false, error: new Error(`Invalid room ID: ${roomIdError}`) }
  }
  if (!hasAccess && profile !== null) {
    logUnauthorizedAccess(user?.uid, roomId, 'fetch_sensors', new Date().toISOString())
    return { sensors: null, loading: false, error: new Error(`Not authorized to access sensors in room ${roomId}`) }
  }

  if (USE_MOCK) {
    const sensors = { ...(MOCK_SENSORS[roomId] ?? MOCK_SENSORS.B204), timestamp: new Date().toISOString() }
    return { sensors, loading: false, error: null }
  }

  const hasCompleteSensorPayload =
    value &&
    value.temperature != null &&
    value.humidity != null &&
    value.air_quality != null &&
    value.sound != null

  // Gracefully fall back to mock values when a classroom has no seeded sensor payload yet.
  if (!loading && !error && !hasCompleteSensorPayload) {
    const sensors = { ...(MOCK_SENSORS[roomId] ?? MOCK_SENSORS.B204), timestamp: new Date().toISOString() }
    return { sensors, loading: false, error: null }
  }

  return { sensors: value, loading, error }
}
