interface PageHeaderProps {
  title: string;
  description: string;
  timestamp?: string | null;
}

export function PageHeader({ title, description, timestamp }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>{title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{description}</p>
        </div>
        {timestamp && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-outline)' }}>
            <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: 'var(--color-secondary)' }} />
            <span>Last: {new Date(timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        )}
      </div>
    </div>
  );
}
