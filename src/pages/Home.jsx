import { useMoodleCourses } from '../hooks/useMoodleCourses'
import TodaySchedule from '../components/home/TodaySchedule'
import QuickStats    from '../components/home/QuickStats'

export default function Home() {
  const { courses, loading, error } = useMoodleCourses()

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Today's Schedule</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      {error && (
        <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm p-3">
          Firebase error: {error.message ?? String(error)}
        </div>
      )}
      <QuickStats courses={courses} />
      <TodaySchedule courses={courses} loading={loading} />
    </div>
  )
}
