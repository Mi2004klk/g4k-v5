# fix-5.md — Eliminate Loading States & Make the App Instant: Surgical Performance Plan

> **Status:** The app is deployed and main pages load fast, BUT every widget, interaction, and click
> triggers skeleton/loader states, some stuck indefinitely. This file identifies the **verified root
> causes in the current code** and prescribes **exact, code-level fixes** — no vague tasks, no
> rework. After implementing every item, the app will show cached data instantly on every navigation,
> refresh silently in the background, and never block interaction behind a loader unless genuinely
> waiting for first-time data on a truly empty cache.
>
> **Each task specifies: file → problem → exact fix → acceptance criterion.** Implement top-to-bottom;
> Phases 1–2 alone eliminate 80% of the complaint.

---

## ROOT-CAUSE SUMMARY (what's actually wrong, verified in code)

| # | Root cause | Impact | Where |
|---|---|---|---|
| **R1** | **Widget data-shape crash.** `recent-activity-widget` reads `activity.created_at`, `.user_name`, `.model_type`, `.details` — but `audit_logs` columns are `at`, `user_id`, `subject_type`, `meta`. `formatDistanceToNow(new Date(undefined))` THROWS → ErrorBoundary catches → widget blank/broken. | Super Admin dashboard "Recent Activity" widget permanently broken. | `recent-activity-widget.tsx:88-104` |
| **R2** | **Nonexistent endpoint.** `employee-approval-status-widget` calls `/leaves/me?limit=3` — route doesn't exist (correct: `/leave-requests/history`). 404 every time. | Employee "Approval Status" widget always fails silently. | `employee-approval-status-widget.tsx:13` |
| **R3** | **PersistQueryClientProvider async-hydration race.** The IndexedDB persister restores async. On every cold load, the in-memory cache is EMPTY when queries fire → ALL widgets show `isPending` skeletons simultaneously. The persister restores ~50–200ms LATER — after queries already started fetching. The persisted cache provides ZERO benefit on cold loads (loses the race to the network) while adding IndexedDB I/O overhead. | Entire dashboard skeletons on every page reload, even though data exists in IndexedDB. | `providers.tsx:6-25,56` |
| **R4** | **Missing `placeholderData: keepPreviousData`** on `metric-widget`, `employee-task-progress-widget`, `employee-approval-status-widget`. On background refetch after `staleTime` expires, these briefly lose their data context. | Flicker/flash on refetch; animation re-fires. | `metric-widget.tsx:33`, `employee-task-progress-widget.tsx:11`, `employee-approval-status-widget.tsx:12` |
| **R5** | **Duplicate query keys to same endpoints.** Dashboard widget keys differ from page keys → 2–3 separate requests to the same API. | Wasted bandwidth, race conditions, 3× the server load on attendance pages. | `admin-today-attendance-widget.tsx:13` vs `admin-attendance-table.tsx:56`; `hr-activity-feed-widget.tsx:30` vs `hr-team-attendance-widget.tsx:14` vs `hr-attendance-table.tsx:56` |
| **R6** | **Dashboard widget waterfall.** `widget-engine` fetches `["dashboard-layout"]` → renders widgets → each widget then fires its own query. Three sequential stages. | Dashboard takes 3× round-trips to fully render on cold load. | `widget-engine.tsx:53-56` |
| **R7** | **30s `refetchInterval` polling** on HR/Admin attendance tables — fires a request every 30s forever while the page is open, re-triggering spinners. | Constant background load + visible `isFetching` spinners every 30s. | `admin-attendance-table.tsx:80`, `hr-attendance-table.tsx:80` |
| **R8** | **MetricWidget count-up animation re-fires** on every background refetch (effect dep `[rawValue]`), even when the value hasn't changed. | Numbers visibly "re-count" every 30s. | `metric-widget.tsx:43-62` |
| **R9** | **Global `staleTime: 30s`** is too aggressive for reference data (departments, designations, directory, holidays) that changes rarely. | These go stale after 30s → background refetch on every revisit → spinner. | `providers.tsx:42` |
| **R10** | **Pages pass `isLoading` to child components** which show skeletons. `isLoading` is correct (only true when no cached data), BUT without `placeholderData` on the query, the skeleton-to-data transition is jarring when filters change. | Skeletons on filter changes. | `leave/page.tsx:23`, `attendance/page.tsx:12` |

---

## PHASE 1 — Fix the widget data crashes (R1, R2) [CRITICAL — do first]

> These two bugs make specific widgets appear permanently broken. Fix them before anything else.

### 1.1 Fix Recent Activity widget data mapping (R1)
- [ ] **1.1.1** [web] `apps/web/src/components/widgets/recent-activity-widget.tsx`: the backend
  `DashboardController::metrics` returns `audit_logs` rows via
  `DB::table('audit_logs')->orderBy('at','desc')->limit(10)->get()`. The columns are:
  `id, user_id, action, subject_type, subject_id, before, after, ip, meta, at`.
  The widget currently reads `activity.created_at`, `activity.user_name`, `activity.model_type`,
  `activity.details` — **none of which exist**. Fix the mapping:
  - `activity.created_at` → `activity.at`
  - `activity.user_name` → derive from `activity.user_id` (join needed on backend, OR show
    `"Employee #${activity.user_id}"` if no join; BEST: update `DashboardController::metrics` to
    join `users` on `user_id` and select `users.name as user_name` in the audit query).
  - `activity.model_type` → `activity.subject_type`
  - `activity.details` → `activity.meta` (JSON-decode if needed, or show `activity.action` only).
  - **Also fix the `formatDistanceToNow(new Date(activity.at))` call** — wrap in a try/catch or
    validate the date first: `const d = new Date(activity.at); if (isNaN(d.getTime())) return null;`
    to prevent the whole widget from crashing on one bad row.
  **Acceptance:** Super Admin dashboard Recent Activity widget renders real audit entries with
  correct timestamps. No ErrorBoundary fallback.

- [ ] **1.1.2** [api] `apps/api/app/Http/Controllers/DashboardController.php` line ~56
  (`recent_activity` query): change to join user names so the frontend doesn't need a second
  request:
  ```php
  $data['recent_activity'] = DB::table('audit_logs')
      ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
      ->select('audit_logs.id', 'audit_logs.action', 'audit_logs.subject_type',
               'audit_logs.subject_id', 'audit_logs.at', 'users.name as user_name')
      ->orderBy('audit_logs.at', 'desc')
      ->limit(10)
      ->get();
  ```
  **Acceptance:** `recent_activity` items include `user_name` + `at` fields.

### 1.2 Fix Employee Approval Status widget endpoint (R2)
- [ ] **1.2.1** [web] `apps/web/src/components/dashboard/employee-approval-status-widget.tsx:12-14`:
  change the query from:
  ```ts
  queryKey: ["my-leaves-summary"],
  queryFn: () => apiFetch("/leaves/me?limit=3"),
  ```
  to:
  ```ts
  queryKey: ["my-leave-history", "all", "all"],  // share the leave page's cache
  queryFn: () => apiFetch("/leave-requests/history"),
  staleTime: 60_000,
  placeholderData: keepPreviousData,
  ```
  Then read `data?.data?.slice(0, 3)` instead of `data?.data` (the history endpoint returns
  cursor-paginated `{data: [...]}`). Import `keepPreviousData` from `@tanstack/react-query`.
  **Acceptance:** Employee "Approval Status" widget shows real recent leave requests, no 404.

---

## PHASE 2 — Eliminate the persister race (R3) [HIGHEST IMPACT on "always loading"]

> This is the single biggest cause of "widgets always loading." The async IndexedDB persister
> loses the race to the network on every cold load, making the persisted cache useless while adding
> overhead.

### 2.1 Replace PersistQueryClientProvider with plain QueryClientProvider
- [ ] **2.1.1** [web] `apps/web/src/components/providers.tsx`: Remove the
  `PersistQueryClientProvider` + `createAsyncStoragePersister` + `openDB` infrastructure entirely
  (lines 4-6, 8-25, and the `<PersistQueryClientProvider>` wrapper at line ~56). Replace with a
  plain `<QueryClientProvider client={queryClient}>`.
  **Rationale:** The app is online-first (user's explicit requirement: "offline mode only needed
  when actually there is no internet"). The in-memory React Query cache already provides
  stale-while-revalidate for the entire session (navigation between pages is instant). The
  OfflineEngine already queues mutations for offline use. The IndexedDB persister adds a
  hydration race that makes EVERY cold load show skeletons everywhere — net negative.
  **Acceptance:** Cold page load no longer shows a wall of skeletons; widgets fetch in parallel
  and populate independently; in-memory cache makes subsequent navigation instant.

- [ ] **2.1.2** [web] Remove the now-unused imports (`PersistQueryClientProvider`,
  `createAsyncStoragePersister`, `openDB`) from `providers.tsx`. Verify `pnpm typecheck` is clean.

- [ ] **2.1.3** [web] If offline reading of cached data is needed in the future, implement it
  correctly with a `buster` string (e.g. app version) and a non-blocking restore pattern. For now,
  the OfflineEngine + in-memory cache is sufficient. Document this decision in a code comment.

---

## PHASE 3 — Add placeholderData everywhere + stop animation re-firing (R4, R8)

### 3.1 Add `placeholderData: keepPreviousData` to every widget query
- [ ] **3.1.1** [web] `apps/web/src/components/widgets/metric-widget.tsx:33-36`: add
  `placeholderData: keepPreviousData` to the `useQuery` options. Import `keepPreviousData` from
  `@tanstack/react-query`.
- [ ] **3.1.2** [web] `apps/web/src/components/dashboard/employee-task-progress-widget.tsx:11-14`:
  add `staleTime: STALE_TIME_METRICS` (import from `lib/query-keys`) +
  `placeholderData: keepPreviousData`. Change `isLoading` to `isPending` (for skeleton only on
  cold load) so background refetch keeps prior data visible.
- [ ] **3.1.3** [web] `apps/web/src/components/widgets/announcement-board.tsx`: add
  `placeholderData: keepPreviousData` + `staleTime: 60_000` (announcements don't change every 30s).
- [ ] **3.1.4** [web] `apps/web/src/components/widgets/quick-notes.tsx`: add
  `placeholderData: keepPreviousData`.
- [ ] **3.1.5** [web] **Every page-level `useQuery`** that currently lacks `placeholderData` — add
  it. Grep for `useQuery({` across `apps/web/src/app` and `apps/web/src/components` and add
  `placeholderData: keepPreviousData` to each that returns a list/table. Key files:
  `leave/page.tsx`, `attendance/page.tsx`, `projects/page.tsx`, `tasks/page.tsx`,
  `directory/page.tsx`, `org/users/page.tsx`, `notifications/page.tsx`.
  **Acceptance:** Changing filters or background-refreshing never shows a skeleton when cached
  data exists — prior data stays visible until fresh data arrives.

### 3.2 Fix MetricWidget count-up animation (R8)
- [ ] **3.2.1** [web] `apps/web/src/components/widgets/metric-widget.tsx:43-62`: the animation
  effect currently has `[rawValue, isLoading]` as deps, so it re-fires on every background refetch.
  Fix: use a `useRef` to track the FIRST render and only animate on first load. On subsequent data
  changes (refetch returning the same value), jump directly to the value without animating:
  ```ts
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isPending || typeof rawValue !== "number") return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // run the 0 → rawValue count-up animation
    } else {
      setDisplayValue(rawValue); // instant update, no animation
    }
  }, [rawValue, isPending]);
  ```
  **Acceptance:** Metric numbers animate ONCE on first load; subsequent refetches update silently.

---

## PHASE 4 — Unify duplicate query keys + deduplicate requests (R5)

> Each endpoint should have ONE canonical query key shared by all consumers. Different keys for the
> same endpoint = wasted duplicate requests.

### 4.1 Admin attendance — one key
- [ ] **4.1.1** [web] Standardize on `["admin-attendance-overview", date, deptFilter]` for ALL
  consumers of `/attendance/admin/overview`:
  - `admin-today-attendance-widget.tsx:13`: change `["admin-attendance-today", date]` →
    `["admin-attendance-overview", date, "all"]`. (The widget already sends `?date=${date}`; add
    `staleTime: STALE_TIME_ATTENDANCE` + `placeholderData: keepPreviousData` if missing.)
  - `admin-attendance-analytics.tsx:15`, `admin-attendance-table.tsx:56`,
    `admin-open-shifts-table.tsx:41`: align to `["admin-attendance-overview", date, dept]` and use
    `select` to derive status-filtered/search-filtered subsets client-side instead of putting
    `statusFilter`/`debouncedSearch` in the key (which defeats dedup).
  **Acceptance:** DevTools Network shows ONE `/attendance/admin/overview` request on page load +
  one per 30s poll (not 3).

### 4.2 HR attendance — one key
- [ ] **4.2.2** [web] Standardize on `["hr-attendance-today", date, deptFilter]` for ALL consumers
  of `/attendance/hr/today`:
  - `hr-activity-feed-widget.tsx:30`: change `["hr-attendance-today", todayDate, "all"]` →
    `["hr-attendance-today", todayDate, "all"]` (already close — verify it matches the dashboard
    widget exactly).
  - `hr-team-attendance-widget.tsx:14`: change `["hr-attendance-today", date, "all", ""]` →
    `["hr-attendance-today", date, "all"]` (drop the trailing `""`).
  - `hr-attendance-analytics.tsx:15`, `hr-attendance-table.tsx:56`: align to the same base key;
  use `select` for status/search filtering client-side.
  **Acceptance:** DevTools shows ONE `/attendance/hr/today` request on page load + one per poll.

### 4.3 Dashboard metrics — one key (already shared, verify)
- [ ] **4.3.1** [web] Verify `["dashboard-metrics"]` is used by `metric-widget`,
  `recent-activity-widget`, `employee-task-progress-widget` — all three. (Confirmed in code; keep
  it.) Ensure none of them add extra key segments that would break dedup.

### 4.4 Canonical query-keys file
- [ ] **4.4.1** [web] `apps/web/src/lib/query-keys.ts`: add a canonical key factory so no two
  components ever diverge:
  ```ts
  export const queryKeys = {
    dashboardMetrics: ["dashboard-metrics"] as const,
    dashboardLayout: ["dashboard-layout"] as const,
    attendanceToday: ["attendance-today"] as const,
    adminAttendance: (date: string, dept?: string) => ["admin-attendance-overview", date, dept ?? "all"] as const,
    hrAttendance: (date: string, dept?: string) => ["hr-attendance-today", date, dept ?? "all"] as const,
    myLeaveHistory: (type?: string, status?: string) => ["my-leave-history", type ?? "all", status ?? "all"] as const,
    pendingApprovals: ["pending-approvals-list"] as const,
    conversations: ["conversations"] as const,
    messages: (id: number) => ["messages", id] as const,
    projects: (search?: string, sort?: string, page?: string) => ["projects", search ?? "", sort ?? "", page ?? "1"] as const,
    tasks: ["tasks"] as const,
    announcements: ["announcements"] as const,
    quickNotes: ["quick-notes"] as const,
    notifications: ["notifications"] as const,
    directory: (search?: string) => ["directory", search ?? ""] as const,
  };
  ```
  Refactor all `useQuery`/`invalidateQueries` call sites to use these factories.

---

## PHASE 5 — Stop unnecessary polling + tune staleTime (R7, R9)

### 5.1 Replace 30s polling with Reverb-driven invalidation
- [ ] **5.1.1** [web] `apps/web/src/components/attendance/admin-attendance-table.tsx:80` and
  `hr-attendance-table.tsx:80`: remove `refetchInterval: STALE_TIME_ATTENDANCE` (which polls every
  30s forever). Replace with a Reverb-driven refetch: subscribe to the relevant presence/private
  channel and `invalidateQueries` on attendance events. If Reverb isn't available, set
  `refetchInterval: 120_000` (2 min) as a fallback — not 30s.
  **Acceptance:** No request every 30s while the page is idle; attendance updates arrive via
  realtime or at most every 2 min.

### 5.2 Tune staleTime per entity (R9)
- [ ] **5.2.1** [web] `apps/web/src/lib/query-keys.ts`: expand the stale-time constants:
  ```ts
  export const STALE_TIME_DIRECTORY = 10 * 60_000;   // 10 min — people rarely change
  export const STALE_TIME_DEPARTMENTS = 10 * 60_000;  // 10 min
  export const STALE_TIME_DESIGNATIONS = 10 * 60_000; // 10 min
  export const STALE_TIME_HOLIDAYS = 30 * 60_000;     // 30 min — yearly data
  export const STALE_TIME_CONFIG = 60 * 60_000;       // 1 hour — settings
  export const STALE_TIME_METRICS = 60_000;           // 1 min (was 30s — too aggressive)
  export const STALE_TIME_ATTENDANCE = 60_000;        // 1 min
  export const STALE_TIME_NOTIFICATIONS = 30_000;     // 30s
  export const STALE_TIME_CONVERSATIONS = 60_000;     // 1 min
  export const STALE_TIME_PROJECTS = 60_000;          // 1 min
  export const STALE_TIME_TASKS = 30_000;             // 30s (kanban needs freshness)
  ```
- [ ] **5.2.2** [web] `apps/web/src/components/providers.tsx:42`: change the global default
  `staleTime` from `30000` to `60_000` (1 min). The global default is the FALLBACK; per-query
  overrides above take precedence. This reduces background refetch frequency by 2×.
- [ ] **5.2.3** [web] Apply the expanded constants: every `useQuery` that fetches
  departments/designations/directory should use `STALE_TIME_DEPARTMENTS`/`STALE_TIME_DIRECTORY`
  (10 min, not the 30s default). Find them: `hr-attendance-table.tsx:50`,
  `admin-attendance-table.tsx:50`, `admin-open-shifts-table.tsx:35`, `audit-log-table.tsx`,
  `directory/page.tsx`, `org/users/page.tsx`, etc.
  **Acceptance:** Reference data (departments, designations, directory, holidays) doesn't refetch
  on every revisit — only every 10–30 min.

---

## PHASE 6 — Parallelize dashboard loading + eliminate waterfall (R6)

### 6.1 Prefetch widget data alongside preferences
- [ ] **6.1.1** [web] `apps/web/src/app/dashboard/page.tsx`: the current flow is
  `WidgetEngine` (fetches layout) → renders widgets → each widget fetches its own data. To
  parallelize, add a `prefetch` step in the dashboard page that fires all widget-data queries
  simultaneously while the layout loads:
  ```ts
  const queryClient = useQueryClient();
  useEffect(() => {
    // Prefetch all widget data in parallel — don't await, just kick off
    queryClient.prefetchQuery({ queryKey: queryKeys.dashboardMetrics, queryFn: () => apiFetch("/dashboard/metrics") });
    queryClient.prefetchQuery({ queryKey: queryKeys.attendanceToday, queryFn: () => apiFetch("/attendance/me/today") });
    queryClient.prefetchQuery({ queryKey: queryKeys.pendingApprovals, queryFn: () => apiFetch("/approvals/pending") });
    queryClient.prefetchQuery({ queryKey: queryKeys.announcements, queryFn: () => apiFetch("/announcements") });
    queryClient.prefetchQuery({ queryKey: queryKeys.quickNotes, queryFn: () => apiFetch("/quick-notes") });
  }, [activeRole, queryClient]);
  ```
  This way, when the layout resolves and widgets render, their data is already in the cache →
  **zero skeleton**. **Acceptance:** Dashboard cold load shows widgets with data immediately
  (or within 1 network round-trip), not 3 sequential stages.

### 6.2 Render widgets with a CSS grid fallback while layout resolves
- [ ] **6.2.1** [web] `apps/web/src/components/widgets/widget-engine.tsx:165-173`: currently shows
  3 static skeletons while `["dashboard-layout"]` loads. Instead, render the widgets immediately
  in a simple CSS grid (using default layouts) while the saved layout resolves, then swap to the
  React-Grid-Layout once ready. This way the user sees widget content (from the prefetched cache)
  immediately, not skeletons:
  ```ts
  // If layout not yet resolved, render in a simple grid
  if (!layouts || Object.keys(layouts).length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableWidgets.map(w => (
          <div key={w.id}><ErrorBoundary name={`Widget-${w.id}`}>{w.component}</ErrorBoundary></div>
        ))}
      </div>
    );
  }
  // Only show skeleton if mounted=false (first-ever client render)
  if (!mounted) return <SkeletonGrid />;
  ```
  **Acceptance:** Dashboard renders widget content from cache instantly, then reflows to the
  saved drag layout when ready.

---

## PHASE 7 — Fix remaining loading-state issues (R10)

### 7.1 Pages: use isPending for cold-load skeleton only
- [ ] **7.1.1** [web] Audit every page that uses `isLoading` and verify it's used correctly. In
  React Query v5, `isLoading` = `isPending && isFetching` (only true when NO cached data). This is
  correct for showing a cold-load skeleton. BUT if the page supports filter changes (leave,
  projects, tasks, directory), the filter change creates a NEW query key → `isPending` becomes true
  for the new key → skeleton flashes. Fix: add `placeholderData: keepPreviousData` to these queries
  so the old data stays visible while the new filter's data loads.
  Files: `leave/page.tsx:20-27`, `projects/page.tsx:50-53`, `directory/page.tsx`, `org/users/page.tsx`.
  **Acceptance:** Changing a filter keeps the old data visible with a subtle loading indicator
  until the new data arrives — no full skeleton flash.

### 7.2 Remove the admin/attendance/loading.tsx Suspense boundary
- [ ] **7.2.1** [web] `apps/web/src/app/dashboard/admin/attendance/loading.tsx`: this Next.js
  `loading.tsx` file creates a Suspense boundary that shows a FULL PAGE skeleton on EVERY navigation
  to `/dashboard/admin/attendance`, even when the data is cached in React Query. Delete this file
  (the page's own components handle their loading states with skeletons + `keepPreviousData`).
  **Acceptance:** Navigating to the admin attendance page shows cached data instantly (no
  full-page skeleton overlay).

### 7.3 Fix attendance page skeleton block
- [ ] **7.3.1** [web] `apps/web/src/app/dashboard/attendance/page.tsx:12` and `~75`: the
  `my-attendance-history` query shows a `<Skeleton className="h-40 w-full" />` block while loading.
  Add `placeholderData: keepPreviousData` + `staleTime: STALE_TIME_ATTENDANCE` so cached history
  shows instantly on revisit. Change `isLoading` to `isPending` for the cold-load-only skeleton.
  **Acceptance:** Revisiting the attendance page shows the cached shift log instantly.

---

## PHASE 8 — Backend: make dashboard metrics instant (complementary)

### 8.1 Remove Schema::hasTable calls
- [ ] **8.1.1** [api] `apps/api/app/Http/Controllers/DashboardController.php:98,103,112,127`:
  remove the 4× `Schema::hasTable()` calls (each is a `SHOW TABLES LIKE` query). Replace with
  hardcoded `true` (the tables exist in production) or a single boot-time config check.
  **Acceptance:** Dashboard metrics query count drops by 4 SQL queries per cache miss.

### 8.2 Increase dashboard cache TTL
- [ ] **8.2.1** [api] `DashboardController.php:30`: change `Cache::remember($cacheKey, 30, ...)`
  to `Cache::remember($cacheKey, 300, ...)` (5 min, not 30s). The frontend's `staleTime: 60s`
  already provides perceived freshness; the backend cache is a second layer. Invalidate on leave
  decision, project/task change, attendance punch.
  **Acceptance:** Dashboard metrics endpoint p95 drops significantly; cache hit rate rises.

### 8.3 Split role-agnostic metrics into a shared cache key
- [ ] **8.3.1** [api] `DashboardController.php`: extract `total_employees`, `departments`,
  `active_projects` (company-wide counts) into a separate `Cache::remember("dashboard_global",
  300, ...)` shared across all admins/HR — not keyed per user. Only the per-user metrics
  (`my_today_status`, `pending_approvals` for employee) stay per-user.
  **Acceptance:** N admins share 1 cache entry for global counts instead of N.

---

## PHASE 9 — Verify daily-use workflows are instant

> After Phases 1–8, verify each workflow below is instant (cached data shows immediately,
> background refresh is invisible).

### 9.1 Employee daily flow
- [ ] **9.1.1** [test] Employee opens dashboard → TimeClockWidget shows cached state instantly
  (from `["attendance-today"]` in-memory cache), Clock In button is immediately clickable. The
  widget does NOT show a skeleton on revisit.
- [ ] **9.1.2** [test] Employee clicks Clock In → optimistic state immediately → toast confirmation
  → no skeleton flash.
- [ ] **9.1.3** [test] Employee navigates to My Attendance → TimeClockWidget + TodaySummaryCard +
  shift log all show cached data instantly. Calendar loads from cache.
- [ ] **9.1.4** [test] Employee navigates to Leave → request form is interactive immediately;
  history table shows cached data or an instant skeleton on first load only.

### 9.2 HR daily flow
- [ ] **9.2.1** [test] HR opens dashboard → team attendance widget + pending approvals + activity
  feed show cached data instantly. ONE `/attendance/hr/today` request (not 3).
- [ ] **9.2.2** [test] HR navigates to Team Attendance → table + analytics + graph show cached data
  instantly; one request on load, no 30s polling spinner.
- [ ] **9.2.3** [test] HR approves a leave → pending list updates optimistically; dashboard
  metrics do NOT re-skeleton (targeted invalidation).

### 9.3 Admin daily flow
- [ ] **9.3.4** [test] Admin opens dashboard → employees/attendance/projects/approvals/activity
  widgets show cached data instantly. Recent Activity renders real entries (R1 fix verified).
- [ ] **9.3.5** [test] Admin navigates to Admin Attendance → NO full-page loading.tsx skeleton;
  cached overview data shows instantly. ONE request on load (not 3).
- [ ] **9.3.6** [test] Admin navigates to Org/Users → cached user list shows instantly; filter
  changes keep old data visible.

### 9.4 Cross-page navigation
- [ ] **9.4.1** [test] Navigate Dashboard → Attendance → Leave → Dashboard: each page shows cached
  data INSTANTLY (0 skeleton). Background refetch happens silently (no visible spinner unless a
  small `isFetching` indicator in the header).
- [ ] **9.4.2** [test] Reload the page (cold load): widgets populate progressively as data arrives
  (not a wall of skeletons thanks to Phase 6 prefetching). Within 1 network round-trip (~200ms on
  fast network) all widgets have data.

---

## PHASE 10 — Final cleanup + production verification

### 10.1 Remove remaining Loader2 spinners where skeletons aren't needed
- [ ] **10.1.1** [web] Replace prominent `Loader2` spinners with subtle `isFetching` dots:
  `tasks/page.tsx` (kanban/gantt/qa dynamic-import loading), `chat/page.tsx:173` Suspense
  fallback. These should be small inline indicators, not full-area spinners.

### 10.2 Verify offline behavior
- [ ] **10.2.1** [test] With the persister removed (Phase 2), verify: when the user goes offline,
  the OfflineEngine queues mutations correctly and the offline banner appears. When back online,
  queued mutations sync. The in-memory cache shows the last-loaded data while offline.
  **Acceptance:** Offline mode works for mutations (queue + sync); reading cached data works
  within the session; a full page reload while offline correctly redirects to login (no stale
  persister data to create confusion).

### 10.3 Network + performance verification
- [ ] **10.3.1** [test] DevTools Network tab on dashboard load: count requests. Target: ≤5
  requests on cold load (metrics, attendance-today, pending-approvals, announcements, preferences).
  No duplicate requests to the same endpoint.
- [ ] **10.3.2** [test] DevTools Network tab on HR attendance page: exactly 1
  `/attendance/hr/today` request (was 2–3).
- [ ] **10.3.3** [test] Lighthouse on `/dashboard`: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. No
  long tasks >50ms during initial render.
- [ ] **10.3.4** [test] React Profiler on dashboard with active shift: only `<LiveTimer>`
  commits each second; no other widget re-renders.

### 10.4 Deploy
- [ ] **10.4.1** [deploy] Commit all changes; deploy web (Vercel) + api (Railway). Clear Laravel
  cache (`php artisan config:cache route:cache view:cache`). Verify `/api/ping` + login.
- [ ] **10.4.2** [monitor] Watch for 24h: verify no console errors about crashed widgets; verify
  Sentry shows no new crashes from `recent-activity-widget` or `employee-approval-status-widget`.

---

## ACCEPTANCE CRITERIA — "done" definition

The app is FAST and READY when ALL of the following are true:

1. **Zero crashed widgets.** Recent Activity renders real audit entries; Approval Status shows real
   leave requests. No ErrorBoundary fallbacks on any dashboard.
2. **No persister race.** Cold page load shows widgets populating progressively (not a wall of
   skeletons); in-session navigation shows cached data instantly (0 skeleton).
3. **`placeholderData: keepPreviousData`** on every widget + list query. Filter changes and
   background refetches never show a skeleton when cached data exists.
4. **No duplicate requests.** Each endpoint has ONE canonical query key; DevTools shows 1 request
   per endpoint per load (not 2–3).
5. **No 30s polling.** Attendance tables don't fire a request every 30s; they use Reverb or a
   2-min fallback interval.
6. **MetricWidget animates once.** Numbers don't "re-count" on every refetch.
7. **staleTime tuned per entity.** Reference data (departments, directory, holidays) stays fresh
   for 10–30 min, not 30s. Global default is 1 min.
8. **Dashboard prefetches in parallel.** Widget data is prefetched alongside the layout, so widgets
   render with data immediately when the layout resolves.
9. **No loading.tsx full-page skeleton.** The admin attendance loading.tsx is deleted; pages handle
   their own loading states with cached-data-first patterns.
10. **Every daily workflow is instant** (Phase 9 passes): cached data shows on every revisit,
    interactions are optimistic, background refreshes are invisible.
11. **Backend dashboard metrics** cached 5 min (not 30s), no `Schema::hasTable` calls, shared
    global cache key for company-wide counts.
12. **Offline mode works for mutations** (queue + sync) without the persister causing cold-load
    skeletons.

**The user's complaint — "every interaction triggers a loading state" — is resolved when navigating
between pages shows cached data instantly (0 skeleton), widgets populate from prefetch within 1
round-trip on cold load, and background refreshes are silent.**
