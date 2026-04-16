import { usePolledData, FAST_POLL } from '../hooks/useAdminData';
import { PageHeader } from '../components/common/PageHeader';
import { Activity } from 'lucide-react';

export function Queues() {
  const { data: queues, timestamp } = usePolledData<any[]>('/queues', FAST_POLL);

  return (
    <div className="animate-in">
      <PageHeader title="System Queues" description="Real-time BullMQ worker status" timestamp={timestamp} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(queues || []).map((q: any) => (
          <div key={q.queueName} className="card-surface p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg" style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                <Activity size={18} />
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>{q.queueName}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Waiting</p>
                <p className="text-xl font-mono mt-1" style={{ color: 'var(--color-on-surface)' }}>{q.waiting}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Active</p>
                <p className="text-xl font-mono mt-1" style={{ color: 'var(--color-primary)' }}>{q.active}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Completed</p>
                <p className="text-xl font-mono mt-1" style={{ color: 'var(--color-secondary)' }}>{q.completed}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Failed</p>
                <p className="text-xl font-mono mt-1" style={{ color: 'var(--color-tertiary)' }}>{q.failed}</p>
              </div>
            </div>
          </div>
        ))}
        {(!queues || queues.length === 0) && (
          <p className="col-span-full text-center py-12 text-sm" style={{ color: 'var(--color-outline)' }}>Loading queue statuses…</p>
        )}
      </div>
    </div>
  );
}
