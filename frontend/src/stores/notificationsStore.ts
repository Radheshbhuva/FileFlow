import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  type: 'upload' | 'share' | 'profile' | 'security' | 'storage' | 'system';
  read: boolean;
  timestamp: string;
  relativeTime: string;
  message?: string;
  severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

interface NotificationFilters {
  status: 'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED';
  category: 'ALL' | 'UPLOAD' | 'SHARE' | 'PROFILE' | 'SECURITY' | 'STORAGE' | 'SYSTEM';
  severity: 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  searchQuery: string;
}

interface NotificationsState {
  notifications: NotificationItem[];
  addNotification: (title: string, type: NotificationItem['type'], message?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  filters: NotificationFilters;
  setFilters: (filters: Partial<NotificationFilters>) => void;
  resetFilters: () => void;
  selectedNotificationId: string | null;
  setSelectedNotificationId: (id: string | null) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (title, type, message) =>
    set((state) => ({
      notifications: [
        {
          id: `not_${Date.now()}`,
          title,
          type,
          read: false,
          timestamp: new Date().toISOString(),
          relativeTime: 'Just now',
          message,
        },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
  filters: {
    status: 'ALL',
    category: 'ALL',
    severity: 'ALL',
    searchQuery: '',
  },
  setFilters: (updates) => set((state) => ({ filters: { ...state.filters, ...updates } })),
  resetFilters: () =>
    set({
      filters: {
        status: 'ALL',
        category: 'ALL',
        severity: 'ALL',
        searchQuery: '',
      },
    }),
  selectedNotificationId: null,
  setSelectedNotificationId: (id) => set({ selectedNotificationId: id }),
}));
