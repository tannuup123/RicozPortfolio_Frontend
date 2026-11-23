import type { ElementType } from 'react'
import type { PortfolioSummary } from '../../../api/portfolios'
import { AppLink } from '../../../components/ui/AppLink'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export interface PortfolioCardProps {
  portfolio: PortfolioSummary
  /** Broad managers see Edit and Delete; other roles get a read-only card. */
  canManage: boolean
  /** Portfolio detail destination. */
  href: string
  /** Next.js `Link`, supplied by the route wrapper in the Next.js baseline. */
  LinkComponent?: ElementType
  onEdit: (portfolio: PortfolioSummary) => void
  onDelete: (portfolio: PortfolioSummary) => void
}

function formatCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Portfolio summary card for the `/portfolios` grid.
 *
 * Shows only fields present in `PortfolioResponse`. The list payload has no
 * owner or `project_count`, so no owner, health, progress, or project count is
 * rendered here.
 */
export function PortfolioCard({
  portfolio,
  canManage,
  href,
  LinkComponent,
  onEdit,
  onDelete,
}: PortfolioCardProps) {
  const description = portfolio.description?.trim()

  return (
    <Card
      className="flex h-full min-h-[310px] flex-col hover:-translate-y-0.5 hover:shadow-[0_18px_40px_color-mix(in_srgb,var(--ink)_14%,transparent)]"
      style={{ padding: 22 }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--on-primary)]"
          aria-hidden="true"
        >
          <svg
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2h7A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
            />
            <path strokeLinecap="round" d="M8.5 12.5h7M8.5 15.5h4.5" />
          </svg>
        </span>
        <Badge tone="neutral" showDot={false} className="shrink-0">
          Portfolio
        </Badge>
      </div>

      <h2 className="mt-4 text-[17px] leading-snug font-bold tracking-[-0.03em] text-[var(--ink)]">
        {portfolio.name}
      </h2>

      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--ink-soft)]">
        {description ? (
          description
        ) : (
          <span className="font-medium text-[var(--muted)]">No description</span>
        )}
      </p>

      <p className="mt-3 text-[10px] font-medium text-[var(--muted)]">
        Created {formatCreatedDate(portfolio.created_at)}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
        <AppLink
          to={href}
          LinkComponent={LinkComponent}
          aria-label={`View ${portfolio.name} portfolio`}
          className="inline-flex min-h-[32px] items-center rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--primary)] hover:underline focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-hidden"
        >
          View portfolio
        </AppLink>

        {canManage && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(portfolio)}
              aria-label={`Edit ${portfolio.name}`}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(portfolio)}
              aria-label={`Delete ${portfolio.name}`}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
