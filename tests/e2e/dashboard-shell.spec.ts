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

test.describe('Phase 3: Dashboard Shell and Navigation Suite', () => {
  const adminEmail = process.env.TEST_ORG_ADMIN_EMAIL || process.env.TEST_USER_EMAIL
  const adminPass = process.env.TEST_ORG_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD

  test('Sidebar elements, brand, and active navigation highlight correctly', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    // Brand and logo present
    await expect(page.getByText('RicozPortfolio')).toBeVisible()
    await expect(page.getByText('Enterprise PPM')).toBeVisible()

    // Sidebar navigation links present
    const nav = page.locator('nav')
    await expect(nav.getByRole('link', { name: /Overview/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Strategic Goals/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Ideas Pipeline/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Portfolios/i })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Team Members/i })).toBeVisible()

    // Test active state highlighting on Strategic Goals
    await nav.getByRole('link', { name: /Strategic Goals/i }).click()
    await page.waitForURL('**/strategy/goals')
    const activeGoalLink = nav.getByRole('link', { name: /Strategic Goals/i })
    await expect(activeGoalLink).toHaveClass(/bg-\[#29473e\]/)
  })

  test('Topbar ThemeToggle switches and persists data-theme', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    const html = page.locator('html')
    const initialTheme = await html.getAttribute('data-theme')

    // Find and click topbar ThemeToggle button
    const themeBtn = page.getByRole('button', { name: /Switch to (dark|light) theme/i })
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()

    // HTML data-theme should have inverted
    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark'
    await expect(html).toHaveAttribute('data-theme', expectedTheme)

    // Storage should persist the new theme
    const storedTheme = await page.evaluate(() => localStorage.getItem('ricoz_theme_preference'))
    expect(storedTheme).toBe(expectedTheme)
  })

  test('Responsive navigation drawer toggles at mobile breakpoint', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    // Set mobile viewport (<= 820px)
    await page.setViewportSize({ width: 620, height: 900 })

    await loginUser(page, adminEmail!, adminPass!)

    // Mobile hamburger menu button should be visible
    const hamburgerBtn = page.getByRole('button', { name: /Open sidebar/i })
    await expect(hamburgerBtn).toBeVisible()

    // Sidebar should start off-screen
    const sidebar = page.locator('aside')
    await expect(sidebar).toHaveClass(/-translate-x-full/)

    // Click hamburger to open drawer
    await hamburgerBtn.click()
    await expect(sidebar).toHaveClass(/translate-x-0/)

    // Clicking the scrim overlay closes the drawer
    const scrim = page.locator('.fixed.inset-0.bg-\\[var\\(--scrim\\)\\]')
    await scrim.click()
    await expect(sidebar).toHaveClass(/-translate-x-full/)
  })

  test('User profile trigger renders dropdown with Sign out action', async ({ page }) => {
    test.skip(!adminEmail || !adminPass, 'Skipping: admin credentials not provided.')

    await loginUser(page, adminEmail!, adminPass!)

    const profileTrigger = page.getByRole('button', { name: /User profile menu/i })
    await expect(profileTrigger).toBeVisible()

    await profileTrigger.click()
    const signOutBtn = page.getByRole('button', { name: /Sign out/i })
    await expect(signOutBtn).toBeVisible()
  })
})
