import { create } from 'zustand';

export interface ActivityItem {
  id: string;
  type: 'upload' | 'share' | 'download' | 'delete' | 'favorite' | 'profile' | 'settings';
  description: string;
  timestamp: string;
  relativeTime: string;
}

export interface ActivityFilters {
  activityType: string;
  severity: string;
  resourceType: string;
  startDate: string;
  endDate: string;
  search: string;
}

interface ActivityState {
  activities: ActivityItem[];
  logActivity: (type: ActivityItem['type'], description: string) => void;
  clearActivities: () => void;
  filters: ActivityFilters;
  setFilters: (updates: Partial<ActivityFilters>) => void;
  resetFilters: () => void;
  viewMode: 'timeline' | 'table';
  setViewMode: (mode: 'timeline' | 'table') => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

const initialFilters: ActivityFilters = {
  activityType: '',
  severity: '',
  resourceType: '',
  startDate: '',
  endDate: '',
  search: '',
};

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  logActivity: (type, description) =>
    set((state) => ({
      activities: [
        {
          id: `act_${Date.now()}`,
          type,
          description,
          timestamp: new Date().toISOString(),
          relativeTime: 'Just now'
        },
        ...state.activities
      ]
    })),
  clearActivities: () => set({ activities: [] }),
  filters: { ...initialFilters },
  setFilters: (updates) => set((state) => ({ filters: { ...state.filters, ...updates }, page: 1 })),
  resetFilters: () => set({ filters: { ...initialFilters }, page: 1 }),
  viewMode: 'timeline',
  setViewMode: (mode) => set({ viewMode: mode }),
  page: 1,
  setPage: (page) => set({ page }),
  limit: 10,
  setLimit: (limit) => set({ limit, page: 1 }),
}));
