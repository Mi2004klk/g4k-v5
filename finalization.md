# finalization.md — The Definitive Finalization Plan (production-ready, day-to-day usable)

> **What this is.** The single execution plan that takes the current codebase to a fully functional, deployable,
> production-ready application per `context.md` (the authoritative source of truth). It consolidates planning
> rounds v1–v7 (archived in `docs/archive/planning/`), six deep code audits, and **live production probes**
> (Admin/HR/Employee logins; 43 endpoints × 3 roles; 2026-08-14). Every task states: **problem (verified) →
> intended behaviour → scope (FE/BE/DB) → permissions → dependencies → edge cases → acceptance criteria**.
>
> **Execution discipline (non-negotiable).**
> 1. **Phases run in dependency order** (§Order). Within a phase, tasks are independently implementable.
> 2. **A task is DONE only when its acceptance criterion passes on the LIVE deployment** for the correct role —
>    never on local code. (Historical failure mode D0: fixes stayed local; prod never changed.)
> 3. No placeholders, no mocks, no try/hide patches, no manual-refresh workarounds — root-cause fixes only.
> 4. After each phase: commit → deploy via the Phase-1 pipeline → run the phase's acceptance → only then proceed.
> 5. **Do not modify archived planning docs.** Update `context.md` §12 (current-state) when a blocker clears.
>
> Priority tags: **P0** = blocks core use · **P1** = broken/miswired workflow or binding spec gap · **P2** =
> completeness/polish required for the production standard.
>
> **Rev 2 (2026-08-14, additive — nothing removed):** adds **Group 7 — Demo-Data Subsystem & Production Cutover**
> (Phases 41–45: real-DB demo architecture, dataset execution via real services, scenario walkthroughs,
> admin teardown/cutover, micro-feature verification sweep), **Appendix C** (per-page conformance task inventory —
> every route enumerated), **Appendix D** (per-endpoint contract/role matrix as task units), and demo criteria in
> the Completion Standard. All Rev-1 phases/tasks preserved verbatim; demo policy is canonical in `context.md` §10.7.
>
> **Rev 3 (2026-08-14, additive — nothing removed):** adds **Group 8 — Code-Verified Module Corrections**
> (Phases 46–51) from four new deep audits (Projects/Tasks module, Chat/Settings/Profile/Directory modules,
> tables+a11y+responsive standards, cross-app consistency). These findings supersede earlier "partial/unverified"
> assessments with exact file:line defects — most notably: the tasks module renders permanently empty
> (wrong unwrap), task mutations never refetch (exact-key no-ops), project approve/redo always 422s
> (payload contract), five complete settings components are never mounted, no table is actually sortable,
> and light-theme status colours fail WCAG AA. All prior tasks remain; where Rev-3 findings intersect Rev-1
> tasks (e.g. T-21.x, T-22.x, T-24.x), the Rev-3 file:line specifics define the implementation detail.
>
> **Rev 4 (2026-08-14, additive — nothing removed):** adds **Appendix F — Requirement Traceability Matrix**
> (every spec bullet §1–§9 mapped to verified status + owning task; current verdict ≈30 ✅ / 55 ⚠️ / 25 ❌ / 10 💀)
> and **Phase 52** (final gap-sweep findings: login tooltip text deviation, missing day-detail UI, HR project
> image attachments, one-field mobile forms, Excel-vs-PDF spec-conflict decision, employee self-create-task policy).
> The matrix doubles as the live sign-off sheet — done = every row ✅ on production.
>
> **Rev 4.1 (numbering correction):** the execution-order spine originally promised "G4 COMMS: Phases 25–28", but
> the authored content compressed all of G4 into Phases 23–24 (a drafting slip — spine ranges were provisional;
> G3 actually ends at Phase 22). Fixed: Phase 24 decomposed into Phases 24 (notifications engine) + 25
> (announcements/notes/pins) + 26 (reports/exports) + 27 (audit/weekly email); new **Phase 28** (comms exit gate)
> added; spine corrected to G3 15–22 / G4 23–28 / G8 46–52. **All task IDs preserved** — every T-24.x reference in
> Appendices A/F remains valid.

---

## EXECUTION ORDER (dependency spine)

```
G0 PIPELINE      : Phases 1–7    (deploy-sync, workers, realtime, storage, migrations, contracts, security)
G1 UNBLOCK       : Phases 8–10   (employee onboarding D1, attendance 500s D2, leave 500s D3, holidays D4)
G2 AUTH+RBAC     : Phases 11–14  (session reliability, capability matrix, endpoint authz, FE gating)
G3 CORE DOMAINS  : Phases 15–22  (attendance, leave, org, projects, tasks)
G4 COMMS         : Phases 23–28  (chat, notifications engine, announcements/notes/pins, reports+exports, audit+weekly email, comms exit gate)
G5 UX ENGINE     : Phases 29–36  (spacing system, states, tables, widgets, forms, layout customisation, nav, mobile+offline)
G6 DATA+LAUNCH   : Phases 37–40  (seed dataset, verification, hardening, sign-off)
G7 DEMO+CUTOVER  : Phases 41–45  (demo architecture, dataset via real services, scenario walkthroughs, teardown/cutover, micro-feature sweep)
G8 REV-3 FIXES   : Phases 46–52  (code-verified module corrections: projects/tasks, chat, settings, tables, a11y, responsive+consistency, Rev-4 residuals)
```
Parallel after G1: G3 streams (attendance∥leave∥org∥projects∥tasks) and G4 can interleave; G5 phases 29–31
(spacing, states, primitives) must precede page-level UX polish since every page consumes them.

---

# GROUP 0 — PIPELINE & RUNTIME (everything depends on this)

## Phase 1 — Deploy pipeline (kills D0)
**T-1.1 Single-source CI pipeline** `P0` · all · *Problem:* local fixes absent in production (holidays array-fix local vs corrupted live); two GitHub repos drift from the canonical monorepo. *Build:* CI on merge→main builds BE (Cloud Run) + FE (Vercel) together; document exact commands; no manual deploys. *Edge:* partial deploys (new FE/old BE) — deploy both or neither; emit build-id. *Accept:* no-op commit → both services redeploy; live `GET /holidays` returns a JSON array (end-to-end proof D0 is dead).
**T-1.2 Authenticated smoke + gates** `P0` · *Build:* CI logs in as the 3 demo accounts → asserts 200 on `/dashboard/init`,`/notifications`,`/directory`; `php artisan migrate:status` gate (0 pending); `pnpm --filter web build` zero-error gate. *Edge:* demo creds via CI secrets. *Accept:* regression build fails CI.
**T-1.3 Stale-build guard** `P1` · *Build:* FE checks build-id on interval → "New version available — reload" prompt; SW cache-busting. *Accept:* deploy → open tab prompts within 60s.

## Phase 2 — Queue worker + scheduler (kills D5)
**T-2.1 Queue worker** `P0` · *Problem:* no `queue:work`; every `ShouldQueue` artifact dead (exports, reminders, leave→attendance integration, task→chat, audit jobs). *Build:* dedicated Cloud Run `g4k-worker` (`php artisan queue:work database --tries=3 --backoff=60 --max-time=3600`). *Edge:* poison jobs → failed-jobs alerting; health check. *Accept:* dispatched job drains; approval writes fresh `audit_logs` row ≤5s.
**T-2.2 Scheduler** `P0` · *Problem:* `routes/console.php` schedules never fire. *Build:* Cloud Scheduler → `g4k-scheduler` (`schedule:run`) per minute; `withoutOverlapping`; tz `Asia/Kolkata`. *Accept:* `schedule:list` shows "ran" within 2 min.
**T-2.3 Job visibility** `P2` · admin Settings tab: pending/failed counts + retry. *Accept:* failed job visible + retryable.

## Phase 3 — Realtime transport (kills D6)
**T-3.1 Pusher standardization** `P0` · *Problem:* `.env`/code = Reverb → API's own URL (no WS server); `cloudbuild` = Pusher. *Build:* `BROADCAST_CONNECTION=pusher`; `PUSHER_*` = `g4k_live_3829/g4k_key_3829/g4k_secret_3829/ap2` in env+secrets; delete REVERB_*. *Accept:* chat message → other tab live; notification → bell badge live in tab B.
**T-3.2 Channel authorization** `P0` · *Build:* `routes/channels.php` authorizes `private-user.{id}` (self), `private-conversation.{id}` (member), `presence-org`, role/dept approval channels. *Edge:* revoked membership denied. *Accept:* non-member `/broadcasting/auth` → 403.

## Phase 4 — Storage (Supabase S3)
**T-4.1 Path-style + single disk** `P0` · *Problem:* `AWS_USE_PATH_STYLE_ENDPOINT=false` (Supabase needs true) + duplicate `s3`/`supabase` disks + mixed usage → avatar/logo 500. *Build:* set true in env+secrets; delete `supabase` disk; all uploads `Storage::disk(config('filesystems.default'))`. *Accept:* avatar upload 200, public URL renders.
**T-4.2 Upload guardrails + popup** `P1` · mime/size validation (avatars 2MB jpg/png/webp; project+chat images 5MB); clean limits popup (spec §6). *Accept:* oversized → clear 422 field error; valid → success.

## Phase 5 — Migrations & schema integrity
**T-5.1 Idempotency pass** `P0` · ~44 non-idempotent migrations → `hasColumn`/`hasTable` guards; `CREATE INDEX IF NOT EXISTS`; FK/constraint adds guarded via `pg_constraint`. *Accept:* re-run `migrate` on live = no-op.
**T-5.2 Reconcile migrations table** `P0` · insert schema-present-but-Pending rows; run genuinely pending. *Accept:* 0 Pending live.
**T-5.3 FK/orphan/SoftDeletes hygiene** `P1` · enforce FKs (`work_schedule_id`, `department_hr`, `project_members`, assignees, `approvals.approvable_*`); orphan sweep; apply `SoftDeletes` trait (Dept/Project/Task — imported, not applied); resolve `archived_at` vs `deleted_at` (keep one). *Accept:* scripted orphan check clean; soft-delete excludes + restores.

## Phase 6 — API contracts
**T-6.1 One list convention** `P1` · every list → `{data:[…]}` + paginator meta; wrap bare-array stragglers (`/holidays`,`/announcements`,`/quick-notes`,`/pins`,`/qa-forms`,`/saved-views`,`/auto-numberings`,`/reports/exports`,`/work-schedules`). *Accept:* contract tests assert shape for all lists.
**T-6.2 FE array-guard helper** `P1` · shared `asArray(res)`; fix remaining traps (`quick-task-widget.tsx:23`, profile designations). *Accept:* no `.find/.map is not a function` under any payload.
**T-6.3 Error contract** `P1` · 422+`{message,errors{field}}`, 403/404 semantics; FE maps to field errors/toasts. *Accept:* invalid leave dates → 422 with field errors under fields.

## Phase 7 — Security
**T-7.1 Rotate + purge secrets** `P0` · (leaked in chat + committed `.env`): Supabase service-role/DB/JWT, AWS, GitHub PATs, APP_KEY, Pusher; purge `.env` from history; `.gitignore`. *Accept:* `git log --all` clean; old creds rejected.
**T-7.2 Role-matrix test pack** `P1` · every endpoint × 3 roles → expected 200/403, CI-enforced. *Accept:* suite green; regressions fail builds.

---

# GROUP 1 — UNBLOCK THE APP (live-verified blockers)

## Phase 8 — Onboarding gate (kills D1)
**T-8.1 Unblock demo employee** `P0` · employee · *Problem:* `onboarded_at=null` → `ForceOnboarding` 403 `needs_onboarding` on all 43 endpoints. *Build:* seed onboards demo accounts; verify `completeOnboarding` from UI. *Accept:* employee login → `/dashboard/init` 200.
**T-8.2 Onboarding UX** `P1` · welcome/setup guide (profile → password → tour of clock/tasks/chat); skippable-but-completable; resumable. *Accept:* new seeded user completes → dashboard.
**T-8.3 Gate correctness** `P1` · allowed routes exactly {logout, onboarding, role-select, sessions, change-password}; FE routes 403 `{needs_onboarding}` → onboarding screen; logged-out deep-links → login. *Accept:* no blank/infinite-spinner states in either condition.

## Phase 9 — Attendance 500s (kills D2)
**T-9.1 Null-safe reconcileDay** `P0` · HR/Admin · *Problem:* team views loop `reconcileDay` per user with cached `work_schedule` stdClass; dangling `work_schedule_id` → null-deref → 500 on `/attendance/team-today`,`/hr/today`,`/admin/overview`. *Build:* null-guard `$schedule` (defaults `09:00`, `31500s`, `10min`); cache scalars not objects; per-user try/catch (one bad user degrades a row, never the endpoint). *Accept:* live 200 all three endpoints with per-user rows.
**T-9.2 Default work schedule** `P1` · exactly one `is_default`; settings UI to set it; new users inherit. *Accept:* schedule-less user reconciles on defaults.
**T-9.3 Schema/column reconciliation** `P1` · attendance tables match controller selects (Phase 5 covers mechanism). *Accept:* zero `SQLSTATE[42703]` in 24h logs.

## Phase 10 — Leave-approvals 500 + holidays corruption (kills D3, D4)
**T-10.1 Fix `/leave-requests/pending`** `P0` · HR/Admin · *Problem:* 500 live (morphOne `approval` serialization vs `HrScope` — confirm via Cloud Logging). *Build:* standardize `LeaveRequest` on ONE approval relation; `HrScope` try/catch → `[]`. *Accept:* live 200 admin+HR.
**T-10.2 Holidays integrity** `P0` · all · *Problem:* prod response `__PHP_Incomplete_Class` (model-instance caching in old build; local already array-maps — deploy gap). *Build:* array-map version deployed; recurring Feb-29 leap guard; `Cache::forget("holidays_{year}")`. *Accept:* live `GET /holidays` → JSON array; calendar + widgets render.

---

# GROUP 2 — AUTH & RBAC

## Phase 11 — Session reliability
**T-11.1 End idle forced logout** `P1` · *Problem:* 15-min `g4k_token` cookie only re-set in `setAuth`; middleware gates on it → valid sessions bounced. *Build:* refresh cookie on every successful `apiFetch` + `visibilitychange` heartbeat. *Accept:* 20-min idle navigation stays logged in.
**T-11.2 Refresh/revoke UX** `P1` · refresh failure → clean `/login?reason=expired`; remote revoke → `.session.revoked` → target tab logs out. *Accept:* both flows proven, no stuck loaders.
**T-11.3 Capability-cookie race** `P1` · echo `capabilities` in login/role-select/refresh; write cookie immediately. *Accept:* login → immediate protected nav → no false unauthorized.

## Phase 12 — Login/lockout/suspicious
**T-12.1 Login screen spec** `P1` · landscape logo (assets), welcome line, footer "Games4King Workplace OS" + info tooltip "Gen2k Conglomerate (2018) • Milestone 1"; password toggle; loading; error retains values. *Accept:* visual spec match.
**T-12.2 Lockout** `P1` · 5 fails/10 min → countdown message; auto-unlock. *Accept:* 6th attempt blocked with time; post-window retry works.
**T-12.3 Suspicious-login notify** `P2` · new device/IP/UA heuristic → high-priority notification to all HR+Admin. *Accept:* triggered on new-UA login.
**T-12.4 Forgot/reset dual path** `P1` · SMTP reset link AND admin-approval in-app queue (approve → issue link); redirect to sign-in after set. *Accept:* both paths reach password-set + login.

## Phase 13 — Capability matrix (single source)
**T-13.1 Wire deny-list before wildcard** `P0` · *Problem:* `SELF_SERVICE_EXCLUDED` defined but `hasCapability()` short-circuits `*` first → admin write-path unproven. *Build:* deny-check BEFORE `*` (BE); FE already has it. *Accept:* live `POST /attendance/clock-in` admin → 403; HR/employee → 200.
**T-13.2 Catalog completion + grants** `P1` · add `tasks.manage, projects.manage, qa.view/manage, timer.track, reports.view/manage` to catalog+seeder; **grant HR `projects.manage` + `qa.manage`** (spec; live HR 403 on qa-forms contradicts); **grant HR+Employee `reports.view`** (live 200 is fallback-masked); employee `timer.track`. Re-verify HR 403 on `projects/{id}`/`tasks/{id}` (scope fix T-14.2). *Accept:* seeded role-matrix suite green.
**T-13.3 Post-seed cache clear** `P0` · `DatabaseSeeder` → `CapabilityMatrix::clearCache()`. *Accept:* re-seed effective immediately.
**T-13.4 Admin boundary audit** `P1` · admin sees NO self-service surfaces (Time Clock widget, nav, FAB, command-palette actions, attendance page → redirect to org view) while retaining own profile/devices/password/announcements. *Accept:* 5-surface UI audit zero leaks + API 403.

## Phase 14 — Endpoint authz + FE gating
**T-14.1 `GET /users/{id}` authz** `P0` · isSelf‖canView. *Accept:* emp A→emp B = 403; HR scoped = 200; admin = 200.
**T-14.2 HR project/task visibility** `P1` · show-scope = created-by ‖ team-member ‖ manages-creator's-dept; list-view broad, detail scoped. *Accept:* HR opens every project in its list without 403.
**T-14.3 Employee isolation sweep** `P1` · self-scope every employee list (attendance/leave/tasks/notes/pins/submissions). *Accept:* employee token cannot fetch another employee's data (403).
**T-14.4 FE gating consistency** `P1` · Communications nav → `chat.access`; avatar Settings hidden without `settings.manage`; palette clock actions behind `attendance.clock-self`; admin console+reports nav entries; `/dashboard/reports` in PROTECTED map; shared permission-denied screen. *Accept:* role screenshot audit exact.

---

# GROUP 3 — CORE DOMAINS

## Phase 15 — Time clock workflow
**T-15.1 Punch state machine E2E** `P1` · clock_in→break→out→**continue shift** (multi-segment sum); idempotent repeat clock-in; in-flight disable+spinner. *Accept:* full cycle E2E incl. double-segment day.
**T-15.2 Timer semantics** `P1` · HH:MM:SS; persists across navigation; amber OT; stops ONLY on End Shift; server "as-of" worked time when open shift. *Accept:* navigate away/back → timer continues; matches server ±2s.
**T-15.3 Offline punches** `P2` · queue locally, sync on reconnect, reconcile. *Accept:* offline punch appears after reconnect.
**T-15.4 Mobile attendance widget** `P2` · full-width green Start → timer+Break+End; ≥48px; most prominent mobile element. *Accept:* 360px audit.

## Phase 16 — Calculations
**T-16.1 Late + timezone** `P0` · *Problem:* schedule parsed as UTC → IST 09:00 looks 5.5h early → late NEVER computed. *Build:* company-tz setting (default `Asia/Kolkata`); scheduled-start built in tz; grace from schedule. *Accept:* 09:30 IST vs 09:00+10' → late≈20min + Late badge.
**T-16.2 Overtime** `P1` · worked−standard (closed+open); badge; **separate heat-map colour** (spec). *Accept:* 10h vs 8.75h std → OT in summary+calendar.
**T-16.3 Breaks/multi-segment/midnight** `P1` · break excluded; continue-shift second segment counted; midnight-crossing attributed to shift-start date. *Accept:* scripted day (10:00→12:00,13:00→18:00,+30m break) → worked 6h30m.
**T-16.4 Holiday/leave-aware reconcile** `P2` · holiday → status holiday; approved leave → on_leave. *Accept:* holiday date never absent/late.

## Phase 17 — Reminders
**T-17.1 Shift 15-min-before** `P1` · employee alert (worker live); times configurable. *Accept:* fires at configured time.
**T-17.2 Missed-clock 30-min-after → HR** `P1` · per-employee to managing HR; respects `working_days` (not hardcoded Sunday). *Accept:* no-show → HR bell.
**T-17.3 Reminder delivery** `P2` · via `Notification::create` (observer → live bell), deduped/day. *Accept:* bell live; no duplicates.

## Phase 18 — History/graphs/correction/export
**T-18.1 History + heat map + day detail** `P1` · own history (employee post-D1); 6 distinct colours (present/late/OT/leave/absent/holiday); day dialog (clock-in/breaks/out/total/projects/tasks). *Accept:* seeded 4-week history renders.
**T-18.2 HR/Admin day drill-down** `P1` · any scoped employee's full day. *Accept:* HR opens managed employee's day.
**T-18.3 Graphs** `P1` · weekly/monthly toggle; per-employee (HR); company (Admin); real aggregates; empty → "No data for this period". *Accept:* renders real counts.
**T-18.4 Manual correction** `P1` · `firstOrFail` (404 not 500); add/edit/remove event + reason + audit; capability-gated. *Accept:* correction recomputes day + audit row.
**T-18.5 Attendance export** `P1` · queued Excel honoring filters (date/dept/person); realtime completion. *Accept:* export → file downloads.

## Phase 19 — Leave workflow + balance (new subsystem)
**T-19.1 Balance schema + allocation** `P0` · `leave_balances(user_id,type,year,allowed,used)`; allocate on create + year rollover; admin-configurable defaults. *Accept:* new user has balances; rollover resets.
**T-19.2 Request E2E** `P1` · future-only themed calendar; type; reason; self-overlap 422; routing emp→HR / HR→Admin; balance warn/hard-block per setting; **approver sees requester balance**. *Accept:* over-balance blocked per policy; approver notified.
**T-19.3 Decision + status + cancel** `P1` · approve/reject (+reason) → status flip, notification, audit, **balance deduct/restore (atomic)**; cancel own pending. *Accept:* full chain visible ≤5s; balance consistent.
**T-19.4 Approvals id contract** `P0` · resolve decision by `approvable_type+approvable_id` (dashboard widget AND leave page both work); cache-bust with right id. *Accept:* approve from dashboard widget → 200.
**T-19.5 Balance visibility** `P2` · employee per-type remaining chips. *Accept:* matches DB.

## Phase 20 — Organisation
**T-20.1 Departments** `P1` · admin-only CRUD (name, description); assign multiple HR + employees; full member lists; archive/delete w/ confirm. *Accept:* members correct; archive excludes.
**T-20.2 HrScope correctness + multi-HR** `P0` · strict `department_hr` pivot scope everywhere; zero-dept HR = empty scope + friendly empties; two HRs disjoint depts no bleed. *Accept:* seeded dual-HR isolation test.
**T-20.3 User create/edit/lifecycle** `P1` · create HR/employee (auto employee-ID, dual-role); edit; dept/team reassign propagates scope; deactivate (login blocked, data kept); soft-delete + restore; reset password (direct + approval queue); activity-log tab. *Accept:* created employee chains into onboarding (Phase 8).

## Phase 21 — Projects
**T-21.1 CRUD + visibility** `P1` · HR+Admin create; admin all; HR scoped; employee assigned-only (name/desc/priority/deadline/progress/status). *Accept:* visibility matrix per role.
**T-21.2 Team + auto-access** `P1` · search+add; added → project+tasks+chat instantly; removed → revoked. *Accept:* access flip proven.
**T-21.3 Project chat auto-create** `P1` · conversation per project with creator+team. *Accept:* new project → chat exists.
**T-21.4 Sorting** `P2` · Created/Deadline/Priority × asc/desc (URL state). *Accept:* each verified.
**T-21.5 Work timer** `P1` · per-project Start/Pause/Resume/End (BE exists); HH:MM:SS; amber OT; logged per project/day; appears in day detail. *Accept:* 2h logged → project + day detail.
**T-21.6 Completion flow** `P1` · Complete Project + report → pending-review; HR+Admin notified; approve/redo(reason); result on dashboard+history. *Accept:* cycle E2E.
**T-21.7 Progress computation** `P2` · real task-derived %. *Accept:* matches task states.
**T-21.8 History + Gantt** `P2` · completed log (team/tasks/time/date/result); Timeline View (bars start→deadline + task diamonds; no-deadline edge). *Accept:* seeded data renders both.

## Phase 22 — Tasks
**T-22.1 CRUD + attributes** `P1` · priority Low/Med/High/Urgent; scope Global/Dept/Role; due date; assign one/many/project-wide; edit/reassign. *Accept:* each scope's visibility for targets.
**T-22.2 My Tasks** `P1` · private non-project list; HR/Admin assignable; employee self-create. *Accept:* private; assignable.
**T-22.3 Dependencies** `P1` · `blocked_by` (BE cycle-check exists) exposed in create form; blocked shows "Blocked by X" + start prevented UI+server. *Accept:* B blocked until A approved.
**T-22.4 Recurrence** `P1` · advanced-collapsed (Daily / Weekly-on-days / Monthly-on-date); auto-recreate on completion; HR notified per completion; turn-off. *Accept:* complete daily → tomorrow instance; disable stops.
**T-22.5 Submission + QA + note** `P1` · progress updates; complete+submit **after QA form** (required-unfilled blocks) + brief note; status badges amber/green/red. *Accept:* blocked without QA; with QA → review.
**T-22.6 Approval cycle** `P1` · approve/redo → status + notify + dashboard approval-panel refresh + audit. *Accept:* ≤5s visible to employee.
**T-22.7 Kanban + reorder** `P1` · To Do/In Progress/Under Review/Done; drag → status persists; list↔kanban toggle; manual drag-reorder persisted. *Accept:* survives reload.
**T-22.8 Comments + personal reminders** `P2` · task comments (realtime); employee reminder datetime → bell. *Accept:* both fire.
**T-22.9 Quick-task cycle** `P1` · dashboard widget → appears in employee list ≤5s; completion → auto-post Global Chat. *Accept:* both proven live.

---

# GROUP 4 — COMMUNICATIONS & REPORTING

## Phase 23 — Chat
**T-23.1 Global + DM + realtime** `P0` · optimistic send; live receive; unread border+badge; mark-read on open; DM from directory. *Accept:* two-tab live test.
**T-23.2 Project chat** `P1` · members-only channel auth; task-completion alerts auto-post. *Accept:* non-member 403; alert posts.
**T-23.3 Custom groups** `P1` · BE conversation `type=group` + membership; HR creates/adds; employees see added-only. *Accept:* non-member can't see/join.
**T-23.4 @mention** `P1` · `@` → chat-members dropdown; insert; mentioned user notified w/ snippet. *Accept:* notification lands.
**T-23.5 Read receipts (DM)** `P2` · `read_at`; sender ✓✓ live. *Accept:* updates live.
**T-23.6 Pin messages (HR, project chats)** `P2` · pinned stay top. *Accept:* survives reload.
**T-23.7 File/image sharing** `P1` · attach w/ limits popup (Phase 4); previews; download. *Accept:* renders for receiver.
**T-23.8 Mobile chat + offline** `P2` · list→fullscreen, back, input above keyboard; "Not connected" + queue. *Accept:* 360px + airplane drill.

## Phase 24 — Notifications engine (bell, priority filter, trigger matrix)
> *Rev 4.1 numbering correction: the original spine promised Phases 25–28 for G4, but the content was compressed into Phases 23–24. Phase 24 has been decomposed — T-24.1–4 remain here (notifications engine); T-24.5–6 → Phase 25; T-24.7–9 → Phase 26; T-24.10–11 → Phase 27; Phase 28 adds the comms exit gate. Task IDs are unchanged so every appendix cross-reference remains valid.*
**T-24.1 Engine correctness** `P0` · all via `NotificationService` + `Notification::create` (observer→broadcast); replace bulk inserts; fix `SendHolidayReminders` method; fix `ApprovalSubmitted` channel (role/dept presence, after-commit). *Accept:* every trigger → live bell + row + preferences respected.
**T-24.2 Bell = high-priority only** `P1` · badge counts high/system-global only; full history page; mark read/all. *Accept:* low-priority doesn't inflate badge.
**T-24.3 Trigger inventory** `P1` · matrix test: leave submitted/decided, task assigned/submitted/decided, project submitted/decided, announcements, holiday-10-day, shift 15/30-min, missed-clock, session, suspicious login, feedback, export completed — exactly once each. *Accept:* green.
**T-24.4 Notification Center (in Chat)** `P1` · leave requests, task/project submissions, announcements, holiday reminders, feedback — each deep-links. *Accept:* five categories render+link.
## Phase 25 — Announcements, Quick Notes & Pinned Items (decomposed from Phase 24)
**T-24.5 Announcement board** `P1` · admin company / HR team; pin; reactions (no comments); notify; dashboard surface + close-X persisted. *Accept:* post → dashboards + bell; reaction persists.
**T-24.6 Quick notes + pinned items** `P2` · private notes; pin note to dashboard; pin projects/tasks/profiles → sidebar Pinned quick-jump. *Accept:* private; navigates.
## Phase 26 — Reports & Exports (decomposed from Phase 24)
**T-24.7 Reports set** `P1` · attendance (range/dept/person), project completion, task stats, productivity; HR limited; employee own attendance. *Accept:* real data; empty states.
**T-24.8 Excel exports** `P1` · queued, filter-honoring, realtime completion. *Accept:* file lands.
**T-24.9 Productivity formula + leaveSummary** `P2` · documented meaningful metric (not hours×completion); overlap predicate for leave windows. *Accept:* sane values; spanning leave counted.
## Phase 27 — Audit Log & Weekly Summary Email (decomposed from Phase 24)
**T-24.10 Audit log** `P1` · page w/ filters + export; worker-backed continuity; per-user + per-item (project/task Activity tab: "Created by X…/Assigned to Y…/Progress…/Submitted…/Approved by…"). *Accept:* 10 actions → 10 rows; item timelines render.
**T-24.11 Weekly summary email** `P1` · Sunday 09:00 to Admins (+HR per code); metrics; SMTP + retry. *Accept:* test run delivers.

## Phase 28 — Comms cross-module exit gate (G4 verification; new in Rev 4.1)
**T-28.1 Realtime matrix proof** `P0` · all comms events live on production: `.message-sent` (chat), `.notification-created` (bell), `.AnnouncementPosted` (board), `.approval-status-change`, `.ExportCompleted`, session-revoke — each observed arriving in a second tab, with the correct query keys invalidated. *Accept:* six-event matrix recorded green.
**T-28.2 Trigger-inventory E2E** `P0` · execute every T-24.3 trigger through the UI (not factories) on the demo dataset; each fires exactly once, respects preferences, high-priority routing correct (bell vs Notification Center vs Chat center). *Accept:* signed trigger matrix, zero duplicates/misses.
**T-28.3 Comms cache-invalidation map** `P1` · verify: message send → conversations+messages+unread; announcement post/react/pin → dashboardInit; notification read → notifications+unreadCount; export complete → reports/exports; offline replay → same keys. *Accept:* scripted matrix — no comms view requires refresh.
**T-28.4 Unread/read lifecycle** `P1` · unread border+badge appear (T-47.2), clear on open, receipts update live (T-47.3), mark-all works from bell and center. *Accept:* two-account live drill passes.

---

# GROUP 5 — UI/UX ENGINE (binding standards from context.md §8)

## Phase 29 — Compact spacing system (application-wide)
**T-29.1 Spacing token system** `P1` · all · *Problem:* inconsistent padding/margins; components crowding/detaching/stuck to edges; no single rhythm. *Build:* define 4/8px scale utilities (`gap-2/3/4`, `p-4/6`, section spacing) in `globals.css` `@theme`; document page anatomy: page-header → filter-bar → content → pagination with fixed vertical rhythm; card internal padding uniform; sibling gaps uniform. *Accept:* spacing audit checklist per page — zero edge-touching, zero overlaps, uniform rhythm on every audited screen (all roles).
**T-29.2 Layout/alignment sweep** `P1` · grids never broken; consistent header/action/filter/content anatomy on EVERY page (one coherent system); predictable alignment (left text/right numbers); visual grouping via consistent card hierarchy. *Accept:* side-by-side page-anatomy screenshots match the standard.

## Phase 30 — Component primitives correctness
**T-30.1 Calendar v9 migration** `P0` · *Problem:* react-day-picker **v8 classNames on v9.14** → selection/today/disabled/range styling silently dropped on every themed picker. *Build:* migrate keys (`selected,today,disabled,outside,range_start/middle/end` + structural `month_caption,button_previous/next,month_grid,weekdays,weekday,week`). *Accept:* every picker shows themed states.
**T-30.2 DataTable standard** `P1` · `isLoading` + skeleton rows; sticky header; mobile card layout; column hierarchy identity→status→dates→actions; sane widths; row density; in-table empty/error; row-actions menu. *Accept:* audited tables (users, attendance, leave, tasks, reports, audit) all conform.
**T-30.3 Inputs/forms controls** `P1` · consistent heights/focus rings; themed single-date filter (replace native in FilterBar); mail-smtp raw inputs → themed; `PasswordInput` everywhere for secrets. *Accept:* control audit zero deviations.
**T-30.4 Dead code removal** `P2` · `TopbarTimer`, orphan `sessions/error.tsx`, DataTable virtualizer dead code, dead NavItem prefetch branches, duplicate theme-provider. *Accept:* grep-clean.

## Phase 31 — States, feedback, confirmation (every page/widget)
**T-31.1 Full state coverage** `P0` · skeleton (content-shaped) / isolated error+retry / meaningful empty (spec copy + illustration + action) / disabled-while-submitting / permission-denied screen / validation under fields on typing-pause. Sweep: attendance page, approvals-tab, leave-history (currently renders `null` while loading), report-builder, profile, notifications-config, + every list. *Accept:* state-matrix audit — zero blanks/misleading empties/never-resolving loaders.
**T-31.2 Toasts + confirmations** `P1` · top-right 4s + X; green/red/amber/blue; **one toast per event** (dedupe global vs per-mutation); "Are you sure?" red-confirm on ALL destructive actions (delete/deactivate/reject/end-session). *Accept:* sweep clean.
**T-31.3 Tooltips + truncation + progress animation** `P2` · icon-only buttons labelled (timer pause, bell w/ unread count); truncated text → full on hover; progress bars animate 0→value. *Accept:* audit.
**T-31.4 Inline editing** `P2` · pencil-on-hover → in-place field (task/project/dept names); Enter save / Esc cancel. *Accept:* rename without navigation.
**T-31.5 Keyboard shortcuts** `P2` · Ctrl+K palette; **Ctrl+N context-aware** (task page→new task; projects→new project); **Ctrl+/ help overlay**; Esc closes; Enter submits. *Accept:* each key verified.
**T-31.6 Autosave drafts** `P2` · 30s autosave (extend `useFormDraft`); return banner "You have an unsaved draft. Continue editing?" + restore. *Accept:* close tab mid-form → banner.

## Phase 32 — Widgets (dashboard component standards)
**T-32.1 Widget contract** `P1` · every widget: real data source (no decorative/placeholder), independent load/error (ErrorBoundary verified), per-widget refresh icon on hover, click-through deep link, skeleton/error/empty states, responsive within grid. *Accept:* per-widget audit table green.
**T-32.2 Widget data correctness** `P1` · Admin set (employees active/inactive, active projects, today present/absent/late, pending approvals w/ quick access, dense activity feed, quick task); HR set (present/absent/late, projects, pending leave, pending submissions, quick task + TimeClock); Employee set (active projects, pending tasks, attendance widget right-side + live timer, recent-task progress bar, approval-status panel). Verify each metric against DB. *Accept:* per-role screenshots cross-checked to DB values.
**T-32.3 Stale-widget fixes** `P1` · announcement-board dead key → `dashboardInit`; quick-task dead key + array trap; `recent-activity` select/read shape; upcoming-holidays `safeFormat`; employee approval-status guard; dead imports removed/used. *Accept:* mutate → widget updates ≤5s.

## Phase 33 — Layout customisation lifecycle (binding subsystem)
**T-33.1 Stop save-on-mount overwrite** `P0` · all · *Problem:* `widget-engine` wires `onLayoutChange` directly to the `PUT /auth/preferences` — react-grid-layout fires it on initial render, so a **page refresh can save the default layout over the user's saved layout**. *Build:* suppress persistence until (a) preferences loaded AND (b) first user-initiated drag/resize (dirty flag). *Accept:* refresh 5× → saved layout unchanged (DB-verified).
**T-33.2 Reconciliation on load** `P1` · merge saved+current available widgets: **add missing at defaults, drop stale/unknown ids, clamp to current cols/breakpoints, repair zero/invalid geometry**; never destroy valid preferences. *Build:* single `reconcileLayout(saved, availableWidgets, colsMap)` pure function + tests. *Accept:* inject outdated/invalid saved layout (unknown id, overflow x/y, zero h) → renders clean merged layout.
**T-33.3 Schema versioning + stable read** `P1` · `dashboard_layout: {version: 1, layouts: {lg..xxs}}`; fix double-nesting read (`preferencesData.dashboard_layout || preferencesData.preferences?.dashboard_layout` — pick canonical path); bump-version migrator. *Accept:* versioned round-trip persists.
**T-33.4 Persistence lifecycle E2E** `P0` · initial load (no prefs) → balanced responsive default → customize (reorder/resize) → save → **reload** → logout/login → **second device** → saved layout loads → reconciles → renders → edit → save again. Debounced save (500ms); last-write-wins across devices (never corrupt); per-user isolation (user A's layout never loads for user B). *Accept:* scripted lifecycle passes incl. cross-device.
**T-33.5 Responsive integrity** `P1` · per-breakpoint layouts (cols 12/10/6/4/2) never overlap/clip/overflow; dismissed widgets stay dismissed (persisted); re-enable path in UI. *Accept:* 360/768/1024/1280/1536 screenshots per role.

## Phase 34 — Navigation & information architecture
**T-34.1 Role sidebars per spec** `P1` · implement §2.10 structures exactly (Admin: Team group w/ Attendance+HR Accounts+Employee Accounts; Projects w/ sub-items; personal Tasks; Chat; Reports; My Profile w/ Departments+Settings — HR/Employee analogues), capability-gated. *Accept:* per-role nav screenshot vs spec.
**T-34.2 Breadcrumbs + palette parity** `P1` · correct clickable hierarchy (Projects→Website Redesign→Task List→Design Homepage pattern; admin/org labels mapped); palette role-aware, single Settings destination; every real page reachable. *Accept:* click-through audit zero orphans.
**T-34.3 Directory + profile polish** `P2` · directory card spec; avatar popup w/ limits; complaint form in My Profile → DM + high-priority notification. *Accept:* flows proven.

## Phase 35 — Cache invalidation & synchronisation
**T-35.1 Invalidation map** `P1` · authoritative mutation→keys table: user CRUD→users+`dashboardInit`; leave decision→leave lists+`dashboardInit`+balance; punch→`dashboardInit`+attendance keys; task/project→tasks/projects+`dashboardInit`; announcements→`dashboardInit`; notifications→notifications+unread; realtime handlers + offline replay invalidate the same keys. *Accept:* scripted matrix — every dependent view refreshes without manual reload.
**T-35.2 Hard-reload removal** `P1` · leave form `window.location.href` → router+invalidate; approvals filter `window.location.reload()` → URL state. *Accept:* zero full reloads outside logout/session-expiry.

## Phase 36 — Design tokens, theming, mobile, offline
**T-36.1 Tokens + dual-theme colorfulness** `P1` · replace 52× hardcoded violet → `primary` token; radius token adoption; both themes colorful (white ClickUp-like; dark Adobe-like consistent). *Accept:* theme toggle recolors everything; token audit clean.
**T-36.2 Mobile behaviors** `P1` · bottom-nav ≤5 + hamburger full-screen; admin console reachable on mobile; one-field-per-screen option (leave, task completion) or large-target scroll forms; native mobile date pickers. *Accept:* 360px audit incl. forms.
**T-36.3 Offline behavior** `P2` · banner; timer/punch local+sync; forms queue; chat Not-connected+queue; replay invalidates. *Accept:* airplane drill E2E.

---

# GROUP 6 — DATA, VERIFICATION, LAUNCH

## Phase 37 — Seed dataset (test like a real org)
**T-37.1 Org structure** `P0` · 1+ admin; **2 HRs managing disjoint departments**; 3 departments; 8–10 employees spread (incl. one dual-role); designations per dept. *Accept:* HR-A/HR-B scoping provable.
**T-37.2 Work data** `P0` · 3 projects (1 completed w/ history, 1 active w/ Kanban-mixed tasks incl. blocked+recurring, 1 pending-review submission) + teams + QA form; tasks across statuses/priorities/scopes; timer logs. *Accept:* Phases 21–22 surfaces all render seeded content.
**T-37.3 Attendance & leave** `P0` · 4 weeks per user (present/late/OT/absent/holiday mix; multi-segment; continue-shift day); leave all statuses + balances; upcoming + recurring holiday. *Accept:* heat-maps/graphs/balances populated.
**T-37.4 Comms** `P1` · global history, project chat, 2 DMs, 1 group; announcements (pinned+reacted); notifications across types; notes; pins. *Accept:* chat/notification surfaces populated.
**T-37.5 Demo accounts** `P0` · admin/hr/employee@ + second HR + dual-role; **all onboarded**; balances allocated; sessions cleared; password `password` (rotate pre-launch). *Accept:* each lands on its dashboard with data.
**T-37.6 → superseded architecture note (Rev 2):** Phase 37's dataset CONTENT remains canonical, but its **creation mechanism, tagging, isolation, and removal** are defined and executed under **Group 7 (Phases 41–45)** — demo rows must be produced through real backend services with demo tagging so admins can tear them down safely. Execute Phases 41–42 together with/after 37.

## Phase 38 — End-to-end verification
**T-38.1 API matrix** `P0` · extended probe asserting per-role status+shape for the full inventory (previously-500 paths, holidays array, employee 200s, admin clock-in 403, HR qa-forms 200). *Accept:* 100% green on LIVE.
**T-38.2 Spec workflow chains** `P0` · (a) Admin→create employee→dept→onboard→clock-in→HR/Admin view→leave→approval→status+notifications; (b) Admin→create HR→dept→scoped mgmt→employee receives results; (c) dept→members→cross-module; + task cycle, project cycle, quick-task→chat, complaint→DM, layout lifecycle. *Accept:* every chain completes with visible results, zero refreshes.
**T-38.3 Concurrency drill** `P1` · simultaneous approve/punch/comment → no corruption/duplication. *Accept:* clean state.
**T-38.4 Console + logs + responsive audit** `P0` · clean-profile zero console errors (all roles, all pages); Cloud Logging 24h zero (`SQLSTATE`, `RouteNotFoundException`, `BadMethodCallException`, `cURL error 60`, `__PHP_Incomplete_Class`, `reading 'length'`); 360/768/1024/1280/1536 layouts verified. *Accept:* documented clean run.

## Phase 39 — Launch hardening
**T-39.1 Secrets + demo rotation** `P0` · rotate demo passwords; secrets in Secret Manager only; history purged (verify T-7.1). *Accept:* audit clean.
**T-39.2 Monitoring/alerting** `P1` · 5xx rate, failed jobs, queue depth, scheduler misses, DB errors; authed-endpoint uptime probe. *Accept:* test alert fires.
**T-39.3 Performance** `P2` · N+1 sweep (per-user reconcile loops!), index audit, bundle check; dashboard <2s warm. *Accept:* budget met.

## Phase 40 — Sign-off & housekeeping
**T-40.1 Final gate** `P0` · re-run every phase's acceptance on LIVE; role matrices below signed. *Accept:* Completion Standard met.
**T-40.2 Housekeeping** `P1` · regenerate `AGENT.md`/`CLAUDE.md`/`.windsurfrules` → point to `context.md`+`finalization.md`; delete root `.npmrc.bak`, empty `yarn.lock`, `.jetro/` IDE cache, `apps/api/storage/logs/*` local logs, external `g4k-audit-deployed/` (clones+probes); confirm `docs/archive/planning/` intact. *Accept:* repo clean; docs current.

---

# GROUP 7 — DEMO-DATA SUBSYSTEM & PRODUCTION CUTOVER (Rev 2; policy: context.md §10.7)

> **Binding principle:** demo data is REAL data — same DB, same backend services, same APIs, same business logic,
> permissions, validations, notifications, jobs, and synchronisation as production. No mocks, no hardcoded arrays,
> no frontend-only data, no demo-only code paths. Phase 37 defines the dataset CONTENT; this group defines how it
> is created, verified, and — critically — **safely removed by an administrator before real production use**.

## Phase 41 — Demo-data architecture (tagging, seeder, guardrails)
**T-41.1 Demo tagging schema** `P0` · DB · *Problem:* current demo rows are ad-hoc, untagged, indistinguishable from future real data → impossible to remove safely. *Build:* `users.is_demo boolean` + nullable `demo_tag uuid` on top-level demo-owned entities (departments, projects, qa_forms, conversations, announcements, holidays?—holidays are system config: tag only demo-created ones), with tag propagation to every descendant write path (attendance, leaves, approvals, tasks, messages, notifications, notes, pins, audit, files, tokens) — set in the same creation flow (model observers or service-layer), not by after-the-fact guessing. *Edge:* real data created alongside demo data must NEVER be tagged; demo user performing an action on a real entity tags the action's artifacts (audit/notification) but not the real entity. *Accept:* after `demo:seed`, a single tagged-user query enumerates 100% of demo rows across every table (scripted assertion, zero untagged descendants).
**T-41.2 Versioned demo seeder command** `P0` · BE · *Build:* `php artisan demo:seed [--fresh]` — idempotent, versioned (demo dataset version column/config), re-runnable after teardown; uses **real services** for logic-bearing flows: punches through the real clock pipeline + `reconcileDay`, leave through real request→approval (real notifications/balances), projects/tasks through real create/assign/submit/approve endpoints/services, conversations/messages through real chat services, notifications via real observers; direct model writes ONLY for historical volume, producing pipeline-indistinguishable rows (correct statuses/seconds/late/OT). *Edge:* idempotency (re-run doesn't duplicate); deterministic dates relative to "today" so relative scenarios (pending leave, ≤10-day holiday, today's mixed attendance) always hold; runs in acceptable time. *Accept:* `demo:seed` on empty DB → full §Phase-37 dataset; re-run → no duplicates; all rows tagged.
**T-41.3 Teardown command** `P0` · BE/DB · *Build:* `php artisan demo:purge` — enumerates tagged data; deletes in FK-safe dependency order (tokens/sessions → notifications → messages → conversations → tasks → qa answers → projects → leaves/approvals → attendance → files → departments → users → demo holidays/settings restores); wrapped in a transaction with per-table counts reported; purges demo cache keys (`holidays_*`, dashboard caches) + uploaded demo files; preserves all non-demo data and system settings (or restores settings touched by demo seeding to prior values); auto-numbering: reset demo-consumed sequences OR preserve per flag; audit-logs the teardown as a real admin-visible event. *Edge:* partial-failure rollback; re-run idempotent; orphan check post-run. *Accept:* scripted teardown → demo-row count = 0 everywhere; no orphaned FKs/files/cache; real data untouched.
**T-41.4 Admin teardown UI** `P1` · FE+BE · *Build:* Settings → "Demo data" panel (admin-only, new cap or `settings.manage`): shows demo-dataset version + per-entity counts (impact preview); "Remove demo data" requires typed confirmation (`REMOVE DEMO DATA`); runs purge; success summary; "Re-seed demo data" secondary action for support/training. *Edge:* confirmation copy explains irreversibility + that real data is preserved; job runs async w/ progress + completion notification (worker live). *Accept:* admin completes teardown from UI; post-state = T-41.3 acceptance; re-seed works.

## Phase 42 — Demo dataset execution (via Phase-41 architecture)
**T-42.1 Org & accounts** `P0` · seed via real user-create service · 2 admins, 2 HRs (disjoint depts), 3 departments, 8–10 employees incl. **dual-role (employee+HR)**, **fresh-empty employee** (no projects/tasks/leave — for empty states), **boundary employee** (0 casual balance remaining); designations per dept; auto employee-IDs; all onboarded; avatars uploaded for ≥4 users (real storage). *Accept:* login as each → correct role dashboard; dual-role sees role-select; fresh employee sees spec empty states everywhere.
**T-42.2 Attendance history** `P0` · 4 weeks per working user via pipeline-indistinguishable writes: present days (on-time + late-with-badge), overtime days, absent days, holiday dates matching seeded holidays, on-leave days matching approved leaves, **one multi-segment day**, **one continue-shift day**, **one midnight-crossing day**; HR/admin corrections present (with audit rows); today = mixed live state (some clocked-in, one on-break, one not-yet). *Accept:* every history/calendar/graph surface renders correct colours/values; day-details show full timeline.
**T-42.3 Leave & balances** `P0` · requests in every status (pending, approved, rejected, cancelled) across types incl. one HR→Admin pending; approved leaves generate attendance on-leave days + balance deductions; boundary employee at 0-remaining; one request whose dates overlap a holiday. *Accept:* balance chips match DB; approver card shows balance; statuses/badges correct.
**T-42.4 Projects/tasks/QA/timers** `P0` · 3 projects per Phase 37.2 (completed w/ history+approval trail; active w/ team, blocked-dependency chain A→B, recurring task with instances, QA form attached, mixed-status tasks incl. under-review submission + one redo-required with reason; pending-review project submission w/ completion report); timer logs across users/days per project; personal (My Tasks) items incl. HR-assigned + employee-created + one with personal reminder set. *Accept:* Kanban/Gantt/list render; dependency gating demonstrable; QA-required submission blocks; approval panels show all three states.
**T-42.5 Comms & notifications** `P1` · global chat history (incl. one task-completion auto-post), project chat w/ 1 pinned message + task alert, 2 DMs (one fully-read w/ receipts, one unread w/ badge), 1 custom group (HR + 2 members; non-member employee cannot see it); announcements (company pinned+reacted, team-scoped); notifications of every trigger type incl. high-priority (suspicious-login sample, complaint result); quick notes (1 pinned); pins (project + task + profile). *Accept:* every chat surface renders per spec; bell shows high-priority only; unread states correct.
**T-42.6 System & config** `P1` · company profile w/ logo; work schedules (default + one variant); holidays (recurring incl. Feb-29 historical + one ≤10 days ahead); settings fully configured (policies, reminder times, notification prefs, SMTP-safe); 2 device-sessions per demo user (distinct user-agents); audit history populated by the above actions. *Accept:* settings pages reflect and AFFECT behavior (tz→late demo day proves it).

## Phase 43 — Demo walkthrough & scenario verification (dataset quality gate)
**T-43.1 Normal-flow walkthroughs** `P0` · QA · scripted manual pass of every §7 workflow using ONLY demo accounts, in the UI, asserting the full chain (action→persist→sync→notify→visible) per the Workflow Proof Standard. *Accept:* signed walkthrough record per workflow; any failure → task back to its phase.
**T-43.2 Boundary scenarios** `P1` · QA · 0-balance leave attempt; lockout (5 fails) on a demo account then recovery; per_page=100 rendering; long-text truncation+tooltip; midnight-shift display; Feb-29 recurring holiday; dependency chain start-block; concurrent same-second actions on demo data. *Accept:* each behaves per spec.
**T-43.3 Empty & permission scenarios** `P1` · QA · fresh-empty employee walks every list (exact spec empty copy + illustration + action); each role attempts cross-role URLs/APIs (denied states, no leaks). *Accept:* empty-state audit table + permission matrix green.
**T-43.4 Dataset regression in CI** `P2` · dev · `demo:seed` + role-matrix + contract tests + one E2E chain as a CI job against a disposable DB. *Accept:* green pipeline artifact.

## Phase 44 — Demo teardown & production cutover (release gate)
**T-44.1 Teardown verification** `P0` · QA/DB · run admin teardown on a seeded env → assert T-41.3/41.4 acceptance: zero demo rows/files/cache; real data intact; auto-numbering sane; teardown audit-logged. *Accept:* scripted assertion suite passes.
**T-44.2 Cutover rehearsal** `P0` · QA · teardown → rotate demo creds → create REAL admin/HR/employee/dept via UI → run one full normal day simulation (clock, leave, task, chat) → verify no demo residue anywhere (search, lists, notifications, directories, reports). *Accept:* rehearsal record; zero residue.
**T-44.3 Re-seed path** `P2` · QA · after cutover-style teardown, `demo:seed --fresh` re-creates the dataset for support/training without touching real data. *Accept:* re-seed isolated to demo-tagged scope.

## Phase 45 — Micro-feature verification sweep (consolidated proof gate — audit items D/F)
Each item = one verify-task with the Workflow Proof Standard; failures route back to their owning phase.
**T-45.1 Uploads** `P0` · profile-photo popup (format/size limits + clean rejection), company logo, HR project images, chat file/image send+receive+download. **T-45.2 Timers** `P0` · shift timer (navigate-away persistence, amber OT, explicit stop) + per-project timer (start/pause/resume/end, logged to day detail). **T-45.3 Drafts & autosave** `P1` · 30s draft on all non-quick forms; restore banner after tab close; quick-actions exempt. **T-45.4 Notifications & reminders** `P0` · every trigger fires exactly once, realtime bell, high-priority filter, mark-read/all, 10-day holiday, 15-min shift, 30-min HR alert, personal task reminder, weekly Sunday email. **T-45.5 Permissions** `P0` · full role matrix + data-isolation probes (cross-user, cross-dept, HR-scope, admin-no-clock). **T-45.6 Exports** `P1` · attendance/leave/audit/reports exports complete via worker + download + filters honored. **T-45.7 Layouts** `P0` · full customisation lifecycle per Phase 33 incl. cross-device + reconcile + no reset-on-refresh. **T-45.8 Remaining UX micro-features** `P1` · inline edit, Ctrl+N/Ctrl+//Esc/Enter, tooltips on icon buttons, truncation tooltips, progress-bar animation, drag-reorder persistence, status-badge colours, pagination 20/50/100, filter chips. *Accept:* per-item proof recorded; zero unproven items remain.

---

# GROUP 8 — CODE-VERIFIED MODULE CORRECTIONS (Rev 3; evidence: context.md §12 "Rev 3 deep-dive")

> Every task below cites the exact defect. These are corrections/completions the earlier phases assumed worked;
> execute them **within their domain stream** (46–47 alongside G3; 48 alongside G4/N; 49–51 before/within G5 page
> polish). All `W:` = `apps/web/src`, `A:` = `apps/api`.

## Phase 46 — Projects/Tasks module corrections (the app's largest broken module)
**T-46.1** `P0` · *Defect:* `W:components/projects/tasks-tab.tsx:177` reads `data?.data?.data` but `/tasks` returns a flat paginator → **Kanban/List/Gantt permanently empty**; `:464` reads nonexistent `meta.last_page` → pagination never renders. *Fix:* unwrap via `Array.isArray(data?.data) ? data.data : []`; read `data?.last_page`. *Accept:* board/list/gantt render real tasks; pagination works.
**T-46.2** `P0` · *Defect:* mutations invalidate `{queryKey:["tasks"], exact:true}` (`tasks-tab.tsx:101,111,122`; `W:components/tasks/task-detail-sheet.tsx:63,80,96,114`) but the list key is `["tasks", filters…]` → **nothing ever refetches**; kanban optimistic `setQueryData(["tasks"])` misses → drags revert visually. *Fix:* drop `exact`, invalidate the `["tasks"]` prefix; fix optimistic key to match the active list query. *Accept:* create/update/delete/drag → list+board update without refresh.
**T-46.3** `P0` · *Defect:* "None" select sentinels (`"none"`) reach the payload (`tasks-tab.tsx:159-163`) → backend `exists:` 422s. *Fix:* map to `null`. *Accept:* create with defaults succeeds.
**T-46.4** `P0` · *Defect:* FE review sends `{status}` but `A:ProjectController@review` validates `{decision}` → **approve/redo always 422**; submit `notes` ignored; `status==="review"` never set so the review panel is unreachable; `project.status` unguarded at `W:app/dashboard/projects/[id]/page.tsx:229` → crash while loading. *Fix:* align FE/BE contract (`{decision}`, notes persisted, explicit review state or event-driven review queue); guard `project?.`. *Accept:* full submit→review→approve/redo cycle E2E; no crash on slow load.
**T-46.5** `P0` · *Defect:* FE reads `task.qaForm`/`task.timeLogs` (`task-detail-sheet.tsx:179,299`) but serialization is `qa_form`/`time_logs`; index never loads comments/activities/timeLogs and the sheet never calls `GET /tasks/{id}` → QA/Comments/Time/Activity tabs dead. *Fix:* read snake_case (or camel-case server output) + fetch detail on open. *Accept:* all four tabs render real data.
**T-46.6** `P0` · *Defect:* recurrence UI sends `{pattern,interval}` but `A:RecurrenceService` requires `{type}` → **auto-recreate never fires**; weekly-days/monthly-date absent FE+BE. *Fix:* contract `{type:'daily'|'weekly'|'monthly', days?, day_of_month?}` end-to-end. *Accept:* completing a daily task recreates tomorrow's instance.
**T-46.7** `P0` · *Defect:* `/tasks/{id}/approve` + `/redo` are never called from FE → submitted tasks stall in review. *Fix:* HR/Admin review UI on the submitted queue (reuse `/tasks/submitted`). *Accept:* approve/redo cycles update employee status ≤5s.
**T-46.8** `P1` · *Defect:* **project create UI absent** (POST /projects unused); edit = name/desc/priority only; member management UI absent (BE `member_ids` sync unused). *Fix:* create dialog (full spec fields), full edit, team add/remove UI. *Accept:* HR/Admin create + manage teams; added employee gains access.
**T-46.9** `P1` · *Defect:* QA is task-level only; project-level QA attach absent FE+BE (`A:ProjectController` has no `qa_form_id`); no QA-answers review UI; client doesn't enforce required QA before submit. *Fix:* project QA attach + submission enforcement + reviewer answers view. *Accept:* QA-gated submission blocks; HR sees answers.
**T-46.10** `P1` · scope selector Global/Dept/Role absent FE + no BE list filtering; multi-assignee/project-wide absent (BE single `assignee_id`). *Fix:* end-to-end scope + multi-assignee (or documented single-assignee decision + spec note). *Accept:* scoped visibility per role proven.
**T-46.11** `P1` · Kanban: no within-column reorder (needs `order` field+API), no blocked badge/disabled drag, no board loading/error. *Accept:* reorder persists; blocked cards visibly locked.
**T-46.12** `P2` · Gantt: add task diamonds, dependency lines, start-date bars, range control, empty state. *Accept:* timeline renders spec view.
**T-46.13** `P1` · `/dashboard/tasks/[id}` doesn't exist → widget links 404 (`employee-task-progress-widget.tsx:74`); no task edit UI (assignee/due/priority/blocked_by post-create). *Fix:* real route (or `?tab=tasks` deep-link + open sheet) + edit dialog. *Accept:* every task link resolves; tasks editable.
**T-46.14** `P1` · Project history reads fields BE never returns (`history`, counts, `total_time_hours`) → always empty; per-item activity tabs dead. *Fix:* BE return real aggregates; wire activity from recorded `TaskActivity`. *Accept:* history + activity tabs render.
**T-46.15** `P2` · sorting: FE never sends `direction`/`status` (`projects-tab.tsx:26`); task list has no sort UI (BE fixed `created_at desc`). *Accept:* both sorts work asc/desc.
**T-46.16** `P1` · timer: only per-task Start/Stop exists (no pause/resume); no per-project timer UI on project detail. *Fix:* pause/resume + project timer per spec. *Accept:* time logged per project/day visible in day detail.

## Phase 47 — Chat & notifications corrections
**T-47.1** `P1` · custom group chats: no UI + no API. Build both (members-only visibility). *Accept:* HR creates group; non-member can't see it.
**T-47.2** `P1` · unread state: bold+dot only — add colored left border + count badge (`W:components/chat/conversation-list.tsx:81,86`; border currently only on selected `:69`). *Accept:* unread conversations show border+badge; clears on open.
**T-47.3** `P1` · receipts as ✓/✓✓ (not "Read by N" — `message-list.tsx:53-58`); @mention highlight in message bodies; backend mention notification must include the snippet (`A:ChatController.php:91-103`). *Accept:* receipts + mentions render; mentioned user gets snippet.
**T-47.4** `P1` · pin messages in project chats (absent FE+BE). *Accept:* HR pin survives reload at top.
**T-47.5** `P2` · attachment image previews (currently bare links — `message-list.tsx:41-50`). *Accept:* images render inline.
**T-47.6** `P0` · bell: numeric badge on the icon (currently dot); unread-count filtered to high-priority/system-global (`A:NotificationController.php:64-71` + FE). *Accept:* badge count = high-priority only; full count in the panel.
**T-47.7** `P1` · `isConnected` must reflect socket state, not Echo-instance existence (`W:hooks/use-reverb.ts:106`) so the offline polling fallback actually engages. *Accept:* kill socket → polling resumes.
**T-47.8** `P2` · notification-center type filter add `holiday_reminder`/`feedback`/`mention`/`system` (`W:components/chat/notifications-tab.tsx:196-200`). *Accept:* all types filterable.
**T-47.9** `P2` · mobile composer keyboard handling (visualViewport); chat-local "Not connected" indicator. *Accept:* input stays above keyboard; indicator shows offline.
**T-47.10** `P1` · complaint channel per spec: form in **My Profile**, sends a **DM** to receiving HR/Admin + **high-priority** notification (`A:FeedbackController.php:23-36` currently normal priority, no DM). *Accept:* submit → DM + high-priority bell.

## Phase 48 — Settings/Profile/Directory corrections
**T-48.1** `P0` · mount the five **orphaned** components: `audit-log-table` (fix `/dashboard/audit` dead-end via URL-driven tab state — `settings-tabs.tsx:176` uses `defaultValue`), `notifications-config` (fix unimported-`Skeleton` TS error), `auto-numbering-config`, `reminders-config`, `security-requests-config`. *Accept:* every settings tab reachable and functional.
**T-48.2** `P1` · timezone editable (`settings-tabs.tsx:224` hardcodes `Asia/Kolkata`). *Accept:* changing tz affects late calc + displays.
**T-48.3** `P1` · settings gating by **capability** not `active_role==='super_admin'` (`settings-tabs.tsx:41`) — align with the capability matrix (HR holiday access etc.). *Accept:* role matrix holds on settings routes.
**T-48.4** `P1` · work-schedules: multi-record CRUD + `is_default` designation (currently edits `schedules[0]` with `id||1` fallback). *Accept:* default settable; new users inherit.
**T-48.5** `P2` · session/device rules beyond TTLs (max devices, concurrent policy) in policies-config. *Accept:* rule enforced on login.
**T-48.6** `P2` · directory card shows phone-if-visible; fix invalid `SelectItem value=""` (`W:app/dashboard/profile/page.tsx:450`); gate directory public-profile link by capability (currently relies on API 403). *Accept:* card per spec; no invalid Radix values.
**T-48.7** `P2` · remove dead `/dashboard/sessions` route (error.tsx only). *Accept:* no orphan routes.

## Phase 49 — Table standards (all 17 DataTable consumers)
**T-49.1** `P0` · **sorting is dead**: headers never call `getToggleSortingHandler`, no `aria-sort`, no controlled passthrough (`packages/ui/src/components/data-table.tsx:341-356`). Wire client-side + server-side (`sortBy` from FilterBar). *Accept:* every list sortable.
**T-49.2** `P0` · pass `isLoading` everywhere + delete divergent overlays: admin/hr attendance (`402-406`,`339-356`), open-shifts (`225-236`), tasks-tab (`457-468`), audit-log-table (`152-153` text loader), admin/reports (`171-180`). *Accept:* one consistent in-table skeleton.
**T-49.3** `P1` · `<table>` `min-w`; right-align numeric/date columns via column meta (admin-attendance `259-292`, hr-attendance dates before identity — reorder to identity-first `162-210`); use `--density-row-height` tokens. *Accept:* no crushed columns; alignment convention holds.
**T-49.4** `P1` · pagination: fix `meta?.last_page` reads (`projects-tab.tsx:98` + tasks); directory fake pagination → infinite variant or remove (`directory-tab.tsx:242-246`); audit `perPage` 50→20. *Accept:* pagination real everywhere.
**T-49.5** `P1` · migrate custom filter rows to FilterBar (open-shifts `169-210`); `flex-wrap` audit/report headers; replace raw tint spans with StatusBadge (`approvals-tab.tsx:118-122`). *Accept:* one filter system.
**T-49.6** `P2` · sticky headers: bounded scroll heights on table regions or remove the sticky promise; column-visibility labels humanized; mobile-card select labelled. *Accept:* headers behave as designed.
**T-49.7** `P2` · click-only cells → real buttons/links (directory `120,129,138`; tasks title `185-194` + truncate/tooltip). *Accept:* keyboard-operable rows.

## Phase 50 — Accessibility conformance (AA)
**T-50.1** `P0` · **contrast tokens**: darken light-theme status tokens (warning→#B45309, success→#15803D, danger→#B91C1C; `globals.css:142-147` + badge tints) and raise `--text-muted` (#64748b light / #8B8B9E dark; `:140,190`). *Accept:* automated contrast check AA-pass in both themes.
**T-50.2** `P0` · labels: `htmlFor`+id across CRUD dialogs (org/users `597-671`, tasks-tab `256-384`, departments `446-452`, settings forms, admin/reports, leave form, project edit); errors get `role="alert"` + `aria-describedby`; restore Dialog/Sheet `aria-describedby` association. *Accept:* every input labelled; errors announced.
**T-50.3** `P1` · aria-labels on ~8 unnamed icon buttons (org/users/[id]:147, designations-tab:234, admin-attendance-calendar:61/64, directory-tab:311, chat back, FilterBar clear, quick-notes chevron); FilterBar chips → focusable buttons. *Accept:* zero unnamed icon buttons.
**T-50.4** `P1` · aria-live on offline banner + `aria-busy` on loading tables; AppIcon default `aria-hidden`; skip-to-content + `id="main"`; fix heading order (h1→h3 skips; EmptyState orphan h3). *Accept:* axe/cli audit clean of these classes.
**T-50.5** `P1` · touch targets ≥44px on mobile (pagination 32px, chips 16px, kebabs, row actions 28-32px); fix `/` shortcut via FilterBar `searchInputId` (admin/hr attendance `:55` focus dead ids). *Accept:* mobile tap audit passes.

## Phase 51 — Responsive + cross-app consistency enforcement
**T-51.1** `P0` · replace fixed `h-[calc(100vh-…)]` heights (approvals-tab `192,233`; chat-tab `136`; settings-tabs `345`) with dvh-aware/max-height formulas subtracting bottom-nav+padding. *Accept:* 360px — no content hidden under bottom nav.
**T-51.2** `P1` · Sheet widths `w-full sm:w-[400px]` (org/users:740, departments-tab:479); 15+ `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (org/users `595-671`, tasks-tab `274-369`, leave form, holiday-calendar, mail-smtp, hr-correction, team-member sheet, onboarding). *Accept:* dialogs usable at 360px.
**T-51.3** `P1` · TabsLists `overflow-x-auto` (attendance:77, directory:20, chat:20, org/attendance:25 — copy admin/attendance:45 pattern). *Accept:* tabs scroll, never squeeze.
**T-51.4** `P1` · widget touch: `draggableHandle=".widget-drag"` + scope click-suppressor to grid container + xxs column review (widget-engine `78-95,179-189`); define `pb-safe` utility in globals. *Accept:* mobile scroll never hijacked; safe-area respected.
**T-51.5** `P1` · terminology standardization: one verb set for clocking ("Clock In/Out" per spec UI labels; retire stray "Punch"/"Start Shift" inconsistencies in user-facing copy); "Leave" everywhere (retire "Time Off"); align density between HR/admin attendance tables. *Accept:* copy sweep zero conflicting user-facing terms.
**T-51.6** `P1` · toast semantics: offline/queued → **warning** (amber), not success (`api-client.ts:57`); optimistic punch toasts only after sync confirmation (command-palette `119-158`). *Accept:* toast audit — semantics correct.
**T-51.7** `P2` · loading drift: replace ad-hoc spinners/text with Skeleton in the 39 `animate-spin` files where a skeleton fits; date formatting: route remaining 41 direct `date-fns` sites through `safeFormat` (46 `format(new Date(...))` total; unguarded outliers per audit). *Accept:* one loading pattern; zero RangeError-prone date calls.

## Phase 52 — Rev 4 residual findings (final gap sweep)
**T-52.1** `P1` · login footer tooltip text deviates from spec — `W:app/(auth)/login/page.tsx:196` reads "Gen2k Conglomerate (2018) • Milestone 3 - Module wiring v2" (dev jargon exposed to users); spec = "Gen2k Conglomerate (2018) • Milestone 1". Fix text + remove all dev-visible version strings from user surfaces. *Accept:* exact spec string on hover/click.
**T-52.2** `P1` · **no frontend consumer of the day-detail endpoint** (`/attendance/me/day/{date}` and hr/admin equivalents return `{day,events,projects,tasks}`) — the "click any date → full day summary incl. projects worked + tasks completed" spec flow has no UI. Build the day-detail dialog/sheet wired to those endpoints from the history calendar + HR/admin tables. *Accept:* clicking any heat-map date shows clock-in/breaks/out/total/projects/tasks.
**T-52.3** `P1` · HR project image attachments (spec §6 Files) — no UI: attach the shared FileUploadPopup (format/size limits) to project create/edit. *Accept:* HR attaches images; visible on project detail.
**T-52.4** `P2` · one-field-per-screen option for leave-request + task-completion forms on mobile (or documented large-target single-screen alternative). *Accept:* mobile form audit passes per spec §8.
**T-52.5** `P2` · **spec conflict decision required:** §2 Admin-Reports says "PDF or spreadsheet"; §6 says "Excel as tables". Decision: Excel primary (per §6); PDF deferred post-Milestone. Record in context.md §13 and implement Excel export completion (worker-dependent). *Accept:* decision logged; Excel exports deliver.
**T-52.6** `P2` · employee self-create-tasks policy: spec says "if permitted by HR" — currently backend hard-blocks employee `POST /tasks` (`tasks.manage`). Implement per-project `allow_employee_tasks` flag (HR-settable) or global setting; gate FE create button accordingly. *Accept:* HR toggles; employee can/cannot create per setting.

---

## ACCEPTANCE — the Completion Standard

**Role matrices (all on LIVE):**
- **Admin:** login→company dashboard <2s; full HR/employee/dept lifecycle; all attendance/leave views+approvals; all projects/tasks incl. approve/redo; reports+exports+audit; settings persist (tz→late calc proven); announcements; weekly email; **zero self-clock surfaces (API 403 + UI absent)**; devices/password.
- **HR:** scoped dashboard+team attendance (no 500s); leave approvals (both surfaces); own clock/leave→admin; projects+team+tasks (recurrence/dependencies/QA); submission reviews; groups+@mention; **only managed-dept data**; no admin screens (403).
- **Employee:** onboards→dashboard; clock cycle+timer+history+heat-map; balanced leave; assigned-only projects; submit w/ QA+note; approval panel; My Tasks+reminders; all chat types live; profile+avatar+devices+complaint; **zero cross-employee data**.

**Global:** zero console errors · zero 5xx · zero placeholders/mocks · zero manual refreshes · zero stuck loaders · every state implemented (loading/success/error/empty/disabled/permission-denied/validation/retry/cancel/duplicate) · compact spacing system consistent on every screen · tables/widgets/forms conform to standards · **personal layouts persist across refresh/logout/devices with safe reconciliation** · responsive 360–1536 · dual colorful themes · concurrent-use safe · monitoring live · **demo dataset is real DB-backed data served through the identical backend/business-logic/permission/validation/sync stack (§10.7), covers every module/role/workflow incl. boundary/empty/error/permission scenarios (Phases 41–43), and an administrator can safely tear it down with zero residue then run production (Phase 44) — teardown is itself verified and re-seedable.**

---

## APPENDIX A — Verified-defect → task cross-reference (nothing lost from prior rounds)

| Verified defect (source round) | Fixed by |
|---|---|
| Deploy divergence D0 | T-1.1–1.3 |
| Employee lockout D1 | T-8.1–8.3 |
| Attendance 500s D2 | T-9.1–9.3 |
| Leave-pending 500 D3 | T-10.1 |
| Holidays corruption D4 | T-10.2 |
| No worker/scheduler D5 | T-2.1–2.3 |
| Reverb/Pusher mismatch D6 | T-3.1–3.2 |
| Late tz never computed | T-16.1 |
| Approvals id mismatch (dashboard 404) | T-19.4 |
| `correct` null-deref | T-18.4 |
| `SendHolidayReminders` bad method | T-24.1 |
| Bulk insert bypasses observer | T-24.1 |
| `ApprovalSubmitted` null channel | T-24.1 |
| `users/{id}` no authz | T-14.1 |
| `reports.view` seeder gap | T-13.2 |
| HR 403 qa-forms / projects/{id} / tasks/{id} | T-13.2, T-14.2 |
| Dead `SELF_SERVICE_EXCLUDED` | T-13.1 |
| `PUT /auth/role` 500 | T-11.3* (role-switch consolidation) |
| Cookie forced logout / deep-link spinner / cap-cookie race | T-11.1–11.3, T-8.3 |
| Leave balance absent | T-19.1–19.5 |
| Announcement-board dead key / quick-task dead key + trap / holidays widget RangeError | T-32.3 |
| Calendar v8-on-v9 | T-30.1 |
| DataTable no loading | T-30.2 |
| ~44 non-idempotent migrations | T-5.1–5.2 |
| SoftDeletes not applied | T-5.3 |
| Avatar/logo 500 (path-style) | T-4.1–4.2 |
| Hardcoded violet ×52 / mixed radii | T-36.1 |
| Productivity formula / leaveSummary window | T-24.9 |
| Save-on-mount layout overwrite / no reconcile / double-nesting read | T-33.1–33.4 |
| Missing: groups BE, @mention, receipts, pin messages, chat files, timer UI, suspicious-login, autosave, inline-edit, bell filter, progress animation, dismiss persistence, complaint wiring | T-23.3–23.7, T-21.5, T-12.3, T-31.6, T-31.4, T-24.2, T-31.3, T-32.1, T-34.3 |
| Hard reloads / offline replay no invalidation / double toasts | T-35.2, T-35.1, T-31.2 |

\* `PUT /auth/role`: implement `getAssignedRoles` OR delete endpoint in favour of `POST /auth/role-select` (decide at implementation; acceptance = role switch 200 + scoped token, single round-trip).

## APPENDIX B — Page-level UI audit checklist (apply on EVERY screen during G5)
□ Nothing touches container edges; uniform card padding/gaps (4/8 scale) □ page anatomy standard (header→filter→content→pagination) □ grids intact; no overlap/clipping □ alignment rules (text left, numbers/dates right, actions right) □ table standard (T-30.2) □ widget standard (T-32.1) □ form standard (labels, required markers, inline validation, disabled submit, toast) □ modal/drawer positioning consistent □ filter bar complete per spec §2.8 w/ chips □ status badge colours exact (gray/blue/amber/green/red) □ breadcrumbs correct □ icon buttons have tooltips □ empty states w/ illustration+action □ responsive at all 5 breakpoints □ theme toggle correct in both modes □ role-conditional UI intentional.

## APPENDIX C — Per-page conformance task inventory (Rev 2)

**Every row below is one task unit** (apply Appendix B checklist + Phase-29 spacing + Phase-31 states + role gating + real-data verification per page; verify desktop AND 360px; record screenshot proof). Funnel routes are verified as redirects with correct deep-links.

| # | Route | Roles | Page-specific proofs |
|---|---|---|---|
| 1 | `/login` | guest | spec branding, lockout msg, forgot link |
| 2 | `/forgot-password`, `/reset-password` | guest | dual reset path |
| 3 | `/role-select` | multi-role | lists all roles, single round-trip |
| 4 | `/onboarding` | new user | completes, resumable, gate correct |
| 5 | `/dashboard` | A/H/E | widget sets per role, real metrics, layout lifecycle |
| 6 | `/dashboard/attendance` | H/E (+A→redirect) | time clock, summary, history, leave tab |
| 7 | `/dashboard/attendance` approvals tab | H/A | pending list 200, decisions work |
| 8 | `/dashboard/projects` | A/H/E | tabs, sorting, create (A/H), assigned-only (E) |
| 9 | `/dashboard/projects/[id]` | A/H/E | team mgmt, tasks tab (kanban/gantt/qa/list), timer, complete flow |
| 10 | `/dashboard/chat` | all | global/project/dm/group, mention, receipts, pins, files, notification center |
| 11 | `/dashboard/directory` | all | search, grid/list, profile sheet, send-message, dept/designation tabs (A) |
| 12 | `/dashboard/org/users` | A/H | filter bar, CRUD dialogs, work-schedule dropdown populated |
| 13 | `/dashboard/org/users/[id]` | A/H | tabs incl. attendance/leave/activity, actions |
| 14 | `/dashboard/org/attendance` | H/A | team table, filters, day drill-down, corrections |
| 15 | `/dashboard/admin/attendance` | A | company view, calendar, open shifts, export |
| 16 | `/dashboard/reports` + `/dashboard/admin/reports` | A/H/E | report set per role, exports |
| 17 | `/dashboard/settings` | A | all tabs (company/holidays/schedules/policies/sessions/notifications/SMTP/audit/demo-panel) |
| 18 | `/dashboard/profile` | all | edit, avatar popup, password form, devices, complaint form |
| 19 | `/dashboard/sessions` (or profile tab) | all | device list, revoke |
| 20 | Funnel stubs: `/leave`,`/tasks`,`/announcements`,`/notifications`,`/audit`,`/org`,`/org/departments`,`/org/designations`,`/org/leave` | role-gated | redirect correctness + no orphan loading/error files |
| 21 | Command palette (global) | all | role-aware actions, shortcuts |
| 22 | Error/loading boundaries (all of the above) | all | every state renders |

## APPENDIX D — Per-endpoint contract & role matrix (task units)

**Every endpoint below = two task units:** (a) contract test (shape/status/validation errors) and (b) role test (A/H/E → expected 200/401/403/404). Grouped: **auth** (login, refresh, logout, role-select, role-switch, change-password, onboarding/complete, sessions×2, preferences×2, capabilities) · **profile** (show, update, avatar) · **directory** (index, show) · **users** (index, store, show, update, destroy, status, reset-password, restore, bulk, export, leave-history, assignments, activity) · **departments** (CRUD + archive/restore + hrs×3 + employees×2 + export) · **designations** (CRUD + status + export) · **attendance** (clock-in/out, break×2 pairs, me/today, me/history, me/day, team-today, hr/today, hr/day, hr/history, admin/overview, admin/graph, hr/graph, correct, notify-open-shifts, export) · **leave** (index, store, show, history, pending, admin/history, export, approvals/decision) · **holidays** (CRUD) · **work-schedules** (CRUD) · **qa-forms** (CRUD) · **projects** (index, store, show, update, destroy, submit, review) · **tasks** (index, submitted, show, store, update, destroy, submit-review, approve, redo, comments) · **timer** (log) · **conversations** (index, dm, messages×2, read) · **announcements** (index, store, update, destroy, react) · **quick-notes** (index, store, destroy) · **pins** (index, store, destroy) · **notifications** (index, unread-count, mark-read, mark-unread, mark-all-read) · **reports** (data, export, exports, attendance-summary, leave-summary) · **settings** (grouped, bulk, mail/test) · **company-profile** (show, update, logo) · **audit-logs** (index, export) · **admin/password-resets** (index, approve, reject) · **auto-numberings** (index, update) · **saved-views** (index, store, destroy) · **feedback** (store) · **broadcasting/auth**. *Plus Rev-2 additions:* demo endpoints (seed-status, purge) admin-only. *Accept:* full matrix green in CI (T-7.2/T-38.1).

## APPENDIX E — Placeholder-vs-unexposed disposition (from context.md §12)

| Item | Disposition |
|---|---|
| FE built / BE missing | Build BE per owning phase (groups, mention-notify, receipts write-path, pinned messages, chat files, timer UI→`/timer/log` wiring, complaint wiring, suspicious-login, bell priority filter, dismiss persistence, progress animation, mobile one-field forms, autosave, inline edit, task reminders, balance UI) |
| BE built / FE missing | Expose per owning phase (timer UI, dependency picker+gating UI, recurrence advanced UI, weekly-summary scheduling+status, QA capability fix+enforcement, pins UI, receipts UI, Kanban/Gantt wiring proof, drafts to all forms, Ctrl+N/Ctrl+/ completion, saved-views/auto-numbering surfaces) |
| Both present / chain unproven | Prove via Phase 45 (uploads, attachments, exports, reminders, audit continuity, layout lifecycle) |

## APPENDIX F — Requirement Traceability Matrix (Rev 4: every spec bullet → verified status → owning task)

Legend: ✅ = verified working (live/code-proven) · ⚠️ = partial/broken (task fixes it) · ❌ = missing · 💀 = built but dead (worker/scheduler/wiring). Status reflects **current code**, not plan completion.

**§1 Sign-in** — logo+welcome+copyright ✅ / **info tooltip text wrong** ("Milestone 3 - Module wiring v2" vs spec "Gen2k Conglomerate (2018) • Milestone 1") ⚠️ T-52.1 · email-or-employee-ID + password + toggle + loading + error ✅ · dual-role role-select ✅ (⚠️ double round-trip T-11.2) · forgot/reset ⚠️ (SMTP + admin-approval endpoints exist; delivery dead w/o worker T-2.1; dual-path UX T-12.4).
**§2 Admin** — dashboard: employees/projects widgets ✅; today-attendance widget 💀 D2→T-9.1; pending-approvals 💀 D3→T-10.1 + id mismatch T-19.4; activity feed ⚠️ T-32.3; quick-task ⚠️ dead key T-46.2; info-icons/click-through/refresh-hover ⚠️ T-44.2 · user mgmt: create/edit/deactivate/reset ✅-ish ⚠️ (`/users/{id}` authz P0 T-14.1; activity-log tab 💀 worker; reset-approval UI orphaned T-48.1; dual-role assign ⚠️ T-20.3) · departments ✅ (⚠️ SoftDeletes T-5.3) · attendance: company view 💀 D2; filters ✅ custom rows T-49.5; calendar 💀 D4 T-10.2; day summary ⚠️ no day-detail consumer T-52.2; manual correct ⚠️ null-deref T-18.4; HR-leave approve 💀 D3; leave history ✅; export 💀 worker · projects: view ✅; **create ❌ UI** T-46.8; team assign ❌ T-46.8; QA attach ❌ T-46.9; edit ⚠️ partial T-46.8; archive/delete ❌ T-46.8; progress ⚠️; approve/redo ❌ 422 T-46.4; project chat auto-create ⚠️ T-21.3 · tasks: view 💀 empty unwrap T-46.1; create ⚠️ 422 sentinels T-46.3; scope ❌ T-46.10; edit/reassign ❌ T-46.13; approve/reject ❌ T-46.7; completion rates ⚠️ · chat: global ✅ DM ✅ announcements ✅; project chats ⚠️ · reports: data ⚠️ (productivity T-24.9); exports 💀 worker; format decision (Excel vs PDF) T-52.5 · settings: ⚠️ five tabs orphaned T-48.1; tz hardcoded T-48.2 · profile ✅ minus avatar-500 T-4.1.
**§3 HR** — dashboard: present/absent/late 💀 D2; active projects ✅; pending leave 💀 D3; pending submissions ⚠️ scope+empty T-43.x; quick-task ⚠️ T-46.2 · own attendance: clock cycle ✅ (me/today 200 live); history calendar ✅ (heatmap classes incl. overtime ✅); day detail w/ projects+tasks ⚠️ T-52.2; own leave→Admin ✅ · employee overview: team view 💀 D2; filters ⚠️; leave approve 💀 D3 · holidays: view ✅ (corrupt live D4); 10-day reminder 💀 worker · projects: create ❌ UI; team/tasks/QA per above; sorting ⚠️ direction not sent T-46.15; project chat ⚠️; completion flow ❌ 422 T-46.4; history ⚠️ fake fields T-46.14 · chat: global ✅; project ⚠️; direct ✅; **custom groups ❌ FE+BE** T-47.1; notification center ✅ (type filter ⚠️ T-47.8) · profile ✅.
**§4 Employee** — **entire role 💀 D1 onboarding lockout T-8.1**; dashboard widgets exist ⚠️ (T-32.2 data); attendance widget right-side ⚠️ layout T-43.x; assigned-only projects ⚠️ T-21.1; task progress ✅ slider; QA submit ⚠️ QA never renders T-46.5; self-create tasks ❌ blocked by `tasks.manage` cap (policy decision needed) T-46.10; **My Tasks ❌ filter-only, no self-create** T-46.10; timer ❌ no project timer T-46.16; complete project ⚠️ T-46.4; project history ⚠️ T-46.14; chat ⚠️ groups/pins/receipts T-47.x; profile ✅ minus avatar.
**§5 Approvals** — task approve/redo ❌ UI T-46.7; project approve/redo ❌ 422 T-46.4; employee leave ⚠️ D3+ids T-10.1/T-19.4; HR leave ⚠️ same; quick task cycle ⚠️ T-46.2 + global-chat auto-post 💀 worker.
**§6 System** — lockout ⚠️ scaffold T-12.2; suspicious-login notify ❌ T-12.3; bell unread-count ✅ but **no numeric badge + no high-priority filter** ❌ T-47.6; bell history/mark-read ✅; area search ✅; avatar popup ✅ (500 storage T-4.1); **HR project image attachments ❌** T-52.3; task links-on-submit ⚠️ verify T-45.1; chat files ⚠️ previews T-47.5; task priority ✅; scope ❌ T-46.10; due dates ✅ (edit ❌); personal reminders ❌ T-22.8; reports exports 💀; onboarding UX ⚠️ T-8.2; overtime tracking ⚠️ tz T-16.1/16.2 (calendar OT colour ✅); complaint channel ⚠️ no DM + normal priority + wrong location T-47.10; kanban list+board ⚠️ T-46.1; task comments 💀 render T-46.5; dependencies ⚠️ badge/gating T-46.11/13; @mention ⚠️ dropdown ✅, render+snippet ❌ T-47.3; read receipts ⚠️ text-only T-47.3; pin messages ❌ T-47.4; not-clocked reminder 💀 T-17.x; late badge ⚠️ tz T-16.1; HR weekly/monthly graphs ✅ (200 live); weekly Sunday email 💀 T-2.2/T-24.11; audit log ⚠️ UI orphaned T-48.1 + worker; dark mode ✅ (violet hardcode T-36.1); tooltips ⚠️ T-50.3; dashboard quick actions ⚠️ T-21.x palette; submission note ✅ client-required.
**§7 UX patterns** — breadcrumbs ⚠️ hierarchy map T-34.2; pinned favourites ❌ UI T-24.6; widgets independent ✅ ErrorBoundary; click-through/refresh-hover/dismiss ⚠️ T-44.2/44.3; forms: pause-validation ⚠️ T-50.2, submit loading ✅, sectioned long forms ⚠️; save-as-draft ⚠️ 2 forms only T-31.6; skeletons ✅ drift T-51.7; progress-bar animate ❌ T-31.3; empty states ✅ shared ⚠️ drift/illustrations; toasts ✅ semantics T-51.6; inline editing ❌ T-31.4; destructive confirms ✅ ConfirmDialog; icon tooltips ⚠️ T-50.3; truncation tooltips ⚠️; dnd: task reorder ❌ T-46.11, kanban drag ✅-mechanism 💀-empty, widget reorder ✅ w/ save-on-mount bug T-33.1; status badges ✅ raw tints T-49.5 + AA contrast T-50.1; live timers ✅-ish ⚠️ pause/resume T-46.16; autosave-30s ❌ T-31.6; shortcuts Ctrl+K ✅, Ctrl+N/Ctrl+/ ⚠️ T-31.5; pagination ✅ meta bugs T-49.4; filter bar ✅ adoption T-49.5; chat unread border+badge ❌ T-47.2; per-item activity log 💀 T-46.5/14; gantt ⚠️ diamonds ❌ T-46.12; directory ✅ ⚠️ phone T-48.6; announcement board ✅ ⚠️ invalidation T-32.3 + dismiss persistence ⚠️; quick notes ✅ ⚠️ sidebar/palette entry; recurring ⚠️ payload mismatch T-46.6; shift reminders 💀 configurable ⚠️ T-48.1 (reminders-config orphaned).
**§8 Mobile** — bottom-nav ✅ ⚠️ ≤5 audit; hamburger drawer ✅; attendance widget prominence ⚠️ T-15.4; mobile chat ⚠️ keyboard T-47.9; one-field forms ❌ T-52.4; native pickers ⚠️; offline: banner ✅ queue ✅ timer-local ⚠️ sync T-15.3; chat "Not connected" ⚠️ T-47.9.
**§9 Screen map** — shared screens ✅ exist; admin/HR/employee screens exist ⚠️ (sidebar grouping ≠ spec tree) T-34.1; orphan/dead routes ⚠️ T-48.7 + audit redirect T-48.1; unreachable admin console/reports in nav ❌ T-14.4/T-34.1.

**Matrix verdict:** of ~120 traced bullets — ✅ ~30 · ⚠️ ~55 · ❌ ~25 · 💀 ~10. No bullet is unowned: every non-✅ maps to a live task above. This matrix is the §VP sign-off sheet: implementation is complete only when every row reads ✅ on the live deployment.
