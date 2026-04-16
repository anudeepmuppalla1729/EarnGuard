import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';

function riskColor(score: number) {
  if (score >= 0.7) return 'var(--color-tertiary)';
  if (score >= 0.5) return '#D97706';
  return 'var(--color-secondary)';
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
        <span className="font-mono font-medium" style={{ color: 'var(--color-on-surface)' }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-surface-high)' }}>
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(value * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export function RiskMonitoring() {
  const { data, timestamp } = usePolledData<any>('/risk/overview', FAST_POLL);
  const zones = data?.zones || [];

  return (
    <div className="animate-in">
      <PageHeader title="Risk Monitoring" description="Live risk scores per zone with signal breakdown" timestamp={timestamp} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {zones.map((z: any) => (
          <div key={z.zoneId} className="card-surface p-5">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{z.zoneName}</p>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-outline)' }}>{z.zoneId}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold" style={{ color: riskColor(z.currentRisk) }}>
                  {(z.currentRisk * 100).toFixed(0)}%
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>Drop: {z.orderDrop}%</p>
              </div>
            </div>
            <div className="space-y-3">
              <BreakdownBar label="Weather" value={z.breakdown.weather} color="#3B82F6" />
              <BreakdownBar label="Traffic" value={z.breakdown.traffic} color="#D97706" />
              <BreakdownBar label="Platform" value={z.breakdown.platform} color="var(--color-primary-container)" />
              <BreakdownBar label="News" value={z.breakdown.news} color="var(--color-secondary)" />
            </div>
          </div>
        ))}
        {zones.length === 0 && (
          <p className="col-span-full text-center py-16 text-sm" style={{ color: 'var(--color-outline)' }}>
            No risk snapshots recorded yet. Waiting for disruption detection cycle…
          </p>
        )}
      </div>
    </div>
  );
}
