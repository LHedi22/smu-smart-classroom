function deriveWsUrl() {
  const enableRealtime = import.meta.env.VITE_ADMIN_REALTIME === 'true'
  if (!enableRealtime) return ''

  const explicit = import.meta.env.VITE_ADMIN_WS_URL
  if (explicit) return explicit

  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (!apiBase) return ''

  const base = apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  return `${base.replace(/\/$/, '')}/ws/admin`
}

export function createAdminSocket({ topic, onEvent, onStatus }) {
  const wsUrl = deriveWsUrl()
  if (!wsUrl) {
    onStatus?.('disabled')
    return () => {}
  }

  let socket = null
  let closedByClient = false
  let retryCount = 0
  let retryTimeout = null

  const connect = () => {
    socket = new WebSocket(wsUrl)
    onStatus?.('connecting')

    socket.onopen = () => {
      retryCount = 0
      onStatus?.('connected')
      socket.send(JSON.stringify({ type: 'subscribe', topic }))
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        onEvent?.(payload)
      } catch {
        onEvent?.({ type: 'raw', data: event.data })
      }
    }

    socket.onerror = () => {
      onStatus?.('error')
    }

    socket.onclose = () => {
      if (closedByClient) return
      onStatus?.('reconnecting')
      retryCount += 1
      const waitMs = Math.min(1000 * 2 ** retryCount, 15_000)
      retryTimeout = setTimeout(connect, waitMs)
    }
  }

  connect()

  return () => {
    closedByClient = true
    clearTimeout(retryTimeout)
    if (socket && socket.readyState <= 1) {
      socket.close()
    }
  }
}

