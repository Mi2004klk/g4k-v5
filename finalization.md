# finalization.md — The Complete Implementation Plan to Make Every Workflow Production-Ready

> **This is the ONLY plan you need.** Organised by workflow/module. Apply top-to-bottom. After each module,
> commit + verify before moving on. The acceptance standard: **implement → deploy → start using** — every
> Admin, HR, and Employee workflow works from login through task completion with no stuck loading, broken
> components, placeholder data, manual refreshes, or workflow blockers.

---

## MODULE 0 — UNFREEZE (fix FIRST; nothing else is testable until the app renders)

### 0.1 Fix every missing icon import (ReferenceError = hard crash = frozen dashboard)
- **`projects/[id]/page.tsx:95`** — `<Folder>` used but not imported. Add `import { Folder } from "lucide-react"`.
- **`org/users/page.tsx:537`** — `<UsersIcon>` used but not imported. Add `import { Users } from "lucide-react"` and change `<UsersIcon` to `<Users`.
- **Audit ALL files** for any component/icon referenced in JSX but not imported. Run `pnpm --filter web build` — turbopak catches missing imports at build time. **The fact that the live build has these means the build wasn't run or a stale cache served.**
- **Acceptance:** zero `ReferenceError: X is not defined` in the console; dashboard renders without crashing.

### 0.2 Guard ALL `.find()` / `.map()` / `.length()` / `.filter()` on API-sourced data
- **Pattern everywhere:** `const items = Array.isArray(raw) ? raw : [];` — never call array methods on a value that might be `undefined`/`null`/object.
- **Every widget** that destructures from a `useQuery` result: `recent-activity-widget`, `announcement-board`, `quick-notes`, `pending-approvals-widget`, `employee-approval-status-widget`, `employee-task-progress-widget`, `team-attendance-widget`, `upcoming-holidays-widget`, `metric-widget`.
- **Every `select` function** in a `useQuery`: must never throw — return `[]` on unexpected shape.
- **Every `setQueryData(old => ...)` callback**: guard `old` — `return old ? { ...old, data: (old.data ?? []).map(...) } : old`.
- **Acceptance:** zero `TypeError: X.find/map/length is not a function` or `Cannot read properties of undefined` in the console.

### 0.3 Guard ALL date-fns calls (RangeError: Invalid time value)
- **Create/verify** `safeFormat(ts, fmt)` and `safeFromNow(ts)` in `apps/web/src/lib/format.ts`.
- **Route through them every** `format(new Date(...))`, `formatDistanceToNow(...)`, `formatDistance(...)` call that takes an API-sourced timestamp.
- **Files:** `announcement-board.tsx`, `hr-activity-feed-widget.tsx`, `employee-approval-status-widget.tsx`, `employee-task-progress-widget.tsx`, `command-palette.tsx`, `notifications-bell.tsx`, `today-summary-card.tsx`, `attendance-history-calendar.tsx`, `leave-history-table.tsx`, `time-clock-widget.tsx`, all table date columns.
- **Acceptance:** zero `RangeError: Invalid time value` in the console.

### 0.4 Remove the auth-redirect bubble (login stuck after "Login successful")
- **File:** `apps/web/src/app/(auth)/layout.tsx:32`.
- **Bug:** when `token && user` are hydrated from localStorage, the layout replaces `{children}` with a bouncing-dots loader + `router.replace('/dashboard')`. If the dashboard is slow/broken, the user is stuck on the bubble.
- **Also:** `login/page.tsx` shows "Login successful" toast but doesn't navigate — the redirect from `(auth)/layout.tsx` is supposed to fire but may not because the layout condition checks a stale state.
- **Fix:**
  1. In `login/page.tsx`, after `setAuth(...)`, **immediately** `router.push(targetRoute)` (not `router.replace`) where `targetRoute` = `!result.onboarded ? '/onboarding' : result.user?.roles?.length > 1 ? '/role-select' : '/dashboard'`. Don't rely on the layout's redirect.
  2. In `(auth)/layout.tsx`, render `{children}` (the login form) **always**. Do the redirect as a fire-and-forget `router.replace` in a `useEffect` — but don't replace children with a loader. The login form should remain visible and interactive until the router swaps the page.
  3. Ensure the `router.push` uses the correct Next.js App Router method. After `setAuth`, the Zustand store updates synchronously → the `router.push` should fire immediately.
- **Acceptance:** after clicking Sign In with valid credentials, the user is **automatically** navigated to their dashboard (or role-select/onboarding) within 1 second — no manual refresh needed.

### 0.5 Ensure the dashboard loads after navigation
- **File:** `apps/web/src/app/dashboard/page.tsx`.
- The dashboard reads `useDashboardInit()` (a `useQuery` for `/dashboard/init`). If this query is still loading, the page shows a skeleton. If it errors, widgets show Retry.
- **Fix:** ensure the query is `enabled: !!token` (not firing before auth). Add a **page-level loading state** (not just widget-level) so the user sees "Loading dashboard..." not a blank page. Add an **error boundary** with a Retry button at the page level.
- **Acceptance:** after login, the dashboard loads within 2 seconds warm; shows skeleton while loading, not a blank screen; recovers automatically if the API is briefly slow.

---

## MODULE 1 — AUTHENTICATION & SESSION

### 1.1 Login flow
- [x] Login accepts email **or** employee ID + password.
- [x] Password show/hide toggle works.
- [x] Loading state on the Sign In button while submitting.
- [x] Invalid credentials → clear inline error, form retains values.
- [x] **Successful login → automatic redirect** to the correct dashboard/role-select/onboarding (fix 0.4).
- [x] No stuck loading after "Login successful".

### 1.2 Session persistence
- [x] Token stored in Zustand `persist` (localStorage `g4k-auth`).
- [x] On refresh, `auth-guard.tsx` silently restores session via `/auth/refresh` (sends `X-Refresh-Token` header).
- [x] If refresh fails → redirect to `/login`.
- [x] If refresh succeeds → stay on the current page (no redirect loop).

### 1.3 Role selection
- [x] Multi-role users see role-select screen after login.
- [x] Selecting a role calls `/auth/role-select` → new scoped token → redirect to dashboard.
- [x] Single-role users go straight to dashboard.

### 1.4 Logout
- [x] Clears token, refresh token, cookies.
- [x] Redirects to `/login`.
- [x] Works from any page (header dropdown + sidebar collapsed).

### 1.5 Route protection
- [x] `/dashboard/*` routes require a valid token (middleware.ts checks `g4k_token` cookie).
- [x] Auth routes (`/login`, `/forgot-password`, etc.) redirect to dashboard if already logged in.
- [x] No route accessible without auth that should require it.

---

## MODULE 2 — DASHBOARD

### 2.1 Dashboard per role
- [x] **Admin:** company-wide summary widgets (total employees, active projects, today's attendance summary, pending approvals, recent activity, quick task). **No Time Clock widget** (admins don't clock in/out).
- [x] **HR:** team-level widgets (team attendance, pending leave, pending submissions, team activity, quick task).
- [x] **Employee:** personal widgets (time clock, active projects, pending tasks, task progress, approval status, announcements).
- [x] Role determined by `initData?.role` (from `/dashboard/init`), not a default.

### 2.2 Widget loading/error states
- [x] Every widget has: skeleton while loading, **isolated error + Retry** on failure (not blank), meaningful empty state.
- [x] One failed widget does NOT crash sibling widgets.
- [x] The shared `useDashboardInit()` query is single — all widgets select from it.

### 2.3 Dashboard greeting
- [x] Time-based greeting (Good morning/afternoon/evening/night).
- [x] **No "Role: Employee" badge** (removed entirely).

---

## MODULE 3 — ATTENDANCE (core daily workflow)

### 3.1 Time Clock widget (HR + Employee only; NOT Admin)
- ✅ **Role boundary:** Admin dashboard does NOT show the Time Clock widget. HR + Employee see it.
- ✅ Clock In / Start Break / End Break / Clock Out buttons work (real API calls).
- ✅ Loading state on each button while submitting (disable + spinner).
- ✅ **Never shows "Connection Error / Retry" when the backend is functional** — if the `/dashboard/init` query loads `attendance_today`, the widget shows the correct state (active/break/completed).
- ✅ Live timer (HH:MM:SS) counts up while active; shows total worked today.
- ✅ Timer persists across page navigation (Zustand `timer-store` with `persist`).
- ✅ Timer turns amber when overtime threshold exceeded.
- ✅ "Continue Shift" button after clock-out (calls `clock_in` again; `reconcileDay` must count the second segment).
- ✅ **Fix:** remove the `break` on first clock_out in `AttendanceService::reconcileDay` (line ~86-88) so continued-shift time is counted.

### 3.2 Today's Summary
- ✅ Shows **real calculated data** from `/dashboard/init` → `attendance_today`:
  - Clock-in time (real, not placeholder).
  - Break duration (real total, not 0:00 placeholder).
  - Clock-out time (real or "—" if not yet clocked out).
  - Total worked (live timer, not dummy).
  - Overtime indicator (amber when > standard hours).
  - Late badge (if clocked in after shift start + grace).
- ✅ If no attendance data for today: show "You haven't clocked in yet" empty state (not dummy zeros).

### 3.3 Recent Shift Log
- ✅ Shows **real shift records** from `/attendance/me/history` — actual dates with real clock-in/out/break/total/overtime data.
- ✅ **Not placeholder/mock data** — if no history exists, show "No attendance records yet."
- ✅ Compact, responsive layout (doesn't overflow the page).
- ✅ Each row clickable → day detail dialog (clock-in, breaks, clock-out, total, projects, tasks).
- ✅ Calendar heatmap view with distinct colors per status (present/late/overtime/leave/absent).

### 3.4 Clock-in 422 fix
- ✅ Backend: make repeat `clock_in` idempotent (`AttendanceService::recordEvent` — if already on open shift, return current day instead of throwing ValidationException).
- ✅ Frontend: disable punch button while in-flight; reconcile local state if server already has an open shift.

### 3.5 Attendance pages
- ✅ `/dashboard/attendance` (self): time clock + today summary + recent shift log.
- ✅ HR team attendance (`/dashboard/org/attendance`): every employee today, filter present/absent/late, per-employee detail.
- ✅ Admin attendance (`/dashboard/admin/attendance`): company-wide overview, calendar, analytics, open shifts.
- ✅ Manual correction works (add/edit/remove event, audit logged).
- ✅ Export honors filters (date range, department, person).

---

## MODULE 4 — LEAVE / TIME OFF

### 4.1 Request leave
- ✅ Date selection: themed Calendar (future-only — no past dates, no today).
- ✅ Leave type selection (casual/sick/earned/unpaid).
- ✅ Reason (required, validated).
- ✅ Submit → routes to correct approver (employee→HR, HR→admin).
- ✅ Success toast + redirect to leave history.

### 4.2 Leave history
- ✅ Shows **real** leave requests with status (Pending/Approved/Rejected).
- ✅ Responsive table; no duplicate filter bars.
- ✅ Status badge colors correct (pending=amber, approved=green, rejected=red).
- ✅ Empty state: "No leave requests yet."

### 4.3 Leave approvals (HR/Admin)
- ✅ Pending approvals list shows **real** pending requests.
- ✅ Approve button → `POST /approvals/{id}/decision` → 200 (not 500).
- ✅ Reject button → reason dialog → reject.
- ✅ After action: list updates, cache busted, status changed.
- ✅ Filter by status (all/pending/approved/rejected) + search.
- ✅ Export works (correct URL + auth token).

### 4.4 Holidays
- ✅ Holiday calendar shows **real** holidays from `/holidays`.
- ✅ Admin can CRUD holidays.
- ✅ Upcoming holidays widget on dashboard shows real upcoming holidays (not placeholder).
- ✅ Holiday data integrated with attendance (holidays skipped in shift reminders, shown on calendar).

---

## MODULE 5 — EMPLOYEE / ORGANISATION MANAGEMENT

### 5.1 Employee list (`/dashboard/org/users`)
- ✅ **Fix `Cannot read properties of undefined (reading 'length')`** — the users data from `/users` must be guarded: `const usersList = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);`
- ✅ **Fix "No employees found" when employees exist** — ensure the data path is correct (the response shape may be `{ data: { data: [...] } }` if double-wrapped).
- ✅ Table loads, paginates, searches, filters by role/status/department.
- ✅ Create/edit user dialogs work (all fields: name, email, employee ID, department, team, designation, roles).
- ✅ Deactivate/delete/reset-password/activity-log actions work.
- ✅ Restore soft-deleted users (UI button exists).

### 5.2 User detail (`/dashboard/org/users/[id]`)
- ✅ **Fix breadcrumb** — must show the correct hierarchy (e.g., "Dashboard > Employee Management > {User Name}", not "org > users").
- ✅ Tabs: Personal Info (editable), Attendance (real history, not empty), Leave (real history), Projects & Tasks, Activity Log.
- ✅ **Fix attendance tab showing empty** — read `historyData?.data` not `historyData?.days`.
- ✅ Action buttons: Edit, Reset Password, Activate/Deactivate, Delete, Send Message, Restore.

### 5.3 Departments
- ✅ Create/edit/archive/delete.
- ✅ Assign HR(s) to department.
- ✅ Assign employees to department.
- ✅ Member list (HR + employees) with add/remove.

### 5.4 Designations
- ✅ Full CRUD.

### 5.5 Directory
- ✅ Search by name/department/designation.
- ✅ Grid/list toggle.
- ✅ Card: photo, name, designation, department, email, phone (if visible).
- ✅ Click card → public profile sheet → Send Message (opens DM).
- ✅ No `Cannot read properties of undefined` crash.

### 5.6 Breadcrumbs
- ✅ Every page has a correct breadcrumb reflecting its actual hierarchy.
- ✅ Active state on the current route.
- ✅ Back navigation works (browser back + breadcrumb click).
- ✅ Deep-link: pasting a URL works (route protection + data loading).

---

## MODULE 6 — COMMUNICATION / CHAT

### 6.1 Fix "Something went wrong"
- ✅ **Root cause:** likely the `Folder` missing import or a shape-mismatch crash in the chat components, OR a missing capability.
- ✅ After Group 0 fixes, verify chat loads.
- ✅ If chat still crashes: check `chat/message-list.tsx`, `conversation-list.tsx`, `message-composer.tsx` for unguarded data access.

### 6.2 Chat workflow
- ✅ Conversation list loads (DMs + global).
- ✅ Messages send and appear (optimistic update or refetch).
- ✅ Global chat receives task-completion notifications.
- ✅ Direct messages work (from directory "Send Message").

---

## MODULE 7 — NOTIFICATIONS

### 7.1 Real notifications (not placeholder)
- ✅ Notifications generated from **real system events**: leave decision, task assignment, attendance reminder, announcement, shift-start reminder.
- ✅ Notification bell shows **real** unread count.
- ✅ Notification list shows real data (title, body, type, timestamp, link).
- ✅ Mark as read / mark all as read works.
- ✅ Clicking a notification navigates to the relevant page.
- ✅ Notifications respect role/permissions (only the correct user sees their notifications).
- ✅ **No mock/random notification data.**

### 7.2 Notification bell
- ✅ Opens without crashing (fix the `Slot failed` if it regressed).
- ✅ Tooltip shows unread count.
- ✅ Modal uses shared Dialog (not custom overlay).

---

## MODULE 8 — ANALYTICS / TRENDS

### 8.1 Real metrics (not random data)
- ✅ Admin/HR analytics graphs use **real** attendance/leave data from `/attendance/admin/graph` or `/attendance/hr/graph`.
- ✅ Weekly/monthly toggle works.
- ✅ Graphs show present/late/absent counts per day/week.
- ✅ **No random/demo data** — if no data exists for the period, show "No data for this period."
- ✅ Per-employee trends graph (HR).

### 8.2 Fix "Invalid time value" in attendance views
- ✅ All date formatting in attendance tables/graphs guarded via `safeFormat`/`safeFromNow`.

---

## MODULE 9 — SETTINGS & PROFILE

### 9.1 Consolidate settings (remove unnecessary)
- ✅ **Keep:** Company profile (name, logo), Work schedules (standard hours), Holidays, Password policy, Session rules, SMTP configuration (if required).
- ✅ **Remove/consolidate:** unnecessary settings screens that don't serve the product workflow. Review each tab and ask "does this configuration affect a real feature?"
- ✅ Company Information: keep name + logo. Remove redundant fields (timezone locked to Asia/Kolkata is fine).

### 9.2 SMTP settings
- ✅ If part of the requirements: SMTP config (host, port, encryption, username, password) stored in DB settings.
- ✅ Connected to the email workflow (forgot-password sends via configured SMTP).
- ✅ If SMTP not configured: forgot-password shows the correct toast ("Email not configured yet. Setup email from Admin Settings."), does NOT attempt to send.
- ✅ Test email button works.

### 9.3 Profile management
- ✅ View own profile (photo, name, phone, designation, department, role).
- ✅ Edit name, phone, avatar.
- ✅ Change password (current + new + confirm; wrapped in `<form>`; autocomplete attributes).
- ✅ Avatar upload works (fix the 500 — check Supabase disk config + credentials on Cloud Run).
- ✅ Device sessions: list logged-in devices, revoke any.
- ✅ Logout current device.

### 9.4 Avatar upload 500 fix
- ✅ Ensure `FILESYSTEM_DISK=s3` on Cloud Run.
- ✅ Ensure AWS_* secrets are set.
- ✅ Ensure `supabase` disk defined in `config/filesystems.php`.
- ✅ Check Cloud Logging for the actual PHP exception.

---

## MODULE 10 — DATE COMPONENTS (global fix)

### 10.1 Themed Calendar everywhere
- ✅ Replace ALL native `<input type="date">` with the themed `Calendar` (Popover + react-day-picker).
- ✅ **Date format consistency:** display as `DD-MM-YYYY` (or the app's chosen format) everywhere.
- ✅ **Future-only validation** where required (leave requests).
- ✅ **Timezone:** all dates stored/returned as UTC; displayed in the user's timezone. Ensure `APP_TIMEZONE=UTC` on the backend; the frontend formats with the user's locale.
- ✅ **No `RangeError: Invalid time value`** anywhere — every date-fns call guarded.

### 10.2 FilterBar date-range
- ✅ Fix the date-range chip bug (reads `.start/.end` but onChange stores `{from,to}`).
- ✅ Date-range chips show correctly and are removable.

---

## MODULE 11 — STATES & UX QUALITY

### 11.1 Every page must have
- ✅ **Loading state:** skeleton or spinner (not blank page).
- ✅ **Error state:** isolated error + Retry button (not "Something went wrong" full-screen).
- ✅ **Empty state:** meaningful message + illustration + CTA (not bare "No results").
- ✅ **Disabled state:** buttons disabled while submitting.
- ✅ **Permission-denied state:** if a user lacks access, show a clear "You don't have access" message (not a crash/redirect loop).

### 11.2 No manual refresh needed
- ✅ Every workflow completes without requiring a browser refresh:
  - Login → auto-redirect.
  - Form submit → data updates (React Query invalidation).
  - Action (approve/reject/clock-in) → list updates immediately.
  - Navigation → page loads data on mount.

### 11.3 No mock/placeholder/demo data
- ✅ Remove ALL hardcoded mock arrays, demo data, random values presented as real.
- ✅ If no data exists: show the proper empty state.
- ✅ If the API returns data: display it. If the API fails: show error + retry.

### 11.4 Responsive
- ✅ Every page works at 360 / 414 / 768 / 1024 / 1280 / 1536 px.
- ✅ No horizontal overflow, no overlapping components, no clipped content.
- ✅ Sidebar collapses on mobile; bottom nav works.
- ✅ Tables scroll horizontally on mobile.

---

## MODULE 12 — CLEANUP

### 12.1 ✅ Remove duplicate `value="all"` in FilterBar selects (13 sites)
### 12.2 ✅ Remove dead endpoints (`/companies`, `/auth/profile` dup, `/timer/logs`, etc.)
### 12.3 ✅ Complete or revert the Font Awesome icon migration (no half-migrated state)
### 12.4 ✅ Replace native controls with themed primitives (~35 sites)
### 12.5 ✅ Token adoption (replace `bg-white` → `bg-surface`, `shadow-sm` → `shadow-e1`)
### 12.6 ✅ Delete superseded planning docs (after the app works)

---

## VERIFICATION MATRIX (do not call "done" until every row passes for every role)

| Workflow | Admin | HR | Employee |
|---|---|---|---|
| Login → auto-redirect to dashboard | ✅ | ✅ | ✅ |
| Dashboard renders (no freeze, no console errors) | ✅ | ✅ | ✅ |
| Nav correct per role (no 403 on open) | ✅ | ✅ | ✅ |
| Time Clock widget (role-correct: NO for admin, YES for HR/emp) | — | ✅ | ✅ |
| Clock in/break/out/continue works | — | ✅ | ✅ |
| Today's Summary shows real data | — | ✅ | ✅ |
| Recent Shift Log shows real records | — | ✅ | ✅ |
| Leave request (future dates only) → routes correctly | ✅ | ✅ | ✅ |
| Leave history (real, correct status) | ✅ | ✅ | ✅ |
| Leave approvals (approve/reject, 200) | ✅ | ✅ | — |
| Holidays display (real data) | ✅ | ✅ | ✅ |
| Employee list loads (no crash) | ✅ | ✅ | — |
| User detail (all tabs, real data) | ✅ | ✅ | — |
| Departments CRUD + assign | ✅ | — | — |
| Directory (search, card, Send Message) | ✅ | ✅ | ✅ |
| Chat loads (no "Something went wrong") | ✅ | ✅ | ✅ |
| Notifications (real, bell works, mark-read) | ✅ | ✅ | ✅ |
| Analytics (real data, not random) | ✅ | ✅ | — |
| Settings (consolidated, functional) | ✅ | — | — |
| Profile (view/edit/avatar/devices) | ✅ | ✅ | ✅ |
| Breadcrumbs correct | ✅ | ✅ | ✅ |
| No stuck loading on any page | ✅ | ✅ | ✅ |
| No manual refresh needed | ✅ | ✅ | ✅ |
| Responsive at all breakpoints | ✅ | ✅ | ✅ |
| No console errors | ✅ | ✅ | ✅ |

---

## IMPLEMENTATION ORDER

1. **Module 0** (unfreeze) — fix missing imports + guard all data access + fix login redirect. **Deploy. App unfreezes.**
2. **Module 1** (auth) — verify login/session/role-select/route-protection.
3. **Module 2** (dashboard) — fix role-based widgets, remove Role badge, add error states.
4. **Module 3** (attendance) — fix Time Clock role boundary, Today's Summary, Recent Shift Log, clock-in 422.
5. **Module 4** (leave) — fix request/history/approvals/holidays.
6. **Module 5** (employee/org) — fix the `length` crash, breadcrumb, data loading.
7. **Module 6** (chat) — fix "Something went wrong."
8. **Module 7** (notifications) — ensure real events.
9. **Module 8** (analytics) — ensure real data.
10. **Module 9** (settings/profile) — consolidate, fix avatar 500.
11. **Module 10** (dates) — global date-component fix.
12. **Module 11** (states/UX) — loading/empty/error everywhere + remove mock data.
13. **Module 12** (cleanup) — duplicates, dead endpoints, tokens.
14. **Verification matrix** — test every row for every role on the live URL.

> **The bottom line:** Module 0 unfreezes the app (5 surgical edits). Modules 1–12 make every workflow
> functional. The verification matrix proves it. **Implement Module 0 first, deploy, verify the dashboard
> renders — then proceed module by module.**
