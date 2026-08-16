# Games4King Internal Hub (Phase 42)

The ultimate dashboard for internal management, providing a unified platform for Attendance, Leave Management, QA, Task Management, Live Chat, and Analytics.

## Technology Stack & Production Topology

- **Backend:** Laravel 13 + Octane (FrankenPHP)
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **Database:** Supabase (PostgreSQL 16)
- **Storage:** Supabase S3 (AWS SDK compatible)
- **Realtime:** Laravel Reverb (WebSockets on port 8080)
- **Infrastructure:**
  - API & Worker & Reverb: Google Cloud Run
  - Scheduler: Integrated with Queue Worker (`schedule:work`)
  - Frontend: Vercel
  - Cloud Logging: Native `stderr` logging exported automatically to Google Cloud

## Environment Matrix

Required Secrets and where they are configured:

| Secret | Location | Description |
|--------|----------|-------------|
| `APP_KEY` | Secret Manager / `.env` | Laravel Application Key |
| `DB_PASSWORD` | Secret Manager / `.env` | Supabase Postgres Password |
| `SUPABASE_JWT_SECRET` | Secret Manager / `.env` | JWT Secret for Auth / RLS |
| `SUPABASE_SERVICE_ROLE_KEY`| Secret Manager / `.env` | Service role key for backend overrides |
| `AWS_ACCESS_KEY_ID` | Secret Manager / `.env` | Supabase S3 Access Key |
| `AWS_SECRET_ACCESS_KEY` | Secret Manager / `.env` | Supabase S3 Secret Key |
| `REVERB_APP_KEY`/`SECRET`| Secret Manager / `.env` | WebSocket credentials |
| `NEXT_PUBLIC_PUSHER_APP_KEY`| Vercel Environment | Used by Frontend to connect to Reverb |

*Note: Avoid embedding ANY plain text secrets or GitHub PATs in source code, CI configs, or `.git/config`.*

## Deployment & Rollback

The application is deployed via Google Cloud Build (Backend) and Vercel (Frontend).

1. **Deploying Backend:** 
   Push to `main`. Cloud Build automatically triggers (`cloudbuild.yaml`) to build the Docker image, run migrations securely via a standalone container, and deploy the `g4k-api`, `g4k-worker`, and `g4k-reverb` services to Cloud Run.
2. **Deploying Frontend:** 
   Push to `main`. Vercel automatically builds and deploys the Next.js application.
   
   > [!IMPORTANT]
   > **Deployment Coupling (FE/BE)**: Since pushing to `main` triggers both Cloud Build and Vercel simultaneously, there is an implicit coupling between backend and frontend deployments. If you are introducing a breaking API change, you must stage your deployments: merge and deploy the backend changes first (while maintaining backward compatibility), and then merge the frontend changes that rely on them.

3. **Rollback:**
   - **Backend:** Navigate to Google Cloud Run -> select service -> "Revisions" -> traffic 100% to the previous revision.
   - **Frontend:** Navigate to Vercel -> "Deployments" -> click the vertical dots on the previous deployment -> "Promote to Production".

## Troubleshooting

- **Worker Liveness:** The `g4k-worker` runs a continuous `while true` loop invoking `queue:work` and `schedule:work`. If jobs are stuck, check Cloud Logging for the `g4k-worker` service to identify exceptions.
- **Broadcast/Realtime:** If WebSockets are failing, ensure `BROADCAST_CONNECTION=reverb` is active and that the `g4k-reverb` Cloud Run service is active.
- **Storage Issues:** Check that your Supabase S3 credentials are correct and the bucket `g4k` exists and is accessible.

## Local Development

```bash
# 1. Start backend
cd apps/api
composer install
php artisan serve
php artisan queue:work

# 2. Start frontend
cd apps/web
pnpm install
pnpm dev
```
