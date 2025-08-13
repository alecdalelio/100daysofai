import { OnboardingCard } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Target, Brain, Calendar, Users, Trophy } from 'lucide-react'
import { EnhancedOnboardingData, LEARNING_TRACKS, INDUSTRY_TRACKS, calculateWeeklyHours } from '@/lib/onboardingTypes'

interface Step7ReviewProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  errorMsg: string | null
}

export function Step7Review({ 
  data, 
  onUpdate, 
  onSubmit, 
  onBack, 
  isSubmitting, 
  errorMsg 
}: Step7ReviewProps) {
  const weeklyHours = calculateWeeklyHours(data.timeAvailability)
  const totalHours = Math.round(weeklyHours * (data.duration_days / 7))

  return (
    <OnboardingCard
      title="Review Your Learning Plan"
      description="Review and confirm your personalized AI learning journey before we generate your custom syllabus."
      step={7}
      totalSteps={7}
    >
      <div className="grid gap-6">
        {/* Learning Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Learning Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{data.currentRole}</span>
            </div>
            {data.industry && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-medium">{data.industry}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Experience:</span>
              <Badge variant="secondary">{data.experienceLevels.ai_ml}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Programming:</span>
              <Badge variant="secondary">{data.experienceLevels.programming}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Learning Style:</span>
              <div className="flex gap-1">
                {data.learningStyles.map(style => (
                  <Badge key={style} variant="outline" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Path */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Track:</span>
              <span className="font-medium">
                {LEARNING_TRACKS[data.learningTrack as keyof typeof LEARNING_TRACKS]?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approach:</span>
              <Badge variant="secondary">{data.projectPreference}</Badge>
            </div>
            {data.industryTrack && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry Focus:</span>
                <span className="font-medium">
                  {INDUSTRY_TRACKS[data.industryTrack as keyof typeof INDUSTRY_TRACKS]}
                </span>
              </div>
            )}
            {data.specialization && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialization:</span>
                <Badge variant="secondary">{data.specialization}</Badge>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Primary Goals:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.primaryGoals.slice(0, 3).map(goal => (
                  <Badge key={goal} variant="outline" className="text-xs">
                    {goal.length > 30 ? `${goal.substring(0, 30)}...` : goal}
                  </Badge>
                ))}
                {data.primaryGoals.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.primaryGoals.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Commitment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Commitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data.timeAvailability.dailyHours}h
                </div>
                <div className="text-sm text-muted-foreground">Daily</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {weeklyHours}h
                </div>
                <div className="text-sm text-muted-foreground">Weekly</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data.duration_days}
                </div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalHours}h
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Badge variant="secondary">
                {data.learningPace} pace • {data.timeAvailability.weekendLearning ? 'includes weekends' : 'weekdays only'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress Tracking:</span>
              <Badge variant="secondary">{data.progressTrackingStyle}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Challenge Level:</span>
              <Badge variant="secondary">{data.challengeLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sharing:</span>
              <Badge variant="secondary">{data.accountabilityLevel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.successMetrics.map(metric => (
                <Badge key={metric} variant="outline">
                  {metric}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Any additional notes or specific interests? (Optional)
          </label>
          <textarea
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            placeholder="e.g., Interested in healthcare applications, want to focus on Python, prefer video content..."
            value={data.note || ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
          />
        </div>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-700 dark:text-red-300 text-sm">{errorMsg}</div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Generating Your Syllabus...' : 'Generate My AI Learning Plan 🚀'}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        This will create a personalized syllabus based on your preferences. 
        You can always adjust your learning path later.
      </div>
    </OnboardingCard>
  )
}