import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'parent' | 'teacher' | 'admin' }) {
  const { session, role: userRole, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
