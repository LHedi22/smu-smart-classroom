import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Cpu, Moon, Sun } from 'lucide-react'
import { useAdminDashboardStore } from '../../stores/useAdminDashboardStore'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const darkMode = useAdminDashboardStore(state => state.darkMode)
  const toggleDarkMode = useAdminDashboardStore(state => state.toggleDarkMode)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-surface-deep' : 'bg-slate-50'}`}>
      <header className={`border-b px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-surface border-surface-border' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-brand" />
          <span className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>SMU Admin Panel</span>
          <span className="ml-1 text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full font-mono">
            Administrator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="btn-ghost text-xs inline-flex items-center gap-1">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <button onClick={handleLogout} className="btn-ghost text-sm">Sign out</button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className={`w-60 border-r p-4 space-y-1 flex-shrink-0 ${darkMode ? 'bg-surface border-surface-border' : 'bg-white border-slate-200'}`}>
          {[
            { to: '/admin', label: 'Command Center', end: true },
            { to: '/admin/drilldown', label: 'Drill-Down' },
            { to: '/admin/incidents', label: 'Incident Center' },
            { to: '/admin/attendance-intelligence', label: 'Attendance Intelligence' },
            { to: '/admin/rules', label: 'Rule Engine' },
            { to: '/admin/audit', label: 'Audit Logs' },
            { to: '/admin/ops-health', label: 'System Health' },
            { to: '/admin/professors', label: 'Professors' },
            { to: '/admin/courses', label: 'Courses' },
            { to: '/admin/assign', label: 'Assignments' },
            { to: '/admin/health', label: 'Legacy Health' },
            { to: '/admin/viewer', label: 'Professor Viewer' },
            { to: '/admin/debugger', label: 'Debugger' },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-medium'
                    : `${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className={`flex-1 p-8 overflow-y-auto ${darkMode ? '' : 'text-slate-800'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
