import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Share2, Linkedin } from 'lucide-react'
import { LogEntry } from '@/lib/types'
import { 
  getLinkedInShareContent, 
  buildLinkedInShareUrl,
  LinkedInPost 
} from '@/lib/linkedinShare'
import { useAuth } from '@/auth/AuthProvider'

interface LinkedInShareButtonProps {
  entry?: LogEntry
  day?: number
  totalEntries?: number
  entries?: LogEntry[]
  weekNumber?: number
  type: 'entry' | 'milestone' | 'weekly'
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  forceShow?: boolean // Override ownership check for special cases
}

export function LinkedInShareButton({
  entry,
  day,
  totalEntries,
  entries,
  weekNumber,
  type,
  variant = 'outline',
  size = 'sm',
  className = '',
  forceShow = false
}: LinkedInShareButtonProps) {
  const { userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [customContent, setCustomContent] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  // Ownership check: only show share button for user's own posts (unless forced)
  if (type === 'entry' && entry && !forceShow) {
    const isOwner = entry.user_id && userId && entry.user_id === userId
    if (!isOwner) {
      return null // Don't render the button if user doesn't own the entry
    }
  }

  // Generate initial content
  const shareContent = getLinkedInShareContent({
    type,
    entry,
    day,
    totalEntries,
    entries,
    weekNumber
  })

  // Initialize custom content with generated content
  useState(() => {
    setCustomContent(shareContent.content)
  })

  const handleShare = async () => {
    setIsSharing(true)
    
    try {
      // Create the post object with custom content
      const postToShare: LinkedInPost = {
        ...shareContent,
        content: customContent
      }

      // Use browser-based sharing (opens LinkedIn in new tab)
      const shareUrl = buildLinkedInShareUrl(postToShare)
      window.open(shareUrl, '_blank', 'width=600,height=600')
      
      // Close the dialog after successful share
      setOpen(false)
      
    } catch (error) {
      console.error('[LinkedInShare] Error sharing:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'entry': return 'Share Entry'
      case 'milestone': return 'Share Milestone'
      case 'weekly': return 'Share Weekly Summary'
      default: return 'Share to LinkedIn'
    }
  }

  const getDialogTitle = () => {
    switch (type) {
      case 'entry': return 'Share Learning Entry to LinkedIn'
      case 'milestone': return `Share Day ${day} Milestone`
      case 'weekly': return `Share Week ${weekNumber} Summary`
      default: return 'Share to LinkedIn'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`gap-2 ${className}`}
        >
          <Linkedin className="h-4 w-4 text-[#0077B5]" />
          {size !== 'icon' && getButtonText()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0077B5]" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            Customize your post before sharing to LinkedIn. The content below has been pre-filled with a professional format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Content Editor */}
          <div>
            <label htmlFor="content" className="text-sm font-medium">
              Post Content
            </label>
            <Textarea
              id="content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              rows={8}
              className="mt-1"
              placeholder="Share your learning journey..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {customContent.length}/3000 characters
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-sm font-medium">Hashtags</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {shareContent.hashtags.map((hashtag) => (
                <Badge key={hashtag} variant="secondary" className="text-xs">
                  #{hashtag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hashtags help your post reach the right audience
            </p>
          </div>

          {/* URL Preview */}
          {shareContent.url && (
            <div>
              <label className="text-sm font-medium">Link</label>
              <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded text-sm">
                <ExternalLink className="h-4 w-4" />
                <span className="truncate">{shareContent.url}</span>
              </div>
            </div>
          )}

          {/* Share Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={isSharing || !customContent.trim()}
              className="bg-[#0077B5] hover:bg-[#005582] text-white"
            >
              {isSharing ? (
                <>
                  <Share2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Share to LinkedIn
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Convenience components for specific use cases
export function ShareLogEntryButton({ 
  entry, 
  className = "",
  variant = "outline",
  size = "sm"
}: { 
  entry: LogEntry
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  return (
    <LinkedInShareButton
      type="entry"
      entry={entry}
      variant={variant}
      size={size}
      className={className}
    />
  )
}

export function ShareMilestoneButton({ 
  day, 
  totalEntries,
  className = "",
  variant = "default",
  size = "default"
}: { 
  day: number
  totalEntries: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  return (
    <LinkedInShareButton
      type="milestone"
      day={day}
      totalEntries={totalEntries}
      variant={variant}
      size={size}
      className={className}
    />
  )
}

export function ShareWeeklySummaryButton({ 
  entries, 
  weekNumber,
  className = "",
  variant = "outline",
  size = "sm"
}: { 
  entries: LogEntry[]
  weekNumber: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  return (
    <LinkedInShareButton
      type="weekly"
      entries={entries}
      weekNumber={weekNumber}
      variant={variant}
      size={size}
      className={className}
    />
  )
}