# Games4Kings Workplace OS — Complete Workflow Guide

**Document date:** 2026-08-18
**Source of truth:** This document was generated from a full code-first audit of the repository (`apps/web` Next.js frontend + `apps/api` Laravel backend). It describes every workflow that is implemented in the app today — the rules, validations, and role permissions exactly as the code enforces them.

---

## Table of Contents

1. [The App at a Glance](#1-the-app-at-a-glance)
2. [Roles & Permissions Model](#2-roles--permissions-model)
3. [Authentication Workflows](#3-authentication-workflows)
4. [Onboarding & First Login](#4-onboarding--first-login)
5. [Role Switching (Multi-Role Users)](#5-role-switching-multi-role-users)
6. [Employee Attendance — Clock In/Out & Breaks](#6-employee-attendance--clock-inout--breaks)
7. [Attendance History & Calendar (Self)](#7-attendance-history--calendar-self)
8. [HR Team Attendance Monitoring](#8-hr-team-attendance-monitoring)
9. [Admin (Company-Wide) Attendance Console](#9-admin-company-wide-attendance-console)
10. [Attendance Corrections](#10-attendance-corrections)
11. [Leave Management — Requesting Leave](#11-leave-management--requesting-leave)
12. [Leave Approvals (HR / Admin)](#12-leave-approvals-hr--admin)
13. [Holidays Calendar Management](#13-holidays-calendar-management)
14. [Projects Lifecycle](#14-projects-lifecycle)
15. [Tasks — Board, Lists, Gantt](#15-tasks--board-lists-gantt)
16. [Task Submission, Review, Approve/Redo](#16-task-submission-review-approveredo)
17. [Task Comments, Reminders, Dependencies, Recurrence](#17-task-comments-reminders-dependencies-recurrence)
18. [Time Tracking (Project Timer & Manual Logs)](#18-time-tracking-project-timer--manual-logs)
19. [QA Forms & QA-Gated Submissions](#19-qa-forms--qa-gated-submissions)
20. [Chat / Messaging](#20-chat--messaging)
21. [Announcements](#21-announcements)
22. [Notifications](#22-notifications)
23. [Directory (Corporate & Employee Management)](#23-directory-corporate--employee-management)
24. [Employee Record Management (HR CRUD)](#24-employee-record-management-hr-crud)
25. [Departments, Teams & Department HRs](#25-departments-teams--department-hrs)
26. [Designations](#26-designations)
27. [Role Dashboards & Widget Customization](#27-role-dashboards--widget-customization)
28. [Reports & Data Exports](#28-reports--data-exports)
29. [Settings (Admin Console)](#29-settings-admin-console)
30. [Audit Logs](#30-audit-logs)
31. [My Profile, Security & Sessions](#31-my-profile-security--sessions)
32. [Password Reset (Self-Service + Admin Approval)](#32-password-reset-self-service--admin-approval)
33. [Pins (Quick Access Shortcuts)](#33-pins-quick-access-shortcuts)
34. [Command Palette & Keyboard Shortcuts](#34-command-palette--keyboard-shortcuts)
35. [Offline Mode (PWA)](#35-offline-mode-pwa)
36. [Realtime Updates (WebSockets)](#36-realtime-updates-websockets)
37. [Theme, Density & Layout Preferences](#37-theme-density--layout-preferences)
38. [Demo Data Seeding & Purge](#38-demo-data-seeding--purge)

---

## 1. The App at a Glance

Games4Kings Workplace OS is a company intranet / HRMS for the Games4Kings team (~13 seeded users, 3 departments). It runs as two applications:

- **Frontend:** Next.js 16 (App Router) — login, dashboard, attendance, leave, projects/tasks, chat, directory, reports, settings.
- **Backend:** Laravel API — token authentication (Sanctum), PostgreSQL (Supabase), S3-compatible file storage, Reverb WebSockets, database queue for background jobs.

A user logs in with email / employee ID / username + password, possibly picks a role (if they hold more than one), completes a one-time onboarding, and lands on a role-specific dashboard. From there the sidebar offers: **Dashboard, Attendance & Time, Projects & Tasks, Communications (Chat), Directory, Team Attendance (HR+), Reports**, plus **Profile**. Admins additionally reach **Settings** from the user menu.

---

## 2. Roles & Permissions Model

There are exactly **three roles**: `super_admin`, `hr`, `employee`. A user may hold multiple roles (e.g. employee + HR) and chooses an active role at login.

Permissions are "capabilities" attached to each role in the database (`role_capabilities` table, editable only by seeding/settings). The effective matrix (from the production seeder):

| Capability | super_admin | hr | employee | What it controls |
|---|---|---|---|---|
| `*` (everything) | ✔ | — | — | Wildcard for all capabilities |
| `attendance.clock-self` | **✖ (excluded by design)** | ✔ | ✔ | Clock in/out, own attendance pages |
| `hr.view-team-attendance` | ✔ | ✔ | — | Team attendance pages/tables |
| `admin.view-all-attendance` | ✔ | — | — | Company-wide attendance console |
| `attendance.correct-team` | ✔ | ✔ | — | Correct team attendance |
| `leave.request-self` | ✔ | ✔ | ✔ | Request leave for yourself |
| `leave.approve-employee` | ✔ | ✔ | — | Approve/reject leave of employees |
| `users.employee.manage` | ✔ | ✔ | — | Employee CRUD list/actions |
| `users.hr.manage` | ✔ | — | — | HR-level user management + exports |
| `directory.view` | ✔ | ✔ | ✔ | See the corporate directory |
| `chat.access` | ✔ | ✔ | ✔ | Use chat |
| `chat.manage` | ✔ | ✔ | — | See group-creation UI, pin messages |
| `profile.edit` | ✔ | ✔ | ✔ | Edit own profile |
| `tasks.view` / `tasks.create-own` | ✔ | ✔ | ✔ | See tasks / create own tasks |
| `tasks.manage` | ✔ | ✔ | — | Assign, edit, approve tasks |
| `projects.view` | ✔ | ✔ | ✔ | See projects they belong to |
| `projects.manage` | ✔ | ✔ | — | Create/edit/review projects |
| `qa.view` / `qa.manage` | ✔ | ✔ | — / — | QA forms (manage = build) |
| `timer.track` | ✔ | ✔ | ✔ | Project timer + time logs |
| `reports.view` | ✔ | ✔ | ✔ (seeded) | Reports page |
| `settings.manage` | ✔ | — | — | Settings console, holidays CRUD, demo data |
| `audit.view` | ✔ | — | — | Audit log |
| `announcements.manage` | ✔ | ✔ | — | Post/edit/pin announcements |
| `departments.manage` | ✔ | — | — | Department CRUD |
| `designations.manage` | ✔ | — | — | Designation CRUD |

**How gating works in practice:**

- The **backend** is the real enforcement: every API route is wrapped in `capability:...` middleware; requests without the capability get 403.
- The **frontend** hides UI it knows the user can't use (nav items, buttons) using the capability list fetched after login (`GET /me/capabilities`).
- A Next.js **middleware** additionally guards a handful of routes (settings, audit, org pages) by reading a capabilities cookie — a UX nicety, not a security boundary (the API enforces the truth).

**Notable design rules:**

- **super_admin cannot clock in/out** — `attendance.clock-self` is explicitly excluded from the wildcard. Their dashboard and nav hide all time-clock features.
- HR is scoped to **their managed departments** (via the department-HR mapping) for team attendance, leave approvals, and the users list. The admin sees everything.

---

## 3. Authentication Workflows

### 3.1 Login

**Who:** everyone. **Entry:** `/login`.

1. User enters an **identifier** (email, employee ID, or username — all three are accepted) and password (min 6 chars client-side).
2. The backend:
   - Throttles by identifier+IP: **6 attempts/minute**; after 5 failed attempts the **account locks for 10 minutes** (HTTP 423 with a `retry_after` seconds countdown, shown as a live countdown on the button).
   - Rejects `inactive` and `locked` accounts with clear messages.
   - Detects **suspicious logins**: if the user's IP changed since their last successful login, it logs a warning, creates an urgent "Suspicious Login" notification for all HR/super_admins, and (if SMTP is configured) emails the user.
   - Enforces **password expiry** (if `password.expiry_days` is configured, an expired password sets `must_change_password`).
   - Enforces **max concurrent devices** (setting `session.max_devices`): oldest sessions' tokens are pruned.
3. On success the API returns: access token (15 min TTL by default), refresh token (7 days, stored in an **HttpOnly cookie** `g4k_refresh_token`), the user object, active role, capability list, and flags `must_change_password` / `onboarded`.
4. The frontend routes in this priority:
   - `must_change_password` → `/change-password`
   - not onboarded → `/onboarding`
   - multiple roles → `/role-select`
   - otherwise → `/dashboard`
5. Every login/logout is written to the **audit log** and a `login_attempts` row.

### 3.2 Session keep-alive & refresh

- All API calls carry `Authorization: Bearer <access token>`.
- On any 401 (expired 15-min token), the client silently calls `GET /auth/refresh` **once** (mutex-protected so parallel requests don't stampede), using the HttpOnly refresh cookie. A new access token is issued, the failed request is retried, and the user continues unnoticed.
- If refresh also fails → auth cleared, hard redirect to `/login?reason=expired`.
- Changing password revokes **all** tokens on all devices (user must log in again everywhere).

### 3.3 Logout

- From the sidebar/user menu: `POST /auth/logout` → current tokens deleted, a `session.revoked` realtime event fires (other tabs of the same user log out too via a BroadcastChannel), query cache cleared, redirect to `/login`.

### 3.4 Forgot / Reset password (self-service)

1. `/forgot-password`: user enters their identifier. The backend **always** answers 202 with a generic message (no account enumeration). Behind the scenes it creates a **Password Reset Request** (pending) and emails a reset link **only if SMTP is configured** (see §32 for the admin-approval fallback).
2. `/reset-password?token=...&email=...`: user sets a new password (must pass the password policy: min length + mixed case + number + symbol). Tokens expire after **60 minutes**. On success all tokens are revoked.

### 3.5 Change password (forced or voluntary)

- `/change-password` (also inside Profile → Security): requires current password + new password + confirmation, validated against the server-side password policy.
- When `must_change_password` is true, **every** API call except change-password/logout returns 403 with `must_change_password: true`, and the frontend guard hard-redirects the user to `/change-password` — it is impossible to use the app until the password is changed.

---

## 4. Onboarding & First Login

**Who:** brand-new users (seeded example: `priya@games4king.in`). **Entry:** forced redirect after login when `onboarded_at` is null.

Three steps:

1. **Profile** — phone + emergency contact (optional fields, saved at completion).
2. **Password** — optional change-password step (skipped if not forced).
3. **Tour** — a guided product tour, then an animated logo finish screen.

Finishing calls `POST /auth/onboarding/complete` which stamps `onboarded_at` and unlocks the whole API (before that, every endpoint 403s with `needs_onboarding: true`). The app then routes to role selection or dashboard.

---

## 5. Role Switching (Multi-Role Users)

**Who:** users with 2+ roles (seeded example: `vignesh@games4king.in` = employee + HR).

- After login they land on `/role-select`, which shows one card per assigned role with a description.
- Choosing a role calls `POST /auth/role-select`: the backend **deletes the current access token and mints a new one scoped to the chosen role** (`role:hr` ability), persists `active_role`, and returns fresh capabilities. The whole app re-renders with the new role's nav/widgets/permissions.
- Single-role users skip this page entirely (and a redundant auto-select call is still made for them on this route if they visit it directly).
- All capability-gated UI (nav, buttons, pages) reacts to the active role only.

---

## 6. Employee Attendance — Clock In/Out & Breaks

**Who:** hr + employee (super_admin excluded). **Entry:** Dashboard "Time Clock" widget, sidebar "Attendance & Time", mobile bottom-nav big green button, or the command palette.

**The punch state machine:**

```
not started ──clock-in──▶ active ──start-break──▶ on break
     ▲                      │  ▲                     │
     │                      │  └────end-break────────┘
     │                      │
  (clock-in again     clock-out (allowed from active OR on break —
   via "Continue        clocking out while on break auto-records
   Shift" confirm)      the break end first)
```

**Rules & behaviors:**

- Punches are sent to `/attendance/clock-in|start-break|end-break|clock-out` with a unique `client_id` (idempotency key — retrying the same punch can't double-record).
- **Optimistic UI:** the timer starts/stops instantly; the server response then re-syncs the official state.
- A full day summary shows: status badge (present/late/on-break/in-progress/completed/absent), live worked timer, break list with durations, clock-in/out times, and overtime vs. the **standard day** (default schedule: 09:00–18:30, 45-min break, 10-min grace, Mon–Sat = 8h45m = 31,500 seconds).
- **Late** is computed server-side from the schedule's start time + grace minutes.
- Clocking in when the server already has a clock-in doesn't duplicate — the client reconciles instead of punching.
- The header "project timer" widget is separate (see §18).
- Works offline (see §35).

---

## 7. Attendance History & Calendar (Self)

**Entry:** Attendance & Time page → history list + "full calendar" dialog (month grid + GitHub-style heatmap on mobile).

- Data: `/attendance/me/history` — last 365 days; each day carries totals (worked, break, overtime, late minutes) plus **projects/tasks time logged that day**.
- Clicking a day opens a detail dialog: punch timeline (clock-in, breaks, clock-out with device metadata), per-project/task time, open-shift badge.
- Holidays from the company holiday calendar are rendered in the grid; future dates are disabled.
- The Profile page also shows a compact stats row (days worked, leave counts) computed from the same data.

---

## 8. HR Team Attendance Monitoring

**Who:** `hr.view-team-attendance` (hr + super_admin). **Entry:** sidebar "Attendance" (Organization section) → `/dashboard/org/attendance`. Super_admin gets **two tabs: "Global Company (Admin)" and "My Team (HR)"**; plain HR gets only the team view.

**Team view ("My Team") contains:**

- **Analytics cards** (present/absent/late/leave today, average clock-in, overtime) — computed for the selected date/department.
- **Live table** of all managed-department employees for a chosen date with status, clock-in/out, breaks, worked hours; a live "clocked-in now" ping on today's view; filters by date, status, department, and debounced search; server-side pagination + sorting.
- **Realtime:** new punches by anyone instantly refresh the table (WebSocket `presence-org` → `attendance.updated`); if realtime is disconnected it polls every 60s.
- Clicking an employee opens the **member sheet** with three tabs:
  - *Day* — that day's full punch timeline (with device info and an audit-log deep link for manual corrections).
  - *History* — the member's full attendance calendar (same component as self-view, but HR-scoped).
  - *Trends* — weekly/monthly hours & overtime chart.
- **Graph tab** — stacked present/absent/late bars + hours/overtime lines, weekly or monthly, groupable by date or employee.
- **Activity feed widget** (HR dashboard) surfaces anomalies: late arrivals and open shifts, newest first.
- **Open shift badge** — days where someone clocked in but never clocked out; one click opens the correction dialog preset to add a clock-out.

---

## 9. Admin (Company-Wide) Attendance Console

**Who:** `admin.view-all-attendance` (super_admin). **Entry:** the "Global Company (Admin)" tab (hosted at `/dashboard/org/attendance`).

Four sub-tabs:

1. **Calendar** — month heatmap of present-rate per day (≥90/70/50% bands); clicking a day jumps to that date's table.
2. **Today/Table** — the company-wide version of the HR table (date range, department, employee, status filters, search, pagination, sorting) plus "View Leave" cross-links into the leave approvals screen filtered to that user.
3. **Analytics** — six KPI cards for the chosen date/department.
4. **Open Shifts** — everyone with an open shift; supports **bulk "Notify Open Shifts"** (sends each employee an in-app notification to close their shift) and per-row "assign correction."

Exports (both HR and admin tables): export selected rows or the whole filtered set to `.xlsx` via the async export pipeline (see §28).

---

## 10. Attendance Corrections

**Who:** `admin.correct-attendance` (super_admin) or `attendance.correct-team` (hr). **Entry:** open-shift badges, member sheet, table rows, or command palette "Attendance Correction."

- The dialog shows the day's real event timeline and lets the HR/admin **add**, **edit**, or **remove** a punch event (type + time).
- A **reason is mandatory** (client and server enforced, ≤500 chars).
- A **predicted-totals preview** simulates the change live before saving.
- Saving writes an `attendance_corrections` audit row (old/new value, corrector) and notifies the employee; the corrected day is flagged `source: manual` with a version bump.
- Every manual event in timelines links back to the audit log for traceability.

---

## 11. Leave Management — Requesting Leave

**Who:** everyone (`leave.request-self`). **Entry:** Attendance & Time → "Request Leave" button (page header) or "My Leave" tab.

**Request form rules:**

- Types: **casual, sick, earned, unpaid** (fixed set).
- Start date must be **strictly tomorrow or later** (today is not allowed); end ≥ start; past dates are disabled in the picker.
- Reason required (≤1000 chars).
- **Client-side overlap check** against already-loaded pending/approved leave; the **server double-checks** overlaps (a pending request covering the same days is rejected 422) and **leave balance** (default allowance 12/year per type; insufficient balance is rejected).
- The form **autosaves a draft** to the browser (IndexedDB) every 30s and offers Restore/Discard if the user leaves and returns.
- On submit an **Approval** record is created and routed by role: employee leave → their HR; HR leave → super_admin. The approver gets a notification + realtime event. **Self-approval is blocked.**

**My Leave tab:** history table (dates, type, reason, status, approver, decision reason) with type/status/search filters and pagination; the **Holidays** sub-tab shows the company holiday calendar (§13).

---

## 12. Leave Approvals (HR / Admin)

**Who:** `leave.approve-employee` (hr + super_admin). **Entry:** Attendance & Time → "Team Leave Approvals" tab (HR/admin only), or the dashboard "Pending Approvals" widget.

- **Approvals sub-tab:** pending requests for the HR's managed departments (admin sees all), filterable by employee/search, with **Approve / Reject** actions. Rejecting **requires a reason** (enforced in the dialog and server-side).
- Approvals apply **optimistically** with rollback on failure.
- **Decision effects:** approved leave writes `on_leave` attendance days for the whole span (so the employee shows "leave" not "absent"), increments the leave balance `used` counter, notifies the requester realtime + in-app, and busts dashboard caches.
- **History sub-tab:** all past decisions (approvals + rejections) with filters and its own export.
- The dashboard **Pending Approvals widget** allows approving/rejecting leave directly from the dashboard; task/project submissions listed there deep-link to the review screens.
- **Scoping rules:** HR can approve employees in departments they manage; HR cannot approve other HR; super_admin approves anyone; nobody approves their own.

---

## 13. Holidays Calendar Management

**Viewing (everyone):** the Holidays sub-tab in My Leave + the dashboard "Upcoming Holidays" widget (next 3, with recurring support — recurring holidays repeat every year; Feb 29 maps to Feb 28 in non-leap years).

**Managing (`settings.manage` — super_admin):** add/edit/delete holidays (name, date, description, recurring flag) directly on the calendar. Deletion asks for confirmation. The backend caches holiday lists per year and busts them on change.

*(Audit note: the holiday "event" concept — type event with start time/location — still renders in the widget, but the management form no longer creates events; see report.md.)*

---

## 14. Projects Lifecycle

**Who:** viewing = everyone (only projects you're a member of, or all if you manage projects); managing = `projects.manage` (hr + super_admin).

**Status flow:**

```
active ──(Submit for Review + QA answers + note)──▶ review
   ▲                                                 │
   │                                    ┌─ approve ───┴── redo ─┐
   │                                    ▼                       │
   └──────────────── rework ◀──────── (stays active)      completed
                                                        (later: archived)
```

**Creating a project (managers):** name (required), description, priority, department, deadline, QA form attachment, member list, cover image upload (stored on S3), and an **"allow employee tasks"** toggle (lets non-managers create tasks inside this project). Creating a project **automatically creates its project chat channel** with all members.

**Project detail page:** overview stats (task completion, total logged hours, member avatars), tasks board (embedded), member management, cover image, edit dialog, activity history (virtualized log of every task event), submit-for-review panel (with required submission note + QA form answers; required QA fields must be filled), and — for managers while in review — the **review panel** showing the submission note + QA answers with Approve / Redo (redo requires a reason).

**Rules:**

- Only members (or managers) can open a project.
- Archive = status change via edit; delete is a soft delete (managers only).
- Employees (non-managers) only see projects they belong to.

---

## 15. Tasks — Board, Lists, Gantt

**Who:** `tasks.view` (everyone). **Entry:** Projects & Tasks → "My Tasks & Board" tab (`/dashboard/projects?tab=tasks`).

**Four views:**

1. **Kanban board (default)** — columns **To Do / In Progress / Review / Done**; drag-and-drop between columns instantly PUTs the new status (optimistic with rollback); same-column drags reorder and persist order via `/tasks/reorder`. Right-click context menu: view/edit, move to status, delete (with confirm). Mobile: horizontally snapping columns with long-press drag.
2. **List view** — data table with checkboxes, bulk status-update/delete, per-row actions, status/scope/assignee/search filters, pagination.
3. **Gantt** — timeline bars (created → due), dependencies from blocked-by links, status coloring. *(Audit note: dragging a bar does not persist — see report.md.)*
4. **QA Form Builder** — managers only (see §19).

**Scoping rules:**

- Employees see tasks where they are assignee, reporter, or a member of the task's project. Managers see everything.
- Non-managers creating tasks: allowed only **for themselves** (`tasks.create-own`), and only in projects with `allow_employee_tasks` enabled; otherwise the create dialog assigns them automatically.
- Managers can assign multiple assignees, set scope (global/department/role), dependencies (`blocked_by`), QA form, and recurrence.

**Visibility rules on statuses:** a task in a **blocked-by** state can't be moved to done (server guard). Recurring tasks auto-spawn the next occurrence when marked done.

---

## 16. Task Submission, Review, Approve/Redo

The submission pipeline (mirrors projects):

```
todo / in_progress ──(Submit for Review: note + QA answers required)──▶ review
                                                                          │
                                            approve ─────────────────────┴────── redo (reason required)
                                               │                                     │
                                               ▼                                     ▼
                                              done ◀──────────── back to in_progress/rework
```

- The **task detail sheet** (click any task, or `/dashboard/tasks/[id]`) hosts everything: description, progress slider (managers), inline title/due-date edit, assignees, dependencies, comments feed, time logs, reminders, QA answers, and the submit/approve/redo panels.
- Employees see a **"My Submissions"** status widget on their dashboard (pending / approved / redo-required with feedback).
- Approving marks done, fires notifications to the submitter, and (optionally, per a per-task flag) posts a completion message into the project chat.

---

## 17. Task Comments, Reminders, Dependencies, Recurrence

- **Comments:** live feed on the task sheet; Enter to send; participants only.
- **Reminders:** personal reminders at a chosen datetime (`reminders:due-date` also auto-generates from due date); a scheduler runs every minute and delivers due reminders as notifications.
- **Dependencies:** `blocked_by` links; the server prevents completing a task whose blocker isn't done, and detects cycles.
- **Recurrence:** daily / weekly (pick weekdays) / monthly (day of month); on completion the next occurrence is auto-created.

---

## 18. Time Tracking (Project Timer & Manual Logs)

**Who:** `timer.track` (everyone). **Entry:** header "project timer" widget (always visible) and the task sheet's Time tab.

**Flow:**

1. Pick a project (and optionally a task) → **Start** → timer runs in the header.
2. Pause / resume any time.
3. **Stop & Log** opens a pre-filled log (minutes = elapsed, editable) with a description → `POST /timer/log` writes a `task_time_logs` row (task and/or project linked, log date, description).
4. The task sheet's Time tab lists all logs for the task and offers manual entry.
5. Time logs roll up into: project "total hours," attendance day "projects/tasks" breakdown, and productivity reports.

---

## 19. QA Forms & QA-Gated Submissions

**Who:** building = `qa.manage` (hr + super_admin); answering = anyone submitting a task/project bound to a form.

- The **QA Form Builder** (Tasks tab, managers) creates forms: title, description, and field list (label, type — text/textarea/checkbox/slider, required flag).
- Forms attach to **projects** and **tasks** at creation/edit.
- When submitting for review, the submitter fills the form; **required fields are enforced** client- and server-side.
- Managers reviewing see the answers inline in the review panel; answers are stored as a QA submission tied to the task/project.

*(Audit note: only creation is implemented in the UI — editing/deleting forms and select-type fields are backend features without UI; see report.md.)*

---

## 20. Chat / Messaging

**Who:** `chat.access` (everyone). **Entry:** sidebar "Communications" → `/dashboard/chat`.

**Structure:** one screen, three tabs — **Chat**, **Announcements**, **Notifications**.

**Conversations:**

- Types: **Global** (company-wide channel, seeded), **Project** (auto-created per project), **Direct** (1:1), **Group** (named).
- Left list is virtualized with infinite cursor pagination, search, unread-first sorting, and per-type icons/badges.
- Starting a DM: from chat "New message" picker, from the Directory, or from a user profile — all call the same "find-or-create DM" endpoint.

**Messaging:**

- Send with Enter (Shift+Enter = newline); **optimistic send** with rollback on failure.
- **Attachments:** images/PDFs/any file ≤10 MB uploaded to S3; images and PDFs preview inline in a dialog.
- **@mentions:** autocomplete from conversation members; mentioned users get a notification.
- **Read receipts:** single/double check marks; conversations auto-mark-read when opened (and per-message as they scroll into view).
- **History:** infinite upward pagination with scroll anchoring (newest at bottom).
- **Pinned messages:** managers (`chat.manage` or `projects.manage` in project channels) can pin/unpin; pinned items show in a bar atop the thread.
- **Group creation** is gated in the UI to `chat.manage` (hr + admin). *(Audit note: the backend additionally requires an unseeded `chat.group` capability, so in practice only super_admin succeeds — see report.md.)*
- **Realtime:** new messages, reads, and new conversations arrive over WebSockets instantly; if realtime is down, chat degrades to 15-second polling and shows a "Not connected" pill.

---

## 21. Announcements

**Who:** reading = everyone; writing = `announcements.manage` (hr + super_admin). **Entry:** dashboard Announcement Board widget and Chat → Announcements tab.

- Posts have title, rich body, **scope** (whole company or a team), **priority** (normal/high/urgent), and a **pinned** flag.
- High/urgent announcements notify **all active users** in-app.
- **Reactions:** any user can toggle emoji reactions (per-emoji who-reacted).
- Editing/deleting: managers (or the author).
- Live updates arrive over the `org.announcements` realtime channel.

---

## 22. Notifications

**Who:** everyone. **Entry:** bell in the header (unread popup) + Chat → Notifications tab (full center); "View all" from the bell opens the center.

- Sources: leave decisions, approvals awaiting you, task assignments/completions, mentions, announcements (high/urgent), suspicious logins, export-ready, open-shift nudges, reminders, password-reset decisions.
- **Bell behavior:** badge counts **high-priority unread**; popup lists recent unread/important with mark-read and mark-all-read (optimistic); "Clear" hides items locally (persisted per browser).
- **Center:** filters (type taxonomy with icons, unread-only, search), pagination, mark read/all-read.
- Realtime `notification-created` toasts on arrival (respecting the user's sound preference); approval status changes refresh leave caches.
- mark-**unread** exists on the backend but has no UI.

---

## 23. Directory (Corporate & Employee Management)

**Entry:** sidebar "Directory" → `/dashboard/directory` with four tabs:

1. **Corporate Directory** (everyone, `directory.view`): searchable/filterable (department, designation) card + table views with photos, roles, contact info. **Privacy rule:** each user sets their own directory visibility (public/private) in Profile → Preferences; private users show name/role only, with email/phone hidden. Infinite "Load more" pagination (24/page). Actions: **Message** (starts a DM), view detail sheet, "View Profile" (opens the full user record — HR/manage capability required by the API).
2. **Employee Management** (HR + admin only): the full users table — see §24.
3. **Departments** (visible to all; manage actions gated — see §25).
4. **Designations** (visible to all; manage gated — §26).

---

## 24. Employee Record Management (HR CRUD)

**Who:** `users.employee.manage` (hr) / `users.hr.manage` (admin). **Entry:** Directory → Employee Management tab; user detail at `/dashboard/org/users/[id]`.

- **Create user:** full form — name, email, username, phone, employee ID (auto-numbered `G4K-###` if left blank via the auto-numbering engine), department → team cascade, designation, work schedule, **role checkboxes** (employee/hr/super_admin). The server generates a random password, emails it if SMTP is configured, and requires the new user to change it at first login (`must_change_password`).
- **Edit:** all of the above including role replacement.
- **Status:** activate/deactivate (with last-super-admin protection server-side).
- **Delete:** soft delete (revokes tokens; user disappears from lists but is restorable). A "show trashed" filter exposes deleted records with **Restore**.
- **Bulk ops:** select many → bulk activate/deactivate.
- **Reset password (admin-initiated):** generates a temp password, emails it, forces change at next login.
- **Export:** filtered or selected rows → async export job (§28).
- **User detail page:** profile header + department/designation/schedule editors, attendance history (HR-scoped), leave history, project/task assignments, activity feed (audit trail), status/edit/reset/delete actions, and shortcuts (Message, view attendance).

**Scoping:** HR sees and manages only their managed departments (admin sees all). Creating an HR user requires the higher `users.hr.manage` capability (server-checked).

---

## 25. Departments, Teams & Department HRs

**Viewing:** everyone sees the Departments tab (name, code, headcount, status).

**Managing (`departments.manage` — super_admin only by default):**

- Create/edit department (name unique, auto-numbered code `DEP-###`).
- **Archive/restore** (soft archive; archived departments filterable).
- **Delete** blocked if users are still assigned (move them first).
- **Department detail sheet** with three sub-tabs:
  - *Employees* — sync the member list (bulk assign/remove).
  - *HRs* — designate which HR users manage this department (this drives all HR scoping in the app).
  - *Teams* — create/delete sub-teams within the department.
- Export to async job.

*(Audit note: the current UI shows manage buttons to HR (`users.*.manage`) but the backend only grants `departments.manage` to super_admin, so HR actions fail with 403 — see report.md.)*

---

## 26. Designations

- Everyone views the designation master (name, headcount, active status) with search/pagination.
- `designations.manage` (super_admin): create/edit, activate/deactivate (optimistic toggle), delete (blocked while any user holds it), export.

---

## 27. Role Dashboards & Widget Customization

Every role gets a widget-grid dashboard (drag to rearrange, resize, persist):

- **super_admin:** Total Employees (with active/inactive/department breakdown), Active Projects, Today's Attendance snapshot, Pending Approvals (leave + task/project submissions), Recent Activity, Quick Task creator.
- **hr:** Team Attendance today, Pending Approvals, Team Activity feed (late/open-shift anomalies), Quick Task, Announcements board, Upcoming Holidays, Time Clock (self).
- **employee:** Announcements, Active Projects, Pending Tasks, Approval Status (my submissions), Recent Task Progress, Upcoming Holidays, Quick Notes, Time Clock.

**Rules:**

- Layouts (position/size per breakpoint) save automatically (debounced) to the user's preferences server-side and restore on any device; a reconciliation step repairs layouts when the widget catalog changes.
- Widgets individually show loading skeletons, error+retry, and empty states; the whole dashboard has a load-error screen with Retry/Sign-out.
- The Time Clock widget follows the `attendance.clock-self` capability (hidden for super_admin).
- Greeting header (time-of-day based).

---

## 28. Reports & Data Exports

**Who:** `reports.view` (everyone per the seeder) for the standard builder; the admin summary view additionally requires a manager capability in practice (see report note).

**Standard Report Builder:** pick a dataset — **Tasks, Projects, Users, Productivity** — with search; columns are generated from the data; refresh; export to **xlsx / csv / pdf**.

**Admin summary view:** attendance-summary and leave-summary tables over a date range + department, with saved views (save current filter sets per module) and export.

**The export pipeline (all exports company-wide):**

1. Any export button (attendance, leave, users, departments, designations, audit, reports) calls the corresponding `/export` endpoint.
2. The backend creates an **ExportJob** and hands it to the queue worker (runs continuously in deployment).
3. The UI immediately toasts "Export queued" with a **View Exports** shortcut.
4. When the job finishes: the file (xlsx/csv/pdf) is stored on S3, an `export-completed` realtime event fires, and the notification lands in the bell.
5. **Export History** (Reports → Exports tab, also linked from toasts) lists your recent exports with status and a **Download** button (authenticated blob download).

---

## 29. Settings (Admin Console)

**Who:** `settings.manage` (super_admin). **Entry:** user menu → Settings (`/dashboard/settings`). Twelve tabs (URL-synced):

1. **Company Profile** — name, short name, timezone, logo upload.
2. **Work Schedules** — full CRUD of shift templates (start/end, break minutes, grace minutes, working days); one is the default (drives late/standard-hour math); default/last-schedule delete protection.
3. **Policies** — password policy (min length, complexity), session TTLs (access minutes, refresh days), max devices, password expiry days.
4. **Holidays** — shortcut into the holiday calendar management (§13).
5. **Mail / SMTP** — host/port/encryption/credentials + **Send Test Email** (password round-trips masked).
6. **Notifications** — per-event channel matrix (leave requests, attendance reminders, weekly summary → in-app/email toggles).
7. **Auto-Numbering** — prefix / start number / format for company, department, employee IDs with live preview.
8. **Reminders** — shift-start reminder minutes, missed-clock-in alert minutes, cutoff time.
9. **Security Requests** — the admin side of self-service password resets (§32): pending requests with **Approve** (generates a one-time reset link to copy/send) / **Reject**.
10. **Audit Log** — see §30.
11. **Demo Data** — status counts, **Seed** (repopulates the demo dataset) and **Purge** (typed confirmation "REMOVE DEMO DATA"; deletes every demo-tagged row).
12. **System Jobs** — queue health: pending/failed counts (10s polling) with per-job **Retry**.

*(Audit note: several of these tabs have defects — audit table renders empty, timezone list is hardcoded, etc. — detailed in report.md.)*

---

## 30. Audit Logs

**Who:** `audit.view` (super_admin). **Entry:** Settings → Audit Log (the old `/dashboard/audit` URL redirects there).

- Immutable trail of security-relevant actions: logins/logouts, user CRUD, corrections, settings changes, approvals, exports, etc., with actor, action, subject, before/after diff, IP, timestamp.
- Filters: exact action, user, date range (both dates required for the range to apply), pagination.
- Export via the async pipeline.

*(Current defect: the table shows empty due to a response-unwrapping bug, and export uses the wrong HTTP method — see report.md.)*

---

## 31. My Profile, Security & Sessions

**Entry:** sidebar "Settings & Profile" / user menu → `/dashboard/profile`.

- **Header:** avatar upload (drag-drop, type + 2 MB validation, stored on S3).
- **General tab:** name, phone, **self-designation** dropdown, department/company read-only cards.
- **Security tab:** change password (policy-validated); **active sessions list** (device, IP, last used, current-device badge) with per-session **Revoke** (revoking the current device logs you out immediately — realtime `session.revoked` also kills other tabs).
- **Preferences tab:** directory visibility (public/private), theme, density, **Hidden Widgets manager**, and the **Feedback form** (subject/category/body → on submit, a DM is opened with the managing HR).

---

## 32. Password Reset (Self-Service + Admin Approval)

The forgot-password flow has an **offline-friendly fallback** for when SMTP isn't configured:

1. User requests a reset (§3.4) → a **Password Reset Request** row is created (pending) — no email if SMTP is off.
2. Admin opens **Settings → Security Requests**, sees the pending request, and **Approves** it.
3. The backend generates a one-time **reset link** (60-min token) which the admin copies and hands to the user through any channel.
4. The user opens the link → sets a new password → all their tokens are revoked.

---

## 33. Pins (Quick Access Shortcuts)

- Any **project card** and any **task sheet** can be pinned (📌).
- Pinned items appear at the bottom of the sidebar (and mobile drawer) as one-click shortcuts.
- Unpin from the same source widget. Pins are per-user, server-side (`/pins`), max 100.

---

## 34. Command Palette & Keyboard Shortcuts

- **Ctrl/Cmd+K** opens the command palette: recently viewed (directory items), HR/admin actions (team attendance, corrections, exports), punch shortcuts (clock in/out/breaks execute immediately), and navigation (users, departments, designations, settings, reports).
- **Ctrl+B** toggles the sidebar. **Ctrl+/** opens the keyboard-shortcuts help overlay. **/** focuses search boxes on tables.
- A **version guard** polls `/api/version` every 60s and offers a one-click reload when a new build ships.

---

## 35. Offline Mode (PWA)

- The app is installable (manifest, icons, maskable icon, service worker).
- **Reads:** service worker uses network-first for pages/API and stale-while-revalidate for static assets.
- **Writes while offline:** any non-GET API call (punches, leave requests, messages…) is queued in IndexedDB and replayed automatically on reconnect with a retry ladder (1s/5s/30s/2m). Punches use idempotency keys so replays never double-record.
- The **time clock works fully offline** — the timer runs locally and punches sync later; a banner and per-widget badges show offline state.
- 4xx during sync marks the item failed (with a toast + event); conflicts (409/422) are parked for manual review.

---

## 36. Realtime Updates (WebSockets)

- A Reverb WebSocket connection powers: live chat messages/read receipts, new-conversation events, notification toasts, announcement refreshes, attendance table refreshes on any punch, approval status changes, export-completed, and **session revoked** (instant cross-device logout).
- The client only connects when the deployment defines the public Reverb host/key; otherwise **everything silently falls back to polling** (chat 15s, notifications 30s, attendance 60s) and chat shows a "Not connected" pill.
- Channel authorization uses the Sanctum token against `/broadcasting/auth`.

---

## 37. Theme, Density & Layout Preferences

- **Theme:** light / dark / system (user menu), persisted.
- **Density:** compact / comfortable row spacing (user menu), persisted server-side.
- **Sidebar:** three states (expanded / collapsed / hidden) with per-user persistence; mobile gets a slide-over drawer + fixed bottom nav (Dashboard, Projects, Attendance FAB, Chat, Profile).
- Preferences (sidebar state, dashboard layout, directory visibility) sync via `/auth/preferences`.

---

## 38. Demo Data Seeding & Purge

**Who:** super_admin (Settings → Demo Data).

- **Seed** populates the full demo dataset: 13 users across 3 departments with roles, work schedules, 4 weeks of attendance, leave scenarios, projects/tasks with QA, conversations, announcements, notifications, holidays.
- **Purge** requires typing "REMOVE DEMO DATA" and deletes **every demo-tagged row** (users, attendance, projects, etc.) in FK-safe order — it does not touch real (non-demo) records.
- Both run as queue jobs; the status card refetches after completion.

---

*This document intentionally describes what IS implemented. Defects, missing pieces, and mismatches are catalogued separately in **report.md**.*
