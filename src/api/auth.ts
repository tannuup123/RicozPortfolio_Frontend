/**
 * Typed API functions for the /auth endpoints.
 *
 * All calls go through the shared apiFetch wrapper (credentials: 'include'
 * is therefore automatic). Callers are responsible for handling the returned
 * data — token storage, context updates, etc. — to keep this module free of
 * React/context dependencies.
 *
 * Endpoint contract (backend-authoritative):
 *   POST /auth/register  — { email, password, name, organization_name }
 *   POST /auth/login     — { email, password }
 *   POST /auth/refresh   — no body, httpOnly cookie; requires X-Requested-With header
 *   POST /auth/logout    — no body, clears cookie
 *   GET  /auth/me        — requires Authorization: Bearer <access_token>
 *
 * Error shape (backend global handler):
 *   { error: { code: string; message: string } }  — for domain errors
 *   { detail: string }                             — for FastAPI validation / auth errors
 */

import { apiFetch } from './client'

// ---------------------------------------------------------------------------
// Shared response types
// ---------------------------------------------------------------------------

export interface TokenResponse {
    access_token: string
    token_type: string
}

export interface MeResponse {
    id: string
    email: string
    name: string
    organization_id: string
    roles: string[]
}

// ---------------------------------------------------------------------------
// Request payload types
// ---------------------------------------------------------------------------

export interface RegisterPayload {
    email: string
    password: string
    name: string
    organization_name: string
}

export interface LoginPayload {
    email: string
    password: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a non-2xx response body and return a human-readable message.
 * The backend may return { error: { message } } or { detail }.
 */
async function extractErrorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as Record<string, unknown>
        if (
            body.error &&
            typeof body.error === 'object' &&
            'message' in (body.error as object)
        ) {
            return String((body.error as Record<string, unknown>).message)
        }
        if (typeof body.detail === 'string') {
            return body.detail
        }
    } catch {
        // ignore JSON parse errors
    }
    return `Request failed with status ${res.status}`
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Register a new user + organisation.
 * Returns the issued access token on success (201).
 */
export async function register(data: RegisterPayload): Promise<TokenResponse> {
    const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuthRetry: true,
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<TokenResponse>
}

/**
 * Log in with email + password.
 * Returns the issued access token on success (200).
 */
export async function login(data: LoginPayload): Promise<TokenResponse> {
    const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuthRetry: true,
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<TokenResponse>
}

/**
 * Silent refresh — reads the httpOnly cookie and returns a new access token.
 * MUST send the X-Requested-With header (backend CSRF mitigation).
 * Throws on any non-2xx response so callers can distinguish success/failure.
 */
export async function refresh(): Promise<TokenResponse> {
    const res = await apiFetch('/auth/refresh', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'RicozPortfolio',
        },
        skipAuthRetry: true, // prevent infinite retry loop
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<TokenResponse>
}

/**
 * Log out — instructs the backend to clear the httpOnly refresh cookie.
 */
export async function logout(): Promise<void> {
    const res = await apiFetch('/auth/logout', {
        method: 'POST',
        skipAuthRetry: true,
    })

    // A 200 is expected; anything else is silently ignored on logout
    // (the frontend clears its own state regardless).
    if (!res.ok) {
        console.warn('[auth] logout returned non-2xx:', res.status)
    }
}

/**
 * Fetch the currently authenticated user's profile.
 * Requires a valid access token in memory (set via setAccessToken).
 */
export async function getMe(): Promise<MeResponse> {
    const res = await apiFetch('/auth/me', {
        method: 'GET',
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<MeResponse>
}
