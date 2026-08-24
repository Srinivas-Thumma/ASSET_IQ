import api from './axios.config.js';

export const conversationApi = {
  getOrganizationConversation: async (organizationId) => {
    const params = organizationId ? { organizationId } : {};
    const response = await api.get('/conversations/organization', { params });
    return response.data?.data || response.data;
  },

  getConversationById: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data?.data || response.data;
  },

  getConversation: async (id) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data?.data || response.data;
  },

  getConversationMessages: async (id) => {
    const response = await api.get(`/conversations/${id}/messages`);
    return response.data?.data || response.data;
  },

  getMessages: async (id) => {
    const response = await api.get(`/conversations/${id}/messages`);
    return response.data?.data || response.data;
  },

  sendMessage: async (id, dataOrContent, isInternal = false) => {
    let payload;
    if (typeof dataOrContent === 'string') {
      payload = { content: dataOrContent, isInternal };
    } else if (typeof dataOrContent === 'object' && dataOrContent !== null) {
      payload = dataOrContent;
    } else {
      payload = { content: '', isInternal };
    }
    const response = await api.post(`/conversations/${id}/messages`, payload);
    return response.data?.data || response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/conversations/${id}/read`);
    return response.data?.data || response.data;
  }
};

export default conversationApi;
