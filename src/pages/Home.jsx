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
      className="card flex w-full items-center gap-4 rounded-[14px] text-left transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isLive && <Radio size={11} className="animate-pulse text-[color:var(--accent-brand)]" />}
          <span className={`text-xs font-medium ${isLive ? 'text-[color:var(--accent-brand)]' : 'text-[color:var(--fg-muted)]'}`}>
            {isLive ? 'Live now' : dayLabel}
          </span>
          <span className="font-mono text-xs text-[color:var(--fg-muted)]/80">{session.startTime}–{session.endTime}</span>
        </div>
        <p className="truncate font-semibold text-[color:var(--fg-default)]">{session.courseName ?? session.courseId}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--fg-muted)]">
          <MapPin size={11} />{session.roomId}
          <span className="ml-1 text-[color:var(--fg-muted)]/80">·</span>
          <span className="ml-1">{session.type}</span>
        </div>
      </div>
      <ArrowRight size={14} className="flex-shrink-0 text-[color:var(--fg-muted)]" />
    </button>
  )
}

export default function Home() {
  const { courses, loading, error }       = useMoodleCourses()
  const { sessions: upcoming, loading: upLoading } = useUpcomingSessions()

  // Separate live from upcoming so live sessions always appear first
  const liveSessions     = upcoming.filter(s => s.status === 'live')
  const futureSessions   = upcoming.filter(s => s.status === 'upcoming')

  return (
    <div className="mx-auto flex w-full max-w-[min(1120px,100%)] flex-col gap-6">
      <div>
        <h1 className="text-[2rem] font-semibold leading-tight text-[color:var(--fg-default)]">Today&apos;s Schedule</h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {error && (
        <div className="card border-[color:var(--accent-danger)]/35 bg-[color:var(--accent-danger)]/10 p-3 text-sm text-[color:var(--accent-danger)]">
          Flask API unreachable — schedule data unavailable.
          Run <code className="rounded bg-[color:var(--accent-danger)]/20 px-1 py-0.5 font-mono text-xs">npm run dev:all</code> to start both servers.
        </div>
      )}

      <QuickStats courses={courses} />
      <TodaySchedule courses={courses} loading={loading} />
      <RoomsGrid />

      {/* ── Upcoming Sessions (next 14 days) ── */}
      {!upLoading && (liveSessions.length > 0 || futureSessions.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">
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
