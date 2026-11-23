import React, { useEffect, useRef } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  className?: string
  /**
   * When true, disables closing the modal via Escape, backdrop click, or the header close button.
   * Useful when an async operation (such as deletion or saving) is in progress.
   */
  disableClose?: boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ')

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  )

  return elements.filter((el) => {
    // Exclude disabled or aria-disabled elements
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
      return false
    }
    // Exclude hidden elements or elements marked aria-hidden
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') {
      return false
    }
    // Exclude elements styled as display: none or visibility: hidden
    if (el.style.display === 'none' || el.style.visibility === 'hidden') {
      return false
    }
    // Check closest hidden ancestors
    if (el.closest('[hidden], [aria-hidden="true"]')) {
      return false
    }
    // Check visibility via checkVisibility if supported by browser/runtime
    if (typeof el.checkVisibility === 'function') {
      try {
        return el.checkVisibility({ checkVisibilityCSS: true })
      } catch {
        return el.checkVisibility()
      }
    }
    return true
  })
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-[530px]',
  className = '',
  disableClose = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const disableCloseRef = useRef(disableClose)

  // Keep callback and flag refs synchronized without triggering focus churn
  useEffect(() => {
    onCloseRef.current = onClose
    disableCloseRef.current = disableClose
  })

  // Escape key handler, focus trap, and focus restore on open/close boundary only
  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (!disableCloseRef.current) {
          onCloseRef.current?.()
        }
        return
      }

      // Tab trap inside modal
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current)
        if (focusableElements.length === 0) {
          event.preventDefault()
          modalRef.current.focus()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === modalRef.current ||
            !modalRef.current.contains(document.activeElement)
          ) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
          ) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus first focusable element or modal container
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current)
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        } else {
          modalRef.current.focus()
        }
      }
    }, 50)

    // Lock scroll on background body
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 max-sm:items-end sm:p-4"
    >
      {/* Backdrop with blur & overlay token */}
      <div
        className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-[4px] transition-opacity"
        onClick={disableClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal dialog box */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-10 flex w-full flex-col overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-lg)] transition-all duration-180 focus:outline-hidden ${maxWidth} rounded-t-[18px] sm:rounded-[18px] border border-[var(--border)] max-sm:max-h-[85vh] max-sm:rounded-b-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-[var(--border)] px-5.5 pt-5 pb-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-base font-bold text-[var(--ink)] tracking-[-0.03em]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-xs text-[var(--ink-soft)]"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={disableClose ? undefined : onClose}
              disabled={disableClose}
              aria-disabled={disableClose ? 'true' : undefined}
              aria-label="Close dialog"
              className={`ml-4 -mr-1 -mt-1 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--focus-ring)] ${
                disableClose
                  ? 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[var(--muted)]'
                  : ''
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-5.5 py-5 text-xs text-[var(--ink-soft)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-5.5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
