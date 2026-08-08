# Design — app-shell

## Design tokens
Defined once in `packages/ui` (Tailwind v4 CSS variables + TS constants), consumed by `apps/web` and the future Tauri client. Single source of truth (project §10/§22); no external Figma.

- **Color**
  - Brand: `--brand-purple #9d00ff` → `--brand-magenta` gradient stops; `--gold-accent #ffd700`.
  - Surfaces (light + dark): `bg`, `surface`, `surface-elevated`, `border`, `muted`, `foreground`, `foreground-muted`.
  - Semantic status (identical in both themes): Gray=Not Started · Blue=In Progress · Amber=Pending · Green=Approved/Completed · Red=Redo/Rejected/Overdue. These drive `StatusBadge` and charts.
  - Action colors: primary (brand), success (green), warning (amber), danger (red for destructive).
- **Spacing**: 4px base scale (`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48`).
- **Typography**: type scale tokens (`xs…3xl`), weights 400/500/600/700; English only (M1).
- **Elevation**: shadow tokens `sm / md / lg / xl` mapped to drawer/dialog/toast.
- **Motion**: durations/easing defined once (project §10): taps 100–150ms · panels 180–250ms · dialogs 250–350ms; standard easings `ease-out`, `ease-in-out`. Consumed by Motion (Framer Motion).

## Theme engine
- Mode + density held in Zustand (`themeStore`), persisted to `localStorage` and to the user profile (`users.theme_mode`, `users.density` added this phase) so it roams across devices. Per ADR-008, theme is UI state → Zustand (never TanStack Query).
- Both light and dark are **colorful**: brand gradients and semantic colors stay vivid in dark; only surfaces invert. Density (`compact | comfortable`) tightens spacing/row heights globally.
- Apply via `data-theme` + `data-density` on `<html>`; Tailwind v4 reads the CSS variables. SSR-safe (a small inline script sets the attribute before paint to avoid flash).

## Component library (`packages/ui`, shadcn-owned)
**Authoritative catalog: `openspec/COMPONENT-SYSTEM.md` (FROZEN).** This section lists what Phase 3
ships; later phases compose ONLY from this catalog. All copied-in (Radix + shadcn base), extended
to our tokens, exported from `@g4k/ui`. Each ships all variants/states/sizes/keyboard/responsive
rules per COMPONENT-SYSTEM.md §0–§6.

| Component | Notes |
|---|---|
| `Button` | variants (primary brand, secondary, outline, ghost, destructive, success), loading dot-state, sizes sm/md/lg/icon. |
| `Card` | header/body/footer slots; gradient header option for dashboards. |
| `Input` / `Textarea` / `PasswordInput` | error variant + helper text; PasswordInput show/hide IconButton (R1.2). |
| `Form` suite (RHF + Zod) | FormField/FormItem/FormControl/FormMessage; required `*`; sectioned; `useFormDraft` (IndexedDB autosave 30s + restore banner — R3.7). |
| `Select` | single-choice; native on mobile; arrows + type-ahead. |
| `Checkbox` / `Switch` / `RadioGroup` / `Slider` | Checkbox supports indeterminate (select-all); Slider = task progress. |
| `DatePicker` / `DateRangePicker` | Popover + calendar; native on mobile; range validation. |
| `FileUpload` (popup) | Radix Dialog; format/size limits; preview; optimistic — NOT general upload (R11.3). |
| `Dialog` / `AlertDialog` | AlertDialog = destructive confirm (red, R3.9); focus trap; full-screen on mobile. |
| `Sheet` | detail panels, mobile nav, mobile filters; right/left/top/bottom; 200ms slide. |
| `Popover` | date pickers, inline filters, mention dropdown, avatar menu. |
| `Tooltip` | every icon-only button + truncated text; 150ms show; not on touch. |
| `DropdownMenu` / `ContextMenu` | row actions, "more" menus, right-click bulk actions (R11.8); keyboard nav. |
| `Tabs` | project detail/settings/view-toggle; arrows; lazy-mount content (R13.8). |
| `Collapsible` / `Accordion` | advanced options (recurring), filter sections, activity grouping. |
| `ScrollArea` | sidebar, chat list; themed thin scrollbar. |
| `DataTable` (generic) | TanStack Table + react-virtual; sort/column-visibility/saved-views/custom-columns/pinning/cursor-pagination/row-selection/inline-edit/virtualized >100 rows/memoized (R13.12/14). The reusable master-data table (R2.9). |
| `Combobox` / `Autocomplete` | Popover + Command; searchable selects >8 items; @mention; debounced 250ms (R13.15). |
| `Badge` / `StatusBadge` | semantic Gray/Blue/Amber/Green/Red (R11.4); dot+label variant. |
| `Avatar` / `AvatarGroup` | fallback initials; aspect-ratio reserved (R13.2). |
| `Progress` | animate 0→value on mount (600ms); success/warning colors. |
| `Separator` / `Skeleton` / `EmptyState` | EmptyState = real copy + illustration/animated logo + optional action (R3.13). |
| `Toast` (Sonner) | top-right stack, 4s auto-dismiss + manual X + action (Retry), green/red/amber/blue (R3.12). |
| `FilterBar` (shared) | search Input (debounced) + FilterPopovers + DatePicker range + Comboboxes + sort Select + direction + ClearAll + removable FilterChips (R3.8); mobile → Sheet. |
| `Pagination` | page numbers; 20 default, 50/100 dropdown; cursor-based (R13.6). |
| `CommandPalette` | `cmdk`/Command + Dialog, Ctrl+K; instant fuzzy (<50ms, web worker if heavy — R13.17). |
| `ShortcutOverlay` | Ctrl+/ help; lists every shortcut. |
| `Breadcrumb` | below top bar on detail screens; clickable crumbs (R3.4). |
| `AppShell`, `TopBar`, `Sidebar`, `NavItem`/`NavGroup`, `BottomNav`, `PinnedItems` | per DESIGN-SYSTEM §9 + COMPONENT-SYSTEM §4. |
| `NotificationsBell`, `AnnouncementCard`, `OfflineBanner` | shells wired in Phase 8 (bell/announcement) + now (offline banner). |
| `TiptapEditor` / `Chart` | lazy-loaded (R13.8); wrappers in packages/ui; token-mapped themes. |

**Composition rule:** module composites (ClockInWidget, TaskKanbanBoard, DirectoryCard, etc. —
COMPONENT-SYSTEM §7) live in `apps/web` and compose the generics above; never duplicate generic
logic (ADR-reusable-first). A new primitive may be added ONLY if no catalog component fits, and
requires updating COMPONENT-SYSTEM.md.

## App shell architecture
- **Top bar**: app/section title (or search stub on the left), spacer, notification bell slot (content in Phase 8), profile menu (theme toggle, density, sign-out, device sessions link from Phase 1).
- **Sidebar** (desktop ≥ lg): role-aware tree per spec §9, each entry capability-gated by the active role (Phase 2 supplies role → capability list):
  - **Admin (Super Admin)**: Dashboard, Users & Roles, Departments, Attendance (company-wide), Leave Approvals (HR requests), Projects & Tasks, Chat & Notifications, Reports, System Settings, Audit.
  - **HR**: Dashboard, Employees/Directory, Attendance (team), Leave Approvals (employee requests), Projects & Tasks, Chat & Notifications, Reports (limited).
  - **Employee**: Dashboard, My Tasks, Attendance (self), Leave, Profile, Chat & Notifications.
  - **Pinned section** docked at the sidebar bottom (see below).
- **Mobile** (< lg): bottom nav ≤ 5 icons (Dashboard + role-tuned 4 most-used), hamburger opens a full-screen menu with the rest + pinned. Fixed bottom input pattern reserved for chat (Phase 8).
- **Breadcrumbs**: derived from the route tree; rendered on detail screens; each crumb links to its parent route.
- Shell UI state (sidebar collapsed, mobile menu open, active section) lives in a Zustand `shellStore` (ADR-008).

## Pinned items engine
- `pin` target = `{ type: 'project'|'task'|'profile', id, label, href, icon }`. Pin/unpin via a star control on the item's screen; persisted through the Offline Engine to `POST /pins` (and removed with `DELETE /pins/{id}`).
- Rendered in the sidebar Pinned section with per-item remove; same list everywhere via TanStack Query cache keyed by `['pins']`. Offline pins queue and sync on reconnect.

## Form system
- **Stack**: React Hook Form + Zod (project §3). One `<Form>` wrapper + field primitives in `packages/ui` wired to our tokens.
- **Validation**: `mode: 'onBlur'` (on-pause) per field, `reValidateMode: 'onChange'` after first error; inline error text under each field; required markers (`*`) on mandatory fields.
- **Submit**: button enters loading dot-state; on success a green toast fires bottom-right.
- **Sectioned long forms**: `FormSection` (collapsible) for grouped fields.
- **Save-as-Draft + autosave**: draft snapshot to IndexedDB every 30s via the Offline Engine's storage layer; on form mount, if a draft newer than the server record exists, show a restore banner ("Restore unsaved draft?" → keep / discard). Submit clears the draft.

## Filter/sort bar (reusable)
- `<FilterSortBar>` in `packages/ui`, composed of: search input (debounced 200ms), status multi-select, date range, dept/team select (Phase 2 data), priority select, sort field + direction, clear-all, and active-filter chip row (each chip removable).
- State shape `{ q, status[], dateRange, dept, team, priority, sort: {field, dir} }` held in a per-list Zustand slice / TanStack Query filter; chips derive from the state. Reused by Phase 2 tables, attendance, projects/tasks, leave, reports.

## Drag-and-drop reorder
- **dnd-kit** (project §3, ADR-007): list reorder via `SortableContext` + `useSortable`; board/kanban via `DndContext` with multiple droppable columns. Persisted through the Offline Engine. **Never mixed with React Grid Layout** (ADR-007) — that is dashboard-only (Phase 4).

## PWA, service worker, offline banner
- **Manifest**: `apps/web/public/manifest.webmanifest` (name, short_name, icons incl. cartoon king/crown, theme_color `#9d00ff`, display `standalone`).
- **Service worker**: Next.js-friendly SW (workbox or next-pwa) precaching the app shell + caching API GETs (stale-while-revalidate) so cached content loads offline. IndexedDB cache (Phase 0 Offline Engine interface) is the data layer.
- **Offline banner**: a `useConnectivity()` hook (connectivity monitor from the Offline Engine) drives a top banner ("You're offline…"); forms and writes queue via the Offline Engine and replay on reconnect (R11.6).

## State management summary (ADR-008)
- TanStack Query: pins list, profile/theme sync, any server reads.
- Zustand: `themeStore`, `shellStore`, `toastStore`, `dialogStore`, per-list `filterStore`, form draft flags.
- IndexedDB (Offline Engine storage): form drafts, queued writes, cached reads.

## API (OpenAPI additions)
- `GET /pins` → user's pinned items.
- `POST /pins` → `{ type, id }` adds a pin.
- `DELETE /pins/{id}` → removes a pin.
- `PUT /me/preferences` → `{ theme_mode, density, ... }` (roams theme + density; extends the profile preferences surface).
- All guarded by Sanctum + capability gates (capabilities from Phase 2).

## Data model (new columns/tables)
- `users.theme_mode` enum(light,dark) default light; `users.density` enum(compact,comfortable) default comfortable.
- `pins`: `id`, `user_id`, `type` enum(project,task,profile), `target_id`, `label`, `href`, `icon`, `created_at`; unique(`user_id`,`type`,`target_id`).

## Capabilities (introduced)
- `pins.manage` (own pins) — all roles.
- `preferences.update` (own) — all roles.
- No nav is hard-coded; the sidebar reads the active role's capability set (Phase 2) and renders entries the role can access.

## Test strategy
- **ui-pkg tests**: tokens resolve; theme toggle persists + rehydrates; Button loading dot-state; StatusBadge color mapping; Toast auto-dismiss/manual close; ConfirmDialog destructive styling; FilterSortBar chips add/remove/clear-all; CommandPalette Ctrl+K open; inline edit Enter/Escape; skeleton/empty-state render; progress bar animates 0→value; dnd-kit reorder callback fires.
- **web tests**: shell renders the correct role tree for an Admin/HR/Employee role; capability-gated entries hidden; mobile bottom-nav ≤5 + hamburger menu; breadcrumb click navigates; pin/unpin reflects in sidebar; form on-pause validation + restore-banner flow; offline banner on disconnect; service worker registered; manifest served.
- **api tests**: pins CRUD authz; preferences update persists; capability gate denies unauthorized.

## Performance Requirements (Phase 3)
The shell is the surface every signed-in screen renders inside, so its performance budget is the floor for the whole product. These targets are CI-enforced (a regression fails the build) and cite `PERFORMANCE-STANDARDS.md` P-* IDs and `REQUIREMENTS.md` R13.x.

### Shell load (LCP / INP / CLS)
- **App shell LCP** ≤ 2.5s p75 field / ≤ 2.0s lab (Fast 3G, 4× slowdown); the LCP element is the first sidebar/hero content. (R13.1 / P-LCP)
- **App shell INP** ≤ 200ms p75 field on shell interactions (sidebar expand/collapse, theme toggle, palette open). (R13.2 / P-INP)
- **App shell CLS** ≤ 0.1. **Layout stability is reserved before hydration**: the sidebar width is reserved via CSS (not painted after JS), skeletons are fixed-height, and avatars/images use `aspect-ratio` boxes so no content jumps. (R13.2 / P-CLS)

### Route-based lazy loading & bundle budget
- **Every in-app route is lazy-loaded** (dynamic `import()` per route module); the shell skeleton + tokens ship in the initial chunk only. (R13.8 / P-LAZY)
- **Heavy components are dynamically imported and idle-prefetched**: Tiptap editor, ECharts, dnd-kit, Gantt/calendar, and the command-palette index load on first use and prefetch on `requestIdleCallback` when likely needed. Bundle analyzer shows them outside the main chunk. (R13.8 / P-LAZY)
- **First-Load JS ≤ 200KB gz per route**; route chunk ≤ 350KB gz. Enforced in CI via `@next/bundle-analyzer` budget; a breach fails the build. (R13.7 / P-BUNDLE)

### State management efficiency
- **Theme + shell state live in Zustand with slice selectors** (`themeStore`, `shellStore`, `toastStore`, `dialogStore`, per-list `filterStore`) — no whole-store subscriptions, no API/server data in Zustand (ADR-008). (R13.11 / P-STATE)
- **Theme switch does not remount the tree**: toggling light/dark/density mutates only `data-theme`/`data-density` on `<html>`; no route or component remounts, so the switch is visually instant. (R13.11)

### Command palette (Ctrl+K)
- **Instant client-side fuzzy search** over the stub command list: search results paint in < 50ms after keystroke. Full global search is deferred (R11.2); the palette indexes only registered commands + pinned/recent items now. (R13.17 / P-ASYNC-FS)
- If the indexable set grows large in a later phase, indexing moves to a **web worker** so the main thread never blocks > 50ms. (R13.17)

### Virtualized DataTable
- The shared `Table` wrapper (TanStack Table) bakes in **virtualization for lists > 100 rows** (`@tanstack/react-virtual`): DOM nodes capped to visible + overscan, 60 FPS at 5000 rows. (R13.14 / P-VIRTUAL)
- **Rows are memoized** (`React.memo` + stable keys); no anonymous callbacks/objects passed as props to hot rows; TanStack Table `select` for derived data. Verified by a render-count test on a 1000-row table. (R13.12 / P-RERENDER)

### Form system responsiveness
- **Inputs respond in ≤ 16ms** (no layout thrash, no per-keystroke heavy work). (R13.16 / P-FORM)
- **Validation runs on a 400ms pause** (`mode: 'onBlur'`), not per keystroke. (R13.16)
- **Submit button shows the dot-loader and is disabled** until the mutation resolves — no double submit. (R13.16)
- **30s autosave is non-blocking**: drafts snapshot to IndexedDB in a chunked/deferred task that never blocks typing. (R13.16)

### Loading, skeleton & resilience
- **Skeletons over spinners everywhere**: no full-screen spinner where a skeleton is possible; skeletons match real content shape; cached/partial content stays visible while refreshing. (R13.18 / P-SKELETON)
- **Per-widget and per-section error boundaries**: a failed shell section (sidebar block, toast host, palette) or later widget MUST NOT take down the page; form submit errors preserve entered data with a retry path. (R13.21 / P-RESILIENT)

### Keyboard, responsive & accessibility
- **Keyboard shortcuts are instant and never hit the network**: Ctrl+K/N//Esc/Enter resolve in one frame client-side. (R13.23 / P-A11Y)
- **Responsive 360px → 1920px**: fluid layouts, tables → cards on mobile, bottom nav ≤ 5, touch targets ≥ 48px. Visual regression at 360/768/1024/1440 in CI. (R13.22 / P-RESP)
- **axe-core clean** in CI: zero critical/serious WCAG 2.1 AA violations on shell routes. (R13.23 / P-A11Y)

### Asset optimization
- **Fonts**: self-hosted, subset (latin + needed glyphs), `font-display: swap`, preloaded; max 2 families. Lighthouse font audit green. (R13.9 / P-FONT)
- **Logo/brand images via `next/image`** (WebP/AVIF, responsive srcset, lazy, blur placeholder); the landscape sign-in logo and any shell brand mark are pre-optimized. CI checks no un-`next/image` `<img>`. (R13.9 / P-IMG)

### Frequent workflows (click/keystroke budgets)
Per R13.24 (P-DATAENTRY), common repeated actions reachable with minimal friction and no full reload:
- **Open command palette** — 1 keystroke (Ctrl+K), instant.
- **Toggle theme** — 1 click (profile menu → theme toggle), no remount.
- **Pin / unpin an item** — 1 click on hover (star control), optimistic.
- **Navigate to a cached route** — 1 click, ≤ 100ms to first painted frame (stale-while-revalidate, no spinner). (R13.3 / P-NAV)

### Verification
Lighthouse CI runs on the shell routes (dashboard shell, a sample list, a sample form) in PRs; budgets enforced: LCP/INP/CLS, First-Load JS, font/image audits, axe-core. Breaches tracked in TRACKER with owner + plan. (R13.29 / P-REGRESS)

## New ADRs
None. Reuses ADR-007 (dnd-kit for lists/boards, React Grid Layout dashboard-only, never mixed) and ADR-008 (TanStack Query = server state, Zustand = UI state). No stable contract changes.
