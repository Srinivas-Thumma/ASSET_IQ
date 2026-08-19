import api from './axios.config.js';

export const ticketApi = {
  getTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data?.data || response.data;
  },

  getMyTickets: async () => {
    const response = await api.get('/tickets/my');
    return response.data?.data || response.data;
  },

  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data?.data || response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data?.data || response.data;
  },

  createTicket: async (data) => {
    const response = await api.post('/tickets', data);
    return response.data?.data || response.data;
  },

  create: async (data) => {
    const response = await api.post('/tickets', data);
    return response.data?.data || response.data;
  },

  claimTicket: async (id, priority) => {
    const response = await api.patch(`/tickets/${id}/claim`, { priority });
    return response.data?.data || response.data;
  },

  resolveTicket: async (id, { resolutionNotes = '', assetStateChange } = {}) => {
    const response = await api.patch(`/tickets/${id}/resolve`, { resolutionNotes, assetStateChange });
    return response.data?.data || response.data;
  },

  updateTicketStatus: async (id, status, resolutionNotes = '', assetStateChange) => {
    const response = await api.patch(`/tickets/${id}/status`, { status, resolutionNotes, assetStateChange });
    return response.data?.data || response.data;
  },

  escalateTicket: async (id) => {
    const response = await api.post(`/tickets/${id}/escalate`);
    return response.data?.data || response.data;
  },

  addMessage: async (ticketId, message, isInternal = false) => {
    const response = await api.post(`/tickets/${ticketId}/messages`, { message, isInternal });
    return response.data?.data || response.data;
  }
};

export default ticketApi;
