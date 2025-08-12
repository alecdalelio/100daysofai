import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-full',
        'border border-white/15 bg-black/40 backdrop-blur',
        'shadow-none ring-0 transition-all duration-150',
        'hover:border-white/30',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-fuchsia-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
      ].join(' ')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="text-base leading-none">{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}


