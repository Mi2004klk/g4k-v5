#!/bin/bash
cd /app/apps/api

# Run migrations (fast — already cached config from build phase)
php artisan migrate --force

# Start background processes
( while true; do php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600; done ) &
( while true; do php artisan schedule:run; sleep 60; done ) &

# Start FrankenPHP via Octane (handles concurrent requests)
exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=$PORT --workers=4 --max-requests=500
