import { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { apiClient } from '../api/client';
import { Sliders, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ZONES = [
  { id: 'Z1', name: 'Z1 - Madhapur Dark Store' },
  { id: 'Z2', name: 'Z2 - Kondapur Dark Store' },
  { id: 'Z3', name: 'Z3 - Gachibowli Dark Store' },
  { id: 'Z4', name: 'Z4 - Jubilee Hills Dark Store' },
  { id: 'Z5', name: 'Z5 - Banjara Hills Dark Store' },
  { id: 'Z6', name: 'Z6 - Hitec City Dark Store' },
];

export function SimulationControls() {
  const [chaos, setChaos] = useState<any>({ weather: 'idle', traffic: 'idle', platform: 'idle', news: 'idle' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedZone, setSelectedZone] = useState('Z1');

  const fetchStatus = async () => {
    try {
      const res = await apiClient.get(`/signals?zoneId=${selectedZone}`);
      const d = res.data.data;
      setChaos({
        weather: d.weather?.extreme_alert ? 'severe' : (d.weather?.rainfall_mm > 10 ? 'moderate' : 'idle'),
        traffic: (d.traffic?.trafficRiskScore || 0) >= 0.8 ? 'severe' : ((d.traffic?.trafficRiskScore || 0) >= 0.3 ? 'moderate' : 'idle'),
        platform: d.platform?.status === 'DEGRADED' ? 'severe' : (d.platform?.status === 'SLOW' ? 'moderate' : 'idle'),
        news: d.news?.riskTag === 'SOCIAL_DISRUPTION' ? 'severe' : (d.news?.riskTag === 'SOCIAL_UNREST' ? 'moderate' : 'idle'),
      });
    } catch { /* */ }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  const triggerEvent = async (type: string, level: string) => {
    setLoading(true);
    setToast('');
    try {
      let payload = { cityId: 'C1', zoneId: selectedZone } as any;
      
      if (type === 'weather') {
        if (level === 'idle') payload = { ...payload, rainfall_mm: 10, temperature: 28, condition: 'CLEAR', extreme_alert: false };
        if (level === 'moderate') payload = { ...payload, rainfall_mm: 50, temperature: 30, condition: 'HEAVY_RAIN', extreme_alert: false };
        if (level === 'severe') payload = { ...payload, rainfall_mm: 150, temperature: 25, condition: 'FLOOD', extreme_alert: true };
      }
      if (type === 'traffic') {
        if (level === 'idle') payload = { ...payload, trafficRiskScore: 0.1, avgSpeed: 45, incidentCount: 0, severityLevel: 'LOW' };
        if (level === 'moderate') payload = { ...payload, trafficRiskScore: 0.4, avgSpeed: 30, incidentCount: 1, severityLevel: 'MODERATE' };
        if (level === 'severe') payload = { ...payload, trafficRiskScore: 0.8, avgSpeed: 10, incidentCount: 3, severityLevel: 'SEVERE' };
      }
      if (type === 'platform') {
        if (level === 'idle') payload = { ...payload, orderDropPercentage: 5, avgDeliveryTime: 15, status: 'NORMAL' };
        if (level === 'moderate') payload = { ...payload, orderDropPercentage: 20, avgDeliveryTime: 30, status: 'SLOW' };
        if (level === 'severe') payload = { ...payload, orderDropPercentage: 80, avgDeliveryTime: 55, status: 'DEGRADED' };
      }
      if (type === 'news') {
        if (level === 'idle') payload = { ...payload, headline: "Normal Day", riskTag: "NONE" };
        if (level === 'moderate') payload = { ...payload, headline: "Localized protests impacting downtown", riskTag: "SOCIAL_UNREST" };
        if (level === 'severe') payload = { ...payload, headline: "City-wide strike announced", riskTag: "SOCIAL_DISRUPTION" };
      }

      await apiClient.post(`/simulate/${type}`, payload);
      setToast(`Successfully switched ${type.toUpperCase()} module to ${level.toUpperCase()} preset.`);
      await fetchStatus();
    } catch {
      setToast('Failed to push simulation state. Check Node/Postgres logs.');
    }
    setLoading(false);
  };

  const modules = [
    { id: 'weather', name: 'Weather', desc: 'Simulate rain, floods, and extreme weather alerts.', iconColor: '#38BDF8' },
    { id: 'traffic', name: 'Traffic', desc: 'Simulate road closures, slow speeds, and accidents.', iconColor: '#F59E0B' },
    { id: 'news', name: 'Current Events', desc: 'Simulate city protests and social unrest strikes.', iconColor: '#F43F5E' },
    { id: 'platform', name: 'Delivery Platform', desc: 'Simulate app crashes, delayed orders, and drop in earnings.', iconColor: '#10B981' }
  ];

  return (
    <div className="animate-in pb-10">
      <div className="flex justify-between items-start mb-6">
        <PageHeader title="Simulation Engine Controls" description="Manually adjust external API environments for End-to-End stress testing" />
        <div className="flex flex-col gap-1 text-right mt-2">
          <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">Target Area</label>
          <select 
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="card-surface px-4 py-2 text-sm font-semibold outline-none border focus:border-[var(--color-primary)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--color-surface-high)' }}
          >
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 font-medium">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {modules.map((c) => {
          const currentLvl = chaos[c.id] || 'idle';
          
          return (
          <div key={c.id} className="card-surface p-5 flex flex-col border border-transparent shadow shadow-black/5 hover:border-black/5 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Sliders size={18} style={{ color: c.iconColor }} />
                <h3 className="font-semibold text-[var(--color-on-surface)] tracking-tight">{c.name}</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded" style={{
                background: currentLvl === 'severe' ? '#fee2e2' : currentLvl === 'moderate' ? '#fef3c7' : '#f1f5f9',
                color: currentLvl === 'severe' ? '#991b1b' : currentLvl === 'moderate' ? '#92400e' : '#475569',
              }}>
                STATE: {currentLvl}
              </span>
            </div>
            
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-6 flex-1">
              {c.desc}
            </p>
            
            <div className="flex items-center gap-2 mt-auto">
              <button 
                onClick={() => triggerEvent(c.id, 'idle')}
                disabled={loading}
                className={cn(
                  "flex-1 flex gap-1.5 items-center justify-center py-2 rounded-md text-[11px] font-bold tracking-tight transition-all",
                  currentLvl === 'idle' ? "bg-slate-800 text-white shadow-md shadow-slate-800/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <CheckCircle2 size={14} /> CLEAR
              </button>
              
              <button 
                onClick={() => triggerEvent(c.id, 'moderate')}
                disabled={loading}
                className={cn(
                  "flex-1 flex gap-1.5 items-center justify-center py-2 rounded-md text-[11px] font-bold tracking-tight transition-all",
                  currentLvl === 'moderate' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                )}
              >
                <AlertTriangle size={14} /> MODERATE
              </button>
              
              <button 
                onClick={() => triggerEvent(c.id, 'severe')}
                disabled={loading}
                className={cn(
                  "flex-1 flex gap-1.5 items-center justify-center py-2 rounded-md text-[11px] font-bold tracking-tight transition-all",
                  currentLvl === 'severe' ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-red-50 text-red-600 hover:bg-red-100"
                )}
              >
                <AlertOctagon size={14} /> SEVERE
              </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
