# Games4King Project - Finalization V6
## Code-First Production Audit & Remediation Plan

This document serves as the single source of truth for the finalization of the Games4King internal platform, based on a rigorous, code-first audit of the current working tree against the intended production state.

### 1. Critical Build & Deployment Blockers (P0)
The current working tree is fundamentally broken and will fail deployment. These issues must be addressed immediately before any feature work continues.

*   **PHP Fatal Error**: `apps/api/app/Http/Controllers/AttendanceController.php` contains a duplicate declaration of the `hrToday()` method (lines 409 and 639). This crashes the entire attendance module and prevents the Laravel application from compiling.
*   **TypeScript Build Failures**: `apps/web/src/components/projects/tasks-tab.tsx` contains syntax errors (unclosed JSX tags and missing `AlertTitle` exports), breaking the Next.js build.
*   **Missing Route Protection (Security Gap)**: The `apps/web/src/middleware.ts` file has been deleted in the working tree, but exists in the production (HEAD) deployment. Relying solely on `AuthGuard.tsx` (client-side) is a major security flaw. Unauthenticated users can load protected route bundles and potentially bypass the guard by disabling JavaScript. The middleware must be restored to enforce server-side redirection and API route protection.
*   **API Response Wrapping**: The `api-client.ts` attempts to patch Laravel's default paginator wrapping (`{ data: [...] }`), but this approach is brittle. The backend controllers must be standardized to consistently use Laravel Resources to prevent random `undefined` mapping errors on the frontend.

### 2. Core Workflow Audit Findings
Based on the inspection of the routes, database migrations, and frontend components, several workflows remain incomplete or misaligned:

#### A. Authentication & Capabilities
*   The `AuthGuard` handles `must_change_password` and onboarding routing, but `roles` management and `active_role` switching are fragile. 
*   Supabase Row Level Security (RLS) has been enforced via migration (`2026_08_16_000001_enforce_supabase_rls_on_all_tables.php`), but the frontend API client is relying solely on the Laravel backend for authentication (JWT). If the frontend attempts to interact with Supabase directly, it will fail due to missing context. 

#### B. Dashboard & Attendance
*   The `useDashboardInit` hook queries `/dashboard/init` to drive the widget engine based on the active role. However, the UI assumes all data is immediately available, leading to skeleton loading pop-in.
*   **Missing UI**: The "read receipt ticks" in DMs (V5-031) exist in the code (`<AppIcon name="read" />`) but the backend logic to mark messages as read in real-time via Reverb is not robustly implemented across all chat channels.
*   The "Scope filter for tasks" (V5-030) and "Project detail tasks tab" (V5-033) are partially implemented but currently blocked by the TS errors in `tasks-tab.tsx`.

#### C. Settings & Demo Data
*   The UI components for managing demo data (`DemoDataConfig`, `SystemJobsConfig`) exist in `settings-tabs.tsx`, but the actual data generation is hardcoded into `DatabaseSeeder.php`. A user-facing trigger for generating or sweeping demo data (V5-035) requires a dedicated backend job queue that is currently using the `database` driver, which is prone to timeout on serverless Cloud Run.

### 3. Implementation Plan (The "V6" Path to Production)

To achieve a production-ready state, the following phases must be executed in order:

#### Phase 1: Stabilization (Immediate Action)
*   **Fix PHP Fatal**: Remove the duplicate `hrToday()` method in `AttendanceController.php`. Ensure the correct implementation uses the `isAll` parameter safely.
*   **Fix TS Errors**: Repair the JSX and import errors in `tasks-tab.tsx` and ensure `@g4k/ui/components` exports are correctly mapped.
*   **Restore Security**: Reinstate `apps/web/src/middleware.ts` to protect `/dashboard`, `/admin`, and `/settings` routes server-side.

#### Phase 2: Contract & State Alignment
*   **Standardize API Responses**: Audit all controllers to ensure they return standard JSON resources (e.g., `ProjectResource`, `TaskResource`) instead of raw collections, removing the need for `unwrapOne` and `asArray` hacks in the frontend.
*   **Fix Reverb/Pusher Integration**: Ensure the `reverb` queue connection is functioning correctly. The `.env` files show a mix of Pusher and Reverb configurations; this must be unified to use self-hosted Reverb.

#### Phase 3: Missing Feature Completion (Carryover from V5)
*   **V5-030**: Complete the Task Scope Filter (My Tasks vs All Tasks based on Capabilities).
*   **V5-031**: Ensure DM Read Receipts trigger broadcast events when a message intersecting the viewport is seen.
*   **V5-032**: Implement server-side gating for Group Creation (currently only hidden on the client).
*   **V5-034**: Add Widget click-through, hover refresh, and dismiss capabilities.

#### Phase 4: Production Deployment Hardening
*   **Cloud Run Env Contract**: Create a definitive `.env.example` mapping for Vercel (Frontend) and Cloud Run (Backend) deployment pipelines.
*   **Supabase Realtime**: Validate that the Laravel backend can emit events to Supabase Realtime/Reverb and that the Vercel edge network is not blocking WebSocket connections.

---
*End of Audit Report.*
