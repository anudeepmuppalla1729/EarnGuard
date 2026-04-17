import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Shield } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await apiClient.post('/login', { username, password });
      localStorage.setItem('adminToken', res.data.data.token);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--color-primary-fixed)' }}>
            <Shield size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            <span style={{ color: 'var(--color-primary)' }}>Earn</span>Guard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>Operations Command Center</p>
        </div>

        <form onSubmit={handleLogin} className="card-surface p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--color-primary-dim)'}
              onBlur={e => e.target.style.boxShadow = 'none'}
              placeholder="admin" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--color-primary-dim)'}
              onBlur={e => e.target.style.boxShadow = 'none'}
              placeholder="••••••" />
          </div>
          {error && <p className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))', color: 'var(--color-on-primary)' }}>
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
