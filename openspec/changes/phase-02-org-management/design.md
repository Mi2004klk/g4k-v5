# Design — org-management

## Data model (new tables)
- `designations`: `id`, `name` (unique), `description` nullable, `status` enum(active,inactive), `sort_order`, timestamps; soft deletes (`deleted_at`).
- `departments`: `id`, `name`, `description` nullable, `head_user_id` (fk users, nullable = HR who manages it), `status` enum(active,archived), `code` (from numbering scheme), timestamps; soft deletes.
- `teams`: `id`, `department_id` (fk), `name`, `lead_user_id` nullable, `status`, timestamps; soft deletes.
- `users` (extensions to Phase 1 `users`): `department_id` (fk nullable), `team_id` (fk nullable), `designation_id` (fk nullable), `phone` nullable, `reports_to` (fk users nullable), `employee_code` (from numbering scheme, unique), `avatar_url`, `profile_visibility` json (which fields are public), timestamps. Phase 1 already holds `employee_id`, `status`, lockout, `must_change_password`.
- `role_assignments` (Phase 1 table, extended in use): rows now drive capability resolution. One row per (user, role).
- `capabilities`: `id`, `key` (e.g. `users.create`, `departments.manage`, `directory.view`), `description`, `group`. Seed-driven, not user-editable.
- `role_capabilities`: `role` enum(super_admin,hr,employee), `capability_key` — the matrix. Composite PK. This is the single source the middleware reads.
- `audit_logs`: `id`, `actor_user_id`, `action` (e.g. `user.create`, `designation.update`), `entity_type`, `entity_id`, `before` json, `after` json, `ip`, `user_agent`, `created_at`. Append-only. Indexed on actor + entity + created_at.
- `numbering_schemes`: `id`, `entity` enum(company,employee,department,...), `prefix`, `start_at` int, `length` int (zero-pad), `suffix` nullable, `format` (template, e.g. `{prefix}{seq}{suffix}`), `next_seq` int, `increment` int default 1, timestamps. Generation is atomic (row lock / `next_seq` update).
- `directory_view`: a DB view (or materialized view refreshed on org change) joining `users` + `designations` + `departments` + `teams`, exposing only public-profile columns, used by the directory list endpoint. Keeps the list query fast and virtualization-friendly.

## API (OpenAPI additions)
All endpoints are Bearer-guarded and capability-gated.
- `GET/POST /users` (HR: `users.hr.manage`; Employee: `users.employee.manage`) — list (paginated, filterable) + create.
- `GET/PUT/DELETE /users/{id}` — read / update / soft-delete; `PATCH /users/{id}/status` activate/deactivate; `POST /users/{id}/reset-password`; `GET /users/{id}/activity` activity log.
- `POST /users/{id}/roles` / `DELETE /users/{id}/roles/{role}` — assign/revoke system role (drives dual-role + Role Selection).
- `POST /users/import` (multipart) / `GET /users/export` — bulk import/export (master-data pattern).
- `GET/POST /departments` (Admin only: `departments.manage`); `GET/PUT/DELETE /departments/{id}`; `PATCH /departments/{id}/archive`; `GET /departments/{id}/members`.
- `GET/POST /teams`; `GET/PUT/DELETE /teams/{id}` (Admin only via `departments.manage`).
- `GET/POST /designations` (Admin: `designations.manage`); `GET/PUT/DELETE /designations/{id}`; `PATCH /designations/{id}/status`.
- `GET /directory?q=&dept=&designation=&view=&page=` — directory list; `GET /directory/{id}` public profile.
- `GET/PUT /me` — own profile; `POST /me/photo` (multipart, validated); `POST /me/change-password`.
- `GET/PUT /settings/numbering-schemes/{entity}` — read/edit auto-numbering (Admin: `settings.manage`).
- Capabilities self-describe: `GET /me/capabilities` returns the active role's capability list (frontend uses it only to render).

## Realtime
- Presence/online status: a `presence` channel keyed by user id; heartbeat from web sets an online flag (TTL in cache); Directory + Profile reflect it. No new infra — Reverb presence channel.
- Org-change broadcasts: on create/update/delete/role-change of a user, department, team, or designation, broadcast a `private-org` event (e.g. `UserUpdated`, `DepartmentChanged`) so Directory and member lists refetch. Role changes also push a `private-user.{id}` `RolesChanged` event so the affected user reloads their capabilities.

## Offline
- Conflict strategy for HR/people data = **Server Wins** (per ADR-009). Directory and profile reads are cached in IndexedDB so the directory is browsable offline.
- Writes (create/edit account, dept, designation) are queued by the Offline Engine and replayed on reconnect; on conflict the server's version wins and the client reconciles, surfacing a toast. Numbering-scheme ID generation happens server-side only, so queued creates are finalized with their real ID at sync time.

## Capabilities (matrix content)
Authored in `role_capabilities` seed and resolved by the `require-capability` middleware.
- **super_admin**: all keys, including `users.hr.manage`, `users.employee.manage`, `departments.manage`, `designations.manage`, `directory.view`, `settings.manage`, `audit.view`.
- **hr**: `directory.view`, `users.employee.read`, `directory.send-message`, plus later-phase ops (projects/tasks/leave/attendance oversight) — org-management scope adds directory + employee read only.
- **employee**: `directory.view`, `directory.send-message`, `me.update` (own profile). No user/dept/designation management.

## Test strategy
- api feature tests: capability gate denies unauthorized on every org endpoint; HR CRUD (create/edit/reset/deactivate/activity); Employee CRUD (create/edit/dual-role/reassign/deactivate/activity); Department CRUD admin-only + member list + archive; Team CRUD; Designation CRUD; auto-numbering generates + advances + edits; master-data import/export/search/paginate; directory search + public profile; profile edit + photo validation + change password; device revoke from profile.
- Web tests: directory grid/list + search + virtualization; profile + photo popup format/size; routing guards by capability; offline queue of an account edit + server-wins reconciliation.

## Performance Requirements (Phase 2)
> Non-functional additions on top of the functional design above. Cite R13.x (mirrors P-* standards)
> and R2.x. Nothing here weakens any functional requirement; it adds measurable targets.

### API & database (list endpoints)
- **List latency**: `GET /users`, `GET /directory`, `GET /departments`, `GET /departments/{id}/members`,
  `GET /designations`, `GET /teams` MUST hit p95 ≤ 200ms (read) at 10k rows; writes ≤ 300ms p95. (R13.4 / P-API-P95)
- **Cursor pagination**: all list endpoints MUST use cursor pagination (default 20, options 50/100), never
  OFFSET, so deep pages stay stable. (R13.6 / P-CURSOR)
- **Query budget**: every list endpoint MUST execute ≤ 5 SQL queries per request regardless of row count,
  with zero N+1 (eager-load `designation`, `department`, `team`, `role_assignments` on the list query). (R13.5 / P-NO-N1/Q-COUNT)
- **Indexes**: composite indexes on the common filter combinations —
  `users(department_id, status)`, `users(designation_id, status)`, `users(status, employee_code)`,
  `role_assignments(user_id, role)`, `departments(status)`, `directory_view` exposed columns — covering
  every WHERE/JOIN/ORDER BY path. (R13.6 / P-INDEX)
- **Fast directory list**: the `directory_view` (DB/materialized view joining users + designations +
  departments + teams) keeps the directory list query to a single indexed read with no per-row joins. (R2.10, R13.5)

### Frontend rendering
- **Virtualization**: the Employee Directory and the Admin user-management tables MUST be virtualized
  (`@tanstack/react-virtual`) once > 100 rows; DOM nodes capped to visible + overscan, 60 FPS at 5000 rows. (R13.14 / P-VIRTUAL, R11.5)
- **Memoized rows**: directory cards and table rows are `React.memo`'d with stable keys (`employee_code`/id);
  no anonymous callbacks/objects in props on hot lists; TanStack Query `select` for derived data. (R13.12 / P-RERENDER)
- **Reusable table**: the master-data table component is the single reusable list primitive for
  designations/departments/teams/users (no duplicated fetch logic). (R13.13 / P-COMP)

### Caching
- **Per-entity staleTime** (R13.10 / P-CACHE-API/SRV):
  - `designations`, `departments`, `teams`, `numbering-schemes` → `staleTime: 5min` (rarely change; reference data).
  - `directory` → `staleTime: 30s` (changes more often).
  - Backend query/OPcache cache for hot reference data (designations, departments, numbering schemes).
- **Invalidation on mutation**: every create/update/delete/status/role/archive mutation busts the
  affected cache keys (and relies on the `private-org` realtime broadcast to refetch peer views). (R13.10)

### Search & filtering
- **Debounced server-side search**: directory + master-data search is debounced 250ms and run
  server-side; client-side filter only on ≤ 200 already-loaded rows. (R13.15 / P-SEARCH)
- **No-reload filters**: changing a search term, dept/designation filter, or view toggles updates the URL
  + cache in place — no full route reload, no spinner for cached data. (R13.3/15 / P-NAV/SEARCH)

### Background processing
- **Bulk import/export offloaded**: `POST /users/import` and `GET /users/export` (and the same pattern for
  designations/departments) MUST run on a Laravel queue when the job is > 500ms; Excel/streaming export is
  produced by a queued job with a download-ready notification, never a long PHP request. (R13.17 / P-QUEUE)
- **Heavy client work**: xlsx parse/preview in the import flow runs in a web worker or is chunked (no
  blocking task > 50ms). (R13.17 / P-ASYNC-FS)

### Photo upload
- **Profile photo popup**: the selected image is shown via `next/image` with an optimistic preview before
  upload completes; stored avatar ≤ 256px (displayed ≤ 96×96); on error the preview rolls back with a
  danger toast. (R13.9 / P-IMG, R13.19 / P-OPTIMISTIC)

### Auto-numbering
- **Server-side caching**: the active `numbering_schemes` are cached server-side (rarely change); only
  the atomic `next_seq` increment hits the row. (R13.10 / P-CACHE-SRV)

### Frequent workflows (click / latency budgets)
- **Search the Employee Directory** — target server result < 300ms (debounced 250ms + ≤200ms p95 read),
  results render from cache instantly; ≤ 2 clicks from dashboard to first result. (R13.15/24 / P-SEARCH/DATAENTRY)
- **Create a user (HR or Employee)** — reachable in ≤ 2 clicks from the dashboard; the create form fits in
  ≤ 2 screens (single sectioned drawer), submits with a disabled+loader button (no double submit), and
  returns to the list with the new row visible without a full reload (optimistic + cache invalidation). (R13.24 / P-DATAENTRY, R13.16 / P-FORM)
- **Assign / reassign department (and team)** — available inline on the user row and as a bulk
  multi-select action; applies optimistically and rolls back on error; no full reload. (R13.24 / P-DATAENTRY, R13.19 / P-OPTIMISTIC)

## Component mapping (Phase 2 — composes only from openspec/COMPONENT-SYSTEM.md)

This phase's screens compose exclusively from the FROZEN catalog; no new primitives are introduced
(§10).

- **User management (HR "employees" + Employee "users" lists; same for designations / departments /
  teams master data)** = the generic **`DataTable`** (§3) — virtualized above 100 rows (R13.14),
  cursor pagination, sortable columns, row selection — with the shared **`FilterBar`** (§5) above it
  (debounced 250ms search `Input`, dept/designation `Combobox`, status multi-`Checkbox` popover,
  sort `Select`). Each row carries a **`DropdownMenu`** (§2) of actions: edit, delete (soft),
  activate/deactivate, reset-password. This is the single reusable master-data list primitive
  (R13.13) — never duplicated per entity type.
- **Create / edit UserForm** (§7 People & Org) = `Dialog` (§2) hosting a sectioned `Form` (§1):
  identity, contact, role `Checkbox` group for dual-role assignment, department/team `Combobox`
  (searchable, server-debounced), designation `Select`, profile photo via the `FileUpload` popup
  (R11.3) with optimistic `next/image` preview and a rollback danger `Toast` on error. Submit
  `Button` is disabled + loader to prevent double-submit.
- **DepartmentCard** (§7 People & Org) = name, description, member `AvatarGroup`, HR count, with
  edit/delete/archive in a `DropdownMenu` (destructive items rendered red).
- **EmployeeDirectory** (§7 People & Org) = `DirectoryCard` (grid) / `DirectoryRow` (list),
  virtualized. Each card = `Avatar` + name + designation + dept `Badge` + contact (if visible) +
  "Send Message" `Button` → Direct chat stub (chat itself lands in a later phase). The header
  `FilterBar` search `Input` is debounced 250ms and runs server-side (client-side filter only
  ≤200 rows). Presence/online status reflects the Reverb presence channel.
- **Profile screen** = **`ProfileForm`** (§7) for own profile (`GET/PUT /me`, photo `FileUpload`
  popup), plus a device `DataTable` (sessions) with remote-logout `IconButton` → `AlertDialog`
  confirm, plus a change-password `Form`, plus a complaint `Form`. **Inline edit (pencil on hover)**
  on name fields uses the `DataTable` inline-edit affordance → Enter saves / Esc cancels + `Toast`.
- **Destructive actions** (delete / deactivate / reset) are confirmed via `AlertDialog` (§2): title
  "Are you sure?", Cancel + red Confirm. Success/error surfaces as a `Toast` (§6, Sonner).
- **Bulk import / export** = `FileUpload` for the import file (web-worker/chunked xlsx parse) and a
  queued export `Button` → download-ready notification `Toast`.

All list/search state updates the URL + cache in place with no full reload (R13.15); rows are
`React.memo`'d with stable keys (`employee_code`/id, R13.12); the reusable `DataTable`/`FilterBar`
are never duplicated per master-data type (R13.13).

## New ADRs
None. Relies on the capability-based permissions principle (architecture §5.3), ADR-009 (per-entity conflict: HR = Server Wins), ADR-010 (shared Offline Engine), and ADR-014 (active role on Sanctum token).
