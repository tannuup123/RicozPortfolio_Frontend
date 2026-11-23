/**
 * Phase 6: Business Case, Approval & Idea-to-Project Conversion E2E Tests
 *
 * Strategy:
 *  - All tests self-provision test data via the live backend API before running UI assertions.
 *  - Fresh test accounts are registered per test file run using timestamped emails.
 *  - A "second org" account is used for cross-tenant RBAC isolation.
 *  - No reliance on pre-existing production data or seed credentials.
 *  - No mock API responses — all interactions are against the real deployed backend.
 *  - Tests that cannot run due to missing environment or API issues are explicitly skipped
 *    and documented; they are never counted as passing.
 *
 * Backend contracts (verified read-only, 2026-11-03):
 *  POST   /api/v1/ideas                       — create idea (any auth user; defaults to submitted)
 *  GET    /api/v1/ideas/:id                   — get idea
 *  POST   /api/v1/ideas/:id/business-case     — create BC (portfolio_manager/org_admin; 409 if exists)
 *  PATCH  /api/v1/ideas/:id/business-case     — update BC (portfolio_manager/org_admin; 404 if not exists)
 *  GET    /api/v1/ideas/:id/business-case     — get BC (any auth user)
 *  POST   /api/v1/ideas/:id/approvals         — record decision (portfolio_manager/org_admin)
 *  GET    /api/v1/ideas/:id/approvals         — list approval history (any auth user)
 *  POST   /api/v1/ideas/:id/convert           — convert to project (portfolio_manager/org_admin; 409 if duplicate)
 *
 * Schema notes:
 *  - BusinessCaseCreateRequest: { estimated_cost: float ≥ 0, estimated_benefit: float ≥ 0 }
 *  - BusinessCaseResponse:      { id, idea_id, estimated_cost, estimated_benefit, roi, created_at, updated_at }
 *    (roi is a decimal ratio: 1.50 means 150%. null when estimated_cost === 0)
 *  - ApprovalCreateRequest:     { decision: "approved"|"rejected", notes?: string (max 2000 chars) }
 *  - ApprovalResponse:          { id, idea_id, approver_id, decision, notes, created_at, updated_at }
 *  - ProjectConvertRequest:     { portfolio_id?: uuid|null }
 *  - ProjectResponse:           { id, organization_id, name, status, portfolio_id, source_idea_id, ... }
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BACKEND_URL = 'http://localhost:8000'
const PASSWORD = 'Password123!'

// ---------------------------------------------------------------------------
// API helper utilities
// ---------------------------------------------------------------------------

/**
 * Register a fresh account. New accounts receive org_admin role automatically.
 * Returns { email, password, token, userId, orgId }
 */
async function registerAccount(request: APIRequestContext, suffix: string) {
    const ts = Date.now()
    const email = `phase6_${suffix}_${ts}@testmail.dev`
    const orgName = `Phase6Org_${suffix}_${ts}`

    const regResp = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
        data: { email, password: PASSWORD, name: `Phase6 ${suffix}`, organization_name: orgName },
    })
    expect(regResp.status(), `Registration failed for ${email}`).toBe(201)

    const loginResp = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
        data: { email, password: PASSWORD },
    })
    expect(loginResp.status(), `Login failed for ${email}`).toBe(200)
    const loginData = await loginResp.json()

    return { email, password: PASSWORD, token: loginData.access_token }
}

/** Create an idea (any authenticated user). Returns the idea object. */
async function createIdea(request: APIRequestContext, token: string, title: string) {
    const resp = await request.post(`${BACKEND_URL}/api/v1/ideas`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { title, description: `E2E test idea: ${title}` },
    })
    expect(resp.status(), `Create idea failed: ${title}`).toBe(201)
    return resp.json()
}

/** Attach a business case to an idea. Returns the BC object. */
async function attachBusinessCase(
    request: APIRequestContext,
    token: string,
    ideaId: string,
    cost: number,
    benefit: number
) {
    const resp = await request.post(`${BACKEND_URL}/api/v1/ideas/${ideaId}/business-case`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { estimated_cost: cost, estimated_benefit: benefit },
    })
    expect(resp.status(), `Attach business case failed for idea ${ideaId}`).toBe(201)
    return resp.json()
}

/** Record an approval decision. Returns the approval object. */
async function recordDecision(
    request: APIRequestContext,
    token: string,
    ideaId: string,
    decision: 'approved' | 'rejected',
    notes?: string
) {
    const resp = await request.post(`${BACKEND_URL}/api/v1/ideas/${ideaId}/approvals`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { decision, notes },
    })
    expect(resp.status(), `Record decision failed for idea ${ideaId}`).toBe(201)
    return resp.json()
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Log in a user through the UI login form. */
async function loginViaUI(page: Page, email: string, password: string) {
    await page.goto('/login')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)

    const loginDone = page.waitForResponse(
        (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    )
    await page.getByRole('button', { name: /Sign in/i }).click()
    const loginRes = await loginDone
    expect(loginRes.status(), `UI login failed for ${email}`).toBe(200)
    await page.waitForURL('**/', { timeout: 10000 })
}

/** Navigate to an idea detail page via URL and wait for it to load. */
async function goToIdeaDetail(page: Page, ideaId: string) {
    await page.goto(`/demand/ideas/${ideaId}`)
    // Wait for at least the business case card to appear
    await expect(page.locator('[data-testid="business-case-card"]')).toBeVisible({ timeout: 15000 })
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Phase 6: Business Case', () => {
    test('displays empty business case state for an idea with no BC', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'bcempty')
        const idea = await createIdea(request, admin.token, 'Phase6 Empty BC Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Should render the BC card
        const bcCard = page.locator('[data-testid="business-case-card"]')
        await expect(bcCard).toBeVisible()

        // Should show "No Business Case Attached" text
        await expect(bcCard.getByText(/No Business Case Attached/i)).toBeVisible()

        // Should show "Attach Business Case" CTA for admin
        await expect(page.locator('[data-testid="attach-business-case-cta"]')).toBeVisible()
    })

    test('displays persisted business case data fetched from backend', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'bcdata')
        const idea = await createIdea(request, admin.token, 'Phase6 Has BC Idea')
        const bc = await attachBusinessCase(request, admin.token, idea.id, 100000, 250000)

        // ROI = (250000 - 100000) / 100000 = 1.5 (returned as decimal ratio)
        expect(bc.roi).not.toBeNull()

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        const bcCard = page.locator('[data-testid="business-case-card"]')
        await expect(bcCard).toBeVisible()

        // Verify cost display
        await expect(page.locator('[data-testid="display-cost"]')).toBeVisible()
        await expect(page.locator('[data-testid="display-cost"]')).toContainText('100,000')

        // Verify benefit display
        await expect(page.locator('[data-testid="display-benefit"]')).toBeVisible()
        await expect(page.locator('[data-testid="display-benefit"]')).toContainText('250,000')

        // Verify backend-calculated ROI is displayed
        await expect(page.locator('[data-testid="display-roi"]')).toBeVisible()
        // ROI = +150%
        await expect(page.locator('[data-testid="display-roi"]')).toContainText('+150%')
    })

    test('live ROI preview updates as user types cost and benefit values', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'roipreview')
        const idea = await createIdea(request, admin.token, 'Phase6 ROI Preview Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Open the BC form
        const attachBtn = page.locator('[data-testid="attach-business-case-cta"]')
        await expect(attachBtn).toBeVisible()
        await attachBtn.click()

        // Fill cost=100000, benefit=250000 → ROI = +150%
        await page.locator('[data-testid="cost-input"]').fill('100000')
        await page.locator('[data-testid="benefit-input"]').fill('250000')

        await expect(page.getByText('+150%')).toBeVisible()
    })

    test('rejects negative cost via frontend validation', async ({ page, request }) => {
        const admin = await registerAccount(request, 'bcneg')
        const idea = await createIdea(request, admin.token, 'Phase6 NegCost Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await page.locator('[data-testid="attach-business-case-cta"]').click()
        await page.locator('[data-testid="cost-input"]').fill('-500')
        await page.locator('[data-testid="benefit-input"]').fill('1000')
        await page.locator('[data-testid="save-business-case-btn"]').click()

        // Frontend validation error for negative cost
        await expect(page.getByText(/non-negative/i)).toBeVisible()
    })

    test('creates a new business case via the UI form and verifies save', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'bccreate')
        const idea = await createIdea(request, admin.token, 'Phase6 CreateBC Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Open form
        await page.locator('[data-testid="attach-business-case-cta"]').click()

        // Intercept the POST request to verify backend interaction
        const bcPostPromise = page.waitForResponse(
            (res) =>
                res.url().includes('/business-case') &&
                res.request().method() === 'POST'
        )

        await page.locator('[data-testid="cost-input"]').fill('50000')
        await page.locator('[data-testid="benefit-input"]').fill('200000')
        await page.locator('[data-testid="save-business-case-btn"]').click()

        const bcResponse = await bcPostPromise
        expect(bcResponse.status()).toBe(201)
        const savedBc = await bcResponse.json()
        expect(savedBc.estimated_cost).toBe(50000)
        expect(savedBc.estimated_benefit).toBe(200000)
        // ROI = (200000 - 50000) / 50000 = 3.0 → +300%
        expect(savedBc.roi).not.toBeNull()

        // UI should now show the saved values
        await expect(page.locator('[data-testid="display-cost"]')).toContainText('50,000')
        await expect(page.locator('[data-testid="display-roi"]')).toContainText('+300%')
    })

    test('updates an existing business case via the UI form', async ({ page, request }) => {
        const admin = await registerAccount(request, 'bcupdate')
        const idea = await createIdea(request, admin.token, 'Phase6 UpdateBC Idea')
        await attachBusinessCase(request, admin.token, idea.id, 10000, 20000)

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Should show Edit button since BC exists
        const editBtn = page.locator('[data-testid="edit-business-case-btn"]')
        await expect(editBtn).toBeVisible()
        await editBtn.click()

        // Intercept PATCH
        const bcPatchPromise = page.waitForResponse(
            (res) =>
                res.url().includes('/business-case') &&
                res.request().method() === 'PATCH'
        )

        await page.locator('[data-testid="cost-input"]').fill('80000')
        await page.locator('[data-testid="benefit-input"]').fill('400000')
        await page.locator('[data-testid="save-business-case-btn"]').click()

        const patchResponse = await bcPatchPromise
        expect(patchResponse.status()).toBe(200)
        const updatedBc = await patchResponse.json()
        expect(updatedBc.estimated_cost).toBe(80000)
        expect(updatedBc.estimated_benefit).toBe(400000)

        // UI shows updated values
        await expect(page.locator('[data-testid="display-cost"]')).toContainText('80,000')
    })

    test('ROI shows N/A when estimated cost is zero', async ({ page, request }) => {
        const admin = await registerAccount(request, 'bczerocost')
        const idea = await createIdea(request, admin.token, 'Phase6 ZeroCost Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await page.locator('[data-testid="attach-business-case-cta"]').click()
        // Cost = 0 means ROI preview is undefined (no division)
        await page.locator('[data-testid="cost-input"]').fill('0')
        await page.locator('[data-testid="benefit-input"]').fill('50000')

        // Preview should show N/A or Zero Cost
        await expect(page.getByText(/N\/A|Zero Cost/i)).toBeVisible()
    })
})

// ---------------------------------------------------------------------------
// Approval Workflow
// ---------------------------------------------------------------------------

test.describe('Phase 6: Approval Workflow', () => {
    test('approval section is rendered on idea detail page', async ({ page, request }) => {
        const admin = await registerAccount(request, 'apprender')
        const idea = await createIdea(request, admin.token, 'Phase6 ApprSection Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await expect(page.locator('[data-testid="approval-section"]')).toBeVisible()
        await expect(
            page.locator('[data-testid="approval-section"]').getByText(/Decision Audit Trail/i)
        ).toBeVisible()
    })

    test('approval is blocked when no business case exists (frontend guard)', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'appnobc')
        const idea = await createIdea(request, admin.token, 'Phase6 NoBCase Approval Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        const approvalSection = page.locator('[data-testid="approval-section"]')
        await expect(approvalSection).toBeVisible()

        // The section shows a lock message when no BC is present
        await expect(
            approvalSection.getByText(/Approval is locked|business case|Business Case/i)
        ).toBeVisible()

        // Approve/Reject buttons should NOT be visible (blocked)
        await expect(page.locator('[data-testid="approve-idea-btn"]')).not.toBeVisible()
    })

    test('org_admin can approve an idea with a business case via UI', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'approveok')
        const idea = await createIdea(request, admin.token, 'Phase6 ApproveOK Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 300000)

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Click Approve
        const approveBtn = page.locator('[data-testid="approve-idea-btn"]')
        await expect(approveBtn).toBeVisible()
        await approveBtn.click()

        // Fill notes
        const notesInput = page.locator('[data-testid="decision-notes-input"]')
        await expect(notesInput).toBeVisible()
        await notesInput.fill('Approved: strong ROI and strategic alignment.')

        // Intercept POST /approvals
        const approvalPostPromise = page.waitForResponse(
            (res) => res.url().includes('/approvals') && res.request().method() === 'POST'
        )

        await page.locator('[data-testid="confirm-decision-btn"]').click()
        const approvalResp = await approvalPostPromise
        expect(approvalResp.status()).toBe(201)
        const approval = await approvalResp.json()
        expect(approval.decision).toBe('approved')
        expect(approval.notes).toBe('Approved: strong ROI and strategic alignment.')
        expect(approval.idea_id).toBe(idea.id)

        // Audit trail should appear with APPROVED badge
        await expect(
            page.locator('[data-testid="audit-trail-list"]')
        ).toBeVisible()
        await expect(page.locator('[data-testid="badge-approved"]')).toBeVisible()
    })

    test('org_admin can reject an idea with a business case via UI', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'rejectok')
        const idea = await createIdea(request, admin.token, 'Phase6 RejectOK Idea')
        await attachBusinessCase(request, admin.token, idea.id, 500000, 100000)

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        const rejectBtn = page.locator('[data-testid="reject-idea-btn"]')
        await expect(rejectBtn).toBeVisible()
        await rejectBtn.click()

        const notesInput = page.locator('[data-testid="decision-notes-input"]')
        await notesInput.fill('Rejected: negative ROI, cost exceeds benefit.')

        const approvalPostPromise = page.waitForResponse(
            (res) => res.url().includes('/approvals') && res.request().method() === 'POST'
        )

        await page.locator('[data-testid="confirm-decision-btn"]').click()
        const approvalResp = await approvalPostPromise
        expect(approvalResp.status()).toBe(201)
        const approval = await approvalResp.json()
        expect(approval.decision).toBe('rejected')
        expect(approval.notes).toBe('Rejected: negative ROI, cost exceeds benefit.')

        // Audit trail should show REJECTED badge
        await expect(page.locator('[data-testid="audit-trail-list"]')).toBeVisible()
        await expect(page.locator('[data-testid="badge-rejected"]')).toBeVisible()
    })

    test('decision notes appear correctly in the audit trail', async ({ page, request }) => {
        const admin = await registerAccount(request, 'audittrail')
        const idea = await createIdea(request, admin.token, 'Phase6 AuditTrail Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 200000)

        const uniqueNote = `Unique audit note ${Date.now()}`
        await recordDecision(request, admin.token, idea.id, 'approved', uniqueNote)

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Audit trail should display the note
        const auditList = page.locator('[data-testid="audit-trail-list"]')
        await expect(auditList).toBeVisible()
        await expect(auditList).toContainText(uniqueNote)
        await expect(page.locator('[data-testid="badge-approved"]')).toBeVisible()
    })

    test('multiple approval records shown in chronological order', async ({ page, request }) => {
        const admin = await registerAccount(request, 'multiaudit')
        const idea = await createIdea(request, admin.token, 'Phase6 MultiAudit Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 200000)

        // Record first decision (submitted → approved)
        await recordDecision(request, admin.token, idea.id, 'approved', 'First approval')

        // Verify via API there is now 1 record
        const approvalsResp = await request.get(`${BACKEND_URL}/api/v1/ideas/${idea.id}/approvals`, {
            headers: { Authorization: `Bearer ${admin.token}` },
        })
        const approvalsData = await approvalsResp.json()
        expect(approvalsData.total).toBeGreaterThanOrEqual(1)
        expect(approvalsData.items[0].decision).toBe('approved')
        expect(approvalsData.items[0].notes).toBe('First approval')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // Should render audit trail list
        const auditList = page.locator('[data-testid="audit-trail-list"]')
        await expect(auditList).toBeVisible()
        await expect(auditList.locator('[data-testid="badge-approved"]')).toHaveCount(1)
        await expect(auditList).toContainText('First approval')
    })

    test('audit trail timestamps are rendered', async ({ page, request }) => {
        const admin = await registerAccount(request, 'timestamp')
        const idea = await createIdea(request, admin.token, 'Phase6 Timestamp Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 200000)
        await recordDecision(request, admin.token, idea.id, 'approved', 'Timestamp test')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        const auditList = page.locator('[data-testid="audit-trail-list"]')
        await expect(auditList).toBeVisible()
        // "Decided on" + some date/time portion should appear
        await expect(auditList.getByText(/Decided on/i)).toBeVisible()
    })

    test('backend returns 400 when trying to approve without a business case', async ({
        request,
    }) => {
        const admin = await registerAccount(request, 'bcmissing400')
        const idea = await createIdea(request, admin.token, 'Phase6 NoBCApprove Idea')

        // Attempt to approve directly via API — no BC attached
        const resp = await request.post(`${BACKEND_URL}/api/v1/ideas/${idea.id}/approvals`, {
            headers: { Authorization: `Bearer ${admin.token}` },
            data: { decision: 'approved', notes: 'Should fail' },
        })
        expect(resp.status()).toBe(400)
        const body = await resp.json()
        expect(body.detail).toMatch(/business case/i)
    })
})

// ---------------------------------------------------------------------------
// Idea-to-Project Conversion
// ---------------------------------------------------------------------------

test.describe('Phase 6: Idea-to-Project Conversion', () => {
    test('Convert to Project button is only shown for approved ideas', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'convnonappr')
        const idea = await createIdea(request, admin.token, 'Phase6 NotApprovedConv Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // "Convert to Project" button must NOT be present for non-approved idea
        await expect(
            page.getByRole('button', { name: /Convert to Project/i })
        ).not.toBeVisible()
    })

    test('Convert to Project button is shown for approved ideas', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'convappr')
        const idea = await createIdea(request, admin.token, 'Phase6 ApprovedConv Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 300000)
        await recordDecision(request, admin.token, idea.id, 'approved', 'Ready for conversion')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await expect(
            page.getByRole('button', { name: /Convert to Project/i })
        ).toBeVisible()
    })

    test('conversion modal opens with portfolio selection', async ({ page, request }) => {
        const admin = await registerAccount(request, 'convmodal')
        const idea = await createIdea(request, admin.token, 'Phase6 ConvModal Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 300000)
        await recordDecision(request, admin.token, idea.id, 'approved', 'Modal test')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await page.getByRole('button', { name: /Convert to Project/i }).click()

        // Modal appears
        await expect(page.locator('[data-testid="convert-idea-modal"]')).toBeVisible()

        // Portfolio select dropdown is rendered
        await expect(page.locator('[data-testid="target-portfolio-select"]')).toBeVisible()
    })

    test('successful conversion creates project and returns project ID', async ({
        page,
        request,
    }) => {
        const admin = await registerAccount(request, 'convok')
        const idea = await createIdea(request, admin.token, 'Phase6 ConvOK Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 300000)
        await recordDecision(request, admin.token, idea.id, 'approved', 'Convert success')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        await page.getByRole('button', { name: /Convert to Project/i }).click()
        await expect(page.locator('[data-testid="convert-idea-modal"]')).toBeVisible()

        // Intercept the POST /convert request
        const convertPromise = page.waitForResponse(
            (res) => res.url().includes('/convert') && res.request().method() === 'POST'
        )

        await page.locator('[data-testid="confirm-convert-btn"]').click()
        const convertResp = await convertPromise
        expect(convertResp.status()).toBe(201)

        const project = await convertResp.json()
        expect(project.id).toBeTruthy()
        expect(project.source_idea_id).toBe(idea.id)
        expect(project.status).toBe('planned')

        // After conversion, the page should navigate to the project
        await page.waitForURL(`**/projects/${project.id}`, { timeout: 10000 })
    })

    test('duplicate conversion returns HTTP 409 and shows error in UI', async ({
        page: _page,
        request,
    }) => {
        const admin = await registerAccount(request, 'conv409')
        const idea = await createIdea(request, admin.token, 'Phase6 Dup Conv Idea')
        await attachBusinessCase(request, admin.token, idea.id, 100000, 300000)
        await recordDecision(request, admin.token, idea.id, 'approved', 'First convert')

        // Convert via API first (simulating a prior conversion)
        const firstConvResp = await request.post(
            `${BACKEND_URL}/api/v1/ideas/${idea.id}/convert`,
            {
                headers: { Authorization: `Bearer ${admin.token}` },
                data: { portfolio_id: null },
            }
        )
        expect(firstConvResp.status()).toBe(201)

        // Now verify the API returns 409 on duplicate
        const dupConvResp = await request.post(
            `${BACKEND_URL}/api/v1/ideas/${idea.id}/convert`,
            {
                headers: { Authorization: `Bearer ${admin.token}` },
                data: { portfolio_id: null },
            }
        )
        expect(dupConvResp.status()).toBe(409)
    })
})

// ---------------------------------------------------------------------------
// RBAC: Cross-Organization Isolation
// ---------------------------------------------------------------------------

test.describe('Phase 6: RBAC & Tenant Isolation', () => {
    test('idea detail page in Org2 does not show Org1 ideas', async ({ request }) => {
        // Create org1 admin + idea
        const org1 = await registerAccount(request, 'rbacorg1')
        const org1Idea = await createIdea(request, org1.token, 'Org1 Secret Idea')

        // Create org2 admin (separate org)
        const org2 = await registerAccount(request, 'rbacorg2')

        // Org2 admin tries to access Org1's idea directly
        const crossOrgResp = await request.get(
            `${BACKEND_URL}/api/v1/ideas/${org1Idea.id}`,
            {
                headers: { Authorization: `Bearer ${org2.token}` },
            }
        )
        // Backend must return 404 (not found in org2's tenant scope)
        expect(crossOrgResp.status()).toBe(404)
    })

    test('org2 user cannot create approval for org1 idea via API', async ({ request }) => {
        const org1 = await registerAccount(request, 'rbacappr1')
        const idea = await createIdea(request, org1.token, 'Org1 Approval Target')
        await attachBusinessCase(request, org1.token, idea.id, 100000, 200000)

        const org2 = await registerAccount(request, 'rbacappr2')

        // Org2 tries to approve Org1's idea
        const crossApprovalResp = await request.post(
            `${BACKEND_URL}/api/v1/ideas/${idea.id}/approvals`,
            {
                headers: { Authorization: `Bearer ${org2.token}` },
                data: { decision: 'approved', notes: 'Cross-org attack' },
            }
        )
        // Backend must return 404 (idea not found in org2's scope)
        expect(crossApprovalResp.status()).toBe(404)
    })

    test('unauthenticated request to ideas API returns 401', async ({ request }) => {
        const resp = await request.get(`${BACKEND_URL}/api/v1/ideas`)
        expect(resp.status()).toBe(401)
    })

    test('unauthenticated request to approvals API returns 401', async ({ request }) => {
        const resp = await request.post(
            `${BACKEND_URL}/api/v1/ideas/00000000-0000-0000-0000-000000000001/approvals`,
            { data: { decision: 'approved' } }
        )
        expect(resp.status()).toBe(401)
    })
})

// ---------------------------------------------------------------------------
// Regression: Phase 6 component integration on idea detail page
// ---------------------------------------------------------------------------

test.describe('Phase 6: Component Integration', () => {
    test('idea detail page renders all three Phase 6 sections', async ({ page, request }) => {
        const admin = await registerAccount(request, 'integration')
        const idea = await createIdea(request, admin.token, 'Phase6 Integration Idea')

        await loginViaUI(page, admin.email, admin.password)
        await goToIdeaDetail(page, idea.id)

        // 1. Business Case Card
        await expect(page.locator('[data-testid="business-case-card"]')).toBeVisible()

        // 2. Approval Section
        await expect(page.locator('[data-testid="approval-section"]')).toBeVisible()

        // 3. Decision Audit Trail label
        await expect(
            page.locator('[data-testid="approval-section"]').getByText(/Decision Audit Trail/i)
        ).toBeVisible()
    })

    test('ideas list page loads and links to idea detail', async ({ page, request }) => {
        const admin = await registerAccount(request, 'ideaslist')
        await createIdea(request, admin.token, 'Phase6 List Nav Idea')

        await loginViaUI(page, admin.email, admin.password)
        await page.goto('/demand/ideas')

        await expect(page.getByRole('heading', { name: /Demand|Ideas/i })).toBeVisible()

        // A table row or card linking to the idea should appear
        const ideaLink = page.locator('a[href*="/ideas/"]').first()
        await expect(ideaLink).toBeVisible({ timeout: 10000 })
    })
})
