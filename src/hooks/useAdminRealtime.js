import { useEffect, useState } from 'react'
import { createAdminSocket } from '../services/adminSocket'

export function useAdminRealtime({ topic, enabled = true, onEvent }) {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!enabled || !topic) return

    const cleanup = createAdminSocket({
      topic,
      onEvent,
      onStatus: setStatus,
    })

    return cleanup
  }, [enabled, topic, onEvent])

  return { status }
}

