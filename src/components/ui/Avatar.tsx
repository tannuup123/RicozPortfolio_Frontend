import React from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: AvatarSize
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'RP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', className = '', ...props }, ref) => {
    // Sizes matching Doc/figma-visual-spec.md §2 & §6
    const sizeStyles: Record<AvatarSize, string> = {
      sm: 'h-[25px] w-[25px] text-[9px]',
      md: 'h-[32px] w-[32px] text-[11px]',
      lg: 'h-[70px] w-[70px] text-[20px]',
    }

    const initials = getInitials(name)

    return (
      <div
        ref={ref}
        title={name}
        aria-label={name}
        className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-[var(--avatar-bg)] font-extrabold text-[var(--avatar-ink)] overflow-hidden ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide broken image so initials show
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    )
  },
)

Avatar.displayName = 'Avatar'
