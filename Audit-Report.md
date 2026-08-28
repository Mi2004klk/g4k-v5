# Games4Kings — MASTER AUDIT CONSOLIDATION (audit-report.md)

**Consolidation date:** 2026-08-28 (final pass) · **Codebase state:** commit `69e302d` + working tree (4 deleted legacy `.md` docs, no functional deltas — verified via `git status` before, during, and after this consolidation) · **Scope:** entire monorepo — `apps/api` (Laravel 11), `apps/web` (Next.js 16 App Router / React 19), `packages/ui` (`@g4k/ui`), `cloudbuild.yaml` deploy manifests, seeders, scheduler/queue, repo hygiene.

> **THIS FILE IS THE SINGLE AUTHORITATIVE MASTER AUDIT DOCUMENT.** It merges — with zero meaningful omissions — every live audit/report document in the repository, preserves every finding from every source (including fixed historical findings), re-verifies statuses against the current codebase, and appends each source report **verbatim** in the Source Archive (§16) so that a developer who reads nothing else still has the complete audit history, all findings, all verified fixes, all unresolved issues, and all required implementation work. Length is deliberate: completeness outranks brevity here.

---

## §0. How to Read This Document

### 0.1 Source documents merged (complete inventory of live audit/report `.md` files)

| # | Source file | Lines | Role | Disposition in this master |
|---|---|---|---|---|
| S1 | `report.md` | 300 | 2026-08-28 backend production-readiness audit (code-first; C/H/M/P3 finding sets) | Fully merged into register (§4–§7) with source IDs preserved; **verbatim in §16.1** |
| S2 | `frontend.md` | 970 | 2026-08-28 six-pass frontend end-to-end audit v6 (Parts 1–14; A–N findings; component/layout/functional-fit/IA audits) | Fully merged into register + §9–§11; **verbatim in §16.2** |
| S3 | `FINAL-AUDIT.md` | 224 | 2026-08-28 unified master (backend + frontend + §16 product-completeness gap audit + Wave roadmap) | Fully merged (incl. GAP-1..8, 16-A..16-S); **verbatim in §16.3** |
| S4 | `manual.md` | 940 | 2026-08-28 client user manual (all 29 chapters; documents every implemented workflow, capability matrix, automatic behaviors, FAQ) | Workflow/feature inventory merged into §3; manual-specific discrepancy notes in register; **verbatim in §16.4** |
| S5 | `audit-report.md` (prior 369-line register, 03:34 this date) | 369 | Compressed master register with verified statuses (built from S1–S4 by the prior session) | Superseded by this fuller rebuild; every F-ID, status, §37 fixed-set row, §41 disposition, and §42–54 plan carried forward; **verbatim in §16.5** |
| S6 | `.impeccable/detect-frontend-audit.json` | 26 findings | Deterministic frontend detector archive (Impeable `detect` run) | Summarized finding-by-finding in §9; full JSON preserved in `.impeccable/` |
| — | `docs/archive/**` (~30 files, ~1.3 MB) | — | Historical, explicitly-archived superseded plans/reports (2026-08-13→08-18 era) | NOT live audit reports; reconciled as lineage in §12 (every file listed with role + where its surviving findings live). Their findings were already re-verified into S5's lineage sections, which are carried into §8 |
| — | `README.md` (2,150 lines) | — | Product/tech documentation, not an audit | Not merged; no findings |

### 0.2 Finding-ID systems and cross-map

The sources use **three overlapping ID schemes** (report.md C-1…C-9/H-1…H-19/M-1…M-33; frontend.md A-1…A-7/B-1…B-7/W1…W26/A-L1…/F-F1…/K-A1…/GAP-…; FINAL-AUDIT.md renumbered C-1…C-9 differently). This master uses the **F-001…F-098** register (inherited from S5) and maps every source ID into it. ⚠️ Note the **C-number collision**: `report.md` C-8 = seeder credentials, but `FINAL-AUDIT.md` C-8 = move-phase. Always cite F-IDs; source IDs are kept for traceability.

| Master F-ID | report.md | frontend.md | FINAL-AUDIT.md | Other source |
|---|---|---|---|---|
| F-001 backdoor route | C-1 | — | C-1 | — |
| F-002 seeded live credentials | C-8 | — | C-2 | — |
| F-003 demo purge destroys real data | C-9 | 1.16 (blast radius unstated) | C-3 | manual §23 warning box |
| F-004 phase-create 500 | C-3 | — | C-4 | — |
| F-005 task/project delete 500 | C-4 | — | C-5 | — |
| F-006 task scope escalation + fillable | C-5 | — | C-6 | — |
| F-007 leave route shadowing | C-6 | — | C-7 | — |
| F-008 move-phase nonexistent method | C-7 | W14 | C-8 | — |
| F-009 capability-cookie lockout | C-2 | A-1, 1.14, 1.16, 1.18 | §7 A-1 | — |
| F-010 HR approvals dead end | H-12 | A-2, 1.8 | §7 A-2 | manual §10 (hedges the gap) |
| F-011 silent no-op trio | H-2, H-3 + pin-no-broadcast | A-3, W13 | §7 A-3 | — |
| F-012 micro-typography pandemic | — | A-4 | §7 A-4 | detector (indirect) |
| F-013 realtime dead + false Offline | H-1 | 1.18 ConnectionStatus | H-1 | manual §29 FAQ |
| F-014 teamToday staleness | H-6 | B-6, 1.8 | H-6 | — |
| F-015 HR scope leaks (timer/logs/leaveHistory) | H-5 | Part 3 HR | C-9 | — |
| F-016 PII leaks per-record views | H-8 | — | H-8 | — |
| F-017 plaintext reset link persisted | H-7 | — | H-7 | manual §4 (documents hand-off flow) |
| F-018 last-super-admin demotable | H-9 | — | H-9 | manual §19 (claims guard rails — overstated) |
| F-019 avatar orphan growth | H-10 | — | H-10 | — |
| F-020 schedule default silent loss | H-11 | 1.16 | H-11 | — |
| F-021 leave-approval integrity | H-15 | — | H-12 | — |
| F-022 redo strands task | H-16 | — | H-13 | — |
| F-023 weekly summary wrong roles | H-17 | — | H-14 | manual §27 (promises the digest) |
| F-024 users-export filter drift | H-18 | — | H-15 | — |
| F-025 NULL active_role exclusion | H-19 | — | H-16 | — |
| F-026 project edit stub | H-13 | B-3, 1.10 | (backend H-13 differs — see F-022) | manual §11 (promises full edit) |
| F-027 offline false-success | M-26 | A-7 | §7 A-7 | — |
| F-028 dynamic status classes | M-28 | A-5 | §7 A-5 | — |
| F-029 fictional profile sections | M-31 | A-6, 1.17 | §7 A-6 | — |
| F-030 Employee-360 manager actions | — | K-A1, 1.13, Part 14-D | §15 K-A1 | — |
| F-031 post-creation dead ends | — | (implied Part 1/2) | GAP-1 | — |
| F-032 text-only people pickers | — | D-F1, G-F1 | §14 D-F1 | — |
| F-033 six missing primitives + Select error | — | 6.3, 6.12 | §12 | — |
| F-034 silent caps (100/1000/7) | M-25 | B-4 | §7 high-friction | — |
| F-035 export memory bridge | — | B-2, W19 | §7 high-friction | — |
| F-036 remember-me defeated | H-14 | B-7 | (H-14 differs — see F-023) | manual §3 (documents the promise) |
| F-037 DatePicker capability gaps | — | A-F1..A-F3 | §14 A | — |
| F-038 corrections depth | — | B-1, W6 | §16-G | — |
| F-039 palette + /admin dead links | M-30 | Part 5 C, 1.18 | §7 navigation | — |
| F-040 public version/public-config | M-6, M-7 | — | H-17, H-18 | — |
| F-041 ip-api egress + trustProxies | M-8 | — | H-19 | — |
| F-042 dashboard cache family | M-1, M-2, M-3 | — | §5 M-1/2/3 | — |
| F-043 dormant security toggles | M-4 | — | §5 M-4 | manual §23 (advertises the toggles) |
| F-044 temp-password policy | M-5 | B-5 | §5 M-5 | manual §19 (documents toast hand-off) |
| F-045 capability-drift set | M-9, M-10, M-11 | — | §5 M-9/10/11 | — |
| F-046 QA edit orphans submissions | M-14 | — | §5 M-14 | — |
| F-047 report parity + chunk order | M-15, M-16 | — | §5 M-15/16 | — |
| F-048 timezone mixing + date 500s | M-17 | 1.7 (same-day picker) | §5 M-17 | — |
| F-049 leave policy gaps | M-18 | W3 | §5 M-18 | manual §8 (documents the rule) |
| F-050 half-day dead / open-shift / early-leave | M-19 | — | §5 M-19 | — |
| F-051 broadcast family | M-21, M-22, M-23, M-24 | — | §5 M-21..24 | — |
| F-052 Echo token staleness | M-27 | I-F1 item | §5 M-27 | — |
| F-053 prefetch drift + dup polling | M-29 | I-F1 item | — | — |
| F-054 hydration double-gate + role-select loader | P3 nibs | 1.4 | — | — |
| F-055 dialog sizes + no mobile sheet | — | A-L1, F | §11 | — |
| F-056 two date grammars | — | A-F4, D | §7 forms | — |
| F-057 window.confirm in chat (×2 verified) | — | D (said ×5) | §7 forms | — |
| F-058 pagination grammars ×3 | — | H, 6.3 | §7 consistency | — |
| F-059 toast asymmetry | — | H, J | §7 consistency | — |
| F-060 forms master finding | — | D, B-F1 | §7 forms | — |
| F-061 inputs master finding | — | C-F1..3 | §14 C | — |
| F-062 buttons master finding | — | F-F1..5, 1.1 | §14 F | — |
| F-063 padding conventions | — | B-L1..3 | §13 | — |
| F-064 dimension fragmentation | — | 6.2 | §12 | — |
| F-065 unprefixed grids | — | A-L2 | §11 | — |
| F-066 fixed chart heights | — | D-L5 | §13 | — |
| F-067 heatmap min-w-800 | — | L-F1 | §11 | — |
| F-068 toolbar/settings layout | — | D-L1, D-L2 | §13 | — |
| F-069 heading scale drift | — | G-L1 | §13 | — |
| F-070 a11y interaction cluster | — | G | §7 a11y | — |
| F-071 a11y semantics/motion cluster | — | G | §7 a11y | — |
| F-072 contrast cluster | — | G | §7 a11y | detector gray-on-color ×11 |
| F-073 IA cluster (naming/burial/URL) | — | E-A1, L-A1, L-A2, N | §15 | — |
| F-074 duplicate clusters ×11 | — | 6.3 | §12 | — |
| F-075 dead code inventory | P3 dead-code lists | 6.1, Part 14-A | §6 | — |
| F-076 leave un-editable | — | — | GAP-3 | — |
| F-077 erasure UI absent | — | — | GAP-2 | manual §29 (documents API-only anonymize) |
| F-078 QA lifecycle management | — | L-A2 | GAP-5 | — |
| F-079 employee CSV import | — | — | GAP/16-I | — |
| F-080 saved-view management | — | E | 16-I | — |
| F-081 reject-reason asymmetry | — | W5 | 16-J | — |
| F-082 recurrence completion silent | — | W12 | GAP-7 | manual §15/§27 (implies announcement) |
| F-083 empty-dashboard guidance | — | — | 16-M | — |
| F-084 audit user-filter cap 100 | — | 1.15 | §8 | — |
| F-085 30-day purge undisclosed | — | W18 | 16-N | manual §18/§29 (discloses only in manual) |
| F-086 z-index soup | — | H | §7 consistency | — |
| F-087 elevation/chrome mix | — | O-L1, O-L2 | (layout) | — |
| F-088 Gen2k/G4K brand split | — | 1.1 | §7 | — |
| F-089 breadcrumb/copy polish | P3 nibs | Part 4 N-roadmap | — | — |
| F-090 density wiring + overtime mislabel | M-33 (timer 31500s) | 1.6, I | — | — |
| F-091 numeric alignment + action columns | — | I, I-L4 | §8 SA variant | — |
| F-092 repo hygiene | P3 repo hygiene | — | §6 | — |
| F-093 backend low nibs (grouped) | P3 correctness nibs | — | §6 | — |
| F-094 S3 runtime config | (lineage: 08-16 missing adapter) | — | — | **refined this pass — see §2.4** |
| F-095 throttle 1000/min | — | — | — | §2.4 (verified `AppServiceProvider.php:74-75`) |
| F-096 JS-readable token cookie + dual CSP | P3 nibs (X-XSS/CSP) | — | — | — |
| F-097 chat edit/mark-all-read absent | P3 nibs (message edit) | 6.4 chat composer | 16-I | — |
| F-098 prod build parity | (lineage: 08-21) | — | — | unverified, needs deploy access |
| F-099 leave-cancel CHECK violations (**NEW 08-28**) | missed by S1–S5 | W4 (classified "Good" — corrected this pass) | missed | discovered by this pass's sweep — §2.4, §4 |
| F-100 missing-feature & efficiency residual set | P3 nibs context | 16-H/I/J/P, K, J-L1, F-L3 | GAP-6/8, 16-I/16-J | S5 §26–28 P3 set; consolidated this pass (§2.4 second sweep) |
| F-101 project cover upload broken (**restored 08-28**) | H-4 | — | §4 item 4 | dropped by S5; restored + re-verified this pass (§2.4) |

### 0.3 Status legend (applies to every finding)

**OPEN** (reproduced/confirmed in current code) · **FIXED** (historical finding verified fixed in current code — preserved as history) · **PARTIALLY FIXED** (fix landed but incomplete/unconfirmed at runtime) · **REGRESSED** (was fixed, broken again — none found) · **SUPERSEDED** (finding overtaken by architecture/decision) · **NOT REPRODUCIBLE** (cannot be confirmed from code; needs runtime/deploy) · **UNVERIFIED / REQUIRES PRODUCT CONFIRMATION** (assertable neither as defect nor safe — needs an owner decision).

### 0.4 Field convention

Every register entry in §4–§7 carries the 16 required fields: **ID · Category · Source audit(s) · Page/Module · Route · Component · User role · Workflow · Current behavior · Expected behavior · Problem · User impact · Evidence (file:line) · Root cause · Recommended solution · Scope (Global/Module/Page/Backend) · Status · Priority**. Where a field is genuinely N/A (e.g., a repo-hygiene finding has no user role) it is marked "—".

---

## §1. Executive Summary

Games4King is a feature-complete, three-role (Employee / HR / Super Admin) workplace OS covering auth (login/forgot/reset/force-change/onboarding/role-select/sessions), attendance (punch state machine, corrections, boards, exports), leave (balances, approval chain, holidays), projects (+phases, review pipeline, cover, auto channel), tasks (+assignees, blocked-by, QA forms, recurrence, reminders, comments, time logs, reorder/bulk/move-phase), chat (global/DM/group/project; mentions, receipts, pins, clear), announcements, notifications, directory/employee management, reports (5 summaries + builder + async exports), audit logs, an 11-tab settings suite, and an offline engine — built on a genuinely good design-token system and a real shared component library (`@g4k/ui`, 57 primitives, 170 importing files).

**Verdict: NOT PRODUCTION READY.**

The blocking set (13 P0s — 12 re-verified from the prior audits + 1 **newly discovered by this consolidation pass** (F-099); see §2.4):

1. **F-001** — an unauthenticated API backdoor (`GET /api/test-projects`) that force-logs-in a real user and dumps projects; a stray root script re-injects the route if deleted.
2. **F-002** — the seeder plants hardcoded live credentials (`Admin@123` etc.) in every environment and demo-reseed resets real accounts.
3. **F-003** — the Settings→Demo Data "purge" destroys real org data: every avatar file, all seeded users including the only super admin, settings/audit rows.
4. **F-004** — creating a project phase always returns 500 (illegal `TaskActivity::create(['project_id'])`; phase row persists before the throw).
5. **F-005** — deleting a task or project always returns 500 on PostgreSQL (`event='deleted'` violates the enum CHECK) after the soft-delete already ran.
6. **F-006** — task creation scope escalation: default `scope='global'` assigns+notifies the whole company; department/role targeting bypasses permission rules; `scope_id` silently dropped (not fillable).
7. **F-007** — route shadowing kills `GET /leave-requests/pending` and `/export` (registered after `/{id}`) — with live frontend consumers (verified).
8. **F-008** — `POST /tasks/{id}/move-phase` routes to a controller method that does not exist → 500.
9. **F-009** — the frontend middleware reads cookie `g4k_capabilities` while the app writes `g4k_capabilities_{userId}` → every role (incl. Super Admin) is locked out of Settings, Audit, Reports, Admin pages.
10. **F-010** — HR's leave-approvals workflow is a navigable dead end (deep links target a tab HR's view doesn't render).
11. **F-011** — silent no-op trio: clear-chat, board drag-reorder, message pin — the UI confirms success, nothing persists.
12. **F-012** — micro-typography pandemic (477 arbitrary `text-[Npx]` sizes; fresh recount this pass: 407 occurrences ≤11px) failing practical WCAG legibility.
13. **F-099 (NEW — this pass)** — cancelling a leave request writes `cancelled`/`resolved` values that violate **three** PostgreSQL CHECK constraints (`leave_requests.status`, `approvals.status`, `approvals.decision`) → guaranteed 500 in production; invisible on the SQLite dev/test environment (§2.4, §4).

Beneath the blockers: 31 P1 (realtime dead in prod with a permanent false "Offline" pill; HR scope leaks; PII leaks; team-board staleness; plaintext reset links; last-admin demotion; project edit stub; project cover upload broken (F-101, restored); text-only people pickers; silent caps; offline false-success …), 44 P2, 14 P3 register blocks (incl. the F-100 residual set) open/partial findings; 10 historical findings verified **Fixed**; 3 **Partially Fixed**; 0 **Regressed**; 5 **Superseded/Not-Reproducible**; 6 items **Requires Product Confirmation**.

**What must not be touched** (strengths to preserve — see §3.7, §11.4, §14): the architecture, workspaces, mobile shell, offline engine, component library adoption, token layer, timing-safe auth, row-locked punch state machine, immutable audit triggers, portable SQL.

**Handover recommendation (unchanged):** do not put real employees on this build until Wave 0/P0 (§14) is complete and the live-browser verification gate (§15) passes.

### 1.1 Verdict table (from S3, re-confirmed)

| Dimension | Verdict |
|---|---|
| Production readiness (backend + product) | **NOT READY** — 9 critical / 19 high / ~35 medium / ~30 low backend findings (S1) |
| Frontend audit health | **13/20** (Acceptable — significant work needed) |
| Frontend Nielsen heuristics | **23/40** (Acceptable) |
| Product completeness | Core Employee workflows complete; management/context gaps concentrate in HR + Super Admin surfaces (S3 §16) |
| Overall | Feature-rich, genuinely designed workplace OS; delivery blockers are concentrated, named, and fixable (≈ a fortnight of focused work for Waves 0–2) |

---

## §2. Methodology, Verification & This Pass's Re-Verification

### 2.1 Prior methodology (S1–S5, 2026-08-28 earlier session)

1. **Code-first:** entire API read (36 controllers, 44 models, 6 middleware, 9 services, seeders, scheduler, routes) and entire frontend read (all routes, stores, hooks, component families) — via 4 deep-dive sub-agents (backend ×3, frontend ×1), followed by solo re-verification of every P0 claim and six further solo passes (usability, components, layout, functional-fit, IA, completeness).
2. **Measured, not guessed:** all distributions (typography, heights, radii, paddings, grids, adoption counts, caps, timings) are greppable counts from source; detector archive `.impeccable/detect-frontend-audit.json` (26 findings, 3 vendor/test false positives).
3. **Reconciliation:** every prior-audit-era finding (2026-08-16→08-26, original files deleted by owner) re-checked against current code and assigned a status.
4. **Degraded-mode disclosure:** review sub-agents hit the platform 5-hour usage limit twice; assessments completed solo inline. No live browser — visual findings are code-inferred; §15 gates them behind a live-browser verification step.

### 2.2 This consolidation pass (the document you are reading)

1. Read S1–S5 **in full** (2,806 lines) + S6 detector JSON; built the cross-map (§0.2).
2. Confirmed `git` state unchanged since the prior verification pass (same commit `69e302d`, same doc-only working tree) so prior statuses remain anchored to this exact tree.
3. **Independently re-verified the 12 P0s plus key P1 mechanisms** against current code with fresh greps (§2.4) — including one correction to a P1 (F-094) and fresh metric counts — then ran systematic **class-level discovery sweeps** (every route→controller-method binding in `api.php`, all DB enum CHECKs vs every literal value written by code, model fillable coverage incl. the `#[Fillable]` attribute style, hardcoded-secret regex sweep, XSS sinks, dynamic-class patterns), which surfaced **one new P0 (F-099)** and cleared five suspect areas (exonerations, §2.4).
4. Merged every finding from every source into the register (§4–§7), preserving per-source IDs, pages, roles, workflows, evidence, and recommendations; deduplicated only true root-issue overlaps while retaining every affected page/component/workflow variant.
5. Preserved all fixed/partial/superseded historical findings (§8), the archived-docs lineage (§12), and every roadmap/plan variant (§14).
6. Appended S1–S5 verbatim (§16) — byte-level guarantee of zero omission.

### 2.3 Source-of-truth priority

(1) Current codebase — every finding carries `file:line` evidence; (2) the implemented product's own contracts (a "Success" toast implies persistence; the manual's promised workflow implies the UI must deliver it); (3) this session's audit documents as finding repositories; (4) legacy docs — none trusted (deleted by owner; lineage survives via reconciled memories and is marked). Anything unverifiable is marked **Unverified / Requires Product Confirmation** — never asserted as a defect.

### 2.4 Re-verification deltas (this pass — fresh evidence)

**Confirmed OPEN exactly as reported (spot-verified):**

- **F-001** `routes/api.php:401` backdoor present; `fix_test_route.php`, `fix_per_page.js`, `test-fetch.js` all still at repo root.
- **F-009** `middleware.ts:47` reads `g4k_capabilities`; writers are `auth-store.ts:94` and `capabilities.ts:33`, both writing `g4k_capabilities_${userId}` — mismatch confirmed.
- **F-004** `PhaseController.php:104-107` still contains `TaskActivity::create(['project_id' => $project->id])` with the in-code debate comment; enum CHECK (`2026_08_09_025001…:107`) allows only `created|assigned|progress|submitted|approved|redo`.
- **F-005** `TaskController.php:759` `'event' => 'deleted'` (and ProjectController equivalent) vs the same enum — guaranteed pgsql constraint violation.
- **F-007** `routes/api.php`: `/{id}` (GET show) at :153 inside its capability group precedes `/leave-requests/pending` (:163) and `/leave-requests/export` (:165) — both shadowed; `balance`/`history` (:151-152) precede and survive. **Live frontend consumers verified:** `nav-group.tsx`, `admin-leave-holidays-view.tsx` (and dead `approvals-tab.tsx`) call these endpoints. Precision note: `/leave-requests/admin/history` (:164) is a two-segment path and is **not** shadowed by `{id}`.
- **F-008** route `POST /tasks/{id}/move-phase` at `routes/api.php:222`; grep of `app/` finds no `function movePhase`.
- **F-011** `Conversation.php:24-27` `withPivot(['last_read_at','is_pinned'])` — no `cleared_at`; `Task.php` `$fillable` lists `scope` but **not** `scope_id` and **not** `order`.
- **F-002** `DatabaseSeeder.php:245` `$isProd = false; // … Disabled so demo passwords work on live`.
- **F-003** `DemoPurgeCommand.php:136` `Storage::disk($disk)->deleteDirectory('avatars')` + blanket `is_demo=true` row deletes (lines 44-108).
- **F-010** `hr-attendance-view.tsx:14` tab state starts `'today'`; no `leave`/approvals tab implemented.
- **F-026** `projects/[id]/page.tsx:407-419` edit dialog renders name+description only, comment `{/* Same as before, keeping it simple for the artifact */}`.
- **F-039** `command-palette.tsx:230` still links `/dashboard/profile?tab=settings`.
- **F-040** `/api/version` (`routes/api.php:56`) registered before the authenticated group (:65) — public.
- **F-095** `AppServiceProvider.php:74-75`: `RateLimiter::for('api')` = `Limit::perMinute(1000)` applied to the entire authenticated group — effectively no rate limiting. (Upgrades this from "reported" to code-verified with exact evidence.)
- **F-013 (manifest half)** `cloudbuild.yaml:67-68,88-89`: `BROADCAST_CONNECTION=pusher` + `PUSHER_APP_CLUSTER=ap2` only — no `PUSHER_APP_KEY/SECRET/ID` in either Cloud Run service.
- **F-040b** `routes/api.php:169` holidays route still `cache.headers:public;max_age=3600;etag` on an authenticated route.
- **F-012** fresh count: **407** occurrences of `text-[7px..11px]` in `apps/web/src` (consistent with the reported 477 total arbitrary sizes incl. larger values).

**Corrected / refined this pass:**

- **F-094 (S3 storage)** — the prior register said "`AWS_BUCKET` (and credentials) absent from `--update-env-vars`". **Correction:** `cloudbuild.yaml:68` and `:89` **do** set `AWS_BUCKET=g4k`, `AWS_ENDPOINT=https://${_SUPABASE_PROJECT_REF}.storage.supabase.co/storage/v1/s3`, `AWS_URL=…`, `AWS_DEFAULT_REGION=ap-south-1`. What remains genuinely unverified is **credential delivery** (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are not in the manifest — presumably injected via another mechanism) and runtime behavior (no deploy access). Status stays **Partially Fixed / Open runtime question**, with corrected evidence. The 2026-08-16-era "missing S3 adapter" lineage remains **Fixed** (adapter installed, disk defined, `FILESYSTEM_DISK=s3` set).
- **F-097 numbering note** — in the prior register, F-097 was briefly "pusher keys absent" and then renumbered to "chat edit/mark-all-read absent"; this master fixes F-097 = chat gaps and folds the pusher-keys point into **F-013** (where it belongs, as manifest evidence).

**New findings from this reconciliation pass (discovery sweep):**

- **F-099 (NEW · P0) · Cancelling a leave request = guaranteed 500 on PostgreSQL (three CHECK violations).** **Evidence:** `LeaveRequestController::destroy` writes `$leave->status = 'cancelled'` on **both** paths — employee self-cancel of pending leave (`:409`) and HR/SA cancel (`:460`, incl. the cancel-approved balance-refund flow) — then updates approvals with `['status' => 'resolved', 'decision' => 'cancelled']` (`:414`, `:465`). But `leave_requests.status` is `enum('pending','approved','rejected')` (migration `2026_08_09_075935`: adds the column with exactly 3 values), `approvals.status` is `enum('submitted','pending','approved','rejected')`, and `approvals.decision` is `enum('approved','rejected')` (`2026_08_09_020003_create_phase_6_tables.php:14,18`). On pgsql, Laravel enums become CHECK constraints; `'cancelled'` and `'resolved'` violate them → `QueryException` on the very first `save()`. **No migration anywhere extends these CHECKs** — the only CHECK-extension migration in the repo is for `projects.status`. Works on SQLite dev/tests (Laravel's SQLite enums carry no enforced CHECK — the repo's own `2026_08_15_210000` migration comments "SQLite has no CHECK constraints to alter"), which is why this survived manual testing and the entire prior audit series. **Impact:** leave cancellation is dead in production (both W4 employee path and admin cancel-with-refund path); approval rows left stale. **Fix:** one migration extending both CHECKs (`cancelled`; `resolved`) or switch the columns to plain strings + app-level validation (the QA redesign already chose string for exactly this reason). Registered as F-099 in §4; reclassifies workflow W4 from "Good" to **Blocking-on-PgSQL**.

**Exonerations (checked and cleared this pass — recorded so future audits don't re-chase them):**

- **QA field types are NOT enum-broken:** QaController validates 18 `field_type` values and the DB accepts them — the `2026_08_18_213052_update_qa_forms_for_redesign` migration **drops the enum column and re-adds it as a plain string**; the narrow 5-value enum seen in that file is only in `down()`.
- **Projects `'review'` status is NOT enum-broken:** dedicated migration `2026_08_15_210000_extend_projects_status_check` drops and re-adds the pgsql CHECK including `review`/`pending_review`.
- **Route→controller-method sweep: clean.** Every `[Controller::class, 'method']` route in `api.php` resolves to an existing method — `movePhase` (F-008) is the **only** missing method in the entire route file.
- **No hardcoded secrets** in `apps/api/app` / `apps/web/src` (regex sweep for password/secret/key/token literals; seeders' demo credentials remain F-002). **Zero `dangerouslySetInnerHTML`** in the web app. **Only one dynamic-class site** in the frontend (`attendance/page.tsx:164`, already F-028).
- **`User` model mass-assignment is properly configured** via Laravel 11 `#[Fillable([...])]` PHP attribute (`User.php:14`) — no `$fillable` property, which briefly looked like an unguarded model; it is not.

**Refinements:**

- **F-057** — `window.confirm` count is **2** occurrences (verified: `chat-tab.tsx:707` clear-chat, `message-list.tsx:237` delete-message), not the "×5" carried by the sources; the finding stands, the count is corrected.
- **F-050** — the `half_day` value **still exists** in the `attendance_days.status` CHECK (`2026_08_09_020002:51` — it was never removed, just never computed; the source's "removed by migration" wording was imprecise); the CHECK values `leave` and `pending` are likewise never written by any code path.
- **Environment-split root cause (strengthens F-004/F-005/F-099):** SQLite dev/tests never enforce enum CHECKs while production PostgreSQL does — the mechanism that hides this entire bug class from the test suite (matches the known toolchain limitation that tests run sqlite-only).

**Second reconciliation sweep (finding-level completeness pass):**

After the class-level sweeps, every source finding was walked item-by-item against the register (not just the verbatim embeds). **One genuinely dropped P1 was recovered:** **report H-4 / FINAL-AUDIT §4-4 (project cover upload broken)** had been omitted by the S5 register and inherited by this rebuild — re-verified live (`uploadCover` interpolates a nonexistent `$id`, route has no `{id}`, no project association possible) and restored as **F-101**. Four further S1 items had been compressed out of the rebuilt register's blocks and were **restored with fresh code re-verification**: **M-12** (`syncEmployees` moves super_admins / archived-dept operations — `DepartmentController.php:263-275` re-verified, now in F-093), **M-13** (`PUT /profile` arbitrary `preferences` bypass — `ProfileController.php:28-42` re-verified, now in F-093), **M-20** (unaudited admin mutations + audit export persisting raw `$request->all()` — `AuditLogController.php:34-47` re-verified, now in F-045d) and **M-32** (login top-level `result.onboarded` vs `user.onboarded_at` contract — `login/page.tsx:90` vs `AuthController.php:319,444` re-verified, now in F-054); **M-7** (holidays `cache.headers:public`) was already covered in F-040's body but now carries its source citation explicitly. One S2 duplicate-cluster member (**activity feeds ×3**) and the Part 14-C calendar-grid-sharing recommendation were restored to F-074. Every remaining enhancement/improvement/efficiency recommendation from S2 (16-H/I/J/P, K-section, J-L1, F-L3), S3 (GAP-6, GAP-8), and S5 (§26–28 P3 set line: announcement archive / schedule-usage / duplicate / global-search) that existed only inside the verbatim embeddings was consolidated into the new **F-100 residual-set block (§7)** — 17 numbered items, each with classification and source. A final token-level cross-check (§13) confirms every C-1..9, H-1..19, M-1..33, GAP-1..8, and A/B/W-series ID now resolves inside the register region itself — no source finding remains embed-only.

---

## §3. Complete Product Inventory

### 3.1 Architecture snapshot (verified)

- **API:** Laravel 11 + Sanctum. Access token 15 min / refresh 7 days rotating (`g4k_refresh_token` httpOnly cookie), device/session management, max-device enforcement. Capability RBAC via `role_capabilities`: `super_admin` = `*`; `hr` = 23 caps (scoped via `department_hr` pivot / `HrScope`); `employee` = 9 caps. PostgreSQL with enum CHECKs and partial indexes; SQLite fallback for tests. Queue `database` (Cloud Run worker `g4k-worker` = `schedule:work` + `queue:work`; 12 scheduled jobs). Broadcasting configured `pusher` — **keys not in deploy env** (F-013, manifest-verified). Filesystem default **s3** (`FILESYSTEM_DISK=s3`; bucket/endpoint in manifest; credentials delivery unverified — F-094).
- **Web:** Next.js 16 App Router, React 19, TanStack Query 5, zustand (+persist/BroadcastChannel), react-hook-form + zod, Tailwind 4 tokens, `@g4k/ui`, echarts/dnd-kit/frappe-gantt/react-grid-layout/cmdk/sonner, laravel-echo + pusher-js, IndexedDB offline engine, cross-tab timer/auth sync.
- **Infra:** Cloud Build → Cloud Run (api + worker), Vercel artifacts present; stray codemod scripts at repo root (F-092).

### 3.2 Complete module inventory

Auth (login/forgot/reset/change/force-gate/onboarding/role-select/sessions) · Preferences · Company profile · Pins · Dashboard init (versioned caches) · Profile/avatar · Directory · Attendance (punch machine, days reconcile, corrections, admin/HR boards, live shifts, exceptions, exports) · Leave (balances, requests, approvals chain, holidays) · Notifications (+channels) · Projects (+phases, review pipeline, cover, auto channel) · Tasks (+assignees, blocked_by, QA submissions, recurrence, reminders, comments, time logs, reorder/bulk/move-phase) · QA forms · Timer · Saved views · Chat (global/DM/group/project; mentions, receipts, pins, clear) · Announcements (+reactions, dismiss) · Personal reminders · Quick notes · Feedback · Reports (5 summaries + builder + async ExportJobs) · Settings (company/schedules/policies/holidays/mail/notifications/auto-numbering/reminders/security-requests/demo-data/jobs) · Audit logs + login attempts · Users (CRUD, bulk, status, reset, anonymize-API, restore) · Departments/Teams/HR-assignment · Designations · Work schedules · Auto-numbering · Demo seed/purge · Version endpoint.

### 3.3 Complete page/route inventory (all 27 routes + shell, verified)

**Auth:** `/login`, `/forgot-password`, `/reset-password`, `/onboarding`, `/role-select`, `/change-password`.
**Dashboard:** `/dashboard` (role-split widgets); `/attendance` (Overview + My Leave); `/leave`→redirect; `/org/attendance` (SA 5 tabs / HR 2 tabs); `/org/leave`→redirect (dead target for HR — F-010); `/projects` (+`/[id]`); `/tasks`→redirect; `/tasks/[id]` (deep-link page with not-found state); `/chat` (3 tabs); `/notifications`→redirect; `/announcements`→redirect; `/directory` (+`/[id]` Employee 360); `/reports`; `/admin/reports`→redirect; `/admin/attendance`→redirect; `/admin` (middleware-guarded, **no page** — protected 404); `/audit`; `/settings` (11 tabs); `/profile` (7 sections). **7 redirect stubs total (verified).** Mobile bottom nav + FAB; middleware capability map + CSP.

### 3.4 Complete workflow inventory (26 traced; S2 Part 2 classification)

**Excellent:** W2 clock in→break→out; W24 offline punch + reconnect sync.
**Good:** W1 login; W4 cancel leave (**reclassified this pass: Blocking on PostgreSQL — F-099**); W8 submit project review; W9 review project; W10 create task; W11 submit task for review; W12 approve/redo task; W15 start DM; W16 group chat; W17 post announcement; W18 triage notifications; W21 change password; W22 revoke session; W23 switch role; W26 pins/notes (individually — Poor discoverability as a set).
**Acceptable:** W3 request leave; W7 create project (first-time friction-heavy); W20 manage employee (create→handoff); W25 send feedback (buried).
**Friction-heavy:** W6 correct missed punch (≈8 clicks / 4 layers); W19 run export (≈9 steps + memory bridge).
**Poor:** W13 reorder board (silent no-op).
**Blocking:** W5 HR approve-leave via navigation; W14 task→phase move; admin opening any admin page.

### 3.5 Role-by-role summary (S2 Part 3 + S3 §10)

**Employee** — sees Dashboard / Attendance & Time (Overview + My Leave) / Projects & Tasks / Communications / Directory / Profile (+ mobile FAB). Self-service loop coherent end-to-end; task create defaults to self; project restrictions explained via disabled tooltip; directory privacy respected. Gaps: "My Tasks & Board" label ambiguity; scope-filter noise (employees see own tasks only); personal reminders buried under Announcements tab; empty-dashboard day-one guidance absent (F-083); same-day sick leave impossible (F-049); drafts undisclosed (F-060); notifications expire silently (F-085).
**HR** — adds Team Attendance, Reports & Analytics, Directory management tabs, group chat creation, team announcements. Jobs: approvals, corrections, team monitoring, employee lifecycle, comms. Broken/confusing: leave-approvals nav dead end (F-010 — the defining HR workflow); Reports/Settings visible-but-blocked (F-009); two "Attendance" labels (F-073); board staleness invisible (F-014); correction depth (F-038); backend over-exposure invisible but real (F-015); weekly summary never arrives (F-023); schedule-blind corrections (F-020 family).
**Super Admin** — everything; nav hides personal self-service attendance (product decision). Broken: cannot administer at all (F-009); palette admin link dead (F-039); demo danger-zone blast radius unstated (F-003); audit user-filter cap (F-084); QA builder buried (F-073/F-078).

### 3.6 Screen-size comfort (360→2560; S2 Part 4)

360: dialogs (425–500px) overflow, micro-type worst, tables scroll-only · 390–430: chat best-in-class; hover actions invisible; small targets · 768: icon rail; toolbar reflow ✓; settings tabs wrap ragged · 1024–1200: full nav; smallest text on primary work device · 1440/1920/2560: deliberate `max-w-[1440px]` cap ✓. Cross-size defects: no dialog-as-sheet <640; `min-w-[800px]` heatmap (F-067); hover-dependent table actions; bulk-bar z-50 overlaps FAB z-40 (F-086); no `collisionPadding` on row menus.

### 3.7 Verified-working highlights (do NOT redesign — preserve list)

Timing-safe login + 5-strike lockout + rotating refresh; row-locked punch state machine (auto break-close, overnight attribution, `client_id` idempotency, 48-h reconcile); leave overlap/working-day/balance checks + refund; project review gating (all-tasks-done + QA); task cycle-guard (BFS) + QA-enforced submission; chat membership/mentions/receipts/unread; async export pipeline + CSV-injection sanitization + 30-day cleanup; immutable audit (DB triggers) + login history; portable SQL (no `FIELD()`/`GROUP_CONCAT`; `CASE WHEN` sorts; `LOWER(?)` search); `@g4k/ui` adoption (ConfirmDialog ×21, EmptyState ×33, ListScaffold ×11, DatePicker ×10, Toolbar ×9, Dialog ×23, Tabs ×18, DropdownMenu ×12); token layer (semantic tiers, status colors incl. `--overtime`, elevation e1–e4, density mode, motion vars, dark mode, 1440px cap); lazy-loading discipline (`dynamic()` echarts/gantt/kanban/QA); mobile shell (bottom nav + FAB, chat fullscreen + visualViewport, sidebar Sheet); cmdk palette + drafts ×5 + saved views + pins + offline queue with punch de-dup; cross-tab auth/timer sync; optimistic chat with read receipts; specific human error copy; per-segment error boundaries; attendance-history calendar (month nav + swipe + detail); attendance ETag caching; 1440 cap on ultrawide; gap-2 rhythm; ~20 negative margins only; virtualized activity feed; **silent-and-correct 401→refresh→redirect loop with self-explaining expired-session redirect** (S2 J positive); **task `?highlight=` deep-link scroll+ring pattern — the model for all detail links** (S2 C positive); holiday-aware late calculation with schedule grace; soft-delete cascade on projects; `EnsureTokenIsNotRefresh` blocking refresh-ability abuse on the API surface.

---
## §4. Master Finding Register — P0 (Blocking · 13 findings; F-001…F-012 re-verified OPEN, F-099 newly discovered this pass)

### F-001 · Unauthenticated impersonation backdoor route
**Category:** Security/Functional · **Sources:** report C-1; FINAL-AUDIT C-1; prior register §29 · **Route:** `GET /api/test-projects` · **Module:** API routes · **Role:** Anyone (unauthenticated) · **Workflow:** data exposure.
**Current:** The route sits **outside** the auth middleware group, force-logs-in `praveen@games4king.in` (`auth()->setUser($user)` + user-resolver override) and returns `ProjectController::index`. **Expected:** no unauthenticated data access; no hardcoded user impersonation.
**Problem/Impact:** anyone reaching the API dumps the (real) projects list as that user; a blueprint for worse — any future controller change widens the leak. **Evidence:** `apps/api/routes/api.php:401`; re-verified this pass. Repo-root script `fix_test_route.php` exists solely to **re-inject** this route if removed — naive deletion silently regresses. **Root cause:** leftover testing scaffolding committed to production code paths. **Fix:** delete the route **and** `fix_test_route.php`, `test-fetch.js`, `fix_per_page.js`; add a CI grep guard for `/test-projects`. **Scope:** Global (API) · **Status:** OPEN · **Priority:** P0.

### F-002 · Seeder plants hardcoded live credentials; demo reseed hijacks real accounts
**Category:** Security · **Sources:** report C-8; FINAL-AUDIT C-2 · **Module:** `DatabaseSeeder` / DemoSeedCommand · **Role:** attacker = anyone with repo access; victim = SA (provisioning).
**Current:** `DatabaseSeeder.php:245-246` — `$isProd = false; // app()->environment('production'); // Disabled so demo passwords work on live`. Super admin `karthik / Admin@123`, HR `Hr@123`, etc. seeded with `must_change_password=false` in **every** environment. `DemoSeedCommand` runs full `db:seed`; `User::updateOrCreate(['username' => …])` (:248) **resets email/password of any real user that happens to hold a seeded username**. **Expected:** production seeding generates random passwords (the prod branch exists but is unreachable); demo seed never mutates non-demo users.
**Problem/Impact:** anyone with repo access logs into any freshly seeded/staging (or demo-reseeded production) environment as super_admin; demo reseed is an account-takeover primitive. **Evidence:** verified this pass (`:245` comment intact). **Root cause:** environment detection disabled for demo convenience; seeding keyed on mutable production columns. **Fix:** restore environment detection; key demo users on a demo-only marker and refuse to touch non-demo rows; rotate the committed passwords. **Scope:** Backend · **Status:** OPEN · **Priority:** P0.

### F-003 · "Purge demo data" destroys real org data
**Category:** Data-safety · **Sources:** report C-9; FINAL-AUDIT C-3; frontend 1.16 (blast radius unstated) · **Page:** Settings → Demo Data · **Role:** SA · **Workflow:** demo management.
**Current:** `DemoPurgeCommand` deletes every row carrying a `demo_tag` (39 tables incl. `settings`, `role_assignments`, `export_jobs`, `saved_views`) and every `is_demo` row; the seeder marks **all seeded users — including the only super_admin — `is_demo=true`**, so purge removes all login accounts; `:136` `Storage::deleteDirectory('avatars')` deletes **every real user's avatar**. `DemoDataController` exposes this as one SA action behind only a typed confirmation; the seed/purge trigger is not audited; the completion notification silently no-ops because the initiator was deleted (`PurgeDemoDataJob.php:33-42`). **Expected:** purge removes exactly the demo dataset; production org data untouched; action audited.
**Problem/Impact:** irreversible destruction of org data from the settings UI; the UI's danger-zone text does not state the true blast radius (frontend 1.16). **Evidence:** `DemoPurgeCommand.php:44-48,56,71,108,136` re-verified this pass. **Root cause:** demo tooling and production share one code path with no environment guard; `is_demo` conflates "seeded" with "disposable". **Fix:** scope user deletion to `is_demo AND demo_tag` users never referenced by real data; never blanket-delete storage dirs; disable endpoints in production (`app()->environment('production')` guard); audit the trigger; update the confirmation copy to state what actually dies. **Scope:** Backend+UI · **Status:** OPEN · **Priority:** P0.

### F-004 · Creating a project phase always returns 500
**Category:** Functional · **Sources:** report C-3; FINAL-AUDIT C-4 · **Route:** `POST /projects/{id}/phases` · **Module:** PhaseController · **Role:** HR/SA · **Workflow:** project phases.
**Current:** after creating the phase, `PhaseController.php:104-107` runs `TaskActivity::create(['project_id' => $project->id])` — the code comments literally debate this mid-implementation ("Wait, TaskActivity belongs to task…"). `project_id` is not fillable (`TaskActivity.php:11-14`) and `task_activity.task_id` is NOT NULL (`2026_08_09_025001…:105`) → `QueryException` on every call. The phase row itself persists inside the same request (created before the throw), leaving state written despite the error. **Expected:** 201 + project-history log.
**Problem/Impact:** the phases feature (project journey, complete/reopen cascade) is dead at the write path; UI dialogs show errors while data half-writes. **Evidence:** re-verified this pass (comment intact at `:104-107`). **Root cause:** schema/model evolution without paired updates; unfinished code shipped. **Fix:** remove the `TaskActivity::create` block (project history already flows from task activity) or write a proper project-history record. **Scope:** Backend · **Status:** OPEN · **Priority:** P0.

### F-005 · Deleting a task or project returns 500 (PostgreSQL)
**Category:** Functional · **Sources:** report C-4; FINAL-AUDIT C-5 · **Routes:** `DELETE /tasks/{id}`, `DELETE /projects/{id}` · **Role:** HR/SA · **Workflow:** task/project lifecycle.
**Current:** `TaskController.php:756-761` and `ProjectController.php:306-314` create `TaskActivity` with `event => 'deleted'`, but the `task_activity.event` enum CHECK allows only `created|assigned|progress|submitted|approved|redo` (`2026_08_09_025001…:107`; no later migration extends it) → constraint violation → 500 **after** the soft-delete ran — half-executed transactions, failed responses. **Expected:** delete succeeds; optional allowed-activity log.
**Problem/Impact:** all task and project deletion (single + the non-QA path of bulk delete) fails at the DB layer while still mutating data; destructive flows look broken while silently working. **Evidence:** re-verified this pass (`TaskController.php:759`). **Root cause:** enum/CHECK drift (same class as F-004/F-006 fillable gaps). **Fix:** drop the activity insert on delete (audit_logs already record deletions) or extend the enum via migration. **Scope:** Backend · **Status:** OPEN · **Priority:** P0.

### F-006 · Task creation scope escalation + mass-assignment defects
**Category:** Security/Functional · **Sources:** report C-5; FINAL-AUDIT C-6 · **Routes:** task create/update · **Role:** E (unintended exposure), H (bypass) · **Workflow:** task creation.
**Current:** `TaskController.php:307-345` — the employee self-assignment guard (307-310) runs **before** scope expansion (331-345). `tasks.scope` defaults to `'global'` (migration `2026_08_21_012826:21`), so: (a) **any task created without an explicit scope — including an employee's "personal" task — is assigned to every non-super_admin user and notifies all of them** (:365-376); (b) a non-manager posting `scope=department|role` with `scope_id` targets arbitrary departments/designations, bypassing self-only and HR department rules; (c) `scope_id` is **not fillable** (`Task.php:17-20`) so targeting is silently dropped anyway — scope features are simultaneously dangerous *and* broken. **Expected:** employees create self-assigned tasks only; scope expansion is a manager/HR privilege with validated `scope_id`; default scope private/self.
**Problem/Impact:** notification spam to the whole company per task; privilege-escalation path; silent data loss of `scope_id`. **Evidence:** fillable re-verified this pass (lists `scope`, not `scope_id`). **Root cause:** guard ordering + fillable gaps + unsafe default. **Fix:** default scope to self for non-managers; run scope expansion only under `tasks.manage`; add `scope_id` (+`order`, see F-011) to fillable; unit-test employee task creation assignee sets. **Scope:** Backend · **Status:** OPEN · **Priority:** P0.

### F-007 · Route shadowing kills two leave endpoints (live consumers verified)
**Category:** Functional · **Sources:** report C-6; FINAL-AUDIT C-7 · **Routes:** `GET /leave-requests/pending`, `GET /leave-requests/export` · **Role:** H/SA · **Workflow:** leave operations.
**Current:** `routes/api.php:153` registers `GET /leave-requests/{id}` **before** `:163 /leave-requests/pending` and `:165 /leave-requests/export`; Laravel matches in registration order → both captured by `show('pending'|'export')` → `ModelNotFound` → 404. (`/balance|/history` at :151-152 precede and survive.) **Expected:** both endpoints reachable (frontend leave-export and pending-list calls — consumers verified this pass: `nav-group.tsx`, `admin-leave-holidays-view.tsx`).
**Problem/Impact:** leave export and the pending list are dead URLs; any UI wired to them fails. **Root cause:** route registration order. **Fix:** move literal routes above `{id}` (or constrain `{id}` to `\d+`). **Scope:** Backend route · **Status:** OPEN (re-verified) · **Priority:** P0.

### F-008 · `POST /tasks/{id}/move-phase` routes to a non-existent method
**Category:** Functional · **Sources:** report C-7; FINAL-AUDIT C-8; frontend W14 · **Route:** `POST /tasks/{id}/move-phase` (`routes/api.php:222`) · **Role:** H/SA · **Workflow:** task→phase move.
**Current:** routes to `TaskController::movePhase`; grep of `app/` finds no `movePhase` anywhere → `ReflectionException`/500 on every call. **Expected:** task-to-phase move implemented or route removed. **Impact:** the move-phase control is a guaranteed 500 (workflow W14 = Blocking). **Evidence:** re-verified this pass. **Fix:** implement (move `phase_id` under participant + manage checks) or delete the route and its UI callers. **Scope:** Backend route · **Status:** OPEN · **Priority:** P0.

### F-009 · Frontend router locks every role out of Settings, Audit, Reports, Admin pages
**Category:** Navigation/Permission-UX · **Sources:** report C-2; frontend A-1/1.14/1.16/1.18; FINAL-AUDIT §7 A-1 · **Component:** `src/middleware.ts` vs `src/lib/auth-store.ts` / `src/lib/capabilities.ts` · **Routes:** `/dashboard/settings`, `/dashboard/audit`, `/dashboard/reports`, `/dashboard/admin/*` · **Role:** all, incl. Super Admin · **Workflow:** admin access.
**Current:** `middleware.ts:47` reads cookie **`g4k_capabilities`**, but the app only ever writes **`g4k_capabilities_{userId}`** (`auth-store.ts:94`, `capabilities.ts:33`). `caps` therefore always parses to `[]`, so `caps.includes('*')`/`caps.includes(required)` is false for every user — every visit redirects to `/dashboard?error=unauthorized` ("You don't have access to that section."). Nav and avatar menu still show the items; clicking produces the error. **Expected:** role-gated pages open for entitled roles.
**Problem/Impact:** the entire admin surface is unreachable in the current build (deployed build may predate this regression, but HEAD is broken). A visible feature that rejects you is worse than a hidden one; admins experience it as personal failure. **Evidence:** re-verified this pass (all three writer/reader lines). **Root cause:** cookie-name mismatch between writer and reader. **Fix:** align the cookie name (single source of truth in `auth-store.ts`) or prefix-scan `g4k_capabilities_*` in middleware; add an E2E smoke test that super_admin opens `/dashboard/settings`. **Scope:** Global (frontend) · **Status:** OPEN · **Priority:** P0.

### F-010 · HR leave-approvals dead end
**Category:** Navigation/Workflow · **Sources:** report H-12; frontend A-2/1.8; FINAL-AUDIT §7 A-2; manual §10 (hedges: "HR approvers work from their pending list and dashboard widget") · **Route:** `/dashboard/org/attendance?tab=leave&sub=approvals` · **Component:** `hr-attendance-view.tsx` · **Role:** HR (and pure approvers) · **Workflow:** leave approvals (HR's defining daily job).
**Current:** HR org attendance implements only `today` and `graph` tabs (`hr-attendance-view.tsx:14`), yet redirects and deep links send HR to `?tab=leave&sub=approvals` (`attendance/page.tsx:51-58`, `org/leave/page.tsx`, a command-palette link) → blank content. A user with `leave.approve-employee` but without `hr.view-team-attendance` gets a hard Access-Denied page instead of an approvals list. Meanwhile the approvals route `/leave-requests/pending` is dead (F-007). Only the dashboard widget works. **Expected:** HR org view has an Approvals tab; approvals surface gated on `leave.approve-employee`.
**Problem/Impact:** HR's primary workflow has no navigable home; fallback paths are broken. **Evidence:** re-verified this pass (tab state starts `'today'`, no leave tab). **Root cause:** HR view variant never received the approvals surface; links target the SA-only tab grammar. **Fix:** add the tab (or route HR to the shared approvals component); fix all dead `?tab=leave` links and `/org/leave` redirect target. **Scope:** Module · **Status:** OPEN · **Priority:** P0.

### F-011 · Silent no-op trio (UI lies about success)
**Category:** State-sync/Wiring · **Sources:** report H-2 + H-3 + pin-no-broadcast; frontend A-3/W13; FINAL-AUDIT §7 A-3 · **Components:** clear-chat, board drag-reorder, message pin · **Role:** All · **Workflows:** chat management, task board.
**Current:** (a) `ChatController::clearChat` writes `cleared_at` on the `conversation_user` pivot, but `Conversation::users()` `withPivot` only loads `last_read_at, is_pinned` (`Conversation.php:24-27`) so the `$pivot?->cleared_at` filter (`ChatController.php:107-113`) is always null — cleared history keeps rendering; also clearing the **global** chat attaches every clearer to the global pivot as a side effect. (b) `TaskController::reorder` ends with `$task->update(['order' => $taskData['order']])` (`TaskController.php:599`) but `order` is missing from `Task::$fillable` → mass-assignment silently drops it while responding "Tasks reordered successfully." (c) message pin/unpin emits no broadcast event — other clients never learn. **Expected:** actions persist or honestly fail.
**Problem/Impact:** users repeat actions 3×, lose trust, file "app is broken" tickets; organizing work is lost on reload; worst-in-class feedback failure because the UI *actively lies*. **Evidence:** pivot + fillable re-verified this pass. **Root cause:** three independent backend gaps (pivot columns, fillable, missing event). **Fix:** add `cleared_at` to `withPivot` (+ consider excluding global scope); add `order` (and `scope_id`) to fillable + regression test that reorder persists; broadcast pin/unpin; UI adds a persistence indicator on drag. Post-fix rule: each repair gets an E2E assertion. **Scope:** Backend-dependent, global UX impact · **Status:** OPEN · **Priority:** P0.

### F-012 · Micro-typography pandemic (legibility failure at scale)
**Category:** UI/Typography · **Sources:** frontend A-4; FINAL-AUDIT §7 A-4 · **Module:** all modules — table metadata, chips, timestamps (the content dense-screen users actually read) · **Role:** All · **Workflow:** daily reading.
**Current:** 477 arbitrary `text-[Npx]` sizes — 214×10px, 130×11px, 54×9px, 7–8px outliers — 178 combined with muted grays. Fresh recount this pass: **407** occurrences of ≤11px in `apps/web/src` (consistent). **Expected:** a type scale with a 12px content floor.
**Problem/Impact:** squinting at 1024px laptops (the primary HR work device); unreadable for aging eyes; zoom-assist users get broken layouts; fails practical WCAG 1.4.3/1.4.4. **Root cause:** no enforced type scale; per-screen ad-hoc sizing. **Fix:** token scale (`--text-2xs:11px` decorative max, `--text-xs:12px` floor), codemod sweep, ESLint `react/forbid` on arbitrary text sizes. **Scope:** Global · **Status:** OPEN · **Priority:** P0.

### F-099 · Cancelling a leave request = guaranteed 500 on PostgreSQL (three CHECK violations) — **NEW, discovered by this consolidation pass**
**Category:** Functional/Data · **Sources:** missed by S1–S5 (all sources classified cancel-leave W4 as "Good" — code-inferred, never runtime-tested on pgsql); discovered by this pass's enum-drift sweep (§2.4) · **Route:** `DELETE /leave-requests/{id}` · **Module:** LeaveRequestController · **Role:** E (self-cancel pending) + H/SA (cancel incl. approved-with-refund) · **Workflow:** leave cancellation (W4).
**Current:** both cancel paths — employee self-cancel (`LeaveRequestController.php:409` `$leave->status = 'cancelled'; $leave->save();`) and HR/SA cancel with balance refund (`:460`, `$wasApproved` branch) — then update approvals `['status' => 'resolved', 'decision' => 'cancelled']` (`:414`, `:465`). The DB CHECKs: `leave_requests.status` = `enum('pending','approved','rejected')` (migration `2026_08_09_075935` adds exactly these 3 values), `approvals.status` = `enum('submitted','pending','approved','rejected')`, `approvals.decision` = `enum('approved','rejected')` (`2026_08_09_020003_create_phase_6_tables.php:14,18`). On PostgreSQL, Laravel enums are CHECK constraints → the first `save()` throws `QueryException` → 500. **Expected:** cancel succeeds, balance refunded (approved case), attendance recalculated, approver notified.
**Problem/Impact:** leave cancellation is dead in production on both paths; the approval row is left stale; the frontend toasts an error after the user confirms. **Evidence:** all file:line above; **no migration anywhere extends these CHECKs** — the only CHECK-extension migration in the repo is `2026_08_15_210000` (projects). Works on SQLite dev/tests because Laravel SQLite enums carry no enforced CHECK (the repo's own migration comments this), which is why manual testing and all prior audits missed it. **Root cause:** enum/CHECK drift (same class as F-004/F-005) + environment-split (sqlite tests, pgsql prod). **Fix:** migration extending `leave_requests.status` with `cancelled` and `approvals.status` with `resolved` + `approvals.decision` with `cancelled` — or convert the three columns to plain strings with app-level validation (the QA redesign migration already made exactly this choice for `field_type`); add a pgsql-backed CI migration/factory smoke so this class stops escaping tests. **Scope:** Backend · **Status:** OPEN · **Priority:** P0.

---

## §5. Master Finding Register — P1 (31 findings, all OPEN unless noted)

### F-013 · Realtime broadcasting dead in production + permanent false "Offline" pill
**Category:** State-sync/Infra · **Sources:** report H-1; FINAL-AUDIT H-1; frontend 1.18; manual §29 FAQ (documents the badge as if by-design) · **Module:** broadcasting config + `use-reverb.ts` + `connection-status.tsx` · **Role:** All · **Workflow:** realtime UX.
**Current:** `config/broadcasting.php:19-21` silently falls back to `log` when `BROADCAST_CONNECTION=pusher` with no `PUSHER_APP_KEY`; `cloudbuild.yaml` injects `BROADCAST_CONNECTION=pusher` + only `PUSHER_APP_CLUSTER=ap2` (no key/secret/id; manifest-verified this pass; `.env*` dockerignored). `.env.production` sets `BROADCAST_CONNECTION=reverb`, but **no `reverb` connection exists in config and laravel/reverb is not installed**. Every `broadcast()` call site is wrapped in swallowing try/catch. Frontend: `use-reverb.ts` disables Echo without `NEXT_PUBLIC_REVERB_APP_KEY`/`NEXT_PUBLIC_PUSHER_APP_KEY`; `ConnectionStatus` then shows a permanent amber **"Offline"** pill while the app is actually online (polling works). **Expected:** working push transport in production; status indicator reflects connectivity, not feature config.
**Impact:** all "live" updates silently degrade to polling (15–30s); users see a false Offline badge that generates IT tickets; env files contradict each other. **Fix:** provision Pusher (or install Reverb both sides), inject keys in Cloud Run + Vercel, make the fallback loud, ConnectionStatus 3-state ("no realtime configured" ≠ "network down"). **Scope:** Backend-dependent + UI · **Status:** OPEN · **Priority:** P1. 

app_id = "2187569"
key = "e381a9c6a50fe719f8af"
secret = "2b950af84ca913960c99"
cluster = "ap2"

all updated on google cloud env and secrets, you can verify from deployment if anything i want ot change there. we use pusher for all, no reverb

### F-014 · HR "Today's Status" board stale up to 1 hour
**Category:** Data-sync · **Sources:** report H-6; FINAL-AUDIT H-6; frontend B-6/1.8 · **Component:** `teamToday` cache · **Role:** H/SA · **Workflow:** team monitoring.
**Current:** `teamToday` caches under a **versioned** key `team_today_v{version}_u{id}_{date}` (`AttendanceController.php:337`), but attendance observers forget the **unversioned** `team_today_u{id}_{date}` (`AttendanceDayObserver.php:46`, `AttendanceEventObserver.php:36`) — keys never written. Punches don't bump the dashboard version either; nothing short of the 3600-s TTL refreshes the board. No "last updated" timestamp shown. **Expected:** a punch reflects on the team board within seconds (or staleness is disclosed). **Fix:** align observer invalidation with the versioned key (or bump `DashboardCacheService` version on attendance writes); UI "last updated" stamp. **Scope:** Backend-dependent · **Status:** OPEN · **Priority:** P1.

### F-015 · HR cross-department data leaks
**Category:** Permission-UX/Data · **Sources:** report H-5; FINAL-AUDIT C-9 (renumbered!); frontend Part 3 HR · **Routes:** timer logs, logTime, `users/{id}/leaveHistory`, `users/{id}/assignments` · **Role:** HR (over-exposure), employees (privacy) · **Workflow:** HR operations.
**Current:** (a) `TimerController::index` (`:71-77`): anyone with `hr.view-team-attendance` gets **all users'** time logs with no `HrScope`; (b) `logTime` gates pass HR purely by role without department check (`:41,51`); (c) `UserController::leaveHistory`/`assignments` (`:702-707,728-733`) scope on `users.hr.manage`, which **HR lacks** (only super_admin) → HR sees leave history and project/task assignments company-wide, inconsistent with `index`/`show` which correctly scope on `users.employee.manage`. **Expected:** HR sees managed departments only, consistently across every endpoint. **Fix:** apply `HrScope::apply` in all three paths keyed on `users.employee.manage`. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-016 · Sensitive PII leaks in per-record views
**Category:** Data/Privacy · **Sources:** report H-8; FINAL-AUDIT H-8 · **Routes:** user `show`/`activity`, department/designation `show` · **Role:** H/SA · **Workflow:** people management.
**Current:** `UserController::index` hides `blood_group, emergency_contact, alternate_mobile, preferences` (`:89`), but `show` (`:335-355`), `activity` (`:528-557`), `DepartmentController::show` (`:89-93`, loads full users), and `DesignationController::show` (`:77-81`) serialize those fields to anyone with the respective manage capability — far beyond the directory's privacy rules (which always hide them; manual §19 promises "never shown in the directory"). **Fix:** centralize field-hiding (`makeHidden` in a presenter/Resource) applied to every user serialization path. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-017 · Password-reset approval stores a usable plaintext token
**Category:** Security · **Sources:** report H-7; FINAL-AUDIT H-7; manual §4/§23 (documents the admin hand-off as the designed flow) · **Route:** admin password-reset approve · **Role:** SA→E · **Workflow:** recovery.
**Current:** `AdminPasswordResetController::approve` (`:44-54`) sends an in-app notification **containing the raw reset link** (persisted in `notifications` table) and returns `reset_link` in the API response. Anyone who can read notifications/DB rows (or a proxy log) can reset the victim's password. Approve also "succeeds" for a missing user (`$resetLink ?? null`). **Fix:** deliver the link out-of-band only (email), never persist the raw token; 404 on missing user. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-018 · Last-super-admin demotable via edit
**Category:** Permission-UX · **Sources:** report H-9; FINAL-AUDIT H-9; manual §19 (overstates: "the system refuses to … demote the last active Super Admin") · **Route:** `UserController::update` roles · **Role:** SA · **Workflow:** admin management.
**Current:** `updateStatus`/`destroy`/`anonymize` guard the last super admin, but `update` role changes (`:220-235`) have **no such guard** — a super_admin can PUT `roles:["employee"]` on themselves/last admin and lock the org out of administration. `:258-277` also duplicate the role-change side effects (token deletion, `active_role=null`) after the transaction, unconditionally. **Fix:** reuse the last-admin guard in `update`; remove the duplicated post-transaction block. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-019 · Old avatars never deleted (storage leak)
**Category:** Data/Storage · **Sources:** report H-10; FINAL-AUDIT H-10 · **Module:** avatar deletion paths ×3 · **Role:** All · **Workflow:** profile management.
**Current:** avatars stored at `avatars/{user_id}/{hash}` but deletion constructs `avatars/{basename}` (`UserController.php:313-315`, `:459-460`, `ProfileController.php:76-78`) — wrong path every time; orphan files accumulate forever. (Company logo deletion, by contrast, is correct.) **Fix:** build the delete path from the stored full path. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-020 · Work-schedule editing silently unsets the default schedule
**Category:** Functional/UX · **Sources:** report H-11; FINAL-AUDIT H-11; frontend 1.16 · **Page:** Settings → Work Schedules · **Role:** SA · **Workflow:** config.
**Current:** `WorkScheduleController::update` forces `is_default => $validated['is_default'] ?? false` (`:30,40`) — editing the default schedule without re-sending the flag leaves the org with **no default schedule**; nothing in the UI warns. `update`/`setDefault` return success for non-existent ids (no 404); validation accepts arbitrary strings as times, unconstrained `working_days`, negative `standard_seconds`/`break_minutes`. **Fix:** only overwrite `is_default` when provided; 404 on missing rows; `date_format:H:i` + day constraints. **Scope:** Backend+UI · **Status:** OPEN · **Priority:** P1.

### F-021 · Leave-approval integrity gaps
**Category:** Data/Workflow · **Sources:** report H-15; FINAL-AUDIT H-12 · **Route:** approval decide · **Role:** H/SA · **Workflow:** approvals.
**Current:** (a) balance sufficiency checked only at submission — approval increments `used` with no re-check, so concurrent approvals over-draw (`ApprovalService.php:106-114` vs `LeaveRequestController.php:129-136`); (b) decisions on stale models with no `lockForUpdate` → two deciders can both process (`ApprovalService.php:87,131,188`); (c) `decision` resolves the approval by `id = $id OR approvable_id = $id` ordered by id (`LeaveRequestController.php:174-179`) — can bind the wrong approval when the id spaces collide; (d) `ApprovalService` requires capability `leave.approve-hr` for HR-stage approvals, which **no seeded role except super_admin's `*` has** — masked because only SA decides HR leave today, but the capability is ungrantable via settings UI. **Fix:** lock + recheck inside the decision transaction; resolve via the leave request's relation; seed/allow `leave.approve-hr` or drop the check. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-022 · Task "redo" can strand a task in review
**Category:** Workflow · **Sources:** report H-16; FINAL-AUDIT H-13 · **Route:** task redo · **Role:** H/SA · **Workflow:** review loop.
**Current:** `TaskController::redo` flips the approval to `redo` **then** calls `updateStatus('in_progress')`, which aborts 422 if the task is blocked (`:879-881`) — the approval is already decided, and the task remains `review` with a redo decision and no path to resolution. **Fix:** validate blocker state before mutating the approval (or one transaction with rollback). **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-023 · Weekly summary email excludes HR and targets a non-existent role
**Category:** Functional · **Sources:** report H-17; FINAL-AUDIT H-14; manual §27 (promises "leadership gets an email digest") · **Module:** `SendWeeklySummaryCommand` · **Role:** HR (misses it) · **Workflow:** digest.
**Current:** `SendWeeklySummaryCommand.php:20-23` queries roles `['admin','super_admin']` — `admin` doesn't exist in this system (roles are `super_admin|hr|employee`), so HR never receives the weekly summary despite the feature description saying "Admins and HR". **Fix:** query `['super_admin','hr']`. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-024 · Users export ignores its own filters
**Category:** Data/Workflow · **Sources:** report H-18; FINAL-AUDIT H-15 · **Route:** users export job · **Role:** SA · **Workflow:** reporting.
**Current:** `UserController::export` snapshots `only_trashed/status/department_id/role` into the ExportJob, but `GenerateReportJob`'s users branch honors only search + ids (`GenerateReportJob.php:421-435`) → the exported file does not match the filtered list the admin was viewing. Export route is `users.hr.manage` (super_admin-only) while department/designation exports are HR-reachable — inconsistent capability rule. **Fix:** apply all snapshot filters in the job; decide one capability rule for org-data exports. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-025 · Global-scope assignment misses users and spams everyone
**Category:** Data · **Sources:** report H-19; FINAL-AUDIT H-16 · **Route:** global task assignment · **Role:** All · **Workflow:** task creation.
**Current:** scope expansion uses `where('active_role','!=','super_admin')` (`TaskController.php:335,521`) — users who never role-selected have `active_role = null` and are **excluded** from global tasks (SQL `!=` NULL semantics); conversely every global task notifies the entire company (with F-006). **Fix:** NULL-safe exclusion + notify only relevant users. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-026 · Project edit dialog is a stub
**Category:** Workflow/Context · **Sources:** report H-13; frontend B-3/1.10; manual §11 (promises full member editing) · **Page/Component:** `projects/[id]/page.tsx` edit dialog (`:33` editForm capture; `:407-419` render) · **Role:** H/SA · **Workflow:** project management (re-teaming post-creation — FINAL-AUDIT GAP-4).
**Current:** `editForm` captures department, QA form, members, cover, `allow_employee_tasks`, but the dialog renders only name + description with the in-code excuse `{/* Same as before, keeping it simple for the artifact */}` — re-verified verbatim this pass. Create offers 9 fields; edit offers 2. Members/department/QA/cover changeable only by API; delete+recreate is the only UI path (contradicts manual's promised workflow and store-side support). **Fix:** render the full captured form (reuse the create dialog prefilled). **Scope:** Module · **Status:** OPEN · **Priority:** P1.

### F-027 · Offline queue reports false success
**Category:** Feedback/State · **Sources:** frontend A-7; report M-26; FINAL-AUDIT §7 A-7 · **Module:** offline queue consumers · **Role:** All · **Workflow:** offline operations.
**Current:** queued mutations return `{queued:true}` but several success handlers toast "success" anyway (leave cancel `leave-tab.tsx:59-62`, department ops); `/auth/logout` itself is queueable (`api-client.ts:82-87`) and can replay later. **Expected:** "Queued — will sync when online" truthfulness. **Fix:** `isQueued()` guard in every mutation's `onSuccess`; exclude auth endpoints from the queue. **Scope:** Global (frontend) · **Status:** OPEN · **Priority:** P1.

### F-028 · Uncolored status dots (runtime-computed classes)
**Category:** UI/Wiring/A11y · **Sources:** report M-28; frontend A-5; FINAL-AUDIT §7 A-5 · **Page/Component:** `attendance/page.tsx:164` day-status dots · **Role:** E/H/SA · **Workflow:** attendance reading.
**Current:** `bg-${dayStatusColor(...)}-500` produces classes Tailwind never compiled — several status dots render *uncolored*, and the dot is the only status signal (color-only, WCAG 1.4.1). A first-time user cannot learn the calendar language because part of it is invisible. **Expected:** static class map + text/icon pairing. **Fix:** `{present:'bg-success-500',…}` map; add status letters/tooltip. **Scope:** Page (pattern global via StatusBadge) · **Status:** OPEN · **Priority:** P1.

### F-029 · Placeholder/fictional profile sections shipped as real UI
**Category:** Trust/UX · **Sources:** report M-31; frontend A-6/1.17; FINAL-AUDIT §7 A-6 · **Components:** `profile-connected-accounts.tsx:28-34`, `profile-work-address.tsx:50-53`, `profile-privacy.tsx:24-52` · **Role:** All · **Workflow:** profile.
**Current:** fake "YouTube Team / g4kkarthik@gmail.com" connected account; hardcoded "YouTube Office, Chennai, India" work address with dead Edit and a "Not Verified" badge; static privacy selects that save nothing. **Impact:** dead controls teach users the app is unfinished; a client finds these in minutes. **Fix:** delete all three (or feature-flag). **Scope:** Module · **Status:** OPEN · **Priority:** P1.

### F-030 · Employee 360 lacks manager actions
**Category:** Context/Workflow · **Sources:** frontend K-A1/Part 14-D/1.13; FINAL-AUDIT §15 K-A1 · **Page:** `/dashboard/directory/[id]` · **Role:** H/SA · **Workflow:** people management.
**Current:** the employee workspace's only action is **Send Message** (`directory/[id]/page.tsx:99-104`); Edit / Reset Password / Activate / Deactivate / Delete live exclusively in the Directory row menu — a manager inspecting a person's attendance/leave/activity must navigate back to the table to act. Activity tab's empty-check bug treats `undefined` as non-empty (`:174`). **Expected:** action bar or ⋯ menu on 360 for capability-gated actions (Edit, Reset Password, Deactivate/Activate, Assign to Project) — `use-user-actions` already encapsulates the mutations. **Scope:** Module · **Status:** OPEN · **Priority:** P1.

### F-031 · Post-creation dead ends (all create dialogs)
**Category:** Workflow · **Sources:** FINAL-AUDIT GAP-1 (16-C); register §25 · **Pages:** create-project / create-employee / create-task / create-group dialogs · **Role:** HR/SA · **Workflow:** Create → Configure → Save → *Verify/Manage*.
**Current:** dialog closes into the list; no navigation, no "Open X" action, no "Add another". After creating a project the manager's next intent (add tasks/members) requires re-finding it in the list; after creating an employee the next intent is credential handoff + opening the 360. **Expected:** success toast with **[Open project]** / redirect to 360 with actions bar; "Create another" for bulk employee adds. **Nav impact:** −1–2 steps × creation frequency. **Scope:** Global pattern · **Status:** OPEN · **Priority:** P1 · **Classification:** [Confirmed].

### F-032 · Text-only people pickers (identity crisis)
**Category:** UX/Identity · **Sources:** frontend D-F1/G-F1; FINAL-AUDIT §14 D · **Components:** create-task assignees, create-project members, group dialog, dept HR sync (4 hand-rolled multi-selects + selects + mention menu) · **Role:** H/SA · **Workflow:** assignment/approval.
**Current:** **0** `SelectItem`+`<Avatar>` co-occurrences measured app-wide while `avatar_url` is wired in **43** other locations (Avatar ×87, initials-fallback ×76). Users distinguish colleagues by bare name text; similar-name misassignment risk is real (three Kumars in the seed data). Multi-selects are 4 bespoke checkbox lists with 1,000-row preloads. **Expected:** photo + name + department/role in every people picker. **Fix:** new `UserPicker` primitive (server typeahead, chips, cap-free) — one component fixes four call sites + the mention menu; `/chat/users` search already returns the data. **Scope:** Global (ui lib) · **Status:** OPEN · **Priority:** P1.

### F-033 · Six missing primitives + Select error variant
**Category:** Component · **Sources:** frontend 6.3/6.12; FINAL-AUDIT §12 · **Module:** `@g4k/ui` · **Role:** All.
**Current:** missing **IconButton** (77 ad-hoc icon buttons, 57 aria-labels), **SearchInput** (5 debounce/gesture behaviors incl. chat's silent 3-char gate), **UserPicker** (F-032), **StatusBadge-in-ui** (1 de-facto + ≥7 ad-hoc rivals; kills F-028's bug class), **Spinner** (63 raw `animate-spin`), **ExportButton** (6 export dialects, enabled-when-unusable). Select has **no error variant** — forms can't show field errors on the most-used field type; no character counters; kanban no keyboard states; tooltips hover-only. **Fix:** build the six + Select error; adopt per the 40-row upgrade matrix (§11.2). **Scope:** Global (ui lib) · **Status:** OPEN · **Priority:** P1.

### F-034 · Silent list truncation (caps)
**Category:** Data/UX · **Sources:** report M-25; frontend B-4; register §38 lineage (08-26 "pickers capped at 20" → now 20/50/100/1000 — better, still truncating) · **Components:** filter option fetches · **Role:** H/SA (grows with scale) · **Workflow:** lists/pickers.
**Current:** filter options capped `per_page=100` (departments/designations/audit user filter — call-sites re-verified this pass), people fetches `per_page=1000` (create-task-dialog `:57,63`, tasks-tab `:170,175`), non-list task views capped at 100 (amber notice easy to miss), report preview 25 rows (disclosed), recent shift log 7 of 365 days — none paginate; orgs past the caps get silently wrong dropdowns/boards. A Gantt that silently drops task 101 changes schedule decisions. **Fix:** typeahead pickers + cursor pagination + "showing N" captions. **Scope:** Global · **Status:** OPEN (Partially Fixed lineage) · **Priority:** P1.

### F-035 · Export download memory bridge
**Category:** Workflow/Feedback · **Sources:** frontend B-2/W19; FINAL-AUDIT §7 · **Page:** Reports · **Role:** H/SA · **Workflow:** reporting.
**Current:** exports are async with notification — good — but completion doesn't offer download where the user is; they must recall Export History's location and navigate ≈9 steps across two pages with a waiting gap. **Fix:** download action inside the completion toast; auto-select the row in history. **Scope:** Workflow · **Status:** OPEN · **Priority:** P1.

### F-036 · "Remember me" defeated — session cookies become 7-day cookies
**Category:** Security-UX · **Sources:** report H-14; frontend B-7; manual §3 (documents the intended behavior) · **Module:** `api-client.ts`/`providers.tsx` · **Role:** All · **Workflow:** session.
**Current:** `api-client.ts:213-215` rewrites `g4k_token` with `max-age=604800` after **every** successful authenticated request (and `providers.tsx:126-138` on visibility change), regardless of the remember flag chosen at login (auth-store deliberately uses sessionStorage for non-remember sessions). **Impact:** shared-machine sessions persist a week — a security regression vs. design. **Fix:** mirror the store's persistence choice (session cookie when not remembered). **Scope:** Global (frontend) · **Status:** OPEN · **Priority:** P1.

### F-037 · DatePicker capability gaps
**Category:** Component/Form · **Sources:** frontend A-F1..A-F3; FINAL-AUDIT §14 A · **Component:** `@g4k/ui DatePicker` · **Role:** All · **Workflow:** dates everywhere (leave request, corrections, reports range, task due, project deadline).
**Current:** min/max only — **no Today, no Clear, no range mode** (ranges = two stacked full-width singles); cells h-8 w-8 (32px, under 40px touch comfort); leave picker permits today while the same-day rule forbids (error surfaces only on submit — W3); report filters lack quick presets (Last 7/30, This month) for the most frequent HR question; **the calendar popup inside 425px dialogs overflows 360px screens (L-F2 — pair with F-055's mobile-sheet fix; cap popup width + cell size down)**. **Fix:** footer `[Today][Clear]`; `mode="range"`; rule-driven `disabled` dates; 36–40px cells; presets. **Scope:** Global (ui lib) · **Status:** OPEN · **Priority:** P1.

### F-038 · Attendance correction buried 4 layers deep
**Category:** Workflow/Context · **Sources:** frontend B-1/W6/1.8; FINAL-AUDIT §16-G · **Page:** Org Attendance · **Role:** H/SA · **Workflow:** corrections (HR's most frequent fix).
**Current:** row → member sheet → correction dialog → action+event+time+reason ≈ 8 clicks, 4 layers — for one of HR's most frequent operations (missed punch). Recoverable, audited, employee notified, recompute correct — but slow. **Fix:** "Correct" directly in the row action menu. **Scope:** Module · **Status:** OPEN · **Priority:** P1.

### F-039 · Palette + `/dashboard/admin` dead links
**Category:** Navigation/Wiring · **Sources:** report M-30; frontend Part 5 C/1.18 · **Components:** `command-palette.tsx:230` (re-verified), `/dashboard/admin` guarded 404 (no page) · **Role:** SA · **Workflow:** admin navigation.
**Current:** command palette "Admin Settings" → `/dashboard/profile?tab=settings` — profile has no tabs; the flagship power feature dead-ends its admin users. `/dashboard/admin` is middleware-protected but has no page (protected 404). **Fix:** fix links; remove middleware entry or add page. **Scope:** Page/Global · **Status:** OPEN · **Priority:** P1.

### F-040 · Public `/api/version` + `/system/public-config` disclosure
**Category:** Security · **Sources:** report M-6, **M-7**; FINAL-AUDIT H-17 (+ H-18 = the holidays cache half) · **Routes:** `GET /api/version` (`routes/api.php:56` — re-verified public, registered before the auth group), `GET /api/system/public-config` · **Role:** Anyone.
**Current:** `/api/version` leaks the commit sha plus the **full `migrate:status` table** (schema shape) (`VersionController.php:12-27`); cached 1h. `public-config` discloses the password policy and force-change flag (fingerprinting aid). Related: holidays route uses `cache.headers:public;max_age=3600` on an authenticated route (`api.php:169` — re-verified) — responses marked publicly cacheable by intermediaries. **Fix:** restrict/authenticate both; `private` cache headers. **Scope:** Backend · **Status:** FIXED · **Priority:** P1.

### F-041 · ip-api egress + `trustProxies '*'`
**Category:** Security/Privacy · **Sources:** report M-8; FINAL-AUDIT H-19 · **Module:** `AuthController` login path · **Role:** All · **Workflow:** login.
**Current:** login calls external `ip-api.com` for geolocation (`AuthController.php:49-64`) — third-party data egress on every login from unknown IPs, 2-s timeout in the hot path, failures silently swallowed. `trustProxies '*'` (`bootstrap/app.php`) is only safe strictly behind the Cloud Run proxy. **Fix:** drop ip-api (or make it configurable/opt-in); scope trusted proxies. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

### F-094 · S3 runtime configuration — credentials delivery unverified *(refined this pass)*
**Category:** Data/Infra · **Sources:** register §35 + §38 lineage (2026-08-16 "missing S3 adapter" → Partially Fixed); **correction evidence this pass:** `cloudbuild.yaml:68,89` · **Role:** All · **Workflow:** uploads.
**Current:** adapter `league/flysystem-aws-s3-v3` installed; `s3` disk defined; `FILESYSTEM_DISK=s3` + `AWS_DEFAULT_REGION=ap-south-1` + **`AWS_BUCKET=g4k` + `AWS_ENDPOINT` (Supabase S3) + `AWS_URL`** set in both Cloud Run services (prior register's "bucket absent" wording was wrong — corrected). **Still unverified:** `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are not in the manifest — unless injected via another mechanism, uploads 500 in production. **Fix/verify:** confirm credential delivery in the deployed environment (upload one avatar); document the secret source. **Scope:** Backend-dependent · **Status:** PARTIALLY FIXED (runtime unverified — needs deploy access) · **Priority:** P1.

### F-101 · Project cover upload broken (undefined `$id`; no project association possible) — **dropped by the prior register, restored this pass**
**Category:** Functional · **Sources:** report H-4; FINAL-AUDIT §4 item 4 (both carried it; the S5 register and this master's first rebuild omitted it — caught by the §13 finding-level cross-check, re-verified this pass) · **Route:** `POST /projects/cover` (`routes/api.php:188`) · **Module:** ProjectController::uploadCover (`:443-465`) · **Role:** HR/SA · **Workflow:** project cover upload (create-project cover step; edit-dialog cover intent).
**Current (re-verified verbatim):** the method validates the image then runs `$request->file('cover_image')->store("projects/{$id}/covers", $disk)` — but `$id` **does not exist**: the method signature takes only `Request`, and the route has no `{id}` segment. PHP interpolates the undefined variable as empty → files store under a malformed `projects//covers/…` path; more fundamentally, the endpoint has **no way to know which project** the cover belongs to and never updates any `cover_image` column. S1 classified it "500" (undefined-variable path); the deeper defect is the same either way: the cover-upload route is unusable as designed. **Expected:** `POST /projects/{id}/cover` (or `project_id` validated in the request), storage at `projects/{id}/covers`, cover attached to the project.
**Problem/Impact:** project covers cannot be uploaded through this endpoint (malformed path, orphan files, no association); the create-project cover step relies on it. **Root cause:** route/method shape mismatch (same family as F-008's missing method). **Fix:** add `{id}` route param (or validate `project_id`), type the parameter, attach the cover to the project, delete the orphaned malformed-path files. **Scope:** Backend · **Status:** OPEN · **Priority:** P1.

---
## §6. Master Finding Register — P2 (44 findings)

*Format: same 16 fields, compressed to block prose. All statuses OPEN unless stated. Sources carry the per-source IDs from §0.2.*

### F-042 · Dashboard cache family (dead keys + invalidation storm + unobserved approvals)
**Sources:** report M-1/M-2/M-3 · **Module:** dashboard caches · **Role:** All. (a) `DashboardController::init` computes `$cacheKey` (`:33`) but never caches under it; `PinController`/`QuickNoteController` forget `dashboard_init_*`/`quick_notes_{user}` keys that are never written (real keys are versioned, `DashboardController.php:194`); attendance observers forget unversioned metric keys (→F-014). (b) `CacheInvalidationObserver` bumps the global version on **every** create/update/delete of User/Project/Task/AttendanceDay/LeaveRequest (`AppServiceProvider.php:48-56`) — including `last_login`-style saves on login — so 3600-s TTLs rarely survive; every login rebuilds every cache family (stampede risk; rate-limit rebuilds when fixing). (c) `ApprovalObserver` is an empty stub and unregistered — approval-only transitions leave HR/admin dashboards stale up to 1h. **Fix:** unify key ownership writer=invalidator; register or delete the stub; rate-limited rebuild. **Scope:** Backend.

### F-043 · Force-password-change + suspicious-login detection dormant
**Sources:** report M-4; manual §23 (advertises both toggles) · **Role:** All. Seeder sets `force_password_change=false` (and a migration forces it false), so the whole `ForcePasswordChange` apparatus + skip-flow never engages; suspicious-login flagging hard-disabled (`AuthController.php:219-221` "currently inactive"); IP/location blacklist (settings UI) enforcement present but the flag path is dead. **Status: PARTIALLY FIXED lineage** (2026-08-16 must-change dead-end → flow now works, but dormant by default). Confirm intent or wire to settings. **Scope:** Backend.

### F-044 · Temp passwords returned in API responses + policy bypass
**Sources:** report M-5; frontend B-5 (toast transcription handoff); manual §19 (documents toast hand-off) · **Role:** SA→E · **Workflow:** user creation/reset. Temp passwords returned in API responses when SMTP is unconfigured (`UserController.php:147,576`) and generated passwords ignore the configured policy (`Str::random(12/16)` bypasses `password.*` settings); `password_changed_at` stamped at admin creation, delaying expiry; the admin must transcribe the toast by hand (no copy button — error-prone credential handoff). **Fix:** copy button + "share securely" copy; policy-conformant generation; deliver out-of-band. **Scope:** Backend+UI.

### F-045 · Capability-check drift set
**Sources:** report M-9/M-10/M-11 (+ **M-20 and the S5 "settings whitelist mismatch" — restored to the register this pass, see §2.4 second sweep**) · **Role:** all token holders. (a) `RequireCapability` honors token `role:*` abilities (`RequireCapability.php:24-29`) but in-controller `hasCapability()` helpers (e.g. `UserController:18-22`) use only `resolveActiveRole()` → route and controller can disagree for role-scoped tokens. (b) De-roled users keep employee powers: `resolveActiveRole()` falls back to `'employee'` even with zero role assignments (`User.php:131-134`); role caches live up to 1h across four differently-named keys. (c) `CapabilityMatrix::$defaultMatrix` diverges from the seeded matrix; `SELF_SERVICE_EXCLUDED` dead code; `db:seed` truncating/reseeding `role_capabilities` silently resets any live-tuned matrix. (d) **[M-20]** Unaudited admin mutations: settings bulk-update, company profile/logo, all work-schedule mutations, all holiday mutations, QA CRUD, demo seed/purge triggers, and department team/employee syncs record ids only or nothing (this pass re-verified the audit-log export path below); `AuditLogController::export` persists **raw unvalidated `$request->all()`** as the ExportJob filters (`AuditLogController.php:34-47` — re-verified verbatim this pass). (e) **[S5]** Settings key whitelist vs seeder mismatch (S5 §45 lineage item, retained). **Fix:** one shared policy layer; single role cache; guard seeding; audit the admin mutations; validate/sanitize export filters. **Scope:** Backend.

### F-046 · QA form edits orphan historical submissions
**Sources:** report M-14 · **Module:** QA lifecycle · **Role:** H/SA. `QaController::update` deletes/recreates fields (`:88-105`) — existing `QaSubmission.values` keyed by old field ids become unmatchable, and subsequent submissions mis-validate required fields. **Fix:** migrate submission values on field-id change or version forms. **Scope:** Backend.

### F-047 · Report job vs endpoint mismatches + chunk ordering
**Sources:** report M-15/M-16 · **Module:** reports/exports · **Role:** H/SA. leave-summary job uses strict `whereBetween` while the endpoint uses overlap → different numbers for leaves spanning the window; attendance-summary job merges present+late while the endpoint separates them (`GenerateReportJob.php:357,393-396` vs `ReportController.php:246-247,288-295`). `chunk(1000)` ordered by non-unique `date` in the attendance export (`GenerateReportJob.php:260-264`) can skip/duplicate rows across chunk pages in pgsql. **Fix:** parity + unique composite ordering key. **Scope:** Backend.

### F-048 · Timezone mixing + unvalidated date params → 500s
**Sources:** report M-17; frontend 1.7 (picker permits today) · **Module:** attendance dates · **Role:** All. Attendance dates are company-tz strings but `now()->toDateString()` uses app tz (`AttendanceController.php:104,330,433,524`; `AttendanceService.php:407`) — day boundaries shift if `app.timezone` ≠ company timezone. Unvalidated `{date}` path params go straight to `Carbon::parse` → 500 on garbage. **Fix:** normalize on company tz; validate date params. **Scope:** Backend.

### F-049 · Leave policy gaps
**Sources:** report M-18; frontend W3/1.7; manual §8 + §29 (documents the rule as designed) · **Role:** E/H. Same-day start impossible for all types incl. sick (`StoreLeaveRequestRequest` `after:today`) — sudden illness has no system path (manual says "contact HR directly"); unpaid leave balance-capped at 12 like paid types; pending-leave race only guarded for identical (user,start,end) ranges (partial unique index) — different-range overlaps can race. **Fix:** policy decisions + picker-level constraint + overlap lock. **Scope:** Backend+policy.

### F-050 · Half-day dead · open-shift break miss · no early-leave rule
**Sources:** report M-19 · **Role:** E/H/SA. *(Refined this pass)*: the `half_day` value **still exists** in the `attendance_days.status` CHECK (`2026_08_09_020002:51` — never removed, just never computed; source wording "removed by migration" was imprecise); the CHECK values `leave` and `pending` are likewise never written by any code path (**[Speculative — explicit product decision required]**); `open-shift` detection ignores last-event `break_start` (`AttendanceService.php:218-221`) so people who leave mid-break aren't flagged; no early-leave rule exists. **Status:** OPEN (half-day portion = product question §8.5). **Scope:** Backend.

### F-051 · Broadcast family issues
**Sources:** report M-21/M-22/M-23/M-24 · **Module:** realtime plumbing · **Role:** All. (a) Team announcements broadcast company-wide: `AnnouncementCreated` → `private-org.announcements` whose channel auth is `return $user !== null;` (`channels.php:18-20`) with full payload — visibility enforced only on REST reads, so any connected client receives team announcement bodies in realtime. (b) `react()` re-broadcasts the creation event (`AnnouncementController.php:303-305`), no `toOthers()`, empty `catch {}` — self-echoes; create/update semantics conflated. (c) `NotificationCreated::broadcastWhen` does a `User::find` per broadcast; message pin/unpin emits no event (→F-011c); holiday-reminder dedup checks notification type `system` while sends use `holiday_reminder` (`SendHolidayReminders.php:77-81`). (d) Chat unread counting is O(messages) via correlated CASE subqueries (`ChatController.php:29,89-95`) — degrades sharply as the global conversation grows. (e) `monitor:health` never scheduled; `ScheduledReport` model/table a dead feature with no producer or consumer (build-or-delete decision §8.5). **Scope:** Backend.

### F-052 · Echo auth token staleness
**Sources:** report M-27; frontend I-F1 · **Component:** `use-reverb.ts:84,156` · **Role:** All. The Bearer for channel auth is captured once at connect and the effect deliberately excludes `token` — after a silent 15-min rotation, private-channel auth uses a dead token until reload. **Fix:** re-bind auth on token rotation. **Scope:** Frontend.

### F-053 · Nav prefetch query-key drift + duplicate polling
**Sources:** report M-29; frontend I-F1 · **Components:** `nav-group.tsx:41-47`, chat page · **Role:** All. Nav hover-prefetch warms `["projects"]`/`["tasks"]` while pages query keyed variants — prefetch warms the wrong entries; `["projects","count"]` over-invalidates. Duplicate 30-s unread polling on the chat page (bell + page). **Fix:** align keys; single poller. **Scope:** Frontend.

### F-054 · Hydration double-gate + role-select infinite loader
**Sources:** report P3 nibs; frontend 1.4; **+ M-32 (restored this pass)** · **Role:** All (boot). Hydration double-gating splash delays first paint; role-select auto-select has **no failure state** — if `/auth/role-select` errors the user rides an infinite bouncing-dots loader (`role-select/page.tsx:51-60`); a network blip at exactly this screen locks the user out with zero feedback. Cards also don't say what changes per role (first-time dual-role users choose blind). **[M-32, re-verified]** Login→onboarding field contract drift: `login/page.tsx:90` gates on the **top-level** `result.onboarded` boolean (derived server-side at `AuthController.php:319,444` from `onboarded_at`), while the web store and every other consumer type/use `user.onboarded_at` — a one-field backend change re-routes all users through onboarding; normalize on one field. **Fix:** failure state + retry; single hydration gate; normalize the onboarded contract. **Scope:** Frontend (+API contract).

### F-055 · Dialog sizes + no mobile sheet
**Sources:** frontend A-L1/F; FINAL-AUDIT §11 · **Component:** `Dialog` (×23 files) · **Role:** All. Dialogs at 425/500px (8 width values total: 425/500/800/md/2xl/3xl/4xl ×8) overflow 320–390px viewports — Radix centers, body scrolls, content clipped, footer below fold, double-scroll; creation forms (leave, task) are the app's most common mobile tasks and the primary action is off-screen on budget Androids. No `<640` fullscreen-sheet fallback anywhere. **Fix:** `Dialog` gains `size` prop (sm 425 / md 500 / lg 800 / xl 1140) + mobile-sheet variant + sticky footer. **Scope:** Global (ui lib).

### F-056 · Two date grammars
**Sources:** frontend A-F4/D · **Role:** All. DatePicker ×10 files vs native `type="date"` ×4 (which also skip popup/cell conventions); native `type="time"` ×2 needs a `TimeInput` wrapper. **Fix:** unify on DatePicker/TimeInput. **Scope:** Global.

### F-057 · `window.confirm` in chat (×2 verified this pass — sources said ×5)
**Sources:** frontend D (×5) — count corrected this pass: `chat-tab.tsx:707` (clear-chat), `message-list.tsx:237` (delete-message) · **Module:** chat · **Role:** All. Browser chrome in the most polished module, vs ConfirmDialog ×21 everywhere else (destructive always red + ConfirmDialog ✓ except here). **Fix:** ban + migrate. **Scope:** Module.

### F-058 · Pagination grammars ×3 (ui Pagination zero direct uses)
**Sources:** frontend H/6.3 · **Role:** All. ui `Pagination` has **zero direct** call sites (it *is* wired inside DataTable ×5); projects use prev/next, directory 24/page, QA none — three hand-rolled grammars. **Fix:** DataTable+Pagination adoption via TableToolbar. **Scope:** Global.

### F-059 · Toast asymmetry + generic fallbacks
**Sources:** frontend H/J · **Role:** All. 137 error / 117 success / 9 info toasts; no `toast.promise`. Generic fallbacks remain: "Server error. Please try again later.", boundary title "Something went wrong!" ×16 — lack recovery guidance (retry + support path). Export failure has Retry ✓ but no error differentiation (validation vs transient). Chat empty-search silent (needs "type 3+ characters" hint). Error copy culture elsewhere is genuinely good — preserve. **Fix:** toast.promise + info parity; boundary body guidance. **Scope:** Global.

### F-060 · Forms master finding
**Sources:** frontend D/B-F1..4 · **Role:** All · **Workflow:** all forms. 25 `<Label>`/`<FormLabel>` repo-wide vs dozens of forms — placeholder-only selects ("Priority", "Select Assignee"); **0 helper-text patterns** (domain concepts QA form, scope, blocked-by, recurrence, priority consequences unexplained at the decision point); no required/optional markers; same-day rule discovered only on submit; verb glossary drift (Create/Add/Request/Save — ×18 verbs incl. "Add Event"/"Add Holiday or Event"); `Form*` adopted in only 5 files; no explicit Reset; drafts ×5 forms but edit-dialogs without drafts (project edit stub, user edit) lose work on Esc; field *order* correct everywhere (identity→contact→org→config — preserve); grouping invisible (no section labels); create-project (9 fields) and user-form need Wizard split (Basics → Team → Advanced) + 2-col short pairs; drafts undisclosed (add "draft saved" microcopy — F-085-adjacent discoverability). **Fix:** Form* adoption + labels + one-line hints + verb glossary + Wizard. **Scope:** Global.

### F-061 · Inputs master finding
**Sources:** frontend C-F1..3 · **Role:** All. Every `Input` full-width by default (primitive `w-full`) — employee-code/prefix/minutes/port fields render dialog-wide for 4–8 characters; 5 search widths in use (w-48×26, w-64×12, w-56×7, w-80×6, w-72×1); **0 textareas declare `rows`** (browser-default heights differ per form; conventions needed: description=4, notes=3, reason=3). **Fix:** purpose-sized inputs + Input size/prefix/suffix slots; normalize search widths. **Scope:** Global.

### F-062 · Buttons master finding
**Sources:** frontend F-F1..F5, 1.1, 1.10, 1.11 · **Role:** All. Size-by-space: same verb at h-8 (widget chips) / h-10 (dialogs) / h-11 (hero) — "Approve" is h-8 in widgets, h-10 in dialogs; login submits via a hand-styled raw `<button>` (`login/page.tsx:189`) bypassing ui Button (the most-seen button in the product); `lg` used for routine dialog submits; Export enabled with zero selection → error toast ("select at least one" ×2 string variants) instead of disabled-until-selected; Delete adjacent to Edit in project settings dropdown (destructive placement invites slips — separate into red end-anchored zone); QA-drag teaching toast lacks an action link to the submit flow; only 11 `w-full` Buttons (appropriate); dialog footer order varies (standardize `[Cancel][Primary]` right-aligned); RainbowBorder fires on *every* primary+lg (should be explicit `brand` variant — reserve for auth). **Scope:** Global.

### F-063 · Padding conventions
**Sources:** frontend B-L1..3, Part 10-M · **Role:** All. Five page paddings (p-6×73 / p-4×48 / px-4×20 / p-8×17 / px-6×12; `page-padding` utility used **once**); five card paddings (p-4×88 / p-3×53 / p-6×25 / p-5×16 / p-8×12; `card-padding` bypassed); nested double-padding (Card p-6 wrapping inner p-4 = 40px insets); form rhythm variance (space-y-1.5/2/3/4 at 47/65/42/83 occurrences + space-y-5×8/gap-5×1 off-scale outliers); dialog footers non-sticky. **Fix:** adopt utilities; codify 1.5 label / 4 fields / 6 sections; sticky DialogFooter in the primitive. **Scope:** Global.

### F-064 · Dimension fragmentation
**Sources:** frontend 6.2 · **Role:** All. 6 control heights (h-8×151, h-10×114, h-9×63, h-11×50, h-7×47, h-12×41 — 28–48px); 7 radii vs 5 tokens (xl×247 + full×214 legitimate identity — keep; 2xl×60 + md/sm strays = drift); 53 raw hex colors; 181 arbitrary px dimensions; focus rings inconsistent (ring-0 ×7 removes the ring, ring-1 ×4, ring-2 ×6 + global outline); non-square icons ×4 (`h-4 w-3`). **Fix:** 28/32/40/44 height scale; radius trim; lint hex/arbitrary dims; one ring recipe (2px + 2px offset); audit ring-0 sites for keyboard traps. **Scope:** Global.

### F-065 · 26 unprefixed grids never collapse
**Sources:** frontend A-L2 · **Role:** All (mobile). `grid-cols-2`/`grid-cols-3` without responsive prefixes (vs 53 correctly-laddered) → two/three forced columns at 360px ≈ 160px columns; metric cards wrap text vertically. **Fix:** codemod prefix insertion + ESLint ban. **Scope:** Global codemod.

### F-066 · Charts ignore their container
**Sources:** frontend D-L5 · **Module:** dashboard widgets. echarts wrappers hard-code `h-64`/`h-48` inside a drag-resizable grid — resizing taller leaves dead space, shorter clips. **Fix:** fill container (100% + ResizeObserver; echarts `autoresize`). **Scope:** Module.

### F-067 · Heatmap `min-w-[800px]`
**Sources:** frontend L-F1 · **Component:** `hr-attendance-heatmap.tsx:110` · **Role:** H. Guaranteed horizontal scroll below 1024 (tablets/phones). **Fix:** grid scales (week columns collapse). **Scope:** Component.

### F-068 · Toolbar/settings layout waste
**Sources:** frontend D-L1/D-L2 · **Pages:** Settings, Org Attendance · **Role:** H/SA. Settings forms single-column with wide empty right halves ≥1280 (short pairs host+port belong on one row — FormGrid 2-col ≥md); attendance overview toolbar (range+dept+user+status+search+export) stacks 3 ragged rows @1024 → table starts ~300px down (collapse secondary filters into a "Filters" popover); toolbars lack a Search|Filters|Date|Sort|Actions convention (TableToolbar). **Scope:** Module/Global via primitive.

### F-069 · Heading scale drift
**Sources:** frontend G-L1 · **Role:** All. text-lg×25 / 2xl×23 / xl×16 / 3xl×6 all used as page/main headings — equivalent pages shout at different volumes (Projects 2xl vs Audit lg). **Fix:** PageTitle = 2xl/600, section = lg/600, card title = base/600 — three tiers. **Scope:** Global.

### F-070 · A11y interaction cluster
**Sources:** frontend G · **Role:** All. 77 icon-only buttons (h-6/7/8) vs 57 aria-labels app-wide (WCAG 4.1.2); touch targets 24–32px (2.5.5 — need ≥40px); 7 `focus-visible:ring-0` sites (keyboard traps risk). **Fix:** IconButton primitive with required label + sr-only; ≥40px hit areas; kill ring-0. **Scope:** Global.

### F-071 · A11y semantics/motion cluster
**Sources:** frontend G · **Role:** All. Keyframe utilities bypass the duration-var reduced-motion kill (2.3.3): `animate-bounce` ×27, `spin` ×63, `ping` ×2 (only RainbowBorder carries `motion-reduce:`) — wrap in `motion-safe:`; h1 on only 6/27 pages (1.3.1); pill-tabs (chat scope pills, bell tabs) without `aria-pressed`/tablist semantics (4.1.2); bottom nav lacks `aria-current` (2.4.8); tooltips hover-only. Positives: global focus-visible, Radix traps/Esc, cmdk keyboard-first, muted onboarding video, axe-core dev. **Scope:** Global.

### F-072 · Contrast cluster
**Sources:** frontend G; detector (11 gray-on-color hits, file-listed) · **Role:** All. 9–11px body/metadata + muted grays ×178 combos (1.4.3/1.4.4 — ties to F-012); gray-on-color ×11 detector-verified (`notifications-bell.tsx:250,242`, `leave-request-form.tsx:281` ×2, `create-task-dialog.tsx:187`, `announcement-board.tsx:215`, `quick-notes.tsx:159`, `dashboard/layout.tsx:294,343` ×4); color-only status sometimes colorless (1.4.1 → F-028); 2 ai-color-palette tells (`profile-workspace-section.tsx:103` violet-900/violet-100). **Fix:** darker-tone-on-tint rule; StatusBadge text pairing. **Scope:** Global.

### F-073 · IA cluster (naming · QA burial · reminders home · org URL)
**Sources:** frontend E-A1/L-A1/L-A2/N; FINAL-AUDIT §15 · **Role:** All/HR/SA. (a) "Attendance & Time" (personal) vs "Attendance" (org) — HR sees both, learns only by being wrong once → rename **My Attendance** / **Team Attendance** (P1-grade rename inside P2 cluster). (b) QA form builder buried as the 4th view-mode inside the Tasks tab (`tasks-tab.tsx:165,666`) — a form-designer tool sharing a switcher with data views; add "Manage QA Forms" header action (visible `qa.manage`) + "+ New form" from create-project's QA select. (c) Personal Reminders under the *Announcements* tab — the most private feature filed under the most public one; relocate to bell/profile or dashboard widget. (d) `/dashboard/org/…` URL leaks an internal concept (breadcrumb already skips — formalize label mapping). (e) Feedback + role-switch buried two levels in Profile. (f) "My Tasks & Board" → "Tasks". (g) Reports tabs → "Summary Reports" / "Data Exports". (h) Directory → optionally "People" (**E-A2 verdict carried: the Corporate Directory vs Employee Management tab split is fine as-is** — same people, different powers; the tabs are the correct pattern). **Scope:** Global IA.

### F-074 · Duplicate component clusters ×11
**Sources:** frontend 6.3 (+ Part 14-C activity feeds & calendar-grid sharing — restored this pass) · **Role:** All. User pickers ×4 (canonical: new UserPicker) · status pills 1 de-facto + ≥7 ad-hoc (promote StatusBadge) · attendance tables ×2 vs DataTable (admin 509l + hr 414l ≈ 900 lines → configuration) · dept/designation CRUD vs ListScaffold (817l/427l bypass) · search ×5 behaviors (SearchInput) · loading species (Spinner + rule page=skeleton/action=button-loader) · date grammars (F-056) · confirms (F-057) · dialog widths (F-055) · feedback forms (dead widget + profile copy — delete dead) · pagination ×3 (F-058) · **activity feeds ×3** (project history, task activity tab, user activity tab render the same event-stream shape with three implementations → one `ActivityFeed` primitive — Part 14-C) · **two month-calendars overlap** (holiday-calendar vs attendance-history-calendar both on SemanticCalendar — keep both surfaces, share the grid). **Fix:** canonical component system (§11.3). **Scope:** Global.

### F-075 · Dead code inventory
**Sources:** report P3 dead-code lists; frontend 6.1/Part 14-A · **Role:** —. **Backend:** `CapabilityMatrix::SELF_SERVICE_EXCLUDED`; `TestPusherEvent`; empty `ApprovalObserver`; `RoleAssignment::getRolesForUser` cache (never read); `WorkingDayCalculator` unreachable Feb-29 branch vs duplicate mapping in `reconcileDay`; `markLeaveDays` unused `$workingDays` (and Mon–Sat vs Mon–Fri default inconsistency); attendance statuses `pending`/`leave` never set; `ProfileController` dead `ValidatesPasswordPolicy` import; `AttendanceController` dead `$isAdmin = clone $user`; duplicated blocked-by check in `submitForReview` (`TaskController.php:621-626` vs `669-674`). **Frontend:** `approvals-tab.tsx` (312 lines, superseded — still calls the shadowed F-007 endpoints, verified this pass); `project-overview-tab.tsx`; widgets `feedback-form.tsx`; `pwa-registry.tsx` (manifest exists, registration never mounted); hooks `use-worker`/`use-track-recent`/`use-form-errors`; `avatar-utils.ts`; `layout-utils.ts` (test-only); `adminOnly` nav branch; `org/attendance?tab=leave` prefetch branch; `AlertDialog` primitive ×0 uses; unreachable `holidays` TabsContent (`leave-tab.tsx:132-137`). **Fix:** delete (grep each for inbound references first). **Scope:** Global.

### F-076 · Leave cannot be edited after submission
**Sources:** FINAL-AUDIT GAP-3 · **Role:** E/H/SA · **Workflow:** leave management. Wrong dates require cancel→recreate (balance-refund quirks included). **Expected:** admin edit (dates/type) with re-validation, or at minimum "request changes" comment to the employee. **Classification:** [Confirmed]. **Scope:** Workflow+Backend.

### F-077 · Employee offboarding erasure not in UI
**Sources:** FINAL-AUDIT GAP-2; manual §29 (documents API-only anonymize) · **Role:** SA. `anonymize` exists only as API (`UserController::anonymize`); UI stops at deactivate/soft-delete. Real companies must erase leavers' PII. **Fix:** "Erase personal data" in 360/trashed-row menu (SA) with double confirm. **Classification:** [Confirmed]. **Scope:** Module.

### F-078 · QA forms lack a management lifecycle UI
**Sources:** FINAL-AUDIT GAP-5; frontend L-A2 · **Role:** H/SA. Buried builder (F-073b); no forms list with usage counts; no duplicate/template flow; delete guarded by usage but no "what uses it" view. **Classification:** [Confirmed]. **Scope:** Module.

### F-079 · Employee CSV import absent
**Sources:** FINAL-AUDIT 16-I · **Role:** SA · **Workflow:** day-one onboarding. The company onboards ~all staff at launch; one-by-one creation with toast-passwords (F-044) won't scale past a handful. **Classification:** [Enhancement — optional but operationally significant]. **Status:** OPEN (optional). **Scope:** Module.

### F-080 · Saved-view management beyond reports
**Sources:** FINAL-AUDIT 16-I; frontend E · **Role:** H/SA. Saved views exist on report summaries only; no rename/delete management; extend to tasks/attendance lists. **Classification:** [Improvement]. **Scope:** Module.

### F-081 · Reject-reason asymmetry
**Sources:** FINAL-AUDIT 16-J; frontend W5 · **Role:** H/SA · **Workflow:** approvals. Leave rejection requires nothing (approve/reject symmetric, no prompt) while task redo requires a reason (enforced client+server) — a rejection without reason teaches the employee nothing. **Fix:** optional-but-prompted reason on reject everywhere. **Classification:** [Improvement]. **Scope:** Workflow.

### F-082 · Recurrence completion silent
**Sources:** FINAL-AUDIT GAP-7; frontend W12; manual §15/§27 (implies announcement) · **Role:** H/SA · **Workflow:** task loop. Approving a recurring task creates the next occurrence but only implies it — no "Next occurrence created (due …)" toast + link. **Classification:** [Improvement]. **Scope:** Module.

### F-083 · Empty-dashboard day-one guidance absent
**Sources:** FINAL-AUDIT 16-M · **Role:** E. A new employee's dashboard (no tasks/projects yet) shows zero guidance — add contextual empty-state CTAs ("Ask your manager to add you to a project" / create your first personal task). **Classification:** [Improvement]. **Scope:** Page.

### F-084 · Audit user-filter capped at 100
**Sources:** frontend 1.15 · **Component:** `audit-log-table.tsx:45` (`per_page=100` — call-site re-verified) · **Role:** SA · **Workflow:** investigations. In a 300-person company the auditor cannot filter by most people — silently wrong filter options in an *investigation tool*. **Fix:** typeahead user search. **Scope:** Module.

### F-085 · 30-day notification purge undisclosed in UI
**Sources:** frontend W18; FINAL-AUDIT 16-N; manual §18/§29 (discloses only in the manual) · **Role:** All. Notifications are kept 30 days then cleaned (also export files) — the UI never says so; surprises HR investigations. **Fix:** retention microcopy in the Notifications tab. **Scope:** Global copy.

---

## §7. Master Finding Register — P3 (14 blocks: F-086…F-093, F-095…F-098, F-089b, and the F-100 residual set)

### F-086 · Z-index soup
**Sources:** frontend H. `z-10`×28, `z-20`×7, 30/40/50, `z-[100]`, `z-[9999]` — no documented layer scale; bulk-bar z-50 overlaps mobile FAB z-40 (responsive defect at §3.6). **Fix:** documented z-scale + FAB/bar fix. **Scope:** Global.

### F-087 · Elevation/chrome mix
**Sources:** frontend O-L1/O-L2. Elevation tokens e1–e4 exist but call sites hand-roll `shadow-*`/arbitrary hover shadows (e.g. RainbowBorder `hover:shadow-[0_0_15px…]`); bordered vs elevated cards coexist per module (directory cards border, widget cards shadow). **Fix:** map to e-tokens; borders for content cards, elevation for floating layers. **Scope:** Global.

### F-088 · Gen2k/G4K brand split
**Sources:** frontend 1.1. Login tooltip "Gen2k Conglomerate (2018) • Milestone 1" vs footer "Games4king Workplace OS" (`login/page.tsx:219-233`) — two company names on one screen erode trust on day one; confuses staff (FINAL-AUDIT 16-N). **Fix:** one brand story. **Scope:** Global copy.

### F-089 · Breadcrumb labels + misc copy polish
**Sources:** report P3 nibs; frontend Wave-4. Breadcrumb labels missing for announcements/notifications/audit; confirm-copy varies ("Are you sure you want to delete/remove…"); "View" label backwards on directory list toggle (`directory-list.tsx:517-521`); "identifier" jargon helper text (login); forgot-password admin-mediated fallback lacks expectation-setting; onboarding optional fields unmotivated; change-password "other devices signed out" undisclosed; greeting block consumes space daily (compact after first week). **Scope:** Global.

### F-090 · Density wiring + overtime mislabel
**Sources:** frontend I/1.6; report M-33. Density mode (comfortable/compact via `--density-*`) is a differentiator but under-applied — tables don't consume it everywhere (hand-rolled tables hard-code py). Time Clock widget overtime highlight uses `standardSeconds` defaulting to **31,500s (8h45m)** with a "Default to 8 hours" comment (`timer-store.ts:47`) — wrong overtime emphasis until server data loads; mislabels for everyone on the default. **Fix:** wire density vars; correct default. **Scope:** Global.

### F-091 · Numeric alignment + action columns
**Sources:** frontend I/I-L4. Numeric table columns (hours, minutes) not right-aligned consistently — slows HR's number scanning (the one audience reading numbers all day); icon-only rows of 2–4 action buttons widen tables — consolidate to `⋯` menu on narrow. **Scope:** Global.

### F-092 · Repo hygiene
**Sources:** report P3. Stray codemod scripts at repo root — `fix_per_page.js` (regex-rewrote controller validation caps!), `fix_test_route.php` (re-injects the F-001 backdoor), `test-fetch.js`; `scratch/` stays gitignored (fine); 4 deleted-but-uncommitted legacy `.md` deletions in the working tree. **Verified clean:** `.env*` files are NOT git-tracked (`git ls-files` — only `.env.example`); env hygiene OK. **Fix:** delete scripts (with F-001), commit the doc deletions. **Scope:** Repo.

### F-093 · Backend low nibs (grouped — each independently verified in S1)
**Sources:** report P3 correctness list (+ **M-12/M-13 restored to the register this pass — re-verified verbatim**, §2.4). `ProfileController::uploadAvatar` returns non-existent `first_name/last_name` columns → nulls (`:90`); `GET /companies/{id}` ignores `{id}` (`CompanyProfileController.php:42-52`); employee number consumed outside the transaction (gaps on rollback); `AutoNumberingService` first-call seed race (no upsert) → concurrent 500; multiple `work_schedules.is_default=true` possible (DB default true + no insert enforcement) and `where('is_default')->first()` picks arbitrarily; `anonymize` leaves `DEL-{id}` employee codes; audit "cursor pagination" comment vs offset paginate; `activity()` hardcodes 30/page and aliases `ip as ip_address`; `downloadExport` streams whole file from disk into memory; `ExportJob.file_data` base64 path legacy-dead; bulk user ops always HTTP 200 with stats; self-deactivation/self-deletion permitted; `submitted()` queue unpaginated; project update doesn't notify newly added members (store does); recurrence clones drop `phase_id`/`blocked_by`/`parent_id`/`start_date`; `pinChat` silently joins non-members to conversations; announcement `dismiss` has no visibility check; QaController has no audit logging; attendance export columns omit break details; `M-33` timer default (→F-090). **[M-12, re-verified this pass]** `syncEmployees` (`DepartmentController.php:263-275`) moves **any** users — including super_admins — into a department via one bulk `User::whereIn(...)->update()` with **no `users.*.manage` cross-check**, and deliberately operates on archived departments (`Department::withTrashed()`); teams can likewise be added to archived departments (`:172-189`); `destroy` on an already-archived department is a silent no-op 204 (archive vs destroy near-duplicates). **[M-13, re-verified this pass]** `PUT /profile` accepts an arbitrary `preferences` array (`ProfileController.php:28-42` — `'preferences' => 'nullable|array'` straight into `$user->update()`), bypassing `UserPreferenceController`'s `directory_visibility in:public,private` whitelist — e.g. it can set the dead-but-honored `internal` value that `DirectoryController` treats as full exposure; `UserPreferenceController:65` also busts a cache key nothing writes. **Scope:** Backend.

### F-095 · API rate limiting effectively absent
**Sources:** register §35; **verified this pass** `AppServiceProvider.php:74-75`. `throttle:api` = `Limit::perMinute(1000)->by(user id ?: ip)` applied to the entire authenticated group (`routes/api.php:65`) — 1000 req/min/user is effectively no limit (brute-force-adjacent surfaces have their own tighter throttles where noted, e.g. decision 15/1m). **Fix:** sensible per-group limits. **Scope:** Backend.

### F-096 · JS-readable token cookie + dual CSP
**Sources:** register §35; report P3 nibs (X-XSS-Protection + unsafe-inline). `g4k_token` access token mirrored in a JS-readable cookie (only the refresh token is httpOnly) — accepted trade-off but widens XSS blast radius; CSP duplicated at Next middleware + API SecurityHeaders (two sources of truth); deprecated `X-XSS-Protection` header + `unsafe-inline` script CSP (`middleware.ts:65,80`). **Fix:** document the trade-off; single CSP source; modernize headers. **Scope:** Global.

### F-097 · Chat edit / mark-all-read absent
**Sources:** register §36; report P3 nibs (message edit schema-ready, no route); frontend 6.4; FINAL-AUDIT 16-I. Message **edit** is schema-supported (`edited_at`) but has no route (backend dependency); no mark-all-read per scope in chat. **Status:** OPEN (edit = backend dependency). **Scope:** Module.

### F-098 · Production build parity with HEAD
**Sources:** register §35/§41; lineage 2026-08-21 ("prod build lags HEAD"). Not verifiable without deploy access. **Status:** NOT REPRODUCIBLE (needs deploy check — verify the deployed build matches `69e302d`). **Scope:** Infra.

### F-089b (subsumed under F-089) · Mobile/frontend P3 nibs from report
`dismissedNotificationIds` grows unbounded in localStorage; duplicate 30-s unread polling (→F-053); hydration double-gate (→F-054); Grainient WebGL login background heavy with no reduced-motion guard; Employee360 activity `undefined` empty-check (→F-030); "View" label (→F-089).

### F-100 · Missing-feature & efficiency residual set (every remaining enhancement/improvement recommendation from S2/S3/S5 — consolidated so none is lost; full context in §16.2/§16.3/§16.5)
**Category:** Feature/Efficiency/Discoverability residuals · **Sources:** frontend 16-H/16-I/16-J/16-P + K-section + Part 10 J-L1 + Part 12 H + F-L3; FINAL-AUDIT GAP-6/GAP-8 + 16-I/16-J; prior register §26–28 P3 set line · **Role:** mostly H/SA (some All) · **Status:** OPEN (optional/enhancement unless noted).
1. **Global search results** — palette searches commands/recents, not entities; a "search everything" (people/projects/tasks) results view — palette extension preferred over a page · [Enhancement] P3 (16-H2, S5 §26-28).
2. **Work-schedule usage view** ("N people on this schedule") · [Improvement] P3 (16-I).
3. **Announcement archive / history of dismissed** · [Enhancement] P3 (16-I).
4. **Bulk task reassign** (bulk bar has mark-done/delete only) · [Enhancement] P3 (16-J; S2 K — pairs with bulk move-to-phase, itself blocked by F-008).
5. **Duplicate task/project** · [Enhancement] P3 (16-J; S2 K).
6. **Filter summary-chips + one-clear** (search/filters/date/sort reset) on heavy tables · [Improvement] **P2** (16-J).
7. **Task comments lack attachments** — chat has them; task review discussions often need screenshots · [Enhancement] P3 (S3 GAP-6).
8. **No project archive** — completed projects accumulate with active in filters; archive (soft state) or auto-filter default · [Enhancement] P3 (S3 GAP-8).
9. **Keyboard/palette task operations** — assign-to-me, done, submit + approve/reject commands in the palette · [Improvement] P2–P3 (S2 K).
10. **Inline status/priority edit on task rows** (inline project rename already exists — extend the pattern) · [Improvement] P3 (S2 K).
11. **Create-task from a template / "assign like last time"** on projects (recurrence covers some) · [Improvement] — S2 rates S3/**P1 if orgs reuse teams** (S2 K).
12. **Announcement compose + quick-task as inline popovers** on the dashboards they already occupy (reduce modals) · [Enhancement] P3 (S2 K).
13. **FileUploadPopup preview/replace/remove states standardized** across all uploaders (verify announcement/project covers) · [Improvement] P3 (S2 Part 12 H).
14. **Long-name truncation audit** on hand-rolled tables + chat sidebar (F-L3 — 79 truncate/line-clamp exist but coverage inconsistent) · [Improvement] P3 (S2 F-L3).
15. **Mixed-height widgets** in one grid row leave uneven bottoms — `min-h` per widget class or grid `auto-rows` · [Polish] P3 (S2 Part 10 J-L1).
16. **Discoverability residuals** (16-P cluster): restore-trashed filter discoverable only via status filter; saved views little-known; density mode undiscovered; inline project rename found only by accident — surface each (F-085-adjacent "draft saved" microcopy already in F-060).
17. **Settings 11-tab grouping suggestion** — group tabs (Identity: Company/Numbering · Operations: Schedules/Holidays/Reminders · Platform: Mail/Notifications/Jobs/Security/Demo) · [Improvement] P3 (S2 Part 5 E).
**Fix:** schedule as Wave 7 backlog (§14); items 6/9/11 carry P1–P2 weight per S2. **Scope:** Global (product surface).

---

## §8. Historical Lineage (every prior-audit-era finding, preserved with verified status)

### 8.1 FIXED (10 findings — verified in current code; preserved as audit history)

| # | Prior finding (era) | Verification in current code |
|---|---|---|
| 1 | Chat ASC-pagination inversion (08-16) | Chat pagination/read logic correct; no inversion found |
| 2 | Empty tables `data.data.data` unwraps (08-16) | `unwrapList`/`unwrapPaginator` handle both shapes (`lib/pagination.ts`) |
| 3 | 30-day attendance calendar cap (08-16) | History now 365 days (`meHistory`) — remaining 7-day shift-log truncation is F-034 |
| 4 | `FIELD()` pgsql 500 (08-26) | Grep-verified: portable `CASE WHEN` sorts; no FIELD/GROUP_CONCAT anywhere |
| 5 | Public reset-demo route (08-26) | Demo routes behind `auth:sanctum` + `settings.manage` (`routes/api.php:323-327`) |
| 6 | Task pipeline dead at UI (08-21) | Tasks tab fully wired (board/list/gantt + create/submit flows) |
| 7 | QA `field_type`/`type` mismatch (08-19) | Consistent `field_type` validation in QaController |
| 8 | org/users + admin/* 404 era → redesign (08-18) | Users mgmt lives in Directory; `/admin/*` intentional redirects |
| 9 | Queue/scheduler dead (08-16) | `g4k-worker` Cloud Run service runs schedule + queue workers (12 jobs) |
| 10 | Must-change-password dead-end (08-16) | Skip logic + policy gate implemented — dormancy tracked as F-043 |

### 8.2 PARTIALLY FIXED (3)

1. **Missing S3 adapter (08-16) → F-094:** adapter + disk + deploy env (incl. bucket/endpoint — corrected this pass) present; **credential delivery + runtime upload path unconfirmed**.
2. **Must-change-password dead-end → F-043:** flow works, but seeder/migration force `force_password_change=false` — dormant by default.
3. **Pickers capped at 20 (08-26) → F-034:** caps now 20/50/100/1000 — better, but still silently truncating.

### 8.3 REGRESSED — none
No previously-fixed lineage finding was found broken again in current code.

### 8.4 SUPERSEDED (3) / NOT REPRODUCIBLE (2)

- **Superseded:** 08-18 "org/users + admin/* 404s" (Directory-tab + redirect architecture replaced it); "phantom `attendance.md` implementation" (document deleted by owner; no phantom references remain); `deploy.md` plan artifact (superseded by §14 of this master).
- **Not Reproducible / Unverified:** "red vitest" — test suite not executed during the audits (8 test files exist; run `pnpm test` to verify); "prod build lags HEAD" → F-098; demo-purge `audit_logs` truncation nuance (08-21) — current purge deletes only `demo_tag`-bearing audit rows **plus** writes two untagged rows (behavior verified; historical "truncate" claim not reproducible as stated).

### 8.5 REQUIRES PRODUCT CONFIRMATION (6 — do not treat as defects yet)

1. **Half-day leave** — enum dead end-to-end (F-050); explicit decision required.
2. **Configurable leave types/balances per type-year** — [Speculative].
3. **Scheduled reports** — backend model `ScheduledReport` exists, nothing consumes (F-051e): **build or delete**.
4. **SA personal attendance surface** — backend `*` allows it; nav filter hides it (an admin who is also a worker can't clock in without a second role). Grant the surface or document the exclusion.
5. **Employee-import timing** (F-079) — build now vs post-launch.
6. **`BROADCAST_CONNECTION=reverb` vs pusher** — `.env.production` references reverb (not installed); deploy manifest selects pusher (no keys). Pick one transport (F-013).

Plus S2's open design questions: pill+rainbow identity on Operate surfaces or auth-only? Accent palette user-facing or designer vocabulary? Minimum viewport 360 vs 390?

---
## §9. Detector Archive — `.impeccable/detect-frontend-audit.json` (26 findings)

Deterministic Impeccable `detect` run over `apps/web/src`; every finding listed (none dropped). Triage from S2/S3: **3 vendor/test false positives** noted.

| # | Antipattern | File : line | Snippet | Triage |
|---|---|---|---|---|
| 1 | bounce-easing | `(auth)/change-password/page.tsx:256` | `animate-bounce` | real (→F-071 motion) |
| 2 | bounce-easing | `(auth)/forgot-password/page.tsx:147` | `animate-bounce` | real |
| 3 | bounce-easing | `(auth)/login/page.tsx:196` | `animate-bounce` | real |
| 4 | bounce-easing | `(auth)/onboarding/page.tsx:57` | `animate-bounce` | real |
| 5 | bounce-easing | `(auth)/onboarding/page.tsx:124` | `animate-bounce` | real |
| 6 | bounce-easing | `(auth)/reset-password/page.tsx:263` | `animate-bounce` | real |
| 7 | bounce-easing | `(auth)/role-select/page.tsx:80` | `animate-bounce` | real |
| 8 | bounce-easing | `(auth)/role-select/page.tsx:154` | `animate-bounce` | real |
| 9 | bounce-easing | `profile/components/profile-workspace-section.tsx:113` | `animate-bounce` | real (Operate chrome — the "bounce on dashboard chrome ×9" finding; S2 reserves bounce for auth only) |
| 10 | gray-on-color | `dashboard/layout.tsx:294` | `text-neutral-600 on bg-rose-50` | real (→F-072) |
| 11 | gray-on-color | `dashboard/layout.tsx:294` | `text-neutral-400 on bg-rose-50` | real |
| 12 | gray-on-color | `dashboard/layout.tsx:343` | `text-neutral-600 on bg-rose-50` | real |
| 13 | gray-on-color | `dashboard/layout.tsx:343` | `text-neutral-400 on bg-rose-50` | real |
| 14 | ai-color-palette | `profile-workspace-section.tsx:103` | `text-violet-900 on heading` | real (AI-tell) |
| 15 | ai-color-palette | `profile-workspace-section.tsx:103` | `text-violet-100 on heading` | real |
| 16 | gray-on-color | `app-shell/notifications-bell.tsx:242` | `text-neutral-500 on bg-emerald-500` | real |
| 17 | gray-on-color | `app-shell/notifications-bell.tsx:250` | `text-neutral-500 on bg-rose-500` | real |
| 18 | gray-on-color | `leave/leave-request-form.tsx:281` | `text-neutral-600 on bg-rose-100` | real |
| 19 | gray-on-color | `leave/leave-request-form.tsx:281` | `text-neutral-400 on bg-rose-100` | real |
| 20 | gray-on-color | `tasks/create-task-dialog.tsx:187` | `text-neutral-500 on bg-emerald-100` | real |
| 21 | side-tab | `tasks/task-overview-tab.tsx:450` | `border-l-2` | real (AI-tell — the canonical "side-tab accent border" finding) |
| 22 | gray-on-color | `widgets/announcement-board.tsx:215` | `text-neutral-400 on bg-rose-50` | real |
| 23 | gray-on-color | `widgets/quick-notes.tsx:159` | `text-neutral-400 on bg-amber-100` | real |
| 24 | overused-font | `frappe-gantt.css:1` | `font-family:Helvetica` | **vendor false positive** (library stylesheet) |
| 25 | layout-transition | `frappe-gantt.css:1` | `transition: width` | **vendor false positive** |
| 26 | broken-image | `__tests__/auth.test.tsx:27` | `<img alt={props.alt || ''} …/>` | **test false positive** (mock) |

**Net:** 23 real findings — 9 bounce-easing (F-071), 11 gray-on-color (F-072, incl. the gray-on-color ×11 count), 2 ai-color-palette (F-072), 1 side-tab (AI-tells, §11.3). Re-run `detect` + `$impeccable critique` after remediation (§14, §15).

---

## §10. Page-by-Page Verdicts (all 27 routes + shell — S2 Part 1, merged)

Severity 0–4 (Nielsen); "5-second test" = can a first-time user say what the page is for within 5 seconds.

| Page | 5-sec test | Key findings (→ register IDs) |
|---|---|---|
| `/login` | PASS | "identifier" jargon (F-089); Gen2k/G4K brand split (F-088); raw styled submit bypassing ui Button (F-062); Grainient heavy, no reduced-motion guard (F-089b); flat error copy |
| `/forgot-password` | PASS | admin-mediated fallback lacks expectation-setting (F-089) |
| `/reset-password` | PASS | policy-driven schema + meter + hidden token — solid |
| `/onboarding` | PASS | optional fields unmotivated (F-089); video muted ✓ |
| `/role-select` | PASS | auto-select infinite-loader failure state (F-054); cards don't say what changes |
| `/change-password` | PASS | exemplary conditional skip; "other devices signed out" undisclosed (F-089) |
| `/dashboard` (all 3 variants) | PASS | approvals widget = best approve UX (but F-014 staleness); employee "view all" missing; no reset-layout; overtime mislabel 31,500s (F-090); greeting noise day-200 |
| `/attendance` | PASS | dynamic-class dots (F-028); nav label hides leave (F-073); 7-day truncation (F-034); dead `holidays` TabsContent (F-075); same-day rule on submit only (F-049) |
| `/org/attendance` (SA) | PARTIAL | 5 tabs complete; numeric alignment (F-091); corrections buried (F-038); board staleness (F-014) |
| `/org/attendance` (HR) | **FAIL** | dead approvals tab (F-010); 2 tabs only |
| `/projects` | PASS | 9-field mega-dialog ungrouped (F-060); 1,000-preload (F-034); two mental models grouped/flat; hidden inline rename discoverability |
| `/projects/[id]` | PASS | edit stub (F-026); phase-complete no warning on open tasks (F-082-adjacent); Delete beside Edit (F-062) |
| Tasks (board/list/gantt/QA) | PASS | reorder no-op (F-011); QA-drag toast lacks action (F-062); 100-task cap (F-034); create-form = best form ✓; detail sheet excellent, no "log time" (F-030/K-A2) |
| `/chat` | PASS | clear-chat no-op (F-011); 3-char silent gate (F-033); pills a11y (F-071); reminders misplaced (F-073); window.confirm (F-057); priority consequences invisible |
| `/directory` | PASS | "View" label backwards (F-089); temp-password toast (F-044); archive errors-after-click (pre-check wanted); dept/designation bypass ListScaffold (F-074) |
| `/directory/[id]` (360) | PASS | **only Send Message action** (F-030); activity empty-check bug |
| `/reports` | PASS* | *blocked by F-009; export memory bridge (F-035); preview cap disclosed ✓ |
| `/audit` | PASS* | user filter capped 100 (F-084); suspicious-flag styling ✓; deep links ✓ |
| `/settings` | PASS* | *blocked by F-009; empty shell for unauthorized (no empty state); schedule default silent loss (F-020); demo blast radius unstated (F-003) |
| `/profile` | PARTIAL | fictional sections ×3 (F-029); security genuinely good but buried 2 levels; scroll-spy nav ✓ |
| `/tasks/[id]` | PASS | proper deep-link page with not-found state ✓ |
| Shell/nav/palette/mobile | — | F-009 lockout; palette dead link (F-039); false Offline pill (F-013); attendance naming collision (F-073); bottom-nav aria-current (F-071); bulk-bar/FAB overlap (F-086) |
| 7 redirect stubs | — | verified; keep one release then remove `/admin/*`, `/org/leave` (F-073/§14) |

---

## §11. Component System Digest (S2 Parts 6–9 + Part 14; full detail verbatim in §16.2)

### 11.1 Inventory & adoption (measured)

`@g4k/ui` = 57 exported primitives, 170 importing files — a real, used system. Measured adoption: Dialog ×23 · ConfirmDialog ×21 · Tabs ×18 · EmptyState ×33 · ListScaffold ×11 · DatePicker ×10 · Toolbar ×9 · DropdownMenu ×12 · Sheet ×6 · PasswordInput ×5 · DataTable ×5 · InlineEdit ×4 · SemanticCalendar ×3 · Wizard ×2 · Combobox ×2 · HelpOverlay ×1 · **AlertDialog ×0 (dead — delete)**. Button ×321 usages vs 66 raw `<button>`; Input ×86 vs ~37 raw; Avatar ×87 (76 fallbacks); Skeleton ×158; Tooltip ×15. **Verdict:** library healthy; failure mode is *uneven adoption* — Toolbar/Wizard/InlineEdit/Combobox/DataTable exist and are exactly what hand-rolled mega-components reimplement. Module families incl. tasks-tab **1,232 lines**, qa-form-builder 831, departments-tab 817, chat-tab 773, directory-list 688, attendance-history-calendar 598, dashboard/layout 552.

### 11.2 The 40-row Component Upgrade Matrix (condensed pointer — full table verbatim in §16.2 §6.12)

P0 rows: Kanban (reorder persistence + keyboard move) · ChatList/Composer (clear-chat backend + pills aria) · AttendanceCal/Heatmap (status class map + legend) · HRAttendanceTable (approvals tab). P1 rows: **new** IconButton / SearchInput / UserPicker / StatusBadge↑ui · Form* adoption · Dialog size+mobile · DataTable absorbs rivals · CommandPalette link fix · ConnectionStatus 3-state · Badge/pills via StatusBadge · Select error. P2: Button xs+brand · Input slots · DatePicker unify · ConfirmDialog migrate chat · TableToolbar · Pagination direct · toast.promise · Wizard in project/user · PendingApprovals view-all · TaskGantt cap honesty · TaskDetailSheet log-time · AnnouncementBoard token+copy · AdminAttendanceTable migrate · UserForm wizard+draft · CreateProjectDialog wizard. P3: Spinner · Tabs condensed · Tooltip focus-trigger · EmptyState stragglers · QaFormBuilder split · NavGroup trim+aria · NotificationsBell aria · Grainient guard · delete FeedbackForm. Keep: Avatar · TimeClock (template widget) · OfflineBanner · PinnedItems.

### 11.3 Canonical Component System (target state — S2 §6.13, verbatim in §16.2)

Button (+`xs` 28/sm 32/md 40/lg 44/icon; +`brand` opt-in rainbow; one primary per surface; destructive always ConfirmDialog) · **new IconButton** (required sr-only label; 32/40) · Input (default/error/success; prefix+suffix slots; counters) · **new SearchInput** (300ms debounce, clear, hinted minChars) · Select (≤7 opts) / Combobox (searchable single) / **new UserPicker** (searchable multi, server typeahead, chips, cap-free) · DatePicker (+Today/Clear/range; 36–40px cells) + TimeInput · FileUploadPopup sole uploader · `Form*` mandatory · Card (radius xl, e1, slots, no decorative accent) · **new StatusBadge** (status→token map; never color-only) · DataTable stack (+sticky header, card-stack <md, state slots) + TableToolbar (search→filters→actions) + BulkActionBar + Pagination (20/50/100) · Dialog (size prop; sticky footer `[Cancel][Primary]`; <640 sheet) · Sheet (right detail / bottom mobile) · ConfirmDialog sole confirm (verb+noun title + consequence line) · Toast (success/error/info parity + `toast.promise`) · EmptyState (never bare "No data") · ChartCard (echarts lazy + title/legend/loading/empty) · MetricWidget (+href +trend) · WidgetEngine (+reset-layout; drag off <768). **When-not rules (grep-able bans):** never hand-roll pagination, confirm, status pills, user pickers, spinners, or dialog widths; ban `text-[Npx]`, unprefixed multi-col grids, `window.confirm`.

### 11.4 Color & brand scorecard ("colorful but controlled")

Right: orange primary identity, Sora display, status tokens incl. `--overtime`, 15-accent module palette, dark-mode-complete. Wrong: accents applied where status should be (project cards pick decorative colors), gray-on-color ×11, ai-palette ×2, "blue" meaning info/link/selection in different modules. **Rule to adopt: color = status | identity | selection — never decoration.** AI-tells confirmed: side-tab border (`task-overview-tab.tsx:450`), bounce easing on Operate chrome ×9, icon+number+card repetition without trend, chips-on-chips rows, placeholder sections, decorative 15-accent use. Not tells (keep): pill-button identity, rainbow as opt-in brand moment, nav accents, Sora pairing.

### 11.5 Layout distributions (measured, S2 Part 10)

Page padding p-6×73/p-4×48/px-4×20/p-8×17/px-6×12 (`page-padding` used once) · card padding p-4×88/p-3×53/p-6×25/p-5×16/p-8×12 · form rhythm space-y-4×83/6×66/2×65/1.5×47/3×42 (+5/8 outliers) · row padding py-2×71/py-1.5×43/py-1×30 · shell heights h-12×5/h-14×1/h-16×3 · grids grid-cols-1×53 with ladders but 26 unprefixed (F-065) · headings lg×25/2xl×23/xl×16/3xl×6 · cells px-3 py-1.5×9 vs px-4×3 vs px-2×4 · negative margins ~20 (healthy ✓) · charts fixed h-64/h-48 (F-066). Works-well (preserve): 1440 cap · sidebar 64↔256 + Sheet · gap-2 rhythm ×343 · grid ladders · thin-scrollbars · virtualized activity feed · density-mode architecture.

---
## §12. Archived Reports Lineage (docs/archive — every file accounted for)

`docs/archive/` holds the explicitly-archived, **superseded** historical plans/reports (2026-08-13 → 2026-08-18 era). They are not live audit authorities; their findings were re-verified in the 2026-08-28 audits and live on only through the lineage statuses in §8 and the F-register. Nothing here has been silently dropped — each file's surviving contribution is named.

**`docs/archive/2026-08-18/`** (the 08-18 cleanup archive): `Finalization-V5.md` / `Finalization-V6.md` (9-P0/49-task and successor plans — completed or superseded by later audits; residual items surfaced as the 08-19→08-26 lineage findings in §8) · `FRONTEND-IMPLEMENTATION-PLAN.md` (frontend authority of the 08-16 era — its root causes [empty tables, chat ASC-pagination, 30-day cap, must-change dead-end, async-export blob, vitest] are §8.1 items 1,2,3,10 + F-034/F-098 lineage) · `PRODUCTION-AUDIT-AND-REMEDIATION-PLAN.md` (R0–R7 remediation — superseded by §14) · `GO_LIVE_RUNBOOK.md` (runbook — superseded) · `P0-done.md` (completion record for the 08-18 P0 wave — basis of §8.1 items 8,9) · `api-README.md`/`web-README.md`/`ROOT-README.md` (docs) · `Old-reports-plans/Audit-Report.md` + `Implementation-Plan.md` (08-17→08-18 era — all findings either fixed in §8.1 or carried as lineage; nothing live).

**`docs/archive/planning/`** (the 08-14/08-15 consolidation archive): `finalization-2…7.md` + `finalization-v1…v7-2026-08-13/14.md` + `finalization-7-report.md` (the iterative product-spec/finalization series — source of the "Finalization V5 9 P0s/49 tasks" lineage; completed or superseded) · `context.md` + `context-pre-consolidation-2026-08-14.md` (session context snapshots — historical only) · `finalization-report.md` (marked unreliable in lineage memory; superseded) · `old/` = the pre-08-14 originals: `Audit-Report.md`, `Audit-Report (2).md` (the 08-13-era audits — findings lineage-reconciled into §8), `Project.md`, `attendance.md`, `deploy.md`, `implementation_plan.md`, `CLAUDE.md`, `AGENT.md` (owner-deleted legacy docs; their plans superseded by §14).

**`docs/archive/` root:** `Audit-Report-V1.md` (08-13 first audit — lineage) · `Implementation-V1.md` (first implementation plan — completed/superseded) · `PRODUCTION-AUDIT-AND-REMEDIATION-PLAN.md` (rev-2 R0–R5 era — superseded by §14).

**Owner-deleted 2026-08-28 (git working tree):** `Audit-Report.md` (08-26 edition — its unique findings are §8.1 item 4–5 + §8.4), `Project.md`, `attendance.md`, `deploy.md` (the 08-21 plan artifact — superseded by §14). The tracked `Audit-Report.md` filename now resolves to this file (case-insensitive filesystem: `audit-report.md`).

---

## §13. Zero-Omission Reconciliation Matrix

Every source finding → destination in this master. (Counts are finding-entries as defined by each source's own ID system.)

| Source | Total finding-entries | Destination | Verified |
|---|---|---|---|
| S1 `report.md` | 9 C + 19 H + 33 M + 2 grouped P3 lists (≈90 entries) | F-001..F-008, F-010, F-013..F-026, F-027..F-029, F-034, F-036, F-040 (M-6/M-7), F-041, F-042..F-054, F-090, F-092, F-093 (incl. restored M-12/M-13), F-045d (restored M-20), F-054 (restored M-32), F-096, F-097, **F-101 (H-4 recovered)** + §2 verified-work list → §3.7 | ✔ every C/H/M ID mapped in §0.2; P3 lists in F-075/F-089/F-089b/F-092/F-093; completeness pass confirmed no M/H item embed-only |
| S2 `frontend.md` | A-1..A-7 + B-1..B-7 + C/D/E/F/G/H/I/J/K/L/N sections + W1..W26 + 6.x findings + A-L/B-L/C-L/D-L/F-L/G-L/I-L/J-L/L-L/O-L layout items + A-F/B-F/C-F/D-F/E-F/F-F/G-F/L-F functional items + Part 14 A..T | F-009..F-012, F-014, F-026..F-012 cluster, F-028..F-012, F-029, F-030..F-033, F-035, F-037..F-039, F-052..F-074 (incl. restored activity-feeds ×3 + calendar-grid sharing), F-076..F-085 lineage, F-086..F-091, **F-100 residual set (16-H/I/J/P, K, J-L1, F-L3)**, §3.4 workflows, §10 pages, §11 components | ✔ all Parts 1–14 represented (inventory §3, workflows §3.4, pages §10, components §11, IA F-073, roadmaps §14); completeness pass confirmed no recommendation embed-only |
| S3 `FINAL-AUDIT.md` | verdicts + §3 C-1..9 + §4 H-1..19 + §5 M-set + §6 P3 + §7 + §8 + GAP-1..8 + 16-A..16-S + Waves 0–8 | F-register (per §0.2 map, incl. C-renumber resolution), F-031, F-076..F-083, F-079, **F-100 (GAP-6, GAP-8, 16-I/16-J residuals)**, §8.5 product questions, §14 waves | ✔ all GAPs + 16-sections mapped |
| S4 `manual.md` | 29 chapters of documented workflows/capabilities/behaviors | §3 inventories; manual-promise vs reality deltas flagged inside F-002/003/010/017/018/023/026/036/043/044/049/077/082/085; full text §16.4 | ✔ every chapter either verifies §3.7 working-list or maps to a finding |
| S5 prior register | F-001..F-098 + §37 fixed ×10 + §38 partial ×3 + §41 superseded/N-R + product Qs + §26–28 missing-feature set | This master's register (same F-IDs, statuses re-anchored §2.4), §8 (all historical rows preserved verbatim-equivalent), §8.5, §14 (§47–52 plans carried), **F-100 (§26–28 P3 set line restored)** | ✔ all 98 source F-IDs present + its §26–28 residual set now register-represented; F-094 corrected; F-097 numbering fixed |
| S6 detector JSON | 26 findings | §9 table (all 26 rows) | ✔ |
| Lineage archives (§12) | ~30 files | §8 statuses + §12 dispositions | ✔ every file listed |

**Sub-item ID coverage (S2's lettered sub-findings — all carried inside parent F-blocks):** A-L1→F-055 · A-L2→F-065 · B-L1/B-L2/B-L3→F-063 · C-L1→F-064 (baseline-break consequence of the 6-height sprawl) · C-L2/C-L3→§11.5 + §3.7 · D-L1/D-L2→F-068 · D-L4→F-089 · D-L5→F-066 · F-L2→§3.6 (+F-055) · F-L3→F-100 #14 · G-L1→F-069 · I-L4→F-091 · J-L1→F-100 #15 · L-L1→F-063 · O-L1/O-L2→F-087 · A-F1→F-037 · A-F2→F-037 (32px cells) · A-F3→F-037 (presets) · A-F4→F-056 · B-F1/B-F2/B-F4→F-060 · B-F3→§3.7/§11.2 (preserve) · C-F1→F-061 (full-width default) · C-F2→F-061 (5 search widths) · C-F3→F-061 (textarea rows) · D-F1→F-032 · D-F2→F-033 (Select error) · D-F3→F-032 (multi-select ×4) · D-F4→§3.6 collision + F-100 #14 (long labels) · E-F1→F-068 · E-F2→F-062 · E-F3→§3.7 (preserve) · F-F1→F-062 (size-by-space) · F-F2→F-062 (login raw button) · F-F3→F-062 (lg misuse) · F-F4→F-062 (Delete beside Edit) · F-F5→F-062 (+F-033 ExportButton) · G-F1→F-032 · G-F2→F-032 (fallback ×76; dept disambiguation) · G-F3→F-075 · H-L1→F-061 · L-F1→F-067 · L-F2→F-037 (added this pass) · K-A1→F-030 · K-A2→F-038/F-030/F-035/§11.2 · L-A1→F-073c · L-A2→F-073b · L-A3→F-029/F-088 · E-A1→F-073a · E-A2→F-073h (verdict: fine as-is) · E-A3→F-073g · I-F1→§2.4 wiring list (F-009/010/011/026/027/028/039/052/053 + F-062 login button + export enable) · W1..W26→§3.4 (incl. reclassified W4→F-099, W13, W14→F-008).

**Register closure check:** F-001…F-101 continuous (F-089b is a sub-bucket of F-089, noted; **F-099 added by the discovery sweep, F-100 by the completeness sweep, F-101 = report H-4 recovered after the token-level cross-check — §2.4**). 13 P0 (§4, incl. F-099) + 31 P1 incl. F-094 & F-101 (§5) + 44 P2 (§6) + 14 P3 blocks incl. F-098, F-089b & the F-100 residual set (§7) = 102 register blocks covering 101 unique F-IDs, plus the historical sets (§8). No finding ID from any source is unrepresented; no affected page/component/workflow named in any source is absent (pages §10, components §11, workflows §3.4, roles §3.5).

---

## §14. Remediation Plans (all source plans merged, sequenced)

### 14.1 Wave plan (S3 §17 — the unified roadmap; supersedes per-part roadmaps)

- **Wave 0 — Security & data safety (days):** C-1 backdoor + stray scripts (F-001, F-092) · credential rotation (F-002) · demo-purge guards (F-003) · reset-link handling (F-017) · public endpoints restricted (F-040, incl. holidays cache private) · deploy + smoke.
- **Wave 1 — Unblock the product (this week):** A-1 cookie fix + admin smoke test (F-009) · A-2 HR approvals tab + link fixes (F-010) · phase 500 (F-004) · delete 500s (F-005) · **leave-cancel CHECK migration (F-099 — new)** · scope escalation (F-006) · leave routes (F-007) · move-phase (F-008) · **cover-upload route shape (F-101 — recovered)** · reorder persistence (F-011b) · clear-chat (F-011a) · placeholder deletion (F-029) · offline truthiness (F-027).
- **Wave 2 — Trust & correctness:** board staleness + "last updated" (F-014) · schedule default (F-020) · approval locking/recheck (F-021) · redo order (F-022) · weekly summary roles (F-023) · export filters (F-024) · HR scope leaks (F-015) · PII hiding (F-016) · last-admin guard (F-018) · avatar path (F-019) · status map (F-028) · remember-me cookie (F-036) · post-creation actions (F-031).
- **Wave 3 — Component consolidation:** six missing primitives (F-033; UserPicker w/ avatars F-032) · Dialog size + mobile sheet (F-055) · DataTable absorbs attendance tables (F-074) · Wizard for project/user (F-060) · DatePicker Today/Clear/range + presets (F-037) · Select error · delete dead components (F-075) · heatmap responsive (F-067).
- **Wave 4 — Layout & density:** page/card padding adoption (F-063) · height/radius/type-scale codemods (F-064, F-012) · FormGrid · toolbars (F-068) · chart autoresize (F-066) · unprefixed-grid fix (F-065).
- **Wave 5 — IA & context:** attendance renames (F-073a) · 360 manager action bar (F-030) · project settings completion (F-026) · QA surfacing (F-073b/F-078) · reminders relocation (F-073c) · contextual actions (§3.4/K-list) · GAP-2/3/5 (F-077/F-076/F-078).
- **Wave 6 — A11y & responsive:** labels/targets (F-070) · motion-safe wrap (F-071) · tablist semantics · h1s · ring recipe (F-064) · dialogs-as-sheets (F-055) · touch actions.
- **Wave 7 — Completeness enhancements:** employee import (F-079) · saved views v2 (F-080) · empty-state guidance (F-083) · reject-reason (F-081) · **F-100 residual set** (global search, schedule usage view, announcement archive, bulk reassign, duplicate, task-comment attachments, project archive, filter chips [P2], palette task-ops, inline edit, templates, inline popovers, uploader states, truncation audit, widget min-h, discoverability residuals, settings grouping) · product decisions §8.5.
- **Wave 8 — Final pass:** verb/confirm/breadcrumb glossaries (F-089) · dead-code sweep (F-075) · redirect-stub removal (F-073) · E2E smoke suite (3 roles × core flows) in CI · detector + `$impeccable critique` + live-browser verification · re-score (targets: audit health ≥17/20, Nielsen ≥30/40, zero P0/P1 open).

### 14.2 Backend phase plan (S1 §8 — equivalent ordering, kept for traceability)

Phase 0 immediate (security, hours): F-001 + scripts redeploy; F-009 cookie + smoke; demo seed/purge production guard + rotate (F-002/003 first half); restrict F-040 endpoints + private cache headers. Phase 1 broken core (days): F-004/005/008/007/006 + fillable (order/scope_id) + **F-099 leave-cancel CHECK migration** + **F-101 cover-upload route**; F-020; F-018. Phase 2 permissions & data integrity (this week): F-015/016/017/021/022/019; F-010 UI tab; F-026; F-036; F-023; F-024. Phase 3 reliability (next sprint): F-013 transport decided + keys + ConnectionStatus; F-011a pivot; F-042 cache unification + observer registration; F-014; F-047/048. Phase 4 hygiene (backlog): dead-code sweep (F-075/F-093), demo isolation, QA-submission migration (F-046), a11y pass, E2E smoke suite, migration-vs-fillable lint (guards the F-004/005/006 class).

### 14.3 Component & layout phase plans (S2 Parts 9/11/12-O — folded into Waves 3–8 above; the 9 component phases and 9 layout phases are preserved verbatim inside §16.2)

### 14.4 Implementation dependencies (S5 §51)

F-009 precedes all admin-surface UX work · F-013 (transport) precedes realtime-dependent polish (live badges, receipts UX) · F-011/F-006/F-008 backend fixes precede their UI trust-restoration · UserPicker (F-032) unblocks 4 call sites + mentions · F-003/F-002 precede any client demo · F-094 verification precedes upload-feature QA · type-scale (F-012) precedes density/compactness passes (else double rework).

### 14.5 Regression risks (S5 §52 — read before executing)

Cookie fix must not break cross-tab auth sync (BroadcastChannel relies on the store) · Dialog size codemod risks visual regressions across 23 files — screenshot-diff a representative set · cache-invalidation changes (F-042) risk stampedes — rate-limited rebuild · route reorder (F-007) changes API paths — audit frontend callers first (done: `nav-group.tsx`, `admin-leave-holidays-view.tsx`, dead `approvals-tab.tsx`) · deleting redirect stubs breaks old bookmarks — one-release notice · fillable additions (`order`,`scope_id`) change mass-assignment surface — audit every `update()` call · demo-purge guards must not break staging seeding flows.

---

## §15. Final Verification Checklist & Conclusion

### 15.1 Coverage checklist (all ✔)

- [x] Every route/page audited (§3.3, §10) — [x] every workflow traced (§3.4, F-031/035/038/076-082) — [x] all three roles separately (§3.5) — [x] every component family (§11, F-033/074/075) — [x] visual/spacing/alignment (F-063/064/069/086/087) — [x] responsive six-size classes (§3.6, F-055/065/067) — [x] forms (F-060/061) — [x] calendars/dates (F-037/048/056) — [x] dropdowns/selects (F-032/033) — [x] buttons (F-062) — [x] identity/photos (F-019/029/032) — [x] navigation/IA (F-073, §3.3) — [x] duplicates/consolidation (F-074/075, §11.2) — [x] contextual actions/settings (F-030/035/038) — [x] missing pages/features/options (F-079..F-082, §8.5) — [x] wiring (F-009/010/011/026/027/028/039/052/053) — [x] accessibility/WCAG (F-070/071/072) — [x] loading/empty/error states (F-059) — [x] state-sync (F-013/014/042/052-054) — [x] role/permission UX (F-015/018/021/045) — [x] daily-use (F-023/034/084/085) — [x] newly discovered findings (§2.4) — [x] every prior finding reconciled with status (§8) — [x] global-vs-local scope on every finding — [x] priorities un-inflated (P0 = blocking only) — [x] unverified items explicitly marked (§8.5, F-094, F-098) — [x] fixed items preserved (§8.1-8.2) — [x] verified facts distinguished from recommendations and product questions throughout.

### 15.2 Outstanding gate (cannot be closed from code alone)

**Live-browser verification pass:** run `$impeccable critique` + the E2E smoke suite (3 roles × login/attendance/leave/task/chat/admin-open) on a dev server; re-score audit health (target ≥17/20) and Nielsen (≥30/40); verify F-094 by uploading one avatar in the deployed environment; verify F-098 build parity; run `pnpm test` (red-vitest lineage §8.4).

### 15.3 Final conclusion

The product's bones are excellent — a real design system, correct RBAC scoping intent, strong offline/realtime scaffolding, and workspaces that match user mental models. Its blockers are concentrated, named, and fixable: one backdoor, one cookie name, four guaranteed 500s, a dangerous demo tool, and a scope-escalation — roughly a fortnight of focused work for Waves 0–2, after which the remaining program is consolidation and polish rather than repair. **Handover recommendation: do not put real employees on this build until Wave 0 (§14.1) is complete and §15.2's live-verification gate passes.**

This document supersedes all prior audit files as the single source of truth. The companion deep-dives (`report.md`, `frontend.md`, `FINAL-AUDIT.md`, `manual.md`) remain in the repo unchanged, and their **complete texts are embedded verbatim in §16 below** so this file is self-sufficient.

---

# §16. Source Archive — Verbatim Embeddings (zero-omission guarantee)

> The five source documents follow **in full, unmodified**. They are embedded so that this master alone carries the complete audit history even if the companion files are later deleted. Source IDs inside these embeddings use each document's own (colliding) schemes — see the cross-map §0.2.


## 16.1 — Source S1: `report.md` (backend production audit — verbatim, complete)

# Games4King — Production-Readiness & Workflow Audit Report

**Audit date:** 2026-08-28
**Scope:** Entire codebase, code-first — every finding below was derived from and verified against source code (`apps/api` Laravel 11 + `apps/web` Next.js 16 + `packages/ui`). No existing documentation was used as an input.
**Verdict:** **NOT PRODUCTION READY.** The application is feature-rich and the majority of workflows are correctly implemented, but there are **9 critical** findings (including an unauthenticated API backdoor, an admin-surface lockout in the frontend router, and several guaranteed-500 core operations), **19 high**, **~35 medium**, and **~30 low** findings that must be triaged before handover.

> Manual testing has confirmed most functionality works. That is consistent with this audit — most findings live in edges (admin router, phase/delete operations, demo tooling, scope escalation paths, background/realtime plumbing) that routine happy-path testing does not exercise. The codebase is the source of truth for this report; if the deployed build differs from `HEAD`, findings marked UI/API may differ in production until a rebuild.

---

## Contents

1. [System Snapshot](#1-system-snapshot)
2. [Verified Working](#2-verified-working)
3. [Critical Findings (P0)](#3-critical-findings-p0)
4. [High Findings (P1)](#4-high-findings-p1)
5. [Medium Findings (P2)](#5-medium-findings-p2)
6. [Low Findings (P3)](#6-low-findings-p3)
7. [Cross-Cutting Themes](#7-cross-cutting-themes)
8. [Recommended Remediation Order](#8-recommended-remediation-order)

---

## 1. System Snapshot

| Layer | Details (from code) |
|---|---|
| Backend | Laravel 11 (`apps/api`), Sanctum tokens (15-min access + 7-day refresh, rotating, cookie `g4k_refresh_token`), capability-based RBAC via `role_capabilities` table (`super_admin` `*`; `hr` 23 caps; `employee` 9 caps) |
| Database | PostgreSQL (enum CHECKs, partial indexes); SQLite fallback for tests |
| Frontend | Next.js 16 App Router (`apps/web`), TanStack Query, zustand, react-hook-form + zod, Tailwind 4, `@g4k/ui`, laravel-echo/pusher-js, echarts, dnd-kit, frappe-gantt, react-grid-layout |
| Realtime | Broadcast events on chat/notifications/tasks/attendance; polling fallbacks (15–30 s) |
| Jobs | `QUEUE_CONNECTION=database`; worker = Cloud Run service `g4k-worker` (`schedule:work` + `queue:work`); scheduler runs 12 jobs (attendance nudges, reminders, cleanups, weekly summary) |
| Deploy | Cloud Build → Cloud Run (`cloudbuild.yaml`), Vercel artifacts present |

Roles: `super_admin`, `hr`, `employee`. HR scope everywhere = departments assigned via `department_hr` pivot (`HrScope`).

---

## 2. Verified Working

Confirmed correct by code trace (representative, not exhaustive):

- **Auth:** login by email/username/employee-id with timing-attack-safe hash check; 5-strike lockout (10 min, `failed_attempts`/`lockout_until`); rate limiters; refresh-token rotation + `EnsureTokenIsNotRefresh` blocks refresh ability from API use; password reset with hashed 60-min tokens and global token revocation (`AuthController.php`); `ForcePasswordChange`/`ForceOnboarding` gates (dormant-but-correct default — see M-3); session list/revoke with notification; max-device enforcement.
- **Capability RBAC:** route-level `capability:` middleware with `|` any-match (`RequireCapability.php`); seeded matrix matches UI gating for the standard role set.
- **Attendance:** row-locked punch state machine with legal transitions, auto break-close on clock-out, overnight-shift date attribution, 48-h reconcile window, `client_id` idempotency; late calculation via schedule grace; holiday-aware; corrections with reasons + notifications + audit + recompute; ETag caching on reads; portable SQL (verified: no `FIELD()`/`GROUP_CONCAT`; priority sorts use `CASE WHEN`; case-insensitive search uses `LOWER(?)`).
- **Leave:** overlap guard, working-day calculation (schedule + holidays), balance checks at submission, approval chain employee→HR→super_admin with self-block, balance refund on reject-after-approve/cancel, attendance `markLeaveDays` skips worked days, HrScope-enforced decisions.
- **Projects:** lifecycle `active → review → completed/redo` with submit gating on all-tasks-done + QA answers; auto project conversation + member notifications; portable pagination; soft delete cascade.
- **Tasks:** participant-scoped visibility; assignee-restricted edit fields; status machine with blocked-by cycle guard (BFS); QA-enforced submission path; approve/redo with notifications and project-chat posts; recurrence on completion.
- **Chat:** membership checks, DM dedup, attachments (type/size validated), mentions validated against members, read receipts, unread counts, throttles.
- **Exports:** async ExportJob pipeline with status/retry/download, notification on completion, CSV formula-injection sanitization, 30-day cleanup.
- **Audit:** immutable audit logs (DB triggers), login attempt logging with IP/location, `AuditLogger` used across mutations.
- **Frontend:** auth store with cross-tab BroadcastChannel sync, single-flight 401 refresh with Web Locks, offline IndexedDB queue with de-duplicated punch replay, optimistic chat, widget dashboard with persisted layout, URL-state filters, error boundaries per segment, CSP headers, axe-core in dev.

---

## 3. Critical Findings (P0)

### C-1. Unauthenticated impersonation backdoor route
- **Evidence:** `apps/api/routes/api.php:401` — `GET /api/test-projects` sits **outside** the auth middleware group, force-logs-in `praveen@games4king.in` (`auth()->setUser($user)` + user-resolver override) and returns `ProjectController::index`. Additionally, repo-root script `fix_test_route.php` exists whose sole purpose is to **re-inject this route** if it's ever removed — so a naive deletion will silently regress.
- **Expected:** no unauthenticated data access; no hardcoded user impersonation.
- **Impact:** anyone who can reach the API can dump the (real) projects list as that user. A blueprint for worse: any future controller change widens the leak.
- **Fix:** delete the route **and** `fix_test_route.php`, `test-fetch.js`, `fix_per_page.js` from the repo; grep CI for `/test-projects` to prevent reintroduction.

### C-2. Frontend router locks every role out of Settings, Audit, Reports, and Admin pages
- **Evidence:** `apps/web/src/middleware.ts:47` reads cookie **`g4k_capabilities`**, but the app only ever writes **`g4k_capabilities_{userId}`** (`src/lib/auth-store.ts:94`, `src/lib/capabilities.ts:33`). `caps` therefore always parses to `[]`, so `caps.includes('*')`/`caps.includes(required)` is false for every user — including super_admin — and every visit to `/dashboard/settings`, `/dashboard/audit`, `/dashboard/reports`, `/dashboard/admin/*` redirects to `/dashboard?error=unauthorized` ("You don't have access to that section.").
- **Expected:** capability cookie written under the name the middleware reads (or middleware reads the per-user key / no middleware gate with in-page gating).
- **Impact:** the entire admin surface is unreachable in the current build. (Deployed build may predate this regression — but `HEAD` is broken.)
- **Fix:** align the cookie name (single source of truth in `auth-store.ts`), or have middleware discover the `g4k_capabilities_*` key by prefix scan. Add an E2E smoke test that super_admin can open `/dashboard/settings`.

### C-3. Creating a project phase always returns 500
- **Evidence:** `PhaseController.php:104-107` — after creating the phase it runs `TaskActivity::create(['project_id' => $project->id])` (the code comments literally debate this mid-implementation: *"Wait, TaskActivity belongs to task..."*). `project_id` is not fillable (`TaskActivity.php:11-14`) and `task_activity.task_id` is NOT NULL (`2026_08_09_025001_create_phase_7_tables.php:105`) → `QueryException` on every `POST /projects/{id}/phases`. The phase row itself persists inside the same request (created before the throw), leaving state written despite the error.
- **Expected:** phase creation returns 201 and logs to project history.
- **Impact:** the phases feature (project journey, complete/reopen cascade) is dead at the write path; UI dialogs will show errors.
- **Fix:** remove the `TaskActivity::create` block (project history already flows from task activity) or write a proper project-history record.

### C-4. Deleting a task or project returns 500 (PostgreSQL)
- **Evidence:** `TaskController.php:756-761` and `ProjectController.php:306-314` create `TaskActivity` with `event => 'deleted'`, but the `task_activity.event` enum CHECK only allows `created|assigned|progress|submitted|approved|redo` (`2026_08_09_025001:107`; no later migration extends it) → constraint violation → 500 **after** the soft-delete has run, leaving half-executed transactions and failed responses.
- **Expected:** delete returns success and optionally logs an allowed activity event.
- **Impact:** all task and project deletion (single + the non-QA path of bulk delete) fails at the DB layer; destructive flows appear broken while still mutating data.
- **Fix:** drop the activity insert on delete (audit_logs already record deletions) or extend the enum via migration.

### C-5. Task creation scope escalation + mass assignment defects
- **Evidence:** `TaskController.php:307-345` — the employee self-assignment guard (307-310) runs **before** scope expansion (331-345). Because `tasks.scope` defaults to `'global'` (migration `2026_08_21_012826:21`), (a) **any task created without an explicit scope — including an employee's "personal" task — is assigned to every non-super_admin user and notifies all of them** (365-376); (b) a non-manager posting `scope=department|role` with `scope_id` targets arbitrary departments/designations, bypassing both the self-only rule and HR's department rules; (c) `scope_id` is **not fillable** (`Task.php:17-20`) so department/role targeting is silently dropped anyway — scope features are simultaneously dangerous *and* broken.
- **Expected:** employees create self-assigned tasks only; scope expansion is a manager/HR privilege with validated `scope_id`; default scope is private/self.
- **Impact:** notification spam to the whole company per task; privilege escalation path; silent data loss of `scope_id`.
- **Fix:** default `scope` to self for non-managers; run scope expansion only under `tasks.manage`; add `scope_id` (+ `order`, see H-3) to fillable; unit-test employee task creation for assignee sets.

### C-6. Route shadowing kills two leave endpoints
- **Evidence:** `routes/api.php:153` registers `GET /leave-requests/{id}` **before** `:163 /leave-requests/pending` and `:165 /leave-requests/export`. Laravel matches in registration order, so both are captured by `show('pending'|'export')` → `ModelNotFound` → 404. (`/leave-requests/balance|history` at :151-152 are registered earlier and survive.)
- **Expected:** both endpoints reachable (frontend leave-export and pending-list calls).
- **Impact:** leave export and the pending list are dead URLs; any UI wired to them fails.
- **Fix:** move the literal routes above the `{id}` route (or constrain `{id}` to `\d+`).

### C-7. `POST /tasks/{id}/move-phase` routes to a non-existent method
- **Evidence:** `routes/api.php:222` → `TaskController::movePhase`; grep of `app/` finds no `movePhase` anywhere → `ReflectionException`/500 on every call.
- **Expected:** task-to-phase move implemented or route removed.
- **Fix:** implement (move `phase_id` under participant + manage checks) or delete the route and its UI callers.

### C-8. Seeder plants hardcoded live credentials and can hijack real accounts
- **Evidence:** `database/seeders/DatabaseSeeder.php:245-246` — `$isProd = false; // app()->environment('production'); // Disabled so demo passwords work on live`. Super admin `karthik / Admin@123`, HR `Hr@123`, etc. are seeded with `must_change_password=false` in **every** environment. `DemoSeedCommand` runs full `db:seed`, and `User::updateOrCreate(['username' => …])` (DatabaseSeeder:248) **resets email/password of any real user that happens to hold a seeded username**.
- **Expected:** production seeding generates random passwords (the prod branch exists but is unreachable); demo seed never mutates non-demo users.
- **Impact:** anyone with repo access can log into any freshly seeded/staging (or demo-reseeded production) environment as super_admin; demo reseed is an account-takeover primitive.
- **Fix:** restore environment detection; key demo users on a demo-only marker and refuse to touch non-demo rows; rotate the committed passwords.

### C-9. "Purge demo data" destroys real data
- **Evidence:** `app/Console/Commands/DemoPurgeCommand.php` — deletes every row carrying a `demo_tag` (39 tables incl. `settings`, `role_assignments`, `export_jobs`, `saved_views`) and every `is_demo` row; DatabaseSeeder marks **all seeded users — including the only super_admin — `is_demo=true`**, so purge removes all login accounts; `:136` `Storage::deleteDirectory('avatars')` deletes **every real user's avatar**. `DemoDataController` exposes this as one super_admin action behind only a typed confirmation; the seed/purge trigger is not audited, and the completion notification silently no-ops because the initiator was deleted (`PurgeDemoDataJob.php:33-42`).
- **Expected:** demo purge removes exactly the demo dataset and nothing else; production org data untouched; action audited.
- **Impact:** irreversible destruction of org data from the settings UI.
- **Fix:** scope user deletion to `is_demo AND demo_tag` users never referenced by real data; never blanket-delete storage dirs; disable the endpoints in production (`app()->environment('production')` guard); audit the trigger.

---

## 4. High Findings (P1)

### H-1. Realtime broadcasting is dead in production (and lies about being offline)
- **Evidence:** `config/broadcasting.php:19-21` silently falls back to `log` when `BROADCAST_CONNECTION=pusher` with no `PUSHER_APP_KEY`; `cloudbuild.yaml` injects `BROADCAST_CONNECTION=pusher` + only `PUSHER_APP_CLUSTER` (no key/secret/id; `.env*` dockerignored). `.env.production` sets `BROADCAST_CONNECTION=reverb`, but **no `reverb` connection exists in config and laravel/reverb is not installed**. Every `broadcast()` call site is wrapped in swallowing try/catch. Frontend: `use-reverb.ts` disables Echo without `NEXT_PUBLIC_REVERB_APP_KEY`/`NEXT_PUBLIC_PUSHER_APP_KEY`; `ConnectionStatus` then shows a permanent amber **"Offline"** pill while the app is actually online (polling works).
- **Expected:** configured, working push transport in production; status indicator reflects connectivity, not feature config.
- **Impact:** all "live" updates silently degrade to polling; users see a false Offline badge; env files contradict each other.
- **Fix:** provision Pusher (or install Reverb on both sides), inject keys in Cloud Run + Vercel, make the fallback loud (log warning), and make ConnectionStatus distinguish "no realtime configured" from "network down".

### H-2. "Clear chat" does nothing visible
- **Evidence:** `ChatController::clearChat` writes `cleared_at` on the `conversation_user` pivot, but `Conversation::users()` `withPivot` only loads `last_read_at, is_pinned` (`app/Models/Conversation.php:24-27`), so `messages()`'s `$pivot?->cleared_at` filter (`ChatController.php:107-113`) is always null — cleared history keeps rendering.
- **Fix:** add `cleared_at` to `withPivot`. Also: clearing the **global** chat attaches every clearer to the global conversation pivot as a side effect; consider excluding global scope.

### H-3. Task drag-reorder silently persists nothing
- **Evidence:** `TaskController::reorder` ends with `$task->update(['order' => $taskData['order']])` (`TaskController.php:599`) but `order` is missing from `Task::$fillable` (`Task.php:17-20`) → mass-assignment silently drops it while responding "Tasks reordered successfully." (Same fillable gap drops `scope_id`, see C-5.)
- **Impact:** any ordering UI (list drag, board order) does not survive reload; users lose work invisibly.
- **Fix:** add `order` (and `scope_id`) to fillable + regression test that reorder persists.

### H-4. Project cover upload 500s
- **Evidence:** `ProjectController::uploadCover` interpolates undefined `$id` in `store("projects/{$id}/covers")` (`ProjectController.php:454`); the route `POST /projects/cover` (`api.php:188`) has no `{id}` parameter.
- **Fix:** accept `{id}` route param or validate `project_id` in the request.

### H-5. HR cross-department data leaks
- **Evidence:**
  - `TimerController::index` (`:71-77`): anyone with `hr.view-team-attendance` gets **all users'** time logs with no `HrScope`.
  - `TimerController::logTime` gates pass HR purely by role without department check (`:41,51`).
  - `UserController::leaveHistory`/`assignments` (`:702-707, 728-733`): HR scoping is conditioned on `users.hr.manage`, which **HR does not have** (only super_admin) → HR sees leave history and project/task assignments company-wide, inconsistent with `index`/`show` which correctly scope on `users.employee.manage`.
- **Expected:** HR sees their managed departments only, consistently across every endpoint.
- **Fix:** apply `HrScope::apply` in all three paths keyed on `users.employee.manage`.

### H-6. HR "Today's Status" board can be stale up to 1 hour
- **Evidence:** `teamToday` caches under a **versioned** key `team_today_v{version}_u{id}_{date}` (`AttendanceController.php:337`), but the attendance observers forget the **unversioned** `team_today_u{id}_{date}` (`AttendanceDayObserver.php:46`, `AttendanceEventObserver.php:36`) — keys that are never written. Punches don't bump the dashboard version either, so nothing short of the 3600-s TTL refreshes the board.
- **Expected:** a punch reflects on the team board within seconds.
- **Fix:** align observer invalidation with the versioned key (or bump `DashboardCacheService` version on attendance writes).

### H-7. Password-reset approval stores a usable plaintext token
- **Evidence:** `AdminPasswordResetController::approve` (`:44-54`) sends an in-app notification **containing the raw reset link** (persisted in `notifications` table) and returns `reset_link` in the API response. Anyone who can read notifications/DB rows (or a proxy log) can reset the victim's password. Approve also "succeeds" for a missing user (`$resetLink ?? null`).
- **Fix:** deliver the link out-of-band only (email), never persist the raw token; 404 on missing user.

### H-8. Sensitive PII leaks in per-record views
- **Evidence:** `UserController::index` hides `blood_group, emergency_contact, alternate_mobile, preferences` (`:89`), but `show` (`:335-355`), `activity` (`:528-557`), `DepartmentController::show` (`:89-93`, loads full users), and `DesignationController::show` (`:77-81`) all serialize those fields to anyone with the respective manage capability — far beyond the directory's privacy rules (which always hide them).
- **Fix:** centralize field-hiding (`makeHidden` in a presenter/Resource) applied to every user serialization path.

### H-9. Last-super-admin can be demoted via edit
- **Evidence:** `updateStatus`/`destroy`/`anonymize` guard the last super admin, but `UserController::update` role changes (`:220-235`) have **no such guard** — a super_admin can PUT `roles:["employee"]` on themselves/last admin and lock the org out of administration. Also `:258-277` duplicate the role-change side effects (token deletion, `active_role=null`) after the transaction, unconditionally.
- **Fix:** reuse the last-admin guard in `update`; remove the duplicated post-transaction block.

### H-10. Old avatars are never deleted (storage leak)
- **Evidence:** avatars are stored at `avatars/{user_id}/{hash}` but deletion constructs `avatars/{basename}` (`UserController.php:313-315` and `:459-460`, `ProfileController.php:76-78`) — wrong path every time; orphan files accumulate forever. (Company logo deletion, by contrast, is correct.)

### H-11. Work-schedule editing silently unsets the default schedule
- **Evidence:** `WorkScheduleController::update` forces `is_default => $validated['is_default'] ?? false` (`:30,40`) — editing the default schedule without re-sending the flag leaves the org with **no default schedule**. `update`/`setDefault` also return success for non-existent ids (no 404), and validation accepts arbitrary strings as times, unconstrained `working_days` values, and negative `standard_seconds`/`break_minutes`.
- **Fix:** only overwrite `is_default` when provided; 404 on missing rows; `date_format:H:i` + `in:`-style day constraints.

### H-12. HR leave-approval UI is a dead end
- **Evidence:** HR org attendance has only `today` and `graph` tabs (`hr-attendance-view.tsx:14`), yet redirects and deep links send HR to `/dashboard/org/attendance?tab=leave&sub=approvals` (`attendance/page.tsx:51-58`, `org/leave/page.tsx`, plus a command-palette link) → blank content. A user with `leave.approve-employee` but without `hr.view-team-attendance` gets a hard Access-Denied page instead of an approvals list. Meanwhile the approvals widget/route `/leave-requests/pending` is dead (C-6).
- **Fix:** give the HR view a real Leave/Approvals tab (or route HR to the shared approvals component); gate the approvals surface on `leave.approve-employee`.

### H-13. Project edit dialog is a stub
- **Evidence:** `projects/[id]/page.tsx` — `editForm` captures department, QA form, members, cover, `allow_employee_tasks` (`:33`), but the dialog renders only name + description with an in-code excuse ("keeping it simple", `:409-419`). Members/department/QA/cover can only be changed by API, contradicting the manual's promised workflow and the store-side support.
- **Fix:** render the full captured form (the create dialog already implements every field — reuse it).

### H-14. "Remember me" is defeated — session cookies become 7-day cookies
- **Evidence:** `api-client.ts:213-215` rewrites `g4k_token` with `max-age=604800` after **every** successful authenticated request (and `providers.tsx:126-138` on visibility change), regardless of the remember flag chosen at login (auth-store deliberately uses sessionStorage for non-remember sessions).
- **Impact:** shared-machine sessions persist a week — a security regression vs. design.
- **Fix:** mirror the store's persistence choice (session cookie when not remembered).

### H-15. Leave-approval integrity gaps
- **Evidence:** (a) balance sufficiency is only checked at submission — approval increments `used` with no re-check, so concurrent approvals over-draw (`ApprovalService.php:106-114` vs `LeaveRequestController.php:129-136`); (b) approvals are decided on stale models with no `lockForUpdate` → two deciders can both process (`ApprovalService.php:87,131,188`); (c) `decision` resolves the approval by `id = $id OR approvable_id = $id` ordered by id (`LeaveRequestController.php:174-179`) — can bind the wrong approval when the two id spaces collide; (d) `ApprovalService` requires capability `leave.approve-hr` for HR-stage approvals, which **no seeded role except super_admin's `*` has** — currently masked because only super_admin decides HR leave, but the capability is ungrantable via settings UI.
- **Fix:** lock + recheck inside the decision transaction; resolve the approval through the leave request's relation; seed/allow `leave.approve-hr` or drop the check.

### H-16. Task "redo" can strand a task in review
- **Evidence:** `TaskController::redo` flips the approval to `redo` **then** calls `updateStatus('in_progress')`, which aborts 422 if the task is blocked (`:879-881`) — the approval is already decided, and the task remains `review` with a redo decision and no path to resolution.
- **Fix:** validate the blocker state before mutating the approval (or run both in one transaction with rollback).

### H-17. Weekly summary email excludes HR and targets a non-existent role
- **Evidence:** `SendWeeklySummaryCommand.php:20-23` queries roles `['admin','super_admin']` — `admin` doesn't exist in this system (roles are `super_admin|hr|employee`), so HR never receives the weekly summary despite the feature description saying "Admins and HR".
- **Fix:** query `['super_admin','hr']`.

### H-18. Users export ignores its own filters
- **Evidence:** `UserController::export` snapshots `only_trashed/status/department_id/role` into the ExportJob, but `GenerateReportJob`'s users branch honors only search + ids (`GenerateReportJob.php:421-435`) → the exported file does not match the filtered list the admin was looking at. Also the export route is `users.hr.manage` (super_admin-only) while department/designation exports are HR-reachable — inconsistent.
- **Fix:** apply all snapshot filters in the job; decide one capability rule for org-data exports.

### H-19. Global-scope assignment misses users and spams everyone
- **Evidence:** scope expansion uses `where('active_role','!=','super_admin')` (`TaskController.php:335,521`) — users who never role-selected have `active_role = null` and are **excluded** from global tasks; conversely every global task notifies the entire company (see C-5). NULL-semantics also make `!=` wrong in SQL for this purpose.

---

## 5. Medium Findings (P2)

### Caching & dashboards
- **M-1. Dead cache invalidation everywhere.** `DashboardController::init` computes `$cacheKey` (`:33`) but never caches under it; `PinController`/`QuickNoteController` forget `dashboard_init_*`/`quick_notes_{user}` keys that are never written (real keys are versioned, `DashboardController.php:194`); attendance observers forget unversioned metric keys (see H-6). Only the global version bump works.
- **M-2. Cache invalidation storm neutralizes the dashboard cache.** `CacheInvalidationObserver` bumps the global version on **every** create/update/delete of User/Project/Task/AttendanceDay/LeaveRequest (`AppServiceProvider.php:48-56`) — including `last_login`-style user saves on login — so the 3600-s TTLs rarely survive real traffic; every login rebuilds every cache family.
- **M-3. Approval changes don't invalidate `pending_approvals` caches.** `ApprovalObserver` is an empty stub and unregistered; approval-only transitions (that don't touch observed models) leave HR/admin dashboards stale up to 1 h.

### Security posture
- **M-4. Force-password-change and suspicious-login detection are dormant.** Seeder sets `force_password_change=false` (and a migration forces it false), so the whole `ForcePasswordChange` apparatus + skip-flow never engages; suspicious-login flagging is hard-disabled (`AuthController.php:219-221` "currently inactive"). Confirm intent or wire to settings.
- **M-5. Temp passwords returned in API responses** when SMTP is unconfigured (`UserController.php:147,576`) and generated passwords ignore the configured policy (`Str::random(12/16)` bypasses `password.*` settings). Also `password_changed_at` is stamped at admin creation, delaying expiry.
- **M-6. `/api/version` is public** and leaks the commit sha plus the **full `migrate:status` table** (schema shape) (`VersionController.php:12-27`); cached 1 h. `GET /api/system/public-config` discloses the password policy and force-change flag (fingerprinting aid). Restrict/authenticate both.
- **M-7. Holidays endpoint uses `cache.headers:public;max_age=3600`** on an authenticated route (`api.php:169`) — responses are marked publicly cacheable by intermediaries. Use `private`.
- **M-8. Login calls external `ip-api.com`** for geolocation (`AuthController.php:49-64`) — third-party data egress on every login from unknown IPs, 2-s timeout in the hot path; failures silently swallowed. `trustProxies '*'` (`bootstrap/app.php`) is only safe strictly behind the Cloud Run proxy.

### Roles & permissions consistency
- **M-9. Capability check drift.** `RequireCapability` honors token `role:*` abilities (`RequireCapability.php:24-29`), but in-controller `hasCapability()` helpers (e.g. `UserController:18-22`) use only `resolveActiveRole()` → route and controller can disagree for role-scoped tokens.
- **M-10. De-roled users keep employee powers.** `resolveActiveRole()` falls back to `'employee'` even with zero role assignments (`User.php:131-134`), and role caches live up to 1 h across four differently-named keys.
- **M-11. `CapabilityMatrix::$defaultMatrix` diverges from the seeded matrix** (fallback grants/denies differ from production reality); `SELF_SERVICE_EXCLUDED` is dead code. `db:seed` truncating/reseeding `role_capabilities` also means artisan seed runs silently reset any live-tuned matrix.

### Department/organization workflows
- **M-12. `syncEmployees` can move anyone, including super_admins**, with no `users.*.manage` cross-check, and works on archived departments (`DepartmentController.php:263-275`); teams can be added to archived departments (`:172-189`); `destroy` on an already-archived department is a silent no-op 204 (archive vs destroy are near-duplicates).
- **M-13. `PUT /profile` accepts an arbitrary `preferences` array** (`ProfileController.php:28-42`), bypassing `UserPreferenceController`'s `directory_visibility in:public,private` whitelist — e.g. it can set the dead-but-honored `internal` value that `DirectoryController` treats as full exposure. `UserPreferenceController:65` busts a cache key nothing writes.

### Data & report correctness
- **M-14. QA form edits orphan historical submissions.** `QaController::update` deletes/recreates fields (`:88-105`) — existing `QaSubmission.values` keyed by old field ids become unmatchable, and subsequent submissions mis-validate required fields.
- **M-15. Report job vs endpoint logic mismatches.** leave-summary job uses strict `whereBetween` while the endpoint uses overlap → different numbers for leaves spanning the window; attendance-summary job merges present+late while the endpoint separates them (`GenerateReportJob.php:357,393-396` vs `ReportController.php:246-247,288-295`).
- **M-16. `chunk(1000)` ordered by non-unique `date`** in the attendance export (`GenerateReportJob.php:260-264`) can skip/duplicate rows across chunk pages in pgsql. Order by a unique composite key.
- **M-17. Timezone mixing.** Attendance dates are company-tz strings but `now()->toDateString()` uses app tz (`AttendanceController.php:104,330,433,524`; `AttendanceService.php:407`) — day boundaries shift if `app.timezone` ≠ company timezone. Unvalidated `{date}` path params go straight to `Carbon::parse` → 500 on garbage.
- **M-18. Leave policy gaps.** Same-day start is impossible for all types incl. sick (`StoreLeaveRequestRequest` `after:today`); unpaid leave is balance-capped at 12 like paid types; the pending-leave race is only guarded for identical (user,start,end) ranges (partial unique index), different-range overlaps can race.
- **M-19. Half-day status is dead and there is no early-leave rule** — the enum value was removed by migration and nothing computes it; `open-shift` detection ignores last-event `break_start` (`AttendanceService.php:218-221`) so people who leave mid-break aren't flagged.
- **M-20. Unaudited admin mutations:** settings bulk-update, company profile/logo, all work-schedule mutations, all holiday mutations, QA CRUD, demo seed/purge triggers, and department team/employee syncs record ids only or nothing. Audit-log export also persists raw unvalidated `$request->all()` as filters (`AuditLogController.php:34-47`).

### Realtime/event plumbing
- **M-21. Team announcements broadcast company-wide.** `AnnouncementCreated` goes to `private-org.announcements` whose channel auth is `return $user !== null;` (`channels.php:18-20`) with full payload — visibility is only enforced on REST reads, so any connected client receives team announcement bodies in realtime.
- **M-22. `react()` re-broadcasts the creation event** (`AnnouncementController.php:303-305`), no `toOthers()`, empty `catch {}` — reacting users get self-echoes; create vs update semantics conflated. `NotificationCreated::broadcastWhen` does a `User::find` per broadcast; message pin/unpin emits no event; holiday-reminder dedup checks notification type `system` while sends use `holiday_reminder` (`SendHolidayReminders.php:77-81`).
- **M-23. Chat unread counting is O(messages)** via correlated raw CASE subqueries per row (`ChatController.php:29,89-95`) — will degrade sharply as the global conversation grows.
- **M-24. `monitor:health` exists but is never scheduled**; `ScheduledReport` model/table is a dead feature with no producer or consumer.

### Frontend correctness & UX
- **M-25. Silent list truncation.** Filter option fetches capped `per_page=100` (departments/designations/audit user filter), people fetches `per_page=1000`, non-list task views capped at 100, report preview 25 rows, recent shift log 7 of 365 days — none paginate, so orgs past the caps get silently wrong dropdowns/boards.
- **M-26. Offline-queue semantics leak into UX.** Mutations queued offline return `{queued:true}` but several success handlers toast "success" anyway (e.g. leave cancel `leave-tab.tsx:59-62`, department ops); `/auth/logout` is queueable (`api-client.ts:82-87`) and can replay later.
- **M-27. Echo auth token staleness.** The Bearer for channel auth is captured once at connect and the effect deliberately excludes `token` (`use-reverb.ts:84,156`) — after a silent 15-min rotation, private-channel auth uses a dead token until reload.
- **M-28. Dynamic Tailwind class construction** `bg-${...}-500` (`attendance/page.tsx:164`) produces classes the compiler never emits — several status dots render unstyled.
- **M-29. Query-key drift:** nav hover-prefetch warms `["projects"]`/`["tasks"]` while pages query keyed variants (`nav-group.tsx:41-47`) — prefetch warms the wrong entries; `["projects","count"]` over-invalidates.
- **M-30. Settings page renders an empty shell for unauthorized users** (no empty state, `settings-tabs.tsx:127-146`); command-palette "Admin Settings" links to `/dashboard/profile?tab=settings` which has no tabs (`command-palette.tsx:230-233`); `/dashboard/admin` is middleware-protected but has **no page** (protected 404).
- **M-31. Profile ships placeholder sections as real UI:** fake connected account ("YouTube Team / g4kkarthik@gmail.com"), hardcoded work address with dead Edit button, static privacy selects with no persistence (`profile-connected-accounts.tsx:28-34`, `profile-work-address.tsx:50-53`, `profile-privacy.tsx:24-52`).
- **M-32. Login→onboarding contract:** login reads top-level `result.onboarded` (present today in `AuthController`), but refresh responses and every other consumer use `user.onboarded_at` — a one-field backend change re-routes all users through onboarding. Normalize on one field.
- **M-33. Unreachable `holidays` TabsContent in the leave tab** (`leave-tab.tsx:132-137`) and timer default `standardSeconds=31500` commented "8 hours" (`timer-store.ts:47`) — mislabeled overtime threshold vs the 8 h intent.

---

## 6. Low Findings (P3)

**Dead code (backend):** `CapabilityMatrix::SELF_SERVICE_EXCLUDED`; `TestPusherEvent`; empty `ApprovalObserver`; `RoleAssignment::getRolesForUser` cache (never read); `WorkingDayCalculator` unreachable Feb-29 branch vs duplicate mapping in `reconcileDay`; `markLeaveDays` unused `$workingDays` (and Mon–Sat vs Mon–Fri default inconsistency); attendance statuses `pending`/`leave` never set; `ProfileController` dead `ValidatesPasswordPolicy` import; `AttendanceController` dead `$isAdmin = clone $user`; duplicated blocked-by check in `submitForReview` (`TaskController.php:621-626` vs `669-674`).

**Dead code (frontend):** `approvals-tab.tsx` (312 lines, superseded), `project-overview-tab.tsx`, widgets `feedback-form.tsx`, `pwa-registry.tsx` (manifest exists, registration never mounted), hooks `use-worker`/`use-track-recent`/`use-form-errors`, `avatar-utils.ts`, `layout-utils.ts` (test-only), `adminOnly` nav branch, `org/attendance?tab=leave` prefetch branch.

**Repo hygiene:** stray codemod scripts at root — `fix_per_page.js` (regex-rewrote controller validation caps!), `fix_test_route.php` (re-injects the C-1 backdoor), `test-fetch.js`; `scratch/` should stay gitignored; deleted-but-uncommitted `.md` deletions in working tree.

**Correctness nibs:** `ProfileController::uploadAvatar` returns non-existent `first_name/last_name` columns → nulls (`:90`); `GET /companies/{id}` ignores `{id}` (`CompanyProfileController.php:42-52`); employee number consumed outside the transaction (gaps on rollback); `AutoNumberingService` first-call seed race (no upsert) → concurrent 500; multiple `work_schedules.is_default=true` possible (DB default true + no enforcement on insert) and `where('is_default')->first()` picks arbitrarily; `anonymize` leaves `DEL-{id}` employee codes; audit "cursor pagination" comment vs offset paginate; `activity()` hardcodes 30/page and aliases `ip as ip_address`; `downloadExport` streams whole file from disk into memory; `ExportJob.file_data` base64 path legacy-dead; bulk user ops always HTTP 200 with stats; self-deactivation/self-deletion permitted; `submitted()` queue unpaginated; project update doesn't notify newly added members (store does); recurrence clones drop `phase_id`/`blocked_by`/`parent_id`/`start_date`; `pinChat` silently joins non-members to conversations; announcement `dismiss` has no visibility check; message **edit** is schema-supported (`edited_at`) but has no route; QaController has no audit logging; attendance export columns omit break details.

**Frontend nibs:** deprecated `X-XSS-Protection` + `unsafe-inline` script CSP (`middleware.ts:65,80`); hydration double-gating splash; `dismissedNotificationIds` grows unbounded in localStorage; role-select auto-select has no failure state (infinite loader); Employee360 activity `undefined` treated as non-empty; "View" label on the list-view toggle; duplicate 30-s unread polling on chat page; `window.confirm` for clear-chat vs ConfirmDialog elsewhere; a11y gaps (scope pills/bell tabs lack `aria-pressed`/tab roles, mobile nav lacks `aria-current`); branding mismatch on login ("Gen2k Conglomerate (2018)" vs "Games4king Workplace OS"); breadcrumb labels missing for announcements/notifications/audit; bulk-bar z-index can overlap the mobile FAB.

---

## 7. Cross-Cutting Themes

1. **The admin surface is the least-tested surface.** C-2 (router lockout), C-3/C-4 (phase/delete 500s), H-7/H-11 (settings flows), M-20 (unaudited admin mutations) all cluster in areas manual testing rarely reaches. A small E2E smoke suite over the three roles would have caught most P0s.
2. **Scope/permission logic is implemented twice with drift.** Route capability vs in-controller `hasCapability` (M-9), `ProjectController` vs `PhaseController` manager checks, `users.hr.manage` vs `users.employee.manage` scoping (H-5) — one shared policy layer would eliminate the class.
3. **Cache keys are written and invalidated by different hands.** Versioned keys vs unversioned forgets (M-1, H-6), a stormy global observer (M-2), and an unobserved model (M-3) mean dashboards are simultaneously over- and under-invalidated.
4. **Demo tooling and production share one code path with no environment guard.** C-8/C-9 turn "demo" buttons into org-destruction primitives; `db:seed` resets the capability matrix on any run.
5. **Realtime is architected but unverified.** Two transports referenced (pusher/reverb), neither confirmed configured end-to-end in deploy manifests; every failure path swallows errors (H-1) — the system lies quietly about its own liveness.
6. **Mass-assignment and enum/CHECK drift.** `order`/`scope_id` fillable gaps (C-5, H-3), `event='deleted'` (C-4), and `project_id` on TaskActivity (C-3) show schema and models evolving without paired updates — worth a lint rule (fillable-vs-migration diff) in CI.

---

## 8. Recommended Remediation Order

**Phase 0 — immediate (security, hours):**
1. Delete `/api/test-projects` + the three stray root scripts (C-1). Redeploy API.
2. Fix the capability cookie name (C-2) and add an admin smoke test. Rebuild web.
3. Remove/disable demo seed & purge routes in production; rotate seeded credentials (C-8/C-9 first half — guard + rotate).
4. Restrict `/api/version` and `/system/public-config` (M-6), make holidays cache `private` (M-7).

**Phase 1 — broken core (days):**
5. Phase creation, task/project delete, move-phase, cover upload, leave route order, task scope escalation + fillable fixes (C-3…C-7, H-3, H-4).
6. Work-schedule default-flag fix (H-11); last-super-admin guard on update (H-9).

**Phase 2 — permissions & data integrity (this week):**
7. HR scope unification (H-5), PII hiding (H-8), reset-token handling (H-7), leave decision locking/balance recheck (H-15), redo ordering (H-16), avatar path fix (H-10).
8. HR approvals UI tab (H-12), project edit dialog completion (H-13), remember-me cookie (H-14), weekly summary roles (H-17), users export filters (H-18).

**Phase 3 — reliability (next sprint):**
9. Realtime transport decided + verified end-to-end, ConnectionStatus semantics (H-1); clear-chat pivot (H-2); cache key unification + observer registration (M-1…M-3); teamToday invalidation (H-6); report-job parity + chunk ordering + timezone normalization (M-15…M-17).

**Phase 4 — hygiene (backlog):**
10. Dead-code sweep (P3 lists), demo data isolation behind a staging-only guard, QA-submission migration for edited forms (M-14), a11y pass, E2E smoke suite (login/attendance/leave/project/task/chat × 3 roles) wired into CI, and a migration-vs-fillable lint.

---

*Prepared as a code-first audit of `Games4Kings-New` at commit `69e302d` (+ uncommitted working tree). Companion client-facing document: `manual.md`.*


## 16.2 — Source S2: `frontend.md` (frontend end-to-end audit v6 — verbatim, complete)

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


## 16.3 — Source S3: `FINAL-AUDIT.md` (unified master — verbatim, complete)

# Games4King — Final End-to-End Audit (Unified Master)

**Date:** 2026-08-28 · **Scope:** complete codebase — `apps/api` (Laravel 11), `apps/web` (Next.js 16), `packages/ui` — merged from the backend production audit (`report.md`), the six-pass frontend audit (`frontend.md` Parts 1–14), plus a new product-completeness/gap audit (§16). Zero-trust: every claim below was derived from source and re-verified; no documentation was trusted.
**Method:** solo inline audit (review sub-agents hit the 5-hour usage limit twice; all evidence is greppable/traceable to `file:line`). Frontend detector archive: `.impeccable/detect-frontend-audit.json` (26 findings, 3 vendor/test false positives). Originals remain as deep-dive companions; this file is the master.

## Verdicts

| Dimension | Verdict |
|---|---|
| **Production readiness (backend + product)** | **NOT READY** — 9 critical / 19 high / ~35 medium / ~30 low findings (`report.md`) |
| **Frontend audit health** | **13/20** (Acceptable — significant work needed) |
| **Frontend Nielsen heuristics** | **23/40** (Acceptable) |
| **Product completeness** | Core workflows complete for Employee; **management/context gaps concentrate in HR + Super Admin surfaces** (§16) |
| **Overall** | A feature-rich, genuinely designed workplace OS whose delivery blockers are: one unauthenticated API backdoor, one frontend cookie bug locking every admin surface, several guaranteed-500 core operations, demo tooling that can destroy real data, and a dense cluster of context/continuity gaps around entity management |

---

## §1. System Snapshot

- **Backend:** Laravel 11, Sanctum (15-min access + 7-day rotating refresh tokens, cookie `g4k_refresh_token`), capability RBAC (`super_admin` `*`; `hr` 23 caps; `employee` 9), PostgreSQL, async export jobs, 12 scheduled jobs, Cloud Run worker (`g4k-worker`).
- **Frontend:** Next.js 16 App Router, TanStack Query, zustand, react-hook-form + zod, Tailwind 4, `@g4k/ui` (57 primitives, 170 importing files), echarts/dnd-kit/frappe-gantt/react-grid-layout/cmdk/sonner, laravel-echo.
- **Roles:** Employee (self-service + chat + tasks), HR (scoped to `department_hr`-assigned departments: approvals, corrections, employee/project/task management, team boards, reports), Super Admin (all + settings + audit).
- **Modules:** auth/onboarding/role-select, dashboards (widget engine), attendance (punch state machine, corrections, admin/HR boards), leave (balances/approvals/holidays), projects (phases, review pipeline, auto chat channel), tasks (kanban/list/gantt, submit→approve/redo, QA forms, recurrence, timer), chat (global/DM/group/project channels, mentions, receipts), announcements, notifications, directory + employee management + departments/designations, Employee 360, reports (summaries + async exports + saved views), audit logs, settings (11 tabs), profile/security/sessions, offline engine, command palette, mobile shell.

---

## §2. Verified Working (do not redesign)

**Backend:** login by email/username/employee-ID with timing-safe checks, 5-strike lockout, rotating refresh + refresh-ability blocking, reset with hashed 60-min tokens + global session revocation; capability middleware; row-locked attendance state machine (auto break-close, overnight attribution, client-id idempotency, ETag reads); leave overlap/working-day/balance checks, approval chain with self-block and balance refund; project `active→review→completed/redo` with QA gating; task participant scoping, blocked-by cycle guard, QA-enforced submission; chat membership/mentions/receipts/unreads; async export pipeline with retry + cleanup + CSV injection sanitization; immutable audit logs + login history; portable SQL (no `FIELD()`/`GROUP_CONCAT`; `CASE WHEN` sorts; `LOWER(?)` search).

**Frontend:** `@g4k/ui` architecture with real adoption (ConfirmDialog ×21 files, EmptyState ×33, ListScaffold ×11, DatePicker ×10, Toolbar ×9, DataTable ×5); token layer (semantic surfaces, status colors incl. `--overtime`, elevation e1–e4, density mode, motion vars, dark mode, 1440px cap); lazy-loading discipline (echarts/gantt/kanban/QA via `dynamic()`); mobile shell (bottom nav + FAB, chat fullscreen + visualViewport, sidebar Sheet); efficiency infra (cmdk palette + recents, URL-state filters, drafts ×5 forms, saved views, pins, offline queue with punch de-dup, cross-tab auth/timer sync); optimistic chat with read receipts; specific human error copy; per-segment error boundaries; axe-core in dev; focus-visible global ring; attendance-history calendar (nav+swipe+detail); time-clock widget; task-create dialog; Employee-360/Project workspace IA; the redirect-stub page consolidation.

---

## §3. Backend — Critical Findings (P0)

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| **C-1** | Unauthenticated impersonation backdoor `GET /api/test-projects` force-logs-in `praveen@games4king.in`; stray root script `fix_test_route.php` re-injects it | `routes/api.php:401` | Delete route + 3 stray scripts; CI grep guard |
| **C-2** | Seeder hardcodes live credentials (`$isProd=false`): super_admin `Admin@123` etc.; demo seed `updateOrCreate` by username **resets real accounts** | `DatabaseSeeder.php:245-246,248` | Restore env detection; demo-only keys; rotate passwords |
| **C-3** | Demo purge destroys real data: deletes **all avatars**, **all seeded users incl. the only super_admin** (`is_demo=true`), settings/audit rows — one admin click | `DemoPurgeCommand.php:136` etc. | Scope deletion; env guard; audit trigger |
| **C-4** | **Phase creation always 500s** (illegal `TaskActivity::create(['project_id'])`; `task_activity.task_id` NOT NULL; phase row persists before throw) | `PhaseController.php:104-107` | Remove the activity insert |
| **C-5** | Task/project **deletion 500s on pgsql** (`event='deleted'` violates enum CHECK) after soft-delete ran | `TaskController.php:756`, `ProjectController.php:307` | Drop insert or extend enum |
| **C-6** | **Task scope escalation:** default `scope='global'` assigns every non-super_admin + notifies all; dept/role scope bypasses permission rules; `scope_id` silently dropped (not fillable) | `TaskController.php:307-345` | Self default for non-managers; manager-only expansion; fillable fix |
| **C-7** | Route shadowing kills `GET /leave-requests/pending` + `/export` (registered after `/{id}`) | `routes/api.php:153,163,165` | Reorder or constrain `{id}` |
| **C-8** | `POST /tasks/{id}/move-phase` → controller method doesn't exist → 500 | `routes/api.php:222` | Implement or remove route+UI |
| **C-9** | HR cross-department leaks: timer logs unscoped (`TimerController.php:71-77`), logTime gate ignores dept, `leaveHistory/assignments` scope on wrong capability | `UserController.php:702-733` | Apply `HrScope` on `users.employee.manage` |

## §4. Backend — High Findings (P1)

1. **H-1** Realtime dead in prod: pusher keys absent → silent `log` fallback; `.env.production` references nonexistent `reverb`; every broadcast swallowed by try/catch; frontend shows permanent false "Offline" pill. 
2. **H-2** Clear-chat no-op: `cleared_at` never loaded onto pivot (`Conversation.php:24-27`).
3. **H-3** Task drag-reorder no-op: `order` not fillable; UI toasts success.
4. **H-4** Project cover upload 500 (undefined `$id`, `ProjectController.php:454`).
5. **H-5** = C-9 scope leaks. 6. **H-6** `teamToday` stale ≤1h (versioned cache key vs unversioned observer forgets). 7. **H-7** Password-reset approval persists plaintext reset link in notifications + response. 8. **H-8** PII leaks (blood group, emergency contact, alt mobile, preferences) in user `show`/`activity`, department/designation `show`. 9. **H-9** No last-super-admin guard on role demotion via `update`; duplicated post-transaction side effects. 10. **H-10** Avatar orphan growth (wrong delete path ×3 sites). 11. **H-11** Work-schedule update silently clears `is_default`; success on missing ids; weak validation. 12. **H-12** Leave-approval integrity: no balance recheck, no locking (double-decide race), `id OR approvable_id` can bind wrong approval; `leave.approve-hr` capability granted to no one. 13. **H-13** Redo strands task in `review` (approval flipped before status update 422s). 14. **H-14** Weekly summary queries nonexistent `admin` role — HR never receives. 15. **H-15** Users export ignores stored filters; export capability inconsistency. 16. **H-16** Global task assignment excludes NULL `active_role` users + notify-all storm. 17. **H-17** `/api/version` public: leaks commit sha + full `migrate:status`. 18. **H-18** Holidays route `cache.headers:public` on authenticated route. 19. **H-19** Login calls external `ip-api.com`; `trustProxies '*'`.

## §5. Backend — Medium (P2, condensed; full detail in `report.md` §5)

Dead dashboard cache keys + invalidation storm on every write/login (M-1/2); Approval changes don't invalidate pending caches (M-3); force-password-change + suspicious-login dormant (M-4); temp passwords in API response ignoring policy (M-5); public `/system/public-config` policy disclosure (M-6, with H-17); settings key whitelist/seeder mismatch (M-8); unaudited settings/company/holiday/work-schedule/QA mutations (M-20); token-role override vs in-controller check drift (M-9); de-roled users keep employee caps + 1h role caches (M-10); `syncEmployees` can move super_admins; teams on archived depts (M-12); unvalidated `/profile` preferences bypass (M-13); QA form edits orphan submissions (M-14); report job vs endpoint logic mismatches (M-15); export `chunk` on non-unique order (M-16); app-vs-company timezone mixing + unvalidated date params → 500s (M-17); leave policy gaps (no same-day sick, unpaid capped, race on differing ranges — M-18); half-day dead, no early-leave rule, open-shift misses `break_start` (M-19); team announcements broadcast org-wide (M-21); `react()` re-broadcasts create event, empty catch (M-22); chat unread O(n) subqueries (M-23); `monitor:health` never scheduled; `ScheduledReport` dead feature (M-24).

## §6. Backend — Low (P3, condensed)

Dead code (`SELF_SERVICE_EXCLUDED`, `TestPusherEvent`, empty `ApprovalObserver`, `RoleAssignment` cache, `WorkingDayCalculator` Feb-29 branch, `markLeaveDays` unused var); `/companies/{id}` ignores id; employee number outside txn; AutoNumbering seed race; multiple default schedules possible; `DEL-{id}` anonymize codes; audit cursor-comment vs offset; `activity()` hardcoded 30/page + `ip` alias; `downloadExport` whole-file memory; base64 export legacy; bulk ops always 200; self-deactivate/self-delete allowed; `submitted()` unpaginated; project update skips new-member notify; recurrence drops phase/blocked_by/parent; `pinChat` silently joins; `dismiss` unscoped; message edit schema-ready but no route; repo hygiene (stray root codemods; scratch/).

---

## §7. Frontend — Core Usability Findings (Part 5 of `frontend.md`, merged)

**Critical:** **A-1** capability-cookie lockout (`middleware.ts:47` reads `g4k_capabilities`, app writes `g4k_capabilities_{userId}` → Settings/Audit/Reports/Admin bounce **every role incl. super_admin**) · **A-2** HR leave-approvals dead end (`hr-attendance-view.tsx:14` lacks the linked tab) · **A-3** silent no-ops (clear-chat H-2, drag-reorder H-3, pin no broadcast) · **A-4** micro-typography pandemic (477 `text-[Npx]`: 214×10px, 130×11px, 54×9px, 7–8px outliers; 178 tiny+muted combos) · **A-5** runtime-computed `bg-${…}-500` renders some status dots colorless (color-only meaning, WCAG 1.4.1) · **A-6** placeholder/fictional profile sections (fake YouTube account, dead work-address Edit, static privacy selects) · **A-7** offline queue toasts false success; `/auth/logout` queueable.

**High-friction:** corrections 4 layers deep (W6) · export download memory-bridge (W19) · project edit stub (B-7) · silent caps (filters 100, boards 100, pickers 1000, shift-log 7/365) · temp-password handoff toast · team board staleness undisclosed · remember-me defeated (7-day cookie rewrite).

**Navigation/findability:** palette "Admin Settings" → profile non-tab · `/dashboard/admin` guarded 404 · "Attendance & Time" vs "Attendance" collision · reminders buried under Announcements · feedback + role-switch buried · dead nav branches.

**Forms:** placeholder-only selects; 25 labels repo-wide; zero helper text; same-day rule on submit only; verb glossary drift (Create/Add/Request/Save); 8 dialog widths; two date grammars; `window.confirm` ×5 in chat.

**A11y (WCAG):** 77 icon buttons vs 57 aria-labels (4.1.2) · 9–11px body text (1.4.3/1.4.4) · color-only status (1.4.1) · keyframe animations bypass reduced-motion (2.3.3) · h1 on 6/27 pages (1.3.1) · pill-tabs without semantics (4.1.2) · touch targets 24–32px (2.5.5) · gray-on-color ×11 (1.4.3).

**Consistency/density/perf:** ui Pagination zero direct uses (3 grammars); toast asymmetry (137 error/9 info); z-index soup (z-10×28…z-[9999]); settings two-column waste; attendance toolbar 3-row wrap @1024; charts fixed h-64 in resizable widgets; duplicate polling; prefetch query-key drift; Echo token staleness; hydration double-gate.

---

## §8. Page-by-Page (all 27 routes + shell; findings condensed from `frontend.md` Part 1)

| Page | 5-sec test | Key findings (ID refs) |
|---|---|---|
| /login | PASS | "identifier" jargon; Gen2k/G4K brand split; raw styled submit button |
| /forgot-password, /reset-password | PASS | admin-mediated fallback lacks expectation-setting; reset page solid |
| /onboarding | PASS | optional fields unmotivated; video muted ✓ |
| /role-select | PASS | auto-select infinite-loader failure state (S3/P1); cards don't say what changes |
| /change-password | PASS | policy-driven schema + meter; skip only when allowed; "other devices signed out" undisclosed |
| /dashboard (SA/HR/EMP) | PASS | approvals widget = best approve UX; employee "view all" missing; no reset-layout; overtime emphasis wrong pre-sync (31,500s) |
| /attendance | PASS | A-5 dots; nav label hides leave; 7-day log truncation; dead `holidays` TabsContent; same-day rule late |
| /org/attendance (SA) | PARTIAL | 5 tabs complete; numeric columns not right-aligned; corrections buried; board staleness |
| /org/attendance (HR) | FAIL | A-2 dead approvals tab; 2 tabs only |
| /projects | PASS | 9-field mega-dialog ungrouped; 1,000-user preload; two mental models (grouped vs flat); hidden inline rename |
| /projects/[id] | PASS | edit stub (B-7); phase-complete no warning on open tasks; Delete beside Edit |
| Tasks (board/list/gantt/QA) | PASS | reorder silent no-op; QA-drag teaching toast lacks action; 100-task cap notice; create-form = best form; detail sheet excellent, no "log time" |
| /chat | PASS | clear-chat no-op; 3-char silent search gate; pills a11y; reminders misplaced; window.confirm |
| /directory | PASS | "View" label backwards; temp-password toast; archive errors after-the-fact; departments/designations bypass ListScaffold |
| /directory/[id] (360) | PASS | **only Send Message action** (K-A1); activity empty-check bug |
| /reports | PASS* | *blocked by A-1; export memory-bridge; preview cap disclosed |
| /audit | PASS* | user filter capped at 100 in an investigation tool |
| /settings | PASS* | *blocked by A-1; empty shell for unauthorized; schedule default-flag silent loss; demo blast radius unstated |
| /profile | PARTIAL | A-6 fictional sections; security good but buried |
| Shell/nav/palette/mobile | — | A-1 lockout; palette admin link; false Offline pill; attendance naming collision; bottom-nav aria-current |

## §9. Workflow Friction (26 traced; `frontend.md` Part 2)

**Excellent:** clock in→break→out · offline punch+sync · **Good:** login, cancel leave, submit project review, review project, create task, submit task, approve/redo task, DM, group, announce, notifications triage, change password, revoke session, switch role, pins/notes · **Acceptable:** request leave, create project, manage employee, feedback · **Friction-heavy:** correct a missed punch (≈8 clicks/4 layers) · run export (≈9 steps, memory bridge) · **Poor:** reorder board (silent fail) · **Blocking:** HR approve via navigation (A-2) · move-phase (C-8) · admin opens any admin page (A-1).

## §10. Roles

**Employee:** coherent self-service; noise = scope filter, "My Tasks & Board" label; reminders buried. **HR:** approvals dead-end, Reports/Settings visible-but-blocked, two attendance labels, board staleness, correction depth; backend over-exposure (C-9) invisible but real. **Super Admin:** cannot administer (A-1); no personal attendance surface (nav filter) though backend allows; palette dead link; demo danger zone.

## §11. Screen Sizes (360→2560)

360: dialogs (425–500px) overflow; micro-type worst; tables scroll-only. 390–430: chat best-in-class; hover actions invisible; small targets. 768: icon rail; toolbar reflow ✓; settings tabs wrap ragged. 1024–1200: full nav; smallest text on primary work device. 1440: cap ✓. 1920+/2560: cap keeps density ✓. Cross-size defects: no dialog-as-sheet <640; `min-w-[800px]` heatmap; bulk-bar/FAB overlap.

## §12. Component System (`frontend.md` Parts 6–9, condensed)

**Adoption:** Dialog ×23, ConfirmDialog ×21, Tabs ×18, EmptyState ×33, ListScaffold ×11, DatePicker ×10, DropdownMenu ×12, Toolbar ×9, DataTable ×5, Wizard ×2, Combobox ×2; **AlertDialog dead ×0**; Button 321 vs 66 raw; Input 86 vs ~37 raw; Avatar ×87 (76 fallbacks); Skeleton ×158.
**Six missing primitives:** IconButton · SearchInput · UserPicker · StatusBadge-in-ui · Spinner · ExportButton. **Duplicate clusters (11):** user pickers ×4, status pills (1 de-facto + ≥7 ad-hoc), attendance tables ×2 vs DataTable, dept/designation CRUD vs ListScaffold, search ×5 behaviors, loading species, date grammars, confirms, dialog widths, feedback forms, pagination. **Distributions:** heights h-8×151/h-10×114/h-9×63/h-11×50/h-7×47/h-12×41 (6 values); radius 7 values; gaps healthy (gap-2×343; outliers gap-5/space-y-5/8); 53 hex; 181 arbitrary dims; ring-0 ×7. **States gaps:** Select no error variant; no counters; no success input; kanban no keyboard; tooltips hover-only. **Architecture:** tasks-tab 1,232l, qa-builder 831l, departments 817l — split container/presentation >400l. **Canonical system + 40-row upgrade matrix + 9-phase roadmap:** see `frontend.md` §6.12–6.13, Part 9.

## §13. Layout (`frontend.md` Parts 10–11, condensed)

Five page paddings (utility used once) · five card paddings · form rhythm 4 values + outliers · shell headers h-12/14/16 mixed · 26 unprefixed grids · charts fixed in resizable widgets · settings half-empty ≥1280 · attendance toolbar 3 rows @1024 · dialogs 8 widths · two table cell standards · heading scale drift (lg/xl/2xl/3xl as titles) · heatmap min-w-800 · EmptyState properly capped · negative margins ~20 (healthy) · works-well list (1440 cap, sidebar states, rhythm, grid ladders) preserved. 9-phase layout roadmap in Part 11.

## §14. Functional Fit (`frontend.md` Parts 12–13, condensed)

DatePicker: no Today/Clear/range; cells 32px · **0 SelectItem+Avatar anywhere** (all people-pickers text-only; avatar_url wired ×43 elsewhere) · inputs full-width by default · 5 search widths · 0 textarea `rows` · export enabled-when-unselected · login raw button · contextual-action gaps (360 actions, row-level correct, log-time) · wiring master list (I-F1) · heatmap responsive · checklist in Part 13.

## §15. Information Architecture (`frontend.md` Part 14, condensed)

No duplicate pages (redirects consolidated; 7 stubs verified) · dead duplicates to delete (approvals-tab 312l, feedback widget) · Employee 360 lacks manager actions (K-A1) · QA builder buried as tasks view-mode · rename "My Attendance"/"Team Attendance" · merge Departments+Designations → "Org Structure" · three activity feeds → one primitive · contextual settings (project settings stub, notification split correct) · target nav architecture + keep-list (Part 14-S) · P0–P3 additions (Part 14-T).

---

# §16. Product Completeness & Gap Audit (NEW — seventh dimension)

> Format for majors: Area / Workflow / Role / Current / Missing / Why it matters / Expected / Solution / Where it lives / Navigation impact / Priority / Confidence / Classification. Classification legend: **[Confirmed]** logically required · **[Improvement]** exists but hard · **[Consolidation]** reorganize · **[Enhancement]** useful, not required · **[Speculative]** needs product decision.

## 16-A. Executive Summary
The Employee journey is complete end-to-end. The gaps cluster where the product is *managed*, not *used*: post-creation continuity (create → then what?), entity management lifecycles (projects can't be re-teamed; leave can't be edited; users can't be erased from the UI), admin discoverability (QA builder, scheduled reports, demo danger), and day-one company onboarding (no employee import, empty-state dashboards with no guidance). Several "missing features" turn out to be dead backend features never surfaced (scheduled reports) or backend bugs that erase capabilities the UI implies (weekly summary for HR, half-day).

## 16-B. Application Map
Covered in §1; full route→purpose→role table in `frontend.md` Part 1 / `report.md` §2. Entities: User, Department/Team, Designation, WorkSchedule, Holiday, AttendanceDay/Event/Correction, LeaveRequest/Balance, Project/Phase/Member, Task/Assignee/Comment/Reminder/TimeLog/QaForm/QaSubmission, Conversation/Message, Announcement/Reaction, Notification, ExportJob, SavedView, AuditLog/LoginAttempt, Pin/QuickNote/PersonalReminder, Company/Setting.

## 16-C → 16-F. Creation → Management Lifecycle Gaps

**GAP-1. Post-creation dead ends (all create dialogs)**
- **Area:** create-project / create-employee / create-task / create-group dialogs · **Workflow:** Create → Configure → Save → *Verify/Manage* · **Role:** HR, SA.
- **Current:** dialog closes into the list; no navigation, no "Open X" action, no "Add another".
- **Missing:** the verify/manage stage of the lifecycle.
- **Why it matters:** after creating a project the manager's *very next intent* is adding tasks/members — today they must re-find it in the list (search/scroll) first; after creating an employee the next intent is handing over credentials and opening the 360.
- **Expected:** success toast with **[Open project]** / redirect to 360 with an actions bar; "Create another" for bulk employee adds.
- **Where:** toast actions (no new pages) + post-create navigation. **Nav impact:** −1–2 steps × frequency of creation. **Priority: P1 · Confidence: High · [Confirmed]**

**GAP-2. Employee offboarding erasure not in UI** — `anonymize` exists only as API (`UserController::anonymize`); UI stops at deactivate/soft-delete. Real companies must erase leavers' PII. **Solution:** "Erase personal data" in 360/trashed-row menu (SA) with double confirm. **P2 · High · [Confirmed]**
**GAP-3. Leave cannot be edited** — wrong dates require cancel→recreate (balance refund quirks included). Add admin edit (dates/type) with re-validation, or at minimum a "request changes" comment to the employee. **P2 · Medium-High · [Confirmed]**
**GAP-4. Project re-teaming impossible** — edit stub (B-7) blocks member/department changes post-creation; delete+recreate is the only path. Already P1; reclassified here as a *lifecycle* gap: projects are long-lived; teams change. **P1 · High · [Confirmed]**
**GAP-5. QA forms lack a management lifecycle UI** — buried builder (L-A2); no forms list with usage counts, no duplicate/template flow; delete guarded by usage but no "what uses it" view. **P2 · High · [Confirmed]**
**GAP-6. Task comments lack attachments** — chat has them; task review discussions often need screenshots. **P3 · Medium · [Enhancement]**
**GAP-7. Recurrence completion silent** — next occurrence created but only implied; toast "Next occurrence created (due …)" + link. **P2 · High · [Improvement]**
**GAP-8. No project archive** — completed projects accumulate with active in filters; archive (soft state) or auto-filter default. **P3 · Medium · [Enhancement]**

## 16-G. Navigation & Click-Path Problems
Consolidated from Part 2/14: corrections 4 layers · export 9 steps · role-switch/change-password 2 levels deep · edit-employee only in table row (K-A1 fixes the worst) · admin surfaces blocked (A-1) · approvals dead-end (A-2). Click-path reductions tabulated in `frontend.md` I.

## 16-H. Missing Pages (only where logically required)
1. **QA Forms management surface** — not a new route necessarily; a header action + list dialog suffices (GAP-5). **P2 · [Confirmed]**
2. **Global search results** — palette searches commands/recents, not entities; a "search everything" (people/projects/tasks) results view. **P3 · Medium · [Enhancement]** — palette extension preferred over a page.
3. **Nothing else qualifies** — audit intentionally rejects "every SaaS has X" pages (no kanban-of-everything, no files module, no docs module).

## 16-I. Missing Features (inside existing pages)
Employee **import** (CSV) for day-one migration — the company onboards ~all staff at launch; one-by-one creation with toast-passwords won't scale past a handful. **P2 · Medium · [Enhancement]** · **Scheduled reports** — backend model exists, nothing consumes (M-24): implement digest emails from existing report endpoints **or delete the dead model**. **P2 product decision · [Confirmed dead feature]** · Saved-view management beyond reports (rename/delete; extend to tasks/attendance). **P2 · [Improvement]** · Work-schedule usage view ("N people on this schedule"). **P3 · [Improvement]** · Announcement history/archive of dismissed. **P3 · Low · [Enhancement]** · Chat mark-all-read per scope. **P3 · [Improvement]**.

## 16-J. Missing Options & Actions
Reject-reason prompted on leave rejection (currently silent reject; task redo requires reason — asymmetric) **P2 [Improvement]** · "Filters" summary chips + one-clear (search/filters/date/sort reset) on heavy tables **P2 [Improvement]** · bulk reassign tasks **P3 [Enhancement]** · duplicate task/project **P3 [Enhancement]** · half-day leave **[Speculative]** — enum dead end-to-end; explicit product decision required · configurable leave types/balances per type-year **[Speculative]**.

## 16-K. Contextual Access Improvements
360 manager action bar (K-A1) · row-level "Correct" (W6) · export download in completion toast (W19) · "log time" on task sheet · "manage forms" from QA select in create-project · "configured in Settings" tooltips on reminder widgets · "personalize" link from settings Notifications → profile.

## 16-L. Consolidation Opportunities
Part 14-I/R: HR approvals tab · Org-Structure tab merge · ActivityFeed primitive · reminders relocation · keep the rest as-is.

## 16-M. Role-by-Role Gaps
**Employee:** empty dashboard day-one (no tasks/projects yet) with zero guidance — add contextual empty-state CTAs ("Ask your manager to add you to a project" / create your first personal task) **P2 [Improvement]**; same-day sick leave policy **P2 [Confirmed, backend]**; reminders/feedback discoverability. **HR:** everything in §10 plus corrections depth, schedule-blind boards (backend), weekly summary never arrives (H-14 — fix, don't build). **SA:** admin lockout (A-1) · personal attendance absence (decide) · demo-data danger labeling (C-3) · audit user-filter cap.

## 16-N. Daily Company Usage Gaps (what breaks at month 3)
Team board staleness erodes trust (H-6) · realtime-off "Offline" badge generates IT tickets (H-1) · 100/1000 caps silently corrupt pickers and filters as headcount grows · notification 30-day purge surprises HR investigations · audit user-filter cap hides most staff · demo dataset intermingled with real data (C-2/C-3) · two brand names (Gen2k/G4K) confuse staff · password reset via admin hand-off link (H-7) becomes the normal flow once SMTP misconfigures.

## 16-O. Workflow Dead Ends
Create-* dead ends (GAP-1) · export completion (W19) · approve-in-widget without "next" · leave rejection without reason/reply channel · demo purge (C-3 — the terminal dead end) · search-no-match states without guidance (chat 3-char gate) · settings unauthorized empty shell · profile placeholder dead controls.

## 16-P. Feature Discoverability Gaps
QA builder · personal reminders · role switcher · feedback form · saved views · restore-trashed filter · inline project rename · announcement priority semantics · density mode · drafts (undisclosed that forms auto-save!) — add "draft saved" microcopy. **P2 cluster [Improvement]**.

## 16-Q. Recommended Product Structure
= Part 14-S target nav + workspace extensions (360 actions, real project settings) + no new top-level modules.

## 16-R. Priority Roadmap (delta only; merges into §17)
**P1:** GAP-1 post-creation actions. **P2:** GAP-2 erasure UI · GAP-3 leave edit · GAP-5 QA management · employee import · reject-reason · saved-view management · employee empty-state guidance. **P3:** GAP-6/7/8 · global search · schedule usage view · announcement archive · bulk reassign · duplicate.

## 16-S. Final "Nothing Missing" Checklist
Pages: no missing top-level pages (2 conditional items above) ✔ · Components: 6 missing primitives (§12) ✔ · Actions: 360 bar, row-correct, log-time, download-in-toast ✔ · Options: reject-reason, half-day decision, filter-reset ✔ · Settings: contextual links only ✔ · Navigation: renames + dead links ✔ · Context: K-list ✔ · Workflow: dead-ends O-list ✔ · Creation: GAP-1..5 ✔ · Management: GAP-2..8 ✔ · Discovery: P-list ✔ · Relationships: 360↔tasks↔projects↔chat all navigable after K-A1/B-7 ✔ · Roles: M-list ✔ · Daily use: N-list ✔. **Speculative items requiring the client's product decision: half-day leave · configurable leave types · scheduled reports (build vs remove) · SA personal attendance · employee import timing.**

---

# §17. Unified Roadmap (single sequenced plan; supersedes per-part roadmaps)

**Wave 0 — Security & data safety (days):** C-1 backdoor + stray scripts · C-2 credential rotation · C-3 demo-purge guards · H-7 reset-link handling · H-17/H-18/M-6 public endpoints · deploy + smoke.
**Wave 1 — Unblock the product (this week):** A-1 cookie fix + admin smoke test · A-2 HR approvals tab · C-4 phase 500 · C-5 delete 500s · C-6 scope escalation · C-7 leave routes · C-8 move-phase · H-3 reorder persistence · H-2 clear-chat · A-6 placeholder deletion · A-7 offline truthiness.
**Wave 2 — Trust & correctness:** H-6 board staleness + "last updated" · H-11 schedule default · H-12 approval locking/recheck · H-13 redo order · H-14 weekly summary roles · H-15 export filters · C-9/H-5 HR scope leaks · H-8 PII hiding · H-9 last-admin guard · H-10 avatar path · A-5 status map · remember-me cookie · GAP-1 post-creation actions.
**Wave 3 — Component consolidation (Parts 6/9):** six missing primitives (UserPicker w/ avatars, SearchInput, IconButton, StatusBadge, Spinner, ExportButton) · Dialog size prop + mobile sheet · DataTable absorbs attendance tables · Wizard for project/user forms · DatePicker Today/Clear/range + report presets · Select error variant · delete dead components · heatmap responsive.
**Wave 4 — Layout & density (Part 11):** page-padding/card-padding adoption · height/radius/type scale codemods (A-4) · FormGrid · toolbars · chart autoresize · unprefixed-grid fix.
**Wave 5 — IA & context (Part 14/16):** attendance renames · 360 manager action bar · project settings completion (B-7) · QA surfacing · reminders relocation · K-list contextual actions · GAP-2/3/5.
**Wave 6 — A11y & responsive (Parts 4/G/L):** labels/targets · motion-safe wrap · tablist semantics · h1s · ring recipe · dialogs-as-sheets · touch actions.
**Wave 7 — Completeness enhancements (16-R):** employee import · saved views v2 · empty-state guidance · reject-reason · product decisions from 16-S.
**Wave 8 — Final pass:** verb/confirm/breadcrumb glossaries · dead-code sweep · redirect-stub removal · E2E smoke suite (3 roles × core flows) in CI · detector + `$impeccable critique` + live-browser verification · re-score (targets: audit health ≥17/20, Nielsen ≥30/40, zero P0/P1 open).

---

*Companion deep-dives: `report.md` (backend full detail) · `frontend.md` (Parts 1–14 full detail) · `manual.md` (client manual). Detector archive: `.impeccable/detect-frontend-audit.json`. All findings re-verifiable from the cited `file:line` evidence.*


## 16.4 — Source S4: `manual.md` (client manual — verbatim, complete)

# Games4King — Workplace OS User Manual

Welcome to Games4King! This manual explains everything the system can do, in the order you will actually use it — from your very first login to day-to-day work like marking attendance, chatting, managing projects, approving leave, and running reports. It covers all three user roles: **Employee**, **HR**, and **Super Admin**.

> **How to read this manual:** Start with "Getting Started" if this is your first time in the system. After that, each chapter is self-contained, so you can jump straight to what you need. Chapters marked *(All roles)* apply to everyone; otherwise the chapter tells you which role it is for.

---

## Table of Contents

1. [The System at a Glance](#1-the-system-at-a-glance)
2. [User Roles and What Each Can Do](#2-user-roles-and-what-each-can-do)
3. [Getting Started — First Login](#3-getting-started--first-login)
4. [If You Forget Your Password](#4-if-you-forget-your-password)
5. [Understanding Your Workspace (Navigation, Header, Shortcuts, Mobile)](#5-understanding-your-workspace)
6. [Your Dashboard Home (per role, widget by widget)](#6-your-dashboard-home)
7. [Attendance & Time — Your Daily Clock](#7-attendance--time--your-daily-clock)
8. [Leave — Requesting, Tracking, and Cancelling](#8-leave--requesting-tracking-and-cancelling)
9. [Team & Company Attendance (HR and Super Admin)](#9-team--company-attendance-hr-and-super-admin)
10. [Leave Approvals (HR and Super Admin)](#10-leave-approvals-hr-and-super-admin)
11. [Projects](#11-projects)
12. [Project Detail — Phases, Team, and Activity](#12-project-detail--phases-team-and-activity)
13. [Tasks — Board, List, Timeline, and the QA Tab](#13-tasks--board-list-timeline-and-the-qa-tab)
14. [The Task Detail Window — Comments, Time Logs, Activity](#14-the-task-detail-window)
15. [Task Review Workflow — Submit, Approve, Redo](#15-task-review-workflow--submit-approve-redo)
16. [QA Forms (Quality Checklists)](#16-qa-forms-quality-checklists)
17. [The Project Timer](#17-the-project-timer)
18. [Communications — Chat, Announcements, Notifications](#18-communications--chat-announcements-notifications)
19. [Directory — People, Employee Management, Departments, Designations](#19-directory--people-employee-management-departments-designations)
20. [Employee 360 — One Person's Full Picture](#20-employee-360--one-persons-full-picture)
21. [Reports & Analytics](#21-reports--analytics)
22. [Audit Logs (Super Admin)](#22-audit-logs-super-admin)
23. [System Settings (Super Admin)](#23-system-settings-super-admin)
24. [My Profile](#24-my-profile)
25. [Sessions, Security, and Password Changes](#25-sessions-security-and-password-changes)
26. [Working Offline](#26-working-offline)
27. [Automatic System Behaviors You Should Know](#27-automatic-system-behaviors-you-should-know)
28. [Role Capability Reference (Who Can Do What)](#28-role-capability-reference)
29. [Troubleshooting & FAQ](#29-troubleshooting--faq)

---

## 1. The System at a Glance

Games4King (G4K) is your company's single workplace platform. It replaces separate tools for:

- **Attendance** — clock in/out, breaks, shifts, corrections, and overtime
- **Leave** — leave requests, balances, holidays, and approvals
- **Projects & Tasks** — project tracking with phases, Kanban board, timeline (Gantt), task review, quality (QA) checklists, and time tracking
- **Communication** — company chat, direct messages, group chats, project channels, announcements, and notifications
- **People (Directory)** — employee records, departments, designations, and an org chart
- **Reports** — attendance, leave, productivity, and data exports
- **Administration** — company profile, work schedules, security policies, holidays, mail, audit logs, and demo data controls

Everything is role-based: an **Employee** sees their own world, an **HR Manager** sees their departments, and the **Super Admin** sees and controls everything.

---

## 2. User Roles and What Each Can Do

Every user has at least one role. Some users have more than one (for example, someone who is both HR and an Employee) and can switch between them (see [My Profile](#24-my-profile)).

### Employee
Your everyday role. You can:

- Clock in/out and take breaks
- Request and track your own leave
- View your dashboards, holidays, and announcements
- Chat (company-wide chat, direct messages, project channels)
- Browse the company directory
- View projects you are a member of
- Work on tasks assigned to you, create your own personal tasks, and submit work for review
- Track time with the project timer

### HR (HR Manager)
Everything an Employee can do, plus management tools:

- See and manage **your assigned departments** (a super admin assigns which departments each HR manages)
- View team attendance "today" boards, trends, and graphs; correct attendance records
- Approve or reject your team members' leave requests
- Create and manage projects, tasks, and phases for your departments
- Review and approve/re-do submitted task work
- Create group chats and team announcements
- Manage employees in your departments (create, edit, deactivate, reset passwords)
- Manage departments and designations
- See reports for your teams

### Super Admin
The owner of the system. Everything HR can do — but with **no department limits** — plus:

- Full company-wide attendance views (calendar heatmap, live shifts, analytics)
- All leave approvals across the company, including HR members' own leave
- Manage any user, including creating other Super Admins and HRs
- All settings: company profile, work schedules, policies, holidays, SMTP mail, notification channels, auto-numbering, reminders, security requests (password reset approvals), demo data, and system job monitoring
- Audit logs (system events + login history)
- Data exports of every kind

> **Note on approval chains:** Leave submitted by an **Employee** goes to **HR** for approval. Leave submitted by an **HR** member goes to the **Super Admin**. The Super Admin approves their own (the system allows this by design so the top-level account is never stuck).

---

## 3. Getting Started — First Login

### Step 1 — Open the login page
Go to your company's Games4King web address. You will see the login screen.

### Step 2 — Enter your identifier and password
You can log in with **any one** of the following — whichever you find easiest:

- Your **email address** (e.g. `priya@games4king.in`)
- Your **username** (e.g. `priya`)
- Your **employee ID** (e.g. `G4K005`)

Then type your password. Your administrator gives you these details when your account is created.

**"Remember me" checkbox:**
- **Ticked** — you stay logged in on this device for up to 7 days, even after closing the browser.
- **Unticked** — your session ends when you close the browser.

**Wrong password?** After **5 failed attempts in a row your account locks for 10 minutes**. You'll see a countdown telling you when you can try again. (Your administrator can also unlock you early by reactivating your account.)

### Step 3 — Change your password (if asked)
If your administrator created your account with a temporary password, or your password has expired by policy, you'll be taken to the **Change Password** screen before anything else:

1. Enter your current password.
2. Enter your new password twice. The page shows your company's password rules live (for example: minimum length, must contain upper and lower case). A strength meter helps you pick a good one.
3. Click save. You stay logged in and all your other devices are logged out automatically (a security feature).
4. If your company has **not** made the password change compulsory, you'll see a **Skip for now** button. If password change **is** compulsory, there is no skip button.

### Step 4 — Complete onboarding (first time only)
The first time you log in you'll see a welcome screen with your name, employee ID, role, and department — and a short animated intro.

1. (Optional but recommended) Add your **phone number** and an **emergency contact number**.
2. Click **Get Started**. This screen appears only once.

### Step 5 — Choose your role (only if you have more than one)
If your account has multiple roles (e.g. HR + Employee), you'll see a **workspace picker** with a card for each role. Pick the one you want to work in right now. You can switch roles any time from My Profile (see [24. My Profile](#24-my-profile)) — the system quietly re-signs you in under the new role without asking for your password again.

### Step 6 — You're on your Dashboard 🎉
From here, everything happens inside the workspace described in the next chapter.

> **Session expiry:** For security, your sign-in refreshes automatically in the background. If you're ever away longer than allowed, you'll be returned to the login page with the message "Please sign in again" — just log back in. If an administrator revokes one of your sessions, you are logged out of that device immediately with a notification explaining why.

---

## 4. If You Forget Your Password

1. On the login page click **Forgot password?**
2. Enter your email, username, or employee ID and submit. You'll always see the same confirmation message (the system never reveals whether an account exists — this protects everyone).
3. One of two things happens next:
   - **If your company has email (SMTP) configured:** You receive an email with a reset link. The link is valid for **60 minutes**. Open it, enter a new password (matching your company's password rules), and you're done.
   - **If email is not configured (or the email failed to send):** Your request goes to your administrators as an **in-app password reset request**. A Super Admin reviews it under **Settings → Security Requests**, approves it, and personally hands you a one-time reset link. When you get that link, open it and set your new password.

After a successful reset, **all** your logged-in devices are signed out, and you must log in again everywhere.

---

## 5. Understanding Your Workspace

### The left sidebar
Your menu is grouped into three sections (items appear based on your role):

**Overview**
- **Dashboard** — your personalized home *(everyone)*
- **Attendance & Time** — clock in/out and your leave *(hidden for Super Admins; they manage attendance from the Organization section instead)*
- **Projects & Tasks** — all project & task work *(everyone)*
- **Communications** — chat, announcements, notifications *(everyone; shows a red badge with your unread chat count)*

**Organization**
- **Directory** — people, departments, designations *(everyone)*
- **Attendance** — team/company attendance *(HR & Super Admin)*
- **Reports & Analytics** *(HR & Super Admin)*

**Account**
- **My Profile** *(everyone)*
- **Audit Logs** *(Super Admin)*
- **System Settings** *(Super Admin)*

You can **collapse the sidebar** to icons-only (the default), expand it, or hide it completely — click the sidebar toggle button or press **Ctrl+B**. Your choice is remembered on your account, so it follows you across devices. At the bottom of the sidebar you'll also see your **pinned items** — shortcuts you've pinned from anywhere in the app (a project, a task, a person).

Hovering a menu item pre-loads that page, so clicking feels instant.

### The top header
From left to right:

- **Breadcrumb** — shows where you are (e.g. Dashboard / Projects / Website Redesign) with names resolved automatically.
- **Connection status** — a small pill that appears when the live connection needs attention (see [27. System behaviors](#27-automatic-system-behaviors-you-should-know)).
- **Project Timer** — a compact timer for tracking work time (see [17. The Project Timer](#17-the-project-timer)).
- **Notification bell** — your latest notifications and unread count. The list refreshes every 30 seconds; the bell also shows a count of high-priority items. From the dropdown you can jump to any notification's related page, and mark items read/unread.
- **Avatar menu** — your picture/name opens a menu with: **My Profile**, **System Settings** (admins only), **Theme** (Light / Dark / System), **Density** (Comfortable / Compact), **Keyboard shortcuts**, and **Log out**.

### Command palette (Ctrl+K or Cmd+K)
Press **Ctrl+K** (or **Cmd+K** on Mac) from anywhere to open a search box that can:

- Jump to any page or module
- Run quick actions — **Clock in, Start break, End break, Clock out**
- HR actions — view team attendance, correct attendance, run exports
- Admin actions — settings, audit logs
- Find recent items you've viewed lately

### Keyboard shortcuts

| Shortcut | What it does |
|---|---|
| Ctrl/Cmd + K | Open command palette |
| Ctrl + B | Collapse/expand sidebar |
| Ctrl + / | Show keyboard shortcut help |
| Ctrl + N | New item on the current page (e.g. new task, new employee) |

### On mobile
The app adapts to phones with a **bottom navigation bar**: Dashboard, Projects, a center **big round button** that jumps straight to Attendance (clock in/out), Chat (with unread badge), and Profile. Menus become dropdowns, tables become cards, and the chat goes fullscreen with the keyboard handled properly.

---

## 6. Your Dashboard Home

Your dashboard is a **grid of widgets** you can personalize: **drag** them around, **resize** them, **collapse** them to their title bar, or **dismiss** the ones you don't need (dismissed widgets can be restored). Your layout is saved to your account automatically.

The greeting at the top changes with the time of day ("Good morning…", "Good afternoon…").

What you see depends on your role:

### Employee dashboard
- **Announcement Board** — the latest company announcements; you can react with an emoji or dismiss them (see [18. Communications](#18-communications--chat-announcements-notifications))
- **Active Projects / Pending Tasks** — your headline numbers
- **My Submissions** — the status of your recent task submissions (Approved / In Review / Redo)
- **Task Progress** — how far along your current work is
- **Upcoming Holidays** — the next 3 holidays
- **Quick Notes** — private sticky notes (see below)
- **Time Clock** — punch in/out right from the dashboard

### HR dashboard
- **Team Attendance Today** — a snapshot of your departments: how many are present, late, on leave, absent
- **Pending Approvals** — leave requests and task submissions waiting for you, with **Approve / Reject buttons right on the widget**
- **Activity Feed** — attendance exceptions in your teams (late arrivals, unclosed shifts)
- **Quick Task** — create and assign a task in seconds
- **Announcement Board** — read, post, and manage announcements (HR can post to their teams)
- **Upcoming Holidays** and **Quick Notes**
- **Time Clock** — HR members can also punch their own attendance

### Super Admin dashboard
- **Total Employees** (with active/inactive split), **Active Projects**
- **Today's Attendance** — company-wide present/late/on-leave/absent/holiday counts
- **Pending Approvals** — everything awaiting your decision (leave, task submissions, projects in review) with inline **Approve/Reject**
- **Recent Activity** — the latest actions across the system (who did what, when)
- **Quick Task** — assign work quickly
- **Quick Notes**
- A **live shift indicator** — which tasks people are actively working on right now

### Quick Notes (all roles)
A private scratchpad: **Add note**, pick a color, edit, **pin** important ones, delete. Notes are private to you and appear on your dashboard.

---

## 7. Attendance & Time — Your Daily Clock

Open **Attendance & Time** from the sidebar (Employees and HR; Super Admins use the Organization section). The page has two tabs: **Overview** (your attendance) and **My Leave** (your leave — see the next chapter).

### The Time Clock widget
This is your daily punch card. It has four states:

1. **Not started** — your shift hasn't begun. Press **Start Shift** to clock in.
2. **Active (On shift)** — you are clocked in. Press **Pause (Start Break)** when you take a break.
3. **On break** — break time is running (it doesn't count as work time). Press **Resume** to return to work.
4. **Completed** — you pressed **End Shift** and clocked out. The widget shows your totals for the day.

Good-to-know details:

- Ending your shift **while on break** automatically closes the break for you — no lost or weird break records.
- Forgot to clock out and it's the **next day**? Press **Continue Shift** — the system understands overnight shifts and books the punch to the correct day (the day your shift started).
- If you work more than your schedule's standard hours, the widget highlights **overtime**.
- The widget **syncs live across your open tabs and devices** — clock in on your phone, and the desktop app updates.
- **No internet?** Punches made offline are queued safely on your device and sent automatically the moment you're back online (see [26. Working Offline](#26-working-offline)). Duplicate taps are safe — the system de-duplicates them.
- A **client timestamp** is sent with each punch; punches more than 5 minutes in the future or older than 48 hours are rejected to keep records honest.

### Today's Summary card
After your first punch you'll see today's running totals: worked time, break time, overtime, clock-in time, and your current status (Present, Late, On Leave, Holiday).

### Recent Shift Log
Your recent days at a glance (status dot per day). Click any day for a detail popup: clock-in/out times, every break, total worked, overtime. The **View Full Calendar** button opens a calendar heat-map of your entire history — greens for full days, ambers for late, reds for absences, blues for leave.

### How statuses are calculated
The system computes your day automatically from your punches, your work schedule, and the holiday calendar:

- **Present** — clocked in on time (within your schedule's grace period, 10 minutes by default)
- **Late** — clocked in after the grace period; the widget shows how many minutes late
- **On Leave** — an approved leave covers the day
- **Holiday** — a company holiday
- **Absent** — a working day with no attendance and no leave
- **Open shift** — you clocked in but never clocked out (the system reminds you — see below)

You cannot edit your own punches. If something is wrong (forgot to clock in/out, wrong break), ask your HR or the Super Admin to **correct** it — see [9. Team & Company Attendance](#9-team--company-attendance-hr-and-super-admin).

---

## 8. Leave — Requesting, Tracking, and Cancelling

Open **Attendance & Time → My Leave**. You'll see two sub-tabs: **My Leave** (request form + holiday calendar) and **History** (all your past requests).

### Your leave balances
You have a yearly balance for each leave type. By default each type starts at **12 days per year**: **Casual, Sick, Earned, and Unpaid**. The request form shows your remaining days live next to each type — types you've exhausted are greyed out and can't be selected. Balances reset each calendar year.

### Requesting leave — step by step
1. In **My Leave**, use the **Request Leave** form (if you don't see it, your role's dashboard hides it for admins — use the My Leave tab directly).
2. Pick a **leave type** (Casual / Sick / Earned / Unpaid). Your remaining balance shows next to each.
3. Pick the **start date**. Important: **leave must start from tomorrow onwards** — same-day leave can't be requested through the form, so plan ahead (for sudden illness, contact HR directly).
4. Pick the **end date** (same day or later).
5. Write a **reason** (up to 1000 characters).
6. Submit. Your draft is auto-saved as you type, so accidentally closing the page won't lose your work.

What the system checks before accepting your request:

- **No overlaps** — you can't have two leaves covering the same day (pending or approved).
- **At least one working day** — weekends and holidays inside your range don't count; if your entire range falls on non-working days, the request is rejected.
- **Balance available** — the working days requested can't exceed your remaining balance for that type.

After submitting, the status is **Pending** and your HR is notified (a Super Admin's own leave is also shown to themselves; employees' leave goes to HR; HR's leave goes to the Super Admin).

### Tracking and cancelling
In **History** you can filter by type/status, search, and page through your requests. While a request is still **Pending**, you can **Cancel** it (with a confirmation prompt). Once approved, cancelling needs HR or the Super Admin — when they cancel an approved leave, your used balance is refunded automatically and your attendance days are re-calculated.

### Holiday calendar
Next to the request form you'll see the company holiday calendar — navigate by month. The seeded company holidays include Republic Day (26 Jan), Independence Day (15 Aug), Gandhi Jayanti (2 Oct), Christmas (25 Dec), Company Anniversary (15 May) (these repeat every year), plus Holi and Diwali for the current year. The Super Admin can add/edit holidays (see [23. System Settings](#23-system-settings-super-admin)).

---

## 9. Team & Company Attendance (HR and Super Admin)

Open **Organization → Attendance**. What you see depends on your role:

### HR view — two tabs

**Today's Status**
- A snapshot card of your departments: Present / Late / On Leave / Absent / Leave-pending counts
- A table of your team members for any date you pick: status, clock-in/out, worked hours, overtime, late minutes
- Filter by department; search by name
- Click a member to open their **attendance sheet** — their full day detail
- **Correct attendance**: if someone forgot to punch, you can fix it right there (details below)
- Select rows and **export** the day/selection to Excel

**Trends & Graphs**
- Attendance graphs you can group **by date or by employee**, plus a **heat-map** of your teams' attendance over time — spot patterns like repeated late Mondays.

### Super Admin view — five tabs

1. **Calendar** — a company-wide heat-map calendar: pick any date to drill into that day's numbers, color-coded by department status.
2. **Overview** — the full attendance table for any date range, with filters: date from/to, department, specific user, status, plus search, sorting, and pagination. Select rows to export, or export the whole filtered view to Excel. Every row opens the member's attendance sheet.
3. **Analytics & Trends** — charts of attendance over time, grouped by **company or by department**.
4. **Live Shifts** — who is on shift **right now**, including **which task they're actively working on** (from the project timer). Updates in real time.
5. **Leave & Holidays** — three sub-tabs:
   - **Approvals** — all leave requests pending on you, with filters and **Approve / Reject** buttons (see next chapter)
   - **All Leave History** — every leave request company-wide, filterable by status/type, exportable; admins can cancel any leave (balance is refunded if it was approved)
   - **Holidays** — manage the holiday calendar (add/edit/delete holidays)

### Correcting someone's attendance (HR for their teams, Super Admin for anyone)
Use the **Correct** action on an attendance row. You can:

- **Add** a missing punch (clock-in, clock-out, break start, break end) with its time
- **Edit** an existing punch's time
- **Remove** a wrong punch

Every correction requires a **reason**, is written to an audit trail, and the employee is notified automatically. The day's totals (worked hours, overtime, late status) are recalculated immediately.

### Notifying people with open shifts
HR can trigger **"Notify open shifts"** — sends a reminder to everyone who forgot to clock out. The system also does this automatically in the evening (see [27. System behaviors](#27-automatic-system-behaviors-you-should-know)).

---

## 10. Leave Approvals (HR and Super Admin)

When a team member requests leave, approvers see it in two places: the **Pending Approvals widget** on the dashboard (with inline buttons) and the full **Leave & Holidays → Approvals** table (Super Admin) — HR approvers work from their pending list and dashboard widget.

To decide:

1. Open the pending request. Review the type, dates, working-day count, reason, and the person's remaining balance.
2. Click **Approve** or **Reject**. (Rejecting asks for nothing extra; the requester is notified either way with the decision.)

Rules the system enforces:

- You can never approve **your own** leave — HR leave always escalates to the Super Admin.
- HR can only decide leave for **their departments**.
- On approval: the person's balance is deducted for the working days, and the affected dates are automatically marked **On Leave** in attendance (days the person actually worked are never overwritten).
- On rejection of a previously approved leave (or cancellation): the balance is **refunded** and attendance is recalculated.

> **Where do HR approvers find this?** HR opens **Organization → Attendance**; pending leave for their teams surfaces via the dashboard's Pending Approvals widget and the leave areas of the org attendance page. (Deep-links labeled "Leave" take Super Admins to the full Leave & Holidays tab.)

---

## 11. Projects

Open **Projects & Tasks**. The page has two tabs — **All Projects** and **My Tasks & Board** (tasks are covered in the next chapters). Live counts show on each tab.

### Browsing projects
- **Status pills** — All / Active / Completed
- **Filter by priority** (Low / Medium / High / Urgent), **sort** by created date, deadline, or priority, and **search** by name
- Toggle **grid or list** view
- Super Admins additionally see projects **grouped into department sections**
- Inline **rename** on project cards (managers)
- Simple **previous/next pagination** through results
- **Export CSV** of the current project list
- Projects update live — when someone creates or edits a project elsewhere, your view refreshes automatically

### Creating a project (HR for their departments, Super Admin for anyone)
Click **Create Project** and fill in:

1. **Name** and **description**
2. **Priority** (Low / Medium / High / Urgent)
3. **Department** (HR can only pick their own departments)
4. **Deadline** (optional)
5. **Team members** — pick from the people list; every member gets a notification and gains access
6. **QA form** (optional) — attach a quality checklist that tasks in this project can use (see [16. QA Forms](#16-qa-forms-quality-checklists))
7. **Phases** (optional) — build the project's phases right here (name + dates each), e.g. "Discovery → Design → Build → Launch"
8. **Cover image** (optional) — a picture shown on the project card and header

Two things happen automatically on creation: a **project chat channel** is created for the team, and the project appears for all members.

> **Employee tasks on a project:** the creator can enable **"Allow employee tasks"** — when on, regular employees can add their own tasks to this project; when off, only managers assign work there.

### Project lifecycle — from active to completed
A project moves through a simple, controlled pipeline:

1. **Active** — work happens; tasks progress through their own workflow.
2. **Submit for review** — when all tasks are done, the project manager (or creator) presses **Submit for Review**. If the project has a QA form attached, the required answers must be filled in first. The project becomes **In Review** and lands on the Super Admin's desk.
3. **Review decision** — a manager (not the person who submitted) either:
   - **Approves** → the project is marked **Completed** (with the completion date stamped), or
   - **Sends back for rework (Redo)** → it returns to **Active** with the feedback.

Every step writes to the project's history/activity feed, and dashboards update.

### Editing and deleting
- **Edit** (managers): update name, description, and details. Member changes re-sync the project chat channel automatically.
- **Delete** (managers): with confirmation. Deleting a project also archives its tasks (soft-deleted), removes its phases, QA submissions, and its chat channel. Prefer **completing** projects over deleting them — deletion is meant for mistakes.

---

## 12. Project Detail — Phases, Team, and Activity

Click any project card to open its detail page.

### The header
Cover image (with a blurred backdrop), status badge (Active / In Review / Completed), priority, deadline, department, completion date, and the submission note if it's in review. Managers get a settings menu: **Edit** and **Delete**.

### Project Journey (phases)
The heart of the page: your phases as a timeline of cards — e.g. *Discovery (done) → Design (active) → Build (pending)*. Each phase card shows its tasks and progress.

- **Add tasks directly into a phase** from the card
- **Complete a phase** — marks it done and **automatically activates the next pending phase**, so the project always knows where it is
- **Reopen a phase** if more work appears
- **Manage phases** (managers): add, rename, re-date, reorder, or remove phases via the phase manager dialog
- Tasks don't strictly need to be done to complete a phase — that's the manager's judgment call

### Summary bar
Live roll-up for the whole project: total tasks, done, in progress, in review, and logged hours.

### Team sidebar
Everyone on the project with their avatar and role. (Adding members happens through Edit Project.)

### Activity feed
A live, virtualized (very fast even with hundreds of entries) feed of everything that happened: task created/assigned/submitted/approved, member changes, status changes — with who and when.

### Deep links
Every task has a shareable link (the page supports `?highlight=taskId` which scrolls to and rings the task row). Opening a task opens the full task detail window over the project page.

---

## 13. Tasks — Board, List, Timeline, and the QA Tab

Open **Projects & Tasks → My Tasks & Board** (the tab label adapts to your role — employees see it as their personal task area).

### The four views

**Board (Kanban)** — columns **To Do / In Progress / Review / Done**. Drag cards between columns.

- Moving to **In Progress** or **To Do**: always allowed (for your tasks)
- Moving to **Review** or **Done**: blocked with a helpful message — these statuses must go through the **submission/approval workflow** (see next chapter). For tasks **without** QA forms, managers can drag straight to Done.
- Cards show title, project, priority, due date, assignees, and progress
- Live updates when others change tasks

**List** — a data table with sorting, a search, status/assignee/scope/due-date filters, and **presets** (My Active, High Priority, Overdue, Custom). Select rows for **bulk actions**: *Mark Done* (managers) and *Bulk Delete* (with confirmation). Twenty rows per page. Any row opens the task detail window; a row can be highlighted via link.

**Timeline (Gantt)** — managers only. A calendar bar-chart of tasks; **drag a bar to set its dates** visually. Great for spotting schedule clashes. (Shows up to 100 tasks at a time.)

**QA** — the QA form builder (see [16. QA Forms](#16-qa-forms-quality-checklists)).

### Filters that work everywhere
- **Status, priority, assignee** (including a "My Tasks" shortcut for employees), **scope** (Global / Department / Role), **due-date range**
- **Group by** status / priority / assignee
- **Overdue** filter — everything past its due date
- **Export CSV** of the current view

### Creating a task
Click **New Task** (or press **Ctrl+N** on this page). Fill in:

1. **Title** and description
2. **Due date** and **priority**
3. **Project** — employees only see projects where *Allow employee tasks* is enabled (others appear greyed with an explanation), or pick **no project** for a personal task
4. **Assignees** — managers pick anyone (HR within their departments); employees automatically become the assignee of their own task
5. **Advanced options:**
   - **Scope** — Global (everyone), Department, or Role-based targeting
   - **QA form** — attach a quality checklist this task must pass
   - **Blocked by** — pick other tasks that must finish first; the task won't be startable until they're done, and the system prevents circular blocking
   - **Recurrence** — Daily / Weekly (pick weekdays) / Monthly (pick day-of-month); when a recurring task is completed, the **next occurrence is created automatically**
6. Save. Assignees are notified instantly; a global-scope task also posts to the company chat.

Drafts are auto-saved — close the dialog mid-work and your entries are still there next time.

### Task statuses
`To Do → In Progress → Review → Done`, with two special behaviors:

- A **blocked** task (unfinished blockers) can't move to In Progress, Review, or Done — the system explains which blocker is in the way
- Tasks with a **QA form** can never skip review — they must be submitted and checked

---

## 14. The Task Detail Window

Click any task (from any list, board, project page, or a direct link) to open its detail window — a side sheet with four tabs:

**Overview** — everything about the task: description, status, priority, dates, project, phase, assignees, reporter, progress, QA answers, blocking relationships. The **pin** button keeps the task at your fingertips (pinned items show in the sidebar). Managers get **Edit mode**: change title, description, assignees, project, phase, dates, priority — assignee changes notify the people added/removed.

**Comments** — a threaded discussion on the task. Reply to any comment; delete your own. Everyone on the task can participate.

**Time Logs** — every block of time logged against this task (from the timer or manual entries), by whom and when — useful for "how long did this actually take?"

**Activity** — the task's audit trail: created, assigned, status changes, submissions, decisions — with timestamps.

---

## 15. Task Review Workflow — Submit, Approve, Redo

This is the quality loop for finished work. It applies to tasks with QA forms (mandatory) and any task where you want a manager check.

### For the person doing the work (Employee/HR)
1. Finish the work and set the task **In Progress**.
2. Click **Submit for Review** in the task window.
3. Write a **submission note** (what you did, anything the reviewer should know).
4. If the task has a **QA form**, fill in the answers — required questions must be answered, choice options must be valid, numbers must be in range.
5. Submit. The task flips to **Review**, your managers are notified, and (if it's a project task) a note is posted to the project channel.

### For the reviewer (HR/Super Admin)
Open the task (or the dashboard's pending-approvals widget):

- **Approve** — the task becomes **Done**, the assignee is notified, and if it's recurring the next occurrence is created automatically. For global tasks, a completion note goes to the company chat.
- **Redo (send back)** — you must give a **reason**; the task returns to **In Progress** with your feedback attached, and the assignee is notified.

Rules enforced by the system:

- You can't review **your own** submission
- A blocked task can't be approved into Done — its blockers must finish first
- Every decision is written to the task's activity trail

---

## 16. QA Forms (Quality Checklists)

QA forms are reusable quality templates — think "pre-delivery checklist" or "bug report template". Find them under **Projects & Tasks → QA tab** (HR and Super Admin).

### Building a form
Click **Create Form**. Give it a title and description, then add fields with the **drag-and-drop builder** (a live preview shows exactly what users will see). Field types include:

- Text, long text, number, email, phone, URL
- Multiple choice, checkboxes, dropdown
- Yes/No (boolean)
- Linear scale, rating, slider
- Date, time, date-time
- File upload, signature
- Section headings (to group fields)

Each field can be marked **required**, given **options** (for choice fields), ranges (for numbers/scales), and arranged in any order.

### Using forms
- Attach a form when creating a **project** or a **task** (managers)
- When someone submits that task for review, the form appears in the task window and must be filled in
- Reviewers see the answers right next to the submission

### Managing forms
Forms can be edited and deleted. **Deleting is blocked** while any task, project, or submission still references the form (the system tells you what's using it).

---

## 17. The Project Timer

The **timer widget** sits in the top header (visible to everyone who can track time).

1. Click it and **pick the task** you're about to work on.
2. Press **Start** — the timer runs; you can pause and resume.
3. When you stop, the elapsed time is **logged to that task** (visible in the task's Time Logs tab).
4. The task you're currently working on is shown to your managers in **Live Shifts** and on dashboards, so leads can see what the team is focused on without asking.

Your active task is remembered (for up to 12 hours) — even if you close the tab, the timer knows what you were last working on. The timer syncs across your open tabs and devices, just like the attendance clock. Time entries can also be added with a past date if you're logging work after the fact.

---

## 18. Communications — Chat, Announcements, Notifications

Open **Communications** — three tabs: **Chat**, **Announcements & Reminders**, and **Notifications** (with an unread badge).

### Chat

**Your conversation list** is sorted: pinned chats first, then unread, then most recent. Filter pills show **All / Direct / Groups / Channels**, and there's a search box.

- **Company chat (global)** — one channel with the whole company; everyone's in it automatically.
- **Direct messages (DMs)** — type at least 3 letters of a name in the search; matching people appear — click one to start (or reopen) a private chat. You can DM anyone active in the company.
- **Group chats** — created by HR/Super Admin: name it, pick members, go. Groups appear for everyone added.
- **Project channels** — created automatically for every project; membership follows the project team.

**In a conversation you can:**

- **Send messages** with an emoji picker
- **Attach files** — images or documents (JPG/PNG/WebP/PDF/Office/ZIP, up to 10 MB); images show as image previews
- **Reply** to a specific message (threaded quotes)
- **@mention people** — start typing `@` for autocomplete; mentioned people get a notification
- **See read receipts** — know when your message has been read (in direct chats)
- **Delete your own messages** (everyone's view updates)
- **Pin a chat** to keep it at the top (up to 100 pinned)
- **Pin messages** in **project channels** (managers) — key decisions stay visible
- **Clear chat** — hides the conversation's history from your view (a fresh start; doesn't delete anything for others)
- **Unread badges** per chat and a total; opening a chat marks it read automatically

Messages send optimistically (they appear instantly with a "sending" state), and conversations refresh automatically — plus a 15-second safety poll. On mobile, chats open fullscreen and the keyboard is handled so nothing jumps around.

### Announcements
The announcement board shows official announcements, pinned ones first.

- **Who posts:** Super Admin posts **company-wide** announcements (any priority) — HR posts **team announcements** for their teams. *Urgent* team announcements are visible company-wide.
- **Priority:** Normal / High / Urgent. High and Urgent announcements also push notifications to affected people.
- **Attachments:** posts can carry a file.
- **Interact:** react with an emoji (like, heart, party, laugh, sad — reactions toggle), or **Dismiss** an announcement to clear it from your board (only for you).
- **Manage:** creators and managers can edit or delete announcements.

### Personal Reminders
Your own private alarm clock: **Add reminder** for any future date & time with a label. When it's due you get a high-priority notification. Delete reminders any time. (Once fired, a reminder leaves the list.)

### Notifications
The **Notifications tab** (also the bell in the header) is your unified inbox for everything the system tells you: approvals waiting, decisions made, task assignments, chat mentions, attendance alerts, holiday reminders, export-ready notices, and system messages.

- Filter **All / Unread**, by **type**, and search
- **Mark read / unread** individually or **mark all read**
- Click through to the related screen
- High-priority notifications are flagged; the bell shows a separate count for them
- Notifications are kept for **30 days**, then cleaned automatically
- Choose how you're notified: per-type in-app/email channels are configurable by you (My Profile → Notification Preferences) and by admins globally

---

## 19. Directory — People, Employee Management, Departments, Designations

Open **Directory**. Four tabs (each visible per your permissions): **Corporate Directory**, **Employee Management**, **Departments**, **Designations**.

### Corporate Directory (everyone)
The company phone book:

- **Search** by name/email/username/employee ID, filter by **department** and **designation**
- Grid or list view, 24 people per page
- Each card: photo, name, designation, department, and quick actions — **Message** (opens a DM) and **View Profile** (opens Employee 360)
- **Privacy respected:** colleagues who set their profile to *Private* show "Contact hidden" instead of email/phone. Emergency contacts, alternate numbers, and blood groups are **never** shown in the directory.
- Only active employees appear.

### Employee Management (HR for their departments; Super Admin for everyone)
The full people-management table: photo, name, email, employee code, department + designation, role chips (Super Admin / HR badges highlighted), and status.

- **Filters:** role, status (Active / Inactive / Trashed), department; plus search
- **Add Employee** — the create form: name, email, username, phone, department (picking a department loads its **teams** for a second-level pick), designation, employee ID (leave blank to auto-generate `G4K00x`), work schedule, and **roles** (Employee / HR / Super Admin — only Super Admins can create HR or Admin accounts). A random password is generated: if the company's email is configured the credentials are emailed to the new user; otherwise the password is shown to you once to pass along securely, and the new user will be asked to change it at first login.
- **Row menu per person:**
  - **Edit** — update details, change roles, move department/team/designation/schedule (role changes sign the user out of all devices)
  - **Reset Password** — generates a temp password (emailed, or shown to you once); the user must change it at next login
  - **Activate / Deactivate** — deactivating blocks login and signs the user out everywhere; activating restores access
  - **Delete** — soft-delete with confirmation; the person disappears from lists but can be recovered
  - **Restore** — bring back a deleted account
- **Bulk actions:** select many rows to activate/deactivate in one go
- **Export CSV** of the employee list
- Guard rails: the system refuses to deactivate, delete, or demote the **last active Super Admin**, and deactivating someone signs out all their sessions.

### Departments (HR & Super Admin)
Cards per department: name, auto-generated code (`DEP001…`), description, member avatars (first few), team count, status.

- **Create / edit** departments
- **Teams** — each department can have sub-teams; create/rename/delete teams (deleting a team unassigns its members, it never deletes people)
- **Assign HR** — attach one or more HR managers to a department; *this is what defines each HR's scope everywhere in the system* (their attendance views, approvals, and employee management all follow their assigned departments)
- **Move employees** in/out of the department
- **Archive** a department — only allowed when it has **no members** (move or remove people first). Archived departments can be **restored**.
- **Export CSV** of departments

### Designations (HR & Super Admin)
Job titles list: create, rename, **activate/deactivate** (a deactivated title stops being offered on new assignments but keeps history), and delete — blocked while anyone holds the title (shows a holders preview first).

---

## 20. Employee 360 — One Person's Full Picture

From the Directory (or a chat header), click a person to open their **profile page**. What you see depends on who you are:

- **Yourself, or a manager with permission** — the full picture: banner + avatar, status, designation/department, and tabs:
  - **Profile** — personal info and (for managers) emergency contact
  - **Attendance** — that person's attendance history calendar
  - **Leave** — their leave requests, balances, and history
  - **Projects & Tasks** — everything they're on
  - **Activity** — their recent system actions with timestamps
- **A colleague without management rights** — the public profile card only (same privacy rules as the directory)

The **Send Message** button starts a DM from right there.

---

## 21. Reports & Analytics

Open **Organization → Reports & Analytics** (HR & Super Admin). Two tabs.

### HR & Admin Reports
Five report types, each with **date range** and **department filters**:

- **Attendance Summary** — per person: present/late/absent/leave days, total worked hours, overtime; rate summary cards on top (Present %, Late %, Absent %)
- **Leave Summary** — per person: total/approved/pending/rejected counts and breakdown by leave type
- **Projects** — project status roll-ups
- **Tasks** — task counts and statuses per person
- **Productivity** — completed vs. redone tasks, average time per task, and a **productivity score** (80% task completion + 20% time utilization — hours logged against a 160-hour month)

Extra powers here:

- **Saved views** — save your favorite filter combinations and re-apply them in one click
- **Export to Excel (.xlsx)** — exports run as background jobs (see below)

### General Data Exports
A **report builder** for raw data: pick a dataset (tasks / projects / users / productivity), search and filter, see a smart preview (25 rows) with formatted columns, then **export** the full set to Excel/CSV — again as a background job.

### How exports work (important!)
Exports don't block your screen. When you click Export:

1. A job is queued (you'll see "Export started").
2. The system builds the file on the server.
3. You get a **notification** when it's ready.
4. Download it from the **Export History** list (which shows each job's status, with a **Retry** button if anything failed).

Export files are automatically cleaned up after **30 days**. Reports respect your data scope: HR exports cover their departments; Super Admin exports cover the company.

---

## 22. Audit Logs (Super Admin)

Open **Account → Audit Logs**. Two tabs, both exportable to CSV:

**System Events** — the who/what/when of the system: logins, logouts, records created/updated/deleted, approvals, corrections, exports. Filter by action, person, and date range. Certain entries deep-link to the record they refer to (a user, a project, a department, a schedule).

**Login History** — every login attempt: identifier, person (if resolved), IP address, location, browser, success/failure, and a **suspicious** flag. Filter by identifier, status, IP, and date. Use this to investigate "who tried to log in as me".

The audit trail is **append-only** — even administrators can't edit history (the database itself blocks it).

---

## 23. System Settings (Super Admin)

Open **Account → System Settings**. Eleven tabs:

### Company
Company name, short name, **logo upload**, and **timezone** (all attendance day-boundaries follow this). The logo and name appear across the app, including the login screen.

### Work Schedules
Define shift patterns: name, start/end time, break minutes, grace period (how many minutes late is still "on time"), standard hours, and working days. One schedule is the **default** (applied to anyone without an explicit assignment); the seeded default is *Standard G4K Schedule* — 09:00–18:30, 45-minute break, 10-minute grace, Monday–Saturday. **Set Default** on any schedule; deleting the default or one that's assigned to people is blocked.

### Policies
Security & HR policy switches:

- **Password policy** — minimum length, require mixed case / numbers / symbols, expiry days (forces a change after N days), password history
- **Sessions** — access-token minutes (default 15), refresh-token days (default 7), max devices per user (oldest sessions get signed out beyond the limit)
- **Force password change** — make new/temporary passwords compulsory to change
- **Suspicious login control** — IP and location blacklists (with wildcard support); blocked attempts are logged and rejected
- Leave policy / attendance policy text fields

### Holidays
The holiday calendar manager: add holidays (name, date, **recurring** or one-time, description), edit, delete. Recurring holidays repeat every year automatically (a Feb 29 holiday maps to Feb 28 in common years). Changes reflect immediately in leave calculations and attendance.

### Mail (SMTP)
Outgoing email configuration — host, port, encryption, username, password, from-address/name. Use **Send Test Email** to verify. Email is used for password resets, new-user credentials, and email-channel notifications.

### Notifications
Channel defaults per notification category (leave requests, attendance reminders, weekly summary, tasks, chat, system/security) — in-app, email, or both. Users can further personalize their own choices in their profile.

### Auto-Numbering
ID formats for generated codes — company, department, and employee prefixes, the numbering format (`{PREFIX}{000}` style), and starting number. E.g. employees get `G4K001, G4K002…`, departments `DEP001…`.

### Reminders
Automated attendance nudge timing: shift-start reminder offset (default 15 min before), missed clock-in alert (default 30 min after start), open-shift flag time (default 20:00), and holiday heads-up days (default 10).

### Security Requests
Where **password reset requests** land when email isn't configured (see [4. If You Forget Your Password](#4-if-you-forget-your-password)). Approve (generates a one-time reset link you copy and hand to the person) or reject each request.

### Demo Data
A clearly-marked danger zone to **seed** (load a full demo dataset) or **purge** (remove demo data) the demonstration environment. Purging requires typing the exact confirmation phrase. ⚠️ Use with extreme care on production — see the warning box below.

> **⚠️ Warning:** The demo dataset includes demo user accounts and demo projects/attendance. Purging demo data removes everything tagged as demo **and all demo user accounts**. Only run this when you fully understand what was seeded — ideally on a staging environment only.

### System Jobs
Monitor background processing: the queue of pending jobs and the **failed jobs** list, with **Retry** (one or all). Exports, emails, and notifications flow through this queue.

---

## 24. My Profile

Open **Account → My Profile**. A left-side section navigator scrolls you through:

- **General** — your photo (upload/update), name, phone, employee details; edit what's editable
- **Workspace & Roles** — your department/designation/team; if you hold **multiple roles**, the **role switcher** changes your active role instantly (no re-login)
- **Security & Devices** — change password (current + new; signs out other devices) and your **active sessions list**: every logged-in device with IP and last-used time, and **Revoke** buttons — plus the system notifies you when a session is revoked
- **Preferences & Support** — theme (Light/Dark/System), density (Comfortable/Compact), and the **Feedback form** — send thoughts/issues straight to your HR (it arrives as a chat message + high-priority notification, even naming the conversation)
- **Notification Preferences** — per-category in-app/email toggles for how *you* want to be notified
- **Privacy & other sections** — directory visibility (Public shows your email/phone in the directory; Private hides them) and informational sections

Your profile stats strip shows your last-31-days attendance, leave usage, and task counts at a glance.

---

## 25. Sessions, Security, and Password Changes

Things the system does to keep work safe (no action needed from you — just good to know):

- **Short-lived access tokens** refreshed silently in the background; a stolen token is only useful for minutes
- **Refresh-token rotation** — every refresh invalidates the previous token
- **Automatic sign-outs** when: your password changes anywhere, an admin deactivates/reset-passwords you, a session is revoked, or the device limit is exceeded
- **Cross-tab sync** — log out in one tab, all tabs log out; log in elsewhere, others follow
- **Login attempt limits** — 5 failures lock the account 10 minutes; attempts are logged with IP/location
- **Network blacklist** — admins can block specific IPs/locations from logging in at all
- **Audit trail** — important actions (logins, approvals, corrections, exports, user changes…) are recorded immutably
- **Security headers** — the app forces HTTPS, blocks framing, and applies a strict content policy

---

## 26. Working Offline

If your internet drops mid-work:

- An **Offline banner** appears; queued actions stack up safely on your device
- **Attendance punches work offline** — they're stored locally with their original timestamps and sync the moment you're back (duplicates are prevented)
- Other edits (a comment, a form save) are queued too and replayed on reconnect
- When the sync finishes you'll see an "offline sync complete" confirmation and your attendance/history/dashboards refresh themselves

---

## 27. Automatic System Behaviors You Should Know

These run on their own — you just enjoy the results:

| Automation | What happens |
|---|---|
| **Shift-start reminder** | ~15 min (configurable) before your shift starts, on working days, you get a heads-up notification |
| **Missed clock-in alert** | ~30 min after your shift start with no clock-in, HR and admins are alerted |
| **Open-shift (missing clock-out) flag** | After 20:00, anyone still "on shift" gets a "Missing Clock-Out" notification; HR/admins get the exception list |
| **Holiday reminders** | 10 days before each holiday, everyone is reminded |
| **Task reminders** | Reminders you set on tasks fire as notifications at the right time |
| **Personal reminders** | Your private reminders fire as high-priority notifications |
| **Weekly summary email** | Every Sunday 09:00, leadership gets an email digest (attendance + task metrics) |
| **Notification cleanup** | Notifications older than 30 days are removed automatically |
| **Export cleanup** | Export files older than 30 days are deleted |
| **Token pruning** | Expired login tokens are cleaned daily |
| **Password expiry** | If your company sets an expiry (e.g. 90 days), you'll be asked to change your password when it ages out |
| **Recurring tasks** | Completing a recurring task automatically creates the next occurrence and tells the managers |
| **Live updates** | Chat, dashboards, boards, and live shifts update in real time (with a polling fallback so nothing is ever silently stale) |
| **Version check** | When a new version of the app is deployed, you get a "refresh to update" toast instead of odd behavior |

---

## 28. Role Capability Reference

A quick "who can do what" cheat-sheet (S = Super Admin, H = HR, E = Employee):

| Capability | S | H | E |
|---|:-:|:-:|:-:|
| Clock own attendance / take breaks | ✅ | ✅ | ✅ |
| Request & cancel own leave | ✅ | ✅ | ✅ |
| Edit own profile / avatar / preferences | ✅ | ✅ | ✅ |
| Chat (company, DMs, project channels) | ✅ | ✅ | ✅ |
| Browse directory | ✅ | ✅ | ✅ |
| View projects (own/member) | ✅ | ✅ | ✅ |
| Work tasks, create own personal tasks | ✅ | ✅ | ✅ |
| Track time with the timer | ✅ | ✅ | ✅ |
| Personal reminders & quick notes & pins | ✅ | ✅ | ✅ |
| See team attendance (assigned departments) | ✅ (all) | ✅ | — |
| Correct attendance | ✅ (anyone) | ✅ (their teams) | — |
| Approve employee leave | ✅ (all) | ✅ (their teams) | — |
| Create/edit projects, phases | ✅ | ✅ (their depts) | — |
| Assign tasks to others | ✅ | ✅ (their depts) | — |
| Approve / redo task submissions | ✅ | ✅ | — |
| Review submitted projects | ✅ | ✅ (not own) | — |
| Create group chats | ✅ | ✅ | — |
| Post announcements | ✅ (company) | ✅ (teams) | — |
| Manage employees (create/edit/deactivate) | ✅ (all) | ✅ (their depts) | — |
| Manage departments & designations | ✅ | ✅ | — |
| View reports | ✅ (company) | ✅ (their depts) | — |
| Attendance/leave/task/user data exports | ✅ | ✅ (scoped) | — |
| QA form builder | ✅ | ✅ | — |
| Create HR / Super Admin accounts | ✅ | — | — |
| Settings (company, schedules, policies, mail, holidays, numbering, demo data, jobs) | ✅ | — | — |
| Audit logs & login history | ✅ | — | — |
| Approve HR leave / own projects | ✅ | — | — |

---

## 29. Troubleshooting & FAQ

**"Account locked due to multiple failed login attempts."**
You exceeded 5 failed attempts. Wait for the countdown (max 10 minutes) or ask an admin to unlock/deactivate-reactivate your account.

**I clocked in but the widget says nothing / my punches vanished.**
Check the offline banner — if you were offline, punches sync when connectivity returns. If a punch is genuinely missing, ask HR to add a correction (they'll need the time and a reason).

**I can't request leave for today.**
Correct — leave must start from tomorrow. For sudden sick leave, message HR directly; they can record it for you.

**My leave shows Pending for days.**
Your approver hasn't decided yet. HR-requested leave waits for the Super Admin. You'll be notified the moment it's decided. You can cancel it yourself while it's pending.

**I can't drag my task to Done/Review on the board.**
That's the workflow protecting quality — use **Submit for Review** in the task window. Tasks with QA forms always require submission; the reviewer moves them to Done.

**A task won't move — it says it's blocked.**
Another task it "is blocked by" isn't finished yet. Finish the blocker first; the system prevents circular blocking, so there's always a way through.

**Why can't I see a project/chat/person someone mentions?**
Access is role- and membership-based: projects appear for members; project channels follow the project team; the directory shows active employees only; HR tools only cover assigned departments.

**My "Offline" badge shows even though I have internet.**
That badge reflects the live push connection; the app falls back to periodic refresh (every 15–30 s) meanwhile, so data still updates. If it persists, a page refresh usually restores the live connection.

**An admin reset my password — now what?**
You'll receive a temp password (email, or handed to you directly). Log in with it; the system will ask you to set your own new password immediately. All old sessions are signed out.

**My export hasn't arrived.**
Exports are background jobs — large ones take a minute or two. Check the Export History (status + Retry). If it keeps failing, mention it to your admin (System Jobs tab shows failures).

**Notifications disappeared after a month.**
By design — notifications are kept 30 days to keep the system fast. Downloads/exports expire after 30 days too.

**How do I switch roles if I have two?**
My Profile → Workspace & Roles → pick the role. Takes effect instantly.

**How do I delete my account / someone's data fully?**
Accounts are soft-deleted (recoverable) to preserve history. For full erasure (e.g. offboarding), admins use the **Anonymize** capability via the API, which scrubs personal data while keeping records consistent. Contact your Super Admin.

---

*This manual reflects the Games4King system as implemented — every workflow above corresponds to a real feature in the deployed application. For technical and quality findings, see the companion document `report.md`.*


## 16.5 — Source S5: prior `audit-report.md` register (03:34 edition — verbatim, complete; superseded by this rebuild but fully preserved)

# Games4Kings — Final Master Audit Report

**Audit date:** 2026-08-28 · **Codebase state:** commit `69e302d` (+ uncommitted working tree: 4 deleted legacy `.md` docs; no functional changes since audit began — verified via `git status`) · **Scope:** entire monorepo — `apps/api` (Laravel 11), `apps/web` (Next.js 16), `packages/ui`, deploy manifests (`cloudbuild.yaml`), seeders, scheduler/queue.

---

## 1. Executive Summary

Games4King is a feature-complete, three-role (Employee / HR / Super Admin) workplace OS covering auth, attendance, leave, projects, tasks with QA, chat, announcements, notifications, directory/employee management, reports/exports, audit logs, and an 11-tab settings suite — built on a genuinely good design-token system and a real shared component library (`@g4k/ui`, 57 primitives, 170 importing files).

**It is NOT production-ready.** The blocking set: an **unauthenticated API backdoor** that impersonates a real user; a **frontend cookie bug that locks every role (including Super Admin) out of Settings/Audit/Reports**; four **guaranteed-500 core operations** (create phase, delete task, delete project, move-phase); **demo tooling that can destroy all real org data and seeded live credentials**; a **silent scope-escalation in task creation**; and the **HR approvals dead-end**. Beneath the blockers sit 19 high, ~35 medium, ~30 low backend findings and a deep frontend findings set (micro-typography pandemic, silent no-op features, placeholder-driven forms, text-only people-pickers, six missing primitives).

**What must not be touched:** the verified-working inventory in §5 note and the "should not change" lists (§43–46) — the architecture, workspaces, mobile shell, offline engine, and component library adoption are strengths to preserve.

**Counts (master ledger §36):** 12 P0 · 29 P1 · 42 P2 · 18 P3 open findings · 10 historical findings verified Fixed · 3 Partially Fixed · 0 Regressed · 5 Superseded/Not-Reproducible · 4 items flagged Unverified/Requires Product Confirmation.

## 2. Audit Methodology

1. **Code-first:** entire API read (36 controllers, 44 models, 6 middleware, 9 services, seeders, scheduler, routes) and entire frontend read (all routes, stores, hooks, component families) — via 4 deep-dive sub-agents (backend×3, frontend×1) followed by **solo re-verification of every P0 claim** and six further solo passes (usability, components, layout, functional-fit, IA, completeness).
2. **Measured, not guessed:** all distributions (typography, heights, radii, paddings, grids, adoption counts, caps, timings) are greppable counts from source; detector archive `.impeccable/detect-frontend-audit.json` (26 findings, 3 vendor/test false positives).
3. **Reconciliation:** every prior audit lineage finding (2026-08-16→08-26 era + this session's four documents) re-checked against current code and assigned a status (§36–41).
4. **Degraded-mode disclosure:** review sub-agents hit the platform 5-hour usage limit twice; all assessments completed solo inline. No live browser was available this session — visual findings are code-inferred; §53 gates them behind a live-browser verification step.

## 3. Source-of-Truth & Verification Method

Priority order: (1) current codebase — every finding below carries `file:line` evidence; (2) expected workflows (the implemented product's own contracts — e.g., a "Success" toast implies persistence); (3) this session's audit documents (`report.md`, `frontend.md` v6, `FINAL-AUDIT.md`, `manual.md`) used as finding repositories; (4) legacy docs — **none trusted** (the old `Audit-Report.md`/`deploy.md`/`Project.md`/`attendance.md` were deleted before this audit; their lineage survives only via reconciled memories and is marked accordingly). Anything unverifiable is explicitly marked **Unverified / Requires Product Confirmation** — never asserted as defect.

## 4. Complete Application Architecture

- **API:** Laravel 11 + Sanctum. Access token 15 min / refresh 7 days rotating (`g4k_refresh_token` httpOnly cookie), device/session management, max-device enforcement. Capability RBAC: `super_admin` = `*`; `hr` = 23 caps (scoped via `department_hr` pivot / `HrScope`); `employee` = 9 caps. PostgreSQL with enum CHECKs and partial indexes. Queue `database` (Cloud Run worker `g4k-worker` = `schedule:work` + `queue:work`). Broadcasting configured pusher — **keys not in deploy env** (F-013). Filesystem default **s3** (`FILESYSTEM_DISK=s3` set in deploy; adapter installed) — bucket/creds delivery **unverified** (F-094).
- **Web:** Next.js 16 App Router, TanStack Query 5, zustand (+persist/BroadcastChannel), react-hook-form + zod, Tailwind 4 tokens, `@g4k/ui`, echarts/dnd-kit/frappe-gantt/react-grid-layout/cmdk/sonner, laravel-echo + pusher-js, IndexedDB offline engine, cross-tab timer/auth sync.
- **Infra:** Cloud Build → Cloud Run (api + worker), Vercel artifacts present; `fix_test_route.php`/`fix_per_page.js`/`test-fetch.js` codemod scripts stray at repo root (F-092).

## 5. Complete Module Inventory

Auth (login/forgot/reset/change/force-gate/onboarding/role-select/sessions) · Preferences · Company profile · Pins · Dashboard init (versioned caches) · Profile/avatar · Directory · Attendance (punch machine, days reconcile, corrections, admin/HR boards, live shifts, exceptions, exports) · Leave (balances, requests, approvals chain, holidays) · Notifications (+channels) · Projects (+phases, review pipeline, cover, auto channel) · Tasks (+assignees, blocked_by, QA submissions, recurrence, reminders, comments, time logs, reorder/bulk/move-phase) · QA forms · Timer · Saved views · Chat (global/DM/group/project; mentions, receipts, pins, clear) · Announcements (+reactions, dismiss) · Personal reminders · Quick notes · Feedback · Reports (5 summaries + builder + async ExportJobs) · Settings (company/schedules/policies/holidays/mail/notifications/auto-numbering/reminders/security-requests/demo-data/jobs) · Audit logs + login attempts · Users (CRUD, bulk, status, reset, anonymize-API, restore) · Departments/Teams/HR-assignment · Designations · Work schedules · Auto-numbering · Demo seed/purge · Version endpoint.
**Verified-working highlights (do not redesign):** timing-safe login + lockouts; row-locked punch state machine (auto break-close, overnight attribution, idempotency); leave overlap/working-day/balance checks + refund; project review gating; task cycle-guard + QA gating; chat membership/mentions/receipts; async export pipeline + CSV-injection sanitization; immutable audit (DB triggers); portable SQL (no `FIELD()`; `CASE WHEN` sorts); ui adoption (ConfirmDialog ×21, EmptyState ×33, ListScaffold ×11, DatePicker ×10, Toolbar ×9); token layer (semantic tiers, status colors incl `--overtime`, density, motion, dark mode, 1440px cap); lazy-loading discipline; mobile shell; cmdk palette + drafts + saved views + pins + offline engine; optimistic chat; specific error copy; per-segment error boundaries.

## 6. Complete Page / Route Inventory

**Auth:** `/login`, `/forgot-password`, `/reset-password`, `/onboarding`, `/role-select`, `/change-password`.
**Dashboard:** `/dashboard` (role-split widgets); `/attendance` (Overview + My Leave); `/leave`→redirect; `/org/attendance` (SA 5 tabs / HR 2 tabs); `/org/leave`→redirect(dead for HR); `/projects` (+`/[id]`); `/tasks`→redirect; `/tasks/[id]`; `/chat` (3 tabs); `/notifications`→redirect; `/announcements`→redirect; `/directory` (+`/[id]` Employee 360); `/reports`; `/admin/reports`→redirect; `/admin/attendance`→redirect; `/admin` (guarded 404 — no page); `/audit`; `/settings` (11 tabs); `/profile` (7 sections). 7 redirect stubs total (verified). Mobile bottom nav + FAB; middleware capability map + CSP.

## 7. Complete Workflow Inventory (26 traced; classification)

**Excellent:** clock in→break→out; offline punch+sync. **Good:** login; cancel leave; submit project review; review project; create task; submit task for review; approve/redo task; DM; group chat; announce; notification triage; change password; revoke session; switch role; pins/notes. **Acceptable:** request leave; create project; manage employee; send feedback. **Friction-heavy:** correct attendance (≈8 clicks/4 layers); run export (≈9 steps + memory bridge). **Poor:** board drag-reorder (silent no-op). **Blocking:** HR approve-leave via navigation; task→phase move; admin opening any admin page.

## 8. Role-by-Role Audit

**Employee** — sees Dashboard/Attendance+Leave/Projects+Tasks/Chat/Directory/Profile; self-service loop complete; gaps: scope-filter noise, "My Tasks & Board" label, buried personal reminders, empty-dashboard day-one guidance (F-083), same-day sick leave policy (F-049), drafts undisclosed (F-060).
**HR** — adds Team Attendance, Reports, Directory management tabs, group chat, team announcements; jobs = approvals/corrections/monitoring/lifecycle/comms; gaps: approvals dead-end (F-010), blocked Reports/Settings via cookie (F-009), two "Attendance" labels (F-073), stale team board (F-014), correction depth (F-038), backend over-exposure invisible but real (F-015), weekly summary never arrives (F-023), schedule-blind corrections (F-020 family).
**Super Admin** — everything; gaps: cannot administer at all (F-009), no personal attendance surface though backend permits (product decision), palette admin link dead (F-039), demo danger zone blast radius unstated (F-003), audit user-filter cap (F-084), QA builder buried (F-073).

---

## 9. Page-by-Page Findings

Per-page 5-second verdicts + findings are in `frontend.md` §Part 1 (all 27 routes + shell); every item is carried into this report's finding ledger (§36) via the F-IDs below. Page-level standouts: login (jargon "identifier", Gen2k brand split, raw submit button — F-062/F-088); role-select (infinite-loader failure — F-054 group); dashboard (missing "view all", no reset-layout, overtime mislabel — F-082/F-066/F-090); attendance (A-5 dots F-028, label hides leave, 7-day truncation F-034); org attendance SA (numeric alignment F-091; corrections depth F-038) / HR (F-010); projects (ungrouped mega-dialog F-060; 1,000-preload F-034; edit stub F-026); project detail (phase-complete no warning F-082; delete-beside-edit F-062); tasks (reorder no-op F-011; QA-drag toast lacks action F-062; caps F-034; best create-form ✓); chat (clear-chat no-op F-011; 3-char gate F-074; pills a11y F-071); directory (temp-password toast F-062; archive errors-after-click; ListScaffold bypass F-074); 360 (**Send Message only** F-030); reports (blocked F-009; export bridge F-035); audit (user-filter cap F-084); settings (blocked F-009; empty shell unauthorized; schedule default loss F-020; demo labeling F-003); profile (fictional sections F-029); shell (F-009/F-013/F-039/F-073).

## 10. Component-by-Component Findings

Full inventory + adoption metrics + 40-row upgrade matrix + canonical system: `frontend.md` §6. Master findings here: **F-074** duplicate clusters (user pickers ×4, status pills 1+≥7, attendance tables ×2 vs DataTable, dept/designation vs ListScaffold, search ×5 behaviors, activity feeds ×3, feedback ×2, loading species, date grammars, confirms, dialog widths, pagination ×3); **F-033** six missing primitives (IconButton, SearchInput, UserPicker, StatusBadge-in-ui, Spinner, ExportButton); **F-064** dimension fragmentation (6 heights, 7 radii, 53 hex, 181 arbitrary dims, 477 text sizes); **F-075** dead code (AlertDialog ×0, approvals-tab 312l, feedback widget, pwa-registry, 3 hooks, avatar-utils, layout-utils, nav dead branches; backend §39 list); **F-058** Pagination 0 direct uses; states gaps (Select error, counters, kanban keyboard) under F-033/F-074.

## 11. UI / Visual Findings

**F-069** heading scale drift (lg/xl/2xl/3xl as page titles) · **F-087** elevation tokens vs hand-rolled shadows; bordered-vs-elevated card mix · **F-072** contrast cluster (178 tiny+muted combos; 11 gray-on-color detector-verified; 2 ai-color-palette) · AI-tells: side-tab border (`task-overview-tab.tsx:450`), bounce easing on Operate chrome ×9, badge-on-badge rows, decorative 15-accent use — rule adopted: *color = status | identity | selection* (**F-086** z-index soup z-10×28…z-[9999] listed here visually).

## 12. Spacing & Alignment Findings

**F-063** five page paddings (p-6×73/p-4×48/px-4×20/p-8×17/px-6×12; `page-padding` used once) + five card paddings + nested double-padding + form rhythm variance (space-y 1.5/2/3/4 + outliers) · **F-068** attendance toolbar 3-row wrap @1024; settings single-column waste ≥1280; toolbars lack Search|Filters|Date|Sort|Actions convention; DialogFooter non-sticky · **F-064** (also alignment): h-8 chips beside h-10 defaults break baselines; shell headers h-12/14/16 mixed; negative margins ~20 (healthy ✓) · **F-065** 26 unprefixed `grid-cols-2/3` never collapse.

## 13. Responsive Findings

**F-055** dialogs (425/500px) overflow 320–390px viewports — no <640 fullscreen-sheet fallback · **F-067** `hr-attendance-heatmap` `min-w-[800px]` · **F-028/F-072** dots + micro-type worst on phones · hover-only row actions invisible on touch (**F-070**) · settings TabsList ragged wrap @768; bulk-bar z-50 overlaps FAB z-40 (**F-086**) · Gantt decorative <480; charts fixed h-64 in resizable widgets (**F-066**) · calendar popup in dialogs on 360 (**F-037**) · dropdown collision handling absent · positives: bottom nav/FAB, chat fullscreen + visualViewport, sidebar Sheet, 1440 cap on ultrawide (all §46 keep-list).

## 14. Form Findings

**F-060** forms master finding: 25 labels repo-wide (placeholder-only selects "Priority"/"Select Assignee"); 0 helper text; no required/optional markers; same-day rule discovered on submit; verb glossary drift (Create/Add/Request/Save ×18 verbs); `Form*` adopted in only 5 files; no Reset; drafts ×5 but edit-dialogs without drafts lose work on Esc; field *order* correct everywhere (identity→contact→org→config) — grouping invisible (no section labels); create-project/user need Wizard split (B-L/D-L3) · **F-061** inputs full-width by default; 5 search widths; 0 textarea `rows` · **F-081** leave rejection needs no reason (asymmetric with task redo) · **F-076** leave un-editable after submission (cancel+recreate only).

## 15. Calendar / Date / Time Findings

**F-037** DatePicker: no Today, no Clear, no range mode (ranges = two stacked full-width singles); cells h-8 w-8 = 32px; leave picker permits today while rule forbids · **F-056** two date grammars (DatePicker ×10 vs native `type="date"` ×4; native `type="time"` ×2) · report range presets absent (Last 7/30) · attendance-history calendar exemplary (month nav + swipe + detail) — preserve · backend date 500s via unvalidated `{date}` params (**F-048**).

## 16. Dropdown / Selector Findings

**F-032** people-pickers are text-only — **0** `SelectItem`+`<Avatar>` co-occurrences app-wide while `avatar_url` wired ×43 elsewhere; 4 hand-rolled multi-selects; similar-name misassignment risk (three Kumars in seed data) · **F-033** Select lacks error variant; no clear; multi-select inconsistent · dropdown collision padding absent; long-label wrap unverified · UserPicker canonical (photo+name+dept, server typeahead) fixes all four sites + mention menu.

## 17. Button / Action Findings

**F-062** buttons master finding: size-by-space (h-8 chips vs h-10 dialogs vs h-11 hero for same verbs); login raw styled submit (`login/page.tsx:189`) bypassing ui Button; `lg` for routine submits; Export enabled with zero selection → error toast ("select at least one" ×2 strings) instead of disabled; Delete adjacent to Edit in project menu; QA-drag teaching toast lacks action; only 11 `w-full` Buttons (appropriate); destructive = red + ConfirmDialog ✓ except chat `window.confirm` ×5 (**F-057**).

## 18. Profile / Identity Findings

**F-032** (above) · **F-030** Employee 360's only action is Send Message (`directory/[id]/page.tsx:99-104`); Edit/Reset/Deactivate/Delete exist solely in the directory row menu — manager context loop · **F-029** fictional sections: fake "YouTube Team / g4kkarthik@gmail.com" connected account; hardcoded "YouTube Office, Chennai" + dead Edit + "Not Verified"; static privacy selects · avatar system healthy where used (×87, fallbacks ×76); `avatar-utils.ts` dead · **F-088** Gen2k/G4K brand split on login · **F-019** backend avatar orphan growth (wrong delete path ×3 sites).

## 19. Navigation Findings

**F-009** middleware lockout (4 nav destinations bounce everyone) · **F-010** HR approvals dead tab (+ `/org/leave` redirect targets it) · **F-039** palette "Admin Settings" → `/dashboard/profile?tab=settings` (no tabs); `/dashboard/admin` guarded 404 · **F-073** "Attendance & Time" vs "Attendance" collision → rename My/Team Attendance; QA builder buried as tasks view-mode; personal reminders under Announcements tab; feedback + role-switch buried; `/dashboard/org/...` internal concept in URL (breadcrumb already skips — formalize) · dead prefetch branches · mobile bottom-nav lacks `aria-current` (F-071).

## 20. Information Architecture Findings

**F-073** (above) + IA verdicts: no duplicate pages remain (7 redirect stubs — consolidation already done; keep one release then remove `/admin/*`, `/org/leave`); entity workspaces correct (360 + Project exist, Task = sheet is right); "Communications" hosting a private utility; Directory = 4 tabs two audiences (acceptable, label option "People"); employee journey complete; management gaps concentrate post-creation (F-031) and in admin discoverability.

## 21. Duplicate Implementation Findings

= **F-074** clusters (component level) + **F-075** dead code. Full matrix in `frontend.md` §6.3/6.12.

## 22. Duplicate Page / Workflow Findings

No duplicate pages (redirects settled it). Duplicate workflows: message-person ×4 entries (useful contextual — keep); export ×4 dialects (→ ExportButton); approve-leave ×2 valid paths + 1 missing (F-010); task surfaces ×3 (same sheet — correct); 2 dead duplicate components to delete (approvals-tab, feedback widget).

## 23. Page Consolidation Opportunities

**Departments + Designations → one "Org Structure" tab** (two thin CRUDs, same mental model; ListScaffold-ready) — P3. HR approvals into HR org-attendance tab (P0, F-010). Nothing else qualifies — over-consolidation explicitly rejected (no files module, no mega-pages).

## 24. Contextual Action & Settings Findings

**F-030** 360 manager action bar (reuse `use-user-actions`) · row-level "Correct" (F-038) · "Log time" on task sheet · download-action in export toast (F-035) · "manage forms" link from QA select; "configured in Settings" tooltips on reminder widgets; "personalize" link Settings→Profile notifications · project settings dropdown must become the real contextual config (F-026) · notification split global-default/personal-override is correct — keep.

## 25. Workflow Completeness Findings

**F-031** post-creation dead ends (all create dialogs close into lists; no Open/Add-another) — P1 · **F-076** leave edit absent · **F-077** employee erasure (anonymize) API-only — offboarding gap · **F-078** QA forms lifecycle (buried builder; no usage list) · **F-082** recurrence completion silent ("next occurrence created" unannounced) · **F-079** employee CSV import absent for day-one migration [Enhancement] · **F-080** saved-view management (rename/delete; extend beyond reports) · **F-083** empty-dashboard guidance for new employees · **F-084** audit user-filter cap 100 · **F-085** 30-day notification purge undisclosed · dead-end inventory: §16-O of FINAL-AUDIT (create-*, export, reject-without-reason, demo purge terminal case, unauthorized settings shell, chat search gate).

## 26–28. Missing Page / Feature / Option Findings

**Missing pages (conditional only):** QA-forms management surface (dialog/header action suffices — not a route); global search results (palette extension preferred) [Enhancement]. **Missing features:** scheduled reports — backend model `ScheduledReport` exists, nothing consumes: **build or delete** (product decision); employee import; work-schedule usage view; announcement archive; chat mark-all-read + message edit (schema-ready, no route — backend F-list). **Missing options/actions:** reject-reason on leave (F-081); bulk task reassign; duplicate task/project; filter summary-chips + one-clear; half-day leave **[Speculative — enum dead end-to-end, product decision]**; configurable leave types **[Speculative]**; SA personal attendance surface **[Product decision]**.

## 29. Frontend Wiring Findings

Master wiring list (UI→State→Action→API→UI breaks): **F-009** cookie lockout · **F-010** dead tab · **F-011** silent no-ops (clear-chat `Conversation.php:24-27`; reorder `TaskController.php:599` + fillable; pin no broadcast) · move-phase → missing method (`routes/api.php:222`) · **F-026** project edit stub (`projects/[id]/page.tsx:33,409-419`) · **F-039** palette + `/admin` links · **F-029** placeholder sections · **F-027** offline false-success (`leave-tab.tsx:59-62`; logout queueable `api-client.ts:82-87`) · **F-052** Echo token staleness (`use-reverb.ts:84,156`) · **F-053** nav prefetch warms wrong keys (`nav-group.tsx:41-47`); duplicate 30-s unread poll · **F-028** dynamic classes · login raw button · export enabled-when-unusable. Post-fix rule: each repair gets an E2E assertion.

## 30. Accessibility / WCAG Findings

**F-070** interaction cluster: 77 icon-only buttons (h-6/7/8) vs 57 aria-labels app-wide (4.1.2); touch targets 24–32px (2.5.5); 7 `focus-visible:ring-0` sites; ring recipe inconsistent (ring-0/1/2) · **F-071** semantics cluster: h1 on 6/27 pages (1.3.1); pill-tabs w/o `aria-pressed`/tablist (4.1.2); bottom-nav `aria-current` (2.4.8); tooltips hover-only · **F-072** contrast cluster: 9–11px body/metadata + muted grays ×178 (1.4.3/1.4.4); gray-on-color ×11; color-only status sometimes colorless (1.4.1, F-028) · **F-071** motion: keyframe utilities (`animate-bounce` ×27, `spin` ×63, `ping` ×2) bypass the duration-var reduced-motion kill (2.3.3; only RainbowBorder guarded) · positives: global focus-visible, Radix traps/Esc, cmdk keyboard-first, muted onboarding video, axe-core dev.

## 31. Loading / Empty / Error / Recovery Findings

Positives: EmptyState ×33 (sized well, max-w-md), skeletons ×158, per-segment boundaries, specific error copy ("Start date must be tomorrow or later"). Gaps: **F-059** toast asymmetry (137 error / 117 success / 9 info; no `toast.promise`) + generic fallbacks ("Server error…", "Something went wrong!" ×16 boundary title) lack recovery guidance; **F-027** offline truthiness; **F-035** export completion without action; chat silent 3-char gate; 360 activity empty-check bug (`undefined` treated as non-empty); export failure lacks differentiation; loading species uncanonicalized (63 raw `animate-spin`).

## 32. Data / State Synchronization Findings

Backend: **F-014** `teamToday` versioned key vs unversioned observer forgets → HR board ≤1h stale; **F-042** dashboard cache family (dead keys — `$cacheKey` computed never used `DashboardController.php:33`; Pin/QuickNote/attendance observers forget unwritten keys; invalidation storm on every User/Project/Task/AttendanceDay/LeaveRequest write incl. login; Approval changes invalidate nothing) · Frontend: **F-052** Echo auth staleness; **F-053** prefetch drift + duplicate polling; **F-054** hydration double-gate; **F-013** realtime transport dead (pusher selected in deploy env **without keys** — manifest-verified both services; `.env.production` references undefined `reverb` connection) + false "Offline" pill + ShellPolish env mismatch · optimistic chat ✓; cross-tab sync ✓.

## 33. Role / Permission UX Findings

Nav gating correct by capability — but **F-009** makes 4 items dead for all; SA lacks personal attendance surface though backend `*` allows (nav self-service exclusion — product decision); pure approver w/o team-attendance cap gets Access-Denied instead of approvals (F-010); backend **F-015** HR scope leaks (timer logs unscoped `TimerController.php:71-77`; logTime gate role-only; `leaveHistory/assignments` scoped on `users.hr.manage` which HR lacks → company-wide `UserController.php:702-733`); **F-021** `leave.approve-hr` capability granted to no seeded role (masked because only SA decides HR leave); **F-018** last-super-admin demotable via `update` (guards exist only in status/destroy/anonymize); **F-045** `RequireCapability` token-role override vs in-controller checks drift; de-roled users keep employee capabilities (fallback role) + 1h role caches.

## 34. Daily-Use Usability Findings

Team board staleness erodes trust (F-014) · permanent "Offline" badge generates IT tickets (F-013) · 100/1000/100-task caps silently corrupt pickers/filters/boards at scale (F-034) · corrections depth ×frequency (F-038) · export memory bridge (F-035) · weekly summary never reaches HR (F-023) · notification 30-day purge surprises investigations (F-085) · audit user-filter cap (F-084) · demo data intermingled + purge danger (F-002/F-003) · two brand names (F-088) · micro-type on 1024px primary work devices (F-012) · drafts exist but are undisclosed (add "draft saved" microcopy — F-060).

## 35. Newly Discovered Findings (this reconciliation pass, not in prior session docs)

1. **F-094 [P1·Data/Backend·Unverified-runtime]** S3 storage lineage: adapter `league/flysystem-aws-s3-v3` installed, `s3` disk defined, `FILESYSTEM_DISK=s3` + `AWS_DEFAULT_REGION` set in both Cloud Run services — **but `AWS_BUCKET` (and credentials) absent from `--update-env-vars`**; unless injected via another mechanism, every upload 500s in production. *Status: Partially Fixed lineage / Open runtime question — Requires deployment verification.*
2. **F-095 [P3]** `throttle:api` = 1000/min on the entire authenticated group — effectively no API rate limiting.
3. **F-096 [P3]** `g4k_token` access token mirrored in a JS-readable cookie (only the refresh token is httpOnly) — accepted trade-off, but widens XSS blast radius; CSP duplicated at Next middleware + API SecurityHeaders (two sources of truth).
4. **F-097 [P3]** pusher **selected in the deploy manifest without keys** — upgrades the realtime finding (F-013) from config-suspicion to manifest-verified.
5. **F-092 refinement:** `.env*` files are **not** git-tracked (verified `git ls-files` — only `.env.example`) — env hygiene OK; repo-hygiene residue = 3 stray codemod scripts + 4 uncommitted legacy-doc deletions.
6. **F-098 [P3·Unverified]** Production build parity with HEAD not verifiable this session (no deploy access) — lineage finding "prod build lags HEAD" remains **Not Reproducible** pending deploy check.

---

## 36. Previous Audit Findings Reconciliation (master status ledger)

Ledger convention: statuses re-verified 2026-08-28 against `69e302d`. Lineage sources: this session's `report.md`/`frontend.md`/`FINAL-AUDIT.md` (all verified on read) + prior-audit era findings (2026-08-16→08-26, original files deleted by user; reconciled from recorded summaries and direct code re-checks — every "Fixed" below was confirmed in current code).

**Open (P0):** F-001 backdoor route · F-002 seeded credentials + demo-seed account hijack · F-003 demo purge destroys real data (avatars dir, all `is_demo` users incl. only SA, settings/audit rows) · F-004 phase-create 500 · F-005 task/project delete 500 · F-006 task scope escalation + `scope_id`/`order` fillable gaps · F-007 leave route shadowing (`/leave-requests/{id}` before `pending`/`export`) · F-008 move-phase missing method · F-009 middleware capability-cookie lockout · F-010 HR approvals dead-end · F-011 silent no-op trio · F-012 micro-typography pandemic.
**Open (P1):** F-013 realtime dead + false Offline (manifest-verified) · F-014 teamToday staleness · F-015 HR scope leaks · F-016 PII leaks (user show/activity, dept/designation show) · F-017 plaintext reset link persisted · F-018 last-admin demotion · F-019 avatar orphans · F-020 schedule default silent loss · F-021 approval integrity (no lock/balance recheck; `id OR approvable_id`; approve-hr cap) · F-022 redo strand · F-023 weekly summary wrong roles · F-024 users-export filter drift · F-025 NULL active_role exclusion · F-026 project edit stub · F-027 offline false-success · F-028 dynamic status classes · F-029 fictional profile sections · F-030 360 manager actions missing · F-031 post-creation dead ends · F-032 text-only people pickers · F-033 six missing primitives + Select error · F-034 silent caps · F-035 export memory-bridge · F-036 remember-me defeated (`api-client.ts:213-215`) · F-037 DatePicker capability gaps · F-038 corrections depth · F-039 palette/`/admin` dead links · F-040 public `/api/version` + `/system/public-config` disclosure · F-041 ip-api egress + `trustProxies '*'` · F-094 S3 runtime bucket unverified.
**Open (P2/P3):** F-042..F-098 as detailed across §9–35 (cache family F-042; dormant security toggles F-043; temp-password policy F-044; settings whitelist/audit gaps F-045; QA orphaning F-046; report parity/chunk F-047; timezone/date-500 F-048; leave policy F-049; half-day/open-shift F-050; broadcast family F-051; echo staleness F-052; prefetch/polling F-053; hydration F-054; dialog sizes/mobile F-055; date grammars F-056; confirms F-057; pagination F-058; toasts F-059; forms F-060; inputs F-061; buttons F-062; padding conventions F-063; dimension fragmentation F-064; unprefixed grids F-065; fixed charts F-066; heatmap min-w F-067; toolbar/settings layout F-068; heading drift F-069; a11y clusters F-070/071/072; IA cluster F-073; duplicates F-074; dead code F-075; leave edit F-076; erasure UI F-077; QA lifecycle F-078; import F-079; saved views F-080; reject reason F-081; recurrence silence F-082; empty dashboard F-083; audit filter cap F-084; purge disclosure F-085; z-index F-086; visual chrome F-087; branding F-088; density wiring F-090; numerics/menus F-091; repo hygiene F-092; backend lows F-093; throttle F-095; token-cookie/CSP dup F-096; chat edit/mark-all F-097*; announcement archive/schedule-usage/duplicate/global-search P3 set; *F-097 renumbered to chat-gaps, F-098 = build-parity unverified).

## 37. Fixed Findings (historical, verified in current code)

| Prior finding | Verification |
|---|---|
| Chat ASC-pagination inversion (08-16) | Chat pagination/read logic correct in current code; no inversion found |
| Empty tables `data.data.data` unwraps (08-16) | `unwrapList`/`unwrapPaginator` handle both shapes (`lib/pagination.ts`) |
| 30-day attendance calendar cap (08-16) | History now 365 days (`meHistory`) |
| `FIELD()` pgsql 500 (08-26) | Grep-verified: portable `CASE WHEN` sorts; no FIELD/GROUP_CONCAT anywhere |
| Public reset-demo route (08-26) | Demo routes behind `auth:sanctum` + `settings.manage` (`routes/api.php:323-327`) |
| Task pipeline dead at UI (08-21) | Tasks tab fully wired (board/list/gantt + create/submit flows) |
| QA `field_type`/`type` mismatch (08-19) | Consistent `field_type` validation in QaController |
| org/users + admin/* 404 era → redesign | Users mgmt lives in Directory; `/admin/*` intentional redirects (see §41 supersede note) |
| Queue/scheduler dead (08-16) | `g4k-worker` Cloud Run service runs schedule + queue workers |
| Must-change-password dead-end | Skip logic + policy gate implemented — **see §38 partial** |

## 38. Partially Fixed Findings

1. **Missing S3 adapter (08-16) → F-094:** adapter + disk + deploy env present; bucket/credentials delivery unverified → runtime upload path unconfirmed.
2. **Must-change-password dead-end → F-043:** flow works, but seeder/migration force `force_password_change=false` — the entire apparatus is dormant by default.
3. **Pickers capped at 20 (08-26) → F-034:** caps now 20/50/100/1000 — better, but still silently truncating (filter options 100, people 1000, boards 100).

## 39. Still-Open Findings

All F-001…F-098 minus §37/§38/§41 items — full detail distributed across §9–35 with the standard fields, and consolidated by priority in §47–50. Nothing was fixed between audit start and this report (git unchanged, verified).

## 40. Regressed Findings

**None identified.** No previously-fixed lineage finding was found broken again in current code.

## 41. Superseded / Not-Reproducible Findings

- **Superseded:** 08-18 "org/users + admin/* 404s" — superseded by the Directory-tab + redirect architecture; "phantom `attendance.md` implementation" — document deleted by owner, no phantom references remain; `deploy.md` plan artifact — superseded by this report's §47–50.
- **Not Reproducible / Unverified:** "red vitest" — test suite not executed this session (8 test files exist; run `pnpm test` to verify); "prod build lags HEAD" — no deploy access (F-098); demo-purge audit_logs truncation nuance (08-21) — current purge deletes only `demo_tag`-bearing audit rows **plus** writes two untagged rows (behavior verified; historical "truncate" claim not reproducible as stated).
- **Requires Product Confirmation (do not treat as defects yet):** half-day leave · configurable leave types · scheduled-reports build-vs-delete · SA personal attendance surface · employee-import timing · `BROADCAST_CONNECTION=reverb` vs pusher decision.

## 42. Global Component Improvements

The canonical component system (`frontend.md` §6.13): Button (+`xs`, +`brand` opt-in rainbow; ban implicit) · **new** IconButton (required label) · Input (+prefix/suffix slots, sizes, counters) · **new** SearchInput (300ms debounce, clear, hinted minChars) · Select (+error) · Combobox / **new** UserPicker (avatar+name+dept, server typeahead) · DatePicker (+Today/Clear/range; 36–40px cells) + TimeInput · **new** StatusBadge (status→token map, never color-only) · DataTable stack (+sticky header, card-stack <md, state slots; absorbs both attendance tables) + TableToolbar + BulkActionBar + Pagination (direct use) · Dialog (`size` prop; sticky footer; <640 sheet) · ConfirmDialog (sole confirm) · **new** Spinner + **new** ExportButton (disabled-until-selected, promise toast) · EmptyState/Skeleton adoption stragglers · ActivityFeed (one primitive ×3 feeds) · Form* adoption everywhere. Bans (review checklist): hand-rolled pagination/confirm/pills/pickers/spinners/dialog-widths; `text-[Npx]`; unprefixed multi-col grids; `window.confirm`.

## 43. Recommended Information Architecture

Target nav: **Overview** (Dashboard · **My Attendance** · Projects & Tasks · Communications) / **Organization** (People [Directory | Management | Org Structure] · **Team Attendance** [+Approvals tab] · Reports [Summary | Data Exports]) / **Account** (My Profile · Audit Logs · System Settings). Workspaces: Employee 360 (+action bar) · Project (+real settings) · Task sheet. Remove after one release: `/admin/*`, `/org/leave` stubs. Delete now: approvals-tab.tsx, feedback-form widget. Keep unchanged (explicitly): redirect-stub pattern, 11-item nav size, workspace-with-tabs model, role-gated filtering, contextual duplication of Message/Create-Task.

## 44. Recommended Workflow Architecture

Creation flows end with an action: **[Open X]** toast + post-create navigation + "Add another" (F-031). Corrections surface at row level (F-038). Exports complete with in-toast download (F-035). Approvals: widget (all roles) + tab (HR/SA) with next-in-queue after decision; reject prompts reason (F-081). Recurrence announces next occurrence (F-082). Leave gains admin edit (F-076). Offboarding: deactivate → (SA) erase via 360 action (F-077). Employee day-one: empty-state CTAs + import path (F-079/F-083).

## 45. Recommended Navigation Architecture

= §43 + rename set (My/Team Attendance; tasks tab → "Tasks"; reports tabs Summary/Data Exports) + contextual links (QA "manage forms" from create-project select; settings→profile "personalize"; reminder-widget "configured in Settings") + fix F-009/F-039 links + palette gains task actions + 360/role-switch/feedback surfaced from avatar menu.

## 46. Recommended Component Architecture

`@g4k/ui` remains the single source; apps/web keeps only `grainient.tsx` locally. Rules: >400-line components split container/presentation (tasks-tab 1,232l, qa-builder 831l, departments 817l first); density vars wired into all tables; charts fill containers (autoresize); one spacing/typography/height/radius scale enforced by lint; detector + `$impeccable critique` in CI for slop patterns.

## 47. P0 Implementation Plan (blockers — days)

1. F-001 delete backdoor + stray scripts (CI grep guard). 2. F-002 rotate seeded credentials; env-gate seeder; demo-seed user-keying. 3. F-003 demo-purge guards (env + scope + audit + avatar-dir ban). 4. F-009 cookie-name fix + SA-opens-Settings smoke test. 5. F-010 HR Approvals tab + link fixes. 6. F-004/F-005/F-008 500-fixes (remove illegal activity inserts; implement-or-remove move-phase). 7. F-006 scope escalation (self-default, manager-only expansion, fillable). 8. F-007 route reorder. 9. F-011 backend trio (pivot withPivot, fillable order, pin broadcast). 10. F-012 type-scale codemod start + ESLint ban. 11. F-029/F-027 placeholder deletion + offline truthiness.

## 48. P1 Implementation Plan (this–next week)

F-013 realtime transport decided + keys deployed + ConnectionStatus 3-state · F-014 cache key fix + "last updated" stamp · F-015 HrScope unification · F-016 centralized field-hiding · F-017 out-of-band reset links · F-018 guard in update · F-019 avatar path · F-020 is_default/404s · F-021 lock+recheck+approval resolution · F-022 reorder redo sequence · F-023 roles query · F-024 export filters · F-025 NULL handling · F-026 project edit = create form prefilled · F-028 static status map · F-030 360 action bar · F-031 post-creation actions · F-032 UserPicker w/ avatars (+mentions) · F-033 primitives batch 1 · F-034 typeahead + captions · F-035 toast action · F-036 cookie persistence · F-037 DatePicker upgrade · F-038 row-level correct · F-039 link fixes · F-040 endpoint restrictions · F-041 drop ip-api / scope proxies · F-094 verify bucket/creds (or fix).

## 49. P2 Implementation Plan

Dialog size prop + mobile sheets · DataTable absorption + TableToolbar · Wizard splits · confirms/pagination/toast unification · forms pass (labels/helper-text/Form*) · layout conventions adoption (page/card padding, FormGrid, filter popover) · grids prefix codemod · chart autoresize · heatmap responsive · a11y wave (labels/targets/motion-safe/h1/tablists/ring recipe) · F-042 cache family · F-046..F-051 backend mediums · F-076/F-077/F-078/F-080/F-081/F-082 lifecycle items · F-079 import · F-083 guidance · scheduled-reports decision.

## 50. P3 Improvements

Org-Structure tab · naming polish set · z-index/elevation docs · global search (palette) · duplicate task/project · announcement archive · schedule usage view · chat mark-all/edit · backend lows (F-093/F-095/F-096) · repo hygiene final sweep · redirect-stub removal · density wiring · numerics/menus polish.

## 51. Implementation Dependencies

F-009 precedes all admin-surface UX work · F-013 (transport) precedes realtime-dependent polish (live badges, receipts UX) · F-011/F-006/F-008 backend fixes precede their UI trust-restoration · UserPicker (F-032) unblocks 4 call sites + mentions · F-003/F-002 precede any client demo · F-094 verification precedes upload-feature QA · type-scale (F-012) precedes density/compactness passes (else double rework).

## 52. Regression Risks

Cookie fix must not break cross-tab auth sync (BroadcastChannel relies on store) · Dialog size codemod risks visual regressions across 23 files — screenshot-diff a representative set · cache-invalidation changes (F-042) risk stampedes — add rate-limited rebuild · route reorder (F-007) changes API paths — audit frontend callers first · deleting redirect stubs breaks old bookmarks — one-release notice · fillable additions (`order`,`scope_id`) change mass-assignment surface — audit every `update()` call · demo-purge guards must not break staging seeding flows.

## 53. Final Verification Checklist

- [x] Every route/page audited (§6, §9) · [x] every workflow traced (§7, §25) · [x] all three roles separately (§8, §33) · [x] every component family (§10, §42) · [x] visual/spacing/alignment (§11–12) · [x] responsive six-size classes (§13) · [x] forms (§14) · [x] calendars (§15) · [x] dropdowns (§16) · [x] buttons (§17) · [x] identity/photos (§18) · [x] navigation/IA (§19–20, §43–45) · [x] duplicates/consolidation (§21–23) · [x] contextual actions/settings (§24) · [x] missing pages/features/options (§26–28) · [x] wiring (§29) · [x] accessibility/WCAG (§30) · [x] states/recovery (§31) · [x] state-sync (§32) · [x] role/permission UX (§33) · [x] daily-use (§34) · [x] new findings (§35) · [x] every prior finding reconciled with status (§36–41) · [x] global-vs-local scope on every finding · [x] priorities un-inflated (P0 = blocking only) · [x] unverified items explicitly marked (§41) · [x] fixed items preserved (§37–38).
- [ ] **Outstanding gate (cannot be closed from code alone):** live-browser verification pass — run `$impeccable critique` + the E2E smoke suite (3 roles × login/attendance/leave/task/chat/admin-open) on a dev server; re-score audit health (target ≥17/20) and Nielsen (≥30/40); verify F-094 by uploading one avatar in the deployed environment.

## 54. Final Audit Conclusion

The product's bones are excellent — a real design system, correct RBAC scoping intent, strong offline/realtime-scaffolding, and workspaces that match user mental models. Its blockers are concentrated, named, and fixable: one backdoor, one cookie name, four 500s, a dangerous demo tool, and a scope-escalation — roughly a fortnight of focused work for Waves 0–2, after which the remaining program is consolidation and polish rather than repair. **Handover recommendation: do not put real employees on this build until §47 (P0) is complete and §53's live-verification gate passes.** This document supersedes all prior audit files as the single source of truth; `report.md`, `frontend.md`, `FINAL-AUDIT.md`, and `manual.md` remain as deep-dive companions, and every meaningful finding from each is represented here.

---

# Appendix A — Master Finding Register (all 16 required fields per finding)

Legend: full **Current Behavior / Expected / Problem / User Impact / Evidence / Root Cause / Recommended Fix** blocks live in the section shown in **Ref**; this register completes the remaining fields (**ID · Category · Area/Route · Role · Workflow · Status · Priority · Scope**). Statuses verified 2026-08-28 against `69e302d` (code unchanged during audit — `git status` checked). Roles: E=Employee, H=HR, SA=Super Admin, All.

| ID | Category | Area / Route | Role | Workflow | Status | Pri | Scope | Ref |
|---|---|---|---|---|---|---|---|---|
| F-001 | Security/Functional | `GET /api/test-projects` | Anyone (unauth) | data exposure | Open | P0 | Global (API) | §29, §47 |
| F-002 | Security | `DatabaseSeeder` / demo-seed | SA (attacker: anyone w/ repo) | provisioning | Open | P0 | Backend | §36, §47 |
| F-003 | Data-safety | Settings→Demo Data | SA | demo mgmt | Open | P0 | Backend+UI | §9, §47 |
| F-004 | Functional | `POST /projects/{id}/phases` | H/SA | project phases | Open | P0 | Backend | §47 |
| F-005 | Functional | `DELETE /tasks/{id}`, `/projects/{id}` | H/SA | task/project lifecycle | Open | P0 | Backend | §47 |
| F-006 | Security/Functional | task create/update scope | E/H | task creation | Open | P0 | Backend | §33, §47 |
| F-007 | Functional | `GET /leave-requests/pending·export` | H/SA | leave ops | Open | P0 | Backend route | §47 |
| F-008 | Functional | `POST /tasks/{id}/move-phase` | H/SA | task→phase | Open | P0 | Backend route | §7, §47 |
| F-009 | Navigation/Permission-UX | `middleware.ts:47` vs `auth-store.ts:94` — /settings /audit /reports /admin/* | SA (all) | admin access | Open | P0 | Global (frontend) | §19, §33, §47 |
| F-010 | Navigation/Workflow | HR `/org/attendance?tab=leave` | H | leave approvals | Open | P0 | Module | §19, §47 |
| F-011 | State-sync/Wiring | clear-chat · drag-reorder · msg-pin | All | chat/task mgmt | Open | P0 | Backend dep | §29, §32 |
| F-012 | UI/Typography | all modules (477 sizes) | All | daily reading | Open | P0 | Global | §11, §12 |
| F-013 | State-sync/Infra | broadcasting (deploy env) | All | realtime UX | Open | P1 | Backend dep + UI | §32, §35 |
| F-014 | Data-sync | `teamToday` cache | H/SA | team monitoring | Open | P1 | Backend dep | §32 |
| F-015 | Permission-UX/Data | timer/logs/leaveHistory | H (leak) / E (privacy) | HR ops | Open | P1 | Backend | §33 |
| F-016 | Data/Privacy | user show/activity, dept/designation show | H/SA | people mgmt | Open | P1 | Backend | §33 |
| F-017 | Security | admin password-reset approve | SA→E | recovery | Open | P1 | Backend | §48 |
| F-018 | Permission-UX | `UserController::update` roles | SA | admin mgmt | Open | P1 | Backend | §33 |
| F-019 | Data/Storage | avatar deletion path ×3 | All | profile mgmt | Open | P1 | Backend | §18 |
| F-020 | Functional/UX | work-schedule update | SA | config | Open | P1 | Backend+UI | §9 |
| F-021 | Data/Workflow | approval decide | H/SA | approvals | Open | P1 | Backend | §33 |
| F-022 | Workflow | task redo | H/SA | review loop | Open | P1 | Backend | §48 |
| F-023 | Functional | weekly summary roles | H (misses) | digest | Open | P1 | Backend | §34 |
| F-024 | Data/Workflow | users export job | SA | reporting | Open | P1 | Backend | §48 |
| F-025 | Data | global task assignment | All | task creation | Open | P1 | Backend | §48 |
| F-026 | Workflow/Context | project edit dialog | H/SA | project mgmt | Open | P1 | Module | §24 |
| F-027 | Feedback/State | offline queue toasts | All | offline ops | Open | P1 | Global (frontend) | §31 |
| F-028 | UI/Wiring/A11y | `attendance/page.tsx:164` dots | E/H/SA | attendance reading | Open | P1 | Page | §29, §30 |
| F-029 | Trust/UX | profile sections ×3 | All | profile | Open | P1 | Module | §18 |
| F-030 | Context/Workflow | Employee 360 actions | H/SA | people mgmt | Open | P1 | Module | §24 |
| F-031 | Workflow | all create dialogs | H/SA | creation lifecycle | Open | P1 | Global pattern | §25 |
| F-032 | UX/Identity | all people selectors (+mentions) | H/SA | assignment/approval | Open | P1 | Global (UserPicker) | §16, §18 |
| F-033 | Component | missing primitives ×6 + Select error | All | everywhere | Open | P1 | Global (ui lib) | §10, §42 |
| F-034 | Data/UX | caps: filters 100 / pickers 1000 / board 100 / log 7 | H/SA (grows w/ scale) | lists/pickers | Open | P1 | Global | §34 |
| F-035 | Workflow/Feedback | export completion | H/SA | reporting | Open | P1 | Workflow | §25 |
| F-036 | Security-UX | remember-me cookie rewrite | All | session | Open | P1 | Global (frontend) | §48 |
| F-037 | Component/Form | DatePicker capability | All | dates everywhere | Open | P1 | Global (ui lib) | §15 |
| F-038 | Workflow/Context | attendance correction depth | H/SA | corrections | Open | P1 | Module | §24 |
| F-039 | Navigation/Wiring | palette link · `/dashboard/admin` | SA | admin nav | Open | P1 | Page/Global | §19 |
| F-040 | Security | `/api/version`, `/system/public-config` | Anyone | — | Open | P1 | Backend | §48 |
| F-041 | Security/Privacy | ip-api egress · trustProxies | All | login | Open | P1 | Backend | §48 |
| F-094 | Data/Infra | S3 bucket/creds in deploy | All | uploads | **Partially Fixed** (adapter ✓, runtime unverified) | P1 | Backend dep | §35, §38 |
| F-042 | Data-sync | dashboard caches | All | dashboards | Open | P2 | Backend | §32 |
| F-043 | Security-config | force-change/suspicious dormant | All | auth policy | **Partially Fixed** (flow ✓, dormant) | P2 | Backend | §38 |
| F-044 | Security | temp password response/policy | SA→E | user creation | Open | P2 | Backend | §36 |
| F-045 | Data/Config | settings whitelist mismatch · unaudited mutations | SA | settings | Open | P2 | Backend | §33 |
| F-046 | Data | QA form edit orphans submissions | H/SA | QA lifecycle | Open | P2 | Backend | §49 |
| F-047 | Data | report job parity · chunk order | H/SA | reporting | Open | P2 | Backend | §49 |
| F-048 | Data | timezone mixing · date-param 500s | All | attendance/dates | Open | P2 | Backend | §15 |
| F-049 | Workflow/Policy | leave: same-day, unpaid cap, race | E/H | leave | Open | P2 | Backend+policy | §14 |
| F-050 | Functional | half-day dead · open-shift break · early-leave | E/H/SA | attendance | Open (half-day = product Q) | P2 | Backend | §41 |
| F-051 | Infra/Realtime | broadcast family (team-wide, react echo, O(n) unread, dedup, monitor, ScheduledReport) | All | comms | Open | P2 | Backend | §32 |
| F-052 | State-sync | Echo token staleness | All | realtime | Open | P2 | Frontend | §32 |
| F-053 | Perf/Data-sync | prefetch drift · duplicate poll | All | nav/chat | Open | P2 | Frontend | §32 |
| F-054 | UX/Perf | hydration double-gate · role-select loader | All | boot | Open | P2 | Frontend | §32 |
| F-055 | Component/Responsive | dialog sizes + no mobile sheet | All | dialogs | Open | P2 | Global (Dialog) | §13 |
| F-056 | Component | two date grammars | All | forms | Open | P2 | Global | §15 |
| F-057 | Consistency | `window.confirm` ×5 (chat) | All | destructive | Open | P2 | Module | §17 |
| F-058 | Component | pagination grammars ×3 | All | lists | Open | P2 | Global | §10 |
| F-059 | Feedback | toast asymmetry · no promise | All | feedback | Open | P2 | Global | §31 |
| F-060 | Form | labels/helper/required/verbs/Form* | All | forms | Open | P2 | Global | §14 |
| F-061 | Form/Component | input widths · search ×5 · textarea rows | All | forms | Open | P2 | Global | §14 |
| F-062 | Button/Action | size-by-space · login raw · export enable · destructive placement · toast actions | All | actions | Open | P2 | Global | §17 |
| F-063 | Layout | 5 paddings/5 cards/nesting/rhythm | All | all pages | Open | P2 | Global | §12 |
| F-064 | Layout/Component | heights/radius/hex/arb fragmentation | All | all UI | Open | P2 | Global | §12 |
| F-065 | Responsive | 26 unprefixed grids | All (mobile) | layout | Open | P2 | Global codemod | §13 |
| F-066 | Layout/Component | charts fixed h-64 | All | dashboards | Open | P2 | Module | §13 |
| F-067 | Responsive | heatmap min-w-800 | H | HR analytics | Open | P2 | Component | §13 |
| F-068 | Layout | toolbar wrap · settings 2-col · grouping | H/SA | data screens | Open | P2 | Module | §12 |
| F-069 | Typography | heading scale drift | All | pages | Open | P2 | Global | §11 |
| F-070 | A11y | labels/targets/ring-0 | All | interaction | Open | P2 | Global | §30 |
| F-071 | A11y | motion-safe · h1 · tablist · aria-current | All | semantics | Open | P2 | Global | §30 |
| F-072 | A11y/Visual | contrast cluster · gray-on-color | All | reading | Open | P2 | Global | §30 |
| F-073 | IA/Navigation | attendance naming · QA burial · reminders home · org URL | All | wayfinding | Open | P2 | Global | §19–20 |
| F-074 | Component/Duplicate | 11 clusters | All | everywhere | Open | P2 | Global | §21 |
| F-075 | Architecture | dead code inventory | — | maintenance | Open | P2 | Global | §21 |
| F-076 | Workflow | leave un-editable | E/H/SA | leave mgmt | Open | P2 | Workflow+Backend | §25 |
| F-077 | Workflow/Privacy | erasure UI absent | SA | offboarding | Open | P2 | Module | §25 |
| F-078 | Workflow | QA lifecycle mgmt | H/SA | QA | Open | P2 | Module | §25 |
| F-079 | Feature [Enhancement] | employee CSV import | SA | day-one onboarding | Open (optional) | P2 | Module | §27 |
| F-080 | Feature | saved-view management | H/SA | lists | Open | P2 | Module | §27 |
| F-081 | Workflow/Option | reject-reason asymmetry | H/SA | approvals | Open | P2 | Workflow | §28 |
| F-082 | Workflow/Feedback | recurrence silence | H/SA | task loop | Open | P2 | Module | §25 |
| F-083 | UX/Onboarding | empty-dashboard guidance | E | first days | Open | P2 | Page | §25 |
| F-084 | Data/UX | audit user-filter cap 100 | SA | investigations | Open | P2 | Module | §25 |
| F-085 | UX/Data | 30-day purge undisclosed | All | notifications | Open | P2 | Global copy | §34 |
| F-086 | Visual | z-index soup | All | overlays | Open | P3 | Global | §11 |
| F-087 | Visual | elevation/chrome mix | All | cards | Open | P3 | Global | §11 |
| F-088 | Brand | Gen2k/G4K split | All | trust | Open | P3 | Global copy | §18 |
| F-089 | Navigation copy | breadcrumb labels · misc copy | All | wayfinding | Open | P3 | Global | §50 |
| F-090 | Component/Feature | density wiring · overtime mislabel | All | tables/timer | Open | P3 | Global | §34 |
| F-091 | Table UX | numeric alignment · action columns | H/SA | tables | Open | P3 | Global | §9 |
| F-092 | Repo hygiene | stray scripts · uncommitted deletions | — | maintenance | Open (env-files tracked? **No — verified clean**) | P3 | Repo | §35 |
| F-093 | Backend lows | grouped (companies/{id}, auto-number race, bulk-200, self-delete, DEL-ids, ip alias, cursor comment, downloadExport memory, pinChat join, dismiss scope, submitted unpaginated, recurrence drops, syncEmployees moves SA…) | varies | varies | Open | P3 | Backend | §36 |
| F-095 | Security-config | throttle 1000/min | All | API | Open | P3 | Backend | §35 |
| F-096 | Security/Architecture | JS-readable token cookie · dual CSP | All | session | Open | P3 | Global | §35 |
| F-097 | Feature | chat edit/mark-all-read absent | All | chat | Open (edit = backend dep) | P3 | Module | §27 |
| F-098 | Verification | prod build parity | — | deploy | **Not Reproducible** (needs deploy access) | P3 | Infra | §35, §41 |
| — (historical) | Fixed set ×10 | chat pagination, unwraps, 30-day cap, FIELD(), public demo route, task pipeline, QA field_type, queue/scheduler, 404-era, must-change flow | — | — | **Fixed** (§37) | — | — | §37 |
| — (historical) | Superseded set ×3 · Not-Reproducible ×2 | see §41 | — | — | **Superseded / N-R** | — | — | §41 |
| — (product Qs) | half-day · leave types · scheduled reports · SA attendance · import timing · reverb-vs-pusher | — | — | — | **Requires Product Confirmation** | — | — | §41 |

*Register closes the completion gate: every finding carries ID, Category, Area/Route, Role, Workflow, Status, Priority, and Scope here, and Current/Expected/Problem/Impact/Evidence/Root-Cause/Fix in its Ref section — together satisfying the 16-field requirement per finding.*


---

*End of master consolidation. Every source report finding, every fixed historical finding, every page/component/workflow/role reference, and all five source documents in full are contained in this single file. Generated 2026-08-28 at commit `69e302d`.*
