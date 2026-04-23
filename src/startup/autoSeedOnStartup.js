import { SEED_ON_STARTUP } from '../config'

const REQUEST_TIMEOUT_MS = 20000

function getSeedEndpoint() {
  const base = (import.meta.env.VITE_FLASK_URL ?? '').trim().replace(/\/+$/, '')
  return base ? `${base}/api/dev/seed-startup` : '/api/dev/seed-startup'
}

export async function runAutoSeedOnStartup() {
  if (import.meta.env.PROD || !SEED_ON_STARTUP) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(getSeedEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggeredAt: new Date().toISOString() }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      console.warn('[startup-seed] failed:', response.status, body)
      return
    }

    const payload = await response.json().catch(() => null)
    if (payload?.status === 'ok') {
      console.info('[startup-seed] complete', payload)
    } else {
      console.warn('[startup-seed] unexpected response', payload)
    }
  } catch (err) {
    console.warn('[startup-seed] request error:', err?.message ?? err)
  } finally {
    clearTimeout(timeout)
  }
}
