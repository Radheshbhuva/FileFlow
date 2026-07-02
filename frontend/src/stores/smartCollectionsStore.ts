import { create } from 'zustand';

interface SmartCollectionsState {
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
}

export const useSmartCollectionsStore = create<SmartCollectionsState>((set) => ({
  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id })
}));
