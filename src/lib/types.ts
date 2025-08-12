// Basic Supabase database types
export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface LogEntry {
  id: string
  user_id: string
  day: number
  title: string
  summary?: string
  content: string
  is_published: boolean
  created_at: string
  updated_at?: string
  profiles?: {
    username: string | null
    display_name: string | null
  }
}

export interface Syllabus {
  id: string
  user_id: string
  title: string
  description: string
  topics: string[]
  duration_weeks: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
  plan?: {
    title?: string
    summary?: string
    duration_days?: number
    weekly_hours?: number
    tracks?: Array<{
      name: string
      objective?: string
      milestones?: Array<{ title: string; day: number }>
      weeks?: Array<{
        week: number
        theme: string
        tasks?: Array<{ day: number; task: string }>
        resources?: Array<{ title: string; url: string }>
      }>
    }>
  }
}

// API response helpers
export type DatabaseResult<T> = T | null
export type DatabaseError = Error | null