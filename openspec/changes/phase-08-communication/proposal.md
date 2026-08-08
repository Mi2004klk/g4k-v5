# Phase 8 — Chat & Notifications

## What
Realtime communication layer for all three roles: four chat types (Global, Project, Direct, Custom Group), @mentions, DM read receipts, pinned messages, read/unread tracking, file/image sharing, and offline chat. Plus a standalone notification system (bell + history + Notification Center inside Chat), announcement board (company-wide and team-level), private Quick Notes, an employee complaint/feedback channel, and a mobile-first chat UX — all over Laravel Reverb. Implements R8.1–R8.15.

## Why
Chat and notifications are the connective tissue of the platform: task submissions, leave approvals, project alerts, and announcements all surface here. This phase delivers the realtime transport (Reverb), the conflict model for chat (Timestamp §9), the offline message queue, and the notification framework that Phases 5–7 already reference (suspicious-login alerts, leave/task/project approvals, holiday reminders). It is also the primary collaboration surface for a distributed media-production team.

## Scope
- Four conversation types: Global (company-wide), Project (auto-created on project create, team-only, task-alert auto-posts), Direct (1:1), Custom Group (HR-created; employees see only groups they're added to).
- @mentions with a member dropdown and snippet notification; DM read receipts; pinned messages (HR in project chats).
- Read/unread tracking: colored border + count badge; marked read on open.
- File/image sharing with a popup honoring format + size limits; task submissions attach links/directory; full file upload deferred to M2.
- Offline chat: "Not connected" indicator + IndexedDB message queue synced on reconnect (Timestamp conflict strategy).
- Notification system: bell with unread count for high-priority + system-global notifications only; history; mark-as-read.
- Notification Center (inside Chat): leave/task/project submissions, announcements, holiday reminders, feedback/complaints.
- Announcement board: Admin posts company-wide / HR posts team-level; pin; reactions only (no comments); dashboard display is closeable; notify on post.
- Quick Notes: private sticky notes, pinnable to dashboard, reachable from sidebar and command palette.
- Complaint/feedback channel: private form on Profile → DM to HR/Admin + high-priority global notification.
- Mobile chat UX: list-first, full-screen conversation, fixed bottom input above keyboard, back-to-list.

## Non-goals
- Full general-purpose file attachment system (deferred to M2, ADR per R11.3 / R12).
- Comment threads on announcements (reactions only).
- Voice/video calls or screen sharing.
- Message search across history (area-specific search only in M1; global search deferred).
- Translation / multi-language chat (i18n deferred).
- AI features (summarization, smart replies) — out of M1 per ADR-017.

## Phase / capability
Phase 8 of 11 · capability `communication` · depends on Phase 2 (users/org/capabilities) + Phase 3 (app shell, design system, sidebar, command palette). Implements R8.1–R8.15.

## ADRs
Depends on ADR-013 (Laravel Reverb on Railway — private/presence/public channels), ADR-009 (per-entity conflict; chat = Timestamp), ADR-010 (single shared Offline Engine), ADR-014 (Sanctum Bearer). No new ADR.
