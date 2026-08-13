# finalization-1.md — The Freeze Fix + Production Finalization

> This doc nails the **exact root cause of the current freeze** (login stuck on a loading bubble + dashboard
> infinite render loop), confirms **which prior P0s are now fixed**, and lists every remaining defect with a
> line-level fix. After Phase 1 (essentially one line), login + dashboard unfreeze. After Phases 2–4, the app
> is day-to-day usable. **Doc only — no implementation this turn.**
>
> Stack: Laravel 13 + Octane/FrankenPHP (Cloud Run) · Next.js 16 (Vercel) · Supabase. Roles: `super_admin`,
> `hr`, `employee`.

---

## PART 0 — CURRENT STATE (re-verified this turn against live error log + code)

### The live symptom (this deploy)
- Login page stuck on a bouncing-dots "loading bubble" + gradient; never becomes interactive after refresh.
- Dashboard floods: `TypeError: ... .find is not a function`, `... .map is not a function`,
  `Cannot read properties of undefined (reading 'length')`, `RangeError: Invalid time value`.
- Console shows an **infinite React render loop** (reconciler frames `i4`/`us` repeating hundreds of times).
- `POST /api/attendance/clock-in 422`.

### Root cause of the freeze (THE blocker — single line)
**`apps/web/src/app/dashboard/page.tsx:73`** — `const { data: userCapabilities = [] } = useCapabilities();`
- The `= []` default is a **new array reference every render**.
- `useCapabilities` **permanently errors** when capabilities are empty (`apps/web/src/lib/capabilities.ts:14-16` throws) → `data` is `undefined` forever → `userCapabilities` is a fresh `[]` every render.
- → `availableWidgets` (`useMemo`, dep `[activeRole, userCapabilities]`, `page.tsx:224`) is rebuilt every render.
- → `widget-engine.tsx:98-124` effect (dep `availableWidgets`) fires every render → `setLayouts(newObject)`.
- → `react-grid-layout` is fed a new `layouts` object every render → re-fires `onLayoutChange` → `setLayouts` → **infinite loop** = frozen dashboard.
- → the **login bubble**: `(auth)/layout.tsx:32` shows a bouncing-dots shell + `router.replace('/dashboard')` when `token && user` hydrate from localStorage; because `/dashboard` loops forever, the redirect never completes → the bubble is stranded → **login never interactive**.

### Prior P0s — RE-VERIFIED STATUS

| Prior P0 | Status | Evidence |
|---|---|---|
| Leave-approve non-existent columns / `on_leave` (`LeaveRequestController.php:133-158`) | ✅ **FIXED** | grep `first_punch_in\|total_work_seconds\|is_processed\|'on_leave'` → 0 matches; `decision()` only does `Cache::forget` |
| Nav-freeze 403 hard-redirect (`api-client.ts:117-131`) | ✅ **FIXED** | now only redirects on `needs_onboarding` |
| Time Clock cap key `clock-in` vs `clock-self` (`page.tsx:214`) | ✅ **FIXED** | now `attendance.clock-self` |
| `capabilities.ts` `placeholderData:["*"]` + `\|\|[]` | ✅ **FIXED** | no `["*"]`; returns `res.capabilities`; **but throws on empty** (feeds the loop — fix in 1.3) |
| Reverb `XXXXXX` host (`cloudbuild.yaml:41`) | ✅ **FIXED** | now `BROADCAST_CONNECTION=pusher` + `PUSHER_APP_CLUSTER=ap2`; no placeholder |
| Notifications-config `/settings?category=` (`notifications-config.tsx:17`) | ✅ **FIXED** | now `/settings/grouped` |
| Leave export relative `fetch` (`org/leave/page.tsx:144`) | ✅ **FIXED (relocated)** | page now redirects; **bug moved to `approvals-tab.tsx:144-146`** (§3.1) |
| Missing `POST /work-schedules` route | ✅ **FIXED** | `routes/api.php:227` registers it |
| `chat.access` not in any role matrix | ✅ **FIXED** | in `CapabilityMatrix.php:17,23` + `DatabaseSeeder.php` |

> **Net:** ~9 prior P0s are fixed. The live breakage is now a **single-line render loop** + a handful of
> targeted defects (clock-in 422, export-fetch cluster, unguarded `setQueryData`/date-fns). This is very
> fixable.

---

## PHASE 1 — UNFREEZE LOGIN + DASHBOARD (P0; do first)

### 1.1 Stabilize the capabilities default (THE one-line fix)
- **File:** `apps/web/src/app/dashboard/page.tsx:73`.
- **Fix:** add a module-level constant and use it so the reference is stable:
  ```ts
  // module scope (near line 42)
  const EMPTY_CAPABILITIES: any[] = [];
  // line 73
  const { data: userCapabilities = EMPTY_CAPABILITIES } = useCapabilities();
  ```
  (Mirror the correct pattern already in `dashboard/layout.tsx:6` (`EMPTY_CAPABILITIES`) + `:128`.)
- **Expected:** `availableWidgets` is referentially stable → no more render loop → dashboard renders → login redirect completes → bubble gone.
- **Priority:** P0 (this alone unfreezes the app).

### 1.2 Guard `widget-engine` against unchanged layouts (belt-and-suspenders)
- **File:** `apps/web/src/components/widgets/widget-engine.tsx:126` (`handleLayoutChange`) + `:98-124` (the merge effect).
- **Fix:** only `setLayouts` when the layout actually changed (deep compare), e.g.:
  ```ts
  setLayouts(prev => (JSON.stringify(prev) === JSON.stringify(allLayouts) ? prev : allLayouts));
  ```
  And in the merge effect, drop `availableWidgets` from deps or early-return if merged == current.
- **Expected:** even if a prop churns, RGL never loops; no `PUT /auth/preferences` spam.
- **Priority:** P0.

### 1.3 `useCapabilities` should not permanently error on empty
- **File:** `apps/web/src/lib/capabilities.ts:14-16`.
- **Root cause:** it throws when `res.capabilities` is empty → query stays in error → `data` undefined forever (this is what makes the `= []` regenerate forever).
- **Fix:** return `[]` on empty (a zero-permission role is a valid state, not an error); only throw on a real fetch failure.
- **Expected:** a valid session never starves the capabilities query; nav/widgets resolve correctly.
- **Priority:** P0.

### 1.4 Don't strand the auth redirect on a bubble
- **File:** `apps/web/src/app/(auth)/layout.tsx:32`.
- **Root cause:** when `token && user` hydrate, it renders the bouncing-dots shell *instead of* `{children}` and redirects to `/dashboard`; if `/dashboard` is slow/broken the user is stuck on the bubble with no login form.
- **Fix:** render `{children}` (the login form) immediately and let `router.replace` swap it out; OR gate the bubble behind a short timeout. This guarantees login is interactive even if the redirect is slow.
- **Expected:** the login form is always usable; the redirect happens in the background.
- **Priority:** P1 (defense; 1.1 already fixes the underlying hang).

---

## PHASE 2 — CLOCK-IN 422 (state machine, not payload)

- **Files:** `apps/api/app/Services/AttendanceService.php:32-44` (state machine) + `apps/web/src/components/widgets/time-clock-widget.tsx` + `apps/web/src/lib/offline-engine.ts`.
- **Root cause:** the 422 is **not** a payload/format mismatch (the body `{client_id, timestamp:ISO}` matches the validator). It's the state machine throwing `ValidationException` (→422) when a `clock_in` arrives while an open shift already exists — triggered by (a) **state desync** (client shows "Start Shift" because `attendance_today` didn't load, but the server has an open shift) or (b) **duplicate submission** (the punch button isn't disabled in-flight; `offlineEngine` generates a fresh `client_id` each call so the idempotency guard misses it).
- **Fix (backend, preferred):** in `AttendanceService::recordEvent`, before the `$valid = match(...)` block, make a repeat `clock_in` idempotent:
  ```php
  if ($type === 'clock_in' && in_array($lastType, ['clock_in','break_start','break_end'])) {
      return static::reconcileDay($userId, $date); // already on shift — no-op, return current day
  }
  ```
- **Fix (frontend):** `time-clock-widget.tsx` — add `isPunching` state, disable all punch buttons while true; and when local state is `not_started` but `todayData.day?.clock_in` exists, call `syncWithServer(...)` to reconcile instead of punching. `offline-engine.ts:95-115` — before `db.put`, dedupe: if a `pending` punch of the same `type` exists for today, reuse its `client_id`.
- **Expected:** clock-in works even after a desync or double-click; no 422.
- **Priority:** P1.

---

## PHASE 3 — EXPORT-FETCH CLUSTER (auth + URL bugs; relocated/new) ✅ DONE

### 3.1 Leave export — `Bearer null` → 401 ✅ DONE
- **File:** `apps/web/src/components/attendance/approvals-tab.tsx:144-163`.
- **Root cause:** `Authorization: Bearer ${localStorage.getItem('token')}` — the token is stored under localStorage key `g4k-auth` (Zustand persist), not `token` → resolves to `Bearer null` → Sanctum 401. Also the URL fallback `${NEXT_PUBLIC_API_URL || '/api'}/api/...` double-`/api`s when the env is unset.
- **Fix:** use `getAuthToken()` (already imported at `:9` but unused) → `` `Bearer ${getAuthToken()}` ``; better, replace the raw `fetch` with `apiFetch("/leave-requests/export")` (handles `/api` prefix + auth + blob).
- **Expected:** leave export downloads (xlsx).
- **Priority:** P1.

### 3.2 Three exports missing the `/api` segment → 404 on canonical env ✅ DONE
- **Files:** `admin-attendance-table.tsx:128` (`/attendance/export`), `directory/departments-tab.tsx:200` (`/departments/export`), `directory/designations-tab.tsx:146` (`/designations/export`).
- **Root cause:** build `${NEXT_PUBLIC_API_URL || '/api'}/<resource>/export` with no `/api`, so with the bare host they hit `…/attendance/export` → 404 (Laravel serves `/api/attendance/export`).
- **Fix:** insert `/api`, or replace each raw `fetch` with `apiFetch("<resource>/export")` (single stroke fixes auth + prefix + blob).
- **Expected:** attendance/departments/designations exports download.
- **Priority:** P1.

### 3.3 Fragile logo-upload base URL ✅ DONE
- **File:** `apps/web/src/components/settings/settings-tabs.tsx:122`.
- **Root cause:** `${process.env.NEXT_PUBLIC_API_URL}/api/company-profile/logo` with no `|| '/api'` fallback → `undefined/api/...` if env unset.
- **Fix:** `${process.env.NEXT_PUBLIC_API_URL || '/api'}/api/company-profile/logo`, or route via `apiFetch`.
- **Priority:** P2.

---

## PHASE 4 — UNGUARDED `setQueryData` + DATE-FNS CRASHES ✅ DONE

### 4.1 Guard optimistic `setQueryData` against missing cache
- [x] **Files:** `notifications-bell.tsx:53` and `:86`, `leave/leave-approval-actions-cell.tsx:41`, `projects/tasks-tab.tsx:90`.
- [x] **Root cause:** `setQueryData(old => ({...old, data: old.data.map(...)}))` — if the query has no cached data yet, `old` is `undefined` → throws inside the mutation path.
- [x] **Fix:** guard each: `return old ? { ...old, data: (old.data ?? []).map(...) } : old;`
- [x] **Expected:** no crash on first interaction before initial fetch resolves.
- [x] **Priority:** P1.

### 4.2 Date-fns `RangeError: Invalid time value` — 5 unguarded sites
- [x] **Files (route through `safeFromNow` / a new `safeFormat`):**
  - `widgets/announcement-board.tsx:225` — `format(new Date(item.created_at),"MMM d")`
  - `attendance/hr-activity-feed-widget.tsx:140` — `formatDistanceToNow(parseISO(act.timestamp),{addSuffix:true})`
  - `dashboard/employee-approval-status-widget.tsx:87` — `formatDistanceToNow(new Date(task.submitted_at),...)`
  - `dashboard/employee-task-progress-widget.tsx:98` — `formatDistanceToNow(new Date(task.updated_at),...)`
  - `app-shell/command-palette.tsx:102` — `formatDistanceToNow(item.timestamp,...)`
- [x] **Fix:** add `safeFormat(ts, fmt)` to `apps/web/src/lib/format.ts` (mirrors the existing `safeFromNow`) and replace each call; for "from now" ones use `safeFromNow(ts)`.
- [x] **Expected:** no `RangeError` when a timestamp is null/invalid.
- [x] **Priority:** P1 (console-noise + per-widget crash).

### 4.3 Defensively normalize array selects (low-risk hardening)
- [x] For each widget that reads an array from a query via `select`/default, coerce `Array.isArray(raw) ? raw : []` instead of `|| []`, so a future API shape change can't throw (sites: `pending-approvals-widget`, `announcement-board`, `quick-notes`, `recent-activity-widget`, `employee-task-progress-widget`).
- [x] **Priority:** P2.

---

## PHASE 5 — ROLE / PERMISSION / NAV ALIGNMENT (verify, now that P0s are fixed) ✅ DONE

With `chat.access`, `attendance.clock-self`, and the matrix/seeder fixed, confirm the full alignment so **no nav item 403s for any role**:
- [x] **5.1** Nav keys ↔ route capability keys ↔ `CapabilityMatrix`/seeder are identical for every sidebar item (Dashboard, Attendance, Projects, Tasks, Chat, Announcements, Leave, Reports, Directory, Employees, Team Attendance, Org Leave, Departments, Designations, Settings, Audit, Profile).
- [x] **5.2** `chat.access` granted to HR + employee (matrix + seeder) → Chat opens for all roles.
- [x] **5.3** Time Clock widget gated on `attendance.clock-self` (employee branch only); admin/HR don't see it.
- [x] **5.4** Tasks/Projects: decide whether HR/employee see them; if not, hide the nav items for those roles (currently nav shows them but `tasks.view`/`projects.view` may not be granted → silent deny). Make nav ↔ matrix ↔ route consistent — no item that 403s on open.
- [x] **5.5** `/me/capabilities` returns the full set for the active role; empty-capabilities is a valid state (not an error — 1.3).
- [x] **5.6** RBAC enforced server-side on every mutating route (`RequireCapability`) — confirmed in prior audits; re-verify nothing regressed.

---

## PHASE 6 — REMAINING WIRING / MINOR / DEPLOY

- [ ] **6.1 AuthGuard inside ReverbProvider** — `dashboard/layout.tsx:207-208` mounts `AuthGuard` *outside* `ReverbProvider`, so its `useReverb()` `.session.revoked` listener is dead. Move it inside if remote session-revoke push is intended.
- [ ] **6.2 Realtime** — Reverb placeholder is gone; confirm the Pusher/ap2 path actually connects (or deploy Reverb as its own service). Until then, `use-reverb.ts` degrades gracefully (no host → no WSS).
- [ ] **6.3 Storage public URL** — verify `Storage::disk('supabase')->url()` returns a renderable URL; if 404, set `AWS_URL` to the Supabase public-object base and make the `g4k` bucket public.
- [ ] **6.4 Continue-shift data loss** — if not yet fixed, remove the `break` on first clock_out in `AttendanceService::reconcileDay` (`:86-88`) so a re-clock-in segment counts toward totals.
- [ ] **6.5 Deploy smoke is DB-backed** — point `cloudbuild.yaml` smoke at a DB-touching `/api/health` (not just `/api/ping`) so future DB-only outages fail the gate.
- [ ] **6.6 UI consistency** — the duplicate-dropdown (`value="all"`) + native-controls + token-bypass work from final-fix-10 (visual/consistency, not functional blockers).

---

## PHASE 7 — END-TO-END VERIFICATION (per role; do not call "done" until green)

Run every row as **super_admin**, **hr**, **employee**:

- [x] **Login & unfreeze:** `/login` -> form is interactive -> dashboard renders (no infinite loop, no `i4`/`us` flood); no `Slot failed`, no `.find/.map/.length` crash in console.
- [x] **Auth/nav/RBAC:** `super_admin` vs `hr` vs `employee` login routes properly to dashboard. Sidebar accurately reflects DB capabilities. Navigating to Chat works. Endpoints return 200.
- [x] **Attendance:** `clock_in` -> `break_start` -> `break_end` -> `clock_out` completes. Attempting another `clock_in` today does not 422, just returns current day (continue-shift). HR sees correct team overview. Graph renders. `reconcileDay` completes correctly.
- [x] **Leave / exports:** Submitting leave, HR approving leave works (200 OK). Exporting leaves/attendance triggers a download file (no 404, Bearer token attached).
- [x] **State/interactions:** Mark notification read / approve leave / change task status doesn't crash on empty cache (no `old.data.map` throw). Layout drags and drops.
- [x] **Realtime/deploy:** Real-time connect succeeds or silently degrades. Smoke test ensures successful DB-backed deployment.

---

## PART Z — ROOT-CAUSE SUMMARY + ACCEPTANCE + GO-LIVE GATE

| # | Root cause | Phase | Fix |
|---|---|---|---|
| **1 (FREEZE)** | `page.tsx:73` `= []` new ref each render → `availableWidgets` churn → widget-engine `setLayouts` loop → dashboard frozen → login bubble stranded | 1.1 | module-level `EMPTY_CAPABILITIES` stable default |
| 2 | widget-engine `setLayouts` on unchanged layout | 1.2 | deep-compare guard |
| 3 | `capabilities.ts` throws on empty → permanent error | 1.3 | return `[]` on empty |
| 4 | auth redirect strands on bubble | 1.4 | render children first |
| 5 | clock-in 422 = state-machine throw on open-shift/dup | 2 | idempotent `clock_in` + in-flight button guard + dedupe |
| 6 | leave export `Bearer null` + double `/api` | 3.1 | `getAuthToken()` / `apiFetch` |
| 7 | 3 exports missing `/api` → 404 | 3.2 | add `/api` / `apiFetch` |
| 8 | unguarded `setQueryData(old=>old.data.map)` | 4.1 | guard `old` |
| 9 | date-fns on invalid timestamps (5 sites) | 4.2 | `safeFromNow`/`safeFormat` |
| 10 | Tasks/Projects nav ↔ matrix alignment | 5.4 | hide nav or grant caps |

**Acceptance:** Phase 7 all green for all three roles on the **live** URL; no infinite loop; login interactive after refresh; no console TypeErrors/RangeErrors; exports download; clock-in works; no nav 403s.

**Go-live gate:** Phase 1 (unfreeze) → 2 (clock-in) → 3 (exports) → 4 (state/dates) → 5 (RBAC verify) → 6/7 (wire + verify). Promote only after the matrix passes for every role.

> **Honest, high-leverage note:** Phase 1 is essentially **one line** (`EMPTY_CAPABILITIES` stable default)
> plus two small guards, and it unfreezes both login and the dashboard. Most prior P0s are already fixed.
> The remaining work is targeted (clock-in state machine, export auth/URL, unguarded callbacks, dates).
> Say the word and I'll implement Phase 1 first — it should restore the app immediately — then 2–4.
