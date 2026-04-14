import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-[color:var(--bg-surface-muted)] text-[color:var(--fg-default)]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
