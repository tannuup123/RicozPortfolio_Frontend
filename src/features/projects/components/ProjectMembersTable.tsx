import type { ProjectMember, ProjectMemberRole } from '../../../api/projects'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'

export interface ProjectMembersTableProps {
  members: ProjectMember[]
  /** Broad managers and project-level managers can change roles and remove. */
  canManage: boolean
  /** True while any membership mutation is in flight. */
  isPending: boolean
  /** User ID of the row currently being mutated, if any. */
  pendingUserId: string | null
  onRoleChange: (member: ProjectMember, role: ProjectMemberRole) => void
  onRemove: (member: ProjectMember) => void
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'manager', label: 'Manager' },
]

function formatJoinedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Semantic project member table.
 *
 * Managers get an inline role select and a remove action; other project
 * members get a read-only table with a textual role badge. The parent owns
 * the mutations, pending state, and confirmations.
 */
export function ProjectMembersTable({
  members,
  canManage,
  isPending,
  pendingUserId,
  onRoleChange,
  onRemove,
}: ProjectMembersTableProps) {
  return (
    <div
      role="region"
      aria-label="Project members"
      tabIndex={0}
      className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-hidden"
    >
      <table className="min-w-full divide-y divide-[var(--border)]">
        <caption className="sr-only">Project members</caption>
        <thead className="bg-[var(--surface-subtle)]">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
            >
              Member
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
            >
              Project role
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
            >
              Joined
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {members.map((member) => {
            const isRowPending = isPending && pendingUserId === member.user_id

            return (
              <tr
                key={member.id}
                className="hover:bg-[var(--surface-subtle)]"
                aria-busy={isRowPending}
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-left align-top text-xs font-bold text-[var(--ink)]"
                >
                  {member.user_name}
                </th>
                <td className="px-4 py-3 align-top text-xs text-[var(--ink-soft)]">
                  {member.user_email}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {canManage ? (
                    <Select
                      id={`member-role-${member.id}`}
                      aria-label={`Project role for ${member.user_name}`}
                      options={ROLE_OPTIONS}
                      value={member.project_role}
                      disabled={isPending}
                      onChange={(event) => {
                        onRoleChange(
                          member,
                          event.target.value as ProjectMemberRole,
                        )
                      }}
                      className="min-w-[120px]"
                    />
                  ) : (
                    <Badge
                      tone={member.project_role === 'manager' ? 'info' : 'neutral'}
                    >
                      {member.project_role === 'manager' ? 'Manager' : 'Member'}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-xs whitespace-nowrap text-[var(--ink-soft)]">
                  {formatJoinedDate(member.created_at)}
                </td>
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  {canManage && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isPending}
                      aria-label={`Remove ${member.user_name}`}
                      onClick={() => onRemove(member)}
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
