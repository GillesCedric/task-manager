#!/bin/sh
set -e

echo "==> [entrypoint] Starting Task Manager API (env: ${APP_ENV:-prod})"

# ─── JWT Keys: write keys from env vars ──────────────────────────────────────
# In production, JWT_SECRET_KEY_VALUE and JWT_PUBLIC_KEY_VALUE hold the PEM
# key content. Write them to the paths Symfony expects.
mkdir -p config/jwt

if [ -n "${JWT_SECRET_KEY_VALUE:-}" ]; then
    echo "$JWT_SECRET_KEY_VALUE" > config/jwt/private.pem
    chmod 600 config/jwt/private.pem
    export JWT_SECRET_KEY=/var/www/html/config/jwt/private.pem
    echo "==> [entrypoint] JWT private key written"
fi

if [ -n "${JWT_PUBLIC_KEY_VALUE:-}" ]; then
    echo "$JWT_PUBLIC_KEY_VALUE" > config/jwt/public.pem
    chmod 644 config/jwt/public.pem
    export JWT_PUBLIC_KEY=/var/www/html/config/jwt/public.pem
    echo "==> [entrypoint] JWT public key written"
fi

# ─── Symfony cache ────────────────────────────────────────────────────────────
echo "==> [entrypoint] Warming Symfony cache..."
php bin/console cache:warmup --env=prod --no-debug 2>&1

# ─── Database migrations ──────────────────────────────────────────────────────
echo "==> [entrypoint] Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration --env=prod 2>&1

# ─── Start processes via supervisord ──────────────────────────────────────────
echo "==> [entrypoint] Starting supervisord (nginx + php-fpm)..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
