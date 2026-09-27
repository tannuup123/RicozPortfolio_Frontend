/**
 * Basic application shell: a topbar and sidebar wrapping routed content.
 *
 * Phase 1 scope only: static layout and placeholder nav links matching the
 * page hierarchy in architecture.md Section 4. No role-aware nav filtering
 * yet — that's an RBAC-phase task.
 */

import type { ReactNode } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { logout } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'

const NAV_LINKS = [
    { to: '/', label: 'Dashboard' },
    { to: '/strategy/goals', label: 'Strategy' },
    { to: '/demand/ideas', label: 'Demand' },
    { to: '/portfolios', label: 'Portfolios' },
]

export function AppShell({ children }: { children?: ReactNode }) {
    const navigate = useNavigate()
    const { user, setSession } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } finally {
            setSession(null, null)
            navigate('/login')
        }
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-56 shrink-0 border-r border-gray-200 p-4">
                <div className="mb-6 text-lg font-semibold">RicozPortfolio</div>
                <nav className="flex flex-col gap-2">
                    {NAV_LINKS.map((link) => (
                        <Link key={link.to} to={link.to} className="text-sm text-gray-700 hover:text-black">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <span className="text-sm text-gray-500">
                        {user ? `${user.name} (${user.email})` : 'RicozPortfolio Frontend'}
                    </span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sign out
                    </button>
                </header>
                <main className="flex-1 p-6">{children ?? <Outlet />}</main>
            </div>
        </div>
    )
}