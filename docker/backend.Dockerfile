# Production image for the Laravel API.
# Runs php-fpm; pair with an nginx container (see docker-compose.yml) or any
# reverse proxy that speaks FastCGI/HTTP to port 9000.
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
        git unzip libpq-dev libzip-dev libpng-dev libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql zip gd bcmath opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-autoloader

COPY backend/ ./
RUN composer dump-autoload --optimize \
    && php artisan config:cache \
    && php artisan route:cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000
CMD ["php-fpm"]
