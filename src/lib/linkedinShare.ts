import { LogEntry } from './types'

// LinkedIn Share API configuration
export interface LinkedInShareOptions {
  text: string
  url?: string
  title?: string
  description?: string
  imageUrl?: string
}

export interface LinkedInPost {
  content: string
  hashtags: string[]
  url?: string
}

// LinkedIn Share API scopes needed:
// - w_member_social (to post on behalf of user)
// - r_liteprofile (basic profile info)
// - r_emailaddress (email access)

/**
 * Format a log entry for LinkedIn sharing
 */
export function formatLogEntryForLinkedIn(entry: LogEntry): LinkedInPost {
  const baseUrl = window.location.origin
  const entryUrl = `${baseUrl}/log/${entry.id}`
  
  // Create engaging LinkedIn post content
  const dayText = `Day ${entry.day} of #100DaysOfAI`
  const title = entry.title
  const summary = entry.summary || 'Another step forward in my AI learning journey!'
  
  const content = `${dayText}: ${title}

${summary}

Building in public and sharing my learning journey. Follow along as I explore AI, machine learning, and cutting-edge technology!

What's your current learning focus? 🤔`

  const hashtags = [
    '100DaysOfAI',
    'MachineLearning',
    'ArtificialIntelligence',
    'TechLearning',
    'BuildInPublic',
    'ContinuousLearning'
  ]

  return {
    content,
    hashtags,
    url: entryUrl
  }
}

/**
 * Format a milestone achievement for LinkedIn sharing
 */
export function formatMilestoneForLinkedIn(day: number, totalEntries: number): LinkedInPost {
  const milestones = {
    25: { emoji: '🎯', message: 'First quarter complete!' },
    50: { emoji: '🔥', message: 'Halfway there!' },
    75: { emoji: '💪', message: 'In the home stretch!' },
    100: { emoji: '🎉', message: 'Challenge complete!' }
  }

  const milestone = milestones[day as keyof typeof milestones]
  
  if (!milestone) {
    return formatDayMilestone(day, totalEntries)
  }

  const content = `${milestone.emoji} Day ${day} of #100DaysOfAI - ${milestone.message}

🚀 ${totalEntries} learning entries documented
📈 Consistent progress in AI and machine learning
🧠 Building expertise one day at a time

The power of showing up daily and learning in public! Each entry represents growth, discovery, and pushing boundaries.

What learning challenge are you tackling? Drop a comment below! 👇

#100DaysOfAI #MachineLearning #ArtificialIntelligence #TechLearning #GrowthMindset #ContinuousLearning #BuildInPublic`

  const hashtags = [
    '100DaysOfAI',
    'MachineLearning', 
    'ArtificialIntelligence',
    'TechLearning',
    'GrowthMindset',
    'ContinuousLearning',
    'BuildInPublic'
  ]

  return {
    content,
    hashtags
  }
}

/**
 * Format a regular day milestone (every 10 days)
 */
function formatDayMilestone(day: number, totalEntries: number): LinkedInPost {
  const content = `Day ${day} of #100DaysOfAI 📚

Another milestone reached! ${totalEntries} learning entries and counting.

Key insights so far:
✨ Consistency beats intensity
🧠 Learning in public accelerates growth  
🤝 Community makes the journey better

The adventure continues... What's next on your learning path?

#100DaysOfAI #MachineLearning #ContinuousLearning`

  const hashtags = [
    '100DaysOfAI',
    'MachineLearning',
    'ContinuousLearning',
    'BuildInPublic'
  ]

  return {
    content,
    hashtags
  }
}

/**
 * Create a weekly learning summary for LinkedIn
 */
export function formatWeeklySummaryForLinkedIn(entries: LogEntry[], weekNumber: number): LinkedInPost {
  const topics = entries.map(e => e.title).slice(0, 3) // Top 3 topics
  const topicsText = topics.length > 0 ? topics.join(', ') : 'AI fundamentals'
  
  const content = `Week ${weekNumber} of #100DaysOfAI - Weekly Wrap-up 📊

This week I dove deep into: ${topicsText}

📈 ${entries.length} new learning entries
🎯 Consistent daily practice
💡 Key breakthroughs and insights documented

Learning in public keeps me accountable and helps others on similar journeys. The compound effect of daily learning is real!

What did you learn this week? Share your wins below! 👇

#100DaysOfAI #WeeklyReflection #MachineLearning #TechLearning #ContinuousLearning`

  const hashtags = [
    '100DaysOfAI',
    'WeeklyReflection',
    'MachineLearning',
    'TechLearning',
    'ContinuousLearning'
  ]

  return {
    content,
    hashtags
  }
}

/**
 * Detect if a day is a milestone worth celebrating
 */
export function isMilestoneDay(day: number): boolean {
  // Major milestones
  if ([25, 50, 75, 100].includes(day)) return true
  
  // Every 10 days for smaller celebrations
  if (day % 10 === 0 && day > 0) return true
  
  return false
}

/**
 * Get the appropriate LinkedIn share content based on context
 */
export function getLinkedInShareContent(context: {
  type: 'entry' | 'milestone' | 'weekly'
  entry?: LogEntry
  day?: number
  totalEntries?: number
  entries?: LogEntry[]
  weekNumber?: number
}): LinkedInPost {
  switch (context.type) {
    case 'entry':
      if (!context.entry) throw new Error('Entry required for entry sharing')
      return formatLogEntryForLinkedIn(context.entry)
    
    case 'milestone':
      if (context.day === undefined || context.totalEntries === undefined) {
        throw new Error('Day and totalEntries required for milestone sharing')
      }
      return formatMilestoneForLinkedIn(context.day, context.totalEntries)
    
    case 'weekly':
      if (!context.entries || context.weekNumber === undefined) {
        throw new Error('Entries and weekNumber required for weekly sharing')
      }
      return formatWeeklySummaryForLinkedIn(context.entries, context.weekNumber)
    
    default:
      throw new Error('Invalid sharing context type')
  }
}

/**
 * Build LinkedIn share URL for browser-based sharing (fallback)
 */
export function buildLinkedInShareUrl(post: LinkedInPost): string {
  const params = new URLSearchParams()
  
  // LinkedIn's share URL format
  params.append('mini', 'true')
  params.append('summary', post.content)
  
  if (post.url) {
    params.append('url', post.url)
  }
  
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`
}

/**
 * Share content to LinkedIn via Share API (requires user token)
 */
export async function shareToLinkedIn(post: LinkedInPost, accessToken: string): Promise<boolean> {
  try {
    // This would require LinkedIn's Share API implementation
    // For now, we'll use the browser-based sharing approach
    console.log('[LinkedIn Share] Would share:', post)
    console.log('[LinkedIn Share] Access token:', accessToken ? 'Present' : 'Missing')
    
    // TODO: Implement actual LinkedIn Share API call
    // Reference: https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
    
    return true
  } catch (error) {
    console.error('[LinkedIn Share] Error:', error)
    return false
  }
}