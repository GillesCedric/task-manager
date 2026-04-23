/**
 * @module hooks/useTask
 * @description Hooks React Query pour les opérations CRUD sur les tâches.
 *
 * **Architecture des clés de cache :**
 * ```
 * ["tasks", filters]          → liste paginée filtrée
 * ["tasks", "detail", id]     → détail d'une tâche
 * ["tasks", "stats"]          → statistiques tableau de bord
 * ```
 *
 * **Optimistic updates sur `useUpdateTask` :**
 * Le hook implémente le pattern optimistic update complet pour le Kanban DnD :
 * 1. `onMutate`  — annule les refetch en cours, snapshot + mise à jour immédiate du cache
 * 2. `onError`   — rollback vers le snapshot si l'API échoue
 * 3. `onSettled` — resynchronisation depuis le serveur après succès ou échec
 *
 * Ce mécanisme évite le "flash-back" visuel lors des déplacements de cartes.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '@/api/taskApi'
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
  Task,
} from '@/types/task'

/**
 * Clés de cache React Query pour les tâches.
 * Centraliser ici permet d'invalider précisément sans magic strings.
 */
export const TASK_KEYS = {
  /** Toutes les listes de tâches — pour invalider globalement */
  all:    (f: TaskFilters)  => ['tasks', f]             as const,
  /** Détail d'une tâche spécifique */
  detail: (id: number)      => ['tasks', 'detail', id]  as const,
  /** Statistiques du tableau de bord */
  stats:  ()                => ['tasks', 'stats']        as const,
}

/**
 * Récupère une page de tâches avec filtres.
 * Données mises en cache 30 secondes (staleTime) — pas de refetch au focus fenêtre.
 *
 * @param filters - Critères de filtrage, tri, pagination et liste cible
 */
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: TASK_KEYS.all(filters),
    queryFn:  () => taskApi.getAll(filters),
    staleTime: 30_000,
    gcTime:    300_000,
  })
}

/**
 * Récupère les statistiques du tableau de bord.
 * Cache 60 secondes — mise à jour peu fréquente.
 */
export function useTaskStats() {
  return useQuery({
    queryKey: TASK_KEYS.stats(),
    queryFn:  taskApi.getStats,
    staleTime: 60_000,
  })
}

/**
 * Mutation pour créer une nouvelle tâche.
 * Invalide toutes les listes de tâches après succès.
 */
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskApi.create(payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }) },
  })
}

/**
 * Mutation avec optimistic update complet pour le Kanban Drag-and-Drop.
 *
 * L'optimistic update met à jour le cache React Query **avant** l'appel API,
 * ce qui rend le déplacement de carte instantané visuellement.
 * Si l'API échoue, `onError` restaure l'état précédent (rollback).
 *
 * @returns Mutation React Query avec gestion d'état optimiste
 */
export function useUpdateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTaskPayload }) =>
      taskApi.update(id, payload),

    /**
     * Exécuté AVANT l'appel API :
     * 1. Annule les refetch en cours pour éviter les conflits de cache
     * 2. Crée un snapshot de toutes les queries `tasks` pour le rollback
     * 3. Met à jour optimistement le cache de toutes les pages
     */
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })

      const previousQueries = qc.getQueriesData<{ tasks: Task[]; pagination: unknown }>({
        queryKey: ['tasks'],
      })

      qc.setQueriesData<{ tasks: Task[]; pagination: unknown }>(
        { queryKey: ['tasks'] },
        (old) => {
          if (!old?.tasks) return old
          return {
            ...old,
            tasks: old.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...(payload.status   !== undefined && { status:   payload.status }),
                    ...(payload.priority !== undefined && { priority: payload.priority }),
                    ...(payload.title    !== undefined && { title:    payload.title }),
                  }
                : task,
            ),
          }
        },
      )

      return { previousQueries }
    },

    /** Rollback : restaure le snapshot si l'API retourne une erreur */
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        qc.setQueryData(key, data)
      })
    },

    /** Resynchronisation depuis le serveur — exécuté après succès ET après échec */
    onSettled: () => { qc.invalidateQueries({ queryKey: ['tasks'] }) },
  })
}

/**
 * Mutation pour supprimer une tâche avec optimistic update.
 * La carte est retirée du cache immédiatement, avant confirmation serveur.
 */
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => taskApi.remove(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const previousQueries = qc.getQueriesData({ queryKey: ['tasks'] })
      qc.setQueriesData<{ tasks: Task[]; pagination: unknown }>(
        { queryKey: ['tasks'] },
        (old) => old?.tasks
          ? { ...old, tasks: old.tasks.filter((t) => t.id !== id) }
          : old,
      )
      return { previousQueries }
    },

    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([key, data]) => qc.setQueryData(key, data))
    },

    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
