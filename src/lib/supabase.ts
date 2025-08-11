import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars.')
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

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

export const signInWithProvider = (provider: 'google' | 'github') =>
  supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  })

export const signOut = () => supabase.auth.signOut()

// Helper for authenticated REST calls with timeout
export async function restFetch(
  path: string, 
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 20000, ...fetchInit } = init
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort('client-timeout')
  }, timeoutMs)

  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1${path}`
    console.log('[restFetch] POST', url)
    
    const response = await fetch(url, {
      ...fetchInit,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...fetchInit.headers,
      },
      signal: controller.signal,
    })
    
    console.log('[restFetch] Response:', response.status)
    return response
  } catch (fetchError) {
    console.error('[restFetch] Error:', fetchError)
    throw fetchError
  } finally {
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
export async function ensureProfile(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('client-timeout'), 10000)
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure_profile`
    await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}