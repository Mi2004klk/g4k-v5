#!/bin/bash
cd /app/apps/api

# Cache config + migrate
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Start background processes
php artisan queue:work --tries=3 --backoff=60 --sleep=3 &
( while true; do php artisan schedule:run; sleep 60; done ) &

# Enable concurrent requests for PHP built-in server
export PHP_CLI_SERVER_WORKERS=10

# Start the web server (foreground — this is the main process Railway monitors)
exec php artisan serve --host=0.0.0.0 --port=$PORT
