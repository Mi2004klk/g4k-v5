# finalization.md — Games4King Workplace OS: Complete Fix & Go-Live Plan
## (Login 404 root cause found, code fixed & pushed, one manual Railway step remaining)

> **CURRENT STATUS:**
> - All code fixes are **committed and pushed** to `origin/main`.
> - Login works **locally** (proven: HTTP 200 uncached AND route:cached, against production Supabase DB).
> - **Railway has NOT rebuilt** (still serving old PHP 8.3.33 build) — see §1.3 for the manual step.
> - Vercel SSO Protection is OFF (manifest CORS errors are gone).
> - The full M1 codebase (Base + Attendance + Leave) is implemented and structurally sound.
>
> `plan.md` and `plan-new.md` are deleted. `plan-future-modules.md` remains. This is the
> single authoritative plan. **Read §1 first — it explains why every previous attempt failed.**

---

## §1 — Why login kept failing (the complete chain, no more guessing)

### 1.1 The original problem (multiple desperate workarounds compounding)

You tried many implementations. Each one added a workaround on top of the last, creating a
cascade of compounding defects. Here is the **exact chain**, proven by response headers and
local reproduction:

**Layer 1 — Duplicate routes broke route caching (the code bug).**
Commit `8f75808` added "dual route matching": BOTH `/auth/login` AND `/api/auth/login` in
`routes/api.php`. Laravel auto-prefixes api routes with `/api`, so the second became
`/api/api/auth/login` (broken). The same routes were also copied into `routes/web.php`
without middleware (security hole). When Railway ran `php artisan route:cache`, the
duplicate definitions caused **route-name collisions**, corrupting the cached route file.
Result: **routes work locally (no cache) but 404 on Railway (cached).**

**Layer 2 — Missing root `nixpacks.toml` prevented Railway from rebuilding (the deploy bug).**
Railway's service root is the **repo root**, but the root `nixpacks.toml` (which tells Railway
to build from `apps/api`) was **never committed to git**. Only `apps/api/nixpacks.toml` was tracked.
Railway either couldn't find a build config or used a stale one, so it kept serving the old
PHP 8.3 build — **the fix in Layer 1 never took effect on Railway**, even after being pushed.

**Layer 3 — PHP 8.3 vs 8.4 mismatch (the version bug).**
`composer.json` requires `"php": "^8.4"`, but old nixpacks configs installed `php83`.
Railway showed `X-Powered-By: PHP/8.3.33` — confirming it was running the wrong PHP.

**Layer 4 — BOM-prefixed Procfiles/railway.json (the encoding bug).**
Root `Procfile`, `railway.json`, and `apps/api/Procfile` started with UTF-8 BOM (`EF BB BF`),
which can break Railway's config parser.

**Response headers that told the story:**
```
Server: Vercel              ← Vercel proxy works (SSO protection now off)
X-Powered-By: PHP/8.3.33    ← Railway running OLD build (should be 8.4)
X-Railway-Edge: sin1        ← Request reaches Railway
{"message":"The route api/auth/login could not be found."}  ← Stale route cache from old build
```

### 1.2 The fix (applied, committed, pushed — all verified locally)

| Commit | Change | Proof |
|---|---|---|
| `05b3b6a` | Removed duplicate `/api/auth/*` routes from `routes/api.php`; removed all auth routes from `routes/web.php` (security hole + cache collision); deleted BOM-prefixed `Procfile`/`railway.json`; fixed `api-client.ts` 401 interceptor; fixed migration SQL portability. | `php artisan route:list` clean (one `api/auth/login`, zero `api/api/*`); 7/7 tests pass; login HTTP 200 uncached AND `route:cache`d. |
| `475be06` | **Added root `nixpacks.toml`** — the file Railway needs to build from repo root. Uses `cd apps/api` for all phases; PHP 8.4; caching at runtime (not build); explicit `php artisan serve` start. | Full Railway simulation (install + build + start) → `/api/auth/login` HTTP 200. |

### 1.3 THE ONE REMAINING MANUAL STEP (do this in Railway dashboard)

**Railway has not auto-rebuilt.** It's still serving the old PHP 8.3 build (`X-Powered-By: PHP/8.3.33`).
The root `nixpacks.toml` (commit `475be06`) was pushed but Railway's auto-deploy webhook may not be
triggering, or the service needs a manual redeploy.

**In the Railway dashboard → your API service:**

1. **Check if there's a new deployment queued** after the `475be06` push. If not:
2. **Click "Redeploy"** (or "New Deployment" → latest commit).
3. **Watch the build log.** It MUST show:
   - `Setting up php84` (NOT php83)
   - `cd apps/api && composer install --no-dev` (succeeds — PHP 8.4 matches composer)
   - `cd apps/api && php artisan storage:link`
   - Start: `cd apps/api && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`
4. **Verify the deploy succeeds** (green status, not crash-loop).
5. **Confirm:** `curl https://<railway-domain>/api/ping` → `{"status":"ok","service":"g4k-api"}` (NOT Vercel error, NOT 404).
6. **Confirm login:** `curl -X POST https://<railway-domain>/api/auth/login -H 'Content-Type: application/json' -d '{"identifier":"karthik","password":"Admin@123"}'` → `{"token":"...","user":{...},"active_role":"super_admin"}`.

Also verify in Vercel dashboard → Environment Variables that `NEXT_PUBLIC_API_URL` = your Railway
bare host URL (no `/api` — the rewrite appends it). Present for Production + Preview.

**Once Railway rebuilds with the new config, login works. The code is proven.**

---

## §2 — What was verified working (do NOT re-fix — already correct)

> These were flagged as gaps in earlier plans but are **confirmed working by reading the code**.

**Backend:**
- ✅ Auth flow: login/refresh/roleSelect/lockout/suspicious-login/token-rotation/reuse-revocation
- ✅ Capability keys canonical (`attendance.clock-self`, `leave.approve-employee`, etc.)
- ✅ AttendanceService: event-sequence validation, `client_id` dedupe, reconcileDay, `now()` drift fixed
- ✅ `has_open_shift` column + flagging in reconcileDay
- ✅ Scheduler jobs: RemindShiftStart (08:50), AlertMissedClockIn (09:30), FlagOpenShifts (23:55)
- ✅ AttendanceController: HR scoping (own dept), correct() calls reconcileDay after write
- ✅ ApprovalService: fires `ApprovalSubmitted` on submit, `ApprovalDecided` on approve/reject
- ✅ Leave endpoints: index/store/decision/show/history/pending — all present, pending HR-scoped
- ✅ `DirectoryController::sendMessage`: creates real conversation row; visibility rules (blood_group etc. always hidden)
- ✅ `ProfileController::uploadAvatar`: Supabase Storage, 2MB, audit-logged
- ✅ No dead `EmployeeController` or `/employees` route

**Frontend:**
- ✅ `auth-store.ts`: Zustand + persist (`g4k-auth`) — token survives reload
- ✅ `api-client.ts`: 401 interceptor skips auth endpoints (bad-credentials no longer swallowed)
- ✅ `providers.tsx`: light default, TanStack Query 5min stale, Toaster top-right
- ✅ `globals.css`: FROZEN-compliant (Inter+Sora, `#F7F7FB` light, brand palette, dark mode)
- ✅ Sidebar: 3-state (expanded/collapsed-default/hidden), Ctrl+B, per-module accent colours, persists to `/auth/preferences`, mobile bottom nav
- ✅ `DataTable`: virtualized (useVirtualizer), used by users/departments/designations/org-attendance
- ✅ `AttendanceHistoryCalendar` (heatmap) + `HrAttendanceGraph` wired
- ✅ `holiday-calendar.tsx`: month-view calendar
- ✅ Attendance export: Bearer-header `fetch` + blob (correct pattern)

---

## §3 — Verified real gaps (the complete list — close these before final go-live)

> All are small. G1 + G2 affect daily use. No rework risk — each is an additive fix.

| # | Gap | File | Fix | Size |
|---|---|---|---|---|
| **G1** | Attendance export reads `localStorage.getItem("token")` — but token lives inside Zustand `g4k-auth` store → sends `Bearer null` → 401 | `apps/web/src/app/dashboard/org/attendance/page.tsx:75` | Replace with `useAuthStore.getState().token` | 1 line |
| **G2** | Leave↔attendance marks Sundays as `leave` and ignores recurring holidays (DR-027 wants Mon–Sat only) | `apps/api/app/Listeners/LeaveAttendanceIntegration.php` | Read `work_schedules.working_days`; match recurring holidays by month-day | ~30 min |
| **G3** | `ApprovalService` checks role but not capability (defense in depth) | `apps/api/app/Services/ApprovalService.php` | Add `CapabilityMatrix::hasCapability` check | ~20 min |
| **G4** | Users page has no Edit dialog (create/reset/deactivate only) | `apps/web/src/app/dashboard/org/users/page.tsx` | Add Edit dialog → `PUT /users/{id}` | ~1 hr |
| **G5** | `leave_requests.status` synced only by listener (fragile if listener fails) | `LeaveRequestController` + `ApprovalService` | Sync in transaction within service | ~20 min |
| **G6** | Duplicate `SendWeeklySummary` command files | `apps/api/app/Console/Commands/` | Delete one | 1 min |
| **G7** | OpenAPI spec structurally stale vs routes | `apps/api/openapi/openapi.yaml` | Reconcile paths | ~1 hr |
| **G8** | Login screen uses generic dark gradient (`from-purple-900 via-violet-800 to-pink-700`) instead of the design-system tokens | `apps/web/src/app/(auth)/login/page.tsx:76` | Replace with `bg-background` + `bg-gradient-brand` accent (logo halo, not full-screen); use primary `Button` variant | ~30 min |

**Recommended order:** G1 (1 min) → G8 (login looks right) → G2 (rule correctness) → G4 (CRUD) → G3/G5/G6/G7 (batch, ~2 hr total).

---

## §4 — End-to-end verification (after Railway rebuild + gap fixes)

### 4.1 Auth
- [ ] `karthik`/`Admin@123` → Super Admin dashboard; `aravind`/`Hr@123` → HR; `praveen`/`Dev@123` → Employee
- [ ] Reload page → still logged in (persisted token + refresh cookie)
- [ ] Wrong password → "Invalid credentials" (no redirect loop)
- [ ] First-login forced change (`must_change_password=true` — change seeder to `true`)
- [ ] Device revoke → session signs out via Reverb `SessionRevoked`

### 4.2 RBAC
- [ ] Each role sees only its permitted sidebar items
- [ ] Employee deep-link to `/dashboard/org/users` → blocked
- [ ] Employee `GET /attendance/admin/overview` → 403
- [ ] HR cannot approve HR leave (routes to Super Admin)

### 4.3 Base Module
- [ ] Admin: create + edit (G4) + deactivate user; dual role; reset password; audit row
- [ ] Departments/Designations CRUD; members shown
- [ ] Directory: search; grid/list; Send Message (real conversation); sensitive fields hidden
- [ ] Profile: edit; avatar → Supabase Storage; change password; devices + revoke

### 4.4 Attendance (DR-027)
- [ ] Clock in → break → clock out (optimistic + rollback)
- [ ] Late (>09:00) → badge; overtime (>31500s) → amber
- [ ] Heatmap calendar; per-day popover
- [ ] Forgot clock-out → `has_open_shift` flagged + HR alerted → correction → re-reconciles
- [ ] HR sees own department; Admin sees all
- [ ] Export downloads (Bearer token — G1 fixed)

### 4.5 Leave (DR-028)
- [ ] Employee submits → HR approves → attendance days = leave (Mon–Sat only — G2 fixed)
- [ ] HR submits → Admin approves/rejects with reason
- [ ] Duplicate overlap rejected; holiday calendar (month view)
- [ ] Bell notifications on submit + decision

### 4.6 Shell / responsive / a11y / perf
- [ ] 3-state sidebar; Ctrl+B; per-module accents; mobile bottom nav
- [ ] Login: white/light base, brand accents (G8 fixed), correct logo
- [ ] Responsive 360/768/1024/1440; Lighthouse LCP≤2.5/INP≤200/CLS≤0.1; axe-core clean

---

## §5 — Final go-live sequence

1. **Railway: trigger rebuild** (§1.3 — the ONE remaining manual step).
2. **Verify Railway serves PHP 8.4:** `curl https://<railway>/api/ping` → `{"status":"ok"}`.
3. **Close §3 gaps** (G1→G8 in recommended order).
4. **Commit & push** gap fixes.
5. **Run §4 end-to-end verification** — every checkbox.
6. **Final clean redeploy** (web + api); clear caches.
7. **Watch Sentry + Laravel Pulse + Vercel web-vitals** for 7 days; declare go-live.

---

## §6 — Scope (M1 = Base + Attendance + Leave only)

Projects/Tasks/Chat/Announcements/Reports code exists but is **not** a go-live criterion.
Their widgets must show true empty states; if any endpoint threatens M1 stability,
disable its nav entry. Tracked in `plan-future-modules.md`.

---

### TL;DR
- **Why login kept failing:** Layer 1 (duplicate routes broke route:cache) + Layer 2 (root
  `nixpacks.toml` was never committed, so Railway never rebuilt) + Layer 3 (PHP 8.3 vs 8.4)
  + Layer 4 (BOM-prefixed Procfiles). Each "fix" added on top made the next one worse.
- **What's done:** All four layers fixed, committed, pushed. Proven locally (login HTTP 200 under
  route:cache). Railway just needs a manual rebuild trigger.
- **One manual step:** Railway dashboard → redeploy your API service → verify PHP 8.4 + ping + login.
- **8 small gaps** remain (G1–G8). G1 (export token) and G2 (leave working-days) affect daily use.
  The rest are polish/correctness. None are rework-risk.
- **After Railway rebuilds + gaps close + §4 verification → go live.**
