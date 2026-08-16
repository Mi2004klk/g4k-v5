# Games4Kings Workplace OS - Go-Live Runbook

## 1. Environment Configuration Validation
- [ ] Ensure `apps/web/.env` is fully populated based on `.env.example`.
- [ ] Verify `NEXT_PUBLIC_API_URL` points to the production Cloud Run URL.
- [ ] Ensure Reverb / WebSockets environment variables match production.
- [ ] Ensure `apps/api/.env` contains production database credentials.
- [ ] Verify APP_KEY is set in `apps/api/.env`.

## 2. Database & Migrations
- [ ] Run production migrations: `php artisan migrate --force`.
- [ ] (Optional) Provision the initial super admin: `php artisan db:seed --class=SuperAdminSeeder`
- [ ] Verify `users` table contains the expected schema constraints.

## 3. QA & Smoke Testing
- [ ] Provision the QA smoke-test credential: `php artisan qa:provision` (Creates `test@games4kings.com` / `password123`).
- [ ] Log in via the web client using the QA credential.
- [ ] Navigate to **Dashboard**, **Projects**, and **Team Attendance** to ensure API connectivity.
- [ ] Verify WebSocket connectivity by receiving a real-time notification (e.g. assigning a task to the QA user).

## 4. Deployment Check
- [ ] Verify Cloud Run service is active and accepting traffic on HTTPS.
- [ ] Verify Vercel deployment completed successfully and is accessible.
- [ ] Check Sentry logs for any immediate crashes on boot.
- [ ] Ensure scheduled cron jobs are registered (e.g., Cloud Scheduler hitting the `/api/cron` endpoint or artisan schedule).

## 5. Rollback Plan
- **Database**: Ensure an automated snapshot is taken prior to running migrations. If failure occurs, restore snapshot.
- **Frontend**: Use Vercel's instant rollback feature to revert to the last stable deployment.
- **Backend**: Use Cloud Run traffic splitting to route 100% traffic back to the previous stable revision.
