import { create } from 'zustand';
import { apiClient } from '../api/client';

interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: any | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  isLoading: false,

  login: async (email, pass) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.auth.login(email, pass);
      set({ 
        isAuthenticated: true, 
        accessToken: res.data.accessToken,
        isLoading: false 
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    set({ isAuthenticated: false, accessToken: null, user: null });
  },

  fetchProfile: async () => {
    try {
      const res = await apiClient.workers.me();
      set({ user: res.data });
    } catch (e) {
      console.error(e);
    }
  }
}));
