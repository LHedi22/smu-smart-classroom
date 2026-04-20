import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { auth } from '../firebase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export default function Settings() {
  const navigate = useNavigate()
  const [thresholds, setThresholds] = useState({
    tempWarn: 26, tempCrit: 32,
    humWarn: 60,  humCrit: 75,
    co2Warn: 700, co2Crit: 1000,
    noiseWarn: 65, noiseCrit: 80,
  })

  const handleSignOut = async () => {
    if (!USE_MOCK) await signOut(auth)
    navigate('/login')
  }

  const Field = ({ label, field }) => (
    <label className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type="number"
        value={thresholds[field]}
        onChange={e => setThresholds(t => ({ ...t, [field]: Number(e.target.value) }))}
        className="bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm
                   text-gray-700 w-24 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20
                   transition-colors text-right font-mono"
      />
    </label>
  )

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-800">Settings</h1>

      {/* Thresholds */}
      <div className="card flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">Sensor Thresholds</p>
        <div className="flex flex-col gap-3 divide-y divide-surface-border">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium pt-2">Temperature (°C)</p>
            <Field label="Warn above"     field="tempWarn" />
            <Field label="Critical above" field="tempCrit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium pt-3">Humidity (%)</p>
            <Field label="Warn above"     field="humWarn" />
            <Field label="Critical above" field="humCrit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium pt-3">CO₂ (ppm)</p>
            <Field label="Warn above"     field="co2Warn" />
            <Field label="Critical above" field="co2Crit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium pt-3">Noise (dB)</p>
            <Field label="Warn above"     field="noiseWarn" />
            <Field label="Critical above" field="noiseCrit" />
          </div>
        </div>
        <button className="btn-primary mt-2">Save thresholds</button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600
                   border border-red-200 hover:bg-red-100 transition-colors text-sm w-fit font-medium"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  )
}
