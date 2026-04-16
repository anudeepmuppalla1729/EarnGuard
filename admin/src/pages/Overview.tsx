import { usePolledData } from '../hooks/useAdminData';
import { 
  Users, CheckCircle, FileText, IndianRupee, TrendingUp, TrendingDown,
  Download, Sliders, AlertCircle, Shield, Zap, Info, Radio
} from 'lucide-react';
import { XAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const SLOW_POLL = 10000; // Metrics - 10s
const RAPID_POLL = 5000; // Signals/Queues - 5s

export function Overview() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  // Split Polling
  const { data: m } = usePolledData<any>('/metrics', SLOW_POLL);
  const { data: health } = usePolledData<any>('/health', RAPID_POLL);
  const { data: disruptions, timestamp: disruptionsTime } = usePolledData<any[]>('/disruptions', RAPID_POLL);
  const { data: pipeline, timestamp: pipelineTime } = usePolledData<any>('/pipeline', SLOW_POLL);
  const { data: signals } = usePolledData<any>('/signals', RAPID_POLL);

  useEffect(() => {
    if (isConfigOpen) {
      apiClient.get('/config').then(res => setConfig(res.data.data));
    }
  }, [isConfigOpen]);

  const handleUpdateConfig = async (key: string, value: number) => {
    setUpdatingKey(key);
    try {
      await apiClient.post('/config', { key, value });
      const res = await apiClient.get('/config');
      setConfig(res.data.data);
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleDownloadReport = async () => {
    const link = document.createElement('a');
    link.href = `${apiClient.defaults.baseURL}/report/download`;
    link.setAttribute('download', 'report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getTimeAgo = (ts: string | null) => {
    if (!ts) return 'Updating...';
    const seconds = Math.floor((new Date().getTime() - new Date(ts).getTime()) / 1000);
    return `${seconds}s ago`;
  };

  const cards = [
    { label: 'Total Workers', val: m?.totalWorkers?.toLocaleString() ?? '...', trend: '+12.5%', isUp: true, icon: <Users size={16} /> },
    { label: 'Active Policies', val: m?.activePolicies?.toLocaleString() ?? '...', trend: '+4.2%', isUp: true, icon: <Shield size={16} /> },
    { label: 'Total Claims', val: m?.totalClaims?.toLocaleString() ?? '...', trend: m?.claimsTrend || '...', isUp: m?.claimsTrend?.startsWith('+'), icon: <FileText size={16} /> },
    { label: 'Total Payout', val: m?.totalPayout != null ? `₹${m.totalPayout.toLocaleString()}` : '...', trend: '+10.3%', isUp: true, icon: <IndianRupee size={16} /> },
  ];

  return (
    <div className="animate-in space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>System Overview</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-outline)' }}>Real-time metrics from the EarnGuard risk engine.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadReport}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-black/10 hover:bg-black/5 transition-colors flex items-center gap-2">
            <Download size={14} /> Download Report
          </button>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            style={{ background: 'var(--color-primary)' }}>
            <Sliders size={14} /> Adjust Thresholds
          </button>
        </div>
      </div>

      {/* Threshold Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card-surface p-8 max-w-2xl w-full shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold">Risk Infrastructure Configuration</h3>
                <p className="text-xs opacity-60">Fine-tune detection sensitivity and system thresholds.</p>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="p-2 hover:bg-black/5 rounded-lg">✕</button>
            </div>

            <div className="space-y-8">
              {config.map((c: any) => (
                <div key={c.key} className="space-y-4 p-4 rounded-2xl bg-black/5">
                  <div className="flex justify-between items-start">
                    <div className="max-w-[70%]">
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">{c.key.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-medium mt-1 leading-relaxed">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold" style={{ color: 'var(--color-primary)' }}>{parseFloat(c.value).toFixed(2)}</p>
                      <p className="text-[9px] font-bold opacity-40 uppercase">Current Value</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold opacity-40">
                      <span>Rec. Min: {c.min_range}</span>
                      <span>Rec. Max: {c.max_range}</span>
                    </div>
                    <input 
                      type="range" 
                      min={c.min_range} 
                      max={c.max_range} 
                      step="0.05"
                      value={c.value}
                      disabled={updatingKey === c.key}
                      onChange={(e) => handleUpdateConfig(c.key, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {(c.key === 'FRAUD_LAS_THRESHOLD' && c.value > 0.7) && (
                    <div className="flex gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 text-[11px] font-semibold">
                      <AlertCircle size={14} />
                      ⚠ Increasing this reduces fraud detection sensitivity
                    </div>
                  )}
                  {(c.key === 'ANOMALY_RISK_THRESHOLD' && c.value < 0.6) && (
                    <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[11px] font-semibold">
                      <AlertCircle size={14} />
                      ⚠ Low threshold will increase system noise and false anomalies
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsConfigOpen(false)}
              className="w-full mt-8 py-4 rounded-xl text-white font-bold tracking-widest uppercase transition-all"
              style={{ background: 'var(--color-primary)' }}>
              Confirm Changes
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl transition-colors" style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                {c.icon}
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${c.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {c.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {c.trend}
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-outline)' }}>{c.label}</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>{c.val}</p>
            
            {/* Background Glow */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          </div>
        ))}
      </div>

      {/* Charts & Sidebar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart: Claims Volume Pipeline */}
          <div className="card-surface p-8 relative">
            <div className="absolute top-8 right-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold opacity-40 uppercase">Sync: {getTimeAgo(pipelineTime)}</span>
            </div>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-lg">Operational Pipeline</h3>
                <p className="text-xs opacity-60">Status flow in the last 7 days</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pending', count: pipeline?.PENDING || 0, color: '#94A3B8' },
                { label: 'Approved', count: pipeline?.APPROVED || 0, color: '#3B82F6' },
                { label: 'Payout Sent', count: pipeline?.PAID || 0, color: '#10B981' },
                { label: 'Rejected', count: pipeline?.REJECTED || 0, color: '#EF4444' }
              ].map(p => (
                <div key={p.label} className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                  <p className="text-[9px] font-bold tracking-widest uppercase opacity-40 mb-1">{p.label}</p>
                  <p className="text-2xl font-bold" style={{ color: p.color }}>{p.count}</p>
                </div>
              ))}
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Pending', val: pipeline?.PENDING || 0 },
                  { name: 'Approved', val: pipeline?.APPROVED || 0 },
                  { name: 'Paid', val: pipeline?.PAID || 0 }
                ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart: Disruptions Map */}
          <div className="card-surface p-8 relative">
             <div className="absolute top-8 right-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-bold opacity-40 uppercase">Sync: {getTimeAgo(disruptionsTime)}</span>
            </div>

            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-bold text-lg">High-Intensity Risk Map</h3>
                <p className="text-xs opacity-60">Real-time zone threats detected</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {(disruptions || []).length > 0 ? disruptions?.map((item: any) => (
                <div key={item.zoneId} className="flex items-center gap-6 group">
                  <div className="w-32">
                    <span className="text-[10px] font-bold tracking-widest block opacity-60 truncate">{item.zoneName}</span>
                    <span className="text-[9px] font-medium opacity-40">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" 
                         style={{ width: `${item.riskScore * 100}%`, background: item.riskScore > 0.7 ? '#EF4444' : 'var(--color-primary)' }} />
                  </div>
                  <div className="text-right w-20">
                    <span className="text-sm font-bold font-mono">{(item.riskScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center opacity-40">
                  <Info className="mx-auto mb-2" size={20} />
                  <p className="text-xs font-medium">No high-intensity threats currently detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Widget */}
        <div className="space-y-8">
          <div className="card-surface p-8" style={{ background: 'var(--color-surface-low)' }}>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> System Health
            </h3>

            <div className="space-y-6">
              {[
                { label: 'CPU LOAD', val: `${Math.round(health?.cpuLoad?.[0] || 24)}%`, bar: health?.cpuLoad?.[0] || 24, color: '#3B82F6' },
                { label: 'MEMORY USAGE', val: health?.memory ? `${((health.memory.total - health.memory.free) / (1024 ** 3)).toFixed(1)}/16GB` : '6.2/16GB', bar: health?.memory?.usedPercent || 38, color: '#4F46E5' },
                { label: 'QUEUE PRESSURE', val: 'Optimal', bar: 20, isSegments: true }
              ].map(h => (
                <div key={h.label} className="p-4 rounded-xl bg-white/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold opacity-60 tracking-widest">{h.label}</span>
                    <span className="text-[10px] font-mono font-bold">{h.val}</span>
                  </div>
                  {h.isSegments ? (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-2 flex-1 rounded-sm" style={{ background: i === 1 ? '#0D9488' : '#F1F5F9' }} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${h.bar}%`, background: h.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-40">Operational Signals</h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold">
                  <Radio size={10} className="animate-pulse" /> LIVE
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ...(disruptions || []).slice(0, 1).map((d: any) => ({
                    icon: <AlertCircle size={14} className="text-orange-500" />,
                    text: `Risk elevated: ${d.zoneName}`,
                    time: getTimeAgo(d.timestamp),
                    highlight: true
                  })),
                  ...(signals?.weather?.condition ? [{
                    icon: <Zap size={14} className="text-blue-600" />,
                    text: `Weather: ${signals.weather.condition} in ${signals.cityId}`,
                    time: 'Just now'
                  }] : []),
                  { icon: <CheckCircle size={14} className="text-teal-600" />, text: `Active Node: ${health?.servers?.[0]?.name || 'Core'}`, time: 'Healthy' }
                ].map((s: any, i) => (
                  <div key={i} className={`flex gap-3 items-start p-2 rounded-xl transition-all ${s.highlight ? 'bg-orange-50/50 border border-orange-100 animate-in pulse-live' : ''}`}>
                    <div className="mt-0.5">{s.icon}</div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-semibold leading-tight truncate">{s.text}</p>
                      <p className="text-[9px] opacity-40 mt-0.5">{s.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Audit CTA */}
          <div className="rounded-2xl p-8 text-white relative overflow-hidden group shadow-xl"
            style={{ background: '#2D2B52' }}>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Risk Audit Due</h3>
              <p className="text-xs opacity-70 mb-6 leading-relaxed">Your monthly infrastructure compliance audit is due in 4 days.</p>
              <button className="w-full py-3 rounded-xl bg-white text-[#2D2B52] text-xs font-bold tracking-widest uppercase transition-transform active:scale-95 group-hover:bg-opacity-90">
                Launch Audit
              </button>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-8 -mb-8 blur-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

