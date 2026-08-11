> **ARCHIVED:** This file is stale and superseded by context.md and ix-3.md.

# fix-2.md — Base Module + Attendance Module + Dashboard: Final Fix Plan
## Games4King Workplace OS — Production Readiness for Daily Use

> **Scope (strict):** Departments, Employees/Users, Designations, Directory, Attendance (employee +
> HR + admin), Dashboard, and all related UI/UX states/workflows. Seed complete demo data. Make every
> workflow work flawlessly for day-to-day live production use. **No new modules, no architecture
> changes, no scope expansion.** Fix what exists against the spec.
>
> **Authoritative references:**
> - `openspec/REQUIREMENTS.md` R2.1–R2.13 (Org), R2.10 (Directory), R4.1–R4.9 (Dashboard),
>   R5.1–R5.16 (Attendance), R10.1–R10.3 (Settings/Audit), R11.4 (status badges), R13.x (perf)
> - `openspec/project.md` §2.1 (M1 capability matrix)
> - `openspec/DESIGN-SYSTEM.md` §13 (dashboard widgets), §14 (no mock data), DR-DS1 (charcoal + accents)
> - `openspec/COMPONENT-SYSTEM.md` §3 (DataTable/FilterBar/Badge/Avatar/Progress/EmptyState),
>   §7 (module composites: Attendance/Org/Leave)
> - `Images, SVG, PDF/data-prefill-reference.txt` (the 13 real employees + departments + designations)
>
> **Locked decisions that govern this work:**
> - **DR-DS1:** White canvas + charcoal primary + multi-color accents (no single color dominates).
> - **DR-ATT1:** Grace period (default 10 min, configurable) before "late."
> - **DR-ATT2:** Flexible single break (start/end anytime).
> - **DR-ATT3:** Forgot clock-out → flag + HR/Admin manual correction.
> - **DR-LEAVE1:** No balances in M1.
> - **DR-DASH1:** Fixed per-role widget layouts (no drag/resize).
> - **DR-MD1:** Export + activate/deactivate + search/filter/pagination/audit. No import in M1.
> - **DR-APPROACH1:** Refactor in place — preserve all working data flows.
>
> **Execution rule:** Fix critical backend bugs first (so the UI works against a correct API), then
> seed, then fix frontend workflows screen-by-screen, then verify end-to-end.

---

# PART 1 — AUDIT FINDINGS (current code vs. spec, with file:line evidence)

## 1.1 What is CORRECT (preserve — do NOT rebuild)

> Verified working. These must not be touched.

**Base Module:**
- ✅ UserController: index (search 5 fields, filter dept/status/role, cursor pagination, eager-load) — `UserController.php:24-62`
- ✅ UserController: dual capability gate on store/update (`users.hr.manage` for HR/admin roles, `users.employee.manage` for employee) — `:109-119,177-183`
- ✅ UserController: last-super-admin guard on deactivate + delete — `:218-229,242-248`
- ✅ UserController: per-user activity endpoint — `:258-279`
- ✅ UserController: export (CSV via SimpleExcel) — `:64-88`
- ✅ DesignationController: CRUD + in-use guard + export — full file
- ✅ DirectoryController: search + visibility (sensitive fields hidden) + sendMessage (real conversation) — full file
- ✅ Frontend: users/departments/designations/directory pages all use shared DataTable + FilterBar
- ✅ Frontend: search debounce (250ms) + URL state sync on all 4 pages
- ✅ Frontend: loading skeletons + empty states on all 4 pages
- ✅ Seeder: 13 employees with real data matching `data-prefill-reference.txt`; `must_change_password=true`; capabilities + work schedule + holidays + company seeded

**Attendance Module:**
- ✅ AttendanceService: state machine (rejects invalid sequences), client_id dedupe, now() drift fixed, total/break/overtime calc, has_open_shift, manual-source protection, version increment — `AttendanceService.php` full
- ✅ AttendanceController: clock in/out/break (one-tap), meToday/meHistory/meDay (with projects+tasks), sync (offline) — full
- ✅ AttendanceController: correct() with add/edit/remove events + reconcile + notification — `:358-457`
- ✅ AttendanceController: export (.xlsx via SimpleExcel, date-range) — `:459-495`
- ✅ LeaveAttendanceIntegration: respects working days (Mon-Sat), skips Sundays, recurring holidays — full listener
- ✅ Frontend: TimeClockWidget (one-tap optimistic, clock-out confirm, global timer store, ≥48px mobile, overtime indicator) — `time-clock-widget.tsx` full
- ✅ Frontend: AttendanceHistoryCalendar (ECharts heatmap, 5 colors incl. overtime/leave, day-detail dialog) — full
- ✅ Frontend: HrAttendanceGraph (per-employee toggle, weekly/monthly) — full
- ✅ Frontend: HrCorrectionDialog (add/edit/remove, predicted-totals preview, mandatory reason) — full
- ✅ Frontend: attendance page layout (widget + summary + calendar), empty/loading states, mobile responsive

**Dashboard:**
- ✅ Per-role widget layouts (Admin/HR/Employee) — `dashboard/page.tsx:37-159`
- ✅ MetricWidget (real data, animates 0→value, module-not-available empty state) — full
- ✅ WidgetEngine (per-widget ErrorBoundary, layout persistence, responsive grid) — full
- ✅ Quick-action shortcuts per role — `:182-211`

## 1.2 CRITICAL BUGS (must fix first — these break daily use)

| ID | Bug | Evidence | Impact |
|---|---|---|---|
| **CRIT-1** | **Department archive/restore is a silent no-op.** `Department::$fillable` lacks `is_active` + `archived_at` → `$dept->update([...])` in `archive()`/`restore()` silently fails. | `DepartmentController.php:107,122`; `Models/Department.php` ($fillable) | Admin clicks Archive → toast success but dept stays active. |
| **CRIT-2** | **Designation activate/deactivate is a silent no-op.** `Designation::$fillable` lacks `is_active` → `updateStatus()` silently fails. | `DesignationController.php:107`; `Models/Designation.php` | Same — toggle appears to work but doesn't. |
| **CRIT-3** | **Attendance export sends `Bearer undefined` → 401.** HR/Admin tables read `auth_token` from cookies, but the app writes `g4k_token` (and stores token in zustand). | `hr-attendance-table.tsx:74`, `admin-attendance-table.tsx:78` | Export button always fails for everyone. |
| **CRIT-4** | **HR cannot load attendance overview → 403.** HR table + HR dashboard widget + Admin dashboard widget ALL call `/attendance/admin/overview` which is gated `admin.view-all-attendance`. HR has `hr.view-team-attendance`, not `admin.view-all-attendance`. The dedicated `/attendance/hr/today` endpoint exists but is unused. | `hr-attendance-table.tsx:57`, `hr-team-attendance-widget.tsx:14`, `admin-today-attendance-widget.tsx:13`; route gate `api.php:101` | HR's primary attendance screen is blank/403. |
| **CRIT-5** | **Scheduler jobs write to non-existent `message` column.** `RemindShiftStart`, `AlertMissedClockIn`, `FlagOpenShifts` jobs use `'message' => ...` but `notifications` table + Notification model only have `body`. Mass-assignment drops it → empty-body notifications. | `Jobs/RemindShiftStart.php:64`, `Jobs/AlertMissedClockIn.php:76`, `Jobs/FlagOpenShifts.php:37,55` | All scheduler-driven notifications have empty bodies. |
| **CRIT-6** | **Grace period never applied to "late" flag.** `reconcileDay` marks late on ANY lateness past `start_time`. The `grace_minutes` column exists but is never read by reconciliation (only by AlertMissedClockIn job). DR-ATT1 says 10-min grace. | `AttendanceService.php:183-189` | Employee clocking in at 09:01 is flagged "late" — should be on-time within grace. |
| **CRIT-7** | **Duplicate grace columns.** `grace_period_minutes` (migration `..._210322`) AND `grace_minutes` (migration `..._214226`) both exist. `WorkScheduleController` validates `grace_period_minutes`; jobs read `grace_minutes`. Schema and reads disagree. | migrations + `WorkScheduleController.php:24`, `Jobs/AlertMissedClockIn.php:44` | Configuring grace in settings doesn't affect the jobs that read the other column. |
| **CRIT-8** | **HR correction fails 403.** Route gate is `admin.correct-attendance` (`api.php:111`), but HR is the primary UI consumer of the correction dialog. HR has `attendance.correct-team`, not `admin.correct-attendance`. The in-method dept-scope check would permit HR, but the route gate blocks first. | route `api.php:111`; `hr-correction-dialog.tsx` consumer | HR can't correct attendance — a core daily workflow. |

## 1.3 STRUCTURAL GAPS (must fix for completeness)

| ID | Gap | Evidence | Spec |
|---|---|---|---|
| **GAP-1** | **User create/edit dialog missing fields.** Form state holds `username, phone, designation_id` but they're never rendered as inputs. `team_id`, `employee_id` also missing. `roles` is a single `<select>` not a multi-checkbox (backend supports arrays). | `org/users/page.tsx:459-535` | R2.3/R2.5 (name, email, employee ID, dept, team, designation) |
| **GAP-2** | **Directory "private" visibility branch missing.** `applyVisibilityRules` only handles `public\|\|internal`; no else → private users still expose email/phone (or undefined keys). | `DirectoryController.php:26-32` | R2.10 (per-user opt-in) |
| **GAP-3** | **Directory Send Message doesn't navigate to chat.** Success handler just toasts the conversation_id; no route to continue the conversation. | `directory/page.tsx:70-72` | R2.10 (click → Send Message) |
| **GAP-4** | **Department members not viewable from departments page.** Count shown (with placeholder avatars), but no drill-down to see the actual users. No `/departments/{id}/members` endpoint. | `org/departments/page.tsx` | R2.7 (full member list) |
| **GAP-5** | **No pagination UI on any list page.** Backend returns cursor-paginated data; frontend renders `data.data` with no next/prev or "load more" controls. | users/departments/designations/directory pages | R3.10 (pagination 20/50/100) |
| **GAP-6** | **No error states on list pages.** All 4 pages have loading + empty but no error branch (query `isError`). | all org pages + directory | R13.21 (retry available) |
| **GAP-7** | **Bulk actions stub.** Users page renders "Bulk Activate/Deactivate" buttons with no onClick; no backend bulk endpoint. | `org/users/page.tsx:426-434` | R11.8 (bulk actions) |
| **GAP-8** | **AdminOpenShiftsTable "Notify HR" is a stub.** Action commented out; only shows toast. | `admin-open-shifts-table.tsx:62-63` | R5.11 (HR alerted) |
| **GAP-9** | **Calendar has no month navigation.** Fixed full-year view; can't browse prior years/months. | `attendance-history-calendar.tsx:47,109` | R5.3 (calendar history) |
| **GAP-10** | **Calendar forces horizontal scroll on mobile** (`min-w-[800px]`). | `attendance-history-calendar.tsx:132` | R13.22 (mobile) |
| **GAP-11** | **HR attendance page has no inline analytics summary cards** (only Admin page does). | `org/attendance/page.tsx` | R5.5 (HR view) |
| **GAP-12** | **No department filter on HR attendance table** (only Admin has it). | `hr-attendance-table.tsx` | R5.5 |
| **GAP-13** | **TimeClockWidget swallows initial-load errors silently** (`catch {}`). | `time-clock-widget.tsx:54-56` | R13.21 |
| **GAP-14** | **Cross-midnight >36h breaks reconciliation** (query window is +36h; no carryover logic). | `AttendanceService.php:68-69` | R5.1 (edge) |
| **GAP-15** | **Controller-level capability checks missing** on `updateStatus`, `destroy`, `resetPassword` (UserController) — only the role-creation path in store/update is gated. A caller with `users.employee.manage` could deactivate an HR/admin user. | `UserController.php:209,238,281` | R2.1 (capability-based) |
| **GAP-16** | **Department AvatarGroup shows placeholder "U" avatars**, not real member names/photos. | `org/departments/page.tsx:167-172` | R2.7 |
| **GAP-17** | **`hrToday` endpoint delegates to `overview`** which is admin-gated — so even the dedicated HR endpoint 403s for HR. | `AttendanceController.php:315-319` | CRIT-4 root cause |

## 1.4 SEED GAPS (demo data for day-to-day verification)

| ID | Gap | Evidence |
|---|---|---|
| **SEED-1** | **No attendance demo data seeded.** Fresh DB has zero attendance events/days. The dashboard "today attendance" widgets show all-absent; history heatmaps are empty. For day-to-day verification we need realistic attendance records for the 13 employees across the past ~30 days. | no attendance seeder exists |
| **SEED-2** | **Work schedule not linked to users/departments.** Schedule exists but no assignment rows; reconciliation falls back to default (works, but explicit linking is cleaner). | seeder lines 82-96 |
| **SEED-3** | **22 designations seeded but spec references 15 "roles".** The 15 are job titles (designations), not auth roles — only 3 auth roles exist (correct per project.md §2). Designations count is fine (richer), just noting the spec wording. | seeder lines 117-127 |

---

# PART 2 — IMPLEMENTATION PLAN (phased, backend-first)

> **Why backend-first:** CRIT-1 through CRIT-8 are backend bugs that make the frontend appear broken.
> Fixing the UI before the API would mean testing against a broken API. Fix API → seed → then UI.

---

## PHASE 0 — Audit (DONE — Part 1 above)
17 correct items preserved; 8 critical bugs + 17 gaps + 3 seed gaps catalogued.

---

## PHASE 1 — Fix critical backend bugs (CRIT-1 → CRIT-8)

> Each fix is small, surgical, and independently testable. Do all 8 before seeding.

### 1.1 [fix][api] CRIT-1 — Make Department archive/restore work
**Inspect:** `Models/Department.php` `$fillable`.
**Change:** Add `'is_active'` and `'archived_at'` to `$fillable`.
```php
protected $fillable = ['department_id','company_id','name','description','is_active','archived_at'];
```
Also add `$casts = ['archived_at' => 'datetime']` if not present.
**Do-not-change:** Controller logic (archive/restore methods are correct; they just couldn't persist).
**Acceptance:** Archive → `is_active=false, archived_at=now()`; Restore → both reversed.
**Verify:** `php artisan tinker` → `Department::find(1)->update(['is_active'=>false])` persists.

### 1.2 [fix][api] CRIT-2 — Make Designation activate/deactivate work
**Inspect:** `Models/Designation.php` `$fillable`.
**Change:** Add `'is_active'` to `$fillable`.
**Do-not-change:** Controller `updateStatus` logic.
**Acceptance:** Deactivate → `is_active=false`; Activate → true.
**Verify:** tinker → persists.

### 1.3 [fix][api] CRIT-7 — Consolidate grace columns
**Inspect:** Two migrations added `grace_period_minutes` (…_210322) and `grace_minutes` (…_214226).
**Change:**
1. Create a new migration to drop `grace_minutes` (the duplicate) and keep `grace_period_minutes` (the one WorkScheduleController validates). OR drop `grace_period_minutes` and keep `grace_minutes` — **pick `grace_minutes`** since DR-ATT1 and the jobs already reference it; update `WorkScheduleController` validation to `grace_minutes`.
2. Update `WorkScheduleController.php:24` validation: `'grace_minutes' => 'integer|min:0|max:120'`.
3. Update seeder line ~90 to use `'grace_minutes' => 10`.
**Do-not-change:** Other work_schedule fields.
**Acceptance:** One `grace_minutes` column; controller + jobs + seeder all agree.
**Verify:** `php artisan migrate`; tinker → `WorkSchedule::first()->grace_minutes` returns 10.

### 1.4 [fix][api] CRIT-6 — Apply grace period in reconciliation
**Inspect:** `AttendanceService.php:183-189` — late computed as `firstClockIn > scheduledStart`.
**Change:** Read grace from the schedule and apply it:
```php
$grace = (int) ($schedule->grace_minutes ?? 0); // DR-ATT1: default 10
$graceSeconds = $grace * 60;
$lateSeconds = max(0, $firstClockIn->diffInSeconds($scheduledStart) - $graceSeconds);
// only "late" if past start + grace
$lateSeconds = ($firstClockIn->timestamp > $scheduledStart->timestamp + $graceSeconds)
    ? $firstClockIn->diffInSeconds($scheduledStart) - $graceSeconds
    : 0;
$day->late_minutes = (int) floor($lateSeconds / 60);
```
**Do-not-change:** total/overtime/break/status logic.
**Depends-on:** 1.3 (grace column consolidated).
**Acceptance:** Clock-in at 09:05 with 10-min grace → not late; at 09:11 → late by 1 min.
**Verify:** Unit test — punch at 09:09 → late_minutes=0; punch at 09:15 → late_minutes=5.

### 1.5 [fix][api] CRIT-4 + GAP-17 — HR attendance endpoints
**Inspect:** HR frontend calls `/attendance/admin/overview` (admin-gated) → 403. `hrToday` delegates to `overview`.
**Change:**
1. `AttendanceController::hrToday` — stop delegating to `overview`. Implement directly with HR scoping (own department), returning today's records. Use the SAME filter logic but scope by department_id, not company-wide.
2. Frontend: `hr-attendance-table.tsx:57` → call `/attendance/hr/today` (not `/attendance/admin/overview`).
3. Frontend: `hr-team-attendance-widget.tsx:14` → same fix.
4. Frontend: `admin-today-attendance-widget.tsx:13` → keep `/attendance/admin/overview` (Admin has the capability).
**Do-not-change:** Admin endpoints; the `applyHrScoping` helper.
**Acceptance:** HR loads team attendance without 403; Admin loads company-wide.
**Verify:** Login as HR (aravind) → attendance page loads; as Admin (karthik) → loads.

### 1.6 [fix][api] CRIT-8 — HR correction capability gate
**Inspect:** Route `api.php:111` gates `correct` with `admin.correct-attendance` only.
**Change:** Allow either capability:
```php
Route::post('/attendance/correct', [AttendanceController::class, 'correct'])
    ->middleware('capability:admin.correct-attendance|attendance.correct-team');
```
The controller already does in-method dept-scoping for HR (lines 373-382). The route just needs to let HR through.
**Do-not-change:** In-method scoping (HR cross-dept → 403 stays).
**Acceptance:** HR can correct own-team attendance; Admin any; HR cross-team blocked.
**Verify:** HR submits correction for own-team member → 200; for other-team → 403.

### 1.7 [fix][api] CRIT-5 — Notification column name in jobs
**Inspect:** 3 jobs use `'message' => ...`; table/model have `body`.
**Change:** In `Jobs/RemindShiftStart.php:64`, `Jobs/AlertMissedClockIn.php:76`, `Jobs/FlagOpenShifts.php:37,55` → replace `'message'` with `'body'`. Also ensure `'title'` and `'link'` are set (they exist in the table).
**Do-not-change:** Job logic (querying, dispatching).
**Acceptance:** Scheduler-run notifications have non-empty body.
**Verify:** Dispatch a job manually → notification row has body text.

### 1.8 [fix][web] CRIT-3 — Export auth token source
**Inspect:** `hr-attendance-table.tsx:74`, `admin-attendance-table.tsx:78` read `auth_token` cookie.
**Change:** Read token from the zustand store:
```ts
import { useAuthStore } from "@/lib/auth-store";
// in the export handler:
const token = useAuthStore.getState().token;
const res = await fetch(`${API_BASE}/attendance/export?...`, {
  headers: { Authorization: `Bearer ${token}` },
});
```
**Do-not-change:** The blob-download logic (correct).
**Acceptance:** Export downloads successfully (no 401).
**Verify:** Click export → file downloads.

### 1.9 [test][api] Write tests for the 8 fixes
**Change:** Add to `tests/Feature/`:
- Department archive/restore persists.
- Designation activate/deactivate persists.
- Grace period: punch at 09:09 → not late; 09:15 → late.
- HR scoping: HR sees own dept; Admin sees all.
- HR correction: own team 200; other team 403.
- Notification job writes body.
**Acceptance:** `php artisan test` — all green.
**Verify:** Test output.

**Phase 1 gate:** All 8 critical bugs fixed + tested. **Do not proceed to Phase 2 until tests pass.**

---

## PHASE 2 — Seed complete demo data (SEED-1 → SEED-3)

> Goal: a realistic, populated database for day-to-day verification across all 3 roles.

### 2.1 [seed][api] Create AttendanceDemoData seeder
**Inspect:** No attendance seeder exists.
**Change:** Create `database/seeders/AttendanceDemoDataSeeder.php` that generates realistic attendance for the 13 employees over the past 30 days (excluding Sundays + seeded holidays):
- For each working day per employee: 85% present, 10% absent (random), 5% on-leave (if a leave request exists).
- Present days: clock_in between 08:50–09:20 (some late past grace), 0-1 break (45 min), clock_out between 18:20–19:10 (some overtime). Write `attendance_events` (clock_in, break_start, break_end, clock_out) with `client_id` uniqueness, then call `AttendanceService::reconcileDay` for each.
- Some employees (2-3) have an open shift on the most recent day (forgot clock-out) to demo the flagging workflow.
- A few manual corrections (audit trail demo).
**Do-not-change:** Existing seeders (capabilities, users, etc.). Run this AFTER the main seeder.
**Acceptance:** After seed: attendance_days has ~30×13 rows; heatmaps populated; dashboard widgets show real counts; open shifts exist.
**Verify:** `php artisan db:seed --class=AttendanceDemoDataSeeder`; query counts; login as each role → dashboard shows real numbers.

### 2.2 [seed][api] Link work schedule to users + leave requests demo
**Inspect:** Schedule not linked; no leave demo data.
**Change:**
- Add `work_schedule_id` to all 13 seeded users pointing to the standard schedule.
- Seed 3-4 leave requests: 1 approved (Praveen, last week — so his attendance shows "leave"), 1 pending (Rahul, upcoming — for HR approval queue), 1 rejected (Vignesh — for history demo), 1 HR leave pending (Aravind → for Admin approval queue).
**Acceptance:** Users have schedule; leave queue populated; one approved leave reflects in attendance.
**Verify:** HR login → pending leave queue shows Rahul; Admin → shows Aravind; Praveen's heatmap shows leave days.

### 2.3 [seed][api] Register AttendanceDemoDataSeeder in DatabaseSeeder
**Inspect:** `DatabaseSeeder.php` runs company/dept/users/etc.
**Change:** Add `$this->call(AttendanceDemoDataSeeder::class);` at the END of `DatabaseSeeder::run()` (after users exist). Also call the leave seeder (2.2) — can be a separate seeder or inline.
**Acceptance:** `php artisan db:seed --force` runs all seeders in order without error.
**Verify:** Fresh migrate+seed on staging → full demo dataset.

### 2.4 [deploy][api] Run fresh seed on production Supabase
**Change:** On Railway: `php artisan migrate:fresh --seed --force` (WARNING: this wipes data — confirm with owner first; alternatively `migrate --force` + `db:seed --force` to append). **Recommended:** `php artisan db:seed --force` (append demo data) after confirming the fresh-run on staging.
**Acceptance:** Production DB has 13 users + 30 days attendance + leave requests.
**Verify:** API queries return real counts.

**Phase 2 gate:** Demo data live in production. Dashboards/heatmaps/approval queues populated.

---

## PHASE 3 — Base Module frontend fixes (GAP-1 → GAP-8, GAP-15, GAP-16)

### 3.1 [fix][api] GAP-2 — Directory "private" visibility branch
**Inspect:** `DirectoryController.php:26-32` — only `public||internal` branch.
**Change:**
```php
if (in_array($visibility, ['public', 'internal'])) {
    $data['email'] = $user->email;
    $data['phone'] = $user->phone;
}
// 'private' → email/phone omitted entirely (already not set)
// sensitive fields ALWAYS null (keep existing)
```
**Do-not-change:** Sensitive-field nulling.
**Acceptance:** Private user → directory card omits email/phone.
**Verify:** Set a user to private → directory doesn't show their contact.

### 3.2 [fix][web] GAP-1 — User create/edit dialog: all fields + multi-role
**Inspect:** `org/users/page.tsx:459-535` — only name/email/dept/roles(single select) rendered.
**Change:**
- Add inputs for: `username`, `phone`, `employee_id` (with auto-number preview), `team_id` (Combobox filtered by department), `designation_id` (Combobox).
- Change `roles` from single `<select>` to a Checkbox group: `☐ Employee ☐ HR ☐ Super Admin` (only show roles the caller can assign — Admin sees all; HR sees Employee only). Backend accepts array.
- Form state already holds username/phone/designation_id — just render the inputs.
**Do-not-change:** Existing create/edit mutation logic.
**Acceptance:** All R2.3/R2.5 fields present; multi-role selectable.
**Verify:** Create user with all fields + dual role → persists.

### 3.3 [fix][web] GAP-3 — Directory Send Message → navigate to chat
**Inspect:** `directory/page.tsx:70-72` — only toasts.
**Change:** On success, navigate to `/dashboard/chat?conversation={conversation_id}` (the chat page reads this param). If chat module isn't ready, at minimum toast with the conversation id and keep it functional (no dead end). **Recommended:** route to chat with the conversation pre-selected.
**Acceptance:** Send Message → conversation created → user lands in it.
**Verify:** Click Send Message → navigates to chat thread.

### 3.4 [fix][api][web] GAP-4 — Department members drill-down
**Inspect:** No members endpoint; departments page shows count only.
**Change:**
- Backend: add `GET /departments/{id}/members` → paginated user list for that dept (capability `departments.manage`). Or reuse `show()` which already loads `users` — expose it.
- Frontend: clicking a department row → Sheet showing the member list (Avatar, name, designation, role badges). Use real member data, not placeholder "U" avatars (fixes GAP-16).
**Acceptance:** Click department → see actual members with real avatars/names.
**Verify:** Click "Game Dev Team" → shows Praveen, Rahul, Vignesh, Santhosh, Naveen.

### 3.5 [fix][web] GAP-5 — Pagination UI on list pages
**Inspect:** All list pages render `data.data` with no pagination controls.
**Change:** Add a shared `<Pagination>` component (or "Load more" button) to users/departments/designations/directory tables. Wire to the cursor pagination from the API (`next_cursor`). For now, "Load more" infinite-scroll is simplest (DataTable supports it).
**Acceptance:** Lists with >20 rows load more on scroll/click.
**Verify:** Seed >20 users → list paginates.

### 3.6 [fix][web] GAP-6 — Error states on list pages
**Inspect:** All pages lack `isError` branch.
**Change:** Add to each list query:
```tsx
if (isError) return <ErrorState retry={() => refetch()} />;
```
Use a shared `ErrorState` component (retry button). Per-section, not full-page.
**Acceptance:** API failure → error card with retry, not blank screen.
**Verify:** Stop backend → page shows error + retry.

### 3.7 [fix][api][web] GAP-7 — Bulk actions for users
**Inspect:** Buttons exist but no handler; no backend endpoint.
**Change:**
- Backend: `POST /users/bulk` with `{ids: [], action: 'activate'|'deactivate'}`. Capability `users.hr.manage|users.employee.manage`. Last-admin guard per-id. Audit.
- Frontend: wire the existing buttons to call the endpoint; show toast; invalidate query. ConfirmDialog for deactivate.
**Acceptance:** Select 3 users → Bulk Deactivate → all deactivate.
**Verify:** Multi-select + bulk action.

### 3.8 [fix][api] GAP-15 — Controller-level capability on status/destroy/reset
**Inspect:** `UserController.php:209,238,281` — no role-vs-target check.
**Change:** In `updateStatus`, `destroy`, `resetPassword`: before acting, check the target user's roles. If target has `hr`/`super_admin` role → require `users.hr.manage`; if `employee` → require `users.employee.manage`. Mirror the store/update logic.
**Acceptance:** Caller with only `users.employee.manage` cannot deactivate an HR user.
**Verify:** Test — HR-manager-cap trying to deactivate admin → 403.

**Phase 3 gate:** Base Module frontend complete — all fields, drill-downs, pagination, errors, bulk. Verify each screen.

---

## PHASE 4 — Attendance frontend fixes (GAP-8 → GAP-14)

### 4.1 [fix][web] GAP-8 — AdminOpenShiftsTable "Notify HR" real implementation
**Inspect:** `admin-open-shifts-table.tsx:62-63` commented out.
**Change:** Implement: `POST /notifications/bulk` (or reuse notification service) → notify HR users of the open shifts. Uncomment + wire the mutation. Toast on success.
**Acceptance:** Bulk Notify HR → HR users receive a notification.
**Verify:** Click Notify HR → HR bell shows it.

### 4.2 [fix][web] GAP-9 — Calendar month/year navigation
**Inspect:** `attendance-history-calendar.tsx:47,109` — fixed full-year range.
**Change:** Add prev/next month buttons + month/year picker. Update the ECharts `range` to the selected month. Lazy-fetch that month's data (the API already supports date ranges).
**Acceptance:** Browse any month/year; data loads per-month.
**Verify:** Click prev month → calendar updates + data fetches.

### 4.3 [fix][web] GAP-10 — Calendar mobile responsive
**Inspect:** `attendance-history-calendar.tsx:132` — `min-w-[800px]` + horizontal scroll.
**Change:** On mobile, switch to a simpler month-grid view (7-col calendar, not the ECharts heatmap) OR make the heatmap fluid (remove min-width, allow it to shrink with `width: 100%`). **Recommended:** fluid heatmap with `min-w-0` + responsive cell sizes; if too cramped at 360px, fall back to a list view.
**Acceptance:** Calendar usable at 360px without horizontal scroll.
**Verify:** 360px viewport → calendar fits.

### 4.4 [fix][web] GAP-11 — HR page inline analytics cards
**Inspect:** `org/attendance/page.tsx` — HR has no summary cards.
**Change:** Add present/absent/late/on-leave summary cards (reuse the Admin analytics pattern, team-scoped). Show above the HR table.
**Acceptance:** HR sees team summary at a glance.
**Verify:** HR page shows 4 colored summary cards.

### 4.5 [fix][web] GAP-12 — Department filter on HR table
**Inspect:** `hr-attendance-table.tsx` — no dept filter.
**Change:** If HR manages multiple depts, add a dept Combobox to the FilterBar. (If HR only has one dept, this is less critical but still good for Admins viewing as HR.) Add the filter param to the query.
**Acceptance:** HR can filter by department.
**Verify:** Filter by "Game Dev Team" → only that dept's members.

### 4.6 [fix][web] GAP-13 — TimeClockWidget error handling
**Inspect:** `time-clock-widget.tsx:54-56` — `catch {}`.
**Change:** On initial load error, show a small error state within the widget ("Couldn't load attendance status. Retry?") with a retry button. Don't swallow.
**Acceptance:** API failure → widget shows retry, not silent broken state.
**Verify:** Stop backend → widget shows error + retry.

### 4.7 [fix][api] GAP-14 — Cross-midnight >36h edge
**Inspect:** `AttendanceService.php:68-69` — query window +36h.
**Change:** Extend the window to +48h (covers even extreme shifts) and add carryover logic: if a clock_in has no clock_out within 48h, treat as open shift (has_open_shift=true). This is an edge case but shouldn't crash.
**Acceptance:** 40h shift doesn't break reconciliation.
**Verify:** Test — clock_in, clock_out 40h later → correct total.

**Phase 4 gate:** Attendance frontend complete. Verify all 3 roles' attendance workflows.

---

## PHASE 5 — Dashboard polish (per DR-DASH1 + spec §13)

### 5.1 [web] Verify dashboard widgets use real data / true empty states
**Inspect:** `dashboard/page.tsx:37-159`.
**Change:** After seeding (Phase 2), verify:
- Admin: total_employees, today attendance (present/absent/late from seeded data), pending_approvals (from leave queue), active_projects (empty state — module future), recent_activity (from audit log), quick-task (empty state).
- HR: team attendance (team-scoped real data), pending_leave (Rahul's pending request), active_projects (empty), activity feed, quick-task (empty).
- Employee: TimeClock (real), my-projects (empty), my-tasks (empty), task-progress (empty), approval-status (empty).
No mock numbers anywhere (§14 hard rule).
**Acceptance:** Every widget shows real seeded data or a true empty state.
**Verify:** Login as each role → widgets populated or correctly empty.

### 5.2 [web] Dashboard hero — DR-DS1 compliant
**Inspect:** `dashboard/page.tsx:164-180`.
**Change:** Verify the hero uses charcoal/primary tokens, NOT a generic violet gradient. If it uses `bg-gradient-to-r from-violet-...`, replace with `bg-primary` or accent-tinted. Per DR-DS1.
**Acceptance:** Hero is charcoal/accent, not violet-slop.
**Verify:** Visual.

### 5.3 [web] Quick-action shortcuts verify per role
**Inspect:** `dashboard/page.tsx:182-211`.
**Change:** Verify each shortcut navigates correctly: Admin → Manage Users/Departments; HR → Team Attendance/Approve Leave; Employee → Request Leave; All → Directory. Fix any dead links.
**Acceptance:** All shortcuts work.
**Verify:** Click each.

**Phase 5 gate:** Dashboard shows real data for all roles, DR-DS1 compliant, shortcuts work.

---

## PHASE 6 — Cross-cutting consistency + base design (shell-adjacent only)

### 6.1 [web] Status badges consistent (R11.4)
**Inspect:** Status badges across users (active/inactive), attendance (present/late/absent/leave), leave (pending/approved/rejected).
**Change:** Verify all use the shared `StatusBadge` from `@g4k/ui` (neutral=gray, info=blue, warning=amber, success=green, danger=red). Replace any inline hand-rolled badge classes with the shared component.
**Acceptance:** grep — no inline status-badge color classes in pages.
**Verify:** Visual consistency across modules.

### 6.2 [web] Avatar usage (no placeholder gradient divs)
**Inspect:** Departments page AvatarGroup (GAP-16), any other hand-rolled avatars.
**Change:** Replace placeholder "U" avatars with the real `<Avatar>` component showing member photos or initials-fallback.
**Acceptance:** All avatars use the component with real data.
**Verify:** Department members show real initials/photos.

### 6.3 [web] Responsive audit — Base + Attendance + Dashboard
**Inspect:** All pages in scope at 360/768/1024/1440.
**Change:** Fix any overflow, broken grids, non-card tables on mobile. Specifically: attendance calendar (4.3), org tables (DataTable should card-transform on mobile per the shared component), dashboard widgets (stack on mobile).
**Acceptance:** No overflow at any breakpoint.
**Verify:** Browser resize 360→1920.

**Phase 6 gate:** Consistent badges, avatars, responsive. No AI-slop.

---

## PHASE 7 — End-to-end verification (full workflow matrix)

> Run AFTER all fixes + seed. Each must pass in production.

### 7.1 Base Module workflows
- [ ] **Admin creates employee:** all fields (name, email, username, phone, employee_id, dept, team, designation, roles) → user appears in list → audit row written.
- [ ] **Admin edits employee:** change dept/designation → persists → audit.
- [ ] **Admin deactivates employee:** status → inactive → can't login → audit. Last-admin guard holds.
- [ ] **Admin resets password:** employee must change on next login.
- [ ] **Bulk activate/deactivate:** select 3 → bulk action → all change.
- [ ] **Department CRUD:** create, edit, archive (persists now), restore, delete (in-use guard). Members drill-down shows real avatars.
- [ ] **Designation CRUD:** create, edit, activate/deactivate (persists now), delete (in-use guard).
- [ ] **Directory:** search by name; grid/list toggle; click → Sheet; Send Message → navigates to chat; private user hides contact.
- [ ] **Export:** users/departments/designations → file downloads.
- [ ] **Pagination:** >20 rows → load more works.
- [ ] **Error states:** stop backend → error + retry on each list.

### 7.2 Attendance workflows (employee)
- [ ] **Clock in** (09:09, within grace) → not late → timer starts (persists across navigation).
- [ ] **Start break / End break** → break duration tracked.
- [ ] **Clock out** → confirm dialog → shift completes → summary updates.
- [ ] **Late (09:15, past grace)** → late badge + minutes.
- [ ] **Overtime** (>8h45m) → amber indicator + overtime seconds.
- [ ] **History heatmap** → seeded 30 days visible; click day → detail (timeline, total, projects).
- [ ] **Month navigation** → browse prior months.
- [ ] **Mobile** → widget ≥48px, calendar fits 360px, summary cards stack.
- [ ] **Offline** → clock in offline → queues → syncs on reconnect.

### 7.3 Attendance workflows (HR)
- [ ] **Team view loads** (no 403 — CRIT-4 fixed) → shows own dept members.
- [ ] **Summary cards** → present/absent/late/on-leave counts (team-scoped).
- [ ] **Filter** by status, search, department.
- [ ] **Click member** → Sheet with day timeline + full history.
- [ ] **Manual correction** (own team) → add/edit/remove event → preview → save → reconciles → employee notified. **Cross-team → 403.**
- [ ] **Open shift** → flagged badge → click → correction dialog prefilled → resolve.
- [ ] **Weekly/monthly graph** → toggle per-employee/team.
- [ ] **Export** → downloads (token correct — CRIT-3 fixed).

### 7.4 Attendance workflows (Admin)
- [ ] **Company overview** → all employees, all depts.
- [ ] **Date navigation** → any past date.
- [ ] **Analytics** → summary cards + trends graph.
- [ ] **Open shifts console** → list, filter, assign correction, **Notify HR works** (GAP-8 fixed).
- [ ] **Export** → date-range, all depts.
- [ ] **Correction** → any employee → reconciles → audit.

### 7.5 Dashboard (all roles)
- [ ] **Admin** → real counts (employees, today attendance, pending approvals, activity feed) + empty states for future modules.
- [ ] **HR** → team-scoped counts + pending leave (Rahul) + empty states.
- [ ] **Employee** → TimeClock (real) + empty states (projects/tasks future).
- [ ] **Quick actions** → each navigates correctly.
- [ ] **No mock data** anywhere (§14).

### 7.6 Leave integration (verify with seeded data)
- [ ] Praveen's approved leave → attendance days show "leave" (purple on heatmap), Sundays skipped.
- [ ] HR pending queue → Rahul's request.
- [ ] Admin pending queue → Aravind's HR leave.

### 7.7 Responsive + refresh
- [ ] All screens at 360/768/1024/1440.
- [ ] Refresh on any route → preserves state.
- [ ] Direct URL access → works (middleware guards).

**Phase 7 gate:** Every workflow in 7.1–7.7 passes in production.

---

## PHASE 8 — Production build + deploy

### 8.1 [deploy] Build verification
**Change:** `pnpm --filter web build` + `php artisan test` → both green. No TS errors.
**Acceptance:** Clean build.
**Verify:** Build logs.

### 8.2 [deploy] Seed production (confirm with owner)
**Change:** Run the AttendanceDemoDataSeeder on production Supabase (append, not fresh).
**Acceptance:** Production has demo attendance + leave data.
**Verify:** API returns real counts.

### 8.3 [deploy] Deploy + live verification
**Change:** Commit, push, auto-deploy. Re-run Phase 7 matrix in production.
**Acceptance:** All workflows pass live.
**Verify:** Live URL — login as karthik/aravind/praveen → exercise every workflow.

---

# PART 3 — SUMMARY

## Defects → Phase mapping

| Phase | Fixes | Effort |
|---|---|---|
| **1. Critical backend bugs** | CRIT-1→8 (+ GAP-17) | ~3-4h |
| **2. Seed demo data** | SEED-1→3 | ~2h |
| **3. Base Module frontend** | GAP-1→8, GAP-15, GAP-16 | ~4-5h |
| **4. Attendance frontend** | GAP-8→14 | ~3h |
| **5. Dashboard polish** | verify + hero | ~1h |
| **6. Consistency** | badges, avatars, responsive | ~2h |
| **7. E2E verification** | full matrix (7.1-7.7) | ~2h |
| **8. Production** | build + seed + deploy | ~1h |
| **Total** | **8 crit + 17 gaps + 3 seed** | **~18-20h** |

## Files to CREATE
- `apps/api/database/seeders/AttendanceDemoDataSeeder.php` — 30 days realistic attendance for 13 employees.
- `apps/api/database/seeders/LeaveDemoDataSeeder.php` (or inline) — 4 leave requests.

## Files to MODIFY (backend)
- `apps/api/app/Models/Department.php` — $fillable (+ is_active, archived_at).
- `apps/api/app/Models/Designation.php` — $fillable (+ is_active).
- `apps/api/app/Services/AttendanceService.php` — grace in reconciliation; cross-midnight window.
- `apps/api/app/Http/Controllers/AttendanceController.php` — hrToday direct impl (not delegate).
- `apps/api/app/Http/Controllers/UserController.php` — controller-level capability on status/destroy/reset; bulk endpoint.
- `apps/api/app/Http/Controllers/DirectoryController.php` — private visibility branch.
- `apps/api/app/Http/Controllers/DepartmentController.php` — members endpoint (or expose show).
- `apps/api/routes/api.php` — correct capability gate; bulk route; members route.
- `apps/api/app/Jobs/RemindShiftStart.php`, `AlertMissedClockIn.php`, `FlagOpenShifts.php` — `message`→`body`.
- `apps/api/database/seeders/DatabaseSeeder.php` — call demo seeders.
- Migration to drop duplicate grace column.

## Files to MODIFY (frontend)
- `apps/web/src/app/dashboard/org/users/page.tsx` — full create/edit fields, multi-role, bulk wire, error state, pagination.
- `apps/web/src/app/dashboard/org/departments/page.tsx` — members drill-down, real avatars, error state, pagination.
- `apps/web/src/app/dashboard/org/designations/page.tsx` — error state, pagination.
- `apps/web/src/app/dashboard/directory/page.tsx` — Send Message navigation, error state, pagination.
- `apps/web/src/components/attendance/hr-attendance-table.tsx` — correct endpoint (CRIT-4), export token (CRIT-3), dept filter (GAP-12).
- `apps/web/src/components/attendance/admin-attendance-table.tsx` — export token (CRIT-3).
- `apps/web/src/components/attendance/admin-open-shifts-table.tsx` — Notify HR real (GAP-8).
- `apps/web/src/components/attendance/attendance-history-calendar.tsx` — month nav (GAP-9), mobile (GAP-10).
- `apps/web/src/components/widgets/time-clock-widget.tsx` — error handling (GAP-13).
- `apps/web/src/app/dashboard/org/attendance/page.tsx` — HR summary cards (GAP-11).
- `apps/web/src/components/dashboard/hr-team-attendance-widget.tsx` — correct endpoint (CRIT-4).
- `apps/web/src/app/dashboard/page.tsx` — hero DR-DS1, verify widgets.

## Files to NOT TOUCH (preserve working logic)
- AttendanceService state machine, dedupe, total/break/overtime calc.
- AttendanceController clock in/out/break/meHistory/meDay/sync/correct/export.
- LeaveAttendanceIntegration (working-days + recurring holidays).
- TimeClockWidget optimistic flow + global timer store.
- HrCorrectionDialog (preview + reason + reconcile).
- MetricWidget, WidgetEngine.
- Seeder user/dept/designation/company/capability data (correct).
- Command palette, breadcrumbs, sidebar (separate fix-1.md scope).

## Result
A Base Module (departments/employees/designations/directory), Attendance Module (employee/HR/admin),
and Dashboard that are **fully functional for day-to-day production use**: every workflow works
against real seeded data, every critical bug fixed, every gap closed, responsive + accessible, no mock
data, no AI-slop. **No rework needed — every choice references the frozen spec. No scope expansion.**

