## Purpose
Provide a single reusable approval state machine (Submitted → Pending → Approved/Rejected) and apply it to leave requests across all three roles, so that employees and HR can request leave, HR and Admin can approve or reject within their scope, every request shows a clear status history, and every approval event reaches the bell and Notification Center.

## ADDED Requirements

### Requirement: Reusable approval state machine
The system SHALL provide a reusable approval framework whose state machine moves an approvable item through Submitted → Pending → Approved/Rejected, with each transition guarded by a capability and an event emitted on every transition, so that leave now and tasks/projects later share one approval pipeline. (R6.1)

#### Scenario: submission opens an approval
- **WHEN** an approvable item (e.g. a leave request) is submitted
- **THEN** an approval record is created with status Pending, the submitter and current-approver role are recorded, and a transition event is emitted

#### Scenario: approval moves to Approved
- **WHEN** the current approver (within their capability) approves a pending approval
- **THEN** the status becomes Approved, the deciding user and timestamp are recorded, and a transition event is emitted

#### Scenario: approval moves to Rejected
- **WHEN** the current approver (within their capability) rejects a pending approval
- **THEN** the status becomes Rejected, the decision reason, deciding user, and timestamp are recorded, and a transition event is emitted

#### Scenario: transition is capability-gated
- **WHEN** a user without the matching approve capability attempts to decide a pending approval
- **THEN** the action is denied and the approval state does not change

### Requirement: Employee leave request routed to HR
The system SHALL let an employee submit a leave request by choosing dates, a leave type, and a reason, route the resulting approval to HR, and keep the status visible to the employee. (R6.2)

#### Scenario: employee submits a leave request
- **WHEN** an employee with the `employee.leave.request-self` capability picks start/end dates, a type, and a reason and submits
- **THEN** a leave request linked to a pending approval routed to HR is created

#### Scenario: employee sees their own status
- **WHEN** the employee reopens their submitted request
- **THEN** the current status (Pending, Approved, or Rejected) is visible with the decision and reason once decided

### Requirement: HR leave request routed to Admin
The system SHALL let an HR member submit a leave request by choosing dates, a type, and a reason, route the resulting approval to Admin, and keep the status visible to that HR member. (R6.3)

#### Scenario: HR submits a leave request
- **WHEN** an HR member submits a leave request with dates, type, and reason
- **THEN** a leave request linked to a pending approval routed to Admin is created

#### Scenario: HR sees their own status
- **WHEN** the HR member reopens their submitted request
- **THEN** the current status (Pending, Approved, or Rejected) is visible with the decision and reason once decided

### Requirement: Leave history with status badges
The system SHALL present leave history with status badges of Pending, Approved, or Rejected, consistent with the platform's badge colors. (R6.4)

#### Scenario: history lists past and current requests
- **WHEN** a user opens their leave history
- **THEN** their leave requests are listed newest-first, each with a status badge

#### Scenario: badges use the platform status colors
- **WHEN** a request is Pending, Approved, or Rejected
- **THEN** the badge renders in Amber, Green, or Red respectively, matching the platform status-badge contract

### Requirement: Admin approves HR leave and views all-user history
The system SHALL let an Admin approve or reject HR leave requests and view the leave history for all users. (R6.5)

#### Scenario: Admin decides an HR leave request
- **WHEN** an Admin with the `admin.leave.approve-hr` capability approves or rejects an HR member's pending leave request
- **THEN** the approval status updates, the decision and decider are recorded, and the HR member is notified

#### Scenario: Admin views all-user history
- **WHEN** an Admin opens the all-users leave history
- **THEN** every user's leave requests are listed with their current status and are filterable

### Requirement: HR approves employee leave
The system SHALL let HR approve or reject employee leave requests. (R6.6)

#### Scenario: HR decides an employee leave request
- **WHEN** an HR member with the `hr.leave.approve-employee` capability approves or rejects an employee's pending leave request
- **THEN** the approval status updates, the decision and decider are recorded, and the employee is notified

### Requirement: Holiday calendar view
The system SHALL render a holiday calendar view from the holiday data, whose content is managed in Phase 10. (R6.7)

#### Scenario: calendar renders seeded holidays
- **WHEN** a user opens the holiday calendar view
- **THEN** each seeded holiday appears on its date with its name, read-only

#### Scenario: holiday data is read-only here
- **WHEN** Phase 6 displays the holiday calendar
- **THEN** the data comes from the `holidays` table as seeded/managed in Phase 10 and cannot be edited from this view

### Requirement: Approvals surface in bell and Notification Center
The system SHALL surface approval events in the bell and the Notification Center: the approver is notified when a request is submitted, and the submitter is notified when a decision is made. (R6.8)

#### Scenario: approver notified on submit
- **WHEN** a leave request is submitted
- **THEN** the routed approver receives a notification in the bell and Notification Center

#### Scenario: submitter notified on decision
- **WHEN** an approval is decided (Approved or Rejected)
- **THEN** the submitter receives a notification in the bell and Notification Center with the outcome

#### Scenario: notification works before Phase 8 lands
- **WHEN** approval events fire before the Phase 8 notification system exists
- **THEN** a minimal in-app notification stub delivers the same bell + Notification Center entries via the identical contract that Phase 8 later fulfills

### Requirement: One-click approve or reject with optimistic update
The system SHALL let an approver approve or reject a pending leave request in a single click (plus a confirm step, with reason required on reject) from the dashboard notification or the leave list, and SHALL apply the decision optimistically — the row's status badge flips instantly and the row leaves the pending queue before the server round-trip lands — and SHALL roll back with a danger toast if the server rejects the decision. The decision SHALL be reachable in ≤2 clicks from the dashboard and SHALL NOT cause a full reload. (R6.5, R6.6, R13.24, R13.19)

#### Scenario: optimistic status badge flip on approve
- **WHEN** an HR/Admin clicks Approve on a pending leave request from the dashboard notification or leave list
- **THEN** the row's status badge flips from Pending (Amber) to Approved (Green) immediately and the row leaves the pending queue before the server responds

#### Scenario: optimistic status badge flip on reject
- **WHEN** an HR/Admin clicks Reject and confirms with a reason
- **THEN** the row's status badge flips from Pending (Amber) to Rejected (Red) immediately and the row leaves the pending queue before the server responds

#### Scenario: rollback on server error
- **WHEN** the approve/reject server call fails
- **THEN** the optimistic change is rolled back, the row returns to its prior Pending state, and a danger toast ("Approval failed — reverted") is shown

#### Scenario: double-submit is prevented
- **WHEN** the Approve/Reject button is clicked twice rapidly
- **THEN** the button is disabled with a dot-loader after the first click so only one decision fires

#### Scenario: decision is ≤2 clicks with no reload
- **WHEN** an approver reaches a decision from the dashboard
- **THEN** the whole action takes ≤2 clicks and causes no full route reload

### Requirement: Efficient leave list queries
The system SHALL serve the leave list, leave history, and pending-approval queue endpoints at p95 ≤200ms read at 10k rows, executing ≤5 SQL queries per request with zero N+1, using cursor pagination, backed by composite indexes on the filtered/ordered columns. (R6.4, R6.5, R13.4, R13.5, R13.6)

#### Scenario: list endpoint meets latency budget
- **WHEN** the leave list, history, or pending queue is requested at 10k rows
- **THEN** the response returns within p95 ≤200ms read

#### Scenario: bounded query count with no N+1
- **WHEN** a list request renders its rows including the linked approval status and requester
- **THEN** the request executes ≤5 SQL queries regardless of row count, with no N+1

#### Scenario: cursor pagination
- **WHEN** a client pages deep into the leave list or history
- **THEN** pagination uses a cursor (never OFFSET) and deep pages remain stable

#### Scenario: filtered and ordered columns are indexed
- **WHEN** the list is filtered by user/status or ordered by submission date
- **THEN** the query is served by composite indexes on `(user_id, status)`, `(status, submitted_at)`, and `(start_date)` and EXPLAIN confirms index usage

### Requirement: Virtualized leave history
The system SHALL virtualize the leave history list above 100 rows so that it stays at INP ≤200ms and 60 FPS as a user's or department's history grows into the thousands, with memoized rows and stable keys so that realtime status updates do not re-render the whole list. (R6.4, R13.14, R13.12)

#### Scenario: virtualization caps DOM nodes
- **WHEN** a leave history list of more than 100 rows is rendered
- **THEN** the DOM node count is capped at (visible + overscan) regardless of dataset size

#### Scenario: smooth scrolling at scale
- **WHEN** the history list grows into the thousands of rows
- **THEN** scrolling stays at INP ≤200ms and 60 FPS

#### Scenario: realtime update does not cause a render storm
- **WHEN** an `approval-status-change` broadcast updates one row in the history
- **THEN** only the affected memoized row re-renders, not the whole list

### Requirement: Queued notification fan-out keeps the decision fast
The system SHALL complete an approve or reject decision as a fast, synchronous database write (guarded state transition plus audit row) so the approver sees the result immediately, and SHALL offload only the notification fan-out — bell and Notification Center writes, realtime broadcast, and audit side effects — to a Laravel queue so fan-out never blocks the decision response. (R6.8, R13.17)

#### Scenario: decision returns without waiting on notifications
- **WHEN** an approver decides a pending leave request
- **THEN** the decision response returns as a fast write and is not delayed by notification delivery

#### Scenario: notification fan-out is queued
- **WHEN** an `ApprovalDecided` event fires
- **THEN** the notification, realtime-broadcast, and audit-side-effect listeners run on a queue, not in the decision request

#### Scenario: queued fan-out still reaches the submitter
- **WHEN** the decision has been recorded and the queued fan-out runs
- **THEN** the submitter receives the bell and Notification Center notification with the outcome
