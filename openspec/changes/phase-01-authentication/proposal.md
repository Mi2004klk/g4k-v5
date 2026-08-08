# Phase 1 — Authentication & Sessions

## What
Full sign-in experience for all three roles: branded sign-in screen, dual-role selection, forgot-password (SMTP + Admin-approval), account lockout, first-login password change, onboarding welcome, per-device session management, and capability-gated route guards. Implements R1.1–R1.13.

## Why
Every module depends on authenticated, role-aware access. This phase establishes the security boundary (lockout, suspicious-login alerts, device revocation) and the role-selection UX that powers the entire permission model.

## Scope
- Branded sign-in screen (landscape logo, welcome copy, copyright, info tooltip) with email/Employee-ID + password, show/hide toggle, loading + error states.
- Sanctum Bearer token issuance + per-device session tracking + remote/current logout.
- Role Selection screen for dual-role users.
- Forgot-password: SMTP reset link + in-app Admin-approval path.
- Account lockout after 5 failed attempts / 10 min; suspicious-login Admin/HR alert.
- Force password change on first login.
- Onboarding welcome screen on first login.
- Auth-aware routing + capability-gated route guards (frontend + backend).
- Responsive sign-in; offline login-attempt queue + sync.

## Non-goals
- User/dept/designation management UI (Phase 2).
- Capability matrix content beyond auth needs (Phase 2 extends it).
- Any dashboard content (Phase 4).

## Phase / capability
Phase 1 of 11 · capability `authentication` · depends on Phase 0. Implements R1.1–R1.13.

## ADRs
Depends on ADR-014 (Sanctum Bearer). No new ADR.
