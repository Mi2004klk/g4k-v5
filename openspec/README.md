# OpenSpec — Games4King Workplace OS

> **Single source of truth.** Read this first. The original standalone docs have been removed;
> everything lives in OpenSpec now to prevent mid-build confusion.

## Read order
1. **`project.md`** — Core Platform spec: product, roles, stack, principles (incl. performance-first),
   contracts (incl. performance contracts), engines, offline rules, design system, ADRs (incl.
   ADR-018 performance-first), Performance Constitution (§10.5).
2. **`PERFORMANCE-STANDARDS.md`** — FROZEN: 30 measurable performance standards (P-*) with
   acceptance criteria, enforced in CI. The performance source of truth.
3. **`DESIGN-SYSTEM.md`** + **`COMPONENT-SYSTEM.md`** — FROZEN design system (tokens, motion,
   sidebar, logo, widgets, states, interaction perf) AND the FROZEN Radix+shadcn component
   catalog (every primitive, variants/states, when-to-use, a11y, keyboard, responsive, and the
   component→workflow mapping that every screen composes from).
4. **`REQUIREMENTS.md`** — every functional requirement with a stable ID (R1.x … R13.x, where R13 =
   performance & operational quality), grouped by module.
5. **`TRACKER.md`** — master implementation tracker: phases, status, dependencies, milestones,
   acceptance criteria, verification checklists, performance Definition-of-Done + CI budgets tracker.
6. **`GUIDE-CREDENTIALS.md`** — what credentials to gather so I can manage all services.
7. **`VERIFICATION.md`** — coverage audit (functional + architecture + performance).
8. **`changes/phase-XX-*/`** — one folder per build phase; each has `proposal.md`,
   `specs/<capability>/spec.md`, `design.md` (incl. `## Performance Requirements`), `tasks.md`.
9. **`specs/`** — frozen (archived) main specs, grown as each phase completes.

## Build model
- **One phase at a time**, all three role screens (Admin/HR/Employee) together within a phase.
- Each phase ships to production before the next begins.
- Lifecycle per phase: `/opsx:propose` (done here) → review → `/opsx:apply` (implement+test) →
  deploy (staging→prod) → `/opsx:archive` (freeze spec into `specs/`).

## The 11 phases
| # | Phase | Capability | Depends on |
|---|---|---|---|
| 0 | Foundation & infra | `foundation` | — |
| 1 | Authentication & sessions | `authentication` | 0 |
| 2 | Users, roles & org | `org-management` | 0,1 |
| 3 | App shell & design system | `app-shell` | 0,2 |
| 4 | Dashboard framework & widgets | `dashboards` | 3 |
| 5 | Attendance | `attendance` | 2,3,4 |
| 6 | Leave & approvals | `leave-approvals` | 2,3 |
| 7 | Projects & tasks | `projects-tasks` | 2,3,4 |
| 8 | Chat & notifications | `communication` | 2,3 |
| 9 | Reports & exports | `reporting` | 5,7 |
| 10 | System settings & audit (M1 freeze) | `system-settings` | 2,5,7 |

## Commands (ZCode)
- `/opsx:propose` — create/extend a change's artifacts
- `/opsx:apply` — implement the tasks of a change
- `/opsx:archive` — freeze a completed change into the main specs
- `openspec validate --all` — validate every change + spec
- `openspec list --specs` / `openspec list` (changes) — see status
- `openspec view` — interactive dashboard

## Working on a phase
1. Open `TRACKER.md`, find the next ⬜ phase.
2. Open its `changes/phase-XX-*/tasks.md`.
3. `/opsx:apply` (or implement tasks directly), writing OpenAPI before any route, tests per task.
4. Deploy staging → smoke test → production.
5. `/opsx:archive` to freeze; mark the phase ✅ in `TRACKER.md`.
