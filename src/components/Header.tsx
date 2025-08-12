import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../auth/AuthProvider'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { gradientClass } from '@/constants/gradients'
import { useProfile } from '@/hooks/useProfile'
import UserBadge from '@/components/UserBadge'

export default function Header() {
  const { userId } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [hasSyllabus, setHasSyllabus] = useState<boolean>(true)

  useEffect(() => {
    console.log('[Header] visible profile', profile)
  }, [profile])

  // Temporary assert to ensure the shared UserBadge is mounted
  useEffect(() => {
    const el = document.querySelector('[data-testid="user-badge-name"]') as HTMLElement | null
    console.log('[Header] badge present =', !!el, 'text =', el?.textContent)
  })

  // Still listen to profile:saved for logs, but store already updates proactively
  useEffect(() => {
    const onSaved = (ev: Event) => {
      console.log('[Header] received profile:saved', (ev as CustomEvent).detail)
    }
    window.addEventListener('profile:saved', onSaved)
    return () => window.removeEventListener('profile:saved', onSaved)
  }, [])

  // Fallback: boot-time hydrate from last saved local cache and session user
  useEffect(() => {
    if (!profile) {
      try {
        const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).host.split('.')[0]
        const raw = localStorage.getItem(`profile:${projectRef}:last`)
        if (raw) {
          const parsed = JSON.parse(raw)
          console.log('[Header] hydrate from cache', parsed)
        }
      } catch (_e) { /* noop */ }
    }
  }, [profile])

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

  const display = profile?.display_name || profile?.username || 'Account'
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
                className={[
                  'inline-flex items-center rounded-full px-2 py-1',
                  'border border-white/15 bg-black/40 backdrop-blur',
                  'shadow-none ring-0 transition-all duration-150',
                  'hover:border-white/30',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-fuchsia-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                  // add a visible purple outline only while menu is open
                  menuOpen ? 'ring-2 ring-fuchsia-400/40 ring-offset-2 ring-offset-black' : '',
                ].join(' ')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <UserBadge />
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
                  aria-label={display}
                >
                  <UserBadge />
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


