# fix-11.md — Fly.io Migration + Direct API + Design System Overhaul = Production-Ready

> **The code-level fixes from fix-7 through fix-10 are implemented** (Octane, WidgetEngine fixed,
> init caching, prefetch disabled, accent colors). The app is STILL slow because of deployment
> architecture (proxy overhead, region mismatch) and the UI needs a comprehensive ClickUp-style
> polish. This file is the definitive plan to make the app fast on Fly.io + Vercel + Supabase and
> visually production-ready.
>
> **Target architecture:** Frontend on Vercel → direct API calls to Fly.io (no proxy) → Supabase
> Postgres. All three in the same region (Mumbai `ap-south-1` / Singapore `sin`).

---

## CURRENT STATE (verified)

| Area | Status | Evidence |
|---|---|---|
| Octane + FrankenPHP | ✅ Installed | `composer.json` has `laravel/octane:^2.19`; `start.sh` uses `octane:start --server=frankenphp` |
| Fly.io Dockerfile | ✅ Exists | `apps/api/Dockerfile` based on `dunglas/frankenphp:php8.4-alpine` |
| Fly.toml | ✅ Exists | `primary_region = "sin"` (Singapore) |
| Init endpoint caching | ✅ Implemented | `DashboardController.php:42` uses `Cache::remember(120s)` + per-section caches |
| Widget engine | ✅ Fixed | Uses `WidthProvider` from `react-grid-layout/legacy` |
| RSC prefetch | ✅ Disabled | `prefetch={false}` on all `<Link>` components |
| Widget deduplication | ✅ Working | 7 widgets read from `queryKeys.dashboardInit` via `select` |
| Nav accent colors | ✅ Implemented | Active items use `accent.bg`/`accent.border` (per-module) |
| Auth refresh | ✅ Header-based | `X-Refresh-Token` header + body fallback |

---

## WHAT'S STILL BROKEN

### 1. Vercel proxy overhead (50-100ms per request)
The Next.js rewrite (`/api/:path*` → Fly.io/Railway) adds a proxy hop. Every API call goes
Browser → Vercel Edge → Fly.io → Supabase → Fly.io → Vercel Edge → Browser. The Vercel→Fly.io leg
adds 50-100ms per request.

### 2. Region mismatch (Singapore ↔ Mumbai = ~50ms per DB query)
Fly.io is in Singapore (`sin`). Supabase is in Mumbai (`ap-south-1`). DB round-trip = ~50ms per
query. The init endpoint makes 18 queries (on cache miss) = 900ms. Better than US East (4.5s) but
not optimal.

### 3. No Reverb process on Fly.io
`start.sh` doesn't start `php artisan reverb:start`. Broadcasting silently fails. Realtime features
(chat, live notifications) don't work.

### 4. Design system is "AI slop"
Components are functional but lack ClickUp-style polish: inconsistent borders, no visual hierarchy,
generic spacing, no refined empty states, missing micro-interactions.

### 5. start.sh / nixpacks.toml path conflict
`start.sh` uses `/var/www/html/apps/api` (Fly.io). `nixpacks.toml` uses `/app/apps/api` (Railway).
Pick one platform and clean up.

---

## PHASE 1 — Deploy to Fly.io with Mumbai Region (eliminate DB latency)

### 1.1 Change Fly.io primary region to Mumbai

**Problem:** Fly.io is in Singapore (`sin`). Supabase is in Mumbai (`ap-south-1`). DB latency = ~50ms
per query.

**Fix:**
- [ ] **1.1a** Edit `fly.toml`: change `primary_region = "sin"` to `primary_region = "bom"` (Fly.io's
  Mumbai region code). If `bom` is not available, use the closest: `maa` (Chennai) or `del` (Delhi).
- [ ] **1.1b** Verify Fly.io supports the region: `flyctl platform regions`.
- [ ] **1.1c** Destroy the old Singapore machine and create a new one in Mumbai:
  ```bash
  flyctl machine list
  flyctl machine destroy <machine-id>
  flyctl deploy
  ```

**Impact:** DB query latency drops from ~50ms to <5ms per query. Init endpoint (18 queries on cache
miss) drops from 900ms to ~90ms.

**Dependencies:** Fly.io account must have Mumbai region available (may require payment method).
**Verification:** `flyctl ssh console -C "php artisan tinker --execute='echo DB::select(\"SELECT 1\")[0]->?;'"` → latency < 10ms.

---

### 1.2 Fix start.sh for Fly.io + add Reverb process

**Problem:** `start.sh` doesn't start Reverb. Broadcasting silently fails. Also, the script uses
`#!/bin/sh` but has bash-style constructs.

**Fix:**
- [ ] **1.2a** Update `apps/api/start.sh`:
  ```bash
  #!/bin/bash
  set -e
  cd /var/www/html/apps/api

  # Run migrations
  php artisan migrate --force

  # Queue worker (auto-restart loop)
  ( while true; do php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600; done ) &

  # Scheduler (every 60s)
  ( while true; do php artisan schedule:run; sleep 60; done ) &

  # Reverb WebSocket server (if BROADCAST_CONNECTION=reverb)
  if [ "$BROADCAST_CONNECTION" = "reverb" ] && [ -n "$REVERB_APP_KEY" ]; then
    ( php artisan reverb:start --host=0.0.0.0 --port=8081 ) &
  fi

  # FrankenPHP via Octane (main web server)
  exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=${PORT:-8080} --workers=4 --max-requests=500
  ```
  Note: reduce workers from 6 to 4 (1GB RAM machine — 4 workers × ~100MB = 400MB + queue + scheduler
  + Reverb + OS = ~800MB, leaving headroom).

- [ ] **1.2b** If Reverb uses port 8081, expose it in `fly.toml`:
  ```toml
  [[services]]
    internal_port = 8080  # Octane web server
    protocol = "tcp"
    # ... existing config ...

  [[services]]
    internal_port = 8081  # Reverb WebSocket
    protocol = "tcp"
    [[services.ports]]
      handlers = ["tls", "http"]
      port = 8443
  ```
  OR run Reverb on a separate Fly.io app (recommended — cleaner separation, independent scaling).

**Dependencies:** 1.1.
**Verification:** Deploy → check `flyctl logs` for `octane:start`, `queue:work`, `schedule:run`,
and `reverb:start` processes. All running without errors.

---

### 1.3 Upgrade Fly.io VM resources

**Problem:** 1GB RAM / 1 shared CPU is tight for Octane (4 workers) + queue + scheduler + Reverb.

**Fix:**
- [ ] **1.3a** Update `fly.toml`:
  ```toml
  [[vm]]
    memory = "2gb"
    cpu_kind = "shared"
    cpus = 2
  ```
  Cost: ~$7-14/mo on Fly.io (depends on usage). The free trial ($300 credit) covers months.

**Dependencies:** None.
**Verification:** `flyctl ssh console -C "free -m"` → shows 2GB total.

---

### 1.4 Configure Fly.io secrets (environment variables)

**Fix:**
- [ ] **1.4a** Set all required secrets via `flyctl`:
  ```bash
  flyctl secrets set APP_KEY="base64:..." # from .env
  flyctl secrets set DB_HOST="aws-0-ap-south-1.pooler.supabase.com"
  flyctl secrets set DB_PORT="6543"  # PgBouncer pooler port
  flyctl secrets set DB_DATABASE="postgres"
  flyctl secrets set DB_USERNAME="postgres.jtcgtjrqijdnecwtuspv"
  flyctl secrets set DB_PASSWORD="..." # actual password
  flyctl secrets set DB_SSLMODE="require"
  flyctl secrets set CACHE_STORE="file"  # or "database" — file is faster for single-instance
  flyctl secrets set QUEUE_CONNECTION="database"
  flyctl secrets set BROADCAST_CONNECTION="reverb"
  flyctl secrets set REVERB_APP_ID="..."
  flyctl secrets set REVERB_APP_KEY="..."
  flyctl secrets set REVERB_APP_SECRET="..."
  flyctl secrets set REVERB_HOST="g4k.fly.dev"  # Fly.io domain
  flyctl secrets set REVERB_PORT="443"
  flyctl secrets set REVERB_SCHEME="https"
  flyctl secrets set MAIL_MAILER="resend"  # or smtp
  flyctl secrets set MAIL_FROM_ADDRESS="no-reply@games4king.in"
  flyctl secrets set RESEND_API_KEY="..."
  flyctl secrets set SUPABASE_URL="https://jtcgtjrqijdnecwtuspv.supabase.co"
  flyctl secrets set SUPABASE_JWT_SECRET="..."
  flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="..."
  flyctl secrets set AWS_ACCESS_KEY_ID="..."  # Supabase S3 credentials
  flyctl secrets set AWS_SECRET_ACCESS_KEY="..."
  flyctl secrets set AWS_DEFAULT_REGION="ap-south-1"
  flyctl secrets set AWS_ENDPOINT="https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/s3"
  flyctl secrets set FILESYSTEM_DISK="s3"
  flyctl secrets set SENTRY_LARAVEL_DSN="..."
  flyctl secrets set SENTRY_TRACES_SAMPLE_RATE="0.1"
  ```

- [ ] **1.4b** Note: `CACHE_STORE="file"` is faster than `"database"` for a single-instance Fly.io
  machine (no network round-trip for cache reads). If scaling to multiple machines, use `"database"`
  or `"redis"` (requires a Redis service).

**Dependencies:** None.
**Verification:** `flyctl deploy` → app starts → `curl https://g4k.fly.dev/api/ping` → `{"status":"ok"}`.

---

### 1.5 Delete nixpacks.toml and railway.toml (no longer needed)

**Fix:**
- [ ] Delete `nixpacks.toml` and `railway.toml` from the repo root (Fly.io uses Dockerfile).
- [ ] Update `DEPLOYMENT.md` to document Fly.io as the deployment target.
- [ ] Remove Railway service (or keep as backup but don't deploy to it).

**Dependencies:** 1.4.
**Verification:** `flyctl deploy` works without nixpacks.

---

## PHASE 2 — Direct API Calls (bypass Vercel proxy)

### 2.1 Set NEXT_PUBLIC_API_URL to Fly.io domain

**Problem:** The Next.js rewrite proxies all API calls through Vercel → Fly.io. This adds 50-100ms
per request.

**Fix:**
- [ ] **2.1a** On Vercel, set environment variable:
  ```
  NEXT_PUBLIC_API_URL=https://g4k.fly.dev/api
  ```
  (Replace `g4k.fly.dev` with the actual Fly.io domain.)

- [ ] **2.1b** Update `apps/web/src/lib/api-client.ts` to use the direct URL:
  ```ts
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
  ```
  When `NEXT_PUBLIC_API_URL` is set, the browser calls Fly.io directly — no Vercel proxy.

- [ ] **2.1c** Remove the Next.js rewrite from `next.config.ts` (or keep it as a dev-only fallback):
  ```ts
  async rewrites() {
    // Only use rewrite in development (no NEXT_PUBLIC_API_URL set)
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://g4k.fly.dev'
      : 'http://127.0.0.1:8000';
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  }
  ```

- [ ] **2.1d** Configure CORS on Laravel for the Vercel domain:
  ```php
  // config/cors.php
  'paths' => ['api/*', 'broadcasting/auth', 'sanctum/*'],
  'allowed_origins' => [
      env('FRONTEND_URL', 'http://localhost:3000'),
      'https://g4k-v3-...vercel.app',  // Vercel production domain
      'https://*.vercel.app',  // Preview deployments
  ],
  'allowed_methods' => ['*'],
  'allowed_headers' => ['*'],
  'exposed_headers' => [],
  'max_age' => 0,
  'supports_credentials' => true,  // Important for cookies
  ```

- [ ] **2.1e** Set `FRONTEND_URL` on Fly.io:
  ```bash
  flyctl secrets set FRONTEND_URL="https://g4k-v3-...vercel.app"
  ```

**Impact:** Saves 50-100ms per API request. For 5 requests per dashboard load: 250-500ms saved.

**Dependencies:** Phase 1 (Fly.io must be deployed first).
**Verification:** DevTools → Network → API requests go to `g4k.fly.dev` (not through `vercel.app/api/`).
No CORS errors. Auth refresh works (header-based, not cookie-dependent).

---

### 2.2 Configure Reverb env vars on Vercel

**Fix:**
- [ ] Set on Vercel:
  ```
  NEXT_PUBLIC_REVERB_APP_KEY=<same as Fly.io>
  NEXT_PUBLIC_REVERB_HOST=g4k.fly.dev
  NEXT_PUBLIC_REVERB_PORT=443
  NEXT_PUBLIC_REVERB_SCHEME=https
  ```
  This enables WebSocket connections directly from the browser to Fly.io.

**Dependencies:** Phase 1.2 (Reverb must be running on Fly.io).
**Verification:** `use-reverb.ts` connects → real-time notifications work.

---

### 2.3 Lower Sentry traces sample rate

**Fix:**
- [ ] Fly.io: `flyctl secrets set SENTRY_TRACES_SAMPLE_RATE="0.1"`
- [ ] Vercel: set `SENTRY_TRACES_SAMPLE_RATE=0.1` or configure in `sentry.client.config.ts`.
- [ ] Verify in `apps/api/.env.example`: `SENTRY_TRACES_SAMPLE_RATE=0.1`.

**Dependencies:** None.

---

## PHASE 3 — Design System Overhaul: ClickUp-Style Polish

> The user explicitly says the UI is "AI generated slop" and needs a mature, ClickUp-style design
> system. This phase prescribes the exact visual changes needed.

### 3.1 Card system — consistent borders, shadows, spacing

**Problem:** Cards use `border-none shadow-sm` — looks flat and generic. No visual hierarchy.

**Expected (ClickUp style):** Cards have a subtle 1px border + small shadow at rest, lift on hover.
Consistent padding. Content hierarchy is clear.

**Fix:**
- [ ] **3.1a** Update `MetricWidget` card styling:
  ```tsx
  // BEFORE:
  <Card className="border-none shadow-sm hover:shadow-md ...">

  // AFTER:
  <Card className="border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2
    transition-shadow duration-150 rounded-xl overflow-hidden ...">
  ```
  Every card: 1px border (`border-neutral-200 dark:border-neutral-800`), shadow-e1 at rest,
  shadow-e2 on hover, `rounded-xl` (14px).

- [ ] **3.1b** Apply the same card treatment to ALL widget containers:
  `AnnouncementBoard`, `QuickNotes`, `PendingApprovalsWidget`, `RecentActivityWidget`,
  `AdminTodayAttendanceWidget`, `HrTeamAttendanceWidget`, `EmployeeTaskProgressWidget`,
  `EmployeeApprovalStatusWidget`, `TimeClockWidget`, `HrActivityFeedWidget`, `QuickTaskWidget`.

- [ ] **3.1c** Standardize card padding to `p-5` (20px) for all widgets — no exceptions.

**Verification:** Visual scan — all cards have identical border, shadow, radius, padding.

---

### 3.2 Typography hierarchy — clear, ClickUp-style

**Problem:** Text sizes are inconsistent. No clear visual hierarchy.

**Fix:**
- [ ] **3.2a** Widget title: `text-xs font-bold text-neutral-500 uppercase tracking-wider` —
  ClickUp uses small uppercase labels for section titles.
- [ ] **3.2b** Metric value: `text-3xl font-bold font-mono tracking-tight text-neutral-900` —
  large, tabular numbers for readability.
- [ ] **3.2c** Subtitle/description: `text-[11px] text-neutral-400` — small, muted.
- [ ] **3.2d** Page title: `text-xl font-bold font-display text-primary` — Sora font for brand
  headings.
- [ ] **3.2e** Body text: `text-sm text-neutral-700 dark:text-neutral-300` — readable, not too
  small.
- [ ] **3.2f** Verify Inter (UI) and Sora (display) fonts are loaded via `next/font` with
  `display: swap`.

**Verification:** Typography is consistent across all widgets and pages.

---

### 3.3 Sidebar — ClickUp-style compact navigation

**Problem:** The sidebar is functional but lacks ClickUp's compact, colorful, icon-forward style.

**Fix:**
- [ ] **3.3a** Nav item height: `h-9` (36px) — compact, ClickUp-style. Currently uses `py-2.5`
  which is taller. Change to:
  ```tsx
  className={cn(
    "flex-1 flex items-center gap-2.5 px-2.5 h-9 rounded-lg transition-all relative ...",
    // Note: gap-2.5 (10px) instead of gap-3 (12px) — tighter
    // Note: px-2.5 (10px) instead of px-3 (12px) — tighter
    // Note: h-9 (36px) fixed height instead of py-based padding
  )}
  ```

- [ ] **3.3b** Nav item icon container: add a subtle background for the icon:
  ```tsx
  <div className={cn(
    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
    isActive ? cn(accent.bg, accent.bgDark) : "bg-transparent"
  )}>
    <item.icon className="w-4 h-4 ..." />
  </div>
  ```
  This gives each nav item a colored icon tile (like ClickUp), not just a bare icon.

- [ ] **3.3c** Section headers: `text-[10px] font-bold uppercase tracking-wider text-neutral-400`
  with `px-2.5 mt-4 mb-1` spacing. Already implemented — verify.

- [ ] **3.3d** Active item: keep the accent-based background + solid left bar. Add a subtle scale
  or shadow:
  ```tsx
  isActive ? cn(accent.bg, accent.bgDark, "font-semibold shadow-sm") : "hover:bg-surface-2"
  ```

- [ ] **3.3e** Collapsed sidebar: icon-only with tooltip (150ms delay). Already implemented.
  Verify the icon tiles are centered.

**Verification:** Sidebar looks like ClickUp — compact, colorful icon tiles, clear hierarchy.

---

### 3.4 Dashboard welcome banner — refined, not gradient

**Problem:** The welcome banner uses `bg-primary` (charcoal) which is correct but could be more
visually engaging.

**Fix:**
- [ ] **3.4a** Keep `bg-primary` (no gradient — per design system rules). But refine the content:
  ```tsx
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
    bg-primary p-6 rounded-2xl text-primary-foreground shadow-lg">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground/50 mb-1">
        {greeting}  // "Good morning" / "Good afternoon" / "Good evening"
      </p>
      <h1 className="text-2xl font-bold font-display">
        Welcome back, {firstName}
      </h1>
      <p className="text-xs text-primary-foreground/70 mt-1">
        {roleSubtitle}  // "Super Admin Command Dashboard" etc.
      </p>
    </div>
    <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold capitalize">
      Role: {activeRole.replace("_", " ")}
    </div>
  </div>
  ```
  Add a dynamic greeting based on time of day. Use first name only (not full name).

**Verification:** Banner is polished, with greeting + first name + role badge.

---

### 3.5 Quick-action buttons — refined

**Problem:** Quick-action buttons look generic.

**Fix:**
- [ ] **3.5a** Each button should have the module's accent color on the icon:
  ```tsx
  <Link href="/dashboard/org/users" className="flex items-center gap-2 px-3.5 py-2 h-9
    bg-surface border border-border rounded-lg text-sm font-medium
    hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
    <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
      <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    </div>
    Manage Users
  </Link>
  ```
  Each button has: icon in a colored tile + label + subtle border + shadow.

**Verification:** Quick-action buttons have colored icon tiles, consistent sizing, clear hover state.

---

### 3.6 Empty states — illustrated, helpful

**Problem:** Empty states show generic text. Not helpful or visually appealing.

**Fix:**
- [ ] **3.6a** Every widget's empty state should have:
  - A large, muted Lucide icon (32px) centered
  - A clear title (`text-sm font-semibold`)
  - A helpful description (`text-xs text-neutral-400`)
  - An optional action button (e.g., "Create project", "Start conversation")
- [ ] **3.6b** Update the `EmptyState` component to match this pattern.
- [ ] **3.6c** Remove any `animated-logo.mp4` autoplay (too heavy for empty states in metric cards).

**Verification:** Every widget with no data shows a clear, helpful empty state.

---

### 3.7 Loading skeletons — content-shaped, not generic

**Problem:** Some widgets show generic skeleton bars; others show spinners.

**Fix:**
- [ ] **3.7a** Every widget's cold-load skeleton should match its content shape:
  - MetricWidget: skeleton for title bar + large number + subtitle
  - AnnouncementBoard: skeleton for 2-3 announcement cards
  - QuickNotes: skeleton for 3 note rows
  - TimeClockWidget: skeleton for timer + button area
  - PendingApprovalsWidget: skeleton for 3 approval rows
- [ ] **3.7b** Never use `Loader2` spinner as a full-card overlay. Use skeleton shapes.
- [ ] **3.7c** Background refresh: keep content visible, show a subtle `isFetching` indicator (1px
  top bar or a small spinner in the widget header).

**Verification:** Cold load shows content-shaped skeletons; background refresh is invisible.

---

### 3.8 Notification modal — refined

**Problem:** The notification modal is functional but not polished.

**Fix:**
- [ ] **3.8a** Use orange accent (notifications module color) for filter tabs and unread indicators.
- [ ] **3.8b** Unread notification row: subtle orange-tinted background (`bg-orange-500/5`), not
  violet.
- [ ] **3.8c** Each notification row: 44px minimum height (touch target), clear icon + title + body
  + timestamp + mark-read button.
- [ ] **3.8d** Filter tabs: pill-style toggle (Recent / Unread), orange accent on active.
- [ ] **3.8e** Footer: "View all in Notification Center" link, full-width ghost button.

**Verification:** Notification modal looks polished, uses orange accent, touch targets ≥44px.

---

### 3.9 Radius standardization

**Problem:** Inconsistent radius values across components.

**Fix — enforce this system everywhere:**
| Component | Radius | Tailwind class |
|---|---|---|
| Inputs | 6px | `rounded-md` |
| Buttons | 10px | `rounded-lg` |
| Nav items | 10px | `rounded-lg` |
| Badges/pills | 9999px | `rounded-full` |
| Cards/widgets | 14px | `rounded-xl` |
| Dialogs/panels | 20px | `rounded-2xl` |
| Modals | 20px | `rounded-2xl` |

- [ ] Audit ALL `rounded-*` classes and align to this system.

**Verification:** Visual scan — all cards have `rounded-xl`, all buttons have `rounded-lg`.

---

### 3.10 Shadow standardization

**Fix — enforce this system:**
| Level | Use | CSS |
|---|---|---|
| e1 | Rest cards | `shadow-sm` or custom `shadow-e1` |
| e2 | Hover lift | `shadow-md` or custom `shadow-e2` |
| e3 | Dropdowns/popovers | `shadow-lg` |
| e4 | Dialogs/drawers | `shadow-2xl` |

- [ ] Audit all `shadow-*` classes and align.

---

### 3.11 Remove all remaining gradient usage (except allowed)

**Problem:** Gradients may still appear on the mobile FAB and other elements.

**Fix:**
- [ ] Grep for ALL gradient usage: `grep -rn 'gradient\|from-.*to-' apps/web/src --include='*.tsx'`
- [ ] Remove ALL gradients EXCEPT:
  - `bg-gradient-brand` / `bg-gradient-gold` utility classes (sign-in hero only)
  - Primary button hover animation (conic gradient border)
- [ ] Replace mobile FAB gradient with solid `bg-emerald-600`.
- [ ] Replace any remaining `from-violet to-indigo` with solid accent colors.

**Verification:** Grep returns ZERO gradient classes in component code (only in globals.css utilities
and the primary button).

---

## PHASE 4 — Frontend Performance Cleanup

### 4.1 Eliminate duplicate preferences fetch

**Problem:** Widget-engine fetches `/auth/preferences` separately from the init endpoint.

**Fix:**
- [ ] `widget-engine.tsx`: read preferences from `queryKeys.dashboardInit` via `select`:
  ```tsx
  const { data: initData, isPending } = useQuery({
    queryKey: queryKeys.dashboardInit,
    staleTime: 60_000,
  });
  const preferencesData = initData?.preferences;
  ```

**Dependencies:** Init endpoint must include preferences (it does).
**Verification:** DevTools → no separate `/auth/preferences` request.

---

### 4.2 Verify all loading.tsx files exist

**Fix:**
- [ ] `find apps/web/src/app/dashboard -name 'loading.tsx' | wc -l` → should be ≥ 12.
- [ ] Add any missing ones.

---

### 4.3 Remove full-page blocking returns

**Fix:**
- [ ] Grep: `grep -rn 'if (isLoading\|if (isPending' apps/web/src/app/dashboard/`
- [ ] For each, verify it's inline (not full-page). Refactor if needed.

---

## PHASE 5 — Backend Hardening for Fly.io

### 5.1 Verify init cache invalidation

**Problem:** The init cache (`Cache::remember(120s)`) is invalidated by... what?

**Fix:**
- [ ] Add explicit cache invalidation on mutations:
  ```php
  // In AttendanceController after clock-in/out:
  Cache::forget("dashboard_init_{$user->id}_{$role}_{$today}");

  // In LeaveRequestController after decision:
  Cache::forget("dashboard_init_{$deciderId}_...");
  Cache::forget("dashboard_init_{$submitterId}_...");

  // In AnnouncementController after create/delete:
  Cache::forget("announcements_all");
  // Then forget all dashboard_init caches (or use Cache::tags)
  ```
- [ ] If using `CACHE_STORE=file` (recommended for single-instance Fly.io), ensure the file cache
  directory is writable: `bootstrap/cache/`.

**Dependencies:** None.
**Verification:** Clock in → dashboard refreshes attendance within seconds (not 2 min).

---

### 5.2 Optimize Octane for Fly.io

**Fix:**
- [ ] **5.2a** Ensure `config/octane.php` exists and is cached. Key settings:
  ```php
  'server' => 'frankenphp',
  'frankenphp' => [
      'workers' => 4,
      'max_requests' => 500,
  ],
  'flush' => [
      // Reset state that accumulates between requests
      Laravel\Sanctum\Guard::class, // if using Sanctum
  ],
  ```
- [ ] **5.2b** Verify `--max-requests=500` in start.sh. If memory grows, reduce to 200.

**Dependencies:** None.
**Verification:** Send 1000 requests → memory stable (check `flyctl metrics`).

---

### 5.3 Enable OPcache in Dockerfile

**Fix:**
- [ ] The FrankenPHP Docker image likely has OPcache built-in. Verify:
  ```bash
  flyctl ssh console -C "php -i | grep opcache.enable"
  ```
  Should show `On`.
- [ ] If not enabled, add to Dockerfile:
  ```dockerfile
  RUN echo "opcache.enable=1\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0" > /usr/local/etc/php/conf.d/opcache.ini
  ```

**Dependencies:** None.

---

## PHASE 6 — Final Production Hardening

### 6.1 Configure MAIL_* for email delivery

**Fix:**
- [ ] Use Resend (simplest): `flyctl secrets set MAIL_MAILER=resend RESEND_API_KEY=re_...`
- [ ] Test: trigger forgot-password → email arrives.

---

### 6.2 Configure Supabase Storage for file uploads

**Fix:**
- [ ] Set AWS_* env vars on Fly.io (already in 1.4a).
- [ ] Set `FILESYSTEM_DISK=s3`.
- [ ] Test: upload profile photo → appears in Supabase Storage.

---

### 6.3 Production smoke test

**Test matrix:**
- [ ] **Login as each role** (karthik/aravind/praveen) → dashboard renders in < 3s.
- [ ] **Navigate between 5 pages** → each loads in < 1s from cache.
- [ ] **Clock in/out** → instant optimistic UI → server confirms.
- [ ] **Submit leave** → form validates → creates request → toast.
- [ ] **Approve leave** (HR/Admin) → instant badge flip → notification fires.
- [ ] **Send message** (directory) → opens chat conversation.
- [ ] **Search/filter** on any table → instant client-side filter.
- [ ] **Export** (Admin) → downloads file.
- [ ] **Mobile (360px)** → sidebar → bottom nav → tables → cards → dialogs full-screen.
- [ ] **Offline** → clock in → queued → reconnect → syncs.
- [ ] **Console** → zero errors, zero warnings.
- [ ] **DevTools Network** → API calls go directly to Fly.io (not through Vercel proxy).

---

## IMPLEMENTATION ORDER

### Step 1 — Deploy to Fly.io (eliminate DB latency)
1. **1.1** — Change Fly.io region to Mumbai (`bom`)
2. **1.2** — Fix start.sh + add Reverb process
3. **1.3** — Upgrade VM to 2GB RAM / 2 CPU
4. **1.4** — Set all Fly.io secrets
5. **1.5** — Delete nixpacks.toml / railway.toml
6. `flyctl deploy` → verify `/api/ping` returns 200

### Step 2 — Direct API (bypass proxy)
7. **2.1** — Set `NEXT_PUBLIC_API_URL` on Vercel → Fly.io domain
8. **2.1c** — Update next.config.ts (conditional rewrite)
9. **2.1d** — Configure CORS on Laravel
10. **2.2** — Set Reverb env vars on Vercel
11. **2.3** — Lower Sentry sample rate

### Step 3 — Design system overhaul
12. **3.1** — Card system (borders, shadows, spacing)
13. **3.2** — Typography hierarchy
14. **3.3** — Sidebar (compact, icon tiles, ClickUp style)
15. **3.4** — Welcome banner (greeting, first name)
16. **3.5** — Quick-action buttons (colored icon tiles)
17. **3.6** — Empty states (illustrated, helpful)
18. **3.7** — Loading skeletons (content-shaped)
19. **3.8** — Notification modal (orange accent)
20. **3.9-3.10** — Radius + shadow standardization
21. **3.11** — Remove all gradient usage

### Step 4 — Frontend cleanup
22. **4.1** — Eliminate duplicate preferences fetch
23. **4.2-4.3** — Verify loading.tsx + remove blocking returns

### Step 5 — Backend hardening
24. **5.1** — Verify init cache invalidation
25. **5.2** — Optimize Octane config
26. **5.3** — Enable OPcache

### Step 6 — Production
27. **6.1-6.2** — Configure MAIL + Storage
28. **6.3** — Full smoke test

---

## ACCEPTANCE — "The app is fast, beautiful, and production-ready"

### Performance
1. **Login → dashboard: < 3 seconds.** (was 20s)
2. **Page navigation: < 1 second** from cached data.
3. **DB query latency: < 10ms** (Mumbai region aligned).
4. **No Vercel proxy** — API calls go directly to Fly.io.
5. **Init endpoint: < 50ms** on cache hit, < 200ms on cache miss.
6. **Concurrent requests handled in parallel** (Octane verified).

### Design
7. **Cards have consistent borders + shadows + radius + padding.** (3.1, 3.9, 3.10)
8. **Typography hierarchy is clear** — uppercase labels, large numbers, muted descriptions. (3.2)
9. **Sidebar is compact, ClickUp-style** — icon tiles, h-9 items, colored accents. (3.3)
10. **Welcome banner has dynamic greeting + first name.** (3.4)
11. **Quick-action buttons have colored icon tiles.** (3.5)
12. **Empty states are illustrated + helpful.** (3.6)
13. **Loading skeletons match content shape.** (3.7)
14. **Notification modal uses orange accent.** (3.8)
15. **No gradients** except sign-in hero + primary button hover. (3.11)
16. **Per-module accent colors** on all nav items, buttons, icons. (3.3)

### Stability
17. **Zero console errors.**
18. **Zero API 500s.**
19. **Realtime works** (Reverb on Fly.io, WebSocket from browser).
20. **Queue + scheduler running** (audit, notifications, reminders).
21. **Email delivery works** (forgot-password, weekly summary).
22. **File uploads work** (profile photos → Supabase Storage).

### Deployment
23. **Fly.io deployed in Mumbai** — DB latency < 10ms.
24. **Vercel deployed with direct API URL** — no proxy overhead.
25. **Supabase in Mumbai** — same region as Fly.io.
26. **Full smoke test passes** for all 3 roles on desktop + mobile.

---

## THE MATH (final, with all phases implemented)

| Metric | Current | After fix-11 |
|---|---|---|
| DB query latency | ~50ms (Singapore→Mumbai) | <5ms (Mumbai→Mumbai) |
| Init endpoint (cache miss) | ~900ms | ~90ms |
| Init endpoint (cache hit) | ~50ms | <30ms |
| Vercel proxy overhead | 50-100ms/request | 0ms (direct) |
| Total dashboard load | ~3-5s | <500ms |
| Login → dashboard | ~10-20s | <2s |
| Page navigation (cached) | ~1-2s | <200ms |

**The app will feel instantaneous, look polished, and be production-ready.**
