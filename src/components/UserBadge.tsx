import React, { useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { gradientClass } from '@/constants/gradients'
import { supabase } from '@/lib/supabase'
import { readLastProfile } from '@/lib/profileCache'

export default function UserBadge() {
  const { profile } = useProfile()
  const cached = readLastProfile()
  const initialName = cached?.username || cached?.display_name || null
  const [name, setName] = useState<string | null>(initialName)
  const [grad, setGrad] = useState<string>(profile?.avatar_gradient ?? cached?.avatar_gradient ?? 'grad-1')
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false)
  const [sessName, setSessName] = useState<string | null>(null)

  // Prefer live profile when it lands
  useEffect(() => {
    const live = profile?.username || profile?.display_name || null
    if (live && live !== name) setName(live)
    if (profile?.avatar_gradient) setGrad(profile.avatar_gradient)
    if (live) setShowSkeleton(false)
  }, [profile])

  useEffect(() => {
    if (name) return
    let mounted = true
    // fetch session name for fallback
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const u = data?.session?.user
      const sname = (u?.user_metadata?.name || u?.user_metadata?.full_name || (u?.email ? u.email.split('@')[0] : null)) ?? null
      setSessName(sname)
    })
    // after a short delay, stop skeleton even if username not ready
    const t = setTimeout(() => { if (mounted) setShowSkeleton(false) }, 1200)
    return () => { mounted = false; clearTimeout(t) }
  }, [name])

  return (
    <span data-testid="user-badge" className="inline-flex items-center gap-2" aria-busy={showSkeleton}>
      {showSkeleton ? (
        <>
          <i data-testid="user-badge-dot" className="h-5 w-5 rounded-full bg-white/20 animate-pulse" />
          <span
            data-testid="user-badge-skeleton-name"
            className="inline-block h-4 w-16 rounded bg-white/20 animate-pulse"
            aria-hidden
          />
        </>
      ) : (
        <>
          <i data-testid="user-badge-dot" className={`h-5 w-5 rounded-full ${gradientClass(grad)}`} />
          <span data-testid="user-badge-name" className="text-sm">{name || sessName || 'Account'}</span>
        </>
      )}
    </span>
  )
}


