# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two independent apps:
- `backend/` — Symfony 7.4 LTS REST API (PHP 8.2+, Doctrine ORM, JWT)
- `frontend/` — React 19 SPA (Vite, TypeScript, TailwindCSS v4, React Query)

The frontend proxies `/api` to the backend via Vite dev server config.

## Backend Commands

```bash
cd backend

# Install deps
composer install

# Dev server (requires Symfony CLI)
symfony server:start

# Database
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:migrations:diff        # generate migration from entity changes
php bin/console doctrine:migrations:migrate     # apply migrations

# Tests
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --env=test --no-interaction
php bin/phpunit
php bin/phpunit tests/Unit/SomeTest.php         # single test

# Fixtures (dev data)
php bin/console doctrine:fixtures:load --no-interaction

# Clear cache
php bin/console cache:clear
```

## Frontend Commands

```bash
cd frontend
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # tsc + vite build
npm run lint      # eslint
npm run docs      # typedoc
```

## Architecture

### Backend

**Request flow**: Controller → DTO (validated) → Service → Repository → Entity

- **Controllers** (`src/Controller/`) are thin — validate auth, delegate to services, serialize response
- **Services** contain all business logic. `TaskService` depends on `TaskListService` for access control — every task op checks list membership before proceeding
- **DTOs** (`src/DTO/`) are validated with Symfony Validator constraints; `TaskRequestTransformer` converts raw request data to DTOs
- **Serializer groups**: `task:read`, `list:read`, `list:detail` — `list:detail` includes members (expensive), `list:read` only has `memberCount`
- **Cache**: `TaskCacheService` wraps filesystem cache (dev) / APCu (prod). Cache keys are per-user. Always call `invalidateUserCache()` after mutations
- **Rate limiting**: `RateLimitListener` — 200 req/min global, 10 req/min on `/auth/` routes
- **Access control**: `TaskListService::canAccess()` (read) and `canEdit()` (write) are the authorization gates. Tasks return 404 (not 403) for unauthorized access to avoid info leakage

### Frontend

**State management**: React Query for server state, React Context for auth + theme, component-local state for UI

- **`AuthContext`** stores JWT in `localStorage` under keys `auth_token` / `auth_user`. The Axios interceptor reads `auth_token` automatically on every request; 401 responses trigger hard redirect to `/login`
- **`activeList`** state lives in `AppRouter` and is passed down to `Layout` + `DashboardPage` — it's the currently selected `TaskListSummary`
- **Hooks** (`src/hooks/`) wrap React Query. `useUpdateTask` has optimistic updates with full snapshot/rollback for DnD status changes — this is intentional to prevent kanban card flash-back
- **API layer** (`src/api/`) maps 1:1 to backend controllers. All calls go through `axiosInstance` (baseURL `/api`)
- **Forms** use `react-hook-form` + `zod` schemas (`src/schemas/`)
- **i18n**: `i18next` with `en` and `fr` locales in `src/i18n/locales/`

### Data Model

```
User ──< TaskList (owner)
          ├──< TaskListMember (user + role: owner|editor|reader)
          └──< Task (owner + optional assignee)
                    └── belongs to TaskList
```

Invite flow: `TaskList.inviteToken` (64-char hex) → frontend route `/join/:token` → `JoinListPage` calls `taskListApi.joinByToken()` → user added as member with `defaultInviteRole`

### Enums

Backend enums map directly to frontend types:
- `TaskStatus`: `todo | in_progress | done`
- `TaskPriority`: `low | medium | high | urgent`
- `TaskListRole`: `owner | editor | reader`
- `NotificationType`: task assigned, task updated, member joined/left

## Environment Setup

Backend requires `.env.local` with:
```dotenv
DATABASE_URL="mysql://root:@127.0.0.1:3306/task_manager?serverVersion=8.0&charset=utf8mb4"
JWT_PASSPHRASE=your_passphrase
APP_SECRET=32+_char_hex
```

JWT keys must exist at `backend/config/jwt/private.pem` and `backend/config/jwt/public.pem`.

## API Documentation

Swagger UI available at `http://localhost:8000/api/doc` when backend is running.
