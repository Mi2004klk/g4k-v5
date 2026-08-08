# Requirements Catalog — Games4King Workplace OS

> **Single source of truth for WHAT the system must do.** Every functional requirement from the
> original product brief, re-stated with stable IDs. Phase specs (`openspec/changes/phase-XX-*/
> specs/**`) reference these IDs. Platform/architecture decisions live in `project.md`;
> implementation tracking lives in `TRACKER.md`.
>
> Status legend: **P0** in M1 · **M1** = full in M1 · **defer** = later milestone.
> Capability tags: `[A]`=Super Admin · `[H]`=HR · `[E]`=Employee.

---

## R1 — Authentication & Sessions  (Phase 1)
- **R1.1** Sign-in screen: landscape logo top, welcome copy, copyright "Games4King Workplace OS", info tooltip "Gen2k Conglomerate (2018) • Milestone 1". `[A][H][E]` M1
- **R1.2** Login by Email OR Employee ID + password; password hidden with show/hide toggle. M1
- **R1.3** Sign-in shows loading animation; failure shows an error message. M1
- **R1.4** Role Selection screen for dual-role users; lists assigned roles; tapping lands on that role's dashboard. M1
- **R1.5** Forgot password: enter email/Employee ID → reset link (SMTP) → set new password → redirect to sign-in. M1
- **R1.6** In-app forgot-password path with Admin approval (in addition to SMTP). M1
- **R1.7** Account lockout after 5 failed attempts within 10 minutes; user retries after lockout ends. M1
- **R1.8** Suspicious-login detection notifies HR + Admin. M1
- **R1.9** **Force password change on first login** (seed-data requirement). M1
- **R1.10** New-account onboarding: welcome/setup screen on first login. M1
- **R1.11** Per-device session list; remote logout from any device; logout from current device. `[A][H][E]` M1
- **R1.12** Capability-gated route guards; auth-aware routing. M1
- **R1.13** Responsive sign-in; offline queues the login attempt then syncs. M1

## R2 — Users, Roles & Org Structure  (Phase 2)
- **R2.1** Capability-based permissions only; roles→capabilities; all decisions in backend. M1
- **R2.2** Designations master (the 15 seed "roles" = designations/titles; editable). M1
- **R2.3** Admin creates/edits HR accounts: name, email, employee ID, department, designation. `[A]` M1
- **R2.4** Admin: assign/change department an HR manages; deactivate/delete HR; reset HR password; view HR activity log. `[A]` M1
- **R2.5** Admin creates/edits Employee accounts: name, email, employee ID, department, team, designation. `[A]` M1
- **R2.6** Admin: assign/reassign dept+team; assign dual role; deactivate/delete; reset password; view activity log. `[A]` M1
- **R2.7** Admin-only Department CRUD (name, description); assign HR/employees; full member list; archive/delete. `[A]` M1
- **R2.8** Configurable auto-numbering (prefix, start, length, format) for company/employee/department IDs — no code changes. M1
- **R2.9** Master-data table pattern: create/read/update/delete/import/export/activate/deactivate/search/filter/pagination/audit. M1
- **R2.10** Employee Directory: searchable (name/dept/designation); grid/list; card shows photo/name/designation/dept/email/phone(if visible); click → public profile + Send Message. `[A][H][E]` M1
- **R2.11** Profile (all roles): view/edit photo (popup w/ format+size limits), name, phone, designation; change password. M1
- **R2.12** Profile: view logged-in devices; remote + current-device logout. M1
- **R2.13** Seed: 1 company, 2 departments, designations, 13 employees, branding, working days, holiday calendar, attendance rules, company docs. M1

## R3 — App Shell & Design System  (Phase 3)
- **R3.1** Design tokens (color, spacing, typography, elevation, motion) defined in code; brand palette from logo. M1
- **R3.2** Theme engine: light + dark (both colorful); persisted per user; density control. M1
- **R3.3** Top bar (search stub, bell, profile); role-aware sidebar per spec §9 (Admin/HR/Employee) + mobile bottom nav (≤5 icons) + hamburger full-screen menu. M1
- **R3.4** Breadcrumbs on detail screens; each crumb clickable. M1
- **R3.5** Pinned items (star/pin on projects/tasks/profiles) → Pinned section at bottom of sidebar; removable. M1
- **R3.6** Component library (packages/ui): button, card, table, badge, dialog, drawer, tooltip, toast, skeleton, empty-state, command-palette, shortcut-overlay. M1
- **R3.7** Form system: required markers, on-pause validation, inline errors, submit loading, success toast (bottom-right), sectioned long forms, Save-as-Draft + 30s autosave + restore banner. M1
- **R3.8** Filter/sort bar (search, status, date range, dept/team, priority, sort+direction, clear-all, removable chips) — reusable across lists. M1
- **R3.9** Confirmation dialogs (destructive=red); hover states/tooltips on icon buttons; inline editing (pencil → Enter/Escape). M1
- **R3.10** Drag-and-drop list reordering (dnd-kit); status badges; pagination (default 20, options 50/100). M1
- **R3.11** Keyboard shortcuts: Ctrl+K palette, Ctrl+N (context new), Ctrl+/ help overlay, Esc close, Enter submit/confirm. M1
- **R3.12** Toasts top-right, auto-dismiss 4s, manual X; colors green/red/amber/blue. M1
- **R3.13** Empty states with illustration (+ animated logo mp4 where relevant) + optional action button; specific copy per context. M1
- **R3.14** Skeleton loaders; button loading dot-state; progress bars animate 0→value. M1
- **R3.15** Responsive layouts + PWA manifest + service worker. M1
- **R3.16** Loading states: prefer skeletons/partial/cached over spinners. M1

## R4 — Dashboard Framework & Widgets  (Phase 4)
- **R4.1** Widget engine: self-contained widgets w/ permissions, settings, data providers; drag/resize/collapse/refresh/lazy-load/offline/realtime. M1
- **R4.2** Adaptive widget by size: small=metric · medium=metric+label+secondary · large=chart+stats+trend+actions. M1
- **R4.3** Per-user dashboard rearrange + resize via React Grid Layout; layout saved per user. M1
- **R4.4** Each widget loads independently; refresh icon on hover; dismissible; clickable to go deeper. M1
- **R4.5** Generic Metric Widget (JSON-fed) reused everywhere. M1
- **R4.6** Admin dashboard: employees active/inactive, active projects, today attendance (present/absent/late), pending approvals (quick access), recent activity feed (dense, no noise), quick task assignment. `[A]` M1
- **R4.7** HR dashboard: present/absent/late today, active projects, pending leave requests, pending submissions, quick task assignment (auto-notifies Global Chat on completion). `[H]` M1
- **R4.8** Employee dashboard: active projects, pending tasks, attendance widget (Start/Pause/End + live timer), recent task progress bar, task approval-status panel. `[E]` M1
- **R4.9** Quick-action shortcuts on each dashboard. M1

## R5 — Attendance  (Phase 5)
- **R5.1** Clock In / Start Break / End Break / Clock Out; full shift timeline saved automatically. `[A][H][E]` M1
- **R5.2** Live HH:MM:SS timer (count up); continues on navigation; stops only on explicit End; turns amber on overtime. M1
- **R5.3** Calendar heatmap history; click date → clock-in, breaks, clock-out, total hours, projects, tasks. M1
- **R5.4** Admin: company-wide attendance for everyone; filter by date/dept/person; click any date/person for full summary. `[A]` M1
- **R5.5** HR: today's employee shift status; filter present/absent/late; view employee leave requests. `[H]` M1
- **R5.6** HR: weekly/monthly attendance graph per employee. `[H]` M1
- **R5.7** Manual correction of an attendance entry (Admin/HR). M1
- **R5.8** Overtime tracked beyond standard hours; shown in attendance + shift summaries; separate heatmap color. M1
- **R5.9** Late badge if clock-in after official start time. M1
- **R5.10** Export attendance as report (Excel). M1
- **R5.11** Shift-reminder scheduler: employee alerted 15 min before start; HR alerted 30 min after start if not clocked in; times configurable in settings. M1
- **R5.12** Offline: timer runs locally + syncs on reconnect; attendance uses Server-Validation conflict strategy. M1
- **R5.13 (perf)** Clock In/Out/Break MUST be one tap from the dashboard with optimistic confirmation (≤2 clicks, no full reload, instant UI feedback). M1
- **R5.14 (perf)** The attendance live timer MUST update at 60 FPS with zero main-thread jank and must NOT trigger re-renders of unrelated dashboard widgets. M1
- **R5.15 (perf)** Attendance lists/logs MUST stay responsive (virtualized, INP ≤200ms) as employee + daily-event rows grow into the tens of thousands. M1
- **R5.16 (perf)** HR/Admin "today's attendance" view MUST load in ≤200ms p95 server + render immediately from cache on revisit (stale-while-revalidate); filter changes update in place without reload. M1

## R6 — Leave & Approvals  (Phase 6)
- **R6.1** Approval framework (state machine: Submitted→Pending→Approved/Rejected) reused by tasks/projects. M1
- **R6.2** Employee leave request (choose dates, reason) → HR approves/rejects → status visible. `[E]` M1
- **R6.3** HR leave request (dates, reason) → Admin approves/rejects → status visible. `[H]` M1
- **R6.4** Leave history with status badges (Pending/Approved/Rejected). M1
- **R6.5** Admin approves/rejects HR leave requests; view leave history for all users. `[A]` M1
- **R6.6** HR approves/rejects employee leave requests. `[H]` M1
- **R6.7** Holiday calendar view (data managed in Phase 10). M1
- **R6.8** Approvals surface in bell + chat Notification Center. M1

## R7 — Projects & Tasks  (Phase 7)
- **R7.1** Project create/edit/archive/delete: name, description, priority, deadline, team. `[A][H]` M1
- **R7.2** Team assignment auto-grants project + task list + project-chat access. M1
- **R7.3** Project sort: created date / deadline / priority, asc/desc. M1
- **R7.4** Task create/assign (individual/team/company-wide); priority Low/Medium/High/Urgent; due date + reminders; scope Global/Department/Role. M1
- **R7.5** Task dependencies (B blocked-until-A-done). `[H][A]` M1
- **R7.6** Per-task comments; per-item activity log (created/assigned/progress/submitted/approved). M1
- **R7.7** Drag reorder tasks; Kanban (To Do/In Progress/Under Review/Done via dnd-kit) + list view; inline editing. M1
- **R7.8** QA form builder (HR/Admin) attached to project; employee fills QA + note on submission. M1
- **R7.9** Project work timer per project (start/pause/resume/end; logged per project). `[E]` M1
- **R7.10** Recurring tasks (daily/weekly-on-days/monthly-on-date) in advanced collapsed section; auto-recreate on completion; HR notified; toggle off. M1
- **R7.11** Quick Task Assignment widget wires up: dashboard → employee list → appears in their list → Global Chat auto-notified on completion. M1
- **R7.12** Task submit → HR/Admin review → approve / request redo → instant status. M1
- **R7.13** Project submit (completion report) → HR review → approve/redo; Admin sees all. M1
- **R7.14** Gantt/Timeline view (HR/Admin): horizontal bars + task-milestone diamonds. `[H][A]` M1
- **R7.15** Project history: team, tasks done, time spent, completion date, approval result. M1
- **R7.16** Employee: if permitted by HR, create own tasks inside project; update task progress. `[E]` M1
- **R7.17** Personal Task List (My Tasks): private to-do; HR/Admin can assign; employee can self-create. `[A][H][E]` M1
- **R7.18** Progress bars animate 0→value; pinned items; saved views / custom columns (TanStack Table). M1

## R8 — Chat & Notifications  (Phase 8)
- **R8.1** Global Chat (all users, company-wide). M1
- **R8.2** Project Chat (auto on project create; team-only; task alerts auto-posted). M1
- **R8.3** Direct Chat (1:1). M1
- **R8.4** Custom Group Chats (HR creates; employees see only added groups). M1
- **R8.5** @mentions (type @ → dropdown of chat members → notify w/ snippet). M1
- **R8.6** Read receipts in DMs; pin messages (HR in project chats). M1
- **R8.7** Read/unread: colored border + count badge; marked read on open. M1
- **R8.8** File/image sharing (image popup w/ limits); employees attach links/directory on task submission; full file upload deferred. M1
- **R8.9** Offline chat: "Not connected" + queue messages. M1
- **R8.10** Notification system: bell w/ unread count (high-priority + system-global only); history; mark-as-read. M1
- **R8.11** Notification Center (inside Chat): leave/task/project submissions, announcements, holiday reminders, feedback/complaints. M1
- **R8.12** Announcement board: Admin company-wide / HR team-level; pin; reactions only (no comments); dashboard display closeable; notify on post. M1
- **R8.13** Quick Notes (private sticky notes; pin to dashboard; sidebar/palette access). M1
- **R8.14** Employee complaint/feedback channel: private form on Profile → DM to HR/Admin + high-priority global notification. `[E]` M1
- **R8.15** Mobile chat: list-first, full-screen conversation, fixed bottom input above keyboard, back to list. M1

## R9 — Reports & Exports  (Phase 9)
- **R9.1** Attendance reports (date range/dept/individual). `[A]` M1
- **R9.2** Project completion reports. `[A]` M1
- **R9.3** Task completion statistics. `[A]` M1
- **R9.4** Employee productivity summary. `[A]` M1
- **R9.5** HR limited versions of the same reports. `[H]` M1
- **R9.6** Export as Excel (tables) and PDF. M1
- **R9.7** Weekly summary report auto-emailed to Admin every Sunday (scheduler). M1
- **R9.8** Saved report views; filters via shared bar; virtualized large datasets. M1

## R10 — System Settings & Audit  (Phase 10)
- **R10.1** Company profile (logo, name, timezone); standard working hours; holiday calendar. `[A]` M1
- **R10.2** Password policies (min length, expiry); session/device rules; notification preferences; configurable reminder times. `[A]` M1
- **R10.3** Audit log: every important action (who created/approved what, when); filterable; exportable. `[A]` M1
- **R10.4** Production monitoring: Sentry + Laravel Pulse wired. M1
- **R10.5** Performance audit vs targets (§19); Lighthouse + Core Web Vitals; M1 freeze-ready. M1

## R11 — Cross-Cutting System Requirements
- **R11.1** Standalone notification system for alerts/reminders; project/submission notifications under Chat. M1
- **R11.2** Search only where useful (no global search in M1); area-specific search in complex lists/reports. M1
- **R11.3** File attachments: no general upload in M1; profile-pic popup; HR project images popup; task submission as links/directory; chat file+image sharing; full file upload deferred. M1
- **R11.4** Status badges (Gray/Blue/Amber/Green/Red) consistent across tasks/projects/leave. M1
- **R11.5** Virtualization: employees, attendance logs, tasks, notifications, reports. M1
- **R11.6** Offline banner "You're offline…"; forms queue for submission on reconnect. M1
- **R11.7** Undo/redo; recently viewed; saved views; custom columns. M1
- **R11.8** Bulk actions + multi-select + right-click context menus. M1

## R13 — Performance & Operational Quality (cross-cutting, ALL phases)
> Mirrors `PERFORMANCE-STANDARDS.md` (P-* IDs). Every R13.x is testable and CI-enforced.

### Page-load & interactivity
- **R13.1** LCP ≤ 2.5s (p75 field) / ≤ 2.0s lab; FCP ≤ 1.8s; TTFB ≤ 600ms (web) / 800ms (api). (P-LCP/FCP/TTFB)
- **R13.2** INP ≤ 200ms (p75); CLS ≤ 0.1. (P-INP/CLS)
- **R13.3** In-app navigation to a cached route shows first frame ≤ 100ms; stale-while-revalidate (no spinner for cached data). (P-NAV/NAV-CACHE)

### API & database
- **R13.4** API p95 ≤ 200ms read / ≤ 300ms write (excluding network) at 10k rows; heavy reports queued/streamed. (P-API-P95/QUEUE)
- **R13.5** Zero N+1 queries; ≤ 5 SQL queries per list request regardless of row count. (P-NO-N1/Q-COUNT)
- **R13.6** Cursor pagination (not OFFSET); every filtered/joined/ordered column indexed. (P-CURSOR/INDEX)

### Frontend bundle & loading
- **R13.7** First-Load JS ≤ 200KB gz per route; route chunk ≤ 350KB gz. (P-BUNDLE)
- **R13.8** All in-app routes lazy-loaded; heavy libs (ECharts/Tiptap/dnd-kit/xlsx/Gantt/calendar) dynamically imported + idle-prefetched. (P-LAZY)
- **R13.9** All images via `next/image` (WebP/AVIF, responsive, lazy, blur); fonts self-hosted+subset+swap, ≤2 families, preloaded. (P-IMG/FONT)

### Caching & state
- **R13.10** Per-entity `staleTime`/`gcTime`; ETag/Cache-Control on safe GETs; backend route/config/OPcache + query cache for hot reference data. (P-CACHE-API/SRV)
- **R13.11** Zustand = UI only (slice selectors, no whole-store subscriptions); TanStack Query `select` for derived data; no API data in Zustand. (P-STATE)

### Rendering & components
- **R13.12** List rows memoized with stable keys; no anonymous callbacks in props for hot lists; React Profiler render-count tests on 1000-row tables. (P-RERENDER)
- **R13.13** Generic reusable components over one-offs; split static (memoized) vs reactive. (P-COMP)
- **R13.14** Lists > 100 rows virtualized (≤ visible+overscan DOM nodes, 60 FPS at 5000 rows). (P-VIRTUAL)

### Interaction responsiveness
- **R13.15** Search debounced 250ms server-side (client-side only ≤200 rows); filter changes update URL+cache, no reload. (P-SEARCH)
- **R13.16** Inputs respond ≤16ms; validation on 400ms pause; submit button disabled+loader (no double submit); autosave non-blocking. (P-FORM)
- **R13.17** Work >500ms offloaded to Laravel queues; frontend heavy work in web workers / chunked (no blocking task >50ms). (P-QUEUE/ASYNC-FS)

### UX states & resilience
- **R13.18** No full-screen spinner where a skeleton is possible; skeletons match content shape; partial/cached content shows immediately. (P-SKELETON)
- **R13.19** Safe mutations apply optimistically + roll back on error (pin, reorder, read-mark, status toggle, clock-in); destructive waits for confirm. (P-OPTIMISTIC)
- **R13.20** Idempotent GETs retry w/ backoff; mutations queued offline (retry ladder); offline banner; sync on reconnect. (P-RETRY)
- **R13.21** A failed widget/section MUST NOT block the page (per-widget error boundary); form errors preserve data; retry available. (P-RESILIENT)

### Responsive, accessible, operational
- **R13.22** Fluid 360→1920px; tables→cards on mobile; bottom nav ≤5; ≥48px touch targets. (P-RESP)
- **R13.23** WCAG 2.1 AA; full keyboard reachability; visible focus; Ctrl+K/N//Esc/Enter; axe-core clean in CI. (P-A11Y)
- **R13.24** Frequent workflows ≤2 clicks, no reloads, optimistic confirmation (clock in/out, approve leave, assign task, mark read). (P-DATAENTRY)
- **R13.25** Inter-module navigation preserves context (breadcrumbs/deep-links/recently-viewed); no redundant refetch of shared cached data. (P-CROSSMODULE)
- **R13.26** No unbounded client caches; listeners/subscriptions/workers cleaned on unmount; object URLs revoked; no retained detached nodes across a 20-screen nav. (P-MEM)

### Production & monitoring
- **R13.27** Tree-shaking/minification/vendor split/no prod sourcemaps; React prod build; pruned deps. (P-BUILD)
- **R13.28** Sentry (errors+perf) + web-vitals field collection + Laravel Pulse; p75 within targets 7 consecutive days before M1 freeze. (P-MON)
- **R13.29** CI performance budgets (bundle/Lighthouse/query/render counts) as guardrails; Lighthouse CI on PRs; breaches tracked in TRACKER with owner+plan. (P-REGRESS)

## R12 — Future Milestones (NOT in M1 — do not implement)
- Windows client (Tauri 2 + shared React SPA). M2
- Android (Kotlin + Jetpack Compose) + iOS/macOS/Linux. M3
- Full file attachment system. M2+
- Multi-language / i18n. defer
- AI product features. defer
