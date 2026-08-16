#!/bin/sh
set -e
cd /var/www/html

# Run the scheduler in the background in a supervision loop, outputting to stdout
(while true; do php artisan schedule:work || true; sleep 2; done) &

# Run the queue worker in the background in a supervision loop, outputting to stdout
(while true; do php artisan queue:work database --tries=3 --backoff=60 --max-time=3600 --sleep=3 || true; sleep 2; done) &

# Start a dummy HTTP server so Cloud Run passes the port health check
echo "Starting dummy HTTP server on port ${PORT:-8080}..."
exec php -S 0.0.0.0:${PORT:-8080} -t public
