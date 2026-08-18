# Frontend Implementation Plan — Games4Kings Workplace OS

**Revision 1 — 2026-08-16.** Derived from a fresh, code-first, zero-trust production audit of `apps/web` (Next.js 16 App Router, React 19, TanStack Query v5, Zustand, Tailwind 4) against the live backend contract in `apps/api` (Laravel, Sanctum) and `packages/ui`. Every finding was verified by reading source; file:line references are given. No code was changed during the audit.

**Build health at audit time:** `tsc --noEmit` passes. `vitest run` is **broken** — 9 of 10 test files fail to resolve `@g4k/ui/components/badge`, `…/state-helpers`, `…/data-table` deep imports (not in the package `exports` map), and `timer-store` tests crash on `localStorage` (see FE-TEST-01/02). A previous CI/log run masked this via a `| tail` pipe swallowing the exit code.

**How to read this plan:** Work is organised into phases (P0 foundations → P9 polish). Every task has a unique ID `FE-<AREA>-<NN>`; shared/cross-cutting fixes are defined **once** in P0 and referenced by ID from module tasks (no duplicated implementation work). Each task carries: Category, Scope (pages/modules/components), Problem + Root cause, Objective, Dependencies, Backend/contract requirements, State/data requirements, Responsive, UX/interaction, Files, Verification, Regression, Acceptance.

**Category legend:** `BUG` fix · `WIRING` backend-frontend contract correction · `MISSING` unimplemented feature · `CLEANUP` dead/duplicate code removal · `UX` interaction improvement · `REDESIGN` structural UX change · `RESPONSIVE` adaptive layout · `COMPONENT` shared-component upgrade · `A11Y` accessibility · `PERF` performance · `CONSISTENCY` uniformity · `TEST` test infrastructure.

---

## Top critical defects (user-visible breakage today)

1. **FE-AUTH-01** — `must_change_password` users are stranded: no redirect to `/change-password` anywhere; every API call 403s.
2. **FE-ATT-01** — Admin attendance **Overview table and Open Shifts table are always empty** (`data.data.data` read against a flat Laravel paginator).
3. **FE-LEAVE-01** — HR **Team Leave Approvals table is always empty** (same double-`.data` bug on `/leave-requests`).
4. **FE-CHAT-01** — Chat opens the **oldest** 50 messages (backend orders ASC with cursor pagination; frontend treats page 1 as newest). This is the primary "unusable chat" root cause.
5. **FE-ATT-02** — Attendance calendar only ever sees the last 30 days (`meHistory` cursor pagination ignored; no month-scoped fetch API).
6. **FE-CORE-05** — Attendance/leave **exports are broken** everywhere except users/departments/designations: async job endpoints now return JSON `{job_id}` but 4 call sites still do `createObjectURL` on the JSON (and HR table calls the non-existent `/attendance/hr/export`).
7. **FE-ATT-03** — Today's Summary break rows render `Invalid Date` / `NaNm` (`event.time` vs backend `timestamp`).
8. **FE-PROJ-01/02** — QA required-field validation is dead (`is_required` vs `required`), QA field types render as plain text inputs, and the QA-form dropdown in task create is always empty (`qaFormsData.map` on a paginator).
9. **FE-TEST-01/02** — the frontend test suite does not run; nothing is regression-protected.

---

# P0 — Foundations & Cross-Cutting System Fixes (implement once, reuse everywhere)

### FE-CORE-01 · CONSISTENCY/BUG — Single source of truth for navigation & capability strings
- **Scope:** `components/app-shell/nav-group.tsx`, `app/dashboard/layout.tsx` (`navGroups`, mobile bottom nav), `components/app-shell/command-palette.tsx`, `middleware.ts` (PROTECTED map).
- **Problem:** Nav uses phantom capability `admin.view-reports` (`dashboard/layout.tsx:57`) which exists nowhere in the backend (`DatabaseSeeder.php` catalog: `reports.view`, `reports.manage`, …); middleware gates `/dashboard/admin/reports` on `reports.manage`; command palette exposes "User Accounts Management", "Departments", "Designations", "Admin Settings" to **all** users (no capability gating, `command-palette.tsx:206-236`) so employees click into `?error=unauthorized` redirects; mobile bottom nav shows Chat without `chat.access` gating (`dashboard/layout.tsx:438-448`) while desktop nav gates it (`:49`).
- **Root cause:** Nav config, palette entries, and middleware each hand-maintain their own capability strings with no shared registry.
- **Objective:** Create `src/lib/nav-config.ts` exporting a typed nav registry (label, href, icon, capability) consumed by sidebar, mobile bottom nav, command palette, and (for route gating) `middleware.ts`. Fix `admin.view-reports` → `reports.manage`. Palette Navigation group filters by capability from `useCapabilities()`. Mobile bottom nav applies the same capability filters as desktop (chat gated by `chat.access`; add Directory fallback slot when chat hidden).
- **Dependencies:** none. **Backend contract:** none (strings only from `DatabaseSeeder.php` catalog + `routes/api.php` middleware).
- **State/data:** capabilities via `useCapabilities()`; palette shows a loading-safe empty state while caps load (currently `[]` briefly hides items — acceptable; do not render "unauthorized" dead-ends).
- **Responsive:** palette entries unchanged; bottom nav ≤5 items, gate correctly.
- **UX:** employees never see navigation that 403-redirects; HR sees HR items; super_admin sees all.
- **Files:** `src/lib/nav-config.ts` (new), `src/app/dashboard/layout.tsx`, `src/components/app-shell/nav-group.tsx`, `src/components/app-shell/command-palette.tsx`, `src/middleware.ts`.
- **Verification:** every nav item's capability ∈ backend catalog; employee/HR/super_admin renders asserted in component tests. **Regression:** nav still hides items lacking caps; deep links to gated routes still redirect. **Acceptance:** no phantom capability strings remain (`grep -r "admin.view-reports"` empty); palette gated identically to sidebar.

### FE-CORE-02 · CLEANUP — Remove dead shell/prefetch code
- **Scope:** `nav-group.tsx:38-53` (prefetch handlers for `/dashboard/leave`, `/dashboard/org/leave`, `/dashboard/announcements`, `/dashboard/tasks` — none exist in `navGroups`), `hooks/use-shortcuts.ts:30` (`shortcut-action-new` has zero listeners), `providers.tsx:104-114` (`api-error` listener — nothing dispatches it), `hooks/use-worker.ts` (no consumers), `hooks/use-form-errors.ts` (newly added, zero consumers — either adopt in FE-FORM-01 or remove), `dashboard/layout.tsx:112,136` (`refetchPins` / "Pins removed" remnants).
- **Objective:** delete dead branches/listeners; keep `use-form-errors.ts` only if FE-FORM-01 adopts it (decide then; otherwise remove file).
- **Files:** as listed. **Verification:** `grep` shows no references; typecheck+tests pass. **Regression:** Ctrl+B sidebar, Ctrl+/ help, Ctrl+K palette still work. **Acceptance:** no orphan listeners/hooks in shell.

### FE-CORE-03 · COMPONENT — Canonical response unwrapping (`usePaginatedQuery` + `unwrapList`)
- **Scope:** all data tables/lists; `lib/api-client.ts`, `lib/utils.ts` (`asArray`).
- **Problem:** Three components read `data?.data?.data` / `data?.data?.last_page` against flat Laravel paginators → **always-empty tables** (`admin-attendance-table.tsx:97-98`, `admin-open-shifts-table.tsx:64-65`, `attendance/approvals-tab.tsx:67-70,158-161`); others read `data?.meta?.last_page` which never exists on plain paginators (`attendance/leave-tab.tsx:72`); the rest use inconsistent ad-hoc dual-shape handling (`usersPaginated`, `tasks-tab.tsx:236`, `notifications-tab.tsx:83`, `projects-tab.tsx:111`).
- **Root cause:** Laravel returns paginator JSON `{data:[…], last_page, …}` at top level; `apiFetch` wraps only *bare arrays* into `{data}`; no shared unwrapping helper.
- **Objective:** Add `lib/pagination.ts` with `unwrapPaginator(res) → { rows, lastPage, total }` (handles paginator, `{data:{…}}` wrapper, bare array) and a thin `usePaginatedList` hook; refactor every table consumer to it. Standardise query keys to include page/perPage consistently.
- **Dependencies:** none. **Backend contract:** unchanged.
- **State/data:** DataTable props `data/totalPages/onPageChange` fed from the helper.
- **Responsive/UX:** unchanged visuals. **Files:** `lib/pagination.ts` (new) + the 10+ consumers listed above and in module tasks.
- **Verification:** unit tests for the three shapes; component tests assert rows render. **Regression:** pagination controls still reset to page 1 on filter change. **Acceptance:** `grep -rn "data?.data?.data"` returns nothing.

### FE-CORE-04 · COMPONENT — Async export framework (job-based) with toast + history deep link
- **Scope:** `hooks/use-export.ts`, `components/reports/export-history.tsx`, `components/attendance/admin-attendance-table.tsx`, `components/attendance/hr-attendance-table.tsx`, `components/attendance/approvals-tab.tsx`, `components/app-shell/command-palette.tsx` (`handleExport`), `components/reports/report-builder.tsx`.
- **Problem:** Attendance export (`AttendanceController@export` → `{message, job_id}` via queued `GenerateReportJob`), leave export (`LeaveRequestController@export` → same) are consumed as blobs: `createObjectURL(json)` throws (`admin-attendance-table.tsx:120-127`, `approvals-tab.tsx:142-150`, `command-palette.tsx:55-66` expects `res.download_url`). HR table calls **non-existent** `/attendance/hr/export` (`hr-attendance-table.tsx:122`). Export history renders `item.file_path` as a raw href and **does not poll** processing jobs (`export-history.tsx:40,97`).
- **Objective:** One `useExportJob()` hook: POST → toast "Export queued" → optimistic entry in `queryKeys.exportHistory` → poll `/reports/exports` every 5s while any job is `processing` → completed job shows Download (server-issued URL). Refactor all export buttons to it. Fix HR export to `/attendance/export` with HR-visible params.
- **Dependencies:** backend queue must process jobs (known prod issue R-plan; frontend must degrade gracefully — pending jobs show "queued (server busy)" after timeout). **Backend contract:** confirm `exports()` returns `file_path` as full URL or add `download_url`; keep `{job_id}` shape.
- **State/data:** invalidate `queryKeys.exportHistory` on job completion; bell toast via notification `type: 'export'` if backend sends it.
- **Responsive/UX:** history panel linked from every export toast ("View exports").
- **Files:** `hooks/use-export.ts` (rewrite), `components/reports/export-history.tsx`, the four call sites.
- **Verification:** with queue running, xlsx downloads; with queue dead, status stays `processing` with honest UI. **Regression:** departments/designations/users streaming CSV exports (already correct — `streamDownload`) keep working untouched. **Acceptance:** no `createObjectURL` on JSON responses (`grep createObjectURL` only beside verified blob content-types).

### FE-CORE-05 · WIRING — Realtime channel registry & documented degradation
- **Scope:** `hooks/use-reverb.ts`, chat/notifications/attendance/announcement consumers.
- **Problem:** `isReverbAvailable()` silently disables realtime unless `NEXT_PUBLIC_REVERB_APP_KEY`/`PUSHER_APP_KEY` set (prod: dead) — consumers already poll (chat 15s, notifications 30s, admin/HR tables 60s) but: attendance tables subscribe `subscribe("presence-org")` → Echo **public** channel `presence-org` while backend broadcasts presence channels (`use-reverb.ts:112-119` takes `isPrivate` flag; callers pass none) → invalidation-on-event never fires even when realtime is up; admin table's realtime invalidation also uses a **different query key** than its fetch key (`admin-attendance-table.tsx:64-71` invalidates `adminAttendance(date, dept)` but fetches `['attendance','admin-list',…]`) → no-op.
- **Objective:** Central `lib/realtime-channels.ts` naming scheme (`private-user.{id}`, `private-conversation.{id}`, `presence-org`, `private-org.announcements`) with private/presence flags; every `subscribe()` call uses it; fix admin table invalidation key to its real fetch key prefix. When `isConnected === false` ensure **every** realtime consumer has a polling fallback (leave lists/announcements currently don't — add 60s refetch or rely on invalidations; choose polling for correctness).
- **Dependencies:** backend broadcast verification (events `.attendance.updated`, `.AnnouncementPosted`, `MessageSent` exist — confirm channel names in event classes). **Backend contract:** none changed.
- **Files:** `lib/realtime-channels.ts` (new), `use-reverb.ts`, `admin-attendance-table.tsx`, `hr-attendance-table.tsx`, `notifications-bell.tsx`, `announcement-board.tsx`, `auth-guard.tsx`, `chat-tab.tsx`.
- **Verification:** with Reverb running locally, punch → HR table refreshes without polling. **Regression:** polling fallbacks still active when offline env. **Acceptance:** no bare `subscribe("…")` without flag from the registry.

### FE-CORE-06 · CONSISTENCY — Parameter-preserving redirect helper
- **Scope:** `app/dashboard/leave/page.tsx`, `app/dashboard/org/leave/page.tsx`, `app/dashboard/audit/page.tsx`, `app/dashboard/notifications/page.tsx`, `app/dashboard/org/page.tsx`, `org/departments`, `org/designations`, `app/dashboard/tasks/page.tsx`.
- **Problem:** Static `redirect("/dashboard/attendance?tab=approvals")` **drops query params** — admin table's "View Leave" deep link `/dashboard/org/leave?user_id=…&date=…` (`admin-attendance-table.tsx:281`) and the manual-event audit link `/dashboard/audit?action=attendance_correction&user_id=…` (`team-member-attendance-sheet.tsx:192`) arrive with filters stripped, so the approvals tab ignores `user_id` (it *does* read `useUrlState("user_id")` — `approvals-tab.tsx:26` — but never receives it).
- **Objective:** `lib/redirect-with-params.ts(target, {map})` server-side helper that forwards whitelisted params (e.g. `user_id`→`user_id`, `date`→`date`, `action`→`action`); apply to all redirect pages; make the audit tab (`settings` audit-log-table) consume `action`/`user_id` to prefilter, and approvals tab keep its `user_id` filter chip (already has "Clear User Filter" UI).
- **Dependencies:** FE-LEAVE-01 (empty table fix) for the deep link to matter. **Files:** the 8 redirect pages + `components/settings/audit-log-table.tsx`.
- **Verification:** navigate the two deep links; filters applied. **Regression:** plain visits unchanged. **Acceptance:** all redirects forward whitelisted params.

### FE-CORE-07 · TEST — Restore the frontend test suite
- **Scope:** `packages/ui/package.json`, `apps/web/vitest.config.ts`, `src/__tests__/setup.ts`, CI (`.github/workflows/ci.yml`).
- **Problem/Root cause:** (a) Deep imports `@g4k/ui/components/badge|state-helpers|data-table` are used by 15+ files but the package `exports` map only exposes `.`/`./api`/`./components`/`./hooks`/`./theme`/`./types` — Vite/vitest refuses them (9 test files fail); Next's resolver tolerates it, masking the issue. (b) `timer-store.ts:21-128` uses `persist` **without** `skipHydration` and default storage — crashes where `localStorage` is absent at import (tests) and risks SSR hydration mismatch. (c) CI pipes `| tail` swallow non-zero exits.
- **Objective:** (a) Add `"./components/*": "./src/components/*.tsx"` (and `./hooks/*`) to `@g4k/ui` exports **or** convert consumers to barrel imports — prefer exports map (zero code churn); (b) give `timer-store` `skipHydration: true` + rehydrate in `StoreHydration` (`providers.tsx`) like the other stores; (c) fix CI steps to fail on test failure (`set -o pipefail` or no pipe).
- **Dependencies:** none. **Files:** `packages/ui/package.json`, `apps/web/src/stores/timer-store.ts`, `apps/web/src/components/providers.tsx`, `.github/workflows/ci.yml`.
- **Verification:** `pnpm --filter web test` → all files execute; timer-store tests pass; CI red on failure. **Regression:** attendance timer behaves identically after reload (persisted state rehydrates). **Acceptance:** `Test Files 10 passed (10)`.

### FE-CORE-08 · WIRING — `/users` access for non-HR contexts (task assignment, group creation)
- **Scope:** backend `routes/api.php`, `tasks-tab.tsx`, `task-detail-sheet.tsx`, `components/chat/create-group-dialog.tsx`, `components/app-shell/project-timer-widget.tsx`.
- **Problem:** Employees (no `users.employee.manage`) get 403 from `/users` — task create's assignee list is empty for them (`tasks-tab.tsx:42,53`), group chat member picker empty (`create-group-dialog.tsx:24-31`), yet employees legitimately need to start DMs (backend `/conversations/dm` allows) and see colleagues (Directory exists for this).
- **Objective (backend-frontend wiring):** add a lightweight capability-open endpoint `GET /users/options` (id, name, avatar, active_role only; no PII) gated on `chat.access|tasks.view`, **or** reuse `/directory?per_page=…` in these pickers. Prefer the backend option for exact IDs. Refactor the three pickers to one shared `<UserPicker />` with search.
- **Dependencies:** FE-CHAT-05. **Backend contract:** new endpoint (coordinate with API plan) or directory reuse.
- **Files:** `components/shared/user-picker.tsx` (new), `tasks-tab.tsx`, `task-detail-sheet.tsx`, `create-group-dialog.tsx`, `project-timer-widget.tsx`.
- **Verification:** employee creates a group/task assignee selection works; 403 noise gone from network tab. **Regression:** HR/super_admin pickers unchanged. **Acceptance:** no `/users` calls from employee-role contexts.

### FE-CORE-09 · COMPONENT — Standardise page chrome (`PageContainer` everywhere)
- **Scope:** `components/layout/page-container.tsx`; pages not using it: `admin/attendance`, `org/attendance`, `admin/reports`, `reports` (hand-rolled headers), `tasks/[id]` (bare).
- **Problem:** Inconsistent headers/spacing/max-width (`max-w-[1400px]` hand-rolled vs PageContainer standard; missing breadcrumbs on some).
- **Objective:** Wrap all module pages in `PageContainer` with title/description/actions; keep visual hierarchy identical.
- **Files:** the 5 pages. **Verification:** visual pass at 1440/768/375px. **Regression:** none (presentational). **Acceptance:** all dashboard routes share the same header pattern.

### FE-CORE-10 · CLEANUP — Decide & execute announcements page consolidation
- **Scope:** `app/dashboard/announcements/page.tsx` (+loading/error) vs chat tab `?tab=announcements` vs `AnnouncementBoard` in chat sidebar (`chat-tab.tsx:327`).
- **Problem:** Three surfaces for announcements; `/dashboard/announcements` is reachable only by URL (no nav entry) — orphaned route; chat tab shows the board twice (sidebar + its own tab).
- **Objective:** Keep chat page's Announcements tab as the canonical surface; delete the sidebar duplicate on the chat tab; redirect `/dashboard/announcements` → `/dashboard/chat?tab=announcements` (params preserved per FE-CORE-06); optionally add "Announcements" to command palette (gated by nothing — all roles view).
- **Files:** `chat-tab.tsx` (remove sidebar board), `app/dashboard/announcements/page.tsx` → redirect, `nav-config.ts`.
- **Verification:** announcements visible exactly once per view; old URL redirects. **Acceptance:** no orphan routes in `app/dashboard/**` without nav or redirect.

### FE-CORE-11 · WIRING — Dead backend features with zero UI (mount or remove)
- **Scope/Problem:** (a) **Pins** — full backend (`/pins` CRUD), payload in `dashboard/init` (`pins` key), `queryKeys.pins` — zero UI ("Pins removed" comment). (b) **Demo data** — `DemoDataConfig` component written but never mounted; backend `/demo-data` status/purge/seed unreachable (this was a live prod root cause — purge needs UI). (c) **System jobs** — `SystemJobsConfig` unmounted; `/admin/jobs`, `/admin/jobs/retry` unreachable. (d) `/attendance/sync` bulk endpoint unused by frontend (offline engine replays punch-by-punch — acceptable, document). (e) `sessions` revoke exists in profile ✓ (keep).
- **Objective:** Mount `DemoDataConfig` and `SystemJobsConfig` as new Settings tabs (`settings-tabs.tsx`), gated `settings.manage`; delete pins UI remnants (`queryKeys.pins`, init payload consumption optional — coordinate backend removal of `pins` key to slim the init payload); document sync endpoint decision.
- **Files:** `components/settings/settings-tabs.tsx`, `components/settings/demo-data-config.tsx`, `components/settings/system-jobs-config.tsx`, `lib/query-keys.ts`, backend `DashboardController@init` (remove `pins`).
- **Verification:** super_admin can purge demo data and retry failed jobs from Settings. **Regression:** settings tabs render for HR without the new tabs. **Acceptance:** every backend route has either a UI or a documented intentional skip.

### FE-CORE-12 · PERF/CLEANUP — Remove unused `packages/ui` generated API layer or wire it
- **Scope:** `packages/ui/src/api/**` (hey-api generated client, `openapi-ts.config.ts`), `package.json` scripts.
- **Problem:** Zero imports of `sdk.gen`/`client.gen` anywhere in `apps/web` (verified by grep); the app hand-rolls `apiFetch`. Dead ~10k LOC of generated contract code that silently rots.
- **Objective:** Decide: (recommended) delete `packages/ui/src/api` + `api:generate` script + `@hey-api/*` deps, and document `apiFetch` as the contract layer; or actually generate+adopt. Do not keep both.
- **Verification:** build/typecheck pass; bundle size unchanged or smaller. **Acceptance:** one API layer exists in the repo.

### FE-CORE-13 · A11Y — Shared a11y baseline pass
- **Scope:** dialogs across app; `notifications-bell.tsx` (Dialog lacks Description), `hr-correction-dialog.tsx:183-184` (Description nested inside Title), onboarding phone/emergency inputs lack `htmlFor`/`id` (`onboarding/page.tsx:184-190`), message list has no `aria-live` for incoming messages, kanban drag has no keyboard alternative, ECharts graphs convey status by color only.
- **Objective:** Audit-and-fix sweep: every Dialog/Sheet has Title+Description (`sr-only` acceptable); all inputs labelled; `role="log" aria-live="polite"` on chat message list; kanban cards get a "Move to…" dropdown as keyboard path; charts get pattern/label differentiation (or text table alternative). Forms get `aria-invalid` + error `role="alert"` (already partly done in `user-edit-dialog`).
- **Dependencies:** none. **Files:** listed components. **Verification:** axe-core (already wired in dev `providers.tsx:37-43`) reports zero critical violations on main flows; manual keyboard walk of chat/kanban/settings. **Acceptance:** Lighthouse a11y ≥ 95 on dashboard/chat/attendance.

### FE-CORE-14 · RESPONSIVE — Table → card/sheet adaptation standard
- **Scope:** `DataTable` consumers (admin/HR attendance, approvals, users, audit).
- **Problem:** Tables are `overflow-x-auto` only — on phones the 8-9 column attendance/user tables are unreadable scroll-soup; admin/HR filter bars wrap awkwardly (`flex-col xl:flex-row`).
- **Objective:** Add a `mobileCard` render prop to the shared `DataTable` (or a `useIsMobile` switch in each consumer) rendering row cards on `<sm`; FilterBar collapses into a slide-over "Filters" sheet on mobile with active-filter count badge. Implement once, apply to the four heaviest tables first (FE-ATT/FE-LEAVE/FE-ORG tasks reference this).
- **Files:** `packages/ui/src/components/data-table.tsx`, `filter-bar.tsx`, consumers. **Verification:** 375px walkthrough of each table. **Acceptance:** no horizontal page-level scrolling at 375px on any dashboard page.

### FE-CORE-15 · BUG — Offline sync invalidation correctness
- **Scope:** `providers.tsx:80-88`, `lib/offline-engine.ts`.
- **Problem:** `offline-sync-complete` always invalidates only `attendance.punch` + `dashboardInit` — a queued leave request or comment sync never refreshes its real queries; conflict/failed punches dispatch `attendance-sync-failed` handled only by time-clock-widget.
- **Objective:** Queue entries record an `invalidation: string` (invalidation-map event) captured at enqueue time (parse endpoint → map `/leave-requests` → `leave.request`, `/conversations/*` → conversations/messages, `/tasks/*` → `task.crud`, punch types → `attendance.punch`); `syncAll` replays the right events; UI badge for conflicts (extend `offline-indicator.tsx` with a "review sync issues" popover listing conflicted/failed items with retry/discard).
- **Dependencies:** FE-CORE-04 none; uses `invalidation-map.ts`. **Files:** `lib/offline-engine.ts`, `providers.tsx`, `components/offline-indicator.tsx`.
- **Verification:** go offline, submit leave + punch, reconnect → history and today card refresh. **Regression:** dedupe/retry ladder unchanged. **Acceptance:** no generic "assume punches" comment remains.

### FE-CORE-16 · CONSISTENCY — Cookie/auth hygiene in middleware & api-client
- **Scope:** `lib/auth-store.ts:48`, `lib/api-client.ts:150-152`, `providers.tsx:90-102`, `middleware.ts`.
- **Problem:** `g4k_token` cookie set with `max-age=604800` (7d) on every request/visibility change while access tokens live minutes (backend `session.access_token_ttl`, default 15) — after token expiry+failed refresh the cookie survives, so middleware keeps admitting the user to protected routes that then 401-loop; `g4k_capabilities` cookie max-age differs between writers (86400 in `capabilities.ts:19` vs 604800 in `auth-store.ts:52`) → stale capability gates after role changes.
- **Objective:** Set `g4k_token` max-age to the real session TTL (return `expires_in` from login/refresh, or use a session cookie cleared on logout); single writer for `g4k_capabilities` (auth-store) with identical max-age; refresh capabilities cookie on role-select (already via `setAuth`) and on `/me/capabilities` refetch.
- **Dependencies:** backend to include token expiry in auth responses (verify AuthController already returns ttl; add `expires_in` if absent). **Files:** `auth-store.ts`, `api-client.ts`, `providers.tsx`, `capabilities.ts`.
- **Verification:** expired session → middleware sends to `/login?reason=expired` instead of admitting; role switch immediately re-gates nav. **Regression:** refresh flow still transparently re-authenticates. **Acceptance:** cookie TTLs match session TTL; one writer per cookie.

### FE-CORE-17 · UX — Command palette productivity pass
- **Scope:** `command-palette.tsx`.
- **Problem:** "Export Team Report" broken (FE-CORE-04); no navigation to Leave (`Request Leave` exists → attendance?tab=leave ✓ keep); no "New Task"/"New Project" quick actions despite `shortcut-action-new` cleanup; clock actions bypass the widget's confirm dialogs; recent items use profile icon for all types.
- **Objective:** After CORE-04/01: add type-aware icons for recents; add "New Task" / "New Project" actions routing with preopened dialogs (`/dashboard/projects?tab=tasks&new=1` handled by tasks tab); remove duplicated clock punch code by calling the same handlers as time-clock-widget (extract `usePunchActions` hook).
- **Files:** `command-palette.tsx`, new `hooks/use-punch-actions.ts`, `components/widgets/time-clock-widget.tsx` refactored to consume it.
- **Verification:** palette actions all functional; no duplicated punch logic. **Acceptance:** single punch implementation shared by widget, palette, and mobile FAB.

---

# P1 — Attendance Module

*Pages:* `/dashboard/attendance` (employee), `/dashboard/org/attendance` (HR), `/dashboard/admin/attendance` (super_admin). *Components:* 17 files under `components/attendance/`, `widgets/time-clock-widget.tsx`, `stores/timer-store.ts`, `components/attendance/live-timer.tsx`.

### FE-ATT-01 · BUG — Admin Overview & Open Shifts tables render empty
- **Scope:** `admin-attendance-table.tsx:97-98`, `admin-open-shifts-table.tsx:64-65`; pages admin/attendance (Overview, Open Shifts tabs).
- **Problem/RCA:** `overview()` returns `response()->json($query->paginate())` = flat paginator `{data:[…], last_page}` (`AttendanceController.php:427-437`); frontend reads `data?.data?.data`/`data?.data?.last_page` → `undefined` → zero rows, `totalPages=1`. Open Shifts' empty state then *always* claims "All employees have successfully clocked out" — masking the bug.
- **Objective:** Apply FE-CORE-03 unwrapping; Open Shifts keeps `status=open` param; verify row shape fields (`user_name`, `user_email`, `department_name`, `clock_in/out`, `total_seconds`, `late_minutes`) match controller select.
- **Dependencies:** FE-CORE-03. **Backend contract:** none.
- **State/data:** query key `['attendance','admin-list',…]` retained; realtime invalidation key fixed here too (per FE-CORE-05).
- **Responsive:** tables via FE-CORE-14 cards on mobile. **UX:** Open Shifts empty state only when truly empty.
- **Files:** the two components. **Verification:** seed >20 records → paginated rows + correct totals; open-shift rows show OPEN badge rows only. **Regression:** date/status/dept/search filters still reset pagination. **Acceptance:** both tabs display live data for super_admin.

### FE-ATT-02 · REDESIGN/MISSING — Full-history attendance calendar (the "broken calendar")
- **Scope:** `attendance-history-calendar.tsx` (employee dialog `attendance/page.tsx:108-117`, HR member sheet history tab `team-member-attendance-sheet.tsx:229-233`, user detail attendance tab `org/users/[id]/page.tsx:333-351`), backend `AttendanceController@meHistory/hrHistory`.
- **Problem/RCA:** `meHistory`/`hrHistory` `cursorPaginate(30)` return the newest 30 days; the calendar receives that as *complete* history: navigating to previous months shows a blank "No data" grid; mobile shows a 26-week heatmap with **no navigation at all**; `viewMode` state is dead (`attendance-history-calendar.tsx:397`); "{days.length} records this month" counts all loaded records, not the month's; day-detail reads `data?.standard_seconds` which `meDay` never returns (only `meToday` does) so the OT threshold silently defaults 31500 (`:550`).
- **Objective:** Month-scoped fetching: extend backend `meHistory`/`hrHistory` with `?month=YYYY-MM&per_page=100` (or `from/to`) returning that month's days (keep cursor for infinite lists elsewhere); calendar fetches per `currentDate` change via `useQuery(queryKeys.attendanceMonth(userId, month))`; month nav enabled on **mobile too** (heatmap window follows selected month, or switch mobile to the month grid with compact cells); remove dead `viewMode` or implement Year view; record-count label filtered to month; day-detail gets `standard_seconds` (add to `meDay`/`hrDay` responses or reuse meToday's schedule cache).
- **Dependencies:** backend param addition (coordinate; trivial). **Backend contract:** `GET /attendance/me/history?month=` & `/attendance/hr/history/{id}?month=` → `{data:[days]}`; `meDay/hrDay` add `standard_seconds`.
- **State/data:** new `queryKeys.attendanceMonth(owner, month)`; holidays query per year already correct (`/holidays?year=` ✓ verified).
- **Responsive:** desktop month grid (existing, good); mobile: month navigation + compact grid or scrollable heatmap anchored to selected month; keep tooltips as aria-labels on touch.
- **UX:** click day → detail dialog (works today for record days ✓); future dates disabled but future *holidays* still shown (align heatmap/month-grid behavior — currently inconsistent `:343-346` vs `:240`).
- **Files:** `attendance-history-calendar.tsx`, backend two methods, `lib/query-keys.ts`.
- **Verification:** select a month 6 months back → that month's statuses render; day detail shows correct OT threshold. **Regression:** recent-7 list on employee page unchanged; HR sheet trends tab unaffected. **Acceptance:** "View Full Calendar" shows a complete, navigable history on desktop and mobile.

### FE-ATT-03 · BUG — Today's Summary break list shows Invalid Date / NaNm
- **Scope:** `today-summary-card.tsx:62-82`.
- **Problem/RCA:** reads `currentBreakStart.time` / `event.time`; backend events carry `timestamp` (`meToday` returns `events` from `AttendanceEvent`, field `timestamp`) → `new Date(undefined)` = Invalid Date, durations NaN.
- **Objective:** use `event.timestamp` (mirror `team-member-attendance-sheet.tsx:66-77` which is correct); add type `AttendanceEvent` shared in `types/attendance.ts` to prevent recurrence.
- **Files:** `today-summary-card.tsx`, new `src/types/attendance.ts`. **Verification:** punch break start/end → row shows times + minutes. **Regression:** ongoing-break row shows "Now". **Acceptance:** no Invalid Date in summary card.

### FE-ATT-04 · BUG — Open-shift "Notify HR" sends user IDs as day IDs
- **Scope:** `admin-open-shifts-table.tsx:225` (`getRowId: row.user_id || row.id`) + `notifyMutation` (`:67-74`).
- **Problem/RCA:** selection keys are `user_id`s; backend `notifyOpenShifts` validates `ids.* exists:attendance_days,id` (`AttendanceController.php:880-884`) → 422 validation error, notifications never sent.
- **Objective:** `getRowId={(row) => String(row.id)}` (attendance_day id); keep employee column display unchanged. Also dedupe the double "Trends" affordance in admin table (`admin-attendance-table.tsx:177-186` hover button + `:300-313` actions column — remove one).
- **Files:** `admin-open-shifts-table.tsx`, `admin-attendance-table.tsx`. **Verification:** select rows → Notify HR → HR users receive notification (link `?date=` lands on HR console ✓). **Regression:** selection-based export unaffected (it uses the same ids for `ids=` filter — verify backend `export` treats ids as day ids ✓ it does). **Acceptance:** notify succeeds with 200.

### FE-ATT-05 · WIRING — HR team export route & params
- **Scope:** `hr-attendance-table.tsx:98-136`.
- **Problem:** calls non-existent `/attendance/hr/export`; even corrected to `/attendance/export`, that endpoint expects `start_date`/`end_date` (not `date`) and ignores `status`/`search`.
- **Objective:** With FE-CORE-04: use `/attendance/export` mapping `date` → `start_date=end_date`; extend backend `export()` filters to accept `status`/`search`/`user_id` parity with `overview()` (small backend change) so "Export Team List" honours filters.
- **Files:** `hr-attendance-table.tsx`, backend `AttendanceController@export`. **Verification:** HR export honors date+dept+status. **Acceptance:** no `/attendance/hr/export` references.

### FE-ATT-06 · BUG — Analytics stat cards computed from page 1 only
- **Scope:** `hr-attendance-analytics.tsx:27-76`, `admin-attendance-analytics.tsx:26-75`.
- **Problem/RCA:** Present/Late/Absent/Leave counts derive from the *paginated* hr/today or overview response (first 20 rows) — with >20 employees the "X / total" is wrong; admin variant renders `data?.data` (rows) ✓ but same page-1 limitation.
- **Objective:** derive card counts from the aggregate graph endpoints (`/attendance/admin/graph?groupBy=date&mode=…` sums, or add a `?date=` totals shape); simplest: single-day totals = `hrGraph/adminGraph` with `mode=daily`-style aggregation for that date, or a tiny backend `summary` param on hrToday returning counts alongside paginator (preferred: `meta.summary`).
- **Backend contract:** add `summary: {present, absent, late, leave, total}` to `hrToday`/`overview` meta (non-breaking).
- **Files:** both analytics components (+ shared `AttendanceStatCards` to replace the ~120-line near-duplicates — CONSISTENCY). **Verification:** with 25 seeded employees, counts match reality regardless of pagination. **Acceptance:** one shared component, aggregates correct.

### FE-ATT-07 · BUG — Timer store `standardSeconds` never populated; defaults disagree
- **Scope:** `stores/timer-store.ts:76-127`, `time-clock-widget.tsx:30` (31500), `today-summary-card.tsx:40` (31500), store default 28800.
- **Problem/RCA:** `syncWithServer` reads `day.standard_seconds` but the API returns it top-level (`meToday`/init `attendance_today.standard_seconds`) → store value always 28800; widget works around it locally, summary card re-reads top-level — three sources of truth, two defaults.
- **Objective:** `syncWithServer(day, events, standardSeconds)` signature; all consumers read schedule from the store; single default constant `DEFAULT_STANDARD_SECONDS = 31500` in `lib/constants.ts` (align with backend fallback 31500 `AttendanceController.php:198`).
- **Files:** `timer-store.ts`, `time-clock-widget.tsx`, `today-summary-card.tsx`, `dashboard/layout.tsx:117-121`. **Verification:** schedule with 8h standard shows OT past 8h everywhere. **Acceptance:** one writer of standardSeconds.

### FE-ATT-08 · WIRING — `meDay` response completeness
- **Scope:** backend `meDay`/`hrDay`; `attendance-history-calendar.tsx DayDetailContent`.
- **Problem:** day-detail OT threshold always default (missing `standard_seconds`); statuses outside the known set fall back to "absent" in `getStatus` (`:80-93`) — audit `AttendanceDay` status enum (present/late/absent/leave/overtime? half-day?) and map unknown → neutral "No data" + label instead of Absent.
- **Files:** backend controllers, `attendance-history-calendar.tsx`. **Verification:** fixture days with each status render correct color/label. **Acceptance:** status mapping exhaustive (default = unknown-neutral).

### FE-ATT-09 · UX — Employee attendance page polish
- **Scope:** `attendance/page.tsx`.
- **Items:** (a) month-count label fix (with FE-ATT-02); (b) Recent Shift Log dialog-in-dialog nesting (row Dialog inside card) — acceptable but ensure Esc closes topmost only; (c) leave tab type filter values match backend `casual,sick,earned,unpaid` everywhere (see FE-LEAVE-04); (d) `formatSecs` duplicated 4× across attendance files — move to `lib/format.ts`.
- **Files:** page + components. **Verification:** visual/interaction pass. **Acceptance:** shared helpers, no duplicated formatters.

### FE-ATT-10 · MISSING — `attendance/correct` flow parity check
- **Scope:** `hr-correction-dialog.tsx` vs backend `CorrectAttendanceRequest`.
- **Problem:** payload `{action, attendance_day_id, reason, type?, timestamp "YYYY-MM-DD HH:MM:SS", event_id?}` — verify backend rules accept exactly this (incl. `event_id` string vs int) and that success invalidates HR tables (currently invalidates `hrAttendance(date,"all")[0]` prefix ✓ but not the admin list key → add per FE-CORE-05).
- **Files:** dialog + invalidation keys. **Verification:** add/edit/remove flows for HR & super_admin; audit log entry created (manual badge links work after FE-CORE-06). **Acceptance:** corrections reflect immediately in both consoles.

### FE-ATT-11 · CLEANUP/CONSISTENCY — De-duplicate HR vs Admin console
- **Scope:** `hr-attendance-table.tsx` vs `admin-attendance-table.tsx`; `hr-attendance-analytics` vs `admin-attendance-analytics`; `hr-attendance-graph.tsx` vs `admin-attendance-trends-graph.tsx`.
- **Problem:** Near-identical 300-460-line pairs differing only by endpoint + palette; drift already caused the `.data` divergence (one broken, one not).
- **Objective:** Extract `AttendanceConsoleTable` (endpoint + capability props), `AttendanceStatCards` (FE-ATT-06), `AttendanceTrendsGraph` (endpoint prop). Admin page keeps its extra Calendar/Open-Shifts tabs; HR keeps analytics+table+graph layout.
- **Files:** the four components → two shared. **Verification:** both consoles feature-equivalent to today post-fixes. **Acceptance:** single implementation per concern; admin/HR differences = config.

### FE-ATT-12 · UX — Presence-style live statuses in HR console
- **Scope:** `hr-attendance-table.tsx`.
- **Objective:** Today view shows live "on break / working Xh Ym" derived from `clock_in`/last event (data already in rows); polling already exists — add derived column. Optional after CORE-05 realtime.
- **Files:** table + shared helper. **Verification:** break state updates within poll interval. **Acceptance:** HR sees at-a-glance shift state.

### FE-ATT-13 · RESPONSIVE — Employee attendance on mobile
- **Scope:** `attendance/page.tsx`, calendar (FE-ATT-02), time clock.
- **Objective:** Overview grid stacks (already `grid-cols-1` ✓ verify); Time Clock widget remains primary CTA; calendar mobile per FE-ATT-02; bottom-nav FAB icon currently `teamAttendance` — switch to a clock icon for meaning (`registry.ts` has one).
- **Verification:** 375px full flow: clock in/out, breaks, view month, open day detail. **Acceptance:** full attendance self-service on mobile.

---

# P2 — Chat, Notifications & Announcements

*Pages:* `/dashboard/chat` (tabs: chat / announcements / notifications), bell in header. *Components:* `components/chat/*`, `widgets/announcement-board.tsx`, `widgets/quick-notes.tsx`.

### FE-CHAT-01 · WIRING/BUG — Message window pagination inverted (root cause of "unusable chat")
- **Scope:** backend `ChatController@messages` (`:47-58`), `chat-tab.tsx:72-79`, `message-list.tsx:147-165`.
- **Problem/RCA:** `orderBy('created_at','asc')->cursorPaginate(50)` → page 1 = **oldest** 50; `next_cursor` moves toward newer. Frontend renders page 1 as the visible window, scrolls to bottom, and calls `fetchNextPage` when scrolled to **top** ("Loading older messages…"). With >50 messages users open conversations into ancient history; "load older" actually pages toward newer; combined with polling re-appends, the view desyncs.
- **Objective:** Change backend to `orderByDesc('created_at')->cursorPaginate(50)` (Laravel convention: newest page 1, `next_cursor` → older). Frontend then: renders pages with items reversed so newest sits at bottom (`pages.flatMap(...).reverse()` ordering by created_at), keeps scroll-to-bottom on open, and on `fetchNextPage` **preserves scroll position** (record scrollHeight before, restore after) instead of jumping (fixes `message-list.tsx:154-158` which scrolls to bottom on any length change).
- **Dependencies:** none (backend one-liner + frontend ordering). **Backend contract:** response shape unchanged (`{data, next_cursor,…}`).
- **State/data:** `queryKeys.messages(id)` unchanged; dedupe by id when realtime + refetch overlap.
- **Responsive/UX:** unchanged layout; correct ordering & pagination direction.
- **Files:** `ChatController.php`, `chat-tab.tsx`, `message-list.tsx`.
- **Verification:** seed conversation with 200 messages → open shows latest 50; scroll top loads older in place; send works from any window position. **Regression:** <50-message conversations behave identically to today. **Acceptance:** chat opens on newest messages in every conversation.

### FE-CHAT-02 · BUG — Optimistic own message renders as incoming
- **Scope:** `chat-tab.tsx:199-207` vs `message-list.tsx:202` (`isMe = msg.sender_id === currentUserId`).
- **Problem:** optimistic message sets `user_id` + `user` but no `sender_id`/`sender` → renders left-aligned, blank name until refetch.
- **Objective:** optimistic payload includes `sender_id: user.id, sender: {id, name: user.name}`; mark `pending` (spinner/watermark), reconcile on settle.
- **Files:** `chat-tab.tsx`. **Verification:** send → right-aligned instantly with "You". **Acceptance:** no wrong-side flicker.

### FE-CHAT-03 · BUG — Live read receipts no-op (`read_by` vs `reads`)
- **Scope:** `chat-tab.tsx:104-127` handler updates `msg.read_by`; backend serialises relation `reads` (collection) — receipts never update live; `message-list.tsx:91` correctly reads `msg.reads`.
- **Objective:** handler appends `{user_id: e.userId}` to `msg.reads`; align event payload field names with backend `MessageRead` broadcast (verify event class).
- **Files:** `chat-tab.tsx`. **Verification:** two sessions — read state flips without refetch. **Acceptance:** single field name for read state.

### FE-CHAT-04 · MISSING — Conversation list search & pagination
- **Scope:** `conversation-list.tsx`, `chat-tab.tsx:60-65`.
- **Problem:** `/conversations` cursorPaginates 50; frontend loads first 50 only, no search, no way to reach older conversations; no unread-first sorting.
- **Objective:** search box (client-side filter over loaded + server `?search=` if added — prefer client first); infinite scroll via cursor (`next_cursor` from paginator) with `useInfiniteQuery`; sort: unread pinned to top then latest message.
- **Files:** `conversation-list.tsx`, `chat-tab.tsx`. **Verification:** 60 conversations → all reachable; search filters. **Acceptance:** no silent 50-cap.

### FE-CHAT-05 · MISSING — Group creation for employees + DM entry points
- **Scope:** `create-group-dialog.tsx`, FE-CORE-08 picker, directory tab (`directory-tab.tsx:87` DM mutation ✓ exists).
- **Objective:** member picker uses FE-CORE-08 source; add "New Chat" button in conversation list offering DM (search user) or Group; surface directory "Message" as the secondary DM path (works today).
- **Files:** `create-group-dialog.tsx`, `conversation-list.tsx`. **Verification:** employee creates group + DM. **Acceptance:** chat initiation possible for all roles from within chat.

### FE-CHAT-06 · UX — Message list behaviour & structure
- **Scope:** `message-list.tsx`.
- **Items:** (a) day separators + consecutive-message grouping by sender; (b) "New messages" divider when window regains focus with appended messages; (c) scroll preservation with FE-CHAT-01; (d) pinned-banner overlaps first messages (`pt-24` guess) — measure; (e) virtualizer `estimateSize 72` + measure ok; add `aria-live` (FE-CORE-13); (f) attachment images render `attachment_url` — with prod storage on S3-pending backend fix, add `onError` fallback tile with file icon + "open" link so broken URLs degrade gracefully.
- **Files:** `message-list.tsx`. **Verification:** long-history scroll + jump-to-latest button appears when scrolled up. **Acceptance:** list feels native (WhatsApp/Slack-grade basics).

### FE-CHAT-07 · CLEANUP — De-duplicate chat page surfaces
- **Scope:** `chat-tab.tsx:325-330` (AnnouncementBoard + QuickNotes sidebar), chat page tabs.
- **Objective:** Per FE-CORE-10: sidebar keeps QuickNotes only (scratchpad pairs well with chat); announcements live in their tab once; nav/palette updated.
- **Files:** `chat-tab.tsx`. **Verification:** single announcement surface. **Acceptance:** no double rendering.

### FE-CHAT-08 · UX — Composer polish
- **Scope:** `message-composer.tsx`.
- **Items:** auto-grow textarea (1→5 rows); typing indicator (needs backend broadcast — defer, note); mention dropdown keyboard nav beyond Enter-first (arrow keys); attachment type/size errors surfaced from backend (`max:10240`); Enter-sends + Shift+Enter newline retained ✓.
- **Files:** composer. **Verification:** manual keyboard flows. **Acceptance:** no silent send failures.

### FE-CHAT-09 · MISSING — Conversation context actions
- **Scope:** backend `ChatController` gap + `conversation-list.tsx`.
- **Problem:** No rename/leave/add-members for groups, no mute, no delete-for-self; pin/unpin messages exist but only for `chat.manage|projects.manage` (`chat-tab.tsx:30`) — verify backend gate parity (`pinMessage` checks — confirm; align UI gating to backend exactly).
- **Objective:** Phase-1: header dropdown with member list, add-member (owner), leave (backend endpoint needed — coordinate), mute (local preference). Keep scope explicit in plan; do not fake.
- **Backend contract:** new endpoints required (leave/add members) — listed as API dependency, implement UI when available.
- **Files:** `chat-tab.tsx` header, new `conversation-info-dialog.tsx`. **Acceptance:** group management basics usable.

### FE-COMM-01 · UX/BUG — Announcements: capability gating + full CRUD
- **Scope:** `announcement-board.tsx`.
- **Problem:** gating by `user.active_role === 'hr' || 'super_admin'` (`:19`) instead of `announcements.manage` capability; edit limited to pin-toggle — no title/body edit though backend `PUT /announcements/{id}` supports it; create dialog uses raw inputs (inconsistent with Form components); scope toggle only for super_admin (`:155`) — verify backend `scope` values (company/team) parity.
- **Objective:** gate on `hasCapability(caps, "announcements.manage")`; add Edit dialog (same form as create, prefilled); verify reaction payload shape `reactions[key] = [user_ids]` matches backend (spot-check `AnnouncementController@index` serialization — fix if map vs json differs).
- **Files:** `announcement-board.tsx`. **Verification:** HR edits + pins; employee reacts. **Acceptance:** capability-based gating; full CRUD.

### FE-COMM-02 · UX — Quick notes editing
- **Scope:** `quick-notes.tsx`.
- **Objective:** inline edit (PUT body), expand-on-click for truncated notes (`Truncate` currently permanent), keep pin/delete; consider character count.
- **Files:** widget. **Verification:** edit persists via dashboardInit invalidation ✓ (verify key). **Acceptance:** notes fully editable.

### FE-COMM-03 · MISSING — Notification centre feature parity
- **Scope:** `notifications-tab.tsx`, `notifications-bell.tsx`.
- **Problem:** backend supports `mark-unread` (`POST /notifications/{id}/mark-unread`) — no UI; bell's markRead invalidates only unreadCount (`notifications-bell.tsx:73-75`) leaving list stale on server-shape mismatch; "Clear" misleading (hides from popup only); `dismissedNotificationIds` grows unbounded in localStorage (`ui-store.ts:51-61`).
- **Objective:** add Mark-unread action on read rows (both surfaces); bell onSettled invalidates `["notifications"]` too; rename Clear → "Hide from popup" with tooltip; prune dismissed ids > 90 days / > 500 entries.
- **Files:** both components, `ui-store.ts`. **Verification:** unread toggle round-trips; storage bounded. **Acceptance:** parity with backend notification API.

---

# P3 — Leave & Holidays

*Surfaces:* attendance page `Leave` + `Approvals` tabs (canonical after redirects), `/dashboard/leave` & `/dashboard/org/leave` redirect pages, `leave-request-form`, `leave-history-table`, `leave-approval-actions-cell`, `holiday-calendar`, `upcoming-holidays-widget` (currently dead — see FE-DASH-03).

### FE-LEAVE-01 · BUG — Approvals & All-History tables empty (data shape)
- **Scope:** `approvals-tab.tsx:66-70,157-161`.
- **Problem/RCA:** `/leave-requests` and `/leave-requests/admin/history` return flat paginators (`LeaveRequestController.php:63,229,278`); frontend reads `data?.data?.data`/`data?.data?.last_page` → empty.
- **Objective:** FE-CORE-03 unwrap; also the tab fetches `/leave-requests` (index) — correct endpoint for HR-scope approvals ✓ (index scopes to approver-department or own — `:31-44`), but it sends `search` param the backend **ignores** (index supports status/type/user_id only) — either drop the search box or add backend search (prefer backend `search` on name/reason).
- **Backend contract:** add `search` (users.name, reason) to `index`/`adminHistory`; params `page/per_page` ✓ (validate `per_page in:20,50,100` — frontend sends 20 ✓).
- **Files:** `approvals-tab.tsx`, backend. **Verification:** HR sees pending queue; filters work; deep link `user_id` (FE-CORE-06) filters. **Acceptance:** leave approval operable end-to-end.

### FE-LEAVE-02 · BUG — My-leave pagination stuck (meta.last_page)
- **Scope:** `leave-tab.tsx:72`.
- **Problem:** `history()` returns flat paginator; `data?.meta?.last_page` undefined → always 1 page.
- **Objective:** FE-CORE-03. **Files:** `leave-tab.tsx`. **Verification:** >20 requests paginate. **Acceptance:** my-leave list fully browsable.

### FE-LEAVE-03 · WIRING — History search param unsupported
- **Scope:** `leave-tab.tsx:28-33` sends `search`; backend `history()` (`:205-229`) filters status/type/start_date only.
- **Objective:** add backend `search` on reason; or hide search until backend ships (prefer backend).
- **Files:** backend + tab. **Verification:** search narrows list server-side. **Acceptance:** no decorative filters.

### FE-LEAVE-04 · BUG — Invalid leave type filter value "annual"
- **Scope:** `approvals-tab.tsx:249-260` history type options include `annual`; backend enum `casual,sick,earned,unpaid` (`StoreLeaveRequestRequest`).
- **Objective:** replace `annual` → `earned` (label "Earned/EL"); centralise leave-type list in `lib/constants.ts` shared with the request form and history filters.
- **Files:** `approvals-tab.tsx`, constants. **Verification:** filtering by each type returns rows. **Acceptance:** single source of leave types.

### FE-LEAVE-05 · UX — Leave request form flows
- **Scope:** `leave-request-form.tsx`.
- **Items:** (a) success force-navigates to `/dashboard/attendance?tab=leave` even when already there or opened from dialog (`:45`) — replace with in-place success state (form reset + toast + list invalidation via `leave.request` ✓); (b) add leave-balance display — backend has no balance endpoint (noted in `invalidation-map.ts:44`) — **dependency:** backend balances; until then show accrued usage summary from history (days taken this year by type); (c) overlap pre-check only inspects pending — also check approved (`:75-80`) to match backend rule (`:86,121`).
- **Files:** form. **Verification:** submit from dialog stays in context. **Acceptance:** no jarring redirects; overlap parity.

### FE-LEAVE-06 · UX — Approval cell optimistic-update key mismatch
- **Scope:** `leave-approval-actions-cell.tsx:32-51`.
- **Problem:** optimistic setQueryData targets exact `["org-leave-requests"]` while data lives under `[...orgLeaveRequestsPaginated(…), userId, page, perPage]` — optimistic swap is a no-op (final invalidation makes it correct; interim state confusing on slow networks).
- **Objective:** use `setQueriesData({queryKey: ["org-leave-requests"]})` (plural) for optimistic + rollback.
- **Files:** cell. **Verification:** approve reflects instantly. **Acceptance:** optimistic path actually optimistic.

### FE-LEAVE-07 · MISSING — Leave attachments & advanced fields
- **Scope:** backend `store` (no attachment support), form.
- **Problem:** sick-leave commonly needs documents; backend `StoreLeaveRequestRequest` has none.
- **Objective (with backend):** add optional `attachment` file to store + show paperclip in history rows (`leave-history-table`) linking to storage URL. Track under API dependency; UI after contract lands.
- **Acceptance:** documented, implemented when contract exists.

### FE-LEAVE-08 · UX — Holiday calendar & management
- **Scope:** `holiday-calendar.tsx`.
- **Status:** CRUD complete and gated (`canManage = settings.manage` ✓); holidays list `/holidays?year=` ✓.
- **Items:** verify admin-create payload matches backend rules (name/date/type/recurring?) — add zod validation + inline errors; mobile month grid sizing; future-year navigation.
- **Files:** component. **Verification:** create/edit/delete holiday reflects in `/dashboard/attendance?tab=leave` holidays sub-tab (shared query key ✓ `holidays(year)`). **Acceptance:** holiday master data maintainable.

### FE-LEAVE-09 · CONSISTENCY — Pending-approvals widget parity
- **Scope:** `widgets/pending-approvals-widget.tsx` + dashboard-init `pending_approvals` (leave route `/dashboard/attendance?tab=leave` — should deep-link `tab=approvals` for approvers, `tab=leave` for the employee's own status; backend sets `route` — adjust backend to role-appropriate route or map client-side).
- **Files:** widget + backend init route. **Verification:** click-through lands on the right tab per role. **Acceptance:** widget actions consistent with surfaces.

---

# P4 — Organization & People

*Surfaces:* `/dashboard/org/users` (+`[id]`), `/dashboard/directory` (tabs directory/departments/designations), redirects `/dashboard/org`, `/org/departments`, `/org/designations`.

### FE-ORG-01 · BUG — Over-restrictive gating breaks HR user management
- **Scope:** `org/users/page.tsx:200-224`, `org/users/[id]/page.tsx:61-77`.
- **Problem/RCA:** departments query `enabled: hasCapability(caps,"departments.manage")`, designations `designations.manage`, schedules `settings.manage` — but backend `GET /departments`, `GET /designations` are capability-open (any authed user), and `/work-schedules` needs only `settings.manage|users.hr.manage`. HR (has `users.employee.manage`) therefore gets **empty department/designation pickers** in create/edit and empty dept filter — cannot place employees in departments.
- **Objective:** enable those queries for anyone who can see the page (`canManageUsers`); keep work-schedules enabled for `settings.manage|users.hr.manage`.
- **Files:** both pages. **Verification:** HR creates user with department+designation+team. **Regression:** employee role never reaches this page (middleware). **Acceptance:** HR can fully staff-manage.

### FE-ORG-02 · BUG — Activity log IP always N/A
- **Scope:** `org/users/page.tsx:760`, `org/users/[id]/page.tsx:282`; backend `UserController@activity` selects `audit_logs.ip as ip_address`.
- **Objective:** read `log.ip_address` (or drop alias backend-side); same fix in the `[id]` activity tab.
- **Files:** two pages. **Verification:** IP column populated. **Acceptance:** no N/A placeholders for present data.

### FE-ORG-03 · CONSISTENCY — Single user form & edit path
- **Scope:** `org/users/page.tsx:68-79` (schema), `user-edit-dialog.tsx:9-20` (duplicate schema), dual open paths (`:303-317` row-click resets shared form; `:454` dropdown opens dialog directly).
- **Objective:** one `UserForm` component (react-hook-form + zod) used by create dialog and edit dialog; row click → detail page (single drill-in path); remove reset-on-open duality.
- **Files:** page + dialog. **Verification:** create & edit from both entry points behave identically. **Acceptance:** one schema, one form component.

### FE-ORG-04 · UX — Bulk actions honesty
- **Scope:** `org/users/page.tsx:532-541`.
- **Problem:** only activate/deactivate/export; "Bulk Export" passes `ids=` — verify backend `/users/export` supports `ids` filter (add if missing); add bulk role-assign? (defer; document).
- **Files:** page, backend export. **Verification:** bulk export downloads selected users. **Acceptance:** every bulk button does what it says.

### FE-ORG-05 · UX — User detail page completeness
- **Scope:** `org/users/[id]/page.tsx`.
- **Items:** (a) attendance tab uses `hr/history/{id}` — for super_admin ✓ works; verify capability fallback for HR viewing non-managed user (403 → show inline "no access" card instead of raw fail); (b) leave tab reads `leaves?.data` ✓ paginator; (c) add leave-balance/summary when backend ships (FE-LEAVE-05); (d) "Go to Admin Attendance" link visible to HR too but page is admin-gated — gate link by `admin.view-all-attendance`; (e) Send Message → verify response `conversation.id` field from `startDirectMessage` (`:53-56` handles both) ✓.
- **Files:** page. **Verification:** HR & super_admin walkthroughs. **Acceptance:** no dead links; graceful 403 states.

### FE-ORG-06 · CONSISTENCY — Directory vs Employee Management overlap
- **Scope:** `/dashboard/directory` (directory-tab) vs `/dashboard/org/users`.
- **Problem:** two employee lists with different filters/capabilities — intentional (browse vs manage) but currently inconsistent: directory card actions (message ✓), users table actions (manage ✓). Nav labels confusing ("Directory" vs "Employee Management" with directory icon).
- **Objective:** cross-link: directory rows for managers get "Manage" shortcut → user detail; users empty-state links to directory; unify avatar/status rendering via shared `UserCell`.
- **Files:** tabs + shared component. **Acceptance:** clear separation + bridges.

### FE-ORG-07 · UX — Departments & designations masters
- **Scope:** `directory/departments-tab.tsx` (612 ln), `directory/designations-tab.tsx` (384 ln).
- **Status:** CRUD/archive/restore/HR-sync/employee-sync/teams/export all wired ✓ (blob CSV works — streaming backend).
- **Items:** (a) confirm export honors current filters (params passed ✓ spot-check backend `buildIndexQuery` parity); (b) member-count column from `users_count` — verify eager count present; (c) FE-CORE-14 mobile cards; (d) designation status toggle instant UI update.
- **Files:** tabs. **Verification:** full CRUD walkthrough both masters. **Acceptance:** master data ops solid on desktop + mobile.

### FE-ORG-08 · MISSING — Teams surface
- **Scope:** backend `departments/{id}/teams` CRUD (`routes/api.php:312-314`); departments-tab team management inside dept editor (verify) — plus users form `team_id` picker exists.
- **Objective:** verify team create/remove UI exists in departments tab; if only partial, complete it (list teams in dept editor, add/remove).
- **Files:** departments-tab. **Acceptance:** teams manageable and assignable.

---

# P5 — Projects, Tasks, Timer & QA

*Surfaces:* `/dashboard/projects` (tabs projects/tasks incl. board/list/gantt/qa views), `/dashboard/projects/[id]`, `/dashboard/tasks/[id]`, header timer widget.

### FE-PROJ-01 · BUG — QA form validation dead + field types unsupported
- **Scope:** `task-detail-sheet.tsx:117-123` (validates `field.is_required`), `:417-428` (renders every field as text Input; asterisk on `field.required`), backend `QaController@store` persists `required` (`QaFormField::create [... 'required' …]`).
- **Problem/RCA:** mismatched field name → required-check never triggers; checkbox/slider/textarea/select field types (creatable in builder) all render as text inputs.
- **Objective:** render by `field.field_type` (checkbox → Checkbox, slider → Slider 1-10, textarea → Textarea, select → options); validate `field.required`; submit `qa_values` keyed by field id (verify backend submit-review expects map field_id→value — confirm `TaskController@submitForReview`).
- **Files:** `task-detail-sheet.tsx`, new `components/tasks/qa-field-renderer.tsx`. **Verification:** required checkbox unchecked blocks submit with message; slider submits number. **Acceptance:** QA gates function as designed.

### FE-PROJ-02 · BUG — QA form dropdown empty in task create
- **Scope:** `tasks-tab.tsx:44,419` — `qaFormsData?.map` on paginator; must be `qaFormsData?.data?.map` (or FE-CORE-03).
- **Files:** tasks-tab, `projects/[id]/page.tsx:30` (same pattern in edit form — verify). **Verification:** QA form selectable on task create/edit. **Acceptance:** no `.map` directly on paginators (`grep` clean).

### FE-PROJ-03 · UX/BUG — Task timers not durable
- **Scope:** `project-timer-widget.tsx:14-19` (component state), `task-detail-sheet.tsx:36-37` (own separate local timer — two independent timers!), `stores/timer-store.ts`.
- **Problem:** header timer dies on reload/logout (silent loss, unlogged time); task sheet has a *second* timer implementation that pre-fills minutes on stop — inconsistent, also volatile.
- **Objective:** persist active project-timer in a small `timerStore` slice (project/task/startedAt/pausedAccum) with localStorage persist + `beforeunload` guard ("Timer running — time will be lost" dialog); task sheet reuses the same store (starting from sheet updates header widget); single Log Time modal (minutes + description) — backend `logTime` accepts `description` (`TimerController.php` ✓ unused today).
- **Files:** `stores/timer-store.ts` (extend), widget, sheet. **Verification:** start header timer → open task sheet → same running state; reload → resumed. **Acceptance:** one durable timer system.

### FE-PROJ-04 · MISSING — Gantt interactions
- **Scope:** `task-gantt.tsx`.
- **Problem:** `on_date_change` fires but `tasks-tab.tsx:630` passes no `onTaskUpdate` → dragging bars silently does nothing; tasks without `due_date` render created+1day bars (misleading); no progress display persistence (frappe supports progress).
- **Objective:** wire `onTaskUpdate` → `PUT /tasks/{id}` `{due_date, start? (map to …verify backend fields — tasks have start? use created_at fallback and due_date only)}`; tasks lacking due_date get a "no deadline" visual (diamond) not a fake bar; view mode persisted in URL state (`viewMode` also for board/list/qa — `tasks-tab.tsx:23` local state today).
- **Files:** `task-gantt.tsx`, `tasks-tab.tsx`. **Verification:** drag extends due date → list reflects. **Acceptance:** gantt is a real editing surface.

### FE-PROJ-05 · BUG — Board/list data window capped at 100
- **Scope:** `tasks-tab.tsx:66-85` (kanban/gantt request per_page=100 page=1).
- **Problem:** >100 tasks silently missing from board/gantt; list paginates ✓.
- **Objective:** kanban fetches per-status counts (`/tasks?status=…` paginated or a counts param) and paginates within columns (scroll load per column) — simplest v1: per-column infinite scroll using existing `assignee/status` filters; gantt documents cap with banner "showing first 100 — filter to narrow".
- **Files:** tasks-tab/kanban. **Verification:** seed 150 tasks → all reachable. **Acceptance:** no silent truncation.

### FE-PROJ-06 · UX — Bulk task ops vs throttle
- **Scope:** `tasks-tab.tsx:157-178` (parallel PUT/DELETE storm; backend throttles 30/min on task writes).
- **Objective:** sequential with concurrency 3 + progress toast; or backend bulk endpoint (prefer backend `POST /tasks/bulk {ids, action}`); handle 429 with backoff message.
- **Files:** tasks-tab (+backend if chosen). **Verification:** 30-task bulk completes without 429. **Acceptance:** bulk reliable.

### FE-PROJ-07 · UX — Employee task creation defaults
- **Scope:** `tasks-tab.tsx:53-54`.
- **Problem:** employees see only self + `allow_employee_tasks` projects (good) but assignee list empty (FE-CORE-08); created task with `assignees:null` — verify backend self-assigns for `tasks.create-own` (`TaskController:155-158` suggests self-assignment ✓ confirm).
- **Objective:** hide assignee section for non-managers (self implied); show hint "You will be assigned".
- **Files:** tasks-tab. **Acceptance:** employee create-task flow clean.

### FE-PROJ-08 · MISSING — `/tasks/submitted` review queue surface
- **Scope:** backend `GET /tasks/submitted` (tasks you must review) — no dedicated UI; pending_approvals init mixes tasks with `status=review` (init payload tasksQuery `where('tasks.status','review')`).
- **Objective:** "Needs Review" filter chip on tasks tab (managers) calling `/tasks/submitted`; init widget deep-links with that filter.
- **Files:** tasks-tab, `pending-approvals-widget.tsx`. **Verification:** manager sees all awaiting review across projects. **Acceptance:** review queue discoverable.

### FE-PROJ-09 · UX — Project detail completeness
- **Scope:** `projects/[id]/page.tsx`.
- **Status:** strong (cover upload, edit, archive/delete, submit, review, history, members).
- **Items:** (a) verify `/projects/cover` response `{url}` field used (`:381` `res.url`) matches controller; (b) delete → route back to list; (c) history timeline virtualization for long lists; (d) member management uses `/users` (fine for managers ✓ page is manage-gated context); (e) FE-CORE-08 not needed here.
- **Files:** page. **Verification:** manager full-flow: create → cover → members → tasks → submit → review → archive. **Acceptance:** project lifecycle complete in UI.

### FE-PROJ-10 · CLEANUP — Remove `/dashboard/tasks/[id]` duplication risk
- **Scope:** `tasks/[id]/page.tsx` renders TaskDetailSheet full-page ✓ good for deep links (notifications link `/dashboard/tasks/{id}` ✓). Keep; ensure task-not-found state offers back-to-board CTA (currently bare text).
- **Files:** page. **Acceptance:** deep-link UX complete.

---

# P6 — Dashboard Home & Widgets

### FE-DASH-01 · BUG — Grid column mismatch breaks saved layouts at xs
- **Scope:** `widget-engine.tsx:117` (reconcile cols `{lg:12,md:10,sm:6,xs:4,xxs:2}`) vs `:192` render cols `{lg:12,md:10,sm:6,xs:1,xxs:1}`.
- **Problem:** layouts reconciled/persisted against different col counts than rendered → widgets misplace/overlap at <480px after reload.
- **Objective:** single `GRID_COLS` constant used by both + `reconcile-layout.ts` + `dashboard/page.tsx:38`.
- **Files:** three files. **Verification:** arrange at 375px → reload → identical. **Acceptance:** layout persistence exact at all breakpoints.

### FE-DASH-02 · MISSING — Widget catalog gaps per role
- **Scope:** `dashboard/page.tsx`.
- **Problem:** HR lacks Announcements & Upcoming Holidays; employee lacks QuickNotes & UpcomingHolidays; `RecentActivityWidget` super_admin-only (fine); **`TeamAttendanceWidget` and `UpcomingHolidaysWidget` are imported but mounted for no role — dead code** (`:33,35`).
- **Objective:** mount UpcomingHolidaysWidget for employee+HR; QuickNotes for employee; delete or mount TeamAttendanceWidget (HR already has HrTeamAttendance — likely delete TeamAttendanceWidget as duplicate); expose widget visibility/customize UI (show/hide per widget in an "Edit dashboard" mode persisted via preferences — engine already persists layout; add `visibleWidgets` to the same payload).
- **Files:** `dashboard/page.tsx`, widget-engine (customize mode), preferences payload. **Verification:** role catalogs complete; user can hide widgets; reload respects. **Acceptance:** no dead widget components; per-role defaults sensible.

### FE-DASH-03 · UX — Loading strategy & error recovery
- **Scope:** `dashboard/page.tsx:197-217`.
- **Problem:** full-page spinner while init loads (staleTime 5min so usually cached ✓); isError → whole dashboard replaced by retry (widgets have own ErrorBoundaries ✓).
- **Objective:** skeleton grid mirroring widget layout instead of centered spinner; error state with logout/retry; keep `?error=unauthorized` toast (works ✓).
- **Files:** page. **Verification:** cold-load shows skeleton grid ≤ layout shift. **Acceptance:** no layout jump.

### FE-DASH-04 · WIRING — Metrics keys audit
- **Scope:** `widgets/metric-widget.tsx`, backend `DashboardController@metrics`.
- **Objective:** assert every `metricKey` used by widgets (`total_employees`, `active_projects`, `pending_tasks`) exists in metrics payload for the *rendering role* (employee metrics must include `active_projects`/`pending_tasks` — verify; add if missing); document the metric contract in one place.
- **Files:** widget + backend. **Verification:** employee/HR/admin dashboards show real numbers, never "–". **Acceptance:** zero undefined metric lookups.

### FE-DASH-05 · PERF — Init payload weight
- **Scope:** backend `DashboardController@init` (metrics+prefs+approvals+pins+announcements+quick_notes+attendance_today), `use-dashboard-init.ts`.
- **Objective:** with FE-CORE-11 remove `pins`; split volatile `attendance_today` (already outside cache ✓) — consider `?include=` param so chat page consumers don't drag metrics; keep single endpoint for the dashboard. Optional; measure first (`check-bundle-size`/network panel).
- **Files:** backend + hook. **Verification:** init < 150ms TFB on seed data. **Acceptance:** payload pruned of dead keys.

---

# P7 — Reports, Settings & Audit

### FE-REP-01 · BUG/UX — Export history: polling + downloads
- **Scope:** `components/reports/export-history.tsx`.
- **Problem:** one-shot fetch (no `refetchInterval` while `processing`); `item.file_path` raw href — verify controller returns consumable URL (S3 dependency — degrade with error state); no auto-refresh on new job (FE-CORE-04 adds).
- **Objective:** poll 5s while any processing (stop when none); download via server URL with authed fetch → blob (file may be private); failed jobs show backend `error` column if present.
- **Files:** component. **Verification:** queue running → completes & downloads; queue dead → honest "stuck" state with refresh. **Acceptance:** exports observable end-to-end.

### FE-REP-02 · CONSISTENCY — Reports surfaces alignment
- **Scope:** `report-builder.tsx` (4 keys), `admin/reports/page.tsx` (attendance-summary/leave-summary ✓ routes exist), `saved-report-views.tsx`.
- **Items:** (a) verify `data()` response `{data:{data:…}}` shape per key vs builder table render (spot-fix unwrap via CORE-03); (b) saved views gated implicitly by page (super_admin) but backend gates `settings.manage` — HR with `reports.view` uses builder w/o saved views — acceptable, document; (c) add attendance-summary/leave-summary keys to the *admin* builder only if scope demands (already separate page — keep); (d) CSV format option missing in UI (backend allows xlsx,csv,pdf) — add format select.
- **Files:** builder + admin page. **Verification:** each report key renders columns + export all three formats. **Acceptance:** reports fully functional per role.

### FE-SET-01 · MISSING — Mount demo-data & system-jobs tabs
- Covered by **FE-CORE-11** (referenced here for module completeness): Settings tabs "Demo Data" and "System Jobs" for `settings.manage`.
- **Acceptance:** super_admin can purge/seed demo data; view + retry failed queue jobs.

### FE-SET-02 · WIRING — Settings keys ↔ UI field parity audit
- **Scope:** `settings-tabs.tsx` + the 10 config components vs backend `SettingsController@index (grouped)` / reads.
- **Problem class:** any UI field persisting a key no consumer reads (silent no-op settings) or backend setting without UI.
- **Objective:** extract `GET /settings/grouped` key list; diff against every `settings/bulk` payload key sent by config components; fix orphans both directions; add a settings search (cmd palette integration optional).
- **Files:** config components + backend key audit doc. **Verification:** toggling each setting shows its documented effect or is removed. **Acceptance:** zero orphan setting keys.

### FE-SET-03 · UX — Settings tab resilience
- **Scope:** `settings-tabs.tsx`.
- **Items:** deep-link `?tab=audit` works (audit redirect lands here ✓ after CORE-06 param fix → audit table prefilters `action`/`user_id`); each tab lazy-loads heavy tables; unsaved-changes guard on tab switch for form tabs (mail/policies).
- **Files:** settings-tabs + audit-log-table. **Verification:** deep link from attendance manual-badge filters audit rows. **Acceptance:** settings navigable + guarded.

### FE-SET-04 · BUG — Audit log table details
- **Scope:** `settings/audit-log-table.tsx`.
- **Items:** verify `/audit-logs` filter params (action/user_id/date range/page) supported by `AuditLogController@index` — align; export `/audit-logs/export` streaming vs job (verify — wire per CORE-04 pattern); FE-CORE-14 mobile.
- **Files:** component + backend check. **Verification:** filters + export work. **Acceptance:** audit usable for compliance spot-checks.

### FE-SET-05 · UX — Security requests (admin password resets)
- **Scope:** `settings/security-requests-config.tsx`.
- **Status:** endpoints `/admin/password-resets` approve/reject ✓; ensure forgot-password UX mentions the approval flow (user side: forgot page says "check email" even when SMTP unconfigured → approval path — align copy: "If email is unavailable, an administrator must approve your reset" per backend `forgotPassword` dual-path `AuthController.php:412-440`).
- **Files:** security config + `forgot-password/page.tsx` copy. **Verification:** reset request → appears in security tab → approve → user resets. **Acceptance:** closed loop.

### FE-PROFILE-01 · UX — Profile page audit
- **Scope:** `dashboard/profile/page.tsx` (857 ln).
- **Status:** avatar upload (`/profile/avatar` ✓), preferences PUT, change-password, sessions list/revoke ✓.
- **Items:** (a) `?tab=settings` legacy deep link from palette ("Admin Settings" → profile?tab=settings — after CORE-01 retarget to `/dashboard/settings`); (b) split 857-line page into tab components (CONSISTENCY); (c) verify avatar URL from storage renders (S3 dependency); (d) add "download my data" if product wants (defer).
- **Files:** profile page → `components/profile/*.tsx`. **Acceptance:** profile tabs modular, links correct.

---

# P8 — Auth Flow Hardening

### FE-AUTH-01 · BUG — `must_change_password` dead-end (CRITICAL)
- **Scope:** `api-client.ts` (403 handler `:129-135` handles only `needs_onboarding`), `auth-guard.tsx:61-94`, `login/page.tsx:77-83`, onboarding password step skip (`onboarding/page.tsx:271-280`).
- **Problem/RCA:** backend `ForcePasswordChange` 403s **every** route with `{must_change_password: true}` except change-password/logout; login response includes the flag but the redirect chain ignores it; a user who skips the onboarding password step (or gets flagged later via admin reset — `resetPassword` sets `must_change_password=true` per `UserController`) lands on a dashboard where every query 403s with no escape.
- **Objective:** (a) login redirect: `must_change_password` → `/change-password` first; (b) AuthGuard redirect effect: `user.must_change_password && pathname !== "/change-password"` → push; (c) api-client 403 branch: `errorData.must_change_password` → set user flag in store + redirect once (mirror the `needs_onboarding` pattern); (d) onboarding: remove "Skip for now" when `must_change_password` is true (backend will block completion anyway).
- **Dependencies:** none. **Backend contract:** already returns the flag everywhere needed.
- **State/data:** store flag update keeps token valid (change-password route is exempt from the 403 wall ✓).
- **UX:** change-password page already handles post-change refresh + onward routing ✓ (`change-password/page.tsx:61-96`).
- **Files:** four files. **Verification:** admin resets password → user's next request bounces to change-password → change → dashboard functional. **Regression:** normal login/onboarding flows unaffected. **Acceptance:** no state where the app 403-loops.

### FE-AUTH-02 · BUG — Stale capability cookie after role switch
- **Scope:** FE-CORE-16 (single writer) + this: after `roleSelect`/`switchRole`, `/me/capabilities` must refetch before nav renders (token change already re-keys the query `capabilities(token)` ✓ — verify cookie rewritten by `setAuth` with fresh caps ✓ happens; residual risk: `PUT /auth/role` switch mid-session (profile? unused) — ensure any role switch path refetches caps).
- **Files:** auth-store/capabilities. **Verification:** HR↔employee dual-role user switches → middleware + nav re-gate instantly. **Acceptance:** no stale-cookie lockouts.

### FE-AUTH-03 · UX — Multi-tab session sync
- **Scope:** `auth-store.ts` (persist `g4k-auth`).
- **Problem:** logout/401-clear in one tab doesn't sign out others (no `storage` listener); session.revoked realtime covers it only when realtime alive.
- **Objective:** `persist` store subscription broadcasting auth clears across tabs (`BroadcastChannel` or storage event) → other tabs redirect to login.
- **Files:** auth-store + a small `tabs-sync.ts`. **Verification:** logout in tab A → tab B redirects. **Acceptance:** session state coherent across tabs.

### FE-AUTH-04 · UX — Login/lockout copy & rate-limit parity
- **Scope:** `login/page.tsx:84-90`.
- **Status:** 423 lockout handled ✓ (matches backend custom 423 + retry_after ✓ verified); also handle route-level `throttle:6,1` 429 with friendly message; show "identifier" ambiguity hint.
- **Files:** login. **Verification:** 6 rapid failures → lockout UX correct. **Acceptance:** all failure modes communicated.

### FE-AUTH-05 · CLEANUP — Role-select polish
- **Scope:** `role-select/page.tsx:28-32` auto-selects when single role (extra POST churn) — skip POST and set active locally when `roles.length===1` (backend defaults active_role on login? verify; if not, keep POST but avoid double-render loop `:67-77` spinner for single-role users).
- **Files:** page. **Acceptance:** single-role users never see role-select spinner state.

---

# P9 — Accessibility, Responsive, Performance, Consistency (final pass)

### FE-A11Y-01 · Consolidated a11y remediation
- Executed via **FE-CORE-13** checklist + module-specific items (calendar keyboard nav, kanban move menu, chat aria-live, charts). Acceptance gate: axe-clean main flows; Lighthouse a11y ≥95 on 5 core pages.

### FE-RESP-01 · Consolidated responsive remediation
- Via **FE-CORE-14** (tables/cards/filters) + FE-ATT-13, FE-CHAT (mobile keyboard handling already present via visualViewport ✓ keep), settings tabs scroll, admin consoles. Acceptance gate: zero horizontal page scroll at 375px; bottom nav never overlaps content (pb-safe ✓); all dialogs `max-h-[90dvh]` scrollable (verify each).

### FE-PERF-01 · Bundle & runtime audit
- **Scope:** `scripts/check-bundle-size.js` (exists), echarts imports (hr-graph module-level `echarts.use` — move inside dynamic to keep it out of shared chunks ✓ mostly done), `cmdk`/`frappe-gantt` dynamic ✓, `web-vitals.tsx` reporting target post-Sentry (verify it no-ops or wires to `/api/version`-style collector — remove if dead), `providers.tsx` dynamic `sonner` imports fine.
- **Objective:** run `pnpm --filter web build` + analyzer; enforce first-load JS budget per route in CI (extend existing script); lazy-mount admin/HR console tabs.
- **Verification:** budgets green in CI. **Acceptance:** measured, enforced budgets.

### FE-PERF-02 · Query hygiene
- **Scope:** `query-keys.ts` + consumers.
- **Items:** unify duplicated key families (`orgLeaveRequests` vs `orgLeaveRequestsPaginated` same prefix — OK but document; `usersList` vs `usersPaginated` vs ad-hoc `["users", deptFilter]` in admin table `:80` — migrate to `usersSelectList`); ensure invalidation-map covers new mutations (work-schedules, holidays CRUD currently invalidate locally ✓ — move to map for consistency).
- **Files:** query-keys, invalidation-map, consumers. **Verification:** after any CRUD, all affected views refresh without reload (scripted walkthrough). **Acceptance:** invalidation map complete + typed.

### FE-CONSISTENCY-01 · Form system unification
- **Scope:** app-wide forms.
- **Problem:** three patterns coexist: react-hook-form+zod (auth, users), local useState (task create, announcement create, correction dialog), OneFieldForm; error display varies (ValidationSummary vs toast vs inline).
- **Objective:** standardise on `useForm`+zod+`Form` components for multi-field forms; keep `OneFieldForm` for single-field; field errors inline + `ValidationSummary` on submit failure; adopt or delete `use-form-errors.ts` (FE-CORE-02) as the server-error mapper (it exists precisely for Laravel 422 mapping).
- **Files:** the ~8 useState-based forms + shared helpers. **Verification:** each form rejects invalid input pre-flight and maps 422s to fields. **Acceptance:** one form idiom.

### FE-CONSISTENCY-02 · Date/time & timezone conventions
- **Scope:** `lib/format.ts` (23 lines), all consumers.
- **Problem:** mixed `new Date(x).toLocaleTimeString` and `safeFormat`; backend timestamps are app-timezone strings; midnight-parsing risk on bare `YYYY-MM-DD`.
- **Objective:** all display through `lib/format.ts` (safeFormat/safeFromNow + new `safeTime`, `formatDuration` replacing the 4 duplicated `formatSecs`); document parse rules (`parseISO` for date-only).
- **Verification:** grep shows no raw `toLocaleTimeString` outside format lib. **Acceptance:** single date idiom.

### FE-CONSISTENCY-03 · Status badge & colour taxonomy
- **Scope:** `StatusBadge` usage vs ad-hoc Badge/Tailwind chips (tasks list, leave rows, user status).
- **Objective:** map every entity status → badge variant centrally (`lib/status.ts`); includes attendance statuses incl. future `overtime`/`half_day` handling (FE-ATT-08).
- **Acceptance:** uniform status rendering app-wide.

---

## Execution order & dependency graph

1. **P0 first:** CORE-03 (unwrap) + CORE-07 (tests green) unblock everything; CORE-01/02/05/06/16 next; CORE-04 with backend export summary; CORE-08 needs one backend endpoint.
2. **P1/P2 in parallel** after CORE-03 (ATT-01, LEAVE-01 are one-line-class fixes once unwrapping exists; CHAT-01 is the highest-impact single fix — ship immediately).
3. **P3/P4/P5** module order by user pain: LEAVE → ATT remaining → ORG → PROJ.
4. **P6–P8** interleavable; AUTH-01 is P0-severity — schedule within the first batch.
5. **P9** continuous; gate releases on its acceptance checks.

**Backend coordination list (frontend-blocking):** `meHistory/hrHistory month param` (FE-ATT-02) · `messages` order desc (FE-CHAT-01) · export `download_url` + filters parity (FE-CORE-04, ATT-05, LEAVE-01 search) · `hrToday/overview` summary meta (FE-ATT-06) · `meDay standard_seconds` (FE-ATT-08) · `/users/options` light endpoint (FE-CORE-08) · leave balances + attachments (FE-LEAVE-05/07) · bulk tasks endpoint (FE-PROJ-06) · chat group leave/add-members (FE-CHAT-09) · remove `pins` from init (FE-CORE-11).

## Verification & regression protocol (applies to every task)

- `pnpm --filter web typecheck` and `pnpm --filter web test` green (post FE-CORE-07).
- Per-task verification commands/criteria as listed; where live behavior is asserted, verify against seeded local backend (`php artisan serve` + sqlite seed) since CI tests are sqlite-only.
- Regression checklist per module page: cold-load skeletons → data renders → each filter/sort/search → each mutation → invalidation → responsive 1440/768/375 → keyboard path → error state (kill API) → empty state (fresh DB).
- Final acceptance: run the full walkthrough script per role (employee / hr / super_admin) covering every nav destination; zero console errors; zero network 404/403 from reachable UI.

---

## Appendix A — Verified dead/duplicate inventory (remove or mount)

| Item | Location | Disposition |
|---|---|---|
| Nav prefetch for dead routes | `nav-group.tsx:38-53` | delete (CORE-02) |
| `shortcut-action-new` | `use-shortcuts.ts:30` | delete (CORE-02) |
| `api-error` listener | `providers.tsx:104-114` | delete or dispatch from api-client 403s (decide in CORE-02; prefer delete) |
| `useWorker` hook | `hooks/use-worker.ts` | delete (CORE-02) |
| `useFormErrors` | `hooks/use-form-errors.ts` | adopt in CONSISTENCY-01 or delete |
| Pins (backend+init+queryKey) | `routes/api.php:83-85`, `DashboardController@init`, `query-keys.ts:79` | remove from init + queryKeys; backend removal optional (CORE-11) |
| `TeamAttendanceWidget` | `components/dashboard/team-attendance-widget.tsx` | delete (superseded by HR widget) (DASH-02) |
| `UpcomingHolidaysWidget` | `components/widgets/upcoming-holidays-widget.tsx` | mount for employee+HR (DASH-02) |
| `DemoDataConfig` / `SystemJobsConfig` | `components/settings/*` | mount as settings tabs (CORE-11) |
| `/dashboard/announcements` page | `app/dashboard/announcements/*` | redirect to chat tab (CORE-10) |
| `packages/ui/src/api` generated client | `packages/ui/src/api/**` | delete (CORE-12) |
| Duplicate `userSchema` | `org/users/page.tsx:68` vs `user-edit-dialog.tsx:9` | single schema (ORG-03) |
| Duplicate `formatSecs` ×4 | attendance components | `lib/format.ts` (ATT-09/CONSISTENCY-02) |
| HR/Admin analytics + tables + graphs near-duplicates | attendance components | consolidate (ATT-11) |
| Announcement board on chat sidebar | `chat-tab.tsx:327` | remove (CORE-10) |

## Appendix B — Contract shape reference (verified this audit)

| Endpoint | Actual shape | Consumers must |
|---|---|---|
| `/attendance/me/history`, `/attendance/hr/history/{id}` | cursor paginator `{data, next_cursor}` (30) | month param (planned) / unwrap `.data` |
| `/attendance/me/today`, `dashboard/init.attendance_today` | `{day, events[], standard_seconds}` | events use `timestamp` |
| `/attendance/me/day/{d}`, `/hr/day/{d}/{u}` | `{day, events, projects, tasks}` (no standard_seconds) | add or default |
| `/attendance/admin/overview`, `/hr/today`, `/admin/graph`, `/hr/graph` | flat paginator / `{stats, mode}` | unwrap; graph `.stats` ✓ |
| `/attendance/export`, `/leave-requests/export`, `/reports/export` | async `{message, job_id}` | job flow (CORE-04) |
| `/users/export`, `/departments/export`, `/designations/export`, `/audit-logs/export` (verify) | streamed file | blob download ✓ |
| `/leave-requests`, `/history`, `/admin/history`, `/pending` | flat paginator | unwrap |
| `/conversations` | cursor paginator 50 + `unread_count`, `latestMessage.sender` | infinite (CHAT-04) |
| `/conversations/{id}/messages` | cursor paginator; rows: `sender_id`, `sender`, `reads[]`, `pinned_at`, `attachment_url` | order fix (CHAT-01) |
| `/notifications` | flat paginator; supports unreadOnly/importantOnly/type/priority/search | ✓ as built |
| `/tasks` | flat paginator; task detail: `qa_form.fields[].required/field_type`, `time_logs`, `activities`, `comments` | QA fix (PROJ-01) |
| `/timer/log` | `{task_id?, project_id?, minutes_logged, …}` | ✓ |
| `/qa-forms` | flat paginator of forms | unwrap (PROJ-02) |
| `/dashboard/init` | `{metrics, preferences, pending_approvals, pins, announcements, quick_notes, role, attendance_today}` | pins removal planned |
| Login/refresh/role-select | `{token, user, active_role, refresh_token?, capabilities?, onboarded, must_change_password}` | use must_change_password (AUTH-01) |

*End of plan. Generated from a full source audit on 2026-08-16; all file:line references verified against the working tree at audit time.*
