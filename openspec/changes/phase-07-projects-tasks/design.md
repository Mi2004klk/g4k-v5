# Design — projects-tasks

## Data model (new tables)
- `projects`: `id`, `name`, `description` (rich text, nullable), `priority` enum(low,medium,high,urgent), `deadline` date nullable, `status` enum(planning,in_progress,under_review,done,on_hold) default planning, `team_id` (fk teams, nullable), `hr_owner_id` (fk users, the HR responsible), `qa_form_id` (fk qa_forms, nullable), `submitted_at` timestamp nullable, `submitted_report` json nullable, `approved_at` timestamp nullable, `progress_pct` tinyint default 0, `version` bigint default 1 (optimistic lock + merge), `created_by`, timestamps; soft deletes. Indexes on status, deadline, team_id, hr_owner_id.
- `project_members`: `project_id` (fk), `user_id` (fk), `role` enum(owner,member) default member, `granted_via` enum(team,explicit), `created_at`. Composite PK (project_id, user_id). This is the denormalized access list materialized from the team on create/update — the single source read by the capability gate so per-task access checks are fast.
- `project_chats`: `id`, `project_id` (fk, unique), `created_at`. One row per project, auto-created on project create. The chat itself (messages, members, pins) lives in Phase 8's `chats`/`messages` tables; Phase 7 only ensures the project-chat channel exists and writes system task-alert messages into it. (Refs Phase 8 — `chat_type='project'`.)
- `qa_forms`: `id`, `project_id` (fk), `schema` json (array of `{field, label, type:text|number|rating|choice|file-link, required, options}`), `version` int default 1, `updated_by`, timestamps. One active form per project (latest version wins).
- `tasks`: `id`, `project_id` (fk, nullable — null = personal My Tasks task), `title`, `description` (rich text, nullable), `scope` enum(global,department,role) default department, `scope_ref` json nullable (department_id / role key when scoped), `priority` enum(low,medium,high,urgent) default medium, `due_date` date nullable, `reminder_minutes` int nullable (minutes before due), `status` enum(todo,in_progress,under_review,done) default todo, `order` int (kanban/list position within status column), `progress_pct` tinyint default 0, `depends_on` json nullable (array of task ids — the dependency graph), `recurrence` json nullable (`{type:daily|weekly|monthly, days?:number[], dayOfMonth?:number, until?:date, active:bool}`), `qa_submission` json nullable (the assignee's filled QA responses + note, written at submit), `approval_id` (fk approvals, nullable — references the Phase 6 approval state machine row), `is_personal` bool default false (My Tasks flag), `redo_reason` text nullable, `completed_at` timestamp nullable, `version` bigint default 1 (optimistic lock + merge), `created_by`, timestamps; soft deletes. Indexes on project_id, status, due_date, assignee lookups via `task_assignees`.
- `task_assignees`: `task_id` (fk), `user_id` (fk), `created_at`. Composite PK. Many assignees per task (R7.4 multi-assign). Team/company-wide assignment is resolved at access-check time by joining team membership; explicit per-user rows live here.
- `task_comments`: `id`, `task_id` (fk), `user_id` (fk), `body` json (Tiptap doc), `created_at`, `updated_at`. Ordered by created_at; virtualized in the UI.
- `task_timers`: `id`, `task_id` (fk, nullable), `project_id` (fk), `user_id` (fk), `start_at` timestamp, `end_at` timestamp nullable, `seconds` int (accumulated, finalized on end), `created_at`. Per-project work timer (R7.9) — one open row per (project, user) at a time; pause/resume = end current + start new interval.
- `task_activity`: `id`, `task_id` (fk), `action` enum(created,assigned,unassigned,progress,commented,status_changed,submitted,approved,redo,dependency_added,timer_started,timer_ended), `meta` json nullable (assignee id, old/new status, progress value, etc.), `by_user_id` (fk), `created_at`. Append-only. Indexed on task_id + created_at. This is the per-item activity log (R7.6); the global audit log is Phase 2's `audit_logs`.
- `task_recurrence_log`: `id`, `parent_task_id` (fk), `generated_task_id` (fk), `occurrence_date`, `created_at`. Tracks auto-generated occurrences so a recurrence can be audited and toggled off cleanly.
- `saved_views`: `id`, `user_id` (fk), `entity` enum(projects,tasks), `name`, `config` json (filters, sort, columns, groupBy, board vs list vs gantt), `is_default` bool, `created_at`. Reused by Phase 9 saved report views (R9.8) and R11.7 saved views.
- `pinned_items`: `id`, `user_id` (fk), `entity_type` enum(project,task,profile,chat,...), `entity_id`, `created_at`. Composite unique (user_id, entity_type, entity_id). Powers R7.18 pinning and reuses the Phase 3 Pinned sidebar section (R3.5).

> Reuse note: `approvals` (Phase 6) is reused for both task (R7.12) and project (R7.13) review state machines. `task_assignees` reuses the Phase 2 team/department join for scope resolution. Pinning reuses the Phase 3 Pinned sidebar section. Saved views are a generic table reused by Phase 9.

## API (OpenAPI additions)
All endpoints Sanctum-guarded + capability-gated.
- Projects:
  - `GET /projects?q=&status=&priority=&team=&sort=&dir=&view=&page=` list (paginated, virtualized-friendly, capability-gated so Admin sees all, HR/Employee see their teams).
  - `POST /projects` (Admin/HR `projects.manage`) create; `GET/PUT/DELETE /projects/{id}`; `PATCH /projects/{id}/status`; `PATCH /projects/{id}/archive`.
  - `GET /projects/{id}/members`; `PUT /projects/{id}/team` (updates team → auto-grants/revokes `project_members`).
  - `GET /projects/{id}/history` → team, tasks done, time spent, completion date, approval result (R7.15).
  - `POST /projects/{id}/submit` (completion report) → HR review; `POST /projects/{id}/approve`; `POST /projects/{id}/redo`.
  - `GET /projects/{id}/gantt` → tasks with date ranges + dependencies for the Gantt view (R7.14).
  - `PUT /projects/{id}/sort` → persist chosen sort default for that project's list (R7.3 context).
- QA forms:
  - `GET /projects/{id}/qa-form`; `PUT /projects/{id}/qa-form` (HR/Admin `projects.qa.manage`) save schema (R7.8).
- Tasks:
  - `GET /projects/{id}/tasks?status=&assignee=&priority=&view=&page=` (board/list data, virtualized); `POST /projects/{id}/tasks`; `GET/PUT/DELETE /tasks/{id}`; `PATCH /tasks/{id}/status`; `PUT /tasks/{id}/assignees`; `PATCH /tasks/{id}/progress`; `POST /tasks/{id}/dependencies` / `DELETE /tasks/{id}/dependencies/{depId}` (HR/Admin).
  - `PUT /tasks/{id}/reorder` → `{source, target, position}` persist new order/status within a column (kanban + list drag; R7.7).
  - `POST /tasks/{id}/submit` (assignee, optional QA responses + note); `POST /tasks/{id}/approve`; `POST /tasks/{id}/redo` `{reason}`.
  - `PUT /tasks/{id}/recurrence` → configure daily/weekly/monthly + toggle off (R7.10).
  - `POST /tasks/{id}/duplicate-next` → recurrence engine generates next occurrence on completion.
  - `POST /projects/{id}/timers` `{action:start|pause|resume|end}` → per-project work timer (R7.9); `GET /projects/{id}/timers` log.
- Comments + activity:
  - `GET /tasks/{id}/comments`; `POST /tasks/{id}/comments` (Tiptap body); `PUT/DELETE /tasks/{id}/comments/{cid}`.
  - `GET /tasks/{id}/activity` → activity log (R7.6).
- Quick Task Assignment (R7.11):
  - `POST /quick-tasks` `{assignee_id, title, due_date?, note?}` → creates task, drops into assignee's list; on completion emits the Global Chat auto-notify event.
- My Tasks (R7.17):
  - `GET /me/tasks?status=&due=&view=` → personal list (own tasks + assigned across projects); `POST /me/tasks` self-create personal task (`is_personal=true`).
- Saved views + pinning (R7.18):
  - `GET/POST /saved-views?entity=projects|tasks`; `PUT/DELETE /saved-views/{id}`.
  - `POST /pins` `{entity_type, entity_id}`; `DELETE /pins/{id}`; `GET /me/pins`.

## Realtime (Reverb, ADR-013)
- Kanban live updates: a presence channel `private-project.{id}` broadcasts `TaskStatusChanged`, `TaskReordered`, `TaskCreated`, `TaskUpdated` so every connected viewer's board reflects moves instantly (R7.7). Drag is optimistic locally; the broadcast reconciles other clients.
- Project chat task-alerts (R7.6/R8.2): on task create/assign/status→under_review/approve/redo, the backend auto-posts a system message into the project's `project_chats` channel and broadcasts it. Phase 8 renders the chat; Phase 7 only writes the row + emits the event.
- Submission notifications: task submit (R7.12) and project submit (R7.13) broadcast on `private-user.{hr_owner_id}` (and Admin) a `SubmissionPending` event so the bell + Notification Center surface it. (Phase 8 renders the bell; Phase 7 emits.)
- Global Chat auto-notify (R7.11): when a Quick-Assigned task completes, the backend writes an auto message into Global Chat and broadcasts on the global channel.

## Offline (single shared Offline Engine, ADR-010; per-entity conflict ADR-009)
- Tasks use the **Version+Merge** conflict strategy (§9): each task carries `version`; a queued offline edit carries the base version; on sync the server merges non-conflicting fields (e.g. progress vs. assignee) and returns 409 with the server copy only when the same field changed. The client shows a merge-conflict affordance per field, not a blunt overwrite.
- Projects use Server Validation (status transitions, approval flows) — submit/approve/redo require connectivity and reject if the server state has moved.
- Kanban drag, inline edit, comment authoring, and timer start/pause/resume queue offline and replay; timer seconds accumulate locally from `start_at` and finalize `seconds` at end on sync.
- My Tasks self-create and personal edits work fully offline (no approval gate), then merge on reconnect.
- QA form schema reads are cached in IndexedDB so the submission step renders offline; the filled submission queues and submits on reconnect.
- Conflict resolution for comments = Timestamp (§9); offline comments are ordered by server-reconciled timestamp.

## Capabilities (matrix content)
Authored in `role_capabilities`, resolved by the `require-capability` middleware. Project/task access is additionally gated by `project_members` membership.
- **super_admin**: `projects.manage`, `projects.view-all`, `projects.qa.manage`, `tasks.create`, `tasks.assign`, `tasks.dependencies`, `tasks.approve`, `tasks.reorder`, `projects.gantt`, `projects.history`, `my-tasks.manage`, `quick-tasks.create`, `saved-views.manage`, `pins.manage`. (Admin sees all projects regardless of team — R7.13.)
- **hr**: `projects.manage` (own/managed teams), `projects.qa.manage`, `tasks.create`, `tasks.assign`, `tasks.dependencies`, `tasks.approve`, `tasks.reorder`, `projects.gantt`, `projects.history`, `tasks.self-create.grant` (per-project toggle granting employees self-create), `my-tasks.assign`, `quick-tasks.create`.
- **employee**: `tasks.update-own-progress`, `tasks.submit-own`, `tasks.self-create` (only inside projects where HR granted it — R7.16), `my-tasks.self-create`, `timers.use`, `pins.manage`, `saved-views.manage` (own).
- The create/edit/assign/approve matrix per role is enforced server-side; the frontend only renders actions for capabilities the active role holds and `project_members` membership the user has.

## Tiptap QA forms (R7.8)
- QA form builder: HR/Admin composes a schema of typed fields (text, number, rating, choice, file-link) with required flags. Stored as JSON on `qa_forms.schema`. The builder reuses the shared Tiptap editor for any rich instructions field, consistent with how Tiptap is used for task comments (R7.6) and QA submission notes.
- Employee QA submission: on a task's submit step, the attached QA form renders from its schema; the employee fills it and adds a Tiptap submission note. Responses + note are stored as `tasks.qa_submission` json and surfaced to the reviewer.

## dnd-kit Kanban + reorder (ADR-007)
- The Kanban board (To Do / In Progress / Under Review / Done) and the list-view reorder both use dnd-kit — the same library the design system uses for all list/tree/menu reordering (R3.10). React Grid Layout is never used here (ADR-007: dashboard only).
- Drag state is UI state in a Zustand `useTaskBoardStore` (ADR-008): optimistic local reorder → debounce-PUT `/tasks/{id}/reorder` → broadcast reconciles other clients. Task/project data stays in TanStack Query.
- Column transitions on cross-column drop update `status` + `order`; dependency-blocked tasks (R7.5) are non-droppable into In Progress while blocked (the dnd-kit `canDrop` gate).

## Gantt / Timeline view (R7.14)
- Gantt renders via ECharts custom series (horizontal bars from `due_date`/start + milestone diamonds) or a purpose-built custom renderer if ECharts Gantt is insufficient; the decision is implementation-time and does not change any ADR. Data sourced from `/projects/{id}/gantt`.
- Dependency linkages drawn from `tasks.depends_on`. View is HR/Admin-gated (`projects.gantt`).

## Test strategy
- api feature tests: project CRUD + archive/delete; team auto-grant/revoke of `project_members`; project sort params; task create with multi-assign/priority/due/scope; team & company-wide assignment resolution; dependencies block then clear; comments (Tiptap body) CRUD; activity log entries on every lifecycle event; kanban reorder + status transition persistence; QA form builder save + employee submission with note; project timer start/pause/resume/end seconds correctness; recurrence daily/weekly/monthly generation + toggle off; Quick Task Assignment creates + appears in assignee list + Global Chat notify on completion; task submit→approve/redo; project submit→approve/redo; Admin sees all projects; Gantt payload shape; project history aggregate; employee self-create permitted vs denied; My Tasks private + HR-assign; saved views save/apply; pin/unpin; capability gate denies unauthorized on every endpoint; offline Version+Merge merge/non-conflict path and 409 conflict path; server-validation rejection of offline approval.
- web/component tests: Kanban dnd-kit cross-column + reorder; inline edit commit/cancel; progress-bar animate 0→value; saved view re-applies columns+filters+sort; pin adds to Pinned section; Gantt renders bars+diamonds+links; offline drag queues + reconcile; optimistic drag then broadcast reconcile; dependency-blocked card non-droppable.
- e2e: create project → add team → members see it; create task → drag To Do → In Progress on two clients (second updates live); submit task → HR approves; recurring task complete → next generated; Quick Task assign → complete → Global Chat message appears.

## Performance Requirements (Phase 7)
> Phase 7 is the largest functional module and the most interaction-heavy: a live dnd-kit Kanban
> board, an ECharts Gantt, a Tiptap comment editor, a per-project work timer, recurring-task
> regeneration, and several approval flows — all of which the user touches constantly throughout
> the day. Operational speed is therefore a first-class acceptance criterion, not a polish pass.
> Every threshold below is CI-enforced (a regression fails the build) and maps to
> `PERFORMANCE-STANDARDS.md` (P-*) and `REQUIREMENTS.md` R7.x / R13.x. This block ADDS performance
> criteria on top of the functional design above; it does not change any contract, data model, or
> ADR.

### Smooth 60 FPS Kanban with optimistic status + debounced persist (R7.7, R13.19, R13.14, R13.12)
- The Kanban board is built on **dnd-kit** (ADR-007) and drag must run at **60 FPS** with no
  main-thread jank (P-VIRTUAL / R13.14). Drag state lives in the Zustand `useTaskBoardStore`
  (UI-only, ADR-008); task/project data stays in TanStack Query.
- **Optimistic status (R7.7, R13.19 / P-OPTIMISTIC):** dropping a card onto another column flips
  its `status` **instantly in the UI** the moment of the drop; the reorder/status `PUT
  /tasks/{id}/reorder` + `PATCH /tasks/{id}/status` fire in the background. On a server error the
  card **snaps back** to its source column and a **danger toast** is shown ("Move failed —
  reverted"). Reorder/status are safe, idempotent mutations (idempotency via `client_id`), so they
  qualify for optimistic treatment per R13.19.
- **Debounced persist:** within-column reorder is coalesced and **debounced** before the PUT so a
  flurry of drags produces a single batched request, not one request per pixel-drop. The realtime
  broadcast (`TaskReordered`/`TaskStatusChanged` on `private-project.{id}`) reconciles other
  clients against the persisted order.
- **Virtualized board (R13.14 / P-VIRTUAL):** the board virtualizes **both columns AND cards** once
  a column exceeds **100 cards** (`@tanstack/react-virtual`); DOM node count is capped at
  (visible columns + visible cards + overscan) regardless of board size, holding 60 FPS at 5000+
  cards.
- **Memoized cards + stable keys (R13.12 / P-RERENDER):** each card is `React.memo`-wrapped with a
  **stable key** (`task_id`); no anonymous callbacks or fresh objects are passed as props into hot
  cards, so dragging one card does not re-render the others. A drag in progress must not re-render
  the column headers or sibling cards.
- **Verification:** React Profiler test asserts sibling cards render **0 times** during a drag; a
  5000-card board test asserts DOM nodes ≤ (visible + overscan) and 60 FPS; an optimistic-rollback
  test injects a server error and asserts the card returns to its source column + danger toast.

### Efficient task list queries — p95 ≤200ms, cursor pagination, ≤5 SQL, zero N+1 (R13.4/5/6)
- **Server budget (R13.4 / P-API-P95):** `GET /projects/{id}/tasks`, `GET /me/tasks`, and the board
  data endpoint execute at **p95 ≤200ms** at 10k tasks. The list endpoints return board/list data
  shaped for virtualization (columns grouped server-side, cards cursor-paginated per column).
- **Query budget (R13.5 / P-NO-N1/Q-COUNT):** each list request executes **≤5 SQL queries**
  regardless of row count, with **zero N+1** — assignees, dependencies, and the latest activity row
  are eager-loaded in a bounded number of queries. Verified by a `DB::enableQueryLog()` test.
- **Cursor pagination (R13.6 / P-CURSOR):** all task list endpoints use **cursor pagination**
  (never OFFSET) so deep pages stay stable; default 20, options 50/100.
- **Composite indexes (R13.6 / P-INDEX):** `tasks (project_id, status, order)` for board column
  ordering; `tasks (project_id, status, order)` mirrors the kanban/list query; an assignee lookup
  index on `task_assignees (user_id, task_id)` plus a `(assignee_id, status)` path for the My Tasks
  view; and `(priority, due_date)` for the urgent/overdue sort. EXPLAIN in tests asserts index usage
  on every filtered/ordered column.

### Lazy Gantt + web-worker layout (R7.14, R13.8, R13.17)
- The **Gantt/Timeline view is dynamically imported** (`next/dynamic`) so ECharts and the Gantt
  renderer stay out of the route's First-Load JS, and is **idle-prefetched** when a project detail
  is open and the user is HR/Admin (likely to switch to Gantt) (R13.8 / P-LAZY).
- **Worker layout for large projects (R13.17 / P-ASYNC-FS):** for projects with many tasks, the
  Gantt **layout (bar positions, milestone-diamond coordinates, dependency link paths) is computed
  in a web worker** so the main thread never blocks INP; only the final render instructions cross
  back. If layout exceeds 50ms main-thread work it MUST run off the main thread.
- **Milestone diamonds** are rendered efficiently (single SVG/canvas layer, not one DOM node per
  diamond) so a project with hundreds of milestones stays at 60 FPS.
- **Verification:** bundle analyzer shows ECharts + Gantt out of the main chunk; a large-project
  Gantt test asserts no main-thread task >50ms during layout; milestone render test asserts DOM
  node count is bounded.

### Isolated project work timer — no sibling re-renders (R7.9, R13.12, R13.11)
- The per-project work timer follows the **same isolation pattern as the Phase 5 Attendance live
  timer** (see `phase-05-attendance/design.md` "Live timer performance"): the HH:MM:SS display is
  driven by **`requestAnimationFrame`** (1-second interval fallback when backgrounded), scoped to
  the **timer component ONLY**. Each tick MUST NOT re-render the project workspace, the board, the
  task list, or any sibling widget (P-RERENDER / R13.12).
- The timer holds its state in a **ref/context outside the component tree** (not in global Zustand
  — R13.11 / P-STATE: server data lives in TanStack Query; the running seconds are local-only UI
  state), so it **survives navigation** between board/list/Gantt tabs and re-mounts instantly on
  return. Target **60 FPS, zero main-thread jank** on the timer.
- The timer recomputes from the local `task_timers` baseline (IndexedDB), so it is correct while
  offline and snaps to the server value on the timer-reconcile broadcast (no flicker).
- **Verification:** React Profiler test asserts the project workspace + board render **0 times** per
  timer tick; a navigation test asserts the timer keeps counting across board↔list↔Gantt tab
  switches.

### Lazy Tiptap comments + virtualized comment thread + optimistic post (R7.6, R13.8, R13.19)
- The **Tiptap rich-text editor is dynamically imported** (`next/dynamic`) so the editor bundle
  stays out of the task-detail route's First-Load JS, loaded only when the comment composer is
  focused or the task drawer opens (R13.8 / P-LAZY).
- The **comments list is virtualized** above 100 comments (`@tanstack/react-virtual` — R13.14 /
  P-VIRTUAL); rows are `React.memo`-wrapped with stable keys (`comment_id`) so posting a new
  comment does not re-render the whole thread (R13.12).
- **Optimistic post + rollback (R13.19 / P-OPTIMISTIC):** submitting a comment appends it to the
  thread **instantly**; the `POST /tasks/{id}/comments` fires in the background; on a server error
  the optimistic comment is **removed** and a danger toast is shown. Comments use the Timestamp
  conflict strategy (ADR-009) so offline comments order by server-reconciled timestamp on sync.
- **Verification:** bundle analyzer shows Tiptap out of the main chunk; a render-count test asserts
  existing comments do not re-render on a new post; an optimistic-rollback test injects a server
  error and asserts the comment is removed + toast shown.

### Recurring-task regeneration offloaded to a queue (R7.10, R13.17)
- Recurring-task next-occurrence generation is treated as **background work**: marking a recurring
  task done **dispatches a queued job** that generates the next occurrence, writes
  `task_recurrence_log`, and notifies HR — it is **never** a long blocking PHP request (R13.17 /
  P-QUEUE). The UI flips the completed task to Done optimistically and the next occurrence appears
  when the job lands (optimistic + broadcast reconcile).
- **Verification:** queue dispatch test asserts the regeneration job is pushed (not run inline);
  feature test asserts the next occurrence + HR notification are produced by the job.

### Optimistic submission/approval status + queued notifications (R7.12, R7.13, R13.17, R13.19)
- **Optimistic status badge (R13.19 / P-OPTIMISTIC):** task submit/approve/redo and project
  submit/approve/redo flip the status badge **instantly** on click; the request fires in the
  background. Approve/redo are safe state transitions reused from the Phase 6 `approvals` machine;
  on a server error the badge reverts and a danger toast is shown. (Submit of a project completion
  report carries payload, so the optimistic flip shows the new status while the report body uploads,
  rolling back on failure.)
- **Queued notifications (R13.17 / P-QUEUE):** the submission `SubmissionPending` broadcast to
  HR/Admin and the project-chat task-alert system message are **dispatched from a queued job** (fan-
  out) so a submit never blocks on notification delivery.
- **Verification:** optimistic-flip test (click → badge changes immediately → reverts on injected
  error + toast); queue dispatch test asserts the notification fan-out job is pushed.

### Saved views / custom columns — instant toggle, cached views (R7.18, R13.3, R13.10)
- Column visibility toggle (TanStack Table) is **instant** (pure client state, no request); saved
  views are **cached** in TanStack Query (`staleTime` tuned per user) so re-applying a named view
  is immediate and does not refetch when the underlying list is fresh (R13.3/10 / P-NAV-CACHE).
- **Verification:** toggle test asserts column show/hide causes zero network requests; saved-view
  re-apply test asserts cached data is reused (no spinner).

### Caching — per-entity staleTime, stale-while-revalidate (R13.3, R13.10)
- **Project list** TanStack Query `staleTime: 30s`; **task board** `staleTime: 10s` (board changes
  often via realtime); **My Tasks** `30s`; **project history / Gantt payload** `60s` (slower-
  moving aggregates). On revisit each renders **immediately from cache** (stale-while-revalidate —
  no spinner, no full reload), then refreshes in the background (R13.10/3 / P-CACHE-API/NAV-CACHE).
- Realtime broadcasts (`private-project.{id}`) patch the cached board in place so live moves do not
  invalidate the whole query.
- **Verification:** cache-hit test asserts the board renders from cache on revisit (no spinner);
  realtime patch test asserts a broadcast updates the cached row without a full refetch.

### Quick Task Assignment — ≤2 clicks, instant appear, queued Global Chat notify (R7.11, R13.24, R13.17)
- The Quick Task Assignment widget is a **frequent workflow** reachable in **≤2 clicks** from the
  dashboard (dashboard → fill → assign), with **no full reload** and **optimistic confirmation**
  (R13.24 / P-DATAENTRY): the task **appears instantly** in the assignee's task list the moment the
  widget submits, the `POST /quick-tasks` fires in the background, and on error the task is removed
  + danger toast.
- On completion, the **Global Chat auto-notify message is dispatched from a queued job** (R13.17 /
  P-QUEUE) so the completing user is not blocked on chat delivery.
- **Verification:** click-count test asserts ≤2 clicks dashboard→assigned; optimistic-appear test
  asserts the task shows in the assignee list before the server responds; queued-notify test
  asserts the Global Chat message job is pushed on completion.

### Offline — Tasks Version+Merge, queued writes (R7.x, R13.20)
- Tasks use the **Version+Merge** conflict strategy (ADR-009/§9): each queued offline edit carries
  the base `version`; on sync the server merges non-conflicting fields and returns 409 + the server
  copy only on same-field conflict (per-field merge affordance, not a blunt overwrite). Kanban
  drag, inline edit, comment authoring, and timer start/pause/resume **queue offline and replay**
  with a generated `client_id` idempotency key (R13.20 / P-RETRY).
- An **offline banner** is shown while disconnected (R11.6); My Tasks self-create and personal edits
  work fully offline (no approval gate) then merge on reconnect.
- **Verification:** replay test asserts a queued edit applied twice with the same `client_id` is
  applied exactly once; Version+Merge test asserts non-conflicting fields merge and a same-field
  conflict yields 409 + server copy; offline-banner test asserts the banner shows while disconnected.

### Frequent workflows — click-count targets (R13.24, R13.19)
- **Create task** ≤2 clicks (board "Add" → type title → Enter).
- **Drag a Kanban card** 1 drag, optimistic status/order flip.
- **Submit a task** 1 click + QA form (rendered from cached schema).
- **Approve / redo** 1 click + confirm.
- **Assign a project team** search + add (autocomplete, no full form).
- Each workflow causes **no full reload** and shows **optimistic confirmation** (R13.24 / P-DATAENTRY).
- **Verification:** click-count + time test per workflow (≤2 clicks, no reload, optimistic).

## Component mapping (Phase 7 — composes only from openspec/COMPONENT-SYSTEM.md)
> Every Phase 7 screen composes ONLY primitives from `openspec/COMPONENT-SYSTEM.md` §1–§8 (no
> ad-hoc UI). This maps each Phase 7 screen/workflow to exact component names. The module
> composites named below are the §7 composites (built FROM the §1–§6 primitives), not new primitives.

- **ProjectCard** (§7 composite, grid/list): name + `StatusBadge`/`Badge` (status + priority
  variants, §3) + deadline + `Progress` (§3) + `AvatarGroup` (§3) + pin `IconButton` (`Button` size
  `icon`, §1). Click → project detail route.
- **TaskKanbanBoard** (§7 composite): dnd-kit columns To Do / In Progress / Under Review / Done;
  virtualized cards (`@tanstack/react-virtual`, §3 virtualization rule); drag = optimistic status
  flip + debounced persist (`PUT /tasks/{id}/reorder` + `PATCH /tasks/{id}/status`, idempotent via
  `client_id`); `ContextMenu` (§2) quick actions (status change, pin, edit). `canDrop` gate blocks
  dependency-blocked cards from dropping into In Progress.
- **TaskList** (§7 composite = `DataTable` variant, §3): sortable columns, inline-edit pencil on
  hover (Input-in-place → Enter save / Esc cancel + `Toast`), drag-reorder rows (dnd-kit), row click
  → `TaskDetailSheet`; toolbar = shared `FilterBar` (§5).
- **TaskDetailSheet** (`Sheet`, right, §2): description; `Slider` progress (0–100%, §1, optimistic);
  assignee `Combobox` (§3, multi-assign); comments via lazy `TiptapEditor` (§8); activity log grouped
  by date in `Accordion` (§2); QA form rendered from cached schema + submit `Button` (§1) + note
  `Textarea` (§1).
- **GanttView** (lazy import; layout in a web worker per §8 `Chart`/R13.17): ECharts/custom project
  bars + milestone diamonds + dependency linkages from `tasks.depends_on`; `Tooltip` (§2) on hover.
- **QAFormBuilder** (§7 composite): `Accordion` (§2) of fields; field types compose `Input`,
  `Textarea`, `Checkbox`, `Slider`, `Select` (§1); any rich-instructions field uses `TiptapEditor`.
- **TaskForm** (`Dialog`, §2): `Form` (§1) + assign `Combobox` + priority/scope `Select` + due
  `DatePicker` (§1) + dependencies selector + recurring-rule `Collapsible` (§2).
- **Quick Task Assignment widget** (R7.11): dashboard `Button` → `Dialog` (assignee `Combobox` +
  title `Input` + due `DatePicker` + note `Textarea`) → optimistic confirmation `Toast` (§6) + Global
  Chat queued auto-notify on completion.
- **My Tasks personal list** (R7.17): `DataTable` + create `Button` (`POST /me/tasks`); self-create
  works fully offline.
- **Saved views / custom columns** (R7.18): TanStack Table column visibility (instant toggle, zero
  network requests) + named saved views cached in TanStack Query; reused by Phase 9 reports.
- **Pinned items** (R7.18): reuses the §4 `PinnedItems` sidebar section (pin `IconButton` on
  project/task/profile; star toggle on hover).

## New ADRs
None. Respects ADR-007 (dnd-kit for Kanban/list/tree, never React Grid Layout), ADR-008 (Query vs Zustand split), ADR-009 (Tasks = Version+Merge, Projects = Server Validation, Comments = Timestamp), ADR-010 (shared Offline Engine), ADR-013 (Reverb realtime). No stable contract changes.
