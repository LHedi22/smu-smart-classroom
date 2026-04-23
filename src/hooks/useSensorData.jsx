import { useState, useEffect, useCallback } from 'react'
import { envMode, getService } from '../services/sensors/index'
import { getSensorService } from '../services/sensors/liveSensorService'

/**
 * Provides live or mock ESP32 sensor data via MQTT or simulated intervals.
 *
 * @param {string} [roomId] - Scopes the live MQTT connection to a specific classroom.
 *
 * Returns:
 *   data        – SensorData | null
 *   mode        – 'mock' | 'live'
 *   status      – 'connected' | 'connecting' | 'stale' | 'offline' | 'error'
 *   toggleMode  – () => void  (switches at runtime without page reload)
 */
export function useSensorData(roomId) {
  const [mode,   setMode]   = useState(envMode)
  const [data,   setData]   = useState(null)
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const service = getService(mode, roomId)
    const unsub = service.subscribe(payload => {
      setData(payload)
      if (mode === 'mock') setStatus('connected')
    })

    let unsubStatus = null
    if (mode === 'live') {
      const liveService = getSensorService(roomId ?? 'default')
      unsubStatus = liveService.onStatus(s => setStatus(s))
    } else {
      setStatus('connected')
    }

    return () => {
      unsub()
      unsubStatus?.()
    }
  }, [mode, roomId])

  const toggleMode = useCallback(() => {
    setData(null)
    setMode(m => (m === 'mock' ? 'live' : 'mock'))
  }, [])

  return { data, mode, status, toggleMode }
}
