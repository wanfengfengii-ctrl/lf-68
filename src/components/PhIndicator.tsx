import { getPhColor, getPhBgColor } from '@/lib/api';

interface PhIndicatorProps {
  ph: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function PhIndicator({ ph, size = 'md', showLabel = true }: PhIndicatorProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  const bgColor = ph !== null ? getPhBgColor(ph) : 'bg-gray-200';
  const textColor = ph !== null ? getPhColor(ph) : 'text-gray-500';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-md ${bgColor}`}
      >
        <span className={textColor}>{ph !== null ? ph.toFixed(1) : '-'}</span>
      </div>
      {showLabel && (
        <div>
          <p className="text-sm font-medium text-earth-700">PH 值</p>
          <p className={`text-xs ${textColor}`}>
            {ph === null
              ? '未检测'
              : ph < 7
              ? '酸性'
              : ph === 7
              ? '中性'
              : ph < 8.5
              ? '弱碱性'
              : ph < 10
              ? '碱性'
              : '强碱性'}
          </p>
        </div>
      )}
    </div>
  );
}
