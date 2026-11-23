import { apiFetch } from './client'
import { parseApiError } from './errors'

export interface PortfolioSummary {
    id: string
    organization_id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
}

export interface PortfolioDetail extends PortfolioSummary {
    project_count: number
}

export interface CreatePortfolioPayload {
    name: string
    description?: string | null
}

export interface UpdatePortfolioPayload {
    name?: string
    description?: string | null
}

export interface PortfolioListResponse {
    items: PortfolioSummary[]
    total: number
}

export async function getPortfolios(params?: { limit?: number; offset?: number }): Promise<PortfolioListResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', params.limit.toString())
    if (params?.offset !== undefined) query.set('offset', params.offset.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch(`/portfolios${queryString}`)

    if (!res.ok) {
        throw await parseApiError(res)
    }

    return res.json() as Promise<PortfolioListResponse>
}

export async function createPortfolio(data: CreatePortfolioPayload): Promise<PortfolioSummary> {
    const res = await apiFetch('/portfolios', {
        method: 'POST',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        throw await parseApiError(res)
    }

    return res.json() as Promise<PortfolioSummary>
}

export async function getPortfolio(portfolioId: string): Promise<PortfolioDetail> {
    const res = await apiFetch(`/portfolios/${portfolioId}`)

    if (!res.ok) {
        throw await parseApiError(res)
    }

    return res.json() as Promise<PortfolioDetail>
}

export async function updatePortfolio(portfolioId: string, data: UpdatePortfolioPayload): Promise<PortfolioSummary> {
    const res = await apiFetch(`/portfolios/${portfolioId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        throw await parseApiError(res)
    }

    return res.json() as Promise<PortfolioSummary>
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
    const res = await apiFetch(`/portfolios/${portfolioId}`, {
        method: 'DELETE',
    })

    if (!res.ok) {
        throw await parseApiError(res)
    }

    // 204 responses are handled as void
}
