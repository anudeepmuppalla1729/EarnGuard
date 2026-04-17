import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { CloudRain, Car, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Extract<Parameters<typeof clsx>[0], any>[]) {
  return twMerge(clsx(inputs));
}

// Reusable UI Components
const StatusBadge = ({ label, status }: { label: string; status: 'good' | 'warning' | 'critical' | 'neutral' }) => {
  const colors = {
    good: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase", colors[status])}>
      {label}
    </span>
  );
};

const ProgressBar = ({ value, max = 1, colorClass = "bg-blue-500" }: { value: number; max?: number; colorClass?: string }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden mt-1">
      <div className={cn("h-full transition-all duration-500", colorClass)} style={{ width: `${percentage}%` }} />
    </div>
  );
};

const MetricRow = ({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 py-2.5 border-b border-black/5 last:border-0">
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold text-[var(--color-outline)]">{label}</span>
      {value && <span className="font-bold text-[var(--color-on-surface)]">{value}</span>}
    </div>
    {children}
  </div>
);

export function SignalDebug() {
  const { data: signals, timestamp } = usePolledData<any>('/signals?zoneId=all', MED_POLL);

  const weatherData = signals?.weather && Object.keys(signals.weather).length > 0 ? [signals.weather] : [];
  const trafficData = Array.isArray(signals?.traffic) ? signals.traffic : (signals?.traffic && Object.keys(signals.traffic).length > 0 ? [signals.traffic] : []);

  // Visual Mappers
  const getWeatherColor = (condition: string) => {
    if (condition === 'CLEAR') return 'good';
    if (condition === 'HEAVY_RAIN' || condition === 'FLOOD') return 'critical';
    return 'warning';
  };

  const getTrafficRiskColor = (score: number) => {
    if (score < 0.3) return 'bg-emerald-500';
    if (score <= 0.6) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const getSeverityBadge = (level: string) => {
    switch(level) {
      case 'LOW': return 'neutral';
      case 'MODERATE': return 'warning';
      case 'SEVERE': return 'critical';
      default: return 'neutral';
    }
  };

  return (
    <div className="animate-in pb-10">
      <div className="flex justify-between items-center mb-1">
        <PageHeader title="Signal Intelligence" description="Real-time structured telemetry from external API providers" timestamp={null} />
        
        <div className="flex flex-col items-end gap-1 px-4 mt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Feed
          </div>
          <span className="text-[9px] font-bold tracking-wider text-[var(--color-outline)] uppercase mt-1">
            Last Sync: {timestamp ? new Date(timestamp).toLocaleTimeString() : '...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
        
        {/* WEATHER COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CloudRain size={20} />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] tracking-tight">Weather Telemetry</h3>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-8">
            {weatherData.map((w: any, i: number) => (
              <div key={i} className="card-surface p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">City {w.cityId || signals?.cityId || 'C1'}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {new Date(w.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>

                <div className="space-y-1">
                  <MetricRow label="Condition" value={<StatusBadge label={w.condition} status={getWeatherColor(w.condition)} />} />
                  <MetricRow label="Temperature" value={<span className="font-mono bg-black/5 px-2 py-0.5 rounded">{w.temperature}°C</span>} />
                  <MetricRow label={`Rainfall (${w.rainfall_mm} mm)`}>
                    <ProgressBar value={w.rainfall_mm} max={150} colorClass={w.rainfall_mm > 50 ? 'bg-blue-600' : 'bg-blue-400'} />
                  </MetricRow>
                  <MetricRow label="Extreme Alert" value={
                    w.extreme_alert ? (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} /> YES
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} /> NO
                      </div>
                    )
                  } />
                </div>
              </div>
            ))}
            {weatherData.length === 0 && (
              <div className="card-surface p-10 flex flex-col items-center justify-center text-center opacity-60">
                <CloudRain size={36} className="mb-4 opacity-40" />
                <p className="font-semibold text-sm">No weather signals available</p>
                <p className="text-xs mt-1">Simulate an event to generate data.</p>
              </div>
            )}
          </div>
        </div>

        {/* TRAFFIC COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Car size={20} />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-on-surface)] tracking-tight">Traffic Intelligence</h3>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-8">
            {trafficData.map((t: any, i: number) => (
              <div key={i} className="card-surface p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", getTrafficRiskColor(t.trafficRiskScore || 0))} />
                
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-black/5 pl-2">
                  <span className="text-sm font-bold tracking-tight">Zone {t.zoneId || signals?.zoneId}</span>
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {new Date(t.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>

                <div className="space-y-1 pl-2">
                  <MetricRow label={`Risk Score (${((t.trafficRiskScore || 0) * 100).toFixed(0)}%)`}>
                    <ProgressBar value={t.trafficRiskScore || 0} max={1} colorClass={getTrafficRiskColor(t.trafficRiskScore || 0)} />
                  </MetricRow>
                  <MetricRow label="Avg Speed" value={<span className="font-mono bg-black/5 px-2 py-0.5 rounded">{t.avgSpeed || 0} km/h</span>} />
                  <MetricRow label="Incident Count" value={
                    <span className={cn("font-mono px-2 py-0.5 rounded font-bold", (t.incidentCount || 0) > 0 ? "bg-red-50 text-red-600" : "bg-black/5")}>
                      {t.incidentCount || 0}
                    </span>
                  } />
                  <MetricRow label="Severity" value={<StatusBadge label={t.severityLevel || 'LOW'} status={getSeverityBadge(t.severityLevel)} />} />
                </div>
              </div>
            ))}
            {trafficData.length === 0 && (
              <div className="card-surface p-10 flex flex-col items-center justify-center text-center opacity-60">
                <Car size={36} className="mb-4 opacity-40" />
                <p className="font-semibold text-sm">No traffic signals available</p>
                <p className="text-xs mt-1">Simulate an event to generate data.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
