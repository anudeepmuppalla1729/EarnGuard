import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Zap, FileText, ShieldAlert,
  Wallet, Activity, Brain, Users, Radio, HeartPulse, Sliders, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/risk', icon: AlertTriangle, label: 'Risk Monitoring' },
  { to: '/disruptions', icon: Zap, label: 'Disruptions' },
  { to: '/claims', icon: FileText, label: 'Claims' },
  { to: '/fraud', icon: ShieldAlert, label: 'Fraud' },
  { to: '/payouts', icon: Wallet, label: 'Payouts' },
  { to: '/queues', icon: Activity, label: 'Queues' },
  { to: '/ml', icon: Brain, label: 'ML Insights' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/signals', icon: Radio, label: 'Signal Debug' },
  { to: '/health', icon: HeartPulse, label: 'System Health' },
  { to: '/simulate', icon: Sliders, label: 'Simulation' },
];

export function Shell() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('adminToken'); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar — surface_container_highest */}
      <aside className="w-56 flex flex-col" style={{ background: 'var(--color-surface-highest)' }}>
        <div className="px-5 py-5">
          <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            <span style={{ color: 'var(--color-primary)' }}>Earn</span>Guard
            <span className="text-[9px] ml-1.5 px-1.5 py-0.5 rounded-md font-semibold align-middle"
              style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary-container)' }}>
              ADMIN
            </span>
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive ? '' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-card)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                boxShadow: isActive ? '0 1px 3px rgba(25,28,30,0.06)' : 'none',
              })}>
              <Icon size={15} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2">
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-[13px] font-medium transition-colors duration-200"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-high)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content — background */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
