FROM dunglas/frankenphp:php8.4-alpine

RUN install-php-extensions pdo pdo_pgsql mbstring bcmath gd redis opcache zip @composer

WORKDIR /var/www/html

COPY . .

RUN cd apps/api && composer install --no-dev --optimize-autoloader --no-interaction

RUN cd apps/api && \
    php artisan storage:link && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

EXPOSE 8080

CMD ["sh", "apps/api/start.sh"]
