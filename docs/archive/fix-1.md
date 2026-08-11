> **ARCHIVED:** This file is stale and superseded by context.md and fix-4.md.

> **ARCHIVED:** This file is stale and superseded by context.md and ix-3.md.

# fix-1.md — Sidebar, Responsive Behavior & Base UI: Final Fix Plan
## Games4King Workplace OS — App Shell Production Hardening

> **Scope (strict):** The application shell ONLY — sidebar (desktop expanded/collapsed + mobile
> drawer), top bar, mobile bottom nav, breadcrumbs, the grid layout that ties them together, and the
> directly-connected base design issues (typography, spacing, borders, surfaces, color hierarchy,
> buttons, form controls, responsive alignment). **No new features, no new modules, no architecture
> changes, no scope expansion.** We fix what exists against the frozen spec.
>
> **Authoritative references:**
> - `openspec/DESIGN-SYSTEM.md` §1 (palette), §3 (surfaces), §4 (typography), §5 (spacing), §6 (radius),
>   §7 (elevation), §8 (motion), §9 (sidebar — FINAL), §10 (logo — FINAL), §11 (density), §12 (states),
>   §15 (a11y), §16 (tokens)
> - `openspec/COMPONENT-SYSTEM.md` §0 (foundations), §4 (AppShell/NavItem/NavGroup/PinnedItems/Breadcrumb)
> - `openspec/REQUIREMENTS.md` R3.1–R3.16, R1.12, R13.22 (responsive/touch), R13.23 (a11y)
>
> **Locked decisions that govern this work:**
> - **DR-DS1:** White canvas + dark charcoal primary (`#1A1A2E`) + soft gray secondary + vibrant
>   multi-color accents (no single brand color dominates). Primary button = charcoal + animated rainbow
>   conic-gradient border on hover (already implemented in `button.tsx`). Navigation dark/neutral with
>   small colorful module icons.
> - **DR-DEN1:** Comfortable (default) + Compact density; toggle in avatar menu; persisted.
> - **DR-CMD1:** Ctrl+K = navigation + actions only (no global data search).
> - **DR-APPROACH1:** Refactor in place — preserve all working data flows.
>
> **Execution rule:** Audit → plan (this doc) → implement foundation-first → verify each phase →
> regression test → production build. No random fixes.

---

# PART 1 — AUDIT (current code vs. spec, with file:line evidence)

## 1.1 What is CORRECT (preserve — do NOT rebuild)

| # | Item | Evidence | Spec |
|---|---|---|---|
| C1 | Inter + Sora via `next/font`, `display: swap`, latin subset, CSS vars | `app/layout.tsx:8-18` | §4 ✓ |
| C2 | Providers wrap children: ThemeProvider (class, light default, system) + PersistQueryClientProvider + DensityProvider + ErrorBoundary + Toaster (top-right, 4s, richColors) + OfflineBanner | `providers.tsx:35-71` | R3.2 ✓ |
| C3 | Density state in `auth-store` (comfortable default), `setDensity`, persisted; `DensityProvider` sets `data-density` attr on `<html>` | `auth-store.ts:30-53`, `providers.tsx:27-33` | R3.2/§11 ✓ |
| C4 | 3-state sidebar enum (`expanded`/`collapsed`/`hidden`), persisted to localStorage `g4k-ui-storage`, synced to `/auth/preferences` | `ui-store.ts:5-57` | §9 ✓ |
| C5 | Default sidebar = `collapsed` | `ui-store.ts:18` | §9 ✓ |
| C6 | Ctrl+B dispatches `shortcut-toggle-sidebar`; layout wires the listener to `cycleSidebarState` | `use-shortcuts.ts:14-18`, `layout.tsx:167-171` | R3.11 ✓ |
| C7 | Per-module accent map (`getAccent` + `accentClasses`), active item = tinted bg + 3px left bar + bold | `layout.tsx:78-97,208-216` | DR-DS1 ✓ |
| C8 | Collapsed item = icon-only + Tooltip on hover (150ms delay, side=right) | `layout.tsx:239-246` | §9 ✓ |
| C9 | Role-aware nav filtering via `useCapabilities` + `hasCapability` (supports `*` wildcard) | `capabilities.ts:5-28`, `layout.tsx:173-179` | R2.1/R3.3 ✓ |
| C10 | Pinned items: query `/pins`, star toggle on hover, optimistic + undo toast, pinned section with divider | `layout.tsx:112-147,276-287` | R3.5 ✓ |
| C11 | Breadcrumbs: auto-generated from pathname, Home link + clickable crumbs, last = semibold, hidden on root | `breadcrumb.tsx:7-47` | R3.4 ✓ |
| C12 | TopbarTimer (mini timer when active shift, click → attendance, emerald/amber states) | `topbar-timer.tsx:8-35` | R5.2 ✓ |
| C13 | Command palette: Ctrl+K, navigation + actions + recent + theme (no data search) | `command-palette.tsx:42-250` | DR-CMD1 ✓ |
| C14 | HelpOverlay + Ctrl+/ | `use-shortcuts.ts:20-24`, `layout.tsx:254` | R3.11 ✓ |
| C15 | Ctrl+N dispatches `shortcut-action-new` | `use-shortcuts.ts:26-30` | R3.11 ✓ |
| C16 | Mobile bottom nav ≤5 items (Dashboard, Directory, Clock FAB, Org, Profile), `md:hidden`, `pb-safe` | `layout.tsx:446-497` | R3.3 ✓ |
| C17 | Logo assets present: icon, landscape, animated-logo.mp4, icon-192/512, maskable, apple-icon | `public/` | §10 ✓ |
| C18 | Charcoal primary token `#1A1A2E` + full accent palette CSS vars in globals.css | `globals.css:12-29` | DR-DS1 ✓ |
| C19 | Button primary = charcoal + animated rainbow conic-gradient border on hover (group-hover, motion-reduce:hidden) | `button.tsx:12,52` | DR-DS1 ✓ |
| C20 | `g4k_token` + `g4k_capabilities` cookies set on auth (available to middleware) | `auth-store.ts:45`, `capabilities.ts:14` | R1.12 enabler ✓ |

## 1.2 What DEVIATES from spec (the defects to fix)

> 21 defects, grouped. Each cites file:line + the spec it violates.

### Group A — Sidebar structure & navigation (spec §9, COMPONENT-SYSTEM §4)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **A1** | **Nav is a flat 14-item list — no section headers/groups.** Spec requires section headers (expanded) that become thin dividers (collapsed). ClickUp/Linear pattern: scannable groups. | `layout.tsx:57-72` flat `primaryNav` | §9 "Section headers shown in expanded; in collapsed, show as thin divider"; CS §4 NavGroup |
| **A2** | **`Settings` duplicated** — appears in `primaryNav` (line 70) AND `secondaryNav` (line 75). Two Settings entries render. | `layout.tsx:70,74-76` | bug |
| **A3** | **`secondaryNav` is redundant** — only contains Settings (already in primary). Adds a divider + duplicate for no value. | `layout.tsx:74-76,177-179,273-274` | — |
| **A4** | **`getAccent` incomplete** — no mapping for Chat/Hub, Projects, Tasks, Reports → all default to violet. Violates "every module accented." | `layout.tsx:88-97` (only 6 branches) | DR-DS1 |
| **A5** | **`accentClasses` map missing colors** — has emerald/amber/pink/blue/slate/rose/violet (7). Needs indigo, teal, cyan, orange, green for full module coverage. | `layout.tsx:78-86` | DR-DS1 |
| **A6** | **Sidebar logo always 28px.** Spec: 32px expanded, 28px collapsed. | `layout.tsx:263` (`width={28}`) | §10 |

### Group B — Sidebar state, motion & interaction (spec §8, §9)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **B1** | **Cycle order wrong.** Code: `expanded→collapsed→hidden→expanded`. From default (collapsed), first Ctrl+B → hidden (surprising — user expects to expand first). Should be `collapsed→expanded→hidden→collapsed`. | `ui-store.ts:36-41` | §9 (collapsed default; intuitive cycle) |
| **B2** | **Transition duration 300ms.** Spec: sidebar glide = **220ms** `cubic-bezier(.4,0,.2,1)`. | `layout.tsx:257` (`duration-300`) | §8/§9 |
| **B3** | **No phased label fade.** Spec: "Labels fade out (opacity 120ms) before width transitions; collapsed icons fade in." Code: labels vanish instantly when `isCollapsed` flips. | `layout.tsx:223` (conditional `{!currentlyCollapsed && ...}`) | §9 |
| **B4** | **Collapse toggle button is `w-8 h-8` (32px)** and absolutely positioned `-right-4` (half outside the sidebar). Touch target below 44px and can overlap content. | `layout.tsx:312` | §15/R13.22 (≥44px) |
| **B5** | **`thin-scrollbar` class referenced but undefined in CSS.** No scrollbar styling exists. | `layout.tsx:271`, `globals.css` (no rule) | §9 "thin, themed, 8px, auto-hide" |

### Group C — Top bar (spec §10, R3.3, DR-DS1)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **C-d1** | **TopBar has no logo on desktop when sidebar is hidden.** Spec §10: "On collapse of sidebar, the logo+wordmark remain in the top bar left." When `sidebarState=hidden`, the topbar left shows only search. | `layout.tsx:322-375` (no logo in topbar) | §10 |
| **C-d2** | **Hamburger condition is convoluted and broken:** `(isHidden || typeof window !== 'undefined' && window.innerWidth < 768)`. `window.innerWidth` is evaluated during render (SSR-unsafe, hydration mismatch risk) and is static after mount (doesn't react to resize). The hamburger should be purely CSS-driven (`md:hidden`), not JS-driven. | `layout.tsx:323` | responsive correctness |
| **C-d3** | **Nested Sheet trigger confusion.** When `isHidden`, there are TWO triggers: a `md:hidden` one (mobile) AND a `hidden md:flex` one (desktop hidden state), both inside the same `<Sheet open>` — fragile. The mobile and desktop-hidden cases should be handled cleanly. | `layout.tsx:324-334` | — |
| **C-d4** | **Search stub touch target ~38px** (`py-1.5`). Below the 44px minimum. | `layout.tsx:367` | R13.22 |
| **C-d5** | **Avatar focus ring hardcoded `ring-violet-500`.** Should use `ring` token (= primary/charcoal). | `layout.tsx:392` | DR-DS1/§16 |
| **C-d6** | **Dropdown icons all `text-violet-600`.** Violates "no single brand color dominates"; should be neutral `text-muted-foreground`. | `layout.tsx:408,414,422` | DR-DS1 |
| **C-d7** | **"Keyboard Shortcuts" menu item uses `Search` icon** (icon/label mismatch). Should be `Keyboard`. | `layout.tsx:418-424` | clarity |
| **C-d8** | **No density toggle in avatar dropdown** despite store existing. User cannot change density from the shell. | `layout.tsx:398-433` (no density item) | R3.2/DR-DEN1 |
| **C-d9** | **Theme toggle is binary (light↔dark).** No "System" option in the quick toggle. | `layout.tsx:379-386` | R3.2 (minor) |

### Group D — Mobile navigation (spec §9 Mobile, R3.3, R13.22)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **D-d1** | **Mobile bottom nav uses `text-violet-600`/`bg-violet-600` everywhere** (5 hardcoded violet refs). Active items, FAB all violet. Violates DR-DS1; should use per-item module accents. | `layout.tsx:451,462,471,480,491` | DR-DS1 |
| **D-d2** | **Bottom nav "Org" → `/dashboard/org/users`** requires `users.employee.manage` — most employees get 403 on tap. Must be a universally-accessible destination. | `layout.tsx:476-485` | R3.3 (usable by all) |
| **D-d3** | **Mobile Sheet content doesn't scroll independently** — no explicit height constraint; if nav is long, the logout is pushed off-screen. Needs `overflow-y-auto` + `flex-1` (present) but the Sheet's max-height isn't constrained to viewport. | `layout.tsx:343-357` | §9 mobile |
| **D-d4** | **No body-scroll-lock when mobile Sheet is open.** Background can scroll under the overlay. Radix Dialog (Sheet base) usually handles this, but verify; if not, add `scroll-lock`. | `layout.tsx:324` (Sheet) | a11y/UX |
| **D-d5** | **Mobile Sheet closes on pathname change** (good, `layout.tsx:150-152`) but there's no explicit outside-click/escape handling beyond Radix defaults. Verify Radix Sheet handles Esc + overlay click. | `layout.tsx:324` | — (verify) |

### Group E — Layout & content area (spec §9, §11)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **E1** | **`hidden` state uses `grid-cols-1`** (no sidebar column) but the desktop `<aside>` is `hidden md:flex`. On desktop with `hidden` state, the aside is `md:flex` but the grid is `grid-cols-1` → the aside renders but gets squeezed/overlaps because there's no column for it. **The grid template must match:** when `hidden`, the aside should be `hidden` on ALL breakpoints (not just md), OR the grid should reserve no column. Current: aside is `hidden md:flex` (shows on md+) but grid is `grid-cols-1` (no column) → broken layout at the `hidden` state on desktop. | `layout.tsx:258,261` | layout bug |
| **E2** | **Content `<main>` has `pb-24 md:pb-6`** to clear the mobile bottom nav. Correct, but the `max-w-[1440px]` wrapper is always applied — spec §11 says 1440px for list/table pages, **fluid for dashboards**. Dashboards get over-constrained. (Minor — acceptable for now; flag for later.) | `layout.tsx:438-439` | §11 (minor) |
| **E3** | **`overflow-hidden` on root grid + `overflow-y-auto` on main.** Correct pattern (sidebar fixed, content scrolls). Verify sidebar's own `overflow-y-auto` (`layout.tsx:271`) doesn't conflict with the `h-full` aside. Currently OK. | `layout.tsx:256,271,438` | — (verify) |

### Group F — Base design consistency (spec §1-§7, §12, DR-DS1)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **F1** | **Nav item uses `text-neutral-600 dark:text-neutral-400`** instead of `text-secondary`/`text-muted` tokens. Inconsistent with token system. | `layout.tsx:210` | §16 (tokens) |
| **F2** | **Hover bg uses `hover:bg-neutral-100 dark:hover:bg-neutral-800`** instead of `hover:bg-surface-2` token. | `layout.tsx:210` | §16 |
| **F3** | **Search stub uses `bg-neutral-50 dark:bg-neutral-900` + `text-neutral-400`** instead of surface/muted tokens. | `layout.tsx:367` | §16 |
| **F4** | **`<kbd>` uses `bg-neutral-200 dark:bg-neutral-800`** — minor, but should be a token. | `layout.tsx:371` | §16 |
| **F5** | **Nav item active text size `text-xs`** — spec §4 typography scale has `text-sm` (0.875) as the small UI default. `text-xs` (0.75) is very small for nav labels; ClickUp uses ~13-14px. Consider `text-sm` for expanded labels. | `layout.tsx:207` | §4 (minor) |
| **F6** | **Nav item padding `px-3 py-2.5`** — spec §5 spacing scale + §9. Acceptable but verify against density (compact should reduce py). Currently density doesn't affect nav item height. | `layout.tsx:207` | §11 (density-aware) |
| **F7** | **No `focus-visible` ring on nav `<Link>` items.** Keyboard users can't see which nav item is focused. Radix Link doesn't auto-add this. | `layout.tsx:204-213` | §12/§15/R13.23 |
| **F8** | **Sidebar header height `h-16` (64px)** matches topbar — good alignment. But border-b uses `border-border` (correct). Verify header content vertically centers. | `layout.tsx:262` | — (verify) |

### Group G — Accessibility & robustness (spec §15, R13.23)

| ID | Defect | Evidence | Spec |
|---|---|---|---|
| **G1** | **No `middleware.ts`** — deep-links to capability-gated routes aren't client-blocked. Nav is hidden, but a user can type `/dashboard/org/users` directly. Backend returns 403 (correct), but the UX is poor (no toast, just an error page). | (file missing) | R1.12 |
| **G2** | **`window.innerWidth` in render** (`layout.tsx:323`) — SSR mismatch + doesn't react to resize. Must be CSS-driven. | `layout.tsx:323` | robustness |
| **G3** | **Pinned items bypass capability re-check** — re-rendered with `capability: ""`. If a user's role changes, stale pins remain visible (clicking → 403). | `layout.tsx:284` | R3.5 edge |
| **G4** | **Avatar dropdown trigger is a `<button>` wrapping `<Avatar>`** — the focus ring is on the button (`ring-violet-500`), but the avatar itself has no alt/label. Add `aria-label`. | `layout.tsx:391-396` | §15 |

---

# PART 2 — IMPLEMENTATION PLAN (phased, foundation-first)

> Each phase: **Inspect · Change · Do-not-change · Depends-on · Acceptance · Verify.**
> Tags: `[shell]` structure · `[style]` visual/token · `[motion]` animation · `[a11y]` accessibility · `[ux]` interaction · `[fix]` bug

---

## PHASE 0 — Requirement & existing implementation audit (DONE — Part 1 above)
**Status:** Complete. 20 correct items preserved; 21 defects catalogued with file:line + spec citations.

---

## PHASE 1 — Design-system / base UI audit & token enforcement
> Enforce the frozen token system everywhere in the shell before touching structure. This makes all
> subsequent visual work consistent.

### 1.1 [style] Add the missing accent colors to `accentClasses` (fixes A5)
**Inspect:** `layout.tsx:78-86` — only 7 colors.
**Change:** Add `indigo`, `teal`, `cyan`, `orange`, `green` with the same `{bg, text, bgDark, textDark, border}` shape (light-100/700, dark-950/300, 600 border).
**Do-not-change:** Existing 7 colors (correct).
**Depends-on:** Nothing.
**Acceptance:** 12 accent entries; each renders correct tinted bg + text in light/dark.
**Verify:** Visual — each color's active state is readable (WCAG AA).

### 1.2 [style] Complete `getAccent` for all modules (fixes A4)
**Inspect:** `layout.tsx:88-97` — 6 branches.
**Change:** Add branches for every nav route per DR-DS1 module map:
- `/dashboard` → blue · `/dashboard/chat` → violet · `/dashboard/projects` → orange · `/dashboard/tasks` → green · `/dashboard/attendance` → emerald · `/dashboard/leave` → amber · `/dashboard/directory` → pink · `/dashboard/org/users` → indigo · `/dashboard/org/attendance` → emerald · `/dashboard/org/leave` → amber · `/dashboard/org/departments` → indigo · `/dashboard/org/designations` → indigo · `/dashboard/profile` → cyan · `/dashboard/settings` → teal · `/dashboard/audit` → rose.
**Do-not-change:** Existing branches.
**Acceptance:** No nav item falls back to default; each active item shows its assigned accent.
**Verify:** Navigate to each route → active item shows correct accent color.

### 1.3 [style] Replace hardcoded neutral colors with tokens (fixes F1, F2, F3, F4)
**Inspect:** `layout.tsx:210,367,371`.
**Change:**
- Nav inactive: `text-neutral-600 dark:text-neutral-400` → `text-secondary`
- Nav hover bg: `hover:bg-neutral-100 dark:hover:bg-neutral-800` → `hover:bg-surface-2`
- Search stub: `bg-neutral-50 dark:bg-neutral-900` → `bg-surface-2`; `text-neutral-400` → `text-muted`; hover text → `text-secondary`
- `<kbd>`: `bg-neutral-200 dark:bg-neutral-800` → `bg-surface-2`
**Do-not-change:** Functional behavior.
**Acceptance:** grep `neutral-100\|neutral-200\|neutral-50\|neutral-900` in layout.tsx → zero (except where neutral is intentional, e.g. logout rose hover).
**Verify:** Visual parity in light + dark; tokens drive colors.

### 1.4 [style] Add `.thin-scrollbar` utility to globals.css (fixes B5)
**Inspect:** `globals.css` — no scrollbar rules; `layout.tsx:271` uses the class.
**Change:** Add under `@layer utilities`:
```css
.thin-scrollbar { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.thin-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
.thin-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 4px; }
.thin-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--border-strong); }
```
**Do-not-change:** Other utilities.
**Acceptance:** Sidebar scroll area shows thin themed scrollbar (8px, border color).
**Verify:** Scroll a long nav list → thin scrollbar visible; hover → border-strong.

### 1.5 [a11y] Add `focus-visible` ring to nav links (fixes F7)
**Inspect:** `layout.tsx:204-213` — no focus style on `<Link>`.
**Change:** Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-lg` to the Link className.
**Do-not-change:** Active/hover styles.
**Acceptance:** Tab through nav → visible ring on each focused item.
**Verify:** Keyboard-only nav → ring visible on each item.

### 1.6 [a11y] Avatar trigger aria-label + token ring (fixes C-d5, G4)
**Inspect:** `layout.tsx:391-396`.
**Change:** `<button aria-label="Open user menu" className="... focus-visible:ring-2 focus-visible:ring-ring ...">` (replace `ring-violet-500`).
**Do-not-change:** Avatar component.
**Acceptance:** Screen reader announces "Open user menu"; focus ring uses token.
**Verify:** Tab to avatar → ring visible; VoiceOver announces label.

**Phase 1 acceptance:** All shell colors come from tokens; all accents defined; scrollbars themed; focus states present. **No layout/structure change yet.**

---

## PHASE 2 — Sidebar architecture & state management
> Fix the data model (groups) and state machine (cycle order) before rendering.

### 2.1 [shell] Restructure nav into grouped sections (fixes A1, A2, A3)
**Inspect:** `layout.tsx:57-76` — flat `primaryNav` + redundant `secondaryNav`.
**Change:**
1. Delete `secondaryNav` entirely (A2, A3).
2. Replace `primaryNav` flat array with a grouped structure:
```ts
const navGroups = [
  { label: "Workspace", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Chat & Hub", href: "/dashboard/chat", icon: MessageSquare, capability: "directory.send-message" },
  ]},
  { label: "My Work", items: [
    { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
    { name: "Leave & Time Off", href: "/dashboard/leave", icon: CalendarDays, capability: "leave.request-self" },
    { name: "Projects", href: "/dashboard/projects", icon: Folder, capability: "projects.manage" },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, capability: "tasks.submit" },
  ]},
  { label: "People", items: [
    { name: "Directory", href: "/dashboard/directory", icon: Users, capability: "directory.view" },
  ]},
  { label: "Administration", items: [
    { name: "Employees", href: "/dashboard/org/users", icon: Users, capability: "users.employee.manage" },
    { name: "Team Attendance", href: "/dashboard/org/attendance", icon: Clock, capability: "hr.view-team-attendance" },
    { name: "Leave Approvals", href: "/dashboard/org/leave", icon: CalendarDays, capability: "leave.approve-employee" },
    { name: "Departments", href: "/dashboard/org/departments", icon: Building2, capability: "departments.manage" },
    { name: "Designations", href: "/dashboard/org/designations", icon: Briefcase, capability: "designations.manage" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, capability: "settings.manage" },
    { name: "Audit Log", href: "/dashboard/audit", icon: ShieldAlert, capability: "audit.view" },
  ]},
  { label: "Account", items: [
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle, capability: "profile.edit" },
  ]},
];
```
3. Create `components/app-shell/nav-group.tsx`:
   - **Expanded:** section header (`text-[10px] font-bold tracking-wider text-muted uppercase px-3 mb-1 mt-4`) + items. Use static headers (not collapsible accordion) — matches ClickUp's scannable pattern; the spec's "parent expands/collapses child group" applies to deeper nesting which we don't have.
   - **Collapsed:** thin divider (`h-px bg-border mx-2 my-3`) replacing the header; items render below as icons.
   - **Filter:** each group filters its items by capability; if zero items remain, hide the whole group (header + divider).
   - The component receives `items`, `isCollapsed`, `pins`, and reuses the existing item-render logic (extract a `NavItem` component to avoid duplication).
**Do-not-change:** Pin logic, capability filter function, active-state logic, accent logic.
**Depends-on:** Phase 1 (accents defined).
**Acceptance:** Expanded sidebar shows 5 section headers; collapsed shows dividers; no duplicate Settings; empty groups hidden.
**Verify:** As Employee → "Administration" group hidden (no caps); as Admin → all groups show; as HR → "Administration" shows only team-scoped items.

### 2.2 [shell] Extract `NavItem` component (deduplicate)
**Inspect:** `layout.tsx:193-249` — `renderNavItems` inline; same logic used for primary, secondary, pinned, mobile.
**Change:** Extract a `<NavItem>` component (in `nav-group.tsx` or `components/app-shell/nav-item.tsx`) that handles: active state, accent, collapsed tooltip, pin star toggle. Reuse it in desktop sidebar, mobile Sheet, and pinned section. Single source of truth.
**Do-not-change:** Visual styling, pin mutation logic.
**Acceptance:** One `NavItem` component used everywhere; no duplicated item-render code.
**Verify:** Desktop + mobile + pinned all render identically-styled items.

### 2.3 [ux] Fix sidebar cycle order (fixes B1)
**Inspect:** `ui-store.ts:36-41`.
**Change:**
```ts
const nextState = current === "collapsed" ? "expanded"
  : current === "expanded" ? "hidden" : "collapsed";
```
**Do-not-change:** Persistence, preferences sync.
**Acceptance:** Default (collapsed) → Ctrl+B → expanded → Ctrl+B → hidden → Ctrl+B → collapsed.
**Verify:** Press Ctrl+B repeatedly → cycles in this order; reload preserves each state.

### 2.4 [fix] Fix `hidden` state layout bug (fixes E1)
**Inspect:** `layout.tsx:258,261`.
**Change:** When `sidebarState === "hidden"`, the desktop `<aside>` must NOT render (it currently does via `hidden md:flex`). Make the aside conditional:
```tsx
<aside className={cn("bg-surface border-r border-border relative z-20 overflow-hidden h-full",
  sidebarState === "hidden" ? "hidden" : "hidden md:flex flex-col")}>
```
And the grid: when `hidden`, use `grid-cols-1` (already does). Now aside is fully hidden at all breakpoints when state=hidden → no overlap. The topbar hamburger (Phase 4) provides nav access in this state.
**Do-not-change:** Expanded/collapsed grid templates.
**Acceptance:** `hidden` state on desktop → no sidebar column, content full-width, no squeezed aside.
**Verify:** Set sidebar to hidden → content fills width; no empty/overlapping sidebar.

**Phase 2 acceptance:** Nav is grouped + deduplicated; state machine correct; hidden state doesn't break layout. **Still no mobile rework.**

---

## PHASE 3 — Desktop expanded/collapsed behavior
> Polish the two desktop states to spec.

### 3.1 [style] Sidebar logo sizes (fixes A6)
**Inspect:** `layout.tsx:263`.
**Change:** `width={isCollapsed ? 28 : 32} height={isCollapsed ? 28 : 32}`.
**Do-not-change:** Wordmark conditional.
**Acceptance:** Expanded logo 32px; collapsed 28px.
**Verify:** Toggle → logo resizes.

### 3.2 [motion] Correct transition duration + easing (fixes B2)
**Inspect:** `layout.tsx:257` (`duration-300`).
**Change:** `duration-200` (Tailwind v4 maps 200→200ms; or use arbitrary `duration-[220ms]`) + keep `ease-[cubic-bezier(.4,0,.2,1)]`. Spec: 220ms.
**Do-not-change:** Grid template logic.
**Acceptance:** Sidebar glide is 220ms with correct easing.
**Verify:** Toggle → smooth 220ms glide.

### 3.3 [motion] Phased label fade (fixes B3)
**Inspect:** `layout.tsx:223` — instant label hide.
**Change:** Introduce a `showLabels` state in the layout that lags the collapse by 100ms:
```ts
const [showLabels, setShowLabels] = useState(!isCollapsed);
useEffect(() => {
  if (isCollapsed) { const t = setTimeout(() => setShowLabels(false), 100); return () => clearTimeout(t); }
  setShowLabels(true);
}, [isCollapsed]);
```
Render label as:
```tsx
{showLabels && (
  <span className={cn("whitespace-nowrap transition-opacity duration-100",
    isCollapsed && showLabels ? "opacity-0" : "opacity-100")}>
    {item.name}
  </span>
)}
```
Labels fade out (100ms opacity) before the 220ms width shrink; on expand, labels appear immediately and fade in.
**Do-not-change:** Collapsed tooltip logic.
**Depends-on:** 3.2 (duration fix).
**Acceptance:** On collapse, labels fade then width shrinks; on expand, width grows then labels appear.
**Verify:** Slow-toggle (watch closely) → phased motion visible.

### 3.4 [a11y] Collapse toggle button size (fixes B4)
**Inspect:** `layout.tsx:312` — `w-8 h-8` (32px).
**Change:** `w-9 h-9` (36px) minimum; keep `-right-4` but verify it doesn't overlap content (add `z-30`). Alternatively, move the toggle inside the sidebar header (cleaner, no overlap). **Recommended:** move toggle to sidebar header next to the logo/wordmark area as a small ghost button — always visible, no overlap.
**Do-not-change:** Cycle behavior.
**Acceptance:** Toggle is ≥36px, fully visible, doesn't overlap content.
**Verify:** Click toggle at both states; no overlap.

### 3.5 [style] Nav item typography + density-aware spacing (fixes F5, F6)
**Inspect:** `layout.tsx:207` — `text-xs`, `px-3 py-2.5`, not density-aware.
**Change:**
- Expanded label: `text-sm` (was `text-xs`) for readability.
- Padding: comfortable `px-3 py-2.5`; compact `px-3 py-1.5` — read density from `useAuthStore`:
```tsx
const { density } = useAuthStore();
const itemPy = density === "compact" ? "py-1.5" : "py-2.5";
```
**Do-not-change:** Icon size (`w-4 h-4`).
**Acceptance:** Expanded labels are `text-sm`; compact mode shrinks item height.
**Verify:** Toggle density → nav item heights change; labels readable.

**Phase 3 acceptance:** Desktop expanded = icon+text (32px logo, sm labels, section headers); collapsed = icon-only (28px logo, tooltips, dividers); 220ms phased motion; density affects spacing.

---

## PHASE 4 — Mobile hidden/hamburger/drawer behavior
> Mobile is a SEPARATE behavior — never use desktop collapsed pattern.

### 4.1 [fix] Remove `window.innerWidth` from render (fixes C-d2, G2)
**Inspect:** `layout.tsx:323` — `(isHidden || typeof window !== 'undefined' && window.innerWidth < 768)`.
**Change:** Make the hamburger purely CSS-driven. The mobile hamburger should show whenever the desktop sidebar isn't visible — i.e., always on `<768px` (via `md:hidden`) AND on desktop when `sidebarState==="hidden"` (via conditional `hidden md:flex`). Remove the `window.innerWidth` check entirely:
```tsx
{/* Mobile hamburger — always on small screens */}
<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-9 w-9">
      <Menu className="w-5 h-5" />
    </Button>
  </SheetTrigger>
  <SheetContent ...>...</SheetContent>
</Sheet>
{/* Desktop hamburger — only when sidebar hidden */}
{sidebarState === "hidden" && (
  <Button variant="ghost" size="icon" className="hidden md:flex shrink-0 h-9 w-9"
    onClick={() => setIsMobileMenuOpen(true)}>
    <Menu className="w-5 h-5" />
  </Button>
)}
```
Two separate triggers, one shared Sheet state. No SSR mismatch.
**Do-not-change:** Sheet content (will update in 4.2).
**Acceptance:** No `window.innerWidth` in render; hamburger shows correctly on mobile + desktop-hidden.
**Verify:** Resize across 360/768/1024 → hamburger appears/disappears via CSS only.

### 4.2 [shell] Mobile drawer uses grouped nav + scroll + body lock (fixes D-d3, D-d4)
**Inspect:** `layout.tsx:335-358` — Sheet content.
**Change:**
- Render the SAME `navGroups` (Phase 2.1) in the Sheet, expanded style (always show labels in mobile).
- Wrap nav in `<ScrollArea className="flex-1">` or `overflow-y-auto` with `max-h-[calc(100vh-4rem-3rem)]` (viewport minus header minus logout footer).
- Ensure Sheet has `h-full` and the content is a flex column: header (h-16) + nav (flex-1 scroll) + logout footer.
- Body scroll lock: Radix Dialog (Sheet base) locks body scroll by default — **verify** this works; if not, the Sheet content scrolling independently is the fallback.
**Do-not-change:** Logout button at bottom.
**Acceptance:** Mobile drawer shows grouped nav, scrolls if long, logout always visible.
**Verify:** Open drawer on a small phone → all groups visible by scroll; logout reachable.

### 4.3 [fix] Mobile bottom nav: per-item accents + accessible destinations (fixes D-d1, D-d2)
**Inspect:** `layout.tsx:446-497` — violet everywhere; "Org" → users page.
**Change:**
- Replace the 5 items with per-item accent colors:
```ts
const bottomNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home", active: "text-blue-600 dark:text-blue-400" },
  { href: "/dashboard/directory", icon: Users, label: "Directory", active: "text-pink-600 dark:text-pink-400" },
  { href: "/dashboard/attendance", icon: Clock, label: "Clock", active: "text-emerald-600 dark:text-emerald-400", isFAB: true },
  { href: "/dashboard/leave", icon: CalendarDays, label: "Leave", active: "text-amber-600 dark:text-amber-400" },
  { href: "/dashboard/profile", icon: UserCircle, label: "Profile", active: "text-cyan-600 dark:text-cyan-400" },
];
```
- **Replace "Org" with "Leave"** (`/dashboard/leave`, accessible to all via `leave.request-self`).
- **FAB Clock → `/dashboard/attendance`** (self-attendance, accessible to all).
- FAB color: `bg-emerald-600 hover:bg-emerald-700` (attendance accent).
- Map active state via `pathname === href` or `startsWith`.
**Do-not-change:** FAB elevated style (`-mt-5 shadow-lg`).
**Acceptance:** Every bottom-nav item is tappable by every role (no 403); active = module accent; FAB emerald.
**Verify:** As Employee → tap each item → navigates successfully.

### 4.4 [ux] Drawer close behavior (verify D-d5)
**Inspect:** `layout.tsx:324` (Sheet) + `150-152` (pathname close).
**Change:** Verify: (a) Esc closes (Radix default), (b) overlay click closes (Radix default), (c) nav click closes (pathname effect). If any fails, add explicit handler. No change needed if Radix defaults work.
**Acceptance:** All 3 close paths work.
**Verify:** Open drawer → Esc / overlay click / nav tap → closes.

**Phase 4 acceptance:** Mobile = hidden sidebar + CSS-driven hamburger + grouped drawer + per-accent bottom nav (all items accessible) + correct close behavior.

---

## PHASE 5 — Responsive layout integration
> Ensure correct behavior across ALL breakpoints, not just desktop/mobile.

### 5.1 [shell] TopBar logo on desktop-hidden (fixes C-d1)
**Inspect:** `layout.tsx:322-375` — no logo in topbar.
**Change:** Add logo + wordmark to topbar left, shown only when sidebar is hidden (desktop) so orientation is preserved:
```tsx
{sidebarState === "hidden" && (
  <div className="hidden md:flex items-center gap-2 shrink-0">
    <Image src="/icon.png" alt="Logo" width={24} height={24} className="rounded-md" priority />
    <span className="font-display font-bold text-sm text-primary tracking-tight hidden lg:inline">Workplace OS</span>
  </div>
)}
```
Place BEFORE the desktop hamburger. On mobile, the hamburger + search is enough (logo is in the drawer header).
**Do-not-change:** Search stub.
**Acceptance:** Sidebar hidden (desktop) → topbar shows logo+wordmark (lg).
**Verify:** Set hidden → logo appears in topbar.

### 5.2 [ux] Search stub touch target (fixes C-d4)
**Inspect:** `layout.tsx:367` — `py-1.5` (~38px).
**Change:** `py-2` (~44px) to meet minimum.
**Acceptance:** Search stub ≥44px tall.
**Verify:** Tap target comfortable on mobile.

### 5.3 [shell] Breakpoint audit (768 / 1024 / 1280 / 1440)
**Inspect:** All shell breakpoints.
**Change:** Verify at each:
- **<768 (mobile):** sidebar hidden, hamburger visible, bottom nav visible, content full-width with pb-24.
- **768-1024 (tablet):** sidebar shown (collapsed default), bottom nav hidden (`md:hidden`), hamburger hidden (`md:flex` sidebar).
- **1024-1440 (desktop):** sidebar expanded/collapsed, full nav.
- **>1440:** content capped at `max-w-[1440px]` centered (current). Dashboards should be fluid (flag E2, defer).
**Do-not-change:** Breakpoint values (`md`=768).
**Acceptance:** No layout break at any breakpoint; transitions smooth.
**Verify:** Browser resize 360→1920 slowly; screenshot each stop.

**Phase 5 acceptance:** All breakpoints correct; topbar logo on hidden; touch targets met.

---

## PHASE 6 — Top bar controls: theme, density, dropdown polish
> Complete the avatar dropdown + theme per DR-DEN1/R3.2.

### 6.1 [shell] Add density toggle to avatar dropdown (fixes C-d8)
**Inspect:** `layout.tsx:398-433`.
**Change:** Add a density section (after Settings, before Shortcuts):
```tsx
<DropdownMenuSeparator />
<DropdownMenuLabel className="text-[10px] text-muted uppercase tracking-wider">Density</DropdownMenuLabel>
<DropdownMenuItem onClick={() => setDensity("comfortable")} className="cursor-pointer gap-2">
  <Rows3 className="w-4 h-4" />
  <span>Comfortable</span>
  {density === "comfortable" && <Check className="w-3 h-3 ml-auto text-primary" />}
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setDensity("compact")} className="cursor-pointer gap-2">
  <Rows2 className="w-4 h-4" />
  <span>Compact</span>
  {density === "compact" && <Check className="w-3 h-3 ml-auto text-primary" />}
</DropdownMenuItem>
```
Pull `density` + `setDensity` from `useAuthStore`. Optionally sync to `/auth/preferences`.
**Do-not-change:** DensityProvider (already sets `data-density`).
**Acceptance:** Density selectable; current marked; persists; affects nav item height (Phase 3.5).
**Verify:** Switch density → nav heights change; reload preserves.

### 6.2 [style] Dropdown icons neutral + fix shortcut icon (fixes C-d6, C-d7)
**Inspect:** `layout.tsx:408,414,422` (violet icons); `418-424` (Search icon for shortcuts).
**Change:**
- Remove `text-violet-600` from Profile/Settings icons → `text-muted-foreground`.
- Replace `Search` with `Keyboard` (lucide) for "Keyboard Shortcuts".
**Acceptance:** Icons neutral/muted; shortcut icon is a keyboard.
**Verify:** Open dropdown → muted icons; keyboard icon for shortcuts.

### 6.3 [ux] Theme toggle + System option (fixes C-d9)
**Inspect:** `layout.tsx:379-386`.
**Change:** Keep topbar toggle binary (light↔dark) for simplicity; add a "Use System Theme" item in the avatar dropdown (cycle: setTheme("system")). Icon for topbar: light=Sun, dark=Moon.
**Acceptance:** Topbar toggles light/dark; dropdown offers System.
**Verify:** Toggle works; System option applies.

**Phase 6 acceptance:** Density controllable; dropdown polished; theme complete.

---

## PHASE 7 — Navigation, active states, interaction validation
> Verify every nav item works in both states + correct active detection.

### 7.1 [shell] Pinned items respect capability (fixes G3)
**Inspect:** `layout.tsx:280-285` — `capability: ""` bypass.
**Change:** When rendering pinned items, look up the original nav item across all groups and re-check capability:
```ts
const allItems = navGroups.flatMap(g => g.items);
const original = allItems.find(n => n.name === pin.target_id);
if (original?.capability && !hasCapability(userCapabilities, original.capability)) return null;
```
**Do-not-change:** Pin mutation logic.
**Acceptance:** Stale pins (lost capability) hidden.
**Verify:** Pin item → change role → item hidden in pinned.

### 7.2 [a11y] Route-level capability middleware (fixes G1)
**Inspect:** No `middleware.ts`.
**Change:** Create `apps/web/src/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED: Record<string, string> = {
  "/dashboard/org/users": "users.employee.manage",
  "/dashboard/org/attendance": "hr.view-team-attendance",
  "/dashboard/org/leave": "leave.approve-employee",
  "/dashboard/org/departments": "departments.manage",
  "/dashboard/org/designations": "designations.manage",
  "/dashboard/settings": "settings.manage",
  "/dashboard/audit": "audit.view",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  const token = req.cookies.get("g4k_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const required = Object.entries(PROTECTED).find(([r]) => pathname.startsWith(r))?.[1];
  if (required) {
    const raw = req.cookies.get("g4k_capabilities")?.value;
    let caps: string[] = [];
    try { caps = raw ? JSON.parse(decodeURIComponent(raw)) : []; } catch {}
    const ok = caps.includes("*") || caps.includes(required);
    if (!ok) return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
```
**Do-not-change:** Backend remains source of truth (R2.1).
**Acceptance:** Deep-link to unauthorized → redirect with toast.
**Verify:** Employee deep-links `/dashboard/org/users` → redirected.

### 7.3 [ux] Active-state detection accuracy
**Inspect:** `layout.tsx:195` — `pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))`.
**Change:** Verify edge cases:
- `/dashboard` (exact match only, else every route is "active").
- `/dashboard/org/attendance` vs `/dashboard/attendance` (org prefix shouldn't activate self-attendance).
- The current logic is correct (`!== "/dashboard"` guard + `startsWith`). **No change needed** — just verify.
**Acceptance:** Only the truly-active item shows active state.
**Verify:** Navigate between /dashboard/attendance and /dashboard/org/attendance → correct item active.

### 7.4 [ux] Add `?error=unauthorized` toast on redirect
**Inspect:** Dashboard page reads searchParams? No.
**Change:** In `dashboard/page.tsx`, read `useSearchParams()`; if `error==="unauthorized"`, show toast.error("You don't have access to that section.") and `router.replace("/dashboard")`.
**Acceptance:** Redirected user sees explanation.
**Verify:** Deep-link unauthorized → land on dashboard with toast.

**Phase 7 acceptance:** All nav items reachable in both states; active states correct; deep-links guarded with clear UX.

---

## PHASE 8 — Cross-page consistency fixes (shell-adjacent only)
> Only fix base design issues DIRECTLY connected to the shell — no page rewrites.

### 8.1 [style] Ensure `PageContainer` consistent gutter + breadcrumb slot
**Inspect:** `layout.tsx:438-443` — main has `p-4 md:p-6 lg:p-8` + Breadcrumb + children.
**Change:** Verify every page uses the same inner padding (the main wrapper provides it; pages shouldn't double-pad). If pages add their own `p-6`, remove. **Audit-only** — fix only if pages clearly double-pad.
**Acceptance:** Consistent gutter across pages.
**Verify:** Navigate 5 pages → same outer padding.

### 8.2 [style] Verify topbar/sidebar content alignment
**Inspect:** `layout.tsx:262,321` — both `h-16`.
**Change:** Verify logo vertical centering in both; verify border-b alignment. **No change expected.**
**Acceptance:** Sidebar header + topbar visually aligned.
**Verify:** Visual at all breakpoints.

### 8.3 [style] Confirm tokens used on shell-adjacent surfaces
**Inspect:** Cards, inputs, buttons used inside pages — do they use tokens?
**Change:** **Audit-only.** If a page-level component hardcodes colors, flag it for the page's own task (out of scope here). Only fix if the shell itself leaks hardcoded colors (covered in Phase 1).
**Acceptance:** Shell + its direct children fully token-driven.
**Verify:** grep hardcoded hex in layout.tsx + nav components → zero.

**Phase 8 acceptance:** Shell-imposed consistency verified; no page rewrites.

---

## PHASE 9 — Regression testing (full verification matrix)

> Run this COMPLETE matrix after Phases 1-8. Each must pass.

### 9.1 Desktop expanded sidebar (≥1024px, state=expanded)
- [ ] Logo 32px + wordmark visible.
- [ ] 5 section headers visible (Workspace / My Work / People / Administration / Account).
- [ ] Empty groups hidden per role.
- [ ] Active item: tinted bg + 3px left bar (module accent) + bold + `text-sm` label.
- [ ] Hover: `bg-surface-2`.
- [ ] Focus-visible: ring on each item (keyboard).
- [ ] Pin star appears on hover; toggles; undo toast.
- [ ] Pinned section at bottom; respects capability.
- [ ] Collapse toggle visible (≥36px); clicking → 220ms phased glide to collapsed.
- [ ] Scroll long nav → thin themed scrollbar.
- [ ] Logout at bottom (rose accent).

### 9.2 Desktop collapsed sidebar (≥1024px, state=collapsed)
- [ ] Width 72px; logo 28px (no wordmark).
- [ ] Icons centered; tooltips on hover (150ms, side=right).
- [ ] Section headers → thin dividers.
- [ ] Active item: accent bg + left bar.
- [ ] Collapse toggle → expands (220ms glide, labels fade in).
- [ ] Pin star hidden (can't pin when collapsed — acceptable).

### 9.3 Desktop hidden sidebar (state=hidden)
- [ ] No sidebar column; content full-width.
- [ ] Topbar shows logo + wordmark (lg) + desktop hamburger.
- [ ] Hamburger opens Sheet drawer (grouped nav).
- [ ] No `window.innerWidth` in code; purely CSS-driven.

### 9.4 Tablet (768-1024px)
- [ ] Sidebar visible (collapsed default) — same as 9.2.
- [ ] Bottom nav hidden (`md:hidden`).
- [ ] Hamburger hidden (sidebar present).
- [ ] No layout break.

### 9.5 Mobile closed (<768px)
- [ ] Sidebar hidden.
- [ ] Bottom nav visible (5 items: Home/Directory/Clock-FAB/Leave/Profile).
- [ ] Hamburger visible in topbar (left).
- [ ] Topbar: hamburger + search + timer + theme + bell + avatar.
- [ ] Content full-width with `pb-24` (clears bottom nav).

### 9.6 Mobile opened (drawer)
- [ ] Hamburger tap → Sheet slides from left (280px).
- [ ] Grouped nav (all labels visible).
- [ ] Scrolls if long; logout reachable.
- [ ] Esc closes; overlay click closes; nav tap closes.
- [ ] Body scroll locked (no background scroll).
- [ ] No layout overflow.

### 9.7 Every navigation item (all 3 roles)
- [ ] **Employee:** Dashboard, Attendance, Leave, Directory, Profile, Chat&Hub(if cap). No admin items.
- [ ] **HR:** + Team Attendance, Leave Approvals (employee), Departments(view), Designations(view).
- [ ] **Admin:** All items.
- [ ] Each item navigates to a working page (no 404/403 for authorized).
- [ ] Deep-link to unauthorized → redirect to `/dashboard?error=unauthorized` + toast.

### 9.8 Active states
- [ ] Only the truly-active item highlighted.
- [ ] `/dashboard/org/attendance` doesn't activate `/dashboard/attendance`.
- [ ] Active persists on reload (URL-driven).

### 9.9 Page transitions + refresh
- [ ] Nav click → client-side route (no full reload).
- [ ] Refresh on any route → preserves auth, sidebar state, theme, density.
- [ ] Direct URL access → works (middleware guards unauthorized).

### 9.10 Content resizing + scrolling
- [ ] Toggle sidebar → content resizes smoothly (220ms).
- [ ] Long content → main scrolls (sidebar fixed).
- [ ] No horizontal overflow at any breakpoint.

### 9.11 Existing functionality
- [ ] Login → dashboard → logout works.
- [ ] Theme toggle (light/dark) + system option.
- [ ] Density toggle (comfortable/compact) affects nav heights.
- [ ] Ctrl+K palette, Ctrl+B sidebar, Ctrl+/ help all work.
- [ ] Notifications bell, TopbarTimer unchanged.
- [ ] PWA: manifest + SW registration intact.

---

## PHASE 10 — Production build & deployment verification

### 10.1 [deploy] Production build
**Change:** `pnpm --filter web build` → verify zero TypeScript errors, zero build warnings.
**Acceptance:** Build succeeds clean.
**Verify:** Build log green.

### 10.2 [deploy] Bundle size check
**Change:** Verify shell routes First-Load JS ≤200KB gz (R13.7). No new heavy deps added (we only add a small NavItem/NavGroup component + middleware).
**Acceptance:** Within budget.
**Verify:** Bundle analyzer.

### 10.3 [deploy] axe-core scan (R13.23)
**Change:** Run axe-core on dashboard layout at 360/768/1440. Fix any critical/serious.
**Acceptance:** Zero critical/serious.
**Verify:** axe report clean.

### 10.4 [deploy] Deploy + live verification
**Change:** Commit, push, auto-deploy to Vercel. Re-run Phase 9 matrix in production.
**Acceptance:** All Phase 9 checks pass in production.
**Verify:** Live URL at 360/768/1024/1440/1920.

---

# PART 3 — SUMMARY

## Defects → Phase mapping

| Phase | Defects fixed | Effort |
|---|---|---|
| **1. Design tokens** | A4, A5, B5, F1-F4, F7, C-d5, G4 | ~1.5h |
| **2. Architecture** | A1, A2, A3, B1, E1 | ~2h |
| **3. Desktop behavior** | A6, B2, B3, B4, F5, F6 | ~1.5h |
| **4. Mobile behavior** | C-d2, C-d3, D-d1, D-d2, D-d3, D-d4, D-d5, G2 | ~2h |
| **5. Responsive** | C-d1, C-d4, E2(audit) | ~1h |
| **6. Topbar controls** | C-d6, C-d7, C-d8, C-d9 | ~1h |
| **7. Navigation** | G1, G3 (+ active-state verify, unauthorized toast) | ~1h |
| **8. Consistency** | F8 (audit), page double-pad audit | ~0.5h |
| **9. Regression** | (verification — full matrix) | ~1.5h |
| **10. Production** | build + bundle + axe + deploy | ~1h |
| **Total** | **21 defects + verification** | **~13h** |

## Files to CREATE
- `apps/web/src/components/app-shell/nav-group.tsx` — NavGroup + NavItem (extracted).
- `apps/web/src/middleware.ts` — route-level capability guard.

## Files to MODIFY
- `apps/web/src/app/dashboard/layout.tsx` — nav groups, dedup, accents, logo, topbar logo, density dropdown, violet purge, mobile nav, hamburger fix, transition, toggle size.
- `apps/web/src/lib/ui-store.ts` — cycle order.
- `apps/web/src/app/globals.css` — `.thin-scrollbar` utility.
- `apps/web/src/app/dashboard/page.tsx` — `?error=unauthorized` toast (minor).

## Files to NOT TOUCH (preserve working logic)
- `ui-store.ts` (except cycle order) — persistence + sync works.
- `capabilities.ts` — query + cookie works.
- `breadcrumb.tsx` — works.
- `topbar-timer.tsx` — works.
- `command-palette.tsx` — works (DR-CMD1).
- `use-shortcuts.ts` — all 4 shortcuts wired.
- `auth-store.ts` — density store works.
- `providers.tsx` — DensityProvider + theme + query work.
- `button.tsx` — rainbow hover already implemented.
- All page files (org, attendance, leave, etc.) — out of scope.

## Result
A sidebar, topbar, mobile navigation, and base shell that precisely matches DESIGN-SYSTEM.md §9/§10/§11, COMPONENT-SYSTEM.md §4, REQUIREMENTS.md R3.1–R3.16 + R1.12, and DR-DS1/DR-DEN1/DR-CMD1. Desktop expanded (icon+text, grouped) and collapsed (icon-only, tooltiped) states; mobile hidden + hamburger drawer + per-accent bottom nav; responsive across all breakpoints; token-driven; accessible (focus rings, aria, keyboard); density-aware; with route guards. **No rework needed — every choice references the frozen spec. No scope expansion.**

