'use client'

/**
 * LandingPage — Public marketing landing page for unauthenticated visitors at /.
 *
 * Implements specifications from Doc/figma-visual-spec.md §7:
 * - Floating/frosted header (72px, radius 15px, frosted glass, navigation links + Sign in / Register CTAs + ThemeToggle)
 * - Hero section (min-height 690px, Manrope typography, headline clamp(45px, 5.2vw, 76px), weight 750, tracking -0.065em)
 *   - Visual stage with 3D perspective window (rotateY(-4deg) rotateX(1deg))
 *   - Floating approval card (-24px left, 45px bottom)
 *   - Floating health card (-20px right, 24px top)
 * - Trust strip with var(--marketing-secondary) text at full opacity (no grey-out)
 * - Outcome grid (3 columns, featured center card with var(--nav) bg and translateY(-18px))
 * - Feature bento section (1.25fr .75fr bento grid layout)
 * - Security band with var(--nav) background and 24px border-radius
 * - Testimonial section (centered blockquote clamp(22px, 3vw, 35px))
 * - Final Call to Action (CTA) with var(--primary) background and primary button
 */

import Link from 'next/link'
import { ThemeToggle } from '../../components/theme/ThemeToggle'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] selection:bg-[var(--primary)] selection:text-[var(--on-primary)]">
      {/* 1. Floating Frosted Marketing Header */}
      <header className="sticky top-4 z-40 mx-auto max-w-[1360px] px-4">
        <div className="flex h-[72px] items-center justify-between rounded-[15px] border border-[var(--border)] bg-[var(--topbar-bg)] px-6 shadow-[var(--shadow)] backdrop-blur-[14px]">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[var(--primary)] text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--ink)]">RicozPortfolio</span>
              <span className="hidden text-[10px] font-bold text-[var(--primary)] sm:inline ml-2 uppercase tracking-wider">
                Enterprise PPM
              </span>
            </div>
          </Link>

          {/* Marketing Navigation Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-xs font-semibold text-[var(--marketing-secondary)] hover:text-[var(--primary)] transition-colors">
              Platform
            </a>
            <a href="#outcomes" className="text-xs font-semibold text-[var(--marketing-secondary)] hover:text-[var(--primary)] transition-colors">
              Outcomes
            </a>
            <a href="#security" className="text-xs font-semibold text-[var(--marketing-secondary)] hover:text-[var(--primary)] transition-colors">
              Security
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="h-[38px] w-[38px]" />
            <Link href="/login">
              <Button variant="ghost" size="md">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="mx-auto max-w-[1360px] px-4 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left Column: Headline and Call-to-actions */}
          <div className="flex flex-col items-start text-left">
            <Badge tone="success" className="mb-4">
              Strategic Portfolio Management
            </Badge>
            <h1 className="text-[clamp(45px,5.2vw,76px)] font-[750] leading-[1.08] tracking-[-0.065em] text-[var(--ink)]">
              From strategic vision to delivered impact.
            </h1>
            <p className="mt-6 max-w-[540px] text-sm md:text-base leading-relaxed text-[var(--marketing-secondary)]">
              Connect organizational objectives directly to intake, approvals, and portfolio execution. Eliminate disconnected spreadsheets with unified enterprise governance.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button variant="primary" size="lg" className="min-w-[160px]">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Explore Live Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[11px] font-semibold text-[var(--marketing-muted)]">
              ✓ Multi-tenant architecture &bull; Role-based access control &bull; In-memory security
            </p>
          </div>

          {/* Right Column: Visual Stage with 3D perspective window & floating cards */}
          <div className="relative flex items-center justify-center [perspective:1200px]">
            {/* Perspective Window */}
            <div className="w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] transition-transform duration-500 lg:[transform:rotateY(-4deg)_rotateX(1deg)]">
              {/* Fake Window Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--danger)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--warning)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--success)]" />
                  <span className="ml-3 text-[11px] font-bold text-[var(--muted)]">Portfolio Control Center</span>
                </div>
                <Badge tone="neutral">Real-time Sync</Badge>
              </div>

              {/* Sample Metric Overview */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[11px] bg-[var(--surface-subtle)] p-3">
                  <div className="text-[9px] font-bold text-[var(--muted)] uppercase">Active Goals</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">14</div>
                </div>
                <div className="rounded-[11px] bg-[var(--surface-subtle)] p-3">
                  <div className="text-[9px] font-bold text-[var(--muted)] uppercase">Pipeline Ideas</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">38</div>
                </div>
                <div className="rounded-[11px] bg-[var(--surface-teal)] p-3">
                  <div className="text-[9px] font-bold text-[var(--primary)] uppercase">Net ROI</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-[var(--primary)]">340%</div>
                </div>
              </div>

              {/* Pipeline List Sample */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-[9px] border border-[var(--border)] p-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">NextGen Customer Portal</div>
                    <div className="text-[10px] text-[var(--muted)]">Strategic Alignment: Cloud Expansion</div>
                  </div>
                  <Badge tone="success">Approved</Badge>
                </div>
                <div className="flex items-center justify-between rounded-[9px] border border-[var(--border)] p-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">Automated Financial Reconciliation</div>
                    <div className="text-[10px] text-[var(--muted)]">Strategic Alignment: Operational Excellence</div>
                  </div>
                  <Badge tone="warning">Under Review</Badge>
                </div>
              </div>
            </div>

            {/* Floating Approval Card (-24px left, 45px bottom) */}
            <div className="absolute -bottom-8 -left-6 z-20 hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)] font-black text-sm">
                  ✓
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--ink)]">Business Case Approved</div>
                  <div className="text-[9px] text-[var(--muted)]">Idea converted to execution project</div>
                </div>
              </div>
            </div>

            {/* Floating Health Card (-20px right, 24px top) */}
            <div className="absolute -top-6 -right-6 z-20 hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-teal)] text-[var(--primary)] font-bold text-xs">
                  88%
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--ink)]">Portfolio Health Index</div>
                  <div className="text-[9px] text-[var(--primary)] font-semibold">On Target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Strip */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-subtle)] py-8">
        <div className="mx-auto max-w-[1360px] px-4 text-center">
          <p className="text-[11px] font-bold tracking-wider text-[var(--marketing-secondary)] uppercase">
            Trusted by enterprise portfolio managers and PMO teams worldwide
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-100 font-extrabold text-[var(--marketing-secondary)] text-sm md:text-base tracking-tight">
            <span>MERIDIAN GLOBAL</span>
            <span>APEX CAPITAL</span>
            <span>STRATA TECHNOLOGIES</span>
            <span>VANTAGE ENTERPRISE</span>
            <span>SYNERGY LOGISTICS</span>
          </div>
        </div>
      </section>

      {/* 4. Outcome Cards Grid (3 Columns, Featured Center Card with var(--nav) and translateY(-18px)) */}
      <section id="outcomes" className="mx-auto max-w-[1360px] px-4 py-24">
        <div className="text-center">
          <Badge tone="info" className="mb-3">
            Proven Results
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
            Measurable portfolio governance outcomes
          </h2>
          <p className="mt-3 text-sm text-[var(--marketing-secondary)] max-w-[620px] mx-auto">
            Bridge the gap between strategic intent and project delivery with unified lifecycle tracking.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 items-stretch">
          {/* Outcome 1 */}
          <Card className="flex flex-col justify-between p-8">
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-[var(--primary)]">3.2x</div>
              <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">Faster Decision Velocity</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--marketing-secondary)]">
                Accelerate idea-to-project conversions with structured business case attachments and transparent approval workflows.
              </p>
            </div>
            <div className="mt-6 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
              Intake Governance
            </div>
          </Card>

          {/* Outcome 2: Featured Center Card (var(--nav) bg + translateY(-18px)) */}
          <div className="flex flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--nav)] p-8 text-white shadow-[var(--shadow-lg)] md:-translate-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-extrabold tracking-tight text-[#74b6a6]">100%</div>
                <Badge tone="neutral" className="bg-white/10 text-white border-0">
                  Core Mandate
                </Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Strategic Alignment</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#aebeb7]">
                Ensure every approved initiative directly ties to an active strategic goal. Never waste capital on unaligned pet projects again.
              </p>
            </div>
            <div className="mt-6 text-[10px] font-bold text-[#75b7a8] uppercase tracking-wider">
              Capital Efficiency
            </div>
          </div>

          {/* Outcome 3 */}
          <Card className="flex flex-col justify-between p-8">
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-[var(--primary)]">45%</div>
              <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">Reduced PMO Overhead</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--marketing-secondary)]">
                Eliminate manual status collection. Real-time portfolio summaries and automated health signals keep leadership informed.
              </p>
            </div>
            <div className="mt-6 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
              Executive Clarity
            </div>
          </Card>
        </div>
      </section>

      {/* 5. Feature Bento Section (1.25fr 0.75fr) */}
      <section id="features" className="mx-auto max-w-[1360px] px-4 py-16">
        <div className="mb-12 text-center md:text-left">
          <Badge tone="neutral" className="mb-3">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
            Purpose-built for enterprise portfolio mastery
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Bento Main Card */}
          <Card className="p-8">
            <Badge tone="success" className="mb-4">End-to-End Lifecycle</Badge>
            <h3 className="text-xl font-bold text-[var(--ink)]">Intake to Project Execution Seam</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--marketing-secondary)] max-w-[600px]">
              Capture ideas from across the enterprise, refine business cases with cost-benefit analysis, secure governance sign-offs, and seamlessly spin up execution projects.
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-[10px] bg-[var(--surface-subtle)] p-3">
                <span className="text-xs font-bold text-[var(--ink)]">1. Intake</span>
              </div>
              <div className="rounded-[10px] bg-[var(--surface-subtle)] p-3">
                <span className="text-xs font-bold text-[var(--ink)]">2. Business Case</span>
              </div>
              <div className="rounded-[10px] bg-[var(--surface-subtle)] p-3">
                <span className="text-xs font-bold text-[var(--ink)]">3. Approval</span>
              </div>
              <div className="rounded-[10px] bg-[var(--surface-teal)] p-3">
                <span className="text-xs font-bold text-[var(--primary)]">4. Conversion</span>
              </div>
            </div>
          </Card>

          {/* Bento Secondary Card */}
          <Card className="p-8 flex flex-col justify-between">
            <div>
              <Badge tone="warning" className="mb-4">Role-Based Access</Badge>
              <h3 className="text-xl font-bold text-[var(--ink)]">Enterprise RBAC</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--marketing-secondary)]">
                Four pre-configured roles ensure separation of duties: Org Admin, Portfolio Manager, Project Manager, and Team Member.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md bg-[var(--neutral-bg)] px-2 py-1 text-[9px] font-bold text-[var(--neutral-ink)] uppercase">Org Admin</span>
              <span className="rounded-md bg-[var(--neutral-bg)] px-2 py-1 text-[9px] font-bold text-[var(--neutral-ink)] uppercase">Portfolio Mgr</span>
              <span className="rounded-md bg-[var(--neutral-bg)] px-2 py-1 text-[9px] font-bold text-[var(--neutral-ink)] uppercase">Project Mgr</span>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. Security Band (var(--nav) bg, 24px border-radius) */}
      <section id="security" className="mx-auto max-w-[1360px] px-4 py-16">
        <div className="rounded-[24px] bg-[var(--nav)] p-8 md:p-14 text-white shadow-[var(--shadow-lg)]">
          <div className="max-w-[700px]">
            <Badge tone="neutral" className="bg-white/10 text-white border-0 mb-4">
              Security by Design
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Multi-tenant isolation and in-memory session protection
            </h2>
            <p className="mt-4 text-xs md:text-sm leading-relaxed text-[#aebeb7]">
              Built with rigorous multi-tenant data boundaries enforced at the PostgreSQL repository layer. Access tokens stay strictly in-memory — never saved to localStorage — with secure, httpOnly refresh rotation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#74b6a6] font-bold">✓</span>
                <span className="text-xs text-white">HttpOnly Cookie Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#74b6a6] font-bold">✓</span>
                <span className="text-xs text-white">Row-level Tenant Segregation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#74b6a6] font-bold">✓</span>
                <span className="text-xs text-white">OAuth 2.0 / JWT Standard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Centered Testimonial */}
      <section className="mx-auto max-w-[900px] px-4 py-20 text-center">
        <blockquote className="text-[clamp(22px,3vw,35px)] font-[750] leading-snug tracking-[-0.035em] text-[var(--ink)]">
          &ldquo;RicozPortfolio transformed our annual planning from an agonizing months-long spreadsheet exercise into continuous, strategy-aligned execution.&rdquo;
        </blockquote>
        <div className="mt-6 flex flex-col items-center">
          <div className="font-bold text-sm text-[var(--ink)]">Elena Rostova</div>
          <div className="text-xs text-[var(--marketing-secondary)]">VP of Enterprise Strategy, Strata Global</div>
        </div>
      </section>

      {/* 8. Final Call to Action (CTA) */}
      <section className="mx-auto max-w-[1360px] px-4 pb-24">
        <div className="rounded-[20px] bg-[var(--primary)] p-10 md:p-16 text-center text-white shadow-[var(--shadow-lg)]">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to unify your strategic portfolio?
          </h2>
          <p className="mt-3 text-sm text-white/80 max-w-[540px] mx-auto">
            Get started today. Experience enterprise-grade demand intake and goal management in minutes.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register">
              <button
                type="button"
                className="h-[44px] rounded-[var(--radius-sm)] bg-[var(--nav)] px-6 text-xs font-bold text-white shadow-md hover:bg-[#203b33] transition-colors"
              >
                Create Free Account
              </button>
            </Link>
            <Link href="/login">
              <button
                type="button"
                className="h-[44px] rounded-[var(--radius-sm)] border border-white/30 bg-transparent px-6 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                Sign In to Platform
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Marketing Footer */}
      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--marketing-muted)]">
        &copy; {new Date().getFullYear()} RicozPortfolio SaaS. All rights reserved. Built with Next.js App Router.
      </footer>
    </div>
  )
}
