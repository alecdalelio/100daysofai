export type CachedProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_gradient: string | null
  time_zone?: string | null
}

export function projectRef(): string {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL!).host.split('.')[0]
  } catch (_e) {
    return ''
  }
}

const lastKey = (): string => `profile:${projectRef()}:last`

export function readLastProfile(): CachedProfile | null {
  try {
    const v = localStorage.getItem(lastKey())
    return v ? (JSON.parse(v) as CachedProfile) : null
  } catch (_e) {
    return null
  }
}

export function writeLastProfile(p: CachedProfile): void {
  try {
    localStorage.setItem(lastKey(), JSON.stringify(p))
  } catch (_e) {
    // ignore quota/availability errors
  }
}


