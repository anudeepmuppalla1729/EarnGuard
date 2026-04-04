// =============================================================
// Storage Service — SecureStore (tokens) + AsyncStorage (cache)
// =============================================================
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Secure Storage (tokens, sensitive data) ─────────────────────

export const SecureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('[SecureStorage] set failed:', key, e);
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('[SecureStorage] get failed:', key, e);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStorage] remove failed:', key, e);
    }
  },
};

// ── Cache Storage (non-sensitive, with TTL metadata) ────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number; // ms since epoch
}

export const CacheStorage = {
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('[CacheStorage] set failed:', key, e);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch (e) {
      console.warn('[CacheStorage] get failed:', key, e);
      return null;
    }
  },

  async getWithMeta<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(`cache_${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch (e) {
      console.warn('[CacheStorage] getWithMeta failed:', key, e);
      return null;
    }
  },

  isStale(timestamp: number, ttlMs: number): boolean {
    return Date.now() - timestamp > ttlMs;
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('[CacheStorage] remove failed:', key, e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      console.warn('[CacheStorage] clearAll failed:', e);
    }
  },
};

// ── Storage Keys (constants) ────────────────────────────────────

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'earnguard_access_token',
  REFRESH_TOKEN: 'earnguard_refresh_token',
  SESSION_EXPIRY: 'earnguard_session_expiry',
  BIOMETRIC_ENABLED: 'earnguard_biometric_enabled',
  USER_PROFILE: 'user_profile',
  WALLET_BALANCE: 'wallet_balance',
  POLICIES: 'policies',
  CLAIMS: 'claims',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_PREFS: 'notification_prefs',
} as const;
