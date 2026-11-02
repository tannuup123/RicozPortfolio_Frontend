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

    // Theme toggle fixed at top-right
    const themeToggle = page.getByRole('button', { name: /Switch to (light|dark) theme/i })
    await expect(themeToggle).toBeVisible()

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

    await page.locator('#email').fill('invalid_user_never_registered@example.com')
    await page.locator('#password').fill('wrongpassword123')

    const submitBtn = page.getByRole('button', { name: /Sign in/i })
    await submitBtn.click()

    // Expect server error alert container.
    // Next.js injects its own role="alert" route announcer; narrow to the one
    // that actually contains the error text to avoid strict-mode violations.
    const alert = page.getByRole('alert').filter({ hasText: /Invalid email or password/i })
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/Invalid email or password/i)
  })

  // Note: '/' is excluded from protectedRoutes because Phase 4 made '/' public
  // (unauthenticated visitors see the marketing LandingPage without redirect).
  // Root page behaviour is verified in landing-page.spec.ts and navigation.spec.ts.
  const protectedRoutes = [
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

    // Test logout — User profile trigger dropdown contains the Sign out button in Phase 3 DashboardShell
    const profileTrigger = page.getByRole('button', { name: /User profile menu/i })
    if (await profileTrigger.isVisible()) {
      await profileTrigger.click()
    }
    const logoutBtn = page.getByRole('button', { name: /Sign out/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    await page.waitForURL('**/login')
    expect(page.url()).toContain('/login')
  })

  test('6. Phase 5: ThemeToggle works on Login page without disturbing input', async ({ page }) => {
    await page.goto('/login')

    const html = page.locator('html')
    const initialTheme = await html.getAttribute('data-theme')

    // Type into form
    await page.locator('#email').fill('theme_test@example.com')

    const toggle = page.getByRole('button', { name: /Switch to (light|dark) theme/i })
    await toggle.click()

    const toggledTheme = await html.getAttribute('data-theme')
    expect(toggledTheme).not.toBe(initialTheme)

    // Form value remains intact
    await expect(page.locator('#email')).toHaveValue('theme_test@example.com')
  })

  test('7. Phase 5: Register page loads with 2-col visual specs, inputs, and validation', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /Create an organization/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Get started in minutes with enterprise-grade PPM/i })).toBeVisible()

    // Form inputs and submit button
    const nameInput = page.locator('#name')
    const emailInput = page.locator('#email')
    const orgInput = page.locator('#organization_name')
    const passwordInput = page.locator('#password')
    const submitBtn = page.getByRole('button', { name: /Create organization account/i })

    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(orgInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()

    // Client-side empty validation check
    await submitBtn.click()
    await expect(page.getByText('Full name is required')).toBeVisible()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Organization name is required')).toBeVisible()
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('8. Phase 5: Security integrity check — access token is strictly in-memory (not in localStorage/sessionStorage)', async ({
    page,
  }) => {
    const testEmail = process.env.TEST_USER_EMAIL
    const testPassword = process.env.TEST_USER_PASSWORD

    test.skip(
      !testEmail || !testPassword,
      'Skipping storage inspection test: test credentials not provided.'
    )

    await page.goto('/login')
    await page.locator('#email').fill(testEmail!)
    await page.locator('#password').fill(testPassword!)
    await page.getByRole('button', { name: /Sign in/i }).click()

    await page.waitForURL('**/')

    // Inspect browser storage
    const storageKeys = await page.evaluate(() => {
      const local = Object.keys(localStorage)
      const session = Object.keys(sessionStorage)
      return { local, session }
    })

    // Assert that no token keys exist in client storage
    expect(storageKeys.local.some((k) => k.toLowerCase().includes('token'))).toBe(false)
    expect(storageKeys.session.some((k) => k.toLowerCase().includes('token'))).toBe(false)
  })
})
