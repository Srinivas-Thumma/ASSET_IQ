import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { assignmentApi } from '../api/assignment.api.js';
import { useAuthStore } from '../stores/auth.store.js';

export const useAssignments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'asset_manager' || user?.role === 'org_admin' || user?.role === 'super_admin';

  const inspectionsQuery = useQuery({
    queryKey: ['assignments', 'inspections'],
    queryFn: () => assignmentApi.getPendingInspections(),
    enabled: Boolean(isManagerOrAdmin)
  });

  const initiateReturnMutation = useMutation({
    mutationFn: ({ assignmentId, reason }) =>
      assignmentApi.initiateReturn(assignmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Return process initiated');
    },
    onError: () => {
      toast.error('Failed to initiate return');
    }
  });

  const completeInspectionMutation = useMutation({
    mutationFn: ({ assignmentId, inspectionData }) =>
      assignmentApi.completeInspection(assignmentId, inspectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Inspection complete');
    },
    onError: () => {
      toast.error('Failed to complete inspection');
    }
  });

  return {
    inspections: inspectionsQuery.data || [],
    isLoading: inspectionsQuery.isLoading,
    initiateReturn: initiateReturnMutation.mutateAsync,
    completeInspection: completeInspectionMutation.mutateAsync
  };
};

export default useAssignments;
