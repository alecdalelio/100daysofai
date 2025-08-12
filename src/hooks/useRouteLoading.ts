import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Lightweight variant for non-data routers: debounce showing the loader,
// then keep it visible for a minimum duration to avoid flicker.
export function useRouteLoading(minVisibleMs = 500, showDelayMs = 200) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const showTimer = setTimeout(() => {
      if (cancelled) return
      setVisible(true)
      hideTimer = setTimeout(() => {
        if (!cancelled) setVisible(false)
      }, minVisibleMs)
    }, showDelayMs)

    return () => {
      cancelled = true
      clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [location.key, minVisibleMs, showDelayMs])

  return visible
}


