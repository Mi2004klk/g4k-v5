# Games4King — Frontend End-to-End Audit: Usability, Components, Layout, Functional Fit & Information Architecture (v6)

**Date:** 2026-08-28 · **Target:** `apps/web` (Next.js 16 App Router, React 19, Tailwind 4, `@g4k/ui`, TanStack Query, zustand, echarts, dnd-kit, frappe-gantt, react-grid-layout, cmdk, sonner) · **Roles covered:** Employee, HR, Super Admin
**Method:** ⚠️ DEGRADED: single-context — review sub-agents were dispatched twice and failed at the 5-hour usage limit both times; this audit ran inline. Evidence = complete source read of every route, store, hook, and component family + the Impeccable deterministic detector (26 findings, triaged, archived at `.impeccable/detect-frontend-audit.json`) + UI copy sampling (toasts, empty states, confirms, placeholders, action verbs). Visual judgments are code-inferred; re-run `$impeccable critique` on a dev server for pixel confirmation.
**This revision (v6)** is the complete end-to-end pass: **Parts 1–5** = usability (page-by-page, 26 workflows with friction scores, three roles, screen sizes, structured A–N findings); **Parts 6–9** = component-system audit (inventory with adoption metrics, consistency/duplicate/state/spacing/capability audits, form/button/table/modal/widget deep-dives, Component Upgrade Matrix, Canonical Component System, page composition, cross-workflow consistency, 9-phase component roadmap); **Parts 10–11** = layout/spacing/alignment/compactness audit; **Parts 12–13** = functional-fit audit (calendars, forms, inputs, dropdowns, identity, grouping, wiring + developer checklist); **Part 14** = information-architecture audit (zero-trust re-verified routes/nav/actions: duplicates, consolidation, contextual settings/actions, naming, entity workspaces, and the recommended architecture, A–T). All metrics and claims measured/verified from source.

**One-line verdict:** A genuinely capable workplace OS with strong design infrastructure, whose daily-use experience is undermined by an admin-surface lockout, one dead-end core workflow (HR approvals), placeholder-driven forms, 9–11px micro-type, and several features that *look* functional but silently aren't.

---

## Scores

### Audit Health (technical)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | **2** | 477 arbitrary `text-[Npx]` sizes (214×10px, 130×11px, 54×9px, down to 7px); 178 tiny+muted-gray combos; 77 small icon buttons vs 57 aria-labels app-wide |
| 2 | Performance (UX-facing) | **3** | Exemplary lazy-loading (echarts/gantt/kanban/QA builder); docked: duplicate 30-s polls, prefetch query-key drift, 77× `transition-all` |
| 3 | Responsive | **3** | Real mobile shell (bottom nav + FAB, chat fullscreen); docked: hover-only row actions, 425px dialogs on 360px phones, capped filter options |
| 4 | Theming | **3** | Real token system (semantic tiers, status colors, density, motion, dark mode); docked: 181 arbitrary px dimensions, 11 gray-on-color hits |
| 5 | Implementation integrity | **2** | Silent no-ops (clear-chat, drag-reorder), fake profile sections shipped, runtime-computed classes, dead 312-line components |
| | **Total** | **13/20** | **Acceptable — significant work needed** |

### Nielsen Heuristics

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Optimistic chat, skeletons, specific toasts — but reorder/clear-chat silently no-op; team board can lag; permanent false "Offline" pill |
| 2 | Match with real world | 3 | Good HR language; "identifier" jargon on login; "Gen2k Conglomerate (2018)" brand leak |
| 3 | User control & freedom | 2 | Drafts + cancel-pending-leave good; no undo anywhere; admins bounced off Settings with no exit |
| 4 | Consistency & standards | 2 | 8 dialog widths; 2 date-entry systems; ui Pagination adopted 0 times; mixed Create/Add/Request verbs; chat uses `window.confirm` |
| 5 | Error prevention | 3 | zod inline validation, drafts, overlap pre-check; docked: same-day-leave rule discovered only on submit, offline false-success toasts |
| 6 | Recognition over recall | 3 | Icon+label nav, palette+recents+saved views; placeholder-only selects, actions buried in row dropdowns, export requires remembering Export History |
| 7 | Flexibility & efficiency | 3 | Ctrl+K/B//N, bulk bar, presets, pins; admin palette link broken; no keyboard task ops |
| 8 | Aesthetic & minimalist | 2 | Badge-on-badge chips, 15 accents applied decoratively, bounce easing on dashboard chrome, everything-is-a-pill |
| 9 | Error recognition/recovery | 3 | Specific, human error copy ("Start date must be tomorrow or later") — docked: "Server error" / "Something went wrong!" ×16 boundary title, silent failures contradict messaging |
| 10 | Help & documentation | 1 | Shortcuts overlay only; zero contextual help for domain concepts (scope, QA, balances); first-run guidance ends at onboarding |
| | **Total** | **23/40** | **Acceptable — significant improvements needed** |

---

# Part 1 — Page-by-Page Usability Audit

Severity 0–4 (Nielsen scale) · Priority P0–P3. *"5-second test"* = can a first-time user say what the page is for within 5 seconds.

## 1.1 `/login`
**5-second test: PASS.** Identifier + password + Remember + submit; lockout countdown on 423; `returnTo` honored; offline sign-in blocked with clear copy.
- **[S3|P1]** Field labeled around the concept "identifier" — placeholder "Enter your identifier..." assumes users know email *or* username *or* employee ID all work. First-time employees with only an employee ID will hesitate. *Fix: helper text under the field listing the three accepted forms.*
- **[S2|P2]** Brand identity split: tooltip says "Gen2k Conglomerate (2018) • Milestone 1" while the footer says "Games4king Workplace OS" (`login/page.tsx:219-233`). Two company names on one screen erodes trust on day one.
- **[S1|P3]** Grainient WebGL background is attractive but heavy for a login screen; no reduced-motion guard on it (only duration vars are killed globally).
- **[S2|P2]** Auth errors are flat-form ("Wrong Username or Password") — correct, but gives no path ("Forgot password?" link placement relies on the user scrolling/scanning).

## 1.2 `/forgot-password` → `/reset-password`
**5-second test: PASS.** Honest "if the account exists" copy; correctly surfaces `email_not_configured` → "request goes to your administrator."
- **[S2|P2]** The admin-mediated fallback ("instructions sent to your administrator") leaves the user with no expectation of *when* — no "you'll be contacted" framing. *Fix: one sentence of expectation-setting when `email_not_configured` is true.*
- **[S1|P3]** Reset page builds its password schema dynamically from public config — good; strength meter present; token hidden field. Solid.

## 1.3 `/onboarding`
**5-second test: PASS.** Animated logo, name/ID/role/department summary, two optional fields (phone, emergency contact), single CTA.
- **[S1|P3]** Video autoplays (muted, looped, playsInline — correct) — fine.
- **[S2|P2]** The two optional fields have no explanation of *why* the company wants them ("used for HR emergencies and reminders") — optional fields without motivation get skipped, then HR chases data later.

## 1.4 `/role-select`
**5-second test: PASS.** Role cards with icons; single-role accounts auto-select.
- **[S3|P1]** Auto-select has **no failure state** — if `/auth/role-select` errors the user rides an infinite bouncing-dots loader (`role-select/page.tsx:51-60`). A network blip at exactly this screen locks the user out with zero feedback.
- **[S2|P2]** Cards describe the roles but not *what changes* ("As HR you'll see team attendance, approvals…"). First-time dual-role users choose blind.

## 1.5 `/change-password`
**5-second test: PASS.** Policy-driven schema, strength meter, skip button only when policy allows — exemplary conditional-logic UX.
- **[S1|P3]** After success, all other devices are signed out (security-correct) — a one-line "Other devices were signed out" toast would prevent confused IT tickets.

## 1.6 `/dashboard` (role-split)
**5-second test: PASS for all three variants.** Greeting + widgets; widget engine supports drag/resize/collapse/dismiss/restore with persisted layout.
- **[S3|P0]** Super Admin/HR: the **Pending Approvals widget** is the best approval UX in the product (inline Approve/Reject) — but the leave data feeding it can be stale (backend cache, `report.md` H-6), and HR arriving from nav links for more approvals hits the dead end documented in 1.8.
- **[S2|P2]** Employee: "My Submissions" shows top 3 with statuses — good; but no link "view all" into the tasks list filtered to submitted — the natural next action is missing.
- **[S2|P2]** Widgets are individually dismissible and restorable, but there is no "reset layout" — a user who drags widgets into a mess has no clean escape (user control).
- **[S2|P2]** Greeting subtitle is user-seeded clever copy; fine on day 1, potentially noise on day 200 — no setting to disable.
- **[S3|P1]** Time Clock widget overtime highlight uses `standardSeconds` defaulting to 31,500s (8h45m) with a "Default to 8 hours" comment (`timer-store.ts:47`) — employees whose schedule differs see wrong overtime emphasis until server data loads; mislabels for everyone on the default.

## 1.7 `/dashboard/attendance` (personal; Employee + HR)
**5-second test: PASS.** Time Clock front and center; Today Summary; Recent Shift Log.
- **[S4|P0]** **Dynamic Tailwind class bug** (`attendance/page.tsx:164`): `bg-${dayStatusColor(...)}-500` produces classes Tailwind never compiled — several status dots render *uncolored*, and the dot is the only status signal (color-only, WCAG 1.4.1). A first-time user cannot learn the calendar language because part of it is invisible.
- **[S2|P2]** "Attendance & Time" nav label, but the page's second tab is *My Leave* — naming says time, content includes leave. Employees looking for "leave" scan past this item. *Fix: rename nav item "Attendance & Leave."*
- **[S2|P2]** Recent Shift Log shows 7 of 365 days; "View Full Calendar" exists — good — but the 7-day window silently truncates (no "showing last 7 days" caption).
- **[S1|P3]** An unreachable `holidays` TabsContent exists with no trigger (`leave-tab.tsx:132-137`) — dead code that can confuse future maintainers, invisible to users.
- **[S2|P2]** Request Leave form: balances inline beside each type and exhausted types disabled — excellent recognition-over-recall. Same-day rule surfaces only on submit as an error toast; the date picker allows selecting today. *Fix: block today in the picker + inline hint.*

## 1.8 `/dashboard/org/attendance` (HR + Super Admin)
**5-second test: PARTIAL.**
- **[S4|P0]** **HR dead end:** deep links/redirects send HR to `?tab=leave&sub=approvals`; `hr-attendance-view.tsx:14` implements only `today` and `graph` → blank content. HR's *primary daily job* (approvals) has no home on this page. Super Admin's five-tab variant is complete.
- **[S2|P2]** Super Admin variant: Calendar / Overview / Analytics / Live Shifts / Leave & Holidays — clear tab grammar. Overview table has date range, dept/user/status filters, search, export, correction entry, and a `?correction=true` hint toast — dense but logical. Column alignment for numeric cells (worked/overtime hours) is not right-aligned consistently — slower scanning for the one audience that reads numbers all day.
- **[S3|P1]** **Attendance correction is buried 4 layers deep** (row → member sheet → correction dialog → action+time+reason) for one of HR's most frequent fixes (missed punch). *Fix: "Correct" directly in the row action menu.*
- **[S2|P2]** HR "Today's Status" board can be up to 1h stale after punches (backend `teamToday` cache key mismatch, `report.md` H-6) — the screen whose entire purpose is *now* lies about now. No "last updated" timestamp shown (which would at least make staleness visible).

## 1.9 `/dashboard/projects` (+ My Tasks & Board)
**5-second test: PASS.** Two tabs with live counts; status pills, search, sort, grid/list, export.
- **[S2|P2]** Create Project dialog is a single-step mega-form (name, description, priority, department, deadline, members multi-select, QA form, phases builder, cover upload) with no grouping or step structure — no helper text anywhere in the app's forms (0 helper-text patterns found repo-wide). First-time managers face 9 fields with no indication of what's optional. *Fix: section the dialog (Basics / Team / Advanced) or mark optional fields.*
- **[S3|P1]** Members multi-select preloads up to 1,000 users (`per_page=1000`) — fine at 13 users, wrong at 2,000; beyond the cap people silently vanish from assignment. Typeahead search needed.
- **[S2|P2]** Super Admin sees department-grouped sections; other managers see a flat grid — two mental models for the same screen with no way to toggle.
- **[S1|P3]** Inline rename on cards is a nice power feature; discoverable only by accident (no pencil affordance).

## 1.10 `/dashboard/projects/[id]`
**5-second test: PASS.** Cover header with status/priority/deadline; "Project Journey" phases; summary bar; team sidebar; virtualized activity; task deep-links (`?highlight=`).
- **[S3|P1]** **Edit dialog is a stub** — `editForm` captures department/QA/members/cover/`allow_employee_tasks` but renders only name+description (`projects/[id]/page.tsx:33,409-419`, in-code "keeping it simple" comment). Managers cannot change the team from the UI after creation — they must delete and recreate. Create offers 9 fields; edit offers 2. Users read this as broken.
- **[S2|P2]** Phase completion does not require phase tasks done (by design per backend) — the UI doesn't warn when completing a phase with open tasks; managers are surprised later.
- **[S1|P3]** Delete Project is in a settings dropdown next to Edit — destructive action adjacent to routine edit; ConfirmDialog protects it, but placement invites slips.

## 1.11 Tasks area (Board / List / Timeline / QA tabs + Task Detail Sheet)
**5-second test: PASS.** Filters (presets, status, assignee, scope, due range, group-by) + view modes with count badges.
- **[S4|P0]** **Drag-reorder silently does nothing.** The board accepts drags, the API answers "Tasks reordered successfully," but `order` isn't mass-assignable backend-side (`report.md` H-3) — reload restores old order. Users repeat the drag 3×, conclude the app is broken. Worst-in-class feedback failure because the UI *actively lies*.
- **[S3|P1]** Moving cards to Review/Done is correctly blocked with a teaching toast ("This task requires QA verification and cannot be dragged to this column") — good — but the toast doesn't link to the required action. *Fix: toast action button → opens the submit flow.*
- **[S2|P2]** Non-list views hard-cap at 100 tasks with an amber notice — honest, but a Gantt that silently drops task 101 changes schedule decisions; the notice is easy to miss.
- **[S2|P2]** Create Task dialog is the app's best form: sensible defaults (self-assign for employees), collapsed Advanced section (scope, QA, blocked-by, recurrence), draft persistence, per-field server errors. Assignee select is placeholder-driven ("Select Assignee") like all selects — see D-section.
- **[S2|P2]** Task Detail Sheet (Overview/Comments/Time logs/Activity) — excellent information architecture; pin affordance; edit mode for managers. Time logs tab is read-only with no "log time here" action even though the API allows manual entry — a missed convenience.
- **[S1|P3]** `/dashboard/tasks/[id]` full page exists for deep links with a proper not-found state — good.

## 1.12 `/dashboard/chat` (Chat / Announcements & Reminders / Notifications)
**5-second test: PASS.** Two-pane chat, scope pills, unread badges, pinned-first ordering.
- **[S3|P1]** **Clear Chat does nothing visible** — writes `cleared_at` the backend never loads (`report.md` H-2). Users clear, nothing changes, trust drops. Uses `window.confirm` — the only module that does.
- **[S2|P2]** Search requires ≥3 characters before any feedback appears — no hint that the box is character-gated until you cross it; empty-search state is silent.
- **[S2|P2]** Scope pills (All/Direct/Groups/Channels) are plain buttons without `aria-pressed` — screen readers hear five unlabeled toggles; sighted users get no selected-state difference beyond color.
- **[S1|P3]** Message pinning exists only for project conversations with `chat.manage` — correctly gated, but there's no affordance explaining *why* pin is absent elsewhere (silent feature boundary).
- **[S2|P2]** Announcements board: react/dismiss are one-click and obvious; posting UI (HR/admin) includes scope/priority/attachment — priority semantics (does High notify?) are invisible to the poster. Notification behavior should be stated at the control ("Urgent notifies everyone immediately").
- **[S2|P2]** Personal Reminders widget lives in the *Announcements* tab — the most private feature is filed under the most public one. Discoverability near zero for employees who never open this tab.
- **[S1|P3]** Notifications tab: filters/search/mark-read all present and consistent with the bell — good.

## 1.13 `/dashboard/directory` (4 tabs) + `/dashboard/directory/[id]`
**5-second test: PASS.** Corporate Directory / Employee Management / Departments / Designations.
- **[S2|P2]** Directory respects privacy (public/private contact, "Contact hidden" fallback) — good. Grid/list toggle's list button is labeled "View" (`directory-list.tsx:517-521`) — reads backwards.
- **[S2|P2]** Employee Management: row menu (Edit/Reset Password/Activate/Deactivate/Delete/Restore) + bulk bar + filters incl. trashed — the app's most complete table. Temp password delivery is a toast the admin must transcribe by hand (copy button absent) when SMTP is off — error-prone handoff of a credential.
- **[S2|P2]** Departments: archive blocked while members exist — the error explains, but the UI doesn't *pre-check* (disable Archive with a tooltip "3 members assigned" before the click, not after).
- **[S1|P3]** Employee 360: tab set correctly varies by viewer permission; activity tab's empty-check bug treats `undefined` as non-empty (`directory/[id]/page.tsx:174`).

## 1.14 `/dashboard/reports`
**5-second test: PASS** (when reachable). Five summary report types + saved views + async export; General Data Exports builder with 25-row preview.
- **[S4|P0]** **Currently unreachable for everyone** — middleware capability-cookie mismatch bounces all roles to `/dashboard?error=unauthorized` (`middleware.ts:47` vs `lib/auth-store.ts:94`). The nav *shows* Reports & Analytics to HR/admins; clicking it produces an error toast. A visible feature that rejects you is worse than a hidden one.
- **[S2|P2]** Export flow is async with notification — good — but completion doesn't offer download where the user is; they must recall Export History's location (working-memory bridge). *Fix: action button inside the completion toast.*
- **[S1|P3]** Preview cap (25 rows) is disclosed; fine.

## 1.15 `/dashboard/audit`
**5-second test: PASS.** System Events / Login History with filters and CSV export; subject-type deep links (User→directory, Project→detail).
- **[S2|P2]** User filter options capped at 100 (`per_page=100`, `audit-log-table.tsx:45`) — in a 300-person company the auditor cannot filter by most people. Silently wrong filter options in an *investigation tool*.
- **[S1|P3]** Suspicious-flag styling exists; good.

## 1.16 `/dashboard/settings` (11 tabs)
**5-second test: PASS** (when reachable). Tab labels are plain-language and well-chosen (Company Profile, Work Schedules, Policies, Holidays, Mail/SMTP, Notifications, Auto-Numbering, Reminders, Security Requests, Demo Data, System Jobs).
- **[S4|P0]** **Blocked for all roles by the cookie bug** — the entire admin surface is theoretical until A-1 is fixed.
- **[S2|P2]** Unauthorized users (if reached) get an empty shell, not an empty state (`settings-tabs.tsx:127-146`).
- **[S3|P1]** Work Schedules: editing the default schedule silently clears its default flag (backend, `report.md` H-11) — an admin edits times, saves, and the org has no default schedule; nothing in the UI warns. Save also "succeeds" for nonexistent rows.
- **[S2|P2]** Demo Data tab is a properly frightening danger zone (typed confirmation) — good; but its blast radius (deletes *all* seeded users incl. the only admin, and every avatar — `report.md` C-9) is not stated. The confirmation text should say what will actually die.
- **[S1|P3]** Mail test-send is one click with clear error propagation — good.

## 1.17 `/dashboard/profile` (7 sections)
**5-second test: PARTIAL** — sections are clear; three of them are fiction.
- **[S3|P1]** Placeholder sections shipped as real UI: fake "YouTube Team / g4kkarthik@gmail.com" connected account (`profile-connected-accounts.tsx:28-34`); hardcoded "YouTube Office, Chennai, India" work address with dead Edit and a "Not Verified" badge (`profile-work-address.tsx:50-53`); static Privacy selects that save nothing (`profile-privacy.tsx:24-52`). Users will tap dead controls and assume the app is unfinished — because in these places, it is.
- **[S2|P2]** Security & Devices (change password, session list, revoke) is genuinely good — buried two levels deep. Multi-role users' *only* role switcher is here.
- **[S1|P3]** Scroll-spy left nav is pleasant; notification preferences persist properly.

## 1.18 Global shell (nav, header, palette, mobile, errors)
- **[S4|P0]** `/dashboard/settings|audit|reports|admin/*` — middleware lockout (see 1.14/1.16); `/dashboard/admin` additionally has **no page** (guarded 404).
- **[S3|P1]** Command palette "Admin Settings" → `/dashboard/profile?tab=settings` (`command-palette.tsx:230-233`) — profile has no tabs; the flagship power feature dead-ends its admin users.
- **[S2|P2]** Two similarly-named nav items — "Attendance & Time" (personal) vs "Attendance" (org) — both visible to HR. Users learn the difference only by being wrong once.
- **[S2|P2]** ConnectionStatus conflates "no realtime configured" with "offline" — permanent amber pill on healthy polling deployments (`connection-status.tsx:7`).
- **[S1|P3]** Mobile bottom nav (Dashboard/Projects/FAB→attendance/Chat/Profile) is genuinely good; lacks `aria-current`.
- **[S1|P3]** Per-segment error boundaries with Retry/Sign-out, loading.tsx everywhere, page-in animation on route change (motion on Operate navigation — taste; see B-8 legacy).

---

# Part 2 — Workflow-by-Workflow Audit

Legend: **Class** = Excellent / Good / Acceptable / Friction-heavy / Poor / Blocking. Clicks exclude typing. "SA"=Super Admin.

### W1. Login → first dashboard — **Good**
Start: `/login` → enter identifier+password (+Remember) → submit → redirect chain (change-password? → onboarding? → role-select? → dashboard). Steps 3–4 clicks + 2 fields. Feedback: inline errors, 423 countdown. Issues: "identifier" jargon (1.1); role-select infinite-loader failure mode (1.4).

### W2. Clock in → break → clock out — **Excellent**
Dashboard widget or mobile FAB → **Start Shift** (1 click) → **Pause**/**Resume** (1 click each) → **End Shift** + confirm (2 clicks). Immediate state change, cross-tab sync, offline-safe with de-dup, overnight "Continue Shift" recovery exists. Issues: overtime emphasis can be wrong pre-sync (1.6).

### W3. Request leave — **Good**
Attendance → My Leave → type (balance shown) → dates → reason → **Request Leave** (≈4 fields, 7 clicks) → toast + history row appears. Drafts auto-saved; overlap pre-checked optimistically. Issues: same-day rule met only at submit (1.7); no same-day sick path at all (policy gap surfaced in `report.md` M-18).

### W4. Cancel pending leave — **Good.** History → Cancel → ConfirmDialog. 2 clicks + confirm.

### W5. Approve/reject leave — **HR: Blocking via navigation / widget-only Good; SA: Good**
- HR dashboard widget: inline Approve/Reject — 2 clicks, best-in-app.
- HR via nav/deep links: dead-end blank tab (1.8) — the fallback path is broken.
- SA: Org Attendance → Leave & Holidays → Approvals → row buttons. 3 nav + 1.
- Reject requires no reason (approve/reject symmetric) — but a rejection without reason teaches the employee nothing; backend doesn't ask. *Fix: optional-but-prompted reason on reject.*

### W6. Correct a missed punch — **Friction-heavy**
Org Attendance → Today/Overview → row → member sheet → Correct → choose action (add/edit/remove) + event type + time + reason → save. ≈8 clicks, 4 layers deep, for HR's most frequent fix (1.8). Recoverable, audited, employee notified — correct but slow.

### W7. Create project — **Acceptable (first-time Friction-heavy)**
Projects → **Create Project** → 9-field single-step dialog → create → members notified, channel created. Issues: no optional-field marking, no grouping (1.9); member preload cap.

### W8. Submit project for review — **Good.** Project → **Submit for Review** → QA answers (if attached) → submit → status In Review + admin notified. All-tasks-done gate explains itself on violation.

### W9. Review project (approve/redo) — **Good.** Dashboard widget or project page → decision (+note). Self-submission blocked with clear copy.

### W10. Create task — **Good.** Tasks tab → **Create New Task** → defaults correct (self-assign for employees; employees see only `allow_employee_tasks` projects with disabled-tooltip explaining why) → Advanced (scope/QA/blocked-by/recurrence) collapsed → create → assignees notified. Draft persistence. Best form in the app.

### W11. Submit task for review — **Good.** Task sheet → **Submit for Review** → note (+QA form validation with per-field errors) → submit → status Review, managers notified, project channel post. Blocked-task messaging names the blocker.

### W12. Approve / redo task — **Good.** Widget or sheet → **Approve** (1 click) or **Redo** → reason required (enforced client+server with a specific toast: "Reason is required for rejection."). Recurrence spawns next occurrence silently — a toast saying "Next occurrence created (due …)" would close the loop.

### W13. Reorder board — **Poor (silent failure).** Drag → success toast → reload loses order (1.11). Trust-destroying; backend fix required (`report.md` H-3).

### W14. Move task to a phase — **Blocking.** The control routes to a nonexistent endpoint (`report.md` C-7) → 500. UI must stop calling it or backend must implement.

### W15. Start a DM — **Good.** Chat search (≥3 chars) → click person → type → enter; or Directory card → Message. 2–3 actions. Optimistic bubbles + read receipts.

### W16. Create group chat (HR/SA) — **Good.** Chat → **New Chat** → name + member picker → create.

### W17. Post an announcement — **Good.** Board compose → scope (team/company; HR team-only) → priority → attachment → post. Priority's notification consequences unstated at the control (1.12).

### W18. Triage notifications — **Good.** Bell dropdown (30-s poll) or full tab with type filter/search; click-through routes; mark read/unread/all. 30-day retention disclosed only in the manual — the UI never says notifications expire.

### W19. Run a report export — **Friction-heavy**
Reports → type → date/dept filters → **Export** → async toast → wait → notification → *navigate to* Reports → General Data Exports → Export History → find row → download. ≈9 steps across two pages with a waiting gap and a memory bridge. *Fix: download action inside the completion toast; auto-select the row in history.*

### W20. Manage an employee (create → handoff) — **Acceptable**
Directory → Employee Mgmt → **Create New Employee** → ~10 fields (dept cascades to teams — good) → create → temp password via email **or toast-transcribe** (no copy button). Edit/reset/deactivate/delete/restore all in row menu with confirms. Role chips legible. Issues: password handoff (1.13); trashed-user restore discoverable only via status filter=Trashed.

### W21. Change own password — **Good.** Profile → Security → 3 fields → save (policy meter) → other sessions signed out (undisclosed — 1.5).

### W22. Revoke a session — **Good** (buried). Profile → Security → session list (device/IP/last-used) → Revoke.

### W23. Switch active role (multi-role) — **Good** (buried). Profile → Workspace → role switch; instant re-issue. Only location in the app.

### W24. Offline punch + reconnect sync — **Excellent.** Punches queue with original timestamps, replay de-duplicated, "offline sync complete" toast + auto-refresh of attendance/dashboards.

### W25. Send feedback — **Acceptable** (buried). Profile → Preferences & Support → form → lands in HR's chat as DM + high-priority notification. Works; nobody will find it.

### W26. Pins / Quick Notes / Personal Reminders — **Good** individually; **Poor discoverability** as a set (pins sidebar-bottom, notes on dashboard, reminders hidden in the Announcements tab — three homes for "personal stuff").

---

# Part 3 — Three-Role Usability Audit

### Employee
**Sees:** Dashboard, Attendance & Time, Projects & Tasks, Communications, Directory, My Profile (+ mobile FAB).
**Jobs:** clock, request leave, work tasks, chat, find people.
- **Works well:** self-service loop is coherent end-to-end; task create defaults to self; project restrictions explained via disabled-tooltip; directory privacy respected.
- **Hidden/confusing:** "My Tasks & Board" tab label (singular owner unclear); scope filter meaningless for employees (they see own tasks only) — filter noise; personal reminders hidden under Announcements tab (W26); notifications expire silently (W18).
- **Incorrectly exposed:** none material. QA tab correctly hidden (`qa.view`).

### HR
**Sees:** Employee's set + Organization Attendance + Reports & Analytics; Directory gains Employee Management/Departments/Designations; chat gains group creation; announcements gains team posting.
**Jobs:** approvals, attendance corrections, team monitoring, employee lifecycle, comms.
- **Works well:** dashboard widget approvals; employee management table; exceptions feed; today's board (when fresh).
- **Broken/confusing:** leave approvals nav dead-end (1.8) — the defining HR workflow; Reports/Settings blocked by cookie (1.14/1.16) though nav shows Reports; "Attendance" vs "Attendance & Time" ambiguity; board staleness invisible (no last-updated stamp); correction depth (W6).
- **Incorrectly exposed:** none via UI; backend over-exposes (timer logs, leave history company-wide — `report.md` H-5) but the UI doesn't advertise it.

### Super Admin
**Sees:** everything; nav *hides* "Attendance & Time" (self-service caps excluded from wildcard in nav filter `lib/capabilities.ts:48-58`).
**Jobs:** full governance + settings.
- **Broken:** Settings/Audit/Reports/admin routes locked out by cookie (1.14/1.16/1.18) — **the admin cannot administer**; palette admin link dead (1.18); Demo purge blast radius unstated (1.16).
- **Inconsistent:** backend `*` wildcard would allow SA to clock own attendance, but the UI hides the personal attendance page and mobile FAB for `super_admin` — an admin who *is* also a worker can't clock in without a second (employee/HR) role. Decide: either grant the surface or document the exclusion.
- **Works well:** org attendance 5-tab suite; audit with deep links; pending-approvals widget covering leave+tasks+projects in one queue.

---

# Part 4 — Screen-Size Comfort Audit

| Size | Verdict | Notable findings |
|---|---|---|
| **360 (small phone)** | Uncomfortable | Dialogs at 425–500px exceed viewport (no `<sm` fullscreen-sheet fallback); `text-[9–11px]` at phone density is illegible; bottom nav 4+FAB is tight but OK; admin tables survive only via horizontal scroll — fine for scanning, poor for correcting (W6 depth worse here). |
| **390–430 (large phone)** | Acceptable | Chat is the best mobile surface (fullscreen, `visualViewport` keyboard handling, swipe actions); hover-revealed row actions invisible → touch users lose table shortcuts; 24–32px icon buttons under target size. |
| **768 (tablet portrait)** | Acceptable | Sidebar returns (icon rail); tasks toolbar correctly reflows (`flex-col lg:flex-row`, `tasks-tab.tsx:664`); kanban becomes horizontal column scroll; settings TabsList wraps — longest tabs (Auto-Numbering, Security Requests) wrap to two ragged lines. |
| **1024–1200 (small laptop)** | Good | Full nav; dashboard grid 2–3 cols; Gantt usable; filter bars inline. The `text-[10px]` metadata worst at this size — the primary work device for HR sees the smallest text. |
| **1440 (desktop)** | Good | Content capped at `max-w-[1440px]` (`layout.tsx:467`) — deliberate, keeps density; widget grid full. |
| **1920+** | Good | Cap yields wide margins instead of stretched cards — the right call. |
| **2560 (ultrawide)** | Good | Same cap; sidebar fixed; no runaway whitespace grids. |

**Cross-size defects:** dialogs never become sheets on phones (biggest gap); hover-dependent actions on every table; dropdown/popover edge positioning untested on narrow viewports (no `collisionPadding` usage found); `pb-safe` used on bottom nav but not consistently on floating bulk bar (overlaps FAB at z-50/z-40).

---

# Part 5 — Structured Findings (A–N)

> Full block format for A/B (worst offenders); compact format (Where · Impact · Expected · Fix · S0–4 · P0–3) for C–K.

## A. Critical Usability Problems

**A-1. Admin surface unreachable for every role (incl. Super Admin)**
- **Where:** `src/middleware.ts:47` reads `g4k_capabilities`; only `g4k_capabilities_{userId}` is ever written (`lib/auth-store.ts:94`). Affects `/dashboard/settings`, `/audit`, `/reports`, `/admin/*`.
- **User impact:** Nav and avatar menu show the items; clicking produces "You don't have access to that section." An admin cannot open Settings, Audit, or Reports at all. Feels like a personal failure ("am I not the admin?").
- **Why:** Cookie name mismatch between writer and reader; capabilities always parse to `[]`.
- **Expected:** Role-gated pages open for entitled roles.
- **Fix:** Single cookie name owned by `auth-store.ts` (or prefix-scan `g4k_capabilities_*` in middleware) + E2E smoke that super_admin opens Settings.
- **Severity 4 · P0**

**A-2. HR leave-approvals dead end**
- **Where:** Redirects/deep links → `/dashboard/org/attendance?tab=leave&sub=approvals`; `hr-attendance-view.tsx:14` has no such tab → blank content. Pure approvers (no team-attendance cap) get Access-Denied instead.
- **User impact:** HR's defining workflow has no navigable home; only the dashboard widget works.
- **Expected:** HR org view has an Approvals tab; approvals surface gated on `leave.approve-employee`.
- **Fix:** Add the tab (or route HR to the shared approvals component); fix all dead `?tab=leave` links.
- **Severity 4 · P0**

**A-3. Silent no-op interactions (UI lies about success)**
- **Where:** Clear Chat (pivot never loaded — `report.md` H-2); board drag-reorder (`order` not fillable — H-3); message pin broadcasts nothing to other clients.
- **User impact:** Users repeat actions, lose trust, file "app is broken" tickets; work "organizing" is lost on reload.
- **Expected:** Actions persist or honestly fail.
- **Fix:** Backend trio (pivot withPivot, fillable `order`, pin broadcast); UI adds a persistence indicator on drag.
- **Severity 4 · P0**

**A-4. Micro-typography pandemic (legibility failure at scale)**
- **Where:** 477 arbitrary `text-[Npx]` — 214×10px, 130×11px, 54×9px, 7–8px outliers — 178 combined with muted grays; concentrated in table metadata, chips, timestamps (the content dense-screen users actually read).
- **User impact:** Squinting at 1024px laptops; unreadable for aging eyes; zoom-assist users get broken layouts; fails practical WCAG 1.4.3/1.4.4.
- **Expected:** A type scale with a 12px content floor.
- **Fix:** Token scale (`--text-2xs:11px` decorative max, `--text-xs:12px` floor), codemod sweep, ESLint `react/forbid` on arbitrary text sizes.
- **Severity 4 · P0**

**A-5. Uncolored status dots (runtime-computed classes)**
- **Where:** `attendance/page.tsx:164` `bg-${dayStatusColor(...)}-500`.
- **User impact:** Calendar/day dots — the sole status signal — render colorless for some statuses; users can't learn the color language; WCAG 1.4.1 (color-only, sometimes absent entirely).
- **Expected:** Static class map + text/icon pairing.
- **Fix:** `{present:'bg-success-500',…}` map; add status letters/tooltip.
- **Severity 3 · P1** (P0 within attendance module)

**A-6. Placeholder/fictional profile sections shipped**
- **Where:** `profile-connected-accounts.tsx:28-34` (fake YouTube account), `profile-work-address.tsx:50-53` (dead Edit, "Not Verified"), `profile-privacy.tsx:24-52` (static selects).
- **User impact:** Dead controls teach users the app is unfinished; a client finds these in minutes.
- **Expected:** Only real, wired sections.
- **Fix:** Delete all three (or feature-flag).
- **Severity 3 · P1**

**A-7. Offline queue reports false success**
- **Where:** Queued mutations return `{queued:true}`; handlers still toast success (`leave-tab.tsx:59-62`, department ops); `/auth/logout` itself is queueable (`api-client.ts:82-87`).
- **User impact:** Believes a cancel/delete happened; it hasn't. Logout can replay post-session.
- **Expected:** "Queued — will sync when online" truthfulness.
- **Fix:** `isQueued()` guard in every mutation's `onSuccess`; exclude auth endpoints.
- **Severity 3 · P1**

## B. High-Friction Workflows (see Part 2 traces)
- **B-1** HR attendance correction depth (W6) — 4 layers, ≈8 clicks for the most frequent HR fix · **S3/P1**. Row-menu "Correct" entry.
- **B-2** Export download memory bridge (W19) — completion toast lacks a download action; user must relocate Export History · **S2/P2**. Action button in toast.
- **B-3** Project edit stub (W7/1.10) — 9-field create vs 2-field edit; no member/department changes post-create · **S3/P1**. Reuse create form prefilled.
- **B-4** Report/board caps — filters capped at 100 options, boards/Gantt at 100 tasks, people pickers at 1,000, shift log 7/365 — all silent truncations except the task-view notice · **S3/P1**. Typeahead pickers + cursor pagination + "showing N" captions.
- **B-5** Temp-password handoff via transcribable toast (W20) · **S2/P2**. Copy button + explicit "share securely" copy.
- **B-6** Stale "Today's Status" with no last-updated stamp (1.8) · **S3/P1** (backend-driven; UI must disclose).
- **B-7** "Remember me" decorative — every request rewrites a 7-day `g4k_token` (`api-client.ts:213-215`, `providers.tsx:126-138`) · **S2/P2** (security-expectation friction).

## C. Navigation & Findability
- Command palette "Admin Settings" → profile non-tab (`command-palette.tsx:230`) · users can't reach settings from the flagship shortcut · fix link · S3/P1.
- `/dashboard/admin` guarded 404 (no page) · protected nothing · remove middleware entry or add page · S2/P2.
- "Attendance & Time" vs "Attendance" ambiguous labels (HR sees both) · rename org item "Team Attendance" · S2/P2.
- Personal Reminders buried in Announcements tab (W26) · move to bell/profile or dashboard widget · S2/P2.
- Feedback form buried in Profile (W25) · add to avatar menu · S1/P3.
- Role switcher single location (W23) · surface in avatar menu for multi-role users · S1/P3.
- Dead nav branches: `adminOnly` filter unused; `org/attendance?tab=leave` prefetch target doesn't exist for HR · cleanup · S1/P3.
- Deep links: task `?highlight=` scroll+ring is excellent — keep as the pattern for all detail links.

## D. Forms & Data Entry
- **Placeholder-only selects** ("Priority", "Select Assignee", "Select visibility") — once a value is chosen the field's *purpose* is only the value; labels absent · add persistent labels · S3/P1.
- Only 25 `<Label>`/`<FormLabel>` usages repo-wide vs dozens of forms · most fields are placeholder-labeled (a11y + recall) · adopt shadcn `Form*` (exists, used in 5 files) everywhere · S3/P1.
- Zero helper-text patterns found · domain concepts (QA form, scope, blocked-by, recurrence, priority consequences) unexplained at the point of decision · one-line hints on advanced fields · S2/P2.
- Same-day leave rule discoverable only at submit (W3) · constrain picker + inline policy hint · S2/P2.
- Mixed verb grammar: Create New Task / Create New Employee / Add Event / Add Holiday or Event / Request Leave / Save / Save Changes · standardize glossary (Create for records, Add for children, Save for edits) · S2/P2.
- Date entry split: ui DatePicker (10 files) vs native `type="date"` (4) · unify on DatePicker · S2/P2.
- Dialog width anarchy: 425/500/800/md/2xl/3xl/4xl ×8 values · `size` prop on Dialog primitive · S2/P2.
- `window.confirm` ×5 in chat vs ConfirmDialog elsewhere · ban + migrate · S2/P2.
- Good: drafts (leave/task/user/project/group/announcement), per-field server errors on task form, dept→team cascade, disabled-with-reason project picker for employees — preserve all.

## E. Information Architecture
- Settings 11 tabs well-named — good; consider grouping (Identity: Company/Numbering · Operations: Schedules/Holidays/Reminders · Platform: Mail/Notifications/Jobs/Security/Demo).
- "Communications" hosting personal reminders misfiles the private under the public · S2/P2.
- Employee 360 tab adaptivity by permission is correct and legible — good.
- Reports: two tabs (summaries vs raw builder) is a sound split; "Saved views" only on summaries — extend to builder · S2/P2.

## F. Responsive Usability
- Dialogs never degrade to fullscreen sheets <640 · biggest single responsive gap · S3/P1.
- Hover-only row/table actions on `(hover:none)` devices · always-visible or `⋯` menu · S3/P1.
- Settings TabsList wraps raggedly at 768 (two long labels) · condensed labels or scrollable TabsList · S2/P2.
- Bulk bar (z-50) overlaps mobile FAB (z-40) · raise FAB/offset bar · S2/P2.
- Kanban horizontal scroll works; Gantt on phone is decorative (consider hiding <480 with "open on larger screen" honesty note) · S2/P2.
- Full strategy table (breakpoints 380/640/768/1024/1280/1536 + per-category behavior) from v1 remains the target state — see repo history or Part 4 above.

## G. Accessibility & Interaction
- Unlabeled small icon buttons: 77 `h-6/7/8` targets vs 57 aria-labels app-wide · `sr-only` labels + ≥40px hit areas · S3/P1 (WCAG 4.1.2, 2.5.5).
- Keyframe animations bypass reduced-motion: global override kills only `--duration-*`; `animate-bounce` ×27, `animate-spin` ×63, `ping` ×2 still run (only RainbowBorder carries `motion-reduce:`) · wrap in `motion-safe:` · S3/P1 (WCAG 2.3.3).
- h1 missing on 21/27 pages · one h1 per page, widget titles as h3 · S2/P2 (1.3.1).
- Chat scope pills + bell tabs: no `aria-pressed`/tablist semantics · S2/P2 (4.1.2).
- Bottom nav lacks `aria-current="page"` · S1/P3 (2.4.8).
- Color-only status (dots, priority pills) sometimes colorless (A-5) · pair with text/shape · S3/P1 (1.4.1).
- Gray-on-color chips ×11 (detector: `notifications-bell.tsx:250`, `leave-request-form.tsx:281`, `create-task-dialog.tsx:187`, `announcement-board.tsx:215`, `quick-notes.tsx:159`) · darker-tone-on-tint rule · S2/P2 (1.4.3).
- Positive: global `*:focus-visible` outline, Radix focus traps/Esc, cmdk keyboard-first, muted+playsInline onboarding video, axe-core in dev.

## H. Consistency
- Pagination: ui `Pagination` has **zero direct** call sites, but it *is* wired inside `DataTable` (used ×5 files); projects, directory, and hand-rolled tables still paginate three different ways · consolidate on DataTable+Pagination (see 6.7) · S3/P1.
- Toast verbs asymmetric (137 error / 117 success / 9 info; no `toast.promise`) · S2/P2.
- Confirm copy varies ("Are you sure you want to delete/remove…") · glossary pass · S1/P3.
- Status pills re-derived per module (root cause of A-5 class) · single `StatusBadge` map · S3/P1.
- Loading patterns mixed per module (skeleton/skeleton/spinner) though primitives exist · standardize: page=skeleton, action=button-spinner · S2/P2.
- z-index soup (`z-10`×28, `z-20`×7, 30/40/50, `z-[100]`, `z-[9999]`) · documented layer scale · S2/P2.

## I. Information Density & Space
- Density mode (comfortable/compact via `--density-*`) is a differentiator — but under-applied: tables don't consume it everywhere · wire remaining tables · S2/P2.
- Settings forms single-column with wide empty right halves at ≥1280 · two-column `form-grid` for short fields · S2/P2.
- Attendance Overview toolbar (range+dept+user+status+search+export) wraps to 3 ragged rows at 1024 · collapse secondary filters into "Filters" popover · S2/P2.
- Dashboard greeting block consumes vertical space above the fold daily · compact after first week (persist dismissal) · S1/P3.
- Numeric table columns (hours, minutes) not right-aligned consistently · slows HR's number scanning · S1/P3.

## J. Error Handling & Recovery
- Error copy culture is genuinely good (specific strings: "Start date must be tomorrow or later.", overlap detection, QA-drag teaching toast) — preserve.
- Generic fallbacks remain: "Server error. Please try again later.", boundary title "Something went wrong!" ×16 · add retry guidance + support path in boundary body · S2/P2.
- 401→refresh→redirect loop handled silently and correctly; expired-session redirect explains itself — good.
- Export failures: retry exists in Export History (good) but no error differentiation (validation vs transient) · S1/P3.
- Empty searches: directory/tasks show proper EmptyStates; chat silent-search (1.12) · add "type 3+ characters" hint · S2/P2.

## K. Daily-Use Efficiency Opportunities
- Keyboard: extend palette with task ops (assign to me, done, submit) and approve/reject commands · S2/P2.
- Bulk: bulk bar exists (mark done/delete) — add bulk reassign and bulk move-to-phase (blocked by W14) · S2/P2.
- Inline edit: inline project rename exists; add inline status/priority on task rows · S2/P2.
- Remembered filters: saved views (reports) — extend to tasks/attendance lists · S2/P2.
- "Log time here" action on task Time Logs tab (API supports manual entry) · S2/P2.
- Repeated entry: create-task from a template (recurrence covers some); "assign like last time" on projects · S3/P1 if orgs reuse teams.
- Reduce modals: announcement compose and quick-task could be inline popovers on dashboards they already occupy · S1/P3.

## L. Nielsen Heuristic Findings
Scores in the header table (23/40). Per-heuristic worst screens: H1 — team board staleness + silent no-ops (1.8, A-3); H3 — no undo + admin lockout dead-ends (A-1); H4 — pagination/dialog/verb drift (H-section); H6 — placeholder selects + export memory bridge (D, B-2); H8 — badge-chip noise + micro-type (A-4); H9 — generic fallbacks amid otherwise excellent copy (J); H10 — no contextual help anywhere (top gap after A-items).

## M. What Already Works Well — preserve, do not redesign
1. **`@g4k/ui` architecture** — 57 primitives, 170 importing files, cva variants, `isLoading` buttons. 2. **Token layer** — semantic surfaces, status colors incl. `--overtime`, elevation e1–e4, motion vars, density mode, dark mode, 1440px cap. 3. **Focus/motion foundations** — global focus-visible, reduced-motion durations, normalized lucide stroke. 4. **Lazy-loading discipline** — echarts/Gantt/Kanban/QA/calendar all `dynamic()` with placeholders. 5. **Mobile shell** — bottom nav + FAB, chat fullscreen + `visualViewport`, swipe actions, sidebar-as-Sheet. 6. **Efficiency infra** — cmdk palette + recents, URL-state filters, drafts ×5 forms, saved views, pins, offline queue with punch de-dup, cross-tab auth/timer sync. 7. **Error copy culture** — specific, human messages. 8. **Feedback breadth** — EmptyState ×33 files, per-segment boundaries, optimistic chat with read receipts.

## N. Prioritized Usability Roadmap

**Wave 1 — P0 (ship-blockers, days):**
1. A-1 cookie lockout (+smoke test) · 2. A-2 HR approvals tab + link fixes · 3. A-3 backend trio (pivot/fillable/broadcast) · 4. A-4 type-scale codemod + ESLint ban · 5. A-5 static status map · 6. A-6 delete placeholder sections · 7. W14 move-phase (implement or remove control) · 8. A-7 offline truthiness.

**Wave 2 — P1 UX blockers (this week):**
9. Command-palette + `/dashboard/admin` links · 10. Correction surfacing (row-menu) · 11. Export download-in-toast · 12. Project edit = create form prefilled · 13. Caps: typeahead pickers + captions · 14. Icon-button labels + 40px targets · 15. `motion-safe:` animation wrap · 16. Team-board "last updated" stamp · 17. StatusBadge rollout.

**Wave 3 — P2 consolidation (next sprint):**
18. Dialog `size` prop + codemod · 19. Pagination adoption · 20. `Form*` + labels + helper-text pass on the 8 most-used forms · 21. Verb/confirm glossary · 22. DatePicker unification · 23. Dialogs-as-sheets <640 + hover-free touch actions · 24. Toast `promise` + info parity · 25. Settings two-column forms + filter popover · 26. Remember-me cookie honesty.

**Wave 4 — P3 polish:** z-index scale doc, breadcrumb/label glossary, reminders/feedback/role-switch relocation, right-aligned numerics, greeting dismissal, branding cleanup ("Gen2k"), dead-code deletion (approvals-tab 312 lines, pwa-registry, unused hooks), final detector + `$impeccable critique` re-run. Target trajectory: 13→17+/20 audit health, 23→30+/40 heuristics.

**Open product questions (decide before Wave 3):** pill+rainbow identity on Operate surfaces or auth-only? Accent palette user-facing or designer vocabulary? Minimum viewport 360 vs 390? Should Super Admin have a personal attendance surface (currently hidden)?

---

---

# Part 6 — Component System Audit

> All metrics measured from source this pass. Adoption = files containing the component/`<Tag>`.

## 6.1 Inventory & Adoption (the real design system)

**`@g4k/ui` primitives (57 exported):** the system is *real and used* — this revises any impression of a parallel local kit. Measured adoption: `Dialog` ×23 files · `ConfirmDialog` ×21 · `Tabs` ×18 · `EmptyState` ×33 · `ListScaffold` ×11 · `DatePicker` ×10 · `Toolbar` ×9 · `DropdownMenu` ×12 · `Sheet` ×6 · `PasswordInput` ×5 · `DataTable` ×5 · `InlineEdit` ×4 · `SemanticCalendar` ×3 · `Wizard` ×2 · `Combobox` ×2 · `HelpOverlay` ×1. `AlertDialog` ×0 (dead primitive — `ConfirmDialog` won; delete it). Button ×321 usages vs 66 raw `<button>`; Input ×86 vs ~37 raw; Avatar ×87 (76 with fallbacks); Skeleton ×158; Tooltip ×15.

**Verdict:** the library is healthy; the *failure mode is uneven adoption* — `Toolbar`, `Wizard`, `InlineEdit`, `Combobox`, `DataTable` exist and are exactly what the hand-rolled mega-components reimplement (see 6.4/6.11).

**Module component families:** attendance (7+ incl. admin/HR tables, calendar 598l, graph), leave (4), projects (5 incl. tasks-tab **1,232 lines**), tasks (8 incl. qa-form-builder 831l, detail-sheet 411l), chat (5 incl. chat-tab 773l, message-list 440l), directory (6 incl. departments-tab 817l, directory-list 688l), settings (~12), widgets (12, 1 dead), users, reports, forms, layout/app-shell (nav-group, breadcrumb, palette, bell, connection-status, pinned-items, shell-polish).

## 6.2 Consistency Audit (measured distributions)

| Property | Measured reality | Finding |
|---|---|---|
| Control heights | `h-8`×151, `h-10`×114, `h-9`×63, `h-11`×50, `h-7`×47, `h-12`×41 → **6 competing heights (28–48px)** | Button defaults (40/36/44) are overridden ad hoc; chips force 28/32. Define 4 sizes: 28 chip / 32 dense / 40 default / 44 page-primary. **S2/P2** |
| Radius | `xl`×247, `full`×214, `lg`×96, `2xl`×60, `md`×53, `sm`×25, `none`×24 → 7 values vs 5 tokens | The xl-cards + full-controls pairing is a legitimate identity (keep); `2xl` and stray `md/sm` are drift. **S1/P3** |
| Gap rhythm | `gap-2`×343 dominates; scale 0.5/1/1.5/2/3/4/6/8 coherent; `gap-5`×1 outlier | Healthy rhythm exists — enforce by deleting the outlier; do not re-space the app. **S0–1/P3** |
| Icon sizes | `6`×23, `4`×18, `3`×13 (+ non-square `h-4 w-3` ×4) | Three sizes is right; fix the 4 non-square icons. **S1/P3** |
| Font sizes | 477 arbitrary `text-[Npx]` (A-4) | Covered as A-4; restated: the single largest consistency debt. **P0** |
| Hardcoded values | 53 raw hex colors · 181 arbitrary px dimensions | Token system bypassed at the edges; lint both. **S2/P2** |
| Focus rings | `focus-visible:ring-0` ×7 · `ring-1` ×4 · `ring-2` ×6 + global outline | 7 sites *remove* the ring — audit each for keyboard traps; standardize one ring recipe (2px + 2px offset). **S2/P2** |
| Easing | bounce easing ×9 (detector; dashboard layout ×4) | Reserve for auth; straight ease on Operate chrome. **S2/P2** |

## 6.3 Duplicate Component Audit (same purpose → one canonical)

| Duplicate cluster | Locations | Overlap | Canonical | Merge notes |
|---|---|---|---|---|
| User/member pickers | create-task assignees · create-project members · group dialog · dept HR sync (4 hand-rolled multi-selects) | Checkbox-list-over-data each with own styling + 1,000-row preload | **new `UserPicker`** (server typeahead, multi, chips) | Fixes caps bug class too; Combobox exists as the single-select base |
| Status pills | `StatusBadge` de-facto exists (admin/hr attendance tables, employee-360, open-shifts) **+** ≥7 ad-hoc `rounded-full text-[10-11px]` clusters (leave, tasks, chat, notifications, reports) | Same visual job, different color maps and text sizes | **promote `StatusBadge` to `@g4k/ui`** with status→token map | Kills A-5's class of dynamic-class bugs; one color grammar |
| Attendance tables | `admin-attendance-table` (509l) · `hr-attendance-table` (414l) · DataTable ×5 elsewhere | Two bespoke tables reimplement sorting/selection/pagination | **DataTable + shared AttendanceToolbar** | ~900 lines → configuration |
| Department/designation CRUD | `departments-tab` 817l · `designations-tab` 427l vs `ListScaffold` ×11 elsewhere | Scaffold exists; these two bypass it | ListScaffold + row-menu pattern | Halves both files |
| Search inputs | per-module `Input` + `Search` icon compositions (directory, tasks, audit, chat ≥3-char, users) | Five debounce/gesture behaviors (300ms / none / char-gated) | **`SearchInput`** (debounce + clear + optional hint) | Also fixes chat's silent 3-char gate |
| Loading species | `animate-spin` ×63 raw · DotLoader (Button-only) · Skeleton ×158 | One convention missing | **`Spinner` size=sm|md** + rule: page=skeleton, action=button-loader | Consistent + greppable |
| Date entry | DatePicker ×10 · native `type="date"` ×4 · SemanticCalendar ×3 | Two entry grammars | DatePicker everywhere; native time → `TimeInput` wrapper | — |
| Confirmations | ConfirmDialog ×21 · `window.confirm` ×5 (chat ×2 files) | Browser chrome in the most polished module | ConfirmDialog (already dominant) | Ban window.confirm |
| Dialog widths | 8 widths (425/500/800/md/2xl/3xl/4xl) | Size-by-mood | `Dialog size` prop (sm/md/lg/xl) | Codemod one PR |
| Feedback forms | `widgets/feedback-form.tsx` (dead) + profile-local copy | Literal duplicate | Delete the dead one | — |
| Pagination | DataTable-internal Pagination ×5 · projects prev/next · directory 24/page · QA none | Three grammars | DataTable+Pagination | — |

## 6.4 Component Capability Audit (equipped for purpose?)

- **DataTable — well-equipped:** TanStack columns, sorting hooks, row selection auto-column, integrated Pagination with `pageSizeOptions [20,50,100]`. *Missing:* sticky header, column visibility, responsive card-stack mode, empty/error/loading slots (callers hand-wire). **Upgrade, don't replace.**
- **EmptyState — well-equipped:** icon/title/description/action. Adopt in the ~7 spots still hand-rolling divs.
- **Button — equipped** (variants ×7, sizes ×4, isLoading w/ DotLoader, asChild) but: no `xs` for dense tables (hence h-7/h-8 escapes), and RainbowBorder fires on *every* primary+lg (see 6.10).
- **Input — under-varianted:** default/error only. *Missing:* success state, prefix/suffix slots (search icon, unit, reveal-password), sizes (h-8 dense exists only as className overrides). Prefix/suffix alone would absorb the SearchInput and PasswordInput special cases.
- **Toolbar ×9 adopted but bypassed** in attendance overview, tasks-tab, audit — those hand-roll filter rows; Toolbar should own search-left/filters/actions-right ordering.
- **Wizard ×2 adopted but bypassed** where needed most: create-project (9-field mega-dialog) and user-form should be Wizards (Basics → Team → Advanced).
- **Pagination:** direct-use API fine; expose inside a `TableToolbar` composite so non-DataTable lists stop hand-rolling.
- **QaFormBuilder (831l):** builder + preview in one file; capable but should split designer/preview/renderer (renderer is reused by task submission anyway).
- **TimeClockWidget:** best-equipped widget (4 states, offline, cross-tab, overnight recovery). *Missing:* nothing material — template for others.
- **MetricWidget:** stat + delta only; no sparkline/trend, no drill-down link convention (dashboards link via wrapper). Add optional `href` + `trend` props.
- **PendingApprovalsWidget:** inline decide = excellent capability; missing "view all" link (see 1.6).
- **Chat composer/list:** mentions, replies, attachments, receipts — equipped; missing edit (backend has no route) and pin affordance gating is silent.

## 6.5 States Audit (matrix of shame)

| Component | default | hover | focus | active/selected | disabled | loading | error | empty | long-content | mobile |
|---|---|---|---|---|---|---|---|---|---|---|
| Button | ✅ | ✅ | ✅ (ring-1, thin) | ✅ scale | ✅ opacity-40 | ✅ DotLoader | variant only | — | ✅ nowrap | ✅ tap-effect |
| Input | ✅ | — | ✅ | — | ✅ | — | ✅ variant+msg | — | ❌ no maxLength counters | ⚠️ h-10 ok |
| Select (Radix) | ✅ | ✅ | ✅ | ✅ | ⚠️ | — | ❌ no error variant | placeholder="None" | ⚠️ scroll | ✅ |
| DataTable rows | ✅ | ✅ | ⚠️ | ✅ selection | — | ✅ skeleton | ⚠️ per-page | ✅ | ⚠️ no truncation policy | ❌ no card-stack |
| Tabs | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ⚠️ wrap ragged (settings) | ⚠️ |
| Chat message | ✅ | ✅ actions | ⚠️ | — | — | ✅ optimistic pending | ⚠️ retry? | ✅ | ✅ line-clamp | ✅ |
| StatusDot/pills | ✅ | — | — | — | — | — | — | — | ❌ some colorless (A-5) | ✅ |
| Widgets | ✅ | ✅ | — | — | — | ✅ skeleton | ✅ ErrorBoundary | ✅ EmptyState | ✅ | ⚠️ grid drag <768 |

**Biggest gaps:** Select has no error state (forms can't show field errors on selects); no character counters on limited fields (reason 1,000 chars, description); kanban card keyboard/selected states; tooltip hover-only everywhere (no focus-trigger config found).

## 6.6 Spacing Audit
The `--space-*` scale exists in tokens and `gap-2` dominance shows a de-facto rhythm — the problem is not rhythm but **label-to-control and section spacing in dialogs**: forms mix `space-y-4` and `space-y-6` per dialog; dialog footers sit at inconsistent distances from content (some dialogs scroll the footer, some don't — no `DialogFooter` sticky convention). Settings forms waste the right half ≥1280 (I-section). Attendance Overview toolbar wraps to 3 rows @1024 (I). Fix by adopting `FormGrid` (2-col ≥md) + sticky DialogFooter inside the primitive.

## 6.7 Forms / Buttons / Tables / Modals — deep-dive verdicts
- **Forms (§9):** field *ordering* is logical in every major form (identity→contact→org→config); the deficits are labels (25 total), helper text (0), required indicators (none visual), and dialog-vs-wizard sizing (create-project, user-form). Leave form is the gold standard (balances inline, drafts, disabled-exhausted types). Task form best progressive disclosure. *Upgrade: `Form*` adoption + labels + one-line hints on Advanced fields; two-column ≥md for short pairs (dates, type+priority).*
- **Buttons (§10):** verb glossary needed (Create/Add/Request/Save drift); destructive always red + ConfirmDialog ✓ except chat; loading states on primary submits ✓ (Button); icon-only buttons need labels (G); **RainbowBorder should be an explicit `brand` variant**, not automatic on primary+lg — Operate screens get flat primary, auth/marketing moments get the rainbow. Position: dialogs mix footer order — standardize `[Cancel] [Primary]` right-aligned.
- **Tables (§11):** numeric columns not right-aligned consistently; row density switchable via density mode but not all tables wired; `th` semantics present in DataTable, hand-rolled tables vary; admin table toolbar = the consolidation target. Add sticky header + `text-right` column convention.
- **Modals (§12):** no unnecessary-modal offenses except announcement/quick-task popovers idea (K); create-* dialogs are correctly modal; task detail correctly a Sheet; Esc/backdrop handled by Radix ✓; unsaved protection only via drafts (5 forms) — dialogs with edits but no draft (project edit stub, user edit) can lose work on Esc; mobile fullscreen-sheet fallback missing (F).

## 6.8 Widget Audit (all 12)
`time-clock` — best in class · `pending-approvals` — excellent, add "view all" · `metric` — fine, add href/trend · `recent-activity` — good, virtualized ✓ · `quick-notes` — good (color/pin); `announcement-board` + `composer` — good; gray-on-color chip (detector) · `personal-reminders` — misplaced home (1.12) · `upcoming-holidays` — fine · `quick-task` — good; preloads 1,000 users · `feedback-form` — **dead, delete** · `widget-engine` — drag/resize/collapse/dismiss/restore + persisted layout; missing reset-layout (1.6); disable drag <768 (F).

## 6.9 Color & Brand (§14) — "colorful but controlled" scorecard
Right: orange primary identity, Sora display, status tokens incl. `--overtime`, 15-accent palette for module accents, dark-mode-complete variables. Wrong: accents applied where status should be (project cards pick decorative colors), gray-on-color ×11, `ai-color-palette` ×2 (detector), two modules using "blue" for different meanings (info vs link vs selection). **Rule to adopt: color = status | identity | selection. Never decoration.** Then delete decorative accents on cards and re-invest in status legibility (StatusBadge).

## 6.10 Architecture & API smells (§17)
Largest files are view-containers doing data+layout+dialogs: tasks-tab 1,232l · qa-form-builder 831 · departments-tab 817 · chat-tab 773 · directory-list 688 · attendance-history-calendar 598 · dashboard/layout 552. None are unmaintainable today, but each hosts its own toolbar/dialog/row-menu variants — the duplication engine. Prop-scatter is modest (cva keeps primitives clean); biggest API smells: Button's implicit RainbowBorder (behavior hidden in variant+size combo), DataTable's mixed controlled/uncontrolled props, `widget-info` registry drift risk. **Rule: any component >400l must split container (data) from presentation.**

## 6.11 AI-pattern check (§18, detector + observation)
Confirmed tells: side-tab accent border (`task-overview-tab.tsx:450`) · bounce easing on dashboard chrome · icon+number+card repetition on dashboards without trend context · chips on chips in tables (role chip + status chip + priority chip per row) · placeholder sections (A-6) · 15-color accent use as decoration (6.9). Not tells (keep): pill-button identity, rainbow border *as an opt-in brand moment*, colorful accents on nav, Sora display pairing.

## 6.12 Component Upgrade Matrix (§20 — the checklist)

| Component | Where | Problems | Missing capability | Consistency | UX | Responsive | A11y | Upgrade | Pri |
|---|---|---|---|---|---|---|---|---|---|
| Button | ui | rainbow implicit; no xs | xs size; `brand` opt-in | heights overridden | — | ok | ring thin | sizes+brand variant | P2 |
| IconButton | ❌ missing | 77 ad-hoc | label prop, sizes | 6 heights | unlabeled | <40px | no names | **new primitive** | P1 |
| Input | ui | no prefix/suffix | success, sizes, counters | h-8 escapes | — | ok | ok | slots+sizes | P2 |
| SearchInput | ❌ missing | 5 behaviors | debounce/clear/hint | — | chat gate | ok | — | **new primitive** | P1 |
| Select | ui | no error state | error variant, labels | native strays | — | ok | ok | error+label pass | P1 |
| UserPicker | ❌ missing | 4 copies | typeahead multi | — | caps | ok | — | **new primitive** | P1 |
| StatusBadge | module-local | 7 ad-hoc rivals | single token map | colors drift | A-5 | ok | 1.4.1 | promote to ui | P1 |
| DatePicker/TimeInput | ui | native strays ×4 | TimeInput wrapper | two grammars | — | ok | ok | unify | P2 |
| Form* | ui | 5-file adoption | — | error placement drift | labels | — | aria free | adopt everywhere | P1 |
| Dialog | ui | 8 widths | size prop; sticky footer; <640 sheet | — | — | breaks 360 | trap ✓ | size+mobile | P1 |
| ConfirmDialog | ui ×21 | chat window.confirm | — | copy glossary | — | ok | ok | migrate chat | P2 |
| DataTable | ui ×5 | 2 rival tables | sticky hdr, card-stack, empty slots | — | — | no stack | th ✓ | absorb rivals | P1 |
| TableToolbar | partial (Toolbar ×9) | hand-rolled ×N | standard slot order | — | wraps bad | — | — | compose+adopt | P2 |
| Pagination | ui (DataTable-only) | 3 grammars | — | — | — | ok | labels | adopt direct | P2 |
| Spinner | ❌ missing | 63 raw spins | sizes | — | — | — | — | **new primitive** | P3 |
| Tabs | ui ×18 | settings wrap | condensed labels @md | — | — | wrap | add tablist props in pills | P3 |
| Badge/pills | ui + 7 locals | merged w/ StatusBadge | — | — | — | — | contrast | via StatusBadge | P1 |
| Avatar | ui ×87 | — | — | ✓ | — | ok | fallback ✓ | keep | — |
| Tooltip | ui ×15 | hover-only | focus trigger | — | — | — | kbd | focus-trigger | P3 |
| EmptyState | ui ×33 | 7 hand-rolled | — | — | — | — | ✓ | adopt strays | P3 |
| Toasts | sonner | verb asymmetry | promise variant | — | B-2 | — | live ✓ | wrap sonner | P2 |
| Wizard | ui ×2 | mega-dialogs bypass | steps for create flows | — | — | — | — | use in project/user | P2 |
| TimeClock | widgets | — | — | ✓ | ✓ | ✓ | ok | **template** | — |
| PendingApprovals | widgets | — | view-all link | ✓ | ✓ | ✓ | ok | add link | P2 |
| Kanban | tasks | silent reorder fail (A-3) | keyboard move | — | trust | cols scroll | kbd ❌ | fix+menu-move | P0 |
| TaskGantt | tasks | 100-task cap | — | — | notice | phone=decorative | — | cap honesty | P2 |
| TaskDetailSheet | tasks ×4 surfaces | — | log-time action | ✓ | ✓ | sheet ✓ | ok | add action | P2 |
| ChatList/Composer | chat | clear-chat noop (A-3) | edit; pin gating note | — | ✓ | ✓ | pills a11y | backend+aria | P0 |
| AnnouncementBoard | widgets/chat | gray-on-color | priority consequences copy | ✓ | ✓ | ✓ | ok | token+copy | P2 |
| AttendanceCal/Heatmap | attendance | A-5 dots | legend | — | learn | ok | color-only | status map+legend | P0 |
| AdminAttendanceTable | attendance 509l | rival of DataTable | see 6.3 | — | — | — | — | migrate | P2 |
| HRAttendanceTable | attendance 414l | rival | + approvals tab (A-2) | — | — | — | — | migrate+tab | P0 |
| QaFormBuilder | tasks 831l | monolith | split renderer | — | — | — | — | split | P3 |
| UserForm/EditDialog | users | no draft (esc loses) | wizard split | — | — | — | — | Wizard+draft | P2 |
| CreateProjectDialog | projects 494l | mega-form | wizard split | sizes | — | — | — | Wizard | P2 |
| NavGroup/Sidebar | shell | ✓ (state sync, prefetch) | — | dead branches | ✓ | sheet ✓ | aria-current | trim+aria | P3 |
| CommandPalette | shell | admin link dead (A-1 adjacent) | task actions | — | ✓ | ✓ | kbd ✓ | fix+extend | P1 |
| NotificationsBell | shell | aria tabs | — | — | ✓ | ✓ | aria | fix | P2 |
| ConnectionStatus | shell | false Offline (B-3) | 3-state | — | noise | — | — | restate | P1 |
| OfflineBanner | shell | ✓ | — | — | ✓ | ✓ | live? | keep | — |
| PinnedItems | shell | ✓ | — | — | ✓ | ✓ | — | keep | — |
| FeedbackForm (widget) | widgets | dead | — | — | — | — | — | delete | P3 |
| Grainient | auth | no reduced-motion | — | — | — | — | motion | guard | P3 |

**Severity mapping (§21):** P0 = Kanban/Chat/AttendanceCal/HR-table rows (workflow-breaking or core-trust). P1 = the six missing primitives + Form/Dialog adoption rows. P2 = consolidation + capability. P3 = polish.

## 6.13 Canonical Component System (§22 — target state)

- **Button** — variants: primary / secondary / outline / ghost / destructive / success / link / **brand** (rainbow, opt-in). Sizes: xs 28 / sm 32 / md 40 / lg 44 / icon. States: hover, focus (2px ring), active scale, disabled, loading. Rule: one primary per surface; destructive always ConfirmDialog.
- **IconButton** — required `label` (sr-only); sizes 32/40; menu-vs-action semantics.
- **Input** — default / error / success; prefix+suffix slots; sizes 32/40; counters when maxLength; labels always via `Form*`.
- **SearchInput** — Input + trailing clear + optional leading icon; debounce standardized 300ms; optional `minChars` *hinted*.
- **Select / Combobox / UserPicker** — Select (≤7 options), Combobox (searchable single), UserPicker (searchable multi, server typeahead, chips, cap-free). All: label, error, placeholder="Select…".
- **DatePicker / TimeInput** — only entry points for dates/times; range = two pickers linked.
- **FileUploadPopup** — sole uploader; accepts/maxSize props surfaced in helper text.
- **Form** — `Form*` mandatory for react-hook-form forms; helperText slot; optional-tag on non-required labels.
- **Card** — radius xl, elevation e1 default; header/content/footer slots; no decorative accent bar.
- **StatusBadge** — status→token map (present/late/absent/on-leave/holiday/overtime; todo/in-progress/review/done; pending/approved/rejected/cancelled; active/inactive; priorities); never color-only (text always).
- **DataTable stack** — DataTable (sticky header, selection, sorting, skeleton, empty, error) + TableToolbar (search→filters→actions) + BulkActionBar + Pagination (20/50/100). Card-stack <md.
- **Dialog** — sizes sm 425 / md 500 / lg 800 / xl 1140; sticky footer `[Cancel][Primary]`; <640 → fullscreen sheet; drafts or unsaved-guard.
- **Sheet** — right drawer for detail/inspect; bottom for mobile pickers.
- **ConfirmDialog** — sole confirmation; destructive=red; verb+noun title; consequence line.
- **Feedback** — Toast: success/error/info parity + `toast.promise`; page-load=Skeleton; action-load=Button loader; Spinner primitive.
- **EmptyState** — icon+title+description+action; never a bare "No data".
- **Charts** — one `ChartCard` wrapper (echarts lazy, title, legend, loading, empty).
- **Widgets** — MetricWidget (+href, +trend), list widgets virtualized; WidgetEngine adds reset-layout; drag disabled <768.
- **When-not rules:** never hand-roll pagination, confirm, status pills, user pickers, spinners, or dialog widths again — grep-able bans in review checklist.

---

# Part 7 — Page-by-Page Component Composition (§23)

Per page: components used → composition verdict.
- **Login/auth set:** Grainient + PasswordInput + policy meter — composed well; add identifier helper + one brand story (C-11).
- **Dashboard:** WidgetEngine over 12 widgets — the app's best composition; issues are widget-level (6.8), not layout.
- **Personal attendance:** TimeClock + TodaySummary + ShiftLog + calendar dialog — coherent stack; A-5 dot map is the defect; leave tab correctly reuses LeaveRequestForm.
- **Org attendance (SA):** Calendar + AdminAttendanceTable (hand-rolled) + AttendanceGraph + OpenShifts + AdminLeaveHolidays — functional but the off-DataTable table + 3-row toolbar wrap @1024 mark it as the composition most in need of the DataTable stack.
- **Org attendance (HR):** HrAttendanceTable + graph — **incomplete composition** (missing Approvals tab, A-2).
- **Projects:** header tabs + counts probes + cards/list + CreateProjectDialog — good; edit dialog under-composed (B-3).
- **Project detail:** cover header + PhaseTimeline + SummaryBar + team sidebar + virtualized activity + TaskDetailSheet — strong composition; keep.
- **Tasks:** TasksTab mega-container (1,232l) hosting 4 view modes + filters + create dialog — functionally complete, compositionally overloaded; split by view mode.
- **Chat:** sidebar (search+scope pills+list) + message list + composer + announcements + reminders — best-in-app module; a11y pill semantics + clear-chat backend are the gaps.
- **Directory:** 4 tabs; corporate grid good; employee mgmt table complete; departments/designations bypass ListScaffold (817/427l) — consolidate.
- **Employee 360:** banner + tabs reusing LeaveTab/TasksTab/AttendanceHistoryCalendar — exemplary reuse.
- **Reports:** report tabs + saved views + builder + history — sound; needs download-in-toast (B-2).
- **Audit:** two filter tables — fine; user-filter cap (1.15).
- **Settings:** 11 tabs, mostly well-composed forms; two-column ≥md + filter popover improvements (I).
- **Profile:** 7 scroll sections — 3 fictional (A-6); security section the real value.

# Part 8 — Cross-Workflow Component Consistency (§24)

| Shared pattern | Instances | Consistent? | Action |
|---|---|---|---|
| Create (task/project/user/announcement/holiday/group) | 6 dialogs | ❌ widths 425–4xl; verbs Create/Add/Request; drafts on 5, not user-edit | Dialog size prop + verb glossary + draft on all |
| Delete (task, project, user, comment, note, reminder, announcement, dept, designation, schedule, holiday, message) | 12 | ✅ ConfirmDialog ×21 sites; ❌ chat window.confirm; wording varies | migrate chat; verb+noun titles |
| Export (attendance, leave, users, projects CSV, tasks CSV, reports) | 6 | ⚠️ all async ExportJob ✓ but entry verbs/positions differ; no toast action | ExportButton primitive + promise toast |
| Approve/Reject (leave, task, project) | 3 | ⚠️ widget inline ✓ / page buttons ✓; reject-reason required only for task redo | optional-prompted reason everywhere |
| Search | 5 modules | ❌ debounce 300 / none / ≥3-char gate | SearchInput |
| Filter bar | 6 modules | ⚠️ URL-state ✓ everywhere (use-url-state) but toolbar layouts differ | TableToolbar |
| Pagination | 4 styles | ❌ | DataTable stack |
| Save/Cancel | all dialogs | ⚠️ order varies | sticky footer convention |
| Status change (task drag, phase complete, user activate, announcement dismiss) | 4 | ✅ teaching toasts on task gates; ❌ silent failures (A-3) | backend trio |

# Part 9 — Component Upgrade Roadmap (§25, 9 phases)

**Phase 1 — Critical component fixes (P0):** Kanban reorder persistence + keyboard move · clear-chat backend + UI verification chip · attendance status class map + legend · HR table Approvals tab · move-phase route (implement/remove).
**Phase 2 — Consolidation:** create the six missing primitives (IconButton, SearchInput, UserPicker, StatusBadge↑ui, Spinner, ExportButton); migrate the four user-picker copies, seven pill clusters, five search behaviors; delete AlertDialog + dead feedback-form.
**Phase 3 — Capability upgrades:** DataTable (sticky, card-stack, state slots) absorbs admin/HR attendance tables; Wizard for create-project + user form; Dialog size prop codemod; toast.promise; Select error variant; MetricWidget href/trend.
**Phase 4 — Spacing & hierarchy:** FormGrid 2-col; sticky DialogFooter; settings two-column; attendance toolbar filter-popover; type-scale codemod (A-4) + height scale (28/32/40/44) + radius trim (drop 2xl/md strays) + delete gap-5.
**Phase 5 — Responsive:** dialogs→sheets <640; hover-free row actions; Tabs condensed @768; bulk-bar/FAB z fix; Gantt honesty <480; widget drag off <768.
**Phase 6 — Accessibility (component-level):** IconButton labels; Select/Form error aria; focus-trigger tooltips; motion-safe wrap for spin/bounce/ping; pill tablist semantics; ring recipe (kill ring-0 ×7).
**Phase 7 — Color & brand:** StatusBadge token map rollout; color=status|identity|selection rule; fix gray-on-color ×11 + ai-palette ×2; rainbow → explicit `brand` variant; nav accent cleanup.
**Phase 8 — Workflow placement:** correction row-menu entry; export download-in-toast; pending-approvals view-all; reminders/feedback/role-switch relocation; log-time on task sheet; task actions in palette.
**Phase 9 — Final consistency pass:** verb/confirm/breadcrumb glossaries; page re-audit after consolidation; detector + `$impeccable critique` re-run; expected 13→17+/20 and 23→30+/40.

---

# Part 10 — Layout, Spacing, Alignment, Compactness & Visual Composition Audit

> Scope: visual structure only. Measured distributions (this pass): **page padding** p-6×73 / p-4×48 / px-4×20 / p-8×17 / px-6×12 — the `page-padding` utility exists but is used **once**; **card padding** p-4×88 / p-3×53 / p-6×25 / p-5×16 / p-8×12 (`card-padding` utility ~unused); **form rhythm** space-y-4×83 / 6×66 / 2×65 / 1.5×47 / 3×42 (+5/8 outliers); **row padding** py-2×71 / py-1.5×43 / py-1×30; **shell heights** h-12×5 / h-14×1 / h-16×3; **grids** grid-cols-1×53 base with sensible sm:/md:/lg: ladders but **26 unprefixed `grid-cols-2/3`** (won't collapse on phones); **headings** lg×25 / 2xl×23 / xl×16 / 3xl×6; **table cells** px-3 py-1.5×9 vs px-4 py-1.5×3 vs px-2 py-1.5×4; **negative margins** only ~20 small optical corrections (healthy); **charts** fixed `h-64`/`h-48` regardless of widget size. Cross-refs: responsive detail = Part 4; type-scale emergency = A-4; height/radius fragmentation = 6.2.

## A. Critical Layout Issues

**A-L1. Fixed-width dialogs exceed small-phone viewports**
- **Location:** every `Dialog` at 425px/500px (`max-w-[425px]`×4, `max-w-[500px]`×4) on 320–390px devices.
- **Current problem:** dialog width exceeds viewport; Radix centers and the body scrolls — content clipped, footer actions below the fold, double-scroll.
- **Impact:** creation forms (leave, task) are the app's most common mobile tasks; on budget Androids the primary action is off-screen.
- **Expected layout:** <640px → dialogs become fullscreen/bottom-sheet with sticky footer and internal scroll.
- **Recommended change:** `Dialog` primitive gains `size` + mobile-sheet variant (Part 6 §6.13).
- **Severity:** P0 · **Scope:** Global (shared component — fix once) · **Reusable fix:** `@g4k/ui Dialog`.

**A-L2. Unprefixed grids never collapse on phones**
- **Location:** 26 `grid-cols-2`/`grid-cols-3` without responsive prefixes (vs 53 correctly-laddered `grid-cols-1 → sm:2 → lg:3`).
- **Current problem:** two/three forced columns at 360px → ~160px columns; metric cards wrap text vertically; chat sidebar layouts squeeze.
- **Impact:** cramped mobile blocks and ragged line breaks exactly where space is scarcest.
- **Expected layout:** `grid-cols-1 sm:grid-cols-N` ladder.
- **Recommended change:** codemod prefix insertion; ESLint rule banning unprefixed multi-column grids.
- **Severity:** P1 · **Scope:** Global · **Reusable fix:** convention + lint.

## B. Major Spacing Issues

**B-L1. Five page-padding conventions.** p-6×73 / p-4×48 / px-4×20 / p-8×17 / px-6×12 across dashboard pages — equivalent pages have different margins (e.g. directory p-4 vs settings scroll sections p-8). **Expected:** one `page-padding` token (exists, unused). Fix: adopt utility app-wide. **P1 · Global · `page-padding` utility.**
**B-L2. Five card paddings + nested double-padding.** Cards p-4/p-3/p-6/p-5/p-8 with the `card-padding` (24px) utility bypassed; Card p-6 wrapping an inner `p-4` block produces 40px combined insets in several detail layouts. **Expected:** `card-padding` token; inner content padding forbidden. **P1 · Global.**
**B-L3. Form rhythm variance.** Field spacing uses space-y-1.5/2/3/4 in different dialogs (47/65/42/83 occurrences) — the same form pattern breathes differently per module; space-y-5 ×8 and gap-5 ×1 are off-scale outliers. **Expected:** fields `space-y-4`, label-to-control `space-y-1.5`, sections `space-y-6` — codified in `FormSection`. **P2 · Global.**

## C. Alignment Issues

**C-L1. Mixed control heights break row baselines.** h-8×151 chips/inputs sit beside h-10×114 defaults and h-9×63 in the same toolbars and dialog footers — bottoms don't align, rows look "off" though technically valid. **Expected:** 28/32/40/44 height scale with matched baselines per row (6.2). **P1 · Global · Button/Input sizes.**
**C-L2. Shell header heights vary.** h-12 (×5), h-14 (×1), h-16 (×3) within the dashboard shell/header pieces — breadcrumb row, bell row, and mobile top bar don't share a datum. **Expected:** one header height token (56px) + mobile variant. **P2 · app-shell.**
**C-L3. Positive alignment hygiene.** Only ~20 small negative margins (icon optical fixes like `-ml-2`×5) — no hack culture; keep it this way (works-well). **P3.**

## D. Compactness & Space-Waste Issues

**D-L1. Settings forms waste the right half ≥1280.** Single-column fields in full-width tab panes; short pairs (host+port, prefix+start) belong on one row. Fix: `FormGrid` 2-col ≥md. **P2 · Settings.**
**D-L2. Attendance overview toolbar stacks 3 rows @1024.** Range+dept+user+status+search+export each take a row → table starts ~300px down. Fix: filter popover (Part 5 I). **P2 · Org attendance.**
**D-L3. Tall single-column creation dialogs.** Create-project (9 fields) and user-form render one field per row inside 425–500px modals → 700px+ tall bodies with forced scroll, while the screen beside them is empty. Fix: Wizard split + 2-col short pairs (6.4). **P1.**
**D-L4. Dashboard greeting block** consumes a full band above widgets daily; compact after first week (dismissable). **P3.**
**D-L5. Widget charts ignore their container.** echarts wrappers hard-code `h-64`/`h-48` inside a drag-resizable grid — resizing a widget taller leaves dead space; shorter clips. Fix: charts fill container (100% height + ResizeObserver; echarts `autoresize`). **P2 · widgets/graphs.**

## E. Responsive Issues — see Part 4; layout-specific additions: A-L2 (unprefixed grids), D-L2 (toolbar stacking), settings TabsList ragged wrap @768, bulk-bar/FAB z-overlap, `pb-safe` only on bottom nav.

## F. Overflow & Breakpoint Issues

**F-L1. Dialog overflow <640** (A-L1). **F-L2. Dropdown/popover edge behavior:** no `collisionPadding`/`avoidCollisions` tuning found for menus in table row corners — right-edge row menus can clip at narrow widths. **P2 · DropdownMenu usage.** **F-L3. Truncation coverage** is good (79 truncate/line-clamp) but inconsistent: some tables truncate, chat sidebar names rely on min-w-0 availability — audit long-name rows (Riley persona, Part 1). **P2.** **F-L4. Table horizontal scroll** handled via 15 `overflow-x-auto` wrappers — verify the two hand-rolled attendance tables included (they are the widest). **P3.**

## G. Typography & Vertical Rhythm

**G-L1. Page-title scale drift:** text-lg×25 / 2xl×23 / xl×16 / 3xl×6 used as page/main headings across modules — equivalent pages shout at different volumes (Projects 2xl vs Audit lg). **Expected:** PageTitle = 2xl/600, section = lg/600, card title = base/600 — three tiers only. **P2 · Global.** **G-L2.** The 477-size micro-type emergency = A-4 (P0). **G-L3.** `leading-*` almost never set (20 uses) — defaults are fine at 12px+ but pair the type-scale fix with `leading-snug` for dense table text. **P3.**

## H. Forms & Input Layout — B-L3 + D-L3 + Part 5 D; addition: **H-L1.** date/time fields render full-width where half-width pairs suffice (leave start/end stack vertically on desktop — two side-by-side pickers would halve form height). **P2 · LeaveRequestForm + corrections.**

## I. Tables & Data-Dense Layout

**I-L1. Two cell-padding standards:** px-3 py-1.5 (×9) vs px-4 py-1.5 (×3) vs px-2 py-1.5 (×4) across DataTable and hand-rolled tables — same screen, different gutters after migration (6.3). Fix: one cell token. **P2.** **I-L2. Numeric columns not right-aligned** (Part 5 I). **P2.** **I-L3.** Density mode exists (`--density-row-height` 48/36px) but hand-rolled tables hard-code py — wire density vars everywhere. **P2.** **I-L4.** Action columns: icon-only rows of 2–4 buttons widen tables; consolidate to `⋯` menu on narrow. **P3.**

## J. Dashboard & Widget Layout — D-L4/D-L5 + Part 6.8; addition: **J-L1.** mixed-height widgets in one grid row leave uneven bottoms (MetricWidget vs QuickNotes) — set `min-h` per widget class or grid `auto-rows`. **P3.**

## K. Header / Toolbar / Navigation — C-L2 + D-L2; positives: sidebar 64↔256px states are tight and correct, nav item rhythm consistent, breadcrumbs align to content container.

## L. Modal & Drawer — A-L1 + D-L3 + Part 5 B-1; addition: **L-L1.** footer padding varies because DialogFooter isn't part of the primitive — sticky-footer + standard `pt-4 border-t` needed once in `Dialog`. **P2 · ui/Dialog.**

## M. Cross-Page Design Inconsistencies (the master list, measured)

| Pattern | Variants in use | Canonical |
|---|---|---|
| Page padding | 5 (p-6/p-4/px-4/p-8/px-6) | `page-padding` |
| Card padding | 5 (p-4/p-3/p-6/p-5/p-8) | `card-padding` |
| Field rhythm | 4 + outliers | 1.5 label / 4 fields / 6 sections |
| Page title | 4 tiers as titles | PageTitle 2xl |
| Cell padding | 3 | one token |
| Control heights | 6 | 28/32/40/44 |
| Radius | 7 → keep xl+full identity, drop strays | 5 tokens |

## N. Component Sizing — see 6.2 (heights/radius/icons) and D-L3; nothing to add beyond cross-ref.

## O. Visual Design

**O-L1. Elevation tokens exist (e1–e4) but call sites also hand-roll `shadow-*`/arbitrary hover shadows** (e.g. RainbowBorder's `hover:shadow-[0_0_15px…]`) — audit and map to e-tokens. **P3.** **O-L2.** Card chrome mix: bordered vs elevated cards coexist per module (directory cards border, widget cards shadow) — pick: borders for content cards, elevation for floating layers only. **P3.** **O-L3.** Color weight = 6.9 (color = status/identity/selection rule). Badge sizing rides on the type-scale fix (A-4).

## P. What Already Works Well (layout-specific — do not change)
1. **1440px content cap** — correct decision for large/ultra-wide; density preserved. 2. **Sidebar two-state model** (64px rail ↔ 256px expanded, Sheet on mobile) — tight and consistent. 3. **gap-2-dominant rhythm** (×343) — a real rhythm exists; the work is edge-normalization, not re-spacing. 4. **Grid ladders** where used (1→sm:2→lg:3) are correct. 5. **~20 negative margins total** — no hack culture. 6. **thin-scrollbar/no-scrollbar utilities** consistently applied to scroll panes. 7. **Virtualized activity feed** keeps the tallest page fast. 8. **Density mode architecture** (comfortable/compact vars) — ahead of most SaaS; it only needs full wiring (I-L3).

# Part 11 — Layout Optimization Roadmap (fix order: global → components → pages → responsive → pixels)

**Phase 1 — Critical layout fixes:** A-L1 dialog mobile-sheet variant · A-L2 grid-prefix codemod+lint · F-L2 collision padding on row menus.
**Phase 2 — Global spacing system:** adopt `page-padding`/`card-padding` utilities (delete 5-variant sprawl) · kill space-y-5/8 + gap-5 outliers · forbid inner padding inside padded cards.
**Phase 3 — Component dimensions:** 28/32/40/44 height scale via Button/Input sizes · radius trim to tokens · cell-padding token · one header-height token (56px).
**Phase 4 — Alignment system:** matched-height rows in toolbars/footers · DialogFooter sticky standard · grid `auto-rows` for widgets.
**Phase 5 — Compactness:** FormGrid 2-col + date-pair rows · Wizard split for create-project/user · attendance toolbar filter-popover · greeting dismissal.
**Phase 6 — Responsive:** Part 4 strategy + settings TabsList condensed @768 · bulk-bar/FAB z fix · chart autoresize (D-L5).
**Phase 7 — Typography & rhythm:** A-4 type scale · PageTitle/section/card-title tiers · leading-snug dense tables.
**Phase 8 — Cross-page consistency:** M-table enforcement pass module by module (directory → attendance → settings → reports).
**Phase 9 — Pixel pass:** O-L1/L-L1 residuals, right-aligned numerics, action-column `⋯` on narrow, final `$impeccable polish` + live-browser re-verification of all Part 10 measurements.

---

# Part 12 — Functional-Fit Audit: Forms, Calendars, Dropdowns, Inputs, Buttons, Identity, Grouping & Wiring

> New measurements this pass: **DatePicker** has min/max but **no Today, no Clear, no range mode** (0 "today" matches) — ranges are two stacked full-width single pickers; calendar cells **h-8 w-8 (32px)**; **0 files** combine `SelectItem` with `<Avatar>` — every people-picker in the app is text-only, while `avatar_url` is wired in **43** other locations (Avatar ×87 with initials-fallback ×76); search/filter inputs come in **five widths** (w-48×26, w-64×12, w-56×7, w-80×6, w-72×1); **no `rows=` attribute on any textarea** (browser-default heights); only 11 `w-full` Buttons (task sheet, QA builder) + login's own raw styled button; `hr-attendance-heatmap.tsx:110` forces **`min-w-[800px]`**; EmptyState is sensibly capped at `max-w-md`. Cross-refs: Part 5 D/H (forms), 6.2/6.3/6.5 (sizes/duplicates/states), 10 (layout), Part 2 (workflows).

## A. Calendar & Date/Time Issues

**A-F1. DatePicker lacks the controls its workflows need**
- **Component:** `@g4k/ui DatePicker` · **Location:** leave request, corrections, reports range, task due, project deadline.
- **Current behavior:** single-mode picker with min/max; no Today shortcut, no Clear, no range mode; leave/reports compose two independent full-width pickers.
- **Problem:** five daily-use flows make users page to "today"/months manually and cannot clear a wrong date without picking another; start/end validation is manual cross-field logic.
- **User impact:** slower date entry everywhere dates matter; same-day-leave error (W3) traces partly to a picker that permits today while the rule forbids it.
- **Expected behavior:** footer `[Today] [Clear]`; `mode="range"` for leave/reports; picker disables dates the rule forbids.
- **Recommended upgrade:** extend ui DatePicker (footer + range mode); wire `maxDate`/`disabled` per business rule.
- **Scope:** Global · **Priority:** P1 · **Fix Globally:** Yes.

**A-F2.** Calendar day cells 32px (h-8 w-8) — under 40px touch comfort inside popovers on phones; bump to 36–40px in the primitive. P2 · Global · Yes.
**A-F3.** Report date filters lack quick presets (Last 7/30 days, This month) for the most frequent HR question. P1 · Reports.
**A-F4.** Two date grammars persist (DatePicker ×10 vs native `type="date"` ×4 — Part 5 D); the native four also skip the 32px cell/popup conventions entirely. P2 · Global.

## B. Form Issues
**B-F1 (full format).** **Component:** CreateProjectDialog (9 fields) · **Location:** Projects → Create. **Current behavior:** name→description→priority→department→deadline→members→QA→phases→cover in one flat single-column list. **Problem:** grouping is invisible — Basics/Team/Configuration are not separated; optional fields unmarked (0 helper texts repo-wide). **User impact:** first-time managers can't tell what's required or in what order to think; form reads longer than it is. **Expected:** identity → team → configuration sections (or Wizard, Part 6.4), optional markers, 2-col short pairs. **Upgrade:** `FormSection` + FormGrid; Wizard for project+user. **Scope:** Module · **Priority:** P1 · **Fix Globally:** No (pattern reusable).
**B-F2.** User form: field *order* is right (identity→contact→org→roles) but has no visible section labels — grouping exists only in the developer's head. P2.
**B-F3.** Corrections dialog ordering (action→event→time→reason) is correct and compact — keep (N). **B-F4.** Reset behavior: no form has explicit Reset; drafts (×5) partially cover unsaved-work protection; edit dialogs without drafts (project edit stub, user edit) lose work on Esc. P2 (cross-ref 6.7).

## C. Input Sizing Issues
**C-F1.** Every `Input` is full-width by default (primitive `w-full`) — employee-code, prefix, minutes, and port fields render dialog-wide for 4–8 characters. **Expected:** purpose-sized (short code→compact, date→compact, description→wide) via Input `size`/width classes + FormGrid. P2 · Global · Yes (primitive).
**C-F2.** Five search/filter widths in active use (w-48/w-56/w-64/w-72/w-80) for the same job — normalize: table filters w-48–64, page search w-72–80. P3 · Global.
**C-F3.** No textarea declares `rows` anywhere — description/notes heights are browser defaults and differ per form; set conventions (description=4, notes=3, reason=3). P2 · Global.

## D. Dropdown & Select Issues
**D-F1 (full format).** **Component:** all people selects (assignee, members, HR-sync, group) · **Location:** create-task, create-project, group dialog, departments. **Current behavior:** text-only `SelectItem`/checkbox lists (0 SelectItem+Avatar co-occurrences measured). **Problem:** users distinguish colleagues by bare name text although photos already exist in the system. **User impact:** wrong-person assignments with similar names (common in this org's seed data — three Kumars); slower scanning. **Expected:** photo + name + department/role in every people picker. **Upgrade:** the `UserPicker` from 6.3 renders avatar rows; chat's `/chat/users` search already returns the data. **Scope:** Global · **Priority:** P1 · **Fix Globally:** Yes (one component fixes four call sites).
**D-F2.** Select has no error variant (6.5) — form errors can't reach the most-used field type. P1 · ui/Select · Yes.
**D-F3.** Multi-select = 4 bespoke checkbox lists (6.3) with inconsistent spacing/selection feedback. P1 via UserPicker.
**D-F4.** Dropdown positioning lacks collision handling (10 F-L2); long option names rely on default wrap (verify payroll-length names). P2/P3.

## E. Grouping Issues
**E-F1.** Toolbars have no Search | Filters | Date | Sort | Actions convention — attendance overview stacks six controls into 3 rows (10 D-L2); tasks-tab wraps better but mixes presets with scope filters ungrouped. **Expected:** TableToolbar slot order (6.13). P1 · Global via primitive.
**E-F2.** Dialog footers: action order and grouping vary (Cancel/Submit vs Submit/Cancel; destructive sometimes inline) — sticky `DialogFooter [Cancel][Primary]` (10 L-L1). P2 · ui/Dialog · Yes.
**E-F3.** Exemplary grouping to preserve: task-create's collapsed Advanced section; corrections dialog; chat composer (attach/mention/reply-preview). N-list.

## F. Button Issues
**F-F1.** Same-purpose buttons at 3+ sizes (h-8 chip vs h-10 dialog vs h-11 hero — 6.2's height table): "Approve" is h-8 in widgets and h-10 in dialogs. Normalize by role, not by surrounding space. P2 · Global · Yes (Button sizes).
**F-F2.** Login submits via a hand-styled raw button (w-full h-10 custom classes, `login/page.tsx:189`) instead of ui Button — the most-seen button in the product bypasses the system. P3 · Page.
**F-F3.** `lg` (h-11, px-8) used for routine dialog submits where `default` fits — size follows empty dialog space, not importance. P3.
**F-F4.** Destructive Delete sits beside Edit in the project settings dropdown (1.10) — separate destructive into a red, end-anchored menu zone. P3.
**F-F5.** Export buttons enabled with zero rows selected → error toast after click ("select at least one" ×2 strings) instead of a disabled state — prevention beats recovery. P2.

## G. Profile Photo / Identity Issues
**G-F1.** Photos are wired in 43 places (nav avatar, directory cards, chat, users table, activity) — the system works; the gap is **selectors**: no people-picker, mention menu, or HR-assignment dropdown shows a face (D-F1). **Fix Globally:** Yes (UserPicker + mention menu avatar row). P1.
**G-F2.** Initials-fallback ×76 works and covers no-photo users; sizes are consistent per context (h-8/9/10). Verify mentions autocomplete + approval rows include department to disambiguate same-name people. P2.
**G-F3.** `avatar-utils.ts` is dead code (6.3) — delete so future wiring uses one path. P3.

## H. Missing Component Functionality (delta over 6.4/6.5)
DatePicker Today/Clear/range (A-F1) · report presets (A-F3) · Select error state (D-F2) · kanban keyboard move (6.3 matrix) · chat edit affordance (schema-ready, no route) · export toast action (B-2) · uploader preview/replace/remove states standardized on FileUploadPopup (verify announcement/project covers) · dialog unsaved-changes guard beyond the 5 drafted forms · density toggle wiring on hand-rolled tables (10 I-L3).

## I. Frontend Wiring Issues (consolidated master list)
**I-F1 (index; each detailed earlier):** middleware capability-cookie lockout (A-1) · HR approvals dead tab (A-2) · clear-chat no-op (A-3) · drag-reorder no-op (A-3) · move-phase → 500 (W14) · project edit stub (B-7) · palette admin link → profile non-tab (1.18) · `/dashboard/admin` guarded 404 · placeholder profile sections (A-6) · offline false-success toasts (A-7) · Echo auth staleness kills realtime silently (C-14) · nav prefetch warms wrong query keys (C-4) · dynamic Tailwind classes unstyle status dots (A-5) · login raw button (F-F2) · export enabled-when-unusable (F-F5). **Verification rule:** after fixing any of these, add the missing UI→state→API→UI assertion to the E2E smoke suite (Part 11 Phase 9).

## J. Contextual Action Issues
Corrections buried 4 layers while context (a wrong row) begs for it (W6) · announce/quick-task could be inline popovers (K) · submit-for-review and approve/redo gating is exemplary (N) · group-chat creation correctly hidden from employees · notifications mark-read correctly per-row contextual. **Add:** state-conditional actions — e.g., "Continue Shift" appears only when relevant (good), Export disabled until selection (F-F5), Archive pre-checked for member count (1.13). P2 cluster.

## K. Component Space-Usage Issues
EmptyState properly capped (max-w-md — good) · heatmap min-w-[800px] forces horizontal scroll below 1024 (→ L-F1) · settings single-column waste (10 D-L1) · charts fixed h-64 in resizable widgets (10 D-L5) · rest cross-ref Part 10 D.

## L. Responsive Component Issues
**L-F1.** `hr-attendance-heatmap.tsx:110` `min-w-[800px]` — guaranteed horizontal scroll on tablets/phones; make the grid scale (week columns collapse) instead of forcing width. P1 · Component.
**L-F2.** DatePicker popup inside 425px dialogs on 360px screens (with A-L1) — popover can exceed the dialog; cap popup width + cell size down. P2 · Global.
**L-F3.** Cross-ref Part 4 + 10 E/F (dialogs-as-sheets, unprefixed grids, menu collision).

## M. Cross-Page Component Inconsistencies (delta over Part 6/8/10-M)
Five search widths (C-F2) · two date grammars (A-F4) · **four different people-selection UIs** (checkbox list, text Select, chat search, directory card) for one job → UserPicker · pagination ×3 (6.3) · button sizes by context (F-F1).

## N. Components Working Correctly (preserve)
Attendance-history-calendar (month nav + swipe + day-detail = the app's best calendar) · task-create dialog (defaults, collapsed advanced, drafts, server errors) · leave form (inline balances, disabled exhausted types) · corrections dialog ordering · EmptyState sizing/fallbacks · the avatar system everywhere it's used (43 sites) · time-clock widget · task-detail-sheet IA · chat composer grouping · command palette (except the admin link).

## O. Priority Upgrade Roadmap (delta — fold into Part 9/11 phases)
**Into Phase 1 (P0/P1-critical):** none new (all wiring items already listed).
**Into Phases 2–3 (consolidation/capability):** UserPicker with avatar rows (D-F1/G-F1 — fixes 4 sites + mention menu) · DatePicker Today/Clear/range (A-F1) · report presets (A-F3) · Select error variant (D-F2) · heatmap responsive grid (L-F1).
**Into Phases 4–5 (sizing/compactness):** purpose-sized inputs (C-F1) · search-width normalization (C-F2) · textarea rows conventions (C-F3) · button size-by-role (F-F1) · login button migration (F-F2).
**Into Phases 6–8:** dialog footer standard (E-F2) · export disabled-until-selected (F-F5) · destructive menu zoning (F-F4) · form section labels (B-F2).

# Part 13 — Developer Checklist (final)

- [x] All calendars audited (ui Calendar/DatePicker/SemanticCalendar, holiday, attendance-history) — A
- [x] All date/time controls audited (4 native strays flagged) — A-F4
- [x] All forms audited (Part 5 D, B-F1..4) — B
- [x] All input dimensions reviewed (full-width default, 5 search widths, 0 textarea rows) — C
- [x] All dropdowns reviewed — D · [ ] Dropdown spacing normalized (with UserPicker adoption)
- [ ] User selectors improved (UserPicker + avatars) — D-F1/G-F1 ← **open**
- [x] Profile photos correctly wired (43 sites ✓) — [ ] selectors/mentions still text-only ← **open**
- [ ] Person identification improved (photo+name+dept rows) ← **open**
- [ ] Button sizes normalized (28/32/40/44 by purpose) ← **open**
- [ ] Oversized/default-sized inputs removed (purpose sizing) ← **open**
- [ ] Oversized textareas reviewed (rows conventions) ← **open**
- [ ] Related controls grouped (TableToolbar, FormSection, DialogFooter) ← **open**
- [ ] Workflow-specific controls added where justified (Today/Clear/presets, disabled-until-selected) ← **open**
- [x] Incorrect/missing wiring identified (I-F1 master list)
- [ ] UI state synchronization verified (E2E smoke suite after fixes)
- [x] Contextual actions reviewed — J · [ ] corrections surfacing + state-conditional buttons ← **open**
- [x] Empty/loading/error states reviewed (6.5 matrix, EmptyState sized well)
- [x] Responsive behavior reviewed (Parts 4/10-E-F, L-F1..3)
- [x] Cross-page consistency reviewed (6.2, 8, 10-M, M) · [ ] enforce via primitives ← **open**
- [x] Global component fixes identified (6.3 duplicates, D-F1, A-F1 — all "Fix Globally: Yes")
- [ ] Final workflow-based component pass (Part 11 Phase 9 + live-browser re-verification)

---

# Part 14 — Information Architecture, Duplication & Consolidation Audit (zero-trust verified)

> Re-verified this pass, from code: the **7 redirect stubs** (`/admin/reports`, `/admin/attendance`, `/announcements`, `/leave`, `/notifications`, `/org/leave`, `/tasks` — all `redirect()` confirmed), the exact **nav tree** (3 groups × 11 items, `dashboard/layout.tsx:49-66`), **Employee 360's only action is Send Message** (`directory/[id]/page.tsx:99-104` — no Edit/Reset/Deactivate), **QA builder is the 4th view-mode inside the Tasks tab** gated `qa.view` (`tasks-tab.tsx:165,666`), and the settings Notifications tab exists as a separate surface from profile notification preferences. Cross-refs: Part 1 (pages), Part 2 (workflows), Part 3 (roles), 6.3 (duplicate components), I-F1 (wiring).

## A. Duplicate Pages
No literal duplicate pages remain — consolidation already happened via redirects (good). Residue: **two dead duplicates** — `approvals-tab.tsx` (312 lines, superseded by AdminLeaveHolidaysView) and `widgets/feedback-form.tsx` (superseded by profile-local copy) → delete. The `/admin/*` and short-slug stubs are keep (deep links), but audit inbound links then remove after one release. **P2.**

## B. Duplicate Workflows
- **Message a person — 4 entries** (chat search, directory card, employee 360, feedback DM): useful contextual duplication — keep all; chat search is canonical.
- **Export data — 4 surfaces** (attendance, leave, users, reports): same async job underneath, four verb/position/feedback dialects → `ExportButton` primitive (Part 6). **P2.**
- **Approve leave — 2 paths** (dashboard widget; admin Leave & Holidays tab) + HR's missing path (A-2). Both legitimate; fix the missing one. **P0 (existing).**
- **Work on a task — 3 surfaces** (tasks tab, project detail, `/tasks/[id]`): all contextual, all open the same TaskDetailSheet — correct pattern, keep.

## C. Duplicate Components (IA-relevant, beyond 6.3)
**Three activity feeds** (project history, task activity tab, user activity tab) render the same event-stream shape with three implementations → one `ActivityFeed` primitive. **Two month-calendars overlap** (holiday-calendar vs attendance-history-calendar on SemanticCalendar) — keep both surfaces, share the grid. **P2.**

## D. Duplicate Actions
Message (keep all, above) · Export (pattern, above) · Approve (fine) · **Edit/Reset/Deactivate employee exists in exactly ONE place** (directory row menu) — the inverse problem: see K-A1. Create task ×2 (tasks tab + project detail) — good contextual duplication, keep.

## E. Confusingly Similar Pages
**E-A1 (major).** "Attendance & Time" (personal, `/attendance`) vs "Attendance" (org, `/org/attendance`) — HR sees both. **Type:** Naming/IA · **Current behavior:** two nav items, near-identical labels, different universes. **Mental model:** "the one about me" vs "the one about my team." **Recommended:** rename to **"My Attendance"** and **"Team Attendance"** · **Benefit:** one-glance disambiguation for the two roles that see both · **Priority: P1.**
**E-A2.** Corporate Directory vs Employee Management tabs (same people, different powers) — keep as tabs; add "Management" label clarity is already present; fine as-is. **E-A3.** Reports hub's two tabs (summary vs raw exports) — similar tables, different purposes; rename tabs "Summary Reports" / "Data Exports". **P3.**

## F. Same Purpose / Different Implementations
People pickers ×4, create dialogs ×6 verb dialects, pagination ×3, confirms ×2 — all canonicalized in 6.3; no new instances found.

## G. Navigation Problems
1. Four nav destinations dead for everyone via the capability cookie (A-1) — **P0, prerequisite for everything.**
2. Two attendance labels (E-A1). **P1.**
3. QA form management buried as a view-mode inside Tasks (see L-A2). **P1.**
4. Personal Reminders buried under Announcements tab (Part 1 1.12). **P2.**
5. "Directory" nav item silently expands to management + org structure for admins — acceptable, but the nav label could be "People & Org" for clarity. **P3.**

## H. Excessive Navigation Depth
Corrections (4 layers, W6) · export download (2 pages + memory bridge, W19) · role switch + change password (2 levels into Profile) · palette admin link (broken, 1.18). All previously cataloged; the IA fix for each is a contextual action (K), not a new page.

## I. Page Consolidation Opportunities
1. **Departments + Designations tabs → one "Org Structure" tab** (two thin CRUDs, same mental model "how the company is shaped"). Both are ListScaffold-ready. **P3.**
2. **HR approvals into HR org attendance** (A-2) — consolidation of the approval *surface*, already specified. **P0.**
3. Nothing else qualifies — the app is correctly page-consolidated (redirects did this); the remaining problems are contextual, not structural.

## J. Contextual Settings Opportunities
- **Project settings** — the settings dropdown exists but opens a stub (B-7); it should be the project's contextual config (members/dept/QA/cover/allow-employee-tasks). **P1 (same fix as B-7).**
- **Notification channels** — global defaults (Settings → Notifications) + personal overrides (Profile) is the *correct* split; add a "personalize" link from the global tab to profile. **P3.**
- **Reminder offsets** (Settings → Reminders) — add "configured in Settings" tooltips on the reminder widgets that depend on them. **P3.**
- **Work schedules** — global config + per-user assignment in the user form: correct, keep.

## K. Contextual Action Opportunities
**K-A1 (major).** **Employee 360 lacks manager actions.** **Type:** Context · **Current behavior:** the employee workspace offers only *Send Message* (verified `directory/[id]/page.tsx:99-104`); Edit / Reset Password / Activate-Deactivate / Delete live exclusively in the Directory row menu. **Problem:** a manager inspecting an employee's attendance/leave/activity in the workspace must navigate *back* to the table to act. **Mental model:** "I'm looking at this person — act on this person." **Recommended:** action bar or ⋯ menu on 360 for capability-gated actions (Edit, Reset Password, Deactivate/Activate, Assign to Project). **Reuse:** `use-user-actions` hook already encapsulates all mutations. **Contextual access:** header dropdown + inline Edit on profile section. **Benefit:** closes the biggest context-switch loop in the app. **Priority: P1.**
**K-A2.** Attendance row → direct "Correct" (W6) · task sheet → "Log time" · approvals widget → "View all" · heatmap/graph cards → "Export". All P1–P2, previously specified.

## L. Random / Misplaced UI Components
**L-A1.** Personal Reminders under the *Announcements* tab — relocate to bell dropdown footer or a dashboard widget (already the plan, Part 5 K). **P2.**
**L-A2.** **QA form builder as a Tasks view-mode** — a *form-designer* tool sharing a view switcher with Board/List/Timeline. **Type:** IA · **Problem:** admins asked to "create a quality checklist" won't look inside a task board; view-switcher implies data views, not authoring tools. **Recommended:** keep the tab for *using* forms contextually, but add "Manage QA Forms" as a small header action (visible `qa.manage`) and from the QA select in create-project ("+ New form"). **Priority: P2.**
**L-A3.** Profile placeholder sections (A-6) and "Gen2k" branding — remove (already P1/P3).

## M. Component-to-Purpose Wiring Issues — master list = I-F1; IA additions: `/org/leave` redirect targets a tab HR doesn't have (M→A-2); nav prefetch warms keys no page reads (C-4); palette "Admin Settings" → profile non-tab (1.18).

## N. Information Architecture Problems
The `/dashboard/org/…` URL segment leaks an internal concept (breadcrumb already skips it — formalize the label mapping) · "Communications" tab hosts a private utility (L-A1) · legacy `/admin/*` routes exist only for old links (A) · otherwise the IA (Work / Organization / Account) matches user concepts well.

## O. Role-Based Navigation Problems
Super Admin has **no personal attendance surface** (hidden by nav filter, Part 3) while the backend would allow it — decide and align · HR's Reports nav item is real but the route rejects everyone until A-1 · Employee nav is clean · multi-role users get exactly one buried role switcher (Profile → Workspace).

## P. Naming / Terminology
"My Attendance" / "Team Attendance" (E-A1, **P1**) · "My Tasks & Board" → "Tasks" (the label already varies by capability — simplify, **P3**) · Reports tabs (E-A3, P3) · "Directory" → optionally "People" (P3, low value) · everything else reads in user language.

## Q. Entity Workspace Opportunities
- **Employee 360** — exists, correct shape (Profile/Attendance/Leave/Projects & Tasks/Activity); *extend with actions* (K-A1) and it becomes the model workspace.
- **Project workspace** — exists (journey/team/activity inline); complete once edit dialog is real (B-7).
- **Task** — a Sheet, not a page: the right call (detail-in-context); don't "upgrade" it into a route tree.
- **Department/Designation/Conversation** — dialogs/panes are sufficient; building workspaces would over-consolidate.

## R. What Should NOT Be Changed
The redirect-stub consolidation pattern (it's why there are no duplicate pages) · the 11-item / 3-group nav size (Linear-class density; add nothing) · workspace-with-tabs over mega-pages everywhere it exists · role-gated nav filtering · the Employee-360 and Project workspaces' information architecture · contextual duplication of Message/Create-Task entries.

## S. Recommended Navigation Architecture (target state)

```
Overview
  Dashboard              /dashboard
  My Attendance          /dashboard/attendance          (rename)
  Projects & Tasks       /dashboard/projects            (QA management surfaced via header action)
  Communications         /dashboard/chat                (reminders relocated)
Organization
  People                 /dashboard/directory           (tabs: Directory | Management | Org Structure*)
  Team Attendance        /dashboard/org/attendance      (HR gains Approvals tab; rename)
  Reports                /dashboard/reports             (tabs: Summary Reports | Data Exports)
Account
  My Profile             /dashboard/profile             (+ role switch in avatar menu)
  Audit Logs             /dashboard/audit
  System Settings        /dashboard/settings

Entity workspaces (contextual, unchanged): Employee 360 (+actions) · Project (+real settings) · Task sheet
Redirects: keep 7 stubs one release after inbound-link audit → remove /admin/* + /org/leave
Delete now: approvals-tab.tsx, widgets/feedback-form.tsx
```

## T. Prioritized Additions (fold into Part 9/11 roadmaps)
**P0:** none new (A-1/A-2 remain the gate).
**P1:** Employee-360 manager action bar (K-A1) · attendance renames (E-A1) · project settings dialog completion (J/B-7, existing).
**P2:** QA management surfacing (L-A2) · reminders relocation (L-A1) · ExportButton pattern (B) · ActivityFeed consolidation (C) · delete dead duplicates (A).
**P3:** Org-Structure tab merge (I-1) · tab renames (E-A3) · "My Tasks & Board" → "Tasks" · /org label mapping · redirect-stub removal · Directory → People.

---

*Detector archive: `.impeccable/detect-frontend-audit.json` (26 findings; 3 vendor/test false positives). Component metrics (Part 6), layout distributions (Part 10), functional-fit measurements (Part 12), and IA verification (Part 14) measured 2026-08-28 from `apps/web/src` + `packages/ui/src`. Companion docs: `report.md` (backend/production audit — H/C-refs), `manual.md` (client manual).*
