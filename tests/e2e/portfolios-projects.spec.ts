import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import {
  BACKEND_URL,
  addProjectMemberApi,
  createPortfolioApi,
  createProjectApi,
  createUser,
  gotoProject,
  loginViaUI,
  provisionApprovedIdea,
  registerAccount,
  DEFAULT_PASSWORD,
  uniqueEmail,
  uniqueName,
  updateProjectApi,
} from './phase7-helpers'

function main(page: Page) {
  return page.getByRole('main')
}

function portfolioCard(page: Page, name: string) {
  return main(page)
    .locator('ul[role="list"] > li')
    .filter({ has: page.getByRole('heading', { level: 2, name, exact: true }) })
}

function projectListRow(page: Page, name: string) {
  return page
    .getByRole('region', { name: 'Projects table' })
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name, exact: true }) })
}

function portfolioProjectRow(
  page: Page,
  portfolioName: string,
  projectName: string,
) {
  return page
    .getByRole('region', { name: `Projects in ${portfolioName}` })
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: projectName, exact: true }) })
}

function waitForProjectList(
  page: Page,
  predicate: (params: URLSearchParams) => boolean,
) {
  return page.waitForResponse((response) => {
    if (response.request().method() !== 'GET') return false
    const url = new URL(response.url())
    return (
      url.pathname.endsWith('/api/v1/projects') && predicate(url.searchParams)
    )
  })
}

async function registerAdminAndLogin(
  page: Page,
  request: APIRequestContext,
  suffix: string,
) {
  const admin = await registerAccount(request, suffix)
  await loginViaUI(page, admin.email, admin.password)
  return admin
}

test.describe('Phase 7: Portfolios and projects', () => {
  test('broad manager creates a portfolio after required-name validation', async ({
    page,
    request,
  }) => {
    await registerAdminAndLogin(page, request, 'pfcreate')
    await page.goto('/portfolios')

    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'No portfolios yet' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create portfolio' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'New Portfolio' }).click()
    const dialog = page.getByRole('dialog', { name: 'New portfolio' })
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Create portfolio' }).click()
    await expect(dialog.getByText('Name is required')).toBeVisible()
    await expect(dialog.getByLabel('Name (required)')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(dialog.getByLabel('Name (required)')).toHaveAttribute(
      'aria-describedby',
      'portfolio-name-error',
    )

    const name = uniqueName('Portfolio Create')
    const description = 'Portfolio created through the Phase 7 E2E suite.'
    let postCount = 0
    page.on('request', (requestEvent) => {
      const url = new URL(requestEvent.url())
      if (
        url.pathname.endsWith('/api/v1/portfolios') &&
        requestEvent.method() === 'POST'
      ) {
        postCount += 1
      }
    })

    const createResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith('/api/v1/portfolios') &&
        response.request().method() === 'POST'
      )
    })

    await dialog.getByLabel('Name (required)').fill(name)
    await dialog.getByLabel('Description (optional)').fill(description)
    await dialog.getByRole('button', { name: 'Create portfolio' }).click()

    const createResponse = await createResponsePromise
    expect(createResponse.status()).toBe(201)
    await expect(dialog).toBeHidden()
    await expect(portfolioCard(page, name)).toBeVisible()
    await expect(portfolioCard(page, name)).toContainText(description)
    expect(postCount, 'Portfolio POST should be sent exactly once').toBe(1)
    await expect(
      page.getByRole('heading', { name: 'No portfolios yet' }),
    ).toHaveCount(0)
  })

  test('broad manager edits a portfolio and clears its description', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pfedit')
    const originalName = uniqueName('Portfolio Original')
    const updatedName = uniqueName('Portfolio Updated')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      originalName,
      'Description to be cleared.',
    )

    await page.goto('/portfolios')
    const originalCard = portfolioCard(page, originalName)
    await expect(originalCard).toBeVisible()
    await originalCard
      .getByRole('button', { name: `Edit ${originalName}` })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Edit portfolio' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Name (required)')).toHaveValue(originalName)
    await expect(dialog.getByLabel('Description (optional)')).toHaveValue(
      'Description to be cleared.',
    )

    const updateResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/portfolios/${portfolio.id}`) &&
        response.request().method() === 'PATCH'
      )
    })

    await dialog.getByLabel('Name (required)').fill(updatedName)
    await dialog.getByLabel('Description (optional)').fill('')
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    const updateResponse = await updateResponsePromise
    expect(updateResponse.status()).toBe(200)
    await expect(dialog).toBeHidden()
    await expect(portfolioCard(page, updatedName)).toBeVisible()
    await expect(portfolioCard(page, updatedName)).toContainText(
      'No description',
    )
    await expect(portfolioCard(page, originalName)).toHaveCount(0)

    const verifyResponse = await request.get(
      `${BACKEND_URL}/api/v1/portfolios/${portfolio.id}`,
      { headers: { Authorization: `Bearer ${admin.token}` } },
    )
    expect(verifyResponse.status()).toBe(200)
    const verified = (await verifyResponse.json()) as {
      description: string | null
    }
    expect(verified.description).toBeNull()
  })

  test('deleting a portfolio leaves its project visible with an unavailable portfolio until reassigned', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pfdelete')
    const portfolioName = uniqueName('Portfolio Delete')
    const replacementName = uniqueName('Portfolio Replacement')
    const projectName = uniqueName('Project Retained')

    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      portfolioName,
    )
    const replacement = await createPortfolioApi(
      request,
      admin.token,
      replacementName,
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(
      page.getByRole('heading', { name: portfolioName }),
    ).toBeVisible()

    const deleteResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/portfolios/${portfolio.id}`) &&
        response.request().method() === 'DELETE'
      )
    })

    await page.getByRole('button', { name: 'Delete' }).click()
    const deleteDialog = page.getByRole('dialog', { name: 'Delete portfolio' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog).toContainText(
      /Projects in this portfolio are not deleted/,
    )
    await deleteDialog
      .getByRole('button', { name: 'Delete portfolio' })
      .click()

    const deleteResponse = await deleteResponsePromise
    expect(deleteResponse.status()).toBe(204)
    await page.waitForURL('**/portfolios')
    await expect(portfolioCard(page, portfolioName)).toHaveCount(0)

    const projectVerify = await request.get(
      `${BACKEND_URL}/api/v1/projects/${project.id}`,
      { headers: { Authorization: `Bearer ${admin.token}` } },
    )
    expect(projectVerify.status()).toBe(200)
    const verifiedProject = (await projectVerify.json()) as {
      portfolio_id: string | null
    }
    expect(verifiedProject.portfolio_id).toBe(portfolio.id)

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    const unavailableAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Portfolio unavailable' })
    await expect(unavailableAlert).toBeVisible({ timeout: 20000 })

    await unavailableAlert
      .getByRole('button', { name: 'Select portfolio' })
      .click()
    const editDialog = page.getByRole('dialog', { name: 'Edit project' })
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByRole('alert')).toContainText(
      /Portfolio unavailable/,
    )

    const reassignResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}`) &&
        response.request().method() === 'PATCH'
      )
    })

    await editDialog
      .getByLabel('Portfolio (required)')
      .selectOption(replacement.id)
    await editDialog.getByRole('button', { name: 'Save changes' }).click()
    const reassignResponse = await reassignResponsePromise
    expect(reassignResponse.status()).toBe(200)

    await expect(
      page.getByRole('link', { name: replacementName }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Portfolio unavailable' }),
    ).toHaveCount(0)

    await page.goto('/projects')
    await expect(projectListRow(page, projectName)).toContainText(
      replacementName,
    )
  })

  test('broad manager creates a project from portfolio detail and lands on Planned project detail', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjcreate')
    const portfolioName = uniqueName('Portfolio Project Create')
    const projectName = uniqueName('Project Created')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      portfolioName,
    )

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(
      page.getByRole('heading', { name: portfolioName }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'New Project' }).click()

    const dialog = page.getByRole('dialog', { name: 'New project' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Portfolio (required)')).toHaveValue(
      portfolio.id,
      { timeout: 15000 },
    )

    const createResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith('/api/v1/projects') &&
        response.request().method() === 'POST'
      )
    })

    await dialog.getByLabel('Name (required)').fill(projectName)
    await dialog
      .getByLabel('Description (optional)')
      .fill('Created from the portfolio detail page.')
    await dialog.getByRole('button', { name: 'Create project' }).click()

    const createResponse = await createResponsePromise
    expect(createResponse.status()).toBe(201)
    const created = (await createResponse.json()) as { id: string }

    await page.waitForURL(`**/projects/${created.id}`)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText(projectName)
    await expect(heading).toContainText('Planned')
    await expect(page.getByText('Direct', { exact: true }).first()).toBeVisible()
    await expect(
      page.getByRole('link', { name: portfolioName }).first(),
    ).toBeVisible()
    await expect(
      page.getByText('Created from the portfolio detail page.'),
    ).toBeVisible()
  })

  test('broad manager edits a project and the global list reflects the change', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjedit')
    const sourcePortfolioName = uniqueName('Portfolio Source')
    const targetPortfolioName = uniqueName('Portfolio Target')
    const projectName = uniqueName('Project Original')
    const updatedName = uniqueName('Project Updated')

    const sourcePortfolio = await createPortfolioApi(
      request,
      admin.token,
      sourcePortfolioName,
    )
    const targetPortfolio = await createPortfolioApi(
      request,
      admin.token,
      targetPortfolioName,
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: sourcePortfolio.id,
    })

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    await page.getByRole('button', { name: 'Edit' }).click()

    const dialog = page.getByRole('dialog', { name: 'Edit project' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Name (required)')).toHaveValue(projectName)

    const updateResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}`) &&
        response.request().method() === 'PATCH'
      )
    })

    await dialog.getByLabel('Name (required)').fill(updatedName)
    await dialog
      .getByLabel('Description (optional)')
      .fill('Updated project description.')
    await dialog.getByLabel('Status (required)').selectOption('active')
    await dialog
      .getByLabel('Portfolio (required)')
      .selectOption(targetPortfolio.id)
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    const updateResponse = await updateResponsePromise
    expect(updateResponse.status()).toBe(200)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText(updatedName)
    await expect(heading).toContainText('Active')
    await expect(
      page.getByRole('link', { name: targetPortfolioName }).first(),
    ).toBeVisible()
    await expect(
      page.getByText('Updated project description.'),
    ).toBeVisible()

    await page.goto('/projects')
    const row = projectListRow(page, updatedName)
    await expect(row).toBeVisible()
    await expect(row).toContainText('Active')
    await expect(row).toContainText(targetPortfolioName)
    await expect(projectListRow(page, projectName)).toHaveCount(0)
  })

  test('broad manager deletes a project from detail and it disappears from the portfolio table', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjdelete')
    const portfolioName = uniqueName('Portfolio Project Delete')
    const projectName = uniqueName('Project Delete')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      portfolioName,
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()

    const deleteResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}`) &&
        response.request().method() === 'DELETE'
      )
    })

    await page.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog', { name: 'Delete project' })
    await expect(dialog).toContainText(projectName)
    await dialog.getByRole('button', { name: 'Delete project' }).click()

    const deleteResponse = await deleteResponsePromise
    expect(deleteResponse.status()).toBe(204)
    await page.waitForURL('**/projects')
    await expect(projectListRow(page, projectName)).toHaveCount(0)

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(
      page.getByRole('heading', { name: portfolioName }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'No projects in this portfolio yet',
      }),
    ).toBeVisible()
  })

  test('an unassigned project shows Unassigned and can be assigned to a portfolio', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjorphan')
    const projectName = uniqueName('Project Unassigned')
    const portfolioName = uniqueName('Portfolio Assignment')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      portfolioName,
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: null,
    })

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    await expect(page.getByText('Unassigned', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Edit' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit project' })
    await expect(dialog).toBeVisible()

    const assignResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}`) &&
        response.request().method() === 'PATCH'
      )
    })
    await dialog.getByLabel('Portfolio (required)').selectOption(portfolio.id)
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    const assignResponse = await assignResponsePromise
    expect(assignResponse.status()).toBe(200)

    await expect(
      page.getByRole('link', { name: portfolioName }).first(),
    ).toBeVisible()
    await expect(page.getByText('Unassigned', { exact: true })).toHaveCount(0)

    await page.goto('/projects')
    await expect(projectListRow(page, projectName)).toContainText(portfolioName)
  })

  test('global project list status and portfolio filters return the expected rows', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjfilters')
    const portfolioAName = uniqueName('Portfolio Filter A')
    const portfolioBName = uniqueName('Portfolio Filter B')
    const plannedName = uniqueName('Project Planned')
    const activeName = uniqueName('Project Active')
    const holdName = uniqueName('Project On Hold')

    const portfolioA = await createPortfolioApi(
      request,
      admin.token,
      portfolioAName,
    )
    const portfolioB = await createPortfolioApi(
      request,
      admin.token,
      portfolioBName,
    )

    const _planned = await createProjectApi(request, admin.token, {
      name: plannedName,
      portfolio_id: portfolioA.id,
    })
    const active = await createProjectApi(request, admin.token, {
      name: activeName,
      portfolio_id: portfolioA.id,
    })
    const onHold = await createProjectApi(request, admin.token, {
      name: holdName,
      portfolio_id: portfolioB.id,
    })

    await updateProjectApi(request, admin.token, active.id, { status: 'active' })
    await updateProjectApi(request, admin.token, onHold.id, {
      status: 'on_hold',
    })

    await page.goto('/projects')
    await expect(projectListRow(page, plannedName)).toBeVisible()
    await expect(projectListRow(page, activeName)).toBeVisible()
    await expect(projectListRow(page, holdName)).toBeVisible()

    const activeResponsePromise = waitForProjectList(
      page,
      (params) => params.get('status') === 'active',
    )
    await page.getByLabel('Status').selectOption('active')
    const activeResponse = await activeResponsePromise
    expect(activeResponse.status()).toBe(200)
    await expect(projectListRow(page, activeName)).toBeVisible()
    await expect(projectListRow(page, plannedName)).toHaveCount(0)
    await expect(projectListRow(page, holdName)).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(projectListRow(page, plannedName)).toBeVisible()
    await expect(projectListRow(page, activeName)).toBeVisible()
    await expect(projectListRow(page, holdName)).toBeVisible()

    const portfolioResponsePromise = waitForProjectList(
      page,
      (params) => params.get('portfolio_id') === portfolioA.id,
    )
    await page.getByLabel('Portfolio').selectOption(portfolioA.id)
    const portfolioResponse = await portfolioResponsePromise
    expect(portfolioResponse.status()).toBe(200)
    await expect(projectListRow(page, plannedName)).toBeVisible()
    await expect(projectListRow(page, activeName)).toBeVisible()
    await expect(projectListRow(page, holdName)).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(projectListRow(page, holdName)).toBeVisible()
  })

  test('global project list paginates at twenty rows per page', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pjpaging')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Paging'),
    )
    const createdNames: string[] = []

    for (let index = 1; index <= 21; index += 1) {
      const name = uniqueName(`Project Page ${index}`)
      createdNames.push(name)
      await createProjectApi(request, admin.token, {
        name,
        portfolio_id: portfolio.id,
      })
    }

    await page.goto('/projects')
    await expect(page.getByText(/Showing 1–20 of \d+/)).toBeVisible()
    const table = page.getByRole('region', { name: 'Projects table' })
    await expect(table.getByRole('row')).toHaveCount(21)

    await page.getByRole('button', { name: 'Go to next page' }).click()
    await expect(page.getByText(/Showing 21–\d+ of \d+/)).toBeVisible()
    await expect(table.getByRole('row')).toHaveCount(2)

    await page.getByRole('button', { name: 'Go to previous page' }).click()
    await expect(page.getByText(/Showing 1–20 of \d+/)).toBeVisible()
  })

  test('portfolio list paginates at twelve cards per page', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'pfpaging')
    const createdNames: string[] = []

    for (let index = 1; index <= 13; index += 1) {
      const name = uniqueName(`Portfolio Page ${index}`)
      createdNames.push(name)
      await createPortfolioApi(request, admin.token, name)
    }

    await page.goto('/portfolios')
    await expect(page.getByText(/Showing 1–12 of \d+/)).toBeVisible()
    await expect(main(page).locator('ul[role="list"] > li')).toHaveCount(12)

    await page.getByRole('button', { name: 'Go to next page' }).click()
    await expect(page.getByText(/Showing 13–\d+ of \d+/)).toBeVisible()
    await expect(main(page).locator('ul[role="list"] > li')).toHaveCount(1)

    await page.getByRole('button', { name: 'Go to previous page' }).click()
    await expect(page.getByText(/Showing 1–12 of \d+/)).toBeVisible()
  })

  test('broad manager sees the project empty state on a fresh organization', async ({
    page,
    request,
  }) => {
    await registerAdminAndLogin(page, request, 'pjemptyadmin')
    await page.goto('/projects')

    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create project' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible()
    await expect(
      page.getByText('You are not a member of any projects yet.'),
    ).toHaveCount(0)
  })

  test('a non-member sees the member-specific project empty state without create controls', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'pjemptymember')
    const member = await createUser(request, admin.token, {
      email: uniqueEmail('emptymember'),
      name: 'Phase7 Empty Member',
      roles: ['team_member'],
    })

    await loginViaUI(page, member.email, DEFAULT_PASSWORD)
    await page.goto('/projects')

    await expect(
      page.getByText('You are not a member of any projects yet.'),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New Project' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Create project' })).toHaveCount(0)
  })

  test('broad manager adds, promotes, and removes a project member', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'teammembers')
    const projectName = uniqueName('Project Membership')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Membership'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const member = await createUser(request, admin.token, {
      email: uniqueEmail('member'),
      name: 'Phase7 Add Member',
      roles: ['team_member'],
    })

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    await page.getByRole('tab', { name: 'Team' }).click()
    await expect(
      page.getByRole('region', { name: 'Project members' }),
    ).toContainText(admin.email)

    await page.getByRole('button', { name: 'Add member' }).click()
    const addDialog = page.getByRole('dialog', { name: 'Add project member' })
    await expect(addDialog).toBeVisible()
    await expect(
      addDialog.getByRole('option', { name: `${admin.name} (${admin.email})` }),
    ).toHaveCount(0)

    const addResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}/members`) &&
        response.request().method() === 'POST'
      )
    })

    await addDialog
      .getByLabel('User (required)')
      .selectOption({ label: `${member.name} (${member.email})` })
    await addDialog.getByRole('button', { name: 'Add member' }).click()

    const addResponse = await addResponsePromise
    expect(addResponse.status()).toBe(201)
    await expect(addDialog).toBeHidden()

    const memberTable = page.getByRole('region', { name: 'Project members' })
    await expect(memberTable).toContainText(member.email)
    const roleSelect = page.getByLabel(`Project role for ${member.name}`)
    await expect(roleSelect).toHaveValue('member')

    const promoteResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(
          `/api/v1/projects/${project.id}/members/${member.id}`,
        ) && response.request().method() === 'PATCH'
      )
    })
    await roleSelect.selectOption('manager')
    const promoteResponse = await promoteResponsePromise
    expect(promoteResponse.status()).toBe(200)
    await expect(roleSelect).toHaveValue('manager')

    await page.getByRole('button', { name: `Remove ${member.name}` }).click()
    const removeDialog = page.getByRole('dialog', { name: 'Remove member' })
    await expect(removeDialog).toContainText(member.name)

    const removeResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(
          `/api/v1/projects/${project.id}/members/${member.id}`,
        ) && response.request().method() === 'DELETE'
      )
    })
    await removeDialog.getByRole('button', { name: 'Remove member' }).click()
    const removeResponse = await removeResponsePromise
    expect(removeResponse.status()).toBe(204)
    await expect(memberTable).not.toContainText(member.email)
  })

  test('the backend rejects demoting the last project manager and the row stays unchanged', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'lastmanager')
    const projectName = uniqueName('Project Last Manager')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Last Manager'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })

    await gotoProject(page, project.id)
    await page.getByRole('tab', { name: 'Team' }).click()

    const adminRoleSelect = page.getByLabel(`Project role for ${admin.name}`)
    await expect(adminRoleSelect).toHaveValue('manager')

    const demoteResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.includes(`/api/v1/projects/${project.id}/members/`) &&
        response.request().method() === 'PATCH'
      )
    })
    await adminRoleSelect.selectOption('member')
    const confirmDialog = page.getByRole('dialog', { name: 'Change your role?' })
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Change role' }).click()

    const demoteResponse = await demoteResponsePromise
    expect(demoteResponse.status()).toBe(400)
    await expect(confirmDialog.getByRole('alert')).toContainText(
      /last project manager/i,
    )

    await confirmDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirmDialog).toBeHidden()
    await expect(adminRoleSelect).toHaveValue('manager')
  })

  test('a team member project manager can remove themselves and loses access', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'selfremove')
    const projectName = uniqueName('Project Self Removal')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Self Removal'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const manager = await createUser(request, admin.token, {
      email: uniqueEmail('selfremove'),
      name: 'Phase7 Self Removing Manager',
      roles: ['team_member'],
    })
    await addProjectMemberApi(
      request,
      admin.token,
      project.id,
      manager.id,
      'manager',
    )

    await loginViaUI(page, manager.email, DEFAULT_PASSWORD)
    await gotoProject(page, project.id)
    await page.getByRole('tab', { name: 'Team' }).click()

    await page.getByRole('button', { name: `Remove ${manager.name}` }).click()
    const dialog = page.getByRole('dialog', { name: 'Remove member' })
    await expect(dialog).toContainText(
      'You are removing yourself from this project.',
    )

    const removeResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(
          `/api/v1/projects/${project.id}/members/${manager.id}`,
        ) && response.request().method() === 'DELETE'
      )
    })
    await dialog.getByRole('button', { name: 'Remove member' }).click()
    const removeResponse = await removeResponsePromise
    expect(removeResponse.status()).toBe(204)

    await page.waitForURL('**/projects')
    await expect(
      page.getByText('You are not a member of any projects yet.'),
    ).toBeVisible()

    await page.goto(`/projects/${project.id}`)
    await expect(
      page.getByRole('heading', {
        name: 'You do not have access to this project',
      }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('a duplicate member add keeps the modal open with the backend 409 message', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'duplicateadd')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Duplicate Add'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: uniqueName('Project Duplicate Add'),
      portfolio_id: portfolio.id,
    })
    const member = await createUser(request, admin.token, {
      email: uniqueEmail('duplicateadd'),
      name: 'Phase7 Duplicate Member',
      roles: ['team_member'],
    })

    await gotoProject(page, project.id)
    await page.getByRole('tab', { name: 'Team' }).click()
    await page.getByRole('button', { name: 'Add member' }).click()

    const dialog = page.getByRole('dialog', { name: 'Add project member' })
    await dialog
      .getByLabel('User (required)')
      .selectOption({ label: `${member.name} (${member.email})` })

    // Add the same user outside the open dialog so the backend returns 409.
    await addProjectMemberApi(request, admin.token, project.id, member.id)

    const duplicateResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}/members`) &&
        response.request().method() === 'POST'
      )
    })
    await dialog.getByRole('button', { name: 'Add member' }).click()
    const duplicateResponse = await duplicateResponsePromise
    expect(duplicateResponse.status()).toBe(409)

    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toContainText(
      'This user is already a member.',
    )
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })

  test('converted project with a portfolio shows source traceability and accepts its first manager', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'convertportfolio')
    const ideaTitle = uniqueName('Converted Idea With Portfolio')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Portfolio Conversion'),
    )
    const idea = await provisionApprovedIdea(request, admin.token, ideaTitle)
    const firstManager = await createUser(request, admin.token, {
      email: uniqueEmail('firstmanager'),
      name: 'Phase7 First Manager',
      roles: ['team_member'],
    })

    await page.goto(`/demand/ideas/${idea.id}`)
    await expect(page.getByRole('heading', { name: ideaTitle })).toBeVisible()
    await page.getByRole('button', { name: 'Convert to Project' }).click()

    const convertDialog = page.getByRole('dialog', {
      name: 'Convert Approved Idea to Project',
    })
    await expect(convertDialog).toBeVisible()
    await convertDialog
      .getByTestId('target-portfolio-select')
      .selectOption(portfolio.id)

    const convertResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/ideas/${idea.id}/convert`) &&
        response.request().method() === 'POST'
      )
    })
    await convertDialog.getByTestId('confirm-convert-btn').click()
    const convertResponse = await convertResponsePromise
    expect(convertResponse.status()).toBe(201)
    const converted = (await convertResponse.json()) as { id: string }

    await page.waitForURL(`**/projects/${converted.id}`)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText(ideaTitle)
    await expect(heading).toContainText('Planned')
    const sourceBanner = page
      .getByRole('status')
      .filter({ hasText: 'Converted from idea' })
    await expect(sourceBanner).toBeVisible()
    const sourceLink = page.getByRole('link', {
      name: `View source idea ${idea.id}`,
    })
    await expect(sourceLink).toBeVisible()
    await expect(
      page.getByRole('link', { name: portfolio.name }).first(),
    ).toBeVisible()

    await sourceLink.click()
    await page.waitForURL(`**/demand/ideas/${idea.id}`)
    await expect(page.getByRole('heading', { name: ideaTitle })).toBeVisible()
    await gotoProject(page, converted.id)

    await page.getByRole('tab', { name: 'Team' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('No members yet')
    await page.getByRole('button', { name: 'Add project manager' }).click()

    const addDialog = page.getByRole('dialog', { name: 'Add project member' })
    await addDialog
      .getByLabel('User (required)')
      .selectOption({ label: `${firstManager.name} (${firstManager.email})` })
    await addDialog.getByLabel('Project role (required)').selectOption('manager')

    const addResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${converted.id}/members`) &&
        response.request().method() === 'POST'
      )
    })
    await addDialog.getByRole('button', { name: 'Add member' }).click()
    const addResponse = await addResponsePromise
    expect(addResponse.status()).toBe(201)

    await expect(
      page.getByRole('region', { name: 'Project members' }),
    ).toContainText(firstManager.email)
    await expect(
      page.getByLabel(`Project role for ${firstManager.name}`),
    ).toHaveValue('manager')

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(
      portfolioProjectRow(page, portfolio.name, ideaTitle),
    ).toBeVisible()

    await page.goto('/projects')
    await expect(projectListRow(page, ideaTitle)).toContainText('Converted')
  })

  test('converted project without a portfolio is unassigned and discoverable in the global list', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'convertorphan')
    const ideaTitle = uniqueName('Converted Idea Unassigned')
    const idea = await provisionApprovedIdea(request, admin.token, ideaTitle)

    await page.goto(`/demand/ideas/${idea.id}`)
    await expect(page.getByRole('heading', { name: ideaTitle })).toBeVisible()
    await page.getByRole('button', { name: 'Convert to Project' }).click()

    const convertDialog = page.getByRole('dialog', {
      name: 'Convert Approved Idea to Project',
    })
    await expect(convertDialog.getByTestId('target-portfolio-select')).toHaveValue(
      '',
    )
    const convertResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/ideas/${idea.id}/convert`) &&
        response.request().method() === 'POST'
      )
    })
    await convertDialog.getByTestId('confirm-convert-btn').click()
    const convertResponse = await convertResponsePromise
    expect(convertResponse.status()).toBe(201)
    const converted = (await convertResponse.json()) as { id: string }

    await page.waitForURL(`**/projects/${converted.id}`)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText(ideaTitle)
    await expect(page.getByText('Unassigned', { exact: true }).first()).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: 'Converted from idea' }),
    ).toBeVisible()

    await page.goto('/projects')
    const row = projectListRow(page, ideaTitle)
    await expect(row).toContainText('Unassigned')
    await expect(row).toContainText('Converted')
  })

  test('duplicate conversion keeps the modal open with the backend error and does not navigate', async ({
    page,
    request,
  }) => {
    const admin = await registerAdminAndLogin(page, request, 'convertduplicate')
    const ideaTitle = uniqueName('Converted Idea Duplicate')
    const idea = await provisionApprovedIdea(request, admin.token, ideaTitle)

    await page.goto(`/demand/ideas/${idea.id}`)
    await page.getByRole('button', { name: 'Convert to Project' }).click()
    const firstDialog = page.getByRole('dialog', {
      name: 'Convert Approved Idea to Project',
    })
    const firstConversionPromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/ideas/${idea.id}/convert`) &&
        response.request().method() === 'POST'
      )
    })
    await firstDialog.getByTestId('confirm-convert-btn').click()
    const firstConversion = await firstConversionPromise
    expect(firstConversion.status()).toBe(201)
    await page.waitForURL('**/projects/*')

    await page.goto(`/demand/ideas/${idea.id}`)
    await expect(page.getByRole('heading', { name: ideaTitle })).toBeVisible()
    await page.getByRole('button', { name: 'Convert to Project' }).click()
    const duplicateDialog = page.getByRole('dialog', {
      name: 'Convert Approved Idea to Project',
    })
    await expect(duplicateDialog).toBeVisible()

    const duplicateResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/ideas/${idea.id}/convert`) &&
        response.request().method() === 'POST'
      )
    })
    await duplicateDialog.getByTestId('confirm-convert-btn').click()
    const duplicateResponse = await duplicateResponsePromise
    expect(duplicateResponse.status()).toBe(409)

    await expect(duplicateDialog).toContainText(/already been converted/i)
    await expect(page).toHaveURL(new RegExp(`/demand/ideas/${idea.id}$`))
    await expect(duplicateDialog).toBeVisible()
  })
})
