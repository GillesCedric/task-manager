import axiosInstance from './axiosInstance'
import type { NotificationResponse } from '@/types/notification'

/**
 * @module api/notificationApi
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export const notificationApi = {

  getAll: async (): Promise<NotificationResponse> => {
    const { data } = await axiosInstance.get<NotificationResponse>('/notifications')
    return data
  },

  readAll: async (): Promise<void> => {
    await axiosInstance.post('/notifications/read-all')
  },

  readOne: async (id: number): Promise<void> => {
    await axiosInstance.post(`/notifications/${id}/read`)
  },

} as const