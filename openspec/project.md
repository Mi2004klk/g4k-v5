# Games4King Workplace OS — Core Platform Specification

> Authoritative source of truth for the whole platform. Every module, every client,
> and every AI coding session reads this first. Stable contract — changes require a
> new ADR.
>
> **Read order:** this file → `openspec/REQUIREMENTS.md` (every functional WHAT, by REQ ID) →
> `openspec/TRACKER.md` (build status + acceptance criteria) → the phase's change folder under
> `openspec/changes/phase-XX-*/`.

## 1. Product

**Games4King Workplace OS** — an enterprise-grade company management platform with three
user types (Super Admin, HR, Employee). Auth, attendance, projects/tasks with approvals,
chat, reports, and a rich interactive UX.

- **Single-company deployment** (one company per install).
- **Milestone 1 = Web only** — fully functional, production-ready, responsive + PWA + offline.
- Architecture stays open for **Windows (Tauri, M2)** and **Android (Compose, M3)** — the
  Core Platform is shared; clients are implementations.

Inspired by ClickUp, Linear, Notion, Arc Browser, Figma, Slack.
Qualities: speed, vibrant UI, rich micro-interactions, offline-first, cross-platform
consistency, long-term maintainability, scalability.

## 2. System Roles (only 3)

| System role | Maps to seed "role" lines | Drives capabilities |
|---|---|---|
| **Super Admin** | "Super Admin" (Karthik) | Full control. Oversees company-wide. |
| **HR** | "HR" (Aravind) | Team ops: projects, tasks, leave approvals, attendance oversight. |
| **Employee** | the other 13 lines | Own work, attendance, comms. |

> **The 15 "roles" in the seed data are DESIGNATIONS / job titles** (Senior Game Developer,
> Designer, QA Tester, Director, Editor, Cameraman, Actor, Actress, etc.), NOT permission
> roles. A user's **designation** is a profile label; their **system role(s)** drive
> permissions. A user may hold **multiple system roles** → triggers the Role Selection screen.

### 2.1 M1 Capability Matrix (Base + Attendance + Leave)
| Area | Super Admin | HR | Employee |
|---|---|---|---|
| Dashboard | full company | team | personal |
| Org: users (HR+Employee accounts) | full CRUD, roles, reset pw, deactivate, activity | view team, limited | — |
| Org: departments/teams | full CRUD + members | view | view |
| Org: designations | full CRUD | view | view |
| Directory | full + Send Message* | full + Send Message* | view + Send Message* |
| Profile (self) | edit photo/name/phone/designation, change pw, devices | same | same |
| Attendance: clock self | yes | yes | **yes** (`attendance.clock-self`) |
| Attendance: team today (HR) | yes | **yes** (`hr.view-team-attendance`) | — |
| Attendance: company overview (Admin) | **yes** (`admin.view-all-attendance`) | — | — |
| Attendance: manual correction | **any user** (`admin.correct-attendance`) | **own team** (`attendance.correct-team`) | — |
| Attendance: history (self) | yes | yes | yes |
| Attendance: reports/export | yes | team | — |
| Leave: request self | yes | **yes** (`leave.request-self`) | **yes** (`leave.request-self`) |
| Leave: approve employee leave | yes | **yes** (`leave.approve-employee`) | — |
| Leave: approve HR leave | **yes** (`leave.approve-hr`) | — | — |
| Leave: view all history | yes | team | own |
| Settings (company/hours/holidays/policies) | **yes** (`settings.manage`) | view | — |
| Audit log | **yes** (`audit.view`) | — | — |

*\* "Send Message" creates a Direct chat row in M1 (chat UI itself is a future module).*

## 3. Tech Stack (authoritative)

### Backend — Laravel 13 (apps/api)
- PHP 8.4+, Laravel 13 (frozen version per STK-D1/D2; composer.json is source of truth), **PostgreSQL via Supabase** (source of truth).
- **Spec-first OpenAPI** — write spec before any route. All clients consume the same API.
- **Sanctum Bearer tokens** — stateless auth (frontend and API are on different domains).
- Queue, Scheduler, Events, Cache (managed processes on Railway).
- **Laravel Reverb** for realtime (WebSockets on Railway).
- Backend owns exclusively: business logic, auth/permissions, validation, workflows,
  notifications, offline synchronization, reporting. Frontend never touches DB logic.

### Frontend — Next.js (apps/web)
- Next.js 16.3.0 + React + TypeScript (frozen version per STK-D1/D2; package.json is source of truth). Tailwind v4. Radix UI + shadcn/ui (owned, copied-in).
- TanStack Query (server state), Zustand (UI state only — never API data).
- TanStack Table, dnd-kit (kanban/lists/trees/menus), React Grid Layout (dashboard widgets only — never mix with dnd-kit).
- React Hook Form + Zod, Apache ECharts, Tiptap, Lucide, Motion (Framer Motion).
- IndexedDB (Offline Engine), Supabase JS client (when needed), Reverb pusher-js client.

### Shared — packages/ui
- Components, hooks, API client, theme, types, design system. Consumed by both `apps/web`
  (M1) and the future Tauri desktop client (M2 — plain React SPA, no Next.js, no SSR).

### Realtime — Laravel Reverb
- Channels: private (user-specific), presence (project teams, chat), public (announcements).
- Broadcasts from Laravel events. Used for chat, presence, live widget refresh, notifications.

## 4. Hosting & Deployment
- **Backend → Railway** (Laravel app + managed Postgres via Supabase connection + queue/scheduler workers).
- **Frontend → Vercel** (Next.js).
- **Database → Supabase Postgres** (managed, connection string used by Railway app).
- **VCS → GitHub** (single monorepo). Conventional commits, CI on PR, per-module deploys.
- Per-module live deploys as each completes; automated DB backups (Supabase) + deploy rollback (Railway/Vercel).
- Environments: `dev` (local), `staging` (per-module review), `production`.

## 5. Architecture Principles (immutable)
1. **Performance-first** — performance is decided at architecture time, not optimized later. Every
   layer (DB, API, frontend, component, state, asset) carries explicit, measured targets in
   `PERFORMANCE-STANDARDS.md`. A regression fails CI.
2. **Offline-first** — every module uses the single shared Offline Engine; none invents its own sync.
3. **API-first / Spec-first** — OpenAPI written before implementation.
4. **Capability-based permissions** — the only permission model. Roles receive capabilities; capabilities gate features. All decisions in backend.
5. **Reusable components first** — never build new if a generic one can be configured. Build a generic Metric Widget, not an Attendance Widget.
6. **No duplicated business logic** — backend owns all; clients present.
7. **Core Platform thinking** — not milestone-driven architecture.
8. **Layered** — a change in one layer rarely requires changes in another.
9. **Operational efficiency** — designed for real day-to-day business use: minimal clicks on
   frequent workflows, instant feedback, no unnecessary reloads, resilient to poor networks.

## 6. Implementation Contracts (enforced)
- Business logic lives only in backend services.
- All clients consume the same API; no client touches DB logic.
- Capability-based permissions only.
- One Offline Engine; no per-module sync logic.
- Reusable components first; new only when no generic option exists.
- Every stable contract requires a recorded ADR before it changes.
- Tests + documentation updated with every feature.
- **Performance contracts**: no N+1 queries; ≤5 SQL per list request; cursor pagination; lists
  >100 rows virtualized; route First-Load JS ≤200KB gz; heavy work offloaded to queues/web
  workers; no full-screen spinner where a skeleton is possible; field web-vitals within targets.
  Full enforceable list in `PERFORMANCE-STANDARDS.md`; regressions fail CI.

## 7. Engines
- **Layout Engine** — responsive grids, docking, split panes, tabs, drawers. Performance:
  reserved dimensions to prevent CLS; cheap reflows.
- **Widget Engine** — self-contained widgets w/ permissions, settings, data providers; drag/resize/collapse/refresh/lazy-load/offline/realtime; adaptive (small=metric, medium=metric+stats, large=chart+stats+trend+actions). Performance: each widget loads independently (one slow ≠ all blocked — P-RESILIENT); each wrapped in its own error boundary; lazy-loaded via IntersectionObserver.
- **View Engine** — list, board, calendar, Gantt, timeline, gallery, table, form, analytics. Performance: list/table/board views MUST virtualize >100 rows (P-VIRTUAL); heavy views (Gantt, calendar) dynamically imported (P-LAZY).
- **Command Engine** — context menus, keyboard shortcuts (Ctrl+K palette, Ctrl+N, Ctrl+/, Esc, Enter), bulk actions. Performance: palette search is instant (client index); actions target ≤2-click common workflows (P-DATAENTRY).
- **Theme Engine** — colors, spacing, typography, density, light + dark (both colorful). Performance: token-based (no runtime recalculation); theme switch without remount.

## 8. State Management
- **TanStack Query**: all API calls, server cache, pagination, mutations. Performance: per-entity
  `staleTime`/`gcTime`; `select` for derived data; stale-while-revalidate on navigation (no spinner for cached data — P-NAV-CACHE).
- **Zustand**: sidebar, theme, dialogs, selected items, filters, temporary drafts. Performance:
  slice selectors only (no whole-store subscriptions — P-STATE/P-RERENDER).
- Rule: never store API data in Zustand.

## 9. Offline Engine (single shared framework)
Interface: Queue → Sync Manager → Conflict Resolver → Retry Manager → Storage → Connectivity Monitor.
- Queue item: operation, entity, payload, version, created, retryCount, status.
- States: Pending → Syncing → Completed → Failed → Conflict → Cancelled.
- Retry: 1s → 5s → 30s → 2m → 5m → Manual.
- Web storage: IndexedDB. Cache everything loaded; works offline once loaded until logout.
- Conflict resolution is **per-entity** (do not apply one rule to all):
  Settings=Last Write Wins · Tasks=Version+Merge · Documents=Version+Manual Merge ·
  Attendance=Server Validation · Finance/HR=Server Wins · Chat/Comments=Timestamp.

## 10. Design System (vibrant but professional)
- **FROZEN, full detail in `openspec/DESIGN-SYSTEM.md`** — exact color tokens/hex, typography
  scale, spacing, elevation, motion durations+easings, sidebar collapse/expand behavior, logo
  placement rules, per-role dashboard widget composition, accessibility, and token implementation.
- **FROZEN component catalog in `openspec/COMPONENT-SYSTEM.md`** — the Radix UI + shadcn/ui
  component strategy: every primitive, its variants/states/sizes, when-to-use, accessibility,
  keyboard behavior, responsive rules, and a component→workflow mapping. Every screen composes
  ONLY from this catalog (no ad-hoc UI). Phase 3 builds the catalog; later phases compose it.
- **Tone**: ClickUp-like vibrant energy — gradients on headers/dashboards, rich empty states,
  playful micro-interactions — BUT disciplined semantic colors for data (status badges,
  charts) so it reads as a serious tool. Brand colors (violet `#8A2BE2`/`#9400D3`, gold
  `#FFD700`/`#FFA500`, pink `#FF1493`) as accents, not everywhere.
- **Brand**: derived from logo (vibrant violet → magenta gradient, gold crown/stars, cartoon king).
  Design tokens defined in code (no external Figma).
- **Motion**: durations/easing defined once, reused. Taps 100–150ms · Panels 180–250ms · Dialogs 250–350ms.
- **Status badges**: Gray=Not Started · Blue=In Progress · Amber=Pending · Green=Approved/Completed · Red=Redo/Rejected/Overdue.
- **Performance targets**: initial UI <1s, navigation instant, input <100ms, 60 FPS where practical. Never a spinner if avoidable — skeletons/partial/cached. Virtualize large lists.
- **Languages**: English only (M1).
- **HARD RULE**: no mock/placeholder data anywhere — screens are fully functional even when empty
  (real API calls, real empty states). See `DESIGN-SYSTEM.md` §14 + `config.yaml` HARD RULES.

## 10.1 Accessibility (WCAG 2.1 AA) & Keyboard
- **Contrast**: 4.5:1 text contrast / 3:1 UI.
- **Reachability**: Full keyboard reachability; visible focus rings (2px brand-violet ring, 2px offset on `:focus-visible`); ARIA on icon-only buttons (tooltips double as labels).
- **Motion**: `prefers-reduced-motion` respected (≤1ms transitions).
- **Testing**: axe-core zero critical/serious in CI.
- **Keyboard Shortcuts**: Ctrl+K (palette), Ctrl+B (sidebar), Ctrl+N (context-new), Ctrl+/ (help), Esc (close), Enter (submit/confirm), arrows (navigate menus/lists/tabs).
- **Touch Targets**: Min 44×44 (48×48 for mobile attendance).

## 11. ADRs (Decision Log)

> Stable contracts. A change requires a new ADR that explicitly supersedes the prior one.

- **ADR-001** ~~Database = MySQL 8~~ → **SUPERSEDED by ADR-012**.
- **ADR-002** ~~Realtime = Supabase Realtime~~ → **SUPERSEDED by ADR-013**.
- **ADR-003** Laravel 12 (PHP 8.4+).
- **ADR-004** Next.js 16.2.12.
- **ADR-005** OpenAPI spec-first only.
- **ADR-006** Tauri shares `packages/ui` React SPA, not Next.js (avoids SSR conflict).
- **ADR-007** React Grid Layout = dashboard only; dnd-kit = everything else. Never mix.
- **ADR-008** TanStack Query = server state; Zustand = UI state only.
- **ADR-009** Conflict resolution is per-entity (see §9).
- **ADR-010** Single shared Offline Engine.
- **ADR-011** Core Platform + Client Implementations model (not milestone-driven architecture).
- **ADR-012 (supersedes ADR-001)** **Primary DB = PostgreSQL on Supabase.** Chosen for:
  managed reliability, native realtime compatibility, connection pooling, backups, and to
  unify DB + realtime on one managed provider. MySQL-specific tooling/seeder assumptions in
  the original doc are discarded. Seed data format is unchanged in intent.
- **ADR-013 (supersedes ADR-002)** **Realtime = Laravel Reverb on Railway.** Chosen because
  Railway gives full process control (no shared-hosting restriction), Reverb is Laravel-native
  (broadcasts directly from events, supports private/presence/public channels + presence),
  and removes an external hop. Supabase remains the DB only.
- **ADR-014** Auth = Sanctum Bearer tokens (stateless; frontend Vercel + API Railway on
  different domains rules out SPA cookies; tokens enable clean per-device remote revocation).
- **ADR-015** Single-company deployment. No global `company_id` tenancy scoping.
- **ADR-016** Monorepo: one GitHub repo with `apps/web`, `apps/api`, `packages/ui`.
- **ADR-017** No AI product features in M1 ("AI-first" is a development methodology).
- **ADR-018 (Performance-first)** Performance is an architectural commitment, not a post-phase.
  Measurable budgets (web-vitals, bundle size, query counts, render counts) are enforced in CI
  and referenced in every spec/phase. Central source: `PERFORMANCE-STANDARDS.md`. A regression
  to these contracts fails the build — performance is never silently weakened.

## 10.5 Performance Constitution
> Treat as part of the immutable Architecture Constitution. Full detail in
> `PERFORMANCE-STANDARDS.md` (30 standards with measurable acceptance criteria).

- **Budgets are code, not hopes.** Bundle size, web-vitals (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1),
  API p95 (≤200ms read), query counts (≤5/list, zero N+1), and render counts are CI-enforced.
- **Perceived performance over raw speed.** Skeletons, stale-while-revalidate, optimistic UI,
  and instant cached navigation take priority over spinners and full reloads.
- **Scale-ready by construction.** Cursor pagination, virtualization (>100 rows), indexed
  filters, and queued heavy work mean the app stays fast as attendance/employee/task data grows.
- **Day-to-day optimized.** Frequent workflows (clock in/out, approve, assign, mark read) target
  ≤2 clicks, no reloads, optimistic confirmation. Each module names its frequent workflows and
  their click/latency targets in its phase spec's `## Performance Requirements` section
  (Attendance Phase 5 is the reference model — see its design.md).
- **Resilient.** A failed widget/section never blocks the page; errors recover without losing
  user data; offline work queues and syncs. Networks are assumed unreliable.
- **Verified continuously.** Lighthouse CI on PRs; field web-vitals collected in prod; query/
  render regression tests in CI; performance notes recorded in every archived spec.

## 11.5 Performance Practices (from product brainstorm — apply across all phases)
- **Code splitting & route-based lazy loading** — each area loads only when needed; cut initial JS payload 60–90%.
- **Virtualize** large lists (employees, attendance logs, tasks, notifications, reports).
- **Image optimization** — profile-pic upload + all images optimized/sized.
- **Cache everything that rarely changes**; API response compression; tree-shake; minify; memoize.
- **Optimistic updates** for snappy UX; **background sync**; debounce search; throttle frequent events.
- **Backend**: DB indexes, eager loading (avoid N+1), pagination, Laravel route/config caching, PHP OPcache, query caching, prefer efficient SQL over complex app logic.
- **Offload slow work to queues**; avoid long-running PHP requests; cache config and routes; reduce queries.
- **Delivery**: CDN, HTTP/2 or HTTP/3, font optimization, prefetch, service worker, separate vendor bundle.
- Measure continuously (§20 tooling); never assume targets are met.

## 12. Module Index (build order — full detail in `openspec/TRACKER.md`)

| # | Module | OpenSpec capability | Status |
|---|---|---|---|
| 0 | Foundation & infra | `foundation` | planned |
| 1 | Auth & sessions | `authentication` | planned |
| 2 | Users, roles & org structure | `org-management` | planned |
| 3 | App shell & design system | `app-shell` | planned |
| 4 | Dashboard framework & widgets | `dashboards` | planned |
| 5 | Attendance | `attendance` | planned |
| 6 | Leave & approvals | `leave-approvals` | planned |
| 7 | Projects & tasks | `projects-tasks` | planned |
| 8 | Chat & notifications | `communication` | planned |
| 9 | Reports & exports | `reporting` | planned |
| 10 | Admin system settings & audit | `system-settings` | planned |

Build flow per module: spec → design → tasks → implement → test → deploy → archive spec (freeze).

## 13. Glossary
- **Workplace OS** = this product.
- **System role** = one of {Super Admin, HR, Employee}; drives capabilities.
- **Designation** = job title (e.g. "Senior Game Developer"); a label, not a permission role.
- **Dual-role user** = user assigned ≥2 system roles → sees Role Selection after login.
- **Capability** = a granular permission (e.g. `projects.create`, `leave.approve`) granted to roles.
- **Quick Task Assignment** = dashboard widget that creates a task directly into an employee's list.
- **Metric Widget** = the generic configurable widget (spec §15) reused across dashboards.
- **Frozen spec** = a module spec archived after completion; read-only unless a change request references it.

## 14. Recorded Architectural Decision Records (ADRs)

- **ADR-019 — Rebuild-to-spec strategy:** existing UI/data layers are non-compliant scaffold; rebuild.
- **ADR-020 — Real seed source:** `data-prefill-reference.txt`; role-specific passwords; `must_change_password=true`; Asia/Kolkata.
- **ADR-021 — Login identifier = username OR email OR employee_id.**
- **ADR-022 — M1 scope cutoff:** Base + Attendance + Leave only; Projects/Tasks/Chat/Announcements/Reports deferred to a later milestone (documented in `plan-future-modules.md`).
- **ADR-023 — Visual intensity:** vibrant-on-white — clean white surfaces, multiple contextual colours across icons/sidebar-states/badges/cards/interactions; per-module accent colours; gradients reserved for sign-in hero, dashboard headers, and logo lockups (FROZEN §1 honoured).
- **ADR-024 — 3-state sidebar:** Hidden / Collapsed (icons+tooltip) / Expanded (icons+text); collapsed by default; joyful animated transitions; supersedes the FROZEN 2-state model (264↔72).
- **ADR-025 — Direct-to-production deployment:** each verified phase deploys straight to production (Vercel + Railway + Supabase, already wired); credentials retained; final clean redeploy at go-live.
- **ADR-026 — Auth security:** access token 15min in-memory + refresh token 7-day sliding in HttpOnly cookie; SameSite auto-detected at runtime (Strict if same registrable domain, else None + CSRF).
- **ADR-027 — Attendance rules:** Mon–Sat 09:00–18:30, 45-min break, standard 31500s; cross-midnight attributed to clock-in date; forgot-clock-out = flag open shift + manual correction (no auto-out); HR corrects own team only.
- **ADR-028 — Leave:** types casual/sick/earned/unpaid; no balances/quotas at M1 (requests + history + attendance integration only); holiday calendar view + seed in Phase 6, CRUD in Phase 7.
- **ADR-029 — File storage = Supabase Storage** (profile photos, allowed image attachments).
- **ADR-030 — Single company timezone Asia/Kolkata** (UTC stored, converted for display/day-boundary/late).

