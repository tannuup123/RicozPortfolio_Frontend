import { test, expect } from '@playwright/test'

test.describe('Authentication & Route Protection Smoke Suite', () => {
  test('1. Login page loads with expected title, inputs, and actions', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/login')

    // Page title and headings
    await expect(page).toHaveTitle(/RicozPortfolio/i)
    await expect(page.getByRole('heading', { name: /Sign in to RicozPortfolio/i })).toBeVisible()

    // Form inputs and submit button
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitBtn = page.getByRole('button', { name: /Sign in/i })

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()

    // Registration link
    const registerLink = page.getByRole('link', { name: /create a new organization account/i })
    await expect(registerLink).toBeVisible()
    await expect(registerLink).toHaveAttribute('href', '/register')

    // No uncaught runtime errors on load (ignoring expected 401 network responses from unauthenticated session bootstrap)
    const unexpectedErrors = consoleErrors.filter(
      (err) => !err.includes('401') && !err.includes('status of 401')
    )
    expect(unexpectedErrors).toEqual([])
  })

  test('2. Client-side validation prevents empty submission', async ({ page }) => {
    await page.goto('/login')

    const submitBtn = page.getByRole('button', { name: /Sign in/i })
    await submitBtn.click()

    // Validation messages
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('3. Invalid login displays appropriate backend error message', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#email').fill('nonexistent.user.test@ricozportfolio.local')
    await page.locator('#password').fill('WrongPassword123!')

    // Intercept login request to ensure API contract is exercised
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    )

    await page.getByRole('button', { name: /Sign in/i }).click()

    const loginResponse = await loginResponsePromise
    expect(loginResponse.status()).toBe(401)

    // Verify error banner displays expected user message
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible()
    expect(page.url()).toContain('/login')
  })

  const protectedRoutes = [
    { name: 'Dashboard', path: '/' },
    { name: 'Goals', path: '/strategy/goals' },
    { name: 'Ideas', path: '/demand/ideas' },
    { name: 'Users', path: '/users' },
    { name: 'Portfolios', path: '/portfolios' },
  ]

  for (const { name, path } of protectedRoutes) {
    test(`4. Unauthenticated users cannot access protected ${name} route (${path})`, async ({
      page,
    }) => {
      await page.goto(path)
      // Expect client-side auth guard redirect to /login
      await page.waitForURL('**/login', { timeout: 15000 })
      expect(page.url()).toContain('/login')
    })
  }

  test('5. Valid login, session reload, and logout (requires TEST_USER_EMAIL & TEST_USER_PASSWORD)', async ({
    page,
  }) => {
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    // If local test credentials are not provided via environment, skip with clear status
    test.skip(
      !testEmail || !testPassword,
      'Skipping valid login test: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables not provided.'
    )

    await page.goto('/login')
    await page.locator('#email').fill(testEmail!)
    await page.locator('#password').fill(testPassword!)

    const tokenResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    )

    await page.getByRole('button', { name: /Sign in/i }).click()
    const tokenResponse = await tokenResponsePromise
    expect(
      tokenResponse.status(),
      `Expected /auth/login to succeed with HTTP 200, but received HTTP ${tokenResponse.status()}`
    ).toBe(200)

    // Redirects to Dashboard home
    await page.waitForURL('**/')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Test session restoration upon reload (HttpOnly refresh cookie restore)
    const refreshResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/auth/refresh') && res.status() === 200
    )
    await page.reload()
    await refreshResponsePromise
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Test logout
    const logoutBtn = page.getByRole('button', { name: /Sign out/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    await page.waitForURL('**/login')
    expect(page.url()).toContain('/login')
  })
})
