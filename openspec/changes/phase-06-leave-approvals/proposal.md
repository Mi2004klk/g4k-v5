# Phase 6 — Leave & Approvals

## What
A reusable approval state-machine framework (Submitted → Pending → Approved/Rejected) backed by a polymorphic `approvals` table, plus the first concrete use of it: leave requests for all three roles. An employee requests leave (dates, reason) and HR approves or rejects; an HR member requests leave and an Admin approves or rejects; every request shows status badges (Pending/Approved/Rejected) in a leave history; an Admin sees leave history for all users; a holiday calendar view renders the seeded holiday data; and every approval event surfaces in the bell and the Notification Center. Implements R6.1–R6.8.

## Why
Leave is the first workflow that crosses the role boundary (employee ↔ HR, HR ↔ Admin) and the natural place to land the generic approval state machine that Phase 7 (projects/tasks submit-review) will reuse — building it polymorphically now avoids a second, parallel approval pipeline later. The approval events also become the first real driver of the notification bell, which Phase 8 expands into the full Notification Center; ordering Phase 6 before Phase 8 means Phase 6 ships a minimal in-app notification stub (write a row + push a realtime event) that Phase 8 replaces with the production notification system without changing the contract.

## Scope
- Generic approval framework: a polymorphic `approvals` table (`approvable_type`, `approvable_id`, `status` Submitted/Pending/Approved/Rejected, submitter, current-approver role, decision, decider, decided_at, payload) plus a guarded state machine that emits an event on each transition and is reusable by tasks/projects later (R6.1).
- Employee leave request: pick dates, enter reason, choose type → submission opens an approval routed to HR → status visible to the employee (R6.2).
- HR leave request: pick dates, enter reason → submission opens an approval routed to Admin → status visible to the HR member (R6.3).
- Leave history with status badges (Pending / Approved / Rejected) per user and per role scope (R6.4).
- Admin approves/rejects HR leave requests and views leave history for all users (R6.5).
- HR approves/rejects employee leave requests (R6.6).
- Holiday calendar view rendering the seeded holiday data (data is managed in Phase 10) (R6.7).
- Approvals surface in the bell and in the Notification Center: approver notified on submit, submitter notified on decision (R6.8).
- Capability gates: `employee.leave.request-self`, `hr.leave.approve-employee`, `admin.leave.approve-hr`.
- Realtime: an `approval-status-change` broadcast to the submitter's private channel on every transition.
- Offline: leave submit is queued; the server validates on sync.

## Non-goals
- Project/task submission and review (Phase 7) — Phase 6 only delivers the approval framework and wires leave as its first consumer; the task/project approvable types are added in Phase 7.
- Full notification system, bell unread-count state machine, and Notification Center UI (Phase 8) — Phase 6 ships a minimal in-app notification stub (row + realtime push) that Phase 8 supersedes; the integration contract stays identical.
- Holiday CRUD and settings UI (Phase 10) — Phase 6 reads the seeded `holidays` table only; editing is Phase 10.
- Leave balance / accrual / quota computation (future milestone, not in M1).
- Payroll linkage of approved leave (future milestone).

## Phase / capability
Phase 6 of 11 · capability `leave-approvals` · depends on Phase 2 (users, departments, designations, capability matrix) and Phase 3 (app shell, design system, status badges, filter bar, dialogs, toasts, form system). Reuses the Notification Center from Phase 8 — Phase 6 is ordered before Phase 8, so a minimal in-app notification stub is provided here and swapped for the Phase 8 notification system when it lands. Implements R6.1–R6.8.

## ADRs
Depends on ADR-005 (OpenAPI spec-first), ADR-009 (per-entity conflict resolution — leave submit uses Server-Validation since HR/Finance data is Server Wins), ADR-010 (single shared Offline Engine), ADR-013 (Laravel Reverb), ADR-014 (Sanctum Bearer). No new ADR introduced.
