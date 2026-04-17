import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { Zap } from 'lucide-react';
import { format } from 'date-fns';

export function Disruptions() {
  const { data, timestamp } = usePolledData<any>('/events', FAST_POLL);
  const events = data?.activeEvents || [];

  return (
    <div className="animate-in">
      <PageHeader title="Active Disruptions" description="Hourly windows where zone risk exceeded the 0.50 threshold" timestamp={timestamp} />

      {events.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--color-outline)' }}>
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active disruption events detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e: any, i: number) => (
            <div key={i} className="card-surface flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-tertiary-container)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {e.zoneName} <span className="font-mono text-xs" style={{ color: 'var(--color-outline)' }}>({e.zoneId})</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {e.hourWindow ? new Date(e.hourWindow).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') + ' IST' : 'Unknown window'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: 'var(--color-tertiary)' }}>{(e.avgRisk * 100).toFixed(0)}%</p>
                <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>Max Drop: {e.maxDrop}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
