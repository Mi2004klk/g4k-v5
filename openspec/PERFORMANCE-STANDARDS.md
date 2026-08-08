# Performance & Operational-Quality Standards (FROZEN)

> **Central, measurable source of truth.** Performance is a first-class architectural concern —
> not a later phase. Every doc and phase references these standards. All thresholds are
> verification targets enforced in CI; a regression fails the build.
>
> Test conditions: a throttled mid-range laptop (4× CPU slowdown, Fast 3G) for lab Lighthouse;
> p75 of real users for field metrics. Targets apply to **production builds**, never dev.
> "Must" = enforced (CI gate). "Should" = target (CI warn, track in TRACKER).

---

## 1. Initial page-load (LCP, FCP, TTFB)
- **P-LCP** The Largest Contentful Paint of any primary route MUST be ≤ 2.5s (p75 field), ≤ 2.0s
  lab (Fast 3G, 4× slowdown). Dashboard LCP element = first widget card.
- **P-FCP** First Contentful Paint MUST be ≤ 1.8s lab. Sign-in FCP ≤ 1.2s.
- **P-TTFB** Time To First Byte MUST be ≤ 600ms (Vercel edge/Next) and ≤ 800ms (Railway api).
  *Why:* perceived speed is gated by the first byte. *How:* Next.js edge runtime for static
  shells, HTTP/2, CDN, Laravel route/config/OPcache caching. *Verify:* Lighthouse + web-vitals.

## 2. Time to Interactive / Interaction-to-Next-Paint (INP)
- **P-INP** INP MUST be ≤ 200ms (p75 field). TTI SHOULD be ≤ 3.8s lab.
- *How:* avoid long tasks >50ms; defer non-critical JS; web workers for heavy compute (search
  indexing, report aggregation); React 18 concurrent features + transition for state updates.
- *Verify:* Lighthouse TTI; field INP via web-vitals; CI blocks regression > 200ms on key flows.

## 3. Cumulative Layout Shift
- **P-CLS** CLS MUST be ≤ 0.1. *How:* reserve space (aspect-ratio boxes for avatars/images,
  fixed-height skeletons, table row heights, sidebar width reserved before hydration).
- *Verify:* Lighthouse + field CLS.

## 4. Route / page navigation
- **P-NAV** In-app navigation to an already-loaded route MUST feel instant: ≤ 100ms to first
  painted frame; a cached/optimistic render shows within 1 frame.
- **P-NAV-CACHE** TanStack Query `staleTime` tuned per entity; navigation reuses cache, shows
  stale-then-fresh (no spinner for cached data). *Verify:* Playwright nav timing test < 100ms on
  cached route.

## 5. API response performance
- **P-API-P95** p95 API latency for list/detail reads MUST be ≤ 200ms (excluding network) at
  10k rows; write endpoints ≤ 300ms p95; heavy report endpoints stream/queue (see §16).
- *How:* efficient SQL, eager loading (no N+1), indexes, cursor pagination, response compression
  (brotli/gzip), HTTP caching where safe, ETags. *Verify:* Laravel benchmark tests assert p95.

## 6. Database query optimization & N+1 prevention
- **P-NO-N1** Zero N+1 queries. *How:* eager loading, scope per use case, Laravel Telescope in
  dev flags queries; CI test fails if a request executes > threshold duplicate queries.
- **P-Q-COUNT** A list endpoint MUST execute ≤ 5 SQL queries regardless of row count (after
  pagination). *Verify:* feature test counts queries via `DB::enableQueryLog()`.

## 7. Indexing & pagination
- **P-INDEX** Every column used in WHERE/JOIN/ORDER BY filters MUST have a DB index; composite
  indexes for common filter combos. *Verify:* migration review checklist + EXPLAIN in tests.
- **P-CURSOR** All list endpoints MUST use cursor pagination (not OFFSET) for deep pages;
  default 20 rows, options 50/100. *Verify:* API contract enforces cursor; deep-page test stable.

## 8. Frontend bundle size & code splitting
- **P-BUNDLE** Initial JS (First Load JS) per route MUST be ≤ 200KB gzipped; total route chunk
  ≤ 350KB gz. *How:* route-based lazy loading, dynamic imports for heavy libs (ECharts, Tiptap,
  dnd-kit, xlsx export) loaded on demand.
- *Verify:* CI `@next/bundle-analyzer` budget; failing build on budget breach.

## 9. Lazy loading & dynamic imports
- **P-LAZY** Every route outside the signed-out scope MUST be lazy-loaded. Heavy components
  (charts, editors, Gantt, calendar, export) MUST be dynamically imported on first use and
  prefetched on idle when likely needed. *Verify:* bundle analyzer shows them out of main chunk.

## 10. Image, font, and asset optimization
- **P-IMG** All images served via `next/image` (automatic WebP/AVIF, responsive srcset, lazy,
  blur placeholder). Avatars ≤ 96×96 display (stored ≤ 256px). Logo assets pre-optimized.
- **P-FONT** Self-hosted, subset (latin + needed glyphs), `font-display: swap`, preloaded.
  Max 2 families. *Verify:* Lighthouse image/font audits; CI checks no un-`next/image` `<img>`.

## 11. Caching strategy
- **P-CACHE-API** GET list/detail responses use `Cache-Control` + ETag where safe; TanStack
  Query `staleTime`/`gcTime` per entity (directories/departments: 5m; dashboards: 30s; static
  config: 1h). Invalidation via mutation cache-key busting.
- **P-CACHE-SRV** Laravel cache: config/routes/views compiled; OPcache enabled; query cache for
  hot, rarely-changing reference data (designations, departments, holidays).
- *Verify:* test asserting stale-then-fresh render on navigation; backend cache-hit test.

## 12. State-management efficiency
- **P-STATE** Zustand holds UI state only (ADR-008). No full server collections in Zustand.
  Selectors used to subscribe to slices; no whole-store subscriptions causing re-renders.
- *Verify:* code review + React DevTools profiler check in PR template (no render storms).

## 13. Prevention of unnecessary re-renders
- **P-RERENDER** List rows MUST be memoized (`React.memo` + stable keys); no anonymous
  callbacks/objects in props for hot lists; TanStack Query `select` for derived data; virtualized
  lists use stable item keys. *Verify:* render-count test (React Profiler) on a 1000-row table.

## 14. Efficient component architecture
- **P-COMP** Generic reusable components (Metric Widget, DataTable) over one-offs (ADR-reusable-
  first). Components split by render frequency: static (memoized) vs reactive (isolated).
- *Verify:* component inventory review; no duplication of data-fetch logic across modules.

## 15. Search & filtering performance
- **P-SEARCH** Debounced server-side search (250ms) for tables; instant client-side filter only
  on ≤200 already-loaded rows. Filter changes update URL + cache; no full reload.
- *Verify:* Playwright type-then-result-latency test < 300ms server search.

## 16. Large table / list rendering
- **P-VIRTUAL** Lists > 100 rows MUST be virtualized (`@tanstack/react-virtual`): employees,
  attendance logs, tasks, notifications, audit log, reports. DOM nodes capped regardless of data.
- *Verify:* test rendering 5000 rows, assert DOM node count ≤ (visible + overscan) and 60 FPS.

## 17. Form responsiveness
- **P-FORM** Inputs respond in ≤ 16ms (no layout thrash); validation on pause (400ms) not per
  keystroke; submit button shows dot-loader + is disabled to prevent double submit; autosave
  every 30s without blocking typing. *Verify:* input-latency test; double-submit prevention test.

## 18. Background processing
- **P-QUEUE** Any work > 500ms (exports, email, reports, notifications fan-out, recurring-task
  regeneration) MUST be offloaded to Laravel queues — never a long PHP request (project §11.5/§28).
- **P-ASYNC-FS** Frontend filesystem/heavy work (xlsx parse, Gantt layout) runs in a web worker
  or is chunked to avoid blocking INP. *Verify:* no blocking task > 50ms; queue dispatch tests.

## 19. Loading, skeleton & transition states
- **P-SKELETON** No route shows a full-screen spinner where a skeleton is possible. Skeletons
  match real content shape; partial/cached content shows immediately (stale-while-revalidate).
- *Verify:* Playwright asserts skeleton presence on slow network; no spinner screenshots in CI.

## 20. Optimistic UI where safe
- **P-OPTIMISTIC** Safe mutations (pin, reorder, read-mark, simple status toggle, clock-in)
  apply optimistically and roll back on error with a danger toast. Non-idempotent/destructive
  actions wait for server confirm. *Verify:* mutation test asserts instant UI + rollback path.

## 21. Network failure & retry handling
- **P-RETRY** Idempotent GETs retry with exponential backoff (via TanStack Query); mutations
  queued in the Offline Engine with retry ladder (project §9). Offline banner shown (R11.6).
- *Verify:* offline simulation test: mutation queues, banner shows, sync on reconnect succeeds.

## 22. Error handling without blocking workflow
- **P-RESILIENT** A failed widget/section MUST NOT block the page (error boundary per widget).
  Form submit errors keep entered data; inline field errors; toast for action failures; retry
  available. *Verify:* injected-failure test asserts partial page still usable.

## 23. Responsive behavior (desktop / tablet / mobile)
- **P-RESP** Layouts fluid 360px→1920px; breakpoints sm640/md768/lg1024/xl1280/2xl1536. Tables
  → cards on mobile; bottom nav ≤5; attendance button ≥48px. *Verify:* visual regression at
  360/768/1024/1440 in CI.

## 24. Accessibility & keyboard-friendly workflows
- **P-A11Y** WCAG 2.1 AA; all actions keyboard-reachable; visible focus ring; Ctrl+K palette,
  Ctrl+N, Ctrl+/, Esc, Enter; screen-reader labels on icon buttons. *Verify:* axe-core in CI
  (zero critical/serious violations).

## 25. Fast repetitive data-entry workflows
- **P-DATAENTRY** Common repeated actions (clock in/out, approve leave, assign task, mark read)
  MUST be reachable in ≤ 2 clicks from the dashboard, no full reloads, optimistic confirmation.
- *Verify:* click-count + time test for each workflow (see Attendance §30 + per-module specs).

## 26. Smooth inter-module interaction
- **P-CROSSMODULE** Moving between modules (task→project→chat→profile) preserves context via
  breadcrumbs + deep links + recently-viewed (R11.7); no refetch of shared data already cached.
- *Verify:* Playwright cross-module flow test asserts no redundant refetch + < 100ms cached nav.

## 27. Memory & resource usage
- **P-MEM** No unbounded client caches (gcTime + size caps); event listeners / Reverb
  subscriptions / web workers cleaned up on unmount; image/object URLs revoked. *Verify:* memory
  leak test across a 20-screen navigation; assert no retained detached nodes.

## 28. Production build optimization
- **P-BUILD** Tree-shaking on; minification; separate vendor cache group; no source maps in prod;
  unused deps pruned; React production build; Laravel octane-style optimizations where viable.
- *Verify:* build output budget; CI production-build smoke.

## 29. Monitoring & performance verification (production)
- **P-MON** Sentry (errors + performance) + Vercel Web Analytics / Speed Insights + Laravel Pulse
  wired from Phase 0/10. Field web-vitals (LCP/INP/CLS) collected; slow queries flagged by Pulse.
- *Verify:* dashboards show p75 metrics within targets for 7 consecutive days before M1 freeze.

## 30. Regression protection
- **P-REGRESS** CI performance budgets (bundle, Lighthouse, query counts, render counts) act as
  guardrails — a regression fails the build or opens a tracked breach. Lighthouse CI runs on PRs.
- *Verify:* CI job artifacts include the budget report; TRACKER logs breaches with owner + plan.

---

## How these map into OpenSpec
- **project.md** — §31 Performance Constitution (must/should, verification); §6 contracts include
  perf; §7 engines include perf; §5 principles include "performance-first"; §19 tools.
- **REQUIREMENTS.md** — R13.x mirrors each P-* standard as a testable requirement.
- **DESIGN-SYSTEM.md** — interaction responsiveness, virtualization, optimistic UI, skeletons.
- **TRACKER.md** — performance added to Definition of Done; CI budgets as cross-cutting tracker.
- **config.yaml** — per-artifact rules force performance consideration in specs/designs/tasks.
- **Each phase** — a `## Performance Requirements` block in design.md + perf-tagged tasks, with
  phase-specific acceptance criteria (e.g., Attendance one-tap clock-in, query budgets).

## Definition of "Done" for performance (applies to every phase)
A phase is not done until: CI performance budgets are green; Lighthouse CI meets route targets;
no new N+1; bundle within budget; field metrics on staging within p75 targets for the new flows;
no unbounded growth; axe-core clean; performance notes recorded in the archived spec.
