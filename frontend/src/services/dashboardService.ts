import apiClient from './api/apiClient';
import type {
  BackendWorkspaceOverview,
  BackendStorageIntelligence,
  BackendSecurityIntelligence,
  BackendProductivityInsights,
  BackendDashboardInsights,
  BackendDashboardNotification,
  BackendActivity
} from '../types/dashboard';

export const dashboardService = {
  /**
   * Retrieves workspace overview metrics from the backend.
   */
  getWorkspaceOverview: async (): Promise<BackendWorkspaceOverview> => {
    const res = await apiClient.get('/dashboard/overview');
    return res.data.data;
  },

  /**
   * Retrieves storage intelligence insights from the backend.
   */
  getStorageInsights: async (): Promise<BackendStorageIntelligence> => {
    const res = await apiClient.get('/dashboard/storage');
    return res.data.data;
  },

  /**
   * Retrieves security intelligence insights from the backend.
   */
  getSecurityInsights: async (): Promise<BackendSecurityIntelligence> => {
    const res = await apiClient.get('/dashboard/security');
    return res.data.data;
  },

  /**
   * Retrieves productivity insights from the backend.
   */
  getProductivityInsights: async (): Promise<BackendProductivityInsights> => {
    const res = await apiClient.get('/dashboard/productivity');
    return res.data.data;
  },

  /**
   * Retrieves recent activity log from the backend.
   */
  getRecentActivity: async (): Promise<BackendActivity[]> => {
    const res = await apiClient.get('/dashboard/recent-activity');
    return res.data.data;
  },

  /**
   * Retrieves dashboard notifications/alerts from the backend.
   */
  getNotifications: async (): Promise<BackendDashboardNotification[]> => {
    const res = await apiClient.get('/dashboard/notifications');
    return res.data.data;
  },

  /**
   * Retrieves strategic dashboard insights from the backend.
   */
  getDashboardInsights: async (): Promise<BackendDashboardInsights> => {
    const res = await apiClient.get('/dashboard/insights');
    return res.data.data;
  }
};

