#!/usr/bin/env bash
# =============================================================================
# install.sh — Script d'installation du Task Manager (Symfony 7.4 + React 19)
# Auteur : Gilles Cédric <g.cedric@dev.io>
# =============================================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BLUE}▶ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║   Task Manager — Installation automatique    ║"
echo "║   Symfony 7.4 LTS + React 19                 ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# --- Vérifications prérequis ---
step "Vérification des prérequis"

command -v php      >/dev/null 2>&1 || err "PHP 8.2+ requis. Installez Laragon (Windows) ou php8.2-fpm (Linux)."
command -v composer >/dev/null 2>&1 || err "Composer requis : https://getcomposer.org"
command -v node     >/dev/null 2>&1 || err "Node.js 20+ requis : https://nodejs.org"
command -v npm      >/dev/null 2>&1 || err "npm requis (installé avec Node.js)"
command -v openssl  >/dev/null 2>&1 || err "OpenSSL requis pour les clés JWT"

PHP_VER=$(php -r "echo PHP_VERSION;")
NODE_VER=$(node -v)
ok "PHP $PHP_VER détecté"
ok "Composer $(composer --version --no-ansi 2>/dev/null | head -1 | awk '{print $3}') détecté"
ok "Node.js $NODE_VER détecté"

# Vérifier PHP >= 8.2
php -r "if (version_compare(PHP_VERSION, '8.2.0', '<')) { exit(1); }" || \
    err "PHP 8.2+ requis. Version actuelle : $PHP_VER"
ok "Version PHP compatible (>= 8.2)"

# --- Backend ---
step "Installation du backend Symfony 7.4"
cd "${SCRIPT_DIR}/backend"

composer install --no-interaction --optimize-autoloader
ok "Dépendances PHP installées"

# Créer .env.local si absent
if [ ! -f .env.local ]; then
    cp .env .env.local
    SECRET=$(openssl rand -hex 32)
    PASSPHRASE=$(openssl rand -hex 16)

    # Compatible Linux et macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/APP_SECRET=change_this_to_a_random_32_char_string/APP_SECRET=${SECRET}/" .env.local
        sed -i '' "s/JWT_PASSPHRASE=change_this_passphrase/JWT_PASSPHRASE=${PASSPHRASE}/"     .env.local
    else
        sed -i "s/APP_SECRET=change_this_to_a_random_32_char_string/APP_SECRET=${SECRET}/"    .env.local
        sed -i "s/JWT_PASSPHRASE=change_this_passphrase/JWT_PASSPHRASE=${PASSPHRASE}/"        .env.local
    fi

    ok ".env.local créé (APP_SECRET et JWT_PASSPHRASE auto-générés)"
    warn "Éditez backend/.env.local pour configurer DATABASE_URL si nécessaire"
    warn "URL par défaut : mysql://root:@127.0.0.1:3306/task_manager"
else
    ok ".env.local déjà présent — pas de modification"
fi

# Générer les clés JWT si absentes
if [ ! -f config/jwt/private.pem ]; then
    mkdir -p config/jwt
    PASSPHRASE=$(grep '^JWT_PASSPHRASE=' .env.local | cut -d= -f2)

    openssl genpkey \
        -out config/jwt/private.pem \
        -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 \
        -pass pass:"${PASSPHRASE}" 2>/dev/null

    openssl pkey \
        -in config/jwt/private.pem \
        -out config/jwt/public.pem \
        -pubout -passin pass:"${PASSPHRASE}" 2>/dev/null

    ok "Clés JWT RSA-4096 générées dans config/jwt/"
else
    ok "Clés JWT déjà présentes"
fi

# Base de données
echo ""
warn "MySQL doit être démarré (Laragon, WAMP, ou service mysql)"
echo -n "  Créer la base de données et migrer maintenant ? [y/N] "
read -r CREATE_DB
if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
    php bin/console doctrine:database:create --if-not-exists
    php bin/console doctrine:migrations:migrate --no-interaction
    ok "Base de données créée et migrations appliquées"
else
    warn "À faire manuellement :"
    warn "  php bin/console doctrine:database:create"
    warn "  php bin/console doctrine:migrations:migrate --no-interaction"
fi

# --- Frontend ---
step "Installation du frontend React 19"
cd "${SCRIPT_DIR}/frontend"

npm install --silent
ok "Dépendances Node.js installées ($(ls node_modules | wc -l | tr -d ' ') packages)"

# --- Résumé ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo "║     ✅  Installation terminée avec succès !  ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Backend${NC}  →  cd backend && symfony server:start"
echo -e "  ${BLUE}Frontend${NC} →  cd frontend && npm run dev"
echo ""
echo -e "  ${GREEN}Application${NC}  : http://localhost:5173"
echo -e "  ${GREEN}Swagger UI${NC}   : http://localhost:8000/api/doc"
echo ""
