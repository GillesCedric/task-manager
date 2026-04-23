import axiosInstance from "./axiosInstance";
import type {
  TaskList,
  TaskListSummary,
  CreateListPayload,
  UpdateListPayload,
  TaskListMember,
  TaskListRole,
} from "@/types/taskList";

/**
 * @module api/taskListApi
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export const taskListApi = {
  /**
   * @function getAll — groupe list:read (léger, sans membres)
   */
  getAll: async (): Promise<TaskListSummary[]> => {
    const { data } = await axiosInstance.get<{
      success: boolean;
      data: TaskListSummary[];
    }>("/lists");
    return data.data;
  },

  /**
   * @function getById — groupe list:detail (avec membres et inviteToken)
   */
  getById: async (id: number): Promise<TaskList> => {
    const { data } = await axiosInstance.get<{
      success: boolean;
      data: TaskList;
    }>(`/lists/${id}`);
    return data.data;
  },

  create: async (payload: CreateListPayload): Promise<TaskList> => {
    const { data } = await axiosInstance.post<{
      success: boolean;
      data: TaskList;
    }>("/lists", payload);
    return data.data;
  },

  update: async (id: number, payload: UpdateListPayload): Promise<TaskList> => {
    const { data } = await axiosInstance.patch<{
      success: boolean;
      data: TaskList;
    }>(`/lists/${id}`, payload);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/lists/${id}`);
  },

  generateInvite: async (
    id: number,
    role: TaskListRole,
  ): Promise<{ token: string; invite_url: string }> => {
    const { data } = await axiosInstance.post(`/lists/${id}/invite`, { role });
    return data;
  },

  revokeInvite: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/lists/${id}/invite`);
  },

  joinByToken: async (token: string): Promise<TaskList> => {
    const { data } = await axiosInstance.post<{
      success: boolean;
      data: TaskList;
    }>(`/lists/join/${token}`);
    return data.data;
  },

  leave: async (id: number): Promise<void> => {
    await axiosInstance.post(`/lists/${id}/leave`);
  },

  updateMemberRole: async (
    listId: number,
    memberId: number,
    role: TaskListRole,
  ): Promise<TaskListMember> => {
    const { data } = await axiosInstance.patch<{
      success: boolean;
      data: TaskListMember;
    }>(`/lists/${listId}/members/${memberId}/role`, { role });
    return data.data;
  },

  removeMember: async (listId: number, memberId: number): Promise<void> => {
    await axiosInstance.delete(`/lists/${listId}/members/${memberId}`);
  },
} as const;
