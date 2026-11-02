'use client'

/**
 * Next.js login page (/login).
 *
 * Implements Phase 5 Visual Redesign matching Doc/figma-visual-spec.md §6 & §7:
 * - 2-col layout:
 *   - Left: Dark story panel (`var(--nav)` background, white text, 500px decorative background glow/circle,
 *     compass brand, and strategic impact tagline).
 *   - Right: Centered form card (`width: min(370px, 100%)`).
 * - Fixed top-right ThemeToggle.
 * - Form styling uses approved UI tokens: Input, Button, error states.
 * - Preserves existing authentication model:
 *   - In-memory access token (setAccessToken).
 *   - httpOnly refresh cookie.
 *   - AuthContext setSession.
 *   - Backend error contract display.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getMe, login } from '../../../api/auth'
import { setAccessToken } from '../../../api/client'
import { useAuth, type AuthUser } from '../../../auth/AuthContext'
import { ThemeToggle } from '../../../components/theme/ThemeToggle'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null)

    const result = loginSchema.safeParse(data)
    if (!result.success) {
      setServerError(result.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    try {
      const tokenResponse = await login({
        email: result.data.email,
        password: result.data.password,
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
      if (error.status === 401) {
        setServerError('Invalid email or password.')
      } else {
        setServerError(error.message || 'An unexpected error occurred. Please try again.')
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

          {/* Central story hero */}
          <div className="relative z-10 my-auto max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a8d5c9]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              Strategic Portfolio Management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
              Turn high-level vision into verified enterprise execution.
            </h1>

            <p className="text-sm leading-relaxed text-[#c3d4cd]">
              Unify your initiatives from demand capture and business case evaluation to active portfolio execution and governance.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">100%</p>
                <p className="text-xs text-[#8ca399]">Auditable Governance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">Zero-Leak</p>
                <p className="text-xs text-[#8ca399]">Multi-Tenant Isolation</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 text-xs text-[#849890]">
            © {new Date().getFullYear()} RicozPortfolio SaaS. Enterprise Portfolio System.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-[370px] space-y-6">
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
                Sign in to RicozPortfolio
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                Or{' '}
                <Link
                  href="/register"
                  className="font-semibold text-[var(--primary)] hover:underline"
                >
                  create a new organization account
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
                id="email"
                type="email"
                label="Email address"
                placeholder="name@company.com"
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
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
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
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
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
