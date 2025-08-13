import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Trophy, Target, Flame, X, Star } from 'lucide-react'
import { ShareMilestoneButton } from './LinkedInShareButton'
import { useMilestones } from '@/hooks/useMilestones'

export function MilestoneCelebration() {
  const { currentMilestone, dismissMilestone, hasMilestone } = useMilestones()
  const [isOpen, setIsOpen] = useState(false)

  // Show milestone dialog when a new milestone is detected
  useEffect(() => {
    if (currentMilestone?.isNew) {
      setIsOpen(true)
    }
  }, [currentMilestone])

  if (!currentMilestone) return null

  const handleClose = () => {
    setIsOpen(false)
    dismissMilestone()
  }

  const getMilestoneIcon = (day: number) => {
    if (day >= 100) return <Trophy className="h-8 w-8 text-yellow-500" />
    if (day >= 75) return <Flame className="h-8 w-8 text-orange-500" />
    if (day >= 50) return <Target className="h-8 w-8 text-blue-500" />
    if (day >= 25) return <Sparkles className="h-8 w-8 text-purple-500" />
    return <Star className="h-8 w-8 text-green-500" />
  }

  const getMilestoneColor = (day: number) => {
    if (day >= 100) return 'from-yellow-500/20 to-orange-500/20'
    if (day >= 75) return 'from-orange-500/20 to-red-500/20'
    if (day >= 50) return 'from-blue-500/20 to-purple-500/20'
    if (day >= 25) return 'from-purple-500/20 to-pink-500/20'
    return 'from-green-500/20 to-blue-500/20'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getMilestoneIcon(currentMilestone.day)}
              Milestone Reached!
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Congratulations on reaching this learning milestone!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Milestone Card */}
          <Card className={`bg-gradient-to-br ${getMilestoneColor(currentMilestone.day)} border-2`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
                  Day {currentMilestone.day}
                </Badge>
              </div>
              <CardTitle className="text-xl">
                {currentMilestone.message}
              </CardTitle>
              <CardDescription>
                {currentMilestone.totalEntries} learning entries documented
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {currentMilestone.day}
              </div>
              <div className="text-sm text-muted-foreground">
                Days Completed
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {currentMilestone.totalEntries}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Entries
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentMilestone.day}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-electric h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentMilestone.day, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <ShareMilestoneButton
              day={currentMilestone.day}
              totalEntries={currentMilestone.totalEntries}
              variant="default"
              size="sm"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex-1"
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline milestone card for displaying on dashboard/home page
 */
export function MilestoneCard({ 
  day, 
  totalEntries,
  className = "" 
}: { 
  day: number
  totalEntries: number
  className?: string
}) {
  const getMilestoneIcon = (day: number) => {
    if (day >= 100) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (day >= 75) return <Flame className="h-6 w-6 text-orange-500" />
    if (day >= 50) return <Target className="h-6 w-6 text-blue-500" />
    if (day >= 25) return <Sparkles className="h-6 w-6 text-purple-500" />
    return <Star className="h-6 w-6 text-green-500" />
  }

  const getMilestoneColor = (day: number) => {
    if (day >= 100) return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
    if (day >= 75) return 'from-orange-500/10 to-red-500/10 border-orange-500/20'
    if (day >= 50) return 'from-blue-500/10 to-purple-500/10 border-blue-500/20'
    if (day >= 25) return 'from-purple-500/10 to-pink-500/10 border-purple-500/20'
    return 'from-green-500/10 to-blue-500/10 border-green-500/20'
  }

  const milestones = {
    25: 'First Quarter Complete! 🎯',
    50: 'Halfway There! 🔥',
    75: 'In the Home Stretch! 💪',
    100: 'Challenge Complete! 🎉'
  }

  const defaultMessage = `Day ${day} Milestone! 🚀`
  const message = milestones[day as keyof typeof milestones] || defaultMessage

  return (
    <Card className={`bg-gradient-to-br ${getMilestoneColor(day)} hover:scale-105 transition-transform ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getMilestoneIcon(day)}
            <div>
              <CardTitle className="text-lg">{message}</CardTitle>
              <CardDescription>
                Day {day} • {totalEntries} entries
              </CardDescription>
            </div>
          </div>
          <ShareMilestoneButton
            day={day}
            totalEntries={totalEntries}
            size="sm"
            variant="outline"
          />
        </div>
      </CardHeader>
    </Card>
  )
}