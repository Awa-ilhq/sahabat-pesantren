import { Navigate } from 'react-router-dom'
import { homeForRole } from '../../lib/constants'
import { useAuth } from './auth-context'

export function RedirectIfAuthenticated({ children }) {
  const { user, isAuthenticated } = useAuth()

  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/ganti-password" replace />
    }
    return <Navigate to={homeForRole(user.role, user.dashboard)} replace />
  }

  return children
}
