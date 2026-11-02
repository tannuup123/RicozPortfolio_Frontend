'use client'

/**
 * Dashboard layout — auth guard + application shell for all dashboard routes.
 *
 * For the root route (/):
 *   - If unauthenticated, the root page renders the public LandingPage, so we bypass
 *     the DashboardShell and DashboardAuthGuard to avoid wrapping the landing page in a dashboard frame.
 *   - If authenticated, the root page renders inside DashboardShell.
 *
 * For all other dashboard routes (/strategy/*, /demand/*, /portfolios/*, /users/*):
 *   - Strictly guarded by DashboardAuthGuard + rendered in DashboardShell.
 */

import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

import { useAuth } from '../../auth/AuthContext'
import { DashboardAuthGuard } from '../../components/layout/DashboardAuthGuard'
import { DashboardShell } from '../../components/layout/DashboardShell'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  // For the root route: let unauthenticated visitors render the marketing page without a dashboard frame
  const isRootRoute = pathname === '/'

  if (isRootRoute && !isAuthenticated && !isLoading) {
    return <>{children}</>
  }

  return (
    <DashboardAuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </DashboardAuthGuard>
  )
}
