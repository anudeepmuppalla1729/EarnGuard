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
  currentQuote: PolicyQuote | null;
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
  currentQuote: null,
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
      set({ currentQuote: res.quote, isLoading: false });
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
        // Update policy in local state
        set(state => ({
          policies: state.policies.map(p =>
            p.id === policyId ? { ...p, status: 'ACTIVE' as const, activatedAt: res.data.activatedAt } : p
          ),
          activePolicy: {
            ...state.policies.find(p => p.id === policyId)!,
            status: 'ACTIVE' as const,
            activatedAt: res.data.activatedAt,
          },
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
      currentQuote: null,
      selectedTier: 'STANDARD',
      isLoading: false,
      isActivating: false,
      lastFetchedAt: null,
    });
  },
}));
