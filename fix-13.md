# fix-13.md — Fix Fly.io Crash Loop + CORS Block + Production Deployment

> **The app cannot login.** The Fly.io machine is in an infinite crash loop (`SIGINT` undefined →
> reboot → repeat), AND the CORS config blocks all browser requests from Vercel. This file fixes
> the exact root causes identified from the production Fly.io logs and browser console errors.
>
> After implementing this file, the app will: stop crashing, accept login requests, and be ready
> for day-to-day use on Fly.io + Vercel + Supabase.

---

## ROOT CAUSE ANALYSIS (from production logs)

### Crash 1: `Undefined constant "Laravel\Octane\Commands\Concerns\SIGINT"` — INFINITE RESTART LOOP

**Fly.io logs (exact):**
```
In InteractsWithServers.php line 174:
  Undefined constant "Laravel\Octane\Commands\Concerns\SIGINT"
 INFO Main child exited normally with code: 1
 INFO Starting clean up.
[   30.704440] reboot: Restarting system
machine has reached its max restart count of 10
```

**Root cause:** The `pcntl` PHP extension is NOT installed in the Docker image. Octane's
`InteractsWithServers` trait references the `SIGINT` constant (defined by `pcntl`). Without the
extension, PHP throws "Undefined constant" → fatal error → process exits → Fly.io reboots →
migrations run again (15-20s) → same crash → infinite loop.

**Where:** `apps/api/Dockerfile` — the `install-php-extensions` line installs `posix` but NOT `pcntl`.

**Impact:** The Fly.io machine NEVER stays up. Every request fails. The app is completely down.

### Block 2: CORS — `allowed_origins` is empty — LOGIN BLOCKED

**Browser console (exact):**
```
Access to fetch at 'https://g4k.fly.dev/api/auth/login' from origin
'https://g4k-8g9abkok4-naval-treasure-group.vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root cause:** `apps/api/config/cors.php` has `'allowed_origins' => []` (empty array). It relies on
`allowed_origins_patterns` (regex) instead. But when `config:cache` runs during the Docker build,
the regex patterns may not serialize correctly, OR FrankenPHP handles the OPTIONS preflight before
Laravel's CORS middleware runs. Either way, no `Access-Control-Allow-Origin` header is returned.

**Where:** `apps/api/config/cors.php:24`.

**Impact:** The browser blocks ALL API calls from Vercel to Fly.io. Login, dashboard, everything
fails with a CORS error. The app is completely unusable.

### Issue 3: `config/octane.php` doesn't exist — Octane runs with defaults

**Root cause:** `php artisan octane:install` was supposed to create `config/octane.php`, but it
either wasn't run or the file wasn't committed. Without this config, Octane uses internal defaults
which may not be compatible with the FrankenPHP Alpine image.

### Issue 4: Two Dockerfiles — potential confusion

`fly.toml` points to `dockerfile = "Dockerfile"` (root). But `apps/api/Dockerfile` also exists.
Both are nearly identical. Pick one and delete the other.

### Issue 5: Fly.io region Singapore ↔ Supabase Mumbai

DB latency ~50ms per query. Should be Mumbai (`bom`) for <5ms.

---

## PHASE 1 — Stop the Crash (CRITICAL — do this FIRST)

### 1.1 Add `pcntl` extension to Dockerfile

**Problem:** `pcntl` is required by Octane for signal handling. Without it, `SIGINT` is undefined
and the server crashes on any signal-related operation.

**Fix:**
- [ ] **1.1a** Edit the Dockerfile that `fly.toml` references (root `Dockerfile`). Add `pcntl` to the
  `install-php-extensions` line:
  ```dockerfile
  # BEFORE:
  RUN install-php-extensions pdo pdo_pgsql mbstring bcmath gd redis opcache posix zip @composer

  # AFTER:
  RUN install-php-extensions pdo pdo_pgsql mbstring bcmath gd redis opcache posix pcntl zip @composer
  ```
  Note: `pcntl` is the critical addition. Also add `shmop` and `sysvmsg` which Octane may need.

- [ ] **1.1b** Delete `apps/api/Dockerfile` to avoid confusion. Use the root `Dockerfile` only.
  Update `fly.toml` if needed: `[build] dockerfile = "Dockerfile"`.

- [ ] **1.1c** Redeploy: `flyctl deploy`

**Verification:** `flyctl logs` shows Octane starting and STAYING UP (no `SIGINT` error, no reboot).
`curl https://g4k.fly.dev/api/ping` returns `{"status":"ok"}`.

---

### 1.2 Create `config/octane.php`

**Problem:** Octane's config file doesn't exist. Create it with proper FrankenPHP settings.

**Fix:**
- [ ] **1.2a** Run `php artisan octane:install --server=frankenphp` locally to generate the config,
  then commit `config/octane.php`. OR create it manually:
  ```bash
  cd apps/api && php artisan octane:install --server=frankenphp --force
  ```
- [ ] **1.2b** Verify the file is committed: `git add apps/api/config/octane.php && git commit`.
- [ ] **1.2c** Key settings in `config/octane.php`:
  ```php
  'server' => env('OCTANE_SERVER', 'frankenphp'),
  'frankenphp' => [
      'workers' => 4,
      'max_requests' => 500,
      'contexts' => [],
  ],
  'listeners' => [
      \Laravel\Octane\Events\RequestReceived::class => [
          // Reset state between requests
      ],
  ],
  ```

**Verification:** `flyctl deploy` → Octane starts with config file loaded.

---

### 1.3 Fix `start.sh` — don't run scheduler if Octane crashes

**Problem:** The background scheduler loop (`while true; do php artisan schedule:run; sleep 60; done`)
runs independently. If Octane crashes, the scheduler keeps running, but the machine reboots anyway.
The scheduler dispatching jobs may trigger the SIGINT crash.

**Fix:**
- [ ] **1.3a** Make the background processes exit if the main process dies. Use `wait` or trap:
  ```bash
  #!/bin/sh
  set -e
  cd /var/www/html/apps/api

  php artisan migrate --force

  # Background processes
  (
    while true; do
      php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600 || true
      sleep 2
    done
  ) &
  QUEUE_PID=$!

  (
    while true; do
      php artisan schedule:run || true
      sleep 60
    done
  ) &
  SCHEDULER_PID=$!

  # Self-ping to prevent auto-stop
  (
    sleep 30
    while true; do
      curl -s http://localhost:${PORT:-8080}/api/ping > /dev/null 2>&1 || true
      sleep 300
    done
  ) &

  # Reverb (optional)
  if [ "$BROADCAST_CONNECTION" = "reverb" ] && [ -n "$REVERB_APP_KEY" ]; then
    (
      php artisan reverb:start --host=0.0.0.0 --port=8081 || true
    ) &
  fi

  # Symlink FrankenPHP binary if needed
  if [ ! -f "frankenphp" ] && [ -f "/usr/local/bin/frankenphp" ]; then
    ln -s /usr/local/bin/frankenphp frankenphp
  fi

  # Start Octane (foreground — main process)
  exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=${PORT:-8080} --workers=4 --max-requests=500
  ```
  Note: `|| true` after each background command prevents the `set -e` from killing the script if
  a background job fails. The `exec` ensures Octane is the main process — if it dies, Fly.io
  restarts the machine (and all background processes go with it).

**Verification:** `flyctl logs` shows Octane staying up, queue + scheduler running in background.

---

## PHASE 2 — Fix CORS (CRITICAL — without this, login is blocked)

### 2.1 Add explicit allowed origins to cors.php

**Problem:** `allowed_origins` is empty `[]`. The regex patterns may not work with cached config.

**Fix:**
- [ ] **2.1a** Edit `apps/api/config/cors.php`:
  ```php
  'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

  'allowed_methods' => ['*'],

  'allowed_origins' => [
      env('FRONTEND_URL', 'http://localhost:3000'),
      'https://g4k-8g9abkok4-naval-treasure-group.vercel.app',
      'https://*.vercel.app',  // Wildcard for preview deployments
  ],

  'allowed_origins_patterns' => [],

  'allowed_headers' => ['*'],

  'exposed_headers' => [],

  'max_age' => 86400,  // Cache preflight for 24h

  'supports_credentials' => true,
  ```

- [ ] **2.1b** Set `FRONTEND_URL` on Fly.io:
  ```bash
  flyctl secrets set FRONTEND_URL="https://g4k-8g9abkok4-naval-treasure-group.vercel.app"
  ```

- [ ] **2.1c** **IMPORTANT:** Since `config:cache` runs during the Docker build, `env('FRONTEND_URL')`
  is resolved at BUILD time, not runtime. If `FRONTEND_URL` isn't set during build, it defaults to
  `http://localhost:3000`. To fix this, either:
  - Set `FRONTEND_URL` as a build arg in the Dockerfile, OR
  - Hardcode the Vercel domain in `cors.php` (simpler for single-deployment), OR
  - **Don't cache the CORS config** — add `cors.php` to the `config-excluded` list, OR
  - Use `allowed_origins_patterns` with a regex that matches all Vercel subdomains (the current
    approach, but verify it works after `config:cache`).

  **Recommended:** Hardcode the production Vercel domain + use the wildcard pattern:
  ```php
  'allowed_origins' => [
      'https://g4k-8g9abkok4-naval-treasure-group.vercel.app',
  ],
  'allowed_origins_patterns' => [
      '#^https://.*\.vercel\.app$#i',
      '#^http://localhost:\d+$#',
  ],
  ```

- [ ] **2.1d** **ALSO:** Ensure the CORS middleware is registered GLOBALLY (not just in the API
  group). In `bootstrap/app.php`:
  ```php
  ->withMiddleware(function (Middleware $middleware) {
      $middleware->api(prepend: [
          \Illuminate\Http\Middleware\HandleCors::class,
      ]);
  })
  ```
  OR ensure `\Fruitcake\Cors\HandleCors` (or `\Illuminate\Http\Middleware\HandleCors` in Laravel 11+)
  is in the global middleware stack. In Laravel 11, CORS is handled automatically if `config/cors.php`
  exists.

**Verification:**
```bash
curl -X OPTIONS https://g4k.fly.dev/api/auth/login \
  -H "Origin: https://g4k-8g9abkok4-naval-treasure-group.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -I
```
Response should include:
```
Access-Control-Allow-Origin: https://g4k-8g9abkok4-naval-treasure-group.vercel.app
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type,Authorization
```

---

### 2.2 Set Vercel environment variables for direct API access

**Problem:** Vercel's `NEXT_PUBLIC_API_URL` is `http://127.0.0.1:8000` (localhost). The frontend
needs to call Fly.io directly.

**Fix:**
- [ ] **2.2a** On Vercel, set:
  ```
  NEXT_PUBLIC_API_URL=https://g4k.fly.dev/api
  ```
- [ ] **2.2b** Verify `api-client.ts` uses the env var:
  ```ts
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
  ```
- [ ] **2.2c** Keep the Next.js rewrite as a DEVELOPMENT fallback only:
  ```ts
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) return []; // Direct API in production
    return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
  }
  ```

**Verification:** DevTools → Network → login request goes to `https://g4k.fly.dev/api/auth/login`
(not through Vercel proxy). No CORS errors.

---

## PHASE 3 — Fly.io Region + Configuration

### 3.1 Change Fly.io region to Mumbai

**Problem:** Fly.io is in Singapore (`sin`). Supabase is in Mumbai. ~50ms DB latency per query.

**Fix:**
- [ ] **3.1a** Edit `fly.toml`: `primary_region = "bom"` (Mumbai). If `bom` is unavailable, use
  `maa` (Chennai) or `del` (Delhi) — all <30ms from Supabase Mumbai.
- [ ] **3.1b** Check available regions: `flyctl platform regions`.
- [ ] **3.1c** Destroy and recreate the machine in the new region:
  ```bash
  flyctl machine list
  flyctl machine destroy <machine-id> --force
  flyctl deploy
  ```

**Verification:** `flyctl ssh console -C "php artisan tinker --execute='echo DB::select(\"SELECT 1\")[0]->ok;'"` → completes in <50ms.

---

### 3.2 Disable auto-stop machines (prevent cold starts)

**Problem:** `auto_stop_machines = true` causes the machine to sleep after inactivity. The first
request after sleep takes 10-30s to wake.

**Fix:**
- [ ] **3.2a** `fly.toml`: set `auto_stop_machines = false` on BOTH services. Keep
  `min_machines_running = 1`.
- [ ] **3.2b** The self-ping in `start.sh` is a backup, but with `auto_stop_machines = false`, it's
  not needed. Keep it as a safety net.

**Cost note:** With `auto_stop_machines = false`, the machine runs 24/7. On Fly.io's pricing,
a 2GB shared-CPU machine costs ~$7-14/mo. The free trial ($300 credit) covers ~20-40 months.

---

### 3.3 Separate Reverb onto its own Fly.io app (recommended)

**Problem:** Reverb runs on port 8081 of the same machine. If the machine crashes, Reverb goes
down too. Also, Fly.io's HTTP check hits port 8080 (Octane) — if Octane is slow to boot, the check
fails and Fly.io marks the machine as unhealthy.

**Fix (recommended):**
- [ ] Create a separate Fly.io app for Reverb:
  ```bash
  flyctl launch --name g4k-reverb --region bom --no-deploy
  flyctl secrets set REVERB_APP_KEY=... REVERB_APP_ID=... REVERB_APP_SECRET=...
  ```
  Use a simple Dockerfile that runs ONLY `php artisan reverb:start`.
- [ ] Remove the Reverb service from the main `fly.toml`.
- [ ] Set `NEXT_PUBLIC_REVERB_HOST=g4k-reverb.fly.dev` on Vercel.

**Alternative (simpler):** Keep Reverb on the same machine but make it non-critical:
- [ ] If Reverb crashes, the main app continues. Realtime features stop but the app is usable.
- [ ] The self-ping + health check only target Octane (port 8080), not Reverb (port 8081).

---

## PHASE 4 — Database & Backend Optimization

### 4.1 Don't run fresh migrations on every boot

**Problem:** Every machine restart runs `php artisan migrate --force`. If the machine crashes
frequently (as it does now), migrations run 10+ times per hour. With 40+ migrations, this adds
15-20 seconds per boot. Migrations should only run on DEPLOY, not on every START.

**Fix:**
- [ ] **4.1a** Move migrations to a release command (run once per deploy, not per start):
  ```bash
  # In fly.toml, add a release command:
  [deploy]
    release_command = "cd /var/www/html/apps/api && php artisan migrate --force"
  ```
- [ ] **4.1b** Remove `php artisan migrate --force` from `start.sh`. The machine starts faster
  (~3s instead of ~20s).
- [ ] **4.1c** Alternatively, keep migrations in `start.sh` but skip if already migrated:
  ```bash
  # Only run if the migrations table has fewer rows than expected
  php artisan migrate --force --pretend 2>/dev/null | grep -q "Nothing to migrate" || php artisan migrate --force
  ```
  (This is hacky — prefer the release command approach.)

**Verification:** Machine boot time < 5s (no migration delay).

---

### 4.2 Verify init endpoint cache works on Fly.io

**Problem:** The init endpoint cache uses `CACHE_STORE=database`. On Fly.io with 50ms DB latency,
even cache reads take 50ms+. File cache is faster for single-instance.

**Fix:**
- [ ] **4.2a** Change `CACHE_STORE` to `file` on Fly.io:
  ```bash
  flyctl secrets set CACHE_STORE="file"
  ```
  File cache reads from local disk (~1ms) instead of DB (~50ms).
- [ ] **4.2b** Ensure the cache directory is writable: `bootstrap/cache/` must be writable in the
  Docker image. The FrankenPHP image runs as root, so this should work.
- [ ] **4.2c** If using multiple Fly.io machines in the future, switch to Redis cache (requires a
  Redis service). For single-instance, file cache is best.

**Verification:** Hit `/api/dashboard/init` twice → second response < 10ms (file cache hit).

---

### 4.3 Reduce Octane workers if memory is tight

**Problem:** 4 workers × ~100MB each = 400MB. Plus queue worker, scheduler, Reverb = ~600-700MB.
On a 2GB machine, this should be fine, but if OOM occurs, reduce workers.

**Fix:**
- [ ] If `flyctl logs` shows OOM or memory errors, reduce workers from 4 to 2:
  ```bash
  exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=${PORT:-8080} --workers=2 --max-requests=500
  ```

---

## PHASE 5 — Frontend: Design System Fixes

> The user explicitly says the UI is "AI generated slop" and not ClickUp-grade. The design system
> fixes from fix-12.md apply here. These are the most critical visual issues.

### 5.1 Fix `--color-muted` token (CRITICAL for readability)

**Problem:** `globals.css:54`: `--color-muted: var(--bg-surface-2)` maps to `#FCFCFE` (near-white).
Any `text-muted` class renders INVISIBLE text on white surfaces.

**Fix:**
- [ ] Replace all `text-muted` with `text-muted-foreground` across the codebase.
  ```bash
  grep -rn 'text-muted[^-]' apps/web/src/ packages/ui/src/ --include='*.tsx' --include='*.ts' | wc -l
  ```
- [ ] OR fix the token: `--color-muted: var(--text-muted)` — but this breaks `bg-muted` usage.
  Recommended: fix the USAGES, not the token.

---

### 5.2 Fix `--color-ring` token (HIGH for accessibility)

**Problem:** `globals.css:62`: `--color-ring: var(--border-strong)` = `#D1D1DE` (light gray).
Focus rings are barely visible. Should be brand-violet.

**Fix:**
- [ ] `globals.css:62`: change to `--color-ring: var(--accent-violet)`.

---

### 5.3 Standardize card styling across all widgets (HIGH)

**Fix:**
- [ ] ALL widgets use: `border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2
  transition-shadow duration-150 rounded-xl overflow-hidden h-full`.
- [ ] Remove all `border-none` from widget cards.
- [ ] Remove inconsistent `rounded-2xl` on cards (use `rounded-xl` for cards/widgets).

---

### 5.4 Sidebar: add colored icon tiles (HIGH)

**Fix:**
- [ ] Wrap each nav icon in a `w-7 h-7 rounded-md` container with:
  - Inactive: `bg-transparent group-hover/nav:bg-surface-2`
  - Active: module accent color (`accent.bg accent.bgDark`)
  - Icon: `w-4 h-4` colored on active, gray on inactive.

---

### 5.5 Header: solid background, consistent controls (MEDIUM)

**Fix:**
- [ ] Change `bg-surface/80 backdrop-blur-md` to `bg-surface border-b border-border`.
- [ ] All icon buttons: `h-9 w-9 rounded-lg` (not `rounded-full`).
- [ ] Consistent spacing: `gap-2`.

---

### 5.6 Remove all unauthorized gradients (MEDIUM)

**Allowed:** `bg-gradient-brand` on login header strip ONLY. Rainbow hover on primary button ONLY.
**Forbidden:** Any gradient on cards, nav items, banners, modals, or content.

**Fix:**
- [ ] `grep -rn 'gradient\|from-.*to-' apps/web/src/ --include='*.tsx' | grep -v 'globals.css'`
- [ ] Replace every hit with solid colors (unless it's the 2 allowed locations).

---

## PHASE 6 — Smoke Test

### 6.1 Production verification matrix

After ALL fixes are deployed:

- [ ] **Fly.io machine stays up** — `flyctl logs` shows Octane running without SIGINT errors for
  5+ minutes. No reboots.
- [ ] **CORS works** — login from Vercel domain succeeds. No CORS errors in browser console.
- [ ] **Login** — enter credentials → POST to `https://g4k.fly.dev/api/auth/login` → 200 response
  with token → redirect to dashboard → dashboard renders.
- [ ] **Dashboard** — widgets load from `/dashboard/init` → all show real data (not stuck loading).
- [ ] **Navigation** — click sidebar items → pages load in < 2s.
- [ ] **Clock in/out** — employee can clock in → timer runs → clock out → shift recorded.
- [ ] **Notifications** — bell opens modal → shows notifications → mark-as-read works.
- [ ] **Mobile** — 360px viewport → sidebar hidden → bottom nav works → widgets stack.
- [ ] **DevTools Network** — all API calls go to `g4k.fly.dev` directly. Zero CORS errors.
- [ ] **DevTools Console** — zero errors. Zero warnings.

---

## IMPLEMENTATION ORDER (CRITICAL — do exactly in this order)

### Step 1 — Stop the crash (5 minutes)
1. **1.1** — Add `pcntl` to Dockerfile
2. **1.2** — Create `config/octane.php`
3. **1.3** — Fix `start.sh` (add `|| true` to background processes)
4. Delete `apps/api/Dockerfile` (use root Dockerfile only)
5. `flyctl deploy`

### Step 2 — Fix CORS (5 minutes)
6. **2.1** — Add explicit `allowed_origins` to `cors.php`
7. **2.2** — Set `NEXT_PUBLIC_API_URL=https://g4k.fly.dev/api` on Vercel
8. Redeploy both Fly.io and Vercel

### Step 3 — Optimize Fly.io (10 minutes)
9. **3.1** — Change region to Mumbai (`bom`)
10. **3.2** — Disable `auto_stop_machines`
11. **4.1** — Move migrations to release command
12. **4.2** — Change `CACHE_STORE=file`

### Step 4 — Design system (1-2 hours)
13. **5.1** — Fix `text-muted` → `text-muted-foreground`
14. **5.2** — Fix `--color-ring` → brand-violet
15. **5.3** — Standardize card styling
16. **5.4** — Sidebar icon tiles
17. **5.5** — Header fixes
18. **5.6** — Remove gradients

### Step 5 — Verify
19. **6.1** — Full smoke test

---

## ACCEPTANCE — "The app works"

1. **Fly.io machine stays up** — zero restarts in 30 minutes. (1.1)
2. **Login works** — POST to `/api/auth/login` returns 200, no CORS error. (2.1)
3. **Dashboard renders** — widgets show real data within 2s. (4.2)
4. **Navigation is fast** — page-to-page < 2s on first load, < 200ms on cached revisit. (3.1)
5. **No CORS errors** in browser console. (2.1)
6. **No SIGINT errors** in Fly.io logs. (1.1)
7. **Machine doesn't sleep** — first request after 1h idle < 3s. (3.2)
8. **DB latency < 10ms** per query (Mumbai region). (3.1)
9. **All muted text is visible** (gray, not invisible white). (5.1)
10. **Focus rings are violet** and visible. (5.2)
11. **Cards have consistent borders + shadows + radius.** (5.3)
12. **Sidebar has colored icon tiles.** (5.4)
13. **Header is solid, not glassmorphism.** (5.5)
14. **No unauthorized gradients** (only login hero + primary button). (5.6)
15. **The app is usable for 30 minutes** with zero crashes, zero console errors, and every
    interaction feeling responsive.

---

## ROOT CAUSE SUMMARY (for the deployer)

| # | Root Cause | Fix | Time |
|---|---|---|---|
| **1** | `pcntl` extension missing → SIGINT crash → restart loop | Add `pcntl` to Dockerfile | 2 min |
| **2** | CORS `allowed_origins` empty → browser blocks all API calls | Add Vercel domain to cors.php | 2 min |
| **3** | `config/octane.php` missing → Octane uses broken defaults | Create config file | 2 min |
| **4** | Vercel `NEXT_PUBLIC_API_URL` points to localhost | Set to `https://g4k.fly.dev/api` | 1 min |
| **5** | Fly.io region Singapore ↔ Supabase Mumbai (50ms) | Change to Mumbai (`bom`) | 5 min |
| **6** | Migrations run on every boot (15-20s delay) | Move to release command | 2 min |
| **7** | `auto_stop_machines=true` → cold starts | Set to `false` | 1 min |
| **8** | `CACHE_STORE=database` → cache reads are slow (50ms) | Change to `file` | 1 min |

**Items 1-4 are CRITICAL — the app cannot work without them. Items 5-8 are performance.**
**Items 1+2 alone will make the app functional (login + basic usage).**
