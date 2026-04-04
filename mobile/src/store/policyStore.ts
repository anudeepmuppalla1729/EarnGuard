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
  activatePolicy: (policyId: string) => Promise<boolean>;
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

  activatePolicy: async (policyId) => {
    set({ isActivating: true });
    try {
      const idempotencyKey = `activate-${policyId}-${Date.now()}`;
      const res = await apiClient.policies.activate(policyId, idempotencyKey);
      if (res.success) {
        // Try to find from policies list first, then fallback to quotes
        const state = get();
        const existingPolicy = state.policies.find(p => p.id === policyId);
        const matchingQuote = state.quotes.find(q => q.policyId === policyId);

        // Build the coverage multiplier from the quote tier
        const tierMultiplier = matchingQuote
          ? (matchingQuote.tier === 'BASIC' ? 0.2 : matchingQuote.tier === 'STANDARD' ? 0.4 : 0.6)
          : 0;

        const activatedPolicy: Policy = existingPolicy
          ? { ...existingPolicy, status: 'ACTIVE' as const, activatedAt: res.data.activatedAt }
          : {
              id: policyId,
              workerId: '',
              status: 'ACTIVE' as const,
              premiumAmount: matchingQuote?.premium_amount || 0,
              coverageMultiplier: tierMultiplier,
              activatedAt: res.data.activatedAt,
              createdAt: new Date().toISOString(),
            };

        set({
          policies: state.policies.map(p =>
            p.id === policyId ? { ...p, status: 'ACTIVE' as const, activatedAt: res.data.activatedAt } : p
          ),
          activePolicy: activatedPolicy,
          isActivating: false,
        });
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
