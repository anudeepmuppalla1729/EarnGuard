// =============================================================
// Claims Store — History, dynamic totals, with SWR caching
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../services/storage';
import { swrFetch } from '../services/cache';
import type { Claim } from '../types';

interface ClaimsState {
  claims: Claim[];
  totalEarned: number;
  pendingCount: number;
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchClaims: () => Promise<void>;
  addClaim: (claim: Claim) => void;
  loadWithCache: () => Promise<void>;
  reset: () => void;
}

const CLAIMS_TTL = 90_000; // 90 seconds

function computeTotals(claims: Claim[]) {
  const approved = claims.filter(c => c.status === 'APPROVED');
  const totalEarned = approved.reduce((sum, c) => sum + c.payoutAmount, 0);
  const pendingCount = claims.filter(c => c.status === 'PENDING').length;
  return { totalEarned, pendingCount };
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: [],
  totalEarned: 0,
  pendingCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  fetchClaims: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.claims.list(1, 50);
      const { totalEarned, pendingCount } = computeTotals(res.data);
      set({
        claims: res.data,
        totalEarned,
        pendingCount,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  /**
   * Add a claim dynamically (from simulation engine)
   */
  addClaim: (claim) => {
    set(state => {
      const updated = [claim, ...state.claims];
      const { totalEarned, pendingCount } = computeTotals(updated);
      return { claims: updated, totalEarned, pendingCount };
    });
  },

  loadWithCache: async () => {
    await swrFetch({
      cacheKey: STORAGE_KEYS.CLAIMS,
      ttlMs: CLAIMS_TTL,
      fetcher: async () => {
        const res = await apiClient.claims.list(1, 50);
        return res.data;
      },
      onData: (data) => {
        const { totalEarned, pendingCount } = computeTotals(data);
        set({
          claims: data,
          totalEarned,
          pendingCount,
          lastFetchedAt: Date.now(),
        });
      },
    });
  },

  reset: () => {
    set({
      claims: [],
      totalEarned: 0,
      pendingCount: 0,
      isLoading: false,
      lastFetchedAt: null,
    });
  },
}));
