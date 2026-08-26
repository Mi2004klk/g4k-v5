# Audit Report — Games4Kings Workplace OS

**Audit date:** 2026-08-26 · **Read-only audit** — no source code, schema, data, or configuration was modified at any point; `Audit-Report.md` is the only file written.

## Audit Scope & Method

* **Method:** three-stage code-first audit of `apps/api` (Laravel 12), `apps/web` (Next.js 16), `packages/ui`, configs, CI, tests: (1) full-project mapping (routes/pages/controllers/models/events/stores/hooks), (2) file-by-file deep pass over every remaining surface following `UI → component → state → handler → API → DB → response → state → UI → related modules` and the reverse direction for realtime, (3) zero-trust re-verification of every load-bearing finding anchor plus a production-readiness/navigation/duplication pass.
* **Repo state:** HEAD `b614c0a`; one uncommitted source diff (`apps/api/app/Http/Controllers/AttendanceController.php` — attendance-graph contract fix, see AUD-ATT-GRAPH/AUD-DEPLOY).
* **Toolchain during audit:** `tsc --noEmit` = clean · `vitest run` = **6 failures / 3 files** (CI runs this — AUD-TESTS) · CI also runs web lint + bundle-size + OpenAPI lint and a pgsql `php artisan test` job.
* **Requirement reconstruction:** explicit client requirements = the 20 reported problem areas (dashboard widget sync; widget data accuracy; pending approvals; recent activity; quick task; scratchpad; project area; toolbar/kanban layout; app-wide stability; login stuck; project detail loading; UI/responsiveness; functionality completeness; data synchronisation; DB/backend/API; role behaviour; notifications/chat; loading/error states; performance; testing) plus `attendance.md` (attendance product spec). Everything else is implementation-derived and labelled as such.
* **Scale:** ~155 files / ~40,000 lines inspected; every page, route, controller, model observer/listener/event/job, widget, and store accounted for (File/Module Coverage below).

## Project Architecture Map

* **Backend:** Laravel 12 API — Sanctum tokens (access 15 min + refresh 7 d HttpOnly cookie), capability middleware (`RequireCapability` → `CapabilityMatrix` over `role_capabilities`; roles: super_admin/hr/employee), HR scoping via `HrScope` (managed departments from `department_hr`), model observers (Project/Task/AttendanceDay/LeaveRequest/User → cache invalidation; Notification → broadcast), ~200 endpoints in `routes/api.php`, queued jobs + 5-min scheduler loop, hosted Pusher broadcasting, S3-style default storage disk.
* **Frontend:** Next.js 16 App Router — 29 routes (6 auth pages + dashboard root and 13 area pages + 5 redirect shims), one TanStack Query client (`staleTime 60s`, `refetchOnWindowFocus:false`), Zustand stores (auth/ui/timer/recent), IndexedDB offline engine (punches + mutation queue), laravel-echo/pusher-js realtime.
* **Truth flow:** DB is the single source of truth; derived state fans out through per-viewer server caches (`dashboard_init_*` 120 s, `dashboard_metrics_*` 300 s, `dashboard_global` 300 s) into one client query per dashboard plus per-module queries; realtime invalidation exists for exactly one event (`attendance-updated`).

## File / Module Coverage

| File/Group | Purpose | Category | Status |
|---|---|---|---|
| `apps/api/routes/*` (api/channels/console/web) | Route map, broadcast authz, schedule | AUD-ARCH/REALTIME | Findings (SEC, scheduler OK) |
| `apps/api/app/Http/Controllers/*` (30) | All module endpoints | per-category | All read; findings per category |
| `apps/api/app/Services/*` (Attendance/Approval/Task/CapabilityMatrix/Recurrence/AutoNumbering/Notification/AuditLogger) | Domain logic | AUD-ATT-BE etc. | Findings |
| `apps/api/app/Observers/*`, `Listeners/*`, `Events/*`, `Jobs/*` | Cache invalidation, approval/chat fan-out, async work | AUD-DASH-SYNC etc. | Findings |
| `apps/api/app/Models/*` (40+) | ORM (fillable/casts/relations verified where findings touch them) | per-category | Findings (AttendanceDay fillable) |
| `apps/api/config/*`, `bootstrap/app.php`, `cloudbuild.yaml`, `vercel.json` | Runtime + deploy config | AUD-SEC/DEPLOY | Findings |
| `apps/web/src/app/**` (29 pages) | All routes incl. 5 redirect shims | AUD-NAV | Findings (nav audit) |
| `apps/web/src/components/**` (~100) | Widgets, tables, forms, dialogs, app-shell | per-category | All logic-bearing components read |
| `apps/web/src/hooks/*`, `stores/*`, `lib/*` | Data layer | AUD-STATE/DASH-SYNC | Findings |
| `packages/ui/src/components/*` | Shared primitives (Toolbar deep-read; rest exercised via pages) | AUD-UI-LAYOUT | Findings |
| `apps/web/src/__tests__/**`, `apps/api/tests/**`, `.github/workflows/ci.yml` | Tests + CI | AUD-TESTS | Findings |

---

## Index

| ID | Category | Primary File(s) | Status |
|---|---|---|---|
| AUD-ARCH | Architecture & project map | — | OK (documented) |
| AUD-DOC | Spec/reality mismatch (`attendance.md`) | `attendance.md` | Findings |
| AUD-AUTH | Authentication & sessions | `AuthController.php` | Findings |
| AUD-AUTH-GUARD | Frontend auth guards / login-stuck | `dashboard/layout.tsx` | Findings |
| AUD-DASH | Dashboard page & widget engine | `widget-engine.tsx` | Findings |
| AUD-DASH-SYNC | Dashboard synchronisation & caching (systemic) | `DashboardController.php` | Findings |
| AUD-DASH-METRICS | Widget & report data accuracy | `DashboardController.php`, widgets | Findings |
| AUD-DASH-PENDING | Pending Approvals widget | `DashboardController.php:42-183` | Findings |
| AUD-DASH-ACTIVITY | Recent Activity widget | `DashboardController.php:259-282` | Findings |
| AUD-QUICKTASK | Quick Task widget | `quick-task-widget.tsx` | Findings |
| AUD-SCRATCH | Quick Scratchpad widget | `quick-notes.tsx` | OK after code audit |
| AUD-ATT-BE | Attendance backend | `AttendanceService.php` | Findings |
| AUD-ATT-FE | Attendance frontend | `components/attendance/*` | Findings |
| AUD-ATT-GRAPH | Attendance graph/calendar/analytics | `AttendanceController::graph` | Findings |
| AUD-LEAVE | Leave module | `LeaveRequestController.php` | Findings |
| AUD-PROJ | Projects (backend + frontend) | `ProjectController.php` | Findings |
| AUD-TASK | Tasks backend | `TaskController.php` | Findings |
| AUD-TASK-FE | Tasks frontend (kanban/tab/detail) | `tasks-tab.tsx` | Findings |
| AUD-CHAT | Chat | `ChatController.php` | Findings (minor) |
| AUD-NOTIFY | Notifications | `NotificationController/Service` | OK after code audit |
| AUD-REALTIME | Realtime/broadcast contracts | `app/Events/*` | Findings |
| AUD-USERS | User management | `UserController.php` | Findings (minor) |
| AUD-DIR | Directory / Departments / Designations | `DirectoryController.php` | OK after code audit |
| AUD-PICKERS | Entity pickers truncated by pagination | `departments-tab.tsx:132-136` | Findings |
| AUD-REPORTS | Reports & exports | `GenerateReportJob.php` | Findings |
| AUD-AUDIT | Audit logs | `AuditLogController.php` | OK after code audit |
| AUD-SETTINGS | Settings | `SettingsController.php` | OK after code audit |
| AUD-QA | QA forms | `QaController.php` | OK after code audit |
| AUD-TIMER | Task/project timer & time logs | `timer-store.ts` | Findings (minor) |
| AUD-ANNOUNCE | Announcements | `AnnouncementController.php` | Findings |
| AUD-PHASES | Project phases | `PhaseController.php` | OK after code audit |
| AUD-UI-LAYOUT | Toolbar nesting / layout | `packages/ui/.../toolbar.tsx:237-247` | Findings |
| AUD-NAV | Navigation & routing | `command-palette.tsx` | Findings |
| AUD-STATE | State management / offline engine | `query-keys.ts` | Findings (minor) |
| AUD-SEC | Security | `routes/api.php:52-114` | Findings |
| AUD-TESTS | Tests & CI | `ci.yml` | Findings |
| AUD-DEPLOY | Deploy/env parity | working-tree diff | Findings |

---

## Client Requirement vs Implementation Matrix

Explicit client requirements (the 20 reported areas) versus verified implementation. Statuses: Implemented Correctly / Partially Implemented / Incorrectly Implemented / Broken / Missing / Duplicated-Conflicting / Unknown.

| Requirement | Expected Behaviour | Current Implementation | Status | Evidence | Category |
|---|---|---|---|---|---|
| 1. Widget synchronisation (Admin/HR/Employee) | Mutations reflect in widgets immediately/consistently | Layered 120 s init + 300 s metrics server caches per viewer; observer never clears init; ad-hoc writer clears; frontend 5-min staleTime, no refetch on mount/focus, no polling; one realtime event | **Broken** | `DashboardController.php:36-38,210-212`; `CacheInvalidationObserver.php:15-37`; `use-dashboard-init.ts:23-25` | AUD-DASH-SYNC |
| 2a. Total Employees widget | Count from employee source; present/absent from attendance; updates on change | Total from `dashboard_global` (cleared on user writes ✓) but viewer metrics cache not → ≤5 min lag; present = present+late (cached); "absent" = remainder incl. on-leave | **Partially Implemented** | `DashboardController.php:226-252`; `metric-widget.tsx:141-147` | AUD-DASH-METRICS |
| 2b. Active Projects widget | Active count from Project area; completions move immediately | Correct source (`projects.status='active'` via `dashboard_global`); viewer caches not invalidated on transitions → lag ≤120/300 s | **Partially Implemented** | `DashboardController.php:353-360` | AUD-DASH-METRICS/SYNC |
| 2c. Today's Employee widget | Clocked-in/on-time/late/absent/on-leave/unannounced-leave | Both widgets aggregate a **paginated(20)** overview client-side → wrong above 20 staff; absent definition diverges from attendance page | **Incorrectly Implemented** | `admin-today-attendance-widget.tsx:18-28`; `AttendanceController.php:427-428,489-506` | AUD-DASH-METRICS |
| 3. Pending Approval widget | Tasks + leaves pending, synced with workflows | List correct in scope but task/project submissions invalidate no admin cache & no broadcast → ≤120 s lag; kanban path to review is 422; leave inline decisions work | **Partially Implemented / Broken (task path)** | `TaskController.php` (no clears in submitForReview); `tasks-tab.tsx:225-231` + `TaskController.php:442-444` | AUD-DASH-PENDING, AUD-TASK-FE |
| 4. Recent Activity widget | Clock-in/break/task submits/completions/profile updates in feed | Backend **excludes** attendance events; task mutations un-audited; frontend maps attendance events that can never arrive | **Incorrectly Implemented** | `DashboardController.php:265`; `recent-activity-widget.tsx:79-82` | AUD-DASH-ACTIVITY |
| 5. Quick Task widget | Standalone task + employee + priority + end date + deadline | Standalone/assignee/notification/chat work; **priority/date/deadline UI missing** (backend accepts them) | **Partially Implemented** | `quick-task-widget.tsx:78-117` vs `TaskController.php:259-265` | AUD-QUICKTASK |
| 6. Quick Scratchpad | Notes with persistence + resizing | CRUD + cache-clears on write; resize via grid handles | **Implemented Correctly** | `QuickNoteController.php:50-86` | AUD-SCRATCH |
| 7. Project area (tabs/cards/active-completed) | Accurate counts, avatars, realtime progress, correct status views | Status filter + progress (TaskObserver) correct; priority sort **500s on pgsql**; tab count badge key not invalidated; member avatars are initials-only | **Partially Implemented** | `ProjectController.php:87`; `projects/page.tsx:14-20` | AUD-PROJ |
| 8. Toolbar / Kanban header | Single clean container, horizontal, responsive, connected | Shared Toolbar renders its own card inside each page's second card; nowrap + fixed search width in overflow-x parents; stacked boxed rows + kanban bleed container | **Incorrectly Implemented** | `toolbar.tsx:237-247`; `projects-tab.tsx:100-101`; `tasks-tab.tsx:902-911` | AUD-UI-LAYOUT |
| 9. App-wide stability | No refresh-dependent/stale/inconsistent behaviour | Systemic cache architecture (row 1) + dead realtime listeners + query-key families outside invalidation prefixes | **Broken (systemic)** | AUD-DASH-SYNC, AUD-ATT-FE, AUD-STATE | multiple |
| 10. Login stuck | Login proceeds without manual refresh | `isErrorCapabilities` early-return blocks AuthGuard redirect → "Session could not load" dead-end on 403 flows | **Incorrectly Implemented** | `dashboard/layout.tsx:184-213` | AUD-AUTH-GUARD |
| 11. Project detail intermittent loading | Detail loads reliably | Detail fetch + scoping sound (findOrFail + 403); no divergent code path found — intermittent failures best explained by systemic 500s (priority sort) + stale caches; residual cause **Unknown** (needs prod logs) | **Unknown / partially attributed** | `projects/[id]/page.tsx:41-43`; `ProjectController.php:87` | AUD-PROJ |
| 12. UI / responsiveness | No overflow/clipping/misalignment at breakpoints | Toolbar pattern + fixed-height calcs (`100dvh-140px/180px`); mobile nav/sheets/dialogs/touch-drag implemented | **Partially Implemented** | AUD-UI-LAYOUT + Responsive Audit below | AUD-UI-LAYOUT |
| 13. Functionality completeness | Every control works | Dead/incorrect controls: kanban drag-to-review/done, "Overdue" preset, "Redo" filter, "By Department" graph grouping, dept pickers >20, palette `?tab=all`/`?correction=true` targets | **Partially Implemented** | AUD-TASK-FE, AUD-ATT-GRAPH, AUD-PICKERS, AUD-NAV | multiple |
| 14. Data synchronisation / source of truth | One definition per business fact | Duplicate/conflicting: absent (2 definitions), pending_approvals (2 formulas), leave status (leave vs approval), working-days (3 calculators), attendance state (4 frontend derivations) | **Duplicated/Conflicting** | Duplicate Implementations section | multiple |
| 15. DB/backend/API | Schema/queries/permissions correct | pgsql-incompatible SQL ×2 (FIELD, double-quoted literals); HR scope leak in summary exports; `approver_id` referenced but never exists; `unapproved_break_seconds` never persisted | **Partially Implemented** | AUD-ATT-GRAPH, AUD-REPORTS, AUD-LEAVE, AUD-ATT-BE | multiple |
| 16. Role behaviour (Admin/HR/Employee) | Consistent role boundaries | Capability + HrScope enforcement solid everywhere live; leaks: leave `show()` unscoped for HR, export summaries, stale capability cookie on account switch | **Partially Implemented** | AUD-LEAVE, AUD-REPORTS, AUD-AUTH | multiple |
| 17. Notifications / chat events | Complete, timely, correct-recipient delivery | Notification pipeline solid (incl. realtime toast); DMs create no notification (30 s badge poll); task/project submission notifications fire but dashboard lag remains | **Partially Implemented** | `ChatController.php:168-184` | AUD-CHAT, AUD-NOTIFY |
| 18. Loading/error/empty/refresh states | Coherent async states | Generally good (skeletons, retries, empties); gaps: capabilities dead-end, frozen break ticker, blank-tab nav target, metrics "absent ~0" wrong-data state | **Partially Implemented** | AUD-AUTH-GUARD, AUD-ATT-FE, AUD-NAV | multiple |
| 19. Performance | No duplicate/storm requests | Punch refetch storm (all clients × every punch), Echo rebuild per token refresh, duplicate task fetch on detail open, off-registry query keys | **Partially Implemented** | `use-dashboard-init.ts:15-17`; `use-reverb.ts:120` | AUD-DASH-SYNC/REALTIME |
| 20. Testing | Automated coverage of critical workflows | 37 FE tests; **6 red (written for a never-merged redesign)**; CI runs them; no coverage for dashboards/sync/leave/kanban approvals/chat | **Broken (red) / Minimal** | AUD-TESTS, AUD-DOC | AUD-TESTS |

---

## Workflow Coverage

Status per major workflow (entry → … → final UI state):

| Workflow | Chain | Status | Break point(s) |
|---|---|---|---|
| Login → role-select → dashboard | login → setAuth → guards → init | Partially | 403 dead-end branch (AUD-AUTH-GUARD) |
| Clock in/out/breaks | TimeClock → offlineEngine → punch API → reconcile → caches → broadcast → widgets | Partially | viewer caches + dead table listeners (AUD-DASH-SYNC/ATT-FE) |
| Continue shift | clock_out → clock_in again | Partially | visible total resets to 0 (`time-clock-widget.tsx:115`) |
| Attendance correction | org table → member sheet → correct API → reconcile → notify | Mostly OK | admin-table invalidation key miss |
| Leave request → approve | form → approval chain → balance → on_leave rows → widgets | Partially | service-bypassing listener (schedule/manual-source/caches), cancel-notify dead, cancelled shows "pending" |
| Task create (quick + full) → assign | widgets/dialogs → store → notifications + chat | Mostly OK | priority/date UI missing in Quick Task; pickers truncated |
| Task start → submit for review | detail sheet → submitForReview → approval + notifications | Mostly OK | no dashboard invalidation/broadcast → admin lag |
| Kanban move | drag → PUT status | **Broken** | 422 without submission note (AUD-TASK-FE) |
| Task approve/redo | detail sheet → approve/redo → done/in_progress + chat + activity | Partially | narrow client invalidations; reorder/bulk bypass pipeline |
| Project create → members → tasks → submit → review → completed | full chain | Partially | FIELD() 500 on sort; submit/review cache gaps; count-badge key |
| Announcements | composer → broadcast → widget | Partially | per-viewer init cache ≤120 s |
| Chat DM / group / project chat | full chain incl. realtime | OK (minor) | no DM notification |
| Exports | trigger → job → S3 → realtime + download | OK (one leak) | HR summary-export scope leak |
| Demo data seed/purge | settings → queued jobs | OK | purge no longer touches audit_logs |

---

## [AUD-ARCH] Architecture & Project Map

* Purpose: canonical structure/truth-flow reference (content in *Project Architecture Map* above).
* Summary: Laravel 12 API + Next.js 16 App Router + shared UI package; DB is single source of truth with per-viewer derived caches; hosted Pusher; S3 storage.
* Findings: none specific to structure.
* Dependencies: everything below.

## [AUD-DOC] Spec/Reality Mismatch — `attendance.md` claims fixes absent from the code

* Files: `attendance.md` (§3–6) vs `AttendanceService.php`, `Listeners/LeaveAttendanceIntegration.php`, `Models/AttendanceDay.php:6-19`, `AttendanceController.php:87-94,269-273`, `time-clock-widget.tsx:115`, `timer-store.ts:61-67`, `use-dashboard-init.ts:15-17`, `admin/hr-attendance-table.tsx`, today widgets, `today-summary-card.tsx`, `attendance/page.tsx:168`
* Purpose: attendance product spec + remediation record.
* Current behaviour: §4 lists 12 applied fixes; item-by-item verification shows **10–11 absent** (only holiday-vs-worked precedence, `AttendanceService.php:252-258`, is in the tree). No `markLeaveDays` (grep-verified), no `src/lib/attendance.ts`, `unapproved_break_seconds` not fillable, dead listeners still present, widgets still paginated-capped, `startTimer(timestamp, 0)` still zeroes Continue-Shift, blanket init invalidation remains, `stopTimer` leaves stale fields, dead `team_today_*` half-code.
* Findings:

  * [Critical] A planner reading `attendance.md` §4/§6 would treat the attendance fan-out defects as fixed; they are not — changes never merged or reverted — `attendance.md:129-178`
  * [High] The red vitest suite is this phantom implementation's residue (tests expect "Pause for Break" copy, rollback semantics, and table placeholders/analytics header of the never-merged redesign) — `time-clock-widget.test.tsx:126` vs `time-clock-widget.tsx:264`; `admin-attendance.test.tsx:46-63`
  * Positive: §3's solution design is sound and matches this audit's independent conclusions — recommended blueprint for re-implementation.
* Dependencies: `AUD-ATT-BE`, `AUD-ATT-FE`, `AUD-TESTS`, `AUD-DASH-SYNC`
* Open questions: do the attendance.md changes exist on another branch/commit? (Not found in this tree.)

## [AUD-AUTH] Authentication & Sessions

* Files: `AuthController.php`; `routes/api.php:119-140`; `ForcePasswordChange/ForceOnboarding/EnsureTokenIsNotRefresh`; `(auth)` pages
* Purpose: credential lifecycle, token rotation, forced flows.
* Current behaviour: login by email/username/employee_id with rate-limit + lockout + suspicious-IP alerts; refresh rotation + max-device; role-select re-issues `role:`-tagged tokens; change-password revokes all; sessions list/revoke broadcast.
* Findings:

  * [Medium] Stale `g4k_capabilities` cookie seeds `useCapabilities().initialData` → previous user's capability-gated UI for ≤5 min after account switch — `capabilities.ts:38-46`
  * [Medium] Onboarding password step discards the rotated token pair and recovers only via explicit refresh + silent-refresh path — `onboarding/page.tsx:87,116-118`
  * [Low] Token `role:` ability vs DB `active_role` can disagree mid-session after admin role edits — `AuthController.php:309-317` vs `UserController.php:250-252`
  * [Low] IP-based suspicious-login check under `trustProxies(at:'*')` — prod proxy chain unverified — `bootstrap/app.php:19`
* Related workflows: login, role-select, onboarding, password flows.
* Open questions: production proxy/IP correctness (needs live probe).

## [AUD-AUTH-GUARD] Frontend Auth Guards / Reported "Login stuck"

* Files: `login/page.tsx:66-108`; `auth-guard.tsx:30-118`; `dashboard/layout.tsx:180-213`
* Current behaviour: layout gates on capabilities query **before** mounting AuthGuard.
* Findings:

  * [High] `isErrorCapabilities` early-return renders instead of `<AuthGuard>` — any 403 from `/me/capabilities` (not exempted by either force-middleware) traps the user on "Verifying session…" → "Session could not load" with a Retry that 403s again; the guard's redirect never mounts — `dashboard/layout.tsx:184-213`
  * [Medium] First-login (no cookie) + one transient network error hits the same dead-end — `capabilities.ts:36-50`
  * [Low] Single failed silent refresh hard-redirects to login; two tabs racing refresh rotation can spuriously log out — `api-client.ts:150-153`
* Related workflows: requirement 10.

## [AUD-DASH] Dashboard Page & Widget Engine

* Files: `dashboard/page.tsx`; `widget-engine.tsx`; `reconcile-layout.ts`; `ui-store.ts`
* Current behaviour: role-gated widget catalogs on react-grid-layout with persisted per-user layout; all widgets share one `useDashboardInit` query.
* Findings:

  * [Medium] Only global refresh; server caches can still answer stale after it — `widget-engine.tsx:260-263`
  * [Low] Channel subscription never released (refcount leak) — `use-dashboard-init.ts:11-18`
  * [Low] Collapse→expand discards custom resized height — `widget-engine.tsx:60-78`
* Related workflows: all dashboard widgets (requirements 1–6).

## [AUD-DASH-SYNC] Dashboard Synchronisation & Caching (systemic root cause)

* Files: `DashboardController.php:15-195, 204-446`; `CacheInvalidationObserver.php:15-37`; `AttendanceController.php:87-94`; `TaskController.php:738-762`; `LeaveRequestController.php:248-259`; `use-dashboard-init.ts`; `providers.tsx:80-93`
* Purpose: the application's entire derived-data propagation layer.
* Current behaviour (Data Synchronisation Audit): `mutation → DB → ad-hoc partial cache forget → /dashboard/init (120 s per-viewer) → RQ (5-min staleTime, no mount/focus refetch, no polling) → widgets`; realtime = one event; observer clears metrics only for the affected user and never init.
* Findings:

  * [High] init outer cache 120 s defeats every client invalidation — `DashboardController.php:36-38`
  * [High] metrics 300 s per-viewer never cleared for viewers of other people's changes (Total Employees ≤5 min lag) — `:210-212` + `CacheInvalidationObserver.php:22-34`
  * [High] Observer never clears `dashboard_init_*`; writers enumerate users inconsistently; `submitForReview`/project `submit`/`review` clear nothing (tasks) or not init (projects) — `TaskController.php` (submit), `ProjectController.php:350-355,397-402`
  * [High] Frontend `staleTime 5 min` + `refetchOnMount:false` + `refetchOnWindowFocus:false` — navigation never refetches — `use-dashboard-init.ts:23-25`
  * [Medium] Dual today-sources on one dashboard (metrics vs overview) disagree for minutes
  * [Medium] Punch refetch storm + puncher metadata leak on `company.global` (any-auth channel) — `channels.php:26-28`, `use-dashboard-init.ts:15-17`
  * [Medium] Timer store seeded from 5-min-stale init slice while `/attendance/me/today` (30 s ETag) feeds only the badge — `dashboard/layout.tsx:130-139`
  * [Medium] `safeCall` controller-instantiation + defensive double-unwrap contract — `DashboardController.php:22-34`
* Related workflows: requirements 1, 2, 3, 9, 19.

## [AUD-DASH-METRICS] Widget & Report Data Accuracy

* Files: `DashboardController.php:224-404`; `AttendanceController.php:420-572`; both today widgets; `metric-widget.tsx`; `ReportController::attendanceSummary`
* Findings:

  * [High] Both today widgets aggregate a paginated(20) endpoint client-side → wrong counts above 20 staff; unpaginated `/attendance/team-today` unused by them — `admin-today-attendance-widget.tsx:18-19`, `hr-team-attendance-widget.tsx:22`, `AttendanceController.php:362-364,427-428`
  * [High] `absent` counted from `status='absent'` rows **nothing ever writes** (metrics + attendance-summary report ~0 absent) vs attendance page's correct LEFT-JOIN/COALESCE definition — `DashboardController.php:239-252`, `AttendanceController.php:489-506`
  * [Medium] `pending_approvals` two formulas in one payload (list includes tasks-in-review; count doesn't) — `:42-183` vs `:254-256,310-331`
  * [Medium] Breakdown labels on-leave as "absent/unclocked"; tooltip "currently active" for today-total — `metric-widget.tsx:50,54,141-147`
* Related workflows: requirements 2a/2b/2c, reports.

## [AUD-DASH-PENDING] Pending Approvals Widget

* Files: `DashboardController.php:42-183`; `pending-approvals-widget.tsx:31-50`; `LeaveRequestController::decision:197-262`; `leave-approval-actions-cell.tsx:27-75`
* Findings:

  * [High] Task/project submissions: no admin cache invalidation, no broadcast → widget lags ≤120 s (chain: create → pending state → widget ✗ → approval → final state → widget update ✗ until TTL)
  * [Medium] `id = approval_id ?? leave_request_id` + unordered `id OR approvable_id` lookup — fragile with any second approval row — `DashboardController.php:75`, `LeaveRequestController.php:204-208`
  * [Low] Decisions invalidate dashboardInit only (widget) / orgLeaveRequests only (page cell); `admin_leave_history` untouched ≤60 s — `leave-approval-actions-cell.tsx:67-70`
* Related workflows: requirement 3.

## [AUD-DASH-ACTIVITY] Recent Activity Widget

* Files: `DashboardController.php:259-282`; `recent-activity-widget.tsx:20-112`; `hr-activity-feed-widget.tsx:37-39`
* Findings:

  * [High] Feed **excludes** `attendance.%` while frontend maps those events (dead code); task mutations un-audited → requirement 4 unmet at data layer — `DashboardController.php:265` + `recent-activity-widget.tsx:79-82`
  * [Medium] HR "activity" widget reads today's roster, not activity; 300 s cache bypassed by raw-DB leave updates
* Related workflows: requirement 4.

## [AUD-QUICKTASK] Quick Task Widget

* Files: `quick-task-widget.tsx`; `TaskController::store:252-364`
* Findings:

  * [Medium] Priority/end-date/deadline UI missing though backend accepts them — `quick-task-widget.tsx:78-117` vs `TaskController.php:259,264-265`
  * [Medium] Assignee list `/directory?per_page=100` truncated above 100 — `:26-29`
  * [Low] Doesn't invalidate the projects count badge
* Related workflows: requirement 5 (persistence/assignment/notifications/chat verified working).

## [AUD-SCRATCH] Quick Scratchpad Widget

* Files: `quick-notes.tsx`; `QuickNoteController.php`
* Status: **OK after code audit** — writes clear `dashboard_init_*` + `quick_notes_*` (`:50-52,69-71,84-86`); resize implemented via grid handles. [Low] height bound only by grid.
* Related workflows: requirement 6.

## [AUD-ATT-BE] Attendance Backend

* Files: `AttendanceService.php`; `AttendanceController.php`; `LeaveAttendanceIntegration.php`; `FlagOpenShifts.php`; `AlertMissedClockIn.php`; `Models/AttendanceDay.php:6-19`
* Purpose: immutable punch log + day reconciliation (the system's strongest subsystem).
* Current behaviour: transaction + row-lock state machine, client-id idempotency, overnight anchoring, corrections with force-recompute, 5-min scheduler jobs.
* Findings:

  * [High] `unapproved_break_seconds` computed but never persisted (fillable omission) — `AttendanceService.php:273` vs `Models/AttendanceDay.php:6-19`
  * [High] Punch cache-clears cover only the puncher — `AttendanceController.php:87-94`
  * [High] Leave integration bypasses the service (raw DB writes): default schedule vs user schedule (marked ≠ deducted possible), `source:'server'` clobbers `manual`, no Feb-29 fallback, no cache invalidation — `LeaveAttendanceIntegration.php`
  * [Medium] Recurring holidays deducted-but-not-marked (exact-date calculators vs recurring-excluding listener)
  * [Medium] Holiday cache v2/v1 key mismatch → 24 h stale day statuses — `AttendanceService.php:239` vs `HolidayController::clearHolidayCache`
  * [Medium] Manual-source branch skips totals/status recompute — `AttendanceService.php:213-222`
  * [Low] Dead `team_today_*` half-code — `AttendanceController.php:272-273,93-94`
  * [Low] Raw-date vs company-tz event filtering straddle at midnight edges
  * [Low] `notifyOpenShifts` positional-by-luck array call — `:880-890`
  * [Low] `'pending'` status never written; `'overtime'` not a status
* Related workflows: clock in/out, breaks, corrections, leave marking.

## [AUD-ATT-FE] Attendance Frontend

* Files: attendance pages + 18 components (all read)
* Findings:

  * [High] Dead realtime listeners (`presence-org` / `.attendance.updated`) on both main consoles and HR analytics → no live refresh — `admin-attendance-table.tsx:91`, `hr-attendance-table.tsx:94`, `hr-attendance-analytics.tsx:41` (correct: `admin-attendance-analytics.tsx:22`, `admin-open-shifts-table.tsx:75-83`)
  * [Medium] Continue Shift zeroes visible total — `time-clock-widget.tsx:115`
  * [Medium] Frozen ongoing-break ticker + second break derivation — `today-summary-card.tsx:86`
  * [Low] `'overtime'` dead status branch; 4 independent status derivations — `attendance/page.tsx:168`
  * [Low] Correction invalidation misses admin-table key prefix — `hr-correction-dialog.tsx:132-135`
* Related workflows: requirement 1/9/18.

## [AUD-ATT-GRAPH] Attendance Graph / Calendar / Analytics

* Files: `AttendanceController::graph:909-968` (uncommitted fix in working tree); `attendance-graph.tsx:61-69`; `admin-attendance-calendar.tsx:23-28`; `admin-attendance-view.tsx:50-62`
* Findings:

  * [Critical] HEAD returns bare array + double-quoted SQL (invalid on pgsql → 500) while frontend reads `data.stats` → graphs/calendars/analytics broken in prod until the uncommitted diff ships
  * [Medium] Hours/overtime series always 0 (columns not selected) — `attendance-graph.tsx:68-69` vs `:955-963`
  * [Medium] "By Department" grouping unsupported → mislabeled date data — `admin-attendance-view.tsx:57-61`
* Related workflows: org attendance analytics/calendar.

## [AUD-LEAVE] Leave Module

* Files: `LeaveRequestController.php`; `ApprovalService.php`; `LeaveAttendanceIntegration.php`; leave components
* Findings:

  * [High] Cancel notification dead (`approver_id` never exists as column) — `LeaveRequestController.php:460-470`
  * [High] Employee history filters `approval.status` → cancelled leaves under "pending" filter; exports same duality — `:298-303`, `:441-443`, `GenerateReportJob.php:343`
  * [Medium] `show()` unscoped for any HR — `:264-277`
  * [Medium] Duplicate `calculateWorkingDays` (controller + model) — drift risk
  * [Low] Escalation/self-approval guards/balance clamps/decision cache-clears verified correct
* Related workflows: requirement 3 (leave leg), attendance integration.

## [AUD-PROJ] Projects (Backend + Frontend)

* Files: `ProjectController.php`; projects pages/tabs/dialogs/cards
* Findings:

  * [Critical] `FIELD(priority,…)` sort = 500 on pgsql — `ProjectController.php:87` + `projects-tab.tsx:113-115`
  * [Medium] `submit`/`review` don't clear init/metrics → widget lag — `:350-355,397-402`
  * [Medium] Tab count badge key not prefix-matched by mutations — `projects/page.tsx:14-20`
  * [Medium] HR project without department loses manage rights — `:106-111` vs `:18-25`
  * [Low] `destroy` orphans phases/qa-submissions; update doesn't notify new members
* Related workflows: requirements 7, 11.

## [AUD-TASK] Tasks Backend

* Files: `TaskController.php`; `TaskService.php`; `RecurrenceService.php`; listeners
* Findings:

  * [High] `reorder()` path bypasses submission-note/QA/self-approval checks and completion side effects — `:502-534` vs `:430-450`
  * [Medium] `bulk` complete same bypass — `:131-137`
  * [Medium] `submitForReview`: no dashboard invalidation/broadcast
  * [Low] Redundant leave-status re-update in `ProcessApprovalDecision`
* Related workflows: task lifecycle (create→assign→start→submit→approve→activity).

## [AUD-TASK-FE] Tasks Frontend (Kanban / Tasks tab / Detail)

* Files: `tasks-tab.tsx`; `task-kanban-board.tsx:295-357`; detail sheet/overview; `tasks/[id]`; create dialog
* Findings:

  * [Critical] Kanban drag / context "Move to" Review|Done → PUT without note → 422 for all roles; only the detail-sheet submit path works — `tasks-tab.tsx:225-231` + `TaskController.php:442-444`
  * [Medium] "Overdue" preset silently unfiltered — `tasks-tab.tsx:187`
  * [Medium] "Redo" filter always empty — `tasks-tab.tsx:958`
  * [Medium] Approve/redo invalidate only `["task-detail",id]`; submit misses `dashboardInit` — `task-overview-tab.tsx:87-132`
  * [Low] `["tasks-submitted"]` outside prefix family; `tasks/[id]` duplicate fetch key
* Related workflows: requirements 3, 13.

## [AUD-CHAT] Chat

* Files: `ChatController.php`; `chat-tab.tsx`; message list/composer; chat page tabs
* Findings:

  * [Medium] Plain DMs create no recipient notification (mentions only) → ≤30 s badge lag — `ChatController.php:168-184`
  * [Low] Client-side pinned/unread ordering over 50-per-page cursors
* Status: otherwise OK (pagination, receipts, pins, attachments, access checks verified).

## [AUD-NOTIFY] Notifications

* Files: `NotificationController/Service/Observer`; `NotificationCreated.php`; `notifications-bell.tsx`
* Status: **OK after code audit** — realtime toast + counts + fallback polling verified; `approval-status-change` contract matches; per-type channels busted on settings save.

## [AUD-REALTIME] Realtime / Broadcast Contracts

* Files: `app/Events/*`; `routes/channels.php`; `use-reverb.ts`; all 20 `.listen()` sites
* Findings:

  * [High] Dead attendance-table listeners (wrong channel + name) — see AUD-ATT-FE
  * [Medium] `TaskCompleted`/`ApprovalSubmitted` broadcast to channels nobody listens to (overhead only)
  * [Medium] Echo instance rebuilt on every 15-min token refresh → full reconnect/resubscribe — `use-reverb.ts:120`
  * [Low] Missing `NEXT_PUBLIC_PUSHER_*` env silently disables all realtime — `use-reverb.ts:36-39`
* Related workflows: requirement 1/17.

## [AUD-USERS] User Management

* Files: `UserController.php`; user form/actions
* Findings:

  * [Medium] `assignments()` misses `task_assignees` pivot — `:672-675`
* Status: otherwise OK (role gating, last-admin guards, scoping, PII hiding, audit logging).

## [AUD-DIR] Directory / Departments / Designations

* Files: 3 controllers + 3 tabs + directory page
* Status: **OK after code audit** — visibility rules, CRUD, sync, archive/restore, invalidations verified.

## [AUD-PICKERS] Entity Pickers Truncated by Pagination

* Files: `departments-tab.tsx:132-136,608,665`; `tasks-tab.tsx:120-123`; `create-task-dialog.tsx:63`; `projects/[id]/page.tsx:61-63`
* Findings:

  * [Critical] Dept member/HR pickers `/users` default 20 → only 20 newest users assignable
  * [Medium] Task project pickers `/projects` default 15
  * [Medium] Project member pickers `/directory` default 24
* Related workflows: requirement 13.

## [AUD-REPORTS] Reports & Exports

* Files: `ReportController.php`; `GenerateReportJob.php`; `use-export.ts`; reports views
* Findings:

  * [High] Summary **export** branches missing HR scope (live endpoints scoped) → company-wide leak — `GenerateReportJob.php:362-366,394-398`
  * [Medium] Tasks export misses assignees pivot — `:137-140`
  * [Medium] Attendance-summary absent_days ~0 (never-written rows) — same root cause as AUD-DASH-METRICS
  * [Low] Whole-file streaming on download
* Status: chunking, CSV-injection sanitization, ownership, realtime completion verified OK.

## [AUD-AUDIT] Audit Logs

* Status: **OK after code audit** — filtered index, queued export, demo purge untouched.

## [AUD-SETTINGS] Settings

* Files: `SettingsController.php` + 11 components + work-schedules/holidays/password-reset controllers
* Findings:

  * [Medium] Holiday CRUD doesn't clear `all_holidays_array_v2` (cross-listed AUD-ATT-BE)
* Status: otherwise OK (masked mail password, category busts, capability clear, SMTP test, queue monitor, schedule cache clears).

## [AUD-QA] QA Forms

* Status: **OK after code audit** — builder/viewer/preview wired; server-side QA validation on submissions.

## [AUD-TIMER] Task/Project Timer & Time Logs

* Findings:

  * [Low] `_broadcastState` channel leak — `timer-store.ts:243-248`
  * [Low] `logTime` clears active-task cache side effect — `TimerController.php:76-79`
  * [Low] `stopTimer` leaves stale timestamps — `timer-store.ts:61-67`
* Status: gating, active-task broadcast (consumed), offline engine, cross-tab sync all OK.

## [AUD-ANNOUNCE] Announcements

* Findings:

  * [Medium] Writes clear only the actor's `announcements_*` cache → other viewers ≤120 s stale despite correct realtime event — `AnnouncementController.php:147,199,216,302`
  * [Low] Dead `'admin'` role check (`:34`); no "view dismissed" path (design choice)
* Status: scoping/urgency/dismissals/attachments otherwise OK.

## [AUD-PHASES] Project Phases

* Status: **OK after code audit.**

## [AUD-UI-LAYOUT] Toolbar Nesting / Layout (reported issue #8)

* Files: `packages/ui/src/components/toolbar.tsx:237-247`; `projects-tab.tsx:99-140`; `tasks-tab.tsx:598-619,900-1012,1066`
* Findings:

  * [High] Toolbar's own bordered card nested inside each page's second bordered card; nowrap + fixed search width inside overflow-x parents → horizontal scroll instead of wrap
  * [Medium] Stacked boxed rows + kanban bleed container (negative margins) → excessive vertical space / disconnected columns; `h-[calc(100dvh-140px)]` brittle
  * [Low] Mobile nav/sheets/dialogs/sticky tables OK; no other clipping found

## [AUD-NAV] Navigation & Routing

* Files: `command-palette.tsx`; `nav-group.tsx`; `breadcrumb.tsx`; redirect shims (`admin/attendance`, `admin/reports`, `org/leave`, `leave`, `notifications`, `announcements`); `dashboard/layout.tsx`; `use-url-state.ts`
* Purpose: route exposure, deep links, redirects.
* Current behaviour: nav filtered by capability + `hideForAdmin` (`nav-group.tsx:127-137`); all 5 legacy/alias redirect shims verified correct; breadcrumb label map + numeric-ID resolution (`breadcrumb.tsx:14-40`); mobile bottom nav capability-gated; URL-state tabs preserve back/forward and deep links.
* Findings:

  * [Medium] Palette "View Company Attendance" pushes `/dashboard/org/attendance?tab=all` — `all` matches no TabsTrigger (`calendar|today|analytics|shifts|leave`, default `calendar`) → Radix renders **no tab content** (blank body under the tab bar) — `command-palette.tsx:187` vs `admin-attendance-view.tsx:16`
  * [Medium] Palette "Attendance Correction" pushes `?correction=true` — **no component reads the param** (grep across web src: zero consumers) → lands on the plain org page without opening any correction UI — `command-palette.tsx:100`
  * [Low] Breadcrumb fetches user/project labels via ad-hoc queries (extra lookups per detail render) — `breadcrumb.tsx:7-10`
* Verified-good: redirects, no guard loops, back/forward, deep links (`?tab=`, `?highlight=`, `?conversation=`, `?task=`), role-gated nav, mobile FAB visibility.
* Related workflows: all navigation (requirements 12/13 support surface).

## [AUD-STATE] State Management / Offline Engine

* Files: stores, `offline-engine.ts`, `providers.tsx`, `query-keys.ts`
* Findings (State Management Audit):

  * [Medium] Query-key families outside the registry and prefix-invalidation reach (`["tasks-submitted"]`, `["projects","count"]`, `["attendance","team-today"]`, `["task-detail"]`, `["project-tasks"]`, `admin_leave_history`, `["tasks",taskId]`) — the mechanical "updates don't propagate" cause
  * [Low] Offline punch dedupe UTC-vs-company-tz boundary
* Verified-good: hydration gates, tab sync, optimistic rollbacks (tasks/leave/notifications), version guard, offline queue conflict semantics.

## [AUD-SEC] Security

* Files: `routes/api.php:52-114`; `config/broadcasting.php:47-56`; `bootstrap/app.php`; `apps/api/test_*.php`
* Findings:

  * [Critical] **Unauthenticated `GET /api/auth/reset-demo-passwords`** resets 13 live demo accounts (admin incl.), unlocks, clears limiters, nulls expiry setting, **flushes entire cache** — `routes/api.php:52-93`
  * [High] Public `GET /api/auth/debug-token` leaks security settings/TTLs/DB time — `routes/api.php:95-114`
  * [Medium] Pusher client TLS verification disabled — `config/broadcasting.php:47-56`
  * [Low] Untracked `test_*.php` scratch files at API root
* Related: AUD-DEPLOY.

## [AUD-TESTS] Tests & CI

* Findings:

  * [High] 6 red tests across 3 files — authored for the never-merged `attendance.md` redesign (copy/semantics/placeholders) — CI runs the suite → pipeline red
  * [Medium] Minimal coverage of critical surfaces (no dashboards/sync/leave/kanban-approval/chat tests; sqlite-vs-pgsql divergence locally)
* Verified-good: lint/typecheck/bundle/OpenAPI in CI; `tsc` clean.

## [AUD-DEPLOY] Deploy / Env Parity

* Findings:

  * [Critical] Attendance-graph fix uncommitted → prod graphs broken until committed + deployed
  * [Medium] `NEXT_PUBLIC_PUSHER_*` unverifiable from repo; absence silently disables realtime
  * [Low] `FRONTEND_URL` default localhost for reset links; runtime env parity unauditable

---

## Cross-Module Findings

* **Attendance → Dashboard:** punch → reconcile → puncher clears + broadcast → all clients invalidate init → server serves admin's ≤120 s-cached payload → lag despite realtime. `AttendanceController.php:87-98` + `DashboardController.php:36-38`.
* **Leave → Attendance → Widget:** approval → service-bypassing on_leave marking (default schedule, manual-clobber) → metrics after TTL; cancel re-reconciles ✓ but approver never notified; recurring holidays deducted-not-marked.
* **Task → Board → Approval → Activity:** sheet submit ✓; board move ✗ 422; reorder/bulk bypass pipeline; approve → progress+chat ✓, admin widgets only after TTL ✗; feed excludes the events it maps.
* **Project → Widget:** status/progress correct; `dashboard_global` cleared ✓; viewer init/metrics not ✗; count badge key mismatch.
* **HR scoping:** correct on all live endpoints; export summary branches are the one leak.

## Duplicate / Conflicting Implementations

| # | Duplication | Files | Which is used | Conflict impact |
|---|---|---|---|---|
| D1 | "Absent" defined twice (row-count vs LEFT-JOIN/COALESCE) | `DashboardController.php:239-252` + `ReportController` vs `AttendanceController.php:489-506` | page uses JOIN; metrics/reports use rows | metrics/reports show ~0 absent (High) |
| D2 | `pending_approvals` two formulas in one payload | `DashboardController.php` init vs metrics | both | badge vs count disagree (Medium) |
| D3 | Leave status dual source (`leave_requests.status` vs `approvals.status`) | `LeaveRequestController` index/admin vs history/destroy/export | mixed per endpoint | cancelled shows "pending" in history + exports (High) |
| D4 | Working-days calculators ×3 (controller, model, listener-embedded) | `LeaveRequestController.php:96-125`, `LeaveRequest::calculateWorkingDays`, `LeaveAttendanceIntegration.php` | first two per-user, listener default-schedule | marked ≠ deducted days (High) |
| D5 | Attendance state derived 4 ways on frontend | time-clock widget / summary badge / shift-log dot / calendar `getStatus` | all | color/label disagreements; dead `'overtime'` branch (Medium/Low) |
| D6 | Today-attendance widgets vs purpose-built `team-today` endpoint | widgets vs `AttendanceController::teamToday` | widgets use paginated overview | counts capped at 20 (High) |
| D7 | `hrToday` alias of `overview` + `teamToday` — three console endpoints, two shapes | `AttendanceController.php:362-364` | mixed consumers | drift risk (Low) |
| D8 | Duplicate avatar-upload implementations | `profile-header.tsx` + `profile-general.tsx` | both mount on profile page | redundant requests (Low) |
| D9 | Off-registry query keys vs `queryKeys` registry | various | mixed | invalidation misses (Medium) |
| D10 | Task "assignments" via `assignee_id` only vs pivot everywhere else | `UserController:672-675` | endpoint-only | incomplete assignment view (Medium) |
| D11 | Echo channel naming styles (`private-…` literal vs `private()`) | `use-reverb` consumers | both work under pusher-js | fragile convention (Low) |

## Navigation Audit

* **Verified-good:** 5 legacy/alias redirect shims all correct; capability-filtered sidebar + `hideForAdmin`; URL-state tabs (back/forward and deep links preserve state); guard chain has no redirect loops; mobile bottom nav gated; breadcrumb label map; `?highlight`/`?conversation`/`?task` deep links consumed.
* **Broken targets:** palette `?tab=all` → blank tab body (AUD-NAV, Medium); palette `?correction=true` consumed by nothing (AUD-NAV, Medium).
* **Unexposed backend surface (informational):** `/attendance/team-today` counts endpoint has no UI consumer — it is the correct source for fixing AUD-DASH-METRICS.

## UI/UX Audit (code-level)

* Toolbar double-container + nowrap-scroll + stacked boxed rows + kanban disconnect + fixed-height calcs — AUD-UI-LAYOUT (requirement 8 root causes).
* Dead-end error screens: capabilities dead-end (AUD-AUTH-GUARD); blank tab via palette (AUD-NAV).
* Misleading data displays: "absent/unclocked" incl. on-leave; "currently active" tooltip; ~0-absent reports (AUD-DASH-METRICS).
* Frozen live state: ongoing-break ticker (AUD-ATT-FE).
* Inconsistent affordances: list-view pin uses "more" icon vs grid star (`project-card.tsx:112-119`); duplicate "Task approved" toast (`task-overview-tab.tsx:107-108`).
* Feedback gaps: DM without notification (AUD-CHAT); correction completes without admin-table refresh (AUD-ATT-FE low).
* Generally-good patterns verified: skeletons/empties/retries across pages, confirm dialogs on destructive actions, optimistic rollbacks, sonner toasts, form drafts.

## Responsive Audit (code-level)

* Widget grid: 5 breakpoints (`GRID_COLS`, reconcile clamps x/w) — sound.
* Kanban: Pointer/Touch(200 ms delay)/Keyboard sensors all active (`task-kanban-board.tsx:257-261`) — mobile drag supported.
* Mobile: bottom nav + sheet menu; dialogs `max-h-[65dvh]`/`90dvh` scroll; tables sticky header/first col.
* Problem patterns: Toolbar `sm:flex-nowrap` + fixed `w-[260px]/[300px]` search inside `overflow-x-auto` wrappers → horizontal scroll not wrap (AUD-UI-LAYOUT); `h-[calc(100dvh-140px)]` (tasks) and `h-[calc(100vh-180px)]` (directory) fixed calcs brittle against variable header rows.
* No desktop-only assumptions found in nav or core flows.

## Data Synchronisation Audit

See **[AUD-DASH-SYNC]** for the complete architecture analysis; **Cross-Module Findings** for per-entity chains; **Duplicate / Conflicting Implementations** for competing definitions. Net assessment: no central invalidation bus; per-viewer caches + ad-hoc forgets + one realtime event + a no-refetch client ⇒ the reported stale/inconsistent/refresh-dependent symptoms are structural, not incidental.

## State Management Audit

See **[AUD-STATE]** and the sync architecture above. Client state itself (zustand + RQ) is coherent; the failure modes are cache/invalidation-layer and key-registry issues, plus the timer-store dual-freshness seeding (AUD-DASH-SYNC Medium).

## Production Readiness Findings

Grounded verdict per dimension (from the findings above — no generic opinion):

* **Functionality:** NOT READY — 3 workflows broken for normal use on production data (kanban review moves, attendance analytics/graphs on pgsql, priority sort 500); pickers truncate above small org sizes.
* **Security:** NOT READY — unauthenticated admin-password-reset endpoint is an active takeover vector on the live demo dataset; public debug endpoint.
* **Reliability / consistency:** NOT READY — systemic per-viewer cache staleness makes dashboards diverge from source modules for minutes; dead realtime listeners on main consoles.
* **Data integrity:** CONDITIONAL — leave marking/deduction divergence, un-persisted unapproved breaks, cancelled-as-pending history/exports, absent-rows definition gap.
* **Auth/navigation/UI shell:** MOSTLY READY — solid token/guard/nav machinery with one dead-end branch and two palette targets to fix.
* **Deploy pipeline:** BLOCKED — red CI (tests for a phantom design) and an uncommitted production-breaking fix that must ship.
* **Minimum production gate (order):** (1) commit+deploy graph fix; (2) remove/gate reset-demo + debug-token routes; (3) resolve red tests; (4) pgsql-safe SQL for priority sort; (5) kanban move contract; (6) dashboard cache/realtime redesign per `attendance.md` §3 blueprint; then per-module mediums.

## Not Covered / Needs Follow-up

* **Vercel/API runtime env** (`NEXT_PUBLIC_PUSHER_*`, `NEXT_PUBLIC_S3_PUBLIC_URL`, `FRONTEND_URL`, MAIL/S3) — not in repo; needs dashboard/live verification (realtime on/off, avatar + reset-link URLs).
* **Live runtime behaviour** — queue worker/scheduler liveness, Pusher auth in prod, Supabase RLS enforcement, proxy/IP chain; needs live probing.
* **Backend test suite execution** — pgsql service required locally; CI result for the API job at audit time unknown.
* **`packages/ui` primitives** beyond Toolbar/badge/state-helpers/DataTable — exercised indirectly only.

## Summary Stats

- Total categories: 36
- Critical findings: 6 (public reset-demo endpoint; attendance.md phantom implementation; uncommitted pgsql graph break; kanban drag-to-review/done 422; MySQL FIELD() 500 on pgsql; dept pickers capped at 20)
- High findings: 19
- Medium findings: 33 (incl. 2 new navigation findings: blank `?tab=all` palette target; dead `?correction=true` param)
- Low findings: 30
- Total findings: 88
- Approximate files inspected: ~155 · lines: ~40,000
- Requirement matrix: 20 explicit client requirements assessed — 1 Implemented Correctly, 8 Partially Implemented, 6 Incorrectly/Broken, 2 Duplicated-Conflicting, 1 Broken-red-tests, 2 Unknown/partially-attributed
- Categories requiring implementation planning: 25
- Areas requiring additional verification: 4 (listed above)

# Audit Report — Games4Kings Workplace OS
 
**Audit date:** 2026-08-26 · **Read-only audit** — no source code, schema, data, or configuration was modified at any point; `Audit-Report.md` is the only file written.
 
## Audit Scope & Method
 
* **Method:** three-stage code-first audit of `apps/api` (Laravel 12), `apps/web` (Next.js 16), `packages/ui`, configs, CI, tests: (1) full-project mapping (routes/pages/controllers/models/events/stores/hooks), (2) file-by-file deep pass over every remaining surface following `UI → component → state → handler → API → DB → response → state → UI → related modules` and the reverse direction for realtime, (3) zero-trust re-verification of every load-bearing finding anchor plus a production-readiness/navigation/duplication pass.
* **Repo state:** HEAD `b614c0a`; one uncommitted source diff (`apps/api/app/Http/Controllers/AttendanceController.php` — attendance-graph contract fix, see AUD-ATT-GRAPH/AUD-DEPLOY).
* **Toolchain during audit:** `tsc --noEmit` = clean · `vitest run` = **6 failures / 3 files** (CI runs this — AUD-TESTS) · CI also runs web lint + bundle-size + OpenAPI lint and a pgsql `php artisan test` job.
* **Requirement reconstruction:** explicit client requirements = the 20 reported problem areas (dashboard widget sync; widget data accuracy; pending approvals; recent activity; quick task; scratchpad; project area; toolbar/kanban layout; app-wide stability; login stuck; project detail loading; UI/responsiveness; functionality completeness; data synchronisation; DB/backend/API; role behaviour; notifications/chat; loading/error states; performance; testing) plus `attendance.md` (attendance product spec). Everything else is implementation-derived and labelled as such.
* **Scale:** ~155 files / ~40,000 lines inspected; every page, route, controller, model observer/listener/event/job, widget, and store accounted for (File/Module Coverage below).
 
## Project Architecture Map
 
* **Backend:** Laravel 12 API — Sanctum tokens (access 15 min + refresh 7 d HttpOnly cookie), capability middleware (`RequireCapability` → `CapabilityMatrix` over `role_capabilities`; roles: super_admin/hr/employee), HR scoping via `HrScope` (managed departments from `department_hr`), model observers (Project/Task/AttendanceDay/LeaveRequest/User → cache invalidation; Notification → broadcast), ~200 endpoints in `routes/api.php`, queued jobs + 5-min scheduler loop, hosted Pusher broadcasting, S3-style default storage disk.
* **Frontend:** Next.js 16 App Router — 29 routes (6 auth pages + dashboard root and 13 area pages + 5 redirect shims), one TanStack Query client (`staleTime 60s`, `refetchOnWindowFocus:false`), Zustand stores (auth/ui/timer/recent), IndexedDB offline engine (punches + mutation queue), laravel-echo/pusher-js realtime.
* **Truth flow:** DB is the single source of truth; derived state fans out through per-viewer server caches (`dashboard_init_*` 120 s, `dashboard_metrics_*` 300 s, `dashboard_global` 300 s) into one client query per dashboard plus per-module queries; realtime invalidation exists for exactly one event (`attendance-updated`).
 
## File / Module Coverage
 
| File/Group | Purpose | Category | Status |
|---|---|---|---|
| `apps/api/routes/*` (api/channels/console/web) | Route map, broadcast authz, schedule | AUD-ARCH/REALTIME | Findings (SEC, scheduler OK) |
| `apps/api/app/Http/Controllers/*` (30) | All module endpoints | per-category | All read; findings per category |
| `apps/api/app/Services/*` (Attendance/Approval/Task/CapabilityMatrix/Recurrence/AutoNumbering/Notification/AuditLogger) | Domain logic | AUD-ATT-BE etc. | Findings |
| `apps/api/app/Observers/*`, `Listeners/*`, `Events/*`, `Jobs/*` | Cache invalidation, approval/chat fan-out, async work | AUD-DASH-SYNC etc. | Findings |
| `apps/api/app/Models/*` (40+) | ORM (fillable/casts/relations spot-verified where findings touch them) | per-category | Findings (AttendanceDay fillable) |
| `apps/api/config/*`, `bootstrap/app.php`, `cloudbuild.yaml`, `vercel.json` | Runtime + deploy config | AUD-SEC/DEPLOY | Findings |
| `apps/web/src/app/**` (29 pages) | All routes incl. 5 redirect shims | AUD-NAV | Findings (nav audit) |
| `apps/web/src/components/**` (~100) | Widgets, tables, forms, dialogs, app-shell | per-category | All logic-bearing components read |
| `apps/web/src/hooks/*`, `stores/*`, `lib/*` | Data layer | AUD-STATE/DASH-SYNC | Findings |
| `packages/ui/src/components/*` | Shared primitives (Toolbar deep-read; rest exercised via pages) | AUD-UI-LAYOUT | Findings |
| `apps/web/src/__tests__/**`, `apps/api/tests/**`, `.github/workflows/ci.yml` | Tests + CI | AUD-TESTS | Findings |
 
---
 
## Index
 
| ID | Category | Primary File(s) | Status |
|---|---|---|---|
| AUD-ARCH | Architecture & project map | — | OK (documented) |
| AUD-DOC | Spec/reality mismatch (`attendance.md`) | `attendance.md` | Findings |
| AUD-AUTH | Authentication & sessions | `AuthController.php` | Findings |
| AUD-AUTH-GUARD | Frontend auth guards / login-stuck | `dashboard/layout.tsx` | Findings |
| AUD-DASH | Dashboard page & widget engine | `widget-engine.tsx` | Findings |
| AUD-DASH-SYNC | Dashboard synchronisation & caching (systemic) | `DashboardController.php` | Findings |
| AUD-DASH-METRICS | Widget & report data accuracy | `DashboardController.php`, widgets | Findings |
| AUD-DASH-PENDING | Pending Approvals widget | `DashboardController.php:42-183` | Findings |
| AUD-DASH-ACTIVITY | Recent Activity widget | `DashboardController.php:259-282` | Findings |
| AUD-QUICKTASK | Quick Task widget | `quick-task-widget.tsx` | Findings |
| AUD-SCRATCH | Quick Scratchpad widget | `quick-notes.tsx` | OK after code audit |
| AUD-ATT-BE | Attendance backend | `AttendanceService.php` | Findings |
| AUD-ATT-FE | Attendance frontend | `components/attendance/*` | Findings |
| AUD-ATT-GRAPH | Attendance graph/calendar/analytics | `AttendanceController::graph` | Findings |
| AUD-LEAVE | Leave module | `LeaveRequestController.php` | Findings |
| AUD-PROJ | Projects (backend + frontend) | `ProjectController.php` | Findings |
| AUD-TASK | Tasks backend | `TaskController.php` | Findings |
| AUD-TASK-FE | Tasks frontend (kanban/tab/detail) | `tasks-tab.tsx` | Findings |
| AUD-CHAT | Chat | `ChatController.php` | Findings (minor) |
| AUD-NOTIFY | Notifications | `NotificationController/Service` | OK after code audit |
| AUD-REALTIME | Realtime/broadcast contracts | `app/Events/*` | Findings |
| AUD-USERS | User management | `UserController.php` | Findings (minor) |
| AUD-DIR | Directory / Departments / Designations | `DirectoryController.php` | OK after code audit |
| AUD-PICKERS | Entity pickers truncated by pagination | `departments-tab.tsx:132-136` | Findings |
| AUD-REPORTS | Reports & exports | `GenerateReportJob.php` | Findings |
| AUD-AUDIT | Audit logs | `AuditLogController.php` | OK after code audit |
| AUD-SETTINGS | Settings | `SettingsController.php` | OK after code audit |
| AUD-QA | QA forms | `QaController.php` | OK after code audit |
| AUD-TIMER | Task/project timer & time logs | `timer-store.ts` | Findings (minor) |
| AUD-ANNOUNCE | Announcements | `AnnouncementController.php` | Findings |
| AUD-PHASES | Project phases | `PhaseController.php` | OK after code audit |
| AUD-UI-LAYOUT | Toolbar nesting / layout | `packages/ui/.../toolbar.tsx:237-247` | Findings |
| AUD-NAV | Navigation & routing | `command-palette.tsx`, redirect shims | Findings |
| AUD-STATE | State management / offline engine | `query-keys.ts` | Findings (minor) |
| AUD-SEC | Security | `routes/api.php:52-114` | Findings |
| AUD-TESTS | Tests & CI | `ci.yml` | Findings |
| AUD-DEPLOY | Deploy/env parity | working-tree diff | Findings |
 
---
 
## Client Requirement vs Implementation Matrix
 
Explicit client requirements (the 20 reported areas) versus verified implementation. Statuses: Implemented Correctly / Partially Implemented / Incorrectly Implemented / Broken / Missing / Duplicated-Conflicting / Unknown.
 
| Requirement | Expected Behaviour | Current Implementation | Status | Evidence | Category |
|---|---|---|---|---|---|
| 1. Widget synchronisation (Admin/HR/Employee) | Mutations reflect in widgets immediately/consistently | Layered 120 s init + 300 s metrics server caches per viewer; observer never clears init; ad-hoc writer clears; frontend 5-min staleTime, no refetch on mount/focus, no polling; one realtime event | **Broken** | `DashboardController.php:36-38,210-212`; `CacheInvalidationObserver.php:15-37`; `use-dashboard-init.ts:23-25` | AUD-DASH-SYNC |
| 2a. Total Employees widget | Count from employee source; present/absent from attendance; updates on change | Total from `dashboard_global` (cleared on user writes ✓) but viewer metrics cache not → ≤5 min lag; present = present+late (cached); "absent" = remainder incl. on-leave | **Partially Implemented** | `DashboardController.php:226-252`; `metric-widget.tsx:141-147` | AUD-DASH-METRICS |
| 2b. Active Projects widget | Active count from Project area; completions move immediately | Correct source (`projects.status='active'` via `dashboard_global`); viewer caches not invalidated on transitions → lag ≤120/300 s | **Partially Implemented** | `DashboardController.php:353-360` | AUD-DASH-METRICS/SYNC |
| 2c. Today's Employee widget | Clocked-in/on-time/late/absent/on-leave/unannounced-leave | Both widgets aggregate a **paginated(20)** overview client-side → wrong above 20 staff; leave shown via team-today only elsewhere; absent definition diverges from attendance page | **Incorrectly Implemented** | `admin-today-attendance-widget.tsx:18-28`; `AttendanceController.php:427-428,489-506` | AUD-DASH-METRICS |
| 3. Pending Approval widget | Tasks + leaves pending, synced with workflows | List correct in scope but task/project submissions invalidate no admin cache & no broadcast → ≤120 s lag; kanban path to review is 422; leave inline decisions work | **Partially Implemented / Broken (task path)** | `TaskController.php` (no clears in submitForReview); `tasks-tab.tsx:225-231` + `TaskController.php:442-444` | AUD-DASH-PENDING, AUD-TASK-FE |
| 4. Recent Activity widget | Clock-in/break/task submits/completions/profile updates in feed | Backend **excludes** attendance events; task mutations un-audited; frontend maps attendance events that can never arrive | **Incorrectly Implemented** | `DashboardController.php:265`; `recent-activity-widget.tsx:79-82` | AUD-DASH-ACTIVITY |
| 5. Quick Task widget | Standalone task + employee + priority + end date + deadline | Standalone/assignee/notification/chat work; **priority/date/deadline UI missing** (backend accepts them) | **Partially Implemented** | `quick-task-widget.tsx:78-117` vs `TaskController.php:259-265` | AUD-QUICKTASK |
| 6. Quick Scratchpad | Notes with persistence + resizing | CRUD + cache-clears on write; resize via grid handles | **Implemented Correctly** | `QuickNoteController.php:50-86` | AUD-SCRATCH |
| 7. Project area (tabs/cards/active-completed) | Accurate counts, avatars, realtime progress, correct status views | Status filter + progress (TaskObserver) correct; priority sort **500s on pgsql**; tab count badge key not invalidated; member avatars are initials-only | **Partially Implemented** | `ProjectController.php:87`; `projects/page.tsx:14-20` | AUD-PROJ |
| 8. Toolbar / Kanban header | Single clean container, horizontal, responsive, connected | Shared Toolbar renders its own card inside each page's second card; nowrap + fixed search width in overflow-x parents; stacked boxed rows + kanban bleed container | **Incorrectly Implemented** | `toolbar.tsx:237-247`; `projects-tab.tsx:100-101`; `tasks-tab.tsx:902-911` | AUD-UI-LAYOUT |
| 9. App-wide stability | No refresh-dependent/stale/inconsistent behaviour | Systemic cache architecture (row 1) + dead realtime listeners + query-key families outside invalidation prefixes | **Broken (systemic)** | AUD-DASH-SYNC, AUD-ATT-FE, AUD-STATE | multiple |
| 10. Login stuck | Login proceeds without manual refresh | `isErrorCapabilities` early-return blocks AuthGuard redirect → "Session could not load" dead-end on 403 flows | **Incorrectly Implemented** | `dashboard/layout.tsx:184-213` | AUD-AUTH-GUARD |
| 11. Project detail intermittent loading | Detail loads reliably | Detail fetch + scoping sound (findOrFail + 403); no divergent code path found — intermittent failures best explained by systemic 500s (priority sort) + stale caches; residual cause **Unknown** (needs prod logs) | **Unknown / partially attributed** | `projects/[id]/page.tsx:41-43`; `ProjectController.php:87` | AUD-PROJ |
| 12. UI / responsiveness | No overflow/clipping/misalignment at breakpoints | Toolbar pattern + fixed-height calcs (`100dvh-140px/180px`) + `100vh` in auth shell; mobile nav/sheets/dialogs/touch-drag implemented | **Partially Implemented** | AUD-UI-LAYOUT + Responsive Audit below | AUD-UI-LAYOUT |
| 13. Functionality completeness | Every control works | Dead/incorrect controls: kanban drag-to-review/done, "Overdue" preset, "Redo" filter, "By Department" graph grouping, dept pickers >20 | **Partially Implemented** | AUD-TASK-FE, AUD-ATT-GRAPH, AUD-PICKERS | multiple |
| 14. Data synchronisation / source of truth | One definition per business fact | Duplicate/conflicting: absent (2 definitions), pending_approvals (2 formulas), leave status (leave vs approval), working-days (3 calculators), attendance state (4 frontend derivations) | **Duplicated/Conflicting** | Duplicate Implementations section | multiple |
| 15. DB/backend/API | Schema/queries/permissions correct | pgsql-incompatible SQL ×2 (FIELD, double-quoted literals); HR scope leak in summary exports; `approver_id` referenced but never exists; `unapproved_break_seconds` never persisted | **Partially Implemented** | AUD-ATT-GRAPH, AUD-REPORTS, AUD-LEAVE, AUD-ATT-BE | multiple |
| 16. Role behaviour (Admin/HR/Employee) | Consistent role boundaries | Capability + HrScope enforcement solid everywhere live; leaks: leave `show()` unscoped for HR, export summaries, stale capability cookie on account switch | **Partially Implemented** | AUD-LEAVE, AUD-REPORTS, AUD-AUTH | multiple |
| 17. Notifications / chat events | Complete, timely, correct-recipient delivery | Notification pipeline solid (incl. realtime toast); DMs create no notification (30 s badge poll); task/project submission notifications fire but dashboard lag remains | **Partially Implemented** | `ChatController.php:168-184` | AUD-CHAT, AUD-NOTIFY |
| 18. Loading/error/empty/refresh states | Coherent async states | Generally good (skeletons, retries, empties); gaps: capabilities dead-end, frozen break ticker, blank-tab nav target, metrics "absent ~0" wrong-data state | **Partially Implemented** | AUD-AUTH-GUARD, AUD-ATT-FE, AUD-NAV | multiple |
| 19. Performance | No duplicate/storm requests | Punch refetch storm (all clients × every punch), Echo rebuild per token refresh, duplicate task fetch on detail open, 4-offline-registry query keys | **Partially Implemented** | `use-dashboard-init.ts:15-17`; `use-reverb.ts:120` | AUD-DASH-SYNC/REALTIME |
| 20. Testing | Automated coverage of critical workflows | 37 FE tests; **6 red (written for a never-merged redesign)**; CI runs them; no coverage for dashboards/sync/leave/kanban approvals/chat | **Broken (red) / Minimal** | AUD-TESTS, AUD-DOC | AUD-TESTS |
 
---
 
## Workflow Coverage
 
Status per major workflow (entry → … → final UI state):
 
| Workflow | Chain | Status | Break point(s) |
|---|---|---|---|
| Login → role-select → dashboard | login → setAuth → guards → init | Partially | 403 dead-end branch (AUD-AUTH-GUARD) |
| Clock in/out/breaks | TimeClock → offlineEngine → punch API → reconcile → caches → broadcast → widgets | Partially | viewer caches + dead table listeners (AUD-DASH-SYNC/ATT-FE) |
| Continue shift | clock_out → clock_in again | Partially | visible total resets to 0 (`time-clock-widget.tsx:115`) |
| Attendance correction | org table → member sheet → correct API → reconcile → notify | Mostly OK | admin-table invalidation key miss |
| Leave request → approve | form → approval chain → balance → on_leave rows → widgets | Partially | service-bypassing listener (schedule/manual-source/caches), cancel-notify dead, cancelled shows "pending" |
| Task create (quick + full) → assign | widgets/dialogs → store → notifications + chat | Mostly OK | priority/date UI missing in Quick Task; pickers truncated |
| Task start → submit for review | detail sheet → submitForReview → approval + notifications | Mostly OK | no dashboard invalidation/broadcast → admin lag |
| Kanban move | drag → PUT status | **Broken** | 422 without submission note (AUD-TASK-FE) |
| Task approve/redo | detail sheet → approve/redo → done/in_progress + chat + activity | Partially | narrow client invalidations; reorder/bulk bypass pipeline |
| Project create → members → tasks → submit → review → completed | full chain | Partially | FIELD() 500 on sort; submit/review cache gaps; count-badge key |
| Announcements | composer → broadcast → widget | Partially | per-viewer init cache ≤120 s |
| Chat DM / group / project chat | full chain incl. realtime | OK (minor) | no DM notification |
| Exports | trigger → job → S3 → realtime + download | OK (one leak) | HR summary-export scope leak |
| Demo data seed/purge | settings → queued jobs | OK | purge no longer touches audit_logs |
 
---
 
## [AUD-ARCH] Architecture & Project Map
 
* Purpose: canonical structure/truth-flow reference (content above in *Project Architecture Map*).
* Summary: Laravel 12 API + Next.js 16 App Router + shared UI package; DB is single source of truth with per-viewer derived caches; hosted Pusher; S3 storage.
* Findings: none specific to structure.
* Dependencies: everything below.
 
## [AUD-DOC] Spec/Reality Mismatch — `attendance.md` claims fixes absent from the code
 
* Files: `attendance.md` (§3–6) vs `AttendanceService.php`, `Listeners/LeaveAttendanceIntegration.php`, `Models/AttendanceDay.php:6-19`, `AttendanceController.php:87-94,269-273`, `time-clock-widget.tsx:115`, `timer-store.ts:61-67`, `use-dashboard-init.ts:15-17`, `admin/hr-attendance-table.tsx`, today widgets, `today-summary-card.tsx`, `attendance/page.tsx:168`
* Purpose: attendance product spec + remediation record.
* Current behaviour: §4 lists 12 applied fixes; item-by-item verification shows **10–11 absent** (only holiday-vs-worked precedence, `AttendanceService.php:252-258`, is in the tree). No `markLeaveDays` (grep-verified), no `src/lib/attendance.ts`, `unapproved_break_seconds` not fillable, dead listeners still present, widgets still paginated-capped, `startTimer(timestamp, 0)` still zeroes Continue-Shift, blanket init invalidation remains, `stopTimer` leaves stale fields, dead `team_today_*` half-code.
* Findings:
 
  * [Critical] A planner reading `attendance.md` §4/§6 would treat the attendance fan-out defects as fixed; they are not — changes never merged or reverted — `attendance.md:129-178`
  * [High] The red vitest suite is this phantom implementation's residue (tests expect "Pause for Break" copy, rollback semantics, and table placeholders/analytics header of the never-merged redesign) — `time-clock-widget.test.tsx:126` vs `time-clock-widget.tsx:264`; `admin-attendance.test.tsx:46-63`
  * Positive: §3's solution design is sound and matches this audit's independent conclusions — recommended blueprint for re-implementation.
* Dependencies: `AUD-ATT-BE`, `AUD-ATT-FE`, `AUD-TESTS`, `AUD-DASH-SYNC`
* Open questions: do the attendance.md changes exist on another branch/commit? (Not found in this tree.)
 
## [AUD-AUTH] Authentication & Sessions
 
* Files: `AuthController.php`; `routes/api.php:119-140`; `ForcePasswordChange/ForceOnboarding/EnsureTokenIsNotRefresh`; `(auth)` pages
* Purpose: credential lifecycle, token rotation, forced flows.
* Current behaviour: login by email/username/employee_id with rate-limit + lockout + suspicious-IP alerts; refresh rotation + max-device; role-select re-issues `role:`-tagged tokens; change-password revokes all; sessions list/revoke broadcast.
* Findings:
 
  * [Medium] Stale `g4k_capabilities` cookie seeds `useCapabilities().initialData` → previous user's capability-gated UI for ≤5 min after account switch — `capabilities.ts:38-46`
  * [Medium] Onboarding password step discards the rotated token pair and recovers only via explicit refresh + silent-refresh path — `onboarding/page.tsx:87,116-118`
  * [Low] Token `role:` ability vs DB `active_role` can disagree mid-session after admin role edits — `AuthController.php:309-317` vs `UserController.php:250-252`
  * [Low] IP-based suspicious-login check under `trustProxies(at:'*')` — prod proxy chain unverified — `bootstrap/app.php:19`
* Related workflows: login, role-select, onboarding, password flows.
* Open questions: production proxy/IP correctness (needs live probe).
 
## [AUD-AUTH-GUARD] Frontend Auth Guards / Reported "Login stuck"
 
* Files: `login/page.tsx:66-108`; `auth-guard.tsx:30-118`; `dashboard/layout.tsx:180-213`
* Current behaviour: layout gates on capabilities query **before** mounting AuthGuard.
* Findings:
 
  * [High] `isErrorCapabilities` early-return renders instead of `<AuthGuard>` — any 403 from `/me/capabilities` (not exempted by either force-middleware) traps the user on "Verifying session…" → "Session could not load" with a Retry that 403s again; the guard's redirect never mounts — `dashboard/layout.tsx:184-213`
  * [Medium] First-login (no cookie) + one transient network error hits the same dead-end — `capabilities.ts:36-50`
  * [Low] Single failed silent refresh hard-redirects to login; two tabs racing refresh rotation can spuriously log out — `api-client.ts:150-153`
* Related workflows: login (requirement 10).
 
## [AUD-DASH] Dashboard Page & Widget Engine
 
* Files: `dashboard/page.tsx`; `widget-engine.tsx`; `reconcile-layout.ts`; `ui-store.ts`
* Current behaviour: role-gated widget catalogs on react-grid-layout with persisted per-user layout; all widgets share one `useDashboardInit` query.
* Findings:
 
  * [Medium] Only global refresh; server caches can still answer stale after it — `widget-engine.tsx:260-263`
  * [Low] Channel subscription never released (refcount leak) — `use-dashboard-init.ts:11-18`
  * [Low] Collapse→expand discards custom resized height — `widget-engine.tsx:60-78`
* Related workflows: all dashboard widgets (requirements 1–6).
 
## [AUD-DASH-SYNC] Dashboard Synchronisation & Caching (systemic root cause)
 
* Files: `DashboardController.php:15-195, 204-446`; `CacheInvalidationObserver.php:15-37`; `AttendanceController.php:87-94`; `TaskController.php:738-762`; `LeaveRequestController.php:248-259`; `use-dashboard-init.ts`; `providers.tsx:80-93`
* Purpose: the application's entire derived-data propagation layer.
* Current behaviour (Data Synchronisation Audit): `mutation → DB → ad-hoc partial cache forget → /dashboard/init (120 s per-viewer) → RQ (5-min staleTime, no mount/focus refetch, no polling) → widgets`; realtime = one event; observer clears metrics only for the affected user and never init.
* Findings:
 
  * [High] init outer cache 120 s defeats every client invalidation — `DashboardController.php:36-38`
  * [High] metrics 300 s per-viewer never cleared for viewers of other people's changes (Total Employees ≤5 min lag) — `:210-212` + `CacheInvalidationObserver.php:22-34`
  * [High] Observer never clears `dashboard_init_*`; writers enumerate users inconsistently; `submitForReview`/project `submit`/`review` clear nothing (tasks) or not init (projects) — `TaskController.php` (submit), `ProjectController.php:350-355,397-402`
  * [High] Frontend `staleTime 5 min` + `refetchOnMount:false` + `refetchOnWindowFocus:false` — navigation never refetches — `use-dashboard-init.ts:23-25`
  * [Medium] Dual today-sources on one dashboard (metrics vs overview) disagree for minutes
  * [Medium] Punch refetch storm + puncher metadata leak on `company.global` (any-auth channel) — `channels.php:26-28`, `use-dashboard-init.ts:15-17`
  * [Medium] Timer store seeded from 5-min-stale init slice while `/attendance/me/today` (30 s ETag) feeds only the badge — `dashboard/layout.tsx:130-139`
  * [Medium] `safeCall` controller-instantiation + defensive double-unwrap contract — `DashboardController.php:22-34`
* Related workflows: requirements 1, 2, 3, 9, 19.
 
## [AUD-DASH-METRICS] Widget & Report Data Accuracy
 
* Files: `DashboardController.php:224-404`; `AttendanceController.php:420-572`; both today widgets; `metric-widget.tsx`; `ReportController::attendanceSummary`
* Findings:
 
  * [High] Both today widgets aggregate a paginated(20) endpoint client-side → wrong counts above 20 staff; unpaginated `/attendance/team-today` unused by them — `admin-today-attendance-widget.tsx:18-19`, `hr-team-attendance-widget.tsx:22`, `AttendanceController.php:362-364,427-428`
  * [High] `absent` counted from `status='absent'` rows **nothing ever writes** (metrics + attendance-summary report ~0 absent) vs attendance page's correct LEFT-JOIN/COALESCE definition — `DashboardController.php:239-252`, `AttendanceController.php:489-506`
  * [Medium] `pending_approvals` two formulas in one payload (list includes tasks-in-review; count doesn't) — `:42-183` vs `:254-256,310-331`
  * [Medium] Breakdown labels on-leave as "absent/unclocked"; tooltip "currently active" for today-total — `metric-widget.tsx:50,54,141-147`
* Related workflows: requirements 2a/2b/2c, reports.
 
## [AUD-DASH-PENDING] Pending Approvals Widget
 
* Files: `DashboardController.php:42-183`; `pending-approvals-widget.tsx:31-50`; `LeaveRequestController::decision:197-262`; `leave-approval-actions-cell.tsx:27-75`
* Findings:
 
  * [High] Task/project submissions: no admin cache invalidation, no broadcast → widget lags ≤120 s (chain: create → pending state → widget ✗ → approval → final state → widget update ✗ until TTL)
  * [Medium] `id = approval_id ?? leave_request_id` + unordered `id OR approvable_id` lookup — fragile with any second approval row — `DashboardController.php:75`, `LeaveRequestController.php:204-208`
  * [Low] Decisions invalidate dashboardInit only (widget) / orgLeaveRequests only (page cell); `admin_leave_history` untouched ≤60 s — `leave-approval-actions-cell.tsx:67-70`
* Related workflows: requirement 3.
 
## [AUD-DASH-ACTIVITY] Recent Activity Widget
 
* Files: `DashboardController.php:259-282`; `recent-activity-widget.tsx:20-112`; `hr-activity-feed-widget.tsx:37-39`
* Findings:
 
  * [High] Feed **excludes** `attendance.%` while frontend maps those events (dead code); task mutations un-audited → requirement 4 unmet at data layer — `DashboardController.php:265` + `recent-activity-widget.tsx:79-82`
  * [Medium] HR "activity" widget reads today's roster, not activity; 300 s cache bypassed by raw-DB leave updates
* Related workflows: requirement 4.
 
## [AUD-QUICKTASK] Quick Task Widget
 
* Files: `quick-task-widget.tsx`; `TaskController::store:252-364`
* Findings:
 
  * [Medium] Priority/end-date/deadline UI missing though backend accepts them — `quick-task-widget.tsx:78-117` vs `TaskController.php:259,264-265`
  * [Medium] Assignee list `/directory?per_page=100` truncated above 100 — `:26-29`
  * [Low] Doesn't invalidate the projects count badge
* Related workflows: requirement 5 (persistence/assignment/notifications/chat verified working).
 
## [AUD-SCRATCH] Quick Scratchpad Widget
 
* Files: `quick-notes.tsx`; `QuickNoteController.php`
* Status: **OK after code audit** — writes clear `dashboard_init_*` + `quick_notes_*` (`:50-52,69-71,84-86`); resize implemented via grid handles. [Low] height bound only by grid.
* Related workflows: requirement 6.
 
## [AUD-ATT-BE] Attendance Backend
 
* Files: `AttendanceService.php`; `AttendanceController.php`; `LeaveAttendanceIntegration.php`; `FlagOpenShifts.php`; `AlertMissedClockIn.php`; `Models/AttendanceDay.php:6-19`
* Purpose: immutable punch log + day reconciliation (the system's strongest subsystem).
* Current behaviour: transaction + row-lock state machine, client-id idempotency, overnight anchoring, corrections with force-recompute, 5-min scheduler jobs.
* Findings:
 
  * [High] `unapproved_break_seconds` computed but never persisted (fillable omission) — `AttendanceService.php:273` vs `Models/AttendanceDay.php:6-19`
  * [High] Punch cache-clears cover only the puncher — `AttendanceController.php:87-94`
  * [High] Leave integration bypasses the service (raw DB writes): default schedule vs user schedule (marked ≠ deducted possible), `source:'server'` clobbers `manual`, no Feb-29 fallback, no cache invalidation — `LeaveAttendanceIntegration.php`
  * [Medium] Recurring holidays deducted-but-not-marked (exact-date calculators vs recurring-excluding listener)
  * [Medium] Holiday cache v2/v1 key mismatch → 24 h stale day statuses — `AttendanceService.php:239` vs `HolidayController::clearHolidayCache`
  * [Medium] Manual-source branch skips totals/status recompute — `AttendanceService.php:213-222`
  * [Low] Dead `team_today_*` half-code — `AttendanceController.php:272-273,93-94`
  * [Low] Raw-date vs company-tz event filtering straddle at midnight edges
  * [Low] `notifyOpenShifts` positional-by-luck array call — `:880-890`
  * [Low] `'pending'` status never written; `'overtime'` not a status
* Related workflows: clock in/out, breaks, corrections, leave marking.
 
## [AUD-ATT-FE] Attendance Frontend
 
* Files: attendance pages + 18 components (all read)
* Findings:
 
  * [High] Dead realtime listeners (`presence-org` / `.attendance.updated`) on both main consoles and HR analytics → no live refresh — `admin-attendance-table.tsx:91`, `hr-attendance-table.tsx:94`, `hr-attendance-analytics.tsx:41` (correct: `admin-attendance-analytics.tsx:22`, `admin-open-shifts-table.tsx:75-83`)
  * [Medium] Continue Shift zeroes visible total — `time-clock-widget.tsx:115`
  * [Medium] Frozen ongoing-break ticker + second break derivation — `today-summary-card.tsx:86`
  * [Low] `'overtime'` dead status branch; 4 independent status derivations — `attendance/page.tsx:168`
  * [Low] Correction invalidation misses admin-table key prefix — `hr-correction-dialog.tsx:132-135`
* Related workflows: requirement 1/9/18.
 
## [AUD-ATT-GRAPH] Attendance Graph / Calendar / Analytics
 
* Files: `AttendanceController::graph:909-968` (uncommitted fix in working tree); `attendance-graph.tsx:61-69`; `admin-attendance-calendar.tsx:23-28`; `admin-attendance-view.tsx:50-62`
* Findings:
 
  * [Critical] HEAD returns bare array + double-quoted SQL (invalid on pgsql → 500) while frontend reads `data.stats` → graphs/calendars/analytics broken in prod until the uncommitted diff ships
  * [Medium] Hours/overtime series always 0 (columns not selected) — `attendance-graph.tsx:68-69` vs `:955-963`
  * [Medium] "By Department" grouping unsupported → mislabeled date data — `admin-attendance-view.tsx:57-61`
* Related workflows: org attendance analytics/calendar.
 
## [AUD-LEAVE] Leave Module
 
* Files: `LeaveRequestController.php`; `ApprovalService.php`; `LeaveAttendanceIntegration.php`; leave components
* Findings:
 
  * [High] Cancel notification dead (`approver_id` never exists as column) — `LeaveRequestController.php:460-470`
  * [High] Employee history filters `approval.status` → cancelled leaves under "pending" filter; exports same duality — `:298-303`, `:441-443`, `GenerateReportJob.php:343`
  * [Medium] `show()` unscoped for any HR — `:264-277`
  * [Medium] Duplicate `calculateWorkingDays` (controller + model) — drift risk
  * [Low] Escalation/self-approval guards/balance clamps/decision cache-clears verified correct
* Related workflows: requirement 3 (leave leg), attendance integration.
 
## [AUD-PROJ] Projects (Backend + Frontend)
 
* Files: `ProjectController.php`; projects pages/tabs/dialogs/cards
* Findings:
 
  * [Critical] `FIELD(priority,…)` sort = 500 on pgsql — `ProjectController.php:87` + `projects-tab.tsx:113-115`
  * [Medium] `submit`/`review` don't clear init/metrics → widget lag — `:350-355,397-402`
  * [Medium] Tab count badge key not prefix-matched by mutations — `projects/page.tsx:14-20`
  * [Medium] HR project without department loses manage rights — `:106-111` vs `:18-25`
  * [Low] `destroy` orphans phases/qa-submissions; update doesn't notify new members
* Related workflows: requirements 7, 11.
 
## [AUD-TASK] Tasks Backend
 
* Files: `TaskController.php`; `TaskService.php`; `RecurrenceService.php`; listeners
* Findings:
 
  * [High] `reorder()` path bypasses submission-note/QA/self-approval checks and completion side effects — `:502-534` vs `:430-450`
  * [Medium] `bulk` complete same bypass — `:131-137`
  * [Medium] `submitForReview`: no dashboard invalidation/broadcast
  * [Low] Redundant leave-status re-update in `ProcessApprovalDecision`
* Related workflows: task lifecycle (create→assign→start→submit→approve→activity).
 
## [AUD-TASK-FE] Tasks Frontend (Kanban / Tasks tab / Detail)
 
* Files: `tasks-tab.tsx`; `task-kanban-board.tsx:295-357`; detail sheet/overview; `tasks/[id]`; create dialog
* Findings:
 
  * [Critical] Kanban drag / context "Move to" Review|Done → PUT without note → 422 for all roles; only the detail-sheet submit path works — `tasks-tab.tsx:225-231` + `TaskController.php:442-444`
  * [Medium] "Overdue" preset silently unfiltered — `tasks-tab.tsx:187`
  * [Medium] "Redo" filter always empty — `tasks-tab.tsx:958`
  * [Medium] Approve/redo invalidate only `["task-detail",id]`; submit misses `dashboardInit` — `task-overview-tab.tsx:87-132`
  * [Low] `["tasks-submitted"]` outside prefix family; `tasks/[id]` duplicate fetch key
* Related workflows: requirements 3, 13.
 
## [AUD-CHAT] Chat
 
* Files: `ChatController.php`; `chat-tab.tsx`; message list/composer; chat page tabs
* Findings:
 
  * [Medium] Plain DMs create no recipient notification (mentions only) → ≤30 s badge lag — `ChatController.php:168-184`
  * [Low] Client-side pinned/unread ordering over 50-per-page cursors
* Status: otherwise OK (pagination, receipts, pins, attachments, access checks verified).
 
## [AUD-NOTIFY] Notifications
 
* Files: `NotificationController/Service/Observer`; `NotificationCreated.php`; `notifications-bell.tsx`
* Status: **OK after code audit** — realtime toast + counts + fallback polling verified; `approval-status-change` contract matches; per-type channels busted on settings save.
 
## [AUD-REALTIME] Realtime / Broadcast Contracts
 
* Files: `app/Events/*`; `routes/channels.php`; `use-reverb.ts`; all 20 `.listen()` sites
* Findings:
 
  * [High] Dead attendance-table listeners (wrong channel + name) — see AUD-ATT-FE
  * [Medium] `TaskCompleted`/`ApprovalSubmitted` broadcast to channels nobody listens to (overhead only)
  * [Medium] Echo instance rebuilt on every 15-min token refresh → full reconnect/resubscribe — `use-reverb.ts:120`
  * [Low] Missing `NEXT_PUBLIC_PUSHER_*` env silently disables all realtime — `use-reverb.ts:36-39`
* Related workflows: requirement 1/17.
 
## [AUD-USERS] User Management
 
* Files: `UserController.php`; user form/actions
* Findings:
 
  * [Medium] `assignments()` misses `task_assignees` pivot — `:672-675`
* Status: otherwise OK (role gating, last-admin guards, scoping, PII hiding, audit logging).
 
## [AUD-DIR] Directory / Departments / Designations
 
* Files: 3 controllers + 3 tabs + directory page
* Status: **OK after code audit** — visibility rules, CRUD, sync, archive/restore, invalidations verified.
 
## [AUD-PICKERS] Entity Pickers Truncated by Pagination
 
* Files: `departments-tab.tsx:132-136,608,665`; `tasks-tab.tsx:120-123`; `create-task-dialog.tsx:63`; `projects/[id]/page.tsx:61-63`
* Findings:
 
  * [Critical] Dept member/HR pickers `/users` default 20 → only 20 newest users assignable
  * [Medium] Task project pickers `/projects` default 15
  * [Medium] Project member pickers `/directory` default 24
* Related workflows: requirement 13.
 
## [AUD-REPORTS] Reports & Exports
 
* Files: `ReportController.php`; `GenerateReportJob.php`; `use-export.ts`; reports views
* Findings:
 
  * [High] Summary **export** branches missing HR scope (live endpoints scoped) → company-wide leak — `GenerateReportJob.php:362-366,394-398`
  * [Medium] Tasks export misses assignees pivot — `:137-140`
  * [Medium] Attendance-summary absent_days ~0 (never-written rows) — same root cause as AUD-DASH-METRICS
  * [Low] Whole-file streaming on download
* Status: chunking, CSV-injection sanitization, ownership, realtime completion verified OK.
 
## [AUD-AUDIT] Audit Logs
 
* Status: **OK after code audit** — filtered index, queued export, demo purge untouched.
 
## [AUD-SETTINGS] Settings
 
* Files: `SettingsController.php` + 11 components + work-schedules/holidays/password-reset controllers
* Findings:
 
  * [Medium] Holiday CRUD doesn't clear `all_holidays_array_v2` (cross-listed AUD-ATT-BE)
* Status: otherwise OK (masked mail password, category busts, capability clear, SMTP test, queue monitor, schedule cache clears).
 
## [AUD-QA] QA Forms
 
* Status: **OK after code audit** — builder/viewer/preview wired; server-side QA validation on submissions.
 
## [AUD-TIMER] Task/Project Timer & Time Logs
 
* Findings:
 
  * [Low] `_broadcastState` channel leak — `timer-store.ts:243-248`
  * [Low] `logTime` clears active-task cache side effect — `TimerController.php:76-79`
  * [Low] `stopTimer` leaves stale timestamps — `timer-store.ts:61-67`
* Status: gating, active-task broadcast (consumed), offline engine, cross-tab sync all OK.
 
## [AUD-ANNOUNCE] Announcements
 
* Findings:
 
  * [Medium] Writes clear only the actor's `announcements_*` cache → other viewers ≤120 s stale despite correct realtime event — `AnnouncementController.php:147,199,216,302`
  * [Low] Dead `'admin'` role check (`:34`); no "view dismissed" path (design choice)
* Status: scoping/urgency/dismissals/attachments otherwise OK.
 
## [AUD-PHASES] Project Phases
 
* Status: **OK after code audit.**
 
## [AUD-UI-LAYOUT] Toolbar Nesting / Layout (reported issue #8)
 
* Files: `packages/ui/src/components/toolbar.tsx:237-247`; `projects-tab.tsx:99-140`; `tasks-tab.tsx:598-619,900-1012,1066`
* Findings:
 
  * [High] Toolbar's own bordered card nested inside each page's second bordered card; nowrap + fixed search width inside overflow-x parents → horizontal scroll instead of wrap
  * [Medium] Stacked boxed rows + kanban bleed container (negative margins) → excessive vertical space / disconnected columns; `h-[calc(100dvh-140px)]` brittle
  * [Low] Mobile nav/sheets/dialogs/sticky tables OK; no other clipping found
 
## [AUD-NAV] Navigation & Routing
 
* Files: `command-palette.tsx`; `nav-group.tsx`; `breadcrumb.tsx`; redirect shims (`admin/attendance`, `admin/reports`, `org/leave`, `leave`, `notifications`, `announcements` pages); `dashboard/layout.tsx` nav + mobile bottom bar; `use-url-state.ts`
* Purpose: route exposure, deep links, redirects.
* Current behaviour: nav filtered by capability + `hideForAdmin` (`nav-group.tsx:127-137`); legacy paths redirect to canonical ones (all 5 shims verified); breadcrumb label map + numeric-ID resolution (`breadcrumb.tsx:14-40`); palette targets all exist **except two query-param issues below**; mobile bottom nav capability-gated.
* Findings:
 
  * [Medium] Palette "View Company Attendance" pushes `/dashboard/org/attendance?tab=all` — `all` matches no TabsTrigger (`calendar|today|analytics|shifts|leave`, default `calendar`) → Radix renders **no tab content** (blank body under the tab bar) — `command-palette.tsx:187` vs `admin-attendance-view.tsx:16`
  * [Medium] Palette "Attendance Correction" pushes `?correction=true` — **no component reads the param** (grep across web src: zero consumers) → lands on the plain org page without opening any correction UI — `command-palette.tsx:100`
  * [Low] Breadcrumb fetches user/project labels via ad-hoc queries (N lookups per render on detail pages) — `breadcrumb.tsx:7-10`
* Verified-good: redirects, guard loops (none found), back/forward (URL-state tabs preserve state), deep links (`?tab=`, `?highlight=`, `?conversation=`), role-gated nav, mobile FAB visibility.
* Related workflows: all navigation (requirement 12/13 support surface).
 
## [AUD-STATE] State Management / Offline Engine
 
* Files: stores, `offline-engine.ts`, `providers.tsx`, `query-keys.ts`
* Findings (State Management Audit):
 
  * [Medium] Query-key families outside the registry and prefix-invalidation reach (`["tasks-submitted"]`, `["projects","count"]`, `["attendance","team-today"]`, `["task-detail"]`, `["project-tasks"]`, `admin_leave_history`, `["tasks",taskId]`) — the mechanical "updates don't propagate" cause
  * [Low] Offline punch dedupe UTC-vs-company-tz boundary
* Verified-good: hydration gates, tab sync, optimistic rollbacks (tasks/leave/notifications), version guard, offline queue conflict semantics.
 
## [AUD-SEC] Security
 
* Files: `routes/api.php:52-114`; `config/broadcasting.php:47-56`; `bootstrap/app.php`; `apps/api/test_*.php`
* Findings:
 
  * [Critical] **Unauthenticated `GET /api/auth/reset-demo-passwords`** resets 13 live demo accounts (admin incl.), unlocks, clears limiters, nulls expiry setting, **flushes entire cache** — `routes/api.php:52-93`
  * [High] Public `GET /api/auth/debug-token` leaks security settings/TTLs/DB time — `routes/api.php:95-114`
  * [Medium] Pusher client TLS verification disabled — `config/broadcasting.php:47-56`
  * [Low] Untracked `test_*.php` scratch files at API root
* Related: AUD-DEPLOY.
 
## [AUD-TESTS] Tests & CI
 
* Findings:
 
  * [High] 6 red tests across 3 files — authored for the never-merged `attendance.md` redesign (copy/semantics/placeholders) — CI runs the suite → pipeline red
  * [Medium] Minimal coverage of critical surfaces (no dashboards/sync/leave/kanban-approval/chat tests; sqlite-vs-pgsql divergence locally)
* Verified-good: lint/typecheck/bundle/OpenAPI in CI; `tsc` clean.
 
## [AUD-DEPLOY] Deploy / Env Parity
 
* Findings:
 
  * [Critical] Attendance-graph fix uncommitted → prod graphs broken until committed + deployed
  * [Medium] `NEXT_PUBLIC_PUSHER_*` unverifiable from repo; absence silently disables realtime
  * [Low] `FRONTEND_URL` default localhost for reset links; runtime env parity unauditable
 
---
 
## Cross-Module Findings
 
(unchanged, re-verified)
 
* **Attendance → Dashboard:** punch → reconcile → puncher clears + broadcast → all clients invalidate init → server serves admin's ≤120 s-cached payload → lag despite realtime.
* **Leave → Attendance → Widget:** approval → service-bypassing on_leave marking (default schedule, manual-clobber) → metrics after TTL; cancel re-reconciles ✓ but approver never notified; recurring holidays deducted-not-marked.
* **Task → Board → Approval → Activity:** sheet submit ✓; board move ✗ 422; reorder/bulk bypass pipeline; approve → progress+chat ✓, admin widgets only after TTL ✗; feed excludes the events it maps.
* **Project → Widget:** status/progress correct; `dashboard_global` cleared ✓; viewer init/metrics not ✗; count badge key mismatch.
* **HR scoping:** correct on all live endpoints; export summary branches are the one leak.
 
## Duplicate / Conflicting Implementations
 
| # | Duplications | Files | Which is used | Conflict impact |
|---|---|---|---|---|
| D1 | "Absent" defined twice (row-count vs LEFT-JOIN/COALESCE) | `DashboardController.php:239-252` + `ReportController` vs `AttendanceController.php:489-506` | page uses JOIN; metrics/reports use rows | metrics/reports show ~0 absent (High) |
| D2 | `pending_approvals` two formulas in one payload | `DashboardController.php` init vs metrics | both | badge vs count disagree (Medium) |
| D3 | Leave status dual source (`leave_requests.status` vs `approvals.status`) | `LeaveRequestController` index/admin vs history/destroy/export | mixed per endpoint | cancelled shows "pending" in history + exports (High) |
| D4 | Working-days calculators ×3 (controller, model, listener-embedded) | `LeaveRequestController.php:96-125`, `LeaveRequest::calculateWorkingDays`, `LeaveAttendanceIntegration.php` | first two per-user, listener default-schedule | marked ≠ deducted days (High) |
| D5 | Attendance state derived 4 ways on frontend | time-clock widget / summary badge / shift-log dot / calendar `getStatus` | all | color/label disagreements; dead `'overtime'` branch (Medium/Low) |
| D6 | Today-attendance widgets vs purpose-built `team-today` endpoint | widgets vs `AttendanceController::teamToday` | widgets use paginated overview | counts capped at 20 (High) |
| D7 | `hrToday` alias of `overview` + `teamToday` — three console endpoints, two shapes | `AttendanceController.php:362-364` | mixed consumers | drift risk (Low) |
| D8 | Duplicate avatar-upload implementations | `profile-header.tsx` + `profile-general.tsx` | both mount on profile page | redundant requests (Low) |
| D9 | Off-registry query keys vs `queryKeys` registry | various | mixed | invalidation misses (Medium) |
| D10 | Task "assignments" via `assignee_id` only vs pivot everywhere else | `UserController:672-675` | endpoint-only | incomplete assignment view (Medium) |
| D11 | Echo channel naming styles (`private-…` literal vs `private()`) | `use-reverb` consumers | both work under pusher-js | fragile convention (Low) |
 
## Navigation Audit
 
* **Verified-good:** 5 legacy/alias redirect shims all correct; capability-filtered sidebar + `hideForAdmin`; URL-state tabs (back/forward and deep links preserve state); guard chain has no redirect loops; mobile bottom nav gated; breadcrumb label map; `?highlight`/`?conversation`/`?task` deep links consumed.
* **Broken targets:** palette `?tab=all` → blank tab body (AUD-NAV, Medium); palette `?correction=true` consumed by nothing (AUD-NAV, Medium).
* **Unexposed backend surface (informational, not flagged as bug):** `/attendance/team-today` counts endpoint has no UI consumer (relevant to fix AUD-DASH-METRICS).
 
## UI/UX Audit (code-level)
 
* Toolbar double-container + nowrap-scroll + stacked boxed rows + kanban disconnect + fixed-height calcs — AUD-UI-LAYOUT (requirement 8 root causes).
* Dead-end error screens: capabilities dead-end (AUD-AUTH-GUARD); blank tab via palette (AUD-NAV).
* Misleading data displays: "absent/unclocked" incl. on-leave; "currently active" tooltip; ~0 absent reports (AUD-DASH-METRICS).
* Frozen live state: ongoing-break ticker (AUD-ATT-FE).
* Inconsistent affordances: list-view pin uses "more" icon vs grid star (`project-card.tsx:112-119`); duplicate toast on task approve (`task-overview-tab.tsx:107-108`).
* Feedback gaps: DM without notification (AUD-CHAT); correction completes without admin-table refresh (AUD-ATT-FE low).
* Generally-good patterns verified: skeletons/empties/retries across pages, confirm dialogs on destructive actions, optimistic rollbacks, sonner toasts, form drafts.
 
## Responsive Audit (code-level)
 
* Widget grid: 5 breakpoints (`GRID_COLS`, reconcile clamps x/w) — sound.
* Kanban: Pointer/Touch(200 ms delay)/Keyboard sensors all active (`task-kanban-board.tsx:257-261`) — mobile drag supported.
* Mobile: bottom nav + sheet menu; dialogs `max-h-[65dvh]`/`90dvh` scroll; tables sticky header/first col.
* Problem patterns: Toolbar `sm:flex-nowrap` + fixed `w-[260px]/[300px]` search inside `overflow-x-auto` wrappers → horizontal scroll not wrap (AUD-UI-LAYOUT); `h-[calc(100dvh-140px)]` (tasks) and `h-[calc(100vh-180px)]` (directory) fixed calcs brittle against variable header rows; `(auth)` layout uses `100vh` (mobile URL-bar jump risk — `min-h-screen` used on login page itself, mitigated).
* No desktop-only assumptions found in nav or core flows.
 
## Data Synchronisation Audit
 
See **[AUD-DASH-SYNC]** for the complete architecture analysis; **Cross-Module Findings** for per-entity chains; **Duplicate / Conflicting Implementations** for competing definitions. Net assessment: no central invalidation bus; per-viewer caches + ad-hoc forgets + one realtime event + a no-refetch client ⇒ the reported stale/inconsistent/refresh-dependent symptoms are structural, not incidental.
 
## State Management Audit
 
See **[AUD-STATE]** and the sync architecture above. Client state itself (zustand + RQ) is coherent; the failure modes are cache/invalidation-layer and key-registry issues, plus the timer-store dual-freshness seeding (AUD-DASH-SYNC Medium).
 
## Production Readiness Findings
 
Grounded verdict per dimension (from the findings above — no generic opinion):
 
* **Functionality:** NOT READY — 3 workflows broken for normal use on production data (kanban review moves, attendance analytics/graphs on pgsql, priority sort 500); pickers truncate above small org sizes.
* **Security:** NOT READY — unauthenticated admin-password-reset endpoint is an active takeover vector on the live demo dataset; public debug endpoint.
* **Reliability / consistency:** NOT READY — systemic per-viewer cache staleness makes dashboards diverge from source modules for minutes; dead realtime listeners on main consoles.
* **Data integrity:** CONDITIONAL — leave marking/deduction divergence, un-persisted unapproved breaks, cancelled-as-pending history/exports, absent-rows definition gap.
* **Auth/navigation/UI shell:** MOSTLY READY — solid token/guard/nav machinery with one dead-end branch and two palette targets to fix.
* **Deploy pipeline:** BLOCKED — red CI (tests for a phantom design) and an uncommitted production-breaking fix that must ship.
* **Minimum production gate (order):** (1) commit+deploy graph fix; (2) remove/gate reset-demo + debug-token routes; (3) resolve red tests; (4) pgsql-safe SQL for priority sort; (5) kanban move contract; (6) dashboard cache/realtime redesign per `attendance.md` §3 blueprint; then per-module mediums.
 
## Not Covered / Needs Follow-up
 
* **Vercel/API runtime env** (`NEXT_PUBLIC_PUSHER_*`, `NEXT_PUBLIC_S3_PUBLIC_URL`, `FRONTEND_URL`, MAIL/S3) — not in repo; needs dashboard/live verification (realtime on/off, avatar + reset-link URLs).
* **Live runtime behaviour** — queue worker/scheduler liveness, Pusher auth in prod, Supabase RLS enforcement, proxy/IP chain; needs live probing.
* **Backend test suite execution** — pgsql service required locally; CI result for the API job at audit time unknown.
* **`packages/ui` primitives** beyond Toolbar/badge/state-helpers/DataTable — exercised indirectly only.
 
## Summary Stats
 
- Total categories: 36
- Critical findings: 6 (public reset-demo endpoint; attendance.md phantom implementation; uncommitted pgsql graph break; kanban drag-to-review/done 422; MySQL FIELD() 500 on pgsql; dept pickers capped at 20)
- High findings: 19
- Medium findings: 33 (incl. 2 new navigation findings: blank `?tab=all` palette target; dead `?correction=true` param)
- Low findings: 30
- Total findings: 88
- Approximate files inspected: ~155 · lines: ~40,000
- Requirement matrix rows: 20 explicit client requirements assessed; statuses: 1 Implemented Correctly, 8 Partially Implemented, 6 Incorrectly/Broken, 2 Duplicated-Conflicting, 1 Broken-red-tests, 2 Unknown/partially-attributed
- Categories requiring implementation planning: 25
- Areas requiring additional verification: 4 (listed above)

# Audit Report — Games4Kings Workplace OS
 
**Audit date:** 2026-08-26 · **Read-only audit** — no source code, schema, data, or configuration was modified at any point; `Audit-Report.md` is the only file written.
 
## Audit Scope & Method
 
* **Method:** three-stage code-first audit of `apps/api` (Laravel 12), `apps/web` (Next.js 16), `packages/ui`, configs, CI, tests: (1) full-project mapping (routes/pages/controllers/models/events/stores/hooks), (2) file-by-file deep pass over every remaining surface following `UI → component → state → handler → API → DB → response → state → UI → related modules` and the reverse direction for realtime, (3) zero-trust re-verification of every load-bearing finding anchor plus a production-readiness/navigation/duplication pass.
* **Repo state:** HEAD `b614c0a`; one uncommitted source diff (`apps/api/app/Http/Controllers/AttendanceController.php` — attendance-graph contract fix, see AUD-ATT-GRAPH/AUD-DEPLOY).
* **Toolchain during audit:** `tsc --noEmit` = clean · `vitest run` = **6 failures / 3 files** (CI runs this — AUD-TESTS) · CI also runs web lint + bundle-size + OpenAPI lint and a pgsql `php artisan test` job.
* **Requirement reconstruction:** explicit client requirements = the 20 reported problem areas (dashboard widget sync; widget data accuracy; pending approvals; recent activity; quick task; scratchpad; project area; toolbar/kanban layout; app-wide stability; login stuck; project detail loading; UI/responsiveness; functionality completeness; data synchronisation; DB/backend/API; role behaviour; notifications/chat; loading/error states; performance; testing) plus `attendance.md` (attendance product spec). Everything else is implementation-derived and labelled as such.
* **Scale:** ~155 files / ~40,000 lines inspected; every page, route, controller, model observer/listener/event/job, widget, and store accounted for (File/Module Coverage below).
 
## Project Architecture Map
 
* **Backend:** Laravel 12 API — Sanctum tokens (access 15 min + refresh 7 d HttpOnly cookie), capability middleware (`RequireCapability` → `CapabilityMatrix` over `role_capabilities`; roles: super_admin/hr/employee), HR scoping via `HrScope` (managed departments from `department_hr`), model observers (Project/Task/AttendanceDay/LeaveRequest/User → cache invalidation; Notification → broadcast), ~200 endpoints in `routes/api.php`, queued jobs + 5-min scheduler loop, hosted Pusher broadcasting, S3-style default storage disk.
* **Frontend:** Next.js 16 App Router — 29 routes (6 auth pages + dashboard root and 13 area pages + 5 redirect shims), one TanStack Query client (`staleTime 60s`, `refetchOnWindowFocus:false`), Zustand stores (auth/ui/timer/recent), IndexedDB offline engine (punches + mutation queue), laravel-echo/pusher-js realtime.
* **Truth flow:** DB is the single source of truth; derived state fans out through per-viewer server caches (`dashboard_init_*` 120 s, `dashboard_metrics_*` 300 s, `dashboard_global` 300 s) into one client query per dashboard plus per-module queries; realtime invalidation exists for exactly one event (`attendance-updated`).
 
## File / Module Coverage
 
| File/Group | Purpose | Category | Status |
|---|---|---|---|
| `apps/api/routes/*` (api/channels/console/web) | Route map, broadcast authz, schedule | AUD-ARCH/REALTIME | Findings (SEC, scheduler OK) |
| `apps/api/app/Http/Controllers/*` (30) | All module endpoints | per-category | All read; findings per category |
| `apps/api/app/Services/*` (Attendance/Approval/Task/CapabilityMatrix/Recurrence/AutoNumbering/Notification/AuditLogger) | Domain logic | AUD-ATT-BE etc. | Findings |
| `apps/api/app/Observers/*`, `Listeners/*`, `Events/*`, `Jobs/*` | Cache invalidation, approval/chat fan-out, async work | AUD-DASH-SYNC etc. | Findings |
| `apps/api/app/Models/*` (40+) | ORM (fillable/casts/relations spot-verified where findings touch them) | per-category | Findings (AttendanceDay fillable) |
| `apps/api/config/*`, `bootstrap/app.php`, `cloudbuild.yaml`, `vercel.json` | Runtime + deploy config | AUD-SEC/DEPLOY | Findings |
| `apps/web/src/app/**` (29 pages) | All routes incl. 5 redirect shims | AUD-NAV | Findings (nav audit) |
| `apps/web/src/components/**` (~100) | Widgets, tables, forms, dialogs, app-shell | per-category | All logic-bearing components read |
| `apps/web/src/hooks/*`, `stores/*`, `lib/*` | Data layer | AUD-STATE/DASH-SYNC | Findings |
| `packages/ui/src/components/*` | Shared primitives (Toolbar deep-read; rest exercised via pages) | AUD-UI-LAYOUT | Findings |
| `apps/web/src/__tests__/**`, `apps/api/tests/**`, `.github/workflows/ci.yml` | Tests + CI | AUD-TESTS | Findings |
 
---
 
## Index
 
| ID | Category | Primary File(s) | Status |
|---|---|---|---|
| AUD-ARCH | Architecture & project map | — | OK (documented) |
| AUD-DOC | Spec/reality mismatch (`attendance.md`) | `attendance.md` | Findings |
| AUD-AUTH | Authentication & sessions | `AuthController.php` | Findings |
| AUD-AUTH-GUARD | Frontend auth guards / login-stuck | `dashboard/layout.tsx` | Findings |
| AUD-DASH | Dashboard page & widget engine | `widget-engine.tsx` | Findings |
| AUD-DASH-SYNC | Dashboard synchronisation & caching (systemic) | `DashboardController.php` | Findings |
| AUD-DASH-METRICS | Widget & report data accuracy | `DashboardController.php`, widgets | Findings |
| AUD-DASH-PENDING | Pending Approvals widget | `DashboardController.php:42-183` | Findings |
| AUD-DASH-ACTIVITY | Recent Activity widget | `DashboardController.php:259-282` | Findings |
| AUD-QUICKTASK | Quick Task widget | `quick-task-widget.tsx` | Findings |
| AUD-SCRATCH | Quick Scratchpad widget | `quick-notes.tsx` | OK after code audit |
| AUD-ATT-BE | Attendance backend | `AttendanceService.php` | Findings |
| AUD-ATT-FE | Attendance frontend | `components/attendance/*` | Findings |
| AUD-ATT-GRAPH | Attendance graph/calendar/analytics | `AttendanceController::graph` | Findings |
| AUD-LEAVE | Leave module | `LeaveRequestController.php` | Findings |
| AUD-PROJ | Projects (backend + frontend) | `ProjectController.php` | Findings |
| AUD-TASK | Tasks backend | `TaskController.php` | Findings |
| AUD-TASK-FE | Tasks frontend (kanban/tab/detail) | `tasks-tab.tsx` | Findings |
| AUD-CHAT | Chat | `ChatController.php` | Findings (minor) |
| AUD-NOTIFY | Notifications | `NotificationController/Service` | OK after code audit |
| AUD-REALTIME | Realtime/broadcast contracts | `app/Events/*` | Findings |
| AUD-USERS | User management | `UserController.php` | Findings (minor) |
| AUD-DIR | Directory / Departments / Designations | `DirectoryController.php` | OK after code audit |
| AUD-PICKERS | Entity pickers truncated by pagination | `departments-tab.tsx:132-136` | Findings |
| AUD-REPORTS | Reports & exports | `GenerateReportJob.php` | Findings |
| AUD-AUDIT | Audit logs | `AuditLogController.php` | OK after code audit |
| AUD-SETTINGS | Settings | `SettingsController.php` | OK after code audit |
| AUD-QA | QA forms | `QaController.php` | OK after code audit |
| AUD-TIMER | Task/project timer & time logs | `timer-store.ts` | Findings (minor) |
| AUD-ANNOUNCE | Announcements | `AnnouncementController.php` | Findings |
| AUD-PHASES | Project phases | `PhaseController.php` | OK after code audit |
| AUD-UI-LAYOUT | Toolbar nesting / layout | `packages/ui/.../toolbar.tsx:237-247` | Findings |
| AUD-NAV | Navigation & routing | `command-palette.tsx`, redirect shims | Findings |
| AUD-STATE | State management / offline engine | `query-keys.ts` | Findings (minor) |
| AUD-SEC | Security | `routes/api.php:52-114` | Findings |
| AUD-TESTS | Tests & CI | `ci.yml` | Findings |
| AUD-DEPLOY | Deploy/env parity | working-tree diff | Findings |
 
---
 
## Client Requirement vs Implementation Matrix
 
Explicit client requirements (the 20 reported areas) versus verified implementation. Statuses: Implemented Correctly / Partially Implemented / Incorrectly Implemented / Broken / Missing / Duplicated-Conflicting / Unknown.
 
| Requirement | Expected Behaviour | Current Implementation | Status | Evidence | Category |
|---|---|---|---|---|---|
| 1. Widget synchronisation (Admin/HR/Employee) | Mutations reflect in widgets immediately/consistently | Layered 120 s init + 300 s metrics server caches per viewer; observer never clears init; ad-hoc writer clears; frontend 5-min staleTime, no refetch on mount/focus, no polling; one realtime event | **Broken** | `DashboardController.php:36-38,210-212`; `CacheInvalidationObserver.php:15-37`; `use-dashboard-init.ts:23-25` | AUD-DASH-SYNC |
| 2a. Total Employees widget | Count from employee source; present/absent from attendance; updates on change | Total from `dashboard_global` (cleared on user writes ✓) but viewer metrics cache not → ≤5 min lag; present = present+late (cached); "absent" = remainder incl. on-leave | **Partially Implemented** | `DashboardController.php:226-252`; `metric-widget.tsx:141-147` | AUD-DASH-METRICS |
| 2b. Active Projects widget | Active count from Project area; completions move immediately | Correct source (`projects.status='active'` via `dashboard_global`); viewer caches not invalidated on transitions → lag ≤120/300 s | **Partially Implemented** | `DashboardController.php:353-360` | AUD-DASH-METRICS/SYNC |
| 2c. Today's Employee widget | Clocked-in/on-time/late/absent/on-leave/unannounced-leave | Both widgets aggregate a **paginated(20)** overview client-side → wrong above 20 staff; leave shown via team-today only elsewhere; absent definition diverges from attendance page | **Incorrectly Implemented** | `admin-today-attendance-widget.tsx:18-28`; `AttendanceController.php:427-428,489-506` | AUD-DASH-METRICS |
| 3. Pending Approval widget | Tasks + leaves pending, synced with workflows | List correct in scope but task/project submissions invalidate no admin cache & no broadcast → ≤120 s lag; kanban path to review is 422; leave inline decisions work | **Partially Implemented / Broken (task path)** | `TaskController.php` (no clears in submitForReview); `tasks-tab.tsx:225-231` + `TaskController.php:442-444` | AUD-DASH-PENDING, AUD-TASK-FE |
| 4. Recent Activity widget | Clock-in/break/task submits/completions/profile updates in feed | Backend **excludes** attendance events; task mutations un-audited; frontend maps attendance events that can never arrive | **Incorrectly Implemented** | `DashboardController.php:265`; `recent-activity-widget.tsx:79-82` | AUD-DASH-ACTIVITY |
| 5. Quick Task widget | Standalone task + employee + priority + end date + deadline | Standalone/assignee/notification/chat work; **priority/date/deadline UI missing** (backend accepts them) | **Partially Implemented** | `quick-task-widget.tsx:78-117` vs `TaskController.php:259-265` | AUD-QUICKTASK |
| 6. Quick Scratchpad | Notes with persistence + resizing | CRUD + cache-clears on write; resize via grid handles | **Implemented Correctly** | `QuickNoteController.php:50-86` | AUD-SCRATCH |
| 7. Project area (tabs/cards/active-completed) | Accurate counts, avatars, realtime progress, correct status views | Status filter + progress (TaskObserver) correct; priority sort **500s on pgsql**; tab count badge key not invalidated; member avatars are initials-only | **Partially Implemented** | `ProjectController.php:87`; `projects/page.tsx:14-20` | AUD-PROJ |
| 8. Toolbar / Kanban header | Single clean container, horizontal, responsive, connected | Shared Toolbar renders its own card inside each page's second card; nowrap + fixed search width in overflow-x parents; stacked boxed rows + kanban bleed container | **Incorrectly Implemented** | `toolbar.tsx:237-247`; `projects-tab.tsx:100-101`; `tasks-tab.tsx:902-911` | AUD-UI-LAYOUT |
| 9. App-wide stability | No refresh-dependent/stale/inconsistent behaviour | Systemic cache architecture (row 1) + dead realtime listeners + query-key families outside invalidation prefixes | **Broken (systemic)** | AUD-DASH-SYNC, AUD-ATT-FE, AUD-STATE | multiple |
| 10. Login stuck | Login proceeds without manual refresh | `isErrorCapabilities` early-return blocks AuthGuard redirect → "Session could not load" dead-end on 403 flows | **Incorrectly Implemented** | `dashboard/layout.tsx:184-213` | AUD-AUTH-GUARD |
| 11. Project detail intermittent loading | Detail loads reliably | Detail fetch + scoping sound (findOrFail + 403); no divergent code path found — intermittent failures best explained by systemic 500s (priority sort) + stale caches; residual cause **Unknown** (needs prod logs) | **Unknown / partially attributed** | `projects/[id]/page.tsx:41-43`; `ProjectController.php:87` | AUD-PROJ |
| 12. UI / responsiveness | No overflow/clipping/misalignment at breakpoints | Toolbar pattern + fixed-height calcs (`100dvh-140px/180px`) + `100vh` in auth shell; mobile nav/sheets/dialogs/touch-drag implemented | **Partially Implemented** | AUD-UI-LAYOUT + Responsive Audit below | AUD-UI-LAYOUT |
| 13. Functionality completeness | Every control works | Dead/incorrect controls: kanban drag-to-review/done, "Overdue" preset, "Redo" filter, "By Department" graph grouping, dept pickers >20 | **Partially Implemented** | AUD-TASK-FE, AUD-ATT-GRAPH, AUD-PICKERS | multiple |
| 14. Data synchronisation / source of truth | One definition per business fact | Duplicate/conflicting: absent (2 definitions), pending_approvals (2 formulas), leave status (leave vs approval), working-days (3 calculators), attendance state (4 frontend derivations) | **Duplicated/Conflicting** | Duplicate Implementations section | multiple |
| 15. DB/backend/API | Schema/queries/permissions correct | pgsql-incompatible SQL ×2 (FIELD, double-quoted literals); HR scope leak in summary exports; `approver_id` referenced but never exists; `unapproved_break_seconds` never persisted | **Partially Implemented** | AUD-ATT-GRAPH, AUD-REPORTS, AUD-LEAVE, AUD-ATT-BE | multiple |
| 16. Role behaviour (Admin/HR/Employee) | Consistent role boundaries | Capability + HrScope enforcement solid everywhere live; leaks: leave `show()` unscoped for HR, export summaries, stale capability cookie on account switch | **Partially Implemented** | AUD-LEAVE, AUD-REPORTS, AUD-AUTH | multiple |
| 17. Notifications / chat events | Complete, timely, correct-recipient delivery | Notification pipeline solid (incl. realtime toast); DMs create no notification (30 s badge poll); task/project submission notifications fire but dashboard lag remains | **Partially Implemented** | `ChatController.php:168-184` | AUD-CHAT, AUD-NOTIFY |
| 18. Loading/error/empty/refresh states | Coherent async states | Generally good (skeletons, retries, empties); gaps: capabilities dead-end, frozen break ticker, blank-tab nav target, metrics "absent ~0" wrong-data state | **Partially Implemented** | AUD-AUTH-GUARD, AUD-ATT-FE, AUD-NAV | multiple |
| 19. Performance | No duplicate/storm requests | Punch refetch storm (all clients × every punch), Echo rebuild per token refresh, duplicate task fetch on detail open, 4-offline-registry query keys | **Partially Implemented** | `use-dashboard-init.ts:15-17`; `use-reverb.ts:120` | AUD-DASH-SYNC/REALTIME |
| 20. Testing | Automated coverage of critical workflows | 37 FE tests; **6 red (written for a never-merged redesign)**; CI runs them; no coverage for dashboards/sync/leave/kanban approvals/chat | **Broken (red) / Minimal** | AUD-TESTS, AUD-DOC | AUD-TESTS |
 
---
 
## Workflow Coverage
 
Status per major workflow (entry → … → final UI state):
 
| Workflow | Chain | Status | Break point(s) |
|---|---|---|---|
| Login → role-select → dashboard | login → setAuth → guards → init | Partially | 403 dead-end branch (AUD-AUTH-GUARD) |
| Clock in/out/breaks | TimeClock → offlineEngine → punch API → reconcile → caches → broadcast → widgets | Partially | viewer caches + dead table listeners (AUD-DASH-SYNC/ATT-FE) |
| Continue shift | clock_out → clock_in again | Partially | visible total resets to 0 (`time-clock-widget.tsx:115`) |
| Attendance correction | org table → member sheet → correct API → reconcile → notify | Mostly OK | admin-table invalidation key miss |
| Leave request → approve | form → approval chain → balance → on_leave rows → widgets | Partially | service-bypassing listener (schedule/manual-source/caches), cancel-notify dead, cancelled shows "pending" |
| Task create (quick + full) → assign | widgets/dialogs → store → notifications + chat | Mostly OK | priority/date UI missing in Quick Task; pickers truncated |
| Task start → submit for review | detail sheet → submitForReview → approval + notifications | Mostly OK | no dashboard invalidation/broadcast → admin lag |
| Kanban move | drag → PUT status | **Broken** | 422 without submission note (AUD-TASK-FE) |
| Task approve/redo | detail sheet → approve/redo → done/in_progress + chat + activity | Partially | narrow client invalidations; reorder/bulk bypass pipeline |
| Project create → members → tasks → submit → review → completed | full chain | Partially | FIELD() 500 on sort; submit/review cache gaps; count-badge key |
| Announcements | composer → broadcast → widget | Partially | per-viewer init cache ≤120 s |
| Chat DM / group / project chat | full chain incl. realtime | OK (minor) | no DM notification |
| Exports | trigger → job → S3 → realtime + download | OK (one leak) | HR summary-export scope leak |
| Demo data seed/purge | settings → queued jobs | OK | purge no longer touches audit_logs |
 
---
 
## [AUD-ARCH] Architecture & Project Map
 
* Purpose: canonical structure/truth-flow reference (content above in *Project Architecture Map*).
* Summary: Laravel 12 API + Next.js 16 App Router + shared UI package; DB is single source of truth with per-viewer derived caches; hosted Pusher; S3 storage.
* Findings: none specific to structure.
* Dependencies: everything below.
 
## [AUD-DOC] Spec/Reality Mismatch — `attendance.md` claims fixes absent from the code
 
* Files: `attendance.md` (§3–6) vs `AttendanceService.php`, `Listeners/LeaveAttendanceIntegration.php`, `Models/AttendanceDay.php:6-19`, `AttendanceController.php:87-94,269-273`, `time-clock-widget.tsx:115`, `timer-store.ts:61-67`, `use-dashboard-init.ts:15-17`, `admin/hr-attendance-table.tsx`, today widgets, `today-summary-card.tsx`, `attendance/page.tsx:168`
* Purpose: attendance product spec + remediation record.
* Current behaviour: §4 lists 12 applied fixes; item-by-item verification shows **10–11 absent** (only holiday-vs-worked precedence, `AttendanceService.php:252-258`, is in the tree). No `markLeaveDays` (grep-verified), no `src/lib/attendance.ts`, `unapproved_break_seconds` not fillable, dead listeners still present, widgets still paginated-capped, `startTimer(timestamp, 0)` still zeroes Continue-Shift, blanket init invalidation remains, `stopTimer` leaves stale fields, dead `team_today_*` half-code.
* Findings:
 
  * [Critical] A planner reading `attendance.md` §4/§6 would treat the attendance fan-out defects as fixed; they are not — changes never merged or reverted — `attendance.md:129-178`
  * [High] The red vitest suite is this phantom implementation's residue (tests expect "Pause for Break" copy, rollback semantics, and table placeholders/analytics header of the never-merged redesign) — `time-clock-widget.test.tsx:126` vs `time-clock-widget.tsx:264`; `admin-attendance.test.tsx:46-63`
  * Positive: §3's solution design is sound and matches this audit's independent conclusions — recommended blueprint for re-implementation.
* Dependencies: `AUD-ATT-BE`, `AUD-ATT-FE`, `AUD-TESTS`, `AUD-DASH-SYNC`
* Open questions: do the attendance.md changes exist on another branch/commit? (Not found in this tree.)
 
## [AUD-AUTH] Authentication & Sessions
 
* Files: `AuthController.php`; `routes/api.php:119-140`; `ForcePasswordChange/ForceOnboarding/EnsureTokenIsNotRefresh`; `(auth)` pages
* Purpose: credential lifecycle, token rotation, forced flows.
* Current behaviour: login by email/username/employee_id with rate-limit + lockout + suspicious-IP alerts; refresh rotation + max-device; role-select re-issues `role:`-tagged tokens; change-password revokes all; sessions list/revoke broadcast.
* Findings:
 
  * [Medium] Stale `g4k_capabilities` cookie seeds `useCapabilities().initialData` → previous user's capability-gated UI for ≤5 min after account switch — `capabilities.ts:38-46`
  * [Medium] Onboarding password step discards the rotated token pair and recovers only via explicit refresh + silent-refresh path — `onboarding/page.tsx:87,116-118`
  * [Low] Token `role:` ability vs DB `active_role` can disagree mid-session after admin role edits — `AuthController.php:309-317` vs `UserController.php:250-252`
  * [Low] IP-based suspicious-login check under `trustProxies(at:'*')` — prod proxy chain unverified — `bootstrap/app.php:19`
* Related workflows: login, role-select, onboarding, password flows.
* Open questions: production proxy/IP correctness (needs live probe).
 
## [AUD-AUTH-GUARD] Frontend Auth Guards / Reported "Login stuck"
 
* Files: `login/page.tsx:66-108`; `auth-guard.tsx:30-118`; `dashboard/layout.tsx:180-213`
* Current behaviour: layout gates on capabilities query **before** mounting AuthGuard.
* Findings:
 
  * [High] `isErrorCapabilities` early-return renders instead of `<AuthGuard>` — any 403 from `/me/capabilities` (not exempted by either force-middleware) traps the user on "Verifying session…" → "Session could not load" with a Retry that 403s again; the guard's redirect never mounts — `dashboard/layout.tsx:184-213`
  * [Medium] First-login (no cookie) + one transient network error hits the same dead-end — `capabilities.ts:36-50`
  * [Low] Single failed silent refresh hard-redirects to login; two tabs racing refresh rotation can spuriously log out — `api-client.ts:150-153`
* Related workflows: login (requirement 10).
 
## [AUD-DASH] Dashboard Page & Widget Engine
 
* Files: `dashboard/page.tsx`; `widget-engine.tsx`; `reconcile-layout.ts`; `ui-store.ts`
* Current behaviour: role-gated widget catalogs on react-grid-layout with persisted per-user layout; all widgets share one `useDashboardInit` query.
* Findings:
 
  * [Medium] Only global refresh; server caches can still answer stale after it — `widget-engine.tsx:260-263`
  * [Low] Channel subscription never released (refcount leak) — `use-dashboard-init.ts:11-18`
  * [Low] Collapse→expand discards custom resized height — `widget-engine.tsx:60-78`
* Related workflows: all dashboard widgets (requirements 1–6).
 
## [AUD-DASH-SYNC] Dashboard Synchronisation & Caching (systemic root cause)
 
* Files: `DashboardController.php:15-195, 204-446`; `CacheInvalidationObserver.php:15-37`; `AttendanceController.php:87-94`; `TaskController.php:738-762`; `LeaveRequestController.php:248-259`; `use-dashboard-init.ts`; `providers.tsx:80-93`
* Purpose: the application's entire derived-data propagation layer.
* Current behaviour (Data Synchronisation Audit): `mutation → DB → ad-hoc partial cache forget → /dashboard/init (120 s per-viewer) → RQ (5-min staleTime, no mount/focus refetch, no polling) → widgets`; realtime = one event; observer clears metrics only for the affected user and never init.
* Findings:
 
  * [High] init outer cache 120 s defeats every client invalidation — `DashboardController.php:36-38`
  * [High] metrics 300 s per-viewer never cleared for viewers of other people's changes (Total Employees ≤5 min lag) — `:210-212` + `CacheInvalidationObserver.php:22-34`
  * [High] Observer never clears `dashboard_init_*`; writers enumerate users inconsistently; `submitForReview`/project `submit`/`review` clear nothing (tasks) or not init (projects) — `TaskController.php` (submit), `ProjectController.php:350-355,397-402`
  * [High] Frontend `staleTime 5 min` + `refetchOnMount:false` + `refetchOnWindowFocus:false` — navigation never refetches — `use-dashboard-init.ts:23-25`
  * [Medium] Dual today-sources on one dashboard (metrics vs overview) disagree for minutes
  * [Medium] Punch refetch storm + puncher metadata leak on `company.global` (any-auth channel) — `channels.php:26-28`, `use-dashboard-init.ts:15-17`
  * [Medium] Timer store seeded from 5-min-stale init slice while `/attendance/me/today` (30 s ETag) feeds only the badge — `dashboard/layout.tsx:130-139`
  * [Medium] `safeCall` controller-instantiation + defensive double-unwrap contract — `DashboardController.php:22-34`
* Related workflows: requirements 1, 2, 3, 9, 19.
 
## [AUD-DASH-METRICS] Widget & Report Data Accuracy
 
* Files: `DashboardController.php:224-404`; `AttendanceController.php:420-572`; both today widgets; `metric-widget.tsx`; `ReportController::attendanceSummary`
* Findings:
 
  * [High] Both today widgets aggregate a paginated(20) endpoint client-side → wrong counts above 20 staff; unpaginated `/attendance/team-today` unused by them — `admin-today-attendance-widget.tsx:18-19`, `hr-team-attendance-widget.tsx:22`, `AttendanceController.php:362-364,427-428`
  * [High] `absent` counted from `status='absent'` rows **nothing ever writes** (metrics + attendance-summary report ~0 absent) vs attendance page's correct LEFT-JOIN/COALESCE definition — `DashboardController.php:239-252`, `AttendanceController.php:489-506`
  * [Medium] `pending_approvals` two formulas in one payload (list includes tasks-in-review; count doesn't) — `:42-183` vs `:254-256,310-331`
  * [Medium] Breakdown labels on-leave as "absent/unclocked"; tooltip "currently active" for today-total — `metric-widget.tsx:50,54,141-147`
* Related workflows: requirements 2a/2b/2c, reports.
 
## [AUD-DASH-PENDING] Pending Approvals Widget
 
* Files: `DashboardController.php:42-183`; `pending-approvals-widget.tsx:31-50`; `LeaveRequestController::decision:197-262`; `leave-approval-actions-cell.tsx:27-75`
* Findings:
 
  * [High] Task/project submissions: no admin cache invalidation, no broadcast → widget lags ≤120 s (chain: create → pending state → widget ✗ → approval → final state → widget update ✗ until TTL)
  * [Medium] `id = approval_id ?? leave_request_id` + unordered `id OR approvable_id` lookup — fragile with any second approval row — `DashboardController.php:75`, `LeaveRequestController.php:204-208`
  * [Low] Decisions invalidate dashboardInit only (widget) / orgLeaveRequests only (page cell); `admin_leave_history` untouched ≤60 s — `leave-approval-actions-cell.tsx:67-70`
* Related workflows: requirement 3.
 
## [AUD-DASH-ACTIVITY] Recent Activity Widget
 
* Files: `DashboardController.php:259-282`; `recent-activity-widget.tsx:20-112`; `hr-activity-feed-widget.tsx:37-39`
* Findings:
 
  * [High] Feed **excludes** `attendance.%` while frontend maps those events (dead code); task mutations un-audited → requirement 4 unmet at data layer — `DashboardController.php:265` + `recent-activity-widget.tsx:79-82`
  * [Medium] HR "activity" widget reads today's roster, not activity; 300 s cache bypassed by raw-DB leave updates
* Related workflows: requirement 4.
 
## [AUD-QUICKTASK] Quick Task Widget
 
* Files: `quick-task-widget.tsx`; `TaskController::store:252-364`
* Findings:
 
  * [Medium] Priority/end-date/deadline UI missing though backend accepts them — `quick-task-widget.tsx:78-117` vs `TaskController.php:259,264-265`
  * [Medium] Assignee list `/directory?per_page=100` truncated above 100 — `:26-29`
  * [Low] Doesn't invalidate the projects count badge
* Related workflows: requirement 5 (persistence/assignment/notifications/chat verified working).
 
## [AUD-SCRATCH] Quick Scratchpad Widget
 
* Files: `quick-notes.tsx`; `QuickNoteController.php`
* Status: **OK after code audit** — writes clear `dashboard_init_*` + `quick_notes_*` (`:50-52,69-71,84-86`); resize implemented via grid handles. [Low] height bound only by grid.
* Related workflows: requirement 6.
 
## [AUD-ATT-BE] Attendance Backend
 
* Files: `AttendanceService.php`; `AttendanceController.php`; `LeaveAttendanceIntegration.php`; `FlagOpenShifts.php`; `AlertMissedClockIn.php`; `Models/AttendanceDay.php:6-19`
* Purpose: immutable punch log + day reconciliation (the system's strongest subsystem).
* Current behaviour: transaction + row-lock state machine, client-id idempotency, overnight anchoring, corrections with force-recompute, 5-min scheduler jobs.
* Findings:
 
  * [High] `unapproved_break_seconds` computed but never persisted (fillable omission) — `AttendanceService.php:273` vs `Models/AttendanceDay.php:6-19`
  * [High] Punch cache-clears cover only the puncher — `AttendanceController.php:87-94`
  * [High] Leave integration bypasses the service (raw DB writes): default schedule vs user schedule (marked ≠ deducted possible), `source:'server'` clobbers `manual`, no Feb-29 fallback, no cache invalidation — `LeaveAttendanceIntegration.php`
  * [Medium] Recurring holidays deducted-but-not-marked (exact-date calculators vs recurring-excluding listener)
  * [Medium] Holiday cache v2/v1 key mismatch → 24 h stale day statuses — `AttendanceService.php:239` vs `HolidayController::clearHolidayCache`
  * [Medium] Manual-source branch skips totals/status recompute — `AttendanceService.php:213-222`
  * [Low] Dead `team_today_*` half-code — `AttendanceController.php:272-273,93-94`
  * [Low] Raw-date vs company-tz event filtering straddle at midnight edges
  * [Low] `notifyOpenShifts` positional-by-luck array call — `:880-890`
  * [Low] `'pending'` status never written; `'overtime'` not a status
* Related workflows: clock in/out, breaks, corrections, leave marking.
 
## [AUD-ATT-FE] Attendance Frontend
 
* Files: attendance pages + 18 components (all read)
* Findings:
 
  * [High] Dead realtime listeners (`presence-org` / `.attendance.updated`) on both main consoles and HR analytics → no live refresh — `admin-attendance-table.tsx:91`, `hr-attendance-table.tsx:94`, `hr-attendance-analytics.tsx:41` (correct: `admin-attendance-analytics.tsx:22`, `admin-open-shifts-table.tsx:75-83`)
  * [Medium] Continue Shift zeroes visible total — `time-clock-widget.tsx:115`
  * [Medium] Frozen ongoing-break ticker + second break derivation — `today-summary-card.tsx:86`
  * [Low] `'overtime'` dead status branch; 4 independent status derivations — `attendance/page.tsx:168`
  * [Low] Correction invalidation misses admin-table key prefix — `hr-correction-dialog.tsx:132-135`
* Related workflows: requirement 1/9/18.
 
## [AUD-ATT-GRAPH] Attendance Graph / Calendar / Analytics
 
* Files: `AttendanceController::graph:909-968` (uncommitted fix in working tree); `attendance-graph.tsx:61-69`; `admin-attendance-calendar.tsx:23-28`; `admin-attendance-view.tsx:50-62`
* Findings:
 
  * [Critical] HEAD returns bare array + double-quoted SQL (invalid on pgsql → 500) while frontend reads `data.stats` → graphs/calendars/analytics broken in prod until the uncommitted diff ships
  * [Medium] Hours/overtime series always 0 (columns not selected) — `attendance-graph.tsx:68-69` vs `:955-963`
  * [Medium] "By Department" grouping unsupported → mislabeled date data — `admin-attendance-view.tsx:57-61`
* Related workflows: org attendance analytics/calendar.
 
## [AUD-LEAVE] Leave Module
 
* Files: `LeaveRequestController.php`; `ApprovalService.php`; `LeaveAttendanceIntegration.php`; leave components
* Findings:
 
  * [High] Cancel notification dead (`approver_id` never exists as column) — `LeaveRequestController.php:460-470`
  * [High] Employee history filters `approval.status` → cancelled leaves under "pending" filter; exports same duality — `:298-303`, `:441-443`, `GenerateReportJob.php:343`
  * [Medium] `show()` unscoped for any HR — `:264-277`
  * [Medium] Duplicate `calculateWorkingDays` (controller + model) — drift risk
  * [Low] Escalation/self-approval guards/balance clamps/decision cache-clears verified correct
* Related workflows: requirement 3 (leave leg), attendance integration.
 
## [AUD-PROJ] Projects (Backend + Frontend)
 
* Files: `ProjectController.php`; projects pages/tabs/dialogs/cards
* Findings:
 
  * [Critical] `FIELD(priority,…)` sort = 500 on pgsql — `ProjectController.php:87` + `projects-tab.tsx:113-115`
  * [Medium] `submit`/`review` don't clear init/metrics → widget lag — `:350-355,397-402`
  * [Medium] Tab count badge key not prefix-matched by mutations — `projects/page.tsx:14-20`
  * [Medium] HR project without department loses manage rights — `:106-111` vs `:18-25`
  * [Low] `destroy` orphans phases/qa-submissions; update doesn't notify new members
* Related workflows: requirements 7, 11.
 
## [AUD-TASK] Tasks Backend
 
* Files: `TaskController.php`; `TaskService.php`; `RecurrenceService.php`; listeners
* Findings:
 
  * [High] `reorder()` path bypasses submission-note/QA/self-approval checks and completion side effects — `:502-534` vs `:430-450`
  * [Medium] `bulk` complete same bypass — `:131-137`
  * [Medium] `submitForReview`: no dashboard invalidation/broadcast
  * [Low] Redundant leave-status re-update in `ProcessApprovalDecision`
* Related workflows: task lifecycle (create→assign→start→submit→approve→activity).
 
## [AUD-TASK-FE] Tasks Frontend (Kanban / Tasks tab / Detail)
 
* Files: `tasks-tab.tsx`; `task-kanban-board.tsx:295-357`; detail sheet/overview; `tasks/[id]`; create dialog
* Findings:
 
  * [Critical] Kanban drag / context "Move to" Review|Done → PUT without note → 422 for all roles; only the detail-sheet submit path works — `tasks-tab.tsx:225-231` + `TaskController.php:442-444`
  * [Medium] "Overdue" preset silently unfiltered — `tasks-tab.tsx:187`
  * [Medium] "Redo" filter always empty — `tasks-tab.tsx:958`
  * [Medium] Approve/redo invalidate only `["task-detail",id]`; submit misses `dashboardInit` — `task-overview-tab.tsx:87-132`
  * [Low] `["tasks-submitted"]` outside prefix family; `tasks/[id]` duplicate fetch key
* Related workflows: requirements 3, 13.
 
## [AUD-CHAT] Chat
 
* Files: `ChatController.php`; `chat-tab.tsx`; message list/composer; chat page tabs
* Findings:
 
  * [Medium] Plain DMs create no recipient notification (mentions only) → ≤30 s badge lag — `ChatController.php:168-184`
  * [Low] Client-side pinned/unread ordering over 50-per-page cursors
* Status: otherwise OK (pagination, receipts, pins, attachments, access checks verified).
 
## [AUD-NOTIFY] Notifications
 
* Files: `NotificationController/Service/Observer`; `NotificationCreated.php`; `notifications-bell.tsx`
* Status: **OK after code audit** — realtime toast + counts + fallback polling verified; `approval-status-change` contract matches; per-type channels busted on settings save.
 
## [AUD-REALTIME] Realtime / Broadcast Contracts
 
* Files: `app/Events/*`; `routes/channels.php`; `use-reverb.ts`; all 20 `.listen()` sites
* Findings:
 
  * [High] Dead attendance-table listeners (wrong channel + name) — see AUD-ATT-FE
  * [Medium] `TaskCompleted`/`ApprovalSubmitted` broadcast to channels nobody listens to (overhead only)
  * [Medium] Echo instance rebuilt on every 15-min token refresh → full reconnect/resubscribe — `use-reverb.ts:120`
  * [Low] Missing `NEXT_PUBLIC_PUSHER_*` env silently disables all realtime — `use-reverb.ts:36-39`
* Related workflows: requirement 1/17.
 
## [AUD-USERS] User Management
 
* Files: `UserController.php`; user form/actions
* Findings:
 
  * [Medium] `assignments()` misses `task_assignees` pivot — `:672-675`
* Status: otherwise OK (role gating, last-admin guards, scoping, PII hiding, audit logging).
 
## [AUD-DIR] Directory / Departments / Designations
 
* Files: 3 controllers + 3 tabs + directory page
* Status: **OK after code audit** — visibility rules, CRUD, sync, archive/restore, invalidations verified.
 
## [AUD-PICKERS] Entity Pickers Truncated by Pagination
 
* Files: `departments-tab.tsx:132-136,608,665`; `tasks-tab.tsx:120-123`; `create-task-dialog.tsx:63`; `projects/[id]/page.tsx:61-63`
* Findings:
 
  * [Critical] Dept member/HR pickers `/users` default 20 → only 20 newest users assignable
  * [Medium] Task project pickers `/projects` default 15
  * [Medium] Project member pickers `/directory` default 24
* Related workflows: requirement 13.
 
## [AUD-REPORTS] Reports & Exports
 
* Files: `ReportController.php`; `GenerateReportJob.php`; `use-export.ts`; reports views
* Findings:
 
  * [High] Summary **export** branches missing HR scope (live endpoints scoped) → company-wide leak — `GenerateReportJob.php:362-366,394-398`
  * [Medium] Tasks export misses assignees pivot — `:137-140`
  * [Medium] Attendance-summary absent_days ~0 (never-written rows) — same root cause as AUD-DASH-METRICS
  * [Low] Whole-file streaming on download
* Status: chunking, CSV-injection sanitization, ownership, realtime completion verified OK.
 
## [AUD-AUDIT] Audit Logs
 
* Status: **OK after code audit** — filtered index, queued export, demo purge untouched.
 
## [AUD-SETTINGS] Settings
 
* Files: `SettingsController.php` + 11 components + work-schedules/holidays/password-reset controllers
* Findings:
 
  * [Medium] Holiday CRUD doesn't clear `all_holidays_array_v2` (cross-listed AUD-ATT-BE)
* Status: otherwise OK (masked mail password, category busts, capability clear, SMTP test, queue monitor, schedule cache clears).
 
## [AUD-QA] QA Forms
 
* Status: **OK after code audit** — builder/viewer/preview wired; server-side QA validation on submissions.
 
## [AUD-TIMER] Task/Project Timer & Time Logs
 
* Findings:
 
  * [Low] `_broadcastState` channel leak — `timer-store.ts:243-248`
  * [Low] `logTime` clears active-task cache side effect — `TimerController.php:76-79`
  * [Low] `stopTimer` leaves stale timestamps — `timer-store.ts:61-67`
* Status: gating, active-task broadcast (consumed), offline engine, cross-tab sync all OK.
 
## [AUD-ANNOUNCE] Announcements
 
* Findings:
 
  * [Medium] Writes clear only the actor's `announcements_*` cache → other viewers ≤120 s stale despite correct realtime event — `AnnouncementController.php:147,199,216,302`
  * [Low] Dead `'admin'` role check (`:34`); no "view dismissed" path (design choice)
* Status: scoping/urgency/dismissals/attachments otherwise OK.
 
## [AUD-PHASES] Project Phases
 
* Status: **OK after code audit.**
 
## [AUD-UI-LAYOUT] Toolbar Nesting / Layout (reported issue #8)
 
* Files: `packages/ui/src/components/toolbar.tsx:237-247`; `projects-tab.tsx:99-140`; `tasks-tab.tsx:598-619,900-1012,1066`
* Findings:
 
  * [High] Toolbar's own bordered card nested inside each page's second bordered card; nowrap + fixed search width inside overflow-x parents → horizontal scroll instead of wrap
  * [Medium] Stacked boxed rows + kanban bleed container (negative margins) → excessive vertical space / disconnected columns; `h-[calc(100dvh-140px)]` brittle
  * [Low] Mobile nav/sheets/dialogs/sticky tables OK; no other clipping found
 
## [AUD-NAV] Navigation & Routing
 
* Files: `command-palette.tsx`; `nav-group.tsx`; `breadcrumb.tsx`; redirect shims (`admin/attendance`, `admin/reports`, `org/leave`, `leave`, `notifications`, `announcements` pages); `dashboard/layout.tsx` nav + mobile bottom bar; `use-url-state.ts`
* Purpose: route exposure, deep links, redirects.
* Current behaviour: nav filtered by capability + `hideForAdmin` (`nav-group.tsx:127-137`); legacy paths redirect to canonical ones (all 5 shims verified); breadcrumb label map + numeric-ID resolution (`breadcrumb.tsx:14-40`); palette targets all exist **except two query-param issues below**; mobile bottom nav capability-gated.
* Findings:
 
  * [Medium] Palette "View Company Attendance" pushes `/dashboard/org/attendance?tab=all` — `all` matches no TabsTrigger (`calendar|today|analytics|shifts|leave`, default `calendar`) → Radix renders **no tab content** (blank body under the tab bar) — `command-palette.tsx:187` vs `admin-attendance-view.tsx:16`
  * [Medium] Palette "Attendance Correction" pushes `?correction=true` — **no component reads the param** (grep across web src: zero consumers) → lands on the plain org page without opening any correction UI — `command-palette.tsx:100`
  * [Low] Breadcrumb fetches user/project labels via ad-hoc queries (N lookups per render on detail pages) — `breadcrumb.tsx:7-10`
* Verified-good: redirects, guard loops (none found), back/forward (URL-state tabs preserve state), deep links (`?tab=`, `?highlight=`, `?conversation=`), role-gated nav, mobile FAB visibility.
* Related workflows: all navigation (requirement 12/13 support surface).
 
## [AUD-STATE] State Management / Offline Engine
 
* Files: stores, `offline-engine.ts`, `providers.tsx`, `query-keys.ts`
* Findings (State Management Audit):
 
  * [Medium] Query-key families outside the registry and prefix-invalidation reach (`["tasks-submitted"]`, `["projects","count"]`, `["attendance","team-today"]`, `["task-detail"]`, `["project-tasks"]`, `admin_leave_history`, `["tasks",taskId]`) — the mechanical "updates don't propagate" cause
  * [Low] Offline punch dedupe UTC-vs-company-tz boundary
* Verified-good: hydration gates, tab sync, optimistic rollbacks (tasks/leave/notifications), version guard, offline queue conflict semantics.
 
## [AUD-SEC] Security
 
* Files: `routes/api.php:52-114`; `config/broadcasting.php:47-56`; `bootstrap/app.php`; `apps/api/test_*.php`
* Findings:
 
  * [Critical] **Unauthenticated `GET /api/auth/reset-demo-passwords`** resets 13 live demo accounts (admin incl.), unlocks, clears limiters, nulls expiry setting, **flushes entire cache** — `routes/api.php:52-93`
  * [High] Public `GET /api/auth/debug-token` leaks security settings/TTLs/DB time — `routes/api.php:95-114`
  * [Medium] Pusher client TLS verification disabled — `config/broadcasting.php:47-56`
  * [Low] Untracked `test_*.php` scratch files at API root
* Related: AUD-DEPLOY.
 
## [AUD-TESTS] Tests & CI
 
* Findings:
 
  * [High] 6 red tests across 3 files — authored for the never-merged `attendance.md` redesign (copy/semantics/placeholders) — CI runs the suite → pipeline red
  * [Medium] Minimal coverage of critical surfaces (no dashboards/sync/leave/kanban-approval/chat tests; sqlite-vs-pgsql divergence locally)
* Verified-good: lint/typecheck/bundle/OpenAPI in CI; `tsc` clean.
 
## [AUD-DEPLOY] Deploy / Env Parity
 
* Findings:
 
  * [Critical] Attendance-graph fix uncommitted → prod graphs broken until committed + deployed
  * [Medium] `NEXT_PUBLIC_PUSHER_*` unverifiable from repo; absence silently disables realtime
  * [Low] `FRONTEND_URL` default localhost for reset links; runtime env parity unauditable
 
---
 
## Cross-Module Findings
 
(unchanged, re-verified)
 
* **Attendance → Dashboard:** punch → reconcile → puncher clears + broadcast → all clients invalidate init → server serves admin's ≤120 s-cached payload → lag despite realtime.
* **Leave → Attendance → Widget:** approval → service-bypassing on_leave marking (default schedule, manual-clobber) → metrics after TTL; cancel re-reconciles ✓ but approver never notified; recurring holidays deducted-not-marked.
* **Task → Board → Approval → Activity:** sheet submit ✓; board move ✗ 422; reorder/bulk bypass pipeline; approve → progress+chat ✓, admin widgets only after TTL ✗; feed excludes the events it maps.
* **Project → Widget:** status/progress correct; `dashboard_global` cleared ✓; viewer init/metrics not ✗; count badge key mismatch.
* **HR scoping:** correct on all live endpoints; export summary branches are the one leak.
 
## Duplicate / Conflicting Implementations
 
| # | Duplications | Files | Which is used | Conflict impact |
|---|---|---|---|---|
| D1 | "Absent" defined twice (row-count vs LEFT-JOIN/COALESCE) | `DashboardController.php:239-252` + `ReportController` vs `AttendanceController.php:489-506` | page uses JOIN; metrics/reports use rows | metrics/reports show ~0 absent (High) |
| D2 | `pending_approvals` two formulas in one payload | `DashboardController.php` init vs metrics | both | badge vs count disagree (Medium) |
| D3 | Leave status dual source (`leave_requests.status` vs `approvals.status`) | `LeaveRequestController` index/admin vs history/destroy/export | mixed per endpoint | cancelled shows "pending" in history + exports (High) |
| D4 | Working-days calculators ×3 (controller, model, listener-embedded) | `LeaveRequestController.php:96-125`, `LeaveRequest::calculateWorkingDays`, `LeaveAttendanceIntegration.php` | first two per-user, listener default-schedule | marked ≠ deducted days (High) |
| D5 | Attendance state derived 4 ways on frontend | time-clock widget / summary badge / shift-log dot / calendar `getStatus` | all | color/label disagreements; dead `'overtime'` branch (Medium/Low) |
| D6 | Today-attendance widgets vs purpose-built `team-today` endpoint | widgets vs `AttendanceController::teamToday` | widgets use paginated overview | counts capped at 20 (High) |
| D7 | `hrToday` alias of `overview` + `teamToday` — three console endpoints, two shapes | `AttendanceController.php:362-364` | mixed consumers | drift risk (Low) |
| D8 | Duplicate avatar-upload implementations | `profile-header.tsx` + `profile-general.tsx` | both mount on profile page | redundant requests (Low) |
| D9 | Off-registry query keys vs `queryKeys` registry | various | mixed | invalidation misses (Medium) |
| D10 | Task "assignments" via `assignee_id` only vs pivot everywhere else | `UserController:672-675` | endpoint-only | incomplete assignment view (Medium) |
| D11 | Echo channel naming styles (`private-…` literal vs `private()`) | `use-reverb` consumers | both work under pusher-js | fragile convention (Low) |
 
## Navigation Audit
 
* **Verified-good:** 5 legacy/alias redirect shims all correct; capability-filtered sidebar + `hideForAdmin`; URL-state tabs (back/forward and deep links preserve state); guard chain has no redirect loops; mobile bottom nav gated; breadcrumb label map; `?highlight`/`?conversation`/`?task` deep links consumed.
* **Broken targets:** palette `?tab=all` → blank tab body (AUD-NAV, Medium); palette `?correction=true` consumed by nothing (AUD-NAV, Medium).
* **Unexposed backend surface (informational, not flagged as bug):** `/attendance/team-today` counts endpoint has no UI consumer (relevant to fix AUD-DASH-METRICS).
 
## UI/UX Audit (code-level)
 
* Toolbar double-container + nowrap-scroll + stacked boxed rows + kanban disconnect + fixed-height calcs — AUD-UI-LAYOUT (requirement 8 root causes).
* Dead-end error screens: capabilities dead-end (AUD-AUTH-GUARD); blank tab via palette (AUD-NAV).
* Misleading data displays: "absent/unclocked" incl. on-leave; "currently active" tooltip; ~0 absent reports (AUD-DASH-METRICS).
* Frozen live state: ongoing-break ticker (AUD-ATT-FE).
* Inconsistent affordances: list-view pin uses "more" icon vs grid star (`project-card.tsx:112-119`); duplicate toast on task approve (`task-overview-tab.tsx:107-108`).
* Feedback gaps: DM without notification (AUD-CHAT); correction completes without admin-table refresh (AUD-ATT-FE low).
* Generally-good patterns verified: skeletons/empties/retries across pages, confirm dialogs on destructive actions, optimistic rollbacks, sonner toasts, form drafts.
 
## Responsive Audit (code-level)
 
* Widget grid: 5 breakpoints (`GRID_COLS`, reconcile clamps x/w) — sound.
* Kanban: Pointer/Touch(200 ms delay)/Keyboard sensors all active (`task-kanban-board.tsx:257-261`) — mobile drag supported.
* Mobile: bottom nav + sheet menu; dialogs `max-h-[65dvh]`/`90dvh` scroll; tables sticky header/first col.
* Problem patterns: Toolbar `sm:flex-nowrap` + fixed `w-[260px]/[300px]` search inside `overflow-x-auto` wrappers → horizontal scroll not wrap (AUD-UI-LAYOUT); `h-[calc(100dvh-140px)]` (tasks) and `h-[calc(100vh-180px)]` (directory) fixed calcs brittle against variable header rows; `(auth)` layout uses `100vh` (mobile URL-bar jump risk — `min-h-screen` used on login page itself, mitigated).
* No desktop-only assumptions found in nav or core flows.
 
## Data Synchronisation Audit
 
See **[AUD-DASH-SYNC]** for the complete architecture analysis; **Cross-Module Findings** for per-entity chains; **Duplicate / Conflicting Implementations** for competing definitions. Net assessment: no central invalidation bus; per-viewer caches + ad-hoc forgets + one realtime event + a no-refetch client ⇒ the reported stale/inconsistent/refresh-dependent symptoms are structural, not incidental.
 
## State Management Audit
 
See **[AUD-STATE]** and the sync architecture above. Client state itself (zustand + RQ) is coherent; the failure modes are cache/invalidation-layer and key-registry issues, plus the timer-store dual-freshness seeding (AUD-DASH-SYNC Medium).
 
## Production Readiness Findings
 
Grounded verdict per dimension (from the findings above — no generic opinion):
 
* **Functionality:** NOT READY — 3 workflows broken for normal use on production data (kanban review moves, attendance analytics/graphs on pgsql, priority sort 500); pickers truncate above small org sizes.
* **Security:** NOT READY — unauthenticated admin-password-reset endpoint is an active takeover vector on the live demo dataset; public debug endpoint.
* **Reliability / consistency:** NOT READY — systemic per-viewer cache staleness makes dashboards diverge from source modules for minutes; dead realtime listeners on main consoles.
* **Data integrity:** CONDITIONAL — leave marking/deduction divergence, un-persisted unapproved breaks, cancelled-as-pending history/exports, absent-rows definition gap.
* **Auth/navigation/UI shell:** MOSTLY READY — solid token/guard/nav machinery with one dead-end branch and two palette targets to fix.
* **Deploy pipeline:** BLOCKED — red CI (tests for a phantom design) and an uncommitted production-breaking fix that must ship.
* **Minimum production gate (order):** (1) commit+deploy graph fix; (2) remove/gate reset-demo + debug-token routes; (3) resolve red tests; (4) pgsql-safe SQL for priority sort; (5) kanban move contract; (6) dashboard cache/realtime redesign per `attendance.md` §3 blueprint; then per-module mediums.
 
## Not Covered / Needs Follow-up
 
* **Vercel/API runtime env** (`NEXT_PUBLIC_PUSHER_*`, `NEXT_PUBLIC_S3_PUBLIC_URL`, `FRONTEND_URL`, MAIL/S3) — not in repo; needs dashboard/live verification (realtime on/off, avatar + reset-link URLs).
* **Live runtime behaviour** — queue worker/scheduler liveness, Pusher auth in prod, Supabase RLS enforcement, proxy/IP chain; needs live probing.
* **Backend test suite execution** — pgsql service required locally; CI result for the API job at audit time unknown.
* **`packages/ui` primitives** beyond Toolbar/badge/state-helpers/DataTable — exercised indirectly only.
 
## Summary Stats
 
- Total categories: 36
- Critical findings: 6 (public reset-demo endpoint; attendance.md phantom implementation; uncommitted pgsql graph break; kanban drag-to-review/done 422; MySQL FIELD() 500 on pgsql; dept pickers capped at 20)
- High findings: 19
- Medium findings: 33 (incl. 2 new navigation findings: blank `?tab=all` palette target; dead `?correction=true` param)
- Low findings: 30
- Total findings: 88
- Approximate files inspected: ~155 · lines: ~40,000
- Requirement matrix rows: 20 explicit client requirements assessed; statuses: 1 Implemented Correctly, 8 Partially Implemented, 6 Incorrectly/Broken, 2 Duplicated-Conflicting, 1 Broken-red-tests, 2 Unknown/partially-attributed
- Categories requiring implementation planning: 25
- Areas requiring additional verification: 4 (listed above)