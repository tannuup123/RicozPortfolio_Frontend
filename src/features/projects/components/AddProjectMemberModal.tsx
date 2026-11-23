import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { addProjectMember } from '../../../api/projects'
import type {
  AddProjectMemberPayload,
  ProjectMemberRole,
} from '../../../api/projects'
import { getUsers } from '../../../api/users'
import type { ApiError } from '../../../api/errors'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'

const FORM_ID = 'add-project-member-form'
const USERS_LIMIT = 100

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'manager', label: 'Manager' },
]

export interface AddProjectMemberModalProps {
  isOpen: boolean
  projectId: string
  /** Existing project member user IDs; these are excluded from the select. */
  existingMemberIds: string[]
  onClose: () => void
  /** Called after a successful add so the parent can invalidate the project. */
  onAdded: () => void
}

/**
 * Add-project-member modal.
 *
 * Uses `GET /users?limit=100` for the selectable users, excludes current
 * project members, and keeps the modal open with the backend message on a
 * duplicate (409) or inactive/other-org (404) failure.
 */
export function AddProjectMemberModal({
  isOpen,
  projectId,
  existingMemberIds,
  onClose,
  onAdded,
}: AddProjectMemberModalProps) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<ProjectMemberRole>('member')
  const [serverError, setServerError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users', { limit: USERS_LIMIT }],
    queryFn: () => getUsers({ limit: USERS_LIMIT }),
    enabled: isOpen,
  })

  const addMutation = useMutation({
    mutationFn: (payload: AddProjectMemberPayload) =>
      addProjectMember(projectId, payload),
    onSuccess: () => {
      onClose()
      onAdded()
    },
    onError: (err: unknown) => {
      const status = (err as ApiError | null)?.status
      if (status === 409) {
        setServerError('This user is already a member.')
        return
      }
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to add the member. Please try again.',
      )
    },
  })

  const users = usersQuery.data?.items ?? []
  const existing = new Set(existingMemberIds)
  const selectableUsers = users.filter((user) => !existing.has(user.id))
  const noSelectableUsers =
    usersQuery.isSuccess && selectableUsers.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) {
      setServerError('Select a user to add.')
      return
    }

    setServerError(null)
    addMutation.mutate({ user_id: userId, project_role: role })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={addMutation.isPending}
      title="Add project member"
      description="Select a user and their project role."
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={addMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            isLoading={addMutation.isPending}
            disabled={
              addMutation.isPending ||
              !userId ||
              noSelectableUsers
            }
          >
            Add member
          </Button>
        </div>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {usersQuery.isLoading && (
          <p role="status" className="text-xs text-[var(--ink-soft)]">
            Loading users...
          </p>
        )}

        {usersQuery.isError && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            <p>
              {usersQuery.error instanceof Error
                ? usersQuery.error.message
                : 'Unable to load users.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                void usersQuery.refetch()
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {noSelectableUsers && (
          <p role="status" className="text-xs text-[var(--ink-soft)]">
            {users.length > 0
              ? 'All organization users are already members'
              : 'No users available.'}
          </p>
        )}

        {usersQuery.data && usersQuery.data.total > USERS_LIMIT && (
          <p className="text-[10px] text-[var(--muted)]">
            Showing the first {USERS_LIMIT} users.
          </p>
        )}

        {serverError && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            {serverError}
          </div>
        )}

        <Select
          id="add-member-user"
          label="User (required)"
          aria-required="true"
          options={[
            { value: '', label: 'Select a user' },
            ...selectableUsers.map((user) => ({
              value: user.id,
              label: `${user.name} (${user.email})`,
            })),
          ]}
          value={userId}
          disabled={
            usersQuery.isLoading ||
            usersQuery.isError ||
            noSelectableUsers ||
            addMutation.isPending
          }
          onChange={(event) => {
            setUserId(event.target.value)
          }}
        />

        <Select
          id="add-member-role"
          label="Project role (required)"
          aria-required="true"
          options={ROLE_OPTIONS}
          value={role}
          disabled={addMutation.isPending}
          onChange={(event) => {
            setRole(event.target.value as ProjectMemberRole)
          }}
        />
      </form>
    </Modal>
  )
}
