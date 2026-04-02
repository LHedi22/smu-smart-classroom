export default function HistoryFilters({ filter, setFilter }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        placeholder="Search course…"
        value={filter.search}
        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        className="bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5 text-sm
                   text-slate-200 placeholder-slate-600 outline-none focus:border-brand/50 transition-colors w-48"
      />
      <input
        type="date"
        value={filter.from}
        onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
        className="bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5 text-sm
                   text-slate-400 outline-none focus:border-brand/50 transition-colors"
      />
      <span className="text-slate-600 text-sm">to</span>
      <input
        type="date"
        value={filter.to}
        onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
        className="bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5 text-sm
                   text-slate-400 outline-none focus:border-brand/50 transition-colors"
      />
    </div>
  )
}
