import api from './axios.config.js';

export const requestApi = {
  createRequest: async (data) => {
    const response = await api.post('/requests', data);
    return response.data?.data || response.data;
  },

  getRequests: async (params = {}) => {
    const response = await api.get('/requests', { params });
    return response.data?.data || response.data;
  },

  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data?.data || response.data;
  },

  getRequest: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data?.data || response.data;
  },

  updateRequestStatus: async (id, data) => {
    const response = await api.patch(`/requests/${id}/status`, data);
    return response.data?.data || response.data;
  },

  approveRequest: async (id, decisionNotes) => {
    const payload = typeof decisionNotes === 'string' ? { decisionNotes } : decisionNotes || {};
    const response = await api.post(`/requests/${id}/approve`, payload);
    return response.data?.data || response.data;
  },

  rejectRequest: async (id, decisionNotes) => {
    const payload = typeof decisionNotes === 'string' ? { decisionNotes } : decisionNotes || {};
    const response = await api.post(`/requests/${id}/reject`, payload);
    return response.data?.data || response.data;
  },

  completeRequest: async (id, decisionNotes) => {
    const payload = typeof decisionNotes === 'string' ? { decisionNotes } : decisionNotes || {};
    const response = await api.post(`/requests/${id}/complete`, payload);
    return response.data?.data || response.data;
  }
};

export default requestApi;
