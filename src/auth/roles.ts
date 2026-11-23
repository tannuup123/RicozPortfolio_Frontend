/**
 * Org-level RBAC helpers.
 *
 * These helpers exist for frontend visibility and action gating only. The
 * backend remains authoritative for authorization; a direct API call can still
 * receive 403/404 even when a helper returns true.
 *
 * Broad manager = org_admin or portfolio_manager (Phase 7 Section 3.4).
 */

import { RoleName } from '../api/users'
import type { AuthUser } from './AuthContext'

export function hasRole(user: AuthUser | null, role: RoleName): boolean {
  return user?.roles.includes(role) ?? false
}

export function isOrgAdmin(user: AuthUser | null): boolean {
  return hasRole(user, RoleName.ORG_ADMIN)
}

export function isBroadManager(user: AuthUser | null): boolean {
  return (
    hasRole(user, RoleName.ORG_ADMIN) ||
    hasRole(user, RoleName.PORTFOLIO_MANAGER)
  )
}

export function canManagePortfolios(user: AuthUser | null): boolean {
  return isBroadManager(user)
}

export function canCreateProjects(user: AuthUser | null): boolean {
  return isBroadManager(user)
}
