import { create } from 'zustand';
import { mapBackendShareToShareRecord } from '../services/shareService';

export { mapBackendShareToShareRecord };

export interface ShareRecord {
  id: string;
  fileId: string;
  fileName: string;
  sharedWith: string;
  shareDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'revoked';
  shareLink: string;
  downloadCount: number;
  passwordProtected?: boolean;
  accessLevel?: string;
  maxDownloads?: number;
}

interface SharesState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  passwordFilter: string; // '' | 'true' | 'false'
  setPasswordFilter: (val: string) => void;
  accessLevelFilter: string;
  setAccessLevelFilter: (val: string) => void;
  selectedShareId: string | null;
  setSelectedShareId: (id: string | null) => void;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

export const useSharesStore = create<SharesState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
  statusFilter: '',
  setStatusFilter: (status) => set({ statusFilter: status, page: 1 }),
  passwordFilter: '',
  setPasswordFilter: (val) => set({ passwordFilter: val, page: 1 }),
  accessLevelFilter: '',
  setAccessLevelFilter: (val) => set({ accessLevelFilter: val, page: 1 }),
  selectedShareId: null,
  setSelectedShareId: (id) => set({ selectedShareId: id }),
  page: 1,
  setPage: (page) => set({ page }),
  limit: 10,
  setLimit: (limit) => set({ limit, page: 1 }),
  sortBy: 'createdAt',
  setSortBy: (field) => set({ sortBy: field }),
  sortOrder: 'desc',
  setSortOrder: (order) => set({ sortOrder: order }),
  resetFilters: () =>
    set({
      searchQuery: '',
      statusFilter: '',
      passwordFilter: '',
      accessLevelFilter: '',
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
}));
