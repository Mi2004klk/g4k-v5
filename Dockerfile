FROM dunglas/frankenphp:php8.4-alpine

# System deps + PHP extensions (cached layer)
RUN apk add --no-cache \
    postgresql-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    libgd \
    linux-headers \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_pgsql pgsql zip pcntl posix opcache bcmath \
    && apk del \
        postgresql-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        linux-headers

# Redis via PECL
RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /var/www/html

# Copy composer files first for layer caching
COPY apps/api/composer.json apps/api/composer.lock ./

# Install deps (cached unless composer.json/lock change)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy app code (after deps, so code changes don't bust the composer cache)
COPY apps/api/ .

# Re-run composer dump to pick up app/Support/Polyfills.php autoload entry
RUN composer dump-autoload --no-dev --optimize

# OPcache tuning
RUN printf "opcache.enable=1\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\n" > /usr/local/etc/php/conf.d/opcache.ini

# Laravel prep
RUN php artisan storage:link || true

EXPOSE 8080
CMD ["sh", "start.sh"]
