# deploy.md — Make the App Ready to Deploy

> **Created:** 2026-08-21 · **Source of truth:** `Audit-Report.md` (2026-08-21 full audit: 10 Critical · 29 High · 55 Medium)
> **Goal:** ship a build where the product's core loops work end-to-end in production, no destructive operation can destroy real data, and the live-prod findings (deploy drift, audit IPs) are closed.
> **Gate policy:** Phases 1–4 are **blocking** (no deploy until done). Phase 5 is optional-in-train (recommended, same deploy if time allows). Phase 7 is post-deploy backlog.
> **Tracking:** work top-to-bottom inside each phase; tick the checkboxes. Every item carries its `AUD-*` id from Audit-Report.md with file:line evidence.

---

## Phase 0 — Safety prep (15 min)

- [ ] Branch: `git checkout -b fix/deploy-readiness` from `main` (working tree already has uncommitted changes — commit or stash first; `git status` to confirm nothing unexpected).
- [ ] Baseline commands pass on your machine:
  ```bash
  cd apps/web && ../../node_modules/.bin/tsc --noEmit        # typecheck (use .bin/tsc, not npx)
  pnpm --filter web build                                     # production build must succeed
  cd ../api && composer install && php artisan test           # sqlite suite (known pg-blind spots — see smoke tests)
  ```
- [ ] Confirm prod secrets intact (past cleanups emptied `APP_KEY` once): `gcloud run services describe g4k-api --region asia-south1 --format="value(spec.template.spec.containers[0].env)"` or check the `--update-secrets` set in `cloudbuild.yaml` still matches Secret Manager entries `APP_KEY`, `DB_PASSWORD`, `AWS_*`, `SUPABASE_*`.

---

## Phase 1 — P0 contract fixes (blocking · small diffs, ~1–2 h total)

The pattern here: buttons exist, requests can never succeed. Align the frontend to the API contract (API is the correct side in every case — verified).

### 1.1 Task submit — the core product loop
- [ ] **AUD-TASK-1** `apps/web/src/components/tasks/task-overview-tab.tsx:86` — change payload field `notes` → `submission_note`. API: `TaskController.php:445-447` (`submission_note` required).
- [ ] Also fix the stale-cache bug while here: **AUD-TASK-21** `task-overview-tab.tsx:93` — after submit, invalidate the tasks list/kanban query keys too (same keys the tasks tab uses), not only `task-detail`.

### 1.2 Task comments
- [ ] **AUD-TASK-2** `task-comments-tab.tsx:27` — send `{ body: comment }` instead of `{ content: comment }`; display at `:73` reads `c.content` → change to `c.body` (DB column is `body`).
- [ ] **AUD-TASK-14** `task-comments-tab.tsx:42` — comment delete calls `DELETE /tasks/comments/{id}` which doesn't exist. Either (a) remove the delete button, or (b) add `Route::delete('/tasks/{id}/comments/{commentId}', ...)` with author-or-manager check. Choose (a) for this deploy; (b) is Phase 7 polish.

### 1.3 Manual time logging
- [ ] **AUD-TASK-3** `task-time-tab.tsx:84-90` — call the real endpoint: `POST /timer/log` with `{ task_id, minutes_logged: parseInt(...), description }` (route: `api.php:216`, min 1 minute enforced at `TimerController.php:18`).
- [ ] `task-time-tab.tsx:199-200` — render `log.minutes_logged` (column is `minutes_logged`, not `minutes` → current NaN).

### 1.4 Personal task reminders
- [ ] **AUD-TASK-4** `task-overview-tab.tsx:46-71` — replace the dead `POST /reminders` / `DELETE /reminders/{id}` calls with the real routes `POST /tasks/{taskId}/reminders` (`{ remind_at }`) and `DELETE /tasks/reminders/{id}` (`api.php:196-197`). A correct reference implementation already exists, unused, at `task-detail-sheet.tsx:195-220` — port it and delete the dead copy (**AUD-TASK-34**).

### 1.5 Quick Task widget
- [ ] **AUD-TASK-5** `quick-task-widget.tsx:59` — send `assignees: [assigneeId]` instead of `assignee_id: assigneeId` (`TaskController.php:194-195` only validates `assignees[]`). Keep `notify_global_chat: true`.

### 1.6 Task status values
- [ ] **AUD-TASK-6** three spots in `apps/web/src/components/projects/tasks-tab.tsx`:
  - `:1098` bulk Mark Done `status: "completed"` → `"done"` (enum: `todo|in_progress|review|done`)
  - `:941-942` filter options `completed`/`redo` → `done` (drop `redo` — it isn't a status; redo lives on the approval)
  - `:547` overdue comparison `!== "completed"` → `!== "done"`

### 1.7 Announcement priority selector
- [ ] **AUD-ANNC-1** `announcement-composer.tsx` — add a Normal/High/Urgent select wired to `priority` in the POST body. Backend is fully ready (`AnnouncementController.php:68,79,90` — high/urgent already fan out notifications). Default `normal`.

### 1.8 Attendance Summary export
- [ ] **AUD-REPORT-1** `apps/api/app/Jobs/GenerateReportJob.php` — the handler block starting at `:290` (right after `leave-export`'s `break;` at `:289`) is missing its label. Insert `case 'attendance-summary':` directly before `$start = $filters['start'] ?? ...` at line 290. (The key is already whitelisted at `ReportController.php:108` and submitted by `admin-reports-view.tsx:58-74`.)

### 1.9 Demo-data purge button
- [ ] **AUD-SET-1** `demo-data-config.tsx:24` — send the typed confirmation the API requires: `apiFetch("/demo-data/purge", { method: "DELETE", body: JSON.stringify({ confirmation }) })` where `confirmation` is the value of the existing typed-confirmation input (must equal `"REMOVE DEMO DATA"`, `DemoDataController.php:56-57`).

### 1.10 Verification (all of Phase 1)
- [ ] `tsc --noEmit` + `pnpm --filter web build` clean.
- [ ] Manual pass against local stack (or staging) as HR + employee: submit a task for review → see it in Review column; comment on it; log 15 min manually; set a reminder; Quick Task → task appears in the employee's list assigned to them; bulk-select → Mark Done works; post a High announcement → bell badge appears for recipient; run Attendance Summary export → job completes and downloads; Demo Data → purge request accepted (don't run purge for real until Phase 2 is merged).

---

## Phase 2 — P0 data safety (blocking · ~half day)

### 2.1 Demo purge must never touch real records
- [ ] **AUD-SET-2** `apps/api/app/Console/Commands/DemoPurgeCommand.php:66-68` — replace the three `DB::table(...)->truncate()` calls (`notifications`, `conversation_message_reads`, `audit_logs`) with selective deletes using the existing demo tags (`HasDemoTag` / `is_demo` columns cover these tables; e.g. `DB::table('audit_logs')->where('is_demo', true)->delete()`). Verify every other table in the purge list already deletes selectively.
- [ ] Audit-log the operations: call `AuditLogger` (or insert an `audit_logs` row post-purge) from the purge **and** seed jobs with before/after counts (**AUD-SET-13**).
- [ ] Add a guard test if cheap: seed one real marker row, run purge, assert the marker survives.

### 2.2 Deactivated users lose access immediately
- [ ] **AUD-DEACT-TOKENS / AUD-SET-9** two one-liners:
  - `UserController.php:293-334` (`updateStatus`) — on deactivate/delete: `$user->tokens()->delete();`
  - `AuthController.php` `refresh()` (~line 280, after user resolve) — reject when `in_array($user->status, ['inactive','locked'])` with 401.
- [ ] **AUD-AUTH-1** (optional here, small): in `login()` the user-level lockout branch (`AuthController.php:122-125`) returns generic 422 — include `retry_after` (seconds till `lockout_until`) so the login page countdown works for multi-IP lockouts too; frontend already handles `retry_after`.

---

## Phase 3 — P1 workflow integrity & scoping (blocking for "ready" · ~1–2 days)

### 3.1 Approval path enforcement (tasks)
- [ ] **AUD-TASK-7** `TaskController.php:503-507` — `submitForReview` must go through `TaskService::updateStatus` (or explicitly call `TaskService::hasDependencyCycle`/blocked check) so blocked tasks can't be submitted.
- [ ] **AUD-TASK-12** `TaskService.php:63-65` — drag/reorder into `review` for a task without QA form must still require a completion note: simplest correct behavior = reject the transition with a clear error telling the user to open the task and use Submit for Review.
- [ ] **AUD-TASK-13** `TaskController.php:343-353` — assignees may not PUT `status=done` directly; only via approve (managers keep direct rights).
- [ ] **AUD-TASK-8** move recurrence to the approve path: `approve()` (`TaskController.php:592`) calls `RecurrenceService::handleCompletion`; remove/keep-guard the direct PUT trigger (`:352-353`) and the reorder path (`:419-428`). Also fix the weekly skip bug `RecurrenceService.php:27,40-42` (mutated base + double addWeek).
- [ ] **AUD-TASK-9** fire `TaskCompleted` (global-chat post) in `approve()` when `notify_global_chat` is set on the task, instead of only on PUT.
- [ ] **AUD-TASK-10** notify HR in the approve path for recurring tasks.

### 3.2 Project form + flow
- [ ] **AUD-PROJ-2** `create-project-dialog.tsx` — add Start Date / End Date fields (`end >= start` validation); backend accepts them (`ProjectController.php:89-90`).
- [ ] **AUD-PROJ-4** `ProjectController.php:248` — make `notes` required on submit; restrict submit to members/managers only; block resubmission while status is `review`.
- [ ] **AUD-PROJ-1** auto-calculate progress: on task approve/status change, recompute project `progress = done_tasks / total_tasks * 100` (event or inline in `TaskService`). Keep manual override only if currently used anywhere.
- [ ] **AUD-PROJ-5** notify both HR cohort and Admins on project submit (extend `NotifyApprovalSubmitted` recipient selection).
- [ ] **AUD-PROJ-6** notify members on project create (`NotificationService` loop in `ProjectController.php:108-122`).

### 3.3 HR scoping (reports + projects + announcements)
- [ ] **AUD-REPORT-2 + AUD-REPORT-3** (single fix): `apps/api/app/Support/HrScope.php` — add a branch before the `whereHas` fallback:
  ```php
  if ($relationOrColumn === 'users.department_id' || str_ends_with($relationOrColumn, '.department_id')) {
      return $query->whereIn($relationOrColumn, $deptIds);
  }
  ```
  This repairs HR dataset 500s (`ReportController.php:70`), HR attendance export (`GenerateReportJob.php:227`), and HR users/productivity exports (`:363`) at once.
- [ ] **AUD-REPORT-4** `ReportController.php:191,233` — cache key `'admin'` → `$user->id`.
- [ ] **AUD-REPORT-5** `LeaveRequestController.php:384-395` — include `'_has_manage' => $this->userHasManage($request)` (mirror `AttendanceController::export`) so HR/Admin leave exports are scoped, not self-only.
- [ ] **AUD-AUDIT-1** `ExportAuditLogsJob.php:82-87` — store `$filename` (path) in `file_path`, not `$disk->url($filename)`; generate the URL at download time like the other export jobs do.
- [ ] **AUD-PROJ-3** add HrScope to `ProjectController`: `index` (HR = created-by OR members in managed depts OR project department in managed depts — the DashboardController at `:144-160` already implements exactly this pattern; extract/reuse), and scope checks in `update/destroy/review`.
- [ ] **AUD-ANNC-4/5** `AnnouncementController::store/update` — HR limited to team-scope announcements within HrScope; company-wide reserved to `settings.manage`. **AUD-ANNC-3** fix recipient join: team announcements must resolve members via `users.team_id` (or team→department), not `department_id = team_id` (`:93`).

### 3.4 People-ops paths
- [ ] **AUD-DIR-1** surface the temp password: in `directory-list.tsx:234-239` (create) and `use-user-actions.ts:65-70` (reset), when the response contains `_temp_password`, show it in a copyable dialog ("Share this password with the employee — email is not configured"). Also fix the misleading copy **AUD-DIR-9** (`:613` "Password@123") and **AUD-DIR-10** (`user-form.tsx:209`).
- [ ] **AUD-DIR-5** `DepartmentController.php:111-150` — archive and destroy must both refuse while active employees are assigned (HTTP 422 with count), not silently deactivate.

### 3.5 Cache invalidation (sync class)
- [ ] **AUD-SYNC-1/2/3** add `Cache::forget` for: `user_metrics_{uid}_{role}` in the same places `dashboard_metrics_*` is cleared (Task/Project/Leave controllers + `UserController` status/reset); `team_today_{role}_{dept}_{date}` in `AttendanceController::handlePunch` (:87-91 — clear all role×dept variants for the punching user's department, or drop the cache to 15s); `announcements_{uid}_{role}` in `AnnouncementController` store/update/destroy (or a tag-flush).

### 3.6 Verification (Phase 3)
- [ ] `php artisan test` + `tsc` + web build clean.
- [ ] Scripted E2E against staging with 3 roles (admin/HR/employee) covering: blocked-task submit rejected; approve creates recurrence + posts to global chat; HR cannot open another department's project; HR datasets + attendance export succeed (no 500); leave export returns team rows; audit export downloads; deactivate → user's next request 401s; announcement High → notification lands; new announcement appears on another user's dashboard immediately.

---

## Phase 4 — Pre-deploy checklist (blocking · 30 min)

- [ ] All Phase 1–3 checkboxes ticked; changes committed to `main` (or merged PR).
- [ ] `pnpm --filter web build` succeeds; `cd apps/api && php artisan migrate --pretend` shows nothing unexpected (no new migrations required by Phases 1–3 — confirm none were added; if any were, they must be listed here).
- [ ] Secret Manager entries from Phase 0 still present; no `.env` secrets committed.
- [ ] Update version markers so drift is detectable: confirm `/api/frontend-version` route deploys this time (it 404s on current prod) — after deploy it must return JSON. If the route was intentionally removed, delete this line and note why.

## Phase 5 — Deploy & infra fixes (the deploy itself)

Deployment is push-triggered: **push to `main`** → Cloud Build builds+deploys `g4k-api` + `g4k-worker` (with migrate step) → Vercel builds `web`. Before pushing:

- [ ] **AUD-LIVE-1 trusted proxies (do this in the same push):** Cloud Run terminates at Google's LB; configure Laravel to trust it so audit IPs are real. In `apps/api/bootstrap/app.php` add `->trustProxies(at: '*')` (headers default cover `X-Forwarded-For`). Verify post-deploy: any action → `audit_logs.ip` shows the client IP, not `169.254.x.x`.
- [ ] **AUD-LIVE-2 (small, include if touching audit anyway):** audit rows for `login` render as "System" with "User #N" — ensure deferred audit writes (`ProcessAuditLogJob`) carry `user_id` and the audit table resolves names the way the dashboard feed does.
- [ ] Push → watch Cloud Build (migrate + SmokeCheck steps green) → watch Vercel build.

### Post-deploy smoke test (30 min, in order — this doubles as the audit's pending live re-probe)
- [ ] `/api/ping` ok; `/api/frontend-version` returns JSON (drift detector).
- [ ] Login as admin → dashboard renders, zero console errors; **Settings tabs switch by click** (was broken on old build).
- [ ] Audit Log tab: recent rows show real IPs (AUD-LIVE-1 fix), logins show user names.
- [ ] Login as HR + employee (create fresh test accounts with known passwords since demo creds are randomized): run the Phase 1 manual pass on **prod** (submit task, comment, time-log, reminder, quick task, bulk done, High announcement, attendance-summary export, demo-purge dry run — type confirmation, cancel before executing if not intended).
- [ ] Two-browser realtime check: messages/notifications arrive live; no duplicates (re-verify the duplicate-broadcast fix under real usage).
- [ ] Delete the fresh test accounts afterwards (soft-delete) or mark them as demo.

## Rollback
- Web: Vercel → instant rollback to previous deployment.
- API/worker: `gcloud run services update-traffic g4k-api --region asia-south1 --to-revisions=PREVIOUS=100` (same for `g4k-worker`); migrations in this train are none/append-only — no down-migration expected.

---

## Phase 6 — Ship-blocker summary (what "ready to deploy" means)

Done = all of: Phase 1 (9 contract fixes) + Phase 2 (purge safety + token revocation) + Phase 3 (approval-path, HR scoping, cache) + Phase 4 checklist + Phase 5 push with trusted-proxy fix + smoke test green. That closes all 10 Criticals, the Highs marked P0/P1 in Audit-Report §7 (TASK-7..13, PROJ-1..6, DIR-1, REPORT-2/3/4/5, AUDIT-1, DEACT-TOKENS, ANNC-1..5 subset, DEPLOY-1, LIVE-1), and leaves the app in a state where a zero-trust re-audit would find no dead core workflow.

## Phase 7 — Post-deploy backlog (not blocking · schedule next train)

From Audit-Report.md, in its §7 order: TASK-11 (Individual/Department/Role scope targeting — needs a mini-migration), DIR-2 (Employee 360 record), REPORT-6 (admin-only reports: project completion, task statistics, productivity summary), ANNC-2 (announcement dismiss), ANNC-6 (urgent → everyone), REPORT-7 (summary KPI cards), REPORT-9 (productivity export formula), REPORT-10 (xlsx-only), NOTIF-1 (export-ready bell notification — persistent Notification row), NOTIF-4 (filter taxonomy), SET-3 (per-job retry), SET-4 (expiry field UI), SET-5 (short name), SET-6 (timezone default Asia/Kolkata + seeded profile), SET-7 (login logo from company profile), SET-8 (weekly summary content/audience), SET-10/11, SYNC-4 (sound pref kills broadcast), CHAT-1/3/4/6 (receipts DM-only, pin cap, global @-mentions, nav unread badge), TASK-15..20/23/28..33, PROJ-7..12, DIR-3/6/7/8, LEAVE-1/2, ATT-2/3, MOB-1/3, UX-1..8, LIVE-3 (activity-feed noise). Each is fully specified with file:line in Audit-Report.md — no re-audit needed to start.

---

## Changelog
- 2026-08-21 — created from Audit-Report.md (2026-08-21) §7 fix order; gate = Phases 1–5.
