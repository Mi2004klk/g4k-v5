# Tasks — foundation

> Ordered, chunked (~2h each), tagged. Each phase ends with test + deploy + archive.

- [ ] 1. [deploy] Create GitHub repo `games4king-workplace-os` (private); init root `.gitignore` (node_modules, vendor, .env, build outputs), `README.md` stub.
- [ ] 2. [web][ui-pkg] Initialize pnpm workspace: `pnpm-workspace.yaml`, root `package.json` with shared scripts, `.npmrc`.
- [ ] 3. [web] Scaffold `apps/web`: `pnpm create next-app` (Next.js 16.2.12, TS, Tailwind v4, app router, ESLint). Verify dev server boots.
- [ ] 4. [web] Init shadcn/ui in `apps/web`; copy base components (button, card). Confirm ownership/copy-in model.
- [ ] 5. [ui-pkg] Create `packages/ui` (`package.json` with `exports` map, `src/{components,hooks,api,theme,types}`). Make resolvable from web via `@g4k/ui`.
- [ ] 6. [ui-pkg] Implement typed API client stub (base fetch wrapper + Bearer injection) + `types/index.ts` barrel + theme stub. Wire web landing to import a token/theme from `@g4k/ui`.
- [ ] 7. [web] Configure tsconfig project references across `apps/web` ↔ `packages/ui`; ensure `pnpm build` type-checks both.
- [ ] 8. [api] Scaffold `apps/api`: `composer create-project laravel/laravel` (Laravel 12, PHP 8.4). Verify `php artisan serve` boots.
- [ ] 9. [api] Configure PostgreSQL connection (Supabase connection string via `.env`); run `php artisan migrate` against a dev DB; confirm clean.
- [ ] 10. [api] Add `GET /health` route returning `{ status: "ok" }`; add feature test asserting 200.
- [ ] 11. [api] Install + configure Laravel Sanctum (token issuance endpoints deferred to Phase 1). Add Reverb package + broadcasting config (credentials env-wired, not used yet).
- [ ] 12. [api] Configure queue/scheduler/cache for managed execution; add `database/seeders` scaffolding (empty, ready for Phase 2).
- [ ] 13. [spec] Create `apps/api/openapi/openapi.yaml`: info, servers (staging/prod), `GET /health`, bearerAuth scheme. Add openapi lint to CI.
- [ ] 14. [ui-pkg] Generate `packages/ui/src/types/api.ts` from openapi (openapi-typescript); wire into API client stub types.
- [ ] 15. [api][web] Add tooling: root ESLint+Prettier (web/ui), PHP-CS-Fixer (api); pre-commit or CI-enforced.
- [ ] 15b. [test][web] Performance-budget rails: `@next/bundle-analyzer` + bundlesize config (First-Load JS ≤200KB gz/route); `@lhci` config asserting LCP≤2.5s/INP≤200ms/CLS≤0.1/FCP≤1.8s on the placeholder route. (R13.1/2/7/29)
- [ ] 15c. [test][api] Benchmark test `GET /health` p95 ≤50ms; shared test helper asserting ≤5 SQL/request + zero N+1 for reuse by later phases. (R13.4/5)
- [ ] 15d. [deploy] Production build guardrail: CI runs a prod build (no sourcemaps, minified, vendor cache group) and fails on warnings; Sentry+web-vitals+Laravel Pulse env-wired (keys ready). (R13.27/28)
- [ ] 16. [deploy] GitHub Actions workflow `ci.yml`: web (install/lint/build/test/budget/lhci), api (install/test/cs-fix/openapi-lint/benchmark). Verify green on a PR.
- [ ] 17. [deploy] Provision Supabase Postgres project (staging + prod); capture connection strings as secrets; enable automated backups + PITR.
- [ ] 18. [deploy] Create Railway app for api: build/deploy config, env vars, Postgres reachable, scheduler+queue worker processes; deploy; verify `/health` 200 on staging URL.
- [ ] 19. [deploy] Create Vercel project for web: link repo, env vars, build settings; deploy preview; verify placeholder landing loads.
- [ ] 20. [docs] Write `DEPLOYMENT.md`: environments table, env var list, backup + restore procedure, rollback steps for Railway + Vercel.
- [ ] 21. [test] Full local verification: `pnpm build` + `php artisan test` green; `curl <staging-api>/health` 200; Vercel preview loads.
- [ ] 22. [deploy] Promote staging → production (api + web); record prod URLs in `openspec/TRACKER.md`.
- [ ] 23. [docs] Archive Phase 0 via `/opsx:archive` (freeze foundation spec); update tracker statuses to ✅.
