// =============================================================
// Policy Store — Policies, quotes, activation with SWR caching
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../services/storage';
import { swrFetch } from '../services/cache';
import type { Policy, PolicyQuote } from '../types';

type PolicyTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

interface PolicyState {
  policies: Policy[];
  activePolicy: Policy | null;
  quotes: PolicyQuote[];
  selectedTier: PolicyTier;
  isLoading: boolean;
  isActivating: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchPolicies: () => Promise<void>;
  fetchQuote: () => Promise<void>;
  activatePolicy: (tier: PolicyTier) => Promise<boolean>;
  setSelectedTier: (tier: PolicyTier) => void;
  loadWithCache: () => Promise<void>;
  reset: () => void;
}

const POLICIES_TTL = 120_000; // 2 minutes

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: [],
  activePolicy: null,
  quotes: [],
  selectedTier: 'STANDARD',
  isLoading: false,
  isActivating: false,
  lastFetchedAt: null,

  fetchPolicies: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.policies.list();
      const policies = res.data;
      const active = policies.find(p => p.status === 'ACTIVE') || null;
      set({
        policies,
        activePolicy: active,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchQuote: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.policies.quote();
      set({ quotes: res.quotes, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  activatePolicy: async (tier: PolicyTier) => {
    set({ isActivating: true });
    try {
      const idempotencyKey = `activate-${tier}-${Date.now()}`;
      const res = await apiClient.policies.activate(tier, idempotencyKey);
      if (res.success) {
        
        const matchingQuote = get().quotes.find(q => q.tier === tier);
        
        // Build the coverage multiplier from the tier
        const tierMultiplier = tier === 'BASIC' ? 0.2 : tier === 'STANDARD' ? 0.4 : 0.6;

        const activatedPolicy: Policy = {
              id: res.data.policyId,
              workerId: '',
              status: 'ACTIVE' as const,
              premiumAmount: matchingQuote?.premium_amount || 0,
              coverageMultiplier: tierMultiplier,
              activatedAt: res.data.activatedAt,
              createdAt: new Date().toISOString(),
            };

        set(state => ({
          policies: [activatedPolicy, ...state.policies],
          activePolicy: activatedPolicy,
          isActivating: false,
        }));
        return true;
      }
      set({ isActivating: false });
      return false;
    } catch (e) {
      set({ isActivating: false });
      return false;
    }
  },

  setSelectedTier: (tier) => {
    set({ selectedTier: tier });
  },

  loadWithCache: async () => {
    await swrFetch({
      cacheKey: STORAGE_KEYS.POLICIES,
      ttlMs: POLICIES_TTL,
      fetcher: async () => {
        const res = await apiClient.policies.list();
        return res.data;
      },
      onData: (data) => {
        const active = data.find(p => p.status === 'ACTIVE') || null;
        set({
          policies: data,
          activePolicy: active,
          lastFetchedAt: Date.now(),
        });
      },
    });
  },

  reset: () => {
    set({
      policies: [],
      activePolicy: null,
      quotes: [],
      selectedTier: 'STANDARD',
      isLoading: false,
      isActivating: false,
      lastFetchedAt: null,
    });
  },
}));
