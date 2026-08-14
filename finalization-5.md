# finalization-5.md — Master Implementation Plan (round 5)

> **The execution plan for `context.md`.** Every task is dependency-ordered, root-cause (not patch), individually
> implementable, and individually verifiable. `§` tags cross-reference `context.md` §8/§9. Apply phase-by-phase;
> run the per-task "Verify" step before moving on. After Phase 7, run the full **Proof Protocol (§VP)** — nothing
> is "done" until it passes for all three roles on the live URL.
>
> **Conventions:** BE = `apps/api`, FE = `apps/web`, UI = `packages/ui`. File paths are repo-relative. Every fix is
> a root-cause fix; no try/hide, no mock data, no manual-refresh workarounds.

---

## PHASE 0 — Infrastructure unblock (do FIRST; every async workflow depends on it)

> **Why first:** audit logging, reports/exports, leave→attendance integration, and ALL reminders are queued/scheduled
> and currently **never execute** (context §6.1). No amount of UI work makes them function until a worker + scheduler
> run. Storage and broadcast fixes also unblock avatar/report/chat-realtime.

### ✅ 0.1 [P0] Start a queue worker + scheduler — context §6.1
**Root cause:** `apps/api/start.sh` only runs `migrate` + `exec octane:start`; no `queue:work`, no `schedule:run`.
**Fix (choose one):**
- (A) In `start.sh`, before `exec octane:start`, launch background loops (Cloud Run `--no-cd`, single container):
  ```sh
  php artisan queue:work database --tries=3 --backoff=60 --max-time=3600 --sleep=3 &
  while true; do php artisan schedule:run --no-interaction & sleep 60; done &
  ```
  (Keep `exec octane:start` as PID 1.)
- (B, preferred for prod) Deploy **separate** Cloud Run services: `g4k-worker` (`php artisan queue:work …`) and a
  Cloud Scheduler → `g4k-scheduler` (`php artisan schedule:run`). Keeps the web service stateless.
**Verify:** `SELECT count(*) FROM jobs WHERE reserved_at IS NULL;` drains after dispatching a test job; an
approval/leave decision writes to `audit_logs`; `schedule:list` shows tasks due.

### ✅ 0.2 [P0] Reconcile migrations + make all idempotent — context §6.2
1. One-off: `php artisan migrate:status`; for every `Pending` row whose schema already exists, insert its
   `migrations` row, then `php artisan migrate` so genuinely-pending ones apply.
2. Wrap every non-idempotent migration body: `if (!Schema::hasColumn('t','c')) {…}` / `if (!Schema::hasTable('t')) {…}`;
   change raw `CREATE INDEX` → `CREATE INDEX IF NOT EXISTS`; guard FK/constraint additions via `pg_constraint`.
   Priority files: `fix_phase_14_schema_integrity`, `add_status_and_index_to_leave_requests`,
   `add_soft_deletes_to_core_tables`, all `..._performance_indexes...`, `add_redo_and_feedback_to_approvals`,
   `add_password_changed_at_to_users`.
3. `start.sh`: decouple Octane from migrate exit code — `php artisan migrate --force --isolated || echo "WARN: migrate failed"`.
**Verify:** `php artisan migrate:status` → **0 Pending**; re-running `migrate` on the live DB is a no-op (no SQLSTATE).

### ✅ 0.3 [P0] Reconcile realtime transport — context §6.5
**Root cause:** `cloudbuild.yaml` uses Pusher; `.env`/code use Reverb pointed at the API's own URL (no WS server).
**Fix:** standardize on **Pusher `ap2`** — set `BROADCAST_CONNECTION=pusher` in `.env` + ensure `PUSHER_APP_ID/KEY/SECRET/CLUSTER`
match the live Pusher app in both `.env` and GCP secrets; remove the self-referential `REVERB_HOST`. (Or, to unblock
immediately: `BROADCAST_CONNECTION=log` until Pusher is confirmed, then switch back.) Ensure `routes/channels.php`
authorizes the private/presence channels the FE subscribes (`private-user.{id}`, `private-conversation.{id}`,
`presence-org`).
**Verify:** trigger a notification in one tab → bell updates in another tab in realtime; chat message appears live.

### ✅ 0.4 [P0] Fix storage (avatar/logo 500) — context §6.4 / §9-SET-2
**Root cause:** Supabase S3 needs path-style; `AWS_USE_PATH_STYLE_ENDPOINT` unset.
**Fix:** set `AWS_USE_PATH_STYLE_ENDPOINT=true` in `.env` + GCP secret; delete the duplicate `supabase` disk in
`config/filesystems.php` and standardize all uploads on `filesystems.default` (`s3`). Update
`ProfileController::uploadAvatar`, `CompanyProfileController::uploadLogo`, `ChatController::sendMessage` to use the
default disk consistently.
**Verify:** upload an avatar → 200, URL resolves, image displays.

### ✅ 0.5 [P0] Deploy hygiene + secrets — context §6.6
1. Rotate every leaked secret (Supabase keys + DB password + JWT, AWS key, GitHub PATs, `APP_KEY`, Pusher secrets).
2. Purge `apps/api/.env` from git history; add to `.gitignore`.
3. `cloudbuild.yaml`: add an **authenticated** smoke step (GET `/api/dashboard/init` + `/api/notifications` with a
   test bearer token + `Accept: application/json`) and a `migrate:status` gate; fail build on non-200 / any Pending.
4. `DatabaseSeeder`: call `CapabilityMatrix::clearCache()` after re-seeding (context §6.3).
**Verify:** `git log --all -p apps/api/.env` shows no secrets; smoke step runs in CI.

---

## PHASE 1 — RBAC & permissions (security + correctness)

### ✅ 1.1 [P0] Block super_admin self-clock (server) — context §9-RBAC-1
**Root cause:** `apps/api/app/Services/CapabilityMatrix.php:13-15` defines `SELF_SERVICE_EXCLUDED` but `hasCapability()`
short-circuits on `*` (`:75-76`) without consulting it.
**Fix:** in `CapabilityMatrix::hasCapability`, **before** the `*` check:
```php
if ($role === 'super_admin' && in_array($capability, self::SELF_SERVICE_EXCLUDED, true)) {
    return false;
}
```
Then `php artisan cache:clear`. (FE deny-list already in place.)
**Verify:** `curl -X POST -H "Authorization: Bearer <admin-token>" …/api/attendance/clock-in` → **403**; HR/Employee → 200.

### ✅ 1.2 [P1] Grant `reports.view` to HR & Employee — context §9-RBAC-2
**Fix:** add `reports.view` to the capabilities catalog and to the `hr` + `employee` rows in `DatabaseSeeder`
(`:50-59`); also add it to the in-memory fallback (`CapabilityMatrix.php:25,31` already has it). Add the
catalog-missing caps (`tasks.manage`, `projects.manage`, `qa.view/manage`, `timer.track`, `reports.manage`) to the
catalog so they're explicit, not `*`-only. Call `CapabilityMatrix::clearCache()` (see 0.5).
**Verify:** HR + Employee GET `/api/reports/data` → **200**.

### ✅ 1.3 [P1] Authorize `GET /users/{id}` — context §9-USER-1
**Fix:** in `UserController::show`, add the same `isSelf || canViewAny || canViewEmployee` gate used by `activity()`
(`:305-316`); return 403 otherwise.
**Verify:** Employee A GET `/api/users/<employee-B-id>` → **403**; self → 200; Admin/HR → 200.

### ✅ 1.4 [P0] Fix `PUT /auth/role` 500 — context §9-AUTH-4
**Root cause:** `AuthController::switchRole:576` calls nonexistent `CapabilityMatrix::getAssignedRoles`.
**Fix:** resolve roles via the existing `RoleAssignment::where('user_id', …)->pluck('role')` (already used at
`:314`), or add `getAssignedRoles(int $userId): array` to `CapabilityMatrix`. (Then consider consolidating with
`POST /auth/role-select` — see 2.4.)
**Verify:** `PUT /api/auth/role` with a valid body → 200 (not 500).

### ✅ 1.5 [P2] Cap-gate command-palette clock commands — context §9-NAV
**Fix:** `apps/web/src/components/app-shell/command-palette.tsx:111-161` — wrap the Clock In/Start Break/Clock Out
actions in `hasCapability(capabilities, "attendance.clock-self")`.
**Verify:** Admin opens Cmd+K → no clock actions.

---

## PHASE 2 — Auth & session reliability

### ✅ 2.1 [P1] Stop cookie-TTL forced logout — context §9-AUTH-1
**Root cause:** `g4k_token` cookie has 15-min `max-age` (`auth-store.ts:48`), only re-set inside `setAuth`; middleware
gates on it, so navigation after 15 min idle bounces a valid session.
**Fix (pick one):**
- (A) Refresh the cookie on each successful `apiFetch` (set it from the response or on a heartbeat).
- (B) Add a `visibilitychange`/interval heartbeat that calls `/auth/refresh` before the cookie expires.
- (C) Lengthen the **cookie** TTL to match the refresh-token window (7d) while keeping the bearer token short-lived
  server-side; middleware validates the cookie by calling `/auth/refresh` server-side is not possible (edge), so
  prefer (A)/(B). **Recommend (A)+(B).**
**Verify:** log in, wait 20 min idle, navigate → **stay logged in** (no `/login` bounce).

### ✅ 2.2 [P1] Fix stuck spinner on logged-out deep-link — context §9-AUTH-2
**Fix:** add `/onboarding`, `/role-select`, `/change-password` to the `middleware.ts` matcher with a "no token →
redirect `/login`" rule; AND in `role-select/page.tsx` + `onboarding/page.tsx`, when `!user`, `router.replace('/login')`
instead of rendering the loader forever.
**Verify:** logged out, paste `…/onboarding` → goes to `/login` (no infinite spinner).

### ✅ 2.3 [P1] Fix capabilities-cookie race after login — context §9-AUTH-3
**Fix:** echo `capabilities` in the `/auth/login` + `/auth/role-select` + `/auth/refresh` responses; write the
`g4k_capabilities` cookie immediately in `setAuth`/on those responses (not only when `useCapabilities` mounts).
**Verify:** log in, immediately navigate to a capability route → no `?error=unauthorized`.

### ✅ 2.4 [P2] Role-select: consume response token — context §9-AUTH-4 (wasteful)
**Fix:** `role-select/page.tsx:33-49` — `setAuth(data.token, data.user, data.active_role, data.refresh_token)` from
the `/auth/role-select` response; drop the second `/auth/refresh`.
**Verify:** role-select makes **one** network call; correct scoped token stored.

---

## PHASE 3 — Backend contract & data correctness

### ✅ 3.1 [P1] `/work-schedules` shape — context §9-SET-1
**Fix (BE, recommended):** `WorkScheduleController::index` → `return response()->json(['data' => $schedules]);`
(matches every other list endpoint). (FE queryFns already guard `Array.isArray(res?.data)`.)
**Verify:** Create/Edit User → Work-Schedule dropdown populated.

### ✅ 3.2 [P1] `/approvals/{id}/decision` id semantics — context §9-LEAVE-2
**Root cause:** controller resolves `Approval::where('id', $id)` but the dashboard widget sends `leave_request.id`.
**Fix:** resolve the approval by `approvable_type=LeaveRequest::class, approvable_id=$id` when `$id` isn't an Approval
id (or change `DashboardController::init` to emit `approvals.id` for leave rows in `pending_approvals`). Also fix the
cache-bust (`LeaveRequest::find($id)` at `LeaveRequestController:142`) to use `$approval->approvable_id`.
**Verify:** approve a leave from the **dashboard widget** → 200 + status flips; from Leave page still works.

### ✅ 3.3 [P1] `AttendanceController::correct` null-deref — context §9-ATT-2
**Fix:** `first()` → `firstOrFail()` (`AttendanceController.php:726`).
**Verify:** correct a bad/missing day → **404** (not 500).

### ✅ 3.4 [P0] Leave balance — context §9-LEAVE-1
**Fix:**
1. Migration: `leave_balances` table (`user_id`, `leave_type`, `year`, `allowed`, `used`, timestamps).
2. Seed/allocate defaults on user create / year rollover.
3. On **approval**: check `used + days <= allowed` per type; deduct in the `LeaveAttendanceIntegration` listener
   (inside the transaction); on **rejection/cancel**: restore.
4. Reject at request time if no balance (422) — or warn and let approver decide; pick a policy and enforce it.
**Verify:** Employee with 0 casual balance → request casual → blocked/flagged; approved leave decrements balance;
rejected restores.

### ✅ 3.5 [P1] Late-detection timezone fix — context §9-ATT-1
**Root cause:** `AttendanceService::reconcileDay:201-206` parses `start_time` as UTC.
**Fix:** build `$scheduledStart` in the company tz (`Carbon::createFromTimeFormat('H:i:s', $start, $companyTz)->setDateFrom($date)`),
compare instants. Make company tz configurable (settings) defaulting to `Asia/Kolkata`.
**Verify:** 09:30 IST clock-in vs 09:00 IST shift + 10 min grace → `late_minutes ≈ 20`.

### ✅ 3.6 [P0] `SendHolidayReminders` method call — context §9-NOTIF-2
**Fix:** implement `NotificationService::sendGlobalNotification(...)` (or switch the command to
`NotificationService::send(...)` / `Notification::create(...)` in a loop). Ensure it routes through the observer for
realtime (see 3.7).
**Verify:** run `php artisan reminders:holidays` → notifications created + bell pushes (no BadMethodCallException).

### ✅ 3.7 [P1] Reminder notifications via observer — context §9-NOTIF-1
**Fix:** in `RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts`, `AttendanceController:909` — replace
`Notification::insert([...])` with `Notification::create([...])` per row (fires `NotificationObserver::created` →
`NotificationCreated` broadcast). Route all notification creation through `NotificationService::send(...)` so
preferences/email apply.
**Verify:** trigger a reminder → bell updates live in the target user's tab.

### ✅ 3.8 [P1] `ApprovalSubmitted` channel + task notifications — context §9-NOTIF, §9-TASK-1
**Fix:** `ApprovalSubmitted::broadcastOn()` — broadcast to a role/department presence channel (not
`user.$this->approval->approver_id` which doesn't exist). Add a `Notification` to the **new assignee** in
`TaskController::store` and on `assignee_id` change in `update`.
**Verify:** assign a task → assignee gets a bell notification; leave submission → approver channel receives.

### ✅ 3.9 [P2] Wrap sync broadcasts — context §8 (P2)
**Fix:** wrap `broadcast(...)`/`event(...)` in `try/catch` (or move to `DB::afterCommit`) in:
`AnnouncementController::store:41`, `TaskController:110,168`, `ChatController::sendMessage:104`. Mirror
`ApprovalService::approve`'s pattern. Prevents a broadcaster failure from 500-ing a successful write.
**Verify:** with broadcaster down, posting an announcement/chat still returns 200.

### ✅ 3.10 [P2] Models: apply SoftDeletes trait — context §8
**Fix:** add `use SoftDeletes;` to `Department`, `Project`, `Task` (import present, trait not applied → `deleted_at`
dead). Decide Department's `archived_at` vs `deleted_at` (pick one).
**Verify:** soft-delete a department → excluded from default lists; restore works.

### ✅ 3.11 [P2] Reports correctness — context §8
**Fix:** redefine `productivity_score` (document it; don't multiply by hours) (`ReportController:84`); fix
`leaveSummary` to use overlap predicate `start_date <= end AND end_date >= start` (`:181-184`).
**Verify:** a leave spanning the window boundary is counted; productivity score is meaningful.

### ✅ 3.12 [P2] Attendance edge cases — context §8
**Fix:** honor holidays in `reconcileDay` (status `holiday`, skip late); track midnight-crossing open shifts;
respect each schedule's `working_days` in reminder jobs (not hardcoded "skip Sunday"); guard Feb-29 recurring
holidays. (Open-shift time in `total_seconds`: document the client-timer dependency or compute an "as-of" segment.)
**Verify:** holiday → no "absent/late"; a Sat-off schedule → no Saturday reminder.

---

## PHASE 4 — Frontend data layer & cache invalidation

### ✅ 4.1 [P1] Fix dead invalidation keys — context §9-DASH-1/2
**Fix:** `announcement-board.tsx` (:35,51,63,72,91) and `quick-task-widget.tsx` (:36) → invalidate
`queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit })` (not `queryKeys.announcements` /
`queryKeys.dashboardMetrics`, which no query reads).
**Verify:** post/pin/delete an announcement → board refreshes without manual reload.

### ✅ 4.2 [P1] Invalidate `dashboardInit` on cross-cutting mutations
**Fix:** add `queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit })` to the `onSuccess`/`onSettled`
of: `use-user-actions` (delete/restore), `leave-approval-actions-cell:63`, task CRUD mutations.
**Verify:** approve a user delete / leave / task → dashboard metric widgets refresh.

### ✅ 4.3 [P1] `quick-task-widget` array guard — context §9-DASH-2
**Fix:** `quick-task-widget.tsx:23` → `const users = Array.isArray(usersData?.data) ? usersData.data : [];`
**Verify:** no `.map is not a function` when `/users` returns a non-array.

### ✅ 4.4 [P1] `upcoming-holidays-widget` date guard — context §9-DASH-3
**Fix:** use `safeFormat` (`lib/format.ts`) at `:77`; reject invalid dates in the `.filter`.
**Verify:** no `RangeError: Invalid time value` with a malformed holiday date.

### ✅ 4.5 [P1] `profile` designations queryFn guard — context §9-USER (FE)
**Fix:** `profile/page.tsx:74-77` → `.then(res => Array.isArray(res?.data) ? res.data : [])`.
**Verify:** Profile page loads without crash on a non-array designations payload.

### ✅ 4.6 [P2] Offline replay invalidates cache — context §8
**Fix:** `offline-engine.ts` `syncPendingRequests`/`syncPendingPunches` → on successful sync, invalidate
`queryKeys.dashboardInit` (+ relevant keys) via the shared queryClient (dispatch a window event the dashboard
listens to, or import queryClient).
**Verify:** queue a mutation offline, go online → list updates after replay.

### ✅ 4.7 [P2] Realtime gaps — context §9 (DASH)
**Fix:** subscribe `AdminTodayAttendanceWidget`/`HrTeamAttendanceWidget` to `.attendance.updated` (or invalidate
`dashboardInit` on it); fix the `.approval-status-change` handler to invalidate `dashboardInit` too.
**Verify:** another user clocks in → admin/HR dashboard attendance widget updates within seconds.

### ✅ 4.8 [P2] Dedupe error toasts — context §8
**Fix:** either drop per-mutation `onError` toasts (keep the global `MutationCache.onError` in `providers.tsx:58-73`)
or gate the global one. Pick one source of truth.
**Verify:** a failed mutation → exactly one error toast.

### ✅ 4.9 [P2] `recent-activity-widget` shape — context §9 (DASH)
**Fix:** confirm whether `/dashboard/init` returns `recent_activity` top-level or nested under `metrics`; align the
select (`:15`) and render (`:67`) to the same path.
**Verify:** widget shows real recent activity (not always empty).

---

## PHASE 5 — UI/UX & design system

### ✅ 5.1 [P1] Calendar react-day-picker v8→v9 classNames — context §9-UI-1
**Fix:** `packages/ui/src/components/calendar.tsx:32-43` — rename modifier keys to v9 bare names
(`day_selected`→`selected`, `day_today`→`today`, `day_disabled`→`disabled`, `day_outside`→`outside`,
`day_range_middle`→`range_middle`, `day_range_end`→`range_end`, add `range_start`) and structural keys to v9
(`caption`→`month_caption`, `nav_button_previous`→`button_previous`, `nav_button_next`→`button_next`,
`table`→`month_grid`, `head_row`→`weekdays`, `head_cell`→`weekday`, `row`→`week`). Verify visually across
leave-request-form, FilterBar date-range, attendance/calendar, holiday-calendar.
**Verify:** selected day shows the themed highlight; today ring; disabled line-through; range middle/end shaded.

### ✅ 5.2 [P1] `DataTable` loading state — context §9-UI-2
**Fix:** add `isLoading?: boolean` + `skeletonRows?: number` to `DataTable`; render `<Skeleton>` rows when true;
wire in `approvals-tab`, `report-builder`, `leave-history-table` (which currently renders `null` while loading).
**Verify:** first fetch shows skeletons, not "No records found".

### ✅ 5.3 [P1] `mail-smtp-config` themed inputs — context §9-UI-3
**Fix:** replace the 7 raw `<input>` (`mail-smtp-config.tsx:128…180`) with themed `Input`/`PasswordInput`.
**Verify:** SMTP form matches the design system; password has show/hide.

### ✅ 5.4 [P2] FilterBar single-date themed + missing states
**Fix:** `filter-bar.tsx:211` `type:"date"` → Popover+Calendar (like `date-range`). Add error/retry to
`attendance/page.tsx`, `approvals-tab.tsx`, `leave-history-table.tsx`, `report-builder.tsx`, `profile/page.tsx`,
`notifications-config.tsx`.
**Verify:** each page shows skeleton→content or error+retry (never blank / misleading empty).

### ✅ 5.5 [P2] Remove hard reloads — context §8
**Fix:** `leave-request-form.tsx:47` (`window.location.href`→`router.push`+invalidate), `approvals-tab.tsx:180`
(`window.location.reload()`→URL state update).
**Verify:** leave submit + filter change don't reload the page.

### ✅ 5.6 [P2] Token adoption finish — context §5
**Fix:** replace the 52 `bg-violet-600`/`text-violet-600` → `bg-primary`/`text-primary` (so dark theme recolors);
introduce/adopt a radius token for the pebble radii (replace `rounded-md`/`rounded-lg` where meant to be `rounded-xl`).
**Verify:** toggle dark mode → primary color + radii consistent everywhere.

### ✅ 5.7 [P2] Breadcrumb hierarchy + dead code — context §8
**Fix:** add a label/grouping map to `breadcrumb.tsx` so `/dashboard/admin/*`, `/dashboard/org/*` render correct
hierarchy. Delete: dead `TopbarTimer`, orphan `dashboard/sessions/error.tsx`, dead NavItem prefetch branches, dead
`DataTable` virtualizer code. Consolidate the two "Settings" destinations.
**Verify:** breadcrumbs read correctly; no dead files.

---

## PHASE 6 — Navigation & role routing

### ✅ 6.1 [P1] Surface admin/reports pages in nav — context §9-NAV-1
**Fix:** add `/dashboard/admin/attendance` (`admin.view-all-attendance`), `/dashboard/admin/reports` +
`/dashboard/reports` (`reports.view|reports.manage`) to `navGroups` (`dashboard/layout.tsx:43-58`) and the command
palette for authorized roles.
**Verify:** Admin sidebar → Admin Attendance + Reports reachable.

### ✅ 6.2 [P2] Nav cap-key + gating consistency — context §9-NAV
**Fix:** Communications nav (`dashboard/layout.tsx:48`) `directory.send-message` → `chat.access`; hide avatar
"Settings" link when `!hasCapability(settings.manage)`; add `/dashboard/reports` to the middleware PROTECTED map.
**Verify:** Employee sees no Settings link; Communications gated on chat access.

---

## PHASE 7 — Build, verify, deploy

### ✅ 7.1 Build clean
`pnpm --filter web build` + `pnpm --filter api build` (or `composer`/artisan route:view cache) → **zero errors**.

### ✅ 7.2 §VP — Verification Protocol (run for Admin, HR, Employee)
**BE (terminal):**
```bash
BASE=https://g4k-api-579515345084.asia-south1.run.app
# guest → 401; authed → 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/api/notifications                                   # 401
for r in admin hr employee; do
  TOK="$(login and grab token for role $r)"
  for ep in dashboard/init notifications directory reports/data users; do
    printf "%-8s %-22s " "$r" "$ep"; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOK" -H "Accept: application/json" $BASE/api/$ep
  done
done
# RBAC
curl -X POST -H "Authorization: Bearer <admin-token>" $BASE/api/attendance/clock-in → 403
php artisan migrate:status | grep -c Pending   # 0
SELECT count(*) FROM jobs WHERE ...            # drains
```
**Cloud Logging (24h) — zero hits:** `RouteNotFoundException`, `SQLSTATE[42701|42703|42P01]`, `cURL error 60`,
`BadMethodCallException`, `getAssignedRoles`, `reading 'length'`.
**FE (clean incognito, no extensions), each role:** dashboard renders <2s with real data; no console errors; no
`ErrorBoundary`; avatar uploads; leave request blocked by balance; approve from dashboard widget works; reports load
for HR/Employee; date pickers styled; responsive 360/768/1280; no forced logout after 20 min idle; deep-links work.

### ✅ 7.3 Deploy
Push to both repos (`Mi2004klk/g4k-v5`, `arsathmalik0-netizen/G4K`); confirm Vercel new build hash; confirm Cloud
Run new revision; re-run §VP against live.

---

## Dependency map (why this order)

```
Phase 0 (infra) ──► unblocks: audit logs, reports/exports, reminders, avatar, realtime
   │
   ├─► Phase 1 (RBAC) ─► Phase 2 (auth)   (auth depends on correct caps; cap cache cleared in 0.5)
   │
   ├─► Phase 3 (BE contracts/data)        (leave balance needs worker for restore? no—sync; but reports need worker)
   │
   ├─► Phase 4 (FE cache)                 (depends on 3.1/3.2 contract fixes)
   │
   ├─► Phase 5 (UI)  ─► Phase 6 (nav)     (independent of BE; nav after pages exist)
   │
   └─► Phase 7 (verify/deploy)            (after all above)
```

Independent tracks that can be parallelized: **Phase 1+2** (auth/RBAC), **Phase 3** (BE contracts), **Phase 5**
(UI/styling), **Phase 6** (nav) can proceed concurrently once Phase 0 lands.

---

## Definition of done (the whole app, not per-task)
1. **§VP passes for Admin, HR, Employee** on the live URL.
2. A queue worker + scheduler run; `audit_logs` and reports populate; reminders fire.
3. Admin cannot clock in (403 + no UI); HR/Employee can; reports open for HR/Employee.
4. Leave is balance-controlled; approve-from-dashboard works.
5. No forced logouts on valid idle sessions; deep-links work; no stuck spinners.
6. Avatar/logo upload works; realtime (chat/notifications/announcements/attendance) is live.
7. Date pickers, tables, forms, states, and responsiveness are correct at 360–1536px.
8. Cloud Logging clean for 24h; secrets rotated + purged; CI smoke test authenticated.
