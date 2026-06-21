import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import Modal from './Modal';
import { useAppStore } from '@/store';
import type { PhRecordCreateForm } from '@/types';
import type { ApiError } from '@/types';

interface PhRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  batchId: string;
}

export default function PhRecordModal({ isOpen, onClose, onSuccess, batchId }: PhRecordModalProps) {
  const addPhRecord = useAppStore((state) => state.addPhRecord);
  const loading = useAppStore((state) => state.loading);

  const [form, setForm] = useState<PhRecordCreateForm>({
    phValue: 0,
    measuredAt: new Date().toISOString().slice(0, 16),
    measuredBy: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (form.phValue < 0 || form.phValue > 14) {
      newErrors.phValue = 'PH值必须在0-14之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await addPhRecord(batchId, form);
      onClose();
      onSuccess?.();
      setForm({
        phValue: 0,
        measuredAt: new Date().toISOString().slice(0, 16),
        measuredBy: '',
        notes: '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.error || '提交失败，请重试');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="PH值检测记录">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {submitError}
          </div>
        )}

        <div>
          <label className="label">PH值 *</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={form.phValue}
              onChange={(e) => setForm({ ...form, phValue: parseFloat(e.target.value) || 0 })}
              className={`input w-32 ${errors.phValue ? 'input-error' : ''}`}
              placeholder="0.0"
            />
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="14"
                step="0.1"
                value={form.phValue}
                onChange={(e) => setForm({ ...form, phValue: parseFloat(e.target.value) })}
                className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-earth-500 mt-1">
                <span>0 酸性</span>
                <span>7 中性</span>
                <span>14 碱性</span>
              </div>
            </div>
          </div>
          {errors.phValue && <p className="text-red-500 text-sm mt-1">{errors.phValue}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">检测时间</label>
            <input
              type="datetime-local"
              value={form.measuredAt}
              onChange={(e) => setForm({ ...form, measuredAt: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">检测人</label>
            <input
              type="text"
              value={form.measuredBy}
              onChange={(e) => setForm({ ...form, measuredBy: e.target.value })}
              className="input"
              placeholder="请输入检测人姓名"
            />
          </div>
        </div>

        <div>
          <label className="label">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="记录检测时的特殊情况..."
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FlaskConical className="w-4 h-4" />
            {loading ? '提交中...' : '确认检测'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
