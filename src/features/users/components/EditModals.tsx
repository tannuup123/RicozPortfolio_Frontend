import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { RoleName } from '../../../api/users'
import type { User, UpdateUserPayload, UpdateUserRolesPayload } from '../../../api/users'

const editNameSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(255, 'Name too long'),
})

type EditNameFormValues = z.infer<typeof editNameSchema>

interface EditNameModalProps {
    user: User | null
    isOpen: boolean
    onClose: () => void
    onSubmit: (userId: string, data: UpdateUserPayload) => Promise<void>
}

export function EditNameModal({ user, isOpen, onClose, onSubmit }: EditNameModalProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<EditNameFormValues>()

    useEffect(() => {
        if (user) {
            reset({ name: user.name })
        }
    }, [user, reset])

    if (!isOpen || !user) return null

    const handleFormSubmit = async (data: EditNameFormValues) => {
        setServerError(null)
        try {
            await onSubmit(user.id, { name: data.name })
            onClose()
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            setServerError(error.message || 'Update failed. Please try again.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Edit Name for {user.email}</h2>
                
                {serverError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('name')}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
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
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const editRolesSchema = z.object({
    roles: z.array(z.nativeEnum(RoleName)).min(1, 'At least one role must be selected'),
})

type EditRolesFormValues = z.infer<typeof editRolesSchema>

interface EditRolesModalProps {
    user: User | null
    isOpen: boolean
    onClose: () => void
    onSubmit: (userId: string, data: UpdateUserRolesPayload) => Promise<void>
}

export function EditRolesModal({ user, isOpen, onClose, onSubmit }: EditRolesModalProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<EditRolesFormValues>()

    useEffect(() => {
        if (user) {
            reset({ roles: user.roles })
        }
    }, [user, reset])

    if (!isOpen || !user) return null

    const handleFormSubmit = async (data: EditRolesFormValues) => {
        setServerError(null)
        try {
            await onSubmit(user.id, { roles: data.roles })
            onClose()
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            setServerError(error.message || 'Update failed. Please try again.')
        }
    }

    const availableRoles = [
        { value: RoleName.ORG_ADMIN, label: 'Organization Admin' },
        { value: RoleName.PORTFOLIO_MANAGER, label: 'Portfolio Manager' },
        { value: RoleName.PROJECT_MANAGER, label: 'Project Manager' },
        { value: RoleName.TEAM_MEMBER, label: 'Team Member' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Edit Roles for {user.email}</h2>
                
                {serverError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                        <div className="space-y-2">
                            {availableRoles.map((role) => (
                                <label key={role.value} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        value={role.value}
                                        className="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        {...register('roles')}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.roles && <p className="mt-1 text-xs text-red-600">{errors.roles.message}</p>}
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
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
