import { supabase } from './supabase'
import { LogEntry } from './types'

type FetchedProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  linkedin_profile_url: string | null
  linkedin_headline: string | null
  linkedin_company: string | null
}

export interface LogsQuery {
  isPublished?: boolean
  userId?: string
  limit?: number
  logId?: string
}

export async function fetchLogsWithProfiles(options: LogsQuery = {}): Promise<LogEntry[]> {
  const { isPublished, userId, limit, logId } = options
  
  try {
    console.log('[fetchLogsWithProfiles] Starting fetch with options:', options)
    const startTime = Date.now()
    
    // 1. Build logs query
    let logsQuery = supabase
      .from('logs')
      .select('id, title, summary, content, day, created_at, user_id, is_published')
    
    // Apply filters
    if (isPublished !== undefined) {
      logsQuery = logsQuery.eq('is_published', isPublished)
    }
    if (userId) {
      logsQuery = logsQuery.eq('user_id', userId)
    }
    if (logId) {
      logsQuery = logsQuery.eq('id', logId)
    }
    
    // Apply ordering and limit
    logsQuery = logsQuery.order('created_at', { ascending: false })
    if (limit) {
      logsQuery = logsQuery.limit(limit)
    }
    
    // Execute logs query
    const { data: logs, error: logsError } = await logsQuery
    
    if (logsError) {
      console.error('[fetchLogsWithProfiles] Logs query error:', logsError)
      throw logsError
    }
    
    if (!logs || logs.length === 0) {
      console.log('[fetchLogsWithProfiles] No logs found')
      return []
    }
    
    // 2. Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))]
    console.log(`[fetchLogsWithProfiles] Found ${userIds.length} unique user IDs`)
    
    // 3. Fetch profiles for those users
    let profiles: FetchedProfile[] = []
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, linkedin_profile_url, linkedin_headline, linkedin_company')
        .in('id', userIds)
      
      if (profilesError) {
        console.error('[fetchLogsWithProfiles] Profiles query error:', profilesError)
        // Don't throw - continue without profiles
        profiles = []
      } else {
        profiles = (profilesData as FetchedProfile[]) || []
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`[fetchLogsWithProfiles] Completed in ${duration}ms - ${logs.length} logs, ${profiles.length} profiles`)
    
    // 4. Join logs with profiles
    const logsWithProfiles: LogEntry[] = logs.map(log => {
      const p = profiles.find(profile => profile.id === log.user_id) || null
      return {
        ...log,
        profiles: p
          ? {
              username: p.username ?? null,
              display_name: p.display_name ?? null,
              // App treats avatar_url as avatar_gradient (could be gradient key or URL)
              avatar_gradient: p.avatar_url ?? null,
              linkedin_profile_url: p.linkedin_profile_url ?? null,
              linkedin_headline: p.linkedin_headline ?? null,
              linkedin_company: p.linkedin_company ?? null,
            }
          : null,
      }
    })
    
    return logsWithProfiles
    
  } catch (error) {
    console.error('[fetchLogsWithProfiles] Error:', error)
    throw error
  }
}

export async function fetchSingleLogWithProfile(logId: string): Promise<LogEntry | null> {
  try {
    console.log(`[fetchSingleLogWithProfile] Fetching log: ${logId}`)
    const results = await fetchLogsWithProfiles({ logId })
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('[fetchSingleLogWithProfile] Error:', error)
    throw error
  }
}