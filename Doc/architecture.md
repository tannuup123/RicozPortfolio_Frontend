# RicozPortfolio — Architecture

**Status:** Approved for MVP implementation.
**Companion docs:** `mvp-requirements.md` (what to build), `implementation-plan.md` (how/when to build it, phase-by-phase).
**Style used below:** `[DECIDED]` = confirmed in prior discussion. `[PROPOSED]` = a reasonable default not explicitly discussed; open to change without affecting scope.

---

## 1. System Overview

RicozPortfolio is a multi-tenant Project Portfolio Management (PPM) SaaS covering the lifecycle: **Strategy → Demand/Ideas → Business Case → Approval → Portfolio Planning → Project Execution → Monitoring (Budget/Risk) → Dashboards**. `[DECIDED]`

**Deployment topology `[DECIDED]`:**

```
Browser
   │  HTTPS
   ▼
Vercel (Frontend)                RicozPortfolio-Frontend repo
   │  fetch(credentials:'include')
   ▼
Railway / Render (Backend)       RicozPortfolio-Backend repo
   │  FastAPI + Uvicorn, modular monolith
   ├──▶ Managed PostgreSQL (PaaS-provided)
   └──▶ Redis (provisioned, idle for MVP)
```

**Two independent repositories `[DECIDED]`:**
- `RicozPortfolio-Backend` — FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic v2, JWT, Redis, Celery (scaffolded, unused), Pytest.
- `RicozPortfolio-Frontend` — React, TypeScript, Vite, Tailwind CSS (current baseline; migrating to Next.js App Router as target frontend architecture).

Each is independently version-controlled, tested, built, and deployed. Docker Compose is kept in both for local development and as a portability path to any host beyond the chosen PaaS. `[DECIDED]`

**Architectural style `[DECIDED]`:** modular monolith on the backend — one deployable FastAPI service, internally organized into clearly bounded modules (auth, organizations, strategy, demand, business-cases, approvals, portfolios, projects, tasks, milestones, risks, budgets, dashboards). Not microservices: the MVP's traffic and team size don't justify that cost, and a modular monolith keeps a clean extraction path if a module ever needs to split out later.

---

## 2. Repository Structures

### `RicozPortfolio-Backend`
```
RicozPortfolio-Backend/
├── app/
│   ├── api/v1/               # one router module per bounded module
│   │   ├── auth.py
│   │   ├── organizations.py
│   │   ├── users.py
│   │   ├── strategic_goals.py
│   │   ├── ideas.py
│   │   ├── business_cases.py
│   │   ├── approvals.py
│   │   ├── portfolios.py
│   │   ├── projects.py
│   │   ├── tasks.py
│   │   ├── milestones.py
│   │   ├── risks.py
│   │   ├── budgets.py
│   │   └── dashboards.py
│   ├── core/
│   │   ├── config.py          # pydantic-settings
│   │   ├── security.py        # hashing, JWT, cookie helpers
│   │   ├── deps.py            # get_db, get_current_user, require_role
│   │   └── exceptions.py      # domain exceptions + global handler
│   ├── models/                # SQLAlchemy 2.0 declarative models, one file per aggregate
│   ├── schemas/                # Pydantic v2 request/response models
│   ├── services/                # business logic, one file per module
│   ├── repositories/            # SQLAlchemy queries, always org-scoped
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── tasks/                   # Celery task scaffold — empty for MVP
│   └── main.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── unit/
│   ├── api/
│   └── conftest.py
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── alembic.ini
├── pyproject.toml
├── .github/workflows/ci.yml
├── Doc/
│   ├── architecture.md
│   ├── mvp-requirements.md
│   └── implementation-plan.md
└── README.md
```

### `RicozPortfolio-Frontend`

**Current Baseline (React + Vite):**
```
RicozPortfolio-Frontend/
├── src/
│   ├── api/                  # typed client, one module per resource
│   ├── auth/                 # AuthContext, useAuth, ProtectedRoute, bootstrapAuth
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   ├── strategy/
│   │   ├── demand/
│   │   ├── portfolios/
│   │   ├── projects/
│   │   └── users/
│   ├── routes.tsx
│   └── main.tsx
├── Dockerfile
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
├── .github/workflows/ci.yml
├── Doc/                       # same three docs, kept in sync for frontend context
│   ├── architecture.md
│   ├── mvp-requirements.md
│   └── implementation-plan.md
└── README.md
```

**Target Architecture (Next.js App Router — Planned Migration):**
```
RicozPortfolio-Frontend/
├── src/                      # (or root app/)
│   ├── app/
│   │   ├── (auth)/           # Route group for unauthenticated flows
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/      # Route group for authenticated protected layout
│   │   │   ├── layout.tsx    # AppShell + Auth guard
│   │   │   ├── page.tsx      # Dashboard (org home)
│   │   │   ├── strategy/
│   │   │   │   └── goals/
│   │   │   │       └── page.tsx
│   │   │   ├── goals/        # Route alias / redirect to strategy/goals
│   │   │   │   └── page.tsx
│   │   │   ├── demand/
│   │   │   │   └── ideas/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [ideaId]/
│   │   │   │           └── page.tsx
│   │   │   ├── ideas/        # Route alias / redirect to demand/ideas
│   │   │   │   ├── page.tsx
│   │   │   │   └── [ideaId]/
│   │   │   │       └── page.tsx
│   │   │   ├── portfolios/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [portfolioId]/
│   │   │   │       └── page.tsx
│   │   │   ├── projects/
│   │   │   │   └── [projectId]/
│   │   │   │       └── page.tsx
│   │   │   └── users/
│   │   │       └── page.tsx
│   │   ├── layout.tsx        # Root layout (QueryClientProvider, AuthProvider)
│   │   └── providers.tsx     # Client-side providers wrapper
│   ├── api/                  # typed API client modules (direct FastAPI communication)
│   ├── auth/                 # AuthContext, bootstrapAuth, useAuth
│   ├── components/
│   │   ├── ui/               # shared reusable UI components
│   │   └── layout/           # AppShell, Topbar, Sidebar
│   └── features/             # feature-specific components and modals
├── next.config.ts (or .js)
├── Dockerfile                # updated for Next.js standalone/runner build post-migration
├── .env.example              # NEXT_PUBLIC_API_URL
├── .github/workflows/ci.yml
└── Doc/
```

`[DECIDED]` No shared monorepo tooling. The only contract between repos is the API surface (Section 6). Place this same set of three docs in both repos' `Doc/` folder so an AI coding agent working in either repo has full context without needing the other repo open.

---

## 3. Backend Architecture

**Layering and request flow (modular monolith, each module follows this identically):**

```
HTTP request
  → Router (api/v1/<module>.py)       — path/query params, delegates to service
  → Pydantic schema                    — validates input
  → Dependency injection                — get_db, get_current_user, require_role(...)
  → Service (services/<module>_service.py)  — business rules, orchestration
  → Repository (repositories/<module>_repository.py) — SQLAlchemy queries, org-scoped
  → PostgreSQL
  → Service maps result → response schema
  → Router returns response
```

| Concern | Lives in | Notes |
|---|---|---|
| Authentication | `core/security.py`, `core/deps.py` | JWT verify + cookie handling |
| Authorization (RBAC) | `core/deps.py::require_role(...)` + service-layer ownership checks | Role check at router level; "is this PM a member of this project" at service level |
| Validation | `schemas/` | Pydantic v2, `model_config = ConfigDict(from_attributes=True)` |
| Business logic | `services/` | ROI calc, approval rules, health-flag rule, idea→project conversion |
| Data access | `repositories/` | Every query filtered by `organization_id`; never trust a client-supplied org id |
| Background jobs | `tasks/` | Scaffolded only; no MVP feature requires it (Section 7) |
| Caching | none for MVP | Would live in `services/` if added, never in `repositories/` |
| Error handling | `core/exceptions.py` | Domain exceptions raised in `services/`, mapped to HTTP by a global FastAPI exception handler — routers never catch business errors directly |
| Logging | stdlib `logging`, structured/JSON in prod | Configured in `core/config.py`; `[PROPOSED]` request-id middleware for traceability |

**Module boundaries (modular monolith discipline):** each module (`ideas`, `projects`, etc.) only calls another module's *service* layer, never reaches into another module's repository or models directly. This is what keeps the monolith "modular" and preserves a clean extraction path later without requiring it now.

---

## 4. Frontend Architecture

### 4.1 Architecture Baseline vs Target Overview
- **Current Baseline:** React + Vite + React Router SPA (`src/routes.tsx`, `src/main.tsx`, `src/App.tsx`).
- **Target Architecture `[DECIDED for migration]`:** Next.js App Router (`src/app/` or `app/`), React 19 / TypeScript, with direct FastAPI communication, client-rendered authenticated views, and preserved in-memory auth tokens. Potential performance and SEO improvements are targets to validate rather than assumed automatic outcomes.

### 4.2 State, API, and Form Patterns
- **State management `[DECIDED]`:** TanStack Query (`@tanstack/react-query`) for server state/caching; local component state/React Context for UI state. No Redux.
- **API client (`src/api/client.ts`):** `fetch` wrapper communicating directly with the FastAPI backend, always `credentials: 'include'` (required for the cookie-based refresh flow, Section 5), attaches `Authorization: Bearer <access_token>` from in-memory state, single-retry-after-refresh on 401. No Next.js API route proxying or SSR token handling is introduced for this migration.
- **Auth (`src/auth/`):** Access token held in memory only (React state/ref) — never written to `localStorage` or `sessionStorage`. `bootstrapAuth.ts` silently calls refresh on initial application load to re-establish session from the httpOnly cookie.
- **Forms:** `react-hook-form` + `zod`, schemas mirroring backend Pydantic validation.
- **Error/loading states:** TanStack Query's `isLoading`/`isError`, surfaced via shared UI state components.

### 4.3 Routing and Protected Layout Architecture
- **Current (React Router):** `react-router-dom`; `<ProtectedRoute roles={[...]}>` reads `AuthContext` in `src/routes.tsx`.
- **Target (Next.js App Router):**
  - **Route Groups:**
    - `app/(auth)/`: Unauthenticated routes (`/login`, `/register`). Client components handling credential entry and session establishment.
    - `app/(dashboard)/`: Authenticated routes. Utilizes a shared client-rendered protected layout (`app/(dashboard)/layout.tsx`) composing `AppShell` and reading `AuthContext` to guard routes and enforce RBAC.
  - **Component Rendering Model:** Authenticated views remain client-rendered (`"use client"`) preserving the in-memory token and direct browser-to-FastAPI fetch lifecycle. Server Components are used for static shell wrappers or unauthenticated static pages where appropriate, but authenticated dashboard views do not attempt SSR token inspection.
  - **Navigation:** Next.js `next/navigation` (`useRouter`, `usePathname`, `redirect`) and `next/link` replace `react-router-dom`'s `useNavigate`, `useLocation`, `<Link>`, and `<Navigate>`.

**Page hierarchy (App Router route mapping):**
```
/login                     → app/(auth)/login/page.tsx
/register                  → app/(auth)/register/page.tsx
/                          → app/(dashboard)/page.tsx (org dashboard home)
/strategy/goals            → app/(dashboard)/strategy/goals/page.tsx
/goals                     → app/(dashboard)/goals/page.tsx (alias/redirect)
/demand/ideas              → app/(dashboard)/demand/ideas/page.tsx
/ideas                     → app/(dashboard)/ideas/page.tsx (alias/redirect)
/demand/ideas/[ideaId]     → app/(dashboard)/demand/ideas/[ideaId]/page.tsx
/ideas/[ideaId]            → app/(dashboard)/ideas/[ideaId]/page.tsx (alias/redirect)
/portfolios                → app/(dashboard)/portfolios/page.tsx
/portfolios/[portfolioId]  → app/(dashboard)/portfolios/[portfolioId]/page.tsx
/projects/[projectId]      → app/(dashboard)/projects/[projectId]/page.tsx
/users                     → app/(dashboard)/users/page.tsx (org_admin only)
```

---

## 5. Authentication & Authorization

**Token flow `[DECIDED]`:**

| Token | Storage | Lifetime `[PROPOSED]` | Transport |
|---|---|---|---|
| Access token (JWT) | In-memory, frontend | 15–30 min | `Authorization: Bearer` header |
| Refresh token | httpOnly, Secure cookie, set by backend | 7 days, rotated on each use `[PROPOSED]` | Automatic cookie, scoped `Path=/api/v1/auth` |

**Cookie settings (cross-domain — Vercel ≠ Railway/Render domain):**
```
Set-Cookie: refresh_token=<value>; HttpOnly; Secure; SameSite=None; Path=/api/v1/auth; Max-Age=604800
```
`SameSite=Lax` will **not** work cross-domain — it must be `None; Secure`, which requires HTTPS (true in prod on both PaaS providers). `[PROPOSED]` Local dev exception: `SameSite=Lax` only when `ENVIRONMENT=local`, config-driven, documented, never shipped to prod.

**CSRF mitigation `[PROPOSED]`:** access token (used for all real API calls) is never in a cookie, so a CSRF-triggered refresh call yields nothing to the attacker; additionally require a custom header (e.g. `X-Requested-With`) on `/auth/refresh` to block naive cross-site form-based triggers.

**Endpoints:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.

**Roles `[DECIDED — from product requirements]`:**

| Role | Scope |
|---|---|
| `org_admin` | Full org control: users, roles, org settings, plus everything below |
| `portfolio_manager` | Strategic goals, idea review, business cases, approvals, idea→project conversion, portfolios, view all org projects |
| `project_manager` | Manage assigned projects: members, tasks, milestones, budget, risks |
| `team_member` | View assigned projects/tasks, update own task status, submit ideas |

Enforcement: role-level via `require_role(...)` FastAPI dependency at the router; project-membership-level (e.g., "is this PM actually on this project") in the service layer.

**Multi-tenancy `[DECIDED]`:** shared database, shared schema, `organization_id` on every tenant-scoped table; every repository method filters/sets it explicitly. `[PROPOSED, deferred]` Postgres Row-Level Security is a future hardening step, not required for MVP since isolation is enforced in the service/repository layers.

**Identity model `[DECIDED]`:** `users.email` is globally `UNIQUE`. One email = one user = one organization for MVP. Multi-org membership, if ever needed, is a future extension (`organization_memberships` join table) — not built now.

---

## 6. API Architecture

- Base path: `/api/v1`.
- Auth: `Authorization: Bearer <access_token>` on all protected routes except refresh/logout (cookie-based).
- Error shape (global handler, consistent everywhere):
  ```json
  { "error": { "code": "IDEA_NOT_APPROVED", "message": "Idea must be approved before conversion." } }
  ```
- Pagination `[PROPOSED]`: `?limit=20&offset=0` → `{ "items": [...], "total": N }`.
- Filtering: query params match field names (`?status=submitted`).
- Timestamps: ISO 8601 UTC. IDs: UUID strings.
- CORS: `allow_origins=[<exact Vercel URL>, http://localhost:5173, http://localhost:3000]`, `allow_credentials=True` (required for the cookie flow; accommodates Vite dev port 5173 and Next.js dev port 3000).

**Endpoint groups (full detail — request/response bodies, roles — lives in `mvp-requirements.md` per feature; this section fixes the routing surface):**
`/auth`, `/users`, `/strategic-goals`, `/ideas`, `/ideas/{id}/business-case`, `/ideas/{id}/approvals`, `/ideas/{id}/convert`, `/portfolios`, `/projects`, `/projects/{id}/members`, `/projects/{id}/tasks`, `/projects/{id}/milestones`, `/projects/{id}/risks`, `/projects/{id}/budget`, `/projects/{id}/expenses`, `/portfolios/{id}/dashboard`, `/projects/{id}/dashboard`.

---

## 7. Redis & Celery — MVP Usage Decision

`[DECIDED]` **Neither is used by any MVP feature.** No caching need (small dataset, low MVP traffic) and no background-job need (no email, no scheduled jobs, no report generation, no heavy computation in MVP scope).

- **Redis**: provisioned in `docker-compose.yml` and on the PaaS from day one (zero extra cost to have it ready), but zero application code is written against it until a real need exists — e.g., dashboard query caching at scale, or rate-limiting on `/auth/login`.
- **Celery**: scaffolded folder (`app/tasks/`) only; no worker process is deployed for MVP. Activate when notifications (post-MVP) are built.

This is a hard rule for the implementation plan: do not add caching or background jobs "for later convenience" during MVP phases — it adds operational surface area with no MVP-facing benefit.

---

## 8. Security

- Passwords hashed with `passlib[bcrypt]`, never logged or returned in any response.
- JWT signed with `JWT_SECRET_KEY` (env var, never committed); `[PROPOSED]` HS256 for MVP simplicity — RS256 is a later hardening step if multiple services ever need to verify tokens independently.
- All secrets via environment variables (`core/config.py`, `pydantic-settings`); `.env` gitignored, `.env.example` committed with placeholder values only.
- Tenant isolation enforced at the repository layer (Section 5) — every query is `organization_id`-scoped; verified by an explicit cross-org test sweep (see `implementation-plan.md` Phase: Testing Hardening).
- CORS locked to explicit origins, never `*`, because credentials are involved (Section 6).
- Refresh token rotation on each use `[PROPOSED]` limits replay-token lifetime.
- `[PROPOSED]` Rate limiting on `/auth/login` and `/auth/register` is a post-MVP hardening item (would be the first real use of Redis, per Section 7).
- No PII beyond name/email/org in MVP scope; no payment data touches this system.

---

## 9. Testing Strategy

| Type | MVP-required | Deferred |
|---|---|---|
| Unit (services) | ROI calc, health-flag rule, role-check logic | Exhaustive edge cases on post-MVP fields |
| API (per endpoint) | Happy path + unauthenticated + wrong-role, for every MUST-HAVE endpoint | — |
| Auth | Register, login, expired/invalid token, refresh flow (incl. cookie flags), logout | Brute-force/rate-limit tests |
| RBAC | Table-driven test: each role blocked from each restricted action | — |
| Tenant isolation | Cross-org access attempt on every resource type returns 403/404 | — |
| DB/model | Constraint behavior (unique, FK) | — |
| Integration | Full Idea→BusinessCase→Approval→Convert→Project journey via API | — |
| Frontend | `[PROPOSED]` component tests (Vitest + RTL) for forms, protected routes, silent-refresh-on-401 | Full e2e (Playwright) |

`[PROPOSED]` Test DB: real Postgres (via Docker service container in CI), not SQLite — the schema uses Postgres-specific `ENUM`/`UUID` types. Coverage target: 80% on `services/` and `repositories/`; not enforced on router boilerplate.

---

## 10. Docker & CI/CD

**Backend:**
- Multi-stage `Dockerfile`: builder installs deps → runtime copies app, entrypoint runs `alembic upgrade head` then starts `uvicorn`.
- `docker-compose.yml`: `postgres`, `redis` (idle), `backend`.
- CI (`.github/workflows/ci.yml`): Postgres service container → install deps → `alembic upgrade head` against test DB → `pytest` → `ruff check`. Merge blocked on failure.
- Deploy: Railway or Render, migrations run automatically via the entrypoint on each deploy.

**Frontend:**
- **Current Baseline:** Multi-stage `Dockerfile` (build → static serve via `serve` on port 4173) for local parity; Vercel builds directly from the repo via `npm run build`. CI: `npm run lint` → `npm run build`.
- **Target Post-Migration:** Multi-stage `Dockerfile` with Next.js standalone output (`node server.js` on port 3000); Vercel auto-detects Next.js natively. CI: `npm run lint` → `npm run build`.
- Deploy: Vercel, auto-deploy on `main`.

**Environment variables:**
- Backend — `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `REDIS_URL`, `FRONTEND_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `ENVIRONMENT`.
- Frontend (Current Baseline): `VITE_API_URL` (consumed by Vite SPA).
- Frontend (Target Next.js): `NEXT_PUBLIC_API_URL` (publicly exposed to browser for direct FastAPI communication; during transition, both may temporarily coexist in `.env.example`).

---

## 11. Scalability Considerations (kept practical, not over-built for MVP)

- **Modular monolith** gives a clear future extraction seam per module if one (e.g., dashboards/analytics) ever needs independent scaling — not needed at MVP traffic.
- **Stateless backend**: JWT access tokens mean any number of backend instances can be run behind a load balancer without session affinity — horizontal scaling on the PaaS is a config change, not an architecture change.
- **Database**: managed Postgres from a PaaS provider handles MVP load comfortably; connection pooling (`[PROPOSED]` via SQLAlchemy's pool or PgBouncer) becomes relevant only past MVP traffic.
- **Redis/Celery** are pre-provisioned specifically so scaling into caching/background jobs later is a code change, not an infrastructure change (Section 7).
- Things deliberately **not** built now because they're premature at MVP scale: read replicas, CDN-fronted API, multi-region deployment, schema-per-tenant isolation, Kubernetes.

---

## 12. Key Architectural Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Modular monolith, not microservices | Team size/traffic don't justify microservice overhead; module boundaries preserve a future split path |
| 2 | Two independent repos (Backend/Frontend) | Independent deploy cadence, independent CI, matches confirmed decision |
| 3 | Access token in memory, refresh token in httpOnly cookie | Reduces XSS exposure vs. localStorage; standard practice for SPA + API split across domains |
| 4 | `SameSite=None; Secure` on refresh cookie | Required because frontend/backend are on different domains (Vercel vs. Railway/Render) |
| 5 | `UNIQUE(email)` globally | Matches confirmed one-email-one-user-one-org MVP assumption; extension path documented for later multi-org support |
| 6 | Redis & Celery provisioned but unused | No MVP feature needs them; avoids both under- and over-building infrastructure |
| 7 | Shared-schema multi-tenancy via `organization_id` | Simplest approach satisfying the hard isolation requirement; RLS deferred as hardening |
| 8 | PaaS deployment (Railway/Render + Vercel), Docker kept | Fast path to a live MVP; Docker preserves portability to any future host |
| 9 | Next.js App Router as target frontend architecture | Modern React 19 / App Router foundation with route groups and standard layouts; preserves client-side in-memory auth model, direct FastAPI communication, and existing REST contracts |
