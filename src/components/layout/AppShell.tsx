/**
 * Basic application shell: a topbar and sidebar wrapping routed content.
 *
 * Phase 1 scope only: static layout and placeholder nav links matching the
 * page hierarchy in architecture.md Section 4. No role-aware nav filtering
 * yet — that's an RBAC-phase task.
 */

import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'

const NAV_LINKS = [
    { to: '/', label: 'Dashboard' },
    { to: '/strategy/goals', label: 'Strategy' },
    { to: '/demand/ideas', label: 'Demand' },
    { to: '/portfolios', label: 'Portfolios' },
]

export function AppShell({ children }: { children?: ReactNode }) {
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
                <header className="border-b border-gray-200 p-4">
                    <span className="text-sm text-gray-500">RicozPortfolio Frontend — Phase 1 scaffold</span>
                </header>
                <main className="flex-1 p-6">{children ?? <Outlet />}</main>
            </div>
        </div>
    )
}