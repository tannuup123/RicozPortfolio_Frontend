/**
 * Auth context.
 *
 * Holds the in-memory authenticated user and access token. The access token
 * is deliberately never written to localStorage/sessionStorage — see
 * architecture.md Section 5.
 *
 * Auth-phase changes vs Phase 1:
 *  - AuthUser.name replaces AuthUser.fullName to match the /auth/me API contract.
 *  - AuthUser.organization_id added (returned by /auth/me, useful in later phases).
 *  - isLoading starts as `true` and is flipped to `false` by bootstrapAuth once
 *    the silent-refresh attempt (success or failure) settles. ProtectedRoute relies
 *    on this to avoid flashing a redirect-to-login before the cookie check completes.
 *  - setIsLoading is exposed on the context so bootstrapAuth can signal completion.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { setAccessToken } from '../api/client'

export type Role = 'org_admin' | 'portfolio_manager' | 'project_manager' | 'team_member'

export interface AuthUser {
    id: string
    email: string
    name: string
    organization_id: string
    roles: Role[]
}

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    /** True while bootstrapAuth is running its silent-refresh attempt on app load. */
    isLoading: boolean
    /** Called by the auth module once a session is established or cleared. */
    setSession: (user: AuthUser | null, accessToken: string | null) => void
    /** Called by bootstrapAuth once the initial silent-refresh attempt completes. */
    setIsLoading: (loading: boolean) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    // Starts true so ProtectedRoute waits for the silent-refresh attempt before
    // deciding whether to redirect. bootstrapAuth flips this to false when done.
    const [isLoading, setIsLoading] = useState(true)

    const setSession = useCallback((nextUser: AuthUser | null, accessToken: string | null) => {
        setUser(nextUser)
        setAccessToken(accessToken)
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            setSession,
            setIsLoading,
        }),
        [user, isLoading, setSession, setIsLoading],
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