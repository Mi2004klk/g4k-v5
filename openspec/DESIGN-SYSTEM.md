# Design System — Games4King Workplace OS (FROZEN)

> **Frozen spec.** Implementation must match these exact tokens. Changes require a recorded
> decision. This is the visual source of truth consumed by `packages/ui` and every screen.
> Tone (per ADR/user decision): **vibrant but professional** — brand colors as accents, disciplined
> semantic colors for data. Both light and dark modes are colorful.

## 1. Brand & Accent Palette
| Token | Hex | Use |
|---|---|---|
| `primary` | `#1A1A2E` | Charcoal primary (main UI anchor) |
| `accent-violet` | `#8A2BE2` | Original brand violet / robe |
| `accent-violet-deep` | `#9400D3` | Deep violet |
| `accent-gold` | `#FFD700` | Original brand gold / premium accent |
| `accent-pink` | `#FF1493` | Original brand pink ("GAMES") |
| `accent-orange` | `#F97316` | Accent rotation |
| `accent-coral` | `#FF7F50` | Accent rotation |
| `accent-red` | `#EF4444` | Accent rotation |
| `accent-magenta` | `#D946EF` | Accent rotation |
| `accent-blue` | `#3B82F6` | Accent rotation |
| `accent-indigo` | `#6366F1` | Accent rotation |
| `accent-cyan` | `#06B6D4` | Accent rotation |
| `accent-teal` | `#14B8A6` | Accent rotation |
| `accent-green` | `#22C55E` | Accent rotation |
| `accent-lime` | `#84CC16` | Accent rotation |
| `accent-gray` | `#6B7280` | Accent rotation |

**Primary gradient (brand):** `linear-gradient(135deg, #9400D3 0%, #8A2BE2 50%, #FF1493 100%)`
— used ONLY on: sign-in hero, dashboard headers, primary logo lockups, focus-ring brand moments.
**Gold gradient:** `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)` — used for premium badges,
crown motif, "king" moments. Never on body text or every control.

### 1.2 Accent Mapping & Palettes

To create distinct wayfinding without visual fatigue, modules use specific accent colors from the rotation:
- **Dashboard:** Blue
- **Attendance:** Green
- **Leave:** Amber
- **Directory:** Pink
- **Org:** Indigo
- **Settings:** Teal
- **Audit:** Rose
- **Profile:** Cyan
- **Notifications:** Orange

**Chart Palette (12-color):** Violet, Blue, Cyan, Teal, Green, Lime, Yellow, Amber, Orange, Red, Pink, Magenta.
**Category-tag Palette:** Utilizes the full accent rotation with light-mode background opacities (e.g. 10%) and dark-mode border hints.

## 2. Semantic colors (data + states) — disciplined, consistent
| Token | Light | Dark | Meaning |
|---|---|---|---|
| `success` | `#16A34A` | `#22C55E` | Approved / Completed / present |
| `info` | `#2563EB` | `#3B82F6` | In Progress / informational |
| `warning` | `#D97706` | `#F59E0B` | Pending Review/Approval / overtime timer / late |
| `danger` | `#DC2626` | `#EF4444` | Redo/Rejected/Overdue / destructive |
| `neutral-status` | `#6B7280` | `#9CA3AF` | Not Started |
| `overtime` | `#D97706` | `#F59E0B` | overtime heatmap + timer amber |

**Status pill map (R11.4):** Gray=Not Started · Blue(info)=In Progress · Amber(warning)=Pending ·
Green(success)=Approved/Completed · Red(danger)=Redo/Rejected/Overdue.

## 3. Surface & neutral scale
| Token | Light | Dark |
|---|---|---|
| `bg-app` | `#F7F7FB` | `#0F0F14` |
| `bg-surface` | `#FFFFFF` | `#17171F` |
| `bg-surface-2` | `#FCFCFE` | `#1E1E28` |
| `bg-elevated` | `#FFFFFF` | `#20202C` |
| `border` | `#E6E6EF` | `#2A2A38` |
| `border-strong` | `#D1D1DE` | `#3A3A4A` |
| `text-primary` | `#14141C` | `#F4F4F8` |
| `text-secondary` | `#4B4B5C` | `#A8A8B8` |
| `text-muted` | `#8A8A9A` | `#6E6E80` |

Dark mode reference: Adobe-product clean, consistent. Light mode: ClickUp-vibrant but with white
surfaces (gradients reserved for headers/dashboards only).

## 4. Typography
- **Family:** Inter (UI) + Sora (display/brand headings). Both self-hosted, subset, font-display
  swap. No system-font fallbacks for brand headings.
- **Scale (rem, 1rem=16px):**
  - `text-xs` 0.75 / `text-sm` 0.875 / `text-base` 1 / `text-lg` 1.125 / `text-xl` 1.25 /
    `text-2xl` 1.5 / `text-3xl` 1.875 / `text-4xl` 2.25 / `text-5xl` 3 (display only).
- **Weights:** 400 body, 500 emphasis, 600 section headers, 700 page titles, 800 brand display.
- **Line-height:** 1.5 body, 1.2 headings, 1.15 display.
- **Letter-spacing:** -0.01em on ≥2xl headings; 0 on body; +0.04em on uppercase labels/overlines.

## 5. Spacing scale (4px base)
`0, 1(4px), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64), 24(96)`.
Card padding: 5 (20px). Section gap: 8 (32px). Page gutter: 6 (24px).

## 6. Radius
`sm` 6px (inputs) · `md` 10px (buttons) · `lg` 14px (cards) · `xl` 20px (panels/drawers) · `full`
(pills/avatars). Brand cards may use `lg`+ subtle gradient border.

## 7. Elevation (box-shadow, both modes tuned)
| Level | Light | Dark |
|---|---|---|
| `e1` rest card | `0 1px 2px rgba(20,20,28,.06)` | `0 1px 2px rgba(0,0,0,.4)` |
| `e2` hover lift | `0 4px 12px rgba(132,44,226,.10)` | `0 4px 12px rgba(0,0,0,.5)` |
| `e3` dropdown/popover | `0 8px 24px rgba(20,20,28,.12)` | `0 8px 24px rgba(0,0,0,.6)` |
| `e4` dialog/drawer | `0 16px 48px rgba(20,20,28,.18)` | `0 16px 48px rgba(0,0,0,.7)` |

Cards lift to `e2` on hover (100ms). Dropdowns use `e3`. Dialogs/drawers use `e4` + backdrop blur.

## 8. Motion (durations + easings — defined once, reused everywhere)
| Context | Duration | Easing |
|---|---|---|
| Taps / button press | 120ms | `ease-out` (compress 0.96 scale) |
| Hover lift | 100ms | `ease-out` |
| Tooltip / popover | 150ms | `ease-out` |
| Sidebar glide | 220ms | `cubic-bezier(.4,0,.2,1)` |
| Drawer / panel | 200ms | `ease-in-out` |
| Dialog | `ease-modal` | `cubic-bezier(0.16, 1, 0.3, 1)` | popovers, dialogs (snap open) |
| `ease-spring` | `spring(1, 100, 10, 0)` | Framer Motion defaults for scale |

### 8.2 Primary Button Interaction

The primary button must feel premium and interactive while remaining grounded.

- **Default:** Solid charcoal (`#1A1A2E` or context-aware dark text color).
- **Hover:** Animated conic-gradient border rotating through the accent palette (3s linear infinite) with a subtle box-shadow glow matching the brand colors.
- **Active:** 0.96 scale compression (120ms duration).
- **Loading:** Text is replaced or appended with a dot-loader; button retains hover visual state if hovered.
- **Disabled:** 40% opacity, no hover border animation, no scale compression, pointer-events-none.
- **Reduced-motion Fallback:** If `prefers-reduced-motion` is detected, the gradient border becomes a static subtle border (no conic-rotation animation).auto-dismiss 4s) |
| Progress bar fill | 600ms | `cubic-bezier(.4,0,.2,1)` (animate 0→value) |
| List reorder | 180ms | `ease-out` |
| Page transition | 180ms | `ease-in-out` |
| Badge state change | 150ms | `ease-out` (color transition) |

Reduced-motion: all durations → 0/1ms, no scale transforms (prefers-reduced-motion respected).

## 9. Sidebar — collapse/expand behavior (FINAL)
- **Expanded width:** 264px. **Collapsed width:** 72px (icons only + tooltip on hover).
- **Collapse toggle:** chevron button at sidebar footer + keyboard shortcut (Ctrl+B). State
  persists per user (Zustand + API).
- **Animation:** width + content cross-fade glide, 220ms `cubic-bezier(.4,0,.2,1)`. Labels fade
  out (opacity 120ms) before width transitions; collapsed icons fade in.
- **Collapsed affordances:** icon-only buttons with tooltip (label) on hover (150ms); active item
  keeps a 3px brand-gradient left bar + subtle violet-tinted bg.
- **Expanded affordances:** icon + label; active = violet-tinted bg + brand-gradient left bar +
  `text-primary` weight 600; hover = `bg-surface-2`.
- **Section headers** (e.g. "Attendance" parent) shown in expanded; in collapsed, show as a thin
  divider with the first child icon. Parent expands/collapses child group with 180ms height glide.
- **Pinned items section** appears at the BOTTOM (after primary nav), separated by a divider; in
  collapsed mode shows icons with tooltips.
- **Mobile:** sidebar hidden; hamburger opens a FULL-SCREEN menu (280ms slide). Bottom nav (≤5
  icons) is the primary mobile nav per R3.3/Mobile Behavior.
- **Scrollbar:** thin, themed (`border` color), 8px; auto-hide when idle.

## 10. Logo placement rules (FINAL)
- **Logo assets** live in `Images, SVG, PDF/`: `1.1 Logo.png` (square/primary), `Landscape-Logo.png`
  (wide), `Favicon.png`, `monochrome-logo-1.1.png`, `animated-logo.mp4`.
- **Sign-in (R1.1):** `Landscape-Logo.png` centered/top, max-height 96px, on a brand-gradient hero.
- **App shell top bar:** square `1.1 Logo.png` at 28×28px next to the product wordmark
  "Workplace OS" (Sora, weight 700, `text-primary`). On collapse of sidebar, the logo+wordmark
  remain in the top bar left.
- **Sidebar header (expanded):** square logo 32×32 + wordmark. **Collapsed:** logo only (28×28).
- **Favicon:** `Favicon.png` via Next.js metadata. **Loading/empty states:** `animated-logo.mp4`
  cached and used as the empty-state illustration where relevant (R3.13).
- **Monochrome logo** `monochrome-logo-1.1.png` used on dense/dark surfaces where the color logo
  would clash (e.g. footers, PDF letterheads, report headers).
- **Never** stretch, recolor, or add shadows to the logo. Maintain clear space = 1× logo height.

## 11. Density & layout
- **Density modes:** comfortable (default), compact (16→12px row height, denser tables). Persisted
  per user.
- **Content max-width:** 1440px for list/table pages; fluid for dashboards.
- **Grid:** 12-col, 24px gutter. Dashboard widget grid via React Grid Layout (ADR-007).
- **Split panes / drawers / tabs:** provided by Layout Engine. Drawer width 420px (right).

## 12. Component states (every interactive component)
Define: rest, hover, focus-visible (2px brand-violet ring, 2px offset), active/pressed, disabled
(40% opacity, no-pointer), loading (dot-loader for buttons; skeleton for content), error (danger
border + message). All transitions per §8.

## 13. Dashboard widgets — per-role composition (FINAL)
**Widget engine** (R4.1–R4.5): each widget = manifest `{id,title,size,permissions,dataProvider,
refresh,lazy,realtime,offline,settings}`. Sizes: Small (metric), Medium (metric+stats), Large
(chart+stats+trend+actions). Per-user rearrange via React Grid Layout, layout persisted.

### Super Admin dashboard
| Widget | Size | Data |
|---|---|---|
| Total employees (active/inactive) | Small | org stats; hover=summary |
| Active projects (all teams) | Small | project stats; hover=summary |
| Today attendance (present/absent/late) | Small→Medium | attendance; hover=summary |
| Pending approvals (tasks/projects/leave) | Large | quick-access list |
| Recent activity feed | Large | dense audit; no noise |
| Quick Task Assignment | Medium | form→assign→appears in employee list |

### HR dashboard
| Widget | Size | Data |
|---|---|---|
| Today team attendance (present/absent/late) | Small→Medium | team attendance |
| Active projects | Small | own-team projects |
| Pending leave requests | Medium | approve/reject quick |
| Pending task/project submissions | Medium | review queue |
| Quick Task Assignment | Medium | → Global Chat notify on completion |

### Employee dashboard
| Widget | Size | Data |
|---|---|---|
| Active projects (mine) | Small | count |
| Pending tasks (mine) | Small | count |
| Attendance (Start/Pause/End + live timer) | Medium | live HH:MM:SS, amber overtime |
| Recent task progress bar | Medium | last-worked task, animated 0→% |
| Task approval status panel | Medium | Pending/Approved/Redo |

> Module-specific widgets render real data once that module ships; until then the widget renders
> its **true empty state** (R3.13) — never mock/placeholder numbers.

## 14. Empty / loading / error states (FINAL — no mock data, ever)
- **Skeletons** shaped exactly like the real content (R3.14, R3.16). Never a global spinner when a
  skeleton is possible.
- **Empty states** (R3.13): specific copy + the `animated-logo.mp4` (or relevant icon) + an
  optional action button. Examples verbatim from spec: "No projects assigned yet. Check back soon
  or ask your HR." / "All clear! No tasks pending right now." / "You're all caught up." / "No
  messages yet. Start the conversation."
- **Error states:** inline under the field for forms; a friendly error card with retry for views;
  toast (danger) for action failures. **Per-widget error boundaries** — a failed widget never
  blocks the dashboard (R13.21).
- **HARD RULE:** No hardcoded sample/mock data anywhere. A screen that has no data shows its real
  empty state — fully functional, just empty. (See config.yaml `data-realism` rule.)

## 14.5 Interaction performance (FINAL — see PERFORMANCE-STANDARDS.md)
- **Instant feedback**: every tap/press gives immediate visual response (compress 0.96, 120ms).
  Optimistic UI for safe mutations (pin, reorder, read-mark, toggle, clock-in) — apply instantly,
  roll back with a danger toast on error (R13.19). Destructive/non-idempotent actions wait for
  server confirmation.
- **No full-page reloads**: all interactions use client-side routing + mutation; lists update in
  place after mutation (cache-key invalidation), never reload the route.
- **Cached navigation**: revisit of a route shows cached data instantly, then refreshes in the
  background (stale-while-revalidate) — no spinner for cached data (R13.3).
- **Input responsiveness**: inputs respond ≤16ms; validation runs on a 400ms typing pause, not per
  keystroke; submit buttons disable + show dot-loader to prevent double-submit (R13.16).

## 14.6 Large-data rendering (FINAL)
- **Virtualize** every list/table/board over 100 rows (`@tanstack/react-virtual`): employees,
  attendance logs, tasks, notifications, audit log, reports, chat message history (R13.14).
- **Stable keys + memoized rows**: `React.memo` row components, stable keys, no inline object/function
  props on hot lists (R13.12). Derived data via TanStack Query `select`.
- **Reserved dimensions**: aspect-ratio boxes for avatars/images, fixed-height rows/skeletons, and
  reserved sidebar width to keep CLS ≤ 0.1 (R13.2).

## 14.7 Background work & transitions (FINAL)
- **Heavy client work** (xlsx parse, Gantt layout, search indexing, report aggregation) runs in web
  workers or is chunked so no task blocks the main thread >50ms (R13.17).
- **Transitions** use React 18 `useTransition`/`startTransition` for non-urgent state so input
  stays responsive during list/filter recomputation.
- **Cleanup**: web workers, Reverb subscriptions, IntersectionObservers, and object URLs are
  revoked/removed on unmount to prevent memory leaks (R13.26).

## 15. Accessibility
- WCAG AA contrast (4.5:1 text, 3:1 UI). Brand gradients used only on large text/non-text.
- Focus-visible ring on all interactive elements; keyboard nav for menus/dialogs/widgets (Radix).
- `prefers-reduced-motion` respected (§8). `aria-*` on icon-only buttons (tooltips double as labels).
- Min touch target 44×44 (48×48 on mobile attendance buttons per Mobile Behavior).

## 16. Tokens implementation
All tokens live as CSS custom properties + Tailwind v4 theme config in `packages/ui`, exported to
both apps. Single source — no magic numbers in components.
