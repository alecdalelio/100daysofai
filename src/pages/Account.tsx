import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export default function Account() {
  const { userId } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) return
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (mounted && data) {
        setUsername((data as any).username ?? '')
        setDisplayName((data as any).display_name ?? '')
        setAvatarUrl((data as any).avatar_url ?? '')
      }
    }
    load()
    return () => { mounted = false }
  }, [userId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username: username || null,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
    })
    setSaving(false)
    setMsg(error ? error.message : 'Saved.')
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username (unique)</label>
          <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input className="w-full border rounded p-2" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Avatar URL</label>
          <input className="w-full border rounded p-2" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
        </div>
        <button className="border rounded px-4 py-2" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  )
}


