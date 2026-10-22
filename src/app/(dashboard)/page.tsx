'use client'

/**
 * Dashboard home page (/).
 *
 * Protected by the (dashboard) layout auth guard.
 * Real dashboard content (metrics, project summaries) is a feature-phase task.
 * This page is a placeholder that confirms the auth guard, AppShell, and routing
 * are all working correctly end-to-end.
 */

import { useAuth } from '../../auth/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      {user && (
        <p className="text-sm text-gray-600">
          Welcome, <strong>{user.name}</strong>. Organisation:{' '}
          <code className="text-xs">{user.organization_id}</code>
        </p>
      )}
      <p className="text-sm text-gray-500">
        Dashboard content will be implemented in the feature migration phase.
      </p>
    </div>
  )
}
