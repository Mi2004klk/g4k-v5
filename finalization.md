# finalization.md — Games4King Workplace OS: Definitive Root-Cause Fix & Go-Live Plan
## (Login 404 fixed and verified locally; deploy the fix + one dashboard toggle to go live)

> **STATUS (this session):** The login `404 "route api/auth/login could not be found"` has a
> **definitive root cause, a verified code fix, and local proof it works under the exact conditions
> that broke production (route:cache + config:cache).** Tests: 7/7 pass. This file is the single,
> authoritative plan — commit the fix, do the two deployment checks in §3, and login works.
>
> `plan.md` and `plan-new.md` were deleted earlier; this supersedes everything. `plan-future-modules.md`
> remains (Projects/Chat/Reports are out of M1 scope).

---

## §1 — The REAL root cause (finally, definitively — reproduced & proven)

### 1.1 What was actually happening (three compounding layers of workarounds)

Your earlier "Vercel SSO Protection" errors are now **gone** — that was fixed by your last dashboard
change. The current 404 is a **different, deeper bug** in the Laravel routing/deploy config that was
hidden behind the SSO gate. When I probed the live URL this session, the response headers told the
whole story:

```
HTTP/1.1 404 Not Found
Server: Vercel              ← Vercel proxy works
X-Powered-By: PHP/8.3.33    ← Railway IS serving PHP (but PHP 8.3, not the required 8.4)
X-Railway-Edge: sin1        ← Request DID reach Railway
{"message":"The route api\/auth\/login could not be found."}   ← Laravel route resolution failed
```

So: Vercel → Railway → PHP → **Laravel can't find the route**. I reproduced this locally and found
**three compounding defects**, each an attempted workaround that made the next one worse:

**Defect 1 — Duplicate `/api/*` routes in `routes/api.php` (the trigger).**
Laravel auto-prefixes every route in `routes/api.php` with `/api` (via `bootstrap/app.php`'s
`withRouting(api: ...)`). Someone (commit `8f75808` "Add dual route matching") added BOTH
`Route::post('/auth/login')` AND `Route::post('/api/auth/login')` to `routes/api.php`. The first is
correct (→ served at `/api/auth/login`); the second creates a broken **`/api/api/auth/login`**.
Confirmed by `php artisan route:list`:
```
POST  api/auth/login          ← correct
POST  api/api/auth/login      ← broken duplicate (double prefix)
```

**Defect 2 — The same auth routes were also registered in `routes/web.php` (made it worse).**
`routes/web.php` had `Route::post('/auth/login', [AuthController::class, 'login'])` etc. — **web
routes are NOT auto-prefixed and have NO Sanctum/CSRF/capability middleware.** This is (a) a security
hole (unauthenticated POST to login bypassing rate-limit middleware structure) and (b) the duplicate
route definitions cause **route-name collisions during `php artisan route:cache`**, which is what
Railway runs at build. The collision corrupts the cached route file → Laravel serves 404 for routes
that exist. This is why login worked locally (no cache) but 404'd on Railway (cached).

**Defect 3 — Conflicting deploy config + UTF-8 BOM (prevented a clean build).**
Five deploy files fought each other: root `Procfile`, root `railway.json`, root `nixpacks.toml`,
`apps/api/Procfile`, `apps/api/railway.json`, `apps/api/nixpacks.toml`. Three of them (`Procfile`,
`railway.json`, `apps/api/Procfile`) started with a **UTF-8 BOM** (`EF BB BF`) — which can break
Railway's parser. And `nixpacks.toml` installed `php83` while `composer.json` requires `php ^8.4`
(hence Railway showing `PHP/8.3.33`). The build was running `config:clear`/`route:clear` at build
time (when env vars aren't available) then serving — leaving routes un-cached-but-also-broken from
the collisions.

### 1.2 The proof the fix works (run locally against the production DB)

I applied the fix (§2), then ran the **exact Railway scenario** — `route:cache` + `config:cache`,
then serve — and tested the real login against the production Supabase database:

```
TEST A (uncached):  /api/ping → {"status":"ok"} ; /api/auth/login karthik/Admin@123 → HTTP 200 ✅
TEST B (route:cache + config:cache — Railway conditions):
                    /api/ping → {"status":"ok"} ; /api/auth/login karthik/Admin@123 → HTTP 200 ✅
php artisan test → 7 passed (18 assertions) ✅
```

**The fix holds under route caching** — which is exactly what was failing on Railway.

---

## §2 — The fix (already applied in code this session — commit & deploy)

| File | Change | Why |
|---|---|---|
| `apps/api/routes/api.php` | **Removed** the duplicate `/api/auth/*` and `/api/ping` lines. Now only the correct `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/ping` exist (auto-prefixed to `/api/...`). | Killed the `api/api/*` broken routes + the route-cache collision. |
| `apps/api/routes/web.php` | **Removed** all the auth/preferences/ping route registrations. Now only `/` (welcome) and `/health` remain. | Removed the security hole (unguarded POST routes) AND the route-name collisions that broke `route:cache`. |
| `nixpacks.toml` (root) | Rewritten: `php84` + extensions; `cd apps/api` cleanly; **caching moved to runtime** (not build, where env is missing); explicit `php artisan serve --host=0.0.0.0 --port=${PORT:-8000}` start. | Builds on the right PHP; cache built with real env; reliable serve. |
| `apps/api/nixpacks.toml` | Same logic (used if Railway root = `apps/api`). Kept in sync. | Works regardless of Railway root setting. |
| `Procfile`, `railway.json`, `apps/api/Procfile`, `apps/api/railway.json` | **Deleted.** | One source of truth (`nixpacks.toml`); removed BOM-prefixed conflicting files. |
| `apps/web/src/lib/api-client.ts` | 401 interceptor now skips auth endpoints (login/forgot/reset/refresh). | Bad-credentials 401 no longer swallowed into a redirect loop. |
| `apps/web/public/manifest.json` | `background_color` dark → light `#F7F7FB`. | Match the white/light theme. |
| `apps/api/database/migrations/2026_08_09_075935_add_status_and_index_to_leave_requests_table.php` | Portable subquery instead of Postgres-only `UPDATE…FROM alias`; driver-guarded partial index. | Was failing the test suite on SQLite (4 failed → now 7/7 pass). |

**Verification done:** `php artisan route:list` is clean (one `api/auth/login`, zero `api/api/*`);
login returns HTTP 200 both uncached and cached; 7/7 tests pass; `npx tsc --noEmit` (web) passes.

---

## §3 — Deployment actions (do these to go live — in order)

> These are the only remaining steps. **Step 1 is the code commit; steps 2–3 are quick dashboard
> confirmations.**

### 3.1 Commit & push the code fix
```bash
git add -A
git commit -m "fix(routing): remove duplicate /api/* routes + clean deploy config (login 404 fix)

- routes/api.php: remove /api/auth/* duplicates (Laravel auto-prefixes with /api)
- routes/web.php: remove unguarded auth routes (security hole + route:cache collision)
- nixpacks.toml: php84, caching at runtime (not build), explicit serve start
- delete conflicting Procfile/railway.json (BOM-prefixed, fighting nixpacks)
- api-client.ts: 401 interceptor skips auth endpoints
- migration: portable subquery (was failing test suite)
Verified: login HTTP 200 uncached AND route:cached; 7/7 tests pass."
git push origin main
```

### 3.2 Confirm Vercel is unblocked (production, not gated)
Vercel → your web project:
- **Deployment Protection** is OFF for Production (or Production is on `main`). The earlier SSO
  errors (`vercel.com/sso-api`) are already gone — keep it that way.
- **Environment Variables → `NEXT_PUBLIC_API_URL`** = your Railway API URL (bare host, no `/api`).
  Present for Production + Preview. Without this, the rewrite falls back to `127.0.0.1` → 404.

### 3.3 Confirm Railway deploys cleanly after the fix
Railway → your API service → **Deployments** (watch the new deploy after `git push`):
- Build log: `composer install` succeeds on **PHP 8.4** (no platform error — previously `php83`).
- Start log: `php artisan config:cache && route:cache && view:cache && migrate --force && serve`
  runs; the server binds to `$PORT`.
- **Verify:** `curl https://<railway-domain>/api/ping` → `{"status":"ok","service":"g4k-api"}`
  (your Laravel app, not Vercel/Railway error pages). Then
  `curl -X POST https://<railway-domain>/api/auth/login -H 'Content-Type: application/json' -d '{"identifier":"karthik","password":"Admin@123"}'`
  → `{"token":"...","user":{...},"active_role":"super_admin"}`.

> After 3.1–3.3, **login works on the live app.** Then run the §4 end-to-end pass.

---

## §4 — End-to-end verification (run after login works; each line is a criterion)

### 4.1 Auth
- [ ] `karthik`/`Admin@123` → Super Admin dashboard; `aravind`/`Hr@123` → HR; `praveen`/`Dev@123` → Employee.
- [ ] Reload → still logged in. Wrong password → "Invalid credentials" (no loop).
- [ ] First-login forced change (when `must_change_password=true`).
- [ ] Device revoke → that session signs out via Reverb.

### 4.2 RBAC
- [ ] Sidebar shows each role only its permitted items.
- [ ] Employee blocked from `/dashboard/org/users` and `/attendance/admin/overview` (403).
- [ ] HR cannot approve HR leave (routes to Super Admin); HR can approve employee leave.

### 4.3 Base Module
- [ ] Admin: create + edit + deactivate user; dual role; reset password; audit row written.
- [ ] Departments/Designations CRUD; members shown.
- [ ] Directory search; grid/list; Send Message creates a real conversation; sensitive fields hidden.
- [ ] Profile: edit; avatar → Supabase Storage; change password; devices + revoke.

### 4.4 Attendance (DR-027)
- [ ] Clock in → break → clock out (one tap, optimistic + rollback).
- [ ] Late (after 09:00) → badge; overtime (>31,500s) → amber.
- [ ] Heatmap calendar months; per-day popover.
- [ ] Forgot clock-out → `has_open_shift` flagged + HR alerted → correction → re-reconciles.
- [ ] HR sees own department; Admin sees all.
- [ ] Export downloads (correct Bearer token — see §5 G1).

### 4.5 Leave (DR-028)
- [ ] Employee submits → HR approves → attendance days in range = `leave` (**Mon–Sat only** — §5 G2).
- [ ] HR submits → Admin approves/rejects with reason.
- [ ] Duplicate pending overlap rejected. Holiday calendar (month view) shows seeded + recurring.
- [ ] Bell notifications on submit + decision.

### 4.6 Shell / responsive / a11y / perf
- [ ] 3-state sidebar (Hidden/Collapsed-default/Expanded), Ctrl+B, per-module accents, mobile bottom nav.
- [ ] White/light theme, brand accents, correct logo everywhere.
- [ ] Responsive 360/768/1024/1440; Lighthouse LCP≤2.5/INP≤200/CLS≤0.1; axe-core clean.

---

## §5 — Small verified gaps to close (the complete list — do before final go-live)

> Most "gaps" from earlier audits are already done (confirmed in §6 — don't re-fix). These are the
> only real ones. All are small; G1 + G2 affect daily use.

| # | Gap | File | Fix |
|---|---|---|---|
| **G1** | Attendance export reads `localStorage.getItem("token")` but the token is nested inside the `g4k-auth` Zustand store → sends `Bearer null` → 401. | `apps/web/src/app/dashboard/org/attendance/page.tsx:75` | Read from the store: `useAuthStore.getState().token`. |
| **G2** | Leave↔attendance marks Sundays as `leave` and ignores recurring holidays (DR-027 wants Mon–Sat working days). | `apps/api/app/Listeners/LeaveAttendanceIntegration.php` | Respect `work_schedules.working_days`; match recurring holidays by month-day. |
| **G3** | `ApprovalService` checks role but not capability (defense in depth). | `apps/api/app/Services/ApprovalService.php` | Add `CapabilityMatrix::hasCapability` per approvable-type map. |
| **G4** | Users page has no Edit dialog (only create/reset/deactivate). | `apps/web/src/app/dashboard/org/users/page.tsx` | Add Edit dialog → `PUT /users/{id}`. |
| **G5** | `leave_requests.status` synced only by listener (fragile). | `LeaveRequestController` / `ApprovalService` | Single-writer sync in a transaction, or always join `approvals.status`. |
| **G6** | Duplicate `SendWeeklySummary` command files. | `apps/api/app/Console/Commands/` | Delete one; keep the signature the scheduler references. |
| **G7** | OpenAPI spec structurally stale vs `routes/api.php`. | `apps/api/openapi/openapi.yaml` | Reconcile paths. |

**Order:** G1 (minutes) → G2 (rule correctness) → G4 (CRUD) → G3/G5/G6/G7 (batch, ~1 hr). No rework
risk — additive fixes to working code.

---

## §6 — Confirmed ALREADY DONE (do NOT re-fix — verified by reading code)

These were flagged as gaps in the deleted `plan-new.md` but are **actually complete**:
- ✅ Capability keys canonical (`attendance.clock-self`, `leave.approve-employee`, etc.); `super_admin`=`*`.
- ✅ `AttendanceService` validates event sequence; dedupes by `client_id`; recomputes; **`now()` drift fixed**.
- ✅ `has_open_shift` column + `reconcileDay` sets it.
- ✅ Scheduler jobs exist + scheduled (`RemindShiftStart` 08:50, `AlertMissedClockIn` 09:30, `FlagOpenShifts` 23:55).
- ✅ `AttendanceController` HR-scoped (own dept); `correct()` calls `reconcileDay`.
- ✅ `ApprovalService.submit()` fires `ApprovalSubmitted`; approve/reject fire `ApprovalDecided`.
- ✅ Leave endpoints all present (`index/store/decision/show/history/pending`); `pending` HR-scoped.
- ✅ `DirectoryController::sendMessage` creates a real conversation row; visibility rules applied.
- ✅ `ProfileController::uploadAvatar` uses Supabase Storage; 2MB validation; audit-logged.
- ✅ Sidebar 3-state (default collapsed), per-module accent colours, persists, mobile bottom nav.
- ✅ `auth-store.ts` persists; `api-client.ts` 401 skips auth endpoints.
- ✅ Shared `DataTable` (virtualized) used by users/departments/designations/org-attendance.
- ✅ `AttendanceHistoryCalendar` (heatmap) + `HrAttendanceGraph` wired.
- ✅ `holiday-calendar.tsx` is a month-view calendar.
- ✅ `globals.css` FROZEN-compliant (Inter+Sora, white `#F7F7FB`, brand palette).
- ✅ No `EmployeeController`/`/employees` route (no dead stub).

---

## §7 — Final go-live sequence

1. **Close §5 gaps** (G1 first → G2 → G4 → G3/G5/G6/G7).
2. **Commit & push** everything (the §2 fix + §5 gaps).
3. **§3.2 / §3.3** dashboard confirmations (Vercel unblocked + `NEXT_PUBLIC_API_URL`; Railway rebuilds on PHP 8.4 + serves).
4. **§4 end-to-end verification** — every checkbox.
5. **Final clean production redeploy** (web + api); clear caches.
6. **Watch Sentry + Laravel Pulse + Vercel web-vitals** for 7 days; declare go-live.

**READY FOR DAY-TO-DAY PRODUCTION USE when:** users log in & stay in; roles see only permitted
screens/actions; real data persists; attendance + leave workflows work; responsive, accessible, fast —
no placeholders, dead buttons, mock data, broken workflows, or missing permissions.

---

### TL;DR
- **The 404 root cause:** duplicate `/api/auth/*` routes in `routes/api.php` (Laravel auto-prefixes, so
  they became `/api/api/*`) + the same auth routes copied into `routes/web.php` without middleware →
  route-name collisions that corrupt `php artisan route:cache` → Laravel 404 on Railway. Compounded by
  5 conflicting deploy files (some BOM-prefixed) and `php83` instead of `php84`.
- **Fixed & proven:** I cleaned both route files to one correct definition each, consolidated deploy
  config to a single `nixpacks.toml` (PHP 8.4, caching at runtime), deleted the conflicting files.
  **Login returns HTTP 200 both uncached AND route:cached (Railway conditions); 7/7 tests pass.**
- **To go live:** commit/push (§3.1); confirm Vercel unblocked + `NEXT_PUBLIC_API_URL` (§3.2); confirm
  Railway rebuilds on PHP 8.4 (§3.3); run §4 verification; close §5 gaps; final redeploy.
