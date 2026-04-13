import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../../firebase'

export default function ProfessorViewer() {
  const [professors, setProfessors] = useState([])
  const [selectedProf, setSelectedProf] = useState(null)
  const [profData, setProfData] = useState(null)
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  // Load all professors
  useEffect(() => {
    async function loadProfessors() {
      try {
        const snap = await get(ref(db, 'professors'))
        if (snap.exists()) {
          const profs = Object.entries(snap.val()).map(([uid, v]) => ({
            uid,
            ...v,
          }))
          setProfessors(profs.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading professors:', err)
        setLoading(false)
      }
    }

    loadProfessors()
  }, [])

  // Load selected professor's data
  useEffect(() => {
    if (!selectedProf) return

    async function loadProfData() {
      try {
        // Get professor details
        const profSnap = await get(ref(db, `professors/${selectedProf.uid}`))
        setProfData(profSnap.val())

        // Get professor's courses
        const coursesSnap = await get(ref(db, 'courses'))
        if (coursesSnap.exists()) {
          const allCourses = Object.entries(coursesSnap.val()).map(([id, c]) => ({
            id,
            ...c,
          }))
          // Filter by professorUid or professorId (moodleUserId)
          const profCourses = allCourses.filter(
            c => c.professorUid === selectedProf.uid || c.professorId === selectedProf.moodleUserId
          )
          setCourses(profCourses)
        }

        // Get professor's sessions
        const sessionsSnap = await get(ref(db, 'sessions'))
        if (sessionsSnap.exists()) {
          const allSessions = Object.entries(sessionsSnap.val()).map(([id, s]) => ({
            id,
            ...s,
          }))
          // Filter by professorId (moodleUserId)
          const profSessions = allSessions.filter(
            s => s.professorId === selectedProf.moodleUserId
          )
          setSessions(
            profSessions.sort((a, b) =>
              new Date(b.date) - new Date(a.date)
            )
          )
        }
      } catch (err) {
        console.error('Error loading professor data:', err)
      }
    }

    loadProfData()
  }, [selectedProf])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="mt-2 text-slate-400">Loading professors...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Professor View Inspector</h1>
        <p className="text-sm text-slate-400 mb-4">Select a professor to inspect their courses, schedules, and sessions.</p>
        
        {/* Professor Selector */}
        <div className="flex gap-2 flex-wrap">
          {professors.map(prof => (
            <button
              key={prof.uid}
              onClick={() => setSelectedProf(prof)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedProf?.uid === prof.uid
                  ? 'bg-brand/20 border border-brand/50 text-brand font-medium'
                  : 'bg-surface-raised border border-surface-border text-slate-300 hover:text-slate-200 hover:border-brand/30'
              }`}
            >
              {prof.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Professor View */}
      {selectedProf && profData && (
        <div className="space-y-4 border-t border-surface-border pt-6">
          {/* Header */}
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{profData.name}</h2>
                <div className="mt-2 space-y-1 text-sm text-slate-400">
                  <p>Email: {profData.email}</p>
                  <p>Department: {profData.department || 'N/A'}</p>
                  <p>Moodle ID: {profData.moodleUserId || 'N/A'}</p>
                  <p>Firebase UID: {selectedProf.uid}</p>
                  {profData.assignedRooms && (
                    <p>Assigned Rooms: {Object.keys(profData.assignedRooms).join(', ') || 'None'}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProf(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-surface-border flex gap-4">
            {[
              { id: 'overview', label: '📋 Overview' },
              { id: 'courses', label: `📚 Courses (${courses.length})` },
              { id: 'sessions', label: `📅 Sessions (${sessions.length})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  tab === t.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="card">
                  <p className="text-xs text-slate-500 mb-1">Total Courses</p>
                  <p className="text-2xl font-bold text-slate-100">{courses.length}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-slate-500 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-slate-100">{sessions.length}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-slate-500 mb-1">Assigned Rooms</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {profData.assignedRooms ? Object.keys(profData.assignedRooms).length : 0}
                  </p>
                </div>
              </div>

              {courses.length > 0 && (
                <div className="card">
                  <p className="text-sm font-semibold text-slate-100 mb-3">Recent Courses</p>
                  <div className="space-y-2">
                    {courses.slice(0, 5).map(c => (
                      <div key={c.id} className="text-sm">
                        <p className="text-slate-200">{c.code} - {c.name}</p>
                        <p className="text-xs text-slate-500">ID: {c.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {tab === 'courses' && (
            <div className="space-y-2">
              {courses.length === 0 ? (
                <div className="card text-center text-slate-500 py-6">
                  No courses assigned
                </div>
              ) : (
                courses.map(c => (
                  <div key={c.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100">{c.code} - {c.name}</p>
                        <p className="text-xs text-slate-500 mt-1">ID: {c.id}</p>
                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          <p>Room: {c.room || 'N/A'}</p>
                          <p>Schedule: {c.schedule ? (Array.isArray(c.schedule) ? `${c.schedule.length} slots` : 'Invalid format') : 'None'}</p>
                          <p>Prof UID: {c.professorUid || 'N/A'}</p>
                          <p>Prof ID: {c.professorId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-xs bg-surface-raised rounded px-2 py-1 text-slate-400">
                        {c.professorUid === selectedProf.uid ? '✓ By UID' : c.professorId === selectedProf.moodleUserId ? '✓ By ID' : '?'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="card text-center text-slate-500 py-6">
                  No sessions found
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100">{s.id}</p>
                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          <p>Course: {s.courseId}</p>
                          <p>Room: {s.roomId}</p>
                          <p>Date: {s.date}</p>
                          <p>Time: {s.startTime} - {s.endTime || '?'}</p>
                          <p>Prof ID: {s.professorId}</p>
                        </div>
                      </div>
                      <div className="text-xs bg-green-900/20 border border-green-500/30 rounded px-2 py-1 text-green-300">
                        Generated
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!selectedProf && (
        <div className="card text-center py-12 text-slate-500">
          <p className="text-sm">Select a professor to view their data</p>
        </div>
      )}
    </div>
  )
}
