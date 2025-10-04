import { create } from "zustand";
import type { ImageItem } from "@/types";

interface GalleryState {
  images: ImageItem[];
  searchQuery: string;
  selectedColor: string | null;
  setImages: (images: ImageItem[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedColor: (color: string | null) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  images: [],
  searchQuery: "",
  selectedColor: null,
  setImages: (images) => set({ images }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
}));
