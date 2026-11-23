import { expect, test } from '@playwright/test'
import {
  BACKEND_URL,
  DEFAULT_PASSWORD,
  addProjectMemberApi,
  createPortfolioApi,
  createProjectApi,
  createUser,
  gotoProject,
  loginViaUI,
  provisionApprovedIdea,
  registerAccount,
  uniqueEmail,
  uniqueName,
} from './phase7-helpers'

test.describe('Phase 7: RBAC visibility and project-level permissions', () => {
  test('broad manager sees portfolio and project mutation controls', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-broad')
    const portfolioName = uniqueName('Broad Portfolio')
    const projectName = uniqueName('Broad Project')
    const portfolio = await createPortfolioApi(request, admin.token, portfolioName)
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })

    await loginViaUI(page, admin.email, admin.password)

    await page.goto('/portfolios')
    await expect(
      page.getByRole('button', { name: 'New Portfolio' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: `Edit ${portfolioName}` }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: `Delete ${portfolioName}` }),
    ).toBeVisible()

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible()

    await page.goto('/projects')
    const row = page
      .getByRole('region', { name: 'Projects table' })
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: projectName, exact: true }) })
    await expect(row.getByRole('button', { name: `Edit ${projectName}` })).toBeVisible()
    await expect(
      row.getByRole('button', { name: `Delete ${projectName}` }),
    ).toBeVisible()

    await gotoProject(page, project.id)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible()
  })

  test('org project_manager who is a project member but not project manager has no edit or team controls', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-pm-member')
    const projectName = uniqueName('PM Member Project')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('PM Member Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const projectManager = await createUser(request, admin.token, {
      email: uniqueEmail('pm-member'),
      name: 'Phase7 PM Member',
      roles: ['project_manager'],
    })
    await addProjectMemberApi(
      request,
      admin.token,
      project.id,
      projectManager.id,
      'member',
    )

    await loginViaUI(page, projectManager.email, DEFAULT_PASSWORD)

    await page.goto('/projects')
    const row = page
      .getByRole('region', { name: 'Projects table' })
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: projectName, exact: true }) })
    await expect(row).toBeVisible()
    await expect(
      row.getByRole('button', { name: `Edit ${projectName}` }),
    ).toHaveCount(0)
    await expect(
      row.getByRole('button', { name: `Delete ${projectName}` }),
    ).toHaveCount(0)

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)

    await page.getByRole('tab', { name: 'Team' }).click()
    await expect(page.getByRole('button', { name: 'Add member' })).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Add project manager' }),
    ).toHaveCount(0)
  })

  test('org team_member added as project manager sees edit and team controls but not delete', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-team-manager')
    const projectName = uniqueName('Team Manager Project')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Team Manager Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const teamManager = await createUser(request, admin.token, {
      email: uniqueEmail('team-manager'),
      name: 'Phase7 Team Manager',
      roles: ['team_member'],
    })
    await addProjectMemberApi(
      request,
      admin.token,
      project.id,
      teamManager.id,
      'manager',
    )

    await loginViaUI(page, teamManager.email, DEFAULT_PASSWORD)

    await gotoProject(page, project.id)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)

    await page.getByRole('tab', { name: 'Team' }).click()
    await expect(page.getByRole('button', { name: 'Add member' })).toBeVisible()
  })

  test('project-level manager can add a member and change a role', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-manage-members')
    const projectName = uniqueName('Manage Members Project')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Manage Members Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const teamManager = await createUser(request, admin.token, {
      email: uniqueEmail('team-manager-2'),
      name: 'Phase7 Team Manager Two',
      roles: ['team_member'],
    })
    const newMember = await createUser(request, admin.token, {
      email: uniqueEmail('new-member'),
      name: 'Phase7 New Member',
      roles: ['team_member'],
    })
    await addProjectMemberApi(
      request,
      admin.token,
      project.id,
      teamManager.id,
      'manager',
    )

    await loginViaUI(page, teamManager.email, DEFAULT_PASSWORD)
    await gotoProject(page, project.id)
    await page.getByRole('tab', { name: 'Team' }).click()

    await page.getByRole('button', { name: 'Add member' }).click()
    const addDialog = page.getByRole('dialog', { name: 'Add project member' })
    await expect(addDialog).toBeVisible()

    const addResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(`/api/v1/projects/${project.id}/members`) &&
        response.request().method() === 'POST'
      )
    })
    await addDialog
      .getByLabel('User (required)')
      .selectOption({ label: `${newMember.name} (${newMember.email})` })
    await addDialog.getByRole('button', { name: 'Add member' }).click()
    const addResponse = await addResponsePromise
    expect(addResponse.status()).toBe(201)
    await expect(addDialog).toBeHidden()

    const memberTable = page.getByRole('region', { name: 'Project members' })
    await expect(memberTable).toContainText(newMember.email)

    const roleSelect = page.getByLabel(`Project role for ${newMember.name}`)
    await expect(roleSelect).toHaveValue('member')

    const promoteResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname.endsWith(
          `/api/v1/projects/${project.id}/members/${newMember.id}`,
        ) && response.request().method() === 'PATCH'
      )
    })
    await roleSelect.selectOption('manager')
    const promoteResponse = await promoteResponsePromise
    expect(promoteResponse.status()).toBe(200)
    await expect(roleSelect).toHaveValue('manager')
  })

  test('non-member team_member cannot open a project and sees the access-denied state', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-nonmember')
    const projectName = uniqueName('Nonmember Project')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      uniqueName('Nonmember Portfolio'),
    )
    const project = await createProjectApi(request, admin.token, {
      name: projectName,
      portfolio_id: portfolio.id,
    })
    const outsider = await createUser(request, admin.token, {
      email: uniqueEmail('outsider'),
      name: 'Phase7 Outsider',
      roles: ['team_member'],
    })

    await loginViaUI(page, outsider.email, DEFAULT_PASSWORD)
    await page.goto(`/projects/${project.id}`)

    await expect(
      page.getByRole('heading', {
        name: 'You do not have access to this project',
      }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('non-member project_manager cannot open a converted zero-member project', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-converted')
    const idea = await provisionApprovedIdea(
      request,
      admin.token,
      uniqueName('Converted RBAC Idea'),
    )
    const converted = await (async () => {
      const response = await request.post(
        `${BACKEND_URL}/api/v1/ideas/${idea.id}/convert`,
        {
          headers: { Authorization: `Bearer ${admin.token}` },
          data: { portfolio_id: null },
        },
      )
      expect(response.status()).toBe(201)
      return (await response.json()) as { id: string }
    })()

    const outsider = await createUser(request, admin.token, {
      email: uniqueEmail('pm-outsider'),
      name: 'Phase7 PM Outsider',
      roles: ['project_manager'],
    })

    await loginViaUI(page, outsider.email, DEFAULT_PASSWORD)
    await page.goto(`/projects/${converted.id}`)

    await expect(
      page.getByRole('heading', {
        name: 'You do not have access to this project',
      }),
    ).toBeVisible({ timeout: 20000 })
  })

  test('read-only team_member sees portfolios and projects but no mutation controls', async ({
    page,
    request,
  }) => {
    const admin = await registerAccount(request, 'rbac-readonly')
    const portfolioName = uniqueName('Readonly Portfolio')
    const portfolio = await createPortfolioApi(
      request,
      admin.token,
      portfolioName,
    )
    await createProjectApi(request, admin.token, {
      name: uniqueName('Readonly Project'),
      portfolio_id: portfolio.id,
    })
    const readOnlyUser = await createUser(request, admin.token, {
      email: uniqueEmail('readonly'),
      name: 'Phase7 Read Only',
      roles: ['team_member'],
    })

    await loginViaUI(page, readOnlyUser.email, DEFAULT_PASSWORD)

    await page.goto('/portfolios')
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'New Portfolio' }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: `Edit ${portfolioName}` }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: `Delete ${portfolioName}` }),
    ).toHaveCount(0)

    await page.goto(`/portfolios/${portfolio.id}`)
    await expect(page.getByRole('heading', { name: portfolioName })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New Project' })).toHaveCount(0)

    await page.goto('/projects')
    await expect(
      page.getByText('You are not a member of any projects yet.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Project' })).toHaveCount(0)
  })
})
