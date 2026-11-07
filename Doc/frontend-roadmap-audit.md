# RicozPortfolio — Frontend Implementation Roadmap Audit & Phase 6 Analysis

**Audit Date:** 2026-11-02  
**Author:** Antigravity AI Coding Assistant  
**Authority Reference:** `AGENTS.md`, `Doc/implementation-plan.md`, `Doc/architecture.md`, `Doc/mvp-requirements.md`

---

## A. Project Health & Repository Status

### 1. Git Working Tree & Branch
- **Current Branch:** `feature/phase6-`
- **Changes Staged:**
  - `Doc/figma-visual-acceptance-checklist.md`
  - `Doc/figma-visual-spec.md`
- **Untracked Files:**
  - `Doc/nextjs-migration-plan.md`
  - `Doc/redesign-testing-plan.md`
  - `phase5-completion-report.md`
  - `screenshots/`
- **Recent Git Commits:**
  - `deb2406` feat: complete frontend redesign and Next.js migration
  - `4b800dd` fix: use Next.js build for deployment
  - `479ad6b` feat: migrate frontend to Next.js and fix E2E tests
  - `8ac1e16` implement Phase 5 frontend for goals and idea management
  - `86f94d7` feat: implement frontend RBAC and user management

### 2. Frontend Architecture & Setup
- **Framework & Runtime:** Next.js 15.5.27 (App Router), React 19, TypeScript, Tailwind CSS.
- **State Management & Data Fetching:** TanStack Query (`@tanstack/react-query`) for server state; local React state for modal and interaction management.
- **Authentication:** In-memory access token preserved via `AuthContext.tsx`, `bootstrapAuth.ts` silent refresh mechanism, HttpOnly refresh cookies.
- **Quality Gates Verification:**
  - **Typecheck (`npx tsc --noEmit`):** PASSED (0 errors).
  - **Linter (`npm run lint` / `oxlint`):** PASSED (0 errors, 3 known harmless React Fast Refresh export warnings on metadata/hooks).
  - **Playwright Test Suite:** 9 spec files in `tests/e2e/`, 47 test cases passing in regression suite per `phase5-completion-report.md`.

---

## B. Phase-Wise Implementation Status (Product Roadmap Phases 6–13)

Per `AGENTS.md` §5A, `Doc/implementation-plan.md` is the **single source of truth** for product roadmap phases. Note that previous visual redesign efforts tracked separate design phases (Phases 1–5 in `Doc/redesign-testing-plan.md`), but product feature sequencing strictly follows `Doc/implementation-plan.md`.

| Phase | Name | Frontend Status | Backend Integration | Tests | Remaining Work | Overall Status |
|---|---|---|---|---|---|---|
| **6** | **Business Case & Approval (critical seam)** | **PARTIALLY COMPLETE** | **PENDING** | Existing test suite covers idea viewing; Phase 6 E2E pending | Attach business case form/card, approval decision action & audit trail, convert-to-project modal/banner, typed API integration | **PARTIALLY COMPLETE** |
| **7** | Portfolio & Project Core | PARTIALLY COMPLETE | PENDING | Shell navigation assertions pass; detailed CRUD tests pending | Full Portfolio CRUD, Project CRUD, Member management (`/portfolios`, `/projects/[projectId]`) | PENDING |
| **8** | Task & Milestone Execution | PENDING | PENDING | None | Tasks tab (list + status update) and Milestones tab on `ProjectDetailPage.tsx` | PENDING |
| **9** | Financial & Risk | PENDING | PENDING | None | Budget tab (planned vs actual, expenses) and Risks tab on `ProjectDetailPage.tsx` | PENDING |
| **10** | Dashboards | PARTIALLY COMPLETE (Overview shell exists) | PENDING | Shell route tests pass | Real metrics aggregation: task %, budget %, open risk count, health indicators | PENDING |
| **11** | Testing Hardening | PENDING | PENDING | Basic E2E regression active | Cross-tenant isolation sweeps, full coverage hardening | PENDING |
| **12** | Deployment | COMPLETE (Deployed to Vercel) | COMPLETE (Render) | CI build & lint active | Final domain configuration and prod env lock | COMPLETE |
| **13** | MVP Validation | PENDING | PENDING | None | End-to-end user journey validation from Idea to Dashboard | PENDING |

---

## C. Phase 6 Detailed Gap Analysis

Phase 6 ("Business Case & Approval") represents the critical product seam bridging demand evaluation into active portfolio projects (`mvp-requirements.md` §5.2–5.4).

### 1. Existing Frontend Implementation
- **Current Page:** `src/app/(dashboard)/demand/ideas/[ideaId]/page.tsx` renders `src/features/demand/IdeaDetailPage.tsx`.
- **Existing Features on Idea Detail:**
  - View idea details (title, description, author, status, creation/update dates).
  - Status transitions (`draft -> submitted -> in_review -> approved / rejected`).
  - Edit/Delete idea modals.
  - Strategic Goal alignment card.
  - **Phase 6 Placeholder Banner:** An explicit dashed preview banner indicating Phase 6 is pending:
    ```tsx
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        ...
        <h3 className="text-sm font-semibold text-gray-900">Business Case & Approval Workflow (Phase 6)</h3>
        <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
            In Phase 6, you will be able to attach financial ROI business cases, perform formal portfolio approvals, and convert approved ideas into active projects.
        </p>
    </div>
    ```

### 2. Missing Frontend Modules & API Integrations
1. **API Client Layer (`src/api/`):**
   - No endpoints currently exist in `src/api/demand.ts` or `src/api/` for:
     - `POST /ideas/{idea_id}/business-case`
     - `PATCH /ideas/{idea_id}/business-case`
     - `GET /ideas/{idea_id}/business-case`
     - `POST /ideas/{idea_id}/approvals`
     - `GET /ideas/{idea_id}/approvals`
     - `POST /ideas/{id}/convert`
     - `GET /portfolios` (needed for portfolio selector dropdown during conversion)
2. **Business Case Management UI:**
   - Missing Business Case form/card on `IdeaDetailPage.tsx` allowing `estimated_cost` and `estimated_benefit` input.
   - Missing automated ROI display: `ROI = (estimated_benefit - estimated_cost) / estimated_cost` (formatted as percentage).
   - Missing validation preventing empty/negative numbers.
   - Missing RBAC: only `portfolio_manager` and `org_admin` can create/edit business cases.
3. **Approval Decision & Audit Trail UI:**
   - Missing single-step approval/rejection panel with decision notes/rationale.
   - Missing immutable audit trail list/card showing who approved/rejected, timestamp, and notes (`GET /ideas/{idea_id}/approvals`).
   - Missing business rule enforcement: Approval cannot be triggered without an attached Business Case (backend contract validation).
4. **Convert to Project Action:**
   - Missing "Convert to Project" action modal when idea status is `approved`.
   - Missing Portfolio selector (fetches available portfolios for target assignment).
   - Traceability: Navigating to the newly created project or confirming `source_idea_id` association.
5. **Role-Based Access Control (RBAC):**
   - Ensure `team_member` cannot see/submit approvals or conversions, while maintaining read-only visibility where appropriate.
6. **Playwright E2E Tests:**
   - Missing dedicated Phase 6 tests in `tests/e2e/` testing:
     - Business case submission & calculated ROI rendering.
     - Single-step approval workflow with audit log entry.
     - Rejection flow with audit log entry.
     - Project conversion modal with target portfolio selection.
     - RBAC restrictions on approval/conversion buttons.

### 3. Backend Integration Dependencies & Status
- The backend URL is configured (`https://ricozportfolio-backend.onrender.com`).
- Render free tier instances spin down after inactivity (cold starts take ~50s).
- Phase 6 endpoints defined in `Doc/implementation-plan.md` §168:
  - `POST /ideas/{idea_id}/business-case`
  - `GET /ideas/{idea_id}/business-case`
  - `POST /ideas/{idea_id}/approvals`
  - `GET /ideas/{idea_id}/approvals`
  - `POST /ideas/{id}/convert`

---

## D. Recommended Implementation Sequence for Phase 6

To implement Phase 6 cleanly without regressions, follow this sequence:

1. **Step 1: Typed API Client Extensions (`src/api/businessCase.ts` or `src/api/demand.ts` + `src/api/portfolios.ts`)**
   - Define TypeScript interfaces: `BusinessCaseCreateRequest`, `BusinessCaseResponse`, `ApprovalCreateRequest`, `ApprovalResponse`, `ConvertToProjectRequest`, `ProjectResponse`.
   - Implement client functions: `getBusinessCase`, `createOrUpdateBusinessCase`, `getApprovals`, `createApproval`, `convertToProject`, `getPortfoliosSummary`.
2. **Step 2: Business Case Component (`src/features/demand/components/BusinessCaseCard.tsx`)**
   - Render financial inputs (`estimated_cost`, `estimated_benefit`), calculate client-side preview ROI, display backend-calculated ROI, handle validation errors.
   - Restrict edit capabilities to `portfolio_manager` / `org_admin`.
3. **Step 3: Approval Action & Audit Trail (`src/features/demand/components/ApprovalSection.tsx`)**
   - Decision form for approving/rejecting with comment/rationale.
   - Audit trail table/timeline displaying historic decisions (decider name, role, decision, date, comments).
4. **Step 4: Convert-to-Project Modal (`src/features/demand/components/ConvertIdeaModal.tsx`)**
   - Modal displayed when status === `'approved'` and not yet converted.
   - Portfolio dropdown selector.
   - Submission creates Project and provides direct navigation link to `/projects/{projectId}`.
5. **Step 5: Integrate into `IdeaDetailPage.tsx`**
   - Replace Phase 6 placeholder banner with real components.
   - Wire TanStack queries and cache invalidations on mutation success.
   - Match visual styling tokens from `Doc/figma-visual-spec.md`.
6. **Step 6: Playwright E2E Test Suite (`tests/e2e/business-case-approval.spec.ts`)**
   - Automated verification of the full lifecycle: Business Case -> Approval -> Audit Trail -> Conversion.
7. **Step 7: Verification Gates**
   - Run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and Playwright test suite.
