#!/bin/sh
set -e
cd /var/www/html

# Run the queue worker in the background
php artisan queue:work database --tries=3 --backoff=60 --max-time=3600 --sleep=3 &

# Start a dummy HTTP server so Cloud Run passes the port health check
echo "Starting dummy HTTP server on port ..."
exec php -S 0.0.0.0: -t public

