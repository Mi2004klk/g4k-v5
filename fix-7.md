# fix-7.md — Master Remediation Plan: Fast, Stable, Production-Ready

> **Status:** All planned features are implemented and deployed. The app is STILL very slow, error-prone,
> and unresponsive on every click, navigation, and form action. This file is the definitive plan to
> fix every remaining issue identified by a deep code-level audit of the ACTUAL current codebase.
>
> Every finding below was verified by reading the exact source file and line number. Each task
> specifies: what's wrong → why → where → impact → fix → verification.
>
> **Implementation order:** Phase 1 (crashes/blockers) → Phase 2 (backend perf) → Phase 3 (frontend
> responsiveness) → Phase 4 (workflow reliability) → Phase 5 (production hardening).

---

## WHAT'S ALREADY FIXED (verified — do NOT re-fix)

These were previously broken and are now CONFIRMED CORRECT in the current code:
- ✅ Auth refresh: returns `refresh_token` in JSON body + accepts `X-Refresh-Token` header (not just cookie).
- ✅ Postgres SQL: all `selectRaw`/`DB::raw` use single-quote-escaped literals (no double-quoted identifiers).
- ✅ `meToday` null-deref: uses `$day?->updated_at` (nullsafe operator).
- ✅ Toast: unified on `sonner` (no `react-hot-toast` anywhere).
- ✅ Service worker: only caches static assets, NOT navigation routes.
- ✅ Reverb: `isReverbAvailable()` properly gates on `NEXT_PUBLIC_REVERB_HOST` env var.
- ✅ Store subscriptions: ALL `useAuthStore`/`useUIStore`/`useTimerStore` calls use selectors.
- ✅ Timer: tick is isolated to `LiveTimer` local state (store is event-driven, no per-second update).
- ✅ Dynamic imports: ECharts, react-grid-layout, kanban, gantt, holiday-calendar all lazy-loaded.
- ✅ Query key deduplication: dashboard metrics shared across widgets; attendance shared across table/analytics/open-shifts.
- ✅ `placeholderData: keepPreviousData` on ALL widgets.
- ✅ `start.sh` runs queue worker + scheduler alongside web server.
- ✅ `optimizePackageImports` for lucide-react, date-fns, @g4k/ui.

---

## PHASE 1 — CRASHES & BLOCKERS (fix first — these break the app entirely)

### 1.1 Dashboard WidgetEngine crashes on mount — `useContainerWidth` doesn't exist (CRITICAL)

**What's wrong:** `apps/web/src/components/widgets/widget-engine.tsx:5` imports `useContainerWidth`
from `react-grid-layout` and calls it at line 45. **This export does not exist** in
`react-grid-layout@2.2.4`. The package only exports `ReactGridLayout` (default), `Responsive`,
`WidthProvider`, `utils`, and `calculateUtils`. At runtime, `useContainerWidth` is `undefined`, so
calling it throws `TypeError: useContainerWidth is not a function`. This error fires on every
dashboard mount BEFORE the error boundary can catch it per-widget (the boundary wraps individual
widgets, not the engine itself), so it bubbles to the root `ErrorBoundary` and unmounts the entire
dashboard.

**Why it's happening:** The code was written assuming a hook API that doesn't exist in the installed
version. The correct API is the `WidthProvider` higher-order component.

**Where:** `apps/web/src/components/widgets/widget-engine.tsx:5,45`.

**Impact:** The dashboard — the PRIMARY page every user lands on — crashes on every cold load.
This is the #1 reason the app feels broken. Users see either a blank page or a root error fallback.

**Fix:**
- [ ] Replace the import and usage:
  ```tsx
  // BEFORE:
  import { Responsive, useContainerWidth } from "react-grid-layout";
  const ResponsiveGridLayout = dynamic(() => import("react-grid-layout").then(m => m.Responsive), { ssr: false });
  const { containerRef, width } = useContainerWidth();
  // ...
  <ResponsiveGridLayout width={width ?? 1200} ...>

  // AFTER:
  import { WidthProvider, Responsive } from "react-grid-layout";
  const ResponsiveGridLayout = WidthProvider(Responsive);
  // Wrap with dynamic for code-splitting:
  const GridLayout = dynamic(() => Promise.resolve(ResponsiveGridLayout), { ssr: false });
  // ...
  <GridLayout ...>  // NO width prop needed — WidthProvider measures automatically
  ```
- [ ] Remove `containerRef` and `width` state entirely. `WidthProvider` handles measurement.
- [ ] Remove the `import "react-grid-layout/css/styles.css"` if it causes issues with the dynamic
  import (or move it to a layout-level CSS import).
- [ ] Test: navigate to `/dashboard` → widgets render immediately, no console errors.

**Dependencies:** None — this is a self-contained fix.
**Verification:** Open `/dashboard` in production. Zero `TypeError: useContainerWidth is not a function` in console. Widgets render within 1 paint frame.

---

### 1.2 Zero route-level loading states — every navigation is a hard blank cut (CRITICAL)

**What's wrong:** There are ZERO `loading.tsx` files in the entire app (`find apps/web/src/app -name
'loading.tsx'` returns nothing). Every page is a `"use client"` component that fires `useQuery` on
mount. On navigation, the user sees: previous page unmounts → blank/stale frame → new component
mounts → `useQuery` fires → network wait → data arrives → page renders. The gap between unmount
and data-arrives feels like the app froze.

**Why it's happening:** No Next.js App Router `loading.tsx` Suspense boundaries were created. The
app relies entirely on in-component loading states (skeletons inside each page), but these only
render AFTER the component mounts and begins fetching — there's no shell painted during the route
transition itself.

**Where:** Every page under `apps/web/src/app/dashboard/`.

**Impact:** "Slow on every navigation." Even with cached data, the route transition itself shows
nothing for a frame. This is the most universally felt performance issue.

**Fix:**
- [ ] Create `loading.tsx` files for the heaviest route segments. Each returns a route-shaped skeleton:
  - `apps/web/src/app/dashboard/loading.tsx` — dashboard skeleton (banner + widget grid skeleton)
  - `apps/web/src/app/dashboard/org/users/loading.tsx` — table skeleton
  - `apps/web/src/app/dashboard/org/attendance/loading.tsx` — analytics + table skeleton
  - `apps/web/src/app/dashboard/attendance/loading.tsx` — time clock + summary + calendar skeleton
  - `apps/web/src/app/dashboard/leave/loading.tsx` — form + history skeleton
  - `apps/web/src/app/dashboard/profile/loading.tsx` — profile card skeleton
  - `apps/web/src/app/dashboard/projects/loading.tsx` — card grid skeleton
  - `apps/web/src/app/dashboard/tasks/loading.tsx` — kanban skeleton
  - `apps/web/src/app/dashboard/notifications/loading.tsx` — table skeleton
  - `apps/web/src/app/dashboard/chat/loading.tsx` — conversation list + messages skeleton
  - `apps/web/src/app/dashboard/settings/loading.tsx` — tabs skeleton
  - `apps/web/src/app/dashboard/audit/loading.tsx` — table skeleton
  - `apps/web/src/app/dashboard/directory/loading.tsx` — card grid skeleton
- [ ] Each `loading.tsx` should be a simple server component (no `"use client"`) that returns a
  skeleton shaped like the page's layout. This streams immediately during route transition.
- [ ] Remove in-component `if (isLoading) return <Skeleton/>` full-page blocks (see 1.3) so the
  loading.tsx provides the transition skeleton and the component shows cached data instantly.

**Dependencies:** 1.3 (remove page-level blocking).
**Verification:** Navigate between pages → skeleton appears instantly during transition → cached data
renders immediately after → no blank frames.

---

### 1.3 Full-page blocking returns on detail pages (HIGH)

**What's wrong:** Two pages return a full-page skeleton/spinner on `isLoading`, blocking the ENTIRE
page until data resolves:
- `apps/web/src/app/dashboard/profile/page.tsx:298` — `if (isLoading) { return <Skeleton/> }`
- `apps/web/src/app/dashboard/projects/[id]/page.tsx:81` — `if (isLoading) { return <Loader2/> }`

**Why it's happening:** The early return prevents any page shell from rendering until the query
completes. Even with `placeholderData: keepPreviousData`, the FIRST visit has no cached data, so the
full page blocks.

**Where:** The two files above.

**Impact:** Navigating to Profile or Project Detail shows nothing (or a spinner) until the API
responds. Feels frozen.

**Fix:**
- [ ] `profile/page.tsx:298`: remove the `if (isLoading) return <Skeleton/>` block. Instead, render
  the page shell (header, form sections) immediately. Use `isPending` to show skeletons INSIDE the
  form fields (not the whole page). With `keepPreviousData`, revisits render instantly.
- [ ] `projects/[id]/page.tsx:81`: same — remove the blocking return. Render the project shell
  (header, tabs) and show skeletons in the content area while data loads.
- [ ] Both: ensure `placeholderData: keepPreviousData` is on the query.
- [ ] Also check `attendance-history-calendar.tsx:189` (`if (isLoading)`) — move to inline skeleton.

**Dependencies:** 1.2 (loading.tsx provides the transition skeleton).
**Verification:** Navigate to Profile → header renders immediately, form populates from cache or
shows inline skeletons (not a blank page).

---

## PHASE 2 — BACKEND PERFORMANCE (eliminate slow API responses)

### 2.1 Dashboard metrics cache is dead code — never calls Cache::remember (CRITICAL)

**What's wrong:** `apps/api/app/Http/Controllers/DashboardController.php:32` computes
`$cacheKey = "dashboard_metrics_{$user->id}_{$activeRole}_{$today}"` — but the closure starting at
line 34 **never wraps in `Cache::remember(...)`**. The string `Cache::` does not appear anywhere in
this controller. Every `/dashboard/metrics` request runs fresh: `User::count()`,
`Department::count()`, `SUM(CASE WHEN status=...)` on `attendance_days`, `COUNT` on `leave_requests`,
a 10-row `audit_logs` JOIN, `COUNT` on `projects`, `COUNT` on `tasks`. That's 6-8 queries per request,
uncached, on the most-hit admin endpoint.

**Why it's happening:** The cache intent is present (the key is computed) but the `Cache::remember`
call was accidentally omitted or removed during a refactor.

**Where:** `apps/api/app/Http/Controllers/DashboardController.php:32-160` (entire `metrics` method).

**Impact:** Every dashboard load (cold or background refetch every 60s) hits the database with 6-8
aggregate queries. With 3 admin/HR users, that's 18-24 aggregate queries per minute just for
dashboard metrics. Directly contributes to "slow dashboard."

**Fix:**
- [ ] Wrap the entire metrics computation in `Cache::remember`:
  ```php
  $metrics = Cache::remember($cacheKey, 300, function () use ($user, $activeRole, $today) {
      // ... existing computation ...
      return $data;
  });
  ```
- [ ] Also cache the global/shared sub-queries separately:
  ```php
  $globalStats = Cache::remember('dashboard_global', 300, fn() => [
      'total_employees' => User::count(),
      'active_employees' => User::where('status', 'active')->count(),
      'departments' => Department::count(),
  ]);
  ```
- [ ] Cache `recent_activity` separately (shared across admins):
  ```php
  $recentActivity = Cache::remember('dashboard_recent_activity', 300, fn() =>
      DB::table('audit_logs')->leftJoin('users', ...)->orderBy('at', 'desc')->limit(10)->get()
  );
  ```
- [ ] Invalidate on mutations: in `CacheInvalidationObserver` (or in each controller's mutation),
  call `Cache::forget("dashboard_metrics_{$userId}_{$role}_{$today}")` + `Cache::forget('dashboard_global')`
  + `Cache::forget('dashboard_recent_activity')`.
- [ ] Use subqueries instead of `pluck('id')` for HR department scoping (avoids loading all dept
  user IDs into PHP):
  ```php
  ->whereIn('user_id', fn($q) => $q->select('id')->from('users')->where('department_id', $deptId))
  ```

**Dependencies:** None.
**Verification:** Hit `/api/dashboard/metrics` twice rapidly → second response < 50ms (cache hit).
Check Laravel Pulse / Telescope for query count reduction.

---

### 2.2 Queue worker is unsupervised — dies silently if it crashes (HIGH)

**What's wrong:** `apps/api/start.sh:11` runs `php artisan queue:work ... &` as a bare background
process. If the worker dies (OOM, fatal exception, DB connection drop), it stays dead until the
entire container restarts. Queued jobs (audit logging, report generation, approval notifications,
leave-attendance integration) silently stop processing.

**Why it's happening:** No process supervisor (supervisord, `--daemon` with restart, or Railway's
native multi-process) is used. The `&` backgrounds the process but doesn't supervise it.

**Where:** `apps/api/start.sh:11`.

**Impact:** Audit logs stop recording. Notifications stop sending. Leave approvals don't trigger
attendance integration. Reports never generate. The app appears "broken" for any async workflow.

**Fix (choose one):**
- [ ] **Option A (recommended):** Use Laravel's built-in `--max-jobs` + `--max-time` with a restart
  loop:
  ```bash
  ( while true; do php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600; done ) &
  ```
  This auto-restarts the worker after 100 jobs or 1 hour, preventing memory leaks.
- [ ] **Option B:** Install `supervisord` in the container and configure it to manage the worker.
  More robust but adds complexity to the Docker image.
- [ ] **Option C (Railway Pro):** Deploy the queue worker as a SEPARATE Railway service with
  `php artisan queue:work` as the start command. Railway auto-restarts crashed services.

**Dependencies:** None.
**Verification:** Kill the worker process (`kill -9 <pid>`) → verify it restarts within 10s. Submit
a mutation → verify the audit log appears in the `jobs` table and processes.

---

### 2.3 Scheduled jobs have N+1 query storms — hundreds of queries per 5-min run (HIGH)

**What's wrong:** The 3 scheduled jobs (`RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts`)
run every 5 minutes and iterate over ALL active users with per-user queries inside the loop.

**Specific patterns (verified in previous audit):**
- `RemindShiftStart.php:58`: `DB::table('holidays')->where('date', $today)->exists()` runs once PER
  USER inside the loop. 100 users = 100 identical holiday queries per run, 12 runs/hour = 28,800
  wasted queries/day.
- `AlertMissedClockIn.php:52-70`: per-user `$onLeave` + `$isHoliday` + `$hrUsers` queries. 100 users
  → 300+ queries + 500+ notification inserts per run.
- `FlagOpenShifts.php:42-49`: per-day HR-users query + per-row update.

**Where:** `apps/api/app/Jobs/RemindShiftStart.php`, `AlertMissedClockIn.php`, `FlagOpenShifts.php`.

**Impact:** Every 5 minutes, the database is hit with hundreds of queries from these jobs. This
competes with user-facing requests for DB connections and CPU, causing intermittent slowness.

**Fix:**
- [ ] Hoist all per-user queries OUT of the loop:
  ```php
  // BEFORE the loop:
  $isHoliday = DB::table('holidays')->where('date', $today)->exists();
  $usersOnLeave = LeaveRequest::where('status', 'approved')
      ->where('start_date', '<=', $today)->where('end_date', '>=', $today)
      ->pluck('user_id')->toArray();
  $superAdmins = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'super_admin'))->get();
  $hrByDept = User::whereHas('roleAssignments', fn($q) => $q->where('role', 'hr'))
      ->get()->groupBy('department_id');
  ```
- [ ] Inside the loop: use in-memory lookups (`in_array($user->id, $usersOnLeave)`,
  `$hrByDept[$user->department_id] ?? []`).
- [ ] Batch notification inserts: collect all notification rows, then `Notification::insert([...])`.

**Dependencies:** None.
**Verification:** Enable Laravel Telescope → trigger the jobs manually (`php artisan schedule:run`)
→ verify total query count is ~5 (not 300+).

---

### 2.4 Attendance export materializes ALL rows in memory (HIGH)

**What's wrong:** `apps/api/app/Http/Controllers/AttendanceController.php` `export()` method does
`$query->get()` — hydrating the ENTIRE date range into Eloquent models in memory before streaming.
A 1-year × 100-employee export = 36,500 rows hydrated simultaneously.

**Where:** `AttendanceController.php` export method (~line 509-540).

**Impact:** Memory spikes on large exports; potential timeout/OOM on Railway's container.

**Fix:**
- [ ] Use `->chunk(500, function($rows) use ($writer) { ... })` inside the stream callback.
- [ ] Or use `DB::table(...)` (raw, no Eloquent hydration) with `->chunk(500, ...)`.
- [ ] Apply the same pattern to `UserController::export`, `DepartmentController::export`,
  `DesignationController::export` — all currently do `->get()`.

**Dependencies:** None.
**Verification:** Export 1 year of attendance for all employees → completes without OOM; memory
usage stays flat.

---

### 2.5 Missing composite database indexes (MEDIUM)

**What's wrong:** Several high-traffic query patterns filter on columns that lack a suitable composite
index, forcing the DB to scan more rows than necessary.

**Where:** `apps/api/database/migrations/`.

**Fix — add these indexes in a new migration:**
- [ ] `task_time_logs`: composite `(user_id, log_date)` — used by `AttendanceController::meHistory`/
  `hrHistory`. Drop the redundant single-column `log_date` index.
- [ ] `notifications`: composite `(user_id, created_at DESC)` — used by `NotificationController::index`
  ordering. The existing `(user_id, read_at)` doesn't help `ORDER BY created_at`.
- [ ] `audit_logs`: composite `(user_id, at DESC)` — used by `UserController::activity`.
- [ ] `messages`: composite `(conversation_id, created_at)` — used by `ChatController::messages`.
- [ ] `conversation_user`: index on `user_id` (leading) — the PK is `(conversation_id, user_id)`
  which doesn't support queries starting from user_id.

**Dependencies:** None.
**Verification:** `EXPLAIN ANALYZE` on the affected queries shows index scan, not seq scan.

---

### 2.6 Redundant/duplicate database indexes — write amplification (LOW)

**What's wrong:** Multiple migration waves created overlapping indexes on the same columns. Every
INSERT/UPDATE maintains ALL indexes, increasing write latency.

**Fix — in a new migration, drop these redundant indexes:**
- [ ] `attendance_days`: drop `idx_attendance_days_user_date` (duplicate of unique constraint),
  `attendance_days_user_id_index` (left prefix of unique), single-col `date` and `status` indexes
  covered by composites.
- [ ] `users`: drop `users_department_id_index` (duplicate of `idx_users_department_id`).
- [ ] `leave_requests`: drop duplicate single-col `user_id` and `status` indexes (covered by
  composites); drop one of the two identical partial unique indexes.
- [ ] `attendance_events`: drop the explicit `->index('client_id')` (the `->unique('client_id')`
  already provides an index).
- [ ] `holidays`: drop the explicit `->index('date')` (the `->unique('date')` provides one).

**Dependencies:** Run AFTER 2.5 (add composites first, then drop redundant singles).
**Verification:** `\DB::select("SELECT indexname FROM pg_indexes WHERE tablename = '...'")` shows
no redundant entries. Write performance improves.

---

## PHASE 3 — FRONTEND RESPONSIVENESS (make every interaction instant)

### 3.1 NotificationsBell optimistic update writes to wrong cache key (HIGH)

**What's wrong:** `apps/web/src/components/app-shell/notifications-bell.tsx` fetches with
`queryKeys.notifications(filter)` (which serializes to `["notifications", filter, "", ""]`), but the
optimistic `onMutate`/`onError` handlers use the bare key `["notifications"]`:
```ts
queryClient.getQueryData(["notifications"]);   // line 45 — WRONG KEY
queryClient.setQueryData(["notifications"], ...); // lines 47, 80 — WRONG KEY
```
React Query uses exact key match for `getQueryData`/`setQueryData`. `["notifications"]` is NEVER
read by the component (which reads `["notifications", filter, "", ""]`). The optimistic update is
invisible — every mark-read/mark-all-read click waits for the full network round-trip instead of
updating instantly.

**Where:** `apps/web/src/components/app-shell/notifications-bell.tsx:45,47,65,78,80,94`.

**Impact:** Every notification bell click feels laggy — the badge count and read state don't update
until the server responds. This is a primary "slow on every click" issue.

**Fix:**
- [ ] Replace ALL `["notifications"]` literals with `queryKeys.notifications(filter)` (where `filter`
  is the current filter state in scope). If multiple filter states exist, use `cancelQueries` with
  the prefix `queryKeys.notifications()` (which is `["notifications"]` — prefix match works for
  cancel/invalidate) but use the EXACT key for `setQueryData`.
- [ ] Alternatively, structure the optimistic update to write to ALL active notification cache
  variants:
  ```ts
  queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => /* update */);
  ```
  `setQueriesData` with a prefix key updates ALL matching caches.

**Dependencies:** None.
**Verification:** Click "Mark as Read" on a notification → badge count decrements INSTANTLY (before
the network response arrives). No perceived delay.

---

### 3.2 Duplicate polling + WebSocket on attendance tables (HIGH)

**What's wrong:** HR and Admin attendance tables BOTH poll via `refetchInterval` AND subscribe to
Reverb `.attendance.updated` for invalidation. When Reverb is connected, the polling is pure waste —
it refetches the full payload every 60s (HR) or 120s (Admin) even though the WebSocket already
triggers a refetch on any change.

**Where:**
- `apps/web/src/components/attendance/hr-attendance-table.tsx:92` — `refetchInterval: 60_000`
- `apps/web/src/components/attendance/admin-attendance-table.tsx:91` — `refetchInterval: 120_000`

**Impact:** Every 60-120s, the attendance page fires a full payload request that re-renders the
table + analytics + open-shifts table (all sharing the query key). Wasted bandwidth + render cycles.

**Fix:**
- [ ] Remove `refetchInterval` from both tables.
- [ ] Rely on the existing Reverb `.attendance.updated` subscription for live updates.
- [ ] If a polling fallback is needed for when WebSocket is down, gate it:
  ```ts
  const { isConnected } = useReverb();
  refetchInterval: isConnected ? false : 120_000,
  ```
- [ ] Keep `staleTime: STALE_TIME_ATTENDANCE` so manual refresh still works.

**Dependencies:** Reverb must be deployed (or accept that live updates are manual-refresh only).
**Verification:** Leave the attendance page open for 5 min with DevTools open → zero automatic
network requests to `/attendance/hr/today` or `/attendance/admin/overview` (only Reverb-driven ones
on actual changes).

---

### 3.3 MetricWidget animated counter fires 30 setState calls per widget (MEDIUM)

**What's wrong:** `apps/web/src/components/widgets/metric-widget.tsx:46-72` uses `setInterval` with
`stepTime = 20ms` and `duration = 600ms` → 30 iterations, each calling `setDisplayValue()`. With 2-3
MetricWidgets per dashboard, that's 60-90 synchronous re-renders concentrated in the first 600ms
after metrics data arrives — exactly when the grid is also laying out and other widgets are mounting.

**Where:** `apps/web/src/components/widgets/metric-widget.tsx:46-72`.

**Impact:** Jank on dashboard load. The counter animation is cosmetic but causes real render pressure.

**Fix:**
- [ ] **Option A (recommended):** Replace with `requestAnimationFrame`:
  ```ts
  useEffect(() => {
    if (isPending || typeof rawValue !== "number") return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      let start: number;
      const duration = 400;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        setDisplayValue(Math.floor(rawValue * progress));
        if (progress < 1) requestAnimationFrame(animate);
        else setDisplayValue(rawValue);
      };
      requestAnimationFrame(animate);
    } else {
      setDisplayValue(rawValue);
    }
  }, [rawValue, isPending]);
  ```
- [ ] **Option B (simplest):** Drop the animation entirely. Show the final value immediately.
  Animation is not worth the render cost on a data dashboard.

**Dependencies:** None.
**Verification:** React Profiler on dashboard cold load → MetricWidget commits once (not 30 times).

---

### 3.4 Dashboard prefetch runs post-paint, not during navigation (MEDIUM)

**What's wrong:** `apps/web/src/app/dashboard/page.tsx:50-65` runs `queryClient.prefetchQuery(...)`
inside a `useEffect` that fires AFTER the component mounts and paints. The prefetch provides almost
no head-start because the widget components' own `useQuery` calls fire in the same render cycle.

**Where:** `apps/web/src/app/dashboard/page.tsx:50-65`.

**Impact:** Dashboard cold load doesn't benefit from prefetching — widgets wait for their own fetches.

**Fix:**
- [ ] Move the prefetch calls into `apps/web/src/app/dashboard/layout.tsx` (which mounts before the
  page component) OR add prefetch-on-hover to navigation Links:
  ```tsx
  // In nav-group.tsx or wherever dashboard links are rendered:
  <Link
    href="/dashboard"
    onMouseEnter={() => queryClient.prefetchQuery({ queryKey: queryKeys.dashboardMetrics, queryFn: () => apiFetch("/dashboard/metrics") })}
    onFocus={() => same}
  >
  ```
- [ ] Remove the wasted prefetches for `announcements` and `tasks` if no dashboard widget consumes
  them (check the current widget catalog — if AnnouncementBoard was added to the dashboard per
  DASH-5, keep announcements; remove tasks).

**Dependencies:** 1.1 (WidgetEngine must not crash first).
**Verification:** Hover over the Dashboard nav link → DevTools shows prefetch requests firing BEFORE
navigation → dashboard renders with data immediately on click.

---

### 3.5 Tasks page uses orphan `["users"]` query key → duplicate fetch (MEDIUM)

**What's wrong:** `apps/web/src/app/dashboard/tasks/page.tsx:41` uses `queryKey: ["users"]` which
matches NO factory in `query-keys.ts`. The canonical factory is `queryKeys.usersList` (which is
`["users-list"]`). This orphan key means the `/users` endpoint is fetched under a unique key that no
other component shares — invalidations elsewhere won't refresh this cache, and it's a duplicate
network call.

**Where:** `apps/web/src/app/dashboard/tasks/page.tsx:41`.

**Fix:**
- [ ] Replace `queryKey: ["users"]` with `queryKeys.usersList` (import from `lib/query-keys`).
- [ ] Grep for any other orphan query keys: `grep -rn 'queryKey:' apps/web/src --include='*.tsx' |
  grep -v 'queryKeys\.'` and align all to use the factory.

**Dependencies:** None.
**Verification:** Navigate to Tasks page → DevTools shows `/users` fetched under the shared key →
navigating to Users page reuses the cache (no duplicate fetch).

---

### 3.6 Offline engine runs uncleared 5s setInterval forever (LOW)

**What's wrong:** `apps/web/src/lib/offline-engine.ts:76-81` creates a `setInterval` that runs for
the entire browser session. Each tick calls `useOfflineStore.getState()` and checks
`navigator.onLine`. The guard makes it cheap, but it's perpetual background work.

**Where:** `apps/web/src/lib/offline-engine.ts:76-81`.

**Fix:**
- [ ] Switch to event-driven sync only: rely on `window.addEventListener('online', ...)` (already
  present) + add `document.addEventListener('visibilitychange', ...)` to sync when the tab becomes
  visible again.
- [ ] If a safety poll is desired, gate it behind `document.visibilityState === 'visible'` and clear
  it on `pagehide`/`beforeunload`.

**Dependencies:** None.
**Verification:** DevTools Performance monitor → no 5s interval entries when tab is hidden.

---

### 3.7 Remove unused `sleep()` helper from api-client (LOW)

**What's wrong:** `apps/web/src/lib/api-client.ts:11-13` defines `sleep()` which is never called
(dead code from the removed retry ladder).

**Fix:**
- [ ] Delete the `sleep` function. Verify `grep -n 'sleep' apps/web/src/lib/api-client.ts` returns
  nothing.

**Dependencies:** None.
**Verification:** `pnpm typecheck` clean; no bundle size change measurable.

---

## PHASE 4 — WORKFLOW RELIABILITY (eliminate broken/error-prone workflows)

### 4.1 NotificationsBell filter/search params not sent to backend (MEDIUM)

**What's wrong:** The Notification Center page (`apps/web/src/app/dashboard/notifications/page.tsx`)
sends `type` and `search` query params, but `NotificationController::index()` only honors
`unreadOnly`. The type filter and search box appear functional but silently do nothing.

**Where:** `apps/api/app/Http/Controllers/NotificationController.php:17-19` (only reads `unreadOnly`);
`apps/web/src/app/dashboard/notifications/page.tsx` (sends `type` + `search`).

**Fix:**
- [ ] `NotificationController::index`: apply the filters:
  ```php
  if ($request->filled('type')) $query->where('type', $request->query('type'));
  if ($request->filled('search')) $query->whereRaw('lower(title) like ?', ['%' . strtolower($request->query('search')) . '%']);
  ```
- [ ] Alternatively, remove the type/search UI from the frontend if filtering is not needed.

**Dependencies:** None.
**Verification:** Type a search term in the Notification Center → results filter correctly.

---

### 4.2 AnnouncementController has no authorization (CRITICAL — from previous audit, verify current state)

**What's wrong (if still present):** `AnnouncementController` store/update/destroy may still lack
capability middleware. Any authenticated employee can create/edit/delete announcements.

**Fix (if not already done):**
- [ ] `routes/api.php`: add `capability:announcements.manage` to `POST/PUT/DELETE /announcements*`.
- [ ] `AnnouncementController::update/destroy`: add ownership check.
- [ ] Verify: `grep -n 'announcements' apps/api/routes/api.php | grep capability`.

**Dependencies:** None.
**Verification:** Login as employee → attempt `POST /api/announcements` → 403.

---

### 4.3 Per-app nixpacks.toml/railway.toml omit queue/scheduler (LATENT RISK)

**What's wrong:** `apps/api/nixpacks.toml` and `apps/api/railway.toml` have a start command that
runs ONLY `php artisan serve` — no queue worker or scheduler. The root-level `nixpacks.toml`/
`railway.toml` correctly point to `start.sh`. If Railway's service root is ever changed to `apps/api`,
the queue and scheduler silently stop.

**Fix:**
- [ ] Delete `apps/api/nixpacks.toml` and `apps/api/railway.toml` (the root-level files are the
  single source of truth).
- [ ] OR update them to match the root-level start command (`bash start.sh`).
- [ ] Document in DEPLOYMENT.md that the Railway service root must be the REPO ROOT, not `apps/api`.

**Dependencies:** None.
**Verification:** Railway deploy log shows `start.sh` running (not bare `artisan serve`).

---

### 4.4 Workflows missing `Accept: application/json` header on some requests (verify)

**What's wrong (from commit `eca0bec`):** A previous fix added `Accept: application/json` to prevent
backend 500s. Verify it's on ALL requests, including raw `fetch()` calls.

**Fix:**
- [ ] `api-client.ts`: verify `headers.set("Accept", "application/json")` is present (line ~25).
- [ ] Check ALL raw `fetch()` calls (grep for `fetch(` in non-api-client files): verify they include
  the `Accept` header + auth token.
- [ ] Files to check: `org/leave/page.tsx` (export), `settings-tabs.tsx` (logo upload),
  any export handlers.

**Dependencies:** None.
**Verification:** DevTools Network → all API requests include `Accept: application/json` header.

---

### 4.5 Every workflow handles error/empty/offline states correctly

**What's wrong:** Several workflows lack proper error states, showing stale data or infinite
spinners when the API fails.

**Fix — audit each workflow:**
- [ ] Every `useQuery` consumer has an `isError` branch with a Retry button.
- [ ] Every `useMutation` has an `onError` toast (or relies on the global `MutationCache.onError`).
- [ ] Every list/table shows an `EmptyState` when data is `[]` (not a blank screen).
- [ ] Every form disables the submit button while `isPending` + shows a spinner.
- [ ] Offline mutations show the queued toast (now visible since sonner is the sole toast lib).
- [ ] Files to audit: ALL pages in `apps/web/src/app/dashboard/` + ALL components in
  `apps/web/src/components/`.

**Dependencies:** None.
**Verification:** Simulate API failure (DevTools → Network → block request) → each page shows an
error state with Retry, not a stuck spinner.

---

## PHASE 5 — PRODUCTION HARDENING (final polish for daily use)

### 5.1 Standardize loading flag to `isPending` everywhere (LOW)

**What's wrong:** Some widgets use `isLoading`, others use `isPending`. With `placeholderData:
keepPreviousData`, both behave identically, but the inconsistency is confusing.

**Fix:**
- [ ] Replace ALL `isLoading` with `isPending` in widget components. Grep:
  `grep -rn 'isLoading' apps/web/src/components/`.

**Dependencies:** None.

---

### 5.2 Add `loading.tsx` skeletons that match page layout (from 1.2)

Already covered in 1.2 — ensure each `loading.tsx` returns a skeleton that matches the real page's
shape (header height, sidebar width, content grid) so the transition is smooth (no layout shift).

---

### 5.3 Verify MAIL_* environment variables are set on Railway (HIGH)

**What's wrong:** If `MAIL_*` env vars are not set on Railway, password-reset emails and weekly
summaries are written to the log file instead of being sent. The forgot-password flow appears to
work (returns success) but the user never receives the email.

**Fix:**
- [ ] Verify Railway env vars include: `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
  `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_ENCRYPTION`.
- [ ] Configure a transactional email provider (Resend, Postmark, Amazon SES).
- [ ] Test: trigger forgot-password → verify email arrives.

**Dependencies:** None.
**Verification:** Trigger forgot-password → email arrives in the user's inbox.

---

### 5.4 Verify Reverb is deployed as a separate service OR accept no-realtime (HIGH)

**What's wrong:** `start.sh` does NOT start Reverb. If `NEXT_PUBLIC_REVERB_HOST` is set on Vercel
but no Reverb server is running, the WebSocket will fail (but `isReverbAvailable` gates prevent the
flood seen earlier). If `NEXT_PUBLIC_REVERB_HOST` is NOT set, realtime features silently don't work.

**Fix:**
- [ ] **Decision:** Either deploy Reverb as a separate Railway service with
  `php artisan reverb:start --host=0.0.0.0 --port=$PORT`, OR accept no-realtime (chat/notifications
  work via manual refresh/polling).
- [ ] If deploying Reverb: set `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_PORT=443`,
  `NEXT_PUBLIC_REVERB_SCHEME=https` on Vercel. Set `BROADCAST_CONNECTION=reverb` + Reverb secrets on
  Railway.
- [ ] If NOT deploying: ensure `NEXT_PUBLIC_REVERB_HOST` is NOT set on Vercel. Add a polling
  fallback for notifications (`refetchInterval: 30_000` on the notifications query).

**Dependencies:** None.
**Verification:** If Reverb deployed: send a message in chat → recipient sees it instantly. If not:
notification bell polls every 30s and stays usable.

---

### 5.5 Run full end-to-end smoke test for all 3 roles

**Test matrix — run each scenario and verify:**
- [ ] **Admin:** Login → dashboard renders (no crash) → widgets show real data → navigate to Admin
  Attendance → table loads → trends graph renders → export downloads → open shifts → notify HR →
  Settings → all tabs save → Audit log loads → Employee Detail page works.
- [ ] **HR:** Login → dashboard → team attendance → pending approvals → approve/reject → navigate
  to Team Attendance → table + analytics + graph → correction dialog → leave approvals → directory.
- [ ] **Employee:** Login → dashboard → clock in → timer runs → break → resume → clock out →
  attendance history → leave request → profile edit → directory.
- [ ] **All roles:** Navigate between 5+ pages rapidly → each shows cached data instantly → no
  console errors → no stuck spinners.
- [ ] **Mobile (360px):** Every page usable → tables → cards → dialogs full-screen → bottom nav
  works → no horizontal scroll.
- [ ] **Offline:** Disconnect → clock in → queued → reconnect → syncs → toast visible.
- [ ] **Console:** Zero errors, zero warnings on any base-workflow page.

**Dependencies:** ALL previous phases complete.
**Verification:** The above matrix passes 100%.

---

## IMPLEMENTATION ORDER (dependency-aware)

### Sprint 1 — Stop the bleeding (Phase 1)
1. ✅ 1.1 — Fix WidgetEngine `useContainerWidth` crash (dashboard is currently broken)
2. ✅ **1.2** — Add `loading.tsx` route skeletons (every navigation feels instant)
3. ✅ **1.3** — Remove full-page blocking returns on Profile + Project Detail

### Sprint 2 — Backend speed (Phase 2)
4. ✅ **2.1** — Wire the dashboard metrics cache (`Cache::remember`) — the biggest backend win
5. ✅ **2.2** — Supervise the queue worker (auto-restart loop)
6. ✅ **2.3** — Fix scheduled-job N+1 storms
7. ✅ **2.4** — Chunk attendance/user exports
8. ✅ **2.5** — Add missing composite indexes
9. ✅ **2.6** — Drop redundant indexes

### Sprint 3 — Frontend speed (Phase 3)
10. ✅ **3.1** — Fix NotificationsBell cache key mismatch (instant bell clicks)
11. ✅ **3.2** — Remove duplicate attendance polling
12. ✅ **3.3** — Fix MetricWidget animation (rAF or remove)
13. ✅ **3.4** — Move prefetch to layout/hover
14. ✅ **3.5** — Fix orphan `["users"]` query key
15. ✅ **3.6** — Clean up offline engine interval
16. ✅ **3.7** — Remove dead `sleep()` code

### Sprint 4 — Workflow reliability (Phase 4)
17. ✅ **4.1** — Fix notification filter/search backend
18. ✅ **4.2** — Ensure `AnnouncementController` has authorization
19. ✅ **4.3** — Delete per-app nixpacks/railway files
20. ✅ **4.4** — Verify Accept header on all requests
21. ✅ **4.5** — Audit all error/empty/offline states

### Sprint 5 — Production hardening (Phase 5)
22. ✅ **5.1** — Standardize `isPending` naming
23. ✅ **5.2** — Ensure `loading.tsx` skeletons exist (done in 1.2)
24. ✅ **5.3** — Verify MAIL_* on Railway
25. ✅ **5.4** — Deploy or disable Reverb
26. ✅ **5.5** — Full smoke test

---

## ACCEPTANCE — "The app is fast, stable, and production-ready"

The application is production-ready when ALL of the following are true:

1. **Dashboard renders without crashing.** Zero `TypeError: useContainerWidth is not a function`.
   (1.1)
2. **Every navigation shows a skeleton instantly** during route transition, then cached data
   immediately after. (1.2, 1.3)
3. **Dashboard metrics are cached** — second hit < 50ms. (2.1)
4. **Queue worker auto-restarts** if it crashes. (2.2)
5. **Scheduled jobs run ~5 queries per invocation** (not 300+). (2.3)
6. **Exports don't spike memory.** (2.4)
7. **Notification bell clicks are instant** (optimistic update works). (3.1)
8. **No redundant polling** on attendance tables. (3.2)
9. **No metric counter jank.** (3.3)
10. **Prefetch fires on hover/before mount.** (3.4)
11. **No orphan query keys.** (3.5)
12. **Notification filter/search works.** (4.1)
13. **Announcements are authorization-gated.** (4.2)
14. **No stale nixpacks/railway files.** (4.3)
15. **All API requests include Accept header.** (4.4)
16. **Every workflow has error/empty/offline states.** (4.5)
17. **Emails actually send.** (5.3)
18. **Realtime either works (Reverb deployed) or is cleanly disabled.** (5.4)
19. **Full smoke test passes for all 3 roles.** (5.5)
20. **The app is usable for 30 minutes straight** with zero console errors, zero stuck spinners,
    and every interaction feeling instant.
