# Games4King — Production-Readiness & Workflow Audit Report

**Audit date:** 2026-08-28
**Scope:** Entire codebase, code-first — every finding below was derived from and verified against source code (`apps/api` Laravel 11 + `apps/web` Next.js 16 + `packages/ui`). No existing documentation was used as an input.
**Verdict:** **NOT PRODUCTION READY.** The application is feature-rich and the majority of workflows are correctly implemented, but there are **9 critical** findings (including an unauthenticated API backdoor, an admin-surface lockout in the frontend router, and several guaranteed-500 core operations), **19 high**, **~35 medium**, and **~30 low** findings that must be triaged before handover.

> Manual testing has confirmed most functionality works. That is consistent with this audit — most findings live in edges (admin router, phase/delete operations, demo tooling, scope escalation paths, background/realtime plumbing) that routine happy-path testing does not exercise. The codebase is the source of truth for this report; if the deployed build differs from `HEAD`, findings marked UI/API may differ in production until a rebuild.

---

## Contents

1. [System Snapshot](#1-system-snapshot)
2. [Verified Working](#2-verified-working)
3. [Critical Findings (P0)](#3-critical-findings-p0)
4. [High Findings (P1)](#4-high-findings-p1)
5. [Medium Findings (P2)](#5-medium-findings-p2)
6. [Low Findings (P3)](#6-low-findings-p3)
7. [Cross-Cutting Themes](#7-cross-cutting-themes)
8. [Recommended Remediation Order](#8-recommended-remediation-order)

---

## 1. System Snapshot

| Layer | Details (from code) |
|---|---|
| Backend | Laravel 11 (`apps/api`), Sanctum tokens (15-min access + 7-day refresh, rotating, cookie `g4k_refresh_token`), capability-based RBAC via `role_capabilities` table (`super_admin` `*`; `hr` 23 caps; `employee` 9 caps) |
| Database | PostgreSQL (enum CHECKs, partial indexes); SQLite fallback for tests |
| Frontend | Next.js 16 App Router (`apps/web`), TanStack Query, zustand, react-hook-form + zod, Tailwind 4, `@g4k/ui`, laravel-echo/pusher-js, echarts, dnd-kit, frappe-gantt, react-grid-layout |
| Realtime | Broadcast events on chat/notifications/tasks/attendance; polling fallbacks (15–30 s) |
| Jobs | `QUEUE_CONNECTION=database`; worker = Cloud Run service `g4k-worker` (`schedule:work` + `queue:work`); scheduler runs 12 jobs (attendance nudges, reminders, cleanups, weekly summary) |
| Deploy | Cloud Build → Cloud Run (`cloudbuild.yaml`), Vercel artifacts present |

Roles: `super_admin`, `hr`, `employee`. HR scope everywhere = departments assigned via `department_hr` pivot (`HrScope`).

---

## 2. Verified Working

Confirmed correct by code trace (representative, not exhaustive):

- **Auth:** login by email/username/employee-id with timing-attack-safe hash check; 5-strike lockout (10 min, `failed_attempts`/`lockout_until`); rate limiters; refresh-token rotation + `EnsureTokenIsNotRefresh` blocks refresh ability from API use; password reset with hashed 60-min tokens and global token revocation (`AuthController.php`); `ForcePasswordChange`/`ForceOnboarding` gates (dormant-but-correct default — see M-3); session list/revoke with notification; max-device enforcement.
- **Capability RBAC:** route-level `capability:` middleware with `|` any-match (`RequireCapability.php`); seeded matrix matches UI gating for the standard role set.
- **Attendance:** row-locked punch state machine with legal transitions, auto break-close on clock-out, overnight-shift date attribution, 48-h reconcile window, `client_id` idempotency; late calculation via schedule grace; holiday-aware; corrections with reasons + notifications + audit + recompute; ETag caching on reads; portable SQL (verified: no `FIELD()`/`GROUP_CONCAT`; priority sorts use `CASE WHEN`; case-insensitive search uses `LOWER(?)`).
- **Leave:** overlap guard, working-day calculation (schedule + holidays), balance checks at submission, approval chain employee→HR→super_admin with self-block, balance refund on reject-after-approve/cancel, attendance `markLeaveDays` skips worked days, HrScope-enforced decisions.
- **Projects:** lifecycle `active → review → completed/redo` with submit gating on all-tasks-done + QA answers; auto project conversation + member notifications; portable pagination; soft delete cascade.
- **Tasks:** participant-scoped visibility; assignee-restricted edit fields; status machine with blocked-by cycle guard (BFS); QA-enforced submission path; approve/redo with notifications and project-chat posts; recurrence on completion.
- **Chat:** membership checks, DM dedup, attachments (type/size validated), mentions validated against members, read receipts, unread counts, throttles.
- **Exports:** async ExportJob pipeline with status/retry/download, notification on completion, CSV formula-injection sanitization, 30-day cleanup.
- **Audit:** immutable audit logs (DB triggers), login attempt logging with IP/location, `AuditLogger` used across mutations.
- **Frontend:** auth store with cross-tab BroadcastChannel sync, single-flight 401 refresh with Web Locks, offline IndexedDB queue with de-duplicated punch replay, optimistic chat, widget dashboard with persisted layout, URL-state filters, error boundaries per segment, CSP headers, axe-core in dev.

---

## 3. Critical Findings (P0)

### C-1. Unauthenticated impersonation backdoor route
- **Evidence:** `apps/api/routes/api.php:401` — `GET /api/test-projects` sits **outside** the auth middleware group, force-logs-in `praveen@games4king.in` (`auth()->setUser($user)` + user-resolver override) and returns `ProjectController::index`. Additionally, repo-root script `fix_test_route.php` exists whose sole purpose is to **re-inject this route** if it's ever removed — so a naive deletion will silently regress.
- **Expected:** no unauthenticated data access; no hardcoded user impersonation.
- **Impact:** anyone who can reach the API can dump the (real) projects list as that user. A blueprint for worse: any future controller change widens the leak.
- **Fix:** delete the route **and** `fix_test_route.php`, `test-fetch.js`, `fix_per_page.js` from the repo; grep CI for `/test-projects` to prevent reintroduction.

### C-2. Frontend router locks every role out of Settings, Audit, Reports, and Admin pages
- **Evidence:** `apps/web/src/middleware.ts:47` reads cookie **`g4k_capabilities`**, but the app only ever writes **`g4k_capabilities_{userId}`** (`src/lib/auth-store.ts:94`, `src/lib/capabilities.ts:33`). `caps` therefore always parses to `[]`, so `caps.includes('*')`/`caps.includes(required)` is false for every user — including super_admin — and every visit to `/dashboard/settings`, `/dashboard/audit`, `/dashboard/reports`, `/dashboard/admin/*` redirects to `/dashboard?error=unauthorized` ("You don't have access to that section.").
- **Expected:** capability cookie written under the name the middleware reads (or middleware reads the per-user key / no middleware gate with in-page gating).
- **Impact:** the entire admin surface is unreachable in the current build. (Deployed build may predate this regression — but `HEAD` is broken.)
- **Fix:** align the cookie name (single source of truth in `auth-store.ts`), or have middleware discover the `g4k_capabilities_*` key by prefix scan. Add an E2E smoke test that super_admin can open `/dashboard/settings`.

### C-3. Creating a project phase always returns 500
- **Evidence:** `PhaseController.php:104-107` — after creating the phase it runs `TaskActivity::create(['project_id' => $project->id])` (the code comments literally debate this mid-implementation: *"Wait, TaskActivity belongs to task..."*). `project_id` is not fillable (`TaskActivity.php:11-14`) and `task_activity.task_id` is NOT NULL (`2026_08_09_025001_create_phase_7_tables.php:105`) → `QueryException` on every `POST /projects/{id}/phases`. The phase row itself persists inside the same request (created before the throw), leaving state written despite the error.
- **Expected:** phase creation returns 201 and logs to project history.
- **Impact:** the phases feature (project journey, complete/reopen cascade) is dead at the write path; UI dialogs will show errors.
- **Fix:** remove the `TaskActivity::create` block (project history already flows from task activity) or write a proper project-history record.

### C-4. Deleting a task or project returns 500 (PostgreSQL)
- **Evidence:** `TaskController.php:756-761` and `ProjectController.php:306-314` create `TaskActivity` with `event => 'deleted'`, but the `task_activity.event` enum CHECK only allows `created|assigned|progress|submitted|approved|redo` (`2026_08_09_025001:107`; no later migration extends it) → constraint violation → 500 **after** the soft-delete has run, leaving half-executed transactions and failed responses.
- **Expected:** delete returns success and optionally logs an allowed activity event.
- **Impact:** all task and project deletion (single + the non-QA path of bulk delete) fails at the DB layer; destructive flows appear broken while still mutating data.
- **Fix:** drop the activity insert on delete (audit_logs already record deletions) or extend the enum via migration.

### C-5. Task creation scope escalation + mass assignment defects
- **Evidence:** `TaskController.php:307-345` — the employee self-assignment guard (307-310) runs **before** scope expansion (331-345). Because `tasks.scope` defaults to `'global'` (migration `2026_08_21_012826:21`), (a) **any task created without an explicit scope — including an employee's "personal" task — is assigned to every non-super_admin user and notifies all of them** (365-376); (b) a non-manager posting `scope=department|role` with `scope_id` targets arbitrary departments/designations, bypassing both the self-only rule and HR's department rules; (c) `scope_id` is **not fillable** (`Task.php:17-20`) so department/role targeting is silently dropped anyway — scope features are simultaneously dangerous *and* broken.
- **Expected:** employees create self-assigned tasks only; scope expansion is a manager/HR privilege with validated `scope_id`; default scope is private/self.
- **Impact:** notification spam to the whole company per task; privilege escalation path; silent data loss of `scope_id`.
- **Fix:** default `scope` to self for non-managers; run scope expansion only under `tasks.manage`; add `scope_id` (+ `order`, see H-3) to fillable; unit-test employee task creation for assignee sets.

### C-6. Route shadowing kills two leave endpoints
- **Evidence:** `routes/api.php:153` registers `GET /leave-requests/{id}` **before** `:163 /leave-requests/pending` and `:165 /leave-requests/export`. Laravel matches in registration order, so both are captured by `show('pending'|'export')` → `ModelNotFound` → 404. (`/leave-requests/balance|history` at :151-152 are registered earlier and survive.)
- **Expected:** both endpoints reachable (frontend leave-export and pending-list calls).
- **Impact:** leave export and the pending list are dead URLs; any UI wired to them fails.
- **Fix:** move the literal routes above the `{id}` route (or constrain `{id}` to `\d+`).

### C-7. `POST /tasks/{id}/move-phase` routes to a non-existent method
- **Evidence:** `routes/api.php:222` → `TaskController::movePhase`; grep of `app/` finds no `movePhase` anywhere → `ReflectionException`/500 on every call.
- **Expected:** task-to-phase move implemented or route removed.
- **Fix:** implement (move `phase_id` under participant + manage checks) or delete the route and its UI callers.

### C-8. Seeder plants hardcoded live credentials and can hijack real accounts
- **Evidence:** `database/seeders/DatabaseSeeder.php:245-246` — `$isProd = false; // app()->environment('production'); // Disabled so demo passwords work on live`. Super admin `karthik / Admin@123`, HR `Hr@123`, etc. are seeded with `must_change_password=false` in **every** environment. `DemoSeedCommand` runs full `db:seed`, and `User::updateOrCreate(['username' => …])` (DatabaseSeeder:248) **resets email/password of any real user that happens to hold a seeded username**.
- **Expected:** production seeding generates random passwords (the prod branch exists but is unreachable); demo seed never mutates non-demo users.
- **Impact:** anyone with repo access can log into any freshly seeded/staging (or demo-reseeded production) environment as super_admin; demo reseed is an account-takeover primitive.
- **Fix:** restore environment detection; key demo users on a demo-only marker and refuse to touch non-demo rows; rotate the committed passwords.

### C-9. "Purge demo data" destroys real data
- **Evidence:** `app/Console/Commands/DemoPurgeCommand.php` — deletes every row carrying a `demo_tag` (39 tables incl. `settings`, `role_assignments`, `export_jobs`, `saved_views`) and every `is_demo` row; DatabaseSeeder marks **all seeded users — including the only super_admin — `is_demo=true`**, so purge removes all login accounts; `:136` `Storage::deleteDirectory('avatars')` deletes **every real user's avatar**. `DemoDataController` exposes this as one super_admin action behind only a typed confirmation; the seed/purge trigger is not audited, and the completion notification silently no-ops because the initiator was deleted (`PurgeDemoDataJob.php:33-42`).
- **Expected:** demo purge removes exactly the demo dataset and nothing else; production org data untouched; action audited.
- **Impact:** irreversible destruction of org data from the settings UI.
- **Fix:** scope user deletion to `is_demo AND demo_tag` users never referenced by real data; never blanket-delete storage dirs; disable the endpoints in production (`app()->environment('production')` guard); audit the trigger.

---

## 4. High Findings (P1)

### H-1. Realtime broadcasting is dead in production (and lies about being offline)
- **Evidence:** `config/broadcasting.php:19-21` silently falls back to `log` when `BROADCAST_CONNECTION=pusher` with no `PUSHER_APP_KEY`; `cloudbuild.yaml` injects `BROADCAST_CONNECTION=pusher` + only `PUSHER_APP_CLUSTER` (no key/secret/id; `.env*` dockerignored). `.env.production` sets `BROADCAST_CONNECTION=reverb`, but **no `reverb` connection exists in config and laravel/reverb is not installed**. Every `broadcast()` call site is wrapped in swallowing try/catch. Frontend: `use-reverb.ts` disables Echo without `NEXT_PUBLIC_REVERB_APP_KEY`/`NEXT_PUBLIC_PUSHER_APP_KEY`; `ConnectionStatus` then shows a permanent amber **"Offline"** pill while the app is actually online (polling works).
- **Expected:** configured, working push transport in production; status indicator reflects connectivity, not feature config.
- **Impact:** all "live" updates silently degrade to polling; users see a false Offline badge; env files contradict each other.
- **Fix:** provision Pusher (or install Reverb on both sides), inject keys in Cloud Run + Vercel, make the fallback loud (log warning), and make ConnectionStatus distinguish "no realtime configured" from "network down".

### H-2. "Clear chat" does nothing visible
- **Evidence:** `ChatController::clearChat` writes `cleared_at` on the `conversation_user` pivot, but `Conversation::users()` `withPivot` only loads `last_read_at, is_pinned` (`app/Models/Conversation.php:24-27`), so `messages()`'s `$pivot?->cleared_at` filter (`ChatController.php:107-113`) is always null — cleared history keeps rendering.
- **Fix:** add `cleared_at` to `withPivot`. Also: clearing the **global** chat attaches every clearer to the global conversation pivot as a side effect; consider excluding global scope.

### H-3. Task drag-reorder silently persists nothing
- **Evidence:** `TaskController::reorder` ends with `$task->update(['order' => $taskData['order']])` (`TaskController.php:599`) but `order` is missing from `Task::$fillable` (`Task.php:17-20`) → mass-assignment silently drops it while responding "Tasks reordered successfully." (Same fillable gap drops `scope_id`, see C-5.)
- **Impact:** any ordering UI (list drag, board order) does not survive reload; users lose work invisibly.
- **Fix:** add `order` (and `scope_id`) to fillable + regression test that reorder persists.

### H-4. Project cover upload 500s
- **Evidence:** `ProjectController::uploadCover` interpolates undefined `$id` in `store("projects/{$id}/covers")` (`ProjectController.php:454`); the route `POST /projects/cover` (`api.php:188`) has no `{id}` parameter.
- **Fix:** accept `{id}` route param or validate `project_id` in the request.

### H-5. HR cross-department data leaks
- **Evidence:**
  - `TimerController::index` (`:71-77`): anyone with `hr.view-team-attendance` gets **all users'** time logs with no `HrScope`.
  - `TimerController::logTime` gates pass HR purely by role without department check (`:41,51`).
  - `UserController::leaveHistory`/`assignments` (`:702-707, 728-733`): HR scoping is conditioned on `users.hr.manage`, which **HR does not have** (only super_admin) → HR sees leave history and project/task assignments company-wide, inconsistent with `index`/`show` which correctly scope on `users.employee.manage`.
- **Expected:** HR sees their managed departments only, consistently across every endpoint.
- **Fix:** apply `HrScope::apply` in all three paths keyed on `users.employee.manage`.

### H-6. HR "Today's Status" board can be stale up to 1 hour
- **Evidence:** `teamToday` caches under a **versioned** key `team_today_v{version}_u{id}_{date}` (`AttendanceController.php:337`), but the attendance observers forget the **unversioned** `team_today_u{id}_{date}` (`AttendanceDayObserver.php:46`, `AttendanceEventObserver.php:36`) — keys that are never written. Punches don't bump the dashboard version either, so nothing short of the 3600-s TTL refreshes the board.
- **Expected:** a punch reflects on the team board within seconds.
- **Fix:** align observer invalidation with the versioned key (or bump `DashboardCacheService` version on attendance writes).

### H-7. Password-reset approval stores a usable plaintext token
- **Evidence:** `AdminPasswordResetController::approve` (`:44-54`) sends an in-app notification **containing the raw reset link** (persisted in `notifications` table) and returns `reset_link` in the API response. Anyone who can read notifications/DB rows (or a proxy log) can reset the victim's password. Approve also "succeeds" for a missing user (`$resetLink ?? null`).
- **Fix:** deliver the link out-of-band only (email), never persist the raw token; 404 on missing user.

### H-8. Sensitive PII leaks in per-record views
- **Evidence:** `UserController::index` hides `blood_group, emergency_contact, alternate_mobile, preferences` (`:89`), but `show` (`:335-355`), `activity` (`:528-557`), `DepartmentController::show` (`:89-93`, loads full users), and `DesignationController::show` (`:77-81`) all serialize those fields to anyone with the respective manage capability — far beyond the directory's privacy rules (which always hide them).
- **Fix:** centralize field-hiding (`makeHidden` in a presenter/Resource) applied to every user serialization path.

### H-9. Last-super-admin can be demoted via edit
- **Evidence:** `updateStatus`/`destroy`/`anonymize` guard the last super admin, but `UserController::update` role changes (`:220-235`) have **no such guard** — a super_admin can PUT `roles:["employee"]` on themselves/last admin and lock the org out of administration. Also `:258-277` duplicate the role-change side effects (token deletion, `active_role=null`) after the transaction, unconditionally.
- **Fix:** reuse the last-admin guard in `update`; remove the duplicated post-transaction block.

### H-10. Old avatars are never deleted (storage leak)
- **Evidence:** avatars are stored at `avatars/{user_id}/{hash}` but deletion constructs `avatars/{basename}` (`UserController.php:313-315` and `:459-460`, `ProfileController.php:76-78`) — wrong path every time; orphan files accumulate forever. (Company logo deletion, by contrast, is correct.)

### H-11. Work-schedule editing silently unsets the default schedule
- **Evidence:** `WorkScheduleController::update` forces `is_default => $validated['is_default'] ?? false` (`:30,40`) — editing the default schedule without re-sending the flag leaves the org with **no default schedule**. `update`/`setDefault` also return success for non-existent ids (no 404), and validation accepts arbitrary strings as times, unconstrained `working_days` values, and negative `standard_seconds`/`break_minutes`.
- **Fix:** only overwrite `is_default` when provided; 404 on missing rows; `date_format:H:i` + `in:`-style day constraints.

### H-12. HR leave-approval UI is a dead end
- **Evidence:** HR org attendance has only `today` and `graph` tabs (`hr-attendance-view.tsx:14`), yet redirects and deep links send HR to `/dashboard/org/attendance?tab=leave&sub=approvals` (`attendance/page.tsx:51-58`, `org/leave/page.tsx`, plus a command-palette link) → blank content. A user with `leave.approve-employee` but without `hr.view-team-attendance` gets a hard Access-Denied page instead of an approvals list. Meanwhile the approvals widget/route `/leave-requests/pending` is dead (C-6).
- **Fix:** give the HR view a real Leave/Approvals tab (or route HR to the shared approvals component); gate the approvals surface on `leave.approve-employee`.

### H-13. Project edit dialog is a stub
- **Evidence:** `projects/[id]/page.tsx` — `editForm` captures department, QA form, members, cover, `allow_employee_tasks` (`:33`), but the dialog renders only name + description with an in-code excuse ("keeping it simple", `:409-419`). Members/department/QA/cover can only be changed by API, contradicting the manual's promised workflow and the store-side support.
- **Fix:** render the full captured form (the create dialog already implements every field — reuse it).

### H-14. "Remember me" is defeated — session cookies become 7-day cookies
- **Evidence:** `api-client.ts:213-215` rewrites `g4k_token` with `max-age=604800` after **every** successful authenticated request (and `providers.tsx:126-138` on visibility change), regardless of the remember flag chosen at login (auth-store deliberately uses sessionStorage for non-remember sessions).
- **Impact:** shared-machine sessions persist a week — a security regression vs. design.
- **Fix:** mirror the store's persistence choice (session cookie when not remembered).

### H-15. Leave-approval integrity gaps
- **Evidence:** (a) balance sufficiency is only checked at submission — approval increments `used` with no re-check, so concurrent approvals over-draw (`ApprovalService.php:106-114` vs `LeaveRequestController.php:129-136`); (b) approvals are decided on stale models with no `lockForUpdate` → two deciders can both process (`ApprovalService.php:87,131,188`); (c) `decision` resolves the approval by `id = $id OR approvable_id = $id` ordered by id (`LeaveRequestController.php:174-179`) — can bind the wrong approval when the two id spaces collide; (d) `ApprovalService` requires capability `leave.approve-hr` for HR-stage approvals, which **no seeded role except super_admin's `*` has** — currently masked because only super_admin decides HR leave, but the capability is ungrantable via settings UI.
- **Fix:** lock + recheck inside the decision transaction; resolve the approval through the leave request's relation; seed/allow `leave.approve-hr` or drop the check.

### H-16. Task "redo" can strand a task in review
- **Evidence:** `TaskController::redo` flips the approval to `redo` **then** calls `updateStatus('in_progress')`, which aborts 422 if the task is blocked (`:879-881`) — the approval is already decided, and the task remains `review` with a redo decision and no path to resolution.
- **Fix:** validate the blocker state before mutating the approval (or run both in one transaction with rollback).

### H-17. Weekly summary email excludes HR and targets a non-existent role
- **Evidence:** `SendWeeklySummaryCommand.php:20-23` queries roles `['admin','super_admin']` — `admin` doesn't exist in this system (roles are `super_admin|hr|employee`), so HR never receives the weekly summary despite the feature description saying "Admins and HR".
- **Fix:** query `['super_admin','hr']`.

### H-18. Users export ignores its own filters
- **Evidence:** `UserController::export` snapshots `only_trashed/status/department_id/role` into the ExportJob, but `GenerateReportJob`'s users branch honors only search + ids (`GenerateReportJob.php:421-435`) → the exported file does not match the filtered list the admin was looking at. Also the export route is `users.hr.manage` (super_admin-only) while department/designation exports are HR-reachable — inconsistent.
- **Fix:** apply all snapshot filters in the job; decide one capability rule for org-data exports.

### H-19. Global-scope assignment misses users and spams everyone
- **Evidence:** scope expansion uses `where('active_role','!=','super_admin')` (`TaskController.php:335,521`) — users who never role-selected have `active_role = null` and are **excluded** from global tasks; conversely every global task notifies the entire company (see C-5). NULL-semantics also make `!=` wrong in SQL for this purpose.

---

## 5. Medium Findings (P2)

### Caching & dashboards
- **M-1. Dead cache invalidation everywhere.** `DashboardController::init` computes `$cacheKey` (`:33`) but never caches under it; `PinController`/`QuickNoteController` forget `dashboard_init_*`/`quick_notes_{user}` keys that are never written (real keys are versioned, `DashboardController.php:194`); attendance observers forget unversioned metric keys (see H-6). Only the global version bump works.
- **M-2. Cache invalidation storm neutralizes the dashboard cache.** `CacheInvalidationObserver` bumps the global version on **every** create/update/delete of User/Project/Task/AttendanceDay/LeaveRequest (`AppServiceProvider.php:48-56`) — including `last_login`-style user saves on login — so the 3600-s TTLs rarely survive real traffic; every login rebuilds every cache family.
- **M-3. Approval changes don't invalidate `pending_approvals` caches.** `ApprovalObserver` is an empty stub and unregistered; approval-only transitions (that don't touch observed models) leave HR/admin dashboards stale up to 1 h.

### Security posture
- **M-4. Force-password-change and suspicious-login detection are dormant.** Seeder sets `force_password_change=false` (and a migration forces it false), so the whole `ForcePasswordChange` apparatus + skip-flow never engages; suspicious-login flagging is hard-disabled (`AuthController.php:219-221` "currently inactive"). Confirm intent or wire to settings.
- **M-5. Temp passwords returned in API responses** when SMTP is unconfigured (`UserController.php:147,576`) and generated passwords ignore the configured policy (`Str::random(12/16)` bypasses `password.*` settings). Also `password_changed_at` is stamped at admin creation, delaying expiry.
- **M-6. `/api/version` is public** and leaks the commit sha plus the **full `migrate:status` table** (schema shape) (`VersionController.php:12-27`); cached 1 h. `GET /api/system/public-config` discloses the password policy and force-change flag (fingerprinting aid). Restrict/authenticate both.
- **M-7. Holidays endpoint uses `cache.headers:public;max_age=3600`** on an authenticated route (`api.php:169`) — responses are marked publicly cacheable by intermediaries. Use `private`.
- **M-8. Login calls external `ip-api.com`** for geolocation (`AuthController.php:49-64`) — third-party data egress on every login from unknown IPs, 2-s timeout in the hot path; failures silently swallowed. `trustProxies '*'` (`bootstrap/app.php`) is only safe strictly behind the Cloud Run proxy.

### Roles & permissions consistency
- **M-9. Capability check drift.** `RequireCapability` honors token `role:*` abilities (`RequireCapability.php:24-29`), but in-controller `hasCapability()` helpers (e.g. `UserController:18-22`) use only `resolveActiveRole()` → route and controller can disagree for role-scoped tokens.
- **M-10. De-roled users keep employee powers.** `resolveActiveRole()` falls back to `'employee'` even with zero role assignments (`User.php:131-134`), and role caches live up to 1 h across four differently-named keys.
- **M-11. `CapabilityMatrix::$defaultMatrix` diverges from the seeded matrix** (fallback grants/denies differ from production reality); `SELF_SERVICE_EXCLUDED` is dead code. `db:seed` truncating/reseeding `role_capabilities` also means artisan seed runs silently reset any live-tuned matrix.

### Department/organization workflows
- **M-12. `syncEmployees` can move anyone, including super_admins**, with no `users.*.manage` cross-check, and works on archived departments (`DepartmentController.php:263-275`); teams can be added to archived departments (`:172-189`); `destroy` on an already-archived department is a silent no-op 204 (archive vs destroy are near-duplicates).
- **M-13. `PUT /profile` accepts an arbitrary `preferences` array** (`ProfileController.php:28-42`), bypassing `UserPreferenceController`'s `directory_visibility in:public,private` whitelist — e.g. it can set the dead-but-honored `internal` value that `DirectoryController` treats as full exposure. `UserPreferenceController:65` busts a cache key nothing writes.

### Data & report correctness
- **M-14. QA form edits orphan historical submissions.** `QaController::update` deletes/recreates fields (`:88-105`) — existing `QaSubmission.values` keyed by old field ids become unmatchable, and subsequent submissions mis-validate required fields.
- **M-15. Report job vs endpoint logic mismatches.** leave-summary job uses strict `whereBetween` while the endpoint uses overlap → different numbers for leaves spanning the window; attendance-summary job merges present+late while the endpoint separates them (`GenerateReportJob.php:357,393-396` vs `ReportController.php:246-247,288-295`).
- **M-16. `chunk(1000)` ordered by non-unique `date`** in the attendance export (`GenerateReportJob.php:260-264`) can skip/duplicate rows across chunk pages in pgsql. Order by a unique composite key.
- **M-17. Timezone mixing.** Attendance dates are company-tz strings but `now()->toDateString()` uses app tz (`AttendanceController.php:104,330,433,524`; `AttendanceService.php:407`) — day boundaries shift if `app.timezone` ≠ company timezone. Unvalidated `{date}` path params go straight to `Carbon::parse` → 500 on garbage.
- **M-18. Leave policy gaps.** Same-day start is impossible for all types incl. sick (`StoreLeaveRequestRequest` `after:today`); unpaid leave is balance-capped at 12 like paid types; the pending-leave race is only guarded for identical (user,start,end) ranges (partial unique index), different-range overlaps can race.
- **M-19. Half-day status is dead and there is no early-leave rule** — the enum value was removed by migration and nothing computes it; `open-shift` detection ignores last-event `break_start` (`AttendanceService.php:218-221`) so people who leave mid-break aren't flagged.
- **M-20. Unaudited admin mutations:** settings bulk-update, company profile/logo, all work-schedule mutations, all holiday mutations, QA CRUD, demo seed/purge triggers, and department team/employee syncs record ids only or nothing. Audit-log export also persists raw unvalidated `$request->all()` as filters (`AuditLogController.php:34-47`).

### Realtime/event plumbing
- **M-21. Team announcements broadcast company-wide.** `AnnouncementCreated` goes to `private-org.announcements` whose channel auth is `return $user !== null;` (`channels.php:18-20`) with full payload — visibility is only enforced on REST reads, so any connected client receives team announcement bodies in realtime.
- **M-22. `react()` re-broadcasts the creation event** (`AnnouncementController.php:303-305`), no `toOthers()`, empty `catch {}` — reacting users get self-echoes; create vs update semantics conflated. `NotificationCreated::broadcastWhen` does a `User::find` per broadcast; message pin/unpin emits no event; holiday-reminder dedup checks notification type `system` while sends use `holiday_reminder` (`SendHolidayReminders.php:77-81`).
- **M-23. Chat unread counting is O(messages)** via correlated raw CASE subqueries per row (`ChatController.php:29,89-95`) — will degrade sharply as the global conversation grows.
- **M-24. `monitor:health` exists but is never scheduled**; `ScheduledReport` model/table is a dead feature with no producer or consumer.

### Frontend correctness & UX
- **M-25. Silent list truncation.** Filter option fetches capped `per_page=100` (departments/designations/audit user filter), people fetches `per_page=1000`, non-list task views capped at 100, report preview 25 rows, recent shift log 7 of 365 days — none paginate, so orgs past the caps get silently wrong dropdowns/boards.
- **M-26. Offline-queue semantics leak into UX.** Mutations queued offline return `{queued:true}` but several success handlers toast "success" anyway (e.g. leave cancel `leave-tab.tsx:59-62`, department ops); `/auth/logout` is queueable (`api-client.ts:82-87`) and can replay later.
- **M-27. Echo auth token staleness.** The Bearer for channel auth is captured once at connect and the effect deliberately excludes `token` (`use-reverb.ts:84,156`) — after a silent 15-min rotation, private-channel auth uses a dead token until reload.
- **M-28. Dynamic Tailwind class construction** `bg-${...}-500` (`attendance/page.tsx:164`) produces classes the compiler never emits — several status dots render unstyled.
- **M-29. Query-key drift:** nav hover-prefetch warms `["projects"]`/`["tasks"]` while pages query keyed variants (`nav-group.tsx:41-47`) — prefetch warms the wrong entries; `["projects","count"]` over-invalidates.
- **M-30. Settings page renders an empty shell for unauthorized users** (no empty state, `settings-tabs.tsx:127-146`); command-palette "Admin Settings" links to `/dashboard/profile?tab=settings` which has no tabs (`command-palette.tsx:230-233`); `/dashboard/admin` is middleware-protected but has **no page** (protected 404).
- **M-31. Profile ships placeholder sections as real UI:** fake connected account ("YouTube Team / g4kkarthik@gmail.com"), hardcoded work address with dead Edit button, static privacy selects with no persistence (`profile-connected-accounts.tsx:28-34`, `profile-work-address.tsx:50-53`, `profile-privacy.tsx:24-52`).
- **M-32. Login→onboarding contract:** login reads top-level `result.onboarded` (present today in `AuthController`), but refresh responses and every other consumer use `user.onboarded_at` — a one-field backend change re-routes all users through onboarding. Normalize on one field.
- **M-33. Unreachable `holidays` TabsContent in the leave tab** (`leave-tab.tsx:132-137`) and timer default `standardSeconds=31500` commented "8 hours" (`timer-store.ts:47`) — mislabeled overtime threshold vs the 8 h intent.

---

## 6. Low Findings (P3)

**Dead code (backend):** `CapabilityMatrix::SELF_SERVICE_EXCLUDED`; `TestPusherEvent`; empty `ApprovalObserver`; `RoleAssignment::getRolesForUser` cache (never read); `WorkingDayCalculator` unreachable Feb-29 branch vs duplicate mapping in `reconcileDay`; `markLeaveDays` unused `$workingDays` (and Mon–Sat vs Mon–Fri default inconsistency); attendance statuses `pending`/`leave` never set; `ProfileController` dead `ValidatesPasswordPolicy` import; `AttendanceController` dead `$isAdmin = clone $user`; duplicated blocked-by check in `submitForReview` (`TaskController.php:621-626` vs `669-674`).

**Dead code (frontend):** `approvals-tab.tsx` (312 lines, superseded), `project-overview-tab.tsx`, widgets `feedback-form.tsx`, `pwa-registry.tsx` (manifest exists, registration never mounted), hooks `use-worker`/`use-track-recent`/`use-form-errors`, `avatar-utils.ts`, `layout-utils.ts` (test-only), `adminOnly` nav branch, `org/attendance?tab=leave` prefetch branch.

**Repo hygiene:** stray codemod scripts at root — `fix_per_page.js` (regex-rewrote controller validation caps!), `fix_test_route.php` (re-injects the C-1 backdoor), `test-fetch.js`; `scratch/` should stay gitignored; deleted-but-uncommitted `.md` deletions in working tree.

**Correctness nibs:** `ProfileController::uploadAvatar` returns non-existent `first_name/last_name` columns → nulls (`:90`); `GET /companies/{id}` ignores `{id}` (`CompanyProfileController.php:42-52`); employee number consumed outside the transaction (gaps on rollback); `AutoNumberingService` first-call seed race (no upsert) → concurrent 500; multiple `work_schedules.is_default=true` possible (DB default true + no enforcement on insert) and `where('is_default')->first()` picks arbitrarily; `anonymize` leaves `DEL-{id}` employee codes; audit "cursor pagination" comment vs offset paginate; `activity()` hardcodes 30/page and aliases `ip as ip_address`; `downloadExport` streams whole file from disk into memory; `ExportJob.file_data` base64 path legacy-dead; bulk user ops always HTTP 200 with stats; self-deactivation/self-deletion permitted; `submitted()` queue unpaginated; project update doesn't notify newly added members (store does); recurrence clones drop `phase_id`/`blocked_by`/`parent_id`/`start_date`; `pinChat` silently joins non-members to conversations; announcement `dismiss` has no visibility check; message **edit** is schema-supported (`edited_at`) but has no route; QaController has no audit logging; attendance export columns omit break details.

**Frontend nibs:** deprecated `X-XSS-Protection` + `unsafe-inline` script CSP (`middleware.ts:65,80`); hydration double-gating splash; `dismissedNotificationIds` grows unbounded in localStorage; role-select auto-select has no failure state (infinite loader); Employee360 activity `undefined` treated as non-empty; "View" label on the list-view toggle; duplicate 30-s unread polling on chat page; `window.confirm` for clear-chat vs ConfirmDialog elsewhere; a11y gaps (scope pills/bell tabs lack `aria-pressed`/tab roles, mobile nav lacks `aria-current`); branding mismatch on login ("Gen2k Conglomerate (2018)" vs "Games4king Workplace OS"); breadcrumb labels missing for announcements/notifications/audit; bulk-bar z-index can overlap the mobile FAB.

---

## 7. Cross-Cutting Themes

1. **The admin surface is the least-tested surface.** C-2 (router lockout), C-3/C-4 (phase/delete 500s), H-7/H-11 (settings flows), M-20 (unaudited admin mutations) all cluster in areas manual testing rarely reaches. A small E2E smoke suite over the three roles would have caught most P0s.
2. **Scope/permission logic is implemented twice with drift.** Route capability vs in-controller `hasCapability` (M-9), `ProjectController` vs `PhaseController` manager checks, `users.hr.manage` vs `users.employee.manage` scoping (H-5) — one shared policy layer would eliminate the class.
3. **Cache keys are written and invalidated by different hands.** Versioned keys vs unversioned forgets (M-1, H-6), a stormy global observer (M-2), and an unobserved model (M-3) mean dashboards are simultaneously over- and under-invalidated.
4. **Demo tooling and production share one code path with no environment guard.** C-8/C-9 turn "demo" buttons into org-destruction primitives; `db:seed` resets the capability matrix on any run.
5. **Realtime is architected but unverified.** Two transports referenced (pusher/reverb), neither confirmed configured end-to-end in deploy manifests; every failure path swallows errors (H-1) — the system lies quietly about its own liveness.
6. **Mass-assignment and enum/CHECK drift.** `order`/`scope_id` fillable gaps (C-5, H-3), `event='deleted'` (C-4), and `project_id` on TaskActivity (C-3) show schema and models evolving without paired updates — worth a lint rule (fillable-vs-migration diff) in CI.

---

## 8. Recommended Remediation Order

**Phase 0 — immediate (security, hours):**
1. Delete `/api/test-projects` + the three stray root scripts (C-1). Redeploy API.
2. Fix the capability cookie name (C-2) and add an admin smoke test. Rebuild web.
3. Remove/disable demo seed & purge routes in production; rotate seeded credentials (C-8/C-9 first half — guard + rotate).
4. Restrict `/api/version` and `/system/public-config` (M-6), make holidays cache `private` (M-7).

**Phase 1 — broken core (days):**
5. Phase creation, task/project delete, move-phase, cover upload, leave route order, task scope escalation + fillable fixes (C-3…C-7, H-3, H-4).
6. Work-schedule default-flag fix (H-11); last-super-admin guard on update (H-9).

**Phase 2 — permissions & data integrity (this week):**
7. HR scope unification (H-5), PII hiding (H-8), reset-token handling (H-7), leave decision locking/balance recheck (H-15), redo ordering (H-16), avatar path fix (H-10).
8. HR approvals UI tab (H-12), project edit dialog completion (H-13), remember-me cookie (H-14), weekly summary roles (H-17), users export filters (H-18).

**Phase 3 — reliability (next sprint):**
9. Realtime transport decided + verified end-to-end, ConnectionStatus semantics (H-1); clear-chat pivot (H-2); cache key unification + observer registration (M-1…M-3); teamToday invalidation (H-6); report-job parity + chunk ordering + timezone normalization (M-15…M-17).

**Phase 4 — hygiene (backlog):**
10. Dead-code sweep (P3 lists), demo data isolation behind a staging-only guard, QA-submission migration for edited forms (M-14), a11y pass, E2E smoke suite (login/attendance/leave/project/task/chat × 3 roles) wired into CI, and a migration-vs-fillable lint.

---

*Prepared as a code-first audit of `Games4Kings-New` at commit `69e302d` (+ uncommitted working tree). Companion client-facing document: `manual.md`.*
