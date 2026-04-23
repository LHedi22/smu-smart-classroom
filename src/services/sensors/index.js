import { mockSensorService } from './mockSensorService'
import { liveSensorService, getSensorService } from './liveSensorService'
import { SENSOR_MODE } from '../../config'

export { mockSensorService, liveSensorService, getSensorService }

// Derived from VITE_DATA_SOURCE — use this instead of reading env vars directly
export const envMode = SENSOR_MODE

/**
 * Returns the active service for the given mode string and optional room.
 * @param {'mock' | 'live'} mode
 * @param {string} [roomId]
 */
export function getService(mode, roomId) {
  return mode === 'live' ? getSensorService(roomId ?? 'default') : mockSensorService
}
