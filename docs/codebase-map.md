# Codebase Map

Status: current repository map for product work.

## Public Product Flow

- `/`: landing page and current visual theme.
- `/simulate`: four-step career transition simulation.
- `/results`: free generated result for a submitted simulation.
- `/pricing`: plan selection before auth/checkout.
- `/login` and `/signup`: account entry points used around checkout.
- `/checkout`: starts payment after plan selection and auth.
- `/dashboard`: paid workspace, intentionally handled as its own product area.

## Main Directories

- `src/app`: Next.js routes, layouts, metadata, API handlers, and server-only route composition.
- `src/components`: shared UI and route-level React components.
- `src/components/home`: landing page sections and homepage data.
- `src/components/dashboard`: dashboard layout, navigation, data hook, view workspaces, and dashboard-only primitives.
- `src/lib`: domain logic shared by routes and components.
- `src/lib/career-switch-analysis`: AI and mock career-switch result generation.
- `src/lib/db`: Supabase clients and server/browser DB setup.
- `supabase/migrations`: database schema, triggers, policies, and storage setup.
- `tests/e2e`: critical user-flow tests.
- `docs`: current product and engineering reference only.

## Important Domain Files

- Simulation form contract: `src/lib/career-switch-form.ts`.
- Simulation submit API: `src/app/api/simulations/route.ts`.
- Result payload mapper: `src/lib/simulation-results-payload.ts`.
- Pricing config: `src/lib/pricing.ts`.
- Mono billing integration: `src/lib/mono-acquiring.ts`, `src/lib/billing.ts`, `src/lib/billing-store.ts`, `src/lib/billing-security.ts`.
- Manual dashboard access overrides: `src/lib/manual-full-access.ts`.
- Auth/session helpers: `src/lib/request-auth.ts`, `src/lib/auth-session-client.ts`.
- Dashboard data loading: `src/components/dashboard/use-dashboard-data.ts`.
- Dashboard shared types: `src/components/dashboard/types.ts`.

## Current Boundary Rules

- Public routes should stay focused on composition and metadata.
- API routes should validate input, call domain helpers, and return a clear response.
- Business rules should live in `src/lib`, not inside visual components.
- Dashboard-only UI should stay under `src/components/dashboard`.
- Homepage-only UI should stay under `src/components/home`.
- Shared UI can live in `src/components` only when it is reused outside one feature area.
- Docs should describe what exists now, not future ideas.
