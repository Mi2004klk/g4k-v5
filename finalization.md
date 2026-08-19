# Finalization — Production Readiness Audit & Implementation Plan

**Audit date:** 2026-08-19 (zero-trust, code-first; nothing carried over unverified). **Second pass (same day):** complete end-to-end walk of every page, tab, form, component, controller, route, job, and rule — documented in `workflow.md`; all deltas folded in here.
**Scope:** Full codebase — `apps/web` (Next.js 16), `apps/api` (Laravel), `packages/ui`, CI, deployment configs — re-audited against the owner's product spec (Sections 1–9) and the 2026-08-18 audit findings.
**Companion:** `workflow.md` = the complete client-facing workflow map (every page, form, rule, and E2E flow). This document = what is broken, what is missing, and the exact plan to finish.

---

## 1. TL;DR

The platform is **close to production-ready**. Every one of the **11 P0 defects from the 2026-08-18 audit is now FIXED and verified in code** — dead routes now redirect, the audit table renders, attendance export works, project review no longer 500s on PostgreSQL, department/designation/chat-group gating matches the backend, and the demo-data jobs no longer crash.

What remains before day-to-day production use:

- **1 new P0** — QA form fields render with the wrong controls (checkbox/slider/select/etc. all degrade to text inputs) because of a frontend/backend key mismatch. QA-gated submission is a core spec workflow; must fix before launch.
- **15 P1s** — 2 authorization gaps (any logged-in user can edit the company profile or create/delete department teams), phantom API calls, silent 20-row dropdown truncation, one-way filters, a lost timer on reload, Gantt drag doing nothing, an unguarded `JSON.parse` that can crash the Settings page, an unencoded search string, **1 failing frontend test** masking CI signal, the localhost reset-link config gap, a 45-minute overtime-threshold mismatch, **the Open Shifts console rendered unreachable** (second-pass finding), and the 100-task Kanban/Gantt cap.
- **~10 P2s** — dead code, unused backend features (QA form edit/delete, mark-unread), quick-notes not in palette/sidebar, widget-hide dead end, export history capped at 3.
- **Toolchain:** typecheck ✅ clean, production build ✅ 28 routes, tests ❌ 1 failure, eslint ⚠️ 218 errors / 76 warnings **and still not in CI**.
- **Deployment:** worker + scheduler + queue are properly supervised; APP_KEY set; S3/Reverb/mail configured; CI covers typecheck/test/build/bundle/OpenAPI/pgsql — only the eslint gate and the `frontend_url` config wire-up are missing.

Estimated effort to green: **1–2 focused days** (Phase A below), plus a half-day hardening pass (Phase B) and an optional polish pass (Phase C).

---

## 2. Verification Baseline (run this audit, this machine, 2026-08-19)

| Check | Command | Result |
|---|---|---|
| TypeScript | `tsc --noEmit` (apps/web) | ✅ 0 errors |
| Unit tests (web) | `vitest run` | ❌ **1 failed** / 34 passed / 2 skipped — `directory.test.tsx` |
| Production build | `next build` | ✅ compiles, 28 routes, middleware active as proxy |
| ESLint | `eslint src` | ⚠️ 294 problems (218 errors, 76 warnings) |
| ESLint in CI | `.github/workflows/ci.yml` | ❌ not present (only OpenAPI lint) |
| API tests | CI pgsql matrix | ✅ covered in CI (sqlite locally) |
| Scheduler/jobs | `routes/console.php` + `start-worker.sh` | ✅ all jobs scheduled; worker supervised |
| APP_KEY / S3 / Reverb / queue | `.env`, `.env.production` | ✅ set (`QUEUE_CONNECTION=database`, `FILESYSTEM_DISK=s3`, `BROADCAST_CONNECTION=pusher`) |

---

## 3. Prior P0 Re-verification — ALL 11 FIXED ✅

| # | 2026-08-18 finding | Verdict | Evidence |
|---|---|---|---|
| 1 | `/dashboard/org/users` deleted page → 404 from 5 links | ✅ FIXED | `org/users/page.tsx` now redirects to `/dashboard/directory?tab=management`; `admin/attendance` + `admin/reports` pages redirect too; dead-link sweep across all `/dashboard/*` hrefs found **zero** dead targets |
| 2 | `/dashboard/admin/attendance` + `admin/reports` 404 | ✅ FIXED | redirect stubs exist; inbound links work |
| 3 | Audit table permanently empty + export 405 | ✅ FIXED | `audit-log-table.tsx:67-68` unwraps `logsData?.data` / `last_page` (matches paginator); export uses GET (`api.php:293`) |
| 4 | Attendance export fatal (`userHasManage` undefined) | ✅ FIXED | `AttendanceController.php:972` defines it |
| 5 | Project submit/review 500 on pgsql (`whereIn('role')`) | ✅ FIXED | `ProjectController.php:236,276` now `whereHas('roleAssignments',…)` |
| 6 | HR shown dept/designation admin UI that always 403s | ✅ FIXED | `departments-tab.tsx:109` / `designations-tab.tsx:91` gate on `departments.manage` / `designations.manage` |
| 7 | Group chat creation 403 (unseeded `chat.group`) | ✅ FIXED | route now `capability:chat.manage` (`api.php:237`); phantom re-check removed |
| 8 | `admin.view-reports` phantom capability gate | ✅ FIXED | `reports/page.tsx:11` uses `reports.view \|\| reports.manage` |
| 9 | Employee company card 403 (`/company-profile`) | ✅ FIXED | `profile-general-tab.tsx:56` fetches ungated `/companies` |
| 10 | Holidays "View All" → unauthorized for employees | ✅ FIXED | widget links to `/dashboard/attendance?tab=leave` |
| 11 | Demo seed/purge notification TypeError | ✅ FIXED | jobs call `sendGlobalNotification($user, $body, $link)` — no string-as-array arg |

---

## 4. New & Outstanding Findings

### P0 — breaks a core workflow today

**FIN-P0-1. QA form fields render wrong controls (field-type key mismatch).**
`qa-form-viewer.tsx:92` passes raw backend fields to `QAFieldRenderer`, and the backend stores/returns `field_type` (`QaController.php:24,42`; `qa-form-builder.tsx:195` sends `field_type`), but `qa-field-renderer.tsx` switches exclusively on `field.type` (lines 17–126). Result: every `checkbox`, `boolean`, `multiple_choice`, `select`, `slider`, `date`, and `file_upload` QA field degrades to a plain text input — employees "type" checkbox answers. Required-field enforcement still works, but the QA experience (a spec-critical flow: "QA form to be filled on submission") is broken for every non-text field.
**Fix (small):** in `qa-form-viewer.tsx` map fields once: `fields.push({ ...f, type: f.field_type })` (and same in `qa-form-preview.tsx` if needed), **or** make the renderer read `field.field_type ?? field.type`. Add a vitest covering a checkbox + select field render.

### P1 — broken interactions, security gaps, contract mismatches

**FIN-P1-1. [SECURITY] Company profile writable by any authenticated user.**
`api.php:70-71` — `POST /companies` and `PUT /companies/{id}` sit **outside** any capability middleware, and `CompanyProfileController::update` (line 23) has no internal check. Any employee can rename the company, change its timezone, or swap the logo. (The UI uses the gated `/company-profile` variants — this is the ungated alias.)
**Fix:** wrap both routes in `capability:settings.manage`.

**FIN-P1-2. [SECURITY] Department teams writable by any authenticated user.**
`api.php:322-324` — `POST /departments/{id}/teams` and `DELETE /departments/{id}/teams/{teamId}` are outside the `departments.manage` group; `DepartmentController::storeTeam/destroyTeam` (lines 150, 169) have no internal check. Any employee can create/delete teams.
**Fix:** move both routes inside the `departments.manage` group.

**FIN-P1-3. Phantom analytics endpoints still called.**
`admin-attendance-analytics.tsx:24` (`GET /attendance/admin/analytics`) and `hr-attendance-analytics.tsx:31` (`GET /attendance/hr/analytics`) — neither route exists (`routes/api.php` has only `admin/overview`, `admin/graph`, `hr/today`, `hr/graph`). Every console load burns a 404 round-trip, then falls back to `overview`/`hr/today?per_page=1000` (stats silently wrong beyond 1,000 rows).
**Fix:** implement the two endpoints (they're just aggregates of existing queries) **or** delete the phantom calls and compute from the graph/overview data.

**FIN-P1-4. `limit=` silently ignored → dropdowns truncated at 20 rows.**
Backend accepts only `per_page` (whitelist 20/50/100) on `/users`, `/departments`, `/designations` (`UserController.php:69`, `DepartmentController.php:39`, `DesignationController.php:36`). Still calling `limit=`: `quick-task-widget.tsx:28` (`/users?limit=50`), `directory-tab.tsx:84,90` (`limit=100` ×2), `directory-list.tsx:204` (`limit=100`).
**Fix:** replace `limit=` with `per_page=` (100); longer-term raise the whitelist or add infinite scroll.

**FIN-P1-5. One-way filters (no "All" reset option).**
- `approvals-tab.tsx:203-210` — status options Pending/Approved/Rejected only; default is `pending`, so there is no way back to "all".
- `notifications-tab.tsx:249-255` — read-status filter offers only "Unread".
- Attendance tables (hr/admin) — department selects have no "All departments" entry (state defaults to `all`, option list doesn't).
**Fix:** prepend `{ label: "All", value: "all" }` to each options list.

**FIN-P1-6. Project timer lost on page reload.**
`stores/timer-store.ts:213` sets `skipHydration: true` and `providers.tsx:20-21` rehydrates only the auth + UI stores — a running header timer resets on refresh even though the record survives in localStorage.
**Fix:** call `useTimerStore.persist.rehydrate()` in Providers (guard against hydration mismatches), and reconcile against `/attendance/me/today` on load.

**FIN-P1-7. Gantt drag is a silent no-op.**
`task-gantt.tsx:51` invokes `onTaskUpdate?.(task, {start, end})`, but `tasks-tab.tsx:750` passes only `onTaskSelect` — dragging a bar updates nothing (and the Gantt re-instantiates on refetch, resetting scroll).
**Fix:** pass an `onTaskUpdate` that PUTs `{due_date}`/dates via the task update mutation (optimistic + rollback), or disable drag explicitly until supported.

**FIN-P1-8. Unguarded `JSON.parse` can crash the Settings page.**
`system-jobs-config.tsx:74` — `JSON.parse(job.payload).displayName` with no try/catch; one malformed payload renders the whole System Jobs tab unmountable.
**Fix:** wrap in a safe-parse helper returning `{}`.

**FIN-P1-9. Unencoded search string in attendance admin table.**
`admin-attendance-table.tsx:114` — `&search=${debouncedSearch}` interpolated raw; `&`, `#`, or spaces corrupt the query string.
**Fix:** `encodeURIComponent(debouncedSearch)` (and audit siblings for the same pattern).

**FIN-P1-10. Failing test: `directory.test.tsx` — mock missing `ContentSkeleton`.**
The `@g4k/ui/components` vi.mock doesn't export `ContentSkeleton`, which `designations-tab.tsx:347` now renders → "No ContentSkeleton export is defined on the mock". Suite is red, masking real regressions.
**Fix:** add `ContentSkeleton: () => <div data-testid="skeleton" />` to the mock (and audit the mock for other newer exports).

**FIN-P1-11. Admin-approved password reset links point at localhost.**
`AdminPasswordResetController.php:43` uses `config('app.frontend_url', 'http://localhost:3000')`, but **`config/app.php` never defines `frontend_url`** — the `FRONTEND_URL` value present in both `.env` files is never wired in. (`PasswordResetMail.php:31` falls back to `app.url`, which may differ from the real web origin.)
**Fix:** add `'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000'))` to `config/app.php`.

**FIN-P1-12. Overtime threshold differs 45 minutes between timer widgets.**
`timer-store.ts:43` defaults the standard day to 28,800s (8h) while `time-clock-widget.tsx:35` defaults 31,500s (8h45m). Before schedules load, the header project timer flags "overtime" 45 minutes earlier than the time clock.
**Fix:** single shared constant (31,500 or fetched schedule) imported by both.

*(Findings FIN-P1-13 … P1-15 added by the second full end-to-end pass on 2026-08-19 — every page, form, controller, and route walked.)*

**FIN-P1-13. Open Shifts console unreachable (orphaned component).**
`admin-attendance-view.tsx:11` imports `AdminOpenShiftsTable` but never renders it — the admin console was reworked to 3 tabs (Calendar / Overview / Analytics & Trends) and the **Open Shifts tab was dropped**. The `FlagOpenShifts` scheduler still runs and notifies, and the table's tests still pass, but the UI to bulk-"Notify Open Shifts" and to start per-row open-shift corrections no longer exists anywhere. (`/attendance/team-today`'s consumer `team-attendance-widget.tsx` also remains dead — see P2-7.)
**Fix:** render `AdminOpenShiftsTable` as a fourth "Open Shifts" tab in `AdminAttendanceView` (or embed it under the Overview tab).

**FIN-P1-14. Kanban and Gantt views cap at the first 100 tasks.**
`tasks-tab.tsx:102-103` — in kanban/gantt/qa views the query always requests `page=1&per_page=100`; with more than 100 tasks in scope the board silently hides the rest (and Gantt re-instantiates from the same capped set).
**Fix:** load-all loop (follow `last_page`) or infinite fetch for board/gantt scopes; at minimum surface a "showing first 100" notice.

**FIN-P1-15. HR analytics cards show wrong-company math beyond 1,000 rows (fallback path).**
Consequence of FIN-P1-3: when the phantom `/attendance/hr/analytics` 404s, `hr-attendance-analytics.tsx` falls back to `/attendance/hr/today?per_page=1000` and computes counts client-side — beyond 1,000 team rows the present/absent/late/leave cards silently miscount. Fixing P1-3 (real endpoints) fixes this too.

### P2 — missing wiring, dead code, spec gaps

| ID | Finding | Evidence / Fix |
|---|---|---|
| FIN-P2-1 | Widget hide (×) dead: `dismissWidget` action exists (`ui-store.ts:81`) but **zero callers**; Profile → Preferences "Hidden Widgets" manager is permanently empty | Add dismiss button to widget chrome calling `dismissWidget`; manager already restores |
| FIN-P2-2 | QA form builder is create-only — backend `PUT/DELETE /qa-forms/{id}` unused; no edit/delete UI | Add row actions in builder list (edit preloads fields, delete confirms) |
| FIN-P2-3 | `POST /notifications/{id}/mark-unread` — no UI anywhere | Add "mark unread" to notification center rows |
| FIN-P2-4 | Quick Notes only reachable as dashboard widget — spec wants sidebar/command-palette access | Add palette command + optional sidebar section |
| FIN-P2-5 | Task pin highlight param dropped: `/dashboard/tasks?highlight={id}` redirect to `/dashboard/projects?tab=tasks` loses `highlight` | Forward the param; scroll+flash the task row |
| FIN-P2-6 | Export History capped `slice(0, 3)` with no "View all" (`export-history.tsx:93`) | Paginate or link to full list |
| FIN-P2-7 | Dead files: `team-attendance-widget.tsx`, `widgets/feedback-form.tsx` (broken duplicate of the working profile form), `hooks/use-worker.ts`, `lib/tabs-sync.ts` (0 bytes), `web-vitals.tsx` (commented body), `tasks-tab.tsx.bak` | Delete |
| FIN-P2-8 | `/dashboard/init` prefetch unwraps wrongly: `.then(r => r.data)` but the endpoint returns the composite object directly (`dashboard/layout.tsx:133`) — prefetch poisons cache with `undefined` | Drop `.data` or remove prefetch (the real query refetches anyway) |
| FIN-P2-9 | Inline editing only on tasks (title/due date). Spec wants project + department names too | Extract the task inline-edit into a reusable `InlineEditText` and adopt on project card title + department row |
| FIN-P2-10 | Save-as-Draft only on 3 forms (leave request w/ 30s IndexedDB autosave + restore banner, project create, user create). Spec: "all forms except quick actions" + 30s autosave + restore banner | Generalize the leave-form draft hook; apply to task create, announcement compose, group create |
| FIN-P2-11 | Gantt has no task-milestone diamonds (spec §7); dependencies do render | Add marker config when a task has `blocked_by` or is flagged milestone |
| FIN-P2-12 | Employee-profile pinning absent (spec: pin "every project, task, and employee profile"); pins only projects+tasks | Extend `PinController` type + a pin button on user detail |
| FIN-P2-13 | eslint (218 errors) not in CI; `pnpm lint` script still broken | Fix script, add `eslint --max-warnings 0` gate after triage |
| FIN-P2-14 | `GET /dashboard/metrics` endpoint dead (never called); `GET /attendance/sync` (bulk offline reconciliation) never called; `GET /directory/{id}` + `send-message` unused; `GET /timer/logs` has no standalone UI | Either wire (timer log history is genuinely useful under Projects → Time) or delete endpoints from api.php + openapi.yaml |
| FIN-P2-15 | Mobile chat link in bottom nav not capability-gated (desktop is); "Send Message" buttons don't check `chat.access` (all roles hold it — fragile only) | Add gates for consistency |
| FIN-P2-16 | Employee self-designation dropdown: employees can change their own designation under `profile.edit` (works as coded; questionable product rule) | Product decision: keep, or restrict designation changes to HR |

### P3 — polish

- `middleware.ts` deprecated convention (works; Next 16 prefers `proxy`) — migrate when convenient.
- Super_admin no longer gets the HR-scoped "My Team" attendance tab (org/attendance page is a hard isAdmin branch now). The admin console is a company-wide superset with the same member sheet, so this is a UX simplification, not a loss — documented as intended behavior in workflow.md.
- Breadcrumb segment labels: verify coverage for `directory`/`notifications`/`announcements` paths.
- Offline mutation queue returns `{queued:true}` → success handlers run optimistically; conflicts park in IndexedDB with no review UI (spec: "queued for submission" — add a small conflict review list later).
- Toast position: spec self-contradicts (top-right global vs bottom-right forms); implemented top-right uniformly — keep, document.
- Kanban column set: spec §6 says 3 columns, §7 says 4 (incl. Review) — implemented 4, matching the approval flow. Keep.
- Login multi-role detection uses `>1` roles while `(auth)/layout` checks `roles || role_assignments` — harmless inconsistency.

---

## 5. Spec-Gap Summary (details in workflow.md §12)

The spec is now ~95% implemented. Remaining true gaps (not defects):

1. 🔴 One-field-per-screen mobile form mode (spec §8) — standard scrollable forms with large targets exist.
2. 🟡 Typing-pause (debounced) form validation — validation runs on blur/submit via react-hook-form.
3. 🟡 Widget-level "×" dismiss (dead wiring — FIN-P2-1).
4. 🟡 Drafts/autosave beyond 3 forms (FIN-P2-10).
5. 🟡 Inline editing beyond tasks (FIN-P2-9).
6. 🟡 Quick Notes palette/sidebar access (FIN-P2-4).
7. 🟡 Employee-profile pinning (FIN-P2-12).
8. Resolved-by-decision (documented in workflow.md): employees have no Directory/Reports nav (owner order 2026-08, supersedes spec §7's "directory for everyone"); 4-column Kanban.

---

## 6. Implementation Checklist — Phased

### Phase A — Launch blockers (do first, ~1–1.5 days)

- [ ] **A1 (P0-1)** Map `field_type → type` in `qa-form-viewer.tsx` (and `qa-form-preview.tsx`); verify checkbox/boolean/select/slider/date/file all render + enforce required; add vitest for renderer
- [ ] **A2 (P1-1)** Add `capability:settings.manage` to `POST /companies` + `PUT /companies/{id}` routes
- [ ] **A3 (P1-2)** Move department team create/delete routes into the `departments.manage` group
- [ ] **A4 (P1-10)** Fix `directory.test.tsx` mock (`ContentSkeleton`); re-run suite to green
- [ ] **A5 (P1-11)** Wire `frontend_url` into `config/app.php`; verify generated reset link points at the deployed web origin
- [ ] **A6 (P1-8)** Safe `JSON.parse` in `system-jobs-config.tsx`
- [ ] **A7 (P1-4)** Replace `limit=` with `per_page=100` in quick-task-widget, directory-tab ×2, directory-list
- [ ] **A8 (P1-5)** Add "All" options: approvals status, notifications read-status, attendance department selects
- [ ] **A9 (P1-9)** `encodeURIComponent` search in admin-attendance-table (grep for other raw interpolations)
- [ ] **A10 (P1-3)** Decide: implement `/attendance/{admin,hr}/analytics` or remove phantom calls
- [ ] **A11 (P1-6)** Rehydrate timer-store in Providers + reconcile with server state
- [ ] **A12 (P1-7)** Wire `onTaskUpdate` into Gantt (or visibly disable drag)
- [ ] **A13 (P1-12)** Unify standard-day constant (31,500s) across timer-store + time-clock-widget
- [ ] **A14 (P1-13)** Re-add the Open Shifts tab: render `AdminOpenShiftsTable` in `AdminAttendanceView` (4th tab or under Overview)
- [ ] **A15 (P1-14)** Load-all (or paginated-follow) task fetch for Kanban/Gantt scopes; surface a "showing first 100" notice if capped

**Phase A exit criteria:** vitest fully green · tsc clean · build green · QA form end-to-end manual test (create form with checkbox+select → submit task → verify controls + review panel) · employee cannot POST /companies or create teams (403) · reload mid-timer keeps timer · reset link points to production URL.

### Phase B — Hardening (half day)

- [ ] **B1 (P2-13)** Fix `pnpm lint` script; triage 218 eslint errors (mostly `no-explicit-any`); add eslint to CI as warning-gate, tighten later
- [ ] **B2 (P2-1)** Wire widget dismiss (×) → `dismissWidget`; verify Preferences restore works
- [ ] **B3 (P2-7)** Delete dead files inventory (6 files)
- [ ] **B4 (P2-8)** Fix/remove `/dashboard/init` prefetch unwrap
- [ ] **B5 (P2-5)** Forward `highlight` param through the tasks redirect; flash pinned task
- [ ] **B6 (P2-6)** Export history: show all + pagination
- [ ] **B7 (P2-3)** Mark-unread action in notification center
- [ ] **B8 (P2-14)** Decide adopt-or-delete for dead endpoints (`/dashboard/metrics`, `/attendance/sync`, `/directory/{id}`, `/directory/{id}/send-message`); wire `/timer/logs` history UI or remove from openapi
- [ ] **B9 (P2-15)** Capability-gate mobile chat nav item; gate "Send Message" on `chat.access`
- [ ] **B10** Add tests: QA renderer, filters ("All" reset), timer rehydration, Gantt update (if wired)

### Phase C — Spec-completeness polish (optional before/after launch)

- [ ] **C1 (P2-2)** QA form edit/delete UI
- [ ] **C2 (P2-4)** Quick Notes in command palette (+ sidebar shortcut)
- [ ] **C3 (P2-9)** Reusable inline-edit on project + department names
- [ ] **C4 (P2-10)** Generalize 30s autosave drafts to task create / announcements / group create
- [ ] **C5 (P2-11)** Gantt milestone diamonds
- [ ] **C6 (P2-12)** Pin employee profiles
- [ ] **C7** One-field-per-screen mobile form mode (leave request + task submission first)
- [ ] **C8** Debounced typing-pause validation on key forms
- [ ] **C9** Offline conflict review UI (parked mutations)
- [ ] **C10** Migrate `middleware.ts` → `proxy` convention

---

## 7. Deployment / Go-Live Checklist

**Config (apps/api):**
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` set ✅ (verified)
- [ ] `FRONTEND_URL` = production web origin **and** wired into `config/app.php` (A5)
- [ ] `DB_*` → Supabase pgsql; `FILESYSTEM_*` → S3 adapter ✅; `QUEUE_CONNECTION=database` ✅
- [ ] `BROADCAST_CONNECTION=pusher` + Reverb host/key/secret; web `NEXT_PUBLIC_REVERB_*` set (else realtime silently polls)
- [ ] SMTP configured + "Send Test Email" from Settings (needed for: welcome emails w/ temp passwords, reset links, weekly Sunday summary, suspicious-login alerts)

**Infra:**
- [ ] Cloud Run service running `start.sh`; **second service (or same) running `start-worker.sh`** (queue worker + `schedule:run` supervision — verified present)
- [ ] Vercel deploy of `apps/web` with API origin + Reverb env vars; `/api/version` buildId populated (version.json in build output)
- [ ] CI green on release commit (incl. pgsql matrix); eslint gate added (B1)

**Data:**
- [ ] Production seed run (roles, capabilities, global chat, default schedule, holidays) — `php artisan db:seed`
- [ ] Create the real Admin account; **purge demo dataset** (Settings → Demo Data → Purge) before staff onboarding
- [ ] Auto-numbering prefixes reviewed (G4K-###, DEP-###)
- [ ] Standard work schedule + grace minutes set (drives late/overtime math)

**Launch-day smoke test (30 min, all three roles):**
- [ ] Admin: login → dashboard widgets → create HR + employee (temp password email arrives) → department + team + schedule → holiday add
- [ ] HR: login → clock in → break → create project (+ team + QA form with checkbox/select fields) → assign task → approve a submission → create group chat → leave request
- [ ] Employee: login → onboarding → clock in → work task + project timer → submit task with QA (controls render correctly!) → DM HR → announcement reaction → reload mid-timer (still running)
- [ ] Admin approves HR leave; export attendance (xlsx arrives via notification); audit log shows entries; Sunday summary command `reports:send-weekly-summary` runs manually once
- [ ] Mobile: bottom nav, big clock-in FAB, chat full-screen; offline: punch → reconnect → syncs once

---

## 8. Sign-Off Criteria (definition of "final")

1. All Phase A items checked; vitest/tsc/build/eslint-gate green in CI.
2. Zero P0/P1 findings open from this document.
3. Launch-day smoke test passed on production URLs with real roles.
4. Demo data purged; production admin + first HR + first employees created.
5. `workflow.md` still matches shipped behavior (update statuses after Phase A/B).

*Next audit: after Phase A+B land, run a fresh zero-trust pass (live-prod probes included) before declaring day-to-day production use.*
