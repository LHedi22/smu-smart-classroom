import SessionCard from './SessionCard'
import EmptyState from '../shared/EmptyState'
import LoadingSpinner from '../shared/LoadingSpinner'
import { CalendarDays } from 'lucide-react'

export default function TodaySchedule({ courses, loading }) {
  if (loading) return <LoadingSpinner />
  if (!courses.length) return (
    <EmptyState icon={<CalendarDays size={32} />} title="No sessions today" description="Your schedule is clear for today." />
  )
  return (
    <div className="flex flex-col gap-3">
      {courses.map(c => <SessionCard key={c.id} course={c} />)}
    </div>
  )
}
