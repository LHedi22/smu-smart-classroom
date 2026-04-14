import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClockIcon, Settings, Cpu } from 'lucide-react'

const links = [
  { to: '/',        icon: LayoutDashboard, label: 'Home',     end: true },
  { to: '/history', icon: ClockIcon,       label: 'History'            },
  { to: '/settings',icon: Settings,        label: 'Settings'           },
]

export default function Sidebar() {
  return (
    <aside
      className="sticky top-0 z-[120] h-screen w-16 flex-shrink-0 border-r border-[color:var(--border-muted)] bg-[color:var(--bg-surface-raised)] py-4 lg:w-60"
      style={{ boxShadow: 'var(--shadow-sticky)' }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-3 lg:px-4">
        <Cpu size={20} className="shrink-0 text-[color:var(--accent-brand)]" />
        <span className="hidden truncate text-sm font-semibold tracking-tight text-[color:var(--fg-default)] lg:block">SMU Classroom</span>
      </div>

      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `mx-2 flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-[color:var(--accent-brand)]/10 text-[color:var(--accent-brand)]'
                : 'text-[color:var(--fg-muted)] hover:bg-[color:var(--bg-surface-muted)] hover:text-[color:var(--fg-default)]'
              }`
          }
        >
          <Icon size={18} className="shrink-0" strokeWidth={2} />
          <span className="hidden lg:block">{label}</span>
        </NavLink>
      ))}
    </aside>
  )
}
