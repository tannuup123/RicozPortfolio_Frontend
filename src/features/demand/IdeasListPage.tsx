import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIdeas, createIdea } from '../../api/demand'
import type { IdeaCreateRequest } from '../../api/demand'
import { getGoals } from '../../api/strategy'
import { IdeaStatusBadge } from './components/IdeaStatusBadge'
import { CreateIdeaModal } from './components/CreateIdeaModal'

const PAGE_SIZE = 10

export function IdeasListPage() {
    const queryClient = useQueryClient()
    const [offset, setOffset] = useState(0)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['ideas', { limit: PAGE_SIZE, offset }],
        queryFn: () => getIdeas({ limit: PAGE_SIZE, offset }),
    })

    const { data: goalsData } = useQuery({
        queryKey: ['strategic-goals', { limit: 100 }],
        queryFn: () => getGoals({ limit: 100 }),
    })

    const goalsMap = useMemo(() => {
        const map = new Map<string, string>()
        if (goalsData?.items) {
            goalsData.items.forEach((g) => {
                map.set(g.id, g.title)
            })
        }
        return map
    }, [goalsData])

    const createMutation = useMutation({
        mutationFn: (data: IdeaCreateRequest) => createIdea(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
        },
    })

    const handleCreateSubmit = async (payload: IdeaCreateRequest) => {
        await createMutation.mutateAsync(payload)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Demand & Ideas</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Capture organizational innovation, product ideas, and customer demands for portfolio evaluation.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Submit Idea
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                        Error loading ideas: {error instanceof Error ? error.message : 'Unknown error'}
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
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Strategic Alignment
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Submitted Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {data.items.map((idea) => {
                                const linkedGoalTitle = idea.strategic_goal_id
                                    ? goalsMap.get(idea.strategic_goal_id)
                                    : null

                                return (
                                    <tr key={idea.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/demand/ideas/${idea.id}`}
                                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-900 line-clamp-1"
                                            >
                                                {idea.title}
                                            </Link>
                                            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                {idea.description}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <IdeaStatusBadge status={idea.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {linkedGoalTitle ? (
                                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                    {linkedGoalTitle}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">None</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            {new Date(idea.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <Link
                                                to={`/demand/ideas/${idea.id}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                View Details &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            {data.items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No ideas submitted yet. Click "Submit Idea" above to share the first proposal.
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
                                    <span className="font-medium">{data.total}</span> ideas
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

            <CreateIdeaModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
            />
        </div>
    )
}