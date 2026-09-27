/**
 * Route guard that requires an authenticated session, and optionally a
 * specific set of roles.
 *
 * Phase 1 scope only: since there is no real authentication yet, this
 * always renders its children so the route tree can be exercised during
 * Foundation work. The Auth phase wires isAuthenticated up to a real
 * session, and the RBAC phase wires the roles check up to real enforcement.
 */

import type { ReactNode } from 'react'

import { useAuth, type Role } from './AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
    roles?: Role[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth()

    // Phase 1: no redirect-to-login exists yet (no login page has real logic
    // yet either). This check is a documented placeholder, not a security
    // boundary — see RBAC phase in implementation-plan.md.
    if (!isAuthenticated) {
        return children
    }

    if (roles && roles.length > 0 && user) {
        const hasRole = user.roles.some((role) => roles.includes(role))
        if (!hasRole) {
            return <p>You don't have access to this page.</p>
        }
    }

    return children
}
