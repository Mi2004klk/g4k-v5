# fix-12.md — Login, Sidebar, Widgets, Header, RBAC & Design System: Definitive Remediation

> End-to-end audit of the Login Page, Sidebar, Dashboard Widgets, Navbar/Header, Role-Based Sidebar
> Rules, and Design System. Every finding is verified against the actual codebase. Each task
> specifies exact files, exact class changes, and acceptance criteria — no vague recommendations.
>
> **Root cause of "AI slop UI":** The design tokens are fundamentally broken (`--color-muted` maps
> to a background color, `--color-ring` maps to border-strong), the sidebar lacks icon tiles, widgets
> have inconsistent borders/shadows, and the login page's gradient treatment is applied correctly per
> spec but the overall polish is below ClickUp-grade.

---

## PHASE 1 — Fix Broken Design Tokens (foundation for everything else)

### TASK-1.1: Fix `--color-muted` mapping (CRITICAL)

**Problem:** `globals.css:54` maps `--color-muted: var(--bg-surface-2)`. `--bg-surface-2` is
`#FCFCFE` (near-white) in light mode. Any Tailwind class `text-muted` or `bg-muted` resolves to this
near-white value. `text-muted` renders INVISIBLE text on white surfaces. `text-muted-foreground`
correctly maps to `--text-muted` (`#8A8A9A`), but the `muted` token itself is wrong.

**Current incorrect behaviour:** Elements using `text-muted` are invisible. Elements using
`bg-muted` get a near-white background that's indistinguishable from the surface.

**Expected behaviour:** `--color-muted` should map to `var(--text-muted)` (a muted gray TEXT color),
matching the standard shadcn/ui convention where `muted` = subtle background and `muted-foreground`
= subtle text. BUT the current mapping makes `bg-muted` correct (subtle background) and `text-muted`
wrong (should use `text-muted-foreground`). The issue is that components use `text-muted` when they
mean `text-muted-foreground`.

**Affected files:** Any file using `text-muted` class: `grep -rn 'text-muted' apps/web/src/ --include='*.tsx'`

**Root cause:** Token naming confusion — `muted` in shadcn is a BACKGROUND token, `muted-foreground`
is the TEXT token. Components incorrectly use `text-muted` instead of `text-muted-foreground`.

**Required changes:**
- [ ] Grep ALL `text-muted` usages across `apps/web/src/` and `packages/ui/src/`:
  ```bash
  grep -rn 'text-muted[^-]' apps/web/src/ packages/ui/src/ --include='*.tsx' --include='*.ts'
  ```
- [ ] Replace EVERY `text-muted` with `text-muted-foreground` (the correct token for muted text).
- [ ] Verify `bg-muted` is correct (it should be the subtle background `--bg-surface-2`).
- [ ] Verify `border-muted` — if any usage exists, replace with `border-border` or `border-border-strong`.

**UI/UX acceptance:** All muted text is visible (gray `#8A8A9A` in light mode). No invisible text.
**Verification:** Visual scan every page — all secondary/muted text is readable.

---

### TASK-1.2: Fix `--color-ring` mapping (HIGH)

**Problem:** `globals.css:62` maps `--color-ring: var(--border-strong)`. This makes focus rings use
`#D1D1DE` (light gray) — barely visible. The design system requires "2px brand-violet ring, 2px offset."

**Current incorrect behaviour:** Focus rings are light gray, not brand-violet. Violates WCAG AA
contrast for focus indicators.

**Expected behaviour:** Focus ring is `#8A2BE2` (brand violet) with 2px offset.

**Affected files:** `apps/web/src/app/globals.css:62`.

**Root cause:** Token incorrectly mapped to border color instead of brand accent.

**Required changes:**
- [ ] `globals.css:62`: change `--color-ring: var(--border-strong)` to `--color-ring: var(--accent-violet)`.
- [ ] Verify all `focus-visible:ring-*` classes now render violet. Note: many components hardcode
  `ring-violet-500` directly — these already work. The token fix covers components that use the
  generic `ring` utility.

**UI/UX acceptance:** Tab through the sidebar → every focused item shows a violet ring.
**Verification:** Tab through all interactive elements → visible violet focus ring on each.

---

### TASK-1.3: Verify all shadow tokens resolve correctly (MEDIUM)

**Problem:** `globals.css:65-68` maps `--shadow-e1: var(--shadow-e1)` etc. — self-referential! The
shadow values are defined in `:root` (line ~155+) but the `@theme` mapping references itself.

**Root cause:** The `@theme` block creates a token alias `--shadow-e1` that references
`--shadow-e1` from `:root`. In Tailwind v4, `@theme` tokens override `:root` tokens. If the `:root`
shadow values are defined AFTER the `@theme` block, the alias may not resolve.

**Required changes:**
- [ ] Verify shadows render correctly: add a test card with `shadow-e1` and visually inspect.
- [ ] If broken, move the shadow value definitions into the `@theme` block directly:
  ```css
  @theme {
    --shadow-e1: 0 1px 2px rgba(20,20,28,.06);
    --shadow-e2: 0 4px 12px rgba(132,44,226,.10);
    --shadow-e3: 0 8px 24px rgba(20,20,28,.12);
    --shadow-e4: 0 16px 48px rgba(20,20,28,.18);
  }
  ```
  And remove the self-referential mappings.

**Verification:** Cards with `shadow-e1` show a subtle shadow at rest, `shadow-e2` on hover.

---

## PHASE 2 — Login Page Polish

### TASK-2.1: Login page is mostly correct — refine spacing and hierarchy (MEDIUM)

**Current state (verified):**
- Background: `bg-white dark:bg-neutral-950` — correct (no full-screen gradient).
- Card: `max-w-md shadow-sm border rounded-xl` — correct.
- Header strip: `h-28 bg-gradient-brand` with landscape logo — CORRECT per design system (sign-in
  hero gets brand gradient).
- Title: `text-2xl font-bold font-display` — correct.
- Subtitle: `text-sm text-neutral-500` — correct.
- Form: identifier input + password input with show/hide — correct.
- Button: `bg-neutral-900` (charcoal) with rainbow hover border — CORRECT per design system.
- Loading: dot-bounce animation — correct.
- Lockout: countdown timer — correct.
- Error: red box with message — correct.
- Footer: copyright + system info tooltip — correct.

**Issues to fix:**
- [ ] **2.1a** Reduce header strip from `h-28` (112px) to `h-24` (96px) — more compact.
- [ ] **2.1b** Card radius: `rounded-xl` is 20px per the token — correct for a panel/dialog.
- [ ] **2.1c** Form field spacing: currently `space-y-5` between fields — reduce to `space-y-4`
  for tighter, more practical feel.
- [ ] **2.1d** Label: `text-xs font-semibold` is correct. Keep.
- [ ] **2.1e** Add `autocomplete="username"` on identifier (already present) — keep.
- [ ] **2.1f** Add `autocomplete="current-password"` on password (already present) — keep.
- [ ] **2.1g** Button: the rainbow hover uses `mask-border` CSS technique — verify it renders
  correctly in production (some browsers don't support `mask-composite`).
- [ ] **2.1h** Button: reduce height from `h-11` (44px) to `h-10` (40px) — more compact.
- [ ] **2.1i** Remove redundant `font-sans` classes (root already sets Inter).

**UI/UX acceptance:** Login page is compact, polished, fast-loading. No decorative excess.
**Responsive:** Card is `max-w-md` centered with `p-4` padding — works on mobile (360px).
**Accessibility:** Labels, focus rings, autocomplete attributes all present. Form errors announced.
**Definition of done:** Login page looks like a premium SaaS product (Linear/Vercel/ClickUp grade).

---

### TASK-2.2: Remove redundant `font-sans` classes from login (LOW)

**Problem:** `font-sans` is set on the root `<html>` via `next/font`. Adding `font-sans` to every
element is redundant.

**Fix:** Remove all `font-sans` classes from `login/page.tsx` (FormLabel, Input, FormMessage, Button,
footer span). The root Inter font applies automatically.

---

## PHASE 3 — Sidebar: ClickUp-Style Compact Navigation

### TASK-3.1: Add colored icon tiles to nav items (HIGH)

**Problem:** Nav item icons are bare (no background container). ClickUp and similar products use
small colored icon tiles (rounded squares with subtle background tint). This gives each module a
visual identity beyond just the icon color on active state.

**Current:** Icon is a bare `<item.icon className="w-4 h-4 ...">` — gray when inactive, accent-
colored when active.

**Expected:** Icon sits inside a `w-7 h-7 rounded-md` tile with a subtle accent background:
- Inactive: `bg-neutral-100 dark:bg-neutral-800` tile, `text-neutral-400` icon
- Active: accent-colored tile (e.g., `bg-blue-100 dark:bg-blue-950 text-blue-600`) 
- Hover: tile background intensifies slightly

**Affected files:** `apps/web/src/components/app-shell/nav-group.tsx:70-85`.

**Required changes:**
- [ ] Wrap the icon in a tile container:
  ```tsx
  <div className={cn(
    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
    isActive
      ? cn(accent.bg, accent.bgDark)
      : "bg-transparent group-hover/nav:bg-surface-2"
  )}>
    <item.icon className={cn(
      "w-4 h-4 transition-colors",
      isActive
        ? cn(accent.text, accent.textDark)
        : "text-neutral-400 group-hover/nav:text-neutral-600 dark:group-hover/nav:text-neutral-300"
    )} />
  </div>
  ```

**UI/UX acceptance:** Each nav item has a small colored icon tile. Active item's tile uses the
module accent color. Inactive items have transparent tiles that tint on hover.
**Definition of done:** Sidebar looks like ClickUp — colorful icon tiles, clear module identity.

---

### TASK-3.2: Tighten nav item spacing (MEDIUM)

**Problem:** Nav items use `gap-3 px-3 py-2.5` (12px gap, 12px padding, 10px vertical padding).
ClickUp uses tighter spacing for higher information density.

**Required changes:**
- [ ] Change `gap-3` to `gap-2.5` (10px — tighter icon-to-label spacing).
- [ ] Change `px-3` to `px-2.5` (10px — tighter horizontal padding).
- [ ] Keep `py-2.5` for comfortable density (10px) or `py-1.5` for compact (6px) — the density
  toggle already handles this.
- [ ] Ensure the total item height in comfortable mode is ~40px (compact: ~32px).

**UI/UX acceptance:** Sidebar items are compact, scannable, not cramped. 15+ items fit without
scrolling on a 900px viewport.

---

### TASK-3.3: Verify collapsed sidebar tooltip behavior (LOW)

**Current (verified):** Collapsed sidebar shows `Tooltip` with 150ms delay containing the item name.
Icons are centered with `justify-center px-0`.

**Expected:** Tooltip appears on hover after 150ms. Shows the item name + module accent color dot.

**Fix if needed:** Add a small colored dot before the tooltip text to reinforce module identity:
```tsx
<TooltipContent side="right" className="text-xs flex items-center gap-1.5">
  <div className={cn("w-1.5 h-1.5 rounded-full", accent.border)} />
  {item.name}
</TooltipContent>
```

---

## PHASE 4 — Header/Navbar Standardization

### TASK-4.1: Header background — solid instead of glassmorphism (MEDIUM)

**Problem:** Header uses `bg-surface/80 backdrop-blur-md` (80% opacity + blur). ClickUp uses a solid
surface. The blur adds GPU overhead and can look muddy on complex backgrounds.

**Expected:** Solid `bg-surface border-b border-border` — clean, crisp, no blur overhead.

**Affected files:** `apps/web/src/app/dashboard/layout.tsx:362`.

**Required changes:**
- [ ] Change `bg-surface/80 ... backdrop-blur-md` to `bg-surface border-b border-border`.

**UI/UX acceptance:** Header is solid, crisp, no translucency artifacts.

---

### TASK-4.2: Standardize header control sizes (MEDIUM)

**Problem:** Header controls have inconsistent sizes:
- Theme toggle: `h-9 w-9` (36px)
- Notification bell: `p-2 rounded-full` (~36px)
- Avatar: `size="md"` (~40px)
- Mobile menu: `size="icon"` (default `h-11 w-11` = 44px)

**Expected:** All header icon buttons are `h-9 w-9` (36px). Avatar is `size="sm"` (32px) or
`size="md"` (36px).

**Required changes:**
- [ ] Mobile menu button: change `size="icon"` to explicit `className="h-9 w-9 shrink-0"`.
- [ ] Theme toggle: already `h-9 w-9` — keep.
- [ ] Notification bell: already `p-2 rounded-full` (~36px) — keep.
- [ ] Avatar: keep `size="md"`.
- [ ] All icon buttons in the header: verify consistent `h-9 w-9` + `rounded-lg` (not `rounded-full`
  — match the rounded-rectangle language). Change `rounded-full` to `rounded-lg` on the bell and
  theme toggle buttons for consistency with the design system's radius rules.

**UI/UX acceptance:** All header controls are the same size and shape. Clean, aligned row.

---

### TASK-4.3: Header control grouping and spacing (LOW)

**Current:** Controls are `gap-2 md:gap-3` — reasonable.

**Fix:** Keep as-is. Verify the visual grouping is clear: Left = mobile menu (mobile only). Right =
timer + theme + notifications + avatar. No search bar (removed per spec).

---

## PHASE 5 — Dashboard Widget Standardization

### TASK-5.1: All widgets use consistent card styling (HIGH)

**Problem:** Widgets use inconsistent card treatments:
- MetricWidget: `border-none shadow-sm hover:shadow-md`
- TimeClockWidget: `border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm`
- AnnouncementBoard: varies
- QuickNotes: varies

**Expected:** ALL widgets use the SAME card base:
```
border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 rounded-xl transition-shadow
```
No `border-none`. No `rounded-2xl` on cards (that's for panels/dialogs). Consistent shadow system.

**Affected files:** Every widget component file in `apps/web/src/components/widgets/` and
`apps/web/src/components/dashboard/`.

**Required changes:**
- [ ] Create a shared `WidgetCard` wrapper or standardize the className on every widget's root `<Card>`:
  ```tsx
  <Card className="border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2
    transition-shadow duration-150 rounded-xl overflow-hidden h-full">
  ```
- [ ] Apply to: MetricWidget, TimeClockWidget, AnnouncementBoard, QuickNotes, PendingApprovalsWidget,
  RecentActivityWidget, AdminTodayAttendanceWidget, HrTeamAttendanceWidget,
  EmployeeTaskProgressWidget, EmployeeApprovalStatusWidget, HrActivityFeedWidget, QuickTaskWidget.

**UI/UX acceptance:** All widgets look like they belong to the same system — same border, shadow,
radius. Hover lifts to shadow-e2.
**Definition of done:** Zero `border-none` on any widget card.

---

### TASK-5.2: Widget internal padding standardization (MEDIUM)

**Problem:** Widgets use inconsistent internal padding: `p-4`, `p-5`, `p-6`.

**Expected:** ALL widget content uses `p-5` (20px) per the design system's card padding standard.

**Required changes:**
- [ ] Audit every widget's `<CardContent>` or equivalent padding. Change all to `p-5`.
- [ ] Header sections (title + icon row): `pb-3` between header and body content.

---

### TASK-5.3: Widget header pattern — title, icon, fetching indicator (MEDIUM)

**Problem:** Widget headers are inconsistent. Some show the title as `text-xs uppercase`, others
as `text-sm font-bold`. Icon containers vary.

**Expected standard widget header:**
```tsx
<div className="flex items-center justify-between pb-3">
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-md bg-{accent}-100 dark:bg-{accent}-950 flex items-center justify-center">
      <Icon className="w-4 h-4 text-{accent}-600 dark:text-{accent}-400" />
    </div>
    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
      {title}
    </span>
    {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
  </div>
  {/* Optional action buttons on the right */}
</div>
```

**Required changes:**
- [ ] Standardize EVERY widget header to this pattern. Pass the accent color and icon as props.

**UI/UX acceptance:** All widget headers look identical in structure — icon tile + uppercase title +
fetching indicator.

---

### TASK-5.4: Widget loading skeleton — content-shaped (MEDIUM)

**Current (verified for TimeClockWidget):** Full-card skeleton overlay with `isPending`. This is
CORRECT — shapes match content. Other widgets need the same treatment.

**Required changes:**
- [ ] Verify EVERY widget has a content-shaped skeleton on `isPending` (cold load only).
- [ ] No generic spinner overlays. No text "Loading..." — use skeleton shapes.
- [ ] Background refresh: keep content visible + small `isFetching` spinner in header.

---

### TASK-5.5: Widget empty states — illustrated + actionable (MEDIUM)

**Problem:** Empty states are text-only or use the generic `EmptyState` component with no icon.

**Expected:** Every widget empty state:
- Large muted icon (32px) centered
- Clear title (`text-sm font-semibold`)
- Helpful description (`text-xs text-neutral-400`)
- Optional action button

**Required changes:**
- [ ] Audit every widget's empty state branch. Ensure it matches the pattern above.
- [ ] Remove any `animated-logo.mp4` autoplay in empty states (too heavy).

---

## PHASE 6 — Role-Based Sidebar Rules

### TASK-6.1: Verify capabilities load optimistically (HIGH)

**Current state (verified):** `useCapabilities()` returns `[]` initially, then resolves. NavGroup
filters items by capability. Items with capabilities are HIDDEN until the query resolves, then
suddenly APPEAR.

**Expected:** Items should appear immediately (optimistic) and be removed if unauthorized. OR show
a nav skeleton until capabilities resolve.

**Required changes (recommended approach — optimistic):**
- [ ] `apps/web/src/lib/capabilities.ts`: add `placeholderData: ["*"]` to the useQuery options.
  This shows ALL nav items immediately. When real capabilities resolve, unauthorized items are
  removed (items disappear, which is less jarring than items appearing).
- [ ] Alternatively: add `initialData: ["*"]` — same effect but persisted in the cache.

**UI/UX acceptance:** Login → sidebar shows all relevant items immediately. No items appearing
after a delay. Unauthorized items are smoothly removed when capabilities resolve.
**Functional acceptance:** API still enforces real capabilities (403 on unauthorized requests).
**Definition of done:** Zero nav item "flash-in" on any page load or refresh.

---

### TASK-6.2: Verify API authorization is consistent with sidebar visibility (HIGH)

**Expected:** If a sidebar item is hidden (capability not granted), the corresponding API endpoint
returns 403.

**Required changes:**
- [ ] Audit EVERY nav item's `capability` field against the API route's `capability:` middleware.
  Verify they match exactly.
- [ ] Specifically verify:
  - Projects: sidebar requires `projects.manage` but route allows `projects.view|projects.manage`
    for GET. An employee without `projects.manage` can still VIEW projects via API even though the
    sidebar item is hidden. **This is correct** — employees can access projects if permitted, just
    not from the sidebar. But verify the employee can reach `/dashboard/projects` via direct URL.
  - Tasks: sidebar requires `tasks.submit` — verify the API route accepts this capability.
  - Chat: sidebar requires `directory.send-message` — verify `chat.access` capability is also
    granted to the same roles.

**Functional acceptance:** Direct URL access to an unauthorized page → API returns 403 → page shows
error state (not real data).

---

### TASK-6.3: Stable navigation during loading (MEDIUM)

**Problem:** During the AuthGuard initialization (first load, no persisted session), the sidebar
is not rendered (full-screen skeleton). Once auth resolves, the sidebar renders. If capabilities
take additional time to load, items appear/disappear.

**Required changes:**
- [ ] AuthGuard already shows a full-screen skeleton during `isInitializing` — this is correct.
- [ ] After AuthGuard resolves, the layout renders. Capabilities load via `useCapabilities()`.
  With TASK-6.1's `placeholderData: ["*"]`, all items show immediately.
- [ ] Verify no "flash of incorrect permissions" — the optimistic approach prevents this.

**UI/UX acceptance:** No page or permission flash during loading. Sidebar is stable from the moment
it renders.

---

## PHASE 7 — Design System Cross-Cutting Standardization

### TASK-7.1: Radius standardization audit (MEDIUM)

**System (from design system spec):**
| Component | Radius | Class |
|---|---|---|
| Inputs | 6px | `rounded-md` |
| Buttons | 10px | `rounded-lg` |
| Nav items | 10px | `rounded-lg` |
| Badges/pills | full | `rounded-full` |
| Cards/widgets | 14px | `rounded-xl` |
| Dialogs/modals/panels | 20px | `rounded-2xl` |

**Required changes:**
- [ ] Grep ALL `rounded-*` classes in dashboard/widget/nav components.
- [ ] Verify each matches the system above.
- [ ] Common violations to fix:
  - Cards using `rounded-2xl` → change to `rounded-xl`.
  - Buttons using `rounded-md` → keep (correct).
  - Nav items using `rounded-lg` → keep (correct).

---

### TASK-7.2: Shadow standardization audit (MEDIUM)

**System:**
| Level | Use | Class |
|---|---|---|
| e1 | Rest cards/widgets | `shadow-e1` or `shadow-sm` |
| e2 | Hover lift | `shadow-e2` or `shadow-md` |
| e3 | Dropdowns/popovers | `shadow-e3` or `shadow-lg` |
| e4 | Dialogs/drawers | `shadow-e4` or `shadow-2xl` |

**Required changes:**
- [ ] Verify TASK-1.3 (shadow tokens resolve correctly).
- [ ] Audit all `shadow-*` classes. Replace inconsistent values with the system above.

---

### TASK-7.3: Remove all unauthorized gradients (MEDIUM)

**Allowed gradients (per design system):**
1. Sign-in hero: `bg-gradient-brand` — login page header strip ONLY.
2. Primary button hover: conic-gradient rainbow border — login button ONLY (or shared Button if
   added later).
3. Logo lockups: brand gradient behind logo — NOT on cards, nav, or content.

**Forbidden gradients:**
- Any `from-* to-*` or `bg-gradient-*` on cards, nav items, headers, banners, buttons (except the
  primary button hover), modals, or content areas.

**Required changes:**
- [ ] Grep: `grep -rn 'gradient\|from-.*to-' apps/web/src/ --include='*.tsx' | grep -v 'globals.css'`
- [ ] For EACH result, verify it's one of the 3 allowed usages. If not, replace with solid colors.
- [ ] Specifically check:
  - Dashboard welcome banner (`bg-primary` — solid, correct).
  - Mobile bottom-nav FAB (`bg-emerald-600` — solid, correct after previous fix).
  - Notification modal filter tabs (should use solid accent, not gradient).
  - Nav active left bar (should use solid `accent.border`, not gradient).

**Definition of done:** Zero gradient classes in component code except the 3 allowed locations.

---

### TASK-7.4: Typography hierarchy audit (LOW)

**System:**
| Element | Size | Weight | Font |
|---|---|---|---|
| Page title | `text-xl` | 700 | Sora (display) |
| Section header | `text-[10px]` | 700 | Inter |
| Widget title | `text-xs` | 700 | Inter |
| Body text | `text-sm` | 400 | Inter |
| Metric value | `text-3xl` | 700 | mono |
| Caption/muted | `text-[11px]` | 400 | Inter |

**Required changes:**
- [ ] Audit all text sizes across components. Align to the system above.
- [ ] Verify Sora is used ONLY for page titles and brand headings (`font-display` class).
- [ ] Verify Inter is used everywhere else (default, no explicit class needed).

---

### TASK-7.5: Icon stroke weight consistency (LOW)

**System:** All Lucide icons use `strokeWidth={1.75}`. Default is 2.

**Required changes:**
- [ ] Verify the root or component-level icon default is 1.75. If not, add a global override:
  ```css
  /* globals.css */
  .lucide { stroke-width: 1.75; }
  ```
- [ ] Alternatively, pass `strokeWidth={1.75}` to each icon — but that's verbose. The CSS approach
  is better.

---

## PHASE 8 — Responsive Audit

### TASK-8.1: Verify all breakpoints work (LOW)

**Verify at 360/768/1024/1440px:**
- [ ] **360px (mobile):** Sidebar hidden, bottom nav visible, widgets stack, tables → cards.
- [ ] **768px (tablet):** Sidebar collapsed (72px), widgets 2-column.
- [ ] **1024px (desktop):** Sidebar expanded (264px), widgets multi-column.
- [ ] **1440px (wide):** Full layout, max-width 1440px content area.

**Fix if broken:** Adjust grid breakpoints in WidgetEngine or layout grid classes.

---

## IMPLEMENTATION ORDER

### Step 1 — Fix foundation (do FIRST — everything depends on correct tokens)
1. **TASK-1.1** — Fix `text-muted` → `text-muted-foreground` everywhere
2. **TASK-1.2** — Fix `--color-ring` → brand-violet
3. **TASK-1.3** — Verify shadow tokens resolve

### Step 2 — Sidebar (the most visible component)
4. **TASK-3.1** — Add colored icon tiles to nav items
5. **TASK-3.2** — Tighten spacing (gap-2.5 px-2.5)
6. **TASK-3.3** — Collapsed tooltip with accent dot

### Step 3 — Header
7. **TASK-4.1** — Solid header background (no glassmorphism)
8. **TASK-4.2** — Standardize control sizes (h-9 w-9 rounded-lg)
9. **TASK-4.3** — Verify grouping

### Step 4 — Widgets
10. **TASK-5.1** — Consistent card styling (border + shadow-e1/e2 + rounded-xl)
11. **TASK-5.2** — Internal padding p-5
12. **TASK-5.3** — Standard widget header pattern (icon tile + title + fetching)
13. **TASK-5.4** — Content-shaped loading skeletons
14. **TASK-5.5** — Illustrated empty states

### Step 5 — Login
15. **TASK-2.1** — Refine spacing/hierarchy
16. **TASK-2.2** — Remove redundant font-sans

### Step 6 — RBAC
17. **TASK-6.1** — Optimistic capabilities (placeholderData: ["*"])
18. **TASK-6.2** — Verify API authz consistency
19. **TASK-6.3** — Stable navigation during loading

### Step 7 — Design system
20. **TASK-7.1** — Radius standardization audit
21. **TASK-7.2** — Shadow standardization audit
22. **TASK-7.3** — Remove unauthorized gradients
23. **TASK-7.4** — Typography hierarchy audit
24. **TASK-7.5** — Icon stroke weight

### Step 8 — Responsive
25. **TASK-8.1** — Verify all breakpoints

---

## ACCEPTANCE — Definition of done for the entire phase

### Login Page
1. Compact, polished, premium SaaS feel.
2. Brand gradient ONLY on the header strip (per spec).
3. Rainbow hover ONLY on the sign-in button (per spec).
4. All inputs have correct autocomplete attributes.
5. Loading dots, lockout countdown, error messages all work.
6. No redundant `font-sans` classes.

### Sidebar
7. Every nav item has a colored icon tile (w-7 h-7 rounded-md).
8. Active item uses the module's accent color (blue/green/amber/pink/indigo/etc.).
9. No violet gradient on the active left bar — solid accent color.
10. Compact spacing: gap-2.5, px-2.5, py-2.5 (comfortable) / py-1.5 (compact).
11. Collapsed sidebar: icon tiles centered, tooltip on hover with accent dot.
12. Section headers: uppercase, 10px, bold, neutral-400.
13. All items appear immediately on login (optimistic capabilities).

### Dashboard Widgets
14. ALL widgets use the same card base: border + shadow-e1 + rounded-xl.
15. ALL widget headers have: icon tile + uppercase title + fetching spinner.
16. ALL widgets have content-shaped loading skeletons.
17. ALL widgets have illustrated empty states.
18. Internal padding is p-5 everywhere.
19. Background refresh keeps content visible + subtle spinner in header.

### Header/Navbar
20. Solid background (no glassmorphism/blur).
21. All icon buttons are h-9 w-9 rounded-lg.
22. Controls: mobile menu (left) + timer + theme + notifications + avatar (right).
23. No search bar (removed per spec).
24. All controls have consistent hover/focus states.

### Design System
25. `text-muted` → `text-muted-foreground` everywhere (no invisible text).
26. Focus rings are brand-violet (`#8A2BE2`).
27. Shadow tokens resolve correctly (e1-e4).
28. Radius: inputs=6px, buttons/nav=10px, cards=14px, dialogs=20px, pills=full.
29. Zero unauthorized gradients (only sign-in hero + primary button hover).
30. Typography: Sora for titles, Inter for body. Consistent hierarchy.
31. Icons: Lucide, strokeWidth 1.75, consistent sizes (w-4 h-4 for UI, w-5 h-5 for nav).

### RBAC
32. Sidebar items appear immediately (no flash-in).
33. API enforces real capabilities (403 on unauthorized).
34. No page/permission flash during loading.

### Responsive
35. Works at 360/768/1024/1440px.
36. Tables → cards on mobile. Bottom nav on mobile. Full-screen dialogs on mobile.
