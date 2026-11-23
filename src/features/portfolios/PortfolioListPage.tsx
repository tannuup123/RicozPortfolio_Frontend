import { useState } from 'react'
import type { ElementType } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPortfolio,
  deletePortfolio,
  getPortfolios,
  updatePortfolio,
} from '../../api/portfolios'
import type {
  CreatePortfolioPayload,
  PortfolioSummary,
  UpdatePortfolioPayload,
} from '../../api/portfolios'
import { useAuth } from '../../auth/AuthContext'
import { canManagePortfolios } from '../../auth/roles'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { PortfolioCard } from './components/PortfolioCard'
import { PortfolioFormModal } from './components/PortfolioFormModal'

const PAGE_SIZE = 12

export interface PortfolioListPageProps {
  /** Next.js `Link`, wired by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
}

/**
 * Portfolio list at `/portfolios`.
 *
 * Any authenticated user can read the list. Only broad managers (org admin or
 * portfolio manager) see create, edit, and delete controls; the backend remains
 * authoritative for those actions.
 */
export function PortfolioListPage({ LinkComponent }: PortfolioListPageProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioSummary | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioSummary | null>(null)

  const canManage = canManagePortfolios(user)
  const offset = (page - 1) * PAGE_SIZE

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['portfolios', { limit: PAGE_SIZE, offset }],
    queryFn: () => getPortfolios({ limit: PAGE_SIZE, offset }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreatePortfolioPayload) => createPortfolio(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      // The backend orders portfolios by created_at DESC, so the new
      // portfolio is on the first page.
      setPage(1)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      portfolioId,
      payload,
    }: {
      portfolioId: string
      payload: UpdatePortfolioPayload
    }) => updatePortfolio(portfolioId, payload),
    onSuccess: (_portfolio, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      void queryClient.invalidateQueries({
        queryKey: ['portfolio', variables.portfolioId],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (portfolioId: string) => deletePortfolio(portfolioId),
    onSuccess: (_result, portfolioId) => {
      void queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      void queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const openCreate = () => {
    setEditingPortfolio(null)
    setIsFormOpen(true)
  }

  const openEdit = (portfolio: PortfolioSummary) => {
    setEditingPortfolio(portfolio)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    setIsFormOpen(false)
    setEditingPortfolio(null)
  }

  const handleFormSubmit = async (payload: CreatePortfolioPayload) => {
    if (editingPortfolio) {
      await updateMutation.mutateAsync({
        portfolioId: editingPortfolio.id,
        payload,
      })
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingPortfolio) return

    const wasLastItemOnPage = (data?.items.length ?? 0) === 1
    await deleteMutation.mutateAsync(deletingPortfolio.id)
    setDeletingPortfolio(null)

    if (wasLastItemOnPage && page > 1) {
      setPage(page - 1)
    }
  }

  const handleDeleteCancel = () => {
    if (deleteMutation.isPending) return
    setDeletingPortfolio(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolios"
        description="Group related projects into portfolios so delivery stays aligned with strategic goals."
        actions={
          canManage ? (
            <Button onClick={openCreate}>New Portfolio</Button>
          ) : undefined
        }
      />

      {isLoading && (
        <LoadingState message="Loading portfolios..." className="py-12" />
      )}

      {!isLoading && isError && (
        <ErrorState
          title="Unable to load portfolios"
          message={
            error instanceof Error
              ? error.message
              : 'Please try again in a moment.'
          }
          onRetry={() => {
            void refetch()
          }}
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        canManage ? (
          <EmptyState
            title="No portfolios yet"
            description="Create your first portfolio to group related projects."
            action={<Button onClick={openCreate}>Create portfolio</Button>}
          />
        ) : (
          <EmptyState
            title="No portfolios available."
            description="No portfolios have been created for this organization yet."
          />
        )
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <ul
            role="list"
            className="grid grid-cols-1 gap-[13px] min-[621px]:grid-cols-2 min-[1101px]:grid-cols-3"
          >
            {data.items.map((portfolio) => (
              <li key={portfolio.id} className="min-w-0">
                <PortfolioCard
                  portfolio={portfolio}
                  canManage={canManage}
                  href={`/portfolios/${portfolio.id}`}
                  LinkComponent={LinkComponent}
                  onEdit={openEdit}
                  onDelete={(item) => setDeletingPortfolio(item)}
                />
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={setPage}
            className="mt-5"
          />
        </>
      )}

      <PortfolioFormModal
        isOpen={isFormOpen}
        portfolio={editingPortfolio}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={deletingPortfolio !== null}
        title="Delete portfolio"
        description={
          <>
            Delete <strong>{deletingPortfolio?.name}</strong>? Projects in this
            portfolio are not deleted. They keep their existing portfolio
            reference and show &ldquo;Portfolio unavailable&rdquo; until
            reassigned.
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
