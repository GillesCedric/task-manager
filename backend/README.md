# Task Manager API — Backend Symfony 7.4 LTS

API REST de gestion de tâches — **Symfony 7.4 LTS**, **PHP 8.2+**, **Doctrine ORM**, **JWT**.

> Symfony 7.4 est la version **Long Term Support** : bugs fixés jusqu'en novembre 2028,
> sécurité jusqu'en novembre 2029. Choix idéal pour un projet sérieux.

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| PHP | 8.2+ | Langage |
| Symfony | 7.4.* | Framework (LTS) |
| Doctrine ORM | 3.x | ORM / Migrations |
| LexikJWT | 3.x | Authentification JWT |
| Symfony Cache | 7.4 | Cache (filesystem dev, APCu prod) |
| MySQL | 8.0+ | Base de données |
| NelmioApiDoc | 4.x | Documentation Swagger/OpenAPI |
| NelmioCors | 2.x | CORS |
| phpDocumentor | 3.x | Documentation PHP |

---

## Prérequis

- **PHP 8.2+** avec extensions : `pdo_mysql`, `intl`, `mbstring`, `xml`, `zip`, `json`
- **Composer 2.x**
- **Symfony CLI** (recommandé) ou serveur PHP intégré
- **MySQL 8.0+** (ou MariaDB 10.6+)
- **OpenSSL** (génération des clés JWT)

> ⚠️ APCu n'est **pas requis** en développement — le cache utilise le filesystem par défaut.

---

## Installation

### 1. Installer les dépendances

```bash
cd backend
composer install
```

### 2. Configurer l'environnement

```bash
cp .env .env.local
```

Éditer `.env.local` :

```dotenv
APP_SECRET=une_chaine_aleatoire_de_32_caracteres_minimum
DATABASE_URL="mysql://root:@127.0.0.1:3306/task_manager?serverVersion=8.0&charset=utf8mb4"
JWT_PASSPHRASE=votre_passphrase_secrete
```

Générer APP_SECRET :
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 3. Générer les clés JWT

```bash
mkdir -p config/jwt

# Clé privée (protégée par passphrase)
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096

# Clé publique
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

> Entrez la même valeur que `JWT_PASSPHRASE` quand demandé.

### 4. Créer la base de données

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
```

### 5. Lancer le serveur

```bash
symfony server:start
# → http://127.0.0.1:8000

# Ou sans Symfony CLI :
php -S 127.0.0.1:8000 -t public/
```

---

## Endpoints

### Auth (publics)

| Méthode | URL | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Inscription → token JWT |
| `POST` | `/api/auth/login` | Connexion → token JWT |
| `GET`  | `/api/auth/me` | Profil courant (auth requise) |

### Tâches (JWT requis)

| Méthode | URL | Description |
|---|---|---|
| `GET`    | `/api/tasks` | Liste paginée avec filtres |
| `GET`    | `/api/tasks/{id}` | Détail |
| `POST`   | `/api/tasks` | Créer |
| `PATCH`  | `/api/tasks/{id}` | Mise à jour partielle |
| `DELETE` | `/api/tasks/{id}` | Supprimer |

### Statistiques (JWT requis)

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/statistics` | Stats agrégées dashboard |

### Paramètres GET /api/tasks

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | int | 1 | Page |
| `per_page` | int | 10 | Éléments/page (max 100) |
| `status` | string | — | `todo`, `in_progress`, `done` |
| `priority` | string | — | `low`, `medium`, `high`, `urgent` |
| `search` | string | — | Recherche titre + description |
| `sort` | string | `createdAt` | Champ de tri |
| `order` | string | `DESC` | `ASC` ou `DESC` |

---

## Swagger UI

```
http://localhost:8000/api/doc        → Interface interactive
http://localhost:8000/api/doc.json   → JSON OpenAPI (import Postman)
```

---

## Documentation PHP

```bash
composer require --dev phpdocumentor/phpdocumentor
vendor/bin/phpdoc run -c phpdoc.xml
# → docs/backend/index.html
```

---

## Tests

```bash
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --env=test --no-interaction
php bin/phpunit
```

---

## Sécurité

| Mesure | Détail |
|---|---|
| JWT RSA-4096 | LexikJWTAuthenticationBundle, token 1h |
| Rate Limiting | 200 req/min global, 10 req/min /auth/ |
| Sanitisation | `symfony/html-sanitizer` sur tous les inputs |
| Validation | DTOs avec contraintes Symfony Validator |
| Headers OWASP | X-Frame, CSP, HSTS, X-Content-Type, etc. |
| Ownership | Tâches isolées par utilisateur (404 si accès non autorisé) |
| Password | bcrypt/argon2 auto, rehachage transparent |
