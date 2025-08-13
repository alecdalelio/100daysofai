import { useEffect, useState } from 'react'
import { useProgress } from './useProgress'
import { isMilestoneDay } from '@/lib/linkedinShare'

export interface MilestoneInfo {
  day: number
  totalEntries: number
  type: 'major' | 'minor'
  isNew: boolean
  message: string
}

/**
 * Hook to detect and manage learning milestones
 */
export function useMilestones() {
  const { day, totalEntries } = useProgress({ countDrafts: true })
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneInfo | null>(null)
  const [hasShownMilestone, setHasShownMilestone] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!day || day <= 0) return

    // Check if this day is a milestone and hasn't been shown yet
    if (isMilestoneDay(day) && !hasShownMilestone[day]) {
      const milestoneType = [25, 50, 75, 100].includes(day) ? 'major' : 'minor'
      
      const messages = {
        25: '🎯 First quarter complete! You\'re building momentum.',
        50: '🔥 Halfway there! Your consistency is paying off.',
        75: '💪 In the home stretch! The finish line is in sight.',
        100: '🎉 Challenge complete! You\'ve achieved something amazing.',
      }

      const defaultMessage = `🚀 Day ${day} milestone reached! Keep up the great work.`
      const message = messages[day as keyof typeof messages] || defaultMessage

      setCurrentMilestone({
        day,
        totalEntries,
        type: milestoneType,
        isNew: true,
        message
      })
    }
  }, [day, totalEntries, hasShownMilestone])

  const markMilestoneAsShown = (milestoneDay: number) => {
    setHasShownMilestone(prev => ({
      ...prev,
      [milestoneDay]: true
    }))
    setCurrentMilestone(null)
  }

  const dismissMilestone = () => {
    if (currentMilestone) {
      markMilestoneAsShown(currentMilestone.day)
    }
  }

  return {
    currentMilestone,
    markMilestoneAsShown,
    dismissMilestone,
    hasMilestone: !!currentMilestone
  }
}

/**
 * Hook to get milestone sharing suggestions based on recent activity
 */
export function useMilestoneSuggestions() {
  const { day, totalEntries } = useProgress({ countDrafts: true })
  
  const getSharingSuggestions = () => {
    const suggestions = []

    // Weekly sharing suggestion (every 7 days)
    if (day > 0 && day % 7 === 0) {
      suggestions.push({
        type: 'weekly' as const,
        day,
        message: `Share your week ${Math.ceil(day / 7)} progress`,
        priority: 'medium' as const
      })
    }

    // Major milestone suggestion
    if ([25, 50, 75, 100].includes(day)) {
      suggestions.push({
        type: 'milestone' as const,
        day,
        message: `Celebrate your Day ${day} achievement!`,
        priority: 'high' as const
      })
    }

    // Minor milestone suggestion
    if (day % 10 === 0 && day > 0 && ![25, 50, 75, 100].includes(day)) {
      suggestions.push({
        type: 'milestone' as const,
        day,
        message: `Share your Day ${day} progress`,
        priority: 'low' as const
      })
    }

    return suggestions
  }

  return {
    suggestions: getSharingSuggestions(),
    currentDay: day,
    totalEntries
  }
}