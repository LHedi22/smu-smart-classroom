import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../../firebase'
import axios from 'axios'
import { CheckCircle, AlertCircle, XCircle, Clock, Activity, Database, Flame, Radio } from 'lucide-react'

const FLASK_URL  = import.meta.env.VITE_FLASK_URL
const REFRESH_MS = 10_000

// ── Status helpers ──────────────────────────────────────────────
const STATUS_STYLE = {
  ok:       { icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-500/10',  label: 'Healthy' },
  disabled: { icon: CheckCircle, color: 'text-slate-400',  bg: 'bg-slate-500/10',  label: 'Disabled' },
  degraded: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Degraded' },
  idle:     { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Idle' },
  missing:  { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Missing' },
  unknown:  { icon: AlertCircle, color: 'text-slate-400',  bg: 'bg-slate-500/10',  label: 'Unknown' },
  down:     { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-500/10',    label: 'Down' },
}

function StatusPill({ status }) {
  const cfg = STATUS_STYLE[status] ?? STATUS_STYLE.unknown
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function formatDuration(seconds) {
  if (seconds == null) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

// ── Data fetching ────────────────────────────────────────────────
function useHealthPolling() {
  const [health, setHealth]   = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      try {
        const [h, m] = await Promise.all([
          axios.get(`${FLASK_URL}/health`,  { timeout: 5000, validateStatus: () => true }),
          axios.get(`${FLASK_URL}/metrics`, { timeout: 5000 }),
        ])
        if (!cancelled) {
          setHealth(h.data)
          setMetrics(m.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to reach Flask')
      }
    }
    fetchAll()
    const iv = setInterval(fetchAll, REFRESH_MS)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  return { health, metrics, error }
}

function useCollectorHeartbeat() {
  const [hb, setHb] = useState(null)
  useEffect(() => {
    if (!db) return
    const unsub = onValue(ref(db, '/system/collector'), snap => {
      setHb(snap.exists() ? snap.val() : null)
    })
    return () => unsub()
  }, [])
  return hb
}

// ── Sub-components ───────────────────────────────────────────────
function HealthCard({ health, error }) {
  if (error) {
    return (
      <div className="card border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 mb-2">
          <XCircle size={18} className="text-red-500" />
          <h3 className="font-medium text-red-300">Flask unreachable</h3>
        </div>
        <p className="text-xs text-red-400 font-mono">{error}</p>
      </div>
    )
  }
  if (!health) {
    return <div className="card"><p className="text-sm text-slate-500">Loading…</p></div>
  }

  const checks = health.checks ?? {}
  const overall = health.status

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-medium text-slate-200">
          <Activity size={16} className="text-brand" />
          Server Health
        </h3>
        <StatusPill status={overall} />
      </div>
      <div className="space-y-2 text-sm">
        {Object.entries(checks).map(([name, c]) => (
          <div key={name} className="flex items-center justify-between py-1.5 border-b border-surface-border last:border-0">
            <div className="flex items-center gap-2 text-slate-300">
              {name === 'db'         && <Database size={13} className="text-slate-500" />}
              {name === 'firebase'   && <Flame size={13} className="text-slate-500" />}
              {name === 'collector'  && <Radio size={13} className="text-slate-500" />}
              <span className="capitalize">{name}</span>
              {c.detail && <span className="text-xs text-slate-500">· {c.detail}</span>}
            </div>
            <StatusPill status={c.status} />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Uptime {formatDuration(health.uptime_s)} · refreshed every {REFRESH_MS / 1000}s
      </p>
    </div>
  )
}

function CollectorCard({ hb }) {
  if (!hb) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Radio size={16} className="text-slate-500" />
          <h3 className="font-medium text-slate-300">MQTT Collector</h3>
        </div>
        <p className="text-xs text-slate-500">No heartbeat received. Collector may not be running or Firebase is not configured.</p>
      </div>
    )
  }

  const lastSeenAgo = hb.lastSeen ? Math.floor((Date.now() - hb.lastSeen) / 1000) : null
  const alive = lastSeenAgo != null && lastSeenAgo < 30
  const rooms = hb.rooms ?? {}

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-medium text-slate-200">
          <Radio size={16} className="text-brand" />
          MQTT Collector
        </h3>
        <StatusPill status={alive ? 'ok' : 'down'} />
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs text-slate-500">Uptime</p>
          <p className="font-mono text-slate-200">{formatDuration(hb.uptimeSeconds)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Messages</p>
          <p className="font-mono text-slate-200">{(hb.messagesReceived ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Rooms</p>
          <p className="font-mono text-slate-200">{hb.roomsActive ?? 0}</p>
        </div>
      </div>
      {Object.keys(rooms).length > 0 && (
        <div className="border-t border-surface-border pt-3 space-y-1.5">
          {Object.entries(rooms).map(([roomId, info]) => {
            const silent = info.secondsSilent ?? 0
            const roomStatus = silent < 60 ? 'ok' : silent < 180 ? 'idle' : 'down'
            return (
              <div key={roomId} className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">{roomId}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    {(info.sensorsSeen ?? []).join(', ') || 'no sensors'}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    {silent}s silent
                  </span>
                  <StatusPill status={roomStatus} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MetricsCard({ metrics }) {
  if (!metrics) {
    return <div className="card"><p className="text-sm text-slate-500">Loading metrics…</p></div>
  }
  const routes = (metrics.routes ?? []).slice(0, 12)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-medium text-slate-200">
          <Activity size={16} className="text-brand" />
          Top API Routes
        </h3>
        <span className="text-xs text-slate-500">uptime {formatDuration(metrics.uptime_s)}</span>
      </div>
      {routes.length === 0 ? (
        <p className="text-sm text-slate-500">No traffic yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-slate-500 border-b border-surface-border">
            <tr>
              <th className="text-left py-2 font-normal">Route</th>
              <th className="text-right py-2 font-normal">Count</th>
              <th className="text-right py-2 font-normal">4xx</th>
              <th className="text-right py-2 font-normal">5xx</th>
              <th className="text-right py-2 font-normal">p50</th>
              <th className="text-right py-2 font-normal">p95</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.route} className="border-b border-surface-border last:border-0">
                <td className="py-1.5 font-mono text-slate-300 truncate max-w-xs">{r.route}</td>
                <td className="py-1.5 text-right text-slate-300">{r.count}</td>
                <td className={`py-1.5 text-right ${r.errors_4xx > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{r.errors_4xx}</td>
                <td className={`py-1.5 text-right ${r.errors_5xx > 0 ? 'text-red-400' : 'text-slate-500'}`}>{r.errors_5xx}</td>
                <td className="py-1.5 text-right text-slate-400">{r.p50_ms}ms</td>
                <td className="py-1.5 text-right text-slate-400">{r.p95_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────
export default function SystemHealth() {
  const { health, metrics, error } = useHealthPolling()
  const hb = useCollectorHeartbeat()

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">System Health</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Live view of server, MQTT collector, and API traffic. Auto-refresh every {REFRESH_MS / 1000}s.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthCard health={health} error={error} />
        <CollectorCard hb={hb} />
      </div>

      <MetricsCard metrics={metrics} />
    </div>
  )
}
