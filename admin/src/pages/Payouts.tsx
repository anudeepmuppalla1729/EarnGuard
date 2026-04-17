import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const ZONE_COLORS = ['#4f46e5', '#3525cd', '#6366f1', '#818cf8', '#a78bfa', '#7c3aed'];

export function Payouts() {
  const { data, timestamp } = usePolledData<any>('/payouts', MED_POLL);
  const zones = data?.payoutPerZone || [];

  return (
    <div className="animate-in">
      <PageHeader title="Payouts" description="Wallet credit distribution and zone-level breakdown" timestamp={timestamp} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { l: 'Total Payouts', v: `₹${(data?.totalPayout || 0).toLocaleString()}`, c: 'var(--color-on-surface)' },
          { l: 'Today', v: `₹${(data?.payoutsToday || 0).toLocaleString()}`, c: 'var(--color-secondary)' },
          { l: 'Avg Payout', v: `₹${(data?.avgPayout || 0).toLocaleString()}`, c: 'var(--color-primary)' },
        ].map(s => (
          <div key={s.l} className="card-surface p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{s.l}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="card-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-outline)' }}>Payouts Per Zone</p>
        {zones.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones}>
                <XAxis dataKey="zoneName" tick={{ fill: '#464555', fontSize: 10 }} />
                <YAxis tick={{ fill: '#464555', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(25,28,30,0.08)', border: 'none', fontSize: '12px' }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {zones.map((_: any, i: number) => <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-center py-12 text-sm" style={{ color: 'var(--color-outline)' }}>No payout data recorded yet.</p>}
      </div>
    </div>
  );
}
