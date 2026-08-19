# Audit Report — Games4Kings Workplace OS (g4k-v5)

Read-only end-to-end audit, 2026-08-20. Monorepo: `apps/api` (Laravel 11 + Sanctum + Octane/FrankenPHP, Cloud Run + Supabase pg + S3), `apps/web` (Next.js App Router + React Query + Pusher/Echo), `packages/ui` (shadcn-style shared UI). Backend ≈ 34 controllers / 41 models / 80 migrations / 22 feature tests. Frontend ≈ 36 routes / 98 components / 12 hooks.

## Index

| ID | Category | Primary File(s) | Status |
|---|---|---|---|
| AUD-API-ROUTES | API route map | apps/api/routes/api.php | 2 dead/dup routes, 1 dead import, debug endpoint |
| AUD-API-AUTH | Auth & sessions | apps/api/app/Http/Controllers/AuthController.php | Functional; stale-settings cache, split-brain residue, enumeration |
| AUD-API-CAPS | Capability matrix | apps/api/app/Services/CapabilityMatrix.php | OK; cache busted on settings save |
| AUD-API-MW | Middleware | apps/api/app/Http/Middleware/*.php | Capability names leaked in 403; weak CSP (unsafe-inline, wss://*) |
| AUD-API-USERS | User management | apps/api/app/Http/Controllers/UserController.php | Field-nulling bug, HR-scope inconsistency |
| AUD-API-PROFILE | Profile & uploads | apps/api/app/Http/Controllers/ProfileController.php, CompanyProfileController.php | S3 OK; self-service designation change (High) |
| AUD-API-ORG | Departments/teams/designations/HR scope | DepartmentController.php, DesignationController.php, app/Support/HrScope.php | syncHrs no role validation; is_active display-only; scoping uneven |
| AUD-API-ATT | Attendance | AttendanceController.php, app/Services/AttendanceService.php | Solid core; dead sync(), swallowed errors, idempotency global |
| AUD-API-LEAVE | Leave & approvals | LeaveRequestController.php, app/Services/ApprovalService.php | Self-approval CORRECTED (service blocks it; sole-admin exception); task-redo feedback bug; no cancel |
| AUD-API-PROJECTS | Projects | ProjectController.php | Gated OK; per_page unvalidated |
| AUD-API-TASKS | Tasks | TaskController.php, app/Services/TaskService.php | **approve/redo missing manager gate (Critical)** |
| AUD-API-QA | QA forms | QaController.php, migrations/…update_qa_forms_for_redesign.php | **field_type enum vs builder mismatch still live (High)** |
| AUD-API-TIMER | Time tracking | TimerController.php | No task/project ownership check |
| AUD-API-CHAT | Chat | ChatController.php, routes/channels.php | Authz OK; search narrow, clearChat semantics |
| AUD-API-COMMS | Announcements/notes/feedback/notifications | AnnouncementController.php, QuickNoteController.php, FeedbackController.php, NotificationController.php | Notif-channel cache staleness; dead announcements_all invalidations |
| AUD-API-REPORTS | Reports & exports | ReportController.php, app/Jobs/GenerateReportJob.php | HR over/under-scoping, base64-in-DB files, PDF buffers all rows |
| AUD-API-SETTINGS | Settings/company/demo/ops | SettingsController.php, DemoDataController.php, AdminPasswordResetController.php | settings:security cache never busted (High) |
| AUD-API-DASH | Dashboard aggregate | DashboardController.php | 'leave'-status bug here too; scope-less HR sees ALL company; controller-in-controller |
| AUD-API-BG | Queue/scheduler/events | routes/console.php, app/Jobs/*, app/Listeners/*, start-worker.sh | Alive via g4k-worker; heartbeat log spam; listener status-value fix needed in reports |
| AUD-API-DB | Schema/migrations/seeders/RLS | apps/api/database/* | RLS-on-all-tables OK; status-check down() narrower than up() |
| AUD-API-TESTS | Backend tests | apps/api/tests/* | 22 feature files; CI runs sqlite+pgsql matrix |
| AUD-API-DEPLOY | Deploy/config | cloudbuild.yaml, Dockerfile, start*.sh, config/* | Worker+API deployed; hardcoded Supabase refs; config:cache intentionally skipped |
| AUD-WEB-CORE | API client/auth/capabilities | src/lib/api-client.ts, auth-store.ts, capabilities.ts, middleware.ts | Refresh+offline queue solid; token in 3 client-side stores |
| AUD-WEB-SHELL | Shell/nav/realtime | src/app/dashboard/layout.tsx, src/hooks/use-reverb.ts, src/components/auth-guard.tsx | Admin routes absent from sidebar AND only partly in ⌘K |
| AUD-WEB-DASH | Dashboard page+widgets | src/app/dashboard/page.tsx, src/components/dashboard/* | OK |
| AUD-WEB-DIR | Directory/org management | src/app/dashboard/directory/page.tsx, src/components/directory/* | org/* pages are redirects into ?tab=; middleware gate bypassable (UX-only) |
| AUD-WEB-ATT | Attendance UI | src/components/attendance/*, attendance-history-calendar | OK (30-day cap issue not present in current calendar) |
| AUD-WEB-LEAVE | Leave UI | src/components/leave/* | OK (sampled) |
| AUD-WEB-PROJ | Projects UI | src/app/dashboard/projects/[id]/page.tsx, src/components/projects/* | Ungated /users fetch → employee 403 (High); .bak junk file |
| AUD-WEB-TASKS | Tasks UI | src/components/tasks/* (task-detail-sheet, kanban, gantt, QA builder) | QA builder emits types DB rejects |
| AUD-WEB-CHAT | Chat UI | src/components/chat/* | Pagination+reverse fixed; virtualized list |
| AUD-WEB-COMMS | Announcements/notes/notifications UI | src/app/dashboard/{announcements,notes,notifications}/* | Thin wrappers, OK |
| AUD-WEB-REPORTS | Reports UI | src/app/dashboard/reports/*, src/components/reports/*, src/hooks/use-export.ts | Export dual path fixed; saved-views RBAC mismatch; dead employee branch |
| AUD-WEB-SETTINGS | Settings & profile UI | src/components/settings/*, profile components | 12 tabs wired; 5-value timezone dropdown |
| AUD-WEB-OFFLINE | Offline engine | src/lib/offline-engine.ts, src/stores/timer-store.ts | Punch replay OK; request replay reuses stale auth header (self-heals) |
| AUD-WEB-TESTS | Web tests & config | src/__tests__/*, vitest.config.mts, eslint.config.mjs | 8 test files vs 98 components; CI green path exists |
| AUD-UI-PKG | packages/ui | packages/ui/src/* | 50 prims inventoried; 4 dead exports; generated SDK unused by app |
| AUD-INFRA-CI | CI workflows | .github/workflows/ci.yml | Solid: lint/typecheck/test/build/bundle/audit, pgsql matrix |
| AUD-ROOT | Repo hygiene | repo root | ~35 junk/debug files at root; README duplicated 84KB doc; empty tabs-sync.ts; dual openapi copies |
| AUD-WORKFLOW-LIFE | User lifecycle workflow | UserController.php:128-162, app/Mail/, (auth) pages | Created users get NO credentials email (High); auth flows complete |
| AUD-RBAC-WEB | Cross-cutting RBAC consistency | projects/[id]/page.tsx, tasks-tab, task-detail-sheet, saved-report-views | Gated-fetch pattern applied inconsistently; UI-gates-what-API-doesn't |
| AUD-SYNC-REALTIME | Sync & realtime consistency | NotificationService.php, NotificationObserver.php, invalidation-map.ts | Notification double-broadcast; invalidation-map dead (133 manual calls) |
| AUD-UI-DUPLICATE | Duplicate UI implementations | 3 hand-rolled calendars + ui/calendar, AlertDialog vs ConfirmDialog, dup priority maps | 3 bespoke calendars vs unused primitive; dual confirm patterns |
| AUD-MISSING-FEATURES | Partially-built/absent features | leave balance, leave cancel, notif-channel UI, dept inactive toggle | Balance UI absent; notif settings cover 3 of ~8 types |
| AUD-UX-CONSISTENCY | Visual/UX consistency | kanban, cards, chat, settings | Color semantics good; attendance status colors ad-hoc; settings width outlier |

---

## [AUD-API-ROUTES] API route map
- Files: apps/api/routes/api.php (376 lines, 218 Route::), routes/channels.php, routes/console.php, routes/web.php
- Summary: All API surface in one file. Sanctum + `ForcePasswordChange` + `ForceOnboarding` global group; per-route `capability:` middleware with `|` OR-groups. Capability gating is consistently applied at route level.
- Findings:
  - [Low] Duplicate route registration: `POST /timer/log` registered in both the projects block (api.php:186) and a standalone `capability:timer.track` block (api.php:232-234). Last registration wins in Laravel; the first block's copy is dead.
  - [Low] Public debug endpoint `GET /api/test-pusher` (api.php:52-65) leaks PUSHER_APP_KEY length/prefix and broadcast errors; debug leftover from the Reverb→Pusher migration.
  - [Low] Dead import `App\Http\Controllers\CompanyController` (api.php:7) — no such controller file exists (only CompanyProfileController).
  - [Low] `/ping` exposes user count and raw DB error text publicly (api.php:35-42).
  - [Medium] `GET /users/{id}` and `/users/{id}/activity` placed outside capability group relying on in-controller checks (api.php:329-331) — works, but pattern is fragile (see AUD-API-USERS for the resulting inconsistency).
- Depends on: all AUD-API-* categories.
- Open questions: Should `/attendance/sync` (exists as controller method, no route — see AUD-API-ATT) be wired up for true offline bulk sync, or deleted?

## [AUD-API-AUTH] Auth & sessions
- Files: apps/api/app/Http/Controllers/AuthController.php:47-637
- Summary: Identifier (email/username/employee_id) login, lockout (5 fails/10 min + rate limiter), access+refresh Sanctum token pair (role baked into access-token ability `role:X`), refresh via HttpOnly `g4k_refresh_token` cookie with rotation, suspicious-login alerts, password expiry, max-device enforcement, sessions list/revoke.
- Findings:
  - [High] `Cache::remember('settings:security', 3600)` at login/refresh/roleSelect/changePassword (AuthController.php:194, 297, 379, 528) is never busted by SettingsController::bulkUpdate — security settings (session TTLs, password expiry, max devices) stay stale up to 1h after an admin changes them.
  - [Medium] active_role split-brain residue: `roleSelect` writes the global `users.active_role` column (AuthController.php:395-396) while access tokens carry `role:X`. `/auth/refresh` runs unauthenticated so `resolveActiveRole()` falls back to the column (User.php:106-126). Two devices with different selected roles: last roleSelect globally wins on the other device's next refresh.
  - [Medium] Password-expiry fallback `password_changed_at ?: updated_at` (AuthController.php:208, 311) — any model save (e.g. avatar upload) refreshes `updated_at`, silently extending password lifetime.
  - [Medium] Account-state enumeration: distinct responses for inactive ("Account is inactive.") vs locked vs invalid credentials (AuthController.php:71-127) reveal account existence/lock state.
  - [Low] `GET /auth/refresh` mutates state (rotates tokens). SameSite=Lax + top-level navigation sends the cookie cross-site; attacker can't read the response, but the comment's "GET cannot be exploited" rationale (AuthController.php:28-31) is overstated.
  - [Low] `changePassword` re-issued tokens lack ip/user_agent forceFill (AuthController.php:535-536) — sessions list shows blanks for the current device after a password change.
  - [Low] Login response serializes full `$user`; sensitive fields rely on `$hidden` in User model (verify blood_group/emergency_contact hidden — list endpoints hide them manually, see AUD-API-USERS).
- Depends on: AUD-API-CAPS, AUD-API-MW, AUD-API-SETTINGS.
- Open questions: Is multi-device divergence (employee on phone, HR on desktop) a supported scenario? If yes, refresh must carry role per-token, not per-user-column.

## [AUD-API-CAPS] Capability matrix
- Files: apps/api/app/Services/CapabilityMatrix.php:1-95
- Summary: DB-driven `role_capabilities` with 1h cache and hardcoded fallback matrix (super_admin=*, hr, employee). `hasCapability` supports `*`; super_admin excluded from `attendance.clock-self` (intentional self-service exclusion).
- Findings:
  - [Low] Cache cleared only via SettingsController::bulkUpdate (SettingsController.php:55); direct DB edits (e.g. seeders, manual ops) take 1h to propagate.
  - [Low] Fallback matrix drifts from seeded matrix (fallback hr lacks `announcements.manage`, `reports.manage`, `audit.view`… present via DB seed) — fresh env without seed gets different permissions than prod.
- Depends on: AUD-API-SETTINGS, AUD-API-DB.

## [AUD-API-MW] HTTP middleware
- Files: apps/api/app/Http/Middleware/{RequireCapability,ForcePasswordChange,ForceOnboarding,SecurityHeaders,WrapBareArrays}.php
- Summary: RequireCapability resolves active role and ORs `|`/`,`-split capabilities. ForcePasswordChange blocks all but change-password/logout when `must_change_password`. ForceOnboarding whitelists 6 paths. (SecurityHeaders/WrapBareArrays inspected by name/registration only.)
- Findings:
  - [Low] 403 body echoes required capability names (RequireCapability.php:49) — capability enumeration for authenticated users.
  - [Low] ForceOnboarding matches `$request->path()` against literal strings — `api/auth/role-select` etc. — fragile if prefix changes (works today).
  - [Info] ForcePasswordChange ignores the DB toggle by design (AUTH-5 comment) — the `security.force_password_change` setting read in UserController::store (UserController.php:132-133) is therefore only used at user creation; consistent-enough but two sources of truth.
- Added in Continuation Pass (full bodies read):
  - [Low] CSP is weak: `script-src 'self' 'unsafe-inline'` (negates XSS protection for inline injection) and `connect-src wss://*` (any websocket host) in SecurityHeaders.php:29-40 — acceptable for an API-only origin (browser app is served by Vercel, so this CSP mostly guards the /api origin), but if ever applied to the web app it would need tightening.
- Depends on: AUD-API-AUTH, AUD-API-CAPS.

## [AUD-API-USERS] User management
- Files: apps/api/app/Http/Controllers/UserController.php:24-501
- Summary: Index (HR scoped to HrScope-managed departments), async CSV export, create (role capability split hr/employee), update, show/activity (self or manage-caps), status/deactivate with last-super-admin guard, soft delete + restore, admin password reset via temp-password email, bulk activate/deactivate, leaveHistory/assignments (HR-scoped).
- Findings:
  - [Medium] `update()` nulls org fields when omitted: `department_id => $validated['department_id'] ?? null` (UserController.php:191-194) — a partial update payload (or a client that omits the field) silently detaches department/team/designation/work schedule.
  - [Medium] `update()` target-role check only fires when `roles` is in the payload (UserController.php:172-182): a `users.employee.manage` holder can edit an HR/super_admin's profile fields (name/email/department) — target-role check exists in updateStatus/restore/destroy/bulk but not update.
  - [Medium] HR scoping inconsistent: `show`/`activity` (UserController.php:215-228, 326-348) check capability but NOT HrScope, while `leaveHistory`/`assignments` (UserController.php:458, 484) do scope HR to managed departments. HR sees any user's full profile + audit trail, but not their leave history — incoherent boundary.
  - [Low] `bulk()` silently skips unauthorized/last-super-admin rows; response gives no per-item feedback (UserController.php:415-441).
  - [Low] `resetPassword` returns 200 "Password reset, but could not send the email" on partial failure (UserController.php:382-386) — user locked out with no delivered temp password; temp password sent in plain email.
  - [Low] `store()` uses `forceCreate` (UserController.php:136) bypassing model events — intentional-looking (avoids observer side effects) but undocumented.
- Depends on: AUD-API-AUTH, AUD-API-ORG, AUD-API-REPORTS (export).
- Open questions: Should HR see cross-department profiles at all? Current answer differs per endpoint.

## [AUD-API-PROFILE] Profile & file uploads
- Files: apps/api/app/Http/Controllers/ProfileController.php:23-79, CompanyProfileController.php:40-80, ProjectController.php:284-318
- Summary: Self-profile update, avatar upload (2MB, image mimes), company logo (5MB), project cover (2MB). All uploads now go to `config('filesystems.default')` = S3/Supabase (previously raw-fetch/local — fixed). Audit-logged.
- Findings:
  - [High] `ProfileController::update` accepts `designation_id` (ProfileController.php:33) — any user with `profile.edit` (everyone) can set their own designation, an org-structure field HR owns. No other privileged field, but this one is HR data integrity.
  - [Medium] Replaced avatar/logo files are never deleted from S3 — orphan accumulation, cost leak (ProfileController.php:59-69, CompanyProfileController.php:56-70).
  - [Low] `avatar_url` accepted as free-text string in update (ProfileController.php:31) — users can point their avatar at arbitrary external URLs (minor content-spoofing vector; also used for tracking pixel URLs).
- Depends on: AUD-API-DEPLOY (S3 env).

## [AUD-API-ORG] Departments / designations / teams / HR scope
- Files: apps/api/app/Http/Controllers/DepartmentController.php (234 lines), DesignationController.php (132), app/Support/HrScope.php
- Summary: Departments with teams, HR assignments (department_hr pivot, migration 2026_08_12), employee sync, archive/restore, export. Designations with status + export. HrScope derives managed department ids for HR (super_admin bypasses). Route-level: GET list endpoints open to all authenticated; manage endpoints capability-gated.
- Findings:
  - [Low] `GET /departments` and `GET /designations` unscoped reads for all authed users (api.php:342, 361) — intended (directory needs them); noting as accepted.
  - [Low] HrScope consumers are inconsistent module-by-module (see AUD-API-USERS, AUD-API-LEAVE, AUD-API-REPORTS) — the scope exists but no shared enforcement abstraction for "HR sees managed departments".
- Added in Continuation Pass:
  - [Medium] `syncHrs`/`addHr` accept ANY user id with only `exists:users,id` validation (DepartmentController.php:163-187) — no check that targets hold the hr role, so a `departments.manage` holder can add arbitrary employees (or themselves) to the `department_hr` pivot, granting them HrScope rows over a department; combined with a later hr-role grant this pre-seeds visibility. Should validate target roles.
  - [Medium] Department `is_active` is display-only: the departments UI renders Active/Inactive/Archived tri-state (departments-tab.tsx:370-374) but no API path sets `is_active=false` — `update()` accepts only name/description (DepartmentController.php:98-108) and there is no status route (designations have one, departments don't). The "Inactive" state is unreachable except by direct DB edit.
  - [Low] `destroyTeam` hard-deletes a team without checking `users.team_id` references (DepartmentController.php:146-155) — users can be left with dangling team_id (FK behavior unverified).
- Depends on: AUD-API-USERS, AUD-API-ATT, AUD-API-LEAVE, AUD-API-REPORTS.

## [AUD-API-ATT] Attendance
- Files: apps/api/app/Http/Controllers/AttendanceController.php (1017 lines), app/Services/AttendanceService.php:18-277
- Summary: Immutable punch events + server-side day reconciliation (event-sourced). State machine validated (clock_in→break_start→break_end→clock_out), client_id idempotency, ±5min/48h timestamp window, per-user day aggregates (late/grace via work schedule, overtime, approved vs unapproved breaks, holiday detection incl. recurring). Admin overview/analytics/graph, HR team-today + per-user day/history (HrScope-scoped at AttendanceController.php:578, 640), corrections (CorrectAttendanceRequest + HrScope at :843), async xlsx export, open-shift notify.
- Findings:
  - [Medium] `sync()` (AttendanceController.php:101-171) has no route and no frontend caller — dead code. The offline engine replays punches one-by-one instead. Either wire it (batch, single reconcile) or delete ~70 lines.
  - [Medium] Idempotency check `AttendanceEvent::where('client_id', …)` is global, not per-user (AttendanceService.php:51) — cross-user client_id collisions (unlikely with the `evt_<ts>_<rand>` format, but contract is wrong) and no unique index verified on client_id.
  - [Medium] `reconcileDay` catch-all swallows every Throwable and returns a fake `status:'error'` array without persisting a day row (AttendanceService.php:261-276) — punches can "succeed" at the controller while the day summary silently never updates (log-only).
  - [Low] `DB::table('holidays')->get()` loads the whole holidays table on every punch/reconcile (AttendanceService.php:217).
  - [Low] recordEvent has no row locking on the last-event read — two concurrent punches can both pass the state-machine check (race window, self-inflicted only).
  - [Low] `userHasManage` helper is role-name based (`in_array($role, ['hr','super_admin'])`, AttendanceController.php:1010-1014) while the rest of the module is capability-based.
  - [Low] Manual-correction source preservation: `source==='manual'` days get partial updates only (AttendanceService.php:191-200) — reasonable, but late/overtime recomputation is skipped for those days forever.
- Depends on: AUD-API-BG (FlagOpenShifts/RemindShiftStart/AlertMissedClockIn), AUD-WEB-ATT, AUD-WEB-OFFLINE.

## [AUD-API-LEAVE] Leave & approvals
- Files: apps/api/app/Http/Controllers/LeaveRequestController.php:17-346, app/Services/ApprovalService.php, app/Listeners/LeaveAttendanceIntegration.php
- Summary: Request-with-overlap-guard (app-level check + pg unique-violation fallback 23505, LeaveRequestController.php:129-135), leave-balance enforcement (LeaveBalance::getOrCreate), approval workflow via ApprovalService (submit/approve/reject), HR pending queues scoped by HrScope, admin history, async xlsx export, leave→attendance integration listener (writes `on_leave` attendance days for working non-holiday days, queued).
- Findings:
  - [Medium — CORRECTED in Continuation Pass] Self-approval in `decision()`: the controller's HrScope check skips the leave owner (LeaveRequestController.php:158-166), which looked like a self-approval hole in Pass 1 — but `ApprovalService::approve/reject/redo` independently block `submitted_by === decidedBy` (ApprovalService.php:78-85, 128-139, 188-190). Residual gap: a SOLE super_admin is explicitly allowed to approve their own request (ApprovalService.php:79-82, "Allowed because they are the sole super_admin" — deliberate design), so with a single admin installed, self-approval of own leave/projects/tasks is possible. Controller-level check ordering remains inconsistent but is not exploitable except via the sole-admin path.
  - [Medium] HR `index` scope requires `approval.current_approver_role = 'hr'` AND managed-dept AND (`orWhere` own) (LeaveRequestController.php:31-37) — correctly grouped, but HR loses visibility of their-department leaves routed to super_admin.
  - [Medium] `show()`/`pending()`/`adminHistory()` authorize by assigned-role membership (`getCachedRoles()`), not active-role capability (LeaveRequestController.php:207, 253, 307-315) — inconsistent with route middleware; an employee-active-role user whose roles include hr (but shouldn't per active role) passes these in-controller checks where route capability already blocks the route (belt-and-suspenders, but reversed order).
  - [Low] Leave `export()` passes `_department_id` = requester's own department only (LeaveRequestController.php:334); GenerateReportJob leave-export scopes HR the same way (GenerateReportJob.php:255) — HR with multiple managed departments exports only their own department's members (under-scoped vs HrScope).
  - [Low] `store()` requestedDays counts calendar days (no weekend/holiday exclusion) against balance (LeaveRequestController.php:101-103) — while the attendance integration only marks working days. Balance is debited for non-working days too (verify against LeaveBalance.used update path in ApprovalService — not fully traced).
  - [Low] ilike operators throughout (pg-only; sqlite tests would fail if these paths were covered there).
- Depends on: AUD-API-ATT (integration), AUD-API-ORG.
- Added in Continuation Pass:
  - [Medium] Task redo loses its feedback signal: `TaskController::redo` calls `ApprovalService::reject` (TaskController.php:525) which sets `decision='rejected'`, while `ProjectController::review` correctly calls `ApprovalService::redo` (ProjectController.php:265, decision='redo'). `TaskController::submitted()` maps only `decision === 'redo'` to `redo_required` + feedback (TaskController.php:583-590) — after a task redo, the submissions list shows a bare `pending_approval` state with no redo feedback.
  - [Medium] No cancel/withdraw endpoint or UI for pending leave requests (no DELETE route in api.php; leave-history-table.tsx has no cancel action) — an employee who mis-files dates must ask HR to reject; balance stays reserved until then. (Cross-listed in AUD-MISSING-FEATURES.)
  - [Low] `checkRoleGating` requires capability `leave.approve-hr` for super_admin-routed approvals (ApprovalService.php:52) — the key exists only in the seeder, not in CapabilityMatrix's fallback matrix, and super_admin deciders bypass via `$role === 'super_admin'` anyway; near-dead capability string (cf. historical phantom `admin.view-reports`).
  - [Low] Leave balance debits calendar days on approve (ApprovalService.php:102-106) including non-working days, while the attendance integration marks only working days (LeaveAttendanceIntegration.php) — balance burns weekends/holidays; no corresponding credit on reject-before-approve (only reject-after-approve decrements, ApprovalService.php:155-163).

## [AUD-API-PROJECTS] Projects
- Files: apps/api/app/Http/Controllers/ProjectController.php:12-318
- Summary: CRUD (manage-gated at route), member/creator visibility for non-managers, auto-created project conversation on store (ProjectController.php:90-96), member submission with QA validation → `review` status + Approval workflow, review approve/redo/reject transitions, cover upload to S3, computed aggregates on show (task counts, time hours).
- Findings:
  - [Low] `index` per_page not whitelisted (ProjectController.php:50-51) — per_page=100000 possible (other controllers whitelist `in:20,50,100`).
  - [Low] `history()` unpaginated `->get()` over TaskActivity (ProjectController.php:138-140).
  - [Low] `submit()` lets any project member submit the whole project (by design per comment) — the creator's intent; fine.
  - [Info] update/destroy/review have no in-controller checks but rely on route `capability:projects.manage` — consistent for this controller since every mutation route is inside that group.
- Depends on: AUD-API-TASKS, AUD-API-QA, AUD-API-CHAT.

## [AUD-API-TASKS] Tasks
- Files: apps/api/app/Http/Controllers/TaskController.php:48-598, app/Services/TaskService.php, app/Services/RecurrenceService.php, TaskReminderController.php
- Summary: Visibility for non-managers = assignee/reporter/assignees/project-member (index :76-87, show :232-243). Creation policy: employees only personal tasks or projects with `allow_employee_tasks`; self-assign only (TaskController.php:157-171). Field-level policy: plain assignees may only edit status/progress/due/description (ASSIGNEE_EDITABLE_FIELDS :59, :260-265); reporters keep assignee set. submitForReview with QA required-fields validation → approval flow; comments participant-gated; reorder reporter/assignee-gated; destroy reporter/manager; global-chat notifications; recurrence on completion; deep cache invalidation for all admins' dashboards.
- Findings:
  - [Critical] `approve()` (TaskController.php:463-507) and `redo()` (:509-555) perform NO authorization beyond route level — and their route group is `capability:tasks.view|tasks.manage|tasks.create-own` (api.php:209-220). Any employee (tasks.view) can POST `/tasks/{id}/approve` and approve ANY pending task (marks done), or redo it. Manager check exists as `userHasManage()` but is not called here.
  - [Medium] Assignees can set `status: 'done'` directly via update (ASSIGNEE_EDITABLE_FIELDS includes 'status', TaskController.php:259-261), bypassing the submit-for-review QA gate even when `qa_form_id` is set — review flow is voluntary for assignees.
  - [Medium] `update()` passes `assignees` array through to `$task->update($validated)` (TaskController.php:334) — relies on `$fillable` excluding 'assignees' to be harmless (Task.php:17 fillable excludes it; brittle coupling).
  - [Low] `submitted()` unpaginated `->get()` (TaskController.php:572).
  - [Low] `approve()` sends no notification to the assignee (cache busts only; contrast store/update which notify).
  - [Low] `submitForReview` QA validation checks required-ness only — no value-type validation against field definitions (see AUD-API-QA).
- Depends on: AUD-API-QA, AUD-API-CHAT (project-conversation notifications), AUD-WEB-TASKS.

## [AUD-API-QA] QA forms
- Files: apps/api/app/Http/Controllers/QaController.php:16-107, apps/api/database/migrations/2026_08_18_213052_update_qa_forms_for_redesign.php
- Summary: Form CRUD; update/destroy replace fields wholesale (delete + recreate). Migration narrows `qa_form_fields.field_type` to pg enum `['input','textarea','checkbox','slider','select']` (default 'input').
- Findings:
  - [High] Field-type vocabulary mismatch, still live: web builder emits `text, textarea, number, email, url, multiple_choice, dropdown, checkbox, linear_scale, slider, rating, file_upload, section` (qa-form-builder.tsx:122, 157, 211, 260, 298) — most are NOT in the pg enum → insert/update throws on Postgres → 500 on form save. Backend validates only `field_type => required|string` (QaController.php:24, 69), so the failure surfaces as an unhandled QueryException.
  - [High] Builder also edits `config.scale_min/scale_max`, `validation.allowed_file_types`, min/max length (qa-form-builder.tsx:220-318) — none accepted by QaController validation → silently dropped on save, never persisted, never rendered back.
  - [Medium] `destroy()` deletes fields then form regardless of referencing tasks/projects (`tasks.qa_form_id`, `projects.qa_form_id`) — FK behavior unverified; if no FK/nullOnDelete, dangling references (open question).
  - [Low] Renderer defends with `field.field_type ?? field.type` (qa-field-renderer.tsx:34) — legacy dual-key fallback indicating the schema was migrated mid-flight; new writes are `field_type` only.
- Depends on: AUD-API-TASKS, AUD-API-PROJECTS, AUD-WEB-TASKS.
- Open questions: What is the canonical field-type list (enum vs builder)? Should config/validation sub-objects become columns or JSON?

## [AUD-API-TIMER] Time tracking
- Files: apps/api/app/Http/Controllers/TimerController.php:13-86
- Summary: logTime (TaskTimeLog), index (self or hr.view-team-attendance/admin.view-all-attendance caps), active-task cache (12h TTL) + broadcast.
- Findings:
  - [Medium] `logTime` accepts any existing `task_id`/`project_id` with no ownership/participant check (TimerController.php:13-22) — any `timer.track` user can attach time logs to arbitrary tasks/projects (pollutes reports/productivity scores).
  - [Low] `setActive` cache TTL 43200s (12h) — active task sticks across a workday boundary if never cleared.
- Depends on: AUD-API-PROJECTS, AUD-API-REPORTS.

## [AUD-API-CHAT] Chat
- Files: apps/api/app/Http/Controllers/ChatController.php:15-351, routes/channels.php
- Summary: Conversations (global/group/direct/project) with membership checks (`checkAccess`), cursor-paginated messages (DESC + client reverse), send with S3 attachments + mentions + Pusher broadcast, markRead (chunked read-receipts), DM lookup/create, group create (chat.manage), message pin/unpin (chat.manage OR projects.manage), conversation pin, delete own message, clear-own-messages. Broadcast channels: user.{id}, presence-org, conversation.{id} (membership-checked), approvals.{role}.
- Findings:
  - [Medium] `searchUsers` matches name/department only (ChatController.php:30-43) — email/username/employee_id (all searchable in DirectoryController) return nothing; the historical "employee DM search dead" is improved but still narrower than directory search.
  - [Medium] `clearChat` deletes only the caller's own messages (ChatController.php:346-348) — UI label "clear chat" overpromises; other party's history intact.
  - [Low] `sendMessage` allows empty body with no attachment (`body` nullable, ChatController.php:97) — blank messages possible.
  - [Low] `deleteMessage` is a hard delete, invisible to the other party (no tombstone/broadcast; comment acknowledges).
  - [Low] DM creation has no recipient-status/chat.access check (inactive users can receive DMs).
  - [Low] `startDirectMessage` duplicate-DM lookup is O(2 whereHas) without composite index concerns at current scale — fine.
- Depends on: AUD-API-BG (Pusher events), AUD-WEB-CHAT.

## [AUD-API-COMMS] Announcements / quick notes / feedback / notifications
- Files: AnnouncementController.php:11-180, QuickNoteController.php, FeedbackController.php, NotificationController.php, app/Services/NotificationService.php
- Summary: Announcements cached list + CRUD (announcements.manage, in-controller re-check) + emoji reactions (toggle, polymorphic reactions table). Quick notes per-user CRUD with cache bust. Feedback store (public to authed). Notifications: list/unread-count/mark-read/unread/all; NotificationService.send persists + broadcasts + optional queued email by preference.
- Findings:
  - [Medium — added in Continuation Pass] `NotificationService::send` caches `settings:notifications:{type}.channels` for 1h (NotificationService.php:11-16) and nothing busts it — same staleness family as `settings:security`; notification-channel changes apply up to 1h late.
  - [Low — added] `Cache::forget("announcements_all")` called on announcement store/update/destroy (AnnouncementController.php:98, 133, 150) but `index()` never caches under that key — dead invalidation calls (list is uncached; harmless but misleading).
  - [Low — CORRECTED] Pass-1 open question resolved: `AnnouncementController::index` DOES scope properly — company-wide OR own-team for employees, HR additionally gets managed-departments' teams, super_admin sees all (AnnouncementController.php:19-36). No finding; noted as OK.
  - [Low] Reaction insert lacks updated_at in the payload (AnnouncementController.php:180) — nullable column assumption.
  - [Info] NotificationsBell + priority column exist; cleanup scheduled daily (`notifications:cleanup`).
- Depends on: AUD-API-BG, AUD-SYNC-REALTIME (notification double-broadcast, added).

## [AUD-API-REPORTS] Reports & exports
- Files: apps/api/app/Http/Controllers/ReportController.php:21-228, app/Jobs/GenerateReportJob.php (396 lines), app/Models/ExportJob.php
- Summary: `data` endpoint (tasks/projects/users/productivity with self-scoping for non-managers), async export → ExportJob → GenerateReportJob (csv/xlsx/pdf via chunked writes), exports history (own 20), download (owner-only, base64 `file_data` column), attendanceSummary/leaveSummary with 5-min cache keyed by role/user.
- Findings:
  - [Medium] `attendanceSummary` counts `status = 'leave'` (ReportController.php:179) but no code path ever writes 'leave' — the leave listener writes `on_leave` (LeaveAttendanceIntegration.php). `leave_days` is always 0 in the attendance summary.
  - [Medium] HR over-scoping: attendanceSummary/leaveSummary treat `hasManage` (reports.view) as see-all-users (ReportController.php:184-188, 218-222) — no HrScope, unlike every other HR view. Meanwhile exports under-scope (attendance/leave export filter to HR's own `department_id` only, GenerateReportJob.php:221-224, 255). Both directions inconsistent with HrScope.
  - [Medium] Export artifacts stored base64 in `export_jobs.file_data` DB column (ReportController.php:139-155; migration 2026_08_16_220731) — large exports bloat the jobs table, no retention/cleanup job for file_data observed (verify: notifications cleanup ≠ exports cleanup).
  - [Low] productivity score hardcodes 160h/month baseline (ReportController.php:85-86).
  - [Low] `export()` accepts `filters` free-form array persisted into job row (ReportController.php:98-101) — no validation of filter keys.
- Added in Continuation Pass (GenerateReportJob writer read):
  - [Low] PDF export buffers every row in memory before rendering (`$rows = array_merge($rows, $chunk)`, GenerateReportJob.php:60-64) — unlike xlsx/csv which stream via the writer; a large PDF export can OOM the worker.
  - [Low] `$disk = Storage::disk(...)` assigned but never used (GenerateReportJob.php:43) — file always goes to the `file_data` DB column, never to S3; dead code confirming the base64-in-DB design.
- Depends on: AUD-API-ATT, AUD-API-LEAVE, AUD-API-BG.
- Open questions: Retention policy for completed export rows/file_data?

## [AUD-API-SETTINGS] Settings / company / demo / ops endpoints
- Files: SettingsController.php:11-115, CompanyProfileController.php, DemoDataController.php:12-78, AdminPasswordResetController.php, WorkScheduleController.php, HolidayController.php, SavedViewController.php, PinController.php, AutoNumberingController.php, UserPreferenceController.php, DirectoryController.php
- Summary: Grouped settings (mail password masked at rest via Crypt, masked in list), bulk update, SMTP test, queue monitor (pending/failed counts, retry-all), company profile + logo, demo seed/purge as queued jobs with typed confirmation ("REMOVE DEMO DATA"), admin password-reset approve/reject flow, work schedules with default, holidays CRUD + cached list, saved views, pins, user preferences, directory.
- Findings:
  - [High] (cross-listed from AUD-API-AUTH) `settings:security` cache not busted on bulkUpdate — the single most impactful staleness bug: session TTL / max-device / password-expiry changes don't apply for up to 1h.
  - [Low] `jobs()` returns raw failed_jobs rows incl. exception stack text to settings.manage users (SettingsController.php:84-108) — may embed env details in exception messages.
  - [Low] `retryJobs` retries ALL failed jobs blindly (`queue:retry all`, SettingsController.php:110-114).
  - [Low] DirectoryController `show()` and `sendMessage()` (DirectoryController.php:85-110+) have no routes — dead code (chat startDirectMessage covers the need).
  - [Info] Demo purge path (queued job + typed confirmation + cache purge list in DemoPurgeCommand.php:97-118) addresses the historical "non-purgeable demo data" root cause.
- Depends on: AUD-API-AUTH, AUD-API-BG.

## [AUD-API-DASH] Dashboard aggregate
- Files: apps/api/app/Http/Controllers/DashboardController.php:15-415
- Summary: `/dashboard/init` composes metrics, preferences, pending approvals, announcements, quick notes behind layered per-user/role/date caches (60-300s); `$safeCall` closure invokes other controllers and swallows their failures to defaults (DashboardController.php:22-36).
- Findings:
  - [Medium] Controller-calls-controller (`app(AnnouncementController::class)->index($request)`) — hidden coupling; a refactored controller signature breaks init silently (safeCall swallows).
  - [Low] Cache key `dashboard_init_{uid}_{role}_{date}` invalidated by name in ~10 places across controllers — stringly-typed invalidation map, easy to miss one (see the long Cache::forget lists in TaskController/LeaveRequestController).
- Depends on: AUD-API-COMMS, AUD-API-LEAVE, AUD-API-TASKS, AUD-API-ATT.
- Added in Continuation Pass:
  - [Medium] Same never-written status bug as AUD-API-REPORTS: super_admin and HR metrics count `status = 'leave'` (DashboardController.php:226-231, 275-281) but the leave integration writes `on_leave` — the dashboard "On Leave today" tile is always 0 for both roles. One root cause, two surfaces (reports + dashboard).
  - [Medium] HR with NO managed departments sees the whole company: `$activeQuery` only applies the department scope `if (!empty($deptIds))` (DashboardController.php:268-271), so a scope-less HR's `active_employees`/`total_employees` counts are global — inverted guard (empty scope should yield 0, not ∞). Contrast the correct `whereRaw('1 = 0')` pattern used for `$deptUserIds` two lines above.
  - [Low] HR `pending_approvals` mixes scoped and unscoped counts: dept-scoped leave pending (DashboardController.php:284) + ALL projects in review + global `pending_tasks` (DashboardController.php:285, 317-318) — commented as intentional for projects, but the mixed semantics are invisible to the user.

## [AUD-API-BG] Queue, scheduler, events, listeners, observers
- Files: routes/console.php, app/Jobs/* (8 jobs), app/Listeners/* (4), app/Observers/* (2), app/Events/* (13), start-worker.sh, start.sh
- Summary: Scheduler: shift reminder / missed-clock-in / open-shift jobs every 5 min; weekly summary, sanctum prune, password expiry flag, holiday reminders, notification cleanup, task reminders (every minute); heartbeat log every minute. Queue=database; Cloud Run runs g4k-worker (queue:work + schedule:work loops in start-worker.sh) alongside g4k-api (Octane). Pusher broadcasting (Reverb removed); every broadcast wrapped in try/catch with warning logs.
- Findings:
  - [Medium] Hardcoded `timezone('Asia/Kolkata')` on every schedule entry while company timezone is configurable (CompanyProfile.timezone drives attendance) — scheduled jobs and attendance disagree for non-IST companies.
  - [Low] Heartbeat `Log::info` every minute ≈ 43k lines/day (console.php:31-34).
  - [Low] start.sh comment says worker/scheduler are "separate Cloud Run services (g4k-worker and g4k-scheduler)" (start.sh:17) but only g4k-worker exists in cloudbuild.yaml and it runs BOTH loops — comment drift.
  - [Low] LeaveAttendanceIntegration is a queued listener — leave approvals mark attendance asynchronously; failure visible only in failed_jobs.
- Depends on: AUD-API-DEPLOY, AUD-API-LEAVE, AUD-API-ATT.

## [AUD-API-DB] Schema, migrations, seeders, RLS
- Files: apps/api/database/migrations/* (80), database/seeders/* (7)
- Summary: Phased migrations (users/org → attendance → leave → projects/tasks → QA → chat → reports → settings → demo tagging → RLS). Demo hygiene: is_demo tags extended across tables (5 migrations), orphan cleanup + global chat cleanup migration. RLS migration enables row-level security on ALL public tables to block Supabase REST while Laravel's postgres role bypasses (2026_08_16_000001).
- Findings:
  - [Low] `2026_08_14_210758` down() restores a NARROWER check (no on_leave/holiday/pending) than up() sets — down-migration is lossy/wrong if ever run.
  - [Low] Status-value vocabulary drift across layers: attendance check constraint (present/absent/late/on_leave/holiday/pending), AttendanceService writes (present/absent/late/holiday), listener writes (on_leave), reports query ('leave') — four lists, no single source of truth.
  - [Low] Soft deletes added broadly (2026_08_11_204058) — restore paths exist only for users; other soft-deleted entities (projects? tasks?) have no restore endpoint (tasks use `delete()` — Task uses SoftDeletes? verify per model).
- Depends on: all backend categories.
- Open questions: Does `tasks` table use SoftDeletes, and if so is there any restore path? (TaskController::destroy returns 200 with no restore route for tasks.)

## [AUD-API-TESTS] Backend tests
- Files: apps/api/tests/Feature/* (22 files incl. Auth, Capabilities, RoleMatrix, Attendance, HrAttendanceWorkflow, Leave, Org, UserController, PasswordPolicy, QA walkthroughs, Phase43/44/45, OpenApiContract, DatabaseSchema, Smoke, Health, Performance dir), tests/Unit/ExampleTest.php
- Summary: Real feature-suite breadth; OpenAPI contract test present; CI executes on sqlite AND pgsql (matrix) — the historical "pg bugs invisible" gap is closed at the pipeline level.
- Findings:
  - [Medium] No test coverage observed for TaskController approve/redo authorization (the Critical gap above) — QA walkthrough tests exist but evidently don't assert employee-cannot-approve.
  - [Low] `ilike`-using code paths (leave/task search) cannot run on sqlite — those tests must be pg-only or skipped; matrix runs both, so coverage holes exist by construction for search paths on sqlite leg.
- Depends on: AUD-INFRA-CI.

## [AUD-API-DEPLOY] Deploy & config
- Files: cloudbuild.yaml, Dockerfile, apps/api/start.sh, apps/api/start-worker.sh, apps/api/config/* (filesystems default=s3, queue=database, broadcasting=pusher w/ null fallback), vercel.json
- Summary: Cloud Build: build/push image → run `migrate --force` + `migrate:status` as docker run against Supabase pg (password from secret) → deploy g4k-api (Cloud Run, update-env-vars preserving manual UI config) → deploy g4k-worker → smoke check. Web on Vercel. S3 via Supabase storage endpoint (AWS_ENDPOINT/AWS_URL public bucket).
- Findings:
  - [Medium] Supabase project ref, DB username, endpoints hardcoded in cloudbuild.yaml (lines 26, 64, 86) — infra identifiers in VCS; environment-portability and rotation friction.
  - [Low] `config:cache` intentionally skipped at runtime (documented in start.sh) — every request re-reads env; acceptable on Octane, noted.
  - [Low] Only `:latest` image tag is pushed/deployed — no versioned rollback tag.
- Depends on: AUD-INFRA-CI.

## [AUD-WEB-CORE] API client / auth store / capabilities / middleware
- Files: apps/web/src/lib/api-client.ts:20-228, src/lib/auth-store.ts, src/lib/capabilities.ts, src/middleware.ts
- Summary: apiFetch with auth header, single-flight refresh mutex on 401 (api-client.ts:104-155), offline queueing of mutations (pre-flight + network-error paths), bare-array wrapping, blob passthrough for file responses, 403 needs_onboarding/must_change_password state patches. Auth in zustand+persist (localStorage) mirrored to `g4k_token` + `g4k_capabilities` cookies for middleware; BroadcastChannel tab sync; setAuth preserves refreshToken when omitted (auth-store.ts:69 — the 403 patch path is safe).
- Findings:
  - [Medium] Access token lives in three client-accessible places: localStorage (persist), non-HttpOnly cookie `g4k_token` (auth-store.ts:56, api-client.ts:191), and memory — XSS exfiltration defeats the HttpOnly refresh-token design; cookies are needed for middleware SSR gating, so this is a known trade-off, but the localStorage copy is redundant with the cookie.
  - [Low] Offline replay stores original headers including stale Authorization; apiFetch only overrides if header absent — replay 401s then self-heals via refresh+retry (works, but burns a request per queued item after token rotation).
  - [Low] `unwrapOne` heuristic (`'id' in res.data`) misidentifies wrappers whose data lacks `id` (returns the wrapper) — edge-case only.
  - [Low] Middleware capability gate reads forgeable cookie (middleware.ts:49-60) — UX-only, API enforces; and `/dashboard/admin/*` routes are absent from the PROTECTED map (middleware.ts:4-13) while org/* ones are listed (their real pages are redirects — see AUD-WEB-DIR).
- Depends on: AUD-API-AUTH, AUD-WEB-OFFLINE.

## [AUD-WEB-SHELL] Shell, nav, realtime, auth guard
- Files: apps/web/src/app/dashboard/layout.tsx:44-516, src/hooks/use-reverb.ts, src/components/auth-guard.tsx, src/components/app-shell/*
- Summary: Hydration-gated shell; capability-filtered navGroups + mobile bottom nav; ErrorBoundary with pathname resetKeys; ReverbProvider = Pusher Echo with real socket-state tracking, visibility/online reconnect, ref-counted channel subscribe/leave (use-reverb.ts:122-141); AuthGuard enforces must_change_password → /change-password, !onboarded_at → /onboarding, multi-role → /role-select (auth-guard.tsx:73-81 — the historical dead-end is fixed); command palette, shortcuts, notifications bell, timer widget.
- Findings:
  - [Medium] Sidebar exposes no entry to: org user management, departments, designations, org leave, audit, admin attendance/reports, announcements, leave, notes (navGroups layout.tsx:44-60). These live under /dashboard/directory?tab=…, /dashboard/settings?tab=…, or are command-palette-only — admin surface is undiscoverable via primary nav.
  - [Low] Capabilities error state shows spinner for 3s then error (layout.tsx:117-124) — no retry countdown; fine.
  - [Low] `isPusherAvailable()` requires both KEY and CLUSTER env vars — silently degrades to polling if either is missing (use-reverb.ts:36-39); no build-time assert.
- Added in Continuation Pass (command-palette read):
  - [Low] Command palette covers org-attendance, reports, directory tabs, profile (command-palette.tsx:95-230) but has no entries for settings, audit (→settings?tab=audit), announcements, notes, org leave, or chat — the admin surfaces missing from the sidebar (see the Medium nav finding above) are only partially recoverable via ⌘K.
- Depends on: AUD-WEB-CORE, AUD-API-CHAT (broadcasting).

## [AUD-WEB-DASH] Dashboard page & widgets
- Files: apps/web/src/app/dashboard/page.tsx (287 lines), src/hooks/use-dashboard-init.ts, src/components/dashboard/* (6 widgets)
- Summary: Single `/dashboard/init` fetch (keepPreviousData), role from initData||active_role, role-specific widgets (admin today-attendance, HR team attendance, employee task progress/approval status, quick task).
- Findings:
  - [Low] `activeRole` fallback chain differs from backend's (page.tsx:51-52 uses `initData?.role || user?.active_role || 'employee'`) — display-only.
  - [Info] No issues beyond AUD-API-DASH staleness caveats (2-min init cache + invalidation lists).
- Depends on: AUD-API-DASH.

## [AUD-WEB-DIR] Directory & org management UI
- Files: apps/web/src/app/dashboard/directory/page.tsx (77 lines), src/components/directory/* (directory-list, directory-tab, departments-tab, designations-tab), redirects: org/page.tsx, org/users/page.tsx, audit/page.tsx
- Summary: Directory page = 4 tabs (Corporate Directory, Employee Management [gated canManageUsers], Departments, Designations). `/dashboard/org` and `/dashboard/org/users` redirect to `?tab=management`; `/dashboard/audit` redirects to `/dashboard/settings?tab=audit`.
- Findings:
  - [Medium] Because real content lives at `/dashboard/directory`, the middleware PROTECTED entries for `/dashboard/org/users` etc. are bypassable by URL (`/dashboard/directory?tab=management` is gated only by `directory.view`). Tab content itself is capability-hidden client-side and API-enforced — impact is UX-level, but the middleware map is now misleading.
  - [Low] Departments/Designations tabs visible to all users (no capability filter on tabs, directory/page.tsx) — matches open backend reads; consistent.
- Depends on: AUD-API-USERS, AUD-API-ORG, AUD-WEB-CORE.

## [AUD-WEB-ATT] Attendance UI
- Files: apps/web/src/app/dashboard/attendance/page.tsx (227), org/attendance/page.tsx, admin/attendance/page.tsx, src/components/attendance/* (time-clock-widget, attendance-history-calendar, hr-attendance-view, admin-attendance-calendar, today-summary-card, leave-tab)
- Summary: Personal time clock (offline-capable via offline-engine punches), history calendar with holiday/status coloring, HR today/analytics views, admin overview/calendar. Month-navigable calendar (no 30-day hard cap found).
- Findings:
  - [Low] `attendance-sync-failed` rollback event handled (offline-engine dispatches; widgets listen) — OK.
  - [Info] Calendar component tested (__tests__/components/attendance-history-calendar.test.tsx).
- Depends on: AUD-API-ATT, AUD-WEB-OFFLINE.

## [AUD-WEB-LEAVE] Leave UI
- Files: apps/web/src/app/dashboard/leave/page.tsx, org/leave/page.tsx, src/components/leave/* (5 components)
- Summary: Request form, history table, approval actions, holidays calendar + admin leave/holidays view.
- Findings:
  - [Info] Sampled only; no issues spotted at the level read. Balance display uses LeaveBalance allowed/used (verify frontend uses same working-day math as backend — open question).
- Depends on: AUD-API-LEAVE.

## [AUD-WEB-PROJ] Projects UI
- Files: apps/web/src/app/dashboard/projects/page.tsx (43), projects/[id]/page.tsx (827), src/components/projects/* (7 + 1 .bak)
- Summary: Projects grid (project-card), detail page = tabs (overview/tasks/QA/submissions/history) with task board, QA form viewer/renderer, create dialog.
- Findings:
  - [Medium] `tasks-tab.tsx.bak` committed in components/projects/ — junk file in tree.
  - [Low] 827-line single page component — refactor candidate (page mixes 5 concerns).
  - [Info] Sampled (grep-level) — full read not performed; data unwrap usage consistent with unwrapList/unwrapOne helpers.
- Depends on: AUD-API-PROJECTS, AUD-API-TASKS, AUD-API-QA.
- Added in Continuation Pass (full data-flow read):
  - [High] Ungated `/users` fetch for ALL project viewers (projects/[id]/page.tsx:98-100): `/users` index requires `users.hr.manage|users.employee.manage` (api.php:319-327), so any plain employee (projects.view) opening a project detail page triggers a guaranteed 403 — member-name resolution and member pickers silently render blanks (usersData optional-chained). Same fetch in tasks-tab.tsx:110 is correctly gated `enabled: canManageTasks` and in task-detail-sheet.tsx:111 `enabled: isEditing && canManage` — this page missed the pattern. Should use `/directory` or `/chat/users` for read-only name resolution.
  - [Low] Delete/archive/submit/review mutations all present and invalidate correctly — project lifecycle workflow is complete; QA submission flow mirrors task flow.

## [AUD-WEB-TASKS] Tasks UI
- Files: apps/web/src/app/dashboard/tasks/page.tsx, tasks/[id]/page.tsx, src/components/tasks/* (task-detail-sheet 1141, task-kanban-board, task-gantt, qa-form-builder 809, qa-form-preview, task-card)
- Summary: My Tasks board (list/kanban/gantt), task detail sheet (comments, activity, time logs, QA submission, submit-for-review), full Google-Forms-style QA builder.
- Findings:
  - [High] (cross-listed) QA builder emits field types and config/validation props the backend rejects/drops — see AUD-API-QA. Frontend and enum must converge.
  - [Low] task-gantt readonly fix and invalidation-map typing fixes present (recent commits) — healthy.
  - [Low] task-detail-sheet at 1141 lines — refactor candidate.
- Depends on: AUD-API-TASKS, AUD-API-QA.

## [AUD-WEB-CHAT] Chat UI
- Files: apps/web/src/components/chat/* (chat-tab 706, message-list 423 virtualized, message-composer, conversation-list, notifications-tab, create-group-dialog)
- Summary: Cursor-paginated conversations + messages; messages fetched DESC then `flatMap(...).reverse()` for ASC render (chat-tab.tsx:353) — the historical inversion bug is fixed; optimistic send with rollback (chat-tab.tsx:415-416); Pusher listeners with polling fallback driven by `isConnected`.
- Findings:
  - [Low] Optimistic update assumes append-to-newest-page; with DESC page ordering the mutation must prepend to `pages[0]` — spot-checked as handled (optimistic path sets pages array); flag for regression watch.
  - [Low] Unread-count query invalidation on Pusher events observed — OK.
- Depends on: AUD-API-CHAT, AUD-WEB-SHELL (ReverbProvider).

## [AUD-WEB-COMMS] Announcements / notes / notifications UI
- Files: apps/web/src/app/dashboard/{announcements,notes,notifications}/page.tsx (thin), corresponding components
- Summary: Thin wrappers around tab components.
- Findings:
  - [Info] No issues at wrapper level; components sampled only.
- Depends on: AUD-API-COMMS.

## [AUD-WEB-REPORTS] Reports UI
- Files: apps/web/src/app/dashboard/reports/page.tsx, admin/reports/page.tsx, src/components/reports/* (report-builder, export-history, saved-report-views, admin-reports-view), src/hooks/use-export.ts
- Summary: Report builder with key switch, export trigger via useExport handling BOTH immediate Blob download and queued job_id paths (use-export.ts:30-60 — the historical async-export blob mismatch is fixed), export history list.
- Findings:
  - [Low] Export download for queued jobs goes through `/reports/exports/{id}/download` (owner-scoped) — OK.
  - [Info] PDF format accepted by API validation; GenerateReportJob pdf writer path not verified (open question).
- Depends on: AUD-API-REPORTS.
- Added in Continuation Pass:
  - [Medium] Saved Views RBAC mismatch: `saved-report-views.tsx` ships on the reports page for `reports.view` users, but the `/saved-views` routes are gated `settings.manage` (api.php:236-240) — HR (no settings.manage in the default matrix) gets silent 403s; unwrap-to-[] hides the failure so the feature appears empty rather than forbidden. Views are per-user data (SavedViewController.php:14-16) so the admin-only gate looks wrong rather than intentional.
  - [Low] `!isAdmin` branch of reports/page.tsx (lines 14-32) is dead code — middleware already redirects employees off `/dashboard/reports` (middleware.ts:12), so the employee ReportBuilder render is unreachable.
  - [Low] ReportBuilder previews only the first paginated 25 rows (report-builder.tsx:33-54, backend paginate(25) at ReportController.php:40-79) with no pagination controls — preview silently truncates while the export job exports all rows.

## [AUD-WEB-SETTINGS] Settings & profile UI
- Files: apps/web/src/app/dashboard/settings/page.tsx, profile/page.tsx (68), profile/components/profile-general-tab.tsx, src/components/settings/settings-tabs.tsx
- Summary: Settings = tabbed admin (company, security, mail, work schedules, holidays, audit, demo data, jobs). Profile = general tab + avatar upload.
- Findings:
  - [Info] Sampled; audit tab and demo purge UI live under settings (matches redirects). No issues at level read.
- Depends on: AUD-API-SETTINGS, AUD-API-PROFILE.
- Added in Continuation Pass (settings-tabs fully read — 12 tabs, all capability-gated, all wired to real endpoints):
  - [Low] Timezone selector offers only 5 hard-coded zones (settings-tabs.tsx:193-200: Kolkata/UTC/New York/London/Singapore) — and the scheduler hard-codes Asia/Kolkata regardless (see AUD-API-BG), so the company timezone partially governs attendance math but not scheduled jobs.
  - [Low] Holidays tab reuses HolidayCalendar with full CRUD (POST/PUT/DELETE wired, holiday-calendar.tsx:61-81) — resolves the Pass-1 "Holidays tab shows only calendar" uncertainty; no finding.

## [AUD-WEB-OFFLINE] Offline engine & timer store
- Files: apps/web/src/lib/offline-engine.ts:100-259, src/stores/timer-store.ts (229, persisted)
- Summary: IndexedDB queue for punches (idempotent client_id `evt_<ts>_<rand>`, one-punch-per-type-per-day dedupe) and generic mutations; syncAll on regain; 4xx marks failed + rollback event; timer store syncs from dashboard init.
- Findings:
  - [Low] Replay of generic requests replays stale Authorization header (self-heals via 401 refresh — see AUD-WEB-CORE).
  - [Low] Punch replay maps type via `replace('_','-')` (offline-engine.ts:190) — correct for current 4 event types; brittle naming contract.
  - [Info] No service worker observed — offline is IndexedDB + manual replay, not PWA offline shell (by design).
- Depends on: AUD-API-ATT.

## [AUD-WEB-TESTS] Web tests & tooling config
- Files: apps/web/src/__tests__/* (8 files), vitest.config.mts, eslint.config.mjs, tsconfig.json, package.json scripts (lint/typecheck/test/test:bundle)
- Summary: Vitest jsdom suite (auth, directory, layout-utils, performance, timer-store, calendar + time-clock widgets), bundle-size budget script wired into build, all scripts wired into CI. The historical "vitest broken / lint not in CI" state is remediated.
- Findings:
  - [Medium] 8 test files for 98 components + 36 routes — coverage concentrated on attendance/auth/directory; chat, tasks, projects, reports, settings have no component tests.
  - [Low] `tsconfig.tsbuildinfo`, `lint_output.txt`, `web_lint.json` committed in apps/web — build artifacts in tree.
- Depends on: AUD-INFRA-CI.

## [AUD-UI-PKG] packages/ui
- Files: packages/ui/src/* (~40 components, theme, hooks, api client from openapi-ts), openapi.yaml, tsup.config.ts
- Summary: Shared design system (shadcn-style) + generated API types; built with tsup, consumed via @g4k/ui alias.
- Findings:
  - [Info] Inventory-level audit only (per token budget); ErrorBoundary/data-table/confirm-dialog primitives used across web. No issues known; internals unaudited — listed under Not Covered.
- Added in Continuation Pass (full 50-component inventory + adoption measured):
  - [Low] Dead exports: `inline-edit.tsx`, `filter-bar.tsx`, `empty-state.tsx`, `draft-banner.tsx` have ZERO consumers in apps/web (combobox: 1, calendar: 0 — see AUD-UI-DUPLICATE); they ship in the package but are never used.
  - [Info] Generated API client (`src/api/{client,sdk,types}.gen.ts`) from the openapi spec exists and builds — but apps/web fetches via hand-written `apiFetch` strings throughout; the typed SDK is effectively unused by the app (adoption spot-check: no `sdk.gen` imports in apps/web/src).
- Depends on: AUD-INFRA-CI (openapi lint).

## [AUD-INFRA-CI] CI
- Files: .github/workflows/ci.yml (94 lines)
- Summary: Three jobs: openapi lint (redocly), web (pnpm lint+typecheck+vitest+build+bundle-budget+pnpm audit), api (composer install+audit, migrate, artisan test) on sqlite+pgsql matrix with postgres:16 service.
- Findings:
  - [Low] api job has no PHP lint/static analysis step (no pint/psalm/phpstan) — style/type drift unguarded on backend.
  - [Low] No backend deploy from CI (Cloud Build triggered separately) — deploy pipeline not gated on green CI unless Cloud Build is API-triggered on push (unverified wiring).
- Depends on: AUD-API-TESTS, AUD-WEB-TESTS.

## [AUD-ROOT] Repository hygiene
- Files: repo root
- Summary: Working tree clean; but root carries significant debris.
- Findings:
  - [Medium] ~35 debug/scratch files at root committed or tracked: `test.php`, `test2-12.php` (11 files), `test.html`, `find_tr.py`, `fix_import.py`, `patch*.py` (16 codemod scripts), `patch_projects_tab.py` (27 bytes), `lint.md` (326KB), `lint_output.txt` — violate the project's own scratch/ convention (scratch/ is gitignored).
  - [Low] `README.md` is byte-identical duplicate of `Games4Kings_Workplace_OS_Documentation.md` (84KB, same md5).
  - [Low] `apps/api` root contains `check_missing.php`, `debug_announcement.php`, `test.php` debug scripts.
  - [Low] `polish.md` exists but is 0 bytes (2026-08-19 23:30) — root-cause doc emptied, contents presumably merged into finalization.md/workflow.md (per docs convention only workflow.md+report.md+finalization.md remain authoritative).
  - [Low] `data/{datasets,lists,stocks}`, `projects/`, `.jetro/` directories — purpose unclear, not referenced by app code (open question: needed?).
- Added in Continuation Pass:
  - [Low] `apps/web/src/lib/tabs-sync.ts` is an EMPTY file (1 line) — dead module; multi-tab sync actually happens via auth-store's BroadcastChannel only.
  - [Low] openapi.yaml exists in TWO copies — `apps/api/openapi/openapi.yaml` and `packages/ui/openapi.yaml` (109 paths each, currently identical) — the ui package generates its typed SDK from its own copy; drift between them is undetected (CI lints only the apps/api one).
  - [Info] `data/`, `projects/`, `.jetro/` confirmed unreferenced by app code — `.jetro/` is local BI-tool state (DuckDB cache, connectors, credentials dir); classify as dev-tooling artifacts that should be gitignored, not product surface.
- Depends on: none.

---

## [AUD-WORKFLOW-LIFE] User lifecycle workflow (added in Continuation Pass)
- Files: apps/api/app/Http/Controllers/UserController.php:128-162, app/Mail/ (4 mails), apps/web/src/components/users/user-form.tsx, apps/web/src/app/(auth)/* (6 pages)
- Summary: End-to-end trace of admin-creates-user → user-can-login → first login (forced password change → onboarding → role-select) → sessions/revoke. Auth-side flows (forgot/reset, change-password, onboarding combine step, role-select incl. no-role and single-role auto-select dead-ends) are complete and well handled.
- Findings:
  - [High] Created users receive NO credentials: `store()` generates `Hash::make(Str::random(16))` — a password nobody knows — and sends no email (zero Mail calls in UserController.php:128-162; no welcome/credentials mailable exists in app/Mail). The user cannot ever log in until an admin separately runs "reset password" (which itself requires SMTP configured, UserController.php:364-366). Two-step implicit workflow where one is expected; if SMTP is unset, account creation is a hard dead end. The UI does not surface this follow-up requirement (verify user-form.tsx copy at implementation time).
  - [Info] Password-reset flow complete: forgot (in-app admin approval request + optional email token), 60-min token expiry, revoke-all-tokens on reset, admin approve/reject path for SMTP-less installs (AdminPasswordResetController). Positive note.
  - [Info] Suspicious-login → notify all hr/super_admin + optional email; login-attempt audit rows — complete.
- Depends on: AUD-API-USERS, AUD-API-AUTH, AUD-API-SETTINGS (SMTP).
- Open questions: Should `store()` auto-send a temp-password email (reusing the resetPassword plumbing) or surface "send credentials" as an explicit second action?

## [AUD-RBAC-WEB] Cross-cutting RBAC consistency (added in Continuation Pass)
- Files: apps/web/src/app/dashboard/projects/[id]/page.tsx:98-100, components/tasks/tasks-tab.tsx:110, components/tasks/task-detail-sheet.tsx:111, components/reports/saved-report-views.tsx, app/dashboard/profile/components/profile-general-tab.tsx:41, src/middleware.ts:4-13
- Summary: Role logic exists in five places (middleware cookie map, per-component hasCapability gates, query `enabled:` flags, route middleware, in-controller checks) with no shared pattern for "fetch a capability-gated resource from a mixed-role page".
- Findings:
  - [Medium] The gated-fetch pattern is applied inconsistently: tasks-tab (`enabled: canManageTasks`) and task-detail-sheet (`enabled: isEditing && canManage`) do it right; projects/[id] page fetches `/users` unconditionally (see High under AUD-WEB-PROJ) and employees absorb silent 403s. Rule of thumb absent: read-only name resolution should use ungated endpoints (/directory, /chat/users, /departments), gated endpoints only behind `enabled:`.
  - [Medium] UI-gates-what-API-doesn't (designation): profile UI requires `users.hr.manage || designations.manage` to edit designation (profile-general-tab.tsx:41) but the API accepts it from any profile.edit user — the Phase-1 AUD-API-PROFILE High is confirmed as deliberate UI-level-only enforcement, i.e. inconsistent by design accident.
  - [Low] super_admin excluded from `attendance.clock-self` (CapabilityMatrix.php:13-15) is reflected in nav (attendance nav item capability-gated) — consistent; noting as OK.
  - [Low] admin/* pages (`/dashboard/admin/attendance`, `/dashboard/admin/reports`) absent from middleware PROTECTED map while org/* siblings are listed (middleware.ts:4-13) — they're super_admin-only by API capability, so impact is nil; map should either include them or drop the org/* redirect entries (their pages are redirects anyway, see AUD-WEB-DIR).
- Depends on: AUD-API-CAPS, AUD-WEB-PROJ, AUD-WEB-REPORTS, AUD-API-PROFILE.

## [AUD-SYNC-REALTIME] Sync & data consistency (added in Continuation Pass)
- Files: apps/api/app/Services/NotificationService.php:27-44, app/Observers/NotificationObserver.php:12-17, apps/web/src/lib/invalidation-map.ts, components/chat/notifications-tab.tsx:74-89, components/app-shell/notifications-bell.tsx:19-43, stores/timer-store.ts
- Summary: Pusher realtime with polling fallback when socket down; optimistic chat send with rollback; layered server caches with stringly-typed invalidation.
- Findings:
  - [Medium] Notification double-broadcast: `NotificationService::send` explicitly calls `broadcast(new NotificationCreated(...))->toOthers()` (NotificationService.php:41-44) AND the `NotificationObserver::created` fires `event(new NotificationCreated(...))` (NotificationObserver.php:12-17) — the event implements ShouldBroadcast, so every in-app notification broadcasts TWICE on `conversation/user/{id}`-style channels (observer path goes to everyone incl. the actor, explicit path to others). Duplicate toasts/increments for online clients.
  - [Medium] `lib/invalidation-map.ts` is dead infrastructure: zero imports anywhere in apps/web (grep: 0 usages) while 133 manual `queryClient.invalidateQueries` calls are spread across components — the centralization layer was built (with a reconcile-layout.test.ts) and never adopted; mutation→invalidation coverage is therefore ad-hoc and leak-prone (its own `leave.decision` entry even comments "Balance invalidation would go here when implemented").
  - [Low] timer-store has no cross-tab synchronization (no BroadcastChannel/storage listener, timer-store.ts) — two tabs show the same persisted timer independently; both can call setActive/clear without coordination (server cache is last-writer-wins; low impact, confusing UX).
  - [Info] Notifications bell + notifications-tab correctly switch `refetchInterval: isConnected ? false : 30_000` (notifications-bell.tsx:31-43, notifications-tab.tsx:89) — polling fallback pattern done right.
- Depends on: AUD-API-BG, AUD-API-COMMS, AUD-WEB-CHAT.

## [AUD-UI-DUPLICATE] Duplicate UI implementations (added in Continuation Pass)
- Files: components/attendance/{admin-attendance-calendar,attendance-history-calendar}.tsx, components/leave/holiday-calendar.tsx, packages/ui/src/components/{calendar,date-picker}.tsx, packages/ui/src/components/{alert-dialog,confirm-dialog}.tsx, components/tasks/task-card.tsx:25-32, components/projects/project-card.tsx:22-28, components/attendance/{hr,admin}-attendance-graph.tsx
- Summary: Systematic duplicate scan of repeated UI patterns.
- Findings:
  - [Medium] THREE hand-rolled month-grid calendars (each builds its own `grid-cols-7` layout — holiday-calendar.tsx, admin-attendance-calendar.tsx, attendance-history-calendar.tsx) while packages/ui ships an unused `calendar.tsx` primitive plus `date-picker.tsx` — four calendar implementations total; none of the three share the primitive.
  - [Low] Two confirmation-dialog patterns in simultaneous use: raw `AlertDialog` in departments-tab, holiday-calendar, directory-list, leave-approval-actions-cell, tasks-tab vs `ConfirmDialog` wrapper in 8+ other files.
  - [Low] `getPriorityStatus` switch duplicated in task-card.tsx:25-32 and project-card.tsx:22-28 (same mapping, independently maintained).
  - [Low] Probable near-duplicate pair: hr-attendance-graph.tsx vs admin-attendance-graph.tsx (same chart for two roles; not diffed line-by-line — verify at implementation time).
  - [Info] Tables are NOT duplicated — all lists use the shared `data-table.tsx` (zero hand-rolled `<table>` in web). Toasts uniformly sonner. Positive notes.
- Depends on: AUD-UI-PKG, AUD-WEB-ATT.

## [AUD-MISSING-FEATURES] Partially-built / absent features (added in Continuation Pass)
- Files: (per finding)
- Summary: Cross-cutting inventory of micro-features that are stubbed, absent, or present in one parallel area but not another.
- Findings:
  - [Medium] Leave balance is enforced server-side (LeaveRequestController.php:100-111) but never DISPLAYED anywhere — zero "balance" references in components/leave/*, and invalidation-map.ts:53 comments "Balance invalidation would go here when implemented". Employees request blind against a quota they can't see.
  - [Medium] Leave cancel/withdraw absent end-to-end (no DELETE/cancel route; no UI action) — cross-listed under AUD-API-LEAVE.
  - [Medium] Notification-channel settings UI configures only 3 types (`leave_request`, `attendance_reminder`, `weekly_summary` — notifications-config.tsx:102-117) while the backend sends many more types (`task_assigned`, `chat`, `security`, `warning`, `system` …) that can never get email enabled or be muted globally; user-level preference shapes are read (NotificationService.php:20-26) but no UI writes them.
  - [Medium] Department "Inactive" state has no mutation path — cross-listed under AUD-API-ORG.
  - [Low] Tasks/Projects have no export (reports/data supports tasks/projects/users/productivity keys for export, but the leave/attendance modules have dedicated export buttons in their own UIs while tasks/projects pages have none — the capability exists via Reports Hub only).
  - [Low] Task bulk-actions absent: kanban supports drag reorder but no multi-select bulk status/priority/delete (users module has bulk activate/deactivate; departments has none either — pick a consistent pattern).
- Depends on: AUD-API-LEAVE, AUD-API-COMMS, AUD-API-ORG, AUD-WEB-LEAVE.
- Open questions: Which notification types should be user-mutable vs admin-fixed?

## [AUD-UX-CONSISTENCY] Visual/UX consistency (added in Continuation Pass — static analysis only, no rendering)
- Files: components/tasks/task-kanban-board.tsx:45-48, components/tasks/task-card.tsx:68-70, components/chat/chat-tab.tsx:510-650, app/dashboard/layout.tsx:446-509
- Summary: Grep-level consistency review (color semantics, responsive patterns, density) — no screenshots per constraints.
- Findings:
  - [Info — positive] Color coding is purposeful and consistent in the task/project domain: kanban columns carry semantic dot colors (neutral/primary/amber/emerald, task-kanban-board.tsx:45-48), task priority uses a color bar (rose/amber/blue/neutral, task-card.tsx:68-70), StatusBadge semantic variants reused across cards. No flat/monochrome areas found in the core lists.
  - [Info — positive] Chat implements a correct mobile master-detail (`hidden md:flex` swap, chat-tab.tsx:510, 581, back button at :586) and the shell has a mobile bottom nav + Sheet menu — responsive patterns at md: breakpoint are consistent.
  - [Low] Attendance status colors are defined ad-hoc per component (attendance-history-calendar.tsx:111 maps holiday→blue-300) rather than one shared status→color token — verify admin-attendance-calendar uses the same mapping at implementation time (drift risk, not confirmed drift).
  - [Low] The employee branch of the reports page and the admin Reports Hub render different layouts for the same route family (reports/page.tsx) — dead-code branch (see AUD-WEB-REPORTS) rather than a live inconsistency.
  - [Low] Settings page constrains to `max-w-5xl` (settings/page.tsx:11) while all sibling admin pages (directory, reports, org attendance) use full-width PageContainer — one admin area visually narrower than its peers.
- Depends on: AUD-WEB-SHELL, AUD-UI-DUPLICATE.

## Not Covered / Needs Follow-up
Resolved in the Continuation Pass (2026-08-20) unless noted:
- ~~packages/ui internals~~ — full 50-component inventory + adoption measurement done (see AUD-UI-PKG, AUD-UI-DUPLICATE); line-by-line review of each primitive's internals NOT done (they are leaf UI components with wide CI/test coverage of consumers) — accepted depth.
- ~~openapi.yaml ↔ routes parity~~ — partial: 109 documented paths in TWO identical copies (drift risk noted under AUD-ROOT); a path-by-path diff against the 218 route registrations was not performed — the OpenApiContractTest + redocly lint in CI are the standing guard; accepted.
- ~~apps/web full reads~~ — settings-tabs (full), admin-reports-view + report-builder + saved-report-views (data-flow), leave components (cancel/balance lens), auth pages (6, workflow lens), profile components (RBAC lens), projects/[id] (full data-flow), task-detail-sheet (structure + gating) — done.
- ~~Backend internals~~ — ApprovalService (full), AuditLogger, SmtpSettings, SecurityHeaders, WrapBareArrays, both Observers, NotificationService (full), DashboardController metrics (full), AttendanceController overview/buildOverviewQuery (full; analytics/graph bodies read at authz level only — same query pattern as overview, accepted), DepartmentController (full), DesignationController (outline+authz), WorkScheduleController store/setDefault/destroy (full), HolidayController (Phase-1 level), GenerateReportJob handle/writers (full), Mail classes (queueing verified), Events (broadcast semantics verified) — done.

Genuinely out of scope (not product code):
- Live/runtime probing (Pusher cred validity, Supabase bucket publicness, deployed env vars, prod schema drift) — text-only audit per instructions; `migrate:status` output in Cloud Build is the operational check.
- docs/ (incl. archive), .cursor/, .agents/, .impeccable/, .windsurfrules, root markdown docs (workflow.md, finalization.md, report.md, implementation_plan.md, current-live-verify-audit.md, lint.md) — documentation/planning artifacts, not product surface.
- data/, projects/, .jetro/, supabase/config.toml — confirmed unreferenced by app code (dev-tooling artifacts; should be gitignored — see AUD-ROOT).
- node_modules, vendor, generated files (client.gen.ts et al.) — third-party/generated.

## Summary Stats
- Categories: 45 (39 from Pass 1 + 6 added in Continuation Pass: AUD-WORKFLOW-LIFE, AUD-RBAC-WEB, AUD-SYNC-REALTIME, AUD-UI-DUPLICATE, AUD-MISSING-FEATURES, AUD-UX-CONSISTENCY).
- Findings: **1 Critical** (task approve/redo authz), **10 High** (Pass-1 count minus 1 corrected downgrade, plus 2 new: user-creation-no-credentials, employee /users 403 on project detail), **~37 Medium**, **~67 Low**, plus Info notes. Continuation Pass contributed 2 High, ~12 Medium, ~22 Low, and 2 corrections.
- Corrections in Continuation Pass: (1) leave self-approval High downgraded — ApprovalService blocks it at the service layer; only the sole-super_admin exception remains (documented design); (2) announcement team-scoping verified correct (Pass-1 open question closed as OK).
- Highest-value fixes for Phase 2 (ordered, updated): 1) task approve/redo manager gate; 2) QA field-type vocabulary unification (enum + builder + config persistence); 3) send credentials on user creation (or explicit second action + UI copy); 4) settings cache-busting family (settings:security AND settings:notifications:{type}); 5) profile designation_id removal from self-update; 6) 'leave' vs 'on_leave' status unification (reports + dashboard, one root cause); 7) HR scope unification (reports, exports, user show/activity, scope-less-HR-sees-all) around HrScope; 8) user-update field-nulling; 9) ungated /users fetches on employee-visible pages → /directory; 10) task-redo → ApprovalService::redo; 11) notification double-broadcast; 12) root debris cleanup.
- Coverage confirmation: all Pass-1 "Not Covered" items resolved or explicitly re-classified as out-of-scope (see section above). Product surface fully categorized: backend (routes, auth, caps, middleware, all 34 controllers, all services, jobs/scheduler, schema, tests, deploy) and frontend (all 36 routes, all major components, stores, hooks, lib, ui package at inventory depth).
- Scope touched by audit (both passes): ~120 files read in full or part (≈10,000 lines backend + ≈7,000 lines frontend/core), all controllers read at least at authz level with 20+ in full, 80 migrations name-scanned with 8 read in full, all web routes + 98 components inventoried with ~35 read in full/part, packages/ui's 50 components inventoried with adoption measured, CI/deploy configs read in full. Zero product files modified — only this report changed.

## Continuation Pass — 2026-08-20: 6 new categories (AUD-WORKFLOW-LIFE, AUD-RBAC-WEB, AUD-SYNC-REALTIME, AUD-UI-DUPLICATE, AUD-MISSING-FEATURES, AUD-UX-CONSISTENCY), 36 new findings + 2 corrections across [workflows, RBAC, sync/data consistency, micro-features, non-functional UI, duplicate components, missing features, UX consistency]; all Pass-1 "Not Covered" items resolved or explicitly scoped out; 12 existing categories received additional findings; Index, category statuses, and stats updated in place (total categories corrected from 38→39 for Pass 1).
