# Task Manager — Full Stack

Application de gestion de tâches full stack :
- **Backend** : Symfony 7.4 LTS / PHP 8.2+ / JWT / Doctrine / Cache
- **Frontend** : React 19 / TypeScript / Tailwind CSS v4 / TanStack Query

---

## Démarrage rapide

### Étape 1 — Backend

```bash
cd backend

# 1. Dépendances PHP
composer install

# 2. Environnement
cp .env .env.local
# Éditer .env.local : DATABASE_URL, APP_SECRET, JWT_PASSPHRASE

# 3. Clés JWT
mkdir -p config/jwt
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout

# 4. Base de données
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction

# 5. Serveur
symfony server:start
# → http://localhost:8000
# → Swagger : http://localhost:8000/api/doc
```

### Étape 2 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Étape 3 — Utiliser

1. Ouvrir **http://localhost:5173**
2. Créer un compte via "Inscription"
3. Créer des tâches, filtrer, paginer
4. Switcher le thème (clair / sombre / auto) et la langue (FR / EN) depuis la sidebar

---

## Documentation

| URL / Commande | Description |
|---|---|
| http://localhost:8000/api/doc | Swagger UI interactif |
| http://localhost:8000/api/doc.json | Spec OpenAPI (Postman) |
| `cd backend && vendor/bin/phpdoc run` | Docs PHP → `backend/docs/` |
| `cd frontend && npm run docs` | Docs TypeScript → `frontend/docs/` |

---

## Architecture

```
task-manager/
├── backend/                    # API Symfony 7.4 LTS
│   ├── src/
│   │   ├── Controller/         # 3 controllers (Auth, Task, Statistics)
│   │   ├── DTO/                # CreateTaskDTO, UpdateTaskDTO, RegisterDTO, PaginatedResult
│   │   ├── Entity/             # User, Task
│   │   ├── Enum/               # TaskStatus, TaskPriority
│   │   ├── EventListener/      # Exception, SecurityHeaders, RateLimit
│   │   ├── Interface/          # TaskRepositoryInterface, TaskServiceInterface
│   │   ├── Repository/         # TaskRepository (pagination), UserRepository
│   │   ├── Request/            # TaskRequestTransformer (sanitise + valide)
│   │   └── Service/            # TaskService, AuthService, TaskCacheService, SanitizationService
│   └── config/
│       ├── packages/           # security, jwt, cors, cache, rate_limiter, etc.
│       └── services.yaml
│
└── frontend/                   # SPA React 19 + TypeScript
    └── src/
        ├── api/                # axiosInstance, taskApi, authApi
        ├── components/         # ui/, tasks/, layout/, stats/
        ├── context/            # AuthContext, ThemeContext
        ├── hooks/              # useTask, useAuth (React Query)
        ├── i18n/               # fr.json + en.json
        ├── pages/              # Login, Register, Dashboard
        ├── schemas/            # Zod (taskSchemas, authSchemas)
        ├── types/              # task.ts, auth.ts
        └── utils/              # sanitize.ts (DOMPurify), date.ts
```

---

## Pourquoi Symfony 7.4 et pas 8 ?

Symfony 7.4 est la version **LTS** (Long Term Support) :
- Support bugs : novembre 2028
- Support sécurité : novembre 2029
- Compatibilité maximale avec les bundles tiers
- PHP 8.2+ (plus universel que 8.4)

Symfony 8.0 = Symfony 7.4 sans les couches de dépréciation.
M�me fonctionnalités, support plus court (juillet 2026).

---

## Auteur

**Gilles Cédric** — Développeur Senior
