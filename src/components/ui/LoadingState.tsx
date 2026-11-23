import React from 'react'

export interface LoadingStateProps {
  /** Accessible loading message. Defaults to "Loading...". */
  message?: React.ReactNode
  /** Spinner size. Defaults to `md`. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Accessible loading state.
 *
 * Uses `role="status"` and `aria-live="polite"` so screen readers announce the
 * loading message without interrupting the user. The spinner is decorative;
 * the message is always real text, so the state is never color-only.
 */
export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message = 'Loading...', size = 'md', className = '' }, ref) => {
    const spinnerSizes = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-[3px]',
      lg: 'h-8 w-8 border-4',
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`flex items-center justify-center gap-3 text-[var(--ink-soft)] ${className}`}
      >
        <span
          className={`shrink-0 animate-spin rounded-full border-[var(--border-strong)] border-t-[var(--primary)] ${spinnerSizes[size]}`}
          aria-hidden="true"
        />
        <span className="text-xs">{message}</span>
      </div>
    )
  },
)

LoadingState.displayName = 'LoadingState'
