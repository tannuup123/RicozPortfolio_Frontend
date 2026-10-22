/**
 * Thin fetch wrapper for the RicozPortfolio API.
 *
 * Phase 1 scope only: base URL, credentials handling, and the shape of the
 * 401-triggers-refresh flow. No resource-specific methods exist yet — those
 * are added module-by-module starting with the Auth phase.
 *
 * IMPORTANT: `credentials: 'include'` is required on every request so the
 * httpOnly refresh cookie is sent to the backend's domain (frontend and
 * backend are on different domains in production). See architecture.md
 * Section 5 for the full cross-domain cookie rationale.
 */

// Resolve API base URL for the current bundler / runtime.
//
// Next.js (webpack): reads NEXT_PUBLIC_API_URL which is statically inlined at
// build time. import.meta.env is NOT available under webpack and must not be
// referenced here -- doing so triggers a "Critical dependency" warning and can
// cause a runtime module-resolution crash in development mode.
//
// Vite: this file is shared, but when bundled by Vite NEXT_PUBLIC_API_URL is
// undefined and the fallback applies. Set VITE_API_URL in .env.local instead.
//
// Fallback: http://localhost:8000/api/v1 for local development without .env.
const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/api/v1'

let accessToken: string | null = null

/** Set by the auth module once login/refresh succeeds. In-memory only. */
export function setAccessToken(token: string | null): void {
    accessToken = token
}

export function getAccessToken(): string | null {
    return accessToken
}

interface RequestOptions extends RequestInit {
    skipAuthRetry?: boolean
}

/**
 * Refresh callback, injected by the auth module. Phase 1 leaves this as a
 * no-op stub since /auth/refresh does not exist yet — wiring it up is an
 * Auth-phase task, not a Foundation-phase one.
 */
let refreshAccessToken: () => Promise<boolean> = async () => false

export function registerRefreshHandler(fn: () => Promise<boolean>): void {
    refreshAccessToken = fn
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
    const { skipAuthRetry, headers, ...rest } = options

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...headers,
        },
    })

    if (response.status === 401 && !skipAuthRetry) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
            return apiFetch(path, { ...options, skipAuthRetry: true })
        }
    }

    return response
}
