## Purpose
Turn the attendance, project, and task data captured in Phases 5 and 7 into filterable, exportable, and distributable reports — attendance, project completion, task completion statistics, and employee productivity — each available company-wide for Admin and team-limited for HR, with Excel/PDF export, saved views over virtualized datasets, and a weekly summary emailed to the Admin every Sunday.

## ADDED Requirements

### Requirement: Attendance reports
The system SHALL produce attendance reports filterable by date range, department, and individual, aggregating clock-in/out, hours, overtime, and late status per employee per day for the selected scope. (R9.1)

#### Scenario: report renders the filtered scope
- **WHEN** an authorized user opens the attendance report and applies a date range, department, or individual filter
- **THEN** the report lists the matching employees and days with hours, overtime, and late status aggregated for that scope

#### Scenario: empty scope is explicit
- **WHEN** the applied filters match no attendance records
- **THEN** the report shows an empty state, not an error

### Requirement: Project completion reports
The system SHALL produce project completion reports summarizing, per project, the team, tasks done, time spent, completion date, and approval result. (R9.2)

#### Scenario: completion report lists projects
- **WHEN** an authorized user opens the project completion report for a scope
- **THEN** each project in scope shows its team, count of completed tasks, total time spent, completion date, and approval result

#### Scenario: scope narrows by status and date
- **WHEN** the user applies a project-status or date-range filter
- **THEN** only projects matching the status and within the date range are included

### Requirement: Task completion statistics
The system SHALL produce task completion statistics giving counts and completion rates by status, priority, assignee, project, and date range. (R9.3)

#### Scenario: statistics aggregate over the scope
- **WHEN** an authorized user opens task completion statistics with a project, assignee, priority, status, or date-range filter
- **THEN** the report shows task counts and completion rate broken down by the chosen dimensions

#### Scenario: completion rate is derived
- **WHEN** the scope contains tasks across multiple statuses
- **THEN** the completion rate is computed as completed tasks over total tasks for the scope and shown alongside the raw counts

### Requirement: Employee productivity summary
The system SHALL produce an employee productivity summary combining, per employee, attendance hours and overtime, task throughput, and project contributions for the selected scope. (R9.4)

#### Scenario: summary rolls up per employee
- **WHEN** an authorized user opens the productivity summary for a scope
- **THEN** each employee in scope shows their attendance hours, overtime, tasks completed, and projects contributed to for that scope

#### Scenario: scope and sort
- **WHEN** the user sorts employees by a metric such as hours or tasks completed
- **THEN** the summary reorders by that metric within the applied date/department filters

### Requirement: HR-limited report versions
The system SHALL provide HR with the same four report families, scoped so HR can see only the employees and projects they manage. (R9.5)

#### Scenario: HR sees only their team
- **WHEN** an HR user opens any report
- **THEN** the data is limited to the employees and projects HR is responsible for, with no access to other teams

#### Scenario: out-of-scope filter is rejected
- **WHEN** an HR user applies a filter that targets an employee or project outside their scope
- **THEN** the report either clamps the filter to the in-scope subset or denies the out-of-scope selection

### Requirement: Excel and PDF export
The system SHALL export any report to Excel as tabular sheets and to PDF as a formatted document, generated as background jobs. (R9.6)

#### Scenario: request an export
- **WHEN** an authorized user requests an Excel or PDF export of the current report scope
- **THEN** an export job is queued and the user is notified when the file is ready to download

#### Scenario: export reflects the applied filters
- **WHEN** the user exports after applying filters
- **THEN** the generated file contains exactly the rows and scope shown in the report at export time

#### Scenario: heavy export does not block the request
- **WHEN** the export covers a large scope
- **THEN** generation runs in the queue and the originating request returns promptly without timing out

### Requirement: Weekly Sunday summary email to Admin
The system SHALL email a weekly summary report to the Admin every Sunday via the scheduler. (R9.7)

#### Scenario: weekly email is sent on Sunday
- **WHEN** the scheduler triggers the weekly summary job on Sunday
- **THEN** the Admin receives an email summarizing the week's attendance, project, and task highlights

#### Scenario: scheduler is config-driven
- **WHEN** the weekly schedule or recipient is changed in configuration
- **THEN** subsequent runs use the new schedule or recipient with no code change

#### Scenario: email failure is retried and logged
- **WHEN** the email send fails
- **THEN** the job retries per the queue retry policy and the failure is logged without skipping future weeks silently

### Requirement: Saved report views, shared filters, and virtualized datasets
The system SHALL let users save report views, apply the shared filter/sort bar across reports, and render large report datasets through virtualization. (R9.8)

#### Scenario: save and reuse a report view
- **WHEN** a user saves the current report's filters and configuration as a named view
- **THEN** that view is listed and re-applies its filters and configuration when selected

#### Scenario: shared filter bar across reports
- **WHEN** a user moves between report families
- **THEN** the same filter/sort bar component is used, with report-appropriate filter options and removable chips

#### Scenario: large dataset is virtualized
- **WHEN** a report returns a dataset larger than the viewport
- **THEN** only the visible rows are rendered and scrolling reuses DOM nodes so the page stays responsive

### Requirement: Heavy reports queued — 202 + download, never a long blocking request
The system SHALL offload any report query or export estimated to exceed 500ms to a Laravel queue and SHALL never run it inline as a long blocking PHP request; export endpoints SHALL return HTTP 202 with an export-job id immediately and provide the download link on completion. (R9.6, R13.4, R13.17 / P-QUEUE)

#### Scenario: heavy report does not block the request
- **WHEN** a report query is estimated to exceed 500ms (large scope, long date range)
- **THEN** the work is dispatched to a queue job rather than executed inline and the originating request returns promptly without timing out

#### Scenario: export returns 202 and a download link on completion
- **WHEN** an authorized user requests an export
- **THEN** the endpoint returns HTTP 202 with an `export_job_id`, and once the queued job completes the client obtains a signed download URL via the export-job status endpoint rather than waiting on a synchronous response

#### Scenario: download is streamed and owner-gated
- **WHEN** the owner requests the generated file
- **THEN** the download endpoint streams the file with a short-lived signed URL, and a non-owner request is rejected with 403

### Requirement: Virtualized report tables with memoized rows
The system SHALL render report tables above 100 rows through row virtualization with memoized rows and stable keys so the page stays at 60 FPS and DOM node count is capped regardless of dataset size. (R9.8, R13.14, R13.12 / P-VIRTUAL/RERENDER)

#### Scenario: large report virtualizes and stays smooth
- **WHEN** a report renders a dataset of thousands of rows
- **THEN** only the visible rows plus overscan are mounted, DOM node count is capped at visible+overscan, and scrolling stays at 60 FPS

#### Scenario: filter and sort do not cause a render storm
- **WHEN** the user applies a filter or changes sort on a large report
- **THEN** memoized rows with stable keys re-render only what changed and no anonymous-callback-in-props render storm occurs

### Requirement: Queued Excel and PDF export generation with streamed download
The system SHALL generate Excel and PDF exports inside queued jobs (not in the web request) using a streamed query-based Excel export and a dompdf (or snappy) PDF render, and SHALL hand back a streamed download. (R9.6, R13.17 / P-QUEUE)

#### Scenario: Excel export is generated in the queue and streamed
- **WHEN** an Excel export job runs
- **THEN** Laravel Excel streams rows from the report query so memory stays flat, the file is written to a private disk, and `export_jobs` transitions queued→processing→completed

#### Scenario: PDF export is generated in the queue without blocking
- **WHEN** a PDF export job runs
- **THEN** dompdf renders the Blade report view to PDF inside the queued job (snappy/wkhtmltopdf as the documented fallback), large PDFs paginate, and very large scopes warn the user to prefer Excel

### Requirement: Indexed and query-budgeted report aggregation
The system SHALL aggregate report data with efficient indexed SQL (composite indexes on common report filter columns) and SHALL execute no more than 5 SQL queries per report list request regardless of row count, with zero N+1 queries. (R9.8, R13.5, R13.6 / P-NO-N1/Q-COUNT/INDEX)

#### Scenario: report query stays within the query budget
- **WHEN** an authorized user opens a report list over a 10k-row source dataset
- **THEN** the request executes ≤5 SQL queries with no N+1, verified by query-log assertion

#### Scenario: report filters use composite indexes
- **WHEN** a report filters by date, department, project, or status
- **THEN** the query plan uses the composite indexes on `attendance(date, department_id)`, `tasks(project_id, status)`, and `projects(deadline)` rather than sequential scans
