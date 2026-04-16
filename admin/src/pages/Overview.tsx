import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { Users, FileText, CheckCircle, IndianRupee, TrendingUp, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

export function Overview() {
  const { data: m, timestamp } = usePolledData<any>('/metrics', MED_POLL);

  const cards = [
    { label: 'Total Workers', val: m?.totalWorkers, icon: <Users size={20} />, accent: 'var(--color-primary)' },
    { label: 'Active Policies', val: m?.activePolicies, icon: <CheckCircle size={20} />, accent: 'var(--color-secondary)' },
    { label: 'Total Claims', val: m?.totalClaims, icon: <FileText size={20} />, accent: 'var(--color-primary-container)' },
    { label: 'Approval Rate', val: m?.approvalRate != null ? `${m.approvalRate}%` : '—', icon: <TrendingUp size={20} />, accent: 'var(--color-secondary)' },
    { label: 'Fraud Rate', val: m?.fraudRate != null ? `${m.fraudRate}%` : '—', icon: <ShieldAlert size={20} />, accent: 'var(--color-tertiary)' },
    { label: 'Total Payouts', val: m?.totalPayout != null ? `₹${m.totalPayout.toLocaleString()}` : '—', icon: <IndianRupee size={20} />, accent: 'var(--color-primary)' },
  ];

  return (
    <div className="animate-in">
      <PageHeader title="System Overview" description="High-level metrics across the EarnGuard pipeline" timestamp={timestamp} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={c.label} className="card-surface p-5 transition-all duration-200" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{c.label}</span>
              <div className="p-2 rounded-lg" style={{ background: 'var(--color-primary-fixed)', color: c.accent }}>
                {c.icon}
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              {c.val ?? <span className="opacity-30">…</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
