# Credentials Access Guide — what to give me so I can manage everything

> Gather these once, hand them over, and I'll manage all services, deployments, versions, and
> backups from the CLI after that. You will not be asked again.
>
> **Security rules:** create a fresh, scoped set for this project. Revoke after we're done if you
> like. Never reuse your personal broad-scoped tokens. Store the values in a password manager.

---

## 1. GitHub (version control, CI/CD, backups)
**What I'll do with it:** create the repo, push the monorepo, set up CI workflows, manage
release tags (rollback points), and configure branch protection.

- **Create a Personal Access Token (classic)**
  - URL: https://github.com/settings/tokens/new
  - Scopes: `repo` (full), `workflow`, `read:org`, `gist`
  - Expiration: 90 days (renewable)
- **Provide:**
  - `GH_TOKEN` = the token
  - `GH_OWNER` = your GitHub username (or org)
  - `GH_REPO` = preferred repo name (suggest `games4king-workplace-os`)
- **Optional but useful:** `gh` CLI installed — if so, I can use `gh auth login` with your token.

## 2. Supabase (PostgreSQL database + realtime)
**What I'll do with it:** create staging + prod Postgres projects, run migrations, manage
connection strings, enable automated backups/PITR, and later wire realtime.

- **Create a Project + access keys**
  - URL: https://supabase.com/dashboard → New Project (create TWO: `g4k-staging`, `g4k-prod`)
  - For EACH project, from *Project Settings → API* and *Database*:
- **Provide (per environment — staging AND prod):**
  - `SUPABASE_PROJECT_REF_<ENV>` = project ref (URL segment)
  - `SUPABASE_DB_URL_<ENV>` = full Postgres connection string
    (`postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
  - `SUPABASE_ANON_KEY_<ENV>` = anon public key
  - `SUPABASE_SERVICE_KEY_<ENV>` = service_role key (server-only)
  - Database password (the one you set at project creation)
- **Confirm:** automated backups enabled on prod (Dashboard → Database → Backups). Note your plan
  (Free=none, Pro=daily+PITR). Tell me which plan each project is on.

## 3. Railway (Laravel backend hosting + workers)
**What I'll do with it:** create the app, wire env vars, deploy `apps/api`, run the scheduler +
queue worker processes, and manage rollback via redeploy.

- **Create a Team + Project**
  - URL: https://railway.com → New Project (name: `g4k-workplace`)
  - Add a "Service" later via CLI / dashboard; for now I need an API token.
- **Provide:**
  - `RAILWAY_TOKEN` = a Project Access Token
    (Dashboard → the project → Settings → Tokens → Create, scope = this project)
  - `RAILWAY_TEAM` = team slug (if you created one)
- **Confirm:** your Railway plan (Hobby/Pro) — affects whether multiple long-running workers
  (queue + scheduler) run without sleeping. Tell me the plan.

## 4. Vercel (Next.js frontend hosting)
**What I'll do with it:** link the repo, deploy `apps/web`, manage preview + production env vars,
and use instant rollback.

- **Create a Team + Token**
  - URL: https://vercel.com → create a Team (e.g. `g4k`) if not present.
- **Provide:**
  - `VERCEL_TOKEN` = https://vercel.com/account/tokens (Create Token, scope = full account or the team)
  - `VERCEL_TEAM_ID` = team slug or ID (Dashboard → Settings → General → Team ID)
- **Note:** I'll link the GitHub repo to Vercel via CLI/`vercel link` once both exist.

## 5. SMTP (transactional email — password reset, lockout alerts, weekly reports)
**What I'll do with it:** send forgot-password links, suspicious-login alerts, the weekly Admin
summary report. Laravel's mailer needs an SMTP endpoint.

- **Recommended:** a transactional provider (Resend, Postmark, Amazon SES, or SendGrid) — NOT your
  personal Gmail, which will get rate-limited/blocked.
- **Provide:**
  - `MAIL_HOST`, `MAIL_PORT` (587 or 465), `MAIL_USERNAME`, `MAIL_PASSWORD`,
    `MAIL_FROM_ADDRESS` (e.g. `no-reply@games4king.in`), `MAIL_FROM_NAME` ("Games4King")
- If using Resend (simplest): `RESEND_API_KEY` and a verified sending domain.

## 6. Error monitoring (optional now, required by Phase 10)
**What I'll do with it:** wire Sentry (Laravel + Next.js) for production error tracking. Can
defer until Phase 10, but providing now lets Phase 0 ship with it from day one.

- **Provide (optional now):** `SENTRY_DSN_API`, `SENTRY_DSN_WEB`, `SENTRY_AUTH_TOKEN`,
  `SENTRY_ORG`, `SENTRY_PROJECT`.
- If deferring: just say "defer Sentry to Phase 10."

## 7. App config (I'll set defaults, confirm these)
- **Production domain** you intend to use for the web app (e.g. `workplace.games4king.in`).
  I'll configure this in Vercel + CORS + Sanctum stateful domains.
- **Backend API public URL** (e.g. `api.games4king.in` or Railway's domain).
- **Timezone** (your data says Asia/Kolkata — confirm).
- **Company info** is already in `Images, SVG, PDF/data-prefill-reference.txt`; I'll use that.

---

## How to hand them to me
1. Put everything in ONE file locally: `C:\Users\Founder Desk\3D Objects\Games4Kings-New\.env.local-secrets`
   (this file is gitignored — I will ensure it's never committed).
2. Tell me it's ready. I'll read it, configure each service, write the real per-environment
   `.env`s into Railway/Vercel (never into git), and delete the local secrets file's sensitive
   values once uploaded (keeping only the local-dev ones).

## What I will NOT do
- Touch any of your other repos, orgs, or projects.
- Commit secrets to git (pre-commit + CI guard will enforce this).
- Use broad personal tokens beyond this project.
- Push to production without CI green + a tagged rollback point.

## After handover
I'll manage: repo + branches + tags, CI, all deploys (staging→prod), migrations, backups, and
rollbacks. You review the running app at each phase's live URL; I handle the mechanics.
