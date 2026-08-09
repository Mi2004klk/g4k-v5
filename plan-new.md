# plan-new.md — Games4King Workplace OS: Fix-First Finalisation & Production Go-Live
## (From deployed-but-unusable → verified daily-use production app)

> **This is the operational plan to take the ALREADY-IMPLEMENTED, ALREADY-DEPLOYED application from
> its current "login broken + login screen generic/AI-slop" state to a fully verified, production-ready
> app for daily company operations.**
>
> **It is NOT a rebuild.** Per the owner's explicit instruction: *"Do not simply rebuild everything
> from scratch or make assumptions. Preserve working functionality, fix what is broken, refactor what
> is inconsistent, and implement only what is actually required."* This plan audits the deployed
> codebase, isolates the root causes, and sequences targeted fixes — each with verification criteria
> so nothing is "done" merely because the UI exists.
>
> **Relationship to prior plans:** `plan.md` (the M1 build roadmap) and `plan-future-modules.md`
> (deferred modules) remain the source-of-truth *requirements*. This `plan-new.md` supersedes them for
> *execution sequencing* on the current deployed codebase: it reprioritises "fix login first," then
> "align the UI to the design system," then "complete/verify each module," then "optimise/harden/
> redeploy." The confirmed decisions (§4 of plan.md) still govern — visual intensity (ADR-023),
> 3-state sidebar (ADR-024), DR-027 attendance rules, DR-028 leave rules, DR-026 auth security, etc.
>
> **Hierarchy of truth:** this plan (operational) → `plan.md` §4 confirmed decisions + FROZEN specs
> (`DESIGN-SYSTEM.md`, `COMPONENT-SYSTEM.md`, `PERFORMANCE-STANDARDS.md`) → `REQUIREMENTS.md` →
> `data-prefill-reference.txt` → existing code (preserve what works).

---

## Table of contents

- §A — Audit findings: what's done, broken, inconsistent, missing (read first)
- §B — Root-cause analysis: WHY login is broken (precise chain)
- §C — Fix sequence (8 steps, dependency-ordered) — the core of this plan
  - Step 1 — Fix authentication/login (unblock everything)
  - Step 2 — Redesign login screen to the design system
  - Step 3 — Fix RBAC: capability keys + route guards + token abilities
  - Step 4 — Complete the 3-state sidebar + per-module accents + AppShell polish
  - Step 5 — Complete Base Module (org/directory/profile) + replace raw tables with DataTable
  - Step 6 — Complete & fix Attendance Module (open-shift, scheduler, HR scoping, heatmap, offline)
  - Step 7 — Complete & fix Leave Module (approval gating, overlap index, holiday calendar)
  - Step 8 — Performance, accessibility, responsive validation
- §D — Production hardening & security pass
- §E — Final seed, end-to-end verification, stable redeploy & go-live checklist
- §F — Out-of-scope (preserve the cutoff — do NOT expand M1)

---

## §A — Audit findings (deployed codebase, as observed)

> Findings are factual, from reading the current working tree. "✅" works, "🟡" partial, "❌"
> broken/non-compliant, "⚪" missing.

### A.1 What WORKS (preserve — do not rewrite)
- ✅ **Design-system tokens in `globals.css`** are FROZEN-compliant: Inter+Sora, white `#F7F7FB` light
  + dark variants, brand palette (`#8A2BE2`/`#FFD700`/`#FF1493`), semantic colours, elevation,
  radius, `bg-gradient-brand`/`bg-gradient-gold` utilities. **The token layer is good.**
- ✅ **Backend `AuthController`** logic is sound: identifier resolution (username/email/employee_id),
  Argon2id verify, rate-limit 5/600s→423, lockout, suspicious-login detection (`LoginAttempt`),
  access token + refresh token rotation + reuse-revocation, `SessionRevoked` event. **The auth
  *business logic* is correct — the breakage is in the *transport/cookie/guard* layer (§B).**
- ✅ **`User` model**: `HasApiTokens`, `GeneratesAutoNumber` trait, relationships
  (company/department/designation/team), casts. Good.
- ✅ **`AttendanceService` reconciliation**: recomputes `attendance_days` from `attendance_events`,
  dedupes by `client_id`, computes overtime (`max(0, total − standard)`), late, status, bumps version.
- ✅ **Approval framework** (`ApprovalService` + polymorphic `approvals` table) is reusable and
  already consumed by Tasks. **Attendance↔leave integration listener** (`LeaveAttendanceIntegration`)
  correctly marks `attendance_days.status='leave'` for the approved range.
- ✅ **`work_schedules` seed** matches DR-027 (Mon–Sat, 09:00–18:30, 45-min break, standard 31500s).
- ✅ **Real seed data** (13 employees, correct emails/usernames/departments/designations, role-specific
  passwords) matches `data-prefill-reference.txt`.
- ✅ **`notifications-bell.tsx`**, **`command-palette.tsx`** (Ctrl+K), **`breadcrumb.tsx`**, Ctrl+B
  sidebar toggle — all functional.
- ✅ **`time-clock-widget.tsx`**: isolated rAF timer (no sibling re-render), optimistic punch + rollback.
- ✅ **Leave request/approve/reject/history** frontend works (date range, type RadioGroup
  casual/sick/earned/unpaid, end≥start validation, AlertDialog reject+reason).

### A.2 What's BROKEN or causes the failure
- ❌ **Login loop / instant logout** — root cause in §B (auth-store not persisted + AuthGuard refresh +
  global 401 interceptor + refresh-cookie transport fragility + invalid CORS `*`+credentials).
- ❌ **Login screen looks "AI-slop"** — hardcoded `from-purple-900 via-violet-800 to-pink-700` hero
  + `from-violet-600 to-purple-700` button + `onError → /icon.png` fallback. Ignores the design
  tokens; doesn't match the white-light vibrant brief. §C Step 2 redesigns it.
- ❌ **`config/cors.php`: `allowed_origins=['*']` + `supports_credentials=true`** — invalid per CORS
  spec; browsers block credentialed cross-origin. Breaks the refresh-cookie path.
- ❌ **Global 401 interceptor** (`api-client.ts:32-39`) calls `clearAuth()` + `window.location.href=
  '/login'` on ANY 401 — including the expected 401 from `/auth/refresh` when no session exists →
  login loop. (Git history confirms: "revert 404 interceptor to fix login loop.")
- ❌ **Export auth via `?token=` query** (`org/attendance/page.tsx:65`) — Sanctum reads Bearer from
  header, not query → export endpoint 401s.
- ❌ **`EmployeeController` is an empty stub** — `/employees` apiResource returns nothing.
- ❌ **`DirectoryController::sendMessage` is a stub** — returns synthetic `conv_{id}_{id}`, no real row.
- ❌ **`ProfileController::uploadAvatar`** uses local disk + the frontend treats `apiFetch` result as a
  raw Response (`res.ok`/`res.json()`) but `apiFetch` already returns parsed JSON → throws on happy path.
- ❌ **OpenAPI spec is structurally stale** — paths (`/org/users`, `/attendance/events`, `/admin/settings`,
  `/auth/role/select`) don't match actual routes (`/users`, `/attendance/me/today`, `/settings/grouped`,
  `/auth/role-select`).

### A.3 What's INCONSISTENT (refactor, don't rebuild)
- 🟡 **Capability keys diverge across the codebase.** Seeder uses `employee.clock-self`,
  `employee.leave.request-self`, `hr.leave.approve-employee`, `admin.leave.approve-hr`,
  `admin.settings.manage`, `admin.audit.view` — but nav items reference `attendance.clock-self`,
  `leave.request-self`, `settings.manage`, `audit.view`, `reporting`, `app-shell` (some not seeded at
  all → those nav items never render). Needs a single canonical namespace. §C Step 3.
- 🟡 **Sidebar is 2-state** (264↔72, expanded by default) — ADR-024 requires 3-state (Hidden/Collapsed-
  default/Expanded). No Hidden state, no hamburger Sheet, no per-module accent colours, no persistence.
- 🟡 **HR scoping is partial.** `AttendanceController::correct()` enforces own-department, but
  `overview()`/`hrToday()` return the whole company to HR. `LeaveRequestController::index` shows HR
  all pending company-wide (not team-scoped).
- 🟡 **Base-module pages hand-roll `<table>`** instead of using the shared `DataTable` (which has
  virtualization + cursor pagination). DataTable exists but is unused by users/departments/designations.
- 🟡 **Leave `LeaveApprovalRow` is not truly optimistic** (spinner-then-invalidate, not badge-flip).
  No FilterBar on history; `holiday-calendar` is a list, not a month view.
- 🟡 **`DatabaseSeeder` sets `must_change_password=false`** — plan/DR require `true` for seeded users
  (force first-login change). Holidays not seeded.

### A.4 What's MISSING (implement)
- ⚪ **Forgot-clock-out / open-shift flagging** (DR-027): no `has_open_shift` column, no `FlagOpenShifts`
  job; service drifts `total_seconds` with `now()` on open shifts.
- ⚪ **Attendance scheduler jobs**: `RemindShiftStart` (15min before), `AlertMissedClockIn` (30min after),
  `FlagOpenShifts`. None exist (only weekly summary is scheduled).
- ⚪ **`AttendanceHistoryCalendar` heatmap** (ECharts) — only a flat table exists. `hrGraph` endpoint
  exists but is never called by the frontend.
- ⚪ **Offline IndexedDB queue for attendance punches** — currently online-only (violates R5.12/ADR-010).
- ⚪ **`ApprovalSubmitted` event** — only `ApprovalDecided` exists.
- ⚪ **Leave endpoints**: `show`, `/approvals/pending`, `/leave-requests/history`.
- ⚪ **DB partial-unique index** for leave overlap prevention (currently app-level only).
- ⚪ **Holiday CRUD** (index-only now; CRUD deferred to "Phase 7" per plan — confirm whether to ship in
  this finalisation; see §F).
- ⚪ **State-machine validation** in `AttendanceService` (reject clock_out-with-no-clock_in, etc.).
- ⚪ **Sidebar state persistence** (per user) — currently local React state.

---

## §B — Root-cause analysis: WHY login is broken

The auth *business logic* is correct. The failure is in the **session-continuity + transport layer**.
There are **four compounding defects**; fixing only one will not fully resolve the loop.

### B.1 The token is in-memory only, never persisted — so every full page load loses it
`auth-store.ts` is a plain Zustand store with **no `persist` middleware and no localStorage**. The
access token lives only in JS memory. On any full page load (or hard navigation), `token` is `null`.

### B.2 `AuthGuard` then calls `/auth/refresh`, which depends on a cookie that is fragile in production
When `AuthGuard` sees `token === null`, it calls `apiFetch("/auth/refresh")`, which reads the
`g4k_refresh_token` **HttpOnly cookie**. That cookie was set by `AuthController::login` via
`createAuthCookies()` with:
- `SameSite = 'None'` in production (to allow cross-site),
- `Secure = true` in production,
- **domain = `null`** (host-only).

But the request travels through the **Next.js `rewrites()` proxy** (`/api/:path*` → Railway). On
Vercel, an absolute-external rewrite to a different origin is processed at the **edge**, and
`Set-Cookie` headers from the destination (Railway) frequently **do not survive** to the browser as
same-site cookies for the Vercel origin. So on reload, the cookie is absent → `/auth/refresh` → 401.

### B.3 The global 401 interceptor then force-logs-out → login loop
`api-client.ts:32-39`: on **any** 401 response, `clearAuth()` + `window.location.href = "/login"`.
The expected 401 from `/auth/refresh` (no cookie yet) therefore **instantly logs the user out and
bounces to `/login`** — even though they just authenticated successfully. The result: login appears to
"succeed then fail" / "loop." (Commit `67430fc` "intercept 404 and 500"; `d6cb225` "revert 404
interceptor to fix login loop" — the team has been fighting exactly this.)

### B.4 CORS config is invalid for credentialed requests
`config/cors.php`: `allowed_origins=['*']` + `supports_credentials=true`. The CORS spec **forbids**
`Access-Control-Allow-Origin: *` when credentials are included — browsers block it. Any direct
(non-proxied) credentialed call is blocked. This is a latent landmine even after the proxy is fixed.

**Net effect:** a user can POST `/auth/login` and get a token, but the moment they land on `/dashboard`
(full load) or any 401 occurs, the in-memory token is gone, the refresh cookie isn't delivered, and
the interceptor throws them back to `/login`. **Login is effectively unusable.**

### B.5 The fix (detailed in §C Step 1)
1. Persist the access token (Zustand `persist` to localStorage) — it is a short-lived opaque Sanctum
   token, not a JWT with sensitive payload; the refresh cookie remains the long-term credential. (If
   you prefer no localStorage, see Step 1 alt: make `/auth/refresh` the source of truth and remove the
   interceptor's hard redirect — but persistence is the robust, low-risk fix.)
2. Remove/replace the global 401 → `window.location.href='/login'` interceptor. A 401 from
   `/auth/refresh` must NOT log out — it should just mean "not authenticated yet, show login." Only
   clearAuth on a 401 **after** a failed refresh attempt on a real (non-auth) endpoint.
3. Fix CORS: explicit allowed origins (Vercel prod + preview + localhost), keep
   `supports_credentials=true`; never `*` with credentials.
4. Ensure the refresh cookie survives the proxy: either (a) make the cookie domain explicit and
   `SameSite=Lax` (same-site via the Vercel proxy), or (b) confirm the rewrite preserves `Set-Cookie`.
   Lax + explicit domain is the safer choice given the proxy is same-origin from the browser's view.

---

## §C — Fix sequence (8 dependency-ordered steps)

> Each step lists: **Goal · Files · Changes · Verification**. Do NOT proceed to the next step until the
> current step's verification passes. Steps are ordered so that login works (Step 1) before any UI/RBAC
> work, and RBAC (Step 3) before module completion (Steps 5–7) because module permissions depend on the
> canonical capability keys.

---

### STEP 1 — Fix authentication & login (UNBLOCK EVERYTHING)  [highest priority]
**Goal:** A user can log in, navigate, reload the page, and stay logged in. No login loop.

**Files:**
- `apps/web/src/lib/auth-store.ts` — add `persist` middleware (localStorage, key `g4k-auth`).
- `apps/web/src/lib/api-client.ts` — remove the unconditional `401 → clearAuth + redirect '/login'`.
  Replace with: on 401, attempt ONE silent `/auth/refresh`; if refresh also 401s, THEN clearAuth +
  redirect. Never redirect on the refresh call's own 401.
- `apps/web/src/components/auth-guard.tsx` — keep the silent-refresh-on-load, but do not treat a
  refresh failure on `/login`/`/forgot-password`/`/reset-password` as an error (those are public).
- `apps/api/app/Http/Controllers/AuthController.php` (`createAuthCookies`) — set the refresh cookie
  domain explicitly and `SameSite=Lax` (the Vercel proxy is same-origin from the browser's perspective),
  `Secure` only on HTTPS (production). Keep HttpOnly. (This honours DR-026 SameSite=Lax for same-site;
  the runtime auto-detect Strict/None from plan §4 was for the direct cross-origin case — the proxy
  makes it same-site, so Lax is correct and simplest.)
- `apps/api/config/cors.php` — replace `allowed_origins=['*']` with the explicit list
  (`https://<vercel-prod>`, `https://<vercel-preview-*>`, `http://localhost:3000`); keep
  `supports_credentials=true`; explicit `allowed_headers` incl. `Authorization`, `Content-Type`,
  `X-CSRF-TOKEN`.
- `apps/web/next.config.ts` — keep the `/api/:path*` rewrite but verify `Set-Cookie` survives; if not,
  switch the refresh cookie to be issued/read same-origin via the proxy (it already is). Add
  `NEXT_PUBLIC_API_URL` to Vercel env.

**Verification (must all pass):**
- [ ] Log in as `karthik`/`Admin@123` → land on dashboard; **reload the page** → still logged in.
- [ ] Log in, then in another tab hit the app → second tab is authenticated (persisted token).
- [ ] Revoke the session from the devices list → first tab receives `SessionRevoked` (Reverb) and
      returns to login.
- [ ] Let the access token expire (simulate by deleting the in-memory/persisted token but keeping the
      cookie) → next action silently refreshes; no logout.
- [ ] No `window.location` redirect occurs on a `/auth/refresh` 401 when already on `/login`.
- [ ] Browser DevTools: refresh cookie present after login; CORS preflight passes with explicit origin.

---

### STEP 2 — Redesign the login screen to the design system (fix the "AI-slop" look)
**Goal:** Login is unmistakably on-brand: white/light base, vibrant brand accents, proper logo, design-
token-driven — matching ADR-023 and DESIGN-SYSTEM §10 — not a generic dark-gradient card.

**Files:** `apps/web/src/app/(auth)/login/page.tsx` (+ reuse existing `Card`, `Form`, `PasswordInput`,
`Tooltip`, `Button`, `logo` assets).

**Changes:**
- Replace the hardcoded `from-purple-900 via-violet-800 to-pink-700` full-screen background with the
  **white/light app background** (`bg-background` / `#F7F7FB`). Use the brand gradient (`bg-gradient-
  brand`) ONLY as a contained hero panel/logo halo or a subtle split-screen accent band — not the whole
  viewport. (DESIGN-SYSTEM §1: gradients reserved for sign-in hero / logo lockups.)
- Logo: render `landscape-logo.png` from `/public` via Next `Image` (no `onError` fallback to
  `/icon.png` — ensure the asset exists; if missing, copy from `Images, SVG, PDF/Landscape-Logo.png`
  into `apps/web/public/`). Centered/top, max-height 96px, clear space.
- Primary button: use the design-system `Button` variant `primary` (token-driven) — not a hand-rolled
  `bg-gradient-to-r from-violet-600 to-purple-700`. Keep the loading dot-loader + disabled state.
- Typography: `CardTitle` in Sora (`font-display`), labels Inter; sizes from the token scale.
- Welcome copy + copyright "© Games4King Workplace OS" + info Tooltip "Gen2k Conglomerate (2018) •
  Milestone 1" (R1.1) — already present, keep.
- Inputs use the token `Input`/`PasswordInput` with focus ring (`--ring` = brand violet).
- Add the joyful micro-interaction: subtle 0.96→1 scale on submit press (already on buttons generally).
- Apply the same alignment pass to `forgot-password`, `reset-password`, `change-password`, `onboarding`,
  `role-select` so the entire `(auth)` group is consistent (white base, brand accents, logo where
  relevant, animated-logo.mp4 in onboarding/empty moments — **never the king mascot**, per §4).

**Verification:**
- [ ] Login screen on desktop (1440) + mobile (360): white/light base, brand accents, correct logo,
      no generic dark gradient. Visual review vs DESIGN-SYSTEM §10/§1.
- [ ] All `(auth)` screens share the same look (consistent Card, button, input, focus ring).
- [ ]axe-core clean on login; keyboard fills + submits; reduced-motion respected.

---

### STEP 3 — Fix RBAC: canonical capability keys + route guards + nav alignment
**Goal:** Every role sees exactly the screens/actions permitted; backend enforces the same; nav items
render correctly. No orphan/never-rendering nav items.

**Files:**
- `apps/api/database/seeders/DatabaseSeeder.php` — **canonicalise the capability namespace** to match
  `plan.md §1.1`: `attendance.clock-self`, `hr.view-team-attendance`, `admin.view-all-attendance`,
  `admin.correct-attendance`, `attendance.correct-team`, `leave.request-self`,
  `leave.approve-employee`, `leave.approve-hr`, `settings.manage`, `audit.view`, `users.hr.manage`,
  `users.employee.manage`, `departments.manage`, `designations.manage`, `directory.view`,
  `directory.send-message`, `profile.edit`. Seed these into `capabilities` + `role_capabilities`
  (super_admin=`*`). Add the missing keys (`admin.correct-attendance`, `leave.approve-hr`,
  `attendance.correct-team`, `directory.send-message`).
- `apps/api/app/Services/CapabilityMatrix.php` — keep DB-driven + cache; ensure `hasCapability` still
  honours `*`.
- `apps/api/routes/api.php` — **add `->middleware('capability:<key>')` to every protected endpoint**
  (currently NONE have it; enforcement lives only in a few controller constructors). Specifically gate:
  attendance admin/hr/correct/export, leave decision, org CRUD (users/departments/designations/
  companies), settings, audit-logs, reports. Self-service endpoints (`attendance/clock-in`, leave
  request-self, profile, preferences) gated by the self-capability.
- `apps/web/src/app/dashboard/layout.tsx` — update nav item `capability` strings to the canonical keys
  so role-filtering matches what's seeded. Remove/fix nav items referencing non-existent keys
  (`reporting`, `app-shell`).
- `apps/api/app/Http/Controllers/AuthController.php` (`login`/`roleSelect`/`refresh`) — ensure the
  access token is ALWAYS created with exactly one `role:<role>` ability (it is) and that
  `RequireCapability` reads it (it does). Add a test.

**Verification:**
- [ ] `php artisan db:seed` produces `capabilities` + `role_capabilities` with the canonical keys.
- [ ] Automated test matrix: for each (role × capability-gated endpoint) → expected 200/403 passes.
      Specifically: Employee cannot GET `/attendance/admin/overview` (403); HR cannot correct a user
      outside their team (403); HR cannot approve HR leave (403, routes to super_admin); Admin can all.
- [ ] Sidebar shows each role exactly its permitted items (no orphan items); `GET /me/capabilities`
      returns the canonical list; frontend `hasCapability` matches.

---

### STEP 4 — Complete the 3-state sidebar + per-module accents + AppShell polish
**Goal:** Sidebar implements ADR-024 (Hidden/Collapsed-default/Expanded), per-module accent colours
(ADR-023), state persistence, mobile hamburger Sheet. The shell feels modern/joyful/consistent.

**Files:** `apps/web/src/app/dashboard/layout.tsx`, `apps/web/src/lib/auth-store.ts` or a new
`ui-store.ts` for sidebar/theme/density persistence, `UserPreferenceController` (persist sidebar state
to `preferences` json).

**Changes:**
- Replace the 2-state boolean (`isCollapsed`) with a 3-state enum (`'expanded' | 'collapsed' | 'hidden'`).
  - **Expanded (264px):** icon + label; active = module-accent-tinted bg + brand left bar + 600 weight.
  - **Collapsed (72px, DEFAULT on first visit):** icon-only + tooltip on hover (150ms); active = accent
    tint + left bar.
  - **Hidden:** sidebar removed; hamburger (top bar) opens a full-screen `Sheet` (280ms slide). On
    mobile this is the primary nav; bottom nav ≤5 stays for key actions.
- Transitions: width + content cross-fade glide **220ms cubic-bezier(.4,0,.2,1)**; labels fade
  (opacity 120ms) before width; collapsed icons fade in; section-group child collapse 180ms;
  `prefers-reduced-motion` → ≤1ms.
- **Per-module accent colours:** Dashboard=violet, Attendance=emerald, Leave=amber, Directory=pink,
  Org/Profile=blue, Settings=slate, Audit=rose. Applied to nav icon, active tint, left bar. Status
  colours (green/amber/red) override on data.
- Persist sidebar state per user (`PUT /auth/preferences` + Zustand mirror). Ctrl+B cycles states.
- Micro-interactions: hover lift, press 0.96, tooltip slide-fade, ARIA `aria-expanded`/`aria-current`.
- Ensure top-bar logo (square, 28px) + wordmark, NotificationsBell, avatar dropdown (theme/density/
  logout), command palette (Ctrl+K) all wired (most exist — verify).

**Verification:**
- [ ] All 3 states reachable; transitions smooth (220ms); collapsed is the first-visit default.
- [ ] Hamburger → full-screen Sheet on mobile; bottom nav ≤5 present.
- [ ] Active nav item shows the module's accent colour; tooltip shows on collapsed hover.
- [ ] Sidebar state persists across reload (preferences API). Ctrl+B works.
- [ ] Role-filtering still correct (Employee/HR/Admin see different items).

---

### STEP 5 — Complete the Base Module (org/directory/profile) + use DataTable everywhere
**Goal:** Base screens are fully functional, consistent, use the shared DataTable + FilterBar, no stubs.

**Files:** `apps/web/src/app/dashboard/org/{users,departments,designations}/page.tsx`,
`directory/page.tsx`, `profile/page.tsx`; `apps/api/app/Http/Controllers/{Employee,Directory,Profile}
Controller.php`; `apps/web/src/components/data-table/data-table.tsx`.

**Changes:**
- Replace hand-rolled `<table>` in users/departments/designations/directory with the shared `DataTable`
  (virtualized, cursor pagination, memoized rows) + `FilterBar`. Add edit dialogs (users currently only
  status-toggle; departments/designations lack edit).
- **Fix `EmployeeController` stub** — either implement or remove the `/employees` apiResource (it's
  redundant with `/users`; recommend removing the route + controller to reduce confusion).
- **Fix `DirectoryController::sendMessage`** — create a real `conversations` row (type=direct) +
  `conversation_user` membership, return its id. (Chat UI is future-module; the contract is reserved,
  but the row must exist so the future chat can open it.)
- **Fix `ProfileController::uploadAvatar`** — use **Supabase Storage** (DR-029), not local disk. Fix the
  frontend (`profile/page.tsx`) to treat `apiFetch`'s return as parsed JSON (remove `res.ok`/`res.json`).
- Enforce directory visibility rules (DR): name/designation/dept/avatar always; phone/email/mobile only
  if `profile_visibility` opts in; blood group/emergency/alternate-mobile NEVER in directory.
- Ensure reset-password uses the policy (min 8, mixed+number+symbol) — currently `min:8` only.

**Verification:**
- [ ] Admin CRUD on users (incl. edit + dual-role + reset-pw + deactivate) works; last-super-admin
      guard holds; audit row written each action.
- [ ] Departments/Designations have create/edit/delete; members shown.
- [ ] Directory search + grid/list; Send Message creates a real conversation row; sensitive fields
      hidden unless opted in.
- [ ] Profile photo uploads to Supabase Storage + displays via `next/image`; change-password enforces
      strong policy; devices list revoke works.
- [ ] All four list pages use `DataTable` + `FilterBar`; 1000 rows scroll at 60 FPS (virtualization).

---

### STEP 6 — Complete & fix the Attendance Module (day-to-day reliability)
**Goal:** Clock in/out/break, history heatmap, corrections, HR team-scoped views, open-shift flagging,
scheduler, offline — all correct per DR-027 and R5.1–R5.16.

**Files:** `apps/api/app/Services/AttendanceService.php`, `Http/Controllers/AttendanceController.php`,
a new migration for `has_open_shift`, new scheduler jobs, `Models/AttendanceDay.php` +
`Models/AttendanceEvent.php`; `apps/web/src/app/dashboard/attendance/page.tsx`,
`components/widgets/time-clock-widget.tsx`, `app/dashboard/org/attendance/page.tsx`, new
`AttendanceHistoryCalendar` component.

**Changes (backend):**
- Add `has_open_shift` boolean to `attendance_days`; on clock-in set true, on clock-out set false.
  Stop the service from drifting `total_seconds` with `now()` on open shifts (compute live total only
  on the client; the persisted `total_seconds` is the reconciled-on-close value).
- Add **state-machine validation** in `AttendanceService::recordEvent`: reject clock_out with no open
  clock_in; start_break requires on-clock; end_break requires open break. Return structured 422 on
  violation → conflict toast.
- **HR team-scoping**: `overview()`/`hrToday()` filter to users in HR's department(s) when the caller
  is HR (Admin sees all). `hrGraph` likewise scoped.
- **Re-reconcile after correction**: `correct()` must call `AttendanceService::reconcileDay()` after
  writing, not just `update([field=>value])`.
- **Scheduler jobs** (Laravel scheduler, queued): `RemindShiftStart` (start − 15min → notify employee),
  `AlertMissedClockIn` (start + 30min → notify HR if not clocked in), `FlagOpenShifts` (end + grace →
  set `has_open_shift=true`, notify HR/Admin). Register in `routes/console.php` / `Schedule` command.
- Create `AttendanceDay` + `AttendanceEvent` models (currently raw `DB::table`).

**Changes (frontend):**
- Build `AttendanceHistoryCalendar` (ECharts calendar heatmap, lazy-imported, per-month cache, per-day
  Popover summary incl. open-shift badge). Replace the flat table on `/dashboard/attendance`.
- `time-clock-widget`: read `standard_seconds` from the server (not hard-coded 31500) for the overtime
  amber threshold.
- `/dashboard/org/attendance`: present/absent/late filter chips + 30s stale-while-revalidate; click
  date/person → full summary; HR weekly/monthly graph (call `hrGraph`); **fix export auth** (use a
  Bearer-header fetch → blob download, not `window.open(?token=)`).
- **Offline queue**: route punches through the Offline Engine (IndexedDB) with `client_id`, sync on
  reconnect (Server-Validation conflict strategy).

**Verification:**
- [ ] Clock in → break → clock out (one-tap each, optimistic); reload → timer/state correct.
- [ ] Forget to clock out → `has_open_shift=true` flagged + HR/Admin alerted (scheduler) → correct via
      manual correction (add clock-out + reason) → re-reconciled.
- [ ] Late (clock-in after 09:00) → late badge + amber; overtime (>31500s) → amber timer.
- [ ] Cross-midnight shift attributed to clock-in date.
- [ ] HR sees only their team in overview/today/graph; Admin sees all; Employee sees self only.
- [ ] Offline: disable network, clock in → event queued → re-enable → syncs (client_id dedupe).
- [ ] Heatmap renders months; per-day popover correct; Excel/CSV export downloads with auth.
- [ ] State-machine rejects invalid sequences with a clear toast. Query-count ≤5/list; zero N+1.

---

### STEP 7 — Complete & fix the Leave Module
**Goal:** Leave requests/approvals/rejections/history/holiday-view all correct per DR-028 and R6.1–R6.8.

**Files:** `apps/api/app/Services/ApprovalService.php`, `Http/Controllers/LeaveRequestController.php`,
a migration for the leave partial-unique index, `app/Events/ApprovalSubmitted.php`;
`apps/web/src/components/leave/*`, `app/dashboard/{leave,org/leave}/page.tsx`.

**Changes (backend):**
- Add DB **partial-unique index** `(user_id,start_date,end_date) where status=pending` to enforce no
  duplicate pending overlap (currently app-level only).
- Add `ApprovalSubmitted` event (fired on submit) alongside `ApprovalDecided`. Notify the routed
  approver.
- Enforce approval gating inside `ApprovalService`: decider's active role must equal
  `current_approver_role` AND hold the capability (currently loose). HR can't approve HR leave
  (routes to super_admin); Admin approves HR leave.
- Add missing endpoints: `show`, `/approvals/pending`, `/leave-requests/history`.
- HR `index` team-scoped (not all company pending). Leave↔attendance integration: handle recurring
  holidays + respect working days (don't mark leave on a non-working day).

**Changes (frontend):**
- `LeaveApprovalRow`: make approve/reject **truly optimistic** (flip badge Amber→Green/Red instantly,
  rollback on error) — currently spinner-then-invalidate.
- `LeaveHistoryTable`: add FilterBar (status/type/date) + virtualization.
- `holiday-calendar`: render as a **month-view calendar** (not a flat list); read-only here (CRUD is
  future/settings — confirm in §F).
- Seed holidays (standard Indian public + company holidays) in `DatabaseSeeder`.

**Verification:**
- [ ] Employee submits leave → HR approves (1-click optimistic badge flip) → attendance days for the
      range show status=leave; HR submits leave → Admin approves/rejects with reason.
- [ ] Duplicate pending overlap rejected (DB + server); approver-role+capability enforced.
- [ ] Holiday calendar (month view) shows seeded holidays; recurring holidays apply.
- [ ] History table filters + virtualizes; pending-approvals queue works.
- [ ] Bell reflects ApprovalSubmitted + ApprovalDecided; Reverb push flips requester badge.

---

### STEP 8 — Performance, accessibility & responsive validation
**Goal:** All M1 routes meet the FROZEN P-* budgets; WCAG AA clean; responsive 360/768/1024/1440/1920
with no broken layouts/overflow/unusable controls.

**Work:**
- Bundle: ensure First-Load JS ≤200KB gz/route; lazy-load signed-in routes; dynamic-import ECharts/
  calendar/export. Memoize hot list rows + stable keys; confirm DataTable virtualization on all big lists.
- Backend: confirm zero N+1 + ≤5 SQL/list (query-count tests); indexes on all filtered/joined/ordered
  columns; cursor pagination everywhere; cache hot reference data (departments/designations/capabilities/
  holidays); queue exports/reports/notifications.
- A11y: axe-core zero critical/serious across all M1 screens; keyboard walkthrough every flow; focus
  management; visible focus; ARIA; reduced-motion; contrast.
- Responsive: visual + functional at 360/768/1024/1440/1920; fix overflow/broken layouts; table→card;
  3-state sidebar each breakpoint; bottom nav; attendance ≥48px mobile.
- Real browser pass: Chrome/Firefox/Safari desktop+mobile; PWA install + offline shell.

**Verification:**
- [ ] Lighthouse CI green on every M1 route (LCP≤2.5/INP≤200/CLS≤0.1/FCP≤1.8); First-Load ≤200KB gz.
- [ ] Query-count tests ≤5/list; zero N+1; axe-core clean.
- [ ] No overflow/broken layouts at any breakpoint; all controls usable.

---

## §D — Production hardening & security pass
**Goal:** Safe to run daily company operations.

- Verify auth security (Step 1): refresh rotation + reuse-revocation; SameSite Lax + HttpOnly + Secure;
  no token leakage; lockout; suspicious-login alerts; CSRF on refresh if ever cross-origin.
- **Authorization**: automated role×endpoint matrix test (Step 3) — no IDOR; HR scope filters verified;
  mass-assignment protection (`$fillable`); capability gates on every endpoint.
- **Validation/injection**: Zod (web) + Laravel validation (api) on every input; parameterized SQL
  (verify no raw concatenation); sanitize any rich text; file-upload type/size validation.
- **Secrets/headers**: no secrets in repo; HTTPS; HSTS; CSP; X-Frame-Options; X-Content-Type-Options;
  Referrer-Policy; CORS explicit origins.
- **Monitoring**: Sentry (errors+perf) Laravel + web; Laravel Pulse (slow queries/endpoints/queue);
  web-vitals field collection. (Confirm Sentry/Pulse env wired; if not, wire now.)
- **Backups/restore**: Supabase automated backups + PITR; restore drill; Railway redeploy + Vercel
  instant rollback rehearsed.
- **OpenAPI re-sync**: bring `openapi.yaml` paths in line with `routes/api.php` (currently stale) so
  CI lint passes and the contract is truthful.
- **Sync `DatabaseSeeder`**: `must_change_password=true` for seeded users (DR); seed holidays; canonical
  capability keys (Step 3).

---

## §E — Final seed, end-to-end verification, stable redeploy & go-live checklist

### E.1 Seed production
- Re-run migrations + seed on Supabase production: 1 company (Games4King), 2 departments (Game Dev
  Team / YouTube Team), 15+ designations, 13 employees (real data, role-specific passwords,
  `must_change_password=true`), work schedule (Mon–Sat 09:00–18:30), holidays, canonical capabilities.

### E.2 End-to-end smoke (production)
- [ ] **Login**: karthik/Admin@123 (Super Admin), aravind/Hr@123 (HR), praveen/Dev@123 (Employee);
      first-login forces password change; onboarding; reload stays logged in.
- [ ] **RBAC**: each role sees exactly its sidebar/screens/actions; forbidden deep-link → 403 UI;
      Employee blocked from admin endpoints; HR blocked from HR-leave-approval + other teams.
- [ ] **Sidebar**: 3 states, per-module accents, persists, Ctrl+B, mobile bottom nav + hamburger.
- [ ] **Dashboard**: real counts; empty states for unshipped modules (Projects/Tasks/Chat/Reports
      widgets — see §F).
- [ ] **Attendance**: clock in/out/break (optimistic); heatmap; late/overtime; offline clock + sync;
      forgot-clock-out flag + HR alert + correction; HR team view; Admin overview + export.
- [ ] **Leave**: employee request → HR approve → attendance days = leave; HR request → Admin approve/
      reject; holiday calendar; history filters; bell notifications.
- [ ] **Base**: org CRUD (users/depts/designations) with audit; directory search + visibility + Send
      Message; profile photo (Supabase) + devices + change-password.
- [ ] **Settings/Audit** (if shipped per §F): company profile, work schedule, holiday CRUD, policies;
      audit log filterable/exportable.
- [ ] **Responsive**: 360/768/1024/1440 verified; **a11y**: axe-core clean, keyboard flows.
- [ ] **Perf**: Lighthouse green; ≤5 SQL/list; no N+1; bundle ≤200KB gz.
- [ ] **Monitoring**: Sentry + Pulse live; web-vitals p75 trending to targets.

### E.3 Stable redeploy (final)
- Final clean redeploy (api Railway / web Vercel / db Supabase prod); final migration + seed; clear
  caches; smoke pass; rollback + backup verified; watch Sentry/Pulse for 7 days; declare go-live.

### E.4 Go-live declaration
**The application is READY FOR DAY-TO-DAY PRODUCTION USE when:** users can log in and stay logged in;
access the correct role-permitted screens/actions; persist real data; complete attendance + leave
workflows; and the app is reliable across screen sizes — with no placeholders, dead buttons, mock
data, broken workflows, inconsistent UI, or missing permissions.

---

## §F — Out-of-scope (preserve the M1 cutoff — do NOT expand here)

Per ADR-022 (owner-confirmed): **M1 = Base + Attendance + Leave only.** The deployed codebase happens
to also contain Projects, Tasks, Chat, Announcements, Reports code (implemented beyond M1). For this
finalisation:

- **Do NOT remove** those extra modules' code (they'll be used in the next milestone), BUT:
- **Do NOT spend finalisation effort completing/polishing them.** Their dashboard widgets must render
  **true empty states** (not mock data), and their nav items must not break the shell.
- **Holiday CRUD**: plan defers full CRUD to "Phase 7/settings." If the settings screen already has
  it wired, verify it works; if not, leave index+view for M1 and ship CRUD in the next milestone.
- **Reports/Chat/Projects/Tasks** endpoints that exist: ensure they don't break (no fatal errors), but
  do not verify them as M1 go-live criteria. They are tracked in `plan-future-modules.md`.

If, during the fix sequence, an extra-module endpoint's breakage threatens M1 (e.g., a global error
boundary catches it), **disable its nav entry** rather than fix it — keep M1 focused.

---

### End of plan-new.md
**Execute Step 1 first (login must work before anything else can be verified). Then Steps 2–7 in order
(login UI → RBAC → shell → base → attendance → leave). Then Step 8 (perf/a11y/responsive), §D
(security), §E (seed + verify + redeploy + go-live). Preserve working functionality; fix what's broken;
refactor what's inconsistent; implement only what's required. Do not rebuild from scratch.**
