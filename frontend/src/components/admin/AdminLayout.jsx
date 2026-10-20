import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  ExternalLink,
  FileChartColumn,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLiveRefresh } from '../../hooks/useLiveRefresh'
import Logo from '../common/Logo'
import { dashboardApi } from '../../services/api'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck, badge: 'pendingAppointments' },
  { to: '/admin/blogs', label: 'Blogs', icon: FileText },
  { to: '/admin/services', label: 'Services', icon: Sparkles },
  { to: '/admin/contacts', label: 'Contacts', icon: Mail, badge: 'newContacts' },
  { to: '/admin/reports', label: 'Reports', icon: FileChartColumn },
]

const ADMIN_HOME_LABEL = 'Nawa Ayurvedic Medical Centre — admin dashboard'

function Sidebar({ counts, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col border-r border-border/80 bg-white">
      <div className="flex justify-center border-b border-border/60 px-5 py-6">
        <Logo variant="admin" to="/admin/dashboard" onClick={onNavigate} label={ADMIN_HOME_LABEL} />
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-soft/80">Menu</p>
        <ul className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors duration-200 ${
                    isActive ? 'bg-secondary/60 text-primary-dark' : 'text-text-soft hover:bg-canvas hover:text-text'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-primary' : 'text-text-soft group-hover:text-text'}`} aria-hidden="true" />
                    <span className={`flex-1 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                    {badge && counts?.[badge] > 0 && (
                      <span className="min-w-6 rounded-full bg-accent px-2 py-0.5 text-center text-[11px] font-bold leading-4 text-white">
                        {counts[badge]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-border/60 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-text-soft transition-colors hover:bg-canvas hover:text-text"
        >
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> View Website
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-text-soft transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Logout
        </button>
      </div>
    </div>
  )
}

function ProfileMenu({ admin, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  const initials = (admin?.name || 'A')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition hover:bg-muted"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-[13px] font-bold text-white">{initials}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[14px] font-semibold">{admin?.name}</span>
          <span className="block text-[12px] capitalize text-text-soft">{admin?.role}</span>
        </span>
        <ChevronDown className={`hidden h-4 w-4 text-text-soft transition-transform sm:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div
        role="menu"
        className={`absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-2xl border border-border bg-white p-2 shadow-xl transition-all duration-200 ${
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'
        }`}
      >
        <div className="border-b border-border px-3 pb-3 pt-2">
          <p className="truncate text-[14px] font-semibold">{admin?.name}</p>
          <p className="truncate text-[12px] text-text-soft">{admin?.email}</p>
        </div>
        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
        </button>
      </div>
    </div>
  )
}

/** Shell for all admin pages: sidebar navigation, top bar and page outlet. */
export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [counts, setCounts] = useState(null)

  // Badge counts for the sidebar and notification bell; refreshed on navigation
  // and kept live in the background. State only changes when a count changes.
  const loadCounts = useCallback(
    () =>
      dashboardApi
        .get()
        .then(({ data }) =>
          setCounts((prev) => (prev && JSON.stringify(prev) === JSON.stringify(data.stats) ? prev : data.stats)),
        )
        .catch(() => {}),
    [],
  )
  useLiveRefresh(loadCounts, { interval: 15000, topics: ['appointments', 'contacts'] })

  useEffect(() => {
    loadCounts()
    setDrawer(false)
  }, [pathname, loadCounts])

  useEffect(() => {
    window.addEventListener('admin:refresh-counts', loadCounts)
    return () => window.removeEventListener('admin:refresh-counts', loadCounts)
  }, [loadCounts])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const alerts = (counts?.pendingAppointments || 0) + (counts?.newContacts || 0)

  // The whole admin panel sits on a pure white canvas.
  return (
    <div className="admin-ui min-h-screen bg-white [color-scheme:light]">
      <a href="#admin-main" className="sr-only z-[100] rounded-full bg-primary px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar counts={counts} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? 'visible' : 'invisible'}`} aria-hidden={!drawer}>
        <div className={`absolute inset-0 bg-text/40 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawer(false)} />
        <div
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            drawer ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar counts={counts} onNavigate={() => setDrawer(false)} onLogout={handleLogout} />
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Close menu"
            className="absolute -right-12 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-text"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="lg:pl-[264px]">
        {/* z-40: above page-level layers (e.g. the Reports action bar is z-30 so its menu clears the
            cards) — at the same level the later-painted page content would slide over this sticky bar.
            Still below the mobile drawer (z-50). */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="Open menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-muted lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              {/* Full logo in the header only while the sidebar is hidden (mobile/tablet). */}
              <Logo variant="adminHeader" to="/admin/dashboard" label={ADMIN_HOME_LABEL} className="lg:hidden" />
              <p className="hidden text-[14px] text-text-soft md:block">
                Welcome back, <span className="font-semibold text-text">{admin?.name?.split(' ')[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to={counts?.pendingAppointments ? '/admin/appointments?status=Pending' : '/admin/contacts?status=New'}
                aria-label={`${alerts} items need attention`}
                title={`${counts?.pendingAppointments || 0} pending appointments · ${counts?.newContacts || 0} new messages`}
                className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-muted"
              >
                <Bell className="h-5 w-5 text-text-soft" aria-hidden="true" />
                {alerts > 0 && (
                  <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {alerts > 99 ? '99+' : alerts}
                  </span>
                )}
              </Link>
              <ProfileMenu admin={admin} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main id="admin-main" className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
