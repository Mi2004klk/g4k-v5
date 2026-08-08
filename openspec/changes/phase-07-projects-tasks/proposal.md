# Phase 7 — Projects & Tasks

## What
The full project and task management module: project CRUD with team auto-access, projects list with sort, tasks with multi-assignee/priority/due date/scope and dependencies, per-task Tiptap comments and an activity log, a Kanban board (To Do / In Progress / Under Review / Done) plus a list view with drag reorder and inline editing, a QA form builder attached to each project with an employee QA submission + note, a per-project work timer, recurring tasks, the Quick Task Assignment widget wired end-to-end with Global Chat auto-notify on completion, task and project submit → review → approve/redo flows, a Gantt/Timeline view, project history, employee self-create-permission with progress updates, a personal My Tasks list, and animated progress bars, pinning, and saved views with custom columns. Implements R7.1–R7.18 — the most requirements of any phase.

## Why
Projects and tasks are the operational core of the platform: where work is planned, assigned, tracked, reviewed, and closed out. This phase unifies everything the prior phases set up — capability-based permissions, the design system, dashboard widgets, and the reusable master-data/approval patterns — into one cohesive work surface. It also delivers the Quick Task Assignment end-to-end loop (R4.6/R4.7 stub → real, R7.11), the QA + approval workflow reused by tasks and projects (R7.12, R7.13), and the rich interactive UX (dnd-kit Kanban, Gantt via ECharts, animated progress) that defines the product feel.

## Scope
- Project CRUD (name, description, priority, deadline, status, team, HR owner, attached QA form) + archive/delete; Admin/HR only. (R7.1)
- Team assignment auto-grants project + task list + project-chat access. (R7.2)
- Project list sort by created date / deadline / priority, asc/desc. (R7.3)
- Task create/assign to individual / team / company-wide; priority Low/Medium/High/Urgent; due date + reminders; scope Global/Department/Role. (R7.4)
- Task dependencies (B blocked-until-A-done); HR/Admin. (R7.5)
- Per-task Tiptap comments + per-item activity log (created/assigned/progress/submitted/approved). (R7.6)
- Drag reorder tasks; Kanban (To Do/In Progress/Under Review/Done via dnd-kit) + list view + inline editing. (R7.7)
- QA form builder (HR/Admin) attached to project; employee fills QA + note on submission. (R7.8)
- Per-project work timer (start/pause/resume/end; logged per project). (R7.9)
- Recurring tasks (daily/weekly-on-days/monthly-on-date) in advanced collapsed section; auto-recreate on completion; HR notified; toggle off. (R7.10)
- Quick Task Assignment widget wired: dashboard → employee list → appears in their list → Global Chat auto-notified on completion. (R7.11)
- Task submit → HR/Admin review → approve / request redo → instant status. (R7.12)
- Project submit (completion report) → HR review → approve/redo; Admin sees all. (R7.13)
- Gantt/Timeline view (HR/Admin): horizontal bars + task-milestone diamonds. (R7.14)
- Project history: team, tasks done, time spent, completion date, approval result. (R7.15)
- Employee self-create tasks inside a project if permitted by HR; update task progress. (R7.16)
- Personal Task List (My Tasks): private to-do; HR/Admin can assign; employee can self-create. (R7.17)
- Progress bars animate 0→value; pinned items; saved views / custom columns (TanStack Table). (R7.18)

## Non-goals
- Project Chat realtime delivery and full chat UI (Phase 8 — Phase 7 only defines the `project_chats` table row on project create and posts task-alert system messages; the chat client ships in Phase 8).
- Global Chat client and notification Center bell surface (Phase 8 — Phase 7 emits the auto-notify event and writes the message row; rendering is Phase 8).
- Reports/exports on projects and tasks (Phase 9 — R9.2/R9.3; Phase 7 stores the data and exposes history).
- Full file attachment uploads on task submission (R11.3 — links/directory text only in M1; full upload deferred).
- Windows/Android native Kanban drag (M2/M3 — web only in M1).
- New ADR — ADR-007 (dnd-kit for everything except dashboard React Grid Layout) is respected, not changed.

## Phase / capability
Phase 7 of 11 · capability `projects-tasks` · depends on Phase 2+3+4. Implements R7.1–R7.18.

## ADRs
Depends on ADR-007 (dnd-kit for Kanban/list/tree reordering — never mixed with React Grid Layout, used here for the Kanban board, list reorder, and inline edit interactions), ADR-008 (TanStack Query = server state, Zustand = UI state — Kanban column state and filter chips are UI state; task/project data is server state), ADR-009 (per-entity conflict resolution — Tasks use Version+Merge per §9), ADR-013 (Laravel Reverb for realtime Kanban + submission notifications), and the capability-based permissions principle (architecture §5.3). No new ADR.
