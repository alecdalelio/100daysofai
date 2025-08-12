import React from 'react'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  'aria-label'?: string
}

export function NavPill({ href, children, className, ...rest }: Props) {
  return (
    <a
      href={href}
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        'border border-white/15 bg-black/40 backdrop-blur',
        'shadow-none ring-0 transition-all duration-150',
        'hover:border-white/30',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-fuchsia-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        className || ''
      ].join(' ')}
      {...rest}
    >
      {children}
    </a>
  )
}


