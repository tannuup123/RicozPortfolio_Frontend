'use client'

/**
 * Next.js Strategic Goals page (/strategy/goals).
 *
 * Route: /strategy/goals under the (dashboard) route group.
 * Protected by DashboardLayout auth guard.
 *
 * RBAC Behavior:
 * - org_admin & portfolio_manager: can create, edit, and delete strategic goals.
 * - other authenticated roles: can view the goals list (read-only).
 *
 * Composes the existing modular GoalsPage component from src/features/strategy/GoalsPage.
 */

import { GoalsPage } from '../../../../features/strategy/GoalsPage'

export default function StrategyGoalsPage() {
  return <GoalsPage />
}
