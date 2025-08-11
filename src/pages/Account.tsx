import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase, queryDirectly } from '../lib/supabase'
import { Profile } from '../lib/types'

export default function Account() {
  const { userId, session, loading } = useAuth()
  
  console.log('[Account] Component rendered. Auth state:', { userId, hasSession: !!session, loading })
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarGradient, setAvatarGradient] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

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
      console.log('[Account] Loading profile for userId:', userId)
      try {
        const rows = await queryDirectly('profiles', { select: '*', eq: { column: 'id', value: userId }, limit: 1 })
        const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        console.log('[Account] Profile load result (direct):', data)
        if (mounted && data) {
          const profile = data as Profile
          setUsername(profile.username ?? '')
          setDisplayName(profile.display_name ?? '')
          setAvatarGradient(profile.avatar_url ?? '')
          console.log('[Account] Profile loaded:', profile)
        } else if (mounted) {
          console.log('[Account] No profile found - will be created on first save')
        }
      } catch (error) {
        console.error('[Account] Failed to load profile:', error)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    setUsernameError(null)
    setStatus('saving')

    const cleanUsername = ((username || '').trim() || null)?.toLowerCase?.() ?? null
    const TIMEOUT_MS = 15000 // Shorter timeout
    const safetyTimer = setTimeout(() => {
      console.error('[Account] Safety timeout fired – clearing saving state')
      setSaving(false)
      setStatus('error')
      setMsg('Save took too long. Please clear your browser data and try again.')
    }, TIMEOUT_MS + 2000)

    try {
      console.log('[Account] entering save - username:', cleanUsername, 'displayName:', displayName)
      console.log('[Account] userId:', userId)
      console.log('[Account] session from auth exists:', !!session)
      console.log('[Account] env check:', import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY ? 'anon key present' : 'anon key missing')
      
      if (!userId) {
        throw new Error('User ID not available - not authenticated?')
      }

      // Persist using direct REST fetch to avoid potential supabase-js hangs
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('client-timeout'), 10000)

      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?on_conflict=id&select=*`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation,resolution=merge-duplicates',
        },
        body: JSON.stringify([
          {
            id: userId,
            username: cleanUsername,
            display_name: displayName || null,
            avatar_url: avatarGradient || null,
          },
        ]),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const txt = await resp.text()

      if (resp.ok) {
        setStatus('success')
        setMsg('Saved.')
        window.dispatchEvent(new Event('profile:saved'))
        return
      }

      if (resp.status === 409 || /duplicate key|unique/i.test(txt)) {
        setStatus('error')
        setUsernameError('That username is taken. Please choose another.')
        setMsg('Could not save profile.')
        return
      }

      throw new Error(txt || `Save failed with status ${resp.status}`)
    } catch (err) {
      setStatus('error')
      const errorObj = err as { message?: string }
      console.error('[Account] Save failed', err)
      
      // If it's an authentication error, suggest login
      if (errorObj?.message?.includes('Authentication') || errorObj?.message?.includes('JWT')) {
        setMsg('Session expired. Please log out and log back in.')
      } else {
        setMsg(errorObj?.message || 'Failed to save')
      }
    } finally {
      clearTimeout(safetyTimer)
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username (unique)</label>
          <input
            className={`w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${usernameError ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500' : ''}`}
            value={username}
            onChange={e=>setUsername(e.target.value)}
          />
          {usernameError && <p className="text-sm text-red-600 mt-1">{usernameError}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input
            className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
            value={displayName}
            onChange={e=>setDisplayName(e.target.value)}
          />
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
        {msg && (
          <p className={`text-sm mt-2 ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
        )}
      </form>
    </div>
  )
}


