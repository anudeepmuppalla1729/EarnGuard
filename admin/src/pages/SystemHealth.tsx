import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { HeartPulse, Database, Server, Cpu } from 'lucide-react';

export function SystemHealth() {
  const { data: health, timestamp } = usePolledData<any>('/health', FAST_POLL);

  if (!health) return <div className="p-6">Loading System Health...</div>;

  return (
    <div className="animate-in">
      <PageHeader title="System Health" description="PostgreSQL, Redis, and Backend Node Resource Constraints" timestamp={timestamp} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>API Node Instance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--color-on-surface-variant)' }}>Memory Usage</span>
                <span className="font-mono font-medium" style={{ color: 'var(--color-on-surface)' }}>{health.memory ? ((health.memory.total - health.memory.free) / (1024 * 1024)).toFixed(0) : 0} MB</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-surface-high)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${health.memory?.usedPercent || 0}%`, background: 'var(--color-primary)' }} />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--color-surface-low)' }}>
              <div className="flex items-center gap-2">
                <Cpu size={14} style={{ color: 'var(--color-outline)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Event Loop Lag</span>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: (health.eventLoopLag || 0) > 50 ? 'var(--color-tertiary)' : 'var(--color-secondary)' }}>
                {(health.eventLoopLag || 0).toFixed(2)} ms
              </span>
            </div>
            
            <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>Uptime: {((health.uptime || 0) / 3600).toFixed(1)} hours</p>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} style={{ color: 'var(--color-secondary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>PostgreSQL</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg mb-3" style={{ background: 'var(--color-surface-low)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Connection State</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full pulse-live" style={{ background: health.dbStatus === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: health.dbStatus === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
                {health.dbStatus || 'UNKNOWN'}
              </span>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--color-surface-low)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-outline)' }}>Active Connections</p>
            <p className="text-2xl font-mono" style={{ color: 'var(--color-on-surface)' }}>{health.activeDbConnections || '—'}</p>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse size={18} style={{ color: 'var(--color-tertiary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>Redis (BullMQ / Caching)</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg mb-3" style={{ background: 'var(--color-surface-low)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>Connection State</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-secondary)' }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                UP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
