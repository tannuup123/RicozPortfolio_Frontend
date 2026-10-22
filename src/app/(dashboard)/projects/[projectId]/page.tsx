'use client'

/**
 * Next.js Project detail page (/projects/[projectId]).
 *
 * Route: /projects/[projectId] under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular ProjectDetailPage from src/features/projects/ProjectDetailPage.
 */

import { ProjectDetailPage } from '../../../../features/projects/ProjectDetailPage'

export default function ProjectDetailPageWrapper() {
  return <ProjectDetailPage />
}
