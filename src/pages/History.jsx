import { useState } from 'react'
import HistoryFilters  from '../components/history/HistoryFilters'
import SessionList     from '../components/history/SessionList'
import AttendanceTrend from '../components/history/AttendanceTrend'
import LoadingSpinner  from '../components/shared/LoadingSpinner'
import { useSessionHistory } from '../hooks/useSessionHistory'

export default function History() {
  const [filter, setFilter] = useState({ search: '', from: '', to: '' })
  const { sessions, loading } = useSessionHistory({
    dateRange: filter.from || filter.to
      ? { from: filter.from || undefined, to: filter.to || undefined }
      : undefined,
  })

  if (loading) return <LoadingSpinner />

  const filtered = sessions.filter(s => {
    if (filter.search && !(s.courseName ?? s.courseId).toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-100">Session History</h1>
      <AttendanceTrend sessions={sessions} />
      <HistoryFilters filter={filter} setFilter={setFilter} />
      <SessionList sessions={filtered} />
    </div>
  )
}
