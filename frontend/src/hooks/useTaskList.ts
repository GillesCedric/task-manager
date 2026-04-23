import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskListApi } from "@/api/taskListApi";
import type {
  CreateListPayload,
  TaskListRole,
  UpdateListPayload,
} from "@/types/taskList";

/**
 * @module hooks/useTaskList
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export const LIST_KEYS = {
  all: ["lists"] as const,
  detail: (id: number) => ["lists", id] as const,
};

/** Liste légère pour la sidebar */
export function useTaskLists() {
  return useQuery({
    queryKey: LIST_KEYS.all,
    queryFn: taskListApi.getAll,
    staleTime: 60_000,
  });
}

/** Détail complet avec membres et inviteToken */
export function useTaskList(id: number) {
  return useQuery({
    queryKey: LIST_KEYS.detail(id),
    queryFn: () => taskListApi.getById(id),
    enabled: id > 0,
    staleTime: 30_000,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateListPayload) => taskListApi.create(p),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.all });
      qc.setQueryData(LIST_KEYS.detail(created.id), created);
    },
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateListPayload }) =>
      taskListApi.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(LIST_KEYS.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: LIST_KEYS.all });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskListApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: LIST_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: LIST_KEYS.all });
    },
  });
}

export function useLeaveList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskListApi.leave(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: LIST_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: LIST_KEYS.all });
    },
  });
}

export function useGenerateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: TaskListRole }) =>
      taskListApi.generateInvite(id, role),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.detail(id) });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskListApi.revokeInvite(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.detail(id) });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      memberId,
      role,
    }: {
      listId: number;
      memberId: number;
      role: TaskListRole;
    }) => taskListApi.updateMemberRole(listId, memberId, role),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.detail(listId) });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, memberId }: { listId: number; memberId: number }) =>
      taskListApi.removeMember(listId, memberId),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.detail(listId) });
    },
  });
}
