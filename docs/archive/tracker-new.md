> **ARCHIVED:** This file is stale and superseded by context.md and ix-3.md.

# Tracker — Missed Implementation Checklist

> **Purpose:** Precise, actionable checklist of everything that was planned (in `openspec/REQUIREMENTS.md`, `TRACKER.md`, and `fix-2.md`) but is NOT yet correctly implemented in the codebase. Each item is verified against current source code.
>
> Legend: `[ ]` = not done · `[~]` = partially done · `[x]` = done (for reference only)

---

## 🔴 CRITICAL — App Shell & Sidebar (Broken UI — visible in screenshot)

> **CAUTION:** The sidebar is fundamentally broken in production. Most nav item labels and ALL group labels are invisible on both desktop and mobile.

- [ ] **SHELL-1 — Group labels invisible.** `nav-group.tsx:114` uses `text-muted` class. In Tailwind v4, `text-muted` maps to `--color-muted` = `var(--bg-surface-2)` = `#FCFCFE` (near-white). This is a **background color token applied as text**, making group headers ("My Work", "People", "Administration", "Account") invisible on the white sidebar. **Fix:** Change to `text-neutral-400 dark:text-neutral-500`.
- [ ] **SHELL-2 — Nav item text still invisible on deployed site.** Although `text-neutral-500` was committed for inactive items, the Vercel build may be stale or the fix only applied to non-Sheet items. Verify the deployed preview shows all sidebar labels. If not, check that the Sheet (mobile sidebar) also receives the fixed color classes.
- [ ] **SHELL-3 — Sidebar collapse/expand chevron button is positioned at `absolute -right-[18px] top-20`** which places it OUTSIDE the `aside` container (which has `overflow-hidden`). The button is clipped and invisible. **Fix:** Move the button inside the visible boundary or change overflow strategy.

---

## 🔴 CRITICAL — Backend Bugs from fix-2.md (Still Unfixed)

- [ ] **CRIT-4 — HR attendance components still call `/attendance/admin/overview` → 403.** Files: `hr-attendance-table.tsx` line 64, `hr-team-attendance-widget.tsx` line 14, `hr-attendance-analytics.tsx` line 20. All must call `/attendance/hr/today` instead.
- [ ] **CRIT-6 — Grace period never applied to "late" flag.** `AttendanceService.php` `reconcileDay` still marks late on ANY lateness past `start_time` without reading `grace_minutes`. DR-ATT1 says 10-min grace.
- [ ] **CRIT-7 — Duplicate grace columns.** Both `grace_period_minutes` and `grace_minutes` may still exist. Need consolidation migration + controller/seeder alignment.
- [x] ~~CRIT-1 — Department archive/restore~~ (fixed: `$fillable` updated)
- [x] ~~CRIT-2 — Designation activate/deactivate~~ (fixed: `$fillable` updated)
- [x] ~~CRIT-3 — Export auth token~~ (fixed: no more `auth_token` cookie reference)
- [x] ~~CRIT-5 — Notification column~~ (fixed: jobs use `body`)
- [x] ~~CRIT-8 — HR correction capability gate~~ (fixed: dual capability in route)

---

## 🟡 Structural Gaps from fix-2.md (Not Yet Implemented)

### GAP Group A — Base Module Frontend
- [ ] **GAP-1 — User create/edit dialog missing fields.** `username`, `phone`, `employee_id`, `team_id`, `designation_id` inputs not rendered. Roles should be multi-checkbox, not single select.
- [ ] **GAP-2 — Directory "private" visibility branch.** `DirectoryController.php` only handles `public||internal`; no `private` else-branch → private users still expose email/phone.
- [ ] **GAP-3 — Directory Send Message doesn't navigate to chat.** Success handler just toasts; should route to `/dashboard/chat?conversation={id}`.
- [ ] **GAP-4 — Department members not viewable.** No drill-down to see actual users in a department. No `/departments/{id}/members` endpoint.
- [ ] **GAP-5 — No pagination UI on any list page.** Backend returns cursor-paginated data but frontend has no next/prev or "Load more" controls on users/departments/designations/directory.
- [~] **GAP-6 — Error states on list pages.** Partially done on users and departments pages (`isError` branch exists). Missing on designations and directory.
- [ ] **GAP-7 — Bulk actions stub.** Users page renders "Bulk Activate/Deactivate" buttons with no onClick handler. No backend bulk endpoint wired.
- [ ] **GAP-15 — Controller-level capability checks missing** on `updateStatus`, `destroy`, `resetPassword` in `UserController`. A caller with `users.employee.manage` could deactivate an HR/admin user.
- [ ] **GAP-16 — Department AvatarGroup shows placeholder "U" avatars**, not real member names/photos.

### GAP Group B — Attendance Frontend
- [ ] **GAP-8 — AdminOpenShiftsTable "Notify HR" is a stub.** Toast only, no actual notification sent.
- [ ] **GAP-9 — Calendar has no month/year navigation.** Fixed full-year view only.
- [ ] **GAP-10 — Calendar forces horizontal scroll on mobile** (`min-w-[800px]`).
- [ ] **GAP-11 — HR attendance page has no inline analytics summary cards.** Only Admin page has them.
- [ ] **GAP-12 — No department filter on HR attendance table.**
- [ ] **GAP-13 — TimeClockWidget swallows initial-load errors silently** (`catch {}`). No retry UI.
- [ ] **GAP-14 — Cross-midnight >36h breaks reconciliation** (query window too narrow).

---

## 🟡 Seed Data Gaps

- [ ] **SEED-1 — No attendance demo data.** Fresh DB has zero attendance events/days. Dashboard widgets show all-absent. Need `AttendanceDemoDataSeeder` for 30 days × 13 employees.
- [ ] **SEED-2 — Work schedule not linked to users/departments.** Schedule exists but no assignment rows.
- [ ] **SEED-3 — No leave request demo data.** Need 3-4 seeded leave requests (approved, pending, rejected) for testing approval queues.

---

## 🟡 Dashboard Issues (Phase 4-5)

- [ ] **DASH-1 — Employee dashboard widget overlap.** The `WidgetEngine` merging fix was applied but widgets like "Task Progress", "Approval Status", "Pending Tasks", "My Projects" render with empty-state placeholders that say "Module pending release in upcoming phase" — these should be properly styled empty states, not bare text cards.
- [ ] **DASH-2 — Dashboard hero banner may not match DR-DS1.** Should use charcoal/primary tokens, not generic violet gradient. Verify.
- [ ] **DASH-3 — Quick-action shortcuts verify.** All role-specific shortcuts should navigate correctly.

---

## 🟡 Cross-Cutting Requirements (R11, R13)

### UX & Accessibility
- [ ] **R3.4 — Breadcrumbs.** Component exists (`breadcrumb.tsx`) but need to verify it renders correctly on all detail screens with clickable crumbs.
- [ ] **R3.7 — Form system autosave/draft/restore.** Spec requires 30-second autosave + restore banner on forms. Not implemented on any form.
- [ ] **R3.10 — Drag-and-drop list reordering.** dnd-kit is listed as a dependency but no list pages actually implement drag reorder.
- [ ] **R3.12 — Toasts position.** Spec says top-right, auto-dismiss 4s. Verify Sonner config matches.
- [ ] **R3.13 — Empty states with animated logo.** Spec calls for animated logo mp4 in some empty states. Currently using generic icons.
- [ ] **R11.7 — Undo/redo, recently viewed.** Not implemented anywhere.
- [ ] **R11.8 — Right-click context menus.** Not implemented on any list.
- [ ] **R13.22 — Mobile responsive tables.** Tables should transform to cards on mobile. Most tables still render as wide tables requiring horizontal scroll.
- [ ] **R13.23 — WCAG 2.1 AA / axe-core.** No evidence of accessibility audit or axe-core integration.

### Performance
- [ ] **R13.5 — Zero N+1 / ≤5 SQL per list.** No query-count tests exist.
- [ ] **R13.7 — Bundle budget ≤200KB gz/route.** No `@next/bundle-analyzer` configured.
- [ ] **R13.9 — Images via next/image.** Mostly done but verify all user-uploaded images use it.
- [ ] **R13.14 — Virtualization for lists >100 rows.** No evidence of virtualized tables.
- [ ] **R13.28 — Sentry + Laravel Pulse.** Sentry may be configured but needs verification. Web-vitals component exists but may not be collecting.

---

## 🟢 Implementation Priorities (Recommended Order)

> **IMPORTANT:** Fix in this order to unblock daily production use as fast as possible.

### Priority 1 — Unblock the UI (1-2 hours)
1. `[ ]` SHELL-1: Fix group labels `text-muted` → `text-neutral-400`
2. `[ ]` SHELL-2: Verify all sidebar text visible after deploy
3. `[ ]` SHELL-3: Fix sidebar collapse chevron clipping
4. `[ ]` CRIT-4: Fix HR attendance endpoints (3 files)
5. `[ ]` CRIT-6 + CRIT-7: Grace period consolidation + application

### Priority 2 — Core Workflows (4-5 hours)
6. `[ ]` GAP-1: User create/edit full fields
7. `[ ]` GAP-3: Directory Send Message → navigate to chat
8. `[ ]` GAP-4 + GAP-16: Department members drill-down with real avatars
9. `[ ]` GAP-5: Pagination UI on all list pages
10. `[ ]` GAP-6: Error states on remaining pages (designations, directory)
11. `[ ]` GAP-13: TimeClockWidget error handling

### Priority 3 — Attendance Polish (3 hours)
12. `[ ]` GAP-8: AdminOpenShiftsTable Notify HR
13. `[ ]` GAP-9: Calendar month/year navigation
14. `[ ]` GAP-10: Calendar mobile responsive
15. `[ ]` GAP-11: HR analytics summary cards
16. `[ ]` GAP-12: Department filter on HR table
17. `[ ]` GAP-14: Cross-midnight edge case

### Priority 4 — Seed Data (2 hours)
18. `[ ]` SEED-1: AttendanceDemoDataSeeder
19. `[ ]` SEED-2: Link work schedule to users
20. `[ ]` SEED-3: Leave request demo data

### Priority 5 — Polish & Cross-Cutting (3-4 hours)
21. `[ ]` GAP-2: Directory private visibility
22. `[ ]` GAP-7: Bulk actions
23. `[ ]` GAP-15: Controller capability checks
24. `[ ]` DASH-1/2/3: Dashboard widget polish
25. `[ ]` R3.7: Form autosave (if time permits)

### Priority 6 — Deferred / Future Sprint
26. `[ ]` R11.7: Undo/redo, recently viewed
27. `[ ]` R11.8: Right-click context menus
28. `[ ]` R13.14: Table virtualization
29. `[ ]` R13.23: axe-core accessibility
30. `[ ]` R13.28: Sentry + Pulse verification

---

**Total outstanding items: ~30 actionable items**
**Estimated effort: ~15-18 hours across Priorities 1-5**

