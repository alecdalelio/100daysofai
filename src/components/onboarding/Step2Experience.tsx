import { OnboardingCard, SingleSelectGroup, MultiSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Code, Calculator, Star, CheckCircle, Circle } from 'lucide-react'
import { EnhancedOnboardingData, ExperienceLevels, AI_EXPERIENCE_OPTIONS, ExperienceLevel, ProgrammingLevel, MathLevel } from '@/lib/onboardingTypes'

interface Step2ExperienceProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Experience({ data, onUpdate, onNext, onBack }: Step2ExperienceProps) {
  const updateExperienceLevel = (domain: keyof ExperienceLevels, level: string) => {
    onUpdate({
      experienceLevels: {
        ...data.experienceLevels,
        [domain]: level
      }
    })
  }

  const getLevelIcon = (level: string) => {
    const icons = {
      novice: <Circle className="h-4 w-4" />,
      beginner: <Circle className="h-4 w-4 fill-current" />,
      intermediate: <Star className="h-4 w-4" />,
      advanced: <Star className="h-4 w-4 fill-current" />,
      expert: <CheckCircle className="h-4 w-4" />,
      none: <Circle className="h-4 w-4" />,
      basic: <Circle className="h-4 w-4 fill-current" />,
      college: <Star className="h-4 w-4" />,
      professional: <Star className="h-4 w-4 fill-current" />
    }
    return icons[level as keyof typeof icons] || <Circle className="h-4 w-4" />
  }

  const getLevelColor = (level: string) => {
    const colors = {
      novice: 'text-gray-400',
      beginner: 'text-blue-500',
      intermediate: 'text-green-500',
      advanced: 'text-orange-500',
      expert: 'text-red-500',
      none: 'text-gray-400',
      basic: 'text-blue-500',
      college: 'text-green-500',
      professional: 'text-orange-500'
    }
    return colors[level as keyof typeof colors] || 'text-gray-400'
  }

  const aiLevelOptions = [
    {
      value: 'novice',
      label: 'Complete Beginner',
      description: 'Never worked with AI or machine learning before'
    },
    {
      value: 'beginner',
      label: 'Some Exposure',
      description: 'Completed tutorials, used AI tools like ChatGPT'
    },
    {
      value: 'intermediate',
      label: 'Basic Projects',
      description: 'Built simple AI projects, understand fundamentals'
    },
    {
      value: 'advanced',
      label: 'Experienced',
      description: 'Production experience, custom models, MLOps'
    },
    {
      value: 'expert',
      label: 'Expert',
      description: 'Research, novel architectures, industry leadership'
    }
  ]

  const programmingLevelOptions = [
    {
      value: 'none',
      label: 'No Programming',
      description: 'Never written code before'
    },
    {
      value: 'basic',
      label: 'Basic Scripting',
      description: 'Simple scripts, basic syntax understanding'
    },
    {
      value: 'intermediate',
      label: 'Application Development',
      description: 'Built applications, comfortable with frameworks'
    },
    {
      value: 'advanced',
      label: 'Professional Developer',
      description: 'Years of experience, multiple languages/frameworks'
    },
    {
      value: 'expert',
      label: 'Expert Developer',
      description: 'Architecture, team leadership, system design'
    }
  ]

  const mathLevelOptions = [
    {
      value: 'basic',
      label: 'High School Math',
      description: 'Algebra, basic statistics'
    },
    {
      value: 'college',
      label: 'College Level',
      description: 'Calculus, linear algebra, probability'
    },
    {
      value: 'professional',
      label: 'Professional Use',
      description: 'Applied statistics, data analysis in work'
    },
    {
      value: 'advanced',
      label: 'Advanced/Research',
      description: 'PhD level, research, complex mathematical modeling'
    }
  ]

  const canProceed = data.experienceLevels.ai_ml && 
                   data.experienceLevels.programming && 
                   data.experienceLevels.math_stats

  return (
    <OnboardingCard
      title="Experience Assessment"
      description="Help us understand your background so we can tailor the perfect learning path."
      step={2}
      totalSteps={7}
    >
      {/* AI/ML Experience */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="font-medium text-lg">AI & Machine Learning Experience</h3>
        </div>
        <div className="grid gap-3">
          {aiLevelOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateExperienceLevel('ai_ml', option.value as ExperienceLevel)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${data.experienceLevels.ai_ml === option.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-border hover:border-purple-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={getLevelColor(option.value)}>
                  {getLevelIcon(option.value)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                {data.experienceLevels.ai_ml === option.value && (
                  <Badge variant="secondary">Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programming Experience */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-green-500" />
          <h3 className="font-medium text-lg">Programming Experience</h3>
        </div>
        <div className="grid gap-3">
          {programmingLevelOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateExperienceLevel('programming', option.value as ProgrammingLevel)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${data.experienceLevels.programming === option.value
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-border hover:border-green-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={getLevelColor(option.value)}>
                  {getLevelIcon(option.value)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                {data.experienceLevels.programming === option.value && (
                  <Badge variant="secondary">Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Math/Statistics Background */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-lg">Math & Statistics Background</h3>
        </div>
        <div className="grid gap-3">
          {mathLevelOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateExperienceLevel('math_stats', option.value as MathLevel)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${data.experienceLevels.math_stats === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-border hover:border-blue-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={getLevelColor(option.value)}>
                  {getLevelIcon(option.value)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                {data.experienceLevels.math_stats === option.value && (
                  <Badge variant="secondary">Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous AI Experience */}
      <MultiSelectGroup
        title="Previous AI Experience"
        description="Select all that apply to help us understand your background"
        options={AI_EXPERIENCE_OPTIONS.map(exp => ({
          value: exp,
          label: exp
        }))}
        selectedValues={data.previousAIExperience}
        onSelectionChange={(values) => onUpdate({ previousAIExperience: values })}
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
          Next: Goals & Path
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Please select your experience level in all three areas to continue
        </p>
      )}
    </OnboardingCard>
  )
}