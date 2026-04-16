// =============================================================
// Dashboard Store — Aggregated HomeScreen data with SWR caching
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../services/storage';
import { swrFetch } from '../services/cache';
import type { DashboardData } from '../types';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  loadWithCache: () => Promise<void>;
  reset: () => void;
}

const DASHBOARD_TTL = 60_000; // 60 seconds

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  lastFetchedAt: null,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.dashboard.get();
      set({
        data: res.data,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      console.warn('[DashboardStore] fetchDashboard failed:', e);
      set({ isLoading: false });
    }
  },

  loadWithCache: async () => {
    await swrFetch({
      cacheKey: STORAGE_KEYS.WALLET_BALANCE + '_dashboard',
      ttlMs: DASHBOARD_TTL,
      fetcher: async () => {
        const res = await apiClient.dashboard.get();
        return res.data;
      },
      onData: (data) => {
        set({
          data,
          lastFetchedAt: Date.now(),
        });
      },
    });
  },

  reset: () => {
    set({
      data: null,
      isLoading: false,
      lastFetchedAt: null,
    });
  },
}));
