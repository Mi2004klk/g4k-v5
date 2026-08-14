# finalization-4.md — The Real Root Causes (verified against the DEPLOYED code)

> **This is round 4. Rounds 1–3 did not work because of two things this audit proves:**
> 1. **The fixes were never in production.** I cloned your *actually deployed* repos
>    (`Mi2004klk/g4k-v5` frontend, `arsathmalik0-netizen/G4K` backend) and they are **byte-identical** to your
>    local monorepo — which still contains every bug. Round-3 was a plan that was never merged/deployed.
> 2. **Round-3's frontend diagnosis was wrong.** It claimed "array access is already guarded." It is not. The
>    guards exist only on the *list-returning* `select`s; the **queryFns** (`res.data || []`) and the **scalar
>    selects** (`data.preferences`, `data.metrics`, `data.attendance_today`) are unguarded, and one queryFn
>    (`/work-schedules`) is never unwrapped at all. Those are what actually crash.
>
> This doc was built by **probing the live API** (`g4k-api-…run.app`) and **reading the deployed source**. Every
> claim below has a file:line and most have a live-curl or code confirmation. Apply it top-to-bottom, run the
> **Proof Protocol in §6 before declaring done**, then deploy. There is no round 5 if §6 passes.

---

## 🚨 BEFORE ANYTHING — rotate your secrets (security incident)

You pasted the **complete production secret set in plaintext** (2 GitHub PATs, Supabase service-role key + DB
password + JWT secrets, AWS/S3 keys, the full Cloud Run `.env`, Vercel env). That is a full-takeover leak.
**Rotate every one now** (Supabase API keys + DB password + JWT, AWS/S3 key, GitHub PATs, Cloud Run `APP_KEY` +
Pusher secrets, Vercel env). The committed `apps/api/.env` must also be purged from git history. **Do not skip
this.** This doc never writes secrets to disk.

---

## 0. What's actually wrong (the 3-second version)

Two compounding layers are **both** broken, and each is independently fatal:

| Layer | What's broken | Live evidence | Headline fix |
|---|---|---|---|
| **Backend** | (a) Unauthenticated non-JSON requests return **500 instead of 401** (guest-redirect bug). (b) Valid-token requests **500 from schema drift** (missing columns) and **broadcast-in-transaction** (`cURL error 60`). | `GET /api/notifications` no-auth: `Accept: */*`→**500**, `Accept: application/json`→**401`. Round-3 local log showed real `SQLSTATE[42701/42703]` + `cURL error 60`. | §1 (1-line) + §2 |
| **Frontend** | Widgets/pages call `.find/.map/.length` on **non-array** API data, and 3 `useDashboardInit` **selects are unguarded** → TanStack structural-sharing crash. Plus a pure bug: `/work-schedules` is never unwrapped. | Live console: `eK?.find is not a function`, `B.map is not a function`, `N.find is not a function`, `reading 'length'` (all "ErrorBoundary caught an error in Widget"). | §3 |
| **Hydration** | Zustand `persist` stores hydrate synchronously with **no `skipHydration`/mount-gate** → server/client HTML mismatch. | Live console: React `#418 args[]=HTML` on first paint. | §3.4 |

**Why "every page is broken":** when the API returns 500 (or returns a 200 whose `data` isn't the expected
array), the frontend's unguarded `.find/.map` throws → the widget's `ErrorBoundary` fires → the page shows a
broken widget → because the dashboard layout shares queries, the whole dashboard looks dead. Fix **both** layers.

---

## PART 1 — ✅ [P0, 1 line] Backend: 500 instead of 401 for unauthenticated requests

### Root cause (verified live + in source)

`apps/api/bootstrap/app.php` does **not** override the framework default guest redirect. Laravel 13's
`ApplicationBuilder` auto-applies `redirectGuestsTo(fn () => route('login'))`. When `auth:sanctum` rejects an
unauthenticated request that is **not** `expectsJson()` (i.e. no `Accept: application/json` / not AJAX), it calls
`Authenticate::redirectTo()` → `route('login')`. **There is no named `login` route** — `routes/api.php:47` is
`Route::post('/auth/login', …)` with **no `->name(...)`** — so `route('login')` throws
`Symfony\Component\Routing\Exception\RouteNotFoundException`, which is rendered as **HTTP 500**.

The throw happens *while constructing* the `AuthenticationException`, **before** the exception handler's
`shouldRenderJsonWhen` (bootstrap/app.php:33-35) runs — so the `api/*` JSON rule does not save it.

### Live confirmation (I ran these against production)

| Request | Result |
|---|---|
| `GET /api/health` | **200** (Octane + DB up) |
| `GET /api/notifications` + `Accept: application/json` | **401** `{"message":"Unauthenticated."}` ✓ |
| `GET /api/notifications` + `Accept: */*` (browser/curl default) | **500** `{"message":"Server Error"}` ✗ |
| `GET /api/notifications` + `X-Requested-With: XMLHttpRequest` | **401** ✓ |

### Why this still hurts even though `api-client.ts` sets `Accept: application/json`

The frontend's normal calls do send `Accept: application/json` (`api-client.ts`), so a plain expired-token call
returns 401 and triggers the refresh flow. **BUT the refresh fetch itself does not set `Accept`:**

```ts
// apps/web/src/lib/api-client.ts — refresh fetch
const refreshRes = await fetch(refreshUrl, {
  method: "GET",
  headers: { "X-Refresh-Token": useAuthStore.getState().refreshToken || "" },  // ← no Accept: application/json
  credentials: "include",
});
```

So when a session expires and the refresh token is also invalid, this refresh call hits the **500 path** instead
of a clean 401, the error handling gets confused, and the user is left in a broken state instead of being sent to
`/login`. Fixing the backend (below) makes **every** unauthenticated path return a clean 401 regardless of
headers — which is correct API behavior and stops this class of breakage for good.

### Fix (one line)

In `apps/api/bootstrap/app.php`, inside the `withMiddleware(...)` closure (after the SecurityHeaders append):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
    $middleware->alias([
        'capability' => \App\Http\Middleware\RequireCapability::class,
    ]);

    // API-only app: there is no web login route. Never try to redirect guests to route('login')
    // (which is undefined and throws RouteNotFoundException → HTTP 500). Return null so unauthenticated
    // API requests always get a clean AuthenticationException → 401 JSON.
    $middleware->redirectGuestsTo(fn () => null);
})
```

**Belt-and-suspenders (frontend):** also add `Accept: application/json` to the refresh fetch in
`api-client.ts` so the client and server agree even during token refresh.

### Verify
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://g4k-api-579515345084.asia-south1.run.app/api/notifications
# Before: 500   After: 401   (with NO Accept header)
```

---

## PART 2 — ✅ [P0] Backend: valid-token 500s (schema drift + broadcast in transaction)

Part 1 fixes *unauthenticated* 500s. But the live console shows **authenticated** calls
(`/dashboard/init`, `/directory`, `/projects`, `/notifications`) also returning 500. With a valid token,
`auth:sanctum` passes — so the 500 comes from the controller/listener hitting a **missing DB column/table**
(drift) or a **failed synchronous broadcast**. Both are real (confirmed in the round-3 local `laravel.log`).

### 2.1 Schema drift from non-idempotent migrations

**Root cause:** `apps/api/start.sh:6` runs `php artisan migrate --force --isolated` on every cold start under
`set -e`. ~40 `add_*` migrations have **no `Schema::hasColumn()/hasTable()` guard** (e.g.
`add_priority_to_notifications_table`, `add_active_role_to_users_table`, `add_work_schedule_id_to_users_table`,
`add_approved_breaks_to_attendance`, `add_preferences_to_users_table`, …). When the DB is partially drifted
(column exists but `migrations` row is missing), Postgres throws `SQLSTATE[42701]: Duplicate column`; under
`--isolated` + `set -e` the run aborts **before** later migrations apply → those controllers later
`SELECT` missing columns → `SQLSTATE[42703]` (undefined column) → 500 on every request to that endpoint.
`/notifications` 500-ing is consistent with the `notifications.priority` column being missing.

**Fix (do all three):**
1. **Reconcile the `migrations` table to reality** (one-off, in a Cloud Run job / `php artisan tinker`):
   - `php artisan migrate:status` → note every `Pending` row whose schema is *already* present in the DB.
   - For each, insert its row: `insert into migrations (migration, batch) values ('2026_08_09_161654_add_priority_to_notifications_table', N);` so Laravel stops re-running it. Then run `php artisan migrate` so any genuinely-pending migrations apply.
2. **Make every `add_*`/`create_*` migration idempotent** — wrap the body in
   `if (!Schema::hasColumn('table','col')) { … }` / `if (!Schema::hasTable('t')) { … }`. This is the only way
   to stop drift from ever recurring. Audit all ~40 files in `apps/api/database/migrations/`.
3. **Add a `create_sessions_table` migration** (`php artisan session:table && php artisan migrate`) — none exists
   in the repo, yet `SESSION_DRIVER=database`. It works today only because the table was made out-of-band; any
   fresh DB rebuild will 500 every stateful/web route.

### 2.2 Synchronous broadcasting inside DB transactions

**Root cause:** `apps/api/app/Services/ApprovalService.php` calls `event(new ApprovalDecided(...))` **inside**
`DB::transaction(...)` blocks (~lines 89/107, 136/154, 177/189). With `BROADCAST_CONNECTION=pusher` broadcasting
to the API's **own HTTPS URL** and a missing CA bundle in the FrankenPHP image, the Pusher SDK throws
`cURL error 60: … unable to get local issuer certificate` **synchronously** → the transaction rolls back / the
request 500s. This breaks leave approvals, attendance punches, and any endpoint that broadcasts.

**Fix:**
1. **Never broadcast inside a transaction.** Move each `event(...)` to `DB::afterCommit(function () use (…) { event(...); })` so a broadcast failure can't roll back business data.
2. **Fix the broadcast transport:** either (a) set `BROADCAST_CONNECTION=log`/`null` temporarily to unblock the
   app, or (b) route broadcasting through the **queue** (`QUEUE_CONNECTION=database` is already set) so it's
   async, and (c) point at a cert the container trusts (mount a CA bundle / set `openssl.cafile`), and (d) pick
   **one** of Pusher-vs-Reverb — `cloudbuild.yaml` uses `PUSHER_*` secrets but the codebase carries `REVERB_*`
   values; reconcile them.

### 2.3 `AttendanceService::reconcileDay()` stdClass crash — already fixed in deployed code

The deployed `AttendanceService.php:96-104` now reads scalar model fields directly
(`$schedule->start_time ?? '09:00:00'`, `standard_seconds ?? 31500`) with no cached object. ✅ Confirmed fixed.
No action; left here so you don't re-chase it.

### Verify (after 2.1 + 2.2)
```bash
# With a REAL bearer token from a logged-in user:
TOK="<a real 15-min access token>"
for ep in dashboard/init directory projects notifications attendance/me/today; do
  printf "%-28s " "$ep:"; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOK" -H "Accept: application/json" https://g4k-api-579515345084.asia-south1.run.app/api/$ep
done
# Expect: 200 for each. Any 500 here = drift/broadcast not fully fixed; check Cloud Logging for the SQLSTATE/cURL signature.
```
And: `php artisan migrate:status` must show **zero** `Pending` rows.

---

## PART 3 — ✅ [P0] Frontend: the real crash sites (this is what round-3 got wrong)

Round-3 said array access was guarded. It is **not** — at the points that actually crash. Below are the verified
unguarded sites in the deployed code, grouped by the live error they produce. The canonical safe pattern to copy
already exists in the codebase (`team-attendance-widget.tsx:48`, `metric-widget.tsx:42`):

```ts
// GOOD (copy this everywhere):
const records = Array.isArray(data?.data) ? data.data : [];
```

### 3.1 `B.map is not a function` — `/work-schedules` is never unwrapped (pure bug)

`apps/web/src/app/dashboard/org/users/page.tsx:205-209`:
```ts
const { data: work_schedules = [] } = useQuery({
  queryKey: ["work_schedules"],
  queryFn: () => apiFetch("/work-schedules"),   // ← returns raw { data: [...] }, NOT the array
});
// …later, line 676:
options={work_schedules?.map((ws: any) => ({ … })) || []}   // ← .map on an object → always throws
```
The sibling file `org/users/[id]/page.tsx:73-76` does it correctly (`.then(res => res.data || [])`) — so this is
a regression.

**Fix:** `apps/web/src/app/dashboard/org/users/page.tsx:207`:
```ts
queryFn: () => apiFetch("/work-schedules").then((res: any) => Array.isArray(res?.data) ? res.data : []),
```

### 3.2 `eK?.find is not a function` / `N.find is not a function` / `…map is not a function` — the `res.data || []` trap

Pattern that crashes: `queryFn: () => apiFetch("/x").then(res => res.data || [])`. When `/x` returns a **200**
whose `data` is a truthy **non-array** (a paginated object, an error-shaped object, or `{data:{…}}`), the `|| []`
never fires and `departments`/`designations` becomes that object → the first `.find`/`.map` throws. Note:
`x?.map(...) || []` does **not** protect you — the method call throws **before** `||` is evaluated.

**Deployed sites that must be hardened** (queryFn + call site):

| File | Line | What |
|---|---|---|
| `app/dashboard/org/users/page.tsx` | 187, 200, 207 | departments / designations / work-schedules queryFns |
| `app/dashboard/org/users/[id]/page.tsx` | 63, 69, 75 | departments / designations / work-schedules queryFns |
| `app/dashboard/org/users/page.tsx` | 193 | `departments?.find(...)` |
| `app/dashboard/org/users/page.tsx` | 449, 626, 659, 676 | `departments?.map` / `designations?.map` / `work_schedules?.map` |
| `components/users/user-edit-dialog.tsx` | 61, 107, 140, 157 | `.find` / `.map` on depts/designations/work-schedules |
| `app/dashboard/profile/page.tsx` | 451 (and its designations queryFn) | `designations?.map` |

**Fix at the source (queryFn) — the one change that fixes every downstream call site:**
```ts
// BEFORE (crashes on non-array 200s):
queryFn: () => apiFetch("/departments").then(res => res.data || []),

// AFTER:
queryFn: () => apiFetch("/departments").then((res: any) => Array.isArray(res?.data) ? res.data : []),
```
Apply to every `res.data || []` / `res?.data || []` queryFn (12 occurrences). For defense-in-depth at call sites
that receive data as props, use `(Array.isArray(x) ? x : []).find(...)`.

### 3.3 `Cannot read properties of undefined (reading 'length')` — unguarded `useDashboardInit` selects (TanStack structural sharing)

Three `useDashboardInit({ select })` consumers return a bare field with **no fallback**. When `/dashboard/init`
omits/nulls that field, the select returns `undefined`; on the next result TanStack's `replaceEqualDeep`
(structural sharing) compares an object against `undefined`, reads `.length`, and throws **inside `createResult`**
— escaping the render and tripping the widget `ErrorBoundary`.

| File | Line | Current (crashes) | Fix |
|---|---|---|---|
| `components/widgets/widget-engine.tsx` | 47 | `select: (data: any) => data.preferences` | `select: (data: any) => data?.preferences ?? null` |
| `components/widgets/recent-activity-widget.tsx` | 15 | `select: (data: any) => data.metrics` | `select: (data: any) => (Array.isArray(data?.metrics) ? data.metrics : [])` |
| `components/widgets/time-clock-widget.tsx` | 47 | `select: (data: any) => data.attendance_today` | `select: (data: any) => data?.attendance_today ?? null` |

Mirror the already-safe pattern in `components/widgets/metric-widget.tsx:42` (`data?.metrics || {}`).

> **Latent bug (not the crash, but wrong):** `widget-engine.tsx:101` reads
> `preferencesData.preferences?.dashboard_layout`, but `preferencesData` is **already** `data.preferences` (from
> the select). It should be `preferencesData?.dashboard_layout`. Fix while you're there.

### 3.4 `data?.data || []` then array method — dashboard widgets (errors #2/#3 surface)

These read `const records = data?.data || []` then immediately call `.filter/.map/.length/.slice`. Same trap as
3.2: a truthy non-array `data` defeats `|| []`.

| File | Line | Method called |
|---|---|---|
| `components/dashboard/admin-today-attendance-widget.tsx` | 20 | `.filter` / `.length` |
| `components/dashboard/hr-team-attendance-widget.tsx` | 20 | `.filter` / `.length` / `.slice` / `.map` |
| `components/dashboard/quick-task-widget.tsx` | 23 | `.map` |
| `components/attendance/hr-activity-feed-widget.tsx` | 34 | `.forEach` |

**Fix (each):** `const records = Array.isArray(data?.data) ? data.data : [];`

> There are **21** `data?.data || []` occurrences across `app/`+`components/`. The fastest durable fix is a
> global pass replacing `X || []` with `Array.isArray(X) ? X : []` wherever `X` is API-sourced, plus adding
> `Array.isArray` to every `queryFn` `.then`. Do the tabled P0 sites first; the rest are the same one-line edit.

### 3.5 React hydration `#418` (`args[]=HTML`) — Zustand persist has no `skipHydration`

**Root cause (verified):** `apps/web/src/lib/auth-store.ts` and `lib/ui-store.ts` use zustand `persist` with
**no `skipHydration: true`** and no mount-gate. They rehydrate synchronously from `localStorage` at module load
on the client, so components reading persisted state render **different HTML on server vs client**:
- `components/auth-guard.tsx:16-18` — `isInitializing` reads `useAuthStore.getState()` at init. Server: token
  `null` → `true` → full-page skeleton; client (persisted token): `false` → children. **Large HTML diff.**
- `app/dashboard/layout.tsx:186-192` — the grid + `<aside>` `className` is driven by persisted `sidebarState`
  (`ui-store.ts`, default `"collapsed"`). Server renders collapsed classes; a client with `"expanded"` hydrates
  expanded classes → attribute mismatch.

`suppressHydrationWarning` is only on `<html>`/`<body>` (`app/layout.tsx:45,48`) and does **not** cover these
descendant mismatches. (next-themes' `<html>` class mismatch **is** properly suppressed, so it is not the culprit.)

**Fix:**
1. Add `skipHydration: true` to both persisted stores (`auth-store.ts` persist options, `ui-store.ts:76-83`), and
   call `useAuthStore.persist.rehydrate()` / `useUIStore.persist.rehydrate()` in a single top-level `useEffect`
   in `providers.tsx` (or a small `<StoreHydration>` client component mounted once).
2. Gate persisted-state reads behind a `mounted` flag (a tiny `useHydrated()` hook returning `false` until
   `useEffect` fires). At minimum, change `auth-guard.tsx:16-18` so `isInitializing` starts `true`
   **unconditionally** and only resolves to the persisted value **after mount**.

### 3.6 `restoreMutation is not defined` — already fixed in deployed code

The deployed `hooks/use-user-actions.ts:46` defines + returns `restoreMutation`, and both consumers
(`org/users/page.tsx:122`, `org/users/[id]/page.tsx:83`) destructure it correctly. ✅ Confirmed fixed in
production. If you still see this error, it's a **stale browser cache** — hard-refresh.

---

## PART 4 — Carryover from round 3 (verify these are actually done in the deployed code)

Round-3 covered RBAC and the theme dropdown. Since the deployed code was byte-identical to the un-fixed local
copy, **confirm these are present in production** (they may not be). Re-stated crisply; full detail in
`finalization-3.md` Parts C & D.

### 4.1 RBAC — admin must NOT see clock-in/out; HR MUST be able to clock in

- **Root cause:** `apps/api/app/Services/CapabilityMatrix.php:14` `'super_admin' => ['*']` + frontend
  `apps/web/src/lib/capabilities.ts:32` `if (capabilities.includes("*")) return true;` → admin passes
  `attendance.clock-self`. `attendance/page.tsx:86` renders `<TimeClockWidget />` with **no guard**. Inverse bug:
  the `hr` matrix (`CapabilityMatrix.php:15-20`) is **missing `attendance.clock-self`** → HR can't clock in.
- **Fix:** add a `SELF_SERVICE_EXCLUDED = ['attendance.clock-self']` deny-list honored by **both**
  `CapabilityMatrix::hasCapability()` and frontend `hasCapability()` (deny overrides `*`); add
  `attendance.clock-self` to the `hr` list + seeder; re-seed + `php artisan cache:clear`; guard
  `attendance/page.tsx:86` with `hasCapability(…, 'attendance.clock-self')`.
- **Verify:** admin → `POST /api/attendance/clock-in` returns **403** and sees no clock UI; HR → **200** and
  sees the clock.

### 4.2 Theme switch in the profile dropdown

- **Root cause:** `apps/web/src/app/dashboard/layout.tsx:335-339` exposes **only "System Theme"** in the avatar
  dropdown; Light/Dark exist **only** in the Command Palette (`Ctrl/Cmd+K`). `useTheme()` is already wired at
  `layout.tsx:106`.
- **Fix:** replace the single "System Theme" item with Light / Dark / System, each calling `setTheme(...)`, with
  an active checkmark from `theme`/`resolvedTheme` (mirror `command-palette.tsx:213-226`). Delete the unused
  duplicate `components/theme-provider.tsx`.

---

## PART 5 — Cross-cutting deploy hygiene (ship with the above)

| Gate | Requirement | Where |
|---|---|---|
| **Authenticated smoke test** | `cloudbuild.yaml` only hits unauthenticated `/api/health`+`/api/ping` — so an image that 500s on every authed route **passes**. Add a probe of `/api/dashboard/init` + `/api/notifications` with a test bearer token + `Accept: application/json`; fail build on non-200. | `cloudbuild.yaml:52-63` |
| **`migrate:status` gate** | Fail the build/deploy if any migration is `Pending` after `migrate`, so drift is caught before traffic shifts. | `cloudbuild.yaml` |
| **Migration idempotency** | Every `add_*`/`create_*` migration wrapped in `hasColumn`/`hasTable`. | `apps/api/database/migrations/*` |
| **No `set -e` on migrate** | Octane boots regardless of migrate outcome; log/alert instead. | `apps/api/start.sh:2,6` |
| **Purge committed `.env`** | Rotate all its secrets + remove from git history; add `/apps/api/.env` to `.gitignore`. | repo |
| **Fresh Vercel build** | Confirm Vercel served a **new** build hash (not a stale artifact) after the frontend fixes. | Vercel |

---

## PART 6 — Implementation order + the PROOF protocol (do NOT skip §6.2)

### 6.1 Implementation order

1. **§1** — add `$middleware->redirectGuestsTo(fn () => null);` (1 line). **+** add `Accept: application/json` to
   the refresh fetch in `api-client.ts`.
2. **§2.1** — reconcile `migrations` table; make migrations idempotent; add `sessions` table migration.
3. **§2.2** — move `event(...)` to `DB::afterCommit(...)` in `ApprovalService`; fix broadcast transport.
4. **§3.1–3.4** — fix `work-schedules` queryFn; add `Array.isArray` to every API-sourced queryFn + every
   `data?.data || []`/`res.data || []` site; guard the 3 selects.
5. **§3.5** — `skipHydration` + mount-gate for the two persisted stores.
6. **§4.1 / §4.2** — RBAC deny-list + HR cap; theme dropdown items.
7. **§5** — smoke test, migrate:status gate, secret purge.
8. **Deploy both** (backend → Cloud Run, frontend → Vercel).

### 6.2 PROOF PROTOCOL — run every line before calling it done

**Backend (terminal, no browser):**
```bash
BASE=https://g4k-api-579515345084.asia-south1.run.app
# 1. Unauthenticated MUST be 401 now (was 500):
curl -s -o /dev/null -w "no-auth notifications: %{http_code}\n" $BASE/api/notifications     # 401
curl -s -o /dev/null -w "no-auth dashboard:  %{http_code}\n" $BASE/api/dashboard/init       # 401
# 2. Authenticated MUST be 200 (use a fresh token from logging in):
TOK="<real token>"
for ep in dashboard/init directory projects notifications attendance/me/today auth/preferences; do
  printf "%-26s " "$ep:"; curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOK" -H "Accept: application/json" $BASE/api/$ep
done   # all 200
# 3. Migrations fully applied:
php artisan migrate:status | grep -c Pending   # 0
```
**Cloud Logging (24h after deploy) — must be ZERO hits:**
- `jsonPayload.message~"RouteNotFoundException"` (§1)
- `jsonPayload.message~"SQLSTATE\\[(42701|42703|42P01)\\]"` (§2.1)
- `jsonPayload.message~"cURL error 60"` (§2.2)
- `jsonPayload.message~"incomplete object"` (§2.3, should already be gone)

**Frontend (browser, clean incognito profile = no extensions):**
1. `pnpm --filter web build` → **zero** errors/warnings.
2. Log in as Admin, HR, Employee. For each:
   - Dashboard renders within ~2s with real data — **no `ErrorBoundary caught an error in Widget`**.
   - Browser console is **empty** (no `#418`, no `…is not a function`, no `reading 'length'`).
   - Admin sees **no** clock-in UI and gets **403** from the clock API; HR can clock in/out.
   - Avatar dropdown → Theme → Light/Dark/System all apply + the active one is checkmarked.
3. Hard-refresh once (clear stale cache) — errors must not reappear.

**If any line of §6.2 fails, it is NOT done.** The reason rounds 1–3 recurred is that this level of proof was
never run against the deployed artifact.

---

## Definition of done

1. **§6.2 passes in full** for all three roles on the live URL.
2. Cloud Logging shows zero `RouteNotFoundException`, zero `SQLSTATE`, zero `cURL error 60` over 24h.
3. No frontend console errors in a clean profile; no `ErrorBoundary` on any widget.
4. Admin has no clock-in; HR can clock in; theme switchable from the dropdown.
5. Secrets rotated; committed `.env` purged; `cloudbuild.yaml` runs an authenticated smoke test.

> **The one-sentence summary:** the dashboard isn't loading because (a) the backend returns **500 for
> unauthenticated requests** (`redirectGuestsTo(route('login'))` + no `login` route — fix in §1, one line) and
> **500 for authenticated requests** (schema drift + broadcast-in-transaction — §2), and (b) the frontend
> **crashes on any non-array API payload** because the queryFns/scalar-selects are unguarded (§3). Fix all three,
> run §6.2, deploy — done.
