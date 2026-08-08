# Phase 5 — Attendance

## What
Full attendance module for all three roles: employee Clock In / Start Break / End Break / Clock Out with an auto-saved shift timeline; a live HH:MM:SS timer that keeps running across navigation, turns amber on overtime, and stops only on explicit End; a personal calendar heatmap history with per-day summaries; Admin company-wide attendance with date/dept/person filters; HR today shift status, leave linkage, and weekly/monthly per-employee graphs; Admin/HR manual corrections; overtime tracking with its own heatmap color; a late badge for clock-ins past the official start; Excel export; a configurable shift-reminder scheduler (employee 15 min before start, HR 30 min after start if not clocked in); and an offline timer that runs locally and syncs via the Server-Validation conflict strategy. Implements R5.1–R5.12.

## Why
Attendance is the most-used daily flow in the platform and the highest-risk offline surface: a timer must keep running locally with no connectivity, then reconcile cleanly against the server as the single source of truth. Phase 5 also produces the real data that feeds dashboards (present/absent/late widgets from Phase 4) and later reports (Phase 9), and it exercises the Server-Validation conflict strategy that the Offline Engine reserves specifically for attendance.

## Scope
- Clock In / Start Break / End Break / Clock Out endpoints + the full shift timeline persisted automatically (R5.1).
- Live HH:MM:SS count-up timer: survives navigation, turns amber on overtime, stops only on explicit End (R5.2).
- Personal calendar heatmap history; click a date → clock-in/breaks/clock-out, total hours, projects, tasks (R5.3).
- Admin company-wide attendance for everyone; filter by date / department / person; click any date or person for a full summary (R5.4).
- HR today's employee shift status; filter present/absent/late; view employee leave requests (R5.5).
- HR weekly/monthly attendance graph per employee (R5.6).
- Manual correction of any attendance entry by Admin/HR with an audit trail (R5.7).
- Overtime tracked beyond standard hours, shown in attendance + shift summaries, with a separate heatmap color (R5.8).
- Late badge when clock-in is after the official start time (R5.9).
- Export attendance as an Excel report (R5.10).
- Shift-reminder scheduler: employee reminded 15 min before start, HR alerted 30 min after start if not clocked in; both times configurable in settings (R5.11).
- Offline: timer runs locally in IndexedDB and syncs on reconnect using the Attendance=Server-Validation conflict strategy (R5.12).
- Capability gates: `employee.clock-self`, `hr.view-team-attendance`, `admin.view-all-attendance`, `admin.correct-attendance`.
- Realtime presence broadcast of "who is clocked in now" via Reverb.

## Non-goals
- Payroll calculation / wage computation (future milestone).
- Geofenced or biometric clock-in validation (not in M1).
- Leave request creation/approval workflow (Phase 6); Phase 5 only reads leave status to mark a day as `leave` and surfaces requests for HR.
- Full reporting suite (Phase 9); Phase 5 ships only the Excel attendance export.
- Settings UI for standard working hours / holiday calendar (Phase 10); Phase 5 consumes the seeded `work_schedules` config.

## Phase / capability
Phase 5 of 11 · capability `attendance` · depends on Phase 2 (users/departments/designations + capability matrix), Phase 3 (app shell, design system, filter bar, status badges), and Phase 4 (dashboard widgets — attendance widget host, generic Metric Widget). Implements R5.1–R5.12.

## ADRs
Depends on ADR-005 (OpenAPI spec-first), ADR-009 (per-entity conflict resolution — Attendance=Server-Validation), ADR-010 (single shared Offline Engine), ADR-013 (Laravel Reverb), ADR-014 (Sanctum Bearer). No new ADR introduced.
