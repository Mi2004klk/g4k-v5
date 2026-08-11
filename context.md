# context.md — Games4King Workplace OS: Single Consolidated Project Context (v2)

> **Purpose:** One authoritative map of the entire product, the CURRENT verified implementation
> state, and every verified finding from the full codebase audit. This is the source of truth
> future AI development reads first. `fix-4.md` is the actionable companion (the implementation plan).
>
> **Hierarchy of truth:** `context.md` (this — verified reality) → `fix-4.md` (what to change) →
> OpenSpec (`openspec/project.md`, `REQUIREMENTS.md`, `DESIGN-SYSTEM.md`, `COMPONENT-SYSTEM.md`,
> `PERFORMANCE-STANDARDS.md`, per-phase folders) for frozen contracts.
>
> **Audit date:** 2026-08-11 (v2 — re-verified after a major refactor). **Method:** every finding was
> verified by reading actual source. **This file supersedes the earlier v1 `context.md`** — a prior
> audit catalogued 21 CRB + 20 UX + 15 PERF bugs; a refactor since closed 38 of 39 of those. The app
> is now broadly **functional and wired end-to-end**; the remaining work is **performance
> (root-caused below), polish, consistency, and a small number of correctness gaps.** No code was
> modified during this audit.

---

## 0. TL;DR — where the project actually stands (v2)

- **Stack (frozen):** Laravel 13/PHP 8.4 + PostgreSQL (Supabase) + Laravel Reverb backend on Railway;
  Next.js 16 + React + TypeScript + Tailwind v4 + Radix/shadcn frontend on Vercel; shared
  `packages/ui` (43 components). Monorepo: `apps/web`, `apps/api`, `packages/ui`.
- **Build status:** code for ALL modules exists and is wired (Auth, Org, Attendance, Leave,
  Projects/Tasks, Chat/Notifications/Announcements/QuickNotes/Feedback, Reports, Settings/Audit).
  OpenAPI spec is reconciled with routes.
- **The previous "everything is broken" picture is OUTDATED.** A direct re-verification of 39
  previously-flagged items shows **38 FIXED, 1 STILL BROKEN** (settings key mismatch — see §8
  CORR-1). RBAC middleware OR-logic works; ForcePasswordChange is wired; chat scoping + membership
  checks work; Reverb channels authorize; reports are correct; migrations are clean; the shell
  (search removed, icon-only Start Shift, centered notifications modal with Clear that preserves
  Chats, 3-state sidebar, correct logos, required nav items, announcement one-per-person likes,
  Quick Notes collapse, Gantt fixed, DataTable cells fixed) is implemented.
- **The REAL problem the user is reporting** — "always loading, too slow, widgets always loading,
  can't use seamlessly even on a fast network" — has **specific, verified root causes** that were
  NOT captured before. They are almost entirely **frontend caching/state/rendering** issues, NOT
  broken endpoints. The biggest, in order:
  1. **`gcTime == staleTime` (both 5 min)** in `providers.tsx:42-43` — the moment a query goes stale
     it's also garbage-collected, so navigating away and back within 5 min shows a full skeleton
     again instead of cached data + background refresh. This single setting is the dominant cause
     of "widgets always loading."
  2. **`apiFetch` treats HTTP 5xx as "offline → queue mutation"** (`api-client.ts:~126`) and returns
     `{ queued: true }`, so a transient server error silently swallows the action and the UI behaves
     as if it succeeded/never finished.
  3. **`useReverb().subscribe` is a new function every render** (`use-reverb.ts:80-86`, not wrapped
     in `useCallback`) → effect re-subscription loops in every consumer → repeated
     `invalidateQueries` → refetch storms.
  4. **Duplicate/divergent query keys** hitting the same endpoint with independent polling: HR/Admin
     attendance pages fire 2–3 separate `/attendance/{hr|admin}/...` requests every 30 s; the HR
     dashboard widget uses yet another `["hr-attendance-today"]` key. `metric-widget` +
     `recent-activity-widget` share `["dashboard-metrics"]` (good) but `pending-approvals-widget`
     over-broadly invalidates it on every decision, re-skeletoning every metric on the dashboard.
  5. **Store subscriptions without selectors** — `useTimerStore()`, `useAuthStore()`, `useUIStore()`
     are destructured whole-store in ~20 components, so any state change re-renders all of them.
     The 1 s `LiveTimer` tick is local (acceptable), but `time-clock-widget` subscribes to 9 fields.
  6. **`widget-engine` gates the whole grid behind `width > 0`** and re-sets `loading=true` on mount
     while it fetches `/auth/preferences` (uncached) — blank/skeleton dashboard for a paint frame
     on every navigation to `/dashboard`.
  7. **`auth-guard` shows a full-screen skeleton** and its effect depends on `[pathname, token,
     user, ...]`, so navigation re-runs the gate; persisted Zustand auth means the token is usually
     already present, yet the skeleton still flashes.
  8. **Backend `DashboardController::metrics`** calls `Schema::hasTable()` 4× per request, caches per
     user/role/day for only 30 s → frequent full recomputes.
  9. **Full-card skeletons** everywhere instead of keep-previous-data + a subtle `isFetching`
     indicator; **MetricWidget re-runs its 600 ms count-up animation** on every background refetch
     (`metric-widget.tsx:43-62`), making numbers visibly "re-count" repeatedly.
  10. **`react-grid-layout` is statically imported** into the dashboard chunk; ECharts/dnd-kit are
      already dynamic (good).
- **Verdict:** the app is a working product hampered by a cluster of caching/rendering
  misconfigurations. None of them require rebuilding features — they are localized fixes. `fix-4.md`
  is the ordered checklist; completing Phases 1–3 alone (caching, request dedup, render isolation)
  will eliminate the "always loading" complaint.

---

## 1. Product vision & scope

**Games4King Workplace OS** — enterprise company-management platform for a single company (Games4King,
a game-development studio). Three system roles: **Super Admin** (Karthik), **HR** (Aravind),
**Employee** (13 seeded employees). Inspired by ClickUp/Linear/Notion/Slack — vibrant but
professional, fast, offline-first, responsive + PWA.

- **Single-company deployment** (no multi-tenant scoping). **M1 = Web only** (Windows/Tauri = M2,
  Android/Compose = M3 — same Core Platform, different clients).
- **Brand:** derived from the logo — violet→magenta gradient, gold crown/stars, cartoon king.
  Tone: vibrant on white, disciplined semantic data colors. English only (M1).
- **Qualities:** speed, rich micro-interactions, offline-first, cross-platform consistency,
  long-term maintainability. Every frequent workflow targets ≤2 clicks, no reloads, optimistic UI.

### Modules (all have working code present)
| # | Module | Capability key |
|---|---|---|
| 1 | Auth & sessions | `authentication` |
| 2 | Users, roles & org | `org-management` |
| 3 | App shell & design | `app-shell` |
| 4 | Dashboard & widgets | `dashboards` |
| 5 | Attendance | `attendance` |
| 6 | Leave & approvals | `leave-approvals` |
| 7 | Projects & tasks | `projects-tasks` |
| 8 | Chat & notifications | `communication` |
| 9 | Reports & exports | `reporting` |
| 10 | Settings & audit | `system-settings` |

---

## 2. Roles, capabilities & permissions

### 2.1 Three system roles (only three)
| Role | Seed user | Scope |
|---|---|---|
| **Super Admin** | `karthik` / `Admin@123` | Full control; company-wide |
| **HR** | `aravind` / `Hr@123` | Own-department scoping; leave approvals for employees; attendance oversight |
| **Employee** | `praveen` / `Dev@123` (+12) | Own work, attendance, comms |

The **15 "roles" in seed data are DESIGNATIONS** (Senior Game Developer, Designer, QA Tester, etc.)
— NOT permission roles. A **dual-role user** sees a **Role Selection screen** after login. Seed sets
`must_change_password = true`; `ForcePasswordChange` middleware reads the `security.
force_password_change` setting (default disabled) and returns a structured 403 when enabled.

### 2.2 Capability model (the only permission model)
Capabilities are granular strings granted to roles via `role_capabilities`, loaded by
`CapabilityMatrix` (cached 3600s/role; `super_admin` short-circuits via `*`). Seeded capabilities:
`*`, `attendance.clock-self`, `hr.view-team-attendance`, `admin.view-all-attendance`,
`admin.correct-attendance`, `attendance.correct-team`, `leave.request-self`, `leave.approve-employee`,
`leave.approve-hr`, `settings.manage`, `audit.view`, `users.hr.manage`, `users.employee.manage`,
`departments.manage`, `designations.manage`, `directory.view`, `directory.send-message`, `profile.edit`,
`projects.view`, `projects.manage`, `tasks.view`, `tasks.manage`, `qa.view`, `qa.manage`,
`timer.track`, `chat.access`, `reports.view`, `reports.manage`.

**`RequireCapability` middleware is now correct** (`RequireCapability.php:55-73`): splits on `[|,]`,
grants on any match, super-admin short-circuits, no audit-log spam. Route-level guards are applied
to all modules (attendance, leave, projects, tasks, qa, timer, saved-views, chat, reports, settings,
audit, users, departments, designations, companies, auto-numberings, holidays-write).

### 2.3 M1 capability matrix (intended & enforced)
| Area | Super Admin | HR | Employee |
|---|---|---|---|
| Dashboard | full company | team | personal |
| Org: users | full CRUD, roles, reset pw, deactivate, activity | view team, limited | — |
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
PostgreSQL via Supabase · spec-first OpenAPI (`openapi/openapi.yaml`, reconciled with routes) ·
Sanctum Bearer tokens (access + 7-day sliding refresh in HttpOnly cookie, ADR-026) · Laravel Reverb
(private/presence/public channels; `BROADCAST_CONNECTION=reverb` by default) · Queue/Scheduler/
Events/Cache. Backend owns ALL business logic, auth, validation, workflows, notifications, offline
sync, reporting. Frontend never touches DB logic.

### Frontend — `apps/web` (Next.js 16.3)
React + TypeScript · Tailwind v4 · Radix UI + shadcn/ui (owned, in `packages/ui`) · TanStack Query
(server state, persisted to IndexedDB via `PersistQueryClientProvider`) + Zustand (UI state only) ·
TanStack Table + `@tanstack/react-virtual` · dnd-kit (kanban/lists) + React Grid Layout (dashboard
widgets only — never mixed) · React Hook Form + Zod · Apache ECharts (dynamic import) · Tiptap ·
Lucide · Motion · IndexedDB offline · Reverb via `pusher-js` (`useReverb` hook) · PWA manifest + SW.

### Shared — `packages/ui`
43 components (see §5). Consumed by `apps/web` and the future Tauri desktop client.

### Hosting
Backend → Railway (Laravel + queue/scheduler workers, root `nixpacks.toml`, PHP 8.4) · Frontend →
Vercel (Next.js) · Database → Supabase Postgres · VCS → GitHub (monorepo). Per-module live deploys.

### Architecture principles (immutable)
1. Performance-first (decided at architecture time, CI-enforced).
2. Offline-first (one shared Offline Engine; no per-module sync).
3. API-first / spec-first. 4. Capability-based permissions only.
5. Reusable components first. 6. No business logic in frontend; no client touches DB.
7. Layered; Core Platform thinking.

### State management (intended rules)
- **TanStack Query:** all API calls; per-entity `staleTime`/`gcTime`; `select` for derived;
  stale-while-revalidate on navigation (no spinner for cached data).
- **Zustand:** sidebar, theme, dialogs, selected items, filters, drafts. **Slice selectors only**
  (no whole-store subscriptions). **Rule: never store API data in Zustand.**
- **Offline Engine:** Queue → Sync Manager → Conflict Resolver → Retry Manager → Storage →
  Connectivity Monitor. Per-entity conflict resolution (Settings=LWW · Tasks=Version+Merge ·
  Attendance=Server Validation · Chat/Comments=Timestamp).

> **The performance problems in §8 are almost entirely violations/suboptimalizations of these
> intended rules** — the rules themselves are correct; the implementation needs tuning.

---

## 4. Design system (FROZEN — `openspec/DESIGN-SYSTEM.md`)

### 4.1 Tone & visual identity
**Vibrant-on-white** (ADR-023): clean white surfaces, multiple contextual colors across icons,
sidebar states, badges, cards, interactions; per-module accent colors; **gradients reserved for
sign-in hero, dashboard headers, and logo lockups only.** Charcoal `#1A1A2E` primary anchor. Brand
gradient `linear-gradient(135deg,#9400D3 0%,#8A2BE2 50%,#FF1493 100%)` — ONLY on sign-in hero,
dashboard headers, primary logo lockups, focus-ring brand moments. Gold gradient
`linear-gradient(135deg,#FFD700 0%,#FFA500 100%)` for premium/crown moments — never on body text.

### 4.2 Palette (exact hex)
**Brand accents:** violet `#8A2BE2`, violet-deep `#9400D3`, gold `#FFD700`, pink `#FF1493`,
orange `#F97316`, coral `#FF7F50`, red `#EF4444`, magenta `#D946EF`, blue `#3B82F6`, indigo `#6366F1`,
cyan `#06B6D4`, teal `#14B8A6`, green `#22C55E`, lime `#84CC16`, gray `#6B7280`.

**Per-module accent mapping:** Dashboard=Blue · Attendance=Green · Leave=Amber · Directory=Pink ·
Org=Indigo · Settings=Teal · Audit=Rose · Profile=Cyan · Notifications=Orange · Announcement=Megaphone.
**Chart palette (12):** Violet, Blue, Cyan, Teal, Green, Lime, Yellow, Amber, Orange, Red, Pink, Magenta.

**Semantic (data) colors:** success `#16A34A`/`#22C55E` (Approved/Completed/present) · info
`#2563EB`/`#3B82F6` (In Progress) · warning `#D97706`/`#F59E0B` (Pending/overtime/late) · danger
`#DC2626`/`#EF4444` (Redo/Rejected/Overdue/destructive) · neutral-status `#6B7280`/`#9CA3AF` (Not
Started) · overtime `#D97706`/`#F59E0B`. **Status pill map:** Gray=Not Started · Blue=In Progress ·
Amber=Pending · Green=Approved/Completed · Red=Redo/Rejected/Overdue.

### 4.3 Surfaces & neutrals
bg-app `#F7F7FB`/`#0F0F14` · bg-surface `#FFFFFF`/`#17171F` · bg-surface-2 `#FCFCFE`/`#1E1E28` ·
bg-elevated `#FFFFFF`/`#20202C` · border `#E6E6EF`/`#2A2A38` · border-strong `#D1D1DE`/`#3A3A4A` ·
text-primary `#14141C`/`#F4F4F8` · text-secondary `#4B4B5C`/`#A8A8B8` · text-muted `#8A8A9A`/`#6E6E80`.

> **Token note (low severity, but verify):** in `globals.css` `--color-muted` maps to
> `var(--bg-surface-2)` (a background token). Any `text-muted`/`border-muted`/`bg-muted` utility
> resolves to that. After the v2 refactor most problematic usages were removed, but grep remains
> warranted before final visual QA (see fix-4 VISUAL phase).

### 4.4 Typography
**Inter** (UI) + **Sora** (display/brand). Self-hosted, subset, `font-display: swap`, preloaded.
Scale: xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.25 / 2xl 1.5 / 3xl 1.875 / 4xl 2.25 / 5xl 3.
Weights 400/500/600/700/800. LH 1.5 body, 1.2 headings, 1.15 display.

### 4.5–4.7 Spacing / radius / elevation
Spacing 4px base (`0,1,2,3,4,5,6,8,10,12,16,24`). Card pad 5 (20px), section gap 8 (32px), page
gutter 6 (24px). Radius: sm 6 (inputs) · md 10 (buttons) · lg 14 (cards) · xl 20 (panels) · full.
Elevation: e1 rest · e2 hover lift · e3 dropdown · e4 dialog/drawer (+ backdrop blur).

### 4.8 Motion (defined once, reused)
Taps 120ms (compress 0.96) · hover 100ms · tooltip/popover 150ms · sidebar glide 220ms
`cubic-bezier(.4,0,.2,1)` · drawer 200ms · dialog `ease-modal` `cubic-bezier(0.16,1,0.3,1)` ·
progress fill 600ms · list reorder 180ms · page transition 180ms · badge 150ms. **Primary button:**
default solid charcoal; hover = animated conic-gradient border (3s) + subtle glow; active 0.96;
loading = dot-loader; disabled 40%; **reduced-motion → static border.**

### 4.9 Sidebar (3-state — IMPLEMENTED)
`SidebarState = "hidden" | "expanded" | "collapsed"`, default `"collapsed"`, persisted + synced to
`/auth/preferences`. Chevron in the sidebar header (not clipped); correct logos (`/icon.png` 32×32
collapsed, `/landscape-logo.png` 140×32 expanded); visible colors (`text-neutral-500`/`hover:text-
primary`). Active item = violet-tinted bg + 3px brand-gradient left bar + weight 600; hover =
bg-surface-2; collapsed = icon + tooltip. Ctrl+B cycles. Mobile: hidden sidebar, hamburger opens a
left Sheet, bottom nav ≤5 (Dashboard/Projects/Attendance-FAB/Chat/Profile).

### 4.10 Required sidebar nav items — IMPLEMENTED
Dashboard, **My Attendance** (`CalendarCheck`), Projects, **Chat** (`MessageSquare`),
**Announcement** (`Megaphone`), **My Profile** (`UserCircle`), plus role-aware items (Org,
Leave, Reports, Settings, Audit).

### 4.11–4.12 Density & component states
Density comfortable (default)/compact, persisted. Every interactive component: rest/hover/
focus-visible (2px brand-violet ring, 2px offset)/active/disabled (40%)/loading/error.

### 4.13 Empty / loading / error states (no mock data, ever)
Skeletons shaped to content; empty states with specific copy + Lucide icon or cached
`animated-logo.mp4` + optional action; per-widget error boundaries. **HARD RULE: no mock data.**

### 4.14 Header — IMPLEMENTED
No search bar (removed). **Start Shift = icon+label button** (`topbar-timer.tsx:14-31`, Play icon,
no null-return). Header controls consistently sized/aligned. **Notifications = centered modal**
(`fixed inset-0 flex items-center justify-center`) with Clear (uses `clearPopupNotifications` →
only adds to `dismissedNotificationIds`, preserving server rows / Chats area), Mark-as-Read, close X.

### 4.15 Dashboard requirements — MOSTLY IMPLEMENTED
Announcement likes one-per-person (`/announcements/{id}/react`, toggle). No End Shift/Take Break
below announcements. Widget drag does NOT trigger click (drag-state + distance threshold + pointer-
events gate). Quick Notes collapse. Per-role widget composition. **Remaining gaps are performance
flicker/animation (see §8) and a few empty-state placeholders that should show real data.**

### 4.16 Accessibility (WCAG 2.1 AA)
Contrast 4.5:1 text/3:1 UI · full keyboard · visible focus · ARIA on icon-only buttons ·
`prefers-reduced-motion` ≤1ms · axe-core clean · shortcuts Ctrl+K/B/N///Esc/Enter · touch ≥44×44
(≥48 mobile attendance).

---

## 5. Component catalog (FROZEN — `openspec/COMPONENT-SYSTEM.md`)

`packages/ui/src/components/` ships **43 components**: accordion, alert-dialog, avatar (+AvatarGroup),
badge, breadcrumb, button, card, checkbox, collapsible, combobox, command-menu, command,
confirm-dialog, context-menu, data-table, dialog, dropdown-menu, empty-state, error-boundary,
file-upload-popup, filter-bar, form, help-overlay, inline-edit, input, label, offline-banner,
pagination, password-input, popover, progress, radio-group, scroll-area, select, separator, sheet,
skeleton, slider, sonner, switch, tabs, textarea, tooltip.

### Composition rules
Every screen composes ONLY from this catalog. Module composites (ClockInWidget, TaskKanbanBoard,
etc.) live in `apps/web` and compose `packages/ui` generics — never duplicate. DataTable = virtualized
TanStack Table + cursor pagination + row selection; FilterBar = shared (search debounced 250ms +
popovers + chips); StatusBadge; EmptyState (icon/video/action); Sonner toast (bottom-right, 4s —
**note: spec says top-right; current is bottom-right — see fix-4 VISUAL**).

### Component-level notes
- `Button` base includes `[&_svg]:size-4` → forces descendant SVG to 16px (can mis-size icons in
  tight buttons). Verify/scope in fix-4.
- `DataTable` internal infinite-scroll needs `fetchNextPage`/`hasNextPage` passed; fixed `h-[600px]`
  is non-configurable.
- `EmptyState` falls back to autoplaying `/animated-logo.mp4` when no icon/videoSrc — avoid inside
  small metric cards (pass an icon).
- `index.ts` exports `combobox` and `avatar` twice (harmless).

---

## 6. Workflows (day-to-day — all wired and verified working)

### 6.1 Auth & sessions
Sign-in (username/email/employee_id + password, show/hide, loading, error) → Role Selection
(dual-role) → ForcePasswordChange (when setting enabled) → Onboarding (if not `onboarded_at`) →
role dashboard. Forgot password via SMTP + Admin-approval. Account lockout (5/10 min). Suspicious-
login notify (correct columns). Per-device sessions + remote logout (Reverb `SessionRevoked`).
Reload → token persists (Zustand `g4k-auth` + `g4k_token` cookie + refresh cookie).

### 6.2 Attendance (DR-027: Mon–Sat 09:00–18:30, 45-min break, standard 31500s)
Clock In / Start Break / End Break / Clock Out (both route aliases `start-break`/`break-start` and
`end-break`/`break-end` exist; offline-engine maps types correctly). Live timer (LiveTimer
component, local 1s tick). Calendar heatmap (responsive ECharts). Admin company-wide; HR own-team
(today/graph/day/history/correction); late after 10-min grace; forgot-clock-out → `has_open_shift`
flag + notify HR; cross-midnight attributed to clock-in date (48h window). Export queued + Bearer
token. Reminder scheduler (RemindShiftStart, AlertMissedClockIn, FlagOpenShifts every 5 min).
**Performance gaps:** full-card spinner overlay on load; 9-field store subscription; duplicate
today-summary key — see §8.

### 6.3 Leave & approvals (DR-028)
Types casual/sick/earned/unpaid (no quotas M1). Approval state machine (ApprovalService, capability
+ role check, status synced in transaction). Employee→HR, HR→Admin. History + badges. Holiday
calendar. LeaveAttendanceIntegration (Mon-Sat via `dayOfWeekIso`, holidays year-filtered + recurring
m-d). `ProcessApprovalDecision` listener registered + queued (submitter notified on decision).
ApprovalSubmitted broadcasts. Notifications surface in bell + Notification Center.

### 6.4 Projects & tasks
Project CRUD (Admin/HR, capability-gated). Team auto-access. Task create/assign/priority/due/scope/
dependencies/comments/activity. Kanban (dnd-kit, dynamic parent) + list + inline edit. QA form
builder (full CRUD). Project work timer. Recurring tasks. Quick Task Assignment. Task/project
submit → review → approve/redo. Gantt (fixed via inline `gridTemplateColumns`). Personal Task List.
Saved views. **Minor gaps:** project card onClick, per-column empty states, mobile card-stack,
mutation onError toasts — see fix-4.

### 6.5 Chat & notifications
4 chat types (Global/Project/Direct/Group) over Reverb; `index` scoping correct (grouped where);
`messages`/`sendMessage` check `conversation_user` membership; `startDirectMessage` exists;
`conversation.{id}` channel authorized. @mentions, read receipts, pin, read/unread border+badge,
image/file sharing, offline queue. Bell + Notification Center; Announcement board (pin, one-per-
person reactions, dismissible, notify on post, Reverb `public-announcements`). Quick Notes.
Feedback → HR/Admin DM + high-priority notification. **Gaps:** message list virtualization, mobile
single-column, composer paperclip wiring, `?conversation=` deep-link (now read), `subscribe`
identity (see §8 PERF-5), 5 separate Echo consumers.

### 6.6 Reports & exports
Attendance/project/task/productivity reports (Admin full via `reports.view`; HR team-scoped).
Filters via FilterBar; saved views. Export Excel + PDF (queued `GenerateReportJob`, real
`reports/pdf.blade.php`). Weekly Sunday summary email (scheduler, command deduped). `attendance_days
.status='leave'` (correct). `Project::creator` relationship. **Gaps:** `export-history` 5s poll
forever + unbounded payload, raw `<table>` in report-builder (use DataTable), saved-views popover
mobile overflow.

### 6.7 Settings & audit
Company profile (logo upload), working hours, holiday calendar (targeted `Cache::forget`), password
policies, session rules, notification prefs, reminder times (Admin; HR view). Settings forms call
`/settings/grouped` + `/settings/bulk`. Audit log filterable/exportable (CSV — escape fields).
**Gap (CORR-1):** password-policy/session setting KEYS mismatch between seeder and AuthController →
configured policies silently ignored.

### 6.8 Profile (all roles)
Photo (Supabase Storage), name, phone, designation; change password; directory visibility
(public/internal/private — all branches implemented, sensitive fields always hidden); devices +
remote logout.

---

## 7. Existing implementation that WORKS (preserve, do not rebuild)

> Verified working in v2. Reuse. Do not duplicate.

### Backend (verified)
- **Auth flow:** login/refresh/roleSelect/lockout/suspicious-login/token-rotation/reuse-revocation.
- **Capability middleware** OR-logic correct; route-level guards on all modules; in-controller
  checks (UserController, AttendanceController HR-scoping, ChatController membership, ApprovalService
  capability+role, ReportController scoping).
- **AttendanceService:** event-sequence validation, `client_id` dedupe, `reconcileDay`, 10-min
  grace, cross-midnight 48h window, `has_open_shift` flagging, late detection, overtime.
- **ApprovalService:** state machine + role routing + capability check + transactional status sync;
  `ProcessApprovalDecision`/`NotifyApprovalSubmitted`/`LeaveAttendanceIntegration` registered + queued.
- **LeaveAttendanceIntegration:** Mon-Sat (ISO), holidays year-filtered + recurring.
- **ChatController:** correct scoping + membership checks + `startDirectMessage`.
- **ReportController:** `status='leave'`, `Project::creator`, real `reports/pdf.blade.php`.
- **DirectoryController:** visibility key aligned; public/internal/private branches.
- **NotificationObserver:** single broadcast path (`ShouldBroadcastNow`).
- **HolidayController:** targeted `Cache::forget` (no global flush).
- **CompanyController / AutoNumberingController / AnnouncementController / QaController:** full
  method coverage matching routes.
- **Reverb:** `conversation.{id}` authorized; `BROADCAST_CONNECTION=reverb` default;
  `ApprovalSubmitted implements ShouldBroadcast`.
- **AuditLogger** async (`ShouldQueue`); **GenerateReportJob** async (202 + poll).
- **Cursor pagination** on list endpoints; **Cache** on dashboard metrics (30s) + holidays.
- **Migrations** clean (single `saved_views`, `audit_logs.at`, grace consolidated); `migrate:fresh
  --seed` works. **OpenAPI** reconciled with routes.

### Frontend (verified)
- **Top bar:** no search; icon+label Start Shift; centered notifications modal with Clear (preserves
  Chats) + Mark-as-Read + X.
- **Sidebar:** 3-state, correct logos, visible chevron, required nav items with distinct icons,
  Ctrl+B, mobile bottom nav (5 items incl. Chat + Projects).
- **Dashboard widgets:** drag-safe (drag state + distance threshold + pointer-events gate),
  memoized `availableWidgets` (`useMemo([activeRole])`), debounced layout save, widget collapse
  (Quick Notes), per-widget ErrorBoundary, announcement one-per-person likes, Reverb subscribe on
  announcements.
- **DataTable** virtualized; **Notifications** cells use `({row})` correctly; **TimeClockWidget**
  React Query + rollback path + correct break mapping; **hr-attendance** uses `/hr/today`; **Gantt**
  inline grid; **calendar** responsive; **exports** use `apiFetch`/`useExport`/`getAuthToken()`
  (Zustand); **token** via `useAuthStore.getState().token` consistently.
- **`api-client.ts`:** 401 refresh interceptor (skips auth endpoints), correct offline-queue for
  mutations, `getAuthToken()` helper.
- **`auth-store.ts`:** Zustand + persist (`g4k-auth`) + `g4k_token` cookie + `getAuthToken()`.
- **`query-keys.ts`:** central `STALE_TIME_*` constants exist (metrics/attendance 30s, directory 5m,
  config 1h, notifications 10s) — but not all call sites use them yet.
- **ECharts** dynamically imported everywhere; **dnd-kit** behind dynamic parent; **Reverb**
  guarded by `isReverbAvailable()` (skips Vercel preview domains to avoid console spam).

---

## 8. Verified bugs & gaps (v2 — drives `fix-4.md`)

> The previous "21 CRB + 20 UX" catalog is OBSOLETE (38/39 fixed). The remaining issues are below,
> grouped. IDs: **PERF-** (performance/root-cause of "always loading"), **CORR-** (correctness),
> **UX-** (usability/polish), **VIS-** (visual consistency), **A11Y-**, **PERFBE-** (backend perf).

### CRITICAL PERFORMANCE — the "always loading" root causes (PERF)
- **PERF-1 — `gcTime == staleTime` (both 5 min).** `providers.tsx:42-43`. The moment a query goes
  stale it's GC-eligible → navigating away and back shows a full skeleton instead of cached data +
  background refresh. **THE dominant cause of "widgets always loading."** Fix: `gcTime` >> `staleTime`
  (e.g. staleTime 30s, gcTime 30min).
- **PERF-2 — `apiFetch` treats HTTP 5xx as offline-queueable.** `api-client.ts:~126`:
  `error.message.includes("Failed to fetch") || error.status >= 500` → queues mutation, returns
  `{ queued: true }`. A transient 5xx silently swallows the action; UI behaves as if it succeeded.
  Fix: queue ONLY on real network failure (`Failed to fetch` / `!navigator.onLine`), not 5xx.
- **PERF-3 — `widget-engine` gates the grid behind `width > 0` + re-sets `loading=true` on mount
  while fetching `/auth/preferences` (uncached).** `widget-engine.tsx:165,184`. Blank/skeleton
  dashboard for ≥1 paint frame on every navigation to `/dashboard`. Fix: cache preferences via
  `useQuery(["dashboard-layout"])` with long staleTime; default/fallback width synchronously; render
  grid from cached layout immediately.
- **PERF-4 — `useReverb().subscribe` is a new function every render** (`use-reverb.ts:80-86`, not
  `useCallback`). Every consumer's effect (`notifications-bell`, `auth-guard`, `chat/page`,
  `export-history`, `use-export`) tears down + recreates channels on re-render → repeated
  `invalidateQueries` → refetch storms. Fix: `useCallback(subscribe, [echoInstance])`; ideally hoist
  a single Echo instance into context (5 consumers currently each instantiate Echo).
- **PERF-5 — Duplicate/divergent query keys hitting the same endpoint with independent 30s polling.**
  - HR page: `hr-attendance-analytics` (`["hr-attendance-today",date,"all","",dept]`) +
    `hr-attendance-table` (`["hr-attendance-today",date,status,search,dept]`) → 2 requests/30s;
    plus `hr-activity-feed-widget` (`["hr-attendance-today"]`) on the HR dashboard → a 3rd.
  - Admin page: `admin-attendance-analytics` + `admin-attendance-table` +
    `admin-open-shifts-table` → 3 requests/30s on the same `/attendance/admin/overview`.
  Fix: unify keys (`["hr-attendance-today", date, dept]` etc.), share data via `select`, one poll.
- **PERF-6 — Over-broad invalidation.** `pending-approvals-widget` invalidates `["dashboard-metrics"]`
  on every decision → re-skeletons every MetricWidget on the dashboard. Similarly `tasks/page`
  invalidates `["tasks"]` (busts detail caches). Fix: targeted/exact invalidation.
- **PERF-7 — `["attendance-today"]` vs `["my-attendance-today-summary"]`** — two keys, same
  `/attendance/me/today` endpoint (`time-clock-widget` vs `today-summary-card`) → duplicate request,
  no `Cache-Control` on `meToday` (unlike `overview`/`hrToday`). Fix: unify key; add `Cache-Control`.
- **PERF-8 — Full-card skeletons instead of keep-previous-data + subtle `isFetching`.** All widgets
  replace the whole card on `isLoading`. With PERF-1 fixed this is less severe, but refreshes should
  keep content visible with a small indicator.
- **PERF-9 — `MetricWidget` re-runs the 600ms count-up animation on every background refetch**
  (`metric-widget.tsx:43-62`, effect deps `[rawValue, isLoading]`). Numbers visibly "re-count"
  repeatedly. Fix: animate only on first render (or on value change > threshold).
- **PERF-10 — `auth-guard` full-screen skeleton; effect deps `[pathname, token, user, ...]`** →
  navigation re-runs the gate; persisted token usually already present yet skeleton flashes. Fix:
  skip refresh when persisted token+user exist; drop `pathname` from auth-check deps.
- **PERF-11 — `useTimerStore()` / `useAuthStore()` / `useUIStore()` whole-store destructuring.**
  `time-clock-widget.tsx:35` (9 fields), `topbar-timer.tsx:11`, `live-timer.tsx:12`, plus 15
  `useAuthStore()` and 4 `useUIStore()` call sites without selectors. Any state change re-renders
  all. Fix: atomic selectors (`useAuthStore(s => s.user)`, etc.; `useShallow` for arrays).
- **PERF-12 — `react-grid-layout` statically imported** in `widget-engine.tsx:4-6` (ships in the
  dashboard chunk). Fix: `dynamic(() => import('react-grid-layout'), { ssr:false })`.
- **PERF-13 — `export-history.tsx` polls `/reports/exports` every 5s** whenever any job is
  "processing"; backend returns unbounded `->get()`. Fix: backend `->limit(20)`; frontend max-poll-
  duration; Reverb `ExportCompleted` to invalidate.
- **PERF-14 — `offline-engine` `setInterval(updateQueueCount, 5000)` runs forever** (2 IDB reads/5s
  for the whole session). No component subscribes via the hook today, but it's continuous churn.
  Fix: poll only when online && queue non-empty.
- **PERF-15 — `recent-activity-widget` + `metric-widget` both use `queryKey ["dashboard-metrics"]`**
  (good dedup) but each hardcodes `staleTime:30000` instead of using the central `STALE_TIME_METRICS`
  (drift risk). Minor.

### BACKEND PERFORMANCE (PERFBE)
- **PERFBE-1 — `DashboardController::metrics` calls `Schema::hasTable()` 4× per cache miss**
  (`DashboardController.php:98,103,112,127`). Each is a `SHOW TABLES LIKE` query. Fix: cache the
  booleans (config/static) — schema doesn't change at runtime.
- **PERFBE-2 — Dashboard cache TTL 30s, keyed per-user-per-role-per-day** (`:30`). For N users this
  is N regenerations every 30s, each recomputing counts across many tables. Fix: TTL 5min; split
  role-agnostic counts into a shared key; recent-activity as a shared admin key.
- **PERFBE-3 — `AttendanceController::hrToday`/`overview` compute ETag via `md5($response->
  getContent())`** — serializes the whole payload twice. Fix: cheaper etag (max updated_at + count).
- **PERFBE-4 — `ReportController::attendanceSummary`** runs 6 aggregate subqueries per user live;
  no materialization. Fix: cache per day or materialize.
- **PERFBE-5 — ApprovalService + many controllers do `role_assignments` pluck per request** (no
  cache of user roles). Fix: cache per user (short TTL).
- **PERFBE-6 — Unbounded `->get()` on index endpoints** (announcements, quick-notes, qa-forms, pins,
  saved-views, `reports/exports`). Fix: paginate or `->limit()`.

### CORRECTNESS (CORR) — the few remaining functional bugs
- **CORR-1 — Settings key mismatch (the 1 remaining "still broken" item).** Seeder writes
  `password_policy_min_length/require_numbers/require_symbols/require_mixed`
  (`DatabaseSeeder.php:253-256`); `AuthController::getPasswordPolicyRule()` reads
  `password.min_length/require_mixed/require_number/require_symbol` (`AuthController.php:48-57`).
  All configured password-policy settings are silently ignored → validation always uses defaults.
  Same shape for session keys (`session_ttl_minutes` vs `session.access_token_ttl`/`refresh_token_ttl`)
  and reminder-offset keys (`attendance_reminder_offset`/`missed_clockin_alert_offset`/`shift_reminder_offset`).
  Fix: pick ONE key set; update both seeder and AuthController/jobs.
- **CORR-2 — `ForcePasswordChange` is gated by a setting (`security.force_password_change`) that
  the seeder does NOT enable**, so first-login password change is effectively off despite
  `must_change_password=true` in seed. Decide: enable the setting in seed, or default-on. Document.
- **CORR-3 — AuditLogController CSV export** doesn't escape `action`/`subject` fields (CSV injection
  risk). Fix: escape `=,+,-,@` prefixes.
- **CORR-4 — `TimerController::index`** has no ownership filter (any user can read others' logs by
  passing `user_id`). Fix: scope to self unless `hr.view-team-attendance`/`admin.view-all-attendance`.
- **CORR-5 — `UserPreferenceController`** catches `Throwable` and leaks file/line in JSON. Fix:
  generic message.
- **CORR-6 — `AdminPasswordResetController` routes use `ability:role:super_admin`** (works but
  bypasses the capability matrix). Decide: keep or switch to `capability:settings.manage`.

### USABILITY / POLISH (UX)
- **UX-1 — `tasks/page` + `projects/page` create/update mutations have no `onError` toast** (silent
  failure). Add error feedback.
- **UX-2 — `project-card.tsx` `onClick`** is accepted but never passed by `projects/page` → dead
  affordance (cursor changes, nothing happens). Wire navigation to project detail.
- **UX-3 — `task-detail-sheet.tsx` returns null before `<Sheet>` when `task` is null** → abrupt
  close transition; comments don't refetch the selected task after `commentMutation` invalidation.
- **UX-4 — Kanban per-column empty state** missing (empty columns show nothing); Kanban horizontal-
  scrolls on mobile instead of card-stack.
- **UX-5 — `leave/page.tsx` Tabs uncontrolled** (refresh loses tab); `leave-history-table` passes
  `isFetchingNextPage={isLoading}` without infinite query.
- **UX-6 — `chat/page.tsx`** dead `Globe`/`Plus` imports; `h-[600px]` fixed + `w-1/3` sidebar doesn't
  collapse to single-column on mobile with a back button; message list not virtualized; composer
  paperclip `onClick` not wired.
- **UX-7 — `report-builder.tsx`** renders a raw `<table>` (use shared `DataTable`).
- **UX-8 — `saved-report-views.tsx`** "Save Current" popover overflows right viewport edge on mobile.
- **UX-9 — `admin-open-shifts-table`/`admin-attendance-table`/`hr-attendance-table`** use raw
  `alert()` instead of Sonner toast; `handleExport(all)` param unused.
- **UX-10 — `notifications/page.tsx`** FilterBar search is a no-op (`onSearchChange={()=>{}}`);
  `type` filter state never sent to backend.
- **UX-11 — `audit-log-table.tsx`** user filter is a hard-coded placeholder (no real user list).
- **UX-12 — Dead imports** (`Globe`/`Plus` in chat, `Skeleton` in admin-attendance if still present,
  etc.) — sweep.
- **UX-13 — Several Dialogs/Sheets missing `DialogDescription`/`SheetDescription`** (Radix a11y
  warning): attendance request-leave, users create/edit, departments, designations, projects, tasks.
- **UX-14 — Employee dashboard "Task Progress" / "Approval Status" widgets** are placeholder
  EmptyStates ("Track your sprint progress.") instead of real data. Wire to tasks/approvals.
- **UX-15 — `dashboard/page.tsx` "Quick Task Assignment"** widget is a placeholder EmptyState
  ("Tasks module is active.") for all roles — should be the real Quick Task form (R7.11).
- **UX-16 — `EmptyState` autoplays `/animated-logo.mp4`** when no icon passed — noisy inside metric
  cards. Pass an icon everywhere.
- **UX-17 — `profile/page.tsx` password regex** duplicated with `change-password/page.tsx` — extract
  a shared validator.
- **UX-18 — `directory/page.tsx`** hard-coded `"G4K001"` employee-code fallback string.
- **UX-19 — `leave-request-form.tsx`** overlap-check cache key is fragile (depends on filter state).

### VISUAL CONSISTENCY (VIS)
- **VIS-1 — Toast position.** Spec says top-right; `providers.tsx` Toaster is `position="bottom-right"`.
  Reconcile (pick one, apply everywhere).
- **VIS-2 — `Button` `[&_svg]:size-4`** forces icon sizes; verify/scope so declared icon sizes hold.
- **VIS-3 — `mr-1`/`mr-2` vs `gap-2`** inconsistency in icon+text rows (notifications, admin-
  attendance). Standardize on `flex items-center gap-2`.
- **VIS-4 — `--color-muted` token maps to a background token** — verify no `text-muted`/`border-
  muted`/`bg-muted` misuse remains after the refactor (grep + visual QA).
- **VIS-5 — `status` badge usage inconsistent** — some pages use shared `StatusBadge`, some use raw
  `bg-emerald-100`/`bg-rose-100` spans (designations). Standardize.
- **VIS-6 — `Avatar` usage inconsistent** — some places use `<Avatar>` with hashed colors, some use
  inline `bg-violet-100 text-violet-700` (users page). Standardize.
- **VIS-7 — `Select` inconsistency** — user create/edit uses raw `<select>` instead of Radix
  `Select`/`Combobox` (focus ring, consistency).
- **VIS-8 — `PageContainer`** used only by notifications; every other page hand-rolls its header.
  Standardize the page header/layout system.

### ACCESSIBILITY (A11Y)
- **A11Y-1 — axe-core not in CI** (no automated guarantee of WCAG AA).
- **A11Y-2 — Focus-visible rings** present on primitives but verify across all custom composites.
- **A11Y-3 — `prefers-reduced-motion`** — ensure the rotating-gradient button + animations collapse.
- **A11Y-4 — Keyboard shortcuts** (Ctrl+K/B/N///Esc/Enter) present; verify full reachability.

### PRODUCTION/OPS
- **OPS-1 — Performance budgets not CI-enforced** (bundle ≤200KB gz, Lighthouse CI, query-count,
  render-count). Need the guardrails added.
- **OPS-2 — `next.config.ts`** lacks `experimental.optimizePackageImports` (lucide/date-fns tree-
  shaking), manual chunk splitting.
- **OPS-3 — Sentry/Pulse/web-vitals** wiring to verify in production.

---

## 9. Data model (key tables)

`users`, `personal_access_tokens`, `role_assignments`, `capabilities`, `role_capabilities`,
`companies`, `company_profile`, `departments`, `teams`, `designations`, `auto_numberings`, `pins`,
`dashboard_layouts`, `work_schedules` (Mon-Sat 09:00-18:30, 45m break, `grace_minutes` 10),
`attendance_events`, `attendance_days`, `attendance_corrections`, `approvals` (polymorphic),
`leave_requests`, `holidays`, `notifications`, `projects`, `project_members`, `qa_forms`,
`qa_form_fields`, `qa_submissions`, `tasks`, `task_comments`, `task_activity`, `task_time_logs`,
`saved_views`, `conversations`, `conversation_user`, `messages`, `conversation_message_reads`,
`reactions` (polymorphic), `announcements`, `quick_notes`, `feedback`, `report_definitions`,
`export_jobs`, `scheduled_reports`, `settings`, `audit_logs` (`at` timestamp), `login_attempts`,
`password_reset_requests`, `pulse_*`, `cache`, `jobs`.

**Index gaps (minor):** consider `task_time_logs.log_date`, `messages.conversation_id`,
`notifications.created_at` for ordering. `users.work_schedule_id` has no FK constraint.

---

## 10. Performance standards (FROZEN — `PERFORMANCE-STANDARDS.md`, 30 P-* IDs)

**Page-load:** LCP ≤2.5s p75/≤2.0s lab · FCP ≤1.8s · TTFB ≤600ms web/≤800ms api.
**Interactivity:** INP ≤200ms p75 · CLS ≤0.1. **Navigation:** cached route ≤100ms first frame;
stale-while-revalidate (no spinner for cached data). **API:** p95 ≤200ms read/≤300ms write; heavy
reports queued/streamed. **DB:** zero N+1; ≤5 SQL/list; cursor pagination; indexes on filtered/
joined/ordered columns. **Bundle:** First-Load JS ≤200KB gz/route; route chunk ≤350KB gz; all routes
lazy-loaded; heavy libs dynamic. **Assets:** `next/image`; self-hosted subset fonts ≤2 families.
**Cache:** per-entity staleTime/gcTime; ETag/Cache-Control on safe GETs. **State:** Zustand UI-only
(slice selectors); TanStack Query `select`. **Render:** memoized rows + stable keys; virtualize >100.
**Search:** debounced 250ms server; filter changes URL+cache, no reload. **Forms:** inputs ≤16ms;
validation 400ms pause; submit disabled+loader. **Background:** work >500ms → queues; frontend heavy
work in workers/chunked. **UX states:** no full-screen spinner where a skeleton fits; per-widget
error boundaries; optimistic UI + rollback; offline banner + queued mutations. **Responsive:**
360→1920 fluid; tables→cards; bottom nav ≤5; ≥48px touch. **A11y:** WCAG 2.1 AA; axe-core clean;
Ctrl+K/N//Esc/Enter. **Memory:** no unbounded caches; cleanup on unmount. **Monitor:** Sentry +
web-vitals + Pulse; p75 within targets 7 consecutive days before M1 freeze. **CI budgets** as
guardrails — regression fails the build.

> **The current code VIOLATES mainly:** stale-while-revalidate (PERF-1), no-spinner-for-cached
> (PERF-1/3/8), slice selectors (PERF-11), and several "no duplicate requests" (PERF-5/7).

---

## 11. Important decisions & constraints (ADRs, abridged)

ADR-012 Postgres/Supabase · ADR-013 Reverb · ADR-014 Sanctum Bearer · ADR-015 single-company ·
ADR-016 monorepo · ADR-017 no AI in M1 · ADR-018 performance-first · ADR-019 rebuild-to-spec ·
ADR-020 seed source = `data-prefill-reference.txt`, `must_change_password=true`, Asia/Kolkata ·
ADR-021 login = username/email/employee_id · ADR-023 vibrant-on-white · ADR-024 3-state sidebar ·
ADR-025 direct-to-production deploy · ADR-026 access token + 7-day refresh HttpOnly cookie ·
ADR-027 attendance Mon-Sat 09:00-18:30, 45m break, standard 31500s, cross-midnight, forgot-clock-out
= open shift + manual correction · ADR-028 leave casual/sick/earned/unpaid, no quotas M1 ·
ADR-029 file storage = Supabase Storage · ADR-030 single timezone Asia/Kolkata.

---

## 12. Constraints, dependencies & non-goals

- **M1 = Web only.** Windows/Tauri (M2), Android/Compose (M3) reuse Core Platform + `packages/ui`.
- **No AI product features** in M1. **English only.** **Single-company.** **No mock data.**
- **Credentials** (per `GUIDE-CREDENTIALS.md`): GitHub, Supabase, Railway, Vercel, SMTP, Sentry —
  via Railway/Vercel env vars; `.env.local-secrets` gitignored.
- **Railway** builds from root `nixpacks.toml` (PHP 8.4, `cd apps/api`); do not reintroduce the
  historical login-404 chain (duplicate routes + missing root nixpacks + PHP 8.3 vs 8.4 + BOM
  Procfiles — all fixed in commits `05b3b6a` + `475be06`).

---

## 13. How to use this file

- **Before building anything:** read this → the relevant module in §6 → the matching `fix-4.md`
  phase → the frozen OpenSpec docs for exact tokens/components.
- **Reuse first:** §7 lists what already works. Do not rebuild it.
- **Do not re-flag fixed bugs:** the previous CRB/UX catalog is closed (38/39). The remaining work
  is §8 (PERF + CORR-1 + UX/VIS polish + OPS guardrails).
- **The #1 user complaint ("always loading") is root-caused in §8 PERF-1..15.** Fixing PERF-1, -2,
  -3, -4, -5, and -11 alone will resolve the majority of the perceived slowness.
- `fix-4.md` is the exhaustive, ordered, dependency-aware checklist that reaches the final state
  described here. Completing every checkbox yields a fully wired, polished, responsive, fast,
  consistent, accessible, deployment-ready application.
