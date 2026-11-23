'use client'

/**
 * Next.js Portfolio detail page (/portfolios/[portfolioId]).
 *
 * Route: /portfolios/[portfolioId] under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular PortfolioDetailPage from src/features/portfolios/PortfolioDetailPage.
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PortfolioDetailPage } from '../../../../features/portfolios/PortfolioDetailPage'

export default function PortfolioDetailPageWrapper() {
  const params = useParams<{ portfolioId: string }>()
  const router = useRouter()

  return (
    <PortfolioDetailPage
      portfolioIdProp={params.portfolioId}
      onNavigateBack={(path) => router.push(path ?? '/portfolios')}
      LinkComponent={Link}
    />
  )
}
