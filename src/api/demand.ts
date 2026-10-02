import { apiFetch } from './client'

export type IdeaStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'

export const IDEA_STATUSES = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    IN_REVIEW: 'in_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const

export const VALID_IDEA_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
    draft: ['submitted'],
    submitted: ['in_review'],
    in_review: ['approved', 'rejected'],
    approved: [],
    rejected: [],
}

export interface IdeaCreateRequest {
    title: string
    description: string
    strategic_goal_id?: string | null
    status?: 'draft' | 'submitted' | null
}

export interface IdeaUpdateRequest {
    title?: string | null
    description?: string | null
    status?: IdeaStatus | null
}

export interface IdeaResponse {
    id: string
    organization_id: string
    author_id: string
    title: string
    description: string
    status: IdeaStatus
    strategic_goal_id: string | null
    created_at: string
    updated_at: string
}

export interface IdeaListResponse {
    items: IdeaResponse[]
    total: number
}

export interface GetIdeasParams {
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

export async function getIdeas(params?: GetIdeasParams): Promise<IdeaListResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', params.limit.toString())
    if (params?.offset !== undefined) query.set('offset', params.offset.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch(`/ideas${queryString}`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<IdeaListResponse>
}

export async function getIdea(ideaId: string): Promise<IdeaResponse> {
    const res = await apiFetch(`/ideas/${ideaId}`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<IdeaResponse>
}

export async function createIdea(data: IdeaCreateRequest): Promise<IdeaResponse> {
    const res = await apiFetch('/ideas', {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<IdeaResponse>
}

export async function updateIdea(ideaId: string, data: IdeaUpdateRequest): Promise<IdeaResponse> {
    const res = await apiFetch(`/ideas/${ideaId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<IdeaResponse>
}

export async function deleteIdea(ideaId: string): Promise<void> {
    const res = await apiFetch(`/ideas/${ideaId}`, {
        method: 'DELETE',
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }
}
