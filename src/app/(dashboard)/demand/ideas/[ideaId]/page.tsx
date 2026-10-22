'use client'

/**
 * Next.js Idea detail page (/demand/ideas/[ideaId]).
 *
 * Route: /demand/ideas/[ideaId] under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular IdeaDetailPage from src/features/demand/IdeaDetailPage,
 * passing Next.js dynamic route param, useRouter navigation, and Next.js Link.
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { IdeaDetailPage } from '../../../../../features/demand/IdeaDetailPage'

export default function DemandIdeaDetailPage() {
  const params = useParams<{ ideaId: string }>()
  const router = useRouter()

  return (
    <IdeaDetailPage
      ideaIdProp={params.ideaId}
      onNavigateBack={() => router.push('/demand/ideas')}
      LinkComponent={Link}
    />
  )
}
