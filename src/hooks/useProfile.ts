import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, ensureProfile as ensureProfileLib } from '@/lib/supabase'
import { useProfileStore } from '@/stores/profileStore'

export type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_gradient: string | null
  time_zone?: string | null
}

const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).host.split('.')[0]
const userKey = (uid: string) => `profile:${projectRef}:${uid}`
const lastKey = `profile:${projectRef}:last`

function nameFromSession(session?: any) {
  const u = session?.user
  return (
    u?.user_metadata?.name ??
    u?.user_metadata?.full_name ??
    (u?.email ? u.email.split('@')[0] : null)
  )
}

function normalize(row: any, session?: any) {
  if (!row) return null
  const fallback = nameFromSession(session)
  // Guarantee a username when logged in: prefer row.username, then any display name, then session-derived
  const username = row.username ?? row.display_name ?? row.displayName ?? fallback ?? null
  // Keep display_name stable (avoid flicker); do not invent one if missing
  const display_name = row.display_name ?? row.displayName ?? null
  return {
    id: row.id,
    username,
    display_name,
    avatar_gradient: row.avatar_gradient ?? row.avatar_url ?? null,
    time_zone: row.time_zone ?? null,
  }
}

export function useProfile() {
  const { profile, lastNonNull, provisional, setProfile: setStoreProfile, setProvisional, clearOnSignOut } = useProfileStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)
  
  // 1) Instant hydrate from last-known cache (no UID required)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(lastKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        console.log('[useProfile] Loading provisional from lastKey cache:', parsed)
        setProvisional(normalize(parsed))
      } else {
        console.log('[useProfile] No lastKey cache found')
      }
    } catch {
      console.log('[useProfile] Failed to load lastKey cache')
    }
  }, [setProvisional])

  const fetchProfile = useCallback(async () => {
    try {
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess?.session?.user?.id || null
      userIdRef.current = uid

      if (!uid) {
        // transient refresh blip
        setIsLoading(false)
        setTimeout(() => { void fetchProfile() }, 750)
        return
      }

      setIsLoading(true)
      setError(null)

      // Fetch fresh data from database first
      const { data: row, error: err } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, time_zone')
        .eq('id', uid)
        .maybeSingle()

      if (err) throw err

      console.log('[useProfile] Fresh database fetch result:', row)
      const freshNorm = normalize(row, sess?.session)
      console.log('[useProfile] Setting store profile from database (fresh):', freshNorm)
      setStoreProfile(freshNorm)

      // Update cache with fresh data
      try {
        localStorage.setItem(userKey(uid), JSON.stringify(freshNorm))
        localStorage.setItem(lastKey, JSON.stringify(freshNorm))
        console.log('[useProfile] Updated cache with fresh database data')
      } catch {
        console.log('[useProfile] Failed to update cache with fresh data')
      }

      // Cache data is only used if fresh fetch failed (handled in catch block)
    } catch (e: any) {
      console.error('[useProfile] Fresh fetch failed, trying cached data:', e)
      // Fallback to cached data if fresh fetch fails
      try {
        const ck = localStorage.getItem(userKey(uid))
        if (ck) {
          const parsed = JSON.parse(ck)
          console.log('[useProfile] Using cached data as fallback after fetch error:', parsed)
          const norm = normalize(parsed, sess?.session)
          setStoreProfile(norm)
        } else {
          setError(e?.message || 'Failed to load profile')
        }
      } catch {
        setError(e?.message || 'Failed to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }, [setStoreProfile])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // Auth events: only clear on SIGNED_OUT; otherwise fetch and keep provisional/last
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const uid = userIdRef.current
        try {
          if (uid) localStorage.removeItem(userKey(uid))
          localStorage.removeItem(lastKey)
        } catch {}
        console.log('[useProfile] signed out — clearing profile cache and store')
        clearOnSignOut()
        setIsLoading(false)
        return
      }
      if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        void fetchProfile()
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, clearOnSignOut])

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
      console.log('[useProfile] Received profile:saved event with detail:', detail)
      if (detail) {
        const currentProfile = useProfileStore.getState().profile ?? useProfileStore.getState().lastNonNull ?? {} as any
        const merged = { ...currentProfile, ...detail } as ProfileRow
        console.log('[useProfile] Merging profile:saved detail with current profile:', { currentProfile, detail, merged })
        setStoreProfile(merged)
      }
      console.log('[useProfile] Calling fetchProfile() after profile:saved event')
      fetchProfile()
    }
    window.addEventListener('profile:saved', onProfileSaved)
    return () => { 
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener('profile:saved', onProfileSaved)
    }
  }, [fetchProfile])

  const visible = profile ?? provisional ?? lastNonNull
  return { profile: visible, isLoading, error, refresh: fetchProfile }
}

type PartialProfile = { username?: string; display_name?: string; avatar_gradient?: string; time_zone?: string }
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

  console.log('[profiles.update] payload being sent:', JSON.stringify(payload, null, 2))

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
    console.log('[profiles.update] REST response', resp.status, resp.statusText, text)
    console.log('[profiles.update] response headers:', Object.fromEntries([...resp.headers.entries()]))
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
      time_zone: row.time_zone ?? 'UTC',
    } as ProfileRow
  } finally {
    clearTimeout(timeoutId)
  }
}

export const ensureProfile = ensureProfileLib


