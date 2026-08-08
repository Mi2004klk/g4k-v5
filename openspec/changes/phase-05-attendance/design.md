# Design — attendance

## Data model (new tables)
- `attendance_days` (one row per user per date; the summary the UI reads):
  `id`, `user_id` (fk), `date` (date, tz-adjusted to company tz), `clock_in` timestamp nullable, `clock_out` timestamp nullable, `first_event` timestamp nullable, `last_event` timestamp nullable, `total_seconds` int default 0 (worked time = on-the-clock time, breaks excluded), `break_seconds` int default 0, `overtime_seconds` int default 0, `status` enum(present, absent, late, leave) default absent, `late_minutes` int default 0, `corrected_by` user_id nullable (fk, last corrector), `source` enum(local, manual, server) default server, `version` int default 1, standard timestamps. Unique `(user_id, date)`. Indexed on `(date)`, `(user_id, date)`, `(status, date)`.
- `attendance_events` (the immutable, append-only timeline — the source from which `attendance_days` is reconciled):
  `id`, `user_id` (fk), `timestamp` timestamp with tz, `type` enum(clock_in, start_break, end_break, clock_out), `project_id` bigint nullable (fk; set when an event is bound to project work, Phase 7 ties in), `device_meta` json nullable (ua/ip), `source` enum(local, server) default server, `client_id` uuid nullable (idempotency key from the Offline Engine so a queued event replayed after reconnect is not double-inserted), `created_at`. Indexed on `(user_id, timestamp)`, `(client_id)`.
- `attendance_corrections` (audit): `id`, `attendance_day_id` (fk), `corrected_by` (fk user), `field` string, `old_value` json, `new_value` json, `reason` text nullable, `created_at`. Full history of every manual edit.
- `work_schedules` (standard-hours config; seeded in Phase 2, edited in Phase 10): `id`, `name`, `start_time` time, `end_time` time, `break_minutes` int default 0, `standard_seconds` int (derived/normalized), `working_days` json (array of weekday numbers), `effective_from` date, `is_default` bool, timestamps. Drives standard hours, overtime threshold, official start time (for late badge), and reminder scheduling.

Reconciliation rule (Server-Validation, ADR-009): on each clock/break event the server rebuilds `attendance_days` for that user/date from the ordered, deduplicated `attendance_events` (idempotent on `client_id`). `total_seconds` = sum of on-clock spans minus break spans; `overtime_seconds` = max(0, total_seconds − standard_seconds); `status` = `late` if clock_in after start_time, `leave` if a leave record covers the day (Phase 6), `present` if any work recorded, else `absent`. The server's recomputed row always wins; the client replaces local state with the server response.

## API (OpenAPI additions)
All endpoints are spec-first (ADR-005), guarded by Sanctum (ADR-014) and capability middleware.
- `POST /attendance/clock-in` → `{ client_id, timestamp?, project_id? }` → 201 `{ attendance_day, event }`. Capability: `employee.clock-self`.
- `POST /attendance/start-break` → `{ client_id, timestamp?, project_id? }` → 201 `{ event }`. Capability: `employee.clock-self`.
- `POST /attendance/end-break` → `{ client_id, timestamp?, project_id? }` → 201 `{ event }`. Capability: `employee.clock-self`.
- `POST /attendance/clock-out` → `{ client_id, timestamp?, project_id? }` → 201 `{ attendance_day, event }`. Capability: `employee.clock-self`.
- `GET /attendance/me/today` → current open shift + live timer baseline + last event. Capability: `employee.clock-self`.
- `GET /attendance/me/history?from&to` → per-day summaries for the heatmap. Capability: `employee.clock-self`.
- `GET /attendance/me/day/{date}` → clock-in, breaks, clock-out, total/break/overtime seconds, projects/tasks for the clicked date. Capability: `employee.clock-self`.
- `GET /attendance/admin/overview?date&department_id&user_id&status` → company-wide rows (paginated/virtualized). Capability: `admin.view-all-attendance`.
- `GET /attendance/admin/day?user_id&date` → full summary for any person/date. Capability: `admin.view-all-attendance`.
- `GET /attendance/hr/today?status?` → today's shift status list (present/absent/late/leave). Capability: `hr.view-team-attendance`.
- `GET /attendance/hr/graph?user_id&mode=weekly|monthly&date` → graph series for a user. Capability: `hr.view-team-attendance`.
- `POST /attendance/correct` → `{ attendance_day_id, fields{}, reason? }` → writes the change + an `attendance_corrections` row; re-reconciles the day. Capability: `admin.correct-attendance` (granted to Admin and HR).
- `GET /attendance/export?from&to&department_id?&user_id?&status?` → streams `xlsx` (Content-Type `application/vnd.openxmlformats...`). Capability: `admin.view-all-attendance` and `hr.view-team-attendance`.
- Settings hooks (definitions live in Phase 10): reminder lead time and lateness-alert time read from a `attendance_settings` key set; Phase 5 only reads them and ships the scheduler.

## Realtime
- Presence channel `presence-attendance-today` (Reverb, ADR-013): on clock-in/out/break the server broadcasts an `AttendancePresenceUpdated` event with `{ user_id, status, last_event_type, at }`. Subscribers (Admin company-wide view, HR today view, the live "who's clocked in now" widget) update instantly without polling.
- A live "who's clocked in now" widget (dashboard host from Phase 4) subscribes to the same presence channel and renders the count + avatars; it degrades to a polling fallback if the channel is unavailable.
- Private `private-user.{id}` carries the employee's own `AttendanceDayReconciled` event after a server-side reconciliation so the local timer/heatmap snap to the authoritative values (matters after offline sync).

## Offline
- The timer runs entirely in the Offline Engine (ADR-010): a clock/break action writes an `attendance_events` row into IndexedDB immediately (with a generated `client_id`), the local timer recomputes from local events, and the action is enqueued for sync. The UI never blocks on the network.
- Conflict strategy = Attendance=Server-Validation (ADR-009 §9): on reconnect the Sync Manager pushes queued events to the matching endpoint using `client_id` for idempotency; the server validates ordering, dedupes, rejects events that cannot be reconciled (e.g. a `clock_out` with no open shift) by returning a structured error the client surfaces as a conflict toast, and returns the reconciled `attendance_days` row. The client then replaces its local day row with the server's. Overlaps (two clock-ins) are folded by the server into the canonical ordered timeline.
- Late arrivals: a queued event with a past `timestamp` is honored by the server and folded into the correct day by its timestamp; the day's `status`, `late_minutes`, and `overtime_seconds` are recomputed.
- Retry/backoff and queue states reuse the shared Offline Engine (no per-module retry logic).

## Scheduler
Laravel Scheduler runs two attendance jobs (configurable times, read from `attendance_settings`):
- `Attendance\RemindShiftStart` — runs every minute; for each employee whose `start_time − lead_minutes` (default 15) falls in the current minute and who has not yet clocked in today, dispatches an employee reminder (Phase 8 notification system; until Phase 8 ships, an SMTP email + an in-app row is written).
- `Attendance\AlertMissedClockIn` — runs every minute; for each employee whose `start_time + alert_minutes` (default 30) falls in the current minute and who is still not clocked in, dispatches an HR lateness alert.
- Both lead and alert minutes are configurable in settings (R5.11 / R10.2) with no code change; defaults applied via seeder.

## Charts and export
- Heatmaps and graphs use Apache ECharts (calendar heatmap component for the personal history and the overtime color band; line/bar for the HR weekly/monthly graphs). The overtime color is a distinct token from the regular worked-day color, both defined in the Phase 3 design tokens.
- Excel export uses a streaming writer (Maatwebsite/Excel or, to avoid license weight, a lightweight spout-based exporter) producing one row per user/date with clock-in, clock-out, total/break/overtime, status, and late flag; filtered by the same query params as the overview.

## Capabilities (introduced)
- `employee.clock-self` — clock in / start break / end break / clock out; read own today/history/day.
- `hr.view-team-attendance` — today view, weekly/monthly graphs, export (team scope), view linked leave requests.
- `admin.view-all-attendance` — company-wide overview + any person/date summary + export (all scope).
- `admin.correct-attendance` — manual correction; granted to both Admin and HR roles per R5.7 (the HR role receives it so HR can correct, Admin can correct and oversees all).
The role→capability rows are authored with the matrix in Phase 2; Phase 5 declares and consumes these keys.

## Test strategy
- api feature tests: clock-in/out/break ordering and timeline; reconciliation recomputes totals/overtime/status; `late` flag when clock-in after start; `client_id` idempotency prevents double-insert on replay; manual correction writes audit + re-reconciles; capability gate denies unauthorized; export streams a valid xlsx (parse header + row count).
- api conflict tests: server reconciles overlapping clock-ins, a queued clock-out with no open shift is rejected as a structured conflict, late-arriving past timestamp folds into the correct day.
- web tests: live timer counts and survives navigation; amber style on overtime; heatmap renders with overtime color; today/overview/graph views render; filters narrow results; offline path queues an event and reconciles on reconnect using the mock sync.
- scheduler tests: `RemindShiftStart` fires at `start − lead`; `AlertMissedClockIn` fires at `start + alert`; both honor overridden config times.

## Performance Requirements & Day-to-Day Workflow Optimization (Phase 5)
> Phase 5 is the **first production business module** and the **model every later module follows for
> day-to-day performance**. Attendance is the most-repeated workflow in the product — an employee
> touches it twice a day, every day, and HR/Admin lean on it constantly. Operational efficiency is
> therefore a first-class acceptance criterion, not a polish pass. Every threshold below is
> CI-enforced (a regression fails the build) and maps to `PERFORMANCE-STANDARDS.md` (P-*) and
> `REQUIREMENTS.md` R5.13–R5.16 / R13.x.

### One-tap clock in / out / break (R5.13, R13.24, R13.19, R13.22)
- The dashboard attendance widget's **Start / Pause / End is a SINGLE TAP** — never a form, never a
  modal, never a full route change. The action is reachable in **≤2 clicks from the dashboard** and
  causes **NO full reload** (P-DATAENTRY / R13.24).
- **Optimistic confirmation (R5.13, R13.19 / P-OPTIMISTIC):** the UI updates instantly (button label
  flips, timer starts/stops) the moment of the tap; the request fires in the background. On a server
  error the change is **rolled back** and a **danger toast** is shown ("Clock-in failed — reverted").
  Clock-in/out/break are safe, idempotent mutations (idempotency via `client_id`), so they qualify
  for optimistic treatment per R13.19.
- **Endpoint latency:** `POST /attendance/clock-in|start-break|end-break|clock-out` p95 ≤200ms (write
  budget ≤300ms p95; the clock actions reconcile a single day so they target the read budget — R13.4).
- **Mobile (R13.22 / P-RESP):** the Start button is **full-width, green, ≥48px** tall, pinned above
  the fold in the attendance widget; Pause/End are equally tap-sized. No hover-only affordances.
- **Double-submit prevention (R13.16):** the tapped button is disabled + dot-loader until the
  optimistic commit lands, so a panicked double-tap does not fire two events.

### Live timer performance — isolated, never re-renders the dashboard (R5.14, R13.11, R13.12)
- The HH:MM:SS timer is driven by **`requestAnimationFrame`** (falling back to a **1-second interval**
  when rAF is throttled/backgrounded), scoped to the **timer component ONLY**. Updating the timer
  string every second MUST NOT re-render the dashboard, sibling widgets, or any list (P-RERENDER /
  R13.12).
- The timer holds its state in a **ref/context outside the component tree** (not in global Zustand —
  R13.11 / P-STATE: server data lives in TanStack Query; the timer is local-only UI state), so it
  **survives route navigation** without resetting and re-mounts instantly on return. Target **60 FPS,
  zero main-thread jank** on the timer (R5.14).
- The timer recomputes from the local `attendance_events` baseline (IndexedDB), so it is correct
  even while offline and snaps to the server value on `AttendanceDayReconciled` (no timer flicker).
- **Verification:** React Profiler test asserts the dashboard + sibling widgets render **0 times**
  per timer tick; a navigation test asserts the timer keeps counting across route changes.

### Scalable, virtualized attendance lists (R5.15, R13.14, R13.12)
- The employee personal history list, the Admin company-wide overview, and the "today's attendance"
  lists **virtualize above 100 rows** (`@tanstack/react-virtual` — R13.14 / P-VIRTUAL). They MUST stay
  at **INP ≤200ms and 60 FPS** as combined employee + daily-event rows reach the **tens of thousands**
  (R5.15).
- Rows are **`React.memo`-wrapped with stable keys** (`attendance_day_id`); no anonymous callbacks or
  fresh objects passed as props into hot rows (R13.12 / P-RERENDER). DOM node count is capped at
  (visible + overscan) regardless of dataset size.

### Fast HR/Admin "today's attendance" view (R5.16, R13.3, R13.10, R13.15)
- **Server:** `GET /attendance/hr/today` and `admin/overview` p95 ≤**200ms** (R5.16, R13.4).
- **Cache / staleness (R5.16, R13.10/3 / P-NAV-CACHE):** TanStack Query `staleTime: 30s` for the
  today/overview queries; on revisit the view **renders immediately from cache** (stale-while-
  revalidate — no spinner, no full reload), then refreshes in the background. Realtime presence
  (`presence-attendance-today`) keeps the cached list live without invalidating the whole query.
- **In-place filters (R5.16, R13.15 / P-SEARCH):** present/absent/late/leave and department filters
  update the visible rows **IN PLACE** (URL + cache updated, never a route reload), with the filter
  input **debounced 250ms**. Changing a filter does not blank the screen or refetch when cached.

### Query budget & indexing (R13.5, R13.6)
- **≤5 SQL per list request, zero N+1** (R5.15/16, R13.5 / P-NO-N1/Q-COUNT). Overview/today/graph
  endpoints eager-load relations in a bounded number of queries; verified by a query-count test.
- **Composite indexes** (R13.6 / P-INDEX/​CURSOR): `(user_id, date)` on `attendance_days`; `(date,
  status)` and `(department via join, date)` for the Admin overview; `(user_id, timestamp)` on
  `attendance_events`; `(client_id)` for idempotent replay. All list endpoints use **cursor
  pagination**, never OFFSET (deep pages stay stable).

### Calendar heatmap & weekly/monthly graphs (R13.8, R13.17)
- The calendar heatmap component (ECharts) is **dynamically imported** (`next/dynamic`) so it stays
  out of the route's First-Load JS, and is **idle-prefetched** when the history route is likely next
  (R13.8 / P-LAZY).
- **Per-day data is fetched on month change** (not the whole history at once) and cached per month in
  TanStack Query; switching months is instant for already-visited months.
- If the heatmap/graph render becomes heavy (>50ms main-thread work), the ECharts instance runs in a
  **web worker** or is chunked so it never blocks INP (R13.17 / P-ASYNC-FS).

### Excel export — queued, never a long request (R13.17, R13.4)
- Export is treated as a **heavy report**: requests estimated >500ms are **queued** (a job streams the
  xlsx; the UI shows a progress/queued state) and the **download is streamed** to the client
  (R13.17 / P-QUEUE; R13.4 "heavy report endpoints stream/queue"). No long-blocking PHP request.

### Offline (R5.12, R13.20)
- The timer + events run locally from IndexedDB while offline; clock/break actions are queued with a
  generated **`client_id`** (idempotency key) and replayed on reconnect under the **Server-Validation**
  strategy (R5.12, R13.20 / P-RETRY). An **offline banner** is shown while disconnected. Reconciliation
  replaces local state with the server's authoritative row (see Offline section above).

### Reminder scheduler — non-blocking (R13.17)
- `RemindShiftStart` (15-min before) and `AlertMissedClockIn` (30-min after) are **queue-dispatched
  jobs** run by the Laravel Scheduler every minute; they never block a user request and never run in
  the web process (R13.17 / P-QUEUE).

### Frequent workflows — click/latency budgets (R13.24, project §10.5)
> Attendance defines the project's frequent-workflow bar (project §10.5 "Day-to-day optimized").

| Workflow | Target | Mechanism |
|---|---|---|
| **Clock in** | 1 tap | dashboard widget → optimistic start, instant timer (R5.13) |
| **Start break** | 1 tap | same widget → optimistic pause (R5.13) |
| **End break** | 1 tap | same widget → optimistic resume (R5.13) |
| **Clock out** | 1 tap + confirm | confirm dialog (destructive = close shift), then optimistic close (R5.13) |
| **View my history (heatmap)** | 1 click | lazy-loaded route, cached month data (R13.3/8) |
| **HR: check who's late today** | open + filter, ≤2 clicks, cached | today view renders from cache, late filter in-place (R5.16) |
| **HR: weekly graph** | 1 click | per-employee graph, cached series (R5.16) |
| **Admin: company-wide today** | open, cached | overview renders from cache, realtime-updated (R5.16) |
| **Export** | 1 click → queued | streamed download, queued if heavy (R5.10, R13.17) |

All workflows: **≤2 clicks, no full reloads, optimistic/instant confirmation** (R13.24 / P-DATAENTRY).

## Component mapping (Phase 5 — composes only from `openspec/COMPONENT-SYSTEM.md`)
> Attendance is the reference exemplar for module→component mapping. Other phases follow this pattern.

- **ClockInWidget** (dashboard + mobile): `Button(success)` full-width Start (≥48px mobile — R8),
  isolated live-timer display (rAF/1s, no sibling re-render — R5.14), `Button(secondary)` Take Break,
  `Button(destructive)` End Shift → `AlertDialog` confirm. State from a dedicated hook; optimistic
  action + `Toast`(success/danger) rollback (R5.13/19). Mobile = most prominent element (R8).
- **AttendanceHistoryCalendar**: lazy-imported virtualized calendar heatmap (R13.8); per-day
  `Popover` summary (clock-in/breaks/clock-out/hours/projects/tasks — R5.3); overtime = warning color.
- **TeamAttendanceTable** (HR/Admin): `DataTable` (generic) with present/absent/late `FilterChip`s
  in the shared `FilterBar`; cached 30s stale-while-revalidate (R5.16); filter changes in place
  (debounced 250ms — R13.15); row click → day-summary `Sheet`.
- **Weekly/Monthly graph**: lazy `Chart`(ECharts) wrapper.
- **Manual correction**: inline pencil edit on a day-summary row → `Dialog` form (admin.correct).
- **Excel export**: `Button` → 202/queue → `Toast` done → streamed download (R13.17).
- **Late badge / status**: `StatusBadge`(`warning` for late, `success` present, `neutral` absent).
- **Leave request** (this module's leave submit): `Form` — `DateRangePicker`, type `RadioGroup`,
  reason `Textarea`, submit `Button`(optimistic) → status `StatusBadge`.
- **Empty states**: real copy ("No attendance records yet.") + illustration via `EmptyState`.

## New ADRs
None.
