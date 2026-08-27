# Games4King — Final End-to-End Audit (Unified Master)

**Date:** 2026-08-28 · **Scope:** complete codebase — `apps/api` (Laravel 11), `apps/web` (Next.js 16), `packages/ui` — merged from the backend production audit (`report.md`), the six-pass frontend audit (`frontend.md` Parts 1–14), plus a new product-completeness/gap audit (§16). Zero-trust: every claim below was derived from source and re-verified; no documentation was trusted.
**Method:** solo inline audit (review sub-agents hit the 5-hour usage limit twice; all evidence is greppable/traceable to `file:line`). Frontend detector archive: `.impeccable/detect-frontend-audit.json` (26 findings, 3 vendor/test false positives). Originals remain as deep-dive companions; this file is the master.

## Verdicts

| Dimension | Verdict |
|---|---|
| **Production readiness (backend + product)** | **NOT READY** — 9 critical / 19 high / ~35 medium / ~30 low findings (`report.md`) |
| **Frontend audit health** | **13/20** (Acceptable — significant work needed) |
| **Frontend Nielsen heuristics** | **23/40** (Acceptable) |
| **Product completeness** | Core workflows complete for Employee; **management/context gaps concentrate in HR + Super Admin surfaces** (§16) |
| **Overall** | A feature-rich, genuinely designed workplace OS whose delivery blockers are: one unauthenticated API backdoor, one frontend cookie bug locking every admin surface, several guaranteed-500 core operations, demo tooling that can destroy real data, and a dense cluster of context/continuity gaps around entity management |

---

## §1. System Snapshot

- **Backend:** Laravel 11, Sanctum (15-min access + 7-day rotating refresh tokens, cookie `g4k_refresh_token`), capability RBAC (`super_admin` `*`; `hr` 23 caps; `employee` 9), PostgreSQL, async export jobs, 12 scheduled jobs, Cloud Run worker (`g4k-worker`).
- **Frontend:** Next.js 16 App Router, TanStack Query, zustand, react-hook-form + zod, Tailwind 4, `@g4k/ui` (57 primitives, 170 importing files), echarts/dnd-kit/frappe-gantt/react-grid-layout/cmdk/sonner, laravel-echo.
- **Roles:** Employee (self-service + chat + tasks), HR (scoped to `department_hr`-assigned departments: approvals, corrections, employee/project/task management, team boards, reports), Super Admin (all + settings + audit).
- **Modules:** auth/onboarding/role-select, dashboards (widget engine), attendance (punch state machine, corrections, admin/HR boards), leave (balances/approvals/holidays), projects (phases, review pipeline, auto chat channel), tasks (kanban/list/gantt, submit→approve/redo, QA forms, recurrence, timer), chat (global/DM/group/project channels, mentions, receipts), announcements, notifications, directory + employee management + departments/designations, Employee 360, reports (summaries + async exports + saved views), audit logs, settings (11 tabs), profile/security/sessions, offline engine, command palette, mobile shell.

---

## §2. Verified Working (do not redesign)

**Backend:** login by email/username/employee-ID with timing-safe checks, 5-strike lockout, rotating refresh + refresh-ability blocking, reset with hashed 60-min tokens + global session revocation; capability middleware; row-locked attendance state machine (auto break-close, overnight attribution, client-id idempotency, ETag reads); leave overlap/working-day/balance checks, approval chain with self-block and balance refund; project `active→review→completed/redo` with QA gating; task participant scoping, blocked-by cycle guard, QA-enforced submission; chat membership/mentions/receipts/unreads; async export pipeline with retry + cleanup + CSV injection sanitization; immutable audit logs + login history; portable SQL (no `FIELD()`/`GROUP_CONCAT`; `CASE WHEN` sorts; `LOWER(?)` search).

**Frontend:** `@g4k/ui` architecture with real adoption (ConfirmDialog ×21 files, EmptyState ×33, ListScaffold ×11, DatePicker ×10, Toolbar ×9, DataTable ×5); token layer (semantic surfaces, status colors incl. `--overtime`, elevation e1–e4, density mode, motion vars, dark mode, 1440px cap); lazy-loading discipline (echarts/gantt/kanban/QA via `dynamic()`); mobile shell (bottom nav + FAB, chat fullscreen + visualViewport, sidebar Sheet); efficiency infra (cmdk palette + recents, URL-state filters, drafts ×5 forms, saved views, pins, offline queue with punch de-dup, cross-tab auth/timer sync); optimistic chat with read receipts; specific human error copy; per-segment error boundaries; axe-core in dev; focus-visible global ring; attendance-history calendar (nav+swipe+detail); time-clock widget; task-create dialog; Employee-360/Project workspace IA; the redirect-stub page consolidation.

---

## §3. Backend — Critical Findings (P0)

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| **C-1** | Unauthenticated impersonation backdoor `GET /api/test-projects` force-logs-in `praveen@games4king.in`; stray root script `fix_test_route.php` re-injects it | `routes/api.php:401` | Delete route + 3 stray scripts; CI grep guard |
| **C-2** | Seeder hardcodes live credentials (`$isProd=false`): super_admin `Admin@123` etc.; demo seed `updateOrCreate` by username **resets real accounts** | `DatabaseSeeder.php:245-246,248` | Restore env detection; demo-only keys; rotate passwords |
| **C-3** | Demo purge destroys real data: deletes **all avatars**, **all seeded users incl. the only super_admin** (`is_demo=true`), settings/audit rows — one admin click | `DemoPurgeCommand.php:136` etc. | Scope deletion; env guard; audit trigger |
| **C-4** | **Phase creation always 500s** (illegal `TaskActivity::create(['project_id'])`; `task_activity.task_id` NOT NULL; phase row persists before throw) | `PhaseController.php:104-107` | Remove the activity insert |
| **C-5** | Task/project **deletion 500s on pgsql** (`event='deleted'` violates enum CHECK) after soft-delete ran | `TaskController.php:756`, `ProjectController.php:307` | Drop insert or extend enum |
| **C-6** | **Task scope escalation:** default `scope='global'` assigns every non-super_admin + notifies all; dept/role scope bypasses permission rules; `scope_id` silently dropped (not fillable) | `TaskController.php:307-345` | Self default for non-managers; manager-only expansion; fillable fix |
| **C-7** | Route shadowing kills `GET /leave-requests/pending` + `/export` (registered after `/{id}`) | `routes/api.php:153,163,165` | Reorder or constrain `{id}` |
| **C-8** | `POST /tasks/{id}/move-phase` → controller method doesn't exist → 500 | `routes/api.php:222` | Implement or remove route+UI |
| **C-9** | HR cross-department leaks: timer logs unscoped (`TimerController.php:71-77`), logTime gate ignores dept, `leaveHistory/assignments` scope on wrong capability | `UserController.php:702-733` | Apply `HrScope` on `users.employee.manage` |

## §4. Backend — High Findings (P1)

1. **H-1** Realtime dead in prod: pusher keys absent → silent `log` fallback; `.env.production` references nonexistent `reverb`; every broadcast swallowed by try/catch; frontend shows permanent false "Offline" pill. 
2. **H-2** Clear-chat no-op: `cleared_at` never loaded onto pivot (`Conversation.php:24-27`).
3. **H-3** Task drag-reorder no-op: `order` not fillable; UI toasts success.
4. **H-4** Project cover upload 500 (undefined `$id`, `ProjectController.php:454`).
5. **H-5** = C-9 scope leaks. 6. **H-6** `teamToday` stale ≤1h (versioned cache key vs unversioned observer forgets). 7. **H-7** Password-reset approval persists plaintext reset link in notifications + response. 8. **H-8** PII leaks (blood group, emergency contact, alt mobile, preferences) in user `show`/`activity`, department/designation `show`. 9. **H-9** No last-super-admin guard on role demotion via `update`; duplicated post-transaction side effects. 10. **H-10** Avatar orphan growth (wrong delete path ×3 sites). 11. **H-11** Work-schedule update silently clears `is_default`; success on missing ids; weak validation. 12. **H-12** Leave-approval integrity: no balance recheck, no locking (double-decide race), `id OR approvable_id` can bind wrong approval; `leave.approve-hr` capability granted to no one. 13. **H-13** Redo strands task in `review` (approval flipped before status update 422s). 14. **H-14** Weekly summary queries nonexistent `admin` role — HR never receives. 15. **H-15** Users export ignores stored filters; export capability inconsistency. 16. **H-16** Global task assignment excludes NULL `active_role` users + notify-all storm. 17. **H-17** `/api/version` public: leaks commit sha + full `migrate:status`. 18. **H-18** Holidays route `cache.headers:public` on authenticated route. 19. **H-19** Login calls external `ip-api.com`; `trustProxies '*'`.

## §5. Backend — Medium (P2, condensed; full detail in `report.md` §5)

Dead dashboard cache keys + invalidation storm on every write/login (M-1/2); Approval changes don't invalidate pending caches (M-3); force-password-change + suspicious-login dormant (M-4); temp passwords in API response ignoring policy (M-5); public `/system/public-config` policy disclosure (M-6, with H-17); settings key whitelist/seeder mismatch (M-8); unaudited settings/company/holiday/work-schedule/QA mutations (M-20); token-role override vs in-controller check drift (M-9); de-roled users keep employee caps + 1h role caches (M-10); `syncEmployees` can move super_admins; teams on archived depts (M-12); unvalidated `/profile` preferences bypass (M-13); QA form edits orphan submissions (M-14); report job vs endpoint logic mismatches (M-15); export `chunk` on non-unique order (M-16); app-vs-company timezone mixing + unvalidated date params → 500s (M-17); leave policy gaps (no same-day sick, unpaid capped, race on differing ranges — M-18); half-day dead, no early-leave rule, open-shift misses `break_start` (M-19); team announcements broadcast org-wide (M-21); `react()` re-broadcasts create event, empty catch (M-22); chat unread O(n) subqueries (M-23); `monitor:health` never scheduled; `ScheduledReport` dead feature (M-24).

## §6. Backend — Low (P3, condensed)

Dead code (`SELF_SERVICE_EXCLUDED`, `TestPusherEvent`, empty `ApprovalObserver`, `RoleAssignment` cache, `WorkingDayCalculator` Feb-29 branch, `markLeaveDays` unused var); `/companies/{id}` ignores id; employee number outside txn; AutoNumbering seed race; multiple default schedules possible; `DEL-{id}` anonymize codes; audit cursor-comment vs offset; `activity()` hardcoded 30/page + `ip` alias; `downloadExport` whole-file memory; base64 export legacy; bulk ops always 200; self-deactivate/self-delete allowed; `submitted()` unpaginated; project update skips new-member notify; recurrence drops phase/blocked_by/parent; `pinChat` silently joins; `dismiss` unscoped; message edit schema-ready but no route; repo hygiene (stray root codemods; scratch/).

---

## §7. Frontend — Core Usability Findings (Part 5 of `frontend.md`, merged)

**Critical:** **A-1** capability-cookie lockout (`middleware.ts:47` reads `g4k_capabilities`, app writes `g4k_capabilities_{userId}` → Settings/Audit/Reports/Admin bounce **every role incl. super_admin**) · **A-2** HR leave-approvals dead end (`hr-attendance-view.tsx:14` lacks the linked tab) · **A-3** silent no-ops (clear-chat H-2, drag-reorder H-3, pin no broadcast) · **A-4** micro-typography pandemic (477 `text-[Npx]`: 214×10px, 130×11px, 54×9px, 7–8px outliers; 178 tiny+muted combos) · **A-5** runtime-computed `bg-${…}-500` renders some status dots colorless (color-only meaning, WCAG 1.4.1) · **A-6** placeholder/fictional profile sections (fake YouTube account, dead work-address Edit, static privacy selects) · **A-7** offline queue toasts false success; `/auth/logout` queueable.

**High-friction:** corrections 4 layers deep (W6) · export download memory-bridge (W19) · project edit stub (B-7) · silent caps (filters 100, boards 100, pickers 1000, shift-log 7/365) · temp-password handoff toast · team board staleness undisclosed · remember-me defeated (7-day cookie rewrite).

**Navigation/findability:** palette "Admin Settings" → profile non-tab · `/dashboard/admin` guarded 404 · "Attendance & Time" vs "Attendance" collision · reminders buried under Announcements · feedback + role-switch buried · dead nav branches.

**Forms:** placeholder-only selects; 25 labels repo-wide; zero helper text; same-day rule on submit only; verb glossary drift (Create/Add/Request/Save); 8 dialog widths; two date grammars; `window.confirm` ×5 in chat.

**A11y (WCAG):** 77 icon buttons vs 57 aria-labels (4.1.2) · 9–11px body text (1.4.3/1.4.4) · color-only status (1.4.1) · keyframe animations bypass reduced-motion (2.3.3) · h1 on 6/27 pages (1.3.1) · pill-tabs without semantics (4.1.2) · touch targets 24–32px (2.5.5) · gray-on-color ×11 (1.4.3).

**Consistency/density/perf:** ui Pagination zero direct uses (3 grammars); toast asymmetry (137 error/9 info); z-index soup (z-10×28…z-[9999]); settings two-column waste; attendance toolbar 3-row wrap @1024; charts fixed h-64 in resizable widgets; duplicate polling; prefetch query-key drift; Echo token staleness; hydration double-gate.

---

## §8. Page-by-Page (all 27 routes + shell; findings condensed from `frontend.md` Part 1)

| Page | 5-sec test | Key findings (ID refs) |
|---|---|---|
| /login | PASS | "identifier" jargon; Gen2k/G4K brand split; raw styled submit button |
| /forgot-password, /reset-password | PASS | admin-mediated fallback lacks expectation-setting; reset page solid |
| /onboarding | PASS | optional fields unmotivated; video muted ✓ |
| /role-select | PASS | auto-select infinite-loader failure state (S3/P1); cards don't say what changes |
| /change-password | PASS | policy-driven schema + meter; skip only when allowed; "other devices signed out" undisclosed |
| /dashboard (SA/HR/EMP) | PASS | approvals widget = best approve UX; employee "view all" missing; no reset-layout; overtime emphasis wrong pre-sync (31,500s) |
| /attendance | PASS | A-5 dots; nav label hides leave; 7-day log truncation; dead `holidays` TabsContent; same-day rule late |
| /org/attendance (SA) | PARTIAL | 5 tabs complete; numeric columns not right-aligned; corrections buried; board staleness |
| /org/attendance (HR) | FAIL | A-2 dead approvals tab; 2 tabs only |
| /projects | PASS | 9-field mega-dialog ungrouped; 1,000-user preload; two mental models (grouped vs flat); hidden inline rename |
| /projects/[id] | PASS | edit stub (B-7); phase-complete no warning on open tasks; Delete beside Edit |
| Tasks (board/list/gantt/QA) | PASS | reorder silent no-op; QA-drag teaching toast lacks action; 100-task cap notice; create-form = best form; detail sheet excellent, no "log time" |
| /chat | PASS | clear-chat no-op; 3-char silent search gate; pills a11y; reminders misplaced; window.confirm |
| /directory | PASS | "View" label backwards; temp-password toast; archive errors after-the-fact; departments/designations bypass ListScaffold |
| /directory/[id] (360) | PASS | **only Send Message action** (K-A1); activity empty-check bug |
| /reports | PASS* | *blocked by A-1; export memory-bridge; preview cap disclosed |
| /audit | PASS* | user filter capped at 100 in an investigation tool |
| /settings | PASS* | *blocked by A-1; empty shell for unauthorized; schedule default-flag silent loss; demo blast radius unstated |
| /profile | PARTIAL | A-6 fictional sections; security good but buried |
| Shell/nav/palette/mobile | — | A-1 lockout; palette admin link; false Offline pill; attendance naming collision; bottom-nav aria-current |

## §9. Workflow Friction (26 traced; `frontend.md` Part 2)

**Excellent:** clock in→break→out · offline punch+sync · **Good:** login, cancel leave, submit project review, review project, create task, submit task, approve/redo task, DM, group, announce, notifications triage, change password, revoke session, switch role, pins/notes · **Acceptable:** request leave, create project, manage employee, feedback · **Friction-heavy:** correct a missed punch (≈8 clicks/4 layers) · run export (≈9 steps, memory bridge) · **Poor:** reorder board (silent fail) · **Blocking:** HR approve via navigation (A-2) · move-phase (C-8) · admin opens any admin page (A-1).

## §10. Roles

**Employee:** coherent self-service; noise = scope filter, "My Tasks & Board" label; reminders buried. **HR:** approvals dead-end, Reports/Settings visible-but-blocked, two attendance labels, board staleness, correction depth; backend over-exposure (C-9) invisible but real. **Super Admin:** cannot administer (A-1); no personal attendance surface (nav filter) though backend allows; palette dead link; demo danger zone.

## §11. Screen Sizes (360→2560)

360: dialogs (425–500px) overflow; micro-type worst; tables scroll-only. 390–430: chat best-in-class; hover actions invisible; small targets. 768: icon rail; toolbar reflow ✓; settings tabs wrap ragged. 1024–1200: full nav; smallest text on primary work device. 1440: cap ✓. 1920+/2560: cap keeps density ✓. Cross-size defects: no dialog-as-sheet <640; `min-w-[800px]` heatmap; bulk-bar/FAB overlap.

## §12. Component System (`frontend.md` Parts 6–9, condensed)

**Adoption:** Dialog ×23, ConfirmDialog ×21, Tabs ×18, EmptyState ×33, ListScaffold ×11, DatePicker ×10, DropdownMenu ×12, Toolbar ×9, DataTable ×5, Wizard ×2, Combobox ×2; **AlertDialog dead ×0**; Button 321 vs 66 raw; Input 86 vs ~37 raw; Avatar ×87 (76 fallbacks); Skeleton ×158.
**Six missing primitives:** IconButton · SearchInput · UserPicker · StatusBadge-in-ui · Spinner · ExportButton. **Duplicate clusters (11):** user pickers ×4, status pills (1 de-facto + ≥7 ad-hoc), attendance tables ×2 vs DataTable, dept/designation CRUD vs ListScaffold, search ×5 behaviors, loading species, date grammars, confirms, dialog widths, feedback forms, pagination. **Distributions:** heights h-8×151/h-10×114/h-9×63/h-11×50/h-7×47/h-12×41 (6 values); radius 7 values; gaps healthy (gap-2×343; outliers gap-5/space-y-5/8); 53 hex; 181 arbitrary dims; ring-0 ×7. **States gaps:** Select no error variant; no counters; no success input; kanban no keyboard; tooltips hover-only. **Architecture:** tasks-tab 1,232l, qa-builder 831l, departments 817l — split container/presentation >400l. **Canonical system + 40-row upgrade matrix + 9-phase roadmap:** see `frontend.md` §6.12–6.13, Part 9.

## §13. Layout (`frontend.md` Parts 10–11, condensed)

Five page paddings (utility used once) · five card paddings · form rhythm 4 values + outliers · shell headers h-12/14/16 mixed · 26 unprefixed grids · charts fixed in resizable widgets · settings half-empty ≥1280 · attendance toolbar 3 rows @1024 · dialogs 8 widths · two table cell standards · heading scale drift (lg/xl/2xl/3xl as titles) · heatmap min-w-800 · EmptyState properly capped · negative margins ~20 (healthy) · works-well list (1440 cap, sidebar states, rhythm, grid ladders) preserved. 9-phase layout roadmap in Part 11.

## §14. Functional Fit (`frontend.md` Parts 12–13, condensed)

DatePicker: no Today/Clear/range; cells 32px · **0 SelectItem+Avatar anywhere** (all people-pickers text-only; avatar_url wired ×43 elsewhere) · inputs full-width by default · 5 search widths · 0 textarea `rows` · export enabled-when-unselected · login raw button · contextual-action gaps (360 actions, row-level correct, log-time) · wiring master list (I-F1) · heatmap responsive · checklist in Part 13.

## §15. Information Architecture (`frontend.md` Part 14, condensed)

No duplicate pages (redirects consolidated; 7 stubs verified) · dead duplicates to delete (approvals-tab 312l, feedback widget) · Employee 360 lacks manager actions (K-A1) · QA builder buried as tasks view-mode · rename "My Attendance"/"Team Attendance" · merge Departments+Designations → "Org Structure" · three activity feeds → one primitive · contextual settings (project settings stub, notification split correct) · target nav architecture + keep-list (Part 14-S) · P0–P3 additions (Part 14-T).

---

# §16. Product Completeness & Gap Audit (NEW — seventh dimension)

> Format for majors: Area / Workflow / Role / Current / Missing / Why it matters / Expected / Solution / Where it lives / Navigation impact / Priority / Confidence / Classification. Classification legend: **[Confirmed]** logically required · **[Improvement]** exists but hard · **[Consolidation]** reorganize · **[Enhancement]** useful, not required · **[Speculative]** needs product decision.

## 16-A. Executive Summary
The Employee journey is complete end-to-end. The gaps cluster where the product is *managed*, not *used*: post-creation continuity (create → then what?), entity management lifecycles (projects can't be re-teamed; leave can't be edited; users can't be erased from the UI), admin discoverability (QA builder, scheduled reports, demo danger), and day-one company onboarding (no employee import, empty-state dashboards with no guidance). Several "missing features" turn out to be dead backend features never surfaced (scheduled reports) or backend bugs that erase capabilities the UI implies (weekly summary for HR, half-day).

## 16-B. Application Map
Covered in §1; full route→purpose→role table in `frontend.md` Part 1 / `report.md` §2. Entities: User, Department/Team, Designation, WorkSchedule, Holiday, AttendanceDay/Event/Correction, LeaveRequest/Balance, Project/Phase/Member, Task/Assignee/Comment/Reminder/TimeLog/QaForm/QaSubmission, Conversation/Message, Announcement/Reaction, Notification, ExportJob, SavedView, AuditLog/LoginAttempt, Pin/QuickNote/PersonalReminder, Company/Setting.

## 16-C → 16-F. Creation → Management Lifecycle Gaps

**GAP-1. Post-creation dead ends (all create dialogs)**
- **Area:** create-project / create-employee / create-task / create-group dialogs · **Workflow:** Create → Configure → Save → *Verify/Manage* · **Role:** HR, SA.
- **Current:** dialog closes into the list; no navigation, no "Open X" action, no "Add another".
- **Missing:** the verify/manage stage of the lifecycle.
- **Why it matters:** after creating a project the manager's *very next intent* is adding tasks/members — today they must re-find it in the list (search/scroll) first; after creating an employee the next intent is handing over credentials and opening the 360.
- **Expected:** success toast with **[Open project]** / redirect to 360 with an actions bar; "Create another" for bulk employee adds.
- **Where:** toast actions (no new pages) + post-create navigation. **Nav impact:** −1–2 steps × frequency of creation. **Priority: P1 · Confidence: High · [Confirmed]**

**GAP-2. Employee offboarding erasure not in UI** — `anonymize` exists only as API (`UserController::anonymize`); UI stops at deactivate/soft-delete. Real companies must erase leavers' PII. **Solution:** "Erase personal data" in 360/trashed-row menu (SA) with double confirm. **P2 · High · [Confirmed]**
**GAP-3. Leave cannot be edited** — wrong dates require cancel→recreate (balance refund quirks included). Add admin edit (dates/type) with re-validation, or at minimum a "request changes" comment to the employee. **P2 · Medium-High · [Confirmed]**
**GAP-4. Project re-teaming impossible** — edit stub (B-7) blocks member/department changes post-creation; delete+recreate is the only path. Already P1; reclassified here as a *lifecycle* gap: projects are long-lived; teams change. **P1 · High · [Confirmed]**
**GAP-5. QA forms lack a management lifecycle UI** — buried builder (L-A2); no forms list with usage counts, no duplicate/template flow; delete guarded by usage but no "what uses it" view. **P2 · High · [Confirmed]**
**GAP-6. Task comments lack attachments** — chat has them; task review discussions often need screenshots. **P3 · Medium · [Enhancement]**
**GAP-7. Recurrence completion silent** — next occurrence created but only implied; toast "Next occurrence created (due …)" + link. **P2 · High · [Improvement]**
**GAP-8. No project archive** — completed projects accumulate with active in filters; archive (soft state) or auto-filter default. **P3 · Medium · [Enhancement]**

## 16-G. Navigation & Click-Path Problems
Consolidated from Part 2/14: corrections 4 layers · export 9 steps · role-switch/change-password 2 levels deep · edit-employee only in table row (K-A1 fixes the worst) · admin surfaces blocked (A-1) · approvals dead-end (A-2). Click-path reductions tabulated in `frontend.md` I.

## 16-H. Missing Pages (only where logically required)
1. **QA Forms management surface** — not a new route necessarily; a header action + list dialog suffices (GAP-5). **P2 · [Confirmed]**
2. **Global search results** — palette searches commands/recents, not entities; a "search everything" (people/projects/tasks) results view. **P3 · Medium · [Enhancement]** — palette extension preferred over a page.
3. **Nothing else qualifies** — audit intentionally rejects "every SaaS has X" pages (no kanban-of-everything, no files module, no docs module).

## 16-I. Missing Features (inside existing pages)
Employee **import** (CSV) for day-one migration — the company onboards ~all staff at launch; one-by-one creation with toast-passwords won't scale past a handful. **P2 · Medium · [Enhancement]** · **Scheduled reports** — backend model exists, nothing consumes (M-24): implement digest emails from existing report endpoints **or delete the dead model**. **P2 product decision · [Confirmed dead feature]** · Saved-view management beyond reports (rename/delete; extend to tasks/attendance). **P2 · [Improvement]** · Work-schedule usage view ("N people on this schedule"). **P3 · [Improvement]** · Announcement history/archive of dismissed. **P3 · Low · [Enhancement]** · Chat mark-all-read per scope. **P3 · [Improvement]**.

## 16-J. Missing Options & Actions
Reject-reason prompted on leave rejection (currently silent reject; task redo requires reason — asymmetric) **P2 [Improvement]** · "Filters" summary chips + one-clear (search/filters/date/sort reset) on heavy tables **P2 [Improvement]** · bulk reassign tasks **P3 [Enhancement]** · duplicate task/project **P3 [Enhancement]** · half-day leave **[Speculative]** — enum dead end-to-end; explicit product decision required · configurable leave types/balances per type-year **[Speculative]**.

## 16-K. Contextual Access Improvements
360 manager action bar (K-A1) · row-level "Correct" (W6) · export download in completion toast (W19) · "log time" on task sheet · "manage forms" from QA select in create-project · "configured in Settings" tooltips on reminder widgets · "personalize" link from settings Notifications → profile.

## 16-L. Consolidation Opportunities
Part 14-I/R: HR approvals tab · Org-Structure tab merge · ActivityFeed primitive · reminders relocation · keep the rest as-is.

## 16-M. Role-by-Role Gaps
**Employee:** empty dashboard day-one (no tasks/projects yet) with zero guidance — add contextual empty-state CTAs ("Ask your manager to add you to a project" / create your first personal task) **P2 [Improvement]**; same-day sick leave policy **P2 [Confirmed, backend]**; reminders/feedback discoverability. **HR:** everything in §10 plus corrections depth, schedule-blind boards (backend), weekly summary never arrives (H-14 — fix, don't build). **SA:** admin lockout (A-1) · personal attendance absence (decide) · demo-data danger labeling (C-3) · audit user-filter cap.

## 16-N. Daily Company Usage Gaps (what breaks at month 3)
Team board staleness erodes trust (H-6) · realtime-off "Offline" badge generates IT tickets (H-1) · 100/1000 caps silently corrupt pickers and filters as headcount grows · notification 30-day purge surprises HR investigations · audit user-filter cap hides most staff · demo dataset intermingled with real data (C-2/C-3) · two brand names (Gen2k/G4K) confuse staff · password reset via admin hand-off link (H-7) becomes the normal flow once SMTP misconfigures.

## 16-O. Workflow Dead Ends
Create-* dead ends (GAP-1) · export completion (W19) · approve-in-widget without "next" · leave rejection without reason/reply channel · demo purge (C-3 — the terminal dead end) · search-no-match states without guidance (chat 3-char gate) · settings unauthorized empty shell · profile placeholder dead controls.

## 16-P. Feature Discoverability Gaps
QA builder · personal reminders · role switcher · feedback form · saved views · restore-trashed filter · inline project rename · announcement priority semantics · density mode · drafts (undisclosed that forms auto-save!) — add "draft saved" microcopy. **P2 cluster [Improvement]**.

## 16-Q. Recommended Product Structure
= Part 14-S target nav + workspace extensions (360 actions, real project settings) + no new top-level modules.

## 16-R. Priority Roadmap (delta only; merges into §17)
**P1:** GAP-1 post-creation actions. **P2:** GAP-2 erasure UI · GAP-3 leave edit · GAP-5 QA management · employee import · reject-reason · saved-view management · employee empty-state guidance. **P3:** GAP-6/7/8 · global search · schedule usage view · announcement archive · bulk reassign · duplicate.

## 16-S. Final "Nothing Missing" Checklist
Pages: no missing top-level pages (2 conditional items above) ✔ · Components: 6 missing primitives (§12) ✔ · Actions: 360 bar, row-correct, log-time, download-in-toast ✔ · Options: reject-reason, half-day decision, filter-reset ✔ · Settings: contextual links only ✔ · Navigation: renames + dead links ✔ · Context: K-list ✔ · Workflow: dead-ends O-list ✔ · Creation: GAP-1..5 ✔ · Management: GAP-2..8 ✔ · Discovery: P-list ✔ · Relationships: 360↔tasks↔projects↔chat all navigable after K-A1/B-7 ✔ · Roles: M-list ✔ · Daily use: N-list ✔. **Speculative items requiring the client's product decision: half-day leave · configurable leave types · scheduled reports (build vs remove) · SA personal attendance · employee import timing.**

---

# §17. Unified Roadmap (single sequenced plan; supersedes per-part roadmaps)

**Wave 0 — Security & data safety (days):** C-1 backdoor + stray scripts · C-2 credential rotation · C-3 demo-purge guards · H-7 reset-link handling · H-17/H-18/M-6 public endpoints · deploy + smoke.
**Wave 1 — Unblock the product (this week):** A-1 cookie fix + admin smoke test · A-2 HR approvals tab · C-4 phase 500 · C-5 delete 500s · C-6 scope escalation · C-7 leave routes · C-8 move-phase · H-3 reorder persistence · H-2 clear-chat · A-6 placeholder deletion · A-7 offline truthiness.
**Wave 2 — Trust & correctness:** H-6 board staleness + "last updated" · H-11 schedule default · H-12 approval locking/recheck · H-13 redo order · H-14 weekly summary roles · H-15 export filters · C-9/H-5 HR scope leaks · H-8 PII hiding · H-9 last-admin guard · H-10 avatar path · A-5 status map · remember-me cookie · GAP-1 post-creation actions.
**Wave 3 — Component consolidation (Parts 6/9):** six missing primitives (UserPicker w/ avatars, SearchInput, IconButton, StatusBadge, Spinner, ExportButton) · Dialog size prop + mobile sheet · DataTable absorbs attendance tables · Wizard for project/user forms · DatePicker Today/Clear/range + report presets · Select error variant · delete dead components · heatmap responsive.
**Wave 4 — Layout & density (Part 11):** page-padding/card-padding adoption · height/radius/type scale codemods (A-4) · FormGrid · toolbars · chart autoresize · unprefixed-grid fix.
**Wave 5 — IA & context (Part 14/16):** attendance renames · 360 manager action bar · project settings completion (B-7) · QA surfacing · reminders relocation · K-list contextual actions · GAP-2/3/5.
**Wave 6 — A11y & responsive (Parts 4/G/L):** labels/targets · motion-safe wrap · tablist semantics · h1s · ring recipe · dialogs-as-sheets · touch actions.
**Wave 7 — Completeness enhancements (16-R):** employee import · saved views v2 · empty-state guidance · reject-reason · product decisions from 16-S.
**Wave 8 — Final pass:** verb/confirm/breadcrumb glossaries · dead-code sweep · redirect-stub removal · E2E smoke suite (3 roles × core flows) in CI · detector + `$impeccable critique` + live-browser verification · re-score (targets: audit health ≥17/20, Nielsen ≥30/40, zero P0/P1 open).

---

*Companion deep-dives: `report.md` (backend full detail) · `frontend.md` (Parts 1–14 full detail) · `manual.md` (client manual). Detector archive: `.impeccable/detect-frontend-audit.json`. All findings re-verifiable from the cited `file:line` evidence.*
