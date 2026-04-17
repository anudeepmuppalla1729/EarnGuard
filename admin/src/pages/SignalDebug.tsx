import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { Radio } from 'lucide-react';

export function SignalDebug() {
  const { data: signals, timestamp } = usePolledData<any>('/signals?zoneId=all', MED_POLL);

  return (
    <div className="animate-in pb-10">
      <PageHeader title="Signal Debug" description="Live feeds from external providers" timestamp={timestamp} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* WEATHER */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-surface-high)' }}>
            <Radio size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>Weather APIs (Open-Meteo)</h3>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {(signals?.weather && Object.keys(signals?.weather).length > 0 ? [signals.weather] : []).map((w: any, i: number) => (
              <div key={i} className="rounded-lg p-4" style={{ background: 'var(--color-surface-low)' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-black/5 rounded text-[var(--color-primary)]">City: {w.cityId || signals?.cityId}</span>
                  <span className="text-[10px] font-semibold opacity-50 uppercase">{new Date(w.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
                <pre className="text-[11px] font-mono overflow-x-auto text-[var(--color-on-surface-variant)] leading-relaxed">
                  {JSON.stringify(w, null, 2)}
                </pre>
              </div>
            ))}
            {(!signals?.weather || Object.keys(signals.weather).length === 0) && (
              <p className="text-sm text-center py-4 opacity-50 italic">No weather payload data in buffer.</p>
            )}
          </div>
        </div>

        {/* TRAFFIC */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-surface-high)' }}>
            <Radio size={16} style={{ color: '#D97706' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>Traffic APIs (TomTom)</h3>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {(Array.isArray(signals?.traffic) ? signals.traffic : (signals?.traffic && Object.keys(signals?.traffic).length > 0 ? [signals.traffic] : [])).map((t: any, i: number) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'var(--color-surface-low)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] font-mono font-semibold" style={{ color: '#D97706' }}>{t.zoneId || signals?.zoneId}</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{new Date(t.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
                <pre className="text-[10px] font-mono overflow-x-auto" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {JSON.stringify(t, null, 2)}
                </pre>
              </div>
            ))}
            {(!signals?.traffic || Object.keys(signals.traffic).length === 0) && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-outline)' }}>No traffic payload data in buffer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
