import { useParams, useLocation } from 'react-router-dom'
import { MapPin, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import SensorCard from '../components/live/SensorCard'
import { SENSORS } from '../utils/sensorStatus'
import { useSessionDetail } from '../hooks/useSessionDetail'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Mirrors the fallback values in useSensors — shown when Firebase has no sensor payload for a room
const ROOM_DEFAULTS = {
  A101: { temperature: 24.5, humidity: 58, air_quality: 710, sound: 54 },
  C303: { temperature: 21.8, humidity: 63, air_quality: 430, sound: 19 },
  C310: { temperature: 22.6, humidity: 60, air_quality: 520, sound: 27 },
  D105: { temperature: 23.4, humidity: 56, air_quality: 640, sound: 35 },
  B204: { temperature: 23.1, humidity: 61, air_quality: 490, sound: 22 },
}

export default function SessionDetail() {
  const { sessionId } = useParams()
  const { state } = useLocation()
  const { session, loading } = useSessionDetail(sessionId, state?.session)

  // Read live sensor data — null ref is a no-op (React Firebase hooks convention).
  // Called unconditionally before any early returns to satisfy React hook rules.
  const [liveSensors] = useObjectVal(
    !USE_MOCK && db && session?.roomId
      ? ref(db, `classrooms/${session.roomId}/sensors`)
      : null
  )

  if (loading) return <LoadingSpinner />

  if (!session) return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-3 py-20">
      <AlertCircle size={32} className="text-gray-400" />
      <p className="text-gray-500">Session not found.</p>
    </div>
  )

  const startTime = session.startTime?.slice(11, 16) ?? session.startTime
  const endTime   = session.endTime?.slice(11, 16)   ?? session.endTime

  // Student list — only present on Firebase-saved sessions (from AttendanceReview)
  const studentsMap  = session.attendance?.students ?? null
  const studentsList = studentsMap ? Object.entries(studentsMap) : null
  const enrolled     = session.attendance?.enrolled ?? null
  const presentCount = studentsList ? studentsList.filter(([, s]) => s.present).length : null

  // Resolve sensor data in priority order:
  //  1. Saved snapshot  — sessions closed after the sensor-snapshot feature was added
  //  2. Live Firebase   — current readings if the professor has room access
  //  3. Room defaults   — same fallback useSensors uses; ensures values always display
  const hasLive = liveSensors?.temperature != null
  let sensorData  = null
  let sensorLabel = 'Room Environment'
  if (session.envSummary?.temperature != null) {
    sensorData  = session.envSummary
    sensorLabel = 'Environment at Session End'
  } else if (hasLive) {
    sensorData  = liveSensors
    sensorLabel = 'Current Room Environment'
  } else if (session.roomId) {
    sensorData  = ROOM_DEFAULTS[session.roomId] ?? ROOM_DEFAULTS.B204
    sensorLabel = 'Room Environment'
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-800">{session.courseName}</h1>
          {session.type && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-raised text-gray-500 border border-surface-border">
              {session.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
          <span className="flex items-center gap-1"><MapPin size={13} />{session.roomId}</span>
          <span>{session.date} · {startTime}–{endTime}</span>
          {session.courseId && (
            <span className="text-gray-400">{session.courseId}</span>
          )}
          {session.moodleSynced && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={13} />Synced
            </span>
          )}
        </div>
      </div>

      {/* Attendance rate */}
      <div className="card">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Attendance</p>
        <p className="text-3xl font-bold text-gray-800">
          {session.attendanceRate != null ? `${Math.round(session.attendanceRate)}%` : '—'}
        </p>
        {enrolled != null && (
          <p className="text-sm text-gray-500 mt-1">
            {presentCount} / {enrolled} students present
          </p>
        )}
      </div>

      {/* Sensor grid — always rendered when roomId is known */}
      {sensorData && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{sensorLabel}</p>
          <div className="grid grid-cols-2 gap-3">
            {SENSORS.map(s => (
              <SensorCard key={s.key} sensorKey={s.key} value={sensorData[s.key] ?? null} />
            ))}
          </div>
        </div>
      )}

      {/* Student list — only when Firebase attendance data exists */}
      {studentsList && (
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={12} />Students
          </p>
          <div className="flex flex-col divide-y divide-surface-border">
            {studentsList
              .sort(([, a], [, b]) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map(([id, s]) => (
                <div key={id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-gray-700">{s.name ?? id}</p>
                    {s.entryTime && (
                      <p className="text-xs text-gray-400 mt-0.5">Entry {s.entryTime}</p>
                    )}
                    {s.manualOverride && s.overrideNote && (
                      <p className="text-xs text-amber-600 mt-0.5">Note: {s.overrideNote}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.present
                      ? 'bg-green-50 text-green-700'
                      : 'bg-surface-raised text-gray-400'
                  }`}>
                    {s.present ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  )
}
