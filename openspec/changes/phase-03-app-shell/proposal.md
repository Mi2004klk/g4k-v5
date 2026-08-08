# Phase 3 — App Shell & Design System

## What
The application shell every signed-in screen lives inside, plus the shared design system and component library all later phases build on: code-defined design tokens, a light/dark theme engine with density control, a role-aware shell (top bar + sidebar + mobile bottom nav + breadcrumbs), a pinned-items engine, the `packages/ui` component library, a reusable form system (validation + autosave + Save-as-Draft), a shared filter/sort bar, confirmation dialogs/inline editing/tooltips, dnd-kit list reordering, status badges, pagination, keyboard shortcuts, toasts, empty states, skeleton loaders, and a PWA manifest + service worker. Implements R3.1–R3.16.

## Why
Phases 4–10 are all rendered inside this shell and reuse its components. Defining tokens, theming, forms, filters, and the component library once — before any feature screen — guarantees visual consistency, prevents each phase reinventing its own inputs/tables/dialogs, and locks the performance contract (skeletons over spinners, virtualized lists, instant navigation). It also fixes the navigation model (role-aware sidebar trees, pinned items, command palette) that the dashboard and every module hook into.

## Scope
- Design tokens in code: color (brand purple `#9d00ff` → magenta gradient, gold `#ffd700` accents), spacing, typography, elevation, motion durations (per project §10/§22).
- Theme engine: light + dark (both colorful), persisted per user, density control.
- App shell: top bar (search stub, bell, profile); role-aware sidebar trees (Admin/HR/Employee per spec §9); mobile bottom nav (≤5 icons) + hamburger full-screen menu; clickable breadcrumbs.
- Pinned items engine (star/pin on projects/tasks/profiles → Pinned section at sidebar bottom; removable).
- `packages/ui` component library: button, card, table (TanStack), badge, dialog, drawer, tooltip, toast, skeleton, empty-state, command-palette, shortcut-overlay.
- Form system: required markers, on-pause validation, inline errors, submit loading, success toast (bottom-right), sectioned long forms, Save-as-Draft + 30s autosave + restore banner.
- Reusable filter/sort bar (search, status, date range, dept/team, priority, sort+direction, clear-all, removable chips).
- Confirmation dialogs (destructive=red); icon-button hover states/tooltips; inline editing (pencil → Enter/Escape).
- dnd-kit list reordering; status badges (Gray/Blue/Amber/Green/Red); pagination (default 20, options 50/100).
- Keyboard shortcuts: Ctrl+K palette, Ctrl+N (context new), Ctrl+/ help overlay, Esc close, Enter submit/confirm.
- Toasts (top-right, auto-dismiss 4s, manual X; green/red/amber/blue); empty states (illustration + animated logo mp4 where relevant + optional action); skeleton loaders + button loading dot-state + progress bars animate 0→value.
- Responsive layouts + PWA manifest + service worker; offline banner; loading states prefer skeletons/partial/cached over spinners.

## Non-goals
- Dashboard widget engine and any dashboard content (Phase 4).
- Master-data CRUD screens and table backends (Phase 2 supplies the pattern; Phase 3 ships the shared table component only).
- Real command/search indexing (Ctrl+K surfaces a stub palette wired for later phases; full search is R11.2, deferred).
- Notification bell content and chat (Phase 8) — the bell is a shell slot.
- Full file upload (deferred per R11.3).

## Phase / capability
Phase 3 of 11 · capability `app-shell` · depends on Phase 0 (monorepo + `packages/ui` skeleton) and Phase 2 (capabilities + role → nav mapping). Implements R3.1–R3.16.

## ADRs
Depends on ADR-007 (dnd-kit = lists/kanban; React Grid Layout = dashboard only; never mixed — reused here for list/board reordering), ADR-008 (TanStack Query = server state; Zustand = UI state only — theme, sidebar, dialogs, filters, drafts live in Zustand). No new ADR.
