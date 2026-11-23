import React from 'react'

export interface PageHeaderProps {
  /** Page title. Rendered as the page `h1`. */
  title: React.ReactNode
  /** Optional supporting description. */
  description?: React.ReactNode
  /** Optional actions, rendered on the right and stacked below on small screens. */
  actions?: React.ReactNode
  className?: string
}

/**
 * Figma-aligned page header.
 *
 * Renders the page `h1`, an optional description, and optional actions. The
 * layout stacks vertically on small screens and switches to a horizontal
 * space-between layout from `sm` upward.
 */
export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, description, actions, className = '' }, ref) => {
    return (
      <header
        ref={ref}
        className={`mb-[25px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${className}`}
      >
        <div className="min-w-0 space-y-1">
          <h1 className="text-[clamp(26px,2.5vw,36px)] font-[750] leading-[1.15] tracking-[-0.045em] text-[var(--ink)]">
            {title}
          </h1>
          {description && (
            <p className="max-w-[650px] text-xs leading-[1.6] text-[var(--ink-soft)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </header>
    )
  },
)

PageHeader.displayName = 'PageHeader'
