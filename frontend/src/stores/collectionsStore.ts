import { create } from 'zustand';

export interface CollectionsFilters {
  fileType: string;
  startDate: string;
  endDate: string;
  favoriteOnly: boolean;
  searchText: string;
}

interface CollectionsState {
  activeCollectionId: 'recently-modified' | 'shared-recently' | 'favorites' | 'large-files' | 'needs-attention' | null;
  setActiveCollectionId: (id: 'recently-modified' | 'shared-recently' | 'favorites' | 'large-files' | 'needs-attention' | null) => void;
  filters: CollectionsFilters;
  setFilters: (updates: Partial<CollectionsFilters>) => void;
  resetFilters: () => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

const initialFilters: CollectionsFilters = {
  fileType: '',
  startDate: '',
  endDate: '',
  favoriteOnly: false,
  searchText: '',
};

export const useCollectionsStore = create<CollectionsState>((set) => ({
  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id, sortBy: 'name', sortOrder: 'asc', filters: { ...initialFilters } }),
  filters: { ...initialFilters },
  setFilters: (updates) => set((state) => ({ filters: { ...state.filters, ...updates } })),
  resetFilters: () => set({ filters: { ...initialFilters } }),
  sortBy: 'name',
  setSortBy: (field) => set({ sortBy: field }),
  sortOrder: 'asc',
  setSortOrder: (order) => set({ sortOrder: order }),
}));
