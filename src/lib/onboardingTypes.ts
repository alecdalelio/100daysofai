// Enhanced onboarding system types and data structures

export type ExperienceLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type ProgrammingLevel = 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert'
export type MathLevel = 'basic' | 'college' | 'professional' | 'advanced'

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading'
export type ProjectPreference = 'theory-first' | 'project-first' | 'balanced'
export type AccountabilityLevel = 'private' | 'community' | 'public'

export interface TimeAvailability {
  dailyHours: number
  preferredTimes: string[]
  weekendLearning: boolean
  flexibleSchedule: boolean
}

export interface ExperienceLevels {
  ai_ml: ExperienceLevel
  programming: ProgrammingLevel
  math_stats: MathLevel
}

export interface EnhancedOnboardingData {
  // Step 1: Welcome & Learning Assessment
  learningStyles: LearningStyle[]
  currentRole: string
  industry: string
  motivation: string[]
  
  // Step 2: Experience Level Assessment
  experienceLevels: ExperienceLevels
  previousAIExperience: string[]
  
  // Step 3: Goal Categories & Personalized Paths
  primaryGoals: string[]
  learningTrack: string
  projectPreference: ProjectPreference
  
  // Step 4: Learning Path Customization
  industryTrack?: string
  specialization?: string
  
  // Step 5: Smart Scheduling
  timeAvailability: TimeAvailability
  learningPace: 'intensive' | 'steady' | 'relaxed'
  duration_days: number
  
  // Step 6: Engagement Preferences
  progressTrackingStyle: 'detailed' | 'simple'
  communityInvolvement: boolean
  challengeLevel: 'comfortable' | 'stretch'
  feedbackFrequency: 'daily' | 'weekly'
  
  // Step 7: Success Metrics
  successMetrics: string[]
  accountabilityLevel: AccountabilityLevel
  milestonePreferences: string[]
  
  // Legacy compatibility
  weekly_hours: number
  focus_areas: string[]
  output_preferences: string[]
  note?: string
}

// Goal options by experience level
export const BEGINNER_GOALS = [
  'Understand what AI actually is and how it works',
  'Build my first AI project from scratch',
  'Learn Python programming for AI/ML',
  'Understand how ChatGPT and LLMs work',
  'Prepare for AI-related job interviews',
  'Explore AI career opportunities',
  'Build a portfolio of AI projects'
]

export const INTERMEDIATE_GOALS = [
  'Build production-ready AI applications',
  'Master specific frameworks (LangChain, HuggingFace, etc.)',
  'Understand AI business applications',
  'Contribute to open-source AI projects',
  'Start an AI side project or startup',
  'Implement MLOps and model deployment',
  'Learn advanced ML algorithms'
]

export const ADVANCED_GOALS = [
  'Research novel AI techniques',
  'Scale AI systems in production',
  'Lead AI initiatives at my company',
  'Publish AI research or papers',
  'Build AI products that generate revenue',
  'Mentor other AI practitioners',
  'Contribute to cutting-edge AI research'
]

// Learning tracks and specializations
export const LEARNING_TRACKS = {
  'generalist': {
    name: 'Full-Stack AI Developer',
    description: 'Broad understanding of AI with practical implementation skills',
    focus: ['fundamentals', 'practical-projects', 'deployment']
  },
  'ml-engineer': {
    name: 'Machine Learning Engineer',
    description: 'Focus on building and deploying ML models in production',
    focus: ['algorithms', 'mlops', 'scalability']
  },
  'data-scientist': {
    name: 'Data Scientist',
    description: 'Data analysis, statistical modeling, and insights generation',
    focus: ['statistics', 'analysis', 'visualization']
  },
  'ai-researcher': {
    name: 'AI Researcher',
    description: 'Deep understanding of AI theory and cutting-edge research',
    focus: ['theory', 'research', 'innovation']
  },
  'product-manager': {
    name: 'AI Product Manager',
    description: 'Understanding AI capabilities for product and business decisions',
    focus: ['business-applications', 'strategy', 'ethics']
  },
  'entrepreneur': {
    name: 'AI Entrepreneur',
    description: 'Building AI-powered products and startups',
    focus: ['product-development', 'business-model', 'market-fit']
  }
}

// Industry-specific tracks
export const INDUSTRY_TRACKS = {
  'healthcare': 'Healthcare AI',
  'finance': 'FinTech & Finance AI',
  'ecommerce': 'E-commerce & Marketing AI',
  'gaming': 'Gaming & Entertainment AI',
  'education': 'Educational Technology',
  'automotive': 'Autonomous Systems',
  'cybersecurity': 'AI Security & Privacy',
  'general': 'General Software Development'
}

// Current roles
export const CURRENT_ROLES = [
  'Student',
  'Software Developer',
  'Data Analyst',
  'Product Manager',
  'Researcher',
  'Consultant',
  'Manager/Executive',
  'Designer',
  'Marketing Professional',
  'Career Switcher',
  'Entrepreneur',
  'Other'
]

// Learning styles
export const LEARNING_STYLE_OPTIONS = [
  { value: 'visual', label: 'Visual', description: 'Diagrams, charts, and visual content' },
  { value: 'auditory', label: 'Auditory', description: 'Lectures, discussions, and audio content' },
  { value: 'kinesthetic', label: 'Hands-on', description: 'Interactive exercises and practical work' },
  { value: 'reading', label: 'Reading/Writing', description: 'Text-based content and documentation' }
]

// Time slot options
export const TIME_SLOTS = [
  'Early Morning (6-9 AM)',
  'Morning (9-12 PM)',
  'Afternoon (12-5 PM)',
  'Evening (5-8 PM)',
  'Night (8-11 PM)',
  'Late Night (11 PM+)'
]

// Success metrics options
export const SUCCESS_METRICS = [
  'Complete a portfolio of 3-5 AI projects',
  'Land an AI-related job or internship',
  'Contribute to open-source AI projects',
  'Build and deploy a production AI app',
  'Write technical blog posts about AI',
  'Speak at conferences or meetups',
  'Start an AI-powered business',
  'Publish research or papers',
  'Master specific AI frameworks/tools',
  'Achieve AI certifications'
]

// Motivation options
export const MOTIVATION_OPTIONS = [
  'Career advancement',
  'Personal curiosity and learning',
  'Building a side project',
  'Starting a business',
  'Academic/research goals',
  'Staying current with technology',
  'Solving specific problems',
  'Creative expression'
]

// Previous AI experience options
export const AI_EXPERIENCE_OPTIONS = [
  'Never worked with AI before',
  'Completed online courses/tutorials',
  'Built simple AI projects',
  'Used AI tools like ChatGPT professionally',
  'Worked on AI projects at work',
  'Have formal AI education',
  'Published AI research'
]

// Helper functions
export function getGoalsByExperience(aiLevel: ExperienceLevel): string[] {
  switch (aiLevel) {
    case 'novice':
    case 'beginner':
      return BEGINNER_GOALS
    case 'intermediate':
      return INTERMEDIATE_GOALS
    case 'advanced':
    case 'expert':
      return ADVANCED_GOALS
    default:
      return BEGINNER_GOALS
  }
}

export function getRecommendedTrack(
  experienceLevels: ExperienceLevels,
  currentRole: string,
  goals: string[]
): string {
  // Simple recommendation logic - can be enhanced with ML later
  const { ai_ml, programming } = experienceLevels
  
  if (currentRole.includes('Product') || currentRole.includes('Manager')) {
    return 'product-manager'
  }
  
  if (currentRole.includes('Researcher') || goals.some(g => g.includes('research'))) {
    return 'ai-researcher'
  }
  
  if (currentRole.includes('Entrepreneur') || goals.some(g => g.includes('startup'))) {
    return 'entrepreneur'
  }
  
  if (programming === 'advanced' || programming === 'expert') {
    return ai_ml === 'novice' || ai_ml === 'beginner' ? 'generalist' : 'ml-engineer'
  }
  
  if (currentRole.includes('Data') || currentRole.includes('Analyst')) {
    return 'data-scientist'
  }
  
  return 'generalist' // Default recommendation
}

export function calculateWeeklyHours(timeAvailability: TimeAvailability): number {
  const { dailyHours, weekendLearning } = timeAvailability
  const weekdayHours = dailyHours * 5
  const weekendHours = weekendLearning ? dailyHours * 2 : 0
  return weekdayHours + weekendHours
}

// Legacy compatibility helpers
export function convertToLegacyFormat(data: EnhancedOnboardingData): any {
  return {
    experience_level: data.experienceLevels.ai_ml === 'novice' ? 'beginner' : data.experienceLevels.ai_ml,
    goals: data.primaryGoals,
    weekly_hours: data.weekly_hours,
    duration_days: data.duration_days,
    focus_areas: data.focus_areas,
    output_preferences: data.output_preferences,
    note: data.note
  }
}