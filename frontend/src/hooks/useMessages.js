import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ticketApi } from '../api/ticket.api.js';

export const useMessages = (ticketId) => {
  const queryClient = useQueryClient();

  const addMessageMutation = useMutation({
    mutationFn: ({ message, isInternal }) =>
      ticketApi.addMessage(ticketId, message, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Message sent');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  });

  return {
    sendMessage: addMessageMutation.mutateAsync,
    isSending: addMessageMutation.isPending
  };
};

export default useMessages;
