import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  removeProjectMember,
  updateProjectMemberRole,
} from '../../../api/projects'
import type {
  ProjectDetail,
  ProjectMember,
  ProjectMemberRole,
} from '../../../api/projects'
import { useAuth } from '../../../auth/AuthContext'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { EmptyState } from '../../../components/ui/EmptyState'
import { AddProjectMemberModal } from './AddProjectMemberModal'
import { ProjectMembersTable } from './ProjectMembersTable'

export interface ProjectTeamTabProps {
  project: ProjectDetail
  /** Broad managers and project-level managers can manage membership. */
  canManageMembers: boolean
  /** Called after the current user removes themselves. */
  onSelfRemoved: () => void
}

/**
 * Project Team tab.
 *
 * Member data comes from the project detail response (`project.members`), so
 * there is no duplicate members query. Add, role change, and remove mutations
 * invalidate `['project', projectId]`; the parent re-evaluates RBAC from the
 * refreshed member list.
 */
export function ProjectTeamTab({
  project,
  canManageMembers,
  onSelfRemoved,
}: ProjectTeamTabProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addModalInstance, setAddModalInstance] = useState(0)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmingRoleChange, setConfirmingRoleChange] = useState<{
    member: ProjectMember
    role: ProjectMemberRole
  } | null>(null)
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(
    null,
  )

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectMemberRole }) =>
      updateProjectMemberRole(project.id, userId, { project_role: role }),
    onSuccess: () => {
      setPendingUserId(null)
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['project', project.id] })
    },
    onError: (err: unknown) => {
      setPendingUserId(null)
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to update the member role.',
      )
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeProjectMember(project.id, userId),
    onSuccess: (_result, userId) => {
      setPendingUserId(null)
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      if (userId === user?.id) {
        onSelfRemoved()
      }
    },
    onError: (err: unknown) => {
      setPendingUserId(null)
      setActionError(
        err instanceof Error ? err.message : 'Unable to remove the member.',
      )
    },
  })

  const handleRoleChange = (member: ProjectMember, role: ProjectMemberRole) => {
    if (role === member.project_role) return

    setActionError(null)

    // Self-demotion needs an explicit warning because management access may be lost.
    if (member.user_id === user?.id && role === 'member') {
      setConfirmingRoleChange({ member, role })
      return
    }

    setPendingUserId(member.user_id)
    roleMutation.mutate({ userId: member.user_id, role })
  }

  const handleRoleConfirm = async () => {
    if (!confirmingRoleChange) return

    const { member, role } = confirmingRoleChange
    setPendingUserId(member.user_id)
    await roleMutation.mutateAsync({ userId: member.user_id, role })
    setConfirmingRoleChange(null)
  }

  const handleRoleCancel = () => {
    if (roleMutation.isPending) return
    setConfirmingRoleChange(null)
  }

  const handleRemove = (member: ProjectMember) => {
    setActionError(null)
    setRemovingMember(member)
  }

  const handleRemoveConfirm = async () => {
    if (!removingMember) return

    const userId = removingMember.user_id
    setPendingUserId(userId)
    await removeMutation.mutateAsync(userId)
    setRemovingMember(null)
  }

  const handleRemoveCancel = () => {
    if (removeMutation.isPending) return
    setRemovingMember(null)
  }

  const openAddModal = () => {
    setAddModalInstance((instance) => instance + 1)
    setIsAddOpen(true)
  }

  const hasMembers = project.members.length > 0

  return (
    <div className="space-y-4">
      {!hasMembers ? (
        canManageMembers ? (
          <EmptyState
            title="No members yet"
            description="Add a project manager to start building the team."
            action={
              <Button onClick={openAddModal}>Add project manager</Button>
            }
          />
        ) : (
          <EmptyState title="No members are assigned to this project." />
        )
      ) : (
        <>
          {canManageMembers && (
            <div className="flex justify-end">
              <Button onClick={openAddModal}>Add member</Button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
            >
              {actionError}
            </div>
          )}

          <ProjectMembersTable
            members={project.members}
            canManage={canManageMembers}
            isPending={roleMutation.isPending || removeMutation.isPending}
            pendingUserId={pendingUserId}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
          />
        </>
      )}

      <AddProjectMemberModal
        key={addModalInstance}
        isOpen={isAddOpen}
        projectId={project.id}
        existingMemberIds={project.members.map((member) => member.user_id)}
        onClose={() => setIsAddOpen(false)}
        onAdded={() => {
          void queryClient.invalidateQueries({
            queryKey: ['project', project.id],
          })
        }}
      />

      <ConfirmDialog
        isOpen={confirmingRoleChange !== null}
        title="Change your role?"
        description="You are changing your own project role to Member. You may lose the ability to manage this project's team."
        confirmLabel="Change role"
        onConfirm={handleRoleConfirm}
        onCancel={handleRoleCancel}
        isLoading={roleMutation.isPending}
      />

      <ConfirmDialog
        isOpen={removingMember !== null}
        title="Remove member"
        description={
          removingMember?.user_id === user?.id ? (
            'You are removing yourself from this project. You may lose access to it.'
          ) : removingMember ? (
            <>
              Remove <strong>{removingMember.user_name}</strong> from this
              project?
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Remove member"
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
        isLoading={removeMutation.isPending}
      />
    </div>
  )
}
