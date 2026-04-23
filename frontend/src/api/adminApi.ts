import axiosInstance from './axiosInstance'
import type { AdminStats, AppLog, AdminPagination } from '@/types/admin'
import type { User } from '@/types/auth'

/**
 * @module api/adminApi
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: AdminStats }>('/admin/stats')
    return data.data
  },

  getUsers: async (page = 1, perPage = 20, search?: string): Promise<{ data: User[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('search', search)
    const { data } = await axiosInstance.get<{ success: boolean; data: User[]; pagination: AdminPagination }>(`/admin/users?${params}`)
    return { data: data.data, pagination: data.pagination }
  },

  updateUser: async (id: number, payload: Partial<{ name: string; email: string; roles: string[]; password: string }>): Promise<User> => {
    const { data } = await axiosInstance.patch<{ success: boolean; data: User }>(`/admin/users/${id}`, payload)
    return data.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${id}`)
  },

  getLogs: async (page = 1, perPage = 50, level?: string): Promise<{ data: AppLog[]; pagination: AdminPagination }> => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (level) params.set('level', level)
    const { data } = await axiosInstance.get<{ success: boolean; data: AppLog[]; pagination: AdminPagination }>(`/admin/logs?${params}`)
    return { data: data.data, pagination: data.pagination }
  },

  clearLogs: async (level?: string): Promise<void> => {
    const params = level ? `?level=${level}` : ''
    await axiosInstance.delete(`/admin/logs${params}`)
  },

  sendClientLog: async (level: 'error' | 'warning' | 'info', message: string, context?: Record<string, unknown>): Promise<void> => {
    await axiosInstance.post('/admin/logs/client', { level, message, context })
  },
} as const
