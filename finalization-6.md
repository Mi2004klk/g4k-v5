# finalization-6.md — Exhaustive End-to-End Audit + Implementation Blueprint

> **Read first.** This is the only deliverable for this round — an audit + plan, **no code changes made**. Unlike
> rounds 1–5 (which were static code reading), **this audit was validated against the LIVE deployed app** by logging
> in as Admin, HR, and Employee (`*@games4king.in` / `password`) and exercising the real API surface. The "LIVE"
> tag below = observed in production on 2026-08-14, not assumed from code. **Existence of a page/API/component does
> NOT mean it works** — most modules exist but are broken at runtime, as proven below.
>
> **The bottom line:** the app is **not usable end-to-end** today. The Employee role is **100% locked out**; the
> HR/Admin attendance and leave-approval workflows **return HTTP 500**; the holidays feed is **corrupted**; and
> **~15 spec features are entirely missing** (Kanban, Gantt, @mention, read receipts, task dependencies, recurring
> tasks, etc.). On top of that, **no queue worker or scheduler runs**, so audit logs, report exports, and every
> reminder are silently dead. This document defines exactly what to build/fix, in dependency order, to reach a
> genuinely day-to-day-usable product that matches the Workplace App Requirement Sheet.

---

## 1. Executive audit summary

The application has a broad surface (auth, dashboards, attendance, leave, projects, tasks, chat, announcements,
notifications, directory, reports, settings, profile) and most of it **renders** — but the **workflows do not
complete**. The gap between "page exists" and "workflow works end-to-end" is where every prior round stopped. This
audit crosses that line using live probes.

**The five LIVE-confirmed blockers (any one of these makes the app unusable for a role):**

| # | Blocker | Live evidence | Affected |
|---|---|---|---|
| **B1** | **Employee is entirely locked out** — demo account `onboarded_at=null` → `ForceOnboarding` returns `403 needs_onboarding` on **every** endpoint (dashboard, attendance, leave, projects, chat — all of them). | Probe: employee → 403 on all 33 endpoints. | Employee (the largest user base) |
| **B2** | **Attendance team/admin/HR views return 500.** `attendance/admin/overview`, `attendance/team-today`, `attendance/hr/today` all 500. The HR/Admin attendance dashboards cannot render. | Probe: 500 for admin+HR. (Own `attendance/me/today` works → 200.) | HR, Admin |
| **B3** | **`leave-requests/pending` returns 500** for Admin AND HR. The leave-approval queue (a core daily HR/Admin workflow) is broken at the source. | Probe: 500 admin+HR. | HR, Admin |
| **B4** | **Holidays feed is corrupted** — returns a PHP `__PHP_Incomplete_Class` object, not an array. Breaks the calendar heatmap, upcoming-holidays widget, and holiday-aware logic. | Probe: `holidays → OBJ{__PHP_Incomplete_Class_Name}`. | All |
| **B5** | **No queue worker / no scheduler runs.** `start.sh` only runs `migrate`+`octane`. So: `audit_logs` never written, report/audit **exports never generate**, and **every reminder** (shift-start, missed-clock-in, open-shift, holiday-10-day, weekly summary) never fires. | Code: `apps/api/start.sh`; jobs pile in the `jobs` table. | All |

**Plus a large spec-coverage gap** (§10): the Requirement Sheet specifies features that were never built — Kanban
board, Gantt timeline, @mention, DM read receipts, pinned project messages, task dependencies, recurring tasks,
inline editing, drag-and-drop reordering, Admin weekly-summary email, suspicious-login alerts, personal task
reminders, custom group chats, etc.

**Why prior rounds "didn't work":** they fixed code-level symptoms identified by reading files, but (a) never
validated against live data, so the runtime 500s/corruption/onboarding-lock went unfixed; (b) never stood up the
worker/scheduler, so all async features stayed dead; and (c) never measured against the full Requirement Sheet, so
missing features stayed missing.

---

## 2. Current application state (verified)

**Stack (verified):** Next.js 16 / React 19 / TanStack Query 5.101.4 (FE, Vercel) · Laravel 13 / Sanctum / Octane-
FrankenPHP / PHP 8.4 (BE, Cloud Run) · PostgreSQL on Supabase (pooler :6543, `sslmode=require`,
`PDO::ATTR_EMULATE_PREPARES=true` — correct for the pooler) · cache/session/queue = **`database`** (no Redis) ·
storage = Supabase S3 (`AWS_USE_PATH_STYLE_ENDPOINT=false` — **wrong for Supabase**, §9-SET-2) · realtime =
Pusher `ap2` in `cloudbuild.yaml` but `.env` still carries Reverb pointed at the API's own URL (§6.5).

**Auth (verified working):** login (`identifier` = email/employee-id/username + `password`) issues Sanctum bearer
(15 min) + HttpOnly refresh cookie (7 day); `redirectGuestsTo(fn()=>null)` returns clean 401 (not 500) for guests;
single-mutex 401→refresh→retry; zustand `skipHydration` (no hydration #418); theme dropdown Light/Dark/System.

**Auth (verified broken):** 15-min `g4k_token` client cookie is the only middleware auth signal and is **not
refreshed during normal use** → valid idle sessions get bounced to `/login` (§AUTH-1); logged-out deep-links to
`/onboarding`/`/role-select`/`/change-password` hang on an infinite spinner (§AUTH-2); `PUT /auth/role` calls a
nonexistent method → 500 (§AUTH-4).

**Data (verified):** login works for all three accounts. Admin & HR are onboarded; **Employee is not** (B1).
Directory has 15 users, 5 departments, 20 designations, 2 projects, 5 tasks, 2 announcements, real notifications,
real leave requests, real attendance history (HR has 12 days). So **real seed data exists** — the failures are
code/runtime, not missing data (except the employee onboarding flag and the missing spec features).

---

## 3. Live probe results (the evidence)

Logged in as each role; hit 33 endpoints with the real bearer token + `Accept: application/json`. `✅200` /
`⚠️403` / `❌500`. (`GET`-only — no data was mutated during this audit.)

### ADMIN
```
✅ dashboard/init, dashboard/metrics, me/capabilities, auth/preferences, auth/sessions(3),
   profile, directory(15), notifications(2), unread-count, leave-requests(15), leave-requests/history(0),
   leave-requests/admin/history(15), projects(2), tasks(5), tasks/submitted(0), announcements(2),
   quick-notes(0), pins(0), departments(5), designations(20), work-schedules(1), conversations(1),
   company-profile, settings/grouped, reports/data(5), reports/attendance-summary(15)
❌ attendance/me/today → 403            (admin correctly denied self-clock — GOOD)
❌ attendance/me/history → 403          (good, but means admin "My Attendance" tab is empty — UX gap)
❌ attendance/team-today → 500          (B2)
❌ attendance/hr/today → 500            (B2)
❌ attendance/admin/overview → 500      (B2 — admin's own attendance console!)
❌ leave-requests/pending → 500         (B3)
❌ holidays → __PHP_Incomplete_Class    (B4)
```

### HR
```
✅ dashboard/init, dashboard/metrics, me/capabilities, auth/preferences, auth/sessions(12),
   profile, directory(15), notifications(1), unread-count, attendance/me/today, attendance/me/history(12),
   leave-requests(3), leave-requests/history(3), leave-requests/admin/history(4), projects(1), tasks(3),
   tasks/submitted(0), announcements(2), quick-notes(1), pins(0), departments(5), designations(20),
   conversations(1), reports/data(3), reports/attendance-summary(1)
❌ attendance/team-today → 500          (B2)
❌ attendance/hr/today → 500            (B2 — HR's team-attendance widget)
❌ attendance/admin/overview → 403      (correct — admin-only)
❌ leave-requests/pending → 500         (B3 — HR's leave-approval queue)
❌ work-schedules → 403                 (capability gap — HR needs this for user-create dropdown)
❌ company-profile → 403                (capability gap)
❌ settings/grouped → 403               (correct — admin-only)
❌ holidays → __PHP_Incomplete_Class    (B4)
```

### EMPLOYEE  →  **403 needs_onboarding on ALL 33 endpoints** (B1). The entire Employee experience is unreachable.

> These are not hypotheses. They are the responses the production server returned. Any plan that does not fix B1–B5
> first cannot make the app usable.

---

## 4. Role-by-role workflow map (intended vs actual)

Legend: ✅ works end-to-end · ⚠️ partial/broken · ❌ missing/blocked.

### Admin
| Workflow | Intended (spec §2) | Actual |
|---|---|---|
| Login → dashboard | company-wide summary | ✅ login; ❌ dashboard attendance + pending-approval widgets 500/empty (B2/B3) |
| User management (HR+Employee CRUD, dept assign, dual role, reset pw, activity log) | full CRUD + activity log | ⚠️ CRUD exists; `GET /users/{id}` **no authz** (§USER-1); activity log **dead** (no worker, §B5) |
| Department management | create/assign HR+emp/member list/archive | ⚠️ exists; SoftDeletes trait not applied; `department_hr` pivot |
| Attendance (view all, filter, calendar, day summary, correct, approve HR leave, export) | full | ❌ overview/team **500** (B2); export **queued→dead** (B5) |
| Projects (all, create, team, tasks, QA form, approve/redo, chat) | full | ⚠️ exists; QA form endpoint exists; project-chat + task→chat **queued→dead** |
| Tasks (all, create, assign, approve/reject, rates) | full | ⚠️ exists |
| Chat (global, project, DM, announcements) | full | ⚠️ global+DM; **custom group chats ❌ missing**; @mention/read-receipts/pinned ❌ |
| Reports (attendance, project, task, productivity, export Excel) | full | ⚠️ data endpoints work; **export queued→dead**; productivity formula dubious |
| Settings (company, hours, holidays, policies, session, notif prefs) | full | ⚠️ exists; **avatar/logo 500** (storage); holidays **corrupted** (B4) |
| Profile (edit, pw, devices, remote logout) | full | ⚠️ exists; avatar 500 |

### HR
| Workflow | Intended (spec §3) | Actual |
|---|---|---|
| Dashboard (present/absent/late, projects, pending leave, pending submissions, quick task) | team overview | ❌ attendance widgets **500** (B2); leave-pending **500** (B3); task→global-chat **queued→dead** |
| Own attendance (clock in/out/break, history heatmap, day detail) + own leave→Admin | full | ✅ own `me/today` works; ⚠️ late-badge never computed (tz bug §ATT-1); heatmap depends on holidays (B4) |
| Employee attendance overview + approve/reject employee leave | full | ❌ team-today/hr-today **500** (B2); leave-pending **500** (B3) |
| Projects (create, team, tasks, QA form, chat, sorting, history) | full | ⚠️ exists; project-chat auto-create + task alerts **queued→dead** |
| Chat (global, project, direct, **custom groups**, notification center) | full | ⚠️ global+DM; **custom groups ❌ missing** |
| Profile | full | ⚠️ exists; avatar 500 |

### Employee  — **entire role blocked by B1 until onboarding is completed.**
| Workflow | Intended (spec §4) | Actual (once unblocked) |
|---|---|---|
| Dashboard (active projects, pending tasks, **attendance widget w/ live timer**, recent task progress bar, approval status) | personal summary | ⚠️ components exist; blocked by onboarding |
| Attendance (clock, history, day detail, leave→HR) | full | ✅ own path works for HR; expect same for employee once onboarded |
| Projects (assigned only, tasks, progress, submit+QA form, self-create if permitted, **work timer**) | full | ⚠️ exists; **per-project work timer UI ❌ likely missing** (endpoint exists) |
| Personal task list (My Tasks) | private to-do | ⚠️ endpoint may exist; UI/visibility ❌ verify |
| Chat (global, direct HR/Admin, groups, project) | full | ⚠️; custom groups ❌ |
| Profile | full | ⚠️; avatar 500 |

---

## 5. Module-by-module audit (consolidated from code + live)

Detailed code-level defects (file:line) live in `context.md` §8/§9 and `finalization-5.md`. Here is the
**workflow-level** verdict per module (what a user experiences):

- **Auth/session:** login works; idle-session forced logout; deep-link spinner; `PUT /auth/role` 500.
- **Dashboard:** renders for Admin/HR but attendance/pending widgets are dead (B2/B3); Employee blank (B1); announcement board never refreshes (dead invalidation key); a couple of unguarded array/date sites remain.
- **Attendance:** own clock-in/out works; **all team/admin views 500**; late never computed (tz); reminders dead.
- **Leave:** request + history work; **approval queue 500**; **no leave balance** (unlimited leave); approve-from-dashboard uses wrong id (404).
- **Projects/Tasks:** CRUD works; **QA-form-on-submit, project-chat auto-create, task→chat alerts, task dependencies, Kanban, recurring tasks** missing or dead.
- **Chat:** global + DM work; **custom groups, @mention, read receipts, pinned messages, file/image sharing** missing; realtime depends on broadcast fix.
- **Notifications:** bell + list work; reminders dead (B5); bulk-insert bypasses observer (no realtime bell for reminders); no task-assignment notification.
- **Directory:** works (search, grid/list, send message).
- **Reports:** data endpoints work for HR (fallback masks the seeder gap); **exports dead** (B5); productivity formula wrong.
- **Settings/Company/Work-schedules/Holidays:** avatar/logo 500; **holidays corrupted** (B4); work-schedules bare-array/HR-403 inconsistency.
- **Profile:** works except avatar 500; change-password lacks client validation.
- **Cross-cutting:** audit log dead; SoftDeletes not applied; ~44 non-idempotent migrations; hardcoded violet brand color breaks dark theme; Calendar v8→v9 className mismatch drops date-picker styling; DataTable has no loading state.

---

## 6. Critical infrastructure truths

- **B5 — no worker/scheduler** (`apps/api/start.sh`). Highest-leverage fix; unblocks audit, exports, reminders, integrations.
- **Realtime transport mismatch** — Pusher in `cloudbuild.yaml` vs Reverb-in-`.env`-pointed-at-the-API's-own-URL. Every broadcast throws unless wrapped; reconcile to Pusher `ap2`.
- **Storage** — `AWS_USE_PATH_STYLE_ENDPOINT=false` is wrong for Supabase S3 (needs `true`); duplicate `s3`/`supabase` disks.
- **Migration drift** — ~44 non-idempotent migrations; `migrate --isolated` under `set -e` aborts on drift → missing columns → 500s (a likely contributor to B2/B3).
- **Capability cache** — not cleared post-seed (stale up to 1h).
- **🚨 Security** — `apps/api/.env` committed with live secrets; user pasted the full secret set in chat (twice). **Rotate everything; purge history.**

---

## 7. Authentication / authorization audit

- **AuthN:** solid (Sanctum + refresh + lockout). Gaps: idle forced logout, deep-link spinner, `PUT /auth/role` 500.
- **AuthZ:** server-side `RequireCapability` + `CapabilityMatrix` (cached 1h); frontend `hasCapability` (deny-list for `attendance.clock-self`).
  - **LIVE-confirmed good:** Admin is **denied** self-attendance (403 on `attendance/me/*`) — the role boundary holds at the API for the read path.
  - **LIVE-confirmed gaps:** HR 403 on `work-schedules`/`company-profile`; Employee 403 everywhere (onboarding, not caps).
  - **Code-level:** `GET /users/{id}` has **no authz** (any user reads any user); `reports.view` missing in seeder (masked by fallback); super_admin `*` wildcard + dead `SELF_SERVICE_EXCLUDED` constant (deny-list logic never wired — though live read-path is blocked, the write path/`POST clock-in` must be re-verified).
  - **`HrScope::managedDepartmentIds`** is the HR scoping primitive — used in attendance + leave; a throw here 500s every HR-scoped view (candidate contributor to B2/B3).

---

## 8. Frontend / UI / UX audit (workflow-affecting only)

- **Calendar** (`packages/ui/.../calendar.tsx`): react-day-picker **v8 className keys on v9.14** → selection/today/disabled/range styling silently missing across ALL themed date pickers.
- **DataTable:** no `isLoading` → misleading "No records" during fetch (approvals, reports, leave-history).
- **States:** several pages lack error+retry (attendance page, approvals-tab, leave-history-table, report-builder, profile) — they show empty/blank on failure instead of retry.
- **Dead cache keys:** `announcement-board` invalidates `queryKeys.announcements` (no subscriber) → never refreshes; `quick-task-widget` invalidates `dashboardMetrics` (dead). Cross-cutting mutations (user CRUD, leave approval, task CRUD) don't invalidate `dashboardInit`.
- **Crash sites remaining:** `quick-task-widget.tsx:23` (`usersData?.data || []` then `.map`); `upcoming-holidays-widget.tsx:77` (unguarded `format(new Date())` → RangeError); `profile` designations raw queryFn.
- **Hard reloads** instead of router state (leave form, approvals filter) → violates "no manual refresh."
- **Brand color hardcoded** (`bg-violet-600` 52×) → dark mode doesn't recolor primary.
- **Nav:** admin console + reports pages unreachable from sidebar; Communications gated on wrong cap key; command-palette clock actions not cap-gated.
- **Offline replay** doesn't invalidate cache after sync.

---

## 9. Backend / API / integration audit (workflow-affecting)

- **B4 holidays** — `HolidayController::index` caches Eloquent model instances (`Cache::remember` → `serialize`) → unserialize to `__PHP_Incomplete_Class`. **Fix:** cache plain arrays (`->toArray()`/`->map(fn=>[…])`) + `Cache::forget("holidays_{year}")`. (Also fix recurring Feb-29 `setYear` leap overflow.)
- **B2 attendance 500** — `teamToday`/`overview`/`hrToday` loop `AttendanceService::reconcileDay` per user, passing a cached `work_schedule` stdClass (`DB::table(...)->first()`). A user with a dangling `work_schedule_id` (deleted schedule) or null schedule null-derefs inside `reconcileDay`. **Fix:** null-guard `$schedule` in `reconcileDay` (fall back to defaults); validate `work_schedule_id` FK; stop caching the stdClass (or cache scalars). Confirm exact throw via Cloud Logging.
- **B3 leave-pending 500** — `LeaveRequest::with(['approval','user'])` (the `approval` morphOne) + paginate. For HR it also calls `HrScope::managedDepartmentIds`. **Fix:** confirm via Cloud Logging whether the throw is the morphOne serialization or `HrScope`; the `approval()` morphOne vs `approvalModel()` belongsTo dual-relation is a hazard — standardize on one.
- **Approval id mismatch** — `/approvals/{id}/decision` expects the **Approval** id; dashboard widget sends **leave_request** id → 404.
- **`AttendanceController::correct`** — `first()` then deref → null 500 (use `firstOrFail`).
- **No leave balance** — unlimited leave.
- **Late tz bug** — schedule time parsed as UTC → late never computed for IST.
- **`SendHolidayReminders`** — calls nonexistent `NotificationService::sendGlobalNotification`.
- **Bulk `Notification::insert()`** — bypasses observer → no realtime bell for reminders.
- **`ApprovalSubmitted`** — broadcasts to null channel (`approver_id` not on Approval).
- **Sync broadcasts** in Announcement/Task/Chat outside try/catch.
- **SoftDeletes** trait not applied (Department/Project/Task).
- **Reports** — `productivity_score` rewards hours; `leaveSummary` under-counts overlaps.

---

## 10. Spec gap analysis — Requirement Sheet vs actual (the big missing list)

These are **specified features that do not exist or are not functional** (not styling nits). Each is a build task in §15.

**Auth/Security:** Suspicious-login detection → notify HR/Admin (spec §6) ❌; "Gen2k Conglomerate (2018) • Milestone 1" info tooltip on login ❌ (verify).
**Tasks/Projects:** Kanban board (To Do/In Progress/Done + drag between columns) ❌; Task dependencies (B blocked-by A) ❌; Recurring tasks (daily/weekly/monthly, auto-recreate, HR notified) ❌; Per-project work timer UI (start/pause/resume/end, logged) ❌ (endpoint exists); QA form attached to project + required on task submission ❌ (verify wiring); Task inline comments exist ⚠️.
**Chat:** Custom group chats (HR creates, members-only) ❌; @mention dropdown ❌; DM read receipts ❌; HR pin messages in project chats ❌; Chat file/image sharing ❌ (spec §6); project chat auto-created on project create ❌ (verify).
**Notifications/Reminders:** Shift reminder 15 min before + 30-min-late → HR alert ❌ (queued→dead); Holiday 10-day reminder ❌; Weekly summary email to Admin every Sunday ❌; "bell shows only high-priority + system-global" filtering ❌ (verify); personal task reminders (employee) ❌.
**Reports:** Excel export (tables) ❌ (queued→dead); project-completion + task-statistics reports ❌ (verify); Admin weekly auto-email ❌.
**Compliance:** Audit log populating ❌ (dead worker); Leave balance ❌; Overtime heat-map color + server-calc ❌.
**UX engine:** Inline editing (pencil→edit-in-place, Enter/Escape) ❌; Drag-and-drop (task reorder, widget reorder) ❌; Gantt/timeline project view ❌; Pinned items (favorites) in sidebar ❌ (pins endpoint exists, UI?); Save-as-draft every 30s + restore banner ❌ (form draft exists, not 30s autosave); Progress-bar animate 0→value ❌ (verify); Empty-state illustrations + action buttons ⚠️ partial; Keyboard shortcuts Ctrl+N / Ctrl+/ ❌ (Ctrl+K exists).
**Dashboard widgets:** "each widget clickable to go deeper" + "refresh icon on hover" + "dismiss/rearrange" ⚠️ partial; widget rearrange (drag) ❌.
**Mobile:** One-field-per-screen form option ❌; admin console not in mobile nav ❌.
**Onboarding:** welcome screen exists, but **demo Employee not onboarded** (B1) and the gate hard-blocks everything.

---

## 11. Cross-module dependency map

```
B5 (worker/scheduler) ──► audit_logs, all exports, all reminders, leave→attendance integration, task→chat
B4 (holidays fix) ─────► calendar heatmap, upcoming-holidays widget, holiday-aware attendance, reminders
B2 (attendance 500) ───► HR/Admin dashboards, attendance pages, reports/attendance-summary, graphs
B3 (leave-pending 500) ► HR/Admin leave-approval queue, dashboard pending widget
B1 (onboarding) ───────► entire Employee role
RBAC (reports.view, users/{id} authz, deny-list) ► reports, user-detail, role boundaries
realtime (Pusher) ─────► chat live, notification bell, announcement live, attendance live
storage (path-style) ───► avatar, logo, chat files, project images
Calendar v9 fix ───────► every date picker (leave, filter, attendance, holiday)
```
**Foundational order:** B5 → B4 → B2/B3 → B1 → RBAC/realtime/storage → spec-feature build → UX engine → verify.

---

## 12. All identified gaps & defects (consolidated index)

See `context.md` §8 (code-level, with §-tags) and this doc §3–§10. Every item there is referenced by a task below.
Classification tags used: `MISSING` · `BROKEN` · `PARTIAL` · `WRONG-LOGIC` · `WRONG-PERM` · `FE-BE-MISMATCH` ·
`DATA` · `DEAD-ASYNC` · `SECURITY` · `UX` · `RESPONSIVE` · `CACHE`.

---

## 13. Required `context.md` corrections

`context.md` (rewritten last round) is accurate on code-level defects but **misses**:
1. The **live-confirmed** runtime failures B1–B5 (it describes them as code risks, not as currently-500ing).
2. The **full Requirement Sheet scope** — context.md was written before the spec was provided; it does not enumerate the ~15 missing spec features (§10). It must be reconstructed to define intended behavior for: Kanban, Gantt, @mention, read receipts, pinned messages, task dependencies, recurring tasks, per-project timer, QA-form-on-submit, custom group chats, file/image chat, all reminders, weekly summary email, leave balance, inline editing, drag-drop, pinned items, autosave, keyboard shortcuts, suspicious-login alerts.
3. **`HolidayController` model-caching bug** (B4) — not previously identified.
4. **Onboarding gate** behavior (B1) — the demo-employee lockout.
5. The **`identifier` login field** (not `email`) and the login response contract.
6. The **`reports.view` seeder-vs-fallback masking** (live HR gets 200 because the DB caps table is empty → fallback).

Action: after implementing §15, regenerate `context.md` from this doc so it is the authoritative, spec-aligned source of truth.

---

## 14. Dependency-aware implementation roadmap (phases)

- **Phase 0 — Unblock (B1–B5 + infra):** make the app load and the core workflows return 200.
- **Phase 1 — Correctness & permissions:** RBAC, leave balance, calculations, contracts.
- **Phase 2 — Auth reliability:** idle sessions, deep-links, role-switch.
- **Phase 3 — Spec feature build (the missing ~15):** Kanban, Gantt, @mention, dependencies, recurring, timer, QA-on-submit, group chats, chat files, reminders, weekly email, inline edit, drag-drop, pinned items, autosave, shortcuts.
- **Phase 4 — Frontend data/cache/UX:** invalidation, states, Calendar, DataTable, offline.
- **Phase 5 — Nav, mobile, polish.**
- **Phase 6 — Seed/demo data + verify + deploy.**

---

## 15. Detailed implementation task list

> Format: `ID [priority] [tags] — title`. `BE/FE/DB`. Each has scope + acceptance. Priorities: P0 (blocks core use),
> P1 (broken workflow), P2 (spec feature / polish). ~120 tasks.

### PHASE 0 — Unblock (do first; verify after each)

- ✅ `0.1 [P0][DEAD-ASYNC] BE/infra` — **Start queue worker + scheduler.** Add `php artisan queue:work database --tries=3 --max-time=3600 &` + a `schedule:run` loop to `start.sh` (keep `exec octane:start` PID 1), OR deploy separate Cloud Run worker+scheduler services. **Accept:** dispatched jobs drain from `jobs`; an approval writes `audit_logs`; `schedule:list` shows due tasks.
- ✅ `0.2 [P0][DATA] BE` — **Fix holidays corruption (B4).** `HolidayController::index`: cache **arrays** not models (`->map(fn($h)=>[...scalars...])->toArray()`); fix recurring Feb-29 `setYear` leap guard; `Cache::forget("holidays_{year}")` once. **Accept:** `GET /holidays` → JSON array of `{id,name,date,recurring,...}`.
- ✅ `0.3 [P0][BROKEN] BE` — **Fix attendance team/admin/HR 500 (B2).** Null-guard `$schedule` in `AttendanceService::reconcileDay` (default `start_time`/`standard_seconds`/`grace_minutes` when null); stop caching the work_schedule stdClass (cache scalars or query fresh); validate `users.work_schedule_id` FK; ensure a default work_schedule exists. Confirm exact throw via Cloud Logging. **Accept:** `GET /attendance/admin/overview`, `/team-today`, `/hr/today` → 200 for admin/HR.
- ✅ `0.4 [P0][BROKEN] BE` — **Fix `leave-requests/pending` 500 (B3).** Confirm via Cloud Logging (morphOne `approval` serialization vs `HrScope::managedDepartmentIds`); standardize `LeaveRequest` on ONE approval relation; wrap `HrScope` in try/catch returning `[]` on failure. **Accept:** `GET /leave-requests/pending` → 200 for admin+HR.
- ✅ `0.5 [P0][BROKEN][WRONG-PERM] BE/DB/seed` — **Unblock Employee (B1).** Either (a) complete onboarding for the demo employee via the onboarding flow + seed `onboarded_at=now()` for all demo accounts, AND (b) make `ForceOnboarding` not hard-block read-only dashboard data (or ensure the onboarding screen is reachable/completable). **Accept:** employee login → `GET /dashboard/init` → 200.
- ✅ `0.6 [P0][DEAD-ASYNC] BE/infra` — **Reconcile realtime transport.** Standardize on Pusher `ap2` in `.env`+secrets; remove self-referential `REVERB_HOST`; ensure `routes/channels.php` authorizes `private-user.{id}`, `private-conversation.{id}`, `presence-org`. (Or `BROADCAST_CONNECTION=log` to unblock, then switch.) **Accept:** notification in tab A → bell updates in tab B.
- ✅ `0.7 [P0][BROKEN] BE/infra` — **Fix storage (avatar/logo/chat files).** `AWS_USE_PATH_STYLE_ENDPOINT=true`; delete duplicate `supabase` disk; standardize all uploads on `filesystems.default`. **Accept:** avatar upload → 200 + image displays.
- ✅ `0.8 [P0][DATA] BE` — **Make all migrations idempotent + reconcile `migrations` table.** `hasColumn`/`hasTable`/`IF NOT EXISTS` guards on the ~44 non-idempotent files; `migrate:status` → 0 Pending; decouple `set -e` from migrate. **Accept:** re-run `migrate` is a no-op; no SQLSTATE in Cloud Logging.
- ✅ `0.9 [P0][SECURITY] infra` — **Rotate + purge secrets; add authenticated smoke test + migrate:status gate to `cloudbuild.yaml`.** **Accept:** no secrets in git history; CI fails on any authed-endpoint non-200 or Pending migration.
- ✅ `0.10 [P0][WRONG-PERM] BE` — **Clear capability cache post-seed + verify deny-list.** `DatabaseSeeder` calls `CapabilityMatrix::clearCache()`; wire `SELF_SERVICE_EXCLUDED` into `hasCapability` (deny overrides `*`); re-verify `POST /attendance/clock-in` → 403 for admin. **Accept:** admin clock-in 403 on the WRITE path too.

### PHASE 1 — Correctness & permissions

- ✅ `1.1 [P0][MISSING] DB/BE` — **Leave balance.** `leave_balances(user_id,type,year,allowed,used)`; allocate on user create + year rollover; check+deduct on approval; restore on reject/cancel; block at request if no balance (policy). **Accept:** 0-balance casual request → blocked; approval decrements; reject restores.
- ✅ `1.2 [P1][WRONG-PERM] BE` — **Authorize `GET /users/{id}`** (isSelf || canView). **Accept:** emp A → emp B = 403.
- ✅ `1.3 [P1][WRONG-PERM] BE/seed` — **Grant `reports.view` to HR+Employee** (catalog + seeder); add catalog-missing caps explicitly. **Accept:** HR/emp `GET /reports/data` → 200 in a SEEDED DB (not just fallback).
- ✅ `1.4 [P1][FE-BE-MISMATCH] BE` — **Fix approval id mismatch.** `/approvals/{id}/decision` resolve by `approvable_id` (or emit `approvals.id` from `DashboardController::init`); fix cache-bust to use `$approval->approvable_id`. **Accept:** approve from dashboard widget → 200 + status flips.
- ✅ `1.5 [P1][WRONG-LOGIC] BE` — **Late-detection timezone fix.** Build `$scheduledStart` in company tz (configurable, default `Asia/Kolkata`); compare instants. **Accept:** 09:30 IST vs 09:00+10grace → ~20 min late.
- ✅ `1.6 [P1][BROKEN] BE` — **`AttendanceController::correct` `firstOrFail`.** **Accept:** bad day → 404.
- ✅ `1.7 [P1][BROKEN] BE` — **`SendHolidayReminders`** method fix; route reminders through `NotificationService`/`Notification::create` (observer). **Accept:** command runs clean; bell pushes.
- ✅ `1.8 [P1][DEAD-ASYNC] BE` — **Reminder notifications via observer.** Replace bulk `Notification::insert` with `Notification::create` per row in `RemindShiftStart`/`AlertMissedClockIn`/`FlagOpenShifts`. **Accept:** reminder → live bell.
- ✅ `1.9 [P1][MISSING] BE` — **Task-assignment notification** on create + assignee change. **Accept:** assignee gets bell.
- ✅ `1.10 [P1][BROKEN] BE` — **`ApprovalSubmitted` channel** (role/dept presence, not null `approver_id`); queue `NotifyApprovalSubmitted`. **Accept:** no failing broadcast jobs.
- ✅ `1.11 [P1][WRONG-LOGIC] BE` — **Wrap sync broadcasts** (Announcement/Task/Chat) in try/catch or `DB::afterCommit`. **Accept:** broadcaster down → write still 200.
- ✅ `1.12 [P2][WRONG-LOGIC] BE` — **Reports:** redefine `productivity_score`; `leaveSummary` overlap predicate. **Accept:** spanning leave counted; score meaningful.
- ✅ `1.13 [P2][DATA] BE` — **Apply SoftDeletes trait** (Department/Project/Task); resolve `archived_at` vs `deleted_at`. **Accept:** soft-delete excludes from lists; restore works.
- ✅ `1.14 [P2][WRONG-LOGIC] BE` — **Attendance edge cases:** holidays in `reconcileDay`; midnight-crossing; respect `working_days` in reminders; include open-shift time in `total_seconds` (or document client-timer dependency). **Accept:** holiday → not absent; Sat-off → no reminder.
- ✅ `1.15 [P2][WRONG-LOGIC] BE` — **Holidays reminder dedup** (`lock_key`/correct `type` filter). **Accept:** no resend spam.

### PHASE 2 — Auth reliability

- ✅ `2.1 [P1][BROKEN] FE/BE` — **Stop idle forced logout.** Refresh `g4k_token` cookie on each successful `apiFetch` + `visibilitychange` heartbeat (or lengthen cookie TTL to refresh-token window). **Accept:** 20-min idle nav → stays logged in.
- ✅ `2.2 [P1][BROKEN] FE` — **Fix deep-link spinner.** Add `/onboarding`,`/role-select`,`/change-password` to middleware matcher (no-token→`/login`); client redirect when `!user`. **Accept:** logged-out paste → `/login`.
- ✅ `2.3 [P1][BROKEN] FE/BE` — **Capabilities cookie race.** Echo caps in login/role-select/refresh; write `g4k_capabilities` immediately. **Accept:** first protected nav post-login → no `?error=unauthorized`.
- ✅ `2.4 [P1][BROKEN] BE` — **Fix `PUT /auth/role`** (implement `getAssignedRoles` or reuse `RoleAssignment` query). **Accept:** → 200.
- ✅ `2.5 [P2][UX] FE` — **Role-select** consume response token (drop double `/auth/refresh`).

### PHASE 3 — Spec feature build (the missing ~15)

- ✅ `3.1 [P1][MISSING] FE/BE` — **Kanban board** for tasks (To Do/In Progress/Under Review/Done) + drag-between-columns status update. BE: task status PATCH; FE: dnd-kit board. **Accept:** drag card → status persists.
- ✅ `3.2 [P1][MISSING] FE/BE` — **Task dependencies** (`blocked_by`/`depends_on` self-ref on tasks); gate start. **Accept:** B cannot start while A pending.
- ✅ `3.3 [P1][MISSING] FE/BE` — **Recurring tasks** (daily/weekly-on-days/monthly-on-date; auto-recreate on completion; HR notified; turn-off). Advanced-collapsed section in create form. **Accept:** complete instance → next created.
- ✅ `3.4 [P1][MISSING] FE/BE` — **Per-project work timer** (start/pause/resume/end; logs time). BE `/timer/log` exists; build FE timer UI per project. **Accept:** time logged per project per day.
- ✅ `3.5 [P1][MISSING] FE/BE` — **QA form on project + required on task submission.** Wire `qa-forms` to project; employee fills QA on submit; HR reviews with QA answers. **Accept:** can't submit task without QA (when required).
- ✅ `3.6 [P1][MISSING] FE/BE` — **Custom group chats** (HR creates, members-only; employees see only added groups). BE conversation type + membership; FE create-group UI. **Accept:** non-member can't see group.
- ✅ `3.7 [P1][MISSING] FE/BE` — **@mention** in all chats (type `@` → dropdown of chat members; mention → notification w/ snippet). **Accept:** mentioned user notified.
- ✅ `3.8 [P1][MISSING] FE/BE` — **DM read receipts** + mark-on-open. **Accept:** sender sees read state.
- ✅ `3.9 [P1][MISSING] FE/BE` — **Pin messages in project chats (HR).** **Accept:** pinned stay on top.
- ✅ `3.10 [P1][MISSING] FE/BE` — **Chat file/image sharing** (popup w/ size/type limits). Storage path-style (0.7) prerequisite. **Accept:** image/file sends + previews.
- ✅ `3.11 [P1][MISSING] BE/scheduler` — **Shift reminders** (15-min before; 30-min-late → HR alert) + configurable times. Depends on 0.1. **Accept:** reminders fire at the right times.
- ✅ `3.12 [P1][MISSING] BE/scheduler` — **Holiday 10-day reminder** + **Admin weekly summary email (Sunday)**. Depends on 0.1 + SMTP. **Accept:** email delivered.
- ✅ `3.13 [P1][MISSING] BE` — **Suspicious-login detection → notify HR/Admin** (beyond lockout). **Accept:** anomalous login → notification.
- ✅ `3.14 [P2][MISSING] FE` — **Inline editing** (pencil→edit-in-place; Enter save / Esc cancel) for task/project/dept names.
- ✅ `3.15 [P2][MISSING] FE` — **Drag-and-drop** task reorder (persist order) + dashboard widget rearrange (persist per user).
- ✅ `3.16 [P2][MISSING] FE` — **Gantt/timeline** project view (bars + task diamond milestones).
- ✅ `3.17 [P2][MISSING] FE` — **Pinned items (favorites)** in sidebar (projects/tasks/profiles; pins endpoint exists → build UI).
- ✅ `3.18 [P2][MISSING] FE` — **Autosave draft every 30s** + restore banner ("You have an unsaved draft…").
- ✅ `3.19 [P2][MISSING] FE` — **Keyboard shortcuts** Ctrl+N (context new), Ctrl+/ (help overlay), Esc/Enter semantics.
- ✅ `3.20 [P2][MISSING] FE` — **Empty-state illustrations + action buttons** across all lists.
- ✅ `3.21 [P2][MISSING] FE` — **Progress-bar animate 0→value**; **bell high-priority-only filter**; **widget refresh-on-hover + click-to-deep-link**.
- ✅ `3.22 [P2][MISSING] FE` — **Complaint/feedback → DM to HR/Admin + high-priority notification** (feedback endpoint exists → wire routing).
- ✅ `3.23 [P2][MISSING] BE` — **Excel export** for reports (queued job, 0.1 prereq); project-completion + task-statistics reports.

### PHASE 4 — Frontend data / cache / UX

- `4.1 [P1][CACHE] FE` — Fix dead invalidation keys: `announcement-board`→`dashboardInit`; `quick-task-widget`→`dashboardInit`; add `dashboardInit` invalidation to user CRUD / leave approval / task CRUD.
- `4.2 [P1][BROKEN] FE` — Guard `quick-task-widget.tsx:23` (`Array.isArray`); `upcoming-holidays-widget.tsx:77` `safeFormat`; `profile` designations queryFn.
- `4.3 [P1][UX] UI` — **Calendar v8→v9 classNames** (`packages/ui/.../calendar.tsx`); verify across all pickers.
- `4.4 [P1][UX] UI` — **DataTable `isLoading`** + skeleton rows; wire into approvals/reports/leave-history.
- `4.5 [P1][UX] FE` — Add error+retry to attendance page, approvals-tab, leave-history-table, report-builder, profile, notifications-config.
- `4.6 [P2][UX] FE` — Remove hard reloads (leave form, approvals filter → router state).
- `4.7 [P2][CACHE] FE` — Offline replay invalidates cache; realtime gaps (announcements, attendance clock → dashboard widgets).
- `4.8 [P2][UX] FE` — Dedupe error toasts (global vs per-mutation).
- `4.9 [P2][UX] UI/FE` — Replace 52× hardcoded `bg-violet-600`→`primary` token (dark-mode safe); adopt radius token.
- `4.10 [P2][UX] FE` — mail-smtp themed inputs; FilterBar single-date themed; breadcrumb hierarchy map; delete dead code (TopbarTimer, orphan sessions/error, DataTable virtualizer).

### PHASE 5 — Nav, mobile, polish

- `5.1 [P1][UX] FE` — Surface admin console + reports in sidebar/command-palette; Communications cap key→`chat.access`; hide avatar Settings for unauthorized; consolidate Settings destinations; `/dashboard/reports` capability gate.
- `5.2 [P2][RESPONSIVE] FE` — Mobile: admin console in bottom nav/drawer; one-field-per-screen option for leave/task forms; fixed chat input above keyboard.
- `5.3 [P2][UX] FE` — Command-palette clock cap-gate; role-select token fix.

### PHASE 6 — Seed/demo data + verify + deploy

- `6.1 [P1][DATA] DB/seed` — **Realistic seed dataset:** multiple departments, multiple HR (each managing distinct depts), multiple employees (in different depts), a couple of projects w/ teams+tasks+QA forms, attendance history (incl. late/overtime/absent/holiday), leave requests across statuses, notifications, a global chat + a project chat + a DM, announcements (pinned+reacted), holidays (incl. recurring), work schedules (incl. a default). **All demo accounts onboarded.** Exercisable like a real org.
- `6.2 [P0][VERIFY]` — Run the **Verification Protocol (§17)** for Admin/HR/Employee on the live URL.
- `6.3 [P0][VERIFY]` — Cloud Logging 24h clean of: `RouteNotFoundException`, `SQLSTATE[42701|42703|42P01]`, `cURL error 60`, `BadMethodCallException`, `getAssignedRoles`, `__PHP_Incomplete_Class`, `reading 'length'`.
- `6.4 [P0][DEPLOY]` — Push to both repos; confirm Vercel new hash + Cloud Run new revision; re-run §17.

---

## 16. Workflow-specific acceptance criteria (end-to-end, all must pass)

Each traces the full chain (action→UI→API→service→DB→response→cache→UI→notification→history).

1. **Admin→Create Employee→Assign Dept→Employee logs in→clocks in→Admin/HR view attendance→Employee applies leave→HR/Admin approve→Employee sees status→notifications update.** Requires: 0.5 (onboarding), 0.3 (attendance views), 0.4 (leave pending), 1.1 (balance), 1.8 (bell).
2. **Admin→Create HR→Assign HR to Dept→HR logs in→sees only scoped data→manages attendance/leave/employees.** Requires: `HrScope` correct (0.4), caps (1.3), scoped views (0.3).
3. **Admin→Create Dept→Add multiple employees/HR→relationships across dashboards/attendance/leave/projects/tasks/notifications.** Requires: 0.2/0.3/0.4 + seed (6.1).
4. **Employee→clock in→break→clock out→continue shift→history heatmap + day detail.** Requires: 0.5, 1.5 (late), 0.2 (holidays), open-shift calc (1.14).
5. **HR→create project→add team→create tasks (incl. recurring + dependencies + QA)→assign→employee works (timer)→submits QA→HR approves/redo→status updates→global/project chat notified→audit logged.** Requires: 3.1–3.5, 0.1, 1.9, 1.10.
6. **Leave: request→balance checked→routes to correct approver→approve/reject→balance updates→notifications→history.** Requires: 1.1, 1.4.
7. **Chat: global + project (auto) + DM + custom group; @mention; read receipts; pin; file/image; realtime.** Requires: 0.6, 3.6–3.10.
8. **Notifications: bell shows high-priority only; reminders fire (shift/holiday/weekly); mark-read; realtime.** Requires: 0.1, 1.7/1.8, 3.11/3.12, 3.21.
9. **Reports: Admin/HR/Employee open (no 403); Excel export completes; productivity meaningful.** Requires: 1.3, 3.23, 1.12, 0.1.
10. **Profile: avatar uploads; password change validated; devices list + remote revoke.** Requires: 0.7, validation.
11. **UX: every list has loading/empty/error/disabled/perm-denied; date pickers styled; responsive 360–1536; no manual refresh; dark mode recolors.** Requires: 4.3–4.9, 5.2.

---

## 17. Verification Protocol (run for Admin, HR, Employee — nothing is "done" until this passes)

**BE (terminal, real tokens):**
```bash
BASE=https://g4k-api-579515345084.asia-south1.run.app/api
login admin/hr/employee (identifier+password) → token each
# Per role, ALL must be 200 (except intentional 403s):
for ep in dashboard/init notifications directory attendance/me/today leave-requests leave-requests/pending \
          projects tasks holidays announcements reports/data; do
  curl -s -o /dev/null -w "%{http_code} $ep\n" -H "Authorization: Bearer $TOK" -H "Accept: application/json" $BASE/$ep
done
# Specifics:
GET /holidays → JSON ARRAY (not __PHP_Incomplete_Class)
GET /attendance/admin/overview; /team-today; /hr/today → 200
GET /leave-requests/pending → 200
GET /dashboard/init as EMPLOYEE → 200 (onboarding unblocked)
POST /attendance/clock-in as ADMIN → 403; as HR/EMP → 200
php artisan migrate:status | grep -c Pending   # 0
SELECT count(*) FROM jobs WHERE ...            # drains after worker up
SELECT count(*) FROM audit_logs > 0            # after an action
```
**FE (clean incognito, each role):** dashboard renders <2s with real data; no console errors; no `ErrorBoundary`; avatar uploads; leave blocked by balance; approve-from-dashboard works; reports open for HR/Employee; date pickers styled; responsive 360/768/1280; no forced logout after 20-min idle; deep-links work; Employee fully usable.
**Cloud Logging 24h:** zero hits for the patterns in 6.3.

---

## 18. Data integrity requirements
- Every FK enforced and valid (no dangling `work_schedule_id`/`department_id`/`approval_id`).
- Leave balance atomic with approval (transaction + restore on reject).
- No duplicate attendance days per user per date; reconcile is idempotent.
- Audit row written for every state-changing action (worker up).
- Ownership/department scoping on every list (HR sees only managed depts).
- Soft-deletes consistent (trait applied where columns exist).
- Cache stores arrays only (never Eloquent instances) — prevents B4-class corruption.

## 19. Testing & verification strategy
- **Per-task unit/integration:** each BE task adds a feature test (status, shape, perms, edge). Each FE task: manual + (where feasible) component test.
- **Contract tests:** assert every list endpoint returns the documented shape (§context.md §9).
- **Role-isolation E2E:** scripted login-as-each-role + key workflows (§16).
- **Concurrency:** two users act simultaneously; no cross-contamination/duplicate records.
- **Regression gate in CI:** authenticated smoke + migrate:status (0.9) before every deploy.

## 20. Production-readiness checklist
- [ ] B1–B5 fixed and verified live. · [ ] Worker+scheduler running; audit/exports/reminders fire. · [ ] Realtime healthy.
- [ ] Storage uploads work. · [ ] Migrations idempotent; 0 Pending. · [ ] Secrets rotated+purged; CI smoke authed.
- [ ] RBAC airtight (admin no clock; HR/emp reports; users/{id} authz). · [ ] Leave balance enforced.
- [ ] All §16 workflows pass for 3 roles. · [ ] No console errors; all states present; responsive. · [ ] §17 passes; Cloud Logging 24h clean.

## 21. Final completion criteria
> After every task in §15 is implemented and §17 passes for Admin, HR, and Employee: all three roles can use the
> application continuously for real day-to-day operations — multiple departments, multiple HR, multiple employees,
> correct role isolation, real DB-backed data, reliable sync, accurate business logic, complete workflows (incl.
> the spec's Kanban/Gantt/@mention/dependencies/recurring/timer/QA/group-chat/reminders/exports), proper feedback,
> stable responsive UI, and **no broken or placeholder workflow remaining**.

---

### Appendix — the one-paragraph truth
The app isn't "almost there with bugs." Five runtime failures (Employee locked out by onboarding; attendance views
500; leave-pending 500; holidays corrupted; no worker/scheduler) make it non-functional for real use, and ~15
specified features were never built. Fix Phase 0 first (unblock + infra), then Phase 1 (correctness/permissions),
then Phase 3 (build the missing spec features), then Phase 4–5 (UX/nav), then seed + verify (§17) + deploy. This
plan is granular enough to execute one task at a time with no rediscovery of requirements.
