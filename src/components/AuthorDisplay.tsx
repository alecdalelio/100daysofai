import { isStorageAvatarUrl } from '@/lib/avatarUpload'
import { gradientClass } from '@/constants/gradients'

interface AuthorDisplayProps {
  profile?: {
    username: string | null
    display_name: string | null
    avatar_gradient?: string | null
    linkedin_profile_url?: string | null
    linkedin_headline?: string | null
    linkedin_company?: string | null
  } | null
  className?: string
  showAvatar?: boolean
  avatarSize?: 'sm' | 'md'
  showLinkedIn?: boolean
}

export function AuthorDisplay({ 
  profile, 
  className = "", 
  showAvatar = false, 
  avatarSize = 'sm',
  showLinkedIn = false 
}: AuthorDisplayProps) {
  const getAuthorName = () => {
    if (profile?.display_name) {
      return profile.display_name
    }
    if (profile?.username) {
      return `@${profile.username}`
    }
    return "Anonymous"
  }

  const avatarValue = profile?.avatar_gradient || ''
  const sizeClasses = avatarSize === 'md' ? 'h-8 w-8' : 'h-6 w-6'

  const renderAvatar = () => {
    if (!showAvatar) return null

    if (isStorageAvatarUrl(avatarValue)) {
      return (
        <img 
          src={avatarValue} 
          alt={`${getAuthorName()} avatar`}
          className={`${sizeClasses} rounded-full object-cover border border-border flex-shrink-0`}
          onError={(e) => {
            // Fallback to gradient on error
            console.warn('[AuthorDisplay] Failed to load avatar image, falling back to gradient')
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    } else {
      // Gradient avatar
      const gradientClasses = gradientClass(avatarValue || 'grad-1')
      return (
        <div className={`${sizeClasses} rounded-full ${gradientClasses} flex-shrink-0`} />
      )
    }
  }

  const renderLinkedInInfo = () => {
    if (!showLinkedIn || !profile) return null
    
    const hasLinkedInInfo = profile.linkedin_headline || profile.linkedin_company
    if (!hasLinkedInInfo) return null
    
    return (
      <div className="text-xs text-muted-foreground/70 mt-1">
        {profile.linkedin_headline && (
          <div>{profile.linkedin_headline}</div>
        )}
        {profile.linkedin_company && (
          <div>at {profile.linkedin_company}</div>
        )}
      </div>
    )
  }

  if (showAvatar) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <div className="flex items-center gap-2">
          {renderAvatar()}
          <span>By {getAuthorName()}</span>
        </div>
        {renderLinkedInInfo()}
      </div>
    )
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span>By {getAuthorName()}</span>
      {renderLinkedInInfo()}
    </div>
  )
}