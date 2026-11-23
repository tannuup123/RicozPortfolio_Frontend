import type { ElementType } from 'react'
import type { ProjectDetail } from '../../../api/projects'
import { AppLink } from '../../../components/ui/AppLink'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ProjectStatusBadge } from './ProjectStatusBadge'

export interface ProjectOverviewTabProps {
  project: ProjectDetail
  /** Resolved portfolio name, or `null` when unresolved/loading. */
  portfolioName: string | null
  /** True when the linked portfolio lookup failed (for example, soft-deleted). */
  portfolioUnavailable: boolean
  /** Broad manager or project-level manager. */
  canManage: boolean
  /** Opens the edit modal so a manager can choose a different portfolio. */
  onSelectPortfolio: () => void
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function PortfolioValue({
  project,
  portfolioName,
  portfolioUnavailable,
  LinkComponent,
}: {
  project: ProjectDetail
  portfolioName: string | null
  portfolioUnavailable: boolean
  LinkComponent?: ElementType
}) {
  if (!project.portfolio_id) {
    return <span className="text-[var(--muted)]">Unassigned</span>
  }

  if (portfolioUnavailable) {
    return <span className="text-[var(--warning)]">Portfolio unavailable</span>
  }

  return (
    <AppLink
      to={`/portfolios/${project.portfolio_id}`}
      LinkComponent={LinkComponent}
      className="font-medium text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
    >
      {portfolioName ?? 'View portfolio'}
    </AppLink>
  )
}

/**
 * Project Overview tab.
 *
 * Renders only fields present in `ProjectDetailResponse`: description, status,
 * portfolio, source, timestamps, and member count. No health, metric, task,
 * budget, milestone, or risk content is fabricated.
 */
export function ProjectOverviewTab({
  project,
  portfolioName,
  portfolioUnavailable,
  canManage,
  onSelectPortfolio,
  LinkComponent,
}: ProjectOverviewTabProps) {
  const description = project.description?.trim()

  return (
    <div className="space-y-5">
      {project.members.length === 0 && (
        <div
          role="alert"
          className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--warning)_45%,transparent)] bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]"
        >
          This project has no members yet. Only a project manager can add the
          first member.
        </div>
      )}

      {portfolioUnavailable && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--warning)_45%,transparent)] bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]"
        >
          <span>
            Portfolio unavailable — the linked portfolio may have been deleted.
          </span>
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSelectPortfolio}
            >
              Select portfolio
            </Button>
          )}
        </div>
      )}

      <section>
        <h2 className="text-sm font-bold text-[var(--ink)]">Description</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">
          {description ? (
            description
          ) : (
            <span className="text-[var(--muted)]">No description</span>
          )}
        </p>
      </section>

      <Card>
        <h2 className="text-sm font-bold text-[var(--ink)]">Details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Status
            </dt>
            <dd className="mt-1">
              <ProjectStatusBadge status={project.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Portfolio
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              <PortfolioValue
                project={project}
                portfolioName={portfolioName}
                portfolioUnavailable={portfolioUnavailable}
                LinkComponent={LinkComponent}
              />
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Source
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {project.source_idea_id ? 'Converted from idea' : 'Direct'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Created
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {formatDate(project.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Last updated
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {formatDate(project.updated_at)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Members
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {project.members.length}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
