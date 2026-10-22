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

test.describe('Task E: Portfolios and Projects Placeholder Verification', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD

  test('PortfolioListPage renders placeholder accurately', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)
    await page.goto('/portfolios')

    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()
    await expect(
      page.getByText('Placeholder — wired up in a later phase.')
    ).toBeVisible()
  })

  test('PortfolioDetailPage renders placeholder accurately', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)
    await page.goto('/portfolios/test-portfolio-id-123')

    await expect(page.getByRole('heading', { name: 'Portfolio Detail' })).toBeVisible()
    await expect(
      page.getByText('Placeholder — wired up in a later phase.')
    ).toBeVisible()
  })

  test('ProjectDetailPage renders placeholder accurately', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)
    await page.goto('/projects/test-project-id-123')

    await expect(page.getByRole('heading', { name: 'Project Detail' })).toBeVisible()
    await expect(
      page.getByText('Placeholder — wired up in a later phase.')
    ).toBeVisible()
  })
})
