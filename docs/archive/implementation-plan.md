> **ARCHIVED:** This file is stale and superseded by context.md and ix-3.md.

# Implementation Plan — Base Module (Phase 1) + Attendance Module (Phase 2)
## Games4King Workplace OS — Production-Ready Finalization (EXPANDED)

> **~280 tasks total**, organized into **deployable sets**. Complete each set → commit → push →
> auto-deploy to Vercel + Railway → verify the live workflows → proceed.
>
> **Source of truth (read order):** `openspec/REQUIREMENTS.md` (R1–R13) → `openspec/DESIGN-SYSTEM.md`
> (revised per DR-DS1) → `openspec/COMPONENT-SYSTEM.md` → `openspec/project.md` → this plan.
>
> **This plan was expanded after a full code-vs-requirements audit** that found ~30 critical gaps
> (capability-key mismatches breaking attendance/leave, non-functional forgot-password, missing User
> model relations crashing jobs, unregistered listeners, no density/mobile-cards/CI-guardrails, etc.).
> Those gaps are now tasks. Every R1–R13 requirement applicable to M1 is covered.

---

## LOCKED DECISIONS (all confirmed by owner)

| ID | Decision |
|---|---|
| **DR-DS1** | White canvas + dark charcoal primary (`#1A1A2E`) + soft gray + vibrant multi-color accents. Primary button = charcoal with animated rainbow gradient border on hover. ClickUp-inspired, clean, no AI-slop strokes. |
| **DR-COMP1** | All primitives migrate to `packages/ui`. |
| **DR-SCOPE1** | Each task is end-to-end (frontend + backend + verification). |
| **DR-APPROACH1** | Refactor in place, screen by screen (preserve working data flows). |
| **DR-ATT1** | Grace period (default 10 min, configurable) before "late." |
| **DR-ATT2** | Flexible single break (start/end anytime). |
| **DR-ATT3** | Forgot clock-out → flag + manual HR/Admin correction. |
| **DR-LEAVE1** | No balances in M1 (request + approve + history only). |
| **DR-HOL1** | Seed + full Admin CRUD in M1. |
| **DR-ONB1** | Minimal welcome screen. |
| **DR-DASH1** | Fixed per-role widget layouts (no drag/resize in M1). |
| **DR-CMD1** | Ctrl+K = navigation + actions only (no global search). |
| **DR-VER1** | Per-set deploy + verify. |
| **DR-PW1** | Password reset = Admin-approval flow + SMTP email option. Token-based, no identifier-only reset. |
| **DR-SL1** | Suspicious login → notify ALL Admins + HR via bell (Notification rows). |
| **DR-TIMER1** | Attendance timer = global Zustand store, 1s tick, persists across navigation. |
| **DR-ROUTE1** | Leave routing fixed by role: Employee→HR, HR→Admin, Admin→Admin (or super_admin). |
| **DR-MD1** | Master-data: export + activate/deactivate + search/filter/pagination/audit. NO import in M1. |
| **DR-RPT1** | M1 reports = attendance + leave reports (date-range summaries, exportable). |
| **DR-QT1** | Quick Task Assignment widget = true empty state (Tasks are a future module). |
| **DR-NOT1** | Bell dropdown + full notification page (filterable, paginated). No chat integration yet. |
| **DR-CI1** | Full CI guardrails: axe-core + Lighthouse CI + bundle-size check + web-vitals collection. |
| **DR-MOB1** | DataTable auto card-transform on mobile (<768px → stacked cards). |
| **DR-DEN1** | Comfortable (default) + Compact density modes. Toggle in avatar menu + settings. Persisted. |
| **DR-RTE1** | Approvals: fixed Employee→HR→Admin routing. |

**Task tags:** `[spec]` [api] [ui-pkg] [web] [test] [seed] [deploy] [docs] [fix]

---

# PHASE 1 — BASE MODULE (~140 tasks)

## SET 1A — Critical Backend Fixes + Design System Foundation (Tasks 1–20)

> **Why this set comes first:** The audit found BLOCKING bugs that break attendance/leave for non-admin
> users and crash scheduler jobs. These must be fixed before any UI work matters. Plus the design-system
> revision and packages/ui foundation that everything else builds on.

### 1. [fix][api] Add `roles()` + `roleAssignments()` relations to User model
`Models/User.php` — add `public function roles(): HasMany { return $this->hasMany(RoleAssignment::class); }`
and alias `roleAssignments`. Without these, `UserController.store/update` (calls `$user->roleAssignments()->create()`),
`NotifyApprovalSubmitted`, `AlertMissedClockIn`, `FlagOpenShifts` all crash with BadMethodCallException.
**Verify:** `php artisan tinker` → `User::find(1)->roles` returns collection; no BadMethodCallException anywhere.

### 2. [fix][api] Fix capability-key mismatches (BLOCKING — breaks attendance + leave)
Audit found controller-level `middleware()` declarations use WRONG keys (`employee.clock-self`,
`employee.leave.request-self`, `hr.leave.approve-employee`, `admin.leave.approve-hr`) while seeded keys
are `attendance.clock-self`, `leave.request-self`, `leave.approve-employee`, `leave.approve-hr`. Route-level
middleware uses correct keys (so it works), but the controller-level dead middleware is confusing. Remove
all controller-level `middleware()` declarations (routes already gate). Verify every route's capability
string matches the seeded key EXACTLY.
**Verify:** `php artisan route:list` — every capability-gated route shows the correct seeded key; Employee can clock in; HR can approve leave.

### 3. [fix][api] Fix FlagOpenShifts job — wrong column name
`Jobs/FlagOpenShifts.php:34,52` writes to `notifications.message` but the column is `body`
(`2026_08_09_020003_create_phase_6_tables.php:59`). Fix: change `message` → `body`. Also delete the
duplicate `Console/Commands/FlagOpenShifts.php` (dead code, not scheduled, has N+1). Keep only the Job.
**Verify:** run `php artisan tinker` → dispatch FlagOpenShifts → no SQL error; notification row created.

### 4. [fix][api] Register NotifyApprovalSubmitted listener
`AppServiceProvider.php:26-29` — only `LeaveAttendanceIntegration` is wired to `ApprovalDecided`.
`ApprovalSubmitted` event fires (`ApprovalService.php:37`) but NO listener catches it → approvers get
no notification on submission (R6.8 broken). Add `Event::listen(ApprovalSubmitted::class,
NotifyApprovalSubmitted::class)` to the boot() method. Verify the listener's `whereHas('roles', ...)`
calls work after task 1.
**Verify:** submit a leave request → approver receives a Notification row → bell shows it.

### 5. [fix][api] Remove `/debug/logs` public endpoint (SECURITY HOLE)
`routes/api.php` line ~30-32 exposes `/debug/logs` returning the full `laravel.log` with no auth/env
guard. Remove this route entirely. It leaks sensitive data (stack traces, DB queries, credentials).
**Verify:** `GET /api/debug/logs` → 404; grep confirms route removed.

### 6. [fix][api] Fix Notification table — add `priority` column
R8.10 requires "high-priority + system-global only" distinction. The `notifications` table has no
`priority` column. Add migration: `$table->string('priority')->default('normal')` (values: urgent, high,
normal, low). Update NotificationService to accept priority. Suspicious-login = urgent; approvals = high;
announcements = normal.
**Verify:** notification with priority=urgent renders distinctively in bell (red dot/border).

### 7. [fix][api] Fix NotificationController — add unread count + mark-all-read + filter
R8.10 requires unread count + history + mark-read. Current `NotificationController` has index + markRead
(one-at-a-time). Add: `GET /notifications/unread-count` → `{count: N}`; `POST /notifications/mark-all-read`;
`GET /notifications?unreadOnly=true` filter; `GET /notifications?page=2` pagination.
**Verify:** unread-count endpoint returns correct N; mark-all-read clears all; filter works.

### 8. [spec][docs] Record DR-DS1 design system decision
Create `openspec/changes/phase-1-redesign/proposal.md`. Update `DESIGN-SYSTEM.md` §1-3: charcoal primary
(`#1A1A2E`), brand colors repositioned as accent palette, add the full accent rotation (violet/orange/
coral/red/pink/magenta/blue/indigo/cyan/teal/green/lime/gray), define the rainbow-hover primary button
spec. No contradictions with REQUIREMENTS.md.
**Verify:** DESIGN-SYSTEM.md updated; proposal.md exists; every module has a distinct accent color.

### 9. [spec] Define accent → module/category mapping
Dashboard=blue, Attendance=green, Leave=amber, Directory=pink, Org=indigo, Settings=teal, Audit=rose,
Profile=cyan, Notifications=orange. Chart palette (12-color). Category-tag palette (designations, leave
types). Document in DESIGN-SYSTEM.md §1.2.
**Verify:** mapping table in DESIGN-SYSTEM.md; all colors WCAG-AA accessible on white.

### 10. [spec] Define rainbow-hover primary button interaction
Default = `bg-charcoal`; hover = animated conic-gradient border rotating through accent palette (3s
linear infinite), subtle box-shadow glow; active = 0.96 compress (120ms); loading = dot-loader; disabled
= 40% opacity; reduced-motion = static subtle border (no animation). Document in DESIGN-SYSTEM.md §8.2 +
COMPONENT-SYSTEM.md §1.
**Verify:** spec complete; reduced-motion fallback defined.

### 11. [web] Revise globals.css tokens to DR-DS1
`apps/web/src/app/globals.css`: `--color-primary` → charcoal `#1A1A2E`; brand-violet/pink/gold → accent
tokens; add full accent palette CSS vars (`--accent-blue`, `--accent-green`, etc.); remove ALL hardcoded
`from-violet-900`/`purple-900`/`indigo-900`.
**Verify:** grep finds zero generic gradients; all tokens centralized; dark mode correct.

### 12. [ui-pkg] Set up packages/ui package structure
`packages/ui/package.json` exports: `./components`, `./hooks`, `./theme`, `./types`. Set up
`src/components/`, `src/hooks/`, `src/theme/`. Build via tsup. Wire `apps/web/tsconfig.json` paths
(`@g4k/ui` → `packages/ui/src`). Verify `import { Button } from "@g4k/ui"` resolves.
**Verify:** `pnpm --filter @g4k/ui build` succeeds; apps/web import works.

### 13. [ui-pkg] Create shared theme tokens in packages/ui/src/theme/
Export all design tokens as both CSS-vars and JS objects: surfaces, text, borders, semantic, accent
palette, charcoal primary, shadows, radius, spacing, motion durations. Export `themePreset` for Tailwind
v4 + `echartsTheme` for charts (token-mapped, light+dark).
**Verify:** tokens.ts exports all values; echartsTheme consumes them.

### 14. [ui-pkg][web] Migrate Button → packages/ui (with rainbow-hover)
Move `button.tsx`. Implement DR-DS1 rainbow-hover primary variant. Variants: primary (charcoal + rainbow
hover), secondary, outline, ghost, destructive, success. Sizes: sm/md/lg/icon. All states per
COMPONENT-SYSTEM §1. Add `RainbowBorder` utility.
**Verify:** 6 variants render; rainbow hover animates; reduced-motion disables animation.

### 15. [ui-pkg][web] Migrate Input, Textarea, PasswordInput → packages/ui
Move all three. PasswordInput show/hide toggle (R1.2). Error variant. Export `useDebouncedValidation`
hook (400ms pause per R13.16).
**Verify:** focus ring visible; password toggle; error border + message.

### 16. [ui-pkg][web] Migrate Card, Label, Separator → packages/ui
Card: `bg-surface`, `rounded-lg`, `shadow-e1`, hover-lift e2 (100ms). Label: required `*` red marker.
Separator: themed.
**Verify:** Card lifts on hover; required marker red.

### 17. [ui-pkg][web] Migrate Badge, StatusBadge → packages/ui
Add `StatusBadge` mapping (R11.4): neutral=gray, info=blue, warning=amber, success=green, danger=red.
Dot+label compact variant. Used EVERYWHERE for status (enforces consistency per audit finding).
**Verify:** all 5 status colors render; dot variant works.

### 18. [ui-pkg] Create Avatar component (MISSING)
`packages/ui/src/components/avatar.tsx` (Radix Avatar). Sizes xs/sm/md/lg. Fallback = initials on
accent-tinted bg (color from name-hash for consistency). Loading = skeleton. AvatarGroup (overlapping,
+N overflow). Aspect-ratio reserved (CLS prevention). Replace ALL hand-rolled gradient-div avatars
(directory, users, topbar, chat).
**Verify:** image + fallback + group + skeleton all work; no hand-rolled avatars remain.

### 19. [ui-pkg] Create Progress component (MISSING)
`packages/ui/src/components/progress.tsx` (Radix Progress). Animates 0→value (600ms). Color = success at
100%, warning when overdue, accent default. Striped variant for indeterminate.
**Verify:** animates on mount; color at 100%; stripe variant.

### 20. [ui-pkg] Create Combobox component (MISSING)
`packages/ui/src/components/combobox.tsx` (Popover + Command). Debounced 250ms server search (R13.15);
instant client filter ≤200 items. Loading spinner, empty "No matches", selected check. Keyboard nav.
**Verify:** 250ms debounce; keyboard operable; clearable; empty state.

### 21. [deploy] Deploy Set 1A — verify critical fixes + foundation
Commit, push, deploy. Verify: Employee can clock in (capability fix), leave notifications fire (listener
fix), FlagOpenShifts doesn't crash, `/debug/logs` is 404, packages/ui builds + imports resolve.
**Verify:** all blocking bugs fixed in production; foundation solid.

---

## SET 1B — Shared Component Library + Missing Primitives (Tasks 22–42)

### 22. [ui-pkg] Create EmptyState component (standardize)
`packages/ui/src/components/empty-state.tsx`. Props: icon (Lucide) OR videoSrc, title, description,
optional action. Exact copy per context (R3.13). Copy `animated-logo.mp4` from `Images, SVG, PDF/` to
`apps/web/public/` (audit found it's MISSING).
**Verify:** icon + video render; action button; copy matches spec.

### 23. [ui-pkg][web] Migrate Dialog, AlertDialog → packages/ui
Dialog: create/edit forms. AlertDialog: destructive confirmations (red Confirm). Backdrop blur (e4),
280ms fade+scale. Focus trap, Esc closes (Dialog only), restore focus. Full-screen on mobile.
**Verify:** focus trapped; Esc closes Dialog; AlertDialog requires explicit confirm; mobile full-screen.

### 24. [ui-pkg][web] Migrate Sheet, Popover, Tooltip → packages/ui
Sheet: right (420px default)/left/top/bottom, 200ms slide. Mobile nav + filters + detail panels.
Popover: date pickers, filters, avatar menu. Tooltip: 150ms delay, every icon-only button shows label,
not on touch, disabled-element wrapper.
**Verify:** Sheet slides; Popover edge-collision; Tooltip on hover/focus not touch.

### 25. [ui-pkg][web] Migrate DropdownMenu, ContextMenu → packages/ui
DropdownMenu: row actions, avatar menu, sort. ContextMenu: right-click bulk actions, quick-status, pin
(R11.8). Items: default/destructive/checkbox/separator/label/shortcut. Keyboard nav.
**Verify:** keyboard navigable; destructive red; context menu on right-click.

### 26. [ui-pkg][web] Migrate Select, Checkbox, Switch, RadioGroup, Slider → packages/ui
Select (Combobox for >8). Checkbox (indeterminate for select-all). Switch (theme/prefs). RadioGroup
(leave type). Slider (progress 0-100%, live preview, commit on release).
**Verify:** select keyboard nav; checkbox indeterminate; slider live preview.

### 27. [ui-pkg][web] Migrate Tabs, Accordion, Collapsible, ScrollArea → packages/ui
Tabs: lazy mount per tab (R13.8). Accordion: activity grouping (180ms height). Collapsible: advanced
options. ScrollArea: sidebar, themed thin scrollbar.
**Verify:** tabs lazy-mount; accordion smooth; scroll-area themed.

### 28. [ui-pkg][web] Migrate Form system + wire useFormDraft (R3.7)
Move Form/FormField/FormItem/FormControl/FormMessage. Required `*` markers. Sectioned forms
(`FormSection`). **Wire `useFormDraft`** (exists but unused per audit) into long forms: 30s autosave to
IndexedDB, restore banner on reopen ("Unsaved draft restored. Discard?").
**Verify:** validation errors under fields; autosave writes IndexedDB; restore banner shows.

### 29. [ui-pkg][web] Migrate Skeleton, ErrorBoundary, OfflineBanner, Toaster → packages/ui
Skeleton: shaped to content (card/row/text), first-load only. ErrorBoundary: per-widget (R13.21).
OfflineBanner: shows when `navigator.onLine === false`, queue count. Toaster: top-right, 4s, richColors,
retry action. Fix R3.7 deviation: success toasts should be top-right (matching current, not bottom-right
— confirm consistency).
**Verify:** skeleton matches shape; widget error doesn't block; offline banner; toast 4s.

### 30. [ui-pkg][web] Rebuild DataTable with FULL feature set
Migrate to packages/ui. ADD: memoized rows (`React.memo` + stable keys, NOT index keys per audit),
cursor pagination (consumers pass fetchNextPage/hasNextPage), column visibility toggle, row selection
(checkbox → bulk actions), saved views, sticky header + first column, density-aware row height, inline
edit (pencil → Enter/Escape per R3.9). No anonymous callbacks in props (R13.12).
**Verify:** 5000-row render ≤ visible+overscan nodes; 60 FPS; sort/select/pagination work.

### 31. [ui-pkg][web] DataTable — auto card-transform on mobile (DR-MOB1, R13.22)
On `<768px`: DataTable renders stacked cards (one per row, label:value pairs) instead of a table. Configurable:
which columns show in card view, card layout (vertical/key-value). Automatic — no per-page work needed.
**Verify:** at 360px → cards; at 1024px → table; transition smooth; all data visible.

### 32. [ui-pkg] Create FilterBar with all R3.8 features
Move + complete. Search (250ms debounce), status multi-Checkbox, DatePicker range, dept/team Combobox,
priority Combobox, sort Select + direction IconButton, ClearAll link. **Active filters as removable
chips** (FilterChip = Badge + X). **URL sync** (changes update URL + cache, no reload per R13.15).
Mobile → "Filters" Sheet.
**Verify:** 250ms debounce; chips removable; URL updates; mobile collapses to Sheet.

### 33. [ui-pkg] Create Pagination component (cursor-based, R13.6)
Page numbers + page-size Select (default 20, options 50/100 per R3.10). Cursor-based. "Load more"
infinite variant for scroll lists.
**Verify:** cursor pagination; page-size changes; infinite variant triggers on scroll.

### 34. [ui-pkg] Migrate Breadcrumb → packages/ui (R3.4)
Auto-generate from pathname + overrides. Each crumb a Link. Truncates middle with ellipsis on narrow.
Hidden on root dashboard.
**Verify:** crumbs clickable; truncates mobile; hidden on root.

### 35. [ui-pkg] Migrate CommandDialog → packages/ui (Ctrl+K, DR-CMD1)
Navigation + actions only (no data search per DR-CMD1). Actions: navigate, create-new (context),
pin/unpin, toggle theme, open recent. Keyboard-first; recent items first; grouped.
**Verify:** Ctrl+K opens; keyboard operable; navigation + theme work.

### 36. [ui-pkg] Create HelpOverlay (Ctrl+/, R3.11)
Shortcut overlay showing all keyboard shortcuts (Ctrl+K, Ctrl+B, Ctrl+N, Ctrl+/, Esc, Enter). Triggered
by Ctrl+/ or avatar menu → "Keyboard Shortcuts". Modal or Sheet.
**Verify:** Ctrl+/ opens; all shortcuts listed; Esc closes.

### 37. [ui-pkg] Create ConfirmDialog (standardized destructive confirm, R3.9)
Wraps AlertDialog with consistent copy: "Are you sure?" + description + Cancel + red Confirm. Used for
ALL destructive actions (delete, deactivate, revoke, reject). Prevents ad-hoc confirm implementations.
**Verify:** renders consistently; red Confirm; Esc cancels.

### 38. [ui-pkg] Create FileUploadPopup (R11.3 — for profile photo, project images)
Radix Dialog-based popup: drag-drop + click, preview thumbnail, client-side validation (type/size before
upload), format + size limits displayed. Optimistic preview. Used for profile avatar, (future) project
images, chat attachments.
**Verify:** drag-drop works; preview shows; validation rejects invalid; uploads to Supabase.

### 39. [web] Copy animated-logo.mp4 to public/ (audit found it MISSING)
`Images, SVG, PDF/animated-logo.mp4` → `apps/web/public/animated-logo.mp4`. Used by EmptyState (R3.13)
and loading states. Also optimize: ensure it's reasonably sized (<2MB) for web.
**Verify:** `/animated-logo.mp4` loads; EmptyState video renders.

### 40. [web] Replace ALL `<img>` with next/image (R13.9)
Audit found plain `<img>` in `dashboard/layout.tsx:210,272`, `profile/page.tsx:163`. Replace with
`next/image` (WebP/AVIF, responsive, lazy, blur placeholder). Logos, avatars, all images.
**Verify:** grep finds zero `<img` in src/ (only next/image); blur placeholders show.

### 41. [web] Fix touch targets to ≥44px (R13.22 audit finding)
Audit found buttons at 32px (`w-8 h-8`). Fix: icon buttons min 44×44px (48px on mobile attendance).
Sidebar collapse button, notification mark-read, search stub, all interactive icons.
**Verify:** all interactive elements ≥44px; mobile attendance ≥48px.

### 42. [deploy] Deploy Set 1B — verify all components + mobile cards + accessibility
Commit, push, deploy. Verify: component showcase renders all primitives; DataTable card-transform works
on mobile; touch targets correct; all `<img>` replaced.
**Verify:** all components render; mobile cards work; no console errors.

---

## SET 1C — App Shell, Navigation, Theme, Keyboard (Tasks 43–62)

### 43. [web] Refactor root layout — fonts, providers, metadata, PWA
`app/layout.tsx`: Inter (sans) + Sora (display) via next/font, `display: swap`, preloaded. Wire Providers
(ThemeProvider, QueryClient, Toaster, OfflineBanner, ErrorBoundary). Metadata: title, Favicon.png, manifest,
theme-color. SW registration. **Fix PWA manifest icons** (audit: same 1.7MB file for 192+512 — generate
proper sizes or use icon set).
**Verify:** fonts load; metadata correct; manifest icons correct size; SW registers.

### 44. [web] Rebuild AppShell layout structure
`dashboard/layout.tsx` → clean `<AppShell>`: TopBar (sticky, e4 blur on scroll), Sidebar (left), Content
(max-width 1440px lists, fluid dashboards), CommandDialog, OfflineBanner, HelpOverlay. CSS grid. Reserved
sidebar width (CLS prevention).
**Verify:** grid correct at all breakpoints; sidebar reserved; topbar sticky + blurs.

### 45. [web] Rebuild TopBar — logo, wordmark, search, bell, avatar
Left: square logo (28×28) + "Workplace OS" (Sora 700). Center: search-stub (Ctrl+K hint). Right:
NotificationsBell, Avatar dropdown (profile/settings/theme/density/logout/shortcuts). Dark/neutral bg.
Use Avatar component (not hand-rolled div).
**Verify:** logo + wordmark; Ctrl+K opens; avatar menu works; bell shows count.

### 46. [web] Rebuild Sidebar — 3-state + module accent icons + density-aware
3-state (expanded 264 / collapsed 72 / hidden), default collapsed, Ctrl+B cycle. Nav items: small Lucide
icon (module accent color) + label. Active = tinted bg + 3px left bar (accent) + weight 600. Hover =
surface-2. Section headers (expanded) / dividers (collapsed). Persist via `/auth/preferences`.
**Verify:** 3 states; Ctrl+B; accent active; persists on reload.

### 47. [web] Add Pinned Items section to sidebar (R3.5 — MISSING)
Bottom of sidebar (divider-separated): pinned projects/tasks/profiles. Star toggle on hover. Removable.
Collapsed = icon + tooltip. Backend: `/pins` endpoint or preferences JSON. (Projects/Tasks are future
modules, but the pin infrastructure works for any entity.)
**Verify:** pin toggle works; appears in section; persists; unpin removes.

### 48. [api] Create/verify Pins endpoint
Verify `pins` table exists (migration `2026_08_09_020000`). Create `PinController`: index (user's pins),
store (entity_type + entity_id + label + icon), destroy. Capability: any authenticated user. Used by
sidebar pinned section.
**Verify:** CRUD works; pins scoped to user; sidebar reads from this.

### 49. [web] Rebuild mobile navigation
Mobile (≤768): sidebar hidden. Hamburger → full-screen Sheet (280ms slide). Bottom nav (≤5): Dashboard,
Directory, Clock FAB (→ attendance), Org, Profile. ≥48px targets. Delete duplicate `components/layout/
bottom-nav.tsx`.
**Verify:** hamburger opens Sheet; bottom nav 5 items; 48px targets; no duplicate.

### 50. [web] Role-aware navigation tree
Sidebar filtered by active role capabilities (`/me/capabilities`). Super Admin = all. HR = team-scoped.
Employee = self-scoped. Every nav item maps to a canonical capability key. No orphan items.
**Verify:** Employee sees no admin items; HR sees team items; Admin sees all.

### 51. [fix][web] Add route-level middleware for capability guards (R1.12)
Create `apps/web/src/middleware.ts`: check auth token + capability for protected routes. Map URL patterns
to required capabilities (e.g., `/dashboard/org/users` → `users.hr.manage`). Redirect to /dashboard with
toast if lacking capability. This closes the audit gap where users could deep-link to unauthorized pages.
**Verify:** Employee deep-links to /dashboard/org/users → redirected + toast; HR can access team pages.

### 52. [web] Implement density control (DR-DEN1, R3.2 — MISSING per audit)
Density toggle (avatar menu + settings): Comfortable (default, 48px rows, 20px padding) / Compact (36px
rows, 12px padding). Read by DataTable, list items, card padding. Persist via Zustand + `/auth/preferences`.
**Verify:** toggle changes row heights everywhere; persists on reload.

### 53. [web] Implement theme engine (light/dark + persistence)
Theme toggle (avatar menu + command palette + sidebar footer). next-themes (class strategy). Both modes
colorful per DESIGN-SYSTEM. Persist via next-themes + sync to `/auth/preferences`.
**Verify:** theme toggles + persists; both modes colorful; density + theme independent.

### 54. [web] Keyboard shortcut layer (R3.11)
Global handler: Ctrl+K (palette), Ctrl+B (sidebar), Ctrl+N (context new — opens relevant create dialog),
Ctrl+/ (help overlay), Esc (close overlays), Enter (submit/confirm). No conflicts with form inputs.
**Verify:** all shortcuts fire; no conflicts; help overlay lists them.

### 55. [web] PageContainer wrapper (consistency)
`<PageContainer>`: 24px gutter, breadcrumb slot, page title (Sora 700), optional action buttons slot,
content area. Every dashboard page uses it.
**Verify:** all pages consistent padding/title/actions/breadcrumb.

### 56. [web] Wire Reverb realtime client
`pusher-js`/Reverb in a provider. Private channels (user notifications, session revoked). Connect on
login, disconnect on logout. Used by NotificationsBell, AuthGuard.
**Verify:** connects post-login; receives broadcast; disconnects on logout.

### 57. [web] Fix API client — token source, 401 handling, retry
`api-client.ts`: reads token from Zustand store (not localStorage). 401 → ONE silent refresh → if fails,
redirect. Skips auth endpoints. `credentials: include`. Add `getToken()` helper for non-React contexts
(export download). General GET retry with backoff (R13.20).
**Verify:** token from store; refresh-once; auth endpoints skipped; GET retries with backoff.

### 58. [web] TanStack Query defaults + offline mutation queue
staleTime 5min, gcTime 30min, refetchOnWindowFocus false, retry backoff. Offline mutation queue
(IndexedDB): mutations queue when offline, sync on reconnect (R13.20). OfflineBanner shows queue count.
**Verify:** cached data instant on revisit; offline mutations queue; sync on reconnect.

### 59. [web] Delete dead code
Remove: `components/theme-provider.tsx`, `components/global-command.tsx`, `components/layout/bottom-nav.tsx`.
Clean orphan imports. `tsc --noEmit` passes.
**Verify:** tsc passes; no dead components; no broken imports.

### 60. [web] Implement debounce on ALL search inputs (R13.15 audit gap)
Audit: search fires per-keystroke. Wire 250ms debounce on: directory search, users search, projects
search, all FilterBar search inputs. Use `useDebouncedValue` hook.
**Verify:** network tab shows 250ms debounce; no per-keystroke requests.

### 61. [web] Sync filters to URL on ALL list pages (R13.15 audit gap)
Audit: filters don't update URL. Wire `useSearchParams` + `router.replace` on: directory, users,
departments, designations, attendance, leave, audit. Filters reflect in URL; page reload preserves
filters; shareable URLs.
**Verify:** URL updates on filter change; reload preserves filters; URL is shareable.

### 62. [deploy] Deploy Set 1C — verify shell + navigation + middleware live
Commit, push, deploy. Verify (all 3 roles): shell renders, sidebar 3-state, mobile nav, theme + density
toggle, Ctrl+K/B/N//, breadcrumbs, route middleware blocks unauthorized deep-links, debounce + URL
filters work, no console errors.
**Verify:** complete shell + navigation works in production for all roles.

---

## SET 1D — Auth Flows: Login, Reset, Profile, Sessions (Tasks 63–85)

### 63. [fix][api] Implement password reset with tokens (DR-PW1 — fix security hole)
Current: `resetPassword` accepts any identifier without a token. Fix: `forgotPassword` generates a random
token, stores in `password_reset_tokens` (table exists), sends via SMTP (if configured) OR creates a
PendingPasswordReset notification for Admin. `resetPassword` REQUIRES token + identifier + new password.
Token expires after 60 min. Invalidate after use.
**Verify:** reset without token → 422; with valid token → succeeds; expired token → 422; token invalidated after use.

### 64. [api] Admin-approval password reset flow (DR-PW1, R1.6)
When channel=admin: create a `password_reset_requests` row (status=pending) + Notification for all
super_admin users. Admin sees pending requests in a queue → approves → system generates token → user
notified (bell + next-login forced reset screen). Admin rejects → user notified.
**Verify:** admin channel → request appears in admin queue; approve → user can reset; reject → user notified.

### 65. [api] Configure SMTP for password reset emails (DR-PW1)
Wire Laravel Mail: `PasswordResetMail` mailable. SMTP credentials in Railway env. When channel=smtp:
send email with reset link (`{frontend_url}/reset-password?token=xxx`). Always return 202 (prevent
enumeration). If SMTP not configured, fall back to log + admin-notification.
**Verify:** smtp channel → email sent (check Mailtrap/log); 202 returned; link works.

### 66. [fix][api] Server-side enforcement of must_change_password (R1.9)
Add middleware `ForcePasswordChange`: if `user.must_change_password === true` AND route is not
`/auth/change-password` AND not `/auth/logout` → return 403 with `{must_change_password: true}`. Apply
to all `auth:sanctum` routes. Seeder sets `must_change_password=true` for seeded users.
**Verify:** seeded user with must_change=true → any API call → 403; after change-password → 200.

### 67. [fix][api] Server-side enforcement of onboarding (R1.10)
Add to ForcePasswordChange middleware: if `user.onboarded_at === null` AND route is not
`/auth/onboarding/complete` → return 403 with `{needs_onboarding: true}`. Apply after password check.
**Verify:** user without onboarded_at → API call → 403; after complete → 200.

### 68. [api] Suspicious-login notification (DR-SL1, R1.8)
On suspicious login (new IP): create Notification rows (priority=urgent) for ALL super_admin + hr users.
Include user name, IP, timestamp, user-agent. Bell shows urgent indicator. Optionally email admins.
**Verify:** suspicious login → all admins+HR get notification; bell shows urgent; notification has details.

### 69. [api] Capture IP + user-agent on token creation (R1.11 gap)
`AuthController.login/refresh`: set `$accessToken->forceFill(['ip_address' => $request->ip(), 'expires_at'
=> now()->addMinutes(15)])->save()` on access tokens; same for refresh (expires 7 days). Session list
shows IP + last-used. Access tokens now expire (15min) → forces refresh.
**Verify:** token has ip_address + expires_at; sessions list shows IP; expired token → 401 → refresh.

### 70. [api] Rate-limit roleSelect + forgotPassword (audit: enumeration risk)
Add rate limiting: `roleSelect` 10/min per user; `forgotPassword` 5/15min per identifier+IP. Prevents
brute-force + enumeration.
**Verify:** exceeds limit → 429; normal use unaffected.

### 71. [web] Redesign login screen to DR-DS1
`login/page.tsx`: white bg (NOT purple gradient). Centered Card. Landscape logo (max-height 96px) on
contained brand-gradient hero strip. Charcoal primary "Sign In" with rainbow hover. Inter labels, Sora
title. Info tooltip (R1.1 exact copy). Forgot link. All `@g4k/ui` primitives.
**Verify:** white bg, charcoal button, correct logo, info tooltip copy; no AI-slop gradient.

### 72. [web] Login form — validation, loading, lockout display (R1.3/R1.7)
RHF + Zod. 400ms debounce validation. Dot-loader on button (not spinner per audit). Failure → toast +
inline. Lockout (423) → show countdown timer + "Try again in X minutes." Attempts remaining display.
**Verify:** invalid → inline error; lockout → countdown; loading → dot-loader.

### 73. [web] Login redirect logic — verify all branches
`must_change_password` → /change-password; `!onboarded` → /onboarding; dual role → /role-select; else →
/dashboard. After change-password → onboarding (if needed) → dashboard. After onboarding → dashboard.
**Verify:** each branch redirects correctly for each user state.

### 74. [web] Redesign forgot-password + reset-password (DR-PW1)
Forgot: identifier + channel selector (SMTP / Admin Approval). Always shows "If the account exists..."
after submit (202). Reset: token (from URL param) + new password + confirm. Strong policy. Success →
redirect to login + toast.
**Verify:** forgot shows channel selector + 202 message; reset validates token + policy; redirect works.

### 75. [web] Redesign change-password screen
Current + new + confirm. Strong policy (min 8, mixed+number+symbol). Validate current (server). Success
→ correct next step (onboarding or dashboard). Loading state. Consistent design.
**Verify:** wrong current → error; weak → policy error; success → correct redirect.

### 76. [web] Redesign role-select (R1.4)
Grid of role cards (Button variant). Each: role name, icon (accent-colored), brief desc. Click → POST
/auth/role-select → that role's dashboard. Loading state. If single role → skip entirely.
**Verify:** dual-role user sees both; selecting lands on dashboard; single-role skips.

### 77. [web] Redesign onboarding (DR-ONB1)
Minimal welcome: confirm name/role/department (read-only), "Get Started" → POST /auth/onboarding/complete
→ dashboard. animated-logo.mp4 accent. No multi-step.
**Verify:** new user → welcome → Get Started → dashboard.

### 78. [web] AuthGuard — fix refresh + enforce guards + Reverb session-revoke
On load: if token → check must_change_password (server 403) + needs_onboarding (server 403). If no token
→ silent refresh via cookie → success: setAuth + re-check; fail: stay on auth route / redirect to login.
Reverb `SessionRevoked` → clearAuth + redirect. No loops.
**Verify:** reload stays logged in; 403 must-change → /change-password; 403 onboarding → /onboarding; session revoked → login.

### 79. [web] Profile page — redesign + real data + Supabase avatar
`profile/page.tsx`: header card (Avatar, name, designation, dept — accent-tinted bg, no generic gradient).
Edit form (name, phone, designation) → PUT /profile. Avatar upload via FileUploadPopup → Supabase
Storage. Fix audit bug: apiFetch returns parsed JSON (not raw Response — remove res.ok/res.json).
**Verify:** profile loads real data; edit saves; avatar uploads + displays via next/image.

### 80. [web] Profile — change password section
Within profile: change-password form (current + new + confirm). Strong policy. Success toast. Uses
shared ConfirmDialog or inline form.
**Verify:** change password from profile; policy enforced; toast.

### 81. [web] Profile — device/session list with shared DataTable + remote logout
Replace hand-rolled `<table>` with DataTable. Columns: device, IP, last used, current badge, revoke.
Revoke → ConfirmDialog → DELETE /auth/sessions/{id} → optimistic remove. Reverb logs out that device.
**Verify:** sessions in DataTable; revoke confirms + removes optimistically; revoked device logs out.

### 82. [web] Profile — visibility preferences (R2.10)
Toggle: public / internal / private. Affects directory visibility (phone/email visible if public or
internal; sensitive fields ALWAYS hidden). Persist via PUT /profile or /auth/preferences.
**Verify:** toggle changes directory visibility; sensitive fields always hidden.

### 83. [test][api] Write auth feature tests
Login (email/username/employee_id); wrong password → 422; lockout 5/600s → 423; refresh rotation +
reuse-revocation; role-select; change-password policy; forgot-password token flow; reset with/without
token; force-change middleware (403); onboarding middleware (403); suspicious-login notification.
**Verify:** `php artisan test` — all auth tests pass.

### 84. [test][web] Write auth + profile component tests
LoginForm (validation, submit, lockout display, redirect logic), AuthGuard (refresh, 403 handling,
session-revoke), ProfileForm (validation, avatar upload mock), SessionList (revoke optimistic).
**Verify:** Vitest — all tests pass; no regressions.

### 85. [deploy] Deploy Set 1D — verify all auth flows live
Commit, push, deploy. Verify live: login (3 roles), reload persistence, lockout countdown, forgot/reset
(token flow), change-password, force-first-change, suspicious-login notification, device revoke, profile
edit + avatar, visibility toggle.
**Verify:** complete auth + profile lifecycle works in production.

---

## SET 1E — Org Management: Users, Departments, Designations, Directory (Tasks 86–110)

### 86. [fix][api] Fix UserController — separate HR vs Employee creation gates
Audit: route uses `users.hr.manage` for BOTH HR + Employee creation. Fix: `POST /users` checks target
role — if creating HR → requires `users.hr.manage`; if creating Employee → requires
`users.employee.manage`. Update route middleware to accept both: `capability:users.hr.manage|
users.employee.manage`. Controller validates target role is valid (super_admin/hr/employee).
**Verify:** Admin with users.employee.manage can create employees but not HR; both gates work.

### 87. [api] UserController — add search/filter/pagination improvements
Verify index: search (name/email/employee_id/username), filter (department, status, role), cursor
pagination, eager-load dept/designation/roles (no N+1). Add `role` filter param. Response includes
member counts where relevant.
**Verify:** search filters; dept filter; status filter; role filter; pagination cursor; query ≤5.

### 88. [api] UserController — add export endpoint (DR-MD1, R2.9)
`GET /users/export` → Excel/CSV download. Filters apply (same as index). Streams file. Capability:
users.hr.manage. Uses spatie/simple-excel (already in composer.json). Columns: all user fields.
**Verify:** export downloads valid file; filters apply; capability enforced.

### 89. [api] UserController — add activate/deactivate (DR-MD1, R2.9)
Deactivate = status→inactive (exists). Activate = status→active. Endpoint: `PATCH /users/{id}/status`
with `{status: active|inactive}`. Last-super-admin guard. Audit logged. Optimistic-ready.
**Verify:** deactivate → can't login; activate → can login; last-admin guard; audit written.

### 90. [api] Add per-user activity log endpoint (R2.4/R2.6)
`GET /users/{id}/activity` → paginated audit logs for that user (actions they performed). Admin sees any
user; HR sees own team; Employee sees self. Capability-gated.
**Verify:** returns user's audit entries; scoped correctly; paginated.

### 91. [web] Users page — redesign with DataTable + FilterBar + all features
`org/users/page.tsx`: PageContainer + DataTable (memoized, virtualized, cursor pagination, column
visibility, row selection for bulk) + FilterBar (search 250ms debounce, status filter, dept filter, role
filter). Columns: Avatar+name, employee_id, email, dept (Badge), designation, roles (Badges), status
(StatusBadge). Row click → edit Sheet. URL-synced filters.
**Verify:** loads 13 users; search debounced; filters work; URL updates; 60 FPS.

### 92. [web] Users page — create dialog (R2.3/R2.5)
Form: name, email, employee_id (auto-numbered), username, password, department (Combobox), team,
designation (Combobox), system roles (Checkbox group for dual-role). Auto-numbering preview (shows
"G4K014" before save). Validation + loading + success toast. POST /users.
**Verify:** create → appears in table; auto-number preview; validation; audit written.

### 93. [web] Users page — EDIT dialog (audit gap G4)
Add Edit dialog (pre-filled create form) → PUT /users/{id}. Edit: name, email, dept, designation, roles,
team, status. Separate from password (reset). Row action or click row.
**Verify:** edit → changes persist; table updates; audit written.

### 94. [web] Users page — row actions (reset, activate/deactivate, delete, view activity)
Dropdown menu: Reset Password (dialog → new temp password), Activate/Deactivate (optimistic toggle +
ConfirmDialog for deactivate), Delete (ConfirmDialog — last-admin guard), View Activity (→ activity log
Sheet). All via API + audit + optimistic where safe.
**Verify:** reset works; deactivate confirms; delete confirms; activity Sheet shows log; last-admin guard.

### 95. [web] Users page — export button (DR-MD1)
Export button → GET /users/export (with current filters) → blob download. Token from store (not
localStorage). Excel/CSV format selector.
**Verify:** export downloads with filters applied; correct format.

### 96. [web] Users page — bulk actions (R11.8)
Row selection (checkboxes) → bulk action bar: bulk activate, bulk deactivate, bulk export. Select-all
with indeterminate state. ConfirmDialog for bulk destructive.
**Verify:** multi-select works; bulk activate/deactivate; select-all indeterminate; bulk export.

### 97. [api] Fix Department — add is_active + archive + search/filter (DR-MD1, R2.7)
Migration: add `is_active` boolean (default true) + `archived_at` timestamp to `departments`.
DepartmentController: index with search (name) + filter (is_active) + pagination; store/update/destroy;
archive (soft-archive: archived_at = now, is_active = false); restore. Audit on writes.
**Verify:** archive soft-deletes; restore works; search/filter/pagination; audit written.

### 98. [web] Departments page — redesign with DataTable + CRUD + archive
`org/departments/page.tsx`: PageContainer + DataTable (name, description, member count, HR, status
Badge, actions) + FilterBar (search, status). Create/Edit dialog (name, description, assign members via
Combobox). Member list (AvatarGroup). Archive (ConfirmDialog). Export.
**Verify:** CRUD + archive; members shown; export; audit written.

### 99. [api] Fix Designation — add is_active + search/filter (DR-MD1, R2.2)
Migration: add `is_active` to `designations`. DesignationController: index with search + filter +
pagination; CRUD; activate/deactivate. In-use guard (can't delete if employees assigned). Audit.
**Verify:** CRUD works; search/filter; in-use guard; activate/deactivate; audit.

### 100. [web] Designations page — redesign with DataTable + CRUD
`org/designations/page.tsx`: PageContainer + DataTable (name, department, employee count, status) +
FilterBar. Create/Edit dialog (name, department Combobox). Delete (ConfirmDialog — in-use guard). Export.
**Verify:** CRUD; search/filter; in-use guard prevents delete; export.

### 101. [fix][api] Fix auto-numbering service (R2.8)
Audit: seeded format `{PREFIX}{NUMBER}` doesn't match `AutoNumberingService` which only handles `{000}`.
Fix service to parse configurable formats: `{PREFIX}{NUMBER}`, `{PREFIX}{000}`, `{PREFIX}-{000}`,
configurable length + padding. Add `auto_numberings` CRUD endpoint (Admin only, settings.manage) so
formats are editable without code changes (R2.8 explicit requirement).
**Verify:** format `{PREFIX}{000}` with length 3 → `G4K014`; editable via API; no code changes needed.

### 102. [web] Auto-numbering config in Settings (R2.8)
Settings → "Numbering" tab: table of entities (company, department, employee) with editable prefix,
start number, length, format. Preview shows next ID. Save → PUT /auto-numberings. Admin-only.
**Verify:** edit prefix/format → preview updates; save persists; next-created entity uses new format.

### 103. [api] Verify DirectoryController — visibility + Send Message
Verify applyVisibilityRules: name/avatar/designation/dept always; phone/email if opted in;
blood_group/emergency/alternate_mobile ALWAYS null. sendMessage creates real conversation row. Capability
gates. Search debounced server-side.
**Verify:** visibility enforced; Send Message returns real conversation_id; search works.

### 104. [web] Directory page — redesign with cards/list toggle + DataTable
`directory/page.tsx`: toggle grid (DirectoryCard: Avatar, name, designation, dept Badge, Send Message
Button) / list (DataTable). FilterBar (search name/dept/designation 250ms debounce, dept filter). Click
→ Sheet detail. Visibility rules applied. URL-synced.
**Verify:** grid/list toggle; search debounced; Send Message works; sensitive hidden; URL updates.

### 105. [web] Directory — Send Message flow
POST /directory/{id}/send-message → conversation_id → toast "Conversation started" → (future: link to
chat). No broken link. For M1: creates row + confirms.
**Verify:** Send Message → real conversation created → toast → no dead link.

### 106. [web] Company profile view (read-only for HR/Employee)
Read-only company info (name, logo, address, contact) from GET /company-profile. Admin sees edit link →
Settings. Uses next/image for company logo.
**Verify:** company info displays; admin sees edit link; non-admin read-only.

### 107. [test][api] Write org management feature tests
User CRUD (create HR vs Employee gates, update, deactivate, delete, last-admin guard, reset-password),
Department CRUD + archive, Designation CRUD + in-use guard, Directory visibility rules, Send Message,
auto-numbering format, export endpoint. Capability gates (HR vs Admin vs Employee).
**Verify:** `php artisan test` — all org tests pass.

### 108. [test][web] Write org management component tests
UsersPage (create/edit/deactivate/search/export), DepartmentsPage (CRUD + archive), DesignationsPage
(CRUD + in-use guard), DirectoryPage (search + visibility + send message), AutoNumberingConfig.
**Verify:** Vitest — all tests pass.

### 109. [api] Seed — verify + fix (R2.13, R1.9)
Verify seed: 1 company, 2 departments, 22 designations (or trim to 15 per spec — verify with owner), 13
employees (real data + passwords), work schedule (Mon-Sat, 09:00-18:30, 45min break, 10min grace),
holidays, canonical capabilities, branding (company_profile row). Set must_change_password=true for ALL
seeded users (R1.9 — audit found it's false). Fix auto-numbering format in seed to match service.
**Verify:** fresh seed → correct data; first-login forces change; branding present.

### 110. [deploy] Deploy Set 1E — verify org management + directory live
Commit, push, deploy. Verify: create/edit/deactivate/delete user (HR + Employee gates), departments
CRUD + archive, designations CRUD + in-use guard, directory search + Send Message + visibility,
auto-numbering config, export, bulk actions, activity log. Audit rows for all actions.
**Verify:** full org CRUD lifecycle works in production.

---

## SET 1F — Dashboard, Notifications, Settings, Audit (Tasks 111–130)

### 111. [fix][api] Dashboard metrics — per-role scoping (R4.6/R4.7/R4.8)
Audit: HR sees global counts (not team-scoped); Employee missing project/task widgets. Fix:
DashboardController.metrics: Admin = company-wide (employees active/inactive, present/absent/late,
pending approvals, recent activity feed); HR = team-scoped (present/absent/late for own dept, pending
leave, pending submissions); Employee = personal (active projects, pending tasks, today's attendance
status, task progress, approval-status panel). Real data; no mock.
**Verify:** HR sees team-only counts; Employee sees personal; Admin sees all; no mock data.

### 112. [web] Dashboard — fixed per-role widget layouts (DR-DASH1)
`dashboard/page.tsx`: fixed grid per role (no drag/resize). Admin: 6 widgets, HR: 5, Employee: 5.
WidgetEngine renders each independently (ErrorBoundary + skeleton + empty state). Replace generic hero
gradient with DR-DS1 banner (greeting + name + date + summary, accent-tinted).
**Verify:** each role sees correct widgets; failed widget doesn't block; no generic gradient.

### 113. [web] Admin dashboard widgets (R4.6)
Total employees (active/inactive), Active projects (empty state per DR-QT1), Today attendance
(present/absent/late), Pending approvals (quick-access list — leave requests pending), Recent activity
feed (dense audit, no noise), Quick Task Assignment (empty state per DR-QT1). Real data or true empty.
**Verify:** 6 widgets; real data or true empty states; no mock numbers.

### 114. [web] HR dashboard widgets (R4.7)
Today team attendance (present/absent/late — team-scoped), Active projects (empty state), Pending leave
requests (approve/reject quick from widget), Pending submissions (empty state), Quick Task Assignment
(empty state).
**Verify:** HR sees team-scoped data; leave approvals actionable; empty states for future modules.

### 115. [web] Employee dashboard widgets (R4.8)
Active projects (mine — empty state), Pending tasks (mine — empty state), Attendance widget
(TimeClockWidget: Start/Break/End + live timer — real), Recent task progress (empty state), Task approval
status (empty state).
**Verify:** Employee sees personal data; attendance widget real; others true empty.

### 116. [web] Dashboard — quick-action shortcuts (R4.9)
Per role: Admin (Create User, Create Department), HR (View Team Attendance, Approve Leave), Employee
(Request Leave, Clock In), All (View Profile, Open Directory). Each navigates correctly. Colorful icon
buttons.
**Verify:** shortcuts navigate per role; consistent; colorful.

### 117. [web] NotificationsBell — verify + redesign (R8.10)
`notifications-bell.tsx`: query /notifications (with unreadOnly filter), unread Badge count (from
/unread-count), mark-read (optimistic), mark-all-read, Reverb realtime push, toast on new. Urgent
notifications (priority=urgent) show red indicator. Popover: list + filter (all/unread) + "View all" →
full page.
**Verify:** count accurate; mark-read optimistic; mark-all works; urgent distinct; "view all" navigates.

### 118. [web] Full notification page (DR-NOT1)
`/dashboard/notifications`: DataTable (title, type Badge, priority Badge, date, read/unread). FilterBar
(type, priority, read status, date range). Bulk mark-read. Pagination. Click → navigate via link field.
**Verify:** page loads; filters work; bulk mark-read; pagination; click navigates.

### 119. [web] Settings page — redesign with tabs (R10.1/R10.2)
`settings/page.tsx`: SettingsTabs (Company Profile, Working Hours, Holidays, Numbering, Policies,
Notifications, Reminders). Admin-only (settings.manage). HR/Employee see read-only company profile.
`@g4k/ui` Tabs + Form.
**Verify:** tabs switch; forms save; non-admin read-only; capability enforced.

### 120. [api] Settings — enforce password policy from settings (R10.2 audit gap)
Audit: password policy hardcoded. Fix: read `password.min_length`, `password.require_mixed`,
`password.require_number`, `password.require_symbol` from settings table. Apply in change-password +
reset-password validation. Default: min 8, mixed+number+symbol. Admin can edit in Settings → Policies.
**Verify:** change policy in settings → next password change enforces new rules.

### 121. [api] Settings — session/device rules (R10.2)
Read `session.access_token_ttl` (default 15min) + `session.refresh_token_ttl` (default 7d) from settings.
Apply when creating tokens. Admin configurable. Also `session.max_devices` (optional limit).
**Verify:** change TTL in settings → next token uses new TTL; existing tokens unaffected.

### 122. [web] Settings — company profile tab
Company name, logo upload (Supabase Storage via FileUploadPopup), address, phone, email, timezone
(Asia/Kolkata locked). Save → POST /company-profile. Logo displays in app shell + login.
**Verify:** profile saves; logo uploads + displays; timezone locked.

### 123. [web] Settings — working hours + grace period (DR-ATT1)
Work schedule editor: days (Mon-Sat checkboxes), start time, end time, break duration, grace period
(default 10min), standard seconds (auto-calculated). Save → PUT /work-schedules/{id}.
**Verify:** schedule saves; grace stored; standard auto-calculated; affects attendance.

### 124. [web] Settings — reminder times (R5.11 audit gap)
Reminder config: shift reminder offset (default 15min before), missed-clock-in alert offset (default
30min after), open-shift flag time (default end + grace). Save to settings. Affects scheduler.
**Verify:** times configurable; save persists; scheduler reads from settings (not hardcoded).

### 125. [web] Settings — policies tab
Password policy (min length, require mixed/number/symbol), session TTLs (access/refresh), notification
preferences. All save to settings. Admin-only.
**Verify:** policies save; password policy enforced on next change; session TTL applied.

### 126. [api] AuditLog — add export + verify all actions audited (R10.3)
Audit gap: attendance punches, login/logout, leave store NOT audited. Fix: add AuditLogger calls to
handlePunch, login/logout/session-revoke, LeaveRequestController.store. Add export endpoint
(GET /audit-logs/export → CSV/Excel with filters).
**Verify:** punch/login/logout/leave-store audited; export downloads; filters apply.

### 127. [web] Audit log page — redesign with DataTable (R10.3)
`audit/page.tsx`: PageContainer + DataTable (timestamp, user Avatar+name, action, entity, details) +
FilterBar (user, action type, date range). Virtualized. Export button (queued). Admin-only.
**Verify:** audit loads; filters work; virtualized; export downloads; all actions present.

### 128. [web] Dashboard + settings + audit — loading/empty/error states
All screens: skeleton on load (shaped to content), empty state (correct copy), error boundary per
section + retry. No global spinner.
**Verify:** skeletons match; empty copy correct; error retries; no global spinner.

### 129. [test] Write RBAC capability matrix test (automated)
For each (role × capability-gated endpoint) → assert 200 (permitted) or 403 (denied). Cover ALL Base
Module endpoints. HR scoping (own dept only). Employee deep-link blocked.
**Verify:** matrix passes; every denial = 403; HR scoped; deep-links blocked.

### 130. [deploy] Deploy Set 1F — verify dashboard + notifications + settings + audit live
Commit, push, deploy. Verify live (all 3 roles): dashboard widgets (real data + empty states), quick
actions, notification bell + full page, settings (company + working hours + grace + reminders + policies
+ numbering), audit log (all actions + filters + export).
**Verify:** all Base Module screens functional in production with real data.

---

## SET 1G — Phase 1 Verification, Polish, CI, Archive (Tasks 131–145)

### 131. [web] Responsive audit — Base Module (R13.22)
Test EVERY Base Module screen at 360/768/1024/1440/1920. Fix: overflow, broken layouts, table→card
(automatic via DataTable), sidebar states, touch targets. Screenshots at each breakpoint.
**Verify:** no overflow; no broken layouts; cards on mobile; all usable at 360px.

### 132. [web] Accessibility audit — Base Module (R13.23)
axe-core scan on ALL Base Module screens. Fix: contrast (WCAG AA), keyboard navigation (every action),
focus-visible rings, ARIA labels on icon buttons, touch targets ≥44px, reduced-motion.
**Verify:** axe-core zero critical/serious; full keyboard walkthrough; focus visible everywhere.

### 133. [test][deploy] Set up axe-core in CI (DR-CI1, R13.23)
Add axe-core to CI: scan all Base Module routes on PR. Gate: zero critical/serious violations. GitHub
Actions workflow or Lighthouse CI integration.
**Verify:** CI runs axe-core; fails on violations; PR blocked.

### 134. [test][deploy] Set up Lighthouse CI + bundle budget (DR-CI1, R13.7/R13.29)
Lighthouse CI on PRs for all Base Module routes. Budgets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, First-Load JS
≤200KB gz. Bundle analyzer. GitHub Actions workflow. Fail PR on breach.
**Verify:** CI runs Lighthouse; budget enforced; PR blocked on breach; report clear.

### 135. [test][deploy] Set up web-vitals field collection (DR-CI1, R13.28)
Add `web-vitals` library. Collect LCP/INP/CLS/TTFB/FCP. Report to Sentry (or analytics endpoint).
Dashboard in Sentry showing p75 values. Target: p75 within budgets for 7 consecutive days before freeze.
**Verify:** vitals collected in field; Sentry dashboard shows p75; data flowing.

### 136. [test][deploy] Set up Sentry error + perf monitoring (R13.28)
Verify Sentry DSN configured (sentry.client.config.ts exists). Frontend: errors + performance traces.
Backend: Sentry Laravel SDK (if in composer.json — if not, add). Route errors to Sentry. Verify in prod.
**Verify:** test error → appears in Sentry; performance traces captured; both web + api.

### 137. [web] Remove all generic gradients + hardcoded colors (final sweep)
Grep: zero `from-violet-900`/`purple-900`/`indigo-900`/`from-purple`/`via-violet`/`to-pink-700`. Replace
hand-rolled gradient divs with Avatar. Replace hand-rolled tables with DataTable. All colors from tokens.
**Verify:** grep zero results; all tables use DataTable; all avatars use component; colors centralized.

### 138. [web] Performance optimization pass — Base Module
Lazy-load heavy routes (code-split). Dynamic import ECharts/dnd-kit/xlsx where used. Memoize hot list
rows. Verify no anonymous callbacks in props. React Profiler render-count check on 1000-row table.
**Verify:** First-Load JS ≤200KB gz per route; no unnecessary re-renders; ECharts lazy.

### 139. [api] Performance optimization pass — Base Module
Verify: zero N+1 (add eager-load where missing), ≤5 SQL per list, cursor pagination everywhere, indexes
on all filtered/joined/ordered columns, OPcache + route/config/view cache in production. Cache hot
reference data (departments/designations/capabilities/holidays).
**Verify:** query-count tests ≤5; EXPLAIN uses indexes; reference data cached; response p95 ≤200ms.

### 140. [test] Performance budget verification — Base Module
Run Lighthouse CI on all Base Module routes. Assert budgets. Query-count tests. Render-count tests. All
documented in TRACKER.
**Verify:** all routes within budget; query ≤5; render-count acceptable; TRACKER updated.

### 141. [docs] Update OpenSpec — DESIGN-SYSTEM.md + COMPONENT-SYSTEM.md + TRACKER
Update frozen specs to reflect DR-DS1 (charcoal primary, accent palette, rainbow hover), packages/ui
migration, new components (Avatar, Progress, Combobox, etc.). Update TRACKER phase status. Record all
decision records (DR-* IDs).
**Verify:** specs match implementation; no contradictions; TRACKER current.

### 142. [seed] Final seed verification + production seed
Fresh seed: 1 company (+ branding), 2 departments, designations (verify count), 13 employees (real
data, must_change_password=true), work schedule (Mon-Sat, 09:00-18:30, 45min break, 10min grace),
standard Indian holidays, canonical capabilities, auto-numbering (correct format). Seed production.
**Verify:** fresh seed → correct state; first-login forces change; all reference data present.

### 143. [fix][api] Security hardening pass
Remove `/debug/logs` (done). Sanitize inputs (XSS). Parameterized queries (verify no raw concatenation).
Mass-assignment protection ($fillable on all models). Rate limiting on auth endpoints. CSRF on cookie-
based actions. HTTPS/HSTS/CSP headers (SecurityHeaders middleware exists — verify config).
**Verify:** security scan clean; no raw SQL; $fillable on models; headers present.

### 144. [deploy] Final clean production redeploy — Base Module
Final deploy: web + api + db migrate + seed. Clear caches. End-to-end smoke test (login → dashboard →
org CRUD → directory → profile → settings → audit → notifications → logout). All 3 roles.
**Verify:** full Base Module lifecycle in production; Sentry clean; perf within budget.

### 145. [docs] Archive Phase 1 in OpenSpec
Freeze Phase 1 spec. Record: shipped, decisions (all DR-* IDs), performance notes (budgets met), gaps
closed, deferred items. TRACKER → Phase 1 ✅.
**Verify:** Phase 1 archived; spec frozen; TRACKER ✅.

---

# PHASE 2 — ATTENDANCE MODULE (~140 tasks)

## SET 2A — Attendance Backend: Service, Rules, Jobs, Notifications (Tasks 146–165)

### 146. [fix][api] Verify AttendanceService — state machine + event validation
`recordEvent`: validates clock_in (no open shift), break_start (on-clock), break_end (open break),
clock_out (on-clock). Returns structured 422 on violation with clear message. client_id dedupe. All
events immutable.
**Verify:** invalid sequences rejected with clear messages; valid accepted; dedupe via client_id.

### 147. [api] Implement grace-period late calculation (DR-ATT1)
`reconcileDay`: late = clock_in_time > (shift_start + grace_period). Grace from work_schedules (default
10min, configurable via Settings). Within grace → on-time. Store grace_minutes in work_schedules.
**Verify:** 09:09 → on-time; 09:10 → late (10-min grace); grace configurable.

### 148. [api] Verify overtime + cross-midnight + has_open_shift
Overtime = max(0, total − standard). Standard from work_schedules (31500s). Cross-midnight attributed to
clock-in date. has_open_shift set correctly. total_seconds from CLOSED segments only (no now() drift).
**Verify:** overtime correct; cross-midnight → clock-in date; open shift → has_open_shift=true, total=0.

### 149. [api] Attendance meHistory — add projects/tasks per day (R5.3 gap)
Audit: meHistory doesn't include projects/tasks worked that day. Fix: join task_time_logs for the date,
return project names + task titles in the day summary. Used by the history popover.
**Verify:** day summary includes projects + tasks worked; real data from task_time_logs.

### 150. [fix][api] Fix hrGraph — per-employee breakdown (R5.6)
Audit: hrGraph returns company-wide daily totals, not per-employee. Fix: add `groupBy=employee` param
→ returns per-employee daily aggregates (present/late/absent) for HR's team. Default = team aggregate;
param = per-employee.
**Verify:** team aggregate correct; per-employee breakdown correct; HR scoped to own dept.

### 151. [fix][api] Fix attendance export — Excel + date range (R5.10)
Audit: export is CSV, single-date only. Fix: use spatie/simple-excel for .xlsx format. Add date-range
params (start_date, end_date). HR export scoped to own team. Streams file. Capability-gated.
**Verify:** export downloads .xlsx; date-range works; HR scoped; capability enforced.

### 152. [api] Verify offline sync endpoint (R5.12)
Confirm: accepts queued events with client_id, validates, dedupes, returns reconciled state.
Server-Validation strategy: server checks client timestamp plausibility (within reasonable window),
rejects events with future timestamps or duplicate client_ids. Handles out-of-order events.
**Verify:** queued events sync; duplicates deduped; future-timestamp rejected; out-of-order handled.

### 153. [fix][api] Fix scheduler jobs — read times from settings (R5.11)
Audit: cron times hardcoded (08:50, 09:30). Fix: scheduler reads reminder times from settings
(shift_reminder_offset, missed_clockin_alert_offset, open_shift_flag_time). Jobs calculate target time
from work_schedule.start_time + offset. Also fix the "exact minute match" brittleness → query a time
WINDOW (e.g., 08:45-08:55 for 08:50 target) so cron timing doesn't need to be exact.
**Verify:** changing settings → reminder time changes; jobs fire in window not exact minute.

### 154. [api] RemindShiftStart — verify + fix User relation (R5.11)
After task 1 (User::roles fix), verify RemindShiftStart queries correct users, sends notification
(priority=normal) to each employee with today's shift. Reads reminder offset from settings. Excludes
employees on approved leave.
**Verify:** employee notified at configured time; leave employees excluded; no crash.

### 155. [api] AlertMissedClockIn — verify + fix (R5.11)
After task 1 fix: queries employees who haven't clocked in by (start + grace + alert_offset). Notifies
HR (priority=high). Excludes leave. Reads offset from settings. Uses `roleAssignments()` relation.
**Verify:** not-clocked-in → HR notified; leave excluded; offset from settings; no crash.

### 156. [api] FlagOpenShifts — verify + fix column (DR-ATT3)
After task 3 (column fix): job finds attendance_days with has_open_shift=true AND date < today → marks
flagged + notifies HR/Admin (priority=urgent). Does NOT auto-clock-out. Employee cannot self-correct.
Audit trail via attendance_corrections.
**Verify:** open shift at 23:55 → flagged + HR/Admin notified; not auto-closed; audit.

### 157. [api] AttendanceController — verify HR scoping + correct reconciliation
overview/hrToday/hrGraph/export → HR scoped to own department(s). correct() calls reconcileDay AFTER
write. HR can correct own team (attendance.correct-team). Admin any (admin.correct-attendance). Audit.
**Verify:** HR sees own dept; Admin all; correct → reconcile; cross-team blocked; audit.

### 158. [api] Attendance indexes — verify + add ETag/Cache-Control (R5.16)
Add HTTP caching headers (ETag, Cache-Control: private, max-age=30) on overview/hrToday GET responses
for stale-while-revalidate. Frontend keepPreviousData/placeholderData uses these. 30s server cache.
**Verify:** response has ETag + Cache-Control; 304 on revalidate; p95 ≤200ms.

### 159. [api] Manual correction — support add/edit/remove events (R5.7)
Correction endpoint: HR/Admin can ADD a missing event (e.g., clock-out), EDIT an event time, or REMOVE
an erroneous event. Each correction stores: field, old_value, new_value, reason, corrected_by.
Reconciliation runs after. source=manual preserved.
**Verify:** add/edit/remove all work; reconciliation runs; manual source preserved; audit.

### 160. [api] Attendance — server-side validation of work schedule
Ensure attendance events reference the user's active work_schedule for that date. If no schedule →
default to company standard. Compute standard_seconds, grace from schedule.
**Verify:** events use correct schedule; standard/grace from schedule; default fallback works.

### 161. [api] Notification on attendance events (optional)
On missed-clock-in alert → notification to HR. On open-shift flag → notification to HR + Admin. On
manual correction → notification to affected employee ("Your attendance for [date] was corrected by [HR]").
**Verify:** employee notified on correction; HR on missed/alert; Admin on open-shift.

### 162. [api] Attendance — audit all punch operations (R10.3 gap)
Add AuditLogger to handlePunch: logs clock-in/out/break with user, timestamp, IP, device. Currently not
audited per audit finding.
**Verify:** punch creates audit row; log shows user + action + time + IP.

### 163. [test][api] Write attendance feature tests
Clock in/out/break sequence; invalid sequence rejection; reconciliation (late with grace, overtime,
cross-midnight); HR scoping; correction + reconciliation; export (format + date-range); offline sync
(dedupe, conflict); scheduler jobs (mock time); has_open_shift flagging.
**Verify:** `php artisan test` — all attendance tests pass.

### 164. [api] Performance — attendance query optimization
Indexes: attendance_days(user_id, date), attendance_events(day_id, timestamp), events(client_id).
Cursor pagination on all list endpoints. Eager-load user. Query ≤5 per list. ETag on GETs.
**Verify:** EXPLAIN uses indexes; query ≤5; cursor pagination; p95 ≤200ms.

### 165. [deploy] Deploy Set 2A — verify backend attendance logic
Commit, push, deploy. Verify via curl: clock in/out/break, reconciliation (late/overtime/cross-midnight),
HR scoping, export (.xlsx + date-range), offline sync, scheduler jobs (fire correctly), notifications.
**Verify:** all attendance backend logic correct in production.

---

## SET 2B — Employee Attendance Experience (Tasks 166–185)

### 166. [fix][web] Move attendance timer to global Zustand store (DR-TIMER1, R5.2)
Audit: timer unmounts on navigation. Fix: create `timer-store.ts` (Zustand) holding {isActive, isOnBreak,
clockInTimestamp, breakStartTimestamp, totalBreakSeconds}. rAF/1s tick updates only the store. Widget
subscribes via selector. Navigating away → timer continues; returning → shows live value.
**Verify:** clock in → navigate away → return → timer still running; no unmount reset.

### 167. [web] TimeClockWidget — redesign + isolated 1s tick (R5.1/R5.13/R5.14)
Widget reads from timer-store (task 166). States: not-started (Clock In, green), on-break (End Break),
working (Start Break + Clock Out). One-tap optimistic + rollback toast. ≥48px mobile. rAF replaced with
1s setInterval (sufficient for HH:MM:SS display, less re-renders than 60fps).
**Verify:** one tap clocks in; 1s tick (not 60fps); optimistic; rollback on error; ≥48px mobile.

### 168. [web] TimeClockWidget — live HH:MM:SS + amber overtime (R5.2)
Timer counts up from clockInTimestamp. Amber when total > standard_seconds (read from server, not
hardcoded 31500). Pauses during break. Resumes on break-end. Shows in widget + topbar mini-timer (optional).
**Verify:** amber at overtime; pause during break; resume after; standard from server.

### 169. [web] TimeClockWidget — Clock Out confirmation (R5.1)
Clock Out → ConfirmDialog ("End shift? Total: HH:MM:SS") → POST clock-out → optimistic → toast.
Auto-end active break (with toast "Break ended automatically").
**Verify:** confirm shows total; end shift; active break auto-ended; toast.

### 170. [web] Attendance page — redesign layout
`attendance/page.tsx`: PageContainer. Top: TimeClockWidget (prominent). Below: today's summary card.
Below: history section (calendar heatmap). Clean, white-first, accent-tinted (green = attendance module).
**Verify:** page loads; widget prominent; summary + history below; no generic gradient.

### 171. [web] Today's summary card
Clock-in time, break duration (current/completed), clock-out time (or "in progress"), total working time,
status Badge (present/late/on-break/off). Real data from /attendance/me/today. Updates after each action.
**Verify:** summary matches events; updates live; status correct.

### 172. [web] AttendanceHistoryCalendar — verify + add overtime color (R5.3/R5.8)
ECharts calendar heatmap (lazy import). Color scale: no-data=gray, present=green, late=amber, leave=
purple, absent=red, **overtime=dark-amber** (audit: missing). Click date → Popover (clock-in, breaks,
clock-out, total, overtime, **projects, tasks** per task 149). Month navigation (lazy fetch).
**Verify:** heatmap renders; 6 colors including overtime; click → popover with projects+tasks.

### 173. [web] Attendance day detail popover (R5.3)
Per-day Popover: clock-in, each break (start/end/duration), clock-out, total, overtime, late badge,
status, projects worked, tasks done, link to correction (if permitted). Real data from /attendance/me/
day/{date}.
**Verify:** popover shows full breakdown including projects/tasks; link to correction.

### 174. [web] Offline attendance punch (R5.12)
Route punches through Offline Engine: offline → queue in IndexedDB (client_id + timestamp) → "queued"
state on widget → sync on reconnect → toast. OfflineBanner shows queue count. Server-Validation (server
rejects implausible timestamps).
**Verify:** offline punch queues; syncs on reconnect; dedupe; toast; no data loss.

### 175. [web] Late + overtime indicators (R5.8/R5.9)
Late badge (amber) when clock-in > start + grace. Shows minutes late. Green "On time" within grace.
Overtime section in day summary when total > standard. Overtime heatmap color.
**Verify:** late badge + minutes; on-time green; overtime section; heatmap color.

### 176. [web] Attendance empty + loading + error states
Empty: "No attendance recorded yet. Clock in to start." Loading: skeleton (calendar + summary shape).
Error: per-widget boundary + retry. No global spinner.
**Verify:** empty copy; skeleton shapes; error retries; no global spinner.

### 177. [web] Employee attendance — mobile optimization
Mobile: TimeClockWidget full-width (≥48px buttons), summary as stacked cards, calendar month-view with
tap-to-expand. Bottom nav clock FAB → scrolls to widget.
**Verify:** mobile usable; 48px buttons; calendar usable 360px; FAB scrolls to widget.

### 178. [web] Leave request from attendance page
"Request Leave" button → LeaveRequestForm dialog. Integrates attendance + leave (employee thinking about
attendance can quickly request leave).
**Verify:** button opens leave form; submit creates request; toast.

### 179. [web] Attendance — command palette integration (DR-CMD1)
Ctrl+K: "Clock In/Out", "Start/End Break", "Request Leave", "View Attendance History". Context-aware
(can't clock in if already in). Recent items first.
**Verify:** palette shows attendance actions; context-aware; recent first.

### 180. [web] Fix attendance export — token from store (audit gap G1)
`org/attendance/page.tsx:75`: replace `localStorage.getItem("token")` with `useAuthStore.getState().token`.
Bearer-header fetch + blob. (This is the org/admin page but fix here too for consistency.)
**Verify:** export uses token from store; no "Bearer null"; downloads correctly.

### 181. [web] Attendance — optimistic mutations + rollback
Clock in/out/break: optimistic state applied instantly, rollback on error with danger toast. No
spinner-then-update (instant feedback per R5.13). Cache invalidation after success.
**Verify:** instant optimistic; rollback toast on error; cache invalidates on success.

### 182. [web] Topbar mini-timer (optional, R5.2 "continues on navigation")
Optional: when an active shift exists, show a mini HH:MM:SS timer in the TopBar (reads from timer-store).
Click → navigate to attendance page. Always visible during active shift.
**Verify:** mini-timer in topbar during active shift; click → attendance page; updates 1s.

### 183. [test][web] Write attendance widget + timer tests
TimeClockWidget (states, optimistic, rollback), timer-store (persists across mount/unmount, 1s tick,
overtime amber), AttendanceHistoryCalendar (render, popover), offline punch (queue + sync mock).
**Verify:** Vitest — all tests pass; timer-store persistence confirmed.

### 184. [web] Attendance — responsive (360/768/1024/1440)
Test at all breakpoints. Fix: widget at 360px, calendar mobile, summary cards, FAB. Screenshots.
**Verify:** no overflow; usable at 360; calendar adapts; targets ≥48px.

### 185. [deploy] Deploy Set 2B — verify employee attendance live
Commit, push, deploy. Verify (as employee praveen): clock in → break → out; timer persists across
navigation; history heatmap (6 colors incl. overtime); day popover (projects+tasks); offline punch +
sync; late/overtime; mobile.
**Verify:** complete employee attendance lifecycle works in production.

---

## SET 2C — HR Attendance Workflows (Tasks 186–205)

### 186. [web] HR "today's team attendance" view (R5.5)
Page/widget: DataTable of team members with today's status (present/absent/late/leave/not-started).
Filter chips: present/absent/late. 30s stale-while-revalidate (R5.16). Real data from /attendance/hr/
today. Team-scoped (HR's department). keepPreviousData for instant filter changes.
**Verify:** HR sees own team; filter chips; 30s SWR; in-place filter (no reload).

### 187. [web] HR team attendance — FilterBar + search + URL sync
FilterBar: search (name, 250ms debounce), status filter, date filter (default today). URL-synced
(R13.15). Changes update in place. Memoized rows. Stable keys.
**Verify:** search debounced; status works; date loads; URL reflects; in-place update.

### 188. [web] HR — click employee → full day summary (Sheet)
Click team member row → Sheet: clock-in, breaks, clock-out, total, status, projects, tasks. Initiate
correction from here. Real data.
**Verify:** click → Sheet; full breakdown; correction accessible.

### 189. [web] HR — weekly/monthly per-employee graph (R5.6, fixed backend)
ECharts (lazy): per-employee attendance over week/month. Toggle team overview ↔ per-employee (uses
fixed hrGraph groupBy=employee). Color-coded. Data from /attendance/hr/graph?groupBy=employee.
**Verify:** graph per-employee; team toggle; colors; accurate data.

### 190. [web] HR — view employee leave status (R5.5 integration)
Absent employees show "On Leave" badge if approved leave exists for that date. Link to leave management
(/dashboard/org/leave). Cross-module navigation preserves context (date + employee).
**Verify:** leave badge on absent; link to leave mgmt; context (date+employee) preserved.

### 191. [web] HR — manual correction dialog (R5.7)
Correction Dialog: select employee, date, add/edit/remove events (clock-in/out/break times) with reason.
Preview reconciled total before save. Submit → POST /attendance/correct → reconcileDay → toast.
Capability: attendance.correct-team (own team only).
**Verify:** correction works; preview shows reconciled; saves + reconciles; team-scoped.

### 192. [web] HR — correct open shift (DR-ATT3)
Team view: open shifts flagged (amber badge + urgent icon). Click → correction dialog pre-filled to add
clock-out + mandatory reason. Save → shift closed, reconciled, flag cleared, employee notified.
**Verify:** open shift flagged; correction adds clock-out; flag cleared; employee notified; reason mandatory.

### 193. [web] HR — attendance history per employee
Select employee → their full history (calendar heatmap + list). Filter by date range. Same calendar as
employee self-view but for any team member.
**Verify:** select employee → history loads; calendar + list; date range filter.

### 194. [web] HR dashboard — attendance widget → full page
HR dashboard "today team attendance" widget → click "view all" → full team page (task 186). Widget shows
summary counts + mini list.
**Verify:** widget summary; "view all" → full page; counts accurate.

### 195. [web] HR — batch actions on team attendance (R11.8)
Multi-select employees → bulk: export selected, mark for review. Checkbox selection. ContextMenu
(right-click) for quick actions.
**Verify:** multi-select; bulk export; context menu on right-click.

### 196. [web] HR — shift reminder + missed-clock-in feedback
HR sees who received shift reminders (subtle indicator). Missed-clock-in alerts prominent (from
AlertMissedClockIn). Follow-up: Send Message to employee.
**Verify:** reminders indicated; missed alerts prominent; follow-up message works.

### 197. [web] HR attendance — loading/empty/error/responsive
Loading: skeleton rows. Empty: "No team members" / "No data for this date." Error: boundary + retry.
Responsive: table→cards on mobile, graph adapts.
**Verify:** skeleton; empty copy; error retries; cards on mobile; graph adapts.

### 198. [web] HR — attendance notifications
HR receives: missed-clock-in alerts, open-shift flags, shift-reminder summaries. In bell + notification
page. Actionable.
**Verify:** notifications arrive; actionable; in bell + page.

### 199. [web] HR — export team attendance (R5.10)
Export button → GET /attendance/export (date-range + dept-scoped) → .xlsx blob. Token from store.
Filters applied.
**Verify:** export .xlsx; date-range + team-scoped; token correct; downloads.

### 200. [test][web] Write HR attendance component tests
TeamAttendanceTable (filters, SWR, in-place update), HrAttendanceGraph (per-employee toggle), Correction
Dialog (add/edit/remove + preview + reconcile), OpenShiftCorrection (flag + clear).
**Verify:** Vitest — all tests pass.

### 201. [web] HR attendance — command palette integration
"View Team Attendance", "Correct Attendance", "Export Team Report". Context-aware.
**Verify:** palette shows HR attendance actions.

### 202. [web] HR — activity feed widget (dashboard)
Recent team activity: who clocked in late, who has open shifts, corrections made. Dense, no noise. Real
data from dashboard metrics or audit log filtered by team.
**Verify:** activity feed shows relevant team events; dense; no noise.

### 203. [web] HR — attendance settings shortcut
From attendance page: link to Settings → Working Hours + Reminders (so HR can suggest changes; Admin
edits). Or read-only view of current schedule for HR.
**Verify:** link to settings; HR sees current schedule; Admin can edit.

### 204. [web] HR attendance — a11y + keyboard
axe-core clean. Keyboard: filter via keyboard, approve correction via Enter, navigate table via arrows.
Focus rings. ARIA.
**Verify:** axe-core clean; keyboard operable; focus visible.

### 205. [deploy] Deploy Set 2C — verify HR attendance workflows live
Commit, push, deploy. Verify (as HR aravind): team view, filters (debounce + URL), employee day summary,
per-employee graph, manual correction (incl. open shift), leave badge, batch export, mobile.
**Verify:** complete HR attendance lifecycle in production, team-scoped.

---

## SET 2D — Admin Attendance Workflows + Reports (Tasks 206–225)

### 206. [web] Admin company-wide attendance overview (R5.4)
Page: DataTable of ALL employees with today's status. Filter by date/dept/person (FilterBar). Click any
date/person → full summary Sheet. Admin sees entire company. 30s SWR.
**Verify:** Admin sees all; filters work; click → summary; data fresh.

### 207. [web] Admin — date navigation (historical)
Date picker: any past date → company-wide attendance for that date. Prev/next day, jump-to-date. Real
data from /attendance/admin/overview?date=.
**Verify:** date change loads historical data; navigation works; accurate.

### 208. [web] Admin — department filter
FilterBar dept Combobox: filter by department. "All" default. Searchable. URL-synced. In-place update.
**Verify:** dept filter works; "all" default; URL reflects; in-place.

### 209. [web] Admin — click person/date → full summary (R5.4)
Click cell (person × date) → Sheet: clock-in, breaks, clock-out, total, overtime, late, status, projects,
tasks. Correction accessible. Real data.
**Verify:** click → Sheet with complete breakdown; correction accessible; accurate.

### 210. [web] Admin — manual correction (any employee) (R5.7)
Correction Dialog: select ANY employee, date, edit events. Capability: admin.correct-attendance.
Preview + reconcile. Audit.
**Verify:** Admin corrects any employee; preview + reconcile; audit written.

### 211. [web] Admin — export attendance report (R5.10, fixed)
Export: FilterBar date-range + dept → GET /attendance/export → .xlsx (spatie/simple-excel). Token from
store. Queued for large. Valid file.
**Verify:** export .xlsx; date-range + dept; token correct; downloads; queued for large.

### 212. [web] Admin — attendance analytics summary cards
Present/absent/late/on-leave counts, avg clock-in time, total overtime. For selected date. Color-coded.
30s refresh.
**Verify:** cards accurate; color-coded; refreshes; matches table.

### 213. [web] Admin — attendance trends graph
ECharts (lazy): company-wide trends (week/month). Present/late/absent rates. Department comparison.
Toggle company ↔ per-department.
**Verify:** graph renders; trends accurate; dept comparison; toggle.

### 214. [web] Admin — open-shift management console
Dedicated view/filter: all open shifts company-wide. Amber-flagged. Filter by dept/date. Assign for
correction. Bulk-notify HR.
**Verify:** open shifts listed; filter; assign correction; bulk notify HR.

### 215. [web] Admin — scheduler configuration (Settings, R5.11)
In Settings → Reminders: configure shift-reminder offset, missed-clock-in offset, open-shift flag time.
Saves to settings. Scheduler reads from settings.
**Verify:** times configurable; save persists; scheduler uses configured times.

### 216. [web] Admin attendance — loading/empty/error/responsive
Skeleton (table + cards). Empty: "No employees" / "No data for date." Error: boundary + retry.
Responsive: cards on mobile, graph simplifies.
**Verify:** skeleton; empty; error retries; cards on mobile.

### 217. [web] Admin — attendance audit trail
Every correction in audit log (who, what, when, reason). Filterable from audit page by
action=attendance_correction. Link from correction → audit entry.
**Verify:** corrections audited; filterable; link works.

### 218. [web] Admin dashboard — attendance widget → full page
Widget "today attendance" → click → full overview (task 206). Widget: summary counts + mini bar.
**Verify:** widget → full page; counts accurate; real data.

### 219. [web] Admin — attendance + leave reports (DR-RPT1)
Report builder: type (attendance summary / leave summary), date range, dept filter, format (Excel/PDF).
Generate → results in DataTable → export. Attendance summary: per-employee (days present/late/absent/
leave, total hours, overtime). Leave summary: per-employee (requests, approved days).
**Verify:** reports generate real data; export works; filters apply; accurate.

### 220. [api] Reports — attendance + leave summary endpoints (DR-RPT1)
`GET /reports/attendance-summary?start=&end=&dept=` → per-employee aggregate. `GET /reports/leave-
summary?start=&end=&dept=` → per-employee leave aggregate. Capability-gated (Admin all, HR team).
Cursor paginated. Export queued for large.
**Verify:** endpoints return correct aggregates; scoped; paginated; query ≤5.

### 221. [web] Admin — saved report views (R9.8, R11.7)
Save current report config (type + filters) as a named view. Combobox to load saved views. Per-user.
Stored in saved_views table.
**Verify:** save view → load → applies filters; per-user; stored.

### 222. [web] Admin attendance — command palette + bulk actions
"View Company Attendance", "Export Report", "Generate Attendance Summary". Bulk: select employees →
export, mark review. ContextMenu.
**Verify:** palette actions; bulk export; context menu.

### 223. [test][web] Write Admin attendance component tests
CompanyOverview (filters, date nav, click→Sheet), Correction (any employee), Export (.xlsx + range),
Analytics (cards + trends), OpenShiftConsole, ReportBuilder (generate + saved views).
**Verify:** Vitest — all tests pass.

### 224. [web] Admin attendance — a11y + responsive
axe-core clean. Keyboard operable. Responsive 360/768/1024/1440. Touch targets ≥48px.
**Verify:** axe clean; keyboard; responsive; targets.

### 225. [deploy] Deploy Set 2D — verify Admin attendance + reports live
Commit, push, deploy. Verify (as Admin karthik): company overview, date/dept filters, person summary,
correction (any), export (.xlsx + range), analytics, trends, open-shift console, scheduler config,
reports (attendance + leave summaries), saved views, mobile.
**Verify:** complete Admin attendance lifecycle in production, company-wide + reports.

---

## SET 2E — Leave Module: Request, Approve, History, Integration (Tasks 226–250)

### 226. [fix][api] Leave routing — fixed by role (DR-ROUTE1, DR-RTE1)
Verify: Employee leave → routed to HR (current_approver_role=hr, capability leave.approve-employee).
HR leave → routed to Admin (current_approver_role=super_admin, capability leave.approve-hr).
Admin/super_admin leave → routed to super_admin (or auto-approved if sole admin). Hardcoded by role,
not configurable. Clean, predictable.
**Verify:** employee leave → HR approves; HR leave → Admin approves; routing correct.

### 227. [fix][api] ApprovalService — add capability check (audit gap G3)
`checkRoleGating` checks role only. Add `CapabilityMatrix::hasCapability($decider, $requiredCap)`:
leave_request → HR needs leave.approve-employee; Admin needs leave.approve-hr. Defense in depth (route
middleware already gates, but service enforces too).
**Verify:** decider without capability → 403; with → succeeds; both role + capability checked.

### 228. [fix][api] LeaveAttendanceIntegration — respect working days (audit gap G2)
Listener: only mark attendance_days status=leave for WORKING days per work_schedules (Mon-Sat). Skip
Sundays. Match recurring holidays by month-day (not just exact date). Skip holidays.
**Verify:** leave Mon-Sat → days marked; Sunday skipped; recurring holiday skipped.

### 229. [fix][api] LeaveRequests — set status on store + sync in transaction (audit gap G5)
`LeaveRequestController.store`: set `status='pending'` explicitly. `ApprovalService.approve/reject`:
update `leave_requests.status` within a DB transaction (not just listener). Atomic. Fire ApprovalDecided
→ LeaveAttendanceIntegration.
**Verify:** store sets status; decision updates status in transaction; atomic; no stale status.

### 230. [api] Leave — duplicate pending overlap DB index (verify)
Verify partial-unique index `(user_id, start_date, end_date) WHERE status=pending` exists. Test: insert
overlapping pending → DB error → caught → clear 422. Non-overlapping allowed.
**Verify:** DB rejects overlapping; clear error; non-overlapping works.

### 231. [api] Leave endpoints — verify all + add missing
Verify: index (scoped), store (validates + creates approval), decision (capability + role gate), show
(owner/hr/admin), history (owner, excludes nothing — fix audit: remove `!=pending` exclusion so user
sees their own pending), pending (HR team-scoped). All return correct data, no N+1.
**Verify:** endpoints return scoped data; capability enforced; history shows pending; N+1 clean.

### 232. [api] Holiday CRUD (DR-HOL1)
`HolidayController`: store/update/destroy with capability (settings.manage). Support recurring
(is_recurring + recurring_month_day). **Expand recurring in index**: a recurring holiday set in 2026
appears in 2027+ (query by year OR recurring). Seed standard Indian holidays. Audit.
**Verify:** CRUD works; recurring expands across years; seed correct; audit.

### 233. [api] ApprovalSubmitted — verify listener fires + notifies (R6.8)
After task 4 (listener registered): submit → ApprovalSubmitted event → NotifyApprovalSubmitted listener
→ Notification to routed approver. Approver sees in bell. priority=high.
**Verify:** submit → approver notified; bell shows; priority high; persists.

### 234. [api] Leave — verify end-to-end integration
Employee requests Mon-Fri leave → HR approves → LeaveAttendanceIntegration marks attendance_days
(status=leave) for Mon-Sat (Sunday skipped, recurring holiday skipped) → employee heatmap shows purple.
Verify in DB.
**Verify:** approved leave → attendance_days marked correctly; heatmap reflects; working-days respected.

### 235. [api] Leave — query performance + indexes
Indexes: leave_requests(user_id, status), leave_requests(start_date, end_date), approvals(approvable_type,
approvable_id). Cursor pagination. Query ≤5. Eager-load user + approval. N+1 clean.
**Verify:** EXPLAIN uses indexes; query ≤5; cursor pagination; N+1 clean.

### 236. [web] Leave request form — redesign (R6.2/R6.3, DR-LEAVE1)
LeaveRequestForm: DateRangePicker (end ≥ start), type RadioGroup (casual/sick/earned/unpaid), reason
Textarea. NO balances shown. Submit → POST /leave-requests → optimistic + toast. Validation. `@g4k/ui`.
**Verify:** validates; end≥start; submit creates request; toast; no balances.

### 237. [web] Employee leave history — DataTable + FilterBar (R6.4)
Shared DataTable: dates, type Badge, reason, status StatusBadge (pending=amber, approved=green,
rejected=red). FilterBar (status, type, date range). Virtualized. URL-synced. Includes PENDING (audit
fix). Real data from /leave-requests/history.
**Verify:** history loads incl. pending; filters; badges; URL; virtualized.

### 238. [web] Holiday calendar — verify + recurring expansion (R6.7)
HolidayCalendar: month-view. Holidays highlighted (accent). Click → Popover (name, type, recurring
badge). Recurring holidays expand across years (backend task 232). Real data from /holidays?year=.
**Verify:** calendar shows holidays incl. recurring; click → popover; accurate.

### 239. [web] Leave page — full redesign layout
`leave/page.tsx`: PageContainer. Tabs: "My Leave" (history + request form), "Holidays" (calendar). Clean.
Request button prominent. Empty states. Accent-tinted (amber = leave module).
**Verify:** tabs switch; form works; history loads; holiday calendar; empty states.

### 240. [web] HR leave approval queue (R6.6)
`org/leave/page.tsx`: DataTable of PENDING employee leave requests routed to HR. Columns: employee
Avatar+name, dates, type, reason, status, actions. Approve (1-click optimistic badge flip), Reject
(ConfirmDialog → reason required). Team-scoped. Real data from /approvals/pending.
**Verify:** HR sees pending employee requests; approve = 1-click; reject = confirm + reason; optimistic.

### 241. [web] Admin leave approval queue (R6.5)
Admin sees pending HR leave requests (routed to Admin). Same UI, Admin scope. Approve/reject.
Company-wide history view.
**Verify:** Admin sees HR requests; approve/reject; history company-wide.

### 242. [web] Leave — truly optimistic (R13.19/R13.24)
Approve → badge amber→green INSTANTLY (no spinner), persists background, rollback toast on error. Reject
→ amber→red, ConfirmDialog + reason. ≤2 clicks, no reload.
**Verify:** approve = instant flip, no reload; reject = confirm + reason; rollback on error.

### 243. [web] Leave history — all users (Admin) / team (HR) + export (DR-MD1)
Admin: all company-wide. HR: team-scoped. FilterBar (user, status, type, date). DataTable virtualized.
Export (Excel). Real data.
**Verify:** Admin all; HR team; filters; export; virtualized.

### 244. [web] Leave — notifications integration (R6.8)
On submit: notify routed approver (bell, priority=high). On decision: notify requester (bell + badge
flip). Reverb realtime push. Actionable from bell.
**Verify:** approver notified on submit; requester on decision; Reverb works; actionable.

### 245. [web] Leave — duplicate overlap prevention UI
If employee has pending request overlapping new dates → warn inline (check client-side from history) +
server blocks (DB index). Clear message.
**Verify:** overlapping → warned + blocked; clear message.

### 246. [web] Leave — empty/loading/error/responsive
Empty: "No leave requests yet." Loading: skeleton rows. Error: boundary + retry. Responsive: form
full-screen mobile; history cards; calendar adapts.
**Verify:** empty copy; skeleton; error retries; mobile cards; calendar adapts.

### 247. [web] Leave — command palette + quick actions
Ctrl+K: "Request Leave", "View My Leave", "View Pending Approvals" (HR/Admin). Dashboard quick actions.
**Verify:** palette + dashboard quick actions work per role.

### 248. [api] Cleanup duplicate SendWeeklySummary command (audit gap G6)
Delete duplicate. Keep the one scheduler references (`routes/console.php:15` → `reports:send-weekly-
summary`). Verify scheduler works.
**Verify:** one command; scheduler references correct; weekly summary sends.

### 249. [test][api] Write leave feature tests
Employee request; HR approve; Admin approve HR leave; HR cannot approve HR leave (403); duplicate overlap
rejected; LeaveAttendanceIntegration (working days only, recurring holiday skipped); status sync in
transaction; capability check; notifications fire (submit + decision).
**Verify:** `php artisan test` — all leave tests pass.

### 250. [deploy] Deploy Set 2E — verify leave workflows live
Commit, push, deploy. Verify: employee requests → HR approves (optimistic) → attendance days marked
(working days only) → bell notifications. HR requests → Admin approves. History + filters. Holiday
calendar (recurring). Overlap prevention. Export.
**Verify:** complete leave lifecycle in production for all 3 roles.

---

## SET 2F — OpenAPI Re-sync, PWA, Offline, Polish (Tasks 251–265)

### 251. [fix][api] Reconcile OpenAPI spec with routes (audit gap G7)
- [x] Update openapi.yaml paths to EXACTLY match routes/api.php: /users (not /org/users), /attendance/me/today
(not /attendance/events), /auth/role-select (not /auth/role/select), /settings/grouped, /approvals/
pending, /leave-requests/history, etc. CI lint passes. Contract truthful for future client codegen.
**Verify:** OpenAPI paths match routes; lint passes; no mismatches.

### 252. [web] PWA — fix manifest icons + verify installability
- [x] Manifest icons: generate proper 192×192 + 512×512 from logo (current uses same 1.7MB file). Add
apple-touch-icon. maskable icon. Verify Lighthouse PWA audit passes (installable).
**Verify:** Lighthouse PWA = installable; icons correct size; apple-touch-icon present.

### 253. [web] PWA — service worker offline shell
- [x] Verify SW caches app shell (login + dashboard骨架) for offline access. Offline banner shows. Cached
routes load instantly offline. Attendance punch queues.
**Verify:** offline → app shell loads; banner shows; punch queues; no white screen.

### 254. [web] Offline — general form queue (R11.6 audit gap)
- [x] Audit: only attendance punches queue. Extend Offline Engine: general mutations (leave request, profile
edit) queue when offline → sync on reconnect. OfflineBanner shows total queue count.
**Verify:** offline leave request queues; syncs on reconnect; banner shows count; no data loss.

### 255. [web] Offline — conflict handling + retry ladder (R13.20)
- [x] Offline mutations: retry ladder (1s, 5s, 30s, 2min exponential backoff). On conflict (422/409): keep
local + show conflict toast ("Conflict: [entity] was modified. Review?"). GET retry with backoff.
**Verify:** retry ladder works; conflict toast shows; GET retries; no silent failures.

### 256. [api] Fix Sanctum token expiration (R10.2)
- [x] Set `expires_at` on access tokens (15min from settings) + refresh tokens (7d from settings). Expired
tokens rejected → 401 → frontend refreshes. Cleanup: periodically purge expired tokens (scheduled command).
**Verify:** expired access token → 401; refresh works; expired tokens purged.

### 257. [api] CSRF protection for cookie-based refresh (if cross-origin)
- [x] If refresh cookie is SameSite=None (cross-origin prod): implement CSRF double-submit token. If SameSite=
Lax (same-origin via proxy): verify CSRF is handled by Laravel defaults. Document the chosen approach.
**Verify:** refresh works; no CSRF errors; documented; secure.

### 258. [web] Skeleton standardization — replace ALL full-screen spinners (R3.16/R13.18)
- [x] Audit: AuthGuard uses full-screen spinner (should be skeleton). Replace with skeleton matching the
target page shape. Only true full-screen loads (initial app boot) may use a branded splash.
**Verify:** no full-screen spinner where skeleton fits; branded splash only on boot.

### 259. [web] Button loading = dot-loader (not spinner, R3.14 audit gap)
- [x] Audit: buttons use Loader2 spinner. Replace with dot-loader animation (three pulsing dots) per
COMPONENT-SYSTEM §1. Consistent across all buttons.
**Verify:** all loading buttons show dot-loader; no Loader2 spinner on buttons.

### 260. [web] Inline editing component (R3.9 audit gap)
- [x] Create `InlineEdit`: pencil icon on hover → click → Input in-place → Enter saves / Esc cancels → toast.
Used for: task titles, user names (quick edit), designation names. Composes Input + Toast.
**Verify:** pencil appears on hover; Enter saves; Esc cancels; toast confirms.

### 261. [web] Recently-viewed tracking (R13.25 audit gap)
Track recently-viewed entities (employees, attendance days, leave requests) in a Zustand store (max 10).
Command palette "Recent" section shows them. Deep-links preserve context.
**Verify:** view entity → appears in Recent; palette shows; click navigates; max 10.

### 262. [web] Undo for safe mutations (R11.7/R13.19)
Implement undo toast for optimistic safe mutations: after mark-read, pin toggle, status toggle → show
toast with "Undo" action (5s window). Clicking undo reverses the mutation.
**Verify:** mark-read → undo toast → click undo → reverts; 5s window; works.

### 263. [api] Seed — holidays + work schedule + attendance rules
Seed: standard Indian public holidays (Republic Day, Independence Day, Gandhi Jayanti, etc.) +
company-specific. Work schedule: Mon-Sat, 09:00-18:30, 45min break, 10min grace. Settings rows: password
policy defaults, session TTLs, reminder offsets. company_profile row.
**Verify:** fresh seed → holidays present; schedule correct; settings seeded; grace stored.

### 264. [test] Integration test — full attendance + leave workflow
End-to-end test: Employee clocks in (late), takes break, clocks out. Requests leave. HR approves.
Attendance days marked. HR views team attendance. Admin exports report. Open shift flagged + corrected.
All real, no mock.
**Verify:** integration test passes; full workflow real; no mock.

### 265. [deploy] Deploy Set 2F — verify PWA + offline + OpenAPI + tokens
Commit, push, deploy. Verify: PWA installable (Lighthouse), offline shell + queue, OpenAPI lint passes,
token expiration works, dot-loader renders, inline edit works, recently-viewed tracks, undo works.
**Verify:** all polish items work in production.

---

## SET 2G — Phase 2 Verification, Performance, CI, Archive (Tasks 266–280)

### 266. [test] RBAC matrix test — Attendance + Leave
For each (role × attendance/leave endpoint) → 200/403. Employee self-service, HR team, Admin company.
HR can't approve HR leave. Employee can't access admin overview. Capability + scoping correct.
**Verify:** matrix passes; all denials 403; scoping correct.

### 267. [test] Performance budget — Attendance + Leave routes
Lighthouse CI on /dashboard/attendance, /dashboard/leave, /dashboard/org/attendance, /dashboard/org/
leave, /dashboard/notifications. Assert: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, First-Load ≤200KB gz. ECharts
lazy. Bundle analysis.
**Verify:** all routes within budget; ECharts dynamically imported; no bloat.

### 268. [web] Accessibility audit — Attendance + Leave (R13.23)
axe-core on all screens. Fix: contrast, keyboard (clock in/out/approve via keyboard), focus rings, ARIA
on icon buttons, touch targets ≥48px. Reduced-motion.
**Verify:** axe-core zero critical/serious; keyboard clock/approve works; targets met.

### 269. [web] Responsive audit — Attendance + Leave (R13.22)
360/768/1024/1440/1920. Fix: calendar at 360, table→card mobile, graph simplification, filter collapse.
Screenshots per breakpoint.
**Verify:** no overflow; calendar usable 360; cards mobile; graphs adapt; all usable.

### 270. [web] Cross-module navigation audit (R13.25)
Attendance → request leave → leave page → approve → back to attendance (heatmap updated). Dashboard →
full page. Directory → Send Message. Breadcrumbs + back preserve context. No redundant refetch.
**Verify:** cross-module flows work; context preserved; cached data reused; no redundant refetch.

### 271. [web] Offline resilience audit — Attendance + Leave
Offline clock in/out (queues + syncs), offline leave request (queues), banner shows count, reconnect
syncs + toast. Server-Validation conflict. No data loss. Retry ladder.
**Verify:** offline actions queue; sync on reconnect; no data loss; retry; conflict toast.

### 272. [api] Backend performance verification — Attendance + Leave
EXPLAIN all queries (indexes used). Query-count tests ≤5/list. Cursor pagination. ETag/Cache-Control on
GETs. p95 ≤200ms read / ≤300ms write. Zero N+1. Reference data cached.
**Verify:** all queries use indexes; ≤5 SQL/list; p95 within target; N+1 clean; cached.

### 273. [fix][api] Security hardening — Attendance + Leave
Verify: capability gates on every endpoint, mass-assignment protection, input validation (Zod/server),
no raw SQL concatenation, parameterized queries. Rate-limit sensitive endpoints. Audit all writes.
**Verify:** security scan clean; gates on all; validation complete; audited.

### 274. [web] Memory leak audit (R13.26)
Verify: Reverb subscriptions cleaned on unmount, IntersectionObservers disconnected, object URLs
revoked, no retained detached nodes across 20-screen navigation. No unbounded caches.
**Verify:** Chrome DevTools Memory — no leaks across 20-screen nav; listeners cleaned; URLs revoked.

### 275. [web] Bundle optimization — final pass (R13.7/R13.8/R13.27)
Verify: First-Load JS ≤200KB gz per route. Route chunks ≤350KB gz. Heavy libs (ECharts, dnd-kit, xlsx)
dynamically imported + idle-prefetched. Tree-shaking. Vendor split. No prod sourcemaps. Pruned unused
deps (xlsx if unused).
**Verify:** bundle analyzer confirms ≤200KB gz; heavy libs lazy; no sourcemaps; deps pruned.

### 276. [seed] Final attendance + leave seed verification
Fresh seed: 13 employees, work schedule, holidays (standard Indian + company), capabilities, settings
(policy + TTLs + reminders), grace period. Attendance tables empty initially (populate on use). Sample
leave request (optional, for demo).
**Verify:** fresh seed → correct state; attendance populates on use; leave works.

### 277. [test] End-to-end smoke test script (production)
Script: login (3 roles) → clock in/out → HR team view → Admin overview → export → leave request →
approve → attendance integration → holiday calendar → offline punch → notifications → settings → audit
→ logout. All via real UI (Playwright or manual). Document results.
**Verify:** smoke test passes; all workflows functional; documented.

### 278. [deploy] Final clean production redeploy — Attendance Module
Final deploy: web + api + db migrate + seed. Clear caches. End-to-end verification: employee clock
in→break→out, HR team view + correction, Admin overview + export + reports, leave request→approve→
integration, holiday CRUD, offline, all 3 roles, mobile + desktop.
**Verify:** complete Attendance + Leave lifecycle in production; Sentry clean; perf within budget.

### 279. [docs] Update OpenSpec — specs + TRACKER
Update frozen specs (attendance + leave sections) to match implementation. Update TRACKER — Phase 2 ✅.
Record: shipped, decisions, performance notes (budgets met), gaps closed, deferred. All DR-* IDs recorded.
**Verify:** specs match implementation; TRACKER ✅; decisions recorded.

### 280. [docs] Archive Phase 2 + declare M1 Base + Attendance production-ready
Freeze Phase 2 spec. Declare: M1 Base Module + Attendance Module PRODUCTION-READY. Record what's live,
what's deferred (Projects/Tasks/Chat/Reports → plan-future-modules.md), performance field results (7-day
p75 within targets), rollback + backup verified.
**Verify:** Phase 2 archived; M1 Base + Attendance declared live; TRACKER ✅; future modules tracked.

---

## POST-PHASE-2: M1 Base + Attendance Module is PRODUCTION-READY

After all ~280 tasks complete + verified:
- ✅ **Base Module:** auth (token + cookie + lockout + suspicious + force-change + reset), app shell
  (3-state sidebar + pinned + breadcrumbs + mobile + density + theme), org CRUD (users + departments +
  designations + auto-numbering + export + activate/deactivate), directory (visibility + Send Message),
  profile (avatar + devices + visibility), settings (company + hours + grace + holidays + policies +
  numbering + reminders), audit (all actions + filters + export), notifications (bell + full page +
  priority + mark-all-read), dashboard (per-role real data + empty states + quick actions).
- ✅ **Attendance Module:** clock in/out/break (one-tap optimistic), live timer (global Zustand, persists
  across navigation), history heatmap (6 colors incl. overtime + leave), HR team view (filters + SWR +
  per-employee graph), Admin company overview (date/dept filters + analytics + trends), manual correction
  (add/edit/remove + reconcile), forgot-clock-out (flag + HR/Admin correct), export (.xlsx + date-range),
  leave (request + approve + history + holiday CRUD + recurring + working-days integration), offline
  (queue + sync + conflict), scheduler (configurable reminders + alerts + flags), notifications.
- ✅ One consistent design system (DR-DS1: white + charcoal + multi-color accents + rainbow hover).
- ✅ All shared components in packages/ui (Avatar, Progress, Combobox, DataTable with full features,
  FilterBar, etc.).
- ✅ Every workflow uses real data (no mocks/placeholders) — true empty states where no data.
- ✅ Responsive (360→1920, table→card mobile), accessible (WCAG AA, axe-core CI), performant (Lighthouse
  CI, bundle budgets, web-vitals).
- ✅ CI guardrails (axe-core + Lighthouse + bundle + web-vitals).
- ✅ Deployed to production (Vercel + Railway + Supabase), verified live, monitored (Sentry + Pulse).

**Remaining M1 modules** (Projects/Tasks, Chat, full Reports) → `plan-future-modules.md`. The
architecture, design system, and component library built in these ~280 tasks are the foundation — those
modules compose from the same primitives.

