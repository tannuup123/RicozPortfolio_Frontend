import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    // Base styles according to Doc/figma-visual-spec.md §6
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-180 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

    // Variants matching spec §6
    const variantStyles = {
      primary:
        'bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_4px_10px_color-mix(in_srgb,var(--primary)_22%,transparent)] hover:bg-[var(--primary-hover)] hover:-translate-y-px active:translate-y-0 focus:ring-[var(--focus-ring)]',
      secondary:
        'bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus:ring-[var(--focus-ring)]',
      ghost:
        'bg-transparent border border-transparent text-[var(--ink-soft)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus:ring-[var(--focus-ring)]',
      danger:
        'bg-[var(--surface)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] text-[var(--danger)] hover:bg-[var(--danger-bg)] focus:ring-[var(--danger)]',
    }

    // Geometry sizes
    const sizeStyles = {
      sm: 'min-h-[32px] px-2.5 py-1 text-[10px] rounded-[var(--radius-sm)] gap-1.5',
      md: 'min-h-[38px] px-3.5 py-1.5 text-[11px] rounded-[var(--radius-sm)] gap-2',
      lg: 'min-h-[44px] px-4 py-2 text-[12px] rounded-[var(--radius-sm)] gap-2.5',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-3.5 w-3.5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
