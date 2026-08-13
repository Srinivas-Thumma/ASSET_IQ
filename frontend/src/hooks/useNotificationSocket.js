import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocket } from './useSocket.js';

export const useNotificationSocket = () => {
  const socketRef = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Trigger toast alert
      toast.info(notification.title || 'System Notification', {
        description: notification.message
      });

      // Instantly refresh query cache
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socketRef, queryClient]);
};

export default useNotificationSocket;
