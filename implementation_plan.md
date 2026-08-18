# Sequential Issue Resolution Plan — Games4Kings Application

> **Scope**: Every single item from [current-live-verify-audit.md](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/current-live-verify-audit.md) (381 lines, 13 sections, 100+ items).
>
> **Approach**: Fix one issue group → verify → next. No patches. Production-ready.

---

## Phase 1 — Session Crash: "Session could not load — We couldn't verify your permissions"
**Audit §1 items 5–6 | §2 items 42–46**

### Root Cause (Code-Level)

**Primary failure point**: [layout.tsx#L164-L178](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/layout.tsx#L164-L178) — when `useCapabilities()` returns `isError: true`, the entire dashboard is replaced with the full-screen error:

```tsx
if (isErrorCapabilities) {
  return (
    <div>
      <h2>Session could not load</h2>
      <p>We couldn't verify your permissions.</p>
    </div>
  );
}
```

**Why `isError` fires**:
1. `useCapabilities()` in [capabilities.ts#L6-L28](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/capabilities.ts#L6-L28) calls `GET /me/capabilities`. Default React Query retry is 3, but each retry may fire before the token refresh mutex in `apiFetch` completes.
2. The refresh mutex in [api-client.ts#L101-L122](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/api-client.ts#L101-L122) is shared across requests, but the capabilities query can start a new request before the mutex resolves, leading to a 401 → `clearAuth()` → redirect cascade.
3. After ~15 minutes, the access token expires. If the silent refresh via `X-Refresh-Token` header fails (e.g., the refresh endpoint returns 401 because the HttpOnly cookie is not being sent correctly due to cross-domain issues), capabilities fails → crash.

**Secondary: Dashboard page crash** in [page.tsx#L234-L253](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/page.tsx#L234-L253) — `useDashboardInit()` `isError` replaces the dashboard with "Dashboard Unavailable".

### Precise Code Changes

| File | Change |
|------|--------|
| [capabilities.ts](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/capabilities.ts) | Add `retry: 3`, `retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000)`. Seed `initialData` from the `g4k_capabilities` cookie so the query never starts in error state. |
| [layout.tsx#L164-L178](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/layout.tsx#L164-L178) | Replace the instant error screen with a 3-second grace period: show loading skeleton for first 3 seconds, then show the error with Retry. This prevents flash-error during token refresh. |
| [api-client.ts#L97-L148](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/api-client.ts#L97-L148) | Make the refresh mutex also resolve GET 401s by queuing them behind `refreshPromise` rather than letting each fail independently. Ensure `clearAuth()` only fires after the refresh attempt completes, not during. |
| [page.tsx#L234-L253](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/page.tsx#L234-L253) | Add `retry: 2` and `retryDelay` to `useDashboardInit()`. Show `placeholderData: keepPreviousData` so stale data displays instead of error screen. |
| [AuthController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/AuthController.php) | Verify the `refresh` endpoint accepts the `X-Refresh-Token` header AND the HttpOnly cookie, and returns a fresh token even when the access token is expired. |

### Verification Checklist (maps to audit items)
- [ ] ✅ §1.5: Login → dashboard loads without "Session could not load" error
- [ ] ✅ §1.6: Underlying session/permission validation works correctly
- [ ] ✅ §2.42: Dashboard does not fail after 15 minutes
- [ ] ✅ §2.43: No "Dashboard Unavailable" error
- [ ] ✅ §2.44: Multiple users do not experience concurrent dashboard failure
- [ ] ✅ §2.45: Connection/session/realtime issue resolved
- [ ] ✅ §2.46: Dashboard data recovers automatically without repeated retries
- [ ] Hard-refresh (Ctrl+F5) → no flash error
- [ ] Open 3 tabs simultaneously → no race condition crash
- [ ] Wait 30+ minutes idle → dashboard still functional

---

## Phase 2 — Image Uploads Across the Application
**Audit §1 items 7–8 | §6 items 136–138 | §9.1 item 257**

### Root Cause (Code-Level)

**Frontend**: [api-client.ts#L57-L59](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/api-client.ts#L57-L59) correctly skips `Content-Type` when body is `FormData`:
```tsx
if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
  headers.set("Content-Type", "application/json");
}
```
This is correct. The issue is likely **backend-side**.

**Backend**: [ProjectController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/ProjectController.php) `store()` method — need to verify:
1. File validation rules (`image|mimes:jpg,png|max:5120`)
2. Storage disk config (local vs S3/GCS) — if cloud storage credentials are wrong → 500
3. [php.ini](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/php.ini) — `upload_max_filesize` and `post_max_size` may be too small

**Frontend**: [create-project-dialog.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/create-project-dialog.tsx) — check how `FormData` is constructed and if the image field name matches what the controller expects.

### Precise Code Changes

| File | Change |
|------|--------|
| [ProjectController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/ProjectController.php) | Debug `store()`/`update()` file handling. Add proper `try/catch` around file storage with meaningful error messages. Ensure `cover_image` field is properly handled as a file upload. |
| [create-project-dialog.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/create-project-dialog.tsx) | Verify FormData field name matches backend (`cover_image`). Add file size validation on client side before upload. |
| [php.ini](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/php.ini) | Ensure `upload_max_filesize = 10M`, `post_max_size = 12M` |
| Storage config | Verify filesystem disk and permissions |

### Verification Checklist
- [ ] ✅ §1.7: Image upload works across entire application
- [ ] ✅ §1.8: Image upload works in Projects module
- [ ] ✅ §6.136: Image upload during project creation works
- [ ] ✅ §6.137: No "Server Error" when uploading project image
- [ ] ✅ §6.138: Uploaded image correctly saved and displayed
- [ ] ✅ §9.1.257: HR project image upload works, no Server Error
- [ ] Large file (>10MB) → appropriate validation error (not server crash)

---

## Phase 3 — Project Pin/Unpin (Star) Functionality
**Audit §1 items 9–15**

### Root Cause (Code-Level)

**Good news**: [project-card.tsx#L36-L37](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/project-card.tsx#L36-L37) already has correct logic:
```tsx
const pinnedItem = pins?.find(p => p.type === 'project' && p.target_id === String(project.id));
const isPinned = !!pinnedItem;
```

**The real issue**: [use-pins.ts#L33-L34](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/hooks/use-pins.ts#L33-L34) uses only `invalidateQueries` on success — no optimistic update. The pin/unpin is **delayed** until the refetch completes.

Also: the `pins` query data shape might be `undefined` initially (before hydration), causing `pins?.find(...)` to fail silently, and the star icon defaults to a state that appears active.

### Precise Code Changes

| File | Change |
|------|--------|
| [use-pins.ts](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/hooks/use-pins.ts) | Add `onMutate` optimistic updates for both `pinMutation` and `unpinMutation`. On pin: optimistically add the pin to cache. On unpin: optimistically remove from cache. Move `invalidateQueries` to `onSettled` for eventual consistency. |
| [project-card.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/project-card.tsx) | Ensure `pins` defaults to `[]` (already does via `data || []` in hook). No change needed if optimistic updates work. |
| [PinController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/PinController.php) | Verify the toggle/create/delete logic returns correct responses. |

### Verification Checklist
- [ ] ✅ §1.11: Pinning a project works immediately (no delay)
- [ ] ✅ §1.12: Unpinning works immediately without page reload
- [ ] ✅ §1.13: Pin/star state accurately reflects current project state
- [ ] ✅ §1.14: Pin/star icon does NOT appear active for every project
- [ ] ✅ §1.15: State remains correct after page refresh

---

## Phase 4 — Leave-Request Calendar (Past Dates Disabled)
**Audit §1 items 16–20**

### Root Cause (Code-Level)

The leave request form lives in [leave-request-form.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/leave/leave-request-form.tsx) (11KB). It uses a `DatePicker` or `Calendar` component from `@g4k/ui`. The calendar likely does not pass a `disabled` callback that disables dates before today.

### Precise Code Changes

| File | Change |
|------|--------|
| [leave-request-form.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/leave/leave-request-form.tsx) | Add `disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}` to the DatePicker/Calendar for start_date and end_date fields. |
| Calendar component in [packages/ui](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/packages/ui/src/components) | Verify the Calendar component supports a `disabled` prop. If not, add support. |

### Verification Checklist
- [ ] ✅ §1.18: Past dates visibly disabled/greyed out
- [ ] ✅ §1.19: Current date displayed correctly
- [ ] ✅ §1.20: Future dates selectable according to leave rules

---

## Phase 5 — Project Details Task Filtering (Project-Scoped Tasks)
**Audit §1 items 21–26 | §9.1 item 269**

### Root Cause (Code-Level)

[tasks-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/tasks-tab.tsx) (36KB) is used both inside project detail pages AND as the standalone tasks page. When used inside a project, it must filter tasks by `project_id`. The project detail page at [page.tsx#L16](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/projects/%5Bid%5D/page.tsx#L16) renders `<TasksTab />` — need to verify if the `projectId` prop is being passed.

Backend: [TaskController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/TaskController.php) — must enforce `project_id` filter in the `index()` method when the query param is provided.

### Precise Code Changes

| File | Change |
|------|--------|
| [tasks-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/tasks-tab.tsx) | Ensure the component accepts a `projectId` prop and includes it in both the API call query params AND the React Query key (so project tasks and overall tasks use separate caches). |
| [page.tsx (project detail)](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/projects/%5Bid%5D/page.tsx) | Pass `projectId={projectId}` to `<TasksTab />` |
| [TaskController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/TaskController.php) | Add `->when($request->project_id, fn($q) => $q->where('project_id', $request->project_id))` to the index query. |

### Verification Checklist
- [ ] ✅ §1.23: Project's task list shows only tasks belonging to that project
- [ ] ✅ §1.24: Tasks from other projects never appear
- [ ] ✅ §1.25: Overall Tasks remain separate from Project Tasks
- [ ] ✅ §1.26: Refreshing page does not change or mix task data
- [ ] ✅ §9.1.269: HR project details task filtering fixed

---

## Phase 6 — Remove Directory & Reports from Employee Application
**Audit §1 item 27 | §12 items 351–352**

### Root Cause (Code-Level)

[layout.tsx#L43-L58](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/layout.tsx#L43-L58) defines `navGroups`:
```tsx
{ name: "Directory", href: "/dashboard/directory", icon: "directory", capability: "directory.view" },
{ name: "Reports & Analytics", href: "/dashboard/reports", icon: "spreadsheet", capability: "reports.view" },
```

These items are gated by `capability`. If Employee role has `directory.view` or `reports.view`, they'll appear. Need to verify backend capability assignments.

### Precise Code Changes

| File | Change |
|------|--------|
| Backend capability seeder/migration | Ensure Employee role does NOT have `directory.view` or `reports.view` capabilities. |
| Route middleware in [api.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/routes/api.php) | Add middleware to block Employee role from `/directory` and `/reports` API endpoints as a backend safeguard. |
| Frontend route pages | Add capability checks in the directory and reports page components as defense-in-depth. Redirect to `/dashboard?error=unauthorized` if accessed without capability. |

### Verification Checklist
- [ ] ✅ §1.27: Directory and Reports & Analytics removed from Employee app
- [ ] ✅ §12.351: Employee users cannot access Admin-only or HR-only functionality
- [ ] ✅ §12.352: Confirmed Directory and Reports & Analytics removed from Employee app
- [ ] Admin login → both visible
- [ ] HR login → both visible
- [ ] Employee login → neither visible in sidebar, mobile nav, or command palette

---

## Phase 7 — PDF Export Button Layout Issue
**Audit §1 items 28–33**

### Root Cause (Code-Level)

[admin-reports-view.tsx#L113-L123](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/reports/admin-reports-view.tsx#L113-L123) — the export buttons are in a flex container:
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={() => handleExport("csv")}>...CSV</Button>
  <Button variant="outline" onClick={() => handleExport("xlsx")}>...Excel</Button>
  <Button variant="outline" onClick={() => handleExport("pdf")}>...PDF</Button>
</div>
```

The parent is `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">`. On narrow viewports, the buttons overflow because the parent has no `overflow-hidden` or `flex-wrap`.

### Precise Code Changes

| File | Change |
|------|--------|
| [admin-reports-view.tsx#L104](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/reports/admin-reports-view.tsx#L104) | Add `flex-wrap` to the parent div. Add `min-w-0` to the text container and `shrink-0` to the button group. On mobile, stack buttons vertically with `flex-col sm:flex-row`. |

### Verification Checklist
- [ ] ✅ §1.30: Export button remains inside the container
- [ ] ✅ §1.31: Button respects page margins
- [ ] ✅ §1.32: Issue fixed after selecting Report Type in Sort options
- [ ] ✅ §1.33: Verified for both Admin and HR

---

## Phase 8 — Dashboard Widget Resizing
**Audit §2 items 39–41**

### Root Cause (Code-Level)

[widget-engine.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx) uses `react-grid-layout` with `ResponsiveGridLayout`. The `GridLayout` component at [line 187-198](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L187-L198) is configured with:
```tsx
<GridLayout
  rowHeight={120}
  onLayoutChange={handleLayoutChange}
  onDragStart={handleDragStart}
  onDragStop={handleDragStop}
  // NOTE: no onResizeStart or onResizeStop handlers!
  // NOTE: no isResizable prop explicitly set
>
```

The `onResizeStart` is set at [line 167](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L167-L169) but **not passed to `GridLayout`**. Also, the `computedLayouts` memo at [line 53-71](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L53-L71) overrides collapsed widgets to `h: 1, minH: 1, maxH: 1` which may interfere with resize.

### Precise Code Changes

| File | Change |
|------|--------|
| [widget-engine.tsx#L187-L198](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L187-L198) | Add `isResizable={true}`, `onResizeStart={handleResizeStart}`, `onResizeStop={handleDragStop}` props to `GridLayout`. Set `minH` and `minW` per widget to prevent collapsing to zero. |
| [widget-engine.tsx#L53-L71](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L53-L71) | When not collapsed, remove `maxH` constraint so resizing works. Set sensible `minH: 2` for uncollapsed widgets. |

### Verification Checklist
- [ ] ✅ §2.39: Widget height resizing works correctly
- [ ] ✅ §2.40: Widgets can be resized without layout errors
- [ ] ✅ §2.41: Resizing one widget does not break or move unrelated widgets

---

## Phase 9 — Chat Connection Status & Realtime
**Audit §3 items 54–56 | items 66–70**

### Root Cause (Code-Level)

**Connection status**: [chat-tab.tsx#L353-L361](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L353-L361) shows "Not Connected" when `!isConnected`. The `isConnected` value from [use-reverb.ts#L136](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/hooks/use-reverb.ts#L136) requires BOTH `!!echoInstance && socketConnected`. The WebSocket might fail to connect if `NEXT_PUBLIC_REVERB_HOST` or `NEXT_PUBLIC_REVERB_APP_KEY` env vars are missing/wrong — see [use-reverb.ts#L36-L39](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/hooks/use-reverb.ts#L36-L39).

**Message delay**: The polling fallback is at [chat-tab.tsx#L84](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L84): `refetchInterval: isConnected ? false : 15_000`. 15 seconds is too long when socket is down.

**Optimistic sending**: Already implemented at [chat-tab.tsx#L244-L283](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L244-L283) — messages appear instantly. But the real-time handler at [line 131-143](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L131-L143) might cause duplicates (optimistic + WebSocket push = 2 copies).

### Precise Code Changes

| File | Change |
|------|--------|
| [use-reverb.ts#L88-L98](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/hooks/use-reverb.ts#L88-L98) | Add reconnection logic: when `connection.state` is `unavailable` or `failed`, attempt reconnect after 5s. Add `connection.bind('connecting', handleConnecting)` to show "Reconnecting..." state. |
| [chat-tab.tsx#L84](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L84) | Change fallback polling from `15_000` to `5_000` ms. |
| [chat-tab.tsx#L131-L143](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L131-L143) | Deduplicate: check if `e.message.id` already exists in the cache before prepending. Skip if the message was optimistically added (check for `pending: true` marker). |
| [chat-tab.tsx#L353-L361](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L353-L361) | Add a "Reconnecting..." intermediate state. Show green "Connected" indicator when `isConnected` is true. |
| Environment config | Verify `.env.local` / `.env.production` have correct `NEXT_PUBLIC_REVERB_HOST`, `NEXT_PUBLIC_REVERB_APP_KEY`, `NEXT_PUBLIC_REVERB_PORT`, `NEXT_PUBLIC_REVERB_SCHEME` values. |

### Verification Checklist
- [ ] ✅ §3.54: "Not Connected" status fixed — shows accurate state
- [ ] ✅ §3.55: Real-time chat connection is actually established
- [ ] ✅ §3.56: Connection status accurately reflects current connection state
- [ ] ✅ §3.66: No delay in sending/receiving messages
- [ ] ✅ §3.67: Messages appear immediately when sent/received
- [ ] ✅ §3.68: Messages sync without multiple page reloads
- [ ] ✅ §3.69: Actual message timestamp preserved
- [ ] ✅ §3.70: Chat sync works under good network

---

## Phase 10 — Chat Employee Search
**Audit §3 items 60–62**

### Root Cause (Code-Level)

[chat-tab.tsx#L314-L323](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L314-L323) — the search input filters conversations, not employees:
```tsx
<input
  placeholder="Search chats..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```
The `searchQuery` is passed to the conversations infinite query at [line 79](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L79). This searches existing conversations, NOT employees for starting new chats.

### Precise Code Changes

| File | Change |
|------|--------|
| [chat-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx) | Add a separate employee search: when the user types and no matching conversation exists, show a "Start new chat" section that queries `GET /users?search=query`. Selecting an employee calls `POST /conversations` with `{ user_id: selectedUserId, scope: 'direct' }` to create/find a DM. |
| [ChatController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/ChatController.php) | Ensure `POST /conversations` creates or returns existing DM conversation for the given user pair. |

### Verification Checklist
- [ ] ✅ §3.60: Employee search in Chat works
- [ ] ✅ §3.61: Typing a name shows matching employees as suggestions
- [ ] ✅ §3.62: Selecting an employee opens a direct conversation

---

## Phase 11 — Chat UI (Mobile Full-Screen, Close Button, Selection State, Chat Pinning)
**Audit §3 items 74–78**

### Root Cause (Code-Level)

- **Mobile full-screen**: [chat-tab.tsx#L293](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L293) has `h-[calc(100dvh-200px)]` — on mobile, the 200px gap is too much with the mobile nav.
- **Close button**: [chat-tab.tsx#L343](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L343) already has a back button on mobile (`md:hidden`), but it's a left-arrow, not a close button.
- **Selection state**: [conversation-list.tsx#L120-L126](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/conversation-list.tsx#L120-L126) — the `border-l-2` is applied to both `isSelected` AND `isUnread` conversations. Unread conversations get `border-l-2 border-primary-500` which looks like a selection indicator.
- **Chat pinning**: The `ChatConversation` interface has `is_pinned?: boolean` at [conversation-list.tsx#L17](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/conversation-list.tsx#L17) but it's not used for pinning/unpinning or sorting.

### Precise Code Changes

| File | Change |
|------|--------|
| [chat-tab.tsx#L293](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L293) | On mobile (`md:` breakpoint), make chat truly full-screen: `h-[100dvh] fixed inset-0 z-50` when a conversation is selected. |
| [chat-tab.tsx#L343](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx#L343) | Change the back arrow to a close/X icon with clear "Close" label for mobile UX. |
| [conversation-list.tsx#L120-L126](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/conversation-list.tsx#L120-L126) | Remove `border-l-2` from unread (non-selected) conversations. Only selected conversations should have the active border. Use a different indicator for unread (e.g., bold text + unread count badge, which is already present). |
| [conversation-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/conversation-list.tsx) + [chat-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/chat/chat-tab.tsx) | Add pin/unpin conversation action (context menu or long-press). Sort pinned conversations to the top of the list with a "Pinned" section header. Backend: `POST /conversations/{id}/pin` and `DELETE /conversations/{id}/pin`. |

### Verification Checklist
- [ ] ✅ §3.74: Chat is full-screen on mobile, similar to standard messaging apps
- [ ] ✅ §3.75: Close button present after opening/selecting a chat
- [ ] ✅ §3.76: Only the currently selected chat displays the selection stroke/border
- [ ] ✅ §3.77: Unselected chats do NOT have incorrect selection strokes
- [ ] ✅ §3.78: Ability to pin important/special chats added

---

## Phase 12 — Announcements (Server Error)
**Audit §3 items 82–85**

### Root Cause Investigation
- [AnnouncementController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/AnnouncementController.php) (8KB) — `store()` method validation or permission check.
- [announcement-board.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/announcement-board.tsx) (17KB) — form submission and error handling.

### Precise Code Changes
| File | Change |
|------|--------|
| [AnnouncementController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/AnnouncementController.php) | Debug the `store()` method — likely a validation rule, missing field, or authorization check causing 500. Add proper error messages. |
| [announcement-board.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/announcement-board.tsx) | Ensure mutation error is caught and displayed meaningfully, not as generic "Server Error". |

### Verification Checklist
- [ ] ✅ §3.82: Announcement creation works in Admin
- [ ] ✅ §3.83: Announcement creation works in HR
- [ ] ✅ §3.84: No "Server Error" when using Announcements
- [ ] ✅ §3.85: Created announcements correctly saved and displayed

---

## Phase 13 — Admin Dashboard Widgets (Team Attendance, Total Employees, Pending Approvals)
**Audit §4.1 items 95–113**

### Root Cause (Code-Level)

**Team Attendance widget movement**: [widget-engine.tsx#L197](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L197) uses `draggableHandle=".widget-drag-handle"`. The drag handle is at [line 202](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L202). This works correctly — the handle is a `<div>`, not a `<Link>`. The 404 issue might be caused by accidentally clicking through the handle into a widget's `<a>` or `<Link>`.

Check [team-attendance-widget.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/dashboard/team-attendance-widget.tsx) for any internal `<Link>` elements that intercept clicks.

**Total Employees**: In [page.tsx#L77-L79](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/page.tsx#L77-L79), the metric widget uses `metricKey="total_employees"`. The data comes from `/dashboard/init` via [DashboardController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/DashboardController.php) — the `total_employees` value may count inactive/terminated employees.

**Pending Approvals**: [pending-approvals-widget.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/pending-approvals-widget.tsx) — at [line 98-100](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/pending-approvals-widget.tsx#L98-L100), each approval item is a `<div>` not a `<Link>`. Only the "View" button at [line 153-155](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/pending-approvals-widget.tsx#L153-L155) links to the approval page.

### Precise Code Changes

| File | Change |
|------|--------|
| [widget-engine.tsx#L74-L96](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/widget-engine.tsx#L74-L96) | The click capture listener blocks clicks when distance > 5px. Verify this prevents 404 navigations during drag. If the issue persists, add `e.preventDefault()` on `mousedown` in the drag handle itself. |
| [DashboardController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/DashboardController.php) | Fix `total_employees` metric to count only `WHERE active_status = 'active'`. |
| [pending-approvals-widget.tsx#L98-L100](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/pending-approvals-widget.tsx#L98-L100) | Wrap the entire approval card `<div>` in a `<Link>` or add `onClick={() => router.push(item.route)}` to make the whole card clickable. Keep the View button as well. |
| [pending-approvals-widget.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/widgets/pending-approvals-widget.tsx) | Add real-time invalidation (subscribe to `user.{id}` channel for `.approval.created` events). |

### Verification Checklist
- [ ] ✅ §4.1.95: Team Attendance widget moves correctly
- [ ] ✅ §4.1.96: Widget draggable in all directions
- [ ] ✅ §4.1.97: Move control does NOT redirect to 404
- [ ] ✅ §4.1.98: Widget doesn't need another widget nearby to be movable
- [ ] ✅ §4.1.102: Active employee count is correct
- [ ] ✅ §4.1.103: Widget displays actual number of currently active employees
- [ ] ✅ §4.1.104: Value synchronized with real-time data
- [ ] ✅ §4.1.108: Stale approval data fixed
- [ ] ✅ §4.1.109: New tasks awaiting approval appear immediately
- [ ] ✅ §4.1.110: Outdated items removed when status changes
- [ ] ✅ §4.1.111: Entire pending approval card is clickable
- [ ] ✅ §4.1.112: Clicking anywhere opens relevant Approval page
- [ ] ✅ §4.1.113: View button continues to work correctly

---

## Phase 14 — Admin Attendance (Real-time, Remove Open Shifts, Remove My Team HR tab)
**Audit §5 items 119–128**

### Root Cause (Code-Level)

**Open Shifts**: [admin-attendance-view.tsx#L32-L35](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-view.tsx#L32-L35) shows the "Open Shifts" tab:
```tsx
<TabsTrigger value="shifts">Open Shifts</TabsTrigger>
```
And its content at [line 51-53](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-view.tsx#L51-L53).

**My Team (HR) tab**: [page.tsx (org/attendance)#L36](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/org/attendance/page.tsx#L36):
```tsx
<TabsTrigger value="team">My Team (HR)</TabsTrigger>
```

### Precise Code Changes

| File | Change |
|------|--------|
| [admin-attendance-view.tsx#L11](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-view.tsx#L11) | Remove `AdminOpenShiftsTable` import. |
| [admin-attendance-view.tsx#L32-L35](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-view.tsx#L32-L35) | Remove the Open Shifts `TabsTrigger`. |
| [admin-attendance-view.tsx#L51-L53](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-view.tsx#L51-L53) | Remove the Open Shifts `TabsContent`. |
| [page.tsx (org/attendance)#L34-L36](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/org/attendance/page.tsx#L34-L36) | Remove the "My Team (HR)" `TabsTrigger`. |
| [page.tsx (org/attendance)#L43-L45](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/org/attendance/page.tsx#L43-L45) | Remove the "team" `TabsContent` with `HrAttendanceView`. Remove the entire `Tabs` wrapper since only Admin view remains. |
| Attendance data queries | Add WebSocket listener for attendance clock events to auto-invalidate attendance queries for real-time updates. |

### Verification Checklist
- [ ] ✅ §5.119: Attendance displays real-time team attendance
- [ ] ✅ §5.120-124: Attendance Overview shows real-time Present, Absent, Leave counts
- [ ] ✅ §5.125: Attendance Analytics uses real-time data
- [ ] ✅ §5.126: Open Shifts removed from Attendance page
- [ ] ✅ §5.127: "My Team (HR)" tab removed from Admin Attendance page
- [ ] ✅ §5.128: Attendance changes reflected without unnecessary page reloads

---

## Phase 15 — Task Approval ("Task has No Pending Approval")
**Audit §6 items 142–146 | §9.1 items 258–259**

### Root Cause Investigation
- [TaskController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/TaskController.php) — the approval endpoint likely checks `Approval::where('status', 'pending')` but the task's approval record may have been created with a different status value (e.g., `'in_review'` vs `'pending'`).
- Frontend uses one status label ("In Review") while backend expects another (`'pending'`).
- Error-message close button — check the toast or dialog component rendering the error.

### Precise Code Changes

| File | Change |
|------|--------|
| [TaskController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/TaskController.php) | Align status values: if the task goes to "In Review", the approval record must be created with `status = 'pending'`. Fix the approval query to match. |
| [Approval.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Models/Approval.php) | Verify the `status` column values and add constants for `PENDING`, `APPROVED`, `REJECTED`. |
| Frontend error display | Ensure the error toast/dialog has a working close button (may be a `sonner` toast configuration issue). |

### Verification Checklist
- [ ] ✅ §6.142: "Task has No Pending Approval" error fixed
- [ ] ✅ §6.143: Task in "In Review" is approvable
- [ ] ✅ §6.144: Frontend and backend use same approval status
- [ ] ✅ §6.145: Error-message close button works
- [ ] ✅ §9.1.258: HR task approval fixed
- [ ] ✅ §9.1.259: HR approval error-message close button fixed

---

## Phase 16 — Task Creation (Error on Success, Duplicates)
**Audit §6 items 149–152 | §9.1 items 260–261**

### Precise Code Changes

| File | Change |
|------|--------|
| [tasks-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/tasks-tab.tsx) | Fix mutation `onSuccess`/`onError` — detect 201/200 properly. Disable submit button with `isPending`. Add `invalidateQueries` for task list on success. |
| [TaskController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/TaskController.php) | Return proper 201 with consistent JSON structure on task creation. |

### Verification Checklist
- [ ] ✅ §6.149: No error shown when creating a task inside a project
- [ ] ✅ §6.150: Successfully created task appears immediately
- [ ] ✅ §6.151: No error displayed when task was actually created
- [ ] ✅ §6.152: No duplicate task creation from retries/reloads
- [ ] ✅ §9.1.260: HR task creation error fixed
- [ ] ✅ §9.1.261: HR newly created tasks appear immediately

---

## Phase 17 — Project Page Layout (Create Button Overflow)
**Audit §6 items 156–158 | §9.1 item 262**

### Root Cause (Code-Level)

[projects-tab.tsx#L40-L83](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/projects-tab.tsx#L40-L83) — the flex container:
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  <FilterBar ... />
  {canManageProjects && (
    <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto h-11">
```
On narrow viewports between `sm` breakpoints, `FilterBar` may push the button outside its container.

### Precise Code Changes

| File | Change |
|------|--------|
| [projects-tab.tsx#L40](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/projects-tab.tsx#L40) | Add `flex-wrap` and `overflow-hidden` to the parent. Ensure `FilterBar` has `min-w-0 flex-1` and the button has `shrink-0`. |

### Verification Checklist
- [ ] ✅ §6.156: Create Project button aligned when page is minimized/resized
- [ ] ✅ §6.157: Button remains inside container and page margins
- [ ] ✅ §9.1.262: HR Create Project button fixed

---

## Phase 18 — Project Details First-Load Error (`undefined.status`)
**Audit §6 items 161–166 | §9.1 items 263–265**

### Root Cause (Code-Level)

[page.tsx (project detail)#L110](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/projects/%5Bid%5D/page.tsx#L110):
```tsx
const project: ProjectData = unwrapOne(projectResponse) as ProjectData;
```
When `projectResponse` is `undefined` (during loading), `unwrapOne(undefined)` returns `undefined`. Then accessing `project.status` crashes.

The loading guard at [line 91](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/projects/%5Bid%5D/page.tsx#L91) uses `isLoading` but the project data assignment at line 110 runs outside the loading check.

### Precise Code Changes

| File | Change |
|------|--------|
| [page.tsx (project detail)#L110](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/app/dashboard/projects/%5Bid%5D/page.tsx) | Add early return with loading skeleton when `isLoading || !projectResponse`. Move the `project` assignment after the loading guard. Add `project?.status` optional chaining everywhere `project.status` is accessed. |

### Verification Checklist
- [ ] ✅ §6.161-162: First-load error "Cannot read properties of undefined (reading 'status')" fixed
- [ ] ✅ §6.163: Project Details loads correctly on first attempt
- [ ] ✅ §6.164: No retry required
- [ ] ✅ §6.165: Fix verified for every existing project
- [ ] ✅ §6.166: Project data loaded before components access `.status`
- [ ] ✅ §9.1.263-265: HR project details first-load error fixed

---

## Phase 19 — QA Forms Redesign (Google-Form Style)
**Audit §6 items 170–174 | §9.1 items 266–268**

### Root Cause
- Current: [qa-field-renderer.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/qa-field-renderer.tsx) (2.5KB) — basic field renderer
- Backend: [QaController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/QaController.php) (3.3KB), [QaForm.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Models/QaForm.php), [QaFormField.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Models/QaFormField.php), [QaSubmission.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Models/QaSubmission.php)

### Precise Code Changes
1. **New QA Form Builder component**: Google-Form-style with sections, drag-to-reorder fields, field types (text, textarea, checkbox, rating/scale, dropdown, file upload).
2. **Preset QA forms**: Backend API to CRUD preset templates; frontend template picker in project creation.
3. **Per-project customization**: Override specific fields in a preset for a project.
4. **Per-task customization**: Allow task-level QA form assignment.
5. **Backend**: Extend `QaForm` model with `is_template` flag, `QaFormField` with `field_type` enum, `QaSubmission` with `task_id` nullable FK.

> [!IMPORTANT]
> This is a **major feature redesign** (~1-2 days of work). I will create a sub-plan during execution.

### Verification Checklist
- [ ] ✅ §6.170: QA form works like Google Form
- [ ] ✅ §6.171: Preset QA forms for projects
- [ ] ✅ §6.172: Customized QA forms for individual projects
- [ ] ✅ §6.173: Customized QA forms for specific tasks
- [ ] ✅ §6.174: QA responses associated with correct project/task
- [ ] ✅ §9.1.266-268: All QA features work for HR

---

## Phase 20 — Board View Filters & Duplicate "All Scope"
**Audit §6 items 178–196 | §9.1 items 270–272**

### Root Cause (Code-Level)

The `"All ScopeAll Scope"` duplication likely comes from [filter-bar.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/packages/ui/src/components/filter-bar.tsx) where the "All" option is automatically prepended to filter options AND the caller also includes an "All Scope" option in the `options` array → two "All Scope" entries.

Board view in [tasks-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/tasks-tab.tsx) — the filter bar is likely only rendered for the List view, not the Board view.

### Precise Code Changes

| File | Change |
|------|--------|
| [filter-bar.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/packages/ui/src/components/filter-bar.tsx) | Fix: don't auto-prepend "All" if the options array already contains an item with value `"all"` or label matching "All *". |
| [tasks-tab.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/tasks-tab.tsx) | Extract the filter bar so it renders above both List and Board views. Ensure filters include Assignee, Status, Scope, Sort (Created Newest), Direction (Descending), and Clear All. |

### Verification Checklist
- [ ] ✅ §6.178: Board view has same filter/sort options as List view
- [ ] ✅ §6.181-186: All Assignee, All Status, All Scope, Created (Newest), Descending, Clear All
- [ ] ✅ §6.187: Filters work correctly in combination
- [ ] ✅ §6.188: Sorting does not reset unexpectedly
- [ ] ✅ §6.192-195: Duplicate "All Scope" removed, only one displays
- [ ] ✅ §9.1.270-272: HR Board view filters and duplicate scope fixed

---

## Phase 21 — Project Calendar Consistency
**Audit §6 items 199–200 | §9.1 item 273**

### Precise Code Changes

| File | Change |
|------|--------|
| [create-project-dialog.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/projects/create-project-dialog.tsx) | Ensure it uses the same `DatePicker` component from `@g4k/ui` that Task Creation uses. Match styling, validation (no past dates for deadline), and interaction patterns. |

### Verification Checklist
- [ ] ✅ §6.199: Project Creation calendar matches Task Creation calendar
- [ ] ✅ §6.200: Date selection, appearance, validation, interaction consistent
- [ ] ✅ §9.1.273: HR project creation calendar matches

---

## Phase 22 — Directory Messaging & Add Employee
**Audit §7 items 206–212**

### Root Cause (Code-Level)

[directory-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/directory/directory-list.tsx) (665 lines) — need to find the three messaging entry points (message icon on widget, Message button in preview, Send Message in profile) and verify each passes the correct `employee.id` to create/open a chat conversation.

Add Employee form failing — likely the form dialog state (`UserForm`) isn't initialized properly on first mount.

### Precise Code Changes

| File | Change |
|------|--------|
| [directory-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/directory/directory-list.tsx) | Fix all 3 message buttons to call `POST /conversations` with `{ user_id: employee.id, scope: 'direct' }` and navigate to `/dashboard/chat?conversation={id}`. |
| [directory-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/directory/directory-list.tsx) | Fix Add Employee dialog initialization — ensure the form state resets properly when opened and doesn't depend on a previous render cycle. |
| [ChatController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/ChatController.php) | Ensure `POST /conversations` accepts `user_id` and returns the conversation (create or find existing). |

### Verification Checklist
- [ ] ✅ §7.207: Message icon on employee widget opens chat with that employee
- [ ] ✅ §7.208: Message button in preview opens chat
- [ ] ✅ §7.209: Send Message button in profile opens chat
- [ ] ✅ §7.210: All three buttons use correct employee ID
- [ ] ✅ §7.211: Add Employee form opens on first attempt
- [ ] ✅ §7.212: No page reload required

---

## Phase 23 — Cross-Page First-Load Errors (`.map is not a function`, `undefined.length`)
**Audit §8 items 220–247 | §10 items 281–297**

### Root Cause (Code-Level)

**Common root cause**: Components receive `undefined` or non-array data from React Query and call `.map()` or `.length` on it without guards.

- **Directory**: [directory-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/directory/directory-list.tsx) — some variable accesses `.length` on `undefined` data before the query resolves.
- **Reports**: [admin-reports-view.tsx#L196](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/reports/admin-reports-view.tsx#L196) — `data?.data || []` is correct but `data` itself could be `undefined` during loading.
- **Attendance**: Components in [admin-attendance-table.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-table.tsx), [hr-attendance-table.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/hr-attendance-table.tsx) likely call `.map()` on the raw query data without `unwrapList()`.

**Cross-page contamination**: Shared query keys (e.g., `departments`, `users-list`) are used across Directory, Reports, and Attendance. If one page's error handler clears these shared caches, the other pages lose their data.

### Precise Code Changes

| File | Change |
|------|--------|
| All data-rendering components | Add defensive `const items = Array.isArray(data) ? data : (data?.data || [])` pattern. Never call `.map()` or `.length` without an array guard. |
| [directory-list.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/directory/directory-list.tsx) | Add `|| []` fallbacks for all data-dependent operations. Wrap main render in loading/error guards. |
| [admin-attendance-table.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/admin-attendance-table.tsx) | Same — ensure `unwrapList()` is used for all API responses. |
| [hr-attendance-table.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/hr-attendance-table.tsx) | Same pattern. |
| Shared query cache | Add `structuralSharing: false` and per-page `select` functions so shared query keys don't cross-contaminate. Or use page-specific query keys where appropriate. |

### Verification Checklist
- [ ] ✅ §8.220-222: Directory loads correctly without "Cannot read properties of undefined (reading 'length')" error
- [ ] ✅ §8.226-228: Reports & Analytics loads correctly without "y.map is not a function"
- [ ] ✅ §8.233-235: Attendance Overview loads correctly without "es.map is not a function"
- [ ] ✅ §8.239-247: Refreshing one page does NOT cause another page to error. Directory, Reports, and Attendance all work independently.
- [ ] ✅ §10.281-283: HR Directory error fixed
- [ ] ✅ §10.287-290: HR Attendance "ee.map is not a function" fixed
- [ ] ✅ §10.294-297: HR cross-page state issue fixed — Directory and Attendance can be opened and refreshed independently

---

## Phase 24 — HR Attendance Heat Map & Real-time Updates
**Audit §11 items 303–308**

### Root Cause (Code-Level)

[hr-attendance-view.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/hr-attendance-view.tsx) currently has two tabs: "Today's Status" and "Trends & Graphs". No heat map exists.

### Precise Code Changes

| File | Change |
|------|--------|
| New: `hr-attendance-heatmap.tsx` | Create a calendar-style heat map component (similar to GitHub contributions). Color-code days by attendance rate (green = high attendance, red = high absence). Filter data to show only HR user's team members. |
| [hr-attendance-view.tsx](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/components/attendance/hr-attendance-view.tsx) | Add a third tab "Calendar Heatmap" with the new component. |
| [AttendanceController.php](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/app/Http/Controllers/AttendanceController.php) | Add/verify endpoint for team-scoped historical attendance data for heat map. Must filter by HR user's department/team — NOT global data. |
| Attendance queries | Add WebSocket listener for real-time attendance clock events. |

### Verification Checklist
- [ ] ✅ §11.303: Attendance Heat Map added for HR
- [ ] ✅ §11.304: Heat Map shows ONLY employees in HR user's team
- [ ] ✅ §11.305: Global company attendance NOT displayed to HR
- [ ] ✅ §11.306: Attendance displays real-time team attendance
- [ ] ✅ §11.307: Attendance Analytics uses real-time data
- [ ] ✅ §11.308: Changes reflected without unnecessary page reloads

---

## Phase 25 — HR Projects (Mirror Admin Fixes — Verification Pass)
**Audit §9.1 items 255–273**

All fixes from Phases 2, 5, 15–21 use shared components. This phase verifies they work under HR role:

### Verification Checklist
- [ ] ✅ §9.1.257: Fix project image upload — done in Phase 2
- [ ] ✅ §9.1.258: Fix task approval — done in Phase 15
- [ ] ✅ §9.1.259: Fix approval close button — done in Phase 15
- [ ] ✅ §9.1.260: Fix task creation error — done in Phase 16
- [ ] ✅ §9.1.261: Tasks appear immediately — done in Phase 16
- [ ] ✅ §9.1.262: Create Project button overflow — done in Phase 17
- [ ] ✅ §9.1.263-265: Project details first-load — done in Phase 18
- [ ] ✅ §9.1.266-268: QA forms — done in Phase 19
- [ ] ✅ §9.1.269: Project task filtering — done in Phase 5
- [ ] ✅ §9.1.270-271: Board view filters — done in Phase 20
- [ ] ✅ §9.1.272: Duplicate All Scope — done in Phase 20
- [ ] ✅ §9.1.273: Calendar consistency — done in Phase 21

---

## Phase 26 — Role & Permission Verification
**Audit §12 items 316–353**

### Precise Code Changes

| File | Change |
|------|--------|
| Backend role seeder | Audit all capabilities per role. Ensure Admin has `*` (wildcard), HR has team-scoped capabilities, Employee has self-service only. |
| [capabilities.ts#L33-L41](file:///c:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/web/src/lib/capabilities.ts#L33-L41) | Verify `hasCapability()` correctly handles wildcard `*` and self-service exclusions. |
| API route middleware | Add role-based middleware on sensitive routes to block Employee access to Admin/HR endpoints at the API level. |
| Frontend pages | Add capability checks on every page that should be restricted. |

### Admin Verification (14 items)
- [ ] ✅ §12.316: Admin can create projects
- [ ] ✅ §12.317: Admin can create tasks
- [ ] ✅ §12.318: Admin can assign projects/tasks to teams/employees
- [ ] ✅ §12.319: Admin can receive project reports
- [ ] ✅ §12.320: Admin can receive task reports
- [ ] ✅ §12.321: Admin can review/approve tasks/projects
- [ ] ✅ §12.322: Admin can view today's team attendance
- [ ] ✅ §12.323: Admin can view historical employee attendance
- [ ] ✅ §12.324: Admin can view performance reports
- [ ] ✅ §12.325: Admin can receive employee leave requests
- [ ] ✅ §12.326: Admin can approve/reject leave requests
- [ ] ✅ §12.327: Admin can communicate with all employees
- [ ] ✅ §12.328: Admin can create announcements
- [ ] ✅ §12.329: Admin receives relevant notifications from HR/Employees

### HR Verification (14 items)
- [ ] ✅ §12.333: HR can create projects
- [ ] ✅ §12.334: HR can create tasks
- [ ] ✅ §12.335: HR can assign projects/tasks to team employees
- [ ] ✅ §12.336: HR can receive team project reports
- [ ] ✅ §12.337: HR can receive team task reports
- [ ] ✅ §12.338: HR can approve tasks/projects (HR approval)
- [ ] ✅ §12.339: HR can view team attendance
- [ ] ✅ §12.340: HR can view historical team attendance
- [ ] ✅ §12.341: HR can view team performance reports
- [ ] ✅ §12.342: HR can receive team leave requests
- [ ] ✅ §12.343: HR can approve/reject leave requests
- [ ] ✅ §12.344: HR can communicate with employees
- [ ] ✅ §12.345: HR can create announcements
- [ ] ✅ §12.346: HR receives relevant notifications

### Employee Verification (4 items)
- [ ] ✅ §12.350: All Employee permissions verified
- [ ] ✅ §12.351: Employee cannot access Admin/HR functionality
- [ ] ✅ §12.352: Directory and Reports removed from Employee
- [ ] ✅ §12.353: All Employee workflows work correctly

---

## Phase 27 — Final End-to-End Regression Testing
**Audit §13 items 359–380**

Comprehensive verification pass — **no code changes**, only testing:

- [ ] ✅ §13.359: Every issue tested after fix
- [ ] ✅ §13.360: Admin, HR, Employee accounts tested separately
- [ ] ✅ §13.361: First-time page loading without refresh tested
- [ ] ✅ §13.362: Page refresh/reload behavior tested
- [ ] ✅ §13.363: Navigation between related modules tested
- [ ] ✅ §13.364: Real-time updates with multiple users tested
- [ ] ✅ §13.365: Chat with multiple users simultaneously tested
- [ ] ✅ §13.366: Attendance changes in real-time tested
- [ ] ✅ §13.367: Project/task creation and updates in real-time tested
- [ ] ✅ §13.368: Approval workflows (creation → approval/rejection) tested
- [ ] ✅ §13.369: Leave-request workflows tested
- [ ] ✅ §13.370: Image uploads from every location tested
- [ ] ✅ §13.371: Desktop, tablet, and mobile layouts tested
- [ ] ✅ §13.372: Responsive/minimized layouts tested
- [ ] ✅ §13.373: No `.map is not a function` errors
- [ ] ✅ §13.374: No `undefined` property access errors
- [ ] ✅ §13.375: No unexpected 404 pages
- [ ] ✅ §13.376: No feature requires page reload for success
- [ ] ✅ §13.377: Real-time state consistent after navigation/refresh
- [ ] ✅ §13.378: One user's data cannot appear in another user's view
- [ ] ✅ §13.379: Role-based access verified across all three user types
- [ ] ✅ §13.380: Final regression test complete

---

## Open Questions

> [!IMPORTANT]
> **Q1 (QA Forms)**: For Phase 19, should the Google-Form-style QA builder support: (a) full drag-and-drop with sections, conditional logic, and branching, or (b) a simpler form with standard field types (text, checkbox, rating, dropdown) and basic customization?

> [!IMPORTANT]
> **Q2 (Chat Pin Placement)**: For Phase 11, should pinned chats appear (a) at the top of the conversation list with a "Pinned" section divider, or (b) in a completely separate panel/tab?

> [!IMPORTANT]
> **Q3 (Heat Map Design)**: For Phase 24, do you prefer (a) a GitHub-contributions-style calendar grid, or (b) a table-based heat map with employees as rows and dates as columns?

> [!IMPORTANT]
> **Q4 (Execution Start)**: Should I begin with **Phase 1 (Session Crash)** and proceed sequentially? Or reprioritize any phase?

---

## Execution Summary

| Phase | Issue | Audit § | Items Covered | Complexity |
|-------|-------|---------|---------------|------------|
| 1 | Session crash + dashboard stability | §1, §2 | 5–6, 42–46 | 🔴 High |
| 2 | Image uploads | §1, §6, §9.1 | 7–8, 136–138, 257 | 🟡 Medium |
| 3 | Project pin/unpin | §1 | 9–15 | 🟢 Low |
| 4 | Leave calendar dates | §1 | 16–20 | 🟢 Low |
| 5 | Project task filtering | §1, §9.1 | 21–26, 269 | 🟡 Medium |
| 6 | Remove Dir/Reports from Employee | §1, §12 | 27, 351–352 | 🟢 Low |
| 7 | PDF export button layout | §1 | 28–33 | 🟢 Low |
| 8 | Dashboard widget resizing | §2 | 39–41 | 🟡 Medium |
| 9 | Chat connection + messaging | §3 | 54–56, 66–70 | 🔴 High |
| 10 | Chat employee search | §3 | 60–62 | 🟡 Medium |
| 11 | Chat UI (mobile, pin, selection) | §3 | 74–78 | 🟡 Medium |
| 12 | Announcements server error | §3 | 82–85 | 🟡 Medium |
| 13 | Admin dashboard widgets | §4.1 | 95–113 | 🟡 Medium |
| 14 | Admin attendance (tabs, real-time) | §5 | 119–128 | 🟡 Medium |
| 15 | Task approval status | §6, §9.1 | 142–146, 258–259 | 🟡 Medium |
| 16 | Task creation error-on-success | §6, §9.1 | 149–152, 260–261 | 🟡 Medium |
| 17 | Project page button overflow | §6, §9.1 | 156–158, 262 | 🟢 Low |
| 18 | Project details first-load | §6, §9.1 | 161–166, 263–265 | 🟡 Medium |
| 19 | QA Forms redesign | §6, §9.1 | 170–174, 266–268 | 🔴 High |
| 20 | Board filters + duplicate scope | §6, §9.1 | 178–196, 270–272 | 🟡 Medium |
| 21 | Calendar consistency | §6, §9.1 | 199–200, 273 | 🟢 Low |
| 22 | Directory messaging + Add Employee | §7 | 206–212 | 🟡 Medium |
| 23 | Cross-page first-load errors | §8, §10 | 220–247, 281–297 | 🔴 High |
| 24 | HR attendance heat map | §11 | 303–308 | 🟡 Medium |
| 25 | HR projects verification | §9.1 | 255–273 | 🟢 Low |
| 26 | Role & permission audit | §12 | 316–353 | 🟡 Medium |
| 27 | End-to-end regression | §13 | 359–380 | 🟡 Medium |

**Total audit items covered**: 100+ (every single checkbox from the audit document)
