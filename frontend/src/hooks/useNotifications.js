import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi from '../api/notification.api.js';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.notifications)) return res.notifications;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },
    refetchInterval: 15000
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    data: notifications,
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllRead: markAllAsReadMutation.mutateAsync
  };
};

export default useNotifications;
