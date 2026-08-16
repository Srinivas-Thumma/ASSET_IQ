import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ticketApi } from '../api/ticket.api.js';

export const useTickets = (ticketId = null) => {
  const queryClient = useQueryClient();

  const isSpecificTicket = Boolean(ticketId && ticketId !== 'undefined');

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.getTickets(),
    enabled: !isSpecificTicket,
    staleTime: 5000,
    refetchInterval: 10000
  });

  const myTicketsQuery = useQuery({
    queryKey: ['tickets', 'my'],
    queryFn: () => ticketApi.getMyTickets(),
    enabled: !isSpecificTicket,
    staleTime: 5000,
    refetchInterval: 10000
  });

  const ticketDetailQuery = useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => ticketApi.getTicketById(ticketId),
    enabled: isSpecificTicket,
    staleTime: 5000,
    refetchInterval: 6000
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => ticketApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket submitted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    }
  });

  const claimTicketMutation = useMutation({
    mutationFn: ({ id, priority }) => ticketApi.claimTicket(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Ticket claimed successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to claim ticket');
    }
  });

  const resolveTicketMutation = useMutation({
    mutationFn: ({ id, resolutionNotes, assetStateChange }) =>
      ticketApi.resolveTicket(id, { resolutionNotes, assetStateChange }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Ticket marked as resolved');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resolve ticket');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolutionNotes, assetStateChange }) =>
      ticketApi.updateTicketStatus(id, status, resolutionNotes, assetStateChange),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.success('Ticket status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update ticket status');
    }
  });

  const escalateTicketMutation = useMutation({
    mutationFn: (id) => ticketApi.escalateTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
      toast.warning('Ticket escalated to Senior Engineering / Vendor SLA tier');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to escalate ticket');
    }
  });

  const addMessageMutation = useMutation({
    mutationFn: ({ ticketId: tId, message, isInternal }) =>
      ticketApi.addMessage(tId, message, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] });
    }
  });

  return {
    tickets: ticketsQuery.data || [],
    isLoading: ticketsQuery.isLoading,
    myTickets: myTicketsQuery.data || [],
    isMyTicketsLoading: myTicketsQuery.isLoading,
    ticket: ticketDetailQuery.data || null,
    isDetailLoading: ticketDetailQuery.isLoading,
    createTicket: createTicketMutation.mutateAsync,
    claimTicket: claimTicketMutation.mutateAsync,
    resolveTicket: resolveTicketMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    escalateTicket: escalateTicketMutation.mutateAsync,
    isEscalating: escalateTicketMutation.isPending,
    isResolving: resolveTicketMutation.isPending,
    addMessage: addMessageMutation.mutateAsync
  };
};

export default useTickets;
