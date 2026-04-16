import { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { apiClient } from '../api/client';
import { Sliders, Zap } from 'lucide-react';

export function SimulationControls() {
  const [chaos, setChaos] = useState<any>({ weather: false, traffic: false, gigPlatform: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get('/signals?zoneId=Z1');
      const d = res.data.data;
      setChaos({
        weather: d.weather?.extreme_alert === true,
        traffic: (d.traffic?.trafficRiskScore || 0) > 0.5,
        platform: d.platform?.status === 'DEGRADED'
      });
    } catch { /* */ }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerEvent = async (type: string, start: boolean) => {
    setLoading(true);
    setToast('');
    try {
      // Use correct endpoint and payload for start/stop
      let payload = { cityId: 'C1', zoneId: 'Z1' };
      if (type === 'weather' && !start) payload = { ...payload, rainfall_mm: 10, temperature: 28, condition: 'CLEAR', extreme_alert: false } as any;
      if (type === 'traffic' && !start) payload = { ...payload, trafficRiskScore: 0.1, avgSpeed: 45, incidentCount: 0, severityLevel: 'LOW' } as any;
      if (type === 'platform' && !start) payload = { ...payload, orderDropPercentage: 5, avgDeliveryTime: 15, status: 'NORMAL' } as any;

      await apiClient.post(`/simulate/${type}`, payload);
      setToast(`Successfully ${start ? 'started' : 'stopped'} ${type} event.`);
      await fetchStatus();
    } catch {
      setToast('Failed to trigger simulation event. Ensure Simulation Server is running.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-in">
      <PageHeader title="Simulation Controls" description="Manually trigger anomaly events for End-to-End testing" />

      {toast && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-[var(--color-surface-high)] text-[var(--color-on-surface)] border-l-4 border-[var(--color-primary)]">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { id: 'weather', name: 'Extreme Weather', current: chaos.weather, desc: 'Generates sudden severe rain/wind data across APIs, spiking weather risk scores.', btnColor: 'var(--color-secondary)' },
          { id: 'traffic', name: 'Gridlock Traffic', current: chaos.traffic, desc: 'Simulates major highway blockages, severely altering TomTom ETA metrics.', btnColor: '#D97706' },
          { id: 'platform', name: 'Platform Outage', current: chaos.platform, desc: 'Lowers estimated earnings drastically, indicating platform instability.', btnColor: 'var(--color-tertiary)' }
        ].map((c) => (
          <div key={c.id} className="card-surface p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} style={{ color: c.btnColor }} />
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-on-surface)' }}>{c.name}</h3>
              </div>
              <span className="px-2 py-1 rounded text-[10px] font-semibold tracking-wider font-mono"
                style={{ 
                  background: c.current ? 'var(--color-tertiary-container)' : 'var(--color-surface-highest)', 
                  color: c.current ? 'var(--color-on-tertiary-container)' : 'var(--color-outline)' 
                }}>
                {c.current ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <p className="text-xs mb-6 flex-1" style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
              {c.desc}
            </p>
            <button 
              onClick={() => triggerEvent(c.id, !c.current)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
              style={{ 
                background: c.current ? 'var(--color-surface-high)' : c.btnColor,
                color: c.current ? 'var(--color-on-surface)' : '#ffffff'
              }}>
              <Zap size={16} fill={!c.current ? '#ffffff' : 'none'} />
              {c.current ? 'Cease Disruption' : 'Trigger Disruption'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
