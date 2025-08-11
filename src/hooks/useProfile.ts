import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_gradient: string | null
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProfile(null); setIsLoading(false); return }
    userIdRef.current = user.id
    setIsLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_gradient, avatar_url')
      .eq('id', user.id)
      .single()
    const mapped: ProfileRow | null = data
      ? {
          id: (data as any).id,
          username: (data as any).username ?? null,
          display_name: (data as any).display_name ?? null,
          avatar_gradient: (data as any).avatar_gradient ?? (data as any).avatar_url ?? null,
        }
      : null
    setProfile(mapped)
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    const id = userIdRef.current
    if (!id) return
    channel = supabase
      .channel('profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${id}` }, fetchProfile)
      .subscribe()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [fetchProfile])

  return { profile, isLoading, refresh: fetchProfile }
}

export async function updateProfile(partial: Partial<Omit<ProfileRow, 'id'>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...partial })
    .select('id, username, display_name, avatar_gradient, avatar_url')
    .single()
  if (error) throw error
  const mapped: ProfileRow = {
    id: (data as any).id,
    username: (data as any).username ?? null,
    display_name: (data as any).display_name ?? null,
    avatar_gradient: (data as any).avatar_gradient ?? (data as any).avatar_url ?? null,
  }
  return mapped
}


