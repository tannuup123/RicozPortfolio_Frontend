# RicozPortfolio Frontend

React + TypeScript + Vite + Tailwind CSS frontend for RicozPortfolio, a
multi-tenant Project Portfolio Management (PPM) SaaS.

> **Phase 1 status:** infrastructure and route scaffold only. No real
> authentication, no wired-up API calls, and every page is a placeholder.
> See `Doc/implementation-plan.md` for the full phase roadmap.

This is the **frontend-only** repository. The backend lives in a separate
`RicozPortfolio_Backend` repository.

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · React Router · TanStack Query ·
React Hook Form · Zod.

## Local Setup

Requires Node.js 22+.

```bash
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

## Local Setup (with Docker)

```bash
docker build -t ricozportfolio-frontend .
docker run -p 4173:4173 ricozportfolio-frontend
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, including `/api/v1` |

## Cross-Domain Cookie Note

In production, this app (Vercel) and the backend (Railway/Render) are on
different domains. The backend's refresh cookie is `SameSite=None; Secure`
specifically to work across that boundary — see `Doc/architecture.md`
Section 5. The API client (`src/api/client.ts`) always sends
`credentials: 'include'`, required for that cookie to be sent at all.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to
`main`/`develop`: install dependencies → lint → build.

## Architecture & Roadmap

See `Doc/architecture.md`, `Doc/mvp-requirements.md`, and
`Doc/implementation-plan.md`.
