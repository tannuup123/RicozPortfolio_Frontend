'use client'

/**
 * Next.js Ideas list page (/demand/ideas).
 *
 * Route: /demand/ideas under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular IdeasListPage from src/features/demand/IdeasListPage,
 * passing Next.js Link for client-side App Router navigation.
 */

import Link from 'next/link'
import { IdeasListPage } from '../../../../features/demand/IdeasListPage'

export default function DemandIdeasListPage() {
  return <IdeasListPage LinkComponent={Link} />
}
