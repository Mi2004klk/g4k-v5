# Design — foundation

## Monorepo layout
```
/
  apps/
    api/          # Laravel 12 (PHP 8.4+)
      app/, bootstrap/, config/, database/migrations/, routes/
      openapi/    # spec-first OpenAPI documents
      composer.json
    web/          # Next.js 16.2.12 (React + TS)
      app/        # Next.js app router
      components/ # shadcn-owned copies
      package.json
  packages/
    ui/           # shared: components, hooks, api-client, theme, types
      src/
        components/, hooks/, api/, theme/, types/index.ts
      package.json (exports map)
  .github/workflows/  # CI
  pnpm-workspace.yaml
  package.json (root, workspaces + shared scripts)
  DEPLOYMENT.md
  .gitignore
```
pnpm workspaces; `packages/ui` consumed via `"@g4k/ui": "workspace:*"`. The Laravel api does not import JS; it shares types via a generated `openapi/types.ts` consumed by web/ui.

## Data model
Phase 0 ships Laravel's default tables only (`users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`, `failed_jobs`) so Sanctum + queue + cache work. Supabase Postgres is the connection; migrations run via `php artisan migrate`. No product tables — those arrive per-phase.

## API (OpenAPI, spec-first)
Base document `apps/api/openapi/openapi.yaml`:
- `info` (title Games4King Workplace OS, version 0.1.0)
- `servers` per environment (staging/prod URLs)
- `GET /health` → 200 `{ status: "ok" }`
- Security scheme registered: `bearerAuth` (http bearer, JWT-format Sanctum tokens) — used from Phase 1.
A generator (e.g. openapi-typescript) emits `packages/ui/src/types/api.ts` so all clients share one contract.

## Realtime
Not implemented in Phase 0. Laravel Reverb is installed+configured (package added, broadcasting driver set, Reverb credentials env-wired) so later phases only register channels — no infra work then.

## Offline
Not implemented in Phase 0. The `packages/ui` API client is structured to route through an offline queue adapter in a later phase; only the adapter interface is reserved here.

## Capabilities
None introduced. The `capabilities` config concept is documented in `project.md` §18 but not enforced until Phase 2.

## Environments
| Env | api | web | db |
|---|---|---|---|
| dev | localhost:8000 | localhost:3000 | local Supabase project or cloud dev DB |
| staging | railway (staging) | vercel preview/staging | Supabase staging |
| prod | railway (prod) | vercel prod | Supabase prod |
Secrets via Railway/Vercel env vars + `.env` locally (gitignored). `DEPLOYMENT.md` documents each var.

## CI/CD
- **PR**: GitHub Actions → web: `pnpm install`, `pnpm lint`, `pnpm build`, `pnpm test`; api: `composer install`, `php artisan test`, PHP-CS-Fixer check, openapi lint. All must pass.
- **Merge to main**: Railway auto-deploys api (staging); Vercel auto-deploys web (preview→staging). Production via manual promote (Railway) / Vercel production deploy.
- Backups: Supabase daily automated + PITR if available; restore drill documented.
- Rollback: Railway redeploy previous image; Vercel instant rollback to prior deployment.

## Test strategy (Phase 0)
- api: feature test asserting `GET /health` returns 200; migration test asserting schema applies cleanly.
- web: smoke test that landing renders; build passes.
- CI enforces both.

## Performance Requirements (Phase 0 — establishes the budget rails)
Phase 0 builds the CI performance rails that all later phases depend on (R13.27/28/29):
- **Bundle budget infrastructure** (R13.7): `@next/bundle-analyzer` + a `bundlesize`/budget config
  asserting First-Load JS ≤200KB gz per route. The placeholder route sets the baseline.
- **Lighthouse CI** (R13.1/2/3): `@lhci` config asserting LCP≤2.5s, INP≤200ms, CLS≤0.1, FCP≤1.8s
  on the placeholder route; runs on PRs.
- **API latency baseline** (R13.4): benchmark test asserting `GET /health` p95 ≤50ms.
- **Production build guardrails** (R13.27): CI builds production (no sourcemaps, minified,
  vendor cache group) and fails on build warnings/errors.
- **Monitoring scaffolding** (R13.28): Sentry + web-vitals + Laravel Pulse configured (keys
  env-wired; full flow metrics collected once real screens exist).
- **Query/log guardrails** (R13.5): a shared test helper asserting ≤5 SQL/request + zero N+1,
  ready for later phases to reuse.
Frequent workflows: none yet (placeholder only).

## New ADRs
- **ADR-018 (Performance-first)** — recorded in `project.md`; Phase 0 instantiates its CI rails.
