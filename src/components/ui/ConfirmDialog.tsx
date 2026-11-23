import React, { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  isOpen: boolean
  /** Dialog title. Rendered by `Modal` as the accessible dialog label. */
  title: React.ReactNode
  /** Dialog description. Rendered by `Modal` as the accessible description. */
  description: React.ReactNode
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string
  /** Confirm handler. May return a promise so the dialog can show pending/error states. */
  onConfirm: () => void | Promise<void>
  /** Cancel handler. Also used by Escape, the backdrop, and the close button. */
  onCancel: () => void
  /** External pending override, for example from a React Query mutation. */
  isLoading?: boolean
  /** External error override. When set, it takes precedence over internal errors. */
  error?: string | null
  /** Confirm variant. Defaults to `danger` for destructive actions. */
  variant?: 'danger' | 'primary'
  /** Optional extra content rendered above the error message. */
  children?: React.ReactNode
  /** Modal width override. */
  maxWidth?: string
}

/**
 * Reusable destructive confirmation dialog built on the shared `Modal`.
 *
 * Supports idle, pending, and error states. When `onConfirm` returns a promise,
 * the dialog tracks pending state and surfaces a thrown error without closing.
 * External `isLoading` and `error` props can drive the same states from a
 * mutation hook. Escape, the backdrop, the close button, and Cancel all call
 * `onCancel`; while pending, closing is blocked to avoid interrupting work.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
  variant = 'danger',
  children,
  maxWidth,
}: ConfirmDialogProps) {
  const [internalPending, setInternalPending] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const isPending = isLoading || internalPending
  const displayedError = error ?? internalError

  const handleCancel = () => {
    if (isPending) return
    setInternalPending(false)
    setInternalError(null)
    onCancel()
  }

  const handleConfirm = async () => {
    if (isPending) return
    setInternalError(null)

    try {
      setInternalPending(true)
      await onConfirm()
    } catch (err) {
      setInternalError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setInternalPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      disableClose={isPending}
      title={title}
      description={description}
      maxWidth={maxWidth}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
            aria-disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isPending}
            disabled={isPending}
            aria-disabled={isPending}
            aria-busy={isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
      {displayedError && (
        <div
          role="alert"
          className="mt-3 rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
        >
          {displayedError}
        </div>
      )}
    </Modal>
  )
}
