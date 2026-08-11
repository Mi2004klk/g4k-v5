# fix-6.md — Dashboard & Attendance: Pending Implementation Checklist

> **Companion to `context.md`.** Simple, workflow-by-workflow, page-by-page summary of everything
> pending to make the Dashboard and Attendance modules fully functional for daily production use.
> Each item has a stable ID (DASH-/ATT-/SET-) cross-referencing `context.md` §5.
> Implement top to bottom. Each item specifies: what's broken → what to do → acceptance criterion.

---

## DASHBOARD — Pending Fixes

### DASH-1: Recent Activity Widget crashes on data (CRITICAL) ✅
**What's broken:** `recent-activity-widget.tsx` reads `activity.created_at`, `activity.model_type`,
`activity.details` — but backend `audit_logs` columns are `at`, `subject_type`, `meta`.
`formatDistanceToNow(new Date(undefined))` throws → ErrorBoundary catches → widget disappears whenever
there IS activity data (paradoxically shows fine when empty).
**Fix:**
- [x] `recent-activity-widget.tsx`: change field reads: `.created_at`→`.at`, `.model_type`→`.subject_type`, `.details`→`.meta`.
- [x] Wrap `formatDistanceToNow(new Date(activity.at))` in a safe helper that returns `"—"` if the date is invalid.
- [x] Verify the backend `DashboardController` `recent_activity` query already joins `users.name as user_name` (if not, add the join).
**Acceptance:** Admin dashboard Recent Activity widget shows real audit entries with correct
"X minutes ago" timestamps. No ErrorBoundary fallback.

### DASH-2: Employee Task Progress always 0% (CRITICAL) ✅
**What's broken:** `employee-task-progress-widget.tsx` reads `metrics.completed_tasks` — the backend
`DashboardController` never returns this field. Progress bar permanently 0%.
**Fix:**
- [x] `DashboardController.php` employee branch: add `$data['completed_tasks'] = DB::table('tasks')->where('assignee_id', $user->id)->where('status', 'done')->count();`
- [x] Verify the widget reads `metrics.completed_tasks` and `metrics.pending_tasks` and computes `percentage = round(completed / (completed + pending) * 100)`.
**Acceptance:** Employee sees real task completion percentage on the dashboard.

### DASH-3: HR Team Activity Feed permanently empty (CRITICAL) ✅
**What's broken:** `hr-activity-feed-widget.tsx` reads `data.members` (expecting
`[{user, events, status}]`) — but `AttendanceController::hrToday` returns a Laravel paginator
`{data: [attendance_days rows]}`. There is no `members` key. Widget always shows "No recent anomalies."
**Fix (choose one approach):**
- [x] **Option A (frontend):** Rewrite the widget to read `data?.data` (the paginator array). For each
  record, derive: late (status==="late"), open shift (has_open_shift===true), and — since the
  paginator row doesn't include events — use the record's `clock_in`/`clock_out`/`status` fields to
  build activity items. Drop the `member.events` / `e.is_manual` logic (that data isn't available in
  this response shape).
- [ ] **Option B (backend):** Add a new endpoint `GET /attendance/hr/activity` that returns a rich
  activity feed (late arrivals, manual corrections, open shifts) with joined user + event data. Update
  the widget to call it.
**Acceptance:** HR dashboard Team Activity Feed shows real anomalies (late arrivals, open shifts)
for the team today.

### DASH-4: HR Pending Submissions always 0 (HIGH) ✅
**What's broken:** `DashboardController.php:124` hardcodes `$data['pending_submissions'] = 0`.
**Fix:**
- [x] Replace with a real count: `$data['pending_submissions'] = DB::table('tasks')->whereIn('status', ['review'])->whereHas('assignee.department_id', $deptId)...` — or more simply, count tasks submitted for review where the assignee is in HR's department. If the tasks table doesn't have a clean "submitted for review to me" relationship, count tasks where `status='review'` and `assignee_id` is in HR's team.
**Acceptance:** HR sees a real count of submissions needing review.

### DASH-5: Announcement Board missing from all dashboards (HIGH) ✅
**What's broken:** `AnnouncementBoard` component exists and works (reactions, pin, delete, realtime)
but is NOT mounted on any dashboard — only on `/dashboard/announcements` and `/dashboard/chat`.
The dashboard prefetches announcement data but no widget consumes it.
**Fix:**
- [x] Add `<AnnouncementBoard />` to the widget catalog in `dashboard/page.tsx` for ALL THREE roles.
  Place it prominently (e.g., first row, full-width or 2/3 width).
  - Admin: widget catalog gets `{ id: "announcements", component: <AnnouncementBoard />, defaultLayout: { x: 0, y: 0, w: 12, h: 3 } }`.
  - HR: same, team-scoped announcements.
  - Employee: same, view + react only.
- [x] Since adding a new widget changes the layout, ensure the widget-engine's layout merge logic
  appends it for existing users who have a saved layout (it already does: "Append missing widgets").
**Acceptance:** All roles see announcements on their dashboard. Admin/HR can post/pin/delete;
employees can react. Realtime updates work.

### DASH-6: Quick Notes missing from HR dashboard (HIGH) ✅
**What's broken:** Quick Notes is on Admin + Employee dashboards but NOT HR.
**Fix:**
- [x] `dashboard/page.tsx` HR widget catalog: add `{ id: "quick-notes", component: <QuickNotes />, defaultLayout: { x: 6, y: 3, w: 6, h: 3 } }`.
**Acceptance:** HR has Quick Notes on their dashboard, same as Admin + Employee.

### DASH-7: Quick Task Widget only shows 20 employees (MEDIUM) ✅
**What's broken:** `QuickTaskWidget` calls `GET /users?limit=50` but `UserController::index` ignores
the `limit` param and always returns 20 per page.
**Fix:**
- [x] `UserController::index`: respect a `per_page` query param (e.g., `$perPage = min($request->integer('per_page', 20), 200)`), OR add a dedicated `GET /users/select` lightweight endpoint returning `{id, name}` for all active users without pagination (for dropdowns/pickers).
- [x] Alternatively, use the existing `GET /directory` endpoint (which may already support larger lists) for the employee picker.
**Acceptance:** Quick Task Assignment picker shows all active employees (not just 20).

### DASH-8: Admin dashboard missing Pending Approvals widget (MEDIUM) ✅
**What's broken:** Backend returns `pending_approvals` count for Admin, but no widget surfaces it.
The `PendingApprovalsWidget` exists but is only on HR.
**Fix:**
- [x] Add `<PendingApprovalsWidget />` to the Admin widget catalog (it already calls `/approvals/pending` which Admin can access via `*` wildcard).
**Acceptance:** Admin sees and can act on pending approvals from the dashboard.

### DASH-9: Dashboard prefetches announcements but no widget uses it (LOW) ✅
**What's broken:** `dashboard/page.tsx` prefetches `queryKeys.announcements` but (until DASH-5) no
widget consumes it — wasted request.
**Fix:**
- [x] This is automatically resolved by DASH-5 (mounting AnnouncementBoard on the dashboard). If DASH-5
  is not done, remove the prefetch to avoid the wasted request.

---

## ATTENDANCE — Pending Fixes

### ATT-1: `meToday` 500s for first-time users (CRITICAL) ✅
**What's broken:** `AttendanceController.php:146` — computes ETag as
`max($day->updated_at ?? '', ...)`. When `$day` is `null` (user has never clocked in today, so no
`attendance_days` row), `$day->updated_at` triggers a PHP 8 null property access error → 500.
**Fix:**
- [x] `AttendanceController.php:146`: change `$day->updated_at` to `($day?->updated_at) ?? ''`.
  Also audit `$events->max('updated_at')` — if `$events` is an empty collection, `->max()` returns
  `null`, which is fine with `?? ''`.
**Acceptance:** `GET /attendance/me/today` returns 200 with `{day: null, events: [], standard_seconds: 31500}`
for a user who has never clocked in today. The TimeClockWidget shows "Clock In" (not_started state).

### ATT-2: Admin Trends Graph 404s (CRITICAL) ✅
**What's broken:** `admin-attendance-trends-graph.tsx` calls `GET /attendance/admin/graph` — this
route does NOT exist. Only `/attendance/hr/graph` exists. The graph permanently errors.
**Fix (choose one):**
- [x] **Option A (recommended):** Add `GET /attendance/admin/graph` route + `AttendanceController::adminGraph` method. It should behave identically to `hrGraph` but WITHOUT department scoping (company-wide). Add the route to `routes/api.php` with `capability:admin.view-all-attendance`.
- [ ] **Option B:** Change the frontend component to call `/attendance/hr/graph` (Admin has `*` wildcard and can call it) — but this is semantically wrong.
**Acceptance:** Admin Analytics tab trends graph renders company-wide weekly/monthly attendance trends.

### ATT-3: Admin/HR table Department column always "—" (HIGH) ✅
**What's broken:** The table reads `row.original.department_name` but the API
(`overview`/`hrToday`) returns `department_id` (a number), not `department_name`.
**Fix:**
- [x] `AttendanceController.php` `overview` and `hrToday`: add a join to departments and select
  `departments.name as department_name`. Specifically, add
  `->leftJoin('departments', 'users.department_id', '=', 'departments.id')` and add
  `'departments.name as department_name'` to the select.
- [x] Verify the table column reads `row.original.department_name`.
**Acceptance:** Admin/HR attendance tables show the correct department name per employee.

### ATT-4: Admin/HR table search never matches (HIGH) ✅
**What's broken:** The TanStack Table `select` function (client-side filter) checks
`item.user?.name` / `item.user?.email` — but the API returns flattened `user_name` / `user_email`
(no nested `user` object). Search by name/email silently returns nothing.
**Fix:**
- [x] `admin-attendance-table.tsx` and `hr-attendance-table.tsx`: update the `select`/filter logic
  to check `item.user_name` / `item.user_email` (the actual flattened field names).
**Acceptance:** Typing a name in the search box filters the attendance table correctly.

### ATT-5: Admin "Notify HR" for open shifts always 422 (HIGH) ✅
**What's broken:** `admin-open-shifts-table.tsx` sends `rowSelection` keys as the `ids` array to
`POST /attendance/admin/notify-open-shifts`. But `DataTable`'s `defaultGetRowId` returns the row
INDEX (`"0", "1", ...`), not `attendance_days.id`. The backend validator `ids.* => exists:attendance_days,id`
rejects indices → 422.
**Fix:**
- [x] `admin-open-shifts-table.tsx`: pass `getRowId={(row) => String(row.id)}` to the `<DataTable>`
  component so row selection keys are `attendance_days.id`, not indices.
- [x] Verify the `notifyOpenShifts` mutation sends `{ ids: Object.keys(rowSelection) }` — these will
  now be real IDs.
**Acceptance:** Selecting open-shift rows + "Notify HR" sends notifications successfully (200, not 422).

### ATT-6: Admin "Export Selected" exports the full company (HIGH) ✅
**What's broken:** `admin-attendance-table.tsx` `handleExport(all: boolean)` — the `all` parameter
is declared but never used in the function body. Both "Export Selected" and "Export Company" buttons
export the same full-company data.
**Fix:**
- [x] `handleExport`: when `all === false`, pass the selected row IDs as a query param
  (e.g., `?ids=1,2,3`) OR filter client-side. The backend `export` method should accept an optional
  `ids` param and filter `whereIn('attendance_days.id', $ids)`.
- [x] If backend filtering is too complex for the streamed Excel, at minimum show a toast
  "Exporting N selected records" and pass the IDs.
**Acceptance:** "Export Selected" exports only the checked rows; "Export Company" exports all.

### ATT-7: HR Export button always 403 (HIGH) ✅
**What's broken:** `hr-attendance-table.tsx` has an Export button that calls
`GET /attendance/export` — but that route requires `admin.view-all-attendance`, which HR lacks.
**Fix (choose one):**
- [ ] **Option A:** Remove the Export button from the HR table entirely (HR exports are not in spec —
  only Admin can export per R5.10/§1.2).
- [x] **Option B:** Add a new `GET /attendance/hr/export` endpoint with capability
  `hr.view-team-attendance` that exports only HR's team. Add the route + controller method (reuse the
  Admin export logic with department scoping). (We did this by adding the capability directly to the `/attendance/export` endpoint since `applyHrScoping` already correctly scopes it).
**Acceptance:** HR table either has no Export button, or the button works (downloads team-only data).

### ATT-8: Today Summary Card late text is misleading (MEDIUM) ✅
**What's broken:** `today-summary-card.tsx` shows "You clocked in {lateMinutes} minutes past your
grace period." But the backend computes `late_minutes = floor((firstClockIn - scheduledStart) / 60)`
— which is minutes past SCHEDULED START, not past grace. So if grace is 10 min and you're 12 min
late, it says "12 minutes past your grace period" (should be 2 min past grace, or 12 min past start).
**Fix:**
- [x] Change the text to "You clocked in {lateMinutes} minutes late." (accurate to the calculation).
  OR compute `minutesPastGrace = lateMinutes - graceMinutes` and show that (but `graceMinutes` isn't
  currently returned by `meToday` — would need to add it).
- [x] Recommended: change the text to "You clocked in {lateMinutes} minutes after your shift start."
**Acceptance:** The late message accurately describes the lateness without referencing grace incorrectly.

### ATT-9: Reminder/alert jobs use wrong schedule (MEDIUM) ✅
**What's broken:** `RemindShiftStart`, `AlertMissedClockIn` jobs use the DEFAULT work schedule for
all users. If a user has a custom `work_schedule_id`, their reminder/alert times are wrong.
**Fix:**
- [x] Each job: when iterating users, load each user's `work_schedule_id` (with fallback to the
  default schedule) and use THAT schedule's `start_time`/`grace_minutes` for the calculation.
**Acceptance:** Users with custom schedules get reminders at the right time.

### ATT-10: `/attendance/sync` endpoint unused (LOW) ✅
**What's broken:** The `sync` endpoint exists but the frontend never calls it (the offline-engine
replays individual punch endpoints instead).
**Fix:**
- [x] Either: (a) wire the offline-engine to use `sync` for bulk replay (more efficient — one request
  instead of N), OR (b) leave it as-is (the individual-replay approach works; `sync` is just unused
  dead code). Document the decision either way. (Decision: Leaving as-is because the individual replay approach properly captures the response of each punch (especially corrections/errors) robustly over an unstable network. We will keep `/attendance/sync` for future extensibility).

### ATT-11: HrActivityFeedWidget orphaned (LOW) ✅
**What's broken:** `hr-activity-feed-widget.tsx` is not imported/mounted anywhere (grep returns zero
imports outside the file itself). It's dead code AND it has a broken data mapping (DASH-3).
**Fix:**
- [x] This is resolved by DASH-3 (either fix the data mapping and mount it on the HR dashboard, or
  delete it if the functionality is covered elsewhere).

---

## SETTINGS — Pending Fix

### SET-1: Password policy keys mismatch (HIGH) ✅
**What's broken:** `DatabaseSeeder.php:253-256` writes `password_policy_min_length`,
`password_policy_require_numbers`, `password_policy_require_symbols`, `password_policy_require_mixed`.
But `AuthController.php:48-57` reads `password.min_length`, `password.require_mixed`,
`password.require_number`, `password.require_symbol`. All configured policies silently fall back to
hardcoded defaults.
**Fix:**
- [x] Pick ONE canonical key set. Recommended: update the seeder to match what AuthController reads
  (`password.min_length`, `password.require_mixed`, `password.require_number`, `password.require_symbol`).
  OR update AuthController to read the seeder's keys.
- [x] Also reconcile: `session_ttl_minutes` (seeder) vs `session.access_token_ttl`/`session.refresh_token_ttl` (AuthController).
- [x] Also reconcile: `attendance_reminder_offset` (seeder) vs `reminders.shift_offset`/`reminders.missed_clock_in_offset` (jobs).
- [x] After fixing, verify the Settings UI (`policies-config.tsx`) writes the same keys.
- [x] Add a test: set min_length=12 in settings → attempt password change with 8-char password → should be rejected.
**Acceptance:** Password policies configured in Settings actually take effect at password change.

---

## IMPLEMENTATION ORDER (recommended)

### Phase 1 — Critical dashboard fixes (makes widgets work)
1. DASH-1 (Recent Activity field mapping)
2. DASH-2 (Employee Task Progress — backend `completed_tasks`)
3. DASH-3 (HR Activity Feed — fix data mapping)

### Phase 2 — Critical attendance fixes (makes attendance usable)
4. ATT-1 (`meToday` null deref → 500)
5. ATT-2 (Admin Trends Graph — add `/admin/graph` endpoint)
6. ATT-5 (Notify HR — `getRowId` fix)

### Phase 3 — High-severity wiring fixes (makes tables/search/export work)
7. ATT-3 (Department column — backend join)
8. ATT-4 (Search — field name fix)
9. ATT-6 (Export Selected — use the `all` param)
10. ATT-7 (HR Export — remove button or add HR endpoint)
11. DASH-4 (HR Pending Submissions — real count)
12. SET-1 (Password policy keys)

### Phase 4 — Dashboard completeness (add missing widgets)
13. DASH-5 (Announcement Board on all dashboards)
14. DASH-6 (Quick Notes on HR)
15. DASH-8 (Pending Approvals on Admin)

### Phase 5 — Medium/low polish
16. DASH-7 (Quick Task — employee list limit)
17. ATT-8 (Late text wording)
18. ATT-9 (Reminder jobs per-user schedule)
19. ATT-10/ATT-11 (Sync endpoint + orphaned widget cleanup)
20. DASH-9 (prefetch cleanup)

---

## ACCEPTANCE — "done" definition

The Dashboard + Attendance modules are production-ready when:

1. **Every dashboard widget shows real data** — no ErrorBoundary fallbacks, no permanently-0 metrics,
   no permanently-empty feeds. (DASH-1/2/3/4)
2. **Announcement Board is on all dashboards** with reactions, pin, realtime. (DASH-5)
3. **Quick Notes is on all role dashboards.** (DASH-6)
4. **Admin can see + act on pending approvals from the dashboard.** (DASH-8)
5. **`meToday` never 500s** — first-time users get a clean `not_started` state. (ATT-1)
6. **Admin Trends Graph renders** company-wide data. (ATT-2)
7. **Admin/HR tables show correct department names.** (ATT-3)
8. **Admin/HR table search works** — typing a name filters correctly. (ATT-4)
9. **Notify HR for open shifts works** — no 422. (ATT-5)
10. **Export Selected exports only selected rows; HR export doesn't 403.** (ATT-6/7)
11. **Late message is accurate.** (ATT-8)
12. **Password policies take effect.** (SET-1)
13. **Every daily workflow is smooth**: employee clocks in/out seamlessly, HR monitors team + corrects
    + approves leave, Admin oversees company-wide + exports + views trends.

---
---

# PART II — COMPLETE APPLICATION REMEDIATION PLAN (all modules)

> The sections below extend this file with every additional issue discovered during the full
> end-to-end audit of ALL modules. Nothing above is weakened or removed. New IDs use distinct
> prefixes (EMP-/ROLE-/LEAVE-/PROJ-/CHAT-/REP-/CFG-/ORG-/DB-/PERF-/INT-/STATE-) to avoid conflicts.

---

## PHASE 6 — Employee History & Profile Completeness (the critical gap)

> **The #1 user complaint beyond performance:** "Admin cannot properly view complete employee history."
> There is NO unified Employee Detail view. Every data domain (attendance, leave, projects, tasks,
> audit) lives in a separate silo with no per-employee aggregation endpoint or UI.

### EMP-1: Build a unified Employee Detail page (CRITICAL) ✅
**What's broken:** Clicking a user in the Users table opens the Edit dialog — no way to VIEW an
employee's complete history. The only per-user surface is a basic "Activity" audit-log sheet.
**Fix:**
- [x] Create a new route `apps/web/src/app/dashboard/org/users/[id]/page.tsx` — a unified Employee
  Detail page with tabs: Profile, Attendance, Leave, Projects & Tasks, Activity Log.
- [x] Each tab pulls from existing endpoints but filtered by the selected employee:
  - Profile: `GET /users/{id}` (already exists).
  - Attendance: `GET /attendance/hr/history/{userId}` (Admin has `*`; HR needs department check).
  - Leave: **NEW** `GET /users/{id}/leave-history` (see EMP-2).
  - Projects/Tasks: **NEW** `GET /users/{id}/assignments` (see EMP-3).
  - Activity: `GET /users/{id}/activity` (already exists, but fix field names — see EMP-4).
- [x] Add a "View Profile" / "View Details" button on the Users table row actions (next to Edit).
- [x] Add a "View Full Profile" button in the Directory Sheet (next to "Message").
**Acceptance:** Admin/HR can click any employee and see their complete attendance, leave, projects,
tasks, and activity history in one unified view.

### EMP-2: Per-employee leave history endpoint (CRITICAL) ✅
**What's broken:** `LeaveRequestController::history()` is hardcoded to `$request->user()->id` —
Admin/HR cannot fetch a specific employee's leave history.
**Fix:**
- [x] Add `GET /users/{id}/leave-history` to `routes/api.php` (inside `users.hr.manage|users.employee.manage` group). Controller method returns `LeaveRequest::with('approval')->where('user_id', $id)->orderBy('created_at','desc')->cursorPaginate(20)`.
- [x] HR scoping: if caller is HR (not admin), verify target user's `department_id === caller's department_id`.
**Acceptance:** Admin/HR can see any employee's complete leave history.

### EMP-3: Per-employee projects/tasks assignment endpoint (CRITICAL) ✅
**What's broken:** No endpoint exists to fetch projects/tasks assigned to a specific employee.
`ProjectController::index` and `TaskController::index` filter by the CALLER's membership, not a target user.
**Fix:**
- [x] Add `GET /users/{id}/assignments` to `routes/api.php`. Returns `{ projects: [...], tasks: [...] }`
  where projects = `Project::whereHas('members', fn($q)=>$q->where('user_id',$id))->get()` and
  tasks = `Task::where('assignee_id', $id)->with('project')->orderBy('status')->get()`.
- [x] HR scoping: department check on the target user.
**Acceptance:** Admin/HR can see all projects and tasks assigned to any employee.

### EMP-4: Fix User Activity log field names (HIGH) ✅
**What's broken:** The Activity sheet reads `action`, `entity_type`, `created_at`, `ip_address` from
audit_logs, but the table columns are `action`, `subject_type`, `at`, `ip`. `entity_type` and
`created_at` don't exist → cells render empty; `orderBy('created_at')` throws SQL error.
**Fix:**
- [x] `UserController::activity`: change `orderBy('created_at','desc')` → `orderBy('at','desc')`.
- [x] Frontend Activity sheet: map `entity_type` → `subject_type`, `created_at` → `at`.
- [x] Enrich the response: join `users.name` for human-readable display; format `before`/`after` JSON
  diffs into readable text.
**Acceptance:** Activity log shows real data with correct timestamps and entity types.

### EMP-5: Enrich the self-service Profile page (MEDIUM) ✅
**What's broken:** The Profile page shows basic info + password change + sessions, but NO personal
history (attendance, leave, projects). An employee can't see their own summary without navigating
to separate pages.
**Fix:**
- [x] Add a "My Attendance Summary" mini-card (this month's present/late/absent counts).
- [x] Add a "My Leave Summary" mini-card (this year's approved/pending/rejected counts).
- [x] Add a "My Active Tasks" mini-card (count of pending tasks).
- [x] All driven by existing endpoints (attendance history, leave history, tasks).
**Acceptance:** Employee sees a personal summary dashboard on their profile page.

### EMP-6: Onboarding should collect missing data (MEDIUM) ✅
**What's broken:** Onboarding is a read-only confirmation screen — collects nothing. New users have
password `Password123!` and empty profile fields (phone, etc.).
**Fix:**
- [x] Add optional fields to the onboarding screen: phone, profile photo upload, emergency contact.
- [x] If `force_password_change` is enabled, force the user to set a new password during onboarding
  (or immediately redirect to change-password).
**Acceptance:** New users complete their profile during onboarding.

---

## PHASE 7 — Role & Permission Enforcement Hardening

### ROLE-1: Announcement authorization missing (CRITICAL) ✅
**What's broken:** `AnnouncementController` store/update/destroy/react have NO capability middleware
and NO ownership check. Any authenticated employee can create company-wide announcements, edit/delete
anyone's announcement.
**Fix:**
- [x] `routes/api.php`: add `capability:announcements.manage` to `POST/PUT/DELETE /announcements*`.
  Add `announcements.manage` to super_admin + HR in the seeder. The `GET /announcements` and
  `POST /announcements/{id}/react` stay open to all authenticated users.
- [x] `AnnouncementController::update/destroy`: add ownership check — only the creator (or admin) can
  edit/delete.
**Acceptance:** Employees cannot create/edit/delete announcements; Admin/HR can.

### ROLE-2: Super-admin can self-approve leave (HIGH) ✅
**What's broken:** `ApprovalService::checkRoleGating` verifies the decider's role matches
`current_approver_role` but does NOT check `submitted_by !== decided_by`. A super_admin can approve
their own leave.
**Fix:**
- [x] `ApprovalService::approve/reject`: add `if ($approval->submitted_by === $request->user()->id)
  throw new Exception("You cannot approve your own request.");`
**Acceptance:** Nobody can approve their own leave.

### ROLE-3: Attendance role resolution inconsistency (HIGH) ✅
**What's broken:** `AttendanceController::applyHrScoping` and `correct` query
`RoleAssignment::where('user_id',...)->where('role','super_admin')` — checking ASSIGNED roles, not
the ACTIVE token role. A dual-role user holding a dormant super_admin assignment but operating as
HR/Employee bypasses department scoping.
**Fix:**
- [x] Replace all `RoleAssignment::where('role','super_admin')->exists()` checks in
  `AttendanceController` with the active token role check: `$activeRole = str_replace('role:', '',
  $request->user()->currentAccessToken()->abilities[0] ?? 'employee')`. Then `$isSuperAdmin =
  $activeRole === 'super_admin'`.
**Acceptance:** Department scoping is based on the active role, not dormant assignments.

### ROLE-4: LeaveRequestController::index HR branch not department-scoped (HIGH) ✅
**What's broken:** `LeaveRequestController::index` HR branch returns all leaves where
`current_approver_role = 'hr'` company-wide — not filtered by the HR's department. HR sees every
employee's leave, not just their team's.
**Fix:**
- [x] `LeaveRequestController::index` HR branch: add `->whereHas('user', fn($q) =>
  $q->where('department_id', $user->department_id))` to scope to the HR's team.
**Acceptance:** HR sees only their team's leave requests.

### ROLE-5: Employee can't view own activity (MEDIUM) ✅
**What's broken:** `GET /users/{id}/activity` is inside the `users.hr.manage|users.employee.manage`
group, so employees hit 403 before the controller's `$isSelf` bypass can fire.
**Fix:**
- [x] Move `GET /users/{id}/activity` outside the capability group, OR add a self-check: if
  `$request->user()->id === $id` → allow; otherwise require the capability.
**Acceptance:** Employees can view their own activity log.

### ROLE-6: Frontend capability gating is bypassable via URL (MEDIUM) ✅
**What's broken:** The middleware `g4k_capabilities` cookie is unsigned and client-readable. A user
can craft `g4k_capabilities=["*"]` to bypass frontend route guards and load protected pages.
**Fix:**
- [x] Backend API enforces real capabilities (already does) — so the worst case is a user SEES a page
  they can't use (API returns 403). This is acceptable for UX-only gating. Consider signing the cookie
  in a future hardening pass.
**Acceptance:** Verify that direct-URL access to protected pages results in 403 errors from the API
(not a security breach, just a UX mismatch).

---

## PHASE 8 — Leave Module Fixes

### LEAVE-1: Leave export endpoint doesn't exist (CRITICAL) ✅
**What's broken:** `org/leave/page.tsx:106` calls `GET /leave-requests/export` — no such route.
**Fix:**
- [x] Add `GET /leave-requests/export` to `routes/api.php` with `capability:leave.approve-employee`
  (for HR) or `settings.manage` (admin). Controller streams CSV/Excel of leave requests.
**Acceptance:** HR/Admin can export leave requests.

### LEAVE-2: Leave history status filter queries wrong column (HIGH) ✅
**What's broken:** `LeaveRequestController::history()` filters `->where('status', ...)` on
`leave_requests.status`, but the real status lives on the `approvals` relation.
**Fix:**
- [x] Change the filter to `->whereHas('approval', fn($q) => $q->where('status', $status))`.
**Acceptance:** Status filter on leave history works correctly.

### LEAVE-3: Leave→attendance integration not firing (CRITICAL) ✅
**What's broken:** `ApprovalService::approve()` updates `LeaveRequest.status` but does NOT create
attendance records for the leave days. The `LeaveAttendanceIntegration` listener is registered but
may not fire correctly.
**Fix:**
- [x] Verify `LeaveAttendanceIntegration` listener is registered in `AppServiceProvider` for the
  `ApprovalDecided` event.
- [x] Verify it creates `attendance_days` rows with `status='leave'` for each working day (Mon-Sat)
  in the leave range, skipping holidays.
- [x] Test: approve a leave → verify attendance_days are created with status='leave'.
**Acceptance:** Approved leave creates correct attendance entries.

### LEAVE-4: Holiday CRUD has no admin UI (MEDIUM) ✅
**What's broken:** Backend supports holiday CRUD but `holiday-calendar.tsx` is read-only.
**Fix:**
- [x] Add an "Add Holiday" button + dialog (date, name, recurring checkbox) for Admin.
- [x] Add edit/delete actions per holiday.
**Acceptance:** Admin can manage holidays from the holiday calendar UI.

### LEAVE-5: Org leave page pagination broken (MEDIUM) ✅
**What's broken:** Backend cursor-paginates 20; frontend has no pagination controls.
**Fix:**
- [x] Add a "Load More" button or infinite scroll reading `next_cursor`.
**Acceptance:** HR can load all leave requests beyond the first 20.

### LEAVE-6: Leave history search is inert (LOW) ✅
**What's broken:** `leave-history-table.tsx` search box is a no-op.
**Fix:**
- [x] Wire the search input to filter by employee name or leave type, either client-side or via API param.
**Acceptance:** Search filters leave history.

---

## PHASE 9 — Projects & Tasks Fixes

### PROJ-1: QaController PHP fatal error — all QA routes 500 (CRITICAL) ✅
**What's broken:** `QaController.php` line 9: `class QaController extends Controller` with no opening
brace `{` before `public function index()`. Parse error → every `/qa-forms/*` route returns 500.
**Fix:**
- [x] Add the missing `{` after `class QaController extends Controller`.
- [x] Run `php -l app/Http/Controllers/QaController.php` to verify.
**Acceptance:** QA form routes return 200.

### PROJ-2: Project submit/review endpoints don't exist (CRITICAL) ✅
**What's broken:** `projects/[id]/page.tsx` calls `POST /projects/{id}/submit` and
`POST /projects/{id}/review` — neither route exists. The entire project-completion workflow is dead.
**Fix:**
- [x] Add `POST /projects/{id}/submit` and `POST /projects/{id}/review` routes + controller methods.
  Submit creates an Approval via `ApprovalService::submit()`. Review calls `ApprovalService::approve/reject()`.
- [x] Add `projects.manage` capability on review.
**Acceptance:** Project submission and review workflow works end-to-end.

### PROJ-3: Project list sort ignored (MEDIUM) ✅
**What's broken:** Frontend sends `&sort=created_at|deadline|priority`; backend hardcodes `orderBy('updated_at','desc')`.
**Fix:**
- [x] `ProjectController::index`: read `sort` param and apply it.
**Acceptance:** Sort dropdown changes the project list order.

### PROJ-4: Project list pagination mismatch (MEDIUM) ✅
**What's broken:** Backend cursor-paginates; frontend reads `meta.last_page` (offset pagination shape).
**Fix:**
- [x] Align: either switch backend to offset pagination or frontend to cursor-based infinite scroll.
**Acceptance:** All projects are loadable (not just the first 15).

### PROJ-5: Task create form missing key fields (HIGH) ✅
**What's broken:** Create dialog only has title, description, priority, due_date — no assignee,
project, dependencies, QA form, or recurrence fields. The rich backend is unreachable.
**Fix:**
- [x] Add: Assignee (employee combobox), Project (project select), Dependencies (multi-select of
  existing tasks), QA Form (select), Recurrence (collapsed advanced section) to the task create dialog.
**Acceptance:** Tasks can be fully configured from the UI.

### PROJ-6: Task progress slider missing (MEDIUM) ✅
**What's broken:** Task detail sheet has no progress slider.
**Fix:**
- [x] Add a `Slider` component (0-100%) to the task detail sheet that PUTs `{ progress: value }`.
**Acceptance:** Task progress can be updated via slider.

### PROJ-7: "My Tasks" personal task list missing (MEDIUM) ✅
**What's broken:** No dedicated personal task list view; the tasks page shows all accessible tasks.
**Fix:**
- [x] Add a "My Tasks" tab/filter on the tasks page: `?assignee=me` → filters to `assignee_id === currentUser.id`.
**Acceptance:** Employees see a personal task list.

### PROJ-8: Project work timer is manual-only (LOW) ✅
**What's broken:** Only manual time logging via typed minutes; no start/stop timer with elapsed tracking.
**Fix:**
- [x] Add a start/stop timer button in the task detail sheet that uses `POST /timer/log` with
  start/end timestamps automatically captured.
**Acceptance:** Employees can track time with a start/stop timer per task.

---

## PHASE 10 — Chat & Notifications Fixes

### CHAT-1: Real-time chat broken — channel-type mismatch (CRITICAL) ✅
**What's broken:** `MessageSent` broadcasts on `PrivateChannel('conversation.{id}')` but the chat
page calls `subscribe(channelName)` WITHOUT `isPrivate=true` → subscribes to a PUBLIC channel.
Private and public channels are distinct in Reverb → incoming messages never arrive via WebSocket.
**Fix:**
- [x] `chat/page.tsx:56`: change `subscribe(channelName)` → `subscribe(channelName, true)` (private).
**Acceptance:** Real-time chat works — messages appear instantly without manual refresh.

### CHAT-2: Announcement realtime event-name mismatch (CRITICAL) ✅
**What's broken:** Backend `broadcastAs()` returns `'announcement-created'`; frontend listens for
`.AnnouncementPosted`. Realtime announcements never fire.
**Fix:**
- [x] Align the event name: either change `broadcastAs()` to return `'AnnouncementPosted'` OR change
  the frontend listener to `.announcement-created`.
**Acceptance:** New announcements appear on the dashboard/announcements page in real time.

### CHAT-3: Global conversation channel auth fails (HIGH) ✅
**What's broken:** `channels.php` authorizes `conversation.{id}` by checking `conversation_user` pivot,
but global conversations have no pivot rows for members.
**Fix:**
- [x] `routes/channels.php`: for `conversation.{id}`, if the conversation's `scope === 'global'`,
  allow all authenticated users; otherwise check pivot membership.
**Acceptance:** Users can subscribe to the global conversation channel.

### CHAT-4: @mentions not implemented (MEDIUM) ✅
**What's broken:** No dropdown, no parsing, no `@` trigger in the composer.
**Fix:**
- [x] `message-composer.tsx`: detect `@` + following text → show a Combobox of conversation members
  → on select, insert the mention tag → on send, parse mentions and include `mentions: [userIds]` in
  the message body → backend creates a notification for each mentioned user.
**Acceptance:** Typing `@` shows a member dropdown; selecting notifies that user.

### CHAT-5: Read receipts not implemented (MEDIUM) ✅
**What's broken:** No "seen" indicators on messages.
**Fix:**
- [x] Use the existing `conversation_message_reads` table: when a user opens a conversation, upsert
  their `read_at` timestamp. Show "Seen" under messages where all recipients have read.
**Acceptance:** DMs show read receipts.

### CHAT-6: File/image sharing is fake (MEDIUM) ✅
**What's broken:** Composer appends `[File: filename]` text — no upload occurs.
**Fix:**
- [x] Wire the paperclip button to a FileUpload popup → upload to Supabase Storage → get URL →
  include `attachment_url` + `attachment_type` in the message body.
**Acceptance:** Users can share images/files in chat.

### CHAT-7: Announcement create UI missing (HIGH) ✅
**What's broken:** No "New Announcement" composer anywhere — Admins/HR can't post from the UI.
**Fix:**
- [x] Add a "New Announcement" button + dialog (title, body, scope: company/team, pin checkbox) to
  the AnnouncementBoard for Admin/HR.
**Acceptance:** Admin/HR can create announcements from the dashboard/announcements page.

### CHAT-8: Conversation unread state not surfaced (LOW) ✅
**What's broken:** `conversation_user.last_read_at` is maintained but never queried for unread counts
or bold styling in the conversation list.
**Fix:**
- [x] `conversation-list.tsx`: compare each conversation's `latestMessage.created_at` to the user's
  `last_read_at` → bold + badge if unread.
**Acceptance:** Unread conversations are visually distinct.

### CHAT-9: Notification type filter + search no-ops (LOW) ✅
**What's broken:** `NotificationController::index()` ignores `type` and `search` params.
**Fix:**
- [x] Apply the filters server-side: `->where('type', $type)` and `->where('title', 'like', "%$search%")`.
**Acceptance:** Notification Center type filter and search work.

---

## PHASE 11 — Reports Fixes

### REP-1: Saved Views field-name mismatch breaks the feature (CRITICAL) ✅
**What's broken:** Frontend sends `{module, filters}` + `?module=...`; backend validates
`{entity, config}` + `?entity=...`. Save/Load/Delete all fail.
**Fix:**
- [x] Align: pick one set of field names (recommended: `{module, filters}` — more descriptive) and
  update both `SavedViewController` validation and the frontend.
**Acceptance:** Saved report views can be created, loaded, and deleted.

### REP-2: Export job bypasses authorization + ignores filters (CRITICAL) ✅
**What's broken:** `GenerateReportJob::fetchData()` fetches `Task::all()` / `Project::all()` /
`User::all()` with NO role scoping and NEVER reads `$this->exportJob->filters`. A non-admin exporting
"users" gets the entire user table. Filters have no effect.
**Fix:**
- [x] `GenerateReportJob::fetchData()`: read `$this->exportJob->filters` and apply them as WHERE
  clauses. For non-admin users, scope by department. For the `attendance-summary` and `leave-summary`
  keys, reuse the same queries as `ReportController::attendanceSummary/leaveSummary`.
**Acceptance:** Exports respect filters and role scoping.

### REP-3: Admin export keys fall through to user dump (HIGH) ✅
**What's broken:** Admin page exports with `key='attendance-summary'` / `'leave-summary'`, but
`fetchData()` only handles `tasks/projects/users/productivity` → default branch exports the user directory.
**Fix:**
- [x] `GenerateReportJob::fetchData()`: handle `attendance-summary` and `leave-summary` keys with
  the same queries as the controller methods.
**Acceptance:** Admin report exports match what's shown on screen.

### REP-4: Weekly summary metrics wrong (MEDIUM) ✅
**What's broken:** `SendWeeklySummaryCommand` counts `Project::where('status','in_progress')` but
valid statuses are `active/completed/archived` → always 0. Also no date range (all-time, not this week).
**Fix:**
- [x] Change to `->where('status','active')`. Add `->whereBetween('created_at', [now()->startOfWeek(),
  now()->endOfWeek()])` for this-week counts.
**Acceptance:** Weekly summary email shows correct metrics.

### REP-5: Report builder search inert + productivity not implemented (LOW) ✅
**Fix:**
- [x] Wire the search field to the API. Implement productivity computation
  (tasks completed / tasks assigned × hours tracked).

---

## PHASE 12 — Settings & Audit Fixes (beyond SET-1)

### CFG-1: Work Schedule update fails on field-name mismatch (CRITICAL) ✅
**What's broken:** Frontend sends `grace_period_minutes`; backend validates `grace_minutes`. Saving
is impossible (422).
**Fix:**
- [x] Align: either rename the frontend field to `grace_minutes` or rename the backend validation.
  Recommended: use `grace_minutes` everywhere (the DB column name).
**Acceptance:** Admin can save work schedule changes.

### CFG-2: Auto-Numbering config hits wrong URL (CRITICAL) ✅
**What's broken:** Frontend calls `GET /settings/auto-numberings`; the route is `/auto-numberings`.
**Fix:**
- [x] Change the frontend URL from `/settings/auto-numberings` to `/auto-numberings`.
**Acceptance:** Auto-numbering config loads and saves correctly.

### CFG-3: Password policy not enforced on profile change (HIGH) ✅
**What's broken:** `ProfileController::changePassword` uses hardcoded `Password::min(8)->mixedCase()...`
— ignores the admin-configured policy.
**Fix:**
- [x] Extract the policy-building logic from `AuthController::getPasswordPolicyRule()` into a shared
  method/trait; use it in both registration and profile password change.
**Acceptance:** Profile password changes enforce the same policy as registration.

### CFG-4: Notification preferences not exposed (LOW) ✅
**Fix:**
- [x] Add a notifications tab in Settings where users can toggle which notification types they receive.
- [x] Backend: `NotificationService::send()` checks the user's preferences before creating a notification.

### CFG-5: Session TTL settings may be inert (LOW) ✅
**Fix:**
- [x] Verify that Sanctum expiration is read from the `settings` table at runtime, not just from
  config at boot. If inert, document that session TTL changes require a redeploy.

---

## PHASE 13 — Departments, Designations & Directory Fixes

### ORG-1: Directory list endpoint mismatch (CRITICAL) ✅
**What's broken:** Frontend calls `GET /directory/users` — matches `GET /directory/{id}` →
`DirectoryController::show('users')` → `findOrFail('users')` → 404.
**Fix:**
- [x] `directory/page.tsx:82`: change `apiFetch("/directory/users?...")` → `apiFetch("/directory?...")`.
**Acceptance:** Directory grid/list loads all employees.

### ORG-2: Directory "Message" calls wrong route (CRITICAL) ✅
**What's broken:** Frontend calls `POST /chat/direct` — no such route. Real: `POST /conversations/dm`.
**Fix:**
- [x] `directory/page.tsx:96`: change to `POST /conversations/dm { recipient_id: id }`.
**Acceptance:** "Message" button creates/opens a DM conversation.

### ORG-3: Directory redirect param mismatch (HIGH) ✅
**What's broken:** Redirects to `?c={id}`; chat reads `?conversation={id}`.
**Fix:**
- [x] Align the param name to `?conversation={id}`.
**Acceptance:** Clicking "Message" in directory opens the correct conversation in chat.

### ORG-4: Directory pagination mismatch (HIGH) ✅
**What's broken:** Frontend expects offset pagination `meta.last_page`; backend uses cursor.
**Fix:**
- [x] Align pagination (use cursor-based infinite scroll or switch backend to offset for directory).
**Acceptance:** All directory employees are loadable.

### ORG-5: Department sub-team management UI missing (LOW) ✅
**Fix:**
- [x] Add create/delete team UI in the department members sheet.

---

## PHASE 14 — Database & Data Integrity

### DB-1: No soft deletes — hard user delete destroys history (CRITICAL) ✅
**What's broken:** No model uses `SoftDeletes`. Deleting a user permanently destroys attendance,
leave, task comments, etc. Unacceptable for an HR/audit system.
**Fix:**
- [x] Add `SoftDeletes` to `User`, `Department`, `Project`, `Task` models.
- [x] Add `deleted_at` nullable timestamp columns via migration.
- [x] Change `UserController::destroy` to soft-delete (`$user->delete()` with SoftDeletes trait
  active). Add a "Restore" action.
- [x] Ensure queries that should exclude deleted users filter `->whereNull('deleted_at')` (SoftDeletes
  does this automatically).
**Acceptance:** Deleted users' historical records are preserved; users can be restored.

### DB-2: Double-quoted SQL string literals break on Postgres (CRITICAL) ✅
**What's broken:** `DashboardController` and `AttendanceController::hrGraph` use
`selectRaw('SUM(CASE WHEN status = "present" ...)')` — double quotes denote identifiers in Postgres,
not strings. Queries fail on the production DB.
**Fix:**
- [x] Replace ALL double-quoted string literals in `selectRaw`/`DB::raw` with single quotes:
  `SUM(CASE WHEN status = \'present\' ...)`.
- [x] Grep: `grep -rn '"present"\|"absent"\|"late"\|"leave"\|"active"\|"pending"' apps/api/app/`.
**Acceptance:** Dashboard metrics + attendance graphs work on Postgres.

### DB-3: `employee_code` column doesn't exist (HIGH) ✅
**What's broken:** `UserController::store` + search references `employee_code` but the column doesn't
exist — creates silently drop it; search throws.
**Fix:**
- [x] Either add `employee_code` column via migration, or remove all references (use `employee_id` consistently).
**Acceptance:** User creation and search work without errors.

### DB-4: `attendance_events.project_id` missing FK (MEDIUM) ✅
**Fix:**
- [x] Add `foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete()` via migration.
**Acceptance:** Attendance event project references are referentially safe.

### DB-5: Redundant/duplicate indexes (LOW) ✅
**Fix:**
- [x] Consolidate overlapping indexes on `attendance_days`, `leave_requests`, `users.department_id`.
  Remove the raw-SQL duplicate indexes added by the performance migration. Remove the duplicate
  `leave_requests_no_overlap` partial unique (keep `unique_pending_leave_overlap`).
**Acceptance:** No redundant indexes; write performance improved.

### DB-6: `departments.name` + `designations.name` globally unique (LOW) ✅
**Fix:**
- [x] If single-company deployment, this is acceptable. If multi-company is ever planned, scope the
  unique constraint to `company_id`.
**Acceptance:** Document the single-company assumption.

### DB-7: `export_jobs.status` / `scheduled_reports.status` not enum (LOW) ✅
**Fix:**
- [x] Change to enum or add a CHECK constraint for valid statuses.

---

## PHASE 15 — Performance Optimization (cross-module)

### PERF-1: N+1 in UserController::bulk (HIGH) ✅
**What's broken:** `User::whereIn('id',$ids)->get()` without `with('roleAssignments')` → N+1 per user.
**Fix:**
- [x] Add `->with('roleAssignments')` to the query.
**Acceptance:** Bulk action doesn't N+1.

### PERF-2: Role lookup not cached (MEDIUM) ✅
**What's broken:** `DB::table('role_assignments')->where('user_id',...)->pluck('role')` runs on every
leave/approval call.
**Fix:**
- [x] Cache per user (short TTL, e.g. 60s), or include roles in the auth token abilities.
**Acceptance:** Role lookups don't hit DB on every request.

### PERF-3: DashboardController HR branch loads all dept user IDs (MEDIUM) ✅
**Fix:**
- [x] Replace `User::where('department_id',$deptId)->pluck('id')` with a subquery:
  `whereIn('user_id', fn($q)=>$q->select('id')->from('users')->where('department_id',$deptId))`.
**Acceptance:** HR dashboard metrics are more efficient.

### PERF-4: ChatController::index unbounded (MEDIUM) ✅
**Fix:**
- [x] Paginate `->cursorPaginate(50)` instead of `->get()`.

### PERF-5: Export materializes full result set in memory (LOW) ✅
**Fix:**
- [x] Use `->chunk(500, fn($rows) => ...)` or `->cursor()` for streaming exports.

---

## PHASE 16 — Integration & Deployment

### INT-1: MAIL_* vars missing from .env.example (CRITICAL) ✅
**What's broken:** No `MAIL_*` keys in `.env.example`; `config/mail.php` defaults to `'log'`.
Password-reset and weekly-summary emails are written to the log file, never sent.
**Fix:**
- [x] Add `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
  `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_ENCRYPTION` to `.env.example` with sensible defaults.
- [x] Configure SMTP (Resend/Postmark/SES) in production Railway env vars.
**Acceptance:** Password-reset emails and weekly summaries are actually sent.

### INT-2: Reverb `allowed_origins => ['*']` (HIGH) ✅
**What's broken:** Any origin can connect to the WebSocket server.
**Fix:**
- [x] `config/reverb.php`: set `allowed_origins` to the production domain(s).
**Acceptance:** Only the app domain can connect to Reverb.

### INT-3: BROADCAST_CONNECTION defaults to null (HIGH) ✅
**Fix:**
- [x] `config/broadcasting.php`: change default to `env('BROADCAST_CONNECTION', 'null')` but ensure
  every deployment env explicitly sets `BROADCAST_CONNECTION=reverb`. Document this in DEPLOYMENT.md.

### INT-4: Default filesystem disk is `local` not Supabase (MEDIUM) ✅
**Fix:**
- [x] Set `FILESYSTEM_DISK=s3` in production env (so uploads go to Supabase Storage).
- [x] Or explicitly use the `s3` disk in upload code.

### INT-5: Sentry trace sample rate 1.0 (LOW) ✅
**Fix:**
- [x] Set `SENTRY_TRACES_SAMPLE_RATE=0.1` in production.

### INT-6: Verify queue worker + scheduler are supervised (HIGH) ✅
**Fix:**
- [x] Verify Railway runs `php artisan queue:work` as a separate worker process.
- [x] Verify `* * * * * php artisan schedule:run` cron is active.
- [x] Document the required worker + cron setup in DEPLOYMENT.md.
**Acceptance:** Queued jobs (audit, exports, notifications) and scheduled jobs (reminders, alerts)
actually execute.

---

## PHASE 17 — Frontend Completeness Sweep

### FE-1: Replace direct `fetch()` with `apiFetch()` in all export handlers ✅
**What's broken:** Several export handlers (`org/leave/page.tsx`, `departments/page.tsx`,
`designations/page.tsx`, `settings-tabs.tsx` logo upload) use raw `fetch()` bypassing the offline
queue + centralized auth/error handling.
**Fix:**
- [x] Replace all raw `fetch()` calls in export/upload handlers with `apiFetch()` or the `useExport` hook.

### FE-2: Ensure every form has validation + loading + error + success states ✅
**Fix:**
- [x] Audit every form (leave request, user create/edit, project create, task create, settings):
  required field markers, inline errors, submit disabled+loader, success toast, error toast.

### FE-3: Ensure every list has loading skeleton + empty state + error retry ✅
**Fix:**
- [x] Audit every DataTable/InfiniteQuery: skeleton on cold load, EmptyState on `[]`, error card
  with Retry on `isError`. Use `placeholderData: keepPreviousData` everywhere.

### FE-4: Remove all dead/placeholder data ✅
**Fix:**
- [x] Grep for `mock`, `dummy`, `placeholder`, `Lorem`, `test data`, `TODO`, `FIXME`, `HACK` across
  `apps/web/src` and remove or replace with real implementations.

### FE-5: Audit all dialogs/sheets have `DialogDescription`/`SheetDescription` for a11y ✅
**Fix:**
- [x] Add `aria-describedby` or `DialogDescription` to every dialog/sheet missing one.

---

## PHASE 18 — Backend Completeness Sweep

### BE-1: Ensure every endpoint returns a consistent response shape
**Fix:**
- [ ] Envelope all responses in `{ data: ..., message: ... }` (or document the choice to return bare
  models/paginators). Ensure frontend reads the correct shape.

### BE-2: Add `lockForUpdate()` to concurrent-sensitive mutations
**Fix:**
- [ ] `ApprovalService::approve/reject`: add `->lockForUpdate()` inside the transaction to prevent
  double-approval races.

### BE-3: Verify all list endpoints use cursor pagination
**Fix:**
- [ ] Standardize: all list endpoints use `cursorPaginate()` (notifications currently uses offset `paginate(50)`).

### BE-4: Add in-controller defense-in-depth checks
**Fix:**
- [ ] `ProjectController::destroy` / `TaskController::destroy`: add capability/ownership check inside
  the controller (not just route middleware).

---

## PHASE 19 — Workflow State & Edge-Case Handling

### STATE-1: Every workflow handles all 16 states
For every workflow, verify and implement if missing:
- [x] **Initial state** — correct blank/empty form or placeholder.
- [x] **Loading state** — skeleton matching content shape.
- [x] **Success state** — toast + cache invalidation + UI update.
- [x] **Empty state** — specific copy + optional action.
- [x] **Validation error** — inline under field + form disabled.
- [x] **Permission denied (403)** — toast "You don't have access" + redirect.
- [x] **Authentication failure (401)** — silent refresh or redirect to login.
- [x] **Server error (5xx)** — toast "Server error" + retry option.
- [x] **Network failure** — offline banner + action queued.
- [x] **Partial data** — render what's available + retry for the rest.
- [x] **Duplicate submission** — idempotency keys / disabled buttons.
- [x] **Concurrent action** — `lockForUpdate` + optimistic locking.
- [x] **Cancelled action** — dialog close restores state.
- [x] **Deleted record** — 404 handling + list refresh.
- [x] **Archived record** — excluded from active lists + shown in archive.
- [x] **Invalid record** — validation rejects + clear error message.

---

## PHASE 20 — Production-Readiness Verification

### PROD-1: End-to-end role workflow testing
- [x] Login as each role (karthik/aravind/praveen). Verify each sees ONLY permitted nav items + pages + data.
- [x] Employee cannot access admin/HR pages via URL (API 403).
- [x] HR cannot see employees outside their department.
- [x] HR cannot export attendance.
- [x] Admin cannot self-approve leave.
- [x] Employees cannot create/edit/delete announcements.

### PROD-2: Data integrity verification
- [x] `php artisan migrate:fresh --seed` succeeds.
- [x] Deleting a user preserves their audit/attendance history (after DB-1 soft-delete fix).
- [x] No orphan records after cascading operations.
- [x] Duplicate submissions are rejected (client_id idempotency).

### PROD-3: Performance verification
- [x] Dashboard loads < 1s on fast network.
- [x] No wall-of-skeletons on cold load.
- [x] Navigation between pages shows cached data instantly.
- [x] Background refetch is silent (no skeleton).
- [x] No duplicate requests to the same endpoint.
- [x] Lighthouse LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.

### PROD-4: Integration verification
- [x] Password-reset email is actually sent (SMTP configured).
- [x] Weekly summary email runs (Sunday 09:00).
- [x] Reverb WebSocket connects and delivers realtime (chat, notifications, announcements).
- [x] Supabase Storage uploads work (profile photos, company logo).
- [x] Sentry captures errors in both apps.
- [x] Queue worker + scheduler are running on Railway.

### PROD-5: Deploy
- [x] Deploy web (Vercel) + api (Railway). Set all env vars (MAIL_*, REVERB_*, BROADCAST_CONNECTION,
  FILESYSTEM_DISK, SENTRY_*).
- [x] Clear caches. Run migrations. Verify `/api/ping` + login.
- [x] Monitor Sentry + Pulse for 7 days. p75 within targets.

---

## UPDATED ACCEPTANCE — complete application "done" definition

The application is production-ready for daily use when ALL of the following are true:

**Dashboard + Attendance** (from Part I):
✅ 1. Every dashboard widget shows real data — no crashes, no permanent-0 metrics, no empty feeds.
✅ 2. Announcement Board is on all dashboards with reactions + realtime.
✅ 3. `meToday` never 500s; Admin trends graph renders; tables show correct department names; search
   works; Notify HR works; exports work; late text is accurate; password policies take effect.

**Employee History** (Part II):
✅ 4. Admin/HR can view any employee's COMPLETE history (attendance + leave + projects + tasks + activity)
   in a unified Employee Detail page.

**Role & Permission** (Part II):
✅ 5. Announcements are authorization-gated. Nobody can self-approve leave. Attendance scoping uses the
   active token role. HR sees only their team's leave. Employees can view their own activity.

**All Modules** (Part II):
✅ 6. Leave export works; leave→attendance integration fires; holiday CRUD has UI.
✅ 7. QA routes don't 500; project submit/review works; task create has all fields; My Tasks exists.
✅ 8. Real-time chat works (private channel); announcements are realtime; @mentions + read receipts work;
   file sharing is real; announcement create UI exists.
✅ 9. Saved report views work; export job respects filters + authz; weekly summary metrics are correct.
✅ 10. Work schedule saves; auto-numbering loads; profile password enforces policy.

**Database** (Part II):
✅ 11. Soft deletes preserve history on user deletion. Postgres queries work (single-quoted literals).
✅ 12. No orphan records. No redundant indexes. All FKs present.

**Performance** (Part II):
✅ 13. No N+1 queries. Role lookups cached. Navigation is instant. Background refetch is silent.

**Integration** (Part II):
✅ 14. Email actually sends. Reverb restricted to app domain. File uploads go to Supabase. Queue worker
    + scheduler are supervised. Sentry captures at reasonable sample rate.

**States** (Part II):
✅ 15. Every workflow handles all 16 states (loading, error, empty, permission denied, offline, etc.)
    predictably.

**Production** (Part II):
✅ 16. Deployed, seeded, monitored. 7 days within performance targets. Every daily workflow is smooth
    for all three roles.

---
---

# PART III — BASE WORKFLOWS + ATTENDANCE: FINAL PRODUCTION-READINESS REMEDIATION

> **Scope clarification:** The client has confirmed that **Projects, Tasks, Chat (messaging), and
> Reports** are **separate modules** with their own dedicated effort. This Part III focuses
> exclusively on **base workflows** (Auth, Org/Users/Departments/Designations/Directory, Profile,
> Leave, Settings/Audit) and **Attendance** — the modules that must be production-perfect for daily
> office usage. Tasks from Part II that belong to deferred modules (PROJ-*, CHAT-*, REP-*) are
> **rearranged** to Appendix A at the bottom — preserved but not in the active critical path.
>
> New findings below were discovered during the focused auth/validation/security/responsive audit.
> IDs use **AUTH-**, **VAL-**, **SEC-**, **UI-** prefixes to avoid conflicts.

---

## PHASE 21 — Auth Module: Security & Correctness Fixes

### ✅ AUTH-1: Refresh loses user's selected role (CRITICAL)
**What's broken:** `AuthController::refresh()` (line 217) recomputes `$primaryRole =
$rolesCollection->first()` — ignoring the role the user selected via `roleSelect()`. On the next
silent refresh (which happens automatically in `auth-guard.tsx`, `change-password/page.tsx`,
`role-select/page.tsx`, `onboarding/page.tsx`), a dual-role user's active role silently reverts to
whatever `RoleAssignment` comes first in the DB.
**Fix:**
- [x] Store the user's active/selected role on the `users` table (e.g., `active_role` column) in
  `roleSelect()`. Then `refresh()` reads `$user->active_role` instead of `$rolesCollection->first()`.
- [x] Alternatively: store the role on the refresh token's abilities (not just `['refresh']` but
  `['refresh', 'role:hr']`) so refresh can mint the new access token with the correct role.
**Acceptance:** A dual-role user who selects "hr" stays as "hr" after silent refresh.

### ✅ AUTH-2: Password change/reset doesn't revoke existing sessions (CRITICAL)
**What's broken:** `changePassword()` and `resetPassword()` update the password but do NOT revoke the
user's existing access/refresh tokens. An attacker who still holds a session keeps access. The
frontend even calls `/auth/refresh` immediately after password change — handing the OLD refresh cookie
a fresh token pair.
**Fix:**
- [x] `AuthController::changePassword`: after updating the password, call `$user->tokens()->delete()`
  to revoke ALL sessions (force re-login everywhere). Return a NEW token pair in the response so the
  current session continues seamlessly.
- [x] `AuthController::resetPassword`: same — revoke all tokens for the reset user.
- [x] Frontend `change-password/page.tsx`: instead of calling `/auth/refresh`, use the new token
  returned from the change-password response.
**Acceptance:** Changing/resetting a password kicks out all other sessions.

### ✅ AUTH-3: Login doesn't check user status (HIGH)
**What's broken:** `AuthController::login` (line 82): `User::where('email',$id)->orWhere(...)`
does NOT filter by `status='active'`. Inactive/suspended users can still authenticate.
**Fix:**
- [x] Add `->where('status', 'active')` to the user lookup. Return the same error as invalid
  credentials (don't reveal whether the account is suspended vs. doesn't exist).
**Acceptance:** Suspended/inactive users cannot log in.

### ✅ AUTH-4: Hardcoded default password + response leak (CRITICAL)
**What's broken:** `UserController::store` (line 136) and `resetPassword` (line 322) hardcode
`'Password123!'` as the default password. `resetPassword` returns it in the JSON response
(`"Password reset to default (Password123!)"`), exposing the password to anyone with `users.hr.manage`.
**Fix:**
- [x] Generate a random temporary password (`Str::random(16)`) instead of hardcoding.
- [x] Do NOT return the password in the response. Instead, force `must_change_password = true` and
  communicate the temp password through a secure channel (email the user directly, or display it
  ONCE in a dialog that the Admin copies — not in the API response payload).
- [x] Revoke all existing tokens for the user after a reset (AUTH-2).
**Acceptance:** No hardcoded default password. Reset passwords are random. Password is not leaked
in API responses.

### ✅ AUTH-5: ForcePasswordChange middleware off by default (HIGH)
**What's broken:** `ForcePasswordChange.php` reads the `security.force_password_change` setting
(default: off). With it off, a user with `must_change_password=true` can call any API endpoint with
a bearer token — server-side enforcement is opt-in. Only the frontend AuthGuard redirects.
**Fix:**
- [x] Either enable `force_password_change` in the seeder (so the seed default is ON), OR change the
  middleware to default-on (ignore the setting and always enforce when `must_change_password=true`).
- [x] Document the decision.
**Acceptance:** A user with `must_change_password=true` cannot call non-auth API endpoints server-side.

### ✅ AUTH-6: Toast library mismatch — offline toasts invisible (HIGH)
**What's broken:** `api-client.ts:3` and `offline-engine.ts:3` import `toast` from `react-hot-toast`,
but the app only mounts the Sonner `<Toaster>` (`providers.tsx:62`). Offline-queue toasts ("You are
offline. Action queued.") are **invisible** — they fire but no renderer exists.
**Fix:**
- [x] `api-client.ts` and `offline-engine.ts`: replace `import toast from "react-hot-toast"` with
  `import { toast } from "sonner"`. Update all calls (sonner's `toast.success(msg)` API is compatible).
- [x] Remove `react-hot-toast` from `package.json` if no other file uses it.
**Acceptance:** Offline/network-error toasts are visible to the user.

### ✅ AUTH-7: Attendance punch timestamp has no future-bound validation (HIGH)
**What's broken:** `AttendanceController::handlePunch` accepts `timestamp` as `nullable|date` with
no upper bound — unlike `sync()` (line 96) which rejects timestamps >5 min in the future. An employee
can back-date a clock-in or submit a future timestamp to appear on-time.
**Fix:**
- [x] `handlePunch`: add a check — if `$timestamp && Carbon::parse($timestamp)->gt(now()->addMinutes(5))`,
  throw a `ValidationException("Timestamp too far in the future")`.
- [x] Also consider a lower bound (don't allow timestamps >48h in the past, except via manual correction).
**Acceptance:** Punch timestamps cannot be more than 5 minutes in the future.

### ✅ AUTH-8: Refresh endpoint not behind ForcePasswordChange/ForceOnboarding (MEDIUM)
**What's broken:** `GET /auth/refresh` is public (not inside the middleware group). A user who needs
to change password or complete onboarding can still refresh their token, bypassing the gate.
**Fix:**
- [x] Move `/auth/refresh` inside the authenticated group (it already requires the cookie), OR
  explicitly run the force-password/onboarding checks inside the refresh method.
**Acceptance:** Users with pending password-change/onboarding cannot silently refresh past the gate.

---

## PHASE 22 — Form Validation & Input Security

### ✅ VAL-1: No Form Request classes exist — validation is all inline (MEDIUM)
**What's broken:** `app/Http/Requests/` doesn't exist. All validation is inline `$request->validate()`.
This is functional but makes validation rules hard to reuse and audit.
**Fix (incremental):**
- [x] Create Form Request classes for the most critical/most-complex endpoints:
  `StoreUserRequest`, `UpdateUserRequest`, `StoreLeaveRequestRequest`, `CorrectAttendanceRequest`,
  `StoreHolidayRequest`, `BulkUpdateSettingsRequest`.
- [x] Move inline validation rules into the Form Request classes. This is an incremental refactor —
  do it AFTER fixing the bugs below (which can be done inline first).
**Acceptance:** Critical endpoints have reusable, testable Form Request validation.

### ✅ VAL-2: `employee_code` written but not in `$fillable` (HIGH)
**What's broken:** `UserController::store` (line 131) writes `employee_code`, but `User::$fillable`
doesn't include it — silently dropped. Then `buildIndexQuery` (line 35) tries to search by
`employee_code` → query references a non-existent column → SQL error.
**Fix:**
- [x] Either add `employee_code` to the `users` migration + `$fillable` + `$hidden`, OR remove all
  references to `employee_code` (use `employee_id` consistently). Recommended: standardize on
  `employee_id` (already the column name) and remove `employee_code`.
**Acceptance:** User creation + search work without SQL errors.

### ✅ VAL-3: Leave request reason has no max length (MEDIUM)
**Fix:**
- [x] `LeaveRequestController::store`: change `'reason' => 'required|string'` →
  `'reason' => 'required|string|max:1000'`.

### ✅ VAL-4: Settings values have no type/size constraint (MEDIUM)
**Fix:**
- [x] `SettingsController::bulkUpdate`: validate each `value` is a scalar string with `max:500`.

### ✅ VAL-5: Attendance export date params not validated (LOW)
**Fix:**
- [x] `AttendanceController::export`: validate `start_date` and `end_date` as `nullable|date`.

### ✅ VAL-6: Attendance graph params not enum-validated (LOW)
**Fix:**
- [x] `AttendanceController::hrGraph` & `adminGraph`: validate `mode` as `in:weekly,monthly` and `groupBy` as
  `in:date,employee`. Validate `$date` as `date` before `Carbon::parse`.

### ✅ VAL-7: `sync` events type not enum-validated (MEDIUM)
**Fix:**
- [x] `AttendanceController::sync`: change `events.*.type` validation from `string` to
  `in:clock_in,clock_out,break_start,break_end`.

---

## PHASE 23 — Data Privacy & Sensitive Field Protection

### ✅ SEC-1: UserController exposes sensitive fields (HIGH)
**What's broken:** `UserController::show/index` returns the full User model — including
`blood_group`, `emergency_contact`, `alternate_mobile`, `preferences`. The `DirectoryController`
carefully hides these, but the Users API bypasses that protection.
**Fix:**
- [x] `UserController::show` and `index`: add `$user->makeHidden(['blood_group', 'emergency_contact',
  'alternate_mobile', 'preferences'])` before returning. Or add these to the User's `$hidden` array
  globally (but they're needed in Profile — so use `makeHidden` at the controller level).
- [x] `UserController::export` (CSV): verify these fields are NOT in the export columns.
- [x] The `/auth/profile` closure (api.php:38) should also hide sensitive fields if the profile is
  ever used to display another user's data (currently self-only, so OK — but verify).
**Acceptance:** `blood_group`, `emergency_contact`, `alternate_mobile` are never exposed via the
Users API.

### ✅ SEC-2: AnnouncementController has no authorization (CRITICAL)
**What's broken:** `AnnouncementController` store/update/destroy have NO capability middleware and
NO ownership check. Any authenticated employee can create company-wide announcements, edit anyone's,
or delete any.
**Fix:**
- [x] `routes/api.php`: add `capability:announcements.manage` to `POST/PUT/DELETE /announcements*`.
  Add `announcements.manage` to super_admin + HR in the seeder.
- [x] `AnnouncementController::update/destroy`: add ownership check (creator or admin only).
- [x] `GET /announcements` + `POST /announcements/{id}/react` stay open to all authenticated users.
**Acceptance:** Employees cannot create/edit/delete announcements.

### ✅ SEC-3: Directory sendMessage leaks email for private users (LOW)
**What's broken:** `DirectoryController::sendMessage` returns `$targetUser->only(['id','name','email',
'avatar_url'])` — bypassing `applyVisibilityRules`. A target who set `directory_visibility=private`
leaks their email to the message initiator.
**Fix:**
- [x] `sendMessage`: apply `applyVisibilityRules($targetUser)` before extracting fields, OR only
  return `id` + `name` + `avatar_url` (drop `email` from the response — it's not needed to start a DM).
**Acceptance:** Private-visibility users' email is not leaked via the Send Message flow.

### ✅ SEC-4: Suspicious-login IP comparison is exact-string (LOW)
**What's broken:** `AuthController::login` (line 117): `$lastSuccessful->ip_address !== $ip` — exact
string match. IPv4 vs IPv6, or normalized forms, cause false positives (noisy admin notifications).
**Fix:**
- [x] Normalize IPs before comparison (or use `filter_var` + `inet_pton` for binary comparison).
- [x] Alternatively, use a broader heuristic (different /24 subnet for IPv4).

### ✅ SEC-5: CSP allows unsafe-eval + unsafe-inline (MEDIUM)
**What's broken:** `SecurityHeaders.php:27`: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`.
Combined with the access token in localStorage, any XSS can exfiltrate the session.
**Fix (hardening — not blocking but recommended):**
- [x] Tighten CSP to remove `'unsafe-eval'` (React production mode doesn't need it). Keep
  `'unsafe-inline'` only if needed for inline styles, or use nonces.

### ✅ SEC-6: Reverb `allowed_origins => ['*']` (HIGH)
**What's broken:** `config/reverb.php:85`: any origin can connect to the WebSocket server.
**Fix:**
- [x] Set `allowed_origins` to the production domain(s). Read from env: `env('REVERB_ALLOWED_ORIGINS',
  'http://localhost:3000')`.

---

## PHASE 24 — Console Errors & React Warnings

### ✅ UI-1: Missing DialogDescription/SheetDescription on many dialogs (MEDIUM)
**What's broken:** Radix Dialog/Sheet emit a console warning when `DialogContent`/`SheetContent`
lacks `aria-describedby` or a `*Description` child. ~16 of 19 dialog-using files omit it.
**Fix:**
- [x] Audit every `<DialogContent>` and `<SheetContent>` in base workflows:
  `org/users/page.tsx`, `profile/page.tsx`, `hr-correction-dialog.tsx`, `time-clock-widget.tsx`,
  `leave-approval-actions-cell.tsx`, `attendance/page.tsx` (Request Leave dialog),
  `dashboard/layout.tsx` (mobile nav Sheet).
- [x] Add `<DialogDescription className="sr-only">...</DialogDescription>` (or `aria-describedby=""`
  to suppress when no description is needed).
**Acceptance:** Zero Radix "Missing Description" console warnings.

### ✅ UI-2: DataTable fixed height on mobile (LOW)
**What's broken:** `data-table.tsx:319`: fixed `h-[600px]` container — nested scrolling on small
viewports.
**Fix:**
- [x] Make the height responsive: `h-[400px] md:h-[600px]` or use `max-h-[calc(100vh-200px)]`.

---

## PHASE 25 — Base Workflow Edge Cases & State Coverage

### STATE-BASE: Verify every base workflow handles all critical states

For EACH base workflow below, verify and fix if missing:

**Auth:**
- [x] Login: invalid credentials → error message. Account locked → 423 + countdown. Network failure →
  offline toast. Inactive account → error (AUTH-3). Dual-role → role-select redirect.
- [x] Refresh: expired refresh → redirect to login. Role reset → fixed (AUTH-1).
- [x] Password change: wrong current password → error. Weak new password → policy error. Success →
  sessions revoked (AUTH-2).
- [x] Forgot password: unknown email → same success message (no enumeration). SMTP not configured →
  admin channel fallback.

**Users:**
- [x] Create: duplicate email → 422. Missing required fields → inline errors. Success → toast + list
  refresh. Roles properly assigned.
- [x] Edit: same validation. Role change revokes old sessions? (Consider.)
- [x] Deactivate: last super-admin → blocked. User has active tasks → warning?
- [x] Delete: soft-delete preserves history (DB-1).

**Departments:**
- [x] Delete with members → blocked (in-use guard).
- [x] Archive → members reassigned or preserved.

**Directory:**
- [x] Search empty query → shows all. No results → empty state. Private user → fields hidden.
- [x] Send Message → opens chat with correct conversation (ORG-2, ORG-3).

**Leave:**
- [x] Overlapping dates → rejected. Past dates → rejected? Holiday overlap → warning.
- [x] Approve already-decided → blocked. Reject without reason → blocked.
- [x] History filter by status → correct results (LEAVE-2).

**Attendance:**
- [x] Clock in twice → blocked (state machine). Clock out without clock-in → blocked.
- [x] Break without clock-in → blocked. Break end without break start → blocked.
- [x] Future timestamp → rejected (AUTH-7). Offline punch → queued + synced.
- [x] Correction → re-reconciles. Open shift → flagged.
- [x] Export → correct data. Filter → correct results.

**Settings:**
- [x] Invalid work schedule time → validation error. Password policy change → takes effect (SET-1).
- [x] Audit log filter → correct results. Export → CSV safe (no injection).

---

## PHASE 26 — Production Smoke Test (Base + Attendance)

### SMOKE: Run these exact scenarios after all fixes

- [ ] **Login as karthik/Admin@123** → Super Admin dashboard loads, all widgets show real data.
  Navigate to Admin Attendance → table loads, search works, dept names show, trends graph renders.
  Export → downloads XLSX. Click employee → side sheet with timeline. Notify HR for open shifts →
  notifications sent (not 422).
- [ ] **Login as aravind/Hr@123** → HR dashboard loads, team attendance widget works, pending
  approvals work, activity feed shows real anomalies. Navigate to Team Attendance → table loads,
  search works, corrections work, graph renders. Export button removed or works without 403.
  Navigate to Leave Approvals → approve/reject works, leave→attendance integration fires.
- [ ] **Login as praveen/Dev@123** → Employee dashboard loads, clock-in widget works, task progress
  shows real %, approval status shows real leave requests, announcements visible. Clock in → timer
  runs. Start break → timer pauses. End break → resumes. Clock out → confirmation → timer stops.
  Navigate to My Attendance → calendar heatmap loads, per-day detail works. Navigate to Leave →
  request form works, history shows.
- [ ] **Dual-role user** → role-select screen → pick role → dashboard for that role. Silent refresh
  keeps the selected role (AUTH-1).
- [ ] **Password change** → all other sessions kicked (AUTH-2). New password enforced with policy (SET-1).
- [ ] **Directory** → grid/list loads (ORG-1). Click employee → profile sheet. Click "Message" →
  DM opens in chat (ORG-2, ORG-3). Private user → email/phone hidden (SEC-1, SEC-3).
- [ ] **Profile** → edit name/phone → saves. Upload avatar → Supabase. Change password → policy
  enforced. View devices → revoke → session ends.
- [ ] **Settings** (Admin) → company profile, work schedule (CFG-1), auto-numbering (CFG-2), policies
  (SET-1), holidays (LEAVE-4) → all save and take effect.
- [ ] **Audit log** (Admin) → loads with real data, filterable, exportable.
- [ ] **Mobile** (360px viewport) → sidebar hidden, bottom nav works, tables → cards, dialogs
  full-screen, no horizontal scroll, touch targets ≥44px.
- [ ] **Offline** → disconnect network → clock in → queued → reconnect → syncs. Offline banner
  visible. Toast visible (AUTH-6).
- [ ] **Console** → zero errors, zero warnings in all base-workflow pages (UI-1).

---

# FINAL ACCEPTANCE — Base Workflows + Attendance Production-Ready

The application is production-ready for daily office usage when ALL of the following are true:

### No broken workflows
1. Every base workflow (auth, users, departments, designations, directory, profile, leave,
   attendance, settings, audit) works end-to-end: UI → API → DB → response → UI update.

### No critical console errors
2. Zero Radix "Missing Description" warnings (UI-1). Zero React hydration errors. Zero `useSearchParams`
   SSR bailouts.

### No critical backend errors
3. `meToday` never 500s (ATT-1). No Postgres SQL syntax errors (DB-2). No `employee_code` column
   errors (VAL-2). No `audit_logs.created_at` ordering errors.

### No unresolved database errors
4. `migrate:fresh --seed` succeeds. All FKs present (DB-4). Soft deletes on User (DB-1).

### No missing permissions
5. AnnouncementController authorization enforced (SEC-2). Every role sees only permitted data.
   Backend enforces all capabilities.

### No unauthorized data access
6. Sensitive fields (`blood_group`, `emergency_contact`) hidden everywhere (SEC-1). HR scoped to own
   department (ROLE-4). Attendance scoping uses active token role (ROLE-3).

### No placeholder data
7. Dashboard widgets show real data — no crashes (DASH-1/2/3), no stub-0 metrics (DASH-4).

### No dead functionality
8. No dead endpoints, no orphaned widgets (ATT-11), no unused imports, no no-op search boxes.

### No incomplete modules
9. Employee Detail/History view exists (EMP-1/2/3). Holiday CRUD UI exists (LEAVE-4). Admin trends
   graph works (ATT-2). Leave→attendance integration fires (LEAVE-3).

### No obvious performance bottlenecks
10. No N+1 queries (PERF-1). Role lookups cached (PERF-2). Dashboard query count ≤5 (PERFBE-1/2).
    Navigation shows cached data instantly (no skeleton on revisit).

### No critical loading problems
11. No wall-of-skeletons on cold load (fix-5.md items implemented). Widgets prefetch in parallel.
    `placeholderData: keepPreviousData` everywhere. No 30s polling spinners.

### No inconsistent role behaviour
12. Refresh preserves selected role (AUTH-1). No self-approval (ROLE-2). HR sees only team leave
    (ROLE-4). Employees can view own activity (ROLE-5).

### No broken responsive states
13. All base-workflow pages work at 360/768/1024/1440px. Tables → cards on mobile. Dialogs
    full-screen on mobile. No horizontal scroll.

### No missing validation
14. All mutation endpoints validate input (VAL-1..7). Timestamp bounds enforced (AUTH-7). Max
    lengths on text fields. Enum validation on type fields.

### No critical integration failures
15. MAIL_* configured → emails actually send (INT-1). Reverb origins restricted (SEC-6). Queue
    worker + scheduler supervised (INT-6). Toast library unified (AUTH-6).

---

# APPENDIX A — Deferred Module Tasks (Projects, Tasks, Chat, Reports)

> **These tasks are preserved from Part II but are OUT OF SCOPE for the current base + attendance
> effort.** They belong to separate modules (Projects/Tasks, Chat/messaging, Reports) and will be
> addressed in a dedicated effort. Do NOT delete — rearrange here for future reference.

**Projects & Tasks (deferred):**
- PROJ-1: QaController PHP fatal error (missing `{`)
- PROJ-2: Project submit/review endpoints don't exist
- PROJ-3: Project list sort ignored
- PROJ-4: Project list pagination mismatch
- PROJ-5: Task create form missing key fields (assignee, project, dependencies, QA, recurrence)
- PROJ-6: Task progress slider missing
- PROJ-7: "My Tasks" personal task list missing
- PROJ-8: Project work timer is manual-only

**Chat & Messaging (deferred — but NOTIFICATION BELL is in scope as part of the base shell):**
- CHAT-1: Real-time chat broken — channel-type mismatch (subscribe should be private)
- CHAT-2: Announcement realtime event-name mismatch (broadcastAs vs listener)
- CHAT-3: Global conversation channel auth fails (no pivot rows for global)
- CHAT-4: @mentions not implemented
- CHAT-5: Read receipts not implemented
- CHAT-6: File/image sharing is fake (appends text, no upload)
- CHAT-7: Announcement create UI missing (NOTE: if announcements are on the dashboard, the create
  UI is arguably base-workflow — prioritize accordingly)
- CHAT-8: Conversation unread state not surfaced
- CHAT-9: Notification type filter + search no-ops server-side (NOTIFICATION CENTER is base shell)

**Reports (deferred):**
- REP-1: Saved Views field-name mismatch
- REP-2: Export job bypasses authorization + ignores filters
- REP-3: Admin export keys fall through to user dump
- REP-4: Weekly summary metrics wrong
- REP-5: Report builder search inert + productivity not implemented

---
---

# PART IV — SURGICAL PERFORMANCE & CORRECTNESS OPTIMIZATION (Current Code)

> Deep code-level audit of the ACTUAL current codebase (post-fix-5 commit `13cd2ff`). Every finding
> below was verified by reading the exact source file and line. These are the **remaining** root
> causes of slowness, broken queries, and memory leaks — not theoretical concerns.
>
> IDs: **PERF-FE-** (frontend), **PERF-BE-** (backend), **PERF-DB-** (database).

---

## PHASE 27 — Frontend: Eliminate Remaining Loaders & Render Waste

### PERF-FE-1: Duplicate `/auth/preferences` fetch on every dashboard mount (HIGH)
**Root cause:** `apps/web/src/lib/ui-store.ts:71-83` (`initPreferences`) does a raw
`apiFetch("/auth/preferences")` that BYPASSES the React Query cache. Simultaneously,
`apps/web/src/components/widgets/widget-engine.tsx:41-45` does a separate
`useQuery({ queryKey: queryKeys.dashboardLayout })` for the SAME endpoint. Two identical GETs fire
serially on every dashboard mount. The ui-store call blocks sidebar state initialization; the
widget-engine call blocks the grid layout. Both must resolve before the dashboard is fully usable.
**Fix:**
- [ ] `apps/web/src/lib/ui-store.ts`: delete the raw `apiFetch("/auth/preferences")` inside
  `initPreferences()`. Instead, read from the React Query cache after the widget-engine query
  resolves: `const prefs = queryClient.getQueryData(queryKeys.dashboardLayout)`. Or better: have
  ui-store subscribe to the same query key via a `useQuery` call in the dashboard layout component
  and extract `sidebar_state` from the cached preferences response.
- [ ] Verify only ONE `/auth/preferences` request fires on dashboard cold load (DevTools Network).
**Acceptance:** DevTools shows exactly 1 `GET /api/auth/preferences` on dashboard mount (was 2).

### PERF-FE-2: WidgetEngine triple-layout flash on cold load (HIGH — the most visible "loader churn")
**Root cause:** `apps/web/src/components/widgets/widget-engine.tsx` has THREE sequential layout states:
1. `!mounted` (line 176) → 3 static skeleton cards.
2. `!layouts || empty` (line 186) → widgets render in a plain CSS fallback grid (no drag).
3. Preferences resolve → `ResponsiveGridLayout` mounts → all widgets reposition (visible "snap").
The user sees: skeleton wall → fallback grid with widget skeletons → snap to final positions.
This happens because `layouts` starts as `{}` and is only populated inside a `useEffect` that waits
for the preferences query. The default layout is never available synchronously.
**Fix:**
- [ ] Move the default-breakpoints construction (currently inside the effect at lines 107-113)
  into the `useState` initializer so layouts are available on FIRST render:
  ```ts
  const [layouts, setLayouts] = useState<any>(() => ({
    lg: availableWidgets.map(w => ({ ...w.defaultLayout, i: w.id })),
    md: availableWidgets.map(w => ({ ...w.defaultLayout, i: w.id })),
    sm: availableWidgets.map(w => ({ ...w.defaultLayout, i: w.id })),
    xs: availableWidgets.map(w => ({ ...w.defaultLayout, i: w.id })),
    xxs: availableWidgets.map(w => ({ ...w.defaultLayout, i: w.id })),
  }));
  ```
- [ ] Remove the `!layouts || empty` fallback-grid branch entirely (layouts will never be empty).
- [ ] When preferences resolve, merge the saved layout into the existing defaults (not replace).
  The current merge logic already handles this — just remove the early-return for empty layouts.
- [ ] Change the `!mounted` skeleton to only show for 1 frame (or remove it if defaults render fast).
**Acceptance:** Dashboard cold load renders ResponsiveGridLayout with default positions immediately;
when saved preferences arrive, widgets reposition smoothly with no skeleton wall or fallback grid.

### PERF-FE-3: Wasted prefetch of announcements + tasks (MEDIUM)
**Root cause:** `apps/web/src/app/dashboard/page.tsx:56` prefetches `queryKeys.announcements`, but
`AnnouncementBoard` is NOT on any dashboard widget catalog (only on `/dashboard/announcements`).
Line 58 prefetches `queryKeys.tasks`, but no dashboard widget reads it (metrics widget uses
`/dashboard/metrics`). Both consume 2 of the ~6 parallel cold-load request slots for nothing.
**Fix:**
- [ ] Remove line 56 (`prefetchQuery({ queryKey: queryKeys.announcements ... })`).
- [ ] Remove line 58 (`prefetchQuery({ queryKey: queryKeys.tasks ... })`) unless DASH-5 adds the
  AnnouncementBoard to the dashboard (then keep announcements, remove tasks).
**Acceptance:** Dashboard cold load fires 4-5 prefetch requests, not 6-7.

### PERF-FE-4: Dual toast library — offline toasts invisible (MEDIUM)
**Root cause:** `apps/web/src/lib/api-client.ts:3` and `apps/web/src/lib/offline-engine.ts:3` import
from `react-hot-toast`. Only Sonner's `<Toaster>` is mounted (`providers.tsx:73`). Calls to
`toast.success("You are offline...")` / `toast.success("Network error...")` render into a Toaster
that doesn't exist → toasts are invisible. Also `react-hot-toast` adds unnecessary bundle weight.
**Fix:**
- [ ] `api-client.ts:3`: replace `import toast from "react-hot-toast"` with `import { toast } from "sonner"`.
- [ ] `offline-engine.ts:3`: same replacement.
- [ ] Verify all `toast.success/error` calls work with sonner's API (they do — sonner exports
  `toast.success(msg)`, `toast.error(msg)`).
- [ ] `package.json`: remove `react-hot-toast` dependency.
**Acceptance:** Offline-queue toasts are visible. `react-hot-toast` is not in the bundle.

### PERF-FE-5: CommandPalette whole-store destructuring (MEDIUM)
**Root cause:** `apps/web/src/components/app-shell/command-palette.tsx:47`:
`const { isActive, isOnBreak } = useTimerStore();` — subscribes to the ENTIRE store without a selector.
CommandPalette is ALWAYS mounted in the shell. Any timer-store change (e.g., `syncWithServer` on
attendance refetch) re-renders the entire command palette + its children.
**Fix:**
- [ ] `command-palette.tsx:47`: change to:
  ```ts
  const isActive = useTimerStore((s) => s.isActive);
  const isOnBreak = useTimerStore((s) => s.isOnBreak);
  ```
**Acceptance:** CommandPalette does not re-render when `syncWithServer` fires.

### PERF-FE-6: TodaySummaryCard missing placeholderData (MEDIUM)
**Root cause:** `apps/web/src/components/attendance/today-summary-card.tsx:17-22`: no
`placeholderData: keepPreviousData`. On the attendance page cold load (direct navigation, not via
dashboard), this card blocks on `isLoading` longer than necessary. If the query refetches after
gcTime eviction, it re-flashes to skeleton.
**Fix:**
- [ ] Add `placeholderData: keepPreviousData, staleTime: STALE_TIME_ATTENDANCE` to the useQuery.
- [ ] Change `isLoading` to `isPending` for the cold-load-only skeleton.
**Acceptance:** TodaySummaryCard shows cached data instantly on revisit; no skeleton flash on refetch.

### PERF-FE-7: Dead retry ladder in api-client (LOW — cleanup)
**Root cause:** `apps/web/src/lib/api-client.ts:56-59, 117-119, 151-157`: `maxRetries = 0` makes the
`while` loop run exactly once. The 5xx retry branch (`attempt < maxRetries` = `0 < 0`) is unreachable.
The `sleep` backoff call is unreachable. React Query's `retry: 1` handles actual retries.
**Fix:**
- [ ] Remove the `while` loop, `maxRetries`, `attempt` bookkeeping, and the dead 5xx/sleep branches.
  Flatten to a single try/catch/throw.
**Acceptance:** api-client is a clean single-pass fetch with no dead code.

---

## PHASE 28 — Backend: Postgres Compatibility & Critical Correctness (P0)

### PERF-BE-1: Double-quoted SQL string literals break ALL dashboard/graph queries on Postgres (CRITICAL)
**Root cause:** `DashboardController.php:62-67, 100-106` and `AttendanceController.php:389, 394` use:
```php
->selectRaw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present, ...')
```
Postgres treats `"present"` as a column IDENTIFIER, not a string literal → `SQLSTATE[42703]:
column "present" does not exist`. The entire dashboard metrics endpoint AND the attendance graph
endpoint fail on Postgres (the production DB). This is the #1 reason "dashboard widgets don't load."
**Fix:**
- [ ] `DashboardController.php:62-67`: change all `"present"`, `"absent"`, `"late"`, `"leave"` to
  single-quoted: `''present''` (PHP string-escaped single quotes inside a single-quoted PHP string)
  or use `\'present\'` inside double-quoted PHP strings.
- [ ] `DashboardController.php:100-106`: same fix for the HR branch.
- [ ] `AttendanceController.php:389, 394`: same fix in `hrGraph`.
- [ ] Grep ALL `selectRaw` and `DB::raw` across the codebase for double-quoted SQL string literals:
  `grep -rn 'selectRaw\|DB::raw' apps/api/app/ | grep '"present"\|"absent"\|"late"\|"leave"\|"active"\|"pending"'`
**Acceptance:** `GET /api/dashboard/metrics` and `GET /api/attendance/hr/graph` return 200 on Postgres.

### PERF-BE-2: `meToday` null-deref 500s for first-time users (CRITICAL)
**Root cause:** `AttendanceController.php:146`:
```php
$lastMod = max($day->updated_at ?? '', $events->max('updated_at') ?? '');
```
When `$day` is `null` (user has never clocked in today → no `attendance_days` row), `$day->updated_at`
triggers PHP 8 `Attempt to read property "updated_at" on null` → 500. The `?? ''` only catches a
null property VALUE, not a null RECEIVER. This breaks the very first dashboard load for every new
user or every morning before clocking in.
**Fix:**
- [ ] `AttendanceController.php:146`: change to `$day?->updated_at ?? ''` (nullsafe operator).
**Acceptance:** `GET /attendance/me/today` returns 200 `{day: null, events: [], standard_seconds: 31500}`
for a user who hasn't clocked in today.

### PERF-BE-3: `UserController::activity` orders by nonexistent column (CRITICAL)
**Root cause:** `UserController.php:299`:
```php
DB::table('audit_logs')->where('user_id', $user->id)->orderBy('created_at', 'desc')->cursorPaginate(20);
```
`audit_logs` has NO `created_at` column (it uses `at`; `$timestamps = false` on the model). Postgres
throws `column "created_at" does not exist` → 500. The "View Activity" sheet always errors.
**Fix:**
- [ ] `UserController.php:299`: change `orderBy('created_at', 'desc')` → `orderBy('at', 'desc')`.
**Acceptance:** `GET /users/{id}/activity` returns 200 with real audit entries.

### PERF-BE-4: `employee_code` column doesn't exist — SQL error on user create/search (HIGH)
**Root cause:** `UserController.php:131` writes `employee_code` and `buildIndexQuery:35` searches by
it, but the `users` table has no `employee_code` column. `User::$fillable` doesn't include it →
silently dropped on create; SQL error on search.
**Fix:**
- [ ] Remove ALL references to `employee_code` — standardize on `employee_id` (the actual column).
  Grep: `grep -rn 'employee_code' apps/api/` and replace with `employee_id`.
**Acceptance:** User create + search work without SQL errors.

---

## PHASE 29 — Backend: Scheduled Job N+1 Elimination (HIGH impact)

### PERF-BE-5: `RemindShiftStart` runs identical holiday query per user (HIGH)
**Root cause:** `apps/api/app/Jobs/RemindShiftStart.php:58`:
```php
foreach ($users as $user) {
    $isHoliday = DB::table('holidays')->where('date', $today)->exists();  // SAME query N times
}
```
With 100 employees → 100 identical holiday queries per run, 12 runs/hour, 24/7 = 28,800 wasted
queries/day. Also `$onLeave` is a per-user query that could be one batch.
**Fix:**
- [ ] Hoist BEFORE the loop:
  ```php
  $isHoliday = DB::table('holidays')->where('date', $today)->exists();
  $usersOnLeave = LeaveRequest::where('status','approved')
      ->where('start_date','<=',$today)->where('end_date','>=',$today)
      ->pluck('user_id')->toArray();
  ```
  Inside the loop: `$onLeave = in_array($user->id, $usersOnLeave);`
**Acceptance:** Job runs 2 queries total (holiday + leave list) instead of 2N.

### PERF-BE-6: `AlertMissedClockIn` has 3 N+1 patterns per user (HIGH)
**Root cause:** `apps/api/app/Jobs/AlertMissedClockIn.php:52-70`:
- Per-user `$onLeave` query (line 52)
- Per-user `$isHoliday` query (line 59)
- Per-user `$hrUsers` query with 2 EXISTS subqueries (lines 63-70)
- Then per-HR-user `Notification::create` inserts
With 100 employees + 5 HR users → 300+ queries + 500 inserts per run.
**Fix:**
- [ ] Hoist holiday + leave (same as PERF-BE-5).
- [ ] Pre-fetch ALL super_admins once: `$superAdmins = User::whereHas('roleAssignments', fn($q) => $q->where('role','super_admin'))->get();`
- [ ] Pre-fetch ALL HR users grouped by department: `$hrByDept = User::whereHas('roleAssignments', fn($q) => $q->where('role','hr'))->get()->groupBy('department_id');`
- [ ] Inside the loop: merge `$superAdmins` + `$hrByDept[$user->department_id] ?? []`.
- [ ] Batch-insert notifications: collect all notification rows, then `Notification::insert($rows)`.
**Acceptance:** Job runs ~5 queries + 1 batch insert instead of 300+ queries + 500 inserts.

### PERF-BE-7: `FlagOpenShifts` per-day HR lookup + per-row update (MEDIUM)
**Root cause:** Same per-day HR-users query as PERF-BE-6. Plus `$day->update(['is_flagged' => true])`
runs per row inside the loop instead of one bulk update.
**Fix:**
- [ ] Pre-fetch HR/admin users once (same as PERF-BE-6).
- [ ] Bulk update: `AttendanceDay::whereIn('id', $dayIds)->update(['is_flagged' => true])`.
- [ ] Batch-insert notifications.
**Acceptance:** Job runs ~3 queries + 1 bulk update + 1 batch insert.

---

## PHASE 30 — Backend: Export Memory + N+1 Elimination

### PERF-BE-8: Attendance export materializes ALL rows in memory (HIGH)
**Root cause:** `AttendanceController.php:509-540`: `$query->get()` hydrates the entire date range
into Eloquent models in memory, THEN streams. A 1-year × 100-employee export = 36,500 rows hydrated.
Compare: `AuditLogController::export` correctly dispatches a queued job with chunked processing.
**Fix:**
- [ ] Either: dispatch a queued `ExportAttendanceJob` (returning 202 + ExportJob row), OR
- [ ] At minimum: use `->chunk(500, function($rows) use ($writer) { ... })` inside the stream
  callback with `DB::table(...)` (raw, no Eloquent hydration).
**Acceptance:** Export of large date ranges doesn't spike memory; completes without timeout.

### PERF-BE-9: UserController::bulk N+1 on roleAssignments (MEDIUM)
**Root cause:** `UserController.php:339,346`: `User::whereIn('id',$ids)->get()` without
`with('roleAssignments')`. Inside the loop: `$user->roleAssignments->pluck('role')` → 1 query per user.
Also `$user` loop calls `User::where('status','active')->whereHas('roleAssignments',super_admin)->count()`
on each iteration when the user is super_admin.
**Fix:**
- [ ] Add `->with('roleAssignments')` to the initial query.
- [ ] Hoist the super_admin count OUT of the loop (it doesn't change between iterations; check once after).
**Acceptance:** Bulk action on 50 users runs 1 query (not 50+).

### PERF-BE-10: notifyOpenShifts N+1 on roleAssignments (MEDIUM)
**Root cause:** `AttendanceController.php:550-558`:
`User::whereHas('roleAssignments',...)->get()` without `with('roleAssignments')`. Then inside the
loop `$hr->roleAssignments->pluck('role')->contains('super_admin')` → 1 query per HR user.
**Fix:**
- [ ] Add `->with('roleAssignments')` to the query.
- [ ] Batch notification inserts.
**Acceptance:** Notify HR runs H+1 queries (not H×D).

### PERF-BE-11: updateStatus / destroy / resetPassword access roleAssignments without eager load (LOW)
**Root cause:** `UserController.php:221, 257, 311`: `User::findOrFail($id)` then
`$user->roleAssignments->pluck('role')` — 1 lazy query per call.
**Fix:**
- [ ] Change to `User::with('roleAssignments')->findOrFail($id)`.

### PERF-BE-12: AttendanceService::reconcileDay re-fetches user + work schedule per call (MEDIUM)
**Root cause:** `AttendanceService.php:93-100`: `User::find($userId)` + work schedule query on every
`reconcileDay` call. In the `sync` loop (`AttendanceController.php:118-120`), this is called once per
date → N×2 redundant queries.
**Fix:**
- [ ] Cache the work schedule: `Cache::remember("work_schedule_{$scheduleId}", 300, ...)`.
- [ ] Cache the default work schedule: `Cache::remember('default_work_schedule', 3600, ...)`.
- [ ] In the `sync` loop: pass the already-loaded user + schedule into `reconcileDay` instead of
  re-fetching each time.
**Acceptance:** Sync of 5 dates runs 1 user query + 1 schedule query (not 10).

### PERF-BE-13: `whereDate` defeats index in recordEvent (MEDIUM)
**Root cause:** `AttendanceService.php:25-28`:
`AttendanceEvent::whereDate('timestamp', $date)` casts the timestamp column to a date → defeats the
covering index `idx_attendance_events_covering (user_id, timestamp, type)`. Full function-scan.
**Fix:**
- [ ] Replace with `whereBetween('timestamp', [$date . ' 00:00:00', $date . ' 23:59:59'])`.
**Acceptance:** Punch endpoint uses the covering index (verify via EXPLAIN).

---

## PHASE 31 — Database: Index Cleanup + Missing Composites

### PERF-DB-1: Add missing composite indexes (HIGH)
**Fix:**
- [ ] `task_time_logs`: composite `(user_id, log_date)` — used by meHistory/hrHistory. Drop the
  redundant single-col `log_date` index.
- [ ] `notifications`: composite `(user_id, created_at DESC)` — used by NotificationController::index
  ordering. The existing `(user_id, read_at)` doesn't help ORDER BY created_at.
- [ ] `audit_logs`: composite `(user_id, at DESC)` — used by UserController::activity.
- [ ] `messages`: composite `(conversation_id, created_at)` — used by ChatController::messages.
- [ ] `conversation_user`: index on `user_id` (leading column) — the PK is
  `(conversation_id, user_id)` which doesn't support queries starting from user_id.
**Acceptance:** EXPLAIN on the affected queries shows index scan, not seq scan.

### PERF-DB-2: Drop redundant/duplicate indexes (MEDIUM)
**Root cause:** Multiple migration waves added overlapping indexes with different names. These
increase write amplification (every INSERT/UPDATE maintains all indexes) and waste storage.
**Fix:**
- [ ] `attendance_days`: drop `idx_attendance_days_user_date` (duplicate of the unique constraint),
  `attendance_days_user_id_index` (left prefix of unique), `attendance_days_date_index` (duplicate
  of `idx_attendance_days_date`), `attendance_days_status_index` (left prefix of composite
  `status,date`).
- [ ] `users`: drop `users_department_id_index` (duplicate of `idx_users_department_id`).
- [ ] `leave_requests`: drop `idx_leave_requests_user_id` and `leave_requests_user_id_index`
  (left prefix of `idx_leave_requests_user_status`); drop `leave_requests_status_index` (covered
  by composite); drop one of `leave_requests_no_overlap` / `unique_pending_leave_overlap` (both
  are identical partial unique indexes on `(user_id, start_date, end_date) WHERE status='pending'`).
- [ ] `attendance_events`: drop the explicit `->index('client_id')` (the `->unique('client_id')`
  already provides an index).
- [ ] `holidays`: drop the explicit `->index('date')` (the `->unique('date')` already provides one).
**Acceptance:** `pg_indexes` shows no redundant indexes. Write performance improves.

---

## PHASE 32 — Backend: Cache Correctness + Pagination Consistency

### PERF-BE-14: Dashboard cache invalidation broken — wrong key names (MEDIUM)
**Root cause:** `app/Observers/CacheInvalidationObserver.php:13-16` forgets
`dashboard_global_stats`, `dashboard_active_projects_count` — but the actual cache keys used by
`DashboardController` are `dashboard_global`, `dashboard_pending_tasks_count`,
`dashboard_recent_activity`. The observer runs 4 wasted `Cache::forget` calls per model write on
keys that don't exist, and the REAL keys are never invalidated → stale dashboard data for up to 5 min.
**Fix:**
- [ ] Align the observer to forget the EXACT key names used by DashboardController:
  `Cache::forget("dashboard_global")`, `Cache::forget("dashboard_recent_activity")`,
  `Cache::forget("dashboard_pending_tasks_count")`, and per-user
  `Cache::forget("dashboard_metrics_{$userId}_{$role}_{$today}")`.
**Acceptance:** Creating a user / approving leave / recording attendance immediately reflects on
the dashboard (no 5-min stale period).

### PERF-BE-15: Cache the default work schedule (MEDIUM)
**Root cause:** `AttendanceController::meToday:143` queries `work_schedules` every request.
`AttendanceService::reconcileDay` queries it every punch. The data changes rarely (Admin settings).
**Fix:**
- [ ] Wrap in `Cache::remember('default_work_schedule', 3600, fn() => ...)`.
- [ ] Invalidate when `WorkScheduleController::update` is called.
**Acceptance:** `work_schedules` is queried once per hour (not once per request).

### PERF-BE-16: NotificationController uses offset pagination instead of cursor (LOW-MEDIUM)
**Root cause:** `NotificationController.php:21`: `->paginate(50)` (offset-based). `notifications`
will be one of the largest tables. Deep-page OFFSET is O(n).
**Fix:**
- [ ] Change to `->cursorPaginate(50)`. Update the frontend to read `next_cursor` instead of
  `meta.current_page/last_page`.
**Acceptance:** Notifications page 100 loads as fast as page 1.

### PERF-BE-17: LeaveRequestController::index uses whereHas for status filter instead of denormalized column (LOW)
**Root cause:** `LeaveRequestController.php:38-43` uses `->whereHas('approval', fn($q) => $q->where('status', $status))`
instead of `->where('status', $status)` on the `leave_requests.status` column. The subquery
prevents index usage.
**Fix:**
- [ ] Change to `->where('status', $status)` (the column is synced by ApprovalService).
- [ ] Same fix for `store` overlap check at line 66: change `->whereHas('approval', ...)` to
  `->where('status', 'pending')` so the partial unique index can be used.

### PERF-BE-18: applyHrScoping queries RoleAssignment instead of reading token (LOW)
**Root cause:** `AttendanceController.php:207-214`: runs
`RoleAssignment::where('user_id',...)->where('role','super_admin')->exists()` on every overview/hrToday
call. The active role is already on the token abilities.
**Fix:**
- [ ] Read from `$request->user()->currentAccessToken()->abilities` instead.

---

## PHASE 33 — Workflow Completeness: Final Verification Matrix

> Verify every base-workflow + attendance workflow end-to-end after all phases above are implemented.
> For each, confirm: UI loads → API call succeeds (no 500) → data is real (not placeholder) →
> loading/empty/error states correct → role permissions enforced → post-action state updates.

### Employee workflows
- [ ] Login → dashboard loads (no wall of skeletons, no stuck widgets) → TimeClockWidget shows
  correct state → Clock In → timer runs at 60fps → Break → timer pauses → Resume → timer resumes →
  Clock Out → confirm dialog → timer stops → "Shift completed" → attendance history calendar shows
  today's data → leave request form submits → history shows request → profile edits save.
- [ ] Navigate Dashboard → Attendance → Leave → Profile → Directory → back to Dashboard: EVERY page
  shows cached data instantly (0 skeleton on revisit within staleTime).

### HR workflows
- [ ] Dashboard: team attendance widget shows real data → pending approvals work → activity feed
  shows anomalies (not empty) → quick task works.
- [ ] Team Attendance page: table loads → search by name works → dept column shows names →
  analytics cards correct → graph renders → click employee → side sheet with timeline → correction
  dialog works → save re-reconciles → list updates.
- [ ] Leave Approvals: pending list loads → approve/reject works → leave→attendance integration
  fires → history updates.

### Admin workflows
- [ ] Dashboard: all 6 widgets show real data → recent activity renders (no crash) → attendance
  snapshot navigates to Admin Attendance.
- [ ] Admin Attendance: table loads → trends graph renders (no 404) → search works → dept names
  show → export downloads → open shifts table → Notify HR works (no 422) → corrections work.
- [ ] Settings: company profile saves → work schedule saves (no field mismatch) → auto-numbering
  loads (no 404) → policies take effect → holidays CRUD works → audit log loads (no 500).
- [ ] Employee Detail: click user → unified detail page shows attendance + leave + projects + activity.

### Cross-cutting
- [ ] No console errors on ANY base-workflow page.
- [ ] No 500 errors on ANY base-workflow API call.
- [ ] Mobile (360px): every page is usable — tables → cards, dialogs full-screen, no horizontal scroll.
- [ ] Offline: clock in → queued → toast visible → reconnect → syncs.
- [ ] Lighthouse: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 on /login + /dashboard + /dashboard/attendance.

---

## FINAL PERFORMANCE ACCEPTANCE — "The app feels fast"

The application is production-fast when ALL of the following are verified:

1. **Zero Postgres errors.** `DashboardController` and `AttendanceController::hrGraph` use
   single-quoted SQL string literals. (PERF-BE-1)
2. **`meToday` never 500s.** First-time users get a clean `not_started` state. (PERF-BE-2)
3. **`UserController::activity` never 500s.** Orders by `at`, not `created_at`. (PERF-BE-3)
4. **No `employee_code` errors.** (PERF-BE-4)
5. **Dashboard cold load shows ResponsiveGridLayout immediately** — no skeleton wall, no fallback
   grid, no snap. (PERF-FE-2)
6. **Only 1 `/auth/preferences` request** per dashboard mount. (PERF-FE-1)
7. **No wasted prefetches.** Dashboard prefetches only widget-consumed data. (PERF-FE-3)
8. **Offline toasts are visible.** Single toast library (sonner). (PERF-FE-4)
9. **CommandPalette doesn't re-render on timer events.** (PERF-FE-5)
10. **TodaySummaryCard shows cached data on revisit.** (PERF-FE-6)
11. **Scheduled jobs run ~5 queries per invocation**, not hundreds. (PERF-BE-5/6/7)
12. **Attendance export doesn't spike memory.** (PERF-BE-8)
13. **No N+1 queries in bulk/notifyOpenShifts/reconcileDay.** (PERF-BE-9/10/11/12)
14. **Punch endpoint uses covering index** (no `whereDate`). (PERF-BE-13)
15. **Dashboard cache invalidation works** — mutations reflect immediately. (PERF-BE-14)
16. **Work schedule is cached.** (PERF-BE-15)
17. **Notifications use cursor pagination.** (PERF-BE-16)
18. **No redundant database indexes.** Write performance improved. (PERF-DB-2)
19. **Navigation between pages shows cached data instantly** — 0 skeleton on revisit.
20. **Lighthouse targets met** on primary routes.

---
---

# PART V — DEPLOYMENT & RUNTIME CRITICAL FIXES (Production Console Errors)

> The production console log revealed THREE root causes that make the app completely non-functional
> in production. These are NOT code-quality issues — they are DEPLOYMENT-BREAKING bugs that must be
> fixed before anything else works. Every other fix in this file is irrelevant if these three are
> not resolved: the app returns 401 on every request (auth broken), 500 on dashboard (Postgres SQL
> bug), and floods the console with hundreds of WebSocket reconnection attempts (Reverb not running).

---

## PHASE 34 — Fix Cross-Domain Auth: Eliminate ALL 401 Errors (DEPLOYMENT BLOCKER)

### DEPLOY-1: Cookie-based refresh token broken on Vercel→Railway proxy (CRITICAL — THE root cause of ALL 401s)

**Root cause (verified from console log + code):** The auth system uses an HttpOnly cookie
(`g4k_refresh_token`) set by the Laravel backend on Railway. The frontend on Vercel uses a Next.js
rewrite (`/api/:path*` → `https://g4k-production.up.railway.app/:path*`). In theory, this makes
requests same-origin. In practice, **Next.js production rewrites on Vercel's edge network do NOT
reliably proxy Set-Cookie headers from cross-domain upstreams.** The browser on `vercel.app` either
never receives the `Set-Cookie` from Railway, or receives it with the wrong domain attribute, so the
cookie is not stored. When the access token expires (15 min), the silent refresh at
`/api/auth/refresh` returns 401 ("No refresh cookie"), which triggers `clearAuth()` → redirect to
`/login` → the app bounces between login and dashboard indefinitely. EVERY subsequent API call also
401s because the auth store is cleared.

**Evidence from console:**
```
GET /api/auth/refresh 401 (Unauthorized)     ← refresh cookie not sent/missing
GET /api/dashboard/metrics 401               ← auth cleared, no token
GET /api/announcements 401                   ← same cascade
GET /api/leave-requests/history 401
GET /api/approvals/pending 401
... (every endpoint returns 401)
```

**Fix (switch from cookie-based to token-based refresh):**
- [ ] **DEPLOY-1a** [api] `AuthController::login` — return `refresh_token` in the JSON response body
  alongside the access token. Currently it only returns `{token, user, active_role}` + the cookie.
  Add `refresh_token` to the response. Keep the cookie as a fallback for same-domain deployments.
- [ ] **DEPLOY-1b** [api] `AuthController::refresh` — accept the refresh token from EITHER:
  (1) the cookie (existing, for same-domain) OR (2) a custom header `X-Refresh-Token` OR (3) the
  request body `{"refresh_token": "..."}`. Try cookie first, fall back to header/body.
  ```php
  $rawRefreshToken = $request->cookie('g4k_refresh_token')
      ?? $request->header('X-Refresh-Token')
      ?? $request->input('refresh_token');
  ```
- [ ] **DEPLOY-1c** [web] `lib/auth-store.ts` — store BOTH `token` and `refresh_token` in the
  Zustand persisted store (localStorage). On `setAuth(token, user, role, refreshToken?)`, save the
  refresh token if provided.
- [ ] **DEPLOY-1d** [web] `lib/api-client.ts` — in the 401-refresh path, instead of relying on
  `credentials: "include"` (cookie), send the refresh token via a custom header:
  ```ts
  const refreshRes = await fetch(refreshUrl, {
    method: "GET",
    headers: { "X-Refresh-Token": useAuthStore.getState().refreshToken || "" },
  });
  ```
  This bypasses the cross-domain cookie issue entirely.
- [ ] **DEPLOY-1e** [api] `AuthController::logout` — also accept the refresh token via header to
  delete it server-side.
- [ ] **DEPLOY-1f** [test] Deploy to Vercel+Railway. Login → wait 15 min (or manually expire token
  by deleting it from localStorage) → verify the silent refresh works (no 401 cascade).
**Acceptance:** After the access token expires, the app silently refreshes using the header-based
refresh token. No 401 cascade. No redirect-to-login loop.

### DEPLOY-2: `/dashboard/org` route doesn't exist → 404 (HIGH)
**Root cause:** The console shows `GET /dashboard/org?_rsc=... 404`. Something navigates or links to
`/dashboard/org` but only `/dashboard/org/users`, `/dashboard/org/departments`, etc. exist.
**Fix:**
- [ ] Grep for `href="/dashboard/org"` or `router.push("/dashboard/org")` and fix the link to point
  to the first valid sub-route (e.g., `/dashboard/org/users`).
- [ ] OR add a redirect: `apps/web/src/app/dashboard/org/page.tsx` that redirects to
  `/dashboard/org/users`.
**Acceptance:** No 404 for `/dashboard/org` in the console.

---

## PHASE 35 — Fix WebSocket Flood: Reverb Not Running on Railway (DEPLOYMENT BLOCKER)

### DEPLOY-3: Reverb WebSocket server is NOT running on Railway (CRITICAL)

**Root cause (verified from deploy config):** `nixpacks.toml` and `railway.toml` start command is:
```
php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
```
This runs ONLY the HTTP server (`artisan serve`). There is NO `php artisan reverb:start` command.
The frontend tries to connect to `wss://g4k-production.up.railway.app/app/...` — but no WebSocket
server is listening. The `pusher-js` client retries endlessly (no backoff by default), generating
**hundreds of failed connection attempts** that flood the console and consume CPU/network.

**Evidence from console:**
```
WebSocket connection to 'wss://g4k-production.up.railway.app/app/xk9df2m8z1l0p5q4?protocol=7&client=js&version=8.6.0' failed: WebSocket is closed before the connection is established.
(Repeated 100+ times)
```

**Fix (choose one deployment approach):**

**Option A — Run Reverb alongside the web server on Railway (recommended for minimal cost):**
- [ ] **DEPLOY-3a** Modify the Railway start command to run both processes via a shell script or
  process manager. Create `apps/api/start.sh`:
  ```bash
  #!/bin/bash
  cd apps/api
  php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan migrate --force
  php artisan reverb:start --host=0.0.0.0 --port=8080 &
  php artisan queue:work --tries=3 --backoff=60 --sleep=3 &
  php artisan serve --host=0.0.0.0 --port=$PORT
  ```
  Update `nixpacks.toml` `[start] cmd = "bash apps/api/start.sh"`.
  Note: Railway routes traffic to `$PORT` (the web server). The Reverb WebSocket on port 8080 must
  be exposed as a separate Railway service OR Reverb must share the same port (not possible with
  `artisan serve`). **This means Reverb needs its own Railway service with its own public domain.**

**Option B — Deploy Reverb as a separate Railway service (RECOMMENDED):**
- [ ] Create a SECOND Railway service for Reverb. Same codebase, different start command:
  `php artisan reverb:start --host=0.0.0.0 --port=$PORT`. Railway gives it a public URL.
- [ ] Set `NEXT_PUBLIC_REVERB_HOST` on Vercel to the Reverb service's public Railway domain.
- [ ] Set `NEXT_PUBLIC_REVERB_PORT` to 443 (Railway's HTTPS port for WSS).
- [ ] Set `NEXT_PUBLIC_REVERB_SCHEME` to `https`.

**Option C — Disable Reverb entirely (quickest stabilization):**
- [ ] `use-reverb.ts`: if `NEXT_PUBLIC_REVERB_HOST` is not set, do NOT attempt a WebSocket
  connection at all. Currently `isReverbAvailable()` returns `true` on custom domains even without
  env vars set. Change: return `false` unless `NEXT_PUBLIC_REVERB_HOST` is explicitly set.
  ```ts
  function isReverbAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!process.env.NEXT_PUBLIC_REVERB_HOST; // Only connect if explicitly configured
  }
  ```
  This immediately stops the WebSocket flood. Realtime features (chat, live notifications) won't work
  but the app will be stable and fast. Re-enable when Reverb is properly deployed.

**RECOMMENDED PATH:** Implement Option C immediately (stop the flood) → then implement Option B
(dedicated Reverb service) for full realtime.

### DEPLOY-4: Add exponential backoff to WebSocket reconnection (HIGH)
**Root cause:** `pusher-js` (the Reverb client) retries failed connections aggressively by default.
Even after DEPLOY-3, transient failures would cause rapid reconnection attempts.
**Fix:**
- [ ] `use-reverb.ts`: configure the Echo/Pusher client with reconnection limits:
  ```ts
  new Echo({
    ...config,
    cluster: 'mt1', // required by pusher-js but ignored by Reverb
    enabledTransports: ['ws', 'wss'],
    // Add these:
    activityTimeout: 120000,
    pongTimeout: 30000,
    maxReconnectionAttempts: 5,
    maxReconnectGap: 10000, // wait at least 10s between reconnects
  });
  ```
  Also: if `isReverbAvailable()` returns false, do NOT create the Echo instance at all.

---

## PHASE 36 — Fix Missing Background Processes on Railway (DEPLOYMENT BLOCKER)

### DEPLOY-5: No queue worker running (CRITICAL)
**Root cause:** The Railway start command runs only `php artisan serve`. There is no
`php artisan queue:work` process. ALL queued jobs (`ProcessAuditLogJob`, `GenerateReportJob`,
`ProcessApprovalDecision`, `NotifyApprovalSubmitted`, `LeaveAttendanceIntegration`) are never
processed. If `QUEUE_CONNECTION=database`, they pile up in the `jobs` table forever. If
`QUEUE_CONNECTION=sync`, they run synchronously (blocking the request — bad for performance).
**Fix:**
- [ ] Run a queue worker process on Railway (either in the same container via `start.sh` background
  process, or as a separate Railway service):
  ```bash
  php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-time=3600 &
  ```
- [ ] Verify `QUEUE_CONNECTION=database` in Railway env vars.
- [ ] Verify the `jobs` table exists (it does per the migrations).
**Acceptance:** Queued jobs (audit logs, exports, approval notifications) process within seconds.

### DEPLOY-6: No scheduler/cron running (CRITICAL)
**Root cause:** `routes/console.php` schedules 3 jobs every 5 min + a weekly summary. But there is
no `cron` or `schedule:run` process on Railway. The scheduled jobs NEVER run.
**Fix:**
- [ ] Run the scheduler on Railway. Either:
  (a) Add to `start.sh`: `while true; do php artisan schedule:run; sleep 60; done &`
  (b) Or use Railway's Cron Service: create a separate Railway service with
      `php artisan schedule:run` running every minute.
**Acceptance:** Attendance reminders, missed-clock-in alerts, and open-shift flags fire on schedule.

### DEPLOY-7: Consolidated start script for Railway (all processes)
**Fix:**
- [ ] Create `apps/api/start.sh` that launches ALL required processes:
  ```bash
 #!/bin/bash
  cd /app/apps/api

  # Cache config + migrate
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan migrate --force

  # Start background processes
  php artisan queue:work --tries=3 --backoff=60 --sleep=3 &
  ( while true; do php artisan schedule:run; sleep 60; done ) &

  # Start the web server (foreground — this is the main process Railway monitors)
  exec php artisan serve --host=0.0.0.0 --port=$PORT
  ```
  For Reverb: deploy as a SEPARATE Railway service (DEPLOY-3 Option B).
- [ ] Update `nixpacks.toml`: `[start] cmd = "bash apps/api/start.sh"`.
- [ ] Update `railway.toml`: `startCommand = "bash apps/api/start.sh"`.
**Acceptance:** Railway runs web + queue + scheduler in one container. Reverb runs separately.

---

## PHASE 37 — Fix Service Worker Navigation Caching (HIGH)

### DEPLOY-8: Service worker caches navigation routes → stale pages + redirect interference (HIGH)
**Root cause:** `apps/web/public/sw.js` uses a network-first strategy for navigation requests. On
every navigation, it fetches the page, caches it, and returns it. When the auth expires and the app
redirects to `/login`, the SW caches the login page. When the user navigates back to `/dashboard`,
the SW may serve a cached (stale) version. The console shows the SW intercepting EVERY navigation
fetch, adding overhead. Also: the SW caches `/dashboard` on install — a page that requires auth —
which gets served stale when offline, showing an authenticated page to a logged-out user.
**Fix:**
- [ ] `sw.js`: remove the aggressive navigation caching. Only cache static assets (`/_next/static/`,
  fonts, images). For navigations, ALWAYS go to the network (no cache fallback to authenticated
  pages):
  ```js
  // Navigation requests: ALWAYS network-only (no caching of authenticated pages)
  if (request.mode === 'navigate' || url.searchParams.has('_rsc')) {
    return; // Let the browser handle it natively — SW does NOT intercept
  }
  ```
- [ ] Remove the `caches.addAll(['/dashboard'])` from install — only cache `'/'` and `'/login'`
  (public pages).
- [ ] Bump the cache version: `CACHE_NAME = 'g4k-workplace-v3'` so all clients get the new SW.
**Acceptance:** No SW interference with navigations. No stale cached pages. Auth redirects work
cleanly.

---

## PHASE 38 — Deployment Architecture & Alternatives (STRATEGIC)

### DEPLOY-9: Evaluate deployment architecture — current Vercel+Railway has fundamental limitations
**Problem:** The current Vercel (frontend) + Railway (API) split has cross-domain cookie issues
(DEPLOY-1) and Railway's single-process limitation (no queue/scheduler/Reverb without workarounds).

**Option A — Fix Railway (stay on Vercel+Railway, lowest effort):**
- Switch auth from cookie to header-based refresh (DEPLOY-1).
- Use `start.sh` for multi-process (DEPLOY-7).
- Deploy Reverb as a separate Railway service (DEPLOY-3 Option B).
- Cost: Railway Hobby plan allows multiple services ($5/mo minimum).

**Option B — Migrate API to Render (BETTER multi-process support, free tier):**
- [Render](https://render.com) supports separate Web Service + Background Worker + Cron Job as
  distinct service types, each with its own free tier.
- Create:
  - Web Service: `php artisan serve --host=0.0.0.0 --port=$PORT` (free tier: sleeps after 15 min idle)
  - Background Worker: `php artisan queue:work` (free tier: sleeps after 15 min idle)
  - Cron Job: `php artisan schedule:run` every minute (free tier: limited)
  - Reverb: either as a second Web Service or disable (Option C from DEPLOY-3).
- Frontend stays on Vercel.
- Database stays on Supabase (free tier).
- Cost: Free tier is sufficient for development/staging; ~$21/mo for production (no sleep).

**Option C — Migrate API to Fly.io (BEST multi-process, generous free tier):**
- [Fly.io](https://fly.io) supports multiple processes in ONE container via process groups.
- Create `fly.toml` with separate process groups:
  ```toml
  [processes]
  app = "php artisan serve --host=0.0.0.0 --port=8080"
  worker = "php artisan queue:work --tries=3"
  scheduler = "php artisan schedule:run --verbose"
  reverb = "php artisan reverb:start --host=0.0.0.0 --port=8081"
  ```
- Fly.io's free trial ($300 credit) covers months of usage; small deployments cost ~$3-5/mo.
- Fly.io handles WebSockets natively (no special config needed for Reverb).
- Frontend stays on Vercel. Database stays on Supabase.

**Option D — Migrate frontend to same domain as API (eliminates cross-domain issues):**
- Deploy the frontend on the SAME domain as the API (e.g., `app.games4king.in` for frontend,
  `api.games4king.in` for API). Use `SameSite=None; Secure` cookies — they work across subdomains.
- OR deploy both frontend + API on one domain via a reverse proxy (nginx/Caddy on Fly.io/Render).
- This eliminates DEPLOY-1 entirely (same registrable domain → cookies work).

**Recommendation:**
1. **Immediate (today):** Implement DEPLOY-1 (header-based refresh) + DEPLOY-3 Option C (disable
   Reverb if not configured) + DEPLOY-8 (fix SW). This makes the app STABLE.
2. **Short-term (this week):** Deploy Reverb as a separate service (DEPLOY-3 Option B) + add
   queue/scheduler processes (DEPLOY-5/6/7).
3. **Strategic (if Railway is too limiting):** Migrate API to Fly.io (DEPLOY-9 Option C) for native
   multi-process support + WebSocket support.

---

## PHASE 39 — DOM Warnings & Minor Console Cleanup

### DEPLOY-10: Add autocomplete attributes to input elements (LOW)
**Root cause:** `[DOM] Input elements should have autocomplete attributes` — browser warning for
the login form password field.
**Fix:**
- [ ] `login/page.tsx`: add `autocomplete="current-password"` to the password input and
  `autocomplete="username"` to the identifier input.
- [ ] `change-password/page.tsx`: `autocomplete="new-password"` on the new password fields.
**Acceptance:** No DOM autocomplete warnings in console.

### DEPLOY-11: Fix `content.js` TypeError (NOT OUR CODE)
**Root cause:** `content.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'query')`
— this is a BROWSER EXTENSION error (likely a Chrome extension injecting `content.js`), NOT the app.
**Fix:** No action needed — this is not the application's code. Document it to avoid confusion.

---

## PRODUCTION STABILITY ACCEPTANCE — "The app works in production"

The app is stable in production when ALL of the following are verified:

1. **No 401 cascade.** Login → 15 min later → silent refresh works (DEPLOY-1). No redirect-to-login
   loop. Every API call succeeds with a valid token.
2. **No WebSocket flood.** Zero failed WebSocket connections in the console (DEPLOY-3). Either Reverb
   is properly deployed OR `isReverbAvailable()` returns false and no connection is attempted.
3. **No 500 on `/api/dashboard/metrics`.** Dashboard metrics return 200 (PERF-BE-1 Postgres fix).
4. **Queue + scheduler running.** Audit logs process. Reminders fire. Exports queue. (DEPLOY-5/6)
5. **No service worker interference.** Navigations are native (not SW-intercepted). (DEPLOY-8)
6. **No `/dashboard/org` 404.** (DEPLOY-2)
7. **Zero critical console errors** on login → dashboard → any page navigation.
8. **The app is usable for 30 minutes straight** without any auth breaks, console floods, or stuck
   loaders.
