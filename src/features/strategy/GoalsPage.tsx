import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../api/strategy'
import type { StrategicGoalResponse, StrategicGoalCreateRequest } from '../../api/strategy'
import { useAuth } from '../../auth/AuthContext'
import { RoleName } from '../../api/users'
import { GoalModal } from './components/GoalModal'
import { DeleteGoalModal } from './components/DeleteGoalModal'

const PAGE_SIZE = 10

export function GoalsPage() {
    const { user: currentUser } = useAuth()
    const queryClient = useQueryClient()
    const [offset, setOffset] = useState(0)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<StrategicGoalResponse | null>(null)
    const [deletingGoal, setDeletingGoal] = useState<StrategicGoalResponse | null>(null)

    const canManageGoals =
        currentUser?.roles.includes(RoleName.ORG_ADMIN) ||
        currentUser?.roles.includes(RoleName.PORTFOLIO_MANAGER)

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['strategic-goals', { limit: PAGE_SIZE, offset }],
        queryFn: () => getGoals({ limit: PAGE_SIZE, offset }),
    })

    const createMutation = useMutation({
        mutationFn: (data: StrategicGoalCreateRequest) => createGoal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-goals'] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ goalId, data }: { goalId: string; data: StrategicGoalCreateRequest }) =>
            updateGoal(goalId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-goals'] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (goalId: string) => deleteGoal(goalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-goals'] })
        },
    })

    const handleCreateSubmit = async (payload: StrategicGoalCreateRequest) => {
        await createMutation.mutateAsync(payload)
    }

    const handleUpdateSubmit = async (payload: StrategicGoalCreateRequest) => {
        if (!editingGoal) return
        await updateMutation.mutateAsync({ goalId: editingGoal.id, data: payload })
    }

    const handleDeleteConfirm = async (goalId: string) => {
        await deleteMutation.mutateAsync(goalId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Strategic Goals</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Define and track strategic organizational priorities that guide ideas and investments.
                    </p>
                </div>
                {canManageGoals && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create Goal
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                        Error loading strategic goals: {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            )}

            {data && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Created Date
                                </th>
                                {canManageGoals && (
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {data.items.map((goal) => (
                                <tr key={goal.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{goal.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-md line-clamp-2">
                                            {goal.description || <span className="text-gray-400 italic">No description provided</span>}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {new Date(goal.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    {canManageGoals && (
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => setEditingGoal(goal)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeletingGoal(goal)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {data.items.length === 0 && (
                                <tr>
                                    <td colSpan={canManageGoals ? 4 : 3} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No strategic goals found.{' '}
                                        {canManageGoals && 'Click "Create Goal" above to create the first one.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                                disabled={offset === 0}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setOffset(offset + PAGE_SIZE)}
                                disabled={offset + PAGE_SIZE >= data.total}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{data.total === 0 ? 0 : offset + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(offset + PAGE_SIZE, data.total)}</span> of{' '}
                                    <span className="font-medium">{data.total}</span> goals
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                                    <button
                                        onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                                        disabled={offset === 0}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Previous</span>
                                        &larr; Prev
                                    </button>
                                    <button
                                        onClick={() => setOffset(offset + PAGE_SIZE)}
                                        disabled={offset + PAGE_SIZE >= data.total}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        Next &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <GoalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
            />

            <GoalModal
                goal={editingGoal}
                isOpen={!!editingGoal}
                onClose={() => setEditingGoal(null)}
                onSubmit={handleUpdateSubmit}
            />

            <DeleteGoalModal
                goal={deletingGoal}
                isOpen={!!deletingGoal}
                onClose={() => setDeletingGoal(null)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    )
}