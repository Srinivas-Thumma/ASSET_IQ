import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket.js';

export const useTicketSocket = (ticketId) => {
  const socketRef = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !ticketId) return;

    socket.emit('join-ticket', ticketId);

    const handleNewMessage = (message) => {
      // Instantly update ticket detail query cache
      queryClient.setQueryData(['tickets', ticketId], (oldTicket) => {
        if (!oldTicket) return oldTicket;
        const existingMessages = oldTicket.messages || [];
        if (existingMessages.some((m) => m._id === message._id)) {
          return oldTicket;
        }
        return {
          ...oldTicket,
          messages: [...existingMessages, message]
        };
      });

      // Update independent messages query cache if exists
      queryClient.setQueryData(['messages', ticketId], (old) => {
        if (!old) return [message];
        if (old.some((m) => m._id === message._id)) return old;
        return [...old, message];
      });

      // Refresh tickets list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.emit('leave-ticket', ticketId);
      socket.off('new-message', handleNewMessage);
    };
  }, [socketRef, ticketId, queryClient]);
};

export default useTicketSocket;
