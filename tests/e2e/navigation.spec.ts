import { test, expect } from '@playwright/test'

test.describe('Navigation, Route Aliases, and 404 Smoke Suite', () => {
  test('Direct navigation to unknown URL renders 404 page', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto('/non-existent-page-random-12345')
    // Next.js returns 404 status for unmatched routes
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/This page could not be found/i)).toBeVisible()

    // No uncaught application crashes (ignoring expected 401 network responses from unauthenticated session bootstrap)
    const unexpectedErrors = consoleErrors.filter(
      (err) =>
        !err.includes('404') &&
        !err.includes('status of 404') &&
        !err.includes('401') &&
        !err.includes('status of 401')
    )
    expect(unexpectedErrors).toEqual([])
  })

  // Note: '/' is intentionally excluded — Phase 4 changed the root route so unauthenticated
  // visitors see the marketing landing page instead of redirecting to /login. That behavior
  // is verified in landing-page.spec.ts.
  //
  // Dynamic authenticated routes (e.g. /portfolios/sample-id) wait up to 20 s because the
  // DashboardAuthGuard renders a loading spinner while bootstrapAuth attempts a silent
  // refresh via the 401-protected backend endpoint. On slow networks/CI the full round-trip
  // can take up to ~15 s before the guard issues the router.replace('/login') call.
  const routesToTest = [
    '/strategy/goals',
    '/goals',
    '/demand/ideas',
    '/ideas',
    '/portfolios',
    '/users',
  ]

  const dynamicRoutesToTest = [
    '/demand/ideas/sample-id',
    '/ideas/sample-id',
    '/portfolios/sample-id',
    '/projects/sample-id',
  ]

  for (const route of routesToTest) {
    test(`Unauthenticated navigation to ${route} redirects to /login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL('**/login', { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })
  }

  for (const route of dynamicRoutesToTest) {
    test(`Unauthenticated navigation to ${route} redirects to /login`, async ({ page }) => {
      await page.goto(route)
      // Extended timeout: DashboardAuthGuard must wait for bootstrapAuth to settle
      // (401 from backend refresh endpoint) before issuing the /login redirect.
      await page.waitForURL('**/login', { timeout: 20000 })
      expect(page.url()).toContain('/login')
    })
  }

  test('Unauthenticated visit to / renders the marketing landing page (not a redirect)', async ({ page }) => {
    await page.goto('/')
    // Must stay on '/' showing the landing page — no redirect to /login
    await expect(
      page.getByRole('heading', { name: /From strategic vision to delivered impact/i })
    ).toBeVisible()
    expect(page.url()).not.toContain('/login')
  })
})
