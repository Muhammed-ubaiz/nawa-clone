import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PageLoader from '../common/PageLoader'

/** Redirects to /admin/login unless an admin session is active. The API enforces this too. */
export default function ProtectedRoute() {
  const { isAuthenticated, checking } = useAuth()
  const location = useLocation()

  if (checking)
    return (
      <div className="admin-ui">
        <PageLoader label="Checking session" fullScreen background="bg-white" />
      </div>
    )
  if (!isAuthenticated) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
