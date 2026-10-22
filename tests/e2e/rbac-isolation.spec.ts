import { test, expect } from '@playwright/test'

/**
 * Helper to log in a user via the UI and wait for the access token & redirect.
 */
async function loginUser(page: any, email: string, pass: string) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(pass)

  const tokenPromise = page.waitForResponse(
    (res: any) => res.url().includes('/auth/login') && res.request().method() === 'POST'
  )
  await page.getByRole('button', { name: /Sign in/i }).click()
  const tokenResponse = await tokenPromise
  expect(
    tokenResponse.status(),
    `Expected /auth/login to succeed with HTTP 200, but received HTTP ${tokenResponse.status()}`
  ).toBe(200)
  await page.waitForURL('**/')
}

test.describe('E2E Session Restoration & Sign Out', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD

  test('Valid login, silent HttpOnly session restoration after reload, and logout', async ({
    page,
  }) => {
    test.skip(
      !adminEmail || !adminPass,
      'Skipping session restoration test: TEST_ORG_ADMIN_EMAIL/TEST_USER_EMAIL and password not provided.'
    )

    // 1. Initial Login
    await loginUser(page, adminEmail!, adminPass!)
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // 2. Page reload - test silent refresh via HttpOnly cookie
    const refreshPromise = page.waitForResponse(
      (res) => res.url().includes('/auth/refresh') && res.status() === 200
    )
    await page.reload()
    await refreshPromise

    // Verify user is still authenticated and sees the Dashboard
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // 3. Sign out
    const logoutBtn = page.getByRole('button', { name: /Sign out/i })
    await expect(logoutBtn).toBeVisible()

    const logoutPromise = page.waitForResponse(
      (res) => res.url().includes('/auth/logout') && res.status() === 200
    )
    await logoutBtn.click()
    await logoutPromise

    // Verify redirected to /login
    await page.waitForURL('**/login')
    expect(page.url()).toContain('/login')

    // 4. Verify logged-out user cannot access protected dashboard content
    await page.goto('/')
    await page.waitForURL('**/login')
    expect(page.url()).toContain('/login')
    await expect(page.getByRole('heading', { name: /Sign in to RicozPortfolio/i })).toBeVisible()
  })
})

test.describe('E2E Role-Based Access Control (RBAC)', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD

  const memberEmail = process.env.TEST_TEAM_MEMBER_EMAIL
  const memberPass = process.env.TEST_TEAM_MEMBER_PASSWORD

  test('org_admin sees creation and administrative controls for Goals and Users', async ({
    page,
  }) => {
    test.skip(
      !adminEmail || !adminPass,
      'Skipping org_admin RBAC test: TEST_ORG_ADMIN_EMAIL and TEST_ORG_ADMIN_PASSWORD not set.'
    )

    await loginUser(page, adminEmail!, adminPass!)

    // Check Goals: org_admin should see "Create Goal" button
    await page.goto('/strategy/goals')
    await expect(page.getByRole('heading', { name: /Strategic Goals/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Goal/i })).toBeVisible()

    // Check Users: org_admin should see "Create User" button
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create User/i })).toBeVisible()
  })

  test('team_member has read-only access (creation buttons hidden)', async ({ page }) => {
    test.skip(
      !memberEmail || !memberPass,
      'Skipping team_member RBAC test: TEST_TEAM_MEMBER_EMAIL and TEST_TEAM_MEMBER_PASSWORD not set.'
    )

    await loginUser(page, memberEmail!, memberPass!)

    // Check Goals: team_member should NOT see "Create Goal"
    await page.goto('/strategy/goals')
    await expect(page.getByRole('heading', { name: /Strategic Goals/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Goal/i })).not.toBeVisible()

    // Check Users: team_member should NOT see "Create User"
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create User/i })).not.toBeVisible()
  })
})

test.describe('E2E Multi-Tenant Data Isolation', () => {
  const org1Email = process.env.TEST_ORG1_USER_EMAIL || process.env.TEST_ORG_ADMIN_EMAIL
  const org1Pass = process.env.TEST_ORG1_USER_PASSWORD || process.env.TEST_ORG_ADMIN_PASSWORD

  const org2Email = process.env.TEST_ORG2_USER_EMAIL
  const org2Pass = process.env.TEST_ORG2_USER_PASSWORD

  test('Users in Org 1 and Org 2 see strictly isolated organization data', async ({
    browser,
  }) => {
    test.skip(
      !org1Email || !org1Pass || !org2Email || !org2Pass,
      'Skipping tenant-isolation test: requires both Org 1 and Org 2 credentials (TEST_ORG1_USER_EMAIL/PASSWORD & TEST_ORG2_USER_EMAIL/PASSWORD).'
    )

    // Context 1: Organization 1
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await loginUser(page1, org1Email!, org1Pass!)

    const org1Info = await page1.locator('code').textContent()

    // Context 2: Organization 2
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await loginUser(page2, org2Email!, org2Pass!)

    const org2Info = await page2.locator('code').textContent()

    // Assert organization IDs displayed on dashboard are distinct
    expect(org1Info).toBeTruthy()
    expect(org2Info).toBeTruthy()
    expect(org1Info).not.toEqual(org2Info)

    // Fetch users list in Org 1 and assert Org 2 user is not visible
    await page1.goto('/users')
    await expect(page1.getByText(org2Email!)).not.toBeVisible()

    // Fetch users list in Org 2 and assert Org 1 user is not visible
    await page2.goto('/users')
    await expect(page2.getByText(org1Email!)).not.toBeVisible()

    await context1.close()
    await context2.close()
  })
})
