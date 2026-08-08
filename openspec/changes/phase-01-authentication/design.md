# Design — authentication

## Data model (new tables)
- `users` (extends Laravel default): `employee_id` (unique, nullable), `email`, `password` (hash), `designation_id` (fk, Phase 2), `department_id` (fk, Phase 2), `must_change_password` bool default true, `onboarded_at` timestamp nullable, `status` enum(active,inactive), `failed_login_count` int default 0, `locked_until` timestamp nullable, `last_login_at`, `avatar_url`, standard timestamps.
- `role_assignments`: `id`, `user_id`, `role` enum(super_admin,hr,employee), `created_at`. (Multiple rows per user = dual-role.)
- `auth_sessions`: `id`, `user_id`, `token_hash` (sha256 of Sanctum token), `device_name`, `device_meta` (json: ua/ip/last_seen), `last_used_at`, `created_at`, `revoked_at` nullable. (Mirrors Sanctum `personal_access_tokens` plus device metadata; we extend it.)
- `password_resets`: Laravel default + `channel` enum(smtp,admin), `approved_by` nullable, `approved_at` nullable.
- `login_attempts` (audit): `user_id`/`identifier`, `ip`, `success` bool, `created_at` — drives lockout + suspicious detection.

## API (OpenAPI additions)
- `POST /auth/login` → `{ identifier, password }` → 200 `{ token, requiresRoleSelection, mustChangePassword, user }` | 422/423 (locked).
- `POST /auth/role/select` → `{ role }` → binds this session's active role; returns dashboard route.
- `POST /auth/forgot-password` → `{ identifier, channel? }` → 202 (admin-channel queues Admin approval; smtp sends link).
- `POST /auth/reset-password` → `{ token, password }` → 200.
- `POST /auth/change-password` → `{ current, next }` (used for first-login + normal change).
- `GET /auth/sessions` → list devices; `DELETE /auth/sessions/{id}` remote revoke; `POST /auth/logout` current.
- All guarded by Sanctum except login/forgot/reset.

## Realtime
On remote logout, broadcast a `private-user.{id}` event `SessionRevoked` so the revoked client clears local state and signs out instantly.

## Offline
Login attempt while offline: the Offline Engine queues an `auth.login` op; on reconnect it replays and reconciles. Reset/change flows require connectivity (security). Local cached token persists so an already-authed user stays usable offline.

## Capabilities (introduced)
Auth endpoints are pre-capability (login/forgot/reset). Once authed, the active role attaches capabilities to the token. The matrix itself is authored in Phase 2; Phase 1 only defines the lookup mechanism (role → capability list) and the `require-capability` middleware.

## Security
- Argon2id password hash (Laravel default).
- Sanctum tokens are opaque, hashed-at-rest, with device name; rate-limited per IP + per identifier.
- Lockout: 5 failures / 10 min → `locked_until`; manual Admin override possible.
- Suspicious: new-device or new-geo login → notify HR/Admin (Phase 8 notification system; until then, an email is sent via SMTP and a row written for the audit log).
- First-login: `must_change_password=true` enforces the change screen before any other route.

## Test strategy
- Feature tests: login success/failure/lockout; reset (both channels); first-login forced change; role selection; remote revoke invalidates token; capability gate denies unauthorized.
- Web tests: sign-in form validation; role-select render; route guard redirect; offline-queue path.

## Performance Requirements (Phase 1)
- **Sign-in route LCP** ≤1.2s lab (logo preloaded, landscape logo optimized via next/image, FCP ≤1.2s). (R13.1)
- **Login latency**: `POST /auth/login` p95 ≤300ms; login button shows dot-loader + is disabled to prevent double-submit (R13.16). Optimistic transition to role-select/dashboard only after token received (login is NOT optimistic — security).
- **Cached navigation**: after auth, dashboard route prefetched on idle (likely next); role-select → dashboard ≤100ms cached first frame (R13.3).
- **Route guarding**: guards run synchronously from cached token; no full reload on unauthorized — instant redirect (R13.3/24).
- **Offline login** (R13.20): attempt queued in the Offline Engine; banner shown; replay on reconnect.
- **Bundle**: auth screens out of the lazy boundary only for the signed-out shell; all post-auth routes lazy-loaded (R13.8).
Frequent workflows: **sign in** (target ≤ the form submit, no extra clicks), **role select** (1 tap).

## Component mapping (Phase 1 — composes only from openspec/COMPONENT-SYSTEM.md)

This phase's screens compose exclusively from the FROZEN catalog. No new primitives are introduced
here (§10); a new primitive would require updating the frozen spec.

- **SignInCard** (§7 Auth & Profile) = `Card` with a brand-gradient hero background hosting a `Form`
  (§1): identifier `Input`, password `PasswordInput` with its show/hide `IconButton` (R1.2),
  `Button(primary)` with loading + disabled to prevent double-submit (R13.16), forgot-password
  `Link`, copyright line, and an info `Tooltip`. The button shows a dot-loader while
  `POST /auth/login` is in flight and the transition to role-select/dashboard happens only after the
  token is received — **login is NOT optimistic (security)**: nothing is committed to the UI until
  the server confirms identity.
- **RoleSelectGrid** (§7 Auth & Profile) = role `Button` cards for dual-role users, rendered after a
  successful login that returned `requiresRoleSelection`; selecting one calls
  `POST /auth/role/select`.
- **Forgot-password screen** = `Form` (identifier `Input`) + submit `Button` returning 202 (admin
  channel queues Admin approval; smtp sends a reset link). Requires connectivity.
- **Reset-password screen** = `Form` (token + new password `PasswordInput` + show/hide `IconButton`)
  + `Button`.
- **First-login change-password screen** (`must_change_password=true`) = `Form` (current
  `PasswordInput`, next `PasswordInput` with strength validation per R3.7) + `Button`; enforced as a
  route guard before any other route. The normal change-password flow (later, from Profile) reuses
  this same `Form`.
- **Onboarding welcome screen** = `Card` step sequence advanced by `Button`s (next/skip/finish);
  sets `onboarded_at` on completion.
- **Device / session list (Profile)** = `DataTable` (§3) listing `auth_sessions` (device name, meta,
  last-used) with a remote-logout `IconButton` per row → `AlertDialog` (§2) confirmation
  ("Are you sure?", Cancel + red Confirm) → `DELETE /auth/sessions/{id}`. On success the realtime
  `SessionRevoked` event forces the revoked client to clear state and sign out instantly.
- **Offline login attempt** = the `Form` still renders; the submit is queued by the Offline Engine
  with an `OfflineBanner` (§6) shown until reconnect replays the op. Reset/change flows require
  connectivity.

Loading/error affordances use the catalog foundations (§0): dot-loader Button states, field-level
`FormMessage` errors on a 400ms validation pause, and brand focus rings. Optimistic UI is reserved
for post-auth safe mutations in later phases — never on the auth path (security).

## New ADRs
None.
