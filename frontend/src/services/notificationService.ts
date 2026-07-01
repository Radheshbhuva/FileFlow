import apiClient from './api/apiClient';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'upload' | 'share' | 'profile' | 'security' | 'storage' | 'system';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

export const mapBackendNotification = (n: any): NotificationRecord => {
  const typeMap: Record<string, NotificationRecord['type']> = {
    FILE_UPLOADED: 'upload',
    FILE_SHARED: 'share',
    FILE_DOWNLOADED: 'share',
    SHARE_EXPIRED: 'share',
    SHARE_REVOKED: 'share',
    SECURITY_ALERT: 'security',
    STORAGE_WARNING: 'storage',
    PROFILE_UPDATED: 'profile',
    PASSWORD_CHANGED: 'profile',
    SYSTEM_MESSAGE: 'system',
  };

  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: typeMap[n.notificationType] || 'system',
    severity: n.severity || 'INFO',
    status: n.status || 'UNREAD',
    createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    readAt: n.readAt ? new Date(n.readAt).toISOString() : undefined,
    metadata: n.metadata,
  };
};

export const notificationService = {
  getNotifications: async (filters: { status?: string; limit?: number; page?: number } = {}): Promise<NotificationRecord[]> => {
    const params: any = {};
    if (filters.status && filters.status !== 'ALL') {
      params.status = filters.status;
    }
    const res = await apiClient.get('/notifications', { params });
    const notifications = res.data.data.notifications || [];
    return notifications.map(mapBackendNotification);
  },

  getUnreadNotifications: async (): Promise<NotificationRecord[]> => {
    const res = await apiClient.get('/notifications/unread');
    const notifications = res.data.data.notifications || [];
    return notifications.map(mapBackendNotification);
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return mapBackendNotification(res.data.data.notification);
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data.data;
  },

  archiveNotification: async (id: string): Promise<NotificationRecord> => {
    const res = await apiClient.patch(`/notifications/${id}/archive`);
    return mapBackendNotification(res.data.data.notification);
  },

  getSummary: async (): Promise<{
    totalNotifications: number;
    unreadCount: number;
    criticalAlertsCount: number;
    recentNotifications: NotificationRecord[];
  }> => {
    const res = await apiClient.get('/notifications/summary');
    const summary = res.data.data.summary || {};
    return {
      totalNotifications: summary.totalNotifications || 0,
      unreadCount: summary.unreadCount || 0,
      criticalAlertsCount: summary.criticalAlertsCount || 0,
      recentNotifications: (summary.recentNotifications || []).map(mapBackendNotification),
    };
  },
};
