import { create } from "zustand";

interface UIState {
  modalOpen: boolean;
  loading: boolean;
  toggleModal: () => void;
  setLoading: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  modalOpen: false,
  loading: false,
  toggleModal: () => set((s) => ({ modalOpen: !s.modalOpen })),
  setLoading: (loading) => set({ loading }),
}));
