# finalization.md — Games4King Workplace OS: Final Findings & Go-Live Plan
## (Code is sound & verified; the unblock is a Vercel deployment setting + a few small gaps)

> **Bottom line up front — verified by running the actual backend against the production database:**
> - **The application code is correct.** I booted the Laravel API locally against your production
>   Supabase DB and proved: `/api/ping` → `pong api`; `POST /api/auth/login` with `karthik`/`Admin@123`
>   → returns a valid Sanctum token + user + `active_role: super_admin`; wrong password → HTTP 422.
>   **Login works.** The full test suite passes (7/7).
> - **Login is failing on the live URL for ONE reason: Vercel Deployment Protection (SSO) is enabled
>   on the deployed preview/branch URL**, so every `/api/*` request (and `manifest.json`) is intercepted
>   by Vercel's auth gate and returned as `{"error":"Protected deployment"}` (401/404) *before your app
>   code runs.* I proved this by probing the live URL directly.
> - The two prior plan files (`plan.md`, `plan-new.md`) were **deleted**; this is the single source of
>   truth. `plan-future-modules.md` remains (Projects/Chat/Reports are out of M1 scope).
>
> **This file has three parts:** (1) the deployment **unblock** (dashboard work — the actual login fix),
> (2) a short list of **verified real gaps** to close in code (most "gaps" from earlier audits turned
> out to already be done — those are listed as confirmed-good in §3 so you don't re-fix them), and
> (3) the **end-to-end verification + go-live checklist**. Do them in order and the app is live.

---

## §1 — The login failure: exact root cause (the ONLY blocker)

### 1.1 The console errors, decoded

| Error in console | What it actually is | Blocks login? |
|---|---|---|
| `api/auth/login`, `api/auth/refresh`, `api/auth/preferences` → **404/401** | **Vercel Deployment Protection (SSO) intercepting your API proxy** | **YES** |
| `manifest.json` → CORS error → `vercel.com/sso-api?url=...` | Same Vercel Protection gate intercepting `manifest.json` | No (same root cause) |
| `Uncaught TypeError: ... 'query' ... at content.js:1:13` | A **browser extension** (its `content.js`) — not your app | No |
| `_next/static/.../...css was preloaded but not used` | Cosmetic preload hint | No |
| `ServiceWorker registration successful` | Good — your SW works | No |

### 1.2 The proof (two independent confirmations)

**Proof A — probe the live URL:**
```
POST https://g4k-v3-...vercel.app/api/auth/login
→ 401 {"error":{"code":"401","message":"Protected deployment"},
       "protection":{"vercel_auth_enabled":true,
                     "vercel_auth_callback":"https://vercel.com/sso-api?url=..."}}
```
That JSON is **Vercel's own protection layer**, not Laravel, not Next.js. Your code never ran. The URL
(`g4k-v3-<hash>-…vercel.app`) is a **preview/branch deployment** and the project has **Deployment
Protection = "Vercel Authentication" (SSO)** enabled, which gates *every* path including `/api/*`. The
URL changed between your two reports (`eblseb43k` → `4mjniko8k`) — confirming you redeployed — but the
protection setting didn't change, so the errors are identical.

**Proof B — run the backend locally against the production DB (I did this):**
```
GET  /api/ping                              → pong api
POST /api/auth/login  karthik / Admin@123   → 200 {token, user, active_role:"super_admin", ...}
POST /api/auth/login  karthik / wrongpass   → 422  (correct, not 404)
php artisan test                            → 7 passed (18 assertions)
```
**The code is sound.** The failure is purely the deployment protection gate.

### 1.3 The unblock (dashboard work — do these 3 things, in order)

> None of these are code edits. They live in the Vercel / Railway / Supabase dashboards. **This is the
> actual login fix.**

**① Disable Vercel Deployment Protection on Production  ⬅ the real unblock**
Vercel → your web project → **Settings → Deployment Protection**:
- Turn **OFF** "Vercel Authentication" entirely, **OR** set it to apply **only to Preview deployments**
  (not Production), then **promote the current deployment to Production** (or push to `main` so it
  deploys as Production).
- **Verify:** `curl -i https://<prod>/api/ping` must return `pong api` from *your Laravel app*, not
  Vercel's `Protected deployment` JSON. The manifest CORS noise disappears too.

**② Confirm `NEXT_PUBLIC_API_URL` is set on Vercel**
Vercel → project → **Settings → Environment Variables** (Production + Preview):
- `NEXT_PUBLIC_API_URL` = your **Railway backend URL** (bare host, no `/api` — the rewrite appends it).
  Without this, `next.config.ts` falls back to `http://127.0.0.1:8000` → 404 on Vercel's edge.

**③ Confirm Railway backend is up & serving**
Railway → API service → **Deployments + Settings → Networking**:
- Ensure a **public Railway domain** is attached. Redeploy so the fixed `nixpacks.toml` (PHP 8.4 —
  see §2.1) takes effect; watch the build log (`composer install` must succeed, start command runs).
- Confirm `DB_*` env vars point to the **production** Supabase pooler. Run migrations + seed (the
  nixpacks build phase runs `php artisan migrate --force`; seed via Railway shell
  `php artisan db:seed --force` if not already).
- **Verify:** `curl https://<railway-domain>/api/ping` → `pong api`.

> After ①②③, login will work. The §4 verification then confirms the rest of the app.

---

## §2 — Code fixes (this session) + the small verified gap list

### 2.1 Already fixed in code this session (commit & deploy with the unblock)

| File | Change | Why / Proof |
|---|---|---|
| `apps/api/nixpacks.toml` | `php83` → **`php84`** + PHP extensions + explicit `[start]` cmd + `migrate --force` | `composer.json` requires `php: ^8.4`; `php83` fails `composer install` on Railway. Without a `[start]`, Railway may not serve. **This is a real build/runtime bug** independent of the Vercel gate. |
| `apps/api/database/migrations/2026_08_09_075935_add_status_and_index_to_leave_requests_table.php` | Replaced Postgres-only `UPDATE ... FROM ... alias` with a portable subquery; guarded the partial-unique index by driver | The raw SQL **broke the test suite** (`4 failed`) because SQLite rejects it. After the fix: **7/7 tests pass.** Also safer on Postgres. |
| `apps/web/src/lib/api-client.ts` | 401 interceptor now skips auth endpoints (login/forgot/reset/refresh) | A wrong-password 401 on login was being swallowed into a refresh-retry/redirect. Now surfaces "Invalid credentials." |
| `apps/web/public/manifest.json` | `background_color` dark `#0F0F14` → light `#F7F7FB` | Match the white/light default theme. |

**Verification:** `php artisan test` → 7 passed. `npx tsc --noEmit` (web) → exit 0.

### 2.2 Verified REAL gaps to close (small, specific — this is the complete list)

> I re-audited every item the earlier plan-new.md flagged as a gap. **Most were already fixed** (see
> §3 for the confirmed-good list — do NOT re-fix those). The **only** real remaining gaps are below.

| # | Gap | File(s) | Severity | Fix |
|---|---|---|---|---|
| **G1** | **Attendance export auth reads `localStorage.getItem("token")` but the token is persisted inside the Zustand `g4k-auth` store (nested `state.token`), so it gets `null` → sends `Bearer null` → 401.** | `apps/web/src/app/dashboard/org/attendance/page.tsx:75` | **High (feature broken)** | Read the token from the store: `useAuthStore.getState().token` (or expose a `getToken()` helper in `auth-store.ts` and use it). Keep the Bearer+`fetch`+blob flow (that part is correct). |
| **G2** | **Leave↔attendance integration marks EVERY non-holiday day in the range as `leave`, including Sundays (and Saturdays which are working days per DR-027) — and ignores recurring holidays.** | `apps/api/app/Listeners/LeaveAttendanceIntegration.php:36-56` | **Medium (rule correctness)** | Respect the user's `work_schedules.working_days` (Mon–Sat = `[1,2,3,4,5,6]`): skip non-working days (don't mark them leave). Also match recurring holidays by month-day, not just exact date. |
| **G3** | **`ApprovalService` enforces only a role check, not the capability gate.** A user whose role matches `current_approver_role` but lacks the specific capability could decide. | `apps/api/app/Services/ApprovalService.php` (`checkRoleGating` ~line 42) | Medium (defense in depth) | Add a `CapabilityMatrix::hasCapability($deciderRole, $requiredCap)` check using the per-approvable-type capability map (`leave_request → hr:leave.approve-employee, super_admin:leave.approve-hr`). The route middleware already gates, but the service should enforce too (single-source correctness). |
| **G4** | **Users page has no Edit dialog** (only Create, Reset Password, Activate/Deactivate). Admin can't edit name/email/department/designation/roles of an existing user. | `apps/web/src/app/dashboard/org/users/page.tsx` (row dropdown) | Medium (CRUD completeness) | Add an Edit dialog (reuse the create `UserForm` shape) → `PUT /users/{id}`. Backend `UserController@update` already supports it. |
| **G5** | **`leave_requests.status` is only updated by the `ProcessApprovalDecision` listener.** If that listener ever fails or is skipped, `index`/`history`/`pending` (which filter on `leave_requests.status`) return stale rows. | `apps/api/app/Listeners/ProcessApprovalDecision.php` + `LeaveRequestController` | Low (robustness) | Either keep denormalized `status` synced in a DB transaction within `ApprovalService::approve/reject` (single writer), or have the leave queries always join `approvals.status`. Pick one; document it. |
| **G6** | **Duplicate `SendWeeklySummary` command files** (`SendWeeklySummary.php` + `SendWeeklySummaryCommand.php`). | `apps/api/app/Console/Commands/` | Low (cleanup) | Delete one; keep the signature the scheduler references (`routes/console.php:15` → `reports:send-weekly-summary`). |
| **G7** | **OpenAPI spec structurally stale** vs `routes/api.php` (`/org/users` vs `/users`, `/attendance/events` vs `/attendance/me/today`, `/auth/role/select` vs `/auth/role-select`, etc.). CI lints it but it's not truthful. | `apps/api/openapi/openapi.yaml` | Low (contract hygiene) | Regenerate/reconcile paths to match `routes/api.php` so the contract is accurate for future client codegen. |

> **That's the entire real gap list.** Everything else flagged in earlier audits (EmployeeController,
> Directory sendMessage, Profile avatar, sidebar 3-state, per-module accents, attendance state-machine,
> open-shift flagging, scheduler jobs, heatmap, HR graph, holiday month-view, leave endpoints, etc.) is
> **already done** — see §3. Don't waste effort re-fixing them.

### 2.3 Recommended order to close §2.2

1. **G1** (export auth token) — 1-line fix, unblocks a broken feature.
2. **G2** (leave working-days + recurring holidays) — rule correctness for daily use.
3. **G4** (users edit dialog) — CRUD completeness.
4. **G3** (capability in ApprovalService) — defense in depth.
5. **G5, G6, G7** — robustness/cleanup/contract (can batch).

All are small (G1 = minutes; G2/G4 = ~1–2 hours each; G3/G5/G6/G7 = ~1 hour total). No rework risk:
they're additive fixes to working code, each independently verifiable.

---

## §3 — Confirmed ALREADY DONE (do NOT re-fix — verified by reading the code)

> The earlier `plan-new.md` audit flagged many of these as gaps. They are **not**. Listing them so you
> don't waste time, and so future work has an accurate baseline.

**Backend — confirmed working:**
- ✅ `EmployeeController` does **not exist** and there's **no `/employees` route** — no dead stub. (`UserController` handles employees.)
- ✅ `DirectoryController::sendMessage` creates a **real `conversations` row** (transactional, finds-or-creates direct conversation, inserts memberships, returns real id). Visibility rules applied (`alternate_mobile`/`emergency_contact`/`blood_group` always hidden).
- ✅ `ProfileController::uploadAvatar` uses **Supabase Storage** (`Storage::disk('supabase')`), 2MB + image-type validation, audit-logged.
- ✅ **Capability keys are canonical** in the seeder: `attendance.clock-self`, `hr.view-team-attendance`, `admin.view-all-attendance`, `admin.correct-attendance`, `attendance.correct-team`, `leave.request-self`, `leave.approve-employee`, `leave.approve-hr`. `super_admin` = `*`. Matches plan §1.1.
- ✅ `AttendanceService` **validates the event sequence** (rejects clock_out-with-no-clock_in, break_start-when-not-on-clock); dedupes by `client_id`; recomputes `attendance_days`; **fixed the `now()` drift** (only closed segments count, open shift shows 0 until clock-out).
- ✅ **`has_open_shift` column exists** (separate migration) and is set by `reconcileDay`.
- ✅ **Scheduler jobs exist and are scheduled**: `RemindShiftStart` (08:50), `AlertMissedClockIn` (09:30), `FlagOpenShifts` (23:55), weekly summary (Sun 09:00). Both Jobs (`app/Jobs/`) and Commands exist.
- ✅ `AttendanceController`: HR scoping via `applyHrScoping` (own department); `correct()` calls `reconcileDay` after writing; capability middleware in constructor.
- ✅ `ApprovalService.submit()` **fires `ApprovalSubmitted`**; approve/reject fire `ApprovalDecided`.
- ✅ Leave endpoints **all present**: `index`, `store`, `decision`, `show`, `history`, `pending`.
- ✅ `LeaveRequestController::pending` **HR-scoped** (own department via `whereHas('user')`).
- ✅ Listeners: `LeaveAttendanceIntegration`, `NotifyApprovalSubmitted`, `ProcessApprovalDecision` all present.
- ✅ Auth flow: access token + refresh token rotation + reuse-revocation, `SessionRevoked` event, lockout, suspicious-login detection.

**Frontend — confirmed working:**
- ✅ **Sidebar is 3-state** (`expanded`/`collapsed`/`hidden`), **default `collapsed`**, Ctrl/Cmd+B cycle, persists to `/auth/preferences`, mobile bottom nav (5 items).
- ✅ **Per-module accent colours** applied (`getAccent` + map: Dashboard violet, Attendance emerald, Leave amber, Directory pink, Org/Profile blue, Settings slate, Audit rose).
- ✅ `auth-store.ts` uses **`persist`** (`g4k-auth`) — token survives reload.
- ✅ `api-client.ts` 401 interceptor skips auth endpoints (this session's fix).
- ✅ `providers.tsx`: light default theme, TanStack Query, Toaster top-right.
- ✅ Shared `DataTable` **is used** by users/departments/designations/org-attendance (not hand-rolled); has `@tanstack/react-virtual` virtualization. *(Memoization + cursor pagination props are partially wired — see note below, not blocking.)*
- ✅ Attendance personal page uses **`AttendanceHistoryCalendar`** (calendar heatmap, not flat table).
- ✅ `hrGraph` **is called** in `org/attendance/page.tsx` (`HrAttendanceGraph` component).
- ✅ Attendance export uses **Bearer-header `fetch` + blob** (correct pattern; the bug is only the token source — G1).
- ✅ `holiday-calendar.tsx` is a **month-view calendar** (7-col grid, prev/next nav), not a flat list.
- ✅ Profile avatar upload mutation **correctly** treats `apiFetch` result as parsed JSON (no `res.ok`/`res.json` bug there).
- ✅ `globals.css` design tokens are FROZEN-compliant (Inter+Sora, white `#F7F7FB`, brand palette, dark variants, gradients as utilities).

**Minor polish (not blocking go-live — optional):**
- Profile sessions table hand-rolls a raw `<table>` (could use `DataTable`, but it's a 2–5 row list — fine).
- `DataTable` rows aren't `React.memo`'d and cursor-pagination props aren't passed by consumers — fine for current data volumes (13 users); becomes relevant only at scale (future milestone).

---

## §4 — End-to-end verification (run AFTER §1 unblock + §2.2 fixes)

> Each line is a **verification criterion**. Nothing is "done" just because the UI exists.

### 4.1 Authentication (the previously-broken flow)
- [ ] `karthik`/`Admin@123` → Super Admin dashboard; `aravind`/`Hr@123` → HR; `praveen`/`Dev@123` → Employee.
- [ ] **Reload the page → still logged in.**
- [ ] Wrong password → "Invalid credentials" (no loop, no swallow, no redirect).
- [ ] First-login forced change fires when `must_change_password=true`.
- [ ] Revoke a device from the device list → that session signs out (Reverb `SessionRevoked`).
- [ ] Logout → refresh cookie cleared; revisit → login.

### 4.2 RBAC
- [ ] Sidebar shows each role only its permitted items.
- [ ] Employee deep-links `/dashboard/org/users` → blocked/redirected.
- [ ] Employee `GET /attendance/admin/overview` → 403.
- [ ] HR cannot approve HR leave (routes to Super Admin); HR can approve employee leave.
- [ ] `GET /me/capabilities` returns the canonical list per active role.

### 4.3 Base Module
- [ ] Admin: create + **edit** (G4) + deactivate a user; assign dual role; reset password; audit row written.
- [ ] Departments/Designations: create/edit/delete; members shown.
- [ ] Directory: search; grid/list; **Send Message creates a real conversation row**; sensitive fields hidden.
- [ ] Profile: edit name/phone; **upload photo to Supabase Storage**; change password; devices + revoke.

### 4.4 Attendance Module (DR-027)
- [ ] Clock In → Start Break → End Break → Clock Out (one tap each, optimistic + rollback).
- [ ] Live timer updates without re-rendering unrelated widgets.
- [ ] Late (after 09:00) → late badge + amber; overtime (>31,500s) → amber.
- [ ] History heatmap (calendar) months; per-day popover correct.
- [ ] **Forgot clock-out** → `has_open_shift` flagged + HR/Admin alerted (scheduler) → correct via manual correction → re-reconciles.
- [ ] Cross-midnight attributed to clock-in date.
- [ ] HR sees own department in overview/today/graph; Admin sees all.
- [ ] **Export downloads** with correct Bearer token (G1 fixed) — no 401.
- [ ] State-machine rejects invalid sequences with a clear toast.

### 4.5 Leave Module (DR-028)
- [ ] Employee submits → HR approves (optimistic badge flip) → attendance days in range = `leave`
      (**only working days Mon–Sat**; Sundays skipped — G2 fixed).
- [ ] HR submits → Admin approves/rejects (with reason).
- [ ] Duplicate pending overlap rejected (partial-unique index).
- [ ] Holiday calendar (month view) shows seeded + recurring holidays.
- [ ] Bell notifications on submit + decision (Reverb push).
- [ ] History filters by status/type/date.

### 4.6 Shell, design, responsive, a11y, perf
- [ ] 3-state sidebar (Hidden/Collapsed-default/Expanded), Ctrl+B, persists, per-module accents, mobile bottom nav + hamburger.
- [ ] Login + all screens: white/light base, brand accents, correct logo (no AI-slop gradient).
- [ ] Responsive 360/768/1024/1440 — no broken layouts/overflow.
- [ ] Lighthouse: LCP≤2.5s, INP≤200ms, CLS≤0.1, First-Load≤200KB gz/route.
- [ ] axe-core: zero critical/serious.

---

## §5 — Final go-live sequence

1. **Close the §2.2 gaps** (G1 first; then G2/G4; then G3/G5/G6/G7).
2. **Commit & push** everything (the §2.1 session fixes + §2.2 gap fixes).
3. **Do the §1.3 dashboard unblock** (disable Vercel Protection; set `NEXT_PUBLIC_API_URL`; redeploy Railway with PHP 8.4; migrate + seed production Supabase).
4. **Run the §4 end-to-end verification** — every checkbox.
5. **Final clean production redeploy** (web + api); clear caches.
6. **Watch monitoring** (Sentry + Laravel Pulse + Vercel web-vitals) for 7 days; fix any p75 regressions; declare go-live.

### §5.1 Go-live declaration
**READY FOR DAY-TO-DAY PRODUCTION USE when:** users can log in and stay logged in; each role accesses
only its permitted screens/actions; real data persists; attendance clock in/out/break + history +
corrections + HR/Admin views work; leave request → approval → attendance integration works (working-
days aware); and the app is responsive, accessible, and fast — with no placeholders, dead buttons, mock
data, broken workflows, inconsistent UI, or missing permissions.

---

## §6 — Scope reminder (do NOT expand before go-live)

Per ADR-022: **M1 = Base + Attendance + Leave only.** Projects/Tasks/Chat/Announcements/Reports code
exists in the repo (built beyond M1) but is **not** a go-live criterion. Their dashboard widgets must
show **true empty states** (no mock data), and their nav entries must not break the shell. If any of
their endpoints threaten M1 stability, disable the nav entry rather than fix it. Tracked in
`plan-future-modules.md`.

---

### TL;DR for the owner
1. **Login is broken because of Vercel Deployment Protection (SSO)** on the deployed preview URL — not
   a code bug. **Fix it in the Vercel dashboard** (§1.3 ①) + set `NEXT_PUBLIC_API_URL` (②) + redeploy
   Railway with the corrected PHP 8.4 nixpacks (③). **That's the unblock.** I proved the code works by
   running the backend against your production DB (login returns a real token).
2. **I fixed 4 things in code** this session (nixpacks PHP version, a migration SQL bug that was failing
   the test suite, the login 401 interceptor, manifest color). Tests now pass 7/7.
3. **The real gap list is short** (§2.2: G1–G7) — mostly small. G1 (export token) and G2 (leave working-
   days) are the ones that affect daily use; the rest are polish/correctness.
4. **Everything else earlier called a "gap" is already done** (§3) — don't re-fix it.
5. Close §2.2, do §1.3, run §4, redeploy (§5) → live.
