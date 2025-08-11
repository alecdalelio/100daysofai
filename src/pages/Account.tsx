import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ensureProfile } from '../lib/supabase'
import { useProfile, updateProfile } from '@/hooks/useProfile'
import { GRADIENTS, isValidGradient } from '@/constants/gradients'

export default function Account() {
  const { userId, session, loading } = useAuth()
  const { profile, refresh } = useProfile()
  
  console.log('[Account] Component rendered. Auth state:', { userId, hasSession: !!session, loading })
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarGradient, setAvatarGradient] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  useEffect(() => { console.log('[Account] saving=', saving) }, [saving])
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  const gradients = GRADIENTS

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) return
      await ensureProfile(session?.access_token)
      await refresh()
      if (!mounted) return
      if (profile) {
        setUsername(profile.username ?? '')
        setDisplayName(profile.display_name ?? '')
        setAvatarGradient(profile.avatar_gradient ?? '')
      }
    }
    load()
    return () => { mounted = false }
  }, [userId, profile?.id])

  async function onSave() {
    setSaving(true)
    setErrorMsg(null)
    setOkMsg(null)
    try {
      console.log('[Account] save ->', { username, displayName, avatarGradient })
      const row = await updateProfile({
        username: username?.trim() || undefined,
        display_name: displayName?.trim() || undefined,
        avatar_gradient: avatarGradient || undefined,
      }, { token: session?.access_token, userId: userId ?? undefined })
      console.log('[Account] saved row', row)
      setUsername(row.username ?? '')
      setDisplayName(row.display_name ?? '')
      setAvatarGradient(row.avatar_gradient ?? 'grad-1')
      try { localStorage.setItem('profile:last', JSON.stringify(row)) } catch {}
      window.dispatchEvent(new CustomEvent('profile:saved', { detail: row }))
      setOkMsg('Saved')
      await refresh()
    } catch (err: any) {
      console.error('[Account] save error', err)
      setErrorMsg(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(e: FormEvent) { e.preventDefault(); await onSave(); }

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
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded border"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
        {okMsg && <p className="text-green-500 mt-2">{okMsg}</p>}
      </form>
    </div>
  )
}


