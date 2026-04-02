import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Radio, ClockIcon, Users, Settings, Cpu } from 'lucide-react'

const links = [
  { to: '/',        icon: LayoutDashboard, label: 'Home',     end: true },
  { to: '/history', icon: ClockIcon,       label: 'History'            },
  { to: '/settings',icon: Settings,        label: 'Settings'           },
]

export default function Sidebar() {
  return (
    <aside className="w-16 lg:w-56 flex-shrink-0 bg-surface border-r border-surface-border flex flex-col py-4 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 mb-6">
        <Cpu size={20} className="text-brand flex-shrink-0" />
        <span className="hidden lg:block font-mono text-sm font-medium text-brand truncate">SMU·CLASSROOM</span>
      </div>

      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors duration-150 text-sm font-medium
             ${isActive
               ? 'bg-brand/10 text-brand'
               : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised'
             }`
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="hidden lg:block">{label}</span>
        </NavLink>
      ))}
    </aside>
  )
}
