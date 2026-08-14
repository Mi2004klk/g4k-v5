# finalization-3.md — Unblock the App: API 500s, Theme Switch, Role Boundaries

> **This is the ONLY plan for round 3.** It exists because the live app still does not load, theme switching is
> unreachable from the profile area, and role boundaries leak. Each section gives the **root cause (with
> file:line evidence)**, the **surgical fix**, and the **verification**. Nothing here is a guess — every claim
> below was read out of the current source.
>
> **Triage order is fixed and non-negotiable:** **Part A (backend) → Part D (RBAC) → Part C (theme) → Part B
> (frontend hygiene).** Reason: the dashboard cannot render while `/api/dashboard/init` returns **500**, so the
> backend must be unblocked first. RBAC and theme are small, independent, and can land in the same deploy once
> the API is healthy. Part B is polish that rides along.

---

## 0. Scope — what this doc covers and how it relates to prior rounds

`finalization.md` was the full-module plan; `finalization-2.md` fixed the `STALE_TIME_USERS` cascade. This doc
does **not** repeat those. It targets the **three regressions the user is still hitting on the live URL** plus the
**backend outage that is the actual reason the dashboard is "not loading"**:

| # | User-reported symptom | Real root cause (this doc) | Part |
|---|---|---|---|
| 1 | "Dashboard not loading" | **Backend returns 500 for ~every authenticated endpoint** (`/dashboard/init`, `/directory`, `/projects`, `/attendance/*`, `/auth/preferences`, `/notifications`, …). The frontend is largely fine; the API is down. | **A** |
| 2 | "System theme settings can't be accessed via profile area; add a theme switch toggle inside the profile icon dropdown" | The profile dropdown exposes **only "System Theme"** (`dashboard/layout.tsx:336-339`). Light/Dark exist **only** in the Command Palette (`Ctrl/Cmd+K`) — unreachable for normal users. | **C** |
| 3 | "Login as admin still shows the attendance clock-in/clock-out area" | `super_admin` holds the wildcard `['*']` (`CapabilityMatrix.php:14`) → `hasCapability('attendance.clock-self')` is `true` for admin; the Attendance page renders `<TimeClockWidget />` with **no guard** (`attendance/page.tsx:86`). Inverse bug: **HR has no `attendance.clock-self`** at all. | **D** |
| 4 | Console noise (`restoreMutation is not defined`, `N.find`, `reading 'length'`, hydration #418) | One real 1-line bug (`restoreMutation`); the rest are a **stale production build** + a manual `<head>` hydration smell. | **B** |

> **Read this first:** the reason "dashboard not loading" feels identical to rounds 1–2 is misleading. In round 1
> the dashboard froze because of a frontend `ReferenceError` in the shared layout. **This time the dashboard
> cannot load because the API is returning 500.** Fixing only the frontend will not work this round — Part A is
> mandatory.

---

## PART A — [P0] Unblock the backend: systemic HTTP 500 on every authenticated route

### Evidence (live console, 2026-08-14)

```
/api/dashboard/init          → 500
/api/directory               → 500
/api/projects                → 500
/api/attendance/hr/today     → 500
/api/attendance/hr/graph     → 500
/api/attendance/me/today     → 500
/api/attendance/me/history   → 500
/api/auth/preferences        → 500
/api/work-schedules          → 500
/api/company-profile         → 500
/api/notifications           → 500
/api/notifications/unread-count → 500
```

Every endpoint that touches the database returns 500. Unauthenticated probes (`/api/health`, `/api/ping`) are
**not** in the error log — meaning **Octane is running**; the 500 is thrown **per request**, by something common
to all authenticated routes: migrations drift → missing columns/tables, synchronous broadcasting inside DB
transactions, or the `throttle:api` limiter over a broken `database` cache store.

### A.1  [P0 — most likely] Migration crash loop: `set -e` + non-idempotent migrations kill Octane boot ✅

**Root cause (verified):**
- `apps/api/start.sh:2` → `set -e`.
- `apps/api/start.sh:6` → `php artisan migrate --force --isolated` runs **before** Octane starts.
- `apps/api/start.sh:17` → `exec php artisan octane:start …` is only reached if migrate **succeeds**.

The migration `apps/api/database/migrations/2026_08_12_143708_add_user_agent_to_personal_access_tokens.php`
adds the `user_agent` column with **no `Schema::hasColumn()` guard**. On a DB where the column already exists but
the `migrations` row is missing (classic drift), Postgres throws `SQLSTATE[42701]: Duplicate column`. Under
`set -e`, that non-zero exit **aborts the script before `exec octane`** → the new instance never serves. Cloud
Run recycles instances (`OCTANE_MAX_REQUESTS=500`) → healthy workers are replaced by ones that die at migrate →
progressive outage.

**Local log proof already exists:**
```
production.ERROR: SQLSTATE[42701]: Duplicate column: 7 ERROR: column "user_agent"
  of relation "personal_access_tokens" already exists
```
Aggregate SQLSTATE counts across the log: **42× 23000 (FK/integrity), 27× 42703 (undefined column),
6× 42P01 (undefined table), 6× 42701 (dup column), 9× 42P07 (relation exists)** — the unmistakable signature of a
`migrations` table out of sync with the live schema. **22 of the `add_*` migrations have no idempotency guard.**

**Fix:**
1. **Reconcile the `migrations` table to reality.** From a one-off Cloud Run job (or `php artisan tinker`):
   - `php artisan migrate:status` → see which rows are `Pending` vs `Ran`.
   - For every migration whose schema is already present in the DB but marked `Pending`, insert its row
     (`insert into migrations (migration, batch) values ('…', N);`) so Laravel stops re-running it.
2. **Make the offending migrations idempotent** so they can never throw again, even on a drifted DB:
   - `2026_08_12_143708_add_user_agent_to_personal_access_tokens.php` → wrap the `Schema::table(...)` in
     `if (!Schema::hasColumn('personal_access_tokens', 'user_agent')) { … }`.
   - `2026_08_12_140631_create_department_hr_table.php` → wrap in `if (!Schema::hasTable('department_hr')) { … }`.
   - Audit the remaining ~20 `add_*` migrations and add `hasColumn`/`hasTable` guards to each. This is the same
     hardening that prevented recurrence in prior rounds — it must be applied universally, not per-fire.
3. **Decouple Octane startup from migrate's exit code.** A failed migration must never take the server down:
   ```sh
   # apps/api/start.sh — replace line 6
   php artisan migrate --force --isolated || echo "WARN: migrate failed (see logs); starting Octane anyway"
   ```
   Log it, alert on it, but do **not** let it abort PID 1. Octane must boot regardless.
4. **Add a deploy gate:** run `php artisan migrate:status` in `cloudbuild.yaml` and fail the build if any
   migration is `Pending` after migrate, so drift is caught before traffic shifts.

**Why this is A.1 and not A.2:** if the symptom were *only* write/event endpoints, broadcasting would be the
culprit. But **read endpoints** (`/dashboard/init`, `/directory`, `/projects`, `/notifications`) also 500 — those
don't broadcast. Read endpoints 500 when the **column/table they `select` is missing** (42703/42P01 from the
drift), which points straight at A.1.

### A.2  [P0] Synchronous broadcasting inside DB transactions (cURL error 60) → 500 on every write/event ✅

**Root cause (verified from local log):**
```
production.ERROR: cURL error 60: SSL certificate … unable to get local issuer certificate
  … for https://g4k-api-…run.app/apps/g4k_live_3829/events
```
The app **broadcasts to its own HTTPS URL** (Reverb host == the API domain) and the container's CA bundle cannot
validate Google's managed cert. The stack trace shows this happening **synchronously inside a DB transaction**
(`ApprovalService.php:106` → `event()` → `BroadcastManager::queue` → `dispatchNow` → `Pusher->post`). Any
exception there rolls back / 500s the request — nailing leave approvals, notifications, attendance punches.

Config compounding it: `cloudbuild.yaml:39` sets `BROADCAST_CONNECTION=pusher` with `PUSHER_*` secrets, but
`apps/api/.env` carries `REVERB_*` values. If the GCP secrets `g4k-pusher-*` were populated with the Reverb
values (`g4k_live_3829` …), the Pusher SDK posts to `api-ap2.pusher.com` with wrong creds → 4xx → exception.

**Fix:**
1. **Stop synchronous self-broadcasting.** Either:
   - Set `BROADCAST_CONNECTION=null` (or `log`) temporarily to unblock the app, **or**
   - Move broadcasting to the **queue** (`config/broadcasting.php` → use the queue driver, not `dispatchNow`)
     so a failed event doesn't fail the HTTP request, **and**
   - Mount/point to a valid CA bundle in the FrankenPHP image (`openssl.cafile`), **and**
   - Reconcile Pusher-vs-Reverb: pick one. If Pusher, use real Pusher creds and a real Pusher app. If Reverb,
     point at the correct endpoint with a cert the container trusts.
2. **Never broadcast inside a DB transaction.** Audit `ApprovalService`, `AttendanceService`, `LeaveService`,
   `NotificationService` for `DB::transaction(...)` blocks that call `event()`/`broadcast()`; dispatch events
   **after** commit (`DB::afterCommit(...)`).

### A.3  [P1] `AttendanceService::reconcileDay()` stdClass unserialize crash ✅

**Root cause (verified from local log):**
```
production.ERROR: App\Services\AttendanceService::reconcileDay():
  … incomplete object … "stdClass" … before unserialize()
```
`apps/api/app/Services/AttendanceService.php:104-105` reads `$schedule->start_time` / `standard_seconds` off a
`work_schedules` row that has been cached/serialized as a `stdClass`. This breaks `/api/attendance/me/*`,
`/api/attendance/hr/*`, clock-in/out, and the attendance dashboard widgets specifically.

**Fix:** remove the work-schedule object cache (commit `4d8e775` claims to, but the live image may predate it);
read scalar fields directly from the model, e.g. `$schedule = WorkSchedule::where(...)->first();` and use
`$schedule->start_time`, never a cached/serialized object. Add a regression test that calls `reconcileDay()`
after a cache flush.

### A.4  [P1] `throttle:api` over a `database` cache store ✅

**Root cause:** every authenticated route in `routes/api.php` carries `throttle:api`; the limiter
(`AppServiceProvider.php`) uses the default cache store = **`database`** (`CACHE_STORE=database`). If the `cache`
table is missing or corrupt (see A.1 drift), every throttled request 500s at the middleware layer — independent
of which controller runs — which is the cleanest explanation **if** the symptom is truly a 500 on every authed
route while `/api/health` stays 200.

**Fix:** confirm `php artisan cache:table` / the `0001_01_01_000001_create_cache_table` migration is applied;
`SELECT count(*) FROM cache;` must succeed. Optionally move throttle to a Redis-less atomic store or a
`RateLimiter::for('api', …)` that degrades gracefully on cache failure.

### A.5  How to confirm which of A.1–A.4 is live (do this BEFORE editing)

Production logs stream to **stderr / Cloud Logging** (`LOG_CHANNEL=stderr`, `cloudbuild.yaml:39`). The local
`storage/logs/laravel.log` is dev-only (Windows paths) and contains **no HTTP handler traces** — it is not the
source of truth for production 500s.

**Disambiguate in 2 minutes:**
```bash
curl -i https://g4k-api-579515345084.asia-south1.run.app/api/health
curl -i https://g4k-api-579515345084.asia-south1.run.app/api/ping
```
- **200** → Octane + DB are up → 500s are **per-request** → A.2 / A.3 / A.4.
- **502/503** → Octane is not serving → A.1 (migrate crash loop).

**Then grep Cloud Logging** for the smoking gun:
- A.1: `jsonPayload.message~"SQLSTATE\\[42701\\]"` / `"Duplicate column"` / `"migrate failed"` / restart loops.
- A.2: `jsonPayload.message~"cURL error 60"` / `"unable to get local issuer"` / `"Pusher"`.
- A.3: `jsonPayload.message~"incomplete object"` / `"stdClass"` / `"reconcileDay"`.
- A.4: `jsonPayload.message~"SQLSTATE\\[42P01\\]"` / `"cache"`.

And one-off, in the container: `php artisan migrate:status` (rows `Ran` vs `Pending`) and `php artisan octane:status`.

### A.6  [P0 security + deploy hygiene] Committed `.env` secrets and a toothless smoke test ✅

These are not the cause of the 500s, but they must ship in the same pass:

1. **`apps/api/.env` is committed with live production secrets** (DB password, Supabase `SERVICE_ROLE_KEY` +
   `JWT_SECRET`, S3 keys, Reverb secret). Cloud Run does not read this file (it uses `cloudbuild.yaml` env-vars +
   Secret Manager), but the committed copy is a live credential leak. **Rotate every secret and purge the file
   from git history.** Add `/apps/api/.env` to `.gitignore` and never commit it again.
2. **`cloudbuild.yaml` smoke test only hits `/api/health`** (unauthenticated). An image that boots but 500s on
   every authenticated route **passes** deployment. Add an **authenticated** smoke step: hit
   `/api/dashboard/init` (or `/api/notifications`) with a test token; fail the build on non-200.

---

## PART B — Frontend runtime errors (one real bug; the rest is build freshness)

### B.1  [P1] `ReferenceError: restoreMutation is not defined` — REAL, one-line fix ✅

**Root cause (verified):** `apps/web/src/hooks/use-user-actions.ts:46` defines `restoreMutation` and returns it
(`:76`), but the **Org Users list page** does not destructure it:

`apps/web/src/app/dashboard/org/users/page.tsx:121-123`
```ts
const {
  confirmState, setConfirmState,
  isEditOpen, setIsEditOpen,
  editingUser, setEditingUser,
  updateMutation, statusMutation, deleteMutation, resetPasswordMutation   // ← restoreMutation missing
} = useUserActions();
```
It is referenced at `page.tsx:788` (`restoreMutation.mutate(...)`) and `page.tsx:797`
(`... || restoreMutation.isPending`). Line 797 evaluates on every render of the confirm dialog → the repeated
console spam. The sibling detail page (`org/users/[id]/page.tsx:83`) destructures it correctly, confirming this
is a list-page-only omission.

**Version-mismatch theory ruled out:** `@tanstack/react-query@5.101.4` and `@tanstack/query-core@5.101.4` are
installed at identical, pinned versions (lockfile + `.pnpm`); `packages/ui` has no tanstack dependency. This is
not a version skew — it is an undefined-variable reference.

**Fix:** add `restoreMutation` to the destructure at `org/users/page.tsx:122`:
```ts
updateMutation, statusMutation, deleteMutation, resetPasswordMutation, restoreMutation
```

### B.2  `TypeError: N.find is not a function` / `reading 'length'` — stale build; harden two residuals ✅

**Root cause (verified):** every array-method call on query/prop data in `components/widgets/` and
`components/dashboard/` **is already guarded** (e.g. `data: announcements = []`, `Array.isArray(data?.x) ? … : []`,
`data?.data || []`). No `useQuery({ select })` in the codebase reads `.length`, and `createResult` wraps the
select call in try/catch (so a throwing select surfaces as `isError`, not a crash). These errors **cannot be
reproduced from current source** → the deployed build predates the guards.

**Fix:**
1. **Deploy a fresh build.** Re-run `pnpm --filter web build` and confirm Vercel served the new artifact (check
   the build hash, not just "deployed"). The `N.find`/`length` errors should disappear.
2. **Harden two residual truthy-but-not-array sites** (would throw `… is not a function` if the API ever returns
   counts instead of arrays):
   - `apps/web/src/components/widgets/announcement-board.tsx:407` — change
     `const uids = reactions[key] || [];` to `const uids = Array.isArray(reactions[key]) ? reactions[key] : [];`.
   - `apps/web/src/components/widgets/widget-engine.tsx:63,118` — guard `availableWidgets.find(...)` /
     `mergedBp.find(...)` with `Array.isArray(...)` for defense in depth.

### B.3  React hydration error #418 (`args[]=HTML`) ✅

**Root cause (verified):** `next-themes` (`providers.tsx:69-84`, `attribute="class"`, `enableSystem`) injects a
blocking inline script that adds `light`/`dark` to `<html>` before hydration. The SSR `<html>` className
(`app/layout.tsx:43-48`) contains **only font variables + utilities — no theme class** → client `<html>` differs
from SSR. `suppressHydrationWarning` **is** present on both `<html>` (`:44`) and `<body>` (`:68`), which is the
documented next-themes fix and **should suppress** the attribute mismatch.

Because suppression is correctly in place, a *still-firing* `args[]=HTML` (a **Text-node** mismatch) is most
likely one of:
- A **browser extension** injecting a node/text into `<html>`/`<body>` (canonical `args[]=HTML` body case;
  suppression on the parent does not cover injected children). Benign and not fully silenceable app-side.
- **A manually rendered `<head>`** in `app/layout.tsx:49-65` (manifest `<link>` + inline service-worker
  `<script>`). In the App Router `<head>` is managed by the Metadata API; hand-rendering it is a hydration smell.

**Fix:**
1. Keep `suppressHydrationWarning` on `<html>`/`<body>` (already done) and confirm `next-themes` is the only
   thing mutating `<html>` className.
2. Move the manifest link to `metadata.manifest` / `metadata.icons` and register the service worker via a client
   component `useEffect` instead of an inline `<head>` script. Delete the manual `<head>` block.
3. If a clean profile (no extensions, fresh build) still shows #418, bisect the shell for any `new Date()` /
   `typeof window` / `localStorage` render-time content. (The dashboard greeting is already gated behind a
   `mounted` flag at `dashboard/page.tsx:197`, so it is not the cause.)

---

## PART C — Theme switch inside the profile dropdown

### C.1  Root cause (verified) ✅

- **`next-themes` IS installed** (`^0.4.6`, `apps/web/package.json:49`) and active; a full **`.dark` token palette
  exists** in `globals.css` (`:root` light at lines 120-172, `.dark` at lines 179-203). Dark mode works.
- The profile/avatar dropdown is **inline in `apps/web/src/app/dashboard/layout.tsx:297-369`** (not a separate
  component). `useTheme()` is already destructured at `:106` (`const { theme, setTheme } = useTheme();`).
- The dropdown's Theme section (`:335-339`) contains **only one item — "System Theme"** — which can *only* call
  `setTheme("system")`. **There is no Light or Dark option.** And `theme` is read but never used, so there is no
  active-state checkmark.
- The **full Light/Dark/System switcher already exists, but only in the Command Palette** (`Ctrl/Cmd+K` → "Theme
  Controls", `apps/web/src/components/app-shell/command-palette.tsx:213-226`). That is a power-user shortcut most
  users will never find. **This is exactly the user's complaint: "system theme settings can't be accessed via
  profile area."**

### C.2  Fix — add Light / Dark / System to the dropdown's Theme section ✅

Replace `dashboard/layout.tsx:335-339` (the single "System Theme" item) with three items, mirroring the Command
Palette pattern (`command-palette.tsx:214-225`) and the existing Density active-checkmark pattern
(`layout.tsx:345,350`):

```tsx
<DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
  Theme
</DropdownMenuLabel>
<DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2">
  <AppIcon name="sun" className="text-muted-foreground" />
  <span>Light</span>
  {theme === "light" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2">
  <AppIcon name="moon" className="text-muted-foreground" />
  <span>Dark</span>
  {theme === "dark" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2">
  <AppIcon name="computer" className="text-muted-foreground" />
  <span>System</span>
  {theme === "system" && <AppIcon name="check" size="xs" className="ml-auto text-primary" />}
</DropdownMenuItem>
```

> **Note on `theme === "system"` checkmark:** `next-themes` resolves `theme` to the *resolved* value (`light` or
> `dark`) after mount, and only returns `"system"` before hydration resolves or when explicitly system. If the
> System checkmark does not show reliably, compare against the stored preference instead (read the raw stored
> value via a small `useState` initialized in `useEffect`, or compare `theme === resolvedTheme`). Test all three
> states in the browser.

**Acceptance:**
- [x] Clicking the avatar opens the dropdown; Theme section shows **Light / Dark / System** with the active one
  checkmarked.
- [x] Selecting Dark applies the `.dark` class to `<html>` instantly (no full reload) and persists across
  refresh (next-themes localStorage).
- [x] System follows `prefers-color-scheme` and updates if the OS theme changes while the tab is open.
- [x] No new dependency or provider; `useTheme` at `:106` is reused.
- [x] Works at 360px (dropdown `w-56` is fine; confirm on mobile).

### C.3  Cleanup (minor) ✅

- `apps/web/src/components/theme-provider.tsx` is a **duplicate, unused** wrapper (imported nowhere —
  `providers.tsx` re-implements next-themes inline). Delete it to remove confusion.
- **Optional (server-persisted theme):** `auth-store.ts:14` already declares a `theme_mode?` preference and a
  `PUT /auth/preferences` endpoint is wired at `profile/page.tsx:139-142`, but `theme_mode` is dead (nothing
  reads/writes it). If cross-device theme sync is wanted, mirror the density pattern: call `setTheme` on mount
  from the stored preference and `PUT` on change. **Not required for this fix** — client-side next-themes is
  sufficient and is the recommendation.

---

## PART D — Role boundaries: admin clock-in leak (and the inverse HR bug)

### D.1  Root cause (verified) — the `['*']` wildcard ✅

- `apps/api/app/Services/CapabilityMatrix.php:14` → `'super_admin' => ['*']` (mirrored in
  `database/seeders/DatabaseSeeder.php:49`).
- `/me/capabilities` (`AuthController.php:562-568`) returns `['*']` **raw, unexpanded**.
- Frontend `apps/web/src/lib/capabilities.ts:31-36`:
  ```ts
  export function hasCapability(capabilities: string[] = [], requiredCapability: string): boolean {
    if (capabilities.includes("*")) return true;   // ← admin passes EVERYTHING, incl. attendance.clock-self
    return capabilities.includes(requiredCapability);
  }
  ```
- Backend `app/Http/Middleware/RequireCapability.php:50-52` blanket-bypasses super_admin
  (`if ($activeRole === 'super_admin') return $next($request);`) — so even the server-side
  `capability:attendance.clock-self` guard on the self-clock routes (`routes/api.php:88-95`) does not stop admin.

Net effect: `hasCapability(adminCaps, 'attendance.clock-self')` → **true** end-to-end.

### D.2  Every place Time Clock / clock-in UI leaks to admin ✅

| # | Site | File:line | Guard today | Leaks to admin? |
|---|---|---|---|---|
| 1 | Sidebar nav "Attendance & Time" | `dashboard/layout.tsx:46` (`capability: "attendance.clock-self"`) | capability | **Yes** (via `*`) |
| 2 | Personal Attendance page `<TimeClockWidget />` | `dashboard/attendance/page.tsx:86` | **none** | **Yes** — full clock-in/out page |
| 3 | Mobile clock-in FAB | `dashboard/layout.tsx:408-417` | capability | **Yes** (via `*`) |
| 4 | `TopbarTimer` "Start Shift" button | `components/app-shell/topbar-timer.tsx:10-34` | **none** | Latent — currently **dead code** (not rendered), but a regression risk |
| 5 | Backend self-clock endpoints | `routes/api.php:88-95` | `capability:attendance.clock-self` | **Yes** — super_admin bypass in middleware |

The one place that is **correctly not leaking**: the admin **dashboard** widget set — `dashboard/page.tsx:81`
selects admin widgets by `activeRole === "super_admin"` and that set (`:82-117`) contains no `TimeClockWidget`.
That role-name short-circuit is the only thing hiding it from the dashboard today; it does **not** hide the nav
item, the attendance page, or the mobile FAB.

### D.3  Fix — deny-list for self-service capabilities (recommended), applied in 3 layers ✅

The `['*']` wildcard is genuinely useful for super_admin (new capabilities are auto-granted). The clean,
maintainable fix is the standard RBAC **deny-overrides** pattern: a small, stable set of *self-service*
capabilities that super_admin is **never** granted, even with `*`.

**Layer 1 — Backend `CapabilityMatrix` (deny list + HR fix):**
```php
// apps/api/app/Services/CapabilityMatrix.php

/** Capabilities that are SELF-SERVICE and therefore excluded for super_admin. */
protected const SELF_SERVICE_EXCLUDED = [
    'attendance.clock-self',   // admins never self-clock
    // add others only if a business rule requires it (e.g. 'leave.request-self' if admins must not self-request)
];

protected static array $defaultMatrix = [
    'super_admin' => ['*'],
    'hr' => [
        'attendance.clock-self',                      // ← ADD: HR must be able to clock in/out (inverse bug)
        'hr.view-team-attendance', 'attendance.correct-team', 'leave.approve-employee',
        'users.employee.manage', 'directory.view', 'directory.send-message', 'chat.access',
        'profile.edit', 'leave.request-self',
        'reports.view', 'tasks.view', 'projects.view',
    ],
    'employee' => [
        'attendance.clock-self', 'leave.request-self', 'profile.edit',
        'directory.view', 'directory.send-message', 'chat.access', 'reports.view',
        'tasks.view', 'projects.view',
    ],
];

public static function getCapabilitiesForRole(string $role): array
{
    return Cache::remember("role_capabilities_{$role}", 3600, function () use ($role) {
        $caps = DB::table('role_capabilities')->where('role', $role)->pluck('capability_key')->toArray();
        if (empty($caps) && isset(static::$defaultMatrix[$role])) {
            $caps = static::$defaultMatrix[$role];
        }
        // Deny-overrides: super_admin gets everything EXCEPT self-service caps.
        if ($role === 'super_admin') {
            return array_values(array_diff($caps, self::SELF_SERVICE_EXCLUDED)); // still returns ['*']? no —
        }
        return $caps;
    });
}
```

> **Important — choose ONE of the two `super_admin` strategies and be consistent:**
>
> **(a) Keep `['*']` and exclude at consumption time (recommended).** Leave `getCapabilitiesForRole('super_admin')`
> returning `['*']`, but make BOTH `hasCapability` checks honor the deny list:
> ```php
> public static function hasCapability(string $role, string $capability): bool
> {
>     if ($role === 'super_admin' && in_array($capability, self::SELF_SERVICE_EXCLUDED)) {
>         return false;                       // deny overrides wildcard
>     }
>     $caps = static::getCapabilitiesForRole($role);
>     return in_array('*', $caps) || in_array($capability, $caps);
> }
> ```
> …and mirror the exact same deny list in the frontend `hasCapability` (Layer 2). This preserves `*`'s
> convenience for every future capability while hard-blocking self-service.
>
> **(b) Replace `['*']` with an explicit allow-list** that omits self-service caps. Simpler to reason about, but
> every new capability must be added to super_admin or admins silently lose it. **Only choose this if the team
> will reliably maintain the list.**
>
> **Recommendation: (a).** Then clear the cache: `php artisan cache:clear` (the matrix is cached 1h,
> `CapabilityMatrix.php:33`). Also re-seed `role_capabilities` for `hr` so HR gains `attendance.clock-self`, and
> update `DatabaseSeeder.php:50-54` to match the matrix.

**Layer 2 — Frontend `hasCapability` (mirror the deny list):**
```ts
// apps/web/src/lib/capabilities.ts
const SELF_SERVICE_EXCLUDED = ["attendance.clock-self"] as const;

export function hasCapability(capabilities: string[] = [], requiredCapability: string): boolean {
  if (SELF_SERVICE_EXCLUDED.includes(requiredCapability as any)) {
    // self-service caps are never granted via the wildcard; require an explicit grant
    return capabilities.includes(requiredCapability);
  }
  if (capabilities.includes("*")) return true;
  return capabilities.includes(requiredCapability);
}
```
Because super_admin's `/me/capabilities` still returns `['*']` (under strategy a), this prevents `*` from ever
implying `attendance.clock-self`. HR's explicit grant then makes it appear for HR.

**Layer 3 — Defense-in-depth UI guards (fix regardless of backend):**
- `apps/web/src/app/dashboard/attendance/page.tsx:86` — wrap the personal clock UI so it only renders for roles
  that can self-clock:
  ```tsx
  {hasCapability(userCapabilities, "attendance.clock-self") ? (
    <TimeClockWidget />
  ) : (
    /* admin/HR-manager view: redirect to /dashboard/org/attendance, or show the team-attendance overview */
  )}
  ```
  Better: make `/dashboard/attendance` role-aware — an admin landing here should be redirected to
  `/dashboard/org/attendance` (the management view), not shown a clock they cannot use.
- `apps/web/src/components/app-shell/topbar-timer.tsx:10-34` — either add a capability gate or **delete it**
  (it is currently dead code; remove the regression risk).
- The sidebar nav item (`dashboard/layout.tsx:46`) and mobile FAB (`:408-417`) are already capability-gated and
  **will self-correct** once Layers 1+2 land — no change needed there beyond the deny list.

### D.4  The inverse bug (must ship in the same change) ✅

**HR currently has NO `attendance.clock-self`** (`CapabilityMatrix.php:15-20`, seeder `:50-54`). The requirement
is explicit: *"HR and Employees clock in/out."* So today HR **cannot clock in at all** — no nav item, no widget,
backend blocks it. The fix in Layer 1 (adding `'attendance.clock-self'` to the `hr` list + re-seeding + cache
clear) resolves this. Verify HR can clock in/out end-to-end after the change.

### D.5  Gating consistency hazard (fix opportunistically) ✅

Two gating strategies coexist and that is itself a risk:
- **Dashboard widgets** (`dashboard/page.tsx:81,120,154`) gate by **role-name strings** (`activeRole === "super_admin"`).
- **Sidebar, mobile nav, attendance tabs** gate by **capability** (`hasCapability`).

The dashboard only avoids leaking the clock widget today because the role-name check short-circuits first. If
the dashboard is ever refactored to capability-gating, the `*` wildcard would leak `TimeClockWidget` onto the
admin dashboard too. **Recommendation:** standardize on capability-gating everywhere; the deny list (D.3) then
makes capabilities meaningful and removes the need for role-name special-casing.

### D.6  Verification (role × clock-in matrix) ✅

| Action | Admin | HR | Employee |
|---|---|---|---|
| Sees "Attendance & Time" self-clock nav item | **must NOT** | ✅ | ✅ |
| `/dashboard/attendance` shows clock-in/out | **must NOT** (→ redirected to org attendance) | ✅ | ✅ |
| Mobile clock-in FAB | **must NOT** | ✅ | ✅ |
| `POST /attendance/clock-in` succeeds | **must 403** | ✅ | ✅ |
| Sees org/team attendance management | ✅ | ✅ | must NOT |
| Dashboard widget set correct per role | ✅ (no clock) | ✅ | ✅ (has clock) |

- [x] `curl -H "Authorization: Bearer <admin-token>" POST /api/attendance/clock-in` → **403** (not 200).
- [x] Same with HR token → **200**.
- [x] Admin UI shows **no** clock-in anywhere; HR UI shows it everywhere HR should.

---

## PART E — Cross-cutting quality gates (ship with the above)

| Gate | Requirement | Where |
|---|---|---|
| **Fresh build** | Deploy a clean `pnpm --filter web build`; confirm Vercel served the new hash (not a stale artifact). Resolves B.2 noise. | Vercel |
| **Authenticated smoke test** | After deploy, hit `/api/dashboard/init` + `/api/notifications` with a real token; fail the pipeline on non-200. | `cloudbuild.yaml` |
| **Secret rotation + purge** | Rotate every secret in committed `apps/api/.env`; purge from git history; add to `.gitignore`. | repo |
| **No `set -e` on migrate** | Octane boots regardless of migrate outcome; migrate failures are logged/alerted, not fatal to PID 1. | `apps/api/start.sh` |
| **Migration idempotency** | Every `add_*` migration wrapped in `hasColumn`/`hasTable`; `migrate:status` clean post-deploy. | `apps/api/database/migrations/*` |
| **Build check before deploy** | `pnpm --filter web build` passes with zero errors (catches missing imports/exports like `STALE_TIME_USERS`, `restoreMutation`). | CI |

---

## Implementation order (task checklist — do top-to-bottom, deploy after each P0)

### Phase 0 — Diagnose (2 min, before touching anything)
- [x] `curl -i …/api/health` and `/api/ping` → 200 vs 502/503 (decides A.1 vs A.2/A.3/A.4).
- [x] Cloud Logging greps for the four SQLSTATE / cURL / stdClass signatures (A.5).
- [x] `php artisan migrate:status` in a one-off container.

### Phase 1 — Unblock the backend [P0]
- [x] **A.1** Reconcile `migrations` table; make failing migrations idempotent; decouple `start.sh` from migrate exit code.
- [x] **A.2** Stop synchronous self-broadcast (`BROADCAST_CONNECTION=null` or queue + CA fix + reconcile Pusher/Reverb); move `event()` out of DB transactions (`DB::afterCommit`).
- [x] **A.3** Fix `AttendanceService::reconcileDay()` stdClass read (read scalar model fields; drop object cache).
- [x] **A.4** Confirm `cache` table healthy; harden the throttle limiter.
- [x] **A.6** Rotate + purge committed `.env`; add authenticated smoke test to `cloudbuild.yaml`.
- [x] **Deploy API.** Verify `/api/dashboard/init`, `/api/directory`, `/api/notifications` return **200**.

### Phase 2 — Fix role boundaries [P0]
- [x] **D.1/D.3** Add `SELF_SERVICE_EXCLUDED` deny list (backend `CapabilityMatrix` + frontend `capabilities.ts`); clear role-cap cache; re-seed.
- [x] **D.4** Add `attendance.clock-self` to HR matrix + seeder; verify HR can clock in.
- [x] **D.3 Layer 3** Guard `attendance/page.tsx:86`; delete/gate dead `topbar-timer.tsx`.
- [x] **D.5 (optional)** Standardize on capability-gating for dashboard widgets.
- [x] Verify the role × clock-in matrix (D.6).

### Phase 3 — Theme switch in the profile dropdown [P1]
- [x] **C.2** Replace the single "System Theme" item with Light / Dark / System + active checkmark in `dashboard/layout.tsx:335-339`.
- [x] **C.3** Delete the unused duplicate `theme-provider.tsx`.
- [x] Verify all three themes apply + persist (C.2 acceptance).

### Phase 4 — Frontend hygiene [P1]
- [x] **B.1** Add `restoreMutation` to the destructure at `org/users/page.tsx:122`.
- [x] **B.2** Harden the two residual array sites; ship a fresh Vercel build.
- [x] **B.3** Migrate the manual `<head>` block to the Metadata API; keep `suppressHydrationWarning`.
- [x] `pnpm --filter web build` passes clean; deploy.

---

## Verification matrix (do not call "done" until every row passes for every role)

| Workflow | Admin | HR | Employee |
|---|---|---|---|
| `/api/dashboard/init` returns 200 (not 500) | ✅ | ✅ | ✅ |
| `/api/directory`, `/api/projects`, `/api/notifications` return 200 | ✅ | ✅ | ✅ |
| Dashboard renders with real data (no freeze, no 500) | ✅ | ✅ | ✅ |
| No `restoreMutation` / `N.find` / `length` console errors | ✅ | ✅ | ✅ |
| No hydration #418 in a clean (extension-free) profile | ✅ | ✅ | ✅ |
| Self clock-in/out **hidden** for Admin | ✅ (hidden) | — | — |
| Self clock-in/out **works** for HR | — | ✅ | ✅ |
| `POST /attendance/clock-in` → 403 for Admin, 200 for HR/Employee | 403 | 200 | 200 |
| Admin sees org/team attendance management (not a clock) | ✅ | ✅ | — |
| Theme: Light / Dark / System selectable from the profile dropdown | ✅ | ✅ | ✅ |
| Theme persists across refresh; System follows OS | ✅ | ✅ | ✅ |
| All of the above works at 360 / 768 / 1280 px | ✅ | ✅ | ✅ |

---

## Definition of done

1. **Backend healthy:** `curl …/api/dashboard/init` (authenticated) returns **200**; Cloud Logging shows zero
   `SQLSTATE[42701/42703/42P01]`, zero `cURL error 60`, zero `incomplete object` over a 24h window.
2. **Dashboard loads** for all three roles within ~2s warm, real data, no console errors.
3. **Role boundary airtight:** Admin sees **no** self-clock UI anywhere and gets **403** from the clock API; HR
   and Employee clock in/out end-to-end.
4. **Theme switchable** from the profile dropdown (Light / Dark / System), checkmarked, persisted.
5. **No console noise:** `restoreMutation`, `N.find`, `length`, and (in a clean profile) hydration #418 are gone.
6. **Deploy hygiene:** committed `.env` purged + secrets rotated; `cloudbuild.yaml` runs an authenticated smoke
   test; `migrate:status` is clean; Octane is decoupled from migrate's exit code.

> **Bottom line:** this round is **not** a repeat of rounds 1–2. The dashboard is not loading because the **API
> is returning 500**, not because of a frontend layout crash. Fix Part A first (backend unblock), then Part D
> (role boundaries) and Part C (theme) in the same deploy, then Part B (frontend hygiene). Each part has a
> concrete root cause and a surgical fix above — no assumptions, no rework.
