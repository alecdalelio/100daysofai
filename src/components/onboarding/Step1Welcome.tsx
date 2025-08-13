import { OnboardingCard, MultiSelectGroup, SingleSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Eye, Headphones, Hand, BookOpen, Briefcase, Heart, Target, Lightbulb } from 'lucide-react'
import { EnhancedOnboardingData, CURRENT_ROLES, LEARNING_STYLE_OPTIONS, MOTIVATION_OPTIONS, LearningStyle } from '@/lib/onboardingTypes'

interface Step1WelcomeProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
}

export function Step1Welcome({ data, onUpdate, onNext }: Step1WelcomeProps) {
  const learningStyleIcons = {
    visual: <Eye className="h-5 w-5 text-blue-500" />,
    auditory: <Headphones className="h-5 w-5 text-green-500" />,
    kinesthetic: <Hand className="h-5 w-5 text-orange-500" />,
    reading: <BookOpen className="h-5 w-5 text-purple-500" />
  }

  const roleIcons = {
    'Student': <BookOpen className="h-5 w-5 text-blue-500" />,
    'Software Developer': <Target className="h-5 w-5 text-green-500" />,
    'Product Manager': <Briefcase className="h-5 w-5 text-orange-500" />,
    'Entrepreneur': <Lightbulb className="h-5 w-5 text-yellow-500" />,
    'Career Switcher': <Target className="h-5 w-5 text-purple-500" />
  }

  const motivationIcons = {
    'Career advancement': <Briefcase className="h-4 w-4" />,
    'Personal curiosity and learning': <Heart className="h-4 w-4" />,
    'Building a side project': <Target className="h-4 w-4" />,
    'Starting a business': <Lightbulb className="h-4 w-4" />
  }

  const canProceed = data.currentRole && data.learningStyles.length > 0

  return (
    <OnboardingCard
      title="Welcome to Your AI Learning Journey!"
      description="Let's personalize your learning experience to match your goals and style."
      step={1}
      totalSteps={7}
    >
      {/* Learning Style Assessment */}
      <MultiSelectGroup
        title="How do you learn best?"
        description="Select all learning styles that work well for you"
        options={LEARNING_STYLE_OPTIONS.map(style => ({
          value: style.value,
          label: style.label,
          description: style.description,
          icon: learningStyleIcons[style.value as keyof typeof learningStyleIcons]
        }))}
        selectedValues={data.learningStyles}
        onSelectionChange={(values) => onUpdate({ learningStyles: values as LearningStyle[] })}
        maxSelections={3}
      />

      {/* Current Role */}
      <SingleSelectGroup
        title="What's your current role?"
        description="This helps us tailor the content to your professional context"
        options={CURRENT_ROLES.map(role => ({
          value: role,
          label: role,
          icon: roleIcons[role as keyof typeof roleIcons] || <Briefcase className="h-5 w-5 text-gray-500" />
        }))}
        selectedValue={data.currentRole}
        onSelectionChange={(value) => onUpdate({ currentRole: value })}
      />

      {/* Industry (Optional) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          What industry do you work in? (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., Healthcare, Finance, E-commerce, etc."
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
          value={data.industry}
          onChange={(e) => onUpdate({ industry: e.target.value })}
        />
      </div>

      {/* Motivation */}
      <MultiSelectGroup
        title="What motivates you to learn AI?"
        description="Understanding your motivation helps us keep you engaged"
        options={MOTIVATION_OPTIONS.map(motivation => ({
          value: motivation,
          label: motivation,
          icon: motivationIcons[motivation as keyof typeof motivationIcons] || <Heart className="h-4 w-4" />
        }))}
        selectedValues={data.motivation}
        onSelectionChange={(values) => onUpdate({ motivation: values })}
        maxSelections={4}
      />

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="px-8"
        >
          Next: Experience Assessment
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Please select your role and at least one learning style to continue
        </p>
      )}
    </OnboardingCard>
  )
}