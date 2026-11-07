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

// ---------------------------------------------------------------------------
// Phase 6: Business Case Contracts & APIs
// ---------------------------------------------------------------------------

export interface BusinessCaseCreateRequest {
    estimated_cost: number
    estimated_benefit: number
}

export interface BusinessCaseUpdateRequest {
    estimated_cost: number
    estimated_benefit: number
}

export interface BusinessCaseResponse {
    id: string
    idea_id: string
    estimated_cost: number
    estimated_benefit: number
    roi: number | null
    created_at: string
    updated_at: string
}

export async function getBusinessCase(ideaId: string): Promise<BusinessCaseResponse | null> {
    const res = await apiFetch(`/ideas/${ideaId}/business-case`)

    if (res.status === 404) {
        return null
    }

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<BusinessCaseResponse>
}

export async function createBusinessCase(
    ideaId: string,
    data: BusinessCaseCreateRequest
): Promise<BusinessCaseResponse> {
    const res = await apiFetch(`/ideas/${ideaId}/business-case`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<BusinessCaseResponse>
}

export async function updateBusinessCase(
    ideaId: string,
    data: BusinessCaseUpdateRequest
): Promise<BusinessCaseResponse> {
    const res = await apiFetch(`/ideas/${ideaId}/business-case`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<BusinessCaseResponse>
}

// ---------------------------------------------------------------------------
// Phase 6: Approval Contracts & APIs
// ---------------------------------------------------------------------------

export type ApprovalDecision = 'approved' | 'rejected'

export interface ApprovalCreateRequest {
    decision: ApprovalDecision
    notes?: string | null
}

export interface ApprovalResponse {
    id: string
    idea_id: string
    approver_id: string
    decision: ApprovalDecision
    notes: string | null
    created_at: string
    updated_at: string
}

export interface ApprovalListResponse {
    items: ApprovalResponse[]
    total: number
}

export async function listApprovals(ideaId: string): Promise<ApprovalListResponse> {
    const res = await apiFetch(`/ideas/${ideaId}/approvals`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<ApprovalListResponse>
}

export async function createApproval(
    ideaId: string,
    data: ApprovalCreateRequest
): Promise<ApprovalResponse> {
    const res = await apiFetch(`/ideas/${ideaId}/approvals`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<ApprovalResponse>
}

// ---------------------------------------------------------------------------
// Phase 6: Project Conversion Contracts & APIs
// ---------------------------------------------------------------------------

export interface ProjectConvertRequest {
    portfolio_id?: string | null
}

export interface ProjectConvertedResponse {
    id: string
    organization_id: string
    name: string
    description: string | null
    status: string
    portfolio_id: string | null
    source_idea_id: string | null
    created_at: string
    updated_at: string
}

export async function convertIdeaToProject(
    ideaId: string,
    data: ProjectConvertRequest
): Promise<ProjectConvertedResponse> {
    const res = await apiFetch(`/ideas/${ideaId}/convert`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<ProjectConvertedResponse>
}

