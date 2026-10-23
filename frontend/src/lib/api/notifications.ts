import apiClient from './client';

export interface Notification {
  id: string;
  _id?: string; // MongoDB format fallback
  user_id: string;
  agreement_id: string;
  type: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; limit?: number }) => {
    const res = await apiClient.get<{ notifications: Notification[]; unread_count: number }>('/notifications', { params });
    return res.data;
  },
  
  markRead: async (id: string) => {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },
  
  markAllRead: async () => {
    const res = await apiClient.patch<{ updated_count: number }>('/notifications/read-all');
    return res.data;
  }
};
