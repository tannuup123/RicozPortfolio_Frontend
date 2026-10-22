import { test, expect } from '@playwright/test'

/**
 * Helper to log in a user via the UI.
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

test.describe('Task B: Goals End-to-End Suite', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD
  const memberEmail = process.env.TEST_TEAM_MEMBER_EMAIL
  const memberPass = process.env.TEST_TEAM_MEMBER_PASSWORD

  test('Load Goals list and route aliases (/strategy/goals and /goals)', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    // Check primary route
    await page.goto('/strategy/goals')
    await expect(page.getByRole('heading', { name: /Strategic Goals/i })).toBeVisible()

    // Check alias route
    await page.goto('/goals')
    await expect(page.getByRole('heading', { name: /Strategic Goals/i })).toBeVisible()
  })

  test('Goal Creation with Validation and Cancellation', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)
    await page.goto('/strategy/goals')

    const createBtn = page.getByRole('button', { name: /Create Goal/i })
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // Modal opens
    await expect(page.getByRole('heading', { name: /Create Strategic Goal/i })).toBeVisible()

    // Test client-side validation
    const modalForm = page.locator('form')
    const submitBtn = modalForm.getByRole('button', { name: /Create Goal/i })
    await submitBtn.click()
    await expect(page.getByText('Title is required')).toBeVisible()

    // Test cancel modal without polluting database
    const cancelBtn = page.getByRole('button', { name: /Cancel/i })
    await cancelBtn.click()
    await expect(page.getByRole('heading', { name: /Create Strategic Goal/i })).not.toBeVisible()
  })

  test('team_member cannot see Goal creation or editing controls', async ({ page }) => {
    test.skip(!memberEmail || !memberPass, 'Skipping: member credentials not provided.')

    await loginUser(page, memberEmail!, memberPass!)
    await page.goto('/strategy/goals')
    await expect(page.getByRole('heading', { name: /Strategic Goals/i })).toBeVisible()

    // Mutation buttons must be hidden for non-admin
    await expect(page.getByRole('button', { name: /Create Goal/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Edit/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Delete/i })).not.toBeVisible()
  })
})
