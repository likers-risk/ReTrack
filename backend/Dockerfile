# Dockerfile for running the ReTrack Laravel backend on Render
FROM php:8.4-cli

# System packages and PHP extensions Laravel needs (Postgres + SQLite support)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libzip-dev libpng-dev libicu-dev \
    && docker-php-ext-install pdo_pgsql pgsql zip gd intl bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP packages first (cached between deploys)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

# Copy the rest of the app
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

ENV PORT=10000
EXPOSE 10000

# On every start: update the database tables, link uploaded images, then run the server
CMD php artisan migrate --force \
    && php artisan storage:link --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan serve --host=0.0.0.0 --port=${PORT}
