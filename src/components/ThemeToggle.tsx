import { useTheme } from '../theme/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary focus-ring !px-2 !py-1 rounded-full"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="text-base leading-none">{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}


