import mqtt from 'mqtt'

/**
 * @typedef {'connecting' | 'connected' | 'stale' | 'offline' | 'error'} ConnectionStatus
 */

const PI_IP  = import.meta.env.VITE_RASPBERRY_PI_IP ?? '192.168.1.100'
const BROKER = `ws://${PI_IP}:9001`
const STALE_THRESHOLD_MS = 60_000

function topicsForRoom(roomId) {
  return [
    `smu/${roomId}/sensors/temperature`,
    `smu/${roomId}/sensors/co2`,
    `smu/${roomId}/sensors/humidity`,
  ]
}

function tempStatus(v)     { return v > 30 ? 'critical' : v >= 26 ? 'warning' : 'normal' }
function co2Status(v)      { return v > 1500 ? 'critical' : v >= 1000 ? 'warning' : 'normal' }
function humidityStatus(v) { return v > 70 ? 'critical' : v >= 60 ? 'warning' : 'normal' }

class LiveSensorService {
  #roomId          = null
  #client          = null
  #dataListeners   = new Set()
  #statusListeners = new Set()
  #readings        = { temperature: null, co2: null, humidity: null }
  #status          = 'offline'
  #subscriberCount = 0
  #staleTimer      = null

  constructor(roomId) {
    this.#roomId = roomId
  }

  #setStatus(s) {
    if (this.#status === s) return
    this.#status = s
    this.#statusListeners.forEach(fn => fn(s))
  }

  // Reset the watchdog on every incoming data message.
  // If it fires, the connection is up but sensors stopped publishing.
  #resetStaleTimer() {
    clearTimeout(this.#staleTimer)
    this.#staleTimer = setTimeout(() => {
      if (this.#status === 'connected') this.#setStatus('stale')
    }, STALE_THRESHOLD_MS)
  }

  #emit() {
    const { temperature, co2, humidity } = this.#readings
    if (!temperature || !co2 || !humidity) return

    const payload = {
      temperature: { value: temperature, unit: '°C',  status: tempStatus(temperature) },
      co2:         { value: co2,         unit: 'ppm', status: co2Status(co2) },
      humidity:    { value: humidity,    unit: '%',   status: humidityStatus(humidity) },
      lastUpdated: new Date().toISOString(),
      source: 'live',
    }
    this.#dataListeners.forEach(fn => fn(payload))
  }

  #connect() {
    if (this.#client) return
    this.#setStatus('connecting')

    this.#client = mqtt.connect(BROKER, {
      reconnectPeriod: 5000,
      connectTimeout:  10000,
    })

    this.#client.on('connect', () => {
      this.#setStatus('connected')
      topicsForRoom(this.#roomId).forEach(t => this.#client.subscribe(t))
      this.#resetStaleTimer()
    })

    this.#client.on('message', (topic, message) => {
      try {
        const { value } = JSON.parse(message.toString())
        if (topic.endsWith('temperature')) this.#readings.temperature = +value
        else if (topic.endsWith('co2'))    this.#readings.co2         = +value
        else if (topic.endsWith('humidity')) this.#readings.humidity  = +value
        // Data arrived — sensor is alive, reset stale watchdog and restore connected status
        if (this.#status === 'stale') this.#setStatus('connected')
        this.#resetStaleTimer()
        this.#emit()
      } catch {
        // malformed payload — skip silently
      }
    })

    this.#client.on('error',     () => { clearTimeout(this.#staleTimer); this.#setStatus('error') })
    this.#client.on('offline',   () => { clearTimeout(this.#staleTimer); this.#setStatus('offline') })
    this.#client.on('reconnect', () => { clearTimeout(this.#staleTimer); this.#setStatus('connecting') })
  }

  #disconnect() {
    clearTimeout(this.#staleTimer)
    this.#staleTimer = null
    this.#client?.end(true)
    this.#client = null
    this.#readings = { temperature: null, co2: null, humidity: null }
    this.#setStatus('offline')
  }

  /**
   * @param {(data: import('./mockSensorService').SensorData) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(callback) {
    this.#dataListeners.add(callback)
    this.#subscriberCount++
    if (this.#subscriberCount === 1) this.#connect()

    return () => {
      this.#dataListeners.delete(callback)
      this.#subscriberCount--
      if (this.#subscriberCount === 0) this.#disconnect()
    }
  }

  /**
   * Subscribe to connection-status changes only.
   * @param {(status: ConnectionStatus) => void} callback
   * @returns {() => void} unsubscribe
   */
  onStatus(callback) {
    this.#statusListeners.add(callback)
    callback(this.#status)
    return () => this.#statusListeners.delete(callback)
  }

  getStatus() { return this.#status }
  getSource() { return 'live' }
}

// Per-room singleton cache — one MQTT client per classroom
const _roomServices = new Map()

export function getSensorService(roomId) {
  if (!_roomServices.has(roomId)) {
    _roomServices.set(roomId, new LiveSensorService(roomId))
  }
  return _roomServices.get(roomId)
}

// Legacy default export kept for components that don't have a roomId context yet
export const liveSensorService = getSensorService('default')
