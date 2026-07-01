import { create } from 'zustand';

export interface SearchFilters {
  fileType?: string;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  favorite?: boolean;
  shareStatus?: 'PRIVATE' | 'SHARED';
  minSecurityScore?: number;
  maxSecurityScore?: number;
  owner?: string;
}

interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  updateFilters: (updates: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  suggestions: string[];
  setSuggestions: (sugs: string[]) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

const getStoredHistory = (): string[] => {
  try {
    const val = localStorage.getItem('fileflow_recent_searches');
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
};

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (q) => set({ query: q, page: 1 }),
  filters: {},
  setFilters: (filters) => set({ filters, page: 1 }),
  updateFilters: (updates) => set((state) => ({ filters: { ...state.filters, ...updates }, page: 1 })),
  resetFilters: () => set({ filters: {}, page: 1 }),
  suggestions: [],
  setSuggestions: (sugs) => set({ suggestions: sugs }),
  recentSearches: getStoredHistory(),
  addRecentSearch: (q) =>
    set((state) => {
      if (!q.trim()) return state;
      const clean = q.trim();
      const filtered = state.recentSearches.filter((x) => x !== clean);
      const updated = [clean, ...filtered].slice(0, 10);
      localStorage.setItem('fileflow_recent_searches', JSON.stringify(updated));
      return { recentSearches: updated };
    }),
  clearRecentSearches: () => {
    localStorage.removeItem('fileflow_recent_searches');
    set({ recentSearches: [] });
  },
  sortBy: 'relevance',
  setSortBy: (field) => set({ sortBy: field }),
  sortOrder: 'desc',
  setSortOrder: (order) => set({ sortOrder: order }),
  page: 1,
  setPage: (page) => set({ page }),
  limit: 10,
  setLimit: (limit) => set({ limit, page: 1 }),
}));
