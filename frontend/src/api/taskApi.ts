/**
 * @module api/taskApi
 * @description Client HTTP pour les endpoints de tâches.
 *
 * Toutes les requêtes passent par `axiosInstance` qui injecte automatiquement
 * le token JWT et normalise les erreurs. Les payloads sont sanitisés avant envoi
 * via `sanitizePayload` pour prévenir les injections XSS côté serveur.
 *
 * **Endpoints couverts :**
 * - `GET    /api/tasks`          — Liste paginée avec filtres
 * - `GET    /api/tasks/:id`      — Détail d'une tâche
 * - `POST   /api/tasks`          — Création
 * - `PATCH  /api/tasks/:id`      — Mise à jour partielle
 * - `DELETE /api/tasks/:id`      — Suppression
 * - `GET    /api/statistics`     — Statistiques agrégées du tableau de bord
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

import axiosInstance from './axiosInstance'
import { sanitizePayload } from '@/utils/sanitize'
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  ApiResponse,
  PaginationMeta,
  TaskFilters,
  TaskStats,
} from '@/types/task'

/** Forme brute de la réponse de liste retournée par l'API */
interface TaskListResponse {
  success:    boolean
  data:       Task[]
  pagination: PaginationMeta
}

export const taskApi = {
  /**
   * Récupère une page de tâches avec filtres optionnels.
   *
   * @param filters - Critères de filtrage, tri et pagination
   * @returns Tableau de tâches et métadonnées de pagination
   *
   * @example
   * ```typescript
   * const { tasks, pagination } = await taskApi.getAll({
   *   page: 1, perPage: 20, sort: 'createdAt', order: 'DESC',
   *   status: TaskStatus.TODO, listId: 5,
   * });
   * ```
   */
  getAll: async (filters: TaskFilters): Promise<{ tasks: Task[]; pagination: PaginationMeta }> => {
    const params = new URLSearchParams()
    params.set('page',     String(filters.page))
    params.set('per_page', String(filters.perPage))
    params.set('sort',     filters.sort)
    params.set('order',    filters.order)
    if (filters.status)   params.set('status',   filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.search)   params.set('search',   filters.search)
    if (filters.listId)   params.set('list_id',  String(filters.listId))

    const { data } = await axiosInstance.get<TaskListResponse>(`/tasks?${params}`)
    return { tasks: data.data, pagination: data.pagination! }
  },

  /**
   * Récupère le détail complet d'une tâche par son identifiant.
   *
   * @param id - Identifiant unique de la tâche
   * @returns La tâche complète avec ses relations (owner, assignee, taskList)
   * @throws {AxiosError} 404 si la tâche n'existe pas ou si l'accès est refusé
   */
  getById: async (id: number): Promise<Task> => {
    const { data } = await axiosInstance.get<ApiResponse<Task>>(`/tasks/${id}`)
    return data.data
  },

  /**
   * Crée une nouvelle tâche dans la liste spécifiée.
   * Le payload est sanitisé avant envoi pour prévenir les injections XSS.
   *
   * @param payload - Données de la tâche à créer
   * @returns La tâche créée avec son identifiant et ses métadonnées
   * @throws {AxiosError} 400 si la validation échoue, 403 si droits insuffisants
   */
  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await axiosInstance.post<ApiResponse<Task>>(
      '/tasks',
      sanitizePayload(payload as unknown as Record<string, unknown>) as unknown as CreateTaskPayload,
    )
    return data.data
  },

  /**
   * Met à jour partiellement une tâche existante (sémantique PATCH).
   * Seuls les champs fournis sont modifiés — les autres restent inchangés.
   *
   * @param id      - Identifiant de la tâche à modifier
   * @param payload - Champs à modifier (tous optionnels)
   * @returns La tâche mise à jour
   * @throws {AxiosError} 403 si l'utilisateur n'a pas le droit d'éditer
   */
  update: async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await axiosInstance.patch<ApiResponse<Task>>(
      `/tasks/${id}`,
      sanitizePayload(payload as Record<string, unknown>) as UpdateTaskPayload,
    )
    return data.data
  },

  /**
   * Supprime définitivement une tâche.
   *
   * @param id - Identifiant de la tâche à supprimer
   * @throws {AxiosError} 403 si l'utilisateur n'est pas éditeur de la liste
   */
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/tasks/${id}`)
  },

  /**
   * Récupère les statistiques agrégées du tableau de bord de l'utilisateur courant.
   * Résultat mis en cache 60 secondes côté serveur.
   *
   * @returns Compteurs par statut, priorité et retards
   */
  getStats: async (): Promise<TaskStats> => {
    const { data } = await axiosInstance.get<ApiResponse<TaskStats>>('/statistics')
    return data.data
  },
} as const
