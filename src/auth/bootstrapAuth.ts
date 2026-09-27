/**
 * Bootstraps the session on app load by attempting a silent refresh against
 * the httpOnly refresh cookie.
 *
 * Auth-phase implementation — replaces the Phase 1 no-op stub.
 *
 * Flow:
 *   1. Call refresh() to get a new access token from the httpOnly cookie.
 *   2. On success: store the token in memory, call getMe() to fetch the user
 *      profile, then call setSession(user, token) to populate AuthContext.
 *   3. On failure (401 / no cookie / expired): leave the session as null.
 *      This is the expected outcome for a first-time visitor — not an error
 *      to surface to the user.
 *   4. Always call setIsLoading(false) so ProtectedRoute can proceed.
 *
 * Also registers the refresh handler with the API client so the 401-retry
 * logic in apiFetch actually works end-to-end: a failed API call will
 * attempt one silent refresh before giving up.
 *
 * Parameters are passed in (instead of imported from AuthContext) so this
 * module stays free of React/context imports and can be called from a
 * useEffect inside AuthProvider's scope via AppBootstrap in App.tsx.
 */

import { getMe, refresh } from '../api/auth'
import { registerRefreshHandler, setAccessToken } from '../api/client'
import type { AuthUser } from './AuthContext'

interface BootstrapCallbacks {
    setSession: (user: AuthUser | null, accessToken: string | null) => void
    setIsLoading: (loading: boolean) => void
}

/**
 * Wire the 401-auto-retry handler once. Idempotent — safe to call multiple
 * times (only the last registration takes effect in client.ts, but in
 * practice this is called once on app startup).
 */
function wireRefreshHandler(setSession: BootstrapCallbacks['setSession']): void {
    registerRefreshHandler(async (): Promise<boolean> => {
        try {
            const token = await refresh()
            setAccessToken(token.access_token)
            // Re-fetch user profile so AuthContext stays consistent after a
            // mid-session token rotation (e.g. after a background tab wake-up).
            const me = await getMe()
            setSession(
                {
                    id: me.id,
                    email: me.email,
                    name: me.name,
                    organization_id: me.organization_id,
                    roles: me.roles as AuthUser['roles'],
                },
                token.access_token,
            )
            return true
        } catch {
            // Refresh failed — clear the session so ProtectedRoute redirects.
            setSession(null, null)
            return false
        }
    })
}

export async function bootstrapAuth({ setSession, setIsLoading }: BootstrapCallbacks): Promise<void> {
    // Wire the 401 auto-retry handler first so any early API call (unlikely
    // on startup, but correct) can use it.
    wireRefreshHandler(setSession)

    try {
        const token = await refresh()
        setAccessToken(token.access_token)

        const me = await getMe()
        setSession(
            {
                id: me.id,
                email: me.email,
                name: me.name,
                organization_id: me.organization_id,
                roles: me.roles as AuthUser['roles'],
            },
            token.access_token,
        )
    } catch {
        // No valid cookie — expected for first-time visitors. Leave session null.
    } finally {
        // Always signal that the bootstrap check is complete so ProtectedRoute
        // can make its redirect decision without a premature flash.
        setIsLoading(false)
    }
}
