import { useState, useEffect } from 'react';
import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiClient } from '../api/client';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = { APPROVED: '#00687a', REJECTED: '#95002b', PENDING: '#D97706' };

export function Claims() {
  const { data: summary, timestamp: st } = usePolledData<any>('/claims/summary', MED_POLL);
  const [claims, setClaims] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, total: 0, limit: 15 });
  const [filters, setFilters] = useState({ status: '', source: '', zoneId: '' });
  const [loading, setLoading] = useState(false);

  const fetchClaims = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filters.status) params.set('status', filters.status);
      if (filters.source) params.set('source', filters.source);
      if (filters.zoneId) params.set('zoneId', filters.zoneId);
      const res = await apiClient.get(`/claims?${params}`);
      setClaims(res.data.data.claims);
      setMeta(res.data.data.meta);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchClaims(); }, []);

  const pieData = summary ? [
    { name: 'Approved', value: summary.approved, fill: STATUS_COLORS.APPROVED },
    { name: 'Rejected', value: summary.rejected, fill: STATUS_COLORS.REJECTED },
    { name: 'Pending', value: summary.pending, fill: STATUS_COLORS.PENDING },
  ].filter(d => d.value > 0) : [];

  const summaryCards = [
    { l: 'Total', v: summary?.total },
    { l: 'Approved', v: summary?.approved, c: STATUS_COLORS.APPROVED },
    { l: 'Rejected', v: summary?.rejected, c: STATUS_COLORS.REJECTED },
    { l: 'Pending', v: summary?.pending, c: STATUS_COLORS.PENDING },
    { l: 'System', v: summary?.systemClaims, c: 'var(--color-primary)' },
    { l: 'Manual', v: summary?.manualClaims, c: 'var(--color-primary-container)' },
  ];

  return (
    <div className="animate-in">
      <PageHeader title="Claims Pipeline" description="Full claim lifecycle view with filters" timestamp={st} />

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {summaryCards.map(s => (
          <div key={s.l} className="card-surface p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{s.l}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.c || 'var(--color-on-surface)' }}>{s.v ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie */}
        <div className="card-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-outline)' }}>Decision Distribution</p>
          <div className="h-48">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-card)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(25,28,30,0.08)', border: 'none', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--color-outline)' }}>No claim data</p>}
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 card-surface p-5 overflow-x-auto">
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select className="rounded-lg px-2.5 py-1.5 text-xs outline-none"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
              value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option><option>APPROVED</option><option>REJECTED</option><option>PENDING</option>
            </select>
            <select className="rounded-lg px-2.5 py-1.5 text-xs outline-none"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
              value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
              <option value="">All Sources</option><option value="SYSTEM">System</option><option value="MANUAL">Manual</option>
            </select>
            <input placeholder="Zone ID" className="rounded-lg px-2.5 py-1.5 text-xs outline-none w-24"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
              value={filters.zoneId} onChange={e => setFilters(f => ({ ...f, zoneId: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && fetchClaims()} />
            <button onClick={() => fetchClaims()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
              Apply
            </button>
          </div>

          <table className="w-full text-xs">
            <thead><tr style={{ color: 'var(--color-outline)' }}>
              <th className="text-left py-2 px-2 font-semibold">ID</th><th className="text-left py-2">Zone</th><th className="text-left py-2">Source</th>
              <th className="text-left py-2">Status</th><th className="text-right py-2">Risk</th><th className="text-right py-2">LAS</th>
              <th className="text-right py-2 px-2">Payout</th><th className="text-right py-2 px-2">Date</th><th className="text-right py-2 px-2">Actions</th>
            </tr></thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-surface-high)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-low)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="py-2.5 px-2 font-mono" style={{ color: 'var(--color-on-surface-variant)' }}>{c.id.slice(0, 8)}</td>
                  <td className="py-2.5" style={{ color: 'var(--color-on-surface)' }}>{c.zone_id}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: c.source === 'SYSTEM' ? 'var(--color-secondary-fixed)' : 'var(--color-primary-fixed)', color: c.source === 'SYSTEM' ? 'var(--color-secondary)' : 'var(--color-primary)' }}>
                      {c.source}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: STATUS_COLORS[c.status] || 'var(--color-on-surface)' }}>{c.status}</td>
                  <td className="py-2.5 text-right font-mono">{(c.risk_score * 100).toFixed(0)}%</td>
                  <td className="py-2.5 text-right font-mono">{c.las_score != null ? c.las_score.toFixed(2) : '—'}</td>
                  <td className="py-2.5 text-right font-mono px-2">₹{c.payout_amount.toFixed(0)}</td>
                  <td className="py-2.5 text-right px-2" style={{ color: 'var(--color-outline)' }}>{new Date(c.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')} IST</td>
                  <td className="py-2.5 text-right px-2 flex justify-end gap-2">
                    {c.status === 'PENDING' ? (
                      <>
                        <button onClick={async () => { await apiClient.post(`/claims/${c.id}/approve`); fetchClaims(meta.page); }}
                          className="px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          style={{ background: '#00687a', color: '#ffffff' }}>Approve</button>
                        <button onClick={async () => { await apiClient.post(`/claims/${c.id}/reject`); fetchClaims(meta.page); }}
                          className="px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          style={{ background: '#95002b', color: '#ffffff' }}>Reject</button>
                      </>
                    ) : <span style={{ color: 'var(--color-outline)' }}>—</span>}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && <tr><td colSpan={9} className="py-10 text-center" style={{ color: 'var(--color-outline)' }}>{loading ? 'Loading…' : 'No claims found'}</td></tr>}
            </tbody>
          </table>

          {meta.total > 0 && (
            <div className="flex justify-between items-center mt-4 text-xs" style={{ color: 'var(--color-outline)' }}>
              <span>Page {meta.page} of {Math.ceil(meta.total / meta.limit)}</span>
              <div className="flex gap-2">
                <button disabled={meta.page <= 1} onClick={() => fetchClaims(meta.page - 1)}
                  className="px-2.5 py-1 rounded-md disabled:opacity-30 transition-colors"
                  style={{ background: 'var(--color-surface-low)' }}>Prev</button>
                <button disabled={meta.page * meta.limit >= meta.total} onClick={() => fetchClaims(meta.page + 1)}
                  className="px-2.5 py-1 rounded-md disabled:opacity-30 transition-colors"
                  style={{ background: 'var(--color-surface-low)' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
