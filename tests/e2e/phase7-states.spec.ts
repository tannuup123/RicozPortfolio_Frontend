import { expect, test, type Page } from '@playwright/test'
import {
  BACKEND_URL,
  addProjectMemberApi,
  createPortfolioApi,
  createProjectApi,
  deletePortfolioApi,
  gotoProject,
  loginViaUI,
  registerAccount,
  uniqueName,
} from './phase7-helpers'

const API = `${BACKEND_URL}/api/v1`

async function registerAndLogin(page: Page, request: any, suffix: string) {
  const admin = await registerAccount(request, suffix)
  await loginViaUI(page, admin.email, admin.password)
  return admin
}

function portfolioGridColumns(page: Page) {
  return page.evaluate(() => {
    const grid = document.querySelector('ul[role="list"]') as HTMLElement | null
    if (!grid) return 0
    return getComputedStyle(grid).gridTemplateColumns.split(' ').length
  })
}

test.describe('Phase 7: loading, error, empty, and state coverage', () => {
  test('portfolio list shows loading state for a delayed response', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pf-loading')

    await page.route('**/api/v1/portfolios*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/portfolios')
    await expect(page.getByText('Loading portfolios...')).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()
  })

  test('portfolio list shows error state for a 500 and recovers on Retry', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pf-error')

    let calls = 0
    await page.route('**/api/v1/portfolios*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      calls += 1
      if (calls <= 4) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Server error' }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/portfolios')
    const errorState = page.getByRole('alert').filter({
      hasText: 'Unable to load portfolios',
    })
    await expect(errorState).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()

    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(errorState).toBeHidden({ timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()
  })

  test('portfolio list shows empty state for an empty response', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pf-empty')

    await page.route('**/api/v1/portfolios*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      })
    })

    await page.goto('/portfolios')
    await expect(
      page.getByRole('heading', { name: 'No portfolios yet' }),
    ).toBeVisible({ timeout: 20000 })
    await expect(
      page.getByRole('button', { name: 'Create portfolio' }),
    ).toBeVisible()
  })

  test('global project list shows loading state for a delayed response', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pj-loading')

    await page.route('**/api/v1/projects*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/projects')
    await expect(page.getByText('Loading projects...')).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
  })

  test('global project list shows error state for a 500 and recovers on Retry', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pj-error')

    let calls = 0
    await page.route('**/api/v1/projects*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      calls += 1
      if (calls <= 4) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Server error' }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/projects')
    const projectError = page.getByRole('alert').filter({
      hasText: 'Unable to load projects',
    })
    await expect(projectError).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(projectError).toBeHidden({ timeout: 20000 })
  })

  test('global project list shows empty state for an empty response', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pj-empty')

    await page.route('**/api/v1/projects*', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      })
    })

    await page.goto('/projects')
    await expect(
      page.getByRole('heading', { name: 'No projects yet' }),
    ).toBeVisible({ timeout: 20000 })
    await expect(
      page.getByRole('button', { name: 'Create project' }),
    ).toBeVisible()
  })

  test('portfolio detail shows not-found state for an unknown id', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pf-404')

    await page.goto('/portfolios/00000000-0000-0000-0000-000000000000')
    await expect(
      page.getByRole('heading', { name: 'Portfolio not found' }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('project detail shows not-found state for an unknown id', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pj-404')

    await page.goto('/projects/00000000-0000-0000-0000-000000000000')
    await expect(
      page.getByRole('heading', { name: 'Project not found' }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('project detail shows access-denied state for a 403 response', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-pj-403')

    await page.route('**/api/v1/projects/00000000-0000-0000-0000-000000000000', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Forbidden' }),
      })
    })

    await page.goto('/projects/00000000-0000-0000-0000-000000000000')
    await expect(
      page.getByRole('heading', {
        name: 'You do not have access to this project',
      }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('project with an unavailable portfolio shows the warning and reassignment action', async ({
    page,
    request,
  }) => {
    const admin = await registerAndLogin(page, request, 'state-pf-unavailable')
    const portfolioName = uniqueName('Unavailable Portfolio')
    const projectName = uniqueName('Unavailable Project')
    const portfolio = await createPortfolioApi(request, admin.token, portfolioName)
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    await deletePortfolioApi(request, admin.token, portfolio.id)

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()

    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Portfolio unavailable' })
    await expect(alert).toBeVisible({ timeout: 20000 })
    await expect(
      alert.getByRole('button', { name: 'Select portfolio' }),
    ).toBeVisible()
  })

  test('portfolio grid responds to viewport width', async ({ page, request }) => {
    const admin = await registerAndLogin(page, request, 'state-responsive')
    for (let i = 0; i < 4; i += 1) {
      await createPortfolioApi(request, admin.token, uniqueName(`Responsive Portfolio ${i}`))
    }

    await page.goto('/portfolios')
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect.poll(async () => portfolioGridColumns(page)).toBe(3)

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect.poll(async () => portfolioGridColumns(page)).toBe(2)

    await page.setViewportSize({ width: 390, height: 900 })
    await expect.poll(async () => portfolioGridColumns(page)).toBe(1)
  })

  test('mobile project detail keeps tabs usable and table scrollable', async ({
    page,
    request,
  }) => {
    const admin = await registerAndLogin(page, request, 'state-mobile')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Mobile Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: uniqueName('Mobile Project'),
      portfolio_id: portfolio.id,
    })
    const member = await (async () => {
      const response = await request.post(`${API}/users`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        data: {
          email: `phase7_mobile_${Date.now()}@testmail.dev`,
          password: 'Password123!',
          name: 'Phase7 Mobile Member',
          roles: ['team_member'],
        },
      })
      expect(response.status()).toBe(201)
      return (await response.json()) as { id: string; name: string }
    })()
    await addProjectMemberApi(request, admin.token, project.id, member.id)

    await page.setViewportSize({ width: 390, height: 900 })
    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: project.name })).toBeVisible()

    const teamTab = page.getByRole('tab', { name: 'Team' })
    await teamTab.click()
    await expect(page.getByRole('region', { name: 'Project members' })).toBeVisible()

    const tableRegion = page.getByRole('region', { name: 'Project members' })
    const scrollable = await tableRegion.evaluate((el) => {
      const style = getComputedStyle(el)
      return style.overflowX === 'auto' || style.overflowX === 'scroll'
    })
    expect(scrollable).toBe(true)
  })

  test('dark theme applies and portfolio page renders', async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ricoz_theme_preference', 'dark')
    })
    const admin = await registerAndLogin(page, request, 'state-theme')
    await createPortfolioApi(request, admin.token, uniqueName('Theme Portfolio'))

    await page.goto('/portfolios')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()

    const toggle = page.getByRole('button', {
      name: 'Switch to light theme',
    })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('modal escape restores focus and confirm dialog escape works', async ({
    page,
    request,
  }) => {
    const admin = await registerAndLogin(page, request, 'state-keyboard')
    await createPortfolioApi(request, admin.token, uniqueName('Keyboard Portfolio'))

    await page.goto('/portfolios')
    const newPortfolioButton = page.getByRole('button', { name: 'New Portfolio' })
    await newPortfolioButton.click()
    const dialog = page.getByRole('dialog', { name: 'New portfolio' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(newPortfolioButton).toBeFocused()

    // Confirm dialog escape
    const card = page
      .locator('ul[role="list"] > li')
      .first()
    await card.getByRole('button', { name: /Delete / }).click()
    const confirmDialog = page.getByRole('dialog', { name: 'Delete portfolio' })
    await expect(confirmDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(confirmDialog).toBeHidden()
  })

  test('project tabs support keyboard navigation', async ({ page, request }) => {
    const admin = await registerAndLogin(page, request, 'state-tabs')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Tabs Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: uniqueName('Tabs Project'),
      portfolio_id: portfolio.id,
    })

    await gotoProject(page, project.id)
    const overviewTab = page.getByRole('tab', { name: 'Overview' })
    await overviewTab.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Team' })).toBeFocused()
    await page.keyboard.press('Home')
    await expect(overviewTab).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByRole('tab', { name: 'Team' })).toBeFocused()
  })

  test('portfolio form validates empty name and missing portfolio selector', async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, 'state-validation')
    await page.goto('/portfolios')

    await page.getByRole('button', { name: 'New Portfolio' }).click()
    const portfolioDialog = page.getByRole('dialog', { name: 'New portfolio' })
    await portfolioDialog.getByRole('button', { name: 'Create portfolio' }).click()
    await expect(portfolioDialog.getByText('Name is required')).toBeVisible()
    await portfolioDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(portfolioDialog).toBeHidden()

    // Project form missing portfolio: open from global list
    await page.goto('/projects')
    await page.getByRole('button', { name: 'New Project' }).click()
    const projectDialog = page.getByRole('dialog', { name: 'New project' })
    await expect(projectDialog).toBeVisible()
    await projectDialog.getByLabel('Name (required)').fill('Validation Project')
    await projectDialog.getByRole('button', { name: 'Create project' }).click()
    await expect(projectDialog.getByText('Portfolio is required')).toBeVisible()
    await projectDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(projectDialog).toBeHidden()
  })

  test('semantic roles are present on portfolio and project pages', async ({
    page,
    request,
  }) => {
    const admin = await registerAndLogin(page, request, 'state-semantics')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Semantics Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: uniqueName('Semantics Project'),
      portfolio_id: portfolio.id,
    })

    await page.goto('/portfolios')
    await expect(page.getByRole('main')).toBeVisible()

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(page.getByRole('heading', { name: portfolio.name })).toBeVisible()

    await gotoProject(page, project.id)
    await page.getByRole('tab', { name: 'Team' }).click()
    await expect(page.getByRole('region', { name: 'Project members' })).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Project members' }).getByRole('table'),
    ).toBeVisible()

    await page.goto('/projects')
    await expect(page.getByRole('region', { name: 'Projects table' })).toBeVisible()
    await expect(
      page.getByRole('table').first(),
    ).toBeVisible()
  })
})
