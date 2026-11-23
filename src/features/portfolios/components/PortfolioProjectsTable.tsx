import { useState } from 'react'
import type { ElementType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '../../../api/projects'
import { AppLink } from '../../../components/ui/AppLink'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { Pagination } from '../../../components/ui/Pagination'
import { ProjectStatusBadge } from '../../projects/components/ProjectStatusBadge'

const PAGE_SIZE = 20

export interface PortfolioProjectsTableProps {
  portfolioId: string
  /** Portfolio name used in the accessible table caption. */
  portfolioName: string
  /** Real active project count from `PortfolioDetailResponse.project_count`. */
  projectCount: number
  /** Broad managers can create a project from the empty state. */
  canManage: boolean
  onCreate: () => void
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
}

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Visible-projects table for the portfolio detail page.
 *
 * The portfolio is the page context, so the table repeats only project fields:
 * name, status, source, created date, and a view link. `project_count` is the
 * real portfolio total and may be larger than the visible total for non-broad
 * users; the visibility note prevents presenting the visible total as the
 * portfolio's total.
 */
export function PortfolioProjectsTable({
  portfolioId,
  portfolioName,
  projectCount,
  canManage,
  onCreate,
  LinkComponent,
}: PortfolioProjectsTableProps) {
  const [page, setPage] = useState(1)
  const offset = (page - 1) * PAGE_SIZE

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', { portfolioId, limit: PAGE_SIZE, offset }],
    queryFn: () =>
      getProjects({
        portfolio_id: portfolioId,
        limit: PAGE_SIZE,
        offset,
      }),
  })

  if (isLoading) {
    return <LoadingState message="Loading projects..." className="py-8" />
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load projects"
        message={
          error instanceof Error
            ? error.message
            : 'Please try again in a moment.'
        }
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const showVisibilityNote = !canManage && projectCount > total

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {showVisibilityNote && (
          <p className="text-xs text-[var(--ink-soft)]">
            Showing projects visible to you ({total} of {projectCount} active
            projects).
          </p>
        )}
        {canManage ? (
          <EmptyState
            title="No projects in this portfolio yet"
            description="Create a project to start tracking work in this portfolio."
            action={<Button onClick={onCreate}>Create project</Button>}
          />
        ) : (
          <EmptyState title="No projects visible to you in this portfolio." />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        role="region"
        aria-label={`Projects in ${portfolioName}`}
        tabIndex={0}
        className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-hidden"
      >
        <table className="min-w-full divide-y divide-[var(--border)]">
          <caption className="sr-only">Projects in {portfolioName}</caption>
          <thead className="bg-[var(--surface-subtle)]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
              >
                Project
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
              >
                Source
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[8px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase"
              >
                Created
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
            {items.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-[var(--surface-subtle)]"
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-left align-top"
                >
                  <AppLink
                    to={`/projects/${project.id}`}
                    LinkComponent={LinkComponent}
                    className="text-xs font-bold text-[var(--ink)] hover:text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
                  >
                    {project.name}
                  </AppLink>
                </th>

                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <ProjectStatusBadge status={project.status} />
                </td>

                <td className="px-4 py-3 align-top text-[10px] whitespace-nowrap">
                  <span
                    className={
                      project.source_idea_id
                        ? 'font-semibold text-[var(--ink)]'
                        : 'text-[var(--ink-soft)]'
                    }
                  >
                    {project.source_idea_id ? 'Converted' : 'Direct'}
                  </span>
                </td>

                <td className="px-4 py-3 align-top text-[10px] whitespace-nowrap text-[var(--ink-soft)]">
                  {formatCreatedDate(project.created_at)}
                </td>

                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  <AppLink
                    to={`/projects/${project.id}`}
                    LinkComponent={LinkComponent}
                    aria-label={`View ${project.name}`}
                    className="inline-flex min-h-[32px] items-center rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
                  >
                    View
                  </AppLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showVisibilityNote && (
        <p className="text-xs text-[var(--ink-soft)]">
          Showing projects visible to you ({total} of {projectCount} active
          projects).
        </p>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  )
}
