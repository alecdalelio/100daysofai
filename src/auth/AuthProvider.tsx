import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, ensureProfile, bootstrapSessionFromHash } from '../lib/supabase'
import { writeLastProfile, CachedProfile } from '../lib/profileCache'

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']

type AuthContextType = {
  session: Session | null
  userId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  userId: null,
  loading: true,
})

function normalize(row: any): CachedProfile {
  return {
    id: row.id,
    username: row.username ?? null,
    display_name: row.display_name ?? row.displayName ?? null,
    avatar_gradient: row.avatar_gradient ?? row.avatar_url ?? null,
    time_zone: row.time_zone ?? null,
  }
}

async function fetchProfileAndWarm(uid: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_gradient, avatar_url, time_zone')
    .eq('id', uid)
    .maybeSingle()
  if (!error && data) writeLastProfile(normalize(data))
}

function warmFromSession(sess: Session | null) {
  const u = sess?.user
  if (!u) return
  const fallback: CachedProfile = {
    id: u.id,
    username:
      (u.user_metadata as any)?.name ??
      (u.user_metadata as any)?.full_name ??
      (u.email ? u.email.split('@')[0] : null),
    display_name: null,
    avatar_gradient: 'grad-1',
    time_zone: null,
  }
  writeLastProfile(fallback)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      // Persist session from OAuth hash first if present
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        await bootstrapSessionFromHash()
      }
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
      const uid = data.session?.user?.id
      if (uid) {
        warmFromSession(data.session)
        try { await ensureProfile() } catch (_) {}
        void fetchProfileAndWarm(uid)
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setLoading(false)
      const uid = newSession?.user?.id
      if (uid && ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        warmFromSession(newSession)
        try { await ensureProfile() } catch (_) {}
        void fetchProfileAndWarm(uid)
      }
      // naive redirect once after login if no syllabus exists
      if (newSession?.user) {
        const { data: syl } = await supabase.from('syllabi').select('id').eq('user_id', newSession.user.id).limit(1)
        if ((!syl || syl.length === 0) && window.location.pathname !== '/onboarding') {
          window.location.assign('/onboarding')
        }
      }
    })
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      session,
      userId: session?.user?.id ?? null,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
