# Games4Kings Workplace OS — Full-Stack End-to-End Audit Report

> **Date:** 2026-08-21 · **Auditor:** ZCode zero-trust audit (fresh pass, no findings carried over)
> **Spec source:** *Games4Kings Workplace OS — Complete Product Documentation, version 2026-08-19* (all 20 sections + appendices A–E)
> **Code audited:** repo HEAD (`7c606e2` + working tree) — `apps/api` (Laravel), `apps/web` (Next.js), `packages/ui`
> **Live-probed:** https://g4k-v5.vercel.app + https://g4k-api-579515345084.asia-south1.run.app/api (admin session)
> **Method:** every page/route × 8 lenses (workflow completeness, RBAC, sync/data-consistency, micro-features, non-functional UI, duplicates, missing features, UX consistency); static code audit + live production probing; every Critical below independently re-verified line-by-line by the lead auditor (not just agent-reported).

---

## 0. TL;DR

The platform's **foundations are strong** — auth/session security, attendance state machine, leave approval chain, RBAC capability middleware, scheduler/queue deployment, realtime broadcasting, and dashboard customization all match the spec closely. But a systematic **frontend↔backend contract drift** has broken the **entire task-submission pipeline and several adjacent flows at the UI layer**: 10 Critical findings, of which 8 are "button exists, request can never succeed" breaks. Production additionally runs an **older web build than HEAD** (settings tabs unswitchable by click live, stale sidebar) and records **bogus audit IPs** (Cloud Run trusted-proxy misconfig). The spec's three showcase features — task submit→approve, announcement priorities, demo-data removal — are all currently dead from the UI.

**Severity totals: 10 Critical · 29 High · 55 Medium · 31 Low · 13 Info** (details per category below; IDs stable, file:line referenced).

**Top 10 by blast radius:**
1. `AUD-TASK-1` Task "Submit for Review" always 422s (field mismatch) — the core workflow of the product is unusable from the UI.
2. `AUD-TASK-5` Quick Task widget silently drops the assignee — creates unassigned tasks, nobody is notified.
3. `AUD-TASK-6` Bulk "Mark Done" sends an invalid status; task list status filter offers invalid values.
4. `AUD-ANNC-1` Announcement composer has no priority selector — Normal/High/Urgent + bell high-priority badges unreachable.
5. `AUD-SET-2` "Remove Demo Data" purge **truncates the real `audit_logs` and `notifications` tables** — destroys production records and audit immutability.
6. `AUD-SET-1` "Remove Demo Data" button can never succeed (UI never sends the required typed confirmation to the API).
7. `AUD-REPORT-1` Attendance Summary export always fails (missing `case` label in the job).
8. `AUD-TASK-11` Task scope "Individual" does not exist in DB/API/UI; Department/Role scopes have no targeting columns.
9. `AUD-DEPLOY-1` Production web build is older than HEAD — several already-fixed bugs are still live; shipping the current tree is a prerequisite for meaningful QA.
10. `AUD-LIVE-1` Every audit row on production records IP `169.254.169.156/126` (link-local) — the spec's per-action IP capture is broken in prod.

---

## 1. Deployment & Live-Production Findings

| ID | Severity | Finding |
|---|---|---|
| AUD-DEPLOY-1 | **High** | **Production web build lags HEAD (deploy drift).** Live evidence: `/api/frontend-version` route 404s on prod (returns HTML); Settings tab clicks do nothing on prod (URL stays `?tab=audit`, selected tab unchanged — verified twice) while local `settings-tabs.tsx:46,125` wires `useUrlState` + `onValueChange` correctly; live sidebar lacks "Attendance & Time", "Audit Logs", "System Settings", "User Management" entries present in `layout.tsx:45-64`; Company Profile timezone combobox shows empty "Select Timezone" placeholder live. Every "works locally, broken live" item below must be re-verified after the next deploy. |
| AUD-LIVE-1 | **High** | **All audit-log IPs on production are `169.254.169.126`** (Cloud Run link-local address) — trusted-proxy / `X-Forwarded-For` not configured for the API container. Spec §11.10 requires the real origin IP per action; compliance value of the audit trail is currently zero for IP attribution. Check `TrustProxies` middleware / Cloud Run `X-Forwarded-For` handling. |
| AUD-LIVE-2 | Medium | **Audit log renders `login` actions attributed to "System"** and subject labels as raw "User #118" links pointing to the directory root (live, settings → Audit Log). Deferred/queued audit writes appear to lose the user relation; the dashboard Recent Activity feed renders names correctly, so it's a table-render + write-path inconsistency. |
| AUD-LIVE-3 | Low | **Admin "Recent Activity" feed is dominated by punch events** ("Clocked In For The Day" ×12 visible) — `DashboardController.php:258` excludes only `login/logout/viewed`, not `attendance.*`. Spec §4.3 says "important actions"; punches bury decisions. |
| AUD-LIVE-4 | Info | Login throttling verified live: after ~6 attempts/min from one IP (mixed identifiers), further attempts are blocked (route `throttle:6,1`, api.php:53). Note the shared-IP (office NAT) caveat under AUD-AUTH-9. |
| AUD-LIVE-5 | Info | API healthy on prod: `/api/ping` OK, DB connected, 13 users, all migrations through `2026_08_18_213052` applied. Worker Cloud Run service (`g4k-worker`, min-instances=1) runs `schedule:work` + `queue:work` in supervision loops (`start-worker.sh`) — the historical "dead scheduler/queue" root cause is fixed at the infra level. Pusher + S3 (Supabase) configured. |
| AUD-LIVE-6 | Info | Fresh admin session, dashboard and settings pages: **zero console errors**. All 7 admin widgets rendered with real data; 10 pending approvals (leave+task+project mix) with working deep links. |

---

## 2. Cross-Cutting Findings

### 2.1 Sync / Data Consistency

| ID | Severity | Finding |
|---|---|---|
| AUD-SYNC-1 | Medium | `user_metrics_{user}_{role}` cached 300s (`DashboardController.php:40`) is **never invalidated** — all mutation paths clear `dashboard_init_*`/`dashboard_metrics_*` but the init endpoint re-hydrates from the stale `user_metrics_*` key, so dashboard metrics (pending tasks, active projects, counts) can lag ≤5 min even after explicit invalidations. |
| AUD-SYNC-2 | Medium | `team_today_{role}_{dept}_{date}` cached 60s (`AttendanceController.php:269`) is **not invalidated on punches** — `handlePunch` (lines 87-91) clears dashboard keys only. The realtime `AttendanceUpdated` broadcast triggers an HR refetch that is served the cached payload → HR team console contradicts spec §5.9 "updates automatically, no refresh needed" for up to a minute. |
| AUD-SYNC-3 | Medium | `announcements_{user}_{role}` dashboard cache (120s, `DashboardController.php:179`) never flushed on announcement mutations (no `Cache::forget` anywhere in `AnnouncementController`) — new announcements don't reach dashboards for ≤2 min despite the client-side realtime invalidate (which just re-fetches stale cache). |
| AUD-REPORT-4 | High | **Cross-HR cache leak:** attendance/leave summary cache key collapses every manage-capable user to `'admin'` (`ReportController.php:191,233`) — two HR managers with different department scopes share one cached result set for 5 minutes, each seeing the other's department rows. |
| AUD-SYNC-4 | Medium | Disabling the notification-sound preference **kills the entire live broadcast**, not just audio: `NotificationCreated::broadcastWhen()` returns `false` when `prefs.notifications.sound` is off (`app/Events/NotificationCreated.php:41-52`); frontend disables polling while "connected", so those users receive no live notifications at all. |
| AUD-TASK-21 | Medium | `submitReviewMutation` invalidates only the `task-detail` query — Kanban board/list stay stale after submitting (`task-overview-tab.tsx:93`). |
| AUD-CHAT-11 | Info | Messages cursor-paginate on non-unique `created_at` only (`ChatController.php:93-94`) — identical timestamps can skip/duplicate across pages. |
| AUD-CHAT-10 | Low | Project-chat membership is frozen at creation; adding members to a project later never adds them to the conversation (`ProjectController.php:203-205` vs `113-120`). |
| AUD-ANNC-8 | Low | Emoji reactions are not broadcast — other users' reactions never live-update. |

### 2.2 RBAC / Scoping

| ID | Severity | Finding |
|---|---|---|
| AUD-PROJ-3 | High | **HR sees and manages ALL projects.** HR capability `projects.manage` (`CapabilityMatrix.php:26`) + `ProjectController@index` (:45) returns everything; `update/destroy/review` have zero HrScope — HR can edit/delete/approve any project company-wide. Spec §7.1 scopes HR to created + own departments. |
| AUD-ANNC-4 | High | HR can post **company-wide** announcements (store checks only `announcements.manage`; composer exposes "Company-wide" to HR) — spec §8.10 reserves company-wide for Admin. |
| AUD-ANNC-5 | Medium | HR can target any `team_id` when posting team announcements — only `exists:teams,id` is validated, no HrScope on store/update (`AnnouncementController.php:66,76,141-143`) → cross-department spoofing. |
| AUD-TASK-26 | Medium | `TimerController::logTime` skips authorization on the project-only branch — any employee can log time against arbitrary projects (`TimerController.php:27-48`; contrast `setActive:106-115`). |
| AUD-TASK-27 | Medium | `TaskReminderController` performs no participant/ownership check and no task-existence validation — reminders can be set on anyone's task; bad IDs 500 (`TaskReminderController.php:10-25`). |
| AUD-CHAT-5 | Medium | Mention IDs are not validated against conversation membership — arbitrary `mentions[]` user IDs trigger notifications linking to conversations the target cannot open (`ChatController.php:117-118,146-159`). |
| AUD-DEACT-TOKENS | Medium | **Deactivated users keep working tokens:** `updateStatus` doesn't revoke tokens (`UserController.php:293-334`), `auth/refresh` never re-checks `status` (`AuthController.php:263-368`), and no per-request status middleware exists — a deactivated user's session survives up to 7 days. Spec §18.2: deactivation blocks access immediately. |
| AUD-DIR-4 | Medium | Departments/Designations tabs render for every role in the Directory UI (employees get an empty dept list; designations readable by all) — spec §9.4 reserves both for Admin (mutations are API-blocked, so display-only leak). |
| AUD-CHAT-2 | Medium | Message pinning allows `chat.manage` OR `projects.manage` in **any** conversation scope — spec §8.6: HR only, project chats only (`ChatController.php:289-295`, mirrored `chat-tab.tsx:36`). |
| AUD-TASK-22 | Medium | Gantt/Timeline view not restricted to HR/Admin in UI (`tasks-tab.tsx:588`) — spec §7.6c. |
| AUD-PROJ-10 | Medium | `ApprovalService::checkRoleGating` validates **leave** capabilities (`leave.approve-hr`/`leave.approve-employee`) even for task/project approvals (`ApprovalService.php:51-55`) — wrong capability domain; currently passes only because HR happens to hold the leave caps. |
| AUD-LEAVE-5 | Low | Sole-super-admin self-approval exception (`ApprovalService::approve/reject`) contradicts spec §2.3 "nobody can approve their own requests — without exception" (operationally necessary; document or add a second admin). |
| AUD-DIR-13 | Info | HrScope implicitly includes the HR's own `department_id` even without a `department_hr` assignment (`Support/HrScope.php:22-24`) — broader visibility than the Dept→HRs tab implies. |

### 2.3 UX / Visual Consistency

| ID | Severity | Finding |
|---|---|---|
| AUD-UX-1 | Medium | Priority color semantics deviate from spec §7.8 (gray/yellow/orange/red): medium=blue, high=amber platform-wide (`packages/ui/src/theme/semantic.ts:10-15`). |
| AUD-UX-2 | Medium | **Sidebar structure ≠ spec §17.5 navigation map:** implementation is flat (3 groups + in-page tabs); documented per-role trees ("All Projects / All Tasks / Progress Overview / Global Tasks / Project-Specific Tasks", "Team → HR Accounts / Employee Accounts") don't exist as navigable destinations; "User Management" nav item just points at `/dashboard/directory` (duplicate label, `layout.tsx:55`). Either implement the documented tree or update the spec. |
| AUD-UX-3 | Low | Stale accent mapping references deleted route `/dashboard/org/users` (`layout.tsx:75`); stale "Pins removed" comment while pins are active (`layout.tsx:137`). |
| AUD-UX-4 | Low | Task-status chip colors: Gantt CSS defines classes for non-existent statuses `completed/redo/overdue` while `.gantt-task-done` has no rule → Done bars unstyled (`task-gantt.tsx:212-216`). |
| AUD-UX-5 | Low | Overdue highlighting compares against status `"completed"` which never exists (real value `done`) — done tasks can render overdue (`tasks-tab.tsx:547`). |
| AUD-UX-6 | Low | Spec §4 "refresh icon on hover per widget" — widget hover overlay exposes only the drag handle; no per-widget refresh affordance (`widget-engine.tsx:325-336`). |
| AUD-UX-7 | Info | Login identifier label says "Email or Employee ID" and placeholder shows `EMP-1042`, but usernames also work and real IDs are `G4K-###` (login/page.tsx:135). |
| AUD-UX-8 | Low | No duplicate-component explosion found (canonical ConfirmDialog/empty-state/token migration commits hold); the one remaining duplication is the dead reminder mutation pair (`task-detail-sheet.tsx:195-220` unused vs broken `task-overview-tab.tsx:46-71`).

---

## 3. Module Findings

### 3.1 Auth, Onboarding & Sessions

**Verified OK:** identifier login (email/employee-id/username) with timing-attack dummy hash; 5-attempt/10-min lockout with live countdown on the 423 path; forced password change (unskippable middleware `ForcePasswordChange`, routes allow-listed); forced onboarding (allow-list incl. sessions/role-select); 3-step onboarding with skippable password when not forced; post-flow routing (change-password → onboarding → role-select → dashboard) with no dead-ends; role-select validates assignment, auto-selects single role, clears query cache; refresh-token rotation + httpOnly/SameSite=Lax/Secure cookie + silent-refresh mutex with single-flight (`api-client.ts:104-155`); password reset 60-min tokens, revokes all sessions; password-change revokes + reissues tokens; password policy + expiry flagging; max-device enforcement; suspicious-login detection → HR+Admin urgent notifications + email; session list/remote revoke with `SessionRevoked` realtime logout; multi-tab BroadcastChannel auth sync; 403 `needs_onboarding`/`must_change_password` store-repair in api-client (fixes the historical dead-end).

| ID | Severity | Finding |
|---|---|---|
| AUD-AUTH-1 | Medium | **Lockout from another IP shows no countdown:** user-level lockout (`failed_attempts>=5 → status locked`) returns generic 422 "Invalid credentials" (`AuthController.php:114-126`); only the same-IP RateLimiter branch returns 423 + `retry_after` that the login page's countdown consumes (login/page.tsx:92-94). Spec §3.4 requires the live countdown during any lockout. |
| AUD-AUTH-2 | Medium | `auth/refresh` performs no user-status check — inactive/locked users keep refreshing valid tokens until expiry (component of AUD-DEACT-TOKENS; `AuthController.php:263-368`). |
| AUD-AUTH-3 | Low | `forgotPassword` creates a pending in-app admin request even when SMTP **is** configured and the email was sent (`AuthController.php:443-446`) — admin queue noise; spec routes the in-app path only when email is unavailable. |
| AUD-AUTH-4 | Low | Frontend dead code: `res.email_not_configured` / `res.email_send_failed` are checked (forgot-password/page.tsx:51-59) but the API never returns those flags — users without SMTP are still told a reset link "has been sent to your email". |
| AUD-AUTH-5 | Low | Onboarding step/field state is React state only — closing the app mid-onboarding restarts at step 1 and loses typed phone/emergency values (`onboarding/page.tsx:35-39`). Flow-level resume works (login re-routes), but spec §3.6 "paused and resumed, not lost" is only partially met. |
| AUD-AUTH-6 | Low | `g4k_token` cookie set without `Secure` attribute (`auth-store.ts:57`) — bounded risk (15-min access token), still worth tightening. |
| AUD-AUTH-7 | Low | `roleSelect` deletes ALL refresh tokens matching `{device}_refresh` by name (`AuthController.php:387`) — two devices reporting the same device_name kill each other's refresh tokens. |
| AUD-AUTH-8 | Info | Forced-password-change middleware blocks `auth/sessions` and `auth/role-select` (allow-list only change-password/logout, `ForcePasswordChange.php:22`) — spec §3.6 allows sessions during restricted states (minor, onboarding gate is the one that matters). |

### 3.2 Dashboards & Widgets

**Verified OK:** role widget catalogs match spec §4 exactly (Admin 6 / HR 7 incl. time-clock gated by `attendance.clock-self` / Employee 8); WidgetEngine drag+resize+collapse+dismiss with server-persisted per-user layouts (versioned schema + `reconcileLayout` migration), debounced saves, per-widget ErrorBoundary (independent load/fail), Customize Dashboard dropdown + Reset to Default; restore of hidden widgets under Profile → Preferences (spec-conformant); attendance_today excluded from volatile cache; quick notes + holidays + announcements + quick task widgets all present; pending approvals unify leave+task+project with deep links; HR/employee metric scoping via HrScope.

| ID | Severity | Finding |
|---|---|---|
| AUD-DASH-1 | Medium | HR `pending_approvals` metric counts project reviews **globally** (`DashboardController.php:306`) while the init() list is HR-scoped (:144-160) — badge count and list length disagree for HR. |
| AUD-DASH-2 | Low | Quick-Notes widget exists only in the employee catalog — HR/Admin can't pin notes to their dashboard despite spec §14.18 being role-agnostic. |
| AUD-DASH-3 | Low | Admin "Total Employees" live count says 13 with 1 present/12 absent but the metric caches (`dashboard_global` 300s) mean new hires/deactivations lag 5 min (related AUD-SYNC-1). |
| AUD-DASH-4 | Info | Employee `pending_approvals` = own pending leaves + member-projects in review; task submissions handled via `/tasks/submitted` widget (spec-conformant split). |

### 3.3 Attendance & Time

**Verified OK:** clock state machine race-safe (row lock + idempotency by `client_id`, duplicate punches are no-ops); clock-out-while-on-break auto-closes the break; overnight/48h shift windows with reconciliation anchored to shift-start date; late = first clock-in > schedule start + grace; overtime = worked − standard (breaks excluded); holiday detection incl. recurring + Feb-29→Feb-28; manual-correction days preserve corrected status; `meToday/meDay/meHistory` return punch timeline + project/task time-rollups (spec §5.6); corrections require reason (≤500), write before/after audit, notify the employee, force recompute; HR day/history endpoints scope-checked; team-today with pending-leave detection + sorting; admin overview with date/status/department/search filters, `open` status filter, 20/50/100 pagination, ETag caching; attendance export → background job; reminders scheduled (shift-start 15-min, missed-clock-in 30-min, open-shift flagging every 5 min, company timezone); work schedule resolution user→default.

| ID | Severity | Finding |
|---|---|---|
| AUD-ATT-1 | Medium | See AUD-SYNC-2 (team-today cache) — HR live console is the spec's flagship "real-time, no refresh" view and currently lags. |
| AUD-ATT-2 | Low | Working on a holiday renders the day as "holiday" (status overrides even with clock-ins, `AttendanceService.php:252-258`) — spec color guide expects present/overtime for worked days; totals are computed but the calendar color misleads. |
| AUD-ATT-3 | Low | `notifyOpenShifts` writes no audit entry and is gated `admin.view-all-attendance` (admin-only) — HR cannot trigger open-shift alerts for their own dept despite being the stated audience (`AttendanceController.php:759-805`). |
| AUD-ATT-4 | Info | `correct()` allows HR to correct their own attendance (HrScope includes self) — spec's no-self-approval rule covers approvals, not corrections; acceptable but worth a policy decision. |
| AUD-REPORT-11 | Low | HR/Admin attendance **graph tabs call non-existent endpoints** `/attendance/hr/graph`, `/attendance/admin/graph` (`hr-attendance-view.tsx:37`, `admin-attendance-view.tsx:59`) — Trends/Graphs tab (spec §5.9/§5.10) 404s. |

### 3.4 Leave

**Verified OK:** request validation (start > today, end ≥ start, reason ≤1000, 4 types); overlap check incl. approved; balance check counting **working days only** (skips holidays + non-working days per schedule); DB-unique-violation race fallback; approval routing employee→HR, HR→Admin (`ApprovalService::submit`); self-approval blocked (with sole-admin exception); decision requires reason on reject; approve → status + atomic balance increment + attendance days reconciled via listener; reject-after-approve rolls back balance + reconciles; cancel: pending freely, approved-future allowed with balance restore + day reconciliation (superset of spec §6.7); admin history/pending HR-scoped; 30s IndexedDB form drafts with restore banner; client-side overlap pre-check; balance display; export → background job; holiday CRUD with recurring + cache invalidation; 10-day holiday reminders scheduled.

| ID | Severity | Finding |
|---|---|---|
| AUD-LEAVE-1 | Medium | `decision()` resolves the approval by `id OR approvable_id` and never verifies `current_approver_role` in the controller — relies entirely on `ApprovalService::checkRoleGating` (which checks the wrong capability domain for tasks/projects; see AUD-PROJ-10). Defense-in-depth gap on the leave path is acceptable, but the id-or-approvable_id union can match the wrong row when ids collide across meanings (`LeaveRequestController.php:204-208`). |
| AUD-LEAVE-2 | Low | HR/Admin administrative cancel does **not** notify the employee (`LeaveRequestController.php:439-468` — no Notification in that branch). |
| AUD-LEAVE-3 | Low | Balance year for multi-year ranges uses only the start-date year; a request spanning Dec→Jan decrements one year's balance and reconciles both months (edge, spec silent). |

### 3.5 Tasks (Kanban / List / Gantt / QA)

**Verified OK (backend + parts of UI):** Kanban 4 columns with drag-between-status + persisted reorder; blocked-task guard on drag/update; circular-dependency detection; dependency arrows in Gantt; blocked badges; completion note + QA validation required at API; redo requires reason → in_progress + notify; approve → done + notify + cache invalidation; employee task creation gated per-project `allow_employee_tasks` + self-assign-only; employee edit whitelist (status/progress/due/description) enforced at API; title ≤255; min time log 1 min (API); pagination 20/50/100; QA builder covers all 8 spec field types + extras; QA gating by capability; personal reminders dispatched by scheduler with owner-only visibility; personal tasks private; recurrence UI in collapsible Advanced section; assignee notifications on create/reassign; HR/Admin can assign into personal lists.

| ID | Severity | Finding |
|---|---|---|
| AUD-TASK-1 | **Critical** | **"Submit for Review" always 422s.** Frontend sends `notes` (`task-overview-tab.tsx:86`), API requires `submission_note` (`TaskController.php:445-447`). The entire submit→review→approve pipeline — the product's core loop (spec §7.15/§15.1) — is unusable from the UI. *(Verified live-line by lead auditor.)* |
| AUD-TASK-2 | **Critical** | **Task comments always fail.** Frontend sends `content` (`task-comments-tab.tsx:27`), API requires `body` (`TaskController.php:535-543`); render also reads `c.content` while the column is `body` — even historic comments render empty. |
| AUD-TASK-3 | **Critical** | **Manual time logging dead.** Time tab POSTs `/tasks/{id}/time-logs` with `minutes` (`task-time-tab.tsx:84-90`) — route doesn't exist (real: `POST /timer/log` with `minutes_logged`, api.php:216); the log list also renders `log.minutes` → NaN. |
| AUD-TASK-4 | **Critical** | **Personal reminder UI dead.** Overview tab calls `POST /reminders` / `DELETE /reminders/{id}` (`task-overview-tab.tsx:46-53,63-71`) — routes don't exist (real: `/tasks/{id}/reminders`, api.php:196-197). A correct mutation exists in `task-detail-sheet.tsx:195-220` but is unused. Spec §7.13 unreachable. |
| AUD-TASK-5 | **Critical** | **Quick Task drops the assignee.** Widget submits `assignee_id` (`quick-task-widget.tsx:59`); API only validates `assignees[]` (`TaskController.php:194-195,230-233`) → task created **unassigned**, target employee never notified. Spec §4.4/§15.4 broken. |
| AUD-TASK-6 | **Critical** | **Bulk "Mark Done" always 422s** — sends `status:"completed"` (`tasks-tab.tsx:1098`) which isn't in the enum (`todo/in_progress/review/done`, TaskController:407); status filter offers invalid `completed`/`redo` values returning empty (:941-942); would also bypass QA/approval if it worked. |
| AUD-TASK-7 | High | `submitForReview` bypasses the blocked-task check (direct `update`, not `TaskService::updateStatus`, `TaskController.php:503-507`) — blocked tasks can be submitted, violating spec §7.10. |
| AUD-TASK-8 | High | **Recurrence fires on direct status→done, never on approval** — `handleCompletion` only in PUT path (`TaskController.php:352-353`); `approve()` (:592) and kanban reorder (:419-428) never create the next instance. Spec §7.11 "only when approved" is inverted. Also `RecurrenceService.php:27,40-42` weekly bug skips an extra week when selected days exclude a later weekday. |
| AUD-TASK-9 | High | Quick-Task completions never post to Global Chat on approval — `TaskCompleted` only dispatched on PUT with `notify_global_chat` (`TaskController.php:360-367`); approve() never fires it (spec §8.9/§15.4). |
| AUD-TASK-10 | High | HR never notified when a recurring task completes (no HR notification in done or approve paths, `TaskController.php:352-368,609-625`) — spec §7.11. |
| AUD-TASK-11 | High | **Scope "Individual" doesn't exist** — DB enum `global/department/role` only, API validation mirrors it, UI select lacks it; and Department/Role scopes have **no targeting columns** (no department/designation/user list) — scope is a label with no effect (spec §7.9 unimplemented). |
| AUD-TASK-12 | High | Drag-to-review on a non-QA task auto-creates an approval **without a completion note** (`TaskService.php:63-65` via reorder/update) — defeats the required-note rule (spec §15.1). |
| AUD-TASK-13 | High | Drag-to-done lets the assignee finish a task with **no submission, no note, no approval** (`TaskController.php:343-353`) — bypasses the whole review workflow (spec §7.15/§15.1). |
| AUD-TASK-14 | High | Comment delete calls non-existent `DELETE /tasks/comments/{id}` (`task-comments-tab.tsx:42`). |
| AUD-TASK-15 | Medium | "Saved Filters" preset select (My Active / High Priority / Overdue) is dead UI — never applied to the query (`tasks-tab.tsx:57,888-898` vs queryFn :174-190). |
| AUD-TASK-16 | Medium | Date-range filter missing from List view and API (no from/to params in `TaskController::index` or the filter bar) — spec §7.6b. |
| AUD-TASK-17 | Medium | Comments are flat (no `parent_id`, flat render) — spec §7.7 "threaded". |
| AUD-TASK-18 | Medium | Employee edit affordances hidden though the API allows them — progress slider, due-date, description, Edit Details all gated `canManage` (`task-overview-tab.tsx:199-236`; `task-detail-sheet.tsx:265-286`) vs spec §19.3. |
| AUD-TASK-19 | Medium | No UI to stop/edit recurrence on an existing task (backend supports via PUT) — spec §7.11 "HR can turn off recurrence". |
| AUD-TASK-20 | Medium | Overview tab doesn't display scope; only a list-view chip (`tasks-tab.tsx:482-486`). |
| AUD-TASK-23 | Medium | Gantt gaps: no project bars; bar start synthesized from `created_at` (tasks have no start-date column; drag-start not persisted — only due_date sent); milestones only inferred when start==due; not HR/Admin-gated (see AUD-TASK-22). |
| AUD-TASK-28 | Medium | Self-review rules inconsistent: approve blocks assignee-reviewer unless super_admin (`TaskController.php:575-578`) but redo allows super_admin **or HR** (:638-641). |
| AUD-TASK-30 | Medium | Activity tab misses comments and time logs (never written as TaskActivity); event from→to metadata never rendered (`task-activity-tab.tsx:47-49`) — spec §7.7 "every action". |
| AUD-TASK-31 | Low | Mobile Kanban: long-press drag works, but no swipe-between-columns (spec §13.5). |
| AUD-TASK-32 | Low | store() cycle check misuses `parent_id` as the new task's id and only runs when both parent+blocked_by set (`TaskController.php:205-209`). |
| AUD-TASK-33 | Low | reorder accepts `backlog` status not in the DB enum (latent 500; frontend never sends it). |

### 3.6 Projects

**Verified OK:** project chat auto-created (creator+members) and removed with project; submit → `review` (enum extended by migration); approve → `completed` + timestamp; redo → active + reason; delete cascades soft-delete to tasks + removes conversation; sorting created/deadline/priority asc/desc (UI+API); project cards show name/desc/priority/deadline/progress/member avatars; cover image upload (image/2MB validated); allow_employee_tasks on create+edit; assign-into-personal-list; time logs roll into project totals; timers persist across navigation with cross-tab sync and are separate from the shift clock; employee visibility member-only effectively.

| ID | Severity | Finding |
|---|---|---|
| AUD-PROJ-1 | High | **Progress is never auto-calculated from tasks** (spec §7.2) — `progress` is a manual integer only (`ProjectController.php:184`); no computation anywhere; cards show 0 unless hand-set. |
| AUD-PROJ-2 | High | Create-Project dialog **lacks start/end date fields** (spec §7.3 incl. end≥start rule) — backend supports them (`ProjectController.php:89-90`), UI never sends (`create-project-dialog.tsx:99-109`). |
| AUD-PROJ-4 | High | Project submit: completion report NOT required at API (`notes => nullable`, `ProjectController.php:248`) — frontend-only guard; **any project member (employee) can submit**; resubmission while already `review` not blocked. Spec §7.17. |
| AUD-PROJ-5 | High | "HR AND Admin notified" (spec §7.17) — only the single `current_approver_role` cohort is notified (`ApprovalService.php:24-27` + `NotifyApprovalSubmitted.php:30-42`). |
| AUD-PROJ-6 | High | Project members are never notified on project creation (spec §7.3) — conversation created, no notifications (`ProjectController.php:108-122`). |
| AUD-PROJ-7 | Medium | Priority sorting is alphabetical string order (high < low < medium < urgent), not severity (`ProjectController.php:64-65`). |
| AUD-PROJ-8 | Medium | Projects-tab priority filter is a silent no-op — UI sends `priority`, API ignores it (`projects-tab.tsx:68` vs `ProjectController.php:53-59`). |
| AUD-PROJ-9 | Medium | Approval notification deep-link is always `/dashboard/org/leave` even for task/project approvals (`NotifyApprovalSubmitted.php:50`). |
| AUD-PROJ-11 | Medium | Task approve has no "optional message to project chat" (spec §7.16) — approve() accepts no message; only submit paths post to chat. |
| AUD-PROJ-12 | Low | Projects page tab badges show hardcoded "12"/"5" (`projects/page.tsx:23,28`). |

### 3.7 Chat

**Verified OK:** conversation model (global auto; project auto; DM with self-DM block, dedupe, inactive-recipient rejection; groups HR/Admin-only); employee visibility locked to membership; Enter/Shift+Enter; @-mention dropdown with arrow nav, notification with 50-char snippet + deep link, thread highlighting; 10MB client+server validation with limits popup; image/PDF inline previews with lightbox; read ticks on own messages; pinned-message bar; unread border + count badge; auto-mark-read (bulk upsert + IntersectionObserver fallback); pinned conversations with divider; task-completion posts to project chat; quick-task completions to Global Chat (backend paths); optimistic send with rollback; ConversationCreated live DMs; offline polling fallback; Pusher prod config; channel auth validates membership (global open); channel cleanup with refcounting; server-side conversation/user search.

| ID | Severity | Finding |
|---|---|---|
| AUD-CHAT-1 | Medium | Read receipts (✓✓) render in **all** conversation types, not DMs only (`ChatController.php:92`; `message-list.tsx:197-205`) — spec §8.5. |
| AUD-CHAT-3 | Medium | No 100-pinned-conversations cap (`ChatController.php:326-338`) — spec §8.8/§19.7. |
| AUD-CHAT-4 | Medium | @-mention dropdown is **empty in Global Chat** — dropdown sources `conversation.users` but the global conversation has no attached members (`message-composer.tsx:62-64`) — company-wide mentions impossible. |
| AUD-CHAT-6 | Medium | No unread badge on the Chat nav icon (mobile bottom nav + desktop sidebar are plain links) — spec §8.7; total unread only inside the chat page header. |
| AUD-CHAT-7 | Low | Notifications tab badge is a hardcoded "3" (`chat/page.tsx:32`). |
| AUD-CHAT-8 | Low | Pinning the global chat attaches the user as a member row (pivot hack) polluting the users relation (`ChatController.php:331-335`). |
| AUD-CHAT-9 | Low | Mention highlight regex breaks on names with spaces ("@John Doe" highlights "@John" only; `message-list.tsx:103` vs composer inserting full names, `message-composer.tsx:69`). |
| AUD-CHAT-12 | Info | First-time users see the entire Global Chat history as unread (unread_count counts all messages from all senders, `ChatController.php:69-74`). |

### 3.8 Announcements & Notifications

**Verified OK:** feed + emoji reactions (toggle/counts/own-state); no comment section; pinned stay top; dashboard surfacing; bell badge = high-priority unread only with preview/mark-read/deep link; Notification Center with type filter, search, mark individual/all read, pagination; notification trigger coverage is broad and verified for: leave submitted→approver, leave decided→employee, task assigned→employee, task submitted→manager, task approved/redo→employee, project submitted→approver, project decided→submitter, @mention→person, suspicious login→HR+Admin, personal reminder→owner (scheduler), shift reminder 15-min, missed clock-in 30-min→HR, session revoked→realtime logout, feedback→HR, holiday 10-day→all active users; realtime user-channel pushes with toast.

| ID | Severity | Finding |
|---|---|---|
| AUD-ANNC-1 | **Critical** | **Announcement composer has no priority selector** — every announcement is created `normal` (`announcement-composer.tsx:36,100-170` has no priority field) while the backend fully supports normal/high/urgent with fan-out (`AnnouncementController.php:68,79,90`). Spec §8.10's High/Urgent system AND the bell's high-priority badge are unreachable end-to-end. *(Verified by lead auditor.)* |
| AUD-ANNC-2 | High | **Dismiss (✕) does not exist** — no dismiss endpoint, no per-user dismissal storage, no ✕ in the UI (`routes/api.php:251-258`; `announcement-board.tsx`) — spec §8.10/§4.1 "dismissible, remembered". |
| AUD-ANNC-3 | High | Team-announcement recipients computed as `department_id = team_id` (`AnnouncementController.php:93`) — teams are a separate table; high/urgent team announcements notify the wrong cohort or nobody. |
| AUD-ANNC-6 | Medium | Urgent team announcements notify only team members — spec Appendix A says Urgent → everyone; code treats high/urgent identically per scope (:90-96). |
| AUD-ANNC-9 | Low | Team announcement with null `team_id` is silently invisible to everyone (SQL null comparison, `AnnouncementController.php:76,22-46`). |
| AUD-ANNC-10 | Low | Reaction payload stores word keys (`like`/`heart`/`party`) in the `emoji` column rather than emoji characters. |
| AUD-ANNC-11 | Info | Announcement broadcast failure swallowed by an empty inner catch (outer log unreachable, `AnnouncementController.php:82-88`). |
| AUD-NOTIF-1 | High | **"Export ready" never reaches the bell** — `GenerateReportJob` only broadcasts `ExportCompleted`; the only listener is inside the Export History page (`export-history.tsx:35`); no Notification row is created — spec §10.6 step 3 (bell notification) unmet unless the user has that page open. |
| AUD-NOTIF-2 | Medium | Session-revoked is a transient websocket event only — no persistent Notification; offline users never learn of revocation (spec §8.11 row). |
| AUD-NOTIF-4 | Medium | Notification Center type-filter taxonomy mismatch — backend emits `chat/system/approval_pending/approval_decided/info/alert` (+`task_assigned` reused for decisions); filter offers dead options (`mention`, `announcement`, `task_decision`, `task_submitted`) and omits real ones (`notifications-tab.tsx:37-59`). |
| AUD-NOTIF-5 | Low | Approval/security listeners create Notifications directly, bypassing `NotificationService` preference opt-outs/channel routing (`NotifyApprovalSubmitted.php:50-58`; `ProcessApprovalDecision.php:49-56`; `AuthController.php:149-158`). |

### 3.9 Directory & People

**Verified OK:** directory search across name/email/username/employee-id/dept/designation; dept+designation filters; private hides email/phone; always-hidden sensitive fields; Send-Message→DM; create-employee full field set with uniqueness validation; auto `G4K-###`; team list filtered by dept; multi-role select; temp password + welcome email or returned `_temp_password`; forced change + onboarding; deactivate blocks login preserving data; last-super-admin guards; delete = soft-delete + immediate token revocation + restore; HR scoping across index/show/update/status/reset/bulk; employee lockout (1=0 + 403); role-escalation guards; export filtered/selected; dept auto `DEP-###`; dept detail 3 tabs (Employees/HRs/Teams) + headcount; dept delete guarded while employees assigned (destroy path); designations with counts + delete-block; HR assignment drives platform visibility.

| ID | Severity | Finding |
|---|---|---|
| AUD-DIR-1 | High | **Temp password never shown to the creator when mail is unconfigured** — API returns `_temp_password`/`_warning` (`UserController.php:185-189`) but createMutation ignores the response (`directory-list.tsx:234-239`) and reset-password toasts only `message`, discarding the credential (`use-user-actions.ts:65-70`). Without SMTP, employees can never receive credentials — spec §9.2's no-email path broken. |
| AUD-DIR-2 | High | **Employee 360° record unimplemented** — `/users/{id}/leave-history` and `/assignments` have no UI consumer; only an Activity sheet exists (`directory-list.tsx:575-596`). Spec §9.6's five-tab 360 record (Personal Info / Attendance calendar / Leave / Projects & Tasks / Activity) missing. |
| AUD-DIR-3 | Medium | Directory grid/list view toggle missing — grid only (`directory-tab.tsx:173-246`) — spec §9.1. |
| AUD-DIR-5 | Medium | **Department archive not blocked while employees assigned** — archive() soft-deletes unconditionally; destroy() silently deactivates + returns 200 instead of blocking (`DepartmentController.php:111-150`) — spec §9.4 "cannot delete while employees assigned". |
| AUD-DIR-6 | Medium | Team rename missing — no update route (api.php:333-334), UI offers create/delete only — spec §9.4 "create, rename, delete". |
| AUD-DIR-7 | Medium | Directory department filter is empty for regular employees (`/departments` HrScope-scoped to nothing for non-HR, `DepartmentController.php:16`) — the filter is unusable for the directory's main audience. |
| AUD-DIR-8 | Medium | Third privacy state `internal` (the **default**) exposes email+phone to all authenticated colleagues (`DirectoryController.php:16,33-36`) — spec defines only Public (full) / Private (name+role); default contact visibility exceeds spec. |
| AUD-DIR-9 | Low | Reset-password dialog claims default "Password@123" vs actual random 16-char temp — misleading copy (`directory-list.tsx:613`). |
| AUD-DIR-10 | Low | Create-user note ("must use Reset Password after creation to send credentials") contradicts the actual store-time email/temp-password flow (`user-form.tsx:209`). |
| AUD-DIR-11 | Low | destroyTeam leaves `users.team_id` dangling (no member check/reassign, `DepartmentController.php:178-187`). |
| AUD-DIR-12 | Info | Dead `useReverb` import in `use-export.ts:5` — export flow has no live listener wired (ties into AUD-NOTIF-1). |
| AUD-SET-12 | Low | Department dropdown in Employee Management capped at default 20 rows (no `per_page`) — departments beyond 20 unreachable in the form (`directory-list.tsx:195`). |

### 3.10 Settings (12 sections)

**Verified OK:** all 12 sections present; work schedules full fields with single exclusive default (default drives late/OT platform-wide); mail test button + masked-credential skip-on-save; per-event email/in-app toggles; auto-numbering prefix+start+preview; reminder defaults 15/30; security requests approve→one-time link (returned for manual share) + reject with notifications; audit log API-immutable (GET-only routes); audit filters + export (see AUD-AUDIT-1 for the export bug); demo UI has typed confirmation + counts preview; weekly summary Sunday 09:00 (content gaps below); system jobs pending/failed counts; password policy enforcement on change; CSV-injection escaping in audit export; holidays CRUD + recurring + Feb-29 shift + dashboard widget + 10-day reminders.

| ID | Severity | Finding |
|---|---|---|
| AUD-SET-1 | **Critical** | **"Remove Demo Data" button always 422s** — UI sends DELETE with no body (`demo-data-config.tsx:24`) but the API requires `confirmation=in:REMOVE DEMO DATA` (`DemoDataController.php:56-57`). The guarded purge is unreachable from the UI. *(Verified by lead auditor.)* |
| AUD-SET-2 | **Critical** | **Demo purge destroys REAL records** — `DemoPurgeCommand.php:66-68` truncates the entire `notifications`, `conversation_message_reads`, and `audit_logs` tables (despite `HasDemoTag` existing for selective delete), violating spec §11.10 audit-immutability and §11.11 "without touching real records". Neither purge nor seed writes any audit entry. *(Verified by lead auditor.)* |
| AUD-SET-3 | Medium | System Jobs retry is all-or-nothing (`id => 'all'`, `SettingsController.php:128-132`; single Retry button) — spec §11.12 "retry failed jobs individually". |
| AUD-SET-4 | Medium | Policies UI missing password-expiry field (backend honors `password.expiry_days`; UI has no control, `policies-config.tsx:17-28`). |
| AUD-SET-5 | Medium | Company Profile "short name" missing from UI (controller accepts it; form submits name+timezone only, `settings-tabs.tsx:30-33,117-121`). |
| AUD-SET-6 | Medium | **Default timezone is UTC, not Asia/Kolkata** — migration default + auto-create fallback both `UTC` (`2026_08_09_020005...php:16`; `CompanyProfileController.php:21-24`); only AttendanceService falls back to Asia/Kolkata. Spec §11.1 default + live empty-timezone combobox tie into this. |
| AUD-SET-7 | Medium | Login page hardcodes `/landscape-logo.png` — uploaded company logo never appears on login (`login/page.tsx:109`) — spec §3.1/§11.1. |
| AUD-SET-8 | Medium | Weekly summary email lacks attendance + leave metrics (only tasks/projects, `SendWeeklySummaryCommand.php:27-32`) and is sent to HR+Admin vs spec §5.11 "Admins". |
| AUD-SET-9 | Medium | See AUD-DEACT-TOKENS (deactivation without token revocation — listed here as the settings-side fix location: `UserController.php:293-334`). |
| AUD-SET-10 | Low | Company Profile tab visible to non-admins (form 403s on save) — only tab not wrapped in `canManageSettings` (`settings-tabs.tsx:127,145`). |
| AUD-SET-11 | Low | `preferences` array-merge path bypasses the `directory_visibility` enum validation (`UserPreferenceController.php:36,44`). |
| AUD-SET-13 | Info | Demo purge + seed perform no audit logging (second aspect of AUD-SET-2). |

### 3.11 Reports & Exports

**Verified OK:** reports RBAC (nav + API); attendance/leave summaries with date+dept filters, HR-scoped; saved filter views save + one-click apply; background exports (queued, 202, never block UI); Export History download + 5s polling; productivity 80/20 formula (on-screen dataset); datasets tasks/projects/users/productivity.

| ID | Severity | Finding |
|---|---|---|
| AUD-REPORT-1 | **Critical** | **Attendance Summary export always fails** — the `case 'attendance-summary':` label is missing; the handler block sits dead after `leave-export`'s `break;` (`GenerateReportJob.php:289-290`), so the key falls to `default:` throw (:397-398) while `ReportController.php:108` whitelists it and `admin-reports-view.tsx:58-74` submits it. Every Attendance Summary export job ends "failed". *(Verified by lead auditor.)* |
| AUD-REPORT-2 | High | **HR Employee-Directory/Productivity datasets 500** — `ReportController.php:70` passes `'users.department_id'` to HrScope, which exact-matches only `'department_id'` and falls back to `whereHas('users.department_id')` → `RelationNotFoundException` (`Support/HrScope.php:36-64`); same string at `GenerateReportJob.php:363` breaks HR users/productivity exports. *(Verified by lead auditor.)* |
| AUD-REPORT-3 | High | **HR attendance export job always fails** — same HrScope string applied to a DB Query\Builder (no `whereHas`) → `BadMethodCallException` (`GenerateReportJob.php:225-228`). |
| AUD-REPORT-5 | High | **Leave export ignores manager scope** — filters omit `_has_manage` (`LeaveRequestController.php:384-395`) so the job treats every HR/Admin export as self-only: exports contain just the requester's own leaves. |
| AUD-REPORT-6 | High | **Admin-only reports missing** — no Project Completion Report, Task Statistics (completion/redo/time averages), or Productivity Summary anywhere in the web app — spec §10.5 unimplemented. |
| AUD-AUDIT-1 | High | **Audit-log export can never be downloaded** — `ExportAuditLogsJob.php:82-87` stores `$disk->url($filename)` (a full URL) in `file_path`, but `downloadExport` treats it as a storage path (`$disk->exists()` → false → 404, `ReportController.php:163-166`). *(Verified by lead auditor.)* |
| AUD-REPORT-7 | Medium | Attendance Summary lacks KPI rate cards (present/late/absent rates) and per-department aggregation — raw per-employee counts only (`admin-reports-view.tsx:76-100`) — spec §10.1. |
| AUD-REPORT-9 | Medium | Productivity **export** formula wrong: `round($rate * $hours, 2)` vs the spec/UI 80/20 weighting (`GenerateReportJob.php:381` vs `ReportController.php:95`) — exported scores diverge from screen. |
| AUD-REPORT-10 | Low | "All exports are .xlsx" violated — builder/admin views offer CSV/PDF menus; users/departments/designations/audit exports are hardcoded `csv` (UserController:100; DepartmentController:57; DesignationController:47; AuditLogController:39). |
| AUD-REPORT-12 | Low | Saved views cannot be deleted from the UI though the DELETE endpoint exists (`saved-report-views.tsx` has no delete control). |

### 3.12 Mobile / PWA / Offline

**Verified OK:** mobile bottom nav with 5 destinations and the green attendance FAB exactly per spec §13.1 (capability-gated); hamburger Sheet with full nav + pins; service worker: network-only navigations, SWR statics, no API caching, versioned cache purge; offline mutation queue with toasts (`api-client.ts:88-92,220-224` + `offline-engine.ts`); offline login guard; punch timestamps accepted up to 48h in the past for offline sync with 5-min future bound; sw.js/manifest deployed.

| ID | Severity | Finding |
|---|---|---|
| AUD-MOB-1 | Medium | Spec §13.6 "chat shows Not connected + messages queue offline" — chat composer has no offline queueing (only the generic mutation queue applies to non-GET calls; message send IS queued via api-client, but the chat UI shows no offline status/queue indicator) — partial. |
| AUD-MOB-2 | Low | Spec §13.4 native date pickers — leave/task forms use the design-system calendar; consistent but not "native pickers" (deviation, likely intentional). |
| AUD-MOB-3 | Info | Offline banner ("You're offline...") not found as a global component; offline feedback is per-action toasts + login guard only — spec §13.6 banner missing. |

*(48px/44px touch-target and single-column stacking conventions verified in attendance + auth forms; full per-breakpoint visual QA deferred — see §6.)*

### 3.13 Global UX Patterns (spec §14)

**Verified OK:** breadcrumbs (clickable, all detail screens); pins (projects/tasks/profiles, sidebar Pinned section, ≤100); form standards (required markers, as-you-type validation, inline field errors, dot-loader submit buttons, green toasts, sectioned long forms, 30s IndexedDB drafts with restore banner — `use-form-draft.ts` verified spec-exact); skeleton loaders; animated progress; empty states (standardized via TASK-DS-05); toasts (4 types, ✕, top-right via sonner); canonical ConfirmDialog (TASK-DS-03); icon-button tooltips + truncated-text tooltips; drag & drop (kanban, widget grid, task reorder); status badge palette (semantic mapping TASK-DS-04); HH:MM:SS timers that persist across navigation with amber overtime (project timer + live shift timer + layout hydration); keyboard shortcuts (Ctrl+K palette, Ctrl+N context-new, Ctrl+B sidebar, Ctrl+/ help overlay, Escape via primitives, Shift+Enter in chat composer); pagination 20/50/100 standard; filter bars with Clear All + active chips; activity logs per task/project; quick notes private + dashboard widget + palette access; error boundaries with resetKeys; hydration gate.

Gaps are filed above: AUD-UX-1..8, AUD-TASK-15/16/31, AUD-DASH-2, AUD-ANNC-2.

---

## 4. Spec-Conformance Snapshot (per spec section)

| Spec § | Area | Status |
|---|---|---|
| 1–2 | Platform overview, roles, permission matrix | ✅ Conformant (RBAC deviations: AUD-PROJ-3, ANNC-4/5, TASK-22/26/27, DEACT-TOKENS) |
| 3 | Sign-in & onboarding | ✅ Conformant (AUD-AUTH-1 countdown gap, AUTH-5 resume) |
| 4 | Dashboards | ✅ Conformant (SYNC-1 lag, DASH-1 count/list) |
| 5 | Attendance & time | ✅ Strong (SYNC-2 team lag, ATT-2 holiday-work, REPORT-11 graphs 404) |
| 6 | Leave | ✅ Strong (LEAVE-2 notify-on-cancel) |
| 7 | Projects & tasks | ❌ **Broken at UI layer** — submit/comments/time-log/reminders/bulk-done all dead; scope Individual missing; progress/dates/recurrence gaps |
| 8 | Chat, announcements, notifications | ⚠️ Chat solid; announcements missing priority + dismiss; notification taxonomy/bell gaps |
| 9 | Directory & people | ⚠️ Core CRUD solid; 360 record missing; temp-password path broken; dept archive/rename gaps |
| 10 | Reports & exports | ❌ HR exports broken; attendance-summary export dead; admin-only reports missing; audit export undownloadable |
| 11 | Settings (12 sections) | ❌ Demo purge destructive + unreachable; timezone default wrong; several UI gaps |
| 12 | My Profile | ✅ Conformant (4 tabs incl. widget restore + feedback channel) |
| 13 | Mobile & PWA | ✅ Conformant (swipe/MOB gaps minor) |
| 14 | UX patterns | ✅ Conformant (color/palette deviations minor) |
| 15–16 | E2E workflows | ❌ Task-approval flow dead at submit step; project flow leaks (no required report at API); quick-task flow drops assignee |
| 17 | Navigation map | ⚠️ Flat sidebar vs documented trees (AUD-UX-2) |
| 18–20 | Security/rules/colors/shortcuts | ✅ Mostly conformant (audit-IP capture broken in prod; deactivation token gap) |

---

## 5. Page Coverage Matrix (all 26 routes)

| Route | Static | Live (prod build) |
|---|---|---|
| `/` root redirect | ✅ | ✅ redirects to login/dashboard |
| `/login` | ✅ | ✅ logo/tooltip/countdown path; expired-session redirect verified |
| `/forgot-password` | ✅ | not exercised (dead-flag finding is static) |
| `/reset-password` | ✅ | not exercised |
| `/change-password` | ✅ | — |
| `/role-select` | ✅ | auto-select path exercised via single-role logins |
| `/onboarding` | ✅ | not exercised (creds randomized) |
| `/dashboard` | ✅ | ✅ admin: all widgets, real data, 0 console errors |
| `/dashboard/admin/attendance` | ✅ (components) | not visited (throttle window) |
| `/dashboard/admin/reports` | ✅ (agent C) | not visited |
| `/dashboard/announcements` | ✅ | not visited |
| `/dashboard/attendance` | ✅ (all tabs) | not visited (employee creds randomized) |
| `/dashboard/audit` | ✅ | ✅ via settings audit tab (data verified) |
| `/dashboard/chat` | ✅ (deep) | login raced (throttle) — pending next deploy |
| `/dashboard/directory` | ✅ (agent C, deep) | not visited |
| `/dashboard/leave` | ✅ (form/tabs) | not visited |
| `/dashboard/notes` | ✅ | not visited |
| `/dashboard/notifications` | ✅ | not visited |
| `/dashboard/org/attendance` | ✅ | not visited |
| `/dashboard/profile` | ✅ (4 tabs) | not visited |
| `/dashboard/projects` + `/[id]` | ✅ (deep) | pinned-link presence verified on dashboard |
| `/dashboard/reports` | ✅ (agent C) | not visited |
| `/dashboard/settings` | ✅ (12 tabs) | ✅ tabs render; click-switch broken on deployed build (DEPLOY-1) |
| `/dashboard/tasks` + `/[id]` | ✅ (deep) | not visited (admin ≠ assignee for submit test; code-verified) |
| API surface (api.php, 363 lines) | ✅ full route×capability map | ✅ health/version/ping |

**API RBAC map note:** route-level capability gating is consistent and granular; `GET /users/{id}` + `GET /users/{id}/activity` intentionally sit outside middleware for `$isSelf` bypasses and are controller-guarded (verified `UserController.php:277-288,412-425`) — correct.

---

## 6. Not Covered / Follow-up

| Item | Reason |
|---|---|
| HR + Employee live walkthroughs | Prod demo passwords are randomized (`DatabaseSeeder` prod branch); requires real credentials — **re-run live probe with fresh creds after next deploy** |
| Full visual QA at every breakpoint (375/768/1024/1440) | Time-boxed; responsive scaffolding (TASK-DS-07) spot-verified only |
| Realtime double-broadcast re-verification under load | The "duplicate broadcasts" fix (commit 7c606e2) was reviewed statically; needs a two-browser session after deploy |
| E2E test suite status | Vitest/E2E harness out of scope for this pass (known broken from prior audits; unchanged) |

---

## 7. Recommended Fix Order

1. **P0 — contract fixes (small diffs, unblock the core product):** AUD-TASK-1/2/3/4/5/6, AUD-TASK-14 (align field names + routes); AUD-ANNC-1 (priority selector); AUD-SET-1 (send confirmation string); AUD-REPORT-1 (add case label). All are one-to-few-line fixes.
2. **P0 — data safety:** AUD-SET-2 (selective demo purge, never truncate real tables; log purge/seed to audit).
3. **P0 — deploy:** ship HEAD to prod (clears AUD-DEPLOY-1 cluster), configure trusted proxies (AUD-LIVE-1), then re-run the live probe as HR + employee.
4. **P1 — workflow integrity:** TASK-7/8/9/12/13 (approval-path enforcement + recurrence-on-approve + blocked-submit guard), PROJ-1/2/4/5/6, DIR-1 (surface `_temp_password`), REPORT-2/3/5 + AUDIT-1 (export pipeline), DEACT-TOKENS.
5. **P1 — RBAC scoping:** PROJ-3 (HrScope on projects), ANNC-3/4/5, TASK-26/27, CHAT-5.
6. **P2 — spec-completion:** TASK-11 (scope targeting), DIR-2 (360 record), REPORT-6 (admin reports), ANNC-2 (dismiss), DASH/SYNC cache keys, SET-6 timezone default, UX-1/2.
7. **P3 — polish:** everything Low/Info.

---

## Changelog
- **2026-08-21 — Full re-audit (fresh file):** previous Audit-Report.md was deleted in the 2026-08-20/21 cleanup; this file was written from scratch per the zero-trust pattern (no findings carried over). 26 pages + full API surface audited across 8 lenses; 3 parallel module audits (Projects+Tasks, Comms, Org/Settings/Reports) + lead-auditor verification of every Critical; live production probe (admin session) incl. deploy-drift and audit-IP findings. **Totals: 10 Critical · 29 High · 55 Medium · 31 Low · 13 Info.**
