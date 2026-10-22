'use client'

/**
 * Next.js Portfolios list page (/portfolios).
 *
 * Route: /portfolios under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular PortfolioListPage from src/features/portfolios/PortfolioListPage.
 */

import { PortfolioListPage } from '../../../features/portfolios/PortfolioListPage'

export default function PortfoliosPage() {
  return <PortfolioListPage />
}
