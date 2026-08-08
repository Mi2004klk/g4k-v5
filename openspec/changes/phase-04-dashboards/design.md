# Design — dashboards

## Widget Engine architecture
A `WidgetRegistry` maps widget ids to manifests + render components. A **manifest** is a declarative object consumed by a generic `WidgetShell`:

```
{
  id: "org.active-employees",
  title: "Active Employees",
  rolePermissions: ["super_admin"],          // capability gate
  minSize: { w: 2, h: 2 },                   // React Grid Layout units
  defaultSize: "medium",                     // small | medium | large
  dataProvider: "metric:org.active-employees",
  refresh: { intervalSec: 60, onHover: true },
  lazy: true,                                // load only when visible
  realtime: { channel: "private-metrics.org", event: "OrgMetricUpdated" },
  offline: "last-cached",                    // render last cached payload
  drillDown: "/org/employees",               // click-through target
  dismissible: true,
  settings: { ... per-widget config ... }
}
```

`WidgetShell` wraps every widget and owns the chrome (header, collapse, refresh-on-hover, dismiss, error boundary, skeleton). Widget components receive only `{ data, size, settings }`. This keeps widgets decoupled and makes the generic Metric Widget reusable (Architecture Principle 4).

## Adaptive rendering
One widget component renders three densities driven by the current grid cell size:
- **small** → a single metric (value + label).
- **medium** → metric + label + one secondary stat.
- **large** → chart (ECharts) + stats block + trend indicator + inline actions.

Density is derived from the React Grid Layout cell span, not a user toggle, so resizing in the grid automatically switches density.

## React Grid Layout integration (ADR-007)
The dashboard is a single `ReactGridLayout` (responsive, draggable, resizable, breakpoints lg/md/sm). Per ADR-007, React Grid Layout is used **only** for the dashboard; list/kanban reordering elsewhere uses dnd-kit and the two are never mixed. Drag/resize emit layout arrays `{ i: widgetId, x, y, w, h }`.

## Layout persistence
Layout is **UI state** (ADR-008): it lives in a Zustand `useDashboardLayoutStore` for snappy drag/resize, debounced, and persisted per user via the API. It is never stored in TanStack Query (that holds server/ widget data). On dashboard mount: read API → hydrate Zustand → render grid; on change: update Zustand immediately, debounce-PUT to API.

## Dashboard composition per role
Each role maps to an ordered manifest id list; the registry resolves components:
- **Admin** (R4.6): employees active/inactive, active projects, today attendance (present/absent/late), pending approvals (quick access), recent activity feed (dense), quick task assignment.
- **HR** (R4.7): present/absent/late today, active projects, pending leave requests, pending submissions, quick task assignment.
- **Employee** (R4.8): active projects, pending tasks, attendance widget (Start/Pause/End + live timer), recent task progress bar, task approval-status panel.

Quick-action shortcuts (R4.9) are a small per-role config of label+route/action rendered above the grid.

## Data providers
The generic **Metric Widget** is JSON-fed: a provider returns `{ value, label, secondary?, trend?, spark?: number[] }` and the same component renders anywhere. Module-specific widgets (attendance, projects, approvals, tasks) are **stubbed now**: a `StubDataProvider` returns seed/fixture JSON so dashboards render today; live providers plug in during Phases 5–7 by registering under the same manifest `dataProvider` key. The Quick Task Assignment widget is a UI stub whose create-task action is wired fully in Phase 7 (Global Chat auto-notify lands with Phase 8).

## Realtime widget refresh (Reverb, ADR-013)
Widgets opting into `realtime` subscribe to a Reverb channel on mount; on event they invalidate/refresh their own data provider (TanStack Query `invalidateQueries`) — independent of other widgets and of the periodic `refresh.intervalSec`. Example: `private-metrics.org` → `OrgMetricUpdated` refreshes the org metrics widgets without touching the activity feed widget.

## Offline widget mode
Each widget's last successful payload is cached (TanStack Query `cacheTime`) plus IndexedDB for persistence. When the Connectivity Monitor reports offline, widgets render the `offline: "last-cached"` payload with a subtle "cached" affordance instead of erroring. No widget writes are introduced in this phase (writes flow through the Offline Engine only when later modules add them); this is read-only offline rendering.

## Lazy loading
With `lazy: true`, a widget mounts its data provider only when scrolled into the visible grid area (IntersectionObserver). Only visible widgets load first, keeping the dashboard's initial payload small; off-screen widgets defer fetch until visible (Performance Practice: lazy load).

## Independent loading + error isolation
Each widget's data is its own TanStack Query key, so loads/failures are isolated. A React error boundary per `WidgetShell` ensures one widget throwing never blanks the dashboard; the failing widget shows an inline error + retry while others keep working. This is the implementation of R4.4.

## API (OpenAPI additions)
- `GET /dashboards/layout?role=<role>` → `{ widgets: [{id, x, y, w, h, size}], shortcuts: [{label, action}] }` (per-user layout for the active role).
- `PUT /dashboards/layout` → `{ role, widgets: [...] }` persist per user (debounced client-side).
- `GET /dashboards/widgets/<provider-id>/data` → generic JSON the data provider returns (metric or widget-specific shape); capability-gated by the manifest `rolePermissions`.
- All endpoints Sanctum-guarded + capability-checked.

## Data model (new tables)
- `dashboard_layouts`: `id`, `user_id` (fk), `role` enum(super_admin,hr,employee), `widgets` (json: layout array), `updated_at`. One row per user+role so dual-role users keep separate layouts.
No other tables this phase; widget data is sourced from stub providers now, live module tables in later phases.

## Capabilities (introduced)
- `dashboards.view` → all roles.
- `dashboards.layout.edit` → owner only (per-user layout); no cross-user writes.
- Widget visibility is additionally gated by each manifest's `rolePermissions`, enforced server-side when resolving the layout's widget list.

## Test strategy
- api feature tests: layout GET/PUT per user+role; isolation (user A cannot read/write user B's layout); capability gate denies non-authenticated; widget data endpoint serves metric JSON for allowed role, 403 for disallowed.
- web/component tests: WidgetShell renders loading→data→error→retry; adaptive density switches on size; Metric Widget renders JSON shape; dashboard grid drag/resize updates store; layout hydrates from API and persists after reload (mock); lazy widget does not fetch until visible; offline renders cached payload; error boundary isolates one failing widget.
- e2e: rearrange as Admin → reload → persists; resize widget → density changes.

## Performance Requirements (Phase 4)
These targets are verification gates (CI-enforced). All thresholds reference the central
`PERFORMANCE-STANDARDS.md` (P-*) and `REQUIREMENTS.md` R13.x. Test conditions per §0 of the
standards (throttled mid-range laptop for lab; p75 field in production builds).

- **Dashboard LCP ≤2.5s (p75 field) / ≤2.0s lab** (R13.1 / P-LCP). The **LCP element is the first
  widget card** — the role's primary metric widget. Preload that widget's data on the dashboard
  route (server component fetch + streamed fallback) so the card paints with content, not a
  spinner. Reserve the grid cell with a fixed-height skeleton to hold CLS ≤0.1 (R13.2 / P-CLS).
- **Independent widget loading + per-widget error isolation** (R13.21 / P-RESILIENT). Each widget
  fetches under its own TanStack Query key and is wrapped by its own React error boundary inside
  `WidgetShell`. One slow or failed widget never blocks the others; the failing widget renders its
  own error + retry affordance while the rest of the dashboard keeps working. **Lazy-load
  off-screen widgets via IntersectionObserver** (R13.8 / P-LAZY): only widgets in the visible grid
  area mount their data provider on initial render.
- **Stale-while-revalidate** (R13.3 / R13.10 / R13.18 / P-NAV-CACHE, P-CACHE-API, P-SKELETON).
  Widgets render last-cached data instantly and refresh in the background — **no spinner is shown
  for cached data**. A skeleton appears only on the first-ever load (no cached payload). Dashboard
  data `staleTime: 30s`, `gcTime: 5m` (PERFORMANCE-STANDARDS §11). Revisiting the dashboard route
  shows a cached first frame ≤100ms.
- **Realtime widget updates must not cause render storms** (R13.12 / P-RERENDER). Widget
  components are memoized (`React.memo` + stable props) and subscribe only to their own Reverb
  channel; an event invalidates that widget's query alone, not the whole grid. Re-renders are
  throttled/coalesced (React 18 transitions) so a burst of `OrgMetricUpdated` events refreshes a
  widget once per frame, not once per event. No widget re-renders siblings on a realtime tick.
- **React Grid Layout drag/resize at 60 FPS** (R13.2 / P-INP). Drag and resize operate on the
  Zustand layout store with `requestAnimationFrame`-batched updates; no per-pixel network writes.
  **Layout persistence is debounced** (e.g. 800ms trailing), not per-pixel — a single `PUT
  /dashboards/layout` after the user stops moving. INP ≤200ms during drag.
- **Heavy widgets (ECharts) dynamically imported + lazy** (R13.8 / R13.17 / P-LAZY, P-ASYNC-FS).
  The chart bundle (large density widgets) loads on demand via dynamic import, not in the initial
  route chunk. Any client-side data aggregation for a widget runs in a web worker or is moved
  server-side; no blocking main-thread task >50ms.
- **Widget data endpoints are fast and bounded** (R13.4 / R13.5 / R13.6 / P-API-P95, P-NO-N1,
  P-Q-COUNT, P-CURSOR). `GET /dashboards/widgets/<provider-id>/data` p95 **≤200ms** at 10k rows,
  executes **≤5 SQL queries** (no N+1), uses **cursor pagination** for any list-shaped provider,
  and every filtered/joined/ordered column is indexed. Eager-load relations; `DB::enableQueryLog()`
  query-count test per provider.
- **Optimistic UI for safe mutations** (R13.19 / P-OPTIMISTIC). Dismiss widget, rearrange/resize
  (layout PUT), and collapse/expand apply optimistically to the Zustand store and roll back with a
  danger toast if the server rejects. Non-idempotent actions (e.g. quick task assignment) wait for
  server confirmation.
- **Memory hygiene** (R13.26 / P-MEM). On widget unmount: unsubscribe its Reverb channel, cancel
  in-flight queries, and revoke any object URLs. Across a 20-screen navigation, no retained
  detached nodes; client cache bounded by `gcTime` + size caps.
- **Frequent workflows (click/latency budgets)** (R13.24 / P-DATAENTRY):
  - **Glance dashboard** — instant from cache on revisit (≤100ms cached first frame, no reload).
  - **Rearrange widget** — drag (60 FPS) → drops into place → persists (debounced PUT) across reload; ≤ the drag itself, no extra clicks.
  - **Quick task assign** — ≤2 clicks from the dashboard (open Quick Task Assignment widget → submit); optimistic confirmation, no full reload.
- **Verification**: widget-data endpoint benchmark test (p95 + query count); React Profiler
  render-count test confirming a realtime tick re-renders only the target widget; Playwright
  drag/resize FPS + debounced-persistence test; cached-render test (no spinner on revisit); Lighthouse
  CI on the dashboard route (LCP/CLS/INP). (R13.29 / P-REGRESS.)

## Component mapping (Phase 4 — composes only from openspec/COMPONENT-SYSTEM.md)

This phase's screens compose exclusively from the FROZEN catalog; no new primitives are introduced
(§10).

- **Dashboard grid** = `ReactGridLayout` (ADR-007 — used only for the dashboard, never mixed with
  dnd-kit). Each widget is a generic **`MetricWidget`** (JSON-fed `{ value, label, secondary?,
  trend?, spark? }`) rendered inside a **`WidgetShell`** that owns the chrome: a `Card` (§3) with a
  header (title), refresh `IconButton` (refresh-on-hover + interval), collapse toggle
  (`Collapsible`, §2), dismiss `IconButton`, and drag/resize handles provided by React Grid Layout.
  Widget components receive only `{ data, size, settings }`.
- **Per-widget error isolation** = each `WidgetShell` wraps its widget in its own React error
  boundary (R4.4 / R13.21): a failing widget shows an inline error + retry `Button` while the rest
  of the dashboard keeps working.
- **Lazy loading** = `lazy: true` widgets mount their data provider only when scrolled into the
  visible grid area via `IntersectionObserver` (R13.8); off-screen widgets defer fetch.
- **Per-role widget composition** = each role maps to an ordered manifest id list (Admin / HR /
  Employee per DESIGN-SYSTEM §13 and R4.6–R4.8); the `WidgetRegistry` resolves components. Widget
  visibility is additionally gated by each manifest's `rolePermissions` (server-enforced).
- **Adaptive density** = the `MetricWidget` renders small (single metric) / medium (metric +
  secondary stat) / large (ECharts `Chart` §8 + stats + trend + inline actions) driven by the grid
  cell span. The large-density `Chart` (ECharts) is dynamically imported on demand (R13.8/17).
- **Quick Task Assignment widget** = a `Button` opening a `Dialog` (§2) containing a `TaskForm`
  stub; the create-task action is wired fully in Phase 7. It is non-idempotent, so it waits for
  server confirmation (not optimistic).
- **Loading / empty** = per-widget `Skeleton` (§3) on the first-ever load only (no cached payload);
  `EmptyState` (§3, R3.13) when a widget has no data. Revisits render last-cached data instantly
  with no spinner (stale-while-revalidate).
- **Optimistic safe mutations** = dismiss widget, rearrange/resize (debounced `PUT
  /dashboards/layout`), and collapse/expand apply optimistically to the Zustand layout store and
  roll back with a danger `Toast` (§6) on server rejection (R13.19).

Module-specific widgets (attendance, projects, approvals, tasks) are stubbed now via a
`StubDataProvider` and resolve to live providers in Phases 5–7 under the same manifest
`dataProvider` keys — the generic `WidgetShell` / `MetricWidget` chassis is unchanged.

## New ADRs
None. Respects ADR-007 (grid vs dnd-kit split), ADR-008 (Query vs Zustand), ADR-013 (Reverb). No stable contract changes.
