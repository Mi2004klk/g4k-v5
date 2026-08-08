## Purpose
Provide realtime chat (four conversation types), notifications, announcements, quick notes, and a complaint/feedback channel for all three roles over Laravel Reverb, with offline support and capability-gated administration.

## ADDED Requirements

### Requirement: Global Chat
The system SHALL provide a Global Chat conversation that includes every user company-wide and is readable by all signed-in users. (R8.1)

#### Scenario: any user opens Global Chat
- **WHEN** any signed-in user opens the chat list
- **THEN** the Global Chat conversation is present and visible to them

#### Scenario: message broadcasts company-wide
- **WHEN** a user posts a message in Global Chat
- **THEN** every online user receives it in realtime via the presence-conversation channel and offline users receive it on reconnect

### Requirement: Project Chat
The system SHALL auto-create a Project Chat for every project, restrict membership to that project's team, and auto-post task alerts into it. (R8.2)

#### Scenario: project chat auto-created
- **WHEN** a new project is created (Phase 7)
- **THEN** a Project Chat conversation is created automatically and its team members are enrolled

#### Scenario: team-only access
- **WHEN** a user who is not a member of the project's team attempts to open its Project Chat
- **THEN** access is denied

#### Scenario: task alert auto-posted
- **WHEN** a task in the project is created, assigned, submitted, or approved (Phase 7)
- **THEN** an alert is auto-posted into that project's Project Chat by the system

### Requirement: Direct Chat
The system SHALL support 1:1 Direct Chat between any two users. (R8.3)

#### Scenario: start a direct chat
- **WHEN** a user selects another user (e.g. from the Employee Directory Send Message)
- **THEN** a Direct Chat conversation is opened or reused between them and messages deliver in realtime

### Requirement: Custom Group Chats
The system SHALL allow HR to create custom Group Chat conversations; employees SHALL see only the groups they have been added to. (R8.4)

#### Scenario: HR creates a group
- **WHEN** an HR user creates a Custom Group Chat and adds members
- **THEN** only the added members can see and open that group

#### Scenario: non-member cannot see a group
- **WHEN** an employee who was not added opens the chat list
- **THEN** that Custom Group Chat is not listed

### Requirement: @mentions
The system SHALL provide @mentions: typing `@` opens a dropdown of the conversation's members, selecting one notifies them with a message snippet. (R8.5)

#### Scenario: mention dropdown
- **WHEN** a user types `@` while composing a message
- **THEN** a dropdown of that conversation's members appears for selection

#### Scenario: mention notifies the target
- **WHEN** a message containing an @mention is sent
- **THEN** the mentioned user receives a notification carrying a snippet of the message

### Requirement: DM read receipts and pinned messages
The system SHALL show read receipts in Direct Chats and allow pinning messages (HR may pin in project chats). (R8.6)

#### Scenario: DM read receipt
- **WHEN** the recipient of a direct message opens and reads it
- **THEN** the sender sees a read-receipt indicator on that message

#### Scenario: HR pins a message in a project chat
- **WHEN** an HR user pins a message in a Project Chat
- **THEN** the pinned message is surfaced at the top of the conversation for all members

### Requirement: Read/unread state
The system SHALL mark conversations with a colored border and an unread count badge, and mark them read when the conversation is opened. (R8.7)

#### Scenario: unread indicator
- **WHEN** a conversation receives new messages while not open
- **THEN** it shows a colored border and an unread count badge in the list

#### Scenario: mark read on open
- **WHEN** a user opens an unread conversation
- **THEN** the border and badge clear and the messages are marked read

### Requirement: File and image sharing
The system SHALL allow file and image sharing with an image popup honoring format and size limits; employees SHALL attach links or directory references on task submission; full general-purpose file upload is deferred beyond M1. (R8.8, R11.3)

#### Scenario: image shared with limits
- **WHEN** a user shares an image in a chat
- **THEN** it opens in a popup and is rejected if it exceeds the configured format or size limit

#### Scenario: task submission as links
- **WHEN** an employee submits a task
- **THEN** they may attach links or a directory reference (not a full file upload)

### Requirement: Offline chat
The system SHALL show a "Not connected" indicator and queue outgoing messages while offline, delivering them on reconnect. (R8.9)

#### Scenario: offline indicator and queue
- **WHEN** a user loses connectivity while in chat
- **THEN** a "Not connected" indicator appears and any message they send is queued locally

#### Scenario: queued messages sync
- **WHEN** connectivity returns
- **THEN** queued messages are delivered in order and conflicts resolve by Timestamp

### Requirement: Notification system
The system SHALL provide a notification bell showing an unread count for high-priority and system-global notifications only, plus a history list and mark-as-read. (R8.10)

#### Scenario: bell shows unread count
- **WHEN** a high-priority or system-global notification targets a user
- **THEN** the bell displays an unread count badge

#### Scenario: mark as read
- **WHEN** a user opens the notification list or an individual notification
- **THEN** it is marked read and the count updates

### Requirement: Notification Center inside Chat
The system SHALL surface leave/task/project submissions, announcements, holiday reminders, and feedback/complaints inside a Notification Center within the Chat area. (R8.11)

#### Scenario: submission appears in Notification Center
- **WHEN** a leave/task/project submission or announcement is generated
- **THEN** it appears in the Notification Center inside Chat

### Requirement: Announcement board
The system SHALL provide an announcement board where Admin posts company-wide announcements and HR posts team-level announcements; announcements support pin and reactions only (no comments), a closeable dashboard display, and a notification on post. (R8.12)

#### Scenario: Admin company-wide announcement
- **WHEN** an Admin posts a company-wide announcement
- **THEN** every user sees it and receives a notification

#### Scenario: HR team-level announcement
- **WHEN** an HR user posts a team-level announcement
- **THEN** only that team's members see it and are notified

#### Scenario: reactions without comments
- **WHEN** a user reacts to an announcement
- **THEN** a reaction is recorded but no comment thread is created

#### Scenario: dashboard display closeable
- **WHEN** a pinned announcement is shown on a user's dashboard
- **THEN** the user may close it for themselves without unpublishing it

### Requirement: Quick Notes
The system SHALL provide private Quick Notes (sticky notes) that a user can pin to their dashboard and reach from the sidebar or command palette. (R8.13)

#### Scenario: create and pin a note
- **WHEN** a user creates a Quick Note and pins it to the dashboard
- **THEN** it appears on their dashboard and remains private to them

### Requirement: Complaint and feedback channel
The system SHALL provide a private complaint/feedback form on the Employee Profile that creates a Direct Message to HR/Admin and raises a high-priority global notification. (R8.14)

#### Scenario: employee submits feedback
- **WHEN** an employee submits the complaint/feedback form
- **THEN** a Direct Message is opened with HR/Admin and a high-priority notification is raised

### Requirement: Mobile chat UX
The system SHALL provide a mobile chat experience that is list-first, opens a conversation full-screen, keeps the input fixed above the keyboard, and returns to the list on back. (R8.15)

#### Scenario: mobile conversation flow
- **WHEN** a user on a mobile-width viewport taps a conversation
- **THEN** it opens full-screen with the input fixed above the keyboard and a back control returns to the list

### Requirement: Virtualized message history
The system SHALL render chat message history as a virtualized list that maintains a constant DOM node budget and 60 FPS while scrolling, even when a conversation contains thousands of messages. (R13.14, R13.12; P-VIRTUAL, P-RERENDER)

#### Scenario: large conversation stays smooth
- **WHEN** a conversation with 5000 messages is opened and the user scrolls its history
- **THEN** the rendered DOM node count stays at (visible + overscan) regardless of history length and scrolling holds 60 FPS

#### Scenario: append-only render on new message
- **WHEN** a new message arrives in the open conversation
- **THEN** only the appended message row mounts; existing rows are not re-rendered (verified by a render-count test)

### Requirement: Optimistic message send with rollback
The system SHALL insert an outgoing message into the visible thread instantly as a pending row, and roll it back with an error indicator if the send fails, without blocking the composer. (R13.19, R13.20; P-OPTIMISTIC, P-RETRY)

#### Scenario: instant insert on send
- **WHEN** a user sends a message
- **THEN** the message appears in the thread immediately as a pending row before the network resolves

#### Scenario: rollback on failure
- **WHEN** the send fails (network or server error)
- **THEN** the pending row is marked failed (retryable) and a danger toast is shown, with no duplicate delivered

#### Scenario: offline send queues and syncs
- **WHEN** a user sends a message while "Not connected"
- **THEN** it is queued locally, shown as pending, and delivered in order on reconnect with client-temp-id dedupe

### Requirement: Scoped realtime subscriptions with no render storms
The system SHALL subscribe to realtime channels only for the currently open conversation and the user's personal channel, unsubscribe on conversation switch, and coalesce inbound event bursts into single render flushes in high-traffic chats. (R13.26, R13.12, R13.10; P-MEM, P-RERENDER, P-CACHE-API)

#### Scenario: subscriptions are scoped and released
- **WHEN** a user switches from one conversation to another across a 20-screen navigation
- **THEN** no conversation channel subscriptions accumulate and no detached nodes are retained

#### Scenario: incoming message patches the cache
- **WHEN** a `MessageSent` event arrives for the open conversation
- **THEN** the relevant cached conversation data is patched (message appended) without triggering a refetch or re-rendering unrelated conversations

#### Scenario: event burst does not cause a render storm
- **WHEN** a burst of multiple messages arrives within a single frame in a high-traffic chat (Global or active project chat)
- **THEN** the inbound events are batched/throttled into a single render flush for that frame

### Requirement: Instant @mention filter and optimistic read/unread
The system SHALL filter the @mention dropdown from cached conversation members in under 50ms with no per-keystroke network call, and SHALL apply read/unread state changes optimistically. (R13.15, R13.19; P-SEARCH, P-OPTIMISTIC)

#### Scenario: instant mention filtering
- **WHEN** a user types `@` followed by characters to filter conversation members
- **THEN** the dropdown filters in under 50ms client-side from the cached member list, debounced, with no network request per keystroke

#### Scenario: optimistic mark-read on open
- **WHEN** a user opens an unread conversation
- **THEN** the colored border and unread count badge clear instantly before the read request resolves, and are restored with a toast if the request fails

### Requirement: Virtualized notifications with optimistic mark-read
The system SHALL render the notification history list as a virtualized list that holds 60 FPS at thousands of entries, and SHALL decrement the bell unread count optimistically when a notification is marked read. (R13.14, R13.19; P-VIRTUAL, P-OPTIMISTIC)

#### Scenario: large notification history stays smooth
- **WHEN** a user with 5000 notifications opens the bell history / Notification Center
- **THEN** the list renders with at (visible + overscan) DOM nodes and scrolls at 60 FPS

#### Scenario: optimistic bell count decrement
- **WHEN** a user marks a notification (or all notifications) read
- **THEN** the bell unread count (high + system priority) decrements instantly and is restored on error
