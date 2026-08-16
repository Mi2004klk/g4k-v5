# G4K Workplace OS — Production Audit & Remediation Plan

**Audit revision:** 4 (complete fresh re-audit — fully replaces revisions 1–3; the rev-3 copy now in `docs/archive/` is historical only)
**Date:** 2026-08-16 (~06:00 IST) · **Codebase baseline:** `main` @ `d460c24` (working tree clean; `origin/main` == HEAD == deployed source)
**Method — zero trust:** every claim re-proven against current code (file:line), the **live deployment** (HTTP probes + Cloud Run/Cloud Logging + Supabase REST), or fresh local runs (`php artisan test` 71/71, `tsc --noEmit` 0 errors). Nothing carried over from prior audits, task markers, or reports.
**Live services audited:** FE `https://g4k-v5.vercel.app` · API `https://g4k-api-579515345084.asia-south1.run.app` (Cloud Run rev `g4k-api-00082-bhs`, Octane/FrankenPHP) · Worker `g4k-worker` (rev `00006-fdv`) · unmanaged `g4k-git` service · Supabase `jtcgtjrqijdnecwtuspv` (Postgres + Storage bucket `g4k`, empty).

---

## 0. Executive Summary

The application is **functionally broken in daily use on live production**, and this audit found the exact root causes — they are few, deep, and fixable in one focused pass. The codebase itself is substantially complete (auth, RBAC, attendance, leave, tasks, chat, notifications, approvals are all correctly implemented at the controller level; 71/71 tests green; 0 TS errors), but **five systemic root causes break it at runtime**:

1. **Role-resolution split-brain (F-B2)** — the `active_role` DB column is NULL for all 13 users; ~30 controller call-sites read it and silently downgrade **every admin and HR session to "employee"**. Live proof: admin/HR dashboards return all-zero metrics with `"role":"employee"`; `/api/projects` returns an empty list for all three roles. This is why the app "looks completely broken."
2. **Storage subsystem is dead (F-B3)** — `league/flysystem-aws-s3-v3` was never installed, yet the default disk is `s3` (Supabase). Every upload (chat attachments, avatars, project covers, export files) throws a live 500 (`PortableVisibilityConverter not found`, captured in Cloud Logging 23:46 UTC).
3. **Queue worker and scheduler are dead (F-B4/F-B5)** — `queue:work --max-time=3600` exits after 1 h with no supervisor; the dummy HTTP health server keeps the container "healthy" so Cloud Run never restarts it (14 `ProcessAuditLogJob`s stuck at attempts=0, last processed 20:53 UTC). The scheduler produces zero runs. Consequences: audit trail frozen, exports never generate, demo re-seed never completes, all reminders (shift, missed clock-in, holiday, weekly summary) never fire.
4. **Realtime is dead end-to-end (F-B6)** — backend broadcasts to real Pusher cloud with self-hosted-style credentials (every event fails silently in try/catch); frontend only connects if `NEXT_PUBLIC_PUSHER_APP_KEY` is set (it isn't), and two FE channel names don't match BE channels anyway. The app survives in silent polling mode.
5. **Demo data is out of sync and non-purgeable (F-C4)** — the live DB was seeded 3× by an **older, non-idempotent seeder**: 3 duplicate copies of both projects, 3 duplicate announcements, 3 duplicate "General Discussion" groups, **zero `project_members`** (so nobody sees any project), and **no `scope=global` conversation** the current code expects. Content rows carry no `demo_tag`/`is_demo`, so `demo:purge` can never remove them — every re-seed stacks more duplicates.

On top of these: the Reports page crashes for every user (`exports.slice` on a `{data:[]}` envelope), `/api/admin/jobs` 500s (missing controller import), the dashboard leaks the company-wide approval queue to employees, and the full production secret set (DB, Supabase service-role/JWT, storage keys, APP_KEY, demo passwords) is committed in `cloudbuild.yaml` **and** `patch_cloudbuild.py` **and** 3 commits of git history.

**Nothing here requires new product scope.** Phases R0–R7 below take the existing system from "broken on live" to genuinely production-ready.

---

## 1. Demo Access (verified working on live, 2026-08-16)

| Role | Email | Employee ID / username | Password | Notes |
|---|---|---|---|---|
| **Admin (super_admin)** | `g4kkarthik@gmail.com` | G4K040 / `karthik` | `Admin@123` | user id 40, dept 11 |
| **HR** | `hr@games4king.in` | G4K041 / `aravind` | `Hr@123` | user id 41, dept 11 |
| **Employee** | `praveen@games4king.in` | G4K042 / `praveen` | `Dev@123` | user id 42, dept 10 |

All three authenticate on live (`POST /api/auth/login` → 200, 51-char Sanctum tokens). Dataset on Supabase: 13 users (1 admin, 1 HR, 11 employees incl. dual-role `vignesh@games4king.in` employee+hr and new-joiner `priya@games4king.in`), 3 departments, 45 tasks (all assigned), 24 leave requests, 590 attendance events / 300 attendance days, 6 conversations / 51 messages, 3 QA forms + 3 submissions, 7 holidays 2026, 11 settings rows, 9 leave balances, 18 approvals.
**These credentials are also printed into every Cloud Build log by SmokeCheck and are committed in `cloudbuild.yaml:119` — treat them as public. Rotate at real cutover (R0.1) and keep them stable across demo re-seeds (R5) so smoke + manual QA keep working.**

---

## 2. Findings Register (all fresh; evidence = file:line at `d460c24` or live capture)

### P0 — Blockers (app cannot go to day-to-day use)

- **F-B1 · Full production secret set committed** — `cloudbuild.yaml:29,58,79,95` (DB password, APP_KEY, AWS/Supabase storage keys, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, Pusher/Reverb secrets) **plus a second full copy in `patch_cloudbuild.py:17,52,68`** plus demo passwords at `cloudbuild.yaml:119`. History: fragments exist in ≥3 commits (earliest 2026-08-14, `47ded1e`/`a91871b`), all pushed to GitHub. The AWS secret and the Supabase service-role JWT are the **same value**.
- **F-B2 · Role-resolution split-brain (the "app is broken" root cause)** — Login embeds the role in the Sanctum token ability `role:<role>` (`AuthController.php:220`) and `RequireCapability` middleware correctly reads it (`app/Http/Middleware/RequireCapability.php:20-33`), **but** the FE sends single-role users straight to `/dashboard`, skipping role-select (`app/(auth)/login/page.tsx:78-82`), so the `users.active_role` column is never persisted — confirmed NULL for all 13 users on live. ~30 controller call-sites read `$user->active_role ?? 'employee'` directly: `ProjectController::userHasManage`, `DashboardController:20,109`, `AttendanceController:85,270,284,447,488,747`, `ChatController:201,228,246`, `TaskController:42`, `TimerController:35`, `ReportController:17`, `LeaveRequestController:25`, `AnnouncementController:80,110`, `PinController:32,46`, `AuthController:534,634`. **Live impact:** admin/HR treated as employees everywhere these are read → `GET /api/projects` = `data:[]` for **all** roles (admin/HR fail the manage check → fall into `created_by`/member scoping → empty), `GET /api/dashboard/init` returns employee metrics (`active_projects:0, pending_tasks:0, role:"employee"`) for admin and HR.
- **F-B3 · Storage subsystem dead** — `config/filesystems.php:16` defaults to `s3` disk (Supabase storage env present in Cloud Run), but `league/flysystem-aws-s3-v3` is absent from `composer.json` and `vendor/league/` (only flysystem core+local). **Live error captured:** `Class "League\Flysystem\AwsS3V3\PortableVisibilityConverter" not found` (Cloud Logging 2026-08-15 23:46:22 UTC, userId 40). Affected flows: chat attachments (`ChatController::sendMessage` → `store(..., $disk)`), avatar/profile uploads, project covers (`/projects/cover`), export file writes (`GenerateReportJob`). Supabase bucket `g4k` exists but is **empty** (0 objects) — no demo files either.
- **F-B4 · Queue worker dies silently after 1 h** — `start-worker.sh:9` runs `queue:work database --tries=3 --max-time=3600` as a background child; nothing restarts it; `exec php -S 0.0.0.0:8080` (dummy health server) is PID 1, so Cloud Run sees a healthy container forever (min-instances=1). **Live proof:** last job processed 20:53:12 UTC; 14 `ProcessAuditLogJob`s stuck at attempts=0 with available_at from 21:45 UTC onward (jobs pushed by plain HTTP activity, including this audit's logins). Consequences right now: **audit trail frozen**, exports/notifications-from-jobs/demo re-seed never run.
- **F-B5 · Scheduler dead** — all three 5-minute jobs are queue-backed (`RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts` all `implements ShouldQueue`), so a live scheduler would push rows into the `jobs` table every 5 min. The `jobs` table contains **only** `ProcessAuditLogJob` rows — zero scheduler pushes in the evidence window → `schedule:work` (worker) is not executing, and the `g4k-scheduler` Cloud Run **job** (`cloudbuild.yaml:81-95`) has no external Cloud Scheduler trigger defined anywhere in the repo, so it never runs either. The 1-minute "Scheduler heartbeat" log has never appeared in Cloud Logging (Laravel logs go to container files, not stdout — also an observability gap). Net: **no reminders, no weekly Sunday summary, no holiday reminders, no `sanctum:prune-expired`/`passwords:expire-flag`/`notifications:cleanup`** ever run on production.
- **F-B6 · Realtime broken end-to-end** — (a) BE `BROADCAST_CONNECTION=pusher` with self-hosted-style creds (`PUSHER_APP_KEY=g4k_key_3829`) but no `PUSHER_HOST` → Laravel sends to real `api-ap2.pusher.com` → every broadcast fails (all wrapped in try/catch, e.g. `ChatController:105-108`, so failures are silent warnings). (b) FE connects only when `NEXT_PUBLIC_PUSHER_APP_KEY` is set (`use-reverb.ts:38-40`) — not present in any env file; presumably unset on Vercel → Echo never initializes. (c) Channel mismatches regardless: FE listens on public `announcements`… `window.Echo.channel("public-announcements")` (`announcement-board.tsx:33`) vs BE `private-org.announcements`; FE subscribes `exports` (`export-history.tsx:24-28`) vs BE `ExportCompleted` → `private-user.{id}`. Net: chat/bell fall back to polling; spec's "real-time updates" is not live.

### P1 — Broken features / live defects

- **F-C1 · `/api/admin/jobs` and `/api/admin/jobs/retry` → 500** — `routes/api.php:337-338` use bare `SettingsController::class` with no `use` import (every other reference uses FQCN `\App\Http\Controllers\SettingsController`). Live stack: `Target class [SettingsController] does not exist` (captured 23:56:07 UTC).
- **F-C2 · Reports page crashes for every user** — FE `export-history.tsx:55` calls `exports.slice(0,3)` on the query data; BE `ReportController::exports` (`ReportController.php:123-131`) returns `{data:[...]}`. Object fails `length===0` check → TypeError `c.slice is not a function`. Reproduced on live (`/dashboard/reports` error boundary). The whole Reports & Analytics page is unusable.
- **F-C3 · Dashboard announcements + quick-notes widgets always empty** — widgets select `Array.isArray(data.announcements) ? … : []` (`announcement-board.tsx:24-26`, `quick-notes.tsx:24`) but `DashboardController::init` embeds the wrapped `{data:…}` responses of `AnnouncementController::index` / `QuickNoteController::index`. Live-proven: "No announcements yet" while Supabase has 3 announcements. Same envelope-mismatch class as F-C2.
- **F-C4 · Demo dataset drifted, duplicated, non-purgeable** — (a) `Phase42DemoSeeder` uses blind `Project::create()` (`:247,256`), `Announcement… create()`, `Conversation::create(['scope'=>'group','name'=>'General Discussion'])` (`:381,395`) with **no `demo_tag`/`is_demo`** → live DB has each project ×3 (ids 3–8), announcements ×3 (ids 2–4), "General Discussion" ×3 (39 memberships), and `demo:purge` (which deletes only `whereNotNull('demo_tag')` or `is_demo=true` rows — `DemoPurgeCommand:38-48`) removes **none** of it. (b) `project_members` is never seeded anywhere (0 rows on live) → employees have no projects even after F-B2 is fixed. (c) No `scope='global'` conversation on live (old seeder predates the current `firstOrCreate(['scope'=>'global'])` at `DatabaseSeeder:282`) → the Global Chat the code references (chat list `orWhere('scope','global')`, `PostTaskCompletionToGlobalChat` listener) doesn't exist on live. (d) Users/departments/holidays/settings are idempotent (firstOrCreate/updateOrInsert) — those are fine.
- **F-C5 · Dashboard leaks company-wide approvals to employees** — `DashboardController::init` `pending_approvals` closure (`DashboardController.php:43-70`) queries **all** pending leave requests and all tasks in `review` with no role/user scoping (`$activeRole` captured but unused). Live-proven: employee Praveen's dashboard lists Rahul's "Family function" leave request. Data-leak + wrong UX.
- **F-C6 · Announcement scoping/global-cache defects** — `AnnouncementController::index` returns all announcements with no `team` scope filtering (team-targeted announcements leak company-wide), and `DashboardController` caches it under the single key `announcements_all` for **all** users (`DashboardController.php:95`).
- **F-C7 · Deploy pipeline unsafe** — (a) migrations run only on `g4k-api` cold start and failures are swallowed: `start.sh:6` `php artisan migrate --force --isolated || echo "WARN…"`; worker/scheduler containers never migrate; the `MigrateStatus` build step is read-only. (b) `deploy.sh:4` deploys `g4k-api --source .` into project `jtcgtjrqijdnecwtuspv` — that's the **Supabase ref**, not a GCP project; running it breaks/fails. (c) SmokeCheck `if [ -n "$TOKEN" ]` has no else (`cloudbuild.yaml:123`) → total auth outage still passes the build. (d) FE (Vercel) and BE (Cloud Build) deploy independently with no shared build-id or post-deploy schema assertion.
- **F-C8 · Audit trail not recording** — `AuditLogger` dispatches `ProcessAuditLogJob` (queued) → with F-B4 dead, every action since ~21:39 UTC is unlogged (live: 46 rows, all older; 14 jobs stuck). Spec requires a complete audit log.
- **F-C9 · Exports triple-broken** — queued job (dead queue, F-B4) writing to s3 disk (missing adapter, F-B3) and broadcasting on a channel FE doesn't listen to (F-B6). Spec: "Export format: Excel" for attendance/projects/tasks reports.
- **F-C10 · CI never tests against Postgres** — `phpunit.xml` pins `DB_CONNECTION=sqlite`/`:memory:`, neutering the `postgres:16` service container in `ci.yml`; the Postgres-only failure class (enum CHECK/jsonb) has already reached production twice historically.
- **F-C11 · GitHub PATs embedded in remote URLs** — `git remote -v` contains `ghp_…` tokens (origin + frontend remotes) in local `.git/config`; revoke and use a credential manager.
- **F-C12 · Unmanaged `g4k-git` Cloud Run service** — image `g4k-git:ba36045…` from repo `arsathmalik0-netizen-g4k`, not defined in `cloudbuild.yaml`; either someone's git-remote host or an orphan — undocumented either way.

### P2 — Polish / spec deltas / debt

- **F-D1 · Mobile bottom navigation bar missing** — spec §8 requires a max-5-icon bottom bar; only the hamburger Sheet exists (`dashboard/layout.tsx:102`).
- **F-D2 · Employee sees "Reports & Analytics"** — employee capability list includes `reports.view` (`CapabilityMatrix.php:32`); spec gives reports to Admin (full) and HR (limited). Decide: hide for employees or restrict to own-data report.
- **F-D3 · Litter** — committed: `fix_hr_scope.py`, `patch_cloudbuild.py` (contains secrets — handled in R0), `apps/web/resize_icons.py`; untracked local: 15× `fix_*.js`/`migrate_*.js` codemods in `apps/web/`, `apps/api/error_log.json`, `tests_output.log`.
- **F-D4 · README inaccurate** — says Laravel 11 (composer: `laravel/framework ^13.8`), Next.js 14 (package: `next 16.2.12`), "Pusher WebSocket integration" (dead, F-B6), "Deployment is Perfect and Fully Synced", "runs migrations" (F-C7a) — no env matrix, topology, rollback, or troubleshooting content.
- **F-D5 · Two `vercel.json` files** — root (active, rootDirectory=null) + `apps/web/vercel.json` (dead, divergence hazard).
- **F-D6 · a11y residuals** — duplicate "Skip to content" links rendered on live; verify remaining `htmlFor`+id in org/users dialogs, `aria-live` on offline banner.
- **F-D7 · 422 inline field errors partial** — leave form consumes `err.errors` (`leave-request-form.tsx:49-50`); task/project/user creation forms don't yet.
- **F-D8 · `packages/ui` `main` → `./dist/index.js` never built** — works today only because all 351 imports use subpaths transpiled from source; a bare `@g4k/ui` import would break; CI never builds it.
- **F-D9 · Task-approval route strings** — dashboard approvals payload uses `'/tasks/'.$id` (`DashboardController.php:67`); actual FE route is `/dashboard/tasks/{id}`.
- **F-D10 · `g4k-scheduler` Cloud Run job duplicate-scheduling risk** — once a trigger exists it can double-run with the worker's `schedule:work`; keep exactly one scheduler (R2.3).
- **F-D11 · Logs to container files** — Laravel/scheduler/queue logs write to `storage/logs` + `/tmp/scheduler.log` (ephemeral, invisible in Cloud Logging); stdout only carries job RUNNING/DONE lines.

### Verified working (re-proven this revision — do not re-litigate)

Auth: login (3 roles), lockout counter/window (5 fails/10 min + `retry_after`), throttle `6,1` on login, forgot-password (in-app admin-approval request + optional SMTP reset), FE 401→single-flight silent refresh via HttpOnly cookie (`api-client.ts:21,54-77`), onboarding gate, `must_change_password` handling.
RBAC: DB-driven `role_capabilities` matrix with `*` for super_admin and `SELF_SERVICE_EXCLUDED`; `RequireCapability` middleware token-aware; capability-gated sidebar (`dashboard/layout.tsx:45-60`).
Domain logic: attendance punch pipeline (idempotent `client_id`, ±5 min/48 h timestamp bounds, transactional `AttendanceService::recordEvent`, company-timezone reconcile with 10-min grace, per-user/day cache invalidation); leave flow (overlap guard, balance check, approval chain, HR-scope authorization, decision cache invalidation); task lifecycle (QA required-field gating on submit, submit→review→approve/redo with `ApprovalService`, task activity, comments, reorder, `TaskCompleted` event → `PostTaskCompletionToGlobalChat` listener registered); chat (access checks, unread counts, read receipts with `MessageRead`, mentions→notifications, DM dedup in `startDirectMessage`/`FeedbackController`/`DirectoryController`, group create, message pinning); notifications synchronous (`Notification::create` + `NotificationService`) — unaffected by dead queue; bell = high-priority count; capability matrix cache with invalidation.
Frontend: 27 pages matching spec screen-map; api-client with refresh mutex; kanban, Gantt/timeline, command palette (Ctrl+K), drafts, offline indicator, mentions UI, read receipts, pinned messages, quick notes, recurring tasks, breadcrumbs, skeletons/empty states/toasts/confirm dialogs (spot-verified in code); `transpilePackages:['@g4k/ui']`.
Gates: `php artisan test` **71 passed / 597 assertions / 0 skipped** (sqlite); `tsc --noEmit` **0 errors**; FE build green per CI.
Infra: Dockerfile PHP 8.4 + required extensions; Octane/FrankenPHP serving on 8080; storage bucket exists (private); `.env.*` and `.vercel/` correctly untracked; `command-menu` fully removed; local == origin == deployed commit.

---

## 3. Remediation Plan (dependency-ordered phases)

> Each task: Problem → Fix → Acceptance/Verification. No new product scope. No cosmetic patches — every fix addresses the root cause named above. Estimate: R0 ≈ 0.5–1 d · R1 ≈ 0.5 d · R2 ≈ 1 d · R3 ≈ 1 d · R4 ≈ 0.5–1 d · R5 ≈ 1 d · R6 ≈ 1 d · R7 ≈ 0.5 d.

### R0 — Security closure (do first; independent of everything else)

- **R0.1 Rotate every secret** (all are burned on GitHub): Supabase DB password, service-role key, JWT secret, storage (AWS-style) keys, APP_KEY, Pusher/Reverb values, SMTP creds. Verify old values rejected: login, `/api/ping`, storage upload, broadcast auth.
- **R0.2 Move secrets to Secret Manager** — rewrite `cloudbuild.yaml` deploy steps to `--set-secrets=` (zero plaintext); SmokeCheck credentials read from a Secret Manager value (or a dedicated `smoke@g4k` demo account created in R5 so real demo passwords never appear in build logs). Delete `patch_cloudbuild.py`, `fix_hr_scope.py`, `apps/web/resize_icons.py`.
- **R0.3 Purge git history** — `git filter-repo` (or BFG) removing `cloudbuild.yaml` secrets and `patch_cloudbuild.py` → force-push → re-clone everywhere. Accept: `git log --all -S'<fragment>'` empty for each rotated-then-removed secret. **R0.1 must complete before this has value.**
- **R0.4 Kill embedded PATs** — revoke both `ghp_…` tokens; re-add remotes without credentials (use credential manager).
- **R0.5 Supabase defense-in-depth** — with service-role key API-only: enable RLS on all public tables with **no** anon policies (anon key useless), keep service-role for the API only. Verify `/rest/v1/…` with anon key returns empty/errors and the app is unaffected.
- **R0.6 Decide `g4k-git` service** (F-C12) — document its purpose or delete it.

### R1 — Role resolution: one source of truth (F-B2) — the #1 functional fix

- **R1.1 Introduce a single resolver.** Add `User::resolveActiveRole(Request $request): string` (or a request attribute set by `RequireCapability`): priority = token ability `role:*` → `active_role` column → primary role from `role_assignments` → `employee`. The token IS the session's role (it already encodes role-select); the column becomes a cache only (multi-device safety).
- **R1.2 Replace all ~30 direct `->active_role ?? 'employee'` reads** listed in F-B2 with the resolver (mechanical, verifiable by `grep -rn "active_role ??" app/` → 0 hits outside the resolver).
- **R1.3 Persist best-effort at login/role-select** (keep column fresh for observability) but never read it for authorization.
- **Acceptance (live):** fresh `POST /auth/login` (no role-select) as each role → `/api/dashboard/init` returns `role:"super_admin"/"hr"` with populated company metrics; `/api/projects` non-empty for admin+HR (after R5 also for employee); employee still scoped to self. Extend `RoleMatrixTest`: assert resolver for all three roles with a login-only token; assert a second device's role-select cannot change another session's role.

### R2 — Runtime services: storage, queue, scheduler, exports (F-B3, F-B4, F-B5, F-C8, F-C9)

- **R2.1 Fix storage (root fix).** Add `league/flysystem-aws-s3-v3:^3.0` to `apps/api/composer.json`; configure the Supabase S3-compatible endpoint in `config/filesystems.php` (endpoint `https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/s3`, region `ap-south-1`, `use_path_style_endpoint`, bucket `g4k`, `throw`); keys via rotated Secret Manager values. Accept: `php artisan tinker` → `Storage::disk('s3')->put('healthcheck.txt',…)` + `url()` roundtrip; live avatar upload → public/signed URL renders; chat attachment send → URL downloadable. Add a feature test using a mocked/fake disk for the upload paths.
- **R2.2 Make the worker un-killable.** Replace `start-worker.sh` backgrounding with a supervision loop: `while true; do php artisan queue:work database --tries=3 --backoff=60 --sleep=3 --max-time=3600 || true; sleep 2; done` (max-time still recycles the process for memory hygiene — the loop restarts it) and run **queue output to stdout** (drop `>> file` redirects). Same treatment for `schedule:work`, or move to `supervisord` in the image. Accept: deploy → wait >65 min → push a job → processed <60 s; `gcloud logging` shows continuous worker output; zero stuck rows in `jobs` after 24 h.
- **R2.3 Exactly one scheduler.** Decision: **keep `schedule:work` in the worker** (R2.2) and **delete** the `g4k-scheduler` Cloud Run job + its `cloudbuild.yaml` block (F-D10), *or* run Cloud Scheduler → `g4k-api /api/scheduler` endpoint (requires new authenticated route) and drop `schedule:work`. Pick one; remove the other from code + infra. Route scheduler output to stdout. Accept: live `jobs` table receives the three 5-min jobs every 5 min (queryable via Supabase REST), heartbeat log visible in Cloud Logging, `schedule:interrupt`-free 24 h without duplicates.
- **R2.4 Drain + verify.** After deploy: stuck `ProcessAuditLogJob`s process; `failed_jobs` stays 0; audit rows resume (create a user → row appears <60 s).
- **R2.5 Exports end-to-end.** With R2.1+R2.2 fixed: `GenerateReportJob` writes to storage and records a download URL on `export_jobs`; FE `use-export` receives `{job_id}` → toast; `export-history` shows status and downloads. Accept (live): Admin → Reports → attendance export (Excel) → file downloads; export appears in history; bell notification on completion.

### R3 — Routes, envelopes, scoping (F-C1, F-C2, F-C3, F-C5, F-C6, F-C9-channel, F-C10)

- **R3.1 Fix the route bug** — qualify `\App\Http\Controllers\SettingsController::class` at `routes/api.php:337-338`. Accept: live `/api/admin/jobs` → 200 with queue/failed counts (now meaningful with R2 telemetry).
- **R3.2 Envelope contract + FE unwraps.** Decide the rule: list endpoints return either a paginator or `{data:[…]}` — FE normalizes via an `asArray(res)` helper applied at every `useQuery` consumer (complete rev-3's partial adoption; 21 wrapped endpoints enumerated in audit). Fix now: `export-history.tsx` (unblocks Reports page), `announcement-board.tsx`, `quick-notes.tsx` widgets (unwrap `res.data`). Add response-shape assertions to the feature tests for wrapped endpoints. Accept: Reports page renders for admin/HR with export history; dashboard announcements + quick-notes widgets show live data.
- **R3.3 Scope the dashboard.** `pending_approvals`: employees → only **their own** submissions; HR → their managed scope; admin → all (use the R1 resolver + `HrScope`). `announcements_all` cache → per-role/user key; `AnnouncementController::index` → filter `team` scope by membership/managed departments. Accept: employee dashboard no longer lists others' leave reasons (regression test: two employees, cross-check payloads); team announcement invisible to other-team employee.
- **R3.4 Fix approval deep-links** — `'/tasks/'.$id` → `/dashboard/tasks/{id}`; leave route already correct.
- **R3.5 Postgres-parity CI** — remove the sqlite pin from `phpunit.xml` in a dedicated matrix job: run the feature suite against the `postgres:16` service container (env already scaffolded in `ci.yml`); keep the fast sqlite job for PR feedback. Accept: job green; deliberately reintroduce a CHECK-violating value in a branch → job fails (prove it catches the class).

### R4 — Realtime: make it actually real (F-B6)

- **R4.1 Deploy Laravel Reverb** (already a composer dep) as `g4k-reverb` Cloud Run service (websockets on 8080, public, min-instances=1, secrets via R0 channel). Point BE `BROADCAST_CONNECTION=reverb` + Reverb creds at it; FE `NEXT_PUBLIC_PUSHER_APP_KEY/HOST/PORT` (wss, 443) set on Vercel. (Alternative if Reverb-on-Cloud-Run proves unstable: paid Pusher with real credentials — same FE/BE shape. Do **not** keep the current half-config.)
- **R4.2 Fix channel contracts** — FE listens `private-user.{id}` for `NotificationCreated`/`ExportCompleted`/`ApprovalDecided`; `private-conversation.{id}` for `MessageSent`/`MessageRead`; announcements on the same channel BE uses (make it `private-org.announcements` on both sides); `ConversationCreated` FE listener → invalidate `["conversations"]` (closes rev-3 F-9). `broadcasting/auth` is already Sanctum-guarded (`routes/api.php:53`).
- **R4.3 Socket-aware UX** — keep polling fallbacks; surface connect state; verify reconnect resumes subscriptions.
- **Accept (live):** two browsers as employee+HR: DM appears <2 s without reload; read receipts update; bell badge increments live; announcement appears on dashboard without refresh; export completion invalidates history. Zero console `websocket error` floods.

### R5 — Demo data v2: synced, purgeable, everything populated (F-C4)

- **R5.1 Rewrite the seeders idempotent + tagged.** Every content row gets `demo_tag='g4k-demo'` (and `is_demo=true` where the column exists). Replace all blind `create()` in `Phase42DemoSeeder` with `firstOrCreate` keyed on natural keys (or rely on purge-first). Seed: `project_members` for both projects (dept members + HR + admin), one `scope='project'` conversation per project (mirroring `ProjectController::store` behavior), the `scope='global'` conversation, a pinned + a normal announcement, leave requests across statuses (incl. pending for HR and pending HR-leave for admin), 14 days attendance incl. late/overtime cases and today-partial state, QA forms attached to tasks with submissions, quick notes + pins for admin, one completed export job example. Keep the three credential accounts from §1 byte-identical (hashes unchanged).
- **R5.2 Fix purge to the same contract.** Delete by `demo_tag` + `is_demo` across **all** content tables (order-aware), cascade user-owned rows (tokens, memberships, notifications, pins, notes, preferences), delete storage objects under demo prefixes (R2.1 makes this possible), and clear the full cache-key set (`holidays_{y±1}`, `dashboard_init_*`, `user_metrics_*`, `user_prefs_*`, `pending_approvals_*`, `announcements_*`, `role_capabilities_*`, `team_today_*`, `report_*`, `dashboard_global`).
- **R5.3 Async re-seed path.** `DemoDataController` → `PurgeDemoDataJob`/`SeedDemoDataJob` (now that R2 fixed the queue) with 202 + completion notification to the admin; FE `demo-data-config.tsx` shows job state. `demo:seed --fresh` = purge → seed chain with the **fixed** seeders.
- **Accept (live, scripted):** run seed→purge→seed→purge→seed three times → row counts identical each cycle (no growth); all three §1 logins work; **employee sees 2 projects with members, tasks, timers; HR sees team attendance + pending approvals; admin sees populated company dashboard; chat lists Global + project + direct + group; dashboards show announcements/quick-notes/pins**; no page in the app shows an unintended empty state. Compare against a fresh local `migrate:fresh --seed` snapshot for parity.

### R6 — Spec/UX completion + hygiene (F-D1–F-D11)

- **R6.1 Mobile bottom nav** (spec §8): max-5 icons (Dashboard, Attendance, Projects, Chat, Profile), ≥48 px targets, hide on ≥md; keep hamburger Sheet for full nav.
- **R6.2 Employee reports decision** (F-D2): hide nav entry for employees (`reports.view` removed from employee caps or page self-scopes to own attendance/task stats). Spec-align: HR limited, Admin full.
- **R6.3 a11y pass** (F-D6): dedupe skip-link; `htmlFor`+id pairs in org/users creation dialogs; `aria-live="polite"` on offline banner; keyboard drill (tab/esc/enter) through nav + dialogs + kanban.
- **R6.4 422 inline errors everywhere** (F-D7): extract the `leave-request-form.tsx:49-50` pattern into a shared helper; apply to task create/edit, project create/edit, user create, work-schedule forms. Accept: invalid leave dates show field-level messages (T-6.3 acceptance).
- **R6.5 Housekeeping** (F-D3/D5/D8): delete committed junk + local codemod scripts + `error_log.json`/`tests_output.log`; delete `apps/web/vercel.json`; add `pnpm --filter ui build` to CI or point `main` at source with `exports`.
- **R6.6 README rewrite** (F-D4): true stack (Laravel 13/Octane-FrankenPHP, Next 16), env matrix (secret → where it lives), topology (api + worker(queue+scheduler) + reverb + Vercel + Supabase), deploy/rollback, troubleshooting (worker liveness, broadcast, storage), credential management policy. Remove "Deployment is Perfect" until R7 gates pass.
- **R6.7 Log routing** (F-D11): stdout for queue/scheduler/app logs (`LOG_CHANNEL=stderr`), so Cloud Logging is complete.

### R7 — Pipeline coupling + final validation gates (F-C7, sign-off)

- **R7.1 cloudbuild hardening** — real `php artisan migrate --force` step (fail build on nonzero); post-deploy gate `migrate:status` asserts 0 pending; SmokeCheck gains an `else` → fail on missing token; smoke matrix = 3 roles × {`/dashboard/init`, `/notifications`, `/directory`, `/admin/jobs`} (admin) scripted in-build.
- **R7.2 deploy.sh** — rewrite to wrap `gcloud builds submit` with correct GCP project/region, or delete it (cloudbuild trigger is the deploy path).
- **R7.3 FE/BE coupling** — shared build-id: Cloud Build passes the SHA to a Vercel deploy hook (or documented strict order BE→FE); post-deploy FE probe hits `/login` 200 + one authenticated API call.
- **R7.4 Final production-readiness gates (all must be green on live, in one scripted run):**
  1. Suites: phpunit 71+ green **incl. postgres-parity job**; `tsc` 0; web build checks ON; `pint` clean.
  2. Live 3-role matrix (§1 creds): every endpoint 200, dashboards role-correct, zero unintended empty states.
  3. Workflow chains E2E on live: clock-in→break→clock-out (timer + reconciliation); leave request→HR approve→balance decrement + `on_leave` attendance; task progress→QA-gated submit→approve / redo; project complete→review→approve; quick-task assign→employee completes→Global Chat post; complaint→DM to HR + high-priority bell; @mention→notification; announcement→dashboard widget + chat board; export→download + history + bell; dual-role (`vignesh`) switch → correct dashboard per role; forgot-password→in-app approval→reset→login; lockout after 5 fails with countdown.
  4. Async health: queue drain <60 s; audit row appears <60 s after action; scheduler fires each 5-min job exactly once per 5 min (dedup verified); 24 h Cloud Logging: zero `SQLSTATE`/`BindingResolution`/`PortableVisibility`/repeat-500s.
  5. Realtime drill (R4 acceptance) + offline banner drill + responsive 360/768/1536 + both themes + console-error-free pass for all roles.
  6. Security: `git log --all` secret scan clean; old credentials rejected; anon-key RLS probe; cache-isolation probe (two same-dept employees get distinct reports); rate-limit 429 drill; lockout drill.
  7. Demo drill: seed→purge→seed idempotency (R5.3) executed **on production** ending in the fully-populated state; every §1 credential works.
  8. Rotate demo/production passwords at real cutover (after acceptance demo), update §1 + smoke secret accordingly.

---

## 4. Deployment Runbook (post-remediation order)

1. **Pre:** R0 complete (rotated + Secret Manager + history purged + PATs revoked); DB backup (`pg_dump` + restore drill into staging schema).
2. **Backend:** merge R1–R3, R5 fixes → CI (tests + postgres job + migrate gate) → Cloud Build deploys `g4k-api` + `g4k-worker` (+ removes `g4k-scheduler` job per R2.3, deploys `g4k-reverb` per R4).
3. **Verify infra:** `/api/health` 200; `/api/admin/jobs` 200 with fresh timestamps; worker logs streaming; scheduler pushes visible in `jobs` table; reverb websocket accepting connections.
4. **Frontend:** Vercel deploy (same SHA) with `NEXT_PUBLIC_PUSHER_*` + `NEXT_PUBLIC_API_URL` set; probe `/login` + one authenticated call.
5. **Data:** run demo re-seed (R5.3) on live → verify §1 logins + populated state per R5 acceptance.
6. **Drain & monitor:** process stuck jobs, drain `failed_jobs`, 24 h log watch, then R7.4 gate run.
7. **Rollback plan:** previous Cloud Run revisions (image tags preserved); Vercel instant rollback; migrations are additive-only by convention — never write destructive migrations in a fix release; DB restore from step-1 dump as last resort.

---

*End of revision 4. This file is the single authoritative audit + roadmap; the previous revision lives in `docs/archive/PRODUCTION-AUDIT-AND-REMEDIATION-PLAN.md` (rev 3) for history only. R0 (secrets) and R1 (role resolver) unblock everything else — start there.*
