import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createProject,
  updateProject,
} from '../../../api/projects'
import type {
  CreateProjectPayload,
  ProjectStatus,
  ProjectSummary,
  UpdateProjectPayload,
} from '../../../api/projects'
import { getPortfolios } from '../../../api/portfolios'
import { useAuth } from '../../../auth/AuthContext'
import { canCreateProjects } from '../../../auth/roles'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'

const FORM_ID = 'project-form'
const PORTFOLIO_OPTIONS_LIMIT = 100

const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name cannot exceed 255 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters'),
  portfolio_id: z.string().trim().min(1, 'Portfolio is required'),
  status: z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

export interface ProjectFormModalProps {
  isOpen: boolean
  /** `null` opens create mode; a project opens edit mode with prefilled values. */
  project?: ProjectSummary | null
  /** Preselects a portfolio when creating from portfolio detail. */
  defaultPortfolioId?: string
  onClose: () => void
  /** Supplies router-aware navigation for post-create redirect. */
  onNavigate?: (path: string) => void
}

/**
 * Shared project create/edit modal.
 *
 * Create mode always produces a Planned project and omits the status field.
 * Edit mode requires an active portfolio and includes the current status.
 * Description is sent only when changed during edit, using `""` to clear it.
 */
export function ProjectFormModal({
  isOpen,
  project = null,
  defaultPortfolioId,
  onClose,
  onNavigate,
}: ProjectFormModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = project !== null
  const canCreate = canCreateProjects(user)
  const createBlocked = !isEditMode && !canCreate

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
  } = useForm<ProjectFormValues>({
    defaultValues: {
      name: '',
      description: '',
      portfolio_id: '',
      status: 'planned',
    },
  })

  const portfolioOptionsQuery = useQuery({
    queryKey: ['portfolios', 'options'],
    queryFn: () => getPortfolios({ limit: PORTFOLIO_OPTIONS_LIMIT }),
    enabled: isOpen,
  })

  const portfolioOptions = portfolioOptionsQuery.data?.items ?? []
  const currentPortfolioId = project?.portfolio_id ?? null
  const currentPortfolioIsUnavailable =
    currentPortfolioId !== null &&
    portfolioOptionsQuery.isSuccess &&
    !portfolioOptions.some((portfolio) => portfolio.id === currentPortfolioId)

  useEffect(() => {
    if (!isOpen) return

    reset({
      name: project?.name ?? '',
      description: project?.description ?? '',
      portfolio_id: project?.portfolio_id ?? defaultPortfolioId ?? '',
      status: project?.status ?? 'planned',
    })
  }, [isOpen, project, defaultPortfolioId, reset])

  // Ensure the preselected portfolio is applied once its option has loaded.
  // react-hook-form's reset can run before the async portfolio options arrive,
  // leaving the select visually empty even though the value was set.
  useEffect(() => {
    if (!isOpen || isEditMode) return
    if (!defaultPortfolioId) return
    if (!portfolioOptionsQuery.isSuccess) return
    setValue('portfolio_id', defaultPortfolioId)
  }, [
    isOpen,
    isEditMode,
    defaultPortfolioId,
    portfolioOptionsQuery.isSuccess,
    setValue,
  ])

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: (createdProject) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({
        queryKey: ['portfolio', createdProject.portfolio_id],
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string
      payload: UpdateProjectPayload
    }) => updateProject(projectId, payload),
    onSuccess: (updatedProject) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({
        queryKey: ['project', updatedProject.id],
      })

      if (project?.portfolio_id) {
        void queryClient.invalidateQueries({
          queryKey: ['portfolio', project.portfolio_id],
        })
      }
      if (
        updatedProject.portfolio_id &&
        updatedProject.portfolio_id !== project?.portfolio_id
      ) {
        void queryClient.invalidateQueries({
          queryKey: ['portfolio', updatedProject.portfolio_id],
        })
      }
    },
  })

  const isFormPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  const handleClose = () => {
    if (isFormPending) return
    setServerError(null)
    onClose()
  }

  const handleFormSubmit = async (values: ProjectFormValues) => {
    setServerError(null)

    const parsed = projectFormSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (
          field === 'name' ||
          field === 'description' ||
          field === 'portfolio_id' ||
          field === 'status'
        ) {
          setError(field, { type: 'validation', message: issue.message })
        }
      })
      return
    }

    if (!portfolioOptions.some((portfolio) => portfolio.id === parsed.data.portfolio_id)) {
      setError('portfolio_id', {
        type: 'validation',
        message: currentPortfolioIsUnavailable
          ? 'Select a replacement portfolio.'
          : 'Select a portfolio.',
      })
      return
    }

    try {
      if (project) {
        const description = parsed.data.description
        const originalDescription = (project.description ?? '').trim()
        const payload: UpdateProjectPayload = {
          name: parsed.data.name,
          status: parsed.data.status,
          portfolio_id: parsed.data.portfolio_id,
        }

        // Project PATCH treats null as "no change"; an empty string clears.
        if (description !== originalDescription) {
          payload.description = description
        }

        await updateMutation.mutateAsync({
          projectId: project.id,
          payload,
        })
        reset()
        onClose()
        return
      }

      if (createBlocked) {
        setServerError('You do not have permission to create projects.')
        return
      }

      const createdProject = await createMutation.mutateAsync({
        name: parsed.data.name,
        description: parsed.data.description || null,
        portfolio_id: parsed.data.portfolio_id,
      })
      reset()
      onClose()
      onNavigate?.(`/projects/${createdProject.id}`)
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to save the project. Please try again.',
      )
    }
  }

  const portfolioSelectOptions = [
    { value: '', label: 'Select a portfolio' },
    ...(currentPortfolioIsUnavailable && currentPortfolioId
      ? [
          {
            value: currentPortfolioId,
            label: 'Portfolio unavailable',
            disabled: true,
          },
        ]
      : []),
    ...portfolioOptions.map((portfolio) => ({
      value: portfolio.id,
      label: portfolio.name,
    })),
  ]

  const statusSelectOptions = PROJECT_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }))

  const isPortfolioOptionsUnavailable =
    portfolioOptionsQuery.isLoading || portfolioOptionsQuery.isError

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isFormPending}
      title={project ? 'Edit project' : 'New project'}
      description={
        project
          ? 'Update the project details, portfolio, and lifecycle status.'
          : 'Create a project inside a portfolio. New projects start in Planned status.'
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isFormPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            isLoading={isFormPending}
            disabled={
              isFormPending ||
              isPortfolioOptionsUnavailable ||
              createBlocked
            }
          >
            {project ? 'Save changes' : 'Create project'}
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
        {createBlocked && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            You do not have permission to create projects.
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            {serverError}
          </div>
        )}

        {portfolioOptionsQuery.isError && (
          <div
            role="alert"
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            <p>
              {portfolioOptionsQuery.error instanceof Error
                ? portfolioOptionsQuery.error.message
                : 'Unable to load portfolios.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={isFormPending}
              className="mt-2"
              onClick={() => {
                void portfolioOptionsQuery.refetch()
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <Input
          id="project-name"
          label="Name (required)"
          placeholder="e.g. Customer Portal Redesign"
          error={errors.name?.message}
          aria-required="true"
          disabled={isFormPending}
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
          id="project-description"
          label="Description (optional)"
          placeholder="Describe the project's scope and intended outcomes..."
          rows={4}
          hint="Up to 5,000 characters."
          error={errors.description?.message}
          disabled={isFormPending}
          {...register('description', {
            maxLength: {
              value: 5000,
              message: 'Description cannot exceed 5000 characters',
            },
          })}
        />

        <Select
          id="project-portfolio"
          label="Portfolio (required)"
          options={portfolioSelectOptions}
          error={errors.portfolio_id?.message}
          aria-required="true"
          disabled={isFormPending || portfolioOptionsQuery.isLoading}
          {...register('portfolio_id', {
            required: 'Portfolio is required',
            validate: (value) =>
              portfolioOptions.some((portfolio) => portfolio.id === value) ||
              'Select a portfolio',
          })}
        />

        {currentPortfolioIsUnavailable && (
          <p
            role="alert"
            className="text-[10px] font-medium text-[var(--warning)]"
          >
            Portfolio unavailable — select a new portfolio.
          </p>
        )}

        {project && (
          <Select
            id="project-status"
            label="Status (required)"
            options={statusSelectOptions}
            error={errors.status?.message}
            aria-required="true"
            disabled={isFormPending}
            {...register('status', {
              required: 'Status is required',
            })}
          />
        )}
      </form>
    </Modal>
  )
}
