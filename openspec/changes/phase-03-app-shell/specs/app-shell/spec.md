## Purpose
Establish the signed-in application shell, the shared design system (tokens, themes), and the reusable component/form/filter library that every later phase renders inside and builds upon.

## ADDED Requirements

### Requirement: Design tokens
The system SHALL define design tokens in code for color, spacing, typography, elevation, and motion, deriving the brand palette (vibrant purple `#9d00ff` → magenta gradient, gold `#ffd700` accents) from the logo. (R3.1)

#### Scenario: tokens are consumed by all UI
- **WHEN** any component in `apps/web` or `packages/ui` needs a color, spacing step, type scale, elevation, or motion duration
- **THEN** it reads the centralized token value rather than a hard-coded literal

#### Scenario: brand palette is applied as accents
- **WHEN** the shell renders headers, active nav, and primary affordances
- **THEN** brand purple/magenta gradients and gold accents appear, while semantic data colors remain disciplined and separate

### Requirement: Theme engine (light + dark, density)
The system SHALL provide a theme engine supporting light and dark modes (both colorful), persisted per user, plus a density control. (R3.2)

#### Scenario: user switches theme and it persists
- **WHEN** a user selects light or dark mode and a density
- **THEN** the preference is saved to their profile and reapplied on every subsequent sign-in and across devices

#### Scenario: dark mode stays colorful
- **WHEN** dark mode is active
- **THEN** brand gradients and semantic status colors remain vivid, not washed out

### Requirement: App shell navigation (top bar, role-aware sidebar, mobile nav)
The system SHALL render a top bar (search stub, bell, profile) and a role-aware sidebar whose tree matches the active role (Admin/HR/Employee per spec §9), and on mobile a bottom nav of at most 5 icons plus a hamburger full-screen menu. (R3.3)

#### Scenario: sidebar reflects the active role
- **WHEN** a user with a given active role opens the shell
- **THEN** the sidebar shows only the navigation tree for that role, gated by their capabilities

#### Scenario: mobile navigation fits the bottom-nav budget
- **WHEN** the viewport is mobile-sized
- **THEN** at most 5 primary destinations appear in the bottom nav and the rest are reachable via the hamburger full-screen menu

### Requirement: Breadcrumbs
The system SHALL show breadcrumbs on detail screens, with each crumb clickable. (R3.4)

#### Scenario: navigating up via breadcrumbs
- **WHEN** a user clicks a non-final crumb on a detail screen
- **THEN** they navigate to that parent route

### Requirement: Pinned items
The system SHALL let users star/pin projects, tasks, and profiles into a Pinned section at the bottom of the sidebar, and remove them from there. (R3.5)

#### Scenario: pin and unpin an item
- **WHEN** a user pins an item from its screen
- **THEN** it appears in the sidebar Pinned section, and removing it there or un-pinning on the screen removes it everywhere

### Requirement: Component library
The system SHALL provide a `packages/ui` component library containing button, card, table (TanStack-backed), badge, dialog, drawer, tooltip, toast, skeleton, empty-state, command-palette, and shortcut-overlay. (R3.6)

#### Scenario: shared components are reused
- **WHEN** a feature screen needs a button, card, table, badge, dialog, drawer, tooltip, toast, skeleton, empty state, or the command palette
- **THEN** it imports the shared component from `@g4k/ui` instead of building a new one

### Requirement: Form system
The system SHALL provide a form system with required-field markers, on-pause validation, inline errors, submit loading state, a success toast (bottom-right), sectioned long forms, and Save-as-Draft with 30s autosave plus a restore banner. (R3.7)

#### Scenario: validation runs on pause, not on every keystroke
- **WHEN** a user fills a field and pauses
- **THEN** validation runs for that field and inline errors appear, without blocking typing

#### Scenario: draft autosaves and restores
- **WHEN** a user leaves a form mid-edit and returns later (or reconnects after a drop)
- **THEN** the 30s autosave restores their draft and shows a restore banner offering to keep or discard it

### Requirement: Filter and sort bar
The system SHALL provide a reusable filter/sort bar with search, status, date range, dept/team, priority, sort field + direction, a clear-all action, and removable filter chips — reusable across all lists. (R3.8)

#### Scenario: filters apply as removable chips
- **WHEN** a user applies one or more filters
- **THEN** each active filter renders as a chip that can be removed individually, and clear-all resets every filter at once

### Requirement: Confirmation dialogs, tooltips, inline editing
The system SHALL provide confirmation dialogs (destructive actions styled red), hover states and tooltips on icon buttons, and inline editing invoked by a pencil and committed with Enter / canceled with Escape. (R3.9)

#### Scenario: destructive action requires confirmation
- **WHEN** a user triggers a destructive action
- **THEN** a red-styled confirmation dialog appears and the action only proceeds on explicit confirm

#### Scenario: inline edit commit and cancel
- **WHEN** a user opens inline edit on a value
- **THEN** Enter commits the change and Escape discards it without saving

### Requirement: Drag-and-drop reorder, status badges, pagination
The system SHALL support drag-and-drop list reordering via dnd-kit, consistent status badges (Gray/Blue/Amber/Green/Red), and pagination defaulting to 20 rows per page with 50/100 options. (R3.10)

#### Scenario: reorder a list by dragging
- **WHEN** a user drags a list row to a new position
- **THEN** the order updates via dnd-kit and persists

#### Scenario: pagination size options
- **WHEN** a user changes page size
- **THEN** the list paginates at 20 (default), 50, or 100 rows

### Requirement: Keyboard shortcuts
The system SHALL support keyboard shortcuts: Ctrl+K opens the command palette, Ctrl+N performs the context's "new" action, Ctrl+/ opens a help/shortcut overlay, Esc closes overlays, and Enter submits/confirms. (R3.11)

#### Scenario: open command palette
- **WHEN** a user presses Ctrl+K
- **THEN** the command palette opens

#### Scenario: context new and help overlay
- **WHEN** a user presses Ctrl+N or Ctrl+/
- **THEN** the context new action triggers or the shortcut help overlay appears, respectively

### Requirement: Toasts
The system SHALL show toasts in the top-right that auto-dismiss after 4 seconds with a manual close (X), colored green/red/amber/blue by type. (R3.12)

#### Scenario: toast auto-dismisses or is closed
- **WHEN** a toast appears
- **THEN** it dismisses after 4 seconds unless the user closes it manually first with the X

### Requirement: Empty states
The system SHALL render empty states with an illustration (the animated logo mp4 where relevant), optional action button, and context-specific copy. (R3.13)

#### Scenario: empty list shows guidance
- **WHEN** a list or surface has no items
- **THEN** an illustrated empty state with context-specific copy and, where useful, a primary action is shown

### Requirement: Skeleton loaders and loading affordances
The system SHALL provide skeleton loaders, a button loading dot-state, and progress bars that animate from 0 to their value. (R3.14)

#### Scenario: button shows loading dot-state
- **WHEN** a button's action is in flight
- **THEN** the button shows the loading dot-state and is non-interactive until it resolves

#### Scenario: progress bar animates
- **WHEN** a progress value changes
- **THEN** the progress bar animates from its previous value to the new value

### Requirement: PWA, service worker, and offline banner
The system SHALL ship responsive layouts with a PWA manifest and a service worker, and display an offline banner when connectivity drops. (R3.15)

#### Scenario: installable PWA
- **WHEN** a user opens the deployed web app
- **THEN** the manifest and service worker make it installable and functional offline against cached data

#### Scenario: offline banner appears on disconnect
- **WHEN** connectivity is lost
- **THEN** an offline banner is shown and forms queue for submission on reconnect

### Requirement: Loading states prefer skeletons over spinners
The system SHALL prefer skeletons, partial, and cached content over spinners for loading states. (R3.16)

#### Scenario: cached or partial data is shown while refreshing
- **WHEN** data is loading and a previous version is available
- **THEN** the cached/partial content stays visible with a skeleton placeholder rather than a full-screen spinner

### Requirement: Fast app-shell load (LCP, CLS, INP)
The signed-in app shell SHALL meet Core Web Vitals targets in production builds: LCP ≤ 2.5s (p75 field, ≤ 2.0s lab), CLS ≤ 0.1, and INP ≤ 200ms (p75). Reserved dimensions (sidebar width before hydration, fixed-height skeletons, aspect-ratio avatars) SHALL prevent any layout shift. (R13.1, R13.2)

#### Scenario: shell paints within LCP budget
- **WHEN** a signed-in user opens a shell route on a throttled mid-range profile (Fast 3G, 4× slowdown)
- **THEN** the Largest Contentful Paint of the shell renders ≤ 2.0s lab and the Lighthouse CLS audit reports ≤ 0.1

#### Scenario: no layout shift on hydration
- **WHEN** the shell hydrates after server-render
- **THEN** the sidebar width, skeleton heights, and avatar boxes are already reserved in CSS so no visible content shift occurs (CLS ≤ 0.1)

#### Scenario: shell interactions meet INP budget
- **WHEN** a user collapses the sidebar, toggles the theme, or opens the command palette
- **THEN** the interaction-to-next-paint is ≤ 200ms

### Requirement: Lazy-loaded routes and bundle budget
The system SHALL lazy-load every in-app route and keep First-Load JS ≤ 200KB gzipped per route (route chunk ≤ 350KB gz). Heavy components (rich-text editor, charts, command-palette index) SHALL be dynamically imported and idle-prefetched. (R13.7, R13.8)

#### Scenario: routes are code-split
- **WHEN** the production build is analyzed with the bundle analyzer
- **THEN** every in-app route is its own dynamic chunk and First-Load JS for each route is ≤ 200KB gzipped

#### Scenario: heavy components load on demand
- **WHEN** a heavy component (Tiptap editor, ECharts, command-palette index) is first needed
- **THEN** it is dynamically imported rather than present in the main chunk, and prefetched on idle when likely to be needed

### Requirement: Virtualized shared DataTable
The shared `Table` component SHALL virtualize lists exceeding 100 rows so DOM nodes are capped to the visible rows plus overscan, sustaining 60 FPS at 5000 rows, and SHALL memoize rows with stable keys to prevent unnecessary re-renders. (R13.12, R13.14)

#### Scenario: large list renders without DOM bloat
- **WHEN** a list of 5000 rows is rendered through the shared DataTable
- **THEN** the rendered DOM node count stays at visible + overscan (not 5000) and scrolling holds 60 FPS

#### Scenario: rows do not re-render unnecessarily
- **WHEN** a render-count test runs against a 1000-row table during a parent state change
- **THEN** memoized rows with stable keys do not re-render (no render storm)

### Requirement: Responsive, keyboard-accessible interaction
The shell SHALL be fluid from 360px to 1920px, keep all actions keyboard-reachable with visible focus, and make common repeated actions reachable in at most 2 clicks or a single keystroke with optimistic confirmation and no full reloads. Keyboard shortcuts SHALL resolve instantly without network calls. (R13.22, R13.23, R13.24)

#### Scenario: common actions are within budget
- **WHEN** a user opens the command palette, toggles the theme, or pins an item
- **THEN** each is reachable in 1 keystroke or 1 click with no full page reload

#### Scenario: keyboard shortcuts are instant
- **WHEN** a user presses Ctrl+K, Ctrl+N, Ctrl+/, Esc, or Enter
- **THEN** the corresponding action fires client-side in one frame without a network round-trip

#### Scenario: accessibility audit is clean
- **WHEN** axe-core runs against the shell routes in CI
- **THEN** zero critical or serious WCAG 2.1 AA violations are reported

### Requirement: Instant command palette
The command palette (Ctrl+K) SHALL provide instant client-side fuzzy search over registered commands with results painting in under 50ms after a keystroke; if indexing becomes heavy it SHALL move to a web worker so no main-thread task exceeds 50ms. (R13.17)

#### Scenario: palette search is sub-50ms
- **WHEN** a user types a query into the command palette
- **THEN** matching commands paint within 50ms of the keystroke with no main-thread jank

#### Scenario: large index does not block the UI
- **WHEN** the palette indexable set grows large in a later phase
- **THEN** indexing runs in a web worker so the main thread never blocks for more than 50ms

### Requirement: Frozen component system implementation
The system SHALL implement the full Radix UI + shadcn/ui component catalog defined in `openspec/COMPONENT-SYSTEM.md` as owned, copied-in components in `packages/ui`, and every later phase SHALL compose only from this catalog (no ad-hoc UI). (R3.6)

#### Scenario: every primitive ships with its variants and states
- **WHEN** Phase 3 builds the component library
- **THEN** each component exposes the variants/states/sizes specified in COMPONENT-SYSTEM.md (e.g. Button: primary/secondary/outline/ghost/destructive/success × sm/md/lg/icon; rest/hover/focus-visible/active/disabled/loading)

#### Scenario: states are accessible and keyboard-operable
- **WHEN** a user interacts with any component via keyboard
- **THEN** focus-visible rings show, Escape closes overlays, Enter submits/confirms, arrows navigate menus/tabs/lists, and axe-core reports zero critical/serious violations (R13.23)

#### Scenario: components are responsive across breakpoints
- **WHEN** a component renders at 360/768/1024/1440px
- **THEN** it adapts per COMPONENT-SYSTEM.md (e.g. Dialog full-screen on mobile, DataTable → cards, Sheet for mobile filters) and visual regression passes at all four widths (R13.22)

#### Scenario: components enforce the no-spinner/no-mock rules
- **WHEN** a component has no data or is loading
- **THEN** it renders its Skeleton (shaped to content) on first load and its EmptyState (real copy + illustration + optional action) when empty — never a full-screen spinner, never mock data (R13.18, config HARD RULES)

### Requirement: Reusable master DataTable and FilterBar
The system SHALL ship a generic, virtualized, cursor-paginated `DataTable` and a shared `FilterBar` in `packages/ui` that every list page in later phases composes, rather than building per-module tables/filters. (R2.9, R3.8, R13.13)

#### Scenario: a list page reuses the generics
- **WHEN** Phase 2/5/7/etc. builds an employee/attendance/task list
- **THEN** it composes `DataTable` + `FilterBar` from `packages/ui` and adds no duplicate table/filter logic
