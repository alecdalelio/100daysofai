import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export default function Account() {
  const { userId } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarGradient, setAvatarGradient] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const gradients = [
    { id: 'grad-1', className: 'bg-gradient-to-tr from-pink-500 to-yellow-500' },
    { id: 'grad-2', className: 'bg-gradient-to-tr from-blue-500 to-green-400' },
    { id: 'grad-3', className: 'bg-gradient-to-tr from-purple-500 to-pink-400' },
    { id: 'grad-4', className: 'bg-gradient-to-tr from-teal-400 to-cyan-500' },
    { id: 'grad-5', className: 'bg-gradient-to-tr from-orange-400 to-red-500' },
    { id: 'grad-6', className: 'bg-gradient-to-tr from-indigo-500 to-sky-400' },
  ]

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) return
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (mounted && data) {
        setUsername((data as any).username ?? '')
        setDisplayName((data as any).display_name ?? '')
        setAvatarGradient((data as any).avatar_url ?? '')
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
      avatar_url: avatarGradient || null,
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
          <label className="block text-sm mb-2">Choose Avatar</label>
          <div className="grid grid-cols-6 gap-3">
            {gradients.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setAvatarGradient(g.id)}
                className={`h-12 w-12 rounded-full ${g.className} border-2 transition ${
                  avatarGradient === g.id ? 'border-indigo-500' : 'border-transparent'
                }`}
                aria-label={`Select ${g.id}`}
              />
            ))}
          </div>
        </div>
        <button className="border rounded px-4 py-2" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </div>
  )
}


