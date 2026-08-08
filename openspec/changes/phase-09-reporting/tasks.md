# Tasks — reporting

> Ordered, chunked (~2h each), tagged. Each phase ends with test + deploy + archive.

- [ ] 1. [spec] Extend OpenAPI: `GET /reports`, `GET /reports/{key}`, `GET /reports/{key}/summary`, `POST /reports/{key}/export`, `GET /reports/export-jobs[/{id}[/download]]`, saved-views CRUD. Lint green.
- [ ] 2. [ui-pkg] Regenerate API types; add `ReportsClient` methods in the shared API client.
- [ ] 3. [api] Migration: create `report_definitions` (seed the four report keys), `saved_views`, `export_jobs`, `scheduled_reports`; indexes on `user_id`/`report_key`/`status`.
- [ ] 4. [api] `ReportScope` value object: resolve Admin (company-wide) vs HR-limited (managed employees/projects) from the caller's capabilities; expose scope to all report queries.
- [ ] 5. [api] Capabilities: register `reports.view-admin` (Super Admin) and `reports.view-hr-limited` (HR) in the matrix; `require-capability` middleware on all report endpoints.
- [ ] 6. [api] Attendance report builder: aggregate clock-in/out, hours, overtime, late by employee/day for a scope; apply date-range / department / individual filters clamped to scope; empty-state on no matches (R9.1).
- [ ] 7. [api] Project completion report: per-project team, tasks done, time spent, completion date, approval result; status + date-range filters (R9.2).
- [ ] 8. [api] Task completion statistics: counts and completion rate by status / priority / assignee / project / date-range (R9.3).
- [ ] 9. [api] Employee productivity summary: per-employee attendance hours + overtime, task throughput, project contributions; sort by metric (R9.4).
- [ ] 10. [api] `GET /reports/{key}` + `/summary`: paginate rows, return aggregate `summary`; validate and clamp filters to `ReportScope`; reject explicit out-of-scope selections (R9.5).
- [ ] 11. [api] HR-limited scoping enforcement: every report query runs through `ReportScope`; tests prove HR cannot see out-of-scope employees/projects (R9.5).
- [ ] 12. [api] Excel export job (queued): Laravel Excel query-based export to private disk; snapshot filters into `export_jobs`; status transitions queued→processing→completed; failure logged (R9.6).
- [ ] 13. [api] PDF export job (queued): dompdf renders a Blade report view (header, filters, tables, pagination) to PDF in the queue; reuse `export_jobs` pipeline (R9.6).
- [ ] 14. [api] `POST /reports/{key}/export` → 202 `{ export_job_id }`; `GET /reports/export-jobs[/{id}]` for polling; `GET /reports/export-jobs/{id}/download` owner-gated signed URL.
- [ ] 15. [api] Saved report views CRUD: owner-scoped list/create/delete on `saved_views` keyed by `report_key`; 403 cross-user (R9.8, reuse Phase 7 pattern).
- [ ] 16. [api] Weekly Sunday admin summary: scheduled command `report:weekly-admin-summary` (`->weeklyOn(0,'Sunday')`) reads active `scheduled_reports`, builds company-scope report, renders + mails to Admin, updates `last_run_at`, retries+logs on failure (R9.7).
- [ ] 17. [api] Config-driven schedule/recipient (`REPORTS_WEEKLY_DAY`, `REPORTS_WEEKLY_ADMIN_EMAILS`); seed a default weekly admin `scheduled_reports` row.
- [ ] 18. [seed] Seeder: `report_definitions` (4 keys), a default weekly-admin scheduled report, sample saved views for Karthik/Aravind, and a couple of completed export jobs for UI states.
- [ ] 19. [web] Reports area shell: list report families by capability, shared filter/sort bar with removable chips (R3.8), report-appropriate filter options per family (R9.8).
- [ ] 20. [web] Virtualized report table: TanStack Table + `@tanstack/react-virtual`, server-side pagination (`page`/`per_page`), debounced filter/sort to API; summary tiles from `/summary` (R9.8 / R11.5).
- [ ] 21. [web] Attendance report screen wired to `/reports/attendance` + filters + heatmap-style status badges (R9.1).
- [ ] 22. [web] Project completion report screen (R9.2); task completion statistics screen (R9.3); productivity summary screen with per-employee metric columns + sort (R9.4).
- [ ] 23. [web] Export flow: format chooser → `POST .../export` → poll `export-jobs` → download signed URL; toast on ready; warn large scopes to prefer Excel (R9.6).
- [ ] 24. [web] Saved report views: save current filters/columns/sort as a named view, list + apply + delete (owner-scoped) (R9.8).
- [ ] 25. [web] Route guard: hide/redirect users without `reports.view-admin` or `reports.view-hr-limited`; show HR scope hint; empty states with illustration (R3.13).
- [ ] 12a. [api][test][perf] Queue offload for heavy reports (>500ms) + 202 contract: feature test asserts a report query/export estimated to exceed 500ms dispatches a job (`ExportReport`/`RunReportAggregation`) rather than running inline; `POST /reports/{key}/export` returns **202** `{ export_job_id }`; the originating request never blocks on generation. (R9.6, R13.4, R13.17 / P-QUEUE)
- [ ] 6a. [api][test][perf] Composite indexes + query-budget tests for report queries: add `attendance(date, department_id)`, `tasks(project_id, status)`, `projects(deadline)` (alongside the `user_id`/`report_key`/`status` indexes); assert `GET /reports/{key}` executes ≤5 SQL, zero N+1 via `DB::enableQueryLog()` at 10k source rows, and `EXPLAIN` shows index usage (no seq scan on filtered columns). (R9.8, R13.5, R13.6 / P-NO-N1/Q-COUNT/INDEX)
- [ ] 20a. [web][ui-pkg][test][perf] Virtualized report tables + memoized rows: confirm TanStack Table + `@tanstack/react-virtual` mounts only visible+overscan rows on a 5000-row fixture at 60 FPS (R13.14); rows are `React.memo`'d with stable keys, no anonymous callbacks in props; React Profiler render-count test asserts no render storm on filter/sort (R13.12).
- [ ] 13a. [api][test][perf] Queued Excel/PDF generation + streamed download: assert the queued `ExportReport` job produces xlsx (Laravel Excel query-based, flat memory) and pdf (dompdf Blade render; snappy fallback) files, `export_jobs` transitions queued→processing→completed, and `GET /reports/export-jobs/{id}/download` streams the owner-gated signed file (403 for non-owner). (R9.6, R13.17 / P-QUEUE)
- [ ] 19a. [web][test][perf] Saved-view caching + debounced filters: saved views restore filters+columns+sort from client cache with no refetch (R13.10); filter bar debounces server-side input at 250ms and updates URL+cache in place with no full reload (R13.15); stale-while-revalidate report cache shows first frame ≤100ms on revisit (R13.3). Playwright type-then-result-latency test < 300ms.
- [ ] 16a. [api][test][perf] Sunday weekly email — idempotent scheduled job test: `report:weekly-admin-summary` dispatches email generation to the queue (command does no heavy aggregation inline, R13.17); an idempotency guard (`scheduled_reports.last_run_at` + week key) means running the command twice for the same week sends exactly one email; `last_run_at` updates once. (R9.7, R13.17 / P-QUEUE)
- [ ] 26. [test] api feature tests: all four reports + filters/summary; HR-limited scoping; export queue (xlsx+pdf) + owner-gated download; weekly Sunday command + retry/log; saved views ownership; capability 403s.
- [ ] 27. [test] web tests: shared filter bar per family; virtualized table renders only visible rows on a large fixture; saved-view CRUD; export queued→ready→download; route guard.
- [ ] 28. [deploy] Staging deploy; smoke as Karthik (full scope) run+export each report, and as Aravind (HR, limited team); trigger the weekly command manually and confirm the admin email lands; verify scheduler worker is running; promote production.
- [ ] 29. [docs] Archive Phase 9 via `/opsx:archive`; update tracker ✅.
