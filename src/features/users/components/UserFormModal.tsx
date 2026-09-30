import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { RoleName } from '../../../api/users'
import type { CreateUserPayload } from '../../../api/users'

const createUserSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(255, 'Name too long'),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    roles: z.array(z.nativeEnum(RoleName)).min(1, 'At least one role must be selected'),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

interface UserFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateUserPayload) => Promise<void>
}

export function UserFormModal({ isOpen, onClose, onSubmit }: UserFormModalProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CreateUserFormValues>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            roles: [RoleName.TEAM_MEMBER],
        },
    })

    if (!isOpen) return null

    const handleFormSubmit = async (data: CreateUserFormValues) => {
        setServerError(null)
        try {
            await onSubmit(data)
            reset()
            onClose()
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            if (error.status === 409) {
                setServerError(error.message || 'An account with this email already exists.')
            } else {
                setServerError(error.message || 'Creation failed. Please try again.')
            }
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
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Create New User</h2>
                
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email"
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('email')}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 ${
                                errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            {...register('password')}
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                    </div>

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
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
