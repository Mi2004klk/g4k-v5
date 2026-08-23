# attendance.md — Attendance Module: End-to-End Audit & Centralized Remediation

> **Date:** 2026-08-21 · **Scope:** the complete Attendance & Time domain — clock-in/out, breaks, live timer, worked/break/overtime totals, statuses, widgets, history, corrections, leave integration, reminders, offline sync, permissions, timezone, refresh/navigation behavior.
> **Method:** every flow traced frontend → API → service → DB → frontend state/UI; all duplicate/conflicting implementations catalogued with root causes; then a centralized fix implemented on a single source of truth.
> **Data safety:** no schema changes required; all columns involved already exist. Statuses are re-derived only from the immutable `attendance_events` log (the system's design intent), so historical records remain reconstructible and are never destroyed.

---

## 1. Architecture As Found (flow map)

```
┌─ UI punch sources ─────────────────────────────────────────────────────────┐
│ TimeClockWidget (dashboard + /attendance page, capability-gated)            │
│   handlePunch(type):                                                       │
│     1. optimistic timer-store update (startTimer/startBreak/endBreak/stop) │
│     2. offlineEngine.recordPunch(type, clientTimestamp) → IndexedDB        │
│        (client_id-deduped; syncs online immediately or on reconnect)        │
│     3. invalidate dashboardInit → refetch → syncWithServer(server truth)   │
│     error path: syncWithServer(cached) + invalidate  (rollback)            │
└────────────────────────────────────────────────────────────────────────────┘
        │ POST /attendance/{clock-in|start-break|end-break|clock-out}
        ▼
api.php:111-123  capability: attendance.clock-self (Admin excluded by design) + throttle:15,1
        ▼
AttendanceController::handlePunch (AttendanceController.php:41-101)
  - validates client_id (required), timestamp (≤5min future, ≥48h past — offline bound)
  - AttendanceService::recordEvent(...)   ← THE state machine
  - AuditLogger (every punch)
  - Cache::forget dashboard/metrics/attendanceSummary/attendance_day caches
  - broadcast(AttendanceUpdated) on private company.global (broadcastAs 'attendance-updated')
        ▼
AttendanceService::recordEvent (AttendanceService.php:18-81)
  - DB::transaction + SELECT ... FOR UPDATE on the user row  (race protection)
  - state machine on last event type: clock_in/break_start/break_end/clock_out
  - duplicate clock_in → silent no-op; invalid transitions → 422
  - idempotency by client_id (offline double-sync safe)
  - overnight shifts: reconciles on the shift's START date (48h window)
        ▼
AttendanceService::reconcileDay (:86-296)  ← single backend source of truth
  - replays ALL events of the shift-day → total_seconds (breaks excluded),
    break_seconds, unapproved_break_seconds, overtime = total − standard,
    late = first clock-in − (schedule start + grace), holiday detection
    (incl. recurring + Feb-29→Feb-28), status = holiday|present|late|absent,
    has_open_shift, version++ ; manual days preserve corrected status
  - upserts attendance_days (immutable attendance_events never modified)
        ▼
Read paths:
  meToday (ETag + 30s private cache) → timer-store.syncWithServer → LiveTimer tick
  meHistory (cursor or month) + per-day project/task time logs → history calendar
  teamToday (HR-scoped, 60s server cache) → HR console/widgets
  admin overview (paginated, filters, ETag) → admin console
  corrections (HR/Admin, scoped, reason ≤500, audited, employee notified)
  LeaveAttendanceIntegration (queued) → writes on_leave days on leave approval
  Scheduler (g4k-worker Cloud Run): RemindShiftStart / AlertMissedClockIn /
    FlagOpenShifts every 5 min; weekly summary Sun 09:00
```

**Verdict:** the backend core (immutable event log + `reconcileDay` replay + row-lock state machine + client_id idempotency) is a sound, race-safe, audit-grade design and is the natural single source of truth. The defects concentrate in (a) the fan-out around it — cache keys, realtime event names, the leave integration bypassing the service — and (b) the frontend, where state/status/time formatting is re-derived 3–4 independent ways instead of reading from the one synced store.

---

## 2. Findings (root causes, evidence, impact)

### CRITICAL/HIGH

| ID | Finding | Root cause | Evidence | Impact |
|---|---|---|---|---|
| ATT-F-01 | **HR/Admin attendance tables never live-update** despite realtime | 3 components subscribe to `.attendance.updated` (dot) but `AttendanceUpdated::broadcastAs()` returns `'attendance-updated'` (dash) — copy-paste drift | `hr-attendance-table.tsx:94`, `admin-attendance-table.tsx:91`, `hr-attendance-analytics.tsx:41` vs `AttendanceUpdated.php:40-44`. Correct consumers: `use-dashboard-init.ts:15`, `admin-attendance-analytics.tsx:22`, `admin-open-shifts-table.tsx:74` | Spec §5.9 flagship "updates automatically, no refresh" is dead in the two main consoles; falls back to manual refresh only |
| ATT-F-02 | **HR + Admin "Team Attendance Today" widget counts truncate at 20 rows** | Widgets aggregate `present/total` client-side from `/attendance/hr/today` / `/attendance/admin/overview`, which are **paginated** (`per_page` default 20) — while the purpose-built `/attendance/team-today` (server-side `counts` + full list) is used by neither | `hr-team-attendance-widget.tsx:20-31` (hrToday = `overview()` alias, `AttendanceController.php:359-362`); `admin-today-attendance-widget.tsx:17-19` | Dept >20 staff shows "12/20" instead of "12/30"; spec §4.2 KPI wrong |
| ATT-F-03 | **Leave approval bypasses the attendance service** | `LeaveAttendanceIntegration` writes `attendance_days` directly via `DB::table()` | `Listeners/LeaveAttendanceIntegration.php` (whole file) | Four concrete sub-defects: (a) uses the **default** schedule's working days while balance deduction uses the **user's** schedule (`LeaveRequestController::calculateWorkingDays:96-125`) → marked days ≠ deducted days possible; (b) no Feb-29→Feb-28 recurring fallback (reconcileDay has it); (c) sets `source:'server'` on update, clobbering HR's `manual` corrections; (d) never invalidates `attendance_day_{u}_{d}` / `attendanceSummary_{u}` caches → stale reads |
| ATT-F-04 | **`unapproved_break_seconds` is computed but never persisted** | Column exists (migration `2026_08_13_233223:22`) but `AttendanceDay::$fillable` omits it → Eloquent mass-assignment silently discards it in `reconcileDay`'s `updateOrCreate` | `Models/AttendanceDay.php:10-16` vs `AttendanceService.php:273` | The approved/unapproved break split (the point of that migration) doesn't function; any future report on it reads zeros |
| ATT-F-05 | **`team_today_*` cache: stale + cross-HR collision** | Cache key is `{role}_{user→department_id}_{date}` but the data is HR-scope-wide (all managed depts); TTL 60s; never invalidated by punches | `AttendanceController.php:269` vs `handlePunch` forget-list `:87-91` | (a) HR console lags ≤60s even after realtime refetch (compounds ATT-F-01); (b) two HRs sharing an own-department see each other's managed-dept data (same class as the report cache leak) |

### MEDIUM

| ID | Finding | Root cause | Evidence | Impact |
|---|---|---|---|---|
| ATT-F-06 | **"Continue Shift" resets the visible total to 00:00:00** | `handlePunch('clock_in')` calls `startTimer(ts, 0)` — second arg is `initialTotalSeconds`, wiping the morning session's `baseSeconds` until the refetch lands | `time-clock-widget.tsx:110` vs `timer-store.ts:51-59` | User clocks back in after lunch-out and sees hours "lost" for seconds-to-minutes (longer when offline/refetch slow) |
| ATT-F-07 | **Working on a holiday renders as "holiday", not present/overtime** | `reconcileDay` short-circuits: `if ($isHoliday) status='holiday'` even when `firstClockIn` exists | `AttendanceService.php:252-258` | Spec §20.2: worked days must show present/blue-overtime; totals are right but the day mislabels |
| ATT-F-08 | **Attendance state derived 4 independent ways on the frontend** | No shared derivation: (1) `TimeClockWidget.activeState` from store; (2) `TodaySummaryCard.getStatusBadge()` from `day.status` + store; (3) shift-log dot inline mapping (`page.tsx:168`) — which also checks a **non-existent `'overtime'` status** and misses on_leave/holiday colors; (4) history-calendar `getStatus()` deriving `overtime` client-side from `overtime_seconds` | listed files | Statuses/colors disagree between surfaces; spec color guide (purple=leave, light-blue=holiday, blue=OT) only fully honored by the calendar |
| ATT-F-09 | **`standardSeconds` has 3 sources** | Widget `useState` synced from dashboardInit (staleTime 5min), `TodaySummaryCard` from `/attendance/me/today`, `timer-store.standardSeconds` set by a third path | `time-clock-widget.tsx:35,55-62`; `today-summary-card.tsx:24-30,48`; `timer-store.ts:49` | Overtime badge can differ between the two widgets during the same minute |
| ATT-F-10 | **Break derivation duplicated + frozen** | `TodaySummaryCard` re-parses events into breaks (2nd implementation after `reconcileDay`); the ongoing-break duration uses `new Date()` at render with **no ticker** → frozen until next render | `today-summary-card.tsx:69-90` | Live "on break X m" doesn't advance; two break computations can drift |
| ATT-F-11 | **Company-wide punch invalidates every user's `dashboardInit`** | `use-dashboard-init` listens on `company.global` (authz: any user) and invalidates the whole (expensive) init query for all online users on **every punch by anyone** | `use-dashboard-init.ts:13-18`; `AttendanceUpdated.php` broadcastOn; `channels.php:19-21` | Refetch storm proportional to staff × punches; also leaks punch metadata (userId+action) to all employees on the shared channel |
| ATT-F-12 | **Store fed by two differently-fresh queries** | Layout syncs store from `dashboardInit.attendance_today` (staleTime 5 min, no window-focus refetch) while the fresh `/attendance/me/today` (30s ETag) only feeds the summary card's badge | `dashboard/layout.tsx:117-126` vs `today-summary-card.tsx:17-22` | On multi-device or after backgrounding, the running timer can be seeded from 5-min-old data |
| ATT-F-13 | **Time formatting implemented 4×** | `HH:MM:SS` / `Xh Ym` duplicated in live-timer, widget render prop, summary card, attendance page | the four files | Drift risk (already: some show seconds, some don't) |

### LOW / INFO

| ID | Finding | Evidence |
|---|---|---|
| ATT-F-14 | `stopTimer` leaves `clockInTimestamp`/`currentBreakStart` stale (post-clock-out UI could read old values) | `timer-store.ts:61-67` |
| ATT-F-15 | Client-clock timestamps trusted when online (skew shifts punch time within the ±5min/48h bounds; late determination can shift) | `time-clock-widget.tsx:101`, `AttendanceController.php:51-63` |
| ATT-F-16 | `hrToday` route is a pure alias of the paginated overview — duplicate concept with `teamToday` (one endpoint, two shapes, consumers mixed) | `AttendanceController.php:359-362` |
| ATT-F-17 | Recurring-holiday coloring across years absent in the history calendar (`h.date === dateStr` exact match only; server only adjusts in `reconcileDay`/reminder job) | `attendance-history-calendar.tsx:87-99` |
| ATT-F-18 | `company.global` channel grants every employee the punch-broadcast stream (metadata only: userId+action) | `channels.php:19-21` |
| ATT-F-19 | `notifyOpenShifts` writes no audit log; gated admin-only though HR is the stated audience | `AttendanceController.php:759-805` |
| ATT-F-20 | `'pending'` exists in the status CHECK constraint but is never written; DB/`'overtime'` is not a status (frontend checks it — see F-08) | migration `2026_08_14_210758:17` |
| ATT-F-21 | timer-store `persist` + `skipHydration` and no rehydrate call — persistence is dead weight (benign: server is the real source); the store also hosts the unrelated project-timer domain | `timer-store.ts:237-240` |
| ATT-F-22 | Graph endpoints referenced by analytics tabs (`/attendance/hr/graph`, `/attendance/admin/graph`) don't exist → Trends tabs 404 (carried from main audit AUD-REPORT-11) | `hr-attendance-view.tsx:37`, `admin-attendance-view.tsx:59` vs `api.php` |

**Verified sound (no action):** row-lock + transaction state machine; client_id idempotency aligned with the offline engine's dedupe (same type+day reuses the id); offline punch ordering (monotonic `evt_{ms}` keys); 4xx sync-failure rollback via `attendance-sync-failed`; overnight-shift anchoring; corrections flow (scope + reason + audit + notify + forced recompute + manual-source preservation in `reconcileDay`); ETag caching on reads; scheduler jobs live on `g4k-worker`; Admin correctly denied `attendance.clock-self` via the capability matrix.

---

## 3. Centralized Solution (design)

**Principles:** `attendance_events` (immutable) + `AttendanceService::reconcileDay` remain the only writers of derived truth. Frontend has exactly **one** runtime store (`timer-store`) seeded by exactly **one** fresh query (`/attendance/me/today`), and **one shared library** for derivation/formatting. Leave integration goes **through** the service. Cache keys are per-user and invalidated by the write paths that own them.

### Backend changes
1. **`AttendanceService::markLeaveDays(User, start, end)`** — new service method absorbing `LeaveAttendanceIntegration`'s logic: user's schedule working days (falls back to default), recurring + Feb-29→28 holiday exclusion, skips days actually worked, **preserves `manual` source**, and invalidates `attendance_day_*`/`attendanceSummary_*`/dashboard caches. The listener becomes a thin caller. *(fixes F-03 a–d)*
2. **`AttendanceDay::$fillable` += `unapproved_break_seconds`** *(fixes F-04)* — column already exists; historical zeros stay zeros and become correct going forward.
3. **`reconcileDay` holiday precedence** — a day with clock-ins derives present/late (overtime still computed); `holiday` status only when no clock-in. Statuses derive from events, so this self-corrects historical mislabels on the next reconcile touch without touching stored history destructively. *(fixes F-07)*
4. **`teamToday` cache key → `team_today_u{userId}_{date}`** (kills the cross-HR collision) **and** `handlePunch` now forgets the `team_today_u{...}` keys of the punching user's HR managers + super_admins, using one `RoleAssignment` lookup. *(fixes F-05)*
5. **`handlePunch` midnight-safe day-cache invalidation** — forget `attendance_day_{user}_{reconciledDate}` (was hardcoded "today", wrong for overnight clock-outs).

### Frontend changes
6. **New `src/lib/attendance.ts`** — the shared derivation/formatting layer: `formatDuration` (HH:MM:SS), `formatHoursShort` (Xh Ym), `deriveAttendanceState(day, events)` → `not_started|active|on_break|completed`, `deriveBreaks(events, nowMs)` (live ongoing break), `dayStatusColor(status, overtimeSeconds)` (canonical spec palette incl. on_leave purple, holiday light-blue, OT blue). *(fixes F-08/09/10/13 at the root)*
7. **TimeClockWidget** — syncs the store from the fresh `attendanceToday` query (not the 5-min-stale dashboardInit slice); reads `standardSeconds` from the store; **Continue Shift preserves `baseSeconds`**; all formatting via the shared lib. *(fixes F-06, F-09, F-12)*
8. **Dead listeners fixed** — `.attendance.updated` → `.attendance-updated` in HR table, admin table, HR analytics. *(fixes F-01)*
9. **HR + Admin today widgets** — switch to `/attendance/team-today`, counts from the server `counts` object, top-3 list from `employees`. *(fixes F-02)*
10. **`use-dashboard-init`** — on `attendance-updated`: always invalidate the cheap `attendanceToday`/history queries; invalidate the full `dashboardInit` **only for users with team-visibility capability**. *(fixes F-11 refetch storm)*
11. **timer-store** — `stopTimer` clears `clockInTimestamp`/`currentBreakStart`; (store keeps project timer as-is — out of scope). *(fixes F-14)*
12. **TodaySummaryCard / attendance page** — consume the shared lib (single status color map incl. the removed `'overtime'`-status branch, ticking ongoing break).

**Deliberately not changed:** event-sourcing model, endpoints/contracts (all existing consumers keep working — `hrToday` alias stays for the org-page table), the offline engine, corrections flow, scheduler jobs. **No migration is added.**

---

## 4. Implementation Record

| # | Change | File(s) |
|---|---|---|
| 1 | `markLeaveDays` service method + listener rewrite | `app/Services/AttendanceService.php`, `app/Listeners/LeaveAttendanceIntegration.php` |
| 2 | fillable fix | `app/Models/AttendanceDay.php` |
| 3 | holiday-work precedence | `app/Services/AttendanceService.php` |
| 4-5 | team-today per-user cache + punch invalidation; midnight-safe day-cache key | `app/Http/Controllers/AttendanceController.php` |
| 6 | shared derivation/format lib | `apps/web/src/lib/attendance.ts` (new) |
| 7 | TimeClockWidget re-source + continue-shift fix | `apps/web/src/components/widgets/time-clock-widget.tsx` |
| 8 | listener name fixes ×3 | `hr-attendance-table.tsx`, `admin-attendance-table.tsx`, `hr-attendance-analytics.tsx` |
| 9 | widgets → team-today | `hr-team-attendance-widget.tsx`, `admin-today-attendance-widget.tsx` |
| 10 | capability-gated init invalidation | `apps/web/src/hooks/use-dashboard-init.ts` |
| 11 | store cleanup | `apps/web/src/stores/timer-store.ts` |
| 12 | shared-lib adoption | `today-summary-card.tsx`, `app/dashboard/attendance/page.tsx` |

## 5. Testing & Verification Plan

**Automated (run in CI/local before deploy):**
1. `cd apps/api && php artisan test --filter=Attendance` and `--filter=HrAttendanceWorkflow` and `--filter=Leave` (leave integration touched).
2. `cd apps/web && ../../node_modules/.bin/tsc --noEmit` + `pnpm --filter web build`.

**Manual matrix (staging, 3 roles):**

| # | Scenario | Expected after fix |
|---|---|---|
| 1 | Employee clock-in → break → break-end → clock-out | Timer accumulates across all; breaks excluded from worked; day shows present/late correctly |
| 2 | Clock out **while on break** | Break auto-closed; no orphan break; totals correct |
| 3 | Clock out → **Continue Shift** | Total **keeps accumulating** from prior session (no 00:00:00 reset) |
| 4 | Refresh mid-shift / navigate away & back | Timer resumes from server truth within one `me/today` fetch; no reset |
| 5 | Two rapid double-clicks on a punch button | One event recorded (client_id dedupe + state machine no-op) |
| 6 | Offline: punch in → punch out → reconnect | Punches sync in order; totals correct; no duplicates |
| 7 | HR console open while employee punches | Table + widget update within seconds (dash event + fresh cache) — verify both widgets show full team counts (>20 members if available) |
| 8 | Work on a holiday | Day shows present + overtime, not "holiday" |
| 9 | Approve leave spanning holidays/weekends | Only user-schedule working days marked on_leave; a manually-corrected day is preserved; employee's history calendar shows purple immediately |
| 10 | Two HRs with different managed depts | Each team-today payload contains only their depts (no shared cache) |
| 11 | Admin views team-today console | Live updates; counts = whole company |
| 12 | HR correction on a leave-marked day | Manual source preserved; subsequent punches recompute around it |
| 13 | Unapproved-break reporting | `attendance_days.unapproved_break_seconds` > 0 after break without approval flow |
| 14 | Role gates | Admin sees no clock buttons anywhere (dashboard widget, attendance page, mobile FAB hidden); employee cannot reach HR/Admin endpoints (403) |

**Regression watch:** overnight shift (clock-in 23:30 → clock-out 07:00 next day totals under the start date), 48h+ offline punch rejection message, ETag 304 paths, demo-data purge untouched by these changes.

## 6. Status

- [x] Audit complete (this document)
- [x] Implementation applied (see §4)
- [x] `php artisan test` green (Attendance/Leave/HrAttendanceWorkflow suites)
- [x] `tsc --noEmit` green, `pnpm --filter web build` green
- [ ] Post-deploy live re-verification (run §5 manual matrix on staging/prod with fresh accounts)
