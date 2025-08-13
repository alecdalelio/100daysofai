import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { EnhancedOnboardingData } from '../lib/onboardingTypes'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { MessageCircle, FileText, Sparkles, Bot, Clock } from 'lucide-react'
import { ConversationalOnboarding } from '../components/ConversationalOnboarding'
import { Step1Welcome } from '../components/onboarding/Step1Welcome'
import { Step2Experience } from '../components/onboarding/Step2Experience'
import { Step3Goals } from '../components/onboarding/Step3Goals'
import { Step4Specialization } from '../components/onboarding/Step4Specialization'
import { Step5TimeCommitment } from '../components/onboarding/Step5TimeCommitment'
import { Step6Preferences } from '../components/onboarding/Step6Preferences'
import { Step7Review } from '../components/onboarding/Step7Review'
import { QuickForm } from '../components/onboarding/QuickForm'

type OnboardingMode = 'selection' | 'conversational' | 'traditional' | 'quick'

export default function Onboarding() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<OnboardingMode>('selection')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [data, setData] = useState<EnhancedOnboardingData>({
    // Learning Profile
    currentRole: '',
    industry: '',
    motivation: [],
    learningStyles: [],
    
    // Experience Levels
    experienceLevels: {
      ai_ml: 'beginner',
      programming: 'basic',
      math_stats: 'basic'
    },
    previousAIExperience: [],
    
    // Goals & Path
    primaryGoals: [],
    learningTrack: '',
    projectPreference: 'balanced',
    
    // Specialization
    industryTrack: '',
    specialization: '',
    
    // Time Commitment
    timeAvailability: {
      dailyHours: 1,
      preferredTimes: [],
      weekendLearning: true,
      flexibleSchedule: false
    },
    learningPace: 'steady',
    weekly_hours: 7,
    duration_days: 100,
    
    // Preferences
    progressTrackingStyle: 'simple',
    challengeLevel: 'comfortable',
    feedbackFrequency: 'weekly',
    communityInvolvement: false,
    accountabilityLevel: 'private',
    successMetrics: [],
    
    // Optional
    note: ''
  })

  // Let ProtectedRoute gate auth; if still loading, show a lightweight placeholder
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="card p-6 animate-pulse">Preparing onboarding…</div>
      </div>
    )
  }
  // Do not block on session; ProtectedRoute already ensures auth

  function updateData(updates: Partial<EnhancedOnboardingData>) {
    setData(prev => ({ ...prev, ...updates }))
  }

  function nextStep() {
    setStep(prev => Math.min(prev + 1, 7))
  }

  function prevStep() {
    setStep(prev => Math.max(prev - 1, 1))
  }

  async function submit() {
    setSubmitting(true)
    setErrorMsg(null)
    const SAFETY_MS = 160000 // 160 seconds - slightly longer than the fetch timeout
    const safetyTimer = setTimeout(() => {
      setSubmitting(false)
      setErrorMsg('Generation took too long. The OpenAI API might be slow. Please try again.')
    }, SAFETY_MS)
    
    try {
      // Convert enhanced data to legacy format for compatibility with existing Edge Function
      const legacyAnswers = {
        experience_level: data.experienceLevels.ai_ml,
        goals: data.primaryGoals,
        weekly_hours: data.weekly_hours,
        duration_days: data.duration_days,
        focus_areas: data.specialization ? [data.specialization] : [],
        output_preferences: ['docs', 'code-first'],
        note: data.note,
        // Include enhanced data for future use
        enhanced_data: data
      }
      
      const start = Date.now()
      console.log('[Onboarding] Generating syllabus with enhanced data')
      
      // Direct fetch to bypass any issues with callEdgeFunction
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate_syllabus`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: legacyAnswers }),
        signal: AbortSignal.timeout(150000) // 150 second timeout to allow OpenAI API call
      })
      
      console.log('[Onboarding] Direct fetch response:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Function failed: ${response.status} - ${errorText}`)
      }
      
      const { syllabus } = await response.json()
      if (!syllabus?.id) throw new Error('Function returned no syllabus ID')
      console.debug('Syllabus generated in', Date.now() - start, 'ms')
      navigate(`/syllabus/${syllabus.id}`)
    } catch (e) {
      const errorObj = e as { message?: string }
      const msg = errorObj?.message ?? 'Failed to generate syllabus'
      console.error('[Onboarding] generate_syllabus error:', e)
      setErrorMsg(msg)
    } finally {
      clearTimeout(safetyTimer)
      setSubmitting(false)
    }
  }

  // Mode Selection Screen
  if (mode === 'selection') {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Create Your AI Learning Plan</h1>
          <p className="text-muted-foreground text-lg">
            Choose how you'd like to set up your personalized learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
          {/* Conversational Mode */}
          <Card className="h-full border-2 hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 h-full">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Talk with AI Coach</span>
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">
                    Have a natural conversation with our AI coach. Just describe your background and goals - 
                    we'll extract everything we need through chat.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <Clock className="h-4 w-4" />
                      <span>2–3 minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>Voice or text input</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Sparkles className="h-4 w-4" />
                      <span>Smart data extraction</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={() => setMode('conversational')}
                    className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 transition font-medium"
                    size="lg"
                  >
                    Start Conversation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Form */}
          <Card className="h-full border-2 hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 h-full">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="font-semibold">Quick Form</span>
                  </div>
                  
                  <p className="text-muted-foreground">
                    Enter only the essentials and generate your plan fast.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <Clock className="h-4 w-4" />
                      <span>&lt;1 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <FileText className="h-4 w-4" />
                      <span>Essentials only</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>Fastest path</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={() => setMode('quick')}
                    className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 transition font-medium"
                    size="lg"
                  >
                    Use Quick Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Both methods create the same high-quality, personalized learning plan
          </p>
        </div>
      </div>
    )
  }

  // Conversational Mode
  if (mode === 'conversational') {
    return (
      <ConversationalOnboarding
        onComplete={(data) => {
          setData(data)
          // Navigate directly to syllabus generation since conversation handles it
        }}
        onFallbackToForm={() => setMode('traditional')}
      />
    )
  }

  // Quick Form Mode
  if (mode === 'quick') {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <QuickForm
          initial={{
            aiExperience: data.experienceLevels.ai_ml as any,
            goals: data.primaryGoals.join(', '),
            weeklyHours: data.weekly_hours,
            durationDays: data.duration_days as any,
            specialization: data.specialization
          }}
          isSubmitting={submitting}
          onCancel={() => setMode('selection')}
          onSubmit={async (v) => {
            // Map quick form to existing data shape and call submit()
            updateData({
              experienceLevels: { ...data.experienceLevels, ai_ml: v.aiExperience },
              primaryGoals: v.goals.split(',').map(g => g.trim()).filter(Boolean),
              weekly_hours: v.weeklyHours,
              duration_days: v.durationDays,
              specialization: v.specialization || ''
            })
            await submit()
          }}
        />
      </div>
    )
  }

  // Traditional Form Mode
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Learning Plan Setup</h1>
          <p className="text-muted-foreground">Step {step} of 7</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setMode('selection')}
          className="text-sm"
        >
          ← Choose Different Method
        </Button>
      </div>

      {step === 1 && (
        <Step1Welcome
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
        />
      )}

      {step === 2 && (
        <Step2Experience
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 3 && (
        <Step3Goals
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 4 && (
        <Step4Specialization
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 5 && (
        <Step5TimeCommitment
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 6 && (
        <Step6Preferences
          data={data}
          onUpdate={updateData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 7 && (
        <Step7Review
          data={data}
          onUpdate={updateData}
          onSubmit={submit}
          onBack={prevStep}
          isSubmitting={submitting}
          errorMsg={errorMsg}
        />
      )}
    </div>
  )
}


