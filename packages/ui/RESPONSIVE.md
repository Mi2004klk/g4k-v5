# Games4Kings Responsive Layout Standards

This document establishes the canonical responsive patterns for the Games4Kings Design System.

## Breakpoints

We use standard Tailwind breakpoints:
- `sm` (**640px**): Shifts content density (e.g., table → cards, flex-row → flex-col).
- `md` (**768px**): Shifts layout structure (e.g., master-detail layouts, nav visibility).
- `lg` (**1024px**): Full desktop layout optimizations.

## Core Hooks

### 1. `useBreakpoint()`
Use this hook for generic viewport checks across the spectrum.
```ts
import { useBreakpoint } from "@g4k/ui/hooks";

const { isMobile, isTablet, isDesktop } = useBreakpoint(); 
// isMobile: < 640px
// isTablet: 640px - 1024px
// isDesktop: > 1024px
```

### 2. `useIsMobile()`
Use this hook specifically for `md:` level layout shifts (e.g., Sidebar toggling, Master-Detail views).
```ts
import { useIsMobile } from "@g4k/ui/hooks";

const isMobileLayout = useIsMobile(); // true if < 768px
```
*Note the difference: `useBreakpoint().isMobile` is for content density (640px), `useIsMobile()` is for structure (768px).*

## Canonical UI Patterns

### Master-Detail Layouts
On mobile, the list and detail views are separate pages/screens. On desktop, they sit side-by-side.
- **Implementation:** Use a CSS toggle `hidden md:flex` to swap between the list and the detail pane.
- **Reference:** `apps/web/src/app/dashboard/chat/chat-tab.tsx:510-650`

### Data Tables
Tables do not scroll horizontally on mobile. They transform into cards.
- **Implementation:** Use the `mobileCardRenderer` prop in `<ListScaffold>`.
- **Reference:** `apps/web/src/components/settings/audit-log-table.tsx`

### Filter Toolbars
Complex filter bars take up too much vertical space on mobile.
- **Implementation:** `<FilterBar>` automatically collapses into a bottom `<Sheet>` on mobile.
- **Reference:** `packages/ui/src/components/filter-bar.tsx:342-374`

### Dialogs vs Sheets
On desktop, modals appear as centered Dialogs. On mobile, they should slide up as Sheets for better thumb reach.
- **Implementation:** Use `isMobile ? <Sheet> : <Dialog>`. Do not over-abstract this into a custom hook until >3 occurrences exist.

### Mobile Bottom Navigation
The bottom navigation bar takes up space at the bottom of the screen.
- **Implementation:** Ensure scrollable content areas have safe bottom padding using the `pb-safe` utility class.
- **Example:** `className="pb-safe"`

## Grids
Use responsive grid column definitions:
- **Mobile:** 1 column (`grid-cols-1`)
- **Tablet:** 2 columns (`md:grid-cols-2`)
- **Desktop:** 3+ columns (`lg:grid-cols-3`, `xl:grid-cols-4`)
