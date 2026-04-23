import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/api/notificationApi";

/**
 * @module hooks/useNotification
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

const NOTIF_KEYS = { all: ["notifications"] as const };

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.all,
    queryFn: notificationApi.getAll,
    // Polling toutes les 30s pour les nouvelles notifications
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useReadAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.readAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.all }),
  });
}
