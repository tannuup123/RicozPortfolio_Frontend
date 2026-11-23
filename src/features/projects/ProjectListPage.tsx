import { useState } from 'react'
import type { ElementType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProject, getProjects } from '../../api/projects'
import type { ProjectStatus, ProjectSummary } from '../../api/projects'
import { getPortfolios } from '../../api/portfolios'
import { useAuth } from '../../auth/AuthContext'
import { canCreateProjects, isBroadManager } from '../../auth/roles'
import { canDeleteProject } from './rbac'
import { AppLink } from '../../components/ui/AppLink'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { ProjectFormModal } from './components/ProjectFormModal'
import { ProjectStatusBadge } from './components/ProjectStatusBadge'

const PAGE_SIZE = 20
const PORTFOLIO_OPTIONS_LIMIT = 100

type StatusFilter = '' | ProjectStatus

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export interface ProjectListPageProps {
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
  /** Router-aware navigation, wired by the route wrapper in the Next.js baseline. */
  onNavigate?: (path: string) => void
}

/**
 * Global project list at `/projects`.
 *
 * The list is usable without a portfolio context so unassigned projects stay
 * discoverable. All authenticated users can read it; the backend returns only
 * the projects the user may see. Only broad managers see create, edit, and
 * delete controls because `ProjectSummary` carries no membership data.
 */
export function ProjectListPage({
  LinkComponent,
  onNavigate,
}: ProjectListPageProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<StatusFilter>('')
  const [portfolioId, setPortfolioId] = useState('')
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null)

  const canManage = isBroadManager(user)
  const canCreate = canCreateProjects(user)
  const canDelete = canDeleteProject(user)
  const hasActiveFilters = status !== '' || portfolioId !== ''

  const offset = (page - 1) * PAGE_SIZE

  const projectsQuery = useQuery({
    queryKey: ['projects', { portfolioId, status, limit: PAGE_SIZE, offset }],
    queryFn: () =>
      getProjects({
        ...(portfolioId ? { portfolio_id: portfolioId } : {}),
        ...(status ? { status } : {}),
        limit: PAGE_SIZE,
        offset,
      }),
  })

  const portfolioOptionsQuery = useQuery({
    queryKey: ['portfolios', 'options'],
    queryFn: () => getPortfolios({ limit: PORTFOLIO_OPTIONS_LIMIT }),
  })

  const portfolios = portfolioOptionsQuery.data?.items ?? []
  const portfolioNames = new Map(
    portfolios.map((portfolio) => [portfolio.id, portfolio.name]),
  )

  const portfolioFilterOptions = [
    { value: '', label: 'All portfolios' },
    ...portfolios.map((portfolio) => ({
      value: portfolio.id,
      label: portfolio.name,
    })),
  ]

  const deleteMutation = useMutation({
    mutationFn: (project: ProjectSummary) => deleteProject(project.id),
    onSuccess: (_result, project) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      if (project.portfolio_id) {
        void queryClient.invalidateQueries({
          queryKey: ['portfolio', project.portfolio_id],
        })
      }
    },
  })

  const openCreate = () => {
    setEditingProject(null)
    setIsFormOpen(true)
  }

  const openEdit = (project: ProjectSummary) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProject(null)
  }

  const clearFilters = () => {
    setStatus('')
    setPortfolioId('')
    setPage(1)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return

    const project = deletingProject
    const wasLastItemOnPage = (projectsQuery.data?.items.length ?? 0) === 1

    await deleteMutation.mutateAsync(project)
    setDeletingProject(null)

    if (wasLastItemOnPage && page > 1) {
      setPage(page - 1)
    }
  }

  const handleDeleteCancel = () => {
    if (deleteMutation.isPending) return
    setDeletingProject(null)
  }

  const isLoading = projectsQuery.isLoading || portfolioOptionsQuery.isLoading
  const isError = projectsQuery.isError
  const projects = projectsQuery.data?.items ?? []
  const hasProjects = projects.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track projects across portfolios, including work that is not yet assigned to one."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>New Project</Button>
          ) : undefined
        }
      />

      {isLoading && (
        <LoadingState message="Loading projects..." className="py-12" />
      )}

      {!isLoading && isError && (
        <ErrorState
          title="Unable to load projects"
          message={
            projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : 'Please try again in a moment.'
          }
          onRetry={() => {
            void projectsQuery.refetch()
            if (portfolioOptionsQuery.isError) {
              void portfolioOptionsQuery.refetch()
            }
          }}
        />
      )}

      {!isLoading && !isError && (
        <>
          <section
            aria-label="Project filters"
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Select
                id="project-status-filter"
                label="Status"
                options={STATUS_FILTER_OPTIONS}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter)
                  setPage(1)
                }}
              />

              <Select
                id="project-portfolio-filter"
                label="Portfolio"
                options={portfolioFilterOptions}
                value={portfolioId}
                onChange={(event) => {
                  setPortfolioId(event.target.value)
                  setPage(1)
                }}
              />

              <Button
                variant="secondary"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear filters
              </Button>
            </div>

            {portfolioOptionsQuery.isError && (
              <p
                role="alert"
                className="mt-3 text-[10px] font-medium text-[var(--warning)]"
              >
                Portfolio names could not be loaded.
              </p>
            )}
          </section>

          {!hasProjects ? (
            canManage ? (
              <EmptyState
                title="No projects yet"
                description="Create your first project inside a portfolio."
                action={<Button onClick={openCreate}>Create project</Button>}
              />
            ) : (
              <EmptyState title="You are not a member of any projects yet." />
            )
          ) : (
            <>
              <div
                role="region"
                aria-label="Projects table"
                tabIndex={0}
                className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-hidden"
              >
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <caption className="sr-only">Projects</caption>
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
                        Portfolio
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
                    {projects.map((project) => {
                      const description = project.description?.trim()
                      const portfolioName = project.portfolio_id
                        ? portfolioNames.get(project.portfolio_id)
                        : undefined

                      return (
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
                            {description && (
                              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[var(--ink-soft)]">
                                {description}
                              </p>
                            )}
                          </th>

                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <ProjectStatusBadge status={project.status} />
                          </td>

                          <td className="px-4 py-3 align-top text-[10px] text-[var(--ink-soft)]">
                            {!project.portfolio_id ? (
                              <span className="text-[var(--muted)]">
                                Unassigned
                              </span>
                            ) : portfolioName ? (
                              portfolioName
                            ) : portfolioOptionsQuery.isError ? (
                              <span className="text-[var(--muted)]">&mdash;</span>
                            ) : (
                              <span className="text-[var(--warning)]">
                                Portfolio unavailable
                              </span>
                            )}
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
                            <div className="flex items-center justify-end gap-2">
                              <AppLink
                                to={`/projects/${project.id}`}
                                LinkComponent={LinkComponent}
                                aria-label={`View ${project.name}`}
                                className="inline-flex min-h-[32px] items-center rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
                              >
                                View
                              </AppLink>

                              {canManage && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    aria-label={`Edit ${project.name}`}
                                    onClick={() => openEdit(project)}
                                  >
                                    Edit
                                  </Button>
                                  {canDelete && (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      aria-label={`Delete ${project.name}`}
                                      onClick={() =>
                                        setDeletingProject(project)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {projectsQuery.data && projectsQuery.data.total > 0 && (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={projectsQuery.data.total}
                  onPageChange={setPage}
                  className="mt-5"
                />
              )}
            </>
          )}
        </>
      )}

      <ProjectFormModal
        isOpen={isFormOpen}
        project={editingProject}
        onClose={closeForm}
        onNavigate={onNavigate}
      />

      <ConfirmDialog
        isOpen={deletingProject !== null}
        title="Delete project"
        description={
          <>
            Delete <strong>{deletingProject?.name}</strong>? The project is
            soft-deleted and disappears from project and portfolio views. It is
            not permanently erased.
          </>
        }
        confirmLabel="Delete project"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
