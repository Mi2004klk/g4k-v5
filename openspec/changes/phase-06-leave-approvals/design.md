# Design — leave-approvals

## Data model (new tables)
- `approvals` (generic, polymorphic — the heart of the reusable framework):
  - `id`, `approvable_type` (e.g. `leave_request` now; `task_submission`, `project_submission` in Phase 7), `approvable_id` (fk morph),
  - `status` enum(submitted, pending, approved, rejected) default `pending`,
  - `submitted_by` (fk users), `submitted_at`,
  - `current_approver_role` enum(super_admin, hr) — who this step is waiting on (employees never approve),
  - `decision` enum(approved, rejected) nullable, `decision_reason` text nullable,
  - `decided_by` (fk users) nullable, `decided_at` timestamp nullable,
  - `payload` jsonb — type-specific snapshot (leave: dates, type, reason; later: task/project submission fields), so the approval is self-describing without joining the approvable every render,
  - standard timestamps.
  - Indexes: `(approvable_type, approvable_id)` unique, `(status, current_approver_role)` for queue lists, `submitted_by`.
- `leave_requests`:
  - `id`, `user_id` (fk users — the requester), `start_date`, `end_date`, `reason` text, `type` enum (e.g. casual, sick, earned, unpaid — seeded set),
  - `approval_id` (fk approvals, one-to-one),
  - standard timestamps.
  - Indexes: `user_id, start_date`; unique partial on `(user_id, start_date, end_date)` where status is pending to prevent duplicate overlapping pending requests.
- `holidays` (read by Phase 6, written by Phase 10):
  - `id`, `name`, `date` date, `recurring` bool default false, `description` nullable, standard timestamps.
  - Index on `date`. Seeded in Phase 0/10 from the seed brief.

## Approval framework design
A single polymorphic pipeline so Phase 7 (tasks/projects) plugs in without a second system:
- **Service**: `ApprovalService` exposes `submit(approvableType, approvableId, submittedBy, approverRole, payload)`, `approve(approval, decider, reason?)`, `reject(approval, decider, reason?)`. It is the only writer to `approvals`.
- **State machine** (guarded transitions):
  - `submit` → sets `status=pending`, `current_approver_role` from the approvable's routing rule (employee leave → `hr`; HR leave → `super_admin`).
  - `pending → approved` / `pending → rejected` — allowed only if the decider's active role equals `current_approver_role` AND holds the matching capability. Any other transition is rejected.
  - Approved/Rejected are terminal; no reopen in M1.
- **Capability guard per approvable type** (config map, not hardcoded switches): `{ 'leave_request': { hr: 'hr.leave.approve-employee', super_admin: 'admin.leave.approve-hr' } }`. Phase 7 adds `task_submission` / `project_submission` rows here.
- **Routing rule per approvable type**: who approves depends on the submitter's role — an employee-submitted leave → HR; an HR-submitted leave → Admin. The service resolves this from the submitter at `submit` time and stores it in `current_approver_role`.
- **Events emitted on every transition** (Laravel events, also broadcast): `ApprovalSubmitted`, `ApprovalDecided`. Listeners: notification fan-out + realtime broadcast + audit row. Phase 7 listens on the same events for task/project submission/review UX.

## API (OpenAPI additions)
Spec-first — written before any route.
- `POST /leave-requests` → `{ start_date, end_date, type, reason }` → 201 `{ leave_request, approval }`. Creates the `leave_requests` row + opens the approval via `ApprovalService::submit`. Capability: requester's own role (`employee.leave.request-self` for employees; HR self-request uses the same endpoint, routing rule flips the approver to Admin).
- `GET /leave-requests` → list (scoped: employee sees own; HR sees team + own; Admin sees all) with the standard filter bar (status, date range, type, person) and pagination (default 20).
- `GET /leave-requests/{id}` → detail including the linked approval status, decision, decider, reason.
- `POST /approvals/{id}/decision` → `{ decision: approved|rejected, reason? }` → 200 `{ approval }`. Capability-gated by the approval's `current_approver_role` + the type's capability map.
- `GET /approvals/pending` → pending queue for the current approver role (HR sees employee leave pending; Admin sees HR leave pending).
- `GET /leave-requests/history` → leave history with status badges, same scoping as the list.
- `GET /holidays` → holiday list (read-only); `GET /holidays?year=` powers the calendar view.
All guarded by Sanctum + capability middleware.

## Realtime
On every approval transition, broadcast `approval-status-change` on the submitter's private channel `private-user.{submitted_by}` with `{ approval_id, approvable_type, status, decision, decided_by, decided_at }`. The submitter's open screens (leave history, request detail) refresh from this event. The approver's queue is refreshed via the standard TanStack Query invalidation on decision mutations. Reverb (ADR-013) carries the push.

## Offline
- **Submit while offline**: the Offline Engine queues a `leave-request.create` op; the form shows a queued state and the request appears in history as "submitting". On reconnect the op replays; the server validates dates/type/reason, opens the approval, and returns the authoritative record. Leave is HR/Finance data → Server-Validation conflict strategy (ADR-009): on conflict the server's result wins and the client reconciles.
- **Decide while offline**: approvers must be online to decide (a decision is an authoritative state change and needs current server state); the approve/reject buttons are disabled under the offline banner with a tooltip explaining why.
- Cache: leave history and the holiday calendar are cached and remain usable offline once loaded (per the global cache-everything rule).

## Notifications
Approval events drive the bell and Notification Center:
- **On submit** (`ApprovalSubmitted`): notify the routed approver(s) — "New leave request from {submitter}".
- **On decision** (`ApprovalDecided`): notify the submitter — "Your leave request was {Approved/Rejected}" with the reason.
- **Delivery**: these go through the Phase 8 notification system (bell with unread count + Notification Center under Chat, per R8.10/R8.11). Because Phase 6 lands before Phase 8, a **minimal in-app notification stub** is provided here: write a `notifications` row (id, user_id, type, title, body, read_at, link, timestamps) and broadcast a `notification-created` event on `private-user.{id}`. The bell + Notification Center consume this table. Phase 8 replaces the stub's writers with the production notification system but keeps the same table + event contract, so no Phase 6 call sites change.

## Capabilities (introduced)
- `employee.leave.request-self` — employee may submit their own leave request.
- `hr.leave.approve-employee` — HR may approve/reject employee leave requests.
- `admin.leave.approve-hr` — Admin may approve/reject HR leave requests.
- (HR/Admin who also hold employee-style request rights submit their own leave via the same endpoint; routing flips to Admin for HR requesters.)
- These are added to the capability matrix introduced in Phase 2; roles → capabilities lookup is unchanged.

## Test strategy
- **API feature tests**: submit employee leave → approval opens routed to HR; submit HR leave → routed to Admin; approve/reject by correct role succeeds and records decider/decision/at; approve/reject by wrong role/capability denied; transition from terminal state rejected; pending queue scoped per role; all-user history scoped to Admin; holiday endpoint read-only; offline submit queues then syncs with server-validation; conflict resolved in server's favor.
- **Web tests**: leave request form (required fields, date-range validation, type select, submit loading, success toast); approve/reject flow with reason for reject (confirmation dialog); status badges render correct colors (Amber/Green/Red); leave history filter + pagination; holiday calendar renders seeded dates; notification stub writes a row and the bell increments; offline submit shows queued state and disables decide.
- **Framework reuse test**: a throwaway approvable type is submitted/decided through `ApprovalService` to prove Phase 7 can plug in with no new pipeline.

## Performance Requirements (Phase 6)
> Leave & Approvals is a **HIGH-frequency HR/Admin workflow**: approve/reject is exercised many times
> a day, often from a dashboard notification or a queue list. Operational efficiency is therefore a
> first-class acceptance criterion, not a polish pass. Every threshold below is CI-enforced (a
> regression fails the build) and maps to `PERFORMANCE-STANDARDS.md` (P-*) and `REQUIREMENTS.md`
> R6.x / R13.x. Phase 6 mirrors the day-to-day performance bar set by Phase 5 (Attendance).

### One-click approve / reject (R6.5/6.6, R13.24, R13.19, R13.22)
- **Approve or reject is a SINGLE CLICK** from the dashboard notification or the leave list, followed
  by a confirm step for the decision (reject requires a reason). It is reachable in **≤2 clicks from
  the dashboard**, causes **NO full reload**, and never routes through a separate form (P-DATAENTRY /
  R13.24).
- **Optimistic status update (R13.19 / P-OPTIMISTIC):** the moment the approver clicks Approve/Reject
  the row's **status badge flips instantly** (Amber → Green/Red) and the row leaves the pending queue
  before the server round-trip lands. On a server error the change is **rolled back** and a **danger
  toast** is shown ("Approval failed — reverted"). The decision is a guarded, capability-gated state
  transition, but because the UI reflects the intended outcome immediately and reverts cleanly on
  failure it qualifies for optimistic treatment per R13.19 (instant UI + rollback path).
- **Double-submit prevention (R13.16):** the tapped Approve/Reject button is disabled + dot-loader
  until the optimistic commit lands, so a double-click cannot fire two decisions or corrupt the state
  machine.
- **Endpoint latency:** `POST /approvals/{id}/decision` is a fast DB write (guarded transition + an
  audit row), so it targets the **write budget ≤300ms p95** and in practice the **read budget ≤200ms**
  (R13.4).

### Fast leave list queries (R6.4/6.5, R13.4, R13.5, R13.6)
- **Server:** `GET /leave-requests`, `/leave-requests/history`, and `/approvals/pending` p95 ≤**200ms**
  read at 10k rows (R13.4 / P-API-P95).
- **≤5 SQL per list request, zero N+1** (R13.5 / P-NO-N1/Q-COUNT): each list eager-loads the linked
  `approvals` row (status/decision/decider) and the requester in a bounded number of queries; verified
  by a query-count test (`DB::enableQueryLog()`). The polymorphic `approvals.payload` jsonb snapshot
  keeps each row self-describing so renders never fan out extra queries.
- **Cursor pagination, never OFFSET** (R13.6 / P-CURSOR): all list endpoints use cursor pagination
  (default 20, options 50/100); deep pages stay stable.
- **Composite indexes** (R13.6 / P-INDEX): on `leave_requests` add `(user_id, status)` and
  `(start_date)`; on `approvals` add `(status, current_approver_role)` (already present, drives the
  pending queue) plus `(status, submitted_at)` for newest-pending ordering. EXPLAIN-asserted in tests.

### Virtualized leave history (R6.4, R13.14, R13.12)
- Leave history lists **virtualize above 100 rows** (`@tanstack/react-virtual` — R13.14 / P-VIRTUAL).
  They MUST stay at **INP ≤200ms and 60 FPS** as a user's/department's history grows into the
  thousands.
- Rows are **`React.memo`-wrapped with stable keys** (`approval_id`); no anonymous callbacks or fresh
  objects passed as props into hot rows (R13.12 / P-RERENDER). DOM node count is capped at
  (visible + overscan) regardless of dataset size.

### Approval state-machine writes are fast; only fan-out is queued (R6.8, R13.17)
- The **decision itself** (Approve/Reject) is a **fast DB write** — a guarded state transition +
  audit row — so it runs **synchronously in the request** and does NOT need a queue (the approver sees
  the result immediately). Only the **notification fan-out** (bell + Notification Center writes,
  realtime broadcast, audit-side-effects) is **dispatched to a Laravel queue** so it never blocks the
  decision response (R13.17 / P-QUEUE; R13.4 "heavy report endpoints stream/queue").
- The `ApprovalSubmitted`/`ApprovalDecided` events fire inline; their *listeners* run on the queue.

### Cached leave lists + realtime without render storms (R13.3, R13.10, R13.12)
- **Cache / staleness (R13.10 / P-CACHE-API):** TanStack Query `staleTime: 30s` for the leave list,
  history, and pending-queue queries; on revisit the view **renders immediately from cache**
  (stale-while-revalidate — no spinner, no full reload), then refreshes in the background
  (R13.3 / P-NAV-CACHE).
- **Realtime without render storms (R13.12):** the `approval-status-change` broadcast on
  `private-user.{submitted_by}` updates the affected row via TanStack Query cache patch + a memoized
  row — it MUST NOT re-render the whole list. Pending-queue invalidation on a decision mutation is
  targeted (cache-key specific), never a blanket invalidate.
- **Holiday calendar cache (R6.7, R13.10):** `GET /holidays` is cached **1h** (holidays rarely change,
  data owned by Phase 10) and the calendar view is **lazy-loaded** (`next/dynamic`) so it stays out of
  the leave route's First-Load JS (R13.8 / P-LAZY).

### Frequent workflows — click/latency budgets (R13.24)
> Phase 6 frequent-workflow bar (mirrors project §10.5 "Day-to-day optimized" and R13.24 /
> P-DATAENTRY).

| Workflow | Target | Mechanism |
|---|---|---|
| **Submit a leave request** | ≤2 clicks | dashboard quick-action / list "Request leave" → form → submit (R6.2/6.3) |
| **HR/Admin: approve** | 1 click + confirm | from dashboard notification or leave list → optimistic badge flip (R6.5/6.6, R13.19) |
| **HR/Admin: reject** | 1 click + confirm + reason | reject dialog → optimistic badge flip (R6.5/6.6, R13.19) |
| **View leave history** | 1 click | lazy-loaded route, cached list (30s) renders immediately (R13.3/8/10) |
| **Open holiday calendar** | 1 click | lazy-loaded, 1h-cached data (R6.7, R13.10) |
| **Reopen a request to see status** | 1 click | cached detail renders immediately, realtime-updated (R13.3/12) |

All workflows: **≤2 clicks, no full reloads, optimistic/instant confirmation** (R13.24 / P-DATAENTRY).

### Resilience (R13.21, R13.18)
- A failed approve/reject or a failed widget **MUST NOT block the page** — per-widget error boundary,
  inline retry, danger toast with rollback (R13.21 / P-RESILIENT).
- Leave list/history shows **skeletons** (never a full-screen spinner) and renders cached/partial
  content immediately (R13.18 / P-SKELETON).

## Component mapping (Phase 6 — composes only from openspec/COMPONENT-SYSTEM.md)

This phase's screens compose exclusively from the FROZEN catalog; no new primitives are introduced
(§10).

- **LeaveRequestForm** (§7 Leave & Approvals) = `Form` (§1) with `DateRangePicker` (range validated
  end ≥ start), leave type `RadioGroup`, reason `Textarea`, and submit `Button`. On success the new
  request renders with a `StatusBadge` (§3, `warning` = Pending). While offline the submit is queued
  by the Offline Engine and the row shows a "submitting" state until sync (Server-Validation
  strategy).
- **Leave list / history / pending queue** = generic **`DataTable`** (§3, virtualized above 100 rows,
  cursor pagination) with the shared **`FilterBar`** (§5: status multi-`Checkbox`, date-range
  `DatePicker`, type filter, person `Combobox`, sort `Select`). Each row's status is a `StatusBadge`
  (Amber = Pending, Green = Approved, Red = Rejected). The list renders from cache on revisit
  (staleTime 30s) with no spinner.
- **LeaveApprovalRow** (§7 Leave & Approvals) = dates + reason + `StatusBadge` + **one-click
  approve** `Button(success)` and **reject** `Button(destructive)` → `AlertDialog` (§2) confirm
  (reject requires a reason, captured in the dialog). Approve/Reject is **optimistic**: the badge
  flips instantly (Amber → Green/Red) and the row leaves the pending queue before the round-trip; on
  server error it rolls back with a danger `Toast` (§6, "Approval failed — reverted"). The tapped
  button is disabled + dot-loader to prevent a double decision (R13.16).
- **Holiday calendar** = a lazy-loaded (`next/dynamic`) calendar view reading `GET /holidays`,
  cached **1h** (holidays rarely change; data owned by Phase 10). Kept out of the leave route's
  first-load JS (R13.8 / P-LAZY).
- **Approval notifications** = approval events drive the bell. Because the production
  **`NotificationsBell`** (§6) + Notification Center land in Phase 8, this phase ships a minimal
  in-app notification stub (a `notifications` row + a `notification-created` broadcast) with the
  same table + event contract the Phase 8 `NotificationsBell` will consume — so no Phase 6 call site
  changes later.

All rows are `React.memo`'d with stable keys (`approval_id`); realtime `approval-status-change`
events patch a single cached row without re-rendering the whole list (R13.12).

## New ADRs
None.
