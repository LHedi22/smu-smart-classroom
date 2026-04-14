import { useState } from 'react'
import HistoryFilters  from '../components/history/HistoryFilters'
import SessionList     from '../components/history/SessionList'
import AttendanceTrend from '../components/history/AttendanceTrend'
import EmptyState      from '../components/shared/EmptyState'
import LoadingSpinner  from '../components/shared/LoadingSpinner'
import { useSessionHistory } from '../hooks/useSessionHistory'

export default function History() {
  const [filter, setFilter] = useState({ search: '', from: '', to: '' })
  const { sessions, loading, error } = useSessionHistory({
    dateRange: filter.from || filter.to
      ? { from: filter.from || undefined, to: filter.to || undefined }
      : undefined,
  })

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-[min(1120px,100%)] flex-col gap-6">
        <h1 className="text-[2rem] font-semibold leading-tight text-[color:var(--fg-default)]">Session History</h1>
        <EmptyState
          title="Unable to load session history"
          description={error.message || 'Check the Flask API and Moodle connection, then reload the page.'}
        />
      </div>
    )
  }

  const filtered = sessions.filter(s => {
    if (filter.search && !(s.courseName ?? s.courseId).toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  return (
    <div className="mx-auto flex w-full max-w-[min(1120px,100%)] flex-col gap-6">
      <h1 className="text-[2rem] font-semibold leading-tight text-[color:var(--fg-default)]">Session History</h1>
      <AttendanceTrend sessions={sessions} />
      <HistoryFilters filter={filter} setFilter={setFilter} />
      <SessionList sessions={filtered} />
    </div>
  )
}
