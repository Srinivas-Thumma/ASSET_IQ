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

  resolveTicket: async (id, dataOrNotes = {}) => {
    let payload;
    if (typeof dataOrNotes === 'string') {
      payload = { resolutionNotes: dataOrNotes };
    } else if (typeof dataOrNotes === 'object' && dataOrNotes !== null) {
      payload = dataOrNotes;
    } else {
      payload = {};
    }
    const response = await api.patch(`/tickets/${id}/resolve`, payload);
    return response.data?.data || response.data;
  },

  updateTicketStatus: async (id, statusOrData, resolutionNotes = '', assetStateChange) => {
    let payload;
    if (typeof statusOrData === 'object' && statusOrData !== null) {
      payload = statusOrData;
    } else {
      payload = { status: statusOrData, resolutionNotes, assetStateChange };
    }
    const response = await api.patch(`/tickets/${id}/status`, payload);
    return response.data?.data || response.data;
  },

  escalateTicket: async (id) => {
    const response = await api.post(`/tickets/${id}/escalate`);
    return response.data?.data || response.data;
  },

  getMessages: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/messages`);
    return response.data?.data || response.data;
  },

  sendMessage: async (ticketId, dataOrMessage, isInternal = false) => {
    let payload;
    if (typeof dataOrMessage === 'string') {
      payload = { message: dataOrMessage, isInternal };
    } else if (typeof dataOrMessage === 'object' && dataOrMessage !== null) {
      payload = dataOrMessage;
    } else {
      payload = { message: '', isInternal };
    }
    const response = await api.post(`/tickets/${ticketId}/messages`, payload);
    return response.data?.data || response.data;
  },

  addMessage: async (ticketId, dataOrMessage, isInternal = false) => {
    let payload;
    if (typeof dataOrMessage === 'string') {
      payload = { message: dataOrMessage, isInternal };
    } else if (typeof dataOrMessage === 'object' && dataOrMessage !== null) {
      payload = dataOrMessage;
    } else {
      payload = { message: '', isInternal };
    }
    const response = await api.post(`/tickets/${ticketId}/messages`, payload);
    return response.data?.data || response.data;
  }
};

export default ticketApi;
