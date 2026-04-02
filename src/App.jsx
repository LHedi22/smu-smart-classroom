import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useProfessor } from './context/AuthContext'
import AppShell          from './components/layout/AppShell'
import Login             from './pages/Login'
import Home              from './pages/Home'
import LiveSession       from './pages/LiveSession'
import AttendanceReview  from './pages/AttendanceReview'
import History           from './pages/History'
import SessionDetail     from './pages/SessionDetail'
import StudentProfile    from './pages/StudentProfile'
import Settings          from './pages/Settings'
import LoadingSpinner    from './components/shared/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { professor } = useProfessor()
  if (professor === undefined) return <LoadingSpinner fullScreen />
  if (professor === null) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="session/:roomId"          element={<LiveSession />} />
            <Route path="session/:roomId/review"   element={<AttendanceReview />} />
            <Route path="history"                  element={<History />} />
            <Route path="history/:sessionId"       element={<SessionDetail />} />
            <Route path="student/:studentId"       element={<StudentProfile />} />
            <Route path="settings"                 element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
