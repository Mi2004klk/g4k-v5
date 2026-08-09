# Component System — Radix UI + shadcn/ui Strategy (FROZEN)

> **Production-ready component strategy.** Every screen is built from this catalog — no ad-hoc UI
> decisions mid-development. shadcn/ui components are copied into `packages/ui` and owned by the
> project; Radix primitives are used directly where shadcn doesn't cover. Tokens/colors/motion
> come from `DESIGN-SYSTEM.md`; performance rules from `PERFORMANCE-STANDARDS.md`.
>
> **Naming convention:** `<Purpose><Element>` (e.g. `TaskDataTable`, `ClockInButton`,
> `LeaveStatusBadge`). One component = one file in `packages/ui/src/components/`.
>
> **Verification:** each component entry below lists the variants/states/keyboard/responsive
> rules a PR must satisfy. axe-core + visual-regression (360/768/1024/1440) run in CI.

## 0. Foundations (apply to every component)
- **State machine**: every interactive component implements rest → hover → focus-visible →
  active → disabled → loading → error (DESIGN-SYSTEM §12). No state may be visually ambiguous.
- **Focus**: visible 2px `brand-violet` ring, 2px offset, on `:focus-visible` only (not mouse).
  Never `outline: none` without a replacement.
- **Keyboard**: all actions reachable + operable via keyboard; logical tab order; Escape closes
  overlays; Enter submits/confirms; arrow keys navigate menus/lists/comboBox/tabs.
- **Touch targets**: ≥44×44px (≥48px on mobile attendance buttons — DESIGN-SYSTEM §15).
- **Reduced motion**: `prefers-reduced-motion` collapses all durations to ≤1ms (DESIGN-SYSTEM §8).
- **Density**: components read the active density (comfortable/compact) for row/padding sizing.
- **No emoji as icons**: Lucide icons only, consistent stroke-width (1.75).
- **Composition over configuration**: prefer `asChild` / slots over prop-driven variants when a
  Radix primitive is the root.

---

## 1. Form primitives
### Button - `Button` (shadcn, Radix Slot)
Primary button interaction must strictly follow the rainbow-hover spec:
- **Default:** Solid charcoal (`bg-primary`, `#1A1A2E`).
- **Hover:** Animated conic-gradient border rotating through the accent palette (3s linear infinite) with a subtle box-shadow glow.
- **Active:** 0.96 scale compression (120ms).
- **Loading:** Text replaced/appended with dot-loader.
- **Disabled:** 40% opacity, no animations.
- **Reduced-motion Fallback:** Static subtle border instead of rotating gradient.

Other variants: `secondary`, `outline`, `ghost`, `link`, `destructive` (solid red, red background).
- Standard sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10).
- State: `isLoading` (spinner + disabled), `disabled`, `asChild` (Radix Slot).
- Micro-interaction: scale down to 0.96 on click (`active:scale-[0.96] transition-transform`).

### Input / Textarea / PasswordInput — `Input`, `Textarea` (shadcn)
- **Variants**: `default`, `error` (danger border + helper text). Password adds a show/hide
  `IconButton` (eye/eye-off) bound to the requirement (R1.2).
- **States**: rest, focus (brand ring), filled, error, disabled.
- **Validation**: React Hook Form + Zod; errors render directly under the field (R3.7); validation
  triggers on 400ms pause, not per keystroke (R13.16).
- **Use for**: all text entry — sign-in credentials, task titles, leave reasons, notes.
- **Verify**: error message present under field on invalid; focus ring visible.

### Label / Form / FormField / FormItem / FormControl / FormMessage — `Form` (shadcn, RHF bridge)
- Required fields marked with `*` (red) — configurable per-form (R3.7).
- Sectioned long forms with `FormSection` heading wrappers (R3.7).
- **Save-as-Draft + autosave**: 30s interval + restore banner on reopen (R3.7) — implemented via
  a `useFormDraft(key)` hook backed by IndexedDB (Offline Engine).

### Select — `Select` (shadcn, Radix Select)
- **Use for**: single-choice dropdowns — department, designation, role, priority, sort-by.
- **Variants**: `default`, `error`. Searchable variant (`Combobox`, see §3) for >8 options.
- **Keyboard**: Enter opens, arrows navigate, Enter selects, Esc closes, type-ahead filters.
- **Mobile**: native `<select>` render via `SelectTrigger` adapting to platform (familiar, fast).

### Checkbox / Switch — `Checkbox`, `Switch` (shadcn, Radix)
- **Checkbox**: multi-select filters (status multi-select), task multi-select for bulk actions,
  QA form checkboxes. **Switch**: dark-mode toggle, notification prefs, task "self-create permitted".
- **States**: unchecked/checked/indeterminate (for select-all), focus ring.
- **Verify**: label associated (click label toggles); indeterminate on partial select-all.

### RadioGroup — `RadioGroup` (shadcn, Radix)
- **Use for**: mutually-exclusive small sets — leave type, recurrence (daily/weekly/monthly),
  export format. Arrows navigate.

### Slider — `Slider` (shadcn, Radix)
- **Use for**: task progress update (0–100%). Live preview; commits on release; optimistic update.

### DatePicker / DateRangePicker — built on Radix Popover + calendar
- **Use for**: leave date(s), project deadline, report date range, attendance history navigation.
- **Mobile**: native date input (R8 mobile forms). **Keyboard**: arrows navigate days, Enter picks.
- **Verify**: range validation (end ≥ start); timezone from company profile.

### FileUpload (popup) — custom on Radix Dialog (R11.3)
- **Use for**: profile photo, project images, chat attachments. Shows format + size limits in a
  clean popup (R3.7/11.3). NOT a general upload (deferred). Drag-drop + click; preview thumbnail;
  client-side validation (type/size) before upload; optimistic preview.

---

## 2. Overlays & disclosure
### Dialog / AlertDialog — `Dialog`, `AlertDialog` (shadcn, Radix Dialog)
- **Dialog**: create/edit forms (user, project, task, leave), QA form builder, settings panels.
  `AlertDialog`: all destructive confirmations (delete/deactivate/reject/end-session) — title
  "Are you sure?", description, Cancel + red Confirm (R3.9).
- **States**: backdrop blur (e4), 280ms fade+scale (0.96→1). Focus trapped; initial focus on
  primary action or first field; Esc closes (non-destructive only); restore focus to trigger.
- **Responsive**: full-screen on mobile (≤ sm); centered modal on desktop; max-width per size
  (`sm/md/lg/xl`).
- **Verify**: focus trap; Esc closes; backdrop click closes (Dialog only, NOT AlertDialog).

### Sheet (Drawer) — `Sheet` (shadcn, Radix Dialog, side variant)
- **Use for**: detail panels (task detail, employee profile peek, activity log), mobile nav
  (hamburger full-screen menu), filters on mobile, message-thread side panel.
- **Sides**: right (default, 420px), left, top, bottom. 200ms slide.
- **Verify**: focus trap; Esc closes; swipe-to-dismiss on mobile (optional).

### Popover — `Popover` (shadcn, Radix Popover)
- **Use for**: date pickers, color/priority pickers, inline filters, mention dropdown, avatar menu.
- **Verify**: positions correctly on edge collisions; Esc closes; click-outside closes.

### Tooltip — `Tooltip` (shadcn, Radix Tooltip)
- **Use for**: every icon-only button shows its label (R3.9) — pause timer → "Pause Work Session",
  bell → "Notifications (3 unread)". Also: truncated text (ellipsis → full text tooltip).
- **Behavior**: 150ms show delay, instant hide; never on touch (use long-press title instead).
  Disabled elements need a wrapper span to be hoverable.
- **Verify**: appears on hover/focus; disappears on leave/Esc; not on touch.

### DropdownMenu / ContextMenu — `DropdownMenu`, `ContextMenu` (shadcn, Radix)
- **DropdownMenu**: row actions (edit/delete/deactivate), "more" menus, user avatar menu, sort menu.
- **ContextMenu**: right-click on tasks/rows → bulk actions, quick-status-change, pin (R11.8).
- **Items**: default, destructive (red), checkbox (toggle), separator, label, shortcut hint.
- **Keyboard**: arrow nav, Enter, Esc, first-letter jump.
- **Verify**: closes on selection; submenus position correctly; keyboard navigable.

### Tabs — `Tabs` (shadcn, Radix Tabs)
- **Use for**: project detail (Overview/Tasks/Chat/Activity/History), settings categories,
  List-vs-Kanban view toggle (Tabs styling on a SegmentedControl variant), profile sections.
- **Keyboard**: arrows move between tabs; focus ring; content lazy-mounts per tab (R13.8).
- **Verify**: arrow navigation; content preserved when switching back (not refetched if cached).

### Collapsible / Accordion — `Collapsible`, `Accordion` (shadcn, Radix)
- **Use for**: "advanced" recurrence options in task form (R-recurring), filter panel sections,
  sidebar section groups, activity log grouping by date.
- **Verify**: smooth height animation (180ms); keyboard toggle; persists open state.

### ScrollArea — `ScrollArea` (shadcn, Radix ScrollArea)
- **Use for**: sidebar, chat message list (inside virtualization), dropdown lists. Themed thin
  scrollbar. Do NOT wrap virtualized tables (they manage their own scroll).

---

## 3. Data display & entry
### DataTable (generic) — TanStack Table + Radix, virtualized (`@tanstack/react-virtual`)
- **The reusable master-data table** (R2.9). Used for: employees, departments, attendance logs,
  tasks (list view), leave, notifications, audit log, reports.
- **Features**: sortable columns (click header), column visibility toggle, saved views, custom
  columns, pinning, grouping, cursor pagination (R13.6), row selection (checkbox → bulk actions),
  row click → detail Sheet/Dialog, inline edit (pencil on hover), sticky header, sticky first
  column, density-aware row height, **virtualization >100 rows** (R13.14), memoized rows + stable
  keys (R13.12).
- **States**: loading (skeleton rows matching columns), empty (EmptyState), error (inline retry).
- **Toolbar**: the shared FilterBar (§5) sits above it.
- **Verify**: 5000-row render ≤ visible+overscan DOM nodes; 60 FPS scroll; sort/filter query ≤5 SQL.

### Combobox / Autocomplete — `Popover` + `Command` (shadcn Command, built on Radix)
- **Use for**: searchable selects >8 items — assign employee to task/project, directory search,
  @mention member picker, command palette items. Debounced 250ms server search (R13.15); instant
  client filter when ≤200 items.
- **States**: loading (spinner in list), empty ("No matches"), selected check.
- **Keyboard**: arrows, Enter, Esc, type-ahead.
- **Verify**: results <300ms server search; keyboard fully operable; clearable.

### Badge / StatusBadge — `Badge` (shadcn)
- **Variants** mapped to status (R11.4): `neutral`(gray)=Not Started, `info`(blue)=In Progress,
  `warning`(amber)=Pending, `success`(green)=Approved/Completed, `danger`(red)=Redo/Rejected/Overdue.
- **Use for**: task/project/leave status pill, role tags, "Late" badge, unread count.
- **Verify**: consistent colors across all modules; dot+label variant for compact.

### Avatar — `Avatar` (shadcn, Radix Avatar)
- **Use for**: profile pic, directory card, chat sender, mention chip, top-bar user menu.
- **States**: image, fallback (initials on brand-tinted bg), loading (skeleton). Sizes
  `xs/sm/md/lg`; group variant (`AvatarGroup`) for project team display.
- **Verify**: aspect-ratio reserved (CLS prevention, R13.2); fallback shows on error.

### Progress — `Progress` (shadcn, Radix Progress)
- **Use for**: task progress, project progress, upload progress, onboarding completion.
- **Behavior**: animates 0→value on first paint (600ms, DESIGN-SYSTEM §8). Color = success when
  complete; warning when blocked/overdue.
- **Verify**: animates on mount; updates smoothly on change.

### Separator — `Separator` (shadcn, Radix Separator)
- Use between form sections, sidebar groups, card sections, filter chips.

### Skeleton — `Skeleton` (shadcn)
- Shaped to match real content (card, row, text line). Used for first-load only; cached revisits
  show real data (R13.18). Never a full-screen spinner where a skeleton fits.

### EmptyState — custom (image + copy + optional action) (R3.13)
- Exact copy per context (from spec): no-projects, no-tasks, no-notifications, no-messages, etc.
- Illustration = Lucide icon or cached `animated-logo.mp4` where relevant. Optional primary action
  button ("Create project", "Start conversation").

---

## 4. Navigation & layout
### AppShell — custom (top bar + sidebar + content + command palette)
- **TopBar**: logo+wordmark left; global search stub center (Ctrl+K hint); bell + avatar right.
  Sticky; e4 elevation; blurs on scroll.
- **Sidebar** — see DESIGN-SYSTEM §9 (264↔72px collapse, Ctrl+B, pinned section at bottom,
  role-aware nav tree). Built with `ScrollArea` + custom `NavItem`/`NavGroup` (Collapsible).
- **Mobile**: sidebar hidden; `Sheet` (left, full-screen) via hamburger; bottom nav (≤5 icons,
  `BottomNav` custom) is primary. Attendance button prominent (R8).
- **Breadcrumb** (`Breadcrumb`, shadcn): below top bar on detail screens; each crumb a Link
  (R3.4). Truncates middle with ellipsis on narrow widths.

### Command Palette — `CommandDialog` (shadcn Command + Dialog, Ctrl+K) (R3.11)
- Actions: navigate, create-new (context), pin/unpin, toggle theme, run saved view, open recent.
- **Perf**: instant client-side fuzzy index (<50ms); web worker for indexing if large (R13.17).
- Sections grouped; recent items first; keyboard-first.

### SidebarNavItem / NavGroup — custom
- Active state: violet-tinted bg + brand left bar + 600 weight; collapsed = icon + tooltip.
- Hover = surface-2. NavGroup collapses children (Accordion behavior, 180ms).

### PinnedItems — custom section (R3.5)
- Bottom of sidebar (after primary nav, separated). Star/pin toggle on hover over
  projects/tasks/profiles. Removable. Collapsed = icon + tooltip.

---

## 5. Filters, search, pagination
### FilterBar — custom (shared across all list pages) (R3.8)
- Children: `Input` (search, debounced 250ms), `FilterPopover` (status multi-Checkbox),
  `DatePicker` range, dept/team `Combobox`, priority `Combobox`, sort `Select` + direction
  `IconButton` (arrow), `ClearAllFilters` link (only when active).
- **Active filters as removable chips** below the bar (`FilterChip` = Badge + X). Changes update
  URL + cache; no reload (R13.15). Memoized to avoid re-renders.
- **Mobile**: collapses into a "Filters" `Sheet`.

### Pagination — `Pagination` (shadcn) + page-size `Select`
- Page numbers; default 20; dropdown to 50/100 (R3.10). Cursor-based (R13.6). Server-driven.

---

## 6. Feedback & communication
### Toast — `Toast` / `Sonner` (shadcn, top-right) (R3.12)
- Variants: success(green)/error(red)/amber(warning)/blue(info). Auto-dismiss 4s; manual X;
  pause-on-hover; stack with enter/exit motion (200ms). Used for success confirmations,
  failures (with retry action), warnings, info. Non-blocking.
- **Verify**: 4s auto-dismiss; action button (e.g. "Retry") works; max stack height respected.

### NotificationsBell — custom (bell `IconButton` + unread `Badge`) (R8.10)
- Popover of recent high-priority + system notifications; mark-as-read (optimistic); "view all"
  → Notification Center (inside Chat). Unread count badge decrements optimistically (R13.19).

### AnnouncementCard — custom (R8.12)
- Dashboard placement; pin toggle; reaction `IconButton` row (thumbs up etc., optimistic); close X
  (per-user dismiss). Author avatar + scope tag.

### OfflineBanner — custom (R11.6)
- Top of content area when `navigator.onLine === false`; "You're offline…"; auto-hides on reconnect.

---

## 7. Module-specific composites (built FROM the primitives above)
> These are NOT new primitives — they compose §1–6. Each maps a workflow to components.

### Attendance
- **ClockInWidget** (dashboard): `Button(success)` full-width (mobile ≥48px), live timer display
  (isolated component, rAF/1s, no sibling re-render — R5.14), `Button(secondary)` break,
  `Button(destructive)` end-shift (AlertDialog confirm). Optimistic state, rollback toast (R5.13).
- **AttendanceHistoryCalendar**: virtualized calendar heatmap (lazy import, month-change fetch —
  R13.8); per-day `Popover` summary (clock-in/breaks/out/hours/projects/tasks).
- **TeamAttendanceTable**: `DataTable` (present/absent/late filter chips in FilterBar), cached
  30s stale-while-revalidate (R5.16), in-place filter changes.
- **ManualCorrection**: inline edit on the day-summary row → `Dialog` form.

### Projects & Tasks
- **ProjectCard** (grid/list): name, status `Badge`, priority `Badge`, deadline, `Progress`,
  team `AvatarGroup`, pin `IconButton`. Click → project detail.
- **TaskKanbanBoard**: dnd-kit columns (To Do/In Progress/Under Review/Done); virtualized cards;
  drag = optimistic status + debounced persist (R13.19/2); `ContextMenu` for quick actions.
- **TaskList**: `DataTable` variant; inline edit title (pencil); drag-reorder rows (dnd-kit).
- **TaskDetailSheet** (`Sheet`): description, `Slider` progress, assignees `Combobox`, comments
  (`TiptapEditor`, lazy), activity log (`Accordion` by date), QA form, submit `Button` + note.
- **GanttView** (lazy import, web-worker layout): ECharts/custom; project bars + task milestone
  diamonds; tooltip on hover.
- **QAFormBuilder**: `Accordion` of fields; field types = Input/Textarea/Checkbox/Slider/Select.

### Chat & Notifications
- **ConversationList**: virtualized; unread = colored left border + `Badge` count; search `Input`.
- **MessageList**: virtualized (append-only, memoized rows), auto-scroll; pinned messages on top.
- **MessageComposer**: `TiptapEditor` (lazy), @mention `Combobox`, attach `IconButton` →
  FileUpload popup, send `Button` (Enter to send, Shift+Enter newline); optimistic insert.
- **NotificationCenter**: `Tabs` (All/Unread/Mentions) over a `DataTable`/virtualized list;
  optimistic mark-read.

### People & Org
- **DirectoryCard** (grid) / DirectoryRow (list): `Avatar`, name, designation, dept `Badge`,
  contact (if visible), "Send Message" `Button` (opens Direct chat).
- **UserForm**: `Form` sectioned — identity, contact, role `Checkbox` group (dual-role),
  dept/team `Combobox`, designation `Select`, photo FileUpload.
- **DepartmentCard**: name, description, member `AvatarGroup`, HR count, edit/delete in `DropdownMenu`.

### Leave & Approvals
- **LeaveRequestForm**: `Form` — date `DateRangePicker`, type `RadioGroup`, reason `Textarea`,
  submit `Button` (optimistic).
- **LeaveApprovalRow**: dates, reason, status `Badge`, approve/reject `Button`s (1-click + confirm
  for reject → AlertDialog; optimistic badge flip, R13.24/19).

### Reports
- **ReportBuilder**: type `Select`, filters (FilterBar), generate `Button` → 202 + poll/queue;
  results in virtualized `DataTable`; export `Button` (Excel/PDF) → queued download.
- **SavedViews** selector: `Combobox` of saved report configs.

### Settings & Audit
- **SettingsTabs**: company profile, working hours, holidays, policies, sessions, notifications,
  reminders — each a `Form`.
- **AuditLogTable**: virtualized `DataTable`; filter by user/action/date; export queued.

### Auth & Profile
- **SignInCard**: `Card` with logo, `Form` (identifier `Input`, password `PasswordInput`,
  show/hide `IconButton`), `Button(primary)` with loading, forgot-password `Link`, copyright +
  info `Tooltip`. Brand-gradient hero background.
- **RoleSelectGrid**: role cards (`Button` variant) for dual-role users.
- **ProfileForm** + device list (`DataTable`) + remote-logout `IconButton` (confirm AlertDialog).

---

## 8. Rich content & editors
### TiptapEditor — `@tiptap` (lazy-loaded, R13.8)
- **Use for**: task comments, QA long answers, completion reports, announcement body, notes.
- Extensions: bold/italic/underline, lists, link, mention (powers @mention), code.
- **States**: toolbar (Button group), placeholder, disabled. Output sanitized server-side.
- **Perf**: dynamically imported only where used; content serialized on blur (debounced).

### Chart — ECharts (lazy, web-worker aggregation for heavy) (R13.8/17)
- **Use for**: attendance weekly/monthly graphs, dashboard large widgets, report charts, heatmap.
- Wrapper in `packages/ui` with a consistent token-mapped theme (light/dark).

---

## 9. Component → workflow mapping (consistency guarantee)
Every screen composes ONLY components from §1–8. Examples:
- **Clock in** = ClockInWidget → Button(success) + AlertDialog(confirm end) + Toast(success) + isolated Timer.
- **Approve leave** = LeaveApprovalRow → Button(success) + StatusBadge flip + Toast + (reject → AlertDialog).
- **Create task** = Command palette / Ctrl+N → Dialog(TaskForm) → Form + Combobox + Select + Recurring Collapsible + Toast.
- **Assign team** = ProjectDetail → Combobox(search employees) + AvatarGroup + Toast(added).
- **Search directory** = FilterBar Input (debounced) → DirectoryCard grid (virtualized) → click → Profile Sheet → "Send Message" Button.
- **View activity** = TaskDetailSheet → Tabs(Activity) → Accordion(by date).
- **Export report** = ReportBuilder → Button → 202/queue → Toast(done) → download.
- **Inline edit title** = hover pencil → Input(in-place) → Enter save / Esc cancel + Toast.

This mapping is the single source modules follow — preventing ad-hoc UI decisions.

## 10. Ownership & reusability rules
- Generic components (DataTable, FilterBar, Badge, Button, EmptyState, etc.) live in `packages/ui`
  and are shared. Module composites (ClockInWidget, TaskKanbanBoard) live in `apps/web` and
  compose the generics. **Never duplicate** a generic's logic in a module composite (ADR-reusable-first).
- A new primitive may be added ONLY if no §1–8 component fits — and must be documented here (frozen
  spec; adding requires updating this file).
- shadcn components are owned (copied-in); track upstream changes manually (project §9 note).
