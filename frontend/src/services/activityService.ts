import apiClient from './api/apiClient';

export interface Activity {
  id: string;
  userId?: string;
  activityType: string;
  description: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivitySummary {
  totalActivities: number;
  uploads: number;
  shares: number;
  downloads: number;
  profileChanges: number;
  recentActivityCount: number;
}

export const activityService = {
  listActivities: async (filters: {
    activityType?: string;
    severity?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ListActivitiesResponse> => {
    const res = await apiClient.get('/activity', { params: filters });
    return res.data.data;
  },

  getRecentActivities: async (limit = 10): Promise<Activity[]> => {
    const res = await apiClient.get('/activity/recent', { params: { limit } });
    return res.data.data.activities || [];
  },

  getActivitySummary: async (): Promise<ActivitySummary> => {
    const res = await apiClient.get('/activity/summary');
    return res.data.data.summary;
  },

  getActivity: async (id: string): Promise<Activity> => {
    const res = await apiClient.get(`/activity/${id}`);
    return res.data.data.activity;
  },

  getUserActivities: async (userId: string, filters: any = {}): Promise<ListActivitiesResponse> => {
    const res = await apiClient.get(`/activity/user/${userId}`, { params: filters });
    return res.data.data;
  },
};
