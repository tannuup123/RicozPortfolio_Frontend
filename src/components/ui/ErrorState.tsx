import React from 'react'
import { Button } from './Button'

export interface ErrorStateProps {
  /** Short error heading. Defaults to "Something went wrong". */
  title?: React.ReactNode
  /** Detailed, user-safe error message. */
  message?: React.ReactNode
  /** Optional retry handler. When omitted, no retry action is rendered. */
  onRetry?: () => void
  /** Accessible retry label. Defaults to "Retry". */
  retryLabel?: string
  className?: string
}

/**
 * Accessible error state with an optional retry action.
 *
 * Uses `role="alert"` so the error is announced immediately. The message is
 * always real text and the icon is decorative, so the state is not color-only.
 */
export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ title = 'Something went wrong', message, onRetry, retryLabel = 'Retry', className = '' }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-6 py-10 text-center ${className}`}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)]"
          aria-hidden="true"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </span>
        <div className="space-y-1">
          <p className="text-sm font-bold text-[var(--danger)]">{title}</p>
          {message && <p className="text-xs text-[var(--ink-soft)]">{message}</p>}
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    )
  },
)

ErrorState.displayName = 'ErrorState'
