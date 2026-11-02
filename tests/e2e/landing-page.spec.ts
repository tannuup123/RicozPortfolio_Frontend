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

test.describe('Phase 4: Landing Page & Root Route Architecture', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD

  test('1. Unauthenticated visitors to / see the marketing LandingPage without DashboardShell', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')

    // Hero title and content must be visible
    await expect(
      page.getByRole('heading', { name: /From strategic vision to delivered impact/i })
    ).toBeVisible()

    // Floating header and brand link present
    await expect(page.getByRole('banner').getByText('RicozPortfolio')).toBeVisible()

    // Key landing sections present
    await expect(page.getByText('MERIDIAN GLOBAL')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Measurable portfolio governance outcomes/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Purpose-built for enterprise portfolio mastery/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Ready to unify your strategic portfolio/i })).toBeVisible()

    // Dashboard shell sidebar & topbar must NOT be present
    await expect(page.locator('aside')).toHaveCount(0)
    await expect(page.getByPlaceholder('Search ideas, goals, portfolios...')).toHaveCount(0)

    // No uncaught runtime errors (ignoring 401 unauth session check)
    const unexpected = consoleErrors.filter(
      (err) => !err.includes('401') && !err.includes('status of 401')
    )
    expect(unexpected).toEqual([])
  })

  test('2. Header navigation links and CTA buttons navigate correctly', async ({ page }) => {
    await page.goto('/')

    // Sign in CTA link
    const signInBtn = page.getByRole('banner').getByRole('link', { name: /Sign in/i })
    await expect(signInBtn).toBeVisible()
    await expect(signInBtn).toHaveAttribute('href', '/login')

    // Get Started CTA link
    const getStartedBtn = page.getByRole('banner').getByRole('link', { name: /Get Started/i })
    await expect(getStartedBtn).toBeVisible()
    await expect(getStartedBtn).toHaveAttribute('href', '/register')
  })

  test('3. ThemeToggle on landing header toggles and persists theme', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const initialTheme = await html.getAttribute('data-theme')

    const toggleBtn = page.getByRole('banner').getByRole('button', { name: /Switch to (dark|light) theme/i })
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark'
    await expect(html).toHaveAttribute('data-theme', expectedTheme)

    const stored = await page.evaluate(() => localStorage.getItem('ricoz_theme_preference'))
    expect(stored).toBe(expectedTheme)
  })

  test('4. Responsive layout at tablet (820px) and mobile (620px)', async ({ page }) => {
    // Tablet breakpoint
    await page.setViewportSize({ width: 820, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /From strategic vision to delivered impact/i })).toBeVisible()

    // Mobile breakpoint
    await page.setViewportSize({ width: 620, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /From strategic vision to delivered impact/i })).toBeVisible()
    // Perspective window transform is preserved or responsive without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(630)
  })

  test('5. Authenticated users see DashboardOverviewView within DashboardShell at / (no duplicated shell)', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    // At root /, authenticated user should see dashboard overview
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Portfolio Dashboard/i })).toBeVisible()

    // Dashboard shell is present exactly once
    await expect(page.locator('aside')).toHaveCount(1)
    await expect(page.getByPlaceholder('Search ideas, goals, portfolios...')).toBeVisible()

    // Landing marketing elements must NOT be visible
    await expect(page.getByText('From strategic vision to delivered impact.')).not.toBeVisible()
  })
})
