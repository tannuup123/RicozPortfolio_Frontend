import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIdea, updateIdea, deleteIdea, VALID_IDEA_TRANSITIONS } from '../../api/demand'
import type { IdeaUpdateRequest, IdeaStatus } from '../../api/demand'
import { getGoal } from '../../api/strategy'
import { useAuth } from '../../auth/AuthContext'
import { RoleName } from '../../api/users'
import { IdeaStatusBadge } from './components/IdeaStatusBadge'
import { EditIdeaModal } from './components/EditIdeaModal'
import { DeleteIdeaModal } from './components/DeleteIdeaModal'

export function IdeaDetailPage() {
    const { ideaId } = useParams<{ ideaId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user: currentUser } = useAuth()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [transitionError, setTransitionError] = useState<string | null>(null)

    const {
        data: idea,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['ideas', ideaId],
        queryFn: () => getIdea(ideaId!),
        enabled: !!ideaId,
    })

    const { data: linkedGoal } = useQuery({
        queryKey: ['strategic-goals', idea?.strategic_goal_id],
        queryFn: () => getGoal(idea!.strategic_goal_id!),
        enabled: !!idea?.strategic_goal_id,
    })

    const isOrgAdmin = currentUser?.roles.includes(RoleName.ORG_ADMIN)
    const isPortfolioManager = currentUser?.roles.includes(RoleName.PORTFOLIO_MANAGER)
    const canManageStatus = isOrgAdmin || isPortfolioManager
    const canDelete = isOrgAdmin || isPortfolioManager
    const isAuthor = currentUser?.id === idea?.author_id
    const canEditContent = canManageStatus || (isAuthor && idea?.status === 'draft')

    const updateMutation = useMutation({
        mutationFn: (data: IdeaUpdateRequest) => updateIdea(ideaId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
            queryClient.invalidateQueries({ queryKey: ['ideas', ideaId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteIdea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
            navigate('/demand/ideas')
        },
    })

    const handleEditSubmit = async (payload: IdeaUpdateRequest) => {
        await updateMutation.mutateAsync(payload)
    }

    const handleDeleteConfirm = async (id: string) => {
        await deleteMutation.mutateAsync(id)
    }

    const handleStatusTransition = async (nextStatus: IdeaStatus) => {
        setTransitionError(null)
        try {
            await updateMutation.mutateAsync({ status: nextStatus })
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            setTransitionError(error.message || `Failed to transition idea to ${nextStatus}.`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
            </div>
        )
    }

    if (isError || !idea) {
        return (
            <div className="space-y-4">
                <Link to="/demand/ideas" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                    &larr; Back to Ideas
                </Link>
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                        Error loading idea: {error instanceof Error ? error.message : 'Idea not found'}
                    </p>
                </div>
            </div>
        )
    }

    const validTransitions = VALID_IDEA_TRANSITIONS[idea.status] || []

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <Link
                    to="/demand/ideas"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                    &larr; Back to Ideas List
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
                        <IdeaStatusBadge status={idea.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                        Submitted on{' '}
                        {new Date(idea.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}{' '}
                        &bull; Last modified{' '}
                        {new Date(idea.updated_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {canEditContent && (
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Edit Idea
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="rounded-md border border-red-300 bg-white px-3.5 py-2 text-sm font-medium text-red-700 shadow-xs hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {transitionError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">{transitionError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                        <h2 className="text-base font-semibold text-gray-900 mb-3">Idea Description</h2>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {idea.description}
                        </div>
                    </div>

                    {/* Phase 6 Preview Banner */}
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-3">
                            <span className="font-bold text-sm">P6</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            Business Case & Approval Workflow (Phase 6)
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
                            In Phase 6, you will be able to attach financial ROI business cases, perform formal portfolio approvals, and convert approved ideas into active projects.
                        </p>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Lifecycle & Status Transitions */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-semibold text-gray-900">Demand Lifecycle</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Current Status:</span>
                                <IdeaStatusBadge status={idea.status} />
                            </div>
                        </div>

                        {canManageStatus && validTransitions.length > 0 && (
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                                <span className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Available Actions
                                </span>
                                {validTransitions.map((nextStatus) => {
                                    const actionLabel =
                                        nextStatus === 'submitted'
                                            ? 'Submit for Review'
                                            : nextStatus === 'in_review'
                                              ? 'Move to In Review'
                                              : nextStatus === 'approved'
                                                ? 'Approve Idea'
                                                : nextStatus === 'rejected'
                                                  ? 'Reject Idea'
                                                  : nextStatus

                                    const isApprove = nextStatus === 'approved'
                                    const isReject = nextStatus === 'rejected'

                                    return (
                                        <button
                                            key={nextStatus}
                                            type="button"
                                            disabled={updateMutation.isPending}
                                            onClick={() => handleStatusTransition(nextStatus)}
                                            className={`w-full rounded-md px-3 py-2 text-xs font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                                                isApprove
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500'
                                                    : isReject
                                                      ? 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500'
                                                      : 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500'
                                            } disabled:cursor-not-allowed disabled:opacity-60`}
                                        >
                                            {updateMutation.isPending ? 'Processing...' : actionLabel}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {!canManageStatus && (
                            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                Only portfolio managers and organization admins can advance the lifecycle status of this idea.
                            </p>
                        )}

                        {validTransitions.length === 0 && (
                            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 italic">
                                This idea is in a terminal status ({idea.status}).
                            </p>
                        )}
                    </div>

                    {/* Strategic Alignment */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs space-y-3">
                        <h2 className="text-base font-semibold text-gray-900">Strategic Alignment</h2>
                        {linkedGoal ? (
                            <div className="space-y-2">
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                    {linkedGoal.title}
                                </span>
                                {linkedGoal.description && (
                                    <p className="text-xs text-gray-600">{linkedGoal.description}</p>
                                )}
                                <div className="pt-2">
                                    <Link
                                        to="/strategy/goals"
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                                    >
                                        View in Goals &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">
                                No strategic goal linked. General organizational demand.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <EditIdeaModal
                idea={idea}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
            />

            <DeleteIdeaModal
                idea={idea}
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    )
}
