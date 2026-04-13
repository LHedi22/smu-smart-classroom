import { useState, useEffect } from 'react'
import {
  getSystemHealth,
  getFullReport,
  checkProfessors,
  checkCourses,
  checkAssignments,
  checkSessions,
} from '../../utils/adminDiagnostics'
import { runFullCleanup } from '../../utils/dataCleanup'

const SEVERITY_COLORS = {
  critical: 'bg-red-900/20 border-red-500/50 text-red-300',
  high: 'bg-orange-900/20 border-orange-500/50 text-orange-300',
  medium: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300',
  low: 'bg-blue-900/20 border-blue-500/50 text-blue-300',
}

const SEVERITY_BADGE = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
}

export default function AdminDebugger() {
  const [health, setHealth] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [tab, setTab] = useState('overview')
  const [expandedSection, setExpandedSection] = useState(null)

  useEffect(() => {
    loadDiagnostics()
  }, [])

  async function loadDiagnostics() {
    setLoading(true)
    try {
      const [h, r] = await Promise.all([getSystemHealth(), getFullReport()])
      setHealth(h)
      setReport(r)
    } catch (err) {
      console.error('Diagnostics error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCleanup() {
    if (!window.confirm('Fix all detected data issues? This cannot be undone.')) {
      return
    }

    setCleaning(true)
    try {
      const result = await runFullCleanup(health)
      console.log('Cleanup result:', result)
      // Refresh diagnostics after cleanup
      setTimeout(loadDiagnostics, 1000)
    } catch (err) {
      console.error('Cleanup error:', err)
      alert(`Cleanup error: ${err.message}`)
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="mt-2 text-slate-300">Loading diagnostics...</p>
      </div>
    )
  }

  if (!health) {
    return <div className="p-6 text-red-400">Failed to load diagnostics</div>
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Debugger Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={loadDiagnostics}
            disabled={cleaning}
            className="px-4 py-2 bg-brand/20 border border-brand/50 rounded-lg text-sm text-brand hover:bg-brand/30 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          {health?.issueCount > 0 && (
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="px-4 py-2 bg-orange-900/20 border border-orange-500/50 rounded-lg text-sm text-orange-300 hover:bg-orange-900/30 disabled:opacity-50"
            >
              {cleaning ? '🔧 Cleaning...' : `🔧 Fix ${health.issueCount} Issues`}
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard label="System Status" value={health.status.toUpperCase()} status={health.status} />
        <StatusCard label="Issues Found" value={health.issueCount} status={health.issueCount === 0 ? 'healthy' : 'unhealthy'} />
        <StatusCard label="Professors" value={health.professors.count} />
        <StatusCard label="Courses" value={health.courses.count} />
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-border flex gap-4">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'issues', label: '⚠️ Issues' },
          { id: 'professors', label: '👨‍🏫 Professors' },
          { id: 'courses', label: '📚 Courses' },
          { id: 'assignments', label: '🔗 Assignments' },
          { id: 'sessions', label: '📅 Sessions' },
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
          <Section
            title="🎯 System Health"
            expanded={expandedSection === 'health'}
            onClick={() => setExpandedSection(expandedSection === 'health' ? null : 'health')}
          >
            <div className="space-y-2 text-sm">
              <Line label="Database" value={health.database.connected ? '✅ Connected' : '❌ Disconnected'} />
              <Line label="Last Check" value={health.timestamp} />
              <Line label="Professors" value={`${health.professors.count} total`} />
              <Line label="Courses" value={`${health.courses.count} total`} />
              <Line label="Sessions" value={`${health.sessions.count} total`} />
              <Line label="Consistency Score" value={`${health.assignments.consistencyScore?.toFixed(1) || 'N/A'}%`} />
            </div>
          </Section>

          {report?.recommendations && report.recommendations.length > 0 && (
            <Section
              title={`💡 Recommendations (${report.recommendations.length})`}
              expanded={expandedSection === 'rec'}
              onClick={() => setExpandedSection(expandedSection === 'rec' ? null : 'rec')}
            >
              <div className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className={`p-3 rounded border ${SEVERITY_COLORS[rec.severity]}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">{SEVERITY_BADGE[rec.severity]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{rec.message}</p>
                        <p className="text-xs opacity-75">{rec.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Issues Tab */}
      {tab === 'issues' && (
        <div className="space-y-4">
          {health.data.issues.length > 0 && (
            <Section title="🗂️ Database Issues">
              {health.data.issues.map((issue, i) => (
                <Issue key={i} severity="high" message={issue} />
              ))}
            </Section>
          )}
          {health.professors.issues.length > 0 && (
            <Section title="👨‍🏫 Professor Issues">
              {health.professors.issues.map((issue, i) => (
                <Issue key={i} severity="high" message={issue} />
              ))}
            </Section>
          )}
          {health.courses.issues.length > 0 && (
            <Section title="📚 Course Issues">
              {health.courses.issues.map((issue, i) => (
                <Issue key={i} severity="high" message={issue} />
              ))}
            </Section>
          )}
          {health.assignments.issues.length > 0 && (
            <Section title="🔗 Assignment Issues">
              {health.assignments.issues.map((issue, i) => (
                <Issue key={i} severity="medium" message={issue} />
              ))}
            </Section>
          )}
          {health.sessions.issues.length > 0 && (
            <Section title="📅 Session Issues">
              {health.sessions.issues.map((issue, i) => (
                <Issue key={i} severity="medium" message={issue} />
              ))}
            </Section>
          )}
          {Object.values(health).every(h => !h.issues || h.issues.length === 0) && (
            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded text-green-300 text-center">
              ✅ No issues detected
            </div>
          )}
        </div>
      )}

      {/* Professors Tab */}
      {tab === 'professors' && (
        <Section title={`👨‍🏫 Professors (${health.professors.count})`} defaultExpanded={true}>
          {health.professors.problems?.map((prof, i) => (
            <ProblemItem
              key={i}
              title={`${prof.name} (${prof.uid})`}
              issues={prof.issues}
              severity="medium"
            />
          ))}
          {!health.professors.problems?.length && <p className="text-slate-400 text-sm">No problems found</p>}
        </Section>
      )}

      {/* Courses Tab */}
      {tab === 'courses' && (
        <Section title={`📚 Courses (${health.courses.count})`} defaultExpanded={true}>
          {health.courses.problems?.map((course, i) => (
            <ProblemItem
              key={i}
              title={`${course.code} - ${course.courseId}`}
              issues={course.issues}
              severity="high"
            />
          ))}
          {!health.courses.problems?.length && <p className="text-slate-400 text-sm">No problems found</p>}
        </Section>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          {health.assignments.orphanedCourses?.length > 0 && (
            <Section title={`⚠️ Orphaned Courses (${health.assignments.orphanedCourses.length})`}>
              {health.assignments.orphanedCourses.map((c, i) => (
                <div key={i} className="p-2 bg-red-900/10 rounded text-sm text-red-300 border border-red-500/30">
                  <strong>{c.courseId}</strong>: assigned to non-existent professor {c.professorUid}
                </div>
              ))}
            </Section>
          )}
          {health.assignments.orphanedRooms?.length > 0 && (
            <Section title={`⚠️ Orphaned Rooms (${health.assignments.orphanedRooms.length})`}>
              {health.assignments.orphanedRooms.map((r, i) => (
                <div key={i} className="p-2 bg-yellow-900/10 rounded text-sm text-yellow-300 border border-yellow-500/30">
                  <strong>Prof {r.profUid.slice(0, 8)}...</strong>: has room {r.roomId} but no course assigned
                </div>
              ))}
            </Section>
          )}
          {health.assignments.mismatches?.length > 0 && (
            <Section title={`⚠️ Mismatches (${health.assignments.mismatches.length})`}>
              {health.assignments.mismatches.map((m, i) => (
                <div key={i} className="p-2 bg-orange-900/10 rounded text-sm text-orange-300 border border-orange-500/30">
                  <strong>{m.courseId}</strong>: professor missing room {m.room} in assignedRooms
                </div>
              ))}
            </Section>
          )}
          <div className="text-sm text-slate-400">
            <p>Consistency Score: <strong>{health.assignments.consistencyScore?.toFixed(1) || 'N/A'}%</strong></p>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {tab === 'sessions' && (
        <Section title={`📅 Sessions (${health.sessions.count})`} defaultExpanded={true}>
          {health.sessions.problems?.slice(0, 10).map((session, i) => (
            <ProblemItem
              key={i}
              title={`${session.courseId} - ${session.sessionId}`}
              issues={session.issues}
              severity="medium"
            />
          ))}
          {!health.sessions.problems?.length && <p className="text-slate-400 text-sm">No problems found</p>}
          {health.sessions.count === 0 && <p className="text-slate-400 text-sm">Sessions generated on-demand</p>}
        </Section>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-500 text-center pt-6 border-t border-surface-border">
        Last updated: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

function StatusCard({ label, value, status }) {
  const bg = status === 'healthy' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'
  const text = status === 'healthy' ? 'text-green-300' : 'text-red-300'
  return (
    <div className={`p-4 rounded-lg border ${bg}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
    </div>
  )
}

function Section({ title, children, expanded, onClick, defaultExpanded }) {
  const isOpen = expanded !== undefined ? expanded : defaultExpanded
  return (
    <div className="bg-surface-raised rounded-lg border border-surface-border">
      <button
        onClick={onClick}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-surface-hover transition"
      >
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <span className="text-xs text-slate-500">{isOpen ? '▼' : '▶'}</span>
      </button>
      {(isOpen || !onClick) && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function ProblemItem({ title, issues, severity }) {
  return (
    <div className={`p-3 rounded border ${SEVERITY_COLORS[severity]}`}>
      <p className="font-medium text-sm mb-1">{title}</p>
      <ul className="text-xs space-y-1 pl-4">
        {issues.map((issue, i) => (
          <li key={i}>• {issue}</li>
        ))}
      </ul>
    </div>
  )
}

function Issue({ severity, message }) {
  return (
    <div className={`p-3 rounded border ${SEVERITY_COLORS[severity]} text-sm`}>
      {SEVERITY_BADGE[severity]} {message}
    </div>
  )
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  )
}
