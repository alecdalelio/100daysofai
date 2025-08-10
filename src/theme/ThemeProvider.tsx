import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void }

const ThemeContext = createContext<Ctx | undefined>(undefined)

const STORAGE_KEY = 'theme'

function applyClass(t: Theme) {
  const el = document.documentElement
  if (t === 'dark') el.classList.add('dark')
  else el.classList.remove('dark')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial: Theme = (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark'
  const [theme, setThemeState] = useState<Theme>(initial)

  useEffect(() => {
    applyClass(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const api = useMemo<Ctx>(() => ({
    theme,
    setTheme: (t) => setThemeState(t),
    toggleTheme: () => setThemeState((p) => (p === 'dark' ? 'light' : 'dark')),
  }), [theme])

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}


