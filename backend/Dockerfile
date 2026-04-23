# =============================================================================
# Stage 1 — Deps: install Composer dependencies (no dev, optimized autoloader)
# =============================================================================
FROM composer:2.8 AS deps

WORKDIR /app

# Copy manifests first → Docker cache reuse if deps unchanged
COPY composer.json composer.lock ./

# Install prod deps only, no scripts (run after full source copy)
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs \
    --no-interaction

# Copy full source then generate optimized autoloader
COPY . .
RUN composer dump-autoload \
    --optimize \
    --classmap-authoritative \
    --no-dev

# =============================================================================
# Stage 2 — Runtime: PHP-FPM + Nginx in single container (supervisord)
# =============================================================================
FROM php:8.2-fpm-alpine AS runtime

LABEL org.opencontainers.image.title="task-manager-backend"
LABEL org.opencontainers.image.description="Symfony 7.4 REST API"
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# ─── System dependencies (pinned, minimal attack surface) ────────────────────
RUN apk add --no-cache \
        nginx=~1 \
        supervisor=~4 \
        libzip-dev \
        icu-dev \
        libpng-dev \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        zip \
        intl \
        opcache \
    && apk del libzip-dev icu-dev libpng-dev \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# ─── Security hardening ───────────────────────────────────────────────────────
# Non-root user for PHP-FPM
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app

# Remove default nginx config
RUN rm -f /etc/nginx/http.d/default.conf

# ─── Configuration files ──────────────────────────────────────────────────────
COPY docker/php/php.ini            /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/php/opcache.ini        /usr/local/etc/php/conf.d/99-opcache.ini
COPY docker/php/php-fpm.conf       /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/nginx/nginx.conf       /etc/nginx/nginx.conf
COPY docker/nginx/default.conf     /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisord.conf

# ─── Application ──────────────────────────────────────────────────────────────
WORKDIR /var/www/html

# Copy vendor from deps stage (no dev deps)
COPY --from=deps --chown=app:app /app/vendor ./vendor

# Copy application source (exclude dev artifacts via .dockerignore)
COPY --chown=app:app . .

# Prepare runtime directories
RUN mkdir -p var/cache var/log config/jwt \
    && chown -R app:app var/ config/jwt \
    && chmod -R 755 var/ \
    # Nginx needs to write to /var/run and /var/log/nginx
    && chown -R app:app /var/run/nginx /var/log/nginx 2>/dev/null || true \
    && touch /var/run/nginx.pid \
    && chown app:app /var/run/nginx.pid

# Entrypoint: warm cache, run migrations, start supervisord
COPY --chown=app:app docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# ─── Security: run as non-root ────────────────────────────────────────────────
USER app

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8000/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
