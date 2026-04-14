export default function HistoryFilters({ filter, setFilter }) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--fg-muted)]">
          Search
          <input
            type="text"
            placeholder="Search course"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            className="field text-sm"
          />
        </label>
        <label className="flex min-w-40 flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--fg-muted)]">
          From
          <input
            type="date"
            value={filter.from}
            onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
            className="field text-sm"
          />
        </label>
        <label className="flex min-w-40 flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--fg-muted)]">
          To
          <input
            type="date"
            value={filter.to}
            onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
            className="field text-sm"
          />
        </label>
      </div>
    </section>
  )
}
