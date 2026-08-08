# Design — system-settings

## Data model (new tables)
- `company_profile` (singleton — enforced one row by app logic + a unique guard):
  `id`, `name`, `short_name`, `logo_url`, `timezone` (IANA, e.g. `Asia/Kolkata`), `branding` (json: accent colors, custom copy overrides), `updated_by` (fk users), timestamps.
- `settings` (generic key/value, one row per `(category, key)`):
  `id`, `category` enum(company, working-hours, policies, sessions, notifications, reminders), `key`, `value` (json), `updated_by`, timestamps. Read-through cached (long TTL; invalidated on write).
- `working_schedules` — **already created in Phase 5** (per-weekday start/end/break). Phase 10 exposes the Admin UI + validation on top of it; no new table.
- `holidays` — **already created in Phase 6** (name, date, description). Phase 10 adds Admin CRUD (Phases 5/6 read it read-only).
- `audit_logs` (central — **unifies any per-phase audit tables** written earlier, e.g. attendance/login audit rows):
  `id`, `user_id` (fk, nullable for system actions), `action` (string: `*.create`, `*.update`, `*.approve`, `*.reject`, `*.delete`, `auth.login`, …), `subject_type` (morph map alias), `subject_id` (bigint nullable), `before` (json nullable), `after` (json nullable), `ip` (nullable), `meta` (json: route, role, device), `at` (timestamp tz), index on `(subject_type, subject_id)`, `(user_id, at)`, `(action, at)`.
  > Migration includes a data-move step that ports earlier per-module audit rows into `audit_logs` and drops/aliases the old tables.

## API (OpenAPI additions)
- `GET /company/profile` · `PUT /company/profile` → `{ name, short_name, logo_url, timezone, branding }` (logo upload via `POST /company/logo` → returns `logo_url`).
- `GET /settings/{category}` · `PUT /settings/{category}` → bulk get/set the keys for a category (returns the merged category object).
- `GET|POST|PUT|DELETE /holidays` → standard master-data CRUD (R2.9 pattern).
- `GET /audit-logs?user=&action=&subject_type=&from=&to=&page=&per_page=` → paginated, filterable; `GET /audit-logs/export?...&format=xlsx|pdf` → streamed file.
- All guarded by Sanctum + `require-capability`.

## Settings categories
- `company` — mirrors the singleton for convenience (timezone display format, locale stub).
- `working-hours` — grace period, overtime threshold, weekend flags (per-weekday rows live in `working_schedules`).
- `policies` — `password.min_length` (default 8), `password.expiry_days` (default null = never), `password.history` (prevent reuse count).
- `sessions` — `session.timeout_minutes`, `session.max_devices_per_user`.
- `notifications` — per-event toggles + high-priority/global flags consumed by Phase 8.
- `reminders` — `attendance.shift_reminder_lead_min` (default 15), `attendance.late_alert_after_min` (default 30), task due-reminder offsets.

## Audit log capture (central activity logger)
- Implementation via a central activity logger — prefer `spatie/laravel-activitylog` (or an equivalent custom logger if a dep is unwanted) writing to `audit_logs`.
- Wire module **events** to the logger so create/approve/delete across modules flow through one place:
  - Org (Phase 2): user/dept/designation create/update/delete; password reset.
  - Auth (Phase 1): login success/failure, lockout, suspicious, remote revoke.
  - Attendance (Phase 5): manual correction.
  - Leave (Phase 6): submit/approve/reject.
  - Projects/Tasks (Phase 7): create/assign/submit/approve/redo/archive/delete.
  - Settings (Phase 10): every `PUT /settings/*` and `PUT /company/profile`, holiday CRUD.
- Each logged row computes a `before`/`after` diff from the model (the logger's diff helper). IP + actor come from the request/session. System/scheduler actions set `user_id = null` with `meta.source = 'system'`.
- Audit reads are pull-based + cached (short TTL); the viewer is read-only — no editing/deleting of audit rows.

## Monitoring
- **Sentry Laravel SDK** in `apps/api`: DSN via env, `release` tag = git SHA, `traces_sample_rate` tuned, before-send scrub of secrets; breadcrumbs for auth + queue jobs.
- **Sentry browser SDK** in `apps/web` (Next.js): release-tagged build, source maps uploaded on Vercel deploy.
- **Laravel Pulse** dashboard behind Admin capability; records slow requests, slow queries, slow jobs, exceptions, queue usage. Pulse stores its own tables (ignore for the unified audit story — Pulse = perf, `audit_logs` = business actions).

## Performance audit checklist (vs §19/§11.5)
- **Bundle analysis**: run the analyzer; flag any chunk over budget; ensure a separate vendor bundle.
- **Code-splitting / lazy routes**: confirm each area route is lazy-loaded; verify the initial JS payload target (60–90% cut).
- **Virtualization**: confirm employees, attendance logs, tasks, notifications, reports lists are virtualized (R11.5).
- **ECharts**: code-split the chart bundle; load per-widget on demand.
- **Backend**: re-check eager loading (no N+1), indexes on hot tables, route/config cache + OPcache on prod, paginate large queries.
- **Delivery**: CDN + HTTP/2, font preloads, image optimization (incl. the new logo upload), service worker precache.
- **Measure**: Lighthouse run on key routes (sign-in, dashboards, attendance, tasks, reports, audit log) — record scores; Core Web Vitals (LCP, INP, CLS) within targets. Fix any regression before freeze.
- **Targets**: initial UI <1s, navigation instant, input <100ms, 60 FPS practical.

## Capabilities (introduced)
- `admin.settings.manage` — company profile, settings get/set, holiday CRUD, working-hours config.
- `admin.audit.view` — read + export the audit log.
- (Monitoring dashboards — Sentry/Pulse — are operator-controlled outside the app capability matrix; the in-app Pulse route is gated by `admin.settings.manage`.)

## Realtime
No new broadcast channels. Settings writes invalidate the read-through cache; clients refetch via TanStack Query (stale-while-revalidate). The Pulse/Sentry backends are external.

## Offline / sync
Settings/audit/monitoring are Admin-only, low-frequency, and configuration-critical — they require connectivity (no offline write queue). The Offline Engine conflict strategy for `settings` remains **Last Write Wins** (project §9). The audit-log viewer works offline against cached pages (read-only); exports require connectivity.

## Test strategy
- API feature tests: company-profile singleton get/put + logo upload; settings get/set per category; holiday CRUD; audit-log capture on create/approve/delete (assert before/after diff, actor, IP); audit-log filter + export (xlsx/pdf non-empty); policy enforcement (password min length + expiry forces change; session timeout/device limit revokes sessions); reminder-time config drives scheduler offset.
- Web tests: company-profile form (logo upload w/ format+size limits), working-hours editor, holiday calendar manager, policy/session/notification/reminder settings forms (save-as-draft + autosave), audit-log viewer (filter chips, pagination, export button), capability gate denies non-admin.
- Perf: Lighthouse + CWV run captured as a build artifact; assert no regression vs recorded baseline.

## Performance Requirements (Phase 10)
- **Audit log scalability** — `audit_logs` grows unbounded over time. The viewer MUST be virtualized (`@tanstack/react-virtual`, ≤ visible+overscan DOM nodes, 60 FPS at 5000 rows) and cursor-paginated (never OFFSET) on every filter path (R13.6/14). Composite indexes on `(subject_type, subject_id, at)`, `(user_id, at)`, and `(at)` cover the filter combinations; every WHERE/ORDER BY column is indexed (R13.6). `GET /audit-logs` MUST execute ≤ 5 SQL queries regardless of row count with zero N+1 (R13.5). The filter bar MUST debounce server-side search at 250ms and update URL+cache in place, no reload (R13.15). Audit-log export (`/audit-logs/export`) is heavy work that MUST be offloaded to a Laravel queue and streamed back, never run inline in the request (R13.17).
- **Non-blocking audit capture** — the central activity logger writes to `audit_logs` asynchronously/queued so the audited operation (create/approve/delete across modules) is never slowed by audit persistence; a failed audit write logs to Sentry/Pulse but MUST NOT fail the user's operation (R13.17).
- **Cached settings** — `settings` and the `company_profile` singleton are read-through cached server-side (they change rarely); writes invalidate the cache. Client-side TanStack Query uses `staleTime` 1h for static config entities with mutation cache-key busting on save (R13.10).
- **Cached calendar/working hours** — the holiday calendar and working-hours config are cached (static reference data) and reused by the Attendance reminder scheduler and reports without refetch on each use (R13.10).
- **Company logo** — uploaded logo is optimized/sized at upload and rendered everywhere via `next/image` (WebP/AVIF, responsive, lazy, blur placeholder) (R13.9).
- **M1 performance freeze gate** (R13.28/29) — this phase OWNS the final verification: confirm ALL primary routes meet field p75 LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1 for 7 consecutive days; First-Load JS ≤ 200KB gz per route (bundle budget); zero N+1 across all modules (≤ 5 SQL per list request); Sentry (errors+perf) + Laravel Pulse + field web-vitals all live in production; Lighthouse CI green on all primary routes; and every entry in the TRACKER breach log is resolved or carries a documented plan. M1 freeze is not declared until this gate passes.
Frequent workflows: **change a setting** (one sectioned form, save invalidates cache + stale-while-revalidate), **view audit log** (open virtualized list + apply filter chips), **export audit log** (queued job → downloaded file).

## Component mapping (Phase 10 — composes only from openspec/COMPONENT-SYSTEM.md)
> Phase 10 reuses the master-data + sectioned-forms pattern; every screen composes ONLY primitives
> from `openspec/COMPONENT-SYSTEM.md` §1–§8. No new primitives.

- **SettingsTabs** (§7 composite): `Tabs` (§2) — company profile, working hours, holidays,
  policies, sessions, notifications, reminders — each tab renders a `Form` (§1) with save-as-draft +
  autosave; content lazy-mounts per tab.
- **Company profile Form**: `Form` with logo `FileUpload` (§1 popup, mime/size validated) + name
  `Input` + timezone `Select` (+ branding fields); logo optimized at upload, rendered via
  `next/image` everywhere.
- **Working-hours editor** + **holiday calendar management**: holiday calendar = lazy calendar over
  cached reference data with add/edit `Dialog` (§2) (`Form`); working-hours config via sectioned
  `Form` rows.
- **AuditLogTable** (§7 composite = `DataTable`, §3): virtualized (cursor-paginated, never OFFSET),
  `FilterBar` (§5) over user/action/subject/date; export `Button` (§1) → queued job → streamed
  signed download + `Toast` (§6); read-only viewer (no edit/delete of rows).
- **Sentry / Laravel Pulse / Lighthouse wiring**: no UI — infrastructure (SDK + release tags +
  source maps in `apps/web`; Pulse dashboard behind `admin.settings.manage`). Tooling, not a
  component.
- **M1 performance freeze gate verification** (R13.28/29): no specific component — a process gate
  this phase owns (field p75 LCP/INP/CLS, First-Load JS budget, zero N+1, Lighthouse CI green,
  breach log resolved). Declared by measurement, not by a UI element.

## New ADRs
None. Sentry + Pulse are tooling choices (not stable architectural contracts); settings/audit reuse existing stack decisions (ADR-012 Postgres, ADR-015 single-company, ADR-016 monorepo).
