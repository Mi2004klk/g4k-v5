# Deployment & Environment Guide

## Environments
| Environment | Frontend (Vercel) | Backend (Railway) | Database (Supabase) |
|---|---|---|---|
| Development | http://localhost:3000 | http://localhost:8000 | Postgres Local / Remote Dev |
| Staging | Preview Deployments | Staging Environment | Staging DB Project |
| Production | https://g4-k-web.vercel.app | Railway Production | Supabase Production Project |

## Rollback & Backup Procedures
1. **Supabase Postgres**: Automated daily snapshots + Point-In-Time-Recovery (PITR). Restore via Supabase Dashboard.
2. **Vercel Frontend**: Use `vercel rollback` or deploy previous commit instant rollback via Vercel Dashboard.
3. **Railway Backend**: Use Railway deployment history tab to instantly revert to previous release build.


## Required Production Environment Variables (Railway)
When deploying the Laravel API to Railway, ensure the following critical variables are set explicitly in the Railway Variables dashboard:

| Variable | Required Value | Description |
|---|---|---|
| `BROADCAST_CONNECTION` | `reverb` | Required to boot the WebSocket engine. If null, real-time events will fail silently. |
| `FILESYSTEM_DISK` | `s3` | Required to pipe binary uploads into Supabase Storage. Ephemeral local disk storage on Railway will be wiped on every deployment. |
| `MAIL_MAILER` | `smtp` | Required to send actual emails. `log` is used locally. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | *Your SMTP Credentials* | Required for Password Resets & Weekly summaries to function. |
| `REVERB_ALLOWED_ORIGINS` | `https://g4-k-web.vercel.app` | A comma-separated list of allowed domains for WebSockets to prevent hijacking. |


## Background Workers & Cron Scheduling (Railway)
Laravel requires background workers to process jobs (emails, exports, notifications) and a scheduler to run cron jobs (reminders, weekly reports). In Railway, these must run as independent services to avoid blocking the main web server.

### 1. Setup the Queue Worker Service
1. In your Railway project, click **New > GitHub Repo** and select this repository again.
2. Go to the new service's **Settings > Build** and ensure the Root Directory is `apps/api`.
3. Go to **Settings > Deploy** and set the **Start Command** to:
   ```bash
   php artisan queue:work --sleep=3 --tries=3 --max-time=3600
   ```
4. Copy all environment variables from the main Web service to this Worker service.

### 2. Setup the Cron Scheduler Service
1. In your Railway project, click **New > GitHub Repo** and select this repository again.
2. Go to the new service's **Settings > Build** and ensure the Root Directory is `apps/api`.
3. Go to **Settings > Deploy** and set the **Start Command** to:
   ```bash
   php artisan schedule:work
   ```
   *(Note: `schedule:work` runs locally in the foreground, triggering `schedule:run` every minute without needing a system cron daemon).*
4. Copy all environment variables from the main Web service to this Cron service.

## Performance Tuning
| Variable | Recommended Value | Description |
|---|---|---|
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Set to 10% (0.1) in production to avoid exceeding Sentry quotas and minimize performance overhead. |
