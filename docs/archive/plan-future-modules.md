> **ARCHIVED:** This file is stale and superseded by context.md and fix-4.md.

> **ARCHIVED:** This file is stale and superseded by context.md and ix-3.md.

# plan-future-modules.md — Games4King Workplace OS: Post-M1 Module Roadmap
## (Projects/Tasks · Chat & Notifications · Announcements · Reports & Exports)

> **These modules are OUT OF SCOPE for M1** (per ADR-022, owner-confirmed). M1 ships the Base
> Application Module + Attendance Module + Leave Module only — see `plan.md`. This file plans the
> remaining modules for the **next milestone (M2)** so the work is preserved, sequenced, and ready to
> execute when M1 is shipped and stable.
>
> **Why separate:** keeping M1 focused (Base + Attendance + Leave) delivers a reliable daily-use
> application faster; bolting on Projects/Chat/Reports mid-M1 would dilute quality and delay the
> core attendance workflows. The approval framework built in Phase 6 (M1) is explicitly designed for
> reuse by Projects/Tasks submissions here.
>
> **Hierarchy of truth:** `plan.md` (M1) → this file (M2) → `openspec/REQUIREMENTS.md` (R7/R8/R9) →
> `openspec/changes/phase-07/08/09-*` (fully specified — read those for full detail).

---

## Pre-requisites (must be true before starting M2)

- M1 shipped & stable (Phases 0–10 of `plan.md` ✅).
- The reusable `ApprovalService` + polymorphic `approvals` table (M1 Phase 6) is available.
- The Offline Engine, design system, AppShell (3-state sidebar), RBAC, and per-module accent system
  are all in place.
- `notifications` table + `NotificationService` + Reverb broadcast (M1 Phase 6 minimal) are available
  to expand into the full Notification Center.

---

## M2 Module 1 — Projects & Tasks  (`projects-tasks`)
**Spec:** `openspec/changes/phase-07-projects-tasks/*` (proposal 41L, design 293L, spec 300L, tasks 51L)
**Reqs:** R7.1–R7.18 · **Depends on:** M1 Phases 2,3,4,6

### Scope
- Project CRUD + team auto-access + sort (R7.1–R7.3).
- Task create/assign/priority/due/scope/dependencies/comments/activity (R7.4–R7.6).
- Kanban (dnd-kit To Do/In Progress/Under Review/Done) + list + inline edit (R7.7).
- QA form builder + submission note (R7.8).
- Project work timer per project (R7.9).
- Recurring tasks daily/weekly-on-days/monthly-on-date (R7.10).
- Quick Task Assignment widget → Global Chat notify on completion (R7.11).
- Task + project submission/approval cycle (R7.12–R7.13) — **reuses M1 `ApprovalService`**.
- Gantt/Timeline view (HR/Admin) — ECharts/custom, web-worker layout (R7.14).
- Project history (R7.15); employee self-create if HR permits (R7.16); personal task list (R7.17);
  saved views/custom columns (R7.18).

### Key DB additions
- `projects` extend (priority, deadline, team_id/department_id, progress, created_by).
- `tasks` extend (priority, due_date, scope, progress, parent_id/blocked_by, qa_form_id, recurrence
  json, submitted_at, submission_note).
- `task_comments`, `task_activity`, `qa_forms`/`qa_form_fields`/`qa_submissions`, `saved_views`.
- Reuse `approvals` (M1) for task_submission + project_submission.

### Capabilities (new)
`projects.manage` (Admin/HR), `tasks.assign`, `tasks.submit`, `tasks.approve` (HR/Admin), employee
self-create flag.

### Notes
- Kanban uses dnd-kit (ADR-007: dnd-kit everywhere except dashboard React Grid Layout).
- Gantt/Tiptap lazy-imported + web-worker (R13.8/17).
- This module makes the dashboard "pending tasks" / "active projects" / "Quick Task Assignment"
  widgets (M1 empty states) functional.

---

## M2 Module 2 — Chat & Notifications  (`communication`)
**Spec:** `openspec/changes/phase-08-communication/*` (proposal 34L, design 225L, spec 224L, tasks 47L)
**Reqs:** R8.1–R8.15 · **Depends on:** M1 Phases 2,3 + M2 Module 1

### Scope
- Global Chat (all users), Project Chat (team-only, task alerts auto-posted), Direct Chat (1:1),
  Custom Group Chats (HR creates) (R8.1–R8.4).
- @mentions w/ dropdown + notify (R8.5); DM read receipts; pin messages (R8.6); read/unread border +
  count badge (R8.7).
- Image/file sharing (limits); task submission as links/directory (R8.8).
- Offline chat "Not connected" + queue (R8.9).
- Full Notification system: bell w/ unread count, history, mark-as-read (R8.10) — **expands M1 Phase 6
  minimal `notifications`** into Notification Center (R8.11).
- Announcement board: Admin company-wide / HR team-level; pin; reactions only; dashboard display
  closeable; notify on post (R8.12).
- Quick Notes (private sticky notes; pin to dashboard) (R8.13).
- Employee complaint/feedback channel: private form on Profile → DM to HR/Admin + high-priority global
  notification (R8.14).
- Mobile chat UX: list-first, full-screen conversation, fixed bottom input above keyboard (R8.15).

### Key DB additions
- Extend chat tables (`conversations` scope, `messages` type/attachment/reply/edited/pinned, reads,
  reactions); `announcements` scope/reactions; `quick_notes`; `feedback`.
- M1 `notifications` table expands into full Notification Center (same contract).

### Realtime
- Reverb private/presence channels (already wired in M1 Phase 3); conflict = Chat/Comments = Timestamp
  (ADR-009).

### Notes
- ConversationList + MessageList virtualized; MessageComposer uses TiptapEditor (lazy) + @mention
  Combobox; optimistic insert.
- Makes the M1 "Send Message" directory action functional (chat UI), and the dashboard notifications/
  announcements widgets live.

---

## M2 Module 3 — Reports & Exports  (`reporting`)
**Spec:** `openspec/changes/phase-09-reporting/*` (proposal 32L, design 204L, spec 152L, tasks 39L)
**Reqs:** R9.1–R9.8 · **Depends on:** M1 Phases 5,6 + M2 Module 1

### Scope
- Attendance reports (date range/dept/individual) (R9.1) — **extends M1 attendance export**.
- Project completion reports (R9.2); task completion statistics (R9.3); employee productivity summary
  (R9.4).
- HR limited versions of the same reports (R9.5).
- Export as Excel (tables) and PDF (R9.6).
- Weekly summary report auto-emailed to Admin every Sunday (scheduler) (R9.7).
- Saved report views; filters via shared FilterBar; virtualized large datasets (R9.8).

### Key DB additions
- `report_runs` (queued/streamed generation); reuse `saved_views`.
- Sunday summary Mailable scheduled (Laravel Scheduler Sunday 09:00) → Admin.

### Notes
- Heavy reports queued/streamed (>500ms → Laravel queue; R13.17). HR sees team-scoped only.
- Makes the dashboard "Reports" nav + the Admin/HR reporting widgets functional.

---

## M2 sequencing recommendation

1. **M2 Module 1 — Projects & Tasks** (unblocks dashboard task widgets + Quick Task Assignment; reuses
   M1 ApprovalService; high user value).
2. **M2 Module 2 — Chat & Notifications** (makes Send Message + announcements + notifications live;
   expands M1 notification stub; depends on org + projects for project chat).
3. **M2 Module 3 — Reports & Exports** (depends on attendance + projects data being rich; lowest risk
   to defer).

Each M2 module follows the same phase discipline as M1: spec-first OpenAPI → implement → test (incl.
perf budgets) → optimise → security-check → deploy to production → archive.

---

### End of plan-future-modules.md
**These modules are planned and ready to execute after M1 ships. They are explicitly NOT part of the
M1 plan in `plan.md` (ADR-022).**

