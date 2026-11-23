import { useState, type ElementType } from 'react'
import { useInRouterContext, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deletePortfolio,
  getPortfolio,
  updatePortfolio,
} from '../../api/portfolios'
import type { CreatePortfolioPayload } from '../../api/portfolios'
import type { ApiError } from '../../api/errors'
import { useAuth } from '../../auth/AuthContext'
import { canCreateProjects, canManagePortfolios } from '../../auth/roles'
import { AppLink } from '../../components/ui/AppLink'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProjectFormModal } from '../projects/components/ProjectFormModal'
import { PortfolioFormModal } from './components/PortfolioFormModal'
import { PortfolioProjectsTable } from './components/PortfolioProjectsTable'

export interface PortfolioDetailPageProps {
  /** Route param supplied by the Next.js wrapper. */
  portfolioIdProp?: string
  /** Router-aware navigation supplied by the Next.js wrapper. */
  onNavigateBack?: (path?: string) => void
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
}

interface PortfolioDetailContentProps {
  portfolioId?: string
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

function PortfolioNotFoundState({
  LinkComponent,
}: {
  LinkComponent?: ElementType
}) {
  return (
    <PageHeader
      title="Portfolio not found"
      description="This portfolio may have been deleted or is no longer available."
      actions={
        <AppLink
          to="/portfolios"
          LinkComponent={LinkComponent}
          className="inline-flex min-h-[32px] items-center rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
        >
          Back to portfolios
        </AppLink>
      }
    />
  )
}

/**
 * Portfolio detail at `/portfolios/[portfolioId]`.
 *
 * Any authenticated user can read the portfolio and the projects visible to
 * them. Only broad managers see edit, delete, and project-creation controls;
 * the backend remains authoritative for those actions. `project_count` is the
 * real portfolio total and may exceed the visible total for non-broad users.
 */
function PortfolioDetailContent({
  portfolioId,
  navigate,
  LinkComponent,
}: PortfolioDetailContentProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const canManage = canManagePortfolios(user)
  const canCreate = canCreateProjects(user)

  const { data: portfolio, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => getPortfolio(portfolioId!),
    enabled: !!portfolioId,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreatePortfolioPayload) =>
      updatePortfolio(portfolioId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      void queryClient.invalidateQueries({
        queryKey: ['portfolio', portfolioId],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePortfolio(portfolioId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      void queryClient.invalidateQueries({
        queryKey: ['portfolio', portfolioId],
      })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/portfolios')
    },
  })

  const handleFormSubmit = async (payload: CreatePortfolioPayload) => {
    await updateMutation.mutateAsync(payload)
  }

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync()
  }

  const handleDeleteCancel = () => {
    if (deleteMutation.isPending) return
    setIsDeleteOpen(false)
  }

  const errorStatus = (error as ApiError | null)?.status
  const isNotFound = errorStatus === 404

  if (!portfolioId) {
    return <PortfolioNotFoundState LinkComponent={LinkComponent} />
  }

  if (isLoading) {
    return <LoadingState message="Loading portfolio..." className="py-12" />
  }

  if (isError) {
    if (isNotFound) {
      return <PortfolioNotFoundState LinkComponent={LinkComponent} />
    }

    return (
      <ErrorState
        title="Unable to load portfolio"
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

  if (!portfolio) {
    return <PortfolioNotFoundState LinkComponent={LinkComponent} />
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Portfolios', href: '/portfolios' },
          { label: portfolio.name },
        ]}
        LinkComponent={LinkComponent}
      />

      <PageHeader
        title={portfolio.name}
        description={portfolio.description?.trim() || 'No description'}
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
            {canManage && (
              <Button
                variant="danger"
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => setIsCreateProjectOpen(true)}>
                New Project
              </Button>
            )}
          </>
        }
      />

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Active projects
            </dt>
            <dd className="mt-1 text-lg font-bold text-[var(--ink)]">
              {portfolio.project_count}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Created
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {formatDate(portfolio.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.04em] text-[var(--muted)] uppercase">
              Last updated
            </dt>
            <dd className="mt-1 text-xs text-[var(--ink-soft)]">
              {formatDate(portfolio.updated_at)}
            </dd>
          </div>
        </dl>
      </Card>

      <PortfolioProjectsTable
        portfolioId={portfolio.id}
        portfolioName={portfolio.name}
        projectCount={portfolio.project_count}
        canManage={canManage}
        onCreate={() => setIsCreateProjectOpen(true)}
        LinkComponent={LinkComponent}
      />

      <PortfolioFormModal
        isOpen={isEditOpen}
        portfolio={portfolio}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ProjectFormModal
        isOpen={isCreateProjectOpen}
        project={null}
        defaultPortfolioId={portfolio.id}
        onClose={() => setIsCreateProjectOpen(false)}
        onNavigate={(path) => navigate(path)}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete portfolio"
        description={
          <>
            Delete <strong>{portfolio.name}</strong>? Projects in this portfolio
            are not deleted. They keep their existing portfolio reference and
            show &ldquo;Portfolio unavailable&rdquo; until reassigned.
          </>
        }
        confirmLabel="Delete portfolio"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function PortfolioDetailWithRouter({
  portfolioIdProp,
  onNavigateBack,
  LinkComponent,
}: PortfolioDetailPageProps) {
  const routeParams = useParams<{ portfolioId: string }>()
  const routerNavigate = useNavigate()
  const portfolioId = portfolioIdProp ?? routeParams.portfolioId
  const navigate =
    onNavigateBack ??
    ((path?: string) => {
      routerNavigate(path ?? '/portfolios')
    })

  return (
    <PortfolioDetailContent
      portfolioId={portfolioId}
      navigate={navigate}
      LinkComponent={LinkComponent}
    />
  )
}

function PortfolioDetailStandalone({
  portfolioIdProp,
  onNavigateBack,
  LinkComponent,
}: PortfolioDetailPageProps) {
  const navigate = onNavigateBack ?? (() => {})

  return (
    <PortfolioDetailContent
      portfolioId={portfolioIdProp}
      navigate={navigate}
      LinkComponent={LinkComponent}
    />
  )
}

/**
 * Dual-router entry point.
 *
 * Under React Router (Vite) the route params and navigation come from the
 * router. Under Next.js the route wrapper supplies `portfolioIdProp`,
 * `onNavigateBack`, and `LinkComponent`.
 */
export function PortfolioDetailPage(props: PortfolioDetailPageProps = {}) {
  const inRouter = useInRouterContext()

  if (inRouter) {
    return <PortfolioDetailWithRouter {...props} />
  }

  return <PortfolioDetailStandalone {...props} />
}
