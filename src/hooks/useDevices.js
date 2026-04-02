import { ref, set } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useState } from 'react'

const MOCK_DEVICES = {
  A101: { ac: true,  lights_main: true,  lights_board: true,  fan: false },
  C303: { ac: false, lights_main: false, lights_board: false, fan: false },
  B204: { ac: false, lights_main: true,  lights_board: false, fan: false },
}
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useDevices(roomId) {
  const [mockDevices, setMockDevices] = useState(MOCK_DEVICES[roomId] ?? MOCK_DEVICES.B204)

  const [devices, loading, error] = useObjectVal(
    USE_MOCK ? null : ref(db, `classrooms/${roomId}/devices`)
  )

  const toggleDevice = (deviceKey, value) => {
    if (USE_MOCK) {
      setMockDevices(prev => ({ ...prev, [deviceKey]: value }))
      return Promise.resolve()
    }
    return set(ref(db, `classrooms/${roomId}/devices/${deviceKey}`), value)
  }

  if (USE_MOCK) return { devices: mockDevices, loading: false, error: null, toggleDevice }
  return { devices, loading, error, toggleDevice }
}
