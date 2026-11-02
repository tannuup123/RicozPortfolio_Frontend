'use client'

/**
 * DashboardAuthGuard — Client-side route protection for authenticated Next.js dashboard routes.
 *
 * Auth guard behavior:
 *   - While isLoading (bootstrapAuth is running): render a session loading spinner
 *     so the silent-refresh attempt completes before any redirect decision is made.
 *   - If !isAuthenticated after loading: redirect to /login via router.replace.
 *   - If authenticated: render children (typically DashboardShell).
 */

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'

export interface DashboardAuthGuardProps {
  children: ReactNode
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--primary)]" />
          <p className="text-xs font-semibold text-[var(--ink-soft)]">
            Loading session...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
