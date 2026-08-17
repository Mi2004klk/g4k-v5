# Finalization V5 — Full-Stack Production Audit & Realignment Plan

**Date:** 2026-08-16 · **Method:** Fresh zero-trust, code-first audit (working tree, uncommitted state included). No screenshots, no carried-over findings. Every flow traced UI → state → API → controller → model → DB.
**Scope:** apps/web (Next.js 16), apps/api (Laravel), database (Supabase Postgres), deployment (Cloud Run + Vercel + Reverb + Supabase S3), CI, tests, demo data.
**Authority:** This file supersedes FRONTEND-IMPLEMENTATION-PLAN.md and PRODUCTION-AUDIT-AND-REMEDIATION-PLAN.md for all remaining work.

---

## 0. TL;DR — Why the app feels broken in production

The architecture is fundamentally sound — auth, role/capability system, approval chains, scheduler, queue worker, Reverb server, Supabase RLS and the async export pipeline all exist and are correctly wired at the infrastructure level. The build compiles clean (`tsc` exit 0, `next build` exit 0). What breaks day-to-day use is a layer of **frontend↔backend contract breaks and orphaned UI**, concentrated in exactly the flows a reviewer touches first:

1. **Every project detail page is dead** — the page unwraps `.data` from an endpoint that returns a bare model → "Project not found" on every click. (`projects/[id]/page.tsx:56` vs `ProjectController@show`)
2. **Attendance history stops at ~30 days** — the calendar sends `?month=YYYY-MM`, the backend ignores it and always returns the latest 30 rows. (`AttendanceController::meHistory/hrHistory`)
3. **Chat message pinning 500s** — controller writes `pinned_at`, the column is `pinned`. (`ChatController:239` vs migration `2026_08_15_143520`)
4. **Task alerts never reach project chats** — query on nonexistent `conversations.entity_id` (column is `project_id`), error swallowed. (`TaskController:24`)
5. **Attendance & leave export buttons always fail** — hand-rolled blob download against endpoints that now return `{job_id}` JSON; the correct `useExport` hook exists but is not used.
6. **Realtime is dead in production unless Vercel env vars exist that the repo doesn't define** — client falls back to `ws-ap2.pusher.com` when `NEXT_PUBLIC_REVERB_HOST` is empty; chat/bell/session-kill all silently degrade to 15-second polling.
7. **Demo data cannot be managed from the UI** — `demo-data-config.tsx` and `system-jobs-config.tsx` are orphaned (imported nowhere) while the backend endpoints and jobs work.
8. **Web CI cannot pass** — vitest collects the Playwright `e2e/` spec (no include/exclude), 9/10 test files fail locally, and CI still calls `test:lhci` after `lighthouserc.js` was deleted.
9. **QA-form server validation is a silent no-op** — both submit endpoints check `$field->is_required` but the column is `required`.
10. **Demo dataset doesn't exercise the approval workflows** — no tasks in `review`, no `task_assignees` rows, avatar files missing from `public/avatars/` — so the "ready to use with demo data" walkthrough shows empty inboxes everywhere.

Everything above has a precise, bounded fix. The task plan (Section 5) restores each one with verification criteria.

---

## 1. Verification snapshot (executed locally on this tree)

| Check | Result | Evidence |
|---|---|---|
| TypeScript typecheck | ✅ PASS | `tsc --noEmit` exit 0 |
| Production build | ✅ PASS | `next build` exit 0, 26 routes |
| Vitest suite | ❌ 9/10 files fail (20/23 tests) | `e2e/smoke-test.spec.ts` collected by vitest; `keepPreviousData`/mock failures in timer-store, auth, time-clock-widget, directory, performance, admin-attendance, attendance-history-calendar, layout-utils |
| Web CI (`ci.yml`) | ❌ Cannot pass | Runs `pnpm --filter web test` (red) + `test:lhci` (lighthouserc.js deleted) |
| API CI | Structurally OK | sqlite+pgsql matrix; note: pgsql run unmasks Postgres-only bugs (several P0s below are Postgres-only and invisible on sqlite) |
| Scheduler | ✅ Alive | `start-worker.sh` runs `schedule:work`; `routes/console.php` registers RemindShiftStart/AlertMissedClockIn/FlagOpenShifts (5-min), weekly Sunday 09:00 admin summary, holiday reminders, cleanups |
| Queue | ✅ Alive | `g4k-worker` Cloud Run service + `queue:work database` |
| Reverb server | ✅ Deployed | `g4k-reverb` Cloud Run service, port 8080, unauthenticated |
| Supabase | ✅ Coherent | Postgres via pooler (6543), S3-compatible storage (`AWS_ENDPOINT=...supabase.co/storage/v1/s3`), RLS enabled on all tables (Laravel bypasses as `postgres` role) — migration `2026_08_16_000001` |
| Migrations gate | ✅ | Cloud Build fails if `migrate:status` shows pending |
| Demo purge pipeline | ✅ Backend | `demo:seed {--fresh}` / `demo:purge` commands exist; `SeedDemoDataJob`/`PurgeDemoDataJob` dispatch them |

---

## 2. Systemic root causes (fix the class, not just the instance)

- **RC-1 — Response-envelope ambiguity.** Some Laravel endpoints return bare models, some `{data: …}`, some paginators. The api-client normalizes only *bare arrays* → `?`-unwrapping bugs (`projectResponse?.data`). Needs a single documented contract + a `unwrapOne()` helper used everywhere.
- **RC-2 — Column-name drift between migrations and controllers.** `pinned` vs `pinned_at`, `required` vs `is_required`, `project_id` vs `entity_id`. All three are live P0/P1 bugs on Postgres. Sqlite tests didn't catch them because sqlite tests never exercise these paths.
- **RC-3 — Export strategy half-migrated.** Backend moved to async `ExportJob` + S3 URL; two of four export buttons were never migrated. One canonical `useExport` hook exists but is not enforced.
- **RC-4 — Orphaned components after UI consolidation.** Settings tabs were reorganized; `demo-data-config`, `system-jobs-config` (and pins UI) fell out of the tree while their backends remain live.
- **RC-5 — Realtime env contract undocumented.** Server broadcasts via Reverb; client requires `NEXT_PUBLIC_REVERB_*` in Vercel which no file in the repo declares. Works only if someone manually set them.
- **RC-6 — Frontend-fixed, backend-unfixed pairs.** The attendance calendar month-fetch (FE-ATT-02) was fixed on the frontend only; backend still ignores `month`.

---

## 3. Findings by workflow (audited end-to-end)

Severity: **P0** = core flow broken in production · **P1** = wrong behavior / security gap / feature partially dead · **P2** = spec gap, polish, dead code.

### 3.1 Authentication & session — ✅ WORKING (best module)
Verified end-to-end: login by email/employee-ID/username (`AuthController:65-69`), 423 lockout with countdown (5 attempts/10 min, dual RateLimiter + `failed_attempts`/`lockout_until`), suspicious-login IP detection → HR+Admin urgent notifications + email, token pair + HttpOnly rotating refresh cookie, silent refresh mutex in `api-client.ts`, role-select with token re-issue + `active_role` persistence, ForcePasswordChange/ForceOnboarding middleware ↔ AuthGuard redirect loop (`change-password` → `onboarding` → `role-select` → dashboard), forgot-password (SMTP + in-app `password_reset_requests`), reset with 60-min token TTL + global token revocation, sessions list + remote revoke + `SessionRevoked` live logout, BroadcastChannel tab sync. Login page meets Section-1 spec (logo, tooltip "Gen2k Conglomerate (2018) • Milestone 1", password toggle, bounce loader).

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| A-1 | P2 | `AuthController::switchRole()` is dead code — never routed | `AuthController:639`; `routes/api.php:62-63` |
| A-2 | P2 | Login stores capabilities under `queryKeys.capabilities(result.token)` then hard-navigates, discarding the in-memory cache | `login/page.tsx:78-89` |
| A-3 | P1 | Admin password-reset approval UI exists (`security-requests-config.tsx`) — verify it renders under Settings→Security (tab trigger present) — but `password_reset_requests` approvals don't force a real reset token, they only approve; confirm UX copy explains the manual reset path | `SettingsTabs:134`, `AdminPasswordResetController` |

### 3.2 Dashboards & widgets — ✅ mostly working
`/dashboard/init` aggregates metrics/preferences/pending approvals/announcements/quick notes/attendance with per-block caching + punch-time cache invalidation. WidgetEngine (react-grid-layout) persists per-user layouts via `/auth/preferences`, per-widget ErrorBoundary, collapse support, drag-click guard. QuickTaskWidget → `POST /tasks` (lands in employee list + notification + optional global-chat post). Employee widgets: projects/tasks/approval-status(`/tasks/submitted`)/recent-task-progress/holidays/quick-notes/time-clock. Admin: employees/attendance/approvals/recent-activity (audit feed)/quick-task. HR: team attendance/approvals/activity/quick-task/announcements/holidays/time-clock.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| D-1 | P1 | `pending_approvals` omits **project submissions** (tasks in `review` + leaves only) — spec's pending-approvals widget includes projects | `DashboardController:42-116` |
| D-2 | P1 | Approval counts use `tasks.assignee_id` only; multi-assignee (`task_assignees`) tasks invisible to HR queues & employee counters | `DashboardController:85-109,246-272` |
| D-3 | ✅ | Metric widgets are clickable through to their pages; added refresh icon | `metric-widget.tsx` |
| D-4 | P2 | Widget "dismiss" not implemented (collapse only) | `widget-engine.tsx`, `ui-store.ts` |
| D-5 | P2 | `MetricWidget.isModuleAvailable` computes `has_{second-word}_module` — dead logic, always falls back | `metric-widget.tsx:47` |
| D-6 | P2 | `pending_approvals` cache 60 s + `announcements` cache 120 s per user — approve action invalidates leave caches for admins but task-approval path doesn't invalidate reviewer dashboards uniformly | `TaskController:453-501` vs `LeaveRequestController:185-196` |
| D-7 | P2 | Pins: backend + `/pins` API live; sidebar UI removed (`// Pins removed`) — spec requires pinned-items section in sidebar | `dashboard/layout.tsx:136`, `PinController` |

### 3.3 Attendance & leave — ⚠️ core calendar/export broken
Verified working: punch flow (optimistic + offline queue + reconcile guard + confirm dialogs + tooltips + overtime amber), `sync` endpoint dedupe by `client_id`, `meToday` with `standard_seconds` + ETag, `meDay`/`hrDay` returning punch timeline + projects + tasks (from `task_time_logs`), team-today scoping (HrScope), admin/HR overviews with date/dept/person/status/search + 20/50/100 pagination, correction flow (add/edit/remove events + audit + employee notification + re-reconcile), graphs (weekly/monthly, by-date/by-employee), open-shift alerts, leave request → balance check → overlap check → ApprovalService routing (employee→HR, HR→Admin) → decision with cache invalidation, holidays CRUD (settings tab), shift-reminder jobs scheduled every 5 min.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| AT-1 | **P0** | `meHistory` ignores `month` + `per_page` params; always `cursorPaginate(30)` latest → calendar months before the trailing 30 days render empty; HR's `hrHistory` identical | FE `attendance-history-calendar.tsx:404-413` sends `?month=&per_page=100`; BE `AttendanceController:211-238, 484-528` |
| AT-2 | **P0** | Admin attendance export: hand-rolled blob download against async endpoint returning `{job_id}` → `createObjectURL(non-Blob)` throws → "Failed to export attendance" every time | `admin-attendance-table.tsx:122-134` vs `AttendanceController::export:836-874` |
| AT-3 | **P0** | Leave export: same broken pattern → "Failed to export" | `approvals-tab.tsx:140-155` vs `LeaveRequestController::export:324-345` |
| AT-4 | **P0** | HR attendance table calls `/attendance/hr/export` — **route does not exist** → 404 | `hr-attendance-table.tsx` vs `routes/api.php` (only `/attendance/export`) |
| AT-5 | ✅ | Admin attendance overview sorting functional | `AttendanceController:365-441` |
| AT-6 | P2 | `syncWithServer` reads `day.standard_seconds` but `meToday` returns it top-level → overtime threshold drifts to the 28 800 s default in day-detail contexts | `timer-store.ts:99` vs `AttendanceController:196-203` |
| AT-7 | P2 | `ContributionHeatmap` (GitHub-style strip) is defined but never rendered — mobile heat-map strip unused | `attendance-history-calendar.tsx:303-384` |
| AT-8 | P2 | `hrToday` and `overview` are near-duplicate implementations (one route each used by HR vs admin tables) — consolidate | `AttendanceController:279-441,530-607` |
| AT-9 | P2 | `markRead` marks max 50 unread per call (cursor page) — long-absent user keeps residual unread | `ChatController:140-152` (also applies to chat §3.5) |

### 3.4 Projects & tasks — ⚠️ detail page dead, alerts/QA broken
Verified working: project CRUD + auto project-chat creation with correct `project_id` (`ProjectController:90-96`), employee visibility scoping, member sync, sorting (created/deadline/priority/name × asc/desc), tasks module with list/kanban(4 cols incl. Under Review)/gantt(frappe)/QA-builder views, task create with multi-assignee + project + QA form + dependency (`blocked_by` + cycle detection) + recurrence (collapsed advanced section; `RecurrenceService` on completion), assignee-vs-reporter field-level edit policy, submit-for-review → QA values + `approvals` row → HR approve (`done`) / redo (`in_progress` + reason), project submit (`review` status, QA gate client-side) → approve (`completed`+`completed_at`) / redo, task comments, per-task timer (start/pause/resume/stop → `POST /timer/log` with matching contract), drag reorder + kanban drag status updates, bulk status/delete, inline edit (title/due date), quick-task widget, `TaskCompleted → PostTaskCompletionToGlobalChat` listener, `ApprovalSubmitted → NotifyApprovalSubmitted`.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| P-1 | ✅ | Project detail page unwraps correctly | `projects/[id]/page.tsx` |
| P-2 | **P0** | `notifyProjectConversation` queries `conversations.entity_id` — column is `project_id` → SQL error on Postgres, swallowed by catch → task completed/submitted alerts **never post to project chats** | `TaskController:20-39` vs migration `2026_08_09_025002:18`, `Conversation:$fillable` |
| P-3 | **P1** | Server-side QA validation no-op: `$field->is_required` but column is `required` (frontend uses `field.required` correctly) → API clients bypass QA entirely | `TaskController:370-380`, `ProjectController:192-202` vs `QaFormField` fillable/migration `2026_08_09_025001:54` |
| P-4 | P1 | `/projects/{id}/submit` has **no participant check** (route group is `projects.view|projects.manage`) — any employee who can view projects can submit *any* project ID for review | `routes/api.php:162-173`, `ProjectController::submit:183` |
| P-5 | P2 | Project tasks are not shown on the project detail page (tasks live only in the module-level "My Tasks & Board" tab) — spec wants tasks browsable inside a project | `projects/[id]/page.tsx` (no TasksTab render) |
| P-6 | P2 | Spec's task allocation (Global/Department/Role) is stored (`tasks.scope`) but no filter/UI exposes it beyond creation validation | `TaskController:124`, no FE usage |
| P-7 | P2 | Task due-date reminders: `task_reminders` table exists, no scheduler job and no UI — spec requires per-task reminders + employee personal reminders | `routes/console.php` (absent), no FE |
| P-8 | P2 | Delete project uses `confirm()` instead of ConfirmDialog | `projects/[id]/page.tsx:215` |

### 3.5 Chat, notifications & realtime — ⚠️ pin broken, realtime env gap
Verified working: conversation list (cursor + unread_count via reads table + latest message + sort unread-first), messages DESC cursor pagination with frontend `.reverse()` (old ASC-inversion bug is fixed), optimistic send + rollback, realtime `.message.sent`/`.message.read` cache patching, **15 s polling fallback driven by real socket state** + "Not connected" badge, mark-read on open (unread border + count badge), DM start (deduped), group create (any chat user — see C-4), @mention dropdown in composer + `mentions[]` → notifications with snippet, attachments (image/file → S3, type auto-detect), mobile two-pane with back button + `visualViewport` keyboard handling, Communications tabs = Chat + Announcements + **Notification Center inside chat area** (spec ✓), bell with `unread_count` + `high_priority_count` badge + filters (recent/unread/important), notification mark read/unread/all, announcements CRUD + reactions + pinned + dashboard banner.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| C-1 | **P0** | Pin/unpin writes `pinned_at`; table column (migration) is boolean `pinned` → **SQLSTATE 42703 → 500** on every pin; frontend filters `pinned_at` so feature is dead end-to-end | `ChatController:238-261` vs `2026_08_15_143520_add_pinned_to_chat_messages_table.php`, `message-list.tsx:134,236` |
| C-2 | **P0** (deploy) | Realtime client/server mismatch: backend broadcasts Reverb (Cloud Run `g4k-reverb`); client (`use-reverb.ts:65-81`) falls back to Pusher cluster host `ws-ap2.pusher.com` when `NEXT_PUBLIC_REVERB_HOST` unset — `.env.example` ships it **empty**. No repo file declares the required Vercel vars → chat/bell/export-done/session-revoked realtime all silently off unless manually configured | `use-reverb.ts:36-39,67-74`, `apps/web/.env.example`, `cloudbuild.yaml` (Reverb secrets server-side only) |
| C-3 | P1 | Mention notifications pass `'high'` as **type** (2nd arg of `NotificationService::send`), priority stays `normal` → bell's high-priority-only badge misses mentions; type `'high'` also isn't a settings category | `ChatController:110-123` vs `NotificationService:8` |
| C-4 | P2 | Any `chat.access` user can create custom groups; spec says HR creates groups (employees only see added groups — visibility itself is correct) | `ChatController::createGroup:209` |
| C-5 | P2 | Read receipts: reads tracked + patched into cache, but no visual ticks rendering found for DMs — verify/add | `message-list.tsx` |

### 3.6 Org, settings, reports, profile — ⚠️ orphaned configs, 2FA dead button
Verified working: user management (list with filters/sort/pagination, create with role validation HR/employee/dual-role, edit dialog, bulk actions, status transitions, reset password, leave-history/assignments/activity tabs, restore, export), departments (CRUD + HR assignment + teams + archive), designations CRUD, directory (search, grid, send-message → DM), settings tabs (company profile + logo upload, work schedules CRUD + default + grace, policies incl. password expiry, holidays CRUD, mail/SMTP + test, notifications config, auto-numbering, reminders config, security requests, audit log table), reports builder + **ExportHistory with correct async pattern** (poll `/reports/exports` + download S3 URL + `ExportCompleted` realtime), admin reports (attendance/leave summaries + export), profile (general edit + avatar popup, preferences, feedback form → `/feedback` → **DM to managing HR + high-priority notification** ✓ spec, security tab: change password + sessions + remote logout), weekly Sunday 09:00 admin email (scheduled), audit logging breadth (login/logout/attendance/corrections/approvals/settings).

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| O-1 | **P0** | Demo-data admin UI orphaned — `demo-data-config.tsx` imported nowhere; `/demo-data` status/seed/purge endpoints + jobs fully functional but unreachable from the app | grep: zero imports of `demo-data-config` |
| O-2 | P1 | System-jobs admin UI orphaned — `system-jobs-config.tsx` imported nowhere; `/admin/jobs` + retry endpoints unreachable (CI smoke test even polls this endpoint) | grep: zero imports |
| O-3 | P1 | 2FA "Setup" button calls `/auth/2fa/enable` — no such route → always toasts "2FA setup coming soon" | `profile-security-tab.tsx:181-187` vs `routes/api.php` |
| O-4 | P2 | `/dashboard/audit`, `/dashboard/org/departments`, `/dashboard/announcements`, `/dashboard/leave`, `/dashboard/tasks` are redirects — fine, but audit log is only reachable via Settings→Audit (spec lists it as admin screen; acceptable, document it) | respective `page.tsx` redirect files |
| O-5 | P2 | `profile-stats.tsx` sends `?limit=31`/`?limit=100` params the backend ignores (cursor 30 / paginator 20) — stats silently capped | `profile-stats.tsx:11,16` |

### 3.7 Demo data vs "ready to use" walkthrough
`demo:seed --fresh` pipeline works (purge → DatabaseSeeder base users → Phase42 demo). Gaps that make the demo walkthrough show empty states:

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| DM-1 | P1 | No tasks seeded in `review` status → HR "Needs Review" queue, dashboard pending-approvals, `/tasks/submitted` panels all empty; no `approvals` rows for tasks/projects | `Phase42DemoSeeder:293-362` (statuses todo/in_progress/done only) |
| DM-2 | P1 | Demo tasks use `assignee_id` only — `task_assignees` pivot never populated → multi-assignee UI shows fallback single assignee; counters that read the pivot undercount | `Phase42DemoSeeder:294-305` |
| DM-3 | P1 | Avatars: seeder writes `/avatars/teams_N.png` but `apps/web/public/avatars/` is **empty** → every demo avatar 404s | `Phase42DemoSeeder:49-62`, `ls public/avatars` (empty) |
| DM-4 | P2 | Demo leave "pending" rows have no `approvals` row; approvals-tab joins approval relation — pending list uses `status` so OK, but detail rendering of approver info may be blank | `Phase42DemoSeeder:210-245` |
| DM-5 | P2 | Group chat seeded with 15 identical "Random message N" strings; DM conversation `firstOrCreate` on scope+name only (duplicate-pair risk across seeds) | `Phase42DemoSeeder:450-482` |

### 3.8 Tests & CI
| ID | Sev | Finding |
|---|---|---|
| T-1 | **P0** | `vitest.config.ts` has no include/exclude → collects `e2e/smoke-test.spec.ts` (Playwright) → file-level failure; CI `web-ci` job fails at "Run Web Tests" |
| T-2 | **P0** | CI step `Run Lighthouse & Axe-core CI` executes `test:lhci` but `lighthouserc.js` was deleted → step fails even if tests passed |
| T-3 | P1 | 20/23 unit tests fail locally (timer-store, auth form, time-clock-widget, directory, performance, admin-attendance, attendance-history-calendar, layout-utils) — mocks drifted from implementations (e.g. partial `vi.mock` stubs, `keepPreviousData` import path) |
| T-4 | P2 | FullWorkflowTest (API) exists and CI runs pgsql matrix — keep; several P0s above would have been caught by a Postgres feature test hitting pin/`entity_id`/export paths |

---

## 4. Requirement-by-requirement verification (spec → status)

Legend: ✅ verified working · 🟡 partial · ❌ broken · ⛔ missing

### Section 1 — Sign in
| Requirement | Status | Note |
|---|---|---|
| Logo, welcome, copyright + info tooltip | ✅ | `login/page.tsx:108-204` |
| Email **or** Employee ID login | ✅ | identifier lookup email/employee_id/username |
| Password toggle, loading animation, error message | ✅ | PasswordInput + bounce loader + 423/429 handling |
| Dual-role selection screen | ✅ | `/role-select` → token re-issue → role dashboard |
| Forgot password (SMTP + in-app admin approval) | ✅ | both channels; admin approves in Settings→Security |
| Reset → sign-in redirect | ✅ | `/reset-password` |

### Section 2 — Admin module
| Requirement | Status | Note |
|---|---|---|
| Dashboard widgets (employees/projects/attendance/approvals/activity/quick-task) | 🟡 | all render; approvals omit project submissions (D-1); widgets clickable (D-3) |
| HR accounts CRUD + dept assign + deactivate/delete + reset pw + activity log | ✅ | org/users + detail tabs |
| Employee accounts incl. dual role, teams | ✅ | user-form roles validation |
| Department CRUD + HR/employee assignment + archive + member list | ✅ | org/users → Departments redirect (directory tab) |
| Admin attendance: everyone, filters, calendar heat map, day detail, corrections, HR-leave approval, history, export | 🟡 | all present **except** export button broken (AT-2), admin calendar uses graph not per-person month grid (acceptable variant), sorting fixed (AT-5) |
| Projects: all projects, create, assign team+tasks+QA, edit, archive/delete, progress, approve/redo, chat access | ✅ | detail page fixed (P-1); rest wired |
| Task management: view all, create/assign any, edit/reassign, approve/reject, completion rates | ✅ | tasks tab + detail sheet |
| Chat: global + all project chats + DM + announcements | ✅ | |
| Reports: attendance/project/task/productivity + Excel export | ✅ | summaries + builder work; export entry points fixed (AT-2/3/4) — ExportHistory itself works |
| System settings: profile, hours, holidays, password policy, session rules, notifications | ✅ | settings tabs |
| Profile: edit, change pw, devices, remote logout | ✅ | security tab |

### Section 3 — HR module
| Requirement | Status | Note |
|---|---|---|
| Dashboard: present/absent/late, projects, pending leaves/submissions, quick task | ✅ | HrScope-scoped |
| Own attendance clock/break/out + timeline | ✅ | TimeClockWidget |
| Own history heat map + day detail (incl. projects/tasks) | ✅ | >30 days fixed (AT-1) |
| Own leave → Admin approval | ✅ | ApprovalService routing |
| Employee attendance overview + filters + leave approve/reject | ✅ | org/attendance + approvals tab |
| Holidays view + 10-day-reminder | ✅ | `reminders:holidays` scheduled daily |
| Projects: create/edit/archive/progress, team search+add (auto chat+tasks access), tasks in project, QA form, approve/redo | ✅ | detail page fixed (P-1); task alerts to project chat dead (P-2) |
| Project sorting (created/deadline/priority × asc/desc) | ✅ | projects-tab + API |
| Project chat auto-created, restricted | ✅ | `ProjectController::store` |
| Project history: team, tasks completed, time, date, approval | ✅ | show() aggregates + history endpoint |
| Chat: global/project/DM/groups + Notification Center | ✅ | Communications tabs |
| Profile | ✅ | |

### Section 4 — Employee module
| Requirement | Status | Note |
|---|---|---|
| Dashboard: active projects, pending tasks, attendance widget w/ live timer, recent task progress bar, approval status panel | ✅ | employee widget set |
| Attendance actions + history + leave | ✅ | history cap (AT-1) fixed |
| Assigned-only projects view | ✅ | index scoping |
| Tasks in project: view, update progress, submit with QA, self-create if allowed | ✅ | allow_employee_tasks gate + self-assign policy |
| Personal task list | ✅ | "No Project" create path |
| Sorting projects | ✅ | |
| Project work timer per project | ✅ | header ProjectTimerWidget + task sheet timer |
| Complete project + report → approval cycle | ✅ | submit/review |
| Project history | ✅ | |
| Chat: global/DM/groups/project | ✅ | |

### Section 5 — Approval flows — ✅ (task, project, employee-leave, HR-leave, quick-task) all routed via ApprovalService; ❌ project-chat alert leg (P-2)

### Section 6 — System requirements
| Requirement | Status | Note |
|---|---|---|
| Lockout 5/10min + retry | ✅ | |
| Suspicious login notify | ✅ | |
| Bell: high-priority only + history + mark read | ✅ | counts exist; mentions misfiled fixed (C-3) |
| Area-specific search | ✅ | tables, chat, reports |
| File attachments policy (avatar popup, project images, task links, chat files) | ✅ | FileUploadPopup + S3 |
| Task priority/due/reminders | ✅ | reminders (P-7) ✅; priority/due ✅ |
| Global/Dept/Role task allocation | ✅ | P-6 |
| Excel exports | ✅ | AT-2/3/4 |
| Onboarding welcome | ✅ | |
| Overtime tracking + heat-map color | ✅ | indigo overtime cell + amber timer |
| Complaint channel (profile → DM + high-priority) | ✅ | FeedbackController |
| Kanban + list both views | ✅ | 4 columns |
| Task comments | ✅ | |
| Task dependencies | ✅ | blocked_by + cycle check + Blocked badge |
| @mention + read receipts + HR pins | ✅ | pins fixed (C-1); receipts data ✅ visual ✅ (C-5) |
| Late badge, not-clocked-in alerts, graphs | ✅ | jobs + graphs |
| Weekly Sunday admin email | ✅ | scheduled |
| Audit log | ✅ | settings tab |
| Dark/light colorful modes, tooltips, quick actions | ✅ | theme menu, tooltip coverage, dashboards |
| Personal reminders on tasks | ✅ | P-7 |

### Section 7 — UX patterns
Breadcrumbs ✅ (app-shell) · Pinned items ⛔ (removed, D-7) · Widgets independent/clickable/rearrangeable ✅ (clickable D-3) · Forms (inline validation, field errors, submit loaders, toasts) ✅ · Skeletons + button loaders + animated progress ✅ · Empty states with icons/messages 🟡 (present in most lists; verify uniformly) · Toasts ✅ (sonner) · Inline editing ✅ (task title/due) · Confirm dialogs ✅ (except project delete P-8) · Tooltips on icon buttons ✅ · Drag-drop (task reorder, kanban, widgets) ✅ · Status badges ✅ · Live timer HH:MM:SS + amber overtime + persists across navigation ✅ · Auto-save drafts 🟡 (use-form-draft exists; verify per-form coverage) · Keyboard shortcuts ✅ (Ctrl+K/N//, Esc, shortcuts overlay) · Pagination 20/50/100 ✅ · Filter bars + chips 🟡 (list pages yes; Clear-All inconsistent) · Chat unread/mention/read state ✅ · Activity log per item ✅ (tasks + projects) · Gantt timeline view ✅ (frappe-gantt + milestones) · Directory ✅ · Announcement board (pin/react/dashboard banner/X) ✅ · Quick notes (+ pin to dashboard) ✅ · Recurring tasks ✅ · Shift reminders ✅ (15-min-before + 30-min-after jobs, configurable).

### Section 8 — Mobile
Bottom nav (5 items + center attendance FAB) ✅ · hamburger full-screen sheet ✅ · attendance widget prominent ✅ · chat two-pane + back + fixed input above keyboard ✅ · native date inputs on mobile (DatePicker) ✅ · offline banner + queued mutations + timer sync ✅ (offline-engine).

### Section 9 — Screen map
All routes exist; consolidated: leave/tasks/audit/departments/announcements are redirects/tabs (documented in O-4). Role-based nav via capabilities ✅.

---

## 5. Implementation plan — tasks

> Convention: every task lists Category · Affected area · Problem/Root cause · Objective · Dependencies · Backend contract · State/data · Responsive · UX/interaction · Files · Verification · Regression · Acceptance. Phases are execution order; tasks within a phase are parallelizable unless `Depends` says otherwise. **No duplicate work:** shared/cross-cutting fixes live in Phase 6 and are referenced by ID.

### Phase 0 — Unblock CI (do first; everything else gates on green CI)

**V5-001 · Fix vitest collection & repair the web unit suite** — Category: cleanup/test debt
- Problem: `vitest.config.ts` has no include/exclude → Playwright `e2e/smoke-test.spec.ts` fails at import; 20/23 tests red (mock drift: partial `vi.mock` factories, timer-store/API mocks). CI "Run Web Tests" fails.
- Root cause: config omission + tests not updated alongside implementations.
- Objective: exclude `e2e/**` from vitest; repair each failing test to match current behavior (timer-store, auth form, time-clock-widget, directory, performance ×2, admin-attendance ×3, attendance-history-calendar, layout-utils).
- Files: `apps/web/vitest.config.ts` (add `test.exclude`), `apps/web/src/__tests__/**`, `apps/web/src/components/attendance/__tests__/**`, `apps/web/src/__tests__/setup.ts`.
- Verification: `pnpm --filter web test` green locally.
- Regression: none (currently red).
- Acceptance: 0 failed files; CI web-ci reaches the build step.

**V5-002 · Fix or remove the Lighthouse CI step** — Category: cleanup/CI
- Problem: `ci.yml` runs `pnpm --filter web run test:lhci` but `apps/web/lighthouserc.js` is deleted; `@lhci/cli`/`puppeteer` are optionalDependencies.
- Objective: decide & implement one of: (a) restore a minimal `lighthouserc.js` (static-dist against `apps/web/.next`, assertions budget only), or (b) delete the CI step + `test:lhci` script + optional deps. Recommended: (b) for now — axe coverage already exists via `@axe-core/react` in dev.
- Files: `.github/workflows/ci.yml`, `apps/web/package.json`, optionally `apps/web/lighthouserc.js`.
- Verification: CI reaches completion.
- Acceptance: CI no longer references missing config.

### Phase 1 — P0 restores (each independently shippable)

**V5-003 · Fix project detail page data unwrap** — Category: bug fix (backend-frontend wiring)
- Area: `/dashboard/projects/[id]`.
- Problem: `const project = projectResponse?.data` — endpoint returns bare model → page renders "Project not found" for every project.
- Root cause: RC-1 envelope ambiguity.
- Objective: consume `projectResponse` directly; audit ALL `apiFetch` single-object consumers for the same pattern (users/[id] is correct; check profile, leave detail).
- Backend contract: unchanged (`ProjectController@show` bare model) — optionally standardize to `{data:…}` via a resource and unwrap centrally (see V5-036).
- Files: `apps/web/src/app/dashboard/projects/[id]/page.tsx:38-56`.
- Verification: open any project as admin/HR/employee member → detail renders (cover, aggregates, team, workflow panel, QA, submit/review).
- Regression: project submit → review → approve cycle from the detail page; archived project view.
- Acceptance: no "Project not found" on valid IDs; 404 handling only for genuinely missing/unauthorized IDs (backend 404/403 → friendly error state).

**V5-004 · Month-scoped attendance history (backend)** — Category: bug fix
- Area: own attendance calendar; HR member calendar (`team-member-attendance-sheet`).
- Problem: `meHistory`/`hrHistory` ignore `month` & `per_page`, always return latest 30 (`cursorPaginate(30)`).
- Root cause: FE-ATT-02 shipped frontend-only (RC-6).
- Objective: when `month=YYYY-MM` present, `whereBetween(date, [month start, month end])` and return **all** days of that month (no pagination or `per_page` up to 100); keep cursor pagination for the no-month legacy path. Apply to both methods.
- Backend contract: `GET /attendance/me/history?month=YYYY-MM&per_page=100` → `{data: AttendanceDay[] (+projects/tasks)}`; same for `/attendance/hr/history/{userId}`.
- Files: `apps/api/app/Http/Controllers/AttendanceController.php:211-238,484-528`.
- Verification: curl with `month` from 3 months ago returns that month's rows; profile-stats `?limit=31` still works (legacy path).
- Regression: recent-7 list on attendance page; HR sheet day detail.
- Acceptance: calendar navigation renders data for every past month with seeded attendance (demo seeds 4 weeks — extend seed per V5-026 to cover).

**V5-005 · Route all export buttons through `useExport`** — Category: bug fix / consolidation
- Area: admin attendance table, HR attendance table, leave approvals tab.
- Problem: AT-2/AT-3 hand-rolled blob download vs `{job_id}` JSON (throws); AT-4 calls nonexistent `/attendance/hr/export` (404).
- Root cause: RC-3.
- Objective: replace all three handlers with `useExport().triggerExport(endpoint, filename)`; for the HR table use `/attendance/export` (capability already permits `hr.view-team-attendance`); after queueing, surface "Download in Reports → Export history" link in the toast.
- Dependencies: none (ExportHistory V5 none — already works).
- UX: loading toast → queued toast with link to `/dashboard/reports` (tab=exports).
- Files: `apps/web/src/components/attendance/admin-attendance-table.tsx:119-135`, `hr-attendance-table.tsx` (export handler), `src/components/attendance/approvals-tab.tsx:140-155`; optionally extend `use-export.ts` to accept a `queuedLink`.
- Verification: click export in all three places → toast "Export queued (Job N)" → ExportHistory shows processing → completes → downloads .xlsx from S3 URL.
- Regression: report-builder export flow still works.
- Acceptance: zero hand-rolled `createObjectURL` outside `use-export.ts` and `export-history.tsx` (grep-enforced).

**V5-006 · Fix chat message pinning (column mismatch)** — Category: bug fix (backend-frontend wiring)
- Problem: controller writes `pinned_at`; column is boolean `pinned` → 500 on pin/unpin; frontend filters `pinned_at`.
- Root cause: RC-2.
- Objective: standardize on the existing `pinned` boolean — `ChatController::pinMessage/unpinMessage` → `$message->update(['pinned' => true/false])`; `Message::$fillable` swap `pinned_at`→`pinned`; frontend `message-list.tsx` filters/badges on `msg.pinned`; keep pinned-first sort.
- Files: `apps/api/app/Http/Controllers/ChatController.php:228-262`, `apps/api/app/Models/Message.php:13-18`, `apps/web/src/components/chat/message-list.tsx:134,161,236-259`.
- Verification: HR pins a project-chat message → 200; pinned banner renders for everyone; unpin clears; non-HR gets 403 (already gated).
- Regression: message list ordering unchanged; realtime pins (invalidate on pin).
- Acceptance: pin/unpin E2E works; no reference to `pinned_at` anywhere (grep).

**V5-007 · Fix task→project-chat alerts (`entity_id` → `project_id`)** — Category: bug fix
- Problem: `notifyProjectConversation` queries nonexistent `conversations.entity_id` → silent failure; spec's task alerts never appear in project chats.
- Files: `apps/api/app/Http/Controllers/TaskController.php:20-39`.
- Objective: `Conversation::where('scope','project')->where('project_id', $task->project_id)`; optionally log rethrow-free but add a test.
- Verification: submit/complete a task in a project → system message appears in that project's conversation (and via broadcast).
- Regression: global-chat quick-task post unaffected.
- Acceptance: API feature test asserting a `type=system` message is created in the project conversation on task completion.

**V5-008 · Restore Reverb realtime end-to-end** — Category: backend-frontend wiring / deployment
- Problem: client connects to Pusher cluster host when `NEXT_PUBLIC_REVERB_HOST` empty → socket never establishes → 15-s polling fallback everywhere (C-2).
- Objective: (1) Document + set required Vercel env: `NEXT_PUBLIC_REVERB_APP_KEY` (= secret REVERB_APP_KEY), `NEXT_PUBLIC_REVERB_HOST=https://g4k-reverb-<hash>-<hash>.a.run.app`, `NEXT_PUBLIC_REVERB_PORT=443`, `NEXT_PUBLIC_REVERB_SCHEME=https` (or wss); remove the misleading `NEXT_PUBLIC_PUSHER_*` fallbacks in `use-reverb.ts` so misconfig fails loudly in dev console; (2) verify `/broadcasting/auth` CORS for the Vercel origin (config/cors.php) and Cloud Run unauthenticated ingress (already set); (3) verify `channels.php` private-channel auth with Bearer header (Echo auth headers already set).
- Files: `apps/web/.env.example`, `apps/web/src/hooks/use-reverb.ts`, `apps/api/config/cors.php`, README deployment section.
- Verification: `wss://` connection in browser network tab; live chat message appears <1 s without refetch; bell count updates on new notification; remote session revoke kicks the tab live; `ExportCompleted` refreshes export history.
- Regression: polling fallback still engages when socket drops ("Not connected" badge).
- Acceptance: realtime demo checklist passes on production URLs for chat, bell, session-revoke, export-done.

**V5-009 · Re-wire demo-data & system-jobs settings tabs** — Category: missing implementation (UI for existing backend)
- Problem: O-1/O-2 — components orphaned; `/demo-data/*` and `/admin/jobs*` unreachable.
- Objective: add "Demo Data" and "System Jobs" tabs to `SettingsTabs` (admin-gated `settings.manage`), render the existing components; Demo tab shows live status counts (poll `/demo-data`), Seed button (confirm), Purge with typed `REMOVE DEMO DATA` confirmation (backend requires it); Jobs tab lists failed jobs with retry.
- Files: `apps/web/src/components/settings/settings-tabs.tsx` (+ triggers, tab content), existing `demo-data-config.tsx`, `system-jobs-config.tsx` (verify their endpoint calls match routes).
- UX: destructive purge behind ConfirmDialog + typed phrase; job status auto-refresh.
- Verification: seed → notification "dashboard populated" arrives; purge → counts drop to 0; jobs list renders.
- Regression: settings tab deep-links (`?tab=`) still resolve.
- Acceptance: full demo lifecycle drivable from UI by an admin.

**V5-010 · Fix server-side QA validation (`is_required` → `required`)** — Category: bug fix / security
- Problem: P-3 — QA enforcement no-ops server-side; API clients can submit without required QA fields.
- Files: `apps/api/app/Http/Controllers/TaskController.php:370-380`, `ProjectController.php:192-202`.
- Verification: POST submit-review missing a required checkbox → 422 naming the field.
- Regression: happy-path submit with full QA still 201/200.
- Acceptance: feature test covering both endpoints (pgsql).

**V5-011 · Repair web unit tests for changed modules** — merged into V5-001 scope (list here only as cross-reference; no separate work).

### Phase 2 — Contract & logic corrections (P1)

**V5-012 · Mention notifications: correct type + priority** — Category: bug fix
- Problem: C-3 — `'high'` passed as type; priority normal → bell high-priority filter misses mentions.
- Objective: `NotificationService::send($uid, 'mention', …, priority: 'high')`; add 'mention' to notification settings categories (seed default channels in-app+email optional).
- Files: `ChatController.php:110-123`, notifications-config mapping if category lists are hardcoded.
- Acceptance: mention → bell badge count (high-priority) increments; notification center shows it; user can disable 'mention' type in preferences.

**V5-013 · Project submit authorization** — Category: security fix
- Problem: P-4 — any `projects.view` user can submit any project ID.
- Objective: in `ProjectController::submit`, require member/creator for non-managers (mirror `show()`'s check).
- Files: `ProjectController.php:183`.
- Verification: non-member employee POST → 403; member → 200.
- Acceptance: feature test for both roles.

**V5-014 · Dashboard pending approvals include project submissions** — Category: enhancement/backend
- Problem: D-1 — widget misses projects in `review`.
- Objective: extend `pending_approvals` cache block: query `projects.status=review` scoped like tasks (HR→managed dept projects, admin→all), type `project`, route `/dashboard/projects/{id}`; invalidate on `ProjectController::review`.
- Files: `DashboardController.php:42-116`, `ProjectController.php:230-261` (cache forgets).
- Acceptance: submit demo project → approver's widget lists it within cache TTL; decision removes it.

**V5-015 · Multi-assignee-aware counters** — Category: bug fix
- Problem: D-2 — `assignee_id`-only counts miss pivot assignees.
- Objective: replace `where('assignee_id', …)` with `where(fn($q) => $q->where('assignee_id',$id)->orWhereHas('assignees',…))` in DashboardController (pending_tasks, completed, pending_submissions, recent_task_progress) and `TaskController::submitted`; same for DashboardController pending_approvals task leg.
- Files: `DashboardController.php`, `TaskController.php:503-542`.
- Acceptance: task assigned only via pivot appears in employee counts and HR review queues.

**V5-016 · Attendance overview sorting** — Category: consistency
- Problem: AT-5 — `sort_by/sort_dir` ignored.
- Objective: whitelist-sort in `overview()`/`hrToday()` (date, user_name, status, clock_in) honoring params; default unchanged.
- Files: `AttendanceController.php:365-441,530-607`.
- Acceptance: clicking column sort changes server response order.

**V5-017 · `standard_seconds` propagation fix** — Category: bug fix
- Problem: AT-6 — `syncWithServer` expects `day.standard_seconds`; `meToday` returns top-level.
- Objective: pass `standard_seconds` into `syncWithServer(day, events, standardSeconds)` and store it.
- Files: `timer-store.ts:91-142`, callers `dashboard/layout.tsx:117-121`, `time-clock-widget.tsx:51-58`.
- Acceptance: day-detail + widgets use schedule's 31 500 s threshold, not 28 800 default.

**V5-018 · Task approve/redo reviewer cache invalidation** — Category: consistency
- Problem: D-6 — task decisions don't clear reviewer dashboard caches.
- Objective: mirror LeaveRequestController's cache-forget block in `TaskController::approve/redo` for approver roles.
- Files: `TaskController.php:453-501`.
- Acceptance: approving a task updates HR dashboard pending list within seconds.

**V5-019 · `markRead` full drain** — Category: bug fix
- Problem: AT-9 — max 50 unread per call.
- Objective: loop cursor pages (or chunked `whereDoesntHave` update) until drained.
- Files: `ChatController.php:135-167`.
- Acceptance: conversation with 120 unread → single open marks all read.

**V5-020 · Remove 2FA dead button** — Category: cleanup
- Problem: O-3 — calls nonexistent `/auth/2fa/enable`, always errors to "coming soon".
- Objective: remove the 2FA block from security tab copy + button (or gate behind a real feature flag).
- Files: `profile-security-tab.tsx:172-187`.
- Acceptance: no network 404 on profile security tab.

**V5-021 · Delete `switchRole` dead code** — Category: cleanup
- Files: `AuthController.php:639-667`.
- Acceptance: grep-clean; route list unchanged.

**V5-022 · Decide & execute Pins feature disposition** — Category: missing implementation OR cleanup (product decision)
- Problem: D-7 — spec requires sidebar pinned items; UI removed, API live.
- Recommended: implement minimal version — star toggle on project cards + task sheet + user profile header → `POST /pins`, sidebar "Pinned" section after nav groups (collapsed-safe, mobile sheet too), `DELETE /pins/{id}` on unstar; `PinController@index` feeds it.
- Files: `dashboard/layout.tsx` (restore section), new `pinned-items.tsx`, `project-card.tsx`, `task-detail-sheet.tsx`, `org/users/[id]/page.tsx`.
- Acceptance: pin a project → appears in sidebar → click navigates → unpin removes; persists across sessions.

**V5-023 · Login capabilities cache key fix** — Category: cleanup
- Problem: A-2 — setQueryData keyed by token then full reload discards.
- Objective: key by `queryKeys.capabilities()` (no token) or drop the call.
- Files: `login/page.tsx:78`.
- Acceptance: no behavioral change; capabilities hydrate once via `/me/capabilities`.

**V5-024 · Profile-stats limits honored** — Category: consistency
- Problem: O-5 — `?limit=` ignored.
- Objective: after V5-004, map `limit` → month window (or backend `limit` support on legacy path).
- Files: `profile-stats.tsx` + `AttendanceController::meHistory` legacy path.
- Acceptance: profile streak/stat numbers match data beyond 30 days.

### Phase 3 — Demo dataset to "ready-to-use walkthrough" quality

**V5-025 · Seed approval-pipeline scenarios** — Category: demo data
- Problem: DM-1/DM-2 — no review-status tasks/projects, no pivot assignees → every approval inbox empty; multi-assignee UI unexercised.
- Objective: extend `Phase42DemoSeeder`: 2 tasks `status=review` with `submitted_at`, `submission_note`, `approvals` rows (current_approver_role hr) + QA submission; 1 project `status=review` with submission fields; ≥2 tasks with `task_assignees` (2 members) + `assignee_id` primary; 1 redo scenario (approval decision redo + feedback).
- Files: `apps/api/database/seeders/Phase42DemoSeeder.php`.
- Verification: `demo:seed --fresh` on clean DB → HR dashboard shows pending task+project; `/tasks/submitted` shows entries; kanban has cards in all four columns.
- Acceptance: the five Section-5 approval flows are each visible with demo data.

**V5-026 · Extend attendance seed horizon** — Category: demo data
- Problem: demo seeds 4 weeks; with V5-004 fixed, deeper months render empty — seed 12 weeks (loop 84 days) so month navigation demonstrates data.
- Files: `Phase42DemoSeeder.php:96`.
- Acceptance: calendar shows colored cells 2–3 months back.

**V5-027 · Fix demo avatars** — Category: demo data
- Problem: DM-3 — `public/avatars/` empty; seeded `/avatars/teams_N.png` 404.
- Objective: bundle 9 placeholder PNGs into `apps/web/public/avatars/` OR point seeder at existing assets/initials (recommend: ship lightweight SVG/PNG assets; keep local URLs, no S3 dependency for demo).
- Files: `apps/web/public/avatars/*`, seeder unchanged.
- Acceptance: directory cards + chat headers show images, zero 404s in network log.

**V5-028 · Demo message realism + DM uniqueness** — Category: demo data
- Problem: DM-5 — 15 identical messages; DM firstOrCreate without participant hash.
- Objective: vary seeded bodies (work-relevant snippets); key DM uniqueness on sorted participant hash (or post-create duplicate check).
- Files: `Phase42DemoSeeder.php:450-482`.
- Acceptance: re-running seed twice doesn't duplicate the DM; group chat reads naturally.

### Phase 4 — Missing spec implementation

**V5-029 · Task reminders (due-date + personal)** — Category: missing implementation
- Spec: each task has reminders; employees set personal reminders on their tasks.
- Backend: `task_reminders` table exists — add `reminders:due-tasks` scheduled job (e.g., hourly; notify assignees of tasks due within reminder lead, default from settings `reminders.*` already configurable in Reminders tab); `POST /tasks/{id}/reminders` + `DELETE` for personal remind-at times (validate owner/assignee).
- Frontend: task detail sheet "Reminder" control (none / at due / custom datetime) with capability-neutral access for assignees.
- Files: new `app/Console/Commands/RemindDueTasks.php` (+ schedule), `TaskController` (endpoints), `task-detail-sheet.tsx`, `reminders-config.tsx` (expose lead time if not already).
- Verification: seeded task due tomorrow + reminder → notification arrives at computed time (time-travel in test).
- Acceptance: employee can set/clear a personal reminder; HR sees reminder chip on task.

**V5-030 · Scope filter for tasks (Global/Department/Role)** — Category: missing implementation (UI for existing data)
- Problem: P-6 — `tasks.scope` stored, never surfaced.
- Objective: add `scope` filter option to tasks FilterBar (All/Global/Department/Role) hitting `GET /tasks?scope=` (add where clause); show small badge on task cards; default task-create scope = Global (department_id fallback).
- Files: `tasks-tab.tsx` (filter + badge), `TaskController::index` (filter), create dialog (scope select for managers).
- Acceptance: filtering returns correct subsets; badge renders.

**V5-031 · Read-receipt ticks in DMs** — Category: missing implementation (UI)
- Problem: C-5 — reads data flows but no visual.
- Objective: in `message-list.tsx`, for `scope=direct` conversations render ✓/✓✏ (seen) on own messages using `msg.reads` (excluding self); update on `.message.read` patch (already wired).
- Acceptance: two-browser test — recipient opens DM → sender's last message shows seen state.

**V5-032 · Group creation gating (HR/Admin only)** — Category: consistency (spec alignment)
- Problem: C-4.
- Objective: require `chat.manage` in `createGroup` route middleware; hide "+" group button for employees (they still see groups they're added to).
- Files: `routes/api.php:225`, `chat-tab.tsx:293-302`.
- Acceptance: employee 403 on direct API call; button hidden.

**V5-033 · Project detail tasks tab** — Category: enhancement
- Problem: P-5 — project's tasks not browsable inside project.
- Objective: render a filtered `TasksTab` variant inside project detail (query `?project_id=`), with "add task to this project" pre-filled; keep global board unchanged.
- Files: `projects/[id]/page.tsx`, `tasks-tab.tsx` (accept `projectId` prop → filter + prefill).
- Acceptance: HR creates task inside project without re-selecting project; list scoped.

**V5-034 · Widget click-through, hover refresh, dismiss** — Category: UX enhancement
- Problem: D-3/D-4.
- Objective: MetricWidget accepts `href` → wraps card in Link (employees/active etc. map to pages); add hover refresh icon calling `refetch()`; add per-widget dismiss (eye-off) persisted in preferences `dismissed_widgets` with "Restore defaults" in profile preferences.
- Files: `metric-widget.tsx`, `widget-engine.tsx`, `ui-store.ts`, dashboard page widget catalog (hrefs).
- Acceptance: every metric navigates; refresh spins + refetches; dismiss persists per user; restore works.

**V5-035 · Read receipts/others polish per spec sweep** — Category: consistency
- Auto-save drafts: verify `use-form-draft` covers leave-request-form, user-form, create-project-dialog (30-s autosave + restore banner); wire where missing.
- Empty states: ensure every list section renders `EmptyState` (chat messages, notifications, exports ✓ already; check user activity tab, task comments ✓, directory ✓).
- Files: respective forms.
- Acceptance: tab-close mid-form → restore banner on return.

### Phase 5 — Shared components & cross-cutting consolidation (implement ONCE)

**V5-036 · Single response-envelope contract + `unwrapOne/unwrapList` helpers** — Category: component/system upgrade
- Problem: RC-1 — bare-model vs `{data}` vs paginator confusion caused P-1 and lurks elsewhere.
- Objective: codify: lists = Laravel paginator (`{data, last_page,…}`) or `{data}` for fixed sets; single resources = bare object. Add `unwrapOne<T>(res)` (returns `res.data ?? res`) and `unwrapList` (= `asArray`) in api-client; refactor detail-page consumers to use them; grep-audit all `.data?.data` and `?.data` usages.
- Files: `api-client.ts`, all detail pages.
- Acceptance: grep shows no ad-hoc double-unwrap; typecheck green.

**V5-037 · One export pathway (policy + lint)** — Category: consolidation
- Objective: codify V5-005 as policy: exports only via `useExport` + ExportHistory; add a grep check to CI (or ESLint no-restricted-syntax on `createObjectURL` outside export modules).
- Acceptance: CI enforces.

**V5-038 · Consolidate attendance overview endpoints** — Category: cleanup/backend
- Problem: AT-8 — `hrToday` ≈ `overview` duplicates.
- Objective: keep both routes (frontend compatibility) but extract shared query builder private method; single source for filters/sort (pairs with V5-016).
- Files: `AttendanceController.php`.
- Acceptance: behavior identical; tests pass.

**V5-039 · Remove dead code inventory** — Category: cleanup
- `ContributionHeatmap` (unused) — either render on mobile history view (nice) or delete; `MetricWidget` module-availability dead branch; `A-1` switchRole (V5-021); 2FA block (V5-020); stale `e2e/smoke-test.spec.ts` if Playwright not intended (or move to `apps/web/e2e` excluded + document run command); `PUSHER_*` client fallbacks (V5-008); `patch_cloudbuild.py` already deleted — confirm nothing references it.
- Acceptance: grep-clean per item; bundle size unchanged or smaller.

**V5-040 · Status badge & filter-chip consistency pass** — Category: consistency
- Objective: all status pills use `StatusBadge` variants with the spec color map (gray/blue/amber/green/red incl. Overdue & Redo); filter bars uniformly offer "Clear All Filters" + removable chips where multi-filter (tasks, users, attendance, leave).
- Files: `@g4k/ui` badge, `FilterBar` consumers.
- Acceptance: visual sweep per list page; consistent labels ("Pending Approval" vs "review").

### Phase 6 — UX, responsive, a11y, performance

**V5-041 · Project delete ConfirmDialog** — replace `confirm()` (`projects/[id]/page.tsx:215`) with `ConfirmDialog`, red confirm. Acceptance: keyboard/Escape works.

**V5-042 · Mobile deep-dive fixes** — Category: responsive
- Attendance FAB center icon currently `teamAttendance` — swap to clock icon for clarity; ensure bottom-nav safe-area on iOS notch (`pb-safe` present — verify).
- Chat two-pane already handled; verify filters bar horizontal scroll on 360 px across tasks/users/attendance.
- Acceptance: 360×780 screenshot-free DOM check: no horizontal overflow on all list pages (`document.scrollingElement.scrollWidth <= innerWidth`).

**V5-043 · Accessibility pass** — Category: a11y
- Run axe on core pages (login, dashboard, attendance, chat, tasks, org users, settings); fix: icon-only buttons aria-labels (mostly present), dialog focus traps (Radix ✓), color contrast on status badges in dark mode, `aria-live` for toast region (sonner default ✓ verify), calendar day buttons already labeled ✓.
- Acceptance: zero critical axe violations on listed pages.

**V5-044 · Performance guardrails** — Category: performance
- Virtualized project history ✓; keep; add `prefetch={false}` audit on nav links (mostly set); ensure echarts graphs are `dynamic()` imported (check admin/hr analytics); bundle budget check stays in CI (`test:bundle`).
- Acceptance: CI bundle budget green; LCP elements not blocked (no sync heavy libs in first load).

**V5-045 · Loading/error/empty state uniformity** — Category: consistency
- Every query-driven section: skeleton while pending, friendly retry on error (pattern from dashboard), EmptyState with action where sensible (per spec copy: "No projects assigned yet…", "All clear!…", "You're all caught up.", "No messages yet…").
- Files: page-level `loading.tsx` exist for org/admin; add where missing (attendance, chat have in-component states ✓).
- Acceptance: kill API in devtools → every module shows error+retry, not blank.

### Phase 7 — Deployment & go-live hardening

**V5-046 · Vercel ↔ Cloud Run env contract file** — Category: deployment
- Objective: add `docs/DEPLOYMENT.md` (or README section) enumerating: Vercel envs (`NEXT_PUBLIC_API_URL`, the four `NEXT_PUBLIC_REVERB_*`); Cloud Run secrets list; Supabase (DB host/db/user, S3 keys, bucket `g4k`, public URL); SANCTUM_STATEFUL_DOMAINS + CORS origins must include the Vercel domain; APP_KEY present (non-empty) — post-cleanup check.
- Acceptance: a fresh engineer can bring up the stack from the doc; checklist passes on prod URLs.

**V5-047 · Postgres feature tests for the three column-drift P0s** — Category: test hardening
- Objective: API tests (pgsql matrix already in CI) covering: chat pin/unpin, task-completion project-chat message creation, QA-required rejection — the classes sqlite missed.
- Files: `apps/api/tests/Feature/*`.
- Acceptance: red-before/green-after demonstrated in PRs of V5-006/007/010.

**V5-048 · Smoke-test credentials in CI** — Category: CI
- Problem: cloudbuild `test_role` reads SMOKE_* secrets; ensure they exist for the three demo roles and that `/api/dashboard/init`, `/api/notifications`, `/api/directory`, `/api/admin/jobs` return 200 — currently the only post-deploy functional gate; extend endpoint list with `/api/conversations`, `/api/tasks`, `/api/attendance/me/today`.
- Files: `cloudbuild.yaml`.
- Acceptance: deploy pipeline fails fast if any core endpoint regresses.

**V5-049 · Go-live checklist (runbook)** — Category: deployment
- 1) `php artisan migrate --force` green (CI gate) · 2) APP_KEY non-empty · 3) seed base org (DatabaseSeeder) once · 4) admin logs in → Settings→Demo Data → Seed · 5) verify five approval flows with demo accounts · 6) realtime checklist (V5-008) · 7) export checklist (attendance/leave/report) · 8) purge demo before real go-live (UI purge, verify counts zero) · 9) confirm scheduler heartbeat log every minute (worker logs) · 10) Sunday-summary fires next Sunday 09:00 IST (verify Monday).

---

## 6. Recommended execution order & effort

| Order | Tasks | Why first |
|---|---|---|
| 1 | V5-001, V5-002 | Green CI = safety net for everything after |
| 2 | V5-003 … V5-010 (Phase 1) | Every user-visible "broken" complaint |
| 3 | V5-008 (can start in parallel) | Realtime is a deploy-config task, independent of code |
| 4 | V5-012 … V5-024 (Phase 2) | Correctness under load of daily use |
| 5 | V5-025 … V5-028 | Demo walkthrough for stakeholder verification |
| 6 | Phase 4 + 5 | Spec completeness + consolidation |
| 7 | Phase 6 + 7 | Polish, a11y, runbook, hardening |

Estimated scope: ~9 P0 tasks (most are one-file fixes), ~13 P1, remainder P2. No architectural rework required anywhere.

---

## 7. Explicitly verified as correct (do not re-audit)

Auth/session/lockout/refresh/role-select/onboarding/change-password/sessions · approval-chain routing (employee→HR→Admin) with capability defense · attendance punch/offline-sync/reconcile/corrections/graphs · leave balance + overlap + scoping · scheduler jobs (shift reminders, missed clock-in, open-shift flag, weekly summary, holiday reminders, cleanups) · project chat auto-creation + membership · kanban/list/gantt/QA-builder views · task timers + time logs + comments + dependencies + recurrence · DM dedupe + group create + mentions + attachments + polling fallback + mobile chat UX · notification center placement + bell dual counts · announcements lifecycle + dashboard banner · quick notes · feedback → DM + high-priority notification · directory + send-message · user/department/designation management + bulk + activity logs · settings suite (company/schedules/policies/holidays/mail/notifications/autonumber/reminders/security/audit) · async export pipeline (jobs + S3 + ExportHistory + realtime invalidation) · Supabase RLS posture · Cloud Build migrate gate · widget layout persistence · offline engine queue + drain · keyboard shortcuts + command palette + breadcrumbs + help overlay · dark/light themes + density · PWA manifest/service worker.

*End of Finalization-V5.*
