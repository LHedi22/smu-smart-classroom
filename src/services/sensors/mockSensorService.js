/**
 * @typedef {'normal' | 'warning' | 'critical'} SensorStatus
 * @typedef {{ value: number, unit: string, status: SensorStatus }} SensorReading
 * @typedef {{ temperature: SensorReading, co2: SensorReading, humidity: SensorReading, lastUpdated: string, source: 'mock' | 'live' }} SensorData
 */

const INITIAL = { temperature: 23.5, co2: 650, humidity: 52 }

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function delta(range) {
  return (Math.random() - 0.5) * 2 * range
}

function tempStatus(v) {
  return v > 30 ? 'critical' : v >= 26 ? 'warning' : 'normal'
}
function co2Status(v) {
  return v > 1500 ? 'critical' : v >= 1000 ? 'warning' : 'normal'
}
function humidityStatus(v) {
  return v > 70 ? 'critical' : v >= 60 ? 'warning' : 'normal'
}

function buildPayload(state) {
  return {
    temperature: { value: +state.temperature.toFixed(1), unit: '°C', status: tempStatus(state.temperature) },
    co2:         { value: Math.round(state.co2),          unit: 'ppm', status: co2Status(state.co2) },
    humidity:    { value: +state.humidity.toFixed(1),     unit: '%',   status: humidityStatus(state.humidity) },
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  }
}

class MockSensorService {
  #state = { ...INITIAL }
  #listeners = new Set()
  #intervalId = null

  #tick() {
    this.#state = {
      temperature: clamp(this.#state.temperature + delta(0.4), 18, 30),
      co2:         clamp(this.#state.co2         + delta(30),  400, 1800),
      humidity:    clamp(this.#state.humidity     + delta(1.5), 30, 70),
    }
    const payload = buildPayload(this.#state)
    this.#listeners.forEach(fn => fn(payload))
  }

  /**
   * @param {(data: SensorData) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(callback) {
    this.#listeners.add(callback)
    callback(buildPayload(this.#state))   // emit current snapshot immediately

    if (!this.#intervalId) {
      // random interval 3–5 s per tick
      const schedule = () => {
        this.#intervalId = setTimeout(() => {
          this.#tick()
          if (this.#listeners.size > 0) schedule()
          else this.#intervalId = null
        }, 3000 + Math.random() * 2000)
      }
      schedule()
    }

    return () => {
      this.#listeners.delete(callback)
      if (this.#listeners.size === 0 && this.#intervalId) {
        clearTimeout(this.#intervalId)
        this.#intervalId = null
      }
    }
  }

  getStatus() { return 'connected' }
  getSource() { return 'mock' }
}

export const mockSensorService = new MockSensorService()
