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

    // No uncaught application crashes
    const unexpectedErrors = consoleErrors.filter(
      (err) => !err.includes('404') && !err.includes('status of 404')
    )
    expect(unexpectedErrors).toEqual([])
  })

  const routesToTest = [
    '/',
    '/strategy/goals',
    '/goals',
    '/demand/ideas',
    '/ideas',
    '/demand/ideas/sample-id',
    '/ideas/sample-id',
    '/portfolios',
    '/portfolios/sample-id',
    '/projects/sample-id',
    '/users',
  ]

  for (const route of routesToTest) {
    test(`Unauthenticated navigation to ${route} redirects to /login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL('**/login', { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })
  }
})
