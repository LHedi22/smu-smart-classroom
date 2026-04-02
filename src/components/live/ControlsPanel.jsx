import RelayToggle from './RelayToggle'
import LoadingSpinner from '../shared/LoadingSpinner'

const RELAYS = [
  { key: 'ac',           label: 'Air Conditioning' },
  { key: 'lights_main',  label: 'Main Lights' },
  { key: 'lights_board', label: 'Board Light' },
  { key: 'fan',          label: 'Ventilation Fan' },
]

export default function ControlsPanel({ devices, loading, toggleDevice }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Controls</h2>
      <div className="card divide-y divide-surface-border">
        {loading ? (
          <LoadingSpinner />
        ) : (
          RELAYS.map(r => (
            <RelayToggle
              key={r.key}
              label={r.label}
              deviceKey={r.key}
              checked={devices?.[r.key] ?? false}
              onToggle={toggleDevice}
            />
          ))
        )}
      </div>
    </section>
  )
}
