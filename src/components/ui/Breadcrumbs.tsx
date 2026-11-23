import React from 'react'
import { AppLink } from './AppLink'

export interface BreadcrumbItem {
  label: React.ReactNode
  /** Destination for non-current items. Omit for the current page. */
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Separator rendered between items. Defaults to a slash. */
  separator?: React.ReactNode
  /** Next.js `Link` component supplied by the caller for client-side navigation. */
  LinkComponent?: React.ElementType
  className?: string
}

/**
 * Accessible breadcrumb navigation.
 *
 * Uses `<nav aria-label="Breadcrumb">` with an ordered list. Non-current items
 * with an `href` render through `AppLink`; the final item is marked with
 * `aria-current="page"`.
 */
export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, separator = '/', LinkComponent, className = '' }, ref) => {
    if (items.length === 0) return null

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-soft)]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const showSeparator = !isLast

            return (
              <li key={index} className="flex items-center gap-1.5">
                {isLast || !item.href ? (
                  <span
                    className={isLast ? 'font-medium text-[var(--ink)]' : undefined}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <AppLink
                    to={item.href}
                    LinkComponent={LinkComponent}
                    className="transition-colors hover:text-[var(--primary)]"
                  >
                    {item.label}
                  </AppLink>
                )}
                {showSeparator && (
                  <span className="text-[var(--muted)]" aria-hidden="true">
                    {separator}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  },
)

Breadcrumbs.displayName = 'Breadcrumbs'
