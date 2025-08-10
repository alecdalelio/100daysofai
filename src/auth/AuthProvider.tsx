import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setLoading(false)
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
