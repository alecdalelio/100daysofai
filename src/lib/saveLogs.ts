import { supabase } from './supabase'

export interface LogEntryData {
  day: number
  title: string
  summary: string
  content: string
  is_published: boolean
  tags?: string[]
  tools?: string[]
  minutes?: number
  mood?: string
}

export interface SaveLogResult {
  success: boolean
  logId?: string
  error?: string
}

export async function saveLogEntry(logData: LogEntryData): Promise<SaveLogResult> {
  try {
    console.log('[saveLogEntry] Starting to save log:', logData.title)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[saveLogEntry] Auth error:', authError)
      return {
        success: false,
        error: 'Authentication required. Please log in and try again.'
      }
    }

    // Validate mood against database constraints
    const allowedMoods = ['😄', '😊', '🙂', '😐', '😕', '😫']
    const validatedMood = logData.mood && allowedMoods.includes(logData.mood) 
      ? logData.mood 
      : null  // Let database handle null mood

    // Prepare log data for database
    const logEntry = {
      user_id: user.id,
      day: logData.day,
      title: logData.title.trim(),
      summary: logData.summary?.trim() || null,
      content: logData.content.trim(),
      is_published: logData.is_published,
      tags: logData.tags || [],
      tools: logData.tools || [],
      minutes_spent: logData.minutes || null,
      mood: validatedMood
    }

    console.log('[saveLogEntry] Prepared log entry:', { ...logEntry, content: logEntry.content.substring(0, 100) + '...' })

    // Save to database
    const { data, error } = await supabase
      .from('logs')
      .insert(logEntry)
      .select('id')
      .single()

    if (error) {
      console.error('[saveLogEntry] Database error:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A log entry for this day already exists. Please update the existing entry or choose a different day.'
        }
      }
      
      return {
        success: false,
        error: `Failed to save log entry: ${error.message}`
      }
    }

    console.log('[saveLogEntry] Successfully saved log with ID:', data.id)
    
    return {
      success: true,
      logId: data.id
    }

  } catch (error) {
    console.error('[saveLogEntry] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function updateLogEntry(logId: string, logData: Partial<LogEntryData>): Promise<SaveLogResult> {
  try {
    console.log('[updateLogEntry] Starting to update log:', logId)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required. Please log in and try again.'
      }
    }

    // Validate mood if provided
    const allowedMoods = ['😄', '😊', '🙂', '😐', '😕', '😫']
    
    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    
    if (logData.title !== undefined) updateData.title = logData.title.trim()
    if (logData.summary !== undefined) updateData.summary = logData.summary?.trim() || null
    if (logData.content !== undefined) updateData.content = logData.content.trim()
    if (logData.is_published !== undefined) updateData.is_published = logData.is_published
    if (logData.tags !== undefined) updateData.tags = logData.tags
    if (logData.tools !== undefined) updateData.tools = logData.tools
    if (logData.minutes !== undefined) updateData.minutes_spent = logData.minutes
    if (logData.mood !== undefined) {
      updateData.mood = logData.mood && allowedMoods.includes(logData.mood) ? logData.mood : null
    }
    if (logData.day !== undefined) updateData.day = logData.day

    // Update in database
    const { error } = await supabase
      .from('logs')
      .update(updateData)
      .eq('id', logId)
      .eq('user_id', user.id) // Ensure user can only update their own logs

    if (error) {
      console.error('[updateLogEntry] Database error:', error)
      return {
        success: false,
        error: `Failed to update log entry: ${error.message}`
      }
    }

    console.log('[updateLogEntry] Successfully updated log:', logId)
    
    return {
      success: true,
      logId
    }

  } catch (error) {
    console.error('[updateLogEntry] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
