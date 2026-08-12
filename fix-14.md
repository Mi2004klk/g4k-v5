# fix-14.md — End-to-End Deploy Optimization: Vercel + Google Cloud Mumbai + Supabase Mumbai

> **Target architecture:**
> - **Vercel** → Next.js 16 frontend
> - **Google Cloud Run (`asia-south1`)** → Laravel + Octane/FrankenPHP **API**, plus **Reverb**
>   (WebSockets), **Queue worker**, and **Scheduler** as separate Cloud Run services/Jobs
> - **Supabase (`ap-south-1`)** → PostgreSQL (only)
>
> This file is the result of a full codebase audit. It is a **deployment playbook**: every finding has an
> exact `file:line`, a before/after, and a verification step. After implementing it the app builds cleanly
> on Google Cloud Build, runs as four independent Cloud Run concerns (API / Reverb / Queue / Scheduler),
> persists uploads to Supabase S3, streams logs to Cloud Logging, and serves the Vercel frontend with
> working realtime, background jobs, and zero CORS errors.
>
> **No Redis.** The stack is Postgres-only. Cache/Session/Queue use the `database` driver (shared across
> instances). Reverb is pinned to **1 instance** so it needs no Redis pubsub (the Redis scale path is
> documented in §6.6 for later).

---

# PART A — ROOT-CAUSE TABLE (every issue, mapped to its phase)

| # | Root cause | Where | Fix phase | Severity |
|---|---|---|---|---|
| 1 | **Cloud Build fails**: `pecl install redis` needs `autoconf`; build deps purged before pecl; runtime libs (`libpq.so.5`, `libzip.so.5`) orphaned | root `Dockerfile:21` | §1 | **Blocker** |
| 2 | **`Storage::disk('supabase')` referenced but never defined** → every avatar/logo/chat upload crashes | `config/filesystems.php`; `ProfileController.php:51`, `CompanyProfileController.php:52`, `ChatController.php:71` | §3 | **Blocker** |
| 3 | **Export jobs write to ephemeral `local` disk** → outputs vanish on instance recycle | `GenerateReportJob.php:38`, `ExportAuditLogsJob.php:50`; `FILESYSTEM_DISK=local` | §3 | **Blocker** |
| 4 | **`config/app.php:42` hardcodes `'debug' => true`** → overrides `APP_DEBUG=false` under `config:cache`, leaks stack traces | `config/app.php:42` | §3 | **Blocker (security)** |
| 5 | **Two Dockerfiles** (root + `apps/api/`); build uses the fragile one | root `Dockerfile`, `apps/api/Dockerfile` | §1, §2 | High |
| 6 | **`fly.toml` still drives config**; its `release_command` no longer fires → migrations silently stopped | `fly.toml:8` | §2, §5 | High |
| 7 | **Frontend silent-logout on every page load**: `auth-guard.tsx` restores session via the cross-origin HttpOnly cookie (blocked by 3p-cookie rules) instead of the `X-Refresh-Token` header | `auth-guard.tsx:24-41`; `AuthController.php:29-41` | §9 | High |
| 8 | **`ApprovalSubmitted` broadcasts to `private-private-user.{id}`** (double prefix) → event never delivered | `app/Events/ApprovalSubmitted.php:35` | §3 | High |
| 9 | **Private-channel auth (`/broadcasting/auth`) is session-guarded** → cross-origin Bearer-token `authEndpoint` fails → no private/presence realtime | `bootstrap/app.php:13`; default `web` guard | §6 | High |
| 10 | **Reverb co-located on port 8081** (unreachable; Cloud Run = one port) + `start.sh` background loops killed mid-job | `start.sh:17-19`; Cloud Run model | §5, §6, §7 | High |
| 11 | **`DB_PORT=5432` in `.env.example`** (direct) vs `6543` (pooler) elsewhere → connection exhaustion under scale | `.env.example:23` | §8 | High |
| 12 | **`LOG_CHANNEL=stack`/`single`** writes to ephemeral files → invisible in Cloud Logging | `config/logging.php:21,57` | §4 | High |
| 13 | **`APP_MAINTENANCE_DRIVER=file`** → `php artisan down` doesn't propagate across instances | `config/app.php:121-124`; `.env.example:11` | §4 | Medium |
| 14 | **Dead `SUPABASE_*` auth vars** (Auth is 100% Sanctum; no JWT verification anywhere) + `SUPABASE_SERVICE_ROLE_KEY` is a RLS-bypass risk | `.env.example:49-51` | §12 | Medium |
| 15 | **Committed secrets** to rotate: `VERCEL_OIDC_TOKEN` in tracked `.env.local`, Fly token in tracked `.fly_token` | `.env.local:2`, `.fly_token` | §2 | Medium (security) |
| 16 | **Frontend**: `puppeteer` devDep downloads Chromium on Vercel; `echarts` full-bundle; Node 20 vs Vercel 24; bundle budget not enforced; `fly.dev` hardcoded | `apps/web/package.json:79,84`; `next.config.ts:8`; `scripts/check-bundle-size.js` | §10 | Medium |
| 17 | **Repo bloat** (Fly/Railway remnants, scratch files) slows builds and confuses the deploy story | `fly.toml`, `flyctl_bin/`, `patch_*.js`, `DEPLOYMENT.md`, … | §2 | Low |
| 18 | **CI skew**: Node 22/pnpm 11 in CI vs 24/9.15.4 in repo; `api-ci` runs sqlite but migrations have Postgres raw SQL | `.github/workflows/ci.yml`; `package.json` | §11 | Low |

> **Items 1–4 are hard blockers** — the app does not work even if it builds. **5–10 are deployment correctness** for Cloud Run. **11–18 are hardening/cleanup.**

---

# PART B — PHASED IMPLEMENTATION

## §1 — Fix the Cloud Build (BLOCKER)

**Root cause (`build-summary.md`, last lines):**
```
Step 3/12 : RUN pecl install redis && docker-php-ext-enable redis
Cannot find autoconf ... $PHP_AUTOCONF ... 'phpize' failed
… returned a non-zero code: 1
```
`pecl install` runs `phpize`, which needs `autoconf` (from `$PHPIZE_DEPS`). The `.build-deps` purge
ordering is fragile, and the same purge orphans the **runtime** shared libraries, so even a "successful"
build emits `Unable to load dynamic library 'pdo_pgsql' … libpq.so.5: No such file or directory` at every
startup.

**Fix — replace the entire root `Dockerfile`** with the version below. It uses
`mlocati/php-extension-installer` (precompiled extensions, no `autoconf`/`phpize`, auto-resolved deps),
splits `composer` into its own cached layer, rebuilds the `storage/` scaffold (`.dockerignore` excludes
its contents), adds OPcache preload, and runs the env-independent `route:cache`/`view:cache` at **build**
time so cold starts are fast.

```dockerfile
FROM dunglas/frankenphp:php8.4-alpine

LABEL org.opencontainers.image.title="g4k-api"

# Precompiled PHP extensions — no autoconf, no phpize, deps auto-resolved.
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN install-php-extensions \
        pdo pdo_pgsql pgsql \
        gd zip bcmath intl \
        opcache pcntl posix \
        redis \
    && printf "opcache.enable=1\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\nopcache.preload=/var/www/html/preload.php\nopcache.preload_user=root\n" \
       > /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

# ---- Deps layer (cached unless composer.json/lock change) ----
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# ---- App code ----
COPY apps/api/ .

# storage/ scaffold (.dockerignore excludes its contents)
RUN mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions \
             storage/framework/views storage/app/public bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Re-register app/Support/Polyfills.php (SIGINT polyfill) in the autoload map
RUN composer dump-autoload --no-dev --optimize \
    && printf "<?php require_once '/var/www/html/vendor/autoload.php';" > preload.php

# Env-independent caches at BUILD time → fast cold starts (APP_KEY overridden at runtime)
RUN php artisan route:cache && php artisan view:cache

RUN php artisan storage:link || true

EXPOSE 8080
CMD ["sh", "start.sh"]
```

- [x] **1.1** Replace root `Dockerfile` with the above.
- [x] **1.2** Tighten `.dockerignore` (root):
  ```gitignore
  *
  !apps/api/
  !Dockerfile
  !cloudbuild.yaml
  apps/api/.env
  apps/api/.env.*
  apps/api/vendor/
  apps/api/node_modules/
  apps/api/storage/*
  !apps/api/storage/.gitkeep
  apps/api/tests/
  apps/api/.phpunit.result.cache
  apps/api/phpunit.xml
  apps/api/out.txt
  apps/api/output.txt
  apps/api/error_log.json
  apps/api/routes.txt
  apps/api/tests_output.log
  apps/api/test.php
  ```
- [x] **1.3** Verify locally before pushing:
  ```bash
  docker build -t g4k-api:test .
  docker run --rm -e PORT=8080 -p 8080:8080 g4k-api:test sh -c "php -m | grep -E 'pdo_pgsql|redis|gd|opcache|pcntl'"
  # expect all listed, NO 'libpq.so.5' warnings
  ```

---

## §2 — Purge Fly.io + repo bloat (and rotate committed secrets)

- [x] **2.1** `git rm fly.toml apps/api/Dockerfile` (consolidate to root Dockerfile; `apps/api/Dockerfile`
      uses a different base and is unused by the build).
- [x] **2.2** `git rm -r .fly_token flyctl_bin` and remove local-only binaries from disk:
      `rm -rf .fly_token flyctl_bin railway.exe supabase.exe gh.exe` (the `*.exe` are already gitignored).
- [x] **2.3** `git rm DEPLOYMENT.md build-summary.md context.md pnpm-lock.yaml.bak` and the scratch set:
      ```bash
      git rm fix-imports.mjs fix-cards.js remove_padding.py update-openapi.js test_sigint.php access.md skills-lock.json
      git rm patch.js patch_*.js
      git rm docs/archive/fix-1.md docs/archive/fix-2.md docs/archive/fix-3.md 2>/dev/null
      git rm fix-4.md fix-5.md fix-6.md fix-7.md fix-8.md fix-9.md fix-10.md fix-11.md fix-12.md fix-13.md
      ```
      *(Keep `fix-14.md` until implemented, then archive.)*
- [x] **2.4** **Rotate committed secrets** (these are in git history — rotate, then purge):
      - `.env.local:2` → `VERCEL_OIDC_TOKEN` (full RS256 JWT) is **git-tracked** (`.gitignore`'s `.env*`
        did not override an already-tracked file). Rotate the Vercel OIDC token, then
        `git rm --cached .env.local .env.vercel .env.production.local` and add to `.gitignore`.
      - `.fly_token` → Fly.io API token (`FlyV1 fm2_…`). Revoke it in the Fly dashboard (already migrating
        off Fly), then it's removed by 2.2.
      - Treat as exposed (on disk in `apps/api/.env.clean`, **not** tracked) and rotate all of:
        `APP_KEY`, `AWS_ACCESS_KEY_ID`/`SECRET`, `DB_PASSWORD`, `REVERB_APP_SECRET`, and (if ever used)
        `SUPABASE_JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY`. Delete `.env.clean` locally after.
- [x] **2.5** Fix the dead backend URL in `apps/web/next.config.ts:4-17`:
  ```ts
  async rewrites() {
    // Production calls the API directly (NEXT_PUBLIC_API_URL set on Vercel).
    // Dev-only fallback proxies to the local Laravel server.
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
  },
  ```

---

## §3 — Fix hard runtime bugs (BLOCKERS)

### 3.1 Define the `supabase` disk + make S3 the default (BLOCKER)

**`Storage::disk('supabase')` is called by three controllers but no such disk exists** in
`config/filesystems.php` (only `local`, `public`, `s3`). Every avatar/logo/chat upload throws
`disk [supabase] not configured`.

**Fix — in `apps/api/config/filesystems.php`**, add a `supabase` disk (alias of `s3`, pointing at the
Supabase S3 endpoint) right after the `s3` entry, and make it the default:
```php
'default' => env('FILESYSTEM_DISK', 's3'),

'disks' => [
    // … local, public …

    's3' => [
        'driver'                  => 's3',
        'key'                     => env('AWS_ACCESS_KEY_ID'),
        'secret'                  => env('AWS_SECRET_ACCESS_KEY'),
        'region'                  => env('AWS_DEFAULT_REGION'),
        'bucket'                  => env('AWS_BUCKET'),
        'url'                     => env('AWS_URL'),
        'endpoint'                => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        'throw'                   => false,
    ],

    // Alias so existing Storage::disk('supabase') calls resolve to the same Supabase S3 bucket.
    'supabase' => [
        'driver'                  => 's3',
        'key'                     => env('AWS_ACCESS_KEY_ID'),
        'secret'                  => env('AWS_SECRET_ACCESS_KEY'),
        'region'                  => env('AWS_DEFAULT_REGION'),
        'bucket'                  => env('AWS_BUCKET'),
        'url'                     => env('AWS_URL'),
        'endpoint'                => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        'throw'                   => false,
    ],
],
```
- [x] **3.1a** Add the `supabase` disk + set `default → s3`.
- [ ] **3.1b** On Supabase → Storage, create the `g4k` bucket and enable **public read** for the
      avatar/logo/attachment prefixes the frontend renders via `<img src>` (URLs come back absolute).
      Configure the bucket CORS to allow `GET` from the Vercel origin if you serve them cross-origin.

### 3.2 Export jobs must write to S3 (BLOCKER)

`GenerateReportJob.php:38` and `ExportAuditLogsJob.php:50` use
`Storage::disk(config('filesystems.default', 'public'))` — on Cloud Run the default `local`/`public` disk
is ephemeral, so exports vanish and `export_jobs.file_path` 404s.

- [x] **3.2a** Change both jobs to write to the **`s3`** disk explicitly:
  ```php
  $disk = Storage::disk('s3');   // was: Storage::disk(config('filesystems.default', 'public'))
  ```
- [x] **3.2b** Keep temp work in `sys_get_temp_dir()` (Cloud Run `/tmp` is the only writable scratch, but
      it is **memory-backed** — counts against the 2 GiB limit). For very large exports, stream to S3
      directly instead of buffering in `/tmp`.

### 3.3 Disable hardcoded debug (BLOCKER — security)

- [x] **3.3** `apps/api/config/app.php:42` — change `'debug' => true,` to `'debug' => env('APP_DEBUG', false),`.
      Under `config:cache` the hardcoded `true` overrides `APP_DEBUG=false` and leaks stack traces
      cross-origin.

### 3.4 Fix the double `private-` prefix (BLOCKER for one event)

- [x] **3.4** `app/Events/ApprovalSubmitted.php:35` — `new PrivateChannel('private-user.' . $id)` resolves
      to channel `private-private-user.{id}`, which never matches `routes/channels.php:5`'s
      `private-user.{id}`. Change to `new PrivateChannel('user.' . $id)` (matching every other event).

### 3.5 Remove orphaned Console commands + harden jobs

- [x] **3.5a** Delete the orphaned commands that duplicate the Jobs the scheduler already dispatches
      (`routes/console.php:11-13` schedules the **Jobs**, not these commands):
  ```bash
  git rm app/Console/Commands/AlertMissedClockIn.php app/Console/Commands/RemindShiftStart.php
  ```
- [x] **3.5b** Make `ProcessAuditLogJob` idempotent (it `DB::table('audit_logs')->insert()` on every run,
      so a retry double-inserts). Wrap in `DB::transaction()` with a uniqueness guard
      (e.g. `->where('correlation_id', $id)->doesntExist()` before insert, or an `INSERT … ON CONFLICT DO NOTHING`).
- [x] **3.5c** Add `$tries = 3;` and `$timeout = 120;` to every Job class (they currently rely solely on
      the worker flags, which differ between the old `start.sh` loop and the Cloud Run Job).
- [x] **3.5d** `config/queue.php:44` — set `'after_commit' => true` so jobs dispatched inside a DB
      transaction aren't picked up before the commit (avoids "model not found" races across instances).

---

## §4 — Cloud Run topology: `cloudbuild.yaml` for the API + one-time GCP setup

### 4.1 Create `cloudbuild.yaml` (root) — build → Artifact Registry → Cloud Run

```yaml
# Build the API image and deploy to Cloud Run (asia-south1).
# Trigger: GitHub push to `main` (Cloud Build > Triggers).
substitutions:
  _SERVICE: g4k-api
  _REGION: asia-south1
  _IMAGE: asia-south1-docker.pkg.dev/${PROJECT_ID}/g4k/${_SERVICE}:${SHORT_SHA}

options:
  logging: CLOUD_LOGGING_ONLY

steps:
  - name: gcr.io/cloud-builders/docker
    id: Build
    args: ["build", "-f", "Dockerfile", "-t", "${_IMAGE}", "."]

  - name: gcr.io/cloud-builders/docker
    id: Push
    args: ["push", "${_IMAGE}"]

  - name: google/cloud-sdk:slim
    id: Deploy
    entrypoint: gcloud
    args:
      - run
      - deploy
      - ${_SERVICE}
      - --image=${_IMAGE}
      - --region=${_REGION}
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --memory=2Gi
      - --cpu=2
      - --cpu-boost
      - --concurrency=10        # conservative for PHP/Octane (see §4.4)
      - --min-instances=1       # never scale to zero → no cold starts
      - --max-instances=10
      - --timeout=300
      - --no-use-http2          # FrankenPHP/Octane upstream expects HTTP/1.1
      - --set-env-vars=APP_NAME=Games4King,APP_ENV=production,APP_DEBUG=false,APP_LOCALE=en,APP_MAINTENANCE_DRIVER=cache,APP_MAINTENANCE_STORE=database,BCRYPT_ROUNDS=12,LOG_CHANNEL=stderr,LOG_LEVEL=error,DB_CONNECTION=pgsql,DB_SSLMODE=require,DB_PORT=6543,DB_HOST=aws-0-ap-south-1.pooler.supabase.com,DB_DATABASE=postgres,DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database,FILESYSTEM_DISK=s3,BROADCAST_CONNECTION=reverb,AWS_DEFAULT_REGION=ap-south-1,AWS_USE_PATH_STYLE_ENDPOINT=false,OCTANE_HTTPS=true,OCTANE_SERVER=frankenphp
      - --set-env-vars=AWS_ENDPOINT=https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/s3,AWS_BUCKET=g4k,SUPABASE_URL=https://jtcgtjrqijdnecwtuspv.supabase.co,REVERB_HOST=g4k-reverb-XXXXXX-as.a.run.app,REVERB_PORT=443,REVERB_SCHEME=https,REVERB_ALLOWED_ORIGINS=https://g4-k-web.vercel.app,FRONTEND_URL=https://g4-k-web.vercel.app,APP_URL=https://g4-k-web.vercel.app
      - --update-secrets=APP_KEY=g4k-app-key:latest,DB_PASSWORD=g4k-db-password:latest,REVERB_APP_ID=g4k-reverb-app-id:latest,REVERB_APP_KEY=g4k-reverb-app-key:latest,REVERB_APP_SECRET=g4k-reverb-app-secret:latest,AWS_ACCESS_KEY_ID=g4k-s3-key:latest,AWS_SECRET_ACCESS_KEY=g4k-s3-secret:latest,SENTRY_LARAVEL_DSN=g4k-sentry-dsn:latest,MAIL_PASSWORD=g4k-mail-password:latest

images:
  - ${_IMAGE}
```
> Replace `g4k-reverb-XXXXXX-as.a.run.app` with the real Reverb service URL from §6.2.

- [x] **4.1a** Create `cloudbuild.yaml`. In Cloud Build → Triggers, point the GitHub trigger at it (delete
      the old "Cloud Run source deploy" auto-trigger to avoid double builds).

### 4.2 One-time GCP setup (run once, locally, `gcloud` authed)

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
                       artifactregistry.googleapis.com secretmanager.googleapis.com \
                       cloudscheduler.googleapis.com

gcloud artifacts repositories create g4k --repository-format=docker --location=asia-south1

# Secrets (each created once; referenced by name in cloudbuild.yaml / Job defs)
printf "%s" "$(openssl rand -base64 32)"            | gcloud secrets create g4k-app-key            --data-file=-
printf "%s" "SUPABASE_DB_PASSWORD"                  | gcloud secrets create g4k-db-password         --data-file=-
printf "%s" "REVERB_APP_ID"                         | gcloud secrets create g4k-reverb-app-id       --data-file=-
printf "%s" "REVERB_APP_KEY"                        | gcloud secrets create g4k-reverb-app-key      --data-file=-
printf "%s" "REVERB_APP_SECRET"                     | gcloud secrets create g4k-reverb-app-secret   --data-file=-
printf "%s" "SUPABASE_S3_ACCESS_KEY"                | gcloud secrets create g4k-s3-key              --data-file=-
printf "%s" "SUPABASE_S3_SECRET"                    | gcloud secrets create g4k-s3-secret           --data-file=-
printf "%s" "https://sentry.io/…"                   | gcloud secrets create g4k-sentry-dsn          --data-file=-
printf "%s" "SMTP_PASSWORD"                         | gcloud secrets create g4k-mail-password       --data-file=-

# Grant the Cloud Run runtime SA access to every secret
PROJECT_NUM=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
RUN_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
for s in g4k-app-key g4k-db-password g4k-reverb-app-id g4k-reverb-app-key g4k-reverb-app-secret \
         g4k-s3-key g4k-s3-secret g4k-sentry-dsn g4k-mail-password; do
  gcloud secrets add-iam-policy-binding $s --member=serviceAccount:${RUN_SA} --role=roles/secretmanager.secretAccessor
done

# Cloud Build → deploy + act as the runtime SA
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:${PROJECT_NUM}@cloudbuild.gserviceaccount.com --role=roles/run.admin
gcloud iam service-accounts add-iam-policy-binding ${RUN_SA} \
  --member=serviceAccount:${PROJECT_NUM}@cloudbuild.gserviceaccount.com --role=roles/iam.serviceAccountUser
```
> **Generate the Reverb app id/key/secret** (`REVERB_APP_ID`, a random `REVERB_APP_KEY`, and a
> `REVERB_APP_SECRET`) yourself first; store them in the three secrets above. The **same values** must be
> set on the API service **and** the Reverb service (§6) so signatures match.

### 4.3 Logging, maintenance, HTTPS — the three Cloud Run env fixes

| Variable | Value | Why |
|---|---|---|
| `LOG_CHANNEL=stderr` | already in §4.1 | Laravel → `php://stderr` → **Cloud Logging** (files are ephemeral & invisible) |
| `APP_MAINTENANCE_DRIVER=cache` + `APP_MAINTENANCE_STORE=database` | already in §4.1 | `php artisan down` writes to the **shared** cache → affects **all** instances |
| `OCTANE_HTTPS=true` | already in §4.1 | Cloud Run terminates TLS; Octane must emit `https://` URLs / secure cookies |

- [x] **4.3** Confirm all three are set on the service (they are in the YAML above). TrustProxies uses the
      framework default (trusts `*` + forwarded headers) — accidentally Cloud-Run-correct, so no code
      change needed beyond `OCTANE_HTTPS=true`.

### 4.4 Concurrency vs Octane workers

| `--concurrency` | `OCTANE_WORKERS` | Behavior |
|---|---|---|
| 10 (in YAML) | 4 | Safe; ~6 requests queue briefly. Good default. |
| 20 | 8 | Higher throughput, ~1 GiB RAM. |
| 80 (Cloud Run default) | 4 | ❌ 76 queue → timeouts. Never use with 4 workers. |

- [x] **4.4** Ship at 10/4. Revisit only if `gcloud run services describe g4k-api` shows latency under load.

---

## §5 — `start.sh` for Cloud Run

Replace `apps/api/start.sh`. Octane becomes **PID 1** on `$PORT`; migrations run once per cold start
(idempotent); all background `&` loops (self-ping, queue worker, scheduler, reverb) are **removed** — they
belong in §6 (Reverb) and §7 (Jobs).

```sh
#!/bin/sh
set -e
cd /var/www/html

# 1. Migrations (idempotent). Runs once per cold start; with min-instances=1 cold starts are rare.
php artisan migrate --force

# 2. config:cache is INTENTIONALLY skipped — Cloud Run injects env/secrets at runtime, so baking them
#    at build time would be wrong. route:cache + view:cache already ran at build (Dockerfile).

# 3. Ensure the FrankenPHP binary is reachable in the working directory.
if [ ! -f "frankenphp" ] && [ -f "/usr/local/bin/frankenphp" ]; then
  ln -s /usr/local/bin/frankenphp frankenphp
fi

# 4. Octane = PID 1. Cloud Run injects PORT=8080; binding 0.0.0.0 is MANDATORY.
exec php artisan octane:start \
  --server=frankenphp \
  --host=0.0.0.0 \
  --port="${PORT:-8080}" \
  --workers="${OCTANE_WORKERS:-4}" \
  --max-requests="${OCTANE_MAX_REQUESTS:-500}"
```
- [ ] **5.1** Replace `apps/api/start.sh`; `chmod +x`.
- [ ] **5.2** Confirm `0.0.0.0` binding (binding `127.0.0.1` = health check fails = deploy rolled back).

---

## §6 — Reverb as its own Cloud Run service (WebSockets live)

Cloud Run exposes **one port** per service. Reverb must be a separate service (`g4k-reverb`) on its own
`*.a.run.app` domain. Pinned to **1 instance** (`min=1, max=1`) so no Redis pubsub is needed.

### 6.1 Wire private-channel auth to accept Bearer tokens (BLOCKER for realtime)

Private/presence channels authorize via `POST /broadcasting/auth`, which is **session-guarded** by
default. The Vercel frontend sends `Authorization: Bearer <sanctum-token>` there (no session cookie
cross-origin), so auth fails and **no private/presence channel ever subscribes**.

- [ ] **6.1a** Register an API broadcasting-auth route guarded by Sanctum. In `routes/api.php` (inside the
      existing `auth:sanctum` group, or with its own middleware):
  ```php
  use Illuminate\Broadcasting\BroadcastController;
  Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
      ->middleware(['auth:sanctum']);
  ```
  The frontend already calls `authEndpoint = ${NEXT_PUBLIC_API_URL}/broadcasting/auth`
  (`use-reverb.ts:74`) → resolves to `/api/broadcasting/auth`. ✓
- [ ] **6.1b** Ensure CORS allows it: `config/cors.php:18` paths already include `broadcasting/auth`. Add
      `X-Refresh-Token`, `Authorization`, `Content-Type`, `Accept` to `allowed_headers` (they're `['*']`
      today — fine) and keep `supports_credentials => true`.

### 6.2 Deploy the Reverb Cloud Run service

The same image serves Reverb — only the **entrypoint** differs. Pin to 1 instance.

```bash
# Reverb env values must match the API service exactly (id/key/secret).
gcloud run deploy g4k-reverb \
  --image=asia-south1-docker.pkg.dev/$PROJECT_ID/g4k/g4k-api:latest \
  --region=asia-south1 --platform=managed --allow-unauthenticated \
  --port=8080 --concurrency=80 --min-instances=1 --max-instances=1 \   # pinned to 1 (no Redis)
  --timeout=300 --cpu-boost \
  --command=php --args=artisan,reverb:start,--host=0.0.0.0,--port=8080 \
  --set-env-vars=APP_NAME=Games4King,APP_ENV=production,APP_DEBUG=false,APP_KEY=,BROADCAST_CONNECTION=reverb,REVERB_HOST=g4k-reverb-XXXXXX-as.a.run.app,REVERB_PORT=443,REVERB_SCHEME=https,REVERB_SERVER_HOST=0.0.0.0,REVERB_SERVER_PORT=8080,REVERB_ALLOWED_ORIGINS=https://g4-k-web.vercel.app,DB_CONNECTION=pgsql,DB_HOST=aws-0-ap-south-1.pooler.supabase.com,DB_PORT=6543,DB_DATABASE=postgres,DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv,DB_SSLMODE=require,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database,FILESYSTEM_DISK=s3,LOG_CHANNEL=stderr,LOG_LEVEL=error,OCTANE_HTTPS=true \
  --update-secrets=APP_KEY=g4k-app-key:latest,DB_PASSWORD=g4k-db-password:latest,REVERB_APP_ID=g4k-reverb-app-id:latest,REVERB_APP_KEY=g4k-reverb-app-key:latest,REVERB_APP_SECRET=g4k-reverb-app-secret:latest,AWS_ACCESS_KEY_ID=g4k-s3-key:latest,AWS_SECRET_ACCESS_KEY=g4k-s3-secret:latest
```
- [ ] **6.2** Deploy `g4k-reverb`. Capture its URL (`gcloud run services describe g4k-reverb --format="value(status.url)"`)
      and paste it back into the API's `REVERB_HOST` (§4.1) and Vercel's `NEXT_PUBLIC_REVERB_HOST` (§10.1).
- [ ] **6.3** In `config/reverb.php`, set `REVERB_ALLOWED_ORIGINS=https://g4-k-web.vercel.app` (the WS
      origin allowlist). Confirm `config/reverb.php` `options.host/port/scheme/useTLS` resolve from env.
      Cloud Run's HTTPS load balancer presents 443/TLS, so `REVERB_PORT=443` + `REVERB_SCHEME=https`.

### 6.4 Cloud Run WebSocket note
Cloud Run supports WebSockets but idle connections are capped (~60 min). `pusher-js`/Echo auto-reconnects
(`use-reverb.ts:71-73` `maxReconnectionAttempts: 5`, `maxReconnectGap: 10000`). Acceptable.

### 6.5 Scale path (do NOT do for v1)
If Reverb must scale beyond 1 instance: set `REVERB_SCALING_ENABLED=true` + a Redis (`Memorystore` /
`Upstash`) in `config/reverb.php`'s `scaling.redis` block, and unpin `max-instances`. Not needed now.

---

## §7 — Queue worker + Scheduler as Cloud Run Jobs

In-container `&` loops are killed mid-job on Cloud Run. Move both to **Cloud Run Jobs** triggered by
**Cloud Scheduler**. The queue Job runs `queue:work --max-time=900 --max-jobs=200` then **exits**; the
scheduler re-triggers it every 3 min. The schedule Job runs `schedule:run` every minute.

```bash
# Common env string (reuse for both Jobs + the scheduler invokes them)
COMMON_ENV="APP_NAME=Games4King,APP_ENV=production,APP_DEBUG=false,BROADCAST_CONNECTION=log,DB_CONNECTION=pgsql,DB_HOST=aws-0-ap-south-1.pooler.supabase.com,DB_PORT=6543,DB_DATABASE=postgres,DB_USERNAME=postgres.jtcgtjrqijdnecwtuspv,DB_SSLMODE=require,SESSION_DRIVER=database,CACHE_STORE=database,QUEUE_CONNECTION=database,FILESYSTEM_DISK=s3,LOG_CHANNEL=stderr,LOG_LEVEL=error,OCTANE_HTTPS=true"

# --- Queue worker Job ---
gcloud run jobs create g4k-queue \
  --image=asia-south1-docker.pkg.dev/$PROJECT_ID/g4k/g4k-api:latest --region=asia-south1 \
  --tasks=1 --task-timeout=900 --max-retries=0 \
  --command=php --args=artisan,queue:work,--tries=3,--backoff=60,--sleep=3,--max-jobs=200,--max-time=840,--queue=default \
  --set-env-vars="$COMMON_ENV" \
  --update-secrets=APP_KEY=g4k-app-key:latest,DB_PASSWORD=g4k-db-password:latest,AWS_ACCESS_KEY_ID=g4k-s3-key:latest,AWS_SECRET_ACCESS_KEY=g4k-s3-secret:latest,REVERB_APP_ID=g4k-reverb-app-id:latest,REVERB_APP_KEY=g4k-reverb-app-key:latest,REVERB_APP_SECRET=g4k-reverb-app-secret:latest

# --- Scheduler Job ---
gcloud run jobs create g4k-schedule \
  --image=asia-south1-docker.pkg.dev/$PROJECT_ID/g4k/g4k-api:latest --region=asia-south1 \
  --tasks=1 --task-timeout=120 --max-retries=0 \
  --command=php --args=artisan,schedule:run \
  --set-env-vars="$COMMON_ENV" \
  --update-secrets=APP_KEY=g4k-app-key:latest,DB_PASSWORD=g4k-db-password:latest,AWS_ACCESS_KEY_ID=g4k-s3-key:latest,AWS_SECRET_ACCESS_KEY=g4k-s3-secret:latest

# --- Cloud Scheduler triggers (every minute for schedule, every 3 min for queue) ---
PROJECT_NUM=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
RUN_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
# Give Cloud Scheduler permission to invoke Jobs
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member=serviceAccount:service-${PROJECT_NUM}@gcp-sa-cloudscheduler.iam.gserviceaccount.com \
  --role=roles/run.invoker 2>/dev/null

gcloud scheduler jobs create http g4k-schedule-cron --schedule="* * * * *" --location=asia-south1 \
  --uri="https://run.googleapis.com/v2/projects/$(gcloud config get-value project)/locations/asia-south1/jobs/g4k-schedule:run" \
  --http-method=POST --oauth-service-account-email=${RUN_SA}

gcloud scheduler jobs create http g4k-queue-cron --schedule="*/3 * * * *" --location=asia-south1 \
  --uri="https://run.googleapis.com/v2/projects/$(gcloud config get-value project)/locations/asia-south1/jobs/g4k-queue:run" \
  --http-method=POST --oauth-service-account-email=${RUN_SA}
```
- [ ] **7.1** Create both Jobs + both Scheduler crons. Verify:
  ```bash
  gcloud run jobs execute g4k-schedule --region asia-south1 --wait   # should print "No scheduled commands are ready to run" or run one
  gcloud run jobs execute g4k-queue    --region asia-south1 --wait   # should process any pending jobs then exit 0
  ```
- [ ] **7.2** Confirm the five `routes/console.php` schedule entries (3 every-5-min jobs + weekly summary
      + daily sanctum prune) now fire via the per-minute `g4k-schedule` Job.

> **Simplest alternative** if traffic is very low: set `QUEUE_CONNECTION=sync` on the API (jobs run inline
> during the request). Keep this only until the Jobs are wired, because exports would then block the HTTP
> request and risk Cloud Run's 300 s timeout.

---

## §8 — Database & Supabase hardening

- [ ] **8.1** Pin the pooler port in `apps/api/.env.example`: `DB_PORT=6543` (was `5432`). Port `6543` is
      Supabase's **transaction pooler** — it multiplexes Cloud Run's per-instance connections. The direct
      `5432` exhausts Supabase's connection budget under scale.
- [ ] **8.2** Connection budget check: `min-instances=1` × 4 Octane workers ≈ 4 long-lived PG
      connections; Reverb + Queue + Schedule Jobs add a few more each. Supabase pooler handles this
      comfortably. `config/octane.php:108` leaves `DisconnectFromDatabases` commented (connections held
      across requests for latency) — fine with the pooler. Do **not** enable persistent DB conns.
- [ ] **8.3** Transaction-pooler caveats: prepared statements / `LISTEN/NOTIFY` / advisory locks don't
      work on `6543`. The app uses none of these (realtime is Reverb, not PG LISTEN), and
      `PDO::ATTR_EMULATE_PREPARES=true` (`config/database.php:100`) sidesteps prepared-statement issues.
- [ ] **8.4** Migrations: 47 files, several use raw non-concurrent `CREATE INDEX` / `DROP INDEX` / `ADD
      CONSTRAINT … CHECK`. These take locks (`SHARE` / `ACCESS EXCLUSIVE`) on busy tables. Safe because
      only one instance runs `migrate` (the `migrations` table serializes), but on large tables an index
      build can block writes briefly. For future big tables, use `CREATE INDEX CONCURRENTLY` in a raw
      migration (note: cannot run inside a transaction — wrap in `DB::statement` outside `Schema`).
- [ ] **8.5** Several migrations have empty `down()` (e.g. `2026_08_12_024445`). Rollbacks will be
      incomplete — avoid `migrate:rollback` in prod; rely on forward-only + PITR (Supabase daily backups).
- [ ] **8.6** Dashboard init cache stays on `CACHE_STORE=database` (`DashboardController.php:42` et al.)
      — correct and shared across instances. Do **not** switch to `file` (per-instance, stale) or the
      `octane` store (per-worker, not shared).
- [ ] **8.7** Remove dead Supabase-auth config: `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
      `SUPABASE_URL` are declared in `.env.example:49-51` but **never read** (Auth is 100% Sanctum; no
      JWT verification, no `supabase/*` package). Delete them from `.env.example` and any deploy env. (The
      `SERVICE_ROLE_KEY` bypasses Supabase RLS — carrying it unused is a liability.)

---

## §9 — Cross-origin auth correctness (stop the silent logouts)

**Root cause:** `AuthController.php:24-43` sets the refresh cookie `g4k_refresh_token` as
`SameSite=Lax; domain=null` — fine same-origin, but **dead cross-origin** (Vercel → `*.a.run.app` is a
third-party site; Safari/Chrome block it). The silent session-restore in `auth-guard.tsx:24-41` calls
`/auth/refresh` using **only** that cookie → fails → user is force-logged-out on every page load.

The **load-bearing** path is the `X-Refresh-Token` header (the refresh token is also in localStorage and
is accepted via that header, `AuthController.php:182-184`).

- [ ] **9.1** Fix the silent restore to send the header. In `apps/web/src/components/auth-guard.tsx`
      (the mount-time restore), make the `/auth/refresh` call send the stored refresh token:
  ```ts
  const rt = useAuthStore.getState().refreshToken;
  const res = await apiFetch("/auth/refresh", {
    method: "GET",
    headers: rt ? { "X-Refresh-Token": rt } : {},
  });
  ```
  (`apiFetch` already adds `credentials: "include"`; with the header present the cross-origin cookie is
  irrelevant.)
- [ ] **9.2** Keep the refresh-token header in the CORS allow-list + preflight: `X-Refresh-Token` must be
  in `Access-Control-Allow-Headers` (it is — `allowed_headers = ['*']`), and every such request triggers
  an `OPTIONS` preflight which FrankenPHP must answer (it does via Laravel's CORS middleware).
- [ ] **9.3** Document the cookie as a **fallback only**. Optionally, to make the cookie usable when the
  frontend and API share a registrable domain later, set `SameSite=None; Secure` on
  `g4k_refresh_token` (`AuthController.php:38-41`) and configure `SANCTUM_STATEFUL_DOMAINS` +
  `SESSION_DOMAIN`. Not required for `vercel.app` → `a.run.app` (different eTLD+1).
- [ ] **9.4** Stop the 401 storm from the cookie/max-age skew: `auth-store.ts:47` sets `g4k_token` cookie
  `max-age=86400` (24 h) but the access token TTL is ~15 min. Either drop the `g4k_token` cookie to the
  same TTL as the access token, or accept that the middleware gate is advisory and the client refreshes
  on first 401 (current behavior).

---

## §10 — Frontend (Vercel) wiring & performance

### 10.1 Vercel environment variables (set in dashboard, Production + Preview)

| Var | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://g4k-api-XXXXXX-as.a.run.app` | auto-appends `/api` (`api-client.ts:6-8`) |
| `NEXT_PUBLIC_REVERB_HOST` | `g4k-reverb-XXXXXX-as.a.run.app` | **must be set** or WS silently no-ops (`use-reverb.ts:38`) |
| `NEXT_PUBLIC_REVERB_PORT` | `443` | Cloud Run TLS port |
| `NEXT_PUBLIC_REVERB_SCHEME` | `https` | **set with PORT=443** or WSS fails (`use-reverb.ts:66-68`) |
| `NEXT_PUBLIC_REVERB_APP_KEY` | (Reverb app key) | matches API/Reverb service |
| `NEXT_PUBLIC_SENTRY_DSN` | (DSN) | falls back to dummy → no capture |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | (Sentry) | build-time; AUTH_TOKEN required for source-map upload |
| `PUPPETEER_SKIP_DOWNLOAD` | `true` | prevents Chromium download on Vercel (see 10.4) |

- [ ] **10.1a** Set all of the above. **`NEXT_PUBLIC_REVERB_HOST` + `_PORT=443` + `_SCHEME=https` must be
      set together** — partial config silently disables realtime.

### 10.2 Remove stale `fly.dev` + fix Node version
- [ ] **10.2a** Already done in §2.5 (`next.config.ts` rewrite).
- [ ] **10.2b** `apps/web/package.json:84-86` — change `"engines": { "node": "20.x" }` → `"24.x"` to match
      the Vercel project (`nodeVersion "24.x"`) and root `package.json` (`24.x`). Also bump `@types/node`
      to `^24`.

### 10.3 Bundle / imports
- [ ] **10.3a** `next.config.ts:19-21` — extend `optimizePackageImports` to the heavy deps:
  ```ts
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@g4k/ui", "echarts", "echarts-for-react", "framer-motion", "@tiptap/react", "@tiptap/starter-kit", "@dnd-kit/core", "@dnd-kit/sortable", "@tanstack/react-table", "react-grid-layout"],
  },
  ```
- [ ] **10.3b** Tree-shake `echarts`: replace `import ReactECharts from "echarts-for-react"` (pulls the
  full ~1 MB bundle) with a `core`-based build — import only the chart types used (e.g.
  `echarts/charts/BarChart`, `LineChart`, `PieChart`, plus `echarts/components/*`, `echarts/renderers`),
  pass them to `EChartsReactCore`. This is the single biggest bundle win.
- [ ] **10.3c** Enforce the budget on every Vercel build: wire `test:bundle` into `build`. In
      `apps/web/package.json`:
  ```json
  "build": "next build && npm run test:bundle"
  ```
  Also fix `scripts/check-bundle-size.js:68-70` to set `hasError=true` + `process.exit(1)` on the
  first-load ceiling (currently advisory only).

### 10.4 Stop Chromium download on Vercel
- [ ] **10.4** `puppeteer` (`apps/web/package.json:79`, devDep) downloads ~170 MB Chromium on
      `pnpm install`. It's only used by `scripts/lh-auth.js` (local Lighthouse). Either set
      `PUPPETEER_SKIP_DOWNLOAD=true` on Vercel (§10.1), or move `puppeteer` + `@lhci/cli` to an
      `optionalDependencies`/dev-only group Vercel skips. This measurably shortens Vercel install time
      and avoids build timeouts.

### 10.5 Remove dead deps + fix service worker
- [ ] **10.5a** Remove the unused React Query persistence packages (`providers.tsx:10-13` confirms
  standard in-memory `QueryClientProvider`, not persist): `@tanstack/query-async-storage-persister`,
  `@tanstack/react-query-persist-client`.
- [ ] **10.5b** `apps/web/public/sw.js:7-10` — `cache.addAll(['/','/login'])` at install can reject on
  Vercel (those are dynamic RSC routes). Remove the `addAll` precache; let the runtime strategies
  populate the cache.
- [ ] **10.5c** `apps/web/src/app/layout.tsx:49-66` registers the SW inline; `dashboard/layout.tsx:217-220`
  registers it **again** → double registration. Register once (root layout only).

### 10.6 Images + CSP
- [ ] **10.6a** Add `images.remotePatterns` to `next.config.ts` so `<Image>` from the API/Supabase works:
  ```ts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.a.run.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  ```
- [ ] **10.6b** (Optional, hardening) Add a `headers()` block with a CSP that whitelists `*.a.run.app`
  (API + WSS) and `*.sentry.io` in `connect-src`; this is the frontend's CSP (the API's
  `SecurityHeaders.php` CSP only governs its own HTML responses).

### 10.7 Inconsistent `NEXT_PUBLIC_API_URL` fallbacks
- [ ] **10.7** Four ad-hoc `fetch` calls hardcode a different fallback (`http://localhost:8000/api`) than
  `api-client.ts` (`/api`): `dashboard/org/departments/page.tsx:150`,
  `dashboard/org/designations/page.tsx:133`, `components/attendance/admin-attendance-table.tsx:113`,
  `components/settings/settings-tabs.tsx:118`. Route these through `apiFetch` (or at least use the same
  `/api` fallback) so a blank env var can't silently point at localhost in prod.

---

## §11 — CI alignment (`.github/workflows/ci.yml`)

- [ ] **11.1** Unify versions: Node `24` (root + web + CI), pnpm `9.15.4` (matches `pnpm-lock.yaml`, not
      CI's `11`). In `ci.yml` set `setup-node node-version: 24` and `pnpm/action-setup@v3 version: 9.15.4`.
- [ ] **11.2** `api-ci` runs `php artisan test` on sqlite, but migrations contain Postgres raw SQL
      (`CREATE INDEX`, `ADD CONSTRAINT … CHECK`, partial unique indexes) → tests can fail. Add a Postgres
      service container:
  ```yaml
  services:
    postgres:
      image: postgres:16
      env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: g4k_test }
      ports: ["5432:5432"]
      options: >-
        --health-cmd "pg_isready -U postgres" --health-interval 10s
        --health-timeout 5s --health-retries 5
  ```
  and set `DB_CONNECTION=pgsql DB_HOST=localhost DB_PORT=5432 DB_DATABASE=g4k_test DB_USERNAME=postgres DB_PASSWORD=postgres`.
- [ ] **11.3** Add `composer audit` (api-ci) and `pnpm audit --prod` (web-ci) steps.
- [ ] **11.4** Keep CI test-only. Deploys happen via Cloud Build (§4) + Vercel Git integration — do **not**
      add deploy steps to GitHub Actions.

---

## §12 — Authoritative environment matrix

**Legend:** 🔒 = Secret Manager secret · RT = runtime · BT = build-time · ☠ = remove (dead/risky)

### 12.1 Cloud Run — `g4k-api` (the web API)
| Var | Value | |
|---|---|---|
| APP_NAME / APP_ENV / APP_DEBUG | `Games4King` / `production` / `false` | RT |
| APP_KEY | (base64) | 🔒 |
| APP_URL / FRONTEND_URL | `https://g4-k-web.vercel.app` | RT |
| APP_MAINTENANCE_DRIVER / _STORE | `cache` / `database` | RT |
| LOG_CHANNEL / LOG_LEVEL | `stderr` / `error` | RT |
| DB_CONNECTION / _HOST / _PORT | `pgsql` / `aws-0-ap-south-1.pooler.supabase.com` / `6543` | RT |
| DB_DATABASE / _USERNAME | `postgres` / `postgres.jtcgtjrqijdnecwtuspv` | RT |
| DB_PASSWORD | ••• | 🔒 |
| DB_SSLMODE | `require` | RT |
| SESSION_DRIVER / CACHE_STORE / QUEUE_CONNECTION | `database` / `database` / `database` | RT |
| FILESYSTEM_DISK | `s3` | RT |
| BROADCAST_CONNECTION | `reverb` | RT |
| REVERB_APP_ID / _KEY / _SECRET | (shared values) | 🔒 |
| REVERB_HOST / _PORT / _SCHEME | `g4k-reverb-XXXXXX-as.a.run.app` / `443` / `https` | RT |
| REVERB_ALLOWED_ORIGINS | `https://g4-k-web.vercel.app` | RT |
| AWS_DEFAULT_REGION / _BUCKET / _ENDPOINT | `ap-south-1` / `g4k` / `https://jtcgtjrqijdnecwtuspv.supabase.co/storage/v1/s3` | RT |
| AWS_USE_PATH_STYLE_ENDPOINT | `false` | RT |
| AWS_ACCESS_KEY_ID / _SECRET_ACCESS_KEY | ••• | 🔒 |
| SENTRY_LARAVEL_DSN / _TRACES_SAMPLE_RATE | ••• / `0.1` | 🔒 / RT |
| MAIL_MAILER / _HOST / _PORT / _USERNAME / _FROM_ADDRESS | (SMTP provider) | RT |
| MAIL_PASSWORD | ••• | 🔒 |
| OCTANE_HTTPS / _SERVER / _WORKERS / _MAX_REQUESTS | `true` / `frankenphp` / `4` / `500` | RT |
| PORT | `8080` | injected by Cloud Run |
| SUPABASE_URL / _JWT_SECRET / _SERVICE_ROLE_KEY | — | ☠ remove (dead; Auth is Sanctum) |

### 12.2 Cloud Run — `g4k-reverb` (WebSockets)
Same DB/CACHE/QUEUE/AWS/APP_KEY/REVERB_APP_* as the API, **plus**:
| REVERB_SERVER_HOST / _SERVER_PORT | `0.0.0.0` / `8080` | RT (bind inside container) |
| Entrypoint | `php artisan reverb:start --host=0.0.0.0 --port=8080` | — |
| Scaling | `--min-instances=1 --max-instances=1` | pinned (no Redis) |

### 12.3 Cloud Run Jobs — `g4k-queue` / `g4k-schedule`
Same env/secrets as the API (DB, CACHE, QUEUE, APP_KEY, AWS). `BROADCAST_CONNECTION=log` is fine here.
| Job | Entrypoint | Schedule |
|---|---|---|
| `g4k-queue` | `php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=200 --max-time=840` | every 3 min (Cloud Scheduler) |
| `g4k-schedule` | `php artisan schedule:run` | every minute (Cloud Scheduler) |

### 12.4 Vercel — `web`
| Var | Value | |
|---|---|---|
| NEXT_PUBLIC_API_URL | `https://g4k-api-XXXXXX-as.a.run.app` | BT |
| NEXT_PUBLIC_REVERB_HOST | `g4k-reverb-XXXXXX-as.a.run.app` | BT |
| NEXT_PUBLIC_REVERB_PORT | `443` | BT |
| NEXT_PUBLIC_REVERB_SCHEME | `https` | BT |
| NEXT_PUBLIC_REVERB_APP_KEY | (Reverb app key) | BT |
| NEXT_PUBLIC_SENTRY_DSN | (DSN) | BT |
| SENTRY_ORG / _PROJECT / _AUTH_TOKEN | (Sentry) | BT (AUTH_TOKEN 🔒) |
| PUPPETEER_SKIP_DOWNLOAD | `true` | BT |

---

# PART C — IMPLEMENTATION ORDER + ACCEPTANCE

## Implementation order

1. **§3** (hard runtime bugs: `supabase` disk, S3 jobs, debug flag, double-prefix, orphaned commands,
   job hardening) — these break the app regardless of deploy.
2. **§1** (Dockerfile + `.dockerignore`) → local `docker build` green, no extension warnings.
3. **§2** (purge Fly.io + bloat, rotate committed secrets, fix `next.config.ts`).
4. **§5** (`start.sh` for Cloud Run).
5. **§4** (`cloudbuild.yaml` + one-time GCP setup) → push → API revision healthy.
6. **§6.1** (broadcasting/auth Sanctum route) → **§6.2** (deploy `g4k-reverb`) → paste URL into API + Vercel.
7. **§7** (Queue + Schedule Jobs + Cloud Scheduler crons).
8. **§8** (DB pooler port, dead Supabase vars).
9. **§9** (auth-guard silent-restore header fix) + **§10** (Vercel env, perf, deps, SW, images).
10. **§11** (CI alignment).
11. Run the acceptance matrix below.

## Acceptance — "ready to deploy, clean and fast"

- [ ] **Cloud Build green** on `main`; build log shows no `autoconf`/`pecl`/`libpq.so.5` warnings. (§1)
- [ ] **API healthy**: `GET https://g4k-api-…/api/ping` → `{"status":"ok"}` in < 150 ms warm. (§4, §5)
- [ ] **No cold starts**: `--min-instances=1` + `--cpu-boost`; first request after idle ≈ any request. (§4)
- [ ] **Uploads persist**: avatar/logo upload → force a new revision → file still present (S3, not local). (§3)
- [ ] **Exports persist & download**: run an export, recycle the instance → `export_jobs.file_path` still
      resolves from S3. (§3.2)
- [ ] **Debug off**: a 404/500 returns the generic page, no stack trace. (§3.3)
- [ ] **Realtime works**: WSS handshake to `g4k-reverb` succeeds; a private channel subscribes
      (broadcasting/auth returns 200 with Bearer); a broadcast event arrives in the browser. (§6)
- [ ] **Background jobs run**: enqueue a job → `g4k-queue` Job processes it within ~3 min; a scheduled
      command fires within 1 min. (§7)
- [ ] **Sessions shared**: logged in, temporarily set `--min-instances=2`, refresh → still logged in. (§4)
- [ ] **Maintenance propagates**: `php artisan down` (via a Job) → all instances 503; `up` → recovered. (§4)
- [ ] **Logs in Cloud Logging**: `gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR"`
      shows Laravel errors. (§4)
- [ ] **Migrations run**: add a dummy migration, push → applied on the new revision's startup. (§5)
- [ ] **No silent logouts**: hard-refresh a dashboard page after access-token expiry → silent refresh via
      `X-Refresh-Token` succeeds, no redirect to `/login`. (§9)
- [ ] **No CORS errors** in the browser console; preflight for `X-Refresh-Token` + `Authorization` passes. (§6.1, §9)
- [ ] **No `fly.dev`/Fly references** in repo or runtime config. (§2)
- [ ] **Vercel build fast**: no Chromium download; bundle within budget enforced on `build`. (§10)
- [ ] **CI green** on Node 24 / pnpm 9.15.4 with a Postgres service. (§11)

## Root-cause summary (for the deployer)

| # | Root cause | Fix | Phase |
|---|---|---|---|
| 1 | `pecl install redis` fails (no autoconf); runtime libs orphaned | `install-php-extensions` Dockerfile | §1 |
| 2 | `Storage::disk('supabase')` undefined → uploads crash | Define disk; default → s3 | §3.1 |
| 3 | Export jobs write ephemeral `local` disk | Jobs → `s3` disk | §3.2 |
| 4 | `'debug' => true` hardcoded | `env('APP_DEBUG', false)` | §3.3 |
| 5 | `ApprovalSubmitted` double `private-` prefix | `PrivateChannel('user.' . $id)` | §3.4 |
| 6 | Fly.io remnants drive config; migrations stopped | Delete `fly.toml`; migrate in `start.sh` | §2, §5 |
| 7 | Silent logout: refresh via dead cross-origin cookie | Restore sends `X-Refresh-Token` header | §9 |
| 8 | `/broadcasting/auth` session-only → Bearer fails | Sanctum API route | §6.1 |
| 9 | Reverb on unreachable port 8081 | Separate Cloud Run service (pinned 1 instance) | §6.2 |
| 10 | Queue/scheduler killed mid-job in-container | Cloud Run Jobs + Cloud Scheduler | §7 |
| 11 | `.env.example` DB_PORT=5432 (direct) | `6543` (pooler) | §8 |
| 12 | Logs to ephemeral files | `LOG_CHANNEL=stderr` | §4 |
| 13 | Maintenance `file` driver not shared | `APP_MAINTENANCE_DRIVER=cache` | §4 |
| 14 | Dead/risky `SUPABASE_*` auth vars | Remove from env | §8.7 |
| 15 | Committed secrets (OIDC token, Fly token) | Rotate + `git rm --cached` | §2.4 |
| 16 | Frontend: puppeteer/echarts/Node/budget/SW | §10 fixes | §10 |
| 17 | Repo bloat (Fly/Railway/scratch) | `git rm` set | §2 |
| 18 | CI Node/pnpm/DB skew | Unify 24/9.15.4 + Postgres | §11 |

**§1–§4 are hard blockers. §5–§9 are Cloud Run correctness. §10–§12 are hardening. §11–§12 are hygiene.**
