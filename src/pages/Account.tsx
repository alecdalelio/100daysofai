import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      console.log('[Account] Profile load result:', { data, error })
      
      if (mounted && data) {
        const profile = data as Profile
        setUsername(profile.username ?? '')
        setDisplayName(profile.display_name ?? '')
        setAvatarGradient(profile.avatar_url ?? '')
        console.log('[Account] Profile loaded:', profile)
      } else if (mounted && !data && !error) {
        console.log('[Account] No profile found - will be created on first save')
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

      // Try direct fetch with timeout to bypass any helpers
      console.log('[Account] Using direct fetch with AbortController')
      console.log('[Account] NEW CODE IS RUNNING - JWT VALIDATION ADDED')
      alert('NEW CODE IS RUNNING!')
      
      // Get session directly and validate the token
      let activeSession
      try {
        const { data: { session } } = await supabase.auth.getSession()
        activeSession = session
        
        if (!activeSession?.access_token) {
          throw new Error('No session found')
        }
        
        // Validate JWT format (should have 3 parts separated by dots)
        const tokenParts = activeSession.access_token.split('.')
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT format')
        }
        
        console.log('[Account] Session token format valid:', activeSession.access_token.slice(0, 20) + '...')
        
        // Try to decode the payload to check expiration
        try {
          const payload = JSON.parse(atob(tokenParts[1]))
          const now = Math.floor(Date.now() / 1000)
          if (payload.exp && payload.exp < now) {
            throw new Error('JWT expired')
          }
          console.log('[Account] JWT not expired, expires at:', new Date(payload.exp * 1000))
        } catch (decodeError) {
          console.warn('[Account] Could not decode JWT payload:', decodeError)
          throw new Error('Invalid JWT payload')
        }
        
      } catch (sessionError) {
        console.log('[Account] Session/JWT issue, attempting refresh:', sessionError.message)
        
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession?.access_token) {
          throw new Error(`Authentication failed: ${refreshError?.message || 'No session after refresh'}`)
        }
        
        activeSession = refreshedSession
        console.log('[Account] Session refreshed successfully')
      }
      
      // Direct fetch with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('[Account] Aborting fetch after 10s')
        controller.abort()
      }, 10000)
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?on_conflict=id&select=*`
      console.log('[Account] Making direct fetch to:', url)
      
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${activeSession.access_token}`,
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
        console.log('[Account] Fetch completed! Status:', resp.status)
        
        const txt = await resp.text()
        console.log('[Account] Response body:', txt.slice(0, 200))

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
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.log('[Account] Fetch error:', fetchError)
        throw fetchError
      }
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


