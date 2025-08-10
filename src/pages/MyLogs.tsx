import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

type Log = {
  id: number
  title: string
  day: number
  is_published: boolean
  created_at: string
}

export default function MyLogs() {
  const { userId } = useAuth()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!userId) {
        // No user – clear and stop loading so we render an empty state instead of a blank page
        if (!cancelled) {
          setLogs([])
          setLoading(false)
        }
        return
      }
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('id,title,day,is_published,created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (!cancelled) {
          if (error) {
            console.error('Failed to load my logs:', error)
            setError(error.message)
            setLogs([])
          } else if (data) {
            setLogs(data as any)
          }
          setLoading(false)
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Unexpected error loading logs:', e)
          setError(e?.message ?? 'Unexpected error')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // Safety: stop showing spinner forever; after 8s, stop loading so the empty-state/CTA shows
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => {
      setLoading(false)
    }, 8000)
    return () => clearTimeout(t)
  }, [loading, logs.length, error])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="card p-4 animate-pulse">Loading your logs…</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Logs</h1>
        <Link to="/new-log" className="btn btn-primary focus-ring">New Log</Link>
      </div>
      <div className="space-y-2">
        {error && (
          <div className="card p-3 text-sm text-red-500">{error}</div>
        )}
        {logs.map(l => (
          <Link key={l.id} to={`/log/${l.id}`} className="block card p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{l.title}</div>
                <div className="text-sm text-gray-500">Day {l.day} · {l.is_published ? 'Published' : 'Draft'}</div>
              </div>
              <div className="text-sm">{new Date(l.created_at).toLocaleString()}</div>
            </div>
          </Link>
        ))}
        {logs.length === 0 && (
          <div className="card p-6 text-sm">
            <p className="text-gray-500 mb-3">No logs yet.</p>
            <Link to="/new-log" className="btn btn-secondary focus-ring">Create your first log</Link>
          </div>
        )}
      </div>
    </div>
  )
}


