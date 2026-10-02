import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { getGoals } from '../../../api/strategy'
import type { IdeaCreateRequest } from '../../../api/demand'

const createIdeaSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
    description: z.string().trim().min(1, 'Description is required'),
    strategic_goal_id: z.string().optional(),
    status: z.enum(['draft', 'submitted']),
})

type CreateIdeaFormValues = z.infer<typeof createIdeaSchema>

interface CreateIdeaModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: IdeaCreateRequest) => Promise<void>
}

export function CreateIdeaModal({ isOpen, onClose, onSubmit }: CreateIdeaModalProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const { data: goalsData } = useQuery({
        queryKey: ['strategic-goals', { limit: 100 }],
        queryFn: () => getGoals({ limit: 100 }),
        enabled: isOpen,
    })

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CreateIdeaFormValues>({
        defaultValues: {
            title: '',
            description: '',
            strategic_goal_id: '',
            status: 'submitted',
        },
    })

    if (!isOpen) return null

    const handleFormSubmit = async (data: CreateIdeaFormValues) => {
        setServerError(null)
        try {
            await onSubmit({
                title: data.title,
                description: data.description,
                strategic_goal_id: data.strategic_goal_id && data.strategic_goal_id !== '' ? data.strategic_goal_id : null,
                status: data.status,
            })
            reset()
            onClose()
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            setServerError(error.message || 'Failed to submit idea. Please try again.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Submit New Idea</h2>

                {serverError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Idea Title</label>
                        <input
                            type="text"
                            placeholder="e.g. AI-Powered Customer Support Assistant"
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('title')}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description & Justification</label>
                        <textarea
                            rows={4}
                            placeholder="Provide a comprehensive summary of the idea, opportunity, and expected impact..."
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('description')}
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Strategic Alignment (Optional)</label>
                        <select
                            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            {...register('strategic_goal_id')}
                        >
                            <option value="">-- None / General Idea --</option>
                            {goalsData?.items.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.title}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Linking to a Strategic Goal helps portfolio managers evaluate organizational alignment.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Submission Mode</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="submitted"
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    {...register('status')}
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Submit for Review</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="draft"
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    {...register('status')}
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Save as Draft</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
