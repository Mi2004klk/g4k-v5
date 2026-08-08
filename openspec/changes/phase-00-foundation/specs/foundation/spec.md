## Purpose
Stand up the deployable monorepo, database, CI/CD, and spec-first API pipeline that every later phase depends on.

## ADDED Requirements

### Requirement: Monorepo workspace
The system SHALL be a pnpm-workspace monorepo containing `apps/web`, `apps/api`, and `packages/ui`.

#### Scenario: shared package is importable from both apps
- **WHEN** `apps/web` imports a symbol from `@g4k/ui`
- **THEN** the import resolves at build time and type-checks via TypeScript project references

#### Scenario: api shares contracts via generated types
- **WHEN** the OpenAPI document in `apps/api/openapi` is regenerated
- **THEN** `packages/ui` produces matching TypeScript types consumed by the web app

### Requirement: Backend service health
The api SHALL expose an unauthenticated `GET /health` endpoint returning HTTP 200.

#### Scenario: health check succeeds
- **WHEN** a client requests `GET /health`
- **THEN** the response status is 200 and the body is `{ "status": "ok" }`

### Requirement: PostgreSQL connection
The api SHALL connect to PostgreSQL (Supabase) using a per-environment connection string.

#### Scenario: migrations apply cleanly
- **WHEN** `php artisan migrate` runs against any environment database
- **THEN** it completes without error, establishing Laravel's base schema

### Requirement: Sanctum readiness
The api SHALL have Laravel Sanctum installed and configured for Bearer-token auth.

#### Scenario: token auth scheme is registered
- **WHEN** a route is guarded by the Sanctum auth middleware (in later phases)
- **THEN** it accepts a valid Bearer token and rejects requests without one

### Requirement: Frontend placeholder
The web app SHALL render a placeholder landing page that imports from `packages/ui`.

#### Scenario: landing loads
- **WHEN** a user opens the deployed web root URL
- **THEN** the placeholder landing page renders without error

### Requirement: OpenAPI spec-first pipeline
The repo SHALL maintain a spec-first OpenAPI document with a base `/health` operation and a registered Bearer security scheme.

#### Scenario: spec lints on CI
- **WHEN** a PR is opened
- **THEN** CI lints the OpenAPI document and fails the build on validation errors

### Requirement: Continuous integration
GitHub Actions SHALL run lint, build, and test for both apps on every pull request.

#### Scenario: failing check blocks merge
- **WHEN** any lint/build/test job fails on a PR
- **THEN** the PR is blocked from merging

### Requirement: Deployment per environment
The api SHALL deploy to Railway and the web app to Vercel, each with isolated staging and production environments.

#### Scenario: staging auto-deploys on merge
- **WHEN** a change merges to main
- **THEN** the api deploys to Railway staging and the web app to Vercel staging/preview

### Requirement: Backup and rollback
The system SHALL have automated database backups and a documented rollback path for both deployments.

#### Scenario: rollback is documented and viable
- **WHEN** a production deploy is faulty
- **THEN** an operator can roll back the api (Railway) and web (Vercel) and restore the database per `DEPLOYMENT.md`
