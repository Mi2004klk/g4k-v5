# Phase 0 — Foundation & Infrastructure

## What
Stand up a deployed, monorepo-based platform skeleton: `apps/web` (Next.js 16.2.12 + React + TS + Tailwind v4 + shadcn), `apps/api` (Laravel 12 + PHP 8.4), and `packages/ui` (shared components/hooks/api-client/theme/types), wired to real external services (Supabase Postgres, Railway, Vercel, GitHub) with CI/CD, an OpenAPI spec-first pipeline, and Sanctum installed. No product features.

## Why
Every later phase assumes a running, deployable monorepo with a reachable DB, a green CI pipeline, and a spec-first API workflow. Phase 0 removes all infra risk up front so Phase 1+ can focus purely on product. It also validates the cross-domain (Vercel ↔ Railway) and Postgres/Supabase decisions end-to-end before any business logic is written.

## Scope
- pnpm-workspace monorepo + tooling (ESLint, Prettier, PHP-CS-Fixer, tsconfig project refs).
- Laravel 12 app with Postgres (Supabase) connection, Sanctum installed, base migrations, `/health` endpoint, env per stage.
- Next.js 16.2.12 app with Tailwind v4 + shadcn/ui base, placeholder landing, env per stage.
- `packages/ui` resolvable from both apps (shared API client + types + theme stub).
- OpenAPI spec directory + generator/config (spec-first pipeline ready).
- GitHub repo + Actions CI (lint/build/test on PR); Railway deploy (api); Vercel deploy (web).
- Backups (Supabase automated) + rollback strategy documented; dev/staging/prod env config.
- Seeder scaffolding (classes ready; data loaded in Phase 2).

## Non-goals
- Any product screen, business logic, or auth flow (Phase 1+).
- Seed data values (Phase 2).
- Realtime channels / Offline Engine implementation (later phases — only stubs/reserved here).
- Docker/k8s (VPS-only concern; we use managed hosting).

## Phase / capability
Phase 0 of 11 · capability `foundation` · depends on nothing. See `openspec/TRACKER.md`.

## ADRs
Depends on: ADR-003 (Laravel 12), ADR-004 (Next.js 16.2.12), ADR-005 (OpenAPI spec-first), ADR-012 (Postgres/Supabase), ADR-014 (Sanctum Bearer), ADR-016 (monorepo). No new ADR introduced.
