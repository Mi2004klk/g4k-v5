# Phase 4 — Dashboard Framework & Widgets

## What
A role-aware Dashboard framework built on a self-contained Widget Engine, plus the three M1 role dashboards (Admin, HR, Employee). The Widget Engine renders widgets from declarative manifests with adaptive sizes, per-user drag/resize via React Grid Layout, independent loading, hover-refresh, dismiss, click-through, lazy-load, offline, and realtime channels. A generic, JSON-fed Metric Widget is built once and reused everywhere; module-specific widgets (attendance, projects, approvals, tasks) are stubbed now and plugged in during Phases 5–7. Implements R4.1–R4.9.

## Why
The dashboard is each user's home screen and the integration surface for every later module (attendance, leave, projects, chat). Building the framework first — with a single generic Metric Widget rather than bespoke widgets per metric (per Architecture Principle 4) — means Phases 5–8 only register widgets and data providers, no dashboard rework. Per-user layouts and independent widget loading keep the dashboard fast and personal; realtime + offline modes keep it correct under connectivity changes.

## Scope
- Widget Engine: registry, manifest schema (id/title/adaptive sizes/permissions/data-provider/refresh/lazy/realtime/settings), widget shell with drag/resize/collapse/refresh/lazy-load/offline/realtime.
- Adaptive rendering by size: small=metric · medium=metric+label+secondary · large=chart+stats+trend+actions.
- React Grid Layout dashboard container; layout persisted per user (API + Zustand); rearrange + resize across reloads.
- Independent per-widget loading with error isolation; refresh icon on hover; dismissible; clickable to navigate deeper.
- Generic Metric Widget (JSON-fed, configurable) reused across all dashboards.
- Admin dashboard widget set (R4.6): employees active/inactive, active projects, today attendance, pending approvals, recent activity feed, quick task assignment.
- HR dashboard widget set (R4.7): present/absent/late today, active projects, pending leave requests, pending submissions, quick task assignment.
- Employee dashboard widget set (R4.8): active projects, pending tasks, attendance widget (Start/Pause/End + live timer), recent task progress bar, task approval-status panel.
- Quick-action shortcuts on each dashboard (R4.9).
- Quick Task Assignment widget stub (wired fully in Phase 7).
- Realtime widget refresh via Reverb channels; offline mode renders last cached widget payload.

## Non-goals
- Real attendance/projects/leave data behind module widgets — those modules ship in Phases 5–7; widgets render from stub/seed data providers now and plug in live providers later.
- Live timer behavior beyond rendering the Employee attendance widget shell — full clock-in/out is Phase 5.
- Global Chat auto-notify on Quick Task Assignment completion — Phase 8 (widget action is stubbed).
- Announcement-board display on dashboard — Phase 8 (R8.12).
- New ADR — ADR-007 (React Grid Layout = dashboard only, dnd-kit = everything else) is respected, not changed.

## Phase / capability
Phase 4 of 11 · capability `dashboards` · depends on Phase 3. Implements R4.1–R4.9.

## ADRs
Depends on ADR-007 (React Grid Layout for dashboard widgets only — never mixed with dnd-kit), ADR-008 (TanStack Query = server state, Zustand = UI state only — layout is UI state), ADR-013 (Laravel Reverb for realtime). No new ADR.
