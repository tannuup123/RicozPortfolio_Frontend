import { apiFetch } from './client'

export interface PortfolioSummary {
    id: string
    organization_id: string
    name: string
    description: string | null
    created_at: string
    updated_at: string
}

export interface PortfolioListResponse {
    items: PortfolioSummary[]
    total: number
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

export async function getPortfolios(params?: { limit?: number; offset?: number }): Promise<PortfolioListResponse> {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', params.limit.toString())
    if (params?.offset !== undefined) query.set('offset', params.offset.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const res = await apiFetch(`/portfolios${queryString}`)

    if (!res.ok) {
        const message = await extractErrorMessage(res)
        const err = new Error(message) as Error & { status: number }
        err.status = res.status
        throw err
    }

    return res.json() as Promise<PortfolioListResponse>
}
