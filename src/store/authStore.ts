import { create } from "zustand";
import { supabase } from "@/utils/supaBaseClient";

interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any | null) => void;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  fetchUser: async () => {
    const { data } = await supabase.auth.getUser();
    set({ user: data?.user ?? null, loading: false });
  },
}));
