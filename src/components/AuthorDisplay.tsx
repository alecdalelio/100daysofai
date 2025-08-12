interface AuthorDisplayProps {
  profile?: {
    username: string | null
    display_name: string | null
  } | null
  className?: string
}

export function AuthorDisplay({ profile, className = "" }: AuthorDisplayProps) {
  const getAuthorName = () => {
    if (profile?.display_name) {
      return profile.display_name
    }
    if (profile?.username) {
      return `@${profile.username}`
    }
    return "Anonymous"
  }

  return (
    <span className={`text-sm text-muted-foreground ${className}`}>
      By {getAuthorName()}
    </span>
  )
}