import { Link } from 'react-router-dom';
import { Eye, TrendingUp, Droplets, Calendar, Factory, AlertTriangle, TrendingDown, Minus } from 'lucide-react';
import type { AshWaterBatch } from '@/types';
import StatusBadge from './StatusBadge';
import PhIndicator from './PhIndicator';
import { formatDate } from '@/lib/api';
import { useAppStore } from '@/store';

interface BatchCardProps {
  batch: AshWaterBatch;
  onDelete?: (id: string) => void;
}

export default function BatchCard({ batch, onDelete }: BatchCardProps) {
  const config = useAppStore((state) => state.config);

  const getApplicableProcessNames = () => {
    if (!config) return [];
    return batch.applicableProcesses.map((p) => config.processNames[p] || p);
  };

  const getTrendIcon = () => {
    switch (batch.phTrend) {
      case 'rising':
        return <TrendingUp className="w-3 h-3" />;
      case 'falling':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendClass = () => {
    switch (batch.phTrend) {
      case 'rising':
        return 'trend-rising';
      case 'falling':
        return 'trend-falling';
      default:
        return 'trend-stable';
    }
  };

  const getWarningLevelClass = () => {
    switch (batch.warningLevel) {
      case 'high':
        return 'border-red-400';
      case 'medium':
        return 'border-yellow-400';
      case 'low':
        return 'border-blue-400';
      default:
        return '';
    }
  };

  return (
    <div className={`card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeIn ${batch.hasWarning ? `border-l-4 ${getWarningLevelClass()}` : ''}`}>
      <div className="card-header flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="text-lg font-serif font-bold text-earth-900">{batch.batchNumber}</h3>
            <p className="text-sm text-earth-600">{batch.rawMaterialSource}</p>
          </div>
          {batch.hasWarning && (
            <AlertTriangle className={`w-5 h-5 ${
              batch.warningLevel === 'high'
                ? 'text-red-500'
                : batch.warningLevel === 'medium'
                ? 'text-yellow-500'
                : 'text-blue-500'
            } animate-pulse-slow`} />
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={batch.status} />
          {batch.usageRestricted && (
            <span className="badge bg-red-200 text-red-800 text-xs">限制使用</span>
          )}
        </div>
      </div>

      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <PhIndicator ph={batch.currentPh} size="md" />
          <div className="text-right">
            <p className="text-xs text-earth-500">过滤次数</p>
            <p className="text-2xl font-bold text-earth-800">{batch.filterCount}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`trend-indicator ${getTrendClass()} text-xs`}>
            {getTrendIcon()}
            {batch.phTrend === 'rising'
              ? 'PH上升'
              : batch.phTrend === 'falling'
              ? 'PH下降'
              : 'PH稳定'}
          </span>
          {batch.consecutiveAbnormalCount > 0 && (
            <span className="badge bg-red-100 text-red-700 text-xs">
              连续异常{batch.consecutiveAbnormalCount}次
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-earth-600">
            <Droplets className="w-4 h-4 text-earth-400" />
            <span>{batch.waterVolume}L</span>
          </div>
          <div className="flex items-center gap-2 text-earth-600">
            <Factory className="w-4 h-4 text-earth-400" />
            <span>{batch.ashWeight}kg 灰</span>
          </div>
          <div className="flex items-center gap-2 text-earth-600">
            <Calendar className="w-4 h-4 text-earth-400" />
            <span>{formatDate(batch.soakStartDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-earth-600">
            <TrendingUp className="w-4 h-4 text-earth-400" />
            <span>{batch.soakDurationHours}h</span>
          </div>
        </div>

        {batch.applicableProcesses.length > 0 && (
          <div className="pt-3 border-t border-earth-200">
            <p className="text-xs text-earth-500 mb-2">适用工序</p>
            <div className="flex flex-wrap gap-2">
              {getApplicableProcessNames().map((name, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-moss-100 text-moss-700 text-xs rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {batch.hasWarning && batch.warningTypes.length > 0 && (
          <div className="pt-3 border-t border-earth-200">
            <p className="text-xs text-earth-500 mb-2">预警提示</p>
            <div className="flex flex-wrap gap-1">
              {batch.warningTypes.slice(0, 3).map((wt) => (
                <span
                  key={wt}
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    batch.warningLevel === 'high'
                      ? 'bg-red-100 text-red-700'
                      : batch.warningLevel === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {config?.warningTypes[wt as keyof typeof config.warningTypes] || wt}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-earth-200">
          <Link
            to={`/batch/${batch.id}`}
            className="btn btn-primary flex-1 text-sm"
          >
            <Eye className="w-4 h-4" />
            详情
          </Link>
          <Link
            to={`/batch/${batch.id}/curve`}
            className="btn btn-outline flex-1 text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            曲线
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(batch.id)}
              className="btn btn-danger text-sm"
              title="删除批次"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
