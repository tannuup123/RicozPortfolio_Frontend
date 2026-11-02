import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className = '', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-[var(--shadow)] transition-all duration-180 ${className}`}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Card.displayName = 'Card'
