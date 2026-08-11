# context.md — Games4King Workplace OS: Single Consolidated Project Context

> **Purpose:** One authoritative map of the entire product, the current implementation, and every
> verified finding from the full codebase audit. This file is the source of truth future AI
> development reads first. `fix-3.md` is the actionable companion (the implementation checklist).
>
> **Hierarchy of truth:** `context.md` (this — the verified reality) → `fix-3.md` (what to change)
> → OpenSpec (`openspec/project.md`, `REQUIREMENTS.md`, `DESIGN-SYSTEM.md`,
> `COMPONENT-SYSTEM.md`, `PERFORMANCE-STANDARDS.md`, per-phase folders) for frozen contracts.
>
> **Audit date:** 2026-08-11. **Method:** every finding below was verified by reading actual source
> against OpenSpec. The OpenSpec `TRACKER.md` marks all 11 phases ✅ — this is **inaccurate**; the
> real state is documented here. No code was modified during the audit.

---

## 0. TL;DR — where the project actually stands

- **Stack (frozen):** Laravel 13/PHP 8.4 + PostgreSQL (Supabase) + Laravel Reverb backend on Railway;
  Next.js 16 + React + TypeScript + Tailwind v4 + Radix/shadcn frontend on Vercel;
  shared `packages/ui` component library. Monorepo: `apps/web`, `apps/api`, `packages/ui`.
- **Build status:** code for ALL modules exists (Auth, Org, Attendance, Leave, Projects/Tasks,
  Chat/Notifications/Announcements/QuickNotes/Feedback, Reports, Settings/Audit). There is no
  "Base+Attendance+Leave only" reality anymore — the M1-cutoff note in `finalization.md` is stale.
- **Real status:** the app **runs but is unreliable and feels broken/slow**. There are
  **CRITICAL security bugs** (capability middleware OR-logic broken; first-login password change
  disabled; unguarded routes), **CRITICAL correctness bugs** (break punches 404; chat scoping SQL
  bug; CompanyController empty stubs; ProcessApprovalDecision listener never registered), and
  **CRITICAL UX bugs** (top bar still has a search bar; no Start-Shift button; notifications is a
  small popover not a centered modal; sidebar chevron clipped/invisible; widget drag opens widgets;
  dashboard refetch loop → flicker).
- **Performance:** app is slow and "always loading" because of (a) a double retry layer
  (React Query `retry:3` + api-client `retry:3` = up to ~2 min of retries on a flaky backend),
  (b) the `getWidgetsForRole()` array-new-every-render → preferences refetch loop that resets
  widget `loading=true`, (c) the global timer store ticking every second forcing re-renders of every
  subscribed component, (d) no virtualization on several lists, (e) no realtime consumption in
  widgets, (f) inline/sync exports, (g) `Cache::flush()` wiping the whole cache on holiday edits.
- **Verdict:** fixable. The architecture and the design system are sound; the work is a disciplined
  pass to close the bugs, rewire disconnected features, harden RBAC, and apply the frozen design
  system uniformly. `fix-3.md` is the full ordered checklist.

---

## 1. Product vision & scope

**Games4King Workplace OS** — enterprise company-management platform for a single company (Games4King,
a game-development studio). Three system roles: **Super Admin** (Karthik), **HR** (Aravind), and
**Employee** (13 seeded employees). Inspired by ClickUp/Linear/Notion/Slack — vibrant but
professional, fast, offline-first, responsive + PWA.

- **Single-company deployment** (no multi-tenant scoping). **M1 = Web only** (Windows/Tauri = M2,
  Android/Compose = M3 — same Core Platform, different clients).
- **Brand:** derived from the logo — violet→magenta gradient, gold crown/stars, cartoon king.
  Tone: vibrant on white, disciplined semantic data colors. English only (M1).
- **Qualities:** speed, rich micro-interactions, offline-first, cross-platform consistency,
  long-term maintainability. Every frequent workflow targets ≤2 clicks, no reloads, optimistic UI.

### Modules (all have code present)
| # | Module | Capability key | Notes |
|---|---|---|---|
| 1 | Auth & sessions | `authentication` | Sanctum bearer + 7-day refresh cookie |
| 2 | Users, roles & org | `org-management` | Users, Departments, Designations, Directory |
| 3 | App shell & design | `app-shell` | Top bar, sidebar, command palette, components |
| 4 | Dashboard & widgets | `dashboards` | React Grid Layout widget engine |
| 5 | Attendance | `attendance` | Clock in/out/breaks, heatmap, exports |
| 6 | Leave & approvals | `leave-approvals` | Reusable ApprovalService state machine |
| 7 | Projects & tasks | `projects-tasks` | Kanban, Gantt, QA forms, recurring |
| 8 | Chat & notifications | `communication` | Global/Project/Direct/Group + announcements + notes |
| 9 | Reports & exports | `reporting` | Queued exports, Sunday email |
| 10 | Settings & audit | `system-settings` | Company profile, policies, audit log |

---

## 2. Roles, capabilities & permissions

### 2.1 Three system roles (only three)
| Role | Seed user | Scope |
|---|---|---|
| **Super Admin** | `karthik` / `Admin@123` | Full control; company-wide |
| **HR** | `aravind` / `Hr@123` | Team ops: own-department scoping; leave approvals for employees; attendance oversight |
| **Employee** | `praveen` / `Dev@123` (and 12 others) | Own work, attendance, comms |

The **15 "roles" in seed data are DESIGNATIONS** (Senior Game Developer, Designer, QA Tester, Director,
Editor, Cameraman, Actor, Actress, etc.) — NOT permission roles. A **dual-role user** (≥2 system
roles) sees a **Role Selection screen** after login. Seed sets `must_change_password = true` for all
users (but enforcement is currently disabled — see §8).

### 2.2 Capability model (the only permission model)
Capabilities are granular strings granted to roles via the `role_capabilities` table, loaded by
`CapabilityMatrix` (cached 3600s/role; `super_admin` short-circuits via `*`). Seeded capabilities:

- `*` (super_admin)
- `attendance.clock-self`, `hr.view-team-attendance`, `admin.view-all-attendance`,
  `admin.correct-attendance`, `attendance.correct-team`
- `leave.request-self`, `leave.approve-employee`, `leave.approve-hr`
- `settings.manage`, `audit.view`
- `users.hr.manage`, `users.employee.manage`, `departments.manage`, `designations.manage`
- `directory.view`, `directory.send-message`, `profile.edit`

> **CRITICAL — `RequireCapability` middleware OR-logic is broken** (see §8 CRB-1): any middleware
> written as `capability:a|b` fails for non-super_admin roles. HR attendance correction
> (`admin.correct-attendance|attendance.correct-team`) is currently 403 for HR.

### 2.3 M1 capability matrix (intended)
| Area | Super Admin | HR | Employee |
|---|---|---|---|
| Dashboard | full company | team | personal |
| Org: users (HR+Employee) | full CRUD, roles, reset pw, deactivate, activity | view team, limited | — |
| Org: departments | full CRUD + members | view | view |
| Org: designations | full CRUD | view | view |
| Directory | full + Send Message | full + Send Message | view + Send Message |
| Profile (self) | edit photo/name/phone/designation, change pw, devices | same | same |
| Attendance: clock self | yes | yes | yes |
| Attendance: team today (HR) | yes | yes | — |
| Attendance: company overview (Admin) | yes | — | — |
| Attendance: manual correction | any user | own team | — |
| Leave: request self | yes | yes | yes |
| Leave: approve employee | yes | yes | — |
| Leave: approve HR | yes | — | — |
| Settings | yes | view | — |
| Audit log | yes | — | — |

---

## 3. Tech stack & architecture (frozen)

### Backend — `apps/api` (Laravel 13, PHP 8.4)
- PostgreSQL via Supabase (source of truth). **Spec-first OpenAPI** (`openapi/openapi.yaml`) —
  currently stale vs routes (see §8 OPN-1).
- **Sanctum Bearer tokens** (stateless): access token + 7-day sliding refresh in HttpOnly cookie
  (ADR-026). SameSite auto-detected at runtime.
- **Laravel Reverb** for realtime (WebSockets on Railway). Channels: private (`user.{id}`,
  `conversation.{id}`), presence (`org`), public (`public-announcements`).
- Queue, Scheduler, Events, Cache. Backend owns **all** business logic, auth/permissions,
  validation, workflows, notifications, offline sync, reporting. Frontend never touches DB logic.

### Frontend — `apps/web` (Next.js 16.3)
- React + TypeScript, **Tailwind v4**, **Radix UI + shadcn/ui** (owned, copied into `packages/ui`).
- **TanStack Query** (server state, persisted to IndexedDB via `PersistQueryClientProvider`),
  **Zustand** (UI state only — never API data). **TanStack Table** + `@tanstack/react-virtual`.
- **dnd-kit** (kanban/lists/menus) + **React Grid Layout** (dashboard widgets only — never mixed).
- React Hook Form + Zod, Apache ECharts, Tiptap, Lucide, Motion (Framer Motion), IndexedDB.
- Reverb via `pusher-js`. PWA manifest + service worker.

### Shared — `packages/ui`
The component-owning package. 43 components exist (see §5). Consumed by `apps/web` and the future
Tauri desktop client (plain React SPA, no Next/SSR).

### Hosting
Backend → Railway (Laravel app + queue/scheduler workers). Frontend → Vercel (Next.js).
Database → Supabase Postgres. VCS → GitHub (monorepo). Per-module live deploys to production.

### Architecture principles (immutable)
1. Performance-first (decided at architecture time, CI-enforced — `PERFORMANCE-STANDARDS.md`).
2. Offline-first (one shared Offline Engine; no per-module sync).
3. API-first / spec-first.
4. Capability-based permissions only.
5. Reusable components first (generic Metric Widget, not Attendance Widget).
6. No business logic in frontend; no client touches DB.
7. Layered; Core Platform thinking (not milestone-driven architecture).

### Engines (intended)
- **Layout Engine** — responsive grids, docking, split panes, tabs, drawers.
- **Widget Engine** — self-contained widgets w/ permissions, settings, data providers;
  drag/resize/collapse/refresh/lazy/offline/realtime; adaptive (small=metric, medium=metric+stats,
  large=chart+stats+trend+actions). Each widget loads independently (one slow ≠ all blocked);
  each in its own error boundary; lazy-loaded via IntersectionObserver.
- **View Engine** — list/board/calendar/Gantt/timeline/gallery/table/form/analytics; virtualize >100 rows.
- **Command Engine** — context menus, keyboard shortcuts (Ctrl+K, Ctrl+N, Ctrl+/, Esc, Enter), bulk actions.
- **Theme Engine** — colors, spacing, typography, density, light + dark (both colorful); token-based.

### State management
- **TanStack Query**: all API calls. Per-entity `staleTime`/`gcTime`; `select` for derived data;
  stale-while-revalidate on navigation.
- **Zustand**: sidebar, theme, dialogs, selected items, filters, drafts. Slice selectors only
  (no whole-store subscriptions). **Rule: never store API data in Zustand.**
- **Offline Engine**: Queue → Sync Manager → Conflict Resolver → Retry Manager → Storage →
  Connectivity Monitor. States: Pending → Syncing → Completed → Failed → Conflict → Cancelled.
  Retry ladder: 1s → 5s → 30s → 2m → 5m → Manual. Per-entity conflict resolution
  (Settings=LWW · Tasks=Version+Merge · Attendance=Server Validation · Chat/Comments=Timestamp).

---

## 4. Design system (FROZEN — `openspec/DESIGN-SYSTEM.md`)

### 4.1 Tone & visual identity
**Vibrant-on-white** (ADR-023): clean white surfaces, multiple contextual colors across icons,
sidebar states, badges, cards, interactions; per-module accent colors; **gradients reserved for
sign-in hero, dashboard headers, and logo lockups only**. Charcoal `#1A1A2E` primary anchor.
Brand gradient `linear-gradient(135deg,#9400D3 0%,#8A2BE2 50%,#FF1493 100%)` — used ONLY on sign-in
hero, dashboard headers, primary logo lockups, focus-ring brand moments. Gold gradient
`linear-gradient(135deg,#FFD700 0%,#FFA500 100%)` for premium/crown moments — never on body text.

### 4.2 Palette (exact hex)
**Brand accents:** violet `#8A2BE2`, violet-deep `#9400D3`, gold `#FFD700`, pink `#FF1493`,
orange `#F97316`, coral `#FF7F50`, red `#EF4444`, magenta `#D946EF`, blue `#3B82F6`, indigo `#6366F1`,
cyan `#06B6D4`, teal `#14B8A6`, green `#22C55E`, lime `#84CC16`, gray `#6B7280`.

**Per-module accent mapping (wayfinding):** Dashboard=Blue · Attendance=Green · Leave=Amber ·
Directory=Pink · Org=Indigo · Settings=Teal · Audit=Rose · Profile=Cyan · Notifications=Orange.
**Chart palette (12):** Violet, Blue, Cyan, Teal, Green, Lime, Yellow, Amber, Orange, Red, Pink, Magenta.

**Semantic (data) colors — disciplined:**
| Token | Light | Dark | Meaning |
|---|---|---|---|
| success | `#16A34A` | `#22C55E` | Approved/Completed/present |
| info | `#2563EB` | `#3B82F6` | In Progress |
| warning | `#D97706` | `#F59E0B` | Pending/overtime/late |
| danger | `#DC2626` | `#EF4444` | Redo/Rejected/Overdue/destructive |
| neutral-status | `#6B7280` | `#9CA3AF` | Not Started |
| overtime | `#D97706` | `#F59E0B` | overtime heatmap + timer amber |

**Status pill map (R11.4):** Gray=Not Started · Blue=In Progress · Amber=Pending · Green=Approved/
Completed · Red=Redo/Rejected/Overdue.

### 4.3 Surfaces & neutrals
| Token | Light | Dark |
|---|---|---|
| bg-app | `#F7F7FB` | `#0F0F14` |
| bg-surface | `#FFFFFF` | `#17171F` |
| bg-surface-2 | `#FCFCFE` | `#1E1E28` |
| bg-elevated | `#FFFFFF` | `#20202C` |
| border | `#E6E6EF` | `#2A2A38` |
| border-strong | `#D1D1DE` | `#3A3A4A` |
| text-primary | `#14141C` | `#F4F4F8` |
| text-secondary | `#4B4B5C` | `#A8A8B8` |
| text-muted | `#8A8A9A` | `#6E6E80` |

> **TOKEN BUG:** In `globals.css`, `--color-muted` is mapped to `var(--bg-surface-2)` (a BACKGROUND
> token, near-white `#FCFCFE`). Therefore any Tailwind `text-muted`, `bg-muted`, or `border-muted`
> utility resolves to a wrong value. `text-muted` paints near-white text (invisible on white).
> This affects `text-muted` usages at `layout.tsx:303` (sidebar chevron — invisible) and `:392`
> (search button — being removed anyway). Fix by mapping `--color-muted` to `var(--text-muted)` or
> by removing all `*-muted` utility usages in favor of explicit `text-secondary`/`text-neutral-*`.

### 4.4 Typography
**Inter** (UI) + **Sora** (display/brand headings). Self-hosted, subset, `font-display: swap`,
preloaded, ≤2 families. Scale (rem): xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.25 / 2xl 1.5 /
3xl 1.875 / 4xl 2.25 / 5xl 3 (display). Weights: 400 body, 500 emphasis, 600 section, 700 page title,
800 brand display. Line-height 1.5 body, 1.2 headings, 1.15 display. Letter-spacing -0.01em ≥2xl,
0 body, +0.04em uppercase labels.

### 4.5 Spacing (4px base)
`0,1(4),2(8),3(12),4(16),5(20),6(24),8(32),10(40),12(48),16(64),24(96)`. Card padding 5 (20px).
Section gap 8 (32px). Page gutter 6 (24px).

### 4.6 Radius
sm 6px (inputs) · md 10px (buttons) · lg 14px (cards) · xl 20px (panels/drawers) · full (pills/avatars).

### 4.7 Elevation
e1 rest card · e2 hover lift (cards lift to e2 on hover, 100ms) · e3 dropdown/popover · e4 dialog/
drawer (+ backdrop blur).

### 4.8 Motion (defined once, reused)
Taps/press 120ms ease-out (compress 0.96). Hover lift 100ms. Tooltip/popover 150ms. Sidebar glide
220ms `cubic-bezier(.4,0,.2,1)`. Drawer/panel 200ms ease-in-out. Dialog `ease-modal`
`cubic-bezier(0.16,1,0.3,1)`. Progress fill 600ms. List reorder 180ms. Page transition 180ms.
Badge state change 150ms. **Primary button** (premium feel): default solid charcoal; hover = animated
conic-gradient border rotating through accent palette (3s) + subtle glow; active 0.96 scale; loading =
dot-loader; disabled 40% opacity; **reduced-motion → static subtle border** (no rotation).

### 4.9 Sidebar (3-state per ADR-024, supersedes the 2-state FROZEN §9)
Three states: **Hidden / Collapsed (icons+tooltip, DEFAULT) / Expanded (icons+text)**. Joyful animated
transitions. Toggle chevron button + **Ctrl+B**. State persists per user (Zustand + `/auth/preferences`).
- **Collapsed affordances:** icon-only buttons with tooltip (150ms); active item = 3px brand-gradient
  left bar + subtle violet-tinted bg.
- **Expanded affordances:** icon + label in one row; active = violet-tinted bg + brand-gradient left
  bar + text-primary weight 600; hover = bg-surface-2.
- **Logo rules (FINAL, per user requirement):** collapsed = square 1:1 logo (`1.1 Logo.png` / icon);
  hovering the logo smoothly transitions to the sidebar control; clicking opens the sidebar;
  expanded = landscape logo (`Landscape-Logo.png`) with the sidebar control positioned correctly on
  its LEFT. (Current impl uses `/icon.png` for both states and the chevron is bottom-right — wrong.)
- **Section headers** shown in expanded; in collapsed, thin divider. **Pinned items** at the BOTTOM
  after primary nav, separated by a divider; collapsed = icons + tooltips.
- **Scrollbar:** thin, themed, 8px, auto-hide.
- **Mobile:** sidebar hidden; hamburger opens a full-screen menu (280ms slide); bottom nav ≤5 icons
  is the primary mobile nav.

### 4.10 Required sidebar nav items (per user requirement)
Dashboard, **My Attendance**, Projects, Chat, **Announcement** (distinct icon, e.g. Megaphone),
**My Profile**. (Current labels are "Attendance"/"Chat & Hub"/"Profile" and there is NO Announcement
item — wrong.)

### 4.11 Density & layout
Density modes: comfortable (default), compact. Persisted per user. Content max-width 1440px for
list/table pages; fluid for dashboards. 12-col, 24px gutter. Drawer width 420px (right).

### 4.12 Component states (every interactive component)
rest, hover, focus-visible (2px brand-violet ring, 2px offset), active/pressed, disabled (40%
opacity, no-pointer), loading (dot-loader for buttons; skeleton for content), error (danger border +
message).

### 4.13 Empty / loading / error states (no mock data, ever)
- **Skeletons** shaped exactly like real content. Never a global spinner where a skeleton fits.
- **Empty states** (R3.13): specific copy + Lucide icon or cached `animated-logo.mp4` + optional
  action button. e.g. "No projects assigned yet. Check back soon or ask your HR.",
  "All clear! No tasks pending right now.", "You're all caught up.", "No messages yet. Start the
  conversation." **HARD RULE: no mock/placeholder/sample data anywhere.**
- **Error states:** inline under field for forms; friendly error card with retry for views; toast
  (danger) for action failures. **Per-widget error boundaries** — a failed widget never blocks.

### 4.14 Header redesign (per user requirement)
- **Remove the search bar** entirely from the top bar (Ctrl+K command palette remains as the keyboard
  shortcut; no visible search trigger).
- **Start Shift control = icon-only** (clock/play icon), with the icon **centered** inside the button.
  Before shift: a Start Shift icon button. During shift: the running timer pill.
- All header controls have consistent sizing and vertical alignment.
- **Notifications = a centered popup/modal** (not a small end-anchored popover): dimmed background
  overlay, proper surface, clear hierarchy, **close (×) button**, **Clear action**, **Mark as Read
  action**, recent notifications. **Clearing notifications removes them ONLY from the notification
  popup while PRESERVING them in the Chats area** (two separate stores/views).

### 4.15 Dashboard redesign requirements (per user)
- **Announcement likes limited to one per person** (toggle reaction; backend `reactions` polymorphic
  table already supports it; needs controller route + UI + unique constraint).
- **Remove the End Shift and Take Break buttons below announcements** (currently not present near
  the announcement board, but ensure no future placement).
- **All dashboard buttons: icon + text horizontally aligned in one row** (`flex items-center gap-2`).
- **Widget positioning/sizing/spacing/stacking/containment** correct; **widget icons completely
  inside their containers** (no spillover — fix `Button`'s `[&_svg]:size-4` global override).
- **Widget drag must NOT trigger click/open after release** — widgets open only via intentional
  click. Needs drag-state tracking (onDragStart/onDragStop + movement threshold / pointer-events gate).
- **Remove widget flickering and unstable hover** — fix the `getWidgetsForRole()` new-array-per-render
  → preferences refetch loop.
- **Add collapse/expand to Quick Notes** (and ideally all widgets) using the existing `Collapsible`
  primitive.

### 4.16 Accessibility (WCAG 2.1 AA)
Contrast 4.5:1 text / 3:1 UI. Full keyboard reachability; visible focus rings (2px brand-violet,
2px offset, `:focus-visible` only). ARIA on icon-only buttons (tooltips double as labels).
`prefers-reduced-motion` → durations ≤1ms, no scale. axe-core zero critical/serious in CI.
Keyboard shortcuts: Ctrl+K (palette), Ctrl+B (sidebar), Ctrl+N (context-new), Ctrl+/ (help),
Esc (close), Enter (submit/confirm), arrows (menus/lists/tabs). Touch targets ≥44×44 (≥48×48 on
mobile attendance buttons). Languages: English only (M1).

---

## 5. Component catalog (FROZEN — `openspec/COMPONENT-SYSTEM.md`)

`packages/ui/src/components/` ships **43 components** (all exist): accordion, alert-dialog, avatar
(+AvatarGroup w/ size variants), badge, breadcrumb, button, card, checkbox, collapsible, combobox,
command-menu, command, confirm-dialog, context-menu, data-table, dialog, dropdown-menu, empty-state,
error-boundary, file-upload-popup, filter-bar, form, help-overlay, inline-edit, input, label,
offline-banner, pagination, password-input, popover, progress, radio-group, scroll-area, select,
separator, sheet, skeleton, slider, sonner, switch, tabs, textarea, tooltip.

### Composition rules
- Every screen composes ONLY from this catalog (no ad-hoc UI). Module composites (ClockInWidget,
  TaskKanbanBoard, etc.) live in `apps/web` and compose `packages/ui` generics — never duplicate.
- Generic components: Button (default/secondary/outline/ghost/link/destructive; sizes default h-10,
  sm h-9, lg h-11, icon h-10 w-10; isLoading; asChild Slot), Input/Textarea/PasswordInput (default/
  error variants; focus brand ring), Form (RHF bridge; required `*`; sectioned; Save-as-Draft + 30s
  autosave + restore), Select, Checkbox/Switch, RadioGroup, Slider, DatePicker/DateRangePicker,
  FileUpload (popup, format/size limits), Dialog/AlertDialog (backdrop blur, focus trap, Esc),
  Sheet (side variant, 420px right), Popover, Tooltip (150ms, never on touch), DropdownMenu/
  ContextMenu (keyboard nav, destructive/checkbox items), Tabs, Collapsible/Accordion, ScrollArea.
- **DataTable** (TanStack Table + virtualized): sortable columns, column visibility, saved views,
  custom columns, pinning, grouping, cursor pagination, row selection → bulk actions, row click →
  detail Sheet/Dialog, inline edit, sticky header, density-aware rows, virtualize >100 rows, memoized
  rows + stable keys. Loading = skeleton rows; empty = EmptyState; error = inline retry.
- **FilterBar** (shared): search Input (debounced 250ms), FilterPopover (multi Checkbox),
  DateRangePicker, dept/team Combobox, priority Combobox, sort Select + direction, ClearAll link.
  Active filters as removable chips. Mobile = "Filters" Sheet.
- **Badge/StatusBadge:** variants mapped to status (neutral/info/warning/success/danger).
- **EmptyState** (icon + copy + optional action; falls back to cached `animated-logo.mp4`).
- **Sonner toast:** top-right, 4s auto-dismiss, manual X, pause-on-hover, variants
  success/error/warning/info.

### Known component-level issues
- **`Button` base includes `[&_svg]:size-4`** (`button.tsx:8`) → forces every descendant SVG to 16px,
  overriding per-icon sizes. Causes icon-spill in tight buttons. Fix: scope this to specific
  variants/sizes or remove and set icon sizes explicitly.
- **`text-muted`/`bg-muted`/`border-muted` token mis-map** (see §4.3) → affects any usage.
- **`empty-state.tsx`** falls back to autoplaying `/animated-logo.mp4` when no `icon`/`videoSrc` —
  inside a small metric card this is noisy; pass an `icon` everywhere.
- **`data-table.tsx`** internal infinite-scroll hook fires `fetchNextPage` on scroll-to-bottom, but
  most call sites don't pass `fetchNextPage`/`hasNextPage` → silent no-pagination. Fixed `h-[600px]`
  height is non-configurable.
- `index.ts` exports `combobox` and `avatar` twice (harmless but sloppy).
- `filter-bar.tsx` `FilterOption` interface has no `type` field but call sites pass `type:"select"`
  (TS strict error).

---

## 6. Workflows (day-to-day, must work end-to-end)

### 6.1 Auth & sessions
Sign-in (identifier = **username OR email OR employee_id** + password, show/hide toggle, loading
animation, error message) → **Role Selection** for dual-role users → **Force password change** if
`must_change_password` (currently DISABLED — CRB-7) → **Onboarding** welcome if not `onboarded_at` →
role dashboard. Forgot password via SMTP OR Admin-approval channel. **Account lockout** after 5 failed
attempts / 10 min. Suspicious-login detection notifies HR + Admin. Per-device session list + remote
logout (Reverb `SessionRevoked` event signs the device out). Reload → token persists (Zustand
`g4k-auth` + `g4k_token` cookie for middleware + refresh cookie).

### 6.2 Attendance (DR-027: Mon–Sat 09:00–18:30, 45-min break, standard 31500s)
- **Clock In / Start Break / End Break / Clock Out**; full shift timeline auto-saved.
- **Live HH:MM:SS timer** (count up), continues on navigation, stops only on explicit End, **turns
  amber on overtime**, updates at 60 FPS with **zero main-thread jank and no re-render of unrelated
  dashboard widgets** (currently violated — global store ticks every second).
- **Calendar heatmap history**; click date → clock-in, breaks, clock-out, total hours, projects, tasks.
- **Admin:** company-wide attendance; filter by date/dept/person; click any date/person for summary.
- **HR:** today's employee shift status; filter present/absent/late; weekly/monthly graph per
  employee; manual correction of own team only.
- **Late badge** if clock-in > start_time + **10-min grace** (grace currently not applied — CRB-3).
- **Forgot-clock-out** → `has_open_shift` flag + HR alerted → manual correction → re-reconciles
  (no auto-out). **Cross-midnight** attributed to clock-in date.
- **Export** as Excel (queued, Bearer-authenticated).
- **Offline:** timer runs locally + syncs on reconnect (Server-Validation conflict strategy).
- **Reminder scheduler:** employee alerted 15 min before start; HR alerted 30 min after start if not
  clocked in; times configurable.
- **Performance:** one-tap clock in/out/break from dashboard with optimistic confirmation (≤2 clicks,
  no reload, instant UI feedback). Lists virtualized, INP ≤200ms. HR/Admin "today" view ≤200ms p95 +
  render from cache on revisit.
- **CRITICAL:** break punches currently 404 (CRB-2) — `/attendance/break-start` is built from the
  type but the route is `/attendance/start-break`. Must align.

### 6.3 Leave & approvals (DR-028)
Types casual/sick/earned/unpaid; no balances/quotas at M1. Approval state machine
(Submitted→Pending→Approved/Rejected) — reused by tasks/projects via the polymorphic `approvals` table.
- Employee requests → HR approves/rejects. HR requests → Admin approves/rejects with reason.
- Leave history with status badges. Duplicate-overlap rejected. Holiday calendar view.
- **Leave→attendance integration:** approved leave marks attendance_days for **Mon–Sat only**
  (skip Sundays + recurring holidays) as status `leave` (currently fragile dayOfWeek logic — CRB-5).
- Approvals surface in bell + Notification Center. Submitter notified on decision
  (`ProcessApprovalDecision` listener currently NOT registered — CRB-6).

### 6.4 Projects & tasks
Project CRUD (name, description, priority, deadline, team) — Admin/HR. Team auto-grants project +
task list + project-chat access. Sort by created/deadline/priority. Task create/assign
(individual/team/company-wide); priority Low/Med/High/Urgent; due + reminders; scope
Global/Department/Role; dependencies (B blocked-until-A-done); per-task comments; per-item activity
log. **Kanban** (To Do/In Progress/Under Review/Done, dnd-kit, optimistic status + debounced persist)
+ list view + inline editing. QA form builder (HR/Admin). Project work timer per project. Recurring
tasks (daily/weekly-on-days/monthly-on-date). Quick Task Assignment widget → Global Chat notify on
completion. Task submit → HR/Admin review → approve/request redo. Project submit (completion report)
→ HR review. Gantt/Timeline (HR/Admin). Personal Task List (My Tasks). Saved views / custom columns.
> **Current gaps:** no capability checks on `/projects`/`/tasks` (CRB-9), `grid-cols-15` non-standard
> breaks Gantt (UX-13), task-detail Sheet's comments don't refetch.

### 6.5 Chat & notifications
4 chat types over Reverb: **Global** (all), **Project** (team, task alerts auto-posted), **Direct**
(1:1), **Custom Group** (HR creates). @mentions w/ dropdown + notify. DM read receipts. Pin messages
(HR in project chats). Read/unread = colored left border + count badge, marked read on open.
Image/file sharing (limits). Offline = "Not connected" + queue. Mobile = list-first, full-screen
conversation, fixed bottom input. **Notification system:** bell w/ unread count (high-priority +
system-global only), history, mark-as-read; Notification Center (inside Chat) for leave/task/project
submissions, announcements, holiday reminders, feedback. **Announcement board:** Admin company-wide /
HR team-level; pin; **reactions only (one per person — not built)**; dashboard display closeable;
notify on post. **Quick Notes** (private sticky; pin to dashboard). **Employee complaint/feedback**
(private form on Profile → DM to HR/Admin + high-priority global notification).
> **Current gaps:** ChatController has SQL scoping bug (CRB-10) and no participant check on
> sendMessage (CRB-11); `conversation.{id}` channel not authorized in `routes/channels.php` (CRB-12);
> broadcasting disabled by default (CRB-13); directory "Send Message" navigates to chat but chat page
> doesn't read `?conversation=` (UX-7).

### 6.6 Reports & exports
Attendance / project-completion / task-completion / employee-productivity reports (Admin full;
HR team-limited). Export as Excel (tables) and PDF. Weekly summary auto-emailed to Admin every Sunday
(scheduler). Saved views; filters via shared FilterBar; virtualized large datasets. Heavy reports
queued/streamed (>500ms → queue).
> **Current gaps:** unguarded `/reports/*` (CRB-9); `ReportController` `'on_leave'` vs `'leave'`
  mismatch → leave days always 0 (CRB-14); `Project::owner` relationship doesn't exist (CRB-15);
  `GenerateReportJob` references missing blade view `reports.pdf` (CRB-16); Sunday summary command
  duplicated.

### 6.7 Settings & audit
Company profile (logo, name, timezone), standard working hours, holiday calendar, password policies,
session/device rules, notification preferences, configurable reminder times (Admin only; HR view).
Audit log: every important action (who/what/when), filterable, exportable. Production monitoring:
Sentry + Laravel Pulse wired. Performance audit vs targets.
> **Current gaps:** `policies-config.tsx` and `reminders-config.tsx` call `GET /settings` which 404s
> (must be `/settings/grouped`) — both tabs dead (UX-19); `HolidayController::Cache::flush()` wipes
> entire cache (PERF-9); password-policy/session settings keys mismatch between seeder and
> AuthController (CRB-17).

### 6.8 Profile (all roles)
View/edit photo (popup w/ format+size limits → Supabase Storage), name, phone, designation; change
password; view logged-in devices; remote + current-device logout.

---

## 7. Existing implementation that WORKS (preserve, do not rebuild)

> These are verified-correct. Reuse them. Do not duplicate.

### Backend
- **Auth flow:** login / refresh / roleSelect / lockout (5/600s) / suspicious-login notify / token
  rotation / reuse-revocation (`AuthController`).
- **Capability keys canonical:** `attendance.clock-self`, `leave.approve-employee`, etc. (seeded).
- **AttendanceService:** event-sequence validation, `client_id` dedupe, `reconcileDay`, `now()` drift
  fixed, `has_open_shift` flagging. Cross-midnight attribution to clock-in date (mostly correct).
- **Scheduler:** RemindShiftStart, AlertMissedClockIn, FlagOpenShifts (every 5 min) + weekly summary
  (Sunday 09:00) + sanctum prune (daily) — registered in `routes/console.php`.
- **AttendanceController:** HR scoping (own dept); `correct()` calls `reconcileDay` after write.
- **ApprovalService:** state machine + role routing (HR→super_admin, employee→hr); fires
  `ApprovalSubmitted`/`ApprovalDecided`.
- **Leave endpoints:** index/store/decision/show/history/pending (HR-scoped).
- **DirectoryController::sendMessage:** creates real conversation row; visibility rules
  (`blood_group` etc. always hidden) — but visibility KEY mismatch (see CRB-18).
- **ProfileController::uploadAvatar:** Supabase Storage, 2MB limit, audit-logged.
- **DepartmentController** (archive/restore/storeTeam/destroyTeam/export, in-use guard) and
  **DesignationController** (updateStatus activate/deactivate, in-use guard) — `$fillable` fixed.
- **NotificationController:** read/markRead/markUnread/unreadCount/markAllRead.
- **PinController, QuickNoteController, SavedViewController, FeedbackController:** scoped by user.
- **Models + 40+ migrations** cover the full data model (see §9).
- **Cursor pagination** consistently used on attendance/users/departments/leave/audit list endpoints.

### Frontend
- **`auth-store.ts`:** Zustand + persist (`g4k-auth`); sets `g4k_token` cookie for middleware;
  refresh on 401; redirect on auth endpoints correctly skipped.
- **`api-client.ts`:** 401 interceptor skips auth endpoints; offline-queues mutations; 5xx GET retry.
- **`providers.tsx`:** light default, TanStack Query persisted to IndexedDB, Toaster top-right 4s.
- **`globals.css`:** FROZEN-compliant (Inter+Sora, `#F7F7FB` light, brand palette, dark mode) —
  except the `--color-muted` token map bug.
- **Sidebar:** collapse persists to `/auth/preferences`; Ctrl+B works; per-module accent colors;
  mobile bottom nav (5 icons).
- **`DataTable`:** virtualized (`useVirtualizer`); used by users/departments/designations/org-attendance.
- **`AttendanceHistoryCalendar`** (heatmap) + **`HrAttendanceGraph`** wired; calendar has month nav.
- **`holiday-calendar.tsx`:** month-view with month nav.
- **Attendance export pattern:** Bearer-header `fetch` + blob (correct in `hr-attendance-table.tsx`,
  `admin-attendance-table.tsx`, `admin-open-shifts-table.tsx` — but NOT in users/departments/
  designations/audit which use the wrong token store).
- **HR attendance components** call `/attendance/hr/today` correctly (CRIT-4 was fixed).
- **Directory Send Message** navigates to chat (GAP-3 half-fixed — chat page must read the query param).
- **Bulk actions** wired on users page (GAP-7 fixed).
- **HR analytics cards + department filter** present (GAP-11/12 fixed).
- **TimeClockWidget** has error state + retry (GAP-13 fixed).
- **AdminOpenShiftsTable "Notify HR"** wired to real endpoint (GAP-8 fixed).

---

## 8. Verified bugs & gaps (the complete list — drives `fix-3.md`)

> Severity: **CRB** = critical, **HIG** = high, **MED** = medium, **LOW** = low. Each has a stable ID
> referenced in `fix-3.md`. File:line evidence is in the audit agent reports; abbreviated here.

### CRITICAL (CRB)
- **CRB-1 — `RequireCapability` middleware OR-logic broken** (`RequireCapability.php:46-62`). The
  pre-check uses the full `a|b` string against `hasCapability` (exact `in_array`) → always 403 for
  non-super_admin before the `explode('|')` loop runs. **Effect:** HR cannot correct attendance;
  any `a|b` middleware fails for HR/Employee. Also spams audit log.
- **CRB-2 — Break punches 404.** `offline-engine.ts:163` builds `/attendance/${type.replace('_','-')}`
  → `/attendance/break-start`, but routes are `/attendance/start-break` and `/attendance/end-break`.
  Start/End Break always fail; failures silently swallowed (`offline-engine.ts:174-178`).
- **CRB-3 — Grace period never applied to "late".** `AttendanceService::reconcileDay` late calc
  doesn't honor `grace_minutes` (10 per ADR-027). Also early-arrival edge case miscomputes. Duplicate
  grace columns history (`grace_period_minutes` vs `grace_minutes`) — final schema is `grace_minutes`
  only but the drop migration assumes the column exists.
- **CRB-4 — `CompanyController` entirely empty stubs** (`CompanyController.php:1-48`). Live
  `apiResource('companies')` routes return empty responses.
- **CRB-5 — `LeaveAttendanceIntegration` dayOfWeek logic fragile.** Uses `dayOfWeekIso OR dayOfWeek`
  with `working_days=[1..6]` — works only if seeded as ISO; breaks if anyone uses 0-6 convention.
  Also loads ALL holidays (no year filter); overwrites existing `present` days to `leave` without audit.
- **CRB-6 — `ProcessApprovalDecision` listener never registered.** `AppServiceProvider.php:24-25`
  registers only `NotifyApprovalSubmitted` + `LeaveAttendanceIntegration`. Submitter is never notified
  of approval decisions (only the realtime `ApprovalDecided` event fires). Also `NotifyApprovalSubmitted`
  + `LeaveAttendanceIntegration` declare `ShouldQueue` but are registered via `Event::listen` → run
  synchronously (not queued as intended).
- **CRB-7 — `ForcePasswordChange` middleware disabled.** `ForcePasswordChange.php:20` body gated by
  `if (false && …)`. Seed sets `must_change_password=true` for all 13 users but they can use the API
  freely. Same dead-`false` pattern in `auth-guard.tsx:49` and `login/page.tsx:72`.
- **CRB-8 — Notifications DataTable column `cell` signature wrong.** `notifications/page.tsx:69-132`
  defines `cell: (row) => row.x` but `DataTable` passes a `CellContext`. **Entire notifications table
  renders empty cells.**
- **CRB-9 — Unguarded routes.** `/reports/*`, `/projects/*`, `/tasks/*`, `/qa-forms/*`, `/timer/*`,
  `/saved-views`, `/conversations/dm`, and the duplicate `/leave-requests/pending` (declared at
  `api.php:116-124` WITH guards AND again at `api.php:206-213` WITHOUT) have **no capability
  middleware**. Anyone authenticated can CRUD projects/tasks, run/export org-wide reports, open DMs
  with anyone, etc. `ProjectController`/`TaskController`/`ChatController`/`ReportController` also have
  **no in-controller authz or ownership scoping**.
- **CRB-10 — `ChatController::index` SQL scoping bug.** `orWhere('scope','global')` without
  parentheses against the `whereHas` → the OR applies to ALL rows → anyone sees every global + direct
  conversation regardless of membership.
- **CRB-11 — `ChatController::sendMessage` no participant check.** Any authenticated user can post
  into any conversation by id. `messages()` also has no membership check.
- **CRB-12 — `conversation.{id}` channel not authorized.** `routes/channels.php` only authorizes
  `private-user.{id}` and `presence-org`. Subscribing to `private-conversation.{id}` → 403 from
  `/broadcasting/auth`. (`public-announcements` is public, OK.)
- **CRB-13 — Broadcasting disabled by default.** `config/broadcasting.php:23` defaults to `null`;
  `.env.example` has no `BROADCAST_CONNECTION`/`REVERB_*` keys. Realtime layer dormant unless ops sets
  them. Also `ApprovalSubmitted` doesn't implement `ShouldBroadcast`.
- **CRB-14 — ReportController `'on_leave'` vs `'leave'` mismatch** (`ReportController.php:78`).
  `attendance_days.status` enum is `present/absent/late/leave`; query filters `on_leave` → leave days
  never counted.
- **CRB-15 — `Project::owner` relationship doesn't exist** (it's `creator`). `ReportController:23`
  eager-load `owner` silently ignored; `GenerateReportJob:84` `$p->owner?->name` null. Also
  `GenerateReportJob:117` reads `$u->role` and `department` (not eager-loaded) → N+1 + null.
- **CRB-16 — `GenerateReportJob` references missing blade view `reports.pdf`** →
  `ViewNotFoundException` on PDF export. Also uses local disk storage (inconsistent with Supabase
  avatar strategy).
- **CRB-17 — Settings key mismatches.** `AuthController` reads `password.min_length`,
  `password.require_mixed`, `session.access_token_ttl`, etc., but seeder writes
  `password_policy_min_length`, `session_ttl_minutes`, etc. → configured policies always fall back to
  defaults. Also job commands read `missed_clockin_alert_offset`/`shift_reminder_offset` not seeded.
- **CRB-18 — Directory visibility key mismatch.** `DirectoryController` reads
  `preferences['profile_visibility']` but `UserPreferenceController` writes `directory_visibility`
  → visibility always defaults to `internal`; public/private distinction dead.
- **CRB-19 — Notification inserts use nonexistent columns.** `AuthController:296,300` and
  `AdminPasswordResetController:49,73` insert `message`/`is_read` columns that don't exist on
  `notifications` → throws or silently drops.
- **CRB-20 — `saved_views` defined twice with conflicting schemas.** Phase-7 migration creates it
  (`entity`/`name`/`config`, wrapped in `if !Schema::hasTable`); phase-9 creates it again
  unconditionally (`report_key`/`name`/`configuration`) → migrate fails on clean DB. `SavedViewController`
  writes the phase-7 shape.
- **CRB-21 — `audit_logs` has no `created_at`/`updated_at`** (only `at`), but `DashboardController:56`
  `orderBy('created_at')` throws.

### HIGH (HIG) — UX/shell
- **UX-1 — Search bar present in top bar** (`layout.tsx:387-399`). Spec: removed.
- **UX-2 — No Start Shift button; TopbarTimer returns null until active** (`topbar-timer.tsx:12`,
  `layout.tsx:403`). Spec: icon-only Start Shift button with centered icon.
- **UX-3 — Notifications is a small end-anchored popover** (`notifications-bell.tsx:160-170`). Spec:
  centered modal/popup with background, close button, Clear action, Mark-as-Read action, recent.
  **No Clear, no popup-only-clearing-that-preserves-Chats.**
- **UX-4 — No Announcement nav item** (distinct icon missing). Required item.
- **UX-5 — Sidebar only 2-state** (`ui-store.ts:5,34-41`; `layout.tsx:217`). Spec: 3-state
  (hidden/collapsed-default/expanded).
- **UX-6 — Sidebar chevron clipped by `overflow-hidden` ancestor + invisible `text-muted`**
  (`layout.tsx:299-306,303,216`). Unreliable toggle.
- **UX-7 — Wrong logo asset both states; `landscape-logo.png` unused; no hover transition; control
  not left of logo** (`layout.tsx:224-231`). Spec: collapsed=1:1 square logo w/ hover transition to
  control; expanded=landscape logo w/ control on its left.
- **UX-8 — Nav labels wrong:** "Attendance"/"Chat & Hub"/"Profile" vs required "My Attendance"/
  "Chat"/"My Profile".
- **UX-9 — Widget drag opens widgets** (`widget-engine.tsx`; `admin-today-attendance-widget.tsx:27`
  absolute `<Link>` overlay at z-10; `hr-team-attendance-widget.tsx:76-84`). No drag-state tracking.
- **UX-10 — Dashboard flicker / unstable hover.** `getWidgetsForRole()` returns a new array every
  render → `widget-engine.tsx:76` `useEffect([availableWidgets])` refetches preferences + resets
  `loading=true`/`mounted=false` on every parent re-render.
- **UX-11 — Quick Notes (and all widgets) lack collapse/expand** (`quick-notes.tsx`). `Collapsible`
  primitive exists but unused.
- **UX-12 — Announcement likes feature entirely missing.** Schema (`reactions` polymorphic +
  announcements.reactions JSONB) ready; no controller route, no UI, no one-per-person enforcement.
- **UX-13 — `grid-cols-15` non-standard breaks Gantt** (`gantt-view.tsx:18,34`). Tailwind ships 1-12.
- **UX-14 — `GET /settings` 404s.** `policies-config.tsx:18` + `reminders-config.tsx:18` → both
  Settings tabs dead (must use `/settings/grouped`).
- **UX-15 — Token-storage inconsistency breaks exports.** Users/Departments/Designations use
  `localStorage.getItem('token')` (wrong key); Settings/Audit use `localStorage.getItem('g4k_token')`
  (also wrong — token is in Zustand + `g4k_token` cookie); attendance components correctly read
  `document.cookie`. **Users/Departments/Designations/Audit/logo-upload exports send `Bearer null`
  → 401.**
- **UX-16 — User Create dialog missing Phone input** (`users/page.tsx:516-518` empty `<div/>`); Edit
  has it.
- **UX-17 — `auto-numbering-config.tsx:16-19` assumes bare array but `apiResource` wraps `{data}` →
  `records.map` crashes.
- **UX-18 — `/leave-requests/export` doesn't exist** (`org/leave/page.tsx:97` `window.location.href`
  relative + no auth) → 404.
- **UX-19 — `AnnouncementController` incomplete** (index/store only; no update/destroy/pin/unpin/
  toggleReaction despite migration supporting `pinned_at`/`reactions`).
- **UX-20 — Mobile bottom nav item set wrong** (Dashboard/Directory/Attendance FAB/Leave/Profile) —
  no Chat/Announcement/Projects vs required set.

### HIGH (HIG) — Performance (PERF) — "always loading" / slow root causes
- **PERF-1 — Double retry layer compounds.** React Query `retry:3` w/ exp backoff to 30s
  (`providers.tsx:44`) AND `api-client.ts:44` GET retry:3 w/ 500ms/1s/2s backoff. Flaky backend →
  widgets stuck in `isLoading` up to ~2 min.
- **PERF-2 — `getWidgetsForRole()` new array every render → preferences refetch loop** (UX-10) —
  resets widget loading on every parent state change.
- **PERF-3 — Global timer store ticks every second** (`timer-store.ts:tick`) → every subscribed
  component re-renders every second. Violates R5.14 (timer must NOT trigger re-renders of unrelated
  widgets). Must be isolated (rAF/1s in a dedicated component, ref-based, not global store).
- **PERF-4 — No virtualization on several lists** (projects, tasks, audit, leave, chat conversation
  list when large). R13.14 requires virtualization >100 rows.
- **PERF-5 — No realtime consumption in widgets.** No `refetchInterval`, no Reverb subscriptions in
  dashboard widgets (announcement board doesn't listen to `AnnouncementCreated` broadcast). Global
  `staleTime` 5 min → stale data + manual reload needed.
- **PERF-6 — Inline/sync exports** (attendance/users/departments/designations stream inline in the
  request cycle) → worker holds, timeouts on large data. Only `ReportController::export` queues.
- **PERF-7 — `HolidayController::Cache::flush()`** wipes ENTIRE cache (capabilities + dashboard +
  settings) on every holiday CRUD. Should be targeted `Cache::forget`.
- **PERF-8 — Double broadcast of notifications.** `NotificationService::send` fires
  `NotificationCreated` AND `NotificationObserver::created` fires it again → every notification via
  the service is broadcast twice.
- **PERF-9 — Inconsistent widget staleTime** (metric/recent 30s; announcement/quick-notes/feedback/
  hr-team inherit global 5min). Loading UI inconsistent (some skeletons, some bare Loader2, some none
  → empty state indistinguishable from loading).
- **PERF-10 — `widget-engine.tsx` saves layout on every `onLayoutChange`** (no debounce, no diff)
  → extra network write on every RGL compaction event.
- **PERF-11 — `TimeClockWidget` uses local `useState` instead of React Query** → no caching, no
  background refetch; reload always full spinner. Inconsistent with the rest.
- **PERF-12 — `export-history.tsx` `refetchInterval:5000`** polls forever even when no jobs processing.
- **PERF-13 — Audit logging synchronous** in every mutating request (`AuditLogger`) — adds latency
  to attendance punches / chat messages. Should queue.
- **PERF-14 — Unbounded `->get()`** on announcements/quick-notes/qa-forms/pins/saved-views index
  (no pagination).
- **PERF-15 — N+1 risks:** `ApprovalService` + many controllers run
  `DB::table('role_assignments')->where('user_id',…)->pluck('role')` on every approval/leave (no
  cache). `ReportController::attendanceSummary` runs 6 subqueries per user live.

### MEDIUM / LOW (selected — full list in fix-3.md)
- Calendar still forces horizontal compression on mobile (GAP-10 partial).
- `Button` `[&_svg]:size-4` forces icon sizes → spill risk.
- `EmptyState` autoplays `/animated-logo.mp4` in metric cards (noisy).
- `mr-1/mr-2` instead of `gap-2` in several places (notifications/admin-attendance).
- Dead imports (`Globe`/`Plus` chat, `Skeleton` admin-attendance, `dropdown-menu` saved-views,
  `AlertDialogTrigger` time-clock).
- Many dialogs/sheets missing `DialogDescription`/`SheetDescription` (Radix a11y warning).
- `directory/page.tsx:330` hard-coded `"G4K001"` fallback.
- `org/leave` + `leave-history-table` pass no-op search to FilterBar.
- `task-detail-sheet.tsx:62` returns null before Sheet mounts → abrupt close.
- `project-card.tsx` onClick never passed → dead affordance.
- Kanban empty columns show nothing; horizontal scroll on mobile instead of card-stack.
- `auto-numbering`/`companies` `apiResource` declares full CRUD but controllers only implement
  index/update → store/show/destroy throw.
- `DashboardController:99,108` `Schema::hasTable` at runtime; employee `active_projects` hard-coded 0.
- `TimerController::index` no ownership filter.
- `UserPreferenceController` catches Throwable and leaks file/line in JSON.
- `AdminPasswordResetController` routes use `ability:role:super_admin` (works but bypasses capability
  matrix).
- OpenAPI spec stale: lists dead `/org/*` paths; missing many live routes
  (`/attendance/sync`, `/notifications/unread-count`, `/admin/password-resets/*`, `/reports/*-summary`,
  `/users/bulk`, `/users/{id}/status`, etc.).
- Dead `IndianHolidaysSeeder` never invoked; `LeaveRequestsDemoSeeder` bypasses ApprovalService →
  demo leave rows invisible to HR/Admin (no `approvals` row) + no attendance integration.
- Mobile hamburger is a 280px Sheet, not full-screen menu.
- `Auth Guard` loading skeleton shows expanded sidebar (264px) — won't match collapsed default.

---

## 9. Data model (key tables)

`users`, `personal_access_tokens`, `role_assignments`, `capabilities`, `role_capabilities`,
`companies`, `company_profile`, `departments`, `teams`, `designations`, `auto_numberings`,
`pins`, `dashboard_layouts`, `work_schedules` (Mon-Sat 09:00-18:30, 45m break, 10m grace),
`attendance_events`, `attendance_days`, `attendance_corrections`, `approvals` (polymorphic),
`leave_requests`, `holidays`, `notifications`, `projects`, `project_members`, `qa_forms`,
`qa_form_fields`, `qa_submissions`, `tasks`, `task_comments`, `task_activity`, `task_time_logs`,
`saved_views`, `conversations`, `conversation_user`, `messages`, `conversation_message_reads`,
`reactions` (polymorphic), `announcements`, `quick_notes`, `feedback`, `report_definitions`,
`export_jobs`, `scheduled_reports`, `settings`, `audit_logs`, `login_attempts`,
`password_reset_requests`, `pulse_*` (Laravel Pulse), `cache`, `jobs`.

**Missing indexes (MEDIUM):** `task_time_logs.log_date`, `messages.conversation_id`,
`notifications.created_at`, `audit_logs.subject_id` (only composite). `users.work_schedule_id` has
no FK constraint. Two sources of truth for `theme_mode`/`density` (a `users` column AND the
`preferences` JSON). `'admin'` role referenced in jobs/commands but never seeded and not in the
`approvals.current_approver_role` enum.

---

## 10. Performance standards (FROZEN — `PERFORMANCE-STANDARDS.md`, 30 P-* IDs)

**Page-load:** LCP ≤2.5s p75 / ≤2.0s lab; FCP ≤1.8s; TTFB ≤600ms web / ≤800ms api.
**Interactivity:** INP ≤200ms p75; CLS ≤0.1.
**Navigation:** cached route ≤100ms first frame; stale-while-revalidate (no spinner for cached data).
**API:** p95 ≤200ms read / ≤300ms write; heavy reports queued/streamed.
**DB:** zero N+1; ≤5 SQL per list request; cursor pagination; every filtered/joined/ordered column indexed.
**Bundle:** First-Load JS ≤200KB gz/route; route chunk ≤350KB gz; all routes lazy-loaded; heavy libs
(ECharts/Tiptap/dnd-kit/xlsx/Gantt/calendar) dynamically imported + idle-prefetched.
**Assets:** all images via `next/image`; fonts self-hosted+subset+swap ≤2 families preloaded.
**Cache:** per-entity staleTime/gcTime; ETag/Cache-Control on safe GETs; backend route/config/OPcache
+ query cache for hot reference data.
**State:** Zustand UI-only (slice selectors); TanStack Query `select` for derived; no API data in Zustand.
**Render:** memoized rows + stable keys; no anonymous callbacks in hot-list props; virtualize >100 rows.
**Search:** debounced 250ms server-side (client ≤200 rows); filter changes update URL+cache, no reload.
**Forms:** inputs ≤16ms; validation on 400ms pause; submit disabled+loader; autosave non-blocking.
**Background:** work >500ms → Laravel queues; frontend heavy work in web workers / chunked (no task >50ms).
**UX states:** no full-screen spinner where a skeleton fits; partial/cached shows immediately; per-widget
error boundaries; optimistic UI for safe mutations (rollback on error); offline banner + queued mutations.
**Responsive:** fluid 360→1920; tables→cards on mobile; bottom nav ≤5; ≥48px touch targets.
**A11y:** WCAG 2.1 AA; axe-core clean; Ctrl+K/N//Esc/Enter.
**Data entry:** frequent workflows ≤2 clicks, no reloads, optimistic confirmation.
**Cross-module:** breadcrumbs/deep-links/recently-viewed; no redundant refetch of shared cached data.
**Memory:** no unbounded caches; listeners/workers/object URLs cleaned on unmount.
**Build:** tree-shake/minify/vendor split/no prod sourcemaps; React prod build.
**Monitor:** Sentry (errors+perf) + web-vitals field + Laravel Pulse; p75 within targets 7 consecutive
days before M1 freeze. **CI performance budgets as guardrails** — regression fails the build.

---

## 11. Important decisions & constraints (ADRs, abridged)

ADR-012 Postgres/Supabase · ADR-013 Reverb (not Supabase Realtime) · ADR-014 Sanctum Bearer ·
ADR-015 single-company · ADR-016 monorepo · ADR-017 no AI features in M1 · ADR-018 performance-first ·
ADR-019 rebuild-to-spec · ADR-020 seed source = `data-prefill-reference.txt`, role-specific passwords,
`must_change_password=true`, Asia/Kolkata · ADR-021 login = username OR email OR employee_id ·
ADR-022 ~~M1 cutoff Base+Attendance+Leave~~ (now stale — all modules built) · ADR-023 vibrant-on-white ·
ADR-024 3-state sidebar · ADR-025 direct-to-production deploy · ADR-026 access token 15min in-memory +
refresh 7-day HttpOnly cookie · ADR-027 attendance Mon-Sat 09:00-18:30, 45m break, standard 31500s,
cross-midnight to clock-in date, forgot-clock-out = open shift + manual correction · ADR-028 leave
casual/sick/earned/unpaid, no quotas M1 · ADR-029 file storage = Supabase Storage · ADR-030 single
timezone Asia/Kolkata (UTC stored, converted for display/day-boundary/late).

---

## 12. Constraints, dependencies & non-goals

- **M1 = Web only.** Windows/Tauri (M2) and Android/Compose (M3) reuse Core Platform + `packages/ui`.
- **No AI product features** in M1. **English only.** **No multi-tenant scoping** (single company).
- **No mock/placeholder data** anywhere — real empty states when empty.
- **Credentials** (per `GUIDE-CREDENTIALS.md`): GitHub, Supabase (staging+prod), Railway, Vercel, SMTP,
  Sentry — managed via Railway/Vercel env vars; `.env.local-secrets` gitignored.
- **Railway must rebuild** from the root `nixpacks.toml` (PHP 8.4, `cd apps/api`); the historical
  login-404 chain (duplicate routes + missing root nixpacks + PHP 8.3 vs 8.4 + BOM Procfiles) was
  fixed in commits `05b3b6a` + `475be06` — do not reintroduce.

---

## 13. How to use this file

- **Before building anything:** read this file → the relevant module in §6 → the matching
  `fix-3.md` phase → the frozen OpenSpec docs for exact tokens/components.
- **Reuse first:** §7 lists what already works. Do not rebuild it.
- **Don't reintroduce fixed bugs:** §12 (Railway/login chain) and the "CONFIRMED FIXED" items.
- **Every change must** honor the capability model (§2), the design system (§4), the component
  catalog (§5), and the performance standards (§10). A regression fails CI.
- `fix-3.md` is the exhaustive, ordered, dependency-aware checklist that reaches the final state
  described here. Completing every checkbox yields a fully wired, polished, responsive, fast,
  consistent, accessible, deployment-ready application.
