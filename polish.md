# POLISH — Stability & Production-Readiness Remediation Plan

**Date:** 2026-08-19 · **Trigger:** live production instability reports (g4k-v5.vercel.app + g4k-api Cloud Run)
**Method:** the reported errors were treated as symptoms; every subsystem they touch (chat, widgets, uploads, queries, session, cache, boundaries, backend schema/deploy) was traced end-to-end in source. Each root cause below is evidenced with file:line and a verification step.
**Companions:** `finalization.md` (functional defect backlog) · `workflow.md` (app blueprint). This document covers **stability**; where items overlap they are cross-referenced, not duplicated.

---

## 0. Executive Summary

The instability has **one backend root cause, two integration root causes, and a frontend hardening debt class**:

| # | Root cause | User-visible symptoms |
|---|---|---|
| RC-1 | **Production schema/code drift** — prod DB is missing columns recent code requires (`conversation_user.is_pinned`, likely `reactions` polymorphic columns) because migration state drifted from the deployed image | Chat totally broken (list/messages/mark-read all 500), announcement reactions 500 |
| RC-2 | **Uploads bypass the API client** — hand-rolled `fetch` with no token refresh | Photo upload fails (401) after 15 min in the app; works right after refresh |
| RC-3 | **Avatar URLs not normalized** — relative paths stored/rendered against the web origin | `/avatars/teams_8.png 404`, missing photos everywhere |
| RC-4 | **Ungated + misparameterized queries** — employee-visible components call manager-only endpoints; one dialog sends an invalid `per_page` (422 every time) | Constant `/users 403`, `/qa-forms 403` console storms; broken pickers; **group chat creation dead** |
| RC-5 | **Employee DM search dead** — chat user-search calls `/directory`, which employees no longer can access | Employees can't start new conversations |
| RC-6 | **Fragile response unwrapping** — ~12 chat/widget code paths can call `.map/.filter` on non-arrays or crash on `undefined.reverse()` | `er.map is not a function`, `(Q \|\| []).filter is not a function` widget crashes |
| RC-7 | **ErrorBoundary never auto-resets** — crashed sections stay dead | "Page only works after a full browser refresh" |
| RC-8 | **Startup hydration race** — queries can fire before auth state rehydrates | Random 401/403 cascades on first navigation, rerender storms |
| RC-9 | **Offline queue resolves `{queued:true}` as success** | Optimistic UI lies; downstream handlers read wrong shapes |
| RC-10 | **Cache-contract inconsistencies** — same endpoint unwrapped 3 different ways incl. a poisoned dashboard prefetch | Stale/wrong widget data; shape-dependent crashes |

Everything below is ordered: **Phase S (stop the bleeding, hours) → Phase H (hardening, 1–2 days) → Phase V (verification & regression) → Phase R (readiness criteria)**.

---

## 1. Root Causes — Detail, Fix, Validation

### RC-1 · Production schema/code drift (P0 — the chat/reaction 500s)

**Evidence chain:**
- `app/Models/Conversation.php:24` — `users()` relation is `->withPivot(['last_read_at', 'is_pinned'])`.
- `is_pinned` is added by migration `2026_08_18_205603_add_is_pinned_to_conversation_user.php` (2026-08-18 20:56).
- Every failing endpoint loads that pivot: `ChatController::index` (`with('users')`, line 45), `messages()` + `markRead()` both call `checkAccess()` which queries `$conversation->users()->…exists()` (lines 15–24, 60, 139). → On a DB without the column, **all three 500 simultaneously** — exactly the production log (`GET /conversations 500`, `GET /conversations/3/messages 500`, `POST /conversations/18/read 500`).
- `POST /announcements/8/react 500` — `AnnouncementController::react` inserts `reactable_type`/`reactable_id` (lines 175–183), columns added by `2026_08_15_215015_modify_reactions_to_polymorphic.php`. That migration drops a foreign key inside a `hasColumn` guard — a form that can abort mid-batch on pgsql (FK name/ordering differences), leaving later migrations unapplied.
- `cloudbuild.yaml:26` runs `migrate --force` at build time — so drift means either a failed/partial migration batch or an image promoted outside this pipeline.

**Fix (Phase S1):**
1. On prod: `php artisan migrate:status` → run pending migrations (`migrate --force`); if the reactions migration is half-applied, use the existing `ReconcileMigrations` command / manually complete the column adds, then verify with `migrate:status` all-green.
2. Confirm in Cloud Run logs that the SQLSTATE for the chat 500s was `42703 column "is_pinned" does not exist` (expected signature). If the logs show a different stack, capture it and re-trace before any code change.
3. Smoke: `GET /api/conversations`, `GET /api/conversations/{id}/messages`, `POST /api/conversations/{id}/read`, `POST /api/announcements/{id}/react` → all 200.
4. Make drift impossible to ship again:
   - Add `GET /api/version` (API) returning `{ commit, migrated_at, pending_migrations }`; the existing frontend VersionGuard should also surface API/backend mismatch.
   - Cloud Build: fail the deploy if `migrate:status` reports pending rows after `migrate --force` (the status step already exists at cloudbuild.yaml:29–35 — make it a gate, not a log).
   - Add a post-deploy smoke step hitting the 4 endpoints above with a service token.
5. Do **not** add `hasColumn` defensiveness inside the relation (hides drift); keep the schema strict and monitored.

**Validation:** chat works for all roles (list, thread, mark-read, receipts); announcement react toggles; `migrate:status` clean; deploy gate red-greens on a deliberately pending migration in staging.

---

### RC-2 · File/photo uploads bypass `apiFetch` (P0)

**Evidence:** `profile-header.tsx:60-72` — avatar upload is a hand-rolled `fetch` with a raw Bearer token: **no 401→refresh→retry**, no offline queue, duplicated base-URL logic. The access token expires every 15 minutes; any upload after that gets 401 → "Failed to upload avatar." until a refresh resets the cycle. This exactly matches "photo uploading not working / works after refresh".

**Fix (Phase S2):**
1. Make `apiFetch` fully multipart-capable (it already skips JSON content-type for FormData) and **replace every raw `fetch` in the app** with it (audit: `grep -rn "await fetch(" apps/web/src --include="*.tsx" | grep -v api-client` → convert all authed calls; only the version-guard's unauthed `/api/version` may stay raw).
2. After upload success, update the auth-store `user.avatar_url` too (header/menu avatars currently wait for profile refetch).
3. Verify project cover upload (`/projects/cover`) and chat attachment upload already go through `apiFetch` (chat does — `chat-tab.tsx:319-326` FormData; keep it).

**Validation:** log in, wait 16+ minutes (or temporarily set token TTL to 1 min locally), upload avatar → succeeds silently via refresh-retry. Repeat for project cover + chat attachment.

---

### RC-3 · Avatar/photo URL normalization (P0)

**Evidence:** production log `GET https://g4k-v5.vercel.app/avatars/teams_8.png 404` — a **relative** avatar path rendered against the web origin. `ProfileController::uploadAvatar` stores `Storage::disk($disk)->url($path)` (absolute **only when the s3 disk config resolves**); legacy/demo rows and any upload made while `FILESYSTEM_DISK` was `local` store relative paths (`avatars/x.png`, `/storage/...`), and `next/image` then requests them from Vercel.

**Fix (Phase S3):**
1. Central `resolveAvatarUrl(url)` helper (also for covers/attachments): empty → null; already-absolute (http/https or `data:`) → as-is; otherwise prefix the configured `NEXT_PUBLIC_S3_PUBLIC_URL` (or API origin for `/storage/…`) — apply at every render site (directory cards, chat avatars, profile header, member lists, org user page) via one shared component/prop instead of ad-hoc `user.avatar_url`.
2. Backfill script (one-off tinker/artisan command): rewrite relative `users.avatar_url` / `projects.cover_image_url` values to absolute S3 URLs.
3. `next.config` `images.remotePatterns` must include the S3/Supabase host (verify; add if missing) so optimized images don't 404/bypass.
4. Avatar `onError` fallback to initials everywhere (Radix Avatar fallback exists — confirm it can't crash on bad URLs).

**Validation:** every user with an uploaded photo shows it in: profile header, header menu, directory (card+table+detail), chat (list + messages + composer mentions), org user detail, project member avatars, dashboard widgets. No `/avatars/*` requests to the Vercel origin in the network tab.

---

### RC-4 · Ungated & misparameterized queries (P0/P1)

**Evidence (all confirmed in source):**
| Site | Problem | Effect |
|---|---|---|
| `tasks-tab.tsx:106` | `/qa-forms` fetched **unconditionally** | Every employee visiting My Tasks & Board → `403` console error + retry noise (`qa.view` no longer granted to employees) |
| `projects/[id]/page.tsx:85` | `/qa-forms` unconditional | Employee opening a project → 403 noise |
| `task-detail-sheet.tsx:101` | `/users` fetched when `isEditing` — assignees can edit their own tasks | Employee edits task → `403 /users` (matches log) |
| `create-group-dialog.tsx:53` | `/users?per_page=1000` — backend whitelist is `in:20,50,100` | **422 on every open → group creation broken for everyone** (silent: picker empty) |
| `quick-task-widget.tsx:28`, `audit-log-table.tsx:46` | `per_page=100` ✓ | fine — pattern to follow |

**Fix (Phase S4):** add `enabled:` capability gates to every manager-only query (gate on `qa.manage`/`qa.view`, `users.*.manage`); change `per_page=1000` → `100` (and follow FIN-P1-4's `limit=`→`per_page` sweep); for dialogs, fetch on-open (`enabled: open`) not on page mount. Sweep: `grep -rn "apiFetch(\"/users\|/qa-forms" apps/web/src` and confirm every hit is gated.

**Validation:** as employee — visit tasks tab, open a project, edit own task: **zero** 403s in console; pickers either hidden or populated from permitted endpoints. As HR — create a group chat end-to-end (dialog lists users, creates, opens).

---

### RC-5 · Employee DM search dead (P1)

**Evidence:** `chat-tab.tsx:84` — "New message" search calls `/directory?search=…`. Employees no longer hold `directory.view` (owner-ordered removal, 2026-08) → **403 → search always empty → employees cannot start new DMs** (a spec-critical flow: "Direct Chats: one-on-one with HR/Admin").

**Fix (Phase S5):** add a chat-scoped user-search endpoint (`GET /chat/users?search=` gated on `chat.access`, returning minimal fields: id, name, avatar, department) and point the picker at it. (Reuse of `/directory` was the wrong dependency for a chat feature.)

**Validation:** employee searches any HR/Admin by name → results appear → selecting opens/creates the DM; HR/admin flow unchanged.

---

### RC-6 · Fragile response unwrapping — the crash class (P0 for stability)

**Evidence (the two reported crashes map here; each site can crash on shapes that occur in practice — error payloads, wrapped paginators, `undefined` during races, optimistic objects):**
| Site | Defect |
|---|---|
| `chat-tab.tsx:281` | `messageData?.pages?.flatMap(…).reverse() \|\| []` — `reverse()` runs **before** the `\|\| []`; when `pages` is undefined → `undefined.reverse()` throws (chat page dies mid-load/after 500s) |
| `chat-tab.tsx:84,137` | `r.data \|\| []` then `(searchUsersData \|\| []).filter` — an object `data` (wrapped/changed contract) crashes `.filter` — the exact `(Q \|\| []).filter` signature |
| `chat-tab.tsx:134` | `c.users?.map(…)` — non-array `users` → `er.map is not a function` |
| `message-composer.tsx:51-53` | `conversation?.users?.filter(…) \|\| []` — same class |
| `create-group-dialog.tsx:57` | `usersData?.data?.data \|\| []` double-unwrap — misses the single-wrapped shape (empty picker on contract variance) |
| `directory-tab.tsx:152,160` | `(deptsData?.data \|\| deptsData \|\| []).map` — wrapped-object `data` crashes `.map` |
| App-wide | three response dialects handled ad-hoc in ~30 components instead of through `unwrapList`/`unwrapOne` (`api-client.ts:28-46`) |

**Fix (Phase H1 — make the class impossible):**
1. Add `asArray(x)` (returns `[]` unless `Array.isArray`) to `lib/utils` and **mechanically wrap every `.map/.filter/reverse/flatMap/some/find` on API-derived data** — start with the table above plus the widget inventory (announcement-board, pending-approvals, quick-notes, time-clock, metric-widget, employee widgets, hr-activity-feed — several are already defensive; keep and standardize).
2. Fix `chat-tab.tsx:281` precedence: `const pages = messageData?.pages; const messages = pages ? pages.flatMap(p => asArray(p?.data)).reverse() : [];`
3. Rule: **no component unwraps responses inline** — route everything through `unwrapList/unwrapOne/asArray`; enforce with a code-review checklist item + eslint custom rule (or grep CI check for `?.data?.data` patterns outside the helpers).
4. Keep backend contract as-is (3 dialects) but document them in one place (`lib/api-client.ts` header) — do NOT renormalize the API under pressure; the client helper absorbs it. (A later API-wide standardization is Phase R2.)

**Validation:** new vitest unit tests for `asArray/unwrapList/unwrapOne` against all three dialects + error objects + `undefined`; component tests rendering chat-tab/message-list with (a) empty cache, (b) 500-then-retry, (c) wrapped-paginator fixture — no throw; manual: kill the API (dev) and navigate chat — page shows error states, never a white screen.

---

### RC-7 · ErrorBoundary never auto-resets (P1 — the "only fixed by refresh" UX)

**Evidence:** `packages/ui/src/components/error-boundary.tsx` — has a manual retry button (line 54) but **no `resetKeys`/key-based reset**: once a widget or section errors (e.g., a transient 500 or a race), it stays dead for the whole session; navigating away and back does **not** remount it because route segments keep tree identity — the user's only recourse is a full browser refresh (matches report exactly).

**Fix (Phase H2):**
1. Add optional `resetKeys?: unknown[]` — when they change, clear the error (react-error-boundary semantics).
2. At the page level, wrap content with `<ErrorBoundary key={pathname}>` (or use the existing route `error.tsx` boundaries which reset per navigation).
3. Wire the existing retry button to also `queryClient.invalidateQueries()` for the section (via `onRetry`) so "Try again" actually refetches.
4. Audit remaining unguarded sections: every tab pane and widget already has an ErrorBoundary in most places (widget-engine line 226, chat page, settings tabs) — the gap is the *reset* behavior, not coverage.

**Validation:** in dev, force a widget query to fail once then succeed (toggle network offline→online): widget shows error card → recovers on retry or navigation without a full reload. Repeat for a chat section.

---

### RC-8 · Startup hydration race (P1)

**Evidence:** `providers.tsx:20-21` rehydrates auth/UI stores **after mount**; child components mount in the same commit and fire queries with `getAuthToken()` still null → unconditional 401s → the api-client refresh flow fires from many requests at once (mutex prevents duplicate refreshes, but the first paint still churns — the log's cascading `e @ …` context-update stacks and early 401/403 noise). The persisted timer store is never rehydrated at all (FIN-P1-6).

**Fix (Phase H3):**
1. Block data-layer mount until hydration completes: render the app shell (skeleton) until `useAuthStore.persist.hasHydrated()` (zustand exposes it) — one gate in `app/dashboard/layout.tsx` and `(auth)/layout.tsx`.
2. Rehydrate timer store in the same gate and reconcile with `/attendance/me/today` + `/timer` server truth (also closes FIN-P1-6).
3. Ensure `refetchOnWindowFocus`/mount defaults don't stampede on the first paint (queries already default sanely; verify with the React Query devtools during validation).

**Validation:** hard-reload any dashboard page with DevTools throttled: no 401s before the first successful query; no flash of "Session could not load" (the historical symptom this pattern produces).

---

### RC-9 · Offline queue resolves `{queued:true}` as success (P2)

**Evidence:** `api-client.ts:80-83, 210-213` — offline mutations return `{queued:true}`; React Query treats it as success → optimistic dialogs close, success toasts fire; downstream `onSuccess` handlers that read `res.data` get garbage; conflicts park in IndexedDB with no review UI.

**Fix (Phase H4):** return a typed sentinel consumed by a wrapper (`isQueued(res)`) — mutations check it before running success logic and show a persistent "queued — will sync" state instead of success; add a small queued-items/conflict tray (the offline engine already exposes the queue). 

**Validation:** go offline, submit a task comment and a punch: UI shows queued state; reconnect → replay succeeds → real success toast; a deliberate 409 shows in the tray.

---

### RC-10 · Cache-contract inconsistencies (P2)

**Evidence:** `app/dashboard/layout.tsx:133` prefetches `/dashboard/init` with `.then(r => r.data)` while `use-dashboard-init.ts:8` uses `res?.data ?? res` — **same queryKey, two unwrap shapes** (the prefetch can poison the cache for every `useDashboardInit` consumer: announcements board, pending approvals, recent activity — feeding RC-6's crash class when the shape lands wrong).

**Fix (Phase H5):** delete the layout prefetch entirely (the hook fetches with retry/backoff on mount; prefetch adds a race, not speed) or make it call the same helper. Standardize: **one queryFn per key, defined once** (query-keys + shared fetchers file).

**Validation:** dashboard widgets all populate on cold load and on client-side navigation; no `undefined` entries in the React Query cache for `dashboardInit`.

---

### Related weaknesses found during the trace (fix with the phases above)

| ID | Finding | Folded into |
|---|---|---|
| W-1 | `system-jobs-config.tsx:74` unguarded `JSON.parse` — one bad payload kills the Settings tab (no boundary reset compounds it) | H1 + FIN-P1-8 |
| W-2 | Phantom `/attendance/{admin,hr}/analytics` 404s on every console load (noise + wrong fallback math) | FIN-P1-3/15 |
| W-3 | `admin-attendance-table.tsx:114` unencoded `search` interpolation corrupts querystrings | FIN-P1-9 |
| W-4 | Kanban/Gantt page-1 cap (100) silently hides tasks | FIN-P1-14 |
| W-5 | Open Shifts console orphaned (imported, never rendered) | FIN-P1-13 |
| W-6 | QA field-type key mismatch — QA controls degrade to text inputs (spec-critical) | FIN-P0-1 |
| W-7 | `create-group-dialog.tsx:57` double-unwrap + `per_page=1000` (fixed in S4/H1) | S4 + H1 |
| W-8 | CSS `preload … not used` warnings on Vercel — Next prefetch noise, benign; suppress by removing manual preload links if any exist in `app/layout.tsx` | cosmetic |
| W-9 | `content.js: No Listener: tabs:outgoing.message.ready` — **browser extension noise, not the app**; exclude from future error reports | note |

---

## 2. Phase Plan (ordered, with exit criteria)

### Phase S — Stop the bleeding (same day)
- [ ] S1 (RC-1) Reconcile prod migrations; verify the 4 endpoints; add deploy gates + `/api/version`; smoke step in Cloud Build
- [ ] S2 (RC-2) Route avatar/cover/attachment uploads through `apiFetch`; update auth-store user on success
- [ ] S3 (RC-3) `resolveAvatarUrl` + render-site sweep + legacy backfill + `remotePatterns`
- [ ] S4 (RC-4) Gate `/users` & `/qa-forms` queries; fix `per_page=1000` → 100; fetch-on-open for dialogs; `limit=`→`per_page` sweep (FIN-P1-4)
- [ ] S5 (RC-5) Chat-scoped user search endpoint + picker repoint

**Exit:** prod chat + reactions 200; zero 403/422 console noise for any role on dashboard/tasks/projects/chat; uploads work past token TTL; every avatar renders.

### Phase H — Hardening (1–2 days)
- [ ] H1 (RC-6) `asArray/unwrap*` everywhere; fix chat-tab:281 precedence; unit tests for the unwrap matrix; add component tests (chat with failing/empty/wrapped fixtures)
- [ ] H2 (RC-7) ErrorBoundary `resetKeys` + `key={pathname}` + retry-invalidates
- [ ] H3 (RC-8) Hydration gate + timer-store rehydration & server reconcile (closes FIN-P1-6)
- [ ] H4 (RC-9) Queued-result sentinel + queued/conflict tray
- [ ] H5 (RC-10) Kill the init prefetch duplicate; single queryFn per key
- [ ] H6 Fold W-1..W-7 (JSON.parse guard, phantom analytics decision, URL-encode search, board cap notice, open-shifts tab, QA field-type fix — the FIN Phase A items that are stability-adjacent)

**Exit:** fault-injection pass (kill API, throttle network, expire token mid-session, malformed fixtures) produces error/empty/loading states everywhere — never a crash, never a dead section needing refresh.

### Phase V — Verification & Regression
- [ ] V1 Automated: vitest suite green incl. new unwrap/boundary/gating tests; fix the currently-failing `directory.test.tsx` mock (FIN-P1-10); eslint gate added to CI (FIN-P2-13)
- [ ] V2 Contract tests: pin the three response dialects in fixtures; assert `asArray` handles all; OpenAPI-contract test extended to the chat/users/qa endpoints
- [ ] V3 Backend: pgsql test run covering `Conversation::users()` pivot, reactions toggle, markRead chunking; add a migration-drift test (fresh DB + latest code = green)
- [ ] V4 Manual matrix (3 roles × key flows): login → dashboard → chat (send/read/react/pin/group/DM) → tasks (board/edit/submit) → attendance (punch/correct/export) → profile (avatar/session) → navigation loop 3× without reload — zero console errors, zero dead sections
- [ ] V5 Prod soak: 24 h with error monitoring on 5xx rate + frontend console capture (add a minimal window.onerror → API report, or Sentry if acceptable); alert threshold any 5xx spike

### Phase R — Production-Readiness Criteria (definition of done)
1. **Zero** unresolved P0/P1 from polish.md and finalization.md Phase A.
2. Chat, reactions, uploads, DM search verified live on production for all three roles (post-migration smoke recorded).
3. Navigation/reload resilience: 3 consecutive SPA navigations across all pages per role without a single console error or manual refresh.
4. Cache/contract: single unwrap path; `migrate:status` clean; `/api/version` exposes commit + migration state; deploy gates active.
5. Observability: 5xx alerting on Cloud Run, frontend error capture, System Jobs tab used for queue failures (already present).
6. Regression safety: CI = typecheck + vitest (incl. new stability tests) + build + eslint gate + pgsql matrix + OpenAPI lint.

---

## 3. Quick-reference: every confirmed unstable path → its fix

| Production symptom | Root cause | Fix |
|---|---|---|
| `GET/POST /api/conversations*` 500 | pivot column `is_pinned` missing in prod (RC-1) | S1 |
| `POST /api/announcements/{id}/react` 500 | polymorphic `reactions` columns missing/aborted migration (RC-1) | S1 |
| `er.map is not a function` / `(Q \|\| []).filter` in widgets/chat | fragile unwraps (RC-6) fed by 500s + shape drift | S1 + H1 |
| "Something went wrong in this section" until refresh | ErrorBoundary never resets (RC-7) | H2 |
| Photo upload not working | raw fetch, no refresh (RC-2) + relative URLs (RC-3) | S2 + S3 |
| `/avatars/*.png` 404 on web origin | un-normalized avatar paths (RC-3) | S3 |
| `/users` + `/qa-forms` 403 spam | ungated manager queries (RC-4) | S4 |
| Group chat creation fails silently | `per_page=1000` → 422 (RC-4) | S4 |
| Employees can't find people to DM | chat search → `/directory` 403 (RC-5) | S5 |
| Random first-load auth errors / rerender storms | hydration race (RC-8) | H3 |
| Optimistic UI lies when offline | `{queued:true}` as success (RC-9) | H4 |
| Widget data wrong after navigation | duplicate init prefetch shape (RC-10) | H5 |

*Sequence for implementation: S1 first (it is the single biggest live outage), then S2–S5 in one pass, then H1–H6, then V and R. After Phase S, re-run the full zero-trust audit pass on the affected areas before Phase H closes.*
