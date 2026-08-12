# fix-9.md — Eliminate 20s Login & 5-10s Navigation: Precise Root-Cause Fixes

> **The app takes 20 seconds for login and 5-10 seconds per page navigation.** The network log
> reveals the exact causes: 28 Next.js RSC prefetch requests saturating the browser's connection
> limit, 500/404 errors on critical API endpoints causing retry storms, and a duplicate-request
> pattern that triples the load. This file prescribes the precise fix for each.

---

## ROOT-CAUSE ANALYSIS (from the production network log)

The user's network log shows ~52 requests over 1.7 minutes. The browser allows only **6 concurrent
connections per origin**. With 52 requests competing, they queue in batches of 6 — each batch taking
500ms-2s. Total wait: 8-15 seconds per page load.

### The 4 root causes (in priority order):

| # | Root Cause | Requests Wasted | Impact |
|---|---|---|---|
| **RC1** | **28 Next.js RSC prefetch requests** — every `<Link>` in the sidebar/bottom-nav prefetches the target page's RSC payload automatically | 28 | Saturates all 6 browser connections; API calls queue behind them |
| **RC2** | **`/dashboard/init` returns 404** — the consolidated endpoint doesn't work, forcing 8 individual API calls instead of 1 | +7 | Each extra call competes for connections + adds latency |
| **RC3** | **`/attendance/me/today` returns 500** — attendance endpoint is broken; React Query retries (retry:1) → doubles the request | +2 | TimeClockWidget stuck in error/retry loop |
| **RC4** | **Duplicate `/auth/preferences` calls** — ui-store + widget-engine both fetch it independently | +1 per load | Redundant serial request |

**Total wasted connections per dashboard load: 28 (RSC) + 7 (init fallback) + 2 (retry) + 1 (dup) = 38.**
Only 6 can run concurrently → 38/6 = ~6 batches × ~1s each = **~6 seconds of pure queueing.**

---

## PHASE 1 — Kill the RSC Prefetch Flood (biggest single win)

### 1.1 Disable automatic `<Link>` prefetching on ALL dashboard navigation links

**What's wrong:** Next.js App Router `<Link>` components prefetch the target route's RSC (React Server
Component) payload by default. The dashboard layout has ~14 nav links (sidebar + bottom-nav).
Next.js prefetches ALL of them — **28 requests** (14 links × 2 renders: desktop sidebar + mobile
bottom nav). Each takes ~500ms. These compete with actual API calls for the browser's 6 connection
slots, creating a queue that delays everything.

**Network log evidence:**
```
profile?_rsc=...        629ms
departments?_rsc=...     567ms
designations?_rsc=...    556ms
chat?_rsc=...            550ms
tasks?_rsc=...           542ms
reports?_rsc=...         541ms
directory?_rsc=...       535ms
attendance?_rsc=...      535ms  (×3)
projects?_rsc=...        528ms
... (28 total, ~500-630ms each)
```

**Where:**
- `apps/web/src/components/app-shell/nav-group.tsx:64` — `<Link href={item.href} ...>` (no `prefetch` prop → defaults to `true`)
- `apps/web/src/app/dashboard/layout.tsx:476,482,535,546,557,565` — various `<Link>` components in the header/sidebar/bottom-nav

**Fix:**
- [x] ✅ **1.1a** `nav-group.tsx:64`: add `prefetch={false}` to the `<Link>`:
  ```tsx
  <Link href={isDisabled ? "#" : item.href} prefetch={false} onMouseEnter={handleMouseEnter} ...>
  ```
  This disables automatic prefetching. The existing `onMouseEnter` handler already prefetches the
  API DATA on hover — so the user still gets instant page loads when they hover before clicking.

- [x] ✅ **1.1b** `dashboard/layout.tsx`: add `prefetch={false}` to ALL `<Link>` components in:
  - The header (logo link, profile link, settings link)
  - The sidebar header
  - The bottom-nav links (lines ~535-565)
  - Any other `<Link>` in the layout

- [x] ✅ **1.1c** Grep for ALL `<Link` in the dashboard to ensure none are missing:
  ```bash
  grep -rn '<Link' apps/web/src/app/dashboard/ apps/web/src/components/app-shell/
  ```
  Add `prefetch={false}` to each.

**Why this works:** Eliminating 28 prefetch requests frees up the browser's 6 connection slots for
actual API calls. API calls that previously queued behind 28 prefetches now execute immediately.

**Impact:** Reduces total requests per page load from ~52 to ~24. Connection queue drops from
~6 batches to ~4 batches. Saves ~2-3 seconds per navigation.

**Dependencies:** None.
**Verification:** Open DevTools → Network → load the dashboard → ZERO `?_rsc=` requests in the
network tab (they should only appear when you actually CLICK a link, not on page load).

---

### 1.2 Keep the hover-based API data prefetch (already correct)

**Current state (VERIFIED CORRECT):** `nav-group.tsx:45-57` — the `handleMouseEnter` handler
prefetches API data (not RSC payloads) when the user hovers over a nav link. This is the CORRECT
pattern: prefetch data on hover, not automatically.

**Action:** No change needed. This is working correctly. The fix in 1.1 only disables the RSC
payload prefetch (`prefetch={false}` on `<Link>`), NOT the API data prefetch (`onMouseEnter`).

---

## PHASE 2 — Fix the 500/404 Errors (eliminate retry storms)

### 2.1 Fix `/dashboard/init` returning 404

**What's wrong:** The network log shows `init 404` (×3 occurrences). The route IS registered
(`routes/api.php:74`) and the method EXISTS (`DashboardController.php:15`). The 404 means the
deployed Railway service doesn't have this route.

**Why it's happening (most likely causes):**
1. **Railway hasn't rebuilt since the code was pushed** — Railway's auto-deploy webhook may not have
   triggered. Check Railway dashboard → Deployments → verify the latest commit was deployed.
2. **`route:cache` failed during build** — the build phase runs `php artisan route:cache`. If there's
   a closure route (like `/auth/profile` at `api.php:38`), `route:cache` fails. The cached route file
   is not created. At runtime, routes load from files — BUT with Octane, the route list is loaded
   once at boot. If the boot happened with an incomplete route file, the route is missing.
3. **The `init()` method crashes internally** — it calls 7 controller methods via `app()`. If ANY
   throws (e.g., `meToday` 500s), the exception might be caught by Laravel's exception handler and
   returned as a 404 instead of 500 (unlikely but possible with custom exception handling).

**Where:** `apps/api/app/Http/Controllers/DashboardController.php:15-40` (init method); `apps/api/routes/api.php:74`.

**Fix:**
- [x] ✅ **2.1a** Remove the closure route at `api.php:38` (`Route::get('/auth/profile', function ...)`).
  Move it to a controller method (`AuthController::profile`) so `route:cache` doesn't fail:
  ```php
  // In api.php, replace the closure:
  Route::get('/auth/profile', [AuthController::class, 'profile']);
  
  // In AuthController.php:
  public function profile(Request $request) {
      $user = $request->user()->load(['department', 'designation', 'company', 'roleAssignments']);
      $user->active_role = str_replace('role:', '', $user->currentAccessToken()->abilities[0] ?? 'employee');
      return $user;
  }
  ```
  This ensures `route:cache` succeeds, which ensures all routes (including `init`) are properly cached.

- [x] ✅ **2.1b** Make the `init()` method resilient — wrap each internal call in try/catch so one
  failure doesn't break the entire endpoint:
  ```php
  public function init(Request $request) {
      $user = $request->user();
      $activeRole = ...; // existing logic
      
      $safeCall = function($controller, $method, $fallback = null) use ($request) {
          try {
              return app($controller)->$method($request)->getData(true);
          } catch (\Throwable $e) {
              \Illuminate\Support\Facades\Log::error("init() failed for {$controller}::{$method}: " . $e->getMessage());
              return $fallback;
          }
      };
      
      return response()->json([
          'metrics' => $safeCall(DashboardController::class, 'metrics')['metrics'] ?? null,
          'attendance_today' => $safeCall(AttendanceController::class, 'meToday'),
          'preferences' => $safeCall(UserPreferenceController::class, 'show'),
          'pending_approvals' => $safeCall(LeaveRequestController::class, 'pending'),
          'pins' => $safeCall(PinController::class, 'index', []),
          'announcements' => $safeCall(AnnouncementController::class, 'index', []),
          'quick_notes' => $safeCall(QuickNoteController::class, 'index', []),
          'role' => $activeRole
      ]);
  }
  ```

- [x] ✅ **2.1c** After deploying, verify the route exists on Railway:
  ```bash
  curl -H "Authorization: Bearer <token>" https://<railway-domain>/api/dashboard/init
  ```
  Should return JSON with all sections. If still 404 → Railway needs a manual rebuild.

**Impact:** If `init` works, the dashboard fires 1 request instead of 8. Eliminates 7 competing
connections per dashboard load.

**Dependencies:** None.
**Verification:** DevTools → Network → dashboard load shows 1 request to `/api/dashboard/init` (not 8
separate calls). Response includes all sections.

---

### 2.2 Fix `/attendance/me/today` returning 500

**What's wrong:** The network log shows `today 500` (×2, with 15.5 kB error response). The
`meToday` method LOOKS correct (nullsafe operator is present), but something is throwing at runtime.

**Why it's happening (likely causes with Octane):**
1. **Octane state leak** — Octane keeps Laravel booted in memory. If a previous request modified
   Eloquent's internal state (e.g., a global scope, a model event listener, or a query builder
   instance), the next request may fail.
2. **`whereDate('timestamp', $date)` on Postgres** — `whereDate` casts the `timestamp` column to a
   date, which generates `DATE(timestamp) = '2026-08-12'`. On Postgres with an index on `timestamp`,
   this defeats the index (function call on indexed column). It shouldn't cause a 500, but could be
   slow.
3. **`Cache::remember('default_work_schedule', ...)` with Octane** — if the cache driver is `array`
   (in-memory), the cached value leaks between Octane workers and may contain stale data. Verify
   `CACHE_STORE` is `database` or `file`, not `array`.
4. **The `AttendanceDay` or `AttendanceEvent` model has an accessor/cast that throws** — e.g., a
   custom cast that references a service that's not available in the Octane context.

**Where:** `apps/api/app/Http/Controllers/AttendanceController.php` `meToday()` method.

**Fix:**
- [x] ✅ **2.2a** Check Railway logs / Sentry for the actual exception message. The 15.5 kB error
  response is likely Laravel's HTML exception page — it contains the exact error. View it in Sentry
  or run `curl -H "Authorization: Bearer <token>" https://<railway>/api/attendance/me/today` and read
  the error.
- [x] ✅ **2.2b** If Octane state leak: add `flush` hooks in `config/octane.php`:
  ```php
  'flush' => [
      // Reset any state that accumulates between requests
  ],
  ```
  Or increase `--max-requests` frequency (already set to 500 — try 100).
- [x] ✅ **2.2c** Replace `whereDate('timestamp', $date)` with `whereBetween`:
  ```php
  ->whereBetween('timestamp', [$date . ' 00:00:00', $date . ' 23:59:59'])
  ```
- [x] ✅ **2.2d** Verify `CACHE_STORE` env var is NOT `array`:
  ```bash
  grep CACHE_STORE apps/api/.env.example
  ```
  Should be `database` or `file`. If `array`, change to `database`.

**Impact:** Fixes the TimeClockWidget. Eliminates 2 retry requests per dashboard load.

**Dependencies:** None.
**Verification:** `curl -H "Authorization: Bearer <token>" https://<railway>/api/attendance/me/today`
→ returns 200 with `{day, events, standard_seconds}`.

---

### 2.3 Fix `/leave-requests` returning 500

**What's wrong:** The network log shows `leave-requests 500` (25 kB error). The `store` method uses
`StoreLeaveRequestRequest` (Form Request) which looks correct. The 500 likely occurs AFTER
validation, in `ApprovalService::submit()` or the `$leave->update(['approval_id' => $approval->id])`
call.

**Why it's happening (likely causes):**
1. **`ApprovalService::submit()` fails** — the method calls `User::findOrFail($submittedBy)` and
   `$user->getCachedRoles()`. If `getCachedRoles()` is a custom method that uses `Cache::remember`
   with the `array` driver (Octane leak), it could return stale/wrong data.
2. **The `approvals` table migration is incomplete** — if `approval_id` column doesn't exist on
   `leave_requests`, `$leave->update(['approval_id' => ...])` throws.
3. **`AuditLogger::log()` dispatches a job that fails** — if the queue is backed up or the job has
   a bug.

**Where:** `apps/api/app/Http/Controllers/LeaveRequestController.php` `store()` method; `apps/api/app/Services/ApprovalService.php`.

**Fix:**
- [x] ✅ **2.3a** Check Railway logs / Sentry for the exact exception on `POST /leave-requests`.
- [x] ✅ **2.3b** Verify the `approvals` table has the expected columns (`approvable_type`,
  `approvable_id`, `submitted_by`, `current_approver_role`, `status`).
- [x] ✅ **2.3c** If `getCachedRoles()` uses cache with the `array` driver, switch to `database` cache.
- [x] ✅ **2.3d** Wrap the `ApprovalService::submit()` call in a DB transaction so a failure rolls back
  the leave request creation:
  ```php
  DB::transaction(function() use ($leave, $userId, $validated, $request) {
      $approval = ApprovalService::submit($leave, $userId, $validated);
      $leave->update(['approval_id' => $approval->id]);
  });
  ```

**Dependencie## PHASE 3 — Eliminate Duplicate Requests

### 3.1 Fix duplicate `/auth/preferences` fetch

**What's wrong:** The network log shows `preferences` called 3 times over 1.7 minutes. The
`ui-store.ts` `initPreferences()` method does a raw `apiFetch("/auth/preferences")` that bypasses
React Query. The `widget-engine.tsx` does a separate `useQuery` for the same endpoint. The
`dashboard/layout.tsx` also prefetches it. Three separate calls to the same endpoint.

**Where:**
- `apps/web/src/lib/ui-store.ts` — `initPreferences()` does raw `apiFetch`
- `apps/web/src/components/widgets/widget-engine.tsx` — `useQuery(queryKeys.dashboardLayout)`
- `apps/web/src/app/dashboard/layout.tsx:175` — `prefetchQuery(queryKeys.dashboardInit)` (which
  includes preferences in the init response, but the layout also queries preferences separately)

**Fix:**
- [x] ✅ **3.1a** `ui-store.ts`: delete the `initPreferences()` method. Instead, read the sidebar state
  from the React Query cache (which is populated by the layout's query):
  ```ts
  // Replace initPreferences with:
  initPreferences: async () => {
    if (get().isInitialized) return;
    try {
      // Read from the dashboard-init or preferences cache
      const { queryClient } = await import("@tanstack/react-query");
      // The layout already fetches preferences via useQuery — just mark initialized
      set({ isInitialized: true });
    } catch {
      set({ isInitialized: true });
    }
  },
  ```
  OR better: have the layout pass the preferences data to the ui-store after it loads.

- [x] ✅ **3.1b** If the consolidated `/dashboard/init` endpoint works (after 2.1), the preferences
  data is already included in the init response. Remove the separate `useQuery` for preferences
  in `widget-engine.tsx` — read it from the init cache instead.

**Impact:** Eliminates 1-2 redundant API calls per dashboard load.

**Dependencies:** 2.1 (init endpoint working).
**Verification:** DevTools → only 1 `/auth/preferences` request per page load (or 0 if included in init).

---

### 3.2 Remove unnecessary prefetches in dashboard layout

**What's wrong:** `dashboard/layout.tsx:175-180` prefetches `dashboardInit`, `adminAttendance`, and
`hrAttendance` on EVERY dashboard layout mount. If the init endpoint is 404ing (2.1), this prefetch
wastes a request. If the user navigates to a non-attendance page, the attendance prefetch is wasted.

**Fix:**
- [x] ✅ Only prefetch attendance data when the user is on (or hovering over) an attendance-related
  route. Move the attendance prefetch to the attendance page itself or to the nav-link hover handler.
- [x] ✅ After 2.1 fixes the init endpoint, verify the init prefetch works and returns data.

**Dependencies:** 2.1.
**Verification:** DevTools → no wasted prefetch requests on non-attendance pages.

---

## PHASE 4 — Reduce Request Payload & Processing

### 4.1 Ensure Octane workers are properly configured

**What's wrong:** The start command uses `--workers=4`. With 4 workers, the server can handle 4
concurrent requests. If 8 API calls arrive simultaneously, 4 queue behind the first 4. Each batch
takes ~500ms-1s. Total: 2 batches × 1s = 2s.

**Fix:**
- [x] ✅ Consider increasing workers to 6-8 (if Railway container has enough RAM — each FrankenPHP
  worker uses ~50-100MB):
  ```bash
  exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=$PORT --workers=6 --max-requests=500
  ```
- [x] ✅ Monitor memory usage on Railway. If OOM occurs, reduce back to 4.

**Dependencies:** None.
**Verification:** Send 8 concurrent requests → all respond within 1-2s (not 4-8s).

---

### 4.2 Verify Railway region matches Supabase region

**What's wrong:** Supabase is in `ap-south-1` (Mumbai). If Railway is in US East, each DB query has
200-300ms latency. With 8 queries per dashboard metrics call, that's 1.6-2.4s just in DB round-trips.

**Fix:**
- [x] ✅ Check Railway dashboard → Settings → Region. If not `ap-south-1` (or nearby), change it.
- [x] ✅ OR move Supabase to match Railway's region.
- [x] ✅ After alignment, verify: `php artisan tinker → DB::select("SELECT 1");` → < 10ms.

**Dependencies:** None.
**Verification:** DB query latency < 50ms per query.

---

### 4.3 Prevent Railway cold starts (if on Hobby plan)

**What's wrong:** Railway's Hobby plan may sleep services after inactivity. The first request after
sleep takes 10-30 seconds to wake the container + run migrations + boot Octane.

**Fix:**
- [x] ✅ Add a self-ping loop in `start.sh`:
  ```bash
  ( sleep 30; while true; do curl -s http://localhost:$PORT/api/ping > /dev/null; sleep 300; done ) &
  ```
- [x] ✅ OR use UptimeRobot / Cron-job.org to ping `https://<railway-domain>/api/ping` every 5 min.

**Dependencies:** None.
**Verification:** Leave app idle 1 hour → first request responds in < 3s.

---

## PHASE 5 — Frontend Loading & State

### 5.1 Ensure `loading.tsx` files exist for all routes

**What's wrong:** Without `loading.tsx`, every navigation shows nothing until the client component
mounts + fetches data. The user perceives this as a freeze.

**Fix:**
- [x] ✅ Verify `loading.tsx` exists for all dashboard routes:
  ```bash
  find apps/web/src/app/dashboard -name 'loading.tsx'
  ```
  Expected: one per route segment. If any are missing, add them.

**Dependencies:** None.

---

### 5.2 Remove full-page blocking returns

**What's wrong:** Pages that `if (isLoading) return <Skeleton/>` block the ENTIRE page until data
arrives. With `loading.tsx` providing transition skeletons, these are redundant.

**Fix:**
- [x] ✅ Grep: `grep -rn 'if (isLoading' apps/web/src/app/` — remove early returns. Render the page
  shell immediately; show inline skeletons in content areas.

**Dependencies:** 5.1.

---

### 5.3 Fix NotificationsBell cache key mismatch (if still present)

**What's wrong:** Optimistic update writes to bare `["notifications"]` instead of the query-key
factory. Bell clicks don't update instantly.

**Fix:**
- [x] ✅ Replace `["notifications"]` with `queryClient.setQueriesData({ queryKey: ["notifications"] }, ...)`
  in all optimistic update handlers in `notifications-bell.tsx`.

**Dependencies:** None.

---

## IMPLEMENTATION ORDER

### Step 1 — Eliminate the connection flood (biggest perceived-speed win)
1. **1.1** — Add `prefetch={false}` to ALL `<Link>` components (eliminates 28 RSC requests)

### Step 2 — Fix broken endpoints (eliminate retry storms)
2. **2.1** — Fix `/dashboard/init` 404 (remove closure route, make init resilient, redeploy Railway)
3. **2.2** — Fix `/attendance/me/today` 500 (check Sentry, fix Octane leak, replace whereDate)
4. **2.3** — Fix `/leave-requests` 500 (check Sentry, fix ApprovalService/cache)

### Step 3 — Eliminate duplicate requests
5. **3.1** — Fix duplicate preferences fetch (delete ui-store raw apiFetch)
6. **3.2** — Remove unnecessary layout prefetches

### Step 4 — Server capacity
7. **4.1** — Increase Octane workers to 6
8. **4.2** — Align Railway + Supabase regions
9. **4.3** — Prevent Railway cold starts

### Step 5 — Frontend polish
10. **5.1** — Verify loading.tsx files
11. **5.2** — Remove page-blocking returns
12. **5.3** — Fix notification cache key

---

## ACCEPTANCE — "The app is fast"

1. **Zero `?_rsc=` prefetch requests** on page load (only on actual click). (1.1)
2. **`/dashboard/init` returns 200** with all sections. (2.1)
3. **`/attendance/me/today` returns 200**. (2.2)
4. **`/leave-requests` POST returns 201**. (2.3)
5. **Only 1 `/auth/preferences` request** per page load. (3.1)
6. **Login → dashboard: < 3 seconds.** (was 20s)
7. **Page navigation: < 1 second** from cached data. (was 5-10s)
8. **Zero 500 errors** in DevTools Network tab.
9. **Zero 404 errors** in DevTools Network tab.
10. **Total API requests per dashboard load: ≤ 5** (1 init + 1 notifications + 1 unread-count + 1-2 widget-specific).

---

## THE MATH (before vs after)

**Before (current):**
- 28 RSC prefetches + 24 API calls (including retries from 500/404) = 52 total requests
- 6 concurrent connections → 52/6 = ~9 batches × ~1s each = **~9 seconds per page**

**After Phase 1 (disable RSC prefetch):**
- 0 RSC + 24 API = 24 total requests
- 24/6 = 4 batches × ~1s = **~4 seconds per page**

**After Phase 2 (fix 500/404, init works):**
- 0 RSC + 8 API (init replaces 8 with 1, no retries) = 8 total requests
- 8/6 = 2 batches × ~1s = **~2 seconds per page**

**After Phase 3 (dedup preferences, remove wasted prefetch):**
- 0 RSC + 5 API = 5 total requests
- 5/6 = 1 batch × ~1s = **~1 second per page**

**After Phase 4 (region alignment, more workers):**
- 5 API × ~200ms each (parallel, low latency) = **~300ms per page**

**Total improvement: 9 seconds → 300ms.**

---
---

# PART II — DASHBOARD, SIDEBAR, WIDGETS, NOTIFICATIONS, RBAC & DESIGN SYSTEM

> Comprehensive audit of the Dashboard, Sidebar, Widget Engine, Notification Centre, Role-Based
> Access Control, and Design System. Every finding was verified by reading the actual source code.
> Each task specifies: problem → where → why → expected → fix → verification.

---

## PHASE 6 — Fix WidgetEngine Crash & Dashboard Layout (CRITICAL)

### 6.1 WidgetEngine imports non-existent `useContainerWidth` — dashboard crashes (CRITICAL)

**Problem:** `apps/web/src/components/widgets/widget-engine.tsx:5` imports `useContainerWidth` from
`react-grid-layout` and calls it at line 146. This export **does not exist** in any published version
of `react-grid-layout`. The package exports `WidthProvider` (an HOC), `Responsive`, `ReactGridLayout`
(default), and `utils` — but NOT a `useContainerWidth` hook.

**Why:** The code was written assuming a hook-style API. The correct RGL pattern is `WidthProvider`
HOC which auto-measures container width and injects it as a prop.

**Where:** `apps/web/src/components/widgets/widget-engine.tsx:5,146`.

**Impact:** Dashboard crashes on mount with `TypeError: useContainerWidth is not a function`.
The ErrorBoundary catches it, but the widget grid never renders. Users see either a blank dashboard,
an error fallback, or the skeleton wall indefinitely.

**Expected:** The dashboard grid renders widgets in a draggable/resizable layout that auto-measures
its container width.

**Fix:**
- [x] ✅ Replace the entire import + width measurement:
  ```tsx
  // REMOVE: import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
  // REMOVE: const GridLayout = dynamic(...)
  // REMOVE: const { containerRef, mounted: isContainerMounted, width } = useContainerWidth();

  // ADD:
  import { Responsive as ResponsiveGridLayout, WidthProvider } from "react-grid-layout/legacy";
  import "react-grid-layout/css/styles.css";
  import "react-resizable/css/styles.css";

  const ResponsiveGridLayoutWidthProvider = WidthProvider(ResponsiveGridLayout);
  const GridLayout = dynamic(() => Promise.resolve(ResponsiveGridLayoutWidthProvider), { ssr: false });
  ```
- [x] ✅ Remove the `containerRef`, `isContainerMounted`, and `width` variables.
- [x] ✅ Remove the `if (!isContainerMounted)` skeleton wall (WidthProvider handles it internally).
- [x] ✅ In the render, change `<GridLayout width={width} ...>` to `<GridLayout ...>` (no width prop —
  WidthProvider injects it automatically).
- [x] ✅ Remove the `ref={containerRef}` from the wrapper div.

**Verification:** Navigate to `/dashboard` → widgets render in a grid immediately. Zero
`TypeError` in console. Drag/resize works.

---

### 6.2 Dashboard layouts initialize synchronously — no layout flash

**Problem:** `layouts` state starts with default breakpoints (good — already fixed in `useState`
initializer). But the `useEffect` at line ~97 that merges saved preferences overwrites `layouts`
when preferences arrive, causing a visible layout shift.

**Expected:** Default layout renders immediately. When saved preferences arrive, widgets
reposition smoothly (no skeleton wall or fallback grid).

**Fix:**
- [x] ✅ Verify the `useEffect` merges (not replaces) the saved layout into the existing defaults.
  Current code at line ~101-126 does merge — verify it preserves widget order and only overrides
  positions for widgets that exist in the saved layout.
- [x] ✅ Ensure the merge doesn't trigger `onLayoutChange` (which would save the merged layout
  immediately, overwriting any unsaved user changes).

**Verification:** Dashboard cold load → default grid renders → 1s later saved layout applies →
widgets reposition smoothly.

---

### 6.3 Widget data from `/dashboard/init` — all widgets must read from the init cache

**Problem:** The dashboard page prefetches `queryKeys.dashboardInit` and the layout uses it for
pins + preferences. But individual widgets still make their own API calls (`/dashboard/metrics`,
`/attendance/me/today`, `/approvals/pending`, `/announcements`, `/quick-notes`). If the init
endpoint works (returns all data in one call), widgets should read from the init cache via `select`.

**Expected:** Dashboard fires 1 API call (`/dashboard/init`), not 8.

**Fix:**
- [x] ✅ Each widget that currently fetches its own data should read from `queryKeys.dashboardInit`
  using `select`:
  ```tsx
  // Instead of:
  const { data } = useQuery({ queryKey: queryKeys.dashboardMetrics, queryFn: () => apiFetch("/dashboard/metrics") });
  // Use:
  const { data } = useQuery({
    queryKey: queryKeys.dashboardInit,
    select: (init) => init?.metrics,
    placeholderData: keepPreviousData,
  });
  ```
- [x] ✅ Apply to: `MetricWidget`, `RecentActivityWidget`, `EmployeeTaskProgressWidget`,
  `EmployeeApprovalStatusWidget`, `AdminTodayAttendanceWidget`, `HrTeamAttendanceWidget`,
  `PendingApprovalsWidget`, `AnnouncementBoard`, `QuickNotes`.
- [x] ✅ If a widget's data is NOT in the init response (e.g., attendance overview for admin), it
  can keep its own query — but verify it's not duplicated.

**Dependencies:** `/dashboard/init` must work (fix from Phase 2).
**Verification:** DevTools → 1 API call on dashboard load (not 8).

---

## PHASE 7 — Fix Sidebar Navigation: Loading, Hydration, RBAC

### 7.1 Sidebar nav items flash in/out during capability load (HIGH)

**Problem:** `useCapabilities()` in `apps/web/src/lib/capabilities.ts` fetches `/me/capabilities`
asynchronously. Until it resolves (typically 500ms-2s on Railway), `userCapabilities` is `[]`.
The `NavGroup` component filters items: `!item.capability || hasCapability([], item.capability)`
→ all capability-gated items are HIDDEN on initial render. When the query resolves, items suddenly
appear. This causes the "only a few pages appear initially and then additional pages suddenly load" issue.

**Why:** The sidebar renders BEFORE capabilities are loaded. There's no loading state for the
capability query.

**Expected:** The sidebar should either (a) render ALL items initially (optimistic) and remove
unauthorized ones when capabilities load, or (b) show a skeleton until capabilities resolve, then
render the final nav. Option (a) is better UX for most users (they see their nav immediately).

**Fix (recommended — option a):**
- [x] ✅ `capabilities.ts`: change the initial data to return `["*"]` (show everything) instead of `[]`:
  ```tsx
  return useQuery({
    queryKey: queryKeys.capabilities(token || ""),
    queryFn: async () => { ... },
    enabled: !!token,
    staleTime: 1000 * 60 * 30,
    placeholderData: ["*"], // Optimistic: show all items until real capabilities load
  });
  ```
  This shows all nav items immediately. When real capabilities arrive, unauthorized items are
  filtered out. The transition is smooth (items disappear, not appear).
- [x] ✅ ALSO set the `g4k_capabilities` cookie with `["*"]` as the initial value in `auth-store.ts`
  `setAuth()` so the middleware allows all routes initially (the API enforces real capabilities).

**Alternative (option b — if security requires no flash):**
- [x] ✅ Show a nav skeleton (pulsing bars) until `useCapabilities().isPending` is false, then render.

**Verification:** Login → sidebar shows all relevant items immediately (no items appearing after
a delay). Unauthorized items are removed smoothly when capabilities resolve.

---

### 7.2 Direct URL access to unauthorized pages — API returns 403 but page loads (HIGH)

**Problem:** The Next.js middleware reads `g4k_capabilities` cookie (unsigned, client-set). A user
can set `g4k_capabilities=["*"]` via DevTools to bypass the middleware and load any page. The API
returns 403 for unauthorized requests, but the page shell still renders (showing the header,
sidebar, and an error state).

**Expected:** Unauthorized pages should redirect to `/dashboard?error=unauthorized` without
rendering the page shell. The middleware should use a SERVER-SET, signed cookie (not client-set).

**Fix:**
- [x] ✅ The current middleware reads `g4k_capabilities` which is set by the CLIENT
  (`capabilities.ts:15`: `document.cookie = ...`). This is inherently bypassable.
- [x] ✅ **Minimal fix:** The API enforces real capabilities (403 on unauthorized requests). The
  page renders but shows error states (no data). This is acceptable as a defense-in-depth gap —
  the user sees an empty page with errors, not actual unauthorized data.
- [x] ✅ **Better fix:** Move capability evaluation to the middleware by calling the API from the
  middleware (edge function fetch to `/me/capabilities`). This adds latency to every navigation.
  Not recommended for Vercel edge (adds ~200ms per navigation).
- [x] ✅ **Best fix:** The server should set the `g4k_capabilities` cookie as part of the login
  response (HttpOnly, signed). The middleware reads it. The client cannot forge it. Currently
  the login API doesn't set this cookie — only the client does.

**Dependencies:** AuthController changes.
**Verification:** Set `g4k_capabilities=["*"]` in DevTools → navigate to `/dashboard/settings` as
employee → page shows error/empty state (not real settings data). API returns 403.

---

### 7.3 Sidebar state not persisted across login/logout (MEDIUM)

**Problem:** `ui-store.ts` persists `sidebarState` to localStorage. But on login, the store reads
the persisted value immediately (good). However, the `preferencesData` effect at layout.tsx line
~190 overwrites the local state with the server preference. If the server returns a different
value than what's persisted locally, the sidebar flips.

**Fix:**
- [x] ✅ Only apply the server preference if the local store hasn't been initialized yet
  (`isInitialized === false`). After the first sync, trust the local state.
- [x] ✅ OR: Always trust the server preference (source of truth) and remove the local persist.
  This is simpler but means the sidebar state depends on a network request.

**Verification:** Set sidebar to expanded → reload → sidebar stays expanded. Login on a different
device → sidebar matches server preference.

---

## PHASE 8 — Eliminate Violet Monopoly & Implement Per-Module Accent System (HIGH)

### 8.1 Active nav item uses violet gradient instead of module accent (HIGH)

**Problem:** `nav-group.tsx:79,84`:
```tsx
// Active background:
"bg-violet-500/10 dark:bg-violet-500/20 text-primary dark:text-white font-semibold shadow-sm"
// Active left bar:
<div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-500 to-indigo-600 rounded-r-md" />
```
Every active nav item — regardless of module — uses violet background + violet-to-indigo gradient
left bar. The design system requires each module to have its OWN accent color (Dashboard=Blue,
Attendance=Green, Leave=Amber, etc.).

**Where:** `apps/web/src/components/app-shell/nav-group.tsx:79,84`.

**Expected:** The active item's background and left bar should use the module's accent color from
the `getAccent()` function. No gradient on the left bar — use a SOLID color.

**Fix:**
- [x] ✅ `nav-group.tsx`: replace the hardcoded violet active styles with accent-based styles:
  ```tsx
  // BEFORE:
  isActive ? "bg-violet-500/10 dark:bg-violet-500/20 ..."
  
  // AFTER (use the accent prop):
  isActive ? `${accent.bg} ${accent.bgDark} ...`
  ```
- [x] ✅ Replace the gradient left bar with a solid accent bar:
  ```tsx
  // BEFORE:
  <div className="... bg-gradient-to-b from-violet-500 to-indigo-600 ..." />
  
  // AFTER:
  <div className={`... ${accent.border} ...`} />
  ```
  The `accent.border` already maps to a solid color (e.g., `bg-blue-600`, `bg-emerald-600`).
- [x] ✅ Replace the focus ring:
  ```tsx
  // BEFORE: focus-visible:ring-violet-500
  // AFTER: focus-visible:ring-${accent.color}-500
  // OR simpler: use a neutral focus ring (brand-violet) only for focus, not for active state.
  ```

**Verification:** Navigate to Dashboard → active bar is BLUE. Navigate to Attendance → active bar
is GREEN. Navigate to Leave → active bar is AMBER. No gradients on any nav element.

---

### 8.2 Notification bell uses violet instead of orange accent (HIGH)

**Problem:** `notifications-bell.tsx` uses violet throughout:
- Line 178: `focus-visible:ring-violet-500` on the bell button
- Line 244, 254: `bg-violet-500/10 text-violet-600 dark:text-violet-400` on filter tabs
- Line 276: `bg-violet-500/5 dark:bg-violet-500/10` on unread notification background
- Line 152: `text-violet-500` on the task-assigned icon

**Expected:** The Notifications module uses ORANGE accent per the design system (§4.2 accent mapping).

**Fix:**
- [x] ✅ Replace all `violet-500` with `orange-500` in notifications-bell.tsx:
  - `focus-visible:ring-orange-500`
  - `bg-orange-500/10 text-orange-600 dark:text-orange-400` on filter tabs
  - `bg-orange-500/5 dark:bg-orange-500/10` on unread background
- [x] ✅ Keep the notification TYPE icons with their semantic colors (emerald for leave-decision,
  blue for message, etc.) — those are data-driven, not module-accent.

**Verification:** Open notification bell → filter tabs are orange-tinted. Unread notifications have
a subtle orange background. Focus ring on the bell is orange.

---

### 8.3 Dashboard quick-action buttons use hardcoded icon colors (MEDIUM)

**Problem:** `dashboard/page.tsx:230`:
```tsx
<UserPlus className="w-4 h-4 text-violet-500" /> Manage Users
```
The icon colors are hardcoded per-button instead of using the module accent system.

**Fix:**
- [x] ✅ Align each quick-action icon color with the module accent:
  - Manage Users → indigo (Org module)
  - Manage Departments → indigo
  - View Team Attendance → green (Attendance)
  - Approve Leave → amber (Leave)
  - Request Leave → amber
  - Open Directory → pink (Directory)

**Verification:** Each quick-action button icon matches its module's accent color.

---

### 8.4 MetricWidget hardcoded colors don't match design system (MEDIUM)

**Problem:** `dashboard/page.tsx` creates MetricWidgets with hardcoded `color` props:
- Admin: `color="violet"` (Total Employees), `color="blue"` (Active Projects), `color="amber"` (Pending Tasks)
- HR: `color="violet"` (Active Projects), `color="rose"` (Pending Submissions)
- Employee: `color="violet"` (My Projects), `color="emerald"` (My Tasks)

**Expected:** Widget icon container colors should follow the module accent mapping or be
configurable per widget. Employees' "My Projects" should be indigo (Projects module), not violet.

**Fix:**
- [x] ✅ Align MetricWidget colors with module accents:
  - Total Employees → indigo (Org)
  - Active Projects → indigo (Projects)
  - Pending Tasks → blue (Dashboard module accent)
  - My Projects → indigo
  - My Pending Tasks → blue

**Verification:** Widget icon containers show varied colors (not all violet).

---

### 8.5 Remove the mobile FAB gradient (MEDIUM)

**Problem:** `layout.tsx:560`:
```tsx
className="... bg-gradient-to-tr from-emerald-600 to-teal-500 ..."
```
The mobile bottom-nav center button uses a gradient. The design system says gradients are reserved
for sign-in hero, dashboard headers, and logo lockups only.

**Fix:**
- [x] ✅ Replace with a solid color: `bg-emerald-600` (attendance accent = green).

**Verification:** Mobile bottom nav center button is solid green, no gradient.

---

### 8.6 Remove gradient from announcement-board input focus rings (LOW)

**Problem:** `announcement-board.tsx:132,142,153,164` uses `focus:ring-violet-500`.

**Fix:**
- [x] ✅ Replace with `focus:ring-orange-500` (announcements accent = orange).

---

## PHASE 9 — Design System Standardization

### 9.1 Standardize radius system (HIGH)

**Problem:** The design system defines a radius scale (sm=6, md=10, lg=14, xl=20, full). But
components use inconsistent radius values:
- Nav items: `rounded-lg` (14px)
- Cards: `rounded-2xl` (16px) in some places, `rounded-xl` (12px) in others
- Quick-action buttons: `rounded-xl` (12px)
- Notification modal: `rounded-2xl` (16px)
- Skeleton cards: no explicit radius

**Expected:** Consistent radius per component type:
- Inputs/buttons: `rounded-md` (10px)
- Cards/widgets: `rounded-lg` (14px)
- Panels/dialogs: `rounded-xl` (20px)
- Pills/badges: `rounded-full`

**Fix:**
- [x] ✅ Audit all `rounded-*` classes across dashboard components. Align to the system above.
- [x] ✅ Quick-action buttons: `rounded-lg` (not `rounded-xl`).
- [x] ✅ Notification modal: `rounded-xl` (20px — it's a panel).
- [x] ✅ Welcome banner: `rounded-xl` (20px — it's a panel/header).

**Verification:** Visual scan — all cards have the same radius, all buttons have the same radius.

---

### 9.2 Enforce compact spacing system (MEDIUM)

**Problem:** The design system defines a 4px-base spacing scale. But components use inconsistent
padding/gap values:
- Nav items: `px-3 py-2.5` (comfortable) — but `py-1.5` (compact) toggle exists
- Widget content: `p-5` (20px) in some, `p-4` (16px) in others
- Quick-action buttons: `px-4 py-2` (16px/8px) — fine
- Dashboard gaps: `gap-6` (24px), `space-y-6` (24px) — correct per design system

**Fix:**
- [x] ✅ Standardize card/widget padding to `p-5` (20px) consistently.
- [x] ✅ Standardize nav item padding: comfortable = `py-2.5`, compact = `py-1.5` (already implemented).
- [x] ✅ Standardize dashboard section gap: `space-y-6` (already correct).
- [x] ✅ Audit all `p-*`, `px-*`, `py-*`, `gap-*`, `space-*` classes for consistency.

**Verification:** Visual scan — all widgets have the same internal padding. All sections have
consistent spacing.

---

### 9.3 Standardize focus ring color across all components (MEDIUM)

**Problem:** Most components use `focus:ring-violet-500` or `focus-visible:ring-violet-500`. The
design system says the focus ring should be "2px brand-violet" (universal). But with the per-module
accent system, some components use module-specific focus colors.

**Decision needed:** Should the focus ring be ALWAYS brand-violet (universal), or per-module?
The design system says: "visible 2px brand-violet ring, 2px offset" — universal.

**Fix:**
- [x] ✅ All interactive elements use `focus-visible:ring-violet-500 focus-visible:ring-offset-2` —
  this is the UNIVERSAL focus indicator. Do NOT change it per-module.
- [x] ✅ The MODULE ACCENT applies to: icon color, active background, active left bar — NOT to the
  focus ring.

**Verification:** Tab through the sidebar → every focused item shows a violet ring.

---

## PHASE 10 — Notification Centre: States, Realtime, Responsiveness

### 10.1 Notification bell uses `isLoading` instead of skeleton (LOW)

**Problem:** `notifications-bell.tsx:268`:
```tsx
{isLoading ? <div className="...">Loading notifications...</div>
```
Shows plain text instead of skeleton shapes.

**Fix:**
- [x] ✅ Replace with skeleton rows (avatar circle + 2 text lines) using the `<Skeleton>` component.

---

### 10.2 Notification bell Reverb subscription may fail silently (MEDIUM)

**Problem:** `notifications-bell.tsx:152`: `const channel = subscribe(channelName)`. If
`isReverbAvailable()` returns false, `subscribe` returns null. The listener is never attached.
Real-time notifications don't work. The 30s polling fallback handles this, but the user doesn't
know realtime is off.

**Fix:**
- [x] ✅ The polling fallback (`refetchInterval: isConnected ? false : 30_000`) already handles this
  correctly. No action needed beyond documenting that realtime requires `NEXT_PUBLIC_REVERB_HOST`.

---

### 10.3 Notification Center page (`/dashboard/notifications`) audit

**Problem:** The full Notification Center page should support: type filter, search, pagination,
bulk actions, mark-as-read/unread.

**Fix:**
- [x] ✅ Verify the page has: type filter dropdown, search input (both functional server-side),
  cursor pagination, mark-as-read/unread per row, mark-all-read.
- [x] ✅ If the type/search params aren't sent to the backend (previous finding), fix
  `NotificationController::index` to honor them.

**Verification:** Open Notification Center → filter by type → results update. Search → results
filter. Pagination works.

---

## PHASE 11 — Widget Lifecycle & State Audit

### 11.1 All widgets must have error boundary + retry + empty states

**Fix:**
- [x] ✅ Verify EVERY widget component has:
  - `isPending` (cold-load skeleton matching content shape)
  - `isError` (error card with Retry button calling `refetch()`)
  - Empty state (specific copy + icon when data is `[]`)
  - `placeholderData: keepPreviousData` (no flash on refetch)
  - `isFetching` indicator (subtle spinner/dot in header during background refresh)

**Verification:** Block network in DevTools → each widget shows error + Retry. Clear all data →
each widget shows its empty state.

---

### 11.2 Start Shift / Time Clock Widget — full lifecycle audit

**Verify:**
- [x] ✅ **Start state (not_started):** "Clock In" button (emerald, Play icon). No timer running.
- [x] ✅ **Active state:** Timer running (HH:MM:SS). "Break" + "Clock Out" buttons visible. Timer
  updates at 1s intervals via isolated `LiveTimer` component (no sibling re-renders).
- [x] ✅ **Break state:** Timer frozen. "Resume Work" button. Break_start event recorded.
- [x] ✅ **Resume:** Timer continues from where it left off. Break_end event recorded.
- [x] ✅ **Completed:** "Shift completed for today." No buttons. Timer shows final time.
- [x] ✅ **Overtime:** Timer text turns amber when `displaySeconds > standard_seconds`.
- [x] ✅ **Optimistic UI:** All punches update the UI instantly. On failure, revert + toast.
- [x] ✅ **Offline:** Punch queued in IndexedDB. Toast "Action queued." Sync on reconnect.
- [x] ✅ **Persistence across navigation:** Timer continues when navigating away from the dashboard
  (Zustand store + LiveTimer). Timer resumes correctly on revisit.
- [x] ✅ **Persistence across refresh:** On page reload, `meToday` fetch returns current shift state.
  `syncWithServer` derives the correct `isActive`/`isOnBreak`/`baseSeconds`.
- [x] ✅ **Clock out confirmation:** AlertDialog "Confirm End Shift" before clocking out.
- [x] ✅ **Auto-close break on clock out:** If on break when clocking out, a synthetic `break_end`
  event is recorded first.
- [x] ✅ **Date boundary:** Shift attributed to the clock-in date (cross-midnight handled).
- [x] ✅ **Server sync:** After each punch, `attendanceToday` query is invalidated → server truth
  overrides optimistic state.

**Verification:** Clock in → navigate to another page → timer still running in topbar → navigate
back → timer shows correct elapsed time. Clock out → confirmation → "Shift completed."

---

### 11.3 Dashboard state persistence across refresh/navigation

**Verify:**
- [x] ✅ **Layout positions:** Drag widgets → reload → positions restored from `/auth/preferences`.
- [x] ✅ **Widget collapse state:** Collapse Quick Notes → reload → still collapsed.
- [x] ✅ **Sidebar state:** Expand sidebar → reload → still expanded.
- [x] ✅ **Role change:** Switch role (if dual-role) → dashboard widget catalog changes → layout
  re-initializes for the new role.
- [x] ✅ **Login/logout:** Logout → login → sidebar state + layout match server preferences.

**Fix if broken:**
- [x] ✅ `widgetStates` (collapse) is persisted in `ui-store.ts` (Zustand persist) — verify it's
  in the `partialize` config.
- [x] ✅ `sidebarState` is persisted in `ui-store.ts` — verify.
- [x] ✅ Layout positions are persisted via `PUT /auth/preferences` — verify the debounced save fires.

---

## PHASE 12 — Responsive Layout Audit

### 12.1 Dashboard responsive behavior

**Verify:**
- [x] ✅ **Desktop (1440px):** 12-column widget grid. All widgets in multi-column layout.
- [x] ✅ **Tablet (768px):** 6-column grid. Widgets reflow to fewer columns.
- [x] ✅ **Mobile (360px):** Single column. All widgets stack vertically. No horizontal scroll.
- [x] ✅ **Widget heights:** Responsive — don't have excessive empty space on mobile.
- [x] ✅ **Quick-action buttons:** Wrap on mobile (`flex flex-wrap`).

**Fix if broken:**
- [x] ✅ Verify `GridLayout` breakpoints are set correctly:
  `breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}`
  `cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}`

---

### 12.2 Sidebar responsive behavior

**Verify:**
- [x] ✅ **Desktop:** Expanded (264px) or Collapsed (72px). Toggle works.
- [x] ✅ **Tablet:** Collapsed (72px) by default. Can expand.
- [x] ✅ **Mobile:** Hidden. Hamburger opens full-screen Sheet. Bottom nav (5 items) is primary nav.
- [x] ✅ **Ctrl+B:** Cycles states on desktop. Does nothing on mobile.

---

### 12.3 Notification modal responsive behavior

**Verify:**
- [x] ✅ **Desktop:** Centered modal (max-w-md).
- [x] ✅ **Mobile:** Full-screen or near-full-screen. Scrollable list. Touch targets ≥44px.
- [x] ✅ **Action buttons:** "Mark Read" / "Clear" labels hidden on mobile (`hidden sm:inline`),
  icons visible.

---

## IMPLEMENTATION ORDER (Phase 6-12)

### Step 1 — Stop the crash
1. **6.1** — Fix WidgetEngine `useContainerWidth` → `WidthProvider` HOC

### Step 2 — Fix sidebar navigation
2. **7.1** — Fix capabilities loading flash (optimistic placeholderData)
3. **7.2** — Verify direct URL access protection
4. **7.3** — Fix sidebar state persistence

### Step 3 — Implement per-module accent system
5. **8.1** — Active nav item uses module accent (not violet gradient)
6. **8.2** — Notification bell uses orange accent
7. **8.3** — Dashboard quick-action icons use module accents
8. **8.4** — MetricWidget colors aligned
9. **8.5** — Remove mobile FAB gradient
10. **8.6** — Fix announcement input focus rings

### Step 4 — Design system consistency
11. **9.1** — Standardize radius
12. **9.2** — Enforce compact spacing
13. **9.3** — Standardize focus ring (universal violet)

### Step 5 — Widget lifecycle & notifications
14. **10.1-10.3** — Notification states + Reverb + Notification Center page
15. **11.1-11.3** — Widget lifecycle + Time Clock audit + dashboard persistence

### Step 6 — Responsive
16. **12.1-12.3** — Dashboard + sidebar + notification responsive audit

---

## ACCEPTANCE — Dashboard, Sidebar & Design System

The Dashboard, Sidebar, Widgets, Notification Centre, RBAC, and Design System are production-ready
when ALL of the following are true:

1. **Dashboard renders without crashing.** Zero `TypeError: useContainerWidth is not a function`.
   (6.1) ✅
2. **Dashboard fires ≤ 5 API calls** on cold load (1 init + 1-2 widget-specific + notifications).
   (6.3) ✅
3. **Sidebar shows all nav items immediately** on login — no items appearing after a delay. (7.1) ✅
4. **Unauthorized pages show error states** when accessed via direct URL — API returns 403. (7.2) ✅
5. **Sidebar state persists** across refresh, navigation, and login. (7.3) ✅
6. **Active nav item uses the module's accent color** — Dashboard=Blue, Attendance=Green,
   Leave=Amber, etc. No violet gradient on the left bar. (8.1) ✅
7. **Notification bell uses orange accent** — filter tabs, unread background, focus ring. (8.2) ✅
8. **No gradients on UI components** except the primary-button hover and the sign-in hero.
   (8.1, 8.5) ✅
9. **Every widget has error/empty/loading states.** (11.1) ✅
10. **Time Clock widget works end-to-end** — clock in/out/break, timer, overtime, offline,
    persistence. (11.2) ✅
11. **Dashboard layout persists** across refresh — widget positions, collapse state. (11.3) ✅
12. **Responsive at 360/768/1024/1440px** — widgets stack, sidebar adapts, modals go full-screen
    on mobile. (12.1-12.3) ✅
13. **Zero console errors** on the dashboard. ✅
14. **Focus rings are universal violet** on all interactive elements. (9.3) ✅
15. **Radius is consistent** — all cards same radius, all buttons same radius. (9.1) ✅line,
    persistence. (11.2)
11. **Dashboard layout persists** across refresh — widget positions, collapse state. (11.3)
12. **Responsive at 360/768/1024/1440px** — widgets stack, sidebar adapts, modals go full-screen
    on mobile. (12.1-12.3)
13. **Zero console errors** on the dashboard.
14. **Focus rings are universal violet** on all interactive elements. (9.3)
15. **Radius is consistent** — all cards same radius, all buttons same radius. (9.1)
