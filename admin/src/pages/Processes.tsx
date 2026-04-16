import { PageHeader } from '../components/common/PageHeader';
import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { Cpu, ServerCrash, PlayCircle, Clock } from 'lucide-react';

export function Processes() {
  const { data: queues, timestamp } = usePolledData<any[]>('/queues', FAST_POLL);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <PageHeader 
        title="Background Processes" 
        description="Live diagnostics of BullMQ instances and event pipelines"
        timestamp={timestamp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {queues?.map((q: any) => (
          <div key={q.queueName} className="glass-panel p-6 border-white/5">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu size={20} className="text-brand-500" />
                {q.queueName}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${q.counts.active > 0 ? 'bg-success animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-400 font-mono uppercase">
                  {q.counts.active > 0 ? 'Processing' : 'Idle'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QueueStat title="Waiting" count={q.counts.waiting} icon={<Clock size={16} />} color="text-warning" />
              <QueueStat title="Active" count={q.counts.active} icon={<PlayCircle size={16} />} color="text-blue-400" />
              <QueueStat title="Completed" count={q.counts.completed} icon={<Cpu size={16} />} color="text-success" />
              <QueueStat title="Failed" count={q.counts.failed} icon={<ServerCrash size={16} />} color="text-danger" />
            </div>
          </div>
        ))}

        {(!queues || queues.length === 0) && (
          <div className="text-gray-500 italic p-4">No queue processors detected. Node server might be offline or queues aren't initiated.</div>
        )}
      </div>
    </div>
  );
}

function QueueStat({ title, count, icon, color }: { title: string, count: number, icon: any, color: string }) {
  return (
    <div className="bg-dark-800/50 p-3 rounded-lg border border-white/5 flex flex-col justify-between items-center text-center">
      <p className="text-xs text-gray-400 font-medium mb-2">{title}</p>
      <div className={`flex items-center gap-2 font-bold text-xl ${color}`}>
        {icon}
        <span>{count || 0}</span>
      </div>
    </div>
  );
}
