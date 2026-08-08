# Phase 2 — Users, Roles & Org Structure

## What
The full org/people layer: capability-based permissions matrix, designations master, Admin-managed HR and Employee accounts, Admin-only Department/Team CRUD, configurable auto-numbering of company/employee/department IDs, a reusable master-data table pattern, a searchable Employee Directory, and self-service Profile screens (photo popup, change password, device list). Implements R2.1–R2.13.

## Why
This phase fills the permission model and the people/org data that every later module depends on. Capabilities become real (matrix authored + middleware wired), accounts exist to log in as, departments/teams/designations exist for assignments, and Employee Directory + Profile give every role their primary identity surfaces. It also lands the master-data table pattern that attendance, projects, and reporting reuse.

## Scope
- Capability matrix authored: roles (super_admin/hr/employee) → capability lists; `require-capability` enforced on backend for every org endpoint.
- Designations master (15 seed job titles, editable, soft-delete).
- Admin creates/edits HR accounts (name, email, employee ID, department, designation); manage dept, deactivate/delete, reset password, view activity log.
- Admin creates/edits Employee accounts (name, email, employee ID, department, team, designation); assign/reassign dept+team, assign dual role, deactivate/delete, reset password, view activity log.
- Admin-only Department CRUD (name, description); assign HR/employees; full member list; archive/delete.
- Configurable auto-numbering (prefix, start, length, format) for company/employee/department IDs — no code changes.
- Reusable master-data table pattern: create/read/update/delete/import/export/activate/deactivate/search/filter/pagination/audit.
- Employee Directory: searchable by name/dept/designation; grid/list; card → public profile + Send Message.
- Profile (all roles): photo popup (format+size limits), name, phone, designation; change password; device list + logout.
- Full seed: 1 company, 2 departments, 15 designations, 13 employees, branding, working days, holiday calendar, attendance rules, company docs.

## Non-goals
- Chat / Send Message delivery (Phase 8 — Directory only links to it).
- Attendance/project/task data (Phase 5/7) — Directory shows people only.
- Full audit-log admin UI and retention policy (Phase 10 — rows are written now, UI later).
- Holiday-calendar editor and attendance-rule editor UI (Phase 10 — seed values only here).
- General file upload system (profile-photo popup only, per R11.3).

## Phase / capability
Phase 2 of 11 · capability `org-management` · depends on Phase 0+1. Implements R2.1–R2.13.

## ADRs
Depends on the capability-based permissions principle (architecture §5.3; ADR-011 Core Platform model) and ADR-014 (Sanctum Bearer, for the active-role on the token). No new ADR.
