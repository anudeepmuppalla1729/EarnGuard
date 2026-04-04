// =============================================================
// API Client — Real HTTP calls to the EarnGuard backend
// Base URL: EXPO_PUBLIC_API_URL (set in .env)
// Auth: Bearer <accessToken> stored in SecureStorage
// Token refresh: automatic on 401 using stored refreshToken
// =============================================================
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { SecureStorage, STORAGE_KEYS } from '../services/storage';
import type {
  Worker, Policy, Claim, WalletTransaction, WalletBalance,
  AppNotification, PolicyQuote, AuthTokens, ApiResponse, ApiQuoteResponse,
} from '../types';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.36:3000') + '/api/v1';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Access Token ────────────────────────────────
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — Auto-Refresh on 401 ───────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach(cb => cb(token));
  refreshQueue = [];
};

http.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue subsequent requests until refresh completes
        return new Promise(resolve => {
          refreshQueue.push((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(http(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefresh = await SecureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
        if (!storedRefresh) throw new Error('No refresh token');

        const { data } = await axios.post<ApiResponse<AuthTokens>>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: storedRefresh }
        );

        const { accessToken, refreshToken, expiresIn } = data.data;
        const expiry = Date.now() + expiresIn * 1000;

        await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        await SecureStorage.set(STORAGE_KEYS.SESSION_EXPIRY, String(expiry));

        processQueue(accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        refreshQueue = [];
        // Clear tokens so the app navigates to login
        await SecureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStorage.remove(STORAGE_KEYS.SESSION_EXPIRY);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error shape so stores can catch cleanly
    const apiError = {
      success: false,
      error: {
        code:    (error.response?.data as any)?.error?.code ?? 'API_ERROR',
        message: (error.response?.data as any)?.error?.message
                   ?? (error.response?.data as any)?.error
                   ?? error.message,
      },
    };
    return Promise.reject(apiError);
  }
);

// ─── Typed helper ─────────────────────────────────────────────────────────────
const get  = <T>(url: string, params?: object) =>
  http.get<T>(url, { params }).then(r => r.data);

const post = <T>(url: string, body?: object) =>
  http.post<T>(url, body).then(r => r.data);

const put  = <T>(url: string, body?: object) =>
  http.put<T>(url, body).then(r => r.data);

// =============================================================
// API Client
// =============================================================
export const apiClient = {
  // ── AUTH ─────────────────────────────────────────────────────

  auth: {
    /**
     * POST /api/v1/auth/login
     */
    login: (email: string, password: string): Promise<ApiResponse<AuthTokens>> =>
      post<ApiResponse<AuthTokens>>('/auth/login', { email, password }),

    /**
     * POST /api/v1/auth/register
     * Worker ID is auto-assigned by the platform API using email + mobile.
     */
    register: (email: string, password: string, mobile: string): Promise<ApiResponse<{ id: string; platformWorkerId: string; name: string; platform: string }>> =>
      post<ApiResponse<{ id: string; platformWorkerId: string; name: string; platform: string }>>('/auth/register', { email, password, mobile }),

    /**
     * Simulated OTP verification — no backend endpoint, accept any 6-digit code
     * (kept as mock until 2FA is implemented)
     */
    verifyOtp: async (code: string): Promise<ApiResponse<{ verified: boolean }>> => {
      if (code.length === 6) return { success: true, data: { verified: true } };
      throw { success: false, error: { code: 'INVALID_OTP', message: 'Invalid verification code' } };
    },

    /**
     * POST /api/v1/auth/refresh
     */
    refresh: (refreshToken: string): Promise<ApiResponse<AuthTokens>> =>
      post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

    /**
     * POST /api/v1/auth/logout
     */
    logout: async (): Promise<{ success: boolean }> => {
      const refreshToken = await SecureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
      return post<{ success: boolean }>('/auth/logout', { refreshToken });
    },
  },

  // ── WORKERS ─────────────────────────────────────────────────

  workers: {
    /**
     * GET /api/v1/workers/me
     */
    me: (): Promise<ApiResponse<Worker>> =>
      get<ApiResponse<Worker>>('/workers/me'),
  },

  // ── WALLET ──────────────────────────────────────────────────

  wallet: {
    /**
     * GET /api/v1/wallet
     */
    getBalance: (): Promise<ApiResponse<WalletBalance>> =>
      get<ApiResponse<WalletBalance>>('/wallet'),

    /**
     * GET /api/v1/wallet/transactions
     */
    getTransactions: (page = 1, limit = 10): Promise<ApiResponse<WalletTransaction[]>> =>
      get<ApiResponse<WalletTransaction[]>>('/wallet/transactions', { page, limit }),
  },

  // ── POLICIES ────────────────────────────────────────────────

  policies: {
    /**
     * GET /api/v1/policies
     */
    list: (page = 1, limit = 10): Promise<ApiResponse<Policy[]>> =>
      get<ApiResponse<Policy[]>>('/policies', { page, limit }),

    /**
     * POST /api/v1/policies/quote
     */
    quote: (): Promise<ApiQuoteResponse> =>
      post<ApiQuoteResponse>('/policies/quote'),

    /**
     * POST /api/v1/policies/activate
     */
    activate: (policyId: string, idempotencyKey: string): Promise<ApiResponse<{
      policyId: string;
      status: string;
      activatedAt: string;
      bankTransactionId: string;
    }>> =>
      post<ApiResponse<any>>('/policies/activate', { policyId, idempotencyKey }),
  },

  // ── CLAIMS ──────────────────────────────────────────────────

  claims: {
    /**
     * GET /api/v1/claims
     */
    list: (page = 1, limit = 10): Promise<ApiResponse<Claim[]>> =>
      get<ApiResponse<Claim[]>>('/claims', { page, limit }),
  },

  // ── NOTIFICATIONS ───────────────────────────────────────────

  notifications: {
    /**
     * POST /api/v1/notifications/devices
     */
    registerDevice: (deviceId: string, fcmToken: string): Promise<ApiResponse<{ deviceId: string; registered: boolean }>> =>
      post<ApiResponse<{ deviceId: string; registered: boolean }>>('/notifications/devices', { deviceId, fcmToken }),

    /**
     * GET /api/v1/notifications
     */
    list: (page = 1, limit = 20, unreadOnly = false): Promise<ApiResponse<AppNotification[]>> =>
      get<ApiResponse<AppNotification[]>>('/notifications', { page, limit, unreadOnly }),

    /**
     * PUT /api/v1/notifications/:id/read
     */
    markRead: (id: string): Promise<ApiResponse<null>> =>
      put<ApiResponse<null>>(`/notifications/${id}/read`),
  },
};
