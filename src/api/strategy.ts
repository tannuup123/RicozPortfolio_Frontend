import { apiFetch } from './client'

export interface StrategicGoalResponse {
    id: string
    organization_id: string
    title: string
    description: string | null
    created_at: string
    updated_at: string
}

export interface StrategicGoalListResponse {
    items: StrategicGoalResponse[]
    total: number
}

export interface StrategicGoalCreateRequest {
    title: string
    description?: string | null
}

export interface StrategicGoalUpdateRequest {
    title?: string | null
    description?: string | null
}

export interface GetGoalsParams {
    limit?: number
    offset?: number
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

export async function getGoals(params?: GetGoalsParams): Promise<StrategicGoalListResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', params.limit.toString())
    if (params?.offset !== undefined) query.set('offset', params.offset.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch(`/strategic-goals${queryString}`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<StrategicGoalListResponse>
}

export async function getGoal(goalId: string): Promise<StrategicGoalResponse> {
    const res = await apiFetch(`/strategic-goals/${goalId}`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<StrategicGoalResponse>
}

export async function createGoal(data: StrategicGoalCreateRequest): Promise<StrategicGoalResponse> {
    const res = await apiFetch('/strategic-goals', {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<StrategicGoalResponse>
}

export async function updateGoal(goalId: string, data: StrategicGoalUpdateRequest): Promise<StrategicGoalResponse> {
    const res = await apiFetch(`/strategic-goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<StrategicGoalResponse>
}

export async function deleteGoal(goalId: string): Promise<void> {
    const res = await apiFetch(`/strategic-goals/${goalId}`, {
        method: 'DELETE',
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
}
