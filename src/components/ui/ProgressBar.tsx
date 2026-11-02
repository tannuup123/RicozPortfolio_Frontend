import React from 'react'

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0 to 100
  max?: number
  tone?: ProgressTone
  showLabel?: boolean
  label?: string
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      tone = 'primary',
      showLabel = false,
      label,
      className = '',
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

    const toneColors: Record<ProgressTone, string> = {
      primary: 'bg-[var(--primary)]',
      success: 'bg-[var(--success)]',
      warning: 'bg-[var(--warning)]',
      danger: 'bg-[var(--danger)]',
    }

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {(showLabel || label) && (
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--ink-soft)]">
            <span>{label}</span>
            {showLabel && <span>{Math.round(percentage)}%</span>}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
          className="h-[5px] w-full overflow-hidden rounded-[5px] bg-[var(--progress-track)]"
        >
          <div
            className={`h-full transition-all duration-300 ease-out ${toneColors[tone]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  },
)

ProgressBar.displayName = 'ProgressBar'
