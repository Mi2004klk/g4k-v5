# context.md — Games4King Workplace OS: Complete Functional Specification

> **Purpose:** Single authoritative source of truth for what every feature must do, who can use it,
> and how it must behave end-to-end. Written as **precise functional requirements** — not vague notes.
> Another developer/AI must be able to implement from this without re-interpreting the client's intent.
>
> **Audit date:** 2026-08-11. **Scope:** Complete product, with exhaustive detail on Dashboard +
> Attendance (the user's focus areas). Other modules (Org, Leave, Projects, Tasks, Chat, Reports,
> Settings) are covered at the functional-workflow level.
>
> **Stack:** Laravel 13/PHP 8.4 + PostgreSQL (Supabase) + Reverb (Railway) · Next.js 16 +
> TypeScript + Tailwind v4 + Radix/shadcn (Vercel) · Monorepo: `apps/web`, `apps/api`, `packages/ui`.
> Three roles: **Super Admin** (karthik), **HR** (aravind), **Employee** (13 seeded users).

---

## TABLE OF CONTENTS
1. Roles, Capabilities & Permission Rules
2. Dashboard Module (complete specification)
3. Attendance Module (complete specification)
4. Other Modules (functional overview)
5. Verified Defects Catalog (drives `fix-6.md`)

---

## 1. ROLES, CAPABILITIES & PERMISSION RULES

### 1.1 The three system roles
| Role | Seed User | Password | Designation | Scope |
|---|---|---|---|---|
| **Super Admin** | karthik | Admin@123 | Director | Full control; company-wide oversight; manages attendance but does NOT clock in/out personally |
| **HR** | aravind | Hr@123 | HR Manager | Own-department scoping; team attendance oversight; leave approvals; corrections for own team |
| **Employee** | praveen + 12 others | Dev@123 | Various | Own work, personal attendance clock-in/out, personal leave requests, directory, chat |

> **CRITICAL RULE:** The 15 "roles" in seed data are **DESIGNATIONS** (job titles), NOT permission
> roles. Permissions are driven by the 3 system roles above. A user may hold multiple system roles
> → sees a Role Selection screen.

### 1.2 Attendance-specific permission rules
| Action | Super Admin | HR | Employee |
|---|---|---|---|
| Clock in/out/break (self) | **NO** — manages, does not clock | YES | YES |
| View personal attendance history | YES (if they clock in) | YES | YES |
| View company-wide attendance | **YES** (all departments) | NO | NO |
| View team attendance (own dept) | YES | **YES** | NO |
| Manual correction (any user) | **YES** | **own team only** | NO |
| Export attendance report | **YES** | **NO** (admin-only capability) | NO |
| Notify HR about open shifts | **YES** | NO | NO |
| Personal live timer on dashboard | **NO** | YES (if clocking in) | **YES** |

### 1.3 Dashboard-specific permission rules
| Area | Super Admin | HR | Employee |
|---|---|---|---|
| Dashboard scope | Full company | Team (own dept) | Personal |
| Company-wide metrics | YES | NO | NO |
| Team metrics | YES | YES | NO |
| Personal metrics | YES | YES | YES |
| Quick Task Assignment | YES (if has tasks.manage) | YES | NO |
| Announcements (create) | YES (company-wide) | YES (team-level) | NO |
| Announcements (view/react) | YES | YES | YES |

---

## 2. DASHBOARD MODULE — Complete Specification

### 2.1 Dashboard Shell & Welcome Banner

**Purpose:** The landing page after login/role-selection. Provides an at-a-glance overview of what
matters to the user's role, with quick-action shortcuts to the most frequent workflows.

**Functional Requirements:**
- The dashboard must render role-specific widgets based on `user.active_role`.
- A welcome banner shows: "Welcome back, {user.name}!" + a role-scoped subtitle + a role badge pill.
- Quick-action shortcut buttons provide ≤2-click access to the most frequent action per role.
- The widget layout (drag positions, sizes, collapse state) must persist per user and restore on reload.

**Page-by-Page Workflow:**
1. User logs in → role detected → dashboard renders with the correct widget catalog.
2. Welcome banner shows immediately from cached user data (no loading state).
3. Quick-action buttons render immediately (Links, no data fetch).
4. Widgets prefetch in parallel (dashboard metrics, attendance today, pending approvals, announcements, quick notes).
5. Widget engine loads saved layout from `/auth/preferences`; renders widgets in the saved grid.
6. User can drag/resize/collapse widgets; changes debounce-save after 1s of inactivity.
7. On revisit (within staleTime), widgets render instantly from cache; background refetch is silent.

**Available Actions & Options:**
- **Super Admin shortcuts:** "Manage Users" (→ /dashboard/org/users), "Manage Departments" (→ /dashboard/org/departments), "Open Directory" (→ /dashboard/directory).
- **HR shortcuts:** "View Team Attendance" (→ /dashboard/org/attendance), "Approve Leave" (→ /dashboard/org/leave?status=pending), "Open Directory" (→ /dashboard/directory).
- **Employee shortcuts:** "Request Leave" (→ /dashboard/leave), "Open Directory" (→ /dashboard/directory).
- **All roles:** drag widget by header, resize via corner handle, collapse via chevron in widget header (Quick Notes).

**Data & Calculations:**
- `GET /dashboard/metrics` returns per-role metrics (counts, statuses, activity feed). Cached 5 min on the backend per user/role/day.
- `GET /auth/preferences` returns `{ preferences: { dashboard_layout: {lg/md/sm/xs/xxs: [...]} } }`.

**Status / Lifecycle:**
- Cold load: skeleton cards (3×) for 1 paint frame → widgets populate progressively as data arrives.
- Revisit: cached data renders instantly; `isFetching` spinner in widget header during background refresh.
- Error: per-widget error boundary → rose error card with Retry button. A failed widget does NOT block others.

**Frontend Behavior:**
- Widget catalog is memoized by `activeRole` (`useMemo([activeRole])`).
- `WidgetEngine` uses React Grid Layout (dynamic-imported, ssr:false). Breakpoints: lg/md/sm/xs/xxs. Cols: 12/10/6/4/2. Row height: 120px. Margin: 16px.
- Drag-click separation: 5px movement threshold + `pointer-events:none` on interactive elements during drag.
- Collapse: `widgetStates[id].collapsed` → sets `h:1, minH:1, maxH:1`.

**Backend Integration:**
- `GET /api/dashboard/metrics` (capability: authenticated). Returns `{ metrics: {...}, role: "..." }`.
- `GET /api/auth/preferences` (capability: authenticated). Returns `{ preferences: {...} }`.
- `PUT /api/auth/preferences` (capability: authenticated). Accepts `{ preferences: { dashboard_layout } }`.

**Validation & Edge Cases:**
- No saved layout → default layout (all widgets in a vertical/grid stack per breakpoint).
- Saved layout references a removed widget → filtered out; new widgets appended.
- Empty data (0 projects, 0 tasks) → widget shows `0` or its real empty state, never mock data.
- User has no department (HR) → team metrics return 0.

**Notifications / Feedback:**
- `?error=unauthorized` in URL → toast "You don't have access to that section." + URL cleaned.
- Layout save errors → swallowed silently (non-critical).

**Responsive & Interaction Requirements:**
- Desktop (lg 1200+): 12-col grid, widgets in multi-column layout.
- Tablet (md 768-996): 10-col, widgets reflow.
- Mobile (sm/xs/xxs): single column, widgets stack vertically.
- Drag/resize on touch devices via react-grid-layout touch support.

**Expected End-to-End Result:** User sees a personalized dashboard with relevant widgets, can
rearrange them, and every widget shows real data or a meaningful empty state — never a stuck loader
or a placeholder.

---

### 2.2 Super Admin Dashboard Widgets

**Purpose:** Give the Admin a company-wide command center: employees, attendance, projects, tasks,
approvals, and recent activity.

**Functional Requirements — widget catalog (6 widgets):**

| # | Widget | Purpose | Data Source | Status |
|---|---|---|---|---|
| 1 | **Total Employees** | Active/inactive employee count | `metrics.total_employees` + `metrics.active_employees` | ✅ Working |
| 2 | **Today's Attendance** | Company-wide present/late/absent snapshot + link to full console | `GET /attendance/admin/overview?date=today` | ✅ Working |
| 3 | **Active Projects** | Count of active projects across all teams | `metrics.active_projects` | ✅ Working |
| 4 | **Pending Tasks** | Count of tasks in todo/in_progress/review | `metrics.pending_tasks` | ✅ Working |
| 5 | **Recent Activity** | Dense audit feed (last 10 actions) | `metrics.recent_activity` (audit_logs) | ❌ **BROKEN** — reads `.created_at/.model_type/.details` but backend returns `.at/.subject_type/.meta` → throws on data → ErrorBoundary catches |
| 6 | **Quick Notes** | Private sticky notes | `GET/POST/DELETE /quick-notes` | ✅ Working |

**MISSING from Admin dashboard (per spec R4.6):**
- **Pending Approvals widget** — spec says Admin should see pending approvals (tasks/projects/leave) with quick-access. Currently the `pending_approvals` metric IS returned by the backend but NO widget surfaces it. The `PendingApprovalsWidget` exists but is only mounted on the HR dashboard.
- **Announcement Board** — spec (R8.12) says dashboard should display announcements (closeable, pinned). Currently `AnnouncementBoard` is NOT on any dashboard — only on `/dashboard/announcements` and `/dashboard/chat`.

**Role & Permission Rules:**
- Admin sees company-wide counts (not scoped by department).
- Admin does NOT have a personal clock-in widget (spec: "Admin manages attendance but does not use employee clock-in/clock-out controls").
- Admin dashboard prefetches `adminAttendance(today, "all")` alongside other widget data.

**Data & Calculations:**
- `total_employees` = `User::count()`. `active_employees` = `User::where('status','active')->count()`.
- `present_today/absent_today/late_today/leave_today` = aggregate of `attendance_days` for today.
- `recent_activity` = `audit_logs LEFT JOIN users` ordered by `at DESC`, limit 10. Fields: `id, action, subject_type, subject_id, at, user_name, meta`.

**Expected End-to-End Result:** Admin sees a real-time command center with employee counts, today's
attendance snapshot, active work, recent audit activity, and can act on approvals/announcements
directly from the dashboard.

---

### 2.3 HR Dashboard Widgets

**Purpose:** Give HR a team operations center: team attendance, pending leave, project submissions,
and team activity.

**Functional Requirements — widget catalog (6 widgets):**

| # | Widget | Purpose | Data Source | Status |
|---|---|---|---|---|
| 1 | **Team Attendance** | Today's team present/absent/late snapshot + link to full report | `GET /attendance/hr/today?date=today` | ✅ Working |
| 2 | **Pending Leave Approvals** | Quick approve/reject list of pending leave requests | `GET /approvals/pending` | ✅ Working |
| 3 | **Active Projects** | Count of own-team projects | `metrics.active_projects` | ✅ Working |
| 4 | **Pending Submissions** | Count of task/project submissions awaiting review | `metrics.pending_submissions` | ❌ **ALWAYS 0** — backend hardcodes `$data['pending_submissions'] = 0` |
| 5 | **Team Activity Feed** | Late arrivals, manual corrections, open shifts for the team | `GET /attendance/hr/today` | ❌ **BROKEN** — reads `data.members` but API returns `{data:[...]}` paginator, no `members` key → always shows empty state |
| 6 | **Quick Task Assignment** | Form: pick employee + task title → assigns task → notifies Global Chat | `GET /users` + `POST /tasks` | ⚠️ **PARTIAL** — works but `?limit=50` is silently ignored (UserController returns only 20 per page) |

**MISSING from HR dashboard:**
- **Quick Notes** — Admin and Employee have it, but HR does NOT. Inconsistent.
- **Announcement Board** — spec says HR can post team-level announcements and they should display on the dashboard.

**Role & Permission Rules:**
- HR metrics are scoped to `users.department_id = HR's department`. If HR has no department → all metrics return 0.
- HR sees only own-team leave requests in `PendingApprovalsWidget` (scoped by `/approvals/pending` endpoint).
- HR can approve/reject leave from the widget (1-click approve; reject needs no confirm dialog at widget level).

**Data & Calculations:**
- `pending_submissions` SHOULD count tasks/projects submitted for review where the submitter is in HR's team. Currently always 0 (backend stub).
- Team activity SHOULD show: late clock-ins (status=late), manual corrections (events with `is_manual=true`), open shifts (clock_in without clock_out). Currently broken because the widget expects a `members` aggregate that the endpoint doesn't return.

**Expected End-to-End Result:** HR opens the dashboard and immediately sees who's present/late/absent
on the team today, can approve pending leave with one click, knows how many submissions need review,
and sees anomalies (late/manual/open-shift) in real time.

---

### 2.4 Employee Dashboard Widgets

**Purpose:** Give the employee a personal self-service hub: clock-in, task overview, approval status.

**Functional Requirements — widget catalog (6 widgets):**

| # | Widget | Purpose | Data Source | Status |
|---|---|---|---|---|
| 1 | **Time Clock** | Clock in/out, start/end break, live HH:MM:SS timer, overtime amber | `GET /attendance/me/today` | ✅ Working (see §3 for full spec) |
| 2 | **My Projects** | Count of active projects I'm a member of | `metrics.active_projects` (project_members join) | ✅ Working |
| 3 | **My Pending Tasks** | Count of my tasks in todo/in_progress/review | `metrics.pending_tasks` (assignee_id = me) | ✅ Working |
| 4 | **Task Progress** | Progress bar of completed vs pending tasks | `metrics.completed_tasks` / `metrics.pending_tasks` | ❌ **BROKEN** — backend never returns `completed_tasks` → progress always 0% |
| 5 | **Quick Notes** | Private sticky notes | `GET/POST/DELETE /quick-notes` | ✅ Working |
| 6 | **Approval Status** | My recent leave requests + status badges | `GET /leave-requests/history` | ✅ Working |

**MISSING from Employee dashboard:**
- **Announcement Board** — employees should see company/team announcements on the dashboard (R8.12). Currently absent.

**Data & Calculations:**
- `active_projects` for employee = count of `project_members` where `user_id = me` AND project status = active.
- `pending_tasks` for employee = count of `tasks` where `assignee_id = me` AND status IN (todo, in_progress, review).
- `completed_tasks` SHOULD = count of tasks where `assignee_id = me` AND status = done. **Backend must add this.**
- `my_today_status` = the employee's `attendance_days.status` for today (present/late/absent/leave).

**Expected End-to-End Result:** Employee opens the dashboard, immediately clocks in (or sees their
running shift timer), sees how many tasks are pending, tracks their sprint progress, checks leave
approval status, and reads company announcements — all without navigating elsewhere.

---

### 2.5 Announcement Board Widget (spec — should be on all dashboards)

**Purpose:** Display company-wide (Admin-posted) and team-level (HR-posted) announcements on the
dashboard. Pinned announcements stay at top. Users can react (one like per person). Dashboard display
is closeable (per-user dismiss).

**Functional Requirements:**
- Show announcements scoped to the user: company-wide (all roles) + team-level (if HR posted for their dept).
- Pinned announcements appear first (sorted by `pinned_at DESC, created_at DESC`).
- Each announcement shows: title, body, author (name + avatar), scope tag (Company/Team), timestamp.
- Users can react with emoji (like/heart/party) — ONE reaction per person per announcement (toggle).
- Admin/HR can pin/unpin and delete.
- Per-user dismiss: clicking X hides that announcement from the dashboard (but NOT from the announcements page).
- Realtime: new announcements appear instantly via Reverb `public-announcements` channel.

**Role & Permission Rules:**
- Admin: create company-wide announcements, pin, delete any.
- HR: create team-level announcements (scoped to their department), pin, delete own.
- Employee: view + react only.

**Backend Integration:**
- `GET /announcements` → flat array of announcement objects with `creator`, `pinned_at`, `reactions`.
- `POST /announcements` (Admin/HR) → creates with `scope` (company/team) + `team_id` if team.
- `POST /announcements/{id}/react` `{emoji}` → toggles the user's reaction (one per person).
- `PUT /announcements/{id}` `{pinned}` → pin/unpin.
- `DELETE /announcements/{id}` → delete.
- Reverb: `AnnouncementCreated` broadcasts on `public-announcements`.

**Current Status:** The `AnnouncementBoard` component EXISTS and works (reactions, pin, delete,
realtime). But it is **NOT mounted on any dashboard** — only on `/dashboard/announcements` and
`/dashboard/chat`. The dashboard prefetches `announcements` data but no widget consumes it.

**Expected End-to-End Result:** Every role sees relevant announcements pinned to their dashboard,
can react, and can dismiss individually. Admin/HR can post directly from the dashboard.

---

### 2.6 Quick Notes Widget

**Purpose:** Private sticky notes pinned to the dashboard. Each user has their own notes.

**Functional Requirements:**
- Display a list of the user's notes (body text, newest first).
- Add a note: text input + Add button (or Enter key). Creates via `POST /quick-notes {body}`.
- Delete a note: trash icon per note. Deletes via `DELETE /quick-notes/{id}`.
- Collapse/expand the widget via the widget header chevron.
- Notes are private — only the authenticated user's notes are shown.

**Backend Integration:**
- `GET /quick-notes` → flat array `[{id, body, user_id, created_at}]`.
- `POST /quick-notes` `{body}` → creates, returns the note.
- `DELETE /quick-notes/{id}` → deletes (scoped to owner).

**Current Status:** ✅ Working. Mounted on Admin + Employee dashboards. **NOT on HR dashboard**
(inconsistency — should be added).

---

### 2.7 Quick Task Assignment Widget

**Purpose:** Let HR/Admin quickly assign a task to an employee from the dashboard. On completion,
Global Chat is auto-notified (R7.11).

**Functional Requirements:**
- Employee picker (searchable dropdown/combobox of all active employees).
- Task title input + optional description.
- Submit → creates a task assigned to the selected employee → invalidates task cache → success toast.
- On the employee's side: the task appears in their "My Tasks" list.
- On completion: a notification is auto-posted to the Global Chat.

**Backend Integration:**
- `GET /users` → list of active employees for the picker.
- `POST /tasks` `{title, assignee_id, notify_global_chat: true}` → creates task.

**Current Status:** ⚠️ Partially working. The widget exists and creates tasks. But:
- `GET /users?limit=50` is sent — `UserController::index` ignores the `limit` param and always returns 20 per page. For orgs >20 employees, the picker is incomplete.
- No `notify_global_chat` handling visible on the backend `TaskController::store`.

---

## 3. ATTENDANCE MODULE — Complete Specification

### 3.1 Employee Clock-In / Clock-Out / Break Lifecycle

**Purpose:** Let employees record their work hours with a simple clock-in → break → clock-out flow.
The live timer runs continuously, survives navigation, and turns amber on overtime.

**Functional Requirements:**
- **Clock In:** One tap → starts the shift. Records a `clock_in` event with timestamp + `client_id` (idempotency key). Timer starts ticking from the clock-in time.
- **Start Break:** One tap → pauses the active timer. Records a `break_start` event. Timer visually freezes.
- **End Break:** One tap → resumes the timer. Records a `break_end` event. Timer continues from where it left off.
- **Clock Out:** Opens a confirmation dialog ("Confirm End Shift?") → on confirm, records a `clock_out` event. Timer stops. If currently on break, a synthetic `break_end` is recorded first.
- **Live Timer:** Displays HH:MM:SS counting up. Continues across page navigation (Zustand store + `setInterval` in `LiveTimer` component). Turns amber-500 when `displaySeconds > standard_seconds` (default 31500s = 8h 45m). Shows "+HH:MM:SS" overtime caption.
- **State Machine:** `not_started` → (clock_in) → `active` → (start_break) → `on_break` → (end_break) → `active` → (clock_out) → `completed`. Once `completed`, the widget becomes inert for the rest of the day (no re-clock-in without HR correction).
- **Optimistic UI:** All punches update the UI instantly (store mutation) BEFORE the server confirms. On failure, the store reverts by re-fetching `/attendance/me/today`.
- **Offline:** Punches are queued in IndexedDB via `offlineEngine.recordPunch()`. When back online, queued punches replay to the server. A toast confirms "Action queued." On sync failure, a window event `attendance-sync-failed` triggers a re-fetch + rollback.

**Role & Permission Rules:**
- Employee + HR can clock in/out (capability `attendance.clock-self`).
- **Admin does NOT clock in/out** — no Time Clock widget on the Admin dashboard. The Admin's role is to oversee company-wide attendance, not track personal hours. (Currently enforced by widget visibility, not by capability — Admin technically has the `*` wildcard cap. Consider whether to explicitly exclude Admin from `attendance.clock-self` or rely on UI gating.)

**Page-by-Page Workflow:**
1. Employee opens dashboard → sees Time Clock widget with current state (`not_started` / `active` / `on_break` / `completed`).
2. State `not_started`: "Clock In" button (emerald, full-width, h-12, Play icon).
3. Tap Clock In → optimistic: store sets `active`, timer starts → `offlineEngine.recordPunch("clock_in", timestamp)` → on success: invalidate `attendanceToday` → toast "Recorded: CLOCK IN".
4. State `active`: "Break" button (outline, warning color, Coffee icon) + "Clock Out" button (destructive, Square icon). Timer ticking.
5. Tap Break → optimistic: store rolls running seconds into `baseSeconds`, sets `isOnBreak` → timer freezes → punch recorded → toast.
6. State `on_break`: "Resume Work" button (emerald, Play icon). Timer frozen.
7. Tap Resume → optimistic: store clears break, sets `lastActiveTimestamp = now` → timer resumes → punch recorded.
8. Tap Clock Out → AlertDialog "Confirm End Shift?" → on confirm: if on break, record `break_end` first → record `clock_out` → store stops timer → invalidate → toast.
9. State `completed`: "Shift completed for today." text. No buttons.

**Data & Calculations:**
- `total_seconds` = sum of all closed work segments (clock_in→break_start + break_end→clock_out + clock_in→clock_out). Does NOT include currently-running open time (the frontend adds that via `Date.now() - lastActiveTimestamp`).
- `break_seconds` = sum of all break segments (break_start→break_end, or break_start→clock_out if clock-out auto-closes a break).
- `overtime_seconds = max(0, total_seconds - standard_seconds)`.
- `late_minutes = floor((firstClockIn - scheduledStart) / 60)` if `firstClockIn > scheduledStart + grace*60`.
- `standard_seconds` = from `work_schedules.standard_seconds` (default 31500 = 8h45m).
- `grace_minutes` = from `work_schedules.grace_minutes` (default 10).

**Status / Lifecycle:**
- `absent` — no clock_in event for the day.
- `late` — clock_in after `scheduledStart + grace`.
- `present` — clock_in before/at `scheduledStart + grace`.
- `leave` — approved leave for the day (set by `LeaveAttendanceIntegration`).
- `has_open_shift` — last event is `clock_in` or `break_end` (no clock_out). Flagged by `FlagOpenShifts` job for previous days.

**Backend Integration:**
- `POST /attendance/clock-in` `{client_id, timestamp?, meta?}` → `{day, events}`.
- `POST /attendance/start-break` (alias: `/break-start`) `{client_id, timestamp?}` → `{day, events}`.
- `POST /attendance/end-break` (alias: `/break-end`) `{client_id, timestamp?}` → `{day, events}`.
- `POST /attendance/clock-out` `{client_id, timestamp?}` → `{day, events}`.
- `GET /attendance/me/today` → `{day: AttendanceDay|null, events: AttendanceEvent[], standard_seconds: int}`. Sets ETag + `Cache-Control: private, max-age=30`.
- State machine enforced in `AttendanceService::recordEvent()`. Idempotency via unique `client_id`.
- `reconcileDay()` called after every event → recomputes totals/status.

**Validation & Edge Cases:**
- **BUG: `meToday` 500s when no `attendance_days` row exists** — line 146: `$day->updated_at` dereferences null when `$day` is null (brand-new user, never clocked in today). Fix: `$day?->updated_at ?? ''`.
- Duplicate punch (same `client_id`) → silently ignored (idempotency).
- Future timestamp (> now + 5 min) → rejected in `sync` endpoint.
- Invalid sequence (e.g., break_start without clock_in) → `ValidationException`.
- Cross-midnight: clock_in on day D + clock_out on day D+1 → attributed to day D (48h event window).
- Clock-out while on break → auto-closes break (synthetic `break_end` event recorded).

**Notifications / Feedback:**
- Clock in/out/break → success toast "Recorded: {TYPE}".
- Sync failure → error toast + "Offline Mode" badge + Retry link.
- `RemindShiftStart` job → info notification to employee 15 min before shift start.
- `AlertMissedClockIn` job → high-priority notification to HR 30 min after shift start if employee hasn't clocked in.
- `FlagOpenShifts` job → notification to employee "Missing Clock-Out" + to HR "Open Shift Flagged".

**Responsive & Interaction Requirements:**
- Clock buttons ≥48px height on mobile (R8 mobile attendance).
- Timer text: `text-4xl sm:text-5xl font-mono font-bold tabular-nums`.
- Widget spans 4 columns on desktop (md:col-span-4), full width on mobile.

**Expected End-to-End Result:** Employee clocks in with one tap, sees the timer running, takes
breaks that pause the timer, and clocks out with a confirmation. The backend records all events
correctly, computes worked/break/overtime/late, and the UI reflects server truth within one
round-trip. Offline punches queue and sync seamlessly.

---

### 3.2 Employee Attendance History & Calendar

**Purpose:** Let employees review their attendance history via a calendar heatmap with per-day detail.

**Functional Requirements:**
- Calendar heatmap (ECharts visualMap) showing the current month with color-coded statuses.
- Prev/Next month navigation.
- Color map: absent=light red, late=amber, present=green, overtime=deep green, leave=blue.
- Click any day → Dialog with: status badge, late badge (if late), total worked hours, overtime delta, punch timeline (events with device platform), projects worked on, tasks worked on.
- Tooltip on calendar cell shows: status, worked hours, overtime.

**Backend Integration:**
- `GET /attendance/me/history` → cursor-paginated `{data: AttendanceDay[], next_cursor}`. Each day enriched with `projects` and `tasks` from `TaskTimeLog`.
- `GET /attendance/me/day/{date}` → `{day, events}` for the day-detail dialog.

**Current Status:** ✅ Working. Responsive ECharts heatmap with month navigation + per-day popover.

---

### 3.3 Admin Company-Wide Attendance Console

**Purpose:** Give the Admin a full company-wide attendance console with filters, analytics, trends,
open-shift management, and export.

**Functional Requirements:**
- **Tabs** (URL-synced): "Today" (Overview table), "Analytics" (summary cards + trends graph), "Open Shifts" (open-shift table).
- **Overview Table:**
  - Filters: date picker, status pills (all/present/absent/late/leave), department dropdown, debounced search (by employee name/email).
  - Columns: checkbox, Employee (name + email + open-shift badge), Department, Status (badge + View Leave link for leave), Clock In, Clock Out, Worked Hours, Overtime.
  - Row click → side Sheet with day timeline + full history calendar for that employee.
  - Export: "Export Company" (full date) + "Export Selected" (selected rows only).
- **Analytics Cards:** Present count, Late count, Absent count, On Leave count, Avg Clock-In time, Total Overtime. Computed client-side from the overview data.
- **Trends Graph:** Company-wide weekly/monthly trends. Toggle: Company Overview / By Department. Toggle: This Week / This Month. Date picker.
- **Open Shifts Table:** Lists employees with `has_open_shift=true` (clock_in without clock_out). Bulk "Notify HR" button. Per-row "Assign Correction" → opens correction dialog with pre-filled `clock_out`.

**Role & Permission Rules:**
- Admin only (capability `admin.view-all-attendance`).
- Admin sees ALL departments (no scoping).

**Backend Integration:**
- `GET /attendance/admin/overview?date=&department_id=&status=&search=` → `{data: [...], next_cursor}` (cursor-paginated 20). Each record: `user_name, user_email, department_id, status, clock_in, clock_out, total_seconds, overtime_seconds, late_minutes, has_open_shift`.
- `GET /attendance/admin/graph?groupBy=&mode=&date=` → **DOES NOT EXIST** (only `/hr/graph` exists). **Admin trends graph is BROKEN (404).**
- `POST /attendance/admin/notify-open-shifts` `{ids: [...]}` → sends notifications to HR users.
- `GET /attendance/export?start_date=&end_date=` → streamed XLSX. Columns: Date, Name, Email, Status, Total Worked, Overtime, Late.
- `GET /attendance/hr/day/{date}/{userId}` → `{day, events, user}` for the side Sheet (Admin can call HR endpoints via `*` wildcard).

**Data & Calculations:**
- Analytics computed client-side in `useMemo` from the overview `data` array.
- Avg Clock-In = average of `new Date(clock_in).getHours()*60 + getMinutes()` across all records (browser-local TZ).

**Verified Defects:**
1. **Trends graph 404s** — `/attendance/admin/graph` route does not exist. The component assumes it does.
2. **Department column always shows "—"** — the API returns `department_id` (number), not `department_name`. The table reads `row.original.department_name` (undefined).
3. **Search by name/email never matches** — the `select` function filters by `item.user?.name` / `item.user?.email`, but the API returns flattened `user_name` / `user_email` (no nested `user` object).
4. **"Export Selected" exports the full company** — `handleExport(all: boolean)` ignores the `all` param; both buttons export the same data.
5. **Bulk "Notify HR" sends row indices, not IDs** — `DataTable`'s `defaultGetRowId` returns the row index (`"0", "1", ...`), not `attendance_days.id`. The `notifyOpenShifts` validator `ids.* => exists:attendance_days,id` rejects indices → 422.
6. **`meToday` 500s for new users** — null property access on `$day->updated_at` when no attendance_days row exists yet.

**Expected End-to-End Result:** Admin opens the console, sees the entire company's attendance for
any date, filters by status/department/search, views per-employee timelines, corrects open shifts,
notifies HR, sees analytics + trends, and exports to Excel — all working, no broken tabs or
silent failures.

---

### 3.4 HR Team Attendance Console

**Purpose:** Give HR a team-scoped attendance console (own department only) with filters, analytics,
graph, and correction capabilities.

**Functional Requirements:**
- **Tabs** (URL-synced): "Today's Status" (analytics cards + table), "Trends & Graphs".
- **Table:** Same columns/filters as Admin (date, status, dept, search) but scoped to HR's department.
- **Analytics Cards:** Present, Late, Absent, On Leave. Computed client-side.
- **Trends Graph:** Team weekly/monthly. Toggle: Team Overview / Per Employee. This Week / This Month.
- **Correction Dialog:** Add/edit/remove an attendance event for a team member. Mandatory reason field. Shows predicted reconciled totals. On submit → `POST /attendance/correct` → re-reconciles → invalidates caches.
- **Side Sheet:** Click an employee → day timeline + full history calendar.

**Role & Permission Rules:**
- HR (capability `hr.view-team-attendance`). Scoped to `users.department_id = HR's department_id`.
- HR can correct own-team members only (`attendance.correct-team` capability). The `/correct` endpoint checks `targetUser.department_id === actor.department_id`.
- **HR CANNOT export** — the `/attendance/export` route is guarded by `admin.view-all-attendance`. The HR table has an Export button but it will 403.

**Backend Integration:**
- `GET /attendance/hr/today?date=&department_id=&status=&search=` → `{data: [...], next_cursor}` scoped to HR's dept.
- `GET /attendance/hr/graph?groupBy=&mode=&date=` → `{stats: [...]}`. ✅ Exists and works.
- `GET /attendance/hr/day/{date}/{userId}` → `{day, events, user}`. Department check enforced.
- `GET /attendance/hr/history/{userId}` → `{data: [...], next_cursor, user}`. Department check enforced.
- `POST /attendance/correct` `{action, attendance_day_id, event_id?, type?, timestamp?, reason}` → re-reconciles, audit-logs, notifies the affected employee.

**Verified Defects:**
1. **HR Export button 403s** — the export endpoint requires `admin.view-all-attendance`, which HR lacks. The button should either be removed from the HR table, OR a separate HR-scoped export endpoint should be created.
2. **Department column always "—"** — same as Admin (API returns `department_id`, not `department_name`).
3. **Search broken** — same as Admin (`select` uses `item.user?.name`, API returns `user_name`).
4. **Team Activity Feed widget broken** — reads `data.members` (nonexistent key). The `hrToday` endpoint returns `{data: [...]}` paginator, not a `members` aggregate.

**Expected End-to-End Result:** HR sees only their team's attendance, can filter/search, view
per-employee timelines, correct mistakes with a reason, see trends over time — and every button
works without 403s or silent failures.

---

### 3.5 Manual Correction Workflow

**Purpose:** Let HR (own team) and Admin (anyone) correct attendance entries — add missing punches,
edit wrong times, remove erroneous events — with an audit trail and mandatory reason.

**Functional Requirements:**
- Accessible from: Admin table (row click → side sheet → or open-shift "Assign Correction"), HR table (same path).
- **Dialog Fields:**
  - Action: Add Event / Edit Event / Remove Event (radio/select).
  - Target Event (when edit/remove): dropdown of existing events for that day.
  - Event Type (when add/edit): clock_in / break_start / break_end / clock_out.
  - Time: datetime input (formatted as "YYYY-MM-DD HH:mm:ss").
  - Reason: mandatory textarea (max 500 chars).
- **Predicted Reconciliation:** Client-side simulation shows current vs predicted totals (worked hours, overtime, break) with strikethrough on old values.
- On submit → `POST /attendance/correct` → transactional: applies the action, sets `source='manual'`, inserts `attendance_corrections` row, calls `reconcileDay(forceRecompute=true)`, audit-logs, notifies the affected employee.
- On success → invalidates `hr-attendance-today`, `hr-member-attendance-day`, `org-attendance` → dialog closes → toast.

**Backend Integration:**
- `POST /attendance/correct` (capability `admin.correct-attendance|attendance.correct-team`).
- Accepts: `{action: "add_event"|"edit_event"|"remove_event", attendance_day_id: int, event_id?: int, type?: string, timestamp?: string, reason: string}`.
- Returns: `{message, day, events}`.
- `AttendanceService::reconcileDay(forceRecompute=true)` bypasses the manual-source guard and recomputes all totals.

**Current Status:** ✅ Working. The dialog loads existing events, predicts totals, submits correctly,
and the backend re-reconciles.

---

### 3.6 Open Shifts Management

**Purpose:** Detect and manage employees who clocked in but never clocked out (forgot-clock-out).

**Functional Requirements:**
- **Detection:** `AttendanceService::reconcileDay` sets `has_open_shift=true` when the last event is `clock_in` or `break_end`.
- **Flagging:** `FlagOpenShifts` job (every 5 min) finds `has_open_shift=true AND date < today AND is_flagged=false` → marks `is_flagged=true` → notifies the employee "Missing Clock-Out" + HR "Open Shift Flagged".
- **Admin UI:** Open Shifts tab lists flagged employees. Bulk "Notify HR" button. Per-row "Assign Correction" → opens correction dialog pre-filled with `clock_out` action.
- **Admin can manually trigger notification:** `POST /attendance/admin/notify-open-shifts {ids: [...]}` → sends warning notifications to HR users in the same department.

**Verified Defects:**
1. **Bulk "Notify HR" always 422s** — sends row indices (from `defaultGetRowId`) not `attendance_days.id`. The validator `ids.* => exists:attendance_days,id` rejects indices.

**Expected End-to-End Result:** Forgotten clock-outs are automatically detected, flagged, and
surfaced to Admin/HR, who can correct them or notify the relevant people.

---

### 3.7 Attendance Export

**Purpose:** Export attendance data to Excel for payroll/auditing.

**Functional Requirements:**
- Export by date range (`start_date`, `end_date`).
- Columns: Date, Employee Name, Email, Status, Total Worked (hh:mm), Overtime (hh:mm), Late (mins).
- Format: XLSX (streamed via Spatie SimpleExcelWriter).
- Auth: Bearer token attached by the browser `fetch`.

**Role & Permission Rules:**
- Admin only (capability `admin.view-all-attendance`). HR and Employee cannot export.

**Verified Defects:**
1. **HR Export button 403s** — the HR table has an Export button but the endpoint rejects HR users. Remove the button from the HR table or create an HR-scoped export endpoint.

**Current Status:** ✅ Working for Admin (streamed XLSX, Bearer auth, correct columns).

---

### 3.8 Attendance Reminders & Alerts

**Purpose:** Automated scheduler-driven notifications for shift start, missed clock-in, and open shifts.

**Functional Requirements:**
- **Shift Reminder:** Employee notified ~15 min before their shift start time. Configurable offset (`reminders.shift_offset`, default 10 min). Skips Sundays + users on leave/holiday.
- **Missed Clock-In Alert:** HR notified ~30 min after shift start if employee hasn't clocked in. Configurable offset (`reminders.missed_clock_in_offset`, default 15 min). Skips Sundays + leave/holiday.
- **Open Shift Flagging:** Previous-day open shifts flagged + employee + HR notified. Runs every 5 min.

**Backend Integration:**
- All 3 jobs scheduled every 5 min in `routes/console.php`.
- `RemindShiftStart` → info notification to employee.
- `AlertMissedClockIn` → high-priority notification to HR (same dept) + all super_admins.
- `FlagOpenShifts` → notification to employee + HR.

**Verified Defect:**
- All 3 jobs use the DEFAULT work schedule for all users. If a user has a custom `work_schedule_id`, their reminder/alert times are wrong.

---

## 4. OTHER MODULES (Functional Overview)

### 4.1 Authentication
Login (username/email/employee_id + password) → Role Selection (dual-role) → Force Password Change (setting-gated) → Onboarding → Dashboard. Forgot password (SMTP + Admin-approval). Lockout (5/10min). Device sessions + remote logout. Sanctum Bearer + 7-day refresh cookie.

### 4.2 Org Management
- **Users** (Admin CRUD): name, email, username, phone, employee_id, department, team, designation, roles (multi-checkbox), reset password, activate/deactivate, activity log, bulk actions, export.
- **Departments** (Admin CRUD): name, description, teams, member list, archive/restore, export.
- **Designations** (Admin CRUD): the 15 seed designations. Activate/deactivate. Member count.
- **Directory** (all roles): searchable grid/list, Send Message → opens chat conversation, visibility rules (public/internal/private).

### 4.3 Leave & Approvals
Employee requests (dates, type, reason) → HR approves/rejects. HR requests → Admin approves. History + status badges. Holiday calendar. Leave→attendance integration (Mon-Sat only). Approval state machine reused by tasks/projects.

### 4.4 Projects & Tasks
Project CRUD (Admin/HR) + team auto-access. Tasks: create/assign/priority/due/scope/dependencies/comments/activity. Kanban (dnd-kit) + list + inline edit. QA form builder. Project work timer. Recurring tasks. Task/project submit → review → approve/redo. Gantt (HR/Admin). Personal task list. Saved views.

### 4.5 Chat & Notifications
4 chat types (Global/Project/Direct/Group) over Reverb. @mentions, read receipts, pin, read/unread. Announcement board (pin, one-per-person reactions, dismissible). Quick Notes. Feedback → HR/Admin DM. Notification Center (bell modal: Clear preserves Chats, Mark-as-Read, close).

### 4.6 Reports & Exports
Attendance/project/task/productivity reports (Admin full, HR team-scoped). Excel + PDF export (queued). Weekly Sunday summary email. Saved views.

### 4.7 Settings & Audit
Company profile, working hours, holiday calendar, password policies, session rules, notification prefs, reminder times. Audit log (filterable, exportable). **Bug: settings key mismatch** — seeder writes `password_policy_*` but AuthController reads `password.*`.

### 4.8 Profile
Photo (Supabase Storage), name, phone, designation, change password, directory visibility, devices + remote logout.

---

## 5. VERIFIED DEFECTS CATALOG (drives `fix-6.md`)

### Dashboard Defects
| ID | Severity | Widget/Area | Problem |
|---|---|---|---|
| **DASH-1** | CRITICAL | Recent Activity Widget | Reads `.created_at/.model_type/.details` — backend returns `.at/.subject_type/.meta`. Throws on data → ErrorBoundary → widget disappears. |
| **DASH-2** | CRITICAL | Employee Task Progress Widget | Reads `metrics.completed_tasks` — backend never returns it → progress always 0%. |
| **DASH-3** | CRITICAL | HR Team Activity Feed Widget | Reads `data.members` — `hrToday` returns `{data:[...]}`, no `members` → permanently empty. |
| **DASH-4** | HIGH | HR Pending Submissions | Backend hardcodes `$data['pending_submissions'] = 0` → always 0. |
| **DASH-5** | HIGH | Announcement Board | Not mounted on any dashboard despite spec requiring dashboard display. |
| **DASH-6** | HIGH | Quick Notes | Not on HR dashboard (inconsistent — Admin + Employee have it). |
| **DASH-7** | MEDIUM | Quick Task Widget | `?limit=50` ignored by UserController → only 20 employees selectable. |
| **DASH-8** | MEDIUM | Admin Pending Approvals | Backend returns `pending_approvals` count but no widget surfaces it on Admin dashboard. |
| **DASH-9** | LOW | Prefetch | Dashboard prefetches `announcements` but no widget consumes it (wasted request). |

### Attendance Defects
| ID | Severity | Area | Problem |
|---|---|---|---|
| **ATT-1** | CRITICAL | `meToday` endpoint | PHP 8 null property access on `$day->updated_at` when no `attendance_days` row → 500 for first-time users. |
| **ATT-2** | CRITICAL | Admin Trends Graph | `/attendance/admin/graph` route does not exist → 404 → graph permanently broken. |
| **ATT-3** | HIGH | Admin/HR Table Department Column | Reads `row.original.department_name` — API returns `department_id` → always "—". |
| **ATT-4** | HIGH | Admin/HR Table Search | `select` filters by `item.user?.name` — API returns flattened `user_name` → search never matches. |
| **ATT-5** | HIGH | Admin Open Shifts "Notify HR" | Sends row indices (from `defaultGetRowId`) not `attendance_days.id` → 422 validation error. |
| **ATT-6** | HIGH | Admin "Export Selected" | Ignores selection — exports the full company regardless of the `all` param. |
| **ATT-7** | HIGH | HR Export Button | Calls `/attendance/export` (capability `admin.view-all-attendance`) → 403 for HR. |
| **ATT-8** | MEDIUM | Today Summary Card Late Text | Says "past your grace period" but the number is minutes past scheduled start (not past grace). Misleading. |
| **ATT-9** | MEDIUM | Reminder/Alert Jobs | Use default work schedule, ignoring per-user `work_schedule_id`. |
| **ATT-10** | LOW | `/attendance/sync` endpoint | Exists but unused by frontend (dead code). |
| **ATT-11** | LOW | HrActivityFeedWidget | Orphaned — not mounted on any page + broken data mapping. |

### Settings Defect
| ID | Severity | Area | Problem |
|---|---|---|---|
| **SET-1** | HIGH | Password Policy | Seeder writes `password_policy_*` keys; AuthController reads `password.*` keys → configured policies silently ignored. |

---

## 6. DESIGN SYSTEM (FROZEN — summary)

**Tone:** Vibrant-on-white. Charcoal `#1A1A2E` primary. Brand gradient `135deg #9400D3→#8A2BE2→#FF1493` on sign-in hero, dashboard headers, logo lockups only. Per-module accents: Dashboard=Blue, Attendance=Green, Leave=Amber, Directory=Pink, Org=Indigo, Settings=Teal, Audit=Rose, Profile=Cyan, Notifications=Orange.

**Semantic colors:** success `#16A34A`, info `#2563EB`, warning `#D97706`, danger `#DC2626`, neutral `#6B7280`. Status pills: Gray=Not Started, Blue=In Progress, Amber=Pending, Green=Approved/Completed, Red=Rejected/Overdue.

**Typography:** Inter (UI) + Sora (display). Scale: xs .75 → 5xl 3. Weights 400/500/600/700/800.

**Spacing:** 4px base. Card pad 20px. Section gap 32px. Page gutter 24px.

**Radius:** sm 6 (inputs), md 10 (buttons), lg 14 (cards), xl 20 (panels), full (pills/avatars).

**Motion:** Taps 120ms (compress 0.96). Hover 100ms. Sidebar 220ms. Dialog `cubic-bezier(0.16,1,0.3,1)`. Primary button: charcoal default, animated conic-gradient border on hover (3s), 0.96 active, reduced-motion → static border.

**Sidebar:** 3-state (hidden/collapsed-default/expanded). Collapsed = 1:1 square logo. Expanded = landscape logo. Ctrl+B. Active = violet-tinted bg + 3px brand-gradient left bar.

**Loading:** Skeletons shaped to content. Never a full-screen spinner. `placeholderData: keepPreviousData` everywhere. Cached data shows instantly on revisit. Background refresh is silent (small `isFetching` indicator).

**Accessibility:** WCAG 2.1 AA. Visible focus ring (2px brand-violet, 2px offset). Keyboard: Ctrl+K/B/N//Esc/Enter. Touch targets ≥44×44 (≥48 attendance mobile).

**No mock data, ever.** Screens with no data show real empty states.

---

## 7. VERIFIED DEFECTS — AUTH, VALIDATION & SECURITY AUDIT (Part II)

> Added during the focused auth/validation/security/responsive audit. These findings are
> cross-referenced in `fix-6.md` Part III (PHASES 21–26).

### Auth Module Defects
| ID | Severity | Area | Problem |
|---|---|---|---|
| **AUTH-1** | CRITICAL | Refresh loses selected role | `refresh()` recomputes `$primaryRole = $rolesCollection->first()` — ignores the user's `roleSelect` choice. Dual-role users silently revert on the next silent refresh. |
| **AUTH-2** | CRITICAL | Password change/reset doesn't revoke sessions | `changePassword`/`resetPassword` update the hash but don't delete existing tokens. Attacker keeps access. Frontend even calls `/auth/refresh` after — handing the old cookie a new pair. |
| **AUTH-3** | HIGH | Login doesn't check user status | User lookup has no `->where('status','active')` — inactive/suspended users can still authenticate. |
| **AUTH-4** | CRITICAL | Hardcoded default password + response leak | `UserController::store`/`resetPassword` hardcode `'Password123!'`. `resetPassword` returns it in the JSON response — exposed to anyone with `users.hr.manage`. |
| **AUTH-5** | HIGH | ForcePasswordChange off by default | Middleware reads `security.force_password_change` setting (default: off). Server-side enforcement is opt-in. Only frontend AuthGuard redirects. |
| **AUTH-6** | HIGH | Toast library mismatch | `api-client.ts` + `offline-engine.ts` import from `react-hot-toast`; only Sonner `<Toaster>` is mounted. Offline-queue toasts are invisible. |
| **AUTH-7** | HIGH | Attendance punch timestamp no future bound | `handlePunch` accepts `nullable\|date` with no upper bound (unlike `sync()` which rejects >5min future). Back-dated/future clock-ins possible. |
| **AUTH-8** | MEDIUM | Refresh not behind ForcePasswordChange/ForceOnboarding | `/auth/refresh` is public; users with pending password-change/onboarding can refresh past the gate. |

### Validation Defects
| ID | Severity | Area | Problem |
|---|---|---|---|
| **VAL-1** | MEDIUM | No Form Request classes | `app/Http/Requests/` doesn't exist. All validation is inline — harder to reuse/audit. |
| **VAL-2** | HIGH | `employee_code` not in `$fillable` | `UserController::store` writes it (silently dropped); `buildIndexQuery` searches by it → SQL error. |
| **VAL-3** | MEDIUM | Leave reason no max length | `'reason' => 'required\|string'` — unbounded payload. |
| **VAL-4** | MEDIUM | Settings values no type/size constraint | Can be any scalar/array. |
| **VAL-5** | LOW | Export date params not validated | `start_date`/`end_date` not validated as dates. |
| **VAL-6** | LOW | Graph params not enum-validated | `mode`/`groupBy` defaulted but not enum-validated; `$date` passed to `Carbon::parse` → 500 on garbage. |
| **VAL-7** | MEDIUM | Sync events type not enum | `events.*.type` is `string`, not `in:clock_in,clock_out,break_start,break_end`. |

### Security & Data Privacy Defects
| ID | Severity | Area | Problem |
|---|---|---|---|
| **SEC-1** | HIGH | UserController exposes sensitive fields | `show`/`index` return full User model — `blood_group`, `emergency_contact`, `alternate_mobile`, `preferences` are exposed. DirectoryController hides them; Users API doesn't. |
| **SEC-2** | CRITICAL | AnnouncementController no authorization | `store`/`update`/`destroy` have NO capability middleware + NO ownership check. Any employee can create/edit/delete any announcement. |
| **SEC-3** | LOW | Directory sendMessage leaks email | Returns `$targetUser->only(['email'])` bypassing visibility rules — private users' email exposed to message initiator. |
| **SEC-4** | LOW | Suspicious-login IP comparison exact-string | IPv4/IPv6 normalization issues cause false positives (noisy notifications). |
| **SEC-5** | MEDIUM | CSP allows unsafe-eval + unsafe-inline | `SecurityHeaders.php`: combined with token in localStorage, XSS can exfiltrate the session. |
| **SEC-6** | HIGH | Reverb `allowed_origins => ['*']` | Any origin can connect to the WebSocket server. |

### Console Error / UI Defects
| ID | Severity | Area | Problem |
|---|---|---|---|
| **UI-1** | MEDIUM | Missing DialogDescription/SheetDescription | ~16 of 19 dialog-using files omit `*Description` → Radix console warnings in production. |
| **UI-2** | LOW | DataTable fixed height on mobile | `h-[600px]` container — nested scrolling on small viewports. |

### Auth Architecture Notes (for context)
- **Cookie stack:** `g4k_refresh_token` (server-set, httpOnly, SameSite=Lax) · `g4k_token` (client-set, JS-readable) · `g4k_capabilities` (client-set, unsigned, user-editable). The last two are UX-only — real authorization is API-side.
- **Refresh token rotation:** single-use (deleted on first use) — cannot be replayed. No token-family/replay detection (an attacker who races gets in silently; legitimate user's next refresh fails).
- **CSRF:** relies on SameSite=Lax + same-origin Next.js rewrites. No double-submit tokens. Acceptable for the current architecture.
- **Lockout:** 5 attempts / 10 min per IP+identifier. A distributed attacker rotating IPs bypasses the per-account lockout; a victim can be DoS'd from many IPs.

### Responsive Audit Summary
- **Shell:** well-built — sidebar collapses 264↔72px, mobile Sheet full-screen, bottom nav 5 items with center FAB, content clears bottom nav with `pb-24 md:pb-6`.
- **Tables:** DataTable transforms to stacked cards on mobile (`useIsMobile`). Fixed `h-[600px]` container is the only concern (UI-2).
- **Dialogs/Sheets:** `DialogContent` goes full-screen on phones (`h-[100dvh] sm:h-auto`). `SheetContent` uses `w-3/4` on mobile (acceptable).
- **Auth pages:** `max-w-md` cards, responsive. No fixed-width offenders.
- **No broken responsive states found** in base workflows beyond UI-2.

---

## 8. MODULE SCOPE — What's In Scope vs Deferred

### In Scope (base workflows + attendance — must be production-perfect)
- **Auth:** login, logout, refresh, sessions, lockout, forgot/reset password, change password, role
  selection, onboarding, force-password-change, force-onboarding.
- **Org:** users CRUD + bulk + export + activity log, departments CRUD + archive/restore + teams +
  members, designations CRUD + activate/deactivate, directory search + grid/list + send message +
  visibility rules.
- **Profile:** edit info, avatar upload, password change, directory visibility, device sessions +
  remote logout.
- **Leave:** request (employee), approve/reject (HR/Admin), history, status badges, holiday calendar
  (view + Admin CRUD), leave→attendance integration.
- **Settings/Audit:** company profile, working hours, holiday calendar CRUD, password policies,
  session rules, notification preferences, reminder times, auto-numbering, audit log (filter +
  export), Sentry + Pulse.
- **Attendance:** full lifecycle (clock in/out/break, live timer, overtime, late, grace),
  employee history/calendar, Admin company-wide console (table + analytics + trends + open shifts +
  export + corrections), HR team console (table + analytics + graph + corrections + activity feed),
  reminders/alerts scheduler.
- **Dashboard:** role-specific widgets, announcement board, quick notes, quick task (HR), pending
  approvals, recent activity, all metrics.
- **Notifications:** bell modal (Clear preserves Chats, Mark-as-Read, close), Notification Center.

### Deferred (separate module effort)
- **Projects & Tasks:** project CRUD, task CRUD, Kanban, Gantt, QA forms, task submission/approval,
  recurring tasks, project work timer, personal task list, saved views.
- **Chat (messaging):** 4 chat types, @mentions, read receipts, pin messages, file/image sharing,
  project/group chat creation, mobile chat UX.
- **Reports:** report builder, export pipeline, saved views, weekly summary email, productivity report.

> Note: Announcements are borderline — they appear on the dashboard (in scope) but the CRUD UI +
> realtime + reactions are partially chat-module-adjacent. The **dashboard announcement display** +
> **authorization gating** (SEC-2) are in scope; the full announcement **create/edit** UI (CHAT-7)
> is prioritized but can be deferred if needed.

---

## 9. VERIFIED PERFORMANCE AUDIT — Current Code (Post-Fix-5, Commit `13cd2ff`)

> Deep code-level audit of the ACTUAL current codebase. Every finding below was verified by reading
> the exact source file. These are the REMAINING root causes — not theoretical concerns.
> Cross-referenced in `fix-6.md` Part IV (Phases 27–33).

### Frontend Performance Findings (PERF-FE)

| ID | Severity | File:Line | Finding |
|---|---|---|---|
| **PERF-FE-1** | HIGH | `ui-store.ts:71-83` + `widget-engine.tsx:41-45` | **Duplicate `/auth/preferences` fetch.** `ui-store.initPreferences()` does a raw `apiFetch` bypassing React Query cache. `widget-engine` does a separate `useQuery` for the same endpoint. Two serial blocking requests on every dashboard mount. |
| **PERF-FE-2** | HIGH | `widget-engine.tsx:176,186,93-141` | **Triple-layout flash.** Cold load shows: skeleton wall → fallback CSS grid → snap to ResponsiveGridLayout. `layouts` starts `{}` and only populates inside a `useEffect` that waits for preferences. Default layout is never available synchronously. THE most visible "loader churn." |
| **PERF-FE-3** | MEDIUM | `dashboard/page.tsx:56,58` | **Wasted prefetches.** Prefetches `announcements` (not consumed by any dashboard widget) and `tasks` (metrics uses `/dashboard/metrics`, not `/tasks`). Consumes 2 of ~6 parallel cold-load slots. |
| **PERF-FE-4** | MEDIUM | `api-client.ts:3` + `offline-engine.ts:3` | **Dual toast library.** Both import `react-hot-toast`; only Sonner `<Toaster>` is mounted. Offline-queue toasts are invisible. Bundle includes both libraries. |
| **PERF-FE-5** | MEDIUM | `command-palette.tsx:47` | **Whole-store destructuring.** `const { isActive, isOnBreak } = useTimerStore()` without selectors. CommandPalette is always-mounted; re-renders on every timer-store change. |
| **PERF-FE-6** | MEDIUM | `today-summary-card.tsx:17-22` | **Missing `placeholderData`.** No `keepPreviousData`. On direct navigation to attendance page, card blocks longer than necessary; re-flashes on gcTime eviction. |
| **PERF-FE-7** | LOW | `api-client.ts:56-59,117-119,151-157` | **Dead retry ladder.** `maxRetries=0` makes the `while` loop run once; 5xx retry + backoff branches are unreachable. Misleading code; React Query handles retries. |

### What's already CORRECT in the frontend (do NOT re-fix):
- `PersistQueryClientProvider` removed; standard `QueryClientProvider` in use.
- All dashboard widgets have `placeholderData: keepPreviousData` (except TodaySummaryCard — PERF-FE-6).
- `staleTime: 60s`, `gcTime: 30min`, `retry: 1`, `refetchOnWindowFocus: false` — healthy defaults.
- Timer 1s tick is isolated to `LiveTimer` local `useState`; `timer-store` is event-driven (no per-second store update).
- No `loading.tsx` Suspense boundaries causing navigation loaders.
- ECharts, react-grid-layout, kanban, gantt all dynamically imported (`ssr:false`).
- `optimizePackageImports` configured for `lucide-react`, `date-fns`, `@g4k/ui`.
- Offline engine 5s poll is effectively free when queue is empty (gated on `queueCount > 0`).
- Attendance-table polling (1-2 min) pauses on tab blur.
- No raw `fetch()` bypassing `apiFetch` except intentional blob uploads.
- AuthGuard shows skeleton ONLY when no persisted session (returning users render immediately).

### Backend Performance Findings (PERF-BE)

| ID | Severity | File:Line | Finding |
|---|---|---|---|
| **PERF-BE-1** | **CRITICAL** | `DashboardController.php:62-67,100-106` + `AttendanceController.php:389,394` | **Postgres-breaking double-quoted SQL.** `selectRaw('SUM(CASE WHEN status = "present" ...')` — Postgres treats `"present"` as a column identifier, not a string literal. ALL dashboard metrics AND attendance graphs 500 on Postgres. THE #1 reason "widgets don't load." |
| **PERF-BE-2** | **CRITICAL** | `AttendanceController.php:146` | **`meToday` null-deref.** `$day->updated_at ?? ''` — when `$day` is null (no attendance row today), PHP 8 throws "Attempt to read property on null." First dashboard load 500s for every user before they clock in. |
| **PERF-BE-3** | **CRITICAL** | `UserController.php:299` | **`activity` orders by nonexistent column.** `orderBy('created_at')` but `audit_logs` uses `at`. Postgres 500. The "View Activity" sheet always errors. |
| **PERF-BE-4** | HIGH | `UserController.php:131,35` | **`employee_code` doesn't exist.** Written on store (silently dropped — not in `$fillable`), searched in `buildIndexQuery` → SQL error. |
| **PERF-BE-5** | HIGH | `RemindShiftStart.php:58` | **Per-user holiday query in loop.** `DB::table('holidays')->where('date',$today)->exists()` runs once per employee. 100 employees × 12 runs/hour = 28,800 wasted queries/day. |
| **PERF-BE-6** | HIGH | `AlertMissedClockIn.php:52-70` | **3 N+1 patterns per user.** Per-user `$onLeave` + `$isHoliday` + `$hrUsers` queries. 100 employees → 300+ queries + 500 inserts per 5-min run. |
| **PERF-BE-7** | MEDIUM | `FlagOpenShifts.php:42-49` | **Per-day HR lookup + per-row update.** Same HR query per day; `is_flagged` update per row instead of bulk. |
| **PERF-BE-8** | HIGH | `AttendanceController.php:509-540` | **Export materializes ALL rows.** `$query->get()` hydrates entire range in memory before streaming. 1-year × 100 employees = 36,500 Eloquent models in RAM. |
| **PERF-BE-9** | MEDIUM | `UserController.php:339,346` | **`bulk` N+1.** Missing `with('roleAssignments')`; per-user role query + per-iteration super_admin count. |
| **PERF-BE-10** | MEDIUM | `AttendanceController.php:550-558` | **`notifyOpenShifts` N+1.** Same missing `with('roleAssignments')` on HR user query. |
| **PERF-BE-11** | LOW | `UserController.php:221,257,311` | **3 single-user N+1s.** `findOrFail` without `with('roleAssignments')` in updateStatus/destroy/resetPassword. |
| **PERF-BE-12** | MEDIUM | `AttendanceService.php:93-100` | **`reconcileDay` re-fetches user+schedule per call.** In the `sync` loop, N×2 redundant queries (User::find + work_schedules per date). |
| **PERF-BE-13** | MEDIUM | `AttendanceService.php:25-28` | **`whereDate` defeats index.** `whereDate('timestamp', $date)` casts the column → full scan instead of the covering index `idx_attendance_events_covering`. Use `whereBetween`. |
| **PERF-BE-14** | MEDIUM | `CacheInvalidationObserver.php:13-16` | **Dashboard cache invalidation broken.** Forgets wrong key names (`dashboard_global_stats` vs actual `dashboard_global`). Real keys never invalidated → stale data for 5 min. |
| **PERF-BE-15** | MEDIUM | `AttendanceController.php:143` | **Work schedule queried every request.** Not cached despite rarely changing. |
| **PERF-BE-16** | LOW-MED | `NotificationController.php:21` | **Offset pagination.** `->paginate(50)` on `notifications` (largest table). Deep pages degrade. Should be `cursorPaginate`. |
| **PERF-BE-17** | LOW | `LeaveRequestController.php:38-43,66` | **`whereHas` for status filter.** Subquery prevents index usage. Should filter directly on `leave_requests.status`. |
| **PERF-BE-18** | LOW | `AttendanceController.php:207-214` | **`applyHrScoping` queries RoleAssignment.** Per-request `exists()` check; the role is already on the token abilities. |

### Database Index Findings (PERF-DB)

| ID | Severity | Finding |
|---|---|---|
| **PERF-DB-1** | HIGH | **Missing composite indexes.** `task_time_logs (user_id, log_date)`, `notifications (user_id, created_at DESC)`, `audit_logs (user_id, at DESC)`, `messages (conversation_id, created_at)`, `conversation_user` leading `user_id`. |
| **PERF-DB-2** | MEDIUM | **9+ redundant/duplicate indexes.** Multiple migration waves created overlapping indexes: `attendance_days` (4 duplicates), `users.department_id` (2), `leave_requests` (4+ including a duplicate partial unique), `attendance_events.client_id` (unique + redundant index), `holidays.date` (unique + redundant index). Write amplification. |

### What's already CORRECT in the backend (do NOT re-fix):
- `Schema::hasTable()` calls removed from `DashboardController` (hardcoded `true`).
- Dashboard cache TTL is 300s with split keys (`dashboard_global`, `dashboard_recent_activity`, etc.).
- No `Cache::flush()` calls anywhere.
- `AuditLogController::export` correctly queues + chunks.
- `AttendanceController::meHistory/hrHistory` correctly eager-loads `TaskTimeLog` with `project/task`.
- `UserController::index` correctly eager-loads all relations.
- `HolidayController` uses smart per-year caching with targeted invalidation.
- `next.config.ts` has `optimizePackageImports` for `lucide-react`, `date-fns`, `@g4k/ui`.
- Holiday/leave-pre-check indexes exist and function.

### Performance Architecture Summary
The app has GOOD fundamentals (React Query configured correctly, dynamic imports, selector-based
stores, cursor pagination on most endpoints, caching on dashboard/holidays/capabilities). The
REMAINING slowness/breakage is caused by a SMALL number of high-impact bugs:
1. **3 Postgres-breaking SQL queries** (PERF-BE-1/2/3) that 500 on the production DB — these are
   the dominant cause of "widgets not loading."
2. **The WidgetEngine triple-layout flash** (PERF-FE-2) — the dominant cause of "loader churn" on
   every dashboard mount.
3. **The duplicate `/auth/preferences` fetch** (PERF-FE-1) — adds a serial blocking request.
4. **Scheduled job N+1 storms** (PERF-BE-5/6/7) — hundreds of queries per 5-min run.
5. **Invisible offline toasts** (PERF-FE-4) — UX bug masking offline functionality.

Fixing items 1–3 alone will resolve the majority of the user's complaint.

---

## 10. VERIFIED DEPLOYMENT & RUNTIME ISSUES (Production Console Analysis)

> Analysis of the ACTUAL production console output from the Vercel deployment
> (`g4k-v3-...vercel.app` → API at `g4k-production.up.railway.app`). These are the root causes of
> the app being "dead slow" and non-functional in production. Cross-referenced in `fix-6.md` Part V.

### DEPLOY-1 — Cookie-based refresh token broken on Vercel→Railway proxy (CRITICAL)

**Symptom:** EVERY API endpoint returns 401 after the access token expires (15 min). The console
shows a cascade: `/api/auth/refresh 401` → `clearAuth()` → redirect to `/login` → bounce back →
all subsequent calls 401.

**Root cause:** The `g4k_refresh_token` HttpOnly cookie is set by Laravel on Railway with
`SameSite=Lax` and no explicit domain. The frontend on Vercel makes requests via a Next.js rewrite
(`/api/:path*` → Railway). **Next.js production rewrites on Vercel's edge network do NOT reliably
proxy Set-Cookie headers from cross-domain upstreams.** The browser never stores the refresh cookie
(or stores it with the wrong domain), so when the access token expires, the refresh fails.

**Fix:** Switch from cookie-based to **header-based refresh token**. Return `refresh_token` in the
login JSON response. Store it in the Zustand persisted store (localStorage). On 401, send it via
`X-Refresh-Token` header instead of relying on the cookie. (DEPLOY-1 in fix-6.md.)

### DEPLOY-2 — `/dashboard/org` route doesn't exist (HIGH)

**Symptom:** `GET /dashboard/org?_rsc=... 404`. Something navigates to `/dashboard/org` but only
`/dashboard/org/users`, `/dashboard/org/departments`, etc. exist.

### DEPLOY-3 — Reverb WebSocket server NOT running on Railway (CRITICAL)

**Symptom:** Hundreds of failed WebSocket connections flooding the console:
```
WebSocket connection to 'wss://g4k-production.up.railway.app/app/xk9df2m8z1l0p5q4...' failed:
WebSocket is closed before the connection is established.
```

**Root cause:** The Railway start command (`nixpacks.toml`/`railway.toml`) is:
```
php artisan serve --host=0.0.0.0 --port=$PORT
```
This runs ONLY the HTTP web server. **There is NO `php artisan reverb:start` process.** No WebSocket
server is listening. The `pusher-js` client retries endlessly (no backoff), generating 100+ failed
connection attempts per session, consuming CPU and network.

**Fix:** Either deploy Reverb as a separate Railway service, or disable WebSocket connections when
`NEXT_PUBLIC_REVERB_HOST` is not set. (DEPLOY-3 in fix-6.md.)

### DEPLOY-5 — No queue worker running (CRITICAL)

**Root cause:** The Railway start command does not include `php artisan queue:work`. ALL queued jobs
(audit logging, report generation, approval notifications, leave-attendance integration) are never
processed. They pile up in the `jobs` table or run synchronously (blocking requests).

### DEPLOY-6 — No scheduler/cron running (CRITICAL)

**Root cause:** No `cron` or `schedule:run` process on Railway. The 5-minute scheduled jobs
(`RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts`) and the weekly summary NEVER run.

### DEPLOY-7 — Multi-process start script needed

**Fix:** Create `apps/api/start.sh` that runs web + queue + scheduler in one Railway service, with
Reverb as a separate service. (DEPLOY-7 in fix-6.md.)

### DEPLOY-8 — Service worker aggressively caches navigation routes (HIGH)

**Root cause:** `sw.js` intercepts every navigation fetch (network-first strategy with caching).
This caches authenticated pages (`/dashboard`) and serves them stale. When auth expires and the app
redirects to `/login`, the SW interference causes additional latency and potential stale-page
serving.

**Fix:** SW should ONLY cache static assets (`/_next/static/`, fonts, images). Navigation requests
should NOT be intercepted by the SW at all. (DEPLOY-8 in fix-6.md.)

### Deployment Architecture Recommendation

The current Vercel+Railway split has fundamental limitations:
1. **Cross-domain cookies** — unreliable through Next.js edge rewrites.
2. **Single-process Railway container** — can't run web + queue + scheduler + Reverb in one service.

**Options:**
- **Immediate fix:** Header-based auth (no cookies) + `start.sh` for multi-process + disable Reverb
  if not configured + fix SW.
- **Better:** Migrate API to **Fly.io** (supports multiple process groups natively, handles
  WebSockets, generous free tier ~$3-5/mo). Frontend stays on Vercel. DB stays on Supabase.
- **Best:** Deploy frontend + API on **same domain** (subdomains) to eliminate cross-domain cookie
  issues entirely. Use `SameSite=None; Secure` cookies across subdomains of the same registrable domain.

### Root Cause Priority Matrix

| Priority | Issue | Impact | Fix |
|---|---|---|---|
| **P0** | DEPLOY-1: Auth refresh broken (all 401s) | App completely non-functional after 15 min | Header-based refresh |
| **P0** | PERF-BE-1: Postgres double-quoted SQL (500) | Dashboard widgets never load | Single-quote literals |
| **P0** | DEPLOY-3: Reverb not running (WS flood) | Console spam, CPU waste, no realtime | Deploy Reverb or disable |
| **P0** | DEPLOY-5/6: No queue/scheduler | Audit/notifications/reminders don't work | Multi-process start |
| **P1** | DEPLOY-8: SW caches navigations | Stale pages, redirect interference | SW static-only |
| **P1** | PERF-FE-2: WidgetEngine layout flash | Visible loader churn on dashboard | Sync default layouts |
| **P1** | PERF-BE-2/3: meToday + activity 500s | Attendance + user history broken | Nullsafe + column fix |
| **P2** | PERF-FE-4: Invisible offline toasts | UX gap | Switch to sonner |
| **P2** | DEPLOY-2: /dashboard/org 404 | Nav error | Fix link or add redirect |
