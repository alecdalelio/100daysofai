import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type QuickFormValues = {
  aiExperience: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  goals: string
  weeklyHours: number
  durationDays: 30 | 60 | 100 | 180
  specialization?: string
}

interface QuickFormProps {
  initial?: Partial<QuickFormValues>
  onSubmit: (values: QuickFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function QuickForm({ initial, onSubmit, onCancel, isSubmitting }: QuickFormProps) {
  const [values, setValues] = useState<QuickFormValues>({
    aiExperience: initial?.aiExperience ?? 'beginner',
    goals: initial?.goals ?? '',
    weeklyHours: initial?.weeklyHours ?? 7,
    durationDays: (initial?.durationDays as QuickFormValues['durationDays']) ?? 100,
    specialization: initial?.specialization ?? ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Quick Setup (1–2 minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>AI experience</Label>
              <Select
                value={values.aiExperience}
                onValueChange={(v) => setValues((s) => ({ ...s, aiExperience: v as QuickFormValues['aiExperience'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novice">Novice</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weekly hours</Label>
              <Input
                type="number"
                min={1}
                max={40}
                value={values.weeklyHours}
                onChange={(e) => setValues((s) => ({ ...s, weeklyHours: Number(e.target.value || 1) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary goals (comma-separated)</Label>
            <Textarea
              rows={3}
              placeholder="e.g., master MCP and RAG, ship two AI agents, monetize one project"
              value={values.goals}
              onChange={(e) => setValues((s) => ({ ...s, goals: e.target.value }))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan duration</Label>
              <Select
                value={String(values.durationDays)}
                onValueChange={(v) => setValues((s) => ({ ...s, durationDays: Number(v) as QuickFormValues['durationDays'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="100">100 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Focus area (optional)</Label>
              <Input
                placeholder="e.g., MCP, agents, RAG, data engineering"
                value={values.specialization}
                onChange={(e) => setValues((s) => ({ ...s, specialization: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>← Back</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating…' : 'Generate My Plan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


