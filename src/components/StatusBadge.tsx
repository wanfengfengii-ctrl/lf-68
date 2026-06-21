import type { BatchStatus } from '@/types';
import { useAppStore } from '@/store';

interface StatusBadgeProps {
  status: BatchStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const config = useAppStore((state) => state.config);
  const statusName = config?.statusNames[status] || status;

  const statusIcons: Record<BatchStatus, string> = {
    soaking: '⏳',
    filtering: '🔍',
    available: '✅',
    not_applicable: '⚠️',
    exhausted: '📦',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`badge status-${status} ${sizeClasses[size]} ${className}`}>
      <span className="mr-1">{statusIcons[status]}</span>
      {statusName}
    </span>
  );
}
