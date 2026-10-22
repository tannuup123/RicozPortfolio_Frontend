import { defineConfig, devices } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Helper to load test env file if present.
 */
function loadLocalEnv(relativeFilePath: string) {
  const absPath = path.resolve(process.cwd(), relativeFilePath)
  if (!fs.existsSync(absPath)) return
  const content = fs.readFileSync(absPath, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  }
}

loadLocalEnv('./tests/e2e/.env.test.local')

/**
 * Playwright E2E configuration for RicozPortfolio Next.js frontend.
 *
 * Configured to connect to Next.js on http://localhost:3000.
 * Reuses existing running servers where available.
 *
 * Test credentials: Create tests/e2e/.env.test.local (gitignored) with:
 *   TEST_ORG_ADMIN_EMAIL=admin2@example.com
 *   TEST_ORG_ADMIN_PASSWORD=<password>
 *   TEST_USER_EMAIL=admin2@example.com
 *   TEST_USER_PASSWORD=<password>
 *   TEST_TEAM_MEMBER_EMAIL=teammember1@example.com
 *   TEST_TEAM_MEMBER_PASSWORD=<password>
 *   TEST_ORG1_USER_EMAIL=admin2@example.com
 *   TEST_ORG1_USER_PASSWORD=<password>
 *   TEST_ORG2_USER_EMAIL=admin_org2@example.com
 *   TEST_ORG2_USER_PASSWORD=<password>
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Load local test credentials from tests/e2e/.env.test.local (gitignored). */
  dotenv: { path: './tests/e2e/.env.test.local', override: false },
  fullyParallel: false, // run sequentially to avoid state collisions during auth tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
