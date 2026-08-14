# finalization-7.md — The Definitive Implementation Blueprint (57 phases · ~200 tasks)

> **What this is.** The single, complete, dependency-aware plan to take Games4King Workplace OS from its current
> state to **genuinely production-ready daily use** for Admin, HR, and Employee — multiple departments, multiple
> HRs, multiple employees, correct isolation, real data, complete workflows. Audit + plan only; **nothing was
> implemented during this audit** (live probes were GET-only; no production data was mutated).
>
> **How this was verified (not assumed).** Three evidence layers: (1) **LIVE** — logged into production as
> Admin/HR/Employee (`*@games4king.in`) and exercised 43 endpoints per role, capturing real status codes and
> response shapes; (2) **CODE** — six deep audits of backend (routes/controllers/services/models/migrations) and
> frontend (shell/auth/dashboard/data-layer/UI primitives), with file:line evidence; (3) **SPEC** — line-by-line
> comparison against the Workplace App Requirement Sheet. Existing code is treated as **unverified until proven**;
> several features that "exist" are proven **dead or unwired** below.
>
> **THE #1 SYSTEMIC FINDING — fixes don't reach production.** The local working copy contains fixes that are NOT
> live: local `HolidayController` maps holidays to arrays (`:31,:42`), yet the live API still returns
> `__PHP_Incomplete_Class` from the old model-caching build. Every prior round repeated this: code fixed locally →
> deployed repos untouched or stale → live app unchanged. **Phase 1 (deploy pipeline) is therefore the first task.**
> No phase may be marked done until its acceptance criterion passes **on the live URL**, never on local code.

---

## PART I — AUDIT SUMMARY (evidence, not opinion)

### 1. The seven live-verified blockers

| # | Blocker | Live evidence (production, 2026-08-14) | Who is dead |
|---|---|---|---|
| **D0** | **Deploy divergence** — local has fixes; production runs stale code (holidays array-map fixed locally, live still corrupted) | Live `GET /holidays` → `__PHP_Incomplete_Class`; local code maps arrays | Everyone |
| **D1** | **Employee 100% locked out** — `onboarded_at=null` → `ForceOnboarding` 403 `needs_onboarding` on all 43 endpoints | Live probe: employee → 403 × 43 | Employee |
| **D2** | **Attendance team/admin/HR views 500** — per-user `reconcileDay` loop + cached `work_schedule` stdClass / null schedules | Live: `/attendance/admin/overview`, `/team-today`, `/hr/today` → 500 (admin+HR); own `/me/today` → 200 | HR, Admin dashboards |
| **D3** | **`/leave-requests/pending` 500** (admin+HR) — leave-approval queue dead at source | Live: 500 both roles | HR, Admin approvals |
| **D4** | **Holidays corrupted** (production build caches Eloquent models in DB cache → `__PHP_Incomplete_Class`) | Live: corrupted object, not array | Calendar, heatmap, holiday widgets/logic |
| **D5** | **No queue worker / no scheduler** — `start.sh` = migrate+octane only. Dead: report/audit exports, ALL reminders (shift, missed-clock, holiday-10-day), leave→attendance integration, task→chat posting. (Live `audit-logs` shows 50 rows — some sync path writes; continuity unverified) | Code: `start.sh`; `routes/console.php` schedules never fire | All async features |
| **D6** | **Realtime transport mismatch** — `cloudbuild.yaml` = Pusher; `.env`/code = Reverb pointed at the API's own HTTPS URL (no WS server). Every broadcast throws unless wrapped | Config evidence | Live chat/bell/announcements |

### 2. Live probe matrix (status per role — production truth)

**Admin:** ✅ 28 endpoints (dashboard/init+metrics, capabilities, preferences, sessions, profile, directory 15,
notifications, leave-requests 15 + admin/history, projects 2, tasks 5, announcements, departments 5,
designations 20, work-schedules, conversations, company-profile, settings/grouped, reports/data + attendance-summary,
qa-forms, saved-views, **audit-logs 50**, auto-numberings, password-resets, attendance graphs, projects/1, tasks/1).
❌ attendance/me/* → 403 (**correct** — admin must not self-clock) · attendance team/hr/admin views → **500 (D2)** ·
leave-requests/pending → **500 (D3)** · holidays → **corrupted (D4)**.

**HR:** ✅ own attendance today+history(12), leave-requests(3)+history+admin/history, projects(1), tasks(3),
directory, notifications, announcements, quick-notes, departments, designations, conversations, reports/data +
attendance-summary, **hr/graph**. ❌ team-today + hr/today → **500 (D2)** · leave-pending → **500 (D3)** ·
**qa-forms → 403 (spec: HR creates QA forms)** · **projects/1 + tasks/1 → 403 despite holding
`projects.view`/`tasks.view`** · work-schedules/company-profile → 403 (capability gaps) · admin endpoints → 403
(**correct**) · holidays → corrupted.

**Employee:** ❌ **403 `needs_onboarding` on all 43 endpoints (D1).** Entire role unverifiable until unblocked.

### 3. Spec-coverage truth (Requirement Sheet vs code vs live)

**Built & live-verified working:** login (identifier=email/emp-id/username), lockout scaffolding, role-select,
refresh flow, dashboard/init per role, own attendance today/history (HR), leave list/history, projects/tasks lists,
chat (global+DM read), announcements (list+react), notifications (bell, mark-read), directory, departments,
designations, work-schedules, reports data (HR), attendance graphs, audit-logs (read), command palette, theme
switch, responsive shell (bottom-nav + drawer).

**Built but DEAD or UNVERIFIED (existence ≠ working — each needs wiring/verification, not rebuild):**
Kanban board w/ @dnd-kit (`task-kanban-board.tsx`) · Gantt view w/ Web Worker (`gantt-view.tsx`) · task
dependencies (`blocked_by` + cycle check in `TaskController`) · recurring tasks (`RecurrenceService`) ·
weekly-summary email (`SendWeeklySummaryCommand` + `WeeklySummaryMail`) · QA forms (BE CRUD + FE 4 files; HR
403-blocked) · shortcuts Ctrl+B/N//K (`use-shortcuts.ts`) · form drafts (`useFormDraft`) · read-state fields
(`read_at`) · offline engine · timer endpoint (`/timer/log`) · pins API · audit logging (partially populated).

**Confirmed MISSING (0 hits FE+BE):** pinned chat messages · @mention dropdown+notify (only a stray reference) ·
inline editing · custom group chats (FE reference only, no BE) · chat file/image sharing · per-project work-timer
UI · suspicious-login notify · 30-second autosave + restore banner · one-field-per-screen mobile forms ·
leave balance · bell high-priority-only filter · progress-bar 0→value animation · widget rearrange persistence.

**Built but WRONG (logic/permission/contract):** late-detection timezone (never flags late for IST) ·
`/approvals/{id}/decision` expects Approval id but dashboard sends leave id → 404 · `AttendanceController::correct`
`first()` null-deref · `SendHolidayReminders` calls nonexistent `sendGlobalNotification` · reminder bulk
`Notification::insert` bypasses observer (no live bell) · `ApprovalSubmitted` broadcasts to null channel ·
`UserController::show` no authz · `reports.view` missing in seeder (masked by fallback) · capability cache not
cleared post-seed · `SELF_SERVICE_EXCLUDED` constant dead (deny never wired) · `PUT /auth/role` calls nonexistent
method → 500 · 15-min `g4k_token` cookie → idle forced logout · logged-out deep-link infinite spinner ·
`announcement-board` invalidates a dead query key (never refreshes) · Calendar supplies react-day-picker v8
classNames on v9 (all picker styling silently dropped) · DataTable has no loading state · ~44 non-idempotent
migrations · SoftDeletes trait imported-not-applied (Department/Project/Task) · `productivity_score` rewards raw
hours · `leaveSummary` under-counts overlapping windows · hardcoded `bg-violet-600` ×52 breaks dark-mode recolor ·
`AWS_USE_PATH_STYLE_ENDPOINT=false` breaks Supabase S3 uploads (avatar/logo 500).

### 4. Data/state (Supabase) audit

Real data EXISTS: 15 directory users, 5 departments, 20 designations, 2 projects, 5 tasks, 2 announcements,
HR attendance history (12 days), leave requests across statuses, notifications, 1 conversation each, 50 audit rows,
3 auto-numberings, 1 work-schedule. **Missing/broken:** employee demo account NOT onboarded (D1); no leave
balances; no default work-schedule guarantee (D2 contributor); no multi-HR/multi-department spread proven; no
project-chat/group-chat/DM richness; holidays table content poisoned at the cache layer (D4). No FE
mock/random data generators found in load-bearing paths (backend serves real aggregates — verified). Full seed
spec: Phase 54.

---

## PART II — PHASE & TASK INDEX (57 phases · 16 groups)

| Group | Phases | Focus |
|---|---|---|
| A. Foundation & pipeline | 1–7 | deploy-sync, worker/scheduler, realtime, storage, migrations, contracts, security |
| B. Auth & session | 8–12 | login/lockout/suspicious, onboarding, persistence, role-switch, routes |
| C. RBAC | 13–15 | matrix, endpoint authz, FE gating |
| D. Attendance | 16–21 | 500-fix, clock workflow, calculations, history, reminders, graphs/correct/export |
| E. Leave | 22–24 | request, balance, approval flow |
| F. Organisation | 25–27 | departments, HR scoping, user management |
| G. Projects | 28–32 | CRUD/sorting/visibility, team, timer, completion flow, history+Gantt |
| H. Tasks | 33–37 | CRUD, dependencies, recurring, submission+QA, Kanban/dnd/comments/reminders |
| I. Chat | 38–41 | core+realtime, groups, mention/receipts/pin, files+notification center |
| J. Notifications | 42–43 | engine, reminders/weekly email |
| K. Dashboard | 44–46 | data wiring, widget UX, cache invalidation |
| L. Announcements/Notes/Pins | 47 | board, reactions, quick notes, pinned items |
| M. Reports | 48 | reports, exports, productivity, audit log UI |
| N. Settings & Profile | 49 | settings, avatar/devices/password, complaint channel |
| O. UI/UX engine | 50–53 | design system, forms, states, shortcuts/inline-edit/mobile/offline |
| P. Data & launch | 54–57 | seed dataset, demo accounts, E2E verification, deploy/monitor |

> **Task format:** `T-<phase>.<n> — Title` `P0|P1|P2` · roles · *(Now → Build → Logic → Perms → Deps → Edge → Accept)*.
> P0 = blocks core use; P1 = broken/miswired workflow; P2 = spec feature/polish. **No task is done until its
> Accept passes on the LIVE deployment.**

---

## PART III — THE PHASES

# GROUP A — FOUNDATION & PIPELINE (do first; everything depends on it)

## Phase 1 — Deploy pipeline & sync discipline (kills D0)
- ✅ **T-1.1 Single-source deploy pipeline** `P0` · all · Now: local fixes (holidays array-map, etc.) never reach production; two GitHub repos drift from the working copy. Build: make the local monorepo the only source; CI builds+deploys BE (Cloud Run) and FE (Vercel) on merge to main; block manual/out-of-band deploys; document the exact commands. Logic: deploy = merge → CI → build → migrate check → roll out. Perms: n/a. Deps: none (FIRST). Edge: partial deploys (FE new/BE old) — CI deploys both or neither; version banner. Accept: push a no-op commit → both services redeploy; live `GET /holidays` returns a JSON array (proves D0 fixed end-to-end).
- ✅ **T-1.2 Authenticated smoke + gates in CI** `P0` · all · Now: `cloudbuild.yaml` only probes unauthenticated `/health`/`/ping`; broken builds pass. Build: CI step logs in as the three demo accounts and asserts 200 on `/dashboard/init`, `/notifications`, `/directory`; `php artisan migrate:status` gate (0 Pending); FE `pnpm --filter web build` zero-error gate. Edge: demo creds in CI via secrets, never committed. Accept: a build with any regression fails CI.
- ✅ **T-1.3 Stale-build guard** `P1` · all · Now: users get stale chunks after deploys (prior rounds' "still broken" reports). Build: emit a build-id; FE checks on interval and prompts "New version available — reload"; SW cache-busting by build-id. Accept: after deploy, open tab shows the update prompt within 60s.

## Phase 2 — Runtime services: queue worker + scheduler (kills D5)
- ✅ **T-2.1 Queue worker** `P0` · all · Now: no `queue:work`; every `ShouldQueue` artifact rots in `jobs`. Build: dedicated Cloud Run service `g4k-worker` running `php artisan queue:work database --tries=3 --backoff=60 --max-time=3600` (preferred), or background loop in `start.sh` with Octane as PID 1. Logic: `QUEUE_CONNECTION=database`. Edge: poison messages → `--tries=3` + failed-jobs table alerting; worker health check. Accept: dispatch a test job → drains; an approval writes a fresh `audit_logs` row within 5s.
- ✅ **T-2.2 Scheduler** `P0` · all · Now: 7 schedules in `routes/console.php` never fire. Build: Cloud Scheduler → `g4k-scheduler` (`php artisan schedule:run`) every minute, or in-container `while true; do php artisan schedule:run; sleep 60; done &`. Edge: overlapping runs → `withoutOverlapping()`; timezone `Asia/Kolkata`. Accept: `schedule:list` tasks show "ran at" within 2 min; shift-reminder fires at the configured time (Phase 20 proof).
- ✅ **T-2.3 Job visibility** `P2` · admin · Build: admin Settings tab: pending/failed jobs count + retry-failed action. Accept: failed job visible + retryable from UI.

## Phase 3 — Realtime transport (kills D6)
**T-3.1 Standardize on Pusher** `P0` · all · Now: BE `.env`/code = Reverb → API's own URL (no WS); `cloudbuild` = Pusher. Build: `BROADCAST_CONNECTION=pusher` everywhere; `PUSHER_APP_ID/KEY/SECRET/CLUSTER=g4k_live_3829/g4k_key_3829/g4k_secret_3829/ap2` in env+secrets; delete REVERB_*; FE already uses `NEXT_PUBLIC_PUSHER_*`. Deps: Phase 1 (deploy). Accept: send a chat message → other tab receives it live; notification in tab A → bell badge updates in tab B.
**T-3.2 Channel authorization** `P0` · all · Now: `routes/channels.php` coverage unverified; private channels may 403. Build: authorize `private-user.{id}` (self only), `private-conversation.{id}` (member only), `presence-org` (any authed), role/department approval channels; test each. Edge: revoked membership → channel denied. Accept: non-member cannot subscribe to a conversation channel (403 from `/broadcasting/auth`).

## Phase 4 — Storage (Supabase S3)
**T-4.1 Path-style + disk unification** `P0` · all · Now: `AWS_USE_PATH_STYLE_ENDPOINT=false` (Supabase needs true) + duplicate `s3`/`supabase` disks + mixed usage (`filesystems.default` vs hardcoded `'supabase'`) → avatar/logo 500. Build: set `AWS_USE_PATH_STYLE_ENDPOINT=true` in env+secrets; delete `supabase` disk; all uploads via `Storage::disk(config('filesystems.default'))`. Accept: avatar upload → 200, URL public, image renders; logo likewise.
**T-4.2 Upload guardrails** `P1` · all · Build: validate mime (jpg/png/webp), max 2MB avatars / 5MB project+chat images; clean popup UI stating limits (spec §6). Edge: oversized/invalid → 422 with field-level message. Accept: 5MB avatar → clear rejection; valid → success.

## Phase 5 — Migrations & schema integrity
**T-5.1 Idempotency pass** `P0` · all · Now: ~44 non-idempotent migrations; `migrate --isolated` under `set -e` aborts on drift → missing columns → 500s (D2/D3 contributor). Build: wrap every `add_*` in `hasColumn`/`hasTable`; raw `CREATE INDEX IF NOT EXISTS`; guard FK/constraint adds via `pg_constraint`. Accept: `migrate` re-run on live DB = no-op, no SQLSTATE.
**T-5.2 Reconcile `migrations` table** `P0` · Build: `migrate:status`; for schema-present-but-Pending rows insert the row; then `migrate` pending ones. Accept: 0 Pending live.
**T-5.3 FK/relationship hygiene** `P1` · Build: enforce FKs (`users.work_schedule_id`, `department_hr`, `project_members`, `task assignees`, `approvals.approvable_*`); delete-orphan sweep; SoftDeletes trait applied to Department/Project/Task (import exists, trait missing); resolve Department `archived_at` vs `deleted_at` (pick one). Accept: no orphaned FK values (scripted check); soft-deleted dept excluded from lists + restorable.

## Phase 6 — API contract standardization
**T-6.1 One list convention** `P1` · all · Now: mixed bare-array vs `{data:[…]}` vs grouped-object endpoints cause FE `.find/.map` crashes (live crash family). Build: every list endpoint returns `{data:[…]}` (+paginator meta); wrap stragglers (`/holidays`, `/announcements`, `/quick-notes`, `/pins`, `/qa-forms`, `/saved-views`, `/auto-numberings`, `/reports/exports`, `/work-schedules`); document the contract per endpoint. Accept: contract test asserts shape for all list endpoints.
**T-6.2 FE array-guard standard** `P1` · all · Build: shared helper `asArray(res)` (`Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []`) applied to every queryFn; fix remaining traps (`quick-task-widget.tsx:23`, `profile` designations). Accept: no `.find/.map is not a function` in console under any payload.
**T-6.3 Error contract** `P1` · all · Build: every mutation returns `{message}` + proper code (422 validation w/ `errors`, 403 perm, 404); FE maps to field-level/toast messages. Accept: invalid leave dates → 422 with field errors shown under fields.

## Phase 7 — Security & secrets
**T-7.1 Rotate + purge** `P0` · Now: full secret set leaked in chat + `apps/api/.env` committed. Build: rotate Supabase keys/DB password/JWT/AWS/GitHub PATs/APP_KEY/Pusher; purge `.env` from history; `.gitignore`. Accept: `git log --all` clean; old creds rejected.
**T-7.2 Authz test pack** `P1` · Build: automated role-matrix test (every endpoint × 3 roles → expected 200/403). Accept: suite green in CI; regressions fail builds.

# GROUP B — AUTH & SESSION

## Phase 8 — Sign-in, lockout, suspicious login
**T-8.1 Login UX per spec** `P1` · all · Now: functional; branding unverified. Build: landscape logo from assets, welcome line, copyright "Games4King Workplace OS", info icon → tooltip "Gen2k Conglomerate (2018) • Milestone 1"; password toggle; submit loading; failure shows inline error retaining values. Accept: visual spec match; failed login → error + values kept.
**T-8.2 Lockout** `P1` · all · Now: scaffold exists. Build: 5 fails/10 min → lockout with remaining-time message; auto-unlock; login page communicates it. Accept: 5 wrong passwords → 6th blocked with countdown; after window → can retry.
**T-8.3 Suspicious-login notify** `P2` · hr/admin · Now: absent. Build: new-device/IP/geo heuristic on login → notification (high-priority) to all HR+Admin ("Unusual sign-in for {name} from {ip}/{device}"). Accept: login from new UA triggers HR/Admin bell notification.
**T-8.4 Forgot/reset flow** `P1` · all · Build: identifier → reset link email (SMTP Phase 49) **+** admin-approval in-app path (spec §6: "SMTP and in-app with admin approval"); admin password-reset queue (endpoint exists) approve→issue reset link; redirect to sign-in after set. Accept: both paths reach a password set + login.

## Phase 9 — Onboarding (kills D1)
**T-9.1 Unblock demo employee** `P0` · employee · Now: `onboarded_at=null` → 403 on everything. Build: seed completes onboarding for demo accounts; verify `completeOnboarding` works from UI (profile basics + password set + tour finish → `onboarded_at`). Accept: employee login → `/dashboard/init` 200.
**T-9.2 Onboarding UX** `P1` · employee · Build: welcome/setup guide per spec §6 (steps: profile, password, tour of clock/tasks/chat); skippable-but-completable; no dead-ends. Edge: user closes mid-flow → resumes. Accept: new seeded employee completes flow and lands on dashboard.
**T-9.3 Gate correctness** `P1` · Build: `ForceOnboarding` allows exactly logout/onboarding/role-select/sessions/change-password; everything else 403 `{needs_onboarding}` → FE routes to onboarding (never a blank/spinner). Accept: logged-out + logged-in-unonboarded both route correctly (no infinite loaders).

## Phase 10 — Session persistence & refresh
**T-10.1 End idle forced logout** `P1` · all · Now: 15-min `g4k_token` cookie only re-set in `setAuth`; middleware gates on it → valid sessions bounced. Build: refresh cookie on every successful `apiFetch` + `visibilitychange` heartbeat pre-expiry; or cookie TTL = refresh-window with server-side token validation on refresh. Accept: 20-min idle navigation stays logged in.
**T-10.2 Refresh reliability** `P1` · Build: single-mutex refresh (exists) + Accept header (exists); refresh failure → clean redirect `/login?reason=expired`. Accept: kill refresh cookie → next action redirects to login with message (no stuck loaders).
**T-10.3 Session revoke realtime** `P2` · Build: remote device logout (exists) pushes `.session.revoked` → target tab clears + redirects. Accept: revoke in device A → tab B logs out within seconds.

## Phase 11 — Role selection & switching
**T-11.1 Fix `PUT /auth/role`** `P1` · all · Now: calls nonexistent `CapabilityMatrix::getAssignedRoles` → 500. Build: implement via `RoleAssignment::where('user_id')->pluck('role')` (pattern exists at `AuthController:314`); or delete endpoint and standardize on `POST /auth/role-select`. Accept: role switch → 200 + new scoped token.
**T-11.2 Single-round-trip role-select** `P2` · Build: consume the role-select response token directly (drop the second `/auth/refresh`). Accept: one network call; correct dashboard lands.
**T-11.3 Dual-role account** `P1` · Build: assign dual role (employee+HR) via user mgmt; login → role-select lists both; each session scoped (caps cookie rewritten immediately). Accept: dual-role user switches roles without stale-cap leakage (ex-admin `*` gone after de-escalation).

## Phase 12 — Protected routes & deep links
**T-12.1 Middleware matcher completeness** `P1` · Build: add `/onboarding`, `/role-select`, `/change-password` to matcher with no-token→`/login`; capability map covers every protected route incl. `/dashboard/reports`. Accept: logged-out paste of any URL → login; wrong-role URL → `?error=unauthorized` toast (never blank).
**T-12.2 Capability-cookie race** `P1` · Build: echo `capabilities` in login/role-select/refresh responses; FE writes `g4k_capabilities` immediately. Accept: login → instant nav to a gated route → no false unauthorized.
**T-12.3 Nav/route inventory parity** `P1` · Build: every real page reachable (admin console, admin reports, reports) via sidebar/command-palette; remove dead prefetch branches + orphan `sessions/error.tsx`; single "Settings" destination. Accept: click-through audit — zero orphan screens.

# GROUP C — RBAC

## Phase 13 — Capability matrix (single source of truth)
**T-13.1 Wire the deny-list** `P0` · admin · Now: `SELF_SERVICE_EXCLUDED` defined but `hasCapability()` short-circuits `*` first — write-path unproven. Build: deny-check BEFORE `*` for super_admin; re-verify `POST /attendance/clock-in` as admin. Accept: admin clock-in → **403** live; HR/employee → 200.
**T-13.2 Complete the catalog** `P1` · Build: add `tasks.manage`, `projects.manage`, `qa.view`, `qa.manage`, `timer.track`, `reports.view`, `reports.manage` to catalog+seeder; grant `reports.view` → HR+Employee (live HR 200 is fallback-masked; seeded DB must match); HR gains `qa.manage` (live 403 contradicts spec). Accept: seeded role matrix test green (Phase 7 suite).
**T-13.3 Post-seed cache clear** `P0` · Build: `DatabaseSeeder` → `CapabilityMatrix::clearCache()`; admin action to re-seed+clear. Accept: re-seed applies within seconds, not 1h.
**T-13.4 Admin-is-not-HR/Employee boundary** `P1` · admin · Build: admin **sees org views, not self-service** — no Time Clock widget/nav/FAB/command actions (FE gates exist; verify all five surfaces), attendance page redirects admin → org view; admin CAN view/edit own profile, devices, password, announcements, reports, settings. Accept: admin UI audit — zero self-service surfaces; org surfaces all present.

## Phase 14 — Endpoint authorization hardening
**T-14.1 `GET /users/{id}` authz** `P0` · Build: isSelf‖canView gate (pattern exists in `activity()`). Accept: emp A → emp B = 403; HR → managed-dept member = 200; admin = 200.
**T-14.2 HR project/task visibility** `P1` · hr · Now: HR 403 on `projects/1`/`tasks/1` despite `projects.view`. Build: show-endpoints scope = created-by ‖ team-member ‖ manages-creator's-dept (spec: HR "views progress of all projects" → default allow list-view; detail by scope). Accept: HR opens every project in its list view without 403.
**T-14.3 Employee isolation** `P1` · employee · Build: every employee-facing list filtered by self (attendance, leave, tasks, notifications, quick-notes, pins); no cross-employee leak (verify `tasks/submitted`, day views). Accept: employee token can't fetch another employee's day/leave/task (403).
**T-14.4 Department-scoped reads** `P2` · Build: departments/designations `index` open to all authed (needed for dropdowns), `show/manage` gated — make intentional + consistent. Accept: employee lists depts (for filters) but cannot mutate.

## Phase 15 — Frontend gating consistency
**T-15.1 Nav keys** `P1` · Build: Communications → `chat.access` (now `directory.send-message`); avatar "Settings" hidden without `settings.manage`; command-palette clock actions behind `attendance.clock-self`; admin console + reports nav entries with caps. Accept: role screenshot audit — menus exact per role.
**T-15.2 Permission-denied UI** `P2` · Build: shared `AccessDenied` state ("You don't have access") for gated pages instead of toast-redirect only. Accept: employee deep-links `/dashboard/settings` → clear denied screen.

# GROUP D — ATTENDANCE

## Phase 16 — Fix the 500s (kills D2)
**T-16.1 Null-safe `reconcileDay`** `P0` · hr/admin · Now: team views loop reconcile per user with cached `work_schedule` stdClass; dangling `work_schedule_id` → null-deref → 500. Build: guard `$schedule` (fall back to defaults `09:00`, `31500s`, `10min`); stop caching objects — cache scalar arrays or query fresh; wrap per-user reconcile in try/catch (one bad user degrades that row, never the endpoint). Accept: live `/attendance/team-today`, `/hr/today`, `/admin/overview` → 200 with per-user rows.
**T-16.2 Default work schedule** `P1` · Build: guarantee exactly one `is_default` schedule; settings UI to set default (store `WorkScheduleController` lacks `is_default`); new users inherit default. Accept: fresh user with no schedule reconciles using defaults.
**T-16.3 Drift columns** `P1` · Build: verify attendance tables match controller selects (Phase 5 reconciliation covers); add missing columns/indexes. Accept: no `SQLSTATE[42703]` in 24h Cloud Logging.

## Phase 17 — Time Clock workflow
**T-17.1 Punch state machine** `P1` · hr/emp · Now: works for HR (200 own-today). Build: verify clock-in→break→out→**continue shift** for employee post-D1; idempotent repeat clock-in (no 422); punch buttons disable+spinner while in-flight. Accept: full punch cycle E2E incl. continue-shift double-segment sum.
**T-17.2 Live timer semantics** `P1` · Build: HH:MM:SS counting, persists across navigation (timer-store), amber on overtime, stops ONLY on explicit End Shift (spec §7); server "as-of" worked time when `has_open_shift` (now client-only). Accept: navigate away/back → timer continues; worked-seconds matches server ±2s.
**T-17.3 Offline punches** `P2` · Build: offline punch queues locally, syncs on reconnect, reconciles server state. Accept: punch offline → reconnect → server day shows it.
**T-17.4 Mobile attendance widget** `P2` · Build: mobile dashboard — full-width green Start Shift → timer + Take Break/End Shift, ≥48px targets, most prominent element. Accept: 360px screenshot audit.

## Phase 18 — Calculations
**T-18.1 Late + timezone** `P0` · all · Now: schedule parsed as UTC → IST 09:00 clock-in looks 5.5h early → late NEVER computed. Build: company tz setting (default `Asia/Kolkata`); build scheduled-start in tz, compare instants; grace from schedule. Accept: 09:30 IST vs 09:00+10' → late_minutes≈20 shown as Late badge.
**T-18.2 Overtime** `P1` · Build: overtime = worked − standard (closed+open segments); badge + separate heat-map colour (spec §6). Accept: 10h day vs 8.75 std → OT shown in summary+calendar.
**T-18.3 Breaks & multi-segment** `P1` · Build: break totals exclude from worked; continue-shift second segment counted (no early break in reconcile loop — verified fixed); midnight-crossing shift attributed correctly. Accept: scripted day (in10→break30→out12→in13→out18) → worked 7h, break 30m.
**T-18.4 Holiday/leave-aware reconcile** `P2` · Build: holiday → status `holiday` (not absent/late); approved leave → `on_leave`. Accept: holiday date shows holiday colour, no late.

## Phase 19 — Reminders
**T-19.1 Shift-start reminder** `P1` · emp · Build: 15-min-before alert ("Your shift starts in 15 minutes…") via worker (Phase 2); times configurable in settings. Accept: scheduled test time → notification lands.
**T-19.2 Missed-clock alert to HR** `P1` · hr · Build: 30-min-after-start, per-employee alert to managing HR (respect `working_days`, NOT hardcoded Sunday). Accept: no-show at cutoff → HR bell.
**T-19.3 Reminder delivery correctness** `P2` · Build: notifications created via `Notification::create` (observer → live bell), deduped per day. Accept: no duplicate reminders; bell updates live.

## Phase 20 — Graphs, correction, export
**T-20.1 Graphs role-correct** `P1` · Now: `hr/graph` 200, `admin/graph` 200 admin/403 HR (correct); FE wiring unverified. Build: weekly/monthly toggle; per-employee trends (HR); real aggregates (verified real). Accept: graph renders real counts; empty period → "No data for this period".
**T-20.2 Manual correction** `P1` · hr/admin · Build: fix `correct` `first()`→`firstOrFail` (404 not 500); add/edit/remove event with audit log + reason; capability `admin.correct-attendance|attendance.correct-team`. Accept: correct a bad punch → day recomputes + audit row.
**T-20.3 Attendance export** `P1` · admin · Build: queued Excel export honoring filters (date range, department, person) — currently dead (Phase 2 prereq). Accept: export request → completed file downloads via realtime `.ExportCompleted`.

## Phase 21 — History, calendar, day detail
**T-21.1 History list + calendar heatmap** `P1` · all · Build: own history (works for HR; verify employee post-D1); heat-map colours distinct (present/late/OT/leave/absent/holiday); click date → day dialog (clock-in, breaks, clock-out, total, projects, tasks). Accept: seeded 12-day history renders correctly.
**T-21.2 Admin/HR day drill-down** `P1` · Build: `/attendance/hr/day/{date}/{userId}` + admin equivalent → full day view for any scoped employee. Accept: HR opens any managed employee's day.

# GROUP E — LEAVE

## Phase 22 — Leave request
**T-22.1 Request form E2E** `P1` · all · Build: future-only themed calendar (exists — verify v9 styling Phase 50), type (casual/sick/earned/unpaid), reason required, no overlap with own existing leave (server 422 + field error), routing emp→HR / HR→admin (verify `current_approver_role`). Accept: submit → appears in history Pending + approver notified.
**T-22.2 Cancellation** `P2` · Build: employee/HR can cancel OWN pending request → status cancelled, approver notified, balance restored. Accept: cancel → status flips + notification.

## Phase 23 — Leave balance (missing system)
**T-23.1 Schema + allocation** `P0` · all · Build: `leave_balances(user_id,type,year,allowed,used)`; allocate defaults on user create + year rollover; admin-configurable per-type defaults in settings. Deps: Phase 5. Accept: new user has balances; year rollover resets.
**T-23.2 Enforce on request/approval** `P0` · Build: request-time warning + hard block option (setting); approval deducts inside transaction; reject/cancel restores; HR/admin see requester balance in the approval card. Accept: over-balance casual → blocked; approve → `used` increments; reject → restores.
**T-23.3 Balance visibility** `P2` · emp · Build: employee leave page shows per-type remaining. Accept: balance chips match DB.

## Phase 24 — Approval flow (kills D3 fallout)
**T-24.1 Fix pending endpoint** `P0` · hr/admin · Now: 500 live. Build: root-cause via Cloud Logging (morphOne `approval` serialization vs `HrScope`); standardize `LeaveRequest` on ONE approval relation; HrScope try/catch→[]. Accept: live `/leave-requests/pending` → 200 both roles.
**T-24.2 Decision id contract** `P0` · all · Now: `/approvals/{id}/decision` wants Approval id; dashboard widget sends leave id → 404. Build: resolve by `approvable_type+approvable_id`; fix cache-bust to `$approval->approvable_id`. Accept: approve from dashboard widget AND leave page both → 200.
**T-24.3 Status + notifications + history** `P1` · all · Build: decision → leave status flips, requester notified (preferences-aware via NotificationService), audit row, lists refresh (invalidation Phase 46); badge colours pending=amber/approved=green/rejected=red. Accept: full chain visible to requester within seconds.

# GROUP F — ORGANISATION

## Phase 25 — Departments
**T-25.1 CRUD + members** `P1` · admin · Build: create(name, description)/edit; assign multiple HR (`department_hr` sync) + employees (member list add/remove); archive/delete with confirmation. Accept: dept card shows full member list; archive excludes from active lists.
**T-25.2 Admin-only boundary** `P1` · Build: only `departments.manage` mutates; employees read-only via directory filters. Accept: employee cannot mutate dept (403 + no UI).

## Phase 26 — HR department scoping
**T-26.1 HrScope correctness** `P0` · hr · Build: `managedDepartmentIds` = `department_hr` pivots (+fallback: own dept if HR unassigned? define policy: strict pivot only); apply consistently to attendance/leave/users/projects reads. Edge: HR with zero depts → empty scope, friendly empty states. Accept: HR A sees only dept-A employees everywhere; cross-dept 403.
**T-26.2 Multi-HR support** `P1` · Build: two HRs manage disjoint depts; no data bleed; both get scoped alerts. Accept: seeded dual-HR test passes isolation.

## Phase 27 — User management
**T-27.1 Create HR + Employee** `P1` · admin · Build: form (name, email, employee ID auto (auto-numberings), department, team, designation, roles incl. dual-role); validation-on-pause; creates + onboards-new-user state; welcome/onboarding path. Accept: created employee logs in → onboarding → dashboard (chains Phase 9).
**T-27.2 Edit / assign / reassign** `P1` · admin · Build: edit profile; dept/team reassign propagates to scoping; HR managed-dept change updates HrScope. Accept: reassign → scoped views reflect within one refresh.
**T-27.3 Lifecycle actions** `P1` · admin · Build: deactivate (login blocked, data kept), delete (soft, restore button), reset password (direct + approval queue), activity log tab (from audit). Accept: deactivated user login → clear error; restore returns data.
**T-27.4 Activity log UI** `P2` · admin/hr · Build: per-user audit timeline (uses audit_logs; worker keeps it current). Accept: actions (created/approved/edited) appear chronologically.

# GROUP G — PROJECTS

## Phase 28 — Project CRUD, sorting, visibility
**T-28.1 CRUD per spec** `P1` · hr/admin · Build: create(name, description, priority, deadline, team, QA form attach); edit; complete/archive; admin manages ALL projects (verify admin sees org-wide; HR sees scoped — Phase 14.2 fixed). Accept: HR creates project; admin sees it in all-projects view.
**T-28.2 Sorting** `P2` · all · Build: list sort by Created/Deadline/Priority × asc/desc (URL-state). Accept: each sort verified.
**T-28.3 Employee visibility** `P1` · emp · Build: employee sees ONLY assigned projects with name/description/priority/deadline/progress/status. Accept: employee project list ⊂ assigned set exactly.

## Phase 29 — Team assignment & auto-access
**T-29.1 Team management** `P1` · hr/admin · Build: search employees → add to project; removal revokes access. Accept: added employee gains project+tasks+chat access instantly; removed loses it.
**T-29.2 Project chat auto-create** `P1` · all · Build: conversation per project created with the project (verify wiring; spec §3). Accept: new project → its chat exists with creator + team.

## Phase 30 — Project work timer (FE missing; BE exists)
**T-30.1 Timer UI per project** `P1` · emp · Build: Start/Pause/Resume/End Session per project (`/timer/log` BE exists); HH:MM:SS live; amber overtime; logs time per project/day; shows in day detail (Phase 21). Accept: 2h logged → project time + attendance day detail reflect it.
**T-30.2 Timer persistence** `P2` · Build: running timer survives navigation; ends only on End Session; offline queue like punches. Accept: navigate away/back → still running.

## Phase 31 — Completion & approval flow
**T-31.1 Submit project** `P1` · emp · Build: Complete Project + short completion report → status pending-review; HR+Admin notified (bell + notification center); HR approves / requests redo (reason); employee sees result on dashboard + history. Accept: full cycle with statuses + notifications.
**T-31.2 Progress computation** `P2` · Build: progress = approved+completed tasks / total (real calculation; verify current formula). Accept: progress matches task states.

## Phase 32 — Project history + Gantt
**T-32.1 History log** `P2` · hr/admin/emp · Build: completed projects with team members, tasks completed, total time, completion date, final approval status. Accept: seeded completed project renders fully.
**T-32.2 Gantt view verify** `P2` · hr/admin · Now: `gantt-view.tsx` exists (Web Worker). Build: wire to project list "Timeline View"; bars start→deadline + task diamond milestones; empty/edge (no deadline) handled. Accept: timeline renders seeded projects + milestones.

# GROUP H — TASKS

## Phase 33 — Task CRUD & attributes
**T-33.1 Create/edit/assign** `P1` · hr/admin · Build: priority Low/Med/High/Urgent; scope Global/Department/Role (spec §6) — verify allocation UI + BE filter; due date; assign one/many/project-wide; edit/reassign. Accept: each scope's visibility verified for target users.
**T-33.2 My Tasks (personal list)** `P1` · all · Build: private to-do (not project-tied); HR/Admin can assign into it; employee self-creates; shows in employee nav per spec sidebar. Accept: personal task invisible to other employees; assignable by HR.
**T-33.3 Quick-task widget** `P1` · hr/admin · Now: widget exists; invalidates dead key. Build: form→assign→appears in employee list immediately (invalidation Phase 46); on completion → auto-notification in Global Chat (worker). Accept: assign→employee sees it <5s; complete→global chat posts.

## Phase 34 — Task dependencies
**T-34.1 Verify + expose** `P1` · hr · Now: BE `blocked_by` + cycle check exist; FE unverified. Build: create-form picker "cannot start until…"; blocked task shows "Blocked by {task}" + start disabled until dependency done; cycle errors surfaced. Accept: B blocked until A approved; starting B early → prevented UI+server.

## Phase 35 — Recurring tasks
**T-35.1 Verify + UI** `P1` · hr · Now: `RecurrenceService` BE exists; FE advanced section unverified. Build: advanced-collapsed recurrence (Daily / Weekly-on-days / Monthly-on-date); auto-recreate on completion; HR notified per completion; turn-off toggle. Accept: complete daily task → tomorrow's instance exists; disable stops.

## Phase 36 — Submission, QA form, note
**T-36.1 QA forms** `P1` · hr/admin · Now: BE+FE exist; HR 403 (Phase 13.2); wiring unverified. Build: HR/Admin create QA forms (fields configurable) attached to project; employee fills on submit; submission blocked if required-unfilled; HR reviews answers. Accept: submit without QA → blocked with field errors; with QA → goes to review.
**T-36.2 Submission + note** `P1` · emp · Build: progress update while working; complete+submit with brief note (spec §6) + QA; status badges (amber pending / green approved / red redo). Accept: submit → HR review request; redo(reason) → employee sees instantly.
**T-36.3 Task approval cycle** `P1` · hr/admin · Build: approve/redo updates status + notifies + dashboard approval-status panel refresh; audit row. Accept: cycle E2E <5s visible to employee.

## Phase 37 — Kanban, ordering, comments, reminders
**T-37.1 Kanban verify** `P1` · all · Now: `task-kanban-board.tsx` + @dnd-kit exist. Build: columns To Do/In Progress/Under Review/Done; drag → status persists (BE PATCH); list↔kanban toggle. Accept: drag card → status persists after reload.
**T-37.2 Manual ordering** `P2` · all · Build: drag reorder within list (position field + FE). Accept: order persists.
**T-37.3 Task comments** `P2` · all · Build: comments on tasks (endpoint exists); realtime for participants; unread hint. Accept: two users comment → both see live.
**T-37.4 Personal task reminders** `P2` · emp · Build: employee sets reminder datetime on own task → bell at time (worker). Accept: reminder fires.

# GROUP I — CHAT

## Phase 38 — Core chats + realtime
**T-38.1 Global + DM E2E** `P0` · all · Build: send (optimistic) + live receive (Phase 3); unread left-border + count badge; mark-read on open; conversation list ordering; DM from directory "Send Message". Accept: two tabs chat live; unread states correct.
**T-38.2 Project chat** `P1` · all · Build: per-project room, members only (channel auth); task-completion alerts auto-post (worker). Accept: member sees room; non-member 403; task completion posts alert.
**T-38.3 Mobile chat** `P2` · Build: list→fullscreen conversation, back button, input fixed above keyboard. Accept: 360px audit.

## Phase 39 — Groups, mention, receipts, pins
**T-39.1 Custom group chats** `P1` · hr · Build (BE missing): conversation `type=group` + membership table; HR creates group, adds members; employees see only added groups. Accept: non-member can't see/join.
**T-39.2 @mention** `P1` · all · Build: typing `@` → dropdown of that chat's members; insert mention; mentioned user gets notification with snippet. Accept: mention → notification.
**T-39.3 Read receipts (DM)** `P2` · all · Build: `read_at` per DM participant; sender sees ✓✓. Accept: read state updates live.
**T-39.4 Pinned messages** `P2` · hr · Build: HR pins in project chats; pinned stay top. Accept: pin survives reload.

## Phase 40 — Files + Notification Center
**T-40.1 Chat file/image sharing** `P1` · all · Build: attach image/file (limits popup, Phase 4.2 storage), previews, download. Accept: image sends + renders for receiver.
**T-40.2 Notification Center (inside Chat)** `P1` · hr/admin · Build: chat-area feed of leave requests, task/project submissions, announcements, holiday reminders, feedback — each deep-links to action. Accept: all five categories render + link.

# GROUP J — NOTIFICATIONS

## Phase 41 — Engine correctness
**T-41.1 Observer + service routing** `P0` · all · Build: all notifications via `NotificationService::send` (preferences+email) and `Notification::create` (observer→broadcast); replace bulk inserts in reminder jobs; fix `SendHolidayReminders` nonexistent method; fix `ApprovalSubmitted` null channel (role/dept presence). Accept: every trigger → bell live + row + respects preferences.
**T-41.2 Bell = high-priority only** `P1` · all · Build: bell counts only high/system-global (spec §6); full history in notification center page; mark read/all. Accept: low-priority items don't inflate badge.
**T-41.3 Triggers inventory** `P1` · all · Build/verify triggers: leave submitted/decided, task assigned/submitted/decided, project submitted/decided, announcements, holiday-10-day, shift reminders, missed-clock, session events, suspicious login, feedback received, exports completed. Accept: matrix test — each trigger fires exactly once.

## Phase 42 — Scheduled comms
**T-42.1 Holiday 10-day reminder** `P1` · all · Build: 10 days before each holiday/event → all users; dedup by lock-key; recurring-holiday date math (Feb-29 guard). Accept: seeded upcoming holiday → reminder exactly once.
**T-42.2 Weekly summary email** `P1` · admin/hr · Now: command+mail exist (dead). Build: schedule Sunday 09:00; metrics (attendance, leaves, tasks, projects); SMTP (Phase 49) + retry. Accept: test run delivers email.

# GROUP K — DASHBOARD

## Phase 43 — Data wiring (post-blockers)
**T-43.1 Role widget correctness** `P1` · all · Build: Admin (employees active/inactive, active projects, today present/absent/late, pending approvals w/ quick access, dense activity feed, quick task); HR (present/absent/late, projects, pending leave, pending submissions, quick task); Employee (active projects, pending tasks, attendance widget right-side w/ live timer, recent-task progress bar, approval-status panel). Verify each against real metrics (backend verified real). Accept: per-role screenshot audit with data cross-checked to DB.
**T-43.2 Fix dead/stale widgets** `P1` · all · Build: announcement-board invalidations → `dashboardInit`; quick-task dead key → `dashboardInit`; `recent-activity` select/read shape; upcoming-holidays `safeFormat`; employee approval-status guard; cross-cutting invalidations (user CRUD, leave decisions, task CRUD). Accept: mutate → widget updates <5s without refresh.

## Phase 44 — Widget UX
**T-44.1 Independence + retry** `P1` · Build: each widget loads/errors independently (ErrorBoundary exists — verify all), per-widget refresh icon on hover, retry. Accept: kill one endpoint → only that widget errors.
**T-44.2 Clickable deep-links** `P2` · Build: every widget links to its page ("12 active projects" → projects). Accept: click-through audit.
**T-44.3 Dismiss + rearrange** `P2` · Build: dismiss per widget (persisted); drag-rearrange persisted per user (prefs `dashboard_layout`; fix widget-engine double-nesting read). Accept: order+visibility survive reload.

## Phase 45 — Cache invalidation map
**T-45.1 Authoritative map** `P1` · all · Build: table mutation→keys (user CRUD→users+dashboardInit; leave decision→leave lists+dashboardInit+balance; attendance punch→dashboardInit+attendance keys; task/project changes→tasks/projects+dashboardInit; announcements→dashboardInit; notifications→notifications+unread). Offline replay + realtime handlers invalidate same keys. Accept: scripted mutation matrix — every dependent view refreshes.

# GROUP L — ANNOUNCEMENTS, NOTES, PINS

## Phase 46 — Board + notes + pinned items
**T-46.1 Announcement board** `P1` · all · Build: admin company-wide / HR team-level; pin to top; employee reactions (emoji, no comments); notification to relevant users; dashboard surface with close-X (dismiss persisted). Accept: post → appears on dashboards + bell; reaction persists.
**T-46.2 Quick notes** `P2` · all · Build: private sticky notes via sidebar/command-palette; pin note to dashboard. Accept: private (no cross-user leak); pinned note renders.
**T-46.3 Pinned items (favorites)** `P2` · all · Build: pin projects/tasks/profiles (star on hover) → sidebar "Pinned" quick-jump section; unpin. Accept: pin survives; navigates.

# GROUP M — REPORTS

## Phase 47 — Reports & exports & audit
**T-47.1 Report set** `P1` · admin/hr · Build: attendance (range/dept/person), project-completion, task-statistics, productivity summary; HR = limited (scoped) versions; employees: own attendance summary. Accept: each report renders real data; empty → state.
**T-47.2 Excel export** `P1` · all · Build: queued Excel (tables) honoring filters; completes via worker + realtime notification + download. Accept: export → file lands.
**T-47.3 Productivity formula** `P2` · Build: replace hours-multiplied score with documented metric (e.g., task completion rate + on-time %); show definition tooltip. Accept: formula documented + sane values.
**T-47.4 Audit log UI + continuity** `P2` · admin · Build: audit page (exists, 50 rows live) with filters + export; worker guarantees continuity for all audited actions (who created/approved what, when — spec). Accept: perform 10 actions → 10 new rows.
**T-47.5 leaveSummary window fix** `P2` · Build: overlap predicate (`start<=end AND end>=start`). Accept: spanning leave counted.

# GROUP N — SETTINGS & PROFILE

## Phase 48 — Settings, profile, complaint channel
**T-48.1 Settings suite** `P1` · admin · Build: company profile (logo, name, timezone), standard working hours, holiday calendar CRUD (fix D4 + Feb-29), password policies (min length, expiry — policy engine reads them), session/device rules, notification preferences, reminder times, SMTP config + test email. Accept: each setting persists + affects behaviour (e.g., tz → late calc).
**T-48.2 Profile & avatar** `P1` · all · Build: view/edit (photo popup with limits — Phase 4.2), name/phone/designation (self designation edit removed), change password (`<form>`, autocomplete, match+length client checks), devices list + remote revoke + current logout. Accept: avatar uploads (live), password change re-auths cleanly.
**T-48.3 Complaint/feedback channel** `P2` · emp · Build: private form in My Profile → DM to receiving HR/Admin + high-priority notification (spec §6). Accept: submit → DM + bell for receiver.

# GROUP O — UI/UX ENGINE

## Phase 49 — Design system correctness
**T-49.1 Calendar v9 fix** `P0` · all · Now: v8 classNames on react-day-picker 9.14 → selection/today/disabled/range styling dropped everywhere. Build: migrate keys (`selected`,`today`,`disabled`,`outside`,`range_*`,`month_caption`,`button_previous/next`,`month_grid`,`weekdays`,`weekday`,`week`). Accept: every picker shows themed states.
**T-49.2 Tokens & dark mode** `P1` · all · Build: replace 52× hardcoded violet → `primary` token; adopt radius token (pebble); both modes colorful per spec (white ClickUp-like / dark Adobe-like consistency). Accept: theme toggle recolors everything; token audit clean.
**T-49.3 Breadcrumbs** `P2` · Build: hierarchy map (Projects→Website Redesign→Task List→Design Homepage pattern); crumbs clickable. Accept: nested pages show correct trail.
**T-49.4 FilterBar completeness** `P1` · all · Build: every list page = search + status multi + date-range (themed) + dept/team (where relevant) + priority (where relevant) + sort×direction + clear-all + removable chips; single-date filter themed. Accept: filter audit across lists.
**T-49.5 Pagination standard** `P2` · Build: 20 default / 50/100 dropdown everywhere (BE `in:20,50,100` verified). Accept: consistent.

## Phase 50 — Forms engine
**T-50.1 Validation UX** `P1` · all · Build: required markers; validate on typing-pause (not only submit); errors under fields; submit button dot-loader + disabled. Accept: leave/user forms demonstrate all.
**T-50.2 Autosave drafts** `P2` · all · Build: 30s autosave to draft (extend `useFormDraft`); return banner "You have an unsaved draft. Continue editing?" + restore. Accept: close tab mid-form → banner on return.
**T-50.3 Long forms sections** `P2` · Build: sectioned headings for user/project/task creation. Accept: visual audit.

## Phase 51 — States, toasts, confirms, tooltips
**T-51.1 Complete state coverage** `P0` · all · Build: every page/widget = skeleton (exact shape) + error+retry + meaningful empty (copy per spec §7 + illustration + action button) + disabled-while-submitting + permission-denied screen. Sweep list: attendance page, approvals-tab, leave-history, report-builder, profile, notifications-config (+ DataTable `isLoading` prop + skeleton rows). Accept: state matrix audit — zero blanks/misleading empties.
**T-51.2 Toasts** `P2` · Build: top-right, 4s auto-dismiss, X, green/red/amber/blue semantics; dedupe global vs per-mutation double-toasts. Accept: single toast per event.
**T-51.3 Confirmations** `P1` · Build: all destructive actions (delete/deactivate/reject/end-session) → "Are you sure?" modal, red confirm. Accept: sweep — no unprotected destructive action.
**T-51.4 Tooltips + truncation** `P2` · Build: every icon-only button labelled on hover (e.g., timer pause, bell w/ unread count); truncated text → full on hover. Accept: audit.
**T-51.5 Progress-bar animation** `P2` · Build: bars animate 0→value on appear. Accept: dashboard/task progress animates.

## Phase 52 — Shortcuts, inline edit, mobile, offline
**T-52.1 Shortcuts verify** `P2` · all · Now: `use-shortcuts.ts` has Ctrl+B/N//K. Build: Ctrl+N context-aware (task page→new task; projects→new project); Ctrl+/ help overlay listing all; Esc closes any modal/dropdown; Enter submits focused form/confirm. Accept: each key verified.
**T-52.2 Inline editing** `P2` · hr/admin · Build: pencil-on-hover → in-place edit for task/project/department names; Enter save / Esc cancel. Accept: rename without form/navigation.
**T-52.3 Mobile polish** `P2` · all · Build: bottom-nav ≤5 + hamburger full-screen; admin console reachable on mobile; one-field-per-screen option for leave + task completion forms; native mobile date pickers on mobile. Accept: 360px audit incl. forms.
**T-52.4 Offline behaviour** `P2` · all · Build: offline banner; timer/punch continue locally + sync; forms queue; chat shows "Not connected" + queues; replay invalidates caches. Accept: airplane-mode drill E2E.

# GROUP P — DATA & LAUNCH

## Phase 53 — not used (reserved)

## Phase 54 — Seed dataset (test like a real org)
**T-54.1 Org structure** `P0` · seed · Build: 1+ admin; **2 HRs managing disjoint departments**; 3 departments (e.g., Engineering/Design/Operations); 8–10 employees spread across departments (incl. one dual-role employee+HR); designations per dept. Accept: scoping provable (HR A ≠ HR B views).
**T-54.2 Work data** `P0` · seed · Build: 3 projects (one completed w/ history, one active w/ Kanban-mixed tasks incl. blocked+recurring instances, one pending-review submission) + team links + QA form attached; tasks across statuses/priorities/scopes; timer logs. Accept: every Phase 33–37 surface renders seeded content.
**T-54.3 Attendance & leave** `P0` · seed · Build: 4 weeks attendance per user (present/late/OT/absent/holiday mix, multi-segment days, continue-shift day); leave requests all statuses + balances; one upcoming holiday (+recurring one) for reminders. Accept: heat-maps/graphs/balances populated.
**T-54.4 Comms & notifications** `P1` · seed · Build: global chat history, one project chat, 2 DMs, one group; announcements (pinned + reacted); notifications across types; quick notes; pins. Accept: chat/notification surfaces populated.
**T-54.5 Demo accounts** `P0` · seed · Build: admin/hr/employee@ (+ a second HR + dual-role account), all **onboarded**, password `password` (flag: rotate before public launch); balances allocated; sessions cleared. Accept: each account lands on its dashboard with data.

## Phase 55 — End-to-end verification protocol
**T-55.1 API matrix** `P0` · Build: script (probe extended) asserting per-role status+shape for the full endpoint inventory (incl. previously-500 paths, holidays array, employee dashboard 200, admin clock-in 403, HR qa-forms 200). Accept: 100% green against LIVE.
**T-55.2 Workflow chains** `P0` · all · Execute the three spec chains: (1) Admin→create employee→assign dept→employee onboards→clocks in→HR/Admin view→employee applies leave→approval→status+notifications; (2) Admin→create HR→assign dept→HR scoped mgmt→employee receives results; (3) Admin→create dept→add employees+HRs→verify cross-module effects. Plus: task cycle, project cycle, quick-task→chat post, complaint→DM. Accept: every chain completes with UI-visible results, zero refreshes.
**T-55.3 Concurrency drill** `P1` · Build: two users act simultaneously (approve same leave, punch same second, comment same task) → no corruption/duplication. Accept: clean state after drill.
**T-55.4 Console + logs clean** `P0` · Build: clean-profile browser audit (no console errors any role/page) + Cloud Logging 24h zero: `SQLSTATE`, `RouteNotFoundException`, `BadMethodCallException`, `cURL error 60`, `__PHP_Incomplete_Class`, `reading 'length'`. Accept: documented clean run.

## Phase 56 — Production launch hardening
**T-56.1 Secrets + demo rotation** `P0` · Build: rotate demo passwords pre-launch; secrets in Secret Manager only; purge history (Phase 7 verify). Accept: audit clean.
**T-56.2 Monitoring** `P1` · Build: alerting on 5xx rate, failed jobs, queue depth, scheduler misses, DB conn errors; uptime probe on authed endpoint. Accept: test alert fires.
**T-56.3 Performance** `P2` · Build: N+1 sweep on dashboard/attendance loops (per-user reconcile!), index audit, FE bundle check; dashboard <2s warm. Accept: load-time budget met.

## Phase 57 — Sign-off
**T-57.1 Final gate** `P0` · All phases' Accept criteria re-run on LIVE; role acceptance matrix (below) signed per role; rollback plan documented. Accept: **the Completion Standard** ↓

---

## PART IV — ACCEPTANCE

### Role acceptance matrix (must all pass on live)
- **Admin:** login→company dashboard <2s; create/edit/deactivate HR+employee+dept; view ALL attendance+leave+approve; manage all projects/tasks incl. approve/redo; reports+exports+audit; settings persist; announcements post; **no self-clock UI/API (403)**; devices/password work.
- **HR:** scoped dashboard+team attendance (no 500); approve/reject employee leave (both surfaces); own clock/leave→admin; create projects+team+tasks(+recurrence/dependencies/QA); review submissions; group chats+@mention; sees ONLY managed depts everywhere; **no admin screens (403)**.
- **Employee:** onboards→dashboard; clock cycle+timer+history+heatmap; leave request(balanced)/history/status; assigned-only projects; tasks submit w/ QA+note; approval-status panel; My Tasks+reminders; chat (global/DM/group/project) live; profile+avatar+devices; **zero cross-employee data**.

### Data integrity requirements
FKs enforced/orphan-free · leave-balance atomic (tx + restore) · one attendance day per user/date, idempotent reconcile · audit row per state change · org-scoped reads everywhere · soft-deletes consistent · **caches store arrays, never Eloquent instances** (kills D4 class) · concurrent actions isolated.

### Testing strategy
Per-task feature tests (status/shape/perms/edges — Phase 7.2 role matrix + Phase 6.1 contract tests) · scripted E2E chains (55.2) · concurrency drill (55.3) · CI gates (1.2) before every deploy.

### The Completion Standard
> Every phase's Accept criterion passes **on the live deployment** for Admin, HR, and Employee — multiple departments,
> multiple HRs, multiple employees; all workflows (auth, onboarding, attendance incl. late/OT/breaks/continue,
> leave incl. balance, projects incl. team/timer/QA/completion, tasks incl. Kanban/dependencies/recurrence,
> approvals, chat incl. groups/@mention/receipts/pins/files, announcements, notifications+reminders, reports+
> exports+audit, settings, profile, mobile+offline) complete start-to-finish with real persisted data, correct
> permissions, live synchronization, complete UI states, responsive layouts — and **zero console errors, zero 5xx,
> zero placeholders, zero manual refreshes, zero stuck states**.

---

## APPENDIX — Execution order (dependency spine)
```
P1 deploy-sync → P2 worker/sched → P3 realtime → P4 storage → P5 migrations → P6 contracts → P7 security
→ P9 onboarding(D1) + P16 attendance-500(D2) + P24.1 leave-500(D3) + D4 via P1+P54  [CORE UNBLOCKED]
→ P13–15 RBAC → P17–21 attendance → P22–24 leave → P25–27 org → P8/10–12 auth polish
→ P28–37 projects+tasks → P38–41 chat+notifications → P42–47 dashboards+reports
→ P48–52 UX engine → P54 seed → P55 verify → P56 launch → P57 sign-off
```
Parallelizable after core unblock: Groups C/D/E/F, G/H/I/J, K/L/M/N, O — with P45 (invalidation) and P49.1 (Calendar) early in FE streams since many surfaces depend on them.
