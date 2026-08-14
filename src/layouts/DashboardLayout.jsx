import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import { fullName } from '../utils/format'
import { ALL_ROLES, ROLE_LABELS } from '../utils/constants'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ALL_ROLES },
  { to: '/departments', label: 'Departments', icon: 'building', roles: ['admin'] },
  { to: '/receptionists', label: 'Receptionists', icon: 'reception', roles: ['admin'] },
  { to: '/doctors', label: 'Doctors', icon: 'stethoscope', roles: ALL_ROLES },
  { to: '/patients', label: 'Patients', icon: 'users', roles: ['admin', 'receptionist', 'doctor'] },
  { to: '/appointments', label: 'Appointments', icon: 'calendar', roles: ALL_ROLES },
  { to: '/prescriptions', label: 'Prescriptions', icon: 'file', roles: ALL_ROLES },
  { to: '/medicines', label: 'Medicines', icon: 'pill', roles: ALL_ROLES },
  { to: '/bills', label: 'Billing', icon: 'receipt', roles: ALL_ROLES },
  { to: '/profile', label: 'Profile', icon: 'user', roles: ALL_ROLES },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/departments': 'Departments',
  '/receptionists': 'Receptionists',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/prescriptions': 'Prescriptions',
  '/medicines': 'Medicines',
  '/bills': 'Billing',
  '/profile/edit': 'Edit profile',
  '/profile': 'Profile',
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))
  const title =
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'MediCare'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f4f7f8]">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-slate-200 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Icon name="logo" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">MediCare</p>
              <p className="text-xs text-slate-400">Hospital Management</p>
            </div>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-teal-700 text-white' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <Icon name={item.icon} className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-medium text-white">{fullName(user)}</p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Workspace</p>
              <p className="font-semibold text-slate-900">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{fullName(user)}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="px-2.5"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <Icon name="logout" className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
