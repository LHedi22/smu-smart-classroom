import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell         from './components/layout/AppShell'
import Login            from './pages/Login'
import NotApproved      from './pages/NotApproved'
import Home             from './pages/Home'
import LiveSession      from './pages/LiveSession'
import AttendanceReview from './pages/AttendanceReview'
import History          from './pages/History'
import SessionDetail    from './pages/SessionDetail'
import StudentProfile   from './pages/StudentProfile'
import Settings         from './pages/Settings'
import LoadingSpinner   from './components/shared/LoadingSpinner'
import ErrorBoundary    from './components/shared/ErrorBoundary'
import AdminLayout      from './pages/admin/AdminLayout'
import AdminProfessors  from './pages/admin/AdminProfessors'
import AdminCourses     from './pages/admin/AdminCourses'
import AdminAssign      from './pages/admin/AdminAssign'
import AdminDebugger    from './pages/admin/AdminDebugger'
import ProfessorViewer  from './pages/admin/ProfessorViewer'
import SystemHealth     from './pages/admin/SystemHealth'
import AdminCommandCenter from './pages/admin/AdminCommandCenter'
import AdminDrilldown from './pages/admin/AdminDrilldown'
import AdminRoomControl from './pages/admin/AdminRoomControl'
import AdminSessionTimeline from './pages/admin/AdminSessionTimeline'
import AdminIncidents from './pages/admin/AdminIncidents'
import AdminAttendanceIntelligence from './pages/admin/AdminAttendanceIntelligence'
import AdminRuleEngine from './pages/admin/AdminRuleEngine'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminOpsHealth from './pages/admin/AdminOpsHealth'

function ProfessorRoute({ children }) {
  const { status } = useAuth()
  if (status === 'loading')         return <LoadingSpinner fullScreen />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'not-approved')    return <Navigate to="/not-approved" replace />
  if (status === 'admin')           return <Navigate to="/admin" replace />
  return children
}

function AdminRoute({ children }) {
  const { status } = useAuth()
  if (status === 'loading') return <LoadingSpinner fullScreen />
  if (status !== 'admin')   return <Navigate to="/" replace />
  return children
}

// Redirects authenticated users away from public-only pages (e.g. /login)
function PublicOnlyRoute({ children }) {
  const { status } = useAuth()
  if (status === 'loading')        return <LoadingSpinner fullScreen />
  if (status === 'professor')      return <Navigate to="/" replace />
  if (status === 'admin')          return <Navigate to="/admin" replace />
  if (status === 'not-approved')   return <Navigate to="/not-approved" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary label="Application">
          <Routes>
            {/* Public */}
            <Route path="/login"        element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/not-approved" element={<NotApproved />} />

            {/* Professor dashboard */}
            <Route path="/" element={<ProfessorRoute><AppShell /></ProfessorRoute>}>
              <Route index                         element={<ErrorBoundary label="Dashboard"><Home /></ErrorBoundary>} />
              <Route path="session/:roomId"        element={<ErrorBoundary label="Live Session"><LiveSession /></ErrorBoundary>} />
              <Route path="session/:roomId/review" element={<ErrorBoundary label="Attendance Review"><AttendanceReview /></ErrorBoundary>} />
              <Route path="history"                element={<ErrorBoundary label="Session History"><History /></ErrorBoundary>} />
              <Route path="history/:sessionId"     element={<ErrorBoundary label="Session Detail"><SessionDetail /></ErrorBoundary>} />
              <Route path="student/:studentId"     element={<ErrorBoundary label="Student Profile"><StudentProfile /></ErrorBoundary>} />
              <Route path="settings"               element={<ErrorBoundary label="Settings"><Settings /></ErrorBoundary>} />
            </Route>

            {/* Admin panel */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index          element={<ErrorBoundary label="Command Center"><AdminCommandCenter /></ErrorBoundary>} />
              <Route path="drilldown/*" element={<ErrorBoundary label="Drilldown"><AdminDrilldown /></ErrorBoundary>} />
              <Route path="rooms/:roomId" element={<ErrorBoundary label="Room Control"><AdminRoomControl /></ErrorBoundary>} />
              <Route path="sessions/:sessionId/timeline" element={<ErrorBoundary label="Session Timeline"><AdminSessionTimeline /></ErrorBoundary>} />
              <Route path="incidents" element={<ErrorBoundary label="Incident Center"><AdminIncidents /></ErrorBoundary>} />
              <Route path="attendance-intelligence" element={<ErrorBoundary label="Attendance Intelligence"><AdminAttendanceIntelligence /></ErrorBoundary>} />
              <Route path="rules" element={<ErrorBoundary label="Rule Engine"><AdminRuleEngine /></ErrorBoundary>} />
              <Route path="audit" element={<ErrorBoundary label="Audit Logs"><AdminAuditLogs /></ErrorBoundary>} />
              <Route path="ops-health" element={<ErrorBoundary label="Ops Health"><AdminOpsHealth /></ErrorBoundary>} />
              <Route path="professors" element={<ErrorBoundary label="Professors Admin"><AdminProfessors /></ErrorBoundary>} />
              <Route path="courses" element={<ErrorBoundary label="Courses Admin"><AdminCourses /></ErrorBoundary>} />
              <Route path="assign"  element={<ErrorBoundary label="Assignments"><AdminAssign /></ErrorBoundary>} />
              <Route path="health"  element={<ErrorBoundary label="System Health"><SystemHealth /></ErrorBoundary>} />
              <Route path="debugger" element={<AdminDebugger />} />
              <Route path="viewer"  element={<ProfessorViewer />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
