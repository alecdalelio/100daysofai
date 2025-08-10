import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { userId, loading } = useAuth()
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="card p-6 animate-pulse">Loading…</div>
      </div>
    )
  }
  if (!userId) return <Navigate to="/login" replace />
  return children
}
