# Games4Kings Workplace OS — Complete Application Workflow Map

**Version:** 2026-08-19 (end-to-end audit edition)
**Audience:** Client review. This document maps **every implemented workflow** in the application — every page, module, tab, form, field, button, rule, permission, and connection — from the starting point to the final outcome, and how all the parts work together.
**Companion:** `finalization.md` catalogs every known defect and the plan to 100% (defects are referenced here only briefly with `⚠ FIN-x` markers).

---

## Table of Contents

- [Part 1 — Platform Overview](#part-1--platform-overview)
- [Part 2 — Access & Account Lifecycle](#part-2--access--account-lifecycle)
- [Part 3 — Page-by-Page Reference](#part-3--page-by-page-reference)
  - [3.1 Dashboard (all roles)](#31-dashboard-all-roles)
  - [3.2 Attendance & Time (personal)](#32-attendance--time-personal)
  - [3.3 Team Leave Approvals](#33-team-leave-approvals-hr--admin)
  - [3.4 Attendance Console (Organization)](#34-attendance-console-organization)
  - [3.5 Projects & Tasks](#35-projects--tasks)
  - [3.6 Project Detail Page](#36-project-detail-page)
  - [3.7 Task Detail Sheet](#37-task-detail-sheet)
  - [3.8 Communications (Chat · Announcements · Notifications)](#38-communications)
  - [3.9 Directory & People Management](#39-directory--people-management)
  - [3.10 Employee Record Detail](#310-employee-record-detail)
  - [3.11 Reports & Data Exports](#311-reports--data-exports)
  - [3.12 Settings Console (Admin)](#312-settings-console-admin)
  - [3.13 My Profile](#313-my-profile)
- [Part 4 — Cross-Cutting Systems](#part-4--cross-cutting-systems)
- [Part 5 — End-to-End Workflow Narratives](#part-5--end-to-end-workflow-narratives)
- [Part 6 — Rules Compendium](#part-6--rules-compendium)
- [Part 7 — Navigation Map](#part-7--navigation-map)

---

# Part 1 — Platform Overview

## 1.1 What the app is

A company management platform for Games4Kings with three user types — **Admin (super_admin), HR, Employee**. Everyone signs in at one place; the app adapts entirely to the active role: navigation, dashboard, permissions, and data scope.

**Core loop of the product:**
1. Admin sets up the company (people, departments, schedules, policies, holidays).
2. HR runs day-to-day operations (projects → tasks → assignments).
3. Employees work: clock in → work tasks/projects (timers) → submit (QA-gated).
4. Approvals flow back up (task/project submissions, leave requests).
5. Everyone communicates inside the app (global/project/direct/group chats, announcements, notifications).
6. Everything is measurable (attendance analytics, productivity reports, exports, audit log).

## 1.2 Architecture & integrations

| Layer | Technology | What it does |
|---|---|---|
| **Web app** | Next.js 16 + React 19 (Vercel) | All screens; installable PWA with offline support |
| **API** | Laravel (Cloud Run) | Every action; token-authenticated; capability-checked |
| **Database** | PostgreSQL (Supabase) | 60+ tables; soft deletes for critical records |
| **File storage** | S3-compatible (Supabase) | Avatars, project covers, chat attachments, export files |
| **Realtime** | Reverb WebSockets | Live chat, notifications, attendance refresh, session kill; automatic polling fallback (chat 15s, notifications 30s, attendance 60s) |
| **Background jobs** | Database queue + scheduler (supervised) | Async exports, reminders, shift alerts, weekly summary email, demo data, cleanup |
| **Email** | SMTP (configurable in Settings) | Temp-password emails, reset links, weekly summary, suspicious-login alerts; every email path degrades safely to in-app when SMTP is off |

## 1.3 Roles & permissions model

Exactly three roles; a user may hold several (e.g. Employee + HR). Permissions are **capabilities** stored in the database and enforced by the API on every route; the frontend hides UI the active role lacks.

| Capability (what it unlocks) | Admin | HR | Employee |
|---|---|---|---|
| Everything (wildcard) | ✔ | — | — |
| Clock in/out + own attendance pages | ✖ (excluded by design) | ✔ | ✔ |
| Team attendance monitoring (own departments) | ✔ | ✔ | — |
| Company-wide attendance console | ✔ | — | — |
| Correct attendance (add/edit/remove punches) | ✔ | ✔ (team) | — |
| Request own leave | ✔ | ✔ | ✔ |
| Approve employee leave | ✔ | ✔ (managed depts) | — |
| Create/manage employee accounts | ✔ | ✔ | — |
| Create/manage HR accounts | ✔ | — | — |
| Directory (corporate + departments/designations view) | ✔ | ✔ | — |
| Chat access / manage groups & pins | ✔/✔ | ✔/✔ | ✔/— |
| Edit own profile | ✔ | ✔ | ✔ |
| View tasks / create own tasks / manage (assign, approve) all | ✔/✔/✔ | ✔/✔/✔ | ✔/✔/— |
| View projects / manage projects | ✔/✔ | ✔/✔ | ✔/— |
| QA: fill forms / build forms | ✔/✔ | ✔/✔ | ✔/— |
| Track time (project timer + logs) | ✔ | ✔ | ✔ |
| Reports & exports | ✔ | ✔ (scoped) | — |
| Settings console · audit log · demo data | ✔ | — | — |
| Post announcements | ✔ | ✔ | — |
| Create/edit departments · designations | ✔ | — | — |

**Scoping rules that matter everywhere:**
- **HR sees only their managed departments** (Admin sets the department↔HR mapping) for team attendance, leave approvals, and user management.
- **Employees see only** projects, tasks, and conversations they are members of.
- **Nobody approves their own request**; Admin can approve anyone; HR approves employees (not other HR).
- Legacy URLs redirect to their new homes (e.g. `/dashboard/org/users` → Directory → Employee Management; `/dashboard/admin/attendance` → Attendance Console; `/dashboard/leave` → Attendance → My Leave; `/dashboard/audit` → Settings → Audit Log).

---

# Part 2 — Access & Account Lifecycle

## 2.1 Sign In (`/login`)

**Screen:** landscape company logo → "Welcome back" → identifier + password → Sign In button → footer "Games4King Workplace OS" with ⓘ tooltip *"Gen2k Conglomerate (2018) • Milestone 1"*.

**Form rules:** identifier accepts **email, employee ID, or username**; password minimum 6 chars (client) with show/hide toggle; loading state on submit; errors shown inline.

**E2E pipeline (what happens when you click Sign In):**
1. `POST /auth/login` (throttled 6/min; **5 failures locks the account 10 minutes** — the button shows a live countdown from the 423 response).
2. Server rejects inactive/locked accounts; detects **suspicious logins** (IP changed vs. last success) → logs a warning + notifies all HR/Admins + emails the user (if SMTP).
3. Enforces password-expiry policy (expired → forced change) and max-device limit (oldest sessions pruned).
4. Success returns: 15-min access token, 7-day refresh cookie (HttpOnly), user, active role, capabilities, `must_change_password`, `onboarded`.
5. Frontend routes: forced password change → onboarding → role selection (multi-role) → dashboard.
6. Every attempt is written to the audit log + login attempts table.

## 2.2 Forced password change (`/change-password`)

Reached when `must_change_password` is true (new account, admin reset, expiry). Until changed, **every** API call except change-password/logout returns 403 with a flag the client understands → hard redirect back to this page. Requires current + new + confirm; validated against the server-side policy (length/complexity from Settings → Policies). Success revokes tokens on all devices (re-login everywhere).

## 2.3 Onboarding (`/onboarding`) — first login only

Three steps: **Profile** (phone + emergency contact) → **Password** (optional change) → **Tour** (guided walkthrough, animated-logo finish). Completing stamps `onboarded_at`; before that all endpoints 403 with `needs_onboarding`.

## 2.4 Role selection (`/role-select`) — multi-role users only

One card per assigned role; choosing calls `POST /auth/role-select` which **deletes the current token and mints a new one scoped to the chosen role**, updates `active_role`, and returns fresh capabilities — the entire app re-renders for that role. Single-role users skip this page.

## 2.5 Forgot / reset password

- `/forgot-password` → identifier → **always** a neutral "if the account exists…" 202 response (no enumeration). Behind the scenes a pending Password-Reset Request is created; an email with a 60-minute token link goes out if SMTP is configured.
- **No-SMTP fallback:** Admin sees the request in Settings → Security Requests → Approve → gets a one-time link to hand to the user out-of-band (⚠ FIN-P1-11: link host currently falls back to localhost until the config wire-up fix).
- `/reset-password?token=…` → new password (policy-checked) → all tokens revoked.

## 2.6 Sessions & devices

- Access token 15 min; on expiry the client silently refreshes once (single-flight) using the HttpOnly cookie — users never notice; refresh failure → login page with "expired" reason.
- Profile → Security lists every active session (device, IP, last used, "this device" badge); **Revoke** kills one remotely; revoking the current device logs you out immediately; other open tabs die instantly via the `session.revoked` realtime event.
- Logout (`POST /auth/logout`) revokes tokens, fires realtime sign-out, clears local caches.

---

# Part 3 — Page-by-Page Reference

## 3.1 Dashboard (all roles)

One page, three role-specific widget grids. **Widget framework rules (apply to every widget):** each loads independently (skeleton → content, error + retry, empty state); drag anywhere via the hover handle; collapse/expand; layouts saved per user and restored on any device (a reconciliation step repairs layouts when the widget catalog changes); whole-widget error boundaries so one broken widget never kills the page; every metric widget is clickable to drill into its page and shows a refresh icon on hover.

**Admin widget set:** Total Employees (active/inactive/department split) · Active Projects · Today's Attendance (company snapshot) · Pending Approvals (leave + task + project submissions with quick approve/reject for leave and deep links to review screens) · Recent Activity (company-wide audit feed) · Quick Task (create + assign instantly).

**HR widget set:** Team Attendance today (present/absent/late/leave, avg clock-in, overtime) · Pending Approvals · Team Activity (late arrivals, open shifts) · Quick Task · Announcements board · Upcoming Holidays · Time Clock (own punches).

**Employee widget set:** Announcements (dismissible) · Active Projects · Pending Tasks · Task Approval Status (my submissions: pending / approved / redo with feedback) · Recent Task Progress (latest task + progress bar) · Upcoming Holidays · Quick Notes · Time Clock.

**Quick Task widget (HR/Admin) E2E:** pick employee (searchable), title, description, priority, due date → `POST /tasks` → task appears in the employee's list immediately (realtime/refresh) → when completed, and the task's "notify global chat" flag is on, an automatic completion message is posted to the Global Chat.

## 3.2 Attendance & Time (personal) — `/dashboard/attendance`

Tabs: **Overview** (everyone with clock-self) · **My Leave** (leave + holidays sub-tabs) · **Team Leave Approvals** (HR/Admin only). URL-driven (`?tab=`), deep-linkable.

### Overview tab
1. **Time Clock widget** — the punch state machine:
   - States: *not started → active ⇄ on break → completed*. Buttons: Clock In, Start Break, End Break, Clock Out (allowed from active **or** break — clocking out on break auto-closes the break first). "Continue Shift" re-entry path with confirmation.
   - Every punch carries a unique `client_id` (idempotency key) — retries/replays can never double-record; optimistic UI updates instantly then reconciles with server truth.
   - Live HH:MM:SS worked timer; break list with durations; overtime computed vs. the **default work schedule** (default 09:00–18:30, 45-min break, 10-min grace, Mon–Sat = 8h45m standard day); **Late** status is computed server-side (schedule start + grace).
   - Works fully offline (punches queue and sync on reconnect).
2. **Today Summary card** — status badge, in/out times, break totals, worked/overtime seconds.
3. **Attendance History** — month calendar + heat colors (present / late / **overtime (separate color)** / leave / absent / holiday / no-data), 365-day data (`/attendance/me/history?limit=365`); click a day → full detail dialog: punch timeline with device metadata, per-project/task logged time, totals. Holidays from the company calendar are rendered; future dates disabled.

### My Leave tab
- **Sub-tab My Leave:** history table (dates, type, reason, status pill, approver, decision reason) with type/status filters + search + pagination.
- **New request form** (`/leave-requests`): type (casual/sick/earned/unpaid), start (strictly **tomorrow or later** — enforced client and server), end (≥ start), reason (required, ≤1000). Client-side overlap check; server double-checks overlaps (pending overlapping request → 422) and **leave balance** (12/year per type by default). Draft autosaves (IndexedDB, 30s) with restore banner. Submit → Approval record created → routed by role (employee → their HR; HR → Admin) → approver notified in-app + realtime. **Self-approval blocked.**
- **Sub-tab Holidays:** company holiday calendar (Admin-managed; recurring holidays repeat annually, Feb 29 → Feb 28 in non-leap years).

## 3.3 Team Leave Approvals (HR + Admin)

- **Approvals sub-tab:** pending requests for the HR's managed departments (Admin: all) — filter by employee + search; **Approve / Reject** buttons (optimistic with rollback). Rejecting requires a reason (dialog + server enforced: `reason required_if decision=rejected`).
- **Decision effects (E2E):** approved → `on_leave` attendance days written for the whole span (employee shows "leave", not "absent"), leave balance `used` incremented, requester notified (in-app + realtime), dashboard caches bust. Rejected → requester notified with the reason.
- **History sub-tab:** all past decisions with filters + its own export.
- Dashboard **Pending Approvals widget** mirrors these actions; task/project submissions deep-link to their review screens.

## 3.4 Attendance Console (Organization)

`/dashboard/org/attendance` — for `hr.view-team-attendance` (HR) and `admin.view-all-attendance` (Admin). Admin gets the company-wide console; HR gets the team view (managed departments only).

**HR Team View — tab "Today's Status":**
- **Analytics cards** (present/absent/late/leave today, avg clock-in, overtime) for the chosen date/department. *(First request goes to a not-yet-implemented analytics endpoint, then falls back — ⚠ FIN-P1-3.)*
- **Live table:** every managed employee for a date — status, clock-in/out, breaks, worked hours; live "clocked-in now" ping on today; filters (date, status, department, search debounced); server-side pagination + sorting. Realtime: any team punch refreshes the table (WebSocket), else 60s polling.
- **Row → Member Sheet** with three tabs: *Day* (full punch timeline + device info + audit deep-link), *History* (their full calendar/heatmap), *Trends* (weekly/monthly hours + overtime chart per employee).

**HR Team View — tab "Trends & Graphs":**
- **Graph:** stacked present/absent/late bars + hours/overtime lines, weekly or monthly window, groupable by date or employee.
- **Heatmap:** new year-view heatmap of team attendance intensity (uses the `yearly` graph mode).

**Admin Console — three tabs:**
1. **Calendar Heatmap:** company present-rate per day (≥90/70/50% bands); click a day → jumps to that date in the table.
2. **Overview (table):** company-wide day view with date range, department, employee, status filters + search + pagination + sorting; row click opens the same Member Sheet; "View Leave" cross-links to the employee's leave record; per-row **assign correction**.
3. **Analytics & Trends:** KPI cards + weekly/monthly trend graphs.

**Attendance Corrections (both roles, gated `attendance.correct-team`/`admin.correct-attendance`):**
- Opened from open-shift badges, member sheet, table rows, or the command palette.
- Shows the day's real event timeline; HR/Admin can **add / edit / remove** any punch event; **reason mandatory** (≤500 chars, client + server); **live predicted-totals preview** before saving.
- Save → `attendance_corrections` audit row (old/new values, corrector) + employee notified; corrected day flagged `source: manual` with version bump.

**Exports:** both tables export (selected rows or the whole filtered set) to `.xlsx` through the async export pipeline (Part 4.4).

**Open Shifts (clocked-in-never-out):** the scheduler job flags them, notifies, and the company table exposes correction actions — **⚠ the dedicated Open Shifts admin tab is currently orphaned from the console (FIN-P1-13 in finalization.md); fix pending.**

## 3.5 Projects & Tasks

`/dashboard/projects` — two tabs: **All Projects** · **My Tasks & Board** (URL-driven).

### All Projects tab
- **Who sees what:** managers (projects.manage) see all projects for their scope; employees see **only projects they belong to**.
- **Project cards** show name, description, priority badge, deadline, progress (task completion %), member avatars, status pill (active / review / completed / archived). Sorting by created date / deadline / priority, asc + desc.
- **Create Project dialog (managers):** name (required), description, priority (low/medium/high/urgent), department, team, deadline, start/end dates (end ≥ start server-checked), QA form attach, member list (search + multi-add), **cover image** (S3 upload), and **"Allow employee tasks"** toggle.
  - **E2E effects of creating:** project row created; **its project chat channel is auto-created with all members**; members gain access to project + tasks + chat instantly.
- **Card actions:** open, edit (same dialog), archive (status change), delete (soft, managers only), pin (📌 → sidebar Pinned section).

### My Tasks & Board tab — four views (toggle buttons)
1. **Kanban (default):** columns **To Do / In Progress / Review / Done**. Drag between columns → optimistic status PUT with rollback; same-column drag reorders (persisted via `/tasks/reorder`). Right-click menu: view/edit, move to status, delete (confirm). Mobile: snapping columns + long-press drag. *(Board caps at first 100 tasks — ⚠ FIN notes.)*
2. **List:** data table — checkboxes, bulk status/delete, per-row actions, filters (status, scope, assignee me/all, search, sort), pagination (20/50/100).
3. **Timeline (Gantt):** bars from created→due, colored by status, dependency arrows from `blocked_by`. *(Bar drag is currently a no-op — ⚠ FIN-P1-7.)*
4. **QA Form Builder (managers only):** create QA form templates — title, description, sections, field list (label + type: text/textarea/checkbox/boolean/multiple-choice/slider/date/file-upload + required flag + options + branching logic), drag-to-reorder fields, **live preview**. *(Field-type rendering has a known defect — ⚠ FIN-P0-1. Edit/delete of forms not yet in UI — FIN-P2-2.)*

**Task scoping rules:** employees see tasks where they are assignee, reporter, or project member; managers see everything in scope. Non-managers can create tasks **only for themselves** (`tasks.create-own`) and only inside projects with "allow employee tasks" — otherwise the create dialog auto-assigns them. Managers can set scope (global/department/role), multiple assignees, dependencies, QA form, recurrence.

## 3.6 Project Detail Page

`/dashboard/projects/[id]` — members (or managers) only.

- **Header:** cover image, name, priority/deadline/status badges, progress stats (task completion, total logged hours), member avatars, edit + manage-members dialogs.
- **Embedded tasks board** scoped to this project (same kanban/list machinery; only this project's tasks — filtering verified).
- **Project History & Activity card:** virtualized chronological log of every event (created, member changes, task events, submissions, decisions).
- **Project Workflow card (status machine):**
  - **Active → Submit for Completion:** submission note (required) + **QA form answers** (if the project has a form; every required field enforced client- and server-side before the submit is accepted) → status `review`; HR + Admin notified.
  - **Review (managers):** panel shows the submission note + QA answers inline → **Approve** (status `completed`, `completed_at` stamped) or **Redo** (reason required; back to `active`).
  - Employee sees the result on dashboard + here; the whole trail lands in the activity log.
- **Status machine:** `active → review → completed | active(redo)`, plus `archived` — all transitions server-validated against the database CHECK constraint.

## 3.7 Task Detail Sheet

Opened from any task row/card (or `/dashboard/tasks/[id]`). Four tabs + action panels:

- **Overview:** description; inline-edit title/due-date (pencil, Enter save / Esc cancel); assignees; priority; **progress slider** (managers); dependencies (blocked-by chain, cycle-safe); recurrence info; QA form (when attached).
- **Comments:** live discussion feed on the task (Enter to send) — participants only; no need to switch to chat.
- **Time:** **Log Time** form (task/project link, minutes ≥1, description, log date) + full time-log history for the task. These logs roll up into project hours, attendance day breakdown, and productivity reports.
- **Activity:** per-task chronological audit (assignments, status changes, submissions, decisions).
- **Submit for Review (employee):** completion **note** (required) + **QA answers** (required fields enforced) → status `review` → managers notified.
- **Approve / Redo (managers):** approve → `done` (+ optional auto-post to project/global chat per the task's flag); redo → reason required → back to in-progress/rework. Employee notified instantly; My Submissions widget updates.
- **Reminders:** personal reminder at a chosen datetime (+ automatic due-date reminder); delivered by the every-minute scheduler as a notification.
- **Recurrence (managers):** daily / weekly (pick weekdays) / monthly (day-of-month) — when an occurrence is completed the next one is auto-created; HR notified; recurrence can be turned off.
- **Guard rails (server):** a task whose blocker isn't done cannot be completed; dependency cycles rejected (422); plain assignees can only edit whitelisted fields (status, progress, due date, description).

## 3.8 Communications

`/dashboard/chat` — three tabs: **Chat · Announcements · Notifications** (URL-driven).

### Chat tab
- **Left: conversation list** — virtualized, infinite cursor pagination, search, unread-first sorting; types: **Global** (company channel, seeded), **Project** (auto-created with each project; members only), **Direct** (1:1), **Group** (created by HR/Admin via dialog: name + member multi-select). Unread conversations show a colored left border + count badge; opening marks read. Chats can be **pinned** to the top of your list.
- **Right: thread** — infinite upward history (newest at bottom, scroll anchoring); **composer**: Enter to send, Shift+Enter newline, **@mention autocomplete** (filters conversation members; mentioned users get a notification with the message snippet), **file/image attachments ≤10 MB** (uploaded to S3; images/PDFs preview inline), optimistic send with rollback on failure.
- **Read receipts** (single ✓ sent / double ✓ read) in direct messages; messages auto-mark-read as they scroll into view.
- **Pinned messages:** managers pin/unpin messages in project chats; pinned items show in a bar atop the thread.
- **Realtime:** new messages/reads/conversations arrive instantly over WebSockets; when realtime is down the tab degrades to 15-second polling and shows a "Not connected" pill.
- **New DM entry points:** chat "New message" picker, Directory card "Message", user profile — all call the same find-or-create DM endpoint (`/conversations/dm`; DM-with-self is rejected 422).

### Announcements tab (and the dashboard board widget)
- Feed of announcement cards: title, rich body, priority (normal/high/urgent), pinned-first ordering, scope (company or team), author + timestamp.
- **Create/Edit (managers):** title, body, scope, priority, pinned flag. High/urgent → in-app notification to all active users in scope. Live updates via realtime channel.
- **Reactions:** any user toggles emoji reactions; per-emoji who-reacted visible. No comment threads (by design).
- The dashboard board widget shows the same feed with a per-user dismiss (✕).

### Notifications tab (+ bell in the top bar)
- **Bell (every page):** badge = high-priority unread count; popup with recent items, mark-read, mark-all-read; "View all" opens the center.
- **Center:** full history — filters by type (taxonomy with icons) + unread-only + search; pagination; mark read / all-read.
- **Sources:** leave decisions, approvals awaiting you, task assignments/completions, @mentions, high/urgent announcements, suspicious logins, export-ready, open-shift nudges, reminders (task/shift/holiday), password-reset decisions. Realtime toasts on arrival (respecting the user's sound preference).

## 3.9 Directory & People Management

`/dashboard/directory` — four tabs (management tabs capability-gated): **Corporate Directory · Employee Management (HR/Admin) · Departments · Designations & Roles**.

### Corporate Directory
- Card + table views; search; filter by department + designation; 24/page "Load more"; each entry shows photo, name, designation, department, roles, contact info **respecting each user's own privacy setting** (Profile → Preferences: public = full contact; private = name/role only).
- Actions: **Message** (opens a DM), detail sheet, "View Profile" (full record — requires manage capability at the API).

### Employee Management (HR: managed departments; Admin: all)
- **Table:** name/ID, email, department/team, designation, roles, status; filters + search + pagination + bulk select; show-trashed toggle with **Restore**.
- **Create User dialog:** name*, email* (unique), username (unique), phone, employee ID (auto-numbered `G4K-###` if blank), department → team (cascading), designation, work schedule, **roles*** (employee / hr / super_admin checkboxes — creating HR/Admin requires the higher capability, server-checked).
  - **E2E:** server generates a random temp password → user row + role assignments + audit entry → temp password emailed if SMTP (else the creating manager sees it to hand over) → new user must change it at first login (forced).
- **Row actions:** Edit (same form), Activate/Deactivate (last-super-admin protected server-side), Reset Password (temp password + forced change), Delete (soft; revokes tokens), Export selected/filtered (async pipeline).
- **Draft:** the create form autosaves a draft (restore banner on return).

### Departments tab
- Everyone views the list (name, auto-code `DEP-###`, headcount, status). **Manage actions gated to `departments.manage` (Admin).**
- **Create/Edit:** name (unique), description. **Archive/Restore**; **Delete blocked while users are assigned**.
- **Department detail sheet — three tabs:** *Employees* (bulk sync member list), *HRs* (set which HR users manage the department — this mapping drives ALL HR scoping in the app), *Teams* (create/delete sub-teams). Export via async pipeline.

### Designations tab
- Master list (name, headcount, active status) + search + pagination. Manage (Admin): create/edit, activate/deactivate toggle, delete blocked while any user holds it, export.

## 3.10 Employee Record Detail

`/dashboard/org/users/[id]` (HR for their people; Admin for anyone) — the 360° record: header (avatar, name, role pills, status, quick actions: edit, reset password, activate/deactivate, delete, Message, view attendance) + five tabs:
1. **Personal Info** — profile fields + department/designation/schedule editors.
2. **Attendance** — their full attendance history (HR-scoped) with calendar + day details.
3. **Leave History** — every request + decisions.
4. **Projects & Tasks** — all assignments with statuses.
5. **Activity Log** — their audit trail (logins, CRUD performed, approvals…).

## 3.11 Reports & Data Exports

`/dashboard/reports` — two tabs (capability-gated; employees have no Reports nav).

### HR & Admin Reports tab
- **Attendance Summary** + **Leave Summary** tables over any date range + department; KPI rows; **Saved Views** (save any filter set per module, apply later; delete supported).
- Export any summary through the async pipeline (xlsx/csv/pdf).

### General Data Exports tab
- **Report Builder:** dataset picker — **Tasks & Deliverables · Projects & Milestones · Employee Directory · Productivity** (productivity = task completion rate 80% + logged-time score 20%) — search, column generation, refresh, export.
- **Export History:** your recent export jobs with status and authenticated **Download** button (⚠ capped at 3 visible — FIN-P2-6).

### The async export pipeline (used by EVERY export button app-wide)
`Export click → POST /…/export → ExportJob queued → file built on worker → stored on S3 → "export-completed" realtime event + bell notification → Export History → Download (authorized blob)`. Nothing blocks the UI; failures land in System Jobs for retry.

## 3.12 Settings Console (Admin)

`/dashboard/settings` — 12 URL-synced tabs behind `settings.manage`:

| Tab | What it controls |
|---|---|
| **Company Profile** | Name, short name, timezone, **logo upload** (S3) |
| **Work Schedules** | Shift templates CRUD: start/end time, break minutes, grace minutes, working days; one default (drives late/overtime math everywhere); default/last-schedule delete protection |
| **Policies** | Password policy (length, complexity), access-token minutes, refresh days, **max concurrent devices**, password expiry days |
| **Holidays** | Shortcut into the holiday calendar management (add/edit/delete, recurring flag) |
| **Mail / SMTP** | Host/port/encryption/credentials + **Send Test Email** (values masked on read-back) |
| **Notifications** | Per-event channel matrix (leave requests, attendance reminders, weekly summary → in-app / email toggles) |
| **Auto-Numbering** | Prefix + start number + format for company / department / employee IDs with live preview |
| **Reminders** | Shift-start reminder minutes, missed-clock-in alert minutes, cutoff time |
| **Security Requests** | The admin side of no-SMTP password resets: pending list → **Approve** (issues one-time link to copy/send) / **Reject** |
| **Audit Log** | Immutable trail of every important action (actor, action, subject, before/after diff, IP, timestamp); filters (action, user, date range) + export |
| **Demo Data** | Dataset status counts; **Seed** (repopulates demo dataset) and **Purge** (type-to-confirm "REMOVE DEMO DATA"; deletes every demo-tagged row in FK-safe order, never touches real data) |
| **System Jobs** | Queue health: pending/failed counts (10s polling) with per-job **Retry** |

## 3.13 My Profile

`/dashboard/profile` — three tabs + header.
- **Header:** avatar upload (drag-drop, type + 2 MB validation → S3), name, role pills, compact attendance stats (days worked, leave counts).
- **General Info:** name, phone, **self-designation dropdown**, department/company read-only cards (company card via the ungated `/companies` endpoint).
- **Security & Devices:** change password (policy-validated); active session list with per-session **Revoke** (current-device revoke = instant logout; other tabs die via realtime).
- **Preferences & Support:** directory visibility (public/private), theme (light/dark/system), density, **Hidden Widgets manager** (restore dismissed widgets — ⚠ dismiss wiring pending FIN-P2-1), and the **Feedback / Complaint form** (subject, category suggestion/complaint, body → stored + delivered as a DM to the managing HR/Admin + high-priority notification).

---

# Part 4 — Cross-Cutting Systems

## 4.1 Notification engine
Two surfaces (bell for high-priority + full center), realtime toasts, per-user sound preference, mark-read/unread semantics, cleanup job pruning old rows. Every business event funnels through one `NotificationService` (in-app always; email where configured).

## 4.2 Realtime channels (Reverb)
Chat messages/reads; new conversations; notification toasts; announcement refreshes; attendance table refresh on any punch; approval status changes; export-completed; **session revoked** (instant cross-device logout). Client connects only when Reverb env vars exist; every consumer has a polling fallback — realtime outage degrades UX, never breaks function.

## 4.3 Offline engine (PWA)
Installable app; non-GET API calls queue in IndexedDB while offline and replay on reconnect (retry ladder 1s/5s/30s/2m); punches idempotent so replays never duplicate; the time clock works fully offline; banner + per-widget badges show state; 4xx during sync marks the item failed; conflicts (409/422) are parked for manual review.

## 4.4 Export pipeline
Single async job pipeline for **all** exports (attendance, leave, users, departments, designations, audit, reports) — see 3.11.

## 4.5 Scheduler jobs (all verified live in `routes/console.php`, timezone Asia/Kolkata)
| Job | Cadence | Effect |
|---|---|---|
| RemindShiftStart | every 5 min | "Shift starts in X minutes" reminder to employees (default 15-min offset, configurable) |
| AlertMissedClockIn | every 5 min | HR alert listing employees not clocked in 30 min after start (configurable) |
| FlagOpenShifts | every 5 min | Flags clocked-in-never-out days + nudges |
| tasks:reminders | every minute | Delivers due task/due-date reminders as notifications |
| reminders:holidays | daily | Holiday/event reminder **10 days before** (offset configurable) |
| reports:send-weekly-summary | Sundays 09:00 | Metrics email to Admins (needs SMTP) |
| passwords:expire-flag | daily | Flags expired passwords → forced change |
| sanctum:prune-expired | daily | Token hygiene |
| notifications:cleanup | daily | Prunes old notifications |
| Scheduler heartbeat | every minute | Liveness log |

## 4.6 Audit log
Written by every consequential action (auth, user CRUD, corrections, settings changes, approvals, exports, chat administration…) via one `AuditLogger` — actor, action, subject type/id, before/after JSON, IP, timestamp. Admin-only viewer + export.

## 4.7 Pins
Per-user shortcuts: pin any project card or task (📌) → appears in the sidebar's Pinned section + mobile drawer; unpin from the same widget; server-persisted (max 100).

## 4.8 Command palette & shortcuts
Ctrl/Cmd+K palette: recent directory items, HR/admin actions (attendance console, corrections, exports), punch shortcuts (execute immediately), navigation. Ctrl/Cmd+N context-aware create. Ctrl+B sidebar. Ctrl+/ shortcut help. Escape closes. Version guard polls `/api/version` (60s) → one-click reload on new deploy.

## 4.9 Preferences sync
Sidebar state, dashboard layouts, density, theme, directory visibility sync via `/auth/preferences` — the user's setup follows them across devices.

---

# Part 5 — End-to-End Workflow Narratives

### 5.1 Day 1: from zero to a working company
1. Admin signs in → completes onboarding.
2. Settings: company profile + logo, default work schedule, policies (password/session), SMTP + test email, holidays, auto-numbering.
3. Directory → Departments: create departments → assign HRs (sets HR scoping) → teams.
4. Directory → Designations: create titles.
5. Employee Management: create HR + employee accounts (temp passwords emailed; forced change on first login; each new user walks through onboarding).
6. HR creates the first project (+ team + QA form) → project chat auto-created → tasks assigned → employees notified.

### 5.2 A day in the life (employee)
Phone buzzes 15 min before shift (scheduler) → sign in → big green button → Clock In (late badge if past grace) → open pinned project → start the project timer → work; pause/resume for breaks; End Session logs the time → update task progress → Submit for Review (note + QA answers) → manager notified → employee keeps working; approval result arrives as a notification and shows on the dashboard widget → Clock Out; day summary + overtime visible in history heatmap.

### 5.3 Task approval E2E
Create (manager or allowed employee) → assignment notification → work (comments, timers, reminders, dependencies guard completion) → submit (note + QA, required fields enforced twice) → status `review` → manager reviews (QA answers inline) → **Approve** → `done` + submitter notified + optional auto-post to project/global chat + recurrence spawns the next occurrence → or **Redo** (reason) → back to work. Every step lands in the task's Activity tab and the audit log.

### 5.4 Project approval E2E
Create (+chat auto-created, members synced) → tasks flow (5.3 × N) → employee completes QA form + writes the completion report → Submit → status `review`, HR + Admin notified → review panel shows note + QA answers → Approve (`completed`, timestamped, appears in Project History with team, tasks, total time, approval status) or Redo (reason, back to active).

### 5.5 Leave E2E
Employee/HR submits (future dates, overlap + balance checked twice) → Approval routed (employee→HR, HR→Admin) → bell + realtime to approver → decision (reject reason mandatory) → approve writes on-leave attendance days for the span + balance increment + notify → visible in history tables, member sheets, summaries; the dashboard Pending Approvals widget clears.

### 5.6 Attendance oversight E2E (HR/Admin)
Punches stream into the console (realtime) → anomalies surface (late badges, open shifts, no-shows via the missed-clock-in job) → HR opens a member sheet → initiates a correction (reason + preview) → audit row + employee notification → corrected totals propagate to history/graphs/exports → exports run through the async pipeline to the admin's downloads + email summary lands every Sunday.

### 5.7 Communication E2E
Announcement posted (high priority) → bell + dashboard board for everyone → reactions roll in. Project chat: mention a teammate → they get the snippet notification → read receipts update. Employee complaint via Profile → Support → DM to HR + high-priority notification → resolution in-thread.

---

# Part 6 — Rules Compendium

### Validation matrices (server-enforced; client mirrors)

| Form / Action | Key rules |
|---|---|
| Login | 6/min throttle; lockout 5 fails / 10 min; inactive/locked rejected |
| Password (change/reset) | Policy from Settings (min length, mixed case, number, symbol); resets revoke all tokens |
| Leave request | type ∈ casual/sick/earned/unpaid; start > today; end ≥ start; reason ≤1000; overlap rejected; balance checked |
| Leave decision | decision ∈ approved/rejected; **reason required on reject**; scope: HR→managed employees, Admin→anyone, never self |
| Task create | title ≤255 required; priority ∈ low/medium/high/urgent; scope ∈ global/department/role; assignees must exist; blocked_by cycle-checked |
| Task submit | note required; QA required-fields enforced client + server |
| Task update | assignees limited to status/progress/due_date/description; blocker-done guard on completion |
| Project create/update | name required; priority enum; end_date ≥ start_date; status enum vs DB CHECK (active/completed/archived/review/pending_review) |
| Project submit | note required; QA required-fields enforced server-side |
| Project review | decision ∈ approved/rejected/redo; redo→active, approved→completed |
| User create | name/email/roles required; email+username+employee_id unique; roles ⊆ employee/hr/super_admin; HR/Admin creation needs `users.hr.manage` |
| Message send | body or attachment; files ≤10 MB; mentions must be real users; reply_to must exist |
| Group create | name required; member_ids must exist (route gated `chat.manage`) |
| Announcement | title/body required; scope ∈ company/team; priority ∈ normal/high/urgent |
| Correction | type + time per event; **reason required ≤500**; totals preview before save |
| Timer log | minutes ≥ 1 integer; task/project optional but validated |
| Pin | type/target/label/href required; 100 max per user |
| Feedback | subject required; category ∈ suggestion/complaint; body required |
| Pagination | per_page whitelisted to 20/50/100 on every paginated endpoint |

### Status vocabularies (single source of truth)
- **Task:** todo → in_progress → review → done (+ rework via redo)
- **Project:** active → review → completed / active (redo); archived; (pending_review legacy)
- **Leave:** pending → approved / rejected (approval `decision` may add `redo` semantics on tasks/projects)
- **Attendance day:** present / late / on-break / in-progress / completed / absent / leave / holiday; overtime is a computed overlay with its own heat color
- **Badge colors app-wide:** gray=not started, blue=in progress, amber=pending review/approval, green=approved/done, red=redo/rejected/overdue

---

# Part 7 — Navigation Map

**Shared:** Sign In → (Role Select) → Dashboard → Chat → Profile → Notifications (bell).

**Admin sidebar:** Overview — Dashboard · Projects & Tasks · Communications │ Organization — Directory · Attendance (console) · Reports & Analytics │ Account — Settings & Profile (Settings via user menu) · Pinned section.
**HR sidebar:** Overview — Dashboard · Attendance & Time · Projects & Tasks · Communications │ Organization — Directory · Attendance (team) · Reports & Analytics │ Account — Settings & Profile · Pinned.
**Employee sidebar:** Overview — Dashboard · Attendance & Time · Projects & Tasks · Communications │ Account — Settings & Profile · Pinned. *(No Directory/Reports — owner decision 2026-08.)*

**Mobile:** bottom bar — Dashboard · Projects · **raised green Attendance FAB** · Chat · Profile; hamburger opens the full nav as a slide-over; chat = list → full-screen thread with back; time clock is the hero widget.

**Legacy URL redirects (all verified):** `/dashboard/leave` → Attendance?tab=leave · `/dashboard/org/leave` → Attendance?tab=approvals · `/dashboard/org` & `/dashboard/org/users` → Directory?tab=management · `/dashboard/org/departments|designations` → Directory tabs · `/dashboard/admin/attendance` → Attendance Console · `/dashboard/admin/reports` → Reports · `/dashboard/announcements` → Chat?tab=announcements · `/dashboard/notifications` → Chat?tab=notifications · `/dashboard/audit` → Settings?tab=audit.

---

*Known defects and the finish-line plan live in **finalization.md**. This map reflects the codebase as of 2026-08-19.*
