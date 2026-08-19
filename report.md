# Frontend Production Audit Report — Games4Kings Workplace OS

**Audit date:** 2026-08-18
**Method:** Code-first, zero-trust. Every page, route, component, hook, store, API call, backend controller, migration, and workflow was inspected at source level. Cross-checks: frontend↔backend endpoint reconciliation, capability matrix vs UI gating, build/test/typecheck/lint runs, seeder/database reality. No screenshots or visual audits were used.

**Scope:** `apps/web` (Next.js 16, ~150 source files), `apps/api` (Laravel, 33 controllers, 78 migrations), `packages/ui`, deployment configs (Vercel, Cloud Run, CI).

---

## 1. TL;DR

The application is **architecturally sound and mostly complete**: all three role dashboards, attendance (self/HR/admin + corrections), leave (request→approve), projects and tasks (with QA-gated review pipelines), chat with realtime + offline fallback, directory/org management, reports with an async export pipeline, a 12-tab settings console, PWA offline mode, and a capability-based RBAC enforced server-side. Builds, typecheck, and tests all pass; CI is meaningful (typecheck+tests+build+bundle budget+OpenAPI lint+pgsql matrix).

However, this audit found **11 P0 defects that break user-facing workflows today** — the most severe being a **deleted user-management page still linked from five places (404)**, an **audit log table that can never display data**, a **fatal 500 on every attendance export**, a **500 on project submit/review**, and **HR being shown full department/designation admin UI that the backend always rejects with 403**. Beyond the P0s there are ~20 P1 role-access/contract mismatches, ~15 P2 missing-UI-for-backend-feature gaps, and a large tail of dead code, duplicated implementations, and UX inconsistencies (filters without "All", pagination not resetting on filter change, etc.).

**Root pattern behind most findings:** the frontend was consolidated (users→directory tabs, admin attendance→org/attendance, leave→attendance tab) without cleaning up old routes, links, middleware entries, or capability gates — leaving dangling 404s and stale permission checks. A second pattern is frontend/backend capability *vocabulary drift* (UI gating on capabilities that don't exist or that the role doesn't hold).

---

## 2. Verification Baseline (all run during this audit)

| Check | Result |
|---|---|
| `tsc --noEmit` (web) | ✅ 0 errors |
| `vitest run` (web) | ✅ 35 passed, 2 skipped (perf tests), 9 files |
| `next build` (web, Turbopack) | ✅ compiles, 28 routes prerendered |
| `eslint src` | ⚠️ 735 errors / 363 warnings (almost all `no-explicit-any`) |
| `pnpm lint` script | ❌ broken — `next lint` no longer exists in Next 16 (treats `lint` as a directory) |
| CI (`.github/workflows/ci.yml`) | ✅ covers typecheck/tests/build/bundle/OpenAPI/pgsql; **does not run eslint** |
| Middleware deprecation | ⚠️ Next 16 warns `middleware` convention deprecated → `proxy` |

---

## 3. System Snapshot

- **Frontend:** Next.js 16 App Router, React 19, TanStack Query/Table/Virtual, zustand (persist), react-hook-form + zod, ECharts, dnd-kit, frappe-gantt, laravel-echo/pusher-js, react-grid-layout, sonner. Deployed on Vercel.
- **Backend:** Laravel + Sanctum (15-min access token + 7-day HttpOnly refresh cookie), PostgreSQL (Supabase, RLS enabled at table level), S3-compatible storage (Supabase), Pusher WebSockets, database queue + scheduler (supervised in Cloud Run `start-worker.sh`). 3 roles, 40+ capabilities, 62 tables.
- **Auth chain:** login → (must_change_password → /change-password) → (onboarding) → (multi-role → /role-select) → dashboard; silent single-flight token refresh on 401; forced-password/onboarding 403 middlewares with dedicated payload flags the client understands.
- **Realtime:** functional when `NEXT_PUBLIC_PUSHER_*` env vars are present; every consumer (chat 15s, notifications 30s, attendance 60s) has a polling fallback.

---

## 4. P0 — Broken in production (users hit these today)

### P0-1. User-management page deleted; five entry points still link to it → 404
`apps/web/src/app/dashboard/org/users/` has only `loading.tsx` + `error.tsx` — **no `page.tsx`** (confirmed by the build route manifest). The real employee list lives at `/dashboard/directory?tab=management`. Still pointing at the dead route:
- `app/dashboard/page.tsx:86` — super_admin dashboard "Total Employees" widget
- `components/app-shell/command-palette.tsx:216` — "User Accounts Management" command
- `command-palette.tsx:220,224` — "Departments & Teams" / "Designations Master" (also wrong tab names — those tabs exist on `/dashboard/directory`, not `org/users`)
- `app/dashboard/org/page.tsx` — `/dashboard/org` redirects to the dead page (double-dead)
- `components/app-shell/breadcrumb.tsx:111` — breadcrumb maps `org` → `org/users`
- `middleware.ts:5` — capability rule for the dead route

**Impact:** the primary "manage users" navigation for admins 404s. **Fix:** add `org/users/page.tsx` redirecting to `/dashboard/directory?tab=management` (and repoint the palette's departments/designations commands to `/dashboard/org/departments|designations` or the directory tabs).

### P0-2. `/dashboard/admin/attendance` + `/dashboard/admin/reports` have no pages → 404 links
Both folders contain only `error.tsx`/`loading.tsx`; `admin/reports` is fully orphaned. Live links to the dead attendance route:
- `command-palette.tsx:192` ("Admin Attendance Overview")
- `components/dashboard/admin-today-attendance-widget.tsx:31` — the **entire super_admin dashboard widget is a link** to it
- `app/dashboard/org/users/[id]/page.tsx:253` — "view attendance" on the employee record

**Fix:** redirect `admin/attendance` → `/dashboard/org/attendance`, `admin/reports` → `/dashboard/reports`; repoint the three links; delete the orphaned error/loading files or keep with the redirect page.

### P0-3. Audit log table renders permanently empty + export always 405
`components/settings/audit-log-table.tsx`:
- **Empty table:** unwrap reads `logsData?.data?.data` / `logsData?.data?.last_page` (lines 55–56), but `AuditLogController::index` returns a top-level Laravel paginator (`{data:[...], last_page}` — verified in controller). `logs` is always `[]`, `totalPages` always 1. The audit feature *displays nothing, ever*.
- **Export broken:** calls `POST /audit-logs/export` (line 67) but the route is **GET** (api.php:291) → 405 on every attempt.
- Subject-column deep links point at non-existent destinations: `/dashboard/users`, `?tab=departments` (no such settings tab), `?tab=schedules` (actual value `schedule`), `?tab=qa` (doesn't exist).
- IP column fabricates `127.0.0.1` when the real IP is missing.
- Action filter is exact-match server-side (`where('action', ...)`) but the UI presents it as a free-text search ("e.g. login, update") — partial text silently returns zero rows.

### P0-4. Attendance export is a guaranteed 500 (backend fatal)
`AttendanceController::export` calls `$this->userHasManage($request)` (line 906) — **the method does not exist on that class** (it exists only on `ReportController` and `ProjectController`). Every HR/admin "Export" on attendance tables returns 500 before the job is even queued. (The frontend `useExport` correctly supports the async `{job_id}` contract — the backend endpoint itself fatals.)

### P0-5. Project submit/review 500s on PostgreSQL
`ProjectController` lines 236 & 276: `User::whereIn('role', ['hr','super_admin'])` — the `users` table has **no `role` column** (roles live in `role_assignments`; verified against migrations). On pgsql this is an SQL error → 500 on project **submit for review** and on **review**, i.e. the whole project approval pipeline dies at the notification step. (Tests run on sqlite where `whereIn` on a missing column… fails differently/quietly — invisible to CI.)

### P0-6. HR department & designation management is 100% rejected by the backend
`components/directory/departments-tab.tsx:79` and `designations-tab.tsx:77` gate all manage UI on `users.hr.manage || users.employee.manage` (which HR holds). The backend requires `departments.manage` / `designations.manage` — **granted only to super_admin**. Result: HR sees Add/Edit/Archive/Delete/Export buttons and every action returns 403. Additionally:
- `departments-tab.tsx` fires `GET /users` unconditionally for every viewer (including plain employees on the Directory → Departments tab) → 403 console noise + empty pickers.
- The "Add HR to department" picker filters `allUsers.filter(u => u.roles?.includes('hr'))` — `/users` serializes `role_assignments` (objects), not a `roles` array → **the picker is always empty** even for super_admin.

### P0-7. Group chat creation 403s for HR (unseeded capability)
Backend `ChatController::createGroup` re-checks `chat.group`, which **is not seeded for any role** (verified in seeder + `CapabilityMatrix` fallback). The frontend gates the "Create Group" dialog on `chat.manage` (hr + admin). HR can open the dialog, fill it, submit → 403. Only super_admin (wildcard) can create groups.

### P0-8. Admin reports view gated on a capability that doesn't exist
`app/dashboard/reports/page.tsx:11`: `hasCapability(capabilities, "admin.view-reports")` — **`admin.view-reports` is not a real capability** (backend has `reports.view` / `reports.manage`). Only super_admin's wildcard ever passes, so `AdminReportsView` (attendance/leave summaries, saved views) is dead UI for every other legitimate report manager. Should be `reports.manage`.

### P0-9. Employee-facing company card 403s
`profile-general-tab.tsx` and the Settings "Company Profile" tab fetch `GET /company-profile`, which sits inside the `settings.manage` route group (api.php:279). Any non-super_admin reaching these UIs gets a 403 and an empty/broken card. The backend's ungated `GET /companies` endpoint exists precisely for this and is **never called by the frontend**.

### P0-10. "View All" on Upcoming Holidays bounces employees to an "unauthorized" toast
`upcoming-holidays-widget.tsx:42` links to `/dashboard/org/leave`, which middleware gates with `leave.approve-employee` (employees don't hold it) → redirect to `/dashboard?error=unauthorized` + error toast. Wrong target (it redirects to the approvals tab, not holidays) and wrong audience (the widget renders for employees). Should link to `/dashboard/attendance?tab=leave&sub=holidays`.

### P0-11. Demo seed/purge completion notifications crash (backend TypeError)
`SeedDemoDataJob` / `PurgeDemoDataJob` call `NotificationService::sendGlobalNotification($user, $body, $link, "high")` — the 4th parameter is typed `?array`, receiving the string `"high"` → `TypeError` after the seed/purge work completes. The data operations themselves succeed, but the "demo data ready" notification never arrives and the job may be marked failed in the System Jobs tab.

---

## 5. P1 — Broken interactions, contract mismatches, role-access defects

### Phantom endpoints / doomed requests
1. **`GET /attendance/admin/analytics`** (`admin-attendance-analytics.tsx:24`) and **`GET /attendance/hr/analytics`** (`hr-attendance-analytics.tsx:25`) **do not exist** in the backend. Both components try them first and fall back to `overview`/`hr/today` with `per_page=1000`. Cost: a 404 round-trip on every attendance console load, console noise, and stats silently wrong beyond 1,000 records. Either implement the endpoints or delete the phantom calls.
2. `/users?limit=50` (quick-task-widget), `/departments?limit=100`, `/designations?limit=100` (directory-tab, admin tables, profile) — **`limit` is not a backend parameter** (only `per_page`, whitelisted 20/50/100). Every such dropdown silently shows only the first 20 rows.

### Query-string & data-handling bugs
3. `admin-attendance-table.tsx:95` interpolates `search` into the URL **unencoded** — `&`, `#`, or spaces in the search box corrupt the query string.
4. `hr-attendance-table.tsx` labels `unapproved_break_seconds` as "Total Break" and `total_seconds + break_seconds` as "Total Working Hours" — inverted/unclear semantics vs. the personal view.
5. `app/dashboard/layout.tsx:124` prefetches `/dashboard/init` with `.then(r => r.data)` — wrong unwrap for this endpoint; poisons the query cache with `undefined`.
6. Leave-tab page resets only on search change — switching type/status filters keeps the current page (can request page 3 of a 1-page result). Same pattern in approvals-tab (all filters), projects-tab (search/status/sort via URL `p_page`), and tasks list (search used **raw, no debounce**, unlike everywhere else).
7. **One-way filter doors:** approvals-tab status select and notifications-tab read-status select have **no "All" option** (default is "pending"/"all" but once changed you cannot get back without editing the URL). Department selects in all three attendance tables likewise lack an "All departments" entry (the default `all` isn't in the list).
8. **QA field-key mismatch:** `qa-form-builder.tsx` saves fields as `field_type`; `qa-field-renderer.tsx` switches on `field.type`. Unless the backend renames keys, every rendered QA field falls through to a plain text input — checkbox/slider/select controls never render.
9. **Holiday edit dialog renders Description + Recurring twice** (`holiday-calendar.tsx` renders `HolidayFormFields` and then duplicates two of its fields below); dead `type === 'event'` branch remains while the widget still renders event metadata (start_time/location) that no UI can create anymore.
10. **HR activity feed icons never render** — `hr-activity-feed-widget.tsx:129` uses `<act.icon>` where `act.icon` is a *string* (should be `<AppIcon name={act.icon}/>`);
`act.user.avatar_url` referenced but never set.
11. **Project timer persistence is dead:** `timer-store` persists to localStorage (`g4k-timer`, `skipHydration`) but **nothing ever rehydrates it** — a running timer resets on page reload despite the record surviving in storage.
12. **Task pin highlight lost:** pinned tasks use `/dashboard/tasks?highlight={id}`, which redirects to `/dashboard/projects?tab=tasks` **dropping the param** — pins never highlight their task.
13. **Gantt drag is a silent no-op:** `task-gantt.tsx` wires `on_date_change` but tasks-tab never passes `onTaskUpdate` — dragging bars does nothing (and the Gantt re-instantiates on every refetch, resetting scroll).
14. `pending-approvals-widget` decision mutation has **no `onError`** — a failed reject (backend requires a reason; the dialog doesn't enforce it client-side) is silently swallowed. Approve/Reject buttons also gate on a fragile string match (`item.route?.includes('tab=approvals')`).
15. **Bulk task operations** (list view) loop with no per-item error handling and no onError toast — mid-loop failures leave partial state silently.
16. **Kanban/Gantt truncate at 100 tasks** (page 1, `per_page=100`, no infinite scroll); tasks with statuses outside the 4 columns (e.g. legacy values) are invisible on the board.
17. `system-jobs-config.tsx:74` `JSON.parse(job.payload)` without try/catch — one malformed payload crashes the whole settings tab.
18. **Chat read-receipt spam:** `message-list.tsx` fires a whole-conversation `POST /read` per visible unread message via IntersectionObserver until the cache catches up.
19. `metrics` widget "hide" (×) is local-only — `dismissedWidgets` in the ui-store has **zero writers**, so the Profile → Preferences "Hidden Widgets / Restore" manager is permanently empty/disabled.
20. `hr-attendance-graph` / `team-member-trends-graph` / admin trends: `date` state is dead — the weekly/monthly window is **always anchored to today**, no date navigation.
21. Approvals/notifications pagination is local `useState` while every sibling tab uses URL state — inconsistent deep-linkability; several raw (non-centralized) query keys (`admin_leave_history`, `attendance_graph`, `tasks-submitted`).
22. **Standard-day default mismatch:** timer-store defaults `28800` (8h) while time-clock/today-summary default `31500` (8h45m) — the pre-load overtime threshold differs by 45 minutes between widgets.
23. Login success path reads top-level `result.onboarded` (exists — OK), but `(auth)/layout.tsx` checks `roles || role_assignments` length while login checks both `> 1` — minor multi-role detection inconsistency.
24. `breadcrumb.tsx` SEGMENT_LABELS missing `directory`, `notifications`, `announcements`; `/dashboard/org` remap targets the dead `org/users` (see P0-1).
25. Offline mutations return `{queued:true}` which **runs component success handlers** — forms reset/close optimistically even though the queued request may later conflict (conflicts are parked in IndexedDB with **no review UI**).

### Role-based access detail (verified against `CapabilityMatrix` + seeder)
26. `/dashboard/org/attendance` middleware requires `hr.view-team-attendance`, but the page itself branches on `admin.view-all-attendance` — an admin-without-HR-capability (nonexistent today, latent tomorrow) is redirected before the page's own logic runs.
27. Middleware gates `/dashboard/org/users` (dead route) with `users.employee.manage`, while the directory management tab uses `users.hr.manage || users.employee.manage` and the user-detail route uses only `users.employee.manage` — three different gates for one workflow.
28. Command palette navigation commands (Users/Departments/Designations/Settings) are **not capability-gated** in the palette — unauthorized users see commands that bounce (defense exists downstream only).
29. Mobile bottom-nav **Chat link is not capability-gated** (desktop nav gates it on `chat.access`).
30. "Send Message" buttons (directory, user detail) shown to everyone without checking `chat.access` (all seeded roles hold it — fragile only).
31. Employee "self-designation" dropdown in Profile lets any employee change their own designation (backend permits under `profile.edit`) — questionable product rule, works as coded.
32. Seeded `employee` role includes `reports.view` but the hard-coded fallback matrix does not — behavior differs between seeded and unseeded environments (employees see Reports nav in prod-seeded envs).
33. Security posture notes: the middleware capability cookie (`g4k_capabilities`) and token mirror (`g4k_token`) are **JS-readable/writable cookies** — route-level gating is cosmetic (API is the real boundary; acceptable but worth documenting). `POST /companies` + `PUT /companies/{id}` have **no capability middleware** — any authenticated user can update the company profile object through the ungated alias (the gated `/company-profile` variants are the ones the UI uses). Admin-approved password-reset links are built from an **undefined `config('app.frontend_url')`** → links point at `http://localhost:3000/...`.

---

## 6. P2 — Backend features with no frontend UI (missed implementations)

| Backend capability | Status in frontend |
|---|---|
| `GET /dashboard/metrics` | Never called (only invalidation references). Dead endpoint; init composite covers it. |
| `GET /companies`, `PUT /companies/{id}` | Never called — would have prevented P0-9. |
| `GET /directory/{id}` (detail) | Unused; UI uses the users endpoint. |
| `POST /directory/{id}/send-message` | Unused; UI starts DMs via `/conversations/dm` instead. |
| `POST /notifications/{id}/mark-unread` | No UI anywhere. |
| `GET /attendance/sync` (bulk offline reconciliation) | Never called — offline engine replays individual punches instead; the bulk endpoint is dead weight. |
| `GET /timer/logs` (time-log history) | No standalone UI (logs only visible inside a single task's sheet). |
| `PUT/DELETE /qa-forms/{id}` | QA form builder is create-only — no edit/delete/list-management UI. |
| `DELETE /saved-views/{id}` | Mutation exists in code but no delete button rendered — saved views can never be removed. |
| `GET /leave-requests/{id}` (show) | Unused (list data suffices). |
| `GET /departments/{id}/teams` | Unused (teams read from the department show response). |
| Scheduled reports / report definitions / dashboard_layouts tables | Fully dead schema — no controller/routes/UI. |
| Task `scope=role` / QA `select` field type / QA per-field options | Data model supports; builder UI doesn't expose. |

---

## 7. Endpoint reconciliation summary

- **Frontend→backend:** every one of the ~90 distinct endpoints called by the frontend maps to a real route **except** the two phantom analytics calls and the bad param shapes listed in P1 (plus the audit-export verb error). The old "empty tables / data.data.data" class of bug is fully remediated — `unwrapPaginator`, `usePaginatedList`, and defensive unwraps handle the three response dialects (offset paginator, cursor paginator, `{data}`-wrapped arrays).
- **Backend→frontend:** ~12 endpoints have no UI consumer (§6). `/attendance/team-today` is referenced only by a **dead component** (`team-attendance-widget.tsx` — never imported).
- **Response dialects to keep in mind for future work:** offset paginator (`data/current_page/last_page`) vs cursor (`next_cursor`) vs bare-wrapped; `403` payload zoo (capability message vs `needs_onboarding` vs `must_change_password` vs plain abort); approval `redo` sets `status=rejected` + `decision=redo` (UI must read `decision`); `/tasks` write route silently strips non-whitelisted fields for plain assignees.

---

## 8. Dead code & artifacts inventory (frontend)

- `components/dashboard/team-attendance-widget.tsx` — dead duplicate of `hr-team-attendance-widget`.
- `components/widgets/feedback-form.tsx` — dead **and broken** (posts `{body}` only; backend requires subject+category; the working form lives in profile-preferences).
- `hooks/use-worker.ts`, `lib/tabs-sync.ts` (0 bytes), `components/web-vitals.tsx` (commented-out body) — dead.
- `components/projects/tasks-tab.tsx.bak` — leftover backup file in the repo.
- `app/dashboard/org/users/{loading,error}.tsx`, `app/dashboard/admin/**/{loading,error}.tsx` — orphaned route files for pages that don't exist.
- `nav-group.tsx:38–53` — hover-prefetch branches for `/dashboard/leave`, `/dashboard/tasks`, `/dashboard/announcements`, `/dashboard/org/leave` — none of these hrefs exist in nav.
- `MetricWidget` `endpoint`/`hasModule`/`isFirstRender`/`prevValueRef`; `SavedReportViews.deleteMutation`; `directory-list` `restoreDraft`/`isMobile`; `layout.tsx` `refetchPins`; `directory-tab` `visFilter` (state without UI); `hr-attendance-table` `userFilter`; `approvals-tab` `pendingCount`; `use-shortcuts` `shortcut-action-new` dispatch (no listener) — all dead.
- `packages/ui` OpenAPI-generated API client (`openapi-ts`, `src/api`) — generated but **never imported** by the app (all calls go through the hand-rolled `api-client`). Either adopt it or drop the generation step.
- Stale comments: "Pins removed" (pins are rendered), "before real Queue is ready" (queue is real), dev leftovers in saved-report-views.
- `VersionGuard` buildId fallback is a hardcoded commit `"1c3b845"`; `NEXT_PUBLIC_BUILD_ID` is never set anywhere → new-version detection only works where `VERCEL_GIT_COMMIT_SHA` exists.

**Backend dead/broken:** `AuthController::profile()` (no route), `TaskCompleted` event has `broadcastOn()` but doesn't implement `ShouldBroadcast` (never reaches clients; its listener can double-post completion messages when `notify_global_chat` was also set inline), `chat.group` capability unseeded (P0-7), `scheduled_reports`/`report_definitions`/`dashboard_layouts` tables unreachable, `qa:provision` command passes nonexistent User attributes, announcements controller checks `scope === 'department'` (not a valid enum value — dead branch; high/urgent always notifies all users).

---

## 9. Duplication inventory

1. **Punch state machine implemented twice** — `time-clock-widget` (full UX with confirms) and `command-palette` punch commands (no confirms). Divergent behavior risk.
2. **Admin vs HR attendance stack** — `admin-attendance-{table,analytics,trends-graph}` are near-clones of the `hr-*` equivalents (plus the dead `team-attendance-widget`).
3. **Response unwrapping hand-rolled in ~10 components** instead of consistently using `usePaginatedList`/`unwrapList`.
4. **Unread-conversation derivation duplicated** in chat-tab sorting and conversation-list.
5. **Avatar upload duplicates `apiFetch`** with a hand-rolled `fetch` (profile-header) — bypasses refresh/offline pipeline.
6. **Offline banner potentially triple:** `OfflineIndicator` (root layout) + `@g4k/ui OfflineBanner` (Providers) + per-widget badges; **service worker registered twice** (offline-indicator + pwa-registry).
7. `useDebounce` hook exists while several components hand-roll their own debounced state.
8. Notifications UI exists in two shapes (bell popup + chat-tab center) with different filter semantics.

---

## 10. UX / consistency / accessibility observations (P3 sample)

- Loading/error/empty states are **good** in most newer surfaces (state-helpers, ContentSkeleton/IsolatedError/MeaningfulEmpty) but missing in: `recent-activity-widget` (no error branch; shows "no activity" while loading), `profile-stats` (zeros while loading/on error), `auto-numbering-config` (silent empty), `work-schedules-config` (no empty state), several settings tabs (load-error only in notifications-config).
- Dialog duplication in holiday edit (P1-9); hardcoded 6-entry timezone list in company settings silently resets non-listed timezones on save.
- Export history shows only the first 3 items with no "view all".
- Dashboard grid: HR layout has `announcements` and `time-clock` colliding at `{x:0,y:6}`; super_admin `recent-activity` overflows the 12-col grid (x:6,w:12).
- Upcoming-holidays widget queries only the **current year** — a January holiday queried in December is invisible.
- A11y basics present (aria-labels, sr-only titles, skip-to-content, focus rings, axe in dev) but un-audited programmatically in CI; mobile keyboard handling in chat via `visualViewport` is thoughtful.
- `middleware` → `proxy` migration warning (Next 16); eslint debt (735 `any` errors) invisible to CI since lint isn't in the pipeline and `pnpm lint` is broken.

---

## 11. Tests & CI assessment

- **Web:** 9 test files / 37 tests (auth flow, timer store, time-clock widget, attendance history calendar, admin attendance table, directory page, layout utils, perf-skipped). Genuinely good coverage of the trickiest state machines; **zero coverage** for leave, chat, projects/tasks, settings, reports.
- **API:** broad feature suite (auth/RBAC/attendance/leave/users/org/schema/OpenAPI-contract/query-count budgets) on sqlite; **pgsql matrix in CI** mitigates but `ilike`-based search and the P0-5 `whereIn('role')` bug classes show sqlite-first blind spots (P0-5 would fail on pgsql CI only if the submit path were tested there — it isn't).
- **Contract safety:** `OpenApiContractTest` verifies route existence vs `openapi.yaml` — but nothing verifies frontend call shapes against either.

---

## 12. Prioritized remediation plan

**Batch 1 — restore broken workflows (P0):**
1. Add redirect pages for `/dashboard/org/users` → `/dashboard/directory?tab=management`, `/dashboard/admin/attendance` → `/dashboard/org/attendance`, `/dashboard/admin/reports` → `/dashboard/reports`; repoint the 8+ inbound links (incl. command palette tab names) or delete the middleware/breadcrumb entries.
2. Fix audit-log unwrap (`usePaginatedList`) + switch export to GET + fix subject links + drop the fake IP.
3. Attendance export: implement `userHasManage` (or inline the check) in `AttendanceController`.
4. Project submit/review: replace `User::whereIn('role',…)` with a `role_assignments` join/whereHas.
5. Demo jobs: pass an array (or drop the 4th arg) to `sendGlobalNotification`.
6. Departments/designations tabs: gate manage UI on `departments.manage`/`designations.manage`; make the users fetch capability-gated; fix the HR picker to read `role_assignments`.
7. Seed `chat.group` for HR (or drop the controller re-check) — decide the product rule.
8. Reports page: `admin.view-reports` → `reports.manage`.
9. Profile/settings company card: switch to `GET /companies` (already ungated).
10. Holidays widget: link employees to `/dashboard/attendance?tab=leave` (holidays sub-tab).

**Batch 2 — contract cleanup:** remove phantom analytics calls (or implement endpoints); replace `limit=` with `per_page=`; URL-encode search; fix QA `field_type`→`type` mapping; fix the layout.tsx prefetch unwrap; add "All" options to one-way filters; reset page on filter change everywhere; debounce task search.

**Batch 3 — dead code & duplication:** delete the inventory in §8; consolidate unwrap helpers; single SW registration/banner; delete `.bak`; fix or delete `feedback-form.tsx`; adopt-or-drop the OpenAPI client.

**Batch 4 — hardening:** add eslint to CI and fix the `pnpm lint` script (Next 16 removed `next lint`); add tests for leave/chat/project review paths; migrate `middleware`→`proxy` when convenient; document the cookie-based middleware as non-security; add `frontend_url` config for reset links; decide the `attendance_days.status='leave'` enum vs CHECK discrepancy (dashboard `leave_today` metric counts a status the pgsql CHECK forbids → always 0).

---

## 13. Verdict

The platform is **functionally broad and well-engineered at its core** — auth/session handling, RBAC enforcement, the attendance state machine, the leave approval chain, the async export pipeline, offline-first punches, and realtime-with-fallback are all genuinely solid designs, and the toolchain is green. The defects are concentrated in **navigation debt from UI consolidation** (404s), a handful of **frontend/backend vocabulary drifts** (capabilities, param names, one fatal controller typo), and **one permanently-empty flagship table** (audit). All P0s are small, surgical fixes — none require architectural change.

*Companion document: `workflow.md` — the complete client-readable workflow guide for every feature implemented in this app.*
