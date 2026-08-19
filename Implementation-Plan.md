# Implementation Plan — Games4Kings Workplace OS (g4k-v5)

Source of truth: `Audit-Report.md` (Pass 1 + Continuation Pass, 2026-08-20; 45 categories, 1 Critical / 10 High / ~37 Medium / ~67 Low). Every task below cites audit findings by ID + file:line. Execute groups in order: DS → Core Fixes → Features → UX Pass → QA. Within a group, respect `Depends on`.

Conventions: `apps/api` = Laravel API, `apps/web` = Next.js client, `packages/ui` = shared UI. Breakpoints: mobile ≤640, tablet 641–1024, desktop >1024 (verify against Tailwind config during TASK-DS-01). "DS tokens" = the design-token module created by TASK-DS-01.

## Execution Order (flat, dependency-sorted)

**Group 1 — Design System Foundation:** DS-01 → DS-02, DS-03, DS-04 (parallel) → DS-05, DS-06, DS-07
**Group 2 — Core Fixes:** RBAC-01, RBAC-02, STAB-01, STAB-06, SYNC-01, SYNC-02 (no deps) → RBAC-03, RBAC-04, RBAC-05(→DS none; needs DS-06 only for UI half), RBAC-06, RBAC-07, RBAC-08, RBAC-09, RBAC-10, RBAC-11, STAB-02..STAB-05, STAB-07..STAB-14, SYNC-03..SYNC-06, SYNC-09 (→SYNC-05), SYNC-07, SYNC-08, SYNC-10
**Group 3 — Feature Completion:** FEAT-01, FEAT-02 (→SYNC-03), FEAT-03 (→SYNC-02), FEAT-04, FEAT-05, FEAT-06 (→STAB-08), FEAT-07, FEAT-08 (→DS-06), FEAT-09, FEAT-10, FEAT-11, FEAT-12
**Group 4 — UI/UX Consistency:** UX-01 (→DS-02), UX-02 (→DS-03), UX-03 (→DS-04), UX-04 (→DS-05), UX-05 (→DS-06), UX-06 (→DS-07, after all FEAT), UX-07, UX-08, UX-09, UX-10
**Group 5 — Final QA:** QA-01..QA-07 (all after Groups 2–4; QA-01 test-writing can start alongside Group 2)

## Index

| Task | Group | Category | Priority | Depends On | Audit Ref | 
|---|---|---|---|---|---|
| TASK-DS-01 | 1 | Design tokens | Critical | — | AUD-UX-CONSISTENCY, AUD-UI-DUPLICATE | Done 
| TASK-DS-02 | 1 | Canonical Calendar | High | DS-01 | AUD-UI-DUPLICATE (calendars) |
| TASK-DS-03 | 1 | Canonical confirm dialog | Medium | DS-01 | AUD-UI-DUPLICATE (dialogs) |
| TASK-DS-04 | 1 | Semantic status/priority/tag color maps | High | DS-01 | AUD-UX-CONSISTENCY UX1/UX3, AUD-UI-DUPLICATE UD3 |
| TASK-DS-05 | 1 | Empty-state + dead-export pruning | Medium | DS-01 | AUD-UI-PKG UP1, AUD-UX-CONSISTENCY |
| TASK-DS-06 | 1 | List-page scaffold (filters/sort/bulk) | High | DS-01 | AUD-MISSING-FEATURES MF6, AUD-UX-CONSISTENCY |
| TASK-DS-07 | 1 | Responsive layout standards | High | DS-01 | AUD-UX-CONSISTENCY UX2 |
| TASK-RBAC-01 | 2 | Task approve/redo gate | Critical | — | AUD-API-TASKS TK1, AUD-API-TESTS TE1 |
| TASK-RBAC-02 | 2 | HrScope unification | Critical | — | AUD-API-USERS U3, AUD-API-DASH D4/D5, AUD-API-REPORTS RE2, AUD-API-LEAVE L2/L4, AUD-API-ORG O2 |
| TASK-RBAC-03 | 2 | User update integrity | High | — | AUD-API-USERS U1/U2 |
| TASK-RBAC-04 | 2 | Designation self-edit | High | — | AUD-API-PROFILE P1, AUD-RBAC-WEB RW2 |
| TASK-RBAC-05 | 2 | Gated-fetch pattern + middleware map | High | DS-06 (UI half) | AUD-WEB-PROJ WP1, AUD-RBAC-WEB RW1/RW4, AUD-WEB-DIR DI1 |
| TASK-RBAC-06 | 2 | Saved-views capability | Medium | — | AUD-WEB-REPORTS WR1 |
| TASK-RBAC-07 | 2 | department_hr target validation | Medium | — | AUD-API-ORG O3 |
| TASK-RBAC-08 | 2 | Timer ownership | Medium | — | AUD-API-TIMER TM1 |
| TASK-RBAC-09 | 2 | QA review-flow enforcement | Medium | STAB-01 | AUD-API-TASKS TK2 |
| TASK-RBAC-10 | 2 | Auth error hygiene | Medium | — | AUD-API-AUTH A4, AUD-API-MW M1 |
| TASK-RBAC-11 | 2 | Token storage consolidation | Medium | — | AUD-WEB-CORE WC1 |
| TASK-STAB-01 | 2 | QA field-type unification | Critical | — | AUD-API-QA QA1/QA2/QA4, AUD-WEB-TASKS WT1, AUD-API-TASKS TK6 |
| TASK-STAB-02 | 2 | QA delete guard | Medium | STAB-01 | AUD-API-QA QA3 |
| TASK-STAB-03 | 2 | Export artifacts + retention | Medium | — | AUD-API-REPORTS RE3 |
| TASK-STAB-04 | 2 | Pagination hardening | Low | — | AUD-API-PROJECTS PR1/PR2, AUD-API-TASKS TK4 |
| TASK-STAB-05 | 2 | Chat correctness | Medium | — | AUD-API-CHAT CH1/CH2/CH3/CH5 |
| TASK-STAB-06 | 2 | User-creation credentials | High | — | AUD-WORKFLOW-LIFE WL1 |
| TASK-STAB-07 | 2 | Auth token/session minutiae | Low | — | AUD-API-AUTH A5/A6, AUD-WEB-CORE WC3 |
| TASK-STAB-08 | 2 | Scheduler timezone + noise | Medium | — | AUD-API-BG B1/B2/B3 |
| TASK-STAB-09 | 2 | Deploy config hygiene | Medium | — | AUD-API-DEPLOY DE1/DE3 |
| TASK-STAB-10 | 2 | Upload lifecycle | Medium | — | AUD-API-PROFILE P2/P3 |
| TASK-STAB-11 | 2 | Attendance service hardening | Low | SYNC-05 | AUD-API-ATT T2/T4/T5/T7 |
| TASK-STAB-12 | 2 | Admin ops polish | Low | — | AUD-API-ATT T6, AUD-API-USERS U4/U5/U6, AUD-API-SETTINGS S2/S3, AUD-API-BG B4 |
| TASK-STAB-13 | 2 | Route/middleware dead code + CSP | Low | — | AUD-API-ROUTES R1–R5, AUD-API-MW M2/M3/M4, AUD-API-COMMS CM2/CM4, AUD-API-SETTINGS S4 |
| TASK-STAB-14 | 2 | Repo debris cleanup | Medium | — | AUD-ROOT RT1–RT7, AUD-WEB-PROJ WP2, AUD-WEB-TESTS WT4 |
| TASK-SYNC-01 | 2 | Notification double-broadcast | High | — | AUD-SYNC-REALTIME SY1 |
| TASK-SYNC-02 | 2 | Settings cache busting | High | — | AUD-API-AUTH A1, AUD-API-COMMS CM1, AUD-API-CAPS C1 |
| TASK-SYNC-03 | 2 | Invalidation-map adoption | High | DS-06 | AUD-SYNC-REALTIME SY2 |
| TASK-SYNC-04 | 2 | active_role split-brain | Medium | — | AUD-API-AUTH A2 |
| TASK-SYNC-05 | 2 | Attendance status vocabulary | High | — | AUD-API-REPORTS RE1, AUD-API-DASH D3, AUD-API-DB DB1/DB2 |
| TASK-SYNC-06 | 2 | reconcileDay failure visibility | Medium | — | AUD-API-ATT T3 |
| TASK-SYNC-07 | 2 | Task redo/approve correctness | Medium | — | AUD-API-LEAVE L7, AUD-API-TASKS TK5, AUD-API-TASKS TK3 |
| TASK-SYNC-08 | 2 | Timer cross-tab sync | Low | — | AUD-SYNC-REALTIME SY3 |
| TASK-SYNC-09 | 2 | Password expiry clock | Medium | SYNC-05 (no real dep; same files as AUTH) | AUD-API-AUTH A3 |
| TASK-SYNC-10 | 2 | Offline replay freshness | Low | — | AUD-WEB-OFFLINE WO1/WO2 |
| TASK-FEAT-01 | 3 | Leave cancel/withdraw | High | RBAC-02 | AUD-API-LEAVE L8, AUD-MISSING-FEATURES MF2 |
| TASK-FEAT-02 | 3 | Leave balance display | High | SYNC-03, FEAT-01 | AUD-MISSING-FEATURES MF1 |
| TASK-FEAT-03 | 3 | Notification settings completion | Medium | SYNC-02 | AUD-MISSING-FEATURES MF3 |
| TASK-FEAT-04 | 3 | Department active/inactive toggle | Medium | RBAC-07 | AUD-API-ORG O4, AUD-MISSING-FEATURES MF4 |
| TASK-FEAT-05 | 3 | Admin navigation surfaces | High | DS-06 | AUD-WEB-SHELL WS1/WS4 |
| TASK-FEAT-06 | 3 | Timezone completeness | Medium | STAB-08 | AUD-WEB-SETTINGS WSe1 |
| TASK-FEAT-07 | 3 | Tasks/Projects export buttons | Low | — | AUD-MISSING-FEATURES MF5 |
| TASK-FEAT-08 | 3 | Task bulk actions | Medium | DS-06, RBAC-01 | AUD-MISSING-FEATURES MF6 |
| TASK-FEAT-09 | 3 | /attendance/sync decision | Medium | STAB-11 | AUD-API-ATT T1, AUD-API-ROUTES open Q |
| TASK-FEAT-10 | 3 | Working-day leave balance | Medium | RBAC-02 | AUD-API-LEAVE L5/L10 |
| TASK-FEAT-11 | 3 | Reports page cleanup | Low | RBAC-06 | AUD-WEB-REPORTS WR2/WR3 |
| TASK-FEAT-12 | 3 | Task/Project delete semantics | Low | — | AUD-API-DB DB3 (open Q) |
| TASK-UX-01 | 4 | Calendar migration ×3 | High | DS-02, SYNC-05 | AUD-UI-DUPLICATE UD1 |
| TASK-UX-02 | 4 | Confirm-dialog migration ×5 | Medium | DS-03 | AUD-UI-DUPLICATE UD2 |
| TASK-UX-03 | 4 | Semantic color adoption sweep | High | DS-04 | AUD-UX-CONSISTENCY UX1/UX3, UD3 |
| TASK-UX-04 | 4 | Empty-state sweep | Medium | DS-05 | AUD-UI-PKG, AUD-UX-CONSISTENCY |
| TASK-UX-05 | 4 | List-page scaffold adoption | High | DS-06, FEAT-* | AUD-UX-CONSISTENCY, AUD-WEB-DASH WD1 |
| TASK-UX-06 | 4 | Page-by-page responsive pass | High | DS-07, UX-01..05 | AUD-UX-CONSISTENCY UX2 |
| TASK-UX-07 | 4 | Page-container width consistency | Low | DS-01 | AUD-UX-CONSISTENCY UX5 |
| TASK-UX-08 | 4 | Attendance graph consolidation | Low | DS-04 | AUD-UI-DUPLICATE UD4 |
| TASK-UX-09 | 4 | Big-component decomposition | Medium | UX-05 | AUD-WEB-PROJ WP3, AUD-WEB-TASKS WT2 |
| TASK-UX-10 | 4 | Shell polish | Low | FEAT-05 | AUD-WEB-SHELL WS2/WS3 |
| TASK-QA-01 | 5 | Backend+web test expansion | High | RBAC-01/02, STAB-01 | AUD-API-TESTS TE1/TE2, AUD-WEB-TESTS WT3 |
| TASK-QA-02 | 5 | CI hardening | Medium | QA-01 | AUD-INFRA-CI CI1/CI2 |
| TASK-QA-03 | 5 | Per-role workflow walkthroughs | Critical | Groups 2–4 | AUD-WORKFLOW-LIFE, all |
| TASK-QA-04 | 5 | Responsive+visual verification matrix | High | UX-06 | AUD-UX-CONSISTENCY |
| TASK-QA-05 | 5 | Sync/regression soak | High | SYNC-01..10 | AUD-SYNC-REALTIME, AUD-WEB-CHAT WC5 |
| TASK-QA-06 | 5 | Ops/performance verification | Medium | STAB-03/08/09 | AUD-API-BG, AUD-API-REPORTS |
| TASK-QA-07 | 5 | Release hygiene | Medium | all | AUD-ROOT RT2, AUD-API-DEPLOY |

---

## Group 1: Design System Foundation

Shared context: `packages/ui/src/theme` exists but semantic tokens (status/priority/tag colors) are scattered as per-component Tailwind literals (audit UX1/UX3/UD3). Everything in Groups 3–4 references "DS tokens", `SemanticCalendar`, `ConfirmDialog`, `StatusColor`, `EmptyState`, `ListScaffold` defined here. Do not start Group 4 before this group merges.

### TASK-DS-01: Author the canonical design-token set
- Source: Audit-Report.md § AUD-UX-CONSISTENCY (UX1 positive baseline, UX3 ad-hoc attendance colors), § AUD-UI-DUPLICATE (UD1/UD3 color duplication), § AUD-WEB-SHELL (accentClasses block layout.tsx:62-75)
- Files: packages/ui/src/theme (extend), new packages/ui/src/theme/semantic.ts; audit accentClasses at apps/web/src/app/dashboard/layout.tsx:62-88 for migration
- Context: Color/spacing/type are defined inline per component; nav accents, priority bars, status badges, and attendance calendars each hardcode their own palette. A single token layer is prerequisite to every consistency task.
- Implementation direction: Define (a) spacing scale (verify against existing Tailwind v4 `--radius`/spacing usage), (b) type scale (display/h1/h2/body/small/caption — match current `text-[10px]`–`text-lg` usage), (c) semantic color maps: `status.task.{todo,in_progress,review,done}`, `status.attendance.{present,absent,late,on_leave,holiday,open,error}`, `status.project.{active,review,completed,archived}`, `priority.{low,medium,high,urgent}`, `tag.*` — each mapping to concrete Tailwind classes (harvest current best values: task-kanban-board.tsx:45-48, task-card.tsx:68-70). Replace layout.tsx accentClasses with tokens.
- Depends on: —
- Priority: Critical
- Acceptance: `semantic.ts` exported from `@g4k/ui`; one grep shows zero remaining hardcoded priority/status color switches outside it; Storybook-style demo page (or test snapshot) renders every token.

### TASK-DS-02: Make packages/ui Calendar the single month-grid component
- Source: § AUD-UI-DUPLICATE UD1
- Files: packages/ui/src/components/calendar.tsx (extend), to deprecate: apps/web/src/components/leave/holiday-calendar.tsx, components/attendance/admin-attendance-calendar.tsx, components/attendance/attendance-history-calendar.tsx (all contain hand-rolled `grid-cols-7`)
- Context: Three bespoke month grids plus an unused primitive — four calendar implementations; behavior and styling drift with every fix (holiday coloring, out-of-month opacity, current-day ring).
- Implementation direction: Extend ui/calendar.tsx into `SemanticCalendar` (slot props for per-day status dot/background via DS-04 attendance/task maps, event markers, selection). Keep each page's data fetching; move rendering to the shared component. Mark the three old files for deletion in UX-01.
- Depends on: DS-01
- Priority: High
- Acceptance: `SemanticCalendar` renders holiday/attendance variants; three legacy files unused; visual: identical day-cell sizing/radius, same current-day treatment across holiday, admin-attendance, and history views.

### TASK-DS-03: Declare ConfirmDialog the only confirmation pattern
- Source: § AUD-UI-DUPLICATE UD2
- Files: canonical: packages/ui/src/components/confirm-dialog.tsx; migrate (raw AlertDialog): components/directory/departments-tab.tsx, components/leave/holiday-calendar.tsx, components/directory/directory-list.tsx, components/leave/leave-approval-actions-cell.tsx, components/projects/tasks-tab.tsx (+ qa-form-builder.tsx, settings/security-requests-config.tsx if AlertDialog usage there is confirmatory)
- Context: Two confirmation idioms coexist; button order/labels/destructive styling differ between them.
- Implementation direction: ConfirmDialog takes title/description/confirmLabel/destructive flag; map each AlertDialog usage onto it. Raw AlertDialog stays exported only for non-confirm use (e.g. informational).
- Depends on: DS-01
- Priority: Medium
- Acceptance: grep for `<AlertDialog` in apps/web returns only non-confirmatory instances; all confirmations share button order (Cancel left), destructive=red styling, and Escape/overlay cancel.

### TASK-DS-04: Ship shared StatusBadge/priority/tag color module
- Source: § AUD-UX-CONSISTENCY UX3, § AUD-UI-DUPLICATE UD3 (getPriorityStatus duplicated task-card.tsx:25-32 / project-card.tsx:22-28), § AUD-API-DB DB2 (status vocabulary drift, backend side handled in SYNC-05)
- Files: new packages/ui/src/components/status-badge variants or lib map; delete both getPriorityStatus copies; align components/attendance/attendance-history-calendar.tsx:111 status map
- Context: Priority/status color mapping is correct in places but hand-copied; attendance statuses are colored ad-hoc per component with drift risk.
- Implementation direction: One function `statusColor(kind, value)` from DS-01 tokens; StatusBadge consumes it; export small `PriorityBar`, `StatusDot` primitives. All call sites (task-card, project-card, kanban, leave tables, attendance tables/graphs, reports, user status chips) import from here.
- Depends on: DS-01
- Priority: High
- Acceptance: No component-local status/priority → color mapping functions remain; the same status renders the same hue on every surface (spot-check: `review` amber in kanban, task sheet, project card, reports).

### TASK-DS-05: Adopt EmptyState everywhere; prune dead ui exports
- Source: § AUD-UI-PKG UP1, § AUD-UX-CONSISTENCY (8+ hand-rolled "No X" blocks)
- Files: packages/ui/src/components/empty-state.tsx (canonical); consumers to migrate: command-palette, hr-attendance-graph, attendance-history-calendar, conversation-list, create-group-dialog, leave-history-table, report-builder, admin-leave-holidays-view (+ sweep for others); delete packages/ui/src/components/{inline-edit,filter-bar,draft-banner}.tsx unless FEAT tasks claim them
- Context: Empty states are one-off paragraphs with inconsistent icon/copy/action patterns while the shared primitive ships unused; four ui exports have zero consumers.
- Implementation direction: EmptyState(icon, title, description, action?) with DS-01 spacing/type tokens; standardize copy voice ("No leave requests yet" style). Delete dead exports or mark `combobox` (1 consumer) for keep.
- Depends on: DS-01
- Priority: Medium
- Acceptance: Every list/table null-state renders via EmptyState with an action CTA where a creation flow exists; `pnpm --filter ui build` succeeds after deletions; grep shows 0 imports of deleted modules.

### TASK-DS-06: Create the ListScaffold (filter/sort/bulk-action bar)
- Source: § AUD-MISSING-FEATURES MF6 (inconsistent bulk actions), § AUD-UX-CONSISTENCY, § AUD-WEB-REPORTS WR3 (no pagination controls)
- Files: new packages/ui/src/components/list-scaffold.tsx composing data-table.tsx + filter-bar (revive) + pagination.tsx; reference implementations: components/directory/directory-list.tsx (search+filters+bulk), components/attendance/admin-attendance-table.tsx
- Context: List pages each hand-assemble search/filter/sort/bulk/pagination with different layouts and capabilities; some lists lack bulk or pagination entirely.
- Implementation direction: ListScaffold props: columns, fetcher (cursor or page), filters config, sort config, bulk actions config (gated by capability callback), empty state, export action slot. Mobile: toolbar collapses to icon menu; table → stacked cards below 640 (DS-07).
- Depends on: DS-01
- Priority: High
- Acceptance: Scaffold used in ≥2 pilot lists (departments, audit log) before Group 4 sweep; keyboard-accessible filter controls; loading skeleton + error retry built in.

### TASK-DS-07: codify responsive layout standards
- Source: § AUD-UX-CONSISTENCY UX2 (chat master-detail as the good example, chat-tab.tsx:510-650)
- Files: docs section in packages/ui (CONTRIBUTING or theme readme) + new hook packages/ui/src/hooks/use-breakpoint.ts (extend use-mobile.tsx)
- Context: Responsive handling exists ad-hoc (hidden md:flex patterns); no standard for master-detail, table collapse, or toolbar behavior per breakpoint.
- Implementation direction: Standards: master-detail (list pane full-width <768, swap on select, persistent ≥768 — copy chat pattern); tables → DataTable horizontal scroll ≥768, card collapse <768; grids 1col <640 / 2col <1024 / 3col+ ≥1024; mobile bottom-nav exists (layout.tsx:446-509) — pages must keep content above it (pb-safe).
- Depends on: DS-01
- Priority: High
- Acceptance: Documented standard + hook merged; chat/holiday/admin-attendance screens cited as reference implementations; UX-06 executes against it.

---

## Group 2: Core Fixes

Shared context: backend paths are `apps/api/app/...`; route file `apps/api/routes/api.php`. Laravel conventions: FormRequests, policies/services over inline checks. Each RBAC task adds a feature test (see QA-01 for the consolidated suite).

### TASK-RBAC-01: Gate task approve/redo to reviewers
- Source: § AUD-API-TASKS TK1 (Critical), § AUD-API-TESTS TE1; route group api.php:209-220 vs TaskController.php:463-555
- Files: apps/api/routes/api.php:209-220, apps/api/app/Http/Controllers/TaskController.php:463-555
- Context: Any employee (tasks.view) can approve/redo any pending task — the audit's only Critical.
- Implementation direction: Move `POST /tasks/{id}/approve`, `/redo` (and consider `/comments`, `/reorder`) out of the `tasks.view|tasks.manage|tasks.create-own` group into `capability:tasks.manage`; belt-and-suspenders `userHasManage()` check inside both methods (pattern already exists in store/update). Add tests: employee 403 on approve/redo; hr 200.
- Depends on: —
- Priority: Critical
- Acceptance: Feature test proves employee/assignee cannot approve or redo; only tasks.manage passes; no other route behavior changed.

### TASK-RBAC-02: Enforce HrScope uniformly via one helper
- Source: § AUD-API-USERS U3, § AUD-API-DASH D4/D5, § AUD-API-REPORTS RE2, § AUD-API-LEAVE L2/L4, § AUD-API-ORG O2
- Files: apps/api/app/Support/HrScope.php (extend: `scopeToManaged(Builder $q, User $u, callable $deptColumn)`), UserController.php:215-228+326-348, DashboardController.php:268-271+284+317-318, ReportController.php:184-188+218-222, LeaveRequestController.php:31-37, LeaveRequestController.php:324-345 + GenerateReportJob.php:247-274 (leave/attendance export scope)
- Context: "What can HR see" has three different answers today: unscoped (user show/activity, report summaries), own-department-only (exports), managed-departments (leave). Scope-less HR currently sees the entire company in dashboard metrics.
- Implementation direction: Single HrScope helper applied at every HR boundary (default: managed departments; empty scope ⇒ empty result — fix the inverted guard at DashboardController.php:268-271). Decide + document the two intentional exceptions (project reviews global for HR — D5). Export jobs receive managed dept ids in filters instead of `_department_id`.
- Depends on: —
- Priority: Critical
- Acceptance: Matrix test: HR-A (dept 1,2) vs HR-B (no depts) vs super_admin across user-show, activity, summaries, exports, dashboard metrics; scope-less HR sees 0, not all.

### TASK-RBAC-03: Make user update safe (field nulling + target-role check)
- Source: § AUD-API-USERS U1/U2
- Files: apps/api/app/Http/Controllers/UserController.php:164-213, apps/api/app/Http/Requests/UpdateUserRequest.php
- Context: Omitting department/team/designation/work_schedule nulls them (silent data loss); a `users.employee.manage` holder can edit an HR/super_admin's fields because the target-role check only runs when `roles` is in the payload.
- Implementation direction: Use `array_key_exists` semantics (only update keys present); apply the same isHRTarget capability check as updateStatus (:239-246) to every update regardless of payload.
- Depends on: —
- Priority: High
- Acceptance: Test: partial update (name only) preserves department_id; employee-manager cannot update an HR user's fields (403) even without roles in payload.

### TASK-RBAC-04: Remove designation_id from self-service profile update
- Source: § AUD-API-PROFILE P1 (High), § AUD-RBAC-WEB RW2
- Files: apps/api/app/Http/Controllers/ProfileController.php:28-36, apps/web/src/app/dashboard/profile/components/profile-general-tab.tsx:32/41/68/73
- Context: API lets any profile.edit user set their own designation; the UI gates it (users.hr.manage||designations.manage) — enforcement must live server-side.
- Implementation direction: Drop designation_id from ProfileController validation; if HR self-service designation change is desired, route it through a dedicated settings-gated endpoint (or UserController@update). Frontend keeps its gate pointed at the new path.
- Depends on: —
- Priority: High
- Acceptance: Test: employee PUT /profile with designation_id ⇒ 422 or ignored; HR path (if built) works through the gated route only.

### TASK-RBAC-05: Fix gated-fetch pattern + middleware map
- Source: § AUD-WEB-PROJ WP1 (High), § AUD-RBAC-WEB RW1/RW4, § AUD-WEB-DIR DI1
- Files: apps/web/src/app/dashboard/projects/[id]/page.tsx:98-100, apps/web/src/middleware.ts:4-13, reference correct pattern components/tasks/tasks-tab.tsx:110 + task-detail-sheet.tsx:111
- Context: Project detail fetches capability-gated `/users` unconditionally — every employee viewer absorbs a 403 and blank member names. Middleware PROTECTED map points at redirect stubs, not the real pages.
- Implementation direction: Replace name-resolution fetches with `/directory?per_page=100` (or `/chat/users`); keep gated `/users` only behind `enabled: hasCapability(...)`. Middleware: repoint entries to real hosts (`/dashboard/directory` management tab check stays UX-only; add `/dashboard/admin/attendance|reports` or delete stale org/* redirect entries — coordinate with FEAT-05).
- Depends on: DS-06 (UI half uses scaffold patterns; backend-free half can land first)
- Priority: High
- Acceptance: As employee: project detail shows all member names, zero 403s in network log; middleware map has no entry whose target is a redirect stub.

### TASK-RBAC-06: Correct saved-views capability
- Source: § AUD-WEB-REPORTS WR1; api.php:236-240 vs SavedViewController.php:14-16 (per-user rows)
- Files: apps/api/routes/api.php:236-240, apps/web/src/components/reports/saved-report-views.tsx:33-37
- Context: Personal per-user saved views are gated settings.manage — HR gets silent 403s surfaced as an empty list.
- Implementation direction: Regate to `reports.view` (they are personal filters, not admin config) or `auth` group if used beyond reports; add error surfacing (toast on 403) in the component as defense.
- Depends on: —
- Priority: Medium
- Acceptance: HR can create/list/delete a saved view; employee without reports.view still 403s.

### TASK-RBAC-07: Validate department_hr targets
- Source: § AUD-API-ORG O3
- Files: apps/api/app/Http/Controllers/DepartmentController.php:163-187 (syncHrs/addHr)
- Context: Any existing user id can be attached to department_hr, pre-seeding HR scope for non-HR users.
- Implementation direction: Validate each user_id has an hr role assignment (RoleAssignment lookup) before sync/attach; reject with 422 listing invalid ids.
- Depends on: —
- Priority: Medium
- Acceptance: Test: adding an employee-only user to department_hr fails; adding an HR user succeeds.

### TASK-RBAC-08: Verify time-log ownership
- Source: § AUD-API-TIMER TM1
- Files: apps/api/app/Http/Controllers/TimerController.php:13-34
- Context: Any timer.track user can log minutes against arbitrary tasks/projects, polluting productivity reports.
- Implementation direction: Reuse TaskController's `isTaskParticipant` (TaskController.php:61-70) — extract to a shared service (TaskService) — require participant or tasks.manage; project member check for project-only logs.
- Depends on: —
- Priority: Medium
- Acceptance: Test: non-participant log against someone else's task ⇒ 403; assignee logs fine.

### TASK-RBAC-09: Enforce the QA review gate on task completion
- Source: § AUD-API-TASKS TK2
- Files: apps/api/app/Http/Controllers/TaskController.php:59, 259-261, 288-306
- Context: Assignees can PUT status=done directly, bypassing submit-for-review even when the task carries a qa_form_id — QA workflow is voluntary.
- Implementation direction: In update(), if task has qa_form_id and actor lacks tasks.manage, strip 'status'→'done' from ASSIGNEE_EDITABLE_FIELDS behavior (force submitForReview path: status review only). Keep direct-done for QA-less tasks.
- Depends on: STAB-01 (field vocabulary stable first)
- Priority: Medium
- Acceptance: Test: assignee on QA task cannot set done (422 with guidance); non-QA task still allows done; manager can set done.

### TASK-RBAC-10: Auth error hygiene (enumeration + capability leak)
- Source: § AUD-API-AUTH A4, § AUD-API-MW M1
- Files: apps/api/app/Http/Controllers/AuthController.php:71-127, apps/api/app/Http/Middleware/RequireCapability.php:49
- Context: Distinct inactive/locked/invalid messages let attackers enumerate accounts; 403 bodies echo internal capability names.
- Implementation direction: Normalize login failures to one generic message (keep lockout timing info — that's UX-necessary); RequireCapability returns generic "You don't have permission to do that" (log the detailed capability server-side).
- Depends on: —
- Priority: Medium
- Acceptance: Curl matrix: inactive vs wrong-password produce indistinguishable bodies; 403 contains no capability string.

### TASK-RBAC-11: Consolidate token storage
- Source: § AUD-WEB-CORE WC1
- Files: apps/web/src/lib/auth-store.ts:46-92 (persist), api-client.ts:190-192, middleware.ts:23
- Context: Access token lives in localStorage + non-HttpOnly cookie + memory; only the cookie is needed for middleware SSR gating — the localStorage copy is pure XSS surface.
- Implementation direction: Keep cookie (g4k_token) + memory as sources of truth; drop token (and capabilities duplication if middleware can read caps from a lightweight endpoint/session cookie) from the persisted zustand slice; `getAuthToken()` reads memory→cookie. BroadcastChannel flow unchanged.
- Depends on: —
- Priority: Medium
- Acceptance: After login+reload, `localStorage['g4k-auth']` contains no `token` field; authed navigation still works (middleware reads cookie); refresh flow unaffected.

### TASK-STAB-01: Unify the QA field-type system end-to-end
- Source: § AUD-API-QA QA1/QA2/QA4 (High), § AUD-WEB-TASKS WT1, § AUD-API-TASKS TK6
- Files: apps/api/database/migrations/2026_08_18_213052_update_qa_forms_for_redesign.php:42 (enum), apps/api/app/Http/Controllers/QaController.php:18-29/59-74 (validation), apps/web/src/components/tasks/qa-form-builder.tsx:122/157/211/260/298 (types + config/validation props), components/projects/qa-field-renderer.tsx:34 (legacy fallback), qa-form-viewer.tsx, qa-form-preview.tsx
- Context: pg enum admits 5 types; builder emits 13; scale/min-max/file-type config is silently dropped — QA form save 500s or loses data on Postgres.
- Implementation direction: Pick the canonical vocabulary (recommend the builder's 13; migrate enum to a `string` + CHECK or a php-side whitelist in QaController validation). Add JSON `config` + `validation` columns to qa_form_fields; persist/recur them in store/update; submitForReview validates values by field type (number ranges, select options); renderer drops `field.type` fallback after data migration.
- Depends on: —
- Priority: Critical
- Acceptance: On pgsql: builder creates a form using rating/dropdown/section/file_upload with scale config ⇒ 200, round-trips config; sqlite+pgsql tests for create/update/submit-validation; no legacy `field.type` reads.

### TASK-STAB-02: Guard QA form deletion against references
- Source: § AUD-API-QA QA3
- Files: apps/api/app/Http/Controllers/QaController.php:100-107; FKs: tasks.qa_form_id, projects.qa_form_id (migrations 2026_08_14_223037, 2026_08_15_033732/125337)
- Context: destroy() deletes fields+form regardless of referencing tasks/projects ⇒ dangling qa_form_id.
- Implementation direction: Before delete, count referencing tasks/projects; 422 with counts (or nullOnDelete FK migration + confirm dialog copy listing affected items).
- Depends on: STAB-01
- Priority: Medium
- Acceptance: Test: form used by a task cannot be deleted (or references nulled and task shows "form removed" state, chosen behavior documented).

### TASK-STAB-03: Move export artifacts out of the DB + retention
- Source: § AUD-API-REPORTS RE3 (+ RE5 filter validation)
- Files: apps/api/app/Jobs/GenerateReportJob.php:35-82 (file_data base64; dead $disk at :43), app/Models/ExportJob.php, ReportController.php:133-156 (download)
- Context: Export bytes live base64 in export_jobs rows; no retention policy — table bloat and slow backups.
- Implementation direction: Write file to S3 disk (already configured) under exports/, store path, stream presigned/response proxy in downloadExport; nightly scheduled cleanup deletes completed export rows + objects older than N days (setting-configurable, default 14). Validate `filters` keys against a per-key whitelist (RE5).
- Depends on: —
- Priority: Medium
- Acceptance: New exports have file_data=null + file_path set; download works; cleanup command removes >N-day rows/objects; ExportJob size stays bounded in a soak test.

### TASK-STAB-04: Pagination hardening
- Source: § AUD-API-PROJECTS PR1/PR2, § AUD-API-TASKS TK4
- Files: apps/api/app/Http/Controllers/ProjectController.php:50-51+126-143, TaskController.php:557-598
- Context: projects index per_page unvalidated (100000 possible); project history and task submitted() unbounded gets.
- Implementation direction: per_page `in:15,20,50,100` like siblings; paginate history (cursor) and submitted (page, 20).
- Depends on: —
- Priority: Low
- Acceptance: per_page=100000 ⇒ 422 or clamped; history/submitted responses include pagination metadata; web callers updated.

### TASK-STAB-05: Chat correctness pack
- Source: § AUD-API-CHAT CH1/CH2/CH3/CH5
- Files: apps/api/app/Http/Controllers/ChatController.php:27-46 (search), 91-104 (send validation), 191-229 (DM), 332-351 (clearChat)
- Context: User search misses email/username/employee_id (the old "DM search dead" symptom); empty messages possible; "clear chat" deletes only own messages but UI implies more; DMs can target inactive users.
- Implementation direction: Widen searchUsers to the directory field set (name/email/username/employee_id + dept); require body-or-attachment on send; rename endpoint semantics: keep behavior, change UI copy to "Delete my messages" (or implement per-user hidden pivot if product wants true clear — flag as decision); block DM creation to non-active users (422 with reason).
- Depends on: —
- Priority: Medium
- Acceptance: Search by email finds user; empty-body+no-attachment ⇒ 422; DM to inactive user fails; UI label matches actual behavior.

### TASK-STAB-06: Send credentials on user creation
- Source: § AUD-WORKFLOW-LIFE WL1 (High); UserController.php:128-162, app/Mail/ (no welcome mail)
- Context: Created users get an unknowable random password and no email — cannot log in until an admin separately resets; without SMTP, creation is a dead end.
- Implementation direction: In store(), reuse the resetPassword temp-password email path (new WelcomeMail mailable, queued) when SMTP configured; response includes `credentials_sent: bool`; when SMTP is NOT configured, return the temp password once in the API response (settings.manage-only audience) + UI toast instructing manual relay. user-form.tsx copy updated accordingly.
- Depends on: —
- Priority: High
- Acceptance: With SMTP: new user can log in with emailed temp password and is forced to change it; without SMTP: admin sees temp password in the create dialog; no path leaves the user stranded.

### TASK-STAB-07: Auth/session minutiae
- Source: § AUD-API-AUTH A5/A6, § AUD-WEB-CORE WC3
- Files: apps/api/app/Http/Controllers/AuthController.php:524-538, apps/web/src/lib/api-client.ts:20-28
- Context: changePassword re-issued tokens lack ip/user_agent (blank rows in sessions list); GET-refresh CSRF comment overstates safety; unwrapOne heuristic edge.
- Implementation direction: forceFill ip/ua on the new pair (copy login pattern :220-231); reword the CSRF comment to acknowledge top-level-navigation rotation, consider POST if cheap; unwrapOne: also accept `{data:{id}}` absence by returning res unchanged only when not a Laravel paginator shape.
- Depends on: —
- Priority: Low
- Acceptance: Sessions list shows device info for the post-change session; no behavior regressions in refresh tests.

### TASK-STAB-08: Scheduler timezone + noise
- Source: § AUD-API-BG B1/B2/B3
- Files: apps/api/routes/console.php (all `timezone('Asia/Kolkata')`), start.sh:17 (comment drift), heartbeat console.php:31-34
- Context: Scheduled jobs hardcode IST while company timezone is configurable — attendance math and job timing disagree for non-IST tenants; heartbeat spams ~43k log lines/day.
- Implementation direction: Resolve timezone from CompanyProfile at schedule registration (cache; fall back to app.timezone) and document the limitation if Laravel requires static — otherwise add a settings value `scheduler.timezone`; heartbeat → weekly `Log::info` or drop; fix start.sh comment (no g4k-scheduler service exists).
- Depends on: —
- Priority: Medium
- Acceptance: Changing company timezone shifts job windows (or documented reason why not); heartbeat ≤1 line/day; start.sh matches deployed topology.

### TASK-STAB-09: Deploy config hygiene
- Source: § AUD-API-DEPLOY DE1/DE3
- Files: cloudbuild.yaml:26/64/86 (hardcoded project refs), substitutions block
- Context: Supabase refs/DB username hardcoded; only :latest tag deployable — no rollback target.
- Implementation direction: Move refs to `_SUPABASE_PROJECT`/_DB_USERNAME substitutions + Cloud Build trigger config; tag images `${SHORT_SHA}` + `latest`, deploy the SHA tag, keep latest as alias.
- Depends on: —
- Priority: Medium
- Acceptance: cloudbuild.yaml has no embedded project id; a deploy creates a SHA-named revision in Cloud Run; rollback to previous revision exercised once in staging.

### TASK-STAB-10: Upload lifecycle (orphans + free-text URLs)
- Source: § AUD-API-PROFILE P2/P3
- Files: apps/api/app/Http/Controllers/ProfileController.php:48-79, CompanyProfileController.php:45-80
- Context: Replaced avatar/logo files accumulate in S3 forever; avatar_url accepts arbitrary external strings.
- Implementation direction: On new upload, delete previous object when under our bucket prefix (avatars/, company-logos/, projects/covers/); validate avatar_url input to same-origin/storage-host URLs or reject (force upload path).
- Depends on: —
- Priority: Medium
- Acceptance: Re-uploading avatar deletes the old object (assert viaStorage::assertMissing in test); external URL in profile update rejected.

### TASK-STAB-11: Attendance service hardening
- Source: § AUD-API-ATT T2/T4/T5/T7
- Files: apps/api/app/Services/AttendanceService.php:51 (idempotency scope), :217 (holidays full scan), :20-64 (race), :191-200 (manual-source recompute)
- Context: client_id idempotency is global not per-user (no unique index verified); holidays table fully loaded per punch; state-machine check races; manual-corrected days never recompute late/overtime.
- Implementation direction: Add unique index (user_id, client_id) + scoped lookup; cache holidays by year (bust on HolidayController writes — pattern exists at HolidayController.php:97-99); lockForUpdate the day's last event inside the transaction; for manual days, recompute derived-but-not-manually-set fields per a `manual_fields` JSON column (decision: minimal = recompute late/overtime unless the correction set them).
- Depends on: SYNC-05 (status vocabulary stable)
- Priority: Low
- Acceptance: Duplicate client_id from a different user no longer suppresses events; holiday count query filtered by year; concurrent double-punch test yields one event; manual-day behavior documented in test.

### TASK-STAB-12: Admin ops polish
- Source: § AUD-API-ATT T6, § AUD-API-USERS U4/U5/U6, § AUD-API-SETTINGS S2/S3, § AUD-API-BG B4
- Files: AttendanceController.php:1010-1014, UserController.php:393-442 (bulk), :350-391 (reset), SettingsController.php:84-114
- Context: Assorted small correctness/ops issues: role-name manage check, silent bulk skips, misleading reset partial-success, raw failed-job rows, retry-all.
- Implementation direction: userHasManage→CapabilityMatrix; bulk returns per-item {id, status, reason}; resetPassword returns 207 with explicit partial-failure semantics + retry-send action; jobs() masks exception payloads (count + subject only), retryJobs accepts id list.
- Depends on: —
- Priority: Low
- Acceptance: Each behavior covered by one test or verifiable curl; UI consumers updated (directory bulk toast shows skipped counts).

### TASK-STAB-13: Route/middleware dead code + CSP
- Source: § AUD-API-ROUTES R1-R4, § AUD-API-MW M2/M3/M4, § AUD-API-COMMS CM2/CM4, § AUD-API-SETTINGS S4
- Files: api.php:186+232 (dup timer route), :52-65 (/test-pusher), :7 (dead import), :35-42 (/ping), DirectoryController.php:85-110 (dead methods), SecurityHeaders.php:29-40, AnnouncementController.php:98/133/150 (dead forgets), :180 (reaction timestamp), ForceOnboarding.php (path literals)
- Context: Debug endpoint, dead routes/imports/methods, weak CSP header set.
- Implementation direction: Remove dup route, test-pusher (verify Pusher via a settings.manage-gated diagnostics action instead), dead import, DirectoryController::show/sendMessage; /ping drops user count and error detail (status only); CSP: remove `unsafe-inline` script allowance where feasible (API origin — likely fine to keep but tighten `connect-src wss://*` to the Pusher domain); reaction insert adds updated_at; ForceOnboarding gets a constant list documented beside routes.
- Depends on: —
- Priority: Low
- Acceptance: `php artisan route:list` shows no dupes/debug routes; securityheaders.com-style check on /api shows no wildcard wss; grep-clean for deleted symbols.

### TASK-STAB-14: Repo debris cleanup
- Source: § AUD-ROOT RT1-R7, § AUD-WEB-PROJ WP2, § AUD-WEB-TESTS WT4
- Files (delete): root test*.php (12), test.html, find_tr.py, fix_import.py, patch*.py (16), lint.md, lint_output.txt, apps/api/{check_missing.php,debug_announcement.php,test.php}, apps/web/src/components/projects/tasks-tab.tsx.bak, apps/web/src/lib/tabs-sync.ts, apps/web/{lint_output.txt,web_lint.json,tsconfig.tsbuildinfo}; dedupe README.md (= Games4Kings_Workplace_OS_Documentation.md); gitignore data/, .jetro/, projects/; single openapi.yaml (packages/ui generates from apps/api copy or symlink/script-sync)
- Context: ~40 stray files at root/subprojects; duplicate 84KB README; empty modules; two drifting spec copies.
- Implementation direction: One PR moving anything salvageable to scratch/ (gitignored) then deleting; README becomes a short pointer doc; add `spec:sync` script (copy apps/api/openapi/openapi.yaml → packages/ui/openapi.yaml in ui's api:generate prestep).
- Depends on: —
- Priority: Medium
- Acceptance: `git ls-files | grep -c "test[0-9]*\.php\|patch.*\.py\|\.bak"` = 0; README < 100 lines; only one openapi.yaml source of truth; CI green.

### TASK-SYNC-01: Eliminate notification double-broadcast
- Source: § AUD-SYNC-REALTIME SY1
- Files: apps/api/app/Observers/NotificationObserver.php:12-17, apps/api/app/Services/NotificationService.php:41-44
- Context: Every in-app notification broadcasts twice (observer `event()` + explicit `broadcast()->toOthers()`), duplicating toasts/unread bumps for online clients.
- Implementation direction: Remove the explicit broadcast in send() and keep the observer as the single dispatcher, adding `->toOthers()` semantics via the event's broadcastWith/`dontBroadcastToCurrentUser()` equivalent — or drop the observer and keep explicit only. Pick one path; add a test asserting one broadcast per create.
- Depends on: —
- Priority: High
- Acceptance: Pusher event count for one NotificationService::send == 1 (integration test with Event::fake asserting single NotificationCreated broadcast); UI shows one toast per notification.

### TASK-SYNC-02: Settings cache busting family
- Source: § AUD-API-AUTH A1 (High), § AUD-API-COMMS CM1, § AUD-API-CAPS C1
- Files: apps/api/app/Http/Controllers/SettingsController.php:22-58, AuthController.php:194/297/379/528, NotificationService.php:11-16, CapabilityMatrix.php:38-52
- Context: `settings:security` (session TTLs, expiry, max devices) and `settings:notifications:{type}.channels` are cached 1h with no invalidation — admin changes apply up to an hour late; role_capabilities relies solely on bulkUpdate clear.
- Implementation direction: Central SettingsService::write() that busts affected keys (`settings:security`, `settings:notifications:*`, smtp via existing bust, CapabilityMatrix::clearCache) per changed category; route all writers (bulkUpdate, work schedules, holidays) through it; reduce security TTL to 5 min as defense.
- Depends on: —
- Priority: High
- Acceptance: Test: change session.access_token_ttl ⇒ next login uses new TTL within seconds; change leave_request.channels ⇒ next send honors it; no Cache::remember key older than its written value.

### TASK-SYNC-03: Adopt invalidation-map as the single mutation→refresh layer
- Source: § AUD-SYNC-REALTIME SY2
- Files: apps/web/src/lib/invalidation-map.ts (0 imports; 133 manual `queryClient.invalidateQueries` across app/components)
- Context: The centralization layer exists with tests but is dead; invalidation coverage is ad-hoc → stale lists after mutations (the historical "empty tables" class of bug).
- Implementation direction: Export `invalidate(entity, payload)` hooking the map; sweep components to replace direct invalidateQueries calls with entity names; extend map for entities added by FEAT tasks (leave.cancel, balance, savedViews, notifications config). Delete map entries with no producer.
- Depends on: DS-06 (scaffold emits standard entities)
- Priority: High
- Acceptance: grep shows manual invalidateQueries only inside the map + provider; each FEAT task's acceptance includes its entity invalidation; mutation staleness soak (QA-05) passes.

### TASK-SYNC-04: Fix active_role multi-device split-brain
- Source: § AUD-API-AUTH A2
- Files: apps/api/app/Http/Controllers/AuthController.php:363-406 (roleSelect), :264-361 (refresh), apps/api/app/Models/User.php:106-126
- Context: roleSelect writes the global users.active_role column; refresh (unauthenticated, token-less) resolves from that column — device B silently adopts device A's role on refresh.
- Implementation direction: Bake role into the refresh token abilities too (`['refresh','role:X']`), refresh resolves from the refresh token first, column second; keep column as bootstrap only. Frontend roleSelect already re-issues access token; no UI change.
- Depends on: —
- Priority: Medium
- Acceptance: Test: two sessions, different roles selected, both refresh ⇒ each keeps its own role and capability set.

### TASK-SYNC-05: One attendance status vocabulary
- Source: § AUD-API-REPORTS RE1, § AUD-API-DASH D3, § AUD-API-DB DB1/DB2
- Files: LeaveAttendanceIntegration.php (writes on_leave), AttendanceService.php:228-234 (present/absent/late/holiday), ReportController.php:179 (reads 'leave'), DashboardController.php:226-231/275-281 (reads 'leave'), migration 2026_08_14_210758 (down() narrower than up())
- Context: Four divergent status lists; reports + dashboards count a value nothing writes ⇒ "On Leave" tiles always 0.
- Implementation direction: PHP enum AttendanceStatus as single source (present, absent, late, on_leave, holiday, pending + error state per SYNC-06); migrate readers to enum (summary + metrics use on_leave); fix down() to mirror up(); DS-04 color map consumes the same values.
- Depends on: —
- Priority: High
- Acceptance: Approve a leave ⇒ dashboard on-leave count and attendance-summary leave column both increment (integration test on pgsql); `migrate:rollback` for the check migration restores the full set.

### TASK-SYNC-06: Make reconcileDay failures visible
- Source: § AUD-API-ATT T3
- Files: apps/api/app/Services/AttendanceService.php:261-276
- Context: Catch-all swallows Throwable and returns a fake day array — punches "succeed" while summaries silently never update.
- Implementation direction: Distinguish validation vs infra errors: infra errors rethrow after logging (controller 500 → client retries offline queue) or persist an attendance_days row with status='error' + retry reconcile on next punch; never return pseudo-shape.
- Depends on: —
- Priority: Medium
- Acceptance: Forced failure test (e.g. dropped column) surfaces as 500 or persisted error day; log line includes user/date; next successful punch reconciles the day.

### TASK-SYNC-07: Task redo/approve correctness
- Source: § AUD-API-LEAVE L7, § AUD-API-TASKS TK5/TK3
- Files: apps/api/app/Http/Controllers/TaskController.php:509-555 (redo uses ApprovalService::reject at :525), :463-507 (approve, no assignee notify), :334 (assignees passed to update)
- Context: Task redo records decision='rejected' so the submissions queue loses redo state/feedback; approvals don't notify assignees; update() relies on fillable to ignore an assignees key.
- Implementation direction: redo() → ApprovalService::redo (feedback column already read by submitted()); approve() notifies assignee(s) via NotificationService (task type); unset 'assignees' from $validated before ->update() explicitly.
- Depends on: —
- Priority: Medium
- Acceptance: After redo: submissions list shows redo_required + reason; assignee receives notification; update with assignees array writes no SQL error on strict pg.

### TASK-SYNC-08: Timer cross-tab coherence
- Source: § AUD-SYNC-REALTIME SY3
- Files: apps/web/src/stores/timer-store.ts (persisted, no tab sync)
- Context: Two tabs run independent timer UI off the same persisted state; setActive/clear race last-writer-wins.
- Implementation direction: Reuse the auth-store BroadcastChannel pattern (g4k_timer_sync) to broadcast state changes; on message, adopt remote state if newer (started_at compare); ActiveTaskUpdated Pusher event already covers multi-user.
- Depends on: —
- Priority: Low
- Acceptance: Two tabs: start in A ⇒ B reflects running timer within a second; clearing in B stops A.

### TASK-SYNC-09: Password expiry clock correctness
- Source: § AUD-API-AUTH A3
- Files: apps/api/app/Http/Controllers/AuthController.php:204-216, :307-319; FlagExpiredPasswords command
- Context: Expiry falls back to updated_at — any profile save extends password lifetime silently.
- Implementation direction: Backfill password_changed_at=created_at where null (one migration), drop the updated_at fallback; login/refresh read the column only.
- Depends on: SYNC-05 only by file proximity (independent logically)
- Priority: Medium
- Acceptance: User who never changed password since creation is flagged exactly at expiry_days after created_at; avatar upload no longer postpones expiry.

### TASK-SYNC-10: Offline replay freshness
- Source: § AUD-WEB-OFFLINE WO1/WO2
- Files: apps/web/src/lib/offline-engine.ts:127-164 (stored headers), :190 (type mapping)
- Context: Queued requests replay with stale Authorization; punch type→endpoint mapping is a string replace contract.
- Implementation direction: Strip Authorization (and Cookie-ish) headers when persisting; apiFetch always stamps fresh token. Centralize the punch endpoint map as a typed const shared with timer/attendance widgets.
- Depends on: —
- Priority: Low
- Acceptance: Queued mutation replays successfully after token rotation without a 401 round-trip; renaming a punch type breaks compile, not runtime.

---

## Group 3: Feature Completion

Shared context: each feature lands backend route+controller, service logic, web wiring through DS-06 scaffold + SYNC-03 invalidation, capability checks both tiers (RBAC pattern from Group 2), and its own feature test.

### TASK-FEAT-01: Leave cancel/withdraw (employee) + admin delete
- Source: § AUD-API-LEAVE L8, § AUD-MISSING-FEATURES MF2
- Files: new route POST /leave-requests/{id}/cancel (api.php leave block ~:156-170), LeaveRequestController (new method), components/leave/leave-history-table.tsx (row action), admin-leave-holidays-view.tsx (admin variant)
- Context: Once submitted, a leave request is immutable for the employee — mis-filed dates require HR rejection; balance stays reserved.
- Implementation direction: Employee may cancel own PENDING request (sets status cancelled, Approval closed, no balance effect); admins may cancel/delete any within their HrScope (RBAC-02 helper). ConfirmDialog (DS-03) on both; invalidate via SYNC-03 `leave.cancel`.
- Depends on: RBAC-02
- Priority: High
- Acceptance: Employee cancels pending leave ⇒ disappears from HR queue, balance unchanged (or restored per FEAT-10 rules), history shows Cancelled state chip (DS-04); approved/decided requests show no cancel action; tests for both roles.

### TASK-FEAT-02: Leave balance visibility
- Source: § AUD-MISSING-FEATURES MF1 (invalidation-map.ts:53 comment confirms unbuilt)
- Files: new endpoint GET /leave-balances (or include in /leave-requests index meta) — LeaveBalance model exists; components/leave/leave-request-form.tsx (inline balance chips), leave-history-table.tsx (summary header)
- Context: Backend enforces quotas (LeaveRequestController.php:100-111) but employees request blind.
- Implementation direction: Endpoint returns per-type {allowed, used, remaining} for current year (respect FEAT-10 working-day math); form shows remaining-days chip per type and disables submit when insufficient (server stays authoritative); history tab header shows the same cards; SYNC-03 entity `leave.balance` invalidated on decision/cancel.
- Depends on: SYNC-03, FEAT-01
- Priority: High
- Acceptance: Employee sees live balances; requesting more than remaining is blocked client-side and 422 server-side; balance updates within a refresh after approval/cancel.

### TASK-FEAT-03: Complete notification settings (global + personal)
- Source: § AUD-MISSING-FEATURES MF3; NotificationService.php:11-26 (reads prefs nothing writes)
- Files: components/settings/notifications-config.tsx (add all types), new profile notifications tab (profile-preferences-tab.tsx extend), SettingsService (SYNC-02)
- Context: UI configures 3 of ~8 emitted types (task_assigned, chat, security, warning, system, task… unconfigurable); user-level channel prefs are read but have no writer.
- Implementation direction: Enumerate notification types from one backend registry (const map type→{label, description, channelsAllowed}); global admin config lists all; personal tab lets each user mute/choose channels per type (writes users.preferences.notifications[type] in the shapes NotificationService reads); task/chat mention defaults on.
- Depends on: SYNC-02
- Priority: Medium
- Acceptance: Every type sent by NotificationService is configurable globally; a user muting task_assigned receives no in-app row or push (test); email toggle honored (queued mail check).

### TASK-FEAT-04: Department active/inactive lifecycle
- Source: § AUD-API-ORG O4, § AUD-MISSING-FEATURES MF4
- Files: apps/api/app/Http/Controllers/DepartmentController.php (new PATCH status route + update validation), api.php departments block, components/directory/departments-tab.tsx:370-374 (badge exists)
- Context: UI renders an Inactive state nothing can set — tri-state collapses to two in practice.
- Implementation direction: PATCH /departments/{id}/status {is_active} with in-use semantics documented (inactive hides from directory filters but keeps assignments; archived stays soft-deleted); departments-tab gets a status action menu; directory user-create filters inactive depts.
- Depends on: RBAC-07
- Priority: Medium
- Acceptance: Toggling a department inactive: badge flips, directory dropdown excludes it, assigned users unaffected; audit log entry written.

### TASK-FEAT-05: Make admin surfaces reachable (nav + palette)
- Source: § AUD-WEB-SHELL WS1/WS4
- Files: apps/web/src/app/dashboard/layout.tsx:44-60 (navGroups), components/app-shell/command-palette.tsx (add entries), middleware.ts (align with RBAC-05)
- Context: User management, departments, designations, org leave, audit, admin attendance/reports, announcements, leave are absent from the sidebar and mostly from ⌘K — admin functionality is undiscoverable.
- Implementation direction: navGroups gains role-gated "Administration" section (Employee Management→directory?tab=management [users.*.manage], Departments, Designations [departments/designations.manage], Org Leave [leave.approve-employee], Admin Attendance [admin.view-all-attendance], Admin Reports, Audit→settings?tab=audit, Settings [settings.manage]); "Communications" gains Announcements + Leave for employees; palette mirrors each with capability gating identical to nav; mobile bottom-nav unchanged.
- Depends on: DS-06 (nav item component consistency)
- Priority: High
- Acceptance: As each role: every capability-gated nav item appears only when allowed; every route reachable ≤2 clicks or 1 ⌘K; no duplicate nav entries with redirects.

### TASK-FEAT-06: Complete timezone selection
- Source: § AUD-WEB-SETTINGS WSe1; cross-ref STAB-08
- Files: apps/web/src/components/settings/settings-tabs.tsx:193-200
- Context: 5 hard-coded zones for a configurable-timezone product.
- Implementation direction: Replace Select with Combobox over Intl.supportedValuesOf('timeZone') (or a curated 40-zone list with search); default = browser zone; stores canonical IANA string.
- Depends on: STAB-08
- Priority: Medium
- Acceptance: Searching "Karachi"/"Los Angeles" finds zones; selection persists and reflects in attendance late-math smoke (manual verify per QA-03).

### TASK-FEAT-07: Tasks/Projects export buttons
- Source: § AUD-MISSING-FEATURES MF5
- Files: components/projects/tasks-tab.tsx + projects-tab.tsx toolbar, use-export.ts (existing)
- Context: Leave/attendance have in-context export; tasks/projects require knowing the Reports Hub exists.
- Implementation direction: Toolbar export button → POST /reports/export {key: tasks|projects, filters: current view filters} via existing useExport job flow; permission = reports.view (hide otherwise).
- Depends on: —
- Priority: Low
- Acceptance: Export from tasks tab produces the same file the Reports Hub would for equivalent filters; toast + export history entry appear.

### TASK-FEAT-08: Task bulk actions
- Source: § AUD-MISSING-FEATURES MF6
- Files: components/tasks/tasks-tab.tsx + task-kanban-board.tsx (multi-select), TaskController (optional bulk endpoint or looped updates), ListScaffold bulk config
- Context: Users module has bulk activate/deactivate; tasks have none (multi-status changes = N dialogs).
- Implementation direction: Row checkboxes (managers+reporters for own) → bulk bar: status, priority, assignee, delete; server either loops through validated per-task policy (existing checks) or adds POST /tasks/bulk mirroring UserController::bulk semantics with per-item results (STAB-12 pattern).
- Depends on: DS-06, RBAC-01
- Priority: Medium
- Acceptance: Bulk status change on 3 tasks applies policy per task (skips unauthorized with visible per-item result); selection clears on success; works on kanban via card multi-select affordance or list view only (documented choice).

### TASK-FEAT-09: Resolve /attendance/sync — wire or remove
- Source: § AUD-API-ATT T1, § AUD-API-ROUTES open question
- Files: apps/api/app/Http/Controllers/AttendanceController.php:101-171, routes/api.php, apps/web/src/lib/offline-engine.ts
- Context: Batch-sync endpoint implemented but unrouted; offline engine replays punch-by-punch instead (N round-trips, N reconciles).
- Implementation direction: Decision task: (a) route it under attendance.clock-self + throttle, offline engine batches pending punches into one sync call (server already sorts + reconciles per date) — preferred; or (b) delete the method. Either way the open question closes.
- Depends on: STAB-11
- Priority: Medium
- Acceptance: (a) 5 queued punches → 1 HTTP call, one reconcile per date, dashboard reflects them; or (b) method gone, route:list clean, offline flow unchanged and tested.

### TASK-FEAT-10: Working-day-aware leave balance
- Source: § AUD-API-LEAVE L5/L10
- Files: apps/api/app/Services/ApprovalService.php:98-108 (debit), :152-165 (refund), LeaveBalance, LeaveAttendanceIntegration.php (working-day calc exists — reuse)
- Context: Balance debits calendar days (weekends/holidays burn quota); refunds only on reject-after-approve — cancel-before-decision strands nothing but rejections pre-approval refund nothing either (inconsistent paths).
- Implementation direction: Extract shared `workingDaysBetween(start, end, schedule, holidays)` from the listener; use for debit and refund symmetrically; FEAT-02 displays the same math; document the policy (quota counts working days only).
- Depends on: RBAC-02
- Priority: Medium
- Acceptance: Test matrix: Mon–Fri leave (weekend span) debits 5; leave containing a holiday debits minus holiday; reject-after-approve refunds exactly what was debited; FEAT-02 chips agree with server.

### TASK-FEAT-11: Reports page cleanup
- Source: § AUD-WEB-REPORTS WR2/WR3
- Files: apps/web/src/app/dashboard/reports/page.tsx:14-32 (dead branch), components/reports/report-builder.tsx (preview pagination)
- Context: Unreachable employee branch; preview truncates at 25 rows silently while export exports everything.
- Implementation direction: Delete dead branch (middleware guarantees reports.view); preview gets ListScaffold pagination + row-count caption ("Showing 25 of 812 — export includes all").
- Depends on: RBAC-06
- Priority: Low
- Acceptance: Page renders one structure; paginated preview matches total counts; caption present.

### TASK-FEAT-12: Task/Project deletion semantics
- Source: § AUD-API-DB DB3 (open question)
- Files: apps/api/app/Models/Task.php / Project.php (SoftDeletes audit), TaskController.php:451-461, ProjectController.php:176-181
- Context: Audit couldn't confirm soft-delete usage/restore paths for tasks/projects (users have restore; tasks/projects unknown) — either dead SoftDeletes or unrestorable deletes.
- Implementation direction: Verify models; if soft-deleted without restore: add restore routes (tasks.manage/projects.manage) + trash filter in lists (ListScaffold) + audit entries; if hard-deleted: keep, but add confirm-dialog copy noting permanence and cascade behavior for task comments/activity/time logs.
- Depends on: —
- Priority: Low
- Acceptance: Deletion behavior documented + tested; restore exists or permanence copy shipped; no dangling FK 500s on delete of task with comments/time logs.

---

## Group 4: UI/UX Consistency Pass

Shared context: every task consumes Group-1 outputs by name (SemanticCalendar, ConfirmDialog, statusColor tokens, EmptyState, ListScaffold, responsive standards). Each ends with a per-file checklist at 375 / 768 / 1280 widths. Do not restyle ad-hoc — divergences found become new DS tokens, not one-offs.

### TASK-UX-01: Migrate the three calendars
- Source: § AUD-UI-DUPLICATE UD1
- Files: components/leave/holiday-calendar.tsx, components/attendance/admin-attendance-calendar.tsx, components/attendance/attendance-history-calendar.tsx → SemanticCalendar (DS-02); delete legacy grids
- Context: Three hand-rolled month grids with drifting day-cell styles, status colors, and mobile behavior.
- Implementation direction: Each keeps its data hooks + CRUD dialogs (holiday) but renders SemanticCalendar with statusColor-mapped day slots. Keep existing tests green (attendance-history-calendar.test.tsx).
- Depends on: DS-02, SYNC-05 (status values)
- Priority: High
- Acceptance: All three views show identical grid rhythm (cell size, current-day ring, out-of-month opacity); holiday view retains add/edit affordances; tablet two-month preview optional but consistent if present; legacy files deleted.

### TASK-UX-02: Migrate confirmation dialogs
- Source: § AUD-UI-DUPLICATE UD2
- Files: departments-tab.tsx, holiday-calendar.tsx, directory-list.tsx, leave-approval-actions-cell.tsx, tasks-tab.tsx (+ any remaining AlertDialog confirms)
- Context: Five+ raw AlertDialog confirms vs ConfirmDialog elsewhere — differing labels, button order, destructive styling.
- Implementation direction: Mechanical migration onto ConfirmDialog(destructive where delete/redo); copy audit for consistent verbs ("Delete department" not "Are you sure?").
- Depends on: DS-03
- Priority: Medium
- Acceptance: `<AlertDialog` grep in apps/web = 0 confirmatory uses; every destructive action shows red confirm + explicit object name; Escape/overlay dismiss everywhere.

### TASK-UX-03: Semantic color adoption sweep
- Source: § AUD-UX-CONSISTENCY UX1/UX3, § AUD-UI-DUPLICATE UD3
- Files: components/tasks/{task-card,task-kanban-board,task-detail-sheet}.tsx, components/projects/{project-card,projects-tab,tasks-tab}.tsx, leave tables (leave-history-table, admin-leave-holidays-view), attendance tables (admin-attendance-table, approvals-tab, admin-open-shifts-table), reports views, user status chips (directory-list, user-edit-dialog), notifications priority chips
- Context: Color coding is strong in tasks/projects but hand-copied; leave/attendance/reports/user surfaces lag — same semantic value, different (or no) color across screens.
- Implementation direction: Replace every local mapping with statusColor/DS-04 tokens; ensure each list gets: status chip (colored), priority indicator where applicable, tag/category color where the data has categories (departments get a stable generated hue). Leave states (pending/approved/rejected/cancelled) and attendance statuses get ClickUp-style consistent chips.
- Depends on: DS-04
- Priority: High
- Acceptance: Cross-screen spot-check: `pending`/`review`/`urgent`/`on_leave` render identical hue+shape in every table/card/badge they appear in; no monochrome admin tables remain; contrast passes AA on all chip/text combos (verify with token-level check).

### TASK-UX-04: Empty-state + loading/error sweep
- Source: § AUD-UI-PKG UP1, § AUD-UX-CONSISTENCY; scaffold gaps
- Files: all list views + detail panels: conversations, messages, tasks (list/kanban/gantt), projects grid/detail tabs, leave tables, attendance views, reports, audit, exports history, notifications, notes, announcements, directory tabs, quick notes widget
- Context: Inconsistent empty/loading/error treatments; some raw "Loading..." or silent blanks, no retry.
- Implementation direction: EmptyState (DS-05) with contextual CTA; skeleton rows during load; error card with Retry via React Query. Keep the dashboard layout's capabilities-error pattern as the model (layout.tsx:182-207).
- Depends on: DS-05
- Priority: Medium
- Acceptance: Every list renders all four states deliberately (empty/load/error/data); zero plain-text loaders; retry works after forced failure.

### TASK-UX-05: List-page scaffold adoption
- Source: § AUD-UX-CONSISTENCY; § AUD-WEB-DASH WD1
- Files: directory-list (users mgmt), departments-tab, designations-tab, audit-log-table, export-history, tasks-tab (list mode), projects-tab, admin-attendance-table, admin-leave-holidays-view, notifications-tab, report-builder preview
- Context: Filters/sort/bulk/pagination combos differ per page; several lack pagination or filters entirely.
- Implementation direction: Migrate each onto ListScaffold with its DS-06 configs (FEAT-07/08 buttons live in toolbar slots); unify toolbar layout: search left, filters middle, actions right (wrap to rows on mobile); per-page density from DS tokens. Dashboard page minor: align activeRole fallback with backend order (page.tsx:51-52).
- Depends on: DS-06, FEAT-01..12 (features land first so scaffolds wrap final data)
- Priority: High
- Acceptance: Every list: same toolbar anatomy at 1280 (single row) and 375 (stacked, sticky search), filter chips removable, sort menu identical, bulk bar consistent; no page regresses capability gating.

### TASK-UX-06: Page-by-page responsive pass
- Source: § AUD-UX-CONSISTENCY UX2 (+DS-07 standards)
- Files: all 36 routes under apps/web/src/app + auth pages; priority order: chat, projects/[id], tasks, attendance (self+org+admin), directory tabs, leave, reports/admin-reports, settings tabs, profile, notes/announcements/notifications, onboarding/change-password/role-select/login
- Context: Chat + shell are responsive exemplars; remaining pages are untested at tablet/mobile widths; several tables/detail panes likely break (project detail 827-line page, task sheet 1141-line).
- Implementation direction: Apply DS-07 per page: master-detail swap, table→card below 768, grid col counts, dialog→sheet on mobile, bottom-nav safe-area padding. Record exact breaks found (e.g., "project detail tabs overflow at 640") and fix against tokens.
- Depends on: DS-07, UX-01..05
- Priority: High
- Acceptance: QA-04 matrix passes: every route usable+composed at 375/768/1280 (no horizontal scroll, tap targets ≥44px, primary action visible without hunting, dialogs full-screen-sheet on mobile).

### TASK-UX-07: Page-container width standardization
- Source: § AUD-UX-CONSISTENCY UX5
- Files: apps/web/src/app/dashboard/settings/page.tsx:11 (max-w-5xl) vs PageContainer default; forms-heavy tabs (mail, policies) may keep a readable max-width as an intentional token
- Context: One admin page visibly narrower than peers without a rule.
- Implementation direction: Add `maxWidth` prop to PageContainer with tokens (full | readable); settings page uses `readable` deliberately if forms benefit — otherwise full; apply consistently to profile/forms pages.
- Depends on: DS-01
- Priority: Low
- Acceptance: Width choice is tokenized and consistent across settings/profile/forms pages; no one-off max-w classes in page files.

### TASK-UX-08: Consolidate attendance graphs
- Source: § AUD-UI-DUPLICATE UD4
- Files: components/attendance/hr-attendance-graph.tsx + admin-attendance-graph.tsx → one AttendanceGraph with role-driven data source
- Context: Near-duplicate chart components per role — drift risk already flagged.
- Implementation direction: Single component (props: series, labels, scope label); role differences live in data fetching only; colors via DS-04.
- Depends on: DS-04
- Priority: Low
- Acceptance: One component renders both HR and admin graphs; visual parity at 375/768/1280; legacy files removed.

### TASK-UX-09: Decompose the two mega-components
- Source: § AUD-WEB-PROJ WP3, § AUD-WEB-TASKS WT2
- Files: apps/web/src/app/dashboard/projects/[id]/page.tsx (827 l) → detail header, tabs orchestration, per-tab components; components/tasks/task-detail-sheet.tsx (1141 l) → header, overview, comments, time, activity, QA submission sections
- Context: Two files concentrate layout, data, and mutations — blockers for consistent restyling and test coverage.
- Implementation direction: Pure refactor after UX-05 (no behavior change): extract components along existing tab boundaries, share hooks per concern, keep query keys identical (SYNC-03 map unaffected).
- Depends on: UX-05
- Priority: Medium
- Acceptance: No file >300 lines in the two areas; all existing tests + QA-05 flows pass unchanged; visual parity screenshots-diff-free per QA-04 checklist.

### TASK-UX-10: Shell polish
- Source: § AUD-WEB-SHELL WS2/WS3
- Files: apps/web/src/app/dashboard/layout.tsx:115-207 (capabilities error UX), use-reverb.ts:36-39 (silent Pusher disable), env config
- Context: 3s spinner→error state on capability failure is opaque; missing Pusher env vars silently disable realtime (console-only).
- Implementation direction: Error state gets explicit copy + Retry/Logout immediately (drop the 3s delay); build-time assertion or settings-diagnostics banner when Pusher env incomplete; offline banner (ui/offline-banner exists — verify wired).
- Depends on: FEAT-05
- Priority: Low
- Acceptance: Capability fetch failure shows actionable error instantly; missing Pusher config surfaces a dismissible admin-visible warning; offline banner appears when navigator offline.

---

## Group 5: Final QA / Production Readiness

Shared context: nothing below replaces per-task acceptance; these are cross-cutting gates. Run on staging (Cloud Run revision) with seeded demo data + fresh prod-shape DB (pgsql).

### TASK-QA-01: Expand the automated suites
- Source: § AUD-API-TESTS TE1/TE2, § AUD-WEB-TESTS WT3
- Files: apps/api/tests/Feature (new: TaskApprovalAuthzTest, HrScopeMatrixTest, LeaveBalanceTest, QaFieldTypeTest, SettingsCacheInvalidationTest, NotificationBroadcastTest, UserCreationCredentialsTest), apps/web/src/__tests__ (chat-tab, task-detail-sheet, leave-form+balance, report-builder, settings-tabs smoke)
- Context: 22 backend feature files and 8 web test files against 98 components; the Critical/Highest fixes lack regression tests today.
- Implementation direction: One test per Group-2 Critical/High acceptance criterion; pgsql-only tests marked group `pg` for ilike paths (TE2); web tests target the decomposed components (UX-09).
- Depends on: RBAC-01, RBAC-02, STAB-01 (land first; suite grows alongside)
- Priority: High
- Acceptance: CI green on sqlite+pgsql matrix with new suites; coverage of the 10 High fixes ≥1 test each; web critical-flow tests ≥10 files.

### TASK-QA-02: CI/CD hardening
- Source: § AUD-INFRA-CI CI1/CI2
- Files: .github/workflows/ci.yml, cloudbuild trigger config
- Context: No PHP static analysis/style gate; Cloud Build deploy not visibly gated on green CI.
- Implementation direction: Add larastan (or pint+phpstan level baseline) to api-ci; make deploy trigger subscribed to CI success (or add a deploy-gate job verifying required checks) — document the pipeline in README pointer (STAB-14).
- Depends on: QA-01
- Priority: Medium
- Acceptance: PR introducing an unused variable/typed error fails api static check; a red CI blocks deploy demonstrably (staging drill).

### TASK-QA-03: Per-role workflow walkthroughs
- Source: § AUD-WORKFLOW-LIFE + all workflow findings; closes FEAT/STAB loops
- Files: manual script (docs), staging environment
- Context: The "done bar" is end-to-end correctness per role; automated tests can't cover felt workflow breaks.
- Implementation direction: Script per role: super_admin (create user→credentials→first login chain, role-switch, demo seed/purge, all settings tabs incl. mail test + jobs retry), hr (dept/HR roster, team attendance + correction + export scoping, leave queue→approve→attendance on_leave tile→balance, announcements, saved views), employee (login→onboarding→clock in/out offline→leave request→balance→cancel→task assign→submit QA→redo feedback→chat DM by email search→exports none). Record pass/fail per step with screenshots-free checklist.
- Depends on: Groups 2–4 complete
- Priority: Critical
- Acceptance: Every scripted step passes with no dead ends, unactionable errors, or silent failures; failures loop back as new tasks, not waivers.

### TASK-QA-04: Responsive + visual consistency verification matrix
- Source: § AUD-UX-CONSISTENCY (final gate)
- Files: checklist per route × {375, 768, 1280} × {light, dark} × {compact, comfortable density}
- Context: UX-06 fixes known breaks; this gate proves app-wide composition, not just non-breakage.
- Implementation direction: Matrix walkthrough (36 routes × 12 combos, sampled density/dark to 4 combos where 12 is impractical — justify sampling); checklist: grid alignment, spacing-scale conformity, DS-token-only colors, chip contrast AA, touch targets, bottom-nav coexistence.
- Depends on: UX-06
- Priority: High
- Acceptance: Matrix signed off; any deviation becomes a token fix (not a per-page patch); zero hardcoded color literals outside tokens (grep gate).

### TASK-QA-05: Sync & regression soak
- Source: § AUD-SYNC-REALTIME, § AUD-WEB-CHAT WC5
- Files: staging; two browsers + two roles
- Context: Prove no stale state, races, duplicates remain after SYNC tasks.
- Implementation direction: Script: two admins approve concurrently (no double-debit); chat send optimistic + Pusher + offline queue interleavings (WC5 regression watch); notification single-delivery; timer two-tab; role-switch multi-device; dashboard caches invalidate after each mutation family; offline punch replay incl. FEAT-09 batch path.
- Depends on: SYNC-01..10, FEAT-09
- Priority: High
- Acceptance: All soak scenarios pass with zero duplicate side effects and ≤1s perceived freshness; failures loop back.

### TASK-QA-06: Ops & performance verification
- Source: § AUD-API-BG, § AUD-API-REPORTS, § AUD-API-DEPLOY
- Files: staging + Cloud Run; check-bundle-size script
- Context: Verify scheduled jobs, queue health, export retention, bundle budgets after all changes.
- Implementation direction: 24h staging soak: scheduler heartbeat quiet, reminders fire in company tz, failed-jobs surface via settings→System Jobs (STAB-12 semantics), export cleanup job prunes, bundle budget still green post-UX additions, p95 of /dashboard/init and chat messages within budget (record numbers).
- Depends on: STAB-03/08/09, Groups 3–4
- Priority: Medium
- Acceptance: Soak report with job-run evidence, queue depth ~0, DB size stable after export churn, bundle size within existing budget; rollback rehearsal (STAB-09 SHA tag) done once.

### TASK-QA-07: Release hygiene
- Source: § AUD-ROOT RT2, § AUD-API-DEPLOY, general
- Files: README.md (post-STAB-14 pointer doc), CHANGELOG entry, VersionController bump
- Context: Final cut: docs truth, version marker, deploy smoke.
- Implementation direction: README points to the real doc + runbook (deploy, rollback, env matrix from STAB-09); bump version endpoint; deploy to prod via new pipeline, run QA-03 super_admin script subset against prod smoke (non-mutating steps only).
- Depends on: all
- Priority: Medium
- Acceptance: Prod smoke green; README accurate; version endpoint matches release; audit's "Highest-value fixes" list fully checkable as done.

---

## Audit ↔ Task Coverage Map

| Audit § | Finding(s) | Task(s) |
|---|---|---|
| AUD-API-ROUTES | R1 dup timer route, R2 test-pusher, R3 dead import, R4 /ping leak | STAB-13 |
| AUD-API-ROUTES | R5 fragile show/activity placement | RBAC-02 (scope), RBAC-01 (pattern) |
| AUD-API-ROUTES | open Q /attendance/sync | FEAT-09 |
| AUD-API-AUTH | A1 settings cache | SYNC-02 |
| AUD-API-AUTH | A2 split-brain | SYNC-04 |
| AUD-API-AUTH | A3 expiry clock | SYNC-09 |
| AUD-API-AUTH | A4 enumeration | RBAC-10 |
| AUD-API-AUTH | A5 GET-refresh, A6 token metadata | STAB-07 |
| AUD-API-AUTH | A7 hidden attrs | QA-01 (test asserts no sensitive fields in login payload) |
| AUD-API-CAPS | C1 cache clear, C2 fallback drift | SYNC-02 (C1); C2 → Deferred (fallback matrix only used unseeded; low risk — document in DS-adjacent runbook QA-07) |
| AUD-API-MW | M1 capability leak | RBAC-10 |
| AUD-API-MW | M2 path literals, M3 dual toggle | STAB-13 (M2); M3 → Deferred (harmless dual read; revisit with FEAT-03) |
| AUD-API-MW | M4 CSP | STAB-13 |
| AUD-API-USERS | U1/U2 update integrity | RBAC-03 |
| AUD-API-USERS | U3 HR scope | RBAC-02 |
| AUD-API-USERS | U4 bulk feedback, U5 reset partial, U6 forceCreate | STAB-12 |
| AUD-API-PROFILE | P1 designation | RBAC-04 |
| AUD-API-PROFILE | P2 orphans, P3 free-text URL | STAB-10 |
| AUD-API-ORG | O1 open reads | Deferred — accepted design (documented in audit) |
| AUD-API-ORG | O2 shared scope abstraction | RBAC-02 |
| AUD-API-ORG | O3 dept-HR targets | RBAC-07 |
| AUD-API-ORG | O4 is_active dead state | FEAT-04 |
| AUD-API-ORG | O5 destroyTeam dangling | FEAT-04 (guard added alongside status route) |
| AUD-API-ATT | T1 dead sync() | FEAT-09 |
| AUD-API-ATT | T2 idempotency, T4 holidays scan, T5 race, T7 manual recompute | STAB-11 |
| AUD-API-ATT | T3 swallowed errors | SYNC-06 |
| AUD-API-ATT | T6 role-name helper | STAB-12 |
| AUD-API-LEAVE | L1 sole-admin self-approve (corrected) | Deferred — documented design; revisit only if multi-admin guaranteed (note in QA-03 script) |
| AUD-API-LEAVE | L2 HR index visibility | RBAC-02 |
| AUD-API-LEAVE | L3 role-membership checks | RBAC-02 (unified capability basis) |
| AUD-API-LEAVE | L4 export scope | RBAC-02 |
| AUD-API-LEAVE | L5/L10 working-day balance | FEAT-10 |
| AUD-API-LEAVE | L6 ilike portability | QA-01 (pg-marked tests) |
| AUD-API-LEAVE | L7 redo via reject | SYNC-07 |
| AUD-API-LEAVE | L8 no cancel | FEAT-01 |
| AUD-API-LEAVE | L9 leave.approve-hr phantom | RBAC-02 (matrix cleanup alongside) |
| AUD-API-PROJECTS | PR1/PR2 pagination | STAB-04 |
| AUD-API-TASKS | TK1 Critical authz | RBAC-01 |
| AUD-API-TASKS | TK2 QA bypass | RBAC-09 |
| AUD-API-TASKS | TK3 assignees-in-update | SYNC-07 |
| AUD-API-TASKS | TK4 submitted pagination | STAB-04 |
| AUD-API-TASKS | TK5 approve notify | SYNC-07 |
| AUD-API-TASKS | TK6 QA value validation | STAB-01 |
| AUD-API-QA | QA1/QA2/QA4 type system | STAB-01 |
| AUD-API-QA | QA3 delete guard | STAB-02 |
| AUD-API-TIMER | TM1 ownership | RBAC-08 |
| AUD-API-TIMER | TM2 TTL | Deferred — Low, harmless (documented) |
| AUD-API-CHAT | CH1 search | STAB-05 |
| AUD-API-CHAT | CH2 clearChat | STAB-05 |
| AUD-API-CHAT | CH3 empty body | STAB-05 |
| AUD-API-CHAT | CH4 hard delete | Deferred — product decision (tombstones); noted for roadmap |
| AUD-API-CHAT | CH5 inactive DM | STAB-05 |
| AUD-API-COMMS | CM1 channel cache | SYNC-02 |
| AUD-API-COMMS | CM2 dead forgets, CM4 timestamp | STAB-13 |
| AUD-API-COMMS | CM3 scoping (verified OK) | none — positive |
| AUD-API-REPORTS | RE1 leave status | SYNC-05 |
| AUD-API-REPORTS | RE2 HR scoping | RBAC-02 |
| AUD-API-REPORTS | RE3 base64/retention | STAB-03 |
| AUD-API-REPORTS | RE4 160h constant | Deferred — needs product input on productivity formula (note in FEAT-11 follow-up) |
| AUD-API-REPORTS | RE5 filter validation | STAB-03 |
| AUD-API-SETTINGS | S1 cache (cross) | SYNC-02 |
| AUD-API-SETTINGS | S2/S3 jobs surface | STAB-12 |
| AUD-API-SETTINGS | S4 dead directory methods | STAB-13 |
| AUD-API-DASH | D1 controller-in-controller | UX-09-adjacent refactor folded into RBAC-02/QA-01 (safeCall remains but scoped data via HrScope; full extraction → Deferred, low value now) |
| AUD-API-DASH | D2 stringly invalidation | SYNC-03 (frontend map) + SYNC-02 (server-side names documented in runbook) |
| AUD-API-DASH | D3 leave metric, D4 scope-less HR, D5 mixed counts | SYNC-05 (D3), RBAC-02 (D4/D5) |
| AUD-API-BG | B1 tz, B2 heartbeat, B3 comment | STAB-08 |
| AUD-API-BG | B4 queued listener visibility | STAB-12 + QA-06 |
| AUD-API-DB | DB1 down(), DB2 vocabulary | SYNC-05 |
| AUD-API-DB | DB3 soft-delete open Q | FEAT-12 |
| AUD-API-TESTS | TE1/TE2 | QA-01 |
| AUD-API-DEPLOY | DE1 refs, DE3 tags | STAB-09 |
| AUD-API-DEPLOY | DE2 config:cache | Deferred — documented tradeoff (start.sh comment) |
| AUD-WEB-CORE | WC1 token stores | RBAC-11 |
| AUD-WEB-CORE | WC2 offline replay | SYNC-10 |
| AUD-WEB-CORE | WC3 unwrap heuristic | STAB-07 |
| AUD-WEB-CORE | WC4 middleware forgeability | RBAC-05 (+FEAT-05); cookie remains UX-only by design, API authoritative |
| AUD-WEB-SHELL | WS1 nav, WS4 palette | FEAT-05 |
| AUD-WEB-SHELL | WS2 error UX, WS3 Pusher env | UX-10 |
| AUD-WEB-DASH | WD1 fallback | UX-05 |
| AUD-WEB-DIR | DI1 middleware bypass | RBAC-05 |
| AUD-WEB-DIR | DI2 ungated tabs | Deferred — matches backend open reads (O1) |
| AUD-WEB-ATT | WA1 OK | none — positive |
| AUD-WEB-LEAVE | sampled OK | covered via FEAT-01/02 acceptance |
| AUD-WEB-PROJ | WP1 /users 403 | RBAC-05 |
| AUD-WEB-PROJ | WP2 .bak | STAB-14 |
| AUD-WEB-PROJ | WP3 827-line page | UX-09 |
| AUD-WEB-TASKS | WT1 QA builder | STAB-01 |
| AUD-WEB-TASKS | WT2 1141-line sheet | UX-09 |
| AUD-WEB-CHAT | WC5 optimistic watch | QA-05 |
| AUD-WEB-COMMS | thin wrappers, OK (Info) | UX-04 (empty/loading/error states on those tabs); no dedicated task |
| AUD-WEB-REPORTS | WR1 saved views | RBAC-06 |
| AUD-WEB-REPORTS | WR2 dead branch, WR3 preview | FEAT-11 |
| AUD-WEB-SETTINGS | WSe1 timezone | FEAT-06 |
| AUD-WEB-SETTINGS | holiday CRUD OK | none — positive |
| AUD-WEB-OFFLINE | WO1/WO2 | SYNC-10 |
| AUD-WEB-OFFLINE | WO3 no SW | Deferred — by design (queue covers mutations) |
| AUD-WEB-TESTS | WT3 coverage | QA-01 |
| AUD-WEB-TESTS | WT4 artifacts | STAB-14 |
| AUD-UI-PKG | UP1 dead exports | DS-05 |
| AUD-UI-PKG | UP2 SDK unused | Deferred — decision: keep generating (cheap), adopt opportunistically in UX-09 hooks |
| AUD-INFRA-CI | CI1/CI2 | QA-02 |
| AUD-ROOT | RT1–RT7 | STAB-14 (+RT2 README also QA-07) |
| AUD-WORKFLOW-LIFE | WL1 credentials | STAB-06 |
| AUD-WORKFLOW-LIFE | WL2/3 OK | QA-03 re-verifies |
| AUD-RBAC-WEB | RW1 pattern | RBAC-05 |
| AUD-RBAC-WEB | RW2 designation | RBAC-04 |
| AUD-RBAC-WEB | RW3 OK / RW4 admin map | RW4 → RBAC-05 |
| AUD-SYNC-REALTIME | SY1 double-broadcast | SYNC-01 |
| AUD-SYNC-REALTIME | SY2 invalidation map | SYNC-03 |
| AUD-SYNC-REALTIME | SY3 timer tabs | SYNC-08 |
| AUD-SYNC-REALTIME | SY4 OK | none — positive |
| AUD-UI-DUPLICATE | UD1 calendars | DS-02 + UX-01 |
| AUD-UI-DUPLICATE | UD2 dialogs | DS-03 + UX-02 |
| AUD-UI-DUPLICATE | UD3 priority map | DS-04 |
| AUD-UI-DUPLICATE | UD4 graphs | UX-08 |
| AUD-UI-DUPLICATE | UD5 OK | none — positive |
| AUD-MISSING-FEATURES | MF1 balance | FEAT-02 |
| AUD-MISSING-FEATURES | MF2 cancel | FEAT-01 |
| AUD-MISSING-FEATURES | MF3 notif settings | FEAT-03 |
| AUD-MISSING-FEATURES | MF4 dept toggle | FEAT-04 |
| AUD-MISSING-FEATURES | MF5 exports | FEAT-07 |
| AUD-MISSING-FEATURES | MF6 bulk | FEAT-08 |
| AUD-UX-CONSISTENCY | UX1/UX3 color | DS-01/DS-04 + UX-03 |
| AUD-UX-CONSISTENCY | UX2 responsive | DS-07 + UX-06 (+QA-04) |
| AUD-UX-CONSISTENCY | UX4 dead branch | FEAT-11 |
| AUD-UX-CONSISTENCY | UX5 width | UX-07 |
