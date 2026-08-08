# Design — reporting

## Overview
Phase 9 is mostly read-only aggregation over data Phases 5 and 7 already write: attendance events, projects, tasks, assignments, and approvals. Four report families (attendance, project completion, task completion statistics, employee productivity) are each produced in a full Admin scope and a team-limited HR scope. The few new tables exist only to remember what users want (saved views), what work is in flight (export jobs), and what the scheduler should send (the weekly admin email). Heavy work — large aggregations and Excel/PDF generation — is offloaded to the queue so no PHP request runs long (project §28).

## Data model (new tables)
Reports read existing tables; three small tables are added:

- `report_definitions`: catalog metadata, not user data. `id`, `key` (enum-ish slug: `attendance`, `project-completion`, `task-completion`, `productivity`), `name`, `default_filters` (json), `created_at`. Seeded once; lets the UI and API refer to report families by stable key. (Optional/low-cardinality; could be a config array if a table is deemed overkill, but a table keeps it queryable for saved-view joins.)
- `saved_views`: `id`, `user_id` (fk), `report_key`, `name`, `filters` (json), `columns` (json, optional custom column set), `sort` (json), `created_at`, `updated_at`. Reuses the saved-views pattern introduced in Phase 7 (R7.18) — same shape, scoped to `report_key`. One user may have several saved views per report.
- `export_jobs`: `id`, `user_id` (fk), `report_key`, `format` enum(xlsx,pdf), `filters` (json snapshot at request time), `status` enum(queued,processing,completed,failed), `file_path`/`disk` nullable, `row_count` nullable, `error` nullable, `created_at`, `completed_at`. Drives async Excel/PDF generation and the download endpoint. File stored on a configured disk (private; signed URL for download).
- `scheduled_reports`: `id`, `report_key`, `recipient_type` enum(admin), `recipient_user_id` (fk, nullable), `cron` (default weekly Sunday), `filters` (json), `format` enum(xlsx,pdf), `last_run_at` nullable, `active` bool, `created_at`. Seeds the weekly Admin summary (R9.7). Extensible later to other scheduled consumers without a schema change.

No report-result tables: results are computed on demand from source tables so reports always reflect the latest data; exports persist only as generated files in `export_jobs`.

### Source tables read (not modified)
- Attendance (Phase 5): attendance events/shifts, overtime, late flags, manual corrections, audit.
- Projects & tasks (Phase 7): projects, tasks, assignments, comments/activity log, approvals, project/task time logs, statuses, priorities.
- Org (Phase 2): users, departments, designations, team memberships (for HR scope resolution and grouping).
- Leave (Phase 6): leave status (to mark attendance days as leave in the attendance report).

## Report scope and permission
Capability-gated, role-aware scoping decided in the backend (Architecture Principle 3 / Contract):

- `reports.view-admin` (Super Admin): company-wide scope; every employee, project, and task is visible.
- `reports.view-hr-limited` (HR): scope clamped to employees/projects HR manages (reusing the same team-management relation Phases 5 and 7 already gate on).

Scope resolution is a single `ReportScope` value object computed from the authenticated user's capabilities: `{ type: 'admin' | 'hr-limited', employeeIds: Set, projectIds: Set }`. Every report query and every filter validation runs through it, so an HR user cannot pass an out-of-scope `employee_id` or `project_id` and see data (R9.5). Filters are clamped to the in-scope set server-side; an explicit out-of-scope selection is rejected.

## API (OpenAPI additions)
All Sanctum-guarded and capability-checked. Filters are query params validated against `ReportScope`.

- `GET /reports` → list of available report families for the caller's capabilities (Admin sees all four; HR sees the four limited versions).
- `GET /reports/{report_key}` → report rows for the caller scope + applied filters (paginated for table render; aggregated totals in a `summary` block). `report_key` ∈ `attendance | project-completion | task-completion | productivity`. Filters: `date_from`, `date_to`, `department_id`, `employee_id`, `project_id`, `status`, `priority`, `sort`, `page`, `per_page`. Server clamps `department_id`/`employee_id`/`project_id` to the caller's scope.
- `GET /reports/{report_key}/summary` → just the aggregate totals (counts, rates, hours) for dashboard tiles / header chips without fetching all rows.
- `POST /reports/{report_key}/export` → `{ format: 'xlsx'|'pdf', filters }` → 202 `{ export_job_id }`. Queues the export job.
- `GET /reports/export-jobs` → caller's recent export jobs (status polling). `GET /reports/export-jobs/{id}` → detail incl. signed download URL when `completed`.
- `GET /reports/export-jobs/{id}/download` → streams the generated file (capability-gated to the job owner; signed/short-lived).
- `GET /reports/{report_key}/saved-views` / `POST .../saved-views` / `DELETE /reports/saved-views/{id}` → CRUD on saved views (owner-scoped; user cannot read another user's saved views).

## Excel export
Tabular, one sheet per report family (attendance may add a per-day and a per-employee summary sheet). Implemented with Laravel Excel (maatwebsite/excel) backed by PhpSpreadsheet — a query-based export streams rows from the report query so memory stays flat on large scopes. Filters snapshot from the request into `export_jobs.filters` so the file matches what the user saw. On completion, the file is written to a private disk and a signed download URL is handed back. Reuses/generalizes the Phase 5 attendance Excel export (R5.10) into the same job pipeline.

## PDF export
Formatted document (tables + header with company name/logo, report title, applied filters, generated-at, page numbers). Implemented with dompdf (Laravel-DomPDF) for HTML/CSS-to-PDF with no external binary dependency (snappy/wkhtmltopdf is an alternative if richer layout is later needed). The same report query feeds a Blade view rendered to PDF inside the queued job. Large PDFs are paginated; very large scopes warn the user to prefer Excel.

## Queue offload (project §28)
Both export formats and any report query estimated to exceed a row threshold are dispatched to the queue (`ExportReport` / `RunReportAggregation` jobs) rather than run inline, so no PHP request blocks on heavy aggregation or document generation. Retry policy follows the shared queue (project §9 retry ladder). Export job progress is observable via `GET /reports/export-jobs/{id}`. This is the direct application of "offload slow work to queues; avoid long-running PHP requests" from §11.5/§28.

## Scheduler — weekly Sunday admin email (R9.7)
A scheduled command `report:weekly-admin-summary` is registered in `routes/console.php` (or `app/Console/Kernel`), scheduled weekly on Sunday via Laravel's scheduler (`->weeklyOn(0, 'Sunday')` per project §4 scheduler on Railway). The command:
1. Loads active `scheduled_reports` rows of `recipient_type=admin`.
2. For each, builds the configured report(s) over the past week at company scope (Admin), renders the PDF (and/or Excel) and an HTML email summary, and mails it to the Admin recipient(s).
3. Updates `last_run_at`; failures retry per queue policy and are logged (never silently skip a week).

Schedule and recipients are config/env-driven (`REPORTS_WEEKLY_DAY`, `REPORTS_WEEKLY_ADMIN_EMAILS`) so they change without code. The scheduler worker must be running on Railway (already provisioned in Phase 0).

## Virtualization on report tables (R9.8 / R11.5)
Report tables are large (a year of attendance × employees). On the web client, report rows render through TanStack Table backed by `@tanstack/react-virtual` (row virtualization) — only visible rows mount, DOM nodes are reused on scroll, so a 50k-row attendance report stays at 60 FPS. This matches the platform-wide virtualization rule (R11.5) and reuses the same virtualized table component used for employees/attendance logs/tasks. Server-side pagination (`page`/`per_page`) keeps payloads bounded; the client virtualizes each page. Sorting and filtering hit the API (debounced) rather than running on the full client set.

## Saved report views (R9.8)
Reuses the Phase 7 saved-views pattern (R7.18) with `report_key` as the discriminator. The web client lists the user's saved views per report, applies one on click (restoring filters + columns + sort into the shared filter bar), and lets the user save/update/delete their own. Saved views are owner-scoped; no sharing in M1 (deferred).

## Capabilities (introduced)
- `reports.view-admin` → Super Admin. Full company-wide scope across all four report families; can export; can save views; is the weekly email recipient.
- `reports.view-hr-limited` → HR. Same four report families, scope clamped to managed employees/projects; can export within scope; can save own views.
- Employees have no report capability in M1 (their personal attendance/task history is served by Phases 5 and 7, not the reporting module).

Capability checks run server-side on every endpoint; the web client additionally hides report routes from users lacking the capability (route guard from Phase 1).

## Test strategy
- api feature tests:
  - Attendance report: scope + filters (date range, dept, individual); late/overtime aggregation; empty-scope empty state.
  - Project completion report: team/tasks-done/time/completion-date/approval-result aggregation; status + date filters.
  - Task completion statistics: counts and completion rate by status/priority/assignee/project/date.
  - Productivity summary: per-employee rollup; sort by hours/tasks.
  - HR-limited scoping: HR cannot see out-of-scope employees/projects; out-of-scope filter is clamped/rejected; Admin sees all.
  - Export: `POST .../export` returns 202 and creates an `export_jobs` row; Excel and PDF jobs produce a file; download endpoint serves owner only (403 for others); file matches the applied filter snapshot.
  - Scheduler command: weekly Sunday job builds the report, attaches it, and mails the Admin; `last_run_at` updates; failure is retried and logged.
  - Saved views: owner-scoped CRUD; another user cannot read/write a view they don't own.
  - Capability gate: 403 for users lacking the report capability; employees get no access.
- web tests:
  - Shared filter bar renders per report family; chips removable; filters debounce to the API.
  - Virtualized table renders only visible rows for a large fixture and stays smooth on scroll.
  - Save/apply/delete a saved view; selecting one restores filters+sort+columns.
  - Export button shows queued→ready→download states via export-job polling.
  - Route guard hides/redirects users without the report capability.
- e2e: Admin runs attendance report → filters → exports Excel → downloads; HR runs same report → only their team appears; weekly email is produced by the scheduled command in a test run.

## Performance Requirements (Phase 9)
Reports aggregate large, growing datasets (a year of attendance × every employee; every task in
every project). The phase obeys the platform-wide performance constitution: heavy work goes to the
queue, the dataset is virtualized on the client, queries are indexed and bounded, and frequent
report workflows stay at ≤2 clicks with no full reload. This block references `PERFORMANCE-STANDARDS.md`
P-* IDs and `REQUIREMENTS.md` R13.x; it adds measurable targets, it does not relax anything above.

### Heavy reports offloaded to queues — never a long blocking request (R13.4, R13.17 / P-QUEUE)
- **Queue offload (R13.17 / P-QUEUE; R13.4 "heavy report endpoints stream/queue"):** any report
  query or export **estimated to exceed 500ms** MUST be dispatched to a Laravel queue
  (`ExportReport` / `RunReportAggregation` jobs) — never run inline as a long blocking PHP request
  (project §11.5/§28). *Verify:* feature test asserts a heavy-scope request does not exceed the
  inline read budget and instead dispatches a job.
- **202 + download contract:** `POST /reports/{key}/export` returns **202 `{ export_job_id }`**
  immediately; the client polls `GET /reports/export-jobs/{id}` and receives the **signed download
  URL on completion**. *Verify:* contract test asserts 202 (not 200) and a downloadable file on the
  completed job; the originating request never blocks on generation.
- **Streamed download:** `GET /reports/export-jobs/{id}/download` **streams** the generated file
  (owner-gated, signed/short-lived); no buffering of large files into a single response payload.

### Report query optimization — efficient SQL, ≤5 queries (R13.5, R13.6 / P-NO-N1/Q-COUNT/INDEX)
- **Pre-aggregated/summarized data:** report rows use `GROUP BY` aggregation and summary endpoints
  (`GET /reports/{key}/summary`) for dashboard tiles rather than re-fetching all rows. Where a
  metric is computed repeatedly, prefer a summarized query over pulling the full row set.
- **≤5 SQL per list request, zero N+1 (R13.5 / P-NO-N1/Q-COUNT):** `GET /reports/{key}` executes
  ≤5 SQL queries regardless of row count; eager loading for joins (employee, project, department);
  Laravel Telescope flags N+1 in dev. *Verify:* `DB::enableQueryLog()` count test at 10k source rows.
- **Indexes (R13.6 / P-INDEX):** composite indexes supporting report filters —
  `attendance(date, department_id)`, `tasks(project_id, status)`, `projects(deadline)` — plus the
  `user_id`/`report_key`/`status` indexes already in the migration. *Verify:* migration review +
  `EXPLAIN` asserts index usage on report queries (no seq scan on filtered columns).

### Virtualized report tables (R13.14, R13.12 / P-VIRTUAL/RERENDER)
- **Virtualization above 100 rows (R13.14 / P-VIRTUAL):** report tables render through TanStack
  Table backed by `@tanstack/react-virtual`; only visible rows mount, DOM nodes are capped at
  visible+overscan regardless of data size. *Verify:* 5000-row report fixture asserts DOM node count
  ≤ (visible + overscan) and 60 FPS on scroll.
- **Memoized rows + stable keys (R13.12 / P-RERENDER):** report rows are `React.memo`'d with stable
  keys; no anonymous callbacks/objects passed as props into hot rows; TanStack Query `select` for
  derived aggregates. *Verify:* React Profiler render-count test on a large report asserts no render
  storm on filter/sort.

### Queued Excel/PDF generation + streamed download (R13.17 / P-QUEUE)
- **Excel/PDF in the queue worker (R13.17 / P-QUEUE):** both formats are generated inside the queued
  `ExportReport` job (Laravel Excel query-based export / dompdf Blade-render), not in the web
  request; memory stays flat via streaming. *Verify:* job test asserts a file is produced and
  `export_jobs` transitions queued→processing→completed.
- **PDF via dompdf/snappy (not blocking):** dompdf renders HTML/CSS to PDF with no external binary
  dependency (snappy/wkhtmltopdf is the documented fallback); large PDFs paginate and very large
  scopes warn the user to prefer Excel. The render never blocks a PHP request.

### Saved views cached + debounced filters (R13.10, R13.15, R13.3 / P-CACHE/SEARCH/NAV)
- **Saved-view caching (R13.10 / P-CACHE):** saved report views are cached on the client; applying a
  saved view restores filters+columns+sort from cache instantly (no refetch of the view metadata).
  Report rows themselves use a tuned `staleTime` (e.g., 60s — reports are history-oriented, less
  volatile than dashboards) with stale-while-revalidate on revisit.
- **Debounced filters, 250ms (R13.15 / P-SEARCH):** the shared filter bar debounces server-side
  filter/sort input at 250ms; filter changes **update the URL + cache in place** — no full reload.
  *Verify:* Playwright type-then-result-latency test < 300ms server search; URL reflects the filter.

### Weekly Sunday Admin email — idempotent scheduled job (R13.17, R9.7 / P-QUEUE)
- **Scheduled queue job:** `report:weekly-admin-summary` runs on Laravel's scheduler
  (`->weeklyOn(0,'Sunday')`) and dispatches the email generation to the queue — the scheduler
  command itself never does the heavy aggregation inline (R13.17 / P-QUEUE).
- **Idempotent:** a per-run idempotency guard (e.g., `scheduled_reports.last_run_at` + week key)
  prevents duplicate emails if the scheduler fires twice (clock skew, manual rerun). *Verify:* test
  runs the command twice for the same week and asserts exactly one email.

### HR-limited scope enforced server-side (single ReportScope clamp)
- **Single server-side clamp:** scope resolution is one `ReportScope` value object applied to every
  report query and every filter validation; **no client-side filtering of large sets** — an HR user
  simply never receives out-of-scope rows (R9.5). *Verify:* feature test asserts HR rows ⊆ managed
  set; out-of-scope filter values are clamped/rejected server-side.

### Charts dynamically imported + web-worker aggregation (R13.8, R13.17 / P-LAZY/ASYNC-FS)
- **ECharts dynamically imported (R13.8 / P-LAZY):** any report chart (e.g., weekly/monthly graph)
  is a dynamic import loaded on first use and idle-prefetched when likely; it is never in the report
  route's main chunk. *Verify:* bundle analyzer shows ECharts out of the report route chunk.
- **Client aggregation in a web worker (R13.17 / P-ASYNC-FS):** where any client-side aggregation
  runs over the rendered report set, it executes in a web worker (or is chunked) so no main-thread
  task exceeds 50ms (INP protection).

### Frequent workflows — click/latency budgets (R13.24 / P-DATAENTRY)

| Workflow | Clicks | Notes |
|---|---|---|
| **Run a saved report** | 1 click | saved-view applied from cache, no reload (R9.8, R13.3/10) |
| **Export a report** | 1 click + queued | 202 → poll → download; queued, streamed (R9.6, R13.4/17) |
| **Schedule the weekly email** | config once | `scheduled_reports` row + env-driven schedule (R9.7) |

All report workflows: **≤2 clicks, no full reloads**, cached/skeleton rendering on revisit (R13.24 /
P-DATAENTRY). First paint of a report uses a skeleton matching the table shape (R13.18 / P-SKELETON);
a failed report widget is contained by its error boundary and never blocks the page (R13.21 / P-RESILIENT).

## Component mapping (Phase 9 — composes only from openspec/COMPONENT-SYSTEM.md)
> Phase 9 is read-only aggregation; every screen composes ONLY primitives from
> `openspec/COMPONENT-SYSTEM.md` §1–§8. It introduces no new primitives.

- **ReportBuilder** (§7 composite): report type `Select` (§1) + shared `FilterBar` (§5) + generate
  `Button` (§1) → `202 { export_job_id }` (queue) → poll `GET /reports/export-jobs/{id}`; results
  render in a virtualized `DataTable` (§3 — TanStack Table + `@tanstack/react-virtual`); export
  `Button` (Excel/PDF) → queued generation → signed streamed download + completion `Toast` (§6).
- **SavedViews selector** (§7 composite): `Combobox` (§3) of saved report configs (owner-scoped);
  applying one restores filters + columns + sort from cache (instant, no refetch).
- **Report charts**: lazy `Chart` wrapper (ECharts, §8) dynamically imported + idle-prefetched; any
  client-side aggregation runs in a web worker (no >50ms main-thread work, R13.17).
- **HR-limited scope**: enforced entirely server-side via the single `ReportScope` clamp — there is
  **no client-side filtering of large sets**; the `DataTable`/`FilterBar` only ever receive in-scope
  rows, and out-of-scope filter values are clamped/rejected server-side.
- **Weekly Sunday Admin email** (`report:weekly-admin-summary`, R9.7): a scheduled Laravel queue
  job, not a UI component — renders PDF + HTML email at company scope and mails the Admin;
  idempotent via a per-week guard.

## New ADRs
None. Respects ADR-005 (OpenAPI spec-first), ADR-014 (Sanctum Bearer), and the queue/scheduler managed-process model (project §4, §28). No stable contract changes.
