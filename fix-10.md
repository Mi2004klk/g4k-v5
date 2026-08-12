# fix-10.md — The Final Performance Fix: Infrastructure + Caching + Proxy

> **Previous fixes resolved code-level issues** (Octane deployed, WidgetEngine fixed, RSC prefetch
> disabled, widgets read from consolidated init, auth refresh works). The app is STILL slow because
> of **three infrastructure-level root causes** that no amount of frontend code can fix.
>
> This file prescribes the exact remaining fixes to bring response times from 5-20 seconds to < 1s.

---

## ROOT CAUSE — Why the app is STILL slow despite all code fixes

### The `init` endpoint takes 4-5+ seconds because of DB region mismatch

**File:** `apps/api/app/Http/Controllers/DashboardController.php:15-52`

The `/dashboard/init` endpoint correctly consolidates 7 data sources into 1 API call. All widgets
read from this single query via React Query's `select`. The deduplication is working.

**BUT:** The `init()` method calls 7 controller methods internally, each making DB queries:

| Internal call | DB queries | Purpose |
|---|---|---|
| `metrics()` | ~8 | User/dept counts, attendance aggregates, leave count, audit join, project/task counts |
| `meToday()` | 3 | Attendance day + events + work_schedule |
| `preferences::show()` | 1 | User preferences |
| `pending()` | 2 | Pending leave requests + role lookup |
| `pins::index()` | 1 | Pinned nav items |
| `announcements::index()` | 2 | Announcements + creator/team eager load |
| `quick_notes::index()` | 1 | User's notes |
| **Total** | **~18** | |

The database is at `aws-0-ap-south-1.pooler.supabase.com` (**Mumbai, India**). Railway's default
region is **US East**. Every DB query round-trip = **200-300ms**. 18 queries × 250ms average =
**4.5 seconds** for the init endpoint alone.

Additionally, each API request goes through the **Next.js rewrite proxy** (Vercel edge → Railway),
adding ~50-100ms overhead per request.

**Total for dashboard load:** 4.5s (init) + 0.5s (notifications) + 0.5s (capabilities) + 0.5s
(proxy overhead) = **~6 seconds minimum**, even with perfect frontend code.

**For login:** 1s (login API) + redirect + 6s (dashboard) = **~7 seconds.** If Railway cold-starts
(container slept), add 10-30s for wake + migrate + Octane boot = **20+ seconds.**

---

## PHASE 1 — Align Railway + Supabase Regions (THE biggest remaining win)

### 1.1 Move Railway to ap-south-1 (Mumbai) to match Supabase

**Problem:** Railway (US East) ↔ Supabase (Mumbai) = 200-300ms per DB query. The init endpoint
makes 18 queries → 4.5 seconds of pure DB latency.

**Fix:**
- [ ] **1.1a** Railway dashboard → Settings → Service Region → select the region closest to
  `ap-south-1` (Mumbai). Railway may not offer `ap-south-1` directly — choose the closest available
  (e.g., `ap-southeast-1` Singapore if available, which has ~50ms latency to Mumbai).
- [ ] **1.1b** If Railway doesn't offer an Asia-Pacific region on the current plan, consider:
  - **Option A:** Move Supabase to US East (`us-east-1`) to match Railway. This requires creating a
    new Supabase project in US East and migrating data (Supabase supports `pg_dump`/`pg_restore`).
  - **Option B:** Migrate the API from Railway to a provider with Asia-Pacific regions:
    - **Fly.io** — supports `ap-south-1` (Mumbai) natively. Free trial covers months.
    - **Render** — supports `ap-southeast-1` (Singapore). Free tier available.
  - **Option C:** Deploy the API on a VPS in Mumbai (DigitalOcean/Hetzner) with Nginx + PHP-FPM.
    Most control, lowest latency, but requires manual setup.

**Impact:** DB query latency drops from 200-300ms to <10ms. The init endpoint drops from 4.5s to
~200ms. Dashboard load drops from 6s to <1s.

**Dependencies:** None — this is an infrastructure change, not a code change.
**Verification:** After region change, run `php artisan tinker` → `DB::select("SELECT 1");` →
response time < 50ms (was 200-300ms).

---

## PHASE 2 — Cache the Init Endpoint (eliminate repeated DB queries)

### 2.1 Wrap the entire init() response in Cache::remember

**Problem:** Even with aligned regions, the init endpoint makes 18 DB queries on every request.
With a 60s `staleTime` on the frontend, the init endpoint is called once per minute per user. With
N users, that's N × 18 queries per minute.

**Fix:**
- [ ] **2.1a** Wrap the init response in a per-user cache:
  ```php
  public function init(Request $request) {
      $user = $request->user();
      $activeRole = ...; // existing logic
      $today = Carbon::now()->toDateString();
      $cacheKey = "dashboard_init_{$user->id}_{$activeRole}_{$today}";

      $data = Cache::remember($cacheKey, 120, function () use ($request, $activeRole) {
          $safeCall = function(...) { ... };
          return [
              'metrics' => ...,
              'attendance_today' => ...,
              'preferences' => ...,
              'pending_approvals' => ...,
              'pins' => ...,
              'announcements' => ...,
              'quick_notes' => ...,
              'role' => $activeRole,
          ];
      });

      return response()->json($data);
  }
  ```
  On cache hit, the entire init returns in <50ms with ZERO DB queries.

- [ ] **2.1b** Invalidate the cache on mutations:
  - Attendance punch: `Cache::forget("dashboard_init_{$userId}_{$role}_{$today}")`
  - Leave decision: `Cache::forget("dashboard_init_{$approverId}_...")` + `Cache::forget("dashboard_init_{$submitterId}_...")`
  - Announcement create/delete: forget all `dashboard_init_*` keys for the role (or use a tag-based
    cache if using Redis: `Cache::tags(['dashboard_init'])->flush()`)
  - Quick note create/delete: `Cache::forget("dashboard_init_{$userId}_...")`
  - Pin create/delete: `Cache::forget("dashboard_init_{$userId}_...")`
  - Settings change: flush all dashboard caches

- [ ] **2.1c** For `attendance_today` specifically, use a SHORTER cache (30s) or exclude it from
  the init cache, since attendance state changes frequently (clock in/out). Alternatively, keep
  attendance_today OUT of the init cache and let the TimeClockWidget fetch it separately with its
  own 30s `staleTime`:
  ```php
  // In init():
  'attendance_today' => null, // Frontend fetches separately for freshness
  ```
  Then the TimeClockWidget keeps its own `useQuery(queryKeys.attendanceToday)` that was already
  reading from init — change it to fetch independently.

**Impact:** Second init request within 2 min: <50ms (cache hit, 0 DB queries). First request after
cache expiry: ~200ms (if regions aligned) or ~4.5s (if not).

**Dependencies:** 1.1 (region alignment makes the cache MISS fast too).
**Verification:** Hit `/api/dashboard/init` twice → second response < 50ms.

---

### 2.2 Cache each internal section independently

**Problem:** The init endpoint calls 7 controller methods. Even with the outer cache, on a cache
miss, all 7 run. The `metrics()` method already has internal caching (`Cache::remember`), but the
other 6 don't.

**Fix:**
- [ ] Cache each section independently inside the init method:
  ```php
  $preferences = Cache::remember("user_prefs_{$user->id}", 300, fn() =>
      $safeCall(UserPreferenceController::class, 'show')
  );
  $pins = Cache::remember("user_pins_{$user->id}", 300, fn() =>
      $safeCall(PinController::class, 'index', [])
  );
  $announcements = Cache::remember("announcements_all", 120, fn() =>
      $safeCall(AnnouncementController::class, 'index', [])
  );
  $quickNotes = Cache::remember("quick_notes_{$user->id}", 120, fn() =>
      $safeCall(QuickNoteController::class, 'index', [])
  );
  $pendingApprovals = Cache::remember("pending_approvals_{$user->id}", 60, fn() =>
      $safeCall(LeaveRequestController::class, 'pending')
  );
  ```
- [ ] This way, even on an init cache miss, each section is likely a cache HIT (from a previous
  individual call), so the total query count is much lower.

**Dependencies:** None.
**Verification:** Enable Laravel Telescope → call init → query count on cache miss < 10 (was 18).

---

## PHASE 3 — Bypass the Next.js Rewrite Proxy (eliminate 50-100ms per request)

### 3.1 Call the Railway API directly instead of proxying through Vercel

**Problem:** `apps/web/next.config.ts` configures a rewrite: `/api/:path*` →
`https://g4k-production.up.railway.app/api/:path*`. Every API request goes:
Browser → Vercel Edge → Railway → Supabase → Railway → Vercel Edge → Browser.
The Vercel→Railway hop adds 50-100ms per request.

**Fix:**
- [ ] **3.1a** Set `NEXT_PUBLIC_API_URL` on Vercel to the Railway domain directly:
  ```
  NEXT_PUBLIC_API_URL=https://g4k-production.up.railway.app/api
  ```
- [ ] **3.1b** Update `api-client.ts` to use the direct URL when available:
  ```ts
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
  ```
  When `NEXT_PUBLIC_API_URL` is set, the browser calls Railway directly — no Vercel proxy hop.
  When it's not set (development), it uses `/api` (the local proxy).

- [ ] **3.1c** Configure CORS on the Laravel backend to allow the Vercel domain:
  ```php
  // bootstrap/app.php or config/cors.php
  'paths' => ['api/*', 'broadcasting/auth'],
  'allowed_origins' => [
      'https://g4k-v3-j577q7iu7-arsathmalik0-3965s-projects.vercel.app',
      'https://YOUR-PRODUCTION-DOMAIN.vercel.app',
      'http://localhost:3000',
  ],
  'allowed_methods' => ['*'],
  'allowed_headers' => ['*'],
  'supports_credentials' => true, // Important for cookies
  ```

- [ ] **3.1d** Update the Reverb WebSocket auth endpoint to point directly to Railway:
  ```ts
  // use-reverb.ts
  authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || '/api'}/broadcasting/auth`,
  ```

**Impact:** Saves 50-100ms per API request. For 5 requests per dashboard load: 250-500ms saved.

**Dependencies:** CORS must be configured on the backend.
**Verification:** DevTools → Network → API requests go directly to `g4k-production.up.railway.app`
(not through `vercel.app/api/`). No CORS errors.

---

## PHASE 4 — Reduce Sentry Overhead

### 4.1 Lower Sentry traces sample rate

**Problem:** If `SENTRY_TRACES_SAMPLE_RATE=1.0`, Sentry captures performance data for EVERY request.
This adds overhead (stack traces, spans) to every API call.

**Fix:**
- [ ] Check `apps/api/.env.example` and Railway env vars for `SENTRY_TRACES_SAMPLE_RATE`.
- [ ] Set to `0.1` (10% sampling) for production:
  ```
  SENTRY_TRACES_SAMPLE_RATE=0.1
  ```
- [ ] Also check `apps/web/sentry.client.config.ts` for the frontend sample rate. Set to `0.1`.

**Impact:** Reduces per-request overhead by 50-100ms (Sentry instrumentation cost).
**Verification:** Deploy → verify Sentry still receives error reports but at 10% performance trace sampling.

---

## PHASE 5 — Eliminate Remaining Frontend Bottlenecks

### 5.1 Widget engine fetches preferences separately from init (duplicate)

**Problem:** `widget-engine.tsx:47-48` fetches `/auth/preferences` via `queryKeys.dashboardLayout`,
even though the init endpoint already includes preferences in its response. This is a DUPLICATE
API call.

**Fix:**
- [ ] Change widget-engine to read from the init cache:
  ```tsx
  // BEFORE:
  const { data: preferencesData, isPending } = useQuery({
      queryKey: queryKeys.dashboardLayout,
      queryFn: () => apiFetch("/auth/preferences"),
      ...
  });

  // AFTER:
  const { data: initData, isPending } = useQuery({
      queryKey: queryKeys.dashboardInit,
      ...
  });
  const preferencesData = initData?.preferences;
  ```
  This eliminates one API call per dashboard load.

**Dependencies:** Init endpoint must include preferences (it already does).
**Verification:** DevTools → no separate `/auth/preferences` request on dashboard load.

---

### 5.2 Dashboard layout fetches pins from init but also has a separate query

**Problem:** `dashboard/layout.tsx:163-167`:
```tsx
const { data: pinsData = EMPTY_PINS, refetch: refetchPins } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.pins,
});
```
AND line 169-173:
```tsx
const { data: preferencesData } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.preferences,
});
```
Both use `queryKeys.dashboardInit` → React Query deduplicates them to 1 network call. Good. But
they're two separate `useQuery` calls that could be one. This is fine functionally but slightly
wasteful in terms of component re-renders.

**Fix:**
- [ ] Consolidate into one `useQuery` call in the layout:
  ```tsx
  const { data: initData } = useQuery({
      queryKey: queryKeys.dashboardInit,
      queryFn: () => apiFetch("/dashboard/init"),
      staleTime: 60_000,
  });
  const pins = initData?.pins || EMPTY_PINS;
  const preferences = initData?.preferences;
  ```

**Impact:** Minor — reduces re-renders, not API calls (already deduped).

---

### 5.3 Add `loading.tsx` for all dashboard routes (verify)

**Problem:** Without `loading.tsx`, every navigation shows nothing during the route transition.
Even with cached data, the transition itself is a blank frame.

**Fix:**
- [ ] Verify `loading.tsx` exists for ALL dashboard routes:
  ```bash
  find apps/web/src/app/dashboard -name 'loading.tsx' | wc -l
  ```
  Should be ≥ 12 (one per major route segment).
- [ ] If any are missing, add them with appropriate skeletons.

**Dependencies:** None.

---

### 5.4 Remove all full-page blocking returns (verify)

**Problem:** Pages that `if (isLoading) return <Skeleton/>` block the ENTIRE page until data arrives.

**Fix:**
- [ ] Grep: `grep -rn 'if (isLoading\|if (isPending' apps/web/src/app/dashboard/`
  For each hit, verify it's an INLINE skeleton (inside a content area), not a full-page return.
- [ ] If any full-page returns remain, refactor to render the shell + inline skeletons.

**Dependencies:** 5.3.

---

## PHASE 6 — Verify Octane Is Actually Running

### 6.1 Verify FrankenPHP is installed and Octane is serving requests

**Problem:** The nixpacks build phase runs `php artisan octane:install --server=frankenphp`. If this
fails (no internet access during build, wrong architecture, disk space), FrankenPHP isn't installed.
The start command `exec php artisan octane:start --server=frankenphp ...` would fail, and Railway
would either crash or fall back.

**Fix:**
- [ ] **6.1a** Check Railway deploy logs for the `octane:install` command output. Look for:
  - `FrankenPHP binary downloaded successfully` (or similar)
  - No error messages
- [ ] **6.1b** Verify Octane is serving requests (not `php artisan serve`):
  ```bash
  curl -I https://g4k-production.up.railway.app/api/ping
  ```
  Check the `Server` header. If it says `PHP/8.4.x` (built-in server), Octane is NOT running.
  If it says `Caddy` or `FrankenPHP`, Octane IS running.
- [ ] **6.1c** Send 5 concurrent requests and verify they're handled in parallel:
  ```bash
  for i in {1..5}; do
    time curl -s -H "Authorization: Bearer <token>" https://g4k-production.up.railway.app/api/dashboard/metrics > /dev/null &
  done
  wait
  ```
  If all 5 complete in ~1s total, Octane is handling them concurrently. If they take ~5s (serial),
  the built-in server is still running.

**Dependencies:** None.
**Verification:** Railway logs show `octane:start` running. Concurrent requests complete in parallel.

---

### 6.2 Octane state management audit

**Problem:** Octane keeps Laravel booted in memory. If static state leaks between requests,
intermittent 500 errors occur (especially on endpoints that modify global state).

**Fix:**
- [ ] Check `config/octane.php` for the `flush` configuration. Add any state that needs resetting:
  ```php
  'flush' => [
      // Reset DB query log
      \Illuminate\Support\Facades\DB::class => 'flushQueryLog',
  ],
  ```
- [ ] Set `--max-requests=500` (already set) — workers restart every 500 requests, clearing state.
  If 500 errors persist, reduce to `--max-requests=100`.
- [ ] Check Sentry for any `Octane`-related exceptions (memory leaks, stale data).

**Dependencies:** 6.1.
**Verification:** Send 1000 requests in a loop → memory usage stays flat → no 500 errors.

---

## PHASE 7 — Prevent Railway Cold Starts

### 7.1 Verify the self-ping is working

**Problem:** Railway's Hobby plan may sleep services after 15 min of inactivity. The first request
after sleep takes 10-30s (container wake + migrate + Octane boot).

**Fix:**
- [ ] `start.sh` already has a self-ping loop (line 12):
  ```bash
  ( sleep 30; while true; do curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; sleep 300; done ) &
  ```
  Verify this is actually running by checking Railway logs for periodic `/api/ping` requests.
- [ ] **Also** set up an EXTERNAL uptime monitor (UptimeRobot, Cron-job.org) that pings
  `https://g4k-production.up.railway.app/api/ping` every 5 min. This is more reliable than the
  self-ping (which doesn't run if the container is asleep).
- [ ] If on Railway Hobby plan: upgrade to Pro ($20/mo) which doesn't sleep. OR keep the self-ping +
  external monitor combination.

**Dependencies:** None.
**Verification:** Leave app idle for 1 hour → first request responds in < 3s (container didn't sleep).

---

## IMPLEMENTATION ORDER

### Step 1 — Infrastructure (THE fix — do this FIRST)
1. **1.1** — Align Railway + Supabase regions (biggest single win: 4.5s → 200ms)
2. **6.1** — Verify Octane is actually running (not php artisan serve)
3. **7.1** — Verify self-ping + external uptime monitor

### Step 2 — Caching
4. **2.1** — Cache the init endpoint (4.5s → <50ms on cache hit)
5. **2.2** — Cache each section independently

### Step 3 — Network optimization
6. **3.1** — Bypass Next.js rewrite (call Railway directly, save 50-100ms per request)
7. **4.1** — Lower Sentry traces sample rate

### Step 4 — Frontend cleanup
8. **5.1** — Eliminate duplicate preferences fetch
9. **5.2** — Consolidate layout queries
10. **5.3** — Verify loading.tsx files
11. **5.4** — Remove full-page blocking returns
12. **6.2** — Octane state management audit

---

## ACCEPTANCE — "The app is genuinely fast"

1. **Login → dashboard: < 3 seconds.** (was 20s)
2. **Page navigation: < 1 second** from cached data. (was 5-10s)
3. **`/dashboard/init` response: < 200ms** on cache miss, < 50ms on cache hit. (was 4.5s+)
4. **DB query latency: < 50ms** per query. (was 200-300ms)
5. **No Vercel proxy hop** — API calls go directly to Railway. (3.1)
6. **Octane verified running** — concurrent requests complete in parallel. (6.1)
7. **Railway doesn't sleep** — first request after 1h idle: < 3s. (7.1)
8. **Sentry overhead: < 10% sampling.** (4.1)
9. **Zero duplicate API calls** — preferences read from init cache. (5.1)
10. **Every route has loading.tsx** — instant transition skeleton. (5.3)
11. **The app is usable for 30 minutes straight** with every interaction feeling instant.
12. **Zero console errors.** Zero 500s. Zero 404s.

---

## THE MATH (final)

**Current state (regions misaligned, no init cache, proxy overhead):**
- Init endpoint: 18 queries × 250ms = 4.5s
- Other API calls: 3 calls × (250ms query + 75ms proxy) = ~1s
- Total: **~5.5s per dashboard load**

**After Phase 1 (region alignment):**
- Init endpoint: 18 queries × 10ms = 180ms
- Other API calls: 3 × (10ms + 75ms proxy) = ~255ms
- Total: **~435ms**

**After Phase 2 (init cache):**
- Init cache HIT: 0 queries → <50ms
- Other API calls: 3 × 85ms = 255ms
- Total on cache hit: **~305ms**

**After Phase 3 (bypass proxy):**
- Init cache HIT: <50ms (direct to Railway)
- Other API calls: 3 × 10ms = 30ms
- Total on cache hit: **~80ms**

**After Phase 4 (Sentry 0.1):**
- Per-request overhead: -50ms
- Total: **~30ms** (cached) / **~200ms** (cache miss)

**Total improvement: 5.5 seconds → 30-200ms. The app will feel instantaneous.**
