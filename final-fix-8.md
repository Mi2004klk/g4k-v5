# final-fix-8.md — Production Crash Recovery & Complete Wiring/Revamp Master Plan

> **Status: CRITICAL production failure.** The live app is unusable. This doc is built from the **actual live
> error log** + code verification (not assumptions). It diagnoses the *real* root causes, prescribes the exact
> fixes, and gives the full plan to make the app genuinely work end-to-end.
>
> **Doc only — no implementation this turn.**
>
> **Live evidence (from the attached console log):**
> - CORS blocks `POST /api/auth/login` from `g4k-v4-…-naval-treasure-group.vercel.app`.
> - **Every authenticated endpoint returns HTTP 500**: `/api/dashboard/init`, `/me/capabilities`,
>   `/notifications`, `/notifications/unread-count`, `/announcements`, `/attendance/me/history`,
>   `/attendance/me/today`, `/tasks/submitted`, `/auth/preferences`.
> - React crash: `Slot failed to slot onto its children` in `Widget-upcoming-holidays` + a generic `Widget`.
> - WSS fails: `wss://g4k-api-579515345084.asia-south1.run.app/app/g4k_reverb_key`.

---

## PART 0 — THE REAL DIAGNOSIS (evidence → root cause)

The symptoms are severe but they collapse to **5 compounding root causes**. Fix them in order and the app
recovers.

### RC-1 — Backend is in a boot-level (or auth-group) failure: every authenticated route 500s  🔴 PRIMARY
**Evidence:** 500 on `/me/capabilities`, `/dashboard/init`, `/notifications`, `/announcements`,
`/attendance/me/*`, `/tasks/submitted`, `/auth/preferences`.
**Why this is THE primary failure:** almost every user-reported symptom is downstream of it:
| User symptom | Downstream of |
|---|---|
| "Admin sees only Dashboard / My Attendance / Announcements" | `/me/capabilities` 500 → frontend can't resolve capabilities → falls back to the **most-restricted (employee) nav** |
| "Admin still sees the Time Clock widget" | `/me/capabilities` + `/dashboard/init` 500 → role unknown → employee widgets render |
| "Role: Employee badge even as Admin" | `active_role` can't be fetched (dashboard/init 500) → defaults to `Employee` |
| "Every widget shows Retry" | the endpoints 500 + the Slot crash (RC-2) |
| "notification area inaccessible" | the Slot crash (RC-2) in the bell |

**Probable cause (verify against logs):** a **fatal error in a recently-added boot-referenced class** that
runs on every request. `AppServiceProvider::boot()` registers (unguarded):
`TaskCompleted` event, `PostTaskCompletionToGlobalChat` + `LeaveAttendanceIntegration` +
`ProcessApprovalDecision` listeners, `NotificationObserver`, and 4× `CacheInvalidationObserver`. If any of
these classes (or `SmtpSettings`, `HrScope`) has a typo / missing dependency / references a **column or table
that doesn't exist in the prod DB because the new migrations didn't run** (`password_changed_at`,
`personal_access_tokens.user_agent`, `approvals.redo/feedback`, `holidays.type`, `department_hr`), the app
fails to boot → 500 on everything (including the login preflight, see RC-3).

**`ForcePasswordChange` is already disabled** (commented body) → **not** the cause. `SmtpSettings::apply()` is
try/caught + `Schema::hasTable`-guarded → low risk but still verify.

### RC-2 — `Button asChild` is broken (Radix Slot single-child violation)  🔴 CONFIRMED IN CODE
**Evidence:** `Slot failed to slot onto its children. Expected a single React element child` in
`Widget-upcoming-holidays` and a generic `Widget`.
**Root cause (verified, `packages/ui/src/components/button.tsx`):** the `Button` component always renders
`{isLoading ? <div className="absolute inset-0 …"><DotLoader/></div> : null}` AND `<span>{children}</span>`
as the children of `Comp`. When `asChild=true`, `Comp = Slot` → **Slot receives the loader wrapper + the span
as multiple/indirect children**, violating Radix Slot's single-direct-child rule. Every
`<Button asChild><Link>…</Link></Button>` crashes. Confirmed crash sites:
- `upcoming-holidays-widget.tsx:35` (`<Button asChild><Link>View All <ChevronRight/></Link>`)
- `notifications-bell.tsx:339` (`asChild` → the "notification area inaccessible" crash)
- `pending-approvals-widget.tsx:145` (`Button asChild`)
- any other `<Button asChild>` across the app
This single bug is why widgets render the ErrorBoundary "Retry" fallback and the notifications area is dead.

### RC-3 — CORS is mostly a *symptom* of RC-1 (error responses carry no CORS headers)  🟠
**Evidence:** login preflight blocked — "No Access-Control-Allow-Origin header."
**Fact:** `config/cors.php:28` regex `#^https://.*\.vercel\.app$#` **does match** your preview domain, so CORS
is *configured* correctly. The preflight returns no ACAO because **the OPTIONS/reqquest returns a 500** (RC-1)
and Laravel's CORS middleware doesn't add headers to error responses. Once RC-1 is fixed, CORS will work.
**Residual real issue (fix anyway):** under FrankenPHP/Octane the **OPTIONS preflight may not reach Laravel's
CORS middleware** (flagged back in fix-13 §2.1c) — so an explicit OPTIONS/CORS guarantee is needed regardless.

### RC-4 — Reverb is not deployed as its own service + frontend env unset  🟠
**Evidence:** `wss://g4k-api-579515345084.asia-south1.run.app/app/g4k_reverb_key` — (a) WSS hits the **API**
host (no `/app/` route there), (b) `g4k_reverb_key` is the **literal fallback** in `use-reverb.ts`, meaning
`NEXT_PUBLIC_REVERB_APP_KEY` is not set on Vercel. Realtime is completely dead.

### RC-5 — Deploy disconnect: latest committed code is NOT what's live  🔴
**Evidence:** working tree is clean (all final-fix-1…7 work is committed), yet the live preview still shows
the **old gradient UI** + the broken backend. The live Vercel + Cloud Run builds are **not the latest
commit** (not pushed, Cloud Build built a stale/broken image, or the build failed silently) AND/OR the prod
DB hasn't run the new migrations. **Even perfect code won't help until it's actually deployed + migrated.**

---

## PART 1 — IMMEDIATE TRIAGE (restore service — do this FIRST, in order)

> Goal: get login + dashboard working for one admin + one employee before anything else.

- ✅ **T1 — Read the real error.** Fetch the Cloud Run stack trace:
      `gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --region=asia-south1 --limit=50 --format=value(textPayload)`.
      Confirm whether it's a **boot fatal** (whole app 500s incl. login preflight) or an **auth-group-only**
      500. This single read tells you RC-1's exact line.
- ✅ **T2 — Run migrations on the prod DB.** `php artisan migrate --force` inside the Cloud Run revision
      (or a one-off Job). Many of the new endpoints touch new columns (`password_changed_at`,
      `personal_access_tokens.user_agent`, `approvals.feedback`, `holidays.type`, `department_hr`). If a
      migration is missing, this is the 500.
- ✅ **T3 — Fix the boot fatal.** From T1's stack trace: correct the offending class (most likely a
      recently-added event/listener/Support class with a typo/missing dep, or a model querying a missing
      column). Re-deploy. Confirm `/api/ping` and `/api/auth/login` return 200 (not 500).
- ✅ **T4 — Fix the `Button asChild` Slot bug** (Part 2.1). Re-deploy frontend. Confirm widgets render
      (no "Slot failed") and the notifications bell opens.
- ✅ **T5 — Guarantee CORS on preflight** (Part 2.2). Confirm login from the Vercel domain succeeds with no
      CORS error.
- ✅ **T6 — Deploy the latest commit to BOTH remotes** and confirm the deployed SHA matches `git rev-parse
      HEAD` on each. Confirm Vercel rebuilt + Cloud Build succeeded (green) for that SHA.
- [ ] **T7 — Re-test the admin path:** login → `/me/capabilities` 200 → sidebar shows full admin nav → no
      Time Clock widget → dashboard/init 200 → no "Role: Employee" badge. If any still fails, RC-1 isn't
      fully fixed — back to T1.

---

## PART 2 — ROOT-CAUSE CODE FIXES (exact)

### ✅ 2.1 `Button asChild` (definitive fix) — `packages/ui/src/components/button.tsx`
Rewrite so `asChild` clones the user's single child directly (no span/loader interposing inside `Slot`):
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    // asChild: the consumer's element (e.g. <Link>) is the SINGLE child — no wrapper, no loader inside Slot.
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))}
              ref={ref as any} {...props}>
          {children}
        </Slot>
      );
    }
    // normal button: keep loader + span wrapper
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref}
              disabled={isLoading || disabled} {...props}>
        {isLoading && <span className="absolute inset-0 flex items-center justify-center"><DotLoader/></span>}
        <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-0")}>{children}</span>
      </button>
    );
  }
);
```
- Keep `RainbowBorder` for **non-asChild primary** only (it wraps with extra elements → also breaks `asChild`).
- **Audit every `<Button asChild>`:** its child must be exactly ONE element (`<Link>…</Link>` is fine; the
  Link's own text+icon are OK because Slot only inspects *its* direct child). Fix `notifications-bell.tsx:339`,
  `pending-approvals-widget.tsx:145`, `upcoming-holidays-widget.tsx:35`, etc.

### ✅ 2.2 CORS preflight guarantee
- Ensure Laravel's `HandleCors` runs on **OPTIONS** too. Add (or confirm) `\Illuminate\Http\Middleware\HandleCors`
  in the **global** middleware stack in `bootstrap/app.php` (`->withMiddleware(... ->append(\Illuminate\Http\Middleware\HandleCors::class))`)
  — or rely on the framework default but verify it fires for OPTIONS under FrankenPHP.
- Add the **exact** production domain to `config/cors.php` `allowed_origins` (don't rely on regex alone):
  ```php
  'allowed_origins' => [
      env('FRONTEND_URL'),
      'https://g4k-v4-p24bp49v9-naval-treasure-group.vercel.app', // current live preview
      'https://<prod-domain>.vercel.app',
  ],
  ```
- Set `FRONTEND_URL` on the Cloud Run service to the real Vercel origin. Verify:
  ```bash
  curl -i -X OPTIONS https://<api>.run.app/api/auth/login \
    -H "Origin: https://<vercel>" -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: authorization,content-type,x-refresh-token"
  # expect: Access-Control-Allow-Origin: https://<vercel>  +  Access-Control-Allow-Credentials: true
  ```

### ✅ 2.3 Boot-500 diagnostic + fix (RC-1)
Candidates to inspect (in order of likelihood) using the T1 stack trace:
1. **Unrun migrations** (T2) → any model/service referencing a new column/table throws.
2. `app/Listeners/PostTaskCompletionToGlobalChat.php` — does it reference a `Conversation`/`Message` scope or
   column that exists? Does it `Chat`-post safely inside a try/catch?
3. `app/Events/TaskCompleted.php`, `app/Listeners/ProcessApprovalDecision.php`,
   `app/Observers/NotificationObserver.php`, `app/Observers/CacheInvalidationObserver.php` — fatals on load?
4. `app/Support/SmtpSettings.php` / `app/Support/HrScope.php` — do they reference settings/tables that exist?
5. A new **route** (`/tasks/submitted`, `/attendance/team-today`, `/attendance/admin/calendar`,
   `/settings/mail/*`) whose controller method throws (missing `user_id` handling, bad query).
- **Hardening:** wrap each `Event::listen`/`Model::observe` registration in `AppServiceProvider::boot()` in
  its own try/catch (log, don't crash boot) so one broken listener never takes down the whole app.

### ✅ 2.4 Reverb (RC-4)
- Deploy **Reverb as its own Cloud Run service** (`g4k-reverb`) on its own `*.run.app` domain
  (`php artisan reverb:start --host=0.0.0.0 --port=8080`; Cloud Run exposes `$PORT`).
- On **Vercel**, set all four: `NEXT_PUBLIC_REVERB_HOST=<reverb>.run.app`, `_PORT=443`, `_SCHEME=https`,
  `_APP_KEY=<real key>`. Same `REVERB_APP_ID/KEY/SECRET` on API + Reverb services.
- Until Reverb ships, `use-reverb.ts` already degrades gracefully if `NEXT_PUBLIC_REVERB_HOST` is unset —
  so at least the failed-WSS console noise stops.

### ✅ 2.5 Deploy pipeline (RC-5)
- **Push** the latest commit to both remotes; confirm Cloud Build + Vercel rebuild for that SHA.
- Ensure `cloudbuild.yaml` runs `php artisan migrate --force` on deploy (or a pre-deploy Job) — currently
  migrations only run in `start.sh` (per-instance); verify it actually ran on the prod revision.
- Add a deploy-time **smoke check** in `cloudbuild.yaml`: after deploy, `curl /api/ping` must be 200, else fail.

---

## PART 3 — ROLE / PERMISSION / NAV CORRECTNESS (after backend is up)

These currently misbehave *because* of RC-1; verify they're correct once 500s are gone, and harden them so a
future API failure degrades safely instead of showing the wrong role:
- [ ] **3.1** `/me/capabilities` must return the full capability set for the active role; the frontend
      `navGroups` filter (`dashboard/layout.tsx`) must use it. If the call fails, the UI must NOT silently
      fall back to "employee" — show a clear "Session/permissions could not load — retry" state instead.
- [ ] **3.2** `active_role` must come from the token ability + `/dashboard/init`, not a hardcoded default;
      the **"Role: Employee" badge must be removed entirely** (requirement) — and must never show the wrong
      role. Delete the badge element + its copy.
- [ ] **3.3** **Time Clock widget** is role-gated in `dashboard/page.tsx` (employee branch only). Confirm
      admin/HR branches don't register it; and gate it by capability, not just branch, so a stale layout
      can't surface it to admin.
- [ ] **3.4** Nav must reflect capabilities: admin sees Dashboard, Attendance, Projects, Tasks, Chat,
      Announcements, Leave, Reports, Directory, Employees, Team Attendance, Org Leave, Departments,
      Designations, Settings, Audit Log, Profile — not the 3-item employee set.

---

## PART 4 — FRONTEND/BACKEND WIRING COMPLETENESS (cumulative from final-fix-1…7)

Every endpoint the frontend calls must exist, be capability-gated, and return the shape the UI expects. Known
gaps to close (consolidated):
- [ ] **4.1** Task lifecycle: `POST /tasks/{id}/approve|redo` + `/tasks/submitted` shape; task-completion →
      Global Chat (final-fix-3 §1, §2).
- [ ] **4.2** Attendance: per-employee weekly/monthly graph (`/attendance/{admin,hr}/graph?user_id=`),
      continue-shift button, day-detail projects/tasks join (final-fix-4 §1/§5, final-fix-3 §5).
- [ ] **4.3** Leave: atomic leave→attendance sync (final-fix-5 §C.5); all-users leave history (final-fix-2 §5).
- [ ] **4.4** HR-managed departments pivot (`department_hr`) wired through `HrScope` (final-fix-2 §2/§3).
- [ ] **4.5** SMTP-via-Admin-Settings + not-configured guard (final-fix-1 §5/§6); `SmtpSettings` must not
      break boot (RC-1 candidate).
- [ ] **4.6** Directory: search by dept/designation, card phone, filter `type` fix, Send Message on profile
      (final-fix-4 §10).
- [ ] **4.7** Confirm every widget's query key + endpoint resolves to a real route; a 500 on any one must
      show that widget's error state, not crash siblings.

---

## PART 5 — UI/UX REVAMP & CONSISTENCY (fix the broken layouts)

Per final-fix-7 (Rainbow visual reskin, **no functional changes**) + the specific complaints:

### 5.1 Dashboard banner + role badge (explicit ask)
- [ ] **5.1a** Remove the dummy gradient banner entirely; replace with a **clean, purposeful section, black
      text only** (Nunito heading + a one-line subtitle on white/cloud surface — no gradient, no colored fill).
- [ ] **5.1b** **Remove the "Role: Employee" badge** completely (also fixes the wrong-role display).

### 5.2 Fix overlapping/broken layouts (root cause = mixed token use + Slot-crash fallbacks)
- [ ] **5.2a** After RC-2 (Button fix), re-test every dashboard — most "overlapping/missing spacing" is the
      ErrorBoundary fallback rendering half-broken widget frames.
- [ ] **5.2b** Standardize spacing via the 4px scale + `PageContainer` on all 23 pages (final-fix-5 §B1).
- [ ] **5.2c** Standardize radii (cards `rounded-2xl`, controls `rounded-xl`, CTAs pill) and surfaces
      (`bg-surface`/`bg-card`, not raw `bg-white`) — kills the inconsistent alignment.
- [ ] **5.2d** Responsive sweep at 360/414/768/1024/1280/1536 px; fix overflow + cramped columns; collapse
      filters to a sheet on mobile.

### 5.3 Component states (loading / empty / error)
- [ ] **5.3a** Every widget/list: proper `Skeleton` while loading, `EmptyState` (illustration + CTA) when
      empty, and a **per-widget error + Retry** when its own endpoint fails (must not blank the page).
- [ ] **5.3b** Add `error.tsx` to the ~22 dashboard routes missing one.

### 5.4 Design system (final-fix-7)
- [ ] **5.4a** Token-first reskin: ink `#0f101a` on white + cloud-gray, **tangerine/hot-pink CTAs**, **Nunito**
      display, pebble radii, inset-highlight elevation; keep semantic status colors + neutral focus ring.
- [ ] **5.4b** Remove every random/decorative gradient except the primary-button hover animated border; remove
      all `bg-gradient-brand` usages + the utility once auth heroes are switched to the Rainbow wash (auth only).

---

## PART 6 — PERFORMANCE & STABILITY

- [ ] **6.1** Single shared `useQuery(queryKeys.dashboardInit)` for all dashboard widgets (no per-widget
      `/dashboard/init` fetches — kills the duplicate 500 storm seen in the log).
- [ ] **6.2** Server-side filtering + pagination on attendance/leave/tasks (no client-side filtering of huge
      pages).
- [ ] **6.3** `keepPreviousData` on paginated/filtered queries so filters don't blank into skeletons.
- [ ] **6.4** Guard `AppServiceProvider::boot()` listeners/observers with try/catch (RC-1 hardening).
- [ ] **6.5** Confirm `LOG_CHANNEL=stderr` on Cloud Run so future 500s are visible in Cloud Logging (the
      diagnostic gap that made RC-1 hard to pinpoint).

---

## PART 7 — VERIFICATION MATRIX (do not call it "done" until green, per role)

Test each row as **Admin**, **HR**, and **Employee**:
- [ ] Login (email + employee ID) → correct dashboard for role; **no Role badge**; correct sidebar items.
- [ ] `/me/capabilities`, `/dashboard/init`, `/notifications`, `/announcements` all 200.
- [ ] No widget shows "Retry"; no `Slot failed` in console; notifications bell opens.
- [ ] No CORS errors; no failed WSS spam (Reverb fixed or gracefully off).
- [ ] Attendance: clock in/break/resume/out, live timer, day detail, history calendar.
- [ ] Leave: submit → correct routing (emp→HR, HR→admin) → approve/reject → attendance updated.
- [ ] Employee/Department/HR management: create/edit/deactivate/reset/activity-log all functional.
- [ ] Directory: search, card phone, Send Message DM.
- [ ] Responsive: all breakpoints, no overlap/overflow.
- [ ] Dark mode parity; focus-visible (neutral ring); reduced-motion honored.

---

## PART 8 — DEPLOYMENT & GO-LIVE GATE

1. **Fix RC-1…RC-5** (Parts 1–2) and confirm `/api/ping` + `/api/auth/login` + `/me/capabilities` are 200 on
   the live Cloud Run URL.
2. **Run migrations** on prod; **deploy latest SHA** to both remotes; confirm builds green + SHA matches.
3. **CORS preflight** returns ACAO for the Vercel origin (curl test in 2.2).
4. **Reverb** deployed as its own service (or gracefully off) with env set on Vercel.
5. Run the **Part 7 matrix** for all three roles on the live URL.
6. Only then promote to production.

---

## ROOT-CAUSE SUMMARY

| # | Root cause | Evidence | Fix | Part |
|---|---|---|---|---|
| **RC-1** | Backend boot/auth-group fatal → every authed route 500 | 500 on capabilities/init/notifications/announcements/attendance/tasks | read logs → fix offending boot class/migration → run migrations → harden boot with try/catch | 1.T1–T3, 2.3 |
| **RC-2** | `Button asChild` breaks Radix Slot (span+loader interpose) | "Slot failed to slot" in upcoming-holidays + Widget + bell | rewrite `Button` so asChild clones the single child directly | 2.1 |
| **RC-3** | CORS appears broken but is a symptom of RC-1 (errors carry no ACAO) + OPTIONS may bypass CORS under FrankenPHP | login preflight "No ACAO" though regex matches | fix RC-1 + guarantee HandleCors on OPTIONS + list exact domain | 2.2 |
| **RC-4** | Reverb not its own service + env unset | WSS to API host + literal `g4k_reverb_key` | deploy `g4k-reverb` + set 4 Vercel env vars | 2.4 |
| **RC-5** | Latest committed code not deployed; migrations maybe not run | live shows old UI despite clean tree | push + redeploy + run migrations + SHA check | 2.5 |
| **RC-6** | Wrong role/nav/Time-Clock/badge | downstream of RC-1 (capabilities 500) | fix RC-1 + 3.1–3.3 + remove Role badge | 3 |
| **RC-7** | Broken layouts / dummy gradient banner | mixed tokens + Slot-crash fallbacks + stale design | 5.1–5.4 | 5 |

> **Scope honesty:** the live outage is dominated by **RC-1 (backend 500), RC-2 (Button Slot bug), and RC-5
> (deploy disconnect)**. Fix those three and most symptoms vanish. The remaining parts (3–6) close the
> feature-wiring and visual-consistency gaps so the app is genuinely usable day-to-day. Because RC-1's exact
> line requires the Cloud Run `stderr` log, Part 1 starts with reading the log — that's the one fact I can't
> determine from code alone, and it must be step 1.
