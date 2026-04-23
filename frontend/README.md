# Task Manager — Frontend React

Interface web du Task Manager développée avec **React 19**, **TypeScript**, **Vite** et **Tailwind CSS v4**.

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| React | 19 | UI |
| TypeScript | 5.7+ | Typage statique |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Styles utilitaires |
| TanStack Query | 5 | Cache et état serveur |
| React Hook Form | 7 | Gestion des formulaires |
| Zod | 3 | Validation des schémas |
| i18next | 24 | Internationalisation (FR / EN) |
| react-i18next | 15 | Intégration React |
| Axios | 1.7 | Client HTTP |
| DOMPurify | 3 | Sanitisation XSS |
| date-fns | 4 | Formatage de dates |
| react-router-dom | 7 | Routing SPA |
| react-hot-toast | 2 | Notifications |
| lucide-react | 0.469 | Icônes |
| TypeDoc | 0.27 | Documentation TypeScript |

---

## Prérequis

- **Node.js 20+**
- **npm 10+**
- Le backend Symfony doit tourner sur `http://localhost:8000`

---

## Installation

```bash
cd frontend
npm install
```

---

## Développement

```bash
npm run dev
# → http://localhost:5173
```

Le proxy Vite redirige automatiquement `/api/*` vers `http://localhost:8000/api/*`.  
Pas besoin de configurer CORS en développement.

---

## Build de production

```bash
npm run build
# Génère le dossier dist/
```

Pour servir le build avec Nginx, ajouter dans la config Nginx :

```nginx
location / {
    root   /var/www/task-manager-front/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## Fonctionnalités

### Authentification
- Inscription avec validation de complexité de mot de passe
- Connexion avec token JWT persisté
- Déconnexion avec nettoyage du localStorage
- Protection des routes (redirection automatique)

### Gestion des tâches
- **Création** avec titre, description, statut, priorité et date d'échéance
- **Édition** partielle (PATCH)
- **Suppression** avec confirmation
- **Pagination** côté serveur avec sélecteur d'éléments par page
- **Filtres** : statut, priorité, recherche full-text
- **Tri** : par date, priorité, titre — ascendant ou descendant
- **Indicateur de retard** sur les tâches dépassant leur échéance

### Dashboard
- Taux de complétion avec barre de progression
- 6 compteurs : total, à faire, en cours, terminées, en retard, urgentes

### UI/UX
- **Thème** : clair / sombre / automatique (suit le système)
- **Langues** : Français / Anglais (détection automatique)
- **Toasts** de confirmation pour chaque action
- **Accessibilité** : aria-labels, aria-live, rôles ARIA
- Mode responsive (sidebar + contenu)

---

## Sécurité

- **DOMPurify** : sanitisation des inputs avant envoi à l'API
- **Zod** : validation locale miroir des contraintes backend
- **Axios interceptor** : injection automatique du Bearer token + déconnexion sur 401
- **ProtectedRoute** : redirection si non authentifié
- **Pas de dangerouslySetInnerHTML** : React échappe le contenu automatiquement

---

## Structure du projet

```
src/
├── api/               # Couche HTTP (axiosInstance, taskApi, authApi)
├── components/
│   ├── layout/        # Layout principal avec sidebar
│   ├── stats/         # Dashboard statistiques
│   ├── tasks/         # TaskCard, TaskForm, TaskList, TaskFilters
│   └── ui/            # Button, Badge, Input, Modal, Pagination
├── context/           # AuthContext, ThemeContext
├── hooks/             # useTask, useAuth (React Query)
├── i18n/              # Config i18next + locales fr.json / en.json
├── pages/             # LoginPage, RegisterPage, DashboardPage
├── schemas/           # Schémas Zod (taskSchemas, authSchemas)
├── types/             # Interfaces TypeScript (task.ts, auth.ts)
└── utils/             # sanitize.ts, date.ts
```

---

## Documentation TypeDoc

```bash
npm run docs
# Génère docs/frontend/ (fichiers Markdown)
```

---

## Variables d'environnement

Aucune variable d'environnement n'est requise en développement.  
Le proxy Vite gère la redirection vers le backend.

Pour la production, créer un `.env.production` :

```dotenv
VITE_API_BASE_URL=https://api.votre-domaine.com
```

Et adapter `axiosInstance.ts` pour utiliser `import.meta.env.VITE_API_BASE_URL`.
