import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Zap, FileText, ShieldAlert,
  Wallet, Activity, Brain, Users, Radio, HeartPulse, Sliders, LogOut,
  Bell, Settings, HelpCircle, User
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
      <aside className="w-60 flex flex-col border-r border-white/5" style={{ background: 'var(--color-surface-highest)' }}>
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: 'var(--color-primary)' }}>
            EarnGuard AI
          </h1>
          <p className="text-[9px] font-bold tracking-[0.2em] opacity-40 uppercase">Core Engine V1.0</p>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive ? 'shadow-sm' : 'hover:bg-white/40'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-card)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              })}>
              <Icon size={16} strokeWidth={2.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-black/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-[12px] font-medium text-black/50 hover:text-red-600 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-black/5" style={{ background: 'var(--color-bg)' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full pulse-live" style={{ background: '#10B981' }} />
              <span className="text-[10px] font-bold tracking-widest text-[#10B981] uppercase">System Status: Healthy</span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-black/40 uppercase">Last Sync: 12:42 PM</span>
          </div>

          <div className="flex items-center gap-5">
            <button className="p-2 rounded-full hover:bg-black/5 text-black/60 transition-colors"><Bell size={18} /></button>
            <button className="p-2 rounded-full hover:bg-black/5 text-black/60 transition-colors"><Settings size={18} /></button>
            <button className="p-2 rounded-full hover:bg-black/5 text-black/60 transition-colors"><HelpCircle size={18} /></button>
            <div className="h-8 w-8 rounded-full bg-black/5 border border-black/10 flex items-center justify-center overflow-hidden ml-2 cursor-pointer transition-transform hover:scale-110">
              <User size={20} className="mt-1" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
