# Design — communication

## Data model (new tables)
- `conversations`: `id`, `type` enum(global, project, direct, group), `project_id` (fk nullable — set for project chats), `title` (nullable — for groups/global), `created_by` (fk users, nullable), `meta` (json — group description, image, etc.), standard timestamps. One global row seeded per company. `direct` rows keyed by the sorted pair of member ids (enforced unique) so the same DM reopens.
- `conversation_members`: `id`, `conversation_id` (fk), `user_id` (fk), `last_read_at` timestamp nullable, `muted` bool default false, `role` enum(member, admin) default member (group creator = admin), standard timestamps. Unique `(conversation_id, user_id)`. Drives read/unread: a message is unread for a member if `messages.created_at > conversation_members.last_read_at`.
- `messages`: `id`, `conversation_id` (fk), `sender_id` (fk users), `body` (json — Tiptap doc, supports mentions/links/formatting), `mentions` (json — array of mentioned user ids, denormalized for notify + filtering), `attachments` (json — `{kind: image|file|link, url, name, mime, size}`), `reply_to` (fk messages nullable), `pinned` bool default false, `system_event` (nullable enum: task_created, task_assigned, task_submitted, task_approved — for project task-alert auto-posts), `created_at`, `updated_at`. Indexed on `(conversation_id, created_at)` for history pagination.
- `read_receipts`: `id`, `message_id` (fk), `user_id` (fk), `at` timestamp. Used for DM read receipts (per-message). Bulk-write on conversation open is avoided (DMs only).
- `announcements`: `id`, `scope` enum(company, team), `team_id` (fk nullable — for team scope), `author_id` (fk users), `title`, `body` (Tiptap json), `pinned` bool default false, `dismissals` (json — user ids who closed it on dashboard), `reactions` (json — `{user_id: emoji}`), standard timestamps. Capability gate: company scope = admin; team scope = hr for that team.
- `notes`: `id`, `user_id` (fk), `title`, `body` (text), `color` (note color token), `pinned_to_dashboard` bool default false, `sort_order` int default 0, standard timestamps. Private to owner (no company scoping needed).
- `feedback_complaints`: `id`, `user_id` (fk — submitter), `to_role` enum(hr, admin), `subject`, `body`, `notification_id` (fk — the high-priority notification created), `status` enum(open, acknowledged, resolved) default open, standard timestamps.
- `notifications`: `id`, `user_id` (fk — recipient), `category` enum(mention, message, submission, approval, announcement, holiday, feedback, system, suspicious_login, leave), `priority` enum(high, system) — bell only counts `high` and `system`, `title`, `body`, `payload` (json — deep link `{type, id}`), `read_at` timestamp nullable, standard timestamps. Indexed on `(user_id, read_at)`.

## API (OpenAPI additions)
Conversations:
- `GET /conversations` → list visible to user (global + their direct + their projects + their groups) with unread counts.
- `POST /conversations` → create group (capability `conversations.group.create` = hr) `{ title, member_ids, meta }`.
- `GET /conversations/{id}` → metadata + member list.
- `GET /conversations/{id}/messages` → paginated history (cursor on `created_at`, default 50).
- `POST /conversations/{id}/messages` → `{ body, mentions?, attachments?, reply_to? }` → broadcasts `MessageSent`.
- `POST /conversations/{id}/messages/{msgId}/pin` → toggle pin (capability `messages.pin` = hr in project chats).
- `POST /conversations/{id}/read` → set `last_read_at` for caller; for DMs also writes `read_receipts`.
- `GET /conversations/{id}/members` → member list (drives @mention dropdown).
- `POST /conversations/direct/{userId}` → open-or-create the DM with that user (idempotent by sorted-pair key).

Notifications:
- `GET /notifications` → paginated history (virtualized on web); filter `?priority=high|system|all`.
- `POST /notifications/read` `{ ids? }` → mark read (empty ids = mark all).
- `GET /notifications/unread-count` → `{ count }` for bell badge.

Announcements:
- `GET /announcements` → list visible (company + caller's teams), pinned first.
- `POST /announcements` → create (capability `announcements.company.post` = admin; `announcements.team.post` = hr) `{ scope, team_id?, title, body, pinned? }`.
- `POST /announcements/{id}/react` `{ emoji }`.
- `POST /announcements/{id}/dismiss` → record dashboard dismissal for caller.

Notes:
- `GET /notes` → caller's notes.
- `POST /notes` / `PATCH /notes/{id}` / `DELETE /notes/{id}` → `{ title, body, color, pinned_to_dashboard, sort_order }`.

Feedback:
- `POST /feedback` → `{ to_role, subject, body }` → opens DM to HR/Admin + creates high-priority notification; returns the DM conversation id.

All guarded by Sanctum + capability middleware.

## Realtime (Laravel Reverb, ADR-013)
- Channels:
  - `private-user.{id}` — personal notifications, read receipts for DMs, session/role events from earlier phases.
  - `presence-conversation.{id}` — a chat conversation (presence shows who's online in it); `MessageSent`, `MessageRead`, `Mentioned`, member join/leave.
  - `presence-project.{id}` — project presence + task alerts (project chat messages also broadcast here for live widget refresh).
  - `public-announcements` — company-wide `AnnouncementPosted`.
- Events:
  - `MessageSent { conversation_id, message }` → presence-conversation.
  - `MessageRead { conversation_id, message_id, user_id }` → presence-conversation (DM read receipts) and private-user for the sender.
  - `Mentioned { user_id, conversation_id, message_id, snippet }` → private-user.{mentioned}.
  - `AnnouncementPosted { announcement }` → public-announcements (company) or per-team presence channel; also writes a `notifications` row.
  - `Notified { notification }` → private-user.{id} (drives bell increment + toast).
- Authorization endpoint authorizes presence membership from `conversation_members` / project team membership / capability.

## @mention resolution
The compose editor (Tiptap) intercepts `@` and queries `GET /conversations/{id}/members` (cached). On send, the backend parses the Tiptap doc for mention nodes, persists the `mentions` array, and dispatches one `Mentioned` event per target → `notifications` row (priority high). This keeps mention delivery server-validated rather than client-claimed.

## Offline (ADR-009 chat = Timestamp, ADR-010 single Offline Engine)
- Outgoing messages are queued in IndexedDB as Offline Engine ops (`chat.send`) with `{conversation_id, body, client_temp_id, created_at}`; the UI shows them as pending.
- On reconnect the Sync Manager replays in order; server assigns authoritative ids; duplicate `client_temp_id` dedupes.
- Conflict resolution is Timestamp: same-conversation messages order by `created_at`; no merge needed for append-only messages.
- The chat header shows "Not connected" derived from the Connectivity Monitor; the bell badge still reflects last-known unread count.
- Read receipts and read-state sync require connectivity (authoritative); optimistic local read is reconciled on reconnect.
- Reverb reconnect uses the pusher-js client's exponential backoff; missed events are backfilled via `GET /conversations/{id}/messages?after=`.

## File and image sharing (R8.8, R11.3)
- Image/file attach opens a popup (reusing the R3.6 dialog + R2.11 profile-pic popup pattern): client validates mime + size before upload (config: e.g. images png/jpg/webp ≤5MB; files pdf/zip/docx ≤10MB — values in settings, Phase 10).
- A stored upload yields a URL stored in `messages.attachments`; the image popup previews it.
- Task submission (Phase 7) attaches **links / directory references**, not full uploads — the task form collects a list of URLs; full file upload is deferred to M2.
- All uploads go through the shared attachment endpoint (no chat-specific storage path) so M2 can extend it.

## Capabilities (introduced)
- `conversations.group.create` — HR (and Admin) create custom group chats.
- `messages.pin` — HR may pin messages in project chats (Admin implicitly).
- `announcements.company.post` — Admin posts company-wide.
- `announcements.team.post` — HR posts team-level (scoped to teams they manage).
- `feedback.submit` — Employee (all roles can submit; the form targets HR/Admin).
- Notification read/list is universal (no capability); bell only counts high + system priority.
- The capability matrix is authored in Phase 2; this phase only declares the new capabilities and gates.

## Components (reuse first)
- Reuse the R3.6 dialog/drawer/toast/empty-state for image popup, member picker, mention dropdown.
- Reuse the R3.8 filter bar for notification history filters; virtualize via R11.5 list virtualization.
- Reuse the Offline Engine queue UI ("pending" indicator) from Phase 0/3.
- No new engine; chat is a feature module using existing engines.

## Test strategy
- api feature tests: conversation list visibility by role/membership; message send + broadcast event dispatched; @mention creates notification + Mentioned event; DM read receipt writes read_receipts and emits MessageRead; pin message capability gate (hr in project); group create capability gate; announcement scope capability gate (admin company / hr team); notification unread count only counts high+system; feedback creates DM + high-priority notification; offline queue dedupe by client_temp_id; Timestamp ordering.
- api contract tests: OpenAPI examples for every new endpoint.
- web tests: chat list unread border/badge; mark-read on open; mention dropdown renders conversation members; image popup enforces size/format; offline "Not connected" indicator; bell unread count; announcement reactions without comments; mobile full-screen conversation + fixed input; Quick Notes pin to dashboard.
- seed: one global conversation; a sample group; a couple announcements; a note per seed user.

## Performance Requirements (Phase 8)
> Mirrors `PERFORMANCE-STANDARDS.md` and R13.x. These are CI-enforced verification targets
> (production build). "Must" = gate, "should" = warn. They ADD to the existing design — they do
> not relax anything above.

### Message list & send
- **Virtualized message history** (R13.14, P-VIRTUAL): a conversation can hold thousands of
  messages. The message list MUST be virtualized (`@tanstack/react-virtual`) — DOM node count ≤
  (visible + overscan) regardless of history length, and 60 FPS while scrolling at 5000 messages
  (test asserts both). Append-only render: new messages mount at the tail, never re-render the
  whole list.
- **Memoized rows + stable keys** (R13.12, P-RERENDER): message rows are `React.memo`'d with
  stable `message.id` keys; no anonymous callbacks/objects in props on the hot list; React
  Profiler render-count test asserts a single appended row does not re-render siblings.
- **Jank-free auto-scroll** (R13.2, P-INP): when the user is parked at the bottom, an incoming
  message auto-scrolls without dropping frames; INP on the chat route ≤ 200ms (p75).

- **Optimistic send + rollback** (R13.19, P-OPTIMISTIC): on send, the message is inserted
  instantly as a pending row (client temp id) before the network resolves; on error it rolls
  back with a danger toast and is moved to the failed state (retryable). Non-idempotent send is
  NOT optimistic about server id assignment — it is optimistic about the visible row only.
- **Offline queue** (R13.20, P-RETRY): while "Not connected", sends are queued as Offline Engine
  `chat.send` ops (existing design); the UI shows pending state and replays in order on reconnect
  with `client_temp_id` dedupe.

### @mentions
- **Instant client-side mention filter** (R13.15, P-SEARCH): the `@` dropdown filters the
  conversation's member list client-side from the cached member query — filter latency < 50ms,
  debounced (~150ms), no per-keystroke network call. Only the open conversation's members are in
  memory.

### Realtime subscriptions (scoped, no render storms)
- **Scoped subscriptions** (R13.26, P-MEM): a client subscribes only to `presence-conversation.{id}`
  for the currently open conversation plus its `private-user.{id}`. On conversation switch it
  unsubscribes from the previous conversation channel — never accumulating channels across
  navigation (verified by a 20-screen navigation memory/subscription test).
- **Cache-patch on incoming events** (R13.10/12, P-CACHE-API/RERENDER): an incoming `MessageSent`
  patches the relevant TanStack Query cache (append the message to the right conversation's data)
  rather than triggering a refetch or re-rendering unrelated conversations.
- **Throttle/batch realtime events** (R13.12, P-RERENDER): in high-traffic chats (Global,
  active project chats), inbound events are batched/throttled into one render flush per frame
  (e.g. microtask/`requestAnimationFrame` coalescing) to prevent render storms; a burst of N
  messages in <1 frame produces a single DOM update.

### Conversation list & unread state
- **Cached conversation list** (R13.10, P-CACHE-API): `GET /conversations` uses TanStack Query
  with a 15s `staleTime` and stale-while-revalidate — switching into and out of chat shows cached
  data instantly (no spinner), background revalidate refreshes unread counts. `gcTime` bounded
  (no unbounded growth).
- **Optimistic unread on read** (R13.19, P-OPTIMISTIC): opening an unread conversation clears the
  border + badge and decrements the count optimistically before `POST /conversations/{id}/read`
  resolves; on error it restores with a toast.

### Notifications
- **Virtualized notification history** (R13.14, P-VIRTUAL): the bell dropdown / Notification
  Center history list is virtualized (a user can accumulate thousands of notifications) — ≤
  (visible + overscan) DOM nodes, 60 FPS at 5000 rows.
- **Optimistic mark-read** (R13.19, P-OPTIMISTIC): opening the bell or an item decrements the
  unread count instantly; the bell count only reflects `high` + `system` priority (existing
  design); rollback on error.

### Rich text (Tiptap) & attachments
- **Lazy editor** (R13.8, P-LAZY): the Tiptap editor (rich compose) is dynamically imported on
  first use of a compose box and idle-prefetched when chat is likely; it is NOT in the chat route
  chunk by default (bundle analyzer verifies it stays out of First-Load JS). First-Load JS for the
  chat route ≤ 200KB gz (R13.7).
- **Images via next/image + limits** (R13.9, P-IMG): shared images render through `next/image`
  (responsive srcset, lazy, blur placeholder); client-side mime + size validation enforces the
  configured limits BEFORE upload (rejected early, no wasted request).
- **Attachment metadata** (R13.5/13.10): message attachments are stored as compact metadata in
  `messages.attachments` (kind/url/name/mime/size) and listed inline — never bulk-loading full
  attachment blobs with the message list.

### Announcements & Quick Notes
- **Optimistic announcement reactions** (R13.19, P-OPTIMISTIC): reacting to an announcement
  applies instantly and rolls back on error; one-click reaction, no comments (existing design).
- **Lazy/conditional dashboard announcement** (R13.8/13.18): the pinned-announcement dashboard
  widget loads the announcement only when one is pinned/undismissed for that user and renders a
  skeleton first, never blocking the dashboard.
- **Quick Notes local-first** (R13.16/13.20, P-FORM/RETRY): Quick Notes save instantly to
  IndexedDB (local-first) on every edit with no network round-trip per keystroke; the backend
  sync is debounced/queued in the Offline Engine. Editing a note never blocks typing.

### Frequent workflows (click / latency budgets) — R13.24, P-DATAENTRY
- **Send a message**: type, Enter (or send button) — instant optimistic insert, ≤ the keystroke,
  no full reload, no spinner. (1 action)
- **Mark a conversation read**: happens on open — optimistic border/badge clear, ≤ 1 frame, no
  reload. (0 extra clicks)
- **React to an announcement**: one click — optimistic, no modal, no reload. (1 click)

### Indexes & query budgets (carried from data model)
- `(conversation_id, created_at)` on `messages` and `(user_id, read_at)` on `notifications` are
  the hot paths (already specified); history pagination MUST be cursor-based on `created_at`
  (R13.6, P-CURSOR). `GET /conversations/{id}/messages` and `GET /notifications` MUST execute ≤ 5
  SQL queries regardless of row count (R13.5, P-Q-COUNT) — verified by a query-count feature test.
- Per-widget error boundary: a failed message send, mention dropdown, or notification fetch MUST
  NOT take down the chat route (R13.21, P-RESILIENT) — the offending thread/list shows its error
  state, the rest stays usable.

## Component mapping (Phase 8 — composes only from openspec/COMPONENT-SYSTEM.md)
> Every Phase 8 screen composes ONLY primitives from `openspec/COMPONENT-SYSTEM.md` §1–§8. The
> module composites named below are §7 composites (built FROM §1–§6 primitives); no new primitives
> are introduced.

- **ConversationList** (§7 composite): virtualized; unread = colored left border + `Badge` count
  (§3); search `Input` (§1, debounced per §5). Click → conversation route.
- **MessageList** (§7 composite): virtualized, append-only, memoized rows (stable `message.id`
  keys, no sibling re-render on append); jank-free auto-scroll; pinned messages rendered on top.
- **MessageComposer** (§7 composite): lazy `TiptapEditor` (§8, rich) + @mention `Combobox` (§3,
  instant client-side filter of cached members) + attach `IconButton` → `FileUpload` popup (§1,
  mime/size validated before upload) + send `Button` (§1, Enter to send / Shift+Enter newline);
  optimistic insert + rollback `Toast` (§6) on error.
- **Chat on mobile**: full-screen `Sheet` (§2) with a fixed bottom `MessageComposer` input.
- **NotificationsBell** (§6 composite): bell `IconButton` + unread `Badge` (counts `high` + `system`
  priority only); `Popover` (§2) list of recent items; optimistic mark-read decrements the badge.
- **NotificationCenter** (§7 composite): `Tabs` (§2 — All / Unread / Mentions) over a virtualized
  list (reuses `DataTable` virtualization, §3); optimistic mark-read; filter via shared `FilterBar`
  (§5).
- **AnnouncementCard** (§6 composite): dashboard placement; pin toggle; reaction `IconButton` row
  (optimistic, rollback on error, no comments); close X (per-user dismiss); author `Avatar` + scope
  `Badge`.
- **QuickNotes**: sidebar/palette editor (`Input` title + `Textarea` body); local-first IndexedDB
  (instant save, no per-keystroke network), debounced/queued backend sync via the Offline Engine;
  pin to dashboard via the §4 `PinnedItems` pattern.
- **Complaint/feedback Form** (on Profile): `Form` (§1) with subject `Input` + body `Textarea` +
  submit `Button` → opens DM to HR/Admin + creates a high-priority `notifications` row.

## New ADRs
None. All stable contracts (Reverb, Offline Engine, conflict model, Sanctum) are pre-existing.
