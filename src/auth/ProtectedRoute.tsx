import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { userId, loading } = useAuth()
  if (loading) return null // or a spinner
  if (!userId) return <Navigate to="/login" replace />
  return children
}
