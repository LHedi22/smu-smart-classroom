import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { auth, db } from '../firebase'
import { ref, update } from 'firebase/database'
import { useAuth } from '../context/AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [thresholds, setThresholds] = useState({
    tempWarn: 26, tempCrit: 32,
    humWarn: 60,  humCrit: 75,
    co2Warn: 700, co2Crit: 1000,
    noiseWarn: 65, noiseCrit: 80,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleSignOut = async () => {
    if (!USE_MOCK) await signOut(auth)
    navigate('/login')
  }

  const handleSave = async () => {
    if (USE_MOCK || !user) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }
    setSaving(true)
    try {
      await update(ref(db, `professors/${user.uid}/settings`), { thresholds })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('[Settings] Failed to save thresholds:', err)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, field }) => (
    <label className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <input
        type="number"
        value={thresholds[field]}
        onChange={e => setThresholds(t => ({ ...t, [field]: Number(e.target.value) }))}
        className="bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5 text-sm
                   text-slate-200 w-24 outline-none focus:border-brand/50 transition-colors text-right font-mono"
      />
    </label>
  )

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-100">Settings</h1>

      {/* Thresholds */}
      <div className="card flex flex-col gap-4">
        <p className="text-sm font-medium text-slate-300">Sensor Thresholds</p>
        <div className="flex flex-col gap-3 divide-y divide-surface-border">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 pt-2">Temperature (°C)</p>
            <Field label="Warn above"     field="tempWarn" />
            <Field label="Critical above" field="tempCrit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 pt-3">Humidity (%)</p>
            <Field label="Warn above"     field="humWarn" />
            <Field label="Critical above" field="humCrit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 pt-3">CO₂ (ppm)</p>
            <Field label="Warn above"     field="co2Warn" />
            <Field label="Critical above" field="co2Crit" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 pt-3">Noise (dB)</p>
            <Field label="Warn above"     field="noiseWarn" />
            <Field label="Critical above" field="noiseCrit" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-2">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save thresholds'}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400
                   border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm w-fit"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  )
}
