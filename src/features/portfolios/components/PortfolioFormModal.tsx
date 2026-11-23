import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { CreatePortfolioPayload, PortfolioSummary } from '../../../api/portfolios'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Textarea } from '../../../components/ui/Textarea'

const FORM_ID = 'portfolio-form'

const portfolioFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name cannot exceed 255 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters'),
})

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>

export interface PortfolioFormModalProps {
  isOpen: boolean
  /** `null` opens create mode; a portfolio opens edit mode with prefilled values. */
  portfolio: PortfolioSummary | null
  onClose: () => void
  /**
   * Submits a create- or edit-shaped payload. In edit mode `description` is
   * omitted when unchanged, so the backend preserves the existing value.
   */
  onSubmit: (payload: CreatePortfolioPayload) => Promise<void>
}

/**
 * Create/edit modal for portfolios.
 *
 * Mirrors the backend limits (name 1-255, description up to 5000), validates
 * with React Hook Form register rules plus a final Zod `safeParse`, and keeps
 * the user inside the modal when the server rejects the request.
 */
export function PortfolioFormModal({
  isOpen,
  portfolio,
  onClose,
  onSubmit,
}: PortfolioFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<PortfolioFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (!isOpen) return

    reset({
      name: portfolio?.name ?? '',
      description: portfolio?.description ?? '',
    })
  }, [isOpen, portfolio, reset])

  const handleClose = () => {
    setServerError(null)
    onClose()
  }

  const handleFormSubmit = async (values: PortfolioFormValues) => {
    setServerError(null)

    const parsed = portfolioFormSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (field === 'name' || field === 'description') {
          setError(field, { type: 'validation', message: issue.message })
        }
      })
      return
    }

    const name = parsed.data.name
    const description = parsed.data.description

    let payload: CreatePortfolioPayload = {
      name,
      description: description || null,
    }

    if (portfolio) {
      const originalDescription = (portfolio.description ?? '').trim()

      // Always send the name; send description only when it changed so an
      // unchanged value is preserved by the backend.
      payload = { name }
      if (description !== originalDescription) {
        payload.description = description || null
      }
    }

    try {
      await onSubmit(payload)
      reset()
      handleClose()
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to save the portfolio. Please try again.',
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isSubmitting}
      title={portfolio ? 'Edit portfolio' : 'New portfolio'}
      description={
        portfolio
          ? 'Update the portfolio name and description.'
          : 'Create a portfolio to group related projects.'
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {portfolio ? 'Save changes' : 'Create portfolio'}
          </Button>
        </div>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
        noValidate
      >
        {serverError && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            {serverError}
          </div>
        )}

        <Input
          id="portfolio-name"
          label="Name (required)"
          placeholder="e.g. Digital Transformation"
          error={errors.name?.message}
          aria-required="true"
          {...register('name', {
            required: 'Name is required',
            maxLength: {
              value: 255,
              message: 'Name cannot exceed 255 characters',
            },
            validate: (value) => value.trim().length > 0 || 'Name is required',
          })}
        />

        <Textarea
          id="portfolio-description"
          label="Description (optional)"
          placeholder="Describe the portfolio's scope and intended outcomes..."
          rows={5}
          hint="Up to 5,000 characters."
          error={errors.description?.message}
          {...register('description', {
            maxLength: {
              value: 5000,
              message: 'Description cannot exceed 5000 characters',
            },
          })}
        />
      </form>
    </Modal>
  )
}
