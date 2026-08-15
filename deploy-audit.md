# Deployment / Config / Housekeeping Audit — Games4Kings-New

Repo state context: branch `main`, 586 tracked files, **204 modified + 185 untracked files uncommitted** (includes 16 new migrations, 5 new feature tests, 5 console commands — real code exists only on this machine).

---

## Numbered Findings

### Deployment chain

**F1 — P0 — `.github/workflows/deploy.yml` is UNTRACKED (never committed; zero history)**
The plan's Phase 1 / T-1.1 "single-source CI pipeline on merge→main" does not exist in the repo. Evidence: `git status` shows `?? .github/workflows/deploy.yml`; `git log --all -- .github/workflows/deploy.yml` is empty. Only `ci.yml` is tracked in `.github/workflows/`. Any clone/CI runner sees no deploy pipeline at all.

**F2 — P0 — `deploy.yml` BE deploy is broken-by-construction: wrong build context + no env + region drift**
- `gcloud run deploy g4k-api --source ./apps/api` — there is **no `apps/api/Dockerfile` and no `apps/api/Procfile`**; the real Dockerfile is at repo root and expects root context (`COPY apps/api/composer.json ...`, Dockerfile:20). With `--source ./apps/api`, gcloud falls back to buildpacks or fails; it will never use the root Dockerfile/cloudbuild build.
- Deploy step sets **zero env vars** (no APP_KEY, DB_*, AWS_*), unlike cloudbuild.yaml:39-41 → even if it built, the service would be dead.
- Region `us-central1` (deploy.yml:32,58) vs `asia-south1` everywhere else (cloudbuild.yaml:5, DB is `aws-0-ap-south-1` Supabase pooler) → would create a parallel service in the wrong region. No `--memory/--cpu/--min-instances/--concurrency` flags (drift from cloudbuild).

**F3 — P0 — Two competing deploy paths; "deploy both or neither" is not enforced**
`cloudbuild.yaml` (header: "Trigger: GitHub push to `main`" via Cloud Build) deploys BE with full smoke tests, while Vercel deploys FE independently via its own git integration, and the (untracked) deploy.yml describes a third path. Nothing couples BE+FE deploys, no build-id emission, no concurrency group. Plan T-1.1 edge case (partial deploys) is unaddressed.

**F4 — P0 — Real secrets committed in git: `cloudbuild.yaml` (lines 39–41), tracked at HEAD and in history**
Key names present in plaintext: `APP_KEY`, `DB_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Supabase S3), `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `PUSHER_APP_ID/KEY/SECRET`, `REVERB_APP_ID/KEY/SECRET`, plus **3 live demo-account login credentials** in the smoke step (cloudbuild.yaml:65). Confirmed in `git show HEAD:cloudbuild.yaml`. History contains them since commits `d579006`/`47ded1e`. Rotation + history purge + Secret Manager migration required.

**F5 — P0 — GitHub PAT embedded in the `frontend` git remote URL**
`git remote -v` shows `https://<user>:<ghp_…>@github.com/Mi2004klk/g4k-v5.git` — a live personal access token stored in `.git/config` (machine-local, not committed, but a real credential exposure; value not reproduced here).

**F6 — P1 — Smoke gates incomplete vs plan T-1.2**
Plan requires 3-role login asserting `/dashboard/init`, `/notifications`, `/directory`, plus `migrate:status` (0 pending) and web build zero-error gates. Reality: cloudbuild.yaml SmokeCheck does health + ping + 3-role login but asserts **only `/dashboard/init`** (no notifications/directory); deploy.yml has **no smoke steps at all**; **no `migrate:status` gate exists anywhere** (start.sh:7 runs `migrate --force --isolated` at boot and continues on failure — a failed migration still ships); web build failing would block vercel build (implicit gate only).

**F7 — P1 — Worker + scheduler (T-2.1/T-2.2): defined only in the UNTRACKED deploy.yml; and they conflict with the running architecture**
`g4k-worker` / `g4k-scheduler` appear only in `deploy.yml` (lines 37–69) and in plan docs (`finalization.md:76-77`, `finalization-report.md:65-66`). They are absent from `cloudbuild.yaml` and from README. Meanwhile `apps/api/start.sh:16-17` already runs `queue:work` and `schedule:run` as **background loops inside the g4k-api container**. If deploy.yml were ever activated, queue jobs and schedules would be processed **twice** (in-container loops + dedicated services). Also `deploy.yml:61` hardcodes `scheduler@g4k-project.iam.gserviceaccount.com` (placeholder-looking SA, wrong-looking project id).

**F8 — P1 — deploy.yml secrets it would require (must exist as GitHub secrets if ever committed): `GCP_SA_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`** — unverifiable from the repo; listed here as prerequisites. Vercel steps themselves (pull → build --prod → deploy --prebuilt, using root `vercel.json`) are coherent.

**F9 — P2 — `vercel.json` / `.vercelignore` / `.dockerignore` minor drift**
- `vercel.json` `outputDirectory: apps/web/.next` is unnecessary for Next on Vercel (inferred) — harmless.
- `.vercelignore` excludes `apps/api`, `supabase`, `.agents`, `*.exe`, `*.zip` but **not** `scratch/`, `User-avatar-image/`, `docs/`, `projects/` — currently untracked so low impact, but if ever committed they'd ship to Vercel.
- `.dockerignore` correctly strips tests/phpunit/env from the image (PASS), but doesn't exclude `node_modules` at root / `apps/web` (image bloat; guarded only by `*` allowlist — actually `*` + `!apps/api/` + `!Dockerfile` + `!cloudbuild.yaml` covers it; PASS).
- `cloudbuild.yaml` copies `cloudbuild.yaml` into nothing — fine; build context `.` matches Dockerfile expectations (PASS).

### Environment / config

**F10 — PASS with note — root `.env.local`, `.env.production.local`, `.env.vercel` are untracked and gitignored (`.env.*` rule)**
They contain only Vercel-CLI pull artifacts: keys `VERCEL_OIDC_TOKEN`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_GIT_*`, `NX_DAEMON`, `TURBO_*` (names only). No app secrets, no DB keys. They are machine-local `vercel pull` output dumped in repo root — clutter, not a leak. `apps/api/.env` likewise not tracked.

**F11 — P1 — `.gitignore` gaps: `scratch/`, `projects/`, avatar dirs, one-off scripts, `walkthrough.md`, `finalization-report.md`, `apps/api/dump3.txt` are untracked but NOT ignored**
Verified via `git check-ignore`: `scratch/` (40+ throwaway scripts incl. `scratch/update-fin-*.js`), `User-avatar-image/`, `apps/api/public/avatars/`, `apps/web/public/avatars/` (27 PNGs), root `check_guards.php`/`fix_guards.php`/`fix_indexes.php`/`replace-tokens.js` (hyphen — the `replace_*.js` rule doesn't match it), `apps/api/fix_controllers.php`, `orphan_sweep.php`, `patch_migrations.php` all unprotected against accidental `git add -A`. Plan T-40.2 explicitly expects `scratch/` ignored. Covered correctly: `.env*`, `node_modules`, `vendor`, `*.log`, `apps/api/storage/logs/`, `.vercel/`, `.jetro/`, `.cursor/`, `docs/`, `data/`, `context.md`, agent files.

**F12 — P1 — `apps/api/tests/Feature/Feature/PasswordPolicyTest.php` — tracked duplicate nested test directory**
A second `Feature/Feature/` level containing default Laravel boilerplate (`namespace Tests\Feature\Feature;`) — junk pattern match, runs as a duplicate test.

### package.json health

**F13 — P1 — CI references a script that doesn't exist: `pnpm --filter web typecheck`**
`.github/workflows/ci.yml:33` runs typecheck; `apps/web/package.json` scripts are only `dev/build/start/lint/test/test:bundle/test:lhci`. Tracked CI will fail on the next push to main/PR.

**F14 — P2 — Root `package.json` issues**
- Declares npm-style `"workspaces": [...]` alongside `pnpm-workspace.yaml` (redundant/unused for pnpm).
- Deps `js-yaml` and `tailwindcss-animate` are unused at root (js-yaml referenced nowhere outside node_modules; tailwindcss-animate already declared in apps/web, not used by packages/ui) — remove both (they ARE in pnpm-lock importers, so lockfile is consistent, just unnecessary).

**F15 — P2 — apps/web dependency issues**
- Unused: `@tiptap/react` + `@tiptap/starter-kit` (zero imports in `apps/web/src`/`app`).
- Stale config: `next.config.ts` `optimizePackageImports` lists `framer-motion` and `@tiptap/*` — framer-motion is **not installed** at all.
- Inconsistencies vs packages/ui: `date-fns` ^4 (web) vs ^3 (ui) — major split; `tailwind-merge` ^3.6 (web) vs ^2.3 (ui) — major split.
- `build` uses `npm run test:bundle` inside a pnpm workspace (works, but should be `pnpm run`).
- `pnpm-lock.yaml` matches package.jsons for the root/web/ui importers (no lock drift found).

**F16 — P2 — packages/ui export strategy is fragile**
`exports["."] → ./dist/index.js` (requires tsup build) while all subpaths point at raw `./src/*.ts`; `apps/web/next.config.ts` has **no `transpilePackages`** entry for `@g4k/ui` (only `optimizePackageImports`), and neither CI nor `vercel.json` builds ui before web (`pnpm --filter web build` runs web only). Builds evidently succeed today, but the mixed dist/src contract is a verify-me risk on cold clones.

### composer.json (apps/api)

**F17 — P2 — notes**
- `laravel/framework ^13.8` — the audit brief said "Laravel 11"; actual is Laravel 13 (Octane ^2.19, FrankenPHP runtime). Docs/plan should use the right number.
- `sentry/sentry-laravel` is required but there is **no `config/sentry.php`** and no `SENTRY_*` env in the Cloud Run deploy → inert package on BE (FE Sentry is fully configured: `sentry.{client,edge,server}.config.ts` exist).
- `laravel/pulse` + `laravel/reverb` present; reverb keys are set in prod env (Pusher-compatible), pulse env/migrations unverified — low priority.
- Scripts (`setup`, `dev`, `test`) are stock Laravel and valid (`apps/api/package.json` exists, so the npm/vite references in `dev` are fine). `composer.lock` exists and is what the Dockerfile copies (PASS).

### README.md

**F18 — P1 — README is a 31KB product spec, not an engineering README; the only deploy claim is unfounded**
It contains zero setup/build/deploy commands, env docs, ports, URLs, or service names — so plan T-1.1 "document exact commands" is unmet, and worker/scheduler (T-2.1/2.2) are documented nowhere user-facing. Its sole deployment statement — "Deployment is Perfect and Fully Synced" (README.md:21) — is contradicted by F1–F7. No stale-command false positives possible (there are no commands), but that itself is the gap.

### docs/

**F19 — P1 — `docs/archive/planning/` is intact locally (16 files: finalization v1–v7, reports, `context-pre-consolidation-2026-08-14.md`) but `docs/` is GITIGNORED**
The planning archive exists only on this machine — a disk failure loses it. Either intentional (client repo clean) → fine, but then it needs an external backup; note it in the plan's T-40.2 "confirm intact" as satisfied only locally.

### Stale-build guard (T-1.3) — broken wiring

**F20 — P1 — `version.json` pipeline is half-wired and duplicated**
- `apps/web/scripts/generate-version.js` and `apps/web/public/version.json` are both UNTRACKED; `apps/web/package.json` `build` does **not** invoke the generator (finalization-report.md:56-59 claims it was added to the build sequence — stale claim).
- `version.json` timestamp is 2026-08-15T02:08 (stale, generated once).
- Two `VersionGuard` components exist: `src/components/version-guard.tsx` (fetches `/api/version` — route exists at `src/app/api/version`, used by `providers.tsx`) and `src/components/app-shell/version-guard.tsx` (fetches `/version.json` — the stale/untracked file) — the second is dead/broken duplicate code.

### Version pins

**F21 — PASS (mostly)**
Node: engines `24.x` (root + web), CI `node-version: 24`, `packageManager: pnpm@9.15.4` (root, web, CI action) — consistent; packages/ui lacks `engines` (minor). PHP: Dockerfile `php8.4-alpine`, composer `^8.4`, CI `8.4` — consistent. README makes no version claims. `next.config.ts` dev rewrite targets `127.0.0.1:8000` = artisan serve default (consistent).

---

## KEEP / DELETE table (clutter candidates)

| Path | Tracked? | Referenced? | Verdict | Reason |
|---|---|---|---|---|
| `check_guards.php` (root) | No | No refs | DELETE | One-off guard audit script, superseded |
| `fix_guards.php` (root) | No | No refs | DELETE | One-off fix script |
| `fix_indexes.php` (root) | No | No refs | DELETE | One-off; superseded by migration `2026_08_14_213731_add_performance_indexes_to_tables.php` |
| `replace-tokens.js` (root) | No | No refs | DELETE | One-off codemod |
| `yarn.lock` | **Yes** | No (0 bytes, pnpm repo) | DELETE (T-40.2) | Empty; wrong package manager |
| `.npmrc.bak` | **Yes** | No (`.npmrc` itself is gone) | DELETE (T-40.2) | Stale backup of a deleted file |
| `.jetro/` (daemon/credentials.json) | No (ignored) | Tool cache | DELETE locally (T-40.2) | IDE cache holding local credentials |
| `.cursor/`, `.agents/`, `.impeccable/` | No (ignored) | Tool dirs | KEEP local | Harmless, ignored tooling |
| `.vercel/` (project.json + .env.development.local) | No (ignored) | vercel CLI | KEEP local | Needed for local vercel commands; contains project ids only |
| `User-avatar-image/` (9 PNGs) | No | Identical (md5) to both avatars dirs | DELETE | Triplicate source copy |
| `apps/api/public/avatars/` (9 PNGs) | No | No code refs; prod uses `FILESYSTEM_DISK=s3` | DELETE (or S3) | Runtime uploads should not live in public/ of the image |
| `apps/web/public/avatars/` (9 PNGs) | No | No `avatars/teams` refs found in src | DECIDE: commit if referenced by DB-seeded URLs, else DELETE | If needed by FE, they're currently MISSING from Vercel builds (untracked) |
| `projects/` | No | Empty dir, not ignored | DELETE | Empty |
| `data/` | No (ignored) | Empty dir | DELETE | Empty |
| `docs/archive/planning/` | No (docs/ ignored) | Plan archive | KEEP + back up outside git | T-40.2 wants it intact; it is — locally only |
| `walkthrough.md` | No | Zero refs (Phase 36 summary) | DELETE or move to docs/archive | Orphaned notes |
| `context.md` | No (ignored) | Referenced by AGENT.md | KEEP local | Live AI/architecture context |
| `finalization-report.md` | No | Phase 7 report | MOVE to docs/archive/planning | Root clutter; T-40.2 wants clean root |
| `finalization-2..7.md`, `finalization-7-report.md` (8 files) | **Yes** (root) | Superseded by `finalization.md` | DELETE from git (archived copies exist in docs/archive/planning) | Planning docs tracked at root contradict "clean client repo" intent |
| `finalization.md` | **Yes** | Active plan | KEEP | Current working plan |
| `AGENT.md` / `CLAUDE.md` / `.windsurfrules` | No (ignored) | Identical (same md5); point to context.md+finalization.md | KEEP all three | Already exactly what T-40.2 asks for |
| `scratch/` (40+ scripts) | No | Not ignored (F11) | DELETE + gitignore | Throwaway codemods; plan expects scratch/ ignored |
| `apps/api/dump3.txt` | No | Written by `Phase45MicroFeatureVerificationTest.php:113` | DELETE + fix the test | Test side-effect file |
| `apps/api/fix_controllers.php` | No | No refs | DELETE | One-off |
| `apps/api/orphan_sweep.php` | No | Historical mention in finalization-report | DELETE | One-off data fix, already executed |
| `apps/api/patch_migrations.php` | No | No refs | DELETE | One-off |
| `apps/api/tests/Feature/Feature/PasswordPolicyTest.php` | **Yes** | Duplicate of Feature/PasswordPolicyTest.php | DELETE | Boilerplate in wrong nested dir |
| `apps/web/public/version.json` + `scripts/generate-version.js` | No | Generator not wired into build (F20) | KEEP but COMMIT + wire into build | Needed by T-1.3; currently dead |
| `apps/web/src/components/app-shell/version-guard.tsx` | Yes | Dead duplicate (F20) | DELETE | Working one is `src/components/version-guard.tsx` |
| root `node_modules/` | No (ignored) | pnpm workspace hoist (eslint public-hoist) | KEEP | Normal pnpm artifact, not stray |
| root `.env.local` / `.env.production.local` / `.env.vercel` | No (ignored) | vercel pull artifacts | KEEP (regenerable) or DELETE | Machine-local only; no secrets beyond OIDC token |

---

## PASS list

- `cloudbuild.yaml` + root `Dockerfile` are mutually consistent (root context, `COPY apps/api/...`, AR region matches deploy region, port 8080 = EXPOSE, FrankenPHP/Octane flags match start.sh).
- Smoke endpoints exist: `/api/ping`, `/api/health`, `/api/dashboard/init`, `/api/auth/login` all present in `apps/api/routes/api.php`; cloudbuild smoke correctly fails the build on non-200.
- `composer.lock` exists and is used by the Dockerfile deps layer; `.dockerignore` keeps env/tests/runtime out of the image.
- No `.env*`, `*.log`, `.DS_Store`, `*dump*`, or runtime storage files are tracked; `apps/api/storage/**` tracking is only `.gitignore` keepers; avatars are not committed anywhere.
- Node (24.x / pnpm 9.15.4) and PHP (8.4) pins are consistent across engines, Dockerfile, composer.json, and CI.
- `AGENT.md` = `CLAUDE.md` = `.windsurfrules` (byte-identical) and already point to `context.md` + `finalization.md` per T-40.2.
- Root env files contain no app secrets (Vercel pull metadata only) and are properly ignored.
- `pnpm-lock.yaml` importers match all three package.jsons (no lockfile drift).
- CI api-ci (postgres service, composer install, audit, artisan test) and openapi-ci paths (`apps/api/openapi/openapi.yaml` exists) are structurally sound.

Top priorities to fix first: **F4 (rotate + purge committed secrets), F1/F2 (commit a working deploy.yml or delete it and formalize the Cloud Build path), F5 (rotate the git-remote PAT), F7 (pick ONE worker/scheduler topology — currently start.sh loops vs deploy.yml services would double-process), F13 (add typecheck script or CI breaks).**