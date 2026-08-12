FROM dunglas/frankenphp:php8.4

RUN install-php-extensions pdo pdo_pgsql mbstring bcmath gd redis opcache posix zip @composer

WORKDIR /var/www/html

COPY . .

RUN cd apps/api && composer install --no-dev --optimize-autoloader --no-interaction

RUN printf "opcache.enable=1\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\n" > /usr/local/etc/php/conf.d/opcache.ini

RUN cd apps/api && \
    php artisan storage:link && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

EXPOSE 8080

CMD ["sh", "apps/api/start.sh"]
