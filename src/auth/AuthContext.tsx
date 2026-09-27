/**
 * Auth context.
 *
 * Phase 1 scope only: the shape of auth state and an in-memory access
 * token. There is no real login/register/refresh logic yet — that's an
 * Auth-phase task. The access token is deliberately never written to
 * localStorage/sessionStorage; see architecture.md Section 5.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { setAccessToken } from '../api/client'

export type Role = 'org_admin' | 'portfolio_manager' | 'project_manager' | 'team_member'

export interface AuthUser {
    id: string
    email: string
    fullName: string
    roles: Role[]
}

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    /** Called by the Auth-phase login/refresh logic once a session is established. */
    setSession: (user: AuthUser | null, accessToken: string | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    // Phase 1: no bootstrap call exists yet, so loading resolves immediately.
    // The Auth phase replaces this with a real silent-refresh-on-load check.
    const [isLoading] = useState(false)

    const setSession = (nextUser: AuthUser | null, accessToken: string | null) => {
        setUser(nextUser)
        setAccessToken(accessToken)
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            setSession,
        }),
        [user, isLoading],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return ctx
}