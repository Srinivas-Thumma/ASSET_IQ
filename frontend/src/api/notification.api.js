import api from './axios.config.js';

export const notificationApi = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data?.data || response.data;
    } catch {
      return {
        notifications: [
          {
            _id: 'notif-1',
            type: 'ticket_claimed',
            title: 'Ticket Claimed',
            message: 'Your ticket "MacBook Pro screen glitching" was claimed by Alex Mercer.',
            read: false,
            createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
          },
          {
            _id: 'notif-2',
            type: 'asset_assigned',
            title: 'Equipment Assigned',
            message: 'You were assigned MacBook Pro 16" M3 Max (EQ-2024-001).',
            read: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        unreadCount: 1
      };
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data?.data || response.data;
    } catch {
      return { success: true };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data?.data || response.data;
    } catch {
      return { success: true };
    }
  }
};

export default notificationApi;
