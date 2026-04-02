export default function RelayToggle({ label, deviceKey, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onToggle(deviceKey, !checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none
          ${checked ? 'bg-brand' : 'bg-surface-border'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
