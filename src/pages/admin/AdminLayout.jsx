import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Cpu } from 'lucide-react'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col">
      <header className="bg-surface border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-brand" />
          <span className="font-semibold text-slate-100">SMU Admin Panel</span>
          <span className="ml-1 text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full font-mono">
            Administrator
          </span>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm">
          Sign out
        </button>
      </header>

      <div className="flex flex-1">
        <nav className="w-48 bg-surface border-r border-surface-border p-4 space-y-1 flex-shrink-0">
          {[
            { to: '/admin',          label: 'Professors', end: true },
            { to: '/admin/courses',  label: 'Courses' },
            { to: '/admin/assign',   label: 'Assignments' },
            { to: '/admin/health',   label: 'System Health' },
            { to: '/admin/viewer',   label: '👁️ View Professor' },
            { to: '/admin/debugger', label: '🔍 Debugger' },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
