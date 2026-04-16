// =============================================================
// EarnGuard Types — aligned to real backend API contracts
// Source: docs/documentation.md + server/src PostgreSQL schema
// =============================================================

// ── Worker / User ──────────────────────────────────────────────
export interface Worker {
  id: string;          // UUID
  email: string;
  name: string;
  cityId: string;
  zoneId: string;
  platform?: 'ZEPTO' | 'BLINKIT';
  walletBalance: number;
}

// ── Auth ────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds (900 from real API)
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  city_id: string;
  zone_id: string;
  platform: 'ZEPTO' | 'BLINKIT';
}

// ── Policy ──────────────────────────────────────────────────────
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED';

export interface Policy {
  id: string;
  workerId?: string;
  cityId?: string;
  status: PolicyStatus;
  premiumAmount: number;
  coverageMultiplier: number;
  activatedAt?: string;
  createdAt: string;
}

export interface PolicyQuote {
  policyId: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  base_price: number;
  additional_price: number;
  premium_amount: number;
  reason: string;
}

// ── Claim ───────────────────────────────────────────────────────
export type ClaimStatus = 'APPROVED' | 'REJECTED' | 'PENDING';
export type ClaimType = 'SYSTEM' | 'MANUAL';

export interface Claim {
  id: string;
  policyId: string;
  workerId?: string;
  payoutAmount: number;
  riskScore: number;
  severityMultiplier: number;
  disruptionType: string; // HEAVY_RAIN, SYSTEM_TRIGGER, etc.
  status: ClaimStatus;
  claimType?: ClaimType;
  claimNote?: string;
  rejectionReason?: string;
  timeframeStart?: string;
  timeframeEnd?: string;
  createdAt: string;
}

export interface ManualClaimRequest {
  disruptionType: string;
  timeframeStart: string;
  timeframeEnd: string;
  note: string;
  clientRequestId: string;
}

// ── Wallet ──────────────────────────────────────────────────────
export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionCategory = 'PREMIUM_PAYMENT' | 'CLAIM_PAYOUT' | 'TOPUP';

export interface WalletBalance {
  balance: number;
  currency: string;   // INR
  lastUpdatedAt: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  referenceId?: string;
  createdAt: string;
}

// ── Notification ────────────────────────────────────────────────
export type NotificationType = 'CLAIM' | 'POLICY' | 'SYSTEM';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ── API Response Wrappers ───────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiQuoteResponse {
  success: boolean;
  quotes: PolicyQuote[];
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

// ── Dashboard ──────────────────────────────────────────────────────
export interface DashboardRisk {
  zoneId: string;
  zoneName: string;
  riskScore: number;
  orderDrop: number;
  riskLabel: string;
  updatedAt: string;
}

export interface DashboardPolicy {
  id: string;
  tierName: string;
  coverageMultiplier: number;
  premiumAmount: number;
  activatedAt: string;
  renewalDate: string;
}

export interface DashboardZoneInsight {
  zoneId: string;
  zoneName: string;
  riskScore: number;
  orderDrop: number;
  updatedAt: string;
}

export interface DashboardActivity {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  referenceId?: string;
  createdAt: string;
}

export interface DashboardData {
  todayCredits: number;
  latestRisk: DashboardRisk | null;
  policy: DashboardPolicy | null;
  zoneInsights: DashboardZoneInsight[];
  recentActivity: DashboardActivity[];
}
