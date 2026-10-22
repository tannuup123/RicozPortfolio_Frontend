'use client'

/**
 * Next.js Portfolio detail page (/portfolios/[portfolioId]).
 *
 * Route: /portfolios/[portfolioId] under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular PortfolioDetailPage from src/features/portfolios/PortfolioDetailPage.
 */

import { PortfolioDetailPage } from '../../../../features/portfolios/PortfolioDetailPage'

export default function PortfolioDetailPageWrapper() {
  return <PortfolioDetailPage />
}
