import { OnboardingCard, SingleSelectGroup } from './OnboardingCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Building, ShoppingCart, Gamepad2, GraduationCap, Car, Shield, Code } from 'lucide-react'
import { EnhancedOnboardingData, INDUSTRY_TRACKS } from '@/lib/onboardingTypes'

interface Step4SpecializationProps {
  data: EnhancedOnboardingData
  onUpdate: (updates: Partial<EnhancedOnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step4Specialization({ data, onUpdate, onNext, onBack }: Step4SpecializationProps) {
  const industryOptions = Object.entries(INDUSTRY_TRACKS).map(([key, name]) => ({
    value: key,
    label: name,
    description: getIndustryDescription(key),
    icon: getIndustryIcon(key)
  }))

  function getIndustryIcon(industry: string) {
    const icons = {
      healthcare: <Heart className="h-5 w-5 text-red-500" />,
      finance: <Building className="h-5 w-5 text-green-500" />,
      ecommerce: <ShoppingCart className="h-5 w-5 text-blue-500" />,
      gaming: <Gamepad2 className="h-5 w-5 text-purple-500" />,
      education: <GraduationCap className="h-5 w-5 text-orange-500" />,
      automotive: <Car className="h-5 w-5 text-gray-500" />,
      cybersecurity: <Shield className="h-5 w-5 text-yellow-500" />,
      general: <Code className="h-5 w-5 text-indigo-500" />
    }
    return icons[industry as keyof typeof icons] || <Code className="h-5 w-5 text-gray-500" />
  }

  function getIndustryDescription(industry: string) {
    const descriptions = {
      healthcare: 'Medical imaging, drug discovery, diagnostics, patient care optimization',
      finance: 'Fraud detection, algorithmic trading, risk assessment, fintech applications',
      ecommerce: 'Recommendation systems, personalization, pricing, customer analytics',
      gaming: 'Game AI, procedural generation, player behavior analysis, VR/AR',
      education: 'Personalized learning, assessment tools, educational content generation',
      automotive: 'Self-driving cars, predictive maintenance, traffic optimization',
      cybersecurity: 'Threat detection, security analytics, privacy-preserving AI',
      general: 'Broad AI applications across multiple industries and use cases'
    }
    return descriptions[industry as keyof typeof descriptions] || 'General AI applications'
  }

  const specializationOptions = [
    {
      value: 'nlp',
      label: 'Natural Language Processing',
      description: 'Text analysis, chatbots, language models, translation'
    },
    {
      value: 'computer-vision',
      label: 'Computer Vision',
      description: 'Image recognition, object detection, medical imaging'
    },
    {
      value: 'machine-learning',
      label: 'Traditional Machine Learning',
      description: 'Predictive modeling, classification, regression, analytics'
    },
    {
      value: 'deep-learning',
      label: 'Deep Learning',
      description: 'Neural networks, deep architectures, advanced AI models'
    },
    {
      value: 'reinforcement-learning',
      label: 'Reinforcement Learning',
      description: 'Game AI, robotics, optimization, decision making'
    },
    {
      value: 'generative-ai',
      label: 'Generative AI',
      description: 'Content creation, art generation, synthetic data'
    },
    {
      value: 'mlops',
      label: 'MLOps & Production',
      description: 'Model deployment, monitoring, scaling, infrastructure'
    },
    {
      value: 'broad',
      label: 'Broad Understanding',
      description: 'General AI knowledge across multiple specializations'
    }
  ]

  return (
    <OnboardingCard
      title="Industry & Specialization"
      description="Focus your learning on areas most relevant to your interests and career goals."
      step={4}
      totalSteps={7}
    >
      {/* Industry Track */}
      <SingleSelectGroup
        title="Industry Focus (Optional)"
        description="Choose an industry to get specialized examples and use cases"
        options={industryOptions}
        selectedValue={data.industryTrack || null}
        onSelectionChange={(value) => onUpdate({ industryTrack: value })}
      />

      {/* Technical Specialization */}
      <SingleSelectGroup
        title="Technical Specialization (Optional)"
        description="Focus on a specific area of AI, or choose broad understanding"
        options={specializationOptions.map(spec => ({
          value: spec.value,
          label: spec.label,
          description: spec.description
        }))}
        selectedValue={data.specialization || null}
        onSelectionChange={(value) => onUpdate({ specialization: value })}
      />

      {/* Industry + Specialization Preview */}
      {(data.industryTrack || data.specialization) && (
        <div className="p-4 bg-accent/50 rounded-lg">
          <h4 className="font-medium mb-2">Your Focus Areas:</h4>
          <div className="space-y-2">
            {data.industryTrack && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Industry</Badge>
                <span className="text-sm">{INDUSTRY_TRACKS[data.industryTrack as keyof typeof INDUSTRY_TRACKS]}</span>
              </div>
            )}
            {data.specialization && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Specialization</Badge>
                <span className="text-sm">
                  {specializationOptions.find(s => s.value === data.specialization)?.label}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            These selections will customize your projects, examples, and resources
          </p>
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
          💡 Don't worry about choosing perfectly
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          You can always adjust your focus areas later. These selections help us customize 
          your initial learning path, but you'll explore multiple areas as you progress.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="px-8">
          Next: Time Commitment
        </Button>
      </div>
    </OnboardingCard>
  )
}