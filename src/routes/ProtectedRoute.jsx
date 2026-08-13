import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Feedback'

export function ProtectedRoute() {
  const { isAuthenticated, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <Spinner label="Restoring session..." />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, ready } = useAuth()
  if (!ready) return <Spinner label="Loading..." />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function RoleRoute({ roles }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) {
    return <Navigate to="/forbidden" replace />
  }
  return <Outlet />
}
