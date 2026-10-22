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

test.describe('Task C: Demand & Ideas End-to-End Suite', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD

  test('Load Ideas list and route aliases (/demand/ideas and /ideas)', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    // Check primary route
    await page.goto('/demand/ideas')
    await expect(page.getByRole('heading', { name: /Demand & Ideas/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Submit Idea/i })).toBeVisible()

    // Check alias route
    await page.goto('/ideas')
    await expect(page.getByRole('heading', { name: /Demand & Ideas/i })).toBeVisible()
  })

  test('Idea submission modal validation and cancellation', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)
    await page.goto('/demand/ideas')

    const submitIdeaBtn = page.getByRole('button', { name: /Submit Idea/i })
    await expect(submitIdeaBtn).toBeVisible()
    await submitIdeaBtn.click()

    // Modal opens
    await expect(page.getByRole('heading', { name: /Submit New Idea/i })).toBeVisible()

    // Test form validation
    const modalForm = page.locator('form')
    const submitBtn = modalForm.getByRole('button', { name: /Submit Idea/i })
    await submitBtn.click()
    await expect(page.getByText('Title is required')).toBeVisible()

    // Cancel modal
    const cancelBtn = page.getByRole('button', { name: /Cancel/i })
    await cancelBtn.click()
    await expect(page.getByRole('heading', { name: /Submit New Idea/i })).not.toBeVisible()
  })
})
