// Central configuration derived from environment variables.
// Import from here instead of reading import.meta.env directly in components.

const raw = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

// 'mock'  – fully offline: simulated sensors + hardcoded session data
// 'live'  – fully online: real MQTT sensors + real Firebase sessions
// 'demo'  – hybrid: real Firebase sessions + simulated sensors, bypasses session ownership check
export const DATA_SOURCE = ['mock', 'live', 'demo'].includes(raw) ? raw : 'mock'

export const IS_MOCK = DATA_SOURCE === 'mock'
export const IS_LIVE = DATA_SOURCE === 'live'
export const IS_DEMO = DATA_SOURCE === 'demo'

// Sensor layer: mock service when 'mock' or 'demo', live MQTT only when 'live'
export const SENSOR_MODE = IS_LIVE ? 'live' : 'mock'

// Session layer: use hardcoded mock sessions only in full mock mode
export const USE_MOCK_SESSIONS = IS_MOCK

// Demo mode bypasses session-ownership check so a professor can open any room
export const BYPASS_SESSION_OWNERSHIP = IS_DEMO

// Dev/test bootstrap seeding toggle.
export const SEED_ON_STARTUP = import.meta.env.VITE_SEED_ON_STARTUP === 'true'
