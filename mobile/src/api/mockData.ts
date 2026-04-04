// =============================================================
// Mock Data — Typed, aligned to real PostgreSQL schema
// =============================================================
import type {
  Worker, Policy, Claim, WalletTransaction,
  AppNotification, PolicyQuote,
} from '../types';

export const mockUser: Worker = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'avi@earnguard.com',
  name: 'Avi Sharma',
  cityId: 'C1',
  zoneId: 'Z1',
  platform: 'ZEPTO',
  walletBalance: 120.50,
};

export const mockPolicies: Policy[] = [
  {
    id: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    cityId: 'C1',
    status: 'ACTIVE',
    premiumAmount: 50.00,
    coverageMultiplier: 2.5,
    maxPayout: 15000.00,
    activatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const mockClaims: Claim[] = [
  {
    id: 'clm-001',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 75.00,
    riskScore: 0.82,
    severityMultiplier: 1.5,
    disruptionType: 'HEAVY_RAIN',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'clm-002',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 120.00,
    riskScore: 0.75,
    severityMultiplier: 1.2,
    disruptionType: 'SYSTEM_TRIGGER',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'clm-003',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 45.00,
    riskScore: 0.65,
    severityMultiplier: 1.0,
    disruptionType: 'HEAVY_RAIN',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'clm-004',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 250.00,
    riskScore: 0.90,
    severityMultiplier: 2.0,
    disruptionType: 'SOCIAL_DISRUPTION',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'clm-005',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 30.00,
    riskScore: 0.50,
    severityMultiplier: 0.8,
    disruptionType: 'SYSTEM_TRIGGER',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'clm-006',
    policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    workerId: mockUser.id,
    payoutAmount: 15.00,
    riskScore: 0.40,
    severityMultiplier: 0.5,
    disruptionType: 'HEAVY_RAIN',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const mockTransactions: WalletTransaction[] = [
  {
    id: 'txn-001',
    amount: 75.00,
    type: 'CREDIT',
    category: 'CLAIM_PAYOUT',
    referenceId: 'clm-001',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'txn-002',
    amount: 50.00,
    type: 'DEBIT',
    category: 'PREMIUM_PAYMENT',
    referenceId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'txn-003',
    amount: 120.00,
    type: 'CREDIT',
    category: 'CLAIM_PAYOUT',
    referenceId: 'clm-002',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'txn-004',
    amount: 45.00,
    type: 'CREDIT',
    category: 'CLAIM_PAYOUT',
    referenceId: 'clm-003',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'ntf-001',
    title: 'Claim Credited',
    message: '₹75.00 added to your wallet for Heavy Rain disruption.',
    type: 'CLAIM',
    read: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ntf-002',
    title: 'Policy Activated',
    message: 'Your Income Shield Plus policy is now active.',
    type: 'POLICY',
    read: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'ntf-003',
    title: 'Rain Advisory',
    message: 'Heavy rain expected in Zone Z1 between 2-4 PM. Stay covered.',
    type: 'SYSTEM',
    read: true,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

export const mockQuotes: PolicyQuote[] = [
  {
    policyId: 'pol-new-draft-basic',
    tier: 'BASIC',
    base_price: 150.00,
    additional_price: 145.00,
    premium_amount: 206.50,
    reason: '',
    max_payout: 1770.00,
  },
  {
    policyId: 'pol-new-draft-standard',
    tier: 'STANDARD',
    base_price: 150.00,
    additional_price: 145.00,
    premium_amount: 295.00,
    reason: 'Heavy rain, extreme alert, and flood warnings combine with existing outages for high overall risk.',
    max_payout: 2950.00,
  },
  {
    policyId: 'pol-new-draft-premium',
    tier: 'PREMIUM',
    base_price: 150.00,
    additional_price: 145.00,
    premium_amount: 413.00,
    reason: '',
    max_payout: 5900.00,
  }
];

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Disruption type → human-readable label map
 */
export const DISRUPTION_LABELS: Record<string, string> = {
  'HEAVY_RAIN': 'Heavy Rain',
  'SYSTEM_TRIGGER': 'System Trigger',
  'SOCIAL_DISRUPTION': 'Social Disruption',
  'FLOOD': 'Flood',
  'TRAFFIC_CONGESTION': 'Traffic Congestion',
  'PLATFORM_OUTAGE': 'Platform Outage',
};

export function getDisruptionLabel(type: string): string {
  return DISRUPTION_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format date to relative or absolute string
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs === 0) {
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHrs}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}
