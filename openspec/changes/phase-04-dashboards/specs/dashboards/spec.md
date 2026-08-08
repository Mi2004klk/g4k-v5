## Purpose
Provide a role-aware Dashboard framework with a self-contained Widget Engine, per-user rearrangeable layouts, and the three M1 role dashboards (Admin, HR, Employee).

## ADDED Requirements

### Requirement: Widget engine
The system SHALL provide a Widget Engine in which each widget is self-contained, declared via a manifest with permissions, settings, a data provider, and refresh behavior, and supports drag, resize, collapse, refresh, lazy-load, offline, and realtime modes. (R4.1)

#### Scenario: widget renders from manifest
- **WHEN** a dashboard renders a registered widget
- **THEN** the widget loads its own data provider and renders without coupling to other widgets

#### Scenario: widget collapses and refreshes
- **WHEN** a user collapses or manually refreshes a widget
- **THEN** the widget collapses to its header or refetches its data provider independently of other widgets

#### Scenario: widget operates offline and in realtime
- **WHEN** the network drops or a realtime update arrives for a widget's data provider
- **THEN** the widget renders the last cached payload offline, or updates live via its realtime channel

### Requirement: Adaptive widget sizes
The system SHALL render each widget adaptively by size: small shows a metric, medium shows metric plus label and secondary stat, and large shows chart plus stats, trend, and actions. (R4.2)

#### Scenario: resize changes content density
- **WHEN** a widget is resized from small to medium to large
- **THEN** its content expands from a single metric, to metric plus label and secondary stat, to chart plus stats, trend, and actions

### Requirement: Per-user rearrangeable layout
The system SHALL let each user rearrange and resize widgets on their dashboard via React Grid Layout and SHALL save that layout per user so it persists across reloads. (R4.3)

#### Scenario: layout persists per user
- **WHEN** a user drags or resizes widgets and reloads
- **THEN** the dashboard restores that user's saved arrangement, independent of other users' layouts

### Requirement: Independent widget loading and interaction
The system SHALL load each widget independently, surface a refresh icon on hover, make widgets dismissible, and make widgets clickable to navigate deeper into their source area. (R4.4)

#### Scenario: independent loading isolates failures
- **WHEN** one widget's data provider fails or is slow
- **THEN** the other widgets still load and render, and the failing widget shows its own error state

#### Scenario: dismiss and click-through
- **WHEN** a user dismisses a widget or clicks a metric to drill in
- **THEN** the widget is removed from that user's dashboard, or the user navigates to the widget's source area

### Requirement: Generic Metric Widget
The system SHALL provide a single generic Metric Widget that is JSON-fed and reused across all dashboards rather than building a bespoke widget per metric. (R4.5)

#### Scenario: metric widget renders from JSON
- **WHEN** a data provider returns a JSON payload (value, label, secondary, trend)
- **THEN** the generic Metric Widget renders the metric consistently wherever it is placed

### Requirement: Admin dashboard widgets
The system SHALL render an Admin dashboard with widgets for employees active/inactive, active projects, today's attendance (present/absent/late), pending approvals with quick access, a dense recent-activity feed, and a quick task assignment widget. (R4.6)

#### Scenario: admin sees operational summary
- **WHEN** an Admin opens their dashboard
- **THEN** the Admin widget set renders, each loading independently from its data provider

### Requirement: HR dashboard widgets
The system SHALL render an HR dashboard with widgets for present/absent/late today, active projects, pending leave requests, pending submissions, and a quick task assignment widget that auto-notifies Global Chat on completion. (R4.7)

#### Scenario: HR sees team operations
- **WHEN** an HR user opens their dashboard
- **THEN** the HR widget set renders, each loading independently from its data provider

### Requirement: Employee dashboard widgets
The system SHALL render an Employee dashboard with widgets for active projects, pending tasks, an attendance widget with Start/Pause/End and a live timer, a recent task progress bar, and a task approval-status panel. (R4.8)

#### Scenario: employee sees personal work
- **WHEN** an Employee opens their dashboard
- **THEN** the Employee widget set renders, including the attendance widget shell with Start/Pause/End controls and a live timer

### Requirement: Quick-action shortcuts
The system SHALL provide quick-action shortcuts on each role's dashboard for the most common actions of that role. (R4.9)

#### Scenario: shortcut triggers action
- **WHEN** a user clicks a quick-action shortcut
- **THEN** the associated action opens (e.g. create task, request leave, clock in) without navigating a menu

### Requirement: Independent widget loading and error isolation
The system SHALL load each widget under its own data-fetch key and wrap each widget in its own error boundary, so that one slow or failing widget does not block, delay, or blank any other widget on the dashboard. (R13.21; R4.4)

#### Scenario: a failing widget does not block others
- **WHEN** one widget's data provider throws an error or hangs
- **THEN** the failing widget renders its own inline error and retry affordance, and every other widget on the dashboard continues to load and render independently

#### Scenario: off-screen widgets do not contend for the initial load
- **WHEN** the dashboard first renders with more widgets than are visible in the viewport
- **THEN** only widgets visible (or near-visible) in the grid fetch their data on initial mount, and off-screen widgets defer fetching until scrolled into view (R13.8)

### Requirement: Stale-while-revalidate cached render
The system SHALL render each widget's last-cached data instantly on dashboard load or revisit and refresh that data in the background, without showing a spinner for cached data. (R13.3, R13.10, R13.18)

#### Scenario: revisiting the dashboard shows cached data instantly
- **WHEN** a user navigates back to a dashboard they have loaded before
- **THEN** the widgets paint their last-cached payload within the first frame (no spinner) and update in place once the background refresh resolves

#### Scenario: skeleton only on first-ever load
- **WHEN** a widget has no cached payload yet
- **THEN** the widget shows a content-shaped skeleton (never a full-screen spinner) until its first payload arrives, after which it always renders cached data on subsequent loads

### Requirement: Smooth dashboard drag and resize
The system SHALL keep React Grid Layout drag and resize at 60 FPS with interaction-to-next-paint ≤200ms, and SHALL persist layout changes via a debounced write rather than a write per pixel. (R13.2, R13.19)

#### Scenario: drag and resize stay smooth
- **WHEN** a user drags or resizes a widget across the grid
- **THEN** the interaction animates at 60 FPS with no main-thread jank, and no network write is issued on every pixel of movement

#### Scenario: layout persists with a debounced write
- **WHEN** the user finishes moving or resizing a widget
- **THEN** a single debounced request persists the resulting layout per user, and that arrangement is restored on reload

### Requirement: Fast widget data endpoints
The system SHALL serve each widget's data endpoint with p95 latency ≤200ms at 10k rows, executing ≤5 SQL queries with zero N+1, using cursor pagination for any list-shaped payload. (R13.4, R13.5, R13.6)

#### Scenario: widget data returns within the latency and query budget
- **WHEN** a visible widget requests its data provider
- **THEN** the endpoint returns within p95 200ms, executes no more than 5 SQL queries regardless of row count, and serves any list-shaped data via cursor pagination

#### Scenario: latency stays bounded as the dataset grows
- **WHEN** the underlying data grows to tens of thousands of rows
- **THEN** widget data endpoints continue to meet the p95 200ms target and the ≤5-query budget because queries are eager-loaded, indexed, and cursor-paginated
