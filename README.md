# Games4King Workplace OS

A single, modern workplace platform that brings **attendance, leave, people management, and company-wide visibility** together in one place — built for the whole team: business owners, HR, and employees.

---

## 🛠 What this product does

Games4King Workplace OS replaces scattered spreadsheets and punch machines with one connected system:

- **Sign in & Access** — secure login for everyone, with role-based views.
- **Daily Attendance** — clock in, take breaks, clock out, live running timers, automatic overtime/late tracking, and a personal calendar heat-map.
- **Leave Management** — request time off, route it to the right approver (employee → HR → admin), and track status live.
- **People Directory** — searchable company directory with direct messaging.
- **Owner & HR Control** — manage employees, departments, approvals, attendance oversight, company-wide reports, holidays, and settings.
- **Real-Time Updates** — notifications, messages, and dashboard changes appear live without refreshing.

---

## 🚀 Deployment Status
**Deployment is Perfect and Fully Synced.**
- **Frontend**: Live on **Vercel**.
- **Backend API**: Live on **Google Cloud Run**.
- **Database**: Live on **Supabase**.

---

## 📋 Recent Work History

Here is a summary of the most recent updates deployed to the system:

- **1 am : Today** — Finalized Web Frontend fixes and performed complete repository cleanup.
- **12 am : Today** — Enforced atomic data consistency for overlapping leave and attendance records.
- **12 am : Today** — Hardened system security with mutating endpoint throttling and Sanctum token expiration.
- **12 am : Today** — Cleaned up UI tokens and improved design consistency across all dashboards.
- **11 pm : Yesterday** — Resolved core UX bugs and added empty/error states to data tables.
- **5 pm : Yesterday** — Fixed React UI crashes on the dashboard module.
- **4 pm : Yesterday** — Aligned CI/CD versions, added PostgreSQL service integrations and audit trails.
- **4 pm : Yesterday** — Optimized frontend authentication flow and reduced application bundle sizes.
- **4 pm : Yesterday** — Removed unused database variables and pinned stable Supabase connection ports.
- **4 pm : Yesterday** — Configured Reverb WebSockets for real-time live updates and tuned CORS policies.
- **3 pm : Yesterday** — Addressed runtime bugs and set up automated Cloud Build (`cloudbuild.yaml`) triggers.
- **3 pm : Yesterday** — Replaced old Dockerfiles with `mlocati` extension installer to purge deployment bloat.
- **3 pm : Yesterday** — Added Composer to the Docker image for reliable backend builds.
- **2 pm : Yesterday** — Resolved Alpine Linux shared library dependencies for PostgreSQL and Redis.
- **1 pm : Yesterday** — Rewrote Dockerfile workspaces and fixed build timeout issues.
- **12 pm : Yesterday** — Executed comprehensive backend and frontend polish across all modules.
- **12 pm : Yesterday** — Polyfilled POSIX signals to fix Octane FrankenPHP deployment crashes.
- **12 pm : Yesterday** — Patched Laravel Octane internals to avoid undefined SIGINT errors in Google Cloud.
