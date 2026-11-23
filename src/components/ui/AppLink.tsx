'use client'

import React from 'react'
import { Link as RouterLink, useInRouterContext } from 'react-router-dom'

export interface AppLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Destination used by the anchor fallback and by `LinkComponent`. */
  href?: string
  /** React Router destination. Used only when a router is present. */
  to?: string
  /** Next.js `Link` component supplied by the caller. Takes precedence. */
  LinkComponent?: React.ElementType
}

/**
 * Compatibility link for the Next.js and Vite/React Router baselines.
 *
 * - With `LinkComponent` (Next.js), render it with `href`.
 * - Otherwise, inside a React Router context with `to`, render Router `Link`.
 * - Otherwise, render a plain anchor.
 *
 * The router check uses `useInRouterContext` so rendering this component
 * outside a router never throws. It never renders a clickable `div`.
 */
export function AppLink({
  LinkComponent,
  to,
  href,
  className,
  children,
  ...rest
}: AppLinkProps) {
  const isInRouter = useInRouterContext()
  const destination = href ?? to

  if (LinkComponent) {
    const Component = LinkComponent
    return (
      <Component href={destination} className={className} {...rest}>
        {children}
      </Component>
    )
  }

  if (isInRouter && to !== undefined) {
    return (
      <RouterLink to={to} className={className} {...rest}>
        {children}
      </RouterLink>
    )
  }

  return (
    <a href={destination} className={className} {...rest}>
      {children}
    </a>
  )
}
