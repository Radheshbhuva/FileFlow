import { create } from 'zustand';
import type { File, FileFilter } from '../types/files';

export type ViewMode = 'grid' | 'list' | 'table';

// Centralized Files Database Store
interface FilesState {
  files: File[];
  addFile: (file: File) => void;
  deleteFiles: (ids: string[]) => void;
  renameFile: (id: string, name: string) => void;
  archiveFiles: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  shareFile: (id: string, emails: string[]) => void;
  incrementDownload: (id: string) => void;
}

// No seed data — all files are loaded from the backend via TanStack Query.
// useFilesStore is only used for lightweight optimistic local state.
const initialFiles: File[] = [];

export const useFilesStore = create<FilesState>((set) => ({
  files: initialFiles,
  addFile: (file) => set((state) => ({ files: [file, ...state.files] })),
  deleteFiles: (ids) => set((state) => ({ files: state.files.filter((f) => !ids.includes(f.id)) })),
  renameFile: (id, name) =>
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        const extIdx = name.lastIndexOf('.');
        const ext = extIdx !== -1 ? name.substring(extIdx + 1) : f.extension;
        return { ...f, name, extension: ext, lastModified: new Date().toISOString() };
      })
    })),
  archiveFiles: (ids) =>
    set((state) => ({
      // remove from active files view
      files: state.files.filter((f) => !ids.includes(f.id))
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, isFavorite: !f.isFavorite } : f))
    })),
  shareFile: (id, emails) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              shareCount: f.shareCount + emails.length,
              sharedStatus: 'team' as const,
              lastModified: new Date().toISOString()
            }
          : f
      )
    })),
  incrementDownload: (id) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, downloadCount: f.downloadCount + 1 } : f))
    }))
}));

// View Layout Store
interface ViewState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewMode: (localStorage.getItem('fileflow_view_mode') as ViewMode) || 'table',
  setViewMode: (mode) => {
    localStorage.setItem('fileflow_view_mode', mode);
    set({ viewMode: mode });
  }
}));

// Selection Store
interface SelectionState {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id]
    })),
  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] })
}));

// Filter Store
interface FilterState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FileFilter;
  setFilters: (filters: FileFilter) => void;
  resetFilters: () => void;
  filterPanelOpen: boolean;
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
}

export const initialFilters: FileFilter = {
  type: [],
  status: [],
  sharedStatus: [],
  minSecurityScore: 0,
  minSize: undefined,
  maxSize: undefined,
  owner: [],
  recentlyModified: false,
  dateRange: { start: '', end: '' }
};

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  filters: initialFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
  resetFilters: () => set({ searchQuery: '', filters: initialFilters }),
  filterPanelOpen: false,
  toggleFilterPanel: () => set((state) => ({ filterPanelOpen: !state.filterPanelOpen })),
  setFilterPanelOpen: (open) => set({ filterPanelOpen: open })
}));

// Preview Store
interface PreviewState {
  activePreviewFile: File | null;
  openPreview: (file: File) => void;
  closePreview: () => void;
  activeDetailsFile: File | null;
  openDetails: (file: File) => void;
  closeDetails: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  activePreviewFile: null,
  openPreview: (file) => set({ activePreviewFile: file }),
  closePreview: () => set({ activePreviewFile: null }),
  activeDetailsFile: null,
  openDetails: (file) => set({ activeDetailsFile: file }),
  closeDetails: () => set({ activeDetailsFile: null })
}));

// Sorting Store
interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const useSortStore = create<SortState>((set) => ({
  sortBy: 'lastModified',
  sortOrder: 'desc',
  setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder })
}));
