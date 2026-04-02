import { useState } from 'react'
import HistoryFilters  from '../components/history/HistoryFilters'
import SessionList     from '../components/history/SessionList'
import AttendanceTrend from '../components/history/AttendanceTrend'
import LoadingSpinner  from '../components/shared/LoadingSpinner'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { useProfessor } from '../context/AuthContext'

export default function History() {
  const { professor } = useProfessor()
  const { sessions, loading } = useSessionHistory(professor?.uid)
  const [filter, setFilter] = useState({ search: '', from: '', to: '' })

  if (loading) return <LoadingSpinner />

  const filtered = sessions.filter(s => {
    if (filter.search && !s.courseName.toLowerCase().includes(filter.search.toLowerCase())) return false
    if (filter.from && s.date < filter.from) return false
    if (filter.to   && s.date > filter.to)   return false
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
