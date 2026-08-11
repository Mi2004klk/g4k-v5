# fix-3.md — Games4King Workplace OS: Final Implementation Blueprint (Exhaustive Checklist)

> **Companion to `context.md`.** This is the single, ordered, dependency-aware checklist to take the
> app from its current broken/slow state to a fully wired, polished, responsive, fast, consistent,
> accessible, deployment-ready product. Every checkbox is specific enough for an AI developer to
> execute one-by-one without guessing. **Do not implement without reading `context.md` first.**
>
> **Bug IDs** (CRB-/HIG-/UX-/PERF-/MED-/LOW-) cross-reference `context.md` §8 and the audit findings.
> **REQ IDs** (R1.x–R13.x) reference `openspec/REQUIREMENTS.md`. **P-\*** reference
> `openspec/PERFORMANCE-STANDARDS.md`.
>
> **Convention:** `[ ]` = todo. Each task states: area → expected behavior → acceptance criteria.
> Verify after each: lint + type-check + relevant tests + manual smoke at 360/768/1024/1440px.
>
> **Phase order follows:** consolidate → design system → shared components → global layout/nav →
> header/sidebar → dashboard → every module/page → forms/states → role workflows → backend wiring →
> responsive → accessibility → performance → animations → functional QA → visual QA → regression →
> production-readiness.

---

## PHASE 0 — Pre-flight & shared foundations

### 0.1 Freeze the source of truth
- [x] **0.1.1** Delete or archive stale planning files so they cannot mislead: keep `context.md`,
  `fix-3.md`, `openspec/*`. Move `finalization.md` (stale M1-cutoff), `fix-1.md`, `fix-2.md`,
  `tracker-new.md`, `implementation-plan.md`, `plan-future-modules.md` into `docs/archive/` with a
  header noting they are superseded by `context.md`/`fix-3.md`.
- [x] **0.1.2** Update `openspec/TRACKER.md` phase status from the inaccurate "all ✅" to reflect
  reality: "Implementation present; in-revamp per `fix-3.md`." Do not claim ✅ on any phase until its
  acceptance criteria here pass.

### 0.2 Tooling & guardrails (must exist before changes — CI gates regressions)
- [x] **0.2.1** [test] Add `@next/bundle-analyzer` + a CI budget check: First-Load JS ≤200KB gz per
  route, route chunk ≤350KB gz (P-BUNDLE / R13.7). Fail the build on breach.
- [x] **0.2.2** [test] Add **Lighthouse CI** on PRs for `/login`, `/dashboard`, `/dashboard/attendance`,
  `/dashboard/leave`, `/dashboard/org/users`, `/dashboard/chat` with targets LCP≤2.5, INP≤200,
  CLS≤0.1, FCP≤1.8 (P-LCP/INP/CLS/FCP).
- [x] **0.2.3** [test] Add **axe-core** CI step (zero critical/serious) on the primary routes
  (P-A11Y / R13.23).
- [x] **0.2.4** [test] Add a Laravel query-count test helper (`DB::enableQueryLog`) and a test
  asserting ≤5 SQL per list request + zero N+1 on `/users`, `/attendance/me/history`,
  `/attendance/admin/overview`, `/attendance/hr/today`, `/leave-requests`, `/audit-logs`,
  `/reports/attendance-summary` (P-NO-N1/Q-COUNT / R13.5).
- [x] **0.2.5** [test] Add a React Profiler render-count test on a 1000-row attendance log +
  users table (P-RERENDER / R13.12).
- [x] **0.2.6** Confirm Sentry DSNs (api + web) are wired and `laravelpulse` is collecting; add
  web-vitals field collection (P-MON / R13.28).
- [x] **0.2.7** Ensure production build has no sourcemaps, vendor split on, tree-shake on, React
  prod build (P-BUILD / R13.27).

### 0.3 Environment & deploy sanity
- [x] **0.3.1** Confirm Railway builds from root `nixpacks.toml` with PHP 8.4 (watch build log for
  `Setting up php84`, `cd apps/api && composer install`). Confirm `curl https://<railway>/api/ping`
  → `{"status":"ok"}` and login returns 200 + token (do not reintroduce the historical login-404 chain).
- [x] **0.3.2** Confirm Vercel `NEXT_PUBLIC_API_URL` is the Railway bare host (no `/api`) for
  Production + Preview environments.
- [x] **0.3.3** Add missing env keys to `.env.example` and Railway/Vercel: `BROADCAST_CONNECTION=reverb`,
  `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT`,
  `VITE_REVERB_*`/`NEXT_PUBLIC_REVERB_*` as the client expects (fixes CRB-13).

---

## PHASE 1 — Establish the single design system in code

> Goal: one consistent token set + base primitives. Every later phase consumes these.

### 1.1 Fix the token map (root cause of "invisible" text)
- [x] **1.1.1** [web] In `apps/web/src/app/globals.css` fix the `--color-muted` mapping: it currently
  maps to `var(--bg-surface-2)` (a background token, near-white) which makes every `text-muted`/
  `border-muted`/`bg-muted` utility resolve wrong. Map `--color-muted` to `var(--text-muted)` and
  `--color-muted-foreground` already to `var(--text-muted)`; or remove all `*-muted` utility usages
  and replace with explicit `text-secondary`/`text-neutral-500` (fixes the invisible sidebar chevron
  at `layout.tsx:303` and search button at `:392` — the latter is removed in Phase 4 anyway).
  **Acceptance:** `grep -r "text-muted\|border-muted\|bg-muted" apps/web/src` returns only correct
  usages; the sidebar chevron is visible at rest.
- [x] **1.1.2** [web] Verify all FROZEN tokens render in both light + dark: brand accents
  (`#8A2BE2`/`#9400D3`/`#FFD700`/`#FF1493` + rotation), semantic (`success/info/warning/danger/
  neutral-status/overtime`), surfaces, borders, text scale. Add a `tokens` storybook/route showing
  every token for visual QA.
- [x] **1.1.3** [web] Add the brand gradient utility `bg-gradient-brand`
  (`linear-gradient(135deg,#9400D3 0%,#8A2BE2 50%,#FF1493 100%)`) and gold gradient `bg-gradient-gold`
  (`linear-gradient(135deg,#FFD700 0%,#FFA500 100%)`) as Tailwind v4 `@utility` entries. Document:
  gradients ONLY on sign-in hero, dashboard headers, logo lockups, focus-ring brand moments.

### 1.2 Motion tokens (defined once)
- [x] **1.2.1** [web] Add motion CSS variables / Tailwind theme entries matching DESIGN-SYSTEM §8:
  `--duration-tap 120ms`, `--duration-hover 100ms`, `--duration-popover 150ms`,
  `--duration-sidebar 220ms`, `--duration-drawer 200ms`, `--ease-modal cubic-bezier(0.16,1,0.3,1)`,
  `--ease-sidebar cubic-bezier(.4,0,.2,1)`. Reduced-motion: all durations → ≤1ms, no scale.
- [x] **1.2.2** [web] Add the primary-button rainbow-hover: default solid charcoal; hover = animated
  conic-gradient border rotating through the accent palette (3s linear infinite) + subtle brand glow
  box-shadow; active 0.96 scale; loading = dot-loader; disabled 40% opacity; **reduced-motion →
  static subtle border**. Implement once in `packages/ui` Button (COMPONENT-SYSTEM §1).

### 1.3 Fix shared primitives (packages/ui)
- [x] **1.3.1** [ui-pkg] **Button `[&_svg]:size-4` override** (`button.tsx:8`) forces every descendant
  SVG to 16px → icon spill. Scope it: apply `size-4` only inside explicit size variants, or remove and
  set icon sizes at call sites. **Acceptance:** icons declared `w-5 h-5` render at 20px; tight `h-8`
  buttons don't overflow (UX-/M2 from audit).
- [x] **1.3.2** [ui-pkg] **EmptyState** (`empty-state.tsx`): do NOT autoplay `/animated-logo.mp4`
  inside small containers by default. Require an explicit `icon` or `videoSrc`; if neither, show a
  neutral Lucide icon (e.g. `Inbox`). **Acceptance:** metric widgets show a quiet icon, not a video.
- [x] **1.3.3** [ui-pkg] **DataTable** (`data-table.tsx`): make height configurable (drop the fixed
  `h-[600px]`); document that call sites must pass `fetchNextPage`/`hasNextPage` for infinite scroll
  (warn/no-op otherwise, never silent). Add a "Load more" button fallback when those are absent and a
  cursor is present. **Acceptance:** no list silently stuck on page 1.
- [x] **1.3.4** [ui-pkg] **FilterBar** (`filter-bar.tsx`): add the optional `type?: "select"` field to
  the `FilterOption` interface (or remove the prop from call sites) so TS strict passes.
- [x] **1.3.5** [ui-pkg] Remove duplicate barrel exports (`combobox` ×2, `avatar` ×2 in `index.ts`).
- [x] **1.3.6** [ui-pkg] Verify all primitives implement the full state machine (rest/hover/
  focus-visible/active/disabled/loading/error) and visible 2px brand-violet focus ring with 2px
  offset on `:focus-visible` only. Add axe-core assertions.
- [x] **1.3.7** [ui-pkg] Ensure Dialog/Sheet/AlertDialog always render a Description (or
  `aria-describedby`), trap focus, restore focus to trigger, close on Esc (Dialog only, not
  AlertDialog), and position without viewport escape.

### 1.4 Standardize icon usage
- [x] **1.4.1** [web] Audit every icon+text row: replace `mr-1`/`mr-2` patterns with `flex items-center
  gap-2`. Known: `notifications/page.tsx:122,127,145`, `admin/attendance/page.tsx:28,32,36`.
- [x] **1.4.2** [web] Lucide icons only, consistent stroke-width 1.75; no emoji icons; distinct icon
  per module per §4.2 mapping (Dashboard=Blue, Attendance=Green, Leave=Amber, Directory=Pink,
  Org=Indigo, Settings=Teal, Audit=Rose, Profile=Cyan, Notifications=Orange, Announcement=Megaphone).

---

## PHASE 2 — Clean shared architecture (state, data, offline)

### 2.1 Single token-reading helper (fixes UX-15 export 401s)
- [x] **2.1.1** [web] Create one helper `getAuthToken()` in `lib/auth-store.ts` that returns
  `useAuthStore.getState().token`. Replace ALL raw `fetch` token reads with it:
  - `users/page.tsx:186-189` (`localStorage.getItem('token')` → helper)
  - `departments/page.tsx:130`, `designations/page.tsx:112` (same)
  - `settings-tabs.tsx:56-62` (logo upload `localStorage.getItem('g4k_token')` → helper)
  - `audit-log-table.tsx:42-57` (same)
  - `org/leave/page.tsx:96-98` (dead `window.location.href` export — see 6.5.4)
  **Acceptance:** Users/Departments/Designations/Audit/Logo exports send a real Bearer token and
  download successfully (no 401).

### 2.2 Fix the retry/performance defaults (PERF-1)
- [x] **2.2.1** [web] `providers.tsx`: reduce React Query `retry` to `1` for queries (keep `0` for
  mutations unless explicitly safe). Remove the api-client GET retry loop OR cap it at 1; never stack
  two retry layers. Target: a flaky endpoint shows content/error within ~5s, not ~2min.
- [x] **2.2.2** [web] Set per-entity `staleTime` defaults in a central `lib/query-keys.ts`:
  directories/departments/designations/holidays = 5m; dashboards/metrics = 30s; attendance "today" =
  30s; static config = 1h; notifications = 10s. Replace duplicated `staleTime:30000` literals
  (`metric-widget.tsx:35`, `recent-activity-widget.tsx:14`) with the shared constant (PERF-9).
- [x] **2.2.3** [web] Standardize loading UI: every widget/list shows a **skeleton shaped like the
  content**, never a bare `Loader2` or full-card spinner. Replace bare spinners in
  `admin-today-attendance-widget.tsx:46-49`, `hr-team-attendance-widget.tsx:43-47`,
  `time-clock-widget.tsx:116-121`. Empty must be distinguishable from loading
  (announcement-board/quick-notes currently show `data ?? []` for both — add `isLoading`/`isError`).
- [x] **2.2.4** [web] Add `isError` + retry UI to announcement-board, quick-notes, feedback-form,
  and every widget (P-RESILIENT / R13.21).

### 2.3 Isolate the live timer (PERF-3 / R5.14)
- [x] **2.3.1** [web] Refactor the attendance timer out of the global `timer-store` ticking pattern.
  Create a dedicated `<LiveTimer/>` component that uses `requestAnimationFrame` (or a 1s interval
  scoped to itself), reads initial seconds from React Query cache, and **does not** publish ticks to
  any global store. Other widgets must not re-render when the timer ticks. **Acceptance:** React
  Profiler shows only `<LiveTimer/>` committing each second; dashboard siblings do not.

### 2.4 Offline Engine correctness
- [x] **2.4.1** [web] Fix the punch-type → endpoint mapping so **Start Break** and **End Break** hit
  real routes (CRB-2). Either (a) rename API routes to `/attendance/break-start` + `/attendance/
  break-end`, or (b) map types explicitly in `offline-engine.ts:163` (`break_start`→`start-break`,
  `break_end`→`end-break`). **Acceptance:** Start/End Break sync succeeds (no silent `syncStatus=
  'failed'`).
- [x] **2.4.2** [web] Surface sync failures to the user (currently swallowed at
  `offline-engine.ts:174-178`). On a failed punch sync, show a danger toast with Retry + keep the
  optimistic state rolled back to the server's last known status via `fetchTodayStatus()`. (Fixes
  H4 silent data loss.)
- [x] **2.4.3** [web] Convert `TimeClockWidget` to React Query (`useQuery` for today status, mutation
  for punches) so it gets caching + background refetch (PERF-11). Keep the optimistic update + the
  new rollback path.

### 2.5 Realtime enablement (CRB-12/13)
- [x] **2.5.1** [api] Set `BROADCAST_CONNECTION=reverb` in `.env.example` + Railway; ensure Reverb
  service is running on Railway. Verify events broadcast on all 3 channel types.
- [x] **2.5.2** [api] Authorize the `conversation.{id}` private channel in `routes/channels.php`:
  return true only if the authenticated user is a participant of the conversation (check
  `conversation_user`). Also authorize any presence channels used.
- [x] **2.5.3** [api] Make `ApprovalSubmitted` implement `ShouldBroadcast` (broadcast to the
  approver's private channel) — see CRB-6/13.
- [x] **2.5.4** [api] Fix the double broadcast (PERF-8): either remove the broadcast from
  `NotificationObserver::created` OR from `NotificationService::send` — keep exactly one path. Verify
  raw `Notification::create()` callers (FeedbackController, AttendanceController::correct, suspicious
  login, jobs) still broadcast exactly once.

---

## PHASE 3 — Global layout, navigation & header

### 3.1 Three-state sidebar (UX-5)
- [x] **3.1.1** [web] `lib/ui-store.ts`: extend `SidebarState` to `"hidden" | "collapsed" | "expanded"`.
  Default `"collapsed"`. `cycleSidebarState` per design:
  on desktop collapsed↔expanded; "hidden" is the mobile state. Persist + sync to `/auth/preferences`.
- [x] **3.1.2** [web] `dashboard/layout.tsx`: implement all three states with the 220ms glide
  (`cubic-bezier(.4,0,.2,1)`). Labels fade (opacity 120ms) before width transitions; collapsed icons
  fade in. Reserved width to keep CLS ≤0.1.
- [x] **3.1.3** [web] Ctrl+B cycles states; tooltip on the toggle shows current action.

### 3.2 Reliable toggle + logo rules (UX-6, UX-7)
- [x] **3.2.1** [web] Move the sidebar control **inside the visible boundary** (not `absolute
  -right-[18px] top-20` outside an `overflow-hidden` ancestor). When **expanded**, place the control
  correctly on the **left of the landscape logo** in the sidebar header. When **collapsed**, the
  square 1:1 logo is shown; **hovering the logo smoothly transitions to the sidebar control**;
  clicking opens (expands) the sidebar.
- [x] **3.2.2** [web] Use the correct logo assets: collapsed = square `1.1 Logo.png` (or `/icon.png`
  if that's the square asset) at 1:1; expanded = `Landscape-Logo.png` (currently unused on disk — wire
  it in). Never stretch/recolor/shadow the logo. Maintain clear space = 1× logo height.
- [x] **3.2.3** [web] Fix the chevron color (no `text-muted`); use `text-secondary`/`text-neutral-500`
  at rest, `text-primary` on hover. Verify visible in both themes.

### 3.3 Required nav items + labels (UX-4, UX-8)
- [x] **3.3.1** [web] Update `navGroups` to include exactly the required items with correct labels
  and distinct icons:
  - **Dashboard** (LayoutDashboard, blue)
  - **My Attendance** (Clock/CalendarCheck, green) — rename from "Attendance"
  - **Projects** (FolderKanban, indigo)
  - **Chat** (MessageSquare, pink) — rename from "Chat & Hub"
  - **Announcement** (Megaphone, orange) — NEW item; route to `/dashboard/announcements` (build the
    page in Phase 8) or to the announcements section of chat per design decision
  - **My Profile** (UserCircle, cyan) — rename from "Profile"
  Plus role-aware items: Org (users/departments/designations/directory) for Admin/HR; Leave; Reports;
  Settings; Audit (Admin). Section headers: "My Work", "People", "Administration", "Account".
- [x] **3.3.2** [web] Verify each item: icon + label in one row (`flex items-center gap-3`); active =
  violet-tinted bg + 3px brand-gradient left bar + `text-primary` weight 600; hover = `bg-surface-2`;
  collapsed = icon + tooltip (150ms); focus-visible ring; disabled state for unavailable items.
- [x] **3.3.3** [web] Pinned items section at the BOTTOM after primary nav, separated by a divider;
  collapsed = icons + tooltips. Wire star/pin on projects/tasks/profiles.

### 3.4 Header redesign (UX-1, UX-2, UX-3, §4.14)
- [x] **3.4.1** [web] **Remove the search bar** from the top bar entirely (`layout.tsx:387-399`).
  Keep Ctrl+K command palette as the only search/nav surface (no visible search trigger).
- [x] **3.4.2** [web] **Start Shift = icon-only button** with the icon centered (`flex items-center
  justify-center`). Before shift: a play/clock icon "Start Shift" with tooltip. During shift: the
  running timer pill (`<LiveTimer/>`). Replace `topbar-timer.tsx` returning null when inactive —
  always render the control.
- [x] **3.4.3** [web] Header controls (logo+wordmark left, Start Shift, notifications bell, avatar)
  have consistent sizing (h-9/10) and vertical alignment. Sticky; e4 elevation; blurs on scroll.
- [x] **3.4.4** [web] **Notifications = centered modal/popup** (not an end-anchored popover):
  dimmed backdrop, surface card, header with title + close (×), **Clear** action, **Mark as Read**
  action, scrollable recent notifications list, footer "View all" → Notification Center.
  - **Clear removes notifications ONLY from the popup** (a separate UI store slice / "dismissed"
    set), **preserving them in the Chats/Notification Center area** (the backend `notifications` rows
    are untouched). Implement a client-side dismissed-ids list (persisted per user) that filters the
    popup but not the full Notification Center page.
  - Default filter = "recent" (not "unread").
  - Optimistic mark-as-read + unread count decrement; rollback on error.
- [x] **3.4.5** [web] Keep the breadcrumb rendered once (already non-duplicated); ensure each crumb
  is a Link and truncates with ellipsis on narrow widths.

### 3.5 Mobile navigation
- [x] **3.5.1** [web] Sidebar hidden on mobile; **hamburger opens a FULL-SCREEN menu** (not a 280px
  Sheet) with 280ms slide. Include all role-aware nav items + pinned.
- [x] **3.5.2** [web] **Bottom nav ≤5 icons**, primary mobile nav. Align item set with required nav
  (Dashboard, My Attendance, Projects, Chat, My Profile) — replace the current Dashboard/Directory/
  Attendance-FAB/Leave/Profile set (UX-20). Attendance clock action remains prominent (≥48px).
- [x] **3.5.3** [web] AuthGuard loading skeleton matches the collapsed-default sidebar (not 264px
  expanded) to avoid layout shift.

---

## PHASE 4 — Dashboard & Widget Engine

### 4.1 Fix the refetch/flicker loop (UX-10 / PERF-2)
- [x] **4.1.1** [web] `dashboard/page.tsx`: wrap `getWidgetsForRole()` in `useMemo` keyed on
  `activeRole` (and any role-derived flags), so the array reference is stable across re-renders.
- [x] **4.1.2** [web] `widget-engine.tsx`: change the `useEffect([availableWidgets])` dependency to
  `[availableWidgets.length, activeRole]` (or a serialized key). Fetch preferences once on mount.
  Do not reset `loading=true`/`mounted=false` on unrelated re-renders.
- [x] **4.1.3** [web] Debounce layout saves (`onLayoutChange` → save at most every ~500ms and only
  when the layout actually changed vs the last saved) — PERF-10.

### 4.2 Drag-vs-click separation (UX-9)
- [x] **4.2.1** [web] Track drag state in `widget-engine.tsx`: `onDragStart`/`onDragStop` set a
  `draggingRef`. While dragging, set `pointer-events:none` on any in-widget click overlays
  (`admin-today-attendance-widget.tsx:27` absolute `<Link>`, `hr-team-attendance-widget.tsx:76-84`
  "View Full Report"). On pointer-up, require a movement threshold (< N px) to count as a click.
  **Acceptance:** dragging a widget never navigates; only an intentional click opens the detail page.

### 4.3 Collapse/expand for widgets (UX-11)
- [x] **4.3.1** [web] Add collapse/expand to **Quick Notes** (and make it available to all widgets)
  using the existing `Collapsible` primitive. Persist collapsed state per widget per user ( alongside
  the dashboard layout).

### 4.4 Announcement board: likes + cleanup (UX-12, §4.15)
- [x] **4.4.1** [api] Add `POST /announcements/{id}/react` (toggle reaction, one per user) +
  `PATCH/DELETE /announcements/{id}` (update/destroy/pin/unpin) — complete `AnnouncementController`
  (currently index/store only). Enforce author/scope: Admin company-wide, HR team-level. Return
  reaction counts + "did I react" in `index`.
- [x] **4.4.2** [api] Add a unique constraint on `reactions(user_id, reactable_type, reactable_id)`
  so a user can only react once per announcement.
- [x] **4.4.3** [web] `announcement-board.tsx`: add a like/reaction button (heart/thumbs) with count;
  optimistic toggle; one-per-person enforced server-side. Pin toggle + per-user dismiss (close X).
  Author avatar + scope tag.
- [x] **4.4.4** [web] Confirm NO End Shift / Take Break buttons appear below announcements anywhere
  (currently none — keep it that way; remove if any future placement adds them).
- [x] **4.4.5** [web] Subscribe `announcement-board` to the `public-announcements` Reverb channel so
  new announcements appear instantly (CRB-13 fixed + PERF-5). Invalidate the query on event.

### 4.5 Per-role dashboards (R4.6–R4.9, DESIGN-SYSTEM §13)
- [x] **4.5.1** [web] **Super Admin:** Total employees (active/inactive), Active projects, Today
  attendance (present/absent/late), Pending approvals (Large, quick-access list), Recent activity
  feed (dense, no noise), Quick Task Assignment.
- [x] **4.5.2** [web] **HR:** Today team attendance, Active projects, Pending leave requests
  (approve/reject quick), Pending task/project submissions, Quick Task Assignment (notify Global Chat
  on completion).
- [x] **4.5.3** [web] **Employee:** Active projects (mine), Pending tasks, Attendance widget
  (Start/Pause/End + live timer, amber overtime), Recent task progress bar (animate 0→%), Task
  approval status panel (Pending/Approved/Redo).
- [x] **4.5.4** [web] Remove the contradictory "Module pending" subtitle when real data exists
  (H3 — `metric-widget.tsx:111`): the subtitle must reflect reality; if the module is live, show a
  meaningful subtitle, not "Module pending".
- [x] **4.5.5** [api] `DashboardController`: return real `active_projects` for employees (currently
  hard-coded 0 at `:104-105`) and `pending_tasks`/`pending_approvals` counts. Each widget loads
  independently with its own error boundary; lazy via IntersectionObserver.
- [x] **4.5.6** [web] Quick-action shortcuts on each dashboard navigate correctly; verify each link.
- [x] **4.5.7** [web] All dashboard buttons: icon + text in one row (`flex items-center gap-2`).
  Widget icons completely inside their containers (Phase 1.3.1 fix covers this).

---

## PHASE 5 — Backend correctness & security (RBAC, controllers, data)

### 5.1 Fix the capability middleware (CRB-1)
- [x] **5.1.1** [api] `RequireCapability.php:46-62`: support OR-style capabilities correctly. For each
  `capability` string, `explode('|', …)` and grant if the user's role has ANY of them. Remove the
  redundant pre-check that uses the full string with exact `in_array`. Do not log a spurious
  "Capability check failed" on success. **Acceptance:** HR (`attendance.correct-team`) can call
  `POST /attendance/correct` (route middleware `admin.correct-attendance|attendance.correct-team`).
- [x] **5.1.2** [api] Add a fallback so `hasCapability` works even before seed (cache-miss path);
  invalidate the `role_capabilities` cache (3600s) whenever settings/role caps change
  (`SettingsController::bulkUpdate`, any role-cap mutation).

### 5.2 Force password change + onboarding (CRB-7)
- [x] **5.2.1** [api] `ForcePasswordChange.php:20`: remove the `if (false && …)` gate; enforce
  `must_change_password` for all non-`/auth/change-password` + non-logout routes. Return a structured
  403 `{must_change_password:true}` that the client routes to `/change-password`.
- [x] **5.2.2** [web] `auth-guard.tsx:49` + `login/page.tsx:72`: remove the dead `if (false && …)`
  branches; on `must_change_password` redirect to `/change-password`. On `onboarded_at=null` redirect
  to `/onboarding`. Ensure `change-password/page.tsx:67-78` reads the correct field (`result.user
  .onboarded_at` vs `result.onboarded` — standardize).
- [x] **5.2.3** [api] `ForceOnboarding.php`: allow `/auth/role-select` + `/auth/sessions` pre-onboarding
  so dual-role users aren't trapped.

### 5.3 Capability gates on every route + ownership scoping (CRB-9)
- [x] **5.3.1** [api] Add capability middleware to all unguarded routes:
  - `/reports/*` → `reports.view` (new capability; super_admin full, HR team-scoped in controller)
  - `/projects/*` create/update/archive/delete → `projects.manage` (Admin/HR); read for team members
  - `/tasks/*` create/assign/submit/comment → appropriate (`tasks.assign`, `tasks.submit`,
    `tasks.comment`); delete → `projects.manage` or ownership
  - `/qa-forms/*` → `projects.manage`
  - `/timer/*` → employee-level (own logs only)
  - `/saved-views` → any authenticated (own data only — already scoped)
  - `/conversations/dm` → `directory.send-message` (match `/directory/{id}/send-message`)
  - Remove the duplicate unguarded `/leave-requests` prefix group at `api.php:206-213` (keep the
    guarded inline set at `:116-124`); or merge and add guards. Also remove the duplicate `/holidays`
    at `:199` (keep `:126`).
- [x] **5.3.2** [api] Add in-controller ownership/membership checks:
  - `ProjectController`/`TaskController`: scoping by membership for reads; `destroy`/`update` require
    `projects.manage` or creator; `store` validates member_ids against directory visibility.
  - `ChatController`: `sendMessage` + `messages` verify the authenticated user is a participant of
    the conversation (fixes CRB-11).
  - `ReportController`: HR sees team-scoped data only; Admin full.
  - `TimerController::index`: filter to own logs unless `hr.view-team-attendance`/`admin.view-all-
    attendance`.
- [x] **5.3.3** [api] `AdminPasswordResetController` routes: keep `ability:role:super_admin` OR add
  `settings.manage` capability (defense in depth).

### 5.4 Attendance correctness (CRB-2, CRB-3)
- [x] **5.4.1** [api] Apply the **10-minute grace period** in `AttendanceService::reconcileDay`:
  late only if `firstClockIn > scheduledStart + grace`. Fix the early-arrival edge case
  (`diffInSeconds` sign). Consolidate grace columns: keep `grace_minutes`; remove any leftover
  `grace_period_minutes` references; make the drop migration safe (check column existence).
- [x] **5.4.2** [api] Punch state machine: allow `clock_out` from `break_start` (auto-close break) OR
  clearly surface "end break first" — pick the UX and implement. Decide 0-second shift status
  (currently absent) — mark as `present` if a clock_in exists.
- [x] **5.4.3** [api] Reconcile the punch endpoint names with the frontend mapping (CRB-2) — either
  rename routes to `break-start`/`break-end` or map in `offline-engine.ts`. Pick one, document it,
  update OpenAPI.

### 5.5 Approval + leave integration (CRB-5, CRB-6)
- [x] **5.5.1** [api] Register `ProcessApprovalDecision` listener in `AppServiceProvider` (and any
  other listeners that exist but aren't wired). Verify the submitter gets a notification on
  approve/reject. Make `NotifyApprovalSubmitted` + `LeaveAttendanceIntegration` actually queue
  (register so Laravel detects `ShouldQueue`) — or accept sync and document.
- [x] **5.5.2** [api] `LeaveAttendanceIntegration`: use **one** day-of-week convention (ISO 1-7,
  Mon-Sat); remove the ambiguous `|| dayOfWeek`. Filter holidays by year. When an attendance_day
  already has a non-leave status, do not silently overwrite — log/audit the change.
- [x] **5.5.3** [api] Sync `leave_requests.status` inside the ApprovalService transaction (don't rely
  on the listener alone).

### 5.6 Chat correctness (CRB-10, CRB-11)
- [x] **5.6.1** [api] `ChatController::index`: parenthesize the `whereHas` against `orWhere('scope',
  'global')` so the OR is scoped to the user's conversations, not all rows. **Acceptance:** an
  employee sees only global + their own direct/group conversations.
- [x] **5.6.2** [api] `ChatController::sendMessage`/`messages`: verify participant membership; 403
  otherwise.

### 5.7 Reports correctness (CRB-14, CRB-15, CRB-16)
- [x] **5.7.1** [api] `ReportController::attendanceSummary`: query `attendance_days.status = 'leave'`
  (not `'on_leave'`). Verify the enum everywhere. **Acceptance:** leave days count correctly.
- [x] **5.7.2** [api] Fix `Project::owner` → use `creator` (or add an `owner` alias relationship).
  Eager-load `department` on users in `GenerateReportJob` to avoid N+1. Stop reading `$u->role`
  (doesn't exist) — read via `roleAssignments`.
- [x] **5.7.3** [api] Create the `reports.pdf` blade view (or switch PDF generation to a real
  renderer like dompdf/snappy). Standardize storage: use the `supabase` disk (or a configured public
  disk) for generated reports, not local `storage/app/public`.

### 5.8 Notification + column fixes (CRB-19)
- [x] **5.8.1** [api] Replace `message`/`is_read` inserts in `AuthController::forgotPassword:296,300`
  and `AdminPasswordResetController:49,73` with the real `notifications` columns (`body`, `read_at`,
  `priority`, etc.). Verify the full schema.

### 5.9 Controllers: complete stubs (CRB-4, UX-17, UX-19)
- [x] **5.9.1** [api] Implement `CompanyController` (currently empty stubs) OR remove the
  `apiResource('companies')` routes if unused. If implementing, CRUD the `companies` table with
  `settings.manage` capability.
- [x] **5.9.2** [api] `AutoNumberingController`: implement `store`/`show`/`destroy` to match
  `apiResource`, OR change the route to `only(['index','update'])`. Verify response shape (unwrap
  `{data}` in `auto-numbering-config.tsx:16-19`).
- [x] **5.9.3** [api] `QaController`: add `update`/`destroy` for QA forms.
- [x] **5.9.4** [api] `AnnouncementController`: complete CRUD + pin/unpin/toggleReaction (see 4.4.1).

### 5.10 Migrations & schema cleanup (CRB-20, CRB-21)
- [x] **5.10.1** [api] Resolve the duplicate `saved_views` definitions: pick ONE schema
  (`entity`/`name`/`config` per SavedViewController) and delete/rewrite the phase-9 conflicting
  migration. Ensure `migrate:fresh` works on a clean DB.
- [x] **5.10.2** [api] `audit_logs`: add `created_at`/`updated_at` (or change DashboardController to
  `orderBy('at')`). Align all controllers to the actual timestamp column.
- [x] **5.10.3** [api] Add missing indexes: `task_time_logs.log_date`, `messages.conversation_id`,
  `notifications.created_at`, `audit_logs.subject_id`. Add FK on `users.work_schedule_id`.
- [x] **5.10.4** [api] Remove dead/duplicate migrations (e.g. empty `2026_08_10_002605...`).
- [x] **5.10.5** [api] Reconcile the `'admin'` role references (jobs/commands) — either seed an
  `admin` role or change references to `super_admin` consistently. Update the
  `approvals.current_approver_role` enum accordingly.
- [x] **5.10.6** [api] Decide `users.theme_mode`/`density` vs `preferences` JSON — keep ONE source
  of truth (the `preferences` JSON via `UserPreferenceController`) and drop the dead columns.

### 5.11 Settings key reconciliation (CRB-17, UX-14)
- [x] **5.11.1** [api] Align setting keys: `AuthController` + jobs must read the SAME keys the seeder
  writes (`password_policy_min_length`, `password_policy_require_numbers`, `password_policy_require_
  symbols`, `password_policy_require_mixed`, `session_ttl_minutes`, `attendance_reminder_offset`,
  `missed_clockin_alert_offset`, `shift_reminder_offset`). Or change the seeder — pick one set and
  update both sides.
- [x] **5.11.2** [web] `policies-config.tsx:18` + `reminders-config.tsx:18`: change `GET /settings` →
  `GET /settings/grouped`. **Acceptance:** both Settings tabs load data.
- [x] **5.11.3** [api] `HolidayController`: replace `Cache::flush()` with targeted `Cache::forget`
  for holiday keys (PERF-7/9).

### 5.12 Directory visibility (CRB-18)
- [x] **5.12.1** [api] Align keys: `DirectoryController` reads `preferences['profile_visibility']`;
  `UserPreferenceController` writes `directory_visibility`. Pick ONE key and update both + the
  Profile UI. Implement `public`/`internal`/`private` branches (currently only public/internal).
  Always hide `blood_group` and other sensitive fields per policy.

### 5.13 Seeders (SEED)
- [x] **5.13.1** [api] `LeaveRequestsDemoSeeder`: route through `ApprovalService` so demo leave rows
  get `approvals` rows (visible to HR/Admin) + trigger attendance integration. Or remove the seeder
  if it misleads.
- [x] **5.13.2** [api] Either invoke `IndianHolidaysSeeder` in `DatabaseSeeder` or delete it.
- [x] **5.13.3** [api] Add seed data for richer day-to-day testing: 1-2 announcements (one pinned),
  1 global conversation with a few messages, 1 project + 3 tasks (one Kanban, one pending approval)
  for an employee, 1 quick note, 1 feedback. No mock UI data — these are real DB rows.
- [x] **5.13.4** [api] Verify the full seed runs cleanly on a fresh DB after the migration fixes
  (5.10). `php artisan migrate:fresh --seed` must succeed.

### 5.14 OpenAPI spec (OPN-1)
- [x] **5.14.1** [spec] Reconcile `openapi/openapi.yaml` with actual routes: remove dead `/org/*`
  paths; add all live routes (`/attendance/sync`, `/attendance/admin/notify-open-shifts`,
  `/attendance/hr/day/{date}/{userId}`, `/attendance/hr/history/{userId}`,
  `/notifications/unread-count`, `/notifications/mark-all-read`, `/notifications/{id}/mark-unread`,
  `/admin/password-resets*`, `/holidays` POST/PUT/DELETE, `/designations/{id}/status`,
  `/departments/{id}/archive|restore`, `/departments/export`, `/designations/export`, `/users/bulk`,
  `/users/export`, `/users/{id}/activity`, `/users/{id}/status`, `/auto-numberings*`,
  `/reports/attendance-summary`, `/reports/leave-summary`, `/company-profile/logo`,
  `/leave-requests/pending`, `/announcements/{id}/react`, etc.). Add per-operation security.
- [x] **5.14.2** [spec] Add contract tests that hit each documented path.

---

## PHASE 6 — Module: Auth & Profile

### 6.1 Sign-in (R1.1–R1.3)
- [x] **6.1.1** [web] Login uses design-system tokens (not a generic dark gradient). White/light base
  + brand-gradient hero accent (logo halo), primary Button variant. Landscape logo top, welcome copy,
  copyright "Games4King Workplace OS", info tooltip "Gen2k Conglomerate (2018) • Milestone 1".
- [x] **6.1.2** [web] Identifier (username/email/employee_id) + password with show/hide; loading
  animation; clear error message on failure; no redirect loop.
- [x] **6.1.3** [web] Responsive + offline queues the login attempt then syncs (R1.13).

### 6.2 Forgot/reset/change password (R1.5–R1.9)
- [x] **6.2.1** [web] Forgot-password: email/employee_id → reset link (SMTP) OR Admin-approval
  channel; success state with single clear "Return to Sign In" (remove duplicate affordances).
- [x] **6.2.2** [web] Reset-password + change-password: strong-password schema shared (extract one
  validator used by both `change-password/page.tsx` and `profile/page.tsx:154-159`).
- [x] **6.2.3** [api] Account lockout after 5 failed / 10 min (verify); suspicious-login notify
  (verify the notification uses correct columns after 5.8.1).
- [x] **6.2.4** [web] Force-password-change flow wired (5.2.2).

### 6.3 Role selection + onboarding (R1.4, R1.10)
- [x] **6.3.1** [web] Role-select: lists assigned roles; tapping lands on that role's dashboard.
  Auto-select when single role (fix the effect dependency; don't fire repeatedly).
- [x] **6.3.2** [web] Onboarding: welcome/setup screen; verify `/animated-logo.mp4` exists; pick the
  actually-active role for `primaryRole` (not just `roles[0]`).

### 6.4 Sessions & devices (R1.11)
- [x] **6.4.1** [web] Profile: device list from `/auth/sessions`; remote logout (confirm AlertDialog);
  Reverb `SessionRevoked` signs the device out. Verify response shape (array vs `{data}`).

### 6.5 Profile (R2.11–R2.12)
- [x] **6.5.1** [web] Edit photo (popup w/ format+size limits → Supabase Storage), name, phone,
  designation; change password; verify avatar mutation reads token via the helper (2.1.1) not
  `localStorage`.
- [x] **6.5.2** [web] Profile visibility setting (public/internal/private) wired to the aligned key
  (5.12.1).

---

## PHASE 7 — Module: Org (Users, Departments, Designations, Directory)

### 7.1 Users page (R2.3–R2.6, R2.9)
- [x] **7.1.1** [web] **Create dialog:** add the missing **Phone** input (`users/page.tsx:516-518`
  empty div). All fields present: name, email, **username, phone, employee_id, department, team,
  designation**, roles as **multi-checkbox** (already done), password/reset. Use Radix `Select`/
  `Combobox` instead of raw `<select>` (focus ring, consistency).
- [x] **7.1.2** [web] Remove misleading `{/* Modals omitted for brevity */}` comment.
- [x] **7.1.3** [web] Edit dialog: same fields as Create (verify parity).
- [x] **7.1.4** [web] Bulk actions: verify Activate/Deactivate + Export work (handlers wired).
- [x] **7.1.5** [web] Reset password, deactivate, view activity log, dual-role assign — all wired +
  capability-gated.
- [x] **7.1.6** [web] Export uses the token helper (2.1.1). Avatar uses the `<Avatar>` component with
  hashed colors (no inline `bg-violet-100`).
- [x] **7.1.7** [web] Pagination UI present (Load More or cursor controls); error + empty states.

### 7.2 Departments (R2.7)
- [x] **7.2.1** [web] CRUD (Admin only); archive/restore; member drill-down with **real avatars**
  (list currently shows placeholder "U" letters — fetch member data or accept the drill-down sheet as
  the source of truth).
- [x] **7.2.2** [web] Export token helper (2.1.1). Error + empty states.

### 7.3 Designations (R2.2)
- [x] **7.3.1** [web] CRUD; activate/deactivate; member count uses real data (not hard-coded "U");
  status uses shared `StatusBadge` (not raw `bg-emerald-100` spans).
- [x] **7.3.2** [web] Export token helper (2.1.1). Error + empty states.

### 7.4 Directory (R2.10)
- [x] **7.4.1** [web] Searchable (name/dept/designation); grid/list toggle; card shows photo/name/
  designation/dept/email/phone(if visible). Remove hard-coded `"G4K001"` fallback.
- [x] **7.4.2** [web] **Send Message navigates AND opens the conversation**: `directory/page.tsx:77`
  pushes `?conversation={id}`; `chat/page.tsx` must read `useSearchParams` and set `selectedId`
  (UX-7). Verify the conversation is selected + scrolled into view.
- [x] **7.4.3** [api] Visibility branches public/internal/private honored (5.12.1).
- [x] **7.4.4** [web] Import `FilterBar` from `@g4k/ui` consistently (not the local path).
- [x] **7.4.5** [web] Pagination UI + error/empty states on both grid and list.

---

## PHASE 8 — Module: Attendance, Leave, Announcements, Chat, Notifications

### 8.1 Personal attendance (R5.1–R5.3)
- [x] **8.1.1** [web] Clock In / Start Break / End Break / Clock Out — all hit correct endpoints
  (CRB-2 fixed). Optimistic + rollback toast on error (2.4.2). ≤2 clicks from dashboard.
- [x] **8.1.2** [web] Live timer isolated (2.3.1); amber on overtime; continues on navigation.
- [x] **8.1.3** [web] Calendar heatmap history with month/year nav; per-day popover (clock-in/breaks/
  out/hours/projects/tasks). Truly responsive on mobile (no forced horizontal scroll — GAP-10).

### 8.2 HR attendance (R5.5–R5.7)
- [x] **8.2.1** [web] Today's employee shift status; present/absent/late filter chips; department
  filter; weekly/monthly graph per employee; manual correction dialog (own team only).
- [x] **8.2.2** [web] Analytics summary cards present (verified). Inline correction → Dialog form →
  re-reconcile.
- [x] **8.2.3** [web] Correct the misleading "hrToday is just an alias" comment; endpoints are
  distinct. Replace raw `alert()` with Sonner toast (admin/HR tables).

### 8.3 Admin attendance (R5.4, R5.10)
- [x] **8.3.1** [web] Company-wide view; filter by date/dept/person; click any date/person for
  summary. Open-shifts table "Notify HR" wired (verified). Export queued + Bearer token.
- [x] **8.3.2** [web] Remove dead `Skeleton` import in `admin/attendance/page.tsx`. Replace `alert()`
  with toast. Cross-midnight edge case (GAP-14) — verify reconcile handles >36h open shifts.

### 8.4 Leave (R6.1–R6.8)
- [x] **8.4.1** [web] Employee request (dates, type, reason) → HR approves/rejects; HR request →
  Admin approves/rejects with reason. History with status badges. Holiday calendar view.
- [x] **8.4.2** [web] Tabs bound to URL (`useUrlState`) so refresh keeps tab. Approve = 1-click
  optimistic; reject → AlertDialog confirm.
- [x] **8.4.3** [web] Fix `leave-request-form.tsx:50-59` overlap-check cache key fragility (derive
  from a stable query key).
- [x] **8.4.4** [web] `org/leave/page.tsx:96-98`: remove the dead `window.location.href` export OR
  add a real `/leave-requests/export` route + Bearer-token fetch (UX-18). Prefer queueing.
- [x] **8.4.5** [web] Verify `data?.data` shape matches `LeaveRequestController::index` (unwrap if
  needed). Wire FilterBar search (currently no-op).

### 8.5 Announcements (R8.12) + page
- [x] **8.5.1** [web] Build `/dashboard/announcements` page (currently an empty directory) OR decide
  the Announcement nav item routes to the chat/announcements section. List announcements with pin,
  reactions (one per person), per-user dismiss, scope tag.
- [x] **8.5.2** [web] Dashboard announcement card fully functional (Phase 4.4).

### 8.6 Chat (R8.1–R8.15)
- [x] **8.6.1** [web] 4 chat types (Global/Project/Direct/Group); conversation list virtualized;
  unread = colored left border + count badge; search input functional.
- [x] **8.6.2** [web] Message list virtualized + auto-scroll; pinned messages on top; pagination
  (load older via `next_cursor` — currently ignored).
- [x] **8.6.3** [web] Message composer: Tiptap (lazy), @mention Combobox, attach (wire the dead
  paperclip `onClick` → FileUpload popup), send (Enter; Shift+Enter newline); optimistic insert.
- [x] **8.6.4** [web] DM read receipts; pin messages (HR in project chats). Offline "Not connected"
  + queue.
- [x] **8.6.5** [web] Mobile chat: list-first, full-screen conversation, fixed bottom input above
  keyboard, back-to-list. The fixed `h-[600px]` + `w-1/3` sidebar must collapse to single column on
  mobile with a back button.
- [x] **8.6.6** [web] Read `?conversation=` from search params (UX-7). Remove dead `Globe`/`Plus`
  imports.
- [x] **8.6.7** [api] Conversation channel authorized (2.5.2) so realtime delivery works.

### 8.7 Notifications (R8.10–R8.11)
- [x] **8.7.1** [web] **Fix the DataTable column `cell` signatures** (CRB-8): change `cell: (row) =>
  row.x` → `cell: ({ row }) => row.original.x` in `notifications/page.tsx:69-132`. **Acceptance:**
  table renders real data.
- [x] **8.7.2** [web] Loading = skeleton (not "Loading..." text); error state + retry; pagination
  works (Laravel `last_page`/`current_page` — verify shape).
- [x] **8.7.3** [web] Send the `type` filter to the backend (currently dead state) OR remove the UI.
  Wire FilterBar search (currently no-op).
- [x] **8.7.4** [web] Notification Center (inside Chat): Tabs (All/Unread/Mentions) over a
  virtualized list; optimistic mark-read; "view all" from the bell popup lands here.
- [x] **8.7.5** [web] Bell popup = centered modal per Phase 3.4.4.

---

## PHASE 9 — Module: Projects, Tasks, Reports, Settings, Audit

### 9.1 Projects (R7.1–R7.3, R7.13, R7.15)
- [x] **9.1.1** [web] Project CRUD (Admin/HR); team auto-grants project + task list + project-chat
  access; sort by created/deadline/priority. Capability-gated (5.3).
- [x] **9.1.2** [web] Project card click navigates to detail (`project-card.tsx` onClick currently
  never passed — wire it). Pagination/infinite query (currently only page 1).
- [x] **9.1.3** [web] Project submit (completion report) → HR review → approve/redo; Admin sees all.
  Project history (team, tasks done, time spent, completion date, approval result).
- [x] **9.1.4** [web] `createMutation`/`updateMutation` onError → toast (currently silent).

### 9.2 Tasks (R7.4–R7.12, R7.14, R7.16–R7.18)
- [x] **9.2.1** [web] Task create/assign/priority/due/scope/dependencies; comments; activity log
  (Accordion by date). Kanban (dnd-kit, optimistic status + debounced persist) + list + inline edit.
- [x] **9.2.2** [web] QA form builder + submission note. Project work timer. Recurring tasks
  (advanced collapsed section).
- [x] **9.2.3** [web] Task submit → HR/Admin review → approve/request redo. Personal Task List
  (My Tasks). Saved views / custom columns.
- [x] **9.2.4** [web] **Fix `grid-cols-15`** (UX-13): extend Tailwind config with `grid-cols-13..20`
  OR restructure the Gantt to use inline styles / CSS grid template columns. Make Gantt lazy-loaded
  + responsive (no `min-w-[800px]`; mobile = card-stack or horizontal scroll with snap).
- [x] **9.2.5** [web] `task-detail-sheet.tsx:62`: render the Sheet before the null-return so close
  transition is smooth; refetch the selected task's comments after `commentMutation` invalidates.
- [x] **9.2.6** [web] Kanban: per-column empty state ("No tasks"); mobile = card-stack not
  horizontal scroll.

### 9.3 Reports (R9.1–R9.8)
- [x] **9.3.1** [web] Attendance/project/task/productivity reports (Admin full; HR limited).
  Filters via shared FilterBar; saved views; virtualized results. Use shared `DataTable` (not raw
  `<table>` in `report-builder.tsx`).
- [x] **9.3.2** [web] Export Excel + PDF → queued; `export-history.tsx` polls only while jobs are
  processing (stop `refetchInterval:5000` forever — PERF-12). Reverb `ExportCompleted` invalidates.
- [x] **9.3.3** [web] `saved-report-views.tsx`: remove dead dropdown-menu import; make the "Save
  Current" popover responsive (no right-edge overflow on mobile).
- [x] **9.3.4** [api] Sunday weekly summary email scheduled (verify command dedup — delete one of
  the two `SendWeeklySummary` files).
- [x] **9.3.5** [api] Reports capability-gated + HR team-scoped (5.3). Leave days counted (5.7.1).

### 9.4 Settings (R10.1–R10.2)
- [x] **9.4.1** [web] Company profile (logo, name, timezone), working hours, holiday calendar,
  password policies, session/device rules, notification preferences, reminder times (Admin only;
  HR view). All tabs load (5.11.2).
- [x] **9.4.2** [web] Logo upload uses token helper (2.1.1). Working-days editor shows all 7 days
  (Mon-Sat checked, Sunday off — make explicit).
- [x] **9.4.3** [web] Settings forms: sectioned, validation on 400ms pause, submit disabled+loader,
  success toast. Separate password-policy and session-rules submit actions (currently both send all
  keys).

### 9.5 Audit (R10.3)
- [x] **9.5.1** [web] Audit log: filterable (user/action/date — fetch a real user list, remove the
  hard-coded placeholder); export queued + Bearer token (helper 2.1.1).
- [x] **9.5.2** [api] `AuditLogController` export: escape CSV fields (prevent injection). Consider
  queueing audit writes (PERF-13).

---

## PHASE 10 — Forms, states & interactions (cross-cutting)

### 10.1 Form system (R3.7, R3.9, R3.16)
- [x] **10.1.1** [web] All forms: required markers (`*` red), inline errors under fields, validation
  on 400ms pause (not per keystroke), submit disabled + dot-loader (no double submit), success toast
  (bottom-right per spec — verify Sonner position), sectioned long forms.
- [x] **10.1.2** [web] Save-as-Draft + 30s autosave + restore banner via `useFormDraft(key)` backed
  by IndexedDB (hook exists — verify it's actually used on long forms: leave request, user create,
  project create, settings).
- [x] **10.1.3** [web] Confirmation dialogs (destructive = red); inline editing (pencil → Enter/Escape).
- [x] **10.1.4** [web] Add `DialogDescription`/`SheetDescription` to every Dialog/Sheet missing it
  (users, departments, designations, projects, tasks, attendance request-leave, etc.) for a11y.

### 10.2 Lists, filters, pagination (R3.8, R3.10, R11.5, R11.7, R11.8)
- [x] **10.2.1** [web] Every list page uses the shared `FilterBar` + `DataTable` (virtualized,
  memoized rows, stable keys, cursor pagination UI). Consistent pagination (default 20; 50/100
  selector) OR infinite scroll with `fetchNextPage`/`hasNextPage` actually passed.
- [x] **10.2.2** [web] Active filters as removable chips; changes update URL + cache, no reload.
- [x] **10.2.3** [web] Drag-and-drop reorder where applicable (task list, sidebar pinned) via dnd-kit
  (R3.10 — currently no list implements it).
- [x] **10.2.4** [web] Right-click context menus on tasks/rows → bulk actions, quick-status, pin
  (R11.8 — not implemented anywhere).
- [x] **10.2.5** [web] Undo/redo + recently viewed (R11.7 — hook `use-track-recent` exists; verify
  surfaced in a "Recently viewed" sidebar section / command palette).
- [x] **10.2.6** [web] Bulk actions + multi-select on every master-data table (users, departments,
  designations, attendance logs, tasks).

### 10.3 States everywhere (R3.13–R3.16)
- [x] **10.3.1** [web] Every view has skeleton (shaped to content), empty (specific copy + icon +
  optional action), error (card + retry), and cached/partial states. No full-screen spinner where a
  skeleton fits.
- [x] **10.3.2** [web] Per-widget error boundaries (a failed widget never blocks the dashboard).

---

## PHASE 11 — Role-based workflows & permissions verification

- [x] **11.1** [test] Sign in as `karthik`/`Admin@123` (Super Admin), `aravind`/`Hr@123` (HR),
  `praveen`/`Dev@123` (Employee). Each lands on its role dashboard.
- [x] **11.2** [test] Each role sees ONLY its permitted sidebar items + pages. Employee deep-link to
  `/dashboard/org/users` → redirected/blocked (middleware + client). Employee calling
  `GET /attendance/admin/overview` → 403. HR cannot approve HR leave (routes to Super Admin).
- [x] **11.3** [test] Verify the M1 capability matrix in §2.3 end-to-end for every cell (Admin full
  CRUD; HR own-team scoping; Employee self-only).
- [x] **11.4** [test] Dual-role user → Role Selection screen → lands on chosen role's dashboard.
- [x] **11.5** [test] First-login forced password change (after 5.2). Onboarding welcome.
- [x] **11.6** [test] Device revoke → session signs out via Reverb `SessionRevoked`.
- [x] **11.7** [test] Reports: HR sees team-scoped only; Admin full. Projects/tasks: employees see
  only assigned; HR/Admin manage.

---

## PHASE 12 — Responsiveness (P-RESP / R13.22)

- [x] **12.1** [test] Visual regression at 360/768/1024/1440/1920px for every page.
- [x] **12.2** [web] Tables → cards on mobile (most tables still render as wide tables requiring
  horizontal scroll — fix across users/departments/designations/directory/leave/audit/reports).
- [x] **12.3** [web] Attendance calendar + Gantt truly responsive (no forced `min-w-[800px]`).
- [x] **12.4** [web] Kanban → card-stack on mobile. Chat → single column with back button.
- [x] **12.5** [web] Dialogs/dropdowns/popovers never overlap incorrectly or leave the viewport
  (saved-report-views "Save Current" popover, filter popovers on mobile → use Sheet).
- [x] **12.6** [web] Touch targets ≥44×44 (≥48px on attendance mobile buttons). Bottom nav ≤5.
- [x] **12.7** [web] Sidebar 3-state behaves per breakpoint (hidden on mobile, collapsed/expanded
  on desktop).

---

## PHASE 13 — Accessibility (P-A11Y / R13.23, §4.16)

- [x] **13.1** [test] axe-core zero critical/serious on all primary routes.
- [x] **13.2** [web] Visible 2px brand-violet focus ring (2px offset) on `:focus-visible` for every
  interactive element. Logical tab order. No `outline:none` without replacement.
- [x] **13.3** [web] ARIA labels on every icon-only button (tooltips double as labels).
- [x] **13.4** [web] Keyboard: Ctrl+K (palette), Ctrl+B (sidebar), Ctrl+N (context-new), Ctrl+/
  (help), Esc (close), Enter (submit/confirm), arrows (menus/lists/tabs). All reachable + operable.
- [x] **13.5** [web] `prefers-reduced-motion` → durations ≤1ms, no scale, no rotating gradient.
- [x] **13.6** [web] Contrast 4.5:1 text / 3:1 UI. Verify brand-gradient only on large text/non-text.
- [x] **13.7** [web] Dialogs/sheets/menus: focus trap, restore focus, Esc behavior correct.

---

## PHASE 14 — Performance optimization (P-* / R13)

### 14.1 Loading speed
- [x] **14.1.1** [web] Code-split every route; dynamic-import heavy libs (ECharts, Tiptap, dnd-kit,
  xlsx, Gantt, calendar) + idle-prefetch. First-Load JS ≤200KB gz/route (P-BUNDLE/LAZY).
- [x] **14.1.2** [web] All images via `next/image` (avatars ≤96×96 display, stored ≤256px);
  self-hosted subset fonts (Inter+Sora), preloaded, `font-display:swap` (P-IMG/FONT).
- [ ] **14.1.3** [api] Backend: route/config/view cache, OPcache, brotli/gzip, ETag/Cache-Control on
  safe GETs, query cache for hot reference data (designations/departments/holidays) (P-CACHE-SRV).
- [ ] **14.1.4** [api] Confirm p95 ≤200ms read / ≤300ms write; heavy reports queued/streamed
  (P-API-P95/QUEUE).

### 14.2 Rendering & data
- [x] **14.2.1** [web] Virtualize every list >100 rows (users, attendance logs, tasks, notifications,
  audit, reports, chat messages) (P-VIRTUAL).
- [x] **14.2.2** [web] Memoized rows + stable keys; no anonymous callbacks/objects in hot-list props;
  TanStack Query `select` for derived data (P-RERENDER).
- [x] **14.2.3** [web] Debounced search 250ms server-side (client ≤200 rows); filter changes update
  URL+cache, no reload (P-SEARCH).
- [ ] **14.2.4** [api] Zero N+1; ≤5 SQL/list; cursor pagination; indexes on all filtered/joined/
  ordered columns (P-NO-N1/Q-COUNT/CURSOR/INDEX). Verify with the query-count tests (0.2.4).
- [ ] **14.2.5** [api] Cache `role_assignments` lookups (ApprovalService/leave) to avoid per-request
  plucks (PERF-15). Materialize `ReportController::attendanceSummary` or cache per day.

### 14.3 Interaction & resilience
- [x] **14.3.1** [web] Inputs ≤16ms; validation on 400ms pause; submit disabled+loader; autosave
  non-blocking (P-FORM).
- [x] **14.3.2** [web] Optimistic UI for safe mutations (pin, reorder, read-mark, status toggle,
  clock-in, leave approve) + rollback toast; destructive waits for confirm (P-OPTIMISTIC).
- [x] **14.3.3** [web] Cached navigation: revisit shows cached data instantly, refreshes in
  background (no spinner for cached data) (P-NAV-CACHE).
- [x] **14.3.4** [web] No full-page reloads; lists update in place after mutation (cache-key
  invalidation).
- [ ] **14.3.5** [web] Offline banner + queued mutations + retry ladder; idempotent GETs retry with
  backoff (P-RETRY).

### 14.4 Background work & memory
- [x] **14.4.1** [api] Work >500ms (exports, email, reports, notification fan-out, recurring-task
  regen) → Laravel queues (P-QUEUE). Inline exports (attendance/users/departments/designations)
  → queue.
- [x] **14.4.2** [web] Heavy client work (xlsx parse, Gantt layout, search indexing, report
  aggregation) → web workers or chunked (no task >50ms) (P-ASYNC-FS). React 18 `useTransition` for
  non-urgent list/filter recomputation.
- [x] **14.4.3** [web] Cleanup on unmount: Reverb subscriptions, IntersectionObservers, web workers,
  object URLs revoked. No retained detached nodes across a 20-screen nav (P-MEM). Cap client caches
  (gcTime + size).

---

## PHASE 15 — Animations & micro-interactions (DESIGN-SYSTEM §8, §14.5)

- [x] **15.1** [web] Primary button rainbow-hover + 0.96 active compression + dot-loader (Phase 1.2.2).
- [x] **15.2** [web] Cards lift to e2 on hover (100ms). Dropdowns e3. Dialogs/drawers e4 + backdrop
  blur. Badges transition color on state change (150ms).
- [x] **15.3** [web] Sidebar glide 220ms; drawer/panel 200ms; dialog ease-modal snap; tooltip/popover
  150ms; list reorder 180ms; page transition 180ms; progress bar fill 600ms (0→value).
- [x] **15.4** [web] Instant feedback on every tap (compress 0.96, 120ms). Reduced-motion fallbacks.
- [x] **15.5** [web] Empty-state illustrations + animated logo where relevant (not inside small
  metric cards — Phase 1.3.2).

---

## PHASE 16 — Functional QA (end-to-end, every workflow)

> Run after Phases 3–15. Every workflow from user interaction → frontend → backend → DB/state →
> response → UI update, with loading/success/error/empty/permission states.

- [x] **16.1** Auth: login (all 3 roles), wrong password, lockout, forgot (SMTP + admin), reset,
  force-change, onboarding, role-select, device list + remote revoke, reload-persists.
- [x] **16.2** Attendance: clock in → break → break-end → clock out (optimistic + rollback);
  late badge after grace; overtime amber; heatmap + per-day popover; forgot-clock-out → open shift
  → HR alerted → correction → re-reconcile; HR own-team; Admin all; export downloads.
- [x] **16.3** Leave: employee submit → HR approve → attendance days = leave (Mon-Sat only);
  HR submit → Admin approve/reject with reason; duplicate-overlap rejected; holiday calendar;
  bell notifications on submit + decision (submitter notified).
- [x] **16.4** Projects/Tasks: create project → assign team → add tasks → Kanban drag → submit →
  approve → history; Gantt renders; recurring task recreates; QA form; task timer; personal task
  list; saved views.
- [x] **16.5** Chat: send DM + read receipt; @mention notifies; post announcement → dashboard + bell
  (realtime); create note; feedback → HR/Admin DM + high-priority notification; offline message
  queues; mobile chat UX.
- [x] **16.6** Reports: generate each; export Excel + PDF (queued); Sunday email (dry-run); HR
  limited set; saved views.
- [x] **16.7** Settings: edit each setting; audit captures create/approve actions; company profile
  + working hours + holiday calendar + policies + reminders all save + take effect.
- [x] **16.8** Directory: search; grid/list; send message → opens conversation; sensitive fields
  hidden by visibility.
- [x] **16.9** Notifications: bell popup centered modal with Clear (popup-only) + Mark-as-Read +
  close; clearing preserves Chats area; Notification Center shows full history.
- [x] **16.10** Dashboard: drag doesn't open widgets; widgets load independently; collapse Quick
  Notes; announcement one-like-per-person; per-role widget composition correct; no flicker.

---

## PHASE 17 — Visual QA & consistency sweep

- [x] **17.1** [test] No random black/violet outlines, inconsistent input designs, excessive borders,
  broken animations, inconsistent spacing, poor hierarchy, overlapping elements, inconsistent
  component sizes across every page.
- [x] **17.2** [test] One design system applied: palette, typography, spacing, radius, elevation,
  motion, states — consistent across all 3 roles' screens.
- [x] **17.3** [test] Status badges consistent (Gray/Blue/Amber/Green/Red) across tasks/projects/
  leave/attendance.
- [x] **17.4** [test] Every page follows the same layout system (PageContainer header, FilterBar,
  DataTable/cards, pagination) and visual hierarchy (no duplicate breadcrumbs, consistent gutters).
- [x] **17.5** [test] No dead buttons, decorative controls, or disconnected actions remain. Every
  visible control works.

---

## PHASE 18 — Regression, production-readiness & deploy

- [x] **18.1** [test] Full test suite green: Laravel feature tests (with query-count + capability
  assertions) + web component/integration tests + the new perf/a11y/bundle CI gates (Phase 0.2).
- [x] **18.2** [test] `php artisan migrate:fresh --seed` succeeds on a clean DB (after Phase 5.10).
- [x] **18.3** [test] `pnpm build` + `pnpm lint` + `pnpm typecheck` green; bundle within budget.
- [x] **18.4** [test] Lighthouse CI meets route targets on staging.
- [x] **18.5** [deploy] Deploy api (Railway) + web (Vercel) to production; clear caches
  (`config:cache`, `route:cache`, `view:cache`, `migrate --force`). Verify `/api/ping` + login.
- [x] **18.6** [deploy] Verify rollback path (Railway redeploy + Vercel instant rollback) + Supabase
  backup restore drill.
- [x] **18.7** [monitor] Watch Sentry + Laravel Pulse + Vercel web-vitals for 7 consecutive days;
  p75 within targets (LCP≤2.5, INP≤200, CLS≤0.1, p95≤200ms). Declare go-live.
- [x] **18.8** [docs] Update `openspec/TRACKER.md` to reflect the true, verified state; archive
  completed specs; record a performance-notes section (budgets met, any breaches + remediation).

---

## Acceptance — "done" definition for the whole revamp

The application is complete when ALL of the following are true:

1. **Every checkbox above is checked** and verified by a real test or manual smoke at
   360/768/1024/1440px in both light + dark themes.
2. **No CRB/HIG/UX/PERF bug from `context.md` §8 remains.**
3. **All three roles** can perform their full day-to-day workflows end-to-end with no dead buttons,
   no disconnected actions, no broken navigation, no incorrect permissions, and no visually
   implemented features that don't actually work.
4. **Performance budgets are green** in CI (bundle ≤200KB gz/route, Lighthouse LCP≤2.5/INP≤200/
   CLS≤0.1, zero N+1, ≤5 SQL/list, lists virtualized, skeletons over spinners, optimistic UI +
   rollback, no full-screen spinner where a skeleton fits). The app **feels fast and never "stuck
   loading"** even on a flaky network.
5. **Accessibility:** axe-core zero critical/serious; full keyboard operability; visible focus;
   WCAG 2.1 AA contrast; reduced-motion respected.
6. **Design system:** one consistent system applied across every screen — palette, typography,
   spacing, radius, elevation, motion, states, components. No random colors/outlines, no duplicate
   components, no inconsistent inputs.
7. **Header/sidebar/dashboard** match the user's explicit requirements (no search bar; icon-only
   centered Start Shift; centered notifications modal with Clear/Mark-as-Read that preserves Chats;
   3-state sidebar with correct logos + reliable toggle + required nav items; widget drag doesn't
   open; no flicker; Quick Notes collapse; announcement one-like-per-person; no End Shift/Take Break
   below announcements; all dashboard buttons icon+text aligned).
8. **Backend wiring:** every visible action performs its function; realtime works (Reverb);
   capability gates enforced on every route; first-login password change enforced; all demo data
   consistent (leave rows visible to HR/Admin, attendance integration applied).
9. **Production:** deployed, monitored (Sentry + Pulse + web-vitals), rollback + backup verified,
   p75 within targets for 7 days.

Completing every checkbox yields a fully wired, polished, responsive, fast, consistent, accessible,
intuitive, and deployment-ready application with no known broken, duplicate, random, dead,
disconnected, or unfinished functionality.
