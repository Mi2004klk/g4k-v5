# Phase 10 — System Settings & Audit

## What
Admin system-settings module plus the M1 polish + freeze pass. Company profile (logo, name, timezone), standard working hours, and holiday calendar; configurable password/session/device policies, notification preferences, and reminder times; a central filterable/exportable audit log that records who created/approved/deleted what and when; production monitoring (Sentry + Laravel Pulse); and a performance audit vs the §19/§11.5 targets (Lighthouse + Core Web Vitals) ending in the M1 freeze. Implements R10.1–R10.5.

## Why
M1 is only "shipped" when the admin can configure the org without code changes, every important action is auditable, production is observable, and performance targets are actually measured (never assumed). This phase also unifies any per-phase audit tables written earlier into one central `audit_logs` store, and runs the final bundle/Lighthouse/CWV check that gates the M1 freeze.

## Scope
- Company profile singleton (logo upload + optimization, name, short name, timezone, branding json) — R10.1.
- Standard working-hours config and the holiday calendar CRUD (the calendar is consumed read-only by Phase 5/6) — R10.1.
- Password policies (min length, expiry), session/device rules, notification preferences, and configurable reminder times (attendance shift reminders, etc.) — R10.2.
- Central audit log: capture create/approve/delete (and other important actions) with who/what/when + before/after diffs across modules; filterable + exportable — R10.3.
- Production monitoring: Sentry (Laravel) + Laravel Pulse wired for production — R10.4.
- Performance audit vs targets (§19/§11.5): bundle analysis, code-splitting/lazy-route verification, virtualization check, ECharts/code-split, Lighthouse ≥ targets, Core Web Vitals — R10.5.
- M1 final polish + freeze-ready pass (fix regressions; confirm rollback + backups).

## Non-goals
- Multi-company / multi-tenant scoping (ADR-015 = single company).
- New realtime channels beyond what prior phases broadcast (audit log reads are pull-based + cached).
- Mobile client performance audit (web-only M1; Tauri/Android are later milestones).
- Re-authoring the capability matrix content (extended in Phase 2 and per-phase since).
- AI-driven insights or anomaly detection beyond Sentry's defaults.

## Phase / capability
Phase 10 of 11 (FINAL) · capability `system-settings` · depends on Phase 2 (org/seed), Phase 5 (working schedules + attendance reminders consume these settings), Phase 7 (task/project create/approve feed the audit log). Implements R10.1–R10.5. This phase carries the M1 polish + freeze milestone.

## ADRs
Depends on ADR-012 (PostgreSQL/Supabase), ADR-015 (single-company), ADR-016 (monorepo). No new ADR — settings/audit/monitoring use existing stack choices (Sentry + Pulse are tooling, not stable architectural contracts).
