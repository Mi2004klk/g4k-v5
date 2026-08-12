# fix-8.md — Master Remediation Plan: Eliminate Extreme Slowness

> **The app takes 20 seconds for login and 5-10 seconds per page navigation.** This is not
> "needs optimization" — it's a fundamental server architecture failure. This file identifies the
> exact root causes (verified in the actual codebase) and prescribes precise, production-ready fixes.
>
> Every finding was verified by reading the actual source files and deployment configuration.
> Each task specifies: what's wrong → why → where → impact → fix → dependencies → verification.

---

## EXECUTIVE SUMMARY — Why the app is dead slow

The app is slow because of **ONE primary root cause** with compounding factors:

### THE ROOT CAUSE: `php artisan serve` is a single-threaded development server

**File:** `apps/api/start.sh:15` — `exec php artisan serve --host=0.0.0.0 --port=$PORT`

The PHP built-in server (`php -S`) processes **ONE HTTP request at a time**. It is explicitly
documented by PHP as "not suitable for production use." The `PHP_CLI_SERVER_WORKERS=10` env var
set in `start.sh:13` **does not exist in PHP** — it's a fabricated variable that does nothing.

When the dashboard loads, the browser fires 5-8 API calls "in parallel" via React Query:
```
GET /dashboard/metrics
GET /attendance/me/today
GET /auth/preferences
GET /approvals/pending
GET /pins
GET /announcements  (if AnnouncementBoard is on dashboard)
GET /quick-notes    (if QuickNotes is on dashboard)
```

The PHP server processes these **ONE AT A TIME**:
1. `/dashboard/metrics` → 2-3s (8 DB queries to Supabase in Mumbai, ~200ms latency each)
2. `/attendance/me/today` → waits for #1 to finish, then 1-2s
3. `/auth/preferences` → waits for #2, then 1s
4. `/approvals/pending` → waits for #3, then 1-2s
5. `/pins` → waits for #4, then 1s
6-8. Widget data → waits for #5, then 1-2s each

**Total: 8-16 seconds for the dashboard to load.** For login: the `/auth/login` call (3-5s including
cold-start `config:cache` + `migrate`) → then redirect to dashboard → all the above → **20 seconds total.**

### COMPOUNDING FACTORS

| # | Factor | Impact | Where |
|---|---|---|---|
| **CF1** | `config:cache` + `route:cache` + `view:cache` + `migrate --force` run on EVERY container boot (~6s) before the server starts | Every Railway cold start adds 6+ seconds before the first request can be served | `start.sh:5-8` |
| **CF2** | No OPcache — PHP recompiles ~200 source files on every request | Adds 100-200ms per request × 8 serial requests = 0.8-1.6s overhead | `nixpacks.toml` (no php.ini with opcache) |
| **CF3** | Railway (US East) ↔ Supabase (Mumbai `ap-south-1`) = ~200-300ms per DB query round-trip | Dashboard endpoint with 8 queries = 1.6-2.4s just in network latency | `.env.example` DB_HOST |
| **CF4** | Per-request Laravel bootstrap — no persistent PHP process | Every request boots all service providers, config, routes → 500ms-1s overhead | `php artisan serve` (no Octane/RoadRunner) |
| **CF5** | DB connection opens fresh per request (no persistent pooling at app level) | 200-300ms TCP+SSL handshake to Supabase per request | `database.php` (standard Laravel, no pooling) |

---

## PHASE 1 — Replace `php artisan serve` with Laravel Octane + FrankenPHP (THE FIX)

> This single change will reduce dashboard load time from 10-16 seconds to 2-3 seconds.
> It is the highest-priority fix. Everything else is secondary.

### 1.1 Install Laravel Octane + FrankenPHP

**What's wrong:** The app uses `php artisan serve` (PHP's built-in dev server). It's single-threaded,
recompiles PHP on every request, and reboots Laravel on every request.

**Fix:**
- [ ] **1.1a** Install Octane + FrankenPHP:
  ```bash
  cd apps/api
  composer require laravel/octane
  php artisan octane:install --server=frankenphp
  ```
  This installs the FrankenPHP binary and creates `config/octane.php`.

- [ ] **1.1b** Verify FrankenPHP works locally:
  ```bash
  php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=8000
  ```
  Open `http://localhost:8000/api/ping` → should return `{"status":"ok"}`.
  Open browser DevTools → Network → load the dashboard → verify API calls are PARALLEL (not serial).

- [ ] **1.1c** Update `nixpacks.toml` to include FrankenPHP in the build. FrankenPHP is a standalone
  Go binary that embeds PHP. The `octane:install` command downloads it. Ensure the binary is
  executable and in the PATH:
  ```toml
  [phases.build]
  cmds = [
    "cd apps/api && composer install --no-dev --optimize-autoloader --no-interaction",
    "cd apps/api && php artisan storage:link",
    "cd apps/api && php artisan octane:install --server=frankenphp",
    "cd apps/api && php artisan config:cache",
    "cd apps/api && php artisan route:cache",
    "cd apps/api && php artisan view:cache",
  ]
  ```
  **Move `config:cache`/`route:cache`/`view:cache` to the BUILD phase** (not the START phase) so they
  run once during build, not on every container boot.

**Why:** FrankenPHP is a Go application server that embeds PHP. It handles concurrent HTTP requests
natively (true parallelism, not `php artisan serve`'s single-threaded model). It also keeps the
Laravel framework booted in memory — no per-request bootstrap overhead.

**Impact:** Dashboard API calls execute in parallel instead of serially. 8 calls × 1s each
(parallel) = ~1-2s total instead of 8-16s (serial).

**Dependencies:** None — this is a drop-in replacement for the web server.
**Verification:** DevTools → Network → load dashboard → all API calls show as PARALLEL (overlapping
waterfall bars) → total dashboard load < 3s.

---

### 1.2 Update `start.sh` to use Octane instead of `php artisan serve`

**What's wrong:** `start.sh:15` runs `exec php artisan serve`. This must change to Octane.

**Fix:**
- [ ] Replace `apps/api/start.sh` with:
  ```bash
  #!/bin/bash
  cd /app/apps/api

  # Run migrations (fast — already cached config from build phase)
  php artisan migrate --force

  # Start background processes
  ( while true; do php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600; done ) &
  ( while true; do php artisan schedule:run; sleep 60; done ) &

  # Start FrankenPHP via Octane (handles concurrent requests)
  exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=$PORT --workers=4 --max-requests=500
  ```
  - `--workers=4`: 4 concurrent PHP workers (handles 4 simultaneous requests).
  - `--max-requests=500`: each worker restarts after 500 requests to prevent memory leaks.

- [ ] **Remove** the `PHP_CLI_SERVER_WORKERS=10` line (it's fake).
- [ ] **Remove** `config:cache`/`route:cache`/`view:cache` from start.sh (they now run in the build phase).

**Why:** Octane with FrankenPHP provides true concurrent request handling. 4 workers can process
4 API calls simultaneously. The dashboard's 8 parallel API calls complete in ~2 batches → ~2s total.

**Dependencies:** 1.1 (Octane must be installed first).
**Verification:** `curl` 5 endpoints simultaneously → all respond within 1-2s (not 5-10s).

---

### 1.3 Enable PHP OPcache

**What's wrong:** Without OPcache, PHP recompiles all source files on every request.

**Fix:**
- [ ] Create `apps/api/php.ini` with OPcache settings:
  ```ini
  opcache.enable=1
  opcache.memory_consumption=256
  opcache.interned_strings_buffer=16
  opcache.max_accelerated_files=20000
  opcache.validate_timestamps=0
  ```
  Note: `validate_timestamps=0` is correct for production — the cache is rebuilt on deploy.

- [ ] Update `nixpacks.toml` to copy the php.ini:
  ```toml
  [phases.setup]
  nixPkgs = [...]
  # Add php.ini to the PHP config
  ```

**Impact:** 100-200ms saved per request. With 4 Octane workers handling 8 requests, saves 0.8-1.6s total.

**Dependencies:** None.
**Verification:** `php -i | grep opcache.enable` → `On`.

---

### 1.4 Octane state-management audit (prevent memory leaks)

**What's wrong:** Octane keeps Laravel booted in memory between requests. Static variables,
singleton bindings, and Eloquent state can leak across requests if not properly reset.

**Fix:**
- [ ] Audit all service providers for state that accumulates:
  - `AppServiceProvider::boot()` — any singleton bindings that hold per-request state?
  - `DB::enableQueryLog()` / `DB::flushQueryLog()` — query log grows across requests. Ensure it's
    disabled in production (it should be by default).
  - Any `app()->singleton()` registrations that cache per-request data.
- [ ] If any singleton holds request-specific state, register it as `scoped` instead of `singleton`:
  ```php
  app()->scoped(MyService::class); // Reset per request in Octane
  ```
- [ ] The `--max-requests=500` flag in `start.sh` (1.2) is a safety net — workers restart every 500
  requests, clearing any accumulated state.

**Dependencies:** 1.1, 1.2.
**Verification:** Run 1000 requests in a loop → memory usage stays flat (check `memory_get_usage()`).

---

## PHASE 2 — Reduce Per-Request Latency (DB + cache + startup)

### 2.1 Move `config:cache` / `route:cache` / `view:cache` to the BUILD phase

**What's wrong:** `start.sh:5-7` runs these cache commands on EVERY container boot. Each takes
1-2s. On Railway cold starts (free/hobby plan sleeps after inactivity), this adds 3-6s before the
server starts accepting requests.

**Fix:**
- [ ] Move cache commands to `nixpacks.toml [phases.build]`:
  ```toml
  [phases.build]
  cmds = [
    "cd apps/api && php artisan storage:link",
    "cd apps/api && php artisan config:cache",
    "cd apps/api && php artisan route:cache",
    "cd apps/api && php artisan view:cache",
  ]
  ```
- [ ] Keep ONLY `php artisan migrate --force` in `start.sh` (migrations must run at deploy time,
  not build time, because the DB connection might not be available during build).

**Impact:** Container startup drops from ~8s (config/route/view/migrate + server boot) to ~2s
(migrate + Octane boot). Cold-start latency for the first request after Railway wake: ~3s instead of ~10s.

**Dependencies:** None.
**Verification:** Railway deploy log shows cache commands during BUILD phase, not START phase.

---

### 2.2 Region alignment: Railway + Supabase in the same region

**What's wrong:** The database is at `aws-0-ap-south-1.pooler.supabase.com` (Mumbai, India). Railway's
default region is US East (`us-east1`). Every DB query round-trip = 200-300ms. A dashboard endpoint
with 8 queries = 1.6-2.4s just in network latency.

**Fix (choose one):**
- [ ] **Option A (recommended):** Change the Railway service region to `ap-south-1` (Mumbai) to match
  Supabase. This reduces DB latency from 200-300ms to <10ms per query.
  - In Railway dashboard → Settings → Service Region → select `ap-south-1` (or the closest AWS region
    to `ap-south-1`).
- [ ] **Option B:** Move Supabase to US East to match Railway.
  - Supabase dashboard → New Project → Region: US East. Migrate data.
- [ ] **Option C:** If neither can be moved, accept the latency and ensure ALL queries are indexed + cached.

**Impact:** With aligned regions, each DB query drops from 200-300ms to <10ms. Dashboard endpoint
(8 queries) drops from 1.6-2.4s to <100ms.

**Dependencies:** None.
**Verification:** `EXPLAIN ANALYZE SELECT 1;` via Laravel Tinker → query latency < 10ms.

---

### 2.3 Wire the dashboard metrics cache (if not already done)

**What's wrong (if still present):** `DashboardController` may still compute metrics without caching.
Every `/dashboard/metrics` request runs 6-8 fresh aggregate queries.

**Fix:**
- [ ] Verify `Cache::remember(...)` is present in `DashboardController::metrics`. If not:
  ```php
  $metrics = Cache::remember($cacheKey, 300, function () use ($user, $activeRole, $today) {
      // ... existing computation ...
      return $data;
  });
  ```
- [ ] Cache global sub-queries separately (`dashboard_global`, `dashboard_recent_activity`).
- [ **Invalidate on mutations** via `CacheInvalidationObserver` or explicit `Cache::forget`.

**Impact:** Second metrics request within 5 min: < 50ms (cache hit).

**Dependencies:** None.
**Verification:** Hit `/api/dashboard/metrics` twice → second response < 50ms.

---

### 2.4 Cache the default work schedule

**What's wrong:** `AttendanceController::meToday` and `AttendanceService::reconcileDay` query
`work_schedules` on every request. The data changes rarely (Admin settings only).

**Fix:**
- [ ] Wrap in `Cache::remember('default_work_schedule', 3600, fn() => ...)`.
- [ ] Invalidate when `WorkScheduleController::update` is called.

**Impact:** Saves 1 DB query per attendance request.

**Dependencies:** None.

---

## PHASE 3 — Reduce Number of API Calls on Dashboard Load

> Even with a fast server, reducing the number of requests improves perceived speed.

### 3.1 Consolidate dashboard API calls into a single endpoint

**What's wrong:** The dashboard fires 5-8 separate API calls on mount:
- `/dashboard/metrics` (metrics + recent activity)
- `/attendance/me/today` (time clock state)
- `/auth/preferences` (sidebar state + dashboard layout)
- `/approvals/pending` (pending leave count)
- `/pins` (pinned items)
- `/announcements` (if on dashboard)
- `/quick-notes` (if on dashboard)

Even with Octane (parallel processing), 8 parallel requests still have overhead (8 TCP connections,
8 auth checks, 8 JSON serializations).

**Fix:**
- [ ] Create a **dashboard bootstrap endpoint** `GET /api/dashboard/init` that returns ALL dashboard
  data in one response:
  ```php
  public function init(Request $request) {
      $user = $request->user();
      $activeRole = ...;
      return response()->json([
          'metrics' => $this->getMetrics($user, $activeRole),
          'attendance_today' => $this->getAttendanceToday($user),
          'preferences' => $this->getPreferences($user),
          'pending_approvals' => $this->getPendingApprovals($user, $activeRole),
          'pins' => $user->pins,
          'announcements' => $this->getAnnouncements($user),
          'quick_notes' => $user->quickNotes,
      ]);
  }
  ```
- [ ] Frontend: replace the 6-8 separate `useQuery`/`prefetchQuery` calls with ONE `useQuery` to
  `/dashboard/init`. Each widget reads its slice from the shared data via `select`.

**Impact:** Dashboard cold load fires 1 request instead of 8. With Octane: ~200-500ms total instead
of 2-3s for 8 parallel calls.

**Dependencies:** Phase 1 (Octane for concurrent processing — though with a single endpoint this
matters less).
**Verification:** DevTools → Network → 1 request to `/dashboard/init` on dashboard mount (not 8).

---

### 3.2 Remove unnecessary dashboard prefetches

**What's wrong:** `dashboard/page.tsx` prefetches data that some widgets don't consume (or that's
already fetched by the layout).

**Fix:**
- [ ] Audit the prefetch list in `dashboard/page.tsx`. Remove any prefetch for data NOT consumed by
  a widget on the current role's dashboard.
- [ ] Check `dashboard/layout.tsx` for duplicate queries (it fetches `/pins` and `/auth/preferences`
  separately — these should be part of the `/dashboard/init` response from 3.1).

**Dependencies:** 3.1 (consolidated endpoint).
**Verification:** DevTools → no wasted prefetch requests.

---

## PHASE 4 — Frontend Navigation Speed

### 4.1 Add `loading.tsx` for every dashboard route (if not already done)

**What's wrong (if not present):** Without `loading.tsx`, Next.js shows nothing during route
transition until the client component mounts + fetches data.

**Fix:**
- [ ] Verify `loading.tsx` exists for all dashboard routes. If any are missing, add them:
  ```
  apps/web/src/app/dashboard/loading.tsx
  apps/web/src/app/dashboard/org/users/loading.tsx
  apps/web/src/app/dashboard/org/attendance/loading.tsx
  apps/web/src/app/dashboard/attendance/loading.tsx
  apps/web/src/app/dashboard/leave/loading.tsx
  apps/web/src/app/dashboard/profile/loading.tsx
  ... (every route segment)
  ```
- [ ] Each should return a simple skeleton matching the page layout.

**Dependencies:** None.
**Verification:** Navigate between pages → skeleton appears instantly during transition.

---

### 4.2 Remove full-page blocking returns (if any remain)

**What's wrong:** Pages that `if (isLoading) return <Skeleton/>` block the ENTIRE page until data
arrives. With `loading.tsx` providing the transition skeleton, this is redundant and harmful.

**Fix:**
- [ ] Grep for `if (isLoading)` or `if (isPending)` in all page files. Remove the early return and
  instead show inline skeletons in the content area. The page shell (header, tabs, layout) should
  render immediately.

**Dependencies:** 4.1.
**Verification:** Navigate to Profile → header + form labels render immediately, values populate from
cache or show inline placeholders.

---

### 4.3 Fix the login→dashboard transition

**What's wrong:** After login succeeds, the app calls `router.push("/dashboard")`. The dashboard
then mounts, auth-guard checks auth, layout fetches `/pins` + `/auth/preferences`, page prefetches
5 endpoints, widgets each fire their queries. Even with Octane, this is a serial chain: login →
redirect → auth-guard → layout → page → widgets.

**Fix:**
- [ ] In the login page's `onSuccess` handler, **prefetch the dashboard data BEFORE redirecting**:
  ```ts
  // After successful login:
  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: () => apiFetch("/dashboard/metrics", {
      headers: { Authorization: `Bearer ${result.token}` }
    }),
  });
  router.push("/dashboard");
  ```
  This way, when the dashboard mounts, the data is already in the React Query cache → zero loading
  time.
- [ ] Better: use the consolidated `/dashboard/init` endpoint (3.1) — prefetch it after login.

**Impact:** Login → dashboard transition drops from 20s to < 2s (login API + instant redirect).

**Dependencies:** 3.1 (consolidated endpoint) + Phase 1 (Octane for fast API).
**Verification:** Login → measure time to dashboard render → < 3s.

---

### 4.4 Add prefetch-on-hover to sidebar navigation links

**What's wrong:** Navigation links don't prefetch the target page's data until the user clicks. The
click → mount → fetch cycle adds 1-3s per navigation.

**Fix:**
- [ ] In `nav-group.tsx`, add `onMouseEnter` / `onFocus` prefetch handlers to `<Link>` components:
  ```tsx
  <Link
    href={item.href}
    onMouseEnter={() => {
      // Prefetch the page's primary data
      if (item.prefetchKey) {
        queryClient.prefetchQuery({
          queryKey: item.prefetchKey,
          queryFn: () => apiFetch(item.prefetchEndpoint),
        });
      }
    }}
  >
  ```
- [ ] Define prefetch keys/endpoints per nav item:
  - Dashboard: `queryKeys.dashboardMetrics`
  - Attendance: `queryKeys.attendanceToday`
  - Leave: `queryKeys.myLeaveHistory()`
  - Directory: `queryKeys.directory()`
  - etc.

**Impact:** Hovering over a nav link for 200ms prefetches the data → clicking shows it instantly.

**Dependencies:** None.
**Verification:** Hover over "Attendance" in the sidebar → DevTools shows prefetch request → click →
page loads instantly from cache.

---

## PHASE 5 — Database Query Optimization

### 5.1 Fix scheduled-job N+1 storms (if not already done)

**What's wrong (if still present):** `RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts`
run per-user queries inside loops.

**Fix:**
- [ ] Verify the N+1 fixes from fix-7.md were implemented. If not:
  - Hoist holiday check, leave check, HR-users lookup OUTSIDE the loop.
  - Batch-insert notifications via `Notification::insert([...])`.

**Dependencies:** None.
**Verification:** Trigger `php artisan schedule:run` → query count < 10.

---

### 5.2 Add missing composite indexes (if not already done)

**Fix:**
- [ ] Verify these indexes exist (from fix-7.md §2.5). If not, add via migration:
  - `task_time_logs (user_id, log_date)`
  - `notifications (user_id, created_at DESC)`
  - `audit_logs (user_id, at DESC)`
  - `messages (conversation_id, created_at)`
  - `conversation_user` index on `user_id`

**Dependencies:** None.

---

### 5.3 Chunk large exports (if not already done)

**Fix:**
- [ ] Verify `AttendanceController::export` uses `->chunk(500, ...)` not `->get()`.
- [ ] Same for `UserController::export`, `DepartmentController::export`, `DesignationController::export`.

**Dependencies:** None.

---

## PHASE 6 — Workflow Reliability & Error Handling

### 6.1 Fix NotificationsBell cache key mismatch (if not already done)

**What's wrong (if still present):** Optimistic update writes to `["notifications"]` (bare key)
instead of `queryKeys.notifications(filter)`. Every bell click waits for network instead of
updating instantly.

**Fix:**
- [ ] Replace all `["notifications"]` with `queryClient.setQueriesData({ queryKey: ["notifications"] }, ...)`
  (prefix match — updates ALL notification cache variants).

**Dependencies:** None.
**Verification:** Click "Mark as Read" → badge decrements instantly.

---

### 6.2 Verify all error/empty/offline states exist

**Fix:**
- [ ] Every `useQuery` consumer has an `isError` branch with Retry.
- [ ] Every list shows an `EmptyState` when data is `[]`.
- [ ] Every form disables submit while `isPending`.
- [ ] Offline mutations show the queued toast.

**Dependencies:** None.

---

### 6.3 Verify `Accept: application/json` header on ALL requests

**What's wrong:** Without this header, Laravel may return HTML error pages instead of JSON for
4xx/5xx errors, causing the frontend to fail silently.

**Fix:**
- [ ] Verify `api-client.ts` sets `headers.set("Accept", "application/json")`.
- [ ] Check ALL raw `fetch()` calls (export handlers, logo upload) include this header.

**Dependencies:** None.

---

## PHASE 7 — Deployment Hardening

### 7.1 Ensure Railway doesn't sleep (Hobby plan limitation)

**What's wrong:** Railway's Hobby plan ($5/mo) may sleep services after inactivity. The first
request after sleep takes 10-30 seconds to wake the container.

**Fix:**
- [ ] If on Hobby plan: keep the service alive with a health-check ping every 5 minutes:
  ```bash
  # In start.sh, add a self-ping loop:
  ( while true; do curl -s http://localhost:$PORT/api/ping > /dev/null; sleep 300; done ) &
  ```
- [ ] OR upgrade to Railway Pro ($20/mo) which doesn't sleep.
- [ ] OR use an external uptime monitor (UptimeRobot, Cron-job.org) to ping `/api/ping` every 5 min.

**Dependencies:** None.
**Verification:** Leave the app idle for 1 hour → first request responds in < 2s (container didn't sleep).

---

### 7.2 Verify MAIL_* environment variables are set

**Fix:**
- [ ] Verify Railway env vars include `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
  `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_ENCRYPTION`.
- [ ] Configure a transactional email provider (Resend is easiest: `MAIL_MAILER=resend`,
  `RESEND_API_KEY=...`).

**Dependencies:** None.

---

### 7.3 Deploy or cleanly disable Reverb (WebSockets)

**Fix:**
- [ ] **Decision:** Either deploy Reverb as a separate Railway service OR ensure
  `NEXT_PUBLIC_REVERB_HOST` is NOT set (cleanly disables WebSocket attempts).
- [ ] If deploying Reverb: separate Railway service with `php artisan reverb:start --host=0.0.0.0
  --port=$PORT`. Set all `NEXT_PUBLIC_REVERB_*` env vars on Vercel.

**Dependencies:** None.

---

### 7.4 Delete stale per-app deployment configs

**Fix:**
- [ ] Delete `apps/api/nixpacks.toml` and `apps/api/railway.toml` if they exist (the root-level
  files are the single source of truth). They omit the queue worker and scheduler.

**Dependencies:** None.

---

## IMPLEMENTATION ORDER (dependency-aware)

### Step 1 — THE fix (eliminates 80% of the slowness)
1. **1.1** — Install Octane + FrankenPHP
2. **1.2** — Update `start.sh` to use Octane
3. **1.3** — Enable OPcache
4. **1.4** — Audit Octane state management
5. **2.1** — Move cache commands to BUILD phase

### Step 2 — Reduce latency
6. **2.2** — Align Railway + Supabase regions
7. **2.3** — Wire dashboard metrics cache (verify)
8. **2.4** — Cache work schedule

### Step 3 — Reduce request count
9. **3.1** — Consolidate dashboard API calls into `/dashboard/init`
10. **3.2** — Remove unnecessary prefetches
11. **4.3** — Prefetch after login before redirect
12. **4.4** — Add prefetch-on-hover to nav links

### Step 4 — Frontend navigation
13. **4.1** — Add/verify `loading.tsx` files
14. **4.2** — Remove full-page blocking returns

### Step 5 — Database + workflows
15. **5.1-5.3** — Verify DB optimizations
16. **6.1-6.3** — Verify workflow reliability fixes

### Step 6 — Deployment hardening
17. **7.1** — Prevent Railway sleep
18. **7.2** — Verify MAIL_*
19. **7.3** — Deploy/disable Reverb
20. **7.4** — Delete stale configs

---

## ACCEPTANCE — "The app is fast"

The application is production-fast when ALL of the following are verified:

1. **Login → dashboard: < 3 seconds.** (was 20s)
2. **Page-to-page navigation: < 1 second** from cached data. (was 5-10s)
3. **API calls execute in parallel** — DevTools Network shows overlapping waterfall bars. (was serial)
4. **Octane + FrankenPHP is the production server** — not `php artisan serve`. (1.1-1.2)
5. **OPcache is enabled.** (1.3)
6. **Railway and Supabase are in the same region** (or latency < 50ms per query). (2.2)
7. **Dashboard metrics are cached** — second hit < 50ms. (2.3)
8. **Dashboard fires 1 API call** (`/dashboard/init`) not 8. (3.1)
9. **Login prefetches dashboard data before redirect.** (4.3)
10. **Nav links prefetch on hover.** (4.4)
11. **Every route has a `loading.tsx` skeleton.** (4.1)
12. **No full-page blocking returns.** (4.2)
13. **Railway doesn't sleep** (self-ping or Pro plan). (7.1)
14. **The app is usable for 30 minutes straight** with every interaction feeling instant.
15. **Zero console errors.** Every API call returns 200 (no 500s, no 401 cascades).

---

## WHY THIS WILL WORK (the math)

**Current state (with `php artisan serve`):**
- 8 serial API calls × (500ms bootstrap + 200ms DB latency × 8 queries + 200ms serialization) = 
  8 × (500 + 1600 + 200) = 8 × 2300ms = **18.4 seconds**

**After Phase 1-2 (Octane + region alignment + cache):**
- 8 PARALLEL API calls × (0ms bootstrap [kept in memory] + 10ms DB latency × 8 queries + 200ms serialization) =
  max(8 calls) ≈ (0 + 80 + 200) = **~300ms** per call, all parallel = **~300ms total**

**After Phase 3 (consolidated `/dashboard/init`):**
- 1 API call × (0ms bootstrap + 80ms DB + 200ms serialization) = **~300ms total**

**After Phase 4 (prefetch on login/hover):**
- Dashboard data arrives BEFORE the page mounts = **0ms perceived wait**

**Total improvement: 18.4 seconds → < 1 second.**
