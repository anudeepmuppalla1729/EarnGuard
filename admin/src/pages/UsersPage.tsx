import { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { apiClient } from '../api/client';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, total: 0, limit: 15 });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/users?page=${page}&limit=15`);
      setUsers(res.data.data.users);
      setMeta(res.data.data.meta);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="animate-in">
      <PageHeader title="User Directory" description="Platform workers and their active policies" />

      <div className="card-surface p-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--color-outline)' }}>
              <th className="text-left py-2 px-2 font-semibold">Name</th>
              <th className="text-left py-2 font-semibold">Platform</th>
              <th className="text-left py-2 font-semibold">Zone</th>
              <th className="text-center py-2 font-semibold">Policy</th>
              <th className="text-right py-2 font-semibold">Premium</th>
              <th className="text-right py-2 font-semibold">Cov. Multiplier</th>
              <th className="text-right py-2 px-2 font-semibold">Wallet</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="transition-colors border-b" style={{ borderColor: 'var(--color-surface-high)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-low)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="py-3 px-2">
                  <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>{u.name}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>{u.mobile}</p>
                </td>
                <td className="py-3" style={{ color: 'var(--color-on-surface-variant)' }}>{u.platform}</td>
                <td className="py-3">
                  <p style={{ color: 'var(--color-on-surface)' }}>{u.zone_name}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>{u.zone_id}</p>
                </td>
                <td className="py-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: u.policy_status === 'ACTIVE' ? 'var(--color-secondary-fixed)' : 'var(--color-surface-high)', color: u.policy_status === 'ACTIVE' ? 'var(--color-secondary)' : 'var(--color-outline)' }}>
                    {u.policy_status || 'NONE'}
                  </span>
                </td>
                <td className="py-3 text-right font-mono" style={{ color: 'var(--color-on-surface)' }}>{u.premium_amount ? `₹${u.premium_amount.toFixed(0)}` : '—'}</td>
                <td className="py-3 text-right font-mono" style={{ color: 'var(--color-on-surface)' }}>{u.coverage_multiplier ? `${u.coverage_multiplier}x` : '—'}</td>
                <td className="py-3 px-2 text-right font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>₹{u.wallet_balance.toFixed(0)}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} className="py-10 text-center" style={{ color: 'var(--color-outline)' }}>{loading ? 'Loading…' : 'No users found'}</td></tr>}
          </tbody>
        </table>

        {meta.total > 0 && (
          <div className="flex justify-between items-center mt-4 text-xs" style={{ color: 'var(--color-outline)' }}>
            <span>Page {meta.page} of {Math.ceil(meta.total / meta.limit)}</span>
            <div className="flex gap-2">
              <button disabled={meta.page <= 1} onClick={() => fetchUsers(meta.page - 1)}
                className="px-2.5 py-1 rounded-md disabled:opacity-30 transition-colors"
                style={{ background: 'var(--color-surface-low)' }}>Prev</button>
              <button disabled={meta.page * meta.limit >= meta.total} onClick={() => fetchUsers(meta.page + 1)}
                className="px-2.5 py-1 rounded-md disabled:opacity-30 transition-colors"
                style={{ background: 'var(--color-surface-low)' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
