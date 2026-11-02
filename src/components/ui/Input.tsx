import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-[10px] font-bold text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-[var(--muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                  ? `${inputId}-hint`
                  : undefined
            }
            className={`min-h-[42px] w-full rounded-[var(--radius-sm)] border bg-[var(--input-bg)] px-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] transition-colors focus:outline-hidden focus:ring-3 ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[color-mix(in_srgb,var(--danger)_18%,transparent)]'
                : 'border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-[var(--primary-ring)]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[var(--muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-[8px] font-medium text-[var(--danger)]">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1 text-[8px] font-medium text-[var(--muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
