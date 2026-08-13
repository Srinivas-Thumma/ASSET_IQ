import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardApi } from '../api/dashboard.api.js';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 15000
  });
};

export const usePendingApprovals = () => {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => dashboardApi.getPendingApprovals(),
    refetchInterval: 15000
  });
};

export const useExceptionCounts = (options = {}) => {
  return useQuery({
    queryKey: ['exception-counts'],
    queryFn: () => dashboardApi.getExceptionCounts(),
    refetchInterval: 15000,
    ...options
  });
};

export const useApproveProcurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId) => dashboardApi.approveProcurement(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exception-counts'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Procurement request approved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed')
  });
};

export const useRejectProcurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId) => dashboardApi.rejectProcurement(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exception-counts'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Procurement request rejected');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Rejection failed')
  });
};

export const useApproveRetirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId) => dashboardApi.approveRetirement(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exception-counts'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset retirement authorized');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Retirement failed')
  });
};

export const useRejectRetirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId) => dashboardApi.rejectRetirement(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exception-counts'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Retirement request declined, returned to active fleet');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed')
  });
};

export const useDashboard = () => {
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats()
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: () => dashboardApi.getDepartments()
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => dashboardApi.getCategories()
  });

  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: () => dashboardApi.getLocations()
  });

  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => dashboardApi.getVendors()
  });

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => dashboardApi.getEmployees()
  });

  // ─── DEPARTMENTS MUTATIONS ──────────────────────────────────────────────────
  const createDepartmentMutation = useMutation({
    mutationFn: (data) => dashboardApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create department')
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update department')
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id) => dashboardApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete department')
  });

  // ─── CATEGORIES MUTATIONS ───────────────────────────────────────────────────
  const createCategoryMutation = useMutation({
    mutationFn: (data) => dashboardApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category')
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update category')
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => dashboardApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete category')
  });

  // ─── LOCATIONS MUTATIONS ────────────────────────────────────────────────────
  const createLocationMutation = useMutation({
    mutationFn: (data) => dashboardApi.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create location')
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardApi.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update location')
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => dashboardApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete location')
  });

  // ─── VENDORS MUTATIONS ──────────────────────────────────────────────────────
  const createVendorMutation = useMutation({
    mutationFn: (data) => dashboardApi.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create vendor')
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardApi.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update vendor')
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id) => dashboardApi.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete vendor')
  });

  // ─── EMPLOYEES MUTATIONS ────────────────────────────────────────────────────
  const createEmployeeMutation = useMutation({
    mutationFn: (data) => dashboardApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee record created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create employee')
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee record updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update employee')
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => dashboardApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee record deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete employee')
  });

  return {
    metrics: metricsQuery.data || null,
    isMetricsLoading: metricsQuery.isLoading,
    departments: departmentsQuery.data || [],
    categories: categoriesQuery.data || [],
    locations: locationsQuery.data || [],
    vendors: vendorsQuery.data || [],
    employees: employeesQuery.data || [],
    isLoadingMasterData:
      departmentsQuery.isLoading ||
      categoriesQuery.isLoading ||
      locationsQuery.isLoading ||
      vendorsQuery.isLoading ||
      employeesQuery.isLoading,

    // Expose mutations
    createDepartment: createDepartmentMutation.mutateAsync,
    updateDepartment: updateDepartmentMutation.mutateAsync,
    deleteDepartment: deleteDepartmentMutation.mutateAsync,

    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,

    createLocation: createLocationMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
    deleteLocation: deleteLocationMutation.mutateAsync,

    createVendor: createVendorMutation.mutateAsync,
    updateVendor: updateVendorMutation.mutateAsync,
    deleteVendor: deleteVendorMutation.mutateAsync,

    createEmployee: createEmployeeMutation.mutateAsync,
    updateEmployee: updateEmployeeMutation.mutateAsync,
    deleteEmployee: deleteEmployeeMutation.mutateAsync
  };
};

export default useDashboard;
