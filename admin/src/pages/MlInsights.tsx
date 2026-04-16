import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { format } from 'date-fns';

export function MlInsights() {
  const { data: metrics, timestamp: mt } = usePolledData<any>('/ml/metrics', MED_POLL);
  const { data: pricing, timestamp: pt } = usePolledData<any[]>('/pricing', MED_POLL);

  return (
    <div className="animate-in">
      <PageHeader title="ML Insights & Pricing" description="Model outputs for underwriting and dynamic pricing" timestamp={mt || pt} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-surface p-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Total Inferences</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>{metrics?.inferenceCount ?? 0}</p>
        </div>
        <div className="card-surface p-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Avg Risk Score</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-secondary)' }}>{metrics?.avgRiskScore ?? 0}</p>
        </div>
        <div className="card-surface p-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Anomaly Rate (Risk &gt; 0.8)</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-tertiary)' }}>{metrics?.anomalyRate ?? 0}%</p>
        </div>
      </div>

      <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-outline)' }}>City Pricing Models</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(pricing || []).map((p: any) => (
          <div key={p.cityId} className="card-surface p-5">
            <div className="flex justify-between items-center mb-4 border-b pb-4" style={{ borderColor: 'var(--color-surface-high)' }}>
              <div>
                <h4 className="font-semibold text-lg" style={{ color: 'var(--color-on-surface)' }}>{p.cityName}</h4>
                <p className="text-xs font-mono" style={{ color: 'var(--color-outline)' }}>{p.cityId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-container)' }}>
                  ₹{(p.basePrice + p.weeklyAdditional).toFixed(0)} <span className="text-xs font-normal" style={{ color: 'var(--color-outline)' }}>/mo</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-outline)' }}>Base Price (XGBoost)</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--color-on-surface)' }}>₹{p.basePrice.toFixed(0)}</p>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>Updated: {p.lastMonthlySync ? new Date(p.lastMonthlySync).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' }) + ' IST' : 'Never'}</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-outline)' }}>Weekly Adjustment (LLM)</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--color-secondary)' }}>+₹{p.weeklyAdditional.toFixed(0)}</p>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>Updated: {p.lastWeeklySync ? new Date(p.lastWeeklySync).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' }) + ' IST' : 'Never'}</p>
              </div>
              
              <div className="p-3 rounded-md text-xs" style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface-variant)' }}>
                <strong className="block mb-1" style={{ color: 'var(--color-on-surface)' }}>LLM Reasoning:</strong>
                {p.weeklyReason || "No context provided by ML engine."}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
