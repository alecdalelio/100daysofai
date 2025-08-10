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
export async function callFn<T = any>(
  name: string,
  opts: { body?: any; token?: string; timeoutMs?: number } = {}
) {
  const invokePromise = supabase.functions.invoke(name, {
    body: opts.body ?? {},
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
  })

  const timeoutMs = opts.timeoutMs ?? 60000
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
  )

  const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any
  if (error) {
    const msg = (error as any)?.message ?? (error as any)?.error ?? 'Function error'
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