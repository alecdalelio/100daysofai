import { OnboardingCard, SingleSelectGroup, MultiSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, Zap, Coffee, Moon, Sun } from 'lucide-react'
import { EnhancedOnboardingData, TIME_SLOTS, calculateWeeklyHours } from '@/lib/onboardingTypes'

interface Step5TimeCommitmentProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step5TimeCommitment({ data, onUpdate, onNext, onBack }: Step5TimeCommitmentProps) {
  const updateTimeAvailability = (updates: Partial<EnhancedOnboardingData['timeAvailability']>) => {
    const newTimeAvailability = { ...data.timeAvailability, ...updates }
    const weeklyHours = calculateWeeklyHours(newTimeAvailability)
    
    onUpdate({ 
      timeAvailability: newTimeAvailability,
      weekly_hours: weeklyHours
    })
  }

  const learningPaceOptions = [
    {
      value: 'intensive',
      label: 'Intensive Learning',
      description: '2-4 hours daily, accelerated progress, high commitment',
      icon: <Zap className="h-5 w-5 text-red-500" />
    },
    {
      value: 'steady',
      label: 'Steady Progress',
      description: '1-2 hours daily, consistent learning, balanced approach',
      icon: <Coffee className="h-5 w-5 text-green-500" />
    },
    {
      value: 'relaxed',
      label: 'Relaxed Pace',
      description: '30-60 minutes daily, flexible schedule, long-term view',
      icon: <Moon className="h-5 w-5 text-blue-500" />
    }
  ]

  const durationOptions = [
    {
      value: 30,
      label: '30 Days',
      description: 'Quick exploration, foundation building'
    },
    {
      value: 60,
      label: '60 Days',
      description: 'Solid understanding, some practical projects'
    },
    {
      value: 100,
      label: '100 Days',
      description: 'Comprehensive learning, portfolio development'
    },
    {
      value: 180,
      label: '6 Months',
      description: 'Deep expertise, advanced projects'
    }
  ]

  const dailyHourOptions = [
    { value: 0.5, label: '30 minutes', description: 'Quick daily learning' },
    { value: 1, label: '1 hour', description: 'Focused daily session' },
    { value: 1.5, label: '1.5 hours', description: 'Extended learning time' },
    { value: 2, label: '2 hours', description: 'Deep dive sessions' },
    { value: 3, label: '3 hours', description: 'Intensive learning' },
    { value: 4, label: '4+ hours', description: 'Full immersion' }
  ]

  const timeSlotIcons = {
    'Early Morning (6-9 AM)': <Sun className="h-4 w-4 text-yellow-500" />,
    'Morning (9-12 PM)': <Sun className="h-4 w-4 text-orange-500" />,
    'Afternoon (12-5 PM)': <Sun className="h-4 w-4 text-blue-500" />,
    'Evening (5-8 PM)': <Moon className="h-4 w-4 text-purple-500" />,
    'Night (8-11 PM)': <Moon className="h-4 w-4 text-indigo-500" />,
    'Late Night (11 PM+)': <Moon className="h-4 w-4 text-gray-500" />
  }

  const weeklyHours = calculateWeeklyHours(data.timeAvailability)
  const dailyAverage = weeklyHours / 7

  const canProceed = data.timeAvailability.dailyHours > 0 && 
                   data.timeAvailability.preferredTimes.length > 0 &&
                   data.learningPace &&
                   data.duration_days > 0

  return (
    <OnboardingCard
      title="Time Commitment & Schedule"
      description="Let's create a realistic learning schedule that fits your lifestyle."
      step={5}
      totalSteps={7}
    >
      {/* Daily Time Commitment */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-lg">Daily Learning Time</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dailyHourOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateTimeAvailability({ dailyHours: option.value })}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                ${data.timeAvailability.dailyHours === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-border hover:border-blue-300'
                }
              `}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Time Slots */}
      <MultiSelectGroup
        title="When do you prefer to learn?"
        description="Select your ideal learning times (you can choose multiple)"
        options={TIME_SLOTS.map(slot => ({
          value: slot,
          label: slot,
          icon: timeSlotIcons[slot as keyof typeof timeSlotIcons]
        }))}
        selectedValues={data.timeAvailability.preferredTimes}
        onSelectionChange={(values) => updateTimeAvailability({ preferredTimes: values })}
        maxSelections={3}
      />

      {/* Weekend Learning */}
      <div>
        <h3 className="font-medium text-lg mb-3">Weekend Learning</h3>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => updateTimeAvailability({ weekendLearning: true })}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all text-center
              ${data.timeAvailability.weekendLearning
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-border hover:border-green-300'
              }
            `}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="font-medium">Include Weekends</div>
            <div className="text-sm text-muted-foreground">Learn 7 days a week</div>
          </div>
          <div
            onClick={() => updateTimeAvailability({ weekendLearning: false })}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all text-center
              ${!data.timeAvailability.weekendLearning
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                : 'border-border hover:border-orange-300'
              }
            `}
          >
            <Coffee className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="font-medium">Weekdays Only</div>
            <div className="text-sm text-muted-foreground">Take weekends off</div>
          </div>
        </div>
      </div>

      {/* Learning Pace */}
      <SingleSelectGroup
        title="Learning Pace"
        description="Choose the intensity that matches your goals and availability"
        options={learningPaceOptions}
        selectedValue={data.learningPace}
        onSelectionChange={(value) => onUpdate({ learningPace: value as 'intensive' | 'steady' | 'relaxed' })}
      />

      {/* Duration */}
      <div>
        <h3 className="font-medium text-lg mb-3">Learning Duration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {durationOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => onUpdate({ duration_days: option.value })}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                ${data.duration_days === option.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-border hover:border-purple-300'
                }
              `}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Summary */}
      {weeklyHours > 0 && (
        <div className="p-4 bg-accent/50 rounded-lg">
          <h4 className="font-medium mb-2">Your Learning Schedule:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">{data.timeAvailability.dailyHours}h daily</div>
              <div className="text-muted-foreground">Per day</div>
            </div>
            <div>
              <div className="font-medium">{weeklyHours}h weekly</div>
              <div className="text-muted-foreground">Total per week</div>
            </div>
            <div>
              <div className="font-medium">{Math.round(weeklyHours * (data.duration_days / 7))}h total</div>
              <div className="text-muted-foreground">Over {data.duration_days} days</div>
            </div>
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
          Next: Preferences
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-muted-foreground text-center">
          Please set your daily time, preferred times, learning pace, and duration to continue
        </p>
      )}
    </OnboardingCard>
  )
}