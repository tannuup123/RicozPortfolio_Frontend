import React from 'react'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 block text-[10px] font-bold text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : hint
                ? `${textareaId}-hint`
                : undefined
          }
          className={`min-h-[90px] w-full rounded-[var(--radius-sm)] border bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] transition-colors focus:outline-hidden focus:ring-3 ${
            error
              ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[color-mix(in_srgb,var(--danger)_18%,transparent)]'
              : 'border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-[var(--primary-ring)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1 text-[8px] font-medium text-[var(--danger)]">
            {error}
          </p>
        ) : hint ? (
          <p id={`${textareaId}-hint`} className="mt-1 text-[8px] font-medium text-[var(--muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
