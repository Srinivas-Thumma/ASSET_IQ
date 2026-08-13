import api from './axios.config.js';

export const adminApi = {
  getOrganizations: async () => {
    const response = await api.get('/admin/organizations');
    return response.data?.data || response.data;
  },

  getOrganizationById: async (id) => {
    const response = await api.get(`/admin/organizations/${id}`);
    return response.data?.data || response.data;
  },

  createOrganization: async (data) => {
    const response = await api.post('/admin/organizations', data);
    return response.data?.data || response.data;
  },

  updateOrganization: async (id, data) => {
    const response = await api.put(`/admin/organizations/${id}`, data);
    return response.data?.data || response.data;
  },

  updateOrganizationStatus: async (id, status) => {
    const response = await api.patch(`/admin/organizations/${id}/status`, { status });
    return response.data?.data || response.data;
  },

  deleteOrganization: async (id) => {
    const response = await api.delete(`/admin/organizations/${id}`);
    return response.data?.data || response.data;
  },

  bulkUpdateStatus: async (ids, status) => {
    const response = await api.post('/admin/organizations/bulk-status', { ids, status });
    return response.data?.data || response.data;
  },

  bulkUpdatePlan: async (ids, planId) => {
    const response = await api.post('/admin/organizations/bulk-plan', { ids, planId });
    return response.data?.data || response.data;
  },

  bulkDelete: async (ids) => {
    const response = await api.post('/admin/organizations/bulk-delete', { ids });
    return response.data?.data || response.data;
  },

  getPlans: async () => {
    const response = await api.get('/admin/plans');
    return response.data?.data || response.data;
  },

  createPlan: async (data) => {
    const response = await api.post('/admin/plans', data);
    return response.data?.data || response.data;
  },

  updatePlan: async (id, data) => {
    const response = await api.put(`/admin/plans/${id}`, data);
    return response.data?.data || response.data;
  },

  deletePlan: async (id) => {
    const response = await api.delete(`/admin/plans/${id}`);
    return response.data?.data || response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data?.data || response.data;
  },

  searchGlobal: async (query) => {
    const response = await api.get('/admin/search', { params: { q: query } });
    return response.data?.data || response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/admin/alerts');
    return response.data?.data || response.data;
  },

  getActivity: async () => {
    const response = await api.get('/admin/activity');
    return response.data?.data || response.data;
  }
};

export default adminApi;
