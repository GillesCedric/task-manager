import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'

/**
 * @module hooks/useAdmin
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

const ADMIN_KEYS = {
  stats:  ['admin', 'stats'] as const,
  users:  (page: number, search?: string) => ['admin', 'users', page, search] as const,
  logs:   (page: number, level?: string)  => ['admin', 'logs',  page, level]  as const,
}

export function useAdminStats() {
  return useQuery({ queryKey: ADMIN_KEYS.stats, queryFn: adminApi.getStats, staleTime: 30_000 })
}

export function useAdminUsers(page = 1, search?: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(page, search),
    queryFn:  () => adminApi.getUsers(page, 20, search),
    staleTime: 15_000,
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats })
    },
  })
}

export function useAdminLogs(page = 1, level?: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.logs(page, level),
    queryFn:  () => adminApi.getLogs(page, 50, level),
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

export function useClearLogs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (level?: string) => adminApi.clearLogs(level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'logs'] })
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.stats })
    },
  })
}
