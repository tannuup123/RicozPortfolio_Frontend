import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { IdeaResponse, IdeaUpdateRequest } from '../../../api/demand'

const editIdeaSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
    description: z.string().trim().min(1, 'Description is required'),
})

type EditIdeaFormValues = z.infer<typeof editIdeaSchema>

interface EditIdeaModalProps {
    idea: IdeaResponse | null
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: IdeaUpdateRequest) => Promise<void>
}

export function EditIdeaModal({ idea, isOpen, onClose, onSubmit }: EditIdeaModalProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<EditIdeaFormValues>({
        defaultValues: {
            title: '',
            description: '',
        },
    })

    useEffect(() => {
        if (idea) {
            reset({
                title: idea.title,
                description: idea.description,
            })
        }
    }, [idea, reset, isOpen])

    if (!isOpen || !idea) return null

    const handleFormSubmit = async (data: EditIdeaFormValues) => {
        setServerError(null)
        try {
            await onSubmit({
                title: data.title,
                description: data.description,
            })
            reset()
            onClose()
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            setServerError(error.message || 'Failed to update idea. Please try again.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Edit Idea</h2>

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
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('title')}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={5}
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('description')}
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
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
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
