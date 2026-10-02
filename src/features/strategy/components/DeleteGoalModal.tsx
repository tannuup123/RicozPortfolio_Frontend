import { useState } from 'react'
import type { StrategicGoalResponse } from '../../../api/strategy'

interface DeleteGoalModalProps {
    goal: StrategicGoalResponse | null
    isOpen: boolean
    onClose: () => void
    onConfirm: (goalId: string) => Promise<void>
}

export function DeleteGoalModal({ goal, isOpen, onClose, onConfirm }: DeleteGoalModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    if (!isOpen || !goal) return null

    const handleConfirm = async () => {
        setIsDeleting(true)
        setServerError(null)
        try {
            await onConfirm(goal.id)
            setIsDeleting(false)
            onClose()
        } catch (err: unknown) {
            setIsDeleting(false)
            const error = err as { status?: number; message?: string }
            setServerError(error.message || 'Failed to delete goal.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-2 text-xl font-semibold text-gray-900">Delete Strategic Goal</h2>
                
                {serverError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                        {serverError}
                    </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{goal.title}"</span>? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Goal'}
                    </button>
                </div>
            </div>
        </div>
    )
}
