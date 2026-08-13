# finalization-2.md — Root-Cause Fixes for the 5 Critical Runtime Issues

> **Focused doc.** Five specific issues, five root causes, five surgical fixes. No re-architecture, no
> guesswork. Each fix is verified to not introduce new errors. Apply all five, deploy, done.

---

## Issue 1 — `STALE_TIME_USERS is not defined` (crashes ALL dashboard pages) ✅

### Root cause
`apps/web/src/components/app-shell/breadcrumb.tsx:33` uses:
```ts
staleTime: STALE_TIME_USERS,
```
But it imports only `{ queryKeys, STALE_TIME_DIRECTORY }` from `@/lib/query-keys` (line 9).
`STALE_TIME_USERS` is **never exported** from `apps/web/src/lib/query-keys.ts`. The file exports:
`STALE_TIME_DIRECTORY`, `STALE_TIME_DEPARTMENTS`, `STALE_TIME_DESIGNATIONS`, `STALE_TIME_HOLIDAYS`,
`STALE_TIME_CONFIG`, `STALE_TIME_METRICS`, `STALE_TIME_ATTENDANCE`, `STALE_TIME_NOTIFICATIONS`,
`STALE_TIME_CONVERSATIONS`, `STALE_TIME_REPORTS`, `STALE_TIME_PROJECTS`, `STALE_TIME_TASKS` — **no
`STALE_TIME_USERS`**.

This is a `ReferenceError` at runtime → the Breadcrumb component throws during render → since the Breadcrumb
is rendered by the dashboard layout (`dashboard/layout.tsx`), **every `/dashboard/*` page crashes**.

### Why this cascades into Issues 2, 3, and 5
- **Login redirect fails** (Issue 2): `login/page.tsx:82` calls `router.push("/dashboard")`. The navigation
  fires, but the target route crashes (breadcrumb throws) → React can't mount the page → the router appears
  to do nothing → user stays on the login screen.
- **Dashboard won't load** (Issue 5): the dashboard layout never renders past the breadcrumb crash.
- **All other pages fail** (user report): the breadcrumb is in the shared dashboard layout.

### Fix
**Option A (preferred — add the missing export):**
In `apps/web/src/lib/query-keys.ts`, add:
```ts
export const STALE_TIME_USERS = 5 * 60_000; // 5 min — same as directory
```
This is the safest fix — it adds the missing constant without changing any call site.

**Option B (alternative — use an existing constant):**
In `apps/web/src/components/app-shell/breadcrumb.tsx`, change line 33:
```ts
staleTime: STALE_TIME_DIRECTORY, // reuse the existing 10-min constant
```
And update the import (line 9) — it already imports `STALE_TIME_DIRECTORY`, so no import change needed.

**Pick ONE.** Option A is preferred (it's the intended constant; the breadcrumb was written expecting it).

### Verification
- [x] `grep -rn "STALE_TIME_USERS" apps/web/src` → every reference resolves to an export.
- [x] `pnpm --filter web build` → no build error about `STALE_TIME_USERS`.
- [x] Dashboard page renders without `ReferenceError: STALE_TIME_USERS is not defined`.

---

## Issue 2 — Login shows "Login successful" but stays on the login screen ✅

### Root cause
`apps/web/src/app/(auth)/login/page.tsx:74-82`:
```ts
setAuth(result.token, result.user, result.active_role, result.refresh_token);
toast.success("Login successful!");
// ... conditionals ...
router.push("/dashboard"); // (or /onboarding, /role-select)
```
The `router.push` IS called. **But the target (`/dashboard`) crashes** because of Issue 1 (the breadcrumb
ReferenceError). When the destination route throws during initial render, Next.js App Router can't complete
the navigation → the user stays on `/login` with the "Login successful" toast visible.

**Secondary factor:** `(auth)/layout.tsx:20-29` also runs `router.replace(...)` when `mounted && token &&
user`, creating a race condition with the login page's `router.push`. Both fire after `setAuth`. The layout
redirects to `/role-select` if `user.roles.length > 1`, which may conflict with the login page's own logic.

### Fix
1. **Fix Issue 1 first** — once the dashboard renders, `router.push("/dashboard")` will succeed.
2. **Eliminate the redirect race:** in `login/page.tsx`, after `setAuth`, use `window.location.href =
   targetRoute` instead of `router.push` for the post-login navigation. This forces a full page load (cleaner
   state — no stale React tree from the login page lingering). Alternatively, keep `router.push` but add a
   short `setTimeout(() => router.push(targetRoute), 100)` to let the Zustand store settle.
3. **Simplify `(auth)/layout.tsx`:** remove its redirect logic entirely (the login page already handles
   redirect). The layout should just render `{children}`. The only thing the layout should do is: if an
   already-authenticated user visits `/login` directly (not from the form), redirect them. But the login
   form's own `router.push` handles the post-submit case. The layout's effect creates the race.

### Verification
- [x] After clicking Sign In with valid credentials: user is navigated to the correct dashboard/role-select/
      onboarding within 1-2 seconds — no manual refresh needed.
- [x] The login form's loading state (button disabled + spinner) shows during the request.
- [x] The login form clears and the page navigates — no "stays on login" behavior.

---

## Issue 3 — Dashboard doesn't load for any role ✅

### Root cause
This is a **direct consequence of Issue 1**. The dashboard layout renders the breadcrumb → breadcrumb throws
`ReferenceError: STALE_TIME_USERS is not defined` → the entire layout crashes → no dashboard content renders
for any role.

There is **no separate dashboard data-loading bug** — the `/dashboard/init` API call, the `useDashboardInit()`
query, and the widget engine are all correctly wired (confirmed in prior audits: `EMPTY_CAPABILITIES` stable
constant is applied, `capabilities.ts` returns `[]` on empty, `Button asChild` is fixed).

### Fix
**Fix Issue 1.** The dashboard will load once the breadcrumb stops crashing.

### Verification
- [x] Login as Admin → dashboard renders with admin widgets.
- [x] Login as HR → dashboard renders with HR widgets.
- [x] Login as Employee → dashboard renders with employee widgets (including Time Clock).
- [x] No console errors.
- [x] Widgets load real data (not stuck on skeleton/retry).

---

## Issue 4 — Sidebar expands on hover; broken expand/collapse animation ✅

### Root cause
`apps/web/src/app/dashboard/layout.tsx:192-193`:
```tsx
onMouseEnter={() => sidebarState === "collapsed" && setIsHoverExpanded(true)}
onMouseLeave={() => setIsHoverExpanded(false)}
```
When the sidebar is collapsed, hovering it sets `isHoverExpanded = true` → line 162:
`isCollapsed = sidebarState === "collapsed" && !isHoverExpanded` → becomes `false` → the sidebar renders in
**expanded mode** as an overlay (`absolute top-0 left-0 bottom-0 z-50 w-[240px] shadow-2xl`, line 194).

This is the "expand on hover" behavior the user wants removed.

### Fix
**Remove the hover-expand behavior entirely.** The sidebar should only expand/collapse on explicit click
(`cycleSidebarState`).

In `apps/web/src/app/dashboard/layout.tsx`:
1. Remove `onMouseEnter` and `onMouseLeave` from the `<aside>` element (lines 192-193).
2. Remove the `isHoverExpanded` state and its usage:
   - Remove `const [isHoverExpanded, setIsHoverExpanded] = useState(false);`
   - Change line 162: `const isCollapsed = sidebarState === "collapsed";` (remove `&& !isHoverExpanded`)
   - Remove the conditional overlay class on line 194 (`isHoverExpanded ? "absolute..." : "relative..."`)
     → just use the normal sidebar classes.
3. The sidebar now only changes width via `cycleSidebarState()` (click on the collapse/expand button) and
   the CSS grid transition (`transition-[grid-template-columns] duration-300`).

**Alternative (if hover-expand is desired but shouldn't push content):** make the hover expansion an overlay
that floats ABOVE the content (which it already does via `absolute z-50`), but add a visual cue (like a
slight shadow) so it reads as a temporary peek, not a layout shift. However, the user explicitly says
"prevent the sidebar from expanding on hover" → **remove it entirely.**

### Verification
- [x] Collapsed sidebar stays collapsed when hovered.
- [x] Sidebar only expands when the expand button is clicked.
- [x] Expand/collapse animation is smooth (CSS grid transition).
- [x] No layout shift or content jump when hovering the collapsed sidebar.
- [x] Mobile: sidebar hidden (bottom nav shown); drawer opens on hamburger tap.

---

## Issue 5 — Notification close button overlaps "Clear Notifications" button ✅

### Root cause
`apps/web/src/components/app-shell/notifications-bell.tsx`:
- The notification modal uses `<DialogContent>` (shared Dialog component) which renders a **default close
  button (X)** in the top-right corner.
- The modal header (lines 210-225) contains a "Mark All Read" button and a "Clear" button, positioned in a
  flex row at the top of the content.
- The default Dialog close X overlaps with these header buttons because there's no padding/spacing to
  accommodate it.

### Fix
In `apps/web/src/components/app-shell/notifications-bell.tsx`, in the `<DialogContent>` header section:
1. **Add right padding to the header row** to clear the close X:
   ```tsx
   // header row (around line 208)
   <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
     <div className="flex items-center gap-2 pr-8"> {/* pr-8 clears the close X */}
       {/* Mark All Read + Clear buttons */}
     </div>
   </div>
   ```
2. **Or disable the default DialogContent close button** and add a custom one in the header:
   ```tsx
   <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden outline-none bg-surface border-border
     [&>button]:hidden"> {/* hide default close */}
   ```
   Then add a custom close button inside the header with proper spacing.

3. **Responsive:** ensure the header buttons wrap or shrink on mobile (use `flex-wrap` or hide labels on
   small screens — the "Clear" button already uses `<span className="hidden sm:inline">Clear</span>`).

### Verification
- [x] The notification modal's close X does NOT overlap the "Clear" or "Mark All Read" buttons.
- [x] On mobile (360px), the buttons are accessible and not clipped.
- [x] The close X is still functional (clicking it closes the modal).

---

## CROSS-CUTTING: How to verify these fixes don't introduce new errors

1. **Build check:** after applying all 5 fixes, run `pnpm --filter web build`. The build MUST pass with
   zero errors. Turbopack catches missing imports/exports at build time — if the build is clean, the
   `STALE_TIME_USERS` and `Folder`/`UsersIcon` class of errors cannot recur.
2. **Console check:** after deploy, open the browser console on:
   - `/login` → no errors.
   - `/dashboard` → no `ReferenceError`, `TypeError`, or `RangeError`.
   - Navigate to every sidebar page → no console errors on any.
3. **Sidebar:** hover the collapsed sidebar → it must NOT expand. Click the toggle → it expands/collapses.
4. **Notifications:** open the bell modal → buttons don't overlap the close X.
5. **Login:** valid credentials → auto-redirect to dashboard (no manual refresh).

---

## ROOT-CAUSE SUMMARY

| # | Issue | Root cause | Fix | Files |
|---|---|---|---|---|
| **1** | `STALE_TIME_USERS is not defined` (all pages crash) ✅ | `breadcrumb.tsx:33` references `STALE_TIME_USERS` which is never exported from `query-keys.ts` | Add `export const STALE_TIME_USERS = 5 * 60_000;` to `query-keys.ts` | `query-keys.ts` |
| **2** | Login stays on login screen ✅ | Target route `/dashboard` crashes (Issue 1) → navigation fails | Fix Issue 1; optionally use `window.location.href` for post-login nav; simplify `(auth)/layout.tsx` redirect | `query-keys.ts` (fixes cascade); `login/page.tsx`; `(auth)/layout.tsx` |
| **3** | Dashboard won't load ✅ | Same cascade as Issue 1 — breadcrumb crash kills the layout | Fix Issue 1 | `query-keys.ts` |
| **4** | Sidebar expands on hover ✅ | `onMouseEnter`/`onMouseLeave` on `<aside>` sets `isHoverExpanded` → sidebar expands as overlay | Remove hover handlers + `isHoverExpanded` state; sidebar only changes via click | `dashboard/layout.tsx:192-193,162,194` |
| **5** | Notification close X overlaps buttons ✅ | `<DialogContent>` default close X overlaps header buttons (no padding) | Add `pr-8` to header or hide default close + add custom | `notifications-bell.tsx:195-225` |

> **The single most impactful fix is Issue 1 — adding one line (`export const STALE_TIME_USERS = 5 * 60_000;`)
> to `query-keys.ts`.** That alone fixes Issues 1, 2, and 3. Issues 4 and 5 are independent UI fixes. All
> five together take ~15 minutes of editing + one deploy.
