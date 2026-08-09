# plan.md — Games4King Workplace OS: Authoritative Implementation Roadmap (M1)

> **This file is the single, authoritative, phase-by-phase implementation plan for completing the
> Base Application Module and the Attendance Module (with Leave) into a production-ready, daily-use
> application. It reconciles every requirement, planning, architecture, database, UI/UX, and
> implementation document against the *actual* current code, removes ambiguity, and converts the
> remaining work into 10 dependency-aware, verifiable phases.**
>
> **Hierarchy of truth (when sources conflict, the higher one wins):**
> 1. This `plan.md` (operational decisions + reconciliation of conflicts surfaced by the audit)
> 2. `openspec/REQUIREMENTS.md` (functional WHAT, by R-ID), `openspec/project.md` (architecture),
>    `openspec/DESIGN-SYSTEM.md` + `openspec/COMPONENT-SYSTEM.md` (FROZEN visual/component contracts),
>    `openspec/PERFORMANCE-STANDARDS.md` (FROZEN P-* budgets), `openspec/config.yaml` HARD RULES
> 3. Each phase's `openspec/changes/phase-XX-*/{proposal,design,spec,tasks}.md` (module detail)
> 4. `Images, SVG, PDF/data-prefill-reference.txt` (authoritative seed data)
> 5. Existing code (salvageable scaffold only — see §0.5)
>
> **Primary focus (this roadmap):** (1) the complete **Base Application Module** (auth, Admin/HR/Employee
> roles, departments/teams, profiles, RBAC, role-based sidebar + screen permissions, company management,
> shared layouts, design system, branding, vibrant visual language, states, responsive/a11y) and
> (2) the complete **Attendance Module** (clock in/out, breaks, working hours, late/early/absence,
> history, corrections, **leave + approval workflows**, attendance↔leave integration, reports/summaries).
> Phases 7–10 (Projects/Tasks, Chat/Notifications, full Reporting, Settings/Audit) are sequenced to
> complete M1 but are the secondary focus; they are specified precisely so no ad-hoc decisions are
> needed later, but the Base + Attendance modules are the deliverable that must be flawless first.

---

## Table of contents

- §0 — Audit reconciliation (read before any work)
- §1 — Authoritative contracts (do not re-decide)
- §2 — Phase format & global Definition of Done
- Phase 0 — Project audit, architecture validation & foundation repair
- Phase 1 — Authentication & role-based access
- Phase 2 — Org management: Admin / HR / Employee / Department / Team / Profile / RBAC
- Phase 3 — Design system, app shell, layouts, navigation, branding
- Phase 4 — Dashboard framework & widgets (Base module capstone)
- Phase 5 — Attendance clock in/out, breaks, history, corrections (reference module)
- Phase 6 — Leave management, approval framework & attendance↔leave integration
- Phase 7 — Projects & tasks
- Phase 8 — Chat & notifications
- Phase 9 — Reports & exports
- Phase 10 — Production hardening, settings, audit, deployment readiness
- §3 — Cross-cutting acceptance (applies to every phase)
- §4 — Resolved decisions log (owner-confirmed)

---

## §0 — Audit reconciliation (what exists, what's broken, what to do)

> **Strategy chosen by the owner: REBUILD TO SPEC, SALVAGE SCAFFOLD.** We keep genuinely useful
> scaffolding and rebuild the data/UI/schema layers to match the FROZEN specs. We do **not** inherit
> the non-compliant dark/zinc theme, raw `fetch`, `localStorage` auth, `alert()` calls, stub numbers,
> or the generic seeder.

### 0.1 Documentation state — GOOD (authoritative, keep & obey)

- **All 11 phase folders exist and are internally complete**: `phase-00 … phase-10`, each with
  `proposal.md`, `design.md`, `tasks.md`, `specs/<capability>/spec.md`. Attendance (Phase 5) and
  Leave (Phase 6) are **fully specified** — they are NOT missing. This `plan.md` does **not** re-spec
  them; it sequences and reconciles them.
- FROZEN specs to obey verbatim: `DESIGN-SYSTEM.md` (tokens, palette, motion, sidebar §9, logo §10,
  widgets §13, states §14), `COMPONENT-SYSTEM.md` (40+ primitives/composites + workflow map §9),
  `PERFORMANCE-STANDARDS.md` (32 `P-*` standards), `config.yaml` HARD RULES (no mock data; FROZEN design).
- `REQUIREMENTS.md` R1–R13 are the functional WHAT. `project.md` is the architecture constitution
  (ADRs, principles, engines, state management, offline engine §9, conflict resolution per entity).
- `openspec/specs/` and `openspec/changes/archive/` are **empty** — no phase has been archived; all
  TRACKER statuses are ⬜. So *implementation effectively starts now*; nothing is "done" in the
  spec-tracking sense.
- `VERIFICATION.md` is a one-time audit record (`openspec validate --all` → 11 passed), not a runtime
  checklist. It does not certify implementation — only spec coherence.

### 0.2 Seed data — REAL source identified (replace the generic seeder)

- **`Images, SVG, PDF/data-prefill-reference.txt` is the authoritative seed data** and overrides the
  generic data currently in `apps/api/database/seeders/DatabaseSeeder.php`.
- **Company:** Games4King (G4K-001), Game Development Studio, `g4kasset@gmail.com`,
  Mullai Nagar, Vadamalampatti, Pochampalli Tk, Krishnagiri Dt, Tamil Nadu – 635206; phones
  +91 79045 93823 / +91 96264 79882. **Timezone: Asia/Kolkata.** Working hours 09:00–18:30.
- **Departments (2):** Game Dev Team (DEP001) · YouTube Team (DEP002).
- **System roles (3, drives permissions):** Super Admin · HR · Employee. The 15 "Role Master" lines
  in the reference (Senior Game Developer, Designer, QA Tester, Director, Chief Editor, Editor,
  Cameraman, Actor, Actress, …) are **designations/job titles**, not permission roles.
- **Employees (13)** with real usernames, `@games4king.in` emails, role-specific passwords:
  - `karthik` — `g4kkarthik@gmail.com` / `Admin@123` — Super Admin — Senior Head
  - `aravind` — `hr@games4king.in` / `Hr@123` — HR — HR Manager
  - `praveen` — `praveen@games4king.in` / `Dev@123` — Employee — Senior Developer (Senior Game Developer)
  - `rahul`, `vignesh`, `santhosh`, `naveen`, `harish`, `dinesh`, `ajith`, `lokesh`, `akash`,
    `nivetha` — employees (see reference file for exact email/password/designation/department/mobile/
    joining date/blood group per row).
- **Passwords are role/employee-specific, not uniform.** All seed users ship with
  `must_change_password = true` (force first-login change). Logins: identifier = **username OR email
  OR employee_id** + password (R1.2 expands to "Email OR Employee ID"; the reference adds username —
  see §0.7 decision AUTH-D1: support username too since it is canonical in the seed).
- **Master-data requirements (from reference §ADMIN CONFIGURATION):** every master dataset supports
  Create / Read / Update / Delete / Import / Export / Activate / Deactivate / Search / Filter /
  Pagination / Audit History. "Nothing should be hardcoded." **Auto-numbering** is configurable
  (prefix, start, length, format) for Company / Employee / Department IDs — no code changes.

### 0.3 Backend (`apps/api`) — SCAFFOLD PARTIALLY USABLE, LARGELY TO REBUILD

**Current working-tree reality (from audit):**
- `routes/api.php` reduced to a single `GET /user` route. **Backend serves nothing useful.**
- `app/Models/User.php` reverted to the framework stub: **no `HasApiTokens`**, no `$fillable` for org
  fields, **no relationships** — yet every controller calls `$user->department`, `createToken()`, etc.
- `app/Services/CapabilityMatrix.php` **deleted**; `RequireCapability` middleware imports it → fatal.
- **5 controllers deleted** from working tree (Attendance, Leave, Chat, Settings, AuditLog); they
  exist only in HEAD `73d2516`.
- Migrations exist for all 21 domain tables but **do not match the FROZEN phase designs** (e.g.
  `attendance_records`/`attendance_logs` instead of Phase-5's `attendance_days`/`attendance_events`;
  no `approvals`/`role_capabilities`/`capabilities`/`numbering_schemes`/`work_schedules`/`holidays`/
  `attendance_corrections` tables).
- `personal_access_tokens` migration had `ip_address` **removed** in working tree, but `AuthController`
  still sets it → runtime error.
- Reverb & Pulse **not installed**; no `config/reverb.php`/`config/pulse.php`.
- OpenAPI covers only auth + org (departments/designations/users + directory). No attendance/leave/
  projects/chat/notifications/reports/settings/audit paths.
- Tests (`AuthTest`, `HealthTest`) hit `/api/auth/login` and `/health` — **both will 404** now.
- `database/database.sqlite` is committed (98 KB) — must be removed from git (artefact, not source).

**Salvage decisions (KEEP / FIX / REBUILD / DISCARD):**
| Item | Decision | Why |
|---|---|---|
| Monorepo layout (`apps/api`, `apps/web`, `packages/ui`) | **KEEP** | Matches ADR-016. |
| Laravel 13 skeleton, Sanctum installed | **KEEP** | Composer has sanctum ^4. |
| `AuthController` login/lockout/rate-limit logic (HEAD version) | **FIX** | Logic is sound (5/10min lockout, token IP, role ability); fix `ip_address` column, add `HasApiTokens`, route it. |
| `RequireCapability` middleware shape | **FIX** | Keep the alias; re-point to a DB-backed capability service. |
| Existing 21 migrations | **REBUILD** | They predate the FROZEN phase designs (wrong table names/cols). Replace with a clean, ordered migration set matching phase designs. |
| `DepartmentController`, `DesignationController`, `UserController`, `DirectoryController`, `ProfileController`, `UserPreferenceController` (HEAD versions) | **FIX** | Logic broadly usable; convert raw `DB::table` → Eloquent models, add capability gates, cursor pagination, indexes, audit logging. |
| `AttendanceController`/`LeaveRequestController`/`ChatController`/`SettingsController`/`AuditLogController` (HEAD) | **REBUILD** | Do not match Phase 5/6 designs (wrong tables, no approvals framework, no offline `client_id`). |
| `DashboardController` with hardcoded `0` counts | **DISCARD** | Violates no-mock rule; rebuild with real aggregates. |
| `DatabaseSeeder.php` (generic) | **REBUILD** | Must follow `data-prefill-reference.txt`. |
| `openapi/openapi.yaml` (auth + org only) | **EXTEND** | Keep auth/org paths; add all other modules spec-first. |
| `database/database.sqlite` | **DISCARD** | Never commit DB files. |
| `.env` / `.env.example` | **FIX** | Add Reverb/Pulse/SMTP/resend/Sentry/Supabase keys per `GUIDE-CREDENTIALS.md`. |

### 0.4 Frontend (`apps/web`) — NON-COMPLIANT, REBUILD THE LAYER

**Current working-tree reality (from audit):**
- `app/layout.tsx` reverted to create-next-app default (Geist fonts, "Create Next App" metadata).
- `app/page.tsx` does `redirect("/login")` — **`/login` does not exist** in the working tree.
- Dashboard has **no `layout.tsx`**; 5 orphan dashboard pages (audit, org/attendance, profile,
  reports, settings) render naked, unauthenticated, with no sidebar/topbar.
- Surviving pages import packages **not declared in `package.json`** (`date-fns`, `sonner`,
  `lucide-react`, `cmdk`, `@base-ui/react`, `@tanstack/react-table`, `react-grid-layout`, `clsx`,
  `tailwind-merge`, `cva`, `zustand`). They resolve only via pnpm hoisting from the root store.
- `package.json` declares **only** next/react/react-dom + dev tooling. **Missing:** TanStack Query,
  TanStack Table (declared), TanStack Virtual, Zustand (declared), React Hook Form, Zod (present in
  store), dnd-kit (present, unused), react-grid-layout (present), ECharts, Tiptap, Motion, Radix,
  lucide-react, sonner, next-themes (present), cmdk, date-fns.
- **No design system:** `globals.css` is the create-next-app default; the `ui/*` primitives reference
  semantic tokens (`--primary`, `--card`, `--popover`, `--ring`, …) that are **undefined** → broken
  styling. HEAD pages use dark `zinc` + `indigo` + `Geist` + raw `fetch` + `localStorage` + `alert()`.
- **Logo assets are NOT in `apps/web/public/`** — they live at repo-root `Images, SVG, PDF/`. The HEAD
  login references `/landscape-logo.png` which would 404. `manifest.json` theme_color is zinc.
- `components.json` declares shadcn style `base-nova`, baseColor neutral, cssVariables true — config
  is set but the tokens were never written.

**Salvage decisions:**
| Item | Decision |
|---|---|
| create-next-app `layout.tsx`/`page.tsx`/`globals.css` | **DISCARD** — rebuild with Inter+Sora, brand tokens, providers. |
| `app/(auth)/*` and `app/dashboard/*` pages (working tree + HEAD) | **DISCARD** as UI (wrong theme, raw fetch). Reuse the *screen inventory* (which pages must exist) but rebuild composition per COMPONENT-SYSTEM. |
| `components/ui/*` (button, card, input, dialog, dropdown-menu, table, badge, label, command, sonner) | **REBUILD** — shadcn-owned copies must use Radix primitives + the brand tokens (the `@base-ui/react`-based ones are non-standard; standardize on Radix per COMPONENT-SYSTEM §0). |
| `components/widgets/widget-engine.tsx` (react-grid-layout) + `time-clock-widget.tsx` | **REBUILD** structure kept, logic rewritten to Phase-5 timer isolation + optimistic clock. |
| `components/data-table/data-table.tsx` | **REBUILD** to add virtualization, cursor pagination, memoized rows, FilterBar integration. |
| `components/auth-guard.tsx`, `theme-provider.tsx`, `global-command.tsx`, `offline-indicator.tsx`, `pwa-registry.tsx` | **REBUILD** into the AppShell + providers layer. |
| `lib/offline-engine.ts` (Zustand store) | **REBUILD** into the single shared Offline Engine (ADR-010). |
| `lib/utils.ts` (`cn`) | **KEEP**. |
| `packages/ui` (only generated types) | **EXTEND** — add components, hooks, theme, API client per project §3. |

### 0.5 Build/run status — BROKEN (expected)

The app does **not** currently build or run as a usable product. Root `/` 404s on `/login`; API
serves only `/user`; design tokens are undefined. **Phase 0 fixes this to a deployable, empty-but-
real baseline before any feature work.**

### 0.6 Conflicts surfaced & resolved by this plan (authoritative)

| Conflict | Resolution (this plan is authoritative) |
|---|---|
| Working-tree deletions vs HEAD "complete M1" | **Neither is compliant.** Rebuild to FROZEN spec; salvage scaffold only. |
| Seed data: generic seeder vs `data-prefill-reference.txt` | **`data-prefill-reference.txt` wins.** Rebuild seeder to it. |
| `attendance_records`/`attendance_logs` (existing) vs `attendance_days`/`attendance_events` (Phase 5 design) | **Phase 5 design wins** (reconciliation source = events; summary = days). Drop the old tables. |
| Leave: standalone `leave_requests` vs `approvals` framework + `leave_requests` (Phase 6) | **Phase 6 design wins** — polymorphic `approvals` table, reusable by tasks/projects later. |
| Capability: static `CapabilityMatrix` PHP array vs `role_capabilities` table (Phase 2) | **Phase 2 design wins** — DB-backed, seed-driven, single source the middleware reads. |
| Login identifier: "Email OR Employee ID" (R1.2) vs username in seed | **AUTH-D1: support username OR email OR employee_id.** Username is canonical in the seed; harmless to add. |
| Fonts: `Geist`/`Inter` (code) vs `Inter + Sora` (DESIGN-SYSTEM §4) | **Inter + Sora, self-hosted, subset, swap, preloaded.** |
| Theme default: dark (HEAD) vs light (DESIGN-SYSTEM) | **Light (`#F7F7FB`) default; dark available; both colorful.** Persisted per user. |
| Data fetching: raw `fetch` + `localStorage` (code) vs TanStack Query + Sanctum bearer (ADRs) | **TanStack Query (server) + Zustand (UI only) + Sanctum bearer token in memory + httpOnly-equivalent handling (see SECURITY-D1).** |
| `@base-ui/react` vs Radix | **Radix UI + shadcn/ui only** (COMPONENT-SYSTEM §0); replace base-ui primitives. |
| `lucide-react@1.29.0` (suspicious version) | **Pin to a current `0.x` lucide-react; never `1.x`.** |
| API PHP version: composer says Laravel `^13.8` / PHP `^8.4` (project.md says Laravel 12) | **STK-D1: keep what is installed (Laravel 13 / PHP 8.4) — it is newer and compatible; update project.md ADR-003 note. No downgrade.** |
| Reverb/Pulse not installed vs required (ADR-013, R10.4) | **Install Reverb in Phase 3 (needed by widgets/notifications), Pulse in Phase 0 monitoring scaffold.** |
| `database.sqlite` committed | **Remove from git, add to `.gitignore`; CI/dev use in-memory SQLite for tests, Postgres (Supabase) for app.** |
| Next.js version: `16.3.0` installed vs project.md ADR-004 "16.2.12" | **STK-D2: keep installed 16.3.0; update ADR-004 note.** |

### 0.7 Authoritative decisions recorded by this plan (new ADRs to log)

- **ADR-019 — Rebuild-to-spec strategy:** existing UI/data layers are non-compliant scaffold; rebuild
  per FROZEN specs; keep monorepo + salvageable controller logic.
- **ADR-020 — Real seed data source:** `Images, SVG, PDF/data-prefill-reference.txt` is the canonical
  seed; role-specific passwords; `must_change_password=true`; timezone Asia/Kolkata.
- **ADR-021 — Login identifier = username OR email OR employee_id.**
- **AUTH-D1, STK-D1, STK-D2, SECURITY-D1** — see §0.6 table and §4 (all resolved).
- **SECURITY-D1 — Token storage (RESOLVED):** access token always in-memory (Zustand, never
  `localStorage`); a `Secure; HttpOnly` refresh-token cookie issued by the API restores the session
  silently via `GET /auth/refresh` on app load, with rotation + reuse-detection. **Cookie SameSite is
  set at runtime via auto-detect** (§4 SECURITY-D1): `SameSite=Strict` when `FRONTEND_URL` and
  `API_URL` share a registrable domain; otherwise `SameSite=None` + double-submit CSRF token on
  `/auth/refresh`. (Sanctum refresh tokens or a custom `refresh_tokens` table — chosen in Phase 1.)

---

## §1 — Authoritative contracts (do not re-decide during implementation)

These are settled. Any change requires a recorded ADR (project §11 process).

### 1.1 Roles, capabilities, permissions

- **Exactly 3 system roles:** Super Admin (`super_admin`) · HR (`hr`) · Employee (`employee`).
  Designations (Senior Game Developer, Designer, Director, Editor, Cameraman, Actor, Actress, …) are
  **profile labels**, never permission roles. A user may hold **multiple system roles** → triggers the
  Role Selection screen (R1.4).
- **Capability-based permissions only** (ADR project §5.4). Capabilities are granular keys
  (e.g. `attendance.clock-self`, `leave.approve-employee`, `users.manage`). `role_capabilities` table
  maps role→capability; `RequireCapability` middleware is the single enforcement point. **Frontend
  restrictions are always backed by backend authorization.** `super_admin` has wildcard `*`.
- **Per-role module/screen/action matrix (Base + Attendance + Leave):**
  | Area | Super Admin | HR | Employee |
  |---|---|---|---|
  | Dashboard | full company | team | personal |
  | Org: users (HR + Employee accounts) | full CRUD, roles, reset pw, deactivate, activity log | view team, limited | — |
  | Org: departments/teams | full CRUD + members | view | view |
  | Org: designations | full CRUD | view | view |
  | Directory | full + Send Message | full + Send Message | view + Send Message |
  | Profile (self) | edit photo/name/phone/designation, change pw, devices | same | same |
  | Attendance: clock self | yes | yes | **yes** (`attendance.clock-self`) |
  | Attendance: team today (HR) | yes | **yes** (`hr.view-team-attendance`) | — |
  | Attendance: company overview (Admin) | **yes** (`admin.view-all-attendance`) | — | — |
  | Attendance: manual correction | **yes** (`admin.correct-attendance`) | **yes** (within team, Phase 5 decision: HR may correct own-team) | — |
  | Attendance: history (self) | yes | yes | yes |
  | Leave: request self | yes | **yes** (`leave.request-self`) | **yes** (`leave.request-self`) |
  | Leave: approve employee leave | yes | **yes** (`leave.approve-employee`) | — |
  | Leave: approve HR leave | **yes** (`leave.approve-hr`) | — | — |
  | Leave: view all history | yes | team | own |
  | Reports (attendance/productivity) | full | limited (team) | — |
  | Settings (company/hours/holidays/policies) | **yes** | view | — |
  | Audit log | **yes** | — | — |
  > Sidebar items and screen-level controls render based on the **active role's capability list**
  > (fetched via `GET /me/capabilities`). Route guards + backend gates enforce the same.

### 1.2 Design system (FROZEN — implement exactly)

- **Palette:** brand violet `#8A2BE2` (deep `#9400D3`), gold `#FFD700` (warm `#FFA500`), pink
  `#FF1493`; primary gradient `linear-gradient(135deg,#9400D3,#8A2BE2,#FF1493)` (sign-in hero,
  dashboard headers, logo lockups only); gold gradient for premium/crown moments. Semantic:
  success `#16A34A`, info `#2563EB`, warning `#D97706`, danger `#DC2626`, neutral `#6B7280`,
  overtime `#D97706`. Surfaces: app bg light `#F7F7FB` / surface `#FFFFFF` / border `#E6E6EF`.
  Status pill map (R11.4): Gray=Not Started · Blue=In Progress · Amber=Pending · Green=Approved/
  Completed · Red=Redo/Rejected/Overdue.
- **Type:** Inter (UI) + Sora (display/brand). Self-hosted, subset, `font-display: swap`, preloaded.
  Scale per DESIGN-SYSTEM §4. Weights 400/500/600/700/800. Max 2 families.
- **Spacing/radius/elevation/motion:** per DESIGN-SYSTEM §5–§8. Sidebar 264↔72px collapse, Ctrl+B,
  220ms glide; pinned items at bottom; mobile = Sheet full-screen + bottom nav ≤5.
- **Logo placement (§10):** Landscape-Logo on sign-in hero; square `1.1 Logo.png` 28–32px in top bar
  + sidebar header; `Favicon.png` via Next metadata; `animated-logo.mp4` in empty states;
  `monochrome-logo-1.1.png` on dense/dark/PDF surfaces. **Never stretch/recolor/shadow.** Clear
  space = 1× height.
- **Tokens implementation:** CSS custom properties + Tailwind v4 `@theme` in `packages/ui`, exported
  to both apps. Single source — no magic numbers.
- **HARD RULE (config.yaml):** NO mock/placeholder/sample data, ever. Screens with no data show their
  real empty state. Every control performs its real function.

### 1.3 Component system (FROZEN — compose only from catalog)

Every screen composes ONLY from `COMPONENT-SYSTEM.md` §1–§8 primitives/composites. shadcn components
are owned (copied into `packages/ui`), built on **Radix** (not base-ui). Generic primitives in
`packages/ui`; module composites (e.g. `ClockInWidget`, `LeaveApprovalRow`) in `apps/web`. Standard
states on every interactive component: rest/hover/focus-visible(active 0.96)/disabled/loading/error.
Focus = 2px brand-violet ring. Lucide icons only, stroke-width 1.75.

### 1.4 State management (ADR-008)

- **TanStack Query** = all API/server state. Per-entity `staleTime`/`gcTime`; `select` for derived;
  cursor pagination; stale-while-revalidate on navigation (no spinner for cached data).
- **Zustand** = UI state only (sidebar, theme, dialogs, filters, drafts). Slice selectors, no whole-
  store subscriptions. **Never store API data in Zustand.**
- **React Hook Form + Zod** for forms; validation on 400ms pause; submit disabled+dot-loader.

### 1.5 Offline engine (ADR-010) — single shared framework

Interface: Queue → Sync Manager → Conflict Resolver → Retry Manager → Storage (IndexedDB) →
Connectivity Monitor. Queue item = {operation, entity, payload, version, created, retryCount, status}.
States: Pending→Syncing→Completed→Failed→Conflict→Cancelled. Retry ladder 1s→5s→30s→2m→5m→Manual.
**Conflict resolution is per-entity (ADR-009):** Settings=Last Write Wins · Tasks=Version+Merge ·
Documents=Version+Manual · **Attendance=Server Validation** · Finance/HR=Server Wins ·
Chat/Comments=Timestamp.

### 1.6 Performance (ADR-018, PERFORMANCE-STANDARDS — CI-enforced)

LCP ≤2.5s p75 / FCP ≤1.8s / TTFB ≤600ms web·800ms api / INP ≤200ms / CLS ≤0.1. API p95 ≤200ms read,
≤300ms write. **Zero N+1; ≤5 SQL/list.** Cursor pagination. Lists >100 rows virtualized
(`@tanstack/react-virtual`). First-Load JS ≤200KB gz/route. Heavy libs (ECharts/Tiptap/dnd-kit/xlsx/
Gantt/calendar) dynamically imported + idle-prefetched. Skeletons over spinners. Optimistic UI for
safe mutations (pin/reorder/read-mark/toggle/**clock-in**) with rollback. Per-widget error boundaries.
Frequent workflows ≤2 clicks, no reloads.

---

## §2 — Phase format & global Definition of Done

### 2.1 Each phase below specifies
- **Objectives & scope** · **Modules** · **Dependencies**
- **Database work** (tables, columns, indexes, constraints, migrations)
- **Backend work** (API endpoints, services, validation, permissions, audit, OpenAPI)
- **Frontend work** (pages, components, state, API hooks)
- **UI/UX requirements** (components used, states, responsive, animations, micro-interactions)
- **Business logic / validation rules / edge cases**
- **Permissions** (capabilities, route guards, backend gates)
- **Testing requirements** (unit/feature/integration/perf/a11y)
- **Verification criteria & completion conditions**

### 2.2 Global Definition of Done (every phase, in addition to phase-specific)
- [ ] OpenAPI spec written **before** any route; contract test green on CI (ADR-005).
- [ ] All new endpoints Sanctum-guarded; capability gates enforced (ADR §5.4).
- [ ] Zero N+1; ≤5 SQL/list (query-count test in CI); indexes added for every filtered/joined/ordered
      column; cursor pagination (not OFFSET).
- [ ] Lists >100 rows virtualized; rows `React.memo` + stable keys; no inline fn props on hot lists.
- [ ] First-Load JS ≤200KB gz/route; route lazy-loaded; heavy libs dynamic-imported.
- [ ] Lighthouse CI green on new routes (LCP/INP/CLS/FCP); axe-core clean.
- [ ] Skeletons over spinners; real empty states; per-widget error boundaries; optimistic UI on safe
      mutations with rollback; offline queue wired (where applicable).
- [ ] Every control performs its real function — no stubs, no `alert()`, no mock data.
- [ ] Components compose ONLY from the FROZEN catalog; brand tokens used; logo placement correct.
- [ ] Lint + typecheck + tests pass (real results reported, not assumed).
- [ ] Seeder updated (when data changes); staging seeded; migrated.
- [ ] Deployed staging → smoke-tested → production; rollback + backup verified.
- [ ] Phase spec archived to `openspec/specs/` (freeze) via the OpenSpec workflow; TRACKER ✅.

---

# PHASE 0 — Project audit, architecture validation & foundation repair
**Capability:** `foundation` · **Depends on:** — · **Focus:** make the project build, run, and deploy
as an empty-but-real baseline that obeys the FROZEN contracts. **No product features.**

### Objectives
Repair the broken working tree; lock the stack to FROZEN-spec-compliant versions; stand up the
monorepo, packages/ui, the spec-first OpenAPI pipeline, CI, and per-environment deploy. Establish the
**performance CI rails** (bundle budget, Lighthouse CI, query-count guard, prod-build guardrails) and
**monitoring scaffolding** (Sentry/Pulse env-wired). By end of Phase 0: `apps/web` builds and shows a
branded placeholder, `apps/api` `/health` returns 200 on Railway, Supabase Postgres reachable, CI green.

### Database work
- Decide DB policy: **app DB = Supabase Postgres** (per env); **tests = in-memory SQLite** (fast CI).
- Remove `apps/api/database/database.sqlite` from git; add to `.gitignore`.
- Keep Laravel default migrations (`users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`,
  `failed_jobs`, `personal_access_tokens`) but **fix** `personal_access_tokens` to restore
  `ip_address` (nullable) and keep `expires_at` index (needed by Phase 1 sessions + ADR-014).
  > Phase 0 ships ONLY defaults; product tables land in their owning phases per the FROZEN designs.

### Backend work
- Restore `routes/api.php` with at least `GET /health` → `{status:"ok"}` (unauth) and `GET /user`
  (sanctum). Remove the broken single-route state.
- Restore `User` model to use `HasApiTokens` (+ `Notifiable`, `HasFactory`) so Sanctum works; keep
  `$fillable` minimal now (extended Phase 1/2). This unblocks tests.
- **Install Laravel Reverb** (`composer require laravel/reverb`) + broadcasting driver + env wiring
  (needed Phase 3/8; install now per §0.6). **Install Laravel Pulse** (`composer require laravel/pulse`)
  + `php artisan pulse:install` + publish config (R10.4 monitoring scaffold).
- `.env.example` extended with: `APP_TIMEZONE=Asia/Kolkata`, `DB_*` (Supabase pooler), `SANCTUM_*`,
  `REVERB_*`, `PULSE_*`, `MAIL_*`/`RESEND_API_KEY`, `SENTRY_*` (Laravel DSN), `FRONTEND_URL`,
  `SESSION_DOMAIN`, refresh-token secret. Align with `GUIDE-CREDENTIALS.md`.
- OpenAPI: keep base doc (info, servers per env, `GET /health`, bearerAuth). Add a CI lint step
  (`redocly lint` or `spectral`) gating PRs.
- Logging: ensure `config/logging.php` channels + Sentry Laravel provider scaffold (DSN env-optional).

### Frontend work
- Fix `app/layout.tsx`: load **self-hosted Inter + Sora** (subset, swap, preloaded) — NOT Geist; set
  metadata (title "Games4King Workplace OS", description, `Favicon.png`); wrap children in providers
  stub (ThemeProvider, QueryClientProvider, Toaster) to be filled Phase 1/3.
- Replace `app/page.tsx` redirect with a **branded placeholder** importing from `@g4k/ui` (Phase 0
  ships no `/login`; landing just confirms the app builds). Phase 1 adds the real login.
- **Copy logo assets into `apps/web/public/`** (or import via `next/image` from a shared assets
  path): `1.1 Logo.png` → `/logo.png`, `Landscape-Logo.png` → `/landscape-logo.png`, `Favicon.png`
  → `/favicon.png`, `monochrome-logo-1.1.png` → `/logo-mono.png`, `animated-logo.mp4` →
  `/animated-logo.mp4`. Update `manifest.json` theme_color to brand violet, icons to brand favicon.
- Initialize Tailwind v4 `@theme` with brand tokens in `packages/ui/src/theme` and re-export; wire
  `globals.css` to consume them (full token set lands Phase 3, but Phase 0 must not ship broken
  `--background`-only tokens).

### packages/ui work
- Make `@g4k/ui` resolvable (`workspace:*`), with `src/{components,hooks,api,theme,types}`.
- API client: configure generated types pipeline (`openapi-typescript` → `src/types/api.ts`) from
  `apps/api/openapi/openapi.yaml`; a thin fetch wrapper with bearer injection + refresh interceptor
  (Phase 1 implements refresh; Phase 0 reserves the interface).
- Theme: export the token CSS variables + Tailwind v4 theme config (Phase 3 finalizes; Phase 0 seeds).

### CI/CD & infra
- GitHub Actions: **web** job (pnpm install → lint → typecheck → build → bundle-analyzer budget
  ≤200KB gz/route → Lighthouse CI) + **api** job (composer install → test → pint → OpenAPI lint).
- Deploy: api → Railway (staging auto on merge→main; prod manual promote); web → Vercel (preview on
  PR; prod manual). Supabase staging + prod projects; daily backups + PITR documented.
- Environments: `dev` (local), `staging`, `production`. `DEPLOYMENT.md` lists every var.

### Testing requirements
- API: `GET /health` → 200 `{status:"ok"}`; migration applies on fresh Postgres + on SQLite.
- Web: branded placeholder renders; `pnpm build` green; bundle budget enforced.
- CI: lint+typecheck+build+test green on a PR.

### Verification & completion
- `curl /health` → 200 on Railway staging; Vercel preview URL loads branded placeholder with Inter+Sora
  and brand logo (no Geist, no zinc).
- `pnpm build` + `php artisan test` pass; OpenAPI lints clean.
- Bundle budget, Lighthouse CI, query-count helper, monitoring env all wired (can be informational
  in Phase 0, gating from Phase 1).
- Commit message notes ADR-019/020/021 recorded in `project.md` §11.

---

# PHASE 1 — Authentication & role-based access
**Capability:** `authentication` · **Depends on:** 0 · **Reqs:** R1.1–R1.13 ·
**Spec detail:** `openspec/changes/phase-01-authentication/*`

### Objectives
A branded, secure sign-in for all three roles: sign-in (username/email/employee_id + password,
show/hide, loading/error), dual-role selection, forgot-password (SMTP + Admin-approval), account
lockout (5/10min), suspicious-login alerts, force first-login password change, onboarding welcome,
per-device sessions + remote logout, capability-gated route guards, responsive + offline login queue.

### Database work (new/changed)
- `users`: ensure `employee_id` (unique nullable), `username` (unique nullable — AUTH-D1), `email`
  unique, `password` (Argon2id cast), `must_change_password` bool default true, `onboarded_at`
  nullable, `status` enum(active,inactive) default active, `failed_login_count` int default 0,
  `locked_until` nullable, `last_login_at` nullable, `avatar_url` nullable, timestamps. Index
  `(email)`, `(username)`, `(employee_id)`, `(status)`.
- `role_assignments` (Phase 1 table): `id`, `user_id` fk cascade, `role` enum(super_admin,hr,
  employee), `created_at`. Unique `(user_id, role)`. (Phase 2 extends its use.)
- `auth_sessions` (device metadata, extends Sanctum): `id`, `user_id` fk, `token_hash` (sha256),
  `device_name`, `device_meta` json (ua/ip/last_seen), `last_used_at`, `created_at`, `revoked_at`
  nullable. **Or** store `ip_address` + device_name directly on `personal_access_tokens` (simpler;
  pick one and document ADR). Keep token abilities carrying `role:<active>`.
- `password_resets`: Laravel default + `channel` enum(smtp,admin), `approved_by` nullable,
  `approved_at` nullable, `expires_at`.
- `login_attempts` (audit): `id`, `user_id`/`identifier`, `ip`, `user_agent`, `success` bool,
  `created_at`. Index `(identifier, created_at)`. Drives lockout + suspicious detection.
- `refresh_tokens` (SECURITY-D1): `id`, `user_id` fk cascade, `token_hash` (sha256), `expires_at`,
  `revoked_at` nullable, `device_name`, `created_at`. Index `(user_id)`, `(expires_at)`.

### Backend work
- **Spec-first OpenAPI** for all auth paths (`/auth/login`, `/auth/refresh`, `/auth/logout`,
  `/auth/role/select`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`,
  `/auth/sessions` GET/DELETE, `/auth/me`). Generate types.
- `AuthController` (salvage + fix): login resolves user by `username OR email OR employee_id`;
  Argon2id verify; rate-limit per identifier+IP (5 attempts/600s → 423 with `retry_after`); on success
  issue **access token (short-lived, in-memory) + refresh token (HttpOnly cookie)**; record
  `login_attempts`; detect suspicious (new device/IP vs last) → write `notifications`/audit + SMTP to
  Admin/HR (R1.8). Enforce `must_change_password` flag in response (client routes to change screen).
- `/auth/refresh`: validates HttpOnly refresh cookie → new access token; rotates refresh token.
- `forgotPassword`: SMTP channel → signed reset link email (Mailable); admin channel → creates an
  Admin-approval request (Phase 6 approval framework can absorb this; minimal stub here). 202 always
  (no user enumeration).
- `resetPassword`: token + email + new password (confirmed) → update + clear `must_change_password`.
- `changePassword`: current pw verify + new pw (policy per Phase 10 settings, defaults min 8, mixed);
  clears `must_change_password`.
- `roleSelect`: re-issue token with `role:<chosen>` ability (only if assigned); update active role.
- `sessions`/`revokeSession`/`logout`: list devices (name/IP/last_used/current); revoke by id; logout
  revokes current + broadcast `SessionRevoked` on `private-user.{id}` (Reverb) for instant sign-out.
- `RequireCapability` middleware + a minimal capability resolver for Phase 1 (Phase 2 makes it
  DB-backed). For Phase 1, hardcode the auth-relevant lookups but route through the service interface
  so Phase 2 swaps the implementation without changing call sites.

### Frontend work
- **Design-system primitives needed now (in `packages/ui`, Radix-based):** `Button`, `Input`,
  `PasswordInput` (eye toggle), `Label`, `Form`/`FormField`/`FormItem`/`FormMessage` (RHF+Zod),
  `Card`, `Tooltip`, `Toaster` (sonner, top-right), `Skeleton`, `EmptyState`. Token-driven, brand.
- **Pages (`app/(auth)/`):**
  - `login/page.tsx` — `SignInCard` (COMPONENT-SYSTEM §7): brand-gradient hero with Landscape-Logo,
    welcome copy, copyright "Games4King Workplace OS", info Tooltip "Gen2k Conglomerate (2018) •
    Milestone 1"; identifier `Input` + `PasswordInput` (show/hide); primary `Button` with loading
    dot-loader + disabled; forgot-password `Link`; RHF+Zod (identifier required, password required,
    validation on 400ms pause). **TanStack Query `useMutation`** for login; **Zustand** for in-memory
    token; **offline queue** login attempt when offline (R1.13) with banner.
  - `role-select/page.tsx` — `RoleSelectGrid` for dual-role users.
  - `forgot-password/page.tsx`, `reset-password/page.tsx` — RHF+Zod forms.
  - `change-password/page.tsx` — forced first-login change (current pw + new pw + confirm).
  - `onboarding/page.tsx` — welcome Card step sequence; sets `onboarded_at`.
- **App shell skeleton:** a minimal `app/layout.tsx` provider stack (ThemeProvider light default,
  QueryClientProvider, Toaster, OfflineIndicator) and a `AuthGuard`/route guard reading in-memory
  token + capabilities; redirect logic: no token → `/login`; `must_change_password` →
  `/change-password`; `!onboarded_at` → `/onboarding`; dual role → `/role-select`; else `/dashboard`.
  (Full AppShell lands Phase 3.)
- **Token handling (SECURITY-D1):** access token in memory (Zustand, cleared on logout); on app load,
  call `/auth/refresh` (HttpOnly cookie) to restore silently; 401 → attempt refresh once → retry or
  logout. **Never** persist access token to `localStorage`.

### UI/UX requirements
- Brand-gradient hero; Inter (UI) + Sora (brand headings); logo per §10; loading animation on submit;
  generic error message on failure (no field disclosure); 120ms press, 280ms dialog, 200ms toast.
- Responsive (360→1920); ≥44px touch targets; visible focus ring; full keyboard nav; reduced-motion.
- States: loading (button dot-loader + page skeleton), error (inline + toast), success (toast +
  redirect), offline (banner + queued attempt), locked-out (message + retry-after).

### Business logic / validation / edge cases
- Identifier resolution order: username → email → employee_id. Case-insensitive username/email.
- Lockout: 5 failed within 10 min → `locked_until` = now+10min; clear on success; manual Admin override.
- Suspicious: new IP/UA vs last successful → notify HR+Admin (SMTP now; Phase 8 notification center).
- Refresh-token rotation; reuse of a rotated/revoked refresh token → revoke entire family (theftdetect).
- Force-change gate blocks all non-auth endpoints until `must_change_password` cleared (middleware).
- Dual-role users must select before any capability-gated route.

### Permissions
- Login/forgot/reset/refresh are unauthenticated. All others require a valid access token.
- `role:select` requires the chosen role to be in `role_assignments`.
- Phase 1 capabilities resolved internally; Phase 2 externalizes to `role_capabilities`.

### Testing requirements
- API feature: login success (each role), login by username/email/employee_id, wrong password (401 +
  attempt increment), lockout after 5 → 423 with retry_after, suspicious-login record, refresh flow +
  rotation + reuse-revocation, force-change gate, role select unauthorized role → 403, sessions list +
  revoke, logout. Query-count test on `sessions` (≤5 SQL).
- Web: login renders, Zod validation, loading/disabled, error toast, offline queue, redirect logic
  matrix, role-select for dual-role, axe-core clean.
- Security: no access token in localStorage; refresh cookie HttpOnly+Secure+SameSite=Strict.

### Verification & completion
- Sign in as `karthik`/`Admin@123` (Super Admin), `aravind`/`Hr@123` (HR), `praveen`/`Dev@123`
  (Employee) → land on correct dashboard route; trigger lockout; run forgot/reset; force-change on
  first login; revoke a device from another device (instant sign-out via Reverb).
- Perf: sign-in FCP ≤1.2s, LCP ≤1.2s lab; login p95 ≤300ms; dashboard route prefetched on idle.
- Archive Phase 1 spec; TRACKER ✅.

---

# PHASE 2 — Org management: Admin / HR / Employee / Department / Team / Profile / RBAC
**Capability:** `org-management` · **Depends on:** 0,1 · **Reqs:** R2.1–R2.13 ·
**Spec detail:** `openspec/changes/phase-02-org-management/*`

### Objectives
Full org management: DB-backed capability matrix enforced on every org endpoint; designations master
(15 seed from `data-prefill-reference.txt`); Admin CRUD for HR + Employee accounts (incl. dual role,
dept/team assignment, reset password, deactivate, activity log); Admin-only Department + Team CRUD
with member lists + archive; configurable auto-numbering; reusable master-data table pattern;
searchable Employee Directory (grid/list + Send Message); profile screens (all roles) with photo
popup + device management; **real seed data loaded**.

### Database work
- `users` extensions: `department_id` (fk nullable), `team_id` (fk nullable), `designation_id` (fk
  nullable), `phone` nullable, `reports_to` (fk users nullable), `employee_code` (from numbering
  scheme, unique), `profile_visibility` json, `joining_date` date nullable, `blood_group` nullable.
  Indexes `(department_id,status)`, `(designation_id,status)`, `(status, employee_code)`.
- `departments`: `id`, `name` unique, `description`, `code` (DEP001, from numbering), `status`
  (active/archived), timestamps.
- `teams`: `id`, `department_id` fk cascade, `name`, `description`, unique `(department_id,name)`.
- `designations`: `id`, `name` unique, `description`, timestamps.
- `capabilities`: `id`, `key`, `description`, `group`. Seed-driven, not user-editable.
- `role_capabilities`: composite PK `(role, capability_key)` — **the single matrix the middleware
  reads.** Seed: super_admin=`*`; hr=`directory.view`, `users.employee.read`, `directory.send-message`,
  `attendance.view-team`, `leave.approve-employee`, `leave.request-self`, `attendance.clock-self`,
  `me.update`; employee=`directory.view`, `directory.send-message`, `leave.request-self`,
  `attendance.clock-self`, `me.update`.
- `numbering_schemes`: `id`, `entity` enum(company,employee,department,…), `prefix`, `start_at`,
  `length`, `suffix`, `format`, `next_seq`, `increment`, timestamps. Atomic generation (row lock).
- `audit_logs`: `id`, `user_id` fk nullable, `action_type`, `resource_type`, `resource_id`,
  `metadata` json, `ip_address`, timestamps. Index `(user_id,created_at)`, `(action_type,created_at)`.
  (Phase 10 builds the UI; Phase 2 builds the writer service used everywhere.)
- Seed: company, 2 departments (Game Dev Team/YouTube Team), 15 designations, 13 employees per
  `data-prefill-reference.txt`, working schedule defaults (09:00–18:30, Asia/Kolkata).

### Backend work
- **Spec-first OpenAPI** for `/users`, `/departments`, `/teams`, `/designations`, `/directory`,
  `/me/capabilities`, `/numbering-schemes`.
- **`CapabilityService`** (DB-backed): resolves active role → capability list; `has($key)`; cache
  per request. `RequireCapability` middleware reads it. `GET /me/capabilities` returns the active
  role's list (frontend uses only to render).
- **`AuditService`**: every important write (create/update/delete/role-change/deactivate/approve/
  reset-password) writes an `audit_logs` row in a transaction.
- `UserController`: index (cursor paginated, filters: search/department/status/role, eager-load dept/
  team/designation/roles, ≤5 SQL), store (auto employee_code, default role-specific password,
  `must_change_password=true`, role assignments incl. dual), show, update (incl. role reassignment),
  destroy/deactivate (soft via status), reset password, activity log (filtered audit). Capability
  gates: `users.hr.manage` / `users.employee.manage` (Admin only).
- `DepartmentController`/`TeamController`: CRUD + member list + archive; Admin-only (`departments.
  manage`). `DesignationController`: CRUD (`designations.manage`).
- `DirectoryController`: search (name/email/employee_id/username, debounced 250ms server), public
  profile + visibility rules, `Send Message` action (creates/opens a Direct chat — Phase 8 builds the
  chat UI; Phase 2 creates the conversation row or returns a stub id; document the contract).
- `ProfileController`: show (per visibility), update (name/phone/avatar_url/designation), photo upload
  popup (format+size validation, stored via filesystem/S3), change password, devices list + revoke.
- `AutoNumberingService`: atomic next-seq generation per entity; editable scheme (no code changes).
- **Master-data table pattern** (R2.9): a reusable controller trait/resource for CRUD + import/export +
  activate/deactivate + search/filter/pagination + audit — used by users, departments, designations,
  and later tasks/leave.

### Frontend work
- **Primitives added (packages/ui):** `Select` (Radix), `Combobox` (Popover+Command), `Checkbox`,
  `Switch`, `RadioGroup`, `Avatar`/`AvatarGroup`, `Badge`/`StatusBadge`, `Separator`, `Pagination`,
  `Tooltip`, `DropdownMenu`, `ContextMenu`, `Sheet`, `Dialog`/`AlertDialog`, `Popover`, `ScrollArea`,
  `DataTable` (TanStack Table + virtualized, cursor pagination, memoized rows), `FilterBar` (search +
  status multi-check + dept/team combobox + sort select + removable chips + Clear-all), `FileUpload`
  (popup, Radix Dialog), `EmptyState`, `Skeleton`.
- **Pages:**
  - `dashboard/org/users/page.tsx` — Admin: HR + Employee `DataTable` (filterbar, sort, density), row
    actions (edit/deactivate/reset-pw/activity) in `DropdownMenu`, create/edit in `Dialog` (`UserForm`
    with photo FileUpload, role Checkbox group for dual-role, dept/team Combobox, designation Select).
  - `dashboard/org/departments/page.tsx` — Departments + Teams CRUD; member `AvatarGroup`; archive.
  - `dashboard/org/designations/page.tsx` — Designations master (CRUD).
  - `dashboard/directory/page.tsx` — grid/list toggle, virtualized, search (debounced), card shows
    avatar/name/designation/dept/email/phone(if visible); click → `Sheet` profile + Send Message.
  - `dashboard/profile/page.tsx` — `ProfileForm` + photo popup + change password + devices `DataTable`
    with remote-logout `IconButton` → `AlertDialog`.
- **State:** TanStack Query for all lists/mutations (staleTime directories/departments 5m); optimistic
  for activate/deactivate/role-change with rollback; Zustand for filters/dialogs/density.
- **Routing/guards:** `/dashboard/org/*` requires `users.*.manage` capabilities; sidebar items render
  by capability list; backend gates mirror.

### UI/UX requirements
- White/light surfaces, brand accents, colorful Lucide icons per role/area, status badges, hover lift
  (e2), 280ms dialogs, 200ms sheets, 180ms table interactions. Empty states per context (no users yet,
  no departments). Skeleton table rows. Inline edit where specified. Responsive: table→cards on mobile;
  filters collapse into a Sheet.
- Micro-interactions: button press 0.96/120ms, optimistic badge flips, toast confirmations.

### Business logic / validation / edge cases
- Cannot deactivate/delete the last Super Admin (guard).
- Cannot remove a role leaving the user role-less (must keep ≥1).
- employee_code unique; auto-numbering atomic (row lock) — concurrent creates never collide.
- Photo upload: client-side type (image/*) + size (≤2MB) validation before upload; server re-validates.
- Profile visibility rules (phone/email) enforced server-side.
- Department archive hides from active lists but preserves history.

### Permissions
- `users.hr.manage`, `users.employee.manage`, `departments.manage`, `designations.manage` = Admin only.
- `directory.view`, `directory.send-message`, `me.update` = all roles.
- Frontend nav + screen controls + route guards all driven by `GET /me/capabilities`.

### Testing requirements
- API feature: capability gate denies unauthorized on every org endpoint; HR/Employee CRUD lifecycle;
  dual-role assign/reassign; dept/team CRUD admin-only + member list + archive; designation CRUD;
  auto-numbering generate+advance+edit; master-data import/export/search/paginate; directory search +
  public profile + visibility; profile edit + photo validation + change password; device revoke.
  Query-count tests (≤5 SQL/list); zero N+1; cursor pagination.
- Web: directory grid/list + search + virtualization (1000 rows, 60 FPS); profile + photo popup;
  routing guards by capability; optimistic + rollback; offline queue of a user edit (Server Wins);
  axe-core clean.

### Verification & completion
- Create/edit/deactivate a user; assign dual role; search directory; verify non-admin blocked from
  `/org/users` endpoint (403); verify employee_code auto-numbers (G4K014 next); verify audit row
  written on each action; verify photo upload rejects oversize; verify Send Message creates a chat.
- Seed loads exactly 13 employees + 1 company + 2 departments + 15 designations with real data.
- Archive Phase 2 spec; TRACKER ✅.

---

# PHASE 3 — Design system, app shell, layouts, navigation, branding
**Capability:** `app-shell` · **Depends on:** 0,2 · **Reqs:** R3.1–R3.16, R11.2/R11.4/R11.6/R11.7/R11.8
· **Spec detail:** `openspec/changes/phase-03-app-shell/*`

### Objectives
Finalize the FROZEN design system in code; build the role-aware AppShell (top bar + animated sidebar +
mobile bottom nav + hamburger Sheet), breadcrumbs, pinned items, command palette (Ctrl+K), keyboard
shortcuts (Ctrl+B/N//Esc/Enter), form system (validation/autosave/draft/restore), FilterBar, confirmation
dialogs, inline editing, dnd reorder, pagination, toasts, skeletons, empty states, PWA manifest + SW,
offline banner. This phase makes the **Base Application Module's shell** production-polished.

### Database work
- `user_preferences` already (Phase 1/2 `preferences` json on users) — extend schema usage for:
  sidebar collapsed state, theme, density, pinned items, saved views, recently viewed, drafts (drafts
  live in IndexedDB client-side; preferences persist user-level UI state).
- No new product tables.

### Backend work
- `GET/PUT /auth/preferences` (exists) — ensure it accepts sidebar/theme/density/pinned/recent.
- Reverb private/presence/public channels configured (needed by Phase 4 widgets + Phase 8). Channels:
  `private-user.{id}`, `private-org`, `presence-*`, public announcements.
- Caching: route/config/view cache + OPcache + query cache for hot reference data (departments,
  designations, capabilities) per P-CACHE-SRV.

### Frontend work — packages/ui (complete the catalog)
- Finalize **all** tokens in `@theme`: brand palette, semantic, surfaces, type scale, spacing, radius,
  elevation, motion durations/easings, dark variants. Export CSS vars + Tailwind v4 theme.
- Complete component catalog per COMPONENT-SYSTEM §1–§8 (Radix-based): all form primitives, overlays,
  data display (DataTable/Combobox/Badge/Avatar/Progress/Separator/Skeleton/EmptyState), navigation
  (AppShell, SidebarNavItem/NavGroup, PinnedItems, Breadcrumb, BottomNav, CommandDialog), filters
  (FilterBar, Pagination), feedback (Toast/Sonner, NotificationsBell stub, AnnouncementCard stub,
  OfflineBanner), and editors reserved (TiptapEditor/Chart lazy stubs implemented Phase 7/5).
- **Form system:** `Form`/`FormSection` + `useFormDraft(key)` (IndexedDB-backed, 30s autosave, restore
  banner) + on-pause Zod validation + submit dot-loader + success toast.

### Frontend work — AppShell (`apps/web`)
- `app/dashboard/layout.tsx` = `AppShell`:
  - **TopBar:** square logo 28px + "Workplace OS" wordmark (Sora 700); global search stub (Ctrl+K
    hint); `NotificationsBell` (unread Badge, popover); avatar `DropdownMenu` (profile, theme toggle,
    density, logout). Sticky, e4, blurs on scroll.
  - **Sidebar:** 264↔72px collapse (Ctrl+B), 220ms glide, labels fade before width, collapsed = icon+
    tooltip, active = violet-tinted bg + brand left bar + 600 weight, hover = surface-2; `NavGroup`
    sections (Attendance parent etc.) collapse children 180ms; **PinnedItems at bottom**; thin themed
    scrollbar. Role-aware nav filtered by capabilities (Dashboard, Directory, Attendance, Leave,
    Projects, Tasks, Chat, Announcements, Reports, Org [Users/Departments/Designations], Settings,
    Audit). Persists collapsed per user.
  - **Mobile:** sidebar hidden; hamburger → full-screen `Sheet` (280ms); **bottom nav ≤5** (Dashboard,
    Attendance, Chat, Directory, Profile) with attendance prominent; ≥48px attendance button.
  - **Breadcrumb** below top bar on detail screens; each crumb a Link; ellipsis on narrow.
  - **CommandDialog** (Ctrl+K): navigate, create-new (context), pin/unpin, toggle theme, saved view,
    recent. Instant client fuzzy index.
  - **Keyboard shortcuts:** Ctrl+K, Ctrl+N (context new), Ctrl+/ (help overlay), Esc close, Enter
    submit/confirm. Shortcut overlay component.
- **PWA:** `manifest.json` (brand icons, theme violet, standalone), service worker (offline shell +
  cached assets); offline banner (`OfflineBanner`) when `navigator.onLine===false`.
- **Global states:** `EmptyState` (illustration + copy + optional action, `animated-logo.mp4` where
  relevant), `Skeleton` (content-shaped), per-widget `ErrorBoundary`, toasts (sonner top-right 4s).
- **Mobile/responsive:** fluid 360→1920; tables→cards; filter bars collapse to Sheet; reserved dims
  for CLS ≤0.1.

### UI/UX requirements
- Vibrant but professional: gradients only on headers/hero/logo lockups; disciplined semantic colors
  for data. Polished micro-interactions everywhere. Status badges consistent (Gray/Blue/Amber/Green/Red).
- Accessibility: WCAG AA contrast, full keyboard nav, visible focus, reduced-motion, ARIA on icon-only
  buttons (tooltip doubles as label), ≥44px touch (≥48px attendance).

### Business logic / validation / edge cases
- Sidebar state survives reload (preferences API + Zustand mirror).
- Command palette instant (<50ms); web-worker index if large.
- Offline banner auto-hides on reconnect; queued forms sync.
- Pinned items removable; recently-viewed capped; drafts restore only when a draft exists.

### Permissions
- Sidebar/nav items render per capability; routes guarded; deep-linking to a forbidden screen → 403 UI.
- Bottom nav shows only allowed items.

### Testing requirements
- Web: toggle theme/density; pin an item; submit a form (autosave/restore); open palette; resize to
  mobile → bottom nav appears; keyboard shortcuts work; render-count test on nav (no re-render storm
  on unrelated state); axe-core clean; Lighthouse CI on shell route.
- Bundle: AppShell route ≤200KB gz First-Load; lazy-load heavy children.

### Verification & completion
- Desktop + mobile (360/768/1024/1440) visual review vs DESIGN-SYSTEM; logo placement correct in top
  bar, sidebar (expanded+collapsed), sign-in, manifest; animated logo in an empty state.
- Ctrl+K/B/N//Esc/Enter all functional; offline banner + queued form; theme persists.
- Archive Phase 3 spec; TRACKER ✅. **Base Application shell complete.**

---

# PHASE 4 — Dashboard framework & widgets (Base module capstone)
**Capability:** `dashboards` · **Depends on:** 3 · **Reqs:** R4.1–R4.9 ·
**Spec detail:** `openspec/changes/phase-04-dashboards/*`

### Objectives
Widget Engine (drag/resize/collapse/refresh/lazy/offline/realtime/adaptive), per-user React Grid
Layout (ADR-007) saved to preferences, generic JSON-fed Metric Widget, and the three role dashboards
rendering **real data** where the module exists and **true empty states** where it doesn't yet
(Attendance/Leave widgets plug in Phase 5/6). Quick-action shortcuts. This caps the **Base Application
Module** — after Phase 4 the foundation (auth + org + shell + dashboard) is complete and polished.

### Database work
- Reuse `user_preferences` for per-user widget layout (JSON). No new tables.

### Backend work
- `GET /dashboard/metrics` → **real aggregates** from real tables: total/active employees, active
  projects (Phase 7 or empty), today attendance (present/absent/late — Phase 5 or 0 with empty state),
  pending approvals (Phase 6 or empty), pending tasks (Phase 7 or empty). **No hardcoded numbers.**
  Each metric computed server-side; ≤5 SQL; cached 30s.
- Realtime: dashboard widgets subscribe to relevant Reverb channels (org changes refresh counts).

### Frontend work
- **`WidgetEngine`:** manifest `{id,title,size,permissions,dataProvider,refresh,lazy,realtime,offline,
  settings}`; React Grid Layout drag/resize; each widget in its own `ErrorBoundary`; lazy-load via
  IntersectionObserver; refresh icon on hover; dismissible; adaptive (Small=metric, Medium=metric+
  stats, Large=chart+stats+trend+actions). Layout saved per user (PUT preferences).
- **`MetricWidget`:** generic JSON-fed (title, value, icon, delta, endpoint, secondary). Reused.
- **Role dashboards** (DESIGN-SYSTEM §13 composition):
  - Super Admin: total/active employees (Small), active projects (Small), today attendance (Small→Med),
    pending approvals (Large, quick-access), recent activity feed (Large, dense audit), Quick Task
    Assignment (Medium — wired Phase 7).
  - HR: today team attendance (Small→Med), active projects (Small), pending leave requests (Medium,
    approve/reject quick — wired Phase 6), pending submissions (Medium), Quick Task Assignment.
  - Employee: active projects mine (Small), pending tasks mine (Small), **Attendance widget
    Start/Pause/End + live timer (Medium — wired Phase 5)**, recent task progress (Medium), task
    approval-status panel (Medium).
- Quick-action shortcuts on each dashboard; widgets clickable to go deeper.

### UI/UX requirements
- Vibrant dashboard header (brand gradient), colorful icons, animated progress bars (0→value 600ms),
  skeletons per widget, empty states per widget, error boundary per widget. 60 FPS drag/resize.

### Business logic / edge cases
- A slow/broken widget never blocks others (P-RESILIENT). Layout survives reload. Adaptive content
  changes on resize. Module-not-shipped widgets render true empty state (R3.13), never mock numbers.

### Permissions
- Widget visibility by capability; role dashboard composition gated by active role.

### Testing requirements
- Rearrange → persists across reload; refresh one widget independently; resize changes adaptive
  content; render-count test (timer never re-renders unrelated widgets — prep for Phase 5); per-widget
  error boundary isolates a failure; Lighthouse on dashboard route.

### Verification & completion
- Each role dashboard renders real counts (0 with correct empty state where module absent); layout
  persists; widget-level error isolation verified.
- Archive Phase 4 spec; TRACKER ✅. **Base Application Module DONE.**

---

# PHASE 5 — Attendance clock in/out, breaks, history, corrections (reference module)
**Capability:** `attendance` · **Depends on:** 2,3,4 · **Reqs:** R5.1–R5.16 · **Spec detail:**
`openspec/changes/phase-05-attendance/*` (FULLY specified — implement as written)

> **This is the reference module for day-to-day performance. Every later module follows its bar.**
> Conflict strategy = **Attendance = Server Validation** (ADR-009). The timer runs in the Offline
> Engine; the server reconciles.

### Objectives
Clock In / Start Break / End Break / Clock Out with auto-saved shift timeline; live HH:MM:SS timer
(survives navigation, amber on overtime, stops only on explicit End); personal calendar heatmap history
with per-day summaries; Admin company-wide overview (date/dept/person filters); HR today shift status +
weekly/monthly graphs; Admin/HR manual corrections with audit; overtime tracking + late badge; Excel
export; configurable shift-reminder scheduler; offline timer + Server-Validation sync.

### Database work (replace existing attendance tables with the FROZEN Phase-5 design)
- **`attendance_days`** (summary, one row/user/date): `id`, `user_id` fk cascade, `date`, `clock_in`
  nullable, `clock_out` nullable, `first_event`, `last_event`, `total_seconds` int, `break_seconds`
  int, `overtime_seconds` int, `status` enum(present,absent,late,leave), `late_minutes` int,
  `corrected_by` fk nullable, `source` enum(local,manual,server), `version` int, timestamps.
  Unique `(user_id,date)`. Index `(date)`, `(user_id,date)`, `(status,date)`.
- **`attendance_events`** (immutable append-only timeline — the reconciliation source): `id`,
  `user_id` fk cascade, `timestamp` ts, `type` enum(clock_in,start_break,end_break,clock_out),
  `project_id` fk nullable, `device_meta` json, `source` enum(local,server), `client_id` uuid
  (idempotency), `created_at`. Index `(user_id,timestamp)`, `(client_id)`.
- **`attendance_corrections`** (audit): `id`, `attendance_day_id` fk cascade, `corrected_by` fk,
  `field`, `old_value` json, `new_value` json, `reason`, `created_at`.
- **`work_schedules`** (config; seeded Phase 2, edited Phase 10): `id`, `name`, `start_time` time,
  `end_time` time, `break_minutes`, `standard_seconds`, `working_days` json, `effective_from`,
  `is_default`. **Seed default (ATT-Q1, RESOLVED):** Mon–Sat (`working_days = [1,2,3,4,5,6]`),
  `start_time = 09:00`, `end_time = 18:30`, `break_minutes = 45`, `standard_seconds = 31500`
  (8h 45m net/day), timezone Asia/Kolkata, `is_default = true`, `name = "Standard G4K Schedule"`.
  Sunday = weekly off. Overtime threshold = `standard_seconds`; late threshold = clock-in after
  09:00 (+ configurable grace, default 0).
- **Drop** the old `attendance_records`/`attendance_logs` tables (migrate any data if needed — likely
  none in production).

### Backend work
- **Spec-first OpenAPI** for all 12 attendance endpoints (Phase-5 design §API).
- **`AttendanceService`** (the only writer to `attendance_days`): on each event, append
  `attendance_events` (dedupe by `client_id`), then **recompute** the `attendance_days` row: ordered
  events → on-clock spans − break spans = `total_seconds`; `overtime_seconds` = max(0, total −
  standard); `status` = late if clock_in after start_time; leave if a leave record covers the day
  (Phase 6); present if any work; else absent. Server's row always wins; bump `version`.
- Endpoints: `POST /attendance/clock-in|start-break|end-break|clock-out` (cap `attendance.clock-self`,
  idempotent on `client_id`, optimistic-friendly), `GET /attendance/me/today`,
  `GET /attendance/me/history?from&to`, `GET /attendance/me/day/{date}`,
  `GET /attendance/admin/overview?date&department_id&user_id&status` (cap `admin.view-all-attendance`),
  `GET /attendance/admin/day`, `GET /attendance/hr/today?status?` (cap `hr.view-team-attendance`),
  `GET /attendance/hr/graph?user_id&mode=weekly|monthly&date`,
  `POST /attendance/correct` (Admin cap `admin.correct-attendance` = any user; HR cap
  `attendance.correct-team` = own team only — HR-CORRECT RESOLVED), `GET /attendance/export?…`
  (xlsx stream, cap `admin.view-all-attendance` + `hr.view-team-attendance`).
- **Reconciliation rules (validation/edge cases):**
  - clock_in requires no open shift for the user that day (or folds into the timeline per design).
  - clock_out requires an open clock_in.
  - start_break requires on-clock; end_break requires an open break.
  - Events out of order → server orders by timestamp; rejects only truly unreconcilable (e.g.
    clock_out with no clock_in) with a structured error → conflict toast.
  - Late badge when clock_in > schedule.start_time (+ grace — configurable, default 0).
  - Overtime amber when total > standard.
  - Cross-midnight shifts (ATT-Q2, RESOLVED): the entire shift is attributed to the **clock-in
    date** — one `attendance_days` row covering the full worked span; the next calendar date shows
    no shift. Documented and unambiguous.
- **Scheduler** (Laravel Scheduler, queued jobs): `Attendance\RemindShiftStart` (start − lead, default
  15 min → notify employee), `Attendance\AlertMissedClockIn` (start + alert, default 30 min → notify
  HR if not clocked in). Times configurable (Phase 10 settings).
- **Charts/export:** ECharts calendar heatmap + weekly/monthly graphs (lazy import, web-worker
  aggregation if >50ms); Excel export via streaming writer (Maatwebsite/Excel or spout), **queued if
  >500ms**.

### Frontend work (apps/web composites per COMPONENT-SYSTEM §7 Attendance)
- **`ClockInWidget`** (dashboard + `/dashboard/attendance`): `Button(success)` Clock In (mobile ≥48px),
  live timer display (**isolated component** — rAF/1s, state in ref/context NOT global Zustand,
  recompute from local `attendance_events` baseline in IndexedDB; **never re-renders sibling widgets**),
  `Button(secondary)` break, `Button(destructive)` End Shift (`AlertDialog` confirm). **Optimistic** +
  rollback danger toast (R5.13). One-tap (≤2 clicks).
- **`AttendanceHistoryCalendar`:** virtualized calendar heatmap (lazy import, month-change fetch +
  per-month cache), per-day `Popover` summary (clock-in/breaks/out/hours/projects/tasks). Overtime a
  distinct color.
- **`TeamAttendanceTable`** (HR today): `DataTable` + present/absent/late filter chips in `FilterBar`,
  cached 30s stale-while-revalidate (R5.16), in-place filter changes (no reload), debounced 250ms.
- **`AdminAttendanceOverview`** (Admin): `DataTable`/calendar with date/dept/person filters, click any
  date/person → full summary; HR weekly/monthly graphs (ECharts).
- **`ManualCorrection`:** inline edit on day-summary row → `Dialog` form (field/old/new/reason) →
  `POST /attendance/correct` → audit + re-reconcile.
- **Realtime:** `presence-attendance-today` (who's clocked in now); `private-user.{id}`
  `AttendanceDayReconciled` snaps local timer/heatmap to server truth.
- **Offline:** every clock/break writes `attendance_events` to IndexedDB immediately (with `client_id`)
  + enqueues sync; timer correct offline; on reconnect Sync Manager pushes events; server dedupes via
  `client_id`; conflict toast on unreconcilable.

### UI/UX requirements
- Colorful Lucide icons (Clock, Play, Pause, Square, Calendar, TrendingUp), status badges (Present
  green, Late amber, Absent red, Leave blue, Overtime amber), heatmap legend, skeleton loaders, empty
  state ("No attendance records yet. Clock in to start your first shift."), per-widget error boundary.
- Micro-interactions: one-tap optimistic clock with haptic-scale press; timer amber transition on
  overtime; 600ms progress fills; toast confirmations.

### Business logic / validation / edge cases (exhaustive)
- All clock/break state transitions validated server-side (above). Idempotency via `client_id`
  prevents double-insert on replay/offline-dedup. Late grace configurable. Overtime = total − standard.
  Leave integration (Phase 6): if a leave request covers the day and is approved → status=leave and
  no absent flag. Manual correction writes `attendance_corrections` + re-reconciles + bumps version.
  Reminder/missed-clock-in scheduler non-blocking (queued). Export queued if large. Cross-midnight
  handled. Holidays (Phase 6/10) excluded from absence.

### Permissions
- `attendance.clock-self` (all roles, for self). `hr.view-team-attendance` + `attendance.correct-team`
  (HR). `admin.view-all-attendance` + `admin.correct-attendance` (Admin).

### Testing requirements
- API feature: clock-in/out/break ordering + timeline; reconciliation recomputes totals/overtime/
  status; late flag; `client_id` idempotency (replay doesn't double-insert); manual correction writes
  audit + re-reconciles; capability gate denies unauthorized; export streams valid xlsx (parse header
  + rows). **Query-count test ≤5 SQL at 10k rows; zero N+1; cursor pagination; indexes verified.**
- Web **perf tests (reference module):** isolated-timer Profiler test (timer ticks never re-render
  unrelated widgets); one-tap click-count test (clock in/out/break ≤2 clicks) + rollback test;
  virtualization test (5000 attendance rows → ≤ visible+overscan DOM nodes, 60 FPS, INP ≤200ms);
  cache-hit + filter-in-place + p95 ≤200ms for HR/Admin today view; lazy heatmap + web-worker test;
  queued export test; offline `client_id` idempotency + sync test; performance-budget gate (Lighthouse
  CI + bundle + render/query-count).
- A11y: axe-core clean; keyboard-operable clock controls; ≥48px mobile attendance buttons.

### Verification & completion
- Clock in → break → clock out (one tap each, optimistic); open heatmap → per-day summary correct;
  trigger late (clock in after 09:00) → late badge + amber; trigger overtime → amber timer; go offline
  mid-shift → events queue → reconnect → syncs with `client_id` dedupe; HR views today's team ≤200ms
  cached; Admin exports Excel; HR/Admin makes a manual correction → audit row + re-reconcile.
- All Phase-5 perf budgets green (P-LCP/INP/CLS, p95, query-count, virtualization, click-count).
- Archive Phase 5 spec; TRACKER ✅. **Attendance Module (core) DONE.**

---

# PHASE 6 — Leave management, approval framework & attendance↔leave integration
**Capability:** `leave-approvals` · **Depends on:** 2,3,5 · **Reqs:** R6.1–R6.8 · **Spec detail:**
`openspec/changes/phase-06-leave-approvals/*` (FULLY specified — implement as written)

> Conflict strategy = **HR/Finance = Server Wins** (ADR-009). Approvals are the reusable framework
> Phase 7 (task/project submissions) will consume unchanged.

### Objectives
Reusable approval state-machine (Submitted→Pending→Approved/Rejected) on a polymorphic `approvals`
table; first use = leave: Employee→HR approves, HR→Admin approves; leave history + status badges;
holiday calendar view; approval events surface in bell + Notification Center (minimal notification
service now, superseded Phase 8); **attendance↔leave integration** (approved leave marks attendance
status=leave, excludes absence).

### Database work (new)
- **`approvals`** (polymorphic, reusable): `id`, `approvable_type` (leave_request now; task_submission/
  project_submission Phase 7), `approvable_id`, `status` enum(submitted,pending,approved,rejected)
  default pending, `submitted_by` fk, `submitted_at`, `current_approver_role` enum(super_admin,hr),
  `decision` enum(approved,rejected) nullable, `decision_reason` nullable, `decided_by` fk nullable,
  `decided_at` nullable, `payload` jsonb, timestamps. Index `(approvable_type,approvable_id)` unique,
  `(status,current_approver_role)`, `(submitted_by)`.
- **`leave_requests`**: `id`, `user_id` fk, `start_date`, `end_date`, `reason`, `type` enum
  (casual,sick,earned,unpaid), `approval_id` fk one-to-one, timestamps. Index `(user_id,start_date)`;
  unique-partial `(user_id,start_date,end_date) where status=pending` (no duplicate pending overlap).
- **`holidays`** (read here, written Phase 10): `id`, `name`, `date`, `recurring` bool, `description`,
  timestamps. Index `(date)`.
- **`notifications`** (minimal service now, Phase 8 supersedes writers, same table/event contract):
  `id`, `user_id` fk, `type`, `title`, `body`, `data` json, `read_at` nullable, `link` nullable,
  timestamps. Index `(user_id,read_at)`.

### Backend work
- **Spec-first OpenAPI** for `/leave-requests`, `/approvals/{id}/decision`, `/approvals/pending`,
  `/leave-requests/history`, `/holidays`, plus `/notifications` (GET, mark-read) minimal.
- **`ApprovalService`** (only writer to `approvals`): `submit`/`approve`/`reject`. Guarded state
  machine: submit → status=pending + `current_approver_role` from routing rule (employee leave→hr;
  HR leave→super_admin); pending→approved/rejected only if decider's active role =
  `current_approver_role` AND holds capability; terminal states no reopen. Capability guard map
  `{leave_request:{hr:'leave.approve-employee', super_admin:'leave.approve-hr'}}`. Events
  `ApprovalSubmitted`/`ApprovalDecided` (Laravel events + Reverb broadcast `private-user.{id}`);
  listeners = notification write + audit.
- **`LeaveRequestController`**: store (validation: end≥start, no duplicate pending overlap, type in
  set), index (scoped: employee own, HR team+own, Admin all w/ FilterBar + cursor pagination), show,
  decision endpoint (approve/reject + optional reason), history.
- **Attendance↔leave integration (critical):** on `ApprovalDecided(approved)` for a leave_request,
  for each date in [start,end] → set/insert `attendance_days.status='leave'` (and clear any absent
  flag) for that user. On rejection, no change. Holiday calendar excluded from absence computation
  (Phase 5 reconciliation already references this).
- **`NotificationController`** (minimal): index (user's notifications, limit 50, cursor), mark-read
  (optimistic). `NotificationService` write + `notification-created` broadcast on `private-user.{id}`.
- **HolidayController**: index (`?year=`), cached 1h.

### Frontend work
- **`LeaveRequestForm`** (`/dashboard/leave`): `Form` — `DateRangePicker` (end≥start validation),
  type `RadioGroup`, reason `Textarea`, submit `Button` (optimistic + toast). Employee/HR/Admin scope
  reflected in list.
- **`LeaveApprovalRow`**: dates, reason, type badge, status `StatusBadge` (Amber pending → Green
  approved / Red rejected), approve `Button(success)` 1-click, reject `Button(destructive)` →
  `AlertDialog` + reason. **Optimistic badge flip + rollback danger toast.**
- **`LeaveHistoryTable`**: virtualized `DataTable` + FilterBar (status/type/date), status badges.
- **`HolidayCalendar`**: month view, cached 1h, lazy-loaded.
- **`NotificationsBell`** (real now): popover of recent approvals/announcements; mark-read optimistic;
  unread badge decrements optimistically (R13.19).
- **Realtime:** `approval-status-change` on `private-user.{submitted_by}` flips the requester's badge
  + toast. `notification-created` pushes to bell.

### UI/UX requirements
- Status badges consistent (Amber pending, Green approved, Red rejected), type badges (casual/sick/
  earned/unpaid), skeletons, empty states ("No leave requests yet."), per-widget error boundary.
- Micro-interactions: 1-click approve (optimistic badge flip), reject confirm + reason, toasts.

### Business logic / validation / edge cases
- No overlapping pending leave (DB partial-unique + server check).
- Approver must be the routed role AND hold capability (HR can't approve HR leave; Admin does).
- Approve → attendance days marked `leave` for the range (integration).
- Reject with reason → notified submitter.
- Holidays excluded from absence; recurring holidays apply each year.
- State machine terminal; no reopen.
- Submit queued offline (Server Wins); approve/reject require online (disabled under offline banner).

### Permissions
- `leave.request-self` (employee+HR+admin for self). `leave.approve-employee` (HR). `leave.approve-hr`
  (Admin). Views scoped by role.

### Testing requirements
- API feature: approval state machine (submit→pending→approve/reject, wrong role denied, terminal
  no-reopen); leave CRUD + overlap prevention; attendance integration (approved leave → status=leave
  for range); holiday exclusion; notification write + broadcast; capability gates; query-count ≤5 +
  zero N+1 + cursor pagination + composite indexes verified.
- Web perf: optimistic approve/reject + rollback test; virtualize history + render-count test on
  broadcast (no storm); cached lists (30s) + holiday (1h); one-click click-count Playwright test;
  axe-core clean; Lighthouse CI.
- Framework-reuse test: confirm `approvals` table + `ApprovalService` accept a non-leave approvable
  type (prep for Phase 7) without code change.

### Verification & completion
- Employee praveen submits leave → HR aravind approves (1-click, optimistic badge flip, bell notify)
  → attendance days for the range show status=leave; HR aravind submits leave → Admin karthik approves
  / rejects with reason; holiday calendar shows holidays; bell reflects approvals; history filters.
- Archive Phase 6 spec; TRACKER ✅. **Attendance Module complete with leave integration.**

---

# PHASE 7 — Projects & tasks
**Capability:** `projects-tasks` · **Depends on:** 2,3,4,6 · **Reqs:** R7.1–R7.18 · **Spec detail:**
`openspec/changes/phase-07-projects-tasks/*`

### Objectives
Full project/task lifecycle: project CRUD + team auto-access + sort; task create/assign/priority/due/
scope/dependencies/comments/activity; Kanban (dnd-kit) + list + inline edit; QA form builder + submission
note; project work timer; recurring tasks; Quick Task Assignment (→ Global Chat notify Phase 8); task +
project submission/approval (reuse Phase 6 `ApprovalService`); Gantt/Timeline (HR/Admin); project
history; personal task list; saved views/custom columns.

### Database work
- `projects`: extend existing (add `priority`, `deadline`, `team_id`/`department_id`, `status`
  active/completed/archived, `progress`, `created_by`, timestamps). Index `(status,deadline)`,
  `(team_id,status)`.
- `tasks`: extend (add `priority` enum, `due_date`, `scope` enum(global,department,role), `progress`,
  `parent_id`/`blocked_by` dependency self-fk, `qa_form_id`, `recurrence` json, `submitted_at`,
  `submission_note`, timestamps). Index `(assignee_id,status)`, `(project_id,status)`,
  `(due_date,status)`.
- `task_comments`: `id`, `task_id` fk, `user_id` fk, `body` (Tiptap html, sanitized server-side),
  timestamps.
- `task_activity`: `id`, `task_id` fk, `user_id` fk, `event` (created/assigned/progress/submitted/
  approved/redo), `metadata` json, `created_at`. Index `(task_id,created_at)`.
- `task_time_logs` (exists): project work timer entries; ensure `project_id`, `started_at`/`ended_at`.
- `qa_forms` + `qa_form_fields`: form builder definitions (field type Input/Textarea/Checkbox/Slider/
  Select). `qa_submissions`: task → form values + note.
- Reuse `approvals` (Phase 6) for task_submission + project_submission (`approvable_type`).
- `saved_views` (generic): `id`, `user_id`, `entity` (tasks/projects), `name`, `config` json.

### Backend work
- **Spec-first OpenAPI** for projects/tasks/comments/activity/qa/timer/submissions/saved-views.
- Controllers + services: ProjectService, TaskService (state machine todo→in_progress→review→done
  via Kanban drag), ApprovalService reuse for submissions, RecurrenceService (daily/weekly-on-days/
  monthly-on-date; auto-recreate on completion; notify HR; toggle off), QaService, TimerService.
- Team assignment auto-grants project + task-list + project-chat access. Quick Task Assignment endpoint
  creates a task into an employee's list + (Phase 8) auto-notifies Global Chat on completion.
- Validation: dependencies (B blocked-until-A-done; no cycles), due date, scope, recurrence rules,
  QA submission requires form fields.

### Frontend work
- `ProjectCard` (grid/list), `TaskKanbanBoard` (dnd-kit columns, virtualized cards, optimistic status
  + debounced persist, ContextMenu quick actions), `TaskList` (DataTable + inline edit + drag-reorder),
  `TaskDetailSheet` (Tabs Overview/Tasks/Chat/Activity/History; Slider progress; Combobox assignees;
  TiptapEditor comments lazy; Accordion activity by date; QA form; submit Button + note), `GanttView`
  (lazy, web-worker layout), `QAFormBuilder` (Accordion field types), Personal Task List.
- Saved views + custom columns (TanStack Table); pinned items; progress bars animate 0→value.

### UI/UX requirements
- Priority badges (Low/Medium/High/Urgent → neutral/blue/amber/red), status badges, avatar groups,
  inline edit pencil → Enter/Escape, drag affordances, skeletons, empty states, per-widget boundaries.

### Business logic / validation / edge cases
- Dependency cycle prevention; recurrence recreation idempotency; QA required on submit if form
  attached; submission approval via `ApprovalService` (HR/Admin review → approve/redo); progress 0–100;
  timer logs per project; archived projects read-only.

### Permissions
- `projects.manage` (Admin/HR), `tasks.assign`, `tasks.submit`, `tasks.approve` (HR/Admin), employee
  self-create if permitted by HR (flag). Views scoped.

### Testing requirements
- API: project/task CRUD + dependencies + recurrence + QA + timer + submission/approval; capability
  gates; query-count ≤5; zero N+1; indexes.
- Web: create project → assign team → add tasks → Kanban drag → submit → approve → history; Gantt
  renders; recurring task recreates; virtualization + render-count; Lighthouse CI; axe-core.

### Verification & completion
- Full lifecycle verified end-to-end; saved views persist; Gantt renders; recurring recreates;
  submission/approval via reusable ApprovalService. Archive Phase 7; TRACKER ✅.

---

# PHASE 8 — Chat & notifications
**Capability:** `communication` · **Depends on:** 2,3,7 · **Reqs:** R8.1–R8.15 · **Spec detail:**
`openspec/changes/phase-08-communication/*`

### Objectives
Global/Project/Direct/Group chats over Reverb; @mentions; DM read receipts; pin messages; read/unread;
image/file sharing (limits); offline queue; bell + Notification Center (supersedes Phase 6 minimal);
announcement board (pin, reactions, dashboard, notify); Quick Notes; complaint/feedback channel;
mobile chat UX. Quick Task Assignment auto-notifies Global Chat on completion.

### Database work
- Existing chat tables (`conversations`, `conversation_user`, `messages`) extended: `messages` add
  `type` (text/image/file), `attachment_url`, `reply_to_id`, `edited_at`, `pinned_at`; `conversations`
  add `scope` (global/project/direct/group); `conversation_message_reads` for read receipts;
  `reactions` (message_id, user_id, emoji); `announcements` (exists) add `scope`, `reactions` json;
  `quick_notes` (user_id, body, pinned, timestamps); `feedback` (user_id, body, → DM to HR/Admin +
  high-priority notification).

### Backend work
- Reverb broadcasting on `private-conversation.{id}`, `presence-project.{id}`, public announcements.
- ChatController (conversations, messages w/ pagination, send, read receipts, pin, reactions, attach),
  AnnouncementController (create Admin company-wide / HR team-level, pin, reactions, dashboard close),
  NotificationController (full center: tabs All/Unread/Mentions, mark-read, history), QuickNote,
  Feedback (private → DM + high-priority global notification). Offline: chat queue + "Not connected".

### Frontend work
- `ConversationList` (virtualized, unread border + badge, search), `MessageList` (virtualized
  append-only, auto-scroll, pinned on top, read receipts), `MessageComposer` (TiptapEditor lazy,
  @mention Combobox, attach IconButton → FileUpload popup, Enter to send / Shift+Enter newline,
  optimistic insert), `NotificationCenter` (Tabs), `AnnouncementCard`, `QuickNotes`, complaint form
  on Profile. Mobile: list-first, full-screen conversation, fixed bottom input.

### UI/UX, business logic, permissions, testing, verification
- Per spec; offline queue + conflict = Timestamp (ADR-009); image/file limits; high-priority notify;
  send DM + read receipt; @mention notifies; announcement → dashboard + bell; offline message queues.
- Archive Phase 8; TRACKER ✅.

---

# PHASE 9 — Reports & exports
**Capability:** `reporting` · **Depends on:** 5,7 · **Reqs:** R9.1–R9.8 · **Spec detail:**
`openspec/changes/phase-09-reporting/*`

### Objectives
Attendance/project/task/productivity reports (Admin full, HR limited team); Excel + PDF export; Sunday
weekly summary auto-email (scheduler); saved views; filters via shared FilterBar; virtualized large
datasets; queued/streamed heavy reports.

### Database work
- `report_runs` (queued/streamed report generation): `id`, `user_id`, `type`, `filters` json, `format`
  (xlsx/pdf), `status`, `file_url`, `created_at`, `completed_at`. `saved_views` (reuse).

### Backend work
- ReportController: data endpoint (202 + poll/queue for heavy) + export (xlsx via streaming writer,
  pdf via DOMPDF/TCPDF), queued if >500ms. Sunday summary Mailable scheduled (Laravel Scheduler
  Sunday 09:00) → Admin. HR sees team-scoped data only (capability + scope filter).

### Frontend work
- `ReportBuilder` (type Select, FilterBar, generate Button → 202/poll, results virtualized DataTable,
  export Button Excel/PDF → queued download + toast), `SavedViews` Combobox.

### UI/UX, business logic, permissions, testing, verification
- Per spec; heavy work queued (R13.17); saved views; filters; HR limited; export verified.
- Archive Phase 9; TRACKER ✅.

---

# PHASE 10 — Production hardening, settings, audit, deployment readiness
**Capability:** `system-settings` · **Depends on:** 2,5,7 · **Reqs:** R10.1–R10.5 + cross-cutting ·
**Spec detail:** `openspec/changes/phase-10-system-settings/*`

### Objectives
Company profile (logo/name/timezone/working hours/holiday calendar — writable here), password/session
policies, notification prefs, configurable reminder times; **audit log UI** (filterable/exportable);
Sentry + Pulse fully wired; perf audit vs targets (Lighthouse/CWV) p75 within targets 7 consecutive
days; **M1 freeze-ready**; production deployment + rollback + backups verified.

### Database work
- `settings` (exists) — extend keys: company profile, working hours, holiday calendar (links to
  `holidays`), password policy (min length/expiry), session rules, notification prefs, reminder times,
  attendance grace/late threshold. `work_schedules` editable here. `holidays` CRUD here.

### Backend work
- SettingsController (Admin `settings.manage`): grouped forms (company/hours/holidays/policies/
  sessions/notifications/reminders), writes audit. AuditLogController: index (filter by user/action/
  date, cursor pagination), export (queued). AuditService already writes everywhere (Phase 2+).
- Monitoring: Sentry (errors+perf) + web-vitals field collection + Pulse fully wired (R10.4). Perf
  audit run; breaches logged in TRACKER with owner+plan.

### Frontend work
- `SettingsTabs` (company/hours/holidays/policies/sessions/notifications/reminders — each a `Form`),
  `AuditLogTable` (virtualized, FilterBar, export), holiday calendar CRUD UI.

### UI/UX, business logic, permissions, testing, verification
- Per spec; every setting persists + audited; audit captures create/approve actions across modules;
  Lighthouse/CWV green; production error tracking live; rollback + backup drill done.
- **Definition of M1 SHIP:** all phases 0–10 ✅ (archived), perf targets met, seeded, monitored,
  deployed to production with rollback + backups verified.
- Archive Phase 10; TRACKER ✅. **M1 COMPLETE.**

---

## §3 — Cross-cutting acceptance (applies to EVERY phase)

- **No mock/placeholder data** anywhere; real empty states; every control functional (config.yaml).
- **Capability gates** on all new endpoints; frontend restrictions mirrored by backend authorization.
- **Offline Engine** routes all writes (where applicable) with per-entity conflict resolution.
- **Performance budgets green** per phase: bundle ≤200KB gz/route, Lighthouse CI (LCP/INP/CLS/FCP),
  query-count ≤5/list + zero N+1, cursor pagination, virtualization >100 rows, skeletons over spinners,
  optimistic UI + rollback, per-widget error boundaries, axe-core clean.
- **Design system compliance:** brand tokens, Inter+Sora, white/light default (+dark colorful), logo
  placement per §10, components composed only from the FROZEN catalog, status badge map consistent.
- **Tests + docs updated** every feature; OpenAPI written before routes; phase archived on completion.
- **Seed grown** each phase (full by Phase 2 from `data-prefill-reference.txt`).
- **Deployment:** staging per phase → production + rollback on completion; Supabase backups.

## §4 — Resolved decisions log (owner-confirmed)

All seven open questions are now **resolved and authoritative** — implement exactly as below; no
further consultation needed. Recorded as ADRs in §0.7.

### Work schedule & attendance rules (drive Phase 5 seed + reconciliation)

- **ATT-Q1 — RESOLVED: Mon–Sat, 09:00–18:30, 45-min lunch break.**
  - Working days: **Monday–Saturday** (weekday numbers `[1,2,3,4,5,6]` in PHP `working_days` json;
    Sunday = weekly off).
  - Time: `start_time = 09:00`, `end_time = 18:30` (total span 9.5h = 570 min).
  - `break_minutes = 45`.
  - **`standard_seconds = 31500`** (8h 45m net work/day) — this is the overtime threshold and the
    expected-hours baseline. Weekly standard ≈ 52.5h (Mon–Sat × 8.75h).
  - Seed this as the default `work_schedules` row (`is_default = true`, `effective_from` = seed date,
    `name = "Standard G4K Schedule"`). Editable in Phase 10 Settings.
  - Late threshold: clock-in after 09:00 (+ configurable grace, default 0) → `status = late`.
  - Overtime: `total_seconds > 31500` → `overtime_seconds` accrues; timer/heatmap turn amber.
- **ATT-Q2 — RESOLVED: Attribute a cross-midnight shift entirely to the clock-in date.**
  - A shift clocked in Aug 9 22:00 and out Aug 10 06:00 produces **one** `attendance_days` row on
    Aug 9 with the full 8h worked; Aug 10 shows no shift. One row per clock-in date — predictable
    heatmap, simple summary. (Rare for a 09:00–18:30 schedule, but the rule is unambiguous.)
- **HR-CORRECT — RESOLVED: HR corrects attendance within their own team only.**
  - HR capability = **`attendance.correct-team`** (scoped to users in departments/teams the HR
    manages). Admin capability = **`admin.correct-attendance`** (any user). Employees cannot correct.
  - Implement the scope filter in `AttendanceService::correct()` — HR may only touch
    `attendance_days` whose `user_id` is in their team roster; otherwise 403.
  - Capabilities matrix (§1.1) already reflects this — keep as written.

### Leave configuration (drive Phase 6 enum + form)

- **LEAVE-Q1 — RESOLVED: leave types = `casual`, `sick`, `earned`, `unpaid` (the Phase 6 default).**
  - `leave_requests.type` enum = `(casual, sick, earned, unpaid)`.
  - Form `RadioGroup` labels: Casual Leave (CL) · Sick Leave (SL) · Earned/Privileged Leave (EL) ·
    Leave Without Pay (LWP). No comp-off at M1 (deferred to a future milestone — do not build it).

### Security — token storage (drive Phase 1)

- **SECURITY-D1 — RESOLVED: refresh-token cookie configured by runtime auto-detect from env.**
  - Access token: **always in-memory** (Zustand, cleared on logout) — never `localStorage`.
  - On app load, the web app calls `GET /auth/refresh`; the API reads the HttpOnly refresh cookie and
    returns a fresh access token; rotate the refresh token each use (reuse → revoke family).
  - **Cookie attributes set at runtime** from `FRONTEND_URL` vs `API_URL`:
    - If `sameRegistrableDomain(FRONTEND_URL, API_URL)` → `Secure; HttpOnly; SameSite=Strict` (no CSRF
      token needed — strongest default).
    - Else → `Secure; HttpOnly; SameSite=None` **+** a double-submit CSRF token on `/auth/refresh`
      (cookie + header), plus rotation + reuse-detection.
  - Implement the `sameRegistrableDomain()` helper once in `packages/ui` (e.g. compare effective
    TLD+1 via the public-suffix list, or a configured `SESSION_DOMAIN` env override). Document the
    chosen mode in the Phase 1 archived spec. (If you later consolidate web+api under one base domain,
    this auto-strengthens to Strict with no code change.)

### Stack versions (drive Phase 0)

- **STK-D1/D2 — RESOLVED: keep the installed, newer stack; update the ADR notes.**
  - Keep: **Laravel 13 / PHP 8.4 / Next.js 16.3.0** (installed). Do NOT downgrade to project.md's
    Laravel 12 / Next 16.2.12.
  - **Phase 0 action:** edit `openspec/project.md` ADR-003 and ADR-004 notes to record "Laravel 13 /
    PHP 8.4" and "Next.js 16.3.0" as the actual frozen versions (the *intent* — Laravel + Next.js —
    is unchanged; only the patch/minor is corrected to reality). Add a one-line note that
    `composer.json`/`package.json` are the source of truth for exact versions.

### Design — dark mode (drive Phase 3)

- **DESIGN-Q1 — RESOLVED: light is the M1 default and primary reviewed surface; dark is fully
  available and colorful but secondary.**
  - `ThemeProvider` `defaultTheme = "light"`; persisted per user.
  - Implement BOTH light and dark token sets (DESIGN-SYSTEM §2/§3) so the toggle works everywhere.
  - **M1 visual review / sign-off is performed on the light theme** for every screen; dark must not
    crash and must meet contrast, but does not require equal polish sign-off at M1.
  - This matches DESIGN-SYSTEM §1 tone ("vibrant but professional… white surfaces, gradients reserved
    for headers/dashboards") and R3.2 (both modes colorful).

---

### End of plan.md
**Execute strictly one phase at a time, all three role screens together within a phase, each phase
fully implemented + tested + verified + archived before the next begins. The Base Application Module
is complete after Phase 4; the Attendance Module (with Leave) is complete after Phase 6; M1 ships
after Phase 10. No ad-hoc decisions, no placeholders, no skipped requirements.**



# plan.md — Games4King Workplace OS: M1 Implementation Roadmap
## (Base Module + Attendance Module + Leave — production-ready for daily use)

> **This is the single authoritative implementation plan. It covers everything required to build,
> test, optimise, secure, make accessible/responsive, and deploy the application for day-to-day
> production use. Once every phase here is accurately implemented and verified, the app is ready to
> use in production — no unfinished functionality, no placeholders, no inconsistent UI/UX, no missing
> permissions, no unresolved decisions.**
>
> **M1 SCOPE (owner-confirmed):** Base Application Module (auth, Admin/HR/Employee roles, org
> management, RBAC, app shell, design system, dashboard, profile, directory, settings, audit) +
> Attendance Module (clock in/out/break, history, corrections, team/admin views) + Leave Module
> (requests, approvals, attendance↔leave integration, holiday calendar view). **Projects/Tasks,
> Chat, Announcements, and full Reporting are OUT of M1** — they are sequenced and specified in
> `plan-future-modules.md` for a later milestone. Their dashboard widgets render true empty states
> until then.
>
> **Hierarchy of truth (when sources conflict, higher wins):**
> 1. This `plan.md` (operational decisions + reconciliation)
> 2. `openspec/REQUIREMENTS.md` (R1–R13 functional WHAT), `openspec/project.md` (architecture),
>    `openspec/DESIGN-SYSTEM.md` + `openspec/COMPONENT-SYSTEM.md` (FROZEN visual/component contracts),
>    `openspec/PERFORMANCE-STANDARDS.md` (FROZEN P-* budgets), `openspec/config.yaml` HARD RULES
> 3. `openspec/changes/phase-XX-*` module details (read for Phase 1/2/3/5/6 — attendance & leave are
>    fully specified there; this plan reconciles them with the confirmed decisions)
> 4. `Images, SVG, PDF/data-prefill-reference.txt` (authoritative seed data)
> 5. Existing code (salvageable scaffold only — see §0.4)

---

## Table of contents

- §0 — Audit reconciliation & authoritative decisions (read first)
- §1 — Authoritative contracts (do not re-decide)
- §2 — Phase format & global Definition of Done
- **Phase 0** — Foundation repair, design-system core & deploy pipeline
- **Phase 1** — Authentication & role-based access
- **Phase 2** — Org management, RBAC, directory, profile (Base module core)
- **Phase 3** — App shell, 3-state sidebar, navigation, full design system
- **Phase 4** — Dashboard framework, widgets & company views (Base module capstone)
- **Phase 5** — Attendance: clock in/out/break, history, corrections (reference module)
- **Phase 6** — Leave management, approvals & attendance↔leave integration
- **Phase 7** — Settings, holiday CRUD, audit log & company management
- **Phase 8** — Performance optimisation, accessibility, responsive validation
- **Phase 9** — Security hardening & production-readiness audit
- **Phase 10** — Final deployment, seeding & day-1 production go-live
- §3 — Cross-cutting acceptance (every phase)
- §4 — Resolved decisions log (all owner-confirmed)

---

## §0 — Audit reconciliation & authoritative decisions

### 0.1 Documentation state — GOOD & authoritative

- All 11 OpenSpec phase folders exist with full artifacts. Attendance (Phase 5) and Leave (Phase 6)
  are **fully specified** — `proposal.md`, `design.md` (192/193 lines), `specs/<cap>/spec.md`
  (227/172 lines), `tasks.md`. This plan does NOT re-spec them; it reconciles + sequences them.
- FROZEN specs to obey verbatim: `DESIGN-SYSTEM.md` (palette, type, spacing, radius, elevation,
  motion §8, logo §10, widgets §13, states §14), `COMPONENT-SYSTEM.md` (40+ primitives/composites),
  `PERFORMANCE-STANDARDS.md` (32 `P-*` standards), `config.yaml` HARD RULES (no mock data; FROZEN design).
- `openspec/specs/` and `openspec/changes/archive/` are **empty** — no phase archived; all TRACKER
  statuses ⬜. **Implementation starts now.**

### 0.2 Seed data — REAL source (rebuild seeder to this)

**`Images, SVG, PDF/data-prefill-reference.txt` is authoritative.** Overrides the generic seeder.
- **Company:** Games4King (G4K-001), Game Development Studio; `g4kasset@gmail.com`;
  +91 79045 93823 / +91 96264 79882; Mullai Nagar, Vadamalampatti, Pochampalli Tk, Krishnagiri Dt,
  Tamil Nadu – 635206. **Timezone Asia/Kolkata.** Working hours 09:00–18:30.
- **Departments (2):** Game Dev Team (DEP001) · YouTube Team (DEP002).
- **System roles (3, drive permissions):** Super Admin · HR · Employee. The 15 "Role Master" lines
  (Senior Game Developer, Designer, QA Tester, Director, Chief Editor, Editor, Cameraman, Actor,
  Actress, …) are **designations/job titles**, NOT permission roles.
- **Employees (13)** — real usernames, `@games4king.in` / `@gmail.com` emails, role-specific
  passwords. Canonical logins: `karthik`/`Admin@123` (Super Admin), `aravind`/`Hr@123` (HR),
  `praveen`/`Dev@123` (Employee). See the reference file for the full 13 (rahul, vignesh, santhosh,
  naveen, harish, dinesh, ajith, lokesh, akash, nivetha) with exact email/password/designation/
  department/mobile/joining-date/blood-group per row.
- **All seed users ship `must_change_password = true`** (force first-login change).
- **Login identifier = username OR email OR employee_id** (AUTH-D1).
- **Master-data pattern** (R2.9, from reference §ADMIN CONFIG): every master dataset supports
  Create/Read/Update/Delete/Import/Export/Activate/Deactivate/Search/Filter/Pagination/Audit.
  "Nothing should be hardcoded." **Auto-numbering** configurable (prefix/start/length/format) for
  Company/Employee/Department IDs.

### 0.3 Current code state — BROKEN & non-compliant (rebuild per §0.4)

- `routes/api.php` reduced to a single `GET /user`; `User.php` reverted to a stub (no `HasApiTokens`,
  no relationships); `CapabilityMatrix` service deleted; 5 controllers deleted from working tree.
- Root `page.tsx` redirects to `/login` (doesn't exist); dashboard has no `layout.tsx`; orphan pages
  import undeclared packages.
- Even HEAD `73d2516` is non-compliant: dark `zinc` theme (not white/light `#F7F7FB`), `Geist` fonts
  (not Inter+Sora), `indigo` accents (not violet/gold/pink), raw `fetch()`+`localStorage` (no TanStack
  Query/Zustand), `alert()` calls, stub dashboard numbers, logo referenced but missing from `public/`.
- Seeder uses wrong data (generic `@games4king.com`, uniform `password`).
- `database/database.sqlite` is committed (must be removed from git). Reverb/Pulse not installed.
- OpenAPI covers only auth + org.

### 0.4 Salvage strategy (owner-confirmed: REBUILD TO SPEC, SALVAGE SCAFFOLD)

| Item | Decision |
|---|---|
| Monorepo layout (apps/api, apps/web, packages/ui) | **KEEP** (ADR-016) |
| Laravel skeleton + Sanctum installed | **KEEP** (fix User model + routes) |
| `AuthController` login/lockout/rate-limit logic (HEAD) | **FIX** (logic sound; add HasApiTokens, refresh tokens, ip_address column, route it) |
| `RequireCapability` middleware shape | **FIX** (re-point to DB-backed service) |
| Existing 21 migrations | **REBUILD** (predate FROZEN designs — wrong table names/cols) |
| Org controllers (Dept/Designation/User/Directory/Profile) | **FIX** (→ Eloquent, capability gates, cursor pagination, indexes, audit) |
| Attendance/Leave controllers (HEAD) | **REBUILD** (don't match Phase 5/6 designs) |
| `DashboardController` with hardcoded `0` | **DISCARD** (no-mock violation) |
| `DatabaseSeeder.php` | **REBUILD** (to data-prefill-reference.txt) |
| `openapi/openapi.yaml` (auth+org) | **EXTEND** (add attendance/leave/settings/audit spec-first) |
| create-next-app `layout.tsx`/`page.tsx`/`globals.css` | **DISCARD** |
| All `app/(auth)/*` + `app/dashboard/*` pages | **DISCARD as UI** (reuse screen inventory only) |
| `components/ui/*` (base-ui-based) | **REBUILD** on Radix + brand tokens |
| `components/widgets/widget-engine.tsx`, `data-table.tsx` | **REBUILD** structure, rewrite logic |
| `lib/offline-engine.ts`, `auth-guard.tsx`, `theme-provider.tsx` | **REBUILD** into proper layers |
| `lib/utils.ts` (`cn`) | **KEEP** |
| `packages/ui` (types only) | **EXTEND** (add components/hooks/theme/client) |
| `database/database.sqlite` | **DISCARD** (remove from git) |

### 0.5 Conflicts resolved by this plan (authoritative)

| Conflict | Resolution |
|---|---|
| Working-tree deletions vs HEAD "complete M1" | Neither compliant → rebuild to FROZEN spec; salvage scaffold. |
| Seed: generic vs `data-prefill-reference.txt` | **Reference wins.** Rebuild seeder. |
| `attendance_records`/`attendance_logs` vs Phase-5 `attendance_days`/`attendance_events` | **Phase 5 wins.** Drop old tables. |
| Leave: standalone vs `approvals` framework (Phase 6) | **Phase 6 wins** (polymorphic `approvals`). |
| Capability: static PHP array vs `role_capabilities` table (Phase 2) | **Phase 2 wins** (DB-backed). |
| Login identifier | **username OR email OR employee_id** (AUTH-D1). |
| Fonts | **Inter + Sora** (self-hosted, subset, swap, preloaded). |
| Theme default | **Light (`#F7F7FB`) primary; dark available.** |
| Data fetching | **TanStack Query + Zustand (UI only) + Sanctum bearer in memory + refresh cookie.** |
| `@base-ui/react` vs Radix | **Radix + shadcn only.** |
| Reverb/Pulse | **Install** (Reverb Phase 3, Pulse Phase 0). |
| Laravel 13/PHP 8.4/Next 16.3 installed vs project.md (12/16.2.12) | **Keep installed; update ADR-003/004 notes.** |
| Deployment | **Direct-to-production after each verified phase** (no staging env to maintain); final clean redeploy at end. |

### 0.6 New ADRs recorded by this plan (log in `project.md` §11)

- **ADR-019 — Rebuild-to-spec strategy:** existing UI/data layers are non-compliant scaffold; rebuild.
- **ADR-020 — Real seed source:** `data-prefill-reference.txt`; role-specific passwords; `must_change_password=true`; Asia/Kolkata.
- **ADR-021 — Login identifier = username OR email OR employee_id.**
- **ADR-022 — M1 scope cutoff:** Base + Attendance + Leave only; Projects/Tasks/Chat/Announcements/
  Reports deferred to a later milestone (documented in `plan-future-modules.md`).
- **ADR-023 — Visual intensity:** vibrant-on-white — clean white surfaces, multiple contextual colours
  across icons/sidebar-states/badges/cards/interactions; per-module accent colours; gradients reserved
  for sign-in hero, dashboard headers, and logo lockups (FROZEN §1 honoured).
- **ADR-024 — 3-state sidebar:** Hidden / Collapsed (icons+tooltip) / Expanded (icons+text); collapsed
  by default; joyful animated transitions; supersedes the FROZEN 2-state model (264↔72).
- **ADR-025 — Direct-to-production deployment:** each verified phase deploys straight to production
  (Vercel + Railway + Supabase, already wired); credentials retained; final clean redeploy at go-live.
- **DR-026 — Auth security:** access token 15min in-memory + refresh token 7-day sliding in HttpOnly
  cookie; SameSite auto-detected at runtime (Strict if same registrable domain, else None + CSRF).
- **DR-027 — Attendance rules:** Mon–Sat 09:00–18:30, 45-min break, standard 31500s; cross-midnight
  attributed to clock-in date; forgot-clock-out = flag open shift + manual correction (no auto-out);
  HR corrects own team only.
- **DR-028 — Leave:** types casual/sick/earned/unpaid; no balances/quotas at M1 (requests + history +
  attendance integration only); holiday calendar view + seed in Phase 6, CRUD in Phase 7.
- **DR-029 — File storage = Supabase Storage** (profile photos, allowed image attachments).
- **DR-030 — Single company timezone Asia/Kolkata** (UTC stored, converted for display/day-boundary/late).

---

## §1 — Authoritative contracts (do not re-decide during implementation)

### 1.1 Roles, capabilities, permissions (capability-based, backend-enforced)

- **Exactly 3 system roles:** Super Admin (`super_admin`) · HR (`hr`) · Employee (`employee`).
  Designations = profile labels, never permission roles. Multiple system roles → Role Selection screen.
- **Capability-based only.** `role_capabilities` table maps role→capability; `RequireCapability`
  middleware is the single backend enforcement point; `GET /me/capabilities` returns active role's list
  (frontend uses only to render). `super_admin` = wildcard `*`. **Frontend restrictions always backed by backend authorization.**
- **M1 capability matrix (Base + Attendance + Leave):**
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
  \* "Send Message" creates a Direct chat row in M1 (chat UI itself is a future module; the contract is reserved).
- **Sidebar items, screen controls, and route guards all render based on the active role's capability
  list; backend gates mirror exactly.** Deep-linking to a forbidden screen → 403 UI.

### 1.2 Design system (FROZEN + ADR-023 vibrant-on-white)

- **Palette (exact):** brand violet `#8A2BE2` (deep `#9400D3`), gold `#FFD700` (warm `#FFA500`), pink
  `#FF1493`; **primary gradient** `linear-gradient(135deg,#9400D3,#8A2BE2,#FF1493)` — sign-in hero,
  dashboard headers, logo lockups ONLY. **Gold gradient** `linear-gradient(135deg,#FFD700,#FFA500)` —
  premium/crown moments only. Semantic: success `#16A34A`, info `#2563EB`, warning `#D97706`, danger
  `#DC2626`, neutral `#6B7280`, overtime `#D97706`. Surfaces (light primary): app bg `#F7F7FB`,
  surface `#FFFFFF`, surface-2 `#FCFCFE`, border `#E6E6EF`, text `#14141C`/`#4B4B5C`/`#8A8A9A`.
  Dark variants per DESIGN-SYSTEM §2/§3 (available, not primary).
- **Per-module accent colours (ADR-023):** each primary module gets a signature accent used on its
  nav icon, active-state tint, page-title icon, and key badges. **Dashboard=violet · Attendance=emerald
  · Leave=amber · Directory=pink · Profile/Org=blue · Settings=slate · Audit=rose.** Status colours
  (green/amber/red) stay semantic and override on data-bearing elements.
- **Type:** Inter (UI) + Sora (display/brand). Self-hosted, subset, `font-display:swap`, preloaded.
  Scale: 0.75/0.875/1/1.125/1.25/1.5/1.875/2.25/3 rem. Weights 400/500/600/700/800. Max 2 families.
- **Spacing 4px base** (0,1,2,3,4,5,6,8,10,12,16,24). **Radius:** sm6/md10/lg14/xl20/full. **Elevation**
  e1–e4 per §7. **Motion** per §8 (taps 120ms · hover 100ms · tooltip 150ms · **sidebar glide 220ms**
  · drawer 200ms · dialog 280ms · toast 200ms · progress 600ms · reorder 180ms · page 180ms · badge 150ms).
  `prefers-reduced-motion` → ≤1ms.
- **Logo placement (§10):** `Landscape-Logo.png` on sign-in hero (brand-gradient bg); square
  `1.1 Logo.png` 28–32px in top bar + sidebar header; `Favicon.png` via Next metadata;
  `monochrome-logo-1.1.png` on dense/dark/PDF surfaces; `animated-logo.mp4` in full-screen/onboarding
  empty-state moments. **Logo only — the cartoon king is NEVER used as a standalone mascot character**
  (owner-confirmed); empty states use colourful Lucide icons + the animated-logo.mp4 where relevant.
  Never stretch/recolor/shadow the logo; clear space = 1× height.
- **Tokens implementation:** CSS custom properties + Tailwind v4 `@theme` in `packages/ui`, exported
  to both apps. Single source — no magic numbers.
- **HARD RULE (config.yaml):** NO mock/placeholder data, ever. Real empty states. Every control functional.

### 1.3 Component system (FROZEN — compose only from the catalog)

Every screen composes ONLY from `COMPONENT-SYSTEM.md` §1–§8. shadcn components owned (copied into
`packages/ui`), built on **Radix** (not base-ui). Generics in `packages/ui`; module composites
(`ClockInWidget`, `LeaveApprovalRow`, `DirectoryCard`, etc.) in `apps/web`. Standard states on every
interactive component: rest/hover/focus-visible/active(0.96)/disabled(40%)/loading(dot-loader)/error.
Focus = 2px brand-violet ring, 2px offset, `:focus-visible` only. Lucide icons only, stroke-width 1.75.
≥44px touch (≥48px on mobile attendance buttons).

### 1.4 State management (ADR-008) & offline (ADR-010)

- **TanStack Query** = all server state. Per-entity `staleTime`/`gcTime` (directories/departments 5m,
  dashboards/attendance-today 30s, settings/holidays 1h); `select` for derived; cursor pagination;
  stale-while-revalidate on navigation (no spinner for cached data). **Optimistic UI** for safe
  mutations (clock-in, approve leave, mark-read, pin, toggle) with rollback + danger toast.
- **Zustand** = UI state only (sidebar 3-state, theme, density, dialogs, filters, drafts). Slice
  selectors; never API data in Zustand.
- **React Hook Form + Zod**: validation on 400ms pause; submit disabled+dot-loader.
- **Offline Engine (ADR-010):** Queue→Sync Manager→Conflict Resolver→Retry→Storage(IndexedDB)→
  Connectivity. Retry ladder 1s→5s→30s→2m→5m→Manual. **Per-entity conflict (ADR-009):** Settings=Last
  Write Wins · Attendance=**Server Validation** · Leave/HR=**Server Wins**.

### 1.5 Performance (ADR-018 — all FROZEN P-* budgets, CI-GATED; owner-confirmed strict)

LCP≤2.5s p75 / FCP≤1.8s / TTFB≤600ms(web)·800ms(api) / INP≤200ms / CLS≤0.1. **API p95≤200ms read,
≤300ms write. Zero N+1; ≤5 SQL/list.** Cursor pagination (never OFFSET). Lists >100 rows virtualized
(`@tanstack/react-virtual`). First-Load JS ≤200KB gz/route; route chunk ≤350KB gz. All signed-in
routes lazy-loaded; heavy libs (ECharts/calendar/export/Tiptap/dnd-kit) dynamic-imported + idle-
prefetched. All images via `next/image` (WebP/AVIF, responsive, lazy, blur). Skeletons over spinners.
Per-widget error boundaries. Frequent workflows ≤2 clicks, no reloads. **All current performance
issues resolved without breaking functionality; a regression fails CI.**

### 1.6 Accessibility (WCAG 2.1 AA — owner-confirmed)

4.5:1 text contrast / 3:1 UI. Full keyboard reachability; visible focus rings; ARIA on icon-only
buttons (tooltips double as labels); `prefers-reduced-motion` respected; semantic HTML; accessible
dialogs/menus (Radix); axe-core **zero critical/serious in CI**. Keyboard: Ctrl+K palette, Ctrl+B
sidebar, Ctrl+N context-new, Ctrl+/ help, Esc close, Enter submit/confirm, arrows navigate menus/
lists/tabs. Min touch 44×44 (48×48 mobile attendance).

### 1.7 Deployment (ADR-025 — direct-to-production)

Vercel (web) + Railway (api) + Supabase (Postgres + Storage) + GitHub — **already connected,
credentials retained.** Each verified phase → deploy straight to production with seeded demo data;
review live. **Final clean redeploy** at go-live (Phase 10). Backups = Supabase automated + PITR;
rollback = Railway redeploy + Vercel instant rollback. No separate staging environment.

---

## §2 — Phase format & global Definition of Done

Each phase specifies: **Objectives & scope · Dependencies · Database work · Backend work · Frontend
work · UI/UX requirements · Business logic/validation/edge cases · Permissions · Testing ·
Verification & completion.**

**Global Definition of Done (every phase, on top of phase-specific):**
- [ ] OpenAPI spec written **before** any route; contract test green (ADR-005).
- [ ] All endpoints Sanctum-guarded; capability gates enforced; frontend mirrors backend.
- [ ] Zero N+1; ≤5 SQL/list; indexes on every filtered/joined/ordered column; cursor pagination.
- [ ] Lists >100 rows virtualized; `React.memo` rows + stable keys; no inline fn props on hot lists.
- [ ] First-Load JS ≤200KB gz/route; lazy-loaded; heavy libs dynamic-imported.
- [ ] Lighthouse CI green (LCP/INP/CLS/FCP); axe-core clean; WCAG AA.
- [ ] Skeletons over spinners; real empty states; per-widget error boundaries; optimistic UI + rollback;
      offline queue wired (where applicable).
- [ ] Every control performs its real function — no stubs, no `alert()`, no mock data.
- [ ] Composes ONLY from the FROZEN catalog; brand tokens; logo placement correct; per-module accents.
- [ ] Lint + typecheck + tests pass (real results reported).
- [ ] Seeder updated; migrated; seeded demo data on production.
- [ ] Deployed to production (ADR-025); smoke-tested live; rollback path verified.
- [ ] Phase spec archived to `openspec/specs/`; TRACKER ✅.

---

# PHASE 0 — Foundation repair, design-system core & deploy pipeline
**Capability:** `foundation` · **Depends on:** — · **No product features.**

### Objectives
Repair the broken working tree; lock the stack to FROZEN-spec versions; make the monorepo build, run,
and deploy as an **empty-but-real branded baseline** that obeys the FROZEN contracts. Establish the
**performance CI rails** and **monitoring scaffolding**. Copy logo assets into the web app. End state:
`/health` 200 on Railway, web shows a branded placeholder on Vercel, Supabase reachable, CI green.

### Database
- Policy: **app DB = Supabase Postgres**; **tests = in-memory SQLite** (fast CI).
- Remove `apps/api/database/database.sqlite` from git; `.gitignore` it.
- Keep Laravel default migrations (`users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`,
  `failed_jobs`, `personal_access_tokens`); **fix** `personal_access_tokens` to restore `ip_address`
  (nullable) + keep `expires_at` index. Phase 0 ships ONLY defaults; product tables land in their phases.

### Backend
- Restore `routes/api.php`: `GET /health` → `{status:"ok"}` (unauth) + `GET /user` (sanctum).
- Restore `User` model: `HasApiTokens` + `Notifiable` + `HasFactory` (unblocks Sanctum/tests).
- **Install Laravel Reverb** + broadcasting driver + env wiring; **install Laravel Pulse** + publish
  config (R10.4 monitoring scaffold).
- `.env.example`: `APP_TIMEZONE=Asia/Kolkata`, `DB_*` (Supabase pooler), `SANCTUM_*`, `REVERB_*`,
  `PULSE_*`, `MAIL_*`/`RESEND_API_KEY`, `SENTRY_*`, `FRONTEND_URL`, `API_URL`, `SESSION_DOMAIN`,
  refresh-token secret, `SUPABASE_STORAGE_*`. Align with `GUIDE-CREDENTIALS.md`.
- OpenAPI: keep base doc; add CI lint step (`redocly`/`spectral`) gating PRs.

### Frontend
- `app/layout.tsx`: self-hosted **Inter + Sora** (subset, swap, preloaded); metadata ("Games4King
  Workplace OS", `Favicon.png`); provider stubs (ThemeProvider light default, QueryClientProvider, Toaster).
- `app/page.tsx`: branded placeholder importing `@g4k/ui` (Phase 0 ships no `/login`).
- **Copy logo assets to `apps/web/public/`**: `logo.png`, `landscape-logo.png`, `favicon.png`,
  `logo-mono.png`, `animated-logo.mp4`. Update `manifest.json` (brand icons, violet theme, standalone).
- Initialize Tailwind v4 `@theme` with brand tokens in `packages/ui/src/theme` (full set lands Phase 3;
  Phase 0 must not ship broken tokens).

### packages/ui
- Make `@g4k/ui` resolvable (`workspace:*`); `src/{components,hooks,api,theme,types}`.
- API client: `openapi-typescript` → `src/types/api.ts`; fetch wrapper with bearer injection + refresh
  interceptor (refresh implemented Phase 1; Phase 0 reserves interface).
- Theme: export token CSS vars + Tailwind v4 theme config.

### CI/CD (ADR-025)
- GitHub Actions: **web** (install→lint→typecheck→build→bundle-analyzer ≤200KB gz/route→Lighthouse CI)
  + **api** (composer→test→pint→OpenAPI lint).
- Deploy straight to production on merge (Vercel + Railway); Supabase backups + PITR documented.

### Testing
- API: `GET /health` 200; migrations apply on Postgres + SQLite. Web: branded placeholder renders;
  build green; bundle budget enforced.

### Verification
- `/health` 200 on Railway; Vercel shows branded placeholder (Inter+Sora, brand logo, no Geist/zinc);
  build+test green; OpenAPI lints; bundle/Lighthouse/query-count/monitoring wired.

---

# PHASE 1 — Authentication & role-based access
**Capability:** `authentication` · **Depends on 0** · **Reqs R1.1–R1.13**

### Objectives
Branded secure sign-in for all three roles: sign-in (username/email/employee_id + password, show/hide,
loading/error), dual-role selection, forgot-password (SMTP + Admin-approval), account lockout (5/10min),
suspicious-login alerts, force first-login password change, onboarding welcome, per-device sessions +
remote logout, capability-gated route guards, responsive + offline login queue. **Auth security = DR-026.**

### Database
- `users`: `employee_id` (unique nullable), `username` (unique nullable — AUTH-D1), `email` unique,
  `password` (Argon2id), `must_change_password` bool default true, `onboarded_at` nullable, `status`
  enum(active,inactive) default active, `failed_login_count` int default 0, `locked_until` nullable,
  `last_login_at` nullable, `avatar_url` nullable, timestamps. Index `(email)`,`(username)`,
  `(employee_id)`,`(status)`.
- `role_assignments`: `id`, `user_id` fk cascade, `role` enum(super_admin,hr,employee), `created_at`.
  Unique `(user_id,role)`.
- Device metadata on `personal_access_tokens`: `ip_address` (nullable), `device_name` (use existing
  `name`), `last_used_at` (exists). (Simpler than a separate `auth_sessions` table.)
- `password_resets`: Laravel default + `channel` enum(smtp,admin), `approved_by`/`approved_at`/
  `expires_at` nullable.
- `login_attempts`: `id`, `user_id`/`identifier`, `ip`, `user_agent`, `success` bool, `created_at`.
  Index `(identifier,created_at)`.
- `refresh_tokens` (DR-026): `id`, `user_id` fk cascade, `token_hash` (sha256), `expires_at`,
  `revoked_at` nullable, `device_name`, `created_at`. Index `(user_id)`,`(expires_at)`.

### Backend
- Spec-first OpenAPI: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/role/select`,
  `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `/auth/sessions` (GET/DELETE),
  `/auth/me`. Generate types.
- `AuthController` (salvage+fix): login resolves by username OR email OR employee_id; Argon2id verify;
  rate-limit per identifier+IP (5/600s → 423 + `retry_after`); on success issue **access token 15min
  (in-memory) + refresh token 7-day sliding (HttpOnly cookie)**; record `login_attempts`; suspicious
  (new IP/UA) → audit + SMTP to Admin/HR (R1.8); enforce `must_change_password` flag in response.
- `/auth/refresh`: validates HttpOnly cookie → new access token; rotates refresh; reuse → revoke family.
  **Cookie SameSite auto-detected at runtime** (DR-026): `Strict` if same registrable domain, else
  `None` + double-submit CSRF token.
- `forgotPassword`: SMTP → signed reset email (Mailable); admin channel → Admin-approval request.
  202 always (no enumeration). `resetPassword`: token+email+new pw → clear `must_change_password`.
  `changePassword`: current-pw verify + new pw (**strong policy DR**: min 8, upper+lower+number+symbol,
  ≠ current) → clears flag.
- `roleSelect`: re-issue token with `role:<chosen>` (only if assigned). `sessions`/`revokeSession`/
  `logout`: list devices; revoke by id; logout revokes current + broadcasts `SessionRevoked` on
  `private-user.{id}` (Reverb) for instant sign-out.
- `RequireCapability` middleware + minimal Phase-1 capability resolver (Phase 2 makes it DB-backed;
  same interface).

### Frontend
- **Primitives now (packages/ui, Radix):** `Button`, `Input`, `PasswordInput` (eye toggle), `Label`,
  `Form`/`FormField`/`FormItem`/`FormMessage` (RHF+Zod), `Card`, `Tooltip`, `Toaster` (sonner top-right),
  `Skeleton`, `EmptyState`. Token-driven, brand.
- **Pages (`app/(auth)/`):**
  - `login/page.tsx` — `SignInCard`: brand-gradient hero + `landscape-logo.png`; welcome copy;
    copyright "Games4King Workplace OS"; info Tooltip "Gen2k Conglomerate (2018) • Milestone 1";
    identifier `Input` + `PasswordInput`; primary `Button` (loading dot-loader + disabled);
    forgot `Link`; RHF+Zod (400ms pause). **TanStack Query `useMutation`**; **Zustand** in-memory
    token; **offline queue** login attempt (R1.13) + banner.
  - `role-select/page.tsx` — `RoleSelectGrid` for dual-role.
  - `forgot-password/`, `reset-password/` — RHF+Zod forms.
  - `change-password/` — forced first-login (current+new+confirm); strong-policy validation.
  - `onboarding/` — welcome Card steps; sets `onboarded_at`; animated-logo.mp4 where relevant.
- **Provider stack + guards:** `ThemeProvider` (light default), `QueryClientProvider`, `Toaster`,
  `OfflineIndicator`. `AuthGuard`: no token → `/login`; `must_change_password` → `/change-password`;
  `!onboarded_at` → `/onboarding`; dual role → `/role-select`; else `/dashboard`. (Full AppShell Phase 3.)
- **Token handling (DR-026):** access token in memory (Zustand, cleared on logout); on load call
  `/auth/refresh` (HttpOnly cookie) to restore; 401 → refresh once → retry or logout. **Never localStorage.**

### UI/UX
Brand-gradient hero; Inter+Sora; logo per §10; loading animation; generic error (no field disclosure);
120ms press, 280ms dialog, 200ms toast. States: loading (dot-loader+skeleton), error (inline+toast),
success (toast+redirect), offline (banner+queued), locked-out (message+retry-after). Responsive 360→1920;
≥44px touch; focus ring; full keyboard; reduced-motion.

### Business logic / edge cases
Identifier resolution username→email→employee_id (case-insensitive). Lockout 5/10min → `locked_until`;
clear on success; manual Admin override. Suspicious = new IP/UA → notify. Refresh rotation; reuse →
revoke family. Force-change gate blocks all non-auth endpoints (middleware). Dual-role must select
before any capability-gated route.

### Testing
API feature: login each role + by username/email/employee_id; wrong pw (401+attempt); lockout 5→423;
suspicious record; refresh flow + rotation + reuse-revocation; force-change gate; role-select unauthorized
→403; sessions+revoke; logout. Query-count on `sessions` ≤5. Web: render, Zod, loading/disabled, error
toast, offline queue, redirect matrix, role-select, axe-core. Security: no token in localStorage;
refresh cookie HttpOnly+Secure; SameSite correct.

### Verification
Sign in as karthik/Admin@123, aravind/Hr@123, praveen/Dev@123 → correct dashboard route; trigger
lockout; forgot/reset; force-change first login; revoke a device from another (instant sign-out via
Reverb). Perf: FCP≤1.2s, LCP≤1.2s lab; login p95≤300ms. Archive Phase 1.

---

# PHASE 2 — Org management, RBAC, directory, profile (Base module core)
**Capability:** `org-management` · **Depends 0,1** · **Reqs R2.1–R2.13**

### Objectives
DB-backed capability matrix enforced on every org endpoint; designations master (15 from reference);
Admin CRUD for HR + Employee accounts (dual role, dept/team, reset pw, deactivate, activity log);
Admin-only Department + Team CRUD; configurable auto-numbering; reusable master-data table pattern;
searchable Employee Directory (grid/list + Send Message contract); profile screens (all roles) with
photo popup + devices; **real seed data loaded.**

### Database
- `users` extensions: `department_id`,`team_id`,`designation_id` (fk nullable), `phone` nullable,
  `reports_to` (fk users nullable), `employee_code` (numbering, unique), `profile_visibility` json,
  `joining_date` date nullable, `blood_group` nullable. Index `(department_id,status)`,
  `(designation_id,status)`,`(status,employee_code)`.
- `departments`: `id`, `name` unique, `description`, `code` (DEP001), `status` (active/archived), timestamps.
- `teams`: `id`, `department_id` fk cascade, `name`, `description`, unique `(department_id,name)`.
- `designations`: `id`, `name` unique, `description`, timestamps.
- `capabilities`: `id`, `key`, `description`, `group`. Seed-driven, not user-editable.
- `role_capabilities`: composite PK `(role,capability_key)` — **the matrix the middleware reads.** Seed
  per §1.1.
- `numbering_schemes`: `id`, `entity` enum(company,employee,department,…), `prefix`, `start_at`,
  `length`, `suffix`, `format`, `next_seq`, `increment`, timestamps. Atomic generation (row lock).
- `audit_logs`: `id`, `user_id` fk nullable, `action_type`, `resource_type`, `resource_id`,
  `metadata` json, `ip_address`, timestamps. Index `(user_id,created_at)`,`(action_type,created_at)`.
  (Writer service built here; UI in Phase 7.)
- Seed: company, 2 departments, 15 designations, 13 employees per reference; default work schedule
  (Mon–Sat 09:00–18:30, break 45, standard 31500s) for Phase 5; standard Indian public holidays +
  company holidays for Phase 6.

### Backend
- Spec-first OpenAPI: `/users`, `/departments`, `/teams`, `/designations`, `/directory`,
  `/me/capabilities`, `/numbering-schemes`.
- **`CapabilityService`** (DB-backed): active role → capability list; `has($key)`; per-request cache.
  `RequireCapability` reads it. `GET /me/capabilities` returns the list.
- **`AuditService`**: every important write (create/update/delete/role-change/deactivate/reset-pw/
  approve) writes `audit_logs` in a transaction.
- `UserController`: index (cursor paginated, filters search/department/status/role, eager-load, ≤5 SQL),
  store (auto employee_code, role-specific default password, `must_change_password=true`, role
  assignments incl. dual), show, update (incl. role reassign), destroy/deactivate (status), reset
  password, activity log. Gates: `users.hr.manage`/`users.employee.manage` (Admin).
- `DepartmentController`/`TeamController`: CRUD + members + archive; Admin (`departments.manage`).
  `DesignationController`: CRUD (`designations.manage`).
- `DirectoryController`: search (name/email/employee_id/username, debounced 250ms), public profile +
  **visibility rules (DR)**: name/designation/dept/avatar always; phone/email/mobile visible only if
  owner marked public (`profile_visibility`); blood group/emergency/alternate-mobile NEVER in directory
  (Admin-only via user edit). `Send Message` → creates a Direct chat conversation row (chat UI future;
  contract reserved).
- `ProfileController`: show (per visibility), update (name/phone/avatar_url/designation), photo upload
  popup (**Supabase Storage** DR-029; format+size validation), change password, devices + revoke.
- `AutoNumberingService`: atomic next-seq per entity; editable scheme.

### Frontend
- **Primitives added (packages/ui):** `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`,
  `Avatar`/`AvatarGroup`, `Badge`/`StatusBadge`, `Separator`, `Pagination`, `Tooltip`, `DropdownMenu`,
  `ContextMenu`, `Sheet`, `Dialog`/`AlertDialog`, `Popover`, `ScrollArea`, **`DataTable`** (TanStack
  Table + virtualized + cursor pagination + memoized rows), **`FilterBar`** (search + status multi-check
  + dept/team combobox + sort select + removable chips + Clear-all), `FileUpload` (popup), `EmptyState`,
  `Skeleton`.
- **Pages:** `dashboard/org/users` (Admin `DataTable` + `DropdownMenu` row actions + `Dialog` `UserForm`
  with photo FileUpload, role Checkbox group, dept/team Combobox, designation Select); `dashboard/org/
  departments`; `dashboard/org/designations`; `dashboard/directory` (grid/list, virtualized, search,
  card → `Sheet` profile + Send Message); `dashboard/profile` (`ProfileForm` + photo popup + change pw
  + devices `DataTable` + remote-logout `AlertDialog`).
- State: TanStack Query (staleTime dirs/depts 5m); optimistic activate/deactivate/role-change with
  rollback; Zustand filters/dialogs/density.

### UI/UX
White surfaces, per-module accents, colourful Lucide icons, status badges, hover lift e2, 280ms dialogs,
200ms sheets, 180ms table. Empty states per context. Skeleton rows. Inline edit where specified.
Responsive: table→cards mobile; filters → Sheet. Micro-interactions: press 0.96/120ms, optimistic
badge flips, toasts.

### Business logic / edge cases
Can't deactivate/delete the last Super Admin. Can't remove a role leaving user role-less. `employee_code`
unique; auto-numbering atomic. Photo: client type/size validation + server re-validation. Visibility
rules server-enforced. Department archive hides from active lists, preserves history.

### Testing
API: capability gate denies unauthorized on every org endpoint; HR/Employee CRUD lifecycle; dual-role;
dept/team CRUD admin-only + members + archive; designation CRUD; auto-numbering generate+advance+edit;
master-data import/export/search/paginate; directory search + visibility; profile edit + photo + change
pw; device revoke. Query-count ≤5; zero N+1; cursor. Web: directory virtualization (1000 rows 60 FPS);
profile photo popup; routing guards; optimistic+rollback; offline user edit (Server Wins); axe-core.

### Verification
Create/edit/deactivate a user; dual-role; search directory; non-admin blocked `/org/users` (403);
employee_code auto-numbers (G4K014 next); audit row per action; photo rejects oversize; Send Message
creates chat. Seed = 13 employees + 1 company + 2 depts + 15 designations. Archive Phase 2.

---

# PHASE 3 — App shell, 3-state sidebar, navigation, full design system
**Capability:** `app-shell` · **Depends 0,2** · **Reqs R3.1–R3.16, R11.2/4/6/7/8**

### Objectives
Finalize the FROZEN design system in code; build the role-aware **AppShell with 3-state sidebar
(Hidden/Collapsed/Expanded)** (ADR-024), top bar, mobile bottom nav + hamburger Sheet, breadcrumbs,
pinned items, command palette (Ctrl+K), keyboard shortcuts, form system (autosave/draft/restore),
FilterBar, confirmations, inline edit, dnd reorder, pagination, toasts, skeletons, empty states, PWA
installable + offline shell, offline banner. **Makes the Base Module's shell production-polished.**

### Database
- Reuse `user_preferences` (preferences json) for sidebar state (3-state), theme, density, pinned,
  saved views, recently viewed. Drafts live in IndexedDB client-side.

### Backend
- `GET/PUT /auth/preferences` accepts sidebar/theme/density/pinned/recent.
- Reverb channels configured: `private-user.{id}`, `private-org`, `presence-*`, public.
- Caching: route/config/view cache + OPcache + query cache for hot reference data (departments,
  designations, capabilities) — P-CACHE-SRV.

### Frontend — packages/ui (complete the catalog)
- Finalize **all** tokens in `@theme`: brand palette, semantic, surfaces, type scale, spacing, radius,
  elevation, motion, dark variants. Export CSS vars + Tailwind v4 theme.
- Complete component catalog (Radix): all form primitives, overlays, data display, navigation,
  filters, feedback, editors reserved (Chart lazy stub for Phase 5).
- **Form system:** `Form`/`FormSection` + `useFormDraft(key)` (IndexedDB, 30s autosave, restore banner)
  + on-pause Zod + submit dot-loader + success toast.

### Frontend — AppShell (apps/web)
- `app/dashboard/layout.tsx` = `AppShell`:
  - **TopBar:** square logo 28px + "Workplace OS" wordmark (Sora 700); global search stub (Ctrl+K hint);
    `NotificationsBell` (unread Badge, popover — wired Phase 6 for real); avatar `DropdownMenu` (profile,
    theme toggle, density, sidebar state, logout). Sticky, e4, blurs on scroll.
  - **Sidebar — 3 STATES (ADR-024, supersedes FROZEN 2-state):**
    - **Expanded (264px):** icon + label; active = module-accent-tinted bg + brand left bar + 600 weight;
      hover = surface-2; section headers shown; pinned items at bottom (divider). Default target on
      large desktop.
    - **Collapsed (72px):** icon only + tooltip on hover (150ms); active = accent-tinted bg + brand left
      bar; section headers → thin divider with first child icon; pinned → icon+tooltip. **Default state
      on first visit.**
    - **Hidden:** sidebar completely removed; accessible via hamburger (top bar) → full-screen `Sheet`
      menu (280ms slide) OR bottom nav on mobile.
    - **Transitions:** width + content cross-fade glide **220ms cubic-bezier(.4,0,.2,1)**; labels fade
      out (opacity 120ms) before width transitions; collapsed icons fade in; section-group child
      collapse 180ms height glide. Reduced-motion → ≤1ms.
    - **Toggle controls:** chevron button at sidebar footer + **Ctrl+B** + command palette + top-bar
      hamburger (cycles expanded↔collapsed; hamburger on mobile → hidden/Sheet). State persists per user.
    - **Micro-interactions:** hover lift, active press 0.96, accent left-bar grow-in, tooltip slide-fade,
      drag-affordance on pinned reorder (dnd-kit), keyboard navigable (arrows + Enter), ARIA
      `aria-expanded`/`aria-current="page"`; scrollbar thin themed auto-hide.
    - **Per-module accents** (ADR-023): nav icon + active tint use the module's signature colour
      (Dashboard violet, Attendance emerald, Leave amber, Directory pink, Org/Profile blue, Settings
      slate, Audit rose).
  - **Mobile:** sidebar hidden; hamburger → full-screen `Sheet`; **bottom nav ≤5** (Dashboard, Attendance,
    [Chat* or Directory by role], Profile) + 5th adaptive (Reports* / My Tasks*); attendance button
    prominent ≥48px. (* = future/empty-state module; show allowed items only.)
  - **Breadcrumb** below top bar on detail screens; each crumb a Link; ellipsis on narrow.
  - **CommandDialog (Ctrl+K):** navigate, create-new (context), pin/unpin, toggle theme/density, sidebar
    state, run saved view, open recent, switch role (dual-role), quick clock-in/out (Phase 5), quick
    logout. Instant client fuzzy index (<50ms; web worker if large); recent-first; keyboard-first.
  - **Keyboard:** Ctrl+K, Ctrl+B (sidebar), Ctrl+N (context new), Ctrl+/ (help overlay), Esc close,
    Enter submit/confirm.
- **PWA (ADR):** `manifest.json` (brand icons, violet theme, standalone); service worker (offline shell
  + cached assets); installable; **no push at M1.** `OfflineBanner` when `navigator.onLine===false`.
- **Global states:** `EmptyState` (colourful Lucide icon + copy + optional action + animated-logo.mp4
  for full-screen/onboarding; **never the king mascot**), `Skeleton` (content-shaped), per-widget
  `ErrorBoundary`, toasts (sonner top-right 4s, pause-on-hover, manual X).
- **Responsive:** fluid 360→1920; tables→cards; filter bars → Sheet; reserved dims for CLS≤0.1.

### UI/UX
Vibrant-on-white (ADR-023); gradients only on hero/dashboard-headers/logo; disciplined semantic status
colours; colourful per-module accents; polished micro-interactions everywhere; consistent status badges
(Gray/Blue/Amber/Green/Red). Joyful milestone celebrations (ADR-023/Q4): subtle confetti/sparkle on
genuine milestones (first clock-in, leave approved, onboarding done) + standard success toast for
routine saves + 0.96→1 scale checkmark on every success.

### Permissions
Sidebar/nav render per capability; routes guarded; forbidden deep-link → 403 UI. Bottom nav shows only
allowed items.

### Testing
Web: toggle theme/density; 3-state sidebar transitions (expanded↔collapsed↔hidden); pin item; submit
form (autosave/restore); open palette; resize to mobile → bottom nav; keyboard shortcuts; render-count
test (no re-render storm); axe-core clean; Lighthouse CI on shell route. Bundle: AppShell ≤200KB gz
First-Load; lazy children.

### Verification
Desktop + mobile (360/768/1024/1440) visual review vs DESIGN-SYSTEM; logo correct in top bar + sidebar
(expanded/collapsed) + sign-in + manifest; animated logo in an empty state; Ctrl+K/B/N//Esc/Enter
functional; offline banner + queued form; theme persists. **Base Application shell complete.** Archive Phase 3.

---

# PHASE 4 — Dashboard framework, widgets & company views (Base module capstone)
**Capability:** `dashboards` · **Depends 3** · **Reqs R4.1–R4.9**

### Objectives
Widget Engine (drag/resize/collapse/refresh/lazy/offline/realtime/adaptive), per-user React Grid Layout
(ADR-007) saved to preferences, generic JSON-fed Metric Widget, three role dashboards rendering **real
data** where the module exists (auth/org/attendance in M1) and **true empty states** for unshipped
modules (Projects/Tasks/Chat/Announcements → empty state, not mock). Quick-action shortcuts. **Caps the Base Module.**

### Database
Reuse `user_preferences` for per-user widget layout (JSON). No new tables.

### Backend
- `GET /dashboard/metrics` → **real aggregates**: total/active employees, today attendance
  (present/absent/late — Phase 5 or 0 + empty state), pending leave approvals (Phase 6 or empty),
  recent activity feed (audit — dense, no noise). **No hardcoded numbers.** Each server-computed; ≤5 SQL;
  cached 30s.
- Realtime: widgets subscribe to relevant Reverb channels (org changes refresh counts).

### Frontend
- **`WidgetEngine`:** manifest `{id,title,size,permissions,dataProvider,refresh,lazy,realtime,offline,
  settings}`; React Grid Layout drag/resize; each widget in its own `ErrorBoundary`; lazy-load via
  IntersectionObserver; refresh icon on hover; dismissible; adaptive (Small=metric, Medium=metric+stats,
  Large=chart+stats+trend+actions). Layout saved per user.
- **`MetricWidget`:** generic JSON-fed. Reused.
- **Role dashboards** (DESIGN-SYSTEM §13, M1-scoped):
  - Super Admin: total/active employees (Small), today attendance (Small→Med), pending leave approvals
    (Large, quick-access — Phase 6), recent activity feed (Large, audit). Projects/Tasks/Quick-Task →
    true empty state.
  - HR: today team attendance (Small→Med), pending leave requests (Medium, approve/reject quick — Phase 6),
    pending submissions → empty state, recent activity. Quick Task Assignment → empty state.
  - Employee: active projects mine → empty state, pending tasks mine → empty state, **Attendance widget
    Start/Pause/End + live timer (Medium — wired Phase 5)**, task approval panel → empty state.
- Quick-action shortcuts on each dashboard; widgets clickable to deeper pages.

### UI/UX
Vibrant dashboard header (brand gradient), colourful per-module icons, animated progress bars (0→value
600ms), skeletons per widget, empty states per widget, error boundary per widget. 60 FPS drag/resize.

### Business logic / edge cases
Slow/broken widget never blocks others (P-RESILIENT). Layout survives reload. Adaptive content on resize.
Unshipped-module widgets render true empty state, never mock.

### Permissions
Widget visibility by capability; role composition gated by active role.

### Testing
Rearrange → persists; refresh one widget independently; resize changes adaptive content; render-count
test (timer never re-renders unrelated widgets — prep Phase 5); per-widget error boundary isolates a
failure; Lighthouse on dashboard.

### Verification
Each role dashboard renders real counts (0 + correct empty state where module absent); layout persists;
widget-level error isolation verified. **Base Application Module DONE.** Archive Phase 4.

---

# PHASE 5 — Attendance: clock in/out/break, history, corrections (reference module)
**Capability:** `attendance` · **Depends 2,3,4** · **Reqs R5.1–R5.16** · **Rules DR-027**

> Reference module for day-to-day performance. Conflict = **Attendance = Server Validation** (ADR-009).
> Timer runs in the Offline Engine; server reconciles.

### Objectives
Clock In / Start Break / End Break / Clock Out + auto-saved timeline; live HH:MM:SS timer (survives
navigation, amber on overtime, stops only on explicit End); personal calendar heatmap + per-day
summaries; Admin company-wide overview (date/dept/person filters); HR today shift status + weekly/monthly
graphs; Admin/HR manual corrections (events + day summary, full audit); overtime + late badge; Excel
export; configurable shift-reminder scheduler; **forgot-clock-out = flag open shift + manual correction
(no auto-out)**; offline timer + Server-Validation sync.

### Database (replace existing attendance tables with FROZEN Phase-5 design)
- **`attendance_days`** (summary): `id`, `user_id` fk cascade, `date`, `clock_in` nullable, `clock_out`
  nullable, `first_event`, `last_event`, `total_seconds` int, `break_seconds` int, `overtime_seconds`
  int, `status` enum(present,absent,late,leave), `late_minutes` int, `corrected_by` fk nullable,
  `source` enum(local,manual,server), `version` int, `has_open_shift` bool default false, timestamps.
  Unique `(user_id,date)`. Index `(date)`,`(user_id,date)`,`(status,date)`,`(has_open_shift,date)`.
- **`attendance_events`** (immutable append-only — reconciliation source): `id`, `user_id` fk cascade,
  `timestamp` ts, `type` enum(clock_in,start_break,end_break,clock_out), `project_id` fk nullable,
  `device_meta` json, `source` enum(local,server,manual), `client_id` uuid (idempotency), `created_at`.
  Index `(user_id,timestamp)`,`(client_id)`.
- **`attendance_corrections`** (audit): `id`, `attendance_day_id` fk cascade, `corrected_by` fk,
  `field`, `old_value` json, `new_value` json, `reason`, `created_at`.
- **`work_schedules`** (seeded Phase 2, edited Phase 7): seed default (DR-027): Mon–Sat
  (`working_days=[1,2,3,4,5,6]`), `start_time=09:00`, `end_time=18:30`, `break_minutes=45`,
  `standard_seconds=31500`, Asia/Kolkata, `is_default=true`. Sunday off. Overtime threshold=31500s;
  late=clock-in after 09:00 (+grace, default 0).
- **Drop** old `attendance_records`/`attendance_logs`.

### Backend
- Spec-first OpenAPI: 12 attendance endpoints (Phase-5 design §API).
- **`AttendanceService`** (only writer to `attendance_days`): on each event append `attendance_events`
  (dedupe by `client_id`), then **recompute** the day: ordered events → on-clock spans − break spans =
  `total_seconds`; `overtime_seconds` = max(0, total − 31500); `status` = late if clock_in > 09:00;
  leave if a leave record covers the day (Phase 6); present if any work; else absent. Server row always
  wins; bump `version`.
- Endpoints: `POST /attendance/clock-in|start-break|end-break|clock-out` (cap `attendance.clock-self`,
  idempotent on `client_id`, optimistic-friendly), `GET /attendance/me/today`,
  `GET /attendance/me/history?from&to`, `GET /attendance/me/day/{date}`,
  `GET /attendance/admin/overview?date&department_id&user_id&status` (cap `admin.view-all-attendance`),
  `GET /attendance/admin/day`, `GET /attendance/hr/today?status?` (cap `hr.view-team-attendance`),
  `GET /attendance/hr/graph?user_id&mode=weekly|monthly&date`,
  `POST /attendance/correct` (Admin cap `admin.correct-attendance`=any; HR cap `attendance.correct-team`
  =own team — DR-027; edits **events + day summary**: add/remove/adjust event times, set status, add
  missing clock-out; writes `attendance_corrections` audit + re-reconciles),
  `GET /attendance/export?…` (xlsx stream, cap `admin.view-all-attendance`+`hr.view-team-attendance`).
- **Reconciliation rules / edge cases (DR-027):**
  - clock_in requires no open shift that day (or folds into timeline). clock_out requires open clock_in.
    start_break requires on-clock; end_break requires open break.
  - Out-of-order → server orders by timestamp; rejects only truly unreconcilable (clock_out with no
    clock_in) → structured error → conflict toast.
  - **Cross-midnight (DR-027):** entire shift attributed to clock-in date — one row, full span.
  - **Forgot-clock-out (DR-027):** shift stays open; `has_open_shift=true` + amber badge; HR/Admin
    "open shifts" alert (scheduler job at end+grace listing open shifts); corrected via manual
    correction (add clock-out + reason). **No auto-clock-out.**
  - Late badge when clock_in > start_time (+grace). Overtime amber when total > 31500. Holidays
    (Phase 6) excluded from absence.
- **Scheduler** (queued jobs): `Attendance\RemindShiftStart` (start − 15min → notify employee);
  `Attendance\AlertMissedClockIn` (start + 30min → notify HR if not clocked in);
  `Attendance\FlagOpenShifts` (end + grace → mark `has_open_shift`, notify HR/Admin). Times configurable (Phase 7).
- **Charts/export:** ECharts calendar heatmap + weekly/monthly graphs (lazy import, web-worker
  aggregation if >50ms); Excel export streaming writer, **queued if >500ms**.

### Frontend (composites per COMPONENT-SYSTEM §7 Attendance)
- **`ClockInWidget`** (dashboard + `/dashboard/attendance`): `Button(success)` Clock In (mobile ≥48px),
  live timer (**isolated component** — rAF/1s, state in ref/context NOT global Zustand, recompute from
  local `attendance_events` baseline in IndexedDB; **never re-renders sibling widgets**), `Button(secondary)`
  break, `Button(destructive)` End Shift (`AlertDialog` confirm). **Optimistic** + rollback danger toast
  (R5.13). One-tap (≤2 clicks). **Joyful milestone** (ADR-023): subtle confetti on first-ever clock-in.
- **`AttendanceHistoryCalendar`:** virtualized calendar heatmap (lazy import, month-change fetch +
  per-month cache), per-day `Popover` summary (clock-in/breaks/out/hours/status). Overtime distinct
  colour. Open-shift badge.
- **`TeamAttendanceTable`** (HR today): `DataTable` + present/absent/late filter chips in `FilterBar`,
  cached 30s stale-while-revalidate (R5.16), in-place filter changes (no reload), debounced 250ms.
- **`AdminAttendanceOverview`** (Admin): `DataTable`/calendar with date/dept/person filters, click any
  date/person → full summary; HR weekly/monthly graphs (ECharts).
- **`ManualCorrection`:** inline edit on day-summary row → `Dialog` (edit events + summary: field/old/
  new/reason) → `POST /attendance/correct` → audit + re-reconcile.
- **Realtime:** `presence-attendance-today` (who's clocked in now); `private-user.{id}`
  `AttendanceDayReconciled` snaps local timer/heatmap to server truth.
- **Offline:** every clock/break writes `attendance_events` to IndexedDB immediately (with `client_id`)
  + enqueues sync; timer correct offline; on reconnect Sync Manager pushes; server dedupes via
  `client_id`; conflict toast on unreconcilable.

### UI/UX
Colourful Lucide icons (Clock, Play, Pause, Square, Calendar, TrendingUp); status badges (Present green,
Late amber, Absent red, Leave blue, Overtime amber, Open-shift amber-pulse); heatmap legend; skeletons;
empty state ("No attendance records yet. Clock in to start your first shift."); per-widget error
boundary. Micro-interactions: one-tap optimistic clock with haptic-scale press; timer amber transition
on overtime; 600ms progress fills; toast confirmations.

### Permissions
`attendance.clock-self` (all, self). `hr.view-team-attendance` + `attendance.correct-team` (HR, own
team). `admin.view-all-attendance` + `admin.correct-attendance` (Admin).

### Testing
API: clock-in/out/break ordering + timeline; reconciliation recomputes totals/overtime/status; late
flag; `client_id` idempotency (replay no double-insert); forgot-clock-out flags open shift; manual
correction writes audit + re-reconciles; cross-midnight attribution; capability gate denies; export
valid xlsx. **Query-count ≤5 at 10k rows; zero N+1; cursor; indexes verified.**
Web **perf (reference module):** isolated-timer Profiler test; one-tap click-count (≤2) + rollback;
virtualization (5000 rows, 60 FPS, INP≤200ms); cache-hit + filter-in-place + p95≤200ms; lazy heatmap +
web worker; queued export; offline `client_id` idempotency + sync; budget gate (Lighthouse + bundle +
render/query). A11y: axe-core; keyboard clock controls; ≥48px mobile attendance.

### Verification
Clock in → break → clock out (one tap each, optimistic); heatmap → per-day summary correct; trigger
late (after 09:00) → late badge + amber; trigger overtime → amber timer; forget clock-out → open-shift
flag + HR alert → correct; go offline mid-shift → queue → reconnect → sync (client_id dedupe); HR
today ≤200ms cached; Admin Excel export; HR/Admin manual correction → audit + re-reconcile. All Phase-5
budgets green. Archive Phase 5. **Attendance Module (core) DONE.**

---

# PHASE 6 — Leave management, approvals & attendance↔leave integration
**Capability:** `leave-approvals` · **Depends 2,3,5** · **Reqs R6.1–R6.8** · **Rules DR-028**

> Conflict = **Leave/HR = Server Wins** (ADR-009). Approval framework designed for reuse (future
> Projects/Tasks submissions) but only Leave uses it in M1.

### Objectives
Reusable approval state-machine (Submitted→Pending→Approved/Rejected) on polymorphic `approvals`;
leave: Employee→HR approves, HR→Admin approves; leave history + status badges; holiday calendar view
(seeded, read-only here; CRUD Phase 7); approval events surface in bell + Notification Center (minimal
notification service now, expanded future); **attendance↔leave integration** (approved leave → attendance
status=leave for the range, excludes absence).

### Database
- **`approvals`** (polymorphic, reusable): `id`, `approvable_type` (leave_request now; task_submission/
  project_submission future), `approvable_id`, `status` enum(submitted,pending,approved,rejected) default
  pending, `submitted_by` fk, `submitted_at`, `current_approver_role` enum(super_admin,hr), `decision`
  enum(approved,rejected) nullable, `decision_reason` nullable, `decided_by` fk nullable, `decided_at`
  nullable, `payload` jsonb, timestamps. Index `(approvable_type,approvable_id)` unique,
  `(status,current_approver_role)`,`(submitted_by)`.
- **`leave_requests`**: `id`, `user_id` fk, `start_date`, `end_date`, `reason`, `type` enum
  **(casual,sick,earned,unpaid)** (DR-028), `approval_id` fk one-to-one, timestamps. Index
  `(user_id,start_date)`; unique-partial `(user_id,start_date,end_date) where status=pending`.
- **`holidays`** (read here, written Phase 7): `id`, `name`, `date`, `recurring` bool, `description`,
  timestamps. Index `(date)`. Seed standard Indian public holidays + company holidays.
- **`notifications`** (minimal service now, expanded future, same table/event contract): `id`, `user_id`
  fk, `type`, `title`, `body`, `data` json, `read_at` nullable, `link` nullable, timestamps. Index
  `(user_id,read_at)`.

### Backend
- Spec-first OpenAPI: `/leave-requests`, `/approvals/{id}/decision`, `/approvals/pending`,
  `/leave-requests/history`, `/holidays`, `/notifications` (GET, mark-read).
- **`ApprovalService`** (only writer to `approvals`): `submit`/`approve`/`reject`. State machine: submit
  → pending + `current_approver_role` (employee leave→hr; HR leave→super_admin); pending→approved/rejected
  only if decider's active role = `current_approver_role` AND holds capability; terminal no reopen.
  Capability map `{leave_request:{hr:'leave.approve-employee', super_admin:'leave.approve-hr'}}`.
  Events `ApprovalSubmitted`/`ApprovalDecided` (Laravel events + Reverb broadcast `private-user.{id}`);
  listeners = notification write + audit.
- **`LeaveRequestController`**: store (end≥start, no duplicate pending overlap, type in set), index
  (scoped: employee own, HR team+own, Admin all + FilterBar + cursor), show, decision (approve/reject +
  reason), history.
- **Attendance↔leave integration (critical):** on `ApprovalDecided(approved)` for a leave_request, for
  each date in [start,end] → set/insert `attendance_days.status='leave'` (+ clear absent flag) for that
  user. Rejection → no change. Holidays excluded from absence (Phase 5 reconciliation references this).
- **`NotificationController`** (minimal): index (cursor, limit 50), mark-read (optimistic).
  `NotificationService` write + `notification-created` broadcast `private-user.{id}`.
- **HolidayController**: index (`?year=`), cached 1h. (CRUD Phase 7.)

### Frontend
- **`LeaveRequestForm`** (`/dashboard/leave`): `Form` — `DateRangePicker` (end≥start), type `RadioGroup`
  (casual/sick/earned/unpaid), reason `Textarea`, submit `Button` (optimistic + toast). Scope reflected.
- **`LeaveApprovalRow`**: dates, reason, type badge, status `StatusBadge` (Amber pending → Green approved
  / Red rejected), approve `Button(success)` 1-click, reject `Button(destructive)` → `AlertDialog` +
  reason. **Optimistic badge flip + rollback.**
- **`LeaveHistoryTable`**: virtualized `DataTable` + FilterBar (status/type/date).
- **`HolidayCalendar`**: month view, cached 1h, lazy-loaded (read-only here).
- **`NotificationsBell`** (real now): popover of recent approvals; mark-read optimistic; unread badge
  decrements optimistically.
- **Realtime:** `approval-status-change` on `private-user.{submitted_by}` flips requester's badge + toast;
  `notification-created` pushes to bell.

### UI/UX
Status badges (Amber pending, Green approved, Red rejected); type badges (casual/sick/earned/unpaid —
context colours); skeletons; empty states ("No leave requests yet."); per-widget error boundary.
Micro-interactions: 1-click approve (optimistic flip), reject confirm + reason, toasts, **joyful
milestone** sparkle on leave-approved.

### Business logic / edge cases (DR-028)
No overlapping pending leave (DB partial-unique + server). Approver must be routed role + hold capability
(HR can't approve HR leave). Approve → attendance days status=leave for range. Reject with reason →
notified. Holidays excluded from absence; recurring holidays apply yearly. Terminal state, no reopen.
**No balances/quotas at M1** — requests + history + attendance integration only; employee sees "you've
taken N casual days this month" from history. Submit queued offline (Server Wins); approve/reject require
online (disabled under offline banner).

### Permissions
`leave.request-self` (all, self). `leave.approve-employee` (HR). `leave.approve-hr` (Admin). Views scoped.

### Testing
API: approval state machine (submit→pending→approve/reject, wrong role denied, terminal no-reopen);
leave CRUD + overlap prevention; attendance integration (approved leave → status=leave for range);
holiday exclusion; notification write + broadcast; capability gates; query-count ≤5 + zero N+1 + cursor
+ composite indexes. Web perf: optimistic approve/reject + rollback; virtualize history + render-count
on broadcast (no storm); cached lists (30s) + holiday (1h); one-click click-count; axe-core; Lighthouse.
Framework-reuse test: `approvals` + `ApprovalService` accept a non-leave approvable type (prep future)
without code change.

### Verification
Employee praveen submits leave → HR aravind approves (1-click, optimistic flip, bell notify) → attendance
days for range show status=leave; HR aravind submits leave → Admin karthik approves/rejects with reason;
holiday calendar shows holidays; bell reflects approvals; history filters. Archive Phase 6. **Attendance
Module complete with leave integration. M1 functional scope DONE (Phases 0–6).**

---

# PHASE 7 — Settings, holiday CRUD, audit log & company management
**Capability:** `system-settings` (M1 subset) · **Depends 2,5,6** · **Reqs R10.1–R10.3 (subset)**

### Objectives
Admin company management UI: company profile (logo/name/timezone/address), working hours/work-schedule
editor, **holiday CRUD** (promote from Phase 6 read-only), password/session policies, notification prefs,
configurable attendance reminder/grace times; **audit log UI** (filterable/exportable). Settings persist
+ audited. (Full R10 Sentry/Pulse wiring + perf audit are Phase 9.)

### Database
- `settings` (exists) — keys: company profile, working hours (→ `work_schedules` editor), holiday
  calendar (→ `holidays` CRUD), password policy (min/expiry), session rules, notification prefs,
  reminder times, attendance grace/late threshold. `work_schedules` + `holidays` editable here.

### Backend
- `SettingsController` (Admin `settings.manage`): grouped endpoints (company/hours/holidays/policies/
  sessions/notifications/reminders/attendance-rules), writes audit.
- `HolidayController`: full CRUD (create/edit/delete/recurring) — promoted from Phase 6 read.
- `AuditLogController`: index (filter by user/action/date, cursor pagination), export (queued CSV).
  `AuditService` already writes everywhere (Phase 2+).

### Frontend
- **`SettingsTabs`** (company/hours/holidays/policies/sessions/notifications/reminders/attendance-rules
  — each a `Form`), **`HolidayCalendar` CRUD UI** (add/edit/delete/recurring), **`AuditLogTable`**
  (virtualized, FilterBar, export).

### UI/UX
Per-module accents (Settings slate, Audit rose); forms with autosave/draft; confirmations on destructive;
toasts; skeletons; empty states.

### Business logic / edge cases
Every setting persists + audited. Work-schedule edits affect future attendance reconciliation (not
historical). Holiday recurring applies yearly. Password policy enforced at change/reset/create-user.
Session rules affect refresh-token expiry.

### Permissions
`settings.manage` (Admin). `audit.view` (Admin). HR view-only on settings where relevant.

### Testing
API: each setting persists + audited; holiday CRUD + recurring; audit filter/export; capability gates.
Web: settings forms (autosave/restore); holiday CRUD; audit virtualization + export; axe-core.

### Verification
Edit each setting; confirm audit captures create/approve/correct actions across modules; holiday CRUD
works; working-hours change applies forward. Archive Phase 7.

---

# PHASE 8 — Performance optimisation, accessibility & responsive validation
**Capability:** cross-cutting · **Depends 0–7** · **Reqs R13.* (all), cross-cutting**

### Objectives
A dedicated phase to **resolve all current performance issues without breaking functionality** (owner-
confirmed strict budgets), validate WCAG AA across every screen, and validate responsive behaviour
across 360/768/1024/1440/1920 — fixing broken layouts, overflow, unusable controls, inconsistent
interactions. This is the optimisation + polish pass before security hardening.

### Work
- **Frontend perf:** audit + fix bundle (ensure ≤200KB gz/route First-Load); lazy-load every signed-in
  route; dynamic-import heavy libs (ECharts/calendar/export); memoize hot lists + stable keys; virtualize
  all lists >100 rows; optimistic UI coverage; per-widget error boundaries; skeleton-over-spinner audit;
  `useTransition` for non-urgent state; cleanup listeners/workers/object-URLs on unmount; `next/image`
  everywhere; preload fonts; reserved dims for CLS≤0.1.
- **Backend perf:** eliminate N+1; ensure ≤5 SQL/list (query-count tests on every list endpoint); add
  missing indexes; cursor pagination everywhere; route/config/view cache + OPcache + query cache; queue
  exports/reports/notifications/email; ETag/Cache-Control on safe GETs.
- **A11y audit:** axe-core zero critical/serious across all M1 screens; keyboard walkthrough every flow
  (login, attendance, leave, directory, profile, settings, audit); focus management; visible focus;
  ARIA; reduced-motion; contrast.
- **Responsive audit:** visual + functional review at 360/768/1024/1440/1920; fix overflow, broken
  layouts, unusable controls, table→card transitions, sidebar 3-state at each breakpoint, bottom-nav,
  attendance ≥48px mobile.
- **Real device/browser pass:** Chrome, Firefox, Safari (desktop+mobile); PWA install + offline shell.

### Testing
Lighthouse CI green on every M1 route; bundle analyzer ≤200KB gz; query-count tests ≤5; render-count
tests on hot lists; axe-core clean; Playwright responsive + keyboard flows; web-vitals field collection
on production (Sentry/Vercel Speed Insights) — track p75 toward 7-day target.

### Verification
Every M1 route meets LCP≤2.5/INP≤200/CLS≤0.1/FCP≤1.8; First-Load ≤200KB gz; ≤5 SQL/list; axe-core
clean; responsive at all breakpoints; no broken layouts/overflow/unusable controls. Archive Phase 8.

---

# PHASE 9 — Security hardening & production-readiness audit
**Capability:** cross-cutting · **Depends 0–8**

### Objectives
Security hardening across auth, authorization, input validation, secrets, headers, rate-limiting,
monitoring; production-readiness audit (R10.4/R10.5): Sentry + Pulse fully wired; perf audit vs targets;
breach log; backup/restore drill. The "are we safe + ready" gate before go-live.

### Work
- **Auth/auth security:** refresh-token rotation + reuse-detection verified; SameSite auto-detect verified;
  lockout verified; suspicious-login alerts; force-change gate; session revocation (Reverb); no token in
  localStorage; CSRF on refresh (when cross-domain).
- **Authorization:** capability gates on EVERY endpoint (automated test per endpoint asserting role→
  allow/deny); scope filters (HR team-only corrections/views) verified; no IDOR (user A can't read/edit
  user B's resources beyond policy).
- **Validation/injection:** Zod (web) + Laravel validation (api) on every input; mass-assignment
  protection (fillable); SQL injection (parameterized — verify no raw concatenation); XSS (sanitize
  Tiptap HTML server-side); file-upload validation (type/size); rate-limit login/forgot/reset/exports.
- **Secrets/headers:** no secrets in repo; `.env` per env; HTTPS enforced; HSTS; CSP; X-Frame-Options;
  X-Content-Type-Options; Referrer-Policy; CORS limited to FRONTEND_URL; `cookies` Secure+HttpOnly.
- **Monitoring:** Sentry (errors+perf) Laravel + web DSNs; web-vitals field collection; Laravel Pulse
  (slow queries, endpoints, queue) fully wired + dashboard gated to Admin; alert on error spikes.
- **Backup/restore:** Supabase automated backups + PITR verified; restore drill on staging data;
  Railway redeploy + Vercel instant rollback rehearsed.
- **Audit completeness:** confirm `AuditService` captures create/approve/correct/delete/deactivate/
  role-change/reset-password across all M1 modules.

### Testing
Automated authz matrix test (role × endpoint → expected status); OWASP top-10 checklist; secret-scan
(gitleaks) in CI; dependency audit (npm audit / composer audit); header assertions in tests; backup
restore drill documented.

### Verification
All security checks pass; Sentry + Pulse live; headers correct; backups restore-verified; rollback
rehearsed; breach log clean. Archive Phase 9.

---

# PHASE 10 — Final deployment, seeding & day-1 production go-live
**Capability:** deployment · **Depends 0–9**

### Objectives
Final clean redeploy (ADR-025) of the fully verified, optimised, secured application to production with
final stable configuration; full real seed; day-1 production go-live checklist; smoke tests pass on the
live app. **M1 SHIP.**

### Work
- Final configuration review: env vars (production), CORS, SANCTUM_STATEFUL, Reverb, Pulse, Sentry,
  Supabase Storage buckets, mail/SMTP (Resend), timezone Asia/Kolkata.
- **Final clean redeploy:** api → Railway (prod), web → Vercel (prod), DB → Supabase (prod). Re-run
  migrations + seed **real data** (`data-prefill-reference.txt`: 1 company, 2 departments, 15
  designations, 13 employees with role-specific passwords + `must_change_password=true`, work schedule,
  holidays).
- **Go-live smoke test (production):**
  - Sign in as karthik/Admin@123 (Super Admin), aravind/Hr@123 (HR), praveen/Dev@123 (Employee);
    force-change password; onboarding.
  - Role-based sidebar (3-state) + screens + capabilities correct per role.
  - Clock in → break → clock out (one-tap, optimistic); heatmap; late/overtime; offline clock + sync.
  - Forgot-clock-out → open-shift flag + HR alert → correction.
  - Employee submits leave → HR approves → attendance days show leave; HR submits → Admin approves.
  - Directory search + visibility rules; profile photo upload (Supabase Storage); device revoke.
  - Settings + holiday CRUD + audit log (Admin).
  - Dashboards render real data + empty states for unshipped modules.
  - Responsive (360/768/1024/1440) + keyboard + axe-core clean on production.
- Monitoring watch: Sentry/Pulse/web-vitals p75 within targets for 7 consecutive days before declaring
  M1 frozen; log any breach with owner + plan.
- Credentials rotation plan documented (rotate when ready — not blocking go-live per ADR-025).

### Verification
Production app fully functional end-to-end; all roles work; attendance + leave workflows reliable;
performance within targets; no unfinished functionality/placeholders/inconsistent UI/missing permissions;
rollback + backup verified. **TRACKER all M1 phases ✅. M1 SHIP — ready for day-to-day production use.**

---

## §3 — Cross-cutting acceptance (EVERY phase)

- **No mock/placeholder data** — real empty states; every control functional (config.yaml HARD RULE).
- **Capability gates** on all endpoints; frontend mirrors backend authorization exactly.
- **Offline Engine** routes writes (where applicable) with per-entity conflict resolution.
- **Performance budgets green** (owner-confirmed strict, CI-gated): bundle ≤200KB gz/route, Lighthouse
  CI (LCP/INP/CLS/FCP), query-count ≤5/list + zero N+1, cursor pagination, virtualization >100 rows,
  skeletons over spinners, optimistic UI + rollback, per-widget error boundaries, axe-core clean.
- **Design system compliance:** brand tokens, Inter+Sora, white/light primary (+dark available),
  per-module accents, vibrant-on-white (ADR-023), logo placement per §10, status badge map consistent,
  components composed only from the FROZEN catalog.
- **Accessibility:** WCAG 2.1 AA, full keyboard, visible focus, ARIA, reduced-motion, ≥44px touch
  (≥48px mobile attendance), axe-core clean.
- **Responsive:** fluid 360→1920, table→cards, 3-state sidebar, bottom nav ≤5, no broken layouts/overflow.
- **Tests + docs** updated every feature; OpenAPI before routes; phase archived on completion.
- **Deployment:** direct-to-production after each verified phase (ADR-025); Supabase backups; rollback path.

## §4 — Resolved decisions log (all owner-confirmed)

> All decisions are AUTHORITATIVE — implement exactly; no further consultation needed.

**Visual identity & branding**
- **Visual intensity (ADR-023):** vibrant-on-white — clean white surfaces; multiple contextual colours
  across icons, sidebar states (active/hover/selected), buttons, badges, status, cards, highlights,
  notifications, interactions; per-module accent colours (Dashboard violet, Attendance emerald, Leave
  amber, Directory pink, Org/Profile blue, Settings slate, Audit rose); gradients reserved for sign-in
  hero, dashboard headers, logo lockups (FROZEN §1 honoured). Intentional, accessible contrast, clear
  hierarchy. Colourful, vibrant, joyful, modern, polished — on a clean white foundation.
- **King mascot:** **logo lockup only — the cartoon king is NEVER a standalone mascot character.** Empty
  states use colourful Lucide icons + animated-logo.mp4 (full-screen/onboarding moments).
- **Empty-state style:** colourful Lucide icon (contextual) + concise copy + optional action;
  animated-logo.mp4 for full-screen/onboarding. No bespoke illustrations needed.
- **Celebration (Q4):** joyful on milestones — subtle confetti/sparkle on genuine milestones (first
  clock-in, leave approved, onboarding done); standard success toast + 0.96→1 scale checkmark on every
  success; restrained on routine saves.

**Sidebar, navigation, layout**
- **Sidebar (ADR-024):** THREE states — Hidden (removed, via hamburger/full-screen Sheet), Collapsed
  (72px, icons + tooltip on hover), Expanded (264px, icons + text). **Collapsed by default.** Smooth
  joyful 220ms transitions with label-fade-before-width, icon cross-fade, section-group child glide,
  accent active states (per-module tint + brand left bar + 600 weight), hover lift, press 0.96, tooltip
  slide-fade, pinned-items section at bottom (dnd reorder), Ctrl+B toggle, keyboard nav, ARIA. Modern,
  lightweight, intuitive, consistent. Supersedes the FROZEN 2-state model.
- **Module colours:** per-module accents (above).
- **Mobile nav:** bottom nav ≤5 (Dashboard, Attendance, [Chat*/Directory by role], Profile + 5th
  adaptive) + hamburger full-screen Sheet. Attendance prominent ≥48px. (*Chat = future module → empty
  state; show allowed items only.)
- **Page headers:** flat white headers with page title + module-coloured icon + primary action +
  optional breadcrumb; gradient band ONLY on dashboards/hero pages.
- **Density:** comfortable default + compact option (persisted per user; tables/lists honour it).
- **Toasts:** top-right (FROZEN R3.12), 4s auto-dismiss, manual X, pause-on-hover, stack motion.
- **A11y:** WCAG 2.1 AA (FROZEN P-A11Y).
- **Command palette:** full Ctrl+K from Phase 3 (navigate, create-new, pin/unpin, theme/density, sidebar
  state, saved view, recent, switch role, quick clock-in/out, logout).

**Attendance & leave (day-to-day)**
- **Work schedule (DR-027 / ATT-Q1):** Mon–Sat, 09:00–18:30, 45-min break, `standard_seconds=31500`.
  Sunday off. Late = clock-in after 09:00 (+grace default 0). Overtime > 31500s.
- **Cross-midnight (ATT-Q2):** entire shift attributed to clock-in date (one row).
- **HR correction scope (HR-CORRECT):** HR corrects **own team only** (`attendance.correct-team`);
  Admin any user (`admin.correct-attendance`); employees can't correct.
- **Correction depth:** edit **events + day summary** (add/remove/adjust event times, set status, add
  missing clock-out) — full `attendance_corrections` audit + re-reconcile.
- **Forgot-clock-out:** flag open shift (`has_open_shift=true` + amber pulse) + HR/Admin alert → manual
  correction (add clock-out + reason). **No auto-clock-out.**
- **Leave types (LEAVE-Q1 / DR-028):** casual, sick, earned, unpaid. No comp-off at M1.
- **Leave balances (DR-028):** **none at M1** — requests + approvals + history + attendance integration
  only; employee sees "N casual days this month" from history.
- **Holiday calendar (DR-028):** seed (standard Indian public + company holidays) + view in Phase 6;
  CRUD in Phase 7.

**Auth, security, data**
- **Password policy (DR):** strong default — min 8, upper+lower+number+symbol, ≠ current. Configurable
  later (Phase 7). Seed passwords (Admin@123/Hr@123/Dev@123) all pass.
- **Session (DR-026):** access token 15min in-memory; refresh token 7-day sliding (HttpOnly cookie);
  SameSite auto-detect (Strict if same registrable domain, else None + CSRF); rotation + reuse-detection;
  remote logout via Reverb.
- **Directory visibility (DR):** name/designation/dept/avatar always; phone/email/mobile visible only if
  owner opted-in (`profile_visibility`); blood group/emergency/alternate-mobile NEVER in directory
  (Admin-only via user edit).
- **File storage (DR-029):** Supabase Storage (profile photos, allowed image attachments); `next/image`.
- **Timezone (DR-030):** single company timezone Asia/Kolkata (UTC stored, converted for display/
  day-boundary/late).
- **Realtime:** per phase as specified (Phase 5 attendance presence + reconcile push; Phase 6 approval
  + notification push; chat is a future module). Reverb wired Phase 3.

**Performance, offline, PWA, deploy**
- **Performance (strict, CI-gated):** all FROZEN P-* budgets enforced as CI gates; resolve all current
  perf issues without breaking functionality; regression fails build.
- **Offline:** full Offline Engine (ADR-010) — attendance clock-in/out/break offline (client_id +
  Server-Validation sync), leave submit queues, forms queue, offline banner, cached navigation.
- **PWA:** installable (manifest + service worker offline shell), **no push at M1.**
- **Environments (ADR-025):** direct-to-production after each verified phase (no staging env to maintain);
  Vercel/Railway/Supabase/GitHub already connected, credentials retained; final clean redeploy at go-live;
  credentials rotatable later.
- **M1 scope (ADR-022):** Base + Attendance + Leave ONLY. Projects/Tasks, Chat, Announcements, Reports
  → `plan-future-modules.md` (separate file, later milestone). Their dashboard widgets show true empty states.
- **Stack versions:** keep Laravel 13 / PHP 8.4 / Next 16.3.0 (installed); update ADR-003/004 notes; no downgrade.

---

### End of plan.md
**Execute strictly one phase at a time; each phase fully implemented + tested + verified + optimised +
deployed to production (ADR-025) + archived before the next. The Base Application Module is complete
after Phase 4; the Attendance Module (with Leave integration) is functionally complete after Phase 6;
Phases 7–10 harden, optimise, secure, and ship M1 for day-to-day production use. No ad-hoc decisions,
no placeholders, no skipped requirements, no missing permissions.**

**Future modules (Projects/Tasks, Chat, Announcements, full Reporting) are planned in
`plan-future-modules.md` for a later milestone — not part of this M1 plan.**
