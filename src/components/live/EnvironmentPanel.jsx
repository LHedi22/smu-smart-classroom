import SensorCard from './SensorCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import { SENSORS } from '../../utils/sensorStatus'

export default function EnvironmentPanel({ sensors, loading }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Environment</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {SENSORS.map(s => (
            <SensorCard key={s.key} sensorKey={s.key} value={sensors?.[s.key] ?? null} />
          ))}
        </div>
      )}
    </section>
  )
}
