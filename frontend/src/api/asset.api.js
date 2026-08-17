import api from './axios.config.js';

export const assetApi = {
  getAssets: async (params = {}) => {
    const response = await api.get('/assets', { params });
    return response.data?.data || response.data;
  },

  getMyAssets: async () => {
    const response = await api.get('/assets/my');
    return response.data?.data || response.data;
  },

  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data?.data || response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data?.data || response.data;
  },

  createAsset: async (data) => {
    const response = await api.post('/assets', data);
    return response.data?.data || response.data;
  },

  updateAsset: async (id, data) => {
    const response = await api.put(`/assets/${id}`, data);
    return response.data?.data || response.data;
  },

  updateStatus: async (id, status, reason = '') => {
    const response = await api.patch(`/assets/${id}/status`, { status, reason });
    return response.data?.data || response.data;
  },

  retireAsset: async (id) => {
    const response = await api.patch(`/assets/${id}/retire`);
    return response.data?.data || response.data;
  },

  requestRetirement: async (id, reason = '') => {
    const response = await api.post(`/assets/${id}/request-retirement`, { reason });
    return response.data?.data || response.data;
  },

  analyzeAssetHealth: async (id, force = true) => {
    const response = await api.post(`/assets/${id}/analyze${force ? '?force=true' : ''}`);
    return response.data?.data || response.data;
  },

  getWarranties: async (params = {}) => {
    const response = await api.get('/assets/warranties', { params });
    return response.data?.data || response.data;
  },

  getWarrantyStats: async () => {
    const response = await api.get('/assets/warranties/stats');
    return response.data?.data || response.data;
  },

  renewWarranty: async (id, data) => {
    const response = await api.post(`/assets/${id}/warranty/renew`, data);
    return response.data?.data || response.data;
  }
};

export default assetApi;
