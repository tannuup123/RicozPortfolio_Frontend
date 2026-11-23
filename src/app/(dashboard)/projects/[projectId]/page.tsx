'use client'

/**
 * Next.js Project detail page (/projects/[projectId]).
 *
 * Route: /projects/[projectId] under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular ProjectDetailPage from src/features/projects/ProjectDetailPage.
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ProjectDetailPage } from '../../../../features/projects/ProjectDetailPage'

export default function ProjectDetailPageWrapper() {
  const params = useParams<{ projectId: string }>()
  const router = useRouter()

  return (
    <ProjectDetailPage
      projectIdProp={params.projectId}
      onNavigateBack={(path) => router.push(path ?? '/projects')}
      LinkComponent={Link}
    />
  )
}
