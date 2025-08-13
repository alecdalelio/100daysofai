import { OnboardingCard, MultiSelectGroup, SingleSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Target, Lightbulb, BookOpen, Briefcase, Rocket, Users } from 'lucide-react'
import { EnhancedOnboardingData, getGoalsByExperience, LEARNING_TRACKS, getRecommendedTrack, ProjectPreference } from '@/lib/onboardingTypes'

interface Step3GoalsProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3Goals({ data, onUpdate, onNext, onBack }: Step3GoalsProps) {
  // Get goals based on AI experience level
  const availableGoals = getGoalsByExperience(data.experienceLevels.ai_ml)
  
  // Get recommended track
  const recommendedTrack = getRecommendedTrack(
    data.experienceLevels,
    data.currentRole,
    data.primaryGoals
  )

  const projectPreferenceOptions = [
    {
      value: 'project-first',
      label: 'Learn by Building',
      description: 'Jump into projects and learn concepts as needed',
      icon: <Rocket className="h-5 w-5 text-orange-500" />
    },
    {
      value: 'theory-first',
      label: 'Understand First',
      description: 'Learn fundamentals and theory before building',
      icon: <BookOpen className="h-5 w-5 text-blue-500" />
    },
    {
      value: 'balanced',
      label: 'Balanced Approach',
      description: 'Mix of theory and hands-on projects',
      icon: <Target className="h-5 w-5 text-green-500" />
    }
  ]

  const trackOptions = Object.entries(LEARNING_TRACKS).map(([key, track]) => ({
    value: key,
    label: track.name,
    description: track.description,
    icon: getTrackIcon(key)
  }))

  function getTrackIcon(trackKey: string) {
    const icons = {
      'generalist': <Target className="h-5 w-5 text-blue-500" />,
      'ml-engineer': <Rocket className="h-5 w-5 text-green-500" />,
      'data-scientist': <BookOpen className="h-5 w-5 text-purple-500" />,
      'ai-researcher': <Lightbulb className="h-5 w-5 text-yellow-500" />,
      'product-manager': <Briefcase className="h-5 w-5 text-orange-500" />,
      'entrepreneur': <Users className="h-5 w-5 text-red-500" />
    }
    return icons[trackKey as keyof typeof icons] || <Target className="h-5 w-5 text-gray-500" />
  }

  const canProceed = data.primaryGoals.length > 0 && 
                   data.learningTrack && 
                   data.projectPreference

  return (
    <OnboardingCard
      title="Your Learning Goals & Path"
      description="Let's define what success looks like for your AI learning journey."
      step={3}
      totalSteps={7}
    >
      {/* Personalized Goals */}
      <MultiSelectGroup
        title={`Goals for ${data.experienceLevels.ai_ml} learners`}
        description="Select 2-4 primary goals that resonate with you"
        options={availableGoals.map(goal => ({
          value: goal,
          label: goal,
          icon: <Target className="h-4 w-4 text-primary" />
        }))}
        selectedValues={data.primaryGoals}
        onSelectionChange={(values) => onUpdate({ primaryGoals: values })}
        maxSelections={4}
      />

      {/* Recommended Learning Track */}
      {recommendedTrack && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">
              Recommended track: {LEARNING_TRACKS[recommendedTrack as keyof typeof LEARNING_TRACKS].name}
            </div>
            <div className="text-sm">
              Based on your role as {data.currentRole} and your experience levels.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Learning Track Selection */}
      <SingleSelectGroup
        title="Choose Your Learning Track"
        description="This determines the focus and structure of your curriculum"
        options={trackOptions}
        selectedValue={data.learningTrack}
        onSelectionChange={(value) => onUpdate({ learningTrack: value })}
      />

      {/* Learning Approach */}
      <SingleSelectGroup
        title="How do you prefer to learn?"
        description="This affects how we structure lessons and projects"
        options={projectPreferenceOptions}
        selectedValue={data.projectPreference}
        onSelectionChange={(value) => onUpdate({ projectPreference: value as ProjectPreference })}
      />

      {/* Track Focus Areas */}
      {data.learningTrack && (
        <div className="p-4 bg-accent/50 rounded-lg">
          <h4 className="font-medium mb-2">
            {LEARNING_TRACKS[data.learningTrack as keyof typeof LEARNING_TRACKS].name} Focus Areas:
          </h4>
          <div className="flex flex-wrap gap-2">
            {LEARNING_TRACKS[data.learningTrack as keyof typeof LEARNING_TRACKS].focus.map((focus) => (
              <Badge key={focus} variant="secondary" className="text-xs">
                {focus}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
          Next: Specialization
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Please select your goals, learning track, and learning approach to continue
        </p>
      )}
    </OnboardingCard>
  )
}