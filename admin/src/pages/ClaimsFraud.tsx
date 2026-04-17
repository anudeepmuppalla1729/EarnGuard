import { PageHeader } from '../components/common/PageHeader';
import { usePolledData, MED_POLL } from '../hooks/useAdminData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Shield, GitCommit } from 'lucide-react';

export function ClaimsFraud() {
  const { data: pipeline, timestamp } = usePolledData<any[]>('/claims/pipeline', MED_POLL);
  const { data: summary, timestamp: st } = usePolledData<any[]>('/claims/summary', MED_POLL);

  const colors: Record<string, string> = {
    APPROVED: '#10B981',
    REJECTED: '#EF4444',
    PENDING: '#F59E0B'
  };

  const chartData = pipeline?.map(p => ({
    name: `${p.claim_type} - ${p.status}`,
    value: p.count,
    fill: colors[p.status] || '#8A2BE2'
  })) || [];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <PageHeader 
        title="Claims & Fraud Pipeline" 
        description="Conversion metrics from trigger to approval"
        timestamp={timestamp || st}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pipeline Visualizer */}
        <div className="glass-panel p-6 border-white/5">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <GitCommit size={24} className="text-brand-500" />
            Decision Distribution
          </h2>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={80}
                   outerRadius={110}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1C1C21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Funnel Stages */}
        <div className="glass-panel p-6 border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield size={24} className="text-brand-500" />
            Stage Breakdown
          </h2>
          <div className="space-y-4">
            {pipeline?.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-dark-800/50 rounded-xl border border-white/5">
                 <div className="flex gap-4 items-center">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[p.status] || '#8A2BE2' }} />
                    <p className="font-medium text-white">{p.claim_type} <span className="text-gray-400 font-normal">→ {p.status}</span></p>
                 </div>
                 <span className="text-2xl font-bold">{p.count}</span>
              </div>
            ))}
            {(!pipeline || pipeline.length === 0) && (
              <div className="text-gray-500 text-center py-4">No payload data collected yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
