import api from './axios.config.js';

export const personnelApi = {
  getPersonnel: async () => {
    const response = await api.get('/personnel');
    return response.data?.data || response.data;
  },

  getPersonnelById: async (id) => {
    const response = await api.get(`/personnel/${id}`);
    return response.data?.data || response.data;
  },

  createPersonnel: async (data) => {
    const response = await api.post('/personnel', data);
    return response.data?.data || response.data;
  },

  updatePersonnel: async (id, data) => {
    const response = await api.put(`/personnel/${id}`, data);
    return response.data?.data || response.data;
  },

  deletePersonnel: async (id) => {
    const response = await api.delete(`/personnel/${id}`);
    return response.data?.data || response.data;
  },

  getMyOrganization: async () => {
    const response = await api.get('/organizations/me');
    return response.data?.data || response.data;
  }
};

export default personnelApi;
