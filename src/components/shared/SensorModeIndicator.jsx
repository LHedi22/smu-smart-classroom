import { Wifi, WifiOff, FlaskConical, Radio, Loader2, AlertTriangle } from 'lucide-react'

const STATUS_CONFIG = {
  connected:  { dot: 'bg-green-500',  text: 'text-green-700',  label: 'Connected',       banner: null },
  connecting: { dot: 'bg-amber-400',  text: 'text-amber-600',  label: 'Connecting',      banner: null },
  stale:      { dot: 'bg-orange-400', text: 'text-orange-600', label: 'Sensor offline',  banner: 'No sensor data received in the last 60 seconds. Readings shown may be outdated.' },
  offline:    { dot: 'bg-gray-400',   text: 'text-gray-500',   label: 'Offline',         banner: null },
  error:      { dot: 'bg-red-500',    text: 'text-red-600',    label: 'Error',           banner: 'Could not connect to the sensor broker.' },
}

/**
 * @param {{ mode: 'mock'|'live', status: string, onToggle: () => void }} props
 */
export default function SensorModeIndicator({ mode, status, onToggle }) {
  const cfg    = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline
  const isMock = mode === 'mock'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-xs font-medium select-none">
        {/* Mode icon */}
        {isMock
          ? <FlaskConical size={13} className="text-purple-500 shrink-0" />
          : status === 'connecting'
            ? <Loader2 size={13} className="text-amber-500 animate-spin shrink-0" />
            : status === 'connected'
              ? <Wifi size={13} className="text-green-600 shrink-0" />
              : status === 'stale'
                ? <AlertTriangle size={13} className="text-orange-500 shrink-0" />
                : <WifiOff size={13} className="text-gray-400 shrink-0" />
        }

        {/* Mode label */}
        <span className="text-gray-600">{isMock ? 'Mock' : 'Live'}</span>

        {/* Status dot + label */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={cfg.text}>{cfg.label}</span>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="ml-1 px-2 py-0.5 rounded bg-white border border-surface-border text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
          title={`Switch to ${isMock ? 'live' : 'mock'} mode`}
        >
          <Radio size={11} className="inline mr-0.5" />
          {isMock ? 'Go live' : 'Use mock'}
        </button>
      </div>

      {/* Stale / error banner — only shown when there's an actionable message */}
      {cfg.banner && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-700">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          {cfg.banner}
        </div>
      )}
    </div>
  )
}
