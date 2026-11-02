'use client'

/**
 * Root Page (/) — Dual-mode entry point:
 * - Unauthenticated visitors: renders the full marketing LandingPage without DashboardShell.
 * - Authenticated visitors: renders DashboardOverviewView within the shared (dashboard) layout / DashboardShell.
 *
 * Auth bootstrap behavior:
 * - While isLoading is true, shows an unobtrusive loader while silent-refresh completes.
 * - When bootstrap settles:
 *     - If isAuthenticated: renders DashboardOverviewView (DashboardShell is provided by the (dashboard) layout).
 *     - If not authenticated: renders the public LandingPage.
 */

import { useAuth } from '../../auth/AuthContext'
import { DashboardOverviewView } from '../../features/dashboard/DashboardOverviewView'
import { LandingPage } from '../../features/landing/LandingPage'

export default function RootHomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--primary)]" />
          <p className="text-xs font-semibold text-[var(--ink-soft)]">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <DashboardOverviewView />
  }

  return <LandingPage />
}
