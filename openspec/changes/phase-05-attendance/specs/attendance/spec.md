## Purpose
Capture employee attendance with an accurate, offline-resilient shift timer, give employees a personal heatmap history, give Admin and HR role-scoped oversight and correction tools, and surface reminders and exports — all gated by capabilities and reconciled against the server as the single source of truth.

## ADDED Requirements

### Requirement: Clock in / out and breaks with timeline
The system SHALL let an employee Clock In, Start Break, End Break, and Clock Out, and SHALL save the full shift timeline (every event with timestamp and type) automatically. (R5.1)

#### Scenario: clock in starts a shift
- **WHEN** an employee who is not currently clocked in presses Clock In
- **THEN** a `clock_in` event is recorded and the shift is open

#### Scenario: breaks are interleaved
- **WHEN** an employee presses Start Break and later End Break
- **THEN** a `start_break` and an `end_break` event are recorded in order, and break duration is folded into the shift timeline

#### Scenario: clock out closes the shift
- **WHEN** an employee presses Clock Out on an open shift
- **THEN** a `clock_out` event is recorded, the shift is closed, and the full ordered timeline is persisted

#### Scenario: full timeline auto-saves
- **WHEN** any clock or break event occurs
- **THEN** the event is appended to the shift timeline automatically with no extra user action

### Requirement: Live HH:MM:SS timer
The system SHALL show a live count-up timer in HH:MM:SS that continues while the user navigates the app, turns amber on overtime, and stops only on explicit End. (R5.2)

#### Scenario: timer continues across navigation
- **WHEN** a clocked-in employee navigates between routes
- **THEN** the HH:MM:SS timer keeps counting without resetting

#### Scenario: timer turns amber on overtime
- **WHEN** the elapsed work time passes the configured standard hours
- **THEN** the timer switches to an amber overtime style

#### Scenario: timer stops only on explicit End
- **WHEN** the shift is still open
- **THEN** the timer keeps running until the user explicitly Clocks Out; it never stops on navigation, refresh, or idle

### Requirement: Calendar heatmap history with per-day summary
The system SHALL present an employee their attendance as a calendar heatmap, and clicking a date SHALL reveal that day's clock-in, breaks, clock-out, total hours, and any projects/tasks worked. (R5.3)

#### Scenario: heatmap renders attendance density
- **WHEN** an employee opens their attendance history
- **THEN** a calendar heatmap colors each worked day by hours, with a distinct color for overtime days and a neutral state for absent/leave days

#### Scenario: date click shows the day summary
- **WHEN** an employee clicks a worked date
- **THEN** the summary shows clock-in time, each break, clock-out time, total hours, overtime, and the projects/tasks worked that day

### Requirement: Admin company-wide attendance with filters
The system SHALL give an Admin a company-wide attendance view for everyone, filterable by date, department, and person, where any date or person can be clicked for a full summary. (R5.4)

#### Scenario: company-wide listing renders
- **WHEN** an Admin opens company-wide attendance
- **THEN** every employee's status and hours for the selected scope are listed in one view

#### Scenario: filters narrow the view
- **WHEN** an Admin applies date, department, or person filters
- **THEN** the listing updates to the matching employees and days only

#### Scenario: click-through to a full summary
- **WHEN** an Admin clicks any date or person
- **THEN** a full attendance summary for that date or person opens

### Requirement: HR today view with leave
The system SHALL give HR today's employee shift status, filterable by present/absent/late, and a path to view an employee's leave requests. (R5.5)

#### Scenario: today's shift status lists everyone
- **WHEN** HR opens the today view
- **THEN** every employee's current shift status (present, absent, late, or on leave) is shown for today

#### Scenario: filter by status
- **WHEN** HR applies a present/absent/late filter
- **THEN** only employees matching that status are shown

#### Scenario: view leave requests
- **WHEN** HR selects an employee
- **THEN** HR can open that employee's leave requests

### Requirement: HR weekly and monthly per-employee graphs
The system SHALL let HR view weekly and monthly attendance graphs per employee. (R5.6)

#### Scenario: weekly graph
- **WHEN** HR selects an employee and the weekly view
- **THEN** a graph plots that employee's attendance for the chosen week

#### Scenario: monthly graph
- **WHEN** HR selects an employee and the monthly view
- **THEN** a graph plots that employee's attendance across the chosen month

### Requirement: Manual correction of an attendance entry
The system SHALL allow an Admin or HR to manually correct an attendance entry, recording who made the change for audit. (R5.7)

#### Scenario: correct an entry
- **WHEN** an Admin or HR edits an attendance entry's values
- **THEN** the corrected values are saved and the original values plus the correcting user and timestamp are retained in an audit trail

#### Scenario: correction is capability-gated
- **WHEN** a user without the correction capability attempts to edit an attendance entry
- **THEN** the action is denied

### Requirement: Overtime tracking with separate heatmap color
The system SHALL track overtime beyond the configured standard hours, show it in attendance and shift summaries, and render overtime days in a separate heatmap color from regular days. (R5.8)

#### Scenario: overtime is computed
- **WHEN** a shift's worked time exceeds the standard hours
- **THEN** the excess is recorded as overtime seconds and surfaced in the attendance and shift summaries

#### Scenario: overtime uses a distinct heatmap color
- **WHEN** a day contains overtime
- **THEN** that calendar cell uses the overtime color, distinct from a regular worked day

### Requirement: Late badge
The system SHALL mark an attendance entry with a late badge when the clock-in is after the official start time. (R5.9)

#### Scenario: late clock-in flagged
- **WHEN** an employee clocks in after the configured official start time
- **THEN** the day's entry is tagged with a late badge and the day's status reflects late

### Requirement: Excel export
The system SHALL export attendance as an Excel report. (R5.10)

#### Scenario: export a scope to Excel
- **WHEN** an Admin or HR requests an export of the current filtered attendance scope
- **THEN** an Excel file is generated and downloaded containing the matching attendance records

### Requirement: Shift-reminder scheduler
The system SHALL run a shift-reminder scheduler that alerts an employee before start and alerts HR after start if the employee is not clocked in, with both times configurable in settings. (R5.11)

#### Scenario: employee reminded before start
- **WHEN** an employee's shift start is the configured minutes away (default 15)
- **THEN** the employee receives a shift-start reminder

#### Scenario: HR alerted after missed clock-in
- **WHEN** an employee has not clocked in by the configured minutes after start (default 30)
- **THEN** HR is alerted that the employee has not clocked in

#### Scenario: reminder times are configurable
- **WHEN** an Admin changes the reminder lead and lateness-alert times in settings
- **THEN** subsequent scheduler runs use the new values with no code change

### Requirement: Offline timer with Server-Validation sync
The system SHALL run the timer locally while offline and sync attendance on reconnect using the Attendance=Server-Validation conflict strategy, where the server reconciles queued events, overlaps, and late arrivals as the source of truth. (R5.12)

#### Scenario: timer runs while offline
- **WHEN** an employee clocks in or out while offline
- **THEN** the timer and events continue to run and persist locally in IndexedDB

#### Scenario: sync on reconnect with server validation
- **WHEN** connectivity returns
- **THEN** queued attendance events are sent to the server, the server validates and reconciles overlaps and late arrivals, and the local state is replaced by the server's authoritative record

#### Scenario: conflict resolved in the server's favor
- **WHEN** a queued event conflicts with an existing server entry
- **THEN** the server's reconciled result wins and the client accepts it without data loss to the shift timeline

### Requirement: One-tap clock in/out/break with optimistic confirmation
The system SHALL make Clock In, Start Break, End Break, and Clock Out a single tap reachable in ≤2 clicks from the dashboard, with optimistic instant UI confirmation and rollback plus a danger toast on server error, and SHALL never perform a full page reload for these actions. (R5.13, R13.24, R13.19, R13.22)

#### Scenario: one-tap clock in from the dashboard
- **WHEN** an employee on the dashboard taps the attendance widget's Clock In button
- **THEN** the timer starts and the button state changes within the same frame, reachable in a single tap with no modal, form, or full reload

#### Scenario: optimistic confirmation then rollback on error
- **WHEN** a clock-in/out/break mutation fails on the server after the UI already updated optimistically
- **THEN** the UI reverts to the prior state and shows a danger toast stating the action failed and was reverted

#### Scenario: mobile tap target
- **WHEN** the attendance widget renders on a mobile viewport
- **THEN** the primary action button is full-width, green, and at least 48px tall, with no hover-only affordances

### Requirement: Isolated live timer that never re-renders unrelated widgets
The system SHALL drive the live HH:MM:SS timer via requestAnimationFrame (or a 1-second fallback interval) scoped to the timer component only, holding its state outside the component tree so it updates at 60 FPS with zero jank and SHALL NOT trigger re-renders of the dashboard or sibling widgets on each tick, and SHALL survive route navigation. (R5.14, R13.11, R13.12)

#### Scenario: timer ticks without disturbing the dashboard
- **WHEN** the timer advances by one second while the dashboard is visible
- **THEN** only the timer component re-renders; the dashboard shell and sibling widgets do not re-render for the tick

#### Scenario: timer survives navigation
- **WHEN** a clocked-in employee navigates away from and back to the dashboard
- **THEN** the timer has continued counting across navigation without resetting and remounts showing the correct elapsed time

#### Scenario: timer stays smooth under load
- **WHEN** the timer runs alongside other widgets and lists on the dashboard
- **THEN** the timer updates at 60 FPS with no perceptible main-thread jank

### Requirement: Scalable virtualized attendance lists
The system SHALL keep attendance lists and logs responsive (INP ≤200ms, 60 FPS) as employee and daily-event rows grow into the tens of thousands, by virtualizing lists above 100 rows, using memoized rows with stable keys. (R5.15, R13.14, R13.12)

#### Scenario: large list stays responsive
- **WHEN** an attendance list renders thousands of rows (employee and daily-event rows combined)
- **THEN** the list is virtualized so DOM nodes stay bounded to the visible rows plus overscan, and interactions remain at INP ≤200ms and 60 FPS

#### Scenario: rows do not re-render unnecessarily
- **WHEN** the list updates or scrolls
- **THEN** individual rows are memoized and use stable keys so only the changed rows re-render

### Requirement: Fast cached today-view with in-place filters
The system SHALL load the HR/Admin "today's attendance" view in ≤200ms p95 server-side and render immediately from a 30-second stale cache on revisit (stale-while-revalidate), and SHALL apply status and department filter changes in place without a reload, with filter input debounced at 250ms. (R5.16, R13.3, R13.10, R13.15)

#### Scenario: revisit renders from cache
- **WHEN** HR or an Admin returns to the today view within the cache window
- **THEN** the view renders immediately from cached data with no spinner and refreshes in the background

#### Scenario: filters update in place
- **WHEN** the user changes a present/absent/late/leave or department filter
- **THEN** the visible rows update in place (with URL and cache updated) after a 250ms debounce, with no full reload or screen blank

### Requirement: Offline clock with queued idempotent sync
The system SHALL run the clock/break timer locally from IndexedDB while offline, queue each action with a client-generated idempotency key, and on reconnect replay queued actions under the Server-Validation strategy so no event is double-applied, surfacing an offline banner while disconnected. (R5.12, R13.20)

#### Scenario: client_id prevents duplicate application
- **WHEN** a queued attendance action is replayed after reconnect using the same client_id
- **THEN** the server applies it exactly once regardless of retries, and the reconciled day replaces local state

#### Scenario: offline banner is shown
- **WHEN** connectivity is lost
- **THEN** an offline banner is displayed and clock/break actions continue to work locally and queue for later sync

### Requirement: Queued streamed Excel export
The system SHALL export attendance to Excel as a streamed download and SHALL queue any export estimated to exceed 500ms rather than running it as a long blocking request. (R5.10, R13.17, R13.4)

#### Scenario: heavy export is queued and streamed
- **WHEN** an Admin or HR requests an export whose generation is expected to exceed 500ms
- **THEN** the work is offloaded to a queue, the UI shows a queued/progress state, and the resulting file is streamed to the client rather than blocking the request

