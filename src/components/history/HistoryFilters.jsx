export default function HistoryFilters({ filter, setFilter }) {
  const inputClass = `bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm
                      text-gray-700 placeholder-gray-300 outline-none
                      focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors`
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        placeholder="Search course…"
        value={filter.search}
        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        className={`${inputClass} w-48`}
      />
      <input
        type="date"
        value={filter.from}
        onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
        className={inputClass}
      />
      <span className="text-gray-300 text-sm">to</span>
      <input
        type="date"
        value={filter.to}
        onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
        className={inputClass}
      />
    </div>
  )
}
