'use client'

/**
 * DashboardShell — Modern application shell for authenticated Next.js dashboard routes.
 *
 * Implements specifications from Doc/figma-visual-spec.md §6:
 * - AppShell Sidebar:
 *   - Width: 264px, background: var(--nav) (#152923 light / #111718 dark)
 *   - Monogram / Org badge, logo Compass icon with teal accent
 *   - Nav links with active indicator (3px inset #74b6a6, bg #29473e, text #ffffff)
 *   - Portfolio health mini-card note
 *   - User profile foot with avatar and role
 *   - Responsive mobile drawer behavior for screens <= 820px
 * - Topbar:
 *   - Height: 68px, sticky top, z-20, frosted glass var(--topbar-bg)
 *   - Global search input (width: min(420px, 38vw))
 *   - Mounted ThemeToggle
 *   - Profile trigger & dropdown with sign-out action
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, type ReactNode } from 'react'

import { logout } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Avatar } from '../ui/Avatar'

interface NavItem {
  href: string
  label: string
  aliasMatch?: string[]
  icon: React.ReactNode
  badgeCount?: number
}

export interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, setSession } = useAuth()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setSession(null, null)
      router.replace('/login')
    }
  }

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Overview',
      icon: (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      href: '/strategy/goals',
      label: 'Strategic Goals',
      aliasMatch: ['/goals', '/strategy/goals'],
      icon: (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      href: '/demand/ideas',
      label: 'Ideas Pipeline',
      aliasMatch: ['/ideas', '/demand/ideas'],
      icon: (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      href: '/portfolios',
      label: 'Portfolios',
      icon: (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      href: '/users',
      label: 'Team Members',
      icon: (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ]

  const isLinkActive = (item: NavItem) => {
    if (item.href === '/') {
      return pathname === '/'
    }
    if (item.aliasMatch) {
      return item.aliasMatch.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`))
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-[22px_16px_16px] text-white">
      <div>
        {/* Logo and Brand Mark */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[var(--primary)] text-white shadow-xs">
            <svg className="h-[19px] w-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">RicozPortfolio</div>
            <div className="text-[10px] font-semibold text-[#75b7a8]">Enterprise PPM</div>
          </div>
        </div>

        {/* Org Switch / Monogram */}
        <div className="mb-6 flex items-center justify-between rounded-[9px] border border-white/10 bg-white/[0.045] p-[10px_11px]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[31px] w-[31px] items-center justify-center rounded-[8px] bg-[#d9aa64] text-[11px] font-black text-[#27362f]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RP'}
            </div>
            <div className="overflow-hidden">
              <div className="truncate text-xs font-bold text-white">Main Organization</div>
              <div className="text-[9px] font-semibold text-[#8fa39b]">Production Suite</div>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-2.5 pb-2 text-[9px] font-bold tracking-[0.13em] text-[#7e948b] uppercase">
          Navigation
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isLinkActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex min-h-[42px] items-center gap-2.5 rounded-[9px] px-3 text-[13px] font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-[#29473e] text-white shadow-[inset_3px_0_0_#74b6a6]'
                    : 'text-[#aebeb7] hover:bg-[#203b33] hover:text-white'
                }`}
              >
                <span className={`shrink-0 ${active ? 'text-white' : 'text-[#7e948b] group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badgeCount !== undefined && (
                  <span className="rounded-[10px] bg-[#34564c] px-2 py-0.5 text-[9px] font-bold text-[#aad3c8]">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Area: Health Note + User foot */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Portfolio Health mini-card */}
        <div className="rounded-[11px] border border-white/5 bg-[#1a2d27] p-3 text-white">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#8fa39b]">
            <span>Portfolio Health</span>
            <span className="text-[#aad3c8]">72%</span>
          </div>
          <div className="mt-2 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#70b09f]" style={{ width: '72%' }} />
          </div>
        </div>

        {/* User Foot with Avatar */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || 'User'} size="md" className="border border-white/20" />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold text-white">
                {user?.name || 'Authorized User'}
              </div>
              <div className="truncate text-[9px] font-semibold text-[#849890] uppercase tracking-wide">
                {user?.roles?.[0] || 'Team Member'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--scrim)] backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar (Fixed 264px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] bg-[var(--nav)] transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main Content Area (Offset by 264px on lg) */}
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        {/* Sticky Frosted Topbar (68px) */}
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[var(--border)] bg-[var(--topbar-bg)] px-4 sm:px-9 backdrop-blur-[14px]">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--ink-soft)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Global Search Bar */}
            <div className="relative hidden sm:block w-[min(380px,35vw)]">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search ideas, goals, portfolios..."
                className="h-[38px] w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-transparent pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary-ring)]"
              />
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle className="h-[38px] w-[38px]" />

            {/* Notification Bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-label="User profile menu"
                className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus:outline-hidden focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                <Avatar name={user?.name || 'User'} size="sm" />
                <span className="hidden md:inline max-w-[120px] truncate text-[11px] font-bold">
                  {user?.name || 'Account'}
                </span>
                <svg className="h-3 w-3 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-[240px] rounded-[13px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)] z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="border-b border-[var(--border)] p-2">
                    <p className="truncate text-xs font-bold text-[var(--ink)]">{user?.name || 'User'}</p>
                    <p className="truncate text-[10px] text-[var(--muted)]">{user?.email || ''}</p>
                    <p className="mt-1 inline-block rounded-sm bg-[var(--neutral-bg)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--neutral-ink)] uppercase">
                      {user?.roles?.[0] || 'Member'}
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-7 md:p-9 max-w-[1500px]">
          {children}
        </main>
      </div>
    </div>
  )
}
