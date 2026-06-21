import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import Modal from './Modal';
import { useAppStore } from '@/store';
import type { UsageRecordCreateForm, DyeingProcess, ApiError, AshWaterBatch } from '@/types';

interface UsageRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  batchId: string;
  batch: AshWaterBatch | null;
  remainingVolume?: number;
  totalUsed?: number;
}

export default function UsageRecordModal({ isOpen, onClose, onSuccess, batchId, batch, remainingVolume, totalUsed }: UsageRecordModalProps) {
  const addUsageRecord = useAppStore((state) => state.addUsageRecord);
  const config = useAppStore((state) => state.config);
  const loading = useAppStore((state) => state.loading);

  const [form, setForm] = useState<UsageRecordCreateForm>({
    usageDate: new Date().toISOString().slice(0, 16),
    process: 'dyeing',
    volumeUsed: 0,
    usedBy: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        usageDate: new Date().toISOString().slice(0, 16),
        process: 'dyeing',
        volumeUsed: 0,
        usedBy: '',
        notes: '',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (form.volumeUsed <= 0) {
      newErrors.volumeUsed = '使用量必须大于0';
    }

    if (batch && form.volumeUsed > getRemainingVolume()) {
      newErrors.volumeUsed = `使用量不能超过剩余量 ${getRemainingVolume().toFixed(1)}L`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRemainingVolume = (): number => {
    if (!batch) return 0;
    if (remainingVolume !== undefined) return remainingVolume;
    return batch.waterVolume;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await addUsageRecord(batchId, form);
      onClose();
      onSuccess?.();
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.error || '提交失败，请重试');
    }
  };

  const processes = Object.entries(config?.processNames || {}).map(([key, name]) => ({
    value: key as DyeingProcess,
    label: name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="使用登记">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {submitError}
          </div>
        )}

        {batch && (
          <div className="bg-parchment-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-earth-600">批次编号</span>
              <span className="font-medium text-earth-900">{batch.batchNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-earth-600">总容量</span>
              <span className="font-medium text-earth-900">{batch.waterVolume}L</span>
            </div>
            {totalUsed !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">已使用</span>
                <span className="font-medium text-earth-700">
                  {totalUsed.toFixed(1)}L ({((totalUsed / batch.waterVolume) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-earth-600">剩余量</span>
              <span className="font-medium text-moss-700">{getRemainingVolume().toFixed(1)}L</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-earth-600">当前PH值</span>
              <span className={`font-medium ${batch.currentPh !== null && batch.currentPh >= 8.5 && batch.currentPh <= 12.5 ? 'text-green-600' : 'text-red-600'}`}>
                {batch.currentPh?.toFixed(1) || '未检测'}
              </span>
            </div>
            {!batch.isApplicable && (
              <p className="text-xs text-red-500 mt-2">⚠️ 该批次当前不适用，请先调整PH值</p>
            )}
            {getRemainingVolume() <= 0 && (
              <p className="text-xs text-red-500 mt-2">⚠️ 该批次已用尽，无法继续使用</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">使用日期</label>
            <input
              type="datetime-local"
              value={form.usageDate}
              onChange={(e) => setForm({ ...form, usageDate: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">使用量 (L) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={form.volumeUsed}
              onChange={(e) =>
                setForm({ ...form, volumeUsed: parseFloat(e.target.value) || 0 })
              }
              className={`input ${errors.volumeUsed ? 'input-error' : ''}`}
              placeholder="0.0"
            />
            {errors.volumeUsed && (
              <p className="text-red-500 text-sm mt-1">{errors.volumeUsed}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">染色工序 *</label>
            <select
              value={form.process}
              onChange={(e) => setForm({ ...form, process: e.target.value as DyeingProcess })}
              className="input"
            >
              {processes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">使用人</label>
            <input
              type="text"
              value={form.usedBy}
              onChange={(e) => setForm({ ...form, usedBy: e.target.value })}
              className="input"
              placeholder="请输入使用人姓名"
            />
          </div>
        </div>

        <div>
          <label className="label">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="记录使用时的特殊情况..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-earth-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading || !batch?.isApplicable}
          >
            <Droplets className="w-4 h-4" />
            {loading ? '提交中...' : '确认登记'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
