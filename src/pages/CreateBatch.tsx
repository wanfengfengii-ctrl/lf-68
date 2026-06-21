import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical } from 'lucide-react';
import { useAppStore } from '@/store';
import type { BatchCreateForm, ApiError } from '@/types';

export default function CreateBatch() {
  const navigate = useNavigate();
  const createBatch = useAppStore((state) => state.createBatch);
  const loading = useAppStore((state) => state.loading);

  const [form, setForm] = useState<BatchCreateForm>({
    batchNumber: '',
    rawMaterialSource: '',
    ashWeight: 0,
    waterVolume: 0,
    soakStartDate: new Date().toISOString().slice(0, 16),
    soakDurationHours: 24,
    soakTemperature: 25,
    currentPh: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.batchNumber.trim()) {
      newErrors.batchNumber = '请输入批次编号';
    }

    if (!form.rawMaterialSource.trim()) {
      newErrors.rawMaterialSource = '请输入原料来源';
    }

    if (form.ashWeight <= 0) {
      newErrors.ashWeight = '草木灰重量必须大于0';
    }

    if (form.waterVolume <= 0) {
      newErrors.waterVolume = '水量必须大于0';
    }

    if (form.soakDurationHours <= 0) {
      newErrors.soakDurationHours = '浸泡时间必须大于0小时';
    }

    if (form.currentPh !== undefined && (form.currentPh < 0 || form.currentPh > 14)) {
      newErrors.currentPh = 'PH值必须在0-14之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      const batch = await createBatch(form);
      navigate(`/batch/${batch.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 409) {
        setErrors({ batchNumber: apiError.error });
      } else {
        setSubmitError(apiError.error || '创建失败，请重试');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-serif font-bold">新建草木灰水批次</h1>
          <p className="text-earth-600 mt-1">记录新批次的原料和浸泡信息</p>
        </div>

        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">批次编号 *</label>
              <input
                type="text"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                className={`input ${errors.batchNumber ? 'input-error' : ''}`}
                placeholder="例如：AW-2024-001"
              />
              {errors.batchNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.batchNumber}</p>
              )}
            </div>

            <div>
              <label className="label">原料来源 *</label>
              <input
                type="text"
                value={form.rawMaterialSource}
                onChange={(e) => setForm({ ...form, rawMaterialSource: e.target.value })}
                className={`input ${errors.rawMaterialSource ? 'input-error' : ''}`}
                placeholder="例如：樟树灰烬、稻草灰烬"
              />
              {errors.rawMaterialSource && (
                <p className="text-red-500 text-sm mt-1">{errors.rawMaterialSource}</p>
              )}
            </div>
          </div>

          <div className="vintage-border p-6 bg-parchment-200/30">
            <h3 className="font-serif font-bold text-lg text-earth-900 mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-moss-700" />
              浸泡参数
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">草木灰重量 (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.ashWeight || ''}
                  onChange={(e) =>
                    setForm({ ...form, ashWeight: parseFloat(e.target.value) || 0 })
                  }
                  className={`input ${errors.ashWeight ? 'input-error' : ''}`}
                  placeholder="0.0"
                />
                {errors.ashWeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.ashWeight}</p>
                )}
              </div>

              <div>
                <label className="label">水量 (L) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.waterVolume || ''}
                  onChange={(e) =>
                    setForm({ ...form, waterVolume: parseFloat(e.target.value) || 0 })
                  }
                  className={`input ${errors.waterVolume ? 'input-error' : ''}`}
                  placeholder="0.0"
                />
                {errors.waterVolume && (
                  <p className="text-red-500 text-sm mt-1">{errors.waterVolume}</p>
                )}
              </div>

              <div>
                <label className="label">浸泡温度 (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.soakTemperature || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      soakTemperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="input"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">浸泡开始时间 *</label>
                <input
                  type="datetime-local"
                  value={form.soakStartDate}
                  onChange={(e) => setForm({ ...form, soakStartDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">浸泡时长 (小时) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.soakDurationHours || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      soakDurationHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`input ${errors.soakDurationHours ? 'input-error' : ''}`}
                  placeholder="24"
                />
                {errors.soakDurationHours && (
                  <p className="text-red-500 text-sm mt-1">{errors.soakDurationHours}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="label">初始PH值（可选）</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={form.currentPh ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    currentPh: val ? parseFloat(val) : undefined,
                  });
                }}
                className={`input w-32 ${errors.currentPh ? 'input-error' : ''}`}
                placeholder="0.0"
              />
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.1"
                  value={form.currentPh ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, currentPh: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-earth-500 mt-1">
                  <span>0 酸性</span>
                  <span>7 中性</span>
                  <span>14 碱性</span>
                </div>
              </div>
            </div>
            {errors.currentPh && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPh}</p>
            )}
            <p className="text-xs text-earth-500 mt-2">
              可用PH范围：8.5 - 12.5，超出范围将自动标记为不适用
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-earth-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={loading}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save className="w-4 h-4" />
              {loading ? '创建中...' : '创建批次'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
