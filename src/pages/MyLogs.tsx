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

  useEffect(() => {
    if (!userId) return
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('logs')
        .select('id,title,day,is_published,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (!error && data) setLogs(data as any)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return null

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">My Logs</h1>
      <div className="space-y-2">
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
        {logs.length === 0 && <p className="text-sm text-gray-500">No logs yet.</p>}
      </div>
    </div>
  )
}


