// Keys here MUST match what collector.py writes to Firebase
// (see smu-flask/collector.py — it publishes temperature, co2, humidity).
// The Pi publisher only emits these three; air_quality and sound were in
// an earlier design and were dropped when the sensor hardware was scoped.
export const SENSORS = [
  {
    key: 'temperature', label: 'Temperature', unit: '°C',
    min: 14, max: 38,
    status: v => v > 32 || v < 18 ? 'critical' : v > 26 ? 'warn' : 'good',
  },
  {
    key: 'humidity', label: 'Humidity', unit: '%',
    min: 0, max: 100,
    status: v => v > 75 || v < 20 ? 'critical' : v > 60 || v < 30 ? 'warn' : 'good',
  },
  {
    key: 'co2', label: 'CO₂', unit: 'ppm',
    min: 300, max: 1400,
    status: v => v > 1000 ? 'critical' : v > 700 ? 'warn' : 'good',
  },
]

export const STATUS_COLORS = {
  good:     { text: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-[#86C057]', border: 'border-green-200' },
  warn:     { text: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-[#FFB700]', border: 'border-amber-200' },
  critical: { text: 'text-red-600',    bg: 'bg-red-50',    bar: 'bg-[#EC0044]', border: 'border-red-200'   },
}
