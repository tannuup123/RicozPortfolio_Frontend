import React from 'react'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  showDot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = 'neutral',
      showDot = true,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    // Tones matching Doc/figma-visual-spec.md §1 & §6
    const toneStyles: Record<BadgeTone, { container: string; dot: string }> = {
      neutral: {
        container: 'bg-[var(--neutral-bg)] text-[var(--neutral-ink)]',
        dot: 'bg-[var(--neutral-ink)]',
      },
      success: {
        container: 'bg-[var(--success-bg)] text-[var(--success)]',
        dot: 'bg-[var(--success)]',
      },
      warning: {
        container: 'bg-[var(--warning-bg)] text-[var(--warning)]',
        dot: 'bg-[var(--warning)]',
      },
      danger: {
        container: 'bg-[var(--danger-bg)] text-[var(--danger)]',
        dot: 'bg-[var(--danger)]',
      },
      info: {
        container: 'bg-[var(--info-bg)] text-[var(--info)]',
        dot: 'bg-[var(--info)]',
      },
    }

    const { container, dot } = toneStyles[tone]

    return (
      <span
        ref={ref}
        className={`inline-flex min-h-[22px] items-center gap-1.5 rounded-[20px] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${container} ${className}`}
        {...props}
      >
        {showDot && (
          <span
            className={`h-[5px] w-[5px] shrink-0 rounded-full ${dot}`}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    )
  },
)

Badge.displayName = 'Badge'
