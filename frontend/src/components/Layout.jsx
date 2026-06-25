import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: DashIcon },
  { to: '/expenses', label: 'Expenses', icon: ExpenseIcon },
  { to: '/income', label: 'Income', icon: IncomeIcon },
  { to: '/budgets', label: 'Budgets', icon: BudgetIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-56 flex flex-col bg-white dark:bg-gray-800 border-r border-primary-100 dark:border-gray-700
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-primary-50">
          <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-display font-bold text-primary-700 text-lg tracking-tight">SmartSpend</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div className="px-3 py-4 border-t border-primary-50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogoutIcon className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-primary-100 dark:border-gray-700">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500">
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-primary-700">SmartSpend</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function DashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function ExpenseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function IncomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
function BudgetIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2a10 10 0 1010 10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
