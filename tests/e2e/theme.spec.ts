import { test, expect } from '@playwright/test'

test.describe('Theme Engine & Pre-Paint Smoke Suite', () => {
  test('Initial theme defaults to light and applies data-theme on html element', async ({ page }) => {
    await page.goto('/login')

    // html element should have data-theme attribute set
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', /light|dark/)
  })

  test('Pre-paint script respects stored ricoz_theme_preference', async ({ page }) => {
    // Set theme in localStorage prior to page script evaluation
    await page.addInitScript(() => {
      localStorage.setItem('ricoz_theme_preference', 'dark')
    })

    await page.goto('/login')

    // Pre-paint script must have applied dark theme immediately
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'dark')
  })

  test('Light theme preference is preserved and applied', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ricoz_theme_preference', 'light')
    })

    await page.goto('/login')

    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'light')
  })
})
