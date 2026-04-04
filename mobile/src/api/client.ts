import { mockUser, mockPolicies, mockClaims } from './mockData';

// Simulated delay helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiClient = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      if (email === 'test@test.com' && password === 'password') {
        return { success: true, data: { accessToken: 'mock_jwt_token', expiresIn: 3600 } };
      }
      throw new Error('Invalid credentials');
    }
  },
  workers: {
    me: async () => {
      await delay(500);
      return { success: true, data: mockUser };
    }
  },
  wallet: {
    getBalance: async () => {
      await delay(300);
      return { success: true, data: { balance: mockUser.walletBalance, currency: 'INR' } };
    }
  },
  policies: {
    list: async () => {
      await delay(600);
      return { success: true, data: mockPolicies };
    },
    quote: async () => {
      await delay(1000);
      return {
        success: true, 
        quote: {
          policyId: 'pol_new',
          base_price: 150.00,
          additional_price: 145.00,
          premium_amount: 295.00,
          reason: 'Heavy rain, extreme alert, and flood warnings combine with existing outages for high overall risk.',
          max_payout: 2950.00
        }
      };
    },
    activate: async (id: string, idempotencyKey: string) => {
      await delay(1200);
      return {
        success: true,
        data: {
          policyId: id,
          status: 'ACTIVE',
          activatedAt: new Date().toISOString(),
          bankTransactionId: 'mock-tx-id'
        }
      };
    }
  },
  claims: {
    list: async () => {
      await delay(600);
      return { success: true, data: mockClaims };
    }
  }
};
