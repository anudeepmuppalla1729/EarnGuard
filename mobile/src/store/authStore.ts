// =============================================================
// Auth Store — Login, signup, session, biometrics
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { SecureStorage, CacheStorage, STORAGE_KEYS } from '../services/storage';
import { BiometricService } from '../services/biometric';
import type { Worker, AuthTokens } from '../types';

interface AuthState {
  // State
  user: Worker | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: number | null;      // timestamp ms
  biometricEnabled: boolean;
  otpVerified: boolean;
  isRestoringSession: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, mobile: string, platform?: 'ZEPTO' | 'BLINKIT' | 'SWIGGY', city_id?: string, zone_id?: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  completeAuth: (enableBiometric: boolean) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  validateSession: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  sessionExpiry: null,
  biometricEnabled: false,
  otpVerified: false,
  isRestoringSession: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.auth.login(email, password);
      const { accessToken, refreshToken, expiresIn } = res.data;
      const expiry = Date.now() + expiresIn * 1000;

      // Persist tokens securely
      await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStorage.set(STORAGE_KEYS.SESSION_EXPIRY, String(expiry));

      set({
        accessToken,
        refreshToken,
        sessionExpiry: expiry,
        isLoading: false,
        otpVerified: false, // Will need OTP before full auth
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  signup: async (email, password, name, mobile, platform: 'ZEPTO' | 'BLINKIT' | 'SWIGGY' = 'ZEPTO', city_id = 'C1', zone_id = 'Z1') => {
    set({ isLoading: true });
    try {
      await apiClient.auth.register(email, password, mobile, name);
      // After sign up, perform login
      await get().login(email, password);
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  verifyOtp: async (code) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.auth.verifyOtp(code);
      if (res.data.verified) {
        set({ otpVerified: true, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e) {
      set({ isLoading: false });
      return false;
    }
  },

  completeAuth: async (enableBiometric) => {
    // Fetch profile after full auth flow
    try {
      const profileRes = await apiClient.workers.me();
      const user = profileRes.data;

      // Cache user
      await CacheStorage.set(STORAGE_KEYS.USER_PROFILE, user);

      // Set biometric preference
      await BiometricService.setEnabled(enableBiometric);

      set({
        user,
        isAuthenticated: true,
        biometricEnabled: enableBiometric,
      });
    } catch (e) {
      // Even if profile fails, authenticate (graceful)
      set({ isAuthenticated: true, biometricEnabled: enableBiometric });
    }
  },

  logout: async () => {
    try {
      await apiClient.auth.logout();
    } catch {} // fire & forget
    // Clear all secure storage
    await SecureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStorage.remove(STORAGE_KEYS.SESSION_EXPIRY);
    await CacheStorage.clearAll();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionExpiry: null,
      otpVerified: false,
    });
  },

  restoreSession: async () => {
    set({ isRestoringSession: true });
    try {
      const token = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshTokenStored = await SecureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
      const expiryStr = await SecureStorage.get(STORAGE_KEYS.SESSION_EXPIRY);
      const biometricEnabled = await BiometricService.isEnabled();

      if (!token || !expiryStr) {
        set({ isRestoringSession: false });
        return false;
      }

      const expiry = parseInt(expiryStr, 10);

      // Check if session is expired
      if (Date.now() > expiry) {
        // Try refresh
        if (refreshTokenStored) {
          try {
            const res = await apiClient.auth.refresh(refreshTokenStored);
            const newExpiry = Date.now() + res.data.expiresIn * 1000;
            await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, res.data.accessToken);
            await SecureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, res.data.refreshToken);
            await SecureStorage.set(STORAGE_KEYS.SESSION_EXPIRY, String(newExpiry));

            set({
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
              sessionExpiry: newExpiry,
            });
          } catch {
            set({ isRestoringSession: false });
            return false;
          }
        } else {
          set({ isRestoringSession: false });
          return false;
        }
      } else {
        set({ accessToken: token, refreshToken: refreshTokenStored, sessionExpiry: expiry });
      }

      // Biometric check
      if (biometricEnabled) {
        const available = await BiometricService.isAvailable();
        if (available) {
          const success = await BiometricService.authenticate();
          if (!success) {
            set({ isRestoringSession: false });
            return false;
          }
        }
      }

      // Load cached profile, then refresh in background
      const cachedUser = await CacheStorage.get<Worker>(STORAGE_KEYS.USER_PROFILE);
      set({
        user: cachedUser,
        isAuthenticated: true,
        biometricEnabled,
        otpVerified: true,
        isRestoringSession: false,
      });

      // Background refresh
      get().fetchProfile();

      return true;
    } catch (e) {
      console.warn('[AuthStore] Session restore failed:', e);
      set({ isRestoringSession: false });
      return false;
    }
  },

  fetchProfile: async () => {
    try {
      const res = await apiClient.workers.me();
      const user = res.data;
      await CacheStorage.set(STORAGE_KEYS.USER_PROFILE, user);
      set({ user });
    } catch (e) {
      console.warn('[AuthStore] fetchProfile failed:', e);
    }
  },

  setBiometricEnabled: async (enabled) => {
    await BiometricService.setEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  validateSession: () => {
    const { sessionExpiry } = get();
    if (!sessionExpiry) return false;
    return Date.now() < sessionExpiry;
  },
}));
