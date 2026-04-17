import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { HeartPulse, Database, Server, Cpu, Network } from 'lucide-react';

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
            <p className="text-2xl font-mono mb-2" style={{ color: 'var(--color-on-surface)' }}>{health.activeDbConnections != null ? health.activeDbConnections : '—'}</p>
            <p className="text-[9px] leading-tight" style={{ color: 'var(--color-on-surface-variant)' }}>Live pool of internal microservices and client processes currently holding sessions with the PostgreSQL database instance.</p>
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
              <span className="w-2 h-2 rounded-full pulse-live" style={{ background: health.redisStatus === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: health.redisStatus === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
                {health.redisStatus || 'UNKNOWN'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--color-surface-low)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-outline)' }}>Memory Usage</p>
              <p className="text-lg font-mono" style={{ color: 'var(--color-on-surface)' }}>{health.redisMemory || '—'}</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--color-surface-low)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-outline)' }}>Clients</p>
              <p className="text-lg font-mono" style={{ color: 'var(--color-on-surface)' }}>{health.redisClients ?? '—'}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg flex justify-between items-center" style={{ background: 'var(--color-surface-low)' }}>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Ops/sec</span>
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--color-secondary)' }}>{health.redisOps ?? 0}</span>
            </div>
            <div className="p-2.5 rounded-lg flex justify-between items-center" style={{ background: 'var(--color-surface-low)' }}>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Version</span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-on-surface-variant)' }}>v{health.redisVersion || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3" style={{ color: 'var(--color-outline)' }}>
          <Network size={14} />
          Platform Infrastructure Cluster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(health.servers || []).map((s: any) => (
            <div key={s.name} className="card-surface p-4 flex items-center justify-between border-l-4 transition-all hover:translate-y-[-2px]" 
              style={{ borderLeftColor: s.status === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-outline)' }}>{s.type} • PORT {s.port}</p>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{s.name}</h4>
              </div>
              <div className="flex flex-col items-end">
                <div className={s.status === 'UP' ? 'pulse-live w-2 h-2 rounded-full mb-1' : 'w-2 h-2 rounded-full mb-1'} 
                  style={{ background: s.status === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }} />
                <span className="text-[10px] font-mono font-bold" style={{ color: s.status === 'UP' ? 'var(--color-secondary)' : 'var(--color-tertiary)' }}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
