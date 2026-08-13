# finalization.md — The Single Implementation Plan to Make the App Production-Ready

> **This is the ONLY document you need to execute.** Every item is confirmed, line-level, and ordered by
> "what to fix first to unfreeze the app." Apply top-to-bottom, commit after each group, deploy, verify.
> Do not skip — each group unblocks the next.

---

## GROUP 1 — UNFREEZE THE APP (fix these FIRST; they cause the dashboard freeze)

The dashboard is stuck because React hits ReferenceErrors and TypeErrors during render → ErrorBoundary
catches → re-renders → same error → **infinite loop / frozen page**. Fix all 7 items below and the app
unfreezes.

### 1.1 Fix `Folder is not defined`
- **File:** `apps/web/src/app/dashboard/projects/[id]/page.tsx:95`
- **Bug:** `<Folder className="w-5 h-5 text-violet-600" />` — `Folder` is used but **never imported** (the
  icon migration removed the lucide import but left the JSX reference). ReferenceError → hard crash.
- **Fix:** add the import at the top of the file:
  ```ts
  import { Folder } from "lucide-react";   // if still on lucide
  // OR if migrating to FA:
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faFolder } from "@fortawesome/free-solid-svg-icons";
  // and change the JSX to <FontAwesomeIcon icon={faFolder} className="w-5 h-5 text-violet-600" />
  ```
  **Whichever icon library is currently in use — just make sure the import exists.** Check what other icons
  in the same file import from and match.

### 1.2 Fix `UsersIcon is not defined`
- **File:** `apps/web/src/app/dashboard/org/users/page.tsx:537`
- **Bug:** `icon={<UsersIcon className="w-8 h-8 text-neutral-400" />}` — `UsersIcon` is used but not
  imported. ReferenceError → hard crash → the Employee page blanks + floods the console.
- **Fix:** add the import:
  ```ts
  import { Users } from "lucide-react";   // then use <Users className="w-8 h-8 text-neutral-400" />
  // (the original name was "Users" — "UsersIcon" was likely an alias that was removed)
  ```
  Or replace with whatever icon system is active. The key: **the component referenced in JSX must be imported.**

### 1.3 Audit ALL other potentially-missing imports
- **Action:** grep the entire `apps/web/src` for any component/icon used in JSX but not imported:
  ```bash
  # Quick check: find all <CapitalizedComponent> in JSX, then verify each is imported in that file.
  # The build should catch these (Next.js turbopack), but if the build passed with stale caches,
  # runtime ReferenceErrors slip through.
  ```
- **Specifically check:** any file that was recently modified for the icon migration or UI changes. Look
  for `<IconName` or `<ComponentName` where the name doesn't appear in an `import` statement.
- **Fix:** add the missing import for each.

### 1.4 Guard ALL `.find()` / `.map()` / `.length` / `.filter()` on API-sourced data
Every widget/component that reads an array from a React Query result must guard against `undefined`/non-array.
**Pattern:** `const items = Array.isArray(raw) ? raw : [];`

| File | Field | Current | Fix |
|---|---|---|---|
| `widgets/recent-activity-widget.tsx` | `data?.recent_activity` | `\|\| []` | `Array.isArray(x) ? x : []` |
| `widgets/announcement-board.tsx` | `announcements` | `\|\| []` | same |
| `widgets/quick-notes.tsx` | `notes` | `\|\| []` | same |
| `widgets/pending-approvals-widget.tsx` | `pending_approvals` | `\|\| []` | same |
| `dashboard/employee-approval-status-widget.tsx` | tasks from `/tasks/submitted` | `\|\| []` | same |
| `dashboard/employee-task-progress-widget.tsx` | `recent_task_progress` | `\|\| []` | same |
| `dashboard/team-attendance-widget.tsx` | team-today response | `return null` on error | `Array.isArray` + error/retry state |
| `widgets/upcoming-holidays-widget.tsx` | `holidays` | `\|\| []` | same |
| `widgets/metric-widget.tsx` | `data.metrics[metricKey]` | `?? 0` | guard metrics object too |

**Also:** any `select` function in a `useQuery` that returns an array must guard: if the API response is not
the expected shape, return `[]` — never let `select` throw (it crashes `createResult` → render loop).

### 1.5 Guard `setQueryData` optimistic callbacks
| File | Line | Fix |
|---|---|---|
| `notifications-bell.tsx` | ~53, ~86 | `return old ? { ...old, data: (old.data ?? []).map(...) } : old;` |
| `leave/leave-approval-actions-cell.tsx` | ~41 | same |
| `projects/tasks-tab.tsx` | ~90 | same |

### 1.6 Fix ALL date-fns `RangeError: Invalid time value`
Add a `safeFormat(ts, fmt)` and `safeFromNow(ts)` to `apps/web/src/lib/format.ts` (if not already present),
then route every unguarded call through it:

| File | Current | Fix |
|---|---|---|
| `announcement-board.tsx:225` | `format(new Date(item.created_at), "MMM d")` | `safeFormat(item.created_at, "MMM d")` |
| `hr-activity-feed-widget.tsx:140` | `formatDistanceToNow(parseISO(act.timestamp), ...)` | `safeFromNow(act.timestamp)` |
| `employee-approval-status-widget.tsx:87` | `formatDistanceToNow(new Date(task.submitted_at), ...)` | `safeFromNow(task.submitted_at)` |
| `employee-task-progress-widget.tsx:98` | `formatDistanceToNow(new Date(task.updated_at), ...)` | `safeFromNow(task.updated_at)` |
| `command-palette.tsx:102` | `formatDistanceToNow(item.timestamp, ...)` | `safeFromNow(item.timestamp)` |

The `safeFormat`/`safeFromNow` helpers:
```ts
import { format, formatDistanceToNow, isValid } from "date-fns";
export function safeFormat(ts: any, fmt: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  return isValid(d) ? format(d, fmt) : "";
}
export function safeFromNow(ts: any): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (!isValid(d)) return "";
  try { return formatDistanceToNow(d, { addSuffix: true }); } catch { return ""; }
}
```

### 1.7 Fix avatar upload 500
- **Endpoint:** `POST /api/profile/avatar` returns 500.
- **Backend file:** `apps/api/app/Http/Controllers/ProfileController.php` (`uploadAvatar` method).
- **Likely cause:** the `supabase` disk configuration, or the `Storage::disk('supabase')` call, or the
  Supabase S3 credentials/endpoint being misconfigured on Cloud Run. Check:
  1. `FILESYSTEM_DISK=s3` is set on Cloud Run (not `local`).
  2. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT`, `AWS_BUCKET` are set as Cloud Run secrets.
  3. The `supabase` disk is defined in `config/filesystems.php`.
  4. The Supabase bucket `g4k` exists and allows writes.
  5. Check Cloud Logging (`stderr`) for the actual PHP exception.
- **Fix:** correct the missing env/secret/disk config. If the disk call itself is the issue, fall back to
  `$file->store('avatars', 's3')` (the `s3` disk has the same config as `supabase`).

---

## GROUP 2 — NAVIGATION & ROLE CORRECTNESS (after the app unfreezes)

### 2.1 Verify all nav items render + navigate for each role
Once the freeze is fixed, test as Admin, HR, Employee:
- Every `navGroups` item has a matching route (`page.tsx` exists).
- No nav item 403s on open (capability key matches the route middleware).
- Tasks/Projects: decide visibility — if HR/employee shouldn't see them, hide the nav items; if they should,
  grant `tasks.view`/`projects.view` in the matrix.

### 2.2 Remove the "Role: Employee" badge (if still present)
- Check `dashboard/page.tsx` for any "Role: {activeRole}" badge element. If present: delete it. (It was
  removed in a prior fix but may have regressed.)

### 2.3 Fix the auth redirect bubble (if still stranding)
- Check `(auth)/layout.tsx:32`. If it replaces `{children}` with a bouncing-dots loader while redirecting:
  render `{children}` (the login form) immediately and let `router.replace` swap it.

---

## GROUP 3 — BACKEND WORKFLOW FIXES

### 3.1 Clock-in 422 (state machine)
- **File:** `apps/api/app/Services/AttendanceService.php:32-44`.
- **Fix:** make repeat `clock_in` idempotent (if already on an open shift, return current day instead of
  throwing `ValidationException`). Also disable the punch button in-flight on the frontend (`time-clock-widget.tsx`).

### 3.2 Continue-shift data loss
- **File:** `apps/api/app/Services/AttendanceService.php:86-88`.
- **Fix:** remove the `break` on first `clock_out` so a re-clock-in segment's time is counted.

### 3.3 Export fetch bugs
- **Files:** `approvals-tab.tsx:144-146` (Bearer null), `admin-attendance-table.tsx:128`, `departments-tab.tsx:200`,
  `designations-tab.tsx:146` (missing `/api`), `settings-tabs.tsx:122` (no fallback).
- **Fix:** replace each raw `fetch(...)` with `apiFetch(endpoint)` (handles auth + `/api` + blob).

### 3.4 Employee-profile attendance tab empty
- **File:** `org/users/[id]/page.tsx:301`.
- **Fix:** `historyData?.days` → `historyData?.data`.

### 3.5 Password inputs not in a `<form>`
- **File:** `apps/web/src/app/dashboard/profile/page.tsx`.
- **Fix:** wrap the change-password inputs in `<form onSubmit={handleChangePassword}>`. Add `autocomplete`
  attributes (`current-password`, `new-password`).

---

## GROUP 4 — UI CONSISTENCY (after workflows work)

### 4.1 Complete the icon migration (or revert it)
- **Decision required:** either (a) finish the Font Awesome migration properly (import every icon used), or
  (b) revert to lucide-react everywhere and abandon the FA migration. The current half-migrated state (missing
  imports → ReferenceErrors) is what's crashing the app.
- **If reverting:** ensure every icon used in JSX has a `from "lucide-react"` import. Run the build locally
  (`pnpm --filter web build`) — turbopack WILL catch missing imports at build time; the fact that the live
  build has these errors means the build either didn't catch them (caching) or wasn't run.

### 4.2 Remove duplicate FilterBar `value="all"` entries (13 sites)
- **Files:** users, leave, notifications, departments, designations, tasks, leave-history-table.
- **Fix:** delete the `{ value: "all", ... }` entry from each options array (FilterBar auto-prepends it).

### 4.3 Replace native controls with themed primitives (~35 sites)
- native `<select>` → `Select`/`Combobox`; native `<input type=date>` → `Calendar`; native `<input type=checkbox>`
  → `Checkbox`. Concentration: `tasks/page.tsx` (6 selects), `reports`, `profile`, `settings/*`.

### 4.4 Token adoption (112 `bg-white` → `bg-surface`/`bg-card`; 64 `shadow-sm` → `shadow-e1`)
- File-by-file sweep. Worst: profile, attendance graphs, auth pages, settings.

---

## GROUP 5 — DEPLOYMENT & VERIFICATION

### 5.1 Deploy
- Apply Groups 1–4. Commit + push to both repos. Confirm Vercel + Cloud Build rebuild for the latest SHA.

### 5.2 Verify (per role — Admin, HR, Employee)
- [ ] Login page renders immediately (no stuck bubble).
- [ ] Dashboard renders (no infinite loop, no console errors).
- [ ] No `ReferenceError`, `TypeError`, or `RangeError` in the console.
- [ ] All nav items work for each role (no 403 on open).
- [ ] Clock-in works. Leave approve works. Exports download. Avatar upload works.
- [ ] Responsive at 360 / 768 / 1280 px.
- [ ] Deployed SHA matches `git rev-parse HEAD`.

### 5.3 Clean up old docs
After the app is verified working, delete the superseded planning files:
`final-fix-*.md`, `finalization-*.md`, `fix-6.md`, `new design system.md`, `AGENT.md`, `CLAUDE.md`.
Keep: `README.md`, `context.md`, `finalization.md`.

---

## SUMMARY: what to do RIGHT NOW

1. **Fix the two missing imports** (`Folder` in `projects/[id]/page.tsx:95`, `UsersIcon` in
   `org/users/page.tsx:537`). These are the direct cause of the dashboard freeze.
2. **Guard all `.find/.map/.length`** on API data with `Array.isArray` (Group 1.4).
3. **Guard all date-fns calls** with `safeFormat`/`safeFromNow` (Group 1.6).
4. **Guard `setQueryData`** callbacks (Group 1.5).
5. **Commit, push, deploy.** The app should unfreeze.
6. Then proceed through Groups 2–4 to complete the remaining workflows.

**Items 1–5 are small, surgical edits (add imports, add `Array.isArray` guards, add a helper function).
They will unfreeze the app on the next deploy.**
