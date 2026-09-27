import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { getMe, register as registerUser } from '../../api/auth'
import { setAccessToken } from '../../api/client'
import { useAuth, type AuthUser } from '../../auth/AuthContext'

const registerSchema = z.object({
    name: z.string().trim().min(1, 'Full name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
    organization_name: z.string().trim().min(1, 'Organization name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
    const navigate = useNavigate()
    const { setSession } = useAuth()
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        defaultValues: {
            name: '',
            email: '',
            organization_name: '',
            password: '',
        },
    })

    const onSubmit = async (data: RegisterFormValues) => {
        setServerError(null)

        const result = registerSchema.safeParse(data)
        if (!result.success) {
            setServerError(result.error.issues[0]?.message ?? 'Invalid input')
            return
        }

        try {
            const tokenResponse = await registerUser({
                email: result.data.email,
                password: result.data.password,
                name: result.data.name,
                organization_name: result.data.organization_name,
            })

            setAccessToken(tokenResponse.access_token)

            const me = await getMe()

            setSession(
                {
                    id: me.id,
                    email: me.email,
                    name: me.name,
                    organization_id: me.organization_id,
                    roles: me.roles as AuthUser['roles'],
                },
                tokenResponse.access_token,
            )

            navigate('/', { replace: true })
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            if (error.status === 409) {
                setServerError(error.message || 'An account with this email already exists.')
            } else {
                setServerError(error.message || 'Registration failed. Please try again.')
            }
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                        Create an organization
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                {serverError && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                        <p className="text-sm font-medium text-red-800">{serverError}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-xs focus:outline-hidden focus:ring-2 ${
                                        errors.name
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                    }`}
                                    {...register('name', {
                                        required: 'Full name is required',
                                    })}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-xs focus:outline-hidden focus:ring-2 ${
                                        errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                    }`}
                                    {...register('email', {
                                        required: 'Email is required',
                                        validate: (val) => {
                                            const res = z.string().email().safeParse(val)
                                            return res.success ? true : 'Invalid email address'
                                        },
                                    })}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700">
                                Organization Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="organization_name"
                                    type="text"
                                    className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-xs focus:outline-hidden focus:ring-2 ${
                                        errors.organization_name
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                    }`}
                                    {...register('organization_name', {
                                        required: 'Organization name is required',
                                    })}
                                />
                                {errors.organization_name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.organization_name.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 shadow-xs focus:outline-hidden focus:ring-2 ${
                                        errors.password
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                    }`}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters',
                                        },
                                    })}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}