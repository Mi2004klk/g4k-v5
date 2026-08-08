# Tasks — dashboards

> Ordered, chunked (~2h each), tagged. Each phase ends with test + deploy + archive.

- [ ] 1. [spec] Extend OpenAPI: `GET /dashboards/layout`, `PUT /dashboards/layout`, `GET /dashboards/widgets/<provider-id>/data`; lint green.
- [ ] 2. [ui-pkg] Regenerate API types; add `DashboardsClient` methods in shared API client.
- [ ] 3. [api] Migration: `dashboard_layouts` (user_id, role, widgets json, timestamps); one row per user+role.
- [ ] 4. [api] `GET /dashboards/layout?role=` resolve the role's default widget set merged with the user's saved overrides; capability-gated.
- [ ] 5. [api] `PUT /dashboards/layout` persist per user+role (debounced client-side); reject cross-user writes; validate widget ids against the registry.
- [ ] 6. [api] `GET /dashboards/widgets/<provider-id>/data` dispatch to the data provider; serve metric JSON for allowed role, 403 for disallowed (manifest `rolePermissions`).
- [ ] 7. [ui-pkg] Widget manifest schema + TypeScript types (id/title/sizes/permissions/dataProvider/refresh/lazy/realtime/offline/drillDown/dismissible/settings).
- [ ] 8. [ui-pkg] `WidgetRegistry` (register/resolve manifest id → manifest + component) with role-permission filter.
- [ ] 9. [ui-pkg] Generic JSON-fed Metric Widget (renders `{value,label,secondary,trend,spark}`); adaptive across small/medium/large.
- [ ] 10. [ui-pkg] `WidgetShell`: header + collapse + refresh-on-hover + dismiss + drillDown; React error boundary per widget; skeleton + error/retry state.
- [ ] 11. [ui-pkg] Adaptive rendering by grid cell span: small=metric · medium=metric+label+secondary · large=chart(ECharts)+stats+trend+actions.
- [ ] 12. [ui-pkg] Per-widget data fetching via TanStack Query (own key); lazy-load via IntersectionObserver (only visible widgets fetch).
- [ ] 13. [ui-pkg] Realtime widget refresh: subscribe to Reverb channel on mount → invalidate widget's own query on event; independent of periodic refresh.
- [ ] 14. [ui-pkg] Offline widget mode: render last cached payload (cacheTime + IndexedDB) with "cached" affordance when Connectivity Monitor reports offline.
- [ ] 15. [web] React Grid Layout dashboard container (responsive, draggable, resizable; ADR-007 — dashboard only).
- [ ] 16. [web] Zustand `useDashboardLayoutStore` (UI state only; ADR-008): hydrate from API on mount, optimistic drag/resize, debounced PUT persist.
- [ ] 17. [web] Layout persistence end-to-end: rearrange/resize → persists → survives reload; per-user isolation.
- [ ] 18. [web] Admin dashboard composition (R4.6): active/inactive employees, active projects, today attendance (present/absent/late), pending approvals (quick access), recent activity feed (dense), quick task assignment.
- [ ] 19. [web] HR dashboard composition (R4.7): present/absent/late today, active projects, pending leave requests, pending submissions, quick task assignment.
- [ ] 20. [web] Employee dashboard composition (R4.8): active projects, pending tasks, attendance widget shell (Start/Pause/End + live timer), recent task progress bar, task approval-status panel.
- [ ] 21. [web] Stub data providers (seed/fixture JSON) behind all module widgets so dashboards render now; live providers plug in Phases 5–7 under the same `dataProvider` keys.
- [ ] 22. [web] Quick-action shortcuts bar per role (R4.9) above the grid (label + route/action).
- [ ] 23. [web] Quick Task Assignment widget stub: employee picker + create-task form → stub action (wired fully in Phase 7; Global Chat auto-notify in Phase 8).
- [ ] 24. [web] Independent-loading + error-isolation pass: one failing widget shows error/retry, dashboard keeps rendering.
- [ ] 25. [seed] Seeder: default per-role dashboard layouts (Admin/HR/Employee widget sets) so new users start from a sensible arrangement.
- [ ] 26. [test] api feature tests (layout GET/PUT isolation, capability gate, widget data 200/403); web/component tests (WidgetShell states, adaptive density, Metric Widget JSON, grid drag/resize, layout hydrate+persist, lazy no-fetch-until-visible, offline cached render, error-boundary isolation); e2e (rearrange → reload persists; resize changes density).
- [ ] 27. [web][ui-pkg][test][perf] Per-widget error boundaries + independent loading: confirm each `WidgetShell` owns its React error boundary and TanStack Query key; test that one failing/slow widget leaves all others rendering with their own error/retry (R13.21). Verify off-screen widgets do not fetch until visible via IntersectionObserver (R13.8).
- [ ] 28. [ui-pkg][test][perf] Stale-while-revalidate cache config: set dashboard data `staleTime: 30s`, `gcTime: 5m`; test that revisiting the dashboard renders cached data with no spinner (≤100ms cached first frame) and refreshes in the background; skeleton only on first-ever load (R13.3/10/18).
- [ ] 29. [web][test][perf] 60 FPS drag/resize test + debounced persistence: Playwright FPS trace asserts ≥60 FPS during React Grid Layout drag/resize with INP ≤200ms; assert a single debounced `PUT /dashboards/layout` after movement stops (no per-pixel writes) and the layout survives reload (R13.2/19).
- [ ] 30. [ui-pkg][test][perf] Realtime render-storm prevention: memoize widget components (`React.memo` + stable props); React Profiler render-count test asserting a Reverb event on one channel invalidates/re-renders only that widget, never siblings, even under a burst of events (R13.12).
- [ ] 31. [api][test][perf] Widget endpoint query-count + latency tests: benchmark `GET /dashboards/widgets/<provider-id>/data` — assert p95 ≤200ms, ≤5 SQL queries (no N+1) via `DB::enableQueryLog()`, and cursor pagination on list-shaped providers at 10k rows (R13.4/5/6).
- [ ] 32. [web][ui-pkg][test][perf] Memory hygiene on widget unmount: assert Reverb channel unsubscribed, in-flight queries cancelled, and object URLs revoked; 20-screen navigation memory test shows no retained detached nodes (R13.26).
- [ ] 33. [deploy] Staging deploy; sign in as karthik/Admin, aravind/HR, praveen/Employee; verify each dashboard renders, rearrange persists across reload, resize switches density, one widget failing leaves others intact; promote production.
- [ ] 34. [docs] Archive Phase 4 via `/opsx:archive`; update tracker ✅.
