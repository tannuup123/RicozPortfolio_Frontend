'use client'

/**
 * Next.js Users management page (/users).
 *
 * Route: /users under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * RBAC Behavior:
 * - org_admin: full user management (create user, view all org users, edit name, edit roles).
 * - non-admin: can view user list (read-only) and edit their own name, or receives an unauthorized warning
 *   if strict admin gate is desired. The backend is authoritative on permissions.
 *
 * Composes the existing modular UsersListPage component from src/features/users/UsersListPage.
 */

import { UsersListPage } from '../../../features/users/UsersListPage'

export default function UsersPage() {
  return <UsersListPage />
}
