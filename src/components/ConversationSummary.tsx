import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Edit, 
  CheckCircle, 
  Clock, 
  Target, 
  Brain, 
  Users, 
  Trophy,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { EnhancedOnboardingData, LEARNING_TRACKS, INDUSTRY_TRACKS } from '../lib/onboardingTypes'

interface ConversationSummaryProps {
  data: EnhancedOnboardingData
  onConfirm: (data: EnhancedOnboardingData) => void
  onEdit: () => void
  onFallbackToForm?: () => void
  isLoading?: boolean
  error?: string | null
}

export function ConversationSummary({ 
  data, 
  onConfirm, 
  onEdit, 
  onFallbackToForm,
  isLoading,
  error 
}: ConversationSummaryProps) {
  const [editableData, setEditableData] = useState<EnhancedOnboardingData>(data)
  const [isEditing, setIsEditing] = useState(false)

  const handleQuickEdit = (field: keyof EnhancedOnboardingData, value: any) => {
    setEditableData(prev => ({ ...prev, [field]: value }))
    setIsEditing(true)
  }

  const handleConfirm = () => {
    onConfirm(editableData)
  }

  const weeklyHours = editableData.timeAvailability?.dailyHours 
    ? editableData.timeAvailability.dailyHours * (editableData.timeAvailability.weekendLearning ? 7 : 5)
    : editableData.weekly_hours || 7

  const totalHours = Math.round(weeklyHours * (editableData.duration_days / 7))

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your AI Learning Plan Summary
          </CardTitle>
          <p className="text-muted-foreground">
            Based on our conversation, here's your personalized learning plan. You can make quick edits or generate your syllabus.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Learning Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                Learning Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Role</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{editableData.currentRole || 'Not specified'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newRole = prompt('Enter your current role:', editableData.currentRole)
                        if (newRole) handleQuickEdit('currentRole', newRole)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {editableData.industry && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{editableData.industry}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newIndustry = prompt('Enter your industry:', editableData.industry)
                          if (newIndustry !== null) handleQuickEdit('industry', newIndustry)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Experience Levels</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary">
                    AI/ML: {editableData.experienceLevels.ai_ml}
                  </Badge>
                  <Badge variant="secondary">
                    Programming: {editableData.experienceLevels.programming}
                  </Badge>
                  <Badge variant="secondary">
                    Math/Stats: {editableData.experienceLevels.math_stats}
                  </Badge>
                </div>
              </div>

              {editableData.learningStyles && editableData.learningStyles.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Learning Styles</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editableData.learningStyles.map(style => (
                      <Badge key={style} variant="outline" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Path */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Learning Track</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">
                    {editableData.learningTrack ? 
                      LEARNING_TRACKS[editableData.learningTrack as keyof typeof LEARNING_TRACKS]?.name || editableData.learningTrack 
                      : 'Not specified'
                    }
                  </span>
                </div>
              </div>

              {editableData.industryTrack && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Industry Focus</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {INDUSTRY_TRACKS[editableData.industryTrack as keyof typeof INDUSTRY_TRACKS] || editableData.industryTrack}
                    </Badge>
                  </div>
                </div>
              )}

              {editableData.specialization && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Technical Specialization</label>
                  <div className="mt-1">
                    <Badge variant="secondary">{editableData.specialization}</Badge>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Primary Goals</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {editableData.primaryGoals.slice(0, 4).map((goal, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {goal.length > 40 ? `${goal.substring(0, 40)}...` : goal}
                    </Badge>
                  ))}
                  {editableData.primaryGoals.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{editableData.primaryGoals.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Commitment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Time Commitment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {editableData.timeAvailability?.dailyHours || '1'}h
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
                    {editableData.duration_days}
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
                  {editableData.learningPace || 'steady'} pace • {
                    editableData.timeAvailability?.weekendLearning ? 'includes weekends' : 'weekdays only'
                  }
                </Badge>
              </div>

              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHours = prompt('Daily learning hours (0.5-4):', String(editableData.timeAvailability?.dailyHours || 1))
                    if (newHours) {
                      const hours = Math.max(0.5, Math.min(4, parseFloat(newHours)))
                      handleQuickEdit('timeAvailability', {
                        ...editableData.timeAvailability,
                        dailyHours: hours
                      })
                    }
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Adjust Time
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          {(editableData.successMetrics?.length > 0 || 
            editableData.progressTrackingStyle || 
            editableData.challengeLevel) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Learning Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editableData.progressTrackingStyle && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Progress Tracking</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{editableData.progressTrackingStyle}</Badge>
                    </div>
                  </div>
                )}

                {editableData.challengeLevel && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Challenge Level</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{editableData.challengeLevel}</Badge>
                    </div>
                  </div>
                )}

                {editableData.successMetrics && editableData.successMetrics.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Success Metrics</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editableData.successMetrics.map(metric => (
                        <Badge key={metric} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {editableData.note && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">"{editableData.note}"</p>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert>
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Conversation
            </Button>
            
            {onFallbackToForm && (
              <Button 
                variant="outline" 
                onClick={onFallbackToForm}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Use Traditional Form
              </Button>
            )}
            
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating Your Syllabus...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Generate My AI Learning Plan 🚀
                </>
              )}
            </Button>
          </div>

          {isEditing && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Changes will be applied when you generate your learning plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}