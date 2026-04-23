/**
 * @module types/task
 * @description Définitions TypeScript pour les tâches.
 *
 * Ces types sont le miroir exact des entités et enums Symfony côté backend.
 * Toute modification du modèle PHP doit être répercutée ici.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * Cycle de vie d'une tâche.
 * Valeurs correspondant aux cases de l'enum PHP `TaskStatus`.
 */
export enum TaskStatus {
  /** Tâche créée mais non commencée */
  TODO        = 'TODO',
  /** Tâche en cours de traitement */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Tâche terminée */
  DONE        = 'DONE',
}

/**
 * Niveau de priorité d'une tâche.
 * Valeurs correspondant aux cases de l'enum PHP `TaskPriority`.
 */
export enum TaskPriority {
  /** Priorité basse — peut attendre */
  LOW    = 'LOW',
  /** Priorité normale — défaut à la création */
  MEDIUM = 'MEDIUM',
  /** Priorité haute — doit être traité rapidement */
  HIGH   = 'HIGH',
  /** Priorité urgente — action immédiate requise */
  URGENT = 'URGENT',
}

/**
 * Classes Tailwind CSS par statut — centralisées pour une cohérence visuelle globale.
 * Utiliser ces constantes plutôt que des classes inline pour maintenir la cohérence.
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]:        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  [TaskStatus.DONE]:        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
}

/**
 * Classes Tailwind CSS par priorité.
 */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]:    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
  [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  [TaskPriority.HIGH]:   'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
}

/**
 * Représentation minimale d'un utilisateur dans le contexte d'une tâche.
 * Retourné par l'API dans le groupe de sérialisation `task:read`.
 */
export interface TaskUser {
  id:        number
  name:      string
  email:     string
  avatarUrl: string | null
}

/**
 * Tâche complète telle que retournée par l'API (groupe `task:read`).
 *
 * @example
 * ```typescript
 * const task: Task = await taskApi.getById(42);
 * console.log(task.status); // TaskStatus.TODO
 * ```
 */
export interface Task {
  /** Identifiant unique en base de données */
  id:          number
  /** Titre court de la tâche (3–255 caractères) */
  title:       string
  /** Description longue optionnelle (max 5 000 caractères) */
  description: string | null
  /** Statut actuel dans le cycle de vie */
  status:      TaskStatus
  /** Niveau de priorité */
  priority:    TaskPriority
  /** Date d'échéance au format ISO 8601, null si non définie */
  dueDate:     string | null
  /** Liste parente à laquelle appartient cette tâche */
  taskList:    { id: number; name: string; color: string }
  /** Utilisateur ayant créé la tâche */
  owner:       TaskUser
  /** Utilisateur assigné à la tâche, null si non assignée */
  assignee:    TaskUser | null
  /** Date de création au format ISO 8601 */
  createdAt:   string
  /** Date de dernière modification au format ISO 8601 */
  updatedAt:   string
}

/**
 * Payload pour la création d'une tâche via `POST /api/tasks`.
 * Tous les champs obligatoires doivent être fournis.
 */
export interface CreateTaskPayload {
  title:        string
  /** ID de la liste parente — obligatoire */
  list_id:      number
  description?: string
  status:       TaskStatus
  priority:     TaskPriority
  /** Format attendu : YYYY-MM-DD */
  due_date?:    string
  assignee_id?: number
}

/**
 * Payload pour la mise à jour partielle d'une tâche via `PATCH /api/tasks/:id`.
 * Tous les champs sont optionnels — seuls les champs fournis sont modifiés.
 * Envoyer `assignee_id: null` pour désassigner explicitement.
 */
export interface UpdateTaskPayload {
  title?:        string
  description?:  string
  status?:       TaskStatus
  priority?:     TaskPriority
  /** Format attendu : YYYY-MM-DD, null pour effacer l'échéance */
  due_date?:     string | null
  assignee_id?:  number | null
}

/**
 * Métadonnées de pagination retournées dans toutes les réponses de liste.
 */
export interface PaginationMeta {
  total:       number
  page:        number
  per_page:    number
  total_pages: number
  has_next:    boolean
  has_prev:    boolean
}

/**
 * Paramètres de filtrage, tri et pagination pour `GET /api/tasks`.
 * Tous les paramètres optionnels sont ignorés s'ils sont `undefined`.
 */
export interface TaskFilters {
  status?:   TaskStatus
  priority?: TaskPriority
  /** Recherche full-text sur titre et description */
  search?:   string
  /** Champ de tri : createdAt | updatedAt | dueDate | priority | title */
  sort:      string
  order:     'ASC' | 'DESC'
  page:      number
  perPage:   number
  /** Filtre par liste — obligatoire en mode Kanban */
  listId?:   number
}

/**
 * Enveloppe générique des réponses de succès de l'API.
 * @template T — Type de la donnée encapsulée dans `data`
 */
export interface ApiResponse<T> {
  success:     boolean
  data:        T
  pagination?: PaginationMeta
}

/**
 * Structure des réponses d'erreur de l'API.
 * Le champ `error` contient le message lisible par l'utilisateur.
 */
export interface ApiErrorResponse {
  success: false
  error:   string
}

/**
 * Statistiques agrégées du tableau de bord utilisateur.
 * Retournées par `GET /api/statistics`.
 */
export interface TaskStats {
  total:       number
  todo:        number
  in_progress: number
  done:        number
  urgent:      number
  high:        number
  overdue:     number
}
