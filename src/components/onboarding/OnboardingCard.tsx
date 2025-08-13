import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReactNode } from "react"

interface OnboardingCardProps {
  title: string
  description?: string
  children: ReactNode
  step?: number
  totalSteps?: number
  className?: string
}

export function OnboardingCard({
  title,
  description,
  children,
  step,
  totalSteps,
  className = ""
}: OnboardingCardProps) {
  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-2">{description}</CardDescription>
            )}
          </div>
          {step && totalSteps && (
            <Badge variant="secondary" className="text-sm">
              {step} of {totalSteps}
            </Badge>
          )}
        </div>
        
        {step && totalSteps && (
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  )
}

interface SelectableOptionProps {
  value: string
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  icon?: ReactNode
  className?: string
}

export function SelectableOption({
  value,
  label,
  description,
  selected,
  onClick,
  icon,
  className = ""
}: SelectableOptionProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${selected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-primary/50 hover:bg-accent/50'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="font-medium">{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MultiSelectGroupProps {
  title: string
  description?: string
  options: Array<{
    value: string
    label: string
    description?: string
    icon?: ReactNode
  }>
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  maxSelections?: number
  className?: string
}

export function MultiSelectGroup({
  title,
  description,
  options,
  selectedValues,
  onSelectionChange,
  maxSelections,
  className = ""
}: MultiSelectGroupProps) {
  const handleToggle = (value: string) => {
    const isSelected = selectedValues.includes(value)
    let newSelection: string[]
    
    if (isSelected) {
      newSelection = selectedValues.filter(v => v !== value)
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return // Don't allow more selections
      }
      newSelection = [...selectedValues, value]
    }
    
    onSelectionChange(newSelection)
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="font-medium text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {maxSelections && (
          <p className="text-xs text-muted-foreground mt-1">
            Select up to {maxSelections} options ({selectedValues.length}/{maxSelections})
          </p>
        )}
      </div>
      
      <div className="grid gap-3">
        {options.map((option) => (
          <SelectableOption
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedValues.includes(option.value)}
            onClick={() => handleToggle(option.value)}
            icon={option.icon}
          />
        ))}
      </div>
    </div>
  )
}

interface SingleSelectGroupProps {
  title: string
  description?: string
  options: Array<{
    value: string
    label: string
    description?: string
    icon?: ReactNode
  }>
  selectedValue: string | null
  onSelectionChange: (value: string) => void
  className?: string
}

export function SingleSelectGroup({
  title,
  description,
  options,
  selectedValue,
  onSelectionChange,
  className = ""
}: SingleSelectGroupProps) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="font-medium text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="grid gap-3">
        {options.map((option) => (
          <SelectableOption
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedValue === option.value}
            onClick={() => onSelectionChange(option.value)}
            icon={option.icon}
          />
        ))}
      </div>
    </div>
  )
}