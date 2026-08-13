import api from './axios.config.js';

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data?.data || response.data;
  },

  getMetrics: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data?.data || response.data;
  },

  getPendingApprovals: async () => {
    const response = await api.get('/dashboard/pending-approvals');
    return response.data?.data || response.data;
  },

  getExceptionCounts: async () => {
    const response = await api.get('/dashboard/exception-counts');
    return response.data?.data || response.data;
  },

  getExceptions: async () => {
    const response = await api.get('/dashboard/exceptions');
    return response.data?.data || response.data;
  },

  // Approve Procurement Ticket
  approveProcurement: async (ticketId) => {
    const response = await api.patch(`/tickets/${ticketId}/status`, {
      status: 'in_progress',
      resolutionNotes: 'Procurement approved by Organization Administrator.'
    });
    return response.data?.data || response.data;
  },

  // Reject Procurement Ticket
  rejectProcurement: async (ticketId) => {
    const response = await api.patch(`/tickets/${ticketId}/status`, {
      status: 'closed',
      resolutionNotes: 'Procurement request rejected by Organization Administrator.'
    });
    return response.data?.data || response.data;
  },

  // Approve Asset Retirement
  approveRetirement: async (assetId) => {
    const response = await api.patch(`/assets/${assetId}/status`, {
      status: 'retired',
      reason: 'Decommission authorized by Organization Administrator.'
    });
    return response.data?.data || response.data;
  },

  // Reject Asset Retirement (move back to stock or repair)
  rejectRetirement: async (assetId) => {
    const response = await api.patch(`/assets/${assetId}/status`, {
      status: 'stock',
      reason: 'Retirement declined by Organization Administrator. Returned to active stock.'
    });
    return response.data?.data || response.data;
  },

  // ─── DEPARTMENTS ────────────────────────────────────────────────────────────
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data?.data || response.data;
  },

  createDepartment: async (data) => {
    const response = await api.post('/departments', data);
    return response.data?.data || response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data?.data || response.data;
  },

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data?.data || response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/categories', data);
    return response.data?.data || response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data?.data || response.data;
  },

  // ─── LOCATIONS ──────────────────────────────────────────────────────────────
  getLocations: async () => {
    const response = await api.get('/locations');
    return response.data?.data || response.data;
  },

  createLocation: async (data) => {
    const response = await api.post('/locations', data);
    return response.data?.data || response.data;
  },

  updateLocation: async (id, data) => {
    const response = await api.put(`/locations/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteLocation: async (id) => {
    const response = await api.delete(`/locations/${id}`);
    return response.data?.data || response.data;
  },

  // ─── VENDORS ────────────────────────────────────────────────────────────────
  getVendors: async () => {
    const response = await api.get('/vendors');
    return response.data?.data || response.data;
  },

  createVendor: async (data) => {
    const response = await api.post('/vendors', data);
    return response.data?.data || response.data;
  },

  updateVendor: async (id, data) => {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteVendor: async (id) => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data?.data || response.data;
  },

  // ─── EMPLOYEES ──────────────────────────────────────────────────────────────
  getEmployees: async () => {
    const response = await api.get('/employees');
    return response.data?.data || response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post('/employees', data);
    return response.data?.data || response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.patch(`/employees/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data?.data || response.data;
  }
};

export default dashboardApi;
