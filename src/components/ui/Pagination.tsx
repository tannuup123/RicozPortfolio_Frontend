import React from 'react'
import { Button } from './Button'

export interface PaginationProps {
  /** Current page number, 1-based. */
  page: number
  /** Page size. Defaults to 20. */
  pageSize?: number
  /** Total number of items across all pages. */
  total: number
  /** Called with the next 1-based page number. */
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Accessible previous/next pagination with a visible range summary.
 *
 * The range text is announced through `aria-live="polite"`, and the controls
 * are real buttons disabled at the first/last page boundaries.
 */
export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ page, pageSize = 20, total, onPageChange, className = '' }, ref) => {
    // 1. Sanitize total: must be a non-negative finite integer
    const safeTotal =
      typeof total === 'number' && Number.isFinite(total) && !Number.isNaN(total)
        ? Math.max(0, Math.floor(total))
        : 0

    // 2. Sanitize pageSize: must be a positive finite integer, default 20, min 1
    const rawPageSize =
      typeof pageSize === 'number' && Number.isFinite(pageSize) && !Number.isNaN(pageSize)
        ? Math.floor(pageSize)
        : 20
    const safePageSize = Math.max(1, rawPageSize)

    // 3. Compute safeTotalPages
    const safeTotalPages =
      safeTotal === 0 ? 1 : Math.max(1, Math.ceil(safeTotal / safePageSize))

    // 4. Sanitize page: must be a finite integer clamped between 1 and safeTotalPages
    const rawPage =
      typeof page === 'number' && Number.isFinite(page) && !Number.isNaN(page)
        ? Math.floor(page)
        : 1
    const safeCurrentPage = Math.min(Math.max(1, rawPage), safeTotalPages)

    // 5. Compute range boundaries
    const rangeStart = safeTotal === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1
    const rangeEnd = Math.min(safeCurrentPage * safePageSize, safeTotal)
    const rangeText =
      safeTotal === 0 ? 'No items' : `Showing ${rangeStart}–${rangeEnd} of ${safeTotal}`

    const isFirstPage = safeCurrentPage <= 1
    const isLastPage = safeCurrentPage >= safeTotalPages

    const handlePageChange = (targetPage: number) => {
      if (
        typeof targetPage !== 'number' ||
        Number.isNaN(targetPage) ||
        !Number.isFinite(targetPage)
      ) {
        return
      }
      const clampedPage = Math.min(Math.max(1, Math.floor(targetPage)), safeTotalPages)
      if (clampedPage !== safeCurrentPage) {
        onPageChange(clampedPage)
      }
    }

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
      >
        <p className="text-xs text-[var(--ink-soft)]" aria-live="polite">
          {rangeText}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={isFirstPage}
            aria-label="Go to previous page"
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={isLastPage}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </div>
      </nav>
    )
  },
)

Pagination.displayName = 'Pagination'
