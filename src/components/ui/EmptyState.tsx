import React from 'react'

export interface EmptyStateProps {
  /** Empty-state heading. Rendered as an `h2` so pages keep a single `h1`. */
  title?: React.ReactNode
  /** Supporting description. */
  description?: React.ReactNode
  /** Optional decorative icon. */
  icon?: React.ReactNode
  /** Optional action, such as a create button. */
  action?: React.ReactNode
  className?: string
}

/**
 * Accessible empty state with an optional action.
 *
 * The heading is semantic (`h2`), the description is plain text, and any action
 * is rendered by the caller as a real button/link.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title = 'Nothing here yet', description, icon, action, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-10 text-center ${className}`}
      >
        {icon && (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-teal)] text-[var(--primary)]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[var(--ink)]">{title}</h2>
          {description && <p className="max-w-[420px] text-xs text-[var(--ink-soft)]">{description}</p>}
        </div>
        {action && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div>}
      </div>
    )
  },
)

EmptyState.displayName = 'EmptyState'
