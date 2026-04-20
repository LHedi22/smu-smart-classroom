import { useNavigate }         from 'react-router-dom'
import { MapPin, Radio, ArrowRight } from 'lucide-react'
import { useMoodleCourses }     from '../hooks/useMoodleCourses'
import { useUpcomingSessions }  from '../hooks/useUpcomingSessions'
import TodaySchedule            from '../components/home/TodaySchedule'
import QuickStats               from '../components/home/QuickStats'
import RoomsGrid                from '../components/home/RoomsGrid'

function UpcomingCard({ session }) {
  const navigate = useNavigate()
  const isLive   = session.status === 'live'
  const dayLabel = new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  return (
    <button
      onClick={() => navigate(`/session/${session.roomId}`)}
      className="card flex items-center gap-4 text-left hover:border-brand/30 transition-colors w-full"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isLive && <Radio size={11} className="text-brand animate-pulse" />}
          <span className={`text-xs font-medium ${isLive ? 'text-brand' : 'text-gray-500'}`}>
            {isLive ? 'Live now' : dayLabel}
          </span>
          <span className="text-xs text-gray-400 font-mono">{session.startTime}–{session.endTime}</span>
        </div>
        <p className="text-gray-800 font-medium truncate">{session.courseName ?? session.courseId}</p>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
          <MapPin size={11} />{session.roomId}
          <span className="ml-1 text-gray-300">·</span>
          <span className="ml-1">{session.type}</span>
        </div>
      </div>
      <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
    </button>
  )
}

export default function Home() {
  const { courses, totalEnrolled, loading, error } = useMoodleCourses()
  const { sessions: upcoming, loading: upLoading } = useUpcomingSessions()

  const liveSessions   = upcoming.filter(s => s.status === 'live')
  const futureSessions = upcoming.filter(s => s.status === 'upcoming')

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Today's Schedule</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-600 text-sm p-3">
          Could not reach Flask API. Is it running?
        </div>
      )}

      <QuickStats courses={courses} totalEnrolled={totalEnrolled} />
      <TodaySchedule courses={courses} loading={loading} />
      <RoomsGrid />

      {!upLoading && (liveSessions.length > 0 || futureSessions.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {liveSessions.length > 0 ? 'Live & Upcoming' : 'Upcoming Sessions'}
          </h2>
          {[...liveSessions, ...futureSessions].map(s => (
            <UpcomingCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}
