'use client'

/**
 * Next.js Projects list page (/projects).
 *
 * Route: /projects under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * Composes the existing modular ProjectListPage from src/features/projects/ProjectListPage.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProjectListPage } from '../../../features/projects/ProjectListPage'

export default function ProjectsPage() {
  const router = useRouter()

  return (
    <ProjectListPage
      LinkComponent={Link}
      onNavigate={(path) => router.push(path)}
    />
  )
}
