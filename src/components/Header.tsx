import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../auth/AuthProvider'
import { useEffect, useRef, useState } from 'react'
import { supabase, signOut, queryDirectly } from '../lib/supabase'
import { Profile } from '../lib/types'

export default function Header() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [hasSyllabus, setHasSyllabus] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
    if (!userId) { setProfile(null); return }
    
    const loadProfile = async () => {
      if (!userId) { setProfile(null); return }
      try {
        const rows = await queryDirectly('profiles', { select: '*', eq: { column: 'id', value: userId }, limit: 1 })
        const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        if (mounted) setProfile(data as Profile | null)
      } catch (e) {
        console.error('[Header] Failed to load profile via direct fetch:', e)
      }
    }
    
    const loadData = async () => {
      await loadProfile()
      // check syllabus once
      const { data: syl } = await supabase.from('syllabi').select('id').eq('user_id', userId).limit(1)
      if (mounted) setHasSyllabus(!!(syl && syl.length))
    }
    
    loadData()

    // realtime updates for this user's profile
    const channel = supabase
      .channel('profile-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
        if (mounted) loadProfile()
      })
      .subscribe()

    // listen for explicit save event from Account page
    const onProfileSaved = () => { if (mounted) loadProfile() }
    window.addEventListener('profile:saved', onProfileSaved)

    return () => {
      mounted = false
      window.removeEventListener('profile:saved', onProfileSaved)
      supabase.removeChannel(channel)
    }
  }, [userId])

  // close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="w-full sticky top-0 z-40 bg-white/80 dark:bg-black/70 backdrop-blur border-b border-gray-200 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">100 Days</Link>
        <nav className="flex items-center gap-4">
          <Link to="/log">Explore</Link>
          {userId ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 focus-ring"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {profile?.avatar_url ? (
                  profile.avatar_url.startsWith('grad-') ? (
                    <div
                      className={`h-7 w-7 rounded-full ${
                        profile.avatar_url === 'grad-1' ? 'bg-gradient-to-tr from-pink-500 to-yellow-500' :
                        profile.avatar_url === 'grad-2' ? 'bg-gradient-to-tr from-blue-500 to-green-400' :
                        profile.avatar_url === 'grad-3' ? 'bg-gradient-to-tr from-purple-500 to-pink-400' :
                        profile.avatar_url === 'grad-4' ? 'bg-gradient-to-tr from-teal-400 to-cyan-500' :
                        profile.avatar_url === 'grad-5' ? 'bg-gradient-to-tr from-orange-400 to-red-500' :
                        profile.avatar_url === 'grad-6' ? 'bg-gradient-to-tr from-indigo-500 to-sky-400' :
                        ''
                      }`}
                    />
                  ) : (
                    <img src={profile.avatar_url} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                  )
                ) : (
                  <div className="h-7 w-7 rounded-full border border-gray-300 dark:border-white/20 bg-white/60 dark:bg-white/10" />
                )}
                <span className="text-gray-900 dark:text-gray-100">{profile?.username || profile?.display_name || 'Account'}</span>
              </button>
              <div
                role="menu"
                className={`absolute right-0 mt-2 w-44 z-50 ${menuOpen ? 'block' : 'hidden'} card shadow-xl`}
              >
                <Link
                  to="/account"
                  className="block px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                {!hasSyllabus && (
                  <Link
                    to="/onboarding"
                    className="block px-3 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Create your syllabus
                  </Link>
                )}
                <Link
                  to="/my/logs"
                  className="block px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  My Logs
                </Link>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  role="menuitem"
                  onClick={async () => { 
                    setMenuOpen(false); 
                    console.log('[Header] Force sign out - clearing all data');
                    
                    // Nuclear option: clear everything manually
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Clear all cookies
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    
                    // Immediate redirect
                    window.location.href = '/';
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary focus-ring">Log in</Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}


