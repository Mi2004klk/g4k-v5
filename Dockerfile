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
