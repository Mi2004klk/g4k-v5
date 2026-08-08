## Purpose
Give the Super Admin a single place to configure the company, working time, security policies, reminders, and notifications, plus a central audit trail of every important action, production observability, and a measured performance gate for the M1 freeze.

## ADDED Requirements

### Requirement: Company profile
The system SHALL let an Admin maintain a single company profile with logo (uploaded, optimized/sized), name, short name, timezone, and a branding json block, stored as a singleton row. (R10.1)

#### Scenario: profile is updated
- **WHEN** an Admin saves the company profile (logo/name/timezone)
- **THEN** the change persists in the single company-profile row and the logo/name/timezone are reflected app-wide (sign-in, app shell, reports)

#### Scenario: only one company profile exists
- **WHEN** an Admin opens company settings
- **THEN** the singleton profile is loaded for editing (no list, no create-new)

### Requirement: Working hours
The system SHALL let an Admin configure standard working hours per weekday (start/end + break window) that attendance and reports use as the baseline. (R10.1)

#### Scenario: working hours drive attendance rules
- **WHEN** an Admin saves standard working hours
- **THEN** late/overtime thresholds (Phase 5), reminders, and reports read the updated baseline

### Requirement: Holiday calendar
The system SHALL let an Admin manage a holiday calendar (CRUD: name, date, optional description) that the attendance and leave modules consume read-only. (R10.1)

#### Scenario: holiday added
- **WHEN** an Admin creates a holiday
- **THEN** it appears in the calendar views of Attendance (Phase 5) and Leave (Phase 6), and that day is treated as non-working

#### Scenario: holiday removed
- **WHEN** an Admin deletes a holiday
- **THEN** it is removed from all calendar views and no longer marks the day non-working

### Requirement: Password policies
The system SHALL let an Admin configure password policies (minimum length, expiry period) that the auth flows enforce. (R10.2)

#### Scenario: policy enforced on change
- **WHEN** an Admin raises the minimum length or sets an expiry
- **THEN** subsequent password sets/changes are validated against the new policy, and expired passwords force a change on next sign-in

### Requirement: Session and device rules
The system SHALL let an Admin configure session/device rules (session timeout, max concurrent devices per user) that the auth system enforces. (R10.2)

#### Scenario: rule applied to sessions
- **WHEN** an Admin tightens session timeout or the device limit
- **THEN** existing sessions exceeding the rule are revoked and new logins honor the new limits

### Requirement: Notification preferences
The system SHALL let an Admin configure notification preferences (which events surface in the bell, which are high-priority/global) that the notification system (Phase 8) honors. (R10.2)

#### Scenario: preference changes notification routing
- **WHEN** an Admin toggles a notification preference
- **THEN** subsequent events are routed (or suppressed) accordingly in the bell + Notification Center

### Requirement: Configurable reminder times
The system SHALL let an Admin configure reminder times (e.g. attendance shift-reminder lead/late windows) that the schedulers consume. (R10.2)

#### Scenario: reminder time changed
- **WHEN** an Admin changes the attendance reminder lead or late window
- **THEN** the scheduler fires the reminder at the new configured offset

### Requirement: Audit log capture
The system SHALL record every important action in a central audit log — including who created, approved, or deleted what, and when — capturing user, action, subject type/id, before/after diff, source IP, and timestamp; any per-phase audit tables from earlier modules SHALL be unified into this one store. (R10.3)

#### Scenario: create action is captured
- **WHEN** a user creates an auditable record (e.g. a project, a leave request)
- **THEN** an audit-log row is written with the action, subject, before/after diff, actor, IP, and timestamp

#### Scenario: approve action is captured
- **WHEN** an approver approves or rejects a submission
- **THEN** the audit log records the approver, the decision, and the before/after state

#### Scenario: delete action is captured
- **WHEN** a user deletes an auditable record
- **THEN** the audit log records the actor, the action, and the before state

### Requirement: Audit log filter and export
The system SHALL let an Admin filter the audit log (by user, action, subject type, date range) and export the result (Excel/PDF). (R10.3)

#### Scenario: filter and export
- **WHEN** an Admin applies filters and chooses export
- **THEN** only matching rows are returned and a file is produced containing those rows

### Requirement: Production monitoring
The system SHALL wire Sentry (error tracking) and Laravel Pulse (performance/health) for production, with source maps and release tagging. (R10.4)

#### Scenario: production errors are captured
- **WHEN** an unhandled error occurs in production
- **THEN** it is reported to Sentry tagged with the release, and Pulse records slow requests/jobs

### Requirement: Performance audit and M1 freeze
The system SHALL meet the performance targets (§19/§11.5: initial UI <1s, navigation instant, input <100ms, 60 FPS practical) measured via Lighthouse and Core Web Vitals; any regression SHALL be fixed before the M1 freeze. (R10.5)

#### Scenario: Lighthouse meets targets
- **WHEN** a Lighthouse run is executed against the production web build
- **THEN** the key routes score at or above the agreed targets and no critical regression is open

#### Scenario: Core Web Vitals meet targets
- **WHEN** Core Web Vitals (LCP, INP, CLS) are measured
- **THEN** they fall within the target thresholds for the M1 freeze

#### Scenario: M1 freeze gate
- **WHEN** all phases are archived, seeded, monitored, deployed with rollback + backups verified, and the perf audit passes
- **THEN** the M1 freeze milestone is marked complete

### Requirement: Scalable, indexed, virtualized audit log
The audit log SHALL scale to very large row counts without degradation: the viewer SHALL be virtualized (capped DOM nodes regardless of data) and cursor-paginated on every filter path; the backing table SHALL be indexed on the common filter combinations `(subject_type, subject_id, at)`, `(user_id, at)`, and `(at)`; and the list query SHALL execute at most 5 SQL queries with zero N+1 regardless of row count. (R13.5/6/14)

#### Scenario: audit log stays fast at scale
- **WHEN** an Admin opens the audit log with tens of thousands of rows present
- **THEN** the list renders virtualized (DOM node count ≤ visible + overscan, 60 FPS), is cursor-paginated (no OFFSET), and the read executes ≤ 5 SQL queries with zero N+1

#### Scenario: filtered queries use indexes
- **WHEN** an Admin filters by subject type, by user, or by date range
- **THEN** the query plan uses the composite indexes `(subject_type, subject_id, at)` / `(user_id, at)` / `(at)` and filter changes debounce at 250ms updating URL+cache in place without a reload

### Requirement: Non-blocking audit logging
The central activity logger SHALL write audit rows asynchronously/queued so that the audited operation (create/approve/delete across modules) is never slowed by audit persistence; a failed audit write SHALL be reported to Sentry/Pulse but SHALL NOT fail the user's operation. (R13.17)

#### Scenario: audited operation is not delayed
- **WHEN** a user creates/approves/deletes a record that is being audited
- **THEN** the audit row is written via an async/queued path and the user's operation returns without waiting on audit persistence

#### Scenario: failed audit write does not break the operation
- **WHEN** the audit write itself fails
- **THEN** the user's original operation still succeeds and the audit-write failure is surfaced in Sentry/Pulse

### Requirement: Cached settings and reference data
System settings and the company profile SHALL be read-through cached server-side (they change rarely) with cache invalidation on write, and client reads SHALL use a `staleTime` of 1 hour with mutation cache-key busting; the holiday calendar and working-hours config SHALL be cached and reused by the Attendance reminders and reports without refetch on each use. (R13.10)

#### Scenario: settings served from cache
- **WHEN** a client or scheduler reads settings, company profile, holidays, or working hours
- **THEN** the read is served from cache without hitting the database on every request

#### Scenario: settings write invalidates cache
- **WHEN** an Admin saves a setting or the company profile
- **THEN** the read-through cache is invalidated and subsequent reads observe the new value via stale-while-revalidate

### Requirement: M1 performance-freeze verification gate
Before the M1 freeze is declared, the system SHALL pass a final performance verification: all primary routes meet field p75 LCP ≤ 2.5s, INP ≤ 200ms, and CLS ≤ 0.1 for 7 consecutive days in production; First-Load JS is ≤ 200KB gzipped per route; zero N+1 queries across all modules (≤ 5 SQL per list request); Sentry (errors+perf), Laravel Pulse, and field web-vitals are live in production; Lighthouse CI is green on all primary routes; and every TRACKER breach entry is resolved or carries a documented plan. (R13.28/29)

#### Scenario: all routes meet field targets for 7 days
- **WHEN** field web-vitals (LCP/INP/CLS) are reviewed over the 7 days preceding the freeze
- **THEN** every primary route's p75 is within target (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1)

#### Scenario: bundle budget holds on every route
- **WHEN** the bundle budget is checked across all primary routes
- **THEN** First-Load JS is ≤ 200KB gzipped per route and Lighthouse CI is green with no open regression

#### Scenario: monitoring live and breaches triaged
- **WHEN** the production monitoring stack is verified at freeze time
- **THEN** Sentry + Pulse + field web-vitals dashboards are live, and every entry in the TRACKER breach log is either resolved or has an owner + plan
