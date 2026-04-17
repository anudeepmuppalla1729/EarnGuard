import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { format } from 'date-fns';

const LAS_COLORS = { clean: 'var(--color-secondary)', soft_flag: '#D97706', hold: '#EA580C', rejected: 'var(--color-tertiary)' };

export function Fraud() {
  const { data, timestamp } = usePolledData<any>('/fraud', MED_POLL);

  const dist = data?.lasDistribution || { clean: 0, soft_flag: 0, hold: 0, rejected: 0 };
  const chartData = [
    { name: 'Clean (≥0.85)', value: dist.clean, fill: '#00687a' },
    { name: 'Soft Flag', value: dist.soft_flag, fill: '#D97706' },
    { name: 'Hold & Verify', value: dist.hold, fill: '#EA580C' },
    { name: 'Rejected (<0.35)', value: dist.rejected, fill: '#95002b' },
  ];

  return (
    <div className="animate-in">
      <PageHeader title="Fraud Detection" description="LAS (Location Authenticity Score) distribution and flagged claims" timestamp={timestamp} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { l: 'Fraud Rate', v: `${data?.fraudRate ?? 0}%`, c: 'var(--color-tertiary)' },
          { l: 'Flagged Claims', v: data?.flaggedClaims ?? 0, c: '#D97706' },
          { l: 'Hard Rejected', v: dist.rejected, c: 'var(--color-tertiary-container)' },
        ].map(s => (
          <div key={s.l} className="card-surface p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{s.l}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-outline)' }}>LAS Score Distribution</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: '#464555', fontSize: 11 }} width={130} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(25,28,30,0.08)', border: 'none', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-outline)' }}>Recent Flagged Claims</p>
          <div className="space-y-2">
            {(data?.recentFlagged || []).map((c: any) => (
              <div key={c.id} className="flex justify-between items-center p-3 rounded-lg transition-colors"
                style={{ background: 'var(--color-surface-low)' }}>
                <div>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-on-surface-variant)' }}>{c.id.slice(0, 8)}…</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>{c.rejection_reason?.slice(0, 60) || c.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-tertiary)' }}>LAS {c.las_score.toFixed(2)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{new Date(c.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')} IST</p>
                </div>
              </div>
            ))}
            {(!data?.recentFlagged || data.recentFlagged.length === 0) && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-outline)' }}>No flagged claims.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
