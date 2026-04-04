// =============================================================
// API Client — Mock responses shaped exactly like real backend
// When backend is ready: swap delay() → axios calls, zero changes elsewhere
// =============================================================
import {
  mockUser, mockPolicies, mockClaims, mockTransactions,
  mockNotifications, mockQuote,
} from './mockData';
import type {
  Worker, Policy, Claim, WalletTransaction, WalletBalance,
  AppNotification, PolicyQuote, AuthTokens, ApiResponse, ApiQuoteResponse,
} from '../types';

// Simulated delay helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simulated token generation
const generateToken = () => `eyJhbGciOiJIUzI1NiJ9.${Date.now()}.mock_${Math.random().toString(36).slice(2)}`;

export const apiClient = {
  // ── AUTH ─────────────────────────────────────────────────────

  auth: {
    /**
     * POST /api/v1/auth/login
     */
    login: async (email: string, password: string): Promise<ApiResponse<AuthTokens>> => {
      await delay(800);
      // Accept demo credentials or any valid-looking email
      if (
        (email === 'test@test.com' && password === 'password') ||
        (email === 'avi@earnguard.com' && password === 'password') ||
        (email.includes('@') && password.length >= 6)
      ) {
        return {
          success: true,
          data: {
            accessToken: generateToken(),
            refreshToken: generateToken(),
            expiresIn: 900,
          },
        };
      }
      throw { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };
    },

    /**
     * POST /api/v1/auth/register
     */
    register: async (email: string, password: string, name: string): Promise<ApiResponse<{ id: string }>> => {
      await delay(1000);
      if (password.length < 6) {
        throw { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' } };
      }
      return {
        success: true,
        data: { id: `usr-${Date.now()}` },
      };
    },

    /**
     * Simulated OTP verification (not in real API but needed for 2FA flow)
     */
    verifyOtp: async (code: string): Promise<ApiResponse<{ verified: boolean }>> => {
      await delay(600);
      // Accept any 6-digit code
      if (code.length === 6) {
        return { success: true, data: { verified: true } };
      }
      throw { success: false, error: { code: 'INVALID_OTP', message: 'Invalid verification code' } };
    },

    /**
     * POST /api/v1/auth/refresh
     */
    refresh: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
      await delay(300);
      return {
        success: true,
        data: {
          accessToken: generateToken(),
          refreshToken: generateToken(),
          expiresIn: 900,
        },
      };
    },

    /**
     * POST /api/v1/auth/logout
     */
    logout: async (): Promise<{ success: boolean }> => {
      await delay(200);
      return { success: true };
    },
  },

  // ── WORKERS ─────────────────────────────────────────────────

  workers: {
    /**
     * GET /api/v1/workers/me
     */
    me: async (): Promise<ApiResponse<Worker>> => {
      await delay(500);
      return { success: true, data: { ...mockUser } };
    },
  },

  // ── WALLET ──────────────────────────────────────────────────

  wallet: {
    /**
     * GET /api/v1/wallet
     */
    getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
      await delay(300);
      return {
        success: true,
        data: {
          balance: mockUser.walletBalance,
          currency: 'INR',
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    },

    /**
     * GET /api/v1/wallet/transactions
     */
    getTransactions: async (page = 1, limit = 10): Promise<ApiResponse<WalletTransaction[]>> => {
      await delay(400);
      const start = (page - 1) * limit;
      const items = mockTransactions.slice(start, start + limit);
      return {
        success: true,
        data: items,
        meta: {
          page,
          limit,
          total: mockTransactions.length,
          totalPages: Math.ceil(mockTransactions.length / limit),
        },
      };
    },
  },

  // ── POLICIES ────────────────────────────────────────────────

  policies: {
    /**
     * GET /api/v1/policies
     */
    list: async (page = 1, limit = 10): Promise<ApiResponse<Policy[]>> => {
      await delay(600);
      return {
        success: true,
        data: [...mockPolicies],
        meta: {
          page,
          limit,
          total: mockPolicies.length,
          totalPages: 1,
        },
      };
    },

    /**
     * POST /api/v1/policies/quote
     */
    quote: async (): Promise<ApiQuoteResponse> => {
      await delay(1000);
      return {
        success: true,
        quote: { ...mockQuote, policyId: `pol-draft-${Date.now()}` },
      };
    },

    /**
     * POST /api/v1/policies/{id}/activate
     */
    activate: async (id: string, idempotencyKey: string): Promise<ApiResponse<{
      policyId: string;
      status: string;
      activatedAt: string;
      bankTransactionId: string;
    }>> => {
      await delay(1200);
      return {
        success: true,
        data: {
          policyId: id,
          status: 'ACTIVE',
          activatedAt: new Date().toISOString(),
          bankTransactionId: `mock-tx-${Date.now()}`,
        },
      };
    },
  },

  // ── CLAIMS ──────────────────────────────────────────────────

  claims: {
    /**
     * GET /api/v1/claims
     */
    list: async (page = 1, limit = 10): Promise<ApiResponse<Claim[]>> => {
      await delay(600);
      const start = (page - 1) * limit;
      const items = mockClaims.slice(start, start + limit);
      return {
        success: true,
        data: items,
        meta: {
          page,
          limit,
          total: mockClaims.length,
          totalPages: Math.ceil(mockClaims.length / limit),
        },
      };
    },
  },

  // ── NOTIFICATIONS ───────────────────────────────────────────

  notifications: {
    /**
     * POST /api/v1/notifications/devices
     */
    registerDevice: async (deviceId: string, fcmToken: string): Promise<ApiResponse<{ deviceId: string; registered: boolean }>> => {
      await delay(300);
      return {
        success: true,
        data: { deviceId, registered: true },
      };
    },

    /**
     * GET /api/v1/notifications
     */
    list: async (page = 1, limit = 20, unreadOnly = false): Promise<ApiResponse<AppNotification[]>> => {
      await delay(400);
      let items = [...mockNotifications];
      if (unreadOnly) {
        items = items.filter(n => !n.read);
      }
      return {
        success: true,
        data: items,
        meta: {
          page,
          limit,
          total: items.length,
          totalPages: 1,
        },
      };
    },
  },
};
