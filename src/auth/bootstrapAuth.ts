/**
 * Bootstraps the session on app load by attempting a silent refresh
 * against the httpOnly refresh cookie.
 *
 * Phase 1 stub only: /auth/refresh does not exist yet, so this always
 * resolves to "no session". The Auth phase replaces the body of this
 * function with a real call via api/client's apiFetch and populates
 * AuthContext via setSession on success.
 */

export async function bootstrapAuth(): Promise<void> {
    // Intentionally a no-op in Phase 1 — see module docstring.
    return Promise.resolve()
}
