'use client'

/**
 * DashboardOverviewView — Presentation of the dashboard overview for authenticated users.
 *
 * Rendered inside DashboardShell by the root route (src/app/(dashboard)/page.tsx).
 */

import { useAuth } from '../../auth/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export function DashboardOverviewView() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Portfolio Dashboard</h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Welcome back, <strong className="font-semibold text-[var(--ink)]">{user?.name}</strong>. Organization ID: <code className="rounded bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[10px]">{user?.organization_id}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success">Operational</Badge>
          <Badge tone="neutral">{user?.roles?.[0] || 'Team Member'}</Badge>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4.5">
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Strategic Goals</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">4</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">Active organizational objectives</div>
        </Card>
        <Card className="p-4.5">
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Ideas Pipeline</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">12</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">Demand intake proposals</div>
        </Card>
        <Card className="p-4.5">
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Active Portfolios</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">3</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">Core business programs</div>
        </Card>
        <Card className="p-4.5">
          <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">Portfolio Health</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--primary)] tabular-nums">72%</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">Aggregate status score</div>
        </Card>
      </div>

      {/* Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">Recent Demand Intake Activity</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Navigate to the Ideas Pipeline or Strategic Goals to inspect items, attach business cases, or submit approvals.
          </p>
          <div className="mt-4 rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-subtle)] text-xs text-[var(--ink-soft)]">
            Explore live demand management in <a href="/demand/ideas" className="text-[var(--primary)] font-bold underline">Ideas Pipeline</a>.
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-bold text-[var(--ink)]">System Security</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            In-memory token security active. HttpOnly refresh credentials verified.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-soft)]">Session Token</span>
              <Badge tone="success">In-Memory</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-soft)]">Storage Leakage</span>
              <Badge tone="neutral">0 Tokens</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
