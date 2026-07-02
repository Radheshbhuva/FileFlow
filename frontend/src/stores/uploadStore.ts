import { create } from 'zustand';
import type { UploadFile, UploadQueueItem, ValidationError, UploadSummary, UploadStatus } from '../types/upload';

interface UploadState {
  selectedFiles: UploadFile[];
  queue: UploadQueueItem[];
  validationErrors: ValidationError[];
  history: UploadQueueItem[];
  summary: UploadSummary | null;
  activeDetailsItem: UploadQueueItem | null;
  
  // Actions
  setSelectedFiles: (files: UploadFile[]) => void;
  addToQueue: (items: UploadQueueItem[]) => void;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<UploadQueueItem>) => void;
  clearQueue: () => void;
  addValidationErrors: (errors: ValidationError[]) => void;
  removeValidationError: (id: string) => void;
  clearValidationErrors: () => void;
  setSummary: (summary: UploadSummary | null) => void;
  addToHistory: (item: UploadQueueItem) => void;
  clearHistory: () => void;
  setActiveDetailsItem: (item: UploadQueueItem | null) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  selectedFiles: [],
  queue: [],
  validationErrors: [],
  history: [],
  summary: null,
  activeDetailsItem: null,

  setSelectedFiles: (files) => set({ selectedFiles: files }),
  addToQueue: (items) => set((state) => ({ queue: [...state.queue, ...items] })),
  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((x) => x.id !== id),
      activeDetailsItem: state.activeDetailsItem?.id === id ? null : state.activeDetailsItem
    })),
  updateQueueItem: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((x) => (x.id === id ? { ...x, ...updates } : x)),
      activeDetailsItem:
        state.activeDetailsItem?.id === id ? { ...state.activeDetailsItem, ...updates } : state.activeDetailsItem
    })),
  clearQueue: () => set({ queue: [], activeDetailsItem: null, summary: null }),
  addValidationErrors: (errors) => set((state) => ({ validationErrors: [...state.validationErrors, ...errors] })),
  removeValidationError: (id) =>
    set((state) => ({ validationErrors: state.validationErrors.filter((x) => x.id !== id) })),
  clearValidationErrors: () => set({ validationErrors: [] }),
  setSummary: (summary) => set({ summary }),
  addToHistory: (item) => set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
  setActiveDetailsItem: (item) => set({ activeDetailsItem: item })
}));
