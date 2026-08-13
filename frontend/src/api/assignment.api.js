import api from './axios.config.js';

export const assignmentApi = {
  getPendingInspections: async () => {
    const response = await api.get('/assignments/inspections');
    return response.data?.data || response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data?.data || response.data;
  },

  assignAsset: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data?.data || response.data;
  },

  initiateReturn: async (assignmentId, returnReason) => {
    const response = await api.post(`/assignments/${assignmentId}/return`, { returnReason });
    return response.data?.data || response.data;
  },

  completeInspection: async (assignmentId, inspectionData) => {
    const response = await api.post(`/assignments/${assignmentId}/inspect`, inspectionData);
    return response.data?.data || response.data;
  }
};

export default assignmentApi;
