import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, ensureProfile as ensureProfileLib } from '@/lib/supabase'

export type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_gradient: string | null
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(() => {
    try {
      const raw = localStorage.getItem('profile:last')
      return raw ? (JSON.parse(raw) as ProfileRow) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      // Resolve auth with a timeout and fallbacks
      const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Auth timed out')), ms))
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null = null
      try {
        const sessRes = (await Promise.race([
          supabase.auth.getSession(),
          timeout(2500),
        ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>
        session = sessRes?.data?.session ?? null
      } catch {}
      if (!session) {
        try {
          const userRes = (await Promise.race([
            supabase.auth.getUser(),
            timeout(2500),
          ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>
          session = userRes?.data?.user ? { ...({} as any), user: userRes.data.user, access_token: (userRes as any)?.data?.session?.access_token } : null
        } catch {}
      }
      const user = session?.user
      if (!user) { setProfile(null); setIsLoading(false); return }
      userIdRef.current = user.id
      setIsLoading(true)
      setError(null)
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=id,username,display_name,avatar_url`
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        }
      })
      const rows = await resp.json()
      const row = Array.isArray(rows) ? rows[0] : rows
      const mapped: ProfileRow | null = row ? {
        id: row.id,
        username: row.username ?? null,
        display_name: row.display_name ?? null,
        avatar_gradient: row.avatar_gradient ?? row.avatar_url ?? null,
      } : null
      setProfile(mapped)
      try { if (mapped) localStorage.setItem('profile:last', JSON.stringify(mapped)) } catch {}
    } catch (e: any) {
      // On failure, try to hydrate from cache so the Header shows something
      try {
        const raw = localStorage.getItem('profile:last')
        if (raw) {
          const parsed = JSON.parse(raw) as ProfileRow
          setProfile(parsed)
        }
      } catch {}
      setError(e?.message || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    const id = userIdRef.current
    if (id) {
      channel = supabase
        .channel('profiles-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${id}` }, fetchProfile)
        .subscribe()
    }
    const onProfileSaved = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as Partial<ProfileRow> | undefined
      if (detail) {
        setProfile((prev) => ({ ...(prev ?? {} as any), ...detail }))
      }
      fetchProfile()
    }
    window.addEventListener('profile:saved', onProfileSaved)
    return () => { 
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener('profile:saved', onProfileSaved)
    }
  }, [fetchProfile])

  return { profile, isLoading, error, refresh: fetchProfile }
}

type PartialProfile = { username?: string; display_name?: string; avatar_gradient?: string }
type UpdateOpts = { token?: string; userId?: string }

export async function updateProfile(partial: PartialProfile, opts: UpdateOpts = {}) {
  console.log('[profiles.update] entering')
  let { token, userId } = opts

  // Resolve auth from caller first to avoid getSession hangs
  if (!token || !userId) {
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      console.log('[profiles.update] auth', { sessErr, hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id })
      if (sessErr || !session?.user) throw new Error('Not authenticated')
      token = token ?? session.access_token
      userId = userId ?? session.user.id
    } catch (e) {
      console.error('[profiles.update] getSession failed', e)
      throw new Error('Not authenticated')
    }
  } else {
    console.log('[profiles.update] auth (provided by caller)', { hasToken: !!token, userId })
  }

  // Ensure row exists via edge function (use provided token to avoid extra session calls)
  try {
    await ensureProfileLib(token)
  } catch (e) {
    console.warn('[profiles.ensureProfile] failed (continuing)', e)
  }

  // Build payload mapping avatar_gradient -> avatar_url
  const payload: Record<string, unknown> = { ...partial, updated_at: new Date().toISOString() }
  if (Object.prototype.hasOwnProperty.call(payload, 'avatar_gradient')) {
    payload['avatar_url'] = (payload as any)['avatar_gradient']
    delete (payload as any)['avatar_gradient']
  }

  // Use direct REST PATCH to guarantee a visible network request and avoid client stalls
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await resp.text()
    console.log('[profiles.update] REST response', resp.status, text)
    if (!resp.ok) {
      // Surface PostgREST errors clearly
      const err: any = new Error(text || `Update failed (${resp.status})`)
      // crude code extraction
      if (/23505/.test(text)) err.code = '23505'
      throw err
    }
    const rows = text ? JSON.parse(text) : []
    const row = Array.isArray(rows) ? rows[0] : rows
    if (!row) throw new Error('No row returned')
    // Map avatar_url -> avatar_gradient for the app
    return {
      id: row.id,
      username: row.username ?? null,
      display_name: row.display_name ?? null,
      avatar_gradient: row.avatar_gradient ?? row.avatar_url ?? null,
    } as ProfileRow
  } finally {
    clearTimeout(timeoutId)
  }
}

export const ensureProfile = ensureProfileLib


