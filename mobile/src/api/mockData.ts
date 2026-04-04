export const mockUser = {
  id: 'usr_avi_sharma',
  email: 'avi@earnguard.com',
  name: 'Avi Sharma',
  cityId: 'mumbai',
  zoneId: 'mumbai_metro_4',
  walletBalance: 120.50,
};

export const mockPolicies = [
  {
    id: 'pol_shield_plus',
    status: 'ACTIVE',
    name: 'Income Shield Plus',
    premiumAmount: 50.00,
    coverageMultiplier: 2.5,
    maxPayout: 15000.00,
    createdAt: new Date().toISOString(),
  }
];

export const mockClaims = [
  {
    id: '1',
    policyId: 'pol_shield_plus',
    payoutAmount: 75.00,
    riskScore: 0.82,
    severityMultiplier: 1.5,
    disruptionType: 'Heavy Rain',
    status: 'APPROVED',
    createdAt: 'Oct 24, 2023',
    icon: 'cloud'
  },
  {
    id: '2',
    policyId: 'pol_shield_plus',
    payoutAmount: 120.00,
    riskScore: 0.75,
    severityMultiplier: 1.2,
    disruptionType: 'Flight Delay',
    status: 'APPROVED',
    createdAt: 'Oct 18, 2023',
    icon: 'plane'
  },
  {
    id: '3',
    policyId: 'pol_shield_plus',
    payoutAmount: 45.00,
    riskScore: 0.65,
    severityMultiplier: 1.0,
    disruptionType: 'Lightning Storm',
    status: 'APPROVED',
    createdAt: 'Oct 12, 2023',
    icon: 'storm'
  },
  {
    id: '4',
    policyId: 'pol_shield_plus',
    payoutAmount: 250.00,
    riskScore: 0.90,
    severityMultiplier: 2.0,
    disruptionType: 'Medical Emergency',
    status: 'PENDING',
    createdAt: 'Oct 05, 2023',
    icon: 'medical'
  },
  {
    id: '5',
    policyId: 'pol_shield_plus',
    payoutAmount: 30.00,
    riskScore: 0.50,
    severityMultiplier: 0.8,
    disruptionType: 'Commute Interruption',
    status: 'APPROVED',
    createdAt: 'Sep 28, 2023',
    icon: 'commute'
  },
  {
    id: '6',
    policyId: 'pol_shield_plus',
    payoutAmount: 15.00,
    riskScore: 0.40,
    severityMultiplier: 0.5,
    disruptionType: 'High Wind Alert',
    status: 'APPROVED',
    createdAt: 'Sep 15, 2023',
    icon: 'wind'
  }
];
