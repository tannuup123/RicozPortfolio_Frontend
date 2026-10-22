'use client'

/**
 * Dashboard layout — auth guard + application shell for all protected routes.
 *
 * This is the Next.js App Router equivalent of:
 *   Vite: <ProtectedRoute><AppShell /></ProtectedRoute> wrapping all dashboard routes
 *
 * Auth guard behavior (mirrors ProtectedRoute.tsx):
 *   - While isLoading (bootstrapAuth is running): show a loading spinner so
 *     the silent-refresh attempt completes before any redirect decision is made.
 *     This prevents a premature redirect-to-login flash for users with a valid
 *     refresh cookie.
 *   - If !isAuthenticated after loading: redirect to /login.
 *   - If authenticated: render the AppShell with the page as its child.
 *
 * RBAC: individual pages can enforce role requirements by reading useAuth()
 * themselves. Route-level role restrictions are not applied at this layout level
 * because all current dashboard routes are equally accessible to any logged-in
 * user (matching the Vite routes.tsx behaviour).
 *
 * Navigation: uses next/link and next/navigation (not react-router-dom).
 * The Vite AppShell.tsx is kept intact — it uses react-router-dom and remains
 * the Vite application's shell.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'

import { logout } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/strategy/goals', label: 'Strategy' },
  { href: '/demand/ideas', label: 'Demand' },
  { href: '/portfolios', label: 'Portfolios' },
  { href: '/users', label: 'Users' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, setSession } = useAuth()
  const router = useRouter()

  // While bootstrapAuth is running, show a spinner to avoid a premature
  // redirect-to-login before the silent-refresh attempt settles.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    )
  }

  // Bootstrap complete — not authenticated: redirect to login.
  if (!isAuthenticated) {
    // router.replace is client-side; this runs after hydration.
    router.replace('/login')
    // Render nothing while the navigation is in flight.
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      // Clear in-memory token and AuthContext state regardless of server response.
      setSession(null, null)
      router.replace('/login')
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 p-4">
        <div className="mb-6 text-lg font-semibold">RicozPortfolio</div>
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-700 hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <span className="text-sm text-gray-500">
            {user ? `${user.name} (${user.email})` : 'RicozPortfolio'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
