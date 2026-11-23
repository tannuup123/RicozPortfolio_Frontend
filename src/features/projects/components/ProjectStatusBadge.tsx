import type { ProjectStatus } from '../../../api/projects'
import { Badge, type BadgeTone } from '../../../components/ui/Badge'

interface StatusConfig {
  label: string
  tone: BadgeTone
}

const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  planned: { label: 'Planned', tone: 'neutral' },
  active: { label: 'Active', tone: 'info' },
  on_hold: { label: 'On hold', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

/**
 * Project lifecycle status badge.
 *
 * Always renders the human-readable status label, so the state is never
 * conveyed by color alone. Badge's dot is decorative.
 */
export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const { label, tone } = STATUS_CONFIG[status]

  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  )
}
