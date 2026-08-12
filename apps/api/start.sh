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
