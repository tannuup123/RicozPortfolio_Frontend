import { apiFetch } from './client'

export const RoleName = {
    ORG_ADMIN: 'org_admin',
    PORTFOLIO_MANAGER: 'portfolio_manager',
    PROJECT_MANAGER: 'project_manager',
    TEAM_MEMBER: 'team_member',
} as const;

export type RoleName = typeof RoleName[keyof typeof RoleName];

export interface User {
    id: string
    email: string
    name: string
    organization_id: string
    roles: RoleName[]
}

export interface PaginatedUsers {
    items: User[]
    total: number
}

export interface GetUsersParams {
    limit?: number
    offset?: number
}

export interface CreateUserPayload {
    email: string
    password: string
    name: string
    roles?: RoleName[]
}

export interface UpdateUserPayload {
    name?: string
    is_active?: boolean
}

export interface UpdateUserRolesPayload {
    roles: RoleName[]
}

async function extractErrorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as Record<string, unknown>
        if (body.error && typeof body.error === 'object' && 'message' in (body.error as object)) {
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

export async function getUsers(params?: GetUsersParams): Promise<PaginatedUsers> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', params.limit.toString())
    if (params?.offset !== undefined) query.set('offset', params.offset.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch(`/users${queryString}`)
    
    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
    
    return res.json() as Promise<PaginatedUsers>
}

export async function createUser(data: CreateUserPayload): Promise<User> {
    const res = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(data),
    })
    
    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
    
    return res.json() as Promise<User>
}

export async function updateUser(userId: string, data: UpdateUserPayload): Promise<User> {
    const res = await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
    
    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
    
    return res.json() as Promise<User>
}

export async function updateUserRoles(userId: string, data: UpdateUserRolesPayload): Promise<User> {
    const res = await apiFetch(`/users/${userId}/roles`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
    
    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
    
    return res.json() as Promise<User>
}
