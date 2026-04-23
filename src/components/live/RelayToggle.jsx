import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function RelayToggle({ label, deviceKey, checked, onToggle }) {
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState(null)

  const handleToggle = async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await onToggle(deviceKey, !checked)
    } catch {
      setError('Failed to update device')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex flex-col">
        <span className="text-sm text-gray-700">{label}</span>
        {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
      </div>

      <button
        role="switch"
        aria-checked={checked}
        disabled={pending}
        onClick={handleToggle}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none
          disabled:opacity-60
          ${checked ? 'bg-brand' : 'bg-gray-200'}`}
      >
        {pending
          ? <Loader2 size={12} className="absolute inset-0 m-auto text-white animate-spin" />
          : <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        }
      </button>
    </div>
  )
}
