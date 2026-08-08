## Purpose
Establish the capability-based permission model and the people/org data — designations, departments/teams, HR and Employee accounts, Employee Directory, and self-service Profile — that every later module builds on.

## ADDED Requirements

### Requirement: Capability-based permissions
The system SHALL enforce permission decisions exclusively through capabilities derived from a user's system role(s), with all decisions made in the backend; roles map to capability lists, and the frontend only renders based on the capabilities it is told. (R2.1)

#### Scenario: backend enforces capability
- **WHEN** a user calls any org endpoint without the required capability
- **THEN** the backend rejects the request regardless of what the frontend allowed

#### Scenario: role to capability lookup
- **WHEN** a user's active role is set on the session token
- **THEN** the backend resolves that role to its capability list before authorizing any action

### Requirement: Designations master
The system SHALL maintain a designations master seeded with the 15 job titles, editable and deactivatable by Admin, used as a profile label (never as a permission role). (R2.2)

#### Scenario: designation is editable
- **WHEN** an Admin edits a designation name
- **THEN** the change is stored, referenced users keep their designation, and the action is audited

#### Scenario: designation is not a permission role
- **WHEN** a user's designation changes
- **THEN** their system-role-driven capabilities do not change

### Requirement: HR account management
The system SHALL let an Admin create and edit HR accounts capturing name, email, employee ID, department, and designation. (R2.3)

#### Scenario: create HR account
- **WHEN** an Admin submits a valid new HR account
- **THEN** the account is created with the hr role, auto-numbered employee ID, and must-change-password set for first login

#### Scenario: edit HR account
- **WHEN** an Admin edits an HR account's name/email/designation
- **THEN** the changes persist and an audit row is written

### Requirement: HR lifecycle actions
The system SHALL let an Admin assign/change the department an HR manages, deactivate or delete an HR account, reset an HR password, and view an HR activity log. (R2.4)

#### Scenario: reset HR password
- **WHEN** an Admin resets an HR password
- **THEN** the HR must change it on next login

#### Scenario: deactivate HR
- **WHEN** an Admin deactivates an HR account
- **THEN** the HR can no longer sign in but their historical records are preserved

#### Scenario: view HR activity
- **WHEN** an Admin opens an HR's activity log
- **THEN** audit rows for that HR are listed newest-first

### Requirement: Employee account management
The system SHALL let an Admin create and edit Employee accounts capturing name, email, employee ID, department, team, and designation. (R2.5)

#### Scenario: create Employee account
- **WHEN** an Admin submits a valid new Employee account
- **THEN** the account is created with the employee role, auto-numbered employee ID, and must-change-password set

#### Scenario: edit Employee account
- **WHEN** an Admin edits an Employee account's team/designation
- **THEN** the changes persist and an audit row is written

### Requirement: Employee lifecycle actions
The system SHALL let an Admin assign/reassign an employee's department and team, assign a dual role, deactivate or delete the account, reset the password, and view the activity log. (R2.6)

#### Scenario: assign dual role
- **WHEN** an Admin assigns a second system role to an employee
- **THEN** on next sign-in the employee sees the Role Selection screen

#### Scenario: reassign team
- **WHEN** an Admin moves an employee to a new team
- **THEN** the employee's department and team are updated and an audit row is written

### Requirement: Admin-only Department CRUD
The system SHALL allow only Admins to create/read/update/archive/delete departments (name, description), assign HR and employees to them, and view each department's full member list. (R2.7)

#### Scenario: non-admin denied
- **WHEN** an HR or Employee attempts to create a department
- **THEN** the request is denied

#### Scenario: department member list
- **WHEN** an Admin opens a department
- **THEN** the full member list (HR + employees, with designations) is shown

#### Scenario: archive department
- **WHEN** an Admin archives a department
- **THEN** it is hidden from active lists but its members and history are preserved

### Requirement: Configurable auto-numbering
The system SHALL provide configurable auto-numbering (prefix, start, length, format) for company, employee, and department IDs, changeable in settings without code changes. (R2.8)

#### Scenario: next id generated
- **WHEN** a new account is created while a scheme is configured
- **THEN** the next ID is generated per the scheme and the counter advances atomically

#### Scenario: scheme edited
- **WHEN** an Admin edits a numbering scheme
- **THEN** new entities use the new format and existing IDs are unchanged

### Requirement: Master-data table pattern
The system SHALL provide a reusable master-data table pattern supporting create, read, update, delete, import, export, activate/deactivate, search, filter, pagination, and audit — used by designations, departments, teams, and reusable by later modules. (R2.9)

#### Scenario: bulk import
- **WHEN** an Admin uploads a valid import file for a master-data table
- **THEN** rows are created and a summary (added/updated/errored) is returned

#### Scenario: export
- **WHEN** an Admin exports a master-data table
- **THEN** a file of the current filtered result is downloaded

#### Scenario: search and paginate
- **WHEN** a user searches and pages a master-data table
- **THEN** results are filtered server-side and paginated

### Requirement: Employee Directory
The system SHALL provide an Employee Directory searchable by name/department/designation, with grid and list views; each card shows photo, name, designation, department, email, and phone (if visible); clicking opens a public profile with a Send Message action. (R2.10)

#### Scenario: search directory
- **WHEN** a user types a name, department, or designation
- **THEN** matching employees are returned, filtered and paginated

#### Scenario: open public profile
- **WHEN** a user clicks an employee card
- **THEN** the public profile opens with a Send Message action

### Requirement: Profile editing
The system SHALL give every role a Profile screen to view/edit photo (via a popup with format and size limits), name, phone, and designation, and to change password. (R2.11)

#### Scenario: photo upload popup
- **WHEN** a user opens the photo popup and selects an image
- **THEN** format and size are validated, the image is optimized, and the avatar updates

#### Scenario: change own password
- **WHEN** a user changes their password from Profile
- **THEN** the current password is verified, the new one is set, and other sessions remain valid

### Requirement: Profile device management
The system SHALL show a user's logged-in devices on their Profile and allow remote logout from any device and logout from the current device. (R2.12)

#### Scenario: remote logout from profile
- **WHEN** a user revokes a device from their Profile device list
- **THEN** that device's token is invalidated immediately

### Requirement: Full seed data
The system SHALL ship a full seed containing 1 company, 2 departments, the 15 designations, 13 employees (plus the Admin and HR), branding, working days, holiday calendar, attendance rules, and company docs. (R2.13)

#### Scenario: fresh install seedable
- **WHEN** the seeder runs on a fresh database
- **THEN** all the above records are created with auto-numbered IDs and default passwords that force first-login change

### Requirement: Scalable employee directory
The system SHALL render the Employee Directory as a virtualized list once it exceeds 100 rows (DOM nodes capped to visible + overscan, 60 FPS at 5000 rows) and SHALL return server-side search results fast enough that a debounced (250ms) query reaches a visible result in under 300ms. (R2.10, R13.14/15)

#### Scenario: directory stays responsive at scale
- **WHEN** the directory renders 5000 employees
- **THEN** the DOM node count stays at or below visible + overscan and the list scrolls at 60 FPS

#### Scenario: fast search result
- **WHEN** a user types a name, department, or designation into the directory search
- **THEN** after a 250ms debounce the server returns matches and the first result paints within 300ms total

### Requirement: Efficient user and department list queries
The system SHALL serve the user, directory, department member, designation, and team list endpoints with p95 read latency at or below 200ms at 10k rows, using cursor pagination (no OFFSET), executing at most 5 SQL queries per request with zero N+1, and backed by composite indexes on the common filters (department + status + designation + role). (R2.3/2.5/2.7/2.9/2.10, R13.4/5/6)

#### Scenario: query count budget holds
- **WHEN** a list endpoint is requested regardless of total row count
- **THEN** the request executes at most 5 SQL queries and contains no N+1 duplicates

#### Scenario: deep page stays fast
- **WHEN** a user pages deep into a list using cursor pagination
- **THEN** latency stays stable (no OFFSET scan penalty) and filtered/sorted columns are index-backed

### Requirement: Responsive user management workflows
The system SHALL make frequent user-management workflows reachable in at most 2 clicks from the dashboard with no full page reloads: creating a user (form that fits in at most 2 screens), and assigning or reassigning a department (and team) inline or via bulk multi-select, applied with optimistic confirmation and rollback on error. (R2.3/2.5/2.6/2.7, R13.24/19)

#### Scenario: create user within two clicks and screens
- **WHEN** an Admin starts creating an HR or Employee user from the dashboard
- **THEN** the create form opens within 2 clicks, fits in at most 2 screens, submits with a disabled+loader button, and returns to the list showing the new row without a full reload

#### Scenario: assign department inline without reload
- **WHEN** an Admin reassigns a user's department from the row or via bulk multi-select
- **THEN** the change applies optimistically, the list updates in place, and on error the change rolls back with a danger toast

### Requirement: Bulk operations offloaded
The system SHALL offload bulk import and export of users (and the same master-data pattern for designations and departments) to a background queue whenever the operation would exceed 500ms, producing exports as streamed/Excel downloads via a queued job, and SHALL parse/preview import files client-side in a web worker or chunked loop so the main thread is never blocked for more than 50ms. (R2.9, R13.17)

#### Scenario: large export is queued
- **WHEN** an Admin exports a large filtered user set
- **THEN** the work runs on a queue (not in the request) and a download-ready result is delivered without a long PHP request

#### Scenario: heavy import does not block UI
- **WHEN** an Admin selects a large import file for preview/parse
- **THEN** the parsing runs off the main thread (web worker or chunked) so no blocking task exceeds 50ms
