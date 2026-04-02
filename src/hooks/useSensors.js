import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'

const MOCK_SENSORS = {
  A101: { temperature: 24.5, humidity: 58, air_quality: 710, sound: 54 },
  C303: { temperature: 21.8, humidity: 63, air_quality: 430, sound: 19 },
  B204: { temperature: 23.1, humidity: 61, air_quality: 490, sound: 22 },
}
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSensors(roomId) {
  const [value, loading, error] = useObjectVal(
    USE_MOCK ? null : ref(db, `classrooms/${roomId}/sensors`)
  )
  if (USE_MOCK) {
    const sensors = { ...(MOCK_SENSORS[roomId] ?? MOCK_SENSORS.B204), timestamp: new Date().toISOString() }
    return { sensors, loading: false, error: null }
  }
  return { sensors: value, loading, error }
}
