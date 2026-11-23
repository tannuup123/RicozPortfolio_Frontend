/**
 * Project-level RBAC helpers.
 *
 * The project membership row is the deciding factor for non-broad users. An
 * org `project_manager` without a membership row does not automatically gain
 * project management, while a `team_member` with project role `manager` does.
 *
 * These helpers exist for frontend visibility and action gating only. The
 * backend remains authoritative for authorization.
 *
 * Rules (Phase 7 Section 3.4):
 * - canViewProject = broad manager or any membership.
 * - canManageProject = broad manager or membership with project_role "manager".
 * - canDeleteProject = broad manager only.
 * - canManageProjectMembers = same as canManageProject.
 */

import type { ProjectDetail, ProjectMember } from '../../api/projects'
import type { AuthUser } from '../../auth/AuthContext'
import { isBroadManager } from '../../auth/roles'

export function getMembership(
  project: ProjectDetail | null,
  userId: string | undefined,
): ProjectMember | undefined {
  if (!project || !userId) return undefined
  return project.members.find((member) => member.user_id === userId)
}

export function canViewProject(
  project: ProjectDetail | null,
  user: AuthUser | null,
): boolean {
  if (!user) return false
  if (isBroadManager(user)) return true
  return getMembership(project, user.id) !== undefined
}

export function canManageProject(
  project: ProjectDetail | null,
  user: AuthUser | null,
): boolean {
  if (!user) return false
  if (isBroadManager(user)) return true
  return getMembership(project, user.id)?.project_role === 'manager'
}

export function canDeleteProject(user: AuthUser | null): boolean {
  return isBroadManager(user)
}

export function canManageProjectMembers(
  project: ProjectDetail | null,
  user: AuthUser | null,
): boolean {
  return canManageProject(project, user)
}
