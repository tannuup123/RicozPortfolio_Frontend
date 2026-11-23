import { useState, type ElementType } from 'react'
import { useInRouterContext, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProject, getProject } from '../../api/projects'
import { getPortfolio } from '../../api/portfolios'
import type { ApiError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { AppLink } from '../../components/ui/AppLink'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { canDeleteProject, canManageProject, canViewProject } from './rbac'
import { ProjectFormModal } from './components/ProjectFormModal'
import { ProjectOverviewTab } from './components/ProjectOverviewTab'
import { ProjectStatusBadge } from './components/ProjectStatusBadge'
import { ProjectTabs } from './components/ProjectTabs'
import { ProjectTeamTab } from './components/ProjectTeamTab'

export interface ProjectDetailPageProps {
  /** Route param supplied by the Next.js wrapper. */
  projectIdProp?: string
  /** Router-aware navigation supplied by the Next.js wrapper. */
  onNavigateBack?: (path?: string) => void
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
}

interface ProjectDetailContentProps {
  projectId?: string
  navigate: (path?: string) => void
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

const linkClass =
  'inline-flex min-h-[32px] items-center rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden'

function ProjectAccessDeniedState({
  variant,
  portfolioId,
  LinkComponent,
}: {
  variant: 'forbidden' | 'not-found'
  portfolioId?: string | null
  LinkComponent?: ElementType
}) {
  const isForbidden = variant === 'forbidden'

  return (
    <PageHeader
      title={
        isForbidden
          ? 'You do not have access to this project'
          : 'Project not found'
      }
      description={
        isForbidden
          ? 'You are not a member of this project and do not have a management role.'
          : 'This project may have been deleted or the link is invalid.'
      }
      actions={
        <>
          <AppLink to="/projects" LinkComponent={LinkComponent} className={linkClass}>
            Back to projects
          </AppLink>
          {portfolioId ? (
            <AppLink
              to={`/portfolios/${portfolioId}`}
              LinkComponent={LinkComponent}
              className={linkClass}
            >
              View portfolio
            </AppLink>
          ) : (
            <AppLink
              to="/portfolios"
              LinkComponent={LinkComponent}
              className={linkClass}
            >
              View portfolios
            </AppLink>
          )}
        </>
      }
    />
  )
}

/**
 * Project detail at `/projects/[projectId]`.
 *
 * Resolves the linked portfolio name separately, renders the real project
 * fields and source traceability, and gates edit/delete through project-level
 * RBAC. The backend remains authoritative for view and mutation permissions.
 */
function ProjectDetailContent({
  projectId,
  navigate,
  LinkComponent,
}: ProjectDetailContentProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: project, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  const portfolioId = project?.portfolio_id ?? null
  const {
    data: portfolio,
    isError: isPortfolioError,
  } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => getPortfolio(portfolioId!),
    enabled: !!portfolioId,
  })

  const portfolioUnavailable = isPortfolioError
  const portfolioName = portfolio?.name ?? null

  const canView = canViewProject(project ?? null, user)
  const canManage = canManageProject(project ?? null, user)
  const canDelete = canDeleteProject(user)

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      if (project?.portfolio_id) {
        void queryClient.invalidateQueries({
          queryKey: ['portfolio', project.portfolio_id],
        })
      }
      navigate('/projects')
    },
  })

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync()
  }

  const handleDeleteCancel = () => {
    if (deleteMutation.isPending) return
    setIsDeleteOpen(false)
  }

  const errorStatus = (error as ApiError | null)?.status
  const isNotFound = errorStatus === 404
  const isForbidden = errorStatus === 403

  if (!projectId) {
    return <ProjectAccessDeniedState variant="not-found" LinkComponent={LinkComponent} />
  }

  if (isLoading) {
    return <LoadingState message="Loading project..." className="py-12" />
  }

  if (isError) {
    if (isNotFound) {
      return (
        <ProjectAccessDeniedState variant="not-found" LinkComponent={LinkComponent} />
      )
    }
    if (isForbidden) {
      return (
        <ProjectAccessDeniedState variant="forbidden" LinkComponent={LinkComponent} />
      )
    }

    return (
      <ErrorState
        title="Unable to load project"
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

  if (!project) {
    return <ProjectAccessDeniedState variant="not-found" LinkComponent={LinkComponent} />
  }

  if (!canView) {
    return (
      <ProjectAccessDeniedState
        variant="forbidden"
        portfolioId={project.portfolio_id}
        LinkComponent={LinkComponent}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        LinkComponent={LinkComponent}
      />

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {project.name}
            <ProjectStatusBadge status={project.status} />
          </span>
        }
        actions={
          <>
            {canManage && (
              <Button
                variant="secondary"
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Portfolio
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {!project.portfolio_id ? (
                <span className="text-[var(--muted)]">Unassigned</span>
              ) : portfolioUnavailable ? (
                <span className="text-[var(--warning)]">
                  Portfolio unavailable
                </span>
              ) : (
                <AppLink
                  to={`/portfolios/${project.portfolio_id}`}
                  LinkComponent={LinkComponent}
                  className="font-medium text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
                >
                  {portfolioName ?? 'View portfolio'}
                </AppLink>
              )}
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

      {project.source_idea_id && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--info)_45%,transparent)] bg-[var(--info-bg)] px-4 py-3 text-xs text-[var(--info)]"
        >
          <span>Converted from idea</span>
          <AppLink
            to={`/demand/ideas/${project.source_idea_id}`}
            LinkComponent={LinkComponent}
            aria-label={`View source idea ${project.source_idea_id}`}
            className="font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
          >
            View source idea
          </AppLink>
        </div>
      )}

      <ProjectTabs
        overview={
          <ProjectOverviewTab
            project={project}
            portfolioName={portfolioName}
            portfolioUnavailable={portfolioUnavailable}
            canManage={canManage}
            onSelectPortfolio={() => setIsEditOpen(true)}
            LinkComponent={LinkComponent}
          />
        }
        team={
          <ProjectTeamTab
            project={project}
            canManageMembers={canManage}
            onSelfRemoved={() => navigate('/projects')}
          />
        }
      />

      <ProjectFormModal
        isOpen={isEditOpen}
        project={project}
        onClose={() => setIsEditOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete project"
        description={
          <>
            Delete <strong>{project.name}</strong>? The project is soft-deleted
            and disappears from project and portfolio views. It is not
            permanently erased.
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

function ProjectDetailWithRouter({
  projectIdProp,
  onNavigateBack,
  LinkComponent,
}: ProjectDetailPageProps) {
  const routeParams = useParams<{ projectId: string }>()
  const routerNavigate = useNavigate()
  const projectId = projectIdProp ?? routeParams.projectId
  const navigate =
    onNavigateBack ??
    ((path?: string) => {
      routerNavigate(path ?? '/projects')
    })

  return (
    <ProjectDetailContent
      projectId={projectId}
      navigate={navigate}
      LinkComponent={LinkComponent}
    />
  )
}

function ProjectDetailStandalone({
  projectIdProp,
  onNavigateBack,
  LinkComponent,
}: ProjectDetailPageProps) {
  const navigate = onNavigateBack ?? (() => {})

  return (
    <ProjectDetailContent
      projectId={projectIdProp}
      navigate={navigate}
      LinkComponent={LinkComponent}
    />
  )
}

/**
 * Dual-router entry point.
 *
 * Under React Router (Vite) the route params and navigation come from the
 * router. Under Next.js the route wrapper supplies `projectIdProp`,
 * `onNavigateBack`, and `LinkComponent`.
 */
export function ProjectDetailPage(props: ProjectDetailPageProps = {}) {
  const inRouter = useInRouterContext()

  if (inRouter) {
    return <ProjectDetailWithRouter {...props} />
  }

  return <ProjectDetailStandalone {...props} />
}
