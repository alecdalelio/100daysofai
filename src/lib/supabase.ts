import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL!
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!url || !key) {
  console.warn('Missing Supabase env vars.')
}
console.log('[supabase] URL', url)

// Safe one-time migration gate (no destructive cache clearing)
try {
  const ref = new URL(import.meta.env.VITE_SUPABASE_URL).host.split('.')[0]
  const FLAG = `profile:${ref}:migrated_v1`
  if (!localStorage.getItem(FLAG)) {
    // Place any one-time, non-destructive migration logic here
    localStorage.setItem(FLAG, '1')
  }
} catch (_e) { void 0 }

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
})

// Robust fallback: if we arrive with an OAuth hash, persist it explicitly
export async function bootstrapSessionFromHash(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token=')) return false
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token') || undefined
    const refresh_token = params.get('refresh_token') || undefined
    if (!access_token || !refresh_token) return false
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
    console.log('[auth.bootstrap] setSession', { hasError: !!error, hasSession: !!data?.session })
    if (error || !data?.session) {
      try {
        // Try refreshing using the refresh token as a fallback
        const r = await supabase.auth.refreshSession({ refresh_token: refresh_token! })
        console.log('[auth.bootstrap] refreshSession fallback', { hasError: !!r.error, hasSession: !!r.data?.session })
      } catch {}
    }
    // Force-read once to ensure persistence
    const s = await supabase.auth.getSession()
    console.log('[auth.bootstrap] getSession after persist', { hasSession: !!s.data?.session })
    // Clean URL
    try { window.location.hash = '' } catch {}
    try {
      const cleanUrl = window.location.pathname + window.location.search
      window.history.replaceState({}, document.title, cleanUrl)
    } catch {}
    return true
  } catch (_e) {
    return false
  }
}

// Helper to invoke Edge Functions with user JWT and good errors
export async function callFn<T = unknown>(
  name: string,
  opts: { body?: Record<string, unknown>; token?: string; timeoutMs?: number } = {}
) {
  // Resolve auth token in a robust order: explicit token param → active session token → none
  // We do this here to avoid accidental use of the anon key by the functions client.
  const { data: { session } } = await supabase.auth.getSession()
  const token = opts.token ?? session?.access_token

  const invokePromise = supabase.functions.invoke(name, {
    body: opts.body ?? {},
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  const timeoutMs = opts.timeoutMs ?? 60000
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
  )

  const { data, error } = await Promise.race([invokePromise, timeoutPromise])
  if (error) {
    const errorObj = error as { message?: string; error?: string }
    const msg = errorObj?.message ?? errorObj?.error ?? 'Function error'
    throw new Error(msg)
  }
  return data as T
}

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signInWithProvider = (provider: 'google' | 'github' | 'linkedin_oidc') =>
  supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
      scopes: provider === 'linkedin_oidc' ? 'openid profile email' : undefined,
    },
  })

export const signOut = () => supabase.auth.signOut()

// Helper for authenticated REST calls with timeout
export async function restFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number; token?: string } = {}
): Promise<Response> {
  console.log('[DEBUG] restFetch called with path:', path);
  const { timeoutMs = 20000, token, ...fetchInit } = init
  
  // Resolve token quickly to avoid hangs
  let accessToken = token
  if (!accessToken) {
    console.log('[DEBUG] No token provided, attempting to resolve...');
    try {
      console.log('[DEBUG] Starting getSession with timeout...');
      const authTimeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timed out')), 2500))
      const result = (await Promise.race([
        supabase.auth.getSession(),
        authTimeout,
      ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>
      console.log('[DEBUG] getSession completed:', { hasSession: !!result?.data?.session, hasToken: !!result?.data?.session?.access_token });
      accessToken = result?.data?.session?.access_token
    } catch (e) {
      console.log('[DEBUG] getSession failed:', e);
      // Don't do any fallback - fail fast instead of hanging
      throw new Error('Authentication failed - please refresh and sign in again');
    }
  }
  
  console.log('[DEBUG] Final token resolved:', { hasToken: !!accessToken, tokenLength: accessToken?.length });
  if (!accessToken) throw new Error('Not authenticated')

  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.log('[DEBUG] Timeout triggered, aborting request');
    controller.abort('client-timeout')
  }, timeoutMs)

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1${path}`
    console.log('[DEBUG] Making fetch request to:', url);
    console.log('[DEBUG] Request headers:', {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
      'Authorization': accessToken ? 'Bearer [present]' : 'missing',
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(url, {
      ...fetchInit,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...fetchInit.headers,
      },
      signal: controller.signal,
    })
    
    console.log('[DEBUG] Fetch completed with status:', response.status);
    console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
    return response
  } catch (fetchError) {
    console.error('[DEBUG] Fetch error occurred:', fetchError);
    console.error('[DEBUG] Error name:', (fetchError as Error)?.name);
    console.error('[DEBUG] Error message:', (fetchError as Error)?.message);
    throw fetchError
  } finally {
    console.log('[DEBUG] Clearing timeout');
    clearTimeout(timeoutId)
  }
}

// Direct REST API query that bypasses the hanging supabase client
export async function queryDirectly(
  table: string,
  options: {
    select?: string
    eq?: { column: string; value: string }
    limit?: number
    timeoutMs?: number
    token?: string
  } = {}
): Promise<any> {
  const { select = '*', eq, limit, timeoutMs = 10000, token } = options
  
  // Use provided token or try to get session (but session might hang)
  let authToken = token
  if (!authToken) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      authToken = session?.access_token
    } catch (sessionError) {
      console.error('[queryDirectly] Session error:', sessionError)
      throw new Error('Authentication failed')
    }
  }
  
  if (!authToken) {
    throw new Error('Not authenticated - no token available')
  }
  
  // Build query parameters
  const params = new URLSearchParams()
  params.append('select', select)
  if (eq) {
    params.append(eq.column, `eq.${eq.value}`)
  }
  if (limit) {
    params.append('limit', limit.toString())
  }
  
  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.log(`[queryDirectly] Aborting ${table} query after ${timeoutMs}ms`)
    controller.abort('client-timeout')
  }, timeoutMs)
  
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${params.toString()}`
    console.log(`[queryDirectly] Querying ${table}:`, url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    console.log(`[queryDirectly] ${table} response:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[queryDirectly] ${table} error:`, errorText)
      throw new Error(`Query ${table} failed: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`[queryDirectly] ${table} data:`, data)
    return data
  } catch (fetchError) {
    clearTimeout(timeoutId)
    console.error(`[queryDirectly] ${table} error:`, fetchError)
    throw fetchError
  }
}

// Direct Edge Function caller that bypasses the hanging supabase.functions.invoke
export async function callEdgeFunction<T = unknown>(
  name: string,
  opts: { body?: Record<string, unknown>; token?: string; timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 90000, body = {}, token } = opts
  
  // Get session for auth
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('[callEdgeFunction] Session error:', sessionError)
    throw new Error(`Session error: ${sessionError.message}`)
  }
  
  const authToken = token ?? session?.access_token
  
  console.log('[callEdgeFunction] Auth debug:', {
    hasExplicitToken: !!token,
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    tokenLength: authToken?.length,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : 'unknown'
  })
  
  if (!authToken) {
    console.error('[callEdgeFunction] No auth token available. Session:', !!session)
    throw new Error('Not authenticated - please sign in first')
  }
  
  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.log(`[callEdgeFunction] Aborting ${name} after ${timeoutMs}ms`)
    controller.abort('client-timeout')
  }, timeoutMs)
  
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`
    console.log(`[callEdgeFunction] Calling ${name} at ${url}`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    console.log(`[callEdgeFunction] ${name} response:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[callEdgeFunction] ${name} error:`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Function ${name} failed: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`[callEdgeFunction] ${name} success:`, data)
    return data as T
  } catch (fetchError) {
    clearTimeout(timeoutId)
    console.error(`[callEdgeFunction] ${name} error:`, fetchError)
    throw fetchError
  }
}

// Ensures a profile row exists for the authenticated user
export async function ensureProfile(tokenOverride?: string): Promise<void> {
  let token = tokenOverride
  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      token = session?.access_token ?? undefined
    } catch (e) {
      console.warn('[ensureProfile] getSession failed; continuing without ensure', e)
      return
    }
  }
  if (!token) return

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('client-timeout'), 10000)
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure_profile`
    await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}