import { apiFetch } from './client'
import { parseApiError } from './errors'

export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectMemberRole = 'manager' | 'member'

export interface ProjectSummary {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: ProjectStatus
  portfolio_id: string | null
  source_idea_id: string | null
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends ProjectSummary {
  members: ProjectMember[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  user_name: string
  user_email: string
  project_role: ProjectMemberRole
  created_at: string
}

export interface ProjectListResponse {
  items: ProjectSummary[]
  total: number
}

export interface ProjectMemberListResponse {
  items: ProjectMember[]
  total: number
}

export interface GetProjectsParams {
  portfolio_id?: string
  status?: ProjectStatus
  limit?: number
  offset?: number
}

export interface CreateProjectPayload {
  name: string
  description?: string | null
  portfolio_id: string // Required by the Phase 7 UI; backend ProjectCreateRequest still permits null
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: ProjectStatus
  portfolio_id?: string
}

export interface AddProjectMemberPayload {
  user_id: string
  project_role?: ProjectMemberRole
}

export interface UpdateProjectMemberRolePayload {
  project_role: ProjectMemberRole
}

export async function getProjects(params?: GetProjectsParams): Promise<ProjectListResponse> {
  const query = new URLSearchParams()
  if (params?.portfolio_id !== undefined) query.set('portfolio_id', params.portfolio_id)
  if (params?.status !== undefined) query.set('status', params.status)
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.offset !== undefined) query.set('offset', params.offset.toString())

  const queryString = query.toString() ? `?${query.toString()}` : ''
  const res = await apiFetch(`/projects${queryString}`)

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectListResponse>
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const res = await apiFetch(`/projects/${projectId}`)

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectDetail>
}

export async function createProject(data: CreateProjectPayload): Promise<ProjectSummary> {
  // Validate portfolio_id before making the request
  validateCreateProjectPayload(data)
  
  const res = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectSummary>
}

export async function updateProject(projectId: string, data: UpdateProjectPayload): Promise<ProjectSummary> {
  const res = await apiFetch(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectSummary>
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await apiFetch(`/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  // 204 responses are handled as void
}

export async function getProjectMembers(projectId: string): Promise<ProjectMemberListResponse> {
  const res = await apiFetch(`/projects/${projectId}/members`)

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectMemberListResponse>
}

export async function addProjectMember(projectId: string, data: AddProjectMemberPayload): Promise<ProjectMember> {
  const res = await apiFetch(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectMember>
}

export async function updateProjectMemberRole(projectId: string, userId: string, data: UpdateProjectMemberRolePayload): Promise<ProjectMember> {
  const res = await apiFetch(`/projects/${projectId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<ProjectMember>
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const res = await apiFetch(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  // 204 responses are handled as void
}

// UI create guard: createProject must reject a missing, empty, or whitespace-only portfolio_id before making the HTTP request.
// The backend ProjectCreateRequest.portfolio_id remains optional/nullable; the narrower frontend
// type is a UI-level guard, not a backend contract change.
export function validateCreateProjectPayload(payload: Partial<CreateProjectPayload>): void {
  if (!payload.portfolio_id) {
    throw new Error('portfolio_id is required for project creation')
  }
  if (typeof payload.portfolio_id !== 'string' || payload.portfolio_id.trim() === '') {
    throw new Error('portfolio_id must be a non-empty string')
  }
}