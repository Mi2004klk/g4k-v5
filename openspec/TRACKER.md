# Implementation Tracker — Games4King Workplace OS (M1)

> **Master execution view.** Phases → status → dependencies → milestones → acceptance
> criteria → verification checklist. Updated as work progresses. The granular task list for
> each phase lives in that phase's `tasks.md`; this is the rollup.
>
> Legend: ⬜ not started · 🟡 in progress · ✅ done · ⏸ blocked/deferred.
> Requirement IDs reference `openspec/REQUIREMENTS.md`. Capabilities reference `project.md` §12.

## Lifecycle per phase
`propose` (write proposal/specs/design/tasks) → **review** → `apply` (implement+test) → `deploy` (staging→prod) → `archive` (freeze spec). A phase is ✅ only after archive.

---

## Phase rollup

| # | Phase | Capability | Status | Depends on | Live URL | Spec state |
|---|---|---|---|---|---|---|
| 0 | Foundation & infra | `foundation` | ⬜ | — | _pending_ | planned |
| 1 | Authentication | `authentication` | ⬜ | 0 | _pending_ | planned |
| 2 | Users, roles & org | `org-management` | ⬜ | 0,1 | _pending_ | planned |
| 3 | App shell & design | `app-shell` | ⬜ | 0,2 | _pending_ | planned |
| 4 | Dashboard framework | `dashboards` | ⬜ | 3 | _pending_ | planned |
| 5 | Attendance | `attendance` | ⬜ | 2,3,4 | _pending_ | planned |
| 6 | Leave & approvals | `leave-approvals` | ⬜ | 2,3,8-partial | _pending_ | planned |
| 7 | Projects & tasks | `projects-tasks` | ⬜ | 2,3,4 | _pending_ | planned |
| 8 | Chat & notifications | `communication` | ⬜ | 2,3 | _pending_ | planned |
| 9 | Reports & exports | `reporting` | ⬜ | 5,7 | _pending_ | planned |
| 10 | Settings & audit | `system-settings` | ⬜ | 2,5,7 | _pending_ | planned |

> **Sequencing note (user-confirmed):** build strictly one phase at a time; all 3 role
> screens together within a phase; ship to production before starting the next. Phase 6 needs
> the notification framework, so Phase 8's notification layer is referenced — implemented
> fully in Phase 8 with a minimal stub available earlier if 6 lands first; in our order 8
> follows 7, so 6 reuses the framework once 8 ships (order may flex — tracker reflects reality).

---

## Milestone definition
**M1 SHIP** = all phases 0–10 ✅ (archived), perf targets met (project §10/§19), seeded,
monitored (Sentry+Pulse), deployed to production with rollback + backups verified.

## Per-phase definition of done (applies to every phase)
- [ ] proposal + specs + design + tasks written and reviewed
- [ ] OpenAPI spec written before routes; contract tests green on CI
- [ ] Code implemented with lint + tests passing (real results reported)
- [ ] Capability gates enforced on new endpoints
- [ ] Writes flow through the Offline Engine (where applicable)
- [ ] **Performance budgets green** (see §Cross-cutting): bundle ≤200KB gz/route, Lighthouse CI
      meets route targets (LCP≤2.5/INP≤200/CLS≤0.1), zero N+1, ≤5 SQL/list, lists >100 virtualized,
      no full-screen spinner where skeleton possible, axe-core clean. R13.x applicable items pass.
- [ ] Field web-vitals for new flows within p75 targets for 7 days (staging) before prod promote
- [ ] Seed updated; staging seeded
- [ ] Deployed to staging, smoke-tested, then production
- [ ] Rollback + backup verified
- [ ] Spec archived (frozen) via `/opsx:archive` (includes performance notes)

---

## Phase 0 — Foundation & infra  (`foundation`)  ✅
**Requirements:** none (infra). **Milestone:** live end-to-end pipeline.
**Acceptance:**
- [x] `apps/web` placeholder live on Vercel (https://g4-k-web-two.vercel.app)
- [x] `apps/api` `/health` 200 on Railway / local
- [x] Supabase Postgres reachable; base migrations applied
- [x] GitHub Actions CI green (lint/build/test)
- [x] OpenAPI spec dir + generator pipeline configured
- [x] Sanctum installed; monorepo workspaces work (`packages/ui` resolvable)
- [x] Backups + rollback documented; envs (dev/staging/prod) configured
**Verification:** curl `/health` returns 200; `pnpm build` + `php artisan test` pass; Vercel preview URL loads; Railway deploy log clean.

### Phase 1: Authentication & Sessions [✅ Complete]
**Requirements:** R1.1–R1.13. **Milestone:** all 13 seeded users can sign in across role paths.
**Acceptance:**
- [x] Sign-in screen matches R1.1–R1.3 (logo, welcome, copyright, tooltip, loading, errors)
- [x] Role Selection screen works for dual-role users (e.g. `praveen/employee` vs `karthik/admin`)
- [x] Forgot-password (SMTP path + Admin-approval path) implemented
- [x] Account lockout after 5 attempts/10min; suspicious-login notifies Admin/HR
- [x] Force password change on first login
- [x] Onboarding welcome screen shows upon completion of setup
- [x] Per-device session list; remote logout & current logout functional
- [x] Offline engine queues login attempt and syncs
- [x] Auth-aware routing (frontend route guards + backend capability middleware)

**Verification:**
- [x] Sign in as `karthik` (Admin) and `aravind` (HR) to verify role selection
- [x] Trigger lockout as `praveen`
- [x] Run remote device revocation.

## Phase 2 — Users, roles & org  (`org-management`)  ✅
**Requirements:** R2.1–R2.13. **Milestone:** Admin manages full org in production.
**Acceptance:**
- [x] Capability matrix live + enforced on routes
- [x] Designations master (15 seed designations)
- [x] HR + Employee account CRUD; dept CRUD (Admin only)
- [x] Auto-numbering configurable
- [x] Master-data table pattern reusable
- [x] Employee Directory searchable w/ Send Message
- [x] Profile screens (all roles) w/ photo popup
- [x] Full seed loaded (1 co / 2 depts / 13 employees)
**Verification:** create/edit/deactivate a user; assign dual role; search directory; verify non-admin blocked from user-create endpoint.

## Phase 3 — App shell & design  (`app-shell`)  ✅
**Requirements:** R3.1–R3.16. **Milestone:** polished shell on desktop + mobile.
**Acceptance:**
- [x] Design tokens + brand palette in code
- [x] Light + dark (both colorful); density control
- [x] Top bar + role-aware sidebar + mobile nav + breadcrumbs
- [x] Pinned items engine (stubbed in sidebar)
- [x] Component library in packages/ui (button/card/table/badge/dialog/drawer/tooltip/toast/skeleton/empty/palette/shortcut-overlay)
- [x] Form system (validation/autosave/draft/restore)
- [x] Filter/sort bar; confirmation dialogs; inline editing; dnd reorder; pagination
- [x] Keyboard shortcuts (Ctrl+K/N//, Esc, Enter)
- [x] PWA manifest + service worker
**Verification:** toggle theme; pin an item; submit a form (autosave/restore); open palette; resize to mobile → bottom nav appears.

## Phase 4 — Dashboard framework  (`dashboards`)  ✅
**Requirements:** R4.1–R4.9. **Milestone:** 3 rearrangeable dashboards via Widget Engine.
**Acceptance:**
- [x] Widget engine (drag/resize/collapse/refresh/lazy/offline/realtime; adaptive sizes)
- [x] React Grid Layout per-user rearrange; independent loading; dismissible
- [x] Generic Metric Widget (JSON-fed)
- [x] Admin/HR/Employee dashboards render (module widgets stubbed then plugged in)
- [x] Quick Task Assignment widget wired to later module (stubbed)
**Verification:** rearrange widgets → persists across reload; refresh one widget independently; resize changes adaptive content.

## Phase 5 — Attendance  (`attendance`)  ✅
**Requirements:** R5.1–R5.12. **Milestone:** live attendance + heatmaps + exports.
**Acceptance:**
- [x] Clock in/out + breaks; live timer (continues, amber overtime)
- [x] Heatmap history + per-day summary
- [x] Admin company-wide view; HR today view + weekly/monthly graphs
- [x] Manual correction; overtime + late badge
- [x] Excel export
- [x] Reminder scheduler (15-min before / 30-min after)
- [x] Offline timer + sync (Server-Validation)
**Verification:** clock in, break, clock out; open heatmap; trigger late; export Excel; go offline mid-shift → syncs.

## Phase 6 — Leave & approvals  (`leave-approvals`)  ✅
**Requirements:** R6.1–R6.8. **Milestone:** leave flows + reusable Approval framework.
**Acceptance:**
- [x] Approval state-machine framework
- [x] Employee→HR and HR→Admin leave flows
- [x] History + status badges
- [x] Holiday calendar view
- [x] Approval notifications surface in bell + Notification Center
**Verification:** submit leave as employee → HR approves; submit as HR → Admin approves; check history + notifications.

## Phase 7 — Projects & tasks  (`projects-tasks`)  ✅
**Requirements:** R7.1–R7.18. **Milestone:** full project/task lifecycle with Kanban/Gantt/QA.
**Acceptance:**
- [x] Project CRUD + team auto-access; sort
- [x] Task create/assign/priority/due/scope; dependencies; comments; activity log
- [x] Kanban + list; drag reorder; inline editing
- [x] QA form builder + submission note
- [x] Project work timer
- [x] Recurring tasks
- [x] Quick Task Assignment wires up (Global Chat notify on completion)
- [x] Task + project submission/approval cycle
- [x] Gantt/Timeline view (HR/Admin)
- [x] Project history; personal task list; saved views/custom columns
**Verification:** create project → assign team → add tasks → Kanban drag → submit → approve → history; Gantt renders; recurring task recreates.

## Phase 8 — Chat & notifications  (`communication`)  ✅
**Requirements:** R8.1–R8.15. **Milestone:** 4 chat types + announcements + notes live.
**Acceptance:**
- [x] Global/Project/Direct/Group chats over Reverb
- [x] @mentions; DM read receipts; pin messages; read/unread state
- [x] Image/file sharing (limits); offline queue
- [x] Bell + Notification Center + history
- [x] Announcement board (pin, reactions, dashboard, notify)
- [x] Quick Notes; complaint/feedback channel
- [x] Mobile chat UX
**Verification:** send DM + read receipt; @mention notifies; post announcement → dashboard + bell; create note; offline message queues.

## Phase 9 — Reports & exports  (`reporting`)  ✅
**Requirements:** R9.1–R9.8. **Milestone:** reports + exports + Sunday email.
**Acceptance:**
- [x] Attendance/project/task/productivity reports (Admin; HR limited)
- [x] Excel + PDF export
- [x] Sunday weekly summary email (scheduler)
- [x] Saved views; filters; virtualized
**Verification:** generate each report; export Excel + PDF; trigger Sunday email (scheduler dry-run); verify HR sees limited set.

## Phase 10 — Settings & audit  (`system-settings`)  ✅
**Requirements:** R10.1–R10.5. **Milestone:** M1 freeze-ready.
**Acceptance:**
- [x] Company profile, working hours, holiday calendar, password/session policies, notification prefs, reminder times
- [x] Audit log (filterable, exportable)
- [x] Sentry + Pulse wired
- [ ] Perf audit (Lighthouse/CWV) meets targets
**Verification:** edit each setting; confirm audit captures create/approve actions; Lighthouse run green; production error tracking live.

---

## Cross-cutting trackers
- [x] **Capability matrix** — extended each phase (single source: project §18 + per-phase design)
- [x] **OpenAPI spec** — grown each phase; contract tests on CI
- [x] **Offline Engine** — each phase's writes routed through it
- [x] **Seed data** — grown per phase; full by Phase 2
- [x] **Tests** — feature (Laravel) + component/integration (web) per phase
- [x] **Deployment** — staging per phase; production + rollback on completion
- [x] **Backups** — Supabase automated; restore drill before M1 ship

### Performance & operational-quality tracker (R13 — enforced every phase)
Standards live in `PERFORMANCE-STANDARDS.md`; ADR-018 makes them constitutional. Each phase MUST:
- [x] Add its route(s) to the **bundle budget** (`@next/bundle-analyzer`, First-Load JS ≤200KB gz).
- [x] Pass **Lighthouse CI** on new routes (LCP≤2.5s, INP≤200ms, CLS≤0.1, FCP≤1.8s).
- [x] Add **query-count tests** for new list endpoints (≤5 SQL, zero N+1 via `DB::enableQueryLog`).
- [x] Confirm **indexing** for every new filtered/joined/ordered column (migration checklist).
- [x] **Virtualize** any new list >100 rows; memoize rows; stable keys.
- [x] Add **optimistic UI** for safe mutations; per-widget **error boundaries**; skeletons over spinners.
- [x] Name **frequent workflows** and verify ≤2-click + no-reload targets (esp. Attendance Phase 5).
- [x] Wire **monitoring** (Sentry perf + web-vitals + Pulse) for the new flows.
- [x] Record a **performance-notes** section in the archived spec; log any budget **breach** below with owner + remediation plan.

**Breach log:** _(append date / phase / metric breached / owner / plan / resolved)_ — none yet.

## Cross-cutting requirements R11 — ownership map
These span multiple phases (so no single spec owns them); each is addressed where listed:
- **R11.1** Notification system (alerts/reminders; project/submission under Chat) → Phase 8 (full) + bell in Phase 3.
- **R11.2** Area-specific search (no global search in M1) → Phase 3 (filter/sort bar) + Phase 2 (directory) + Phase 9 (reports).
- **R11.3** File attachments (profile pic/HR images/task links/chat; full upload deferred) → Phase 2 (profile popup), Phase 7 (task submission links), Phase 8 (chat images/files).
- **R11.4** Status badges (Gray/Blue/Amber/Green/Red) → Phase 3 (component) + applied Phases 6/7.
- **R11.5** Virtualization (employees, attendance, tasks, notifications, reports) → Phase 3 (table) + Phases 5/7/8/9.
- **R11.6** Offline banner + queued forms → Phase 3 (shell) + Offline Engine all phases.
- **R11.7** Undo/redo, recently viewed, saved views, custom columns → Phase 3 (undo/recently-viewed) + Phase 7 (saved views/custom columns).
- **R11.8** Bulk actions, multi-select, right-click context menus → Phase 3 (command engine) + applied Phases 5/7.

## Decision log delta (added during planning)
- ADR-012 supersedes ADR-001 (Postgres/Supabase over MySQL).
- ADR-013 supersedes ADR-002 (Reverb over Supabase Realtime).
- ADR-014 Sanctum Bearer tokens. ADR-015 single-company. ADR-016 monorepo. ADR-017 no AI in M1.
- Seed "roles" = designations; 3 system roles only; dual-role → Role Selection; force password change on first login.
