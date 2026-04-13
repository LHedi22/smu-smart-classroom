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
import AdminLayout      from './pages/admin/AdminLayout'
import AdminProfessors  from './pages/admin/AdminProfessors'
import AdminCourses     from './pages/admin/AdminCourses'
import AdminAssign      from './pages/admin/AdminAssign'
import AdminDebugger    from './pages/admin/AdminDebugger'
import ProfessorViewer  from './pages/admin/ProfessorViewer'

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
        <Routes>
          {/* Public */}
          <Route path="/login"        element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/not-approved" element={<NotApproved />} />

          {/* Professor dashboard */}
          <Route path="/" element={<ProfessorRoute><AppShell /></ProfessorRoute>}>
            <Route index                              element={<Home />} />
            <Route path="session/:roomId"             element={<LiveSession />} />
            <Route path="session/:roomId/review"      element={<AttendanceReview />} />
            <Route path="history"                     element={<History />} />
            <Route path="history/:sessionId"          element={<SessionDetail />} />
            <Route path="student/:studentId"          element={<StudentProfile />} />
            <Route path="settings"                    element={<Settings />} />
          </Route>

          {/* Admin panel */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index          element={<AdminProfessors />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="assign"  element={<AdminAssign />} />
            <Route path="debugger" element={<AdminDebugger />} />
            <Route path="viewer"  element={<ProfessorViewer />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
