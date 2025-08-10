import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useEffect, useState } from 'react'
import { supabase, signOut } from '../lib/supabase'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export default function Header() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) { setProfile(null); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (mounted) setProfile(data as any)
    }
    load()
    return () => { mounted = false }
  }, [userId])

  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">100 Days</Link>
        <nav className="flex items-center gap-3">
          <Link to="/log">Explore</Link>
          {userId ? (
            <div className="relative group">
              <button className="flex items-center gap-2">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                  : <div className="h-7 w-7 rounded-full border" />}
                <span>{profile?.username ?? 'Account'}</span>
              </button>
              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded shadow min-w-40">
                <Link className="block px-3 py-2 hover:bg-gray-50" to="/account">Account</Link>
                <Link className="block px-3 py-2 hover:bg-gray-50" to="/my/logs">My Logs</Link>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={async () => { await signOut(); navigate('/'); }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="border rounded px-3 py-1.5">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  )
}


