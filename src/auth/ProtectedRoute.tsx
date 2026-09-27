/**
 * Route guard that requires an authenticated session, and optionally a
 * specific set of roles.
 *
 * Auth phase implementation:
 *  - While isLoading (bootstrapping silent-refresh), shows a loading spinner
 *    to prevent premature redirect-to-login flash.
 *  - If !isAuthenticated and !isLoading, redirects to /login.
 *  - If roles are specified, verifies user role membership.
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth, type Role } from './AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
    roles?: Role[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth()

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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (roles && roles.length > 0 && user) {
        const hasRole = user.roles.some((role) => roles.includes(role))
        if (!hasRole) {
            return <p>You don't have access to this page.</p>
        }
    }

    return children
}
