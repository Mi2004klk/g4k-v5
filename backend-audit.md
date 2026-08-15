# Backend Audit — Games4Kings-New/apps/api vs finalization.md / finalization-report.md

Overall: the report is unreliable. Multiple claims are directly contradicted by the code (s3 disk "purged", `{data}` wrapping, archived_at removal, scheduler hardening, timezone fix, exports "fully wired" — while the codebase's own tests `markTestIncomplete` on exports). Tests run on SQLite, so every Postgres CHECK-constraint violation below is invisible to CI.

## FINDINGS (failures)

### P0 — blockers / data loss

1. **P0 · database/seeders/Phase42DemoSeeder.php:50-64 — demo seeder retro-tags ALL pre-existing rows; demo:purge would delete real production data.** `DB::table($t)->whereNull('demo_tag')->update(['demo_tag'=>$demoTag,'is_demo'=>true])` runs over users/departments/projects/tasks/etc. with no ownership filter — any real row created before `demo:seed` gets tagged, and DemoPurgeCommand deletes every row `whereNotNull('demo_tag')`. The Phase44 test masks this by creating "real" rows only *after* seeding. Also violates T-41.1's "not by after-the-fact guessing."

2. **P0 · app/Services/AttendanceService.php:207 — company timezone never used; late/OT still computed in the storage timezone (T-16.1 unfixed).** `$tz = $firstClockIn->timezone ?? config('app.timezone','Asia/Kolkata')` — a Carbon instance's `->timezone` is never null, so it always evaluates to the app/storage tz (UTC in prod), never CompanyProfile's tz. The report's claim that reconcileDay "properly uses the CompanyProfile timezone" is false — there is no reference to CompanyProfile anywhere in the file. `config('app.timezone')` fallback is dead code.

3. **P0 · app/Http/Controllers/ProjectController.php:210-213 vs database/migrations/2026_08_09_025001_create_phase_7_tables.php:8 — `status='review'` violates the projects status CHECK on Postgres.** Original enum is `['active','completed','archived']` and no migration extends it (only tasks at :65 include 'review'; approvals got a proper pg constraint rewrite in 2026_08_12_150613 — projects did not). `POST /projects/{id}/submit` will 500 on Supabase Postgres; green on SQLite tests.

4. **P0 · app/Listeners/LeaveAttendanceIntegration.php:89,98 — writes `status='leave'` but the constraint allows only `'on_leave'`.** Migration 2026_08_14_210758 (`update_attendance_days_status_check`) permits `present, absent, late, on_leave, holiday, pending`. The leave→attendance day integration (T-19.3 chain) fails with a check violation on Postgres and retries into failed_jobs; tests never see it (migration skips sqlite).

5. **P0 · routes/api.php:190-199 + database/seeders/DatabaseSeeder.php:55-67 + app/Services/CapabilityMatrix.php:20-33 — HR is not granted `tasks.manage`; employees can never update/submit/comment tasks.** All task mutations (`POST /tasks`, `PUT /tasks/{id}`, `submit-review`, `approve`, `redo`, `comments`, `reorder`) sit behind `capability:tasks.manage`, which HR does not have in the seeder or default matrix — HR cannot create/assign/approve tasks (T-22.1/T-22.6/T-46.7), and employees cannot submit QA'd work (T-22.5) or even drag Kanban (progress update = PUT). `allow_employee_tasks` (T-52.6, report claims "TaskController updated") has zero backend enforcement — no reference to it in TaskController.

6. **P0 · app/Http/Controllers/ReportController.php:56-89,132-195 (+ GenerateReportJob.php:151-155,207-209) — employees see department-wide user lists and attendance/leave summaries.** Non-`reports.manage` users (employees have `reports.view`) fall back to `where('department_id', $user->department_id)` — an employee gets every colleague's name, attendance counts, hours, and leave counts. Plan T-24.7: employee = own attendance only.

### P1 — broken

7. **P1 · app/Jobs/GenerateReportJob.php:41 — hardcoded `Storage::disk('s3')` (report T-4.1 claims this file was converted to `config('filesystems.default')` — false).** Same class of bug: app/Http/Controllers/ProjectController.php:260 stores covers on the hardcoded `'public'` disk (ephemeral on Cloud Run).

8. **P1 · app/Http/Controllers/ChatController.php:11,150 — imports and broadcasts `App\Events\MessageRead`, which does not exist** (Events dir has no MessageRead.php). The throw is swallowed by try/catch → read receipts (T-23.5/T-28.1) silently never broadcast.

9. **P1 · Nothing ever creates a `scope='global'` conversation.** Grep shows only consumers (ChatController.php:17, TaskController.php:157, PostTaskCompletionToGlobalChat.php:33); no seeder/command creates one — DatabaseSeeder and Phase42DemoSeeder create only direct/group chats. Global chat is absent on a fresh seed and quick-task/task-completion auto-posts to Global Chat (T-22.9) are no-ops.

10. **P1 · app/Http/Controllers/AnnouncementController.php:49-57 — high-priority announcement notifies only the poster.** `sendGlobalNotification($request->user()->id, ...)` while the comment says "Notify all users in scope" (T-24.3 announcements trigger broken).

11. **P1 · app/Http/Controllers/TaskController.php:244-254 — reassignment notifications never fire.** `assignees()->sync()` runs *before* `$task->assignees->pluck('id')`, so `$existingAssignees` already equals the new set and `array_diff` is always empty.

12. **P1 · app/Http/controllers/FeedbackController.php:29-35 — complaint channel wrong per T-47.10:** link string passed as the `$data` (array) parameter (arg-order bug → notification has no link), no DM to HR/Admin, default `normal` priority instead of high.

13. **P1 · app/Services/NotificationService.php:25,43-45 — null-deref + placeholder email channel.** Line 25 dereferences `$user->preferences` unguarded (line 20 guards, line 25 doesn't) — fatal for deleted users; lines 43-45: "Here we would dispatch an email notification job / For now, just log" — email notifications are a `Log::info` placeholder despite channels config.

14. **P1 · app/Console/Commands/SendHolidayReminders.php:60-63 — dedup query does `WHERE data LIKE '%…%'` on the `notifications.data` **json** column** (migration 2026_08_09_020003:60) — `operator does not exist: json ~~ unknown` on Postgres; the holiday-reminder command crashes whenever a holiday is exactly at the offset.

15. **P1 · app/Http/Controllers/AuthController.php:77-90 — lockout has no auto-unlock and no time window.** `failed_attempts` is cumulative-forever (5 fails over months = permanent `status='locked'`), nothing ever resets `locked` (no scheduled unlock, no admin unlock endpoint) — plan T-12.2 requires 10-min auto-unlock.

16. **P1 · app/Http/Controllers/LeaveRequestController.php:131-178,180-193 — leave `decision` and `show` have no HR dept scoping.** Any HR with `leave.approve-employee` can approve/reject and view leave requests from departments they don't manage (ApprovalService::checkRoleGating checks role/capability only) — violates T-20.2 strict `department_hr` scoping.

17. **P1 · app/Http/Controllers/TaskController.php:421-429 — `/tasks/submitted` is self-scoped (`assignee_id = me`),** so the HR/Admin review queue (T-46.7 explicitly reuses this endpoint) returns the reviewer's own assigned tasks, not team submissions.

18. **P1 · app/Providers/AppServiceProvider.php:69-71 — `RateLimiter::for('api') = Limit::none()` disables API throttling globally in production code** (every route in routes/api.php:55 sits behind `throttle:api`). The report describes this as a test-only workaround; it's live.

19. **P1 · app/Http/Controllers/ReportController.php:70 and app/Jobs/GenerateReportJob.php:215 — productivity reports `withSum('taskTimeLogs','duration_seconds')` but `task_time_logs` has no `duration_seconds` column** (it has `minutes_logged`, migration 2026_08_09_025001) → SQL 42703 → `/reports/data?key=productivity` 500s and productivity exports always fail.

20. **P1 · routes/console.php:11-19 — scheduler lacks the hardening the report claims.** Report T-2.2 says `->withoutOverlapping()->timezone('Asia/Kolkata')` was "appended uniformly" — no schedule entry has either. Also RemindShiftStart/AlertMissedClockIn have no per-day dedup key (T-17.3) and their `subMinutes(1)/addMinutes(4)` window vs every-5-min cadence can double-fire or skip.

21. **P1 · app/Jobs/AlertMissedClockIn.php:45-46,79 — missed-clock alert routes to HR by the HR's own `department_id`, not the `department_hr` pivot** (T-17.2 "per-employee to managing HR"); it also iterates ALL active users, so admins/HRs who (by policy) never clock trigger no-show alerts.

22. **P1 · app/Http/Controllers/UserController.php:155,204 — role-change cache invalidation uses the wrong key.** Forgets `"user.{$id}.roles"` but `User::getCachedRoles()` (app/Models/User.php:81) caches `"user_{$id}_roles"` — role edits leave stale roles/scoping for up to 1h. Same pattern: AuthController.php:473 forgets `"user_{id}"` (nonexistent key).

23. **P1 · app/Http/Controllers/DirectoryController.php:94-106 — directory "send message" creates a NEW direct conversation on every call** (no dedup like `startDirectMessage`), no `MessageSent` broadcast, no recipient notification — DM-from-directory (T-23.1) spams duplicate conversations with dead realtime.

24. **P1 · Demo purge residues & gaps (app/Console/Commands/DemoPurgeCommand.php):** (a) line 97 clears cache key `holidays_list` but the real keys are `holidays_{year}` (HolidayController.php:14) — demo holidays stay cached ≤1h; (b) purge order line 24 lists `task_activities` but the table is `task_activity` (only saved by FK cascade); (c) `companies` and `holidays`/`work_schedules` created by DatabaseSeeder are never demo-tagged (raw `DB::table` inserts bypass HasDemoTag) so they survive purge as residue; (d) no uploaded-file cleanup (T-41.3); (e) Dashboard caches (`dashboard_init_{uid}_{role}_{date}`, `team_today_*`, `dashboard_global`) are never cleared — stale widgets referencing deleted demo users.

25. **P1 · DemoSeedCommand idempotency holes (app/Console/Commands/DemoSeedCommand.php:26-46 + Phase42DemoSeeder):** a version change without `--fresh` re-runs Phase42DemoSeeder on top of old data (Task::create/Project::create duplicate; `Event::fake()` at Phase42DemoSeeder.php:30 disables all model events — including HasDemoTag creation-time tagging, which is precisely why the dangerous retro-backfill exists; leave balances `rand(0,5)` ignore actual approvals; no boundary-employee-at-0, no HR→Admin pending leave, only 2 projects (no completed/pending-review/blocked/recurring instances — T-42.3/42.4 unmet).

26. **P1 · app/Http/Controllers/DemoDataController.php:74-82 — admin "re-seed" runs the entire 4-week×12-user seed synchronously inside the HTTP request** (no queued job, no progress, no completion notification — T-41.4 requires async + notify).

27. **P1 · tests/Feature/RoleMatrixTest.php:26-30,88-95 — the "role-matrix pack" tests a nonexistent `admin` role** (system roles are super_admin/hr/employee; `admin` resolves to zero caps), so every capability route "expects 403" for it and the super_admin self-service deny (T-13.1's acceptance: admin clock-in 403) is never exercised. Also contains `dd(...)` calls in assertion paths (:88,92).

### P2 — polish / inconsistencies

28. **P2 · Report-claim mismatches (T-6.1 wrapping):** only HolidayController (:69) and WorkScheduleController (:11) return `{data:[...]}`. QuickNoteController.php:19, PinController.php:11, QaController.php:13, SavedViewController.php:17, AutoNumberingController.php:11, ReportController.php:129 (`exports`), AnnouncementController.php:19, ProjectController.php:142 (`history`), AuthController.php:566 (`sessions`) all return bare arrays.

29. **P2 · app/Http/Controllers/DepartmentController.php:26-29,110-135 — still uses `archived_at`** for archive/restore/filter; report T-5.3 claims archived_at usage was dropped in favor of SoftDeletes (SoftDeletes trait *is* applied, but the archive flow still rides archived_at).

30. **P2 · app/Http/Middleware/ForcePasswordChange.php:19-36 — the entire enforcement body is commented out ("DISABLED FOR NOW")** yet the middleware is still applied globally (routes/api.php:55) — dead middleware + `must_change_password` gating effectively off.

31. **P2 · routes/api.php:61-63 — `POST /auth/2fa/enable` is a 501 "coming soon" placeholder** (plan bans placeholders; report openly admits adding it).

32. **P2 · routes/api.php:65-66 — `PUT /auth/role` is registered twice (roleSelect then switchRole); the second registration is unreachable dead code** (switchRole at AuthController.php:617 never runs).

33. **P2 · app/Http/Controllers/ChatController.php:190,217,235 — group-create/pin gating checks `users.manage`, a capability that exists nowhere** (catalog has `users.hr.manage`/`users.employee.manage`); access only works by accident via the `projects.manage` fallback.

34. **P2 · app/Http/Controllers/NotificationController.php:21-23 — `importantOnly` filters `priority='high'` only,** dropping `urgent` (suspicious-login uses `urgent`, line AuthController.php:144) — inconsistent with unreadCount (:74-77) which correctly uses high+urgent.

35. **P2 · app/Services/ApprovalService.php:74-85,124-139 — `approve/reject` throw plain `Exception`** ("cannot approve your own request") which TaskController::approve (:379) and ProjectController::review (:236-246) don't catch → 500 instead of 4xx.

36. **P2 · app/Support/HrScope.php:13-15 — adds the HR's own `department_id` beyond the `department_hr` pivot,** so a zero-pivot HR is not an empty scope (deviates from T-20.2 "strict pivot scope; zero-dept HR = empty scope"). Null-safe and try/catch'd otherwise.

37. **P2 · Attendance/leave/users exports are synchronous `streamDownload`, not queued worker jobs** (AttendanceController.php:865, LeaveRequestController.php:327, UserController.php:88) — T-18.5/T-24.8 specify queued + realtime completion; only `/reports/export` is queued.

38. **P2 · Export-completed trigger has broadcast only, no Notification row** (GenerateReportJob.php:67-72) — T-24.3 inventory lists "export completed" as a notification trigger. Also `pdf` format still accepted (:99 ReportController) despite the T-52.5 Excel-only decision.

39. **P2 · app/Events/TaskCompleted.php:185 — `broadcastOn()` returns placeholder `PrivateChannel('channel-name')`** (class isn't ShouldBroadcast, so it's dead code); app/Events/AnnouncementCreated.php:214 broadcasts team-scoped announcements on a **public** channel (`Channel('public-announcements')`) — anyone with the app key can subscribe.

40. **P2 · Dual reaction systems:** API persists reactions into `announcements.reactions` JSON (AnnouncementController.php:110-139) while the demo seeder and a `reactions` polymorphic table exist (Phase42DemoSeeder.php:385-398) — seeded reactions are invisible to the API and vice-versa.

41. **P2 · app/Console/Commands/SendHolidayReminders.php:35-39 — no Feb-29 leap guard** when expanding recurring holidays (T-10.2 guard exists in HolidayController and AttendanceService but not here); reminder `sendGlobalNotification` hardcodes title/type for every use.

42. **P2 · app/Http/Controllers/AuthController.php:221-230 vs 323-332 — session-limit setting keys differ between login (`session.max_devices`) and refresh (`session.max_concurrent`)** — only one can ever be enforced; roleSelect tokens (:365) are created without expiry, bypassing the access-TTL.

43. **P2 · Stray untracked leftovers in apps/api root:** `dump3.txt`, `error_log.json` (raw API error payloads), `fix_controllers.php`, `orphan_sweep.php`, `patch_migrations.php`, `tests_output.log`, `.phpunit.result.cache` — none referenced by composer scripts, CI, or docs (only a narrative mention of orphan_sweep.php in the report) → pure leftovers.

44. **P2 · Tests:** Phase45MicroFeatureVerificationTest.php:90-136 has four `markTestIncomplete` (T-52.3, T-46.16, T-47.6, exports "not fully wired") directly contradicting the report's Phase-52 completion claims; AuthFlowTest.php:78 skips the password-change test ("middleware is disabled"); tests/Unit/ExampleTest.php asserts nothing (`assertTrue(true)`); tests/Feature/Feature/PasswordPolicyTest.php is a mis-nested duplicate; the whole suite runs on SQLite so none of findings 3/4/14 surface.

45. **P2 · AttendanceController::correct (:749-750) — `$targetUser = User::...->first()` then `->department_id` without null check** (soft-deleted user → null-deref 500); `reconcileDay` loads all holidays per call (AttendanceService.php:216) inside the demo seeder's 29-day × N-user loop — heavy N+1.

46. **P2 · app/Console/Commands/ReconcileMigrations.php:22-46 — regex only inspects the first `Schema::create`/first column**; a migration whose first added column exists but later ones don't is marked "ran" (uuid columns aren't even in the type alternation) — can silently mask pending migrations.

## PASS list (verifications that held)

- **CapabilityMatrix deny-before-wildcard** (app/Services/CapabilityMatrix.php:83-93): `SELF_SERVICE_EXCLUDED` checked before `*` — correct; `RequireCapability` middleware consumes it per active role.
- **DatabaseSeeder clears the cache** (DatabaseSeeder.php:79 `CapabilityMatrix::clearCache()`) — T-13.3 holds; catalog includes all required keys (tasks.manage, projects.manage, qa.view/manage, timer.track, reports.view/manage); HR granted projects.manage + qa.manage, HR/employee reports.view, employee timer.track (T-13.2 grants as written).
- **All scheduled command classes exist and signatures match** routes/console.php (`reports:send-weekly-summary`, `passwords:expire-flag`, `reminders:holidays`, `notifications:cleanup`); weekly summary is Sunday 09:00; every ShouldQueue job has a real dispatch path (Schedule::job ×3, GenerateReportJob via ReportController:117, ExportAuditLogsJob via AuditLogController:44, ProcessAuditLogJob via AuditLogger:12).
- **SoftDeletes** applied on Department/Project/Task/User models + migration `2026_08_11_204058` with hasColumn guards.
- **Route → controller method inventory:** all Appendix D groups are present in routes/api.php (auth incl. sessions/preferences/role-select, profile+avatar, directory+send-message, users incl. status/reset/restore/bulk/export/leave-history/assignments/activity, departments incl. archive/restore/hrs/employees/export, designations incl. status/export, attendance full set incl. correct/notify-open-shifts/export, leave full set, holidays CRUD, work-schedules CRUD+default, qa-forms CRUD, projects incl. submit/review/cover/history, tasks incl. submitted/reorder/approve/redo/comments, timer, conversations incl. group/pin/unpin/read, announcements incl. react, quick-notes, pins, notifications ×5, reports ×5, settings grouped/bulk/mail-test, company-profile+logo, audit-logs+export, admin/password-resets ×3, auto-numberings, saved-views, feedback, broadcasting/auth, demo-data seed-status/purge) — no route points to a nonexistent method; `/leave-requests/pending|export` correctly ordered before `{id}`.
- **Notification engine core:** every Notification row goes through `Notification::create` (NotificationService or direct) → `NotificationObserver::created` → `NotificationCreated` broadcast on `private-user.{id}`; no bulk `insert()` bypasses remain (RemindShiftStart/AlertMissedClockIn/FlagOpenShifts all loop through NotificationService despite building arrays first); leave submitted/decided via listeners; suspicious-login, session-revoked, attendance-corrected, task-assigned, @mention-with-snippet all real.
- **AttendanceService null-safety & state machine:** cached-schedule scalar handling (:108-116), per-call try/catch with degraded row (:260-275), multi-segment sum, midnight-crossing attribution (48h window + first-clock-in-date grouping), holiday-aware status, immutable event log with client_id idempotency and validation of punch transitions.
- **Migrations are idempotent:** every inspected table-altering migration uses hasTable/hasColumn guards (demo_tag ×3, soft deletes, submission fields, allow_employee_tasks, priority, user_agent, etc.).
- **HrScope is null-safe** (try/catch → `[]`, null dept guarded) and the pivot relation is used in attendance/leave/users scoping.
- **Security hygiene:** `.env` is not git-tracked (only `.env.example`); no `dd/dump/var_dump/print_r/Log::debug` in app/routes/database (only `dd()` inside RoleMatrixTest failure paths).
- **Users/{id} authz** (UserController::show isSelf‖caps) implemented per T-14.1; self-service punches correctly 403 for super_admin via the deny-list.