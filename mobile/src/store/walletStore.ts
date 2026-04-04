// =============================================================
// Wallet Store — Balance + Transactions with SWR caching
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../services/storage';
import { swrFetch } from '../services/cache';
import type { WalletTransaction } from '../types';

interface WalletState {
  balance: number;
  currency: string;
  lastUpdatedAt: string | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  creditAmount: (amount: number, claim: { id: string; type: string }) => void;
  loadWithCache: () => Promise<void>;
  reset: () => void;
}

const BALANCE_TTL = 60_000;     // 60 seconds
const TXN_TTL = 120_000;        // 2 minutes

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  currency: 'INR',
  lastUpdatedAt: null,
  transactions: [],
  isLoading: false,
  lastFetchedAt: null,

  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.wallet.getBalance();
      set({
        balance: res.data.balance,
        currency: res.data.currency,
        lastUpdatedAt: res.data.lastUpdatedAt,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const res = await apiClient.wallet.getTransactions(1, 20);
      set({ transactions: res.data });
    } catch (e) {
      console.warn('[WalletStore] fetchTransactions failed:', e);
    }
  },

  /**
   * Simulate a wallet credit (from simulation engine)
   */
  creditAmount: (amount, claim) => {
    const now = new Date().toISOString();
    const newTxn: WalletTransaction = {
      id: `txn-sim-${Date.now()}`,
      amount,
      type: 'CREDIT',
      category: 'CLAIM_PAYOUT',
      referenceId: claim.id,
      createdAt: now,
    };

    set(state => ({
      balance: state.balance + amount,
      transactions: [newTxn, ...state.transactions],
      lastUpdatedAt: now,
    }));
  },

  loadWithCache: async () => {
    // SWR for balance
    await swrFetch({
      cacheKey: STORAGE_KEYS.WALLET_BALANCE,
      ttlMs: BALANCE_TTL,
      fetcher: async () => {
        const res = await apiClient.wallet.getBalance();
        return res.data;
      },
      onData: (data) => {
        set({
          balance: data.balance,
          currency: data.currency,
          lastUpdatedAt: data.lastUpdatedAt,
          lastFetchedAt: Date.now(),
        });
      },
    });

    // Fetch transactions in background
    get().fetchTransactions();
  },

  reset: () => {
    set({
      balance: 0,
      currency: 'INR',
      lastUpdatedAt: null,
      transactions: [],
      isLoading: false,
      lastFetchedAt: null,
    });
  },
}));
