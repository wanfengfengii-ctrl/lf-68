import { Link } from 'react-router-dom';
import { Eye, TrendingUp, Droplets, Calendar, Factory } from 'lucide-react';
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

  return (
    <div className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeIn">
      <div className="card-header flex items-start justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold text-earth-900">{batch.batchNumber}</h3>
          <p className="text-sm text-earth-600">{batch.rawMaterialSource}</p>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <PhIndicator ph={batch.currentPh} size="md" />
          <div className="text-right">
            <p className="text-xs text-earth-500">过滤次数</p>
            <p className="text-2xl font-bold text-earth-800">{batch.filterCount}</p>
          </div>
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
