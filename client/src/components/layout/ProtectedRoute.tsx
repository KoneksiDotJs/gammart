import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Role } from '../../types'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
}

/**
 * Wraps routes that require authentication.
 * Optionally restricts to specific roles (e.g. seller-only pages).
 */
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}