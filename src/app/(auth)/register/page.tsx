'use client'

/**
 * Next.js register page (/register).
 *
 * Implements Phase 5 Visual Redesign matching Doc/figma-visual-spec.md §6 & §7:
 * - 2-col layout:
 *   - Left: Dark story panel (`var(--nav)` background, white text, 3-step registration progress
 *     visualization, compass brand, and trust features).
 *   - Right: Centered form card (`width: min(450px, 100%)`).
 * - Fixed top-right ThemeToggle.
 * - Form styling uses approved UI tokens: Input, Button, error states.
 * - Preserves existing authentication model:
 *   - In-memory access token (setAccessToken).
 *   - httpOnly refresh cookie.
 *   - AuthContext setSession.
 *   - Backend error contract display (409 conflict vs generic error).
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getMe, register as registerUser } from '../../../api/auth'
import { setAccessToken } from '../../../api/client'
import { useAuth, type AuthUser } from '../../../auth/AuthContext'
import { ThemeToggle } from '../../../components/theme/ThemeToggle'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  organization_name: z.string().trim().min(1, 'Organization name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const REGISTRATION_STEPS = [
  {
    step: '1',
    title: 'Create Account',
    description: 'Provide your name, work email, and set your secure password.',
    status: 'current',
  },
  {
    step: '2',
    title: 'Organization Setup',
    description: 'Set up isolated tenant workspace and strategic taxonomies.',
    status: 'upcoming',
  },
  {
    step: '3',
    title: 'Strategic Onboarding',
    description: 'Configure goals, invite leaders, and start intake flows.',
    status: 'upcoming',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      organization_name: '',
      password: '',
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null)

    const result = registerSchema.safeParse(data)
    if (!result.success) {
      setServerError(result.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      const tokenResponse = await registerUser({
        email: result.data.email,
        password: result.data.password,
        name: result.data.name,
        organization_name: result.data.organization_name,
      })

      // Store access token in memory — never in localStorage/sessionStorage
      setAccessToken(tokenResponse.access_token)

      const me = await getMe()

      setSession(
        {
          id: me.id,
          email: me.email,
          name: me.name,
          organization_id: me.organization_id,
          roles: me.roles as AuthUser['roles'],
        },
        tokenResponse.access_token,
      )

      router.replace('/')
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string }
      if (error.status === 409) {
        setServerError(error.message || 'An account with this email already exists.')
      } else {
        setServerError(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="relative flex min-h-screen w-full bg-[var(--canvas)]">
      {/* Top-right floating Theme Toggle */}
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <div className="grid w-full grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Story Panel — hidden on small mobile, visible on lg+ */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--nav)] p-10 text-white lg:flex lg:p-14">
          {/* Decorative 500px radial circle/gradient */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, var(--primary) 0%, rgba(21,41,35,0) 70%)',
            }}
            aria-hidden="true"
          />

          {/* Brand header */}
          <div className="relative z-10 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--primary)] text-white shadow-sm transition-transform group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                RicozPortfolio
              </span>
            </Link>
          </div>

          {/* 3-Step Registration Journey */}
          <div className="relative z-10 my-auto max-w-lg space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a8d5c9]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                New Organization Setup
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Get started in minutes with enterprise-grade PPM.
              </h1>
            </div>

            <div className="space-y-5">
              {REGISTRATION_STEPS.map((item) => (
                <div key={item.step} className="flex items-start gap-3.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.status === 'current'
                        ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary-ring)]'
                        : 'border border-white/20 bg-white/5 text-[#aebeb7]'
                    }`}
                  >
                    {item.step}
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <p
                      className={`text-sm font-bold ${
                        item.status === 'current' ? 'text-white' : 'text-[#aebeb7]'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-[#8ca399] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-[#c3d4cd]">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <svg className="h-4 w-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Strict Multi-Tenant Isolation
              </div>
              Your data is completely compartmentalized by organization ID, enforced at the API database level.
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 text-xs text-[#849890]">
            © {new Date().getFullYear()} RicozPortfolio SaaS. Enterprise Portfolio System.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-[450px] space-y-6">
            {/* Mobile-only brand mark */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--primary)] text-white">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-[var(--ink)]">
                RicozPortfolio
              </span>
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                Create an organization
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[var(--primary)] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[var(--danger-bg)] p-3 text-xs font-semibold text-[var(--danger)]"
              >
                {serverError}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <Input
                id="name"
                type="text"
                label="Full Name"
                placeholder="Jane Doe"
                autoComplete="name"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Full name is required',
                })}
              />

              <Input
                id="email"
                type="email"
                label="Email address"
                placeholder="jane@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  validate: (val) => {
                    const res = z.string().email().safeParse(val)
                    return res.success ? true : 'Invalid email address'
                  },
                })}
              />

              <Input
                id="organization_name"
                type="text"
                label="Organization Name"
                placeholder="Acme Enterprise"
                autoComplete="organization"
                error={errors.organization_name?.message}
                {...register('organization_name', {
                  required: 'Organization name is required',
                })}
              />

              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password must be at least 8 characters',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="w-full text-xs font-bold"
                >
                  {isSubmitting ? 'Creating account...' : 'Create organization account'}
                </Button>
              </div>
            </form>

            <div className="border-t border-[var(--border)] pt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
