#!/bin/sh
cd /var/www/html/apps/api

# Run migrations (fast — already cached config from build phase)
php artisan migrate --force

# Start background processes
( while true; do php artisan queue:work --tries=3 --backoff=60 --sleep=3 --max-jobs=100 --max-time=3600; done ) &
( while true; do php artisan schedule:run; sleep 60; done ) &
( sleep 30; while true; do curl -s http://localhost:${PORT:-8080}/api/ping > /dev/null 2>&1; sleep 300; done ) &

# Reverb WebSocket server
if [ "$BROADCAST_CONNECTION" = "reverb" ] && [ -n "$REVERB_APP_KEY" ]; then
  ( php artisan reverb:start --host=0.0.0.0 --port=8081 ) &
fi

# Start FrankenPHP via Octane (handles concurrent requests)
exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=${PORT:-8080} --workers=4 --max-requests=500
