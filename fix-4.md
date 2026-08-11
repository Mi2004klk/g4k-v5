# fix-4.md — Games4King Workplace OS: Final Performance & Polish Implementation Plan

> **Companion to `context.md` (v2).** This is the single, ordered, dependency-aware checklist that
> takes the app from "functional but slow/flickery" to **fully wired, fast-loading, responsive,
> colorful, vibrant, stable, intuitive, accessible, visually consistent, and optimized for rapid
> daily usage with no unnecessary loading screens.**
>
> **Read `context.md` first**, especially §0 (TL;DR) and §8 (verified bugs). The previous "everything
> is broken" picture is OBSOLETE — 38/39 previously-flagged bugs are fixed. The remaining work is:
> (A) **performance root causes** (the "always loading" complaint — §8 PERF-*), (B) a few
> **correctness gaps** (§8 CORR-*), (C) **usability/polish** (§8 UX-*), (D) **visual consistency**
> (§8 VIS-*), (E) **a11y + production guardrails**.
>
> **Convention:** `[ ]` = todo. Each task states area → problem → expected behavior → outcome. Bug
> IDs (PERF-/PERFBE-/CORR-/UX-/VIS-/A11Y-/OPS-) cross-reference `context.md` §8. Verify after each
> phase: lint + typecheck + tests + manual smoke at 360/768/1024/1440px in light + dark.
>
> **Phase order:** requirements verification → CI guardrails → **performance caching/data-fetch**
> (the big win) → request dedup → render isolation → widget optimization → backend perf →
> component cleanup → global layout/polish → page-by-page UX → module completeness → role/permission
> validation → responsive → accessibility → bundle/animation → functional QA → visual QA →
> performance QA → regression → production readiness.

---

## PHASE 0 — Requirements verification & pre-flight

### 0.1 Confirm the verified baseline (do not re-fix closed bugs)
- [x] **0.1.1** Confirm the 38 already-fixed items in `context.md` §7 remain fixed (spot-check:
  RequireCapability OR-logic; ForcePasswordChange wiring; ChatController scoping/membership;
  `conversation.{id}` channel auth; Reverb default-on; `attendance_days.status='leave'`;
  `Project::creator`; notifications DataTable `({row})` cells; `/settings/grouped`; token via
  `useAuthStore.getState().token`; TimeClockWidget React Query + rollback; Gantt inline grid;
  3-state sidebar + logos + required nav items; announcement one-per-person likes; Quick Notes
  collapse; centered notifications modal with Clear-preserves-Chats). **Do NOT re-fix these.**
- [x] **0.1.2** Archive the now-stale v1 planning docs (`fix-1.md`, `fix-2.md`, `fix-3.md`,
  `finalization.md`, `tracker-new.md`, `implementation-plan.md`, `plan-future-modules.md`) into
  `docs/archive/` with a header noting they are superseded by `context.md`/`fix-4.md`. Keep
  `openspec/*` authoritative.
- [x] **0.1.3** Update `openspec/TRACKER.md`: replace the inaccurate "all ✅" with the verified state
  ("Implementation present and wired; performance revamp + polish in progress per `fix-4.md`").

### 0.2 CI performance/a11y guardrails (must exist before changes — gates regressions)
- [x] **0.2.1** [test] Add `@next/bundle-analyzer` + CI budget: First-Load JS ≤200KB gz/route,
  route chunk ≤350KB gz (P-BUNDLE / R13.7). Fail build on breach.
- [x] **0.2.2** [test] Add **Lighthouse CI** on PRs for `/login`, `/dashboard`, `/dashboard/attendance`,
  `/dashboard/leave`, `/dashboard/org/users`, `/dashboard/chat` — LCP≤2.5, INP≤200, CLS≤0.1, FCP≤1.8.
- [x] **0.2.3** [test] Add **axe-core** CI on primary routes (zero critical/serious) (P-A11Y / R13.23).
- [x] **0.2.4** [test] Add Laravel query-count test asserting ≤5 SQL + zero N+1 on `/dashboard/metrics`,
  `/attendance/me/history`, `/attendance/admin/overview`, `/attendance/hr/today`, `/leave-requests`,
  `/audit-logs`, `/reports/attendance-summary` (P-NO-N1/Q-COUNT).
- [x] **0.2.5** [test] Add a React Profiler render-count test on the dashboard (assert only
  `LiveTimer` commits each second; siblings do not) (P-RERENDER).
- [x] **0.2.6** Verify Sentry (api+web) + Laravel Pulse + web-vitals field collection are wired
  (P-MON). Add web-vitals reporting to the prod build.

### 0.3 Environment sanity
- [ ] **0.3.1** Confirm Railway builds PHP 8.4 from root `nixpacks.toml`; `/api/ping` →
  `{"status":"ok"}`; login returns 200+token.
- [ ] **0.3.2** Confirm Vercel `NEXT_PUBLIC_API_URL` (bare Railway host, no `/api`) + Reverb env
  (`NEXT_PUBLIC_REVERB_HOST/PORT/APP_KEY/SCHEME`) for Production + Preview.
- [ ] **0.3.3** Confirm `BROADCAST_CONNECTION=reverb` + `QUEUE_CONNECTION=database` (or redis) +
  Reverb service running on Railway.

---

## PHASE 1 — Performance: caching & data-fetch (THE big win — eliminates "always loading")

> This phase alone resolves the majority of the user's complaint. All findings are root-caused in
> `context.md` §8 PERF-1..15. Order matters: fix caching defaults first, then dedup, then render.

### 1.1 Fix the cache defaults (PERF-1) — highest impact
- [ ] **1.1.1** [web] `apps/web/src/components/providers.tsx:42-43`: set `gcTime` >> `staleTime`.
  Target: `staleTime: 30_000` (30s), `gcTime: 30 * 60_000` (30 min). Keep `refetchOnWindowFocus:
  false`, `retry: 1`, `mutations.retry: 0`. **Outcome:** navigating away and back within 30 min
  shows cached data instantly with a background refresh — no skeleton.
- [ ] **1.1.2** [web] Make every widget/page use the central `STALE_TIME_*` constants from
  `lib/query-keys.ts` (replace inline `30000` literals in `metric-widget.tsx:36`,
  `recent-activity-widget.tsx:14`). Add `STALE_TIME_CONVERSATIONS`, `STALE_TIME_REPORTS` as needed.

### 1.2 Stop treating 5xx as offline-queueable (PERF-2)
- [ ] **1.2.1** [web] `apps/web/src/lib/api-client.ts:~126`: change the offline-queue condition to
  queue ONLY on real network failure (`error.message.includes("Failed to fetch") || !navigator.
  onLine`), NOT on `error.status >= 500`. A 5xx should throw and surface a danger toast (via the
  caller's `onError`) so the user can retry. **Outcome:** transient server errors no longer silently
  swallow mutations; users see real errors and can act.
- [ ] **1.2.2** [web] Add a 401-refresh **mutex** so concurrent 401s trigger only one refresh
  (currently each 401 can fire its own refresh round-trip). Surface slow/expired refreshes via a
  single redirect rather than silent cascades.

### 1.3 Cache dashboard layout + unblock grid render (PERF-3)
- [ ] **1.3.1** [web] `apps/web/src/components/widgets/widget-engine.tsx`: replace the ad-hoc
  `apiFetch("/auth/preferences")` in the `useEffect` with a `useQuery({ queryKey:
  ["dashboard-layout"], staleTime: 5*60_000 })`. Render the grid from cached layout immediately on
  re-mount; only the very first cold load shows the skeleton block.
- [ ] **1.3.2** [web] Remove the `(width ?? 0) > 0` hard gate (`widget-engine.tsx:184`) — measure
  container width synchronously via `useLayoutEffect` with a sensible fallback (e.g. parent
  `clientWidth` or 1200), so widgets paint on the first frame instead of after a measurement tick.

### 1.4 Stabilize Reverb `subscribe` + centralize Echo (PERF-4)
- [ ] **1.4.1** [web] `apps/web/src/hooks/use-reverb.ts:80-86`: wrap `subscribe` in
  `useCallback(..., [echoInstance])` so consumers' effects don't tear down/recreate channels every
  render.
- [ ] **1.4.2** [web] Hoist a **single Echo instance** into a `ReverbProvider` at the
  `dashboard/layout.tsx` level (context). Replace the 5 independent `useReverb()` consumers
  (`auth-guard`, `notifications-bell`, `chat/page`, `export-history`, `use-export`) with the context
  consumer. **Outcome:** one WebSocket connection; per-channel subscribe/unsubscribe instead of
  whole-connection disconnect; no duplicate `private-user.{id}` subscriptions.
- [ ] **1.4.3** [web] In each consumer, subscribe in an effect keyed on the stable `subscribe`
  callback + channel name; clean up the specific channel (not the whole Echo) on unmount.

### 1.5 Deduplicate query keys + collapse polling (PERF-5, PERF-7)
- [ ] **1.5.1** [web] **HR attendance** — unify to a single key `["hr-attendance-today", date,
  dept]`. `hr-attendance-analytics.tsx:15`, `hr-attendance-table.tsx:56`, and
  `hr-activity-feed-widget.tsx:30` (drop the no-arg variant) all share it; compute status/search
  filters client-side via `select`. Keep ONE 30s `refetchInterval` (in the table, the primary
  component), not two. **Outcome:** 1 request/30s instead of 2–3.
- [ ] **1.5.2** [web] **Admin attendance** — unify to `["admin-attendance-overview", date, dept]`
  across `admin-attendance-analytics.tsx:15`, `admin-attendance-table.tsx:56`,
  `admin-open-shifts-table.tsx:41`. One poll. Open-shifts can derive from the same data via
  `select` (filter `has_open_shift`).
- [ ] **1.5.3** [web] **Attendance today** — unify `time-clock-widget.tsx:48`
  (`["attendance-today"]`) and `today-summary-card.tsx:15`
  (`["my-attendance-today-summary"]`) to ONE key `["attendance-today"]` sharing
  `/attendance/me/today`. **Outcome:** one request, one cache, consistent UI.
- [ ] **1.5.4** [api] Add `Cache-Control: private, max-age=30` to
  `AttendanceController::meToday` (matches `overview`/`hrToday` which already set ETag).

### 1.6 Targeted invalidation (PERF-6)
- [ ] **1.6.1** [web] `pending-approvals-widget.tsx:29`: stop invalidating the broad
  `["dashboard-metrics"]` on every decision. Invalidate only `["pending-approvals-list"]` (exact);
  let metrics refresh on their own 30s `staleTime` (or invalidate the specific metric key once
  `1.7` is done). **Outcome:** approving leave no longer re-skeletons every metric on the dashboard.
- [ ] **1.6.2** [web] `tasks/page.tsx` + `task-detail-sheet.tsx`: use exact invalidation where
  possible (`{ exact: true }`) so `["tasks"]` doesn't bust `["tasks", id]` detail caches.
- [ ] **1.6.3** [web] `notifications-bell.tsx`: where optimistic `setQueryData` is applied, drop
  the redundant `onSettled` broad invalidate (keep only the optimistic update + a targeted settle).

### 1.7 Per-widget metric keys (PERF-15, supports 1.6.1)
- [ ] **1.7.1** [web] Optionally split `["dashboard-metrics"]` into per-metric keys
  (`["dashboard-metrics", metricKey]`) so a single metric can be invalidated without refetching all.
  (Only if 1.6.1's exact-invalidate isn't sufficient.)

### 1.8 Keep-previous-data + subtle refresh indicators (PERF-8)
- [ ] **1.8.1** [web] In every widget that currently replaces the whole card on `isLoading`
  (`metric-widget`, `recent-activity-widget`, `time-clock-widget`, `announcement-board`,
  `quick-notes`, `pending-approvals-widget`, `admin-today-attendance-widget`,
  `hr-team-attendance-widget`): keep prior content visible during background refetch and show a
  subtle `isFetching` indicator (e.g. a 2px top progress bar or a faint spinner in the header) rather
  than a full skeleton. Reserve full skeletons for the very first cold load (`isPending && !
  isPreviousData`). **Outcome:** refreshes feel instant; no flicker.

### 1.9 MetricWidget animation only on first render (PERF-9)
- [ ] **1.9.1** [web] `metric-widget.tsx:43-62`: animate the 0→value count-up only on first render
  (use a `useRef` first-render flag) or when the value changes by more than a threshold. Do NOT
  re-run the 600ms animation on every background refetch. **Outcome:** numbers stop "re-counting"
  on every 30s refresh.

### 1.10 AuthGuard: skip refresh when session exists (PERF-10)
- [ ] **1.10.1** [web] `auth-guard.tsx:27-79`: only run the silent `/auth/refresh` when there is no
  persisted token+user; otherwise render immediately from the persisted Zustand store. Remove
  `pathname` from the auth-check effect deps (use it only for redirect logic). Keep the
  session-revoke + capability/onboarding redirects. **Outcome:** no full-screen skeleton flash on
  navigation; app shell paints instantly from persisted session.

### 1.11 Offline engine: stop the forever poll (PERF-14)
- [ ] **1.11.1** [web] `offline-engine.ts:70-71`: replace the unconditional
  `setInterval(updateQueueCount, 5000)` with a poll that runs only when `navigator.onLine && queue
  has pending items`. Update the count eagerly after each `recordPunch`/`queueRequest`/`syncAll`
  (already partly done) and on online/offline events. **Outcome:** zero idle IDB churn.

---

## PHASE 2 — Performance: render isolation & re-render storms (PERF-11, PERF-12)

### 2.1 Atomic Zustand selectors everywhere
- [ ] **2.1.1** [web] `useAuthStore` — replace all 15 whole-store destructuring call sites with
  atomic selectors: `useAuthStore(s => s.user)`, `s => s.token`, `s => s.activeRole`, `s => s.density`,
  `s => s.setAuth`, `s => s.clearAuth`, `s => s.setDensity`. Sites: `role-select/page.tsx:15`,
  `dashboard/layout.tsx:142`, `change-password/page.tsx:40`, `dashboard/page.tsx:37`,
  `onboarding/page.tsx:14`, `chat/page.tsx:21`, `departments/page.tsx:152`, `designations/page.tsx:134`,
  `profile/page.tsx:43`, `auth-guard.tsx:12`, `notifications-bell.tsx:16`, `nav-group.tsx:19`,
  `settings-tabs.tsx:39`, `announcement-board.tsx:13`, `use-reverb.ts:40`.
- [ ] **2.1.2** [web] `useUIStore` — atomic selectors in `dashboard/layout.tsx:137`,
  `notifications-bell.tsx:22` (use `useShallow` for `dismissedNotificationIds` since it's an array),
  `widget-engine.tsx:25`, `quick-notes.tsx:15`.
- [ ] **2.1.3** [web] `useTimerStore` — `time-clock-widget.tsx:35` currently destructures 9 fields.
  Switch to atomic selectors (`s => s.isActive`, `s => s.baseSeconds`, `s => s.isOnBreak`,
  `s => s.lastActiveTimestamp`, and the action fns which are stable). Do the same in
  `topbar-timer.tsx:11` and any other subscriber.
- [ ] **2.1.4** [web] `useOfflineStore` — verify no component subscribes to `queueCount` without a
  selector; if the badge needs it, subscribe via `useOfflineStore(s => s.queueCount)`.

### 2.2 LiveTimer isolation (verify R5.14)
- [ ] **2.2.1** [web] Confirm `<LiveTimer>` (1s local tick) is isolated: it should re-render ONLY
  itself each second, not its parents. Verify `topbar-timer.tsx`/`today-summary-card.tsx`/
  `time-clock-widget.tsx` are not re-rendering every tick (use the render-count test from 0.2.5).
  If they are, lift `LiveTimer` to a leaf with memoized parent props.

### 2.3 Dynamic-import React Grid Layout (PERF-12)
- [ ] **2.3.1** [web] `widget-engine.tsx:4-6`: `const ResponsiveGridLayout = dynamic(() =>
  import("react-grid-layout").then(m => m.ResponsiveGridLayout), { ssr:false })`; keep the CSS
  imports. **Outcome:** RGL out of the main dashboard chunk until needed.

### 2.4 Memoize hot-list props
- [ ] **2.4.1** [web] `tasks/page.tsx:335-343`: hoist `onTaskMove`/`onTaskSelect`/`onDeleteTask` to
  `useCallback` (and stable query-derived data) so `TaskKanbanBoard` (memoized) doesn't re-render
  on every parent state change. Same pattern for any inline arrow props to memoized children
  (`dashboard/layout.tsx` `handleTogglePin`).
- [ ] **2.4.2** [web] `dashboard/layout.tsx`: wrap `NavGroup` in `React.memo` and pass stable
  callbacks so nav doesn't re-render on unrelated state changes.

---

## PHASE 3 — Performance: widget & list optimization

### 3.1 Widget loading/error/empty consistency
- [ ] **3.1.1** [web] Every widget (`metric-widget`, `time-clock-widget`, `announcement-board`,
  `quick-notes`, `recent-activity-widget`, `pending-approvals-widget`, `feedback-form`,
  `hr-team-attendance-widget`, `admin-today-attendance-widget`, `hr-activity-feed-widget`):
  - Use `isPending` (cold) → skeleton shaped like content; `isFetching && data` → keep content +
    subtle indicator; `isError` → error card with Retry; empty → real EmptyState (no mock data).
  - Add `isError`/retry to `announcement-board.tsx`, `quick-notes.tsx`, `feedback-form.tsx`
    (currently `data ?? []` hides failures).
  - Replace bare `Loader2` spinners (`admin-today-attendance-widget.tsx:46-49`,
    `hr-team-attendance-widget.tsx:43-47`, `time-clock-widget.tsx` full-card overlay) with skeletons
    for cold load + keep-content-on-refresh.
- [ ] **3.1.2** [web] `EmptyState` — pass an explicit `icon` everywhere (avoid the noisy
  `/animated-logo.mp4` autoplay fallback inside metric/small cards).

### 3.2 Virtualize large lists
- [ ] **3.2.1** [web] Chat: virtualize `message-list.tsx` (append-only, memoized rows, auto-scroll)
  and `conversation-list.tsx` when large. Load older messages via the ignored `next_cursor`
  (`chat/page.tsx:69`).
- [ ] **3.2.2** [web] Audit log: ensure `audit-log-table.tsx` virtualizes (TanStack Table +
  `useVirtualizer`) for thousands of rows.
- [ ] **3.2.3** [web] Notifications list + announcement board: windowing only if counts grow beyond
  ~50 (low priority).

### 3.3 Export-history polling (PERF-13)
- [ ] **3.3.1** [api] `ReportController::exports`: add `->limit(20)->latest()` so the polling
  payload is bounded.
- [ ] **3.3.2** [web] `export-history.tsx:28`: add a max poll duration (stop after, say, 5 min);
  rely on the Reverb `ExportCompleted` event (now that Echo is centralized in 1.4) to invalidate
  `["report-exports"]` instantly instead of polling.

---

## PHASE 4 — Performance: backend (PERFBE-*)

### 4.1 Dashboard metrics (PERFBE-1, PERFBE-2)
- [ ] **4.1.1** [api] `DashboardController.php:98,103,112,127`: remove the per-request
  `Schema::hasTable()` calls — cache the booleans once (config or a static keyed by the request)
  since the schema doesn't change at runtime.
- [ ] **4.1.2** [api] Raise the dashboard cache TTL from 30s to 5min; split role-agnostic counts
  (total_employees, departments, active_projects) into a shared key shared across roles; split
  `recent_activity` (audit_logs limit 10) into a shared admin key. Keep per-user/role/day only for
  user-specific counts. Invalidate on relevant mutations (leave decision, project/task change,
  attendance punch).
- [ ] **4.1.3** [api] Verify zero N+1 + ≤5 SQL via the query-count test (0.2.4).

### 4.2 Attendance ETag + meToday cache (PERFBE-3, PERF-7)
- [ ] **4.2.1** [api] `AttendanceController::hrToday`/`overview`: compute the ETag from a cheaper
  signal (max `updated_at` + count of the result set) instead of `md5($response->getContent())`
  (which serializes the whole payload twice).
- [ ] **4.2.2** [api] `AttendanceController::meToday`: add `Cache-Control: private, max-age=30`
  (and optionally an ETag) like the overview endpoints.

### 4.3 Reports + roles cache (PERFBE-4, PERFBE-5)
- [ ] **4.3.1** [api] `ReportController::attendanceSummary`: cache the per-day aggregate (5min) or
  materialize a daily summary; avoid 6 live subqueries per user on every call.
- [ ] **4.3.2** [api] Cache `role_assignments` per user (short TTL, e.g. 60s) to avoid the per-
  request pluck in `ApprovalService` and many controllers.

### 4.4 Bound unbounded endpoints (PERFBE-6)
- [ ] **4.4.1** [api] Add pagination or `->limit()` to index endpoints that currently `->get()`:
  `announcements`, `quick-notes`, `qa-forms`, `pins`, `saved-views`, `reports/exports`.

### 4.5 Missing indexes
- [ ] **4.5.1** [api] Add indexes: `task_time_logs.log_date`, `messages.conversation_id`,
  `notifications.created_at`. Add FK on `users.work_schedule_id`.

---

## PHASE 5 — Correctness fixes (CORR-*)

### 5.1 Settings key reconciliation (CORR-1) — the 1 remaining "still broken" item
- [ ] **5.1.1** [api] Pick ONE canonical key set for settings and update BOTH sides:
  - Password policy: decide on either `password.min_length`/`require_mixed`/`require_number`/
    `require_symbol` (what `AuthController::getPasswordPolicyRule()` reads) OR
    `password_policy_min_length`/`password_policy_require_numbers`/`password_policy_require_symbols`/
    `password_policy_require_mixed` (what `DatabaseSeeder` writes). Update the seeder + the
    SettingsController UI keys to match AuthController (or vice-versa). **Outcome:** configured
    password policies actually take effect.
  - Session TTL: reconcile `session.access_token_ttl`/`session.refresh_token_ttl` (AuthController)
    vs `session_ttl_minutes` (seeder).
  - Reminder offsets: reconcile `attendance_reminder_offset`/`missed_clockin_alert_offset`/
    `shift_reminder_offset` between seed/jobs/AuthController.
- [ ] **5.1.2** [api] Add a feature test asserting a configured policy (e.g. min_length 12) is
  actually enforced at password change.

### 5.2 Force-password-change gating (CORR-2)
- [ ] **5.2.1** [api] Decide and document: either enable `security.force_password_change` in the
  seeder (so seeded `must_change_password=true` is honored) OR change `ForcePasswordChange` to
  default-on regardless of the setting. Pick one; update seed + a test. (Currently the middleware
  works correctly but the setting is off, so first-login change is effectively disabled despite the
  flag.)

### 5.3 Audit CSV injection (CORR-3)
- [ ] **5.3.1** [api] `AuditLogController::export`: escape CSV fields (prefix `=,+,-,@` with a
  single quote) for `action`, `subject_type`, `subject_id`, before/after/meta.

### 5.4 Timer ownership + preference leak (CORR-4, CORR-5)
- [ ] **5.4.1** [api] `TimerController::index`: scope to the authenticated user's logs unless the
  caller has `hr.view-team-attendance`/`admin.view-all-attendance` (and then scope to team/dept).
- [ ] **5.4.2** [api] `UserPreferenceController`: catch `\Throwable` but return a generic JSON
  message (no file/line leak); log the detail server-side.

### 5.5 Admin-password-reset gate (CORR-6)
- [ ] **5.5.1** [api] Decide: keep `ability:role:super_admin` on `/admin/password-resets*` OR
  switch to `capability:settings.manage` for consistency with the rest of the settings routes.
  Document the decision.

---

## PHASE 6 — Component & design-system consistency (VIS-*)

### 6.1 Toast position (VIS-1)
- [ ] **6.1.1** [web] `providers.tsx` Toaster is `position="bottom-right"`; spec says top-right.
  Pick one (recommend top-right to match spec) and apply; verify no overlap with the notifications
  modal or header.

### 6.2 Button icon sizing (VIS-2)
- [ ] **6.2.1** [ui-pkg] `packages/ui/src/components/button.tsx`: scope or remove the global
  `[&_svg]:size-4` override so declared icon sizes (e.g. `w-5 h-5`) hold inside Buttons. Verify
  icon+text alignment remains `flex items-center gap-2`.

### 6.3 Icon+text spacing (VIS-3)
- [ ] **6.3.1** [web] Replace `mr-1`/`mr-2` icon patterns with `flex items-center gap-2`:
  `notifications/page.tsx:122,127,145`, `admin/attendance/page.tsx:28,32,36`, any others found by
  grep `className=".*mr-1.*"` / `mr-2` on icon elements.

### 6.4 Token misuse sweep (VIS-4)
- [ ] **6.4.1** [web] Grep `text-muted|border-muted|bg-muted` across `apps/web/src`; either remap
  `--color-muted` in `globals.css` to `var(--text-muted)` OR replace each usage with explicit
  `text-secondary`/`text-neutral-500`. Verify nothing renders invisible.

### 6.5 StatusBadge + Avatar consistency (VIS-5, VIS-6, VIS-7)
- [ ] **6.5.1** [web] Use shared `StatusBadge` everywhere status is shown (designations page uses
  raw `bg-emerald-100`/`bg-rose-100` spans — switch).
- [ ] **6.5.2** [web] Use `<Avatar>` with hashed colors everywhere (users page uses inline
  `bg-violet-100 text-violet-700` — switch).
- [ ] **6.5.3** [web] Use Radix `Select`/`Combobox` (not raw `<select>`) in the user create/edit
  dialogs for department/team/designation.

### 6.6 Page header/layout system (VIS-8)
- [ ] **6.6.1** [web] Standardize every page header on `<PageContainer>` (currently only
  notifications uses it). Consistent title, subtitle, actions, breadcrumb, gutter, spacing.

### 6.7 Empty-state placeholders with real data (UX-14, UX-15)
- [ ] **6.7.1** [web] Employee dashboard "Task Progress" and "Approval Status" widgets: replace the
  placeholder EmptyStates with real data (recent task progress bar animated 0→%, task approval
  status panel Pending/Approved/Redo from `/dashboard/metrics` or dedicated endpoints).
- [ ] **6.7.2** [web] "Quick Task Assignment" widget (all roles): implement the real Quick Task
  form (R7.11) — employee picker + task fields → creates task in their list → notifies Global Chat
  on completion. (Currently a placeholder EmptyState.)

---

## PHASE 7 — Global layout, navigation & shell polish

### 7.1 Sidebar final polish
- [ ] **7.1.1** [web] Verify all three sidebar states (hidden/collapsed/expanded) transition
  smoothly (220ms glide, label fade before width). Verify collapsed icon+tooltip (150ms), active
  item (violet-tinted bg + 3px brand-gradient left bar + weight 600), hover (bg-surface-2).
- [ ] **7.1.2** [web] Pinned-items section at the bottom of the sidebar (separator + icons when
  collapsed + tooltips). Wire star/pin on projects/tasks/profiles (Pin API exists).
- [ ] **7.1.3** [web] Mobile: hamburger opens a full-screen menu (verify the Sheet behavior is
  acceptable; spec says full-screen). Bottom nav ≤5 with the required set.

### 7.2 Header polish
- [ ] **7.2.1** [web] Verify header controls (logo+wordmark, Start Shift, notifications, avatar)
  are consistently sized (h-9/10) and vertically aligned; sticky; e4 elevation; blurs on scroll.
- [ ] **7.2.2** [web] Verify the Start Shift button icon is centered (`flex items-center
  justify-center`); during shift the LiveTimer pill renders correctly; tooltip on the icon button.
- [ ] **7.2.3** [web] Verify the centered notifications modal: backdrop, close X, Clear (popup-only
  via `dismissedNotificationIds`), Mark-as-Read, recent list (default filter "recent"), "View all"
  → Notification Center. Clearing preserves the Chats/Notification Center area.

### 7.3 Breadcrumbs + command palette
- [ ] **7.3.1** [web] Verify breadcrumbs render once on detail screens, each crumb a Link,
  truncate with ellipsis on narrow widths.
- [ ] **7.3.2** [web] Command palette (Ctrl+K): verify actions navigate/create/pin/toggle-theme
  correctly; remove any duplicate shift controls that overlap with the Start Shift button; fix the
  "Request Leave" item that routed to `/dashboard/attendance` (should be `/dashboard/leave`).

---

## PHASE 8 — Page-by-page UX fixes (all modules, all roles)

### 8.1 Org — Users (Admin/HR)
- [ ] **8.1.1** [web] Create dialog: all fields present (name, email, username, phone, employee_id,
  department, team, designation, roles multi-checkbox). Remove the stale "Modals omitted" comment.
  Edit dialog parity. Use Radix Select/Combobox (6.5.3).
- [ ] **8.1.2** [web] Bulk actions verify (activate/deactivate/export). Reset password, deactivate,
  activity log, dual-role assign — all wired + capability-gated. Pagination UI + error/empty states.

### 8.2 Org — Departments / Designations (Admin)
- [ ] **8.2.1** [web] Departments: CRUD + archive/restore + member drill-down with real avatars;
  export token via `getAuthToken()`. Designations: CRUD + activate/deactivate + real member counts
  + shared StatusBadge. Both: error/empty states.

### 8.3 Directory (all roles)
- [ ] **8.3.1** [web] Searchable (name/dept/designation); grid/list; card photo/name/designation/
  dept/email/phone(if visible). Remove the hard-coded `"G4K001"` fallback (`directory/page.tsx:330`).
  Send Message → opens conversation (already reads `?conversation=`; verify it lands selected).
  Visibility branches honored (public/internal/private). Pagination UI + error/empty states.

### 8.4 Attendance (Employee/HR/Admin)
- [ ] **8.4.1** [web] Employee: clock in/break/break-end/clock-out optimistic + rollback toast
  (2.1.3 + 1.8.1 applied); live timer isolated; heatmap responsive; per-day popover.
- [ ] **8.4.2** [web] HR: today status + present/absent/late chips + dept filter + weekly/monthly
  graph + manual correction (own team). Analytics summary cards present. Correct the misleading
  "hrToday is just an alias" comment. Replace `alert()` → Sonner toast.
- [ ] **8.4.3** [web] Admin: company-wide + date/dept/person filters + open-shifts "Notify HR"
  wired. Replace `alert()` → toast; remove unused `Skeleton` import / unused `all` param.

### 8.5 Leave (Employee/HR/Admin)
- [ ] **8.5.1** [web] Tabs bound to URL (`useUrlState`) so refresh keeps tab. Approve = 1-click
  optimistic; reject → AlertDialog confirm. Holiday calendar. History badges.
- [ ] **8.5.2** [web] Fix `leave-request-form.tsx` overlap-check cache key fragility (stable key).
- [ ] **8.5.3** [web] `leave-history-table.tsx`: stop passing `isFetchingNextPage={isLoading}`
  without an infinite query (wire infinite query or remove the prop).

### 8.6 Projects & Tasks (Admin/HR/Employee)
- [ ] **8.6.1** [web] `createMutation`/`updateMutation` `onError` → toast (UX-1). Project card
  click → detail (UX-2). Pagination/infinite query on projects.
- [ ] **8.6.2** [web] `task-detail-sheet.tsx`: render Sheet before null-return for smooth close;
  refetch selected task's comments after `commentMutation`.
- [ ] **8.6.3** [web] Kanban: per-column empty state ("No tasks"); mobile card-stack instead of
  horizontal scroll. Gantt responsive (already inline grid); lazy-load.
- [ ] **8.6.4** [web] Verify full lifecycle: create project → assign team → add tasks → Kanban drag
  → submit → approve → history; recurring task recreates; QA form; project timer; personal task
  list; saved views.

### 8.7 Chat & Notifications (all roles)
- [ ] **8.7.1** [web] Remove dead `Globe`/`Plus` imports. Make chat responsive: single column +
  back button on mobile (drop the fixed `h-[600px]` + `w-1/3` sidebar on small screens).
- [ ] **8.7.2** [web] Virtualize message list; load older via `next_cursor`. Wire composer
  paperclip `onClick` → FileUpload popup. @mentions Combobox + read receipts + pin.
- [ ] **8.7.3** [web] Notifications page: wire FilterBar search (currently no-op) and the `type`
  filter to the backend (or remove the dead UI). Loading = skeleton; error + retry; pagination.

### 8.8 Reports (Admin/HR)
- [ ] **8.8.1** [web] Use shared `DataTable` in `report-builder.tsx` (not raw `<table>`). Saved
  views; filters via FilterBar. Export queued; export-history bounded (3.3).
- [ ] **8.8.2** [web] `saved-report-views.tsx`: remove dead dropdown-menu import; make "Save
  Current" popover responsive (no right-edge overflow on mobile).
- [ ] **8.8.3** [web] `admin/reports/page.tsx`: surface the real error in the catch (don't discard).

### 8.9 Settings & Audit (Admin; HR view)
- [ ] **8.9.1** [web] All tabs load (`/settings/grouped` — already fixed). Logo upload token via
  `getAuthToken()`. Working-days editor explicit. Separate password-policy vs session-rules submit.
- [ ] **8.9.2** [web] Audit log: real user list for the filter (remove hard-coded placeholder);
  export CSV (escaped — 5.3.1). Virtualize for large log.

### 8.10 Profile (all roles)
- [ ] **8.10.1** [web] Shared password validator (extract from duplicated regex in
  `profile/page.tsx` + `change-password/page.tsx`). Avatar upload token via `getAuthToken()`.
  Devices + remote logout. Directory visibility setting.

### 8.11 Dialog/Sheet accessibility sweep (UX-13)
- [ ] **8.11.1** [web] Add `DialogDescription`/`SheetDescription` (or `aria-describedby`) to every
  Dialog/Sheet missing it: attendance request-leave, users create/edit, departments, designations,
  projects, tasks, etc.

### 8.12 Dead code & unused-import sweep (UX-12)
- [ ] **8.12.1** [web] Sweep `apps/web/src` for unused imports/vars and remove: `Globe`/`Plus` in
  `chat/page.tsx`, any unused `Skeleton` in `admin/attendance/page.tsx`, the dead `dropdown-menu`
  import in `saved-report-views.tsx`, the unused `AlertDialogTrigger`/`all` param patterns, and any
  others flagged by `tsc --noUnusedLocals`/ESLint `no-unused-vars`. Verify `pnpm lint` + `pnpm
  typecheck` are clean.
- [ ] **8.12.2** [web] Remove misleading/stale code comments (e.g. "hrToday is just an alias for
  overview" in `hr-attendance-table.tsx`, "Modals omitted for brevity" in `users/page.tsx`).

---

## PHASE 9 — Role-based workflow & permission validation

- [ ] **9.1** [test] Sign in as `karthik`/`Admin@123`, `aravind`/`Hr@123`, `praveen`/`Dev@123`.
  Each lands on its role dashboard; each sees ONLY its permitted sidebar items + pages.
- [ ] **9.2** [test] Employee deep-link to `/dashboard/org/users`, `/dashboard/admin/attendance`,
  `/dashboard/audit`, `/dashboard/settings` → redirected/blocked (middleware + client).
  `GET /attendance/admin/overview` as employee → 403. HR cannot approve HR leave (routes to Admin).
- [ ] **9.3** [test] Verify the capability matrix in `context.md` §2.3 end-to-end for every cell.
- [ ] **9.4** [test] Dual-role user → Role Selection → chosen role's dashboard. Force-password-change
  flow (after 5.2). Onboarding. Device revoke → session signs out via Reverb.
- [ ] **9.5** [test] Reports: HR team-scoped only; Admin full. Projects/tasks: employees see only
  assigned; HR/Admin manage. Timer logs scoped to self (after 5.4.1).

---

## PHASE 10 — Responsive optimization (P-RESP / R13.22)

- [ ] **10.1** [test] Visual regression at 360/768/1024/1440/1920px (light + dark) for every page.
- [ ] **10.2** [web] Tables → cards on mobile (users/departments/designations/directory/leave/audit/
  reports) where they currently horizontal-scroll.
- [ ] **10.3** [web] Chat single-column + back button on mobile. Kanban card-stack on mobile.
- [ ] **10.4** [web] Dialogs/dropdowns/popovers never overlap or escape viewport (saved-views
  popover, filter popovers → Sheet on mobile).
- [ ] **10.5** [web] Touch targets ≥44×44 (≥48 on attendance mobile buttons). Bottom nav ≤5.
- [ ] **10.6** [web] Sidebar 3-state behaves per breakpoint; mobile hamburger full-screen.

---

## PHASE 11 — Accessibility (P-A11Y / R13.23)

- [ ] **11.1** [test] axe-core zero critical/serious on all primary routes (CI gate from 0.2.3).
- [ ] **11.2** [web] Visible 2px brand-violet focus ring (2px offset) on `:focus-visible` for every
  interactive element; logical tab order; no `outline:none` without replacement.
- [ ] **11.3** [web] ARIA labels on every icon-only button (tooltips double as labels).
- [ ] **11.4** [web] Keyboard: Ctrl+K/B/N//Esc/Enter/arrows all reachable + operable.
- [ ] **11.5** [web] `prefers-reduced-motion` → durations ≤1ms, no scale, no rotating gradient.
- [ ] **11.6** [web] Contrast 4.5:1 text / 3:1 UI; brand-gradient only on large text/non-text.
- [ ] **11.7** [web] Dialogs/sheets/menus: focus trap, restore focus, Esc behavior correct.

---

## PHASE 12 — Bundle & loading optimization

- [ ] **12.1** [web] All routes lazy-loaded (Next file-based router handles this; verify no eager
  cross-route imports). Heavy libs dynamic: ECharts ✓, dnd-kit ✓ (behind dynamic parent),
  Tiptap, xlsx, Gantt — verify all dynamic; RGL → dynamic (2.3.1).
- [ ] **12.2** [web] `next.config.ts`: add `experimental: { optimizePackageImports: ["lucide-react",
  "date-fns", "@g4k/ui"] }`; add manual chunk splitting for large vendors.
- [ ] **12.3** [web] All images via `next/image` (avatars ≤96 display, ≤256 stored); fonts
  self-hosted + subset + preload + `font-display: swap` (Inter + Sora).
- [ ] **12.4** [web] Production build: tree-shake, minify, vendor split, no sourcemaps, React prod
  build. Verify First-Load JS ≤200KB gz per route (CI gate from 0.2.1).
- [ ] **12.5** [api] Backend: route/config/view cache, OPcache, brotli/gzip, ETag/Cache-Control on
  safe GETs, query cache for hot reference data (designations/departments/holidays).

---

## PHASE 13 — Animations & micro-interactions (purposeful, not excessive)

- [ ] **13.1** [web] Primary button rainbow-hover + 0.96 active + dot-loader (verify reduced-motion
  fallback). Cards lift to e2 on hover (100ms). Badges transition color (150ms).
- [ ] **13.2** [web] Sidebar glide 220ms; drawer 200ms; dialog ease-modal snap; tooltip 150ms;
  list reorder 180ms; page transition 180ms; progress fill 600ms (0→value) — but only on first
  render for MetricWidget (1.9.1).
- [ ] **13.3** [web] Instant feedback on every tap (compress 0.96, 120ms). Optimistic UI for safe
  mutations (pin, reorder, read-mark, status toggle, clock-in, leave approve) + rollback toast.
- [ ] **13.4** [web] No flicker, no jank: verify the dashboard no longer re-skeletons on navigation
  or background refresh after Phases 1–2.

---

## PHASE 14 — Functional QA (end-to-end, every workflow)

> Run after Phases 1–13. Every workflow: user action → frontend → API → DB/state → response → UI
> update, with loading/success/error/empty/disabled/permission states.

- [ ] **14.1** Auth: login (3 roles), wrong password, lockout, forgot (SMTP + admin), reset,
  force-change (after 5.2), onboarding, role-select, devices + remote revoke, reload-persists.
- [ ] **14.2** Attendance: clock in → break → break-end → clock out (optimistic + rollback);
  late-after-grace badge; overtime amber; heatmap + per-day popover; forgot-clock-out → open shift
  → HR alerted → correction → re-reconcile; HR own-team; Admin all; export downloads.
- [ ] **14.3** Leave: employee submit → HR approve → attendance days = leave (Mon-Sat); HR submit
  → Admin approve/reject with reason; duplicate-overlap rejected; holiday calendar; bell + submitter
  notified on decision.
- [ ] **14.4** Projects/Tasks: create → assign team → add tasks → Kanban drag → submit → approve →
  history; Gantt renders; recurring recreates; QA form; project timer; personal task list; saved
  views; Quick Task Assignment (real, 6.7.2).
- [ ] **14.5** Chat: send DM + read receipt; @mention notifies; post announcement → dashboard +
  bell (realtime); create note; feedback → HR/Admin DM + high-priority notification; offline queues;
  mobile chat UX.
- [ ] **14.6** Reports: generate each; export Excel + PDF (queued + Reverb-invalidated); Sunday
  email (dry-run); HR limited; saved views.
- [ ] **14.7** Settings: edit each setting; password policy takes effect (after 5.1); audit
  captures actions; company profile + working hours + holiday calendar + policies + reminders.
- [ ] **14.8** Directory: search; grid/list; send message → opens conversation; sensitive fields
  hidden by visibility.
- [ ] **14.9** Notifications: bell modal centered; Clear (popup-only, preserves Chats); Mark-as-Read;
  close; Notification Center full history.
- [ ] **14.10** Dashboard: drag doesn't open widgets; widgets load independently; collapse Quick
  Notes; announcement one-like-per-person; per-role composition correct; **no flicker, no stuck
  loaders, cached data shows instantly on navigation** (the core acceptance criterion).

---

## PHASE 15 — Visual QA & consistency sweep

- [ ] **15.1** [test] No random black/violet outlines, inconsistent inputs, excessive borders,
  broken animations, inconsistent spacing, poor hierarchy, overlapping elements, inconsistent sizes
  across every page and all 3 roles.
- [ ] **15.2** [test] One design system applied: palette, typography, spacing, radius, elevation,
  motion, states. StatusBadge consistent across modules. Avatar consistent. PageContainer consistent.
- [ ] **15.3** [test] No dead buttons, decorative controls, or disconnected actions. Every visible
  control works.
- [ ] **15.4** [test] Colorful + vibrant yet disciplined: gradients only on hero/headers/logo;
  per-module accents; semantic data colors consistent.

---

## PHASE 16 — Performance QA (the "always loading" acceptance gate)

> This is the explicit verification that the user's primary complaint is resolved at the root.

- [ ] **16.1** [test] **Navigate away from `/dashboard` and back within 5 min:** widgets show cached
  data instantly (no skeleton), background refresh is subtle. (Validates PERF-1, PERF-3, PERF-8.)
- [ ] **16.2** [test] **HR/Admin attendance page:** only ONE `/attendance/hr/today` (or
  `/admin/overview`) request per 30s poll (DevTools network). (Validates PERF-5.)
- [ ] **16.3** [test] **Approve a leave/task:** the dashboard metrics do NOT re-skeleton; only the
  approvals list refetches. (Validates PERF-6.)
- [ ] **16.4** [test] **Shift active for 5 min:** React Profiler shows only `<LiveTimer>` committing
  each second; the rest of the dashboard does not re-render. (Validates PERF-11, 2.2.)
- [ ] **16.5** [test] **Background refetch of metrics:** numbers do NOT visibly "re-count" (animate).
  (Validates PERF-9.)
- [ ] **16.6** [test] **Transient 5xx:** the action surfaces a danger toast (not silent success).
  (Validates PERF-2.)
- [ ] **16.7** [test] **Reverb:** one WebSocket connection; no duplicate `private-user.{id}`
  subscriptions; channel cleanup on unmount. (Validates PERF-4.)
- [ ] **16.8** [test] **Cold load then navigation:** no full-screen auth-guard skeleton flash when a
  session is already persisted. (Validates PERF-10.)
- [ ] **16.9** [test] **Lighthouse** on the 6 primary routes meets LCP≤2.5 / INP≤200 / CLS≤0.1 /
  FCP≤1.8.
- [ ] **16.10** [test] **Bundle:** First-Load JS ≤200KB gz per route (CI gate).
- [ ] **16.11** [test] **Backend query counts:** ≤5 SQL/list, zero N+1 (CI gate).

---

## PHASE 17 — Regression & production readiness

- [ ] **17.1** [test] Full suite green: Laravel feature tests (query-count + capability + the new
  password-policy test from 5.1.2) + web component/integration tests + the new perf/a11y/bundle CI
  gates (Phase 0.2).
- [ ] **17.2** [test] `php artisan migrate:fresh --seed` succeeds; the seeded settings now match
  what AuthController reads (5.1).
- [ ] **17.3** [test] `pnpm build` + `pnpm lint` + `pnpm typecheck` green; bundle within budget.
- [ ] **17.4** [deploy] Deploy api (Railway) + web (Vercel); clear caches (`config:cache`,
  `route:cache`, `view:cache`, `migrate --force`); verify `/api/ping` + login.
- [ ] **17.5** [deploy] Verify rollback (Railway redeploy + Vercel instant rollback) + Supabase
  backup restore drill.
- [ ] **17.6** [monitor] Watch Sentry + Pulse + web-vitals for 7 consecutive days; p75 within
  targets. Declare go-live.
- [ ] **17.7** [docs] Update `openspec/TRACKER.md` to the verified state; archive completed specs;
  record performance notes (budgets met, fixes applied — esp. PERF-1/2/4/5 which were the root
  causes of the "always loading" complaint).

---

## Acceptance — "done" definition for the whole revamp

The application is complete when ALL of the following are true:

1. **Every checkbox above is checked** and verified by a real test or manual smoke at
   360/768/1024/1440px in light + dark.
2. **The "always loading" root causes are eliminated** — Phase 16 performance QA passes (the core
   acceptance gate). Specifically: `gcTime >> staleTime`; no 5xx-silent-queue; no `subscribe`
   identity loop; no duplicate attendance polling; no over-broad metric invalidation; atomic store
   selectors; widget grid renders from cache on re-mount; MetricWidget doesn't re-animate; auth-
   guard doesn't flash when a session is persisted.
3. **No CORR/UX/VIS bug from `context.md` §8 remains.** Password policies take effect (CORR-1);
   force-change gating is decided and documented (CORR-2); audit CSV escaped; timer ownership
   scoped; all dead controls wired or removed; all dialogs have descriptions; all lists virtualize
   or paginate; toasts consistent; status/avatar/select usage consistent; page headers consistent.
4. **All three roles** perform their full day-to-day workflows end-to-end with no dead buttons, no
   disconnected actions, no broken navigation, no incorrect permissions, no visually-implemented-
   but-non-working features.
5. **Performance budgets green** in CI: bundle ≤200KB gz/route, Lighthouse LCP≤2.5/INP≤200/CLS≤0.1,
   zero N+1, ≤5 SQL/list, skeletons over spinners, optimistic UI + rollback, cached navigation
   shows data instantly. The app **feels fast and never stuck loading** even on a flaky network.
6. **Accessibility:** axe-core zero critical/serious; full keyboard; visible focus; WCAG 2.1 AA
   contrast; reduced-motion respected.
7. **Design system:** one consistent system across every screen — palette, typography, spacing,
   radius, elevation, motion, states, components. Colorful + vibrant yet disciplined. No random
   colors/outlines, no duplicate components, no inconsistent inputs.
8. **Backend wiring:** every visible action performs its function; realtime works (one Echo
   instance); capability gates on every route; configured settings take effect; all demo data
   consistent.
9. **Production:** deployed, monitored (Sentry + Pulse + web-vitals), rollback + backup verified,
   p75 within targets for 7 days.

Completing every checkbox yields a fully wired, polished, responsive, fast, consistent, accessible,
intuitive, colorful, vibrant, and deployment-ready application — reliable enough for continuous
real-world production use, with no unnecessary loading screens and no known duplicate, overlapping,
dead, or disconnected functionality.
