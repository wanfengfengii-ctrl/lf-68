import { useState } from 'react';
import { Filter } from 'lucide-react';
import Modal from './Modal';
import { useAppStore } from '@/store';
import type { FilterRecordCreateForm } from '@/types';
import type { ApiError, AshWaterBatch } from '@/types';

interface FilterRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batch: AshWaterBatch | null;
}

export default function FilterRecordModal({ isOpen, onClose, batchId, batch }: FilterRecordModalProps) {
  const addFilterRecord = useAppStore((state) => state.addFilterRecord);
  const loading = useAppStore((state) => state.loading);

  const [form, setForm] = useState<FilterRecordCreateForm>({
    filterDate: new Date().toISOString().slice(0, 16),
    filterMethod: '纱布过滤',
    filterCount: (batch?.filterCount || 0) + 1,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.filterDate) {
      newErrors.filterDate = '请选择过滤日期';
    }

    if (form.filterCount < 1) {
      newErrors.filterCount = '过滤次数必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await addFilterRecord(batchId, form);
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.error || '提交失败，请重试');
    }
  };

  const filterMethods = ['纱布粗滤', '滤纸精滤', '纱布过滤', '活性炭过滤', '自然沉淀'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="过滤记录">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {submitError}
          </div>
        )}

        {batch && (
          <div className="bg-parchment-200 rounded-lg p-4">
            <p className="text-sm text-earth-600">
              <span className="font-medium">浸泡开始日期：</span>
              {new Date(batch.soakStartDate).toLocaleDateString('zh-CN')}
            </p>
            <p className="text-xs text-earth-500 mt-1">
              过滤日期不能早于浸泡开始日期
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">过滤日期 *</label>
            <input
              type="datetime-local"
              value={form.filterDate}
              onChange={(e) => setForm({ ...form, filterDate: e.target.value })}
              className={`input ${errors.filterDate ? 'input-error' : ''}`}
            />
            {errors.filterDate && (
              <p className="text-red-500 text-sm mt-1">{errors.filterDate}</p>
            )}
          </div>
          <div>
            <label className="label">过滤次数 *</label>
            <input
              type="number"
              min="1"
              value={form.filterCount}
              onChange={(e) =>
                setForm({ ...form, filterCount: parseInt(e.target.value) || 1 })
              }
              className={`input ${errors.filterCount ? 'input-error' : ''}`}
            />
            {errors.filterCount && (
              <p className="text-red-500 text-sm mt-1">{errors.filterCount}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">过滤方式</label>
          <select
            value={form.filterMethod}
            onChange={(e) => setForm({ ...form, filterMethod: e.target.value })}
            className="input"
          >
            {filterMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="记录过滤时的特殊情况..."
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
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            <Filter className="w-4 h-4" />
            {loading ? '提交中...' : '确认过滤'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
