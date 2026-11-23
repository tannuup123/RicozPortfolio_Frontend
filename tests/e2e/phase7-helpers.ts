/**
 * Shared Phase 7 E2E helpers.
 *
 * Happy-path setup uses the real backend API. These helpers never log tokens or
 * passwords and never mock backend responses.
 */

import { expect, type APIRequestContext, type Page } from '@playwright/test'
import type { IdeaResponse } from '../../src/api/demand'
import type { PortfolioSummary } from '../../src/api/portfolios'
import type { ProjectMember, ProjectMemberRole, ProjectStatus, ProjectSummary } from '../../src/api/projects'
import type { RoleName, User } from '../../src/api/users'

export const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000'
export const DEFAULT_PASSWORD = 'Password123!'

const API = `${BACKEND_URL}/api/v1`

let uniqueCounter = 0

export interface TestAccount {
  name: string
  email: string
  password: string
  token: string
}

export interface TestUser extends User {
  token: string
}

export interface CreateUserInput {
  email: string
  password?: string
  name: string
  roles: RoleName[]
}

export interface CreateProjectInput {
  name: string
  description?: string | null
  /** Omit or pass null only when deliberately testing an unassigned project. */
  portfolio_id?: string | null
}

export function uniqueName(prefix: string): string {
  uniqueCounter += 1
  return `${prefix} ${Date.now()}-${uniqueCounter}`
}

export function uniqueEmail(prefix: string): string {
  uniqueCounter += 1
  return `phase7_${prefix}_${Date.now()}_${uniqueCounter}@testmail.dev`
}

export async function registerAccount(
  request: APIRequestContext,
  suffix: string,
): Promise<TestAccount> {
  const email = uniqueEmail(suffix)
  const password = DEFAULT_PASSWORD
  const name = `Phase7 ${suffix}`
  const organizationName = `Phase7 Org ${suffix} ${Date.now()}`

  const response = await request.post(`${API}/auth/register`, {
    data: {
      email,
      password,
      name,
      organization_name: organizationName,
    },
  })

  expect(response.status(), `Registration failed for ${email}`).toBe(201)
  const body = (await response.json()) as { access_token: string }

  return { name, email, password, token: body.access_token }
}

export async function createUser(
  request: APIRequestContext,
  adminToken: string,
  input: CreateUserInput,
): Promise<TestUser> {
  const password = input.password ?? DEFAULT_PASSWORD
  const response = await request.post(`${API}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      email: input.email,
      password,
      name: input.name,
      roles: input.roles,
    },
  })

  expect(response.status(), `Create user failed for ${input.email}`).toBe(201)
  const user = (await response.json()) as User
  const token = await loginApi(request, user.email, password)

  return { ...user, token }
}

export async function loginApi(
  request: APIRequestContext,
  email: string,
  password = DEFAULT_PASSWORD,
): Promise<string> {
  const response = await request.post(`${API}/auth/login`, {
    data: { email, password },
  })

  expect(response.status(), `API login failed for ${email}`).toBe(200)
  const body = (await response.json()) as { access_token: string }
  return body.access_token
}

export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/auth/login') &&
      response.request().method() === 'POST',
  )

  await page.getByRole('button', { name: /^Sign in$/i }).click()
  const loginResponse = await loginResponsePromise
  expect(
    loginResponse.status(),
    `UI login failed for ${email} with HTTP ${loginResponse.status()}`,
  ).toBe(200)

  await page.waitForURL('**/', { timeout: 20000 })
  await expect(
    page.getByRole('heading', { name: 'Portfolio Dashboard' }),
  ).toBeVisible({ timeout: 20000 })
}

export async function createPortfolioApi(
  request: APIRequestContext,
  token: string,
  name: string,
  description: string | null = null,
): Promise<PortfolioSummary> {
  const response = await request.post(`${API}/portfolios`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, description },
  })

  expect(response.status(), `Create portfolio failed: ${name}`).toBe(201)
  return (await response.json()) as PortfolioSummary
}

export async function deletePortfolioApi(
  request: APIRequestContext,
  token: string,
  portfolioId: string,
): Promise<void> {
  const response = await request.delete(`${API}/portfolios/${portfolioId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  expect(response.status(), `Delete portfolio failed: ${portfolioId}`).toBe(204)
}

export async function createProjectApi(
  request: APIRequestContext,
  token: string,
  input: CreateProjectInput,
): Promise<ProjectSummary> {
  const response = await request.post(`${API}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: input.name,
      description: input.description ?? null,
      portfolio_id: input.portfolio_id ?? null,
    },
  })

  expect(response.status(), `Create project failed: ${input.name}`).toBe(201)
  return (await response.json()) as ProjectSummary
}

export async function updateProjectApi(
  request: APIRequestContext,
  token: string,
  projectId: string,
  data: {
    name?: string
    description?: string
    status?: ProjectStatus
    portfolio_id?: string
  },
): Promise<ProjectSummary> {
  const response = await request.patch(`${API}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })

  expect(response.status(), `Update project failed: ${projectId}`).toBe(200)
  return (await response.json()) as ProjectSummary
}

export async function addProjectMemberApi(
  request: APIRequestContext,
  token: string,
  projectId: string,
  userId: string,
  projectRole: ProjectMemberRole = 'member',
): Promise<ProjectMember> {
  const response = await request.post(`${API}/projects/${projectId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { user_id: userId, project_role: projectRole },
  })

  expect(response.status(), `Add project member failed: ${userId}`).toBe(201)
  return (await response.json()) as ProjectMember
}

export async function createIdeaApi(
  request: APIRequestContext,
  token: string,
  title: string,
): Promise<IdeaResponse> {
  const response = await request.post(`${API}/ideas`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, description: `Phase 7 E2E idea: ${title}` },
  })

  expect(response.status(), `Create idea failed: ${title}`).toBe(201)
  return (await response.json()) as IdeaResponse
}

export async function attachBusinessCaseApi(
  request: APIRequestContext,
  token: string,
  ideaId: string,
): Promise<void> {
  const response = await request.post(`${API}/ideas/${ideaId}/business-case`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { estimated_cost: 100000, estimated_benefit: 250000 },
  })

  expect(response.status(), `Attach business case failed: ${ideaId}`).toBe(201)
}

export async function approveIdeaApi(
  request: APIRequestContext,
  token: string,
  ideaId: string,
): Promise<void> {
  const response = await request.post(`${API}/ideas/${ideaId}/approvals`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { decision: 'approved', notes: 'Phase 7 E2E approval' },
  })

  expect(response.status(), `Approve idea failed: ${ideaId}`).toBe(201)
}

export async function provisionApprovedIdea(
  request: APIRequestContext,
  token: string,
  title: string,
): Promise<IdeaResponse> {
  const idea = await createIdeaApi(request, token, title)
  await attachBusinessCaseApi(request, token, idea.id)
  await approveIdeaApi(request, token, idea.id)
  return idea
}

export async function convertIdeaApi(
  request: APIRequestContext,
  token: string,
  ideaId: string,
  portfolioId: string | null = null,
): Promise<ProjectSummary> {
  const response = await request.post(`${API}/ideas/${ideaId}/convert`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { portfolio_id: portfolioId },
  })

  expect(response.status(), `Convert idea failed: ${ideaId}`).toBe(201)
  return (await response.json()) as ProjectSummary
}

export async function gotoProject(
  page: Page,
  projectId: string,
): Promise<void> {
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname.endsWith(`/api/v1/projects/${projectId}`) &&
      response.request().method() === 'GET'
    )
  })

  await page.goto(`/projects/${projectId}`)
  await responsePromise
}
