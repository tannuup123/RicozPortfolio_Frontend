import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, updateUserRoles, RoleName } from '../../api/users'
import type { User, CreateUserPayload, UpdateUserPayload, UpdateUserRolesPayload } from '../../api/users'
import { useAuth } from '../../auth/AuthContext'
import { getMe } from '../../api/auth'
import { getAccessToken } from '../../api/client'
import { UserFormModal } from './components/UserFormModal'
import { EditNameModal, EditRolesModal } from './components/EditModals'

const PAGE_SIZE = 20

export function UsersListPage() {
    const { user: currentUser, setSession } = useAuth()
    const queryClient = useQueryClient()
    const [offset, setOffset] = useState(0)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingNameUser, setEditingNameUser] = useState<User | null>(null)
    const [editingRolesUser, setEditingRolesUser] = useState<User | null>(null)

    const isOrgAdmin = currentUser?.roles.includes(RoleName.ORG_ADMIN)

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['users', { limit: PAGE_SIZE, offset }],
        queryFn: () => getUsers({ limit: PAGE_SIZE, offset }),
    })

    const createMutation = useMutation({
        mutationFn: (data: CreateUserPayload) => createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        },
    })

    const updateNameMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: UpdateUserPayload }) => updateUser(userId, data),
        onSuccess: async (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            if (updatedUser.id === currentUser?.id) {
                const me = await getMe()
                setSession({ ...me, roles: me.roles as RoleName[] }, getAccessToken())
            }
        },
    })

    const updateRolesMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRolesPayload }) => updateUserRoles(userId, data),
        onSuccess: async (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            if (updatedUser.id === currentUser?.id) {
                const me = await getMe()
                setSession({ ...me, roles: me.roles as RoleName[] }, getAccessToken())
            }
        },
    })

    const handleCreateSubmit = async (payload: CreateUserPayload) => {
        await createMutation.mutateAsync(payload)
    }

    const handleUpdateNameSubmit = async (userId: string, payload: UpdateUserPayload) => {
        await updateNameMutation.mutateAsync({ userId, data: payload })
        // Handled the profile sync below in a better way
    }

    const handleUpdateRolesSubmit = async (userId: string, payload: UpdateUserRolesPayload) => {
        await updateRolesMutation.mutateAsync({ userId, data: payload })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                {isOrgAdmin && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create User
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            )}

            {data && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Roles</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {data.items.map((u) => {
                                const isSelf = u.id === currentUser?.id;
                                const canEditName = isOrgAdmin || isSelf;
                                const canEditRoles = isOrgAdmin;

                                return (
                                    <tr key={u.id}>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{u.name} {isSelf && <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">You</span>}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.map(r => (
                                                    <span key={r} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            {canEditName && (
                                                <button
                                                    onClick={() => setEditingNameUser(u)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit Name
                                                </button>
                                            )}
                                            {canEditRoles && (
                                                <button
                                                    onClick={() => setEditingRolesUser(u)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit Roles
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.items.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No users found.
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
                                    Showing <span className="font-medium">{Math.min(offset + 1, data.total)}</span> to{' '}
                                    <span className="font-medium">{Math.min(offset + PAGE_SIZE, data.total)}</span> of{' '}
                                    <span className="font-medium">{data.total}</span> results
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

            <UserFormModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
            />
            
            <EditNameModal
                user={editingNameUser}
                isOpen={!!editingNameUser}
                onClose={() => setEditingNameUser(null)}
                onSubmit={handleUpdateNameSubmit}
            />

            <EditRolesModal
                user={editingRolesUser}
                isOpen={!!editingRolesUser}
                onClose={() => setEditingRolesUser(null)}
                onSubmit={handleUpdateRolesSubmit}
            />
        </div>
    )
}
