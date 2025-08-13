import { OnboardingCard, SingleSelectGroup, MultiSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, TrendingUp, MessageCircle, Target, Trophy } from 'lucide-react'
import { EnhancedOnboardingData, SUCCESS_METRICS, AccountabilityLevel } from '@/lib/onboardingTypes'

interface Step6PreferencesProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step6Preferences({ data, onUpdate, onNext, onBack }: Step6PreferencesProps) {
  const progressTrackingOptions = [
    {
      value: 'detailed',
      label: 'Detailed Analytics',
      description: 'Comprehensive stats, charts, and progress insights',
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />
    },
    {
      value: 'simple',
      label: 'Simple Tracking',
      description: 'Basic streaks, milestones, and completion status',
      icon: <Target className="h-5 w-5 text-green-500" />
    }
  ]

  const challengeLevelOptions = [
    {
      value: 'comfortable',
      label: 'Comfortable Pace',
      description: 'Gradual difficulty increase, plenty of practice time',
      icon: <Target className="h-5 w-5 text-green-500" />
    },
    {
      value: 'stretch',
      label: 'Stretch Goals',
      description: 'Push boundaries, accelerated learning, challenging projects',
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />
    }
  ]

  const feedbackFrequencyOptions = [
    {
      value: 'daily',
      label: 'Daily Check-ins',
      description: 'Regular feedback and progress updates',
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />
    },
    {
      value: 'weekly',
      label: 'Weekly Reviews',
      description: 'Comprehensive weekly progress summaries',
      icon: <Trophy className="h-5 w-5 text-purple-500" />
    }
  ]

  const accountabilityOptions = [
    {
      value: 'private',
      label: 'Private Learning',
      description: 'Keep your progress and projects private',
      icon: <Target className="h-5 w-5 text-gray-500" />
    },
    {
      value: 'community',
      label: 'Community Sharing',
      description: 'Share with other learners for motivation and support',
      icon: <Users className="h-5 w-5 text-blue-500" />
    },
    {
      value: 'public',
      label: 'Public Portfolio',
      description: 'Build a public portfolio and share achievements widely',
      icon: <Trophy className="h-5 w-5 text-green-500" />
    }
  ]

  const canProceed = data.progressTrackingStyle && 
                   data.challengeLevel && 
                   data.feedbackFrequency &&
                   data.accountabilityLevel &&
                   data.successMetrics.length > 0

  return (
    <OnboardingCard
      title="Learning Preferences & Success Metrics"
      description="Final customizations to make your learning experience perfect for you."
      step={6}
      totalSteps={7}
    >
      {/* Progress Tracking Style */}
      <SingleSelectGroup
        title="Progress Tracking"
        description="How much detail do you want in your learning analytics?"
        options={progressTrackingOptions}
        selectedValue={data.progressTrackingStyle}
        onSelectionChange={(value) => onUpdate({ progressTrackingStyle: value as 'detailed' | 'simple' })}
      />

      {/* Challenge Level */}
      <SingleSelectGroup
        title="Challenge Level"
        description="How much do you want to be pushed outside your comfort zone?"
        options={challengeLevelOptions}
        selectedValue={data.challengeLevel}
        onSelectionChange={(value) => onUpdate({ challengeLevel: value as 'comfortable' | 'stretch' })}
      />

      {/* Feedback Frequency */}
      <SingleSelectGroup
        title="Feedback & Check-ins"
        description="How often would you like progress updates and guidance?"
        options={feedbackFrequencyOptions}
        selectedValue={data.feedbackFrequency}
        onSelectionChange={(value) => onUpdate({ feedbackFrequency: value as 'daily' | 'weekly' })}
      />

      {/* Community Involvement */}
      <div>
        <h3 className="font-medium text-lg mb-3">Community Involvement</h3>
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.communityInvolvement}
              onChange={(e) => onUpdate({ communityInvolvement: e.target.checked })}
              className="rounded"
            />
            <span>I want to connect with other learners and share my journey</span>
          </label>
        </div>
      </div>

      {/* Accountability Level */}
      <SingleSelectGroup
        title="Accountability & Sharing"
        description="How public do you want your learning journey to be?"
        options={accountabilityOptions}
        selectedValue={data.accountabilityLevel}
        onSelectionChange={(value) => onUpdate({ accountabilityLevel: value as AccountabilityLevel })}
      />

      {/* Success Metrics */}
      <MultiSelectGroup
        title="How will you measure success?"
        description="Select 2-4 metrics that define success for your AI learning journey"
        options={SUCCESS_METRICS.map(metric => ({
          value: metric,
          label: metric,
          icon: <Trophy className="h-4 w-4 text-yellow-500" />
        }))}
        selectedValues={data.successMetrics}
        onSelectionChange={(values) => onUpdate({ successMetrics: values })}
        maxSelections={4}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="px-8"
        >
          Review & Generate
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Please complete all preferences and select your success metrics to continue
        </p>
      )}
    </OnboardingCard>
  )
}